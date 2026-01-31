import { Injectable } from '@nestjs/common';
import { EastMoneyHttpService } from '@/common/services/eastmoney-http.service';
import {
  StockDetailQueryDto,
  StockDetailsQueryDto,
  StockKlineQueryDto,
  StockTrendsQueryDto,
  StockMinQueryDto,
} from './dto/stock-query.dto';

/**
 * 股票服务
 * 提供股票相关的数据查询能力
 */
@Injectable()
export class StockService {
  private readonly autostockBaseUrl = 'https://api.autostock.cn/v1';

  constructor(private readonly httpService: EastMoneyHttpService) {}

  /**
   * 获取股票详情
   */
  async getStockInfo(params: StockDetailQueryDto) {
    const url = 'https://push2.eastmoney.com/api/qt/stock/get';
    return this.httpService.get(url, {
      secid: `${params.type}.${params.code}`,
      fields:
        'f19,f20,f23,f24,f25,f26,f27,f28,f29,f30,f43,f44,f45,f46,f47,f48,f49,f50,f57,f58,f59,f60,f113,f114,f115,f116,f117,f127,f130,f131,f132,f133,f135,f136,f137,f138,f139,f140,f141,f142,f143,f144,f145,f146,f147,f148,f149,f152,f161,f162,f164,f165,f167,f168,f169,f170,f171,f174,f175,f177,f178,f198,f199,f294,f530,f531',
      invt: 2,
    });
  }

  /**
   * 获取股票交易明细
   */
  async getStockDetails(params: StockDetailsQueryDto) {
    const url = 'https://push2.eastmoney.com/api/qt/stock/details/get';
    return this.httpService.get(url, {
      secid: `${params.type}.${params.code}`,
      fields1: 'f1,f2,f3,f4,f5',
      fields2: 'f51,f52,f53,f54,f55',
      pos: params.pos || '-14',
      iscca: 1,
      invt: 2,
    });
  }

  /**
   * 获取股票K线数据
   */
  async getStockKline(params: StockKlineQueryDto) {
    const url = 'https://push2his.eastmoney.com/api/qt/stock/kline/get';
    return this.httpService.get(url, {
      secid: `${params.type}.${params.code}`,
      klt: params.klt || '101',
      lmt: params.lmt,
      fqt: params.fqt || '1',
      end: params.end || '20500101',
      iscca: 1,
      fields1: 'f1,f2,f3,f4,f5',
      fields2: 'f51,f52,f53,f54,f55,f56,f57',
    });
  }

  /**
   * 获取股票走势图数据
   */
  async getStockTrends(params: StockTrendsQueryDto) {
    const url = 'https://push2.eastmoney.com/api/qt/stock/trends2/get';
    return this.httpService.get(url, {
      secid: `${params.type}.${params.code}`,
      fields1: 'f1,f2,f3,f4,f5,f6,f7,f8,f9,f10,f11,f12,f13',
      fields2: 'f51,f53,f56,f58',
      iscr: 0,
      iscca: 0,
      ndays: params.ndays || '1',
    });
  }

  /**
   * 获取股票分时信息
   * 调用 autostock API 获取股票分时数据
   */
  async getStockMin(params: StockMinQueryDto) {
    const url = `${this.autostockBaseUrl}/stock/min`;
    return this.httpService.get(url, {
      code: params.code,
    });
  }
}
