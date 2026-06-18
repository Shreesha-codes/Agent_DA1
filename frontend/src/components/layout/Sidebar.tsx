"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { MessageSquare, Plus, ChevronLeft, ChevronRight, BarChart3, Trash2 } from "lucide-react";
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

  const fetchSessions = useCallback(async () => {
    try {
      const data = await api.sessions.list(getToken);
      setSessions(data.sessions);
    } catch (err) {
      console.error("Failed to load sessions in sidebar:", err);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions, pathname]);

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
      <aside className="relative flex h-[calc(100vh-4rem)] w-14 flex-col items-center border-r border-claude-hairline bg-claude-canvas py-4">
        <button
          onClick={() => setCollapsed(false)}
          className="absolute -right-3 top-4 flex h-6 w-6 items-center justify-center rounded-md border border-claude-hairline bg-white hover:bg-claude-surface-card"
        >
          <ChevronRight className="h-3 w-3 text-claude-muted" />
        </button>
        <Link
          href="/data/upload"
          className="flex h-9 w-9 items-center justify-center rounded-md bg-claude-primary text-white hover:bg-claude-primary-active"
          title="New Analysis"
        >
          <Plus className="h-4 w-4" />
        </Link>
        <div className="mt-8 flex flex-col gap-4">
          <Link href="/dashboard" className="text-claude-muted hover:text-claude-ink" title="Dashboard">
            <BarChart3 className="h-5 w-5" />
          </Link>
        </div>
      </aside>
    );
  }

  return (
    <aside className="relative flex h-[calc(100vh-4rem)] w-64 flex-col border-r border-claude-hairline bg-claude-canvas">
      <button
        onClick={() => setCollapsed(true)}
        className="absolute -right-3 top-4 z-10 flex h-6 w-6 items-center justify-center rounded-md border border-claude-hairline bg-white hover:bg-claude-surface-card"
      >
        <ChevronLeft className="h-3 w-3 text-claude-muted" />
      </button>

      <div className="p-4 border-b border-claude-hairline">
        <Link
          href="/data/upload"
          className="flex w-full items-center justify-center gap-2 bg-claude-primary text-white font-body text-sm font-medium py-2.5 rounded-md hover:bg-claude-primary-active transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>New Analysis</span>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className="mb-4">
          <h3 className="font-body text-xs font-medium text-claude-muted uppercase tracking-wider px-3 mb-2">
            Recent Analyses
          </h3>
          {loading ? (
            <div className="space-y-2 px-3 mt-4">
              <div className="h-4 w-5/6 bg-claude-hairline rounded animate-pulse-slow"></div>
              <div className="h-4 w-3/4 bg-claude-hairline rounded animate-pulse-slow"></div>
              <div className="h-4 w-4/5 bg-claude-hairline rounded animate-pulse-slow"></div>
            </div>
          ) : sessions.length === 0 ? (
            <p className="px-3 py-4 font-body text-sm text-claude-muted italic">No sessions yet</p>
          ) : (
            <div className="space-y-0.5">
              {sessions.map((s) => {
                const isActive = s.id === currentSessionId;
                return (
                  <Link
                    key={s.id}
                    href={`/session/${s.id}`}
                    className={`group flex items-center justify-between px-3 py-2 rounded-md font-body text-sm transition-colors ${
                      isActive
                        ? "bg-claude-surface-card text-claude-ink"
                        : "text-claude-muted hover:bg-claude-surface-soft hover:text-claude-ink"
                    }`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden mr-2">
                      <MessageSquare className={`h-3.5 w-3.5 flex-shrink-0 ${isActive ? "text-claude-primary" : "text-claude-muted"}`} />
                      <span className="truncate">{s.title || "Untitled analysis"}</span>
                    </div>
                    <button
                      onClick={(e) => handleDeleteSession(e, s.id)}
                      className="opacity-0 group-hover:opacity-100 text-claude-muted hover:text-claude-error p-0.5 transition-all"
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

      <div className="border-t border-claude-hairline p-4">
        <Link
          href="/dashboard"
          className="flex w-full items-center gap-3 px-3 py-2 rounded-md font-body text-sm text-claude-muted hover:text-claude-ink hover:bg-claude-surface-soft transition-colors"
        >
          <BarChart3 className="h-4 w-4" />
          <span>Dashboard</span>
        </Link>
      </div>
    </aside>
  );
}
