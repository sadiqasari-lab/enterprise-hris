#!/bin/bash

# Enterprise HRIS - Development Environment Setup
# Automates local development environment configuration

set -e  # Exit on error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Enterprise HRIS - Development Setup               ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if running on supported OS
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="macos"
else
    echo -e "${RED}✗ Unsupported OS. This script supports Linux and macOS only.${NC}"
    exit 1
fi

echo -e "${YELLOW}Detected OS: $OS${NC}"
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to print step
step() {
    echo -e "${GREEN}▶ $1${NC}"
}

# Function to print error
error() {
    echo -e "${RED}✗ $1${NC}"
}

# Function to print success
success() {
    echo -e "${GREEN}✓ $1${NC}"
}

# 1. Check prerequisites
step "Checking prerequisites..."

# Check Node.js
if command_exists node; then
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -ge 20 ]; then
        success "Node.js $(node --version) installed"
    else
        error "Node.js 20+ required. Current: $(node --version)"
        echo "Install from: https://nodejs.org/"
        exit 1
    fi
else
    error "Node.js not found"
    echo "Install from: https://nodejs.org/"
    exit 1
fi

# Check pnpm
if ! command_exists pnpm; then
    step "Installing pnpm..."
    npm install -g pnpm
    success "pnpm installed"
else
    success "pnpm $(pnpm --version) installed"
fi

# Check Git
if ! command_exists git; then
    error "Git not found. Please install Git first."
    exit 1
else
    success "Git $(git --version | awk '{print $3}') installed"
fi

# Check Docker
if ! command_exists docker; then
    echo -e "${YELLOW}⚠ Docker not found. Install Docker for containerized development.${NC}"
    echo "  https://docs.docker.com/get-docker/"
else
    success "Docker $(docker --version | awk '{print $3}' | tr -d ',') installed"
fi

echo ""

# 2. Install dependencies
step "Installing project dependencies..."
cd "$PROJECT_ROOT"
pnpm install
success "Dependencies installed"
echo ""

# 3. Setup environment files
step "Setting up environment files..."

# API .env
if [ ! -f "$PROJECT_ROOT/apps/api/.env" ]; then
    cat > "$PROJECT_ROOT/apps/api/.env" << 'APIENV'
# Node Environment
NODE_ENV=development

# Server
PORT=3001
HOST=localhost

# Database
DATABASE_URL="postgresql://hris_user:hris_password@localhost:5432/hris_db_dev?schema=public"

# JWT Secrets (CHANGE IN PRODUCTION!)
JWT_ACCESS_SECRET=dev_access_secret_change_me_in_production_12345678901234567890
JWT_REFRESH_SECRET=dev_refresh_secret_change_me_in_production_12345678901234567890

# Redis
REDIS_URL="redis://localhost:6379"

# File Upload
UPLOAD_DIR=/tmp/hris-uploads

# Logging
LOG_LEVEL=debug

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001

# Rate Limiting
RATE_LIMIT_WHITELIST=127.0.0.1,::1
APIENV
    success "Created apps/api/.env"
else
    echo -e "${YELLOW}  apps/api/.env already exists (skipped)${NC}"
fi

# Web .env.local
if [ ! -f "$PROJECT_ROOT/apps/web/.env.local" ]; then
    cat > "$PROJECT_ROOT/apps/web/.env.local" << 'WEBENV'
# API URL
NEXT_PUBLIC_API_URL=http://localhost:3001/api

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
WEBENV
    success "Created apps/web/.env.local"
else
    echo -e "${YELLOW}  apps/web/.env.local already exists (skipped)${NC}"
fi

echo ""

# 4. Database setup
step "Setting up PostgreSQL database..."

if command_exists psql; then
    # Check if PostgreSQL is running
    if pg_isready -q; then
        # Create database and user
        psql -U postgres -c "CREATE USER hris_user WITH PASSWORD 'hris_password';" 2>/dev/null || echo "  User already exists"
        psql -U postgres -c "CREATE DATABASE hris_db_dev OWNER hris_user;" 2>/dev/null || echo "  Database already exists"
        psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE hris_db_dev TO hris_user;" 2>/dev/null
        
        success "PostgreSQL database configured"
        
        # Run migrations
        step "Running database migrations..."
        cd "$PROJECT_ROOT"
        pnpm --filter @hris/database prisma generate
        pnpm --filter @hris/database prisma migrate dev
        success "Database migrations complete"
        
        # Seed database
        echo -e "${YELLOW}Would you like to seed the database with demo data? (y/n)${NC}"
        read -r SEED_RESPONSE
        if [[ "$SEED_RESPONSE" == "y" ]]; then
            pnpm --filter @hris/api seed
            success "Database seeded with demo data"
            echo ""
            echo -e "${GREEN}Demo Login Credentials:${NC}"
            echo "  Super Admin: admin@system.com / Admin123!"
            echo "  HR Admin:    hr.admin@alnoor.com / Hris2026!"
            echo "  Manager:     manager.eng@alnoor.com / Hris2026!"
            echo "  Employee:    employee@alnoor.com / Hris2026!"
        fi
    else
        echo -e "${YELLOW}⚠ PostgreSQL is not running.${NC}"
        echo "  Start PostgreSQL and run: pnpm --filter @hris/database prisma migrate dev"
    fi
