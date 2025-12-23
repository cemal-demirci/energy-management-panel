import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Calendar,
  Building2,
  Filter,
  BarChart3,
  PieChart,
  TrendingUp,
  FileSpreadsheet,
  Printer,
  RefreshCw,
  ChevronDown,
  Zap,
  Droplets,
  Users,
  CheckCircle
} from 'lucide-react';

function Reports() {
  const [reportType, setReportType] = useState('consumption');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedSite, setSelectedSite] = useState('');
  const [sites, setSites] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [generatedReports, setGeneratedReports] = useState([]);

  useEffect(() => {
    fetchSites();
    loadGeneratedReports();
  }, []);

  const fetchSites = async () => {
    try {
      const res = await fetch('/api/sites?limit=500');
      const data = await res.json();
      setSites(data);
    } catch (err) {
      console.error('Sites fetch error:', err);
    }
  };

  const loadGeneratedReports = () => {
    // Sample generated reports
    setGeneratedReports([
      { id: 1, name: 'Aralık 2024 Tüketim Raporu', type: 'consumption', date: '2024-12-20', status: 'ready' },
      { id: 2, name: 'Q4 2024 Analiz Raporu', type: 'analysis', date: '2024-12-15', status: 'ready' },
      { id: 3, name: 'Gateway Durum Raporu', type: 'gateway', date: '2024-12-18', status: 'ready' },
    ]);
  };

  const generateReport = async () => {
    setLoading(true);
    try {
      // Simulate report generation
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Sample data based on report type
      const sampleData = {
        consumption: {
          totalEnergy: 1250000,
          totalVolume: 45000,
          meterCount: 500,
          avgConsumption: 2500,
          topConsumers: [
            { name: 'Site A - A Blok', value: 150000 },
            { name: 'Site B - B Blok', value: 120000 },
            { name: 'Site C - C Blok', value: 100000 },
          ]
        },
        billing: {
          totalAmount: 312500,
          invoiceCount: 500,
          avgInvoice: 625,
          collectionRate: 92.5
        },
        gateway: {
          totalGateways: 237,
          activeGateways: 198,
          offlineGateways: 39,
          avgUptime: 96.5
        }
      };

      setReportData(sampleData[reportType] || sampleData.consumption);
    } catch (err) {
      console.error('Report generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = (format) => {
    // Simulate export
    alert(`Rapor ${format.toUpperCase()} formatında indiriliyor...`);
  };

  const reportTypes = [
    { id: 'consumption', label: 'Tüketim Raporu', icon: Zap, description: 'Enerji ve hacim tüketim analizi' },
    { id: 'billing', label: 'Fatura Raporu', icon: FileText, description: 'Faturalandırma ve tahsilat raporu' },
    { id: 'gateway', label: 'Gateway Raporu', icon: BarChart3, description: 'Gateway durumu ve performans' },
    { id: 'anomaly', label: 'Anomali Raporu', icon: TrendingUp, description: 'Anormal tüketim tespiti' },
    { id: 'comparison', label: 'Karşılaştırma', icon: PieChart, description: 'Dönemsel karşılaştırma' },
  ];

  return (
    <div className="reports-page">
      <div className="page-header">
        <div className="header-title">
          <FileText size={28} />
          <div>
            <h1>Raporlar</h1>
            <p className="subtitle">Detaylı analiz ve raporlama</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={() => window.print()}>
            <Printer size={18} />
            Yazdır
          </button>
        </div>
      </div>

      <div className="reports-layout">
        {/* Left Panel - Report Configuration */}
        <div className="report-config-panel">
          <div className="config-card">
            <h3><Filter size={18} /> Rapor Ayarları</h3>

            {/* Report Type Selection */}
            <div className="config-section">
              <label>Rapor Türü</label>
              <div className="report-type-grid">
                {reportTypes.map(type => {
                  const IconComponent = type.icon;
                  return (
                    <button
                      key={type.id}
                      className={`report-type-btn ${reportType === type.id ? 'active' : ''}`}
                      onClick={() => setReportType(type.id)}
                    >
                      <IconComponent size={20} />
                      <span className="type-label">{type.label}</span>
                      <span className="type-desc">{type.description}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Date Range */}
            <div className="config-section">
              <label><Calendar size={16} /> Tarih Aralığı</label>
              <div className="date-range-inputs">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                  placeholder="Başlangıç"
                />
                <span>-</span>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                  placeholder="Bitiş"
                />
              </div>
              <div className="quick-date-btns">
                <button onClick={() => {
                  const today = new Date();
                  const start = new Date(today.getFullYear(), today.getMonth(), 1);
                  setDateRange({
                    start: start.toISOString().split('T')[0],
                    end: today.toISOString().split('T')[0]
                  });
                }}>Bu Ay</button>
                <button onClick={() => {
                  const today = new Date();
                  const start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
                  const end = new Date(today.getFullYear(), today.getMonth(), 0);
                  setDateRange({
                    start: start.toISOString().split('T')[0],
                    end: end.toISOString().split('T')[0]
                  });
                }}>Geçen Ay</button>
                <button onClick={() => {
                  const today = new Date();
                  const start = new Date(today.getFullYear(), 0, 1);
                  setDateRange({
                    start: start.toISOString().split('T')[0],
                    end: today.toISOString().split('T')[0]
                  });
                }}>Bu Yıl</button>
              </div>
            </div>

            {/* Site Filter */}
            <div className="config-section">
              <label><Building2 size={16} /> Site Filtresi</label>
              <select
                value={selectedSite}
                onChange={(e) => setSelectedSite(e.target.value)}
              >
                <option value="">Tüm Siteler</option>
                {sites.map(site => (
                  <option key={site.id} value={site.id}>{site.name}</option>
                ))}
              </select>
            </div>

            {/* Generate Button */}
            <button
              className="btn btn-primary btn-full"
              onClick={generateReport}
              disabled={loading}
            >
              {loading ? (
                <>
                  <RefreshCw size={18} className="spin" />
                  Rapor Oluşturuluyor...
                </>
              ) : (
                <>
                  <BarChart3 size={18} />
                  Rapor Oluştur
                </>
              )}
            </button>
          </div>

          {/* Recent Reports */}
          <div className="config-card">
            <h3><FileText size={18} /> Son Raporlar</h3>
            <div className="recent-reports-list">
              {generatedReports.map(report => (
                <div key={report.id} className="recent-report-item">
                  <div className="report-info">
                    <span className="report-name">{report.name}</span>
                    <span className="report-date">{report.date}</span>
                  </div>
                  <div className="report-actions">
                    <button className="btn-icon" title="İndir">
                      <Download size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel - Report Preview */}
        <div className="report-preview-panel">
          {!reportData ? (
            <div className="empty-preview">
              <FileText size={64} />
              <h3>Rapor Önizleme</h3>
              <p>Rapor ayarlarını seçin ve "Rapor Oluştur" butonuna tıklayın</p>
            </div>
          ) : (
            <div className="report-preview">
              <div className="preview-header">
                <h2>
                  {reportTypes.find(t => t.id === reportType)?.label || 'Rapor'}
                </h2>
                <div className="export-buttons">
                  <button className="btn btn-outline" onClick={() => exportReport('excel')}>
                    <FileSpreadsheet size={16} />
                    Excel
                  </button>
                  <button className="btn btn-outline" onClick={() => exportReport('pdf')}>
                    <FileText size={16} />
                    PDF
                  </button>
                </div>
              </div>

              {/* Report Content based on type */}
              {reportType === 'consumption' && reportData && (
                <div className="report-content">
                  <div className="report-stats-grid">
                    <div className="report-stat-card">
                      <Zap size={24} />
                      <div className="stat-info">
                        <span className="stat-value">{(reportData.totalEnergy / 1000).toFixed(2)} MWh</span>
                        <span className="stat-label">Toplam Enerji</span>
                      </div>
                    </div>
                    <div className="report-stat-card">
                      <Droplets size={24} />
                      <div className="stat-info">
                        <span className="stat-value">{reportData.totalVolume.toLocaleString()} m³</span>
                        <span className="stat-label">Toplam Hacim</span>
                      </div>
                    </div>
                    <div className="report-stat-card">
                      <Users size={24} />
                      <div className="stat-info">
                        <span className="stat-value">{reportData.meterCount}</span>
                        <span className="stat-label">Sayaç Sayısı</span>
                      </div>
                    </div>
                    <div className="report-stat-card">
                      <TrendingUp size={24} />
                      <div className="stat-info">
                        <span className="stat-value">{reportData.avgConsumption} kWh</span>
                        <span className="stat-label">Ortalama Tüketim</span>
                      </div>
                    </div>
                  </div>

                  <div className="report-section">
                    <h3>En Yüksek Tüketim</h3>
                    <div className="top-consumers-list">
                      {reportData.topConsumers.map((item, index) => (
                        <div key={index} className="consumer-item">
                          <span className="consumer-rank">#{index + 1}</span>
                          <span className="consumer-name">{item.name}</span>
                          <span className="consumer-value">{(item.value / 1000).toFixed(2)} MWh</span>
                          <div className="consumer-bar">
                            <div
                              className="consumer-bar-fill"
                              style={{ width: `${(item.value / reportData.topConsumers[0].value) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {reportType === 'billing' && reportData && (
                <div className="report-content">
                  <div className="report-stats-grid">
                    <div className="report-stat-card">
                      <FileText size={24} />
                      <div className="stat-info">
                        <span className="stat-value">{reportData.totalAmount.toLocaleString()} ₺</span>
                        <span className="stat-label">Toplam Tutar</span>
                      </div>
                    </div>
                    <div className="report-stat-card">
                      <Users size={24} />
                      <div className="stat-info">
                        <span className="stat-value">{reportData.invoiceCount}</span>
                        <span className="stat-label">Fatura Sayısı</span>
                      </div>
                    </div>
                    <div className="report-stat-card">
                      <TrendingUp size={24} />
                      <div className="stat-info">
                        <span className="stat-value">{reportData.avgInvoice} ₺</span>
                        <span className="stat-label">Ortalama Fatura</span>
                      </div>
                    </div>
                    <div className="report-stat-card success">
                      <CheckCircle size={24} />
                      <div className="stat-info">
                        <span className="stat-value">%{reportData.collectionRate}</span>
                        <span className="stat-label">Tahsilat Oranı</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {reportType === 'gateway' && reportData && (
                <div className="report-content">
                  <div className="report-stats-grid">
                    <div className="report-stat-card">
                      <BarChart3 size={24} />
                      <div className="stat-info">
                        <span className="stat-value">{reportData.totalGateways}</span>
                        <span className="stat-label">Toplam Gateway</span>
                      </div>
                    </div>
                    <div className="report-stat-card success">
                      <CheckCircle size={24} />
                      <div className="stat-info">
                        <span className="stat-value">{reportData.activeGateways}</span>
                        <span className="stat-label">Aktif</span>
                      </div>
                    </div>
                    <div className="report-stat-card warning">
                      <TrendingUp size={24} />
                      <div className="stat-info">
                        <span className="stat-value">{reportData.offlineGateways}</span>
                        <span className="stat-label">Çevrimdışı</span>
                      </div>
                    </div>
                    <div className="report-stat-card">
                      <Zap size={24} />
                      <div className="stat-info">
                        <span className="stat-value">%{reportData.avgUptime}</span>
                        <span className="stat-label">Uptime</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Reports;
