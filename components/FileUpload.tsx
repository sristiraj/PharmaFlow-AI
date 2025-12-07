import React, { useState, useRef } from 'react';
import { Upload, FileText, Database, AlertCircle, CheckCircle2 } from 'lucide-react';
import { ColumnKeywords } from '../types';

interface FileUploadProps {
  onDataLoaded: (data: any[]) => void;
  columnKeywords: ColumnKeywords;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onDataLoaded, columnKeywords }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  // Helper to find column index loosely
  const findColumnIndex = (headers: string[], keywords: string[]): number => {
    const lowerHeaders = headers.map(h => h.toLowerCase().trim().replace(/[^a-z0-9]/g, ''));
    
    // 1. Exact match attempt
    for (const keyword of keywords) {
      const idx = lowerHeaders.findIndex(h => h === keyword);
      if (idx !== -1) return idx;
    }
    
    // 2. Starts with match
    for (const keyword of keywords) {
      const idx = lowerHeaders.findIndex(h => h.startsWith(keyword));
      if (idx !== -1) return idx;
    }
    
    // 3. Partial match attempt (includes)
    for (const keyword of keywords) {
      const idx = lowerHeaders.findIndex(h => h.includes(keyword));
      if (idx !== -1) return idx;
    }

    return -1;
  };

  const processFile = (file: File) => {
    setError(null);
    if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
      setError("Invalid file type. Please upload a CSV file containing claims data.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n');
      
      if (lines.length < 2) {
        setError("File appears to be empty or missing headers.");
        return;
      }

      // Pre-process headers to handle potential BOM or weird encoding
      const headerLine = lines[0].replace(/^\uFEFF/, ''); 
      const headers = headerLine.split(',').map(h => h.trim());
      
      // Use dynamic keywords from props
      const idKeywords = columnKeywords.id;
      const dxKeywords = columnKeywords.diagnosis;
      const rxKeywords = columnKeywords.prescription;
      const pxKeywords = columnKeywords.procedure;
      const dateKeywords = columnKeywords.date;

      const idIndex = findColumnIndex(headers, idKeywords);
      const dxIndex = findColumnIndex(headers, dxKeywords);
      
      // Try to find explicit Drug column, otherwise look for Procedure codes (common in oncology Px)
      let rxIndex = findColumnIndex(headers, rxKeywords);
      if (rxIndex === -1) {
        rxIndex = findColumnIndex(headers, pxKeywords);
      }

      const dateIndex = findColumnIndex(headers, dateKeywords);

      const missing = [];
      if (idIndex === -1) missing.push(`Patient ID (keywords: ${idKeywords.slice(0, 3).join(', ')}...)`);
      if (dxIndex === -1) missing.push(`Diagnosis (keywords: ${dxKeywords.slice(0, 3).join(', ')}...)`);
      if (rxIndex === -1) missing.push(`Drug/Procedure (keywords: ${rxKeywords.slice(0, 3).join(', ')}...)`);
      if (dateIndex === -1) missing.push(`Date (keywords: ${dateKeywords.slice(0, 3).join(', ')}...)`);

      if (missing.length > 0) {
        setError(`Mapping Error: Could not identify columns for: \n${missing.join('\n')}. \n\nPlease check Admin Settings for allowed column names.`);
        return;
      }

      // Robust CSV Parse
      const parsedData = lines.slice(1)
        .filter(l => l.trim())
        .map((line, i) => {
          const values = line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^"|"$/g, ''));
          
          const maxIdx = Math.max(idIndex, dxIndex, rxIndex, dateIndex);
          if (values.length <= maxIdx) return null;

          return {
            id: values[idIndex] || `P-${1000 + i}`,
            diagnosisCode: values[dxIndex] || 'Unknown',
            drugId: values[rxIndex] || 'Unknown',
            lastVisitDate: values[dateIndex] || new Date().toISOString(),
            
            // Mocking derived fields for demo purposes 
            age: Math.floor(Math.random() * (85 - 30) + 30),
            gender: Math.random() > 0.5 ? 'F' : 'M',
            currentTherapyLine: Math.random() > 0.7 ? 2 : 1,
            monthsOnCurrentTherapy: Math.floor(Math.random() * 24),
            npiSpecialty: 'Oncology',
            doctorName: 'External Provider',
            npiId: '9999999999'
          };
        })
        .filter(item => item !== null); 

      onDataLoaded(parsedData);
    };
    reader.onerror = () => setError("Failed to read file.");
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const loadSampleData = () => {
    setError(null);
    const doctors = [
      { name: "Dr. Sarah Chen", npi: "1457890123" },
      { name: "Dr. Michael Ross", npi: "1890234567" },
      { name: "Dr. Emily Wei", npi: "1678901234" },
      { name: "Dr. James Wilson", npi: "1234567890" },
      { name: "Dr. Lisa Patel", npi: "1567890123" }
    ];

    const mockData = Array.from({ length: 200 }).map((_, i) => {
      const doc = doctors[Math.floor(Math.random() * doctors.length)];
      const line = Math.random() > 0.8 ? 2 : (Math.random() > 0.9 ? 3 : 1); 
      
      return {
        id: `P-${1000 + i}`,
        age: Math.floor(Math.random() * (85 - 30) + 30),
        gender: Math.random() > 0.5 ? 'F' : 'M',
        diagnosisCode: 'C50.911',
        currentTherapyLine: line,
        monthsOnCurrentTherapy: Math.floor(Math.random() * 24),
        lastVisitDate: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString().split('T')[0],
        npiSpecialty: Math.random() > 0.3 ? 'Oncology' : 'Internal Medicine',
        drugId: Math.random() > 0.5 ? 'Tamoxifen' : 'Letrozole',
        doctorName: doc.name,
        npiId: doc.npi
      };
    });
    onDataLoaded(mockData);
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 animate-in fade-in duration-500">
      <div 
        className={`relative flex flex-col items-center justify-center h-64 border-2 border-dashed rounded-lg transition-colors cursor-pointer
          ${isDragging ? 'border-blue-500 bg-blue-50' : error ? 'border-red-300 bg-red-50' : 'border-slate-300 hover:border-slate-400'}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            accept=".csv"
            onChange={handleFileSelect}
        />
        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
          {error ? (
            <AlertCircle className="w-12 h-12 mb-4 text-red-500" />
          ) : (
            <Upload className={`w-12 h-12 mb-4 ${isDragging ? 'text-blue-500' : 'text-slate-400'}`} />
          )}
          
          <p className="mb-2 text-sm text-slate-500 font-medium">
            {error ? (
               <span className="text-red-600 font-semibold whitespace-pre-wrap">{error}</span>
            ) : (
               <>
                <span className="font-semibold">Click to upload</span> or drag and drop
               </>
            )}
          </p>
          <p className="text-xs text-slate-500">
            Current accepted column headers defined in Admin.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center">
        <div className="h-px bg-slate-200 w-full"></div>
        <span className="px-3 text-sm text-slate-400">OR</span>
        <div className="h-px bg-slate-200 w-full"></div>
      </div>

      <button
        onClick={loadSampleData}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium rounded-lg transition-colors border border-slate-200"
      >
        <Database className="w-4 h-4" />
        Load Sample Breast Cancer Dataset
      </button>
    </div>
  );
};