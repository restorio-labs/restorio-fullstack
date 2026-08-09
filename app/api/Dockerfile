FROM python:3.12.13-slim@sha256:d657ab0ade19f404a6ccc883ab399540de667aff751748ce23c07330c5a89e64

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_LINK_MODE=copy \
    PATH="/app/.venv/bin:$PATH"

RUN groupadd --gid 10001 restorio && \
    useradd --create-home --uid 10001 --gid 10001 --shell /usr/sbin/nologin restorio && \
    apt-get update && \
    apt-get upgrade -y --no-install-recommends && \
    apt-get install -y --no-install-recommends curl && \
    rm -rf /var/lib/apt/lists/* && \
    pip install --no-cache-dir uv==0.8.22

COPY pyproject.toml uv.lock ./

RUN uv sync --frozen --no-dev --no-install-project && \
    rm -rf /root/.cache/uv

COPY --chown=restorio:restorio . .

USER restorio

EXPOSE 8000

HEALTHCHECK --interval=10s --timeout=5s --start-period=45s --retries=5 \
  CMD curl -f http://localhost:8000/health/live || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
