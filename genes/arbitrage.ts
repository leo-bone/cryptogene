// ============================================
// 套利基因 - 跨交易所价差检测
// ============================================

import { BaseGene, MarketContext, GeneResult, TradeSignal, GeneType } from './base.js';

export class ArbitrageGene extends BaseGene {
  id = 'arbitrage-spread-v1';
  name = '跨交易所套利基因';
  type: GeneType = 'arbitrage';
  version = '1.0.0';
  description = '检测不同交易所间的价差，发现无风险套利机会';

  analyze(context: MarketContext): GeneResult {
    const startTime = Date.now();

    // 获取各交易所价格
    const prices = context.prices;

    if (prices.length < 2) {
      return {
        geneId: this.id,
        success: false,
        recommendation: '数据不足，无法进行套利分析',
        confidence: 0,
        executionTime: Date.now() - startTime
      };
    }

    // 找出最高价和最低价
    let maxPrice = { exchange: '', price: 0 };
    let minPrice = { exchange: '', price: Infinity };

    for (const p of prices) {
      if (p.price > maxPrice.price) {
        maxPrice = { exchange: p.exchange, price: p.price };
      }
      if (p.price < minPrice.price) {
        minPrice = { exchange: p.exchange, price: p.price };
      }
    }

    // 计算价差
    const spread = maxPrice.price - minPrice.price;
    const spreadPercent = (spread / minPrice.price) * 100;
    const fees = 0.1; // 手续费约 0.1%
    const netSpread = spreadPercent - fees * 2;

    // 生成信号
    let signal: TradeSignal | undefined;
    let recommendation: string;

    if (netSpread > 0.5) {
      recommendation = `发现套利机会！${minPrice.exchange} 买入，${maxPrice.exchange} 卖出，预期收益 ${netSpread.toFixed(2)}%`;
      signal = {
        action: 'buy',
        target: context.symbol,
        exchange: minPrice.exchange,
        price: minPrice.price,
        riskLevel: 'low'
      };
      this.incrementRun(true);
    } else if (netSpread > 0) {
      recommendation = `价差 ${spreadPercent.toFixed(2)}% 可覆盖成本，但利润较薄`;
      signal = {
        action: 'hold',
        riskLevel: 'medium'
      };
      this.incrementRun(true);
    } else {
      recommendation = `无套利机会，价差 ${spreadPercent.toFixed(2)}% 不足以覆盖手续费`;
      signal = {
        action: 'hold',
        riskLevel: 'low'
      };
      this.incrementRun(true);
    }

    return {
      geneId: this.id,
      success: true,
      signal,
      metrics: {
        spreadPercent,
        netSpread,
        buyExchange: minPrice.exchange,
        sellExchange: maxPrice.exchange,
        buyPrice: minPrice.price,
        sellPrice: maxPrice.price
      },
      recommendation,
      confidence: Math.min(netSpread / 2, 1),
      executionTime: Date.now() - startTime
    };
  }
}
