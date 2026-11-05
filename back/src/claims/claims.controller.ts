import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { IsIn, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';
import { ClaimsService } from './claims.service';

export class CreateClaimDto {
  @IsUUID()
  venueId!: string;

  @IsUUID()
  userId!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  documents!: string;
}

export class UpdateClaimStatusDto {
  @IsIn(['approved', 'rejected'])
  status!: 'approved' | 'rejected';
}

@Controller('claims')
export class ClaimsController {
  constructor(private readonly claimsService: ClaimsService) {}

  @Post()
  async submitClaim(@Body() body: CreateClaimDto) {
    return this.claimsService.submitClaim(
      body.venueId,
      body.userId,
      body.documents,
    );
  }

  @Get('user')
  async getUserClaims(@Query('userId', new ParseUUIDPipe()) userId: string) {
    return this.claimsService.getUserClaims(userId);
  }

  // Admin endpoint to approve/reject
  @Patch(':id/status')
  async updateClaimStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() body: UpdateClaimStatusDto,
  ) {
    return this.claimsService.updateClaimStatus(id, body.status);
  }
}
