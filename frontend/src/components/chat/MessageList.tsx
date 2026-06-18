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
          <ol key={pIdx} className="list-decimal pl-5 space-y-1.5 font-body text-xs text-black mt-2 mb-3">
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
          className="font-body text-xs text-black leading-relaxed mb-3.5"
          dangerouslySetInnerHTML={{ __html: formatInlineMarkdown(para) }}
        />
      );
    });
  };

  const formatInlineMarkdown = (text: string) => {
    let formatted = text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    formatted = formatted.replace(/`(.*?)`/g, '<code class="bg-black/10 px-1 font-mono text-[10px] text-black border border-black">$1</code>');
    return formatted;
  };

  return (
    <div className="space-y-6 px-4 py-6">
      {messages.map((msg) => {
        const isUser = msg.role === "user";

        return (
          <div key={msg.id} className={`flex gap-3 max-w-4xl ${isUser ? "ml-auto flex-row-reverse" : "mr-auto"}`}>
            <div className={`flex h-7 w-7 flex-shrink-0 items-center justify-center border border-black ${
              isUser ? "bg-white text-black" : "bg-black text-white"
            }`}>
              {isUser ? <User className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
            </div>

            <div className="flex-1 space-y-3 overflow-hidden">
              <div className="flex items-center gap-2">
                <span className="font-heading text-[10px] font-bold uppercase text-black">
                  {isUser ? "You" : "Anton Agent"}
                </span>
                <span className="font-body text-[9px] text-black/40">
                  {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>

              <div className={`border border-black p-3 ${isUser ? "bg-black/5" : "bg-white"}`}>
                {renderTextContent(msg.content)}
              </div>

              {!isUser && msg.visualization && (
                <div className="border border-black bg-white">
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
        <div className="flex gap-3 max-w-md mr-auto">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center border border-black bg-black text-white">
            <Sparkles className="h-3.5 w-3.5 animate-pulse-slow" />
          </div>
          <div className="flex-1 space-y-2">
            <span className="font-heading text-[10px] font-bold uppercase text-black block">
              Anton Agent is analyzing...
            </span>
            <div className="border border-black p-3 bg-white space-y-2">
              <div className="h-3 w-5/6 bg-black/10 animate-pulse-slow"></div>
              <div className="h-3 w-4/5 bg-black/10 animate-pulse-slow"></div>
              <div className="h-3 w-3/4 bg-black/10 animate-pulse-slow"></div>
            </div>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
