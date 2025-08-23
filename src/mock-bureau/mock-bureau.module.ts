import { Module } from '@nestjs/common';
import { MockBureauController } from './mock-bureau.controller';
import { MockBureauService } from './mock-bureau.service';

@Module({
  controllers: [MockBureauController],
  providers: [MockBureauService],
  exports: [MockBureauService],
})
export class MockBureauModule {}
