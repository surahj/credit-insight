# Credit Insights Service

A lightweight backend service that ingests bank statements, computes financial insights, and integrates with credit bureau APIs. Built with NestJS, TypeScript, and MySQL.

## 🚀 Quick Start

### One-Command Deployment

```bash
# Clone the repository
git clone <repository-url>
cd credit-insight-service

# Start all services with Docker Compose
docker-compose up -d
```

**That's it!** The service will be available at:

- **API**: http://localhost:3000
- **API Documentation**: http://localhost:3000/api
- **Health Check**: http://localhost:3000/health
- **Mock Credit Bureau**: http://localhost:3001

## 📋 Table of Contents

- [Features](#features)
- [Architecture](#architecture)
- [API Endpoints](#api-endpoints)
- [Setup & Installation](#setup--installation)
- [Configuration](#configuration)
- [Development](#development)
- [Testing](#testing)
- [Deployment](#deployment)
- [Design Decisions](#design-decisions)
- [Security](#security)
- [Monitoring](#monitoring)

## ✨ Features

### Core Functionality

- **CSV Bank Statement Upload**: Secure file upload with validation and parsing
- **Financial Insights**: Automated computation of income, spending patterns, and risk analysis
- **Credit Bureau Integration**: Robust API client with retry logic and error handling
- **User Management**: JWT-based authentication with role-based access control

### Technical Features

- **RESTful API**: Well-documented endpoints with Swagger/OpenAPI
- **Data Validation**: Comprehensive input validation and sanitization
- **Rate Limiting**: Protection against abuse with configurable limits
- **Health Monitoring**: Built-in health checks and metrics
- **Error Handling**: Comprehensive error responses with proper HTTP status codes
- **Audit Logging**: Complete audit trail for all operations

### Production Ready

- **Docker Support**: Multi-stage builds with security best practices
- **CI/CD Pipeline**: Automated testing and deployment with GitHub Actions
- **Database Migrations**: Automatic schema management with TypeORM
- **Environment Configuration**: Flexible configuration for different environments
- **Security Headers**: CORS, rate limiting, and input validation

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Client    │    │  Mobile App     │    │  Admin Panel    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
         ┌───────────────────────▼───────────────────────┐
         │            API Gateway / Load Balancer        │
         └───────────────────────┬───────────────────────┘
                                 │
         ┌───────────────────────▼───────────────────────┐
         │          Credit Insights Service              │
         │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
         │  │    Auth     │ │ Statements  │ │  Insights   │
         │  │   Module    │ │   Module    │ │   Module    │
         │  └─────────────┘ └─────────────┘ └─────────────┘
         │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
         │  │   Bureau    │ │   Health    │ │   Common    │
         │  │   Module    │ │   Module    │ │   Module    │
         │  └─────────────┘ └─────────────┘ └─────────────┘
         └───────────────────────┬───────────────────────┘
                                 │
    ┌────────────────────────────┼────────────────────────────┐
    │                            │                            │
    ▼                            ▼                            ▼
┌─────────────┐        ┌─────────────┐              ┌─────────────┐
│   MySQL     │        │  File       │              │ Mock Credit │
│  Database   │        │  Storage    │              │ Bureau API  │
└─────────────┘        └─────────────┘              └─────────────┘
```

### Data Flow

1. **Authentication**: User authenticates via JWT tokens
2. **CSV Upload**: Bank statements uploaded and parsed asynchronously
3. **Data Processing**: Transactions categorized and validated
4. **Insights Computation**: Financial metrics calculated
5. **Bureau Integration**: Credit checks performed with retry logic
6. **Data Persistence**: All data stored in MySQL with audit trails

## 🛠️ API Endpoints

### Authentication

```
POST /auth/register          - User registration
POST /auth/login             - User login
POST /auth/admin/register    - Admin user creation (admin only)
```

### Bank Statements

```
POST /statements/upload      - Upload CSV bank statement
GET  /statements             - List user statements (paginated)
GET  /statements/:id         - Get statement details
DELETE /statements/:id       - Delete statement
```

### Financial Insights

```
POST /insights/run           - Compute insights for a statement
GET  /insights/:id           - Get computed insights
GET  /insights               - List user insights (paginated)
DELETE /insights/:id         - Delete insights
```

### Credit Bureau

```
POST /bureau/check           - Perform credit bureau check
GET  /bureau/reports         - List user bureau reports (paginated)
GET  /bureau/reports/:id     - Get bureau report details
DELETE /bureau/reports/:id   - Delete bureau report
GET  /bureau/health          - Check bureau service health
```

### System

```
GET  /health                 - Service health check
GET  /health/metrics         - Service metrics
GET  /api                    - Swagger documentation
```

## 📦 Setup & Installation

### Prerequisites

- **Docker & Docker Compose** (recommended)
- **Node.js 18+** (for local development)
- **MySQL 8.0+** (if not using Docker)

### Option 1: Docker (Recommended)

```bash
# Clone repository
git clone <repository-url>
cd credit-insight-service

# Start all services
make up
# or
docker-compose up -d

# View logs
make logs
# or
docker-compose logs -f

# Stop services
make down
# or
docker-compose down
```

### Option 2: Local Development

```bash
# Install dependencies
npm install
cd mock-bureau-api && npm install && cd ..

# Copy environment file
cp .env.example .env

# Update database configuration in .env
# DB_HOST=localhost
# DB_USERNAME=your_username
# DB_PASSWORD=your_password

# Start MySQL database (or use Docker)
docker run -d \\
  --name mysql \\
  -e MYSQL_ROOT_PASSWORD=rootpassword \\
  -e MYSQL_DATABASE=credit_insight_db \\
  -e MYSQL_USER=credit_user \\
  -e MYSQL_PASSWORD=credit_password \\
  -p 3306:3306 \\
  mysql:8.0

# Start mock bureau API
cd mock-bureau-api
npm run dev &
cd ..

# Start main application
npm run start:dev
```

## ⚙️ Configuration

### Environment Variables

```bash
# Database Configuration
DB_TYPE=mysql
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=credit_user
DB_PASSWORD=credit_password
DB_DATABASE=credit_insight_db

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRATION=1d

# Application Configuration
PORT=3000
NODE_ENV=development
UPLOAD_DIR=./uploads

# Credit Bureau API Configuration
BUREAU_API_URL=http://localhost:3001
BUREAU_API_KEY=your-api-key
BUREAU_TIMEOUT_MS=10000
BUREAU_MAX_RETRIES=3
BUREAU_RETRY_DELAY_MS=1000

# Rate Limiting
THROTTLE_TTL=60000
THROTTLE_LIMIT=10
```

### CSV Format

Bank statements should be in CSV format with the following columns (flexible naming):

```csv
Date,Description,Amount,Balance
2024-01-01,SALARY PAYMENT,5000.00,15000.00
2024-01-02,GROCERY STORE,-150.50,14849.50
2024-01-03,RENT PAYMENT,-1200.00,13649.50
```

**Supported column variations:**

- **Date**: `date`, `Date`, `DATE`, `transaction_date`, `TransactionDate`
- **Description**: `description`, `Description`, `memo`, `Memo`, `details`
- **Amount**: `amount`, `Amount`, `value`, `Value`
- **Balance**: `balance`, `Balance`, `running_balance`, `RunningBalance`

## 👨‍💻 Development

### Available Scripts

```bash
# Development
npm run start:dev          # Start in development mode
npm run start:debug        # Start with debugging
npm run build              # Build for production
npm run start:prod         # Start production build

# Testing
npm run test               # Run unit tests
npm run test:watch         # Run tests in watch mode
npm run test:e2e           # Run e2e tests
npm run test:cov           # Run tests with coverage

# Code Quality
npm run lint               # Run ESLint
npm run lint:fix           # Fix ESLint issues
npm run format             # Format code with Prettier

# Database
npm run migration:generate # Generate migration
npm run migration:run      # Run migrations
npm run migration:revert   # Revert migration
```

### Docker Commands (via Makefile)

```bash
make help          # Show all available commands
make build         # Build Docker images
make up            # Start services in production mode
make up-dev        # Start services in development mode
make down          # Stop all services
make logs          # View logs from all services
make logs-app      # View logs from main application
make shell         # Open shell in application container
make shell-db      # Open MySQL shell
make clean         # Remove containers and volumes
make reset         # Clean and rebuild everything
make health        # Check service health
```

## 🧪 Testing

### Unit Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- auth.service.spec.ts

# Run tests with coverage
npm run test:cov
```

### Integration Tests

```bash
# Run e2e tests
npm run test:e2e

# Run integration tests with Docker
make up
npm run test:e2e
make down
```

### Manual Testing

1. **Start services**: `make up`
2. **Create admin user**:
   ```bash
   curl -X POST http://localhost:3000/auth/register \\
     -H "Content-Type: application/json" \\
     -d '{
       "email": "admin@example.com",
       "password": "password123",
       "firstName": "Admin",
       "lastName": "User"
     }'
   ```
3. **Upload CSV**: Use the Swagger UI at http://localhost:3000/api

## 🚀 Deployment

### Production Deployment

1. **Environment Setup**:

   ```bash
   cp .env.example .env.production
   # Update production values
   ```

2. **Deploy with Docker**:

   ```bash
   docker-compose -f docker-compose.yml up -d
   ```

3. **Health Check**:
   ```bash
   curl http://your-domain.com/health
   ```

### CI/CD Pipeline

The project includes a complete GitHub Actions pipeline:

1. **Testing**: Unit tests, integration tests, linting
2. **Security**: Dependency vulnerability scanning
3. **Building**: Multi-platform Docker images
4. **Integration Testing**: Full stack testing
5. **Deployment**: Automated deployment to staging

## 💡 Design Decisions

### Architecture Choices

1. **NestJS Framework**: Chosen for its enterprise-grade features, dependency injection, and decorator-based approach
2. **TypeORM**: Selected for type safety, migration support, and active record pattern
3. **MySQL**: Chosen for ACID compliance, mature ecosystem, and horizontal scaling capabilities
4. **JWT Authentication**: Stateless authentication for scalability
5. **Modular Design**: Separate modules for different concerns with clear boundaries

### Data Processing

1. **Asynchronous CSV Processing**: Large files processed in background to avoid blocking requests
2. **Flexible CSV Parsing**: Support for various column naming conventions
3. **Transaction Categorization**: Rule-based categorization with confidence scoring
4. **Error Resilience**: Graceful handling of malformed data with detailed error reporting

### External Integration

1. **Retry Logic**: Exponential backoff with jitter for external API calls
2. **Circuit Breaker Pattern**: Implemented via timeout and retry limits
3. **Idempotent Operations**: Safe to retry credit bureau checks
4. **Mock Service**: Realistic mock for development and testing

### Security

1. **Input Validation**: Comprehensive validation using class-validator
2. **Rate Limiting**: Protection against abuse and DDoS
3. **CORS Configuration**: Proper cross-origin resource sharing setup
4. **Error Sanitization**: No sensitive data in error responses
5. **Audit Logging**: Complete audit trail for compliance

## 🔒 Security

### Authentication & Authorization

- JWT tokens with configurable expiration
- Role-based access control (RBAC)
- Password hashing with bcrypt (12 rounds)
- Admin-only user creation for elevated roles

### Data Protection

- Input validation on all endpoints
- SQL injection prevention via TypeORM
- File upload restrictions (type, size)
- Sensitive data excluded from API responses

### Rate Limiting

- Configurable rate limits per endpoint
- IP-based throttling
- DDoS protection

### Infrastructure Security

- Non-root Docker containers
- Multi-stage Docker builds
- Security headers
- Database connection encryption

## 📊 Monitoring

### Health Checks

- **Application Health**: `/health`
- **Database Connectivity**: Included in health check
- **External Services**: Bureau API health monitoring
- **Docker Health Checks**: Container-level monitoring

### Metrics

- **Performance Metrics**: `/health/metrics`
- **Memory Usage**: Heap and RSS monitoring
- **Request Metrics**: Response times and error rates
- **Business Metrics**: Upload success rates, insight computation times

### Logging

- Structured JSON logging
- Request/response logging
- Error logging with stack traces
- Audit trail for all operations

## 🎯 Production Considerations

### Scalability

- Stateless design for horizontal scaling
- Database connection pooling
- Async processing for heavy operations
- File storage abstraction for cloud deployment

### Reliability

- Graceful shutdown handling
- Database transaction management
- Retry logic for external services
- Comprehensive error handling

### Performance

- Database indexing on query columns
- Pagination for large datasets
- File streaming for large uploads
- Response caching where appropriate

### Maintenance

- Database migrations
- Environment-based configuration
- Docker health checks
- Automated backups (configuration)

## 📝 API Usage Examples

### Complete Workflow Example

1. **Register a user**:

```bash
curl -X POST http://localhost:3000/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "user@example.com",
    "password": "securePassword123",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

2. **Login and get token**:

```bash
curl -X POST http://localhost:3000/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "user@example.com",
    "password": "securePassword123"
  }'
```

3. **Upload bank statement**:

```bash
curl -X POST http://localhost:3000/statements/upload \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -F "file=@bank_statement.csv"
```

4. **Compute insights**:

```bash
curl -X POST http://localhost:3000/insights/run \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "statementId": "STATEMENT_UUID"
  }'
```

5. **Perform credit check**:

```bash
curl -X POST http://localhost:3000/bureau/check \\
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "user@example.com"
  }'
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make changes and add tests
4. Run tests: `npm test`
5. Commit changes: `git commit -am 'Add feature'`
6. Push to branch: `git push origin feature-name`
7. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For issues and questions:

1. Check the [API documentation](http://localhost:3000/api)
2. Review the [health endpoints](http://localhost:3000/health)
3. Check Docker logs: `make logs`
4. Open an issue on GitHub

---

**Built with ❤️ using NestJS, TypeScript, and Docker**
