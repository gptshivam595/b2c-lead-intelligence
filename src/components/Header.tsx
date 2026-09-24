import React from 'react';
import { Sparkles, FileSpreadsheet, Sliders, CheckCircle2, AlertCircle } from 'lucide-react';
import { BusinessContext } from '../types/pipeline.ts';

interface HeaderProps {
  activeContext: BusinessContext | null;
  onOpenContextModal: () => void;
  aiConfigured: boolean;
  hasLeads: boolean;
  onExport: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeContext,
  onOpenContextModal,
  aiConfigured,
  hasLeads,
  onExport,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Value Prop */}
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-slate-900 text-base tracking-tight">
                Skillcase Lead Intelligence
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                v1.1 Enterprise
              </span>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              AI-Powered B2C Lead Qualification, Deterministic Prioritization & Outreach
            </p>
          </div>
        </div>

        {/* Controls & Status */}
        <div className="flex items-center space-x-3">
          {/* Active Context Switcher */}
          <button
            onClick={onOpenContextModal}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden md:inline text-slate-500">Context:</span>
            <span className="font-semibold text-slate-900 truncate max-w-[140px]">
              {activeContext?.name || 'Skillcase EdTech'}
            </span>
          </button>

          {/* AI Status Badge */}
          <div
            className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium border ${
              aiConfigured
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
          >
            {aiConfigured ? (
              <>
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span className="hidden sm:inline">Gemini AI Engine Active</span>
                <span className="sm:hidden">Active</span>
              </>
            ) : (
              <>
                <AlertCircle className="w-3 h-3 text-amber-600" />
                <span>Deterministic Mode</span>
              </>
            )}
          </div>

          {/* Excel Export Action */}
          {hasLeads && (
            <button
              onClick={onExport}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-md text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="font-semibold">Download Final Excel</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
