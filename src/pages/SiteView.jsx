import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function SiteView() {
  const [sites, setSites] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedCity, setSelectedCity] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCities();
    fetchSites();
  }, []);

  const fetchCities = async () => {
    try {
      const res = await fetch('/api/cities');
      const data = await res.json();
      setCities(data);
    } catch (err) {
      console.error('Cities error:', err);
    }
  };

  const fetchSites = async (city = '') => {
    try {
      setLoading(true);
      const url = city ? `/api/sites?city=${encodeURIComponent(city)}&limit=200` : '/api/sites?limit=200';
      const res = await fetch(url);
      const data = await res.json();
      setSites(data);
    } catch (err) {
      console.error('Sites error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCityChange = (city) => {
    setSelectedCity(city);
    fetchSites(city);
  };

  const filteredSites = sites.filter(site =>
    site.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    site.address?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatEnergy = (value) => {
    if (value >= 1000000) return (value / 1000000).toFixed(2) + ' MWh';
    if (value >= 1000) return (value / 1000).toFixed(2) + ' kWh';
    return (value || 0).toFixed(2) + ' Wh';
  };

  return (
    <div className="site-view-page">
      <div className="page-header">
        <h1>🏢 Site Yönetimi</h1>
        <p className="subtitle">Tüm sitelerinizi görüntüleyin ve yönetin</p>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="filter-group">
          <label>İl Filtresi</label>
          <select value={selectedCity} onChange={(e) => handleCityChange(e.target.value)}>
            <option value="">Tüm İller</option>
            {cities.map(city => (
              <option key={city.name} value={city.name}>{city.name}</option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label>Arama</label>
          <input
            type="text"
            placeholder="Site adı veya adres ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-info">
          {filteredSites.length} site gösteriliyor
        </div>
      </div>

      {/* Sites Grid */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Siteler yükleniyor...</p>
        </div>
      ) : (
        <div className="sites-grid">
          {filteredSites.map(site => (
            <div key={site.id} className="site-card">
              <div className="site-header">
                <h3>{site.name}</h3>
                <span className={`status-badge ${site.active ? 'active' : 'inactive'}`}>
                  {site.active ? 'Aktif' : 'Pasif'}
                </span>
              </div>

              <div className="site-location">
                <span className="icon">📍</span>
                {site.city} / {site.district}
              </div>

              {site.address && (
                <div className="site-address">
                  <span className="icon">🏠</span>
                  {site.address}
                </div>
              )}

              <div className="site-stats">
                <div className="stat">
                  <span className="stat-value">{site.binaSayisi || 0}</span>
                  <span className="stat-label">Bina</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{site.sayacSayisi || 0}</span>
                  <span className="stat-label">Sayaç</span>
                </div>
                <div className="stat">
                  <span className="stat-value">{formatEnergy(site.toplamEnerji)}</span>
                  <span className="stat-label">Enerji</span>
                </div>
              </div>

              {site.manager && (
                <div className="site-manager">
                  <span className="icon">👤</span>
                  {site.manager}
                  {site.phone && <span className="phone"> · {site.phone}</span>}
                </div>
              )}

              <div className="site-actions">
                <Link to={`/meters?siteId=${site.id}`} className="btn btn-primary btn-sm">
                  Sayaçları Gör
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default SiteView;
