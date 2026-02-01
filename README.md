# YY Fund Backend

基于 NestJS + Fastify 的A股股票基金实时预估涨幅计算工具
适用于A股股票基金，通过整合多个 api 接口，实时通过基金持仓信息计算基金预估实时涨幅。

前端代码: https://github.com/yuyol/yy-fund-frontend

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
npm install

pip install akshare --upgrade
```

### 开发模式

```bash
npm start
```

### 生产构建

```bash
npm build
npm start:prod
```

## Docker 部署

```bash
docker build -t yy-fund-backend .
docker run -p 3000:3000 yy-fund-backend
```

## License

ISC