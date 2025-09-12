# Portal Raportów Pracowniczych

Kompletny system webowy do zarządzania raportami pracowniczymi z możliwością łatwego przeniesienia między środowiskami deweloperskimi i produkcyjnymi.

## 🌟 Funkcjonalności

### 🔐 System logowania i autoryzacji
- **3 typy użytkowników**: Pracownik, Koordynator, Administrator
- Bezpieczne logowanie JWT z automatycznym odświeżaniem tokenów
- Role-based access control (RBAC)
- Zarządzanie użytkownikami i resetowanie haseł

### 📋 Zarządzanie raportami
- **Kompleksowy formularz raportu** z walidacją w czasie rzeczywistym
- Automatyczne wypełnianie daty i użytkownika
- Wielopracownikowe raporty z godzinami pracy
- System wersjonowania raportów (V1, V2, V3...)
- Upload załączników (JPG, PNG, PDF, DOC, XLS)

### 📧 System powiadomień email
- Automatyczne wysyłanie raportów po utworzeniu
- Konfigurowalne szablony HTML
- Konfiguracja SMTP przez panel administracyjny

### 👥 Panel pracownika
- Dashboard z osobistymi statystykami
- Tworzenie i edycja raportów
- Archiwum własnych raportów z filtrowaniem
- Zarządzanie profilem

### 👔 Panel koordynatora
- Dostęp do wszystkich raportów w systemie
- Zaawansowane filtrowanie i wyszukiwanie
- Export do Excel z formatowaniem
- Zarządzanie listą pracowników
- Statystyki aktywności

### ⚙️ Panel administratora
- Pełne zarządzanie użytkownikami
- Konfiguracja ustawień systemowych
- Logi aktywności i monitoring systemu
- Narzędzia konserwacji i backup

## 🛠️ Stack technologiczny

### Backend
- **Node.js** + **Express.js** + **TypeScript**
- **PostgreSQL** z **Sequelize ORM**
- **JWT** + **bcrypt** dla bezpieczeństwa
- **Nodemailer** dla powiadomień email
- **ExcelJS** dla eksportu danych
- **Multer** + **Sharp** dla obsługi plików

### Frontend
- **HTML5** + **CSS3** + **JavaScript ES6+**
- Responsywny design z **CSS Grid/Flexbox**
- Nowoczesny design inspirowany der-mag.pl
- Vanilla JavaScript - bez zewnętrznych bibliotek

### Infrastruktura
- **Docker** + **docker-compose** dla konteneryzacji
- **Nginx** jako reverse proxy
- **PostgreSQL** jako baza danych
- Gotowe do deploy na **Ubuntu 22.04 LTS** / **Proxmox**

## 🚀 Szybki start

### Wymagania
- Node.js 18+
- PostgreSQL 12+ lub Docker
- Git

### 1. Klonowanie repozytorium
```bash
git clone https://github.com/your-repo/portal-raportow-pracowniczych.git
cd portal-raportow-pracowniczych
```

### 2. Instalacja deweloperska (Windows/macOS/Linux)
```bash
# Uruchom skrypt konfiguracji
./scripts/setup.sh

# Uruchom w trybie deweloperskim
npm run dev
```

### 3. Deploy produkcyjny (Docker)
```bash
# Uruchom deploy z Docker
./scripts/deploy.sh

# Aplikacja dostępna na http://localhost:3000
```

### 4. Logowanie
Użyj domyślnych kont testowych:
- **Administrator**: `admin` / `admin123`
- **Koordynator**: `koordynator` / `koord123`
- **Pracownik**: `pracownik` / `prac123`

## 📁 Struktura projektu

```
portal-raportow-pracowniczych/
├── server/                 # Backend Node.js + TypeScript
│   ├── src/
│   │   ├── controllers/   # Logika biznesowa
│   │   ├── models/        # Modele bazy danych
│   │   ├── routes/        # Endpointy API
│   │   ├── middleware/    # Walidacja, auth, logowanie
│   │   ├── services/      # Email, Excel, File handling
│   │   └── utils/         # Narzędzia pomocnicze
│   └── package.json
├── client/                # Frontend HTML/CSS/JS
│   ├── assets/
│   │   ├── css/          # Style responsywne
│   │   └── js/           # Logika aplikacji
│   └── index.html
├── database/              # Migracje i dane testowe
├── docker/               # Konfiguracja Docker
├── scripts/              # Skrypty deploy i setup
└── docs/                 # Dokumentacja
```

