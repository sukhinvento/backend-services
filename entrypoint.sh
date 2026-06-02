#!/bin/bash

set -e

echo "🚀 Backend service starting..."

# Wait for MongoDB to be ready
echo "⏳ Waiting for MongoDB to be ready..."
for i in {1..30}; do
  if mongosh --host mongodb --eval "db.adminCommand('ping')" 2>/dev/null; then
    echo "✅ MongoDB is ready"
    break
  fi
  echo "   Attempt $i/30: MongoDB not ready yet, waiting..."
  sleep 2
done

# Wait for Kafka to be ready
echo "⏳ Waiting for Kafka to be ready..."
for i in {1..30}; do
  if nc -z kafka 9092 2>/dev/null; then
    echo "✅ Kafka is ready"
    break
  fi
  echo "   Attempt $i/30: Kafka not ready yet, waiting..."
  sleep 2
done

# Check if we need to seed (optional - only run if SEED_DB env var is set to 'true')
if [ "$SEED_DB" = "true" ]; then
  echo "🌱 Seeding database..."
  npm run seed-all || echo "⚠️  Seeding failed or already seeded, continuing..."
fi

echo "✅ All services ready, starting application..."
npm run start:prod
