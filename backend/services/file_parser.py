"""
File parser: reads CSV, Excel, and JSON files into pandas DataFrames.
"""

import logging
import pandas as pd

logger = logging.getLogger("data-agent.file_parser")


def parse_file(file_path: str, file_format: str) -> pd.DataFrame:
    """
    Parse a data file into a DataFrame.

    Args:
        file_path: Absolute path to the file
        file_format: One of 'csv', 'excel', 'json'

    Returns:
        pandas DataFrame

    Raises:
        ValueError with user-friendly message on parse errors
    """
    try:
        if file_format == "csv":
            return _parse_csv(file_path)
        elif file_format == "excel":
            return _parse_excel(file_path)
        elif file_format == "json":
            return _parse_json(file_path)
        else:
            raise ValueError(f"Unsupported file format: {file_format}")
    except ValueError:
        raise
    except Exception as e:
        logger.exception("Failed to parse file %s: %s", file_path, e)
        raise ValueError(f"Could not read your file: {str(e)}")


def _parse_csv(file_path: str) -> pd.DataFrame:
    """Parse CSV with auto-detected delimiter."""
    try:
        # Try common delimiters
        for sep in [",", ";", "\t", "|"]:
            try:
                df = pd.read_csv(file_path, sep=sep, nrows=5)
                if len(df.columns) > 1:
                    # Found a working delimiter
                    return pd.read_csv(file_path, sep=sep)
            except Exception:
                continue

        # Fall back to default
        return pd.read_csv(file_path)

    except UnicodeDecodeError:
        # Try with different encoding
        try:
            return pd.read_csv(file_path, encoding="latin-1")
        except Exception:
            raise ValueError(
                "Could not read your CSV file. Try saving it as UTF-8 CSV and re-uploading."
            )
    except Exception as e:
        raise ValueError(f"Could not parse CSV file: {str(e)}")


def _parse_excel(file_path: str) -> pd.DataFrame:
    """Parse Excel (.xlsx) file, using sheet index 0."""
    try:
        xls = pd.ExcelFile(file_path)
        if len(xls.sheet_names) > 1:
            logger.warning(
                "Excel file has %d sheets. Using first sheet: '%s'",
                len(xls.sheet_names),
                xls.sheet_names[0],
            )
        return pd.read_excel(file_path, sheet_name=0)
    except Exception as e:
        raise ValueError(
            "The Excel file appears to be corrupted. Try re-saving it and uploading again."
        )


def _parse_json(file_path: str) -> pd.DataFrame:
    """Parse JSON file (expects array of objects)."""
    try:
        df = pd.read_json(file_path, orient="records")
        if df.empty:
            raise ValueError("JSON file is empty")
        return df
    except ValueError as e:
        if "orient" in str(e).lower() or "expected" in str(e).lower():
            raise ValueError(
                "Your JSON file must contain an array of objects (records). Example: [{...}, {...}]"
            )
        raise
    except Exception as e:
        raise ValueError(f"Could not parse JSON file: {str(e)}")
