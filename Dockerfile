FROM oven/bun:1 as builder
WORKDIR /app

# Build frontend
COPY frontend/package.json frontend/bun.lock* ./frontend/
RUN cd frontend && bun install --frozen-lockfile
COPY frontend/ ./frontend/
RUN cd frontend && bun run build

# Build backend
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile
COPY backend/ ./backend/

FROM oven/bun:1-alpine
WORKDIR /app
COPY --from=builder /app/package.json /app/bun.lock* ./
RUN bun install --production --frozen-lockfile
COPY --from=builder /app/backend/ ./backend/
COPY --from=builder /app/frontend/dist/ ./frontend/dist/

EXPOSE 8080
CMD ["bun", "run", "backend/src/index.ts"]
