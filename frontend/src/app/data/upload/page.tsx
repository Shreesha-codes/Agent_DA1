"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { ArrowLeft, FileText, Server, AlertCircle, Plus } from "lucide-react";
import Link from "next/link";
import { PageShell } from "@/components/layout/PageShell";
import { FileUploader } from "@/components/data/FileUploader";
import { SQLConnector } from "@/components/data/SQLConnector";
import { api } from "@/lib/api";

export default function UploadPage() {
  const router = useRouter();
  const { getToken } = useAuth();
  const [activeTab, setActiveTab] = useState<"file" | "postgres">("file");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUploadSaved = async (
    storagePath: string,
    fileName: string,
    fileSize: number,
    fileFormat: "csv" | "excel" | "json"
  ) => {
    setSaving(true);
    setError(null);
    try {
      await api.dataSources.create(
        {
          name: fileName,
          source_type: "file",
          file_format: fileFormat,
          storage_path: storagePath,
          file_size_bytes: fileSize,
        },
        getToken
      );
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to register file data source");
      setSaving(false);
    }
  };

  const handleSQLConnectionSaved = async (params: {
    name: string;
    pg_host: string;
    pg_port: number;
    pg_database: string;
    pg_username: string;
    pg_password?: string;
    pg_schema: string;
    pg_table: string;
  }) => {
    setSaving(true);
    setError(null);
    try {
      await api.dataSources.create(
        {
          name: params.name,
          source_type: "postgres",
          pg_host: params.pg_host,
          pg_port: params.pg_port,
          pg_database: params.pg_database,
          pg_username: params.pg_username,
          pg_password: params.pg_password,
          pg_schema: params.pg_schema,
          pg_table: params.pg_table,
        },
        getToken
      );
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to register PostgreSQL connection");
      setSaving(false);
    }
  };

  return (
    <PageShell>
      <div className="max-w-3xl mx-auto">
        {/* Page Header */}
        <div className="flex items-center justify-between border-b border-black px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="font-heading text-[10px] font-bold uppercase text-black/40 hover:text-black border border-transparent hover:border-black px-2 py-1 leading-none"
            >
              &larr; Back
            </Link>
            <div>
              <h1 className="font-heading text-sm font-bold uppercase text-black leading-tight">Connect Dataset</h1>
              <p className="font-body text-xs text-black/50 mt-0.5">
                Connect static data files or query active database schemas directly.
              </p>
            </div>
          </div>
        </div>

        {/* Error notification */}
        {error && (
          <div className="flex gap-2.5 mx-6 mt-4 border border-black bg-retro-red/5 p-3">
            <AlertCircle className="h-4 w-4 flex-shrink-0 text-retro-red" />
            <div className="font-body text-xs leading-relaxed text-retro-red">
              <p className="font-bold uppercase">Registration Failed</p>
              <p className="mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Tab Selectors */}
        <div className="flex px-6 pt-5 border-b border-black">
          <button
            onClick={() => setActiveTab("file")}
            disabled={saving}
            className={`flex items-center gap-2 border-t border-l border-r px-5 py-2 font-heading text-[10px] font-bold uppercase leading-none transition-colors ${
              activeTab === "file"
                ? "border-black text-black bg-white -mb-px"
                : "border-transparent text-black/40 hover:text-black bg-black/5"
            }`}
          >
            <FileText className="h-3.5 w-3.5" />
            <span>Upload File</span>
          </button>
          <button
            onClick={() => setActiveTab("postgres")}
            disabled={saving}
            className={`flex items-center gap-2 border-t border-l border-r px-5 py-2 font-heading text-[10px] font-bold uppercase leading-none transition-colors ${
              activeTab === "postgres"
                ? "border-black text-black bg-white -mb-px"
                : "border-transparent text-black/40 hover:text-black bg-black/5"
            }`}
          >
            <Server className="h-3.5 w-3.5" />
            <span>PostgreSQL Database</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="mx-6 my-5 border border-black bg-white p-5">
          {saving ? (
            <div className="py-12 text-center space-y-3">
              <div className="h-5 w-5 border-2 border-black border-t-transparent animate-spin mx-auto"></div>
              <p className="font-body text-xs text-black/50">Registering data source and starting background profiler...</p>
            </div>
          ) : activeTab === "file" ? (
            <FileUploader onUploadComplete={handleFileUploadSaved} />
          ) : (
            <SQLConnector onConnectionSaved={handleSQLConnectionSaved} />
          )}
        </div>
      </div>
    </PageShell>
  );
}
