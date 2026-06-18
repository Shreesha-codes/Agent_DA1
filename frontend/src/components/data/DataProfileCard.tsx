"use client";

import { useState } from "react";
import { AlertTriangle, Info, AlertCircle, CheckCircle2 } from "lucide-react";
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
    <div className="rounded-lg border border-claude-hairline bg-white">
      {/* Header bar */}
      <div className="border-b border-claude-hairline px-4 py-3">
        <div>
          <h2 className="font-body text-sm font-medium text-claude-ink">{dataSource.name}</h2>
          <div className="flex items-center gap-2 font-body text-xs text-claude-muted mt-0.5">
            <span>Type: {dataSource.source_type}</span>
            {dataSource.file_format && <span>Format: {dataSource.file_format}</span>}
            <span>Rows: {dataSource.row_count ?? "Profiling..."}</span>
          </div>
        </div>
      </div>

      {/* Tab Selector */}
      <div className="flex border-b border-claude-hairline bg-claude-surface-soft">
        <button
          onClick={() => setActiveTab("schema")}
          className={`flex-1 px-3 py-2 font-body text-xs font-medium text-center transition-colors ${
            activeTab === "schema"
              ? "bg-white text-claude-ink border-b-2 border-claude-primary"
              : "text-claude-muted hover:text-claude-ink"
          }`}
        >
          Columns ({schema.length})
        </button>
        <button
          onClick={() => setActiveTab("anomalies")}
          className={`flex-1 px-3 py-2 font-body text-xs font-medium text-center transition-colors relative ${
            activeTab === "anomalies"
              ? "bg-white text-claude-ink border-b-2 border-claude-primary"
              : "text-claude-muted hover:text-claude-ink"
          }`}
        >
          Anomalies
          {anomalies.length > 0 && (
            <span className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-claude-error text-[9px] font-bold text-white">
              {anomalies.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("stats")}
          className={`flex-1 px-3 py-2 font-body text-xs font-medium text-center transition-colors ${
            activeTab === "stats"
              ? "bg-white text-claude-ink border-b-2 border-claude-primary"
              : "text-claude-muted hover:text-claude-ink"
          }`}
        >
          Stats
        </button>
      </div>

      {/* Profile Body */}
      <div className="p-4">
        {dataSource.profile_status === "running" && (
          <div className="py-8 text-center space-y-3">
            <div className="h-5 w-5 rounded-full border-2 border-claude-primary border-t-transparent animate-spin mx-auto"></div>
            <p className="font-body text-sm text-claude-muted">Generating statistical profile...</p>
          </div>
        )}

        {dataSource.profile_status === "failed" && (
          <div className="flex gap-3 rounded-md border border-claude-error/20 bg-claude-error/5 p-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-claude-error" />
            <div className="font-body text-sm leading-relaxed text-claude-error">
              <p className="font-medium">Profiling Failed</p>
              <p className="mt-0.5">You can still query, but schema introspection may be limited.</p>
            </div>
          </div>
        )}

        {dataSource.profile_status === "complete" && (
          <>
            {/* Schema / Columns Tab */}
            {activeTab === "schema" && (
              <div className="overflow-x-auto">
                <table className="w-full text-left font-body text-sm">
                  <thead>
                    <tr className="border-b border-claude-hairline text-xs uppercase tracking-wider text-claude-muted">
                      <th className="pb-2 pr-3 font-medium">Column</th>
                      <th className="pb-2 pr-3 font-medium">Dtype</th>
                      <th className="pb-2 pr-3 font-medium">Nullable</th>
                      <th className="pb-2 pr-3 font-medium">Sample Values</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-claude-hairline/50">
                    {schema.map((col, idx) => (
                      <tr key={idx} className="hover:bg-claude-surface-soft">
                        <td className="py-2 pr-3 font-mono text-xs text-claude-ink">{col.name}</td>
                        <td className="py-2 pr-3 font-mono text-xs text-claude-muted">{col.dtype}</td>
                        <td className="py-2 pr-3 text-xs text-claude-muted">{col.nullable ? "Yes" : "No"}</td>
                        <td className="py-2 text-xs text-claude-muted max-w-[140px] truncate">
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
                  <div className="flex items-center gap-2.5 rounded-md border border-claude-success/20 bg-claude-success/5 p-3">
                    <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-claude-success" />
                    <p className="font-body text-sm text-claude-ink">No issues found. Dataset looks clean.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {anomalies.map((anom, idx) => (
                      <div key={idx} className="flex gap-3 rounded-md border border-claude-warning/20 bg-claude-warning/5 p-3">
                        <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5 text-claude-warning" />
                        <span className="font-body text-sm text-claude-ink">{anom}</span>
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
                    <div key={idx} className="border-b border-claude-hairline last:border-b-0 pb-4 last:pb-0">
                      <div className="flex items-baseline gap-2 mb-2">
                        <h4 className="font-mono text-xs font-medium text-claude-ink">{col.name}</h4>
                        <span className="font-mono text-[10px] text-claude-muted">({col.dtype})</span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 font-body text-sm">
                        <div className="rounded-md border border-claude-hairline p-2.5 bg-claude-surface-soft">
                          <span className="text-[10px] uppercase tracking-wider text-claude-muted block mb-1">Nulls</span>
                          <span className="font-medium text-claude-ink">
                            {col.null_count} ({(col.null_rate * 100).toFixed(1)}%)
                          </span>
                        </div>
                        <div className="rounded-md border border-claude-hairline p-2.5 bg-claude-surface-soft">
                          <span className="text-[10px] uppercase tracking-wider text-claude-muted block mb-1">Uniques</span>
                          <span className="font-medium text-claude-ink">{col.unique_count}</span>
                        </div>

                        {isNumeric && (
                          <>
                            <div className="rounded-md border border-claude-hairline p-2.5 bg-claude-surface-soft">
                              <span className="text-[10px] uppercase tracking-wider text-claude-muted block mb-1">Mean / Median</span>
                              <span className="font-medium text-claude-ink">
                                {col.mean?.toFixed(2)} / {col.median?.toFixed(2)}
                              </span>
                            </div>
                            <div className="rounded-md border border-claude-hairline p-2.5 bg-claude-surface-soft">
                              <span className="text-[10px] uppercase tracking-wider text-claude-muted block mb-1">Min / Max</span>
                              <span className="font-medium text-claude-ink">
                                {col.min?.toFixed(1)} / {col.max?.toFixed(1)}
                              </span>
                            </div>
                          </>
                        )}

                        {isDate && (
                          <div className="col-span-2 rounded-md border border-claude-hairline p-2.5 bg-claude-surface-soft">
                            <span className="text-[10px] uppercase tracking-wider text-claude-muted block mb-1">Date Range</span>
                            <span className="font-medium text-claude-ink leading-tight block">
                              {col.min_date?.split("T")[0]} to {col.max_date?.split("T")[0]}
                            </span>
                            <span className="font-mono text-[10px] text-claude-muted mt-0.5 block">
                              Span: {col.date_range_days} days
                            </span>
                          </div>
                        )}

                        {!isNumeric && !isDate && col.top_values && (
                          <div className="col-span-2 rounded-md border border-claude-hairline p-2.5 bg-claude-surface-soft">
                            <span className="text-[10px] uppercase tracking-wider text-claude-muted block mb-1">Top Value</span>
                            <span className="font-medium text-claude-ink truncate block">
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
