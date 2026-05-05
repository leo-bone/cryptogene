// ============================================
// CryptoGene - 基因基类定义
// ============================================

/**
 * 基因接口 - 所有基因必须实现
 */
export interface Gene {
  id: string;                    // 基因唯一标识
  name: string;                  // 基因名称
  type: GeneType;                // 基因类型
  version: string;               // 版本号
  fitness: number;               // 适应度评分 (0-100)
  runCount: number;              // 运行次数
  successCount: number;          // 成功次数
  description: string;           // 基因描述

  // 核心方法
  analyze(context: MarketContext): GeneResult;
  getFitness(): number;
  incrementRun(success: boolean): void;
  getMetadata(): GeneMetadata;
}

export type GeneType = 'arbitrage' | 'signal' | 'portfolio' | 'risk';

export interface MarketContext {
  symbol: string;                // 交易对，如 BTCUSDT
  prices: PriceData[];           // 价格数据
  volume: number;                // 成交量
  timestamp: number;             // 时间戳
  exchange?: string;            // 交易所
}

export interface PriceData {
  exchange: string;
  price: number;
  volume: number;
  timestamp: number;
}

export interface GeneResult {
  geneId: string;
  success: boolean;
  signal?: TradeSignal;
  metrics?: Record<string, number>;
  recommendation: string;        // 分析建议
  confidence: number;           // 置信度 0-1
  executionTime: number;        // 执行耗时 ms
}

export interface TradeSignal {
  action: 'buy' | 'sell' | 'hold';
  target?: string;              // 目标交易对
  exchange?: string;            // 目标交易所
  price?: number;               // 建议价格
  quantity?: number;            // 建议数量
  stopLoss?: number;            // 止损价
  takeProfit?: number;          // 止盈价
  riskLevel: 'low' | 'medium' | 'high';
}

export interface GeneMetadata {
  author: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  performance: {
    winRate: number;
    avgProfit: number;
    maxDrawdown: number;
  };
}

/**
 * 基因工厂 - 管理基因注册和创建
 */
export class GeneFactory {
  private static genes: Map<string, new () => Gene> = new Map();

  static register(type: GeneType, geneClass: new () => Gene): void {
    const instance = new geneClass();
    this.genes.set(instance.id, geneClass);
  }

  static create(type: string): Gene | null {
    const GeneClass = this.genes.get(type);
    return GeneClass ? new GeneClass() : null;
  }

  static listGenes(): string[] {
    return Array.from(this.genes.keys());
  }
}

// ============================================
// 适应度计算器
// ============================================

export class FitnessCalculator {
  /**
   * 计算基因适应度
   * 公式: fitness = winRate * 50 + (avgProfit / maxDrawdown) * 30 + consistency * 20
   */
  static calculate(gene: Gene): number {
    const winRate = gene.successCount / Math.max(gene.runCount, 1);
    const consistency = this.calculateConsistency(gene);

    // 基础适应度
    let fitness = winRate * 50;

    // 考虑运行次数（运行越多越可靠）
    const reliability = Math.min(gene.runCount / 100, 1);
    fitness *= (0.5 + 0.5 * reliability);

    // 稳定性加分
    fitness += consistency * 10;

    return Math.min(Math.max(fitness, 0), 100);
  }

  private static calculateConsistency(gene: Gene): number {
    if (gene.runCount < 2) return 0.5;
    // 标准差越小，一致性越高
    const expected = gene.successCount / gene.runCount;
    const variance = expected * (1 - expected) / gene.runCount;
    return 1 - Math.sqrt(variance) * 10;
  }
}

// ============================================
// 基因基类
// ============================================

export abstract class BaseGene implements Gene {
  abstract id: string;
  abstract name: string;
  abstract type: GeneType;
  abstract version: string;
  abstract description: string;

  fitness: number = 50;
  runCount: number = 0;
  successCount: number = 0;

  abstract analyze(context: MarketContext): GeneResult;

  getFitness(): number {
    return this.fitness;
  }

  incrementRun(success: boolean): void {
    this.runCount++;
    if (success) this.successCount++;
    this.fitness = FitnessCalculator.calculate(this);
  }

  getMetadata(): GeneMetadata {
    return {
      author: 'CryptoGene Team',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: [this.type],
      performance: {
        winRate: this.runCount > 0 ? this.successCount / this.runCount : 0,
        avgProfit: 0,
        maxDrawdown: 0
      }
    };
  }
}
