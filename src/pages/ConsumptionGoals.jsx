import React, { useState, useEffect } from 'react';
import {
  Target,
  TrendingUp,
  TrendingDown,
  Zap,
  Droplets,
  Flame,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Building2,
  Award,
  Flag,
  BarChart3,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

function ConsumptionGoals() {
  const [goals, setGoals] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);
  const [activeTab, setActiveTab] = useState('active');
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
    loadGoals();
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

  const loadGoals = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/consumption-goals');
      const data = await safeJson(res);

      if (data) {
        setGoals(data.goals || data || []);
      } else {
        // Demo data
        setGoals([
          { id: 1, name: 'Kış Dönemi Tasarruf', type: 'energy', site: 'Merkez Site', targetValue: 100000, currentValue: 85000, status: 'on_track', startDate: '2024-12-01', endDate: '2025-02-28', progress: 85 },
          { id: 2, name: 'Su Tüketimi Azaltma', type: 'water', site: 'Tüm Siteler', targetValue: 5000, currentValue: 4200, status: 'on_track', startDate: '2024-01-01', endDate: '2024-12-31', progress: 84 },
          { id: 3, name: 'Enerji Verimliliği', type: 'energy', site: 'Kuzey Site', targetValue: 50000, currentValue: 48000, status: 'at_risk', startDate: '2024-10-01', endDate: '2025-01-31', progress: 96 }
        ]);
      }

    } catch (err) {
      console.error('Goals load error:', err);
      setGoals([]);
    } finally {
      setLoading(false);
    }
  };

  const [newGoal, setNewGoal] = useState({
    name: '',
    type: 'energy',
    site: '',
    targetValue: '',
    startDate: '',
    endDate: ''
  });

  const getTypeIcon = (type) => {
    switch(type) {
      case 'energy': return <Zap size={20} className="type-icon energy" />;
      case 'water': return <Droplets size={20} className="type-icon water" />;
      case 'gas': return <Flame size={20} className="type-icon gas" />;
      default: return <Target size={20} />;
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'on_track':
        return <span className="status-badge success"><CheckCircle size={14} /> Yolunda</span>;
      case 'at_risk':
        return <span className="status-badge warning"><AlertTriangle size={14} /> Risk Altında</span>;
      case 'completed':
        return <span className="status-badge completed"><Award size={14} /> Tamamlandı</span>;
      case 'failed':
        return <span className="status-badge danger"><AlertTriangle size={14} /> Başarısız</span>;
      default:
        return <span className="status-badge">{status}</span>;
    }
  };

  const getProgressColor = (progress, status) => {
    if (status === 'completed') return '#10B981';
    if (progress > 100) return '#EF4444';
    if (progress > 90) return '#F59E0B';
    return '#3B82F6';
  };

  const handleAddGoal = () => {
    if (!newGoal.name || !newGoal.targetValue) return;

    setGoals([...goals, {
      id: goals.length + 1,
      ...newGoal,
      currentValue: 0,
      unit: newGoal.type === 'water' || newGoal.type === 'gas' ? 'm³' : 'kWh',
      status: 'on_track',
      progress: 0,
      trend: []
    }]);
    setNewGoal({ name: '', type: 'energy', site: '', targetValue: '', startDate: '', endDate: '' });
    setShowAddModal(false);
  };

  const activeGoals = goals.filter(g => g.status !== 'completed' && g.status !== 'failed');
  const completedGoals = goals.filter(g => g.status === 'completed' || g.status === 'failed');

  const overallStats = {
    total: goals.length,
    onTrack: goals.filter(g => g.status === 'on_track').length,
    atRisk: goals.filter(g => g.status === 'at_risk').length,
    completed: goals.filter(g => g.status === 'completed').length
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Hedef verileri yükleniyor...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <AlertTriangle size={48} />
        <h3>Veri Yüklenemedi</h3>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={loadGoals}>
          <RefreshCw size={18} />
          Tekrar Dene
        </button>
      </div>
    );
  }

  return (
    <div className="goals-page">
      <div className="page-header">
        <div className="header-title">
          <Target size={28} />
          <div>
            <h1>Tüketim Hedefleri</h1>
            <p className="subtitle">Enerji tasarrufu hedefleri ve takip</p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={18} />
          Yeni Hedef
        </button>
      </div>

      {/* Stats */}
      <div className="goals-stats-grid">
        <div className="goal-stat-card">
          <Flag size={24} />
          <div className="stat-info">
            <span className="stat-value">{overallStats.total}</span>
            <span className="stat-label">Toplam Hedef</span>
          </div>
        </div>
        <div className="goal-stat-card success">
          <CheckCircle size={24} />
          <div className="stat-info">
            <span className="stat-value">{overallStats.onTrack}</span>
            <span className="stat-label">Yolunda</span>
          </div>
        </div>
        <div className="goal-stat-card warning">
          <AlertTriangle size={24} />
          <div className="stat-info">
            <span className="stat-value">{overallStats.atRisk}</span>
            <span className="stat-label">Risk Altında</span>
          </div>
        </div>
        <div className="goal-stat-card completed">
          <Award size={24} />
          <div className="stat-info">
            <span className="stat-value">{overallStats.completed}</span>
            <span className="stat-label">Tamamlanan</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <button
          className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          <Target size={18} />
          Aktif Hedefler ({activeGoals.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'completed' ? 'active' : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          <Award size={18} />
          Tamamlanan ({completedGoals.length})
        </button>
      </div>

      {/* Goals Grid */}
      <div className="goals-grid">
        {(activeTab === 'active' ? activeGoals : completedGoals).map(goal => (
          <div key={goal.id} className={`goal-card ${goal.status}`} onClick={() => setSelectedGoal(goal)}>
            <div className="goal-header">
              <div className="goal-type">
                {getTypeIcon(goal.type)}
                <span className="goal-site">{goal.site}</span>
              </div>
              {getStatusBadge(goal.status)}
            </div>

            <h3 className="goal-name">{goal.name}</h3>

            <div className="goal-progress-section">
              <div className="progress-header">
                <span className="current-value">
                  {goal.currentValue.toLocaleString()} {goal.unit}
                </span>
                <span className="target-value">
                  / {goal.targetValue.toLocaleString()} {goal.unit}
                </span>
              </div>
              <div className="progress-bar-container">
                <div
                  className="progress-bar-fill"
                  style={{
                    width: `${Math.min(goal.progress, 100)}%`,
                    backgroundColor: getProgressColor(goal.progress, goal.status)
                  }}
                />
              </div>
              <div className="progress-percent" style={{ color: getProgressColor(goal.progress, goal.status) }}>
                {goal.progress > 100 ? (
                  <><TrendingUp size={14} /> %{goal.progress.toFixed(1)} (Aşıldı)</>
                ) : (
                  <><TrendingDown size={14} /> %{goal.progress.toFixed(1)}</>
                )}
              </div>
            </div>

            <div className="goal-dates">
              <Calendar size={14} />
              <span>{goal.startDate} - {goal.endDate}</span>
            </div>

            {goal.trend.length > 0 && (
              <div className="goal-mini-chart">
                <ResponsiveContainer width="100%" height={60}>
                  <LineChart data={goal.trend}>
                    <Line
                      type="monotone"
                      dataKey="actual"
                      stroke={getProgressColor(goal.progress, goal.status)}
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="target"
                      stroke="#64748b"
                      strokeWidth={1}
                      strokeDasharray="3 3"
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="goal-actions">
              <button className="btn btn-sm btn-outline">
                <BarChart3 size={14} /> Detay
              </button>
              <button className="btn btn-sm btn-icon"><Edit size={14} /></button>
              <button className="btn btn-sm btn-icon danger"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>

      {/* Goal Detail Modal */}
      {selectedGoal && (
        <div className="modal-overlay" onClick={() => setSelectedGoal(null)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title-row">
                {getTypeIcon(selectedGoal.type)}
                <h2>{selectedGoal.name}</h2>
                {getStatusBadge(selectedGoal.status)}
              </div>
              <button className="close-btn" onClick={() => setSelectedGoal(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="goal-detail-stats">
                <div className="detail-stat">
                  <span className="detail-label">Hedef</span>
                  <span className="detail-value">{selectedGoal.targetValue.toLocaleString()} {selectedGoal.unit}</span>
                </div>
                <div className="detail-stat">
                  <span className="detail-label">Güncel</span>
                  <span className="detail-value">{selectedGoal.currentValue.toLocaleString()} {selectedGoal.unit}</span>
                </div>
                <div className="detail-stat">
                  <span className="detail-label">Kalan</span>
                  <span className="detail-value">{(selectedGoal.targetValue - selectedGoal.currentValue).toLocaleString()} {selectedGoal.unit}</span>
                </div>
                <div className="detail-stat">
                  <span className="detail-label">İlerleme</span>
                  <span className="detail-value" style={{ color: getProgressColor(selectedGoal.progress, selectedGoal.status) }}>
                    %{selectedGoal.progress.toFixed(1)}
                  </span>
                </div>
              </div>

              {selectedGoal.trend.length > 0 && (
                <div className="goal-detail-chart">
                  <h3>Haftalık Trend</h3>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={selectedGoal.trend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
                      <XAxis dataKey="week" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                      <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(30, 41, 59, 0.95)',
                          border: '1px solid rgba(148, 163, 184, 0.2)',
                          borderRadius: '8px',
                          color: '#f1f5f9'
                        }}
                      />
                      <ReferenceLine y={selectedGoal.trend[0]?.target} stroke="#10B981" strokeDasharray="5 5" label="Hedef" />
                      <Bar dataKey="actual" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Gerçekleşen" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Goal Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2><Plus size={20} /> Yeni Hedef Ekle</h2>
              <button className="close-btn" onClick={() => setShowAddModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Hedef Adı</label>
                <input
                  type="text"
                  value={newGoal.name}
                  onChange={e => setNewGoal({...newGoal, name: e.target.value})}
                  placeholder="Örn: Q1 2025 Enerji Tasarrufu"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Tür</label>
                  <select
                    value={newGoal.type}
                    onChange={e => setNewGoal({...newGoal, type: e.target.value})}
                  >
                    <option value="energy">Elektrik (kWh)</option>
                    <option value="water">Su (m³)</option>
                    <option value="gas">Doğalgaz (m³)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Site</label>
                  <select
                    value={newGoal.site}
                    onChange={e => setNewGoal({...newGoal, site: e.target.value})}
                  >
                    <option value="">Tüm Siteler</option>
                    {sites.map(site => (
                      <option key={site.id || site.siteId} value={site.name || site.siteName}>
                        {site.name || site.siteName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Hedef Değer</label>
                <input
                  type="number"
                  value={newGoal.targetValue}
                  onChange={e => setNewGoal({...newGoal, targetValue: e.target.value})}
                  placeholder="Maksimum tüketim miktarı"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Başlangıç</label>
                  <input
                    type="date"
                    value={newGoal.startDate}
                    onChange={e => setNewGoal({...newGoal, startDate: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Bitiş</label>
                  <input
                    type="date"
                    value={newGoal.endDate}
                    onChange={e => setNewGoal({...newGoal, endDate: e.target.value})}
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>İptal</button>
              <button className="btn btn-primary" onClick={handleAddGoal}>Hedef Ekle</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ConsumptionGoals;
