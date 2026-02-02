import { Injectable } from '@nestjs/common';
import { RedisService } from '@/common/services/redis.service';
import { StockService } from '../stock/stock.service';
import { FundService } from './fund.service';
import { FundQueryItem } from './dto/fund-query.dto';
import {
  PositionStock,
  ContributionDetail,
  FundRealTimeEstimateResult,
  StockMinCache,
} from './fund.types';

// Redis 缓存 Key 前缀
const CACHE_PREFIX = {
  STOCK_MIN: 'stock:min:', // 股票分时缓存
};

// 缓存 TTL（秒）
const CACHE_TTL = {
  STOCK_MIN: 3, // 3秒
};

/**
 * 基金实时估算服务
 * 负责计算基金的实时估算涨幅
 */
@Injectable()
export class FundEstimateService {
  constructor(
    private readonly fundService: FundService,
    private readonly stockService: StockService,
    private readonly redisService: RedisService,
  ) {}

  /**
   * 格式化股票代码为 autostock API 需要的格式
   * 例如: 300502 -> sz300502, 600519 -> sh600519
   */
  private formatStockCode(stockCode: string): string {
    const code = stockCode.replace(/\D/g, '');
    // 判断市场: 6开头为上海，其他为深圳
    const prefix = code.startsWith('6') ? 'sh' : 'sz';
    return `${prefix}${code}`;
  }

  /**
   * 批量获取股票分时数据（带缓存）
   * 合并所有基金的持仓股票，统一获取并缓存
   */
  private async getStockMinBatch(stockCodes: string[]): Promise<Map<string, StockMinCache>> {
    const result = new Map<string, StockMinCache>();
    const uniqueCodes = [...new Set(stockCodes)];

    // 构建缓存 key 列表
    const cacheKeys = uniqueCodes.map((code) => `${CACHE_PREFIX.STOCK_MIN}${code}`);

    // 批量获取缓存
    const cachedValues = await this.redisService.mget<StockMinCache>(cacheKeys);

    // 找出需要从 API 获取的股票
    const missedCodes: string[] = [];
    cachedValues.forEach((value, index) => {
      if (value) {
        result.set(uniqueCodes[index], value);
      } else {
        missedCodes.push(uniqueCodes[index]);
      }
    });

    // 并发获取未命中缓存的股票数据
    if (missedCodes.length > 0) {
      const fetchPromises = missedCodes.map(async (stockCode) => {
        const formattedCode = this.formatStockCode(stockCode);
        try {
          const stockMin = await this.stockService.getStockMin({ code: formattedCode });
          if (stockMin?.code === 200 && stockMin?.data) {
            const cacheData: StockMinCache = {
              code: stockMin.data.code,
              name: stockMin.data.name,
              changePercent: parseFloat(stockMin.data.changePercent) || 0,
            };
            return { stockCode, cacheData, success: true };
          }
          return { stockCode, cacheData: null, success: false };
        } catch {
          return { stockCode, cacheData: null, success: false };
        }
      });

      const fetchResults = await Promise.all(fetchPromises);

      // 批量写入缓存
      const cacheItems: { key: string; value: any; ttl: number }[] = [];
      for (const fetchResult of fetchResults) {
        if (fetchResult.success && fetchResult.cacheData) {
          result.set(fetchResult.stockCode, fetchResult.cacheData);
          cacheItems.push({
            key: `${CACHE_PREFIX.STOCK_MIN}${fetchResult.stockCode}`,
            value: fetchResult.cacheData,
            ttl: CACHE_TTL.STOCK_MIN,
          });
        }
      }

      if (cacheItems.length > 0) {
        await this.redisService.mset(cacheItems);
      }
    }

    return result;
  }

