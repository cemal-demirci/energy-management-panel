import React, { useState, useEffect } from 'react';

function Alerts() {
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchAnomalies();
  }, []);

  const fetchAnomalies = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/analytics/anomalies');
      const data = await res.json();
      setAnomalies(data);
    } catch (err) {
      console.error('Anomalies error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getAlertIcon = (type) => {
    switch (type) {
      case 'Yüksek Tüketim': return '🔴';
      case 'Düşük Tüketim': return '🟡';
      case 'Okuma Hatası': return '⚠️';
      default: return '📌';
    }
  };

  const getAlertClass = (type) => {
    switch (type) {
      case 'Yüksek Tüketim': return 'alert-high';
      case 'Düşük Tüketim': return 'alert-low';
      case 'Okuma Hatası': return 'alert-error';
      default: return 'alert-normal';
    }
  };

  const formatEnergy = (value) => {
    if (value >= 1000000) return (value / 1000000).toFixed(2) + ' MWh';
    if (value >= 1000) return (value / 1000).toFixed(2) + ' kWh';
    return (value || 0).toFixed(2) + ' Wh';
  };

  const filteredAnomalies = filter === 'all'
    ? anomalies
    : anomalies.filter(a => a.anomaliTipi === filter);

  const highCount = anomalies.filter(a => a.anomaliTipi === 'Yüksek Tüketim').length;
  const lowCount = anomalies.filter(a => a.anomaliTipi === 'Düşük Tüketim').length;
  const errorCount = anomalies.filter(a => a.anomaliTipi === 'Okuma Hatası').length;

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Uyarılar yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="alerts-page">
      <div className="page-header">
        <h1>🔔 Uyarılar & Anomaliler</h1>
        <p className="subtitle">Sistem anomalileri ve dikkat gerektiren durumlar</p>
      </div>

      {/* Summary Cards */}
      <div className="alerts-summary">
        <div className="alert-summary-card high">
          <span className="alert-icon">🔴</span>
          <div className="alert-info">
            <span className="alert-count">{highCount}</span>
            <span className="alert-label">Yüksek Tüketim</span>
          </div>
        </div>
        <div className="alert-summary-card low">
          <span className="alert-icon">🟡</span>
          <div className="alert-info">
            <span className="alert-count">{lowCount}</span>
            <span className="alert-label">Düşük Tüketim</span>
          </div>
        </div>
        <div className="alert-summary-card error">
          <span className="alert-icon">⚠️</span>
          <div className="alert-info">
            <span className="alert-count">{errorCount}</span>
            <span className="alert-label">Okuma Hatası</span>
          </div>
        </div>
        <div className="alert-summary-card total">
          <span className="alert-icon">📊</span>
          <div className="alert-info">
            <span className="alert-count">{anomalies.length}</span>
            <span className="alert-label">Toplam Anomali</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button
          className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Tümü ({anomalies.length})
        </button>
        <button
          className={`filter-tab ${filter === 'Yüksek Tüketim' ? 'active' : ''}`}
          onClick={() => setFilter('Yüksek Tüketim')}
        >
          🔴 Yüksek Tüketim ({highCount})
        </button>
        <button
          className={`filter-tab ${filter === 'Düşük Tüketim' ? 'active' : ''}`}
          onClick={() => setFilter('Düşük Tüketim')}
        >
          🟡 Düşük Tüketim ({lowCount})
        </button>
        <button
          className={`filter-tab ${filter === 'Okuma Hatası' ? 'active' : ''}`}
          onClick={() => setFilter('Okuma Hatası')}
        >
          ⚠️ Okuma Hatası ({errorCount})
        </button>
      </div>

      {/* Alerts List */}
      <div className="alerts-list">
        {filteredAnomalies.length === 0 ? (
          <div className="no-alerts">
            <span className="icon">✅</span>
            <p>Bu kategoride anomali bulunmuyor.</p>
          </div>
        ) : (
          filteredAnomalies.map((anomaly, index) => (
            <div key={index} className={`alert-item ${getAlertClass(anomaly.anomaliTipi)}`}>
              <div className="alert-icon-container">
                {getAlertIcon(anomaly.anomaliTipi)}
              </div>
              <div className="alert-content">
                <div className="alert-header">
                  <span className="alert-type">{anomaly.anomaliTipi}</span>
                  <span className="alert-meter">Sayaç: {anomaly.seriNo}</span>
                </div>
                <div className="alert-details">
                  <span className="detail">
                    <strong>Site:</strong> {anomaly.siteAdi}
                  </span>
                  <span className="detail">
                    <strong>Konum:</strong> {anomaly.il} / {anomaly.ilce}
                  </span>
                  <span className="detail">
                    <strong>Enerji:</strong> {formatEnergy(anomaly.enerji)}
                  </span>
                </div>
                <div className="alert-stats">
                  <span>Ortalama: {formatEnergy(anomaly.avgEnerji)}</span>
                  <span>Std. Sapma: {formatEnergy(anomaly.stdEnerji)}</span>
                </div>
              </div>
              <div className="alert-actions">
                <button className="btn btn-sm btn-secondary">Detay</button>
                <button className="btn btn-sm btn-primary">İncele</button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Info Panel */}
      <div className="info-panel">
        <h3>ℹ️ Anomali Tespit Sistemi Hakkında</h3>
        <p>
          Bu sistem, istatistiksel yöntemler kullanarak normal dışı tüketim paternlerini tespit eder.
          2 standart sapmanın üzerinde veya altında kalan değerler anomali olarak işaretlenir.
        </p>
        <ul>
          <li><strong>Yüksek Tüketim:</strong> Site ortalamasının çok üzerinde tüketim yapan sayaçlar</li>
          <li><strong>Düşük Tüketim:</strong> Site ortalamasının çok altında tüketim yapan sayaçlar</li>
          <li><strong>Okuma Hatası:</strong> İletişim veya teknik sorun yaşayan sayaçlar</li>
        </ul>
      </div>
    </div>
  );
}

export default Alerts;
