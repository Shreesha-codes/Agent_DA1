"use client";

import { useEffect, useRef, useState } from "react";
import { BarChart3, Download, RefreshCw } from "lucide-react";
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
        family: "'Times New Roman', Times, serif",
        size: 11,
        color: "#000000",
      },
      title: {
        text: visualization.title,
        font: {
          family: "'Helvetica', Arial, sans-serif",
          size: 13,
          color: "#000000",
          weight: "bold",
        },
        x: 0.0,
      },
      margin: { t: 40, r: 20, b: 50, l: 50 },
      colorway: ["#e91d2a", "#17171c", "#8e8a25", "#b3bd95", "#d77a7a"],
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
    <div className="border border-black bg-white p-4 space-y-3">
      <div className="relative min-h-[350px] w-full bg-black/[0.02]">
        {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 space-y-2 z-10">
            <RefreshCw className="h-4 w-4 animate-spin text-black/50" />
            <span className="font-body text-xs text-black/50">Preparing visualization...</span>
          </div>
        )}

        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6">
            <BarChart3 className="h-7 w-7 text-black/30 mb-2" />
            <span className="font-body text-xs text-black/50">{error}</span>
          </div>
        ) : (
          <div ref={containerRef} className="w-full" />
        )}
      </div>

      {visualization.caption && (
        <div className="border-t border-black pt-2 mt-1">
          <p className="font-body text-xs text-black/60 leading-relaxed">
            {visualization.caption}
          </p>
        </div>
      )}
    </div>
  );
}
