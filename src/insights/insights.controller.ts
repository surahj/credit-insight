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
import { InsightsService } from './insights.service';
import { RunInsightsDto, InsightsResponseDto } from './dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserData } from '../common/decorators/current-user.decorator';

@ApiTags('insights')
@Controller('insights')
@UseGuards(ThrottlerGuard, JwtAuthGuard)
@ApiBearerAuth()
export class InsightsController {
  constructor(private readonly insightsService: InsightsService) {}

  @Post('run')
  @ApiOperation({ summary: 'Compute insights for a statement' })
  @ApiResponse({
    status: 201,
    description: 'Insights computed successfully',
    type: InsightsResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid statement or not processed',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Statement not found' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async runInsights(
    @Body() runInsightsDto: RunInsightsDto,
    @CurrentUser() user: CurrentUserData,
  ): Promise<InsightsResponseDto> {
    return this.insightsService.runInsights(
      runInsightsDto.statementId,
      user.userId,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get computed insights by ID' })
  @ApiResponse({
    status: 200,
    description: 'Insights retrieved successfully',
    type: InsightsResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Insights not found' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async getInsights(
    @Param('id') insightId: string,
    @CurrentUser() user: CurrentUserData,
  ): Promise<InsightsResponseDto> {
    return this.insightsService.getInsights(insightId, user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get user insights (paginated)' })
  @ApiResponse({
    status: 200,
    description: 'User insights retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async getUserInsights(
    @CurrentUser() user: CurrentUserData,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
  ) {
    return this.insightsService.getUserInsights(user.userId, page, limit);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete insights' })
  @ApiResponse({ status: 200, description: 'Insights deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Insights not found' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async deleteInsights(
    @Param('id') insightId: string,
    @CurrentUser() user: CurrentUserData,
  ): Promise<{ message: string }> {
    await this.insightsService.deleteInsights(insightId, user.userId);
    return { message: 'Insights deleted successfully' };
  }
}
