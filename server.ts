/**
 * AI Lead Intelligence — Server Entry Point
 * Runs Express on port 3000 with Vite middleware in development.
 * Safely resolves secrets and handles file uploads via Multer.
 */

import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { getSafeSecretStatus } from './server/config/env.ts';
import {
  cleanDatasetHandler,
  exportWorkbookHandler,
  getContextHandler,
  getHealthHandler,
  getLeadByIdHandler,
  getLeadsHandler,
  getResultsHandler,
  getReviewQueueHandler,
  getSampleDatasetHandler,
  overrideLeadHandler,
  processPipelineHandler,
  setContextHandler,
} from './server/controllers/pipelineController.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const port = process.env.PORT || 3000;
  const httpServer = http.createServer(app);

  // JSON & Form body parsers
  app.use(express.json({ limit: '25mb' }));
  app.use(express.urlencoded({ extended: true, limit: '25mb' }));

  // Multer in-memory storage for spreadsheet uploads
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB max
    fileFilter: (_req, file, cb) => {
      const allowedExts = ['.xlsx', '.xls', '.csv'];
      const ext = path.extname(file.originalname).toLowerCase();
      if (allowedExts.includes(ext)) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only .xlsx, .xls, and .csv files are supported.'));
      }
    },
  });

  // ==========================================
  // API ROUTES
  // ==========================================
  const api = express.Router();

  // Health & Status
  api.get('/health', getHealthHandler);
  api.get('/status', getHealthHandler);

  // Business Context Configuration
  api.get('/context', getContextHandler);
  api.post('/context', setContextHandler);

  // Benchmark / Sample Data
  api.get('/sample', getSampleDatasetHandler);

  // Processing & Cleaning
  api.post('/clean', upload.single('file'), cleanDatasetHandler);
  api.post('/process', upload.single('file'), processPipelineHandler);
  api.post('/upload', upload.single('file'), cleanDatasetHandler);

  // Leads & Review
  api.get('/leads', getLeadsHandler);
  api.get('/leads/:id', getLeadByIdHandler);
  api.post('/leads/:id/override', overrideLeadHandler);
  api.get('/results', getResultsHandler);
  api.get('/review-queue', getReviewQueueHandler);

  // Export
  api.get('/export', exportWorkbookHandler);

  // Mount API router
  app.use('/api', api);

  // ==========================================
  // STRICT API 404 HANDLER
  // Guarantees an unhandled /api/* request NEVER falls through to SPA index.html
  // ==========================================
  app.all(['/api', '/api/*'], (req: Request, res: Response) => {
    res.status(404).json({
      error: true,
      message: `Route not found: ${req.method} ${req.originalUrl}`,
      code: 'API_ROUTE_NOT_FOUND',
    });
  });

  // Centralized Error Handler (Ensures all API errors return JSON)
  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    console.error(`[LeadIntelligence Error] ${req.method} ${req.url}:`, err.message);
    res.status(err.status || 500).json({
      error: true,
      message: err.message || 'An unexpected server error occurred.',
      code: err.code || 'INTERNAL_SERVER_ERROR',
    });
  });

  // ==========================================
  // VITE DEV SERVER OR PRODUCTION STATIC
  // SPA Fallback only serves HTML for frontend navigation routes
  // ==========================================
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction) {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === 'true' ? false : { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  httpServer.listen(Number(port), '0.0.0.0', () => {
    const secret = getSafeSecretStatus();
    console.log(`[LeadIntelligence] Server listening on http://0.0.0.0:${port}`);
    console.log(`[LeadIntelligence] Environment: ${isProduction ? 'Production' : 'Development'}`);
    console.log(`[LeadIntelligence] AI Secret Status: ${secret.configured ? `Configured (${secret.source})` : 'Not Configured'}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
