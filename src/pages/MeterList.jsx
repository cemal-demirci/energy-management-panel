import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

function MeterList() {
  const [searchParams] = useSearchParams();
  const [meters, setMeters] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSite, setSelectedSite] = useState(searchParams.get('siteId') || '');

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
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const filteredMeters = meters.filter(meter => {
    const matchSearch =
      (meter.SeriNo?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (meter.DaireNo?.toString() || '').includes(searchTerm) ||
      (meter.Adres?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (meter.SiteAdi?.toLowerCase() || '').includes(searchTerm.toLowerCase());

    return matchSearch;
  });

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Sayaçlar yükleniyor...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error">
        <strong>Hata:</strong> {error}
        <button onClick={fetchData} className="btn btn-primary" style={{ marginLeft: '1rem' }}>
          Tekrar Dene
        </button>
      </div>
    );
  }

  return (
    <div className="meter-list">
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">
            <span>📊</span> Sayaç Listesi
          </h2>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <input
              type="text"
              placeholder="Ara (Seri No, Daire No, Adres)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                width: '250px'
              }}
            />
            <select
              value={selectedSite}
              onChange={(e) => setSelectedSite(e.target.value)}
              style={{
                padding: '0.5rem 1rem',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                background: 'white',
                minWidth: '220px'
              }}
            >
              <option value="">Tüm Siteler</option>
              {sites.map(site => (
                <option key={site.id} value={site.id}>
                  {site.name} ({site.sayacSayisi || 0} sayaç)
                </option>
              ))}
            </select>
            <button onClick={fetchMeters} className="btn btn-secondary">
              🔄 Yenile
            </button>
          </div>
        </div>

        <p style={{ marginBottom: '1rem', color: 'var(--text-light)' }}>
          Toplam {filteredMeters.length} sayaç gösteriliyor
        </p>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Seri No</th>
                <th>Daire</th>
                <th>Bina</th>
                <th>Site / Konum</th>
                <th>Son Okuma</th>
                <th>Enerji (kWh)</th>
                <th>Hacim (m³)</th>
                <th>Durum</th>
                <th>İşlem</th>
              </tr>
            </thead>
            <tbody>
              {filteredMeters.map((meter) => (
                <tr key={meter.ID}>
                  <td>{meter.ID}</td>
                  <td style={{ fontWeight: 600 }}>{meter.SeriNo || '-'}</td>
                  <td>{meter.DaireNo || '-'}</td>
                  <td>{meter.BinaAdi || '-'}</td>
                  <td style={{ fontSize: '0.9rem' }}>
                    <div>{meter.SiteAdi || '-'}</div>
                    <div style={{ color: 'var(--text-light)', fontSize: '0.8rem' }}>
                      {meter.Il && meter.Ilce ? `${meter.Il} / ${meter.Ilce}` : ''}
                    </div>
                  </td>
                  <td>
                    {meter.OkumaTarihi
                      ? new Date(meter.OkumaTarihi).toLocaleString('tr-TR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : '-'}
                  </td>
                  <td>{(meter.IsitmaEnerji || 0).toLocaleString('tr-TR', { maximumFractionDigits: 2 })}</td>
                  <td>{(meter.Hacim || 0).toFixed(3)}</td>
                  <td>
                    <span className={`status ${meter.Durum ? 'aktif' : 'beklemede'}`}>
                      {meter.Durum || 'Beklemede'}
                    </span>
                  </td>
                  <td>
                    <Link to={`/meters/${meter.ID}`} className="btn btn-primary" style={{ padding: '0.25rem 0.75rem' }}>
                      Detay
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredMeters.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-light)' }}>
            Gösterilecek sayaç bulunamadı.
          </div>
        )}
      </div>
    </div>
  );
}

export default MeterList;
