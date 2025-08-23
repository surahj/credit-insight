import { Injectable, BadRequestException } from '@nestjs/common';
import { Readable } from 'stream';
import csv from 'csv-parser';
import { TransactionType, TransactionCategory } from '../../common/entities';

export interface ParsedTransaction {
  date: Date;
  description: string;
  amount: number;
  balance: number;
  type: TransactionType;
  category: TransactionCategory;
  isIncome: boolean;
  categoryConfidence: number;
  rawData: string;
}

export interface ParseResult {
  transactions: ParsedTransaction[];
  totalRows: number;
  successfulRows: number;
  failedRows: number;
  errors: string[];
}

@Injectable()
export class CsvParserService {
  private readonly incomeKeywords = [
    'salary',
    'wage',
    'income',
    'dividend',
    'interest',
    'refund',
    'deposit',
    'credit transfer',
    'payment received',
    'cashback',
    'bonus',
    'commission',
  ];

  private readonly categoryKeywords = {
    [TransactionCategory.GROCERIES]: [
      'supermarket',
      'grocery',
      'food',
      'market',
      'tesco',
      'sainsbury',
      'asda',
    ],
    [TransactionCategory.ENTERTAINMENT]: [
      'cinema',
      'movie',
      'netflix',
      'spotify',
      'entertainment',
      'game',
      'theatre',
    ],
    [TransactionCategory.TRANSPORT]: [
      'uber',
      'taxi',
      'bus',
      'train',
      'fuel',
      'petrol',
      'parking',
      'transport',
    ],
    [TransactionCategory.UTILITIES]: [
      'electric',
      'gas',
      'water',
      'internet',
      'phone',
      'utility',
      'council tax',
    ],
    [TransactionCategory.HEALTHCARE]: [
      'pharmacy',
      'doctor',
      'hospital',
      'health',
      'medical',
      'dental',
    ],
    [TransactionCategory.SHOPPING]: [
      'amazon',
      'shop',
      'store',
      'retail',
      'purchase',
      'online',
    ],
    [TransactionCategory.DINING]: [
      'restaurant',
      'cafe',
      'takeaway',
      'mcdonald',
      'kfc',
      'dining',
      'food delivery',
    ],
    [TransactionCategory.EDUCATION]: [
      'school',
      'university',
      'course',
      'education',
      'tuition',
      'books',
    ],
    [TransactionCategory.INVESTMENT]: [
      'investment',
      'stocks',
      'shares',
      'trading',
      'crypto',
      'fund',
    ],
    [TransactionCategory.LOAN_PAYMENT]: [
      'loan',
      'mortgage',
      'credit card',
      'repayment',
      'installment',
    ],
    [TransactionCategory.FEES_CHARGES]: [
      'fee',
      'charge',
      'penalty',
      'overdraft',
      'commission',
      'service charge',
    ],
  };

  async parseCSV(fileBuffer: Buffer): Promise<ParseResult> {
    return new Promise((resolve, reject) => {
      const transactions: ParsedTransaction[] = [];
      const errors: string[] = [];
      let totalRows = 0;
      let successfulRows = 0;
      let failedRows = 0;

      const stream = Readable.from(fileBuffer);

      stream
        .pipe(csv())
        .on('data', (row) => {
          totalRows++;
          try {
            const transaction = this.parseRow(row, totalRows);
            if (transaction) {
              transactions.push(transaction);
              successfulRows++;
            } else {
              failedRows++;
              errors.push(`Row ${totalRows}: Invalid data format`);
            }
          } catch (error) {
            failedRows++;
            errors.push(`Row ${totalRows}: ${error.message}`);
          }
        })
        .on('end', () => {
          resolve({
            transactions,
            totalRows,
            successfulRows,
            failedRows,
            errors,
          });
        })
        .on('error', (error) => {
          reject(
            new BadRequestException(`CSV parsing failed: ${error.message}`),
          );
        });
    });
  }

