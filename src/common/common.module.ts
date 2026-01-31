import { Global, Module } from '@nestjs/common';
import { EastMoneyHttpService } from './services/eastmoney-http.service';

@Global()
@Module({
  providers: [EastMoneyHttpService],
  exports: [EastMoneyHttpService],
})
export class CommonModule {}
