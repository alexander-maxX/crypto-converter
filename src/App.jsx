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
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error('Ошибка чтения истории:', e);
      }
    }
  }, []);
  // Получение курса USD/BYN с надежного источника
  useEffect(() => {
    const fetchUsdToBynRate = async () => {
      try {
        // Пробуем получить с API НБРБ (Национальный банк РБ)
        const res = await fetch('https://www.nbrb.by/api/exrates/rates/USD?parammode=2');
        if (res.ok) {
          const data = await res.json();
          setUsdToBynRate(data.Cur_OfficialRate);
          return;
        }
      } catch (err) {
        console.warn('Не удалось получить курс с НБРБ, пробуем другой API');
      }

      // Запасной вариант - другой API
      try {
        const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
        if (res.ok) {
          const data = await res.json();
          if (data.rates.BYN) {
            setUsdToBynRate(data.rates.BYN);
            return;
          }
        }
      } catch (err) {
        console.error('Не удалось загрузить курс USD/BYN');
      }
    };
    
    fetchUsdToBynRate();
    // Обновляем курс раз в час
    const intervalId = setInterval(fetchUsdToBynRate, 3600000);
    return () => clearInterval(intervalId);
  }, []);

  // Получение курсов криптовалют (только USD и EUR)
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const cryptos = CRYPTO_OPTIONS.map(c => c.id).join(',');
        // Запрашиваем только USD и EUR (без BYN и RUB)
        const res = await fetch(
          `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${cryptos}&tsyms=USD,EUR`
        );
                if (!res.ok) throw new Error(`Ошибка API: ${res.status}`);
        
        const cryptoData = await res.json();
        
        // Проверяем валидность данных
        if (!cryptoData.BTC || typeof cryptoData.BTC.USD !== 'number') {
          throw new Error('Неверный формат данных');
        }

        // Добавляем расчет BYN и RUB через актуальный курс USD
        const pricesWithAllCurrencies = {};
        Object.keys(cryptoData).forEach(crypto => {
          pricesWithAllCurrencies[crypto] = {
            USD: cryptoData[crypto].USD,
            EUR: cryptoData[crypto].EUR,
            BYN: cryptoData[crypto].USD * usdToBynRate,
            RUB: cryptoData[crypto].USD * 90 // Примерный курс USD/RUB
          };
        });
        
        setPrices(pricesWithAllCurrencies);
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

  // Функция переключения (Реверс)
  const toggleDirection = () => {
    setIsReversed(!isReversed);
    setAmount('1');
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  // Логика расчета
  const cryptoId = isReversed ? toCurrency : fromCurrency;
  const fiatId = isReversed ? fromCurrency : toCurrency;
    const rate = prices[cryptoId]?.[fiatId] || 0;
  
  let result = 0;
  let formattedResult = '';
  
  if (rate > 0 && amount) {
    const numAmount = parseFloat(amount);
    if (isReversed) {
      // Фиат -> Крипта (Делим)
      result = numAmount / rate;
      formattedResult = result.toFixed(6);
    } else {
      // Крипта -> Фиат (Умножаем)
      result = numAmount * rate;
      formattedResult = result.toFixed(2);
    }
  }

  const saveToHistory = () => {
    if (!amount || result === 0) return;
    const entry = {
      from: fromCurrency,
      to: toCurrency,
      amount: amount,
      result: formattedResult,
      date: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
    };
    const updated = [entry, ...history].slice(0, 10);
    setHistory(updated);
    localStorage.setItem('crypto_history', JSON.stringify(updated));
  };

  return (
    <div className="app">
      <header className="header">
        <h1>🌍 Crypto Converter</h1>
        <p>Конвертация криптовалют и фиата в реальном времени</p>
      </header>

      <main className="card">
        {error && <div className="alert error">{error}</div>}
        
        <div className="input-group" style={{ marginBottom: '1rem' }}>
          <label>{isReversed ? 'Сумма в фиате' : 'Сумма крипто'}:</label>
          <input 
            type="number" 
            value={amount} 
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
          />        </div>

        <div className="exchange-row">
          <div className="input-group">
            <label>{isReversed ? 'Имею (Фиат)' : 'Имею (Крипта)'}</label>
            <select value={fromCurrency} onChange={(e) => setFromCurrency(e.target.value)}>
              {(isReversed ? FIAT_OPTIONS : CRYPTO_OPTIONS).map(opt => (
                <option key={opt.id} value={opt.id}>{opt.id} — {opt.name}</option>
              ))}
            </select>
          </div>

          <button className="btn-reverse" onClick={toggleDirection} title="Поменять направление">
            🔄
          </button>

          <div className="input-group">
            <label>{isReversed ? 'Получу (Крипта)' : 'Получу (Фиат)'}</label>
            <select value={toCurrency} onChange={(e) => setToCurrency(e.target.value)}>
              {(isReversed ? CRYPTO_OPTIONS : FIAT_OPTIONS).map(opt => (
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
              <span className="result-value">
                {amount > 0 ? `${formattedResult} ${toCurrency}` : '—'}
              </span>
              <div className="rate-info">
                Курс: 1 {cryptoId} ≈ {rate ? (rate > 100 ? rate.toFixed(2) : rate.toFixed(4)) : 0} {fiatId}
                {fiatId === 'BYN' && <div style={{marginTop: '0.3rem', fontSize: '0.75rem'}}>USD/BYN: {usdToBynRate.toFixed(4)}</div>}
              </div>
            </>
          )}
          <div className="button-group" style={{ marginTop: '1.5rem' }}>
            <button className="btn-save" onClick={saveToHistory}>💾 Сохранить</button>
            <button className="btn-reset" onClick={() => { setAmount('1'); setFromCurrency('BTC'); setToCurrency('BYN'); setIsReversed(false); }}>🔄 Сброс</button>
          </div>
        </div>
      </main>

      {history.length > 0 && (
        <section className="history">          <div className="history-header">
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
        <p>Крипто: CryptoCompare API • USD/BYN: НБРБ • {new Date().toLocaleDateString('ru-RU')}</p>
      </footer>
    </div>
  );
}
