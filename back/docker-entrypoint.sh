#!/bin/sh
set -e

echo "[entrypoint] Ensuring /data exists..."
mkdir -p /data

echo "[entrypoint] Generating Prisma client..."
npx prisma generate

echo "[entrypoint] Applying database schema..."
npx prisma db push

echo "[entrypoint] Running seed..."
npx prisma db seed

echo "[entrypoint] Starting application..."
exec node src/server.js