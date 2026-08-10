FROM oven/bun:1.3.5-alpine@sha256:245ea34e0fe836d0fa113065d2a2da7bbc77f6b5a3240df8b1f64e6c19f8dabc AS builder
WORKDIR /repo

COPY package.json bun.lock turbo.json tsconfig.base.json ./
COPY app ./app

RUN bun install --frozen-lockfile

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN bun run turbo run build --filter=@restorio/public-web --concurrency=1

FROM oven/bun:1.3.5-alpine@sha256:245ea34e0fe836d0fa113065d2a2da7bbc77f6b5a3240df8b1f64e6c19f8dabc AS runner
WORKDIR /repo
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000

RUN addgroup -S -g 10001 restorio && \
    adduser -S -D -H -u 10001 -G restorio restorio

COPY --chown=restorio:restorio --from=builder /repo/package.json /repo/bun.lock ./
COPY --chown=restorio:restorio --from=builder /repo/node_modules ./node_modules
COPY --chown=restorio:restorio --from=builder /repo/app/packages ./app/packages
COPY --chown=restorio:restorio --from=builder /repo/app/apps/public-web ./app/apps/public-web

WORKDIR /repo/app/apps/public-web
USER restorio
EXPOSE 3000
CMD ["bun", "run", "start"]
