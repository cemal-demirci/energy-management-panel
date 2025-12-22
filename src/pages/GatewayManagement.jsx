import React, { useState, useEffect } from 'react';

function GatewayManagement() {
  const [stats, setStats] = useState(null);
  const [gateways, setGateways] = useState([]);
  const [scheduledJobs, setScheduledJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGateway, setSelectedGateway] = useState(null);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchStats, 30000); // Her 30 saniyede güncelle
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    setLoading(true);
    await Promise.all([fetchStats(), fetchGateways(), fetchScheduledJobs()]);
    setLoading(false);
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/gateways/stats/overview');
      const data = await res.json();
      setStats(data);
    } catch (err) {
      console.error('Stats error:', err);
    }
  };

  const fetchGateways = async () => {
    try {
      const res = await fetch('/api/mbus/gateways');
      const data = await res.json();
      setGateways(data.gateways || []);
    } catch (err) {
      console.error('Gateways error:', err);
    }
  };

  const fetchScheduledJobs = async () => {
    try {
      const res = await fetch('/api/schedule/jobs');
      const data = await res.json();
      setScheduledJobs(data.jobs || []);
    } catch (err) {
      console.error('Schedule error:', err);
    }
  };

  const handlePing = async (gatewayId) => {
    try {
      const res = await fetch(`/api/gateways/${gatewayId}/ping`, { method: 'POST' });
      const data = await res.json();

      const msg = `${data.gateway?.name || 'Gateway'}

Durum: ${data.message}
IMEI: ${data.gateway?.imei || '-'}
IP: ${data.gateway?.ip || 'Yok'}
Tip: ${data.gateway?.type || 'Bilinmiyor'}
Son Erisim: ${data.timeSinceAccess || '-'}`;

      alert(msg);
    } catch (err) {
      alert('Ping hatasi: ' + err.message);
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

  const filteredGateways = gateways.filter(g => {
    const matchesFilter = filter === 'all' ||
      (filter === 'online' && getStatusClass(g.lastAccess) === 'online') ||
      (filter === 'offline' && getStatusClass(g.lastAccess) === 'offline') ||
      (filter === 'orion' && g.deviceType === 'Orion') ||
      (filter === 'wimbus' && g.deviceType === 'Wimbus');

    const matchesSearch = !searchTerm ||
      g.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.imei?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.siteName?.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Gateway bilgileri yukleniyor...</p>
      </div>
    );
  }

  return (
    <div className="gateway-page">
      <div className="page-header">
        <h1>Gateway Yonetimi</h1>
        <p className="subtitle">M-Bus Gateway izleme ve yonetim paneli</p>
      </div>

      {/* İstatistik Kartları */}
      <div className="stats-grid">
        <div className="stat-card gradient-blue">
          <div className="stat-icon">📡</div>
          <div className="stat-content">
            <span className="stat-value">{stats?.toplamGateway || 0}</span>
            <span className="stat-label">Toplam Gateway</span>
          </div>
        </div>

        <div className="stat-card gradient-green">
          <div className="stat-icon">🟢</div>
          <div className="stat-content">
            <span className="stat-value">{stats?.sonBirSaatAktif || 0}</span>
            <span className="stat-label">Son 1 Saat Aktif</span>
          </div>
        </div>

        <div className="stat-card gradient-orange">
          <div className="stat-icon">🔶</div>
          <div className="stat-content">
            <span className="stat-value">{stats?.sonBirGunAktif || 0}</span>
            <span className="stat-label">Son 24 Saat Aktif</span>
          </div>
        </div>

        <div className="stat-card gradient-purple">
          <div className="stat-icon">🌐</div>
          <div className="stat-content">
            <span className="stat-value">{stats?.modemIPOlan || 0}</span>
            <span className="stat-label">IP Adresi Olan</span>
          </div>
        </div>

        <div className="stat-card gradient-cyan">
          <div className="stat-icon">📶</div>
          <div className="stat-content">
            <span className="stat-value">{stats?.orionSayisi || 0}</span>
            <span className="stat-label">Orion GSM</span>
          </div>
        </div>

        <div className="stat-card gradient-red">
          <div className="stat-icon">📻</div>
          <div className="stat-content">
            <span className="stat-value">{stats?.wimbusSayisi || 0}</span>
            <span className="stat-label">Wimbus</span>
          </div>
        </div>
      </div>

      {/* Filtre ve Arama */}
      <div className="filter-section">
        <div className="filter-row">
          <div className="search-box">
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
              Tumu ({gateways.length})
            </button>
            <button
              className={`filter-btn ${filter === 'online' ? 'active' : ''}`}
              onClick={() => setFilter('online')}
            >
              Cevrimici
            </button>
            <button
              className={`filter-btn ${filter === 'offline' ? 'active' : ''}`}
              onClick={() => setFilter('offline')}
            >
              Cevrimdisi
            </button>
            <button
              className={`filter-btn ${filter === 'orion' ? 'active' : ''}`}
              onClick={() => setFilter('orion')}
            >
              Orion
            </button>
            <button
              className={`filter-btn ${filter === 'wimbus' ? 'active' : ''}`}
              onClick={() => setFilter('wimbus')}
            >
              Wimbus
            </button>
          </div>

          <button className="btn btn-primary" onClick={fetchData}>
            Yenile
          </button>
        </div>
      </div>

      {/* Gateway Listesi */}
      <div className="gateway-list-section">
        <h3>Gateway Listesi ({filteredGateways.length})</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Durum</th>
                <th>Bina</th>
                <th>Site</th>
                <th>IMEI</th>
                <th>Tip</th>
                <th>Sayac</th>
                <th>Son Erisim</th>
                <th>Islemler</th>
              </tr>
            </thead>
            <tbody>
              {filteredGateways.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center' }}>
                    Gateway bulunamadi
                  </td>
                </tr>
              ) : (
                filteredGateways.slice(0, 50).map((gw) => (
                  <tr key={gw.id} onClick={() => setSelectedGateway(gw)}>
                    <td>
                      <span className={`status-dot ${getStatusClass(gw.lastAccess)}`}></span>
                    </td>
                    <td>{gw.name}</td>
                    <td>{gw.siteName}</td>
                    <td className="imei-cell">{gw.imei}</td>
                    <td>
                      <span className={`device-badge ${(gw.deviceType || '').toLowerCase()}`}>
                        {gw.deviceType || 'Bilinmiyor'}
                      </span>
                    </td>
                    <td>{gw.sayacSayisi || 0}</td>
                    <td>{formatDate(gw.lastAccess)}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="btn-sm btn-info"
                          onClick={(e) => { e.stopPropagation(); handlePing(gw.id); }}
                          title="Ping"
                        >
                          📡
                        </button>
                        <button
                          className="btn-sm btn-success"
                          onClick={(e) => { e.stopPropagation(); }}
                          title="Oku"
                        >
                          📖
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Zamanlanmış Okumalar */}
      <div className="scheduled-section">
        <h3>Zamanlanmis Okumalar ({scheduledJobs.length})</h3>
        {scheduledJobs.length === 0 ? (
          <div className="empty-state">
            <p>Zamanlanmis okuma yok</p>
            <p className="hint">Site veya bina icin otomatik okuma zamanlayabilirsiniz</p>
          </div>
        ) : (
          <div className="scheduled-grid">
            {scheduledJobs.slice(0, 12).map((job) => (
              <div key={job.id} className="scheduled-card">
                <div className="scheduled-header">
                  <span className="scheduled-name">{job.name}</span>
                  <span className={`scheduled-status ${job.otomatikokuma ? 'active' : ''}`}>
                    {job.otomatikokuma ? 'Aktif' : 'Pasif'}
                  </span>
                </div>
                <div className="scheduled-details">
                  <span>Site: {job.siteName}</span>
                  <span>Saat: {job.otomatik_okuma_saat || '09:00'}</span>
                  <span>Sayac: {job.sayacSayisi}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Gateway Detay Modal */}
      {selectedGateway && (
        <div className="modal-overlay" onClick={() => setSelectedGateway(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedGateway.name}</h3>
              <button className="modal-close" onClick={() => setSelectedGateway(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                <div className="detail-item">
                  <label>IMEI</label>
                  <span>{selectedGateway.imei}</span>
                </div>
                <div className="detail-item">
                  <label>Cihaz Tipi</label>
                  <span>{selectedGateway.deviceType || 'Belirsiz'}</span>
                </div>
                <div className="detail-item">
                  <label>Site</label>
                  <span>{selectedGateway.siteName}</span>
                </div>
                <div className="detail-item">
                  <label>Konum</label>
                  <span>{selectedGateway.city} / {selectedGateway.district}</span>
                </div>
                <div className="detail-item">
                  <label>Sayac Sayisi</label>
                  <span>{selectedGateway.sayacSayisi || 0}</span>
                </div>
                <div className="detail-item">
                  <label>Son Erisim</label>
                  <span>{formatDate(selectedGateway.lastAccess)}</span>
                </div>
              </div>

              <div className="modal-actions">
                <button className="btn btn-primary" onClick={() => handlePing(selectedGateway.id)}>
                  Ping Gonder
                </button>
                <button className="btn btn-success">
                  Toplu Okuma Baslat
                </button>
                <button className="btn btn-secondary" onClick={() => setSelectedGateway(null)}>
                  Kapat
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bilgi Paneli */}
      <div className="info-panel">
        <h3>Gateway Turleri Hakkinda</h3>
        <div className="info-grid">
          <div className="info-item">
            <h4>Orion GSM</h4>
            <p>GSM/GPRS modemi ile uzaktan baglanti. SIM kart ile mobil ag uzerinden iletisim kurar.</p>
          </div>
          <div className="info-item">
            <h4>Wimbus</h4>
            <p>Kablosuz M-Bus protokolu. 868 MHz frekansinda RF iletisim saglar.</p>
          </div>
          <div className="info-item">
            <h4>Integral</h4>
            <p>Entegre gateway cozumu. TCP/IP uzerinden direkt baglanti destekler.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GatewayManagement;
