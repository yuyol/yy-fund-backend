/**
 * 基金模块类型定义
 */

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
 * 股票分时缓存数据
 */
export interface StockMinCache {
  code: string;
  name: string;
  changePercent: number;
}

/**
 * 基金持仓获取结果
 */
export interface FundPositionResult {
  fundCode: string;
  fundDate?: string;
  positionResult: any;
  success: boolean;
}

/**
 * 基金名称映射结果
 */
export interface FundNameResult {
  fundCode: string;
  fundName: string;
}
