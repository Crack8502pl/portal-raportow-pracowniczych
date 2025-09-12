#!/bin/bash

# Portal Raportów Pracowniczych - Simple Sample Data Import
# This script imports sample data when Docker is already running

set -e

echo "📥 Import przykładowych danych do bazy PostgreSQL"
echo "=============================================="

# Check if Docker is running
if ! docker ps > /dev/null 2>&1; then
    echo "❌ Docker nie jest uruchomiony. Uruchom najpierw: docker compose up -d"
    exit 1
fi

# Check if postgres container is running
if ! docker ps | grep -q "portal_postgres"; then
    echo "❌ Kontener PostgreSQL nie jest uruchomiony"
    echo "   Uruchom: docker compose up -d"
    exit 1
fi

echo "✅ Docker i PostgreSQL działają"

# Import data using the container
echo "🔄 Importowanie danych..."
docker compose run --rm json-import /scripts/import-json-data.sh

echo ""
echo "✅ Import zakończony!"
echo ""
echo "🌐 Aplikacja dostępna na:"
echo "   http://localhost:3000"
echo ""
echo "🔐 Konta testowe:"
echo "   - Admin: admin / admin123"
echo "   - Koordynator: koordynator / koord123"
echo "   - Pracownik: pracownik / prac123"