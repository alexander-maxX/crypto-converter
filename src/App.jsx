import { useState, useEffect } from 'react';
import './App.css';

const CRYPTO_OPTIONS = [
  { id: 'BTC', name: 'Bitcoin', symbol: '₿' },
  { id: 'ETH', name: 'Ethereum', symbol: 'Ξ' },
  { id: 'USDT', name: 'Tether', symbol: '₮' },
  { id: 'SOL', name: 'Solana', symbol: '◎' },
  { id: 'TON', name: 'Toncoin', symbol: '💎' },
  { id: 'BNB', name: 'BNB', symbol: '◈' },
  { id: 'XRP', name: 'Ripple', symbol: '✕' },
  { id: 'ADA', name: 'Cardano', symbol: '₳' },
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
  const [fromCurrency, setFromCurrency] = useState('BTC'); // Из чего
  const [toCurrency, setToCurrency] = useState('BYN');    // Во что
  const [isReversed, setIsReversed] = useState(false);    // Режим реверса
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Загрузка истории
  useEffect(() => {
    const saved = localStorage.getItem('crypto_history');
    if (saved) setHistory(JSON.parse(saved));
  }, []);

  // Получение курсов
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        setLoading(true);
        setError(null);
        const cryptos = CRYPTO_OPTIONS.map(c => c.id).join(',');
        const fiats = FIAT_OPTIONS.map(f => f.id).join(',');
        
        // Запрашиваем все пары (Crypto -> Fiat)
        const res = await fetch(
          `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${cryptos}&tsyms=${fiats}`
        );        if (!res.ok) throw new Error('Ошибка сети');
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
    setAmount('1'); // Сбрасываем сумму при переключении
    // Меняем валюты местами для удобства
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  // --- Логика расчета ---
  // Нам всегда нужно знать, какой сейчас "Crypto ID", а какой "Fiat ID"
  const cryptoId = isReversed ? toCurrency : fromCurrency;
  const fiatId = isReversed ? fromCurrency : toCurrency;
  
  // Берем цену 1 единицы крипты в фиате
  const rate = prices[cryptoId]?.[fiatId] || 0;
  
  // Считаем результат
  let result = 0;
  let formattedResult = '';
  
  if (rate > 0 && amount) {
    const numAmount = parseFloat(amount);
    if (isReversed) {
      // Фиат -> Крипта (Делим)
      // Пример: 10 BYN / 4.5 = 2.22 USDT
      result = numAmount / rate;
      formattedResult = result.toFixed(6); // Крипту показываем с точностью до 6 знаков
    } else {
      // Крипта -> Фиат (Умножаем)
      // Пример: 1 USDT * 4.5 = 4.50 BYN
      result = numAmount * rate;
      formattedResult = result.toFixed(2); // Фиат с 2 знаками
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
        
        {/* Поле ввода суммы */}
        <div className="input-group" style={{ marginBottom: '1rem' }}>
          <label>{isReversed ? 'Сумма в фиате' : 'Сумма крипто'}:</label>
          <input 
            type="number" 
            value={amount} 
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
          />
        </div>

        {/* Блок выбора валют с кнопкой реверса */}
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

        {/* Результат */}
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
