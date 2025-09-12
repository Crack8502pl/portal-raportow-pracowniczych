# 🐋 Docker Setup - Portal Raportów Pracowniczych

## Szybki start (1 minuta)

```bash
# Sklonuj projekt
git clone https://github.com/Crack8502pl/portal-raportow-pracowniczych.git
cd portal-raportow-pracowniczych

# Uruchom automatyczny setup
./quickstart.sh

# Gotowe! Aplikacja na http://localhost:3000
```

## Ręczny setup

```bash
# 1. Konfiguracja (opcjonalne)
cp .env.example .env
nano .env

# 2. Uruchomienie
docker compose up -d

# 3. Import przykładowych danych (opcjonalne) 
./scripts/import-sample-data.sh
```

## Dostępne profile

```bash
# Podstawowy (dev/test)
docker compose up -d

# Produkcyjny (z Nginx)
docker compose --profile production up -d

# Import danych JSON
docker compose --profile import up
```

## Usługi

| Usługa | Kontener | Port | Opis |
|--------|----------|------|------|
| **PostgreSQL** | `portal_postgres` | 5432 | Baza danych |
| **Aplikacja** | `portal_app` | 3000 | Backend + Frontend |
| **Nginx** | `portal_nginx` | 80, 443 | Reverse proxy (produkcja) |

## Dane JSON

Przykładowe dane znajdują się w `/data/json-import/`:

- `users.json` - Użytkownicy systemu
- `employees.json` - Lista pracowników  
- `reports.json` - Przykładowe raporty
- `system_settings.json` - Ustawienia systemu

## Konta testowe

Po instalacji dostępne są konta:

| Login | Hasło | Rola |
|-------|-------|------|
| `admin` | `admin123` | Administrator |
| `koordynator` | `koord123` | Koordynator |  
| `pracownik` | `prac123` | Pracownik |

## Komendy zarządzania

```bash
# Status
docker compose ps

# Logi
docker compose logs -f
docker compose logs app
docker compose logs postgres

# Restart
docker compose restart
docker compose restart app

# Stop
docker compose down

# Stop + usunięcie danych
docker compose down -v

# Aktualizacja
git pull
docker compose up --build -d
```

## Backup & Restore

```bash
# Backup bazy danych
docker exec portal_postgres pg_dump -U portal_user portal_reports > backup_$(date +%Y%m%d).sql

# Restore
docker exec -i portal_postgres psql -U portal_user portal_reports < backup_20240912.sql

# Backup plików (uploads)
docker cp portal_app:/app/uploads ./backup_uploads_$(date +%Y%m%d)
```

## Konfiguracja produkcyjna

### 1. Zmienne środowiskowe
Edytuj `.env`:
```env
DB_PASSWORD=silne_haslo_123456
JWT_SECRET=bardzo_dluga_losowa_wartosc
SMTP_HOST=smtp.twoja-firma.com
SMTP_USER=raporty@twoja-firma.com
EMAIL_FROM=raporty@twoja-firma.com
```

### 2. HTTPS z certyfikatem
```bash
# Dodaj certyfikaty do nginx/
mkdir -p nginx/ssl
# Skopiuj cert.pem i key.pem

# Uruchom z HTTPS
docker compose --profile production up -d
```

### 3. Monitoring
```bash
# Sprawdź zużycie zasobów
docker stats

# Sprawdź logi błędów
docker compose logs --tail=100 app | grep -i error

# Health check
curl http://localhost:3000/health
```

## Rozwiązywanie problemów

### "no configuration file provided"
```bash
# Sprawdź czy jesteś w głównym katalogu
ls -la docker-compose.yml

# Użyj docker compose (nie docker-compose)
docker compose up -d
```

### "fe_sendauth: no password supplied"
```bash
# Sprawdź status PostgreSQL
docker compose logs postgres

# Restart bazy danych
docker compose restart postgres

# Sprawdź zmienne środowiskowe
docker compose config | grep -A 5 -B 5 DB_
```

### Port już zajęty
```bash
# Znajdź co używa portu
sudo netstat -tulpn | grep :3000
sudo lsof -i :3000

# Zmień port w .env
echo "APP_PORT=3001" >> .env
docker compose up -d
```

### Brak miejsca na dysku
```bash
# Wyczyść nieużywane obrazy
docker system prune -a

# Wyczyść wolumeny  
docker volume prune

# Sprawdź zużycie
docker system df
```

### Import danych nie działa
```bash
# Sprawdź czy pliki JSON istnieją
ls -la data/json-import/

# Uruchom import manualnie
docker compose exec postgres psql -U portal_user -d portal_reports

# Debug import script
docker compose run --rm json-import bash
```

## Rozszerzenia

### Dodanie nowej usługi
Edytuj `docker-compose.yml`:
```yaml
services:
  # ... existing services
  
  redis:
    image: redis:alpine
    container_name: portal_redis
    networks:
      - portal_network
```

### Własna baza danych
```yaml
  postgres:
    # ... existing config
    volumes:
      - ./my-data:/var/lib/postgresql/data
      - ./my-init:/docker-entrypoint-initdb.d/
```

### Monitoring z Grafana
```bash
# Dodaj monitoring stack
docker compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d
```