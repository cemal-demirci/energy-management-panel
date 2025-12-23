import React, { useState, useEffect } from 'react';

function AIPrediction({ siteId, siteName }) {
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const analyzePrediction = async () => {
    if (!siteId) return;

    setLoading(true);
    setError(null);

    try {
      // Use existing /api/ai/predict endpoint
      const res = await fetch('/api/ai/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId })
      });

      if (!res.ok) {
        throw new Error('API yanıt vermedi');
      }

      const data = await res.json();

      // Parse the prediction text to extract key info
      const predictionText = data.prediction || '';
      const historicalData = data.historicalData || [];

      // Calculate trend from historical data
      let trend = 'stabil';
      let trendPercent = '0%';

      if (historicalData.length >= 2) {
        const recent = historicalData[0]?.toplamEnerji || 0;
        const previous = historicalData[1]?.toplamEnerji || 0;
        if (previous > 0) {
          const change = ((recent - previous) / previous) * 100;
          trendPercent = `${Math.abs(change).toFixed(1)}%`;
          if (change > 5) trend = 'artış';
          else if (change < -5) trend = 'azalış';
        }
      }

      // Calculate estimated next month consumption
      const avgConsumption = historicalData.length > 0
        ? historicalData.reduce((sum, h) => sum + (h.toplamEnerji || 0), 0) / historicalData.length
        : 0;

      setPrediction({
        tahmin: avgConsumption > 0 ? `${(avgConsumption / 1000).toFixed(2)} MWh` : 'Veri yok',
        trend,
        trendYuzdesi: trendPercent,
        anormallik: predictionText.toLowerCase().includes('anormal') || predictionText.toLowerCase().includes('yüksek'),
        anormallikAciklama: predictionText.toLowerCase().includes('anormal') ? 'AI anormal tüketim tespit etti' : null,
        tasarrufOnerileri: extractSuggestions(predictionText),
        guvenSkoru: historicalData.length >= 6 ? '85%' : historicalData.length >= 3 ? '65%' : '40%',
        rawAnalysis: predictionText
      });
    } catch (err) {
      console.error('AI Prediction error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Extract suggestions from AI response text
  const extractSuggestions = (text) => {
    const suggestions = [];
    const lines = text.split('\n');

    for (const line of lines) {
      if (line.match(/^\d+\.|^-|^•|^\*/)) {
        const cleaned = line.replace(/^\d+\.|^-|^•|^\*/, '').trim();
        if (cleaned.length > 10 && cleaned.length < 200) {
          suggestions.push(cleaned);
        }
      }
    }

    if (suggestions.length === 0) {
      return [
        'Düzenli sayaç okumalarını kontrol edin',
        'Anormal tüketim gösteren daireleri inceleyin',
        'Mevsimsel değişimleri göz önünde bulundurun'
      ];
    }

    return suggestions.slice(0, 4);
  };

  useEffect(() => {
    if (siteId) {
      analyzePrediction();
    }
  }, [siteId]);

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'artış': return '📈';
      case 'azalış': return '📉';
      default: return '➡️';
    }
  };

  const getTrendColor = (trend) => {
    switch (trend) {
      case 'artış': return 'var(--danger)';
      case 'azalış': return 'var(--success)';
      default: return 'var(--warning)';
    }
  };

  return (
    <div className="ai-prediction-card">
      <div className="ai-prediction-header">
        <div className="ai-icon">🤖</div>
        <h3>AI Tüketim Tahmini</h3>
        <button
          className="refresh-btn"
          onClick={analyzePrediction}
          disabled={loading}
        >
          {loading ? '⏳' : '🔄'}
        </button>
      </div>

      {loading && (
        <div className="ai-loading">
          <div className="ai-pulse"></div>
          <span>AI analiz ediyor...</span>
        </div>
      )}

      {error && (
        <div className="ai-error">
          <span>⚠️ {error}</span>
        </div>
      )}

      {prediction && !loading && (
        <div className="ai-prediction-content">
          <div className="prediction-main">
            <div className="prediction-value">
              <span className="label">Gelecek Ay Tahmini</span>
              <span className="value">{prediction.tahmin}</span>
            </div>
            <div
              className="prediction-trend"
              style={{ color: getTrendColor(prediction.trend) }}
            >
              <span className="trend-icon">{getTrendIcon(prediction.trend)}</span>
              <span className="trend-text">
                {prediction.trend} ({prediction.trendYuzdesi})
              </span>
            </div>
          </div>

          {prediction.anormallik && (
            <div className="prediction-alert">
              <span className="alert-icon">⚠️</span>
              <span>{prediction.anormallikAciklama || 'Anormal tüketim tespit edildi'}</span>
            </div>
          )}

          <div className="prediction-suggestions">
            <h4>💡 Tasarruf Önerileri</h4>
            <ul>
              {prediction.tasarrufOnerileri?.map((oneri, i) => (
                <li key={i}>{oneri}</li>
              ))}
            </ul>
          </div>

          <div className="prediction-confidence">
            <span>Güven Skoru: </span>
            <div className="confidence-bar">
              <div
                className="confidence-fill"
                style={{ width: prediction.guvenSkoru || '75%' }}
              ></div>
            </div>
            <span>{prediction.guvenSkoru || '75%'}</span>
          </div>
        </div>
      )}

      {!prediction && !loading && !error && (
        <div className="ai-empty">
          <span>📊 Site seçin veya analiz başlatın</span>
        </div>
      )}
    </div>
  );
}

export default AIPrediction;
