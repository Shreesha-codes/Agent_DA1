"use client";

import { useState, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import { UploadCloud, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface FileUploaderProps {
  onUploadComplete: (storagePath: string, fileName: string, fileSize: number, fileFormat: "csv" | "excel" | "json") => void;
}

export function FileUploader({ onUploadComplete }: FileUploaderProps) {
  const { user } = useUser();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    setError(null);
    const maxSizeBytes = 50 * 1024 * 1024;
    if (selectedFile.size > maxSizeBytes) {
      setError("Files must be under 50MB. Try removing unused columns or rows first.");
      return;
    }

    const name = selectedFile.name.toLowerCase();
    let format: "csv" | "excel" | "json" | null = null;
    if (name.endsWith(".csv")) {
      format = "csv";
    } else if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
      format = "excel";
    } else if (name.endsWith(".json")) {
      format = "json";
    }

    if (!format) {
      setError("Unsupported format. Please upload a CSV, Excel (.xlsx), or JSON file.");
      return;
    }

    setFile(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const uploadFile = async () => {
    if (!file || !user) return;
    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      const ext = file.name.split(".").pop();
      const uniqueId = Math.random().toString(36).substring(2, 15);
      const storagePath = `${user.id}/${uniqueId}/data.${ext}`;

      const { data, error: uploadError } = await supabase.storage
        .from("data-uploads")
        .upload(storagePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      let format: "csv" | "excel" | "json" = "csv";
      if (file.name.toLowerCase().endsWith(".json")) format = "json";
      else if (file.name.toLowerCase().endsWith(".xlsx") || file.name.toLowerCase().endsWith(".xls")) format = "excel";

      setProgress(100);
      onUploadComplete(storagePath, file.name, file.size, format);
    } catch (err: any) {
      setError(err.message || "Failed to upload file to storage.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-10 transition-all duration-300 ${
          isDragActive
            ? "border-claude-primary bg-claude-primary/5 scale-[1.01] shadow-inner"
            : file
            ? "border-claude-hairline bg-claude-surface-soft"
            : "border-claude-hairline bg-white hover:border-claude-muted hover:bg-claude-surface-soft/20"
        }`}
      >
        <input
          type="file"
          id="file-upload"
          className="hidden"
          accept=".csv,.xlsx,.xls,.json"
          onChange={handleFileInput}
          disabled={uploading}
        />

        {file ? (
          <div className="text-center animate-fade-in">
            <FileText className="mx-auto h-10 w-10 text-claude-primary mb-3 animate-bounce" style={{ animationDuration: '2s' }} />
            <p className="font-body text-sm font-medium text-claude-ink">{file.name}</p>
            <p className="font-body text-xs text-claude-muted mt-1">
              {(file.size / (1024 * 1024)).toFixed(2)} MB
            </p>
            {!uploading && (
              <div className="mt-6 flex justify-center gap-3">
                <button
                  onClick={() => setFile(null)}
                  className="font-body text-sm font-medium text-claude-ink px-4 py-2 rounded-md border border-claude-hairline hover:bg-claude-surface-soft hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                >
                  Change File
                </button>
                <button
                  onClick={uploadFile}
                  className="font-body text-sm font-medium text-white bg-claude-primary px-5 py-2 rounded-md hover:bg-claude-primary-active hover:-translate-y-0.5 hover:shadow-sm active:translate-y-0 transition-all duration-200"
                >
                  Upload File
                </button>
              </div>
            )}
          </div>
        ) : (
          <label htmlFor="file-upload" className="flex flex-col items-center cursor-pointer group w-full text-center py-4">
            <UploadCloud className="h-10 w-10 text-claude-muted mb-4 group-hover:-translate-y-1 group-hover:text-claude-primary transition-all duration-300" />
            <span className="font-body text-sm text-claude-ink">
              Drag and drop your file here, or <span className="text-claude-primary hover:underline font-medium">browse</span>
            </span>
            <span className="font-body text-xs text-claude-muted mt-2">
              Supported: CSV, XLSX, JSON (Max 50MB)
            </span>
          </label>
        )}
      </div>

      {uploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between font-body text-sm text-claude-ink">
            <span>Uploading dataset...</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-claude-surface-card overflow-hidden">
            <div
              className="h-full rounded-full bg-claude-primary transition-all duration-300"
              style={{ width: `${progress || 10}%` }}
            ></div>
          </div>
        </div>
      )}

      {error && (
        <div className="flex gap-3 rounded-lg border border-claude-error/20 bg-claude-error/5 p-4">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-claude-error" />
          <div className="font-body text-sm leading-relaxed text-claude-error">
            <p className="font-medium">Upload Error</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
