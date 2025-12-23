import React, { useState, useEffect } from 'react';
import {
  Brain,
  Zap,
  Droplets,
  Flame,
  TrendingUp,
  Check,
  AlertTriangle,
  RefreshCw,
  Save,
  Sparkles,
  Target,
  History,
  ChevronRight,
  Lightbulb,
  BarChart3,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Cpu,
  Database
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart
} from 'recharts';

function MLDataEntry() {
  const [selectedMeter, setSelectedMeter] = useState(null);
  const [mlPrediction, setMlPrediction] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [enteredValue, setEnteredValue] = useState('');
  const [confidenceThreshold, setConfidenceThreshold] = useState(85);
  const [autoFillEnabled, setAutoFillEnabled] = useState(true);

  // Örnek sayaç verileri
  const meters = [
    {
      id: 1,
      name: 'Sayaç #001',
      type: 'electricity',
      site: 'A Blok',
      lastReading: 15420,
      lastDate: '2024-01-14',
      unit: 'kWh',
      avgDaily: 45.2
    },
    {
      id: 2,
      name: 'Sayaç #002',
      type: 'water',
      site: 'A Blok',
      lastReading: 1250,
      lastDate: '2024-01-14',
      unit: 'm³',
      avgDaily: 2.8
    },
    {
      id: 3,
      name: 'Sayaç #003',
      type: 'gas',
      site: 'B Blok',
      lastReading: 890,
      lastDate: '2024-01-13',
      unit: 'm³',
      avgDaily: 8.5
    },
    {
      id: 4,
      name: 'Sayaç #004',
      type: 'electricity',
      site: 'B Blok',
      lastReading: 22150,
      lastDate: '2024-01-14',
      unit: 'kWh',
      avgDaily: 62.3
    },
    {
      id: 5,
      name: 'Sayaç #005',
      type: 'heat',
      site: 'C Blok',
      lastReading: 4520,
      lastDate: '2024-01-12',
      unit: 'kWh',
      avgDaily: 35.7
    }
  ];

  // ML tahmin simülasyonu
  const generateMLPrediction = (meter) => {
    setIsAnalyzing(true);

    setTimeout(() => {
      const daysSinceLastReading = Math.floor(Math.random() * 3) + 1;
      const baseConsumption = meter.avgDaily * daysSinceLastReading;
      const variance = baseConsumption * 0.15;
      const predicted = meter.lastReading + baseConsumption + (Math.random() - 0.5) * variance;

      const confidence = 75 + Math.random() * 20;
      const anomalyScore = Math.random() * 100;

      // Geçmiş veri simülasyonu
      const history = [];
      let value = meter.lastReading - (meter.avgDaily * 30);
      for (let i = 30; i >= 0; i--) {
        const dailyVariance = meter.avgDaily * (0.8 + Math.random() * 0.4);
        value += dailyVariance;
        history.push({
          day: i === 0 ? 'Bugün' : `-${i}g`,
          actual: i > 0 ? Math.round(value) : null,
          predicted: i <= 0 ? Math.round(predicted) : null,
          lower: i <= 0 ? Math.round(predicted - variance) : null,
          upper: i <= 0 ? Math.round(predicted + variance) : null
        });
      }

      setMlPrediction({
        predicted: Math.round(predicted),
        confidence: confidence.toFixed(1),
        anomalyScore: anomalyScore.toFixed(1),
        lowerBound: Math.round(predicted - variance),
        upperBound: Math.round(predicted + variance),
        expectedConsumption: Math.round(baseConsumption),
        daysSince: daysSinceLastReading,
        factors: [
          { name: 'Mevsimsel Trend', impact: '+12%', positive: false },
          { name: 'Hafta Sonu Etkisi', impact: '-8%', positive: true },
          { name: 'Sıcaklık Faktörü', impact: '+5%', positive: false },
          { name: 'Geçmiş Örüntü', impact: 'Normal', positive: true }
        ],
        history: history.slice(-15),
        similarReadings: [
          { date: '2024-01-07', value: meter.lastReading - meter.avgDaily * 7, diff: '-2.1%' },
          { date: '2023-12-15', value: meter.lastReading - meter.avgDaily * 30, diff: '+1.8%' },
          { date: '2023-11-15', value: meter.lastReading - meter.avgDaily * 60, diff: '-0.5%' }
        ]
      });

      if (autoFillEnabled && confidence >= confidenceThreshold) {
        setEnteredValue(Math.round(predicted).toString());
      }

      setIsAnalyzing(false);
    }, 1500);
  };

  const handleMeterSelect = (meter) => {
    setSelectedMeter(meter);
    setMlPrediction(null);
    setEnteredValue('');
    generateMLPrediction(meter);
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'electricity': return <Zap size={18} />;
      case 'water': return <Droplets size={18} />;
      case 'gas': return <Flame size={18} />;
      case 'heat': return <Flame size={18} />;
      default: return <Zap size={18} />;
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

  const getConfidenceColor = (confidence) => {
    if (confidence >= 90) return '#10b981';
    if (confidence >= 75) return '#f59e0b';
    return '#ef4444';
  };

  const validateEntry = () => {
    if (!mlPrediction || !enteredValue) return null;

    const value = parseFloat(enteredValue);
    if (value >= mlPrediction.lowerBound && value <= mlPrediction.upperBound) {
      return { status: 'valid', message: 'Değer beklenen aralıkta' };
    } else if (value < selectedMeter.lastReading) {
      return { status: 'error', message: 'Değer son okumadan düşük olamaz!' };
    } else {
      const diff = ((value - mlPrediction.predicted) / mlPrediction.predicted * 100).toFixed(1);
      return { status: 'warning', message: `Tahminden %${Math.abs(diff)} ${value > mlPrediction.predicted ? 'yüksek' : 'düşük'}` };
    }
  };

  const validation = validateEntry();

  const handleSave = () => {
    if (!selectedMeter || !enteredValue) return;

    alert(`Kayıt başarılı!\n\nSayaç: ${selectedMeter.name}\nDeğer: ${enteredValue} ${selectedMeter.unit}\nML Güven: ${mlPrediction?.confidence}%`);

    // Reset
    setSelectedMeter(null);
    setMlPrediction(null);
    setEnteredValue('');
  };

  return (
    <div className="ml-data-entry-page">
      <div className="page-header">
        <div className="header-content">
          <div className="header-icon">
            <Brain size={28} />
          </div>
          <div>
            <h1>ML Destekli Veri Girişi</h1>
            <p>Makine öğrenimi ile akıllı sayaç okuma ve anomali tespiti</p>
          </div>
        </div>
        <div className="header-actions">
          <div className="ml-settings">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={autoFillEnabled}
                onChange={(e) => setAutoFillEnabled(e.target.checked)}
              />
              <span className="toggle-switch"></span>
              <span>Otomatik Doldur</span>
            </label>
            <div className="confidence-setting">
              <span>Min. Güven:</span>
              <select
                value={confidenceThreshold}
                onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
              >
                <option value={70}>70%</option>
                <option value={75}>75%</option>
                <option value={80}>80%</option>
                <option value={85}>85%</option>
                <option value={90}>90%</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="ml-stats-bar">
        <div className="ml-stat">
          <Cpu size={20} />
          <div>
            <span className="stat-value">TensorFlow.js</span>
            <span className="stat-label">ML Engine</span>
          </div>
        </div>
        <div className="ml-stat">
          <Database size={20} />
          <div>
            <span className="stat-value">15,420</span>
            <span className="stat-label">Eğitim Verisi</span>
          </div>
        </div>
        <div className="ml-stat">
          <Target size={20} />
          <div>
            <span className="stat-value">94.2%</span>
            <span className="stat-label">Model Doğruluğu</span>
          </div>
        </div>
        <div className="ml-stat">
          <CheckCircle2 size={20} />
          <div>
            <span className="stat-value">1,250</span>
            <span className="stat-label">Başarılı Tahmin</span>
          </div>
        </div>
      </div>

      <div className="ml-entry-container">
        {/* Sayaç Listesi */}
        <div className="meter-selection-panel">
          <div className="panel-header">
            <h3>Sayaç Seçin</h3>
            <span className="meter-count">{meters.length} sayaç</span>
          </div>
          <div className="meter-list">
            {meters.map(meter => (
              <div
                key={meter.id}
                className={`meter-item ${selectedMeter?.id === meter.id ? 'selected' : ''}`}
                onClick={() => handleMeterSelect(meter)}
              >
                <div className="meter-icon" style={{ background: `${getTypeColor(meter.type)}20`, color: getTypeColor(meter.type) }}>
                  {getTypeIcon(meter.type)}
                </div>
                <div className="meter-info">
                  <span className="meter-name">{meter.name}</span>
                  <span className="meter-site">{meter.site}</span>
                </div>
                <div className="meter-reading">
                  <span className="reading-value">{meter.lastReading.toLocaleString()}</span>
                  <span className="reading-unit">{meter.unit}</span>
                </div>
                <ChevronRight size={18} className="chevron" />
              </div>
            ))}
          </div>
        </div>

        {/* ML Analiz Paneli */}
        <div className="ml-analysis-panel">
          {!selectedMeter ? (
            <div className="empty-state">
              <Brain size={64} />
              <h3>Sayaç Seçin</h3>
              <p>ML analizi için soldaki listeden bir sayaç seçin</p>
            </div>
          ) : isAnalyzing ? (
            <div className="analyzing-state">
              <div className="analyzing-animation">
                <Brain size={48} className="brain-icon" />
                <div className="pulse-ring"></div>
                <div className="pulse-ring delay-1"></div>
                <div className="pulse-ring delay-2"></div>
              </div>
              <h3>ML Modeli Analiz Ediyor...</h3>
              <p>Geçmiş veriler inceleniyor, tahmin hesaplanıyor</p>
              <div className="analyzing-steps">
                <div className="step active">
                  <Check size={16} />
                  <span>Veri yüklendi</span>
                </div>
                <div className="step active">
                  <Check size={16} />
                  <span>Özellikler çıkarıldı</span>
                </div>
                <div className="step">
                  <RefreshCw size={16} className="spinning" />
                  <span>Tahmin hesaplanıyor</span>
                </div>
              </div>
            </div>
          ) : mlPrediction ? (
            <div className="prediction-result">
              <div className="prediction-header">
                <div className="selected-meter-info">
                  <div className="meter-icon large" style={{ background: `${getTypeColor(selectedMeter.type)}20`, color: getTypeColor(selectedMeter.type) }}>
                    {getTypeIcon(selectedMeter.type)}
                  </div>
                  <div>
                    <h2>{selectedMeter.name}</h2>
                    <span>{selectedMeter.site} • Son okuma: {selectedMeter.lastDate}</span>
                  </div>
                </div>
                <button className="refresh-btn" onClick={() => generateMLPrediction(selectedMeter)}>
                  <RefreshCw size={18} />
                  Yeniden Analiz
                </button>
              </div>

              <div className="prediction-cards">
                <div className="prediction-card main">
                  <div className="card-icon">
                    <Sparkles size={24} />
                  </div>
                  <div className="card-content">
                    <span className="card-label">ML Tahmini</span>
                    <span className="card-value">{mlPrediction.predicted.toLocaleString()}</span>
                    <span className="card-unit">{selectedMeter.unit}</span>
                  </div>
                  <div className="confidence-badge" style={{ background: `${getConfidenceColor(mlPrediction.confidence)}20`, color: getConfidenceColor(mlPrediction.confidence) }}>
                    <Target size={14} />
                    {mlPrediction.confidence}% güven
                  </div>
                </div>

                <div className="prediction-card">
                  <div className="card-icon secondary">
                    <TrendingUp size={20} />
                  </div>
                  <div className="card-content">
                    <span className="card-label">Beklenen Tüketim</span>
                    <span className="card-value">{mlPrediction.expectedConsumption}</span>
                    <span className="card-unit">{selectedMeter.unit} ({mlPrediction.daysSince} gün)</span>
                  </div>
                </div>

                <div className="prediction-card">
                  <div className="card-icon secondary">
                    <BarChart3 size={20} />
                  </div>
                  <div className="card-content">
                    <span className="card-label">Güven Aralığı</span>
                    <span className="card-value">{mlPrediction.lowerBound} - {mlPrediction.upperBound}</span>
                    <span className="card-unit">{selectedMeter.unit}</span>
                  </div>
                </div>

                <div className={`prediction-card ${mlPrediction.anomalyScore > 70 ? 'warning' : ''}`}>
                  <div className="card-icon secondary">
                    <AlertTriangle size={20} />
                  </div>
                  <div className="card-content">
                    <span className="card-label">Anomali Skoru</span>
                    <span className="card-value">{mlPrediction.anomalyScore}%</span>
                    <span className="card-unit">{mlPrediction.anomalyScore > 70 ? 'Dikkat!' : 'Normal'}</span>
                  </div>
                </div>
              </div>

              {/* Tahmin Grafiği */}
              <div className="prediction-chart">
                <h4>Tahmin Trendi</h4>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={mlPrediction.history}>
                    <defs>
                      <linearGradient id="colorPredicted" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                    <XAxis dataKey="day" stroke="rgba(255,255,255,0.5)" fontSize={12} />
                    <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        background: 'rgba(30, 41, 59, 0.95)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="actual"
                      stroke={getTypeColor(selectedMeter.type)}
                      fill={`${getTypeColor(selectedMeter.type)}30`}
                      strokeWidth={2}
                      name="Gerçek"
                    />
                    <Line
                      type="monotone"
                      dataKey="predicted"
                      stroke="#8b5cf6"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ fill: '#8b5cf6', r: 6 }}
                      name="Tahmin"
                    />
                    <ReferenceLine
                      y={mlPrediction.predicted}
                      stroke="#8b5cf6"
                      strokeDasharray="3 3"
                      label={{ value: 'Tahmin', fill: '#8b5cf6', fontSize: 12 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Etki Faktörleri */}
              <div className="impact-factors">
                <h4><Lightbulb size={18} /> ML Analiz Faktörleri</h4>
                <div className="factors-grid">
                  {mlPrediction.factors.map((factor, index) => (
                    <div key={index} className={`factor-item ${factor.positive ? 'positive' : 'negative'}`}>
                      <span className="factor-name">{factor.name}</span>
                      <span className="factor-impact">{factor.impact}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Benzer Okumalar */}
              <div className="similar-readings">
                <h4><History size={18} /> Benzer Dönem Okumaları</h4>
                <div className="readings-list">
                  {mlPrediction.similarReadings.map((reading, index) => (
                    <div key={index} className="reading-item">
                      <span className="reading-date">{reading.date}</span>
                      <span className="reading-value">{reading.value.toLocaleString()} {selectedMeter.unit}</span>
                      <span className={`reading-diff ${reading.diff.startsWith('+') ? 'positive' : 'negative'}`}>
                        {reading.diff}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Veri Giriş Alanı */}
              <div className="data-entry-section">
                <h4>Sayaç Değeri Girin</h4>
                <div className="entry-form">
                  <div className="entry-input-group">
                    <div className="last-reading">
                      <span className="label">Son Okuma</span>
                      <span className="value">{selectedMeter.lastReading.toLocaleString()} {selectedMeter.unit}</span>
                    </div>
                    <ArrowRight size={24} className="arrow" />
                    <div className="new-reading">
                      <span className="label">Yeni Okuma</span>
                      <div className={`input-wrapper ${validation?.status || ''}`}>
                        <input
                          type="number"
                          value={enteredValue}
                          onChange={(e) => setEnteredValue(e.target.value)}
                          placeholder={mlPrediction.predicted.toString()}
                        />
                        <span className="unit">{selectedMeter.unit}</span>
                      </div>
                    </div>
                  </div>

                  {validation && (
                    <div className={`validation-message ${validation.status}`}>
                      {validation.status === 'valid' && <CheckCircle2 size={18} />}
                      {validation.status === 'warning' && <AlertTriangle size={18} />}
                      {validation.status === 'error' && <XCircle size={18} />}
                      <span>{validation.message}</span>
                    </div>
                  )}

                  <div className="entry-actions">
                    <button
                      className="use-prediction-btn"
                      onClick={() => setEnteredValue(mlPrediction.predicted.toString())}
                    >
                      <Sparkles size={18} />
                      ML Tahminini Kullan
                    </button>
                    <button
                      className="save-btn"
                      onClick={handleSave}
                      disabled={!enteredValue || validation?.status === 'error'}
                    >
                      <Save size={18} />
                      Kaydet
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export default MLDataEntry;
