"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { MessageSquare, Plus, Database, ChevronLeft, ChevronRight, BarChart2, Trash2 } from "lucide-react";
import { api } from "../../lib/api";
import { Session } from "../../lib/types";

interface SidebarProps {
  currentSessionId?: string;
  onSessionDeleted?: () => void;
}

export function Sidebar({ currentSessionId, onSessionDeleted }: SidebarProps) {
  const pathname = usePathname();
  const { getToken } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  const fetchSessions = async () => {
    try {
      const data = await api.sessions.list(getToken);
      setSessions(data.sessions);
    } catch (err) {
      console.error("Failed to load sessions in sidebar:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [getToken, pathname]);

  const handleDeleteSession = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this session?")) return;
    try {
      await api.sessions.delete(id, getToken);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      if (onSessionDeleted) onSessionDeleted();
    } catch (err) {
      alert("Failed to delete session");
    }
  };

  if (collapsed) {
    return (
      <aside className="relative flex h-[calc(100vh-3.5rem)] w-12 flex-col items-center border-r border-black bg-white py-4">
        <button
          onClick={() => setCollapsed(false)}
          className="absolute -right-3 top-4 flex h-6 w-6 items-center justify-center border border-black bg-white hover:bg-black hover:text-white"
        >
          <ChevronRight className="h-3 w-3" />
        </button>
        <Link
          href="/data/upload"
          className="flex h-8 w-8 items-center justify-center bg-black text-white border border-black hover:bg-white hover:text-black"
          title="New Analysis"
        >
          <Plus className="h-4 w-4" />
        </Link>
        <div className="mt-8 flex flex-col gap-4">
          <Link href="/dashboard" className="text-black hover:text-black/50" title="Dashboard">
            <BarChart2 className="h-5 w-5" />
          </Link>
        </div>
      </aside>
    );
  }

  return (
    <aside className="relative flex h-[calc(100vh-3.5rem)] w-64 flex-col border-r border-black bg-white">
      <button
        onClick={() => setCollapsed(true)}
        className="absolute -right-3 top-4 z-10 flex h-6 w-6 items-center justify-center border border-black bg-white hover:bg-black hover:text-white"
      >
        <ChevronLeft className="h-3 w-3" />
      </button>

      <div className="p-4 border-b border-black">
        <Link
          href="/data/upload"
          className="flex w-full items-center justify-center gap-2 bg-black text-white font-heading text-xs font-bold uppercase py-2.5 border border-black hover:bg-white hover:text-black transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>New Analysis</span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-3">
        <div className="mb-4">
          <h3 className="font-heading text-[10px] font-bold uppercase tracking-wider text-black/60 px-3 mb-2">
            Recent Analyses
          </h3>
          {loading ? (
            <div className="space-y-2 px-3 mt-4">
              <div className="h-4 w-5/6 bg-black/10 animate-pulse-slow"></div>
              <div className="h-4 w-3/4 bg-black/10 animate-pulse-slow"></div>
              <div className="h-4 w-4/5 bg-black/10 animate-pulse-slow"></div>
            </div>
          ) : sessions.length === 0 ? (
              <p className="px-3 py-4 font-body text-xs text-black/50 italic">
                No sessions yet
              </p>
          ) : (
            <div className="space-y-0.5">
              {sessions.map((s) => {
                const isActive = s.id === currentSessionId;
                return (
                  <Link
                    key={s.id}
                    href={`/session/${s.id}`}
                    className={`group flex items-center justify-between px-3 py-2 font-body text-xs transition-all duration-150 border ${
                      isActive
                        ? "border-black bg-white text-black"
                        : "border-transparent text-black/70 hover:border-black hover:text-black"
                    }`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden mr-2">
                      <MessageSquare className={`h-3.5 w-3.5 flex-shrink-0 ${isActive ? "text-black" : "text-black/40"}`} />
                      <span className="truncate">{s.title || "Untitled analysis"}</span>
                    </div>
                    <button
                      onClick={(e) => handleDeleteSession(e, s.id)}
                      className="opacity-0 group-hover:opacity-100 hover:text-retro-red p-0.5 transition-all"
                      title="Delete session"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-black p-4">
        <Link
          href="/dashboard"
          className="flex w-full items-center gap-3 px-3 py-2 font-body text-xs text-black/70 hover:text-black border border-transparent hover:border-black transition-colors"
        >
          <BarChart2 className="h-4 w-4" />
          <span>Go to Dashboard</span>
        </Link>
      </div>
    </aside>
  );
}
