/**
 * AI Lead Intelligence — Server-Side Gemini Client
 * Uses the modern @google/genai SDK with designated AI Studio secret resolution.
 */

import { GoogleGenAI } from '@google/genai';
import { resolveGeminiApiKey, isGeminiConfigured } from '../../config/env.ts';

let aiClientInstance: GoogleGenAI | null = null;

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
    });
  }

  return aiClientInstance;
}

export const RECOMMENDED_GEMINI_MODEL = 'gemini-2.5-flash';

/**
 * Executes a Gemini call with exponential backoff and jitter for transient 429/503 errors.
 */
export async function executeGeminiWithRetry<T>(
  operation: (ai: GoogleGenAI) => Promise<T>,
  maxRetries = 3
): Promise<T> {
  const ai = getGeminiClient();
  let delay = 1000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation(ai);
    } catch (error: any) {
      const isRateLimit =
        error?.status === 429 ||
        error?.message?.includes('429') ||
        error?.message?.includes('quota') ||
        error?.message?.includes('rate');
      const isTransient =
        error?.status === 503 ||
        error?.message?.includes('503') ||
        error?.message?.includes('overloaded');

      if ((isRateLimit || isTransient) && attempt < maxRetries) {
        const jitter = Math.random() * 400;
        await new Promise((resolve) => setTimeout(resolve, delay + jitter));
        delay *= 2;
        continue;
      }

      throw error;
    }
  }

  throw new Error('Gemini call failed after retries.');
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
