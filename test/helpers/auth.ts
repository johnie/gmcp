/**
 * Mock OAuth2Client for integration tests
 * Provides a mock that satisfies googleapis requirements by making real HTTP requests
 * The actual HTTP interception is handled by MSW
 */

import type { GaxiosOptions, GaxiosPromise, GaxiosResponse } from "gaxios";
import type { OAuth2Client } from "google-auth-library";

/**
 * Build URL with query parameters
 */
function buildUrlWithParams(baseUrl: string, params?: object): string {
  if (!params) {
    return baseUrl;
  }

  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      searchParams.append(key, String(value));
    }
  }

  const queryString = searchParams.toString();
  if (!queryString) {
    return baseUrl;
  }

  return baseUrl + (baseUrl.includes("?") ? "&" : "?") + queryString;
}

/**
 * Build fetch options from gaxios options
 */
function buildFetchOptions(opts: GaxiosOptions, method: string): RequestInit {
  const headers: HeadersInit = {
    Authorization: "Bearer mock_access_token",
    "Content-Type": "application/json",
    ...(opts.headers as Record<string, string>),
  };

  const fetchOptions: RequestInit = {
    method,
    headers,
  };

  // Gaxios uses 'data' property, not 'body'
  const requestData = opts.data ?? opts.body;
  if (requestData && ["POST", "PUT", "PATCH"].includes(method)) {
    fetchOptions.body =
      typeof requestData === "string"
        ? requestData
        : JSON.stringify(requestData);
  }

  return fetchOptions;
}

/**
 * Parse response based on content type
 */
async function parseResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("application/json")) {
    const text = await response.text();
    return text ? JSON.parse(text) : ({} as T);
  }

  return (await response.text()) as unknown as T;
}

/**
 * Create a mock OAuth2Client for testing
 * The googleapis library uses authClient.request() to make HTTP requests
 * This mock implements request() to use fetch, which MSW intercepts
 */
export function createMockOAuth2Client(): OAuth2Client {
  const mockClient = {
    getAccessToken: () => Promise.resolve({ token: "mock_access_token" }),
    credentials: {
      access_token: "mock_access_token",
      refresh_token: "mock_refresh_token",
      expiry_date: Date.now() + 3600 * 1000,
    },
    on: () => mockClient,
    setCredentials: () => {
      // No-op for mock
    },
    refreshAccessToken: () =>
      Promise.resolve({
        credentials: {
          access_token: "mock_refreshed_token",
        },
      }),
    /**
     * Make HTTP request - this is what googleapis actually calls
     * We use native fetch which MSW intercepts
     */
    request: async <T>(opts: GaxiosOptions): GaxiosPromise<T> => {
      const url = opts.url || "";
      const method = (opts.method || "GET").toUpperCase();
      const fullUrl = buildUrlWithParams(url, opts.params);
      const fetchOptions = buildFetchOptions(opts, method);

      const response = await fetch(fullUrl, fetchOptions);
      const data = await parseResponse<T>(response);

      if (!response.ok) {
        const error = new Error(
          `Request failed with status ${response.status}`
        ) as Error & { response?: GaxiosResponse<T> };
        error.response = {
          config: opts,
          data,
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          request: { responseURL: fullUrl },
        };
        throw error;
      }

      return {
        config: opts,
        data,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        request: { responseURL: fullUrl },
      } as GaxiosResponse<T>;
    },
  };

  return mockClient as unknown as OAuth2Client;
}
