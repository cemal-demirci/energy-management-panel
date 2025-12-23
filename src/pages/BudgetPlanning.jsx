import React, { useState, useEffect } from 'react';
import {
  Calculator,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Building2,
  Plus,
  Edit,
  Trash2,
  Target,
  AlertTriangle,
  CheckCircle,
  PieChart,
  BarChart3,
  Download,
  RefreshCw,
  Zap,
  Droplets,
  Flame
} from 'lucide-react';
import { BarChart, Bar, LineChart, Line, PieChart as RechartsPie, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, ComposedChart, Area } from 'recharts';

function BudgetPlanning() {
  const [budgets, setBudgets] = useState([]);
  const [selectedYear, setSelectedYear] = useState('2024');
  const [selectedSite, setSelectedSite] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeView, setActiveView] = useState('overview');
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
    loadSites();
  }, []);

  useEffect(() => {
    loadBudgets();
  }, [selectedYear, selectedSite]);

  const loadSites = async () => {
    try {
      const res = await fetch('/api/sites?limit=500');
      const data = await safeJson(res);
      if (data) setSites(data.sites || data || []);
    } catch (err) {
      console.error('Sites load error:', err);
    }
  };

  const loadBudgets = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        year: selectedYear,
        ...(selectedSite !== 'all' && { siteId: selectedSite })
      });

      const res = await fetch(`/api/budgets?${params}`);
      const data = await safeJson(res);

      if (data) {
        setBudgets(data.budgets || data || []);
      } else {
        // Demo data
        setBudgets([
          { id: 1, category: 'Isıtma', budget: 500000, spent: 380000, forecast: 520000, color: '#EF4444' },
          { id: 2, category: 'Elektrik', budget: 300000, spent: 210000, forecast: 290000, color: '#F59E0B' },
          { id: 3, category: 'Su', budget: 150000, spent: 95000, forecast: 140000, color: '#3B82F6' },
          { id: 4, category: 'Bakım', budget: 100000, spent: 45000, forecast: 85000, color: '#10B981' }
        ]);
      }

    } catch (err) {
      console.error('Budget load error:', err);
      setBudgets([]);
    } finally {
      setLoading(false);
    }
  };

  const totalBudget = budgets.reduce((sum, b) => sum + b.budget, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
  const totalForecast = budgets.reduce((sum, b) => sum + b.forecast, 0);

  const overallProgress = Math.round((totalSpent / totalBudget) * 100);
  const forecastVariance = totalForecast - totalBudget;
  const forecastVariancePercent = Math.round((forecastVariance / totalBudget) * 100);

  const categoryDistribution = budgets.map(b => ({
    name: b.category,
    value: b.budget,
    color: b.color
  }));

  const [newBudget, setNewBudget] = useState({
    category: '',
    amount: '',
    year: '2025',
    site: ''
  });

  const handleAddBudget = () => {
    setShowAddModal(false);
    setNewBudget({ category: '', amount: '', year: '2025', site: '' });
  };

  const getStatusColor = (spent, budget) => {
    const ratio = spent / budget;
    if (ratio > 1) return '#EF4444';
    if (ratio > 0.9) return '#F59E0B';
    return '#10B981';
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Bütçe verileri yükleniyor...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <AlertTriangle size={48} />
        <h3>Veri Yüklenemedi</h3>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={loadBudgets}>
          <RefreshCw size={18} />
          Tekrar Dene
        </button>
      </div>
    );
  }

  return (
    <div className="budget-page">
      <div className="page-header">
        <div className="header-title">
          <Calculator size={28} />
          <div>
            <h1>Bütçe Planlama</h1>
            <p className="subtitle">Enerji maliyeti bütçe takibi</p>
          </div>
        </div>
        <div className="header-actions">
          <select value={selectedYear} onChange={e => setSelectedYear(e.target.value)}>
            <option value="2024">2024</option>
            <option value="2025">2025</option>
          </select>
          <button className="btn btn-secondary">
            <Download size={18} />
            Rapor
          </button>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={18} />
            Yeni Bütçe
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="budget-summary-grid">
        <div className="budget-summary-card main">
          <div className="summary-header">
            <h3>Toplam Bütçe</h3>
            <span className="year-badge">{selectedYear}</span>
          </div>
          <div className="summary-value">{totalBudget.toLocaleString()} ₺</div>
          <div className="summary-progress">
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${Math.min(overallProgress, 100)}%`,
                  backgroundColor: getStatusColor(totalSpent, totalBudget)
                }}
              />
            </div>
            <span className="progress-text">%{overallProgress} kullanıldı</span>
          </div>
        </div>

        <div className="budget-summary-card">
          <DollarSign size={24} />
          <div className="summary-info">
            <span className="summary-value">{totalSpent.toLocaleString()} ₺</span>
            <span className="summary-label">Harcanan</span>
          </div>
        </div>

        <div className="budget-summary-card">
          <Target size={24} />
          <div className="summary-info">
            <span className="summary-value">{(totalBudget - totalSpent).toLocaleString()} ₺</span>
            <span className="summary-label">Kalan</span>
          </div>
        </div>

        <div className={`budget-summary-card ${forecastVariance > 0 ? 'warning' : 'success'}`}>
          {forecastVariance > 0 ? <TrendingUp size={24} /> : <TrendingDown size={24} />}
          <div className="summary-info">
            <span className="summary-value">
              {forecastVariance > 0 ? '+' : ''}{forecastVariance.toLocaleString()} ₺
            </span>
            <span className="summary-label">Tahmin Sapması (%{forecastVariancePercent})</span>
          </div>
        </div>
      </div>

      {/* View Tabs */}
      <div className="tabs-container">
        <button
          className={`tab-btn ${activeView === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveView('overview')}
        >
          <PieChart size={18} />
          Genel Bakış
        </button>
        <button
          className={`tab-btn ${activeView === 'categories' ? 'active' : ''}`}
          onClick={() => setActiveView('categories')}
        >
          <BarChart3 size={18} />
          Kategoriler
        </button>
        <button
          className={`tab-btn ${activeView === 'monthly' ? 'active' : ''}`}
          onClick={() => setActiveView('monthly')}
        >
          <Calendar size={18} />
          Aylık Takip
        </button>
      </div>

      {/* Overview View */}
      {activeView === 'overview' && (
        <div className="budget-overview">
          <div className="charts-row">
            <div className="chart-card">
              <div className="chart-header">
                <PieChart size={20} />
                <h3>Bütçe Dağılımı</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <RechartsPie>
                  <Pie
                    data={categoryDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  >
                    {categoryDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value.toLocaleString()} ₺`} />
                </RechartsPie>
              </ResponsiveContainer>
            </div>

            <div className="chart-card">
              <div className="chart-header">
                <BarChart3 size={20} />
                <h3>Bütçe vs Harcama</h3>
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={budgets} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
                  <XAxis type="number" tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={(v) => `${v/1000}K`} />
                  <YAxis dataKey="category" type="category" tick={{ fontSize: 12, fill: '#94a3b8' }} width={80} />
                  <Tooltip formatter={(value) => `${value.toLocaleString()} ₺`} />
                  <Legend />
                  <Bar dataKey="budget" fill="#3B82F6" name="Bütçe" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="spent" fill="#10B981" name="Harcanan" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="forecast" fill="#F59E0B" name="Tahmin" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Budget Cards */}
          <div className="budget-cards-grid">
            {budgets.map(budget => {
              const IconComponent = budget.icon;
              const progress = Math.round((budget.spent / budget.budget) * 100);
              const isOverBudget = budget.forecast > budget.budget;

              return (
                <div key={budget.id} className="budget-card" style={{ borderTopColor: budget.color }}>
                  <div className="budget-card-header">
                    <div className="budget-icon" style={{ backgroundColor: budget.color + '20', color: budget.color }}>
                      <IconComponent size={24} />
                    </div>
                    <div className="budget-info">
                      <h3>{budget.category}</h3>
                      <span className="budget-amount">{budget.budget.toLocaleString()} ₺</span>
                    </div>
                  </div>

                  <div className="budget-progress-section">
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${Math.min(progress, 100)}%`,
                          backgroundColor: getStatusColor(budget.spent, budget.budget)
                        }}
                      />
                    </div>
                    <div className="progress-labels">
                      <span>Harcanan: {budget.spent.toLocaleString()} ₺</span>
                      <span>%{progress}</span>
                    </div>
                  </div>

                  <div className="budget-forecast">
                    {isOverBudget ? (
                      <span className="forecast-warning">
                        <AlertTriangle size={14} />
                        Bütçe aşılabilir: {budget.forecast.toLocaleString()} ₺
                      </span>
                    ) : (
                      <span className="forecast-ok">
                        <CheckCircle size={14} />
                        Tahmin: {budget.forecast.toLocaleString()} ₺
                      </span>
                    )}
                  </div>

                  <div className="budget-comparison">
                    <span className="last-year">
                      Geçen yıl: {budget.lastYear.toLocaleString()} ₺
                    </span>
                    {budget.forecast > budget.lastYear ? (
                      <span className="trend up">
                        <TrendingUp size={14} />
                        +{Math.round(((budget.forecast - budget.lastYear) / budget.lastYear) * 100)}%
                      </span>
                    ) : (
                      <span className="trend down">
                        <TrendingDown size={14} />
                        {Math.round(((budget.forecast - budget.lastYear) / budget.lastYear) * 100)}%
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Categories View */}
      {activeView === 'categories' && (
        <div className="categories-view">
          <table className="budget-table">
            <thead>
              <tr>
                <th>Kategori</th>
                <th>Bütçe</th>
                <th>Harcanan</th>
                <th>Kalan</th>
                <th>Tahmin</th>
                <th>Geçen Yıl</th>
                <th>Durum</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {budgets.map(budget => {
                const IconComponent = budget.icon;
                const remaining = budget.budget - budget.spent;
                const isOverBudget = budget.forecast > budget.budget;

                return (
                  <tr key={budget.id}>
                    <td>
                      <div className="category-cell">
                        <div className="category-icon" style={{ backgroundColor: budget.color + '20', color: budget.color }}>
                          <IconComponent size={18} />
                        </div>
                        <span>{budget.category}</span>
                      </div>
                    </td>
                    <td><strong>{budget.budget.toLocaleString()} ₺</strong></td>
                    <td>{budget.spent.toLocaleString()} ₺</td>
                    <td style={{ color: remaining < 0 ? '#EF4444' : '#10B981' }}>
                      {remaining.toLocaleString()} ₺
                    </td>
                    <td>{budget.forecast.toLocaleString()} ₺</td>
                    <td>{budget.lastYear.toLocaleString()} ₺</td>
                    <td>
                      {isOverBudget ? (
                        <span className="status-badge warning">
                          <AlertTriangle size={14} /> Risk
                        </span>
                      ) : (
                        <span className="status-badge success">
                          <CheckCircle size={14} /> Normal
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-icon"><Edit size={16} /></button>
                        <button className="btn-icon"><BarChart3 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr>
                <td><strong>TOPLAM</strong></td>
                <td><strong>{totalBudget.toLocaleString()} ₺</strong></td>
                <td><strong>{totalSpent.toLocaleString()} ₺</strong></td>
                <td><strong>{(totalBudget - totalSpent).toLocaleString()} ₺</strong></td>
                <td><strong>{totalForecast.toLocaleString()} ₺</strong></td>
                <td><strong>{budgets.reduce((sum, b) => sum + b.lastYear, 0).toLocaleString()} ₺</strong></td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Monthly View */}
      {activeView === 'monthly' && (
        <div className="monthly-view">
          {budgets.filter(b => b.monthly.length > 0).map(budget => {
            const IconComponent = budget.icon;
            return (
              <div key={budget.id} className="monthly-chart-card">
                <div className="chart-header">
                  <div className="category-header">
                    <IconComponent size={20} style={{ color: budget.color }} />
                    <h3>{budget.category}</h3>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={250}>
                  <ComposedChart data={budget.monthly}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
                    <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                    <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} tickFormatter={(v) => `${v/1000}K`} />
                    <Tooltip formatter={(value) => value ? `${value.toLocaleString()} ₺` : 'N/A'} />
                    <Legend />
                    <Area type="monotone" dataKey="budget" fill={budget.color + '30'} stroke={budget.color} name="Bütçe" />
                    <Line type="monotone" dataKey="actual" stroke="#10B981" strokeWidth={2} name="Gerçekleşen" dot={{ fill: '#10B981' }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Budget Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2><Plus size={20} /> Yeni Bütçe</h2>
              <button className="close-btn" onClick={() => setShowAddModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Kategori</label>
                <select
                  value={newBudget.category}
                  onChange={e => setNewBudget({...newBudget, category: e.target.value})}
                >
                  <option value="">Seçin</option>
                  <option value="Elektrik">Elektrik</option>
                  <option value="Su">Su</option>
                  <option value="Doğalgaz">Doğalgaz</option>
                  <option value="Bakım">Bakım</option>
                  <option value="Diğer">Diğer</option>
                </select>
              </div>
              <div className="form-group">
                <label>Bütçe Tutarı (₺)</label>
                <input
                  type="number"
                  value={newBudget.amount}
                  onChange={e => setNewBudget({...newBudget, amount: e.target.value})}
                  placeholder="Yıllık bütçe tutarı"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Yıl</label>
                  <select
                    value={newBudget.year}
                    onChange={e => setNewBudget({...newBudget, year: e.target.value})}
                  >
                    <option value="2024">2024</option>
                    <option value="2025">2025</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Site</label>
                  <select
                    value={newBudget.site}
                    onChange={e => setNewBudget({...newBudget, site: e.target.value})}
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
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>İptal</button>
              <button className="btn btn-primary" onClick={handleAddBudget}>Kaydet</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BudgetPlanning;
