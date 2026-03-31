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

# Create a volume point so dokploy doesn't lose sqlite data across deploys
# The db is generated relative to where we run, so if it's running in /app
# the sqlite db will be /app/pollen.sqlite
VOLUME ["/app/data"]
# update db path to /app/data/pollen.sqlite if we want persistence
