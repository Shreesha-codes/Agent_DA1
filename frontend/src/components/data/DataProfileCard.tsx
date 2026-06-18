"use client";

import { useState } from "react";
import { AlertTriangle, Table2, Info, Percent, AlertCircle, CheckCircle2 } from "lucide-react";
import { DataSource } from "../../lib/types";

interface DataProfileCardProps {
  dataSource: DataSource;
}

export function DataProfileCard({ dataSource }: DataProfileCardProps) {
  const [activeTab, setActiveTab] = useState<"schema" | "anomalies" | "stats">("schema");

  const schema = dataSource.column_schema || [];
  const profile = dataSource.data_profile || { row_count: 0, column_count: 0, columns: [], detected_anomalies: [] };
  const anomalies = profile.detected_anomalies || [];

  return (
    <div className="border border-black bg-white">
      {/* Header bar */}
      <div className="border-b border-black px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-heading text-xs font-bold uppercase text-black">{dataSource.name}</h2>
          <div className="flex items-center gap-2 font-body text-[10px] text-black/50 mt-0.5">
            <span>Type: {dataSource.source_type}</span>
            {dataSource.file_format && <span>Format: {dataSource.file_format}</span>}
            <span>Rows: {dataSource.row_count ?? "Profiling..."}</span>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex border border-black">
          <button
            onClick={() => setActiveTab("schema")}
            className={`px-3 py-1 font-heading text-[9px] font-bold uppercase border-r border-black leading-none transition-colors ${
              activeTab === "schema"
                ? "bg-black text-white"
                : "bg-white text-black hover:bg-black/10"
            }`}
          >
            Columns ({schema.length})
          </button>
          <button
            onClick={() => setActiveTab("anomalies")}
            className={`px-3 py-1 font-heading text-[9px] font-bold uppercase border-r border-black leading-none transition-colors relative ${
              activeTab === "anomalies"
                ? "bg-black text-white"
                : "bg-white text-black hover:bg-black/10"
            }`}
          >
            Anomalies
            {anomalies.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-3.5 w-3.5 items-center justify-center border border-black bg-retro-red text-white text-[7px] font-bold">
                {anomalies.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("stats")}
            className={`px-3 py-1 font-heading text-[9px] font-bold uppercase leading-none transition-colors ${
              activeTab === "stats"
                ? "bg-black text-white"
                : "bg-white text-black hover:bg-black/10"
            }`}
          >
            Stats
          </button>
        </div>
      </div>

      {/* Profile Body */}
      <div className="p-4">
        {dataSource.profile_status === "running" && (
          <div className="py-8 text-center space-y-3">
            <div className="h-4 w-4 border-2 border-black border-t-transparent animate-spin mx-auto"></div>
            <p className="font-body text-xs text-black/50">Generating statistical profile for your dataset...</p>
          </div>
        )}

        {dataSource.profile_status === "failed" && (
          <div className="flex gap-3 border border-black bg-retro-red/5 p-3">
            <AlertCircle className="h-4 w-4 flex-shrink-0 text-retro-red" />
            <div className="font-body text-xs leading-relaxed text-retro-red">
              <p className="font-heading text-[10px] font-bold uppercase">Profiling Failed</p>
              <p className="mt-0.5">We encountered an issue analyzing your dataset. You can still initiate queries, but schema introspection may be limited.</p>
            </div>
          </div>
        )}

        {dataSource.profile_status === "complete" && (
          <>
            {/* Schema / Columns Tab */}
            {activeTab === "schema" && (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-body text-xs">
                  <thead>
                    <tr className="border-b border-black font-heading text-[9px] uppercase text-black/60">
                      <th className="pb-2 font-bold pr-3">Column</th>
                      <th className="pb-2 font-bold pr-3">Dtype</th>
                      <th className="pb-2 font-bold pr-3">Nullable</th>
                      <th className="pb-2 font-bold pr-3">Sample Values</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/20">
                    {schema.map((col, idx) => (
                      <tr key={idx} className="hover:bg-black/5">
                        <td className="py-2 pr-3 font-mono text-xs text-black">{col.name}</td>
                        <td className="py-2 pr-3 font-mono text-xs text-black/60">{col.dtype}</td>
                        <td className="py-2 pr-3 text-xs text-black/60">{col.nullable ? "Yes" : "No"}</td>
                        <td className="py-2 text-xs text-black/60 max-w-[140px] truncate">
                          {col.sample_values?.map((v) => `"${v}"`).join(", ") || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Anomalies Tab */}
            {activeTab === "anomalies" && (
              <div className="space-y-3">
                {anomalies.length === 0 ? (
                  <div className="flex items-center gap-2 border border-black bg-retro-sage/30 p-3">
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0 text-black" />
                    <p className="font-body text-xs text-black">No issues found. Dataset looks clean and ready.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {anomalies.map((anom, idx) => (
                      <div key={idx} className="flex gap-3 border border-black bg-retro-peach/20 p-3">
                        <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5 text-black" />
                        <span className="font-body text-xs text-black">{anom}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Stats Summary Tab */}
            {activeTab === "stats" && (
              <div className="space-y-5">
                {profile.columns?.map((col: any, idx: number) => {
                  const isNumeric = col.mean !== undefined;
                  const isDate = col.min_date !== undefined;

                  return (
                    <div key={idx} className="border-b border-black last:border-b-0 pb-4 last:pb-0">
                      <div className="flex items-baseline gap-2 mb-2">
                        <h4 className="font-mono text-xs font-bold text-black">{col.name}</h4>
                        <span className="font-mono text-[9px] uppercase text-black/50">
                          ({col.dtype})
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-body text-xs">
                        <div className="border border-black p-2 bg-white">
                          <span className="font-heading text-[9px] font-bold uppercase text-black/60 block mb-1">Nulls</span>
                          <span className="font-bold text-black">
                            {col.null_count} ({(col.null_rate * 100).toFixed(1)}%)
                          </span>
                        </div>
                        <div className="border border-black p-2 bg-white">
                          <span className="font-heading text-[9px] font-bold uppercase text-black/60 block mb-1">Uniques</span>
                          <span className="font-bold text-black">{col.unique_count}</span>
                        </div>

                        {isNumeric && (
                          <>
                            <div className="border border-black p-2 bg-white">
                              <span className="font-heading text-[9px] font-bold uppercase text-black/60 block mb-1">Mean / Median</span>
                              <span className="font-bold text-black">
                                {col.mean?.toFixed(2)} / {col.median?.toFixed(2)}
                              </span>
                            </div>
                            <div className="border border-black p-2 bg-white">
                              <span className="font-heading text-[9px] font-bold uppercase text-black/60 block mb-1">Min / Max</span>
                              <span className="font-bold text-black">
                                {col.min?.toFixed(1)} / {col.max?.toFixed(1)}
                              </span>
                            </div>
                          </>
                        )}

                        {isDate && (
                          <>
                            <div className="col-span-2 border border-black p-2 bg-white">
                              <span className="font-heading text-[9px] font-bold uppercase text-black/60 block mb-1">Date Range</span>
                              <span className="font-bold text-black leading-tight block">
                                {col.min_date?.split("T")[0]} to {col.max_date?.split("T")[0]}
                              </span>
                              <span className="font-mono text-[9px] text-black/50 mt-0.5 block">
                                Span: {col.date_range_days} days
                              </span>
                            </div>
                          </>
                        )}

                        {!isNumeric && !isDate && col.top_values && (
                          <div className="col-span-2 border border-black p-2 bg-white">
                            <span className="font-heading text-[9px] font-bold uppercase text-black/60 block mb-1">Top Value</span>
                            <span className="font-bold text-black truncate block">
                              {col.top_values[0] ? `"${col.top_values[0].value}" (${col.top_values[0].count} rows)` : "—"}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
