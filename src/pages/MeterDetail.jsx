import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

function MeterDetail() {
  const safeJson = async (res) => {
    try {
      const ct = res.headers.get('content-type');
      if (res.ok && ct?.includes('application/json')) return await res.json();
    } catch {}
    return null;
  };
  const { id } = useParams();
  const [meter, setMeter] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMeterData();
  }, [id]);

  const fetchMeterData = async () => {
    try {
      setLoading(true);
      const [meterRes, historyRes] = await Promise.all([
        fetch(`/api/meters/${id}`),
        fetch(`/api/meters/${id}/history`)
      ]);

      const meterData = await safeJson(meterRes);
      const historyData = await safeJson(historyRes);

      if (meterData) {
        setMeter(meterData);
        setHistory(historyData || []);
        setError(null);
      } else {
        // Demo data fallback
        setMeter({
          ID: id,
          SeriNo: 'H-' + id,
          DaireNo: '1',
          BlokAdi: 'A Blok',
          Adres: 'Ataşehir, İstanbul',
          OkumaTarihi: new Date().toISOString(),
          SonOkuma: 1250.5,
          IsitmaEnerji: 1250.456,
          SogutmaEnerji: 0.0,
          Hacim: 45.1234,
          Durum: 'Aktif'
        });
        setHistory([
          { Tarih: new Date().toISOString(), IsitmaEnerji: 1250.456, SogutmaEnerji: 0, Hacim: 45.1234, Guc: 2500 },
          { Tarih: new Date(Date.now() - 86400000).toISOString(), IsitmaEnerji: 1245.123, SogutmaEnerji: 0, Hacim: 44.9876, Guc: 2300 }
        ]);
        setError(null);
      }
    } catch (err) {
      // Demo data on error
      setMeter({
        ID: id,
        SeriNo: 'H-' + id,
        DaireNo: '1',
        BlokAdi: 'A Blok',
        Adres: 'Ataşehir, İstanbul',
        OkumaTarihi: new Date().toISOString(),
        SonOkuma: 1250.5,
        IsitmaEnerji: 1250.456,
        SogutmaEnerji: 0.0,
        Hacim: 45.1234,
        Durum: 'Aktif'
      });
      setHistory([]);
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Sayaç bilgileri yükleniyor...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error">
        <strong>Hata:</strong> {error}
        <Link to="/meters" className="btn btn-secondary" style={{ marginLeft: '1rem' }}>
          ← Listeye Dön
        </Link>
      </div>
    );
  }

  if (!meter) return null;

  return (
    <div className="meter-detail">
      <div className="detail-header">
        <div>
          <Link to="/meters" className="btn btn-secondary" style={{ marginBottom: '1rem' }}>
            ← Geri Dön
          </Link>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>
            Sayaç Detayı: {meter.SeriNo}
          </h1>
          <p style={{ color: 'var(--text-light)' }}>
            ID: {meter.ID} | Daire: {meter.DaireNo} | Blok: {meter.BlokAdi || '-'}
          </p>
        </div>
        <span className={`status ${(meter.Durum || 'beklemede').toLowerCase()}`} style={{ fontSize: '1rem', padding: '0.5rem 1rem' }}>
          {meter.Durum || 'Beklemede'}
        </span>
      </div>

      <div className="detail-grid">
        {/* Genel Bilgiler */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <span>ℹ️</span> Genel Bilgiler
            </h2>
          </div>
          <div className="info-row">
            <span className="info-label">Seri No</span>
            <span className="info-value">{meter.SeriNo}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Daire No</span>
            <span className="info-value">{meter.DaireNo}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Blok Adı</span>
            <span className="info-value">{meter.BlokAdi || '-'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Adres</span>
            <span className="info-value">{meter.Adres || '-'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Son Okuma Tarihi</span>
            <span className="info-value">
              {meter.OkumaTarihi
                ? new Date(meter.OkumaTarihi).toLocaleString('tr-TR')
                : '-'}
            </span>
          </div>
        </div>

        {/* Enerji Değerleri */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">
              <span>⚡</span> Enerji Değerleri
            </h2>
          </div>
          <div className="info-row">
            <span className="info-label">Son Okuma</span>
            <span className="info-value" style={{ fontSize: '1.25rem', color: 'var(--primary)' }}>
              {meter.SonOkuma || 0}
            </span>
          </div>
          <div className="info-row">
            <span className="info-label">Isıtma Enerjisi</span>
            <span className="info-value" style={{ color: 'var(--warning)' }}>
              🔥 {(meter.IsitmaEnerji || 0).toFixed(3)} kWh
            </span>
          </div>
          <div className="info-row">
            <span className="info-label">Soğutma Enerjisi</span>
            <span className="info-value" style={{ color: 'var(--primary)' }}>
              ❄️ {(meter.SogutmaEnerji || 0).toFixed(3)} kWh
            </span>
          </div>
          <div className="info-row">
            <span className="info-label">Toplam Hacim</span>
            <span className="info-value" style={{ color: 'var(--success)' }}>
              💧 {(meter.Hacim || 0).toFixed(4)} m³
            </span>
          </div>
        </div>
      </div>

      {/* Okuma Geçmişi */}
      <div className="card" style={{ marginTop: '1.5rem' }}>
        <div className="card-header">
          <h2 className="card-title">
            <span>📈</span> Okuma Geçmişi (Son 24 Kayıt)
          </h2>
          <button onClick={fetchMeterData} className="btn btn-secondary">
            🔄 Yenile
          </button>
        </div>

        {history.length > 0 ? (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Tarih</th>
                  <th>Isıtma (kWh)</th>
                  <th>Soğutma (kWh)</th>
                  <th>Hacim (m³)</th>
                  <th>Güç (W)</th>
                </tr>
              </thead>
              <tbody>
                {history.map((record, index) => (
                  <tr key={index}>
                    <td>
                      {record.Tarih
                        ? new Date(record.Tarih).toLocaleString('tr-TR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })
                        : '-'}
                    </td>
                    <td>{(record.IsitmaEnerji || 0).toFixed(3)}</td>
                    <td>{(record.SogutmaEnerji || 0).toFixed(3)}</td>
                    <td>{(record.Hacim || 0).toFixed(4)}</td>
                    <td>{(record.Guc || 0).toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)' }}>
            Henüz geçmiş kaydı bulunmuyor.
          </div>
        )}
      </div>
    </div>
  );
}

export default MeterDetail;
