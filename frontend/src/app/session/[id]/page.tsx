"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { PanelRightClose, PanelRightOpen, ArrowLeft, RefreshCw, BarChart3, Info } from "lucide-react";
import Link from "next/link";
import { PageShell } from "../../../components/layout/PageShell";
import { MessageList } from "../../../components/chat/MessageList";
import { MessageInput } from "../../../components/chat/MessageInput";
import { DataProfileCard } from "../../../components/data/DataProfileCard";
import { useSession } from "../../../hooks/useSession";
import { api } from "../../../lib/api";
import { DataSource } from "../../../lib/types";

export default function SessionPage() {
  const router = useRouter();
  const params = useParams();
  const sessionId = params.id as string;

  const { getToken } = useAuth();
  const { session, loading, error, sendingMessage, addMessage, refetch } = useSession(sessionId);
  const [dataSource, setDataSource] = useState<DataSource | null>(null);
  const [loadingSource, setLoadingSource] = useState(false);
  const [showProfile, setShowProfile] = useState(true);

  useEffect(() => {
    async function loadDataSource() {
      if (!session?.data_source_id) return;
      setLoadingSource(true);
      try {
        const ds = await api.dataSources.get(session.data_source_id, getToken);
        setDataSource(ds);
      } catch (err) {
        console.error("Failed to load session data source details:", err);
      } finally {
        setLoadingSource(false);
      }
    }
    loadDataSource();
  }, [session?.data_source_id, getToken]);

  const handleSendMessage = async (text: string) => {
    try {
      await addMessage(text);
    } catch (err) {
    }
  };

  const handleSessionDeleted = () => {
    router.push("/dashboard");
  };

  if (loading) {
    return (
      <PageShell currentSessionId={sessionId}>
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center bg-claude-canvas">
          <div className="text-center space-y-3">
            <RefreshCw className="h-5 w-5 animate-spin text-claude-muted mx-auto" />
            <p className="font-body text-sm text-claude-muted">Loading analysis session workspace...</p>
          </div>
        </div>
      </PageShell>
    );
  }

  if (error && !session) {
    return (
      <PageShell currentSessionId={sessionId}>
        <div className="max-w-md mx-auto mt-20 p-6 text-center space-y-4 rounded-lg border border-claude-hairline bg-white">
          <p className="font-body text-sm text-claude-error font-medium">Failed to load session: {error}</p>
          <Link
            href="/dashboard"
            className="inline-block bg-claude-primary text-white font-body text-sm font-medium px-5 py-2.5 rounded-md hover:bg-claude-primary-active transition-colors"
          >
            Return to Dashboard
          </Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell currentSessionId={sessionId} onSessionDeleted={handleSessionDeleted}>
      <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
        {/* Chat Feed Panel */}
        <div className="flex flex-1 flex-col justify-between overflow-hidden border-r border-claude-hairline bg-claude-canvas">
          {/* Session Header */}
          <div className="flex items-center justify-between border-b border-claude-hairline px-4 py-3 bg-white">
            <div className="flex items-center gap-3 overflow-hidden mr-4">
              <Link href="/dashboard" className="text-claude-muted hover:text-claude-ink p-1 rounded hover:bg-claude-surface-soft">
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <div className="min-w-0">
                <h2 className="font-body text-sm font-medium text-claude-ink truncate">
                  {session?.title || "Untitled analysis"}
                </h2>
                {dataSource && (
                  <p className="font-body text-xs text-claude-muted mt-0.5">
                    Active Dataset: {dataSource.name}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowProfile(!showProfile)}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 font-body text-sm font-medium transition-colors ${
                  showProfile
                    ? "bg-claude-primary text-white"
                    : "border border-claude-hairline text-claude-muted hover:text-claude-ink bg-white"
                }`}
                title="Toggle Database Profile Panel"
              >
                {showProfile ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
                <span className="hidden sm:inline">Profile</span>
              </button>
            </div>
          </div>

          {/* Messages Feed Area */}
          <div className="flex-1 overflow-y-auto bg-claude-surface-soft">
            {session?.messages && session.messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center p-8 text-center max-w-lg mx-auto">
                <BarChart3 className="h-10 w-10 text-claude-muted mb-4" />
                <h3 className="font-display text-display-sm text-claude-ink mb-2">Sandbox Ready</h3>
                <p className="font-body text-sm text-claude-muted leading-relaxed mb-6">
                  Ask a question to begin. Agent_DA will write Python code, execute it in a secure sandbox, return statistical answers, and display custom charts.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full font-body text-sm text-left">
                  <button
                    onClick={() => handleSendMessage("Show me a summary statistics profile of the columns")}
                    className="rounded-lg border border-claude-hairline p-3 bg-white hover:bg-claude-surface-soft transition-colors text-left"
                  >
                    Show summary profile stats
                  </button>
                  <button
                    onClick={() => handleSendMessage("Are there any missing values or null values in this dataset?")}
                    className="rounded-lg border border-claude-hairline p-3 bg-white hover:bg-claude-surface-soft transition-colors text-left"
                  >
                    Find missing/null values
                  </button>
                </div>
              </div>
            ) : (
              <MessageList messages={session?.messages || []} loading={sendingMessage} />
            )}
          </div>

          {/* Query Input Box */}
          <div className="border-t border-claude-hairline bg-white p-4">
            <MessageInput onSendMessage={handleSendMessage} disabled={sendingMessage} />
            {error && (
              <p className="font-body text-xs text-claude-error mt-1.5 ml-1">
                Error: {error}
              </p>
            )}
          </div>
        </div>

        {/* Collapsible Sidebar Introspection Panel */}
        {showProfile && (
          <div className="w-80 md:w-96 flex-shrink-0 overflow-y-auto bg-white p-4 border-l border-claude-hairline">
            <div className="flex items-center gap-1.5 mb-4 font-body text-xs font-medium uppercase tracking-wider text-claude-muted">
              <Info className="h-4 w-4" />
              <span>Dataset Introspection</span>
            </div>
            {dataSource ? (
              <DataProfileCard dataSource={dataSource} />
            ) : (
              <div className="space-y-4">
                <div className="h-8 w-full bg-claude-surface-card rounded-lg animate-pulse-slow"></div>
                <div className="h-48 w-full bg-claude-surface-card rounded-lg animate-pulse-slow"></div>
              </div>
            )}
          </div>
        )}
      </div>
    </PageShell>
  );
}
