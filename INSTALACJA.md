# 🚀 Instalacja Portal Raportów Pracowniczych

## Szybka instalacja z Docker

### Wymagania
- Docker 20.0+ 
- Docker Compose v2
- 4GB RAM
- 2GB miejsca na dysku

### 1. Pobieranie projektu
```bash
git clone https://github.com/Crack8502pl/portal-raportow-pracowniczych.git
cd portal-raportow-pracowniczych
```

### 2. Konfiguracja (opcjonalna)
Edytuj plik `.env` jeśli chcesz zmienić domyślne ustawienia:
```bash
nano .env
```

**Ważne ustawienia do zmiany w produkcji:**
- `DB_PASSWORD` - hasło do bazy danych
- `JWT_SECRET` - klucz do tokenów JWT
- `SMTP_*` - ustawienia email (jeśli chcesz powiadomienia)

### 3. Uruchomienie aplikacji
```bash
# Uruchom wszystkie usługi
docker compose up -d

# Sprawdź status
docker compose ps
```

### 4. Import przykładowych danych (opcjonalnie)
```bash
# Import dodatkowych danych JSON
./scripts/import-sample-data.sh
```

### 5. Dostęp do aplikacji
Otwórz przeglądarkę i przejdź do: **http://localhost:3000**

---

## 🔐 Konta testowe

Po instalacji dostępne są następujące konta:

| Login | Hasło | Rola | Opis |
|-------|-------|------|------|
| `admin` | `admin123` | Administrator | Pełny dostęp do systemu |
| `koordynator` | `koord123` | Koordynator | Zarządzanie projektami i raportami |
| `pracownik` | `prac123` | Pracownik | Tworzenie i edytowanie raportów |
| `kierownik` | `kier123` | Koordynator | Nadzorowanie projektów |
| `elektryk` | `elek123` | Pracownik | Specjalista elektryki |
| `hydraulik` | `hydr123` | Pracownik | Specjalista hydrauliki |

---

## 📋 Przydatne komendy

### Zarządzanie kontenerami
```bash
# Wyświetlenie logów
docker compose logs -f

# Restart aplikacji
docker compose restart app

# Zatrzymanie wszystkich usług  
docker compose down

# Zatrzymanie z usunięciem danych
docker compose down -v
```

### Backup i przywracanie bazy danych
```bash
# Backup
docker exec portal_postgres pg_dump -U portal_user portal_reports > backup.sql

# Przywracanie
docker exec -i portal_postgres psql -U portal_user portal_reports < backup.sql
```

### Aktualizacja aplikacji
```bash
# Pobierz najnowsze zmiany
git pull

# Przebuduj i uruchom
docker compose up --build -d
```

---

## 🔧 Konfiguracja produkcyjna

### 1. Uruchomienie z Nginx (produkcja)
```bash
# Uruchom z profilem produkcyjnym
docker compose --profile production up -d
```

Aplikacja będzie dostępna na porcie 80 (http://localhost).

### 2. Konfiguracja email
Edytuj plik `.env`:
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=twoj-email@gmail.com
SMTP_PASSWORD=haslo-aplikacji
EMAIL_FROM=raporty@twoja-firma.com
EMAIL_RECIPIENTS=manager@twoja-firma.com,admin@twoja-firma.com
```

### 3. Zabezpieczenia
- Zmień `DB_PASSWORD` na silne hasło
- Zmień `JWT_SECRET` na losowy ciąg znaków
- Użyj HTTPS w produkcji
- Ogranicz dostęp do portów bazy danych

---

## 🛠️ Rozwiązywanie problemów

### Problem: "no configuration file provided: not found"
**Rozwiązanie:**
```bash
# Sprawdź czy jesteś w głównym katalogu projektu
pwd
ls -la docker-compose.yml

# Użyj Docker Compose v2
docker compose up -d
# zamiast: docker-compose up -d
```

### Problem: "fe_sendauth: no password supplied"  
**Rozwiązanie:**
```bash
# Sprawdź czy baza danych jest uruchomiona
docker compose ps postgres

# Sprawdź logi bazy danych
docker compose logs postgres

# Restart bazy danych
docker compose restart postgres
```

### Problem: Aplikacja nie startuje
**Rozwiązanie:**
```bash
# Sprawdź logi aplikacji
docker compose logs app

# Sprawdź czy baza jest gotowa
docker compose exec postgres pg_isready -U portal_user

# Restart z przebudową
docker compose up --build -d
```

### Problem: Błąd uprawnień do plików
**Rozwiązanie:**
```bash
# Usuń wolumeny i uruchom ponownie  
docker compose down -v
docker compose up -d
```

---

## 📞 Wsparcie

- **GitHub Issues**: [Zgłoś problem](https://github.com/Crack8502pl/portal-raportow-pracowniczych/issues)
- **Dokumentacja**: Sprawdź folder `docs/`
- **Logi debugowania**: `docker compose logs -f`

---

## 📄 Więcej informacji

- **README.md** - Ogólne informacje o projekcie
- **docs/** - Szczegółowa dokumentacja
- **API.md** - Dokumentacja API
- **CHANGELOG.md** - Historia zmian