import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { DbService } from '../db/db.service';

@Injectable()
export class ClaimsService {
  constructor(private db: DbService) {}

  async submitClaim(venueId: string, userId: string, documents: string) {
    // Basic verification that user and venue exist
    const userRes = await this.db.query('SELECT id FROM users WHERE id = $1', [userId]);
    if (userRes.rows.length === 0) {
      // For development/testing, auto-create user if not found
      await this.db.query('INSERT INTO users (id, auth_id, role) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING', [userId, `auth-${userId}`, 'user']);
    }

    const venueRes = await this.db.query('SELECT id FROM venues WHERE id = $1', [venueId]);
    if (venueRes.rows.length === 0) {
      throw new NotFoundException('Venue not found');
    }

    try {
      const res = await this.db.query(
        `INSERT INTO venue_claims (venue_id, user_id, documents, status) 
         VALUES ($1, $2, $3, 'pending') 
         RETURNING *`,
        [venueId, userId, documents]
      );
      return res.rows[0];
    } catch (e: any) {
      if (e.code === '23505') { // unique_violation
        throw new BadRequestException('You have already submitted a claim for this venue.');
      }
      throw e;
    }
  }

  async getUserClaims(userId: string) {
    const res = await this.db.query(
      `SELECT c.*, v.name as venue_name, v.address 
       FROM venue_claims c 
       JOIN venues v ON c.venue_id = v.id 
       WHERE c.user_id = $1`,
      [userId]
    );
    return res.rows;
  }

  async updateClaimStatus(claimId: string, status: 'approved' | 'rejected') {
    const res = await this.db.query(
      `UPDATE venue_claims SET status = $1, updated_at = now() WHERE id = $2 RETURNING *`,
      [status, claimId]
    );

    if (res.rows.length === 0) {
      throw new NotFoundException('Claim not found');
    }

    const claim = res.rows[0];

    // If approved, upgrade the user to a business role
    if (status === 'approved') {
      await this.db.query(
        `UPDATE users SET role = 'business' WHERE id = $1 AND role = 'user'`,
        [claim.user_id]
      );
    }

    return claim;
  }
}
