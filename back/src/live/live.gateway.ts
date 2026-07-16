import { 
  WebSocketGateway, 
  WebSocketServer, 
  SubscribeMessage, 
  MessageBody, 
  ConnectedSocket 
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class LiveGateway {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(LiveGateway.name);

  @SubscribeMessage('subscribe')
  handleSubscribe(
    @MessageBody() data: { venueId: string },
    @ConnectedSocket() client: Socket
  ) {
    if (data && data.venueId) {
      const room = `score:${data.venueId}`;
      client.join(room);
      this.logger.log(`Client ${client.id} subscribed to room: ${room}`);
      return { status: 'success', room };
    }
    return { status: 'error', message: 'Invalid venueId' };
  }

  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(
    @MessageBody() data: { venueId: string },
    @ConnectedSocket() client: Socket
  ) {
    if (data && data.venueId) {
      const room = `score:${data.venueId}`;
      client.leave(room);
      this.logger.log(`Client ${client.id} unsubscribed from room: ${room}`);
      return { status: 'success', room };
    }
    return { status: 'error', message: 'Invalid venueId' };
  }

  emitScoreUpdate(venueId: string, payload: { score: number; label: string; color: string; source: string }) {
    if (this.server) {
      const room = `score:${venueId}`;
      this.server.to(room).emit('score_update', { venueId, ...payload });
      this.logger.log(`Broadcasted score update to room ${room}: ${JSON.stringify({ venueId, ...payload })}`);
    }
  }
}
