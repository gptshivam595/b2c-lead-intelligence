/**
 * Safe API Client Helper
 * Validates Content-Type, prevents silent HTML parsing crashes,
 * and handles structured JSON errors cleanly.
 */

export class ApiError extends Error {
  public status: number;
  public code?: string;
  public isHtml: boolean;
  public responseSnippet?: string;

  constructor(
    message: string,
    status: number,
    code?: string,
    isHtml: boolean = false,
    responseSnippet?: string
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.isHtml = isHtml;
    this.responseSnippet = responseSnippet;
  }
}

export async function safeFetchJson<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(input, init);
  const contentType = response.headers.get('content-type') || '';

  // Detect if server returned HTML (e.g., SPA index.html fallback) instead of JSON
  if (contentType.includes('text/html')) {
    const htmlText = await response.text();
    const titleMatch = htmlText.match(/<title>(.*?)<\/title>/i);
    const pageTitle = titleMatch ? titleMatch[1] : 'HTML Document';
    const snippet = htmlText.slice(0, 200).replace(/\s+/g, ' ').trim();

    throw new ApiError(
      `API route returned HTML (${response.status} ${response.statusText} - "${pageTitle}") instead of JSON. Check that the backend endpoint is registered and not falling through to SPA fallback.`,
      response.status,
      'UNEXPECTED_HTML_RESPONSE',
      true,
      snippet
    );
  }

  // Parse JSON response body safely
  let data: any;
  const rawText = await response.text();
  if (!rawText) {
    data = {};
  } else {
    try {
      data = JSON.parse(rawText);
    } catch (parseErr: any) {
      throw new ApiError(
        `Failed to parse server response as JSON (${response.status} ${response.statusText}): ${parseErr.message}`,
        response.status,
        'INVALID_JSON_RESPONSE'
      );
    }
  }

  // Handle non-2xx HTTP status codes
  if (!response.ok) {
    const errorMsg =
      data?.error?.message ||
      data?.message ||
      `API request failed with HTTP status ${response.status}`;
    const errorCode =
      data?.error?.code ||
      data?.code ||
      `HTTP_${response.status}`;

    throw new ApiError(errorMsg, response.status, errorCode);
  }

  return data as T;
}
