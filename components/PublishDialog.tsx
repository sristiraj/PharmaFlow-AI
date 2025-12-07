import React, { useState } from 'react';
import { Cloud, Share2, Server, Download, X, Check } from 'lucide-react';
import { PublishConfig, PublishDestination } from '../types';

interface PublishDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onPublish: (config: PublishConfig) => void;
  targetCount: number;
}

export const PublishDialog: React.FC<PublishDialogProps> = ({ isOpen, onClose, onPublish, targetCount }) => {
  const [destination, setDestination] = useState<PublishDestination>('S3');
  const [path, setPath] = useState('');
  const [format, setFormat] = useState<'CSV' | 'JSON' | 'PARQUET'>('CSV');
  const [isPublishing, setIsPublishing] = useState(false);

  if (!isOpen) return null;

  const handlePublish = () => {
    setIsPublishing(true);
    // Simulate API call
    setTimeout(() => {
        setIsPublishing(false);
        onPublish({ destination, path, format });
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2">
            <Share2 className="w-4 h-4 text-blue-600" />
            Publish Target List
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-100 flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-full text-blue-600">
                    <Check className="w-4 h-4" />
                </div>
                <div>
                    <p className="text-sm font-medium text-slate-900">Ready to Export</p>
                    <p className="text-xs text-slate-600">{targetCount} high-risk patient profiles identified.</p>
                </div>
            </div>

            <div className="space-y-3">
                <label className="text-sm font-medium text-slate-700 block">Destination</label>
                <div className="grid grid-cols-3 gap-3">
                    <button 
                        onClick={() => setDestination('S3')}
                        className={`p-3 rounded-lg border text-center transition-all ${destination === 'S3' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 hover:border-slate-300'}`}
                    >
                        <Server className="w-5 h-5 mx-auto mb-1" />
                        <span className="text-xs font-medium">AWS S3</span>
                    </button>
                    <button 
                         onClick={() => setDestination('GCS')}
                        className={`p-3 rounded-lg border text-center transition-all ${destination === 'GCS' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 hover:border-slate-300'}`}
                    >
                        <Cloud className="w-5 h-5 mx-auto mb-1" />
                         <span className="text-xs font-medium">Google GCS</span>
                    </button>
                    <button 
                         onClick={() => setDestination('SHAREPOINT')}
                        className={`p-3 rounded-lg border text-center transition-all ${destination === 'SHAREPOINT' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 hover:border-slate-300'}`}
                    >
                        <Share2 className="w-5 h-5 mx-auto mb-1" />
                         <span className="text-xs font-medium">SharePoint</span>
                    </button>
                </div>
            </div>

            <div className="space-y-3">
                 <label className="text-sm font-medium text-slate-700 block">
                    {destination === 'SHAREPOINT' ? 'Site URL / Folder Path' : 'Bucket Name / Path'}
                 </label>
                 <input 
                    type="text" 
                    value={path}
                    onChange={(e) => setPath(e.target.value)}
                    placeholder={destination === 'S3' ? 's3://my-pharma-bucket/targets/' : destination === 'GCS' ? 'gs://...' : 'https://company.sharepoint.com/...'}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                 />
            </div>

            <div className="space-y-3">
                 <label className="text-sm font-medium text-slate-700 block">File Format</label>
                 <select 
                    value={format} 
                    onChange={(e) => setFormat(e.target.value as any)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
                 >
                    <option value="CSV">CSV (Comma Separated)</option>
                    <option value="JSON">JSON</option>
                    <option value="PARQUET">Parquet (Compressed)</option>
                 </select>
            </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
            <button 
                onClick={onClose} 
                disabled={isPublishing}
                className="px-4 py-2 text-sm text-slate-600 font-medium hover:text-slate-800"
            >
                Cancel
            </button>
            <button 
                onClick={handlePublish}
                disabled={isPublishing || !path}
                className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
                {isPublishing ? 'Uploading...' : <><Download className="w-4 h-4" /> Publish List</>}
            </button>
        </div>
      </div>
    </div>
  );
};