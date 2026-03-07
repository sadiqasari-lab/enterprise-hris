.PHONY: help install dev build test clean deploy docker-up docker-down backup restore

# Default target
help:
	@echo "Enterprise HRIS - Available Commands"
	@echo "===================================="
	@echo "Development:"
	@echo "  make install     - Install all dependencies"
	@echo "  make dev         - Start development servers"
	@echo "  make build       - Build for production"
	@echo "  make test        - Run all tests"
	@echo "  make lint        - Run linters"
	@echo ""
	@echo "Database:"
	@echo "  make db-migrate  - Run database migrations"
	@echo "  make db-seed     - Seed database with demo data"
	@echo "  make db-reset    - Reset database (⚠️  destructive)"
	@echo "  make db-studio   - Open Prisma Studio"
	@echo ""
	@echo "Docker:"
	@echo "  make docker-up   - Start Docker Compose stack"
	@echo "  make docker-down - Stop Docker Compose stack"
	@echo "  make docker-logs - View Docker logs"
	@echo ""
	@echo "Deployment:"
	@echo "  make deploy      - Deploy to production"
	@echo "  make backup      - Create database backup"
	@echo "  make restore     - Restore from backup"
	@echo ""
	@echo "Maintenance:"
	@echo "  make clean       - Clean build artifacts"
	@echo "  make health      - Run health check"
	@echo "  make benchmark   - Run performance benchmark"

# Development
install:
	@echo "📦 Installing dependencies..."
	pnpm install

dev:
	@echo "🚀 Starting development servers..."
	@echo "API: http://localhost:3001"
	@echo "Web: http://localhost:3000"
	@echo ""
	@pnpm run dev

build:
	@echo "🔨 Building for production..."
	pnpm --filter @hris/api build
	pnpm --filter @hris/web build

test:
	@echo "🧪 Running tests..."
	pnpm --filter @hris/api test

test-watch:
	@echo "🧪 Running tests in watch mode..."
	pnpm --filter @hris/api test:watch

test-coverage:
	@echo "📊 Running tests with coverage..."
	pnpm --filter @hris/api test:coverage

lint:
	@echo "🔍 Running linters..."
	pnpm --filter @hris/api lint
	pnpm --filter @hris/web lint

format:
	@echo "💅 Formatting code..."
	pnpm format

# Database
db-migrate:
	@echo "🔄 Running database migrations..."
	pnpx prisma migrate deploy --schema packages/database/schema.prisma

db-seed:
	@echo "🌱 Seeding database..."
	pnpm --filter @hris/api seed

db-reset:
	@echo "⚠️  Resetting database (this will delete all data)..."
	@read -p "Are you sure? [y/N] " -n 1 -r; \
	echo; \
	if [[ $$REPLY =~ ^[Yy]$$ ]]; then \
		pnpx prisma migrate reset --schema packages/database/schema.prisma; \
	fi

db-studio:
	@echo "🎨 Opening Prisma Studio..."
	pnpx prisma studio --schema packages/database/schema.prisma

# Docker
docker-up:
	@echo "🐳 Starting Docker Compose stack..."
	cd deploy && docker compose up -d --build

docker-down:
	@echo "🛑 Stopping Docker Compose stack..."
	cd deploy && docker compose down

docker-logs:
	@echo "📋 Viewing Docker logs..."
	cd deploy && docker compose logs -f

docker-restart:
	@echo "🔄 Restarting Docker services..."
	cd deploy && docker compose restart

# Deployment
deploy:
	@echo "🚀 Deploying to production..."
	@echo "Not implemented - use GitHub Actions or manual deployment"

backup:
	@echo "💾 Creating database backup..."
	./scripts/backup/backup-database.sh

restore:
	@echo "♻️  Restoring database..."
	@read -p "Enter backup file path: " backup_file; \
	./scripts/backup/restore-database.sh $$backup_file

# Maintenance
clean:
	@echo "🧹 Cleaning build artifacts..."
	rm -rf apps/api/dist
	rm -rf apps/web/.next
	rm -rf apps/web/out
	find . -name "node_modules" -type d -prune -exec rm -rf {} +
	@echo "✨ Clean complete!"

health:
	@echo "🏥 Running health check..."
	./scripts/health-check.sh

benchmark:
	@echo "⚡ Running performance benchmark..."
	./scripts/performance-benchmark.sh

# Import data
import-csv:
	@read -p "Enter CSV file path: " csv_file; \
	tsx scripts/migration/import-employees-from-csv.ts $$csv_file

# Version management
version:
	@echo "Enterprise HRIS Platform v1.0.0"
	@echo "Node: $$(node --version)"
	@echo "pnpm: $$(pnpm --version)"
	@echo "PostgreSQL: $$(psql --version | head -1)"

# Quick start for new developers
quickstart: install db-migrate db-seed dev

.DEFAULT_GOAL := help
