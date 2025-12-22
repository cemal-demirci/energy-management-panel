import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [cityData, setCityData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
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
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  const formatNumber = (num) => {
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
        <h1>📊 Dashboard</h1>
        <p className="subtitle">Enerji Yönetim Sistemi Genel Bakış</p>
      </div>

      {/* Stats Cards */}
      <div className="stats-grid">
        <div className="stat-card gradient-blue">
          <div className="stat-icon">📍</div>
          <div className="stat-content">
            <span className="stat-value">{stats?.toplamIl || 0}</span>
            <span className="stat-label">İl</span>
          </div>
        </div>

        <div className="stat-card gradient-green">
          <div className="stat-icon">🏢</div>
          <div className="stat-content">
            <span className="stat-value">{stats?.toplamSite || 0}</span>
            <span className="stat-label">Site</span>
          </div>
        </div>

        <div className="stat-card gradient-purple">
          <div className="stat-icon">🏠</div>
          <div className="stat-content">
            <span className="stat-value">{(stats?.toplamBina || 0).toLocaleString()}</span>
            <span className="stat-label">Bina</span>
          </div>
        </div>

        <div className="stat-card gradient-orange">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <span className="stat-value">{(stats?.toplamSayac || 0).toLocaleString()}</span>
            <span className="stat-label">Sayaç</span>
          </div>
        </div>

        <div className="stat-card gradient-cyan">
          <div className="stat-icon">⚡</div>
          <div className="stat-content">
            <span className="stat-value">{formatNumber(stats?.toplamEnerji || 0)}</span>
            <span className="stat-label">Toplam Enerji</span>
          </div>
        </div>

        <div className="stat-card gradient-red">
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <span className="stat-value">{(stats?.hataliSayac || 0).toLocaleString()}</span>
            <span className="stat-label">Hatalı Sayaç</span>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="charts-row">
        {/* City Distribution */}
        <div className="chart-card">
          <h3>🏙️ İl Bazlı Sayaç Dağılımı</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={cityData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="city" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="sayacSayisi" fill="#3B82F6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Energy by City */}
        <div className="chart-card">
          <h3>⚡ İl Bazlı Enerji Tüketimi</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={cityData.slice(0, 6)}
                dataKey="toplamEnerji"
                nameKey="city"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              >
                {cityData.slice(0, 6).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatNumber(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h3>🚀 Hızlı Erişim</h3>
        <div className="action-grid">
          <Link to="/sites" className="action-card">
            <span className="action-icon">🏢</span>
            <span>Site Yönetimi</span>
          </Link>
          <Link to="/meters" className="action-card">
            <span className="action-icon">📊</span>
            <span>Sayaçlar</span>
          </Link>
          <Link to="/mbus" className="action-card">
            <span className="action-icon">📡</span>
            <span>M-Bus Okuma</span>
          </Link>
          <Link to="/billing" className="action-card">
            <span className="action-icon">💰</span>
            <span>Faturalandırma</span>
          </Link>
          <Link to="/analytics" className="action-card">
            <span className="action-icon">📉</span>
            <span>Analitik</span>
          </Link>
          <Link to="/ai" className="action-card">
            <span className="action-icon">🤖</span>
            <span>AI Asistan</span>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="activity-section">
        <div className="activity-card">
          <h3>📅 Okuma Durumu</h3>
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

        <div className="activity-card">
          <h3>🏠 Daire Bilgisi</h3>
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