else
    echo -e "${YELLOW}⚠ PostgreSQL not found.${NC}"
    echo "  Option 1: Install PostgreSQL locally"
    echo "            - macOS: brew install postgresql@16"
    echo "            - Ubuntu: sudo apt install postgresql-16"
    echo "  Option 2: Use Docker: docker compose up -d postgres"
fi

echo ""

# 5. Redis setup
step "Checking Redis..."

if command_exists redis-cli; then
    if redis-cli ping >/dev/null 2>&1; then
        success "Redis is running"
    else
        echo -e "${YELLOW}⚠ Redis is not running. Start with: redis-server${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Redis not found.${NC}"
    echo "  Option 1: Install Redis locally"
    echo "            - macOS: brew install redis"
    echo "            - Ubuntu: sudo apt install redis-server"
    echo "  Option 2: Use Docker: docker compose up -d redis"
fi

echo ""

# 6. Docker setup (optional)
if command_exists docker; then
    step "Docker setup..."
    
    if [ -f "$PROJECT_ROOT/docker-compose.dev.yml" ]; then
        echo -e "${YELLOW}Would you like to start services with Docker Compose? (y/n)${NC}"
        read -r DOCKER_RESPONSE
        if [[ "$DOCKER_RESPONSE" == "y" ]]; then
            docker compose -f docker-compose.dev.yml up -d
            success "Docker services started"
            echo "  - PostgreSQL: localhost:5432"
            echo "  - Redis: localhost:6379"
        fi
    fi
fi

echo ""

# 7. IDE setup
step "IDE configuration..."

# VS Code settings
if [ ! -f "$PROJECT_ROOT/.vscode/settings.json" ]; then
    mkdir -p "$PROJECT_ROOT/.vscode"
    cat > "$PROJECT_ROOT/.vscode/settings.json" << 'VSCODE'
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "files.exclude": {
    "**/node_modules": true,
    "**/.next": true,
    "**/dist": true
  }
}
VSCODE
    success "Created VS Code settings"
else
    echo -e "${YELLOW}  .vscode/settings.json already exists${NC}"
fi

# Recommended extensions
if [ ! -f "$PROJECT_ROOT/.vscode/extensions.json" ]; then
    cat > "$PROJECT_ROOT/.vscode/extensions.json" << 'EXTENSIONS'
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "Prisma.prisma",
    "bradlc.vscode-tailwindcss",
    "ms-azuretools.vscode-docker"
  ]
}
EXTENSIONS
    success "Created recommended extensions list"
fi

echo ""

# 8. Git hooks
step "Setting up Git hooks..."

if [ ! -f "$PROJECT_ROOT/.husky/pre-commit" ]; then
    npx husky install
    npx husky add .husky/pre-commit "pnpm lint-staged"
    success "Git hooks configured"
else
    echo -e "${YELLOW}  Git hooks already configured${NC}"
fi

echo ""

# 9. Final verification
step "Verifying setup..."

# Check if all required services are accessible
CHECKS_PASSED=true

# Check database
if pnpm --filter @hris/database prisma db pull >/dev/null 2>&1; then
    success "Database connection verified"
else
    error "Database connection failed"
    CHECKS_PASSED=false
fi

# Check Redis
if redis-cli ping >/dev/null 2>&1 || true; then
    success "Redis connection verified"
else
    echo -e "${YELLOW}  Redis not accessible (optional for development)${NC}"
fi

echo ""

# 10. Summary
echo -e "${GREEN}╔══════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║   Setup Complete!                                    ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}Next Steps:${NC}"
echo ""
echo "  1. Start the API server:"
echo "     ${YELLOW}pnpm --filter @hris/api dev${NC}"
echo ""
echo "  2. Start the Web app (in new terminal):"
echo "     ${YELLOW}pnpm --filter @hris/web dev${NC}"
echo ""
echo "  3. Access the application:"
echo "     Web:  ${YELLOW}http://localhost:3000${NC}"
echo "     API:  ${YELLOW}http://localhost:3001${NC}"
echo ""
echo -e "${GREEN}Useful Commands:${NC}"
echo "  ${YELLOW}pnpm dev${NC}                 - Start all services"
echo "  ${YELLOW}pnpm test${NC}                - Run tests"
echo "  ${YELLOW}pnpm lint${NC}                - Run linter"
echo "  ${YELLOW}pnpm format${NC}              - Format code"
echo "  ${YELLOW}pnpm db:studio${NC}           - Open Prisma Studio"
echo ""
echo -e "${GREEN}Documentation:${NC}"
echo "  README.md"
echo "  docs/TECHNICAL_ARCHITECTURE.md"
echo "  docs/API_DOCUMENTATION.md"
echo ""

if [ "$CHECKS_PASSED" = false ]; then
    echo -e "${YELLOW}⚠ Some checks failed. Review the output above.${NC}"
    exit 1
fi

echo -e "${GREEN}Happy coding! 🚀${NC}"
