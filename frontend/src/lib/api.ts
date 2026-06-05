import { API_BASE_URL } from "./constants";

type RequestOptions = {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
  cache?: RequestCache;
  retries?: number;
};

function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function getFriendlyErrorMessage(status: number, body?: any): string {
  if (body?.message) return body.message;
  const messages: Record<number, string> = {
    400: "The request was invalid. Please check your input and try again.",
    401: "Your session has expired. Please sign in again.",
    403: "You don't have permission to perform this action.",
    404: "The requested resource was not found.",
    409: "This resource already exists or there's a conflict.",
    429: "Too many requests. Please wait a moment and try again.",
    500: "Something went wrong on our end. We've been notified.",
    502: "The server is temporarily unavailable. Please try again shortly.",
    503: "Service is temporarily down for maintenance. Please try again later.",
  };
  return messages[status] || `Request failed (${status}). Please try again.`;
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;
    return headers;
  }

  async request<T = any>(path: string, options: RequestOptions = {}): Promise<T> {
    const { method = "GET", body, headers: extraHeaders, cache, retries = 2 } = options;
    const authHeaders = await this.getAuthHeaders();
    const requestId = generateRequestId();
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(`${this.baseUrl}${path}`, {
          method,
          headers: { ...authHeaders, ...extraHeaders, "X-Request-Id": requestId },
          body: body ? JSON.stringify(body) : undefined,
          cache,
          signal: AbortSignal.timeout(30000),
        });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => null);
          const message = getFriendlyErrorMessage(response.status, errorBody);
          const err = new Error(message);
          (err as any).status = response.status;
          (err as any).requestId = requestId;
          throw err;
        }

        return response.json();
      } catch (err: any) {
        lastError = err;
        if (err.name === "TimeoutError" || err.status === 429 || err.status === 502 || err.status === 503) {
          if (attempt < retries) {
            await sleep(Math.pow(2, attempt) * 1000);
            continue;
          }
        }
        break;
      }
    }

    throw lastError || new Error("Request failed");
  }

  get<T = any>(path: string, options?: RequestOptions) {
    return this.request<T>(path, { ...options, method: "GET" });
  }

  post<T = any>(path: string, body?: any, options?: RequestOptions) {
    return this.request<T>(path, { ...options, method: "POST", body });
  }

  put<T = any>(path: string, body?: any, options?: RequestOptions) {
    return this.request<T>(path, { ...options, method: "PUT", body });
  }

  patch<T = any>(path: string, body?: any, options?: RequestOptions) {
    return this.request<T>(path, { ...options, method: "PATCH", body });
  }

  delete<T = any>(path: string, options?: RequestOptions) {
    return this.request<T>(path, { ...options, method: "DELETE" });
  }

  async download(path: string) {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const headers: Record<string, string> = {};
    if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const response = await fetch(`${this.baseUrl}${path}`, { headers, signal: controller.signal }).finally(() => clearTimeout(timeout));
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(getFriendlyErrorMessage(response.status, body));
    }

    const blob = await response.blob();
    const disposition = response.headers.get("Content-Disposition") || "";
    const match = disposition.match(/filename="?(.+?)"?$/);
    const filename = match ? match[1] : "resume.pdf";
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  async upload<T = any>(path: string, formData: FormData): Promise<T> {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const headers: Record<string, string> = { "X-Request-Id": generateRequestId() };
    if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;

    try {
      const response = await fetch(`${this.baseUrl}${path}`, { method: "POST", headers, body: formData, signal: AbortSignal.timeout(60000) });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(getFriendlyErrorMessage(response.status, body));
      }
      return response.json();
    } catch (err: any) {
      if (err.name === "TimeoutError" || err.name === "AbortError") {
        throw new Error("Upload timed out. File may be too large.");
      }
      if (err.message?.includes("Failed to fetch") || err.message?.includes("NetworkError")) {
        throw new Error(`Unable to reach server at ${this.baseUrl}. Make sure the API server is running and CORS is configured.`);
      }
      throw err;
    }
  }
}

export const api = new ApiClient(API_BASE_URL);
