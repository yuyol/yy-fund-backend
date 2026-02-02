import { Controller, Get, Post, Query, Body } from '@nestjs/common';
import { FundService } from './fund.service';
import { FundEstimateService } from './fund-estimate.service';
import {
  FundRankQueryDto,
  FundPositionQueryDto,
  FundRealTimeEstimateBatchDto,
} from './dto/fund-query.dto';

/**
 * 基金控制器
 * 提供基金相关的 API 接口
 */
@Controller('fund')
export class FundController {
  constructor(
    private readonly fundService: FundService,
    private readonly fundEstimateService: FundEstimateService,
  ) {}

  /**
   * 获取基金排行
   * GET /api/fund/rank?FundType=0&pageIndex=1&pageSize=20
   */
  @Get('rank')
  async getFundRank(@Query() query: FundRankQueryDto) {
    return this.fundService.getFundRank(query);
  }

  /**
   * 获取基金详情
   * GET /api/fund/detail?FCODE=000001
   */
  @Get('detail')
  async getFundMNDetailInformation(@Query() query: any = {}) {
    console.log('query', query);
    return this.fundService.getFundMNDetailInformation(query);
  }

  /**
   * 获取基金持仓
   * GET /api/fund/position?code=000001
   */
  @Get('position')
  async getFundPosition(@Query() query: FundPositionQueryDto) {
    return this.fundService.getFundPosition(query);
  }

  /**
   * 批量获取基金实时估算涨幅
   * POST /api/fund/realtime-estimate
   * 
   * 请求体:
   * {
   *   "funds": [
   *     { "code": "000001", "date": "2026" },
   *     { "code": "000002" }
   *   ]
   * }
   * 
   * 返回结构:
   * {
   *   code: 200,
   *   message: "success",
   *   data: [
   *     {
   *       fundCode: "000001",
   *       fundName: "基金名称",
   *       estimatedChange: 1.23,        // 估算实时涨幅 (%)
   *       totalPositionRatio: 85.5,     // 参与计算的仓位占比 (%)
   *       positionDate: "2025Q1",       // 持仓披露日期
   *       contributions: [              // 持仓贡献详情
   *         {
   *           stockCode: "300502",
   *           stockName: "新易盛",
   *           ratio: 9.83,              // 持仓比例 (%)
   *           changePercent: 5.73,      // 实时涨跌 (%)
   *           contribution: 0.5632      // 贡献 (%)
   *         }
   *       ]
   *     }
   *   ]
   * }
   */
  @Post('realtime-estimate')
  async getFundRealTimeEstimate(@Body() body: FundRealTimeEstimateBatchDto) {
    return this.fundEstimateService.getFundRealTimeEstimateBatch(body.funds);
  }
}
