"use client";

import Link from "next/link";
import { UserButton, useAuth } from "@clerk/nextjs";
import { Database, BarChart3, Menu, X } from "lucide-react";
import { useState } from "react";

export function TopNav() {
  const { isSignedIn } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="bg-claude-canvas border-b border-claude-hairline">
      <div className="flex h-16 items-center justify-between px-4 md:px-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-md bg-claude-primary flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
            <span className="font-display text-[22px] font-normal leading-none text-claude-ink tracking-tight">
              Agent_DA
            </span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-6">
          <Link href="/dashboard" className="font-body text-sm text-claude-body hover:text-claude-ink transition-colors">
            Dashboard
          </Link>
          <Link href="/data/upload" className="font-body text-sm text-claude-body hover:text-claude-ink transition-colors">
            Connect Data
          </Link>
          {isSignedIn ? (
            <div className="flex items-center gap-3 pl-3 border-l border-claude-hairline">
              <Link
                href="/data/upload"
                className="font-body text-sm font-medium text-white bg-claude-primary px-4 py-2 rounded-md hover:bg-claude-primary-active transition-colors leading-none"
              >
                + New Analysis
              </Link>
              <UserButton
                appearance={{
                  elements: {
                    avatarBox: "h-8 w-8 rounded-full border border-claude-hairline"
                  }
                }}
              />
            </div>
          ) : (
            <div className="flex items-center gap-3 pl-3 border-l border-claude-hairline">
              <Link href="/sign-in" className="font-body text-sm text-claude-body hover:text-claude-ink transition-colors">
                Sign in
              </Link>
              <Link
                href="/sign-up"
                className="font-body text-sm font-medium text-white bg-claude-primary px-4 py-2 rounded-md hover:bg-claude-primary-active transition-colors leading-none"
              >
                Try Agent_DA
              </Link>
            </div>
          )}
        </nav>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 text-claude-muted hover:text-claude-ink"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-claude-hairline bg-claude-canvas px-4 py-4 space-y-3">
          <Link href="/dashboard" className="block font-body text-sm text-claude-body py-1">Dashboard</Link>
          <Link href="/data/upload" className="block font-body text-sm text-claude-body py-1">Connect Data</Link>
          {isSignedIn ? (
            <Link href="/data/upload" className="block font-body text-sm font-medium text-white bg-claude-primary px-4 py-2 rounded-md text-center">
              + New Analysis
            </Link>
          ) : (
            <div className="flex gap-3 pt-2">
              <Link href="/sign-in" className="flex-1 text-center font-body text-sm text-claude-body border border-claude-hairline px-4 py-2 rounded-md">
                Sign in
              </Link>
              <Link href="/sign-up" className="flex-1 text-center font-body text-sm font-medium text-white bg-claude-primary px-4 py-2 rounded-md">
                Try Agent_DA
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
