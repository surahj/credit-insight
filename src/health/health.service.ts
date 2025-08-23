import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../common/entities';

@Injectable()
export class HealthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async check() {
    const startTime = Date.now();
    let dbStatus = 'up';
    let dbLatency = 0;

    try {
      const dbStart = Date.now();
      await this.userRepository.query('SELECT 1');
      dbLatency = Date.now() - dbStart;
    } catch (error) {
      dbStatus = 'down';
    }

    const totalLatency = Date.now() - startTime;

    return {
      status: dbStatus === 'up' ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      checks: {
        database: {
          status: dbStatus,
          latency: `${dbLatency}ms`,
        },
      },
      responseTime: `${totalLatency}ms`,
    };
  }

  async getMetrics() {
    const memoryUsage = process.memoryUsage();

    return {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        used: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
        total: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
        external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`,
        rss: `${Math.round(memoryUsage.rss / 1024 / 1024)}MB`,
      },
      cpu: {
        user: process.cpuUsage().user,
        system: process.cpuUsage().system,
      },
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
    };
  }
}
