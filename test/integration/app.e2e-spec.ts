import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';

describe('Credit Insights Service (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let adminToken: string;
  let statementId: string;
  let insightsId: string;
  let bureauReportId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        TypeOrmModule.forRoot({
          type: 'mysql',
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT || '3306', 10),
          username: process.env.DB_USERNAME || 'root',
          password: process.env.DB_PASSWORD || 'password',
          database: process.env.DB_DATABASE || 'credit_insight_test_db',
          autoLoadEntities: true,
          synchronize: true,
          logging: false,
        }),
        AppModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Authentication Flow', () => {
    it('should register a new user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'testuser@example.com',
          password: 'TestPassword123!',
          firstName: 'Test',
          lastName: 'User',
        })
        .expect(201);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.email).toBe('testuser@example.com');
      expect(response.body.user.role).toBe('user');

      authToken = response.body.accessToken;
    });

    it('should register an admin user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'admin@example.com',
          password: 'AdminPassword123!',
          firstName: 'Admin',
          lastName: 'User',
        })
        .expect(201);

      // Note: In a real scenario, admin would be created by another admin
      // For testing, we'll use the regular registration
      adminToken = response.body.accessToken;
    });

    it('should login user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'testuser@example.com',
          password: 'TestPassword123!',
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      expect(response.body.user.email).toBe('testuser@example.com');
    });

    it('should reject invalid credentials', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'testuser@example.com',
          password: 'WrongPassword',
        })
        .expect(401);
    });
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('checks');
    });
  });

  describe('CSV Statement Upload', () => {
    it('should upload CSV statement successfully', async () => {
      const csvContent = `date,description,amount,balance
2025-01-01,Salary Payment,5000.00,5000.00
2025-01-02,Grocery Store,-120.50,4879.50
2025-01-03,Gas Station,-45.00,4834.50
2025-01-04,Netflix Subscription,-15.99,4818.51
2025-01-05,Restaurant,-85.00,4733.51`;

      const response = await request(app.getHttpServer())
        .post('/statements/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from(csvContent), {
          filename: 'test-statement.csv',
          contentType: 'text/csv',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('filename', 'test-statement.csv');
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('transactionCount');
      expect(response.body).toHaveProperty('successfulTransactions');
      expect(response.body).toHaveProperty('failedTransactions');

      statementId = response.body.id;
    });

    it('should reject non-CSV files', async () => {
      await request(app.getHttpServer())
        .post('/statements/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('file', Buffer.from('not a csv'), {
          filename: 'test.txt',
          contentType: 'text/plain',
        })
        .expect(400);
    });

    it('should list user statements', async () => {
      const response = await request(app.getHttpServer())
        .get('/statements')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('statements');
      expect(Array.isArray(response.body.statements)).toBe(true);
      expect(response.body.statements.length).toBeGreaterThan(0);
    });
  });

  describe('Insights Computation', () => {
    it('should compute insights for uploaded statement', async () => {
      // Wait a bit for statement processing to complete
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const response = await request(app.getHttpServer())
        .post('/insights/run')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          statementId: statementId,
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('statementId', statementId);
      expect(response.body).toHaveProperty('incomeAnalysis');
      expect(response.body).toHaveProperty('cashFlowAnalysis');
      expect(response.body).toHaveProperty('spendingBuckets');
      expect(response.body).toHaveProperty('riskAnalysis');
      expect(response.body).toHaveProperty('parsingStats');

      insightsId = response.body.id;
    });

    it('should retrieve computed insights', async () => {
      const response = await request(app.getHttpServer())
        .get(`/insights/${insightsId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', insightsId);
      expect(response.body).toHaveProperty('incomeAnalysis');
      expect(response.body).toHaveProperty('cashFlowAnalysis');
      expect(response.body).toHaveProperty('spendingBuckets');
      expect(response.body).toHaveProperty('riskAnalysis');
      expect(response.body).toHaveProperty('parsingStats');

      // Verify income analysis
      expect(response.body.incomeAnalysis).toHaveProperty('totalIncome');
      expect(response.body.incomeAnalysis).toHaveProperty('avgMonthlyIncome');
      expect(response.body.incomeAnalysis).toHaveProperty(
        'incomeTransactionCount',
      );

      // Verify cash flow analysis
      expect(response.body.cashFlowAnalysis).toHaveProperty('totalInflow');
      expect(response.body.cashFlowAnalysis).toHaveProperty('totalOutflow');
      expect(response.body.cashFlowAnalysis).toHaveProperty('netCashFlow');

      // Verify spending buckets
      expect(response.body.spendingBuckets).toHaveProperty('groceries');
      expect(response.body.spendingBuckets).toHaveProperty('dining');
      expect(response.body.spendingBuckets).toHaveProperty('transport');
      expect(response.body.spendingBuckets).toHaveProperty('entertainment');

      // Verify risk analysis
      expect(response.body.riskAnalysis).toHaveProperty('riskLevel');
      expect(response.body.riskAnalysis).toHaveProperty('riskFlags');
      expect(response.body.riskAnalysis).toHaveProperty('avgDailyBalance');

      // Verify parsing stats
      expect(response.body.parsingStats).toHaveProperty('parsingSuccessRate');
      expect(response.body.parsingStats).toHaveProperty('totalTransactions');
      expect(response.body.parsingStats).toHaveProperty(
        'successfulTransactions',
      );
      expect(response.body.parsingStats).toHaveProperty('failedTransactions');
    });

    it('should list user insights', async () => {
      const response = await request(app.getHttpServer())
        .get('/insights')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('insights');
      expect(Array.isArray(response.body.insights)).toBe(true);
      expect(response.body.insights.length).toBeGreaterThan(0);
    });
  });

  describe('Credit Bureau Integration', () => {
    it('should perform credit bureau check', async () => {
      const response = await request(app.getHttpServer())
        .post('/bureau/check')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'testuser@example.com',
          user_id: 'test-user-123',
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('bureauReferenceId');
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('score');
      expect(response.body).toHaveProperty('riskBand');
      expect(response.body).toHaveProperty('enquiries6m');
      expect(response.body).toHaveProperty('defaults');
      expect(response.body).toHaveProperty('openLoans');
      expect(response.body).toHaveProperty('tradeLines');
      expect(response.body).toHaveProperty('httpStatusCode');
      expect(response.body).toHaveProperty('responseTime');
      expect(response.body).toHaveProperty('retryCount');

      bureauReportId = response.body.id;
    });

    it('should retrieve bureau reports', async () => {
      const response = await request(app.getHttpServer())
        .get('/bureau/reports')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('reports');
      expect(Array.isArray(response.body.reports)).toBe(true);
      expect(response.body.reports.length).toBeGreaterThan(0);
    });

    it('should get specific bureau report', async () => {
      const response = await request(app.getHttpServer())
        .get(`/bureau/reports/${bureauReportId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('id', bureauReportId);
      expect(response.body).toHaveProperty('score');
      expect(response.body).toHaveProperty('riskBand');
    });
  });

  describe('Mock Bureau API', () => {
    it('should handle direct mock bureau requests', async () => {
      const response = await request(app.getHttpServer())
        .post('/mock-bureau/v1/credit/check')
        .set('X-API-KEY', 'mock-api-key-123')
        .send({
          email: 'test@example.com',
          user_id: 'test-user',
        })
        .expect(200);

      expect(response.body).toHaveProperty('score');
      expect(response.body).toHaveProperty('risk_band');
      expect(response.body).toHaveProperty('enquiries_6m');
      expect(response.body).toHaveProperty('defaults');
      expect(response.body).toHaveProperty('open_loans');
      expect(response.body).toHaveProperty('trade_lines');
      expect(response.body).toHaveProperty('timestamp');

      // Verify score is within valid range
      expect(response.body.score).toBeGreaterThanOrEqual(300);
      expect(response.body.score).toBeLessThanOrEqual(850);

      // Verify risk band is valid
      expect(['A', 'B', 'C', 'D', 'E']).toContain(response.body.risk_band);
    });

    it('should reject requests without API key', async () => {
      await request(app.getHttpServer())
        .post('/mock-bureau/v1/credit/check')
        .send({
          email: 'test@example.com',
        })
        .expect(401);
    });

    it('should reject requests with invalid API key', async () => {
      await request(app.getHttpServer())
        .post('/mock-bureau/v1/credit/check')
        .set('X-API-KEY', 'invalid-key')
        .send({
          email: 'test@example.com',
        })
        .expect(401);
    });

    it('should provide mock bureau health check', async () => {
      const response = await request(app.getHttpServer())
        .post('/mock-bureau/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('service', 'Mock Credit Bureau API');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('Error Handling', () => {
    it('should handle unauthorized access', async () => {
      await request(app.getHttpServer()).get('/statements').expect(401);
    });

    it('should handle invalid statement ID', async () => {
      await request(app.getHttpServer())
        .get('/insights/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should handle invalid bureau report ID', async () => {
      await request(app.getHttpServer())
        .get('/bureau/reports/invalid-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('Data Cleanup', () => {
    it('should delete statement', async () => {
      await request(app.getHttpServer())
        .delete(`/statements/${statementId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('should delete insights', async () => {
      await request(app.getHttpServer())
        .delete(`/insights/${insightsId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });

    it('should delete bureau report', async () => {
      await request(app.getHttpServer())
        .delete(`/bureau/reports/${bureauReportId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
    });
  });
});
