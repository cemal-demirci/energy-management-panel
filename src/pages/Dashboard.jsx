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

  useEffect(() => {
    fetchData();
    // Simulate real-time temperature data
    generateTemperatureData();
    generateEnergyTrend();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [statsRes, cityRes] = await Promise.all([
        fetch('/api/dashboard'),
        fetch('/api/analytics/by-city')
      ]);

      const statsData = await statsRes.json();
      const cityDataRes = await cityRes.json();

      setStats(statsData);
      setCityData(cityDataRes.slice(0, 10));
    } catch (err) {
      console.error('Dashboard error:', err);
      // Demo data for heat meters
      setStats({
        toplamIl: 12,
        toplamSite: 48,
        toplamBina: 156,
        toplamSayac: 2847,
        toplamEnerji: 458720000, // Wh
        toplamHacim: 12450.5, // m³
        hataliSayac: 23,
        bugunOkunan: 2134,
        haftaOkunan: 18420,
        aktifSayac: 2824,
        toplamDaire: 3240,
        toplamIlce: 34,
        ortalamaGirisSicaklik: 72.5,
        ortalamaCikisSicaklik: 48.3,
        ortalamaDeltaT: 24.2,
        toplamDebi: 845.6,
        gunlukEnerji: 15840000,
        aylikEnerji: 458720000
      });
      setCityData([
        { city: 'İstanbul', sayacSayisi: 1245, toplamEnerji: 185000000 },
        { city: 'Ankara', sayacSayisi: 520, toplamEnerji: 98000000 },
        { city: 'İzmir', sayacSayisi: 380, toplamEnerji: 72000000 },
        { city: 'Bursa', sayacSayisi: 245, toplamEnerji: 48000000 },
        { city: 'Antalya', sayacSayisi: 180, toplamEnerji: 28000000 },
        { city: 'Konya', sayacSayisi: 145, toplamEnerji: 22000000 }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const generateTemperatureData = () => {
    const data = [];
    const now = new Date();
    for (let i = 23; i >= 0; i--) {
      const hour = new Date(now - i * 3600000);
      data.push({
        time: hour.getHours() + ':00',
        girisSicaklik: 70 + Math.random() * 10,
        cikisSicaklik: 45 + Math.random() * 10,
        deltaT: 20 + Math.random() * 8
      });
    }
    setTemperatureData(data);
  };

  const generateEnergyTrend = () => {
    const data = [];
    const months = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
    for (let i = 0; i < 12; i++) {
      // Heating season pattern - higher in winter months
      const seasonFactor = i < 4 || i > 9 ? 1.5 : 0.3;
      data.push({
        month: months[i],
        isitma: Math.floor(80000 * seasonFactor + Math.random() * 20000),
        sogutma: Math.floor(30000 * (1 - seasonFactor * 0.5) + Math.random() * 10000)
      });
    }
    setEnergyTrend(data);
  };

  const COLORS = ['#EF4444', '#F97316', '#EAB308', '#22C55E', '#3B82F6', '#8B5CF6'];

  const formatEnergy = (num) => {
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

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div className="header-title">
          <LayoutDashboard size={28} />
          <div>
            <h1>Isı Sayacı Dashboard</h1>
            <p className="subtitle">Merkezi Isıtma Sistemi Yönetimi</p>
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

      {/* Energy Charts Row */}
      <div className="charts-row">
        {/* Monthly Energy Trend */}
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

        {/* City Distribution */}
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
            <div className="status-value text-red">{(stats?.ortalamaGirisSicaklik || 72.5).toFixed(1)}°C</div>
            <div className="status-bar">
              <div className="bar-fill red" style={{ width: `${(stats?.ortalamaGirisSicaklik || 72.5)}%` }}></div>
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
            <div className="status-value text-blue">{(stats?.ortalamaCikisSicaklik || 48.3).toFixed(1)}°C</div>
            <div className="status-bar">
              <div className="bar-fill blue" style={{ width: `${(stats?.ortalamaCikisSicaklik || 48.3)}%` }}></div>
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
            <div className="status-value text-cyan">{(stats?.toplamDebi || 845.6).toFixed(1)} L/h</div>
            <div className="status-bar">
              <div className="bar-fill cyan" style={{ width: '65%' }}></div>
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
            <div className="status-value text-yellow">{((stats?.toplamDebi || 845.6) * (stats?.ortalamaDeltaT || 24.2) * 1.163 / 1000).toFixed(1)} kW</div>
            <div className="status-bar">
              <div className="bar-fill yellow" style={{ width: '48%' }}></div>
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
