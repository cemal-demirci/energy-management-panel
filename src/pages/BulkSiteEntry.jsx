import React, { useState } from 'react';
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
  History
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
  const [selectedSite, setSelectedSite] = useState(null);
  const [readings, setReadings] = useState({});
  const [readingDate, setReadingDate] = useState(new Date().toISOString().split('T')[0]);
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFloors, setExpandedFloors] = useState({});
  const [savedCount, setSavedCount] = useState(0);

  // Site verileri
  const sites = [
    {
      id: 1,
      name: 'A Blok Residans',
      address: 'Merkez Mah. Ana Cad. No:1',
      totalMeters: 48,
      floors: 12,
      lastReading: '2024-01-14',
      completionRate: 85
    },
    {
      id: 2,
      name: 'B Blok Residans',
      address: 'Merkez Mah. Ana Cad. No:2',
      totalMeters: 36,
      floors: 9,
      lastReading: '2024-01-13',
      completionRate: 72
    },
    {
      id: 3,
      name: 'C Blok Ticari',
      address: 'İş Merkezi Cad. No:5',
      totalMeters: 24,
      floors: 6,
      lastReading: '2024-01-14',
      completionRate: 100
    },
    {
      id: 4,
      name: 'D Blok Konut',
      address: 'Yeşil Sok. No:10',
      totalMeters: 60,
      floors: 15,
      lastReading: '2024-01-12',
      completionRate: 45
    }
  ];

  // Site seçildiğinde sayaç verilerini oluştur
  const generateMetersForSite = (site) => {
    const meters = [];
    const types = ['electricity', 'water', 'gas', 'heat'];
    const typeNames = { electricity: 'Elektrik', water: 'Su', gas: 'Doğalgaz', heat: 'Isı' };
    const units = { electricity: 'kWh', water: 'm³', gas: 'm³', heat: 'kWh' };

    for (let floor = 1; floor <= site.floors; floor++) {
      const floorMeters = [];
      const unitsPerFloor = Math.ceil(site.totalMeters / site.floors / types.length);

      for (let unit = 1; unit <= unitsPerFloor; unit++) {
        types.forEach((type, typeIndex) => {
          const meterId = `${site.id}-${floor}-${unit}-${typeIndex}`;
          const baseReading = Math.floor(Math.random() * 10000) + 1000;
          const avgDaily = Math.floor(Math.random() * 50) + 10;

          floorMeters.push({
            id: meterId,
            floor: floor,
            unit: `Daire ${floor}${String(unit).padStart(2, '0')}`,
            type: type,
            typeName: typeNames[type],
            unitLabel: units[type],
            lastReading: baseReading,
            lastDate: site.lastReading,
            avgDaily: avgDaily,
            expectedReading: baseReading + (avgDaily * Math.floor(Math.random() * 3 + 1)),
            tenant: `Kiracı ${floor}${unit}`,
            status: Math.random() > 0.1 ? 'active' : 'inactive'
          });
        });
      }

      meters.push({
        floor: floor,
        meters: floorMeters
      });
    }

    return meters;
  };

  const [siteMeters, setSiteMeters] = useState([]);

  const handleSiteSelect = (site) => {
    setSelectedSite(site);
    const meters = generateMetersForSite(site);
    setSiteMeters(meters);
    setReadings({});
    setExpandedFloors({});
    setSavedCount(0);
  };

  const handleReadingChange = (meterId, value) => {
    setReadings(prev => ({
      ...prev,
      [meterId]: value
    }));
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
    floorData.meters.forEach(meter => {
      newReadings[meter.id] = meter.expectedReading.toString();
    });
    setReadings(newReadings);
  };

  const clearFloorReadings = (floorData) => {
    const newReadings = { ...readings };
    floorData.meters.forEach(meter => {
      delete newReadings[meter.id];
    });
    setReadings(newReadings);
  };

  const getFloorStats = (floorData) => {
    const total = floorData.meters.length;
    const entered = floorData.meters.filter(m => readings[m.id]).length;
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

    return { total, entered, valid, warnings, errors };
  };

  const getTotalStats = () => {
    let total = 0, entered = 0, valid = 0, warnings = 0, errors = 0;
    siteMeters.forEach(floor => {
      const stats = getFloorStats(floor);
      total += stats.total;
      entered += stats.entered;
      valid += stats.valid;
      warnings += stats.warnings;
      errors += stats.errors;
    });
    return { total, entered, valid, warnings, errors };
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

  const handleSaveAll = () => {
    const stats = getTotalStats();
    if (stats.errors > 0) {
      alert('Hatalı okumalar var! Lütfen düzeltin.');
      return;
    }

    setSavedCount(stats.entered);
    alert(`${stats.entered} sayaç okuması başarıyla kaydedildi!`);
  };

  const exportTemplate = () => {
    alert('Excel şablonu indiriliyor...');
  };

  const importFromExcel = () => {
    alert('Excel dosyası yükleme özelliği...');
  };

  const totalStats = selectedSite ? getTotalStats() : null;

  return (
    <div className="bulk-site-entry-page">
      <div className="page-header">
        <div className="header-content">
          <div className="header-icon">
            <Building2 size={28} />
          </div>
          <div>
            <h1>Site Bazlı Toplu Okuma</h1>
            <p>Tüm site sayaçlarını tek seferde okuyun ve kaydedin</p>
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
            <div className="entry-stat">
              <Edit3 size={20} />
              <div>
                <span className="stat-value">{totalStats?.entered}</span>
                <span className="stat-label">Girilen</span>
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
            <div className="entry-stat error">
              <XCircle size={20} />
              <div>
                <span className="stat-value">{totalStats?.errors}</span>
                <span className="stat-label">Hata</span>
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
                      <span className="stat entered">{stats.entered} girildi</span>
                      {stats.valid > 0 && <span className="stat valid">{stats.valid} geçerli</span>}
                      {stats.warnings > 0 && <span className="stat warning">{stats.warnings} uyarı</span>}
                      {stats.errors > 0 && <span className="stat error">{stats.errors} hata</span>}
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
                            <th>Durum</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filtered.map(meter => {
                            const validation = validateReading(meter);
                            return (
                              <tr key={meter.id} className={validation?.status || ''}>
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
                                  {validation && (
                                    <span className={`status-badge ${validation.status}`}>
                                      {validation.status === 'valid' && <CheckCircle2 size={14} />}
                                      {validation.status === 'warning' && <AlertTriangle size={14} />}
                                      {validation.status === 'error' && <XCircle size={14} />}
                                      {validation.message}
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
              </span>
              {savedCount > 0 && (
                <span className="saved-info">
                  <CheckCircle2 size={16} />
                  Son kayıt: {savedCount} sayaç
                </span>
              )}
            </div>
            <div className="save-actions">
              <button className="btn-secondary" onClick={() => setReadings({})}>
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
