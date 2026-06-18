"use client";

import Link from "next/link";
import { SignInButton, SignUpButton, useAuth } from "@clerk/nextjs";
import { BarChart3, Database, MessageSquare, ShieldCheck, Cpu, Search, Home, Server, Wrench } from "lucide-react";

export default function LandingPage() {
  const { isSignedIn } = useAuth();

  return (
    <div className="bg-white">
      {/* ─── TOP BANNER ─── */}
      <div className="bg-black text-white">
        <div className="flex items-center justify-between px-4 md:px-6 py-2.5">
          <div className="flex items-center gap-3">
            <Cpu className="h-4 w-4 text-retro-red" />
            <span className="font-heading text-xs font-bold uppercase tracking-wider leading-none">
              BUILD YOUR OWN ANALYSIS. ONLINE.
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="bg-retro-sticker-yellow text-black font-heading text-[10px] font-bold uppercase px-2 py-1 border border-white">
              BUY a DELL
            </div>
            <span className="font-heading text-xs font-bold text-retro-red leading-none">
              1-800-213-DELL
            </span>
          </div>
        </div>
      </div>

      {/* ─── HEADER BAR ─── */}
      <div className="flex items-center justify-between border-b border-black px-4 md:px-6 py-2.5">
        <div className="flex items-center gap-3">
          <BarChart3 className="h-5 w-5" />
          <span className="font-display text-sm font-black uppercase tracking-tight leading-none">Anton RAG</span>
          <span className="font-heading text-[10px] font-bold uppercase text-black bg-retro-sticker-yellow px-1.5 py-0.5 border border-black leading-none">
            V1.0
          </span>
        </div>
        <div className="flex items-center gap-4">
          {!isSignedIn ? (
            <>
              <SignInButton mode="modal">
                <button className="font-body text-xs text-retro-link underline hover:text-black transition-colors">
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton mode="modal">
                <button className="bg-black text-white font-heading text-[10px] font-bold uppercase px-3 py-1.5 border border-black hover:bg-white hover:text-black transition-colors leading-none">
                  Get Started
                </button>
              </SignUpButton>
            </>
          ) : (
            <Link
              href="/dashboard"
              className="bg-black text-white font-heading text-[10px] font-bold uppercase px-3 py-1.5 border border-black hover:bg-white hover:text-black transition-colors leading-none"
            >
              Dashboard &rarr;
            </Link>
          )}
        </div>
      </div>

      {/* ─── TWO-COLUMN MAIN ─── */}
      <div className="flex flex-col md:flex-row">
        {/* LEFT RAIL */}
        <div className="w-full md:w-72 border-r border-black flex-shrink-0">
          {/* Red CTA Panel */}
          <div className="bg-retro-red text-white p-4 md:p-5 border-b border-black">
            <p className="font-body text-sm leading-relaxed text-white/90">
              At Anton RAG, we&apos;ll help you find the right analysis, configure it, execute it, and visualize it.
            </p>
          </div>

          {/* Icon-Label Nav Grid */}
          <div className="grid grid-cols-2">
            <div className="flex flex-col items-center justify-center border-r border-b border-black p-4 md:p-5">
              <Search className="h-6 w-6 mb-1.5" />
              <span className="font-heading text-[10px] font-bold uppercase tracking-wider">FIND</span>
            </div>
            <div className="flex flex-col items-center justify-center border-b border-black p-4 md:p-5">
              <Home className="h-6 w-6 mb-1.5" />
              <span className="font-heading text-[10px] font-bold uppercase tracking-wider">HOME</span>
            </div>
            <div className="flex flex-col items-center justify-center border-r border-black p-4 md:p-5">
              <Server className="h-6 w-6 mb-1.5" />
              <span className="font-heading text-[10px] font-bold uppercase tracking-wider">STORE</span>
            </div>
            <div className="flex flex-col items-center justify-center p-4 md:p-5">
              <Wrench className="h-6 w-6 mb-1.5" />
              <span className="font-heading text-[10px] font-bold uppercase tracking-wider">SERVICE</span>
            </div>
          </div>

          {/* Round Award Seal */}
          <div className="flex justify-center border-b border-black py-5 px-4">
            <div className="h-16 w-16 rounded-full bg-retro-red flex items-center justify-center border-2 border-black">
              <div className="text-center">
                <span className="font-heading text-[6px] font-bold text-white uppercase block leading-tight">PC Mag</span>
                <span className="font-heading text-[6px] font-bold text-white uppercase block leading-tight">Readers</span>
                <span className="font-heading text-[6px] font-bold text-white uppercase block leading-tight">Choice</span>
              </div>
            </div>
          </div>

          {/* Auth CTA */}
          <div className="p-4 md:p-5 text-center border-b border-black">
            {!isSignedIn ? (
              <SignUpButton mode="modal">
                <button className="w-full bg-black text-white font-heading text-[10px] font-bold uppercase py-2.5 border border-black hover:bg-white hover:text-black transition-colors">
                  Start Analyzing Now
                </button>
              </SignUpButton>
            ) : (
              <Link
                href="/dashboard"
                className="block w-full bg-black text-white font-heading text-[10px] font-bold uppercase py-2.5 border border-black hover:bg-white hover:text-black transition-colors text-center"
              >
                Go to Dashboard
              </Link>
            )}
          </div>
        </div>

        {/* RIGHT CONTENT COLUMN */}
        <div className="flex-1">
          {/* Section Eyebrow — DATA ANALYZER */}
          <div className="bg-retro-olive text-black px-4 md:px-6 py-5 md:py-6 border-b border-black">
            <h2 className="font-display text-2xl md:text-3xl font-black uppercase leading-none">
              DATA ANALYZER
            </h2>
          </div>

          {/* Ribbon Card — Flexible Ingestion */}
          <div className="border-b border-black">
            <div className="bg-white px-4 md:px-6 py-1.5 border-b border-black">
              <h3 className="font-heading text-xs font-bold uppercase">FLEXIBLE INGESTION</h3>
            </div>
            <div className="bg-retro-sage px-4 md:px-6 py-4 flex items-start gap-4">
              <Database className="h-8 w-8 flex-shrink-0 mt-0.5" />
              <p className="font-body text-sm leading-relaxed">
                Support for CSV, Excel, and JSON files, or live read-only PostgreSQL connections. Full automatic statistical schema profiling upon load.
              </p>
            </div>
          </div>

          {/* Ribbon Card — Conversational Context */}
          <div className="border-b border-black relative">
            <div className="absolute -right-2 -top-2 z-10">
              <div className="bg-retro-sticker-yellow text-black font-heading text-[10px] font-bold uppercase px-2 py-1 border border-black rotate-burst">
                NEW!
              </div>
            </div>
            <div className="bg-white px-4 md:px-6 py-1.5 border-b border-black">
              <h3 className="font-heading text-xs font-bold uppercase">CONVERSATIONAL CONTEXT</h3>
            </div>
            <div className="bg-retro-peach px-4 md:px-6 py-4 flex items-start gap-4">
              <MessageSquare className="h-8 w-8 flex-shrink-0 mt-0.5" />
              <p className="font-body text-sm leading-relaxed">
                Ask follow-up questions naturally. The agent remembers the previous code, findings narratives, and data schema across the session.
              </p>
            </div>
          </div>

          {/* Ribbon Card — Isolated Sandbox */}
          <div className="border-b border-black">
            <div className="bg-white px-4 md:px-6 py-1.5 border-b border-black">
              <h3 className="font-heading text-xs font-bold uppercase">ISOLATED SANDBOX</h3>
            </div>
            <div className="bg-retro-periwinkle px-4 md:px-6 py-4 flex items-start gap-4">
              <ShieldCheck className="h-8 w-8 flex-shrink-0 mt-0.5" />
              <p className="font-body text-sm leading-relaxed">
                All generated code executes in a locked-down, network-less Docker container, memory-capped to protect your system.
              </p>
            </div>
          </div>

          {/* Section Eyebrow — CONNECT */}
          <div className="bg-retro-salmon text-black px-4 md:px-6 py-5 md:py-6 border-b border-black">
            <h2 className="font-display text-2xl md:text-3xl font-black uppercase leading-none">
              CONNECT
            </h2>
          </div>

          {/* Ribbon Card — Enterprise Security */}
          <div className="border-b border-black">
            <div className="bg-white px-4 md:px-6 py-1.5 border-b border-black">
              <h3 className="font-heading text-xs font-bold uppercase">ENTERPRISE SECURITY</h3>
            </div>
            <div className="bg-retro-sky px-4 md:px-6 py-4 flex items-start gap-4">
              <ShieldCheck className="h-8 w-8 flex-shrink-0 mt-0.5" />
              <p className="font-body text-sm leading-relaxed">
                Your data never leaves your infrastructure. Code execution is isolated dynamically, preventing data contamination and unauthorized access.
              </p>
            </div>
          </div>

          {/* Red CTA Panel (right side version) */}
          <div className="bg-retro-red text-white px-4 md:px-6 py-4 border-b border-black">
            <div className="max-w-2xl">
              <h3 className="font-display text-lg md:text-xl font-black uppercase leading-tight mb-2">
                ENTERPRISE SECURITY. NO DATA LEAKAGE.
              </h3>
              <p className="font-body text-sm leading-relaxed text-white/80 mb-4">
                Your data never leaves your infrastructure. Code execution is isolated dynamically.
              </p>
              <Link
                href="/dashboard"
                className="inline-block bg-white text-retro-red font-heading text-[10px] font-bold uppercase px-4 py-2 border border-white hover:bg-transparent hover:text-white transition-colors leading-none"
              >
                Try It Now &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ─── FOOTER ICON-NAV ROW ─── */}
      <div className="border-b border-black">
        <div className="flex items-center justify-center gap-0">
          <div className="flex-1 flex flex-col items-center justify-center border-r border-black py-4 px-2">
            <Search className="h-5 w-5 mb-1" />
            <span className="font-heading text-[9px] font-bold uppercase tracking-wider">FIND</span>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center border-r border-black py-4 px-2">
            <Home className="h-5 w-5 mb-1" />
            <span className="font-heading text-[9px] font-bold uppercase tracking-wider">HOME</span>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center border-r border-black py-4 px-2">
            <Server className="h-5 w-5 mb-1" />
            <span className="font-heading text-[9px] font-bold uppercase tracking-wider">STORE</span>
          </div>
          <div className="flex-1 flex flex-col items-center justify-center py-4 px-2">
            <Wrench className="h-5 w-5 mb-1" />
            <span className="font-heading text-[9px] font-bold uppercase tracking-wider">SERVICE</span>
          </div>
        </div>
      </div>

      {/* ─── FOOTER LINKS ─── */}
      <div className="px-4 md:px-6 py-5">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <a href="#" className="font-body text-xs text-retro-link underline hover:text-black transition-colors">
            Copyright &copy; {new Date().getFullYear()} Anton RAG. All rights reserved.
          </a>
          <div className="flex gap-4 font-body text-xs">
            <a href="#" className="text-retro-link underline hover:text-black transition-colors">Privacy Policy</a>
            <a href="#" className="text-retro-link underline hover:text-black transition-colors">Terms of Use</a>
            <a href="#" className="text-retro-link underline hover:text-black transition-colors">Security Sandbox</a>
          </div>
        </div>
      </div>

      {/* ─── BROWSER COMPAT NOTE ─── */}
      <div className="border-t border-black px-4 md:px-6 py-2 text-center">
        <p className="font-body text-[9px] text-black/30">
          This site is best viewed with browser versions 3.0 and higher.
        </p>
      </div>
    </div>
  );
}
