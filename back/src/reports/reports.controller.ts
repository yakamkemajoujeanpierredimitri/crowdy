import { Controller, Post, Body, ValidationPipe } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { IsUUID, IsInt, Min, Max, IsString, IsOptional } from 'class-validator';

export class CreateReportDto {
  @IsUUID()
  venueId!: string;

  @IsInt()
  @Min(0)
  @Max(100)
  score!: number;

  @IsString()
  userId!: string;

  @IsString()
  @IsOptional()
  sourceType?: string;
}

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  async createReport(@Body(new ValidationPipe({ whitelist: true })) body: CreateReportDto) {
    return this.reportsService.submitReport(
      body.venueId,
      body.score,
      body.userId,
      body.sourceType || 'manual'
    );
  }
}
