import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MockBureauService } from '../../mock-bureau/mock-bureau.service';

export interface BureauApiRequest {
  email: string;
  user_id?: string;
  additional_data?: any;
}

export interface BureauApiResponse {
  status: string;
  data: {
    score: number;
    risk_band: string;
    enquiries_6m: number;
    defaults: number;
    open_loans: number;
    trade_lines: number;
    reference_id: string;
    timestamp: string;
  };
  request_id: string;
  processing_time_ms: number;
}

export interface BureauRequestResult {
  success: boolean;
  data?: BureauApiResponse;
  error?: string;
  httpStatusCode: number;
  responseTime: number;
  retryCount: number;
  bureauReferenceId?: string;
}

@Injectable()
export class BureauHttpClientService {
  private readonly logger = new Logger(BureauHttpClientService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly mockBureauService: MockBureauService,
  ) {}

  async checkCredit(request: BureauApiRequest): Promise<BureauRequestResult> {
    const startTime = Date.now();
    let retryCount = 0;
    let lastError: string = '';
    let httpStatusCode = 0;

    this.logger.log(`Starting credit check for email: ${request.email}`);

    const maxRetries = this.configService.get<number>('BUREAU_MAX_RETRIES', 3);

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (attempt > 0) {
        retryCount++;
        const backoffDelay = this.calculateBackoffDelay(attempt);
        this.logger.log(
          `Retry attempt ${attempt} after ${backoffDelay}ms delay`,
        );
        await this.sleep(backoffDelay);
      }

      try {
        const result = await this.makeRequest(request, startTime);

        if (result.success) {
          this.logger.log(
            `Credit check successful after ${retryCount} retries`,
          );
          return { ...result, retryCount };
        }

        // If it's a non-retryable error, break the loop
        if (!this.isRetryableError(result.httpStatusCode)) {
          this.logger.warn(
            `Non-retryable error (${result.httpStatusCode}), stopping retries`,
          );
          return { ...result, retryCount };
        }

        lastError = result.error || 'Unknown error';
        httpStatusCode = result.httpStatusCode;
      } catch (error) {
        lastError = error instanceof Error ? error.message : 'Unknown error';
        httpStatusCode = 500;
        this.logger.error(`Request attempt ${attempt + 1} failed:`, error);
      }
    }

    const responseTime = Date.now() - startTime;
    this.logger.error(
      `Credit check failed after ${maxRetries} retries: ${lastError}`,
    );

    return {
      success: false,
      error: `Failed after ${maxRetries} retries: ${lastError}`,
      httpStatusCode,
      responseTime,
      retryCount,
    };
  }

  private async makeRequest(
    request: BureauApiRequest,
    startTime: number,
  ): Promise<BureauRequestResult> {
    try {
      // Use internal mock bureau service
      const mockResponse = await this.mockBureauService.checkCredit(request);
      const responseTime = Date.now() - startTime;

      this.logger.log('Mock Bureau API response received:', {
        responseTime,
        score: mockResponse.score,
        riskBand: mockResponse.risk_band,
      });

      // Transform mock response to expected format
      const bureauApiResponse: BureauApiResponse = {
        status: 'success',
        data: {
          score: mockResponse.score,
          risk_band: mockResponse.risk_band,
          enquiries_6m: mockResponse.enquiries_6m,
          defaults: mockResponse.defaults,
          open_loans: mockResponse.open_loans,
          trade_lines: mockResponse.trade_lines,
          reference_id: `mock-${Date.now()}`,
          timestamp: mockResponse.timestamp,
        },
        request_id: `req-${Date.now()}`,
        processing_time_ms: responseTime,
      };

      return {
        success: true,
        data: bureauApiResponse,
        httpStatusCode: 200,
        responseTime,
        retryCount: 0,
        bureauReferenceId: bureauApiResponse.data.reference_id,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      // Map different error types to appropriate HTTP status codes
      let statusCode = 500;
      if (errorMessage.includes('Invalid request data')) {
        statusCode = 400;
      } else if (errorMessage.includes('Rate limit exceeded')) {
        statusCode = 429;
      } else if (errorMessage.includes('Unauthorized')) {
        statusCode = 401;
      }

      return {
        success: false,
        error: errorMessage,
        httpStatusCode: statusCode,
        responseTime,
        retryCount: 0,
      };
    }
  }

  private isRetryableError(statusCode: number): boolean {
    // Retry on server errors, rate limits, and network issues
    const retryableStatuses = [0, 429, 500, 502, 503, 504];
    return retryableStatuses.includes(statusCode);
  }

  private calculateBackoffDelay(attempt: number): number {
    // Exponential backoff with jitter
    const baseDelay = this.configService.get<number>(
      'BUREAU_RETRY_DELAY_MS',
      1000,
    );
    const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 0.3 * exponentialDelay; // 30% jitter
    return Math.min(exponentialDelay + jitter, 30000); // Max 30 seconds
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
