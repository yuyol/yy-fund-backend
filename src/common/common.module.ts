import { Global, Module } from '@nestjs/common';
import { EastMoneyHttpService } from './services/eastmoney-http.service';
import { RedisService } from './services/redis.service';

@Global()
@Module({
  providers: [EastMoneyHttpService, RedisService],
  exports: [EastMoneyHttpService, RedisService],
})
export class CommonModule {}
