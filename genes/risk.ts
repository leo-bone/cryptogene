// ============================================
// 风险基因 - 仓位管理与止损
// ============================================

import { BaseGene, MarketContext, GeneResult, TradeSignal, GeneType, PriceData } from './base.js';

export class RiskGene extends BaseGene {
  id = 'risk-kelly-position-v1';
  name = '风险控制基因';
  version = '1.0.0';
  description = '基于凯利公式和风险预算的仓位管理';

  type: GeneType = 'risk';

  analyze(context: MarketContext): GeneResult {
    const startTime = Date.now();

    if (context.prices.length < 20) {
      return {
        geneId: this.id,
        success: false,
        recommendation: '数据不足，无法进行风险分析',
        confidence: 0,
        executionTime: Date.now() - startTime
      };
    }

    const prices = context.prices.map(p => p.price);
    const currentPrice = prices[prices.length - 1];

    // 计算风险指标
    const volatility = this.calculateVolatility(prices);
    const maxDrawdown = this.calculateMaxDrawdown(prices);
    const var_ = this.calculateVaR(prices, 0.95); // 95% VaR

    // 凯利公式计算最优仓位
    const winRate = 0.55; // 假设胜率 55%
    const avgWin = 0.05;  // 平均盈利 5%
    const avgLoss = 0.03; // 平均亏损 3%
    const kellyFraction = this.calculateKelly(winRate, avgWin, avgLoss);

    // 建议止损/止盈
    const stopLoss = currentPrice * (1 - 2 * volatility);
    const takeProfit = currentPrice * (1 + 3 * volatility);

    // 风险评估
    let riskLevel: 'low' | 'medium' | 'high';
    let recommendation: string;
    let positionSize: number;

    if (volatility > 0.1 || maxDrawdown > 0.2) {
      riskLevel = 'high';
      positionSize = kellyFraction * 0.5; // 减半
      recommendation = `高波动警告！建议仓位降至 ${(positionSize * 100).toFixed(1)}%，设置止损 ${stopLoss.toFixed(2)}`;
    } else if (volatility > 0.05) {
      riskLevel = 'medium';
      positionSize = kellyFraction * 0.75;
      recommendation = `中等风险，建议仓位 ${(positionSize * 100).toFixed(1)}%，止损 ${stopLoss.toFixed(2)}，止盈 ${takeProfit.toFixed(2)}`;
    } else {
      riskLevel = 'low';
      positionSize = kellyFraction;
      recommendation = `低波动环境，可正常仓位 ${(positionSize * 100).toFixed(1)}%，凯利建议 ${(kellyFraction * 100).toFixed(1)}%`;
    }

    this.incrementRun(true);

    return {
      geneId: this.id,
      success: true,
      signal: {
        action: 'hold',
        price: currentPrice,
        stopLoss,
        takeProfit,
        quantity: positionSize,
        riskLevel
      },
      metrics: {
        volatility: volatility * 100,
        maxDrawdown: maxDrawdown * 100,
        valueAtRisk: var_ * 100,
        kellyFraction: kellyFraction * 100,
        recommendedPosition: positionSize * 100,
        riskScore: this.calculateRiskScore(volatility, maxDrawdown, var_)
      },
      recommendation,
      confidence: 0.8,
      executionTime: Date.now() - startTime
    };
  }

  /**
   * 凯利公式：f = (bp - q) / b
   * f = 仓位比例, b = 赔率, p = 胜率, q = 败率
   */
  private calculateKelly(winRate: number, avgWin: number, avgLoss: number): number {
    const b = avgWin / avgLoss; // 赔率
    const p = winRate;
    const q = 1 - p;

    const kelly = (b * p - q) / b;

    // 限制在 0-1 之间，并折半（保守）
    return Math.max(0, Math.min(kelly * 0.5, 1));
  }

  /**
   * 计算历史波动率
   */
  private calculateVolatility(prices: number[]): number {
    const returns: number[] = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }

    const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
    const squaredDiffs = returns.map(r => Math.pow(r - mean, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / returns.length;

    return Math.sqrt(variance * 252); // 年化波动率
  }

  /**
   * 计算最大回撤
   */
  private calculateMaxDrawdown(prices: number[]): number {
    let maxPrice = prices[0];
    let maxDrawdown = 0;

    for (const price of prices) {
      if (price > maxPrice) {
        maxPrice = price;
      }
      const drawdown = (maxPrice - price) / maxPrice;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }

    return maxDrawdown;
  }

  /**
   * 计算 VaR (Value at Risk)
   */
  private calculateVaR(prices: number[], confidence: number): number {
    const returns: number[] = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
    }

    returns.sort((a, b) => a - b);
    const index = Math.floor((1 - confidence) * returns.length);

    return Math.abs(returns[index] || 0);
  }

  /**
   * 综合风险评分 (0-100)
   */
  private calculateRiskScore(volatility: number, maxDrawdown: number, var_: number): number {
    // 波动率风险 (0-40)
    const volScore = Math.min(volatility / 0.2 * 40, 40);

    // 回撤风险 (0-30)
    const ddScore = Math.min(maxDrawdown / 0.3 * 30, 30);

    // VaR 风险 (0-30)
    const varScore = Math.min(var_ / 0.1 * 30, 30);

    return volScore + ddScore + varScore;
  }
}
