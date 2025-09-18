import { Get, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class AppService {
  constructor(private readonly dataSource: DataSource) {}

  @Get('db')
  async db() {
    try {
      await this.dataSource.query('SELECT 1');
      return { status: 'up' };
    } catch (err) {
      throw new ServiceUnavailableException('Database is unreacheable');
    }
  }
}
