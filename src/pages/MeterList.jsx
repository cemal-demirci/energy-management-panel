import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Thermometer,
  ThermometerSun,
  ThermometerSnowflake,
  Droplets,
  Flame,
  Activity,
  Filter,
  RefreshCw,
  Search,
  Download,
  AlertTriangle,
  CheckCircle,
  Clock,
  Building2
} from 'lucide-react';

function MeterList() {
  const [searchParams] = useSearchParams();
  const [meters, setMeters] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSite, setSelectedSite] = useState(searchParams.get('siteId') || '');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchSites();
  }, []);

  useEffect(() => {
    fetchMeters();
  }, [selectedSite]);

  const fetchSites = async () => {
    try {
      const res = await fetch('/api/sites?limit=500');
      const data = await res.json();
      setSites(data);
    } catch (err) {
      console.error('Sites error:', err);
      // Demo sites
      setSites([
        { id: 1, name: 'Merkez Site', sayacSayisi: 245 },
        { id: 2, name: 'Batı Konutları', sayacSayisi: 180 },
        { id: 3, name: 'Doğu Rezidans', sayacSayisi: 320 },
        { id: 4, name: 'Kuzey Park', sayacSayisi: 156 }
      ]);
    }
  };

  const fetchMeters = async () => {
    try {
      setLoading(true);
      const url = selectedSite
        ? `/api/meters?siteId=${selectedSite}&limit=200`
        : '/api/meters?limit=200';
      const res = await fetch(url);

      if (!res.ok) {
        throw new Error('Sayaç verileri alınamadı');
      }

      const metersData = await res.json();
      setMeters(metersData);
      setError(null);
    } catch (err) {
      // Demo heat meter data
      const demoMeters = [];
      for (let i = 1; i <= 50; i++) {
        const girisSicaklik = 68 + Math.random() * 12;
        const cikisSicaklik = 42 + Math.random() * 12;
        const deltaT = girisSicaklik - cikisSicaklik;
        const debi = 80 + Math.random() * 150;
        const guc = (debi * deltaT * 1.163) / 1000;

        demoMeters.push({
          ID: i,
          SeriNo: `USM-${2024}${String(i).padStart(4, '0')}`,
          DaireNo: `${Math.floor(i / 4) + 1}/${(i % 4) + 1}`,
          BinaAdi: `Blok ${String.fromCharCode(65 + (i % 5))}`,
          SiteAdi: ['Merkez Site', 'Batı Konutları', 'Doğu Rezidans', 'Kuzey Park'][i % 4],
          Il: 'İstanbul',
          Ilce: ['Kadıköy', 'Beşiktaş', 'Şişli', 'Ümraniye'][i % 4],
          OkumaTarihi: new Date(Date.now() - Math.random() * 86400000 * 7),
          IsitmaEnerji: Math.floor(1500 + Math.random() * 3500),
          SogutmaEnerji: Math.floor(200 + Math.random() * 800),
          Hacim: (25 + Math.random() * 75).toFixed(3),
          GirisSicaklik: girisSicaklik.toFixed(1),
          CikisSicaklik: cikisSicaklik.toFixed(1),
          DeltaT: deltaT.toFixed(1),
          Debi: debi.toFixed(1),
          AnlikGuc: guc.toFixed(2),
          Durum: Math.random() > 0.1 ? 'Aktif' : Math.random() > 0.5 ? 'Uyarı' : 'Hata',
          BataryaDurumu: Math.floor(60 + Math.random() * 40),
          SinyalGucu: Math.floor(50 + Math.random() * 50)
        });
      }
      setMeters(demoMeters);
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Aktif': return 'success';
      case 'Uyarı': return 'warning';
      case 'Hata': return 'danger';
      default: return 'muted';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'Aktif': return <CheckCircle size={14} />;
      case 'Uyarı': return <AlertTriangle size={14} />;
      case 'Hata': return <AlertTriangle size={14} />;
      default: return <Clock size={14} />;
    }
  };

  const filteredMeters = meters.filter(meter => {
    const matchSearch =
      (meter.SeriNo?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (meter.DaireNo?.toString() || '').includes(searchTerm) ||
      (meter.BinaAdi?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (meter.SiteAdi?.toLowerCase() || '').includes(searchTerm.toLowerCase());

    const matchStatus = statusFilter === 'all' || meter.Durum === statusFilter;

    return matchSearch && matchStatus;
  });

  const exportToCSV = () => {
    const headers = ['Seri No', 'Daire', 'Bina', 'Site', 'Isı Enerjisi (kWh)', 'Hacim (m³)', 'Giriş °C', 'Çıkış °C', 'ΔT', 'Debi (L/h)', 'Durum'];
    const rows = filteredMeters.map(m => [
      m.SeriNo, m.DaireNo, m.BinaAdi, m.SiteAdi, m.IsitmaEnerji, m.Hacim, m.GirisSicaklik, m.CikisSicaklik, m.DeltaT, m.Debi, m.Durum
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `isi-sayaclari-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Isı sayaçları yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="meter-list-page">
      <div className="page-header">
        <div className="header-title">
          <Thermometer size={28} />
          <div>
            <h1>Isı Sayaçları</h1>
            <p className="subtitle">Ultrasonik ısı sayacı yönetimi</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={exportToCSV}>
            <Download size={18} />
            Dışa Aktar
          </button>
          <button className="btn btn-primary" onClick={fetchMeters}>
            <RefreshCw size={18} />
            Yenile
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-card">
        <div className="filter-group">
          <div className="search-input">
            <Search size={18} />
            <input
              type="text"
              placeholder="Seri No, Daire, Bina ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="select-wrapper">
            <Building2 size={18} />
            <select
              value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}
            >
              <option value="">Tüm Siteler</option>
              {sites.map(site => (
                <option key={site.id} value={site.id}>
                  {site.name} ({site.sayacSayisi || 0} sayaç)
                </option>
              ))}
            </select>
          </div>

          <div className="select-wrapper">
            <Filter size={18} />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">Tüm Durumlar</option>
              <option value="Aktif">Aktif</option>
              <option value="Uyarı">Uyarı</option>
              <option value="Hata">Hata</option>
            </select>
          </div>
        </div>

        <div className="filter-stats">
          <span className="stat-badge">
            <Thermometer size={14} />
            {filteredMeters.length} Sayaç
          </span>
          <span className="stat-badge success">
            <CheckCircle size={14} />
            {filteredMeters.filter(m => m.Durum === 'Aktif').length} Aktif
          </span>
          <span className="stat-badge warning">
            <AlertTriangle size={14} />
            {filteredMeters.filter(m => m.Durum === 'Uyarı').length} Uyarı
          </span>
          <span className="stat-badge danger">
            <AlertTriangle size={14} />
            {filteredMeters.filter(m => m.Durum === 'Hata').length} Hata
          </span>
        </div>
      </div>

      {/* Heat Meter Table */}
      <div className="table-card">
        <div className="table-wrapper">
          <table className="heat-meter-table">
            <thead>
              <tr>
                <th>Seri No</th>
                <th>Konum</th>
                <th>
                  <div className="th-icon">
                    <Flame size={14} />
                    Isı Enerjisi
                  </div>
                </th>
                <th>
                  <div className="th-icon">
                    <Droplets size={14} />
                    Hacim
                  </div>
                </th>
                <th>
                  <div className="th-icon">
                    <ThermometerSun size={14} />
                    T1 (Giriş)
                  </div>
                </th>
                <th>
                  <div className="th-icon">
                    <ThermometerSnowflake size={14} />
                    T2 (Çıkış)
                  </div>
                </th>
                <th>
                  <div className="th-icon">
                    <Activity size={14} />
                    ΔT
                  </div>
                </th>
                <th>Debi</th>
                <th>Güç</th>
                <th>Son Okuma</th>
                <th>Durum</th>
                <th>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {filteredMeters.map((meter) => (
                <tr key={meter.ID} className={`status-${getStatusColor(meter.Durum)}`}>
                  <td className="serial-cell">
                    <span className="serial-no">{meter.SeriNo || '-'}</span>
                  </td>
                  <td className="location-cell">
                    <div className="location-main">{meter.DaireNo || '-'} / {meter.BinaAdi || '-'}</div>
                    <div className="location-sub">{meter.SiteAdi || '-'}</div>
                  </td>
                  <td className="energy-cell">
                    <span className="energy-value heat">{(meter.IsitmaEnerji || 0).toLocaleString('tr-TR')}</span>
                    <span className="energy-unit">kWh</span>
                  </td>
                  <td className="volume-cell">
                    <span className="volume-value">{meter.Hacim || '0.000'}</span>
                    <span className="volume-unit">m³</span>
                  </td>
                  <td className="temp-cell inlet">
                    <span className="temp-value">{meter.GirisSicaklik || '-'}</span>
                    <span className="temp-unit">°C</span>
                  </td>
                  <td className="temp-cell outlet">
                    <span className="temp-value">{meter.CikisSicaklik || '-'}</span>
                    <span className="temp-unit">°C</span>
                  </td>
                  <td className="delta-cell">
                    <span className="delta-value">{meter.DeltaT || '-'}</span>
                    <span className="delta-unit">°C</span>
                  </td>
                  <td className="flow-cell">
                    <span className="flow-value">{meter.Debi || '-'}</span>
                    <span className="flow-unit">L/h</span>
                  </td>
                  <td className="power-cell">
                    <span className="power-value">{meter.AnlikGuc || '-'}</span>
                    <span className="power-unit">kW</span>
                  </td>
                  <td className="date-cell">
                    {meter.OkumaTarihi
                      ? new Date(meter.OkumaTarihi).toLocaleString('tr-TR', {
                          day: '2-digit',
                          month: '2-digit',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : '-'}
                  </td>
                  <td className="status-cell">
                    <span className={`status-badge ${getStatusColor(meter.Durum)}`}>
                      {getStatusIcon(meter.Durum)}
                      {meter.Durum || 'Beklemede'}
                    </span>
                  </td>
                  <td className="action-cell">
                    <Link to={`/meters/${meter.ID}`} className="btn btn-sm btn-primary">
                      Detay
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredMeters.length === 0 && (
          <div className="empty-state">
            <Thermometer size={48} />
            <h3>Sayaç Bulunamadı</h3>
            <p>Arama kriterlerinize uygun ısı sayacı bulunamadı.</p>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="summary-grid">
        <div className="summary-card">
          <div className="summary-icon heat">
            <Flame size={24} />
          </div>
          <div className="summary-content">
            <span className="summary-value">
              {(filteredMeters.reduce((sum, m) => sum + (m.IsitmaEnerji || 0), 0) / 1000).toFixed(1)} MWh
            </span>
            <span className="summary-label">Toplam Isı Enerjisi</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon volume">
            <Droplets size={24} />
          </div>
          <div className="summary-content">
            <span className="summary-value">
              {filteredMeters.reduce((sum, m) => sum + parseFloat(m.Hacim || 0), 0).toFixed(1)} m³
            </span>
            <span className="summary-label">Toplam Hacim</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon temp">
            <Activity size={24} />
          </div>
          <div className="summary-content">
            <span className="summary-value">
              {(filteredMeters.reduce((sum, m) => sum + parseFloat(m.DeltaT || 0), 0) / filteredMeters.length || 0).toFixed(1)} °C
            </span>
            <span className="summary-label">Ortalama ΔT</span>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon power">
            <Activity size={24} />
          </div>
          <div className="summary-content">
            <span className="summary-value">
              {filteredMeters.reduce((sum, m) => sum + parseFloat(m.AnlikGuc || 0), 0).toFixed(1)} kW
            </span>
            <span className="summary-label">Toplam Anlık Güç</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MeterList;
