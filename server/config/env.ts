/**
 * AI Lead Intelligence — Server-Side Environment & Secret Resolution
 * Never exposes the API key to the browser or logs.
 */

export function resolveGeminiApiKey(): string {
  // Check designated AI Studio secret names in order of priority:
  // 1. Secret named 'skillcase api' (bracket notation for spaces)
  // 2. SKILLCASE_API
  // 3. GEMINI_API_KEY
  const apiKey =
    process.env['skillcase api'] ||
    process.env.SKILLCASE_API ||
    process.env.GEMINI_API_KEY ||
    '';

  return apiKey.trim();
}

export function isGeminiConfigured(): boolean {
  return resolveGeminiApiKey().length > 0;
}

export function getSafeSecretStatus(): {
  configured: boolean;
  source: string;
  keyPrefix?: string;
} {
  const key = resolveGeminiApiKey();
  if (!key) {
    return {
      configured: false,
      source: 'none',
    };
  }

  let source = 'GEMINI_API_KEY';
  if (process.env['skillcase api']) {
    source = 'skillcase api (secret)';
  } else if (process.env.SKILLCASE_API) {
    source = 'SKILLCASE_API';
  }

  // Safe prefix representation without revealing actual secret
  const keyPrefix = key.length > 6 ? `${key.substring(0, 4)}...${key.substring(key.length - 2)}` : 'configured';

  return {
    configured: true,
    source,
    keyPrefix,
  };
}
