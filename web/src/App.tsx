import { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, Activity, Award, Zap, Shield, RefreshCw, ChevronRight, DollarSign, BarChart3, Bell } from 'lucide-react';

// API 基础 URL
const API_BASE = 'http://localhost:3001/api';

interface Gene {
  id: string;
  name: string;
  type: string;
  fitness: number;
  runCount: number;
  successCount: number;
  description: string;
}

interface AnalysisResult {
  timestamp: number;
  symbol: string;
  winner: string;
  matches: Array<{
    geneId: string;
    fitness: number;
    wins: number;
    losses: number;
  }>;
  recommendations: string[];
}

function App() {
  const [symbol, setSymbol] = useState('BTCUSDT');
  const [genes, setGenes] = useState<Gene[]>([]);
  const [price, setPrice] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [priceHistory, setPriceHistory] = useState<any[]>([]);

  // 加载基因列表
  useEffect(() => {
    fetchGenes();
    fetchPrice(symbol);
  }, []);

  // 监听 symbol 变化
  useEffect(() => {
    if (symbol) {
      fetchPrice(symbol);
    }
  }, [symbol]);

  const fetchGenes = async () => {
    try {
      const res = await axios.get(`${API_BASE}/genes`);
      setGenes(res.data.genes);
    } catch (err) {
      console.error('Failed to fetch genes:', err);
    }
  };

  const fetchPrice = async (sym: string) => {
    try {
      const res = await axios.get(`${API_BASE}/price/${sym}`);
      setPrice(res.data);

      // 获取 K 线数据
      const klinesRes = await axios.get(`${API_BASE}/klines/${sym}`, {
        params: { limit: 24 }
      });
      setPriceHistory(klinesRes.data.prices.map((p: any, i: number) => ({
        time: `${i}h`,
        price: p.price,
        volume: p.volume
      })));
    } catch (err) {
      console.error('Failed to fetch price:', err);
    }
  };

  const runAnalysis = async () => {
    setAnalyzing(true);
    try {
      const res = await axios.post(`${API_BASE}/analyze`, { symbol });
      setResult(res.data.result);
    } catch (err) {
      console.error('Analysis failed:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const getGeneTypeIcon = (type: string) => {
    switch (type) {
      case 'arbitrage': return <Zap className="w-5 h-5 text-yellow-400" />;
      case 'signal': return <Activity className="w-5 h-5 text-green-400" />;
      case 'portfolio': return <BarChart3 className="w-5 h-5 text-blue-400" />;
      case 'risk': return <Shield className="w-5 h-5 text-red-400" />;
      default: return <Award className="w-5 h-5 text-purple-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* 头部 */}
      <header className="border-b border-slate-700 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center glow">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  CryptoGene
                </h1>
                <p className="text-xs text-slate-400">加密市场基因进化框架</p>
              </div>
            </div>

            {/* 交易对选择 */}
            <div className="flex items-center gap-4">
              <select
                value={symbol}
                onChange={(e) => setSymbol(e.target.value)}
                className="bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="BTCUSDT">BTC/USDT</option>
                <option value="ETHUSDT">ETH/USDT</option>
                <option value="BNBUSDT">BNB/USDT</option>
                <option value="SOLUSDT">SOL/USDT</option>
              </select>

              <button
                onClick={runAnalysis}
                disabled={analyzing}
                className="bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-2 rounded-lg font-medium flex items-center gap-2 hover:opacity-90 transition disabled:opacity-50"
              >
                {analyzing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                {analyzing ? '分析中...' : '运行竞技场'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* 价格概览 */}
        {price && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <div className="flex items-center gap-2 text-slate-400 mb-2">
                <DollarSign className="w-4 h-4" />
                <span className="text-sm">当前价格</span>
              </div>
              <p className="text-3xl font-bold">${price.price.toLocaleString()}</p>
              <div className={`flex items-center gap-1 mt-2 ${price.changePercent24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {price.changePercent24h >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                <span>{price.changePercent24h.toFixed(2)}%</span>
              </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <div className="flex items-center gap-2 text-slate-400 mb-2">
                <Activity className="w-4 h-4" />
                <span className="text-sm">24h 成交量</span>
              </div>
              <p className="text-3xl font-bold">{(price.volume / 1000000).toFixed(2)}M</p>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <div className="flex items-center gap-2 text-slate-400 mb-2">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm">24h 高</span>
              </div>
              <p className="text-3xl font-bold text-green-400">${price.high24h.toLocaleString()}</p>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <div className="flex items-center gap-2 text-slate-400 mb-2">
                <TrendingDown className="w-4 h-4" />
                <span className="text-sm">24h 低</span>
              </div>
              <p className="text-3xl font-bold text-red-400">${price.low24h.toLocaleString()}</p>
            </div>
          </div>
        )}

        {/* 价格图表 */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-400" />
            价格走势 (24h)
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={priceHistory}>
                <XAxis dataKey="time" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Line
                  type="monotone"
                  dataKey="price"
                  stroke="#6366f1"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 基因列表 */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-400" />
              基因库
            </h2>
            <div className="space-y-4">
              {genes.map((gene) => (
                <div
                  key={gene.id}
                  className={`bg-slate-700/50 rounded-lg p-4 border ${
                    result?.winner === gene.id ? 'border-yellow-400/50 glow' : 'border-slate-600'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getGeneTypeIcon(gene.type)}
                      <div>
                        <h3 className="font-medium">{gene.name}</h3>
                        <p className="text-xs text-slate-400">{gene.id}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-indigo-400">{gene.fitness.toFixed(1)}</div>
                      <div className="text-xs text-slate-400">适应度</div>
                    </div>
                  </div>
                  <p className="text-sm text-slate-300 mb-3">{gene.description}</p>
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span>运行 {gene.runCount} 次</span>
                    <span>成功 {gene.successCount} 次</span>
                    <span>胜率 {gene.runCount > 0 ? ((gene.successCount / gene.runCount) * 100).toFixed(1) : 0}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 竞技场结果 */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-400" />
              竞技场结果
            </h2>

            {result ? (
              <div className="space-y-6">
                {/* 排名 */}
                <div>
                  <h3 className="text-sm text-slate-400 mb-3">基因排名</h3>
                  <div className="space-y-2">
                    {result.matches.map((match, i) => {
                      const gene = genes.find(g => g.id === match.geneId);
                      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉';
                      return (
                        <div key={match.geneId} className="flex items-center gap-3 bg-slate-700/30 rounded-lg p-3">
                          <span className="text-2xl">{medal}</span>
                          <div className="flex-1">
                            <div className="font-medium">{gene?.name || match.geneId}</div>
                            <div className="text-xs text-slate-400">
                              胜 {match.wins} / 负 {match.losses}
                            </div>
                          </div>
                          <div className="text-xl font-bold text-indigo-400">{match.fitness.toFixed(1)}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 建议 */}
                <div>
                  <h3 className="text-sm text-slate-400 mb-3 flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    投资建议
                  </h3>
                  <div className="space-y-2">
                    {result.recommendations.map((rec, i) => (
                      <div key={i} className="bg-slate-700/30 rounded-lg p-3 text-sm">
                        {rec}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                <Activity className="w-12 h-12 mb-4 opacity-50" />
                <p>点击"运行竞技场"开始分析</p>
              </div>
            )}
          </div>
        </div>

        {/* 订阅计划 */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-center mb-8">订阅计划</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold mb-2">Free</h3>
                <div className="text-4xl font-bold">$0</div>
                <p className="text-slate-400">永久免费</p>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2 text-slate-300">
                  <ChevronRight className="w-4 h-4 text-green-400" />
                  基础信号基因
                </li>
                <li className="flex items-center gap-2 text-slate-300">
                  <ChevronRight className="w-4 h-4 text-green-400" />
                  每小时更新
                </li>
                <li className="flex items-center gap-2 text-slate-300">
                  <ChevronRight className="w-4 h-4 text-green-400" />
                  10次分析/天
                </li>
              </ul>
              <button className="w-full py-2 border border-slate-600 rounded-lg hover:bg-slate-700 transition">
                立即使用
              </button>
            </div>

            <div className="bg-gradient-to-b from-indigo-900/50 to-purple-900/50 border border-indigo-500/50 rounded-xl p-6 relative glow">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-500 px-3 py-1 rounded-full text-xs font-medium">
                最受欢迎
              </div>
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold mb-2">Pro</h3>
                <div className="text-4xl font-bold">$29<span className="text-lg text-slate-400">/月</span></div>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2 text-slate-300">
                  <ChevronRight className="w-4 h-4 text-green-400" />
                  全部基因
                </li>
                <li className="flex items-center gap-2 text-slate-300">
                  <ChevronRight className="w-4 h-4 text-green-400" />
                  实时更新
                </li>
                <li className="flex items-center gap-2 text-slate-300">
                  <ChevronRight className="w-4 h-4 text-green-400" />
                  无限分析
                </li>
                <li className="flex items-center gap-2 text-slate-300">
                  <ChevronRight className="w-4 h-4 text-green-400" />
                  API 访问
                </li>
              </ul>
              <button className="w-full py-2 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg font-medium hover:opacity-90 transition">
                升级 Pro
              </button>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold mb-2">Enterprise</h3>
                <div className="text-4xl font-bold">$99<span className="text-lg text-slate-400">/月</span></div>
              </div>
              <ul className="space-y-3 mb-6">
                <li className="flex items-center gap-2 text-slate-300">
                  <ChevronRight className="w-4 h-4 text-green-400" />
                  Pro 全部功能
                </li>
                <li className="flex items-center gap-2 text-slate-300">
                  <ChevronRight className="w-4 h-4 text-green-400" />
                  私有部署
                </li>
                <li className="flex items-center gap-2 text-slate-300">
                  <ChevronRight className="w-4 h-4 text-green-400" />
                  定制基因
                </li>
                <li className="flex items-center gap-2 text-slate-300">
                  <ChevronRight className="w-4 h-4 text-green-400" />
                  专属支持
                </li>
              </ul>
              <button className="w-full py-2 border border-slate-600 rounded-lg hover:bg-slate-700 transition">
                联系销售
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* 页脚 */}
      <footer className="border-t border-slate-700 mt-12 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-slate-400">
          <p>© 2024 CryptoGene. 加密市场基因进化框架</p>
          <p className="text-sm mt-2">Powered by AI | Built with Evolution</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
