import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Transaction,
  TransactionType,
  TransactionCategory,
  RiskLevel,
} from '../../common/entities';

export interface ComputedInsights {
  // Income Analysis
  avgMonthlyIncome: number;
  totalIncome: number;
  incomeTransactionCount: number;

  // Cash Flow Analysis
  totalInflow: number;
  totalOutflow: number;
  netCashFlow: number;

  // Spending Buckets
  groceriesSpend: number;
  entertainmentSpend: number;
  transportSpend: number;
  utilitiesSpend: number;
  healthcareSpend: number;
  shoppingSpend: number;
  diningSpend: number;
  otherSpend: number;

  // Risk Analysis
  overdraftCount: number;
  bouncedPaymentCount: number;
  avgDailyBalance: number;
  minBalance: number;
  maxBalance: number;
  riskLevel: RiskLevel;
  riskFlags: string[];

  // Parsing Statistics
  parsingSuccessRate: number;
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
}

@Injectable()
export class InsightsComputationService {
  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
  ) {}

  async computeInsights(statementId: string): Promise<ComputedInsights> {
    // Get all transactions for the statement
    const transactions = await this.transactionRepository.find({
      where: { statementId },
      order: { date: 'ASC' },
    });

    if (transactions.length === 0) {
      throw new Error('No transactions found for statement');
    }

    // Compute income analysis
    const incomeAnalysis = this.computeIncomeAnalysis(transactions);

    // Compute cash flow analysis
    const cashFlowAnalysis = this.computeCashFlowAnalysis(transactions);

    // Compute spending buckets
    const spendingBuckets = this.computeSpendingBuckets(transactions);

    // Compute risk analysis
    const riskAnalysis = this.computeRiskAnalysis(transactions);

    // Compute parsing statistics
    const parsingStats = this.computeParsingStats(transactions);

    return {
      ...incomeAnalysis,
      ...cashFlowAnalysis,
      ...spendingBuckets,
      ...riskAnalysis,
      ...parsingStats,
    };
  }

  private computeIncomeAnalysis(transactions: Transaction[]) {
    // Use credit transactions for income analysis (more reliable than isIncome flag)
    const incomeTransactions = transactions.filter(
      (t) => t.type === TransactionType.CREDIT,
    );
    const totalIncome = incomeTransactions.reduce(
      (sum, t) => +sum + +t.amount,
      0,
    );

    // Calculate 3-month average (assume the period covers 3 months)
    const periodStart = new Date(
      Math.min(...transactions.map((t) => t.date.getTime())),
    );
    const periodEnd = new Date(
      Math.max(...transactions.map((t) => t.date.getTime())),
    );
    const periodMonths = Math.max(
      1,
      (periodEnd.getTime() - periodStart.getTime()) /
        (30 * 24 * 60 * 60 * 1000),
    );

    const avgMonthlyIncome = +totalIncome / +periodMonths;

    return {
      avgMonthlyIncome: Math.round(avgMonthlyIncome * 100) / 100 || 0,
      totalIncome: Math.round(totalIncome * 100) / 100 || 0,
      incomeTransactionCount: incomeTransactions.length || 0,
    };
  }

  private computeCashFlowAnalysis(transactions: Transaction[]) {
    const creditTransactions = transactions.filter(
      (t) => t.type === TransactionType.CREDIT,
    );
    const debitTransactions = transactions.filter(
      (t) => t.type === TransactionType.DEBIT,
    );

    const totalInflow = creditTransactions.reduce(
      (sum, t) => +sum + +t.amount,
      0,
    );
    const totalOutflow = debitTransactions.reduce(
      (sum, t) => +sum + +t.amount,
      0,
    );
    const netCashFlow = totalInflow - totalOutflow;

    return {
      totalInflow: Math.round(totalInflow * 100) / 100 || 0,
      totalOutflow: Math.round(totalOutflow * 100) / 100 || 0,
      netCashFlow: Math.round(netCashFlow * 100) / 100 || 0,
    };
  }

  private computeSpendingBuckets(transactions: Transaction[]) {
    const debitTransactions = transactions.filter(
      (t) => t.type === TransactionType.DEBIT,
    );

    const buckets = {
      groceriesSpend: 0,
      entertainmentSpend: 0,
      transportSpend: 0,
      utilitiesSpend: 0,
      healthcareSpend: 0,
      shoppingSpend: 0,
      diningSpend: 0,
      otherSpend: 0,
    };

    debitTransactions.forEach((transaction) => {
      const amount = +transaction.amount;

      switch (transaction.category) {
        case TransactionCategory.GROCERIES:
          buckets.groceriesSpend += amount;
          break;
        case TransactionCategory.ENTERTAINMENT:
          buckets.entertainmentSpend += amount;
          break;
        case TransactionCategory.TRANSPORT:
          buckets.transportSpend += amount;
          break;
        case TransactionCategory.UTILITIES:
          buckets.utilitiesSpend += amount;
          break;
        case TransactionCategory.HEALTHCARE:
          buckets.healthcareSpend += amount;
          break;
        case TransactionCategory.SHOPPING:
          buckets.shoppingSpend += amount;
          break;
        case TransactionCategory.DINING:
          buckets.diningSpend += amount;
          break;
        default:
          buckets.otherSpend += amount;
          break;
      }
    });

    // Round all values
    Object.keys(buckets).forEach((key) => {
      buckets[key] = Math.round(buckets[key] * 100) / 100 || 0;
    });

    return buckets;
  }

  private computeRiskAnalysis(transactions: Transaction[]) {
    const riskFlags: string[] = [];

    // Get balance history
    const balances = transactions.map((t) => t.balance);
    const minBalance = Math.min(...balances);
    const maxBalance = Math.max(...balances);
    const avgDailyBalance =
      balances.reduce((sum, b) => +sum + +b, 0) / balances.length;

    // Count overdrafts (negative balances)
    const overdraftCount = balances.filter((b) => b < 0).length;
    if (overdraftCount > 0) {
      riskFlags.push(`${overdraftCount} overdraft incidents detected`);
    }

    // Detect potential bounced payments (large negative amounts followed by fees)
    let bouncedPaymentCount = 0;
    for (let i = 0; i < transactions.length - 1; i++) {
      const current = transactions[i];
      const next = transactions[i + 1];

      if (
        current.type === TransactionType.DEBIT &&
        +current.amount > 100 &&
        +current.balance < 0 &&
        next.category === TransactionCategory.FEES_CHARGES
      ) {
        bouncedPaymentCount++;
      }
    }

    if (bouncedPaymentCount > 0) {
      riskFlags.push(`${bouncedPaymentCount} potential bounced payments`);
    }

    // Check for excessive fees
    const feeTransactions = transactions.filter(
      (t) => t.category === TransactionCategory.FEES_CHARGES,
    );
    const totalFees = feeTransactions.reduce((sum, t) => +sum + +t.amount, 0);
    if (totalFees > 100) {
      riskFlags.push(`High fees charged: ${totalFees.toFixed(2)}`);
    }

    // Check for low average balance
    if (avgDailyBalance < 100) {
      riskFlags.push('Low average daily balance');
    }

    // Check for volatile spending patterns
    const debitAmounts = transactions
      .filter((t) => t.type === TransactionType.DEBIT)
      .map((t) => t.amount);

    if (debitAmounts.length > 0) {
      const avgSpend =
        debitAmounts.reduce((sum, a) => +sum + +a, 0) / debitAmounts.length;
      const largeTransactions = debitAmounts.filter(
        (a) => a > avgSpend * 3,
      ).length;

      if (largeTransactions > debitAmounts.length * 0.1) {
        riskFlags.push('Volatile spending patterns detected');
      }
    }

    // Calculate overall risk level
    let riskLevel = RiskLevel.LOW;

    if (overdraftCount > 5 || bouncedPaymentCount > 2 || avgDailyBalance < 50) {
      riskLevel = RiskLevel.HIGH;
    } else if (
      overdraftCount > 2 ||
      bouncedPaymentCount > 0 ||
      avgDailyBalance < 200 ||
      totalFees > 50
    ) {
      riskLevel = RiskLevel.MEDIUM;
    }

    return {
      overdraftCount: overdraftCount || 0,
      bouncedPaymentCount: bouncedPaymentCount || 0,
      avgDailyBalance: Math.round(avgDailyBalance * 100) / 100 || 0,
      minBalance: Math.round(minBalance * 100) / 100 || 0,
      maxBalance: Math.round(maxBalance * 100) / 100 || 0,
      riskLevel,
      riskFlags: riskFlags || [],
    };
  }

  private computeParsingStats(transactions: Transaction[]) {
    // In a real scenario, we would track parsing failures during CSV processing
    // For now, we'll assume all transactions in the database were successfully parsed
    const totalTransactions = transactions.length;
    const successfulTransactions = transactions.length;
    const failedTransactions = 0;

    const parsingSuccessRate =
      totalTransactions > 0 ? successfulTransactions / totalTransactions : 0;

    return {
      parsingSuccessRate: Math.round(parsingSuccessRate * 10000) / 10000 || 0, // 4 decimal places
      totalTransactions: totalTransactions || 0,
      successfulTransactions: successfulTransactions || 0,
      failedTransactions: failedTransactions || 0,
    };
  }
}
