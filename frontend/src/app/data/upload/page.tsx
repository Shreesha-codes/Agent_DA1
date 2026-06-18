"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { ArrowLeft, FileText, Server, AlertCircle, RefreshCw } from "lucide-react";
import Link from "next/link";
import { PageShell } from "@/components/layout/PageShell";
import { FileUploader } from "@/components/data/FileUploader";
import { SQLConnector } from "@/components/data/SQLConnector";
import { api } from "@/lib/api";
import { DataSource } from "@/lib/types";

async function pollDataSource(
  id: string,
  getToken: () => Promise<string | null>,
  signal: AbortSignal,
): Promise<DataSource> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) return reject(new Error("Aborted"));

    const poll = async () => {
      while (!signal.aborted) {
        try {
          const ds = await api.dataSources.get(id, getToken);
          if (ds.profile_status === "complete" || ds.profile_status === "failed") {
            return resolve(ds);
          }
        } catch {
          // Retry on transient errors
        }
        await new Promise((r) => setTimeout(r, 2000));
      }
      reject(new Error("Aborted"));
    };
    poll();
  });
}

export default function UploadPage() {
  const router = useRouter();
  const { getToken } = useAuth();
  const [activeTab, setActiveTab] = useState<"file" | "postgres">("file");
  const [saving, setSaving] = useState(false);
  const [profiling, setProfiling] = useState(false);
  const [profilingName, setProfilingName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const createAndPoll = useCallback(async (data: any) => {
    setSaving(true);
    setError(null);
    try {
      const result = await api.dataSources.create(data, getToken);
      setSaving(false);
      setProfiling(true);
      setProfilingName(data.name);

      abortRef.current = new AbortController();
      const ds = await pollDataSource(result.id, getToken, abortRef.current.signal);

      setProfiling(false);
      abortRef.current = null;

      if (ds.profile_status === "failed") {
        setError("Data profiling failed. The dataset may be empty or unreadable. Try a different file.");
        return;
      }
      router.push("/dashboard");
    } catch (err: any) {
      if (err?.message === "Aborted") return;
      setError(err.message || "Failed to register data source");
      setSaving(false);
      setProfiling(false);
    }
  }, [getToken, router]);

  const handleFileUploadSaved = async (
    storagePath: string,
    fileName: string,
    fileSize: number,
    fileFormat: "csv" | "excel" | "json"
  ) => {
    await createAndPoll({
      name: fileName,
      source_type: "file",
      file_format: fileFormat,
      storage_path: storagePath,
      file_size_bytes: fileSize,
    });
  };

  const handleSQLConnectionSaved = async (params: {
    name: string;
    pg_host: string;
    pg_port: number;
    pg_database: string;
    pg_username: string;
    pg_password?: string;
    pg_schema: string;
    pg_table: string;
  }) => {
    await createAndPoll({
      name: params.name,
      source_type: "postgres",
      pg_host: params.pg_host,
      pg_port: params.pg_port,
      pg_database: params.pg_database,
      pg_username: params.pg_username,
      pg_password: params.pg_password,
      pg_schema: params.pg_schema,
      pg_table: params.pg_table,
    });
  };
  return (
    <PageShell>
      <div className="max-w-3xl mx-auto">
        {/* Page Header */}
        <div className="flex items-center justify-between border-b border-claude-hairline px-6 py-5 animate-fade-in-up">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="font-body text-sm text-claude-muted hover:text-claude-ink rounded-md border border-transparent hover:border-claude-hairline px-3 py-1.5 hover:-translate-x-0.5 active:translate-y-0 transition-all duration-200"
            >
              &larr; Back
            </Link>
            <div>
              <h1 className="font-display text-display-sm text-claude-ink">Connect Dataset</h1>
              <p className="font-body text-sm text-claude-muted mt-0.5">
                Connect static data files or query active database schemas directly.
              </p>
            </div>
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div className="flex gap-3 mx-6 mt-4 rounded-lg border border-claude-error/20 bg-claude-error/5 p-4 animate-fade-in">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-claude-error" />
            <div className="font-body text-sm leading-relaxed text-claude-error">
              <p className="font-medium">Registration Failed</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Tab Selectors */}
        <div className="flex px-6 pt-6 border-b border-claude-hairline animate-fade-in-up" style={{ animationDelay: "100ms" }}>
          <button
            onClick={() => setActiveTab("file")}
            disabled={saving}
            className={`flex items-center gap-2 px-5 py-2.5 font-body text-sm font-medium rounded-t-lg transition-all duration-300 ${
              activeTab === "file"
                ? "border border-claude-hairline border-b-white bg-white text-claude-ink -mb-px shadow-sm"
                : "text-claude-muted hover:text-claude-ink hover:bg-claude-surface-soft/50"
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Upload File</span>
          </button>
          <button
            onClick={() => setActiveTab("postgres")}
            disabled={saving}
            className={`flex items-center gap-2 px-5 py-2.5 font-body text-sm font-medium rounded-t-lg transition-all duration-300 ${
              activeTab === "postgres"
                ? "border border-claude-hairline border-b-white bg-white text-claude-ink -mb-px shadow-sm"
                : "text-claude-muted hover:text-claude-ink hover:bg-claude-surface-soft/50"
            }`}
          >
            <Server className="h-4 w-4" />
            <span>PostgreSQL Database</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="mx-6 my-5 rounded-lg border border-claude-hairline bg-white p-6 shadow-sm hover:shadow-md transition-shadow duration-300 animate-fade-in-up" style={{ animationDelay: "150ms" }}>
          {saving ? (
            <div className="py-12 text-center space-y-3 animate-fade-in">
              <div className="h-5 w-5 rounded-full border-2 border-claude-primary border-t-transparent animate-spin mx-auto"></div>
              <p className="font-body text-sm text-claude-muted">Registering data source...</p>
            </div>
          ) : profiling ? (
            <div className="py-12 text-center space-y-4 animate-fade-in">
              <RefreshCw className="h-6 w-6 text-claude-primary animate-spin mx-auto" />
              <p className="font-body text-sm font-medium text-claude-ink">Generating schema profile</p>
              <p className="font-body text-xs text-claude-muted max-w-md mx-auto">
                Analyzing &ldquo;{profilingName}&rdquo; — detecting column types, statistics, and anomalies.
              </p>
              <div className="h-1.5 w-48 mx-auto rounded-full bg-claude-surface-card overflow-hidden">
                <div className="h-full rounded-full bg-claude-primary animate-pulse-slow" style={{ width: "60%" }}></div>
              </div>
            </div>
          ) : activeTab === "file" ? (
            <div className="animate-fade-in">
              <FileUploader onUploadComplete={handleFileUploadSaved} />
            </div>
          ) : (
            <div className="animate-fade-in">
              <SQLConnector onConnectionSaved={handleSQLConnectionSaved} />
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
