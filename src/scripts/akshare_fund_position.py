#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
AKShare 基金持仓查询脚本
调用 fund_portfolio_hold_em 接口获取基金持仓数据
"""

import sys
import io
import json
import re
import akshare as ak

# 强制使用 UTF-8 编码输出 (解决 Windows 中文乱码问题)
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')


def parse_quarter(quarter_str: str) -> tuple:
    """
    解析季度字符串，返回 (年份, 季度) 元组
    例如: "2025年4季度..." -> (2025, 4)
    """
    match = re.match(r"(\d{4})年(\d)季度", quarter_str)
    if match:
        return int(match.group(1)), int(match.group(2))
    return 0, 0


def get_fund_position(symbol: str, date: str = None):
    """
    获取基金持仓数据

    Args:
        symbol: 基金代码，如 "000001"
        date: 指定年份，如 "2026"

    Returns:
        JSON 格式的持仓数据
    """
    try:
        # 调用 AKShare 接口
        if date:
            df = ak.fund_portfolio_hold_em(symbol=symbol, date=date)
        else:
            df = ak.fund_portfolio_hold_em(symbol=symbol)

        if df.empty:
            return json.dumps({"code": 200, "message": "暂无持仓数据", "data": {}}, ensure_ascii=False)

        # 转换 DataFrame 为字典列表
        records = df.to_dict(orient="records")

        # 重命名字段为英文，方便前端使用
        result = []
        for record in records:
            item = {
                "index": int(record.get("序号", 0)),
                "stockCode": str(record.get("股票代码", "")),
                "stockName": str(record.get("股票名称", "")),
                "netValueRatio": float(record.get("占净值比例", 0)),  # 单位: %
                "holdingShares": float(record.get("持股数", 0)),  # 单位: 万股
                "marketValue": float(record.get("持仓市值", 0)),  # 单位: 万元
                "quarter": str(record.get("季度", "")),
            }
            result.append(item)

        return json.dumps({"code": 200, "message": "success", "data": {"list": result}}, ensure_ascii=False)

    except Exception as e:
        return json.dumps(
            {"code": 500, "message": str(e), "data": {}}, ensure_ascii=False
        )


def fetch_holdings_by_quarters(symbol: str, quarters: list) -> dict:
    """
    根据季度列表获取持仓数据
    
    Args:
        symbol: 基金代码
        quarters: 季度列表，格式为 ["2026Q1", "2025Q4", "2025Q3"]
                  第一个为最新季度（权重1.0），第二个次新（权重0.5），第三个（权重0.3）
    
    Returns:
        按季度分组的持仓数据字典 { "2026Q1": [...], "2025Q4": [...], ... }
    """
    holdings_by_quarter = {}
    years_to_fetch = set()
    
    # 解析需要获取的年份
    for q in quarters:
        match = re.match(r"(\d{4})Q(\d)", q)
        if match:
            years_to_fetch.add(match.group(1))
    
    # 获取所有相关年份的数据
    all_records = []
    for year in years_to_fetch:
        try:
            df = ak.fund_portfolio_hold_em(symbol=symbol, date=year)
            if not df.empty:
                all_records.extend(df.to_dict(orient="records"))
        except Exception:
            continue
    
    # 按季度分组
    for record in all_records:
        quarter_str = str(record.get("季度", ""))
        year_num, quarter_num = parse_quarter(quarter_str)
        
        if year_num > 0 and quarter_num > 0:
            quarter_key = f"{year_num}Q{quarter_num}"
            
            if quarter_key in quarters:
                if quarter_key not in holdings_by_quarter:
                    holdings_by_quarter[quarter_key] = []
                
                item = {
                    "stockCode": str(record.get("股票代码", "")),
                    "stockName": str(record.get("股票名称", "")),
                    "netValueRatio": float(record.get("占净值比例", 0)),
                    "holdingShares": float(record.get("持股数", 0)),
                    "marketValue": float(record.get("持仓市值", 0)),
                    "quarter": quarter_str,
                    "originalIndex": int(record.get("序号", 0)),
                }
                holdings_by_quarter[quarter_key].append(item)
    
    return holdings_by_quarter


def get_estimated_position(symbol: str, quarters: list):
    """
    获取估计持仓数据（动态季度版本）
    
    逻辑:
    1. 传入3个季度，按时间从新到旧排列
    2. 最新季度: 完整保留前10持仓及其权重（权重系数 1.0）
    3. 次新季度: 筛选"在次新前10但不在最新前10"的股票（权重系数 0.5）
    4. 第三季度: 筛选高权重股（占净值比例 > 5%）且不在前两季度前10的（权重系数 0.3）
    5. 合并去重，按估计权重排序

    Args:
        symbol: 基金代码
        quarters: 季度列表，格式为 ["2026Q1", "2025Q4", "2025Q3"]
                  按时间从新到旧排列，最多3个季度

    Returns:
        JSON 格式的估计持仓数据
    
    Examples:
        # 2025年底场景: 2025Q4, 2025Q3, 2025Q2
        get_estimated_position("000001", ["2025Q4", "2025Q3", "2025Q2"])
        
        # 2026年初场景: 只有2026Q1出来
        get_estimated_position("000001", ["2026Q1", "2025Q4", "2025Q3"])
    """
    try:
        if not quarters or len(quarters) == 0:
            return json.dumps({"code": 400, "message": "季度列表不能为空", "data": {}}, ensure_ascii=False)
        
        # 获取所有季度的持仓数据
        holdings_by_quarter = fetch_holdings_by_quarters(symbol, quarters)
        
        if not holdings_by_quarter:
            return json.dumps({"code": 200, "message": "暂无持仓数据", "data": {}}, ensure_ascii=False)
        
        # 按传入顺序获取各季度数据（最新 -> 次新 -> 第三）
        latest_holdings = holdings_by_quarter.get(quarters[0], []) if len(quarters) > 0 else []
        second_holdings = holdings_by_quarter.get(quarters[1], []) if len(quarters) > 1 else []
        third_holdings = holdings_by_quarter.get(quarters[2], []) if len(quarters) > 2 else []
        
        # 构建估计持仓
        estimated_holdings = {}
        
        # 1. 最新季度前10完整保留（权重系数 1.0）
        latest_top10_codes = set()
        latest_quarter_label = quarters[0] if len(quarters) > 0 else "Latest"
        
        for item in latest_holdings[:10]:
            code = item["stockCode"]
            latest_top10_codes.add(code)
            estimated_holdings[code] = {
                "stockCode": code,
                "stockName": item["stockName"],
                "estimatedRatio": item["netValueRatio"] * 1.0,
                "source": latest_quarter_label,
                "originalRatio": item["netValueRatio"],
                "confidence": "high",
            }
        
        # 2. 次新季度前10中不在最新前10的股票（权重系数 0.5）
        second_quarter_label = quarters[1] if len(quarters) > 1 else "Second"
        
        for item in second_holdings[:10]:
            code = item["stockCode"]
            if code not in latest_top10_codes:
                if code not in estimated_holdings:
                    estimated_holdings[code] = {
                        "stockCode": code,
                        "stockName": item["stockName"],
                        "estimatedRatio": item["netValueRatio"] * 0.5,
                        "source": second_quarter_label,
                        "originalRatio": item["netValueRatio"],
                        "confidence": "medium",
                    }
        
        # 3. 第三季度高权重股（占净值比例 > 5%）且不在前两季度前10的（权重系数 0.3）
        second_top10_codes = set(item["stockCode"] for item in second_holdings[:10])
        third_quarter_label = quarters[2] if len(quarters) > 2 else "Third"
        high_ratio_threshold = 5.0
        
        for item in third_holdings:
            code = item["stockCode"]
            if item["netValueRatio"] > high_ratio_threshold:
                if code not in latest_top10_codes and code not in second_top10_codes:
                    if code not in estimated_holdings:
                        estimated_holdings[code] = {
                            "stockCode": code,
                            "stockName": item["stockName"],
                            "estimatedRatio": item["netValueRatio"] * 0.3,
                            "source": third_quarter_label,
                            "originalRatio": item["netValueRatio"],
                            "confidence": "low",
                        }
        
        # 按估计权重排序
        result_list = sorted(
            estimated_holdings.values(),
            key=lambda x: x["estimatedRatio"],
            reverse=True
        )
        
        # 添加排名
        for i, item in enumerate(result_list):
            item["rank"] = i + 1
        
        # 动态生成 summary
        summary = {
            "totalStocks": len(result_list),
            "quarters": quarters,
        }
        for q in quarters:
            summary[f"{q}Count"] = len([x for x in result_list if x["source"] == q])
        
        return json.dumps({
            "code": 200,
            "message": "success",
            "data": {
                "list": result_list,
                "summary": summary
            }
        }, ensure_ascii=False)

    except Exception as e:
        return json.dumps(
            {"code": 500, "message": str(e), "data": {}}, ensure_ascii=False
        )


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(
            json.dumps(
                {"code": 400, "message": "缺少基金代码参数", "data": {}},
                ensure_ascii=False,
            )
        )
        sys.exit(1)

    symbol = sys.argv[1]
    
    # 检查是否使用估计持仓模式
    # 用法: 
    #   原始持仓: python akshare_fund_position.py <symbol> [year]
    #   估计持仓: python akshare_fund_position.py <symbol> --estimated <Q1> <Q2> <Q3>
    #   例如: python akshare_fund_position.py 000001 --estimated 2025Q4 2025Q3 2025Q2
    #   例如: python akshare_fund_position.py 000001 --estimated 2026Q1 2025Q4 2025Q3

    # if len(sys.argv) > 2 and sys.argv[2] == "--estimated":
    #     # 获取季度参数列表
    #     quarters = sys.argv[3:6] if len(sys.argv) > 3 else ["2025Q4", "2025Q3", "2025Q2"]
    #     result = get_estimated_position(symbol, quarters)
    # else:
    #     date = sys.argv[2] if len(sys.argv) > 2 else None
    #     result = get_fund_position(symbol, date)
    
    quarters = sys.argv[3:6] if len(sys.argv) > 3 else ["2025Q4", "2025Q3", "2025Q2"]
    result = get_estimated_position(symbol, quarters)

    print(result)
