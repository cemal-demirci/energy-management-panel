import React, { useState, useEffect } from 'react';
import {
  PenSquare,
  Plus,
  Building2,
  Home,
  Gauge,
  Save,
  X,
  Search,
  CheckCircle,
  AlertCircle,
  Thermometer,
  Droplets,
  Zap,
  Calendar,
  User,
  MapPin,
  Hash,
  FileText
} from 'lucide-react';

function ManualEntry() {
  const [activeTab, setActiveTab] = useState('reading');
  const [sites, setSites] = useState([]);
  const [buildings, setBuildings] = useState([]);
  const [meters, setMeters] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Form states
  const [selectedSite, setSelectedSite] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState('');
  const [selectedMeter, setSelectedMeter] = useState('');

  // Reading form
  const [readingForm, setReadingForm] = useState({
    meterId: '',
    enerji: '',
    hacim: '',
    girisSicaklik: '',
    cikisSicaklik: '',
    tarih: new Date().toISOString().split('T')[0],
    notlar: ''
  });

  // New site form
  const [siteForm, setSiteForm] = useState({
    site: '',
    il: '',
    ilce: '',
    adres: '',
    yonetici_isim: '',
    yonetici_telefon: ''
  });

  // New building form
  const [buildingForm, setBuildingForm] = useState({
    bina: '',
    siteId: '',
    imei: '',
    yonetici_isim: '',
    yonetici_telefon: ''
  });

  // New meter form
  const [meterForm, setMeterForm] = useState({
    secondaryno: '',
    siteId: '',
    binaId: '',
    daireNo: '',
    malikIsim: '',
    sayacTip: 'Isı Sayacı',
    sayacMarka: ''
  });

  useEffect(() => {
    fetchSites();
  }, []);

  useEffect(() => {
    if (selectedSite) {
      fetchBuildings(selectedSite);
    }
  }, [selectedSite]);

  useEffect(() => {
    if (selectedBuilding) {
      fetchMeters(selectedBuilding);
    }
  }, [selectedBuilding]);

  const fetchSites = async () => {
    try {
      const res = await fetch('/api/sites?limit=500');
      const data = await res.json();
      setSites(data);
    } catch (err) {
      console.error('Sites fetch error:', err);
    }
  };

  const fetchBuildings = async (siteId) => {
    try {
      const res = await fetch(`/api/buildings?siteId=${siteId}`);
      const data = await res.json();
      setBuildings(data);
    } catch (err) {
      console.error('Buildings fetch error:', err);
    }
  };

  const fetchMeters = async (buildingId) => {
    try {
      const res = await fetch(`/api/meters?buildingId=${buildingId}`);
      const data = await res.json();
      setMeters(data);
    } catch (err) {
      console.error('Meters fetch error:', err);
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleReadingSubmit = async (e) => {
    e.preventDefault();
    if (!selectedMeter) {
      showMessage('error', 'Lütfen bir sayaç seçin');
      return;
    }

    setLoading(true);
    try {
      // Simulate API call - in real app this would POST to backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      showMessage('success', 'Okuma başarıyla kaydedildi');
      setReadingForm({
        meterId: '',
        enerji: '',
        hacim: '',
        girisSicaklik: '',
        cikisSicaklik: '',
        tarih: new Date().toISOString().split('T')[0],
        notlar: ''
      });
    } catch (err) {
      showMessage('error', 'Kayıt hatası: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSiteSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      showMessage('success', 'Site başarıyla oluşturuldu');
      setSiteForm({
        site: '',
        il: '',
        ilce: '',
        adres: '',
        yonetici_isim: '',
        yonetici_telefon: ''
      });
      fetchSites();
    } catch (err) {
      showMessage('error', 'Kayıt hatası: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBuildingSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      showMessage('success', 'Bina başarıyla oluşturuldu');
      setBuildingForm({
        bina: '',
        siteId: '',
        imei: '',
        yonetici_isim: '',
        yonetici_telefon: ''
      });
    } catch (err) {
      showMessage('error', 'Kayıt hatası: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMeterSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      showMessage('success', 'Sayaç başarıyla oluşturuldu');
      setMeterForm({
        secondaryno: '',
        siteId: '',
        binaId: '',
        daireNo: '',
        malikIsim: '',
        sayacTip: 'Isı Sayacı',
        sayacMarka: ''
      });
    } catch (err) {
      showMessage('error', 'Kayıt hatası: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'reading', label: 'Sayaç Okuma', icon: Gauge },
    { id: 'site', label: 'Yeni Site', icon: Building2 },
    { id: 'building', label: 'Yeni Bina', icon: Home },
    { id: 'meter', label: 'Yeni Sayaç', icon: Gauge }
  ];

  return (
    <div className="manual-entry-page">
      <div className="page-header">
        <div className="header-title">
          <PenSquare size={28} />
          <div>
            <h1>Manuel Veri Girişi</h1>
            <p className="subtitle">Sayaç okuma ve yeni kayıt ekleme</p>
          </div>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`message-banner ${message.type}`}>
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span>{message.text}</span>
          <button onClick={() => setMessage(null)}><X size={16} /></button>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs-container">
        {tabs.map(tab => {
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <IconComponent size={18} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {/* Sayaç Okuma Tab */}
        {activeTab === 'reading' && (
          <div className="form-card">
            <div className="form-header">
              <Gauge size={24} />
              <h2>Manuel Sayaç Okuma</h2>
            </div>

            <form onSubmit={handleReadingSubmit}>
              {/* Site/Bina/Sayaç Seçimi */}
              <div className="form-section">
                <h3>Sayaç Seçimi</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label><Building2 size={16} /> Site</label>
                    <select
                      value={selectedSite}
                      onChange={(e) => {
                        setSelectedSite(e.target.value);
                        setSelectedBuilding('');
                        setSelectedMeter('');
                      }}
                    >
                      <option value="">Site Seçin</option>
                      {sites.map(site => (
                        <option key={site.id} value={site.id}>{site.name} - {site.city}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label><Home size={16} /> Bina</label>
                    <select
                      value={selectedBuilding}
                      onChange={(e) => {
                        setSelectedBuilding(e.target.value);
                        setSelectedMeter('');
                      }}
                      disabled={!selectedSite}
                    >
                      <option value="">Bina Seçin</option>
                      {buildings.map(bina => (
                        <option key={bina.id} value={bina.id}>{bina.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label><Gauge size={16} /> Sayaç</label>
                    <select
                      value={selectedMeter}
                      onChange={(e) => setSelectedMeter(e.target.value)}
                      disabled={!selectedBuilding}
                    >
                      <option value="">Sayaç Seçin</option>
                      {meters.map(meter => (
                        <option key={meter.ID} value={meter.ID}>
                          {meter.SeriNo} - Daire {meter.DaireNo}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Okuma Değerleri */}
              <div className="form-section">
                <h3>Okuma Değerleri</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label><Zap size={16} /> Enerji (kWh)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={readingForm.enerji}
                      onChange={(e) => setReadingForm({...readingForm, enerji: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label><Droplets size={16} /> Hacim (m³)</label>
                    <input
                      type="number"
                      step="0.001"
                      placeholder="0.000"
                      value={readingForm.hacim}
                      onChange={(e) => setReadingForm({...readingForm, hacim: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label><Thermometer size={16} /> Giriş Sıcaklık (°C)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="0.0"
                      value={readingForm.girisSicaklik}
                      onChange={(e) => setReadingForm({...readingForm, girisSicaklik: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label><Thermometer size={16} /> Çıkış Sıcaklık (°C)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="0.0"
                      value={readingForm.cikisSicaklik}
                      onChange={(e) => setReadingForm({...readingForm, cikisSicaklik: e.target.value})}
                    />
                  </div>

                  <div className="form-group">
                    <label><Calendar size={16} /> Tarih</label>
                    <input
                      type="date"
                      value={readingForm.tarih}
                      onChange={(e) => setReadingForm({...readingForm, tarih: e.target.value})}
                    />
                  </div>

                  <div className="form-group full-width">
                    <label><FileText size={16} /> Notlar</label>
                    <textarea
                      placeholder="Ek notlar..."
                      value={readingForm.notlar}
                      onChange={(e) => setReadingForm({...readingForm, notlar: e.target.value})}
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  <Save size={18} />
                  {loading ? 'Kaydediliyor...' : 'Okumayı Kaydet'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Yeni Site Tab */}
        {activeTab === 'site' && (
          <div className="form-card">
            <div className="form-header">
              <Building2 size={24} />
              <h2>Yeni Site Oluştur</h2>
            </div>

            <form onSubmit={handleSiteSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label><Building2 size={16} /> Site Adı *</label>
                  <input
                    type="text"
                    required
                    placeholder="Site adını girin"
                    value={siteForm.site}
                    onChange={(e) => setSiteForm({...siteForm, site: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label><MapPin size={16} /> İl *</label>
                  <input
                    type="text"
                    required
                    placeholder="İl"
                    value={siteForm.il}
                    onChange={(e) => setSiteForm({...siteForm, il: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label><MapPin size={16} /> İlçe</label>
                  <input
                    type="text"
                    placeholder="İlçe"
                    value={siteForm.ilce}
                    onChange={(e) => setSiteForm({...siteForm, ilce: e.target.value})}
                  />
                </div>

                <div className="form-group full-width">
                  <label><MapPin size={16} /> Adres</label>
                  <textarea
                    placeholder="Tam adres"
                    value={siteForm.adres}
                    onChange={(e) => setSiteForm({...siteForm, adres: e.target.value})}
                    rows={2}
                  />
                </div>

                <div className="form-group">
                  <label><User size={16} /> Yönetici Adı</label>
                  <input
                    type="text"
                    placeholder="Yönetici adı"
                    value={siteForm.yonetici_isim}
                    onChange={(e) => setSiteForm({...siteForm, yonetici_isim: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label><User size={16} /> Yönetici Telefon</label>
                  <input
                    type="tel"
                    placeholder="0555 123 4567"
                    value={siteForm.yonetici_telefon}
                    onChange={(e) => setSiteForm({...siteForm, yonetici_telefon: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  <Plus size={18} />
                  {loading ? 'Oluşturuluyor...' : 'Site Oluştur'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Yeni Bina Tab */}
        {activeTab === 'building' && (
          <div className="form-card">
            <div className="form-header">
              <Home size={24} />
              <h2>Yeni Bina Oluştur</h2>
            </div>

            <form onSubmit={handleBuildingSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label><Building2 size={16} /> Site Seç *</label>
                  <select
                    required
                    value={buildingForm.siteId}
                    onChange={(e) => setBuildingForm({...buildingForm, siteId: e.target.value})}
                  >
                    <option value="">Site Seçin</option>
                    {sites.map(site => (
                      <option key={site.id} value={site.id}>{site.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label><Home size={16} /> Bina Adı *</label>
                  <input
                    type="text"
                    required
                    placeholder="A Blok, B Blok, vb."
                    value={buildingForm.bina}
                    onChange={(e) => setBuildingForm({...buildingForm, bina: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label><Hash size={16} /> Gateway IMEI</label>
                  <input
                    type="text"
                    placeholder="15 haneli IMEI"
                    value={buildingForm.imei}
                    onChange={(e) => setBuildingForm({...buildingForm, imei: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label><User size={16} /> Yönetici Adı</label>
                  <input
                    type="text"
                    placeholder="Bina sorumlusu"
                    value={buildingForm.yonetici_isim}
                    onChange={(e) => setBuildingForm({...buildingForm, yonetici_isim: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label><User size={16} /> Yönetici Telefon</label>
                  <input
                    type="tel"
                    placeholder="0555 123 4567"
                    value={buildingForm.yonetici_telefon}
                    onChange={(e) => setBuildingForm({...buildingForm, yonetici_telefon: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  <Plus size={18} />
                  {loading ? 'Oluşturuluyor...' : 'Bina Oluştur'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Yeni Sayaç Tab */}
        {activeTab === 'meter' && (
          <div className="form-card">
            <div className="form-header">
              <Gauge size={24} />
              <h2>Yeni Sayaç Ekle</h2>
            </div>

            <form onSubmit={handleMeterSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label><Hash size={16} /> Sayaç Seri No *</label>
                  <input
                    type="text"
                    required
                    placeholder="Seri numarası"
                    value={meterForm.secondaryno}
                    onChange={(e) => setMeterForm({...meterForm, secondaryno: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label><Building2 size={16} /> Site *</label>
                  <select
                    required
                    value={meterForm.siteId}
                    onChange={(e) => {
                      setMeterForm({...meterForm, siteId: e.target.value, binaId: ''});
                      fetchBuildings(e.target.value);
                    }}
                  >
                    <option value="">Site Seçin</option>
                    {sites.map(site => (
                      <option key={site.id} value={site.id}>{site.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label><Home size={16} /> Bina *</label>
                  <select
                    required
                    value={meterForm.binaId}
                    onChange={(e) => setMeterForm({...meterForm, binaId: e.target.value})}
                    disabled={!meterForm.siteId}
                  >
                    <option value="">Bina Seçin</option>
                    {buildings.map(bina => (
                      <option key={bina.id} value={bina.id}>{bina.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label><Hash size={16} /> Daire No</label>
                  <input
                    type="text"
                    placeholder="1, 2, 3..."
                    value={meterForm.daireNo}
                    onChange={(e) => setMeterForm({...meterForm, daireNo: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label><User size={16} /> Malik İsmi</label>
                  <input
                    type="text"
                    placeholder="Daire sahibi"
                    value={meterForm.malikIsim}
                    onChange={(e) => setMeterForm({...meterForm, malikIsim: e.target.value})}
                  />
                </div>

                <div className="form-group">
                  <label><Gauge size={16} /> Sayaç Tipi</label>
                  <select
                    value={meterForm.sayacTip}
                    onChange={(e) => setMeterForm({...meterForm, sayacTip: e.target.value})}
                  >
                    <option>Isı Sayacı</option>
                    <option>Soğutma Sayacı</option>
                    <option>Kombine Sayaç</option>
                    <option>Su Sayacı</option>
                  </select>
                </div>

                <div className="form-group">
                  <label><Gauge size={16} /> Sayaç Marka</label>
                  <input
                    type="text"
                    placeholder="Marka"
                    value={meterForm.sayacMarka}
                    onChange={(e) => setMeterForm({...meterForm, sayacMarka: e.target.value})}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  <Plus size={18} />
                  {loading ? 'Ekleniyor...' : 'Sayaç Ekle'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

export default ManualEntry;