  /**
   * 批量获取基金实时估算涨幅
   * 根据基金持仓和股票实时行情计算基金估算涨幅
   */
  async getFundRealTimeEstimateBatch(
    funds: FundQueryItem[],
  ): Promise<{
    code: number;
    message: string;
    data: (FundRealTimeEstimateResult | null)[];
  }> {
    try {
      // 1. 并发获取所有基金的持仓数据
      const positionPromises = funds.map(async (fund) => {
        try {
          const positionResult = await this.fundService.getFundPosition({
            code: fund.code,
            date: fund.date,
          });
          return {
            fundCode: fund.code,
            fundDate: fund.date,
            positionResult,
            success: positionResult.code === 200 && positionResult.data?.list?.length > 0,
          };
        } catch {
          return {
            fundCode: fund.code,
            fundDate: fund.date,
            positionResult: null,
            success: false,
          };
        }
      });

      const positionResults = await Promise.all(positionPromises);

      // 2. 收集所有股票代码，合并成股票池
      const allStockCodes: string[] = [];
      const fundPositionMap = new Map<string, PositionStock[]>();

      for (const result of positionResults) {
        if (result.success && result.positionResult?.data?.list) {
          const positionList: PositionStock[] = result.positionResult.data.list;
          fundPositionMap.set(result.fundCode, positionList);

          for (const position of positionList) {
            allStockCodes.push(position.stockCode);
          }
        }
      }

      // 3. 批量获取股票分时数据（共享缓存）
      const stockMinMap = await this.getStockMinBatch(allStockCodes);

      // 4. 并发获取基金名称
      const fundNamePromises = funds.map(async (fund) => {
        try {
          const fundDetail = await this.fundService.getFundMNDetailInformation({ FCODE: fund.code });
          return {
            fundCode: fund.code,
            fundName: fundDetail?.Datas?.SHORTNAME || `基金${fund.code}`,
          };
        } catch {
          return {
            fundCode: fund.code,
            fundName: `基金${fund.code}`,
          };
        }
      });

      const fundNameResults = await Promise.all(fundNamePromises);
      const fundNameMap = new Map<string, string>();
      for (const result of fundNameResults) {
        fundNameMap.set(result.fundCode, result.fundName);
      }

      // 5. 计算每个基金的估算涨幅
      const estimateResults: (FundRealTimeEstimateResult | null)[] = [];

      for (const fund of funds) {
        const positionList = fundPositionMap.get(fund.code);

        if (!positionList) {
          estimateResults.push(null);
          continue;
        }

        let totalWeightedChange = 0;
        let totalPositionRatio = 0;
        const contributions: ContributionDetail[] = [];

        for (const position of positionList) {
          const stockMin = stockMinMap.get(position.stockCode);

          if (stockMin) {
            const changePercent = stockMin.changePercent;
            const ratio = position.estimatedRatio;

            // 计算该股票对基金涨幅的贡献
            const contribution = (changePercent * ratio) / 100;
            totalWeightedChange += contribution;
            totalPositionRatio += ratio;

            contributions.push({
              stockCode: position.stockCode,
              stockName: position.stockName,
              ratio: ratio,
              changePercent: changePercent,
              contribution: parseFloat(contribution.toFixed(4)),
            });
          }
        }

        // 获取持仓披露日期
        const positionDate =
          positionList[0]?.source ||
          positionResults.find((r) => r.fundCode === fund.code)?.positionResult?.data?.summary
            ?.quarters?.[0] ||
          '';

        estimateResults.push({
          fundCode: fund.code,
          fundName: fundNameMap.get(fund.code) || `基金${fund.code}`,
          estimatedChange: parseFloat(totalWeightedChange.toFixed(4)),
          totalPositionRatio: parseFloat(totalPositionRatio.toFixed(2)),
          positionDate,
          contributions: contributions.sort((a, b) => b.contribution - a.contribution),
        });
      }

      return {
        code: 200,
        message: 'success',
        data: estimateResults,
      };
    } catch (error) {
      return {
        code: 500,
        message: `计算基金实时估算涨幅失败: ${error.message}`,
        data: [],
      };
    }
  }
}
