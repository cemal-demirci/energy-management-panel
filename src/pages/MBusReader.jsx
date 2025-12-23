import React, { useState, useEffect, useRef } from 'react';

function MBusReader() {
  const [sites, setSites] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [selectedSite, setSelectedSite] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [readingJob, setReadingJob] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const logRef = useRef(null);

  const safeJson = async (res) => {
    try {
      const ct = res.headers.get('content-type');
      if (res.ok && ct?.includes('application/json')) return await res.json();
    } catch {}
    return null;
  };

  useEffect(() => {
    fetchSites();
    fetchHistory();
  }, []);

  useEffect(() => {
    if (selectedSite) {
      fetchBuildings(selectedSite);
    }
  }, [selectedSite]);

  useEffect(() => {
    if (readingJob && readingJob.status === 'running') {
      const interval = setInterval(() => {
        fetchJobStatus(readingJob.jobId);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [readingJob]);

  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [readingJob?.logs]);

  const fetchSites = async () => {
    try {
      const res = await fetch('/api/sites?limit=500');
      const data = await safeJson(res);
      setSites(data || []);
    } catch (err) {
      console.error('Sites error:', err);
      setSites([]);
    }
  };

  const fetchBuildings = async (siteId) => {
    try {
      const res = await fetch(`/api/buildings?siteId=${siteId}`);
      const data = await safeJson(res);
      setBuildings(data || []);
    } catch (err) {
      console.error('Buildings error:', err);
      setBuildings([]);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/mbus/history');
      const data = await safeJson(res);
      setHistory(data || []);
    } catch (err) {
      console.error('History error:', err);
      setHistory([]);
    }
  };

  const fetchJobStatus = async (jobId) => {
    try {
      const res = await fetch(`/api/mbus/status/${jobId}`);
      const data = await safeJson(res);
      if (data) {
        setReadingJob(prev => ({
          ...prev,
          ...data
        }));

        if (data.status === 'completed') {
          fetchHistory();
        }
      }
    } catch (err) {
      console.error('Status error:', err);
    }
  };

  const startSiteReading = async () => {
    if (!selectedSite) return;
    setLoading(true);

    try {
      const res = await fetch('/api/mbus/read-site', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ siteId: parseInt(selectedSite) })
      });

      const data = await safeJson(res);
      if (data) {
        setReadingJob({
          jobId: data.jobId,
          totalMeters: data.totalMeters,
          completedMeters: 0,
          successCount: 0,
          errorCount: 0,
          status: 'running',
          logs: []
        });
      }
    } catch (err) {
      console.error('Start reading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const startBuildingReading = async () => {
    if (!selectedBuilding) return;
    setLoading(true);

    try {
      const res = await fetch('/api/mbus/read-building', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buildingId: parseInt(selectedBuilding) })
      });

      const data = await safeJson(res);
      if (data) {
        setReadingJob({
          jobId: data.jobId,
          totalMeters: data.totalMeters,
          completedMeters: 0,
          successCount: 0,
          errorCount: 0,
          status: 'running',
          logs: []
        });
      }
    } catch (err) {
      console.error('Start reading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('tr-TR');
  };

  const selectedSiteInfo = sites.find(s => s.id === parseInt(selectedSite));

  return (
    <div className="mbus-page">
      <div className="page-header">
        <h1>M-Bus Toplu Okuma</h1>
        <p className="subtitle">Site veya bina bazlı toplu sayac okuma islemi</p>
      </div>

      {/* Okuma Kontrolleri */}
      <div className="reading-controls">
        <h3>Okuma Baslat</h3>
        <div className="control-row">
          <div className="filter-group">
            <label>Site Sec</label>
            <select
              value={selectedSite}
              onChange={(e) => {
                setSelectedSite(e.target.value);
                setSelectedBuilding('');
              }}
            >
              <option value="">-- Site Secin --</option>
              {sites.map(site => (
                <option key={site.id} value={site.id}>
                  {site.name} ({site.sayacSayisi || 0} sayac)
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label>Bina Sec (Opsiyonel)</label>
            <select
              value={selectedBuilding}
              onChange={(e) => setSelectedBuilding(e.target.value)}
              disabled={!selectedSite}
            >
              <option value="">-- Tum Site --</option>
              {buildings.map(b => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          <button
            className="btn btn-primary"
            onClick={selectedBuilding ? startBuildingReading : startSiteReading}
            disabled={!selectedSite || loading || (readingJob && readingJob.status === 'running')}
          >
            {loading ? 'Baslatiliyor...' : 'Okumayi Baslat'}
          </button>
        </div>

        {selectedSiteInfo && (
          <div className="site-info-box">
            <span><strong>Site:</strong> {selectedSiteInfo.name}</span>
            <span><strong>Konum:</strong> {selectedSiteInfo.city} / {selectedSiteInfo.district}</span>
            <span><strong>Sayac:</strong> {selectedSiteInfo.sayacSayisi || 0}</span>
          </div>
        )}
      </div>

      {/* Okuma Durumu */}
      {readingJob && (
        <div className="reading-status">
          <div className="status-header">
            <h3>
              {readingJob.status === 'running' ? 'Okuma Devam Ediyor...' : 'Okuma Tamamlandi'}
            </h3>
            <span className={`status-badge ${readingJob.status}`}>
              {readingJob.status === 'running' ? 'Calisiyor' : 'Tamamlandi'}
            </span>
          </div>

          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${readingJob.progress || 0}%` }}
            />
          </div>

          <div className="stats-row">
            <div className="stat-box">
              <span className="value">{readingJob.completedMeters || 0}</span>
              <span className="label">/ {readingJob.totalMeters || 0} Okunan</span>
            </div>
            <div className="stat-box success">
              <span className="value">{readingJob.successCount || 0}</span>
              <span className="label">Basarili</span>
            </div>
            <div className="stat-box error">
              <span className="value">{readingJob.errorCount || 0}</span>
              <span className="label">Hatali</span>
            </div>
            <div className="stat-box">
              <span className="value">{formatTime(readingJob.elapsedTime || 0)}</span>
              <span className="label">Gecen Sure</span>
            </div>
          </div>

          {/* Log Alani */}
          <div className="reading-log" ref={logRef}>
            {readingJob.logs?.map((log, i) => (
              <div key={i} className={`log-entry ${log.type}`}>
                [{new Date(log.time).toLocaleTimeString('tr-TR')}] {log.message}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Okuma Gecmisi */}
      <div className="reading-history">
        <h3>Okuma Gecmisi</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Tarih</th>
                <th>Durum</th>
                <th>Toplam</th>
                <th>Basarili</th>
                <th>Hatali</th>
                <th>Sure</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center' }}>
                    Henuz okuma yapilmamis
                  </td>
                </tr>
              ) : (
                history.map((job) => (
                  <tr key={job.jobId}>
                    <td>{formatDate(job.startTime)}</td>
                    <td>
                      <span className={`status-badge ${job.status}`}>
                        {job.status === 'completed' ? 'Tamamlandi' : 'Devam Ediyor'}
                      </span>
                    </td>
                    <td>{job.totalMeters}</td>
                    <td className="success-text">{job.successCount}</td>
                    <td className="error-text">{job.errorCount}</td>
                    <td>
                      {job.endTime
                        ? formatTime((new Date(job.endTime) - new Date(job.startTime)) / 1000)
                        : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bilgi Paneli */}
      <div className="info-panel">
        <h3>M-Bus Okuma Hakkinda</h3>
        <p>
          M-Bus (Meter-Bus) protokolu ile sayaclar uzaktan okunur. Her sayac ortalama 2-5 saniye
          icinde okunur. Site bazli toplu okuma, tum sayaclari sirayla okuyarak veritabanina kaydeder.
        </p>
        <ul>
          <li><strong>Site Okuma:</strong> Secilen sitedeki tum sayaclari okur</li>
          <li><strong>Bina Okuma:</strong> Sadece secilen binadaki sayaclari okur</li>
          <li><strong>Otomatik Kayit:</strong> Okunan degerler aninda veritabanina yazilir</li>
          <li><strong>Hata Takibi:</strong> Okunamayan sayaclar raporlanir</li>
        </ul>
      </div>
    </div>
  );
}

export default MBusReader;
