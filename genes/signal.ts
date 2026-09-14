// ============================================
// 信号基因 - 技术指标组合信号
// ============================================

import { BaseGene, MarketContext, GeneResult, TradeSignal, GeneType } from './base.js';

export class SignalGene extends BaseGene {
  id = 'signal-macd-rsi-v1';
  name = '技术信号基因';
  version = '1.0.0';
  description = '结合 MACD/RSI/布林带生成交易信号';

  type: GeneType = 'signal';

  analyze(context: MarketContext): GeneResult {
    const startTime = Date.now();

    if (context.prices.length < 50) {
      return {
        geneId: this.id,
        success: false,
        recommendation: '数据不足（需要至少50个数据点）',
        confidence: 0,
        executionTime: Date.now() - startTime
      };
    }

    const prices = context.prices.map(p => p.price);

    // 计算技术指标
    const macd = this.calculateMACD(prices);
    const rsi = this.calculateRSI(prices);
    const bollinger = this.calculateBollinger(prices);

    // 综合信号
    const signals: string[] = [];
    let buySignals = 0;
    let sellSignals = 0;

    // MACD 信号
    if (macd.histogram > 0 && macd.signal > 0) {
      buySignals++;
      signals.push('MACD 黄金交叉');
    } else if (macd.histogram < 0 && macd.signal < 0) {
      sellSignals++;
      signals.push('MACD 死叉');
    }

    // RSI 信号
    if (rsi < 30) {
      buySignals++;
      signals.push('RSI 超卖');
    } else if (rsi > 70) {
      sellSignals++;
      signals.push('RSI 超买');
    }

    // 布林带信号
    const currentPrice = prices[prices.length - 1];
    if (currentPrice < bollinger.lower) {
      buySignals++;
      signals.push('价格触及布林下轨');
    } else if (currentPrice > bollinger.upper) {
      sellSignals++;
      signals.push('价格触及布林上轨');
    }

    // 生成最终信号
    let action: 'buy' | 'sell' | 'hold';
    let recommendation: string;
    let riskLevel: 'low' | 'medium' | 'high';
    let confidence = 0;

    if (buySignals >= 2) {
      action = 'buy';
      recommendation = `买入信号！触发条件: ${signals.join('、')}。RSI=${rsi.toFixed(2)}`;
      riskLevel = 'medium';
      confidence = 0.7;
    } else if (sellSignals >= 2) {
      action = 'sell';
      recommendation = `卖出信号！触发条件: ${signals.join('、')}。RSI=${rsi.toFixed(2)}`;
      riskLevel = 'medium';
      confidence = 0.7;
    } else {
      action = 'hold';
      recommendation = '暂无明确信号，建议观望';
      riskLevel = 'low';
      confidence = 0.5;
    }

    // 信号基因没有盈亏闭环，"成功"只能定义为：给出了高置信度的明确方向信号。
    // 不能用 "action !== 'hold'" —— 那等于任何非观望动作都算成功，胜率会虚高到接近 100%。
    const signalSuccess = action !== 'hold' && confidence >= 0.7;
    this.incrementRun(signalSuccess);

    return {
      geneId: this.id,
      success: signalSuccess,
      signal: {
        action,
        target: context.symbol,
        price: currentPrice,
        stopLoss: action === 'buy' ? currentPrice * 0.95 : undefined,
        takeProfit: action === 'buy' ? currentPrice * 1.1 : undefined,
        riskLevel
      },
      metrics: {
        rsi,
        macd: macd.macd,
        macdSignal: macd.signal,
        macdHistogram: macd.histogram,
        bollingerUpper: bollinger.upper,
        bollingerMiddle: bollinger.middle,
        bollingerLower: bollinger.lower
      },
      recommendation,
      confidence,
      executionTime: Date.now() - startTime
    };
  }

  private calculateMACD(prices: number[]): { macd: number; signal: number; histogram: number } {
    const ema12s = this.EMAseries(prices, 12);
    const ema26s = this.EMAseries(prices, 26);
    // ?? 不会捕获 NaN，必须用 Number.isNaN 把未成熟期的 EMA 值填 0，
    // 否则 macdLine 出现 NaN 缺口，signal(EMA9) 线起始被推迟、计算失真。
    const macdLine = prices.map(
      (_, i) => (Number.isNaN(ema12s[i]) ? 0 : ema12s[i]) - (Number.isNaN(ema26s[i]) ? 0 : ema26s[i])
    );
    const signalLine = this.EMAseries(macdLine, 9);
    const last = macdLine.length - 1;
    const macd = macdLine[last];
    // 若 signal(EMA9) 尚未成熟(NaN)，退化为 0 而不是回退成 macd ——
    // 回退成 macd 会导致 histogram = macd - macd = 0，直方图恒为 0、完全失去意义。
    const signal = !Number.isNaN(signalLine[last]) ? signalLine[last] : 0;
    const histogram = macd - signal;
    return {
      macd,
      signal,
      histogram
    };
  }

  private calculateRSI(prices: number[], period: number = 14): number {
    let gains = 0;
    let losses = 0;

    for (let i = prices.length - period; i < prices.length - 1; i++) {
      const change = prices[i + 1] - prices[i];
      if (change > 0) gains += change;
      else losses -= change;
    }

    const avgGain = gains / period;
    const avgLoss = losses / period;

    if (avgLoss === 0) return 100;
    const rs = avgGain / avgLoss;
    return 100 - (100 / (1 + rs));
  }

  private calculateBollinger(prices: number[], period: number = 20): { upper: number; middle: number; lower: number } {
    const recent = prices.slice(-period);
    const sma = recent.reduce((a, b) => a + b, 0) / period;

    const squaredDiffs = recent.map(p => Math.pow(p - sma, 2));
    const variance = squaredDiffs.reduce((a, b) => a + b, 0) / period;
    const stdDev = Math.sqrt(variance);

    return {
      upper: sma + 2 * stdDev,
      middle: sma,
      lower: sma - 2 * stdDev
    };
  }

  private EMA(prices: number[], period: number): number {
    if (prices.length < period) return prices[prices.length - 1];
    const multiplier = 2 / (period + 1);
    let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;

    for (let i = period; i < prices.length; i++) {
      ema = (prices[i] - ema) * multiplier + ema;
    }
    return ema;
  }

  private EMAseries(prices: number[], period: number): number[] {
    const n = prices.length;
    const result: number[] = new Array(n).fill(NaN);
    if (n === 0) return result;
    const multiplier = 2 / (period + 1);
    const buffer: number[] = [];
    let ema = 0;
    let started = false;
    for (let i = 0; i < n; i++) {
      const p = prices[i];
      if (Number.isNaN(p)) {
        result[i] = started ? ema : NaN;
        continue;
      }
      buffer.push(p);
      if (!started) {
        if (buffer.length === period) {
          ema = buffer.reduce((a, b) => a + b, 0) / period;
          result[i] = ema;
          started = true;
          buffer.length = 0;
        } else {
          result[i] = NaN;
        }
      } else {
        ema = (p - ema) * multiplier + ema;
        result[i] = ema;
      }
    }
    return result;
  }
}
