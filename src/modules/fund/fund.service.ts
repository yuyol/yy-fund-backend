import { Injectable } from '@nestjs/common';
import { EastMoneyHttpService } from '@/common/services/eastmoney-http.service';
import {
  FundRankQueryDto,
  FundPositionQueryDto,
  FundRealTimeEstimateQueryDto,
} from './dto/fund-query.dto';
import { StockService } from '../stock/stock.service';
import { spawn } from 'child_process';
import * as path from 'path';

/**
 * 持仓股票信息
 */
export interface PositionStock {
  stockCode: string;
  stockName: string;
  estimatedRatio: number;
  source: string;
  originalRatio: number;
  confidence: string;
  rank: number;
}

/**
 * 持仓贡献详情
 */
export interface ContributionDetail {
  stockCode: string;
  stockName: string;
  ratio: number;
  changePercent: number;
  contribution: number;
}

/**
 * 基金实时估算结果
 */
export interface FundRealTimeEstimateResult {
  fundCode: string;
  fundName: string;
  estimatedChange: number;
  totalPositionRatio: number;
  positionDate: string;
  contributions: ContributionDetail[];
}

/**
 * 基金服务
 * 提供基金相关的数据查询能力
 */
@Injectable()
export class FundService {
  private readonly pythonScriptPath = path.join(
    process.cwd(),
    'src/scripts/akshare_fund_position.py',
  );

  constructor(
    private readonly httpService: EastMoneyHttpService,
    private readonly stockService: StockService,
  ) {}

  /**
   * 获取基金排行
   */
  async getFundRank(params: FundRankQueryDto = {}) {
    const url = 'https://fundmobapi.eastmoney.com/FundMNewApi/FundMNRank';
    return this.httpService.get(url, {
      FundType: params.FundType || '0',
      SortColumn: params.SortColumn || 'SYL_1N',
      Sort: params.Sort || 'desc',
      pageIndex: params.pageIndex || '1',
      pageSize: params.pageSize || '20',
      ...params,
    });
  }

  /**
   * 获取基金详情
   */
  async getFundMNDetailInformation(params: any = {}) {
    const url = 'https://fundmobapi.eastmoney.com/FundMNewApi/FundMNDetailInformation';
    return this.httpService.get(url, {
      FCODE: params.FCODE,
    });
  }

  /**
   * 获取基金持仓
   * 调用 AKShare fund_portfolio_hold_em 接口获取基金持仓数据
   */
  async getFundPosition(params: FundPositionQueryDto): Promise<any> {
    return new Promise((resolve, reject) => {
      const args = [this.pythonScriptPath, params.code];
      if (params.date) {
        args.push(params.date);
      }

      const pythonProcess = spawn('python', args);

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Python script error: ${stderr}`));
          return;
        }

        try {
          const result = JSON.parse(stdout);
          resolve(result);
        } catch (e) {
          reject(new Error(`Failed to parse Python output: ${stdout}`));
        }
      });

      pythonProcess.on('error', (err) => {
        reject(new Error(`Failed to start Python process: ${err.message}`));
      });
    });
  }

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
   * 获取基金实时估算涨幅
   * 根据基金持仓和股票实时行情计算基金估算涨幅
   */
  async getFundRealTimeEstimate(
    params: FundRealTimeEstimateQueryDto,
  ): Promise<{
    code: number;
    message: string;
    data: FundRealTimeEstimateResult | null;
  }> {
    try {
      // 1. 获取基金持仓数据
      const positionResult = await this.getFundPosition({
        code: params.code,
        date: params.date,
      });

      if (
        positionResult.code !== 200 ||
        !positionResult.data?.list?.length
      ) {
        return {
          code: 400,
          message: '获取基金持仓数据失败',
          data: null,
        };
      }

      const positionList: PositionStock[] = positionResult.data.list;

      // 2. 获取基金详情以获取基金名称
      let fundName = '';
      try {
        const fundDetail = await this.getFundMNDetailInformation({
          FCODE: params.code,
        });
        fundName = fundDetail?.Datas?.SHORTNAME || `基金${params.code}`;
      } catch {
        fundName = `基金${params.code}`;
      }

      // 3. 并发获取所有持仓股票的实时行情
      const stockMinPromises = positionList.map(async (position) => {
        const formattedCode = this.formatStockCode(position.stockCode);
        try {
          const stockMin = await this.stockService.getStockMin({
            code: formattedCode,
          });
          return {
            position,
            stockMin,
            success: stockMin?.code === 200,
          };
        } catch {
          return {
            position,
            stockMin: null,
            success: false,
          };
        }
      });

      const stockResults = await Promise.all(stockMinPromises);

      // 4. 计算加权涨幅
      let totalWeightedChange = 0;
      let totalPositionRatio = 0;
      const contributions: ContributionDetail[] = [];

      for (const result of stockResults) {
        if (result.success && result.stockMin?.data) {
          const { position, stockMin } = result;
          const changePercent = parseFloat(stockMin.data.changePercent) || 0;
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

      // 5. 获取持仓披露日期
      const positionDate =
        positionList[0]?.source || positionResult.data?.summary?.quarters?.[0] || '';

      // 6. 构建返回结果
      const estimateResult: FundRealTimeEstimateResult = {
        fundCode: params.code,
        fundName,
        estimatedChange: parseFloat(totalWeightedChange.toFixed(4)),
        totalPositionRatio: parseFloat(totalPositionRatio.toFixed(2)),
        positionDate,
        contributions: contributions.sort((a, b) => b.contribution - a.contribution),
      };

      return {
        code: 200,
        message: 'success',
        data: estimateResult,
      };
    } catch (error) {
      return {
        code: 500,
        message: `计算基金实时估算涨幅失败: ${error.message}`,
        data: null,
      };
    }
  }
}
