import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BureauController } from './bureau.controller';
import { BureauService } from './bureau.service';
import { BureauHttpClientService } from './services/bureau-http-client.service';
import { BureauReport, User } from '../common/entities';
import { MockBureauModule } from '../mock-bureau/mock-bureau.module';

@Module({
  imports: [TypeOrmModule.forFeature([BureauReport, User]), MockBureauModule],
  controllers: [BureauController],
  providers: [BureauService, BureauHttpClientService],
  exports: [BureauService],
})
export class BureauModule {}
