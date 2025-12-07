import React, { useState } from 'react';
import { Save, Plus, Trash2, Shield, Settings, Database, FileText } from 'lucide-react';
import { GlobalConfig, DiseasePreset, ColumnKeywords } from '../types';

interface AdminPanelProps {
  config: GlobalConfig;
  onSave: (newConfig: GlobalConfig) => void;
  onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ config, onSave, onClose }) => {
  const [localConfig, setLocalConfig] = useState<GlobalConfig>(JSON.parse(JSON.stringify(config)));
  const [activeTab, setActiveTab] = useState<'COLUMNS' | 'PRESETS'>('COLUMNS');
  const [newPreset, setNewPreset] = useState<Partial<DiseasePreset>>({
    defaultLookbackMonths: 12,
    defaultPredictionWindowMonths: 6,
    defaultMinClaims: 2
  });

  const handleKeywordChange = (category: keyof ColumnKeywords, value: string) => {
    const keywords = value.split(',').map(s => s.trim()).filter(s => s.length > 0);
    setLocalConfig(prev => ({
      ...prev,
      columnKeywords: {
        ...prev.columnKeywords,
        [category]: keywords
      }
    }));
  };

  const handleAddPreset = () => {
    if (!newPreset.diseaseName) return;
    setLocalConfig(prev => ({
      ...prev,
      diseasePresets: [...prev.diseasePresets, newPreset as DiseasePreset]
    }));
    setNewPreset({
      diseaseName: '',
      defaultLookbackMonths: 12,
      defaultPredictionWindowMonths: 6,
      defaultMinClaims: 2
    });
  };

  const handleRemovePreset = (index: number) => {
    setLocalConfig(prev => ({
      ...prev,
      diseasePresets: prev.diseasePresets.filter((_, i) => i !== index)
    }));
  };

  const handleSave = () => {
    onSave(localConfig);
    onClose();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-purple-600" />
            Admin Configuration
          </h1>
          <p className="text-slate-500">Manage global settings for data ingestion and disease defaults.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-slate-600 hover:text-slate-900 font-medium"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium flex items-center gap-2 shadow-sm"
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden min-h-[500px]">
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('COLUMNS')}
            className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'COLUMNS' 
                ? 'bg-purple-50 text-purple-700 border-b-2 border-purple-600' 
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Database className="w-4 h-4" />
            CSV Column Mapping
          </button>
          <button
            onClick={() => setActiveTab('PRESETS')}
            className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
              activeTab === 'PRESETS' 
                ? 'bg-purple-50 text-purple-700 border-b-2 border-purple-600' 
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            <Settings className="w-4 h-4" />
            Disease Presets
          </button>
        </div>

        <div className="p-8">
          {activeTab === 'COLUMNS' ? (
            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex items-start gap-3">
                <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h3 className="text-sm font-semibold text-blue-800">Smart Column Recognition</h3>
                  <p className="text-xs text-blue-600 mt-1">
                    Enter comma-separated keywords. The uploader will check CSV headers for these terms (case-insensitive) to automatically map data.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Patient ID Keywords</label>
                  <textarea
                    rows={3}
                    className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                    value={localConfig.columnKeywords.id.join(', ')}
                    onChange={(e) => handleKeywordChange('id', e.target.value)}
                    placeholder="id, patient_id, mrn..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Diagnosis Code Keywords</label>
                  <textarea
                    rows={3}
                    className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                    value={localConfig.columnKeywords.diagnosis.join(', ')}
                    onChange={(e) => handleKeywordChange('diagnosis', e.target.value)}
                    placeholder="dx, icd, diagnosis..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Drug (Rx) Keywords</label>
                  <textarea
                    rows={3}
                    className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                    value={localConfig.columnKeywords.prescription.join(', ')}
                    onChange={(e) => handleKeywordChange('prescription', e.target.value)}
                    placeholder="rx, drug, ndc..."
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Procedure (CPT/Px) Keywords</label>
                  <textarea
                    rows={3}
                    className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                    value={localConfig.columnKeywords.procedure.join(', ')}
                    onChange={(e) => handleKeywordChange('procedure', e.target.value)}
                    placeholder="cpt, hcpcs, procedure..."
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-sm font-medium text-slate-700">Date Keywords</label>
                  <textarea
                    rows={2}
                    className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                    value={localConfig.columnKeywords.date.join(', ')}
                    onChange={(e) => handleKeywordChange('date', e.target.value)}
                    placeholder="date, dos, time..."
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-100 mb-6">
                <h3 className="text-sm font-semibold text-purple-800">Disease-Specific Cohort Defaults</h3>
                <p className="text-xs text-purple-600 mt-1">
                  Define default lookback periods and prediction windows for specific diseases. These will pre-fill the configuration form for users.
                </p>
              </div>

              {/* Add New */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-wrap gap-4 items-end">
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Disease Name (e.g., Breast Cancer)</label>
                  <input 
                    type="text" 
                    className="w-full p-2 border border-slate-300 rounded text-sm"
                    value={newPreset.diseaseName || ''}
                    onChange={(e) => setNewPreset(prev => ({ ...prev, diseaseName: e.target.value }))}
                  />
                </div>
                <div className="w-24">
                   <label className="block text-xs font-medium text-slate-500 mb-1">Lookback (m)</label>
                   <input 
                    type="number" 
                    className="w-full p-2 border border-slate-300 rounded text-sm"
                    value={newPreset.defaultLookbackMonths}
                    onChange={(e) => setNewPreset(prev => ({ ...prev, defaultLookbackMonths: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div className="w-24">
                   <label className="block text-xs font-medium text-slate-500 mb-1">Predict (m)</label>
                   <input 
                    type="number" 
                    className="w-full p-2 border border-slate-300 rounded text-sm"
                    value={newPreset.defaultPredictionWindowMonths}
                    onChange={(e) => setNewPreset(prev => ({ ...prev, defaultPredictionWindowMonths: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div className="w-20">
                   <label className="block text-xs font-medium text-slate-500 mb-1">Min Claims</label>
                   <input 
                    type="number" 
                    className="w-full p-2 border border-slate-300 rounded text-sm"
                    value={newPreset.defaultMinClaims}
                    onChange={(e) => setNewPreset(prev => ({ ...prev, defaultMinClaims: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <button 
                  onClick={handleAddPreset}
                  disabled={!newPreset.diseaseName}
                  className="px-4 py-2 bg-slate-800 text-white rounded text-sm hover:bg-slate-900 disabled:opacity-50 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add
                </button>
              </div>

              {/* List */}
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-100 text-slate-600 font-medium">
                    <tr>
                      <th className="px-4 py-3">Disease</th>
                      <th className="px-4 py-3">Lookback</th>
                      <th className="px-4 py-3">Prediction</th>
                      <th className="px-4 py-3">Min Claims</th>
                      <th className="px-4 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {localConfig.diseasePresets.map((preset, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-medium text-slate-900">{preset.diseaseName}</td>
                        <td className="px-4 py-3 text-slate-600">{preset.defaultLookbackMonths} mo</td>
                        <td className="px-4 py-3 text-slate-600">{preset.defaultPredictionWindowMonths} mo</td>
                        <td className="px-4 py-3 text-slate-600">{preset.defaultMinClaims}</td>
                        <td className="px-4 py-3 text-right">
                          <button 
                            onClick={() => handleRemovePreset(idx)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {localConfig.diseasePresets.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                          No presets defined.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};