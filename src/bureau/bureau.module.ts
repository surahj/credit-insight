import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { BureauController } from './bureau.controller';
import { BureauService } from './bureau.service';
import { BureauHttpClientService } from './services/bureau-http-client.service';
import { BureauReport, User } from '../common/entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([BureauReport, User]),
    HttpModule.register({
      timeout: 10000,
      maxRedirects: 5,
    }),
  ],
  controllers: [BureauController],
  providers: [BureauService, BureauHttpClientService],
  exports: [BureauService],
})
export class BureauModule {}
