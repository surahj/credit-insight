import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { ThrottlerGuard } from '@nestjs/throttler';
import { StatementsService } from './statements.service';
import { UploadResponseDto, StatementListDto } from './dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { CurrentUserData } from '../common/decorators/current-user.decorator';

@ApiTags('statements')
@Controller('statements')
@UseGuards(ThrottlerGuard, JwtAuthGuard)
@ApiBearerAuth()
export class StatementsController {
  constructor(private readonly statementsService: StatementsService) {}
  @Post('upload')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: (request, file, callback) => {
        if (!file.mimetype.includes('csv')) {
          return callback(
            new BadRequestException('Provide a valid csv file'),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  @ApiOperation({ summary: 'Upload CSV bank statement' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({
    status: 201,
    description: 'Statement uploaded successfully',
    type: UploadResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid file or format',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 413, description: 'File too large' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async uploadStatement(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: CurrentUserData,
  ): Promise<UploadResponseDto> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    return this.statementsService.uploadStatement(file, user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get user statements' })
  @ApiResponse({
    status: 200,
    description: 'Statements retrieved successfully',
    type: StatementListDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async getStatements(
    @CurrentUser() user: CurrentUserData,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
  ): Promise<StatementListDto> {
    return this.statementsService.getStatements(user.userId, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get statement details' })
  @ApiResponse({ status: 200, description: 'Statement retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Statement not found' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async getStatement(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    return this.statementsService.getStatement(id, user.userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete statement' })
  @ApiResponse({ status: 200, description: 'Statement deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Statement not found' })
  @ApiResponse({ status: 429, description: 'Too many requests' })
  async deleteStatement(
    @Param('id') id: string,
    @CurrentUser() user: CurrentUserData,
  ): Promise<{ message: string }> {
    await this.statementsService.deleteStatement(id, user.userId);
    return { message: 'Statement deleted successfully' };
  }
}
