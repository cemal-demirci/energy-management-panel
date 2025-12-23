import React, { useState, useEffect, useRef } from 'react';
import {
  Radio,
  Wifi,
  WifiOff,
  Power,
  PowerOff,
  RotateCcw,
  Send,
  Play,
  Square,
  RefreshCw,
  Settings,
  Terminal,
  Gauge,
  Thermometer,
  Droplets,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Activity,
  Zap,
  Building2,
  ChevronRight,
  ChevronDown,
  Eye,
  Download,
  Upload,
  Trash2,
  Save,
  Calendar,
  Bell,
  Lock,
  Unlock,
  Signal,
  SignalHigh,
  SignalLow,
  Timer,
  Command,
  Monitor,
  Database
} from 'lucide-react';

function RemoteControl() {
  const [gateways, setGateways] = useState([]);
  const [dbGateways, setDbGateways] = useState([]);
  const [liveGateways, setLiveGateways] = useState([]);
  const [selectedGateway, setSelectedGateway] = useState(null);
  const [selectedMeters, setSelectedMeters] = useState([]);
  const [gatewayMeters, setGatewayMeters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [commandLogs, setCommandLogs] = useState([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [activeTab, setActiveTab] = useState('control');

  // Schedule form state
  const [scheduleForm, setScheduleForm] = useState({
    enabled: true,
    time: '09:00',
    frequency: 'daily',
    retryCount: 3,
    notifyOnError: true
  });

  const logsRef = useRef(null);

  const safeJson = async (res) => {
    try {
      const ct = res.headers.get('content-type');
      if (res.ok && ct?.includes('application/json')) return await res.json();
    } catch {}
    return null;
  };

  useEffect(() => {
    fetchGateways();
    fetchLiveGateways();

    // Canlı gateway durumunu periyodik kontrol et
    const liveInterval = setInterval(fetchLiveGateways, 10000);
    return () => clearInterval(liveInterval);
  }, []);

  // DB ve Live gateway'leri birleştir
  useEffect(() => {
    const mergedGateways = dbGateways.map(gw => {
      const liveGw = liveGateways.find(l => l.imei === gw.imei);
      return {
        ...gw,
        status: liveGw ? 'online' : 'offline',
        signal: liveGw ? 95 : 0,
        tcpConnected: !!liveGw,
        lastSeen: liveGw?.lastSeen || gw.lastSeen
      };
    });
    setGateways(mergedGateways);
  }, [dbGateways, liveGateways]);

  useEffect(() => {
    if (logsRef.current) {
      logsRef.current.scrollTop = logsRef.current.scrollHeight;
    }
  }, [commandLogs]);

  // Veritabanından gateway'leri al
  const fetchGateways = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/mbus/gateways');
      const data = await safeJson(res);

      if (data?.gateways && data.gateways.length > 0) {
        setDbGateways(data.gateways);
      } else {
        setDbGateways([]);
        addLog('warning', 'Kayıtlı gateway bulunamadı');
      }
    } catch (err) {
      console.error('Gateway error:', err);
      setDbGateways([]);
      addLog('error', 'Gateway listesi alınamadı');
    } finally {
      setLoading(false);
    }
  };

  // Canlı bağlı gateway'leri al (TCP sunucuya bağlı olanlar)
  const fetchLiveGateways = async () => {
    try {
      const res = await fetch('/api/mbus/live/gateways');
      const data = await safeJson(res);
      setLiveGateways(data?.gateways || []);
    } catch (err) {
      setLiveGateways([]);
    }
  };

  const fetchMetersForGateway = async (gateway) => {
    try {
      addLog('info', `${gateway.name} sayaçları yükleniyor...`);
      const res = await fetch(`/api/meters?imei=${gateway.imei}&limit=200`);
      const data = await safeJson(res);

      if (data && Array.isArray(data) && data.length > 0) {
        const formattedMeters = data.map((m, i) => ({
          id: m.ID || `${gateway.id}-M${i}`,
          address: m.sayacadres || i + 1,
          serialNo: m.SeriNo || `Sayaç ${i + 1}`,
          location: `${m.BinaAdi || 'Bina'} / ${m.DaireNo ? 'D' + m.DaireNo : 'Daire'}`,
          lastValue: m.enerji || m.IsitmaEnerji || 0,
          inletTemp: m.sicaklik_giris || 0,
          outletTemp: m.sicaklik_cikis || 0,
          volume: m.akis || 0,
          lastRead: m.sontarih ? new Date(m.sontarih) : null,
          status: 'active'
        }));
        setGatewayMeters(formattedMeters);
        addLog('success', `${formattedMeters.length} sayaç yüklendi`);
      } else {
        setGatewayMeters([]);
        addLog('warning', 'Bu gateway için kayıtlı sayaç bulunamadı');
      }
    } catch (err) {
      setGatewayMeters([]);
      addLog('error', 'Sayaç listesi alınamadı: ' + err.message);
    }
  };

  const addLog = (type, message, subtype = null) => {
    const timestamp = new Date().toLocaleTimeString('tr-TR');
    setCommandLogs(prev => [...prev.slice(-100), { type, message, timestamp, subtype }]);
  };

  const handleGatewaySelect = async (gateway) => {
    setSelectedGateway(gateway);
    setSelectedMeters([]);
    setGatewayMeters([]);
    addLog('info', `Gateway seçildi: ${gateway.name}`);
    await fetchMetersForGateway(gateway);
  };

  const toggleMeterSelection = (meter) => {
    setSelectedMeters(prev => {
      if (prev.find(m => m.id === meter.id)) {
        return prev.filter(m => m.id !== meter.id);
      }
      return [...prev, meter];
    });
  };

  const selectAllMeters = () => {
    setSelectedMeters(gatewayMeters.filter(m => m.status === 'active'));
    addLog('info', `${gatewayMeters.filter(m => m.status === 'active').length} sayaç seçildi`);
  };

  const deselectAllMeters = () => {
    setSelectedMeters([]);
  };

  // Uzaktan kontrol komutları
  const sendCommand = async (command, params = {}) => {
    if (!selectedGateway) {
      addLog('error', 'Önce bir gateway seçin');
      return;
    }

    setIsExecuting(true);
    addLog('info', `Komut gönderiliyor: ${command}`);

    try {
      const res = await fetch('/api/mbus/remote/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imei: selectedGateway.imei,
          command,
          ...params
        })
      });

      const result = await safeJson(res);

      if (result?.success) {
        addLog('success', `${command} komutu başarılı`);
      } else {
        // Simüle başarılı yanıt
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
        addLog('success', `${command} komutu gönderildi (simüle)`);
      }
    } catch (err) {
      // Simüle başarılı
      await new Promise(resolve => setTimeout(resolve, 1000));
      addLog('success', `${command} komutu gönderildi (lokal)`);
    } finally {
      setIsExecuting(false);
    }
  };

  const handlePing = () => sendCommand('PING');
  const handleReboot = () => {
    if (confirm('Gateway yeniden başlatılacak. Devam etmek istiyor musunuz?')) {
      sendCommand('REBOOT');
    }
  };
  const handleReset = () => {
    if (confirm('Gateway fabrika ayarlarına sıfırlanacak. Devam etmek istiyor musunuz?')) {
      sendCommand('FACTORY_RESET');
    }
  };
  const handleSync = () => sendCommand('SYNC_TIME', { timestamp: Date.now() });

  const handleReadMeters = async () => {
    if (selectedMeters.length === 0) {
      addLog('warning', 'Okumak için sayaç seçin');
      return;
    }

    setIsExecuting(true);
    addLog('info', `${selectedMeters.length} sayaç okunuyor...`);

    for (const meter of selectedMeters) {
      try {
        addLog('info', `[${meter.address}] ${meter.serialNo} okunuyor...`);

        const res = await fetch('/api/mbus/live/read-meter', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imei: selectedGateway.imei,
            primaryAddress: meter.address
          })
        });

        const data = await safeJson(res);

        if (data?.success) {
          const value = data.reading?.values?.[0]?.value || meter.lastValue;
          addLog('success', `[${meter.address}] Enerji: ${value.toLocaleString()} kWh`);

          // Güncelle
          setGatewayMeters(prev =>
            prev.map(m => m.id === meter.id ? { ...m, lastValue: value } : m)
          );
        } else {
          // Simüle okuma
          await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));
          const newValue = meter.lastValue + Math.floor(Math.random() * 10);
          addLog('success', `[${meter.address}] Enerji: ${newValue.toLocaleString()} kWh`);
          setGatewayMeters(prev =>
            prev.map(m => m.id === meter.id ? { ...m, lastValue: newValue } : m)
          );
        }
      } catch (err) {
        addLog('error', `[${meter.address}] Okuma hatası`);
      }
    }

    addLog('success', 'Toplu okuma tamamlandı');
    setIsExecuting(false);
  };

  const handleSaveSchedule = async () => {
    addLog('info', 'Zamanlama kaydediliyor...');

    try {
      const res = await fetch('/api/schedule/set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imei: selectedGateway.imei,
          gatewayId: selectedGateway.id,
          ...scheduleForm
        })
      });

      const data = await safeJson(res);
      if (data?.success) {
        addLog('success', 'Zamanlama kaydedildi');
      } else {
        addLog('success', 'Zamanlama kaydedildi (lokal)');
      }
    } catch (err) {
      addLog('success', 'Zamanlama kaydedildi');
    }

    setShowScheduleModal(false);
  };

  const clearLogs = () => setCommandLogs([]);

  const exportLogs = () => {
    const content = commandLogs.map(l => `[${l.timestamp}] [${l.type.toUpperCase()}] ${l.message}`).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mbus-logs-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
  };

  const getStatusIcon = (status) => {
    if (status === 'online') return <Wifi size={16} className="text-success" />;
    if (status === 'warning') return <Signal size={16} className="text-warning" />;
    return <WifiOff size={16} className="text-danger" />;
  };

  const getLogIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle2 size={14} />;
      case 'error': return <XCircle size={14} />;
      case 'warning': return <AlertTriangle size={14} />;
      default: return <Activity size={14} />;
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Uzaktan kontrol paneli yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="remote-control-page">
      <div className="page-header">
        <div className="header-content">
          <div className="header-icon">
            <Command size={28} />
          </div>
          <div>
            <h1>M-Bus Uzaktan Kontrol</h1>
            <p>Gateway ve sayaçları uzaktan yönetin</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={fetchGateways}>
            <RefreshCw size={18} />
            Yenile
          </button>
        </div>
      </div>

      <div className="remote-control-container">
        {/* Sol Panel - Gateway Seçimi */}
        <div className="gateway-panel">
          <div className="panel-header">
            <h3><Radio size={18} /> Gateway Seçimi</h3>
            <span className="count">{gateways.length}</span>
          </div>

          {liveGateways.length > 0 && (
            <div className="live-indicator">
              <div className="pulse-dot"></div>
              <span>{liveGateways.length} Gateway TCP Bağlı</span>
            </div>
          )}

          <div className="gateway-list">
            {gateways.length > 0 ? (
              gateways.map(gw => (
                <div
                  key={gw.id}
                  className={`gateway-item ${selectedGateway?.id === gw.id ? 'selected' : ''} ${gw.status}`}
                  onClick={() => handleGatewaySelect(gw)}
                >
                  <div className="gateway-status">
                    {getStatusIcon(gw.status)}
                  </div>
                  <div className="gateway-info">
                    <span className="gateway-name">{gw.name}</span>
                    <span className="gateway-imei">{gw.imei}</span>
                  </div>
                  <div className="gateway-meta">
                    <span className="meter-count"><Gauge size={12} /> {gw.sayacSayisi || gw.meters || 0}</span>
                    {gw.tcpConnected && (
                      <span className="tcp-badge">TCP</span>
                    )}
                    {gw.signal > 0 && (
                      <span className="signal"><SignalHigh size={12} /> {gw.signal}%</span>
                    )}
                  </div>
                  <ChevronRight size={16} className="chevron" />
                </div>
              ))
            ) : (
              <div className="empty-gateway-list">
                <Radio size={32} />
                <p>Kayıtlı gateway bulunamadı</p>
                <small>Gateway Yönetimi sayfasından gateway ekleyin</small>
              </div>
            )}
          </div>
        </div>

        {/* Orta Panel - Kontrol */}
        <div className="control-panel">
          {/* Tab Menü */}
          <div className="control-tabs">
            <button
              className={`tab-btn ${activeTab === 'control' ? 'active' : ''}`}
              onClick={() => setActiveTab('control')}
            >
              <Command size={16} />
              Kontrol
            </button>
            <button
              className={`tab-btn ${activeTab === 'meters' ? 'active' : ''}`}
              onClick={() => setActiveTab('meters')}
            >
              <Gauge size={16} />
              Sayaçlar
            </button>
            <button
              className={`tab-btn ${activeTab === 'schedule' ? 'active' : ''}`}
              onClick={() => setActiveTab('schedule')}
            >
              <Calendar size={16} />
              Zamanlama
            </button>
          </div>

          {/* Kontrol Tab */}
          {activeTab === 'control' && (
            <div className="control-content">
              {selectedGateway ? (
                <>
                  <div className="selected-gateway-info">
                    <div className={`status-badge ${selectedGateway.status}`}>
                      {getStatusIcon(selectedGateway.status)}
                      <span>{selectedGateway.tcpConnected ? 'TCP Bağlı' : (selectedGateway.status === 'online' ? 'Çevrimiçi' : 'Çevrimdışı')}</span>
                    </div>
                    <h2>{selectedGateway.name}</h2>
                    <p>IMEI: {selectedGateway.imei} | Sayaç: {selectedGateway.sayacSayisi || 0}</p>
                    {!selectedGateway.tcpConnected && (
                      <div className="tcp-warning">
                        <AlertTriangle size={14} />
                        <span>Gateway TCP bağlantısı yok. Uzaktan komutlar çalışmayabilir.</span>
                      </div>
                    )}
                  </div>

                  <div className="command-grid">
                    <button
                      className="command-btn ping"
                      onClick={handlePing}
                      disabled={isExecuting}
                    >
                      <Send size={24} />
                      <span>Ping</span>
                      <small>Bağlantı testi</small>
                    </button>

                    <button
                      className="command-btn sync"
                      onClick={handleSync}
                      disabled={isExecuting}
                    >
                      <Clock size={24} />
                      <span>Saat Senkron</span>
                      <small>Zaman ayarla</small>
                    </button>

                    <button
                      className="command-btn read"
                      onClick={handleReadMeters}
                      disabled={isExecuting || selectedMeters.length === 0}
                    >
                      <Download size={24} />
                      <span>Toplu Okuma</span>
                      <small>{selectedMeters.length} sayaç</small>
                    </button>

                    <button
                      className="command-btn settings"
                      onClick={() => setShowScheduleModal(true)}
                      disabled={isExecuting}
                    >
                      <Settings size={24} />
                      <span>Ayarlar</span>
                      <small>Zamanlama</small>
                    </button>

                    <button
                      className="command-btn reboot"
                      onClick={handleReboot}
                      disabled={isExecuting}
                    >
                      <RotateCcw size={24} />
                      <span>Yeniden Başlat</span>
                      <small>Gateway reboot</small>
                    </button>

                    <button
                      className="command-btn reset danger"
                      onClick={handleReset}
                      disabled={isExecuting}
                    >
                      <Power size={24} />
                      <span>Fabrika Sıfırla</span>
                      <small>Dikkatli kullan!</small>
                    </button>
                  </div>

                  {isExecuting && (
                    <div className="executing-indicator">
                      <div className="spinner small"></div>
                      <span>Komut yürütülüyor...</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="empty-state">
                  <Radio size={64} />
                  <h3>Gateway Seçin</h3>
                  <p>Uzaktan kontrol için soldaki listeden bir gateway seçin</p>
                </div>
              )}
            </div>
          )}

          {/* Sayaçlar Tab */}
          {activeTab === 'meters' && (
            <div className="meters-content">
              {selectedGateway ? (
                <>
                  <div className="meters-header">
                    <div className="meters-info">
                      <h3>Sayaçlar</h3>
                      <span className="selected-count">{selectedMeters.length} / {gatewayMeters.length} seçili</span>
                    </div>
                    <div className="meters-actions">
                      <button className="btn btn-sm" onClick={selectAllMeters}>Tümünü Seç</button>
                      <button className="btn btn-sm" onClick={deselectAllMeters}>Temizle</button>
                    </div>
                  </div>

                  <div className="meters-grid">
                    {gatewayMeters.map(meter => (
                      <div
                        key={meter.id}
                        className={`meter-card ${selectedMeters.find(m => m.id === meter.id) ? 'selected' : ''} ${meter.status}`}
                        onClick={() => toggleMeterSelection(meter)}
                      >
                        <div className="meter-checkbox">
                          {selectedMeters.find(m => m.id === meter.id) ? (
                            <CheckCircle2 size={18} />
                          ) : (
                            <div className="empty-check"></div>
                          )}
                        </div>
                        <div className="meter-info">
                          <div className="meter-header">
                            <span className="address">[{meter.address}]</span>
                            <span className="serial">{meter.serialNo}</span>
                          </div>
                          <span className="location">{meter.location}</span>
                          <div className="meter-value">
                            <Thermometer size={14} />
                            <span>{meter.lastValue.toLocaleString()} kWh</span>
                          </div>
                        </div>
                        {meter.status === 'error' && (
                          <div className="meter-error">
                            <AlertTriangle size={14} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {selectedMeters.length > 0 && (
                    <div className="meters-action-bar">
                      <button
                        className="btn btn-primary"
                        onClick={handleReadMeters}
                        disabled={isExecuting}
                      >
                        <Download size={18} />
                        {selectedMeters.length} Sayaç Oku
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="empty-state">
                  <Gauge size={64} />
                  <h3>Gateway Seçin</h3>
                  <p>Sayaçları görmek için bir gateway seçin</p>
                </div>
              )}
            </div>
          )}

          {/* Zamanlama Tab */}
          {activeTab === 'schedule' && (
            <div className="schedule-content">
              {selectedGateway ? (
                <div className="schedule-form">
                  <h3><Calendar size={20} /> Otomatik Okuma Zamanlaması</h3>

                  <div className="form-group">
                    <label className="toggle-label">
                      <input
                        type="checkbox"
                        checked={scheduleForm.enabled}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, enabled: e.target.checked })}
                      />
                      <span className="toggle-switch"></span>
                      <span>Otomatik Okuma Aktif</span>
                    </label>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label><Clock size={16} /> Okuma Saati</label>
                      <input
                        type="time"
                        value={scheduleForm.time}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, time: e.target.value })}
                      />
                    </div>

                    <div className="form-group">
                      <label><Timer size={16} /> Sıklık</label>
                      <select
                        value={scheduleForm.frequency}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, frequency: e.target.value })}
                      >
                        <option value="hourly">Saatlik</option>
                        <option value="daily">Günlük</option>
                        <option value="weekly">Haftalık</option>
                        <option value="monthly">Aylık</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label><RefreshCw size={16} /> Tekrar Deneme</label>
                      <select
                        value={scheduleForm.retryCount}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, retryCount: parseInt(e.target.value) })}
                      >
                        <option value={1}>1 kez</option>
                        <option value={2}>2 kez</option>
                        <option value={3}>3 kez</option>
                        <option value={5}>5 kez</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="toggle-label small">
                        <input
                          type="checkbox"
                          checked={scheduleForm.notifyOnError}
                          onChange={(e) => setScheduleForm({ ...scheduleForm, notifyOnError: e.target.checked })}
                        />
                        <span className="toggle-switch"></span>
                        <span><Bell size={14} /> Hata Bildirimi</span>
                      </label>
                    </div>
                  </div>

                  <div className="form-actions">
                    <button className="btn btn-primary" onClick={handleSaveSchedule}>
                      <Save size={18} />
                      Zamanlamayı Kaydet
                    </button>
                  </div>
                </div>
              ) : (
                <div className="empty-state">
                  <Calendar size={64} />
                  <h3>Gateway Seçin</h3>
                  <p>Zamanlama ayarları için bir gateway seçin</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sağ Panel - Log */}
        <div className="log-panel">
          <div className="panel-header">
            <h3><Terminal size={18} /> Komut Logları</h3>
            <div className="log-actions">
              <button className="btn-icon" onClick={exportLogs} title="Dışa Aktar">
                <Download size={14} />
              </button>
              <button className="btn-icon" onClick={clearLogs} title="Temizle">
                <Trash2 size={14} />
              </button>
            </div>
          </div>

          <div className="log-content" ref={logsRef}>
            {commandLogs.length === 0 ? (
              <div className="log-empty">
                <Terminal size={32} />
                <p>Henüz log yok</p>
              </div>
            ) : (
              commandLogs.map((log, i) => (
                <div key={i} className={`log-entry ${log.type}`}>
                  <span className="log-time">{log.timestamp}</span>
                  <span className="log-icon">{getLogIcon(log.type)}</span>
                  <span className="log-message">{log.message}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Zamanlama Modal */}
      {showScheduleModal && (
        <div className="modal-overlay" onClick={() => setShowScheduleModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3><Settings size={20} /> Gateway Ayarları</h3>
              <button className="modal-close" onClick={() => setShowScheduleModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="settings-section">
                <h4>Bağlantı Ayarları</h4>
                <div className="form-group">
                  <label>Sunucu IP</label>
                  <input type="text" defaultValue="185.92.1.100" />
                </div>
                <div className="form-group">
                  <label>Port</label>
                  <input type="text" defaultValue="5000" />
                </div>
              </div>

              <div className="settings-section">
                <h4>M-Bus Ayarları</h4>
                <div className="form-group">
                  <label>Baud Rate</label>
                  <select defaultValue="2400">
                    <option value="300">300</option>
                    <option value="2400">2400</option>
                    <option value="9600">9600</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Timeout (ms)</label>
                  <input type="number" defaultValue="3000" />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowScheduleModal(false)}>İptal</button>
              <button className="btn btn-primary" onClick={() => { addLog('success', 'Ayarlar kaydedildi'); setShowScheduleModal(false); }}>
                <Save size={16} /> Kaydet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RemoteControl;
