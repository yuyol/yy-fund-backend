import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StockModule } from './modules/stock/stock.module';
import { FundModule } from './modules/fund/fund.module';
import { CommonModule } from './common/common.module';

@Module({
  imports: [
    // 配置模块
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    // 公共模块
    CommonModule,
    // 业务模块
    StockModule,
    FundModule,
  ],
})
export class AppModule {}
