import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BureauReport, BureauStatus, RiskBand, User } from '../common/entities';
import {
  BureauHttpClientService,
  BureauApiRequest,
} from './services/bureau-http-client.service';
import { BureauCheckDto, BureauResponseDto } from './dto';

@Injectable()
export class BureauService {
  constructor(
    @InjectRepository(BureauReport)
    private bureauReportRepository: Repository<BureauReport>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private bureauHttpClient: BureauHttpClientService,
  ) {}

  async checkCredit(
    bureauCheckDto: BureauCheckDto,
    userId: string,
  ): Promise<BureauResponseDto> {
    // Verify user exists
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Create initial bureau report record
    const bureauReport = this.bureauReportRepository.create({
      status: BureauStatus.PENDING,
      userId,
    });

    const savedReport = await this.bureauReportRepository.save(bureauReport);

    try {
      // Prepare request for bureau API
      const apiRequest: BureauApiRequest = {
        email: bureauCheckDto.email,
        user_id: bureauCheckDto.user_id || userId,
        additional_data: bureauCheckDto.additional_data,
      };

      // Make the API call with retries and error handling
      const result = await this.bureauHttpClient.checkCredit(apiRequest);

      if (result.success && result.data) {
        // Map risk band from string to enum
        const riskBand = this.mapRiskBand(result.data.data.risk_band);

        // Update report with successful response
        await this.bureauReportRepository.update(savedReport.id, {
          status: BureauStatus.SUCCESS,
          bureauReferenceId: result.bureauReferenceId,
          score: result.data.data.score,
          riskBand,
          enquiries6m: result.data.data.enquiries_6m,
          defaults: result.data.data.defaults,
          openLoans: result.data.data.open_loans,
          tradeLines: result.data.data.trade_lines,
          httpStatusCode: result.httpStatusCode,
          responseTime: result.responseTime,
          retryCount: result.retryCount,
          rawResponse: result.data as any,
          metadata: {
            requestId: result.data.request_id,
            processingTimeMs: result.data.processing_time_ms,
            timestamp: result.data.data.timestamp,
          } as any,
        });

        // Fetch updated report
        const updatedReport = await this.bureauReportRepository.findOne({
          where: { id: savedReport.id },
        });

        return this.mapToResponseDto(updatedReport!);
      } else {
        // Update report with failure
        await this.bureauReportRepository.update(savedReport.id, {
          status: BureauStatus.FAILED,
          httpStatusCode: result.httpStatusCode,
          responseTime: result.responseTime,
          retryCount: result.retryCount,
          errorMessage: result.error,
        });

        throw new BadRequestException(`Credit check failed: ${result.error}`);
      }
    } catch (error) {
      // Update report with failure if not already updated
      const currentReport = await this.bureauReportRepository.findOne({
        where: { id: savedReport.id },
      });

      if (currentReport?.status === BureauStatus.PENDING) {
        await this.bureauReportRepository.update(savedReport.id, {
          status: BureauStatus.FAILED,
          errorMessage:
            error instanceof Error ? error.message : 'Unknown error',
        });
      }

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException(
        `Credit check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  async getUserBureauReports(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ) {
    const [reports, total] = await this.bureauReportRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });

    return {
      reports: reports.map((report) => this.mapToResponseDto(report)),
      total,
      page,
      limit,
    };
  }

  async getBureauReport(
    reportId: string,
    userId: string,
  ): Promise<BureauResponseDto> {
    const report = await this.bureauReportRepository.findOne({
      where: { id: reportId, userId },
    });

    if (!report) {
      throw new NotFoundException('Bureau report not found');
    }

    return this.mapToResponseDto(report);
  }

  async deleteBureauReport(reportId: string, userId: string): Promise<void> {
    const report = await this.bureauReportRepository.findOne({
      where: { id: reportId, userId },
    });

    if (!report) {
      throw new NotFoundException('Bureau report not found');
    }

    await this.bureauReportRepository.delete(reportId);
  }

  private mapRiskBand(riskBandString: string): RiskBand {
    const mapping: Record<string, RiskBand> = {
      excellent: RiskBand.EXCELLENT,
      good: RiskBand.GOOD,
      fair: RiskBand.FAIR,
      poor: RiskBand.POOR,
      very_poor: RiskBand.VERY_POOR,
    };

    return mapping[riskBandString] || RiskBand.VERY_POOR;
  }

  private mapToResponseDto(report: BureauReport): BureauResponseDto {
    return {
      id: report.id,
      bureauReferenceId: report.bureauReferenceId || '',
      status: report.status,
      score: report.score || 0,
      riskBand: report.riskBand || RiskBand.VERY_POOR,
      enquiries6m: report.enquiries6m || 0,
      defaults: report.defaults || 0,
      openLoans: report.openLoans || 0,
      tradeLines: report.tradeLines || 0,
      httpStatusCode: report.httpStatusCode || 0,
      responseTime: report.responseTime || 0,
      retryCount: report.retryCount,
      errorMessage: report.errorMessage || undefined,
      createdAt: report.createdAt,
    };
  }
}
