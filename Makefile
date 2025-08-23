.PHONY: help build up down logs shell clean test

# Default target
help:
	@echo "Credit Insight Service - Docker Commands"
	@echo ""
	@echo "Available commands:"
	@echo "  build     - Build all Docker images"
	@echo "  up        - Start all services in production mode"
	@echo "  up-dev    - Start all services in development mode"
	@echo "  down      - Stop all services"
	@echo "  logs      - View logs from all services"
	@echo "  logs-app  - View logs from main application"
	@echo "  logs-db   - View logs from MySQL database"
	@echo "  shell     - Open shell in main application container"
	@echo "  shell-db  - Open MySQL shell"
	@echo "  clean     - Remove all containers and volumes"
	@echo "  test      - Run tests in Docker"
	@echo "  reset     - Clean and rebuild everything"

# Build all images
build:
	docker-compose build

# Start services in production mode
up:
	docker-compose up -d
	@echo ""
	@echo "🚀 Services started!"
	@echo "📱 API: http://localhost:3000"
	@echo "📚 API Docs: http://localhost:3000/api"
	@echo "🏥 Health Check: http://localhost:3000/health"
	@echo "🏦 Mock Bureau: http://localhost:3001"

# Start services in development mode
up-dev:
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
	@echo ""
	@echo "🚀 Development services started!"
	@echo "📱 API: http://localhost:3000"
	@echo "📚 API Docs: http://localhost:3000/api"

# Stop all services
down:
	docker-compose down

# View logs from all services
logs:
	docker-compose logs -f

# View logs from main application
logs-app:
	docker-compose logs -f app

# View logs from database
logs-db:
	docker-compose logs -f mysql

# View logs from mock bureau
logs-bureau:
	docker-compose logs -f mock-bureau

# Open shell in main application container
shell:
	docker-compose exec app sh

# Open MySQL shell
shell-db:
	docker-compose exec mysql mysql -u credit_user -p credit_insight_db

# Remove all containers and volumes
clean:
	docker-compose down -v --remove-orphans
	docker system prune -f

# Run tests
test:
	docker-compose exec app npm test

# Reset everything
reset: clean build up

# Check service health
health:
	@echo "Checking service health..."
	@curl -s http://localhost:3000/health | jq . || echo "Main service not responding"
	@curl -s http://localhost:3001/health | jq . || echo "Bureau service not responding"

# Install dependencies
install:
	npm install
	cd mock-bureau-api && npm install
