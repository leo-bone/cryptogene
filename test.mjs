// ============================================
// CryptoGene - 简单测试脚本
// ============================================

console.log('\n🧬 CryptoGene 测试\n');
console.log('═'.repeat(50));

// 模拟基因数据
const genes = [
  {
    id: 'arbitrage-spread-v1',
    name: '跨交易所套利基因',
    type: 'arbitrage',
    fitness: 52.3,
    runCount: 45,
    successCount: 28
  },
  {
    id: 'signal-macd-rsi-v1',
    name: '技术信号基因',
    type: 'signal',
    fitness: 48.7,
    runCount: 120,
    successCount: 65
  },
  {
    id: 'portfolio-risk-parity-v1',
    name: '组合优化基因',
    type: 'portfolio',
    fitness: 55.1,
    runCount: 35,
    successCount: 20
  },
  {
    id: 'risk-kelly-position-v1',
    name: '风险控制基因',
    type: 'risk',
    fitness: 61.4,
    runCount: 200,
    successCount: 145
  }
];

// 模拟价格数据
const mockPrices = [];
let basePrice = 50000;
for (let i = 0; i < 100; i++) {
  basePrice *= (1 + (Math.random() - 0.5) * 0.03);
  mockPrices.push({
    exchange: 'Binance',
    price: basePrice,
    volume: Math.random() * 1000000,
    timestamp: Date.now() - (100 - i) * 3600000
  });
}

// 显示基因库
console.log('\n📊 基因库\n');
genes.forEach((gene, i) => {
  const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '  ';
  const winRate = ((gene.successCount / gene.runCount) * 100).toFixed(1);
  console.log(`${medal} ${gene.name}`);
  console.log(`   ID: ${gene.id}`);
  console.log(`   适应度: ${gene.fitness.toFixed(1)} | 胜率: ${winRate}%`);
  console.log();
});

// 模拟分析结果
console.log('\n🏟️ 竞技场分析 (BTCUSDT)\n');
console.log('当前价格: $' + basePrice.toLocaleString());

const currentPrice = mockPrices[mockPrices.length - 1].price;
const change24h = ((currentPrice - mockPrices[0].price) / mockPrices[0].price * 100).toFixed(2);
console.log(`24h 变化: ${change24h >= 0 ? '+' : ''}${change24h}%`);
console.log();

// 生成建议
console.log('📋 投资建议:');
console.log('  • [风险控制] 当前波动率较高，建议仓位控制在 30% 以内');
console.log('  • [技术信号] RSI 处于中性区域，建议观望');
console.log('  • [组合优化] 建议增持 BNB 和稳定币比例');
console.log('  • [套利] 当前无明显跨交易所套利机会');
console.log();

// 排名
console.log('🏆 基因排名:');
const ranking = [...genes].sort((a, b) => b.fitness - a.fitness);
ranking.forEach((gene, i) => {
  const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉';
  console.log(`  ${medal} ${gene.name}: ${gene.fitness.toFixed(1)}分`);
});

console.log('\n' + '═'.repeat(50));
console.log('✅ 测试完成!');
console.log('\n下一步:');
console.log('  1. 启动 API: npm run dev:api');
console.log('  2. 启动网页: npm run dev:web');
console.log();
