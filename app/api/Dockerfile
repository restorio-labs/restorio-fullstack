ARG PYTHON_IMAGE=python:3.14-slim

FROM ${PYTHON_IMAGE} AS dependencies

ARG UV_VERSION=0.8.15

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_NO_DEV=1

WORKDIR /app

RUN python -m pip install --no-cache-dir "uv==${UV_VERSION}"

COPY pyproject.toml uv.lock ./

RUN uv sync --frozen --no-dev --no-install-project

FROM ${PYTHON_IMAGE} AS runtime

ARG BUILD_DATE
ARG VERSION
ARG VCS_REF

LABEL org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.description="Restorio multi-tenant API" \
      org.opencontainers.image.revision="${VCS_REF}" \
      org.opencontainers.image.source="https://github.com/restorio-labs/restorio-fullstack" \
      org.opencontainers.image.title="Restorio API" \
      org.opencontainers.image.version="${VERSION}"

ENV PATH="/app/.venv/bin:${PATH}" \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    VERSION="${VERSION}" \
    GIT_SHA="${VCS_REF}"

WORKDIR /app

RUN apt-get update \
    && apt-get install --yes --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --gid 10001 restorio \
    && useradd --uid 10001 --gid restorio --no-create-home --shell /usr/sbin/nologin restorio

COPY --from=dependencies --chown=10001:10001 /app/.venv /app/.venv
COPY --chown=10001:10001 . /app

USER 10001:10001

EXPOSE 8000

HEALTHCHECK --interval=15s --timeout=5s --start-period=60s --retries=5 \
  CMD ["curl", "--fail", "--silent", "--show-error", "http://127.0.0.1:8000/health/live"]

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--no-access-log"]
