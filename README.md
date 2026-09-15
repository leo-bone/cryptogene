# CryptoGene - 加密市场基因进化框架

## 项目概述

一个垂直于加密市场的 AI Agent 基因进化框架，包含套利、信号、组合、风险四大核心基因，通过竞技场机制自动筛选最优策略。

## 核心功能

### 1. 基因库（Genes）

| 基因类型 | 功能 | 算法 |
|----------|------|------|
| **ArbitrageGene** | 跨交易所套利 | 价差检测、延迟分析 |
| **SignalGene** | 交易信号 | MACD/RSI/布林带组合 |
| **PortfolioGene** | 组合优化 | 均值方差/风险平价 |
| **RiskGene** | 风险管理 | 止损/仓位/凯利公式 |

### 2. 竞技场（Arena）

- 多基因竞争
- 适应度评分
- 实时排名

### 3. 交付形式

- **网页 Dashboard**：可视化分析
- **API Server**：供其他应用调用
- **CLI 工具**：命令行操作

## 技术栈

- 前端：React + Vite + Tailwind + Plotly
- 后端：Node.js + Express + TypeScript
- 数据库：SQLite + Redis
- 数据源：Binance API

## 商业模式

订阅制：
- Free：基础基因
- Pro ($29/月)：全部基因 + API
- Enterprise：私有部署

## 项目结构

```
cryptogene/
├── genes/           # 基因模块
│   ├── arbitrage/
│   ├── signal/
│   ├── portfolio/
│   └── risk/
├── arena/           # 竞技场
├── web/             # 前端
├── api/             # 后端 API
└── cli/             # 命令行工具
```

## 运行命令

```bash
# 安装依赖（根目录 + web/ 各一次，或用 install:all）
npm run install:all

# 启动 API（默认端口 3001）
npm run dev:api

# 启动网页（Vite dev server）
npm run dev:web

# CLI 帮助
npm run cli -- --help
```

### 环境变量

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `PORT` | `3001` | API 服务端口 |
| `BINANCE_BASE` | `https://data-api.binance.vision` | 行情数据源。默认的 `data-api.binance.vision` 与 `api.binance.com` 数据一致，但在中国大陆可访问；如你有可用线路，设 `BINANCE_BASE=https://api.binance.com` 即可切回 |

### 前端如何连后端

`web/src/App.tsx` 里的 `API_BASE` 目前硬编码为 `http://localhost:3001/api`，
即**网页从哪里打开都会去找本机的 3001 端口**。因此：

- 本地开发：先 `npm run dev:api`，再 `npm run dev:web`，功能完整。
- 只看已构建的静态站（`dist/`，已部署在 `genes.uichain.org`）：
  页面能打开，但**必须本机同时跑着 API 服务**才有基因/行情/分析数据，
  否则所有请求都会失败。要部署到线上，需把 `API_BASE` 改成可配置
  （如 Vite 的 `import.meta.env.VITE_API_BASE`）并把后端一起部署。
