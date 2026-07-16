import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private client: RedisClientType | null = null;
  private memoryCache = new Map<string, { value: string; expiresAt: number | null }>();
  private readonly logger = new Logger(CacheService.name);

  constructor(private configService: ConfigService) {
    const url = this.configService.get<string>('REDIS_URL') || 'redis://localhost:6379';
    try {
      this.client = createClient({ url });
      this.client.on('error', (err) => {
        // Suppress nested logs, handled on connection check
      });
    } catch (e: any) {
      this.logger.warn('Failed to build Redis client. Caching will use in-memory store.');
    }
  }

  async onModuleInit() {
    if (this.client) {
      try {
        await this.client.connect();
        this.logger.log('Connected to Redis server successfully.');
      } catch (err: any) {
        this.logger.warn('Could not connect to Redis server. Falling back to in-memory caching.');
        this.client = null;
      }
    }
  }

  async onModuleDestroy() {
    if (this.client && this.client.isOpen) {
      await this.client.disconnect();
    }
  }

  async get(key: string): Promise<string | null> {
    if (this.client && this.client.isOpen) {
      try {
        return await this.client.get(key);
      } catch (e) {
        this.logger.warn('Redis read failed, falling back to memory.');
      }
    }
    
    // Memory Cache Fallback
    const cached = this.memoryCache.get(key);
    if (!cached) return null;
    
    if (cached.expiresAt && Date.now() > cached.expiresAt) {
      this.memoryCache.delete(key);
      return null;
    }
    return cached.value;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (this.client && this.client.isOpen) {
      try {
        if (ttlSeconds) {
          await this.client.set(key, value, { EX: ttlSeconds });
        } else {
          await this.client.set(key, value);
        }
        return;
      } catch (e) {
        this.logger.warn('Redis write failed, falling back to memory.');
      }
    }

    // Memory Cache Fallback
    const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    this.memoryCache.set(key, { value, expiresAt });
  }

  async del(key: string): Promise<void> {
    if (this.client && this.client.isOpen) {
      try {
        await this.client.del(key);
        return;
      } catch (e) {
        this.logger.warn('Redis delete failed, falling back to memory.');
      }
    }
    this.memoryCache.delete(key);
  }
}
