# 🚀 Szybki Start - Portal Raportów Pracowniczych

## ⚡ Uruchomienie w 3 krokach

### 1. 📥 Pobierz projekt
```bash
git clone https://github.com/Crack8502pl/portal-raportow-pracowniczych.git
cd portal-raportow-pracowniczych
```

### 2. 🧪 Sprawdź czy wszystko działa
```bash
./test-setup.sh
```

### 3. 🚀 Uruchom aplikację
```bash
docker compose up -d
```

**Gotowe!** Aplikacja dostępna na: **http://localhost:3000**

---

## 🔐 Konta testowe

| Login | Hasło | Rola |
|-------|-------|------|
| `admin` | `admin123` | Administrator |
| `koordynator` | `koord123` | Koordynator |
| `pracownik` | `prac123` | Pracownik |

---

## 📋 Przydatne komendy

```bash
# Uruchomienie aplikacji
docker compose up -d

# Status kontenerów
docker compose ps

# Logi aplikacji
docker compose logs -f app

# Logi bazy danych
docker compose logs -f postgres

# Zatrzymanie aplikacji
docker compose down

# Restart aplikacji
docker compose restart

# Aktualizacja aplikacji
git pull && docker compose up --build -d
```

---

## 🔧 Rozwiązywanie problemów

### ❌ "docker-compose: command not found"
```bash
# Użyj Docker Compose v2
docker compose up -d
# zamiast: docker-compose up -d
```

### ❌ "no configuration file provided"
```bash
# Sprawdź czy jesteś w głównym katalogu
ls docker-compose.yml

# Uruchom z głównego katalogu projektu
cd portal-raportow-pracowniczych
docker compose up -d
```

### ❌ "fe_sendauth: no password supplied"
```bash
# Sprawdź czy PostgreSQL jest uruchomiony
docker compose ps postgres

# Restart bazy danych
docker compose restart postgres

# Sprawdź logi
docker compose logs postgres
```

### ❌ Port 3000 jest zajęty
```bash
# Znajdź co używa portu
sudo netstat -tulpn | grep :3000

# Lub zmień port w .env
echo "APP_PORT=3001" >> .env
docker compose up -d
```

---

## 📊 Funkcje systemu

- ✅ **Zarządzanie użytkownikami** (admin, koordynator, pracownik)
- ✅ **Tworzenie raportów** z pracownikami i czasami pracy
- ✅ **Załączniki** (zdjęcia, dokumenty PDF, Excel)
- ✅ **Export do Excel** raportów
- ✅ **Powiadomienia email** o nowych raportach
- ✅ **Panel administracyjny** do zarządzania systemem
- ✅ **Responsywny design** - działa na telefonach i tabletach
- ✅ **Backup i przywracanie** bazy danych

---

## 🏢 Konfiguracja firmy

Edytuj plik `.env` aby dostosować do twojej firmy:

```env
COMPANY_NAME=Twoja Firma Budowlana
COMPANY_ADDRESS=ul. Twoja Ulica 123, 00-001 Miasto
COMPANY_PHONE=+48 xx xxx xx xx
EMAIL_FROM=raporty@twoja-firma.com
EMAIL_RECIPIENTS=manager@twoja-firma.com,admin@twoja-firma.com
```

---

## 🔒 Bezpieczeństwo produkcyjne

Przed wdrożeniem w produkcji:

1. **Zmień hasła**:
   ```env
   DB_PASSWORD=bardzo_silne_haslo_123
   JWT_SECRET=bardzo_dluga_losowa_wartosc
   ```

2. **Konfiguruj email**:
   ```env
   SMTP_HOST=smtp.twoja-firma.com
   SMTP_USER=raporty@twoja-firma.com
   SMTP_PASSWORD=haslo_email
   ```

3. **Użyj HTTPS**:
   ```bash
   docker compose --profile production up -d
   ```

---

## 📞 Wsparcie

- 📖 **Szczegółowa dokumentacja**: `INSTALACJA.md`
- 🐋 **Docker setup**: `DOCKER-SETUP.md`  
- 🔧 **Rozwiązywanie problemów**: `INSTALACJA.md`
- 🐛 **Zgłaszanie błędów**: [GitHub Issues](https://github.com/Crack8502pl/portal-raportow-pracowniczych/issues)

---

## ✨ Co dalej?

1. **Dodaj prawdziwych pracowników** w panelu administracyjnym
2. **Skonfiguruj email** dla powiadomień  
3. **Utwórz pierwsze raporty** jako pracownik
4. **Sprawdź eksport do Excel** jako koordynator
5. **Ustaw backup** bazy danych na produkcji