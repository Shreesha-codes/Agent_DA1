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
    const maxSizeBytes = 50 * 1024 * 1024; // 50MB
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

      // Upload directly to Supabase storage bucket 'data-uploads'
      // Supabase upload progress can be tracked using XMLHttpRequest in custom fetch, 
      // but standard supabase SDK upload also works fine. Let's upload using supabase-js:
      const { data, error: uploadError } = await supabase.storage
        .from("data-uploads")
        .upload(storagePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw new Error(uploadError.message);
      }

      // Track format
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
        className={`flex flex-col items-center justify-center border-2 border-black p-10 transition-all ${
          isDragActive
            ? "bg-black/5"
            : file
            ? "bg-white"
            : "bg-white hover:bg-black/5"
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
          <div className="text-center">
            <FileText className="mx-auto h-10 w-10 text-black mb-3" />
            <p className="font-heading text-sm font-bold uppercase text-black">{file.name}</p>
            <p className="font-body text-xs text-black/50 mt-1">
              {(file.size / (1024 * 1024)).toFixed(2)} MB
            </p>
            {!uploading && (
              <div className="mt-6 flex justify-center gap-3">
                <button
                  onClick={() => setFile(null)}
                  className="border border-black bg-white px-4 py-1.5 font-heading text-[10px] font-bold uppercase text-black hover:bg-black hover:text-white leading-none"
                >
                  Change File
                </button>
                <button
                  onClick={uploadFile}
                  className="border border-black bg-black px-5 py-1.5 font-heading text-[10px] font-bold uppercase text-white hover:bg-white hover:text-black leading-none"
                >
                  Upload File
                </button>
              </div>
            )}
          </div>
        ) : (
          <label htmlFor="file-upload" className="flex flex-col items-center cursor-pointer">
            <UploadCloud className="h-10 w-10 text-black/40 mb-4" />
            <span className="font-body text-sm text-black">
              Drag and drop your file here, or <span className="text-retro-link underline">browse</span>
            </span>
            <span className="font-heading text-[10px] text-black/50 mt-2 uppercase font-bold tracking-wider">
              Supported: CSV, XLSX, JSON (Max 50MB)
            </span>
          </label>
        )}
      </div>

      {uploading && (
        <div className="space-y-2">
          <div className="flex items-center justify-between font-body text-xs text-black">
            <span>Uploading dataset...</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 w-full border border-black overflow-hidden">
            <div
              className="h-full bg-black transition-all duration-300"
              style={{ width: `${progress || 10}%` }}
            ></div>
          </div>
        </div>
      )}

      {error && (
        <div className="flex gap-2.5 border border-black bg-retro-red/5 p-4">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-retro-red" />
          <div className="font-body text-xs leading-relaxed text-retro-red">
            <p className="font-heading text-[10px] font-bold uppercase">Upload Error</p>
            <p className="mt-0.5">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
