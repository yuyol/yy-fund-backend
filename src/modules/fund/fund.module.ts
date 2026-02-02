import { Module, forwardRef } from '@nestjs/common';
import { FundController } from './fund.controller';
import { FundService } from './fund.service';
import { FundEstimateService } from './fund-estimate.service';
import { StockModule } from '../stock/stock.module';

@Module({
  imports: [forwardRef(() => StockModule)],
  controllers: [FundController],
  providers: [FundService, FundEstimateService],
  exports: [FundService, FundEstimateService],
})
export class FundModule {}
