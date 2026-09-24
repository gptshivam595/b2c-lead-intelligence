/**
 * AI Lead Intelligence — Server-Side Gemini Client
 * Uses the modern @google/genai SDK with designated AI Studio secret resolution.
 */

import { GoogleGenAI } from '@google/genai';
import { resolveGeminiApiKey, isGeminiConfigured } from '../../config/env.ts';

let aiClientInstance: GoogleGenAI | null = null;
let successfulAiCalls = 0;
let failedAiCalls = 0;

export function getGeminiClient(): GoogleGenAI {
  const apiKey = resolveGeminiApiKey();
  if (!apiKey) {
    throw new Error(
      'Gemini API Key is not configured. Please ensure the Google AI Studio secret "skillcase api" or "GEMINI_API_KEY" is set in the server environment.'
    );
  }

  if (!aiClientInstance) {
    aiClientInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  return aiClientInstance;
}

export const RECOMMENDED_GEMINI_MODEL = 'gemini-3.5-flash';
export const CANDIDATE_GEMINI_MODELS = ['gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-3.6-flash'];

export function getAiCallStats() {
  return {
    model: RECOMMENDED_GEMINI_MODEL,
    successfulCalls: successfulAiCalls,
    failedCalls: failedAiCalls,
  };
}

export function resetAiCallStats() {
  successfulAiCalls = 0;
  failedAiCalls = 0;
}

/**
 * Executes a Gemini call with exponential backoff and automatic model fallback for transient 429/503 errors.
 */
export async function executeGeminiWithRetry<T>(
  operation: (ai: GoogleGenAI, model: string) => Promise<T>,
  maxRetries = 2
): Promise<T> {
  const ai = getGeminiClient();
  let lastError: any = null;

  for (const model of CANDIDATE_GEMINI_MODELS) {
    let delay = 1000;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation(ai, model);
        successfulAiCalls++;
        return result;
      } catch (error: any) {
        lastError = error;
        const isRateLimit =
          error?.status === 429 ||
          error?.message?.includes('429') ||
          error?.message?.includes('quota') ||
          error?.message?.includes('rate');
        const isTransient =
          error?.status === 503 ||
          error?.message?.includes('503') ||
          error?.message?.includes('overloaded') ||
          error?.message?.includes('UNAVAILABLE') ||
          error?.message?.includes('high demand');

        if ((isRateLimit || isTransient) && attempt < maxRetries) {
          const jitter = Math.random() * 400;
          await new Promise((resolve) => setTimeout(resolve, delay + jitter));
          delay *= 2;
          continue;
        }

        // Move to next candidate model if current model encounters quota/demand issues
        break;
      }
    }
  }

  failedAiCalls++;
  throw lastError || new Error('Gemini call failed across available models.');
}

export async function checkAiHealth(): Promise<{
  configured: boolean;
  model: string;
  ready: boolean;
  message: string;
}> {
  if (!isGeminiConfigured()) {
    return {
      configured: false,
      model: RECOMMENDED_GEMINI_MODEL,
      ready: false,
      message: 'Server secret "skillcase api" or GEMINI_API_KEY is not configured.',
    };
  }

  return {
    configured: true,
    model: RECOMMENDED_GEMINI_MODEL,
    ready: true,
    message: 'Server-side Gemini AI engine initialized and ready.',
  };
}
