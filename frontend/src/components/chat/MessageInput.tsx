"use client";

import React, { useState, useRef, useEffect } from "react";
import { ArrowUp } from "lucide-react";

interface MessageInputProps {
  onSendMessage: (text: string) => void;
  disabled: boolean;
  placeholder?: string;
}

export function MessageInput({ onSendMessage, disabled, placeholder = "Ask a question about your dataset..." }: MessageInputProps) {
  const [text, setText] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [text]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || disabled) return;
    onSendMessage(text.trim());
    setText("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative rounded-lg border border-claude-hairline bg-white px-4 py-3 focus-within:border-claude-primary focus-within:ring-1 focus-within:ring-claude-primary/20 transition-all">
      <textarea
        ref={textareaRef}
        rows={1}
        placeholder={placeholder}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        className="w-full resize-none bg-transparent font-body text-sm text-claude-ink placeholder-claude-muted-soft outline-none disabled:opacity-50 pr-12 min-h-[22px] max-h-[180px] overflow-y-auto"
      />

      <div className="absolute right-3 bottom-3 flex items-center gap-2">
        <button
          type="submit"
          disabled={!text.trim() || disabled}
          className="flex h-8 w-8 items-center justify-center rounded-md bg-claude-primary text-white hover:bg-claude-primary-active transition-colors disabled:opacity-30 disabled:hover:bg-claude-primary"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      </div>
    </form>
  );
}
