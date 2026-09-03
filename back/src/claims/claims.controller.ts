import { Controller, Post, Body, Get, Param, Query, Patch } from '@nestjs/common';
import { ClaimsService } from './claims.service';

@Controller('claims')
export class ClaimsController {
  constructor(private readonly claimsService: ClaimsService) {}

  @Post()
  async submitClaim(
    @Body('venueId') venueId: string,
    @Body('userId') userId: string,
    @Body('documents') documents: string,
  ) {
    return this.claimsService.submitClaim(venueId, userId, documents);
  }

  @Get('user')
  async getUserClaims(@Query('userId') userId: string) {
    return this.claimsService.getUserClaims(userId);
  }

  // Admin endpoint to approve/reject
  @Patch(':id/status')
  async updateClaimStatus(
    @Param('id') id: string,
    @Body('status') status: 'approved' | 'rejected',
  ) {
    return this.claimsService.updateClaimStatus(id, status);
  }
}
