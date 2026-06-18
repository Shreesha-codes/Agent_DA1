"use client";

import { useEffect, useRef } from "react";
import { User, Sparkles } from "lucide-react";
import { Message } from "../../lib/types";
import { ChartRenderer } from "../agent/ChartRenderer";
import { ExecutionConsole } from "../agent/ExecutionConsole";

interface MessageListProps {
  messages: Message[];
  loading: boolean;
}

export function MessageList({ messages, loading }: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const renderTextContent = (text: string) => {
    return text.split("\n\n").map((para, pIdx) => {
      if (para.trim().startsWith("1.") || para.trim().startsWith("2.") || para.trim().startsWith("-")) {
        const items = para.split("\n");
        return (
          <ol key={pIdx} className="list-decimal pl-5 space-y-1 font-body text-sm text-claude-body mt-2 mb-3">
            {items.map((item, iIdx) => {
              const cleanItem = item.replace(/^\d+\.\s*|-\s*/, "");
              return <li key={iIdx} dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(cleanItem) }} />;
            })}
          </ol>
        );
      }
      return (
        <p
          key={pIdx}
          className="font-body text-sm text-claude-body leading-relaxed mb-3"
          dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(para) }}
        />
      );
    });
  };

  const formatInlineMarkdown = (text: string) => {
    let formatted = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    formatted = formatted.replace(/`(.*?)`/g, '<code class="bg-claude-surface-card px-1.5 font-mono text-xs text-claude-ink rounded border border-claude-hairline">$1</code>');
    return formatted;
  };

  return (
    <div className="space-y-6 px-4 py-6 max-w-4xl mx-auto">
      {messages.map((msg) => {
        const isUser = msg.role === "user";

        return (
          <div key={msg.id} className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
            <div className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${
              isUser ? "bg-claude-surface-card text-claude-ink border border-claude-hairline" : "bg-claude-primary text-white"
            }`}>
              {isUser ? <User className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
            </div>

            <div className={`flex-1 space-y-3 overflow-hidden max-w-[85%] ${isUser ? "items-end" : ""}`}>
              <div className="flex items-center gap-2">
                <span className="font-body text-xs font-medium text-claude-ink">
                  {isUser ? "You" : "Agent_DA Agent"}
                </span>
                <span className="font-body text-xs text-claude-muted-soft">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <div className={`rounded-lg border border-claude-hairline p-4 ${isUser ? "bg-claude-surface-card" : "bg-white"}`}>
                {renderTextContent(msg.content)}
              </div>

              {!isUser && msg.visualization && (
                <div className="rounded-lg border border-claude-hairline bg-white overflow-hidden">
                  <ChartRenderer visualization={msg.visualization} />
                </div>
              )}

              {!isUser && msg.execution_log && (
                <div>
                  <ExecutionConsole log={msg.execution_log} />
                </div>
              )}
            </div>
          </div>
        );
      })}

      {loading && (
        <div className="flex gap-3 max-w-lg">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-claude-primary text-white">
            <Sparkles className="h-4 w-4 animate-pulse-slow" />
          </div>
          <div className="flex-1 space-y-2">
            <span className="font-body text-xs font-medium text-claude-ink block">
              Agent_DA Agent is analyzing...
            </span>
            <div className="rounded-lg border border-claude-hairline p-4 bg-white space-y-2">
              <div className="h-3 w-5/6 bg-claude-surface-card rounded animate-pulse-slow"></div>
              <div className="h-3 w-4/5 bg-claude-surface-card rounded animate-pulse-slow"></div>
              <div className="h-3 w-3/4 bg-claude-surface-card rounded animate-pulse-slow"></div>
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