## 🔧 Konfiguracja

### Zmienne środowiskowe (.env)
```bash
# Server
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=portal_reports
DB_USER=portal_user
DB_PASSWORD=secure_db_password

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# SMTP Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=reports@company.com
EMAIL_RECIPIENTS=manager@company.com,admin@company.com

# Upload limits
MAX_FILE_SIZE=5242880
ALLOWED_EXTENSIONS=jpg,jpeg,png,pdf,doc,docx,xls,xlsx
```

## 📊 Schemat bazy danych

System wykorzystuje PostgreSQL z następującymi tabelami:
- `users` - Użytkownicy systemu
- `employees` - Pracownicy (dla select w raportach)
- `reports` - Główne raporty
- `report_workers` - Pracownicy przypisani do raportów
- `report_attachments` - Załączniki do raportów
- `activity_logs` - Logi aktywności
- `system_settings` - Ustawienia systemu

## 🎨 Design i UX

- **Nowoczesny design** inspirowany der-mag.pl
- **Responsywny** - działa na wszystkich urządzeniach
- **Intuicyjny** - prosty w obsłudze
- **Accessible** - zgodny ze standardami dostępności
- **Fast** - optymalizowane ładowanie i animacje

## 🔒 Bezpieczeństwo

- **Authentication**: JWT tokens z automatycznym odświeżaniem
- **Authorization**: Role-based access control
- **Input validation**: Sanityzacja wszystkich danych wejściowych
- **File security**: Walidacja typów i rozmiarów plików
- **Rate limiting**: Ochrona przed brute-force
- **HTTPS ready**: Konfiguracja SSL/TLS
- **SQL injection**: Użycie ORM z prepared statements
- **XSS protection**: Content Security Policy headers

## 📈 Monitorowanie

- **Activity logs**: Pełne logowanie akcji użytkowników
- **System health**: Monitoring stanu aplikacji i bazy danych
- **Error tracking**: Centralne zbieranie błędów
- **Performance**: Metryki wydajności aplikacji

## 🚢 Deploy produkcyjny

### Ubuntu 22.04 LTS (Proxmox)
```bash
# 1. Zainstaluj Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# 2. Sklonuj repozytorium
git clone https://github.com/your-repo/portal-raportow-pracowniczych.git
cd portal-raportow-pracowniczych

# 3. Skonfiguruj środowisko
cp server/.env.example server/.env
# Edytuj server/.env z właściwymi ustawieniami

# 4. Uruchom aplikację
./scripts/deploy.sh

# 5. Konfiguruj Nginx (opcjonalne)
docker-compose --profile production up -d
```

### Backup i przywracanie
```bash
# Backup bazy danych
docker exec portal_postgres pg_dump -U portal_user portal_reports > backup.sql

# Przywracanie bazy danych
docker exec -i portal_postgres psql -U portal_user portal_reports < backup.sql
```

## 🧪 Testowanie

```bash
# Uruchom testy backend
cd server
npm test

# Testowanie end-to-end
npm run test:e2e
```

## 📝 API Documentation

API jest RESTful i dostępne pod `/api/`:

- **Auth**: `/api/auth/*` - Logowanie, profile, tokens
- **Reports**: `/api/reports/*` - CRUD raportów
- **Users**: `/api/users/*` - Zarządzanie użytkownikami
- **Admin**: `/api/admin/*` - Panel administracyjny

Pełna dokumentacja API dostępna w pliku `docs/API.md`.

## 🤝 Wsparcie

- **Issues**: Zgłaszaj problemy przez GitHub Issues
- **Dokumentacja**: Sprawdź folder `docs/`
- **Logi**: `docker-compose logs -f` dla debugowania

## 📄 Licencja

MIT License - zobacz plik `LICENSE` dla szczegółów.

## 👨‍💻 Autorzy

Stworzony dla efektywnego zarządzania raportami pracowniczymi w firmach budowlanych i nie tylko.

---

**Portal Raportów Pracowniczych** - Profesjonalne narzędzie do zarządzania raportami z naciskiem na bezpieczeństwo, wydajność i łatwość użytkowania.