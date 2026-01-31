#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
AKShare 基金持仓查询脚本
调用 fund_portfolio_hold_em 接口获取基金持仓数据
"""

import sys
import io
import json
import akshare as ak

# 强制使用 UTF-8 编码输出 (解决 Windows 中文乱码问题)
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')


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
    date = sys.argv[2] if len(sys.argv) > 2 else None

    result = get_fund_position(symbol, date)
    print(result)
