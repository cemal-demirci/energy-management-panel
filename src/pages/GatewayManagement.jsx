import React, { useState, useEffect } from 'react';
import {
  Radio,
  Wifi,
  WifiOff,
  Signal,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Edit,
  Eye,
  Send,
  Clock,
  MapPin,
  Building2,
  Gauge,
  X,
  AlertTriangle,
  CheckCircle,
  Server
} from 'lucide-react';

function GatewayManagement() {
  const [stats, setStats] = useState(null);
  const [gateways, setGateways] = useState([]);
  const [scheduledJobs, setScheduledJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGateway, setSelectedGateway] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newGateway, setNewGateway] = useState({
    name: '',
    imei: '',
    deviceType: 'Orion',
    siteId: '',
    ip: '',
    port: '5000'
  });
  const [sites, setSites] = useState([]);

  const safeJson = async (res) => {
    try {
      const ct = res.headers.get('content-type');
      if (res.ok && ct?.includes('application/json')) return await res.json();
    } catch {}
    return null;
  };

  useEffect(() => {
    fetchData();
    fetchSites();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([fetchStats(), fetchGateways(), fetchScheduledJobs()]);
    } catch (err) {
      setError('Veri yüklenirken hata oluştu');
    }
    setLoading(false);
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/gateways/stats/overview');
      const data = await safeJson(res);
      if (data) {
        setStats(data);
      }
    } catch (err) {
      console.error('Stats error:', err);
    }
  };

  const fetchGateways = async () => {
    try {
      const res = await fetch('/api/mbus/gateways');
      const data = await safeJson(res);
      setGateways(data?.gateways || []);
    } catch (err) {
      console.error('Gateways error:', err);
      setGateways([]);
    }
  };

  const fetchScheduledJobs = async () => {
    try {
      const res = await fetch('/api/schedule/jobs');
      const data = await safeJson(res);
      setScheduledJobs(data?.jobs || []);
    } catch (err) {
      console.error('Schedule error:', err);
      setScheduledJobs([]);
    }
  };

  const fetchSites = async () => {
    try {
      const res = await fetch('/api/sites');
      const data = await safeJson(res);
      setSites(data?.sites || data || []);
    } catch (err) {
      console.error('Sites error:', err);
      setSites([]);
    }
  };

  const handlePing = async (gatewayId) => {
    try {
      const res = await fetch(`/api/gateways/${gatewayId}/ping`, { method: 'POST' });
      const data = await res.json();
      alert(`${data.gateway?.name || 'Gateway'}\n\nDurum: ${data.message}\nIMEI: ${data.gateway?.imei || '-'}\nIP: ${data.gateway?.ip || 'Yok'}\nTip: ${data.gateway?.type || 'Bilinmiyor'}\nSon Erişim: ${data.timeSinceAccess || '-'}`);
    } catch (err) {
      alert('Ping hatası: ' + err.message);
    }
  };

  const handleAddGateway = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/gateways', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGateway)
      });

      if (res.ok) {
        alert('Gateway başarıyla eklendi!');
        setShowAddModal(false);
        setNewGateway({ name: '', imei: '', deviceType: 'Orion', siteId: '', ip: '', port: '5000' });
        fetchData();
      } else {
        const data = await res.json();
        alert('Hata: ' + (data.message || 'Gateway eklenemedi'));
      }
    } catch (err) {
      alert('Hata: ' + err.message);
    }
  };

  const handleDeleteGateway = async (gatewayId, gatewayName) => {
    if (!confirm(`"${gatewayName}" gateway'ini silmek istediğinize emin misiniz?`)) return;

    try {
      const res = await fetch(`/api/gateways/${gatewayId}`, { method: 'DELETE' });
      if (res.ok) {
        alert('Gateway silindi');
        fetchData();
      } else {
        alert('Silme hatası');
      }
    } catch (err) {
      alert('Hata: ' + err.message);
    }
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('tr-TR');
  };

  const getStatusClass = (lastAccess) => {
    if (!lastAccess) return 'offline';
    const hourAgo = new Date(Date.now() - 3600000);
    const dayAgo = new Date(Date.now() - 86400000);
    const accessDate = new Date(lastAccess);
    if (accessDate > hourAgo) return 'online';
    if (accessDate > dayAgo) return 'warning';
    return 'offline';
  };

  const getStatusText = (lastAccess) => {
    const status = getStatusClass(lastAccess);
    if (status === 'online') return 'Çevrimiçi';
    if (status === 'warning') return 'Uyarı';
    return 'Çevrimdışı';
  };

  const filteredGateways = gateways.filter(g => {
    const matchesFilter = filter === 'all' ||
      (filter === 'online' && getStatusClass(g.lastAccess) === 'online') ||
      (filter === 'warning' && getStatusClass(g.lastAccess) === 'warning') ||
      (filter === 'offline' && getStatusClass(g.lastAccess) === 'offline') ||
      (filter === 'orion' && g.deviceType === 'Orion') ||
      (filter === 'wimbus' && g.deviceType === 'Wimbus');

    const matchesSearch = !searchTerm ||
      g.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.imei?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.siteName?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const onlineCount = gateways.filter(g => getStatusClass(g.lastAccess) === 'online').length;
  const warningCount = gateways.filter(g => getStatusClass(g.lastAccess) === 'warning').length;
  const offlineCount = gateways.filter(g => getStatusClass(g.lastAccess) === 'offline').length;

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Gateway bilgileri yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="gateway-page">
      <div className="page-header">
        <div className="header-title">
          <Radio size={28} />
          <div>
            <h1>Gateway Yönetimi</h1>
            <p className="subtitle">M-Bus Gateway izleme ve yönetim paneli</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={18} />
            Yeni Gateway
          </button>
          <button className="btn btn-secondary" onClick={fetchData}>
            <RefreshCw size={18} />
            Yenile
          </button>
        </div>
      </div>

      {error && (
        <div className="error-banner">
          <AlertTriangle size={20} />
          <span>{error}</span>
          <button onClick={fetchData}>Tekrar Dene</button>
        </div>
      )}

      {/* İstatistik Kartları */}
      <div className="stats-grid gateway-stats">
        <div className="stat-card gradient-blue">
          <div className="stat-icon">
            <Server size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats?.toplamGateway || gateways.length}</span>
            <span className="stat-label">Toplam Gateway</span>
          </div>
        </div>

        <div className="stat-card gradient-green">
          <div className="stat-icon">
            <Wifi size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats?.sonBirSaatAktif || onlineCount}</span>
            <span className="stat-label">Çevrimiçi (1 Saat)</span>
          </div>
        </div>

        <div className="stat-card gradient-orange">
          <div className="stat-icon">
            <Signal size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats?.sonBirGunAktif || (onlineCount + warningCount)}</span>
            <span className="stat-label">Aktif (24 Saat)</span>
          </div>
        </div>

        <div className="stat-card gradient-red">
          <div className="stat-icon">
            <WifiOff size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{offlineCount}</span>
            <span className="stat-label">Çevrimdışı</span>
          </div>
        </div>

        <div className="stat-card gradient-purple">
          <div className="stat-icon">
            <Radio size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats?.orionSayisi || 0}</span>
            <span className="stat-label">Orion GSM</span>
          </div>
        </div>

        <div className="stat-card gradient-cyan">
          <div className="stat-icon">
            <Signal size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats?.wimbusSayisi || 0}</span>
            <span className="stat-label">Wimbus</span>
          </div>
        </div>
      </div>

      {/* Filtre ve Arama */}
      <div className="filter-section card">
        <div className="filter-row">
          <div className="search-box">
            <Search size={18} />
            <input
              type="text"
              placeholder="Gateway, IMEI veya site ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filter-buttons">
            <button
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              Tümü ({gateways.length})
            </button>
            <button
              className={`filter-btn online ${filter === 'online' ? 'active' : ''}`}
              onClick={() => setFilter('online')}
            >
              <Wifi size={14} /> Çevrimiçi ({onlineCount})
            </button>
            <button
              className={`filter-btn warning ${filter === 'warning' ? 'active' : ''}`}
              onClick={() => setFilter('warning')}
            >
              Uyarı ({warningCount})
            </button>
            <button
              className={`filter-btn offline ${filter === 'offline' ? 'active' : ''}`}
              onClick={() => setFilter('offline')}
            >
              <WifiOff size={14} /> Çevrimdışı ({offlineCount})
            </button>
          </div>
        </div>
      </div>

      {/* Gateway Listesi */}
      <div className="gateway-list-section card">
        <div className="section-header">
          <h3>Gateway Listesi ({filteredGateways.length})</h3>
        </div>
        <div className="table-container">
          <table className="gateway-table">
            <thead>
              <tr>
                <th>Durum</th>
                <th>Gateway Adı</th>
                <th>Site</th>
                <th>IMEI</th>
                <th>Tip</th>
                <th>Sayaç</th>
                <th>Son Erişim</th>
                <th>İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredGateways.length === 0 ? (
                <tr>
                  <td colSpan="8" className="empty-cell">
                    <div className="empty-state">
                      <Radio size={48} />
                      <p>Gateway bulunamadı</p>
                      <span>Arama kriterlerinizi değiştirin veya yeni gateway ekleyin</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredGateways.slice(0, 100).map((gw) => (
                  <tr key={gw.id} className={`gateway-row ${getStatusClass(gw.lastAccess)}`}>
                    <td>
                      <div className={`status-indicator ${getStatusClass(gw.lastAccess)}`}>
                        {getStatusClass(gw.lastAccess) === 'online' ? <Wifi size={16} /> :
                         getStatusClass(gw.lastAccess) === 'warning' ? <Signal size={16} /> :
                         <WifiOff size={16} />}
                        <span>{getStatusText(gw.lastAccess)}</span>
                      </div>
                    </td>
                    <td className="gateway-name">{gw.name}</td>
                    <td>
                      <div className="site-cell">
                        <Building2 size={14} />
                        {gw.siteName || '-'}
                      </div>
                    </td>
                    <td className="imei-cell">{gw.imei}</td>
                    <td>
                      <span className={`device-badge ${(gw.deviceType || '').toLowerCase()}`}>
                        {gw.deviceType || 'Bilinmiyor'}
                      </span>
                    </td>
                    <td>
                      <div className="meter-count">
                        <Gauge size={14} />
                        {gw.sayacSayisi || 0}
                      </div>
                    </td>
                    <td className="date-cell">{formatDate(gw.lastAccess)}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-icon info"
                          onClick={() => setSelectedGateway(gw)}
                          title="Detay"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          className="btn-icon success"
                          onClick={() => handlePing(gw.id)}
                          title="Ping"
                        >
                          <Send size={16} />
                        </button>
                        <button
                          className="btn-icon danger"
                          onClick={() => handleDeleteGateway(gw.id, gw.name)}
                          title="Sil"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {filteredGateways.length > 100 && (
          <div className="table-footer">
            <span>İlk 100 kayıt gösteriliyor. Toplam: {filteredGateways.length}</span>
          </div>
        )}
      </div>

      {/* Zamanlanmış Okumalar */}
      {scheduledJobs.length > 0 && (
        <div className="scheduled-section card">
          <div className="section-header">
            <Clock size={20} />
            <h3>Zamanlanmış Okumalar ({scheduledJobs.length})</h3>
          </div>
          <div className="scheduled-grid">
            {scheduledJobs.slice(0, 12).map((job) => (
              <div key={job.id} className={`scheduled-card ${job.otomatikokuma ? 'active' : ''}`}>
                <div className="scheduled-header">
                  <span className="scheduled-name">{job.name}</span>
                  <span className={`scheduled-status ${job.otomatikokuma ? 'active' : ''}`}>
                    {job.otomatikokuma ? <CheckCircle size={14} /> : null}
                    {job.otomatikokuma ? 'Aktif' : 'Pasif'}
                  </span>
                </div>
                <div className="scheduled-details">
                  <span><Building2 size={14} /> {job.siteName}</span>
                  <span><Clock size={14} /> {job.otomatik_okuma_saat || '09:00'}</span>
                  <span><Gauge size={14} /> {job.sayacSayisi} Sayaç</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Gateway Detay Modal */}
      {selectedGateway && (
        <div className="modal-overlay" onClick={() => setSelectedGateway(null)}>
          <div className="modal-content gateway-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <Radio size={24} />
                <h3>{selectedGateway.name}</h3>
              </div>
              <button className="modal-close" onClick={() => setSelectedGateway(null)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className={`gateway-status-banner ${getStatusClass(selectedGateway.lastAccess)}`}>
                {getStatusClass(selectedGateway.lastAccess) === 'online' ? <Wifi size={20} /> : <WifiOff size={20} />}
                <span>{getStatusText(selectedGateway.lastAccess)}</span>
              </div>

              <div className="detail-grid">
                <div className="detail-item">
                  <label>IMEI</label>
                  <span>{selectedGateway.imei}</span>
                </div>
                <div className="detail-item">
                  <label>Cihaz Tipi</label>
                  <span className={`device-badge ${(selectedGateway.deviceType || '').toLowerCase()}`}>
                    {selectedGateway.deviceType || 'Belirsiz'}
                  </span>
                </div>
                <div className="detail-item">
                  <label>Site</label>
                  <span>{selectedGateway.siteName || '-'}</span>
                </div>
                <div className="detail-item">
                  <label>Konum</label>
                  <span>
                    {selectedGateway.city && selectedGateway.district
                      ? `${selectedGateway.city} / ${selectedGateway.district}`
                      : '-'}
                  </span>
                </div>
                <div className="detail-item">
                  <label>Sayaç Sayısı</label>
                  <span>{selectedGateway.sayacSayisi || 0}</span>
                </div>
                <div className="detail-item">
                  <label>Son Erişim</label>
                  <span>{formatDate(selectedGateway.lastAccess)}</span>
                </div>
              </div>

              <div className="modal-actions">
                <button className="btn btn-primary" onClick={() => handlePing(selectedGateway.id)}>
                  <Send size={18} />
                  Ping Gönder
                </button>
                <button className="btn btn-success">
                  <RefreshCw size={18} />
                  Toplu Okuma Başlat
                </button>
                <button className="btn btn-secondary" onClick={() => setSelectedGateway(null)}>
                  Kapat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Yeni Gateway Ekle Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content add-gateway-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">
                <Plus size={24} />
                <h3>Yeni Gateway Ekle</h3>
              </div>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddGateway}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Gateway Adı *</label>
                    <input
                      type="text"
                      value={newGateway.name}
                      onChange={(e) => setNewGateway({ ...newGateway, name: e.target.value })}
                      placeholder="Örn: A Blok Gateway"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>IMEI *</label>
                    <input
                      type="text"
                      value={newGateway.imei}
                      onChange={(e) => setNewGateway({ ...newGateway, imei: e.target.value })}
                      placeholder="Örn: 866557058296122"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Cihaz Tipi</label>
                    <select
                      value={newGateway.deviceType}
                      onChange={(e) => setNewGateway({ ...newGateway, deviceType: e.target.value })}
                    >
                      <option value="Orion">Orion GSM</option>
                      <option value="Wimbus">Wimbus</option>
                      <option value="Integral">Integral</option>
                      <option value="Other">Diğer</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Site</label>
                    <select
                      value={newGateway.siteId}
                      onChange={(e) => setNewGateway({ ...newGateway, siteId: e.target.value })}
                    >
                      <option value="">Site Seçin</option>
                      {sites.map(site => (
                        <option key={site.id} value={site.id}>{site.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>IP Adresi (Opsiyonel)</label>
                    <input
                      type="text"
                      value={newGateway.ip}
                      onChange={(e) => setNewGateway({ ...newGateway, ip: e.target.value })}
                      placeholder="Örn: 192.168.1.100"
                    />
                  </div>

                  <div className="form-group">
                    <label>Port</label>
                    <input
                      type="text"
                      value={newGateway.port}
                      onChange={(e) => setNewGateway({ ...newGateway, port: e.target.value })}
                      placeholder="5000"
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  İptal
                </button>
                <button type="submit" className="btn btn-primary">
                  <Plus size={18} />
                  Gateway Ekle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bilgi Paneli */}
      <div className="info-panel card">
        <h3>Gateway Türleri Hakkında</h3>
        <div className="info-grid">
          <div className="info-item">
            <div className="info-icon orion">
              <Radio size={24} />
            </div>
            <div className="info-content">
              <h4>Orion GSM</h4>
              <p>GSM/GPRS modemi ile uzaktan bağlantı. SIM kart ile mobil ağ üzerinden iletişim kurar.</p>
            </div>
          </div>
          <div className="info-item">
            <div className="info-icon wimbus">
              <Signal size={24} />
            </div>
            <div className="info-content">
              <h4>Wimbus</h4>
              <p>Kablosuz M-Bus protokolü. 868 MHz frekansında RF iletişim sağlar.</p>
            </div>
          </div>
          <div className="info-item">
            <div className="info-icon integral">
              <Server size={24} />
            </div>
            <div className="info-content">
              <h4>Integral</h4>
              <p>Entegre gateway çözümü. TCP/IP üzerinden direkt bağlantı destekler.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GatewayManagement;
