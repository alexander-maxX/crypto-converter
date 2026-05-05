useEffect(() => {
  const fetchPrices = async () => {
    try {
      setLoading(true);
      setError(null);
      const cryptos = CRYPTO_OPTIONS.map(c => c.id).join(',');
      const fiats = FIAT_OPTIONS.join(',');
      
      // Всегда пробуем получить реальные данные
      const res = await fetch(
        `https://min-api.cryptocompare.com/data/pricemulti?fsyms=${cryptos}&tsyms=${fiats}`
      );
      
      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }
      
      const data = await res.json();
      
      // Проверяем, что данные валидные
      if (!data.BTC || !data.BTC.USD) {
        throw new Error('Invalid API response');
      }
      
      setPrices(data);
    } catch (err) {
      console.error('Ошибка API:', err.message);
      setError('⚠️ Не удалось загрузить курсы. Проверьте интернет-соединение.');
      // Очищаем цены при ошибке
      setPrices({});
    } finally {
      setLoading(false);
    }
  };
  
  fetchPrices();
  
  // Обновляем курсы каждые 30 секунд
  const interval = setInterval(fetchPrices, 30000);
  
  return () => clearInterval(interval);
}, []);
