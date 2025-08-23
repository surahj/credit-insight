import { Injectable, HttpException, HttpStatus } from '@nestjs/common';

export interface BureauCheckRequest {
  email: string;
  user_id?: string;
  additional_data?: any;
}

export interface BureauCheckResponse {
  score: number;
  risk_band: string;
  enquiries_6m: number;
  defaults: number;
  open_loans: number;
  trade_lines: number;
  timestamp: string;
}

@Injectable()
export class MockBureauService {
  private readonly riskBands = ['A', 'B', 'C', 'D', 'E'];
  private readonly apiKey = process.env.BUREAU_API_KEY || 'mock-api-key-123';

  async checkCredit(request: BureauCheckRequest): Promise<BureauCheckResponse> {
    // Simulate processing delay
    await this.simulateDelay();

    // Simulate different response scenarios
    const scenario = this.getRandomScenario();

    switch (scenario) {
      case 'success':
        return this.generateSuccessResponse(request);
      case 'bad_request':
        throw new HttpException('Invalid request data', HttpStatus.BAD_REQUEST);
      case 'rate_limit':
        throw new HttpException(
          'Rate limit exceeded',
          HttpStatus.TOO_MANY_REQUESTS,
        );
      case 'server_error':
        throw new HttpException(
          'Internal server error',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      default:
        return this.generateSuccessResponse(request);
    }
  }

  private async simulateDelay(): Promise<void> {
    const delay = Math.random() * 2000 + 500; // 500ms to 2.5s
    return new Promise((resolve) => setTimeout(resolve, delay));
  }

  private getRandomScenario(): string {
    const scenarios = [
      'success',
      'success',
      'success',
      'success',
      'success',
      'bad_request',
      'rate_limit',
      'server_error',
    ];
    return scenarios[Math.floor(Math.random() * scenarios.length)];
  }

  private generateSuccessResponse(
    request: BureauCheckRequest,
  ): BureauCheckResponse {
    // Generate realistic credit bureau data based on email
    const emailHash = this.hashEmail(request.email);

    return {
      score: this.generateScore(emailHash),
      risk_band: this.generateRiskBand(emailHash),
      enquiries_6m: this.generateEnquiries(emailHash),
      defaults: this.generateDefaults(emailHash),
      open_loans: this.generateOpenLoans(emailHash),
      trade_lines: this.generateTradeLines(emailHash),
      timestamp: new Date().toISOString(),
    };
  }

  private hashEmail(email: string): number {
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
      const char = email.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private generateScore(emailHash: number): number {
    // Generate score between 300-850
    const baseScore = 300 + (emailHash % 550);
    return Math.min(850, Math.max(300, baseScore));
  }

  private generateRiskBand(emailHash: number): string {
    const index = emailHash % this.riskBands.length;
    return this.riskBands[index];
  }

  private generateEnquiries(emailHash: number): number {
    // Generate enquiries between 0-10
    return emailHash % 11;
  }

  private generateDefaults(emailHash: number): number {
    // Generate defaults between 0-3
    return emailHash % 4;
  }

  private generateOpenLoans(emailHash: number): number {
    // Generate open loans between 0-8
    return emailHash % 9;
  }

  private generateTradeLines(emailHash: number): number {
    // Generate trade lines between 1-15
    return 1 + (emailHash % 15);
  }
}
