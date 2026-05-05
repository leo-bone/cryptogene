// ============================================
// CryptoGene CLI 工具
// ============================================

import { Command } from 'commander';
import chalk from 'chalk';
import figlet from 'figlet';
import axios from 'axios';
import {
  Arena,
  MarketContext,
  PriceData,
  ArbitrageGene,
  SignalGene,
  PortfolioGene,
  RiskGene
} from '../genes/index.ts';

const program = new Command();
const API_BASE = 'http://localhost:3001/api';

// 打印标题
console.log(chalk.cyan(figlet.textSync('CryptoGene', { font: 'Small' })));
console.log(chalk.gray('═'.repeat(50)));
console.log(chalk.cyan('  加密市场基因进化框架 - CLI 工具'));
console.log(chalk.gray('═'.repeat(50)));
console.log();

// ============================================
// 命令：列表基因
// ============================================

program
  .command('genes')
  .description('列出所有可用基因')
  .action(async () => {
    try {
      const res = await axios.get(`${API_BASE}/genes`);
      const genes = res.data.genes;

      console.log(chalk.yellow('\n🧬 基因库\n'));

      genes.forEach((gene: any, i: number) => {
        console.log(chalk.white(`${i + 1}. ${gene.name}`));
        console.log(chalk.gray(`   ID: ${gene.id}`));
        console.log(chalk.gray(`   类型: ${gene.type}`));
        console.log(chalk.gray(`   适应度: ${gene.fitness.toFixed(2)}`));
        console.log(chalk.gray(`   描述: ${gene.description}`));
        console.log();
      });
    } catch (err) {
      console.log(chalk.red('❌ 无法连接到 API 服务器'));
      console.log(chalk.gray('请先运行: npm run dev:api'));
    }
  });

// ============================================
// 命令：排名
// ============================================

program
  .command('ranking')
  .description('显示基因排名')
  .action(async () => {
    try {
      const res = await axios.get(`${API_BASE}/ranking`);
      const ranking = res.data.ranking;

      console.log(chalk.yellow('\n🏆 基因排名\n'));

      ranking.forEach((match: any, i: number) => {
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '  ';
        console.log(`${medal} ${chalk.white(match.geneId)}`);
        console.log(chalk.gray(`   适应度: ${match.fitness.toFixed(2)} | 胜: ${match.wins} | 负: ${match.losses}`));
        console.log();
      });
    } catch (err) {
      console.log(chalk.red('❌ 无法连接到 API 服务器'));
    }
  });

// ============================================
// 命令：分析
// ============================================

program
  .command('analyze <symbol>')
  .description('分析指定交易对')
  .action(async (symbol: string) => {
    try {
      console.log(chalk.yellow(`\n🔍 分析 ${symbol}...\n`));

      const res = await axios.post(`${API_BASE}/analyze`, { symbol: symbol.toUpperCase() });
      const result = res.data.result;

      console.log(chalk.green('✅ 分析完成\n'));

      // 显示排名
      console.log(chalk.yellow('🏆 竞技场结果:'));
      result.matches.forEach((match: any, i: number) => {
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉';
        console.log(`${medal} ${chalk.white(match.geneId)}: ${match.fitness.toFixed(2)}分`);
      });

      console.log();

      // 显示建议
      console.log(chalk.yellow('📊 投资建议:'));
      result.recommendations.forEach((rec: string) => {
        console.log(chalk.gray(`  • ${rec}`));
      });

      console.log();
    } catch (err) {
      console.log(chalk.red('❌ 分析失败'));
    }
  });

// ============================================
// 命令：价格
// ============================================

program
  .command('price <symbol>')
  .description('查询交易对价格')
  .action(async (symbol: string) => {
    try {
      const res = await axios.get(`${API_BASE}/price/${symbol.toUpperCase()}`);
      const price = res.data;

      console.log(chalk.yellow(`\n💰 ${symbol} 价格\n`));
      console.log(chalk.white(`  当前价格: $${price.price.toLocaleString()}`));
      console.log(chalk[price.changePercent24h >= 0 ? 'green' : 'red'](
        `  24h 变化: ${price.changePercent24h >= 0 ? '+' : ''}${price.changePercent24h.toFixed(2)}%`
      ));
      console.log(chalk.gray(`  24h 高: $${price.high24h.toLocaleString()}`));
      console.log(chalk.gray(`  24h 低: $${price.low24h.toLocaleString()}`));
      console.log(chalk.gray(`  24h 成交量: ${(price.volume / 1000000).toFixed(2)}M`));
      console.log();
    } catch (err) {
      console.log(chalk.red('❌ 价格查询失败'));
    }
  });

// ============================================
// 命令：订阅计划
// ============================================

program
  .command('plans')
  .description('显示订阅计划')
  .action(async () => {
    try {
      const res = await axios.get(`${API_BASE}/plans`);
      const plans = res.data.plans;

      console.log(chalk.yellow('\n💎 订阅计划\n'));

      Object.entries(plans).forEach(([key, plan]: [string, any]) => {
        console.log(chalk.white(`${plan.name} - $${plan.price}${plan.price > 0 ? '/月' : ''}`));
        plan.features.forEach((f: string) => {
          console.log(chalk.gray(`  ✓ ${f}`));
        });
        console.log();
      });
    } catch (err) {
      console.log(chalk.red('❌ 无法获取订阅计划'));
    }
  });

// ============================================
// 命令：本地分析（无需 API）
// ============================================

program
  .command('local <symbol>')
  .description('本地分析（无需 API 服务器）')
  .action((symbol: string) => {
    console.log(chalk.yellow(`\n🔍 本地分析 ${symbol}...\n`));

    // 创建竞技场
    const arena = new Arena();

    // 生成模拟数据
    const prices: PriceData[] = [];
    let currentPrice = symbol.includes('BTC') ? 50000 : symbol.includes('ETH') ? 3000 : 100;

    for (let i = 0; i < 100; i++) {
      currentPrice *= (1 + (Math.random() - 0.5) * 0.03);
      prices.push({
        exchange: 'Binance',
        price: currentPrice,
        volume: Math.random() * 1000,
        timestamp: Date.now() - (100 - i) * 3600000
      });
    }

    const context: MarketContext = {
      symbol: symbol.toUpperCase(),
      prices,
      volume: Math.random() * 1000000,
      timestamp: Date.now()
    };

    // 运行分析
    const result = arena.run(context);

    console.log(chalk.green('\n✅ 分析完成'));
    console.log();
  });

// ============================================
// 帮助信息
// ============================================

program.on('--help', () => {
  console.log();
  console.log(chalk.cyan('使用示例:'));
  console.log(chalk.gray('  $ cryptogene genes          # 列出所有基因'));
  console.log(chalk.gray('  $ cryptogene ranking         # 显示基因排名'));
  console.log(chalk.gray('  $ cryptogene analyze BTCUSDT # 分析 BTC'));
  console.log(chalk.gray('  $ cryptogene price ETHUSDT  # 查询 ETH 价格'));
  console.log(chalk.gray('  $ cryptogene local BTCUSDT  # 本地分析（无需 API）'));
  console.log();
});

// 解析命令
program.parse(process.argv);
