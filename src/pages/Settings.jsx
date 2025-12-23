import React, { useState, useEffect } from 'react';
import {
  Settings,
  User,
  Bell,
  Database,
  Shield,
  Palette,
  Globe,
  Mail,
  Clock,
  Save,
  CheckCircle,
  Server,
  Wifi,
  Key,
  Moon,
  Sun,
  Monitor,
  Volume2,
  VolumeX,
  RefreshCw,
  AlertCircle,
  Info,
  AlertTriangle
} from 'lucide-react';

function SettingsPage() {
  const [activeSection, setActiveSection] = useState('general');
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [dbStatus, setDbStatus] = useState('checking');

  // Settings state - empty defaults, will be loaded from API
  const [settings, setSettings] = useState({
    // General
    language: 'tr',
    timezone: 'Europe/Istanbul',
    dateFormat: 'DD/MM/YYYY',
    theme: 'dark',

    // Notifications
    emailNotifications: true,
    pushNotifications: true,
    alertSound: true,
    dailyReport: true,
    weeklyReport: false,
    anomalyAlerts: true,
    readingAlerts: true,

    // Database - loaded from API, not hardcoded
    dbServer: '***',
    dbName: '***',
    dbPort: '***',
    connectionTimeout: '30',
    autoReconnect: true,

    // Reading
    autoReadInterval: '24',
    retryAttempts: '3',
    readTimeout: '30',
    batchSize: '50',

    // API
    geminiApiKey: '••••••••••••••••',
    apiRateLimit: '100',
  });

  useEffect(() => {
    loadSettings();
    checkDatabaseStatus();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/settings');
      const contentType = res.headers.get('content-type');

      if (res.ok && contentType?.includes('application/json')) {
        const data = await res.json();
        setSettings(prev => ({ ...prev, ...(data.settings || data) }));
      } else {
        // API mevcut değil - localStorage kullan
        const saved = localStorage.getItem('settings');
        if (saved) setSettings(prev => ({ ...prev, ...JSON.parse(saved) }));
      }

    } catch (err) {
      console.error('Settings load error:', err);
      const saved = localStorage.getItem('settings');
      if (saved) setSettings(prev => ({ ...prev, ...JSON.parse(saved) }));
    } finally {
      setLoading(false);
    }
  };

  const checkDatabaseStatus = async () => {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        setDbStatus(data.database?.connected ? 'connected' : 'disconnected');
      } else {
        setDbStatus('disconnected');
      }
    } catch {
      setDbStatus('disconnected');
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      const contentType = res.headers.get('content-type');

      if (!res.ok || !contentType?.includes('application/json')) {
        // API mevcut değil - localStorage'a kaydet
        localStorage.setItem('settings', JSON.stringify(settings));
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);

    } catch (err) {
      console.error('Save settings error:', err);
      // Fallback to localStorage
      localStorage.setItem('settings', JSON.stringify(settings));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } finally {
      setSaving(false);
    }
  };

  const sections = [
    { id: 'general', label: 'Genel', icon: Settings },
    { id: 'notifications', label: 'Bildirimler', icon: Bell },
    { id: 'database', label: 'Veritabanı', icon: Database },
    { id: 'reading', label: 'Okuma Ayarları', icon: RefreshCw },
    { id: 'security', label: 'Güvenlik', icon: Shield },
    { id: 'api', label: 'API Ayarları', icon: Key },
  ];

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Ayarlar yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="page-header">
        <div className="header-title">
          <Settings size={28} />
          <div>
            <h1>Ayarlar</h1>
            <p className="subtitle">Sistem yapılandırması</p>
          </div>
        </div>
        {saved && (
          <div className="save-indicator">
            <CheckCircle size={18} />
            Kaydedildi
          </div>
        )}
      </div>

      <div className="settings-layout">
        {/* Sidebar */}
        <div className="settings-sidebar">
          {sections.map(section => {
            const IconComponent = section.icon;
            return (
              <button
                key={section.id}
                className={`settings-nav-item ${activeSection === section.id ? 'active' : ''}`}
                onClick={() => setActiveSection(section.id)}
              >
                <IconComponent size={18} />
                <span>{section.label}</span>
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="settings-content">
          {/* General Settings */}
          {activeSection === 'general' && (
            <div className="settings-section">
              <h2><Globe size={22} /> Genel Ayarlar</h2>

              <div className="setting-group">
                <div className="setting-item">
                  <div className="setting-info">
                    <label>Dil</label>
                    <span className="setting-desc">Arayüz dili</span>
                  </div>
                  <select
                    value={settings.language}
                    onChange={(e) => setSettings({...settings, language: e.target.value})}
                  >
                    <option value="tr">Türkçe</option>
                    <option value="en">English</option>
                  </select>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <label>Saat Dilimi</label>
                    <span className="setting-desc">Tarih ve saat gösterimi</span>
                  </div>
                  <select
                    value={settings.timezone}
                    onChange={(e) => setSettings({...settings, timezone: e.target.value})}
                  >
                    <option value="Europe/Istanbul">İstanbul (UTC+3)</option>
                    <option value="Europe/London">Londra (UTC+0)</option>
                    <option value="America/New_York">New York (UTC-5)</option>
                  </select>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <label>Tarih Formatı</label>
                    <span className="setting-desc">Tarihlerin gösterim şekli</span>
                  </div>
                  <select
                    value={settings.dateFormat}
                    onChange={(e) => setSettings({...settings, dateFormat: e.target.value})}
                  >
                    <option value="DD/MM/YYYY">31/12/2024</option>
                    <option value="MM/DD/YYYY">12/31/2024</option>
                    <option value="YYYY-MM-DD">2024-12-31</option>
                  </select>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <label>Tema</label>
                    <span className="setting-desc">Arayüz görünümü</span>
                  </div>
                  <div className="theme-selector">
                    <button
                      className={`theme-btn ${settings.theme === 'dark' ? 'active' : ''}`}
                      onClick={() => setSettings({...settings, theme: 'dark'})}
                    >
                      <Moon size={16} />
                      Koyu
                    </button>
                    <button
                      className={`theme-btn ${settings.theme === 'light' ? 'active' : ''}`}
                      onClick={() => setSettings({...settings, theme: 'light'})}
                    >
                      <Sun size={16} />
                      Açık
                    </button>
                    <button
                      className={`theme-btn ${settings.theme === 'system' ? 'active' : ''}`}
                      onClick={() => setSettings({...settings, theme: 'system'})}
                    >
                      <Monitor size={16} />
                      Sistem
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notification Settings */}
          {activeSection === 'notifications' && (
            <div className="settings-section">
              <h2><Bell size={22} /> Bildirim Ayarları</h2>

              <div className="setting-group">
                <div className="setting-item">
                  <div className="setting-info">
                    <label>E-posta Bildirimleri</label>
                    <span className="setting-desc">Önemli olayları e-posta ile al</span>
                  </div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={settings.emailNotifications}
                      onChange={(e) => setSettings({...settings, emailNotifications: e.target.checked})}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <label>Push Bildirimleri</label>
                    <span className="setting-desc">Tarayıcı bildirimleri</span>
                  </div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={settings.pushNotifications}
                      onChange={(e) => setSettings({...settings, pushNotifications: e.target.checked})}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <label>Uyarı Sesi</label>
                    <span className="setting-desc">Kritik uyarılarda ses çal</span>
                  </div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={settings.alertSound}
                      onChange={(e) => setSettings({...settings, alertSound: e.target.checked})}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <label>Günlük Rapor</label>
                    <span className="setting-desc">Her gün özet raporu gönder</span>
                  </div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={settings.dailyReport}
                      onChange={(e) => setSettings({...settings, dailyReport: e.target.checked})}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <label>Anomali Uyarıları</label>
                    <span className="setting-desc">Anormal tüketim bildirimi</span>
                  </div>
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={settings.anomalyAlerts}
                      onChange={(e) => setSettings({...settings, anomalyAlerts: e.target.checked})}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Database Settings */}
          {activeSection === 'database' && (
            <div className="settings-section">
              <h2><Database size={22} /> Veritabanı Ayarları</h2>

              <div className="info-banner">
                <Info size={18} />
                <span>Veritabanı ayarları sunucu tarafında yapılandırılmalıdır.</span>
              </div>

              <div className="setting-group">
                <div className="setting-item">
                  <div className="setting-info">
                    <label>Sunucu Adresi</label>
                    <span className="setting-desc">SQL Server IP adresi</span>
                  </div>
                  <input
                    type="text"
                    value={settings.dbServer}
                    onChange={(e) => setSettings({...settings, dbServer: e.target.value})}
                    disabled
                  />
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <label>Veritabanı Adı</label>
                    <span className="setting-desc">Bağlanılacak veritabanı</span>
                  </div>
                  <input
                    type="text"
                    value={settings.dbName}
                    onChange={(e) => setSettings({...settings, dbName: e.target.value})}
                    disabled
                  />
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <label>Port</label>
                    <span className="setting-desc">SQL Server portu</span>
                  </div>
                  <input
                    type="text"
                    value={settings.dbPort}
                    onChange={(e) => setSettings({...settings, dbPort: e.target.value})}
                    disabled
                  />
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <label>Bağlantı Durumu</label>
                    <span className="setting-desc">Anlık durum</span>
                  </div>
                  <div className={`status-badge ${dbStatus === 'connected' ? 'success' : dbStatus === 'checking' ? 'warning' : 'danger'}`}>
                    <Wifi size={14} />
                    {dbStatus === 'connected' ? 'Bağlı' : dbStatus === 'checking' ? 'Kontrol ediliyor...' : 'Bağlantı yok'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Reading Settings */}
          {activeSection === 'reading' && (
            <div className="settings-section">
              <h2><RefreshCw size={22} /> Okuma Ayarları</h2>

              <div className="setting-group">
                <div className="setting-item">
                  <div className="setting-info">
                    <label>Otomatik Okuma Aralığı</label>
                    <span className="setting-desc">Saatte bir otomatik okuma</span>
                  </div>
                  <div className="input-with-suffix">
                    <input
                      type="number"
                      value={settings.autoReadInterval}
                      onChange={(e) => setSettings({...settings, autoReadInterval: e.target.value})}
                    />
                    <span>saat</span>
                  </div>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <label>Yeniden Deneme Sayısı</label>
                    <span className="setting-desc">Başarısız okuma için</span>
                  </div>
                  <input
                    type="number"
                    value={settings.retryAttempts}
                    onChange={(e) => setSettings({...settings, retryAttempts: e.target.value})}
                  />
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <label>Okuma Zaman Aşımı</label>
                    <span className="setting-desc">Tek sayaç için maksimum süre</span>
                  </div>
                  <div className="input-with-suffix">
                    <input
                      type="number"
                      value={settings.readTimeout}
                      onChange={(e) => setSettings({...settings, readTimeout: e.target.value})}
                    />
                    <span>saniye</span>
                  </div>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <label>Toplu Okuma Boyutu</label>
                    <span className="setting-desc">Aynı anda okunacak sayaç</span>
                  </div>
                  <input
                    type="number"
                    value={settings.batchSize}
                    onChange={(e) => setSettings({...settings, batchSize: e.target.value})}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeSection === 'security' && (
            <div className="settings-section">
              <h2><Shield size={22} /> Güvenlik Ayarları</h2>

              <div className="setting-group">
                <div className="setting-item">
                  <div className="setting-info">
                    <label>İki Faktörlü Doğrulama</label>
                    <span className="setting-desc">Ekstra güvenlik katmanı</span>
                  </div>
                  <label className="toggle">
                    <input type="checkbox" />
                    <span className="toggle-slider"></span>
                  </label>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <label>Oturum Süresi</label>
                    <span className="setting-desc">Otomatik çıkış süresi</span>
                  </div>
                  <select>
                    <option value="30">30 dakika</option>
                    <option value="60">1 saat</option>
                    <option value="240">4 saat</option>
                    <option value="480">8 saat</option>
                  </select>
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <label>IP Kısıtlaması</label>
                    <span className="setting-desc">Belirli IP'lerden erişim</span>
                  </div>
                  <label className="toggle">
                    <input type="checkbox" />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>

              <div className="action-buttons">
                <button className="btn btn-outline">
                  <Key size={16} />
                  Şifre Değiştir
                </button>
                <button className="btn btn-outline danger">
                  <AlertCircle size={16} />
                  Tüm Oturumları Kapat
                </button>
              </div>
            </div>
          )}

          {/* API Settings */}
          {activeSection === 'api' && (
            <div className="settings-section">
              <h2><Key size={22} /> API Ayarları</h2>

              <div className="setting-group">
                <div className="setting-item">
                  <div className="setting-info">
                    <label>Gemini API Key</label>
                    <span className="setting-desc">AI özellikleri için</span>
                  </div>
                  <input
                    type="password"
                    value={settings.geminiApiKey}
                    onChange={(e) => setSettings({...settings, geminiApiKey: e.target.value})}
                  />
                </div>

                <div className="setting-item">
                  <div className="setting-info">
                    <label>API Rate Limit</label>
                    <span className="setting-desc">Dakikada maksimum istek</span>
                  </div>
                  <input
                    type="number"
                    value={settings.apiRateLimit}
                    onChange={(e) => setSettings({...settings, apiRateLimit: e.target.value})}
                  />
                </div>
              </div>

              <div className="info-banner warning">
                <AlertCircle size={18} />
                <span>API anahtarlarını güvenli bir şekilde saklayın ve paylaşmayın.</span>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="settings-footer">
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
              <Save size={18} />
              {saving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
