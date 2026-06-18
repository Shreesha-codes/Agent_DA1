"use client";

import { useEffect, useRef, useState } from "react";
import { BarChart3, RefreshCw } from "lucide-react";
import { Visualization } from "../../lib/types";

interface ChartRendererProps {
  visualization: Visualization;
}

export function ChartRenderer({ visualization }: ChartRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [plotlyInstance, setPlotlyInstance] = useState<any>(null);

  useEffect(() => {
    let active = true;

    async function loadPlotly() {
      try {
        const Plotly = await import("plotly.js-dist-min");
        if (active) {
          setPlotlyInstance(Plotly.default || Plotly);
        }
      } catch (err) {
        console.error("Failed to load Plotly:", err);
        if (active) {
          setError("Failed to initialize charting engine");
        }
      }
    }

    loadPlotly();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!plotlyInstance || !containerRef.current || !visualization.plotly_json) {
      return;
    }

    const { data, layout } = visualization.plotly_json;

    const themeLayout = {
      ...layout,
      paper_bgcolor: "transparent",
      plot_bgcolor: "transparent",
      font: {
        family: "'StyreneB', 'Inter', sans-serif",
        size: 12,
        color: "#3d3d3a",
      },
      title: {
        text: visualization.title,
        font: {
          family: "'StyreneB', 'Inter', sans-serif",
          size: 14,
          color: "#141413",
          weight: 500,
        },
        x: 0.0,
      },
      margin: { t: 40, r: 20, b: 50, l: 50 },
      colorway: ["#cc785c", "#5db8a6", "#e8a55a", "#141413", "#8e8b82"],
      height: 400,
      autosize: true,
    };

    const config = {
      responsive: true,
      displayModeBar: true,
      displaylogo: false,
      modeBarButtonsToRemove: [
        "select2d",
        "lasso2d",
        "zoomIn2d",
        "zoomOut2d",
        "autoScale2d",
        "resetScale2d",
      ],
    };

    setLoading(true);
    try {
      plotlyInstance.newPlot(containerRef.current, data, themeLayout, config);
    } catch (err: any) {
      setError(err.message || "Failed to render chart");
    } finally {
      setLoading(false);
    }

    const currentContainer = containerRef.current;
    return () => {
      if (plotlyInstance && currentContainer) {
        plotlyInstance.purge(currentContainer);
      }
    };
  }, [plotlyInstance, visualization]);

  return (
    <div className="p-4">
      <div className="relative min-h-[350px] w-full">
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 space-y-2 z-10">
            <RefreshCw className="h-4 w-4 animate-spin text-claude-muted" />
            <span className="font-body text-sm text-claude-muted">Preparing visualization...</span>
          </div>
        )}

        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
            <BarChart3 className="h-8 w-8 text-claude-muted mb-2" />
            <span className="font-body text-sm text-claude-muted">{error}</span>
          </div>
        ) : (
          <div ref={containerRef} className="w-full" />
        )}
      </div>

      {visualization.caption && (
        <div className="border-t border-claude-hairline pt-3 mt-2">
          <p className="font-body text-sm text-claude-muted leading-relaxed">
            {visualization.caption}
          </p>
        </div>
      )}
    </div>
  );
}
