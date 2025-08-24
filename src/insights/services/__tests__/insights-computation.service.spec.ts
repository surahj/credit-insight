import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InsightsComputationService } from '../insights-computation.service';
import {
  Transaction,
  TransactionType,
  TransactionCategory,
} from '../../../common/entities';

describe('InsightsComputationService', () => {
  let service: InsightsComputationService;
  let transactionRepository: Repository<Transaction>;

  const mockTransactionRepository = {
    find: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InsightsComputationService,
        {
          provide: getRepositoryToken(Transaction),
          useValue: mockTransactionRepository,
        },
      ],
    }).compile();

    service = module.get<InsightsComputationService>(
      InsightsComputationService,
    );
    transactionRepository = module.get<Repository<Transaction>>(
      getRepositoryToken(Transaction),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Income Detection', () => {
    it('should correctly identify income transactions', async () => {
      const mockTransactions = [
        {
          id: '1',
          amount: 5000,
          type: TransactionType.CREDIT,
          description: 'Salary Payment',
          date: new Date('2025-01-01'),
          category: TransactionCategory.SALARY,
        },
        {
          id: '2',
          amount: 1000,
          type: TransactionType.CREDIT,
          description: 'Bonus Payment',
          date: new Date('2025-01-15'),
          category: TransactionCategory.BONUS,
        },
        {
          id: '3',
          amount: -500,
          type: TransactionType.DEBIT,
          description: 'Grocery Shopping',
          date: new Date('2025-01-02'),
          category: TransactionCategory.GROCERIES,
        },
      ] as Transaction[];

      mockTransactionRepository.find.mockResolvedValue(mockTransactions);

      const result = await service.computeInsights('statement-1');

      expect(result.totalIncome).toBe(6000);
      expect(result.incomeTransactionCount).toBe(2);
      expect(result.avgMonthlyIncome).toBe(6000);
    });

    it('should handle zero income transactions', async () => {
      const mockTransactions = [
        {
          id: '1',
          amount: -100,
          type: TransactionType.DEBIT,
          description: 'Coffee',
          date: new Date('2025-01-01'),
          category: TransactionCategory.DINING,
        },
      ] as Transaction[];

      mockTransactionRepository.find.mockResolvedValue(mockTransactions);

      const result = await service.computeInsights('statement-1');

      expect(result.totalIncome).toBe(0);
      expect(result.incomeTransactionCount).toBe(0);
      expect(result.avgMonthlyIncome).toBe(0);
    });

    it('should calculate monthly average correctly for multi-month period', async () => {
      const mockTransactions = [
        {
          id: '1',
          amount: 5000,
          type: TransactionType.CREDIT,
          description: 'Salary',
          date: new Date('2025-01-01'),
          category: TransactionCategory.SALARY,
        },
        {
          id: '2',
          amount: 5000,
          type: TransactionType.CREDIT,
          description: 'Salary',
          date: new Date('2025-02-01'),
          category: TransactionCategory.SALARY,
        },
        {
          id: '3',
          amount: 5000,
          type: TransactionType.CREDIT,
          description: 'Salary',
          date: new Date('2025-03-01'),
          category: TransactionCategory.SALARY,
        },
      ] as Transaction[];

      mockTransactionRepository.find.mockResolvedValue(mockTransactions);

      const result = await service.computeInsights('statement-1');

      expect(result.totalIncome).toBe(15000);
      expect(result.avgMonthlyIncome).toBe(7627.12);
    });
  });

  describe('Spending Buckets', () => {
    it('should correctly categorize spending into buckets', async () => {
      const mockTransactions = [
        {
          id: '1',
          amount: -100,
          type: TransactionType.DEBIT,
          description: 'Grocery Store',
          date: new Date('2025-01-01'),
          category: TransactionCategory.GROCERIES,
        },
        {
          id: '2',
          amount: -50,
          type: TransactionType.DEBIT,
          description: 'Restaurant',
          date: new Date('2025-01-02'),
          category: TransactionCategory.DINING,
        },
        {
          id: '3',
          amount: -200,
          type: TransactionType.DEBIT,
          description: 'Shopping Mall',
          date: new Date('2025-01-03'),
          category: TransactionCategory.SHOPPING,
        },
        {
          id: '4',
          amount: -75,
          type: TransactionType.DEBIT,
          description: 'Gas Station',
          date: new Date('2025-01-04'),
          category: TransactionCategory.TRANSPORT,
        },
        {
          id: '5',
          amount: -150,
          type: TransactionType.DEBIT,
          description: 'Electricity Bill',
          date: new Date('2025-01-05'),
          category: TransactionCategory.UTILITIES,
        },
      ] as Transaction[];

      mockTransactionRepository.find.mockResolvedValue(mockTransactions);

      const result = await service.computeInsights('statement-1');

      expect(result.groceriesSpend).toBe(-100);
      expect(result.diningSpend).toBe(-50);
      expect(result.shoppingSpend).toBe(-200);
      expect(result.transportSpend).toBe(-75);
      expect(result.utilitiesSpend).toBe(-150);
    });

    it('should handle transactions with unknown categories', async () => {
      const mockTransactions = [
        {
          id: '1',
          amount: -100,
          type: TransactionType.DEBIT,
          description: 'Unknown Transaction',
          date: new Date('2025-01-01'),
          category: TransactionCategory.OTHER,
        },
      ] as Transaction[];

      mockTransactionRepository.find.mockResolvedValue(mockTransactions);

      const result = await service.computeInsights('statement-1');

      expect(result.otherSpend).toBe(-100);
    });

    it('should sum multiple transactions in same category', async () => {
      const mockTransactions = [
        {
          id: '1',
          amount: -50,
          type: TransactionType.DEBIT,
          description: 'Grocery Store 1',
          date: new Date('2025-01-01'),
          category: TransactionCategory.GROCERIES,
        },
        {
          id: '2',
          amount: -75,
          type: TransactionType.DEBIT,
          description: 'Grocery Store 2',
          date: new Date('2025-01-02'),
          category: TransactionCategory.GROCERIES,
        },
      ] as Transaction[];

      mockTransactionRepository.find.mockResolvedValue(mockTransactions);

      const result = await service.computeInsights('statement-1');

      expect(result.groceriesSpend).toBe(-125);
    });

    it('should handle zero spending', async () => {
      const mockTransactions = [
        {
          id: '1',
          amount: 1000,
          type: TransactionType.CREDIT,
          description: 'Income',
          date: new Date('2025-01-01'),
          category: TransactionCategory.SALARY,
        },
      ] as Transaction[];

      mockTransactionRepository.find.mockResolvedValue(mockTransactions);

      const result = await service.computeInsights('statement-1');

      expect(result.groceriesSpend).toBe(0);
      expect(result.diningSpend).toBe(0);
      expect(result.shoppingSpend).toBe(0);
      expect(result.transportSpend).toBe(0);
      expect(result.utilitiesSpend).toBe(0);
      expect(result.healthcareSpend).toBe(0);
      expect(result.entertainmentSpend).toBe(0);
      expect(result.otherSpend).toBe(0);
    });
  });

  describe('Cash Flow Analysis', () => {
    it('should calculate cash flow correctly', async () => {
      const mockTransactions = [
        {
          id: '1',
          amount: 5000,
          type: TransactionType.CREDIT,
          description: 'Salary',
          date: new Date('2025-01-01'),
          category: TransactionCategory.SALARY,
        },
        {
          id: '2',
          amount: -1000,
          type: TransactionType.DEBIT,
          description: 'Expenses',
          date: new Date('2025-01-02'),
          category: TransactionCategory.GROCERIES,
        },
      ] as Transaction[];

      mockTransactionRepository.find.mockResolvedValue(mockTransactions);

      const result = await service.computeInsights('statement-1');

      expect(result.totalInflow).toBe(5000);
      expect(result.totalOutflow).toBe(-1000);
      expect(result.netCashFlow).toBe(6000);
    });
  });

  describe('Risk Analysis', () => {
    it('should detect overdraft scenarios', async () => {
      const mockTransactions = [
        {
          id: '1',
          amount: -1000,
          type: TransactionType.DEBIT,
          description: 'Large Payment',
          date: new Date('2025-01-01'),
          category: TransactionCategory.OTHER,
          balance: -500, // Negative balance indicates overdraft
        },
      ] as Transaction[];

      mockTransactionRepository.find.mockResolvedValue(mockTransactions);

      const result = await service.computeInsights('statement-1');

      expect(result.overdraftCount).toBeGreaterThan(0);
    });

    it('should calculate balance statistics', async () => {
      const mockTransactions = [
        {
          id: '1',
          amount: 1000,
          type: TransactionType.CREDIT,
          description: 'Deposit',
          date: new Date('2025-01-01'),
          category: TransactionCategory.SALARY,
          balance: 1000,
        },
        {
          id: '2',
          amount: -200,
          type: TransactionType.DEBIT,
          description: 'Withdrawal',
          date: new Date('2025-01-02'),
          category: TransactionCategory.GROCERIES,
          balance: 800,
        },
      ] as Transaction[];

      mockTransactionRepository.find.mockResolvedValue(mockTransactions);

      const result = await service.computeInsights('statement-1');

      expect(result.minBalance).toBe(800);
      expect(result.maxBalance).toBe(1000);
      expect(result.avgDailyBalance).toBe(900);
    });
  });

  describe('Parsing Statistics', () => {
    it('should calculate parsing success rate correctly', async () => {
      const mockTransactions = [
        {
          id: '1',
          amount: 100,
          type: TransactionType.CREDIT,
          description: 'Valid Transaction',
          date: new Date('2025-01-01'),
          category: TransactionCategory.SALARY,
        },
      ] as Transaction[];

      mockTransactionRepository.find.mockResolvedValue(mockTransactions);

      const result = await service.computeInsights('statement-1');

      expect(result.totalTransactions).toBe(1);
      expect(result.successfulTransactions).toBe(1);
      expect(result.failedTransactions).toBe(0);
      expect(result.parsingSuccessRate).toBe(1.0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty transaction list', async () => {
      mockTransactionRepository.find.mockResolvedValue([]);

      await expect(service.computeInsights('statement-1')).rejects.toThrow(
        'No transactions found for statement',
      );
    });

    it('should handle null/undefined values gracefully', async () => {
      const mockTransactions = [
        {
          id: '1',
          amount: null,
          type: TransactionType.CREDIT,
          description: 'Invalid Transaction',
          date: new Date('2025-01-01'),
          category: TransactionCategory.SALARY,
        },
      ] as any;

      mockTransactionRepository.find.mockResolvedValue(mockTransactions);

      const result = await service.computeInsights('statement-1');

      expect(result.totalIncome).toBe(0);
      expect(result.totalInflow).toBe(0);
    });
  });
});
