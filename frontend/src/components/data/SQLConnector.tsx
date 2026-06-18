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
  
  // Form State
  const [name, setName] = useState("");
  const [host, setHost] = useState("");
  const [port, setPort] = useState(5432);
  const [database, setDatabase] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [schema, setSchema] = useState("public");
  const [table, setTable] = useState("");

  // UI State
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

  return (
    <form onSubmit={handleTestConnection} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Connection Name */}
        <div className="md:col-span-2 space-y-1.5">
          <label className="font-heading text-[10px] font-bold uppercase text-black">Connection Name</label>
          <input
            type="text"
            required
            placeholder="e.g., Production Users Database"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full border border-black px-3 py-2 font-body text-xs text-black placeholder-black/30 outline-none"
          />
        </div>

        {/* Database Host */}
        <div className="space-y-1.5">
          <label className="font-heading text-[10px] font-bold uppercase text-black">Database Host</label>
          <input
            type="text"
            required
            placeholder="e.g., db.example.com or localhost"
            value={host}
            onChange={(e) => setHost(e.target.value)}
            className="w-full border border-black px-3 py-2 font-body text-xs text-black placeholder-black/30 outline-none"
          />
        </div>

        {/* Port */}
        <div className="space-y-1.5">
          <label className="font-heading text-[10px] font-bold uppercase text-black">Port</label>
          <input
            type="number"
            required
            value={port}
            onChange={(e) => setPort(parseInt(e.target.value) || 5432)}
            className="w-full border border-black px-3 py-2 font-body text-xs text-black placeholder-black/30 outline-none"
          />
        </div>

        {/* Database Name */}
        <div className="space-y-1.5">
          <label className="font-heading text-[10px] font-bold uppercase text-black">Database Name</label>
          <input
            type="text"
            required
            placeholder="e.g., customer_analytics"
            value={database}
            onChange={(e) => setDatabase(e.target.value)}
            className="w-full border border-black px-3 py-2 font-body text-xs text-black placeholder-black/30 outline-none"
          />
        </div>

        {/* Username */}
        <div className="space-y-1.5">
          <label className="font-heading text-[10px] font-bold uppercase text-black">Username</label>
          <input
            type="text"
            required
            placeholder="e.g., read_only_user"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full border border-black px-3 py-2 font-body text-xs text-black placeholder-black/30 outline-none"
          />
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label className="font-heading text-[10px] font-bold uppercase text-black">Password</label>
          <input
            type="password"
            placeholder="••••••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-black px-3 py-2 font-body text-xs text-black placeholder-black/30 outline-none"
          />
        </div>

        {/* Schema */}
        <div className="space-y-1.5">
          <label className="font-heading text-[10px] font-bold uppercase text-black">Schema</label>
          <input
            type="text"
            required
            value={schema}
            onChange={(e) => setSchema(e.target.value)}
            className="w-full border border-black px-3 py-2 font-body text-xs text-black placeholder-black/30 outline-none"
          />
        </div>

        {/* Table Name */}
        <div className="md:col-span-2 space-y-1.5">
          <label className="font-heading text-[10px] font-bold uppercase text-black">Table Name</label>
          <input
            type="text"
            required
            placeholder="e.g., users_cohort_2026"
            value={table}
            onChange={(e) => setTable(e.target.value)}
            className="w-full border border-black px-3 py-2 font-body text-xs text-black placeholder-black/30 outline-none"
          />
        </div>
      </div>

      {/* Test Connection Results */}
      {testResult && (
        <div
          className={`flex gap-3 border border-black p-4 font-body text-xs leading-relaxed ${
            testResult.success
              ? "bg-retro-sage text-black"
              : "bg-retro-red/10 text-retro-red"
          }`}
        >
          {testResult.success ? (
            <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-black" />
          ) : (
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-retro-red" />
          )}
          <div>
            <p className="font-heading text-[10px] font-bold uppercase">{testResult.success ? "Connection Verified" : "Verification Failed"}</p>
            <p className="mt-0.5">{testResult.message}</p>
            {testResult.success && (
              <div className="mt-2 flex gap-4 font-mono text-[10px] uppercase tracking-wide opacity-90">
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
          className="border border-black bg-white px-5 py-2 font-heading text-[10px] font-bold uppercase text-black hover:bg-black hover:text-white disabled:opacity-30 leading-none"
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
          className="border border-black bg-black px-6 py-2 font-heading text-[10px] font-bold uppercase text-white hover:bg-white hover:text-black disabled:opacity-30 leading-none"
        >
          Save Data Source
        </button>
      </div>
    </form>
  );
}
