import { API_BASE_URL } from "./constants";

type RequestOptions = {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
  cache?: RequestCache;
};

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (session?.access_token) {
      headers["Authorization"] = `Bearer ${session.access_token}`;
    }

    return headers;
  }

  async request<T = any>(path: string, options: RequestOptions = {}): Promise<T> {
    const { method = "GET", body, headers: extraHeaders, cache } = options;
    const authHeaders = await this.getAuthHeaders();

    const response = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: { ...authHeaders, ...extraHeaders },
      body: body ? JSON.stringify(body) : undefined,
      cache,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Request failed" }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
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

    const response = await fetch(`${this.baseUrl}${path}`, { headers });
    if (!response.ok) throw new Error("Download failed");

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

    const headers: Record<string, string> = {};
    if (session?.access_token) {
      headers["Authorization"] = `Bearer ${session.access_token}`;
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Upload failed" }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }
}

export const api = new ApiClient(API_BASE_URL);
