import { Injectable } from '@nestjs/common';
import { EastMoneyHttpService } from '@/common/services/eastmoney-http.service';
import { FundRankQueryDto } from './dto/fund-query.dto';

/**
 * 基金服务
 * 提供基金相关的数据查询能力
 */
@Injectable()
export class FundService {
  constructor(private readonly httpService: EastMoneyHttpService) {}

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

  async getFundMNDetailInformation(params: any = {}) {
    const url = 'https://fundmobapi.eastmoney.com/FundMNewApi/FundMNDetailInformation';
    return this.httpService.get(url, {
      FCODE: params.FCODE,
    });
  }
}
