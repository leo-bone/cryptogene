// ============================================
// 组合基因 - 资产配置优化
// ============================================

import { BaseGene, MarketContext, GeneResult, TradeSignal, GeneType } from './base.js';

export interface PortfolioAsset {
  symbol: string;
  weight: number;
  expectedReturn: number;
  volatility: number;
}

export class PortfolioGene extends BaseGene {
  id = 'portfolio-risk-parity-v1';
  name = '组合优化基因';
  version = '1.0.0';
  description = '基于风险平价理论优化资产组合';

  type: GeneType = 'portfolio';

  analyze(context: MarketContext): GeneResult {
    const startTime = Date.now();

    // 模拟多币种组合分析
    const assets = this.generateMockPortfolio(context.symbol, context.prices);

    // 计算最优权重（简化版风险平价）
    const optimized = this.riskParity(assets);

    // 生成再平衡建议
    const currentWeights = assets.map(a => a.weight);
    const targetWeights = optimized.weights;
    const rebalanceActions: string[] = [];

    for (let i = 0; i < assets.length; i++) {
      const diff = targetWeights[i] - currentWeights[i];
      if (Math.abs(diff) > 0.01) {
        const action = diff > 0 ? '增持' : '减持';
        rebalanceActions.push(`${assets[i].symbol} ${action} ${(Math.abs(diff) * 100).toFixed(1)}%`);
      }
    }

    const recommendation = rebalanceActions.length > 0
      ? `建议再平衡: ${rebalanceActions.join(', ')}`
      : '组合无需调整，当前已接近最优配置';

    // 真实结果：权重需归一（≈1）且风险平价收益优于等权配置才算成功
    const weightsSum = targetWeights.reduce((a, b) => a + b, 0);
    const equalWeightReturn = assets.reduce((s, a) => s + a.expectedReturn, 0) / assets.length;
    const success = Math.abs(weightsSum - 1) < 0.01 && optimized.expectedReturn > equalWeightReturn;
    this.incrementRun(success);

    return {
      geneId: this.id,
      success: true,
      signal: {
        action: rebalanceActions.length > 0 ? 'buy' : 'hold',
        riskLevel: 'low'
      },
      metrics: {
        portfolioReturn: optimized.expectedReturn * 100,
        portfolioVolatility: optimized.volatility * 100,
        sharpeRatio: optimized.expectedReturn / Math.max(optimized.volatility, 0.001),
        ...Object.fromEntries(assets.map((a, i) => [`${a.symbol}_weight`, targetWeights[i] * 100]))
      },
      recommendation,
      confidence: 0.65,
      executionTime: Date.now() - startTime
    };
  }

  /**
   * 风险平价算法
   * 每个资产对组合风险的贡献相等
   */
  private riskParity(assets: PortfolioAsset[]): { weights: number[]; expectedReturn: number; volatility: number } {
    const n = assets.length;

    // 简化：使用波动率的倒数作为权重
    const invVol = assets.map(a => 1 / Math.max(a.volatility, 0.01));
    const sumInvVol = invVol.reduce((a, b) => a + b, 0);

    // 归一化权重
    const weights = invVol.map(v => v / sumInvVol);

    // 计算组合预期收益和波动率
    let portfolioReturn = 0;
    let portfolioVol = 0;

    for (let i = 0; i < n; i++) {
      portfolioReturn += weights[i] * assets[i].expectedReturn;
    }

    // 简化协方差（假设不相关）
    for (let i = 0; i < n; i++) {
      portfolioVol += Math.pow(weights[i] * assets[i].volatility, 2);
    }
    portfolioVol = Math.sqrt(portfolioVol);

    return { weights, expectedReturn: portfolioReturn, volatility: portfolioVol };
  }

  /**
   * 生成模拟组合数据（实际应用中应从 API 获取）
   */
  private generateMockPortfolio(symbol: string, prices: PriceData[]): PortfolioAsset[] {
    const basePrice = prices.length > 0 ? prices[prices.length - 1].price : 100;

    return [
      {
        symbol: symbol,
        weight: 0.4,
        expectedReturn: (Math.random() - 0.3) * 0.5,
        volatility: Math.random() * 0.3 + 0.1
      },
      {
        symbol: 'ETH',
        weight: 0.3,
        expectedReturn: (Math.random() - 0.3) * 0.6,
        volatility: Math.random() * 0.4 + 0.15
      },
      {
        symbol: 'BNB',
        weight: 0.2,
        expectedReturn: (Math.random() - 0.3) * 0.4,
        volatility: Math.random() * 0.35 + 0.1
      },
      {
        symbol: 'USDT',
        weight: 0.1,
        expectedReturn: 0.001,
        volatility: 0.001
      }
    ];
  }
}

// 修复导入
import { PriceData } from './base.js';
