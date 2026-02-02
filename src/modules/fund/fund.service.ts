import { Injectable } from '@nestjs/common';
import { EastMoneyHttpService } from '@/common/services/eastmoney-http.service';
import { RedisService } from '@/common/services/redis.service';
import { FundRankQueryDto, FundPositionQueryDto } from './dto/fund-query.dto';
import { spawn } from 'child_process';
import * as path from 'path';

// Redis 缓存 Key 前缀
const CACHE_PREFIX = {
  FUND_POSITION: 'fund:position:', // 基金持仓缓存
};

// 缓存 TTL（秒）
const CACHE_TTL = {
  FUND_POSITION: 10 * 24 * 60 * 60, // 10天
};

/**
 * 基金服务
 * 提供基金基础数据查询能力（排行、详情、持仓）
 */
@Injectable()
export class FundService {
  private readonly pythonScriptPath = path.join(
    process.cwd(),
    'src/scripts/akshare_fund_position.py',
  );

  constructor(
    private readonly httpService: EastMoneyHttpService,
    private readonly redisService: RedisService,
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
   * 获取基金持仓（带缓存）
   * 调用 AKShare fund_portfolio_hold_em 接口获取基金持仓数据
   */
  async getFundPosition(params: FundPositionQueryDto): Promise<any> {
    const cacheKey = `${CACHE_PREFIX.FUND_POSITION}${params.code}:${params.date || 'latest'}`;

    // 尝试从缓存获取
    const cached = await this.redisService.get<any>(cacheKey);
    if (cached) {
      return cached;
    }

    // 从 API 获取
    const result = await this.fetchFundPositionFromApi(params);

    // 写入缓存
    if (result.code === 200) {
      await this.redisService.set(cacheKey, result, CACHE_TTL.FUND_POSITION);
    }

    return result;
  }

  /**
   * 从 API 获取基金持仓数据
   */
  private fetchFundPositionFromApi(params: FundPositionQueryDto): Promise<any> {
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
}
