import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  UploadCloud,
  Layers,
  Table,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle,
} from 'lucide-react';
import {
  BusinessContext,
  CleanedLeadRecord,
  PipelineExecutionSummary,
  ProcessedLead,
} from './types/pipeline.ts';
import { safeFetchJson } from './utils/apiClient.ts';
import { Header } from './components/Header.tsx';
import { ContextModal } from './components/ContextModal.tsx';
import { UploadView } from './components/UploadView.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { LeadTable } from './components/LeadTable.tsx';
import { CleaningQualityView } from './components/CleaningQualityView.tsx';
import { ReviewQueueView } from './components/ReviewQueueView.tsx';
import { ExportView } from './components/ExportView.tsx';
import { LeadDetailDrawer } from './components/LeadDetailDrawer.tsx';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('upload');
  const [activeContext, setActiveContext] = useState<BusinessContext | null>(null);
  const [presets, setPresets] = useState<BusinessContext[]>([]);
  const [isContextModalOpen, setIsContextModalOpen] = useState(false);
  const [aiConfigured, setAiConfigured] = useState(false);

  const [cleanedLeads, setCleanedLeads] = useState<CleanedLeadRecord[]>([]);
  const [processedLeads, setProcessedLeads] = useState<ProcessedLead[]>([]);
  const [executionSummary, setExecutionSummary] = useState<PipelineExecutionSummary | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState('');
  const [selectedLead, setSelectedLead] = useState<ProcessedLead | null>(null);
  const [initialPriorityFilter, setInitialPriorityFilter] = useState('ALL');

  const [hasLoadedBenchmark, setHasLoadedBenchmark] = useState(false);
  const [loadedFileName, setLoadedFileName] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Load initial health & context
  useEffect(() => {
    safeFetchJson('/api/health')
      .then((data) => {
        if (data.success) {
          setAiConfigured(data.data.aiConfigured);
        }
      })
      .catch((e) => console.error('Health check error:', e.message || e));

    safeFetchJson('/api/context')
      .then((data) => {
        if (data.success) {
          setActiveContext(data.data.active);
          setPresets(data.data.presets);
        }
      })
      .catch((e) => console.error('Context fetch error:', e.message || e));
  }, []);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const handleSelectContext = async (context: BusinessContext) => {
    try {
      const data = await safeFetchJson('/api/context', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(context),
      });
      if (data.success) {
        setActiveContext(data.data.active);
        showNotification(`Applied context: ${data.data.active.name}`);
      }
    } catch (e: any) {
      console.error('Error setting context:', e.message || e);
      showNotification('Failed to set context: ' + (e.message || 'Unknown error'));
    }
  };

  const handleLoadBenchmark = () => {
    setHasLoadedBenchmark(true);
    setLoadedFileName('skillcase_b2c_inbound_leads_30.xlsx');
    showNotification('Loaded Skillcase 30-lead benchmark dataset.');
  };

  const handleRunCleaning = async (file?: File) => {
    setIsProcessing(true);
    setProcessingStep('Deterministic Schema Normalization & Deduplication');
    try {
      let json;
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        json = await safeFetchJson('/api/clean', { method: 'POST', body: formData });
      } else {
        json = await safeFetchJson('/api/clean', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName: loadedFileName || 'benchmark.xlsx' }),
        });
      }

      if (json.success) {
        setCleanedLeads(json.data.cleanedLeads);
        setActiveTab('cleaning');
        showNotification('Deterministic cleaning & deduplication complete.');
      }
    } catch (err: any) {
      console.error(err);
      showNotification('Cleaning failed: ' + (err.message || 'Unknown error'));
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  const handleRunFullPipeline = async (file?: File) => {
    setIsProcessing(true);
    setProcessingStep('Ingestion & Schema Invariant Normalization');
    try {
      setTimeout(() => setProcessingStep('Deterministic Fuzzy & Exact Deduplication'), 500);
      setTimeout(() => setProcessingStep('Gemini 2.5 Structured Relevance & ICP Fit Scoring'), 1200);
      setTimeout(() => setProcessingStep('Lead Understanding & Objection Categorization'), 2000);
      setTimeout(() => setProcessingStep('Mathematical Priority Calculation & Drivers'), 2800);
      setTimeout(() => setProcessingStep('Personalized Outreach Copy Generation'), 3500);
      setTimeout(() => setProcessingStep('Multi-Layer QC & Discrepancy Contradiction Audit'), 4200);

      let json;
      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        json = await safeFetchJson('/api/process', { method: 'POST', body: formData });
      } else {
        json = await safeFetchJson('/api/process', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName: loadedFileName || 'skillcase_b2c_inbound_leads_30.xlsx' }),
        });
      }

      if (json.success) {
        setProcessedLeads(json.data.leads);
        setCleanedLeads(json.data.leads.map((l: ProcessedLead) => l.cleaned));
        setExecutionSummary(json.data.summary);
        setActiveTab('dashboard');
        showNotification('Pipeline completed: 30 leads processed & audited.');
      } else {
        showNotification('Pipeline error: ' + (json.error?.message || json.message));
      }
    } catch (err: any) {
      console.error(err);
      showNotification('Pipeline failed: ' + (err.message || 'Unknown error'));
    } finally {
      setIsProcessing(false);
      setProcessingStep('');
    }
  };

  const handleExport = () => {
    window.location.href = '/api/export';
    showNotification('Downloading executive multi-sheet Excel file...');
  };

  const handleOverrideLead = async (
    leadId: string,
    updates: {
      relevance?: boolean;
      priority?: 'High' | 'Medium' | 'Low' | 'EXCLUDED';
      qc_status?: 'passed' | 'flagged_review' | 'rejected';
      notes?: string;
    }
  ) => {
    try {
      const data = await safeFetchJson(`/api/leads/${leadId}/override`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (data.success) {
        setProcessedLeads((prev) =>
          prev.map((l) => (l.lead_id === leadId ? data.data : l))
        );
        if (selectedLead?.lead_id === leadId) {
          setSelectedLead(data.data);
        }
        showNotification(`Lead ${leadId} updated.`);
      }
    } catch (e: any) {
      console.error(e);
      showNotification('Override failed: ' + (e.message || 'Unknown error'));
    }
  };

  const flaggedCount = processedLeads.filter(
    (l) => l.qc_status === 'flagged_review' || l.qc_status === 'rejected' || l.review_required
  ).length;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      {/* Toast notification */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-lg shadow-lg text-xs font-medium flex items-center space-x-2 animate-in fade-in duration-200">
          <CheckCircle className="w-4 h-4 text-emerald-400" />
          <span>{notification}</span>
        </div>
      )}

      {/* Top Header */}
      <Header
        activeContext={activeContext}
        onOpenContextModal={() => setIsContextModalOpen(true)}
        aiConfigured={aiConfigured}
        hasLeads={processedLeads.length > 0}
        onExport={handleExport}
      />

      {/* Context Modal */}
      <ContextModal
        isOpen={isContextModalOpen}
        onClose={() => setIsContextModalOpen(false)}
        activeContext={activeContext}
        presets={presets}
        onSelectContext={handleSelectContext}
      />

      {/* Primary Tab Navigation */}
      <div className="bg-white border-b border-slate-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 sm:space-x-4 overflow-x-auto py-2">
            <button
              onClick={() => setActiveTab('upload')}
              className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                activeTab === 'upload'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload & Ingest</span>
            </button>

            <button
              onClick={() => setActiveTab('dashboard')}
              disabled={!executionSummary}
              className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors disabled:opacity-40 ${
                activeTab === 'dashboard'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dashboard KPIs</span>
            </button>

            <button
              onClick={() => setActiveTab('leads')}
              disabled={processedLeads.length === 0}
              className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors disabled:opacity-40 ${
                activeTab === 'leads'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Table className="w-4 h-4" />
              <span>Master Leads Explorer ({processedLeads.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('cleaning')}
              disabled={cleanedLeads.length === 0}
              className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors disabled:opacity-40 ${
                activeTab === 'cleaning'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Data Cleaning & Quality</span>
            </button>

            <button
              onClick={() => setActiveTab('review')}
              disabled={processedLeads.length === 0}
              className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors disabled:opacity-40 ${
                activeTab === 'review'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <span>SDR Review Queue</span>
              {flaggedCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-2xs font-bold bg-amber-100 text-amber-900">
                  {flaggedCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('export')}
              disabled={processedLeads.length === 0}
              className={`inline-flex items-center space-x-2 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors disabled:opacity-40 ${
                activeTab === 'export'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Excel Export Hub</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'upload' && (
          <UploadView
            activeContext={activeContext}
            onRunCleaning={handleRunCleaning}
            onRunFullPipeline={handleRunFullPipeline}
            isProcessing={isProcessing}
            processingStep={processingStep}
            onLoadBenchmark={handleLoadBenchmark}
            hasLoadedFile={hasLoadedBenchmark}
            loadedFileName={loadedFileName}
          />
        )}

        {activeTab === 'dashboard' && executionSummary && (
          <DashboardView
            summary={executionSummary}
            leads={processedLeads}
            onSelectTab={(tab) => setActiveTab(tab)}
            onFilterPriority={(prio) => setInitialPriorityFilter(prio)}
          />
        )}

        {activeTab === 'leads' && (
          <LeadTable
            leads={processedLeads}
            onSelectLead={(lead) => setSelectedLead(lead)}
            initialPriorityFilter={initialPriorityFilter}
          />
        )}

        {activeTab === 'cleaning' && (
          <CleaningQualityView
            cleanedLeads={cleanedLeads}
            qualitySummary={executionSummary?.quality_summary}
          />
        )}

        {activeTab === 'review' && (
          <ReviewQueueView
            leads={processedLeads}
            onSelectLead={(lead) => setSelectedLead(lead)}
            onApproveLead={(leadId) =>
              handleOverrideLead(leadId, { qc_status: 'passed', notes: 'SDR approved queue item' })
            }
          />
        )}

        {activeTab === 'export' && (
          <ExportView
            summary={executionSummary}
            leads={processedLeads}
            onDownload={handleExport}
          />
        )}
      </main>

      {/* Slide-over Detail Drawer */}
      <LeadDetailDrawer
        lead={selectedLead}
        onClose={() => setSelectedLead(null)}
        onOverride={handleOverrideLead}
      />
    </div>
  );
}

export default App;
