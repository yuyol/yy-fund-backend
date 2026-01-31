import { IsString, IsOptional } from 'class-validator';

/**
 * 基金实时估算查询参数
 */
export class FundRealTimeEstimateQueryDto {
  /**
   * 基金代码
   */
  @IsString()
  code: string;

  /**
   * 指定年份，如 "2026"
   */
  @IsOptional()
  @IsString()
  date?: string;
}

/**
 * 基金持仓查询参数
 */
export class FundPositionQueryDto {
  /**
   * 基金代码
   */
  @IsString()
  code: string;

  /**
   * 指定年份，如 "2026"
   */
  @IsOptional()
  @IsString()
  date?: string;
}

/**
 * 基金排行查询参数
 */
export class FundRankQueryDto {
  /**
   * 基金类型
   */
  @IsOptional()
  @IsString()
  FundType?: string;

  /**
   * 排序字段
   */
  @IsOptional()
  @IsString()
  SortColumn?: string;

  /**
   * 排序方式 (asc/desc)
   */
  @IsOptional()
  @IsString()
  Sort?: string;

  /**
   * 页码
   */
  @IsOptional()
  @IsString()
  pageIndex?: string;

  /**
   * 每页数量
   */
  @IsOptional()
  @IsString()
  pageSize?: string;
}
