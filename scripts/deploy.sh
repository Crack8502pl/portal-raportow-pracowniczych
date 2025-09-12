#!/bin/bash

# Portal Raportów Pracowniczych - Deployment Script
# This script deploys the application using Docker

set -e

echo "🚀 Portal Raportów Pracowniczych - Deployment Script"
echo "==================================================="

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker $(docker --version) is available"
echo "✅ Docker Compose $(docker-compose --version) is available"

# Create .env file for Docker if it doesn't exist
if [ ! -f docker/.env ]; then
    echo "📝 Creating Docker environment file..."
    cat > docker/.env << EOF
# Generated environment file for Docker deployment
NODE_ENV=production
POSTGRES_PASSWORD=secure_db_password_$(date +%s)
JWT_SECRET=jwt_secret_$(openssl rand -hex 32)

# Configure these values for your environment:
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=reports@company.com
EMAIL_RECIPIENTS=manager@company.com,admin@company.com
EOF
    echo "⚠️ Please edit docker/.env file with your SMTP configuration"
fi

# Stop existing containers
echo "🛑 Stopping existing containers..."
cd docker
docker-compose down

# Build and start containers
echo "🏗️ Building and starting containers..."
docker-compose up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Check if services are healthy
echo "🏥 Checking service health..."
if docker-compose ps | grep -q "Up (healthy)"; then
    echo "✅ Services are running and healthy!"
else
    echo "⚠️ Some services may not be fully ready yet. Check with: docker-compose ps"
fi

# Show container status
echo ""
echo "📊 Container Status:"
docker-compose ps

echo ""
echo "🌐 Application URLs:"
echo "- Application: http://localhost:3000"
echo "- With Nginx (production): http://localhost"
echo ""
echo "📋 Default test credentials:"
echo "- Admin: admin / admin123"
echo "- Coordinator: koordynator / koord123"
echo "- Employee: pracownik / prac123"
echo ""
echo "📝 Useful commands:"
echo "- View logs: docker-compose logs -f"
echo "- Stop services: docker-compose down"
echo "- Restart services: docker-compose restart"
echo "- Update application: docker-compose up --build -d"

cd ..

echo ""
echo "✅ Deployment completed!"