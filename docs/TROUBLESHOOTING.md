# Portal Raportów Pracowniczych - Troubleshooting Guide

## Common Issues & Solutions

### 1. "Missing script: migrate" Error ✅ FIXED

**Problem:** `npm error Missing script: "migrate"`

**Solution:** This has been fixed. The root `package.json` now includes:
```json
{
  "scripts": {
    "migrate": "npm run db:migrate --prefix server",
    "seed": "npm run db:seed --prefix server"
  }
}
```

### 2. TypeScript Compilation Errors

**Problem:** Build fails with TypeScript errors

**Workaround:** Use development mode which bypasses compilation:
```bash
npm run dev  # Uses ts-node-dev, no compilation needed
```

**Long-term solution:** The TypeScript configuration has been relaxed to be more permissive.

### 3. Database Connection Issues

**Problem:** Cannot connect to PostgreSQL

**Solutions:**
1. **Install PostgreSQL**
   ```bash
   # Ubuntu/Debian
   sudo apt install postgresql postgresql-contrib
   
   # macOS
   brew install postgresql
   
   # Windows - Download from postgresql.org
   ```

2. **Create Database and User**
   ```sql
   -- Connect as postgres user
   sudo -u postgres psql
   
   -- Create database
   CREATE DATABASE portal_reports;
   
   -- Create user
   CREATE USER portal_user WITH PASSWORD 'secure_db_password';
   
   -- Grant permissions
   GRANT ALL PRIVILEGES ON DATABASE portal_reports TO portal_user;
   ```

3. **Update Environment Configuration**
   ```bash
   # Edit server/.env
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=portal_reports
   DB_USER=portal_user
   DB_PASSWORD=secure_db_password
   ```

### 4. Missing Dependencies

**Problem:** Module not found errors

**Solution:**
```bash
npm run install:all  # Installs all dependencies
```

### 5. Port Already in Use

**Problem:** `EADDRINUSE: address already in use :::3000`

**Solution:**
```bash
# Change port in server/.env
PORT=3001

# Or kill process on port 3000
npx kill-port 3000
```

### 6. File Upload Issues

**Problem:** File uploads failing

**Solutions:**
1. Check upload directory exists:
   ```bash
   mkdir -p server/uploads
   ```

2. Verify file permissions and size limits in `.env`:
   ```env
   MAX_FILE_SIZE=5242880
   ALLOWED_EXTENSIONS=jpg,jpeg,png,pdf,doc,docx,xls,xlsx
   ```

### 7. Email Notifications Not Working

**Problem:** Emails not being sent

**Solutions:**
1. Configure SMTP settings in `.env`:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-app-password
   ```

2. For Gmail, use App Password instead of regular password

### 8. Development Server Not Auto-Reloading

**Problem:** Changes not reflected automatically

**Solution:**
```bash
# Ensure ts-node-dev is running
npm run dev

# Check if process is running in background
ps aux | grep ts-node-dev
```

## Getting Help

1. Check the logs: `npm run dev` will show detailed error messages
2. Verify environment: `cat server/.env` (hide passwords!)
3. Database status: Try connecting with `psql` directly
4. Check Node.js version: `node --version` (requires 18+)

## Development Workflow

1. **Start development:**
   ```bash
   npm run dev
   ```

2. **Test API endpoints:**
   ```bash
   curl http://localhost:3000/api/auth/login
   ```

3. **Check database:**
   ```bash
   npm run migrate  # Apply migrations
   npm run seed     # Add test data
   ```

4. **View logs:**
   Server logs appear in terminal when running `npm run dev`