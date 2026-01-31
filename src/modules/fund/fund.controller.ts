import { Controller, Get, Query } from '@nestjs/common';
import { FundService } from './fund.service';
import { FundRankQueryDto } from './dto/fund-query.dto';

/**
 * 基金控制器
 * 提供基金相关的 API 接口
 */
@Controller('fund')
export class FundController {
  constructor(private readonly fundService: FundService) {}

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
}
