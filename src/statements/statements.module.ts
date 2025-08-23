import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatementsController } from './statements.controller';
import { StatementsService } from './statements.service';
import { CsvParserService } from './services/csv-parser.service';
import { Statement, Transaction } from '../common/entities';
import { InsightsModule } from '../insights/insights.module';

@Module({
  imports: [TypeOrmModule.forFeature([Statement, Transaction]), InsightsModule],
  controllers: [StatementsController],
  providers: [StatementsService, CsvParserService],
  exports: [StatementsService],
})
export class StatementsModule {}
