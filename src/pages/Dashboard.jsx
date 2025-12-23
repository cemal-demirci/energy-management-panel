import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, LineChart, Line, AreaChart, Area, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import {
  LayoutDashboard,
  MapPin,
  Building2,
  Home,
  Gauge,
  Thermometer,
  ThermometerSun,
  ThermometerSnowflake,
  Droplets,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Calendar,
  Radio,
  Receipt,
  Bot,
  FileText,
  Map,
  RefreshCw,
  Activity,
  Flame,
  Wind,
  Zap
} from 'lucide-react';
import AIPrediction from '../components/AIPrediction';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [cityData, setCityData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [temperatureData, setTemperatureData] = useState([]);
  const [energyTrend, setEnergyTrend] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const safeJson = async (res) => {
    try {
      const ct = res.headers.get('content-type');
      if (res.ok && ct?.includes('application/json')) {
        return await res.json();
      }
    } catch {}
    return null;
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Tüm verileri paralel olarak çek
      const [statsRes, cityRes, tempRes, energyRes] = await Promise.all([
        fetch('/api/dashboard'),
        fetch('/api/analytics/by-city'),
        fetch('/api/dashboard/temperature-history?hours=24'),
        fetch('/api/dashboard/energy-trend?months=12')
      ]);

      // Dashboard stats
      const statsData = await safeJson(statsRes);
      if (statsData) {
        setStats(statsData);
      } else {
        // Default stats
        setStats({
          totalSites: 0,
          totalBuildings: 0,
          totalMeters: 0,
          totalEnergy: 0,
          activeGateways: 0,
          alerts: 0
        });
      }

      // City data
      const cityDataRes = await safeJson(cityRes);
      setCityData(cityDataRes ? cityDataRes.slice(0, 10) : []);

      // Temperature history
      const tempData = await safeJson(tempRes);
      setTemperatureData(tempData || []);

      // Energy trend
      const energyData = await safeJson(energyRes);
      setEnergyTrend(energyData || []);

    } catch (err) {
      console.error('Dashboard error:', err);
      setStats({ totalSites: 0, totalBuildings: 0, totalMeters: 0, totalEnergy: 0, activeGateways: 0, alerts: 0 });
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#3B82F6', '#8B5CF6'];

  const formatEnergy = (num) => {
    if (!num) return '0 Wh';
    if (num >= 1000000000) return (num / 1000000000).toFixed(2) + ' GWh';
    if (num >= 1000000) return (num / 1000000).toFixed(2) + ' MWh';
    if (num >= 1000) return (num / 1000).toFixed(2) + ' kWh';
    return num?.toFixed(2) + ' Wh';
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Dashboard yükleniyor...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-page">
        <div className="error-banner">
          <AlertTriangle size={24} />
          <span>{error}</span>
          <button onClick={fetchData}>Tekrar Dene</button>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div className="header-title">
          <LayoutDashboard size={28} />
          <div>
            <h1>Enerji Yönetim Paneli</h1>
            <p className="subtitle">Integral Bina Yazılım</p>
          </div>
        </div>
        <button className="btn btn-secondary" onClick={fetchData}>
          <RefreshCw size={18} />
          Yenile
        </button>
      </div>

      {/* Heat Meter Stats Cards */}
      <div className="stats-grid heat-stats">
        <div className="stat-card gradient-red">
          <div className="stat-icon">
            <Flame size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{formatEnergy(stats?.toplamEnerji || 0)}</span>
            <span className="stat-label">Toplam Isı Enerjisi</span>
          </div>
        </div>

        <div className="stat-card gradient-orange">
          <div className="stat-icon">
            <ThermometerSun size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{(stats?.ortalamaGirisSicaklik || 0).toFixed(1)}°C</span>
            <span className="stat-label">Ort. Giriş Sıcaklığı</span>
          </div>
        </div>

        <div className="stat-card gradient-blue">
          <div className="stat-icon">
            <ThermometerSnowflake size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{(stats?.ortalamaCikisSicaklik || 0).toFixed(1)}°C</span>
            <span className="stat-label">Ort. Çıkış Sıcaklığı</span>
          </div>
        </div>

        <div className="stat-card gradient-purple">
          <div className="stat-icon">
            <Activity size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">ΔT {(stats?.ortalamaDeltaT || 0).toFixed(1)}°C</span>
            <span className="stat-label">Sıcaklık Farkı</span>
          </div>
        </div>

        <div className="stat-card gradient-cyan">
          <div className="stat-icon">
            <Droplets size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{(stats?.toplamHacim || 0).toLocaleString('tr-TR')} m³</span>
            <span className="stat-label">Toplam Hacim</span>
          </div>
        </div>

        <div className="stat-card gradient-green">
          <div className="stat-icon">
            <Gauge size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{(stats?.toplamSayac || 0).toLocaleString()}</span>
            <span className="stat-label">Isı Sayacı</span>
          </div>
        </div>
      </div>

      {/* Secondary Stats */}
      <div className="stats-grid secondary-stats">
        <div className="stat-card small">
          <div className="stat-icon small">
            <MapPin size={18} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats?.toplamIl || 0}</span>
            <span className="stat-label">İl</span>
          </div>
        </div>

        <div className="stat-card small">
          <div className="stat-icon small">
            <Building2 size={18} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats?.toplamSite || 0}</span>
            <span className="stat-label">Site</span>
          </div>
        </div>

        <div className="stat-card small">
          <div className="stat-icon small">
            <Home size={18} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{(stats?.toplamBina || 0).toLocaleString()}</span>
            <span className="stat-label">Bina</span>
          </div>
        </div>

        <div className="stat-card small">
          <div className="stat-icon small">
            <AlertTriangle size={18} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{(stats?.hataliSayac || 0).toLocaleString()}</span>
            <span className="stat-label">Hatalı Sayaç</span>
          </div>
        </div>
      </div>

      {/* Temperature Monitoring Chart */}
      {temperatureData.length > 0 && (
        <div className="charts-row">
          <div className="chart-card wide">
            <div className="chart-header">
              <Thermometer size={20} />
              <h3>24 Saatlik Sıcaklık İzleme</h3>
              <div className="chart-legend">
                <span className="legend-item">
                  <span className="legend-color" style={{ background: '#EF4444' }}></span>
                  Giriş (T1)
                </span>
                <span className="legend-item">
                  <span className="legend-color" style={{ background: '#3B82F6' }}></span>
                  Çıkış (T2)
                </span>
                <span className="legend-item">
                  <span className="legend-color" style={{ background: '#8B5CF6' }}></span>
                  ΔT
                </span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={temperatureData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
                <XAxis dataKey="time" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis
                  tick={{ fontSize: 12, fill: '#94a3b8' }}
                  domain={[0, 100]}
                  tickFormatter={(value) => `${value}°C`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(30, 41, 59, 0.95)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: '8px',
                    color: '#f1f5f9'
                  }}
                  formatter={(value, name) => {
                    const labels = { girisSicaklik: 'Giriş', cikisSicaklik: 'Çıkış', deltaT: 'ΔT' };
                    return [`${value.toFixed(1)}°C`, labels[name]];
                  }}
                />
                <Line type="monotone" dataKey="girisSicaklik" stroke="#EF4444" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="cikisSicaklik" stroke="#3B82F6" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="deltaT" stroke="#8B5CF6" strokeWidth={2} dot={false} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Energy Charts Row */}
      <div className="charts-row">
        {/* Monthly Energy Trend */}
        {energyTrend.length > 0 && (
          <div className="chart-card">
            <div className="chart-header">
              <Flame size={20} />
              <h3>Aylık Enerji Tüketimi</h3>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={energyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickFormatter={(v) => (v/1000).toFixed(0) + 'k'} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(30, 41, 59, 0.95)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: '8px',
                    color: '#f1f5f9'
                  }}
                  formatter={(value) => [formatEnergy(value * 1000), '']}
                />
                <Area type="monotone" dataKey="isitma" stackId="1" stroke="#EF4444" fill="rgba(239, 68, 68, 0.3)" name="Isıtma" />
                <Area type="monotone" dataKey="sogutma" stackId="1" stroke="#3B82F6" fill="rgba(59, 130, 246, 0.3)" name="Soğutma" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* City Distribution */}
        {cityData.length > 0 && (
          <div className="chart-card">
            <div className="chart-header">
              <Building2 size={20} />
              <h3>İl Bazlı Isı Sayacı Dağılımı</h3>
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={cityData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis dataKey="city" type="category" tick={{ fontSize: 11, fill: '#94a3b8' }} width={70} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(30, 41, 59, 0.95)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: '8px',
                    color: '#f1f5f9'
                  }}
                />
                <Bar dataKey="sayacSayisi" fill="#EF4444" radius={[0, 4, 4, 0]} name="Sayaç Sayısı" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Real-time Heat Status */}
      <div className="heat-status-section">
        <div className="section-header">
          <Activity size={20} />
          <h3>Anlık Sistem Durumu</h3>
        </div>
        <div className="heat-status-grid">
          <div className="heat-status-card">
            <div className="status-header">
              <ThermometerSun size={24} className="text-red" />
              <span>Gidiş Hattı (T1)</span>
            </div>
            <div className="status-value text-red">{(stats?.ortalamaGirisSicaklik || 0).toFixed(1)}°C</div>
            <div className="status-bar">
              <div className="bar-fill red" style={{ width: `${Math.min((stats?.ortalamaGirisSicaklik || 0), 100)}%` }}></div>
            </div>
            <div className="status-range">
              <span>40°C</span>
              <span className="optimal">Optimal: 70-80°C</span>
              <span>90°C</span>
            </div>
          </div>

          <div className="heat-status-card">
            <div className="status-header">
              <ThermometerSnowflake size={24} className="text-blue" />
              <span>Dönüş Hattı (T2)</span>
            </div>
            <div className="status-value text-blue">{(stats?.ortalamaCikisSicaklik || 0).toFixed(1)}°C</div>
            <div className="status-bar">
              <div className="bar-fill blue" style={{ width: `${Math.min((stats?.ortalamaCikisSicaklik || 0), 100)}%` }}></div>
            </div>
            <div className="status-range">
              <span>30°C</span>
              <span className="optimal">Optimal: 45-55°C</span>
              <span>70°C</span>
            </div>
          </div>

          <div className="heat-status-card">
            <div className="status-header">
              <Droplets size={24} className="text-cyan" />
              <span>Anlık Debi</span>
            </div>
            <div className="status-value text-cyan">{(stats?.toplamDebi || 0).toFixed(1)} L/h</div>
            <div className="status-bar">
              <div className="bar-fill cyan" style={{ width: `${Math.min(((stats?.toplamDebi || 0) / 1500) * 100, 100)}%` }}></div>
            </div>
            <div className="status-range">
              <span>0</span>
              <span className="optimal">Normal Aralık</span>
              <span>1500 L/h</span>
            </div>
          </div>

          <div className="heat-status-card">
            <div className="status-header">
              <Zap size={24} className="text-yellow" />
              <span>Anlık Güç</span>
            </div>
            <div className="status-value text-yellow">{((stats?.toplamDebi || 0) * (stats?.ortalamaDeltaT || 0) * 1.163 / 1000).toFixed(1)} kW</div>
            <div className="status-bar">
              <div className="bar-fill yellow" style={{ width: `${Math.min((((stats?.toplamDebi || 0) * (stats?.ortalamaDeltaT || 0) * 1.163 / 1000) / 100) * 100, 100)}%` }}></div>
            </div>
            <div className="status-range">
              <span>0</span>
              <span className="optimal">Q = m × ΔT × c</span>
              <span>100 kW</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Prediction Section */}
      <div className="ai-section">
        <AIPrediction
          siteId={stats?.enAktifSite || 1}
          siteName="Merkezi Isıtma Sistemi"
        />
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <div className="section-header">
          <TrendingUp size={20} />
          <h3>Hızlı Erişim</h3>
        </div>
        <div className="action-grid">
          <Link to="/sites" className="action-card">
            <span className="action-icon"><Building2 size={24} /></span>
            <span>Site Yönetimi</span>
          </Link>
          <Link to="/meters" className="action-card heat">
            <span className="action-icon"><Thermometer size={24} /></span>
            <span>Isı Sayaçları</span>
          </Link>
          <Link to="/live-mbus" className="action-card">
            <span className="action-icon"><Radio size={24} /></span>
            <span>Canlı M-Bus</span>
          </Link>
          <Link to="/billing" className="action-card">
            <span className="action-icon"><Receipt size={24} /></span>
            <span>Faturalandırma</span>
          </Link>
          <Link to="/reports" className="action-card">
            <span className="action-icon"><FileText size={24} /></span>
            <span>Raporlar</span>
          </Link>
          <Link to="/ai" className="action-card">
            <span className="action-icon"><Bot size={24} /></span>
            <span>AI Asistan</span>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="activity-section">
        <div className="activity-card">
          <div className="card-header">
            <Calendar size={20} />
            <h3>Okuma Durumu</h3>
          </div>
          <div className="activity-stats">
            <div className="activity-item">
              <span className="activity-value">{(stats?.bugunOkunan || 0).toLocaleString()}</span>
              <span className="activity-label">Bugün Okunan</span>
            </div>
            <div className="activity-item">
              <span className="activity-value">{(stats?.haftaOkunan || 0).toLocaleString()}</span>
              <span className="activity-label">Bu Hafta</span>
            </div>
            <div className="activity-item">
              <span className="activity-value">{(stats?.aktifSayac || 0).toLocaleString()}</span>
              <span className="activity-label">Aktif Sayaç</span>
            </div>
          </div>
        </div>

        <div className="activity-card heat">
          <div className="card-header">
            <Flame size={20} />
            <h3>Enerji Özeti</h3>
          </div>
          <div className="activity-stats">
            <div className="activity-item">
              <span className="activity-value">{formatEnergy(stats?.gunlukEnerji || 0)}</span>
              <span className="activity-label">Günlük Tüketim</span>
            </div>
            <div className="activity-item">
              <span className="activity-value">{formatEnergy(stats?.aylikEnerji || 0)}</span>
              <span className="activity-label">Aylık Tüketim</span>
            </div>
          </div>
        </div>

        <div className="activity-card">
          <div className="card-header">
            <Home size={20} />
            <h3>Daire Bilgisi</h3>
          </div>
          <div className="activity-stats">
            <div className="activity-item">
              <span className="activity-value">{(stats?.toplamDaire || 0).toLocaleString()}</span>
              <span className="activity-label">Toplam Daire</span>
            </div>
            <div className="activity-item">
              <span className="activity-value">{(stats?.toplamIlce || 0).toLocaleString()}</span>
              <span className="activity-label">Toplam İlçe</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
