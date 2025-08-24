/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BureauHttpClientService } from '../bureau-http-client.service';
import { MockBureauService } from '../../../mock-bureau/mock-bureau.service';

describe('BureauHttpClientService', () => {
  let service: BureauHttpClientService;
  let mockBureauService: MockBureauService;
  let configService: ConfigService;

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockMockBureauService = {
    checkCredit: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BureauHttpClientService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: MockBureauService,
          useValue: mockMockBureauService,
        },
      ],
    }).compile();

    service = module.get<BureauHttpClientService>(BureauHttpClientService);
    mockBureauService = module.get<MockBureauService>(MockBureauService);
    configService = module.get<ConfigService>(ConfigService);

    // Default config values
    mockConfigService.get.mockImplementation(
      (key: string, defaultValue: any) => {
        const config = {
          BUREAU_MAX_RETRIES: 3,
          BUREAU_RETRY_DELAY_MS: 1000,
        };
        return config[key] || defaultValue;
      },
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('checkCredit', () => {
    const mockRequest = {
      email: 'test@example.com',
      user_id: 'user-123',
    };

    describe('Successful Requests', () => {
      it('should return successful result on first attempt', async () => {
        const mockResponse = {
          score: 750,
          risk_band: 'A',
          enquiries_6m: 2,
          defaults: 0,
          open_loans: 3,
          trade_lines: 8,
          timestamp: '2025-01-01T00:00:00.000Z',
        };

        mockMockBureauService.checkCredit.mockResolvedValue(mockResponse);

        const result = await service.checkCredit(mockRequest);

        expect(result.success).toBe(true);
        expect(result.httpStatusCode).toBe(200);
        expect(result.retryCount).toBe(0);
        expect(result.data?.data.score).toBe(750);
        expect(result.data?.data.risk_band).toBe('A');
        expect(mockMockBureauService.checkCredit).toHaveBeenCalledTimes(1);
      });

      it('should transform mock response to expected format', async () => {
        const mockResponse = {
          score: 650,
          risk_band: 'B',
          enquiries_6m: 5,
          defaults: 1,
          open_loans: 2,
          trade_lines: 6,
          timestamp: '2025-01-01T00:00:00.000Z',
        };

        mockMockBureauService.checkCredit.mockResolvedValue(mockResponse);

        const result = await service.checkCredit(mockRequest);

        expect(result.data?.status).toBe('success');
        expect(result.data?.data.score).toBe(650);
        expect(result.data?.data.risk_band).toBe('B');
        expect(result.data?.data.enquiries_6m).toBe(5);
        expect(result.data?.data.defaults).toBe(1);
        expect(result.data?.data.open_loans).toBe(2);
        expect(result.data?.data.trade_lines).toBe(6);
        expect(result.data?.data.reference_id).toMatch(/^mock-/);
        expect(result.data?.request_id).toMatch(/^req-/);
      });
    });

    describe('Retry Logic', () => {
      it('should retry on 429 rate limit error and succeed', async () => {
        // First call fails with rate limit, second succeeds
        mockMockBureauService.checkCredit
          .mockRejectedValueOnce(new Error('Rate limit exceeded'))
          .mockResolvedValueOnce({
            score: 700,
            risk_band: 'A',
            enquiries_6m: 1,
            defaults: 0,
            open_loans: 2,
            trade_lines: 5,
            timestamp: '2025-01-01T00:00:00.000Z',
          });

        const result = await service.checkCredit(mockRequest);

        expect(result.success).toBe(true);
        expect(result.retryCount).toBe(1);
        expect(mockMockBureauService.checkCredit).toHaveBeenCalledTimes(2);
      });

      it('should retry on 500 server error and succeed', async () => {
        // First call fails with server error, second succeeds
        mockMockBureauService.checkCredit
          .mockRejectedValueOnce(new Error('Internal server error'))
          .mockResolvedValueOnce({
            score: 600,
            risk_band: 'C',
            enquiries_6m: 3,
            defaults: 1,
            open_loans: 4,
            trade_lines: 7,
            timestamp: '2025-01-01T00:00:00.000Z',
          });

        const result = await service.checkCredit(mockRequest);

        expect(result.success).toBe(true);
        expect(result.retryCount).toBe(1);
        expect(mockMockBureauService.checkCredit).toHaveBeenCalledTimes(2);
      });

      it('should not retry on 400 bad request error', async () => {
        mockMockBureauService.checkCredit.mockRejectedValue(
          new Error('Invalid request data'),
        );

        const result = await service.checkCredit(mockRequest);

        expect(result.success).toBe(false);
        expect(result.httpStatusCode).toBe(400);
        expect(result.retryCount).toBe(0);
        expect(mockMockBureauService.checkCredit).toHaveBeenCalledTimes(1);
      });

      it('should not retry on 401 unauthorized error', async () => {
        mockMockBureauService.checkCredit.mockRejectedValue(
          new Error('Unauthorized'),
        );

        const result = await service.checkCredit(mockRequest);

        expect(result.success).toBe(false);
        expect(result.httpStatusCode).toBe(401);
        expect(result.retryCount).toBe(0);
        expect(mockMockBureauService.checkCredit).toHaveBeenCalledTimes(1);
      });

      it('should fail after max retries', async () => {
        // All attempts fail with server error
        mockMockBureauService.checkCredit.mockRejectedValue(
          new Error('Internal server error'),
        );

        const result = await service.checkCredit(mockRequest);

        expect(result.success).toBe(false);
        expect(result.retryCount).toBe(3);
        expect(result.error).toContain('Failed after 3 retries');
        expect(mockMockBureauService.checkCredit).toHaveBeenCalledTimes(4); // Initial + 3 retries
      });
    });

    describe('Error Mapping', () => {
      it('should map rate limit error to 429 status', async () => {
        mockMockBureauService.checkCredit.mockRejectedValue(
          new Error('Rate limit exceeded'),
        );

        const result = await service.checkCredit(mockRequest);

        expect(result.httpStatusCode).toBe(429);
        expect(result.error).toContain('Rate limit exceeded');
      });

      it('should map invalid request error to 400 status', async () => {
        mockMockBureauService.checkCredit.mockRejectedValue(
          new Error('Invalid request data'),
        );

        const result = await service.checkCredit(mockRequest);

        expect(result.httpStatusCode).toBe(400);
        expect(result.error).toBe('Invalid request data');
      });

      it('should map unauthorized error to 401 status', async () => {
        mockMockBureauService.checkCredit.mockRejectedValue(
          new Error('Unauthorized'),
        );

        const result = await service.checkCredit(mockRequest);

        expect(result.httpStatusCode).toBe(401);
        expect(result.error).toBe('Unauthorized');
      });

      it('should map unknown errors to 500 status', async () => {
        mockMockBureauService.checkCredit.mockRejectedValue(
          new Error('Unknown error'),
        );

        const result = await service.checkCredit(mockRequest);

        expect(result.httpStatusCode).toBe(500);
        expect(result.error).toContain('Unknown error');
      });
    });

    describe('Response Time Tracking', () => {
      it('should track response time correctly', async () => {
        const mockResponse = {
          score: 750,
          risk_band: 'A',
          enquiries_6m: 2,
          defaults: 0,
          open_loans: 3,
          trade_lines: 8,
          timestamp: '2025-01-01T00:00:00.000Z',
        };

        mockMockBureauService.checkCredit.mockResolvedValue(mockResponse);

        const startTime = Date.now();
        const result = await service.checkCredit(mockRequest);
        const endTime = Date.now();

        expect(result.responseTime).toBeGreaterThanOrEqual(0);
        expect(result.responseTime).toBeLessThanOrEqual(
          endTime - startTime + 100,
        ); // Allow some tolerance
      });
    });

    describe('Configuration', () => {
      it('should use configured max retries', async () => {
        mockConfigService.get.mockImplementation((key: string) => {
          if (key === 'BUREAU_MAX_RETRIES') return 2;
          return 1000;
        });

        mockMockBureauService.checkCredit.mockRejectedValue(
          new Error('Internal server error'),
        );

        const result = await service.checkCredit(mockRequest);

        expect(result.retryCount).toBe(2);
        expect(mockMockBureauService.checkCredit).toHaveBeenCalledTimes(3); // Initial + 2 retries
      });

      it('should use configured retry delay', async () => {
        mockConfigService.get.mockImplementation((key: string) => {
          if (key === 'BUREAU_RETRY_DELAY_MS') return 500;
          return 3;
        });

        mockMockBureauService.checkCredit
          .mockRejectedValueOnce(new Error('Server error'))
          .mockResolvedValueOnce({
            score: 700,
            risk_band: 'A',
            enquiries_6m: 1,
            defaults: 0,
            open_loans: 2,
            trade_lines: 5,
            timestamp: '2025-01-01T00:00:00.000Z',
          });

        const startTime = Date.now();
        await service.checkCredit(mockRequest);
        const endTime = Date.now();

        // Should have at least 500ms delay for retry
        expect(endTime - startTime).toBeGreaterThanOrEqual(400);
      });
    });

    describe('Edge Cases', () => {
      it('should handle null request gracefully', async () => {
        await expect(service.checkCredit(null as any)).rejects.toThrow();
      });

      it('should handle undefined email', async () => {
        const result = await service.checkCredit({} as any);
        expect(result.success).toBe(false);
        expect(result.httpStatusCode).toBe(500);
      });

      it('should handle mock bureau service throwing non-Error objects', async () => {
        mockMockBureauService.checkCredit.mockRejectedValue('String error');

        const result = await service.checkCredit(mockRequest);

        expect(result.success).toBe(false);
        expect(result.error).toContain('Unknown error');
        expect(result.httpStatusCode).toBe(500);
      });
    });
  });

  describe('isRetryableError', () => {
    it('should identify retryable errors correctly', () => {
      const retryableStatuses = [0, 429, 500, 502, 503, 504];
      const nonRetryableStatuses = [400, 401, 403, 404];

      retryableStatuses.forEach((status) => {
        expect(service['isRetryableError'](status)).toBe(true);
      });

      nonRetryableStatuses.forEach((status) => {
        expect(service['isRetryableError'](status)).toBe(false);
      });
    });
  });

  describe('calculateBackoffDelay', () => {
    it('should calculate exponential backoff with jitter', () => {
      const baseDelay = 1000;
      mockConfigService.get.mockReturnValue(baseDelay);

      const delay1 = service['calculateBackoffDelay'](1);
      const delay2 = service['calculateBackoffDelay'](2);
      const delay3 = service['calculateBackoffDelay'](3);

      // First retry should be around base delay
      expect(delay1).toBeGreaterThanOrEqual(baseDelay * 0.7);
      expect(delay1).toBeLessThanOrEqual(baseDelay * 1.3);

      // Second retry should be around 2x base delay
      expect(delay2).toBeGreaterThanOrEqual(baseDelay * 1.4);
      expect(delay2).toBeLessThanOrEqual(baseDelay * 2.6);

      // Third retry should be around 4x base delay
      expect(delay3).toBeGreaterThanOrEqual(baseDelay * 2.8);
      expect(delay3).toBeLessThanOrEqual(baseDelay * 5.2);
    });

    it('should cap delay at maximum value', () => {
      const baseDelay = 10000; // 10 seconds
      mockConfigService.get.mockReturnValue(baseDelay);

      const delay = service['calculateBackoffDelay'](10);

      expect(delay).toBeLessThanOrEqual(30000); // Max 30 seconds
    });
  });
});
