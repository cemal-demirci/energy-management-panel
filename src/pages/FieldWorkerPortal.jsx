import React, { useState, useRef, useEffect } from 'react';
import {
  User,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Building2,
  Gauge,
  Radio,
  Wrench,
  Phone,
  Navigation,
  Camera,
  Image,
  Upload,
  MessageSquare,
  Send,
  Play,
  Pause,
  Square,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Zap,
  Droplets,
  Flame,
  Thermometer,
  Check,
  X,
  Plus,
  Trash2,
  Edit3,
  Save,
  RefreshCw,
  FileText,
  ClipboardList,
  ClipboardCheck,
  Star,
  Award,
  TrendingUp,
  Activity,
  Battery,
  Wifi,
  Signal,
  LogOut,
  Eye,
  EyeOff,
  Lock
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const API_BASE = '/api/field';

function FieldWorkerPortal() {
  // Auth state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState(null);
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Login form
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // Data state
  const [worker, setWorker] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [dailySummary, setDailySummary] = useState(null);
  const [loading, setLoading] = useState(false);

  // UI state
  const [activeJob, setActiveJob] = useState(null);
  const [jobStatus, setJobStatus] = useState('idle');
  const [selectedTab, setSelectedTab] = useState('jobs');
  const [capturedImages, setCapturedImages] = useState([]);
  const [notes, setNotes] = useState('');
  const [meterReadings, setMeterReadings] = useState({});

  const fileInputRef = useRef(null);

  // Check for existing token on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('fieldToken');
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
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setToken(data.token);
        localStorage.setItem('fieldToken', data.token);
        setIsLoggedIn(true);
      } else {
        setLoginError(data.message || 'Giriş başarısız');
      }
    } catch (error) {
      setLoginError('Bağlantı hatası. Lütfen tekrar deneyin.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('fieldToken');
    setToken(null);
    setIsLoggedIn(false);
    setWorker(null);
    setJobs([]);
  };

  const fetchWithAuth = async (endpoint, options = {}) => {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (response.status === 401) {
      handleLogout();
      return null;
    }

    return response.json();
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [profileData, workOrdersData, summaryData] = await Promise.all([
        fetchWithAuth('/profile'),
        fetchWithAuth('/work-orders'),
        fetchWithAuth('/daily-summary')
      ]);

      if (profileData) setWorker(profileData);
      if (workOrdersData) setJobs(workOrdersData.workOrders || []);
      if (summaryData) setDailySummary(summaryData);

    } catch (error) {
      console.error('Veri yükleme hatası:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateWorkOrderStatus = async (orderId, status, data = {}) => {
    try {
      const response = await fetchWithAuth(`/work-orders/${orderId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, ...data })
      });

      if (response?.success) {
        loadAllData();
        return true;
      }
      return false;
    } catch (error) {
      console.error('Durum güncelleme hatası:', error);
      return false;
    }
  };

  const submitMeterReading = async (orderId, meterId, value) => {
    try {
      const response = await fetchWithAuth(`/work-orders/${orderId}/reading`, {
        method: 'POST',
        body: JSON.stringify({ meterId, value: parseFloat(value) })
      });

      return response?.success || false;
    } catch (error) {
      console.error('Okuma kaydetme hatası:', error);
      return false;
    }
  };

  const reportIssue = async (orderId, issueType, description) => {
    try {
      const response = await fetchWithAuth('/report-issue', {
        method: 'POST',
        body: JSON.stringify({ workOrderId: orderId, issueType, description })
      });

      return response?.success || false;
    } catch (error) {
      console.error('Sorun bildirme hatası:', error);
      return false;
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'electricity': return <Zap size={16} />;
      case 'water': return <Droplets size={16} />;
      case 'gas': return <Flame size={16} />;
      case 'heat': return <Thermometer size={16} />;
      default: return <Gauge size={16} />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'electricity': return '#f59e0b';
      case 'water': return '#3b82f6';
      case 'gas': return '#ef4444';
      case 'heat': return '#ec4899';
      default: return '#8b5cf6';
    }
  };

  const getJobTypeIcon = (type) => {
    switch (type) {
      case 'meter_reading': return Gauge;
      case 'maintenance': return Wrench;
      case 'repair': return AlertTriangle;
      case 'installation': return Plus;
      default: return ClipboardList;
    }
  };

  const getJobTypeLabel = (type) => {
    switch (type) {
      case 'meter_reading': return 'Sayaç Okuma';
      case 'maintenance': return 'Bakım';
      case 'repair': return 'Arıza';
      case 'installation': return 'Kurulum';
      default: return 'Diğer';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return '#ef4444';
      case 'high': return '#f59e0b';
      case 'normal': return '#3b82f6';
      case 'low': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 'urgent': return 'Acil';
      case 'high': return 'Yüksek';
      case 'normal': return 'Normal';
      case 'low': return 'Düşük';
      default: return priority;
    }
  };

  const handleStartJob = async (job) => {
    const success = await updateWorkOrderStatus(job.id, 'in_progress');
    if (success) {
      setActiveJob({ ...job, status: 'in_progress' });
      setJobStatus('started');
      setSelectedTab('active');
    }
  };

  const handlePauseJob = () => {
    setJobStatus('paused');
  };

  const handleResumeJob = () => {
    setJobStatus('started');
  };

  const handleCompleteJob = async () => {
    if (!activeJob) return;

    const completedCount = Object.keys(meterReadings).length;
    if (activeJob.meterCount > 0 && completedCount < activeJob.meterCount) {
      if (!window.confirm(`Henüz ${activeJob.meterCount - completedCount} sayaç okunmadı. Yine de tamamlamak istiyor musunuz?`)) {
        return;
      }
    }

    const success = await updateWorkOrderStatus(activeJob.id, 'completed', {
      notes: notes,
      readings: meterReadings,
      images: capturedImages.length
    });

    if (success) {
      alert('İş başarıyla tamamlandı!');
      setActiveJob(null);
      setJobStatus('idle');
      setMeterReadings({});
      setCapturedImages([]);
      setNotes('');
      setSelectedTab('jobs');
    }
  };

  const handleMeterReading = async (meterId, value) => {
    setMeterReadings(prev => ({
      ...prev,
      [meterId]: value
    }));

    if (activeJob && value) {
      await submitMeterReading(activeJob.id, meterId, value);
    }
  };

  const handleImageCapture = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCapturedImages(prev => [...prev, {
          id: Date.now(),
          src: event.target.result,
          timestamp: new Date().toLocaleTimeString('tr-TR'),
          note: ''
        }]);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteImage = (imageId) => {
    setCapturedImages(prev => prev.filter(img => img.id !== imageId));
  };

  const openNavigation = (lat, lng, address) => {
    if (lat && lng) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`, '_blank');
    } else if (address) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank');
    }
  };

  // Login Form
  if (!isLoggedIn) {
    return (
      <div className="field-login-container">
        <div className="field-login-card">
          <div className="login-header">
            <div className="login-logo">
              <Wrench size={48} className="wrench-icon" />
            </div>
            <h1>Saha Personeli Portalı</h1>
            <p>Merkezi Isıtma Sistemi</p>
          </div>

          <form onSubmit={handleLogin} className="login-form">
            <div className="form-group">
              <label>Kullanıcı Adı</label>
              <div className="input-with-icon">
                <User size={18} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="tekniker1"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Şifre</label>
              <div className="input-with-icon">
                <Lock size={18} />
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

          <div className="login-demo-info">
            <p>Demo hesapları:</p>
            <code>tekniker1 / 123456</code> (Sayaç Okuma)<br />
            <code>tekniker2 / 123456</code> (Bakım)<br />
            <code>supervisor1 / 123456</code> (Süpervizör)
          </div>
        </div>
      </div>
    );
  }

  if (loading || !worker) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Yükleniyor...</p>
      </div>
    );
  }

  const pendingJobs = jobs.filter(j => j.status === 'pending' || j.status === 'assigned' || j.status === 'in_progress');
  const completedJobs = jobs.filter(j => j.status === 'completed');

  return (
    <div className="field-worker-portal">
      {/* Üst Bar - Kullanıcı Bilgisi */}
      <div className="worker-header">
        <div className="worker-profile">
          <div className="worker-avatar">{worker.name?.substring(0, 2).toUpperCase()}</div>
          <div className="worker-info">
            <h2>{worker.name}</h2>
            <span className="worker-stats">
              <Star size={14} /> {worker.region} |
              <CheckCircle2 size={14} /> {dailySummary?.completedToday || 0}/{dailySummary?.totalAssigned || 0} bugün
            </span>
          </div>
        </div>
        <div className="header-actions">
          <div className="device-status">
            <span className="status-item"><Wifi size={16} /> Bağlı</span>
            <span className="status-item"><Signal size={16} /> 4G</span>
          </div>
          <button className="logout-btn-mini" onClick={handleLogout} title="Çıkış">
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Daily Summary */}
      {dailySummary && (
        <div className="daily-summary-bar">
          <div className="summary-item">
            <ClipboardList size={16} />
            <span>{dailySummary.totalAssigned} Atanan</span>
          </div>
          <div className="summary-item">
            <Activity size={16} />
            <span>{dailySummary.inProgress} Devam Eden</span>
          </div>
          <div className="summary-item success">
            <CheckCircle2 size={16} />
            <span>{dailySummary.completedToday} Tamamlanan</span>
          </div>
          <div className="summary-item">
            <Gauge size={16} />
            <span>{dailySummary.metersRead} Sayaç</span>
          </div>
        </div>
      )}

      {/* Tab Menü */}
      <div className="worker-tabs">
        <button
          className={`tab ${selectedTab === 'jobs' ? 'active' : ''}`}
          onClick={() => setSelectedTab('jobs')}
        >
          <ClipboardList size={18} />
          İşlerim ({pendingJobs.length})
        </button>
        <button
          className={`tab ${selectedTab === 'active' ? 'active' : ''}`}
          onClick={() => setSelectedTab('active')}
          disabled={!activeJob}
        >
          <Activity size={18} />
          Aktif İş
        </button>
        <button
          className={`tab ${selectedTab === 'history' ? 'active' : ''}`}
          onClick={() => setSelectedTab('history')}
        >
          <ClipboardCheck size={18} />
          Geçmiş ({completedJobs.length})
        </button>
      </div>

      {/* İşlerim Tab */}
      {selectedTab === 'jobs' && (
        <div className="jobs-list">
          {pendingJobs.length === 0 ? (
            <div className="empty-state">
              <CheckCircle2 size={48} />
              <h3>Tüm işler tamamlandı!</h3>
              <p>Yeni iş ataması bekleniyor</p>
              <button className="btn btn-secondary" onClick={loadAllData}>
                <RefreshCw size={16} /> Yenile
              </button>
            </div>
          ) : (
            pendingJobs.map(job => {
              const JobIcon = getJobTypeIcon(job.type);
              const isActive = activeJob?.id === job.id;

              return (
                <div key={job.id} className={`job-card ${job.priority} ${isActive ? 'active' : ''}`}>
                  <div className="job-header">
                    <div className="job-type">
                      <JobIcon size={20} />
                      <span
                        className="priority-indicator"
                        style={{ background: getPriorityColor(job.priority) }}
                      ></span>
                    </div>
                    <div className="job-info">
                      <h3>{job.description || getJobTypeLabel(job.type)}</h3>
                      <p className="job-site">
                        <Building2 size={14} />
                        {job.site} - {job.building}
                      </p>
                    </div>
                    <div className="job-badges">
                      <span className="priority-badge" style={{ background: getPriorityColor(job.priority) }}>
                        {getPriorityLabel(job.priority)}
                      </span>
                      {job.status === 'in_progress' && (
                        <span className="active-badge">
                          <Activity size={14} />
                          Aktif
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="job-details">
                    <div className="detail">
                      <MapPin size={14} />
                      <span>{job.address}</span>
                    </div>
                    <div className="detail">
                      <Clock size={14} />
                      <span>Atandı: {new Date(job.assignedDate).toLocaleDateString('tr-TR')}</span>
                    </div>
                    {job.meterCount > 0 && (
                      <div className="detail">
                        <Gauge size={14} />
                        <span>{job.meterCount} sayaç</span>
                      </div>
                    )}
                    {job.meterId && (
                      <div className="detail">
                        <Thermometer size={14} />
                        <span>Sayaç: {job.meterId}</span>
                      </div>
                    )}
                  </div>

                  {job.notes && (
                    <div className="job-notes">
                      <MessageSquare size={14} />
                      <span>{job.notes}</span>
                    </div>
                  )}

                  <div className="job-actions">
                    <button
                      className="btn-secondary"
                      onClick={() => openNavigation(job.lat, job.lng, job.address)}
                    >
                      <Navigation size={16} />
                      Yol Tarifi
                    </button>
                    {!isActive ? (
                      <button
                        className="btn-primary"
                        onClick={() => handleStartJob(job)}
                      >
                        <Play size={16} />
                        Başla
                      </button>
                    ) : (
                      <button
                        className="btn-primary"
                        onClick={() => setSelectedTab('active')}
                      >
                        <ChevronRight size={16} />
                        Devam Et
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Aktif İş Tab */}
      {selectedTab === 'active' && activeJob && (
        <div className="active-job-view">
          {/* İş Başlığı */}
          <div className="active-job-header">
            <div className="job-title-section">
              <h2>{activeJob.description || getJobTypeLabel(activeJob.type)}</h2>
              <p>{activeJob.site} - {activeJob.building}</p>
            </div>
            <div className="job-controls">
              {jobStatus === 'started' ? (
                <button className="control-btn pause" onClick={handlePauseJob}>
                  <Pause size={20} />
                </button>
              ) : (
                <button className="control-btn play" onClick={handleResumeJob}>
                  <Play size={20} />
                </button>
              )}
              <button className="control-btn complete" onClick={handleCompleteJob}>
                <Check size={20} />
                Tamamla
              </button>
            </div>
          </div>

          {/* İlerleme Durumu */}
          {activeJob.meterCount > 0 && (
            <div className="progress-section">
              <div className="progress-header">
                <span>İlerleme</span>
                <span>
                  {Object.keys(meterReadings).length} / {activeJob.meterCount} sayaç
                </span>
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${(Object.keys(meterReadings).length / activeJob.meterCount) * 100}%`
                  }}
                ></div>
              </div>
            </div>
          )}

          {/* Heat Meter Reading Section (for single meter jobs) */}
          {activeJob.meterId && (
            <div className="heat-meter-section">
              <h3><Thermometer size={18} /> Isı Sayacı Okuması</h3>
              <div className="heat-meter-card">
                <div className="meter-id">
                  <span>Sayaç ID:</span>
                  <strong>{activeJob.meterId}</strong>
                </div>
                <div className="reading-inputs">
                  <div className="reading-input-group">
                    <label>Giriş Sıcaklığı (°C)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="72.5"
                      onChange={(e) => handleMeterReading(`${activeJob.meterId}_t_inlet`, e.target.value)}
                    />
                  </div>
                  <div className="reading-input-group">
                    <label>Çıkış Sıcaklığı (°C)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="48.2"
                      onChange={(e) => handleMeterReading(`${activeJob.meterId}_t_outlet`, e.target.value)}
                    />
                  </div>
                  <div className="reading-input-group">
                    <label>Toplam Hacim (m³)</label>
                    <input
                      type="number"
                      step="0.001"
                      placeholder="125.456"
                      onChange={(e) => handleMeterReading(`${activeJob.meterId}_volume`, e.target.value)}
                    />
                  </div>
                  <div className="reading-input-group">
                    <label>Isı Enerjisi (kWh)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="1850.5"
                      onChange={(e) => handleMeterReading(`${activeJob.meterId}_energy`, e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Multi-meter reading (for bulk jobs) */}
          {activeJob.meterCount > 1 && !activeJob.meterId && (
            <div className="meters-section">
              <h3><Gauge size={18} /> Sayaç Okumaları</h3>
              <p className="meters-info">Bu iş emrinde {activeJob.meterCount} adet sayaç bulunmaktadır.</p>
              <div className="bulk-reading-note">
                <AlertTriangle size={16} />
                <span>Toplu okuma için her sayacı ayrı ayrı okuyun ve kaydedin.</span>
              </div>
            </div>
          )}

          {/* Fotoğraf Ekleme Bölümü */}
          <div className="photos-section">
            <div className="section-header">
              <h3><Camera size={18} /> Fotoğraflar</h3>
              <button
                className="add-photo-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera size={18} />
                Fotoğraf Ekle
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageCapture}
                style={{ display: 'none' }}
              />
            </div>

            {capturedImages.length > 0 ? (
              <div className="photos-grid">
                {capturedImages.map(image => (
                  <div key={image.id} className="photo-card">
                    <img src={image.src} alt="Captured" />
                    <div className="photo-overlay">
                      <span className="photo-time">{image.timestamp}</span>
                      <button
                        className="delete-btn"
                        onClick={() => handleDeleteImage(image.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-photos">
                <Image size={32} />
                <span>Henüz fotoğraf eklenmedi</span>
              </div>
            )}
          </div>

          {/* Not Ekleme Bölümü */}
          <div className="notes-section">
            <h3><MessageSquare size={18} /> Notlar</h3>
            <div className="add-note">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="İş ile ilgili notlarınızı buraya yazın..."
                rows={3}
              />
            </div>
          </div>

          {/* Hızlı Aksiyonlar */}
          <div className="quick-actions">
            <button className="action-btn" onClick={() => window.open('tel:+902121234567')}>
              <Phone size={20} />
              <span>Destek Ara</span>
            </button>
            <button className="action-btn" onClick={() => openNavigation(activeJob.lat, activeJob.lng, activeJob.address)}>
              <Navigation size={20} />
              <span>Yol Tarifi</span>
            </button>
            <button
              className="action-btn warning"
              onClick={() => {
                const desc = prompt('Sorun açıklaması:');
                if (desc) {
                  reportIssue(activeJob.id, 'general', desc);
                  alert('Sorun bildirildi!');
                }
              }}
            >
              <AlertTriangle size={20} />
              <span>Sorun Bildir</span>
            </button>
          </div>
        </div>
      )}

      {/* Geçmiş Tab */}
      {selectedTab === 'history' && (
        <div className="history-section">
          <div className="history-stats">
            <div className="stat-card">
              <Award size={24} />
              <div>
                <span className="value">{dailySummary?.completedToday || 0}</span>
                <span className="label">Bugün Tamamlanan</span>
              </div>
            </div>
            <div className="stat-card">
              <Gauge size={24} />
              <div>
                <span className="value">{dailySummary?.metersRead || 0}</span>
                <span className="label">Okunan Sayaç</span>
              </div>
            </div>
          </div>

          <h3>Tamamlanan İşler</h3>
          {completedJobs.length === 0 ? (
            <div className="empty-state">
              <ClipboardCheck size={48} />
              <p>Henüz tamamlanan iş yok.</p>
            </div>
          ) : (
            <div className="history-list">
              {completedJobs.map(job => (
                <div key={job.id} className="history-card">
                  <div className="history-header">
                    <h4>{job.description || getJobTypeLabel(job.type)}</h4>
                    <span className="completed-badge">
                      <CheckCircle2 size={14} /> Tamamlandı
                    </span>
                  </div>
                  <div className="history-details">
                    <span><Building2 size={14} /> {job.site} - {job.building}</span>
                    <span><Clock size={14} /> {job.completedAt ? new Date(job.completedAt).toLocaleString('tr-TR') : 'N/A'}</span>
                    {job.meterCount > 0 && (
                      <span><Gauge size={14} /> {job.meterCount} sayaç</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default FieldWorkerPortal;
