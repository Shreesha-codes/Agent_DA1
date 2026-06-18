import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";
import { api } from "../lib/api";
import { DataSource } from "../lib/types";

export function useDataSources() {
  const { getToken } = useAuth();
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSources = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.dataSources.list(getToken);
      setDataSources(response.data_sources);
    } catch (err: any) {
      setError(err.message || "Failed to fetch data sources");
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  const deleteSource = useCallback(async (id: string) => {
    try {
      await api.dataSources.delete(id, getToken);
      setDataSources((prev) => prev.filter((source) => source.id !== id));
      return true;
    } catch (err: any) {
      setError(err.message || "Failed to delete data source");
      return false;
    }
  }, [getToken]);

  useEffect(() => {
    fetchSources();
  }, [fetchSources]);

  return {
    dataSources,
    loading,
    error,
    refetch: fetchSources,
    deleteDataSource: deleteSource,
  };
}
