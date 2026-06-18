"use client";

import Link from "next/link";
import { SignInButton, SignUpButton, useAuth } from "@clerk/nextjs";
import { BarChart3, Database, MessageSquare, Shield, Cpu, ChevronRight } from "lucide-react";

export default function LandingPage() {
  const { isSignedIn } = useAuth();

  return (
    <div className="min-h-screen bg-claude-canvas">
      {/* Top Nav */}
      <header className="border-b border-claude-hairline bg-claude-canvas">
        <div className="flex h-16 items-center justify-between px-4 md:px-6 max-w-7xl mx-auto">
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-md bg-claude-primary flex items-center justify-center">
              <BarChart3 className="h-4 w-4 text-white" />
            </div>
            <span className="font-display text-[22px] font-normal leading-none text-claude-ink tracking-tight">Agent_DA</span>
          </div>
          <nav className="hidden md:flex items-center gap-6">
            <a href="#features" className="font-body text-sm text-claude-body hover:text-claude-ink">Features</a>
            <a href="#about" className="font-body text-sm text-claude-body hover:text-claude-ink">About</a>
            {!isSignedIn ? (
              <div className="flex items-center gap-3 pl-3 border-l border-claude-hairline">
                <SignInButton mode="modal">
                  <button className="font-body text-sm text-claude-body hover:text-claude-ink">Sign in</button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="font-body text-sm font-medium text-white bg-claude-primary px-4 py-2 rounded-md hover:bg-claude-primary-active transition-colors leading-none">
                    Try Agent_DA
                  </button>
                </SignUpButton>
              </div>
            ) : (
              <div className="flex items-center gap-3 pl-3 border-l border-claude-hairline">
                <Link
                  href="/dashboard"
                  className="font-body text-sm font-medium text-white bg-claude-primary px-4 py-2 rounded-md hover:bg-claude-primary-active transition-colors leading-none"
                >
                  Dashboard
                </Link>
              </div>
            )}
          </nav>
        </div>
      </header>

      {/* Hero Band */}
      <section className="border-b border-claude-hairline">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="font-body text-xs font-medium text-claude-primary uppercase tracking-wider mb-4 block">
                Conversational Data Analysis
              </span>
              <h1 className="font-display text-display-lg text-claude-ink mb-6">
                Meet your data analysis agent
              </h1>
              <p className="font-body text-lg text-claude-body leading-relaxed mb-8 max-w-lg">
                Ask your database or spreadsheets anything in plain English. Agent_DA writes code, executes it in a secure sandbox, and returns interactive charts and narratives.
              </p>
              <div className="flex flex-wrap gap-4">
                <SignUpButton mode="modal">
                  <button className="font-body text-sm font-medium text-white bg-claude-primary px-6 py-3 rounded-md hover:bg-claude-primary-active transition-colors">
                    Start Analyzing
                  </button>
                </SignUpButton>
                <a href="#features" className="font-body text-sm font-medium text-claude-ink px-6 py-3 rounded-md border border-claude-hairline hover:bg-claude-surface-soft transition-colors">
                  Learn more
                </a>
              </div>
            </div>
            <div className="bg-claude-surface-card rounded-xl p-8 border border-claude-hairline">
              <div className="bg-claude-surface-dark rounded-lg p-5 border border-claude-surface-dark-elevated">
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex gap-1.5">
                    <div className="h-2.5 w-2.5 rounded-full bg-claude-error"></div>
                    <div className="h-2.5 w-2.5 rounded-full bg-claude-warning"></div>
                    <div className="h-2.5 w-2.5 rounded-full bg-claude-success"></div>
                  </div>
                  <span className="font-mono text-[10px] text-claude-on-dark-soft ml-2">analysis_sandbox</span>
                </div>
                <pre className="font-mono text-xs text-claude-on-dark leading-relaxed">
                  <span className="text-claude-accent-teal">import</span> pandas <span className="text-claude-accent-teal">as</span> pd<br/>
                  df = pd.read_csv(<span className="text-claude-accent-amber">&quot;sales_data.csv&quot;</span>)<br/>
                  df.groupby(<span className="text-claude-accent-amber">&quot;region&quot;</span>)[<span className="text-claude-accent-amber">&quot;revenue&quot;</span>].sum()<br/><br/>
                  <span className="text-claude-success"># Returns: Region A $245K, Region B $189K</span>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards */}
      <section id="features" className="border-b border-claude-hairline">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-24">
          <div className="text-center mb-16">
            <span className="font-body text-xs font-medium text-claude-primary uppercase tracking-wider">Features</span>
            <h2 className="font-display text-display-md text-claude-ink mt-3">Built for data teams</h2>
            <p className="font-body text-lg text-claude-body mt-4 max-w-2xl mx-auto">
              From ingestion to visualization, Agent_DA handles the full analytical workflow.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-claude-surface-card rounded-lg p-8 border border-claude-hairline">
              <div className="h-10 w-10 rounded-md bg-claude-primary/10 flex items-center justify-center mb-5">
                <Database className="h-5 w-5 text-claude-primary" />
              </div>
              <h3 className="font-display text-display-sm text-claude-ink mb-3">Flexible Ingestion</h3>
              <p className="font-body text-base text-claude-body leading-relaxed">
                Support for CSV, Excel, and JSON files, or live read-only PostgreSQL connections. Automatic schema profiling upon load.
              </p>
            </div>

            <div className="bg-claude-surface-card rounded-lg p-8 border border-claude-hairline relative">
              <span className="absolute top-4 right-4 font-body text-[11px] font-medium text-white bg-claude-primary px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                New
              </span>
              <div className="h-10 w-10 rounded-md bg-claude-primary/10 flex items-center justify-center mb-5">
                <MessageSquare className="h-5 w-5 text-claude-primary" />
              </div>
              <h3 className="font-display text-display-sm text-claude-ink mb-3">Conversational Context</h3>
              <p className="font-body text-base text-claude-body leading-relaxed">
                Ask follow-up questions naturally. The agent remembers previous code, findings, and schema across the session.
              </p>
            </div>

            <div className="bg-claude-surface-card rounded-lg p-8 border border-claude-hairline">
              <div className="h-10 w-10 rounded-md bg-claude-primary/10 flex items-center justify-center mb-5">
                <Shield className="h-5 w-5 text-claude-primary" />
              </div>
              <h3 className="font-display text-display-sm text-claude-ink mb-3">Isolated Sandbox</h3>
              <p className="font-body text-base text-claude-body leading-relaxed">
                All generated code executes in a locked-down, network-less Docker container, memory-capped to protect your system.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Dark Mockup Band */}
      <section id="about" className="border-b border-claude-hairline">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="font-display text-display-md text-claude-ink mb-6">
                Enterprise security. No data leakage.
              </h2>
              <p className="font-body text-lg text-claude-body leading-relaxed mb-8">
                Your data never leaves your infrastructure. Code execution is isolated dynamically, preventing data contamination and unauthorized access.
              </p>
              <Link
                href={isSignedIn ? "/dashboard" : "/sign-up"}
                className="inline-flex items-center gap-2 font-body text-sm font-medium text-claude-primary hover:text-claude-primary-active transition-colors"
              >
                Start analyzing your data <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="bg-claude-surface-dark rounded-xl p-8 border border-claude-surface-dark-elevated">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-claude-error"></div>
                  <div className="h-2.5 w-2.5 rounded-full bg-claude-warning"></div>
                  <div className="h-2.5 w-2.5 rounded-full bg-claude-success"></div>
                </div>
                <span className="font-mono text-[10px] text-claude-on-dark-soft ml-2">docker_sandbox</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-claude-surface-dark-soft rounded-lg p-4">
                  <span className="font-mono text-[10px] text-claude-accent-teal uppercase tracking-wider">CPU</span>
                  <p className="font-mono text-sm text-claude-on-dark mt-1">1 core</p>
                </div>
                <div className="bg-claude-surface-dark-soft rounded-lg p-4">
                  <span className="font-mono text-[10px] text-claude-accent-teal uppercase tracking-wider">Memory</span>
                  <p className="font-mono text-sm text-claude-on-dark mt-1">512 MB</p>
                </div>
                <div className="bg-claude-surface-dark-soft rounded-lg p-4">
                  <span className="font-mono text-[10px] text-claude-accent-teal uppercase tracking-wider">Network</span>
                  <p className="font-mono text-sm text-claude-on-dark mt-1">Isolated</p>
                </div>
                <div className="bg-claude-surface-dark-soft rounded-lg p-4">
                  <span className="font-mono text-[10px] text-claude-accent-teal uppercase tracking-wider">Timeout</span>
                  <p className="font-mono text-sm text-claude-on-dark mt-1">60s</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Coral CTA Band */}
      <section className="border-b border-claude-hairline">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-16 md:py-20">
          <div className="bg-claude-primary rounded-xl p-10 md:p-16 text-center">
            <h2 className="font-display text-display-sm text-white mb-4">
              Ready to analyze your data?
            </h2>
            <p className="font-body text-lg text-white/80 mb-8 max-w-lg mx-auto">
              Connect a dataset and start asking questions in plain English. No setup required.
            </p>
            <SignUpButton mode="modal">
              <button className="font-body text-sm font-medium text-claude-primary bg-white px-8 py-3 rounded-md hover:bg-claude-hairline transition-colors">
                Get Started Free
              </button>
            </SignUpButton>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-claude-surface-dark">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-12 md:py-16">
          <div className="grid md:grid-cols-4 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="h-6 w-6 rounded-md bg-claude-primary flex items-center justify-center">
                  <BarChart3 className="h-3.5 w-3.5 text-white" />
                </div>
                <span className="font-display text-lg text-claude-on-dark tracking-tight">Agent_DA</span>
              </div>
              <p className="font-body text-sm text-claude-on-dark-soft leading-relaxed">
                Conversational data analysis for modern teams.
              </p>
            </div>
            <div>
              <h4 className="font-body text-xs font-medium text-claude-on-dark uppercase tracking-wider mb-4">Product</h4>
              <div className="space-y-2.5">
                <a href="#" className="block font-body text-sm text-claude-on-dark-soft hover:text-claude-on-dark">Features</a>
                <a href="#" className="block font-body text-sm text-claude-on-dark-soft hover:text-claude-on-dark">Pricing</a>
                <a href="#" className="block font-body text-sm text-claude-on-dark-soft hover:text-claude-on-dark">Documentation</a>
              </div>
            </div>
            <div>
              <h4 className="font-body text-xs font-medium text-claude-on-dark uppercase tracking-wider mb-4">Company</h4>
              <div className="space-y-2.5">
                <a href="#" className="block font-body text-sm text-claude-on-dark-soft hover:text-claude-on-dark">About</a>
                <a href="#" className="block font-body text-sm text-claude-on-dark-soft hover:text-claude-on-dark">Blog</a>
                <a href="#" className="block font-body text-sm text-claude-on-dark-soft hover:text-claude-on-dark">Contact</a>
              </div>
            </div>
            <div>
              <h4 className="font-body text-xs font-medium text-claude-on-dark uppercase tracking-wider mb-4">Legal</h4>
              <div className="space-y-2.5">
                <a href="#" className="block font-body text-sm text-claude-on-dark-soft hover:text-claude-on-dark">Privacy Policy</a>
                <a href="#" className="block font-body text-sm text-claude-on-dark-soft hover:text-claude-on-dark">Terms of Use</a>
                <a href="#" className="block font-body text-sm text-claude-on-dark-soft hover:text-claude-on-dark">Security</a>
              </div>
            </div>
          </div>
          <div className="border-t border-claude-surface-dark-elevated pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="font-body text-xs text-claude-on-dark-soft">
              &copy; {new Date().getFullYear()} Agent_DA. All rights reserved.
            </p>
            <p className="font-body text-xs text-claude-on-dark-soft/50">
              Built with Anthropic&apos;s Claude design language
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
