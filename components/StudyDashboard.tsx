import React, { useState } from 'react';
import { Study, Experiment } from '../types';
import { FolderPlus, FileText, Tag, Calendar, Plus, ChevronRight, Trophy, LayoutGrid, FlaskConical, ArrowRight } from 'lucide-react';

interface StudyDashboardProps {
  studies: Study[];
  onSelectStudy: (studyId: string) => void;
  onCreateStudy: (study: Study) => void;
  onNewExperiment: (studyId: string) => void;
  onViewExperiment: (studyId: string, experimentId: string) => void;
}

export const StudyDashboard: React.FC<StudyDashboardProps> = ({ 
  studies, 
  onSelectStudy, 
  onCreateStudy, 
  onNewExperiment,
  onViewExperiment
}) => {
  const [selectedStudyId, setSelectedStudyId] = useState<string | null>(studies.length > 0 ? studies[0].id : null);
  const [isCreating, setIsCreating] = useState(false);
  const [newStudyForm, setNewStudyForm] = useState({ name: '', description: '', tags: '' });

  const activeStudy = studies.find(s => s.id === selectedStudyId);

  const handleCreateSubmit = () => {
    if (!newStudyForm.name) return;
    const newStudy: Study = {
      id: `study-${Date.now()}`,
      name: newStudyForm.name,
      description: newStudyForm.description,
      categoryTags: newStudyForm.tags.split(',').map(t => t.trim()).filter(Boolean),
      experiments: [],
      createdAt: new Date().toISOString()
    };
    onCreateStudy(newStudy);
    setSelectedStudyId(newStudy.id);
    setIsCreating(false);
    setNewStudyForm({ name: '', description: '', tags: '' });
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] animate-in fade-in duration-500">
      {/* Sidebar: Study List */}
      <div className="w-80 border-r border-slate-200 bg-white flex flex-col">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-800 flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-blue-600" />
            Study Hub
          </h2>
          <button 
            onClick={() => setIsCreating(true)}
            className="p-2 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-blue-600 transition-colors"
            title="New Study"
          >
            <FolderPlus className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {isCreating && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 space-y-3 mb-2 animate-in slide-in-from-left-2">
              <input 
                autoFocus
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:border-blue-500"
                placeholder="Study Name"
                value={newStudyForm.name}
                onChange={e => setNewStudyForm({...newStudyForm, name: e.target.value})}
              />
              <input 
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:border-blue-500"
                placeholder="Description"
                value={newStudyForm.description}
                onChange={e => setNewStudyForm({...newStudyForm, description: e.target.value})}
              />
              <input 
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:outline-none focus:border-blue-500"
                placeholder="Tags (comma sep)"
                value={newStudyForm.tags}
                onChange={e => setNewStudyForm({...newStudyForm, tags: e.target.value})}
              />
              <div className="flex justify-end gap-2">
                <button onClick={() => setIsCreating(false)} className="text-xs text-slate-500 hover:text-slate-800">Cancel</button>
                <button 
                  onClick={handleCreateSubmit}
                  disabled={!newStudyForm.name}
                  className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  Create
                </button>
              </div>
            </div>
          )}

          {studies.map(study => (
            <div 
              key={study.id}
              onClick={() => setSelectedStudyId(study.id)}
              className={`p-3 rounded-lg cursor-pointer transition-all border ${
                selectedStudyId === study.id 
                  ? 'bg-white border-blue-500 shadow-sm ring-1 ring-blue-500' 
                  : 'bg-slate-50 border-transparent hover:bg-white hover:border-slate-200 hover:shadow-sm'
              }`}
            >
              <div className="flex justify-between items-start">
                <h3 className={`font-semibold text-sm ${selectedStudyId === study.id ? 'text-blue-700' : 'text-slate-700'}`}>
                  {study.name}
                </h3>
                <span className="text-[10px] text-slate-400">{new Date(study.createdAt).toLocaleDateString()}</span>
              </div>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{study.description || "No description provided."}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {study.categoryTags.map(tag => (
                  <span key={tag} className="px-1.5 py-0.5 bg-slate-200 text-slate-600 text-[10px] rounded">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
          
          {studies.length === 0 && !isCreating && (
            <div className="text-center py-10 px-4 text-slate-400 text-sm">
              No studies found. Create one to begin.
            </div>
          )}
        </div>
      </div>

      {/* Main Content: Experiments */}
      <div className="flex-1 bg-slate-50 p-8 overflow-y-auto">
        {activeStudy ? (
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{activeStudy.name}</h1>
                <p className="text-slate-500 text-sm mt-1">
                  {activeStudy.experiments.length} experiments conducted
                </p>
              </div>
              <button 
                onClick={() => onNewExperiment(activeStudy.id)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium shadow-sm transition-colors"
              >
                <Plus className="w-4 h-4" />
                New Experiment
              </button>
            </div>

            {/* Experiment List */}
            <div className="space-y-4">
              {activeStudy.experiments.length === 0 ? (
                <div className="bg-white border border-slate-200 border-dashed rounded-xl p-12 text-center">
                  <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-500">
                    <FlaskConical className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-medium text-slate-900">No experiments yet</h3>
                  <p className="text-slate-500 mt-2 max-w-md mx-auto">
                    Start a new experiment workflow to ingest data, define cohorts, and run predictive analysis for this study.
                  </p>
                </div>
              ) : (
                activeStudy.experiments.map(exp => (
                  <div key={exp.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:border-blue-300 transition-colors group">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className={`mt-1 p-2 rounded-lg ${exp.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                           <FileText className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-3">
                             <h3 className="font-semibold text-slate-900 text-lg">{exp.name}</h3>
                             {exp.tags.includes('Champion') && (
                               <span className="flex items-center gap-1 px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full border border-yellow-200">
                                 <Trophy className="w-3 h-3" /> Champion
                               </span>
                             )}
                             {exp.tags.filter(t => t !== 'Champion').map(tag => (
                               <span key={tag} className="flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full">
                                 <Tag className="w-3 h-3" /> {tag}
                               </span>
                             ))}
                          </div>
                          
                          <div className="flex items-center gap-6 mt-2 text-sm text-slate-500">
                            <span className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5" />
                              {new Date(exp.timestamp).toLocaleDateString()}
                            </span>
                            <span>
                               Config: <strong>{exp.config.modelType === 'XGBOOST' ? 'XGBoost' : 'GenAI'}</strong>
                            </span>
                            <span>
                               Cohort: <strong>{exp.patientCount}</strong> patients
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                         {exp.metrics && (
                            <div className="text-right mr-4 hidden md:block">
                                <p className="text-xs text-slate-400 uppercase font-semibold">Validation Accuracy</p>
                                <p className="text-xl font-bold text-slate-800">{(exp.metrics.accuracy * 100).toFixed(1)}%</p>
                            </div>
                         )}
                         <button 
                            onClick={() => onViewExperiment(activeStudy.id, exp.id)}
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                         >
                            <ChevronRight className="w-6 h-6" />
                         </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400">
            <LayoutGrid className="w-12 h-12 mb-4 opacity-50" />
            <p>Select a study to view experiments</p>
          </div>
        )}
      </div>
    </div>
  );
};