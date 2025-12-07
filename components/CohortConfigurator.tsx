import React, { useState, useMemo, useEffect } from 'react';
import { Settings, Calendar, Filter, ArrowRight, ShieldCheck, PieChart, AlertTriangle, CheckCircle, Cpu, Scale, Split, BookmarkCheck } from 'lucide-react';
import { OntologyMapping, CohortConfig, PatientProfile, ModelType, ImbalanceStrategy, DiseasePreset } from '../types';
import { ResponsiveContainer, PieChart as RechartsPie, Pie, Cell, Tooltip } from 'recharts';

interface CohortConfiguratorProps {
  ontology: OntologyMapping;
  patients: PatientProfile[];
  onConfigReady: (config: CohortConfig) => void;
  diseasePresets: DiseasePreset[];
}

export const CohortConfigurator: React.FC<CohortConfiguratorProps> = ({ ontology, patients, onConfigReady, diseasePresets }) => {
  const [lookbackMonths, setLookbackMonths] = useState(6);
  const [predictionWindowMonths, setPredictionWindowMonths] = useState(3);
  const [minClaimsCount, setMinClaimsCount] = useState(2);
  const [appliedPreset, setAppliedPreset] = useState<string | null>(null);
  
  // ML Model Settings
  const [modelType, setModelType] = useState<ModelType>('GENAI_REASONING');
  const [imbalanceStrategy, setImbalanceStrategy] = useState<ImbalanceStrategy>('NONE');
  const [trainTestSplit, setTrainTestSplit] = useState(0.2); // 20% default

  // Apply Presets based on Ontology Disease Name
  useEffect(() => {
    if (!diseasePresets || diseasePresets.length === 0) return;

    // Fuzzy find preset
    const preset = diseasePresets.find(p => 
        ontology.diseaseName.toLowerCase().includes(p.diseaseName.toLowerCase()) || 
        p.diseaseName.toLowerCase().includes(ontology.diseaseName.toLowerCase())
    );

    if (preset) {
        setLookbackMonths(preset.defaultLookbackMonths);
        setPredictionWindowMonths(preset.defaultPredictionWindowMonths);
        setMinClaimsCount(preset.defaultMinClaims);
        setAppliedPreset(preset.diseaseName);
    }
  }, [ontology.diseaseName, diseasePresets]);

  // Compute Statistics for Class Imbalance Check
  const stats = useMemo(() => {
    const total = patients.length;
    const line1 = patients.filter(p => p.currentTherapyLine === 1).length;
    const line2 = patients.filter(p => p.currentTherapyLine === 2).length;
    const line3 = patients.filter(p => p.currentTherapyLine >= 3).length;
    
    // Check missing data
    const missingDiagnosis = patients.filter(p => !p.diagnosisCode || p.diagnosisCode === 'Unknown').length;

    // Simple imbalance heuristic
    const ratio = total > 0 ? line1 / total : 0;
    const isImbalanced = ratio < 0.15 || ratio > 0.85;

    return {
      total,
      distribution: [
        { name: '1st Line', value: line1, color: '#3b82f6' },
        { name: '2nd Line', value: line2, color: '#8b5cf6' },
        { name: '3rd Line+', value: line3, color: '#f59e0b' },
      ],
      missingDiagnosis,
      isImbalanced,
      eligibleCount: line1
    };
  }, [patients]);

  // Auto-recommend XGBoost + Class Weights if imbalance is detected
  useEffect(() => {
    if (stats.isImbalanced) {
      setModelType('XGBOOST');
      setImbalanceStrategy('CLASS_WEIGHTS');
    } else {
        if (modelType === 'XGBOOST' && imbalanceStrategy === 'CLASS_WEIGHTS') {
           setModelType('GENAI_REASONING');
           setImbalanceStrategy('NONE');
        }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stats.isImbalanced]);

  const handleSubmit = () => {
    onConfigReady({
      lookbackMonths,
      predictionWindowMonths,
      minClaimsCount,
      modelType,
      imbalanceStrategy,
      trainTestSplit
    });
  };

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
      
      {/* Preset Applied Banner */}
      {appliedPreset && (
         <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 flex items-center justify-between shadow-sm">
             <div className="flex items-center gap-2">
                 <BookmarkCheck className="w-5 h-5 text-purple-600" />
                 <span className="text-sm font-medium text-purple-800">Admin Preset Applied: {appliedPreset}</span>
             </div>
             <button 
                onClick={() => setAppliedPreset(null)} 
                className="text-xs text-purple-500 underline hover:text-purple-700"
             >
                Reset to Default
             </button>
         </div>
      )}

      {/* 1. Data Quality & Imbalance Report */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center gap-3">
          <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
            <PieChart className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Pre-Analysis Data Quality Check</h2>
            <p className="text-xs text-slate-500">Checking for class imbalance and eligible population</p>
          </div>
        </div>
        
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Chart */}
            <div className="h-40 col-span-1">
                <ResponsiveContainer width="100%" height="100%">
                    <RechartsPie>
                        <Pie
                            data={stats.distribution}
                            innerRadius={40}
                            outerRadius={60}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {stats.distribution.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip />
                    </RechartsPie>
                </ResponsiveContainer>
                <p className="text-center text-xs text-slate-400 mt-2">Therapy Line Distribution</p>
            </div>

            {/* Stats */}
            <div className="col-span-2 space-y-4">
                <div className="flex gap-4">
                    <div className="flex-1 p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <p className="text-xs text-slate-500">Total Cohort</p>
                        <p className="text-xl font-bold text-slate-800">{stats.total}</p>
                    </div>
                    <div className="flex-1 p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <p className="text-xs text-slate-500">Eligible (1L)</p>
                        <p className="text-xl font-bold text-blue-600">{stats.eligibleCount}</p>
                    </div>
                    <div className="flex-1 p-3 bg-slate-50 rounded-lg border border-slate-200">
                        <p className="text-xs text-slate-500">Missing Dx</p>
                        <p className="text-xl font-bold text-slate-800">{stats.missingDiagnosis}</p>
                    </div>
                </div>

                {/* Imbalance Alert */}
                {stats.isImbalanced ? (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
                        <div>
                            <p className="text-sm font-semibold text-amber-800">Rare Disease / Class Imbalance Detected</p>
                            <p className="text-xs text-amber-700 mt-1">
                                The cohort is highly skewed ({((stats.eligibleCount / stats.total) * 100).toFixed(1)}% eligible). 
                                Standard models may fail to identify transitioners. <br/>
                                <span className="font-bold">Recommendation:</span> Use Tree-based models (XGBoost) with Class Weighting.
                            </p>
                        </div>
                    </div>
                ) : (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-start gap-3">
                         <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5" />
                         <div>
                            <p className="text-sm font-semibold text-emerald-800">Balanced Cohort</p>
                            <p className="text-xs text-emerald-700 mt-1">
                                Good distribution of therapy lines found. Standard GenAI reasoning is suitable.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* 2. Configuration Form */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center gap-3">
          <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Cohort Definition Parameters</h2>
            <p className="text-xs text-slate-500">Mandatory model inputs for {ontology.diseaseName} classification</p>
          </div>
        </div>

        <div className="p-8 space-y-8">
          
           {/* Model Architecture Section (NEW) */}
           <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <Cpu className="w-4 h-4 text-orange-500" />
              Model Architecture & Strategy
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Algorithm Selection */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-slate-700">Algorithm</label>
                    <div className="grid grid-cols-1 gap-2">
                        <button
                            onClick={() => setModelType('GENAI_REASONING')}
                            className={`px-4 py-3 rounded-lg border text-left transition-all ${
                                modelType === 'GENAI_REASONING' 
                                ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500' 
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                        >
                            <div className="font-semibold text-sm">LLM Reasoning (Zero-shot)</div>
                            <div className="text-xs opacity-70">Best for small, diverse datasets with text notes.</div>
                        </button>
                        <button
                             onClick={() => setModelType('XGBOOST')}
                             className={`px-4 py-3 rounded-lg border text-left transition-all ${
                                modelType === 'XGBOOST' 
                                ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500' 
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                        >
                            <div className="flex items-center gap-2 font-semibold text-sm">
                                XGBoost (Gradient Boosting)
                                {stats.isImbalanced && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">Recommended</span>}
                            </div>
                            <div className="text-xs opacity-70">Tree-based model optimized for structured claims.</div>
                        </button>
                    </div>
                </div>

                {/* Imbalance Handling */}
                <div className={`space-y-2 transition-opacity ${modelType === 'XGBOOST' ? 'opacity-100' : 'opacity-50'}`}>
                    <label className="block text-sm font-medium text-slate-700 flex items-center gap-2">
                        <Scale className="w-4 h-4" />
                        Imbalance Strategy
                    </label>
                    <select 
                        value={imbalanceStrategy}
                        onChange={(e) => setImbalanceStrategy(e.target.value as ImbalanceStrategy)}
                        disabled={modelType !== 'XGBOOST'}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option value="NONE">None (Standard Loss)</option>
                        <option value="CLASS_WEIGHTS">Scale Position Weights (Auto-Tuned)</option>
                        <option value="SMOTE">SMOTE (Synthetic Over-sampling)</option>
                    </select>
                    <p className="text-xs text-slate-500">
                        {imbalanceStrategy === 'CLASS_WEIGHTS' && "Penalizes false negatives heavily. Useful for rare disease detection."}
                        {imbalanceStrategy === 'SMOTE' && "Generates synthetic examples of the minority class to balance training."}
                        {imbalanceStrategy === 'NONE' && "Standard objective function. May bias towards majority class."}
                    </p>
                </div>
            </div>
           </div>

           <div className="h-px bg-slate-100" />

           {/* Validation Split Section (NEW) */}
           <div className="space-y-4">
             <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                <Split className="w-4 h-4 text-pink-500" />
                Validation Strategy
             </h3>
             <div className="space-y-2 max-w-md">
                <label className="block text-sm font-medium text-slate-700 flex justify-between">
                    <span>Test Set Split (Hold-out)</span>
                    <span className="text-blue-600 font-semibold">{(trainTestSplit * 100).toFixed(0)}%</span>
                </label>
                <input 
                    type="range"
                    min="0.1"
                    max="0.5"
                    step="0.05"
                    value={trainTestSplit}
                    onChange={(e) => setTrainTestSplit(parseFloat(e.target.value))}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between text-xs text-slate-400">
                    <span>10%</span>
                    <span>50%</span>
                </div>
                <p className="text-xs text-slate-500">
                    Percentage of data held out for validating model performance accuracy.
                </p>
             </div>
           </div>

           <div className="h-px bg-slate-100" />

          {/* Time Window Section */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-500" />
              Time Horizons
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  Historical Lookback (Months)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={lookbackMonths}
                    onChange={(e) => setLookbackMonths(parseInt(e.target.value) || 0)}
                    className="w-full pl-4 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <span className="absolute right-4 top-2.5 text-sm text-slate-400">Months</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  Prediction Window (Months)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="24"
                    value={predictionWindowMonths}
                    onChange={(e) => setPredictionWindowMonths(parseInt(e.target.value) || 0)}
                    className="w-full pl-4 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                  <span className="absolute right-4 top-2.5 text-sm text-slate-400">Months</span>
                </div>
              </div>
            </div>
          </div>

          <div className="h-px bg-slate-100" />

          {/* Inclusion Criteria */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <Filter className="w-4 h-4 text-emerald-500" />
              Inclusion Criteria
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-700">
                  Minimum Claims Volume
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    value={minClaimsCount}
                    onChange={(e) => setMinClaimsCount(parseInt(e.target.value) || 0)}
                    className="w-full pl-4 pr-12 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                   <span className="absolute right-4 top-2.5 text-sm text-slate-400">Claims</span>
                </div>
              </div>
              
               <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 flex items-start gap-3">
                 <ShieldCheck className="w-5 h-5 text-slate-400 mt-0.5" />
                 <div className="space-y-1">
                   <p className="text-sm font-medium text-slate-700">Standard Exclusion Rules</p>
                   <p className="text-xs text-slate-500">
                     Automatically excludes patients with incomplete enrollment data during the defined lookback period.
                   </p>
                 </div>
               </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              onClick={handleSubmit}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-colors shadow-sm"
            >
              Run Classification Model
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};