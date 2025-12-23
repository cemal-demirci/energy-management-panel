import React, { useState, useEffect } from 'react';
import {
  Leaf,
  TrendingDown,
  TrendingUp,
  Factory,
  Zap,
  Droplets,
  TreeDeciduous,
  Car,
  Home,
  Calendar,
  Download,
  RefreshCw,
  Award,
  Target,
  BarChart3,
  PieChart,
  Info
} from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart as RechartsPie, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

function CarbonFootprint() {
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [selectedSite, setSelectedSite] = useState('all');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  useEffect(() => {
    calculateFootprint();
  }, [selectedPeriod, selectedSite]);

  const calculateFootprint = () => {
    setLoading(true);
    setTimeout(() => {
      setData({
        totalCO2: 125.8,
        previousCO2: 142.3,
        change: -11.6,
        energyCO2: 98.5,
        waterCO2: 12.3,
        gasCO2: 15.0,
        treesNeeded: 6,
        carKmEquivalent: 512,
        householdsEquivalent: 2.8,
        monthlyTrend: [
          { month: 'Oca', co2: 145, target: 140 },
          { month: 'Şub', co2: 138, target: 138 },
          { month: 'Mar', co2: 142, target: 136 },
          { month: 'Nis', co2: 135, target: 134 },
          { month: 'May', co2: 128, target: 132 },
          { month: 'Haz', co2: 132, target: 130 },
          { month: 'Tem', co2: 140, target: 128 },
          { month: 'Ağu', co2: 138, target: 126 },
          { month: 'Eyl', co2: 130, target: 124 },
          { month: 'Eki', co2: 128, target: 122 },
          { month: 'Kas', co2: 132, target: 120 },
          { month: 'Ara', co2: 125.8, target: 118 },
        ],
        bySource: [
          { name: 'Elektrik', value: 98.5, color: '#3B82F6' },
          { name: 'Doğalgaz', value: 15.0, color: '#F59E0B' },
          { name: 'Su', value: 12.3, color: '#10B981' },
        ],
        bySite: [
          { site: 'Site A', co2: 45.2 },
          { site: 'Site B', co2: 32.1 },
          { site: 'Site C', co2: 28.5 },
          { site: 'Site D', co2: 12.0 },
          { site: 'Diğer', co2: 8.0 },
        ],
        achievements: [
          { id: 1, title: 'Yeşil Başlangıç', desc: '%5 azaltım', earned: true, icon: Leaf },
          { id: 2, title: 'Eko Savaşçı', desc: '%10 azaltım', earned: true, icon: Award },
          { id: 3, title: 'Karbon Nötr', desc: '%25 azaltım', earned: false, icon: Target },
          { id: 4, title: 'Sürdürülebilir', desc: '%50 azaltım', earned: false, icon: TreeDeciduous },
        ],
        tips: [
          'LED aydınlatmaya geçiş yaparak %15 enerji tasarrufu sağlayabilirsiniz.',
          'Isıtma sistemlerini optimize ederek karbon emisyonunu %20 azaltabilirsiniz.',
          'Yenilenebilir enerji kaynakları kullanımını artırın.',
          'Akıllı sayaçlar ile tüketimi gerçek zamanlı izleyin.',
        ]
      });
      setLoading(false);
    }, 1000);
  };

  const COLORS = ['#3B82F6', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6'];

  // CO2 emission factors (kg CO2 per unit)
  const emissionFactors = {
    electricity: 0.5, // kg CO2 per kWh
    naturalGas: 2.0,  // kg CO2 per m³
    water: 0.3        // kg CO2 per m³
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Karbon ayak izi hesaplanıyor...</p>
      </div>
    );
  }

  return (
    <div className="carbon-page">
      <div className="page-header">
        <div className="header-title">
          <Leaf size={28} />
          <div>
            <h1>Karbon Ayak İzi</h1>
            <p className="subtitle">CO₂ emisyon takibi ve çevresel etki analizi</p>
          </div>
        </div>
        <div className="header-actions">
          <select value={selectedPeriod} onChange={e => setSelectedPeriod(e.target.value)}>
            <option value="week">Bu Hafta</option>
            <option value="month">Bu Ay</option>
            <option value="quarter">Bu Çeyrek</option>
            <option value="year">Bu Yıl</option>
          </select>
          <button className="btn btn-secondary" onClick={calculateFootprint}>
            <RefreshCw size={18} />
            Yenile
          </button>
          <button className="btn btn-primary">
            <Download size={18} />
            Rapor İndir
          </button>
        </div>
      </div>

      {data && (
        <>
          {/* Main Stats */}
          <div className="carbon-stats-grid">
            <div className="carbon-main-stat">
              <div className="main-stat-icon">
                <Factory size={40} />
              </div>
              <div className="main-stat-content">
                <span className="main-stat-value">{data.totalCO2}</span>
                <span className="main-stat-unit">ton CO₂</span>
                <span className="main-stat-label">Toplam Emisyon</span>
                <div className={`change-badge ${data.change < 0 ? 'positive' : 'negative'}`}>
                  {data.change < 0 ? <TrendingDown size={16} /> : <TrendingUp size={16} />}
                  {Math.abs(data.change)}% {data.change < 0 ? 'azaldı' : 'arttı'}
                </div>
              </div>
            </div>

            <div className="carbon-stat-card">
              <Zap size={24} className="stat-icon electricity" />
              <div className="stat-info">
                <span className="stat-value">{data.energyCO2} ton</span>
                <span className="stat-label">Elektrik Kaynaklı</span>
              </div>
            </div>

            <div className="carbon-stat-card">
              <Factory size={24} className="stat-icon gas" />
              <div className="stat-info">
                <span className="stat-value">{data.gasCO2} ton</span>
                <span className="stat-label">Doğalgaz Kaynaklı</span>
              </div>
            </div>

            <div className="carbon-stat-card">
              <Droplets size={24} className="stat-icon water" />
              <div className="stat-info">
                <span className="stat-value">{data.waterCO2} ton</span>
                <span className="stat-label">Su Kaynaklı</span>
              </div>
            </div>
          </div>

          {/* Equivalents */}
          <div className="equivalents-section">
            <h3>Bu Emisyon Ne Demek?</h3>
            <div className="equivalents-grid">
              <div className="equivalent-card">
                <TreeDeciduous size={32} className="eq-icon trees" />
                <div className="eq-info">
                  <span className="eq-value">{data.treesNeeded}</span>
                  <span className="eq-label">Ağacın yıllık emilimi</span>
                </div>
              </div>
              <div className="equivalent-card">
                <Car size={32} className="eq-icon car" />
                <div className="eq-info">
                  <span className="eq-value">{data.carKmEquivalent} km</span>
                  <span className="eq-label">Araçla yolculuk</span>
                </div>
              </div>
              <div className="equivalent-card">
                <Home size={32} className="eq-icon home" />
                <div className="eq-info">
                  <span className="eq-value">{data.householdsEquivalent}</span>
                  <span className="eq-label">Hanenin aylık emisyonu</span>
                </div>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="carbon-charts-row">
            {/* Trend Chart */}
            <div className="chart-card">
              <div className="chart-header">
                <BarChart3 size={20} />
                <h3>Aylık CO₂ Trendi</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.monthlyTrend}>
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
                  <Line type="monotone" dataKey="co2" stroke="#EF4444" strokeWidth={2} name="Gerçek" dot={{ fill: '#EF4444' }} />
                  <Line type="monotone" dataKey="target" stroke="#10B981" strokeWidth={2} strokeDasharray="5 5" name="Hedef" dot={{ fill: '#10B981' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Source Distribution */}
            <div className="chart-card">
              <div className="chart-header">
                <PieChart size={20} />
                <h3>Kaynak Dağılımı</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPie>
                  <Pie
                    data={data.bySource}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {data.bySource.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => `${value} ton CO₂`}
                    contentStyle={{
                      backgroundColor: 'rgba(30, 41, 59, 0.95)',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      borderRadius: '8px',
                      color: '#f1f5f9'
                    }}
                  />
                </RechartsPie>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Site Comparison */}
          <div className="chart-card full-width">
            <div className="chart-header">
              <BarChart3 size={20} />
              <h3>Site Bazlı Emisyon</h3>
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={data.bySite} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
                <XAxis type="number" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis dataKey="site" type="category" tick={{ fontSize: 12, fill: '#94a3b8' }} width={80} />
                <Tooltip
                  formatter={(value) => `${value} ton CO₂`}
                  contentStyle={{
                    backgroundColor: 'rgba(30, 41, 59, 0.95)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: '8px',
                    color: '#f1f5f9'
                  }}
                />
                <Bar dataKey="co2" fill="#10B981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Achievements & Tips */}
          <div className="carbon-bottom-row">
            {/* Achievements */}
            <div className="achievements-card">
              <div className="card-header">
                <Award size={20} />
                <h3>Başarılar</h3>
              </div>
              <div className="achievements-grid">
                {data.achievements.map(achievement => {
                  const IconComponent = achievement.icon;
                  return (
                    <div key={achievement.id} className={`achievement-item ${achievement.earned ? 'earned' : 'locked'}`}>
                      <div className="achievement-icon">
                        <IconComponent size={24} />
                      </div>
                      <div className="achievement-info">
                        <span className="achievement-title">{achievement.title}</span>
                        <span className="achievement-desc">{achievement.desc}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tips */}
            <div className="tips-card">
              <div className="card-header">
                <Info size={20} />
                <h3>Tasarruf Önerileri</h3>
              </div>
              <div className="tips-list">
                {data.tips.map((tip, index) => (
                  <div key={index} className="tip-item">
                    <Leaf size={16} className="tip-icon" />
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Emission Factors Info */}
          <div className="info-card">
            <div className="card-header">
              <Info size={20} />
              <h3>Hesaplama Yöntemi</h3>
            </div>
            <div className="factors-grid">
              <div className="factor-item">
                <Zap size={18} />
                <span>Elektrik: {emissionFactors.electricity} kg CO₂/kWh</span>
              </div>
              <div className="factor-item">
                <Factory size={18} />
                <span>Doğalgaz: {emissionFactors.naturalGas} kg CO₂/m³</span>
              </div>
              <div className="factor-item">
                <Droplets size={18} />
                <span>Su: {emissionFactors.water} kg CO₂/m³</span>
              </div>
            </div>
            <p className="factor-note">
              * Emisyon faktörleri Türkiye Ulusal Sera Gazı Envanteri raporuna dayanmaktadır.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

export default CarbonFootprint;
