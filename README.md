# Credit Insights Service

A lightweight backend service for bank statement analysis and credit insights built with NestJS, TypeScript, and MySQL.

## Features

- **Authentication**: JWT-based authentication with RBAC
- **CSV Processing**: Direct CSV bank statement ingestion and processing
- **Financial Insights**: Income analysis, spending buckets, cash flow analysis, risk assessment
- **Credit Bureau Integration**: Mock credit bureau with retry logic and error handling
- **API Documentation**: Swagger/OpenAPI documentation
- **Security**: Password hashing, validation, rate limiting, security headers
- **Observability**: Health checks, structured logging

## Tech Stack

- **Framework**: NestJS with TypeScript
- **Database**: MySQL with TypeORM
- **Authentication**: JWT with bcryptjs
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest with supertest
- **Containerization**: Docker & Docker Compose

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)

### Running with Docker

1. **Clone and setup**:

   ```bash
   git clone <repository-url>
   cd credit-insight-service
   ```

2. **Start the application**:

   ```bash
   docker-compose up -d
   ```

3. **Access the application**:
   - API: http://localhost:3000
   - Swagger Documentation: http://localhost:3000/api
   - Health Check: http://localhost:3000/health

### Local Development

1. **Install dependencies**:

   ```bash
   npm install
   ```

2. **Setup environment**:

   ```bash
   cp .env.example .env
   # Edit .env with your database credentials
   ```

3. **Start development server**:
   ```bash
   npm run start:dev
   ```

## API Endpoints

### Authentication

- `POST /auth/register` - User registration
- `POST /auth/login` - User login
- `POST /auth/admin/register` - Admin user creation (admin only)

### Statements

- `POST /statements/upload` - Upload CSV bank statement
- `GET /statements` - List user statements
- `GET /statements/:id` - Get specific statement
- `DELETE /statements/:id` - Delete statement

### Insights

- `POST /insights/run` - Compute insights for statement
- `GET /insights/:id` - Get computed insights
- `GET /insights` - List user insights
- `DELETE /insights/:id` - Delete insights

### Credit Bureau

- `POST /bureau/check` - Perform credit bureau check
- `GET /bureau/reports` - List bureau reports
- `GET /bureau/reports/:id` - Get specific bureau report
- `DELETE /bureau/reports/:id` - Delete bureau report

### Mock Bureau (Internal)

- `POST /mock-bureau/v1/credit/check` - Direct mock bureau check
- `POST /mock-bureau/health` - Mock bureau health check

### Health

- `GET /health` - Application health status

## Testing

### Running Tests

The project includes comprehensive unit and integration tests:

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run tests with coverage
npm run test:cov

# Run tests in watch mode
npm run test:watch
```

### Test Structure

#### Unit Tests

- **Income Detection**: Tests for identifying and calculating income from transactions
- **Spend Buckets**: Tests for categorizing spending into different buckets
- **Bureau Client**: Tests for retry logic, error handling, and timeout scenarios
- **CSV Parser**: Tests for parsing and categorizing CSV transactions

#### Integration Tests

- **Happy Path**: End-to-end testing of complete user workflows
- **Authentication Flow**: User registration, login, and authorization
- **CSV Upload & Processing**: Complete statement upload and processing pipeline
- **Insights Computation**: Full insights generation and retrieval
- **Bureau Integration**: Credit bureau checks with retry scenarios
- **Error Handling**: Various error conditions and edge cases

### Test Coverage

The tests cover:

- ✅ Income detection algorithms
- ✅ Spending bucket categorization
- ✅ Bureau client retry logic and error handling
- ✅ CSV parsing and validation
- ✅ Authentication and authorization
- ✅ Complete API workflows
- ✅ Error scenarios and edge cases

### Test Configuration

- **Jest Configuration**: `jest.config.js`
- **Test Setup**: `test/jest-setup.ts`
- **Integration Tests**: `test/integration/`
- **Unit Tests**: `src/**/__tests__/`

## CSV Format

The service expects CSV files with the following format:

```csv
date,description,amount,balance
2025-01-01,Salary Payment,5000.00,5000.00
2025-01-02,Grocery Store,-120.50,4879.50
2025-01-03,Gas Station,-45.00,4834.50
```

### Supported Categories

The service automatically categorizes transactions based on description keywords:

- **Income**: salary, bonus, commission, interest, dividend, refund, reimbursement
- **Groceries**: grocery, supermarket, food store
- **Dining**: restaurant, cafe, coffee, dining
- **Transport**: gas, fuel, transport, parking, uber, lyft
- **Shopping**: amazon, online, shopping, mall
- **Utilities**: electricity, water, gas, utility, bill
- **Healthcare**: doctor, hospital, pharmacy, medical
- **Entertainment**: netflix, movie, cinema, entertainment
- **Insurance**: insurance, premium
- **Other**: uncategorized transactions

## Environment Variables

```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USERNAME=root
DB_PASSWORD=password
DB_DATABASE=credit_insight_db

# JWT
JWT_SECRET=your-jwt-secret
JWT_EXPIRATION=1d

# Bureau API
BUREAU_API_KEY=mock-api-key-123

# Rate Limiting
THROTTLE_TTL=60000
THROTTLE_LIMIT=100

# Security
ALLOWED_ORIGINS=http://localhost:3000
SESSION_SECRET=your-session-secret
BCRYPT_ROUNDS=12

# File Upload
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=text/csv,application/csv
```

## Security Features

- **Password Hashing**: bcryptjs with configurable rounds
- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Configurable request throttling
- **Security Headers**: Helmet.js for security headers
- **Input Validation**: Class-validator for request validation
- **CORS Protection**: Configurable cross-origin settings
- **Non-root Docker**: Secure container execution

## Monitoring & Observability

- **Health Checks**: Application and database health monitoring
- **Structured Logging**: JSON-formatted logs with different levels
- **Response Time Tracking**: API response time monitoring
- **Error Tracking**: Comprehensive error logging and handling

## Development

### Project Structure

```
src/
├── auth/                 # Authentication module
├── bureau/              # Credit bureau integration
├── common/              # Shared utilities and entities
├── health/              # Health check endpoints
├── insights/            # Financial insights computation
├── mock-bureau/         # Internal mock bureau service
├── statements/          # Bank statement management
└── main.ts              # Application entry point
```

### Key Components

- **InsightsComputationService**: Core financial analysis logic
- **BureauHttpClientService**: Credit bureau integration with retry logic
- **CsvParserService**: CSV parsing and transaction categorization
- **MockBureauService**: Internal mock credit bureau for testing

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License.
