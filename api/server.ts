// ============================================
// CryptoGene API Server
// ============================================

import express from 'express';
import cors from 'cors';
import { Arena, ArenaResult } from '../arena/index.ts';
import { MarketContext, PriceData, Gene } from '../genes/index.ts';
import axios from 'axios';

const app = express();
const PORT = process.env.PORT || 3001;

// api.binance.com is unreachable from mainland China and from a few corporate
// networks; data-api.binance.vision serves the same public market data.
const BINANCE_BASE =
  process.env.BINANCE_BASE || 'https://data-api.binance.vision';

// 中间件
app.use(cors());
app.use(express.json());

// 竞技场实例
const arena = new Arena();

// ============================================
// API 端点
// ============================================

/**
 * 健康检查
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

/**
 * 获取所有基因
 */
app.get('/api/genes', (req, res) => {
  const genes = arena.getAllGenes();
  res.json({
    genes: genes.map(g => ({
      id: g.id,
      name: g.name,
      type: g.type,
      version: g.version,
      fitness: g.getFitness(),
      runCount: g.runCount,
      successCount: g.successCount,
      description: g.description,
      metadata: g.getMetadata()
    }))
  });
});

/**
 * 获取基因排名
 */
app.get('/api/ranking', (req, res) => {
  res.json({ ranking: arena.getRanking() });
});

/**
 * 获取 Binance 实时价格
 */
app.get('/api/price/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const response = await axios.get(
      `${BINANCE_BASE}/api/v3/ticker/24hr`,
      { params: { symbol: symbol.toUpperCase() } }
    );

    res.json({
      symbol,
      price: parseFloat(response.data.lastPrice),
      change24h: parseFloat(response.data.priceChange),
      changePercent24h: parseFloat(response.data.priceChangePercent),
      high24h: parseFloat(response.data.highPrice),
      low24h: parseFloat(response.data.lowPrice),
      volume: parseFloat(response.data.volume)
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch price' });
  }
});

/**
 * 获取历史 K 线数据
 */
app.get('/api/klines/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const limit = parseInt(req.query.limit as string) || 100;

    const response = await axios.get(
      `${BINANCE_BASE}/api/v3/klines`,
      {
        params: {
          symbol: symbol.toUpperCase(),
          interval: '1h',
          limit
        }
      }
    );

    const prices = response.data.map((k: any[]) => ({
      exchange: 'Binance',
      price: parseFloat(k[4]), // close price
      volume: parseFloat(k[5]),
      timestamp: k[0]
    }));

    res.json({ symbol, prices });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch klines' });
  }
});

/**
 * 运行竞技场分析
 */
app.post('/api/analyze', async (req, res) => {
  try {
    const { symbol, prices } = req.body;

    const context: MarketContext = {
      symbol: symbol || 'BTCUSDT',
      prices: prices || [],
      volume: 0,
      timestamp: Date.now()
    };

    // 如果没有提供价格，尝试从 Binance 获取
    // NOTE: read context.prices, not the raw `prices` param — callers that omit
    // it pass undefined and `prices.length` throws before the fallback runs.
    if (!context.prices || context.prices.length === 0) {
      try {
        const klinesResponse = await axios.get(
          `${BINANCE_BASE}/api/v3/klines`,
          {
            params: {
              symbol: symbol?.toUpperCase() || 'BTCUSDT',
              interval: '1h',
              limit: 100
            }
          }
        );

        context.prices = klinesResponse.data.map((k: any[]) => ({
          exchange: 'Binance',
          price: parseFloat(k[4]),
          volume: parseFloat(k[5]),
          timestamp: k[0]
        }));
      } catch {
        // 使用模拟数据
        const mockPrices = generateMockPrices(100);
        context.prices = mockPrices;
      }
    }

    const result = arena.run(context);

    res.json({
      success: true,
      result: {
        timestamp: result.timestamp,
        symbol: result.marketContext.symbol,
        winner: result.winner,
        matches: result.matches,
        recommendations: result.recommendations
      }
    });
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: 'Analysis failed' });
  }
});

/**
 * 获取分析历史
 */
app.get('/api/history', (req, res) => {
  const history = arena.getHistory();
  res.json({ history });
});

/**
 * 订阅套餐
 */
const plans = {
  free: {
    name: 'Free',
    price: 0,
    features: ['基础信号基因', '每小时更新', '10次分析/天']
  },
  pro: {
    name: 'Pro',
    price: 29,
    period: 'month',
    features: ['全部基因', '实时更新', '无限分析', 'API访问', '优先支持']
  },
  enterprise: {
    name: 'Enterprise',
    price: 99,
    period: 'month',
    features: ['Pro全部功能', '私有部署', '定制基因', '专属支持']
  }
};

app.get('/api/plans', (req, res) => {
  res.json({ plans });
});

// ============================================
// 辅助函数
// ============================================

function generateMockPrices(count: number): PriceData[] {
  const prices: PriceData[] = [];
  let currentPrice = 50000;

  for (let i = 0; i < count; i++) {
    currentPrice *= (1 + (Math.random() - 0.5) * 0.03);
    prices.push({
      exchange: 'Binance',
      price: currentPrice,
      volume: Math.random() * 1000,
      timestamp: Date.now() - (count - i) * 3600000
    });
  }

  return prices;
}

// ============================================
// 启动服务器
// ============================================

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🧬 CryptoGene API Server                           ║
║                                                       ║
║   运行中: http://localhost:${PORT}                       ║
║                                                       ║
║   端点:                                              ║
║   - GET  /api/health        健康检查                  ║
║   - GET  /api/genes         所有基因                  ║
║   - GET  /api/ranking       基因排名                  ║
║   - GET  /api/price/:symbol 价格数据                  ║
║   - GET  /api/klines/:symbol K线数据                 ║
║   - POST /api/analyze        运行分析                 ║
║   - GET  /api/history       分析历史                  ║
║   - GET  /api/plans         订阅套餐                  ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
  `);
});
