import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function CityView() {
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [selectedCity, setSelectedCity] = useState(null);
  const [loading, setLoading] = useState(true);

  const safeJson = async (res) => {
    try {
      const ct = res.headers.get('content-type');
      if (res.ok && ct?.includes('application/json')) return await res.json();
    } catch {}
    return null;
  };

  useEffect(() => {
    fetchCities();
  }, []);

  const fetchCities = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/cities');
      const data = await safeJson(res);
      setCities(data || []);
    } catch (err) {
      console.error('Cities error:', err);
      setCities([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDistricts = async (city) => {
    try {
      const res = await fetch(`/api/cities/${encodeURIComponent(city)}/districts`);
      const data = await safeJson(res);
      setDistricts(data || []);
    } catch (err) {
      console.error('Districts error:', err);
      setDistricts([]);
    }
  };

  const handleCityClick = (city) => {
    setSelectedCity(city);
    fetchDistricts(city.name);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>İller yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="city-view-page">
      <div className="page-header">
        <h1>🏙️ İl / İlçe Görünümü</h1>
        <p className="subtitle">Türkiye genelinde sayaç dağılımı</p>
      </div>

      <div className="city-content">
        {/* Cities List */}
        <div className="cities-panel">
          <h3>📍 İller ({cities.length})</h3>
          <div className="city-list">
            {cities.map((city) => (
              <div
                key={city.id || city.name}
                className={`city-item ${selectedCity?.name === city.name ? 'active' : ''}`}
                onClick={() => handleCityClick(city)}
              >
                <div className="city-info">
                  <span className="city-name">{city.name}</span>
                  <span className="city-stats">
                    {city.siteSayisi} site · {city.sayacSayisi?.toLocaleString()} sayaç
                  </span>
                </div>
                <span className="city-arrow">→</span>
              </div>
            ))}
          </div>
        </div>

        {/* Districts Panel */}
        <div className="districts-panel">
          {selectedCity ? (
            <>
              <h3>🏘️ {selectedCity.name} - İlçeler ({districts.length})</h3>

              {/* Chart */}
              {districts.length > 0 && (
                <div className="district-chart">
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={districts.slice(0, 10)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="sayacSayisi" fill="#10B981" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="district-list">
                {districts.map((district) => (
                  <div key={district.id || district.name} className="district-item">
                    <div className="district-info">
                      <span className="district-name">{district.name}</span>
                      <div className="district-stats">
                        <span className="stat">
                          <span className="icon">🏢</span>
                          {district.siteSayisi} site
                        </span>
                        <span className="stat">
                          <span className="icon">📊</span>
                          {district.sayacSayisi?.toLocaleString()} sayaç
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="no-selection">
              <span className="icon">👈</span>
              <p>İlçeleri görmek için bir il seçin</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CityView;
