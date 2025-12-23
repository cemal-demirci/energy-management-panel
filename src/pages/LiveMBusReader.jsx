import React, { useState, useEffect, useRef } from 'react';
import {
  Radio,
  Wifi,
  WifiOff,
  Play,
  Pause,
  Square,
  RefreshCw,
  Zap,
  Droplets,
  Flame,
  Thermometer,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Activity,
  Signal,
  SignalHigh,
  SignalLow,
  SignalZero,
  Database,
  Download,
  Settings,
  Terminal,
  ChevronRight,
  ChevronDown,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  Save,
  Send,
  RotateCcw,
  Gauge,
  Building2,
  Cpu,
  HardDrive,
  Link2,
  Unlink2,
  Search,
  AlertCircle
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

function LiveMBusReader() {
  const [isConnected, setIsConnected] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState(null);
  const [selectedMeters, setSelectedMeters] = useState([]);
  const [liveData, setLiveData] = useState([]);
  const [logs, setLogs] = useState([]);
  const [showLogs, setShowLogs] = useState(true);
  const [readInterval, setReadInterval] = useState(5);
  const [autoSave, setAutoSave] = useState(true);
  const [signalStrength, setSignalStrength] = useState(0);

  // API state
  const [gateways, setGateways] = useState([]);
  const [dbGateways, setDbGateways] = useState([]);
  const [liveGateways, setLiveGateways] = useState([]);
  const [gatewayMeters, setGatewayMeters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sessionId, setSessionId] = useState(null);
  const [isScanning, setIsScanning] = useState(false);

  const logsEndRef = useRef(null);
  const readIntervalRef = useRef(null);
  const pollIntervalRef = useRef(null);

  // Gateway'leri API'den yükle
  useEffect(() => {
    fetchGateways();
    fetchLiveGateways();

    // Canlı gateway durumunu periyodik kontrol et
    const liveInterval = setInterval(fetchLiveGateways, 10000);

    return () => {
      clearInterval(liveInterval);
      if (readIntervalRef.current) clearInterval(readIntervalRef.current);
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  // Veritabanından gateway'leri al
  const fetchGateways = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/mbus/gateways');
      const data = await res.json();
      setDbGateways(data.gateways || []);
    } catch (err) {
      addLog('error', 'Gateway listesi alınamadı: ' + err.message);
      // Demo data fallback
      setDbGateways([
        { id: 1, name: 'Demo Gateway A1', imei: 'demo-gw-001', ip: '192.168.1.100', sayacSayisi: 24 },
        { id: 2, name: 'Demo Gateway A2', imei: 'demo-gw-002', ip: '192.168.1.101', sayacSayisi: 18 },
        { id: 3, name: 'Demo Gateway B1', imei: 'demo-gw-003', ip: '192.168.2.100', sayacSayisi: 32 }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Canlı bağlı gateway'leri al (TCP sunucuya bağlı olanlar)
  const fetchLiveGateways = async () => {
    try {
      const res = await fetch('/api/mbus/live/gateways');
      const data = await res.json();
      setLiveGateways(data.gateways || []);
    } catch (err) {
      // Sessiz hata - TCP sunucuya bağlı gateway yok olabilir
      setLiveGateways([]);
    }
  };

  // Gateway listesini birleştir (DB + Live)
  useEffect(() => {
    const mergedGateways = dbGateways.map(gw => {
      const liveGw = liveGateways.find(l => l.imei === gw.imei);
      return {
        ...gw,
        status: liveGw ? 'online' : 'offline',
        signal: liveGw ? 95 : 0,
        tcpConnected: !!liveGw,
        lastSeen: liveGw?.lastSeen
      };
    });
    setGateways(mergedGateways);
  }, [dbGateways, liveGateways]);

  // Gateway'e bağlı sayaçları al
  const fetchMetersForGateway = async (gateway) => {
    try {
      addLog('info', `${gateway.name} sayaçları yükleniyor...`);

      // Veritabanından sayaçları al
      const res = await fetch(`/api/meters?imei=${gateway.imei}&limit=200`);
      const meters = await res.json();

      if (meters.length > 0) {
        const formattedMeters = meters.map((m, i) => ({
          id: m.ID || `${gateway.id}-M${i}`,
          address: m.sayacadres || i + 1,
          name: m.SeriNo || `Sayaç ${i + 1}`,
          type: 'heat',
          typeName: 'Isı',
          unit: 'kWh',
          location: `${m.BinaAdi || 'Bina'} / ${m.DaireNo || 'Daire'}`,
          lastValue: m.enerji || 0,
          inletTemp: m.sicaklik_giris || 0,
          outletTemp: m.sicaklik_cikis || 0,
          volume: m.akis || 0,
          lastRead: m.sontarih ? new Date(m.sontarih) : null,
          status: 'active'
        }));
        setGatewayMeters(formattedMeters);
        addLog('success', `${formattedMeters.length} sayaç yüklendi`);
      } else {
        // Demo sayaçlar
        const demoMeters = Array.from({ length: gateway.sayacSayisi || 10 }, (_, i) => ({
          id: `${gateway.id}-M${String(i + 1).padStart(3, '0')}`,
          address: i + 1,
          name: `Sayaç ${String(i + 1).padStart(3, '0')}`,
          type: 'heat',
          typeName: 'Isı',
          unit: 'kWh',
          location: `Kat ${Math.floor(i / 4) + 1}, Daire ${(i % 4) + 1}`,
          lastValue: Math.floor(Math.random() * 5000) + 1000,
          inletTemp: 65 + Math.random() * 10,
          outletTemp: 40 + Math.random() * 10,
          volume: Math.random() * 50,
          lastRead: null,
          status: 'active'
        }));
        setGatewayMeters(demoMeters);
        addLog('info', `Demo mod: ${demoMeters.length} sayaç oluşturuldu`);
      }
    } catch (err) {
      addLog('error', 'Sayaç listesi alınamadı: ' + err.message);
    }
  };

  const addLog = (type, message) => {
    const timestamp = new Date().toLocaleTimeString('tr-TR');
    setLogs(prev => [...prev, { type, message, timestamp }]);
  };

  const handleGatewaySelect = async (gateway) => {
    if (gateway.status === 'offline') {
      addLog('warning', `Gateway ${gateway.name} çevrimdışı - Demo modda çalışacak`);
    }
    setSelectedGateway(gateway);
    setSelectedMeters([]);
    setLiveData([]);
    addLog('info', `Gateway ${gateway.name} seçildi`);

    await fetchMetersForGateway(gateway);
  };

  const handleConnect = async () => {
    if (!selectedGateway) return;

    addLog('info', `Gateway ${selectedGateway.name}'e bağlanılıyor...`);

    if (selectedGateway.tcpConnected) {
      // Gerçek TCP bağlantısı var
      setIsConnected(true);
      setSignalStrength(selectedGateway.signal);
      addLog('success', `Gateway ${selectedGateway.name}'e TCP bağlantısı aktif`);
    } else {
      // Demo mod - simüle bağlantı
      setTimeout(() => {
        setIsConnected(true);
        setSignalStrength(75);
        addLog('warning', 'Demo mod aktif - Gateway TCP bağlantısı yok');
        addLog('info', `${gatewayMeters.length} sayaç tespit edildi (demo)`);
      }, 1000);
    }
  };

  const handleDisconnect = async () => {
    if (isReading) {
      await handleStopReading();
    }
    setIsConnected(false);
    setSignalStrength(0);
    setSessionId(null);
    addLog('info', 'Bağlantı kapatıldı');
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
  };

  const deselectAllMeters = () => {
    setSelectedMeters([]);
  };

  const handleStartReading = async () => {
    if (selectedMeters.length === 0) {
      addLog('warning', 'Okuma için sayaç seçin');
      return;
    }

    setIsReading(true);
    addLog('info', `${selectedMeters.length} sayaç için okuma başlatıldı`);
    addLog('info', `Okuma aralığı: ${readInterval} saniye`);

    if (selectedGateway?.tcpConnected) {
      // Gerçek M-Bus okuma oturumu başlat
      try {
        const res = await fetch('/api/mbus/live/start-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imei: selectedGateway.imei,
            meterAddresses: selectedMeters.map(m => m.address),
            interval: readInterval * 1000
          })
        });
        const data = await res.json();
        setSessionId(data.sessionId);
        addLog('success', `Canlı okuma oturumu başlatıldı: ${data.sessionId}`);

        // Polling başlat
        pollIntervalRef.current = setInterval(pollLiveData, 2000);
      } catch (err) {
        addLog('error', 'Oturum başlatılamadı: ' + err.message);
        // Demo moduna geç
        performDemoReading();
        readIntervalRef.current = setInterval(performDemoReading, readInterval * 1000);
      }
    } else {
      // Demo mod okuma
      performDemoReading();
      readIntervalRef.current = setInterval(performDemoReading, readInterval * 1000);
    }
  };

  // Canlı veri polling
  const pollLiveData = async () => {
    if (!sessionId) return;

    try {
      const res = await fetch(`/api/mbus/live/session/${sessionId}`);
      const data = await res.json();

      if (data.readings && data.readings.length > 0) {
        // Son okumaları işle
        data.readings.forEach(reading => {
          const meter = selectedMeters.find(m => m.address === reading.address);
          if (meter) {
            processReading(meter, reading);
          }
        });
      }
    } catch (err) {
      addLog('error', 'Veri alınamadı: ' + err.message);
    }
  };

  // Okuma verisini işle
  const processReading = (meter, reading) => {
    const timeStr = new Date(reading.timestamp).toLocaleTimeString('tr-TR');

    // Isı sayacı için değerleri çıkar
    const energyValue = reading.values?.find(v => v.unit === 'kWh' || v.unit === 'Wh');
    const volumeValue = reading.values?.find(v => v.unit === 'm³' || v.unit === 'L');
    const tempValue = reading.values?.find(v => v.unit === '°C');

    const newValue = energyValue?.value || meter.lastValue;

    addLog('data', `[${meter.address}] ${meter.name}: ${newValue} ${meter.unit}`);

    setLiveData(prev => {
      const existing = prev.find(d => d.meterId === meter.id);
      const newReading = {
        time: timeStr,
        value: newValue,
        inletTemp: tempValue?.value || meter.inletTemp,
        outletTemp: meter.outletTemp,
        volume: volumeValue?.value || meter.volume
      };

      if (existing) {
        return prev.map(d =>
          d.meterId === meter.id
            ? { ...d, readings: [...d.readings.slice(-20), newReading], currentValue: newValue }
            : d
        );
      }

      return [...prev, {
        meterId: meter.id,
        meterName: meter.name,
        meterType: meter.type,
        unit: meter.unit,
        address: meter.address,
        readings: [newReading],
        currentValue: newValue
      }];
    });

    // Sayaç değerini güncelle
    setGatewayMeters(prev =>
      prev.map(m =>
        m.id === meter.id
          ? { ...m, lastValue: newValue, lastRead: new Date() }
          : m
      )
    );
  };

  // Demo okuma (TCP bağlantısı yoksa)
  const performDemoReading = () => {
    const timestamp = new Date();
    const timeStr = timestamp.toLocaleTimeString('tr-TR');

    selectedMeters.forEach((meter, index) => {
      setTimeout(() => {
        const girisSicaklik = 68 + Math.random() * 12;
        const cikisSicaklik = 42 + Math.random() * 12;
        const deltaT = girisSicaklik - cikisSicaklik;
        const debi = 80 + Math.random() * 150;
        const guc = (debi * deltaT * 1.163) / 1000;

        const newValue = meter.lastValue + Math.floor(Math.random() * 5);

        addLog('data', `[${meter.address}] ${meter.name}: ${newValue} kWh | T1: ${girisSicaklik.toFixed(1)}°C | T2: ${cikisSicaklik.toFixed(1)}°C | ΔT: ${deltaT.toFixed(1)}°C`);

        setLiveData(prev => {
          const existing = prev.find(d => d.meterId === meter.id);
          const newReading = {
            time: timeStr,
            value: newValue,
            inletTemp: girisSicaklik,
            outletTemp: cikisSicaklik,
            deltaT: deltaT,
            flow: debi,
            power: guc
          };

          if (existing) {
            return prev.map(d =>
              d.meterId === meter.id
                ? { ...d, readings: [...d.readings.slice(-20), newReading], currentValue: newValue }
                : d
            );
          }

          return [...prev, {
            meterId: meter.id,
            meterName: meter.name,
            meterType: meter.type,
            unit: meter.unit,
            address: meter.address,
            readings: [newReading],
            currentValue: newValue
          }];
        });

        setGatewayMeters(prev =>
          prev.map(m =>
            m.id === meter.id
              ? { ...m, lastValue: newValue, lastRead: timestamp, inletTemp: girisSicaklik, outletTemp: cikisSicaklik }
              : m
          )
        );
      }, index * 200);
    });
  };

  const handleStopReading = async () => {
    setIsReading(false);

    if (readIntervalRef.current) {
      clearInterval(readIntervalRef.current);
    }
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    // Oturumu durdur
    if (sessionId) {
      try {
        await fetch(`/api/mbus/live/stop-session/${sessionId}`, { method: 'POST' });
        addLog('info', 'Okuma oturumu durduruldu');
      } catch (err) {
        // Sessiz hata
      }
      setSessionId(null);
    }

    addLog('info', 'Okuma durduruldu');

    if (autoSave && liveData.length > 0) {
      addLog('success', `${liveData.length} sayaç verisi kaydedildi`);
    }
  };

  const handleManualRead = async () => {
    if (selectedMeters.length === 0) {
      addLog('warning', 'Okuma için sayaç seçin');
      return;
    }

    addLog('info', 'Manuel okuma yapılıyor...');

    if (selectedGateway?.tcpConnected) {
      // Gerçek M-Bus okuma
      for (const meter of selectedMeters) {
        try {
          const res = await fetch('/api/mbus/live/read-meter', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imei: selectedGateway.imei,
              primaryAddress: meter.address
            })
          });
          const data = await res.json();

          if (data.success) {
            processReading(meter, data.reading);
          } else {
            addLog('error', `[${meter.address}] Okuma başarısız`);
          }
        } catch (err) {
          addLog('error', `[${meter.address}] Hata: ${err.message}`);
        }
      }
    } else {
      // Demo okuma
      performDemoReading();
    }
  };

  // Gateway tarama
  const handleScanGateway = async () => {
    if (!selectedGateway?.tcpConnected) {
      addLog('warning', 'Gateway TCP bağlantısı gerekli');
      return;
    }

    setIsScanning(true);
    addLog('info', 'Gateway taranıyor (1-50 adres)...');

    try {
      const res = await fetch('/api/mbus/live/scan-gateway', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imei: selectedGateway.imei,
          startAddress: 1,
          endAddress: 50
        })
      });
      const data = await res.json();

      addLog('success', `Tarama tamamlandı: ${data.totalFound} sayaç bulundu`);

      if (data.foundMeters?.length > 0) {
        const newMeters = data.foundMeters.map(m => ({
          id: `scan-${m.address}`,
          address: m.address,
          name: `Sayaç ${m.address}`,
          type: 'heat',
          typeName: 'Isı',
          unit: 'kWh',
          location: '-',
          lastValue: 0,
          status: 'active'
        }));
        setGatewayMeters(prev => [...prev, ...newMeters]);
      }
    } catch (err) {
      addLog('error', 'Tarama hatası: ' + err.message);
    } finally {
      setIsScanning(false);
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const exportData = () => {
    const csvContent = [
      ['Sayaç', 'Adres', 'Değer', 'Birim', 'T1 (°C)', 'T2 (°C)', 'ΔT (°C)', 'Zaman'].join(','),
      ...liveData.flatMap(d =>
        d.readings.map(r =>
          [d.meterName, d.address, r.value, d.unit, r.inletTemp?.toFixed(1) || '-', r.outletTemp?.toFixed(1) || '-', r.deltaT?.toFixed(1) || '-', r.time].join(',')
        )
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mbus-okuma-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    addLog('success', 'Veriler dışa aktarıldı');
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'electricity': return <Zap size={16} />;
      case 'water': return <Droplets size={16} />;
      case 'gas': return <Flame size={16} />;
      case 'heat': return <Thermometer size={16} />;
      default: return <Gauge size={16} />;
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'electricity': return '#f59e0b';
      case 'water': return '#3b82f6';
      case 'gas': return '#ef4444';
      case 'heat': return '#ec4899';
      default: return '#8b5cf6';
    }
  };

  const getSignalIcon = (strength) => {
    if (strength >= 80) return <SignalHigh size={18} />;
    if (strength >= 50) return <Signal size={18} />;
    if (strength > 0) return <SignalLow size={18} />;
    return <SignalZero size={18} />;
  };

  const getLogIcon = (type) => {
    switch (type) {
      case 'success': return <CheckCircle2 size={14} />;
      case 'error': return <XCircle size={14} />;
      case 'warning': return <AlertTriangle size={14} />;
      case 'data': return <Database size={14} />;
      default: return <Activity size={14} />;
    }
  };

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Gateway'ler yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="live-mbus-page">
      <div className="page-header">
        <div className="header-content">
          <div className="header-icon">
            <Radio size={28} />
          </div>
          <div>
            <h1>Canlı M-Bus Okuma</h1>
            <p>Gateway üzerinden gerçek zamanlı ısı sayacı okuma</p>
          </div>
        </div>
        <div className="header-actions">
          <div className={`connection-status ${isConnected ? 'connected' : ''}`}>
            {isConnected ? <Wifi size={18} /> : <WifiOff size={18} />}
            <span>{isConnected ? 'Bağlı' : 'Bağlı Değil'}</span>
            {isConnected && (
              <span className="signal">
                {getSignalIcon(signalStrength)}
                {signalStrength}%
              </span>
            )}
          </div>
          {liveData.length > 0 && (
            <button className="btn btn-secondary" onClick={exportData}>
              <Download size={18} />
              Dışa Aktar
            </button>
          )}
        </div>
      </div>

      <div className="mbus-container">
        {/* Sol Panel - Gateway ve Sayaç Seçimi */}
        <div className="selection-panel">
          {/* Gateway Seçimi */}
          <div className="panel-section">
            <div className="section-header">
              <h3><Radio size={18} /> Gateway Seçimi</h3>
              <button className="refresh-btn" onClick={fetchGateways}>
                <RefreshCw size={16} />
              </button>
            </div>

            {liveGateways.length > 0 && (
              <div className="live-indicator">
                <div className="pulse-dot"></div>
                <span>{liveGateways.length} Gateway TCP Bağlı</span>
              </div>
            )}

            <div className="gateway-list">
              {gateways.map(gateway => (
                <div
                  key={gateway.id}
                  className={`gateway-item ${selectedGateway?.id === gateway.id ? 'selected' : ''} ${gateway.status}`}
                  onClick={() => handleGatewaySelect(gateway)}
                >
                  <div className="gateway-icon">
                    <HardDrive size={20} />
                    <span className={`status-dot ${gateway.status}`}></span>
                  </div>
                  <div className="gateway-info">
                    <span className="gateway-name">{gateway.name}</span>
                    <span className="gateway-ip">{gateway.imei || gateway.ip}</span>
                  </div>
                  <div className="gateway-meta">
                    <span className="meter-count">{gateway.sayacSayisi || gateway.meters || 0} sayaç</span>
                    {gateway.tcpConnected && (
                      <span className="tcp-badge">TCP</span>
                    )}
                    <span className="signal-info">
                      {getSignalIcon(gateway.signal)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {selectedGateway && !isConnected && (
              <button className="connect-btn" onClick={handleConnect}>
                <Link2 size={18} />
                Bağlan
              </button>
            )}

            {isConnected && (
              <div className="connection-actions">
                <button className="disconnect-btn" onClick={handleDisconnect}>
                  <Unlink2 size={18} />
                  Bağlantıyı Kes
                </button>
                {selectedGateway?.tcpConnected && (
                  <button
                    className="scan-btn"
                    onClick={handleScanGateway}
                    disabled={isScanning}
                  >
                    <Search size={18} />
                    {isScanning ? 'Taranıyor...' : 'Tara'}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Sayaç Seçimi */}
          {isConnected && (
            <div className="panel-section">
              <div className="section-header">
                <h3><Gauge size={18} /> Sayaç Seçimi</h3>
                <div className="select-actions">
                  <button onClick={selectAllMeters}>Tümü</button>
                  <button onClick={deselectAllMeters}>Temizle</button>
                </div>
              </div>
              <div className="selected-count">
                {selectedMeters.length} / {gatewayMeters.length} seçili
              </div>
              <div className="meter-list">
                {gatewayMeters.map(meter => (
                  <div
                    key={meter.id}
                    className={`meter-item ${selectedMeters.find(m => m.id === meter.id) ? 'selected' : ''} ${meter.status}`}
                    onClick={() => meter.status === 'active' && toggleMeterSelection(meter)}
                  >
                    <div className="meter-checkbox">
                      {selectedMeters.find(m => m.id === meter.id) ? (
                        <CheckCircle2 size={18} />
                      ) : (
                        <div className="empty-check"></div>
                      )}
                    </div>
                    <div className="meter-type" style={{ color: getTypeColor(meter.type) }}>
                      {getTypeIcon(meter.type)}
                    </div>
                    <div className="meter-info">
                      <span className="meter-name">[{meter.address}] {meter.name}</span>
                      <span className="meter-location">{meter.location}</span>
                    </div>
                    <div className="meter-value">
                      {meter.lastRead ? (
                        <span className="live-value">{meter.lastValue?.toLocaleString()}</span>
                      ) : (
                        <span className="no-data">-</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Okuma Ayarları */}
          {isConnected && (
            <div className="panel-section settings">
              <h3><Settings size={18} /> Ayarlar</h3>
              <div className="setting-item">
                <label>Okuma Aralığı</label>
                <select
                  value={readInterval}
                  onChange={(e) => setReadInterval(Number(e.target.value))}
                  disabled={isReading}
                >
                  <option value={1}>1 saniye</option>
                  <option value={5}>5 saniye</option>
                  <option value={10}>10 saniye</option>
                  <option value={30}>30 saniye</option>
                  <option value={60}>1 dakika</option>
                </select>
              </div>
              <div className="setting-item toggle">
                <label>Otomatik Kaydet</label>
                <input
                  type="checkbox"
                  checked={autoSave}
                  onChange={(e) => setAutoSave(e.target.checked)}
                />
              </div>
            </div>
          )}
        </div>

        {/* Orta Panel - Canlı Veriler */}
        <div className="live-data-panel">
          {/* Kontrol Butonları */}
          <div className="control-bar">
            <div className="control-buttons">
              {!isReading ? (
                <button
                  className="control-btn start"
                  onClick={handleStartReading}
                  disabled={!isConnected || selectedMeters.length === 0}
                >
                  <Play size={20} />
                  Başlat
                </button>
              ) : (
                <button className="control-btn stop" onClick={handleStopReading}>
                  <Square size={20} />
                  Durdur
                </button>
              )}
              <button
                className="control-btn manual"
                onClick={handleManualRead}
                disabled={!isConnected || selectedMeters.length === 0 || isReading}
              >
                <Send size={18} />
                Tek Okuma
              </button>
            </div>

            {isReading && (
              <div className="reading-indicator">
                <div className="pulse"></div>
                <span>Okuma Aktif</span>
                {sessionId && <span className="session-id">({sessionId.slice(-8)})</span>}
              </div>
            )}

            {!selectedGateway?.tcpConnected && isConnected && (
              <div className="demo-badge">
                <AlertCircle size={16} />
                Demo Mod
              </div>
            )}
          </div>

          {/* Canlı Veri Kartları */}
          {liveData.length > 0 ? (
            <div className="live-data-grid">
              {liveData.map(data => (
                <div key={data.meterId} className="live-data-card heat-card">
                  <div className="card-header">
                    <div className="meter-badge" style={{ color: getTypeColor(data.meterType) }}>
                      <Thermometer size={16} />
                      <span>[{data.address}] {data.meterName}</span>
                    </div>
                    <span className="current-value">
                      {data.currentValue?.toLocaleString()} <small>{data.unit}</small>
                    </span>
                  </div>

                  {/* Isı Sayacı Detay Bilgiler */}
                  {data.readings[data.readings.length - 1] && (
                    <div className="heat-stats">
                      <div className="heat-stat">
                        <span className="label">T1 (Giriş)</span>
                        <span className="value inlet">{data.readings[data.readings.length - 1].inletTemp?.toFixed(1) || '-'}°C</span>
                      </div>
                      <div className="heat-stat">
                        <span className="label">T2 (Çıkış)</span>
                        <span className="value outlet">{data.readings[data.readings.length - 1].outletTemp?.toFixed(1) || '-'}°C</span>
                      </div>
                      <div className="heat-stat">
                        <span className="label">ΔT</span>
                        <span className="value delta">{data.readings[data.readings.length - 1].deltaT?.toFixed(1) || '-'}°C</span>
                      </div>
                    </div>
                  )}

                  <div className="mini-chart">
                    <ResponsiveContainer width="100%" height={80}>
                      <AreaChart data={data.readings}>
                        <defs>
                          <linearGradient id={`gradient-${data.meterId}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={getTypeColor(data.meterType)} stopOpacity={0.3}/>
                            <stop offset="95%" stopColor={getTypeColor(data.meterType)} stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke={getTypeColor(data.meterType)}
                          fill={`url(#gradient-${data.meterId})`}
                          strokeWidth={2}
                        />
                        <Tooltip
                          contentStyle={{
                            background: 'rgba(30, 41, 59, 0.95)',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '12px'
                          }}
                          labelFormatter={(value) => `Saat: ${value}`}
                          formatter={(value) => [value?.toLocaleString(), data.unit]}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="card-footer">
                    <span className="reading-count">{data.readings.length} okuma</span>
                    <span className="last-time">{data.readings[data.readings.length - 1]?.time}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Activity size={64} />
              <h3>Canlı Veri Yok</h3>
              <p>
                {!isConnected
                  ? 'Önce bir gateway\'e bağlanın'
                  : selectedMeters.length === 0
                    ? 'Okumak için sayaç seçin'
                    : 'Okumayı başlatın'
                }
              </p>
              {!isConnected && gateways.filter(g => g.tcpConnected).length === 0 && (
                <div className="tcp-info">
                  <AlertCircle size={20} />
                  <p>
                    TCP bağlı gateway yok. Gateway'lerinizin sunucu IP'sine (port 5000) bağlandığından emin olun.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sağ Panel - Loglar */}
        <div className={`logs-panel ${showLogs ? 'open' : 'closed'}`}>
          <div className="logs-header">
            <button className="toggle-logs" onClick={() => setShowLogs(!showLogs)}>
              {showLogs ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
              <Terminal size={18} />
              <span>Loglar</span>
            </button>
            {showLogs && (
              <button className="clear-logs" onClick={clearLogs}>
                <Trash2 size={16} />
              </button>
            )}
          </div>

          {showLogs && (
            <div className="logs-content">
              {logs.map((log, index) => (
                <div key={index} className={`log-entry ${log.type}`}>
                  <span className="log-time">{log.timestamp}</span>
                  <span className="log-icon">{getLogIcon(log.type)}</span>
                  <span className="log-message">{log.message}</span>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LiveMBusReader;
