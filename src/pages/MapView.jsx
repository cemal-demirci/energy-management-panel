import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

function MapView() {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSite, setSelectedSite] = useState(null);

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
      setLoading(true);
      const res = await fetch('/api/map/sites');
      const data = await safeJson(res);
      if (data) {
        // Filter valid coordinates
        const validSites = data.filter(s =>
          s.lat && s.lng &&
          !isNaN(parseFloat(s.lat)) &&
          !isNaN(parseFloat(s.lng))
        );
        setSites(validSites);
      } else {
        setSites([]);
      }
    } catch (err) {
      console.error('Map sites error:', err);
      setSites([]);
    } finally {
      setLoading(false);
    }
  };

  const getMarkerColor = (meterCount) => {
    if (meterCount > 100) return '#EF4444'; // Red
    if (meterCount > 50) return '#F59E0B'; // Orange
    if (meterCount > 20) return '#3B82F6'; // Blue
    return '#10B981'; // Green
  };

  const getMarkerRadius = (meterCount) => {
    if (meterCount > 100) return 15;
    if (meterCount > 50) return 12;
    if (meterCount > 20) return 10;
    return 8;
  };

  const formatEnergy = (value) => {
    if (value >= 1000000) return (value / 1000000).toFixed(2) + ' MWh';
    if (value >= 1000) return (value / 1000).toFixed(2) + ' kWh';
    return (value || 0).toFixed(2) + ' Wh';
  };

  // Turkey center coordinates
  const turkeyCenter = [39.0, 35.0];

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Harita yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="map-view-page">
      <div className="page-header">
        <h1>🗺️ Harita Görünümü</h1>
        <p className="subtitle">Türkiye genelinde site konumları</p>
      </div>

      <div className="map-container">
        <div className="map-stats">
          <div className="stat-item">
            <span className="stat-value">{sites.length}</span>
            <span className="stat-label">Konumlu Site</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">
              {sites.reduce((acc, s) => acc + (s.meterCount || 0), 0).toLocaleString()}
            </span>
            <span className="stat-label">Toplam Sayaç</span>
          </div>
        </div>

        <div className="map-legend">
          <h4>Sayaç Yoğunluğu</h4>
          <div className="legend-item">
            <span className="legend-color" style={{ background: '#10B981' }}></span>
            <span>1-20 sayaç</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ background: '#3B82F6' }}></span>
            <span>21-50 sayaç</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ background: '#F59E0B' }}></span>
            <span>51-100 sayaç</span>
          </div>
          <div className="legend-item">
            <span className="legend-color" style={{ background: '#EF4444' }}></span>
            <span>100+ sayaç</span>
          </div>
        </div>

        <MapContainer
          center={turkeyCenter}
          zoom={6}
          style={{ height: '600px', width: '100%', borderRadius: '12px' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />

          {sites.map((site) => (
            <CircleMarker
              key={site.id}
              center={[parseFloat(site.lat), parseFloat(site.lng)]}
              radius={getMarkerRadius(site.meterCount)}
              fillColor={getMarkerColor(site.meterCount)}
              color={getMarkerColor(site.meterCount)}
              weight={2}
              opacity={0.8}
              fillOpacity={0.6}
              eventHandlers={{
                click: () => setSelectedSite(site)
              }}
            >
              <Popup>
                <div className="map-popup">
                  <h4>{site.name}</h4>
                  <p><strong>Konum:</strong> {site.city} / {site.district}</p>
                  <p><strong>Adres:</strong> {site.address || '-'}</p>
                  <p><strong>Sayaç Sayısı:</strong> {site.meterCount?.toLocaleString()}</p>
                  <p><strong>Toplam Enerji:</strong> {formatEnergy(site.totalEnergy)}</p>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>

        {selectedSite && (
          <div className="selected-site-panel">
            <h3>{selectedSite.name}</h3>
            <div className="site-details">
              <p><span className="icon">📍</span> {selectedSite.city} / {selectedSite.district}</p>
              <p><span className="icon">📊</span> {selectedSite.meterCount} sayaç</p>
              <p><span className="icon">⚡</span> {formatEnergy(selectedSite.totalEnergy)}</p>
            </div>
            <button className="btn btn-secondary" onClick={() => setSelectedSite(null)}>
              Kapat
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default MapView;
