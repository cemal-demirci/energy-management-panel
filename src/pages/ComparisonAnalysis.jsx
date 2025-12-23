import React, { useState, useEffect } from 'react';
import {
  GitCompare,
  Calendar,
  Building2,
  Zap,
  Droplets,
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  Download,
  RefreshCw,
  ArrowRight,
  ChevronDown
} from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ComposedChart, Area } from 'recharts';

function ComparisonAnalysis() {
  const [comparisonType, setComparisonType] = useState('period');
  const [period1, setPeriod1] = useState({ start: '2024-11-01', end: '2024-11-30' });
  const [period2, setPeriod2] = useState({ start: '2024-12-01', end: '2024-12-23' });
  const [selectedSites, setSelectedSites] = useState(['Site A', 'Site B']);
  const [dataType, setDataType] = useState('energy');
  const [loading, setLoading] = useState(false);
  const [comparisonData, setComparisonData] = useState(null);

  useEffect(() => {
    loadComparison();
  }, [comparisonType, period1, period2, selectedSites, dataType]);

  const loadComparison = () => {
    setLoading(true);
    setTimeout(() => {
      if (comparisonType === 'period') {
        setComparisonData({
          type: 'period',
          period1: { label: 'Kasım 2024', total: 125000, avg: 4166 },
          period2: { label: 'Aralık 2024', total: 118500, avg: 5152 },
          difference: -6500,
          percentChange: -5.2,
          trend: [
            { day: '1', p1: 4200, p2: 5100 },
            { day: '5', p1: 4100, p2: 5200 },
            { day: '10', p1: 4300, p2: 5000 },
            { day: '15', p1: 4000, p2: 5300 },
            { day: '20', p1: 4200, p2: 5100 },
            { day: '25', p1: 4100, p2: 5000 },
            { day: '30', p1: 4100, p2: null },
          ],
          breakdown: [
            { category: 'Isıtma', p1: 45000, p2: 52000, diff: 7000 },
            { category: 'Aydınlatma', p1: 28000, p2: 25000, diff: -3000 },
            { category: 'Ortak Alan', p1: 32000, p2: 28000, diff: -4000 },
            { category: 'Diğer', p1: 20000, p2: 13500, diff: -6500 },
          ]
        });
      } else {
        setComparisonData({
          type: 'site',
          sites: [
            { name: 'Site A', total: 85000, meterCount: 150, avgPerMeter: 567 },
            { name: 'Site B', total: 62000, meterCount: 120, avgPerMeter: 517 },
            { name: 'Site C', total: 45000, meterCount: 80, avgPerMeter: 563 },
          ],
          monthlyTrend: [
            { month: 'Oca', 'Site A': 82000, 'Site B': 58000, 'Site C': 42000 },
            { month: 'Şub', 'Site A': 78000, 'Site B': 55000, 'Site C': 40000 },
            { month: 'Mar', 'Site A': 72000, 'Site B': 52000, 'Site C': 38000 },
            { month: 'Nis', 'Site A': 65000, 'Site B': 48000, 'Site C': 35000 },
            { month: 'May', 'Site A': 58000, 'Site B': 42000, 'Site C': 32000 },
            { month: 'Haz', 'Site A': 55000, 'Site B': 40000, 'Site C': 30000 },
            { month: 'Tem', 'Site A': 60000, 'Site B': 45000, 'Site C': 33000 },
            { month: 'Ağu', 'Site A': 62000, 'Site B': 48000, 'Site C': 35000 },
            { month: 'Eyl', 'Site A': 68000, 'Site B': 52000, 'Site C': 38000 },
            { month: 'Eki', 'Site A': 75000, 'Site B': 56000, 'Site C': 40000 },
            { month: 'Kas', 'Site A': 80000, 'Site B': 60000, 'Site C': 43000 },
            { month: 'Ara', 'Site A': 85000, 'Site B': 62000, 'Site C': 45000 },
          ],
          efficiency: [
            { name: 'Site A', score: 78, rank: 2 },
            { name: 'Site B', score: 85, rank: 1 },
            { name: 'Site C', score: 72, rank: 3 },
          ]
        });
      }
      setLoading(false);
    }, 800);
  };

  const getChangeIcon = (value) => {
    if (value > 0) return <TrendingUp size={16} className="text-red" />;
    if (value < 0) return <TrendingDown size={16} className="text-green" />;
    return <Minus size={16} className="text-gray" />;
  };

  const getChangeColor = (value) => {
    if (value > 0) return '#EF4444';
    if (value < 0) return '#10B981';
    return '#64748b';
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  return (
    <div className="comparison-page">
      <div className="page-header">
        <div className="header-title">
          <GitCompare size={28} />
          <div>
            <h1>Karşılaştırmalı Analiz</h1>
            <p className="subtitle">Dönem ve site bazlı karşılaştırmalar</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={loadComparison}>
            <RefreshCw size={18} />
            Yenile
          </button>
          <button className="btn btn-primary">
            <Download size={18} />
            Rapor İndir
          </button>
        </div>
      </div>

      {/* Comparison Type Selector */}
      <div className="comparison-type-selector">
        <button
          className={`type-btn ${comparisonType === 'period' ? 'active' : ''}`}
          onClick={() => setComparisonType('period')}
        >
          <Calendar size={20} />
          Dönem Karşılaştırma
        </button>
        <button
          className={`type-btn ${comparisonType === 'site' ? 'active' : ''}`}
          onClick={() => setComparisonType('site')}
        >
          <Building2 size={20} />
          Site Karşılaştırma
        </button>
      </div>

      {/* Filters */}
      <div className="comparison-filters">
        {comparisonType === 'period' ? (
          <>
            <div className="filter-group">
              <label>Dönem 1</label>
              <div className="date-range">
                <input
                  type="date"
                  value={period1.start}
                  onChange={e => setPeriod1({...period1, start: e.target.value})}
                />
                <ArrowRight size={16} />
                <input
                  type="date"
                  value={period1.end}
                  onChange={e => setPeriod1({...period1, end: e.target.value})}
                />
              </div>
            </div>
            <div className="filter-group">
              <label>Dönem 2</label>
              <div className="date-range">
                <input
                  type="date"
                  value={period2.start}
                  onChange={e => setPeriod2({...period2, start: e.target.value})}
                />
                <ArrowRight size={16} />
                <input
                  type="date"
                  value={period2.end}
                  onChange={e => setPeriod2({...period2, end: e.target.value})}
                />
              </div>
            </div>
          </>
        ) : (
          <div className="filter-group">
            <label>Siteler</label>
            <div className="site-checkboxes">
              {['Site A', 'Site B', 'Site C', 'Site D'].map(site => (
                <label key={site} className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={selectedSites.includes(site)}
                    onChange={e => {
                      if (e.target.checked) {
                        setSelectedSites([...selectedSites, site]);
                      } else {
                        setSelectedSites(selectedSites.filter(s => s !== site));
                      }
                    }}
                  />
                  {site}
                </label>
              ))}
            </div>
          </div>
        )}
        <div className="filter-group">
          <label>Veri Türü</label>
          <select value={dataType} onChange={e => setDataType(e.target.value)}>
            <option value="energy">Elektrik (kWh)</option>
            <option value="water">Su (m³)</option>
            <option value="gas">Doğalgaz (m³)</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Analiz yapılıyor...</p>
        </div>
      ) : comparisonData && (
        <>
          {/* Period Comparison */}
          {comparisonType === 'period' && (
            <>
              {/* Summary Cards */}
              <div className="comparison-summary">
                <div className="summary-card period1">
                  <h3>{comparisonData.period1.label}</h3>
                  <div className="summary-value">
                    {comparisonData.period1.total.toLocaleString()}
                    <span className="unit">kWh</span>
                  </div>
                  <div className="summary-avg">
                    Günlük Ort: {comparisonData.period1.avg.toLocaleString()} kWh
                  </div>
                </div>

                <div className="summary-arrow">
                  <div className="change-indicator" style={{ color: getChangeColor(comparisonData.percentChange) }}>
                    {getChangeIcon(comparisonData.percentChange)}
                    <span className="change-value">{Math.abs(comparisonData.percentChange)}%</span>
                    <span className="change-label">
                      {comparisonData.percentChange < 0 ? 'Azalma' : 'Artış'}
                    </span>
                  </div>
                </div>

                <div className="summary-card period2">
                  <h3>{comparisonData.period2.label}</h3>
                  <div className="summary-value">
                    {comparisonData.period2.total.toLocaleString()}
                    <span className="unit">kWh</span>
                  </div>
                  <div className="summary-avg">
                    Günlük Ort: {comparisonData.period2.avg.toLocaleString()} kWh
                  </div>
                </div>
              </div>

              {/* Trend Chart */}
              <div className="chart-card">
                <div className="chart-header">
                  <BarChart3 size={20} />
                  <h3>Günlük Tüketim Karşılaştırması</h3>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={comparisonData.trend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
                    <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                    <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(30, 41, 59, 0.95)',
                        border: '1px solid rgba(148, 163, 184, 0.2)',
                        borderRadius: '8px',
                        color: '#f1f5f9'
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="p1" stroke="#3B82F6" strokeWidth={2} name={comparisonData.period1.label} dot={{ fill: '#3B82F6' }} />
                    <Line type="monotone" dataKey="p2" stroke="#10B981" strokeWidth={2} name={comparisonData.period2.label} dot={{ fill: '#10B981' }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Breakdown */}
              <div className="chart-card">
                <div className="chart-header">
                  <BarChart3 size={20} />
                  <h3>Kategori Bazlı Karşılaştırma</h3>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={comparisonData.breakdown} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
                    <XAxis type="number" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                    <YAxis dataKey="category" type="category" tick={{ fontSize: 12, fill: '#94a3b8' }} width={100} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(30, 41, 59, 0.95)',
                        border: '1px solid rgba(148, 163, 184, 0.2)',
                        borderRadius: '8px',
                        color: '#f1f5f9'
                      }}
                    />
                    <Legend />
                    <Bar dataKey="p1" fill="#3B82F6" name={comparisonData.period1.label} radius={[0, 4, 4, 0]} />
                    <Bar dataKey="p2" fill="#10B981" name={comparisonData.period2.label} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Difference Table */}
              <div className="content-card">
                <h3>Detaylı Fark Analizi</h3>
                <table className="comparison-table">
                  <thead>
                    <tr>
                      <th>Kategori</th>
                      <th>{comparisonData.period1.label}</th>
                      <th>{comparisonData.period2.label}</th>
                      <th>Fark</th>
                      <th>Değişim</th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonData.breakdown.map((item, index) => (
                      <tr key={index}>
                        <td>{item.category}</td>
                        <td>{item.p1.toLocaleString()} kWh</td>
                        <td>{item.p2.toLocaleString()} kWh</td>
                        <td style={{ color: getChangeColor(item.diff) }}>
                          {item.diff > 0 ? '+' : ''}{item.diff.toLocaleString()} kWh
                        </td>
                        <td>
                          <span className="change-badge" style={{ color: getChangeColor(item.diff) }}>
                            {getChangeIcon(item.diff)}
                            {Math.abs((item.diff / item.p1) * 100).toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* Site Comparison */}
          {comparisonType === 'site' && (
            <>
              {/* Site Cards */}
              <div className="site-comparison-grid">
                {comparisonData.sites.map((site, index) => (
                  <div key={site.name} className="site-comparison-card" style={{ borderTopColor: COLORS[index] }}>
                    <h3>{site.name}</h3>
                    <div className="site-total">
                      <span className="value">{site.total.toLocaleString()}</span>
                      <span className="unit">kWh</span>
                    </div>
                    <div className="site-details">
                      <div className="detail-item">
                        <span className="label">Sayaç Sayısı</span>
                        <span className="value">{site.meterCount}</span>
                      </div>
                      <div className="detail-item">
                        <span className="label">Sayaç Başı Ort.</span>
                        <span className="value">{site.avgPerMeter} kWh</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Monthly Trend */}
              <div className="chart-card">
                <div className="chart-header">
                  <BarChart3 size={20} />
                  <h3>Aylık Tüketim Trendi</h3>
                </div>
                <ResponsiveContainer width="100%" height={350}>
                  <ComposedChart data={comparisonData.monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                    <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(30, 41, 59, 0.95)',
                        border: '1px solid rgba(148, 163, 184, 0.2)',
                        borderRadius: '8px',
                        color: '#f1f5f9'
                      }}
                    />
                    <Legend />
                    {selectedSites.map((site, index) => (
                      <Area
                        key={site}
                        type="monotone"
                        dataKey={site}
                        fill={COLORS[index]}
                        fillOpacity={0.3}
                        stroke={COLORS[index]}
                        strokeWidth={2}
                      />
                    ))}
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Efficiency Ranking */}
              <div className="content-card">
                <h3>Verimlilik Sıralaması</h3>
                <div className="efficiency-ranking">
                  {comparisonData.efficiency.sort((a, b) => a.rank - b.rank).map((site, index) => (
                    <div key={site.name} className={`rank-item rank-${site.rank}`}>
                      <div className="rank-badge">#{site.rank}</div>
                      <div className="rank-info">
                        <span className="rank-name">{site.name}</span>
                        <div className="rank-bar-container">
                          <div
                            className="rank-bar"
                            style={{ width: `${site.score}%`, backgroundColor: COLORS[index] }}
                          />
                        </div>
                      </div>
                      <div className="rank-score">{site.score}/100</div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default ComparisonAnalysis;
