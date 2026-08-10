ARG BUN_IMAGE=oven/bun:1.3.5-alpine@sha256:245ea34e0fe836d0fa113065d2a2da7bbc77f6b5a3240df8b1f64e6c19f8dabc
ARG NGINX_IMAGE=nginxinc/nginx-unprivileged:1.31.3-alpine3.24@sha256:a6c3ec0c0d249d68b0682df854d4a9e222b90fb607dc3fcf2f1d2fcbc85d347e

FROM ${BUN_IMAGE} AS build

ARG VERSION

ENV NODE_ENV=production \
    VITE_APP_VERSION="${VERSION}" \
    VITE_ENV=production

WORKDIR /workspace

COPY bun.lock bunfig.toml package.json turbo.json tsconfig.base.json tsconfig.json ./
COPY app/apps ./app/apps
COPY app/packages ./app/packages

RUN bun install --frozen-lockfile && \
    bun run turbo run build --filter=@restorio/admin-panel... \
    && mkdir -p /output \
    && cp -R app/apps/admin-panel/dist/. /output/

FROM ${NGINX_IMAGE} AS runtime

ARG VERSION
ARG VCS_REF

LABEL org.opencontainers.image.description="Restorio admin-panel static frontend" \
      org.opencontainers.image.revision="${VCS_REF}" \
      org.opencontainers.image.source="https://github.com/restorio-labs/restorio-fullstack" \
      org.opencontainers.image.title="Restorio admin-panel" \
      org.opencontainers.image.version="${VERSION}"

COPY app/apps/admin-panel/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build --chown=101:101 /output/ /usr/share/nginx/html/

USER 101:101

EXPOSE 8080

HEALTHCHECK --interval=15s --timeout=3s --start-period=10s --retries=3 \
  CMD ["wget", "--quiet", "--spider", "http://127.0.0.1:8080/healthz"]
