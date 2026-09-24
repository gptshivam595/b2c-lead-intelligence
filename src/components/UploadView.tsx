import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  Play,
  Layers,
  CheckCircle2,
  AlertCircle,
  FileText,
  Sparkles,
  ArrowRight,
  Database,
} from 'lucide-react';
import { BusinessContext } from '../types/pipeline.ts';

interface UploadViewProps {
  activeContext: BusinessContext | null;
  onRunCleaning: (file?: File) => void;
  onRunFullPipeline: (file?: File) => void;
  isProcessing: boolean;
  processingStep: string;
  onLoadBenchmark: () => void;
  hasLoadedFile: boolean;
  loadedFileName: string | null;
}

export const UploadView: React.FC<UploadViewProps> = ({
  activeContext,
  onRunCleaning,
  onRunFullPipeline,
  isProcessing,
  processingStep,
  onLoadBenchmark,
  hasLoadedFile,
  loadedFileName,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleSelectSample = () => {
    setSelectedFile(null);
    onLoadBenchmark();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-4">
      {/* Value Prop Banner */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Inbound Lead Intelligence & Qualification
        </h1>
        <p className="text-sm text-slate-600 max-w-2xl mx-auto">
          Ingest messy Excel or CSV lead files, deterministically clean and deduplicate contact records,
          classify ICP fit with server-side Gemini, compute normalized commercial priority, and draft
          consultative outreach with multi-layer quality control.
        </p>
      </div>

      {/* Upload & Benchmark Selector Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 space-y-6">
          {/* Drag & Drop Area */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
              isDragOver
                ? 'border-indigo-500 bg-indigo-50/50'
                : selectedFile || hasLoadedFile
                ? 'border-emerald-500 bg-emerald-50/20'
                : 'border-slate-300 hover:border-slate-400 bg-slate-50/50 hover:bg-slate-50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={handleFileChange}
            />

            <div className="flex flex-col items-center justify-center space-y-3">
              <div
                className={`h-12 w-12 rounded-full flex items-center justify-center ${
                  selectedFile || hasLoadedFile
                    ? 'bg-emerald-100 text-emerald-600'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {selectedFile || hasLoadedFile ? (
                  <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
                ) : (
                  <UploadCloud className="w-6 h-6 text-slate-600" />
                )}
              </div>

              {selectedFile ? (
                <div>
                  <p className="text-sm font-semibold text-slate-900">{selectedFile.name}</p>
                  <p className="text-xs text-slate-500">
                    {(selectedFile.size / 1024).toFixed(1)} KB — Ready to process
                  </p>
                </div>
              ) : hasLoadedFile ? (
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {loadedFileName || 'Skillcase 30-Lead Benchmark Dataset Loaded'}
                  </p>
                  <p className="text-xs text-emerald-600 font-medium">
                    30 Diverse Inbound Leads pre-loaded with duplicates, typos & objections
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-medium text-slate-900">
                    <span className="text-indigo-600 font-semibold hover:underline">
                      Click to upload
                    </span>{' '}
                    or drag and drop your spreadsheet
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Supports .xlsx, .xls, and .csv files up to 20MB
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Preset / Benchmark Button */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <div className="flex items-center space-x-2 text-xs text-slate-600">
              <Database className="w-4 h-4 text-slate-400" />
              <span>Don't have a file ready?</span>
            </div>
            <button
              type="button"
              onClick={handleSelectSample}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Load Skillcase 30-Lead Benchmark Dataset</span>
            </button>
          </div>

          {/* Current Target Context Notice */}
          <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200 text-xs text-slate-600 flex items-start space-x-3">
            <div className="h-6 w-6 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 font-bold">
              AI
            </div>
            <div>
              <span className="font-semibold text-slate-900">Active Business Profile: </span>
              <span className="text-slate-800">{activeContext?.name}</span> (
              {activeContext?.industry}) — Target ICP:{' '}
              <span className="italic">{activeContext?.target_icp.target_persona}</span>.
            </div>
          </div>

          {/* Pipeline Execution Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => onRunCleaning(selectedFile || undefined)}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 shadow-2xs transition-all disabled:opacity-50 cursor-pointer"
            >
              <Layers className="w-4 h-4 text-slate-500" />
              <span>Deterministic Cleaning Only (Phases 2 & 3)</span>
            </button>

            <button
              type="button"
              disabled={isProcessing}
              onClick={() => onRunFullPipeline(selectedFile || undefined)}
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs transition-all disabled:opacity-50 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Run Full AI Qualification Pipeline (Phases 1-9)</span>
            </button>
          </div>

          {/* Active Processing Step Progress */}
          {isProcessing && (
            <div className="bg-indigo-50/70 border border-indigo-200 rounded-xl p-4 space-y-2 animate-pulse">
              <div className="flex items-center justify-between text-xs font-semibold text-indigo-900">
                <span className="flex items-center space-x-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
                  <span>Processing Inbound Pipeline...</span>
                </span>
                <span>{processingStep}</span>
              </div>
              <div className="w-full bg-indigo-200 h-1.5 rounded-full overflow-hidden">
                <div className="bg-indigo-600 h-full rounded-full w-3/4 animate-indeterminate" />
              </div>
              <p className="text-2xs text-indigo-700">
                Running row-level fault isolation, deterministic deduplication, Gemini 2.5 structured
                evaluation, and multi-layer QC validation.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
