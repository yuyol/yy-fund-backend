# YY Fund Backend

基于 NestJS + Fastify 的基金/股票数据 API 服务。

## 技术栈

- **框架**: NestJS 10.x
- **HTTP 适配器**: Fastify
- **语言**: TypeScript
- **验证**: class-validator + class-transformer

## 项目结构

```
src/
├── main.ts                    # 应用入口
├── app.module.ts              # 根模块
├── common/                    # 公共模块
│   ├── common.module.ts
│   └── services/
│       └── eastmoney-http.service.ts  # 东方财富 HTTP 服务
└── modules/                   # 业务模块
    ├── stock/                 # 股票模块
    │   ├── stock.module.ts
    │   ├── stock.controller.ts
    │   ├── stock.service.ts
    │   └── dto/
    │       └── stock-query.dto.ts
    └── fund/                  # 基金模块
        ├── fund.module.ts
        ├── fund.controller.ts
        ├── fund.service.ts
        └── dto/
            └── fund-query.dto.ts
```

## 快速开始

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
pnpm start:dev
```

### 生产构建

```bash
pnpm build
pnpm start:prod
```

## API 接口

### 股票接口

| 接口 | 方法 | 路径 | 描述 |
|------|------|------|------|
| 股票详情 | GET | `/api/stock/info` | 获取股票基本信息 |
| 交易明细 | GET | `/api/stock/details` | 获取股票交易明细 |
| K线数据 | GET | `/api/stock/kline` | 获取股票K线数据 |
| 走势图 | GET | `/api/stock/trends` | 获取股票走势图数据 |

#### 参数说明

- `type`: 股票类型 (0: 深圳, 1: 上海)
- `code`: 股票代码

示例:
```
GET /api/stock/info?type=0&code=000001
GET /api/stock/kline?type=0&code=000001&klt=101
```

### 基金接口

| 接口 | 方法 | 路径 | 描述 |
|------|------|------|------|
| 基金排行 | GET | `/api/fund/rank` | 获取基金排行榜 |

示例:
```
GET /api/fund/rank?FundType=0&pageIndex=1&pageSize=20
```

## Docker 部署

```bash
docker build -t yy-fund-backend .
docker run -p 3000:3000 yy-fund-backend
```

## License

ISC