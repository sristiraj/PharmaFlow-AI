import React, { useState } from 'react';
import { AppStep, PatientProfile, OntologyMapping, CohortConfig, GlobalConfig, Study, Experiment, PublishConfig } from './types';
import { FileUpload } from './components/FileUpload';
import { QueryBuilder } from './components/QueryBuilder';
import { CohortConfigurator } from './components/CohortConfigurator';
import { AnalysisDashboard } from './components/AnalysisDashboard';
import { AdminPanel } from './components/AdminPanel';
import { StudyDashboard } from './components/StudyDashboard';
import { classifyPatientRisk } from './services/geminiService';
import { Activity, FileText, LayoutDashboard, BrainCircuit, Settings, Shield, ChevronLeft } from 'lucide-react';

const App: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<AppStep>(AppStep.STUDY_DASHBOARD);
  
  // Data State for Current Flow
  const [patients, setPatients] = useState<PatientProfile[]>([]);
  const [ontology, setOntology] = useState<OntologyMapping | null>(null);
  const [cohortConfig, setCohortConfig] = useState<CohortConfig | null>(null);
  
  // Global Data State
  const [studies, setStudies] = useState<Study[]>([
      {
          id: 'demo-study-1',
          name: 'Breast Cancer Transition Analysis Q1',
          description: 'Analyzing transition probabilities from 1L to 2L therapies for patients on Tamoxifen.',
          categoryTags: ['Oncology', 'Breast Cancer'],
          experiments: [],
          createdAt: new Date().toISOString()
      }
  ]);
  const [currentStudyId, setCurrentStudyId] = useState<string | null>(null);
  
  // Admin Defaults
  const [globalConfig, setGlobalConfig] = useState<GlobalConfig>({
    columnKeywords: {
      id: ['patient', 'member', 'subject', 'bene', 'subscriber', 'mrn', 'id', 'pid', 'pat'],
      diagnosis: ['diagnosis', 'dx', 'icd', 'diag', 'condition', 'problem'],
      prescription: ['drug', 'rx', 'ndc', 'medication', 'product', 'pharmacy'],
      procedure: ['cpt', 'hcpcs', 'procedure', 'proc', 'px', 'service', 'code'],
      date: ['date', 'dos', 'time', 'day', 'dt', 'service', 'admit']
    },
    diseasePresets: [
      { diseaseName: 'Breast Cancer', defaultLookbackMonths: 12, defaultPredictionWindowMonths: 6, defaultMinClaims: 2 },
      { diseaseName: 'Diabetes', defaultLookbackMonths: 24, defaultPredictionWindowMonths: 12, defaultMinClaims: 4 },
      { diseaseName: 'Lung Cancer', defaultLookbackMonths: 6, defaultPredictionWindowMonths: 3, defaultMinClaims: 1 }
    ]
  });

  // --- Handlers ---

  const handleCreateStudy = (newStudy: Study) => {
      setStudies([...studies, newStudy]);
      setCurrentStudyId(newStudy.id);
  };

  const handleNewExperiment = (studyId: string) => {
      setCurrentStudyId(studyId);
      // Reset flow data
      setPatients([]);
      setOntology(null);
      setCohortConfig(null);
      setCurrentStep(AppStep.UPLOAD);
  };

  const handleViewExperiment = (studyId: string, experimentId: string) => {
     setCurrentStudyId(studyId);
     const study = studies.find(s => s.id === studyId);
     const exp = study?.experiments.find(e => e.id === experimentId);
     
     if (exp) {
         // Load experiment data into state (In a real app, this would fetch data based on reference)
         // For now, we only have data if we just ran it, or we rely on the mocked metric view in dashboard.
         // This assumes 'patients' state is not persisted in the 'Experiment' object for this demo to save memory,
         // but normally we would load the dataset here.
         // We will just alert for this demo since we don't store the full patient array in the Experiment type yet.
         alert("Viewing historical experiment details is limited in this demo. Please run a new experiment.");
     }
  };

  const handleDataLoaded = (data: PatientProfile[]) => {
    setPatients(data);
    setCurrentStep(AppStep.QUERY);
  };

  const handleOntologyReady = (mapping: OntologyMapping) => {
    setOntology(mapping);
    setCurrentStep(AppStep.CONFIGURE);
  };

  const handleConfigReady = async (config: CohortConfig) => {
    if (!ontology) return;
    setCohortConfig(config);
    setCurrentStep(AppStep.ANALYSIS);
    
    try {
      const scoredPatients = await classifyPatientRisk(patients, ontology, config);
      setPatients(scoredPatients);
      setCurrentStep(AppStep.RESULTS);
    } catch (error) {
      console.error("Classification failed", error);
    }
  };
  
  const handleSaveExperiment = (name: string, tags: string[]) => {
      if (!currentStudyId || !cohortConfig || !ontology) return;
      
      const newExperiment: Experiment = {
          id: `exp-${Date.now()}`,
          name: name,
          timestamp: new Date().toISOString(),
          tags: tags,
          status: 'COMPLETED',
          ontology: ontology,
          config: cohortConfig,
          patientCount: patients.length,
          metrics: {
              // Calculate simple metrics from the current patients state
              accuracy: 0.85, // Mocked for simplicity or calculate from `patients` test set
              precision: 0.82,
              recall: 0.78,
              highRiskCount: patients.filter(p => p.riskCategory === 'High').length
          }
      };

      setStudies(prevStudies => prevStudies.map(s => {
          if (s.id === currentStudyId) {
              return { ...s, experiments: [newExperiment, ...s.experiments] };
          }
          return s;
      }));
  };

  const handlePublish = (config: PublishConfig) => {
      // In a real app, trigger backend job
      console.log("Publishing to:", config);
      alert(`Successfully published target list to ${config.destination} (${config.path})`);
      
      // Update experiment status if saved
      setStudies(prevStudies => prevStudies.map(s => {
          if (s.id === currentStudyId) {
              return { 
                  ...s, 
                  experiments: s.experiments.map(e => 
                      // Simple logic: if it matches the current context, mark published. 
                      // Ideally we track currentExperimentId.
                      e.name.includes('Analysis') ? { ...e, status: 'PUBLISHED' as const } : e
                  ) 
              };
          }
          return s;
      }));
  };

  const renderStepIndicator = () => {
    if (currentStep === AppStep.ADMIN || currentStep === AppStep.STUDY_DASHBOARD) return null;

    const steps = [
      { id: AppStep.UPLOAD, label: "Data", icon: FileText },
      { id: AppStep.QUERY, label: "Intent", icon: BrainCircuit },
      { id: AppStep.CONFIGURE, label: "Config", icon: Settings },
      { id: AppStep.RESULTS, label: "Insights", icon: LayoutDashboard },
    ];

    return (
      <div className="flex items-center justify-center space-x-4 mb-10">
        <button 
            onClick={() => setCurrentStep(AppStep.STUDY_DASHBOARD)}
            className="absolute left-6 flex items-center gap-1 text-slate-500 hover:text-blue-600 text-sm font-medium"
        >
            <ChevronLeft className="w-4 h-4" />
            Back to Dashboard
        </button>

        {steps.map((step, index) => {
          const isActive = currentStep === step.id;
          const isPast = steps.findIndex(s => s.id === currentStep) > index;
          const Icon = step.icon;

          return (
            <div key={step.id} className="flex items-center">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all
                ${isActive ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 
                  isPast ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-white text-slate-400 border-slate-200'}
              `}>
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{step.label}</span>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-12 h-0.5 mx-2 ${isPast ? 'bg-blue-200' : 'bg-slate-200'}`} />
              )}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentStep(AppStep.STUDY_DASHBOARD)}>
            <div className="p-2 bg-blue-600 rounded-lg">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-cyan-600">
              PharmaFlow AI
            </span>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-sm text-slate-500 hidden md:block">
              Claims Intelligence & Therapy Transition
            </div>
            {currentStep !== AppStep.ADMIN && (
              <button 
                onClick={() => setCurrentStep(AppStep.ADMIN)}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
              >
                <Shield className="w-3 h-3" />
                Admin
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-10">
        {renderStepIndicator()}

        <div className="transition-all duration-500">
          
          {/* Admin View */}
          {currentStep === AppStep.ADMIN && (
             <AdminPanel 
               config={globalConfig} 
               onSave={(newConfig) => setGlobalConfig(newConfig)}
               onClose={() => setCurrentStep(AppStep.STUDY_DASHBOARD)}
             />
          )}

          {/* Study Dashboard (Home) */}
          {currentStep === AppStep.STUDY_DASHBOARD && (
             <StudyDashboard 
                studies={studies}
                onSelectStudy={setCurrentStudyId}
                onCreateStudy={handleCreateStudy}
                onNewExperiment={handleNewExperiment}
                onViewExperiment={handleViewExperiment}
             />
          )}

          {/* Flow Steps */}
          {currentStep === AppStep.UPLOAD && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-slate-900 mb-3">Upload Claims Data</h1>
                <p className="text-slate-500 max-w-xl mx-auto">
                  Import your Rx, Px, and Dx claims datasets. We support standard CSV formats with NPI and patient demographic indicators.
                </p>
              </div>
              <FileUpload 
                onDataLoaded={handleDataLoaded} 
                columnKeywords={globalConfig.columnKeywords} 
              />
            </div>
          )}

          {currentStep === AppStep.QUERY && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-slate-900 mb-3">Define Analysis Scope</h1>
                <p className="text-slate-500 max-w-xl mx-auto">
                  Describe your cohort and target transition. Our AI maps your intent to standardized ICD-10 and CPT ontologies.
                </p>
              </div>
              <QueryBuilder onAnalysisReady={handleOntologyReady} />
            </div>
          )}

          {currentStep === AppStep.CONFIGURE && ontology && (
             <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
               <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-slate-900 mb-3">Configure Cohort Model</h1>
                <p className="text-slate-500 max-w-xl mx-auto">
                  Define mandatory inputs and check cohort distribution for class imbalance before running the model.
                </p>
              </div>
              <CohortConfigurator 
                ontology={ontology} 
                onConfigReady={handleConfigReady} 
                patients={patients}
                diseasePresets={globalConfig.diseasePresets} 
              />
             </div>
          )}

          {currentStep === AppStep.ANALYSIS && (
            <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-500">
               <div className="relative">
                 <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                 <div className="absolute inset-0 flex items-center justify-center">
                    <BrainCircuit className="w-6 h-6 text-blue-600" />
                 </div>
               </div>
               <h2 className="mt-6 text-xl font-semibold text-slate-800">Processing Cohort</h2>
               <p className="mt-2 text-slate-500">Running binary classification models on {patients.length} patient profiles...</p>
            </div>
          )}

          {currentStep === AppStep.RESULTS && ontology && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">Analysis Results</h1>
                  <p className="text-slate-500 mt-1">
                    Predictive modeling for <span className="font-semibold text-blue-600">{ontology.diseaseName}</span> transition to <span className="font-semibold text-emerald-600">{ontology.targetLineTransition}</span>
                  </p>
                </div>
              </div>
              <AnalysisDashboard 
                patients={patients} 
                ontology={ontology} 
                onSaveExperiment={handleSaveExperiment}
                onPublish={handlePublish}
              />
            </div>
          )}
        </div>
      </main>

       {/* Footer */}
       <footer className="bg-white border-t border-slate-200 mt-auto">
        <div className="max-w-7xl mx-auto px-6 py-6 flex justify-between items-center text-xs text-slate-400">
            <p>© 2024 PharmaFlow AI. Powered by Google Gemini.</p>
            <p>HIPAA Compliance Disclaimer: Demo Data Only</p>
        </div>
       </footer>
    </div>
  );
};

export default App;