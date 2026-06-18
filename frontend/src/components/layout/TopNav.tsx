"use client";

import Link from "next/link";
import { UserButton, useAuth } from "@clerk/nextjs";
import { Database, BarChart3 } from "lucide-react";

export function TopNav() {
  const { isSignedIn } = useAuth();
  return (
    <header className="bg-white">
      <div className="flex h-11 items-center justify-between px-4 md:px-6 border-b border-black">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="flex items-center gap-2 font-heading text-xs font-bold uppercase tracking-tight text-black leading-none">
            <BarChart3 className="h-4 w-4" />
            <span>Anton RAG</span>
            <span className="font-heading text-[9px] font-bold uppercase leading-none text-black bg-retro-sticker-yellow px-1.5 py-0.5 border border-black">
              V1.0
            </span>
          </Link>
        </div>
        
        <nav className="flex items-center gap-3">
          <Link
            href="/data/upload"
            className="flex items-center gap-1.5 bg-white text-black font-heading text-[10px] font-bold uppercase px-2.5 py-1.5 border border-black hover:bg-black hover:text-white transition-colors leading-none"
          >
            <Database className="h-3 w-3" />
            <span>Connect Data</span>
          </Link>
          {isSignedIn && (
            <div className="flex items-center justify-center pl-3 border-l border-black">
              <UserButton 
                appearance={{
                  elements: {
                    avatarBox: "h-6 w-6 border border-black rounded-none"
                  }
                }}
              />
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
