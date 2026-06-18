"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { Server, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { api } from "../../lib/api";

interface SQLConnectorProps {
  onConnectionSaved: (params: {
    name: string;
    pg_host: string;
    pg_port: number;
    pg_database: string;
    pg_username: string;
    pg_password?: string;
    pg_schema: string;
    pg_table: string;
  }) => void;
}

export function SQLConnector({ onConnectionSaved }: SQLConnectorProps) {
  const { getToken } = useAuth();
  
  const [name, setName] = useState("");
  const [host, setHost] = useState("");
  const [port, setPort] = useState(5432);
  const [database, setDatabase] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [schema, setSchema] = useState("public");
  const [table, setTable] = useState("");

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    row_count?: number;
    column_count?: number;
  } | null>(null);

  const handleTestConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!host || !database || !username || !table) return;

    setTesting(true);
    setTestResult(null);

    try {
      const result = await api.dataSources.testConnection(
        {
          pg_host: host,
          pg_port: port,
          pg_database: database,
          pg_username: username,
          pg_password: password,
          pg_schema: schema,
          pg_table: table,
        },
        getToken
      );
      setTestResult(result);
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || "Failed to reach database server.",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    if (!name || !host || !database || !username || !table) return;
    onConnectionSaved({
      name,
      pg_host: host,
      pg_port: port,
      pg_database: database,
      pg_username: username,
      pg_password: password || undefined,
      pg_schema: schema,
      pg_table: table,
    });
  };

  const isFormValid = name && host && database && username && table;

  const inputClass = "w-full rounded-md border border-claude-hairline px-3 py-2 font-body text-sm text-claude-ink placeholder-claude-muted-soft focus:border-claude-primary focus:ring-1 focus:ring-claude-primary/20 outline-none transition-all";
  const labelClass = "font-body text-xs font-medium text-claude-ink";

  return (
    <form onSubmit={handleTestConnection} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2 space-y-1.5">
          <label className={labelClass}>Connection Name</label>
          <input type="text" required placeholder="e.g., Production Users Database" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </div>

        <div className="space-y-1.5">
          <label className={labelClass}>Database Host</label>
          <input type="text" required placeholder="e.g., db.example.com" value={host} onChange={(e) => setHost(e.target.value)} className={inputClass} />
        </div>

        <div className="space-y-1.5">
          <label className={labelClass}>Port</label>
          <input type="number" required value={port} onChange={(e) => setPort(parseInt(e.target.value) || 5432)} className={inputClass} />
        </div>

        <div className="space-y-1.5">
          <label className={labelClass}>Database Name</label>
          <input type="text" required placeholder="e.g., customer_analytics" value={database} onChange={(e) => setDatabase(e.target.value)} className={inputClass} />
        </div>

        <div className="space-y-1.5">
          <label className={labelClass}>Username</label>
          <input type="text" required placeholder="e.g., read_only_user" value={username} onChange={(e) => setUsername(e.target.value)} className={inputClass} />
        </div>

        <div className="space-y-1.5">
          <label className={labelClass}>Password</label>
          <input type="password" placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
        </div>

        <div className="space-y-1.5">
          <label className={labelClass}>Schema</label>
          <input type="text" required value={schema} onChange={(e) => setSchema(e.target.value)} className={inputClass} />
        </div>

        <div className="md:col-span-2 space-y-1.5">
          <label className={labelClass}>Table Name</label>
          <input type="text" required placeholder="e.g., users_cohort_2026" value={table} onChange={(e) => setTable(e.target.value)} className={inputClass} />
        </div>
      </div>

      {/* Test Connection Results */}
      {testResult && (
        <div className={`flex gap-3 rounded-lg border p-4 font-body text-sm leading-relaxed ${
          testResult.success
            ? "border-claude-success/20 bg-claude-success/5 text-claude-success"
            : "border-claude-error/20 bg-claude-error/5 text-claude-error"
        }`}>
          {testResult.success ? (
            <CheckCircle2 className="h-5 w-5 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
          )}
          <div>
            <p className="font-medium">{testResult.success ? "Connection Verified" : "Verification Failed"}</p>
            <p className="mt-0.5">{testResult.message}</p>
            {testResult.success && (
              <div className="mt-2 flex gap-4 font-mono text-[10px] uppercase tracking-wide opacity-80">
                <span>Rows: {testResult.row_count ?? "N/A"}</span>
                <span>Columns: {testResult.column_count ?? "N/A"}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex justify-end gap-3 pt-2">
        <button
          type="submit"
          disabled={testing || !isFormValid}
          className="font-body text-sm font-medium text-claude-ink px-5 py-2 rounded-md border border-claude-hairline hover:bg-claude-surface-soft transition-colors disabled:opacity-50"
        >
          {testing ? (
            <span className="flex items-center gap-1.5">
              <RefreshCw className="h-3 w-3 animate-spin" />
              <span>Verifying...</span>
            </span>
          ) : (
            "Verify Connection"
          )}
        </button>
        
        <button
          type="button"
          disabled={!testResult?.success || testing}
          onClick={handleSave}
          className="font-body text-sm font-medium text-white bg-claude-primary px-6 py-2 rounded-md hover:bg-claude-primary-active transition-colors disabled:opacity-50"
        >
          Save Data Source
        </button>
      </div>
    </form>
  );
}
