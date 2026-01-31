import { IsString, IsOptional, IsNumber } from 'class-validator';

/**
 * 股票基础查询参数
 */
export class StockBaseQueryDto {
  /**
   * 股票类型 (0: 深圳, 1: 上海)
   */
  @IsString()
  type: string;

  /**
   * 股票代码
   */
  @IsString()
  code: string;
}

/**
 * 股票详情查询参数
 */
export class StockDetailQueryDto extends StockBaseQueryDto {}

/**
 * 股票交易明细查询参数
 */
export class StockDetailsQueryDto extends StockBaseQueryDto {
  @IsOptional()
  @IsString()
  pos?: string;
}

/**
 * 股票K线查询参数
 */
export class StockKlineQueryDto extends StockBaseQueryDto {
  /**
   * K线类型 (101: 日K, 102: 周K, 103: 月K)
   */
  @IsOptional()
  @IsString()
  klt?: string;

  /**
   * 数据条数限制
   */
  @IsOptional()
  @IsString()
  lmt?: string;

  /**
   * 复权类型 (0: 不复权, 1: 前复权, 2: 后复权)
   */
  @IsOptional()
  @IsString()
  fqt?: string;

  /**
   * 结束日期
   */
  @IsOptional()
  @IsString()
  end?: string;
}

/**
 * 股票走势图查询参数
 */
export class StockTrendsQueryDto extends StockBaseQueryDto {
  /**
   * 天数
   */
  @IsOptional()
  @IsString()
  ndays?: string;
}

/**
 * 股票分时信息查询参数
 */
export class StockMinQueryDto {
  /**
   * 股票代码
   */
  @IsString()
  code: string;
}