import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { api } from "../lib/api";
import { Session, Message } from "../lib/types";

export function useSession(sessionId: string) {
  const { getToken } = useAuth();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sendingMessage, setSendingMessage] = useState(false);

  const fetchSession = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.sessions.get(sessionId, getToken);
      setSession(data);
    } catch (err: any) {
      setError(err.message || "Failed to load session");
    } finally {
      setLoading(false);
    }
  }, [sessionId, getToken]);

  const addMessage = useCallback(async (question: string) => {
    if (!sessionId || sendingMessage) return;
    setSendingMessage(true);
    setError(null);
    try {
      const response = await api.messages.send(sessionId, question, getToken);
      
      // Update local session state with the new user and assistant message pairs
      setSession((prev) => {
        if (!prev) return null;
        
        const currentMessages = prev.messages || [];
        const userMsg = response.user_message;
        const assistantMsg = response.assistant_message;

        // Attach optional nested objects
        if (response.visualization) {
          assistantMsg.visualization = response.visualization;
        }
        if (response.execution_log) {
          assistantMsg.execution_log = response.execution_log;
        }

        // Avoid adding duplicates if already present
        const filteredMessages = currentMessages.filter(
          (m) => m.id !== userMsg.id && m.id !== assistantMsg.id
        );

        return {
          ...prev,
          title: response.session_title_updated ? question.substring(0, 60) + (question.length > 60 ? "..." : "") : prev.title,
          message_count: prev.message_count + 2,
          messages: [...filteredMessages, userMsg, assistantMsg],
        };
      });
    } catch (err: any) {
      setError(err.message || "Failed to send message");
      throw err;
    } finally {
      setSendingMessage(false);
    }
  }, [sessionId, getToken, sendingMessage]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  return {
    session,
    loading,
    error,
    sendingMessage,
    addMessage,
    refetch: fetchSession,
  };
}
