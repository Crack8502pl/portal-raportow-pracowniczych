#!/bin/bash

# Portal Raportów Pracowniczych - Setup Script
# This script sets up the development environment

set -e

echo "🚀 Portal Raportów Pracowniczych - Setup Script"
echo "=============================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18 or later."
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt "18" ]; then
    echo "❌ Node.js version 18 or later is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) is installed"

# Check if PostgreSQL is available
if ! command -v psql &> /dev/null; then
    echo "⚠️ PostgreSQL client not found. Please install PostgreSQL or use Docker."
fi

# Install server dependencies
echo "📦 Installing server dependencies..."
cd server
npm install

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating environment file..."
    cp .env.example .env
    echo "⚠️ Please edit server/.env file with your configuration"
fi

cd ..

echo "🏗️ Building TypeScript..."
cd server
npm run build

cd ..

echo "✅ Setup completed!"
echo ""
echo "Next steps:"
echo "1. Configure your database connection in server/.env"
echo "2. Set up PostgreSQL database (or use Docker)"
echo "3. Run: npm run dev (for development)"
echo "4. Run: npm run deploy (for production with Docker)"
echo ""
echo "Default test credentials:"
echo "- Admin: admin / admin123"
echo "- Coordinator: koordynator / koord123"
echo "- Employee: pracownik / prac123"