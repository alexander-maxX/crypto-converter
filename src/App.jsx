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

  // Загрузка истории
  useEffect(() => {
    const saved = localStorage.getItem('crypto_history');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error('Ошибка чтения истории:', e);
      }
    }
  }, []);

  // Получение курсов
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        setLoading(true);
        setError(null);        const cryptos = CRYPTO_OPTIONS.map(c => c.id).join(',');
        const fiats = FIAT_OPTIONS.join(',');
        
        const res = await fetch(
          `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${cryptos}&tsyms=${fiats}`
        );
        if (!res.ok) throw new Error('Ошибка сети');
        const data = await res.json();
        setPrices(data);
      } catch (err) {
        setError('⚠️ Не удалось загрузить курсы. Проверьте интернет.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPrices();
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, []);

  // Функция переключения (Реверс)
  const toggleDirection = () => {
    setAmount('1');
    setFromCrypto(toFiat);
    setToFiat(fromCrypto);
  };

  // Логика расчета
  const cryptoId = fromCrypto;
  const fiatId = toFiat;
  
  const rate = prices[cryptoId]?.[fiatId] || 0;
  
  let result = 0;
  let formattedResult = '';
  
  if (rate > 0 && amount) {
    const numAmount = parseFloat(amount);
    result = numAmount * rate;
    formattedResult = result.toFixed(2);
  }

  const saveToHistory = () => {
    if (!amount || result === 0) return;
    const entry = {
      from: fromCrypto,
      to: toFiat,
      amount: amount,
      result: formattedResult,      date: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    };
    const updated = [entry, ...history].slice(0, 10);
    setHistory(updated);
    localStorage.setItem('crypto_history', JSON.stringify(updated));
  };

  return (
    <div className="app">
      <header className="header">
        {/* Убрали эмодзи, теперь здесь только текст */}
        <h1>Crypto Converter</h1>
        <p>Конвертация криптовалют и фиата в реальном времени</p>
      </header>

      <main className="card">
        {error && <div className="alert error">{error}</div>}
        
        <div className="input-group" style={{ marginBottom: '1rem' }}>
          <label>Сумма:</label>
          <input 
            type="number" 
            value={amount} 
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
          />
        </div>

        <div className="converter-grid">
          <div className="input-group">
            <label>Из ({fromCrypto.length <= 3 ? 'Крипта' : 'Фиат'})</label>
            <select value={fromCrypto} onChange={(e) => setFromCrypto(e.target.value)}>
              {CRYPTO_OPTIONS.map(opt => (
                <option key={opt.id} value={opt.id}>{opt.id} — {opt.name}</option>
              ))}
              {FIAT_OPTIONS.map(opt => (
                <option key={opt.id} value={opt.id}>{opt.id} — {opt.name}</option>
              ))}
            </select>
          </div>

          <div className="input-group">
            <label>В ({toFiat.length <= 3 ? 'Фиат' : 'Крипта'})</label>
            <select value={toFiat} onChange={(e) => setToFiat(e.target.value)}>
              {FIAT_OPTIONS.map(opt => (
                <option key={opt.id} value={opt.id}>{opt.id} — {opt.name}</option>
              ))}
              {CRYPTO_OPTIONS.map(opt => (
                <option key={opt.id} value={opt.id}>{opt.id} — {opt.name}</option>
              ))}            </select>
          </div>
        </div>

        <div className="result-box">
          {loading ? 'Загрузка курсов...' : (
            <>
              <span className="result-label">Результат:</span>
              <span className="result-value">
                {amount > 0 ? `${formattedResult} ${toFiat}` : '—'}
              </span>
              <div className="button-group">
                <button className="btn-save" onClick={saveToHistory}>💾 Сохранить</button>
                <button className="btn-reset" onClick={() => { setAmount('1'); setFromCrypto('BTC'); setToFiat('BYN'); }}>🔄 Сброс</button>
              </div>
            </>
          )}
        </div>
      </main>

      {history.length > 0 && (
        <section className="history">
          <div className="history-header">
            <h2>📜 История</h2>
            <button className="btn-clear" onClick={() => { setHistory([]); localStorage.removeItem('crypto_history'); }}>🗑️</button>
          </div>
          <ul>
            {history.map((item, i) => (
              <li key={i}>
                <span className="hist-amount">{item.amount} {item.from}</span>
                <span className="arrow">→</span>
                <span className="hist-result">{item.result} {item.to}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
      
      <footer className="footer">
        <p>Данные: CryptoCompare API • {new Date().toLocaleDateString('ru-RU')}</p>
      </footer>
    </div>
  );
}
