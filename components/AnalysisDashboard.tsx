import React, { useState, useMemo } from 'react';
import { PatientProfile, OntologyMapping, PublishConfig } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, ScatterChart, Scatter, ZAxis, AreaChart, Area
} from 'recharts';
import { AlertCircle, CheckCircle, Users, TrendingUp, Sparkles, Send, MessageSquare, Cpu, Scale, Target, LayoutGrid, FileCheck, Activity, Save, Trophy, Share2 } from 'lucide-react';
import { queryAnalysisResults } from '../services/geminiService';
import { PublishDialog } from './PublishDialog';

interface AnalysisDashboardProps {
  patients: PatientProfile[];
  ontology: OntologyMapping;
  experimentName?: string;
  isChampion?: boolean;
  onSaveExperiment?: (name: string, tags: string[]) => void;
  onPublish?: (config: PublishConfig) => void;
}

export const AnalysisDashboard: React.FC<AnalysisDashboardProps> = ({ 
  patients, 
  ontology, 
  experimentName, 
  isChampion, 
  onSaveExperiment, 
  onPublish 
}) => {
  const [activeTab, setActiveTab] = useState<'INSIGHTS' | 'VALIDATION'>('INSIGHTS');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<string | null>(null);
  const [isQuerying, setIsQuerying] = useState(false);
  
  // Experiment State
  const [expName, setExpName] = useState(experimentName || `Analysis - ${new Date().toLocaleTimeString()}`);
  const [isChampionState, setIsChampionState] = useState(isChampion || false);
  const [isSaved, setIsSaved] = useState(!!experimentName);
  const [showPublishDialog, setShowPublishDialog] = useState(false);

  // Filter Data
  const testSet = patients.filter(p => p.split === 'TEST');
  const trainSet = patients.filter(p => p.split === 'TRAIN');

  // Aggregate Data (Global)
  const highRisk = patients.filter(p => p.riskCategory === 'High');
  const mediumRisk = patients.filter(p => p.riskCategory === 'Medium');
  const lowRisk = patients.filter(p => p.riskCategory === 'Low');

  const riskDistribution = [
    { name: 'High Risk', value: highRisk.length, color: '#ef4444' },
    { name: 'Medium Risk', value: mediumRisk.length, color: '#f59e0b' },
    { name: 'Low Risk', value: lowRisk.length, color: '#10b981' },
  ];

  const avgMonthsByRisk = [
    { name: 'High Risk', months: (highRisk.reduce((acc, p) => acc + p.monthsOnCurrentTherapy, 0) / (highRisk.length || 1)).toFixed(1) },
    { name: 'Medium Risk', months: (mediumRisk.reduce((acc, p) => acc + p.monthsOnCurrentTherapy, 0) / (mediumRisk.length || 1)).toFixed(1) },
    { name: 'Low Risk', months: (lowRisk.reduce((acc, p) => acc + p.monthsOnCurrentTherapy, 0) / (lowRisk.length || 1)).toFixed(1) },
  ];

  // Validation Metrics Calculation (Test Set)
  const validationMetrics = useMemo(() => {
    if (testSet.length === 0) return { accuracy: 0, precision: 0, recall: 0, tp: 0, fp: 0, tn: 0, fn: 0 };

    let tp = 0, fp = 0, tn = 0, fn = 0;
    const threshold = 0.5;

    testSet.forEach(p => {
        const predicted = (p.riskScore || 0) > threshold;
        const actual = p.actualOutcome || false;

        if (predicted && actual) tp++;
        if (predicted && !actual) fp++;
        if (!predicted && actual) fn++;
        if (!predicted && !actual) tn++;
    });

    const accuracy = (tp + tn) / testSet.length;
    const precision = tp + fp > 0 ? tp / (tp + fp) : 0;
    const recall = tp + fn > 0 ? tp / (tp + fn) : 0;

    return { accuracy, precision, recall, tp, fp, tn, fn };
  }, [testSet]);

  const handleAskQuestion = async () => {
    if (!question.trim()) return;
    setIsQuerying(true);
    setAnswer(null);
    try {
      const result = await queryAnalysisResults(question, patients, ontology);
      setAnswer(result);
    } catch (e) {
      setAnswer("Failed to get response.");
    } finally {
      setIsQuerying(false);
    }
  };
  
  const handleSave = () => {
      const tags = [];
      if (isChampionState) tags.push('Champion');
      onSaveExperiment?.(expName, tags);
      setIsSaved(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      
      {/* Experiment Controls Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
         <div className="flex-1 w-full md:w-auto">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 block">Experiment Name</label>
            <input 
                type="text" 
                value={expName}
                onChange={(e) => { setExpName(e.target.value); setIsSaved(false); }}
                className="font-bold text-lg text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none w-full transition-all"
            />
         </div>
         
         <div className="flex items-center gap-3">
             <button 
                onClick={() => { setIsChampionState(!isChampionState); setIsSaved(false); }}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border transition-colors ${isChampionState ? 'bg-yellow-50 border-yellow-200 text-yellow-700' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
             >
                <Trophy className={`w-4 h-4 ${isChampionState ? 'fill-yellow-500 text-yellow-500' : ''}`} />
                {isChampionState ? 'Champion Model' : 'Mark as Champion'}
             </button>
             
             <div className="h-8 w-px bg-slate-200 mx-2 hidden md:block"></div>

             <button 
                onClick={handleSave}
                disabled={isSaved}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isSaved ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-slate-800 text-white hover:bg-slate-900 shadow-sm'}`}
             >
                 {isSaved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                 {isSaved ? 'Saved' : 'Save Experiment'}
             </button>

             <button 
                onClick={() => setShowPublishDialog(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg shadow-sm transition-colors"
             >
                 <Share2 className="w-4 h-4" />
                 Publish
             </button>
         </div>
      </div>
      
      <PublishDialog 
        isOpen={showPublishDialog} 
        onClose={() => setShowPublishDialog(false)}
        targetCount={highRisk.length}
        onPublish={(config) => {
            onPublish?.(config);
            setShowPublishDialog(false);
        }}
      />

      {/* Model Info Banner */}
      <div className="bg-slate-800 text-slate-300 px-6 py-3 rounded-xl flex items-center justify-between text-sm shadow-sm">
         <div className="flex items-center gap-6">
             <div className="flex items-center gap-2">
                 <Cpu className="w-4 h-4 text-blue-400" />
                 <span>Engine: <strong className="text-white">Gemini 2.5 Flash</strong></span>
             </div>
             <div className="w-px h-4 bg-slate-600"></div>
             <div className="flex items-center gap-2">
                 <Scale className="w-4 h-4 text-orange-400" />
                 <span>Optimization: <strong className="text-white">Rare Disease / Imbalance Check Active</strong></span>
             </div>
         </div>
         <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs">
                <span className="w-2 h-2 rounded-full bg-blue-500"></span> Train: {trainSet.length}
                <span className="w-2 h-2 rounded-full bg-pink-500"></span> Test: {testSet.length}
            </div>
         </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 border-b border-slate-200">
          <button 
            onClick={() => setActiveTab('INSIGHTS')}
            className={`pb-3 px-2 text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'INSIGHTS' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <LayoutGrid className="w-4 h-4" />
            Cohort Insights
          </button>
          <button 
            onClick={() => setActiveTab('VALIDATION')}
            className={`pb-3 px-2 text-sm font-medium transition-colors flex items-center gap-2 ${activeTab === 'VALIDATION' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <FileCheck className="w-4 h-4" />
            Model Validation
          </button>
      </div>

      {activeTab === 'INSIGHTS' ? (
        <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-left-2">
                <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-500">Total Cohort</span>
                    <Users className="w-5 h-5 text-blue-500" />
                </div>
                <div className="text-2xl font-bold text-slate-800">{patients.length}</div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-500">Likely Transitioners</span>
                    <TrendingUp className="w-5 h-5 text-red-500" />
                </div>
                <div className="text-2xl font-bold text-slate-800">{highRisk.length}</div>
                <div className="text-xs text-red-500 mt-1 font-medium">{((highRisk.length / patients.length) * 100).toFixed(1)}% of cohort</div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-500">Avg Duration (High Risk)</span>
                    <Activity className="w-5 h-5 text-orange-500" />
                </div>
                <div className="text-2xl font-bold text-slate-800">
                    {avgMonthsByRisk[0].months} <span className="text-sm text-slate-400 font-normal">months</span>
                </div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-slate-500">Target</span>
                        <CheckCircle className="w-5 h-5 text-emerald-500" />
                    </div>
                    <div className="text-lg font-bold text-slate-800 truncate" title={ontology.targetLineTransition}>
                        {ontology.targetLineTransition}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2">
                {/* Risk Distribution Chart */}
                <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-800 mb-6">Transition Risk Probability</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                        data={riskDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        >
                        {riskDistribution.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                    </ResponsiveContainer>
                </div>
                </div>

                {/* Therapy Duration vs Risk */}
                <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm">
                <h3 className="text-lg font-semibold text-slate-800 mb-6">Duration vs. Transition Probability</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                            type="number" 
                            dataKey="monthsOnCurrentTherapy" 
                            name="Months on Therapy" 
                            unit="m" 
                            label={{ value: 'Months on Therapy', position: 'bottom', offset: 0 }}
                        />
                        <YAxis 
                            type="number" 
                            dataKey="riskScore" 
                            name="Risk Score" 
                            domain={[0, 1]} 
                            label={{ value: 'Probability', angle: -90, position: 'insideLeft' }}
                        />
                        <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                        <Scatter name="Patients" data={[...patients]} fill="#3b82f6" fillOpacity={0.6} />
                    </ScatterChart>
                    </ResponsiveContainer>
                </div>
                </div>
            </div>
            
             {/* AI Analyst Q&A Section */}
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-xl border border-blue-100 shadow-sm p-6 mt-6">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-white rounded-lg shadow-sm text-blue-600">
                    <Sparkles className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                    <h3 className="text-lg font-semibold text-slate-800">AI Data Analyst</h3>
                    <p className="text-sm text-slate-600 mb-4">
                        Ask questions about the cohort, specific doctors (NPI), or risk factors. 
                        <br/><span className="text-xs text-slate-500 italic">Example: "Which doctor has the most high-risk patients?" or "List the top 3 patients for Dr. Sarah Chen."</span>
                    </p>
                    
                    <div className="relative flex gap-2">
                        <input 
                        type="text" 
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAskQuestion()}
                        placeholder="Ask a question about the results..."
                        className="flex-1 px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none shadow-sm"
                        />
                        <button 
                        onClick={handleAskQuestion}
                        disabled={isQuerying || !question.trim()}
                        className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                        >
                        {isQuerying ? 'Thinking...' : <><Send className="w-4 h-4" /> Ask</>}
                        </button>
                    </div>

                    {answer && (
                        <div className="mt-4 p-4 bg-white rounded-lg border border-slate-200 text-slate-800 text-sm leading-relaxed animate-in fade-in slide-in-from-top-2">
                            <div className="flex items-center gap-2 mb-2 text-blue-600 font-medium">
                            <MessageSquare className="w-4 h-4" />
                            Answer:
                            </div>
                            <div className="prose prose-sm max-w-none">
                                {/* Basic rendering of markdown-like lists */}
                                {answer.split('\n').map((line, i) => (
                                    <p key={i} className={`mb-1 ${line.startsWith('-') || line.startsWith('*') ? 'pl-4' : ''}`}>
                                        {line}
                                    </p>
                                ))}
                            </div>
                        </div>
                    )}
                    </div>
                </div>
            </div>
            
            {/* Detailed Patient Table */}
            <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden mt-6">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-slate-800">Top High-Risk Patients</h3>
                    <span className="text-xs text-slate-500">Sorted by probability desc</span>
                </div>
                <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-100">
                    <tr>
                        <th className="px-6 py-3 font-medium">Patient ID</th>
                        <th className="px-6 py-3 font-medium">Provider (NPI)</th>
                        <th className="px-6 py-3 font-medium">Age/Gender</th>
                        <th className="px-6 py-3 font-medium">Months on Tx</th>
                        <th className="px-6 py-3 font-medium">Current Line</th>
                        <th className="px-6 py-3 font-medium">Transition Prob.</th>
                        <th className="px-6 py-3 font-medium">Status</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                    {/* Fix: Duplicate array using spread syntax before sorting to avoid mutating read-only props */}
                    {[...patients]
                        .sort((a, b) => (b.riskScore || 0) - (a.riskScore || 0))
                        .slice(0, 10)
                        .map((patient) => (
                        <tr key={patient.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-3 font-medium text-slate-900">{patient.id}</td>
                            <td className="px-6 py-3 text-slate-600">
                                <div className="font-medium text-slate-700">{patient.doctorName}</div>
                                <div className="text-xs text-slate-400">{patient.npiId}</div>
                            </td>
                            <td className="px-6 py-3 text-slate-600">{patient.age} / {patient.gender}</td>
                            <td className="px-6 py-3 text-slate-600">{patient.monthsOnCurrentTherapy}</td>
                            <td className="px-6 py-3 text-slate-600">Line {patient.currentTherapyLine}</td>
                            <td className="px-6 py-3 font-semibold text-slate-800">
                                {((patient.riskScore || 0) * 100).toFixed(1)}%
                            </td>
                            <td className="px-6 py-3">
                                <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium
                                    ${patient.riskCategory === 'High' ? 'bg-red-100 text-red-700' : 
                                    patient.riskCategory === 'Medium' ? 'bg-orange-100 text-orange-700' : 
                                    'bg-emerald-100 text-emerald-700'}`}>
                                    {patient.riskCategory}
                                </span>
                            </td>
                        </tr>
                        ))}
                    </tbody>
                </table>
                </div>
            </div>
        </>
      ) : (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-2">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Metric Cards */}
                <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500">Test Set Accuracy</p>
                        <p className="text-3xl font-bold text-slate-800 mt-2">{(validationMetrics.accuracy * 100).toFixed(1)}%</p>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden">
                        <div className="bg-blue-600 h-full rounded-full" style={{ width: `${validationMetrics.accuracy * 100}%` }}></div>
                    </div>
                </div>
                 <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500">Precision</p>
                        <p className="text-3xl font-bold text-slate-800 mt-2">{(validationMetrics.precision * 100).toFixed(1)}%</p>
                    </div>
                     <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden">
                        <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${validationMetrics.precision * 100}%` }}></div>
                    </div>
                </div>
                 <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm flex flex-col justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500">Recall</p>
                        <p className="text-3xl font-bold text-slate-800 mt-2">{(validationMetrics.recall * 100).toFixed(1)}%</p>
                    </div>
                     <div className="w-full bg-slate-100 h-1.5 rounded-full mt-4 overflow-hidden">
                        <div className="bg-pink-600 h-full rounded-full" style={{ width: `${validationMetrics.recall * 100}%` }}></div>
                    </div>
                </div>
             </div>
        </div>
      )}
    </div>
  );
};