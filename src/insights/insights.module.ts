import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InsightsController } from './insights.controller';
import { InsightsService } from './insights.service';
import { InsightsComputationService } from './services/insights-computation.service';
import { Insight, Statement, Transaction } from '../common/entities';

@Module({
  imports: [TypeOrmModule.forFeature([Insight, Statement, Transaction])],
  controllers: [InsightsController],
  providers: [InsightsService, InsightsComputationService],
  exports: [InsightsService],
})
export class InsightsModule {}
