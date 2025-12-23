import React, { useState, useEffect } from 'react';
import {
  Building2,
  Zap,
  Droplets,
  Flame,
  Save,
  Check,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Upload,
  Download,
  FileSpreadsheet,
  Calendar,
  Clock,
  Users,
  Gauge,
  ArrowRight,
  RefreshCw,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  Edit3,
  Copy,
  Trash2,
  Plus,
  MoreVertical,
  Target,
  TrendingUp,
  History,
  Radio,
  Wifi,
  WifiOff,
  Play,
  Loader2
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts';

function BulkSiteEntry() {
  const safeJson = async (res) => {
    try {
      const ct = res.headers.get('content-type');
      if (res.ok && ct?.includes('application/json')) return await res.json();
    } catch {}
    return null;
  };

  const [selectedSite, setSelectedSite] = useState(null);
  const [readings, setReadings] = useState({});
  const [readingDate, setReadingDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFloors, setExpandedFloors] = useState({});
  const [savedCount, setSavedCount] = useState(0);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);

  // M-Bus okuma state'leri
  const [mbusReading, setMbusReading] = useState(false);
  const [mbusProgress, setMbusProgress] = useState(0);
  const [mbusResults, setMbusResults] = useState({}); // { meterId: { success: bool, value: number, error: string } }
  const [readingSource, setReadingSource] = useState({}); // { meterId: 'mbus' | 'manual' }

  // Site verilerini API'den çek
  useEffect(() => {
    fetchSites();
  }, []);

  const fetchSites = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/sites');
      const data = await safeJson(response);
      if (data) {
        setSites(data.sites || data || []);
      } else {
        // Demo data fallback
        setSites([
          { id: 1, name: 'Merkez Sitesi', address: 'Ataşehir, İstanbul', totalMeters: 120, floors: 12, lastReading: '2024-12-22', completionRate: 85 },
          { id: 2, name: 'Yeşil Vadi', address: 'Kadıköy, İstanbul', totalMeters: 80, floors: 8, lastReading: '2024-12-21', completionRate: 100 }
        ]);
      }
    } catch (error) {
      console.error('Site verisi çekilemedi:', error);
      setSites([
        { id: 1, name: 'Merkez Sitesi', address: 'Ataşehir, İstanbul', totalMeters: 120, floors: 12, lastReading: '2024-12-22', completionRate: 85 }
      ]);
    }
    setLoading(false);
  };

  // Site seçildiğinde sayaç verilerini API'den çek
  const fetchMetersForSite = async (site) => {
    try {
      const response = await fetch(`/api/meters?siteId=${site.id}`);
      const data = await safeJson(response);

      if (!data) {
        // Demo data fallback
        return [
          { floor: 1, meters: [
            { id: 1, floor: 1, unit: 'Daire 1', type: 'heat', typeName: 'Isı', unitLabel: 'kWh', lastReading: 1250, expectedReading: 1280, tenant: 'Ahmet Yılmaz', status: 'active', mbusAddress: '01', serialNumber: 'H001' },
            { id: 2, floor: 1, unit: 'Daire 2', type: 'heat', typeName: 'Isı', unitLabel: 'kWh', lastReading: 980, expectedReading: 1010, tenant: 'Mehmet Demir', status: 'active', mbusAddress: '02', serialNumber: 'H002' }
          ]},
          { floor: 2, meters: [
            { id: 3, floor: 2, unit: 'Daire 3', type: 'heat', typeName: 'Isı', unitLabel: 'kWh', lastReading: 1120, expectedReading: 1150, tenant: 'Ayşe Kaya', status: 'active', mbusAddress: '03', serialNumber: 'H003' }
          ]}
        ];
      }

      const metersData = data.meters || data || [];

      // API'den gelen sayaçları kat bazlı grupla
      const typeNames = { electricity: 'Elektrik', water: 'Su', gas: 'Doğalgaz', heat: 'Isı' };
      const units = { electricity: 'kWh', water: 'm³', gas: 'm³', heat: 'kWh' };

      const floorMap = {};
      metersData.forEach(meter => {
        const floor = meter.floor || meter.kat || 1;
        if (!floorMap[floor]) {
          floorMap[floor] = [];
        }

        floorMap[floor].push({
          id: meter.id || meter.ID,
          floor: floor,
          unit: meter.unit || meter.daire || `Daire ${meter.daireNo || meter.DaireNo || ''}`,
          type: meter.type || 'heat',
          typeName: typeNames[meter.type] || 'Isı',
          unitLabel: units[meter.type] || 'kWh',
          lastReading: meter.lastReading || meter.sonOkuma || 0,
          lastDate: meter.lastDate || meter.sonOkumaTarihi || '',
          avgDaily: meter.avgDaily || meter.ortGunluk || 0,
          expectedReading: meter.expectedReading || meter.beklenenOkuma || (meter.lastReading || 0),
          tenant: meter.tenant || meter.malik || meter.malikIsim || '',
          status: meter.status || meter.durum || 'active',
          mbusAddress: meter.mbusAddress || meter.MbusAdres || '',
          serialNumber: meter.serialNumber || meter.seriNo || meter.SeriNo || ''
        });
      });

      // Kat bazlı array'e dönüştür
      const floors = Object.keys(floorMap)
        .map(Number)
        .sort((a, b) => a - b)
        .map(floor => ({
          floor: floor,
          meters: floorMap[floor]
        }));

      return floors;
    } catch (error) {
      console.error('Sayaç verisi çekilemedi:', error);
      return [];
    }
  };

  const [siteMeters, setSiteMeters] = useState([]);

  const handleSiteSelect = async (site) => {
    setSelectedSite(site);
    setLoading(true);
    const meters = await fetchMetersForSite(site);
    setSiteMeters(meters);
    setReadings({});
    setExpandedFloors({});
    setSavedCount(0);
    setMbusResults({});
    setReadingSource({});
    setLoading(false);
  };

  const handleReadingChange = (meterId, value) => {
    setReadings(prev => ({
      ...prev,
      [meterId]: value
    }));
    // Manuel giriş olarak işaretle
    setReadingSource(prev => ({
      ...prev,
      [meterId]: 'manual'
    }));
  };

  // M-Bus ile toplu okuma
  const handleMbusReadAll = async () => {
    if (!selectedSite) return;

    setMbusReading(true);
    setMbusProgress(0);

    const allMeters = siteMeters.flatMap(f => f.meters);
    const totalCount = allMeters.length;
    let completed = 0;
    const results = {};
    const newReadings = { ...readings };
    const sources = { ...readingSource };

    for (const meter of allMeters) {
      try {
        // API çağrısı yap
        const response = await fetch(`/api/mbus/read/${meter.mbusAddress}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            siteId: selectedSite.id,
            meterId: meter.id,
            serialNumber: meter.serialNumber
          })
        });

        if (response.ok) {
          const data = await response.json();
          results[meter.id] = { success: true, value: data.value };
          newReadings[meter.id] = data.value.toString();
          sources[meter.id] = 'mbus';
        } else {
          const errorData = await response.json().catch(() => ({}));
          results[meter.id] = { success: false, error: errorData.message || 'M-Bus iletişim hatası' };
        }
      } catch (error) {
        results[meter.id] = { success: false, error: 'Bağlantı zaman aşımı' };
      }

      completed++;
      setMbusProgress(Math.round((completed / totalCount) * 100));

      // UI güncellemesi için küçük gecikme
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    setMbusResults(results);
    setReadings(newReadings);
    setReadingSource(sources);
    setMbusReading(false);
  };

  // Tek sayaç için M-Bus retry
  const handleRetryMbus = async (meter) => {
    const results = { ...mbusResults };
    const newReadings = { ...readings };
    const sources = { ...readingSource };

    try {
      const response = await fetch(`/api/mbus/read/${meter.mbusAddress}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId: selectedSite.id,
          meterId: meter.id,
          serialNumber: meter.serialNumber
        })
      });

      if (response.ok) {
        const data = await response.json();
        results[meter.id] = { success: true, value: data.value };
        newReadings[meter.id] = data.value.toString();
        sources[meter.id] = 'mbus';
      } else {
        const errorData = await response.json().catch(() => ({}));
        results[meter.id] = { success: false, error: errorData.message || 'Tekrar denenecek' };
      }
    } catch (error) {
      results[meter.id] = { success: false, error: 'Bağlantı hatası' };
    }

    setMbusResults(results);
    setReadings(newReadings);
    setReadingSource(sources);
  };

  const toggleFloor = (floor) => {
    setExpandedFloors(prev => ({
      ...prev,
      [floor]: !prev[floor]
    }));
  };

  const expandAllFloors = () => {
    const all = {};
    siteMeters.forEach(f => all[f.floor] = true);
    setExpandedFloors(all);
  };

  const collapseAllFloors = () => {
    setExpandedFloors({});
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'electricity': return <Zap size={16} />;
      case 'water': return <Droplets size={16} />;
      case 'gas': return <Flame size={16} />;
      case 'heat': return <Flame size={16} />;
      default: return <Zap size={16} />;
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

  const validateReading = (meter) => {
    const value = readings[meter.id];
    if (!value) return null;

    const numValue = parseFloat(value);
    if (numValue < meter.lastReading) {
      return { status: 'error', message: 'Düşük değer' };
    }
    const diff = ((numValue - meter.expectedReading) / meter.expectedReading * 100);
    if (Math.abs(diff) > 30) {
      return { status: 'warning', message: `%${Math.abs(diff).toFixed(0)} sapma` };
    }
    return { status: 'valid', message: 'OK' };
  };

  const copyExpectedToAll = (floorData) => {
    const newReadings = { ...readings };
    const sources = { ...readingSource };
    floorData.meters.forEach(meter => {
      newReadings[meter.id] = meter.expectedReading.toString();
      sources[meter.id] = 'manual';
    });
    setReadings(newReadings);
    setReadingSource(sources);
  };

  const clearFloorReadings = (floorData) => {
    const newReadings = { ...readings };
    const sources = { ...readingSource };
    const results = { ...mbusResults };
    floorData.meters.forEach(meter => {
      delete newReadings[meter.id];
      delete sources[meter.id];
      delete results[meter.id];
    });
    setReadings(newReadings);
    setReadingSource(sources);
    setMbusResults(results);
  };

  const getFloorStats = (floorData) => {
    const total = floorData.meters.length;
    const entered = floorData.meters.filter(m => readings[m.id]).length;
    const mbusRead = floorData.meters.filter(m => readingSource[m.id] === 'mbus').length;
    const manualEntry = floorData.meters.filter(m => readingSource[m.id] === 'manual').length;
    const failed = floorData.meters.filter(m => mbusResults[m.id] && !mbusResults[m.id].success).length;
    const valid = floorData.meters.filter(m => {
      const v = validateReading(m);
      return v && v.status === 'valid';
    }).length;
    const warnings = floorData.meters.filter(m => {
      const v = validateReading(m);
      return v && v.status === 'warning';
    }).length;
    const errors = floorData.meters.filter(m => {
      const v = validateReading(m);
      return v && v.status === 'error';
    }).length;

    return { total, entered, mbusRead, manualEntry, failed, valid, warnings, errors };
  };

  const getTotalStats = () => {
    let total = 0, entered = 0, mbusRead = 0, manualEntry = 0, failed = 0, valid = 0, warnings = 0, errors = 0;
    siteMeters.forEach(floor => {
      const stats = getFloorStats(floor);
      total += stats.total;
      entered += stats.entered;
      mbusRead += stats.mbusRead;
      manualEntry += stats.manualEntry;
      failed += stats.failed;
      valid += stats.valid;
      warnings += stats.warnings;
      errors += stats.errors;
    });
    return { total, entered, mbusRead, manualEntry, failed, valid, warnings, errors };
  };

  const filteredMeters = (meters) => {
    return meters.filter(meter => {
      const matchesType = filterType === 'all' || meter.type === filterType;
      const matchesSearch = searchTerm === '' ||
        meter.unit.toLowerCase().includes(searchTerm.toLowerCase()) ||
        meter.tenant.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesType && matchesSearch;
    });
  };

  const handleSaveAll = async () => {
    const stats = getTotalStats();
    if (stats.errors > 0) {
      alert('Hatalı okumalar var! Lütfen düzeltin.');
      return;
    }

    try {
      // Tüm okumaları API'ye kaydet
      const allReadings = [];
      siteMeters.forEach(floor => {
        floor.meters.forEach(meter => {
          if (readings[meter.id]) {
            allReadings.push({
              meterId: meter.id,
              siteId: selectedSite.id,
              floor: meter.floor,
              unit: meter.unit,
              type: meter.type,
              value: parseFloat(readings[meter.id]),
              previousValue: meter.lastReading,
              readingDate: readingDate,
              source: readingSource[meter.id] || 'manual',
              mbusAddress: meter.mbusAddress
            });
          }
        });
      });

      const response = await fetch('/api/readings/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ readings: allReadings })
      });

      if (response.ok) {
        setSavedCount(stats.entered);
        alert(`${stats.entered} sayaç okuması başarıyla kaydedildi!\n- M-Bus: ${stats.mbusRead}\n- Manuel: ${stats.manualEntry}`);
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(`Kayıt hatası: ${errorData.message || 'Bir hata oluştu'}`);
      }
    } catch (error) {
      alert(`Bağlantı hatası: ${error.message}`);
    }
  };

  const exportTemplate = () => {
    alert('Excel şablonu indiriliyor...');
  };

  const importFromExcel = () => {
    alert('Excel dosyası yükleme özelliği...');
  };

  const totalStats = selectedSite ? getTotalStats() : null;

  if (loading) {
    return (
      <div className="bulk-site-entry-page">
        <div className="loading-container">
          <Loader2 size={32} className="spin" />
          <p>Site verileri yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bulk-site-entry-page">
      <div className="page-header">
        <div className="header-content">
          <div className="header-icon">
            <Building2 size={28} />
          </div>
          <div>
            <h1>Site Bazlı Toplu Okuma</h1>
            <p>M-Bus ile otomatik okuma veya manuel değer girişi yapın</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-secondary" onClick={exportTemplate}>
            <Download size={18} />
            Şablon İndir
          </button>
          <button className="btn-secondary" onClick={importFromExcel}>
            <Upload size={18} />
            Excel Yükle
          </button>
        </div>
      </div>

      {!selectedSite ? (
        /* Site Seçim Ekranı */
        <div className="site-selection">
          <h2>Site Seçin</h2>
          <div className="sites-grid">
            {sites.map(site => (
              <div
                key={site.id}
                className="site-card"
                onClick={() => handleSiteSelect(site)}
              >
                <div className="site-header">
                  <div className="site-icon">
                    <Building2 size={24} />
                  </div>
                  <div className="site-info">
                    <h3>{site.name}</h3>
                    <span className="site-address">{site.address}</span>
                  </div>
                </div>

                <div className="site-stats">
                  <div className="stat">
                    <Gauge size={18} />
                    <span>{site.totalMeters} Sayaç</span>
                  </div>
                  <div className="stat">
                    <Building2 size={18} />
                    <span>{site.floors} Kat</span>
                  </div>
                  <div className="stat">
                    <Calendar size={18} />
                    <span>{site.lastReading}</span>
                  </div>
                </div>

                <div className="completion-bar">
                  <div className="bar-header">
                    <span>Tamamlanma</span>
                    <span>{site.completionRate}%</span>
                  </div>
                  <div className="bar-track">
                    <div
                      className="bar-fill"
                      style={{
                        width: `${site.completionRate}%`,
                        background: site.completionRate === 100 ? '#10b981' :
                          site.completionRate >= 70 ? '#f59e0b' : '#ef4444'
                      }}
                    ></div>
                  </div>
                </div>

                <button className="select-site-btn">
                  Seç <ArrowRight size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Toplu Okuma Ekranı */
        <div className="bulk-entry-container">
          {/* M-Bus Kontrol Paneli */}
          <div className="mbus-controls">
            <button
              className={`btn btn-mbus ${mbusReading ? 'loading' : ''}`}
              onClick={handleMbusReadAll}
              disabled={mbusReading}
            >
              {mbusReading ? (
                <>
                  <Loader2 size={18} className="spin" />
                  M-Bus Okunuyor... ({mbusProgress}%)
                </>
              ) : (
                <>
                  <Radio size={18} />
                  M-Bus ile Tümünü Oku
                </>
              )}
            </button>

            <div className={`mbus-status ${mbusReading ? 'reading' : totalStats?.mbusRead > 0 ? 'success' : ''}`}>
              {mbusReading ? (
                <>
                  <Wifi size={16} />
                  <span>Okuma devam ediyor...</span>
                </>
              ) : totalStats?.mbusRead > 0 ? (
                <>
                  <CheckCircle2 size={16} />
                  <span>{totalStats.mbusRead} sayaç okundu</span>
                </>
              ) : (
                <>
                  <WifiOff size={16} />
                  <span>Henüz okuma yapılmadı</span>
                </>
              )}
            </div>

            {totalStats?.failed > 0 && (
              <div className="mbus-status error">
                <XCircle size={16} />
                <span>{totalStats.failed} sayaç okunamadı - Manuel giriş yapın</span>
              </div>
            )}
          </div>

          {/* Okuma Progress */}
          {mbusReading && (
            <div className="reading-progress">
              <div className="progress-header">
                <span>M-Bus Okuma İlerlemesi</span>
                <span>{mbusProgress}%</span>
              </div>
              <div className="progress-bar">
                <div className="fill" style={{ width: `${mbusProgress}%` }}></div>
              </div>
            </div>
          )}

          {/* Üst Bilgi Barı */}
          <div className="entry-header-bar">
            <div className="site-badge">
              <Building2 size={20} />
              <span>{selectedSite.name}</span>
              <button className="change-site-btn" onClick={() => setSelectedSite(null)}>
                Değiştir
              </button>
            </div>

            <div className="date-selector">
              <Calendar size={18} />
              <input
                type="date"
                value={readingDate}
                onChange={(e) => setReadingDate(e.target.value)}
              />
            </div>

            <div className="filter-group">
              <Filter size={18} />
              <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                <option value="all">Tüm Tipler</option>
                <option value="electricity">Elektrik</option>
                <option value="water">Su</option>
                <option value="gas">Doğalgaz</option>
                <option value="heat">Isı</option>
              </select>
            </div>

            <div className="search-box">
              <Search size={18} />
              <input
                type="text"
                placeholder="Daire veya kiracı ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* İstatistik Kartları */}
          <div className="entry-stats-bar">
            <div className="entry-stat">
              <Gauge size={20} />
              <div>
                <span className="stat-value">{totalStats?.total}</span>
                <span className="stat-label">Toplam Sayaç</span>
              </div>
            </div>
            <div className="entry-stat mbus-read">
              <Radio size={20} />
              <div>
                <span className="stat-value">{totalStats?.mbusRead}</span>
                <span className="stat-label">M-Bus Okunan</span>
              </div>
            </div>
            <div className="entry-stat manual-entry">
              <Edit3 size={20} />
              <div>
                <span className="stat-value">{totalStats?.manualEntry}</span>
                <span className="stat-label">Manuel Giriş</span>
              </div>
            </div>
            <div className="entry-stat failed">
              <XCircle size={20} />
              <div>
                <span className="stat-value">{totalStats?.failed}</span>
                <span className="stat-label">Okunamayan</span>
              </div>
            </div>
            <div className="entry-stat success">
              <CheckCircle2 size={20} />
              <div>
                <span className="stat-value">{totalStats?.valid}</span>
                <span className="stat-label">Geçerli</span>
              </div>
            </div>
            <div className="entry-stat warning">
              <AlertTriangle size={20} />
              <div>
                <span className="stat-value">{totalStats?.warnings}</span>
                <span className="stat-label">Uyarı</span>
              </div>
            </div>
            <div className="entry-stat">
              <Target size={20} />
              <div>
                <span className="stat-value">
                  {totalStats ? Math.round((totalStats.entered / totalStats.total) * 100) : 0}%
                </span>
                <span className="stat-label">İlerleme</span>
              </div>
            </div>
          </div>

          {/* Expand/Collapse Butonları */}
          <div className="floor-actions">
            <button onClick={expandAllFloors}>
              <ChevronDown size={18} />
              Tümünü Aç
            </button>
            <button onClick={collapseAllFloors}>
              <ChevronUp size={18} />
              Tümünü Kapat
            </button>
          </div>

          {/* Kat Listesi */}
          <div className="floors-list">
            {siteMeters.map(floorData => {
              const stats = getFloorStats(floorData);
              const isExpanded = expandedFloors[floorData.floor];
              const filtered = filteredMeters(floorData.meters);

              return (
                <div key={floorData.floor} className="floor-section">
                  <div
                    className="floor-header"
                    onClick={() => toggleFloor(floorData.floor)}
                  >
                    <div className="floor-title">
                      {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      <Building2 size={20} />
                      <span>Kat {floorData.floor}</span>
                      <span className="meter-count">{stats.total} sayaç</span>
                    </div>

                    <div className="floor-stats">
                      {stats.mbusRead > 0 && <span className="stat mbus">{stats.mbusRead} M-Bus</span>}
                      {stats.manualEntry > 0 && <span className="stat manual">{stats.manualEntry} Manuel</span>}
                      {stats.failed > 0 && <span className="stat error">{stats.failed} Hata</span>}
                      {stats.valid > 0 && <span className="stat valid">{stats.valid} geçerli</span>}
                      {stats.warnings > 0 && <span className="stat warning">{stats.warnings} uyarı</span>}
                    </div>

                    <div className="floor-progress">
                      <div className="progress-track">
                        <div
                          className="progress-fill"
                          style={{ width: `${(stats.entered / stats.total) * 100}%` }}
                        ></div>
                      </div>
                      <span>{Math.round((stats.entered / stats.total) * 100)}%</span>
                    </div>

                    <div className="floor-quick-actions" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="quick-btn"
                        title="Tahmini değerleri doldur"
                        onClick={() => copyExpectedToAll(floorData)}
                      >
                        <Copy size={16} />
                      </button>
                      <button
                        className="quick-btn"
                        title="Temizle"
                        onClick={() => clearFloorReadings(floorData)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="floor-meters">
                      <table className="meters-table">
                        <thead>
                          <tr>
                            <th>Daire</th>
                            <th>Tip</th>
                            <th>Son Okuma</th>
                            <th>Beklenen</th>
                            <th>Yeni Okuma</th>
                            <th>Kaynak</th>
                            <th>Durum</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filtered.map(meter => {
                            const validation = validateReading(meter);
                            const mbusResult = mbusResults[meter.id];
                            const source = readingSource[meter.id];
                            const isFailed = mbusResult && !mbusResult.success;

                            return (
                              <tr
                                key={meter.id}
                                className={`${validation?.status || ''} ${isFailed ? 'mbus-failed' : ''} ${source === 'mbus' ? 'mbus-success' : ''}`}
                              >
                                <td>
                                  <div className="unit-info">
                                    <span className="unit-name">{meter.unit}</span>
                                    <span className="tenant-name">{meter.tenant}</span>
                                  </div>
                                </td>
                                <td>
                                  <span
                                    className="type-badge"
                                    style={{
                                      background: `${getTypeColor(meter.type)}20`,
                                      color: getTypeColor(meter.type)
                                    }}
                                  >
                                    {getTypeIcon(meter.type)}
                                    {meter.typeName}
                                  </span>
                                </td>
                                <td>
                                  <div className="reading-cell">
                                    <span className="value">{meter.lastReading.toLocaleString()}</span>
                                    <span className="unit">{meter.unitLabel}</span>
                                  </div>
                                </td>
                                <td>
                                  <div className="expected-cell">
                                    <span className="value">{meter.expectedReading.toLocaleString()}</span>
                                    <button
                                      className="use-expected"
                                      onClick={() => handleReadingChange(meter.id, meter.expectedReading.toString())}
                                      title="Beklenen değeri kullan"
                                    >
                                      <ArrowRight size={14} />
                                    </button>
                                  </div>
                                </td>
                                <td>
                                  <div className={`input-cell ${validation?.status || ''}`}>
                                    <input
                                      type="number"
                                      value={readings[meter.id] || ''}
                                      onChange={(e) => handleReadingChange(meter.id, e.target.value)}
                                      placeholder={meter.expectedReading.toString()}
                                    />
                                    <span className="unit">{meter.unitLabel}</span>
                                  </div>
                                </td>
                                <td>
                                  {source === 'mbus' ? (
                                    <span className="mbus-read-badge">
                                      <Radio size={12} />
                                      M-Bus
                                    </span>
                                  ) : source === 'manual' ? (
                                    <span className="manual-entry-badge">
                                      <Edit3 size={12} />
                                      Manuel
                                    </span>
                                  ) : isFailed ? (
                                    <button
                                      className="retry-btn"
                                      onClick={() => handleRetryMbus(meter)}
                                    >
                                      <RefreshCw size={12} />
                                      Tekrar Dene
                                    </button>
                                  ) : (
                                    <span className="text-muted">-</span>
                                  )}
                                </td>
                                <td>
                                  {validation && (
                                    <span className={`status-badge ${validation.status}`}>
                                      {validation.status === 'valid' && <CheckCircle2 size={14} />}
                                      {validation.status === 'warning' && <AlertTriangle size={14} />}
                                      {validation.status === 'error' && <XCircle size={14} />}
                                      {validation.message}
                                    </span>
                                  )}
                                  {isFailed && !readings[meter.id] && (
                                    <span className="status-badge error">
                                      <XCircle size={14} />
                                      {mbusResult.error}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Alt Kaydetme Barı */}
          <div className="save-bar">
            <div className="save-summary">
              <span>
                <strong>{totalStats?.entered}</strong> / {totalStats?.total} sayaç okundu
                {totalStats?.mbusRead > 0 && (
                  <span className="source-info">
                    ({totalStats.mbusRead} M-Bus, {totalStats.manualEntry} Manuel)
                  </span>
                )}
              </span>
              {savedCount > 0 && (
                <span className="saved-info">
                  <CheckCircle2 size={16} />
                  Son kayıt: {savedCount} sayaç
                </span>
              )}
            </div>
            <div className="save-actions">
              <button className="btn-secondary" onClick={() => {
                setReadings({});
                setMbusResults({});
                setReadingSource({});
              }}>
                <RefreshCw size={18} />
                Temizle
              </button>
              <button
                className="btn-primary"
                onClick={handleSaveAll}
                disabled={totalStats?.entered === 0}
              >
                <Save size={18} />
                Tümünü Kaydet ({totalStats?.entered})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BulkSiteEntry;
