FROM python:3.11-slim

# No network access at runtime (enforced by --network none flag)
# No package installation at runtime

WORKDIR /workspace

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Non-root user for added security
RUN useradd -m -u 1000 sandbox
USER sandbox

# Entrypoint: execute script.py
CMD ["python", "script.py"]
