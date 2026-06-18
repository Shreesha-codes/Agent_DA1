"use client";

import { TopNav } from "./TopNav";
import { Sidebar } from "./Sidebar";

interface PageShellProps {
  children: React.ReactNode;
  currentSessionId?: string;
  onSessionDeleted?: () => void;
}

export function PageShell({ children, currentSessionId, onSessionDeleted }: PageShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      <TopNav />
      <div className="flex flex-1 overflow-hidden border-t border-black">
        <Sidebar currentSessionId={currentSessionId} onSessionDeleted={onSessionDeleted} />
        <main className="flex-1 overflow-y-auto bg-white border-l border-black">
          {children}
        </main>
      </div>
    </div>
  );
}
