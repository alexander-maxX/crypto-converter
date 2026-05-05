import { useState, useEffect } from 'react';
import './App.css';

const CRYPTO_OPTIONS = [
  { id: 'BTC', name: 'Bitcoin', symbol: '₿' },
  { id: 'ETH', name: 'Ethereum', symbol: 'Ξ' },
  { id: 'USDT', name: 'Tether', symbol: '₮' },
  { id: 'BNB', name: 'BNB', symbol: '◈' },
  { id: 'SOL', name: 'Solana', symbol: '◎' },
  { id: 'USDC', name: 'USD Coin', symbol: '$' },
  { id: 'XRP', name: 'Ripple', symbol: '✕' },
  { id: 'DOGE', name: 'Dogecoin', symbol: 'Ð' },
  { id: 'TON', name: 'Toncoin', symbol: '💎' },
  { id: 'ADA', name: 'Cardano', symbol: '₳' },
  { id: 'TRX', name: 'TRON', symbol: '⊤' },
  { id: 'AVAX', name: 'Avalanche', symbol: '🔺' },
  { id: 'DOT', name: 'Polkadot', symbol: '●' },
  { id: 'MATIC', name: 'Polygon', symbol: '⬡' },
  { id: 'LTC', name: 'Litecoin', symbol: 'Ł' }
];

const FIAT_OPTIONS = ['USD', 'EUR', 'BYN', 'RUB'];

export default function App() {
  const [prices, setPrices] = useState({});
  const [amount, setAmount] = useState('1');
  const [fromCrypto, setFromCrypto] = useState('BTC');
  const [toFiat, setToFiat] = useState('BYN');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('crypto_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        setLoading(true);
        setError(null);
        const cryptos = CRYPTO_OPTIONS.map(c => c.id).join(',');
        const fiats = FIAT_OPTIONS.join(',');
        const res = await fetch(
          `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${cryptos}&tsyms=${fiats}`
        );
        if (!res.ok) throw new Error('Ошибка сети');
        const data = await res.json();
        setPrices(data);
      } catch (err) {
        console.warn('API недоступен, используем демо-данные:', err.message);
        const demoPrices = {};
        CRYPTO_OPTIONS.forEach(c => {
          demoPrices[c.id] = {
            USD: c.id === 'BTC' ? 65000 : c.id === 'ETH' ? 3200 : c.id === 'USDT' || c.id === 'USDC' ? 1 : 100,
            EUR: c.id === 'BTC' ? 60000 : c.id === 'ETH' ? 2950 : c.id === 'USDT' || c.id === 'USDC' ? 0.92 : 92,
            BYN: c.id === 'BTC' ? 2115000 : c.id === 'ETH' ? 104000 : c.id === 'USDT' || c.id === 'USDC' ? 3.25 : 3250,
            RUB: c.id === 'BTC' ? 6500000 : c.id === 'ETH' ? 320000 : c.id === 'USDT' || c.id === 'USDC' ? 100 : 10000
          };
        });
        setPrices(demoPrices);
        setError('⚠️ Используем демо-данные (API временно недоступен)');
      } finally {
        setLoading(false);
      }
    };
    fetchPrices();
  }, []);

  const price = prices[fromCrypto]?.[toFiat] || 0;
  const numericAmount = parseFloat(amount) || 0;
  const result = numericAmount * price;
  const formattedResult = toFiat === 'BYN' || toFiat === 'RUB' ? result.toFixed(2) : result.toFixed(4);

  const saveToHistory = () => {
    if (numericAmount <= 0) return;
    const entry = {
      amount: numericAmount,
      from: fromCrypto,
      to: toFiat,
      result: formattedResult,
      date: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    };
    const updated = [entry, ...history].slice(0, 10);
    setHistory(updated);
    localStorage.setItem('crypto_history', JSON.stringify(updated));
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('crypto_history');
  };

  return (
    <div className="app">
      <header className="header">
        <h1>🌍 Crypto Converter</h1>
        <p>Конвертация криптовалют в фиат в реальном времени</p>
      </header>

      <main className="card">
        {error && <div className="alert error">{error}</div>}
        
        <div className="converter-grid">
          <div className="input-group">
            <label>💰 Сумма</label>
            <input 
              type="number" 
              value={amount} 
              onChange={(e) => setAmount(e.target.value)}
              min="0"
              step="any"
              placeholder="0.00"
            />
          </div>

          <div className="input-group">
            <label>📤 Из (крипта)</label>
            <select value={fromCrypto} onChange={(e) => setFromCrypto(e.target.value)}>
              {CRYPTO_OPTIONS.map(c => (
                <option key={c.id} value={c.id}>{c.id} — {c.name}</option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label>📥 В (фиат)</label>
            <select value={toFiat} onChange={(e) => setToFiat(e.target.value)}>
              {FIAT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
        </div>

        <div className="result-box">
          {loading ? 'Загрузка курсов...' : (
            <>
              <span className="result-label">Результат конвертации:</span>
              <span className="result-value">
                {numericAmount > 0 ? `${formattedResult} ${toFiat}` : '—'}
              </span>
              <div className="button-group">
                <button className="btn-save" onClick={saveToHistory} disabled={numericAmount <= 0 || loading}>
                  💾 Сохранить
                </button>
                <button className="btn-reset" onClick={() => {setAmount('1'); setFromCrypto('BTC'); setToFiat('BYN');}}>
                  🔄 Сброс
                </button>
              </div>
            </>
          )}
        </div>
      </main>

      {history.length > 0 && (
        <section className="history">
          <div className="history-header">
            <h2>📜 История операций</h2>
            <button className="btn-clear" onClick={clearHistory}>
              🗑️ Очистить
            </button>
          </div>
          <ul>
            {history.map((item, i) => (
              <li key={i}>
                <span className="hist-amount">{item.amount} {item.from}</span>
                <span className="arrow">→</span>
                <span className="hist-result">{item.result} {item.to}</span>
                <span className="hist-time">{item.date}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer className="footer">
        <p>Данные: CryptoCompare API • {new Date().toLocaleDateString('ru-RU')}</p>
        <p>Портфолио-проект | React + Vite + LocalStorage</p>
      </footer>
    </div>
  );
}