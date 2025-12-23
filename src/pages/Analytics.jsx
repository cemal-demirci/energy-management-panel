import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

function Analytics() {
  const [consumptionData, setConsumptionData] = useState([]);
  const [cityStats, setCityStats] = useState([]);
  const [period, setPeriod] = useState('daily');
  const [loading, setLoading] = useState(true);

  const safeJson = async (res) => {
    try {
      const ct = res.headers.get('content-type');
      if (res.ok && ct?.includes('application/json')) return await res.json();
    } catch {}
    return null;
  };

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const [consumptionRes, cityRes] = await Promise.all([
        fetch(`/api/analytics/consumption?period=${period}`),
        fetch('/api/analytics/by-city')
      ]);

      const consumptionDataRes = await safeJson(consumptionRes);
      const cityDataRes = await safeJson(cityRes);

      if (consumptionDataRes) {
        setConsumptionData(Array.isArray(consumptionDataRes) ? consumptionDataRes.reverse() : []);
      } else {
        // Demo data
        setConsumptionData([
          { period: 'Ocak', toplamEnerji: 125000, okumaSayisi: 1200 },
          { period: 'Şubat', toplamEnerji: 118000, okumaSayisi: 1180 },
          { period: 'Mart', toplamEnerji: 105000, okumaSayisi: 1150 },
          { period: 'Nisan', toplamEnerji: 92000, okumaSayisi: 1100 },
          { period: 'Mayıs', toplamEnerji: 78000, okumaSayisi: 1050 }
        ]);
      }

      if (cityDataRes) {
        setCityStats(Array.isArray(cityDataRes) ? cityDataRes : []);
      } else {
        setCityStats([
          { sehir: 'İstanbul', toplamEnerji: 450000, sayacSayisi: 1500 },
          { sehir: 'Ankara', toplamEnerji: 280000, sayacSayisi: 850 },
          { sehir: 'İzmir', toplamEnerji: 180000, sayacSayisi: 520 }
        ]);
      }
    } catch (err) {
      console.error('Analytics error:', err);
      setConsumptionData([]);
      setCityStats([]);
    } finally {
      setLoading(false);
    }
  };

  const formatEnergy = (value) => {
    if (value >= 1000000000) return (value / 1000000000).toFixed(2) + ' GWh';
    if (value >= 1000000) return (value / 1000000).toFixed(2) + ' MWh';
    if (value >= 1000) return (value / 1000).toFixed(2) + ' kWh';
    return (value || 0).toFixed(2) + ' Wh';
  };

  const totalEnergy = cityStats.reduce((acc, c) => acc + (c.toplamEnerji || 0), 0);
  const totalMeters = cityStats.reduce((acc, c) => acc + (c.sayacSayisi || 0), 0);
  const avgEnergy = totalMeters > 0 ? totalEnergy / totalMeters : 0;

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Analitik verileri yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="analytics-page">
      <div className="page-header">
        <h1>📉 Analitik & Raporlar</h1>
        <p className="subtitle">Detaylı tüketim analizi ve istatistikler</p>
      </div>

      {/* Summary Stats */}
      <div className="analytics-summary">
        <div className="summary-card">
          <div className="summary-icon">⚡</div>
          <div className="summary-content">
            <span className="summary-value">{formatEnergy(totalEnergy)}</span>
            <span className="summary-label">Toplam Enerji</span>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon">📊</div>
          <div className="summary-content">
            <span className="summary-value">{totalMeters.toLocaleString()}</span>
            <span className="summary-label">Toplam Sayaç</span>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon">📈</div>
          <div className="summary-content">
            <span className="summary-value">{formatEnergy(avgEnergy)}</span>
            <span className="summary-label">Ortalama / Sayaç</span>
          </div>
        </div>
        <div className="summary-card">
          <div className="summary-icon">🏙️</div>
          <div className="summary-content">
            <span className="summary-value">{cityStats.length}</span>
            <span className="summary-label">Aktif İl</span>
          </div>
        </div>
      </div>

      {/* Period Selector */}
      <div className="period-selector">
        <button
          className={`period-btn ${period === 'hourly' ? 'active' : ''}`}
          onClick={() => setPeriod('hourly')}
        >
          Saatlik
        </button>
        <button
          className={`period-btn ${period === 'daily' ? 'active' : ''}`}
          onClick={() => setPeriod('daily')}
        >
          Günlük
        </button>
        <button
          className={`period-btn ${period === 'monthly' ? 'active' : ''}`}
          onClick={() => setPeriod('monthly')}
        >
          Aylık
        </button>
      </div>

      {/* Charts */}
      <div className="charts-grid">
        {/* Consumption Trend */}
        <div className="chart-card full-width">
          <h3>📈 Tüketim Trendi ({period === 'hourly' ? 'Saatlik' : period === 'daily' ? 'Günlük' : 'Aylık'})</h3>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={consumptionData}>
              <defs>
                <linearGradient id="colorEnergy" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="period" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => formatEnergy(v)} />
              <Tooltip formatter={(v) => formatEnergy(v)} />
              <Legend />
              <Area
                type="monotone"
                dataKey="toplamEnerji"
                name="Toplam Enerji"
                stroke="#3B82F6"
                fill="url(#colorEnergy)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Reading Count */}
        <div className="chart-card">
          <h3>📊 Okuma Sayısı</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={consumptionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="okumaSayisi" name="Okuma Sayısı" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* City Comparison */}
        <div className="chart-card">
          <h3>🏙️ İl Karşılaştırması</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={cityStats.slice(0, 8)} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => formatEnergy(v)} />
              <YAxis dataKey="city" type="category" tick={{ fontSize: 11 }} width={80} />
              <Tooltip formatter={(v) => formatEnergy(v)} />
              <Bar dataKey="toplamEnerji" name="Toplam Enerji" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* City Table */}
      <div className="analytics-table">
        <h3>📋 İl Bazlı Detaylı İstatistikler</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>İl</th>
                <th>Site Sayısı</th>
                <th>Sayaç Sayısı</th>
                <th>Toplam Enerji</th>
                <th>Ortalama Enerji</th>
                <th>Toplam Hacim</th>
              </tr>
            </thead>
            <tbody>
              {cityStats.map((city, index) => (
                <tr key={index}>
                  <td><strong>{city.city}</strong></td>
                  <td>{city.siteSayisi?.toLocaleString()}</td>
                  <td>{city.sayacSayisi?.toLocaleString()}</td>
                  <td>{formatEnergy(city.toplamEnerji)}</td>
                  <td>{formatEnergy(city.ortalamaEnerji)}</td>
                  <td>{(city.toplamHacim || 0).toLocaleString()} m³</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Analytics;
