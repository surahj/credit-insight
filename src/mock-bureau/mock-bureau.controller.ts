import {
  Controller,
  Post,
  Body,
  Headers,
  HttpStatus,
  HttpException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiHeader } from '@nestjs/swagger';
import { MockBureauService } from './mock-bureau.service';
import { BureauCheckRequestDto, BureauCheckResponseDto } from './dto';

@ApiTags('mock-bureau')
@Controller('mock-bureau')
export class MockBureauController {
  constructor(private readonly mockBureauService: MockBureauService) {}

  @Post('v1/credit/check')
  @ApiOperation({ summary: 'Mock credit bureau check endpoint' })
  @ApiHeader({ name: 'X-API-KEY', description: 'API key for authentication' })
  @ApiResponse({
    status: 200,
    description: 'Credit check completed successfully',
    type: BureauCheckResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized - invalid API key' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async checkCredit(
    @Body() request: BureauCheckRequestDto,
    @Headers('x-api-key') apiKey: string,
  ): Promise<BureauCheckResponseDto> {
    // Validate API key
    if (!apiKey || apiKey !== process.env.BUREAU_API_KEY) {
      throw new HttpException('Invalid API key', HttpStatus.UNAUTHORIZED);
    }

    return this.mockBureauService.checkCredit(request);
  }
}
