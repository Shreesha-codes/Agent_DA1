"use client";

import { useState } from "react";
import { Terminal, ChevronDown, ChevronUp, CheckCircle2, XCircle, AlertTriangle, Clock } from "lucide-react";
import { ExecutionLog } from "../../lib/types";

interface ExecutionConsoleProps {
  log: ExecutionLog;
}

export function ExecutionConsole({ log }: ExecutionConsoleProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "text-black bg-retro-sage border-black";
      case "timeout":
        return "text-black bg-retro-peach border-black";
      default:
        return "text-white bg-retro-red border-black";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle2 className="h-3.5 w-3.5" />;
      case "timeout":
        return <AlertTriangle className="h-3.5 w-3.5" />;
      default:
        return <XCircle className="h-3.5 w-3.5" />;
    }
  };

  return (
    <div className="border border-black bg-white">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-3 py-2.5 bg-black/5 hover:bg-black/10 transition-all text-left"
      >
        <div className="flex flex-wrap items-center gap-2 font-heading text-[10px] uppercase tracking-wider">
          <span className="flex items-center gap-1 font-bold text-black">
            <Terminal className="h-3 w-3" />
            <span>Sandbox Log</span>
          </span>
          <span className="text-black/30 font-normal">|</span>
          <span className={`flex items-center gap-1 border px-1.5 py-0.5 font-bold leading-none ${getStatusColor(log.status)}`}>
            {getStatusIcon(log.status)}
            <span>{log.status}</span>
          </span>
          {log.execution_ms && (
            <span className="flex items-center gap-1 text-black/50">
              <Clock className="h-2.5 w-2.5" />
              <span>{log.execution_ms} ms</span>
            </span>
          )}
          <span className="text-black/40">Attempt {log.attempt_number}</span>
        </div>
        {isOpen ? (
          <ChevronUp className="h-3.5 w-3.5 text-black/50" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-black/50" />
        )}
      </button>

      {isOpen && (
        <div className="border-t border-black font-mono text-[11px] leading-relaxed bg-[#0f0f12] text-[#e3e3e6]">
          <div className="p-3 border-b border-white/10">
            <div className="flex justify-between items-center text-[9px] uppercase tracking-wider text-white/40 mb-1.5">
              <span>Generated Code</span>
              <button 
                onClick={() => navigator.clipboard.writeText(log.generated_code)}
                className="hover:text-white transition-all"
              >
                Copy
              </button>
            </div>
            <pre className="overflow-x-auto text-[#a8ffb2] p-2 bg-black/30 border border-white/5">
              <code>{log.generated_code}</code>
            </pre>
          </div>

          {log.stdout && (
            <div className="p-3 border-b border-white/10">
              <span className="block text-[9px] uppercase tracking-wider text-white/40 mb-1.5">Standard Output</span>
              <pre className="overflow-x-auto text-white p-2 bg-black/30 border border-white/5">
                <code>{log.stdout}</code>
              </pre>
            </div>
          )}

          {log.stderr && (
            <div className="p-3">
              <span className="block text-[9px] uppercase tracking-wider text-retro-red/60 mb-1.5">Standard Error</span>
              <pre className="overflow-x-auto text-retro-peach p-2 bg-[#1c0c0d] border border-retro-red/20">
                <code>{log.stderr}</code>
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
