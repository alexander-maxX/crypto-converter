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

const FIAT_OPTIONS = [
  { id: 'USD', name: 'Доллар США', symbol: '$' },
  { id: 'EUR', name: 'Евро', symbol: '€' },
  { id: 'BYN', name: 'Белорусский рубль', symbol: 'Br' },
  { id: 'RUB', name: 'Российский рубль', symbol: '₽' },
];

export default function App() {
  const [prices, setPrices] = useState({});
  const [amount, setAmount] = useState('1');
  const [fromCrypto, setFromCrypto] = useState('BTC');
  const [toFiat, setToFiat] = useState('BYN');
  const [isReversed, setIsReversed] = useState(false);
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
        setError(null);
        const cryptos = CRYPTO_OPTIONS.map(c => c.id).join(',');
        const fiats = FIAT_OPTIONS.map(f => f.id).join(',');
        
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
    setIsReversed(!isReversed);
    setAmount('1');
  };

  // Определение текущих валют для отображения
  const currentFromOptions = isReversed ? FIAT_OPTIONS : CRYPTO_OPTIONS;
  const currentToOptions = isReversed ? CRYPTO_OPTIONS : FIAT_OPTIONS;
  const currentFrom = isReversed ? toFiat : fromCrypto;
  const currentTo = isReversed ? fromCrypto : toFiat;

  // Расчет курса
  const cryptoId = isReversed ? toFiat : fromCrypto;
  const fiatId = isReversed ? fromCrypto : toFiat;
  const rate = prices[cryptoId]?.[fiatId] || 0;
  
  let result = 0;
  let formattedResult = '';
  
  if (rate > 0 && amount) {    const numAmount = parseFloat(amount);
    if (isReversed) {
      // Фиат → Крипта (делим)
      result = numAmount / rate;
      formattedResult = result.toFixed(6);
    } else {
      // Крипта → Фиат (умножаем)
      result = numAmount * rate;
      formattedResult = result.toFixed(2);
    }
  }

  const handleFromChange = (value) => {
    if (isReversed) {
      setToFiat(value);
    } else {
      setFromCrypto(value);
    }
  };

  const handleToChange = (value) => {
    if (isReversed) {
      setFromCrypto(value);
    } else {
      setToFiat(value);
    }
  };

  const saveToHistory = () => {
    if (!amount || result === 0) return;
    const entry = {
      from: currentFrom,
      to: currentTo,
      amount: amount,
      result: formattedResult,
      date: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    };
    const updated = [entry, ...history].slice(0, 10);
    setHistory(updated);
    localStorage.setItem('crypto_history', JSON.stringify(updated));
  };

  const handleReset = () => {
    setAmount('1');
    setFromCrypto('BTC');
    setToFiat('BYN');
    setIsReversed(false);
  };

  return (    <div className="app">
      <header className="header">
        <h1>Crypto Converter</h1>
        <p>Конвертация криптовалют и фиата в реальном времени</p>
      </header>

      <main className="card">
        {error && <div className="alert error">{error}</div>}
        
        <div className="input-group" style={{ marginBottom: '1rem' }}>
          <label>Сумма {isReversed ? '(фиат)' : '(крипта)'}:</label>
          <input 
            type="number" 
            value={amount} 
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
          />
        </div>

        <div className="exchange-row">
          <div className="input-group">
            <label>{isReversed ? 'Имею (Фиат)' : 'Имею (Крипта)'}</label>
            <select value={currentFrom} onChange={(e) => handleFromChange(e.target.value)}>
              {currentFromOptions.map(opt => (
                <option key={opt.id} value={opt.id}>{opt.id} — {opt.name}</option>
              ))}
            </select>
          </div>

          <button className="btn-reverse" onClick={toggleDirection} title="Поменять направление">
            🔄
          </button>

          <div className="input-group">
            <label>{isReversed ? 'Получу (Крипта)' : 'Получу (Фиат)'}</label>
            <select value={currentTo} onChange={(e) => handleToChange(e.target.value)}>
              {currentToOptions.map(opt => (
                <option key={opt.id} value={opt.id}>{opt.id} — {opt.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="result-box">
          {loading ? 'Загрузка курсов...' : (
            <>
              <span className="result-label">
                {isReversed ? 'Вы получите:' : 'Стоимость:'}
              </span>
              <span className="result-value">                {amount > 0 ? `${formattedResult} ${currentTo}` : '—'}
              </span>
              <div className="rate-info">
                Курс: 1 {cryptoId} ≈ {rate ? (rate > 100 ? rate.toFixed(2) : rate.toFixed(4)) : 0} {fiatId}
              </div>
            </>
          )}
          <div className="button-group" style={{ marginTop: '1.5rem' }}>
            <button className="btn-save" onClick={saveToHistory}>💾 Сохранить</button>
            <button className="btn-reset" onClick={handleReset}>🔄 Сброс</button>
          </div>
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
