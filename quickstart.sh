#!/bin/bash

# Portal Raportów Pracowniczych - Quickstart Script
# Szybki start aplikacji z Docker

set -e

echo "🚀 Portal Raportów Pracowniczych - Szybki Start"
echo "==============================================="

# Check if Docker is available
if ! command -v docker &> /dev/null; then
    echo "❌ Docker nie jest zainstalowany. Zainstaluj Docker i spróbuj ponownie."
    echo "   Instrukcja: https://docs.docker.com/get-docker/"
    exit 1
fi

if ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose nie jest dostępny. Sprawdź instalację Docker."
    exit 1
fi

echo "✅ Docker $(docker --version) jest dostępny"
echo "✅ Docker Compose jest dostępny"

# Check if .env exists, if not create from example
if [ ! -f .env ]; then
    echo "📝 Tworzę plik konfiguracyjny .env..."
    if [ -f .env.example ]; then
        cp .env.example .env
        # Generate random passwords
        DB_PASS="secure_db_password_$(date +%s)"
        JWT_SECRET="jwt_secret_$(openssl rand -hex 32 2>/dev/null || echo "change_me_$(date +%s)")"
        
        # Update .env with generated values
        sed -i.bak "s/DB_PASSWORD=.*/DB_PASSWORD=$DB_PASS/" .env
        sed -i.bak "s/JWT_SECRET=.*/JWT_SECRET=$JWT_SECRET/" .env
        rm -f .env.bak
        
        echo "✅ Plik .env utworzony z losowymi hasłami"
    else
        echo "⚠️  Plik .env.example nie znaleziony, używam domyślnej konfiguracji"
    fi
else
    echo "✅ Plik .env już istnieje"
fi

# Stop existing containers
echo "🛑 Zatrzymywanie istniejących kontenerów..."
docker compose down --remove-orphans 2>/dev/null || true

# Pull images and start services
echo "🏗️  Budowanie i uruchamianie aplikacji..."
echo "   To może potrwać kilka minut przy pierwszym uruchomieniu..."

if docker compose up --build -d; then
    echo "✅ Aplikacja została uruchomiona!"
    
    # Wait for services to be ready
    echo "⏳ Czekam na gotowość usług..."
    sleep 15
    
    # Check service health
    echo "🏥 Sprawdzam status usług..."
    
    if docker compose ps | grep -q "Up.*healthy"; then
        echo "✅ Usługi są uruchomione i gotowe!"
    else
        echo "⚠️  Niektóre usługi mogą jeszcze się uruchamiać..."
        echo "   Sprawdź status: docker compose ps"
        echo "   Logi aplikacji: docker compose logs app"
        echo "   Logi bazy: docker compose logs postgres"
    fi
    
    # Show container status
    echo ""
    echo "📊 Status kontenerów:"
    docker compose ps
    
    echo ""
    echo "🌐 Adres aplikacji:"
    echo "   ➡️  http://localhost:3000"
    echo ""
    echo "🔐 Konta testowe:"
    echo "   • Admin:       admin / admin123"
    echo "   • Koordynator: koordynator / koord123"
    echo "   • Pracownik:   pracownik / prac123"
    echo ""
    echo "📝 Przydatne komendy:"
    echo "   • Logi:          docker compose logs -f"
    echo "   • Stop:          docker compose down"
    echo "   • Restart:       docker compose restart"
    echo "   • Status:        docker compose ps"
    echo ""
    echo "📖 Więcej informacji:"
    echo "   • Instrukcja instalacji: cat INSTALACJA.md"
    echo "   • Dokumentacja projektu: cat README.md"
    echo ""
    echo "✅ Instalacja zakończona pomyślnie! 🎉"
    
else
    echo "❌ Błąd podczas uruchamiania aplikacji"
    echo ""
    echo "🔧 Rozwiązywanie problemów:"
    echo "   1. Sprawdź logi: docker compose logs"
    echo "   2. Sprawdź status: docker compose ps"
    echo "   3. Restart: docker compose down && docker compose up -d"
    echo "   4. Zobacz INSTALACJA.md dla więcej pomocy"
    exit 1
fi