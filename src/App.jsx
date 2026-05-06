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

// ИСПРАВЛЕНО: Теперь это массив объектов, как CRYPTO_OPTIONS
const FIAT_OPTIONS = [
  { id: 'USD', name: 'Доллар США', symbol: '$' },
  { id: 'EUR', name: 'Евро', symbol: '€' },
  { id: 'BYN', name: 'Белорусский рубль', symbol: 'Br' },
  { id: 'RUB', name: 'Российский рубль', symbol: '₽' },
];

export default function App() {
  const [prices, setPrices] = useState({});
  const [usdToBynRate, setUsdToBynRate] = useState(3.25);
  const [amount, setAmount] = useState('1');
  const [fromCurrency, setFromCurrency] = useState('BTC');
  const [toCurrency, setToCurrency] = useState('BYN');
  const [isReversed, setIsReversed] = useState(false);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Загрузка истории
  useEffect(() => {
    const saved = localStorage.getItem('crypto_history');
    if (saved) {
      try { setHistory(JSON.parse(saved)); } catch (e) {}
    }
  }, []);

  // Получение курса USD -> BYN
  useEffect(() => {    const fetchUsdRate = async () => {
      try {
        const res = await fetch('https://open.er-api.com/v6/latest/USD');
        if (res.ok) {
          const data = await res.json();
          if (data.rates && data.rates.BYN) {
            setUsdToBynRate(data.rates.BYN);
          }
        }
      } catch (err) {
        console.error('Не удалось загрузить курс BYN:', err);
      }
    };
    fetchUsdRate();
    const interval = setInterval(fetchUsdRate, 3600000);
    return () => clearInterval(interval);
  }, []);

  // Получение курсов криптовалют
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        setLoading(true);
        setError(null);
        const cryptos = CRYPTO_OPTIONS.map(c => c.id).join(',');
        
        const res = await fetch(
          `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${cryptos}&tsyms=USD,EUR,RUB`
        );
        
        if (!res.ok) throw new Error('Ошибка сети');
        const data = await res.json();
        setPrices(data);
      } catch (err) {
        setError('⚠️ Не удалось загрузить курсы. Проверьте интернет.');
        setPrices({});
      } finally {
        setLoading(false);
      }
    };
    fetchPrices();
    const interval = setInterval(fetchPrices, 30000);
    return () => clearInterval(interval);
  }, []);

  // Реверс
  const toggleDirection = () => {
    setIsReversed(!isReversed);
    setAmount('1');
  };
  // Определение списков
  const currentFromOptions = isReversed ? FIAT_OPTIONS : CRYPTO_OPTIONS;
  const currentToOptions = isReversed ? CRYPTO_OPTIONS : FIAT_OPTIONS;
  
  const currentFrom = isReversed ? toCurrency : fromCurrency;
  const currentTo = isReversed ? fromCurrency : toCurrency;

  // Математика
  const cryptoId = isReversed ? toCurrency : fromCurrency;
  const fiatId = isReversed ? fromCurrency : toCurrency;

  let price = prices[cryptoId]?.[fiatId];

  if (fiatId === 'BYN' && prices[cryptoId]?.['USD']) {
    price = prices[cryptoId]['USD'] * usdToBynRate;
  }

  const rate = price || 0;
  
  let result = 0;
  let formattedResult = '';
  
  if (rate > 0 && amount) {
    const numAmount = parseFloat(amount);
    if (isReversed) {
      result = numAmount / rate;
      formattedResult = result.toFixed(6);
    } else {
      result = numAmount * rate;
      formattedResult = result.toFixed(2);
    }
  }

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
    setAmount('1');    setFromCurrency('BTC');
    setToCurrency('BYN');
    setIsReversed(false);
  };

  return (
    <div className="app">
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
            <select value={currentFrom} onChange={(e) => isReversed ? setToCurrency(e.target.value) : setFromCurrency(e.target.value)}>
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
            <select value={currentTo} onChange={(e) => isReversed ? setFromCurrency(e.target.value) : setToCurrency(e.target.value)}>
              {currentToOptions.map(opt => (
                <option key={opt.id} value={opt.id}>{opt.id} — {opt.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="result-box">          {loading ? 'Загрузка курсов...' : (
            <>
              <span className="result-label">
                {isReversed ? 'Вы получите:' : 'Стоимость:'}
              </span>
              <span className="result-value">
                {amount > 0 ? `${formattedResult} ${currentTo}` : '—'}
              </span>
              
              {fiatId === 'BYN' && (
                <div className="rate-info">
                  Курс (через USD): 1 {cryptoId} ≈ {rate ? rate.toFixed(4) : 0} BYN
                </div>
              )}
              {fiatId !== 'BYN' && (
                <div className="rate-info">
                  Курс: 1 {cryptoId} ≈ {rate ? rate.toFixed(4) : 0} {fiatId}
                </div>
              )}
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
        <p>Крипто: CryptoCompare • USD/BYN: Open Exchange Rates • {new Date().toLocaleDateString('ru-RU')}</p>
      </footer>
    </div>  );
          }
