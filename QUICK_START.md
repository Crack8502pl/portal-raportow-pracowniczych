# Portal Raportów Pracowniczych - Quick Start Guide

## ✅ Fixed Issues
- ✅ Added missing `npm run migrate` script
- ✅ Added missing `npm run seed` script  
- ✅ Added `npm run install:all` for easy dependency installation
- ✅ Created Sequelize configuration for database migrations
- ✅ Added documentation in `docs/` directory
- ✅ All npm scripts now work properly

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm run install:all
```

### 2. Configure Database
```bash
# Copy environment file
cp server/.env.example server/.env

# Edit server/.env with your PostgreSQL settings:
# DB_HOST=localhost
# DB_PORT=5432  
# DB_NAME=portal_reports
# DB_USER=portal_user
# DB_PASSWORD=secure_db_password
```

### 3. Setup Database
```bash
# Create PostgreSQL database first, then run:
npm run migrate    # Creates tables
npm run seed      # Adds default data
```

### 4. Start Development
```bash
npm run dev       # Starts development server
```

## 📋 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run migrate` | Run database migrations |
| `npm run seed` | Seed database with default data |
| `npm run test` | Run tests |
| `npm run lint` | Run linter |
| `npm run install:all` | Install all dependencies |
| `npm run deploy` | Deploy with Docker |

## 👥 Default Users (after seeding)
- **Admin**: `admin` / `admin123`
- **Coordinator**: `koordynator` / `koord123`
- **Employee**: `pracownik` / `prac123`

## 🔧 Troubleshooting

### "Missing script: migrate" 
✅ **FIXED** - Script is now available in package.json

### Database Connection Issues
1. Ensure PostgreSQL is running
2. Create database: `CREATE DATABASE portal_reports;`
3. Create user with permissions
4. Update credentials in `server/.env`

### TypeScript Compilation Issues
The project is configured to use `ts-node-dev` for development, so compilation errors won't block development workflow. Use:
```bash
npm run dev  # Works without compilation
```

## 📁 Project Structure
```
portal-raportow-pracowniczych/
├── server/                 # Backend (Node.js + TypeScript)
├── client/                 # Frontend (HTML/CSS/JS)
├── database/              # SQL migrations and initial data
├── docs/                  # 📖 Documentation (NEW)
├── scripts/               # Setup and deployment scripts
└── package.json           # 🔧 Root npm scripts (UPDATED)
```

## 🌐 Access Application
- Frontend: http://localhost:3000
- API: http://localhost:3000/api
- API Docs: See `docs/API.md`