  public parseRow(row: any, rowNumber: number): ParsedTransaction | null {
    // Common CSV column variations
    const dateFields = [
      'date',
      'Date',
      'DATE',
      'transaction_date',
      'TransactionDate',
    ];
    const descriptionFields = [
      'description',
      'Description',
      'DESCRIPTION',
      'memo',
      'Memo',
      'details',
      'Details',
    ];
    const amountFields = ['amount', 'Amount', 'AMOUNT', 'value', 'Value'];
    const balanceFields = [
      'balance',
      'Balance',
      'BALANCE',
      'running_balance',
      'RunningBalance',
    ];

    // Extract fields using flexible column mapping
    const dateStr = this.getFieldValue(row, dateFields);
    const description = this.getFieldValue(row, descriptionFields);
    const amountStr = this.getFieldValue(row, amountFields);
    const balanceStr = this.getFieldValue(row, balanceFields);

    if (!dateStr || !description || !amountStr) {
      return null;
    }

    // Parse date
    let date: Date;
    try {
      date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date format');
      }
    } catch {
      throw new Error(`Invalid date format: ${dateStr}`);
    }

    // Parse amount
    let amount: number;
    try {
      // Remove currency symbols and commas
      const cleanAmount = amountStr.replace(/[£$€,\s]/g, '');
      amount = parseFloat(cleanAmount);
      if (isNaN(amount)) {
        throw new Error('Invalid amount format');
      }
    } catch {
      throw new Error(`Invalid amount format: ${amountStr}`);
    }

    // Parse balance
    let balance: number = 0;
    if (balanceStr) {
      try {
        const cleanBalance = balanceStr.replace(/[£$€,\s]/g, '');
        balance = parseFloat(cleanBalance);
        if (isNaN(balance)) {
          balance = 0;
        }
      } catch {
        balance = 0;
      }
    }

    // Determine transaction type
    const type = amount >= 0 ? TransactionType.CREDIT : TransactionType.DEBIT;

    // Categorize transaction
    const categoryResult = this.categorizeTransaction(description);

    // Check if it's income
    const isIncome =
      type === TransactionType.CREDIT && this.isIncomeTransaction(description);

    return {
      date,
      description: description.trim(),
      amount: Math.abs(amount), // Store as positive, type indicates direction
      balance,
      type,
      category: categoryResult.category,
      isIncome,
      categoryConfidence: categoryResult.confidence,
      rawData: JSON.stringify(row),
    };
  }

  private getFieldValue(row: any, possibleFields: string[]): string | null {
    for (const field of possibleFields) {
      if (
        row[field] !== undefined &&
        row[field] !== null &&
        row[field] !== ''
      ) {
        return String(row[field]).trim();
      }
    }
    return null;
  }

  private categorizeTransaction(description: string): {
    category: TransactionCategory;
    confidence: number;
  } {
    const lowerDescription = description.toLowerCase();

    // Check each category
    for (const [category, keywords] of Object.entries(this.categoryKeywords)) {
      for (const keyword of keywords) {
        if (lowerDescription.includes(keyword.toLowerCase())) {
          // Higher confidence for exact matches, lower for partial matches
          const confidence =
            lowerDescription === keyword.toLowerCase() ? 1.0 : 0.8;
          return { category: category as TransactionCategory, confidence };
        }
      }
    }

    // Default category with low confidence
    return { category: TransactionCategory.OTHER, confidence: 0.1 };
  }

  private isIncomeTransaction(description: string): boolean {
    const lowerDescription = description.toLowerCase();
    return this.incomeKeywords.some((keyword) =>
      lowerDescription.includes(keyword.toLowerCase()),
    );
  }

  validateCSVFormat(fileBuffer: Buffer): Promise<boolean> {
    return new Promise((resolve) => {
      const stream = Readable.from(fileBuffer);
      let headerChecked = false;

      stream
        .pipe(csv())
        .on('headers', (headers) => {
          if (!headerChecked) {
            headerChecked = true;
            // Check for required columns (flexible naming)
            const hasDate = headers.some((h) => /date/i.test(h));
            const hasDescription = headers.some((h) =>
              /(description|memo|details)/i.test(h),
            );
            const hasAmount = headers.some((h) => /(amount|value)/i.test(h));

            resolve(hasDate && hasDescription && hasAmount);
          }
        })
        .on('error', () => {
          resolve(false);
        });
    });
  }
}
