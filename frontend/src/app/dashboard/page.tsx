"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Database, Plus, MessageSquare, Trash2, ChevronRight, BarChart3, RefreshCw, FileText } from "lucide-react";
import { PageShell } from "../../components/layout/PageShell";
import { useDataSources } from "../../hooks/useDataSources";
import { api } from "../../lib/api";
import { Session } from "../../lib/types";

export default function DashboardPage() {
  const router = useRouter();
  const { getToken } = useAuth();
  const { dataSources, loading: loadingSources, refetch: refetchSources, deleteDataSource } = useDataSources();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [creatingSession, setCreatingSession] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    try {
      const data = await api.sessions.list(getToken);
      setSessions(data.sessions);
    } catch (err) {
      console.error("Failed to load sessions:", err);
    } finally {
      setLoadingSessions(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleStartAnalysis = async (dataSourceId: string) => {
    setCreatingSession(dataSourceId);
    try {
      const session = await api.sessions.create({ data_source_id: dataSourceId }, getToken);
      router.push(`/session/${session.id}`);
    } catch (err: any) {
      alert(err.message || "Failed to create analysis session. Ensure profiling is complete.");
    } finally {
      setCreatingSession(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "complete":
        return <span className="font-body text-[11px] font-medium text-white bg-claude-success px-2.5 py-0.5 rounded-full">Ready</span>;
      case "running":
        return <span className="font-body text-[11px] font-medium text-white bg-claude-primary animate-pulse px-2.5 py-0.5 rounded-full">Profiling</span>;
      case "failed":
        return <span className="font-body text-[11px] font-medium text-white bg-claude-error px-2.5 py-0.5 rounded-full">Failed</span>;
      default:
        return <span className="font-body text-[11px] font-medium text-claude-muted bg-claude-surface-card px-2.5 py-0.5 rounded-full">Pending</span>;
    }
  };

  return (
    <PageShell>
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-claude-hairline px-6 py-6 animate-fade-in-up">
          <div>
            <h1 className="font-display text-display-sm text-claude-ink">Workspace Dashboard</h1>
            <p className="font-body text-sm text-claude-muted mt-1">Ingest datasets and run natural language analytics sessions.</p>
          </div>
          <Link
            href="/data/upload"
            className="inline-flex items-center justify-center gap-2 bg-claude-primary text-white font-body text-sm font-medium px-4 py-2.5 rounded-md hover:bg-claude-primary-active hover:-translate-y-0.5 hover:shadow-sm active:translate-y-0 transition-all duration-200 self-start md:self-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Connect New Data</span>
          </Link>
        </div>

        {/* Grid Area */}
        <div className="grid md:grid-cols-3 px-6">
          {/* Data Sources Column */}
          <div className="md:col-span-2 py-6 pr-0 md:pr-6 border-r border-claude-hairline animate-fade-in-up" style={{ animationDelay: "100ms" }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-body text-xs font-medium text-claude-muted uppercase tracking-wider">Connected Datasets</h2>
              <button 
                onClick={() => { refetchSources(); fetchSessions(); }} 
                className="text-claude-muted hover:text-claude-ink p-1 rounded hover:bg-claude-surface-soft hover:rotate-180 transition-all duration-300"
                title="Refresh workspace"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>

            {loadingSources ? (
              <div className="space-y-3">
                <div className="h-16 w-full bg-claude-surface-card rounded-lg animate-pulse-slow border border-claude-hairline"></div>
                <div className="h-16 w-full bg-claude-surface-card rounded-lg animate-pulse-slow border border-claude-hairline"></div>
              </div>
            ) : dataSources.length === 0 ? (
              <div className="rounded-lg border border-claude-hairline p-10 text-center bg-claude-surface-soft animate-fade-in-up" style={{ animationDelay: "200ms" }}>
                <Database className="h-8 w-8 text-claude-muted mx-auto mb-3" />
                <p className="font-body text-sm font-medium text-claude-ink mb-1">No datasets connected</p>
                <p className="font-body text-sm text-claude-muted mb-6">Upload a CSV or connect a PostgreSQL database to begin.</p>
                <Link
                  href="/data/upload"
                  className="inline-block bg-claude-primary text-white font-body text-sm font-medium px-5 py-2.5 rounded-md hover:bg-claude-primary-active transition-colors"
                >
                  Get Started
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {dataSources.map((ds, index) => (
                  <div
                    key={ds.id}
                    className="flex items-center justify-between rounded-lg border border-claude-hairline p-4 hover:bg-claude-surface-soft hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 bg-white animate-fade-in-up"
                    style={{ animationDelay: `${150 + index * 75}ms` }}
                  >
                    <div className="flex items-center gap-3 min-w-0 mr-4">
                      <div className="h-9 w-9 rounded-md bg-claude-surface-card flex items-center justify-center border border-claude-hairline">
                        <FileText className="h-4 w-4 text-claude-muted" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-body text-sm font-medium text-claude-ink truncate">{ds.name}</h3>
                        <div className="flex items-center gap-2 font-body text-xs text-claude-muted mt-0.5">
                          <span>{ds.source_type}</span>
                          {ds.row_count !== undefined && <span>&bull; {ds.row_count} rows</span>}
                          <span>&bull; {new Date(ds.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {getStatusBadge(ds.profile_status)}
                      
                      {ds.profile_status === "complete" ? (
                        <button
                          onClick={() => handleStartAnalysis(ds.id)}
                          disabled={creatingSession !== null}
                          className="flex items-center gap-1 bg-claude-primary text-white font-body text-sm font-medium px-3 py-1.5 rounded-md hover:bg-claude-primary-active hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-50"
                        >
                          {creatingSession === ds.id ? (
                            <RefreshCw className="h-3 w-3 animate-spin" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                          <span>Analyze</span>
                        </button>
                      ) : (
                        <div className="h-7 w-7"></div>
                      )}
                      
                      <button
                        onClick={() => deleteDataSource(ds.id)}
                        className="text-claude-muted hover:text-claude-error p-1.5 rounded hover:bg-claude-surface-soft transition-colors"
                        title="Delete dataset"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Analysis Sessions Column */}
          <div className="py-6 pl-6 animate-fade-in-up" style={{ animationDelay: "150ms" }}>
            <h2 className="font-body text-xs font-medium text-claude-muted uppercase tracking-wider mb-4">Recent Analyses</h2>

            {loadingSessions ? (
              <div className="space-y-2">
                <div className="h-14 w-full bg-claude-surface-card rounded-lg animate-pulse-slow border border-claude-hairline"></div>
                <div className="h-14 w-full bg-claude-surface-card rounded-lg animate-pulse-slow border border-claude-hairline"></div>
              </div>
            ) : sessions.length === 0 ? (
              <div className="rounded-lg border border-claude-hairline border-dashed p-6 text-center font-body text-sm text-claude-muted bg-white animate-fade-in-up" style={{ animationDelay: "250ms" }}>
                No active analyses. Start one from a dataset.
              </div>
            ) : (
              <div className="space-y-2">
                {sessions.slice(0, 5).map((s, index) => (
                  <Link
                    key={s.id}
                    href={`/session/${s.id}`}
                    className="block rounded-lg border border-claude-hairline p-4 hover:bg-claude-surface-soft hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 bg-white animate-fade-in-up"
                    style={{ animationDelay: `${200 + index * 75}ms` }}
                  >
                    <h3 className="font-body text-sm font-medium text-claude-ink truncate">{s.title || "Untitled analysis"}</h3>
                    <div className="flex justify-between items-center font-body text-xs text-claude-muted mt-1.5">
                      <span className="truncate max-w-[120px]">{s.data_source_name || "Dataset"}</span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        <span>{s.message_count} msgs</span>
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
