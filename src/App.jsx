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
  const [usdToBynRate, setUsdToBynRate] = useState(3.25); // Дефолтное значение
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

  // Получение курса USD/BYN с НБРБ (Национальный банк РБ)
  useEffect(() => {
    const fetchUsdToBynRate = async () => {
      try {
        // API НБРБ - официальный курс доллара        const res = await fetch('https://www.nbrb.by/api/exrates/rates/USD?parammode=2');
        if (res.ok) {
          const data = await res.json();
          setUsdToBynRate(data.Cur_OfficialRate);
        }
      } catch (err) {
        console.warn('Не удалось получить курс НБРБ, используем запасной API');
        // Запасной вариант - другой API
        try {
          const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
          if (res.ok) {
            const data = await res.json();
            if (data.rates.BYN) {
              setUsdToBynRate(data.rates.BYN);
            }
          }
        } catch (e) {
          console.error('Не удалось загрузить курс USD/BYN');
        }
      }
    };
    
    fetchUsdToBynRate();
    // Обновляем курс раз в час
    const intervalId = setInterval(fetchUsdToBynRate, 3600000);
    return () => clearInterval(intervalId);
  }, []);

  // Получение курсов криптовалют
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const cryptos = CRYPTO_OPTIONS.map(c => c.id).join(',');
        // Запрашиваем только USD, EUR, RUB (без BYN)
        const res = await fetch(
          `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${cryptos}&tsyms=USD,EUR,RUB`
        );
        
        if (!res.ok) throw new Error(`Ошибка API: ${res.status}`);
        
        const cryptoData = await res.json();
        
        // Проверяем валидность данных
        if (!cryptoData.BTC || typeof cryptoData.BTC.USD !== 'number') {
          throw new Error('Неверный формат данных');
        }
        // Добавляем расчет BYN через актуальный курс USD/BYN
        const pricesWithBYN = {};
        Object.keys(cryptoData).forEach(crypto => {
          pricesWithBYN[crypto] = {
            ...cryptoData[crypto],
            BYN: cryptoData[crypto].USD * usdToBynRate
          };
        });
        
        setPrices(pricesWithBYN);
      } catch (err) {
        console.error('API ошибка:', err.message);
        setError('⚠️ Не удалось загрузить курсы. Проверьте интернет-соединение.');
        setPrices({});
      } finally {
        setLoading(false);
      }
    };

    if (usdToBynRate > 0) {
      fetchPrices();
      // Обновляем курсы криптовалют каждые 30 секунд
      const intervalId = setInterval(fetchPrices, 30000);
      return () => clearInterval(intervalId);
    }
  }, [usdToBynRate]);

  const price = prices[fromCrypto]?.[toFiat] || 0;
  const numericAmount = parseFloat(amount) || 0;
  const result = numericAmount * price;
  const formattedResult = toFiat === 'BYN' || toFiat === 'RUB' ? result.toFixed(2) : result.toFixed(4);

  const saveToHistory = () => {
    if (numericAmount <= 0 || !price) return;
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
          {loading ? (
            <span className="result-label">Загрузка курсов...</span>
          ) : error ? (
            <>
              <span className="result-label" style={{ color: '#ef4444' }}>{error}</span>
              <button className="btn-reset" onClick={() => window.location.reload()}>
                🔄 Повторить попытку
              </button>            </>
          ) : (
            <>
              <span className="result-label">Результат конвертации:</span>
              <span className="result-value">
                {numericAmount > 0 && price ? `${formattedResult} ${toFiat}` : '—'}
              </span>
              {toFiat === 'BYN' && (
                <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.5rem' }}>
                  Курс USD/BYN: {usdToBynRate.toFixed(4)} (НБРБ)
                </div>
              )}
              <div className="button-group">
                <button className="btn-save" onClick={saveToHistory} disabled={numericAmount <= 0 || !price}>
                  💾 Сохранить
                </button>
                <button className="btn-reset" onClick={() => { setAmount('1'); setFromCrypto('BTC'); setToFiat('BYN'); }}>
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
        <p>Крипто: CryptoCompare API • USD/BYN: НБРБ • {new Date().toLocaleDateString('ru-RU')}</p>
        <p>Портфолио-проект | React + Vite + LocalStorage</p>
      </footer>    </div>
  );
}
