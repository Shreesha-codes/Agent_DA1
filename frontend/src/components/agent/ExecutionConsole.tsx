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
        return "text-white bg-claude-success";
      case "timeout":
        return "text-white bg-claude-warning";
      default:
        return "text-white bg-claude-error";
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
    <div className="rounded-lg border border-claude-hairline bg-white overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-4 py-3 bg-claude-surface-soft hover:bg-claude-surface-card transition-all text-left"
      >
        <div className="flex flex-wrap items-center gap-2 font-body text-sm">
          <span className="flex items-center gap-1.5 font-medium text-claude-ink">
            <Terminal className="h-4 w-4" />
            <span>Sandbox Log</span>
          </span>
          <span className="text-claude-muted">|</span>
          <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium leading-none ${getStatusColor(log.status)}`}>
            {getStatusIcon(log.status)}
            <span>{log.status}</span>
          </span>
          {log.execution_ms && (
            <span className="flex items-center gap-1 text-claude-muted text-xs">
              <Clock className="h-3 w-3" />
              <span>{log.execution_ms} ms</span>
            </span>
          )}
          <span className="text-claude-muted-soft text-xs">Attempt {log.attempt_number}</span>
        </div>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-claude-muted" />
        ) : (
          <ChevronDown className="h-4 w-4 text-claude-muted" />
        )}
      </button>

      {isOpen && (
        <div className="border-t border-claude-hairline font-mono text-xs leading-relaxed bg-claude-surface-dark text-claude-on-dark">
          <div className="p-4 border-b border-claude-surface-dark-elevated">
            <div className="flex justify-between items-center text-[10px] uppercase tracking-wider text-claude-on-dark-soft mb-2">
              <span>Generated Code</span>
              <button 
                onClick={() => navigator.clipboard.writeText(log.generated_code)}
                className="hover:text-claude-on-dark transition-all"
              >
                Copy
              </button>
            </div>
            <pre className="overflow-x-auto text-claude-accent-teal p-3 bg-claude-surface-dark-soft rounded-md border border-claude-surface-dark-elevated">
              <code>{log.generated_code}</code>
            </pre>
          </div>

          {log.stdout && (
            <div className="p-4 border-b border-claude-surface-dark-elevated">
              <span className="block text-[10px] uppercase tracking-wider text-claude-on-dark-soft mb-2">Standard Output</span>
              <pre className="overflow-x-auto text-claude-on-dark p-3 bg-claude-surface-dark-soft rounded-md border border-claude-surface-dark-elevated">
                <code>{log.stdout}</code>
              </pre>
            </div>
          )}

          {log.stderr && (
            <div className="p-4">
              <span className="block text-[10px] uppercase tracking-wider text-claude-error/60 mb-2">Standard Error</span>
              <pre className="overflow-x-auto text-claude-accent-amber p-3 bg-claude-surface-dark-soft rounded-md border border-claude-error/20">
                <code>{log.stderr}</code>
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
