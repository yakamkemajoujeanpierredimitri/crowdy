import { Injectable, NotFoundException } from '@nestjs/common';
import { DbService } from '../db/db.service';

@Injectable()
export class HighlightsService {
  constructor(private db: DbService) {}

  async getHighlightsByVenue(venueId: string) {
    const res = await this.db.query(
      'SELECT id, venue_id, media_url, media_type, uploaded_at FROM highlights WHERE venue_id = $1 ORDER BY uploaded_at DESC',
      [venueId],
    );
    return res.rows;
  }

  async uploadHighlight(
    venueId: string,
    mediaUrl: string,
    mediaType: string = 'image',
  ) {
    try {
      const res = await this.db.query(
        'INSERT INTO highlights (venue_id, media_url, media_type) VALUES ($1, $2, $3) RETURNING *',
        [venueId, mediaUrl, mediaType],
      );
      return res.rows[0];
    } catch (e: any) {
      if (e?.code === '23503') throw new NotFoundException('Venue not found'); // foreign key
      throw e;
    }
  }
}
