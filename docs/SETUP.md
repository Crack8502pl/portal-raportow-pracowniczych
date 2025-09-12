# Portal Raportów Pracowniczych - Setup Guide

## Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL 12+ or Docker
- Git

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/Crack8502pl/portal-raportow-pracowniczych.git
   cd portal-raportow-pracowniczych
   ```

2. **Install all dependencies**
   ```bash
   npm run install:all
   ```

3. **Configure environment**
   ```bash
   cp server/.env.example server/.env
   # Edit server/.env with your database settings
   ```

4. **Setup database**
   ```bash
   # Create PostgreSQL database named 'portal_reports'
   # Then run migrations
   npm run migrate
   
   # Seed with default data
   npm run seed
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - API: http://localhost:3000/api

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run migrate` - Run database migrations
- `npm run seed` - Seed database with default data
- `npm run test` - Run tests
- `npm run lint` - Run linter
- `npm run deploy` - Deploy with Docker

### Default Users

After seeding, these users are available:
- **Admin**: admin / admin123
- **Coordinator**: koordynator / koord123  
- **Employee**: pracownik / prac123

### Database Configuration

Edit `server/.env` with your PostgreSQL settings:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=portal_reports
DB_USER=portal_user
DB_PASSWORD=secure_db_password
```

### Troubleshooting

#### "Missing script: migrate" error
Make sure you're running from the root directory and have installed dependencies:
```bash
npm run install:all
npm run migrate
```

#### Database connection errors
1. Ensure PostgreSQL is running
2. Check database credentials in `.env`
3. Verify database exists and user has permissions

#### Port already in use
Change the port in `server/.env`:
```env
PORT=3001
```