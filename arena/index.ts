// ============================================
// CryptoGene - 竞技场模块
// ============================================

import {
  Gene,
  MarketContext,
  GeneResult,
  ArbitrageGene,
  SignalGene,
  PortfolioGene,
  RiskGene,
  GeneFactory,
  FitnessCalculator,
  PriceData
} from '../genes/index.ts';

export interface ArenaMatch {
  geneId: string;
  fitness: number;
  wins: number;
  losses: number;
  recentResults: boolean[];
}

export interface ArenaResult {
  timestamp: number;
  marketContext: MarketContext;
  matches: ArenaMatch[];
  winner: string;
  recommendations: string[];
}

/**
 * 竞技场 - 基因竞争的核心
 */
export class Arena {
  private genes: Map<string, Gene> = new Map();
  private history: ArenaResult[] = [];

  constructor() {
    this.registerDefaultGenes();
  }

  /**
   * 注册默认基因
   */
  private registerDefaultGenes(): void {
    this.registerGene(new ArbitrageGene());
    this.registerGene(new SignalGene());
    this.registerGene(new PortfolioGene());
    this.registerGene(new RiskGene());
  }

  /**
   * 注册新基因
   */
  registerGene(gene: Gene): void {
    this.genes.set(gene.id, gene);
    console.log(`✓ 注册基因: ${gene.name} (${gene.id})`);
  }

  /**
   * 运行竞技场
   */
  run(context: MarketContext): ArenaResult {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`🏟️  竞技场开始 - ${context.symbol}`);
    console.log(`${'='.repeat(50)}`);

    const matches: ArenaMatch[] = [];
    const recommendations: string[] = [];

    // 每个基因独立分析
    for (const [id, gene] of this.genes) {
      console.log(`\n📊 ${gene.name} 分析中...`);

      try {
        const result = gene.analyze(context);
        matches.push({
          geneId: id,
          fitness: gene.getFitness(),
          wins: gene.successCount,
          losses: gene.runCount - gene.successCount,
          recentResults: this.getRecentResults(gene)
        });

        if (result.recommendation) {
          recommendations.push(`[${gene.name}] ${result.recommendation}`);
        }

        // 显示结果
        if (result.signal) {
          console.log(`   信号: ${result.signal.action.toUpperCase()}`);
          console.log(`   置信度: ${(result.confidence * 100).toFixed(1)}%`);
        }
        console.log(`   适应度: ${gene.getFitness().toFixed(2)}`);

      } catch (error) {
        console.log(`   ❌ 分析失败: ${error}`);
        matches.push({
          geneId: id,
          fitness: gene.getFitness(),
          wins: gene.successCount,
          losses: gene.runCount - gene.successCount,
          recentResults: []
        });
      }
    }

    // 按适应度排序
    matches.sort((a, b) => b.fitness - a.fitness);

    const winner = matches[0].geneId;

    const result: ArenaResult = {
      timestamp: Date.now(),
      marketContext: context,
      matches,
      winner,
      recommendations
    };

    this.history.push(result);

    // 输出汇总
    console.log(`\n${'='.repeat(50)}`);
    console.log(`🏆 竞技场结果`);
    console.log(`${'='.repeat(50)}`);

    for (let i = 0; i < matches.length; i++) {
      const m = matches[i];
      const gene = this.genes.get(m.geneId);
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '  ';
      console.log(`${medal} ${gene?.name || m.geneId}: ${m.fitness.toFixed(2)}分`);
    }

    return result;
  }

  /**
   * 获取基因最近结果
   */
  private getRecentResults(gene: Gene): boolean[] {
    return [];
  }

  /**
   * 获取所有基因
   */
  getAllGenes(): Gene[] {
    return Array.from(this.genes.values());
  }

  /**
   * 获取基因排名
   */
  getRanking(): ArenaMatch[] {
    const matches: ArenaMatch[] = [];

    for (const [id, gene] of this.genes) {
      matches.push({
        geneId: id,
        fitness: gene.getFitness(),
        wins: gene.successCount,
        losses: gene.runCount - gene.successCount,
        recentResults: []
      });
    }

    return matches.sort((a, b) => b.fitness - a.fitness);
  }

  /**
   * 获取竞技场历史
   */
  getHistory(): ArenaResult[] {
    return this.history;
  }

  /**
   * 清除历史
   */
  clearHistory(): void {
    this.history = [];
  }
}

// ============================================
// 竞技场运行器
// ============================================

async function generateMockContext(symbol: string): Promise<MarketContext> {
  const basePrice = 50000 + Math.random() * 5000;

  const historicalPrices: PriceData[] = [];
  let currentPrice = basePrice * 0.9;

  for (let i = 0; i < 100; i++) {
    currentPrice *= (1 + (Math.random() - 0.5) * 0.05);
    historicalPrices.push({
      exchange: 'Binance',
      price: currentPrice,
      volume: Math.random() * 1000000,
      timestamp: Date.now() - (100 - i) * 60000
    });
  }

  return {
    symbol,
    prices: historicalPrices,
    volume: Math.random() * 1000000,
    timestamp: Date.now()
  };
}

// 主函数
async function main() {
  console.log('\n🧬 CryptoGene 竞技场启动\n');

  const arena = new Arena();
  const context = await generateMockContext('BTCUSDT');
  const result = arena.run(context);

  console.log('\n📈 最终排名:');
  const ranking = arena.getRanking();
  ranking.forEach((match, i) => {
    console.log(`  ${i + 1}. ${match.geneId}: ${match.fitness.toFixed(2)}分`);
  });
}

main().catch(console.error);
