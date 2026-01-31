import { Module } from '@nestjs/common';
import { FundController } from './fund.controller';
import { FundService } from './fund.service';
import { StockModule } from '../stock/stock.module';

@Module({
  imports: [StockModule],
  controllers: [FundController],
  providers: [FundService],
  exports: [FundService],
})
export class FundModule {}
