import { ApiProperty } from '@nestjs/swagger';
import { RiskLevel } from '../../common/entities';

export class SpendingBucketsDto {
  @ApiProperty({ description: 'Groceries spending' })
  groceries: number;

  @ApiProperty({ description: 'Entertainment spending' })
  entertainment: number;

  @ApiProperty({ description: 'Transport spending' })
  transport: number;

  @ApiProperty({ description: 'Utilities spending' })
  utilities: number;

  @ApiProperty({ description: 'Healthcare spending' })
  healthcare: number;

  @ApiProperty({ description: 'Shopping spending' })
  shopping: number;

  @ApiProperty({ description: 'Dining spending' })
  dining: number;

  @ApiProperty({ description: 'Other spending' })
  other: number;
}

export class IncomeAnalysisDto {
  @ApiProperty({ description: '3-month average income' })
  avgMonthlyIncome: number;

  @ApiProperty({ description: 'Total income in period' })
  totalIncome: number;

  @ApiProperty({ description: 'Number of income transactions' })
  incomeTransactionCount: number;
}

export class CashFlowAnalysisDto {
  @ApiProperty({ description: 'Total money inflow' })
  totalInflow: number;

  @ApiProperty({ description: 'Total money outflow' })
  totalOutflow: number;

  @ApiProperty({ description: 'Net cash flow (inflow - outflow)' })
  netCashFlow: number;
}

export class RiskAnalysisDto {
  @ApiProperty({ description: 'Number of overdraft incidents' })
  overdraftCount: number;

  @ApiProperty({ description: 'Number of bounced payments' })
  bouncedPaymentCount: number;

  @ApiProperty({ description: 'Average daily balance' })
  avgDailyBalance: number;

  @ApiProperty({ description: 'Minimum balance in period' })
  minBalance: number;

  @ApiProperty({ description: 'Maximum balance in period' })
  maxBalance: number;

  @ApiProperty({ enum: RiskLevel, description: 'Overall risk assessment' })
  riskLevel: RiskLevel;

  @ApiProperty({ description: 'Risk flags identified', type: [String] })
  riskFlags: string[];
}

export class ParsingStatsDto {
  @ApiProperty({ description: 'Success rate of transaction parsing (0-1)' })
  parsingSuccessRate: number;

  @ApiProperty({ description: 'Total transactions processed' })
  totalTransactions: number;

  @ApiProperty({ description: 'Successfully parsed transactions' })
  successfulTransactions: number;

  @ApiProperty({ description: 'Failed transaction parsing attempts' })
  failedTransactions: number;
}

export class InsightsResponseDto {
  @ApiProperty({ description: 'Insight unique identifier' })
  id: string;

  @ApiProperty({ description: 'Statement ID' })
  statementId: string;

  @ApiProperty({ description: 'Income analysis', type: IncomeAnalysisDto })
  incomeAnalysis: IncomeAnalysisDto;

  @ApiProperty({ description: 'Cash flow analysis', type: CashFlowAnalysisDto })
  cashFlowAnalysis: CashFlowAnalysisDto;

  @ApiProperty({ description: 'Spending buckets', type: SpendingBucketsDto })
  spendingBuckets: SpendingBucketsDto;

  @ApiProperty({ description: 'Risk analysis', type: RiskAnalysisDto })
  riskAnalysis: RiskAnalysisDto;

  @ApiProperty({ description: 'Parsing statistics', type: ParsingStatsDto })
  parsingStats: ParsingStatsDto;

  @ApiProperty({ description: 'Insight computation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}
