import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { BureauService } from './bureau.service';
import { BureauCheckDto, BureauResponseDto } from './dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserData } from '../common/decorators/current-user.decorator';

@ApiTags('bureau')
@Controller('bureau')
@UseGuards(ThrottlerGuard, JwtAuthGuard)
@ApiBearerAuth()
export class BureauController {
  constructor(private readonly bureauService: BureauService) {}

  @Post('/check')
  @ApiOperation({ summary: 'Perform credit bureau check' })
  @ApiResponse({
    status: 201,
    description: 'Credit check completed successfully',
    type: BureauResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid data or bureau API error',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async checkCredit(
    @Body() bureauCheckDto: BureauCheckDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<BureauResponseDto> {
    return this.bureauService.checkCredit(bureauCheckDto, user.userId);
  }

  @Get('/reports')
  @ApiOperation({ summary: 'Get user bureau reports (paginated)' })
  @ApiResponse({
    status: 200,
    description: 'Bureau reports retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async getUserBureauReports(
    @CurrentUser() user: CurrentUserData,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
  ) {
    return this.bureauService.getUserBureauReports(user.userId, page, limit);
  }

  @Get('reports/:id')
  @ApiOperation({ summary: 'Get bureau report by ID' })
  @ApiResponse({
    status: 200,
    description: 'Bureau report retrieved successfully',
    type: BureauResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Bureau report not found' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async getBureauReport(
    @Param('id') reportId: string,
    @CurrentUser() user: CurrentUserData,
  ): Promise<BureauResponseDto> {
    return this.bureauService.getBureauReport(reportId, user.userId);
  }

  @Delete('reports/:id')
  @ApiOperation({ summary: 'Delete bureau report' })
  @ApiResponse({
    status: 200,
    description: 'Bureau report deleted successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Bureau report not found' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async deleteBureauReport(
    @Param('id') reportId: string,
    @CurrentUser() user: CurrentUserData,
  ): Promise<{ message: string }> {
    await this.bureauService.deleteBureauReport(reportId, user.userId);
    return { message: 'Bureau report deleted successfully' };
  }
}
