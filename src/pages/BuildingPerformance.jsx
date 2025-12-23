import React, { useState, useEffect } from 'react';
import {
  Building2,
  Zap,
  Droplets,
  Thermometer,
  TrendingUp,
  TrendingDown,
  Award,
  Star,
  AlertTriangle,
  CheckCircle,
  Target,
  Leaf,
  BarChart3,
  RefreshCw,
  Download,
  Filter,
  ChevronRight,
  Info
} from 'lucide-react';
import { RadialBarChart, RadialBar, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from 'recharts';

function BuildingPerformance() {
  const [buildings, setBuildings] = useState([]);
  const [selectedBuilding, setSelectedBuilding] = useState(null);
  const [filterSite, setFilterSite] = useState('');
  const [sortBy, setSortBy] = useState('score');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sites, setSites] = useState([]);

  const safeJson = async (res) => {
    try {
      const ct = res.headers.get('content-type');
      if (res.ok && ct?.includes('application/json')) return await res.json();
    } catch {}
    return null;
  };

  useEffect(() => {
    loadBuildings();
    loadSites();
  }, []);

  const loadSites = async () => {
    try {
      const res = await fetch('/api/sites?limit=500');
      const data = await safeJson(res);
      if (data) setSites(data.sites || data || []);
    } catch (err) {
      console.error('Sites load error:', err);
    }
  };

  const loadBuildings = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/buildings/performance');
      const data = await safeJson(res);

      if (data) {
        setBuildings(data.buildings || data || []);
      } else {
        // Demo data
        setBuildings([
          { id: 1, name: 'A Blok', site: 'Merkez Site', score: 92, grade: 'A', issues: [], consumption: { energy: 45000, water: 1200 }, trend: 'up' },
          { id: 2, name: 'B Blok', site: 'Merkez Site', score: 78, grade: 'B+', issues: ['Yalıtım sorunu'], consumption: { energy: 62000, water: 1500 }, trend: 'stable' },
          { id: 3, name: 'C Blok', site: 'Kuzey Site', score: 65, grade: 'C', issues: ['Eski sistem', 'Bakım gerekli'], consumption: { energy: 85000, water: 2100 }, trend: 'down' }
        ]);
      }

    } catch (err) {
      console.error('Buildings load error:', err);
      setBuildings([]);
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (grade) => {
    if (grade.startsWith('A')) return '#10B981';
    if (grade.startsWith('B')) return '#3B82F6';
    if (grade.startsWith('C')) return '#F59E0B';
    return '#EF4444';
  };

  const getScoreColor = (score) => {
    if (score >= 90) return '#10B981';
    if (score >= 75) return '#3B82F6';
    if (score >= 60) return '#F59E0B';
    return '#EF4444';
  };

  const getTrendIcon = (trend) => {
    switch(trend) {
      case 'up': return <TrendingUp size={16} className="text-green" />;
      case 'down': return <TrendingDown size={16} className="text-red" />;
      default: return <span className="text-gray">—</span>;
    }
  };

  const filteredBuildings = buildings
    .filter(b => !filterSite || b.site === filterSite)
    .sort((a, b) => {
      if (sortBy === 'score') return b.score - a.score;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'energy') return a.consumption.energy - b.consumption.energy;
      return 0;
    });

  const overallStats = {
    avgScore: Math.round(buildings.reduce((sum, b) => sum + b.score, 0) / buildings.length),
    excellent: buildings.filter(b => b.score >= 90).length,
    good: buildings.filter(b => b.score >= 75 && b.score < 90).length,
    needsWork: buildings.filter(b => b.score < 75).length,
    totalIssues: buildings.reduce((sum, b) => sum + b.issues.length, 0)
  };

  const COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444'];

  const gradeDistribution = [
    { name: 'A+/A', value: buildings.filter(b => b.grade.startsWith('A')).length, color: '#10B981' },
    { name: 'B+/B', value: buildings.filter(b => b.grade.startsWith('B')).length, color: '#3B82F6' },
    { name: 'C+/C', value: buildings.filter(b => b.grade.startsWith('C')).length, color: '#F59E0B' },
    { name: 'D+/D', value: buildings.filter(b => b.grade.startsWith('D')).length, color: '#EF4444' },
  ].filter(g => g.value > 0);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Performans verileri yükleniyor...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <AlertTriangle size={48} />
        <h3>Veri Yüklenemedi</h3>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={loadBuildings}>
          <RefreshCw size={18} />
          Tekrar Dene
        </button>
      </div>
    );
  }

  return (
    <div className="performance-page">
      <div className="page-header">
        <div className="header-title">
          <Award size={28} />
          <div>
            <h1>Bina Performans Skoru</h1>
            <p className="subtitle">Enerji verimliliği değerlendirmesi</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={loadBuildings}>
            <RefreshCw size={18} />
            Yenile
          </button>
          <button className="btn btn-primary">
            <Download size={18} />
            Rapor İndir
          </button>
        </div>
      </div>

      {/* Overall Stats */}
      <div className="performance-stats-grid">
        <div className="perf-stat-card main">
          <div className="perf-score-circle" style={{ borderColor: getScoreColor(overallStats.avgScore) }}>
            <span className="score-value">{overallStats.avgScore}</span>
            <span className="score-label">Ortalama</span>
          </div>
        </div>
        <div className="perf-stat-card excellent">
          <Star size={24} />
          <div className="stat-info">
            <span className="stat-value">{overallStats.excellent}</span>
            <span className="stat-label">Mükemmel (90+)</span>
          </div>
        </div>
        <div className="perf-stat-card good">
          <CheckCircle size={24} />
          <div className="stat-info">
            <span className="stat-value">{overallStats.good}</span>
            <span className="stat-label">İyi (75-90)</span>
          </div>
        </div>
        <div className="perf-stat-card warning">
          <AlertTriangle size={24} />
          <div className="stat-info">
            <span className="stat-value">{overallStats.needsWork}</span>
            <span className="stat-label">İyileştirme Gerekli</span>
          </div>
        </div>
      </div>

      {/* Filters & Charts Row */}
      <div className="performance-row">
        <div className="chart-card small">
          <div className="chart-header">
            <BarChart3 size={20} />
            <h3>Not Dağılımı</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={gradeDistribution}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={70}
                label={({ name, value }) => `${name}: ${value}`}
              >
                {gradeDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="filters-card">
          <h3><Filter size={18} /> Filtreler</h3>
          <div className="filter-group">
            <label>Site</label>
            <select value={filterSite} onChange={e => setFilterSite(e.target.value)}>
              <option value="">Tümü</option>
              {sites.map(site => (
                <option key={site.id || site.siteId} value={site.name || site.siteName}>
                  {site.name || site.siteName}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>Sıralama</label>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="score">Puana Göre</option>
              <option value="name">İsme Göre</option>
              <option value="energy">Tüketime Göre</option>
            </select>
          </div>
        </div>
      </div>

      {/* Buildings Grid */}
      <div className="buildings-performance-grid">
        {filteredBuildings.map(building => (
          <div
            key={building.id}
            className={`building-perf-card ${selectedBuilding?.id === building.id ? 'selected' : ''}`}
            onClick={() => setSelectedBuilding(building)}
          >
            <div className="perf-card-header">
              <div className="building-info">
                <Building2 size={20} />
                <div>
                  <h3>{building.name}</h3>
                  <span className="site-label">{building.site}</span>
                </div>
              </div>
              <div className="grade-badge" style={{ backgroundColor: getGradeColor(building.grade) }}>
                {building.grade}
              </div>
            </div>

            <div className="perf-score-section">
              <div className="score-ring">
                <svg viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="rgba(148, 163, 184, 0.2)"
                    strokeWidth="8"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke={getScoreColor(building.score)}
                    strokeWidth="8"
                    strokeDasharray={`${building.score * 2.83} 283`}
                    strokeLinecap="round"
                    transform="rotate(-90 50 50)"
                  />
                </svg>
                <div className="score-text">
                  <span className="score-value">{building.score}</span>
                  <span className="score-max">/100</span>
                </div>
              </div>
              <div className="trend-indicator">
                {getTrendIcon(building.trend)}
              </div>
            </div>

            <div className="efficiency-bars">
              <div className="efficiency-item">
                <div className="eff-header">
                  <Zap size={14} />
                  <span>Enerji</span>
                  <span className="eff-value">{building.energyEfficiency}%</span>
                </div>
                <div className="eff-bar">
                  <div className="eff-fill" style={{ width: `${building.energyEfficiency}%`, backgroundColor: getScoreColor(building.energyEfficiency) }} />
                </div>
              </div>
              <div className="efficiency-item">
                <div className="eff-header">
                  <Droplets size={14} />
                  <span>Su</span>
                  <span className="eff-value">{building.waterEfficiency}%</span>
                </div>
                <div className="eff-bar">
                  <div className="eff-fill" style={{ width: `${building.waterEfficiency}%`, backgroundColor: getScoreColor(building.waterEfficiency) }} />
                </div>
              </div>
              <div className="efficiency-item">
                <div className="eff-header">
                  <Leaf size={14} />
                  <span>Karbon</span>
                  <span className="eff-value">{building.carbonScore}%</span>
                </div>
                <div className="eff-bar">
                  <div className="eff-fill" style={{ width: `${building.carbonScore}%`, backgroundColor: getScoreColor(building.carbonScore) }} />
                </div>
              </div>
            </div>

            {building.issues.length > 0 && (
              <div className="issues-section">
                <AlertTriangle size={14} />
                <span>{building.issues.length} sorun</span>
              </div>
            )}

            <button className="btn btn-sm btn-outline btn-full">
              Detay <ChevronRight size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Building Detail Modal */}
      {selectedBuilding && (
        <div className="modal-overlay" onClick={() => setSelectedBuilding(null)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-row">
                <Building2 size={24} />
                <div>
                  <h2>{selectedBuilding.name}</h2>
                  <span className="subtitle">{selectedBuilding.site}</span>
                </div>
                <div className="grade-badge large" style={{ backgroundColor: getGradeColor(selectedBuilding.grade) }}>
                  {selectedBuilding.grade}
                </div>
              </div>
              <button className="close-btn" onClick={() => setSelectedBuilding(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="detail-stats-row">
                <div className="detail-stat">
                  <span className="label">Performans Skoru</span>
                  <span className="value" style={{ color: getScoreColor(selectedBuilding.score) }}>{selectedBuilding.score}/100</span>
                </div>
                <div className="detail-stat">
                  <span className="label">Alan</span>
                  <span className="value">{selectedBuilding.area} m²</span>
                </div>
                <div className="detail-stat">
                  <span className="label">Sayaç Sayısı</span>
                  <span className="value">{selectedBuilding.meterCount}</span>
                </div>
              </div>

              <div className="detail-section">
                <h3><Zap size={18} /> Tüketim Verileri</h3>
                <div className="consumption-grid">
                  <div className="consumption-item">
                    <Zap size={20} />
                    <span className="value">{selectedBuilding.consumption.energy.toLocaleString()} kWh</span>
                    <span className="label">Elektrik</span>
                  </div>
                  <div className="consumption-item">
                    <Droplets size={20} />
                    <span className="value">{selectedBuilding.consumption.water.toLocaleString()} m³</span>
                    <span className="label">Su</span>
                  </div>
                  <div className="consumption-item">
                    <Thermometer size={20} />
                    <span className="value">{selectedBuilding.consumption.gas.toLocaleString()} m³</span>
                    <span className="label">Doğalgaz</span>
                  </div>
                </div>
              </div>

              {selectedBuilding.recommendations.length > 0 && (
                <div className="detail-section">
                  <h3><Target size={18} /> Öneriler</h3>
                  <ul className="recommendations-list">
                    {selectedBuilding.recommendations.map((rec, i) => (
                      <li key={i}><CheckCircle size={14} /> {rec}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedBuilding.issues.length > 0 && (
                <div className="detail-section warning">
                  <h3><AlertTriangle size={18} /> Sorunlar</h3>
                  <ul className="issues-list">
                    {selectedBuilding.issues.map((issue, i) => (
                      <li key={i}><AlertTriangle size={14} /> {issue}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BuildingPerformance;
