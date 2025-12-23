import React, { useState, useEffect } from 'react';
import {
  Home,
  User,
  Zap,
  Droplets,
  Flame,
  Calendar,
  FileText,
  CreditCard,
  Bell,
  Settings,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  AlertTriangle,
  Download,
  MessageSquare,
  Phone,
  Mail,
  BarChart3,
  PieChart,
  Leaf,
  Target,
  Award,
  LogOut,
  Eye,
  EyeOff,
  Thermometer,
  Activity
} from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart as RechartsPie, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const API_BASE = '/api/tenant';

function TenantPortal() {
  const safeJson = async (res) => {
    try {
      const ct = res.headers.get('content-type');
      if (res.ok && ct?.includes('application/json')) return await res.json();
    } catch {}
    return null;
  };
  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState(null);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Login form
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Data state
  const [activeTab, setActiveTab] = useState('dashboard');
  const [tenant, setTenant] = useState(null);
  const [currentReading, setCurrentReading] = useState(null);
  const [consumption, setConsumption] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [paymentSummary, setPaymentSummary] = useState(null);
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(false);

  // Check for existing token on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('tenantToken');
    if (savedToken) {
      setToken(savedToken);
      setIsLoggedIn(true);
    }
  }, []);

  // Load data when logged in
  useEffect(() => {
    if (isLoggedIn && token) {
      loadAllData();
    }
  }, [isLoggedIn, token]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginLoading(true);
    setLoginError('');

    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await safeJson(response);

      if (data && data.success) {
        setToken(data.token);
        localStorage.setItem('tenantToken', data.token);
        setIsLoggedIn(true);
      } else if (data) {
        setLoginError(data.message || 'Giriş başarısız');
      } else {
        // Demo login fallback
        if (email === 'kiraci@example.com' && password === '1234') {
          const demoToken = 'demo-tenant-token-' + Date.now();
          setToken(demoToken);
          localStorage.setItem('tenantToken', demoToken);
          setIsLoggedIn(true);
        } else {
          setLoginError('E-posta veya şifre hatalı');
        }
      }
    } catch (error) {
      // Demo login fallback
      if (email === 'kiraci@example.com' && password === '1234') {
        const demoToken = 'demo-tenant-token-' + Date.now();
        setToken(demoToken);
        localStorage.setItem('tenantToken', demoToken);
        setIsLoggedIn(true);
      } else {
        setLoginError('Bağlantı hatası. Lütfen tekrar deneyin.');
      }
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('tenantToken');
    setToken(null);
    setIsLoggedIn(false);
    setTenant(null);
  };

  const fetchWithAuth = async (endpoint) => {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        handleLogout();
        return null;
      }

      return await safeJson(response);
    } catch {
      return null;
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      const announcementsRes = await fetch(`${API_BASE}/announcements`);
      const announcementsData = await safeJson(announcementsRes);

      const [profileData, meterData, consumptionData, billsData, paymentData, comparisonData] =
        await Promise.all([
          fetchWithAuth('/profile'),
          fetchWithAuth('/meter/current'),
          fetchWithAuth('/consumption'),
          fetchWithAuth('/bills'),
          fetchWithAuth('/payment-summary'),
          fetchWithAuth('/comparison')
        ]);

      // Profile
      if (profileData) {
        setTenant(profileData);
      } else {
        setTenant({ name: 'Ali Yılmaz', building: 'A Blok', apartment: 'Daire 5', meterId: 'H-1234' });
      }

      // Current reading
      if (meterData) {
        setCurrentReading(meterData);
      } else {
        setCurrentReading({ heat_energy: 1250.5, volume: 45.123, power: 2500, t_inlet: 72.5, t_outlet: 48.2, delta_t: 24.3, timestamp: new Date().toISOString() });
      }

      // Consumption history
      if (consumptionData) {
        const chartData = consumptionData.history?.map(item => ({
          month: getMonthName(item.month),
          energy: item.energy,
          volume: item.volume,
          avgTemp: item.avgTemp
        })) || [];
        setConsumption(chartData);
      } else {
        setConsumption([
          { month: 'Eki', energy: 180.5, volume: 8.2 },
          { month: 'Kas', energy: 320.8, volume: 14.5 },
          { month: 'Ara', energy: 450.2, volume: 20.1 }
        ]);
      }

      // Bills
      if (billsData) {
        setInvoices(billsData.bills || []);
      } else {
        setInvoices([
          { id: 1, month: 'Aralık 2024', amount: 850.50, energy: 450.2, status: 'unpaid', dueDate: '2025-01-15' },
          { id: 2, month: 'Kasım 2024', amount: 620.30, energy: 320.8, status: 'paid', dueDate: '2024-12-15', paidDate: '2024-12-10' }
        ]);
      }

      // Payment summary
      if (paymentData) {
        setPaymentSummary(paymentData);
      } else {
        setPaymentSummary({ balance: 850.50 });
      }

      // Comparison
      if (comparisonData) {
        setComparison(comparisonData);
      } else {
        setComparison({ yourConsumption: 450.2, buildingAverage: 380.5, buildingMin: 220.0, buildingMax: 620.0, percentDiff: 18.3, status: 'above' });
      }

      // Announcements
      if (announcementsData) {
        setNotifications(announcementsData.announcements || []);
      } else {
        setNotifications([
          { id: 1, type: 'info', title: 'Bakım Duyurusu', message: 'Yarın saat 10:00-14:00 arası bakım yapılacaktır.', date: '2024-12-23', read: false }
        ]);
      }

    } catch (error) {
      console.error('Veri yükleme hatası:', error);
      // Set demo data on error
      setTenant({ name: 'Ali Yılmaz', building: 'A Blok', apartment: 'Daire 5', meterId: 'H-1234' });
      setCurrentReading({ heat_energy: 1250.5, volume: 45.123, power: 2500, t_inlet: 72.5, t_outlet: 48.2, delta_t: 24.3, timestamp: new Date().toISOString() });
      setConsumption([{ month: 'Ara', energy: 450.2, volume: 20.1 }]);
      setInvoices([]);
      setPaymentSummary({ balance: 0 });
    } finally {
      setLoading(false);
    }
  };

  const getMonthName = (monthStr) => {
    const months = {
      '01': 'Oca', '02': 'Şub', '03': 'Mar', '04': 'Nis',
      '05': 'May', '06': 'Haz', '07': 'Tem', '08': 'Ağu',
      '09': 'Eyl', '10': 'Eki', '11': 'Kas', '12': 'Ara'
    };
    const [year, month] = monthStr.split('-');
    return months[month] || month;
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'paid':
        return <span className="status-badge success"><CheckCircle size={14} /> Ödendi</span>;
      case 'unpaid':
      case 'pending':
        return <span className="status-badge warning"><Clock size={14} /> Bekliyor</span>;
      case 'overdue':
        return <span className="status-badge danger"><AlertTriangle size={14} /> Gecikmiş</span>;
      default:
        return null;
    }
  };

  const getNotificationIcon = (type) => {
    switch(type) {
      case 'invoice': return <FileText size={18} className="text-blue" />;
      case 'reminder': return <Bell size={18} className="text-orange" />;
      case 'maintenance': return <Settings size={18} className="text-purple" />;
      case 'info': return <Bell size={18} className="text-green" />;
      default: return <Bell size={18} />;
    }
  };

  const COLORS = ['#EF4444', '#3B82F6', '#10B981'];

  // Login Form
  if (!isLoggedIn) {
    return (
      <div className="tenant-login-container">
        <div className="tenant-login-card">
          <div className="login-header">
            <div className="login-logo">
              <Flame size={48} className="flame-icon" />
            </div>
            <h1>Kiracı Portalı</h1>
            <p>Merkezi Isıtma Sistemi</p>
          </div>

          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label>E-posta</label>
              <div className="input-with-icon">
                <Mail size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ornek@email.com"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Şifre</label>
              <div className="input-with-icon">
                <CreditCard size={18} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {loginError && (
              <div className="login-error">
                <AlertTriangle size={16} />
                {loginError}
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-full" disabled={loginLoading}>
              {loginLoading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </button>
          </form>

        </div>
      </div>
    );
  }

  if (loading || !tenant) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Yükleniyor...</p>
      </div>
    );
  }

  const currentMonth = consumption[consumption.length - 1] || {};
  const previousMonth = consumption[consumption.length - 2] || {};

  const currentConsumptionData = [
    { name: 'Isı Enerjisi', value: currentReading?.heat_energy || 0, color: '#EF4444', unit: 'kWh' },
    { name: 'Hacim', value: currentReading?.volume || 0, color: '#3B82F6', unit: 'm³' },
    { name: 'Güç', value: currentReading?.power || 0, color: '#10B981', unit: 'W' },
  ];

  return (
    <div className="tenant-portal">
      <div className="page-header">
        <div className="header-title">
          <Home size={28} />
          <div>
            <h1>Kiracı Portalı</h1>
            <p className="subtitle">Hoş geldiniz, {tenant.name}</p>
          </div>
        </div>
        <div className="header-actions">
          <div className="tenant-info-badge">
            <span className="unit">{tenant.building} - {tenant.apartment}</span>
            <span className="meter">Sayaç: {tenant.meterId}</span>
          </div>
          <button className="btn btn-outline btn-sm logout-btn" onClick={handleLogout}>
            <LogOut size={16} /> Çıkış
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="tenant-stats-grid">
        <div className="tenant-stat-card balance">
          <CreditCard size={24} />
          <div className="stat-info">
            <span className="stat-value" style={{ color: paymentSummary?.balance > 0 ? '#EF4444' : '#10B981' }}>
              {Math.abs(paymentSummary?.balance || 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
            </span>
            <span className="stat-label">
              {paymentSummary?.balance > 0 ? 'Ödenecek Tutar' : 'Bakiye'}
            </span>
          </div>
        </div>

        <div className="tenant-stat-card">
          <Thermometer size={24} />
          <div className="stat-info">
            <span className="stat-value">{currentReading?.heat_energy?.toFixed(1) || '0'} kWh</span>
            <span className="stat-label">Toplam Isı Enerjisi</span>
            {currentReading?.power > 0 && (
              <span className="trend active"><Activity size={14} /> {currentReading.power} W</span>
            )}
          </div>
        </div>

        <div className="tenant-stat-card">
          <Droplets size={24} />
          <div className="stat-info">
            <span className="stat-value">{currentReading?.volume?.toFixed(2) || '0'} m³</span>
            <span className="stat-label">Toplam Hacim</span>
          </div>
        </div>

        <div className="tenant-stat-card efficiency">
          <Flame size={24} />
          <div className="stat-info">
            <span className="stat-value">ΔT {currentReading?.delta_t?.toFixed(1) || '0'}°C</span>
            <span className="stat-label">Sıcaklık Farkı</span>
            <span className="temp-badge">
              {currentReading?.t_inlet?.toFixed(1) || '0'}°C → {currentReading?.t_outlet?.toFixed(1) || '0'}°C
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <button
          className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <BarChart3 size={18} />
          Özet
        </button>
        <button
          className={`tab-btn ${activeTab === 'invoices' ? 'active' : ''}`}
          onClick={() => setActiveTab('invoices')}
        >
          <FileText size={18} />
          Faturalar
        </button>
        <button
          className={`tab-btn ${activeTab === 'consumption' ? 'active' : ''}`}
          onClick={() => setActiveTab('consumption')}
        >
          <Zap size={18} />
          Tüketim
        </button>
        <button
          className={`tab-btn ${activeTab === 'notifications' ? 'active' : ''}`}
          onClick={() => setActiveTab('notifications')}
        >
          <Bell size={18} />
          Bildirimler
          {notifications.filter(n => !n.read).length > 0 && (
            <span className="notification-count">{notifications.filter(n => !n.read).length}</span>
          )}
        </button>
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="tenant-dashboard">
          <div className="dashboard-row">
            {/* Current Consumption */}
            <div className="chart-card">
              <div className="chart-header">
                <PieChart size={20} />
                <h3>Güncel Tüketim Dağılımı</h3>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <RechartsPie>
                  <Pie
                    data={currentConsumptionData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, value, unit }) => `${name}: ${value} ${unit}`}
                  >
                    {currentConsumptionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </RechartsPie>
              </ResponsiveContainer>
            </div>

            {/* Recent Invoice */}
            <div className="recent-invoice-card">
              <div className="card-header">
                <FileText size={20} />
                <h3>Son Fatura</h3>
              </div>
              {invoices[0] && (
                <div className="invoice-preview">
                  <div className="invoice-header">
                    <span className="invoice-period">{invoices[0].month}</span>
                    {getStatusBadge(invoices[0].status)}
                  </div>
                  <div className="invoice-amount">
                    <span className="amount">{invoices[0].amount?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                  </div>
                  <div className="invoice-breakdown">
                    <div className="breakdown-item">
                      <Flame size={14} />
                      <span>Isı Enerjisi</span>
                      <span>{invoices[0].energy?.toFixed(1)} kWh</span>
                    </div>
                  </div>
                  <div className="invoice-due">
                    <Calendar size={14} />
                    <span>Son Ödeme: {invoices[0].dueDate}</span>
                  </div>
                  {invoices[0].status !== 'paid' && (
                    <button className="btn btn-primary btn-full">
                      <CreditCard size={16} /> Şimdi Öde
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Consumption Trend */}
          <div className="chart-card full-width">
            <div className="chart-header">
              <BarChart3 size={20} />
              <h3>Aylık Tüketim Trendi</h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={consumption}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <Tooltip contentStyle={{
                  backgroundColor: 'rgba(30, 41, 59, 0.95)',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  borderRadius: '8px',
                  color: '#f1f5f9'
                }} />
                <Legend />
                <Line type="monotone" dataKey="energy" stroke="#EF4444" strokeWidth={2} name="Isı Enerjisi (kWh)" />
                <Line type="monotone" dataKey="volume" stroke="#3B82F6" strokeWidth={2} name="Hacim (m³)" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Comparison with neighbors */}
          {comparison && (
            <div className="comparison-section">
              <div className="card-header">
                <Target size={20} />
                <h3>Bina Karşılaştırması</h3>
              </div>
              <div className="comparison-grid">
                <div className="comparison-item">
                  <span className="label">Sizin Tüketiminiz</span>
                  <span className="value">{comparison.yourConsumption?.toFixed(1)} kWh</span>
                </div>
                <div className="comparison-item">
                  <span className="label">Bina Ortalaması</span>
                  <span className="value">{comparison.buildingAverage?.toFixed(1)} kWh</span>
                </div>
                <div className="comparison-item">
                  <span className="label">En Düşük</span>
                  <span className="value success">{comparison.buildingMin?.toFixed(1)} kWh</span>
                </div>
                <div className="comparison-item">
                  <span className="label">En Yüksek</span>
                  <span className="value danger">{comparison.buildingMax?.toFixed(1)} kWh</span>
                </div>
              </div>
              <div className={`comparison-status ${comparison.status}`}>
                {comparison.percentDiff > 0 ? (
                  <span><TrendingUp size={16} /> Ortalamanın %{Math.abs(comparison.percentDiff).toFixed(0)} üzerinde</span>
                ) : (
                  <span><TrendingDown size={16} /> Ortalamanın %{Math.abs(comparison.percentDiff).toFixed(0)} altında</span>
                )}
              </div>
            </div>
          )}

          {/* Tips */}
          <div className="tips-section">
            <div className="card-header">
              <Leaf size={20} />
              <h3>Tasarruf İpuçları</h3>
            </div>
            <div className="tips-grid">
              <div className="tip-card">
                <Thermometer size={24} className="tip-icon" />
                <p>Termostat ayarınızı 20°C'ye ayarlayarak %10 tasarruf sağlayabilirsiniz.</p>
              </div>
              <div className="tip-card">
                <Flame size={24} className="tip-icon" />
                <p>Radyatör vanalarını tam açık tutmayın, 3-4 arasında ayarlayın.</p>
              </div>
              <div className="tip-card">
                <Home size={24} className="tip-icon" />
                <p>Gece perdeleri kapatarak ısı kaybını azaltabilirsiniz.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoices Tab */}
      {activeTab === 'invoices' && (
        <div className="invoices-section">
          {invoices.length === 0 ? (
            <div className="empty-state">
              <FileText size={48} />
              <p>Henüz fatura bulunmuyor.</p>
            </div>
          ) : (
            invoices.map(invoice => (
              <div key={invoice.id} className={`invoice-card ${invoice.status}`}>
                <div className="invoice-main">
                  <div className="invoice-info">
                    <span className="invoice-id">#{invoice.id}</span>
                    <span className="invoice-period">{invoice.month}</span>
                  </div>
                  {getStatusBadge(invoice.status)}
                </div>

                <div className="invoice-details">
                  <div className="detail-row">
                    <Flame size={16} />
                    <span>Isı Enerjisi</span>
                    <span>{invoice.energy?.toFixed(1)} kWh</span>
                  </div>
                  <div className="detail-row">
                    <Thermometer size={16} />
                    <span>Birim Fiyat</span>
                    <span>{(invoice.amount / invoice.energy)?.toFixed(2)} ₺/kWh</span>
                  </div>
                </div>

                <div className="invoice-footer">
                  <div className="invoice-total">
                    <span className="label">Toplam</span>
                    <span className="amount">{invoice.amount?.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺</span>
                  </div>
                  <div className="invoice-due-info">
                    <Calendar size={14} />
                    <span>Son Ödeme: {invoice.dueDate}</span>
                    {invoice.paidDate && <span className="paid-date">Ödendi: {invoice.paidDate}</span>}
                  </div>
                  <div className="invoice-actions">
                    <button className="btn btn-outline btn-sm">
                      <Download size={14} /> PDF
                    </button>
                    {invoice.status !== 'paid' && (
                      <button className="btn btn-primary btn-sm">
                        <CreditCard size={14} /> Öde
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Consumption Tab */}
      {activeTab === 'consumption' && (
        <div className="consumption-section">
          {/* Current Reading Card */}
          {currentReading && (
            <div className="current-reading-card">
              <h3><Activity size={20} /> Güncel Sayaç Okuması</h3>
              <div className="reading-time">
                <Clock size={14} /> Son güncelleme: {new Date(currentReading.timestamp).toLocaleString('tr-TR')}
              </div>
              <div className="reading-grid">
                <div className="reading-item">
                  <span className="reading-label">Giriş Sıcaklığı</span>
                  <span className="reading-value">{currentReading.t_inlet?.toFixed(1)}°C</span>
                </div>
                <div className="reading-item">
                  <span className="reading-label">Çıkış Sıcaklığı</span>
                  <span className="reading-value">{currentReading.t_outlet?.toFixed(1)}°C</span>
                </div>
                <div className="reading-item">
                  <span className="reading-label">Sıcaklık Farkı</span>
                  <span className="reading-value highlight">{currentReading.delta_t?.toFixed(1)}°C</span>
                </div>
                <div className="reading-item">
                  <span className="reading-label">Anlık Güç</span>
                  <span className="reading-value">{currentReading.power} W</span>
                </div>
                <div className="reading-item">
                  <span className="reading-label">Toplam Hacim</span>
                  <span className="reading-value">{currentReading.volume?.toFixed(3)} m³</span>
                </div>
                <div className="reading-item">
                  <span className="reading-label">Toplam Isı Enerjisi</span>
                  <span className="reading-value highlight">{currentReading.heat_energy?.toFixed(1)} kWh</span>
                </div>
              </div>
            </div>
          )}

          <div className="consumption-charts">
            <div className="chart-card">
              <div className="chart-header">
                <Flame size={20} />
                <h3>Isı Enerjisi Tüketimi</h3>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={consumption}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <Tooltip contentStyle={{
                    backgroundColor: 'rgba(30, 41, 59, 0.95)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: '8px'
                  }} />
                  <Bar dataKey="energy" fill="#EF4444" radius={[4, 4, 0, 0]} name="kWh" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card">
              <div className="chart-header">
                <Droplets size={20} />
                <h3>Su Hacmi</h3>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={consumption}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.1)" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} />
                  <Tooltip contentStyle={{
                    backgroundColor: 'rgba(30, 41, 59, 0.95)',
                    border: '1px solid rgba(148, 163, 184, 0.2)',
                    borderRadius: '8px'
                  }} />
                  <Bar dataKey="volume" fill="#3B82F6" radius={[4, 4, 0, 0]} name="m³" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Consumption Table */}
          <div className="content-card">
            <h3>Aylık Tüketim Detayı</h3>
            <table className="consumption-table">
              <thead>
                <tr>
                  <th>Dönem</th>
                  <th>Isı Enerjisi (kWh)</th>
                  <th>Hacim (m³)</th>
                  <th>Ort. Sıcaklık (°C)</th>
                  <th>Ort. ΔT (°C)</th>
                </tr>
              </thead>
              <tbody>
                {consumption.slice().reverse().map((item, index) => (
                  <tr key={index}>
                    <td>{item.month}</td>
                    <td>{item.energy?.toFixed(1)}</td>
                    <td>{item.volume?.toFixed(2)}</td>
                    <td>{item.avgTemp?.toFixed(1)}</td>
                    <td>{item.avgDelta?.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="notifications-section">
          {notifications.length === 0 ? (
            <div className="empty-state">
              <Bell size={48} />
              <p>Henüz bildirim bulunmuyor.</p>
            </div>
          ) : (
            notifications.map(notification => (
              <div key={notification.id} className={`notification-card ${notification.read ? 'read' : 'unread'}`}>
                <div className="notification-icon">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="notification-content">
                  <h4>{notification.title}</h4>
                  <p>{notification.message}</p>
                  <span className="notification-date">{notification.date}</span>
                </div>
                {!notification.read && <span className="unread-dot" />}
              </div>
            ))
          )}
        </div>
      )}

      {/* Contact Section */}
      <div className="contact-section">
        <h3>İletişim</h3>
        <div className="contact-options">
          <button className="contact-btn">
            <Phone size={20} />
            <span>0212 123 4567</span>
          </button>
          <button className="contact-btn">
            <Mail size={20} />
            <span>destek@merkezi-isitma.com</span>
          </button>
          <button className="contact-btn">
            <MessageSquare size={20} />
            <span>Canlı Destek</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default TenantPortal;
