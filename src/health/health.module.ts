import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { User } from '../common/entities';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}
