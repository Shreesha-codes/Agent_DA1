"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { PanelRightClose, PanelRightOpen, ArrowLeft, RefreshCw, BarChart2, Info } from "lucide-react";
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
        <div className="flex h-[calc(100vh-3.5rem)] items-center justify-center bg-white">
          <div className="text-center space-y-3">
            <RefreshCw className="h-5 w-5 animate-spin text-black/50 mx-auto" />
            <p className="font-body text-xs text-black/50">Loading analysis session workspace...</p>
          </div>
        </div>
      </PageShell>
    );
  }

  if (error && !session) {
    return (
      <PageShell currentSessionId={sessionId}>
        <div className="max-w-md mx-auto mt-20 p-6 text-center space-y-4 border border-black bg-white">
              <p className="font-body text-xs text-retro-red font-medium">Failed to load session: {error}</p>
          <Link
            href="/dashboard"
            className="inline-block bg-black text-white font-heading text-[10px] font-bold uppercase px-4 py-2 border border-black hover:bg-white hover:text-black transition-colors leading-none"
          >
            Return to Dashboard
          </Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell currentSessionId={sessionId} onSessionDeleted={handleSessionDeleted}>
      <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">
        {/* Chat Feed Panel */}
        <div className="flex flex-1 flex-col justify-between overflow-hidden border-r border-black bg-white">
          {/* Session Header */}
          <div className="flex items-center justify-between border-b border-black px-4 py-2.5 bg-white">
            <div className="flex items-center gap-3 overflow-hidden mr-4">
              <Link href="/dashboard" className="text-black/40 hover:text-black">
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <div className="min-w-0">
                <h2 className="font-heading text-xs font-bold uppercase text-black truncate leading-tight">
                  {session?.title || "Untitled analysis"}
                </h2>
                {dataSource && (
                  <p className="font-body text-[10px] text-black/50 leading-tight mt-0.5">
                    Active Dataset: {dataSource.name}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowProfile(!showProfile)}
                className={`flex items-center gap-1.5 border px-2.5 py-1 font-heading text-[10px] font-bold uppercase leading-none transition-colors ${
                  showProfile
                    ? "border-black bg-white text-black"
                    : "border-black text-black/40 hover:text-black bg-white"
                }`}
                title="Toggle Database Profile Panel"
              >
                {showProfile ? <PanelRightClose className="h-3.5 w-3.5" /> : <PanelRightOpen className="h-3.5 w-3.5" />}
                <span className="hidden sm:inline">Profile</span>
              </button>
            </div>
          </div>

          {/* Messages Feed Area */}
          <div className="flex-1 overflow-y-auto bg-black/[0.02]">
            {session?.messages && session.messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center p-8 text-center max-w-lg mx-auto">
                <BarChart2 className="h-8 w-8 text-black/30 mb-3" />
                <h3 className="font-heading text-sm font-bold uppercase text-black mb-1">Anton Sandbox Ready</h3>
                <p className="font-body text-xs text-black/60 leading-relaxed mb-5">
                  Ask a question to begin. Anton will write Python code, execute it in a secure sandbox, return statistical answers, and display custom charts.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full font-body text-xs text-left">
                  <button
                    onClick={() => handleSendMessage("Show me a summary statistics profile of the columns")}
                    className="border border-black p-2.5 bg-white hover:bg-black/5 transition-colors text-left"
                  >
                    Show summary profile stats
                  </button>
                  <button
                    onClick={() => handleSendMessage("Are there any missing values or null values in this dataset?")}
                    className="border border-black p-2.5 bg-white hover:bg-black/5 transition-colors text-left"
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
          <div className="border-t border-black bg-white p-3">
            <MessageInput onSendMessage={handleSendMessage} disabled={sendingMessage} />
            {error && (
              <p className="font-body text-[10px] text-retro-red mt-1.5 ml-1">
                Error: {error}
              </p>
            )}
          </div>
        </div>

        {/* Collapsible Sidebar Introspection Panel */}
        {showProfile && (
          <div className="w-80 md:w-96 flex-shrink-0 overflow-y-auto bg-white p-4 border-l border-black">
            <div className="flex items-center gap-1.5 mb-4 font-heading text-[10px] font-bold uppercase tracking-wider text-black/60">
              <Info className="h-3.5 w-3.5" />
              <span>Dataset Introspection</span>
            </div>
            {dataSource ? (
              <DataProfileCard dataSource={dataSource} />
            ) : (
              <div className="space-y-4">
                <div className="h-8 w-full bg-black/10 animate-pulse-slow border border-black"></div>
                <div className="h-48 w-full bg-black/10 animate-pulse-slow border border-black"></div>
              </div>
            )}
          </div>
        )}
      </div>
    </PageShell>
  );
}
