import { Controller, Get, Query } from '@nestjs/common';
import { StockService } from './stock.service';
import {
  StockDetailQueryDto,
  StockDetailsQueryDto,
  StockKlineQueryDto,
  StockTrendsQueryDto,
  StockMinQueryDto,
} from './dto/stock-query.dto';

/**
 * 股票控制器
 * 提供股票相关的 API 接口
 */
@Controller('stock')
export class StockController {
  constructor(private readonly stockService: StockService) {}

  /**
   * 获取股票详情
   * GET /api/stock/info?type=0&code=000001
   */
  @Get('info')
  async getStockInfo(@Query() query: StockDetailQueryDto) {
    return this.stockService.getStockInfo(query);
  }

  /**
   * 获取股票交易明细
   * GET /api/stock/details?type=0&code=000001
   */
  @Get('details')
  async getStockDetails(@Query() query: StockDetailsQueryDto) {
    return this.stockService.getStockDetails(query);
  }

  /**
   * 获取股票K线数据
   * GET /api/stock/kline?type=0&code=000001&klt=101
   */
  @Get('kline')
  async getStockKline(@Query() query: StockKlineQueryDto) {
    return this.stockService.getStockKline(query);
  }

  /**
   * 获取股票走势图数据
   * GET /api/stock/trends?type=0&code=000001&ndays=1
   */
  @Get('trends')
  async getStockTrends(@Query() query: StockTrendsQueryDto) {
    return this.stockService.getStockTrends(query);
  }

  /**
   * 获取股票分时信息
   * GET /api/stock/min?code=000001
   */
  @Get('min')
  async getStockMin(@Query() query: StockMinQueryDto) {
    return this.stockService.getStockMin(query);
  }
}
