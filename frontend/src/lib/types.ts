export interface DataSource {
  id: string;
  name: string;
  source_type: "file" | "postgres";
  file_format?: "csv" | "excel" | "json";
  row_count?: number;
  column_count?: number;
  column_schema?: ColumnSchema[];
  data_profile?: DataProfile;
  profile_status: "pending" | "running" | "complete" | "failed";
  created_at: string;
}

export interface ColumnSchema {
  name: string;
  dtype: string;
  nullable: boolean;
  sample_values: string[];
}

export interface DataProfile {
  row_count: number;
  column_count: number;
  columns: ProfileColumn[];
  detected_anomalies: string[];
}

export interface ProfileColumn {
  name: string;
  dtype: string;
  null_count: number;
  null_rate: number;
  mean?: number;
  median?: number;
  std?: number;
  min?: number;
  max?: number;
  p25?: number;
  p75?: number;
  unique_count: number;
  top_values?: { value: string; count: number }[];
  min_date?: string;
  max_date?: string;
  date_range_days?: number;
}

export interface Session {
  id: string;
  title: string | null;
  data_source_id: string;
  data_source_name?: string | null;
  data_source?: DataSource;
  message_count: number;
  messages?: Message[];
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  turn_index: number;
  visualization_id?: string;
  visualization?: Visualization;
  execution_log_id?: string;
  execution_log?: ExecutionLog;
  created_at: string;
}

export interface Visualization {
  id: string;
  session_id: string;
  chart_type: ChartType;
  title: string;
  caption: string;
  plotly_json: any;
  created_at: string;
}

export interface ExecutionLog {
  id: string;
  session_id: string;
  question: string;
  attempt_number: number;
  generated_code: string;
  stdout?: string;
  stderr?: string;
  exit_code: number;
  execution_ms?: number;
  status: "success" | "failed" | "timeout";
  created_at: string;
}

export type ChartType = "bar" | "line" | "scatter" | "histogram" | "heatmap" | "box" | "pie" | "none";
