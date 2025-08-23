import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Insight, Statement, StatementStatus } from '../common/entities';
import { InsightsComputationService } from './services/insights-computation.service';
import { InsightsResponseDto } from './dto';

@Injectable()
export class InsightsService {
  constructor(
    @InjectRepository(Insight)
    private insightRepository: Repository<Insight>,
    @InjectRepository(Statement)
    private statementRepository: Repository<Statement>,
    private insightsComputationService: InsightsComputationService,
  ) {}

  async runInsights(
    statementId: string,
    userId: string,
  ): Promise<InsightsResponseDto> {
    // Verify statement exists and belongs to user
    const statement = await this.statementRepository.findOne({
      where: { id: statementId, userId },
    });

    if (!statement) {
      throw new NotFoundException('Statement not found');
    }

    if (statement.status !== StatementStatus.PROCESSED) {
      throw new BadRequestException(
        'Statement must be processed before computing insights',
      );
    }

    // Check if insights already exist
    let insight = await this.insightRepository.findOne({
      where: { statementId },
    });

    if (insight) {
      // Return existing insights
      console.log('insight', insight);
      return this.mapToResponseDto(insight);
    }

    try {
      // Compute insights
      const computedInsights =
        await this.insightsComputationService.computeInsights(statementId);

      insight = this.insightRepository.create({
        statementId,
        ...computedInsights,
      });

      const savedInsight = await this.insightRepository.save(insight);

      return this.mapToResponseDto(savedInsight);
    } catch (error) {
      throw new BadRequestException(
        `Failed to compute insights: ${error.message}`,
      );
    }
  }

  async getInsights(
    insightId: string,
    userId: string,
  ): Promise<InsightsResponseDto> {
    const insight = await this.insightRepository
      .createQueryBuilder('insight')
      .innerJoin('insight.statement', 'statement')
      .where('insight.id = :insightId', { insightId })
      .andWhere('statement.userId = :userId', { userId })
      .getOne();

    if (!insight) {
      throw new NotFoundException('Insights not found');
    }

    return this.mapToResponseDto(insight);
  }

  async getUserInsights(userId: string, page: number = 1, limit: number = 10) {
    const [insights, total] = await this.insightRepository
      .createQueryBuilder('insight')
      .innerJoin('insight.statement', 'statement')
      .where('statement.userId = :userId', { userId })
      .orderBy('insight.createdAt', 'DESC')
      .take(limit)
      .skip((page - 1) * limit)
      .getManyAndCount();

    return {
      insights: insights.map((insight) => this.mapToResponseDto(insight)),
      total,
      page,
      limit,
    };
  }

  async deleteInsights(insightId: string, userId: string): Promise<void> {
    const insight = await this.insightRepository
      .createQueryBuilder('insight')
      .innerJoin('insight.statement', 'statement')
      .where('insight.id = :insightId', { insightId })
      .andWhere('statement.userId = :userId', { userId })
      .getOne();

    if (!insight) {
      throw new NotFoundException('Insights not found');
    }

    await this.insightRepository.delete(insightId);
  }

  private mapToResponseDto(insight: Insight): InsightsResponseDto {
    return {
      id: insight.id,
      statementId: insight.statementId,
      incomeAnalysis: {
        avgMonthlyIncome: insight.avgMonthlyIncome,
        totalIncome: insight.totalIncome,
        incomeTransactionCount: insight.incomeTransactionCount,
      },
      cashFlowAnalysis: {
        totalInflow: insight.totalInflow,
        totalOutflow: insight.totalOutflow,
        netCashFlow: insight.netCashFlow,
      },
      spendingBuckets: {
        groceries: insight.groceriesSpend,
        entertainment: insight.entertainmentSpend,
        transport: insight.transportSpend,
        utilities: insight.utilitiesSpend,
        healthcare: insight.healthcareSpend,
        shopping: insight.shoppingSpend,
        dining: insight.diningSpend,
        other: insight.otherSpend,
      },
      riskAnalysis: {
        overdraftCount: insight.overdraftCount,
        bouncedPaymentCount: insight.bouncedPaymentCount,
        avgDailyBalance: insight.avgDailyBalance,
        minBalance: insight.minBalance,
        maxBalance: insight.maxBalance,
        riskLevel: insight.riskLevel,
        riskFlags: insight.riskFlags || [],
      },
      parsingStats: {
        parsingSuccessRate: insight.parsingSuccessRate,
        totalTransactions: insight.totalTransactions,
        successfulTransactions: insight.successfulTransactions,
        failedTransactions: insight.failedTransactions,
      },
      createdAt: insight.createdAt,
      updatedAt: insight.updatedAt,
    };
  }
}
