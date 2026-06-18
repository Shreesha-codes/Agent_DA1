"""
OpenAI function (tool) definitions for the agent.
"""

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "execute_python",
            "description": (
                "Execute Python code in a sandboxed environment to perform data analysis. "
                "The dataset is pre-loaded at /workspace/data.{file_format}. "
                "Save Plotly charts to /workspace/output_chart.json. "
                "Print key findings to stdout."
            ),
            "parameters": {
                "type": "object",
                "properties": {
                    "code": {
                        "type": "string",
                        "description": "Complete, executable Python code for the analysis.",
                    },
                    "chart_type": {
                        "type": "string",
                        "enum": ["bar", "line", "scatter", "histogram", "heatmap", "box", "pie", "none"],
                        "description": "The type of chart being generated, or 'none' if no chart.",
                    },
                    "reasoning": {
                        "type": "string",
                        "description": "Brief explanation of the analytical approach chosen.",
                    },
                },
                "required": ["code", "chart_type", "reasoning"],
            },
        },
    }
]
