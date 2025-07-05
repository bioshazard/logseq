# Remote DB Service

This feature allows multiple Logseq clients to share a single SQLite database instance. The DB worker is compiled for Node.js and served over HTTP and WebSocket.

## Build the worker

First build the Node version of the DB worker using `shadow-cljs`:

```bash
# from the repo root
npx shadow-cljs release db-worker-node
```

The script outputs `static/db-worker.node.js`.

## Start the service

Run the server with Node:

```bash
cd scripts
node src/remote_db_service.js
```

The service listens on port `3030` by default and exposes the thread APIs under `/api/db`. WebSocket clients may connect to `/api/db/ws`.

Set the environment variable `REMOTE_DB_URL` in the client build (or configure `frontend.config/REMOTE-DB-URL`) to the base URL of the service, e.g. `http://localhost:3030`.

## Docker example

A simple Docker image can run the service:

```Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY . .
RUN yarn install --mode=skip-build \
    && npx shadow-cljs release db-worker-node
CMD ["node", "scripts/src/remote_db_service.js"]
```

Build and run:

```bash
docker build -t logseq-remote-db -f Dockerfile .
docker run -p 3030:3030 logseq-remote-db
```

Clients can now set `REMOTE_DB_URL=http://localhost:3030` to use the shared database.
