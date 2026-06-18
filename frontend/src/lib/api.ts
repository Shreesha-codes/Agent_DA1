import { DataSource, Session, Message, Visualization, ExecutionLog } from "./types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class ApiError extends Error {
  code: string;
  status: number;
  details?: any;

  constructor(code: string, message: string, status: number, details?: any) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  getToken: () => Promise<string | null>
): Promise<T> {
  const token = await getToken();
  
  const headers = new Headers(options.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errData: any = {};
    try {
      errData = await response.json();
    } catch {
      // ignore
    }

    const err = errData.error || {};
    throw new ApiError(
      err.code || "INTERNAL_ERROR",
      err.message || response.statusText || "Something went wrong",
      response.status,
      err.details
    );
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json() as Promise<T>;
}

export const api = {
  dataSources: {
    create: (
      body: {
        name: string;
        source_type: "file" | "postgres";
        file_format?: "csv" | "excel" | "json";
        storage_path?: string;
        file_size_bytes?: number;
        pg_host?: string;
        pg_port?: number;
        pg_database?: string;
        pg_username?: string;
        pg_password?: string;
        pg_schema?: string;
        pg_table?: string;
      },
      getToken: () => Promise<string | null>
    ) =>
      apiFetch<any>("/api/data-sources", {
        method: "POST",
        body: JSON.stringify(body),
      }, getToken),

    list: (getToken: () => Promise<string | null>) =>
      apiFetch<{ data_sources: DataSource[] }>("/api/data-sources", { method: "GET" }, getToken),

    get: (id: string, getToken: () => Promise<string | null>) =>
      apiFetch<DataSource>(`/api/data-sources/${id}`, { method: "GET" }, getToken),

    testConnection: (
      body: {
        pg_host: string;
        pg_port: number;
        pg_database: string;
        pg_username: string;
        pg_password: string;
        pg_schema: string;
        pg_table: string;
      },
      getToken: () => Promise<string | null>
    ) =>
      apiFetch<{ success: boolean; message: string; row_count?: number; column_count?: number }>(
        "/api/data-sources/test-connection",
        {
          method: "POST",
          body: JSON.stringify(body),
        },
        getToken
      ),

    delete: (id: string, getToken: () => Promise<string | null>) =>
      apiFetch<void>(`/api/data-sources/${id}`, { method: "DELETE" }, getToken),
  },

  sessions: {
    create: (body: { data_source_id: string }, getToken: () => Promise<string | null>) =>
      apiFetch<Session>("/api/sessions", {
        method: "POST",
        body: JSON.stringify(body),
      }, getToken),

    list: (getToken: () => Promise<string | null>) =>
      apiFetch<{ sessions: Session[] }>("/api/sessions", { method: "GET" }, getToken),

    get: (id: string, getToken: () => Promise<string | null>) =>
      apiFetch<Session>(`/api/sessions/${id}`, { method: "GET" }, getToken),

    delete: (id: string, getToken: () => Promise<string | null>) =>
      apiFetch<void>(`/api/sessions/${id}`, { method: "DELETE" }, getToken),
  },

  messages: {
    send: (
      sessionId: string,
      question: string,
      getToken: () => Promise<string | null>
    ) =>
      apiFetch<{
        user_message: Message;
        assistant_message: Message;
        visualization?: Visualization;
        execution_log?: ExecutionLog;
        session_title_updated: boolean;
      }>(
        `/api/sessions/${sessionId}/messages`,
        {
          method: "POST",
          body: JSON.stringify({ question }),
        },
        getToken
      ),
  },

  users: {
    sync: (
      body: {
        clerk_user_id: string;
        email: string;
        display_name?: string;
      },
      getToken: () => Promise<string | null>
    ) =>
      apiFetch<any>("/api/users/sync", {
        method: "POST",
        body: JSON.stringify(body),
      }, getToken),
  },
};
