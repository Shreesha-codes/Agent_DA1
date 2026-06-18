"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Database, Plus, MessageSquare, Trash2, Calendar, FileText, ChevronRight, BarChart3, RefreshCw } from "lucide-react";
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

  const fetchSessions = async () => {
    try {
      const data = await api.sessions.list(getToken);
      setSessions(data.sessions);
    } catch (err) {
      console.error("Failed to load sessions:", err);
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [getToken]);

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
        return <span className="font-heading text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 text-black bg-retro-sage border border-black">Ready</span>;
      case "running":
        return <span className="font-heading text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 text-white bg-black animate-pulse">Profiling</span>;
      case "failed":
        return <span className="font-heading text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 text-white bg-retro-red border border-black">Failed</span>;
      default:
        return <span className="font-heading text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 text-black bg-black/10 border border-black">Pending</span>;
    }
  };

  return (
    <PageShell>
      <div className="max-w-6xl mx-auto">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-black px-6 py-5">
          <div>
            <h1 className="font-display text-xl font-black uppercase text-black leading-tight">Workspace Dashboard</h1>
            <p className="font-body text-xs text-black/60 mt-1">Ingest datasets and run natural language analytics sessions.</p>
          </div>
          <Link
            href="/data/upload"
            className="inline-flex items-center justify-center gap-2 bg-black text-white font-heading text-[10px] font-bold uppercase px-4 py-2 border border-black hover:bg-white hover:text-black transition-colors self-start md:self-auto leading-none"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Connect New Data</span>
          </Link>
        </div>

        {/* Grid Area */}
        <div className="grid md:grid-cols-3 px-6">
          {/* Data Sources Column */}
          <div className="md:col-span-2 py-6 pr-0 md:pr-6 border-r border-black">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-heading text-[10px] font-bold uppercase tracking-wider text-black/60">Connected Datasets</h2>
              <button 
                onClick={() => { refetchSources(); fetchSessions(); }} 
                className="text-black/40 hover:text-black p-1 border border-transparent hover:border-black"
                title="Refresh workspace"
              >
                <RefreshCw className="h-3 w-3" />
              </button>
            </div>

            {loadingSources ? (
              <div className="space-y-3">
                <div className="h-16 w-full bg-black/10 animate-pulse-slow border border-black"></div>
                <div className="h-16 w-full bg-black/10 animate-pulse-slow border border-black"></div>
              </div>
            ) : dataSources.length === 0 ? (
              <div className="border border-black p-8 text-center bg-black/[0.02]">
                <Database className="h-7 w-7 text-black/40 mx-auto mb-3" />
                <p className="font-heading text-xs font-bold uppercase text-black mb-1">No datasets connected</p>
                <p className="font-body text-xs text-black/50 mb-5">Upload a CSV or connect a PostgreSQL database to begin.</p>
                <Link
                  href="/data/upload"
                  className="inline-block bg-black text-white font-heading text-[10px] font-bold uppercase px-4 py-2 border border-black hover:bg-white hover:text-black transition-colors leading-none"
                >
                  Get Started
                </Link>
              </div>
            ) : (
              <div className="space-y-2">
                {dataSources.map((ds) => (
                  <div
                    key={ds.id}
                    className="flex items-center justify-between border border-black p-3 hover:bg-black/5 transition-colors bg-white"
                  >
                    <div className="flex items-center gap-3 min-w-0 mr-4">
                      <div className="h-8 w-8 bg-black/10 flex items-center justify-center border border-black">
                        <FileText className="h-3.5 w-3.5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-heading text-xs font-bold uppercase text-black truncate leading-tight">{ds.name}</h3>
                        <div className="flex items-center gap-2 font-body text-[10px] text-black/50 mt-0.5">
                          <span>{ds.source_type}</span>
                          {ds.row_count !== undefined && <span>• {ds.row_count} rows</span>}
                          <span>• {new Date(ds.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {getStatusBadge(ds.profile_status)}
                      
                      {ds.profile_status === "complete" ? (
                        <button
                          onClick={() => handleStartAnalysis(ds.id)}
                          disabled={creatingSession !== null}
                          className="flex items-center gap-1 bg-black text-white font-heading text-[10px] font-bold uppercase px-2.5 py-1.5 border border-black hover:bg-white hover:text-black transition-colors disabled:opacity-50 leading-none"
                        >
                          {creatingSession === ds.id ? (
                            <RefreshCw className="h-2.5 w-2.5 animate-spin" />
                          ) : (
                            <ChevronRight className="h-3 w-3" />
                          )}
                          <span>Analyze</span>
                        </button>
                      ) : (
                        <div className="h-6 w-6"></div>
                      )}
                      
                      <button
                        onClick={() => deleteDataSource(ds.id)}
                        className="text-black/30 hover:text-retro-red p-1 border border-transparent hover:border-black transition-colors"
                        title="Delete dataset"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Analysis Sessions Column */}
          <div className="py-6 pl-6">
            <h2 className="font-heading text-[10px] font-bold uppercase tracking-wider text-black/60 mb-4">Recent Analyses</h2>

            {loadingSessions ? (
              <div className="space-y-2">
                <div className="h-12 w-full bg-black/10 animate-pulse-slow border border-black"></div>
                <div className="h-12 w-full bg-black/10 animate-pulse-slow border border-black"></div>
              </div>
            ) : sessions.length === 0 ? (
              <div className="border border-black border-dashed p-5 text-center font-body text-xs text-black/50 bg-white">
                No active analyses. Start one from a dataset.
              </div>
            ) : (
              <div className="space-y-2">
                {sessions.slice(0, 5).map((s) => (
                  <Link
                    key={s.id}
                    href={`/session/${s.id}`}
                    className="block border border-black p-3 hover:bg-black/5 transition-colors bg-white"
                  >
                    <h3 className="font-heading text-xs font-bold uppercase text-black truncate leading-tight">{s.title || "Untitled analysis"}</h3>
                    <div className="flex justify-between items-center font-body text-[10px] text-black/50 mt-1.5">
                      <span className="truncate max-w-[120px]">{s.data_source_name || "Dataset"}</span>
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-2.5 w-2.5" />
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
