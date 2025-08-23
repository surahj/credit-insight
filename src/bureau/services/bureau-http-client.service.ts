import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AxiosError, AxiosResponse } from 'axios';
import {
  firstValueFrom,
  retry,
  catchError,
  timeout,
  throwError,
  delay,
} from 'rxjs';

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
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly retryDelayMs: number;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseUrl = this.configService.get<string>(
      'BUREAU_API_URL',
      'http://localhost:3001',
    );
    this.apiKey = this.configService.get<string>(
      'BUREAU_API_KEY',
      'mock-api-key-123',
    );
    this.timeoutMs = this.configService.get<number>('BUREAU_TIMEOUT_MS', 10000);
    this.maxRetries = this.configService.get<number>('BUREAU_MAX_RETRIES', 3);
    this.retryDelayMs = this.configService.get<number>(
      'BUREAU_RETRY_DELAY_MS',
      1000,
    );
  }

  async checkCredit(request: BureauApiRequest): Promise<BureauRequestResult> {
    const startTime = Date.now();
    let retryCount = 0;
    let lastError: string = '';
    let httpStatusCode = 0;

    this.logger.log(`Starting credit check for email: ${request.email}`);

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
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
      `Credit check failed after ${this.maxRetries} retries: ${lastError}`,
    );

    return {
      success: false,
      error: `Failed after ${this.maxRetries} retries: ${lastError}`,
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
      const headers = {
        'Content-Type': 'application/json',
        'X-API-KEY': this.apiKey,
      };

      const response = await firstValueFrom(
        this.httpService
          .post<BureauApiResponse>(`${this.baseUrl}/v1/credit/check`, request, {
            headers,
          })
          .pipe(
            timeout(this.timeoutMs),
            catchError((error: AxiosError) => {
              this.logger.error('HTTP request failed:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                data: error.response?.data,
                message: error.message,
              });
              return throwError(() => error);
            }),
          ),
      );

      const responseTime = Date.now() - startTime;

      this.logger.log('Bureau API response received:', {
        status: response.status,
        responseTime,
        referenceId: response.data?.data?.reference_id,
      });

      return {
        success: true,
        data: response.data,
        httpStatusCode: response.status,
        responseTime,
        retryCount: 0,
        bureauReferenceId: response.data?.data?.reference_id,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;

      if (error instanceof AxiosError) {
        const status = error.response?.status || 0;
        const errorMessage = this.extractErrorMessage(error);

        return {
          success: false,
          error: errorMessage,
          httpStatusCode: status,
          responseTime,
          retryCount: 0,
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown network error',
        httpStatusCode: 0,
        responseTime,
        retryCount: 0,
      };
    }
  }

  private extractErrorMessage(error: AxiosError): string {
    // Try to extract meaningful error message from response
    if (error.response?.data) {
      const data = error.response.data as any;
      if (data.error) return data.error;
      if (data.message) return data.message;
    }

    // Fallback to HTTP status or generic message
    if (error.response?.status) {
      switch (error.response.status) {
        case 400:
          return 'Bad request - invalid data provided';
        case 401:
          return 'Unauthorized - invalid API key';
        case 403:
          return 'Forbidden - access denied';
        case 404:
          return 'Service not found';
        case 429:
          return 'Rate limit exceeded';
        case 500:
          return 'Bureau service internal error';
        case 502:
          return 'Bureau service unavailable';
        case 503:
          return 'Bureau service temporarily unavailable';
        case 504:
          return 'Bureau service timeout';
        default:
          return `HTTP ${error.response.status}: ${error.response.statusText}`;
      }
    }

    if (error.code === 'ECONNREFUSED') {
      return 'Bureau service connection refused';
    }

    if (error.code === 'ENOTFOUND') {
      return 'Bureau service not found';
    }

    if (error.code === 'ETIMEDOUT') {
      return 'Bureau service request timeout';
    }

    return error.message || 'Unknown bureau service error';
  }

  private isRetryableError(statusCode: number): boolean {
    // Retry on server errors, rate limits, and network issues
    const retryableStatuses = [0, 429, 500, 502, 503, 504];
    return retryableStatuses.includes(statusCode);
  }

  private calculateBackoffDelay(attempt: number): number {
    // Exponential backoff with jitter
    const baseDelay = this.retryDelayMs;
    const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 0.3 * exponentialDelay; // 30% jitter
    return Math.min(exponentialDelay + jitter, 30000); // Max 30 seconds
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/health`).pipe(timeout(5000)),
      );
      return response.status === 200;
    } catch (error) {
      this.logger.warn('Bureau health check failed:', error);
      return false;
    }
  }
}
