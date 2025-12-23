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
  CheckCircle,
  AlertTriangle
} from 'lucide-react';

function Reports() {
  const [reportType, setReportType] = useState('consumption');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedSite, setSelectedSite] = useState('');
  const [sites, setSites] = useState([]);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generatedReports, setGeneratedReports] = useState([]);

  const safeJson = async (res) => {
    try {
      const ct = res.headers.get('content-type');
      if (res.ok && ct?.includes('application/json')) return await res.json();
    } catch {}
    return null;
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setInitialLoading(true);
      setError(null);

      const [sitesRes, reportsRes] = await Promise.all([
        fetch('/api/sites?limit=500'),
        fetch('/api/reports/generated?limit=10')
      ]);

      const sitesData = await safeJson(sitesRes);
      setSites(sitesData?.sites || sitesData || []);

      const reportsData = await safeJson(reportsRes);
      setGeneratedReports(reportsData?.reports || reportsData || []);

    } catch (err) {
      console.error('Load data error:', err);
      setError(err.message);
      setSites([]);
      setGeneratedReports([]);
    } finally {
      setInitialLoading(false);
    }
  };

  const generateReport = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        type: reportType,
        startDate: dateRange.start,
        endDate: dateRange.end,
        ...(selectedSite && { siteId: selectedSite })
      });

      const res = await fetch(`/api/reports/generate?${params}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: reportType,
          dateRange,
          siteId: selectedSite || null
        })
      });

      const data = await safeJson(res);
      if (!data) {
        throw new Error('Rapor oluşturulamadı');
      }
      setReportData(data.report || data);

      // Refresh generated reports list
      const reportsRes = await fetch('/api/reports/generated?limit=10');
      const reportsData = await safeJson(reportsRes);
      setGeneratedReports(reportsData?.reports || reportsData || []);

    } catch (err) {
      console.error('Report generation error:', err);
      setError(err.message);
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (format) => {
    try {
      const res = await fetch(`/api/reports/export?format=${format}&type=${reportType}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportData, format })
      });

      if (!res.ok) {
        throw new Error('Rapor dışa aktarılamadı');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rapor-${reportType}-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();

    } catch (err) {
      console.error('Export error:', err);
      alert('Rapor dışa aktarılırken hata oluştu: ' + err.message);
    }
  };

  const downloadReport = async (reportId) => {
    try {
      const res = await fetch(`/api/reports/${reportId}/download`);
      if (!res.ok) throw new Error('Rapor indirilemedi');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rapor-${reportId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      console.error('Download error:', err);
      alert('Rapor indirilemedi: ' + err.message);
    }
  };

  const reportTypes = [
    { id: 'consumption', label: 'Tüketim Raporu', icon: Zap, description: 'Enerji ve hacim tüketim analizi' },
    { id: 'billing', label: 'Fatura Raporu', icon: FileText, description: 'Faturalandırma ve tahsilat raporu' },
    { id: 'gateway', label: 'Gateway Raporu', icon: BarChart3, description: 'Gateway durumu ve performans' },
    { id: 'anomaly', label: 'Anomali Raporu', icon: TrendingUp, description: 'Anormal tüketim tespiti' },
    { id: 'comparison', label: 'Karşılaştırma', icon: PieChart, description: 'Dönemsel karşılaştırma' },
  ];

  if (initialLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Veriler yükleniyor...</p>
      </div>
    );
  }

  if (error && !reportData) {
    return (
      <div className="error-container">
        <AlertTriangle size={48} />
        <h3>Veri Yüklenemedi</h3>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={loadInitialData}>
          <RefreshCw size={18} />
          Tekrar Dene
        </button>
      </div>
    );
  }

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
                    <button className="btn-icon" title="İndir" onClick={() => downloadReport(report.id)}>
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
