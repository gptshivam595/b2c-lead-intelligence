import React, { useState } from 'react';
import { X, Check, ShieldAlert, Sparkles, Building } from 'lucide-react';
import { BusinessContext } from '../types/pipeline.ts';

interface ContextModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeContext: BusinessContext | null;
  presets: BusinessContext[];
  onSelectContext: (context: BusinessContext) => void;
}

export const ContextModal: React.FC<ContextModalProps> = ({
  isOpen,
  onClose,
  activeContext,
  presets,
  onSelectContext,
}) => {
  if (!isOpen) return null;

  const [selectedId, setSelectedId] = useState<string>(activeContext?.id || 'skillcase_edtech');

  const handleApply = () => {
    const target = presets.find((p) => p.id === selectedId);
    if (target) {
      onSelectContext(target);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2">
            <Building className="w-5 h-5 text-slate-700" />
            <h3 className="font-semibold text-slate-900 text-base">
              Business Context Configuration
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Select Industry & Product Profile Preset
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {presets.map((preset) => (
                <div
                  key={preset.id}
                  onClick={() => setSelectedId(preset.id)}
                  className={`p-3.5 rounded-lg border text-left cursor-pointer transition-all ${
                    selectedId === preset.id
                      ? 'border-indigo-600 bg-indigo-50/50 ring-2 ring-indigo-600/20'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-slate-900 text-sm">{preset.name}</span>
                    {selectedId === preset.id && (
                      <Check className="w-4 h-4 text-indigo-600" />
                    )}
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2">{preset.value_proposition}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Details of Selected Context */}
          {(() => {
            const current = presets.find((p) => p.id === selectedId) || activeContext;
            if (!current) return null;
            return (
              <div className="border border-slate-200 rounded-lg p-4 space-y-3 bg-slate-50/50 text-xs text-slate-700">
                <div>
                  <span className="font-semibold text-slate-900">Target ICP Persona:</span>{' '}
                  {current.target_icp.target_persona}
                </div>
                <div>
                  <span className="font-semibold text-slate-900">Product Capabilities:</span>
                  <ul className="list-disc pl-5 mt-1 space-y-0.5 text-slate-600">
                    {current.product_capabilities.slice(0, 3).map((c, i) => (
                      <li key={i}>
                        <strong>{c.capability_name}:</strong> {c.solves_need}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-rose-50 border border-rose-200 rounded-md p-2.5 text-rose-800">
                  <div className="flex items-center space-x-1.5 font-semibold text-rose-900 mb-1">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                    <span>Explicit Non-Capabilities (AI Guardrails Enforced)</span>
                  </div>
                  <ul className="list-disc pl-5 space-y-0.5 text-rose-700">
                    {current.explicit_non_capabilities.slice(0, 3).map((nc, idx) => (
                      <li key={idx}>{nc}</li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-3.5 py-2 rounded-md text-xs font-medium text-slate-700 hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            className="px-4 py-2 rounded-md text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white transition-colors"
          >
            Apply Context
          </button>
        </div>
      </div>
    </div>
  );
};
