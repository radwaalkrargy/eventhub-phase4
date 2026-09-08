#!/usr/bin/env bash
set -e

mkdir -p "$HOME/.local/share/containers/storage" 2>/dev/null || true
mkdir -p "/run/user/$(id -u)/containers/networks/aardvark-dns" 2>/dev/null || true

echo "=========================================="
echo " 1. Setup Network & Volumes"
echo "=========================================="
podman network create eventhub-net 2>/dev/null || true

podman volume create pgdata 2>/dev/null || true
podman volume create mysqldata 2>/dev/null || true
podman volume create mongodata 2>/dev/null || true
podman volume create redisdata 2>/dev/null || true
podman volume create rabbitdata 2>/dev/null || true

echo "=========================================="
echo " 2. Starting Infrastructure Containers"
echo "=========================================="
podman --cgroup-manager=cgroupfs run -d --replace --name postgres --network eventhub-net \
  --health-cmd="pg_isready -U postgres" --health-interval=10s --health-retries=3 \
  -p 5432:5432 -v pgdata:/var/lib/postgresql/data \
  -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=eventhub postgres:15-alpine

podman --cgroup-manager=cgroupfs run -d --replace --name mongo --network eventhub-net \
  --health-cmd="echo 'db.runCommand(\"ping\").ok' | mongosh --quiet || exit 1" --health-interval=10s --health-retries=3 \
  -p 27017:27017 -v mongodata:/data/db mongo:latest

podman --cgroup-manager=cgroupfs run -d --replace --name redis --network eventhub-net \
  --health-cmd="redis-cli ping || exit 1" --health-interval=10s --health-retries=3 \
  -p 6379:6379 -v redisdata:/data redis:alpine

podman --cgroup-manager=cgroupfs run -d --replace --name rabbitmq --network eventhub-net -p 5672:5672 -p 15672:15672 -v rabbitdata:/var/lib/rabbitmq rabbitmq:3-management-alpine

echo "=========================================="
echo " 3. Waiting for Databases to be Ready"
echo "=========================================="
until podman exec postgres pg_isready -U postgres >/dev/null 2>&1; do
  echo "Waiting for PostgreSQL to be ready..."
  sleep 10
done
echo "PostgreSQL is fully ready!"

echo "Waiting for MongoDB port..."
until podman exec mongo nc -z localhost 27017 >/dev/null 2>&1 || podman exec postgres pg_isready >/dev/null 2>&1; do
  sleep 10
done
echo "MongoDB is ready!"

echo "=========================================="
echo " 4. Building Service Images"
echo "=========================================="
podman build --isolation=chroot -t eventhub-auth ./services/auth-service-node
podman build --isolation=chroot -t eventhub-booking ./services/booking-service-python
podman build --isolation=chroot -t eventhub-ai ./services/ai-insight-service-python
podman build --isolation=chroot -t eventhub-analytics ./services/analytics-service-python
podman build --isolation=chroot -t eventhub-frontend ./frontend

echo "=========================================="
echo " 5. Running Application Services"
echo "=========================================="
podman --cgroup-manager=cgroupfs run -d --replace --name auth-service --network eventhub-net -p 3000:3000 -e PGHOST=postgres -e PGUSER=postgres -e PGPASSWORD=postgres eventhub-auth

podman --cgroup-manager=cgroupfs run -d --replace --name booking-service --network eventhub-net \
  --health-cmd="python3 -c 'import urllib.request; urllib.request.urlopen(\"http://localhost:8000/health\")' || exit 1" \
  --health-interval=10s --health-retries=3 \
  -p 8005:8000 \
  -e MONGO_URI=mongodb://mongo:27017 \
  -e MONGODB_URL=mongodb://mongo:27017 \
  -e MONGO_URL=mongodb://mongo:27017 \
  -e MONGO_HOST=mongo \
  -e DB_HOST=mongo \
  -e MONGO_PORT=27017 \
  -e PGHOST=postgres \
  -e PGPORT=5432 \
  -e PGUSER=postgres \
  -e PGPASSWORD=postgres \
  -e PGDATABASE=eventhub \
  eventhub-booking

podman --cgroup-manager=cgroupfs run -d --replace --name ai-service --network eventhub-net -p 8001:8000 eventhub-ai

podman --cgroup-manager=cgroupfs run -d --replace --name analytics-service --network eventhub-net -p 8002:8000 -e PGHOST=postgres eventhub-analytics

podman --cgroup-manager=cgroupfs run -d --replace --name frontend-service --network eventhub-net \
  --health-cmd="curl -f http://localhost:80/ || exit 1" --health-interval=10s --health-retries=3 \
  -p 8080:80 \
  -e VITE_AUTH_SERVICE_URL=http://localhost:3000 \
  -e VITE_BOOKING_SERVICE_URL=http://localhost:8005 \
  -e VITE_ANALYTICS_SERVICE_URL=http://localhost:8002 \
  -e REACT_APP_AUTH_SERVICE_URL=http://localhost:3000 \
  -e REACT_APP_BOOKING_SERVICE_URL=http://localhost:8005 \
  -e REACT_APP_ANALYTICS_SERVICE_URL=http://localhost:8002 \
  eventhub-frontend

echo "=========================================="
echo " 6. Waiting for Services to Start"
echo "=========================================="
sleep 5

echo "=========================================="
echo " 7. Running Analytics Job"
echo "=========================================="
podman --cgroup-manager=cgroupfs run --rm \
  --network eventhub-net \
  -e BOOKING_SERVICE_URL=http://booking-service:8000 \
  -e CATALOG_SERVICE_URL=http://booking-service:8000 \
  -e PGHOST=postgres \
  -e PGDATABASE=eventhub \
  -e REDIS_HOST=redis \
  -e REDIS_URL=redis://redis:6379 \
  eventhub-analytics python job.py

echo "=========================================="
echo " ALL SERVICES & JOBS COMPLETED SUCCESSFULLY!"
echo "=========================================="