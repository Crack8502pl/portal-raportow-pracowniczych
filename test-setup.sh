#!/bin/bash

# Portal Raportów Pracowniczych - Test Setup Script
# This script tests if the Docker setup is working correctly

set -e

echo "🧪 Portal Raportów Pracowniczych - Test Setup"
echo "============================================="

# Test Docker availability
echo "🔍 Sprawdzenie Docker..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker nie jest zainstalowany"
    exit 1
fi

if ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose nie jest dostępny"
    exit 1
fi

echo "✅ Docker i Docker Compose są dostępne"

# Test docker-compose.yml
echo "🔍 Sprawdzenie konfiguracji Docker Compose..."
if [ ! -f docker-compose.yml ]; then
    echo "❌ Plik docker-compose.yml nie znaleziony"
    exit 1
fi

if ! docker compose config --quiet; then
    echo "❌ Błąd w konfiguracji docker-compose.yml"
    exit 1
fi

echo "✅ Konfiguracja Docker Compose jest poprawna"

# Test .env file
echo "🔍 Sprawdzenie pliku .env..."
if [ ! -f .env ]; then
    echo "⚠️  Plik .env nie znaleziony, kopiuję z .env.example"
    if [ -f .env.example ]; then
        cp .env.example .env
        echo "✅ Plik .env utworzony"
    else
        echo "❌ Brak pliku .env.example"
        exit 1
    fi
else
    echo "✅ Plik .env istnieje"
fi

# Test database files
echo "🔍 Sprawdzenie plików bazy danych..."
if [ ! -f database/init.sql ]; then
    echo "❌ Brak pliku database/init.sql"
    exit 1
fi

if [ ! -d database/migrations ]; then
    echo "❌ Brak katalogu database/migrations"
    exit 1
fi

echo "✅ Pliki bazy danych są obecne"

# Test JSON import files
echo "🔍 Sprawdzenie plików JSON..."
json_files=("users.json" "employees.json" "reports.json" "system_settings.json")
for file in "${json_files[@]}"; do
    if [ ! -f "data/json-import/$file" ]; then
        echo "❌ Brak pliku data/json-import/$file"
        exit 1
    fi
done

echo "✅ Pliki JSON są obecne"

# Test PostgreSQL startup
echo "🔍 Test uruchomienia PostgreSQL..."
echo "   Uruchamianie PostgreSQL (może potrwać chwilę)..."

if docker compose up -d postgres; then
    echo "✅ PostgreSQL uruchomiony"
    
    # Wait for PostgreSQL to be ready
    echo "   Czekam na gotowość bazy danych..."
    timeout 60 bash -c 'until docker compose exec -T postgres pg_isready -U portal_user; do sleep 2; done'
    
    if [ $? -eq 0 ]; then
        echo "✅ PostgreSQL jest gotowy"
        
        # Test database connection
        echo "🔍 Test połączenia z bazą danych..."
        if docker compose exec -T postgres psql -U portal_user -d portal_reports -c "SELECT COUNT(*) FROM users;" > /dev/null; then
            echo "✅ Połączenie z bazą danych działa"
            
            # Show test users
            echo "🔍 Sprawdzenie użytkowników testowych..."
            docker compose exec -T postgres psql -U portal_user -d portal_reports -c "SELECT login, full_name, role FROM users;"
            
        else
            echo "❌ Błąd połączenia z bazą danych"
            exit 1
        fi
    else
        echo "❌ Timeout - baza danych nie jest gotowa"
        exit 1
    fi
else
    echo "❌ Błąd uruchamiania PostgreSQL"
    exit 1
fi

echo ""
echo "🎉 Test zakończony pomyślnie!"
echo ""
echo "📋 Podsumowanie:"
echo "✅ Docker i Docker Compose działają"
echo "✅ Konfiguracja jest poprawna"
echo "✅ PostgreSQL uruchomiony i gotowy"
echo "✅ Baza danych zainicjalizowana"
echo "✅ Użytkownicy testowi utworzeni"
echo ""
echo "🚀 Następne kroki:"
echo "1. Uruchom pełną aplikację: docker compose up -d"
echo "2. Otwórz http://localhost:3000 w przeglądarce"
echo "3. Zaloguj się jako admin / admin123"
echo ""
echo "🛑 Aby zatrzymać serwisy: docker compose down"

# Cleanup on exit
trap 'echo "🧹 Sprzątanie..."; docker compose down > /dev/null 2>&1' EXIT