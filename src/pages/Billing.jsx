import React, { useState, useEffect } from 'react';

function Billing() {
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState('');
  const [billingData, setBillingData] = useState(null);
  const [distributionData, setDistributionData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('generate');

  // Fatura dağıtım formu
  const [totalAmount, setTotalAmount] = useState('');
  const [distributionMethod, setDistributionMethod] = useState('consumption');
  const [unitPrice, setUnitPrice] = useState('0.25');

  const safeJson = async (res) => {
    try {
      const ct = res.headers.get('content-type');
      if (res.ok && ct?.includes('application/json')) return await res.json();
    } catch {}
    return null;
  };

  useEffect(() => {
    fetchSites();
  }, []);

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

  const generateBilling = async () => {
    if (!selectedSite) return;
    setLoading(true);

    try {
      const res = await fetch('/api/billing/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId: parseInt(selectedSite),
          birimFiyat: parseFloat(unitPrice)
        })
      });

      const data = await safeJson(res);
      if (data) {
        setBillingData(data);
      }
    } catch (err) {
      console.error('Billing error:', err);
    } finally {
      setLoading(false);
    }
  };

  const distributeBilling = async () => {
    if (!selectedSite || !totalAmount) return;
    setLoading(true);

    try {
      const res = await fetch('/api/billing/distribute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          siteId: parseInt(selectedSite),
          totalAmount: parseFloat(totalAmount),
          distributionMethod
        })
      });

      const data = await safeJson(res);
      if (data) {
        setDistributionData(data);
      }
    } catch (err) {
      console.error('Distribution error:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = (data, filename) => {
    const headers = ['Bina', 'Daire No', 'Malik', 'Sayac Seri No', 'Tuketim (kWh)', 'Tutar (TL)'];
    const rows = data.map(row => [
      row.binaAdi || '',
      row.daireno || '',
      row.malik || '',
      row.sayacSeriNo || '',
      row.tuketim || 0,
      row.genelToplam || row.pay || 0
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    link.click();
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY'
    }).format(value);
  };

  const selectedSiteInfo = sites.find(s => s.id === parseInt(selectedSite));

  return (
    <div className="billing-page">
      <div className="page-header">
        <h1>Faturalandirma Otomasyonu</h1>
        <p className="subtitle">AI destekli otomatik fatura olusturma ve dagitim</p>
      </div>

      {/* Tab Secimi */}
      <div className="filter-tabs">
        <button
          className={`filter-tab ${activeTab === 'generate' ? 'active' : ''}`}
          onClick={() => setActiveTab('generate')}
        >
          Fatura Olustur
        </button>
        <button
          className={`filter-tab ${activeTab === 'distribute' ? 'active' : ''}`}
          onClick={() => setActiveTab('distribute')}
        >
          Fatura Dagit
        </button>
      </div>

      {/* Site Secimi */}
      <div className="billing-controls">
        <div className="filter-group">
          <label>Site Sec</label>
          <select
            value={selectedSite}
            onChange={(e) => {
              setSelectedSite(e.target.value);
              setBillingData(null);
              setDistributionData(null);
            }}
          >
            <option value="">-- Site Secin --</option>
            {sites.map(site => (
              <option key={site.id} value={site.id}>
                {site.name} - {site.city}
              </option>
            ))}
          </select>
        </div>

        {activeTab === 'generate' && (
          <>
            <div className="filter-group">
              <label>Birim Fiyat (TL/kWh)</label>
              <input
                type="number"
                step="0.01"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
              />
            </div>
            <button
              className="btn btn-primary"
              onClick={generateBilling}
              disabled={!selectedSite || loading}
            >
              {loading ? 'Hesaplaniyor...' : 'Fatura Olustur'}
            </button>
          </>
        )}

        {activeTab === 'distribute' && (
          <>
            <div className="filter-group">
              <label>Toplam Fatura Tutari (TL)</label>
              <input
                type="number"
                value={totalAmount}
                onChange={(e) => setTotalAmount(e.target.value)}
                placeholder="Ornek: 15000"
              />
            </div>
            <div className="filter-group">
              <label>Dagitim Yontemi</label>
              <select
                value={distributionMethod}
                onChange={(e) => setDistributionMethod(e.target.value)}
              >
                <option value="consumption">Tuketime Gore</option>
                <option value="equal">Esit Dagitim</option>
              </select>
            </div>
            <button
              className="btn btn-primary"
              onClick={distributeBilling}
              disabled={!selectedSite || !totalAmount || loading}
            >
              {loading ? 'Hesaplaniyor...' : 'Dagitimi Hesapla'}
            </button>
          </>
        )}
      </div>

      {/* Fatura Olusturma Sonucu */}
      {activeTab === 'generate' && billingData && (
        <div className="billing-result">
          <div className="billing-summary">
            <div className="summary-card">
              <div className="summary-icon">🏢</div>
              <div className="summary-content">
                <span className="summary-value">{billingData.site?.name}</span>
                <span className="summary-label">{billingData.site?.city} / {billingData.site?.district}</span>
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-icon">🏠</div>
              <div className="summary-content">
                <span className="summary-value">{billingData.summary?.totalUnits}</span>
                <span className="summary-label">Toplam Daire</span>
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-icon">⚡</div>
              <div className="summary-content">
                <span className="summary-value">{billingData.summary?.totalConsumption?.toLocaleString()} kWh</span>
                <span className="summary-label">Toplam Tuketim</span>
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-icon">💰</div>
              <div className="summary-content">
                <span className="summary-value">{formatCurrency(billingData.summary?.totalAmount)}</span>
                <span className="summary-label">Toplam Tutar</span>
              </div>
            </div>
          </div>

          {/* AI Analizi */}
          {billingData.aiAnalysis && (
            <div className="ai-analysis-box">
              <h4>🤖 AI Analizi</h4>
              <p>{billingData.aiAnalysis}</p>
            </div>
          )}

          <div className="billing-actions">
            <button
              className="btn btn-secondary"
              onClick={() => exportToCSV(billingData.invoices, `fatura_${billingData.site?.name}`)}
            >
              📥 CSV Indir
            </button>
          </div>

          <div className="invoice-table">
            <h3>Daire Bazli Faturalar</h3>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Bina</th>
                    <th>Daire</th>
                    <th>Malik</th>
                    <th>Sayac</th>
                    <th>Tuketim (kWh)</th>
                    <th>Tutar</th>
                    <th>KDV</th>
                    <th>Toplam</th>
                  </tr>
                </thead>
                <tbody>
                  {billingData.invoices?.map((inv, i) => (
                    <tr key={i}>
                      <td>{inv.binaAdi || '-'}</td>
                      <td>{inv.daireno}</td>
                      <td>{inv.malik || '-'}</td>
                      <td>{inv.sayacSeriNo || '-'}</td>
                      <td>{inv.tuketim?.toLocaleString()}</td>
                      <td>{formatCurrency(inv.tutar)}</td>
                      <td>{formatCurrency(inv.kdv)}</td>
                      <td><strong>{formatCurrency(inv.genelToplam)}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Fatura Dagitim Sonucu */}
      {activeTab === 'distribute' && distributionData && (
        <div className="billing-result">
          <div className="billing-summary">
            <div className="summary-card">
              <div className="summary-icon">💵</div>
              <div className="summary-content">
                <span className="summary-value">{formatCurrency(distributionData.totalAmount)}</span>
                <span className="summary-label">Toplam Fatura</span>
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-icon">⚡</div>
              <div className="summary-content">
                <span className="summary-value">{distributionData.totalConsumption?.toLocaleString()} kWh</span>
                <span className="summary-label">Toplam Tuketim</span>
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-icon">🏠</div>
              <div className="summary-content">
                <span className="summary-value">{distributionData.unitCount}</span>
                <span className="summary-label">Daire Sayisi</span>
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-icon">📊</div>
              <div className="summary-content">
                <span className="summary-value">{distributionData.distributionMethod === 'consumption' ? 'Tuketime Gore' : 'Esit'}</span>
                <span className="summary-label">Dagitim Yontemi</span>
              </div>
            </div>
          </div>

          {/* AI Analizi */}
          {distributionData.aiAnalysis && (
            <div className="ai-analysis-box">
              <h4>🤖 AI Dagitim Analizi</h4>
              <p>{distributionData.aiAnalysis}</p>
            </div>
          )}

          <div className="billing-actions">
            <button
              className="btn btn-secondary"
              onClick={() => exportToCSV(distributionData.distribution, `dagitim_${selectedSiteInfo?.name}`)}
            >
              📥 CSV Indir
            </button>
          </div>

          <div className="invoice-table">
            <h3>Daire Bazli Dagitim</h3>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Bina</th>
                    <th>Daire</th>
                    <th>Malik</th>
                    <th>Tuketim (kWh)</th>
                    <th>Oran (%)</th>
                    <th>Odeyecegi Tutar</th>
                  </tr>
                </thead>
                <tbody>
                  {distributionData.distribution?.map((dist, i) => (
                    <tr key={i}>
                      <td>{dist.binaAdi || '-'}</td>
                      <td>{dist.daireno}</td>
                      <td>{dist.malik || '-'}</td>
                      <td>{dist.tuketim?.toLocaleString()}</td>
                      <td>%{dist.oran?.toFixed(2)}</td>
                      <td><strong>{formatCurrency(dist.pay)}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Bilgi Paneli */}
      <div className="info-panel">
        <h3>ℹ️ Faturalandirma Sistemi Hakkinda</h3>
        <p>
          Bu sistem, sayac okumalarindan elde edilen verileri kullanarak otomatik fatura olusturur
          ve daire bazli dagitim yapar. AI destekli analiz ile tuketim anomalileri ve tasarruf
          onerileri saglanir.
        </p>
        <ul>
          <li><strong>Fatura Olustur:</strong> Sayac tuketimlerine gore birim fiyat uzerinden fatura hesaplar</li>
          <li><strong>Fatura Dagit:</strong> Gelen toplam faturayi daireler arasinda oransal veya esit dagitir</li>
          <li><strong>AI Analizi:</strong> Tuketim verilerini analiz ederek oneriler sunar</li>
          <li><strong>Export:</strong> Fatura verilerini CSV formatinda indirebilirsiniz</li>
        </ul>
      </div>
    </div>
  );
}

export default Billing;
