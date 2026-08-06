ARG BUN_IMAGE=oven/bun:1.3.5-alpine
ARG NGINX_IMAGE=nginxinc/nginx-unprivileged:1.31.3-alpine3.24

FROM ${BUN_IMAGE} AS build

ARG APP_NAME
ARG VERSION

ENV NODE_ENV=production \
    VITE_API_BASE_URL=/api/v1 \
    VITE_APP_VERSION="${VERSION}" \
    VITE_ENV=production

WORKDIR /workspace

COPY bun.lock bunfig.toml package.json turbo.json tsconfig.base.json tsconfig.json ./
COPY app/apps ./app/apps
COPY app/packages ./app/packages

RUN test -n "${APP_NAME}" \
    && test -f "app/apps/${APP_NAME}/package.json" \
    && bun install --frozen-lockfile \
    && bun run turbo run build --filter="@restorio/${APP_NAME}..." \
    && mkdir -p /output \
    && cp -R "app/apps/${APP_NAME}/dist/." /output/

FROM ${NGINX_IMAGE} AS runtime

ARG APP_NAME
ARG BUILD_DATE
ARG VERSION
ARG VCS_REF

LABEL org.opencontainers.image.created="${BUILD_DATE}" \
      org.opencontainers.image.description="Restorio ${APP_NAME} static frontend" \
      org.opencontainers.image.revision="${VCS_REF}" \
      org.opencontainers.image.source="https://github.com/restorio-labs/restorio-fullstack" \
      org.opencontainers.image.title="Restorio ${APP_NAME}" \
      org.opencontainers.image.version="${VERSION}"

COPY infra/images/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build --chown=101:101 /output/ /usr/share/nginx/html/

USER 101:101

EXPOSE 8080

HEALTHCHECK --interval=15s --timeout=3s --start-period=10s --retries=3 \
  CMD ["wget", "--quiet", "--spider", "http://127.0.0.1:8080/healthz"]
