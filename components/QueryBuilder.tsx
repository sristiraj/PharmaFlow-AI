import React, { useState } from 'react';
import { Search, ArrowRight, Loader2, BookOpen, Activity, Pill } from 'lucide-react';
import { parseResearchIntent } from '../services/geminiService';
import { OntologyMapping } from '../types';

interface QueryBuilderProps {
  onAnalysisReady: (mapping: OntologyMapping) => void;
}

export const QueryBuilder: React.FC<QueryBuilderProps> = ({ onAnalysisReady }) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [mapping, setMapping] = useState<OntologyMapping | null>(null);

  const handleAnalyze = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const result = await parseResearchIntent(query);
      setMapping(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (mapping) {
      onAnalysisReady(mapping);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
        <label className="block text-sm font-semibold text-slate-700 mb-2">
          Research Question
        </label>
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. Identify breast cancer patients on Tamoxifen likely to transition to 2nd line therapy"
            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
          />
          <Search className="absolute left-3 top-3.5 text-slate-400 w-5 h-5" />
          <button
            onClick={handleAnalyze}
            disabled={loading || !query.trim()}
            className="absolute right-2 top-2 px-4 py-1.5 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Analyze Intent'}
          </button>
        </div>
      </div>

      {mapping && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-500" />
            Generated Ontology Mapping
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Disease Target</span>
                <p className="text-lg font-medium text-slate-900 mt-1">{mapping.diseaseName}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                    {mapping.icdCodes.map(code => (
                        <span key={code} className="inline-flex items-center px-2 py-1 rounded bg-red-50 text-red-700 text-xs font-medium border border-red-100">
                            {code}
                        </span>
                    ))}
                </div>
              </div>
              
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Target Transition</span>
                <div className="mt-1 flex items-center gap-2 text-slate-900 font-medium">
                    <Activity className="w-4 h-4 text-emerald-500" />
                    {mapping.targetLineTransition}
                </div>
              </div>
            </div>

            <div className="space-y-4">
               <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Associated Drugs (Rx)</span>
                <div className="mt-2 flex flex-wrap gap-2">
                    {mapping.drugs.map(drug => (
                        <span key={drug} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
                            <Pill className="w-3 h-3" />
                            {drug}
                        </span>
                    ))}
                </div>
              </div>

               <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Procedure Codes (CPT)</span>
                <div className="mt-2 flex flex-wrap gap-2">
                    {mapping.cptCodes.map(code => (
                        <span key={code} className="inline-flex items-center px-2 py-1 rounded bg-purple-50 text-purple-700 text-xs font-medium border border-purple-100">
                            {code}
                        </span>
                    ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <button
                onClick={handleConfirm}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
            >
                Proceed to Cohort Configuration
                <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};