import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  MapPin,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Building2,
  Gauge,
  Radio,
  Wrench,
  Truck,
  Phone,
  Mail,
  Star,
  Filter,
  Search,
  Plus,
  Edit3,
  Trash2,
  Eye,
  Send,
  MoreVertical,
  ChevronRight,
  ChevronDown,
  Camera,
  FileText,
  MessageSquare,
  Navigation,
  Target,
  Award,
  TrendingUp,
  Zap,
  Droplets,
  Flame,
  Thermometer,
  ClipboardList,
  ClipboardCheck,
  UserCheck,
  ArrowRight,
  RefreshCw,
  Download
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

function ServiceWorkAssignment() {
  const [activeTab, setActiveTab] = useState('assignments');
  const [showNewWorkModal, setShowNewWorkModal] = useState(false);
  const [selectedWork, setSelectedWork] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterWorker, setFilterWorker] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Yeni iş formu state
  const [newWork, setNewWork] = useState({
    type: 'meter_reading',
    site: '',
    description: '',
    priority: 'normal',
    assignee: '',
    dueDate: '',
    meters: [],
    gateway: ''
  });

  // Servis personeli listesi
  const workers = [
    {
      id: 1,
      name: 'Ahmet Yılmaz',
      phone: '0532 123 4567',
      email: 'ahmet@ornek.com',
      avatar: 'AY',
      status: 'available',
      completedJobs: 156,
      rating: 4.8,
      currentJob: null,
      skills: ['M-Bus', 'Sayaç Okuma', 'Bakım']
    },
    {
      id: 2,
      name: 'Mehmet Demir',
      phone: '0533 234 5678',
      email: 'mehmet@ornek.com',
      avatar: 'MD',
      status: 'busy',
      completedJobs: 234,
      rating: 4.9,
      currentJob: 'A Blok Sayaç Okuma',
      skills: ['Gateway', 'Kurulum', 'Arıza']
    },
    {
      id: 3,
      name: 'Ali Kaya',
      phone: '0534 345 6789',
      email: 'ali@ornek.com',
      avatar: 'AK',
      status: 'available',
      completedJobs: 89,
      rating: 4.6,
      skills: ['Sayaç Okuma', 'Bakım']
    },
    {
      id: 4,
      name: 'Fatma Şahin',
      phone: '0535 456 7890',
      email: 'fatma@ornek.com',
      avatar: 'FŞ',
      status: 'offline',
      completedJobs: 67,
      rating: 4.7,
      currentJob: null,
      skills: ['M-Bus', 'Raporlama']
    },
    {
      id: 5,
      name: 'Can Özkan',
      phone: '0536 567 8901',
      email: 'can@ornek.com',
      avatar: 'CO',
      status: 'busy',
      completedJobs: 198,
      rating: 4.5,
      currentJob: 'C Blok Gateway Bakımı',
      skills: ['Gateway', 'Kurulum', 'M-Bus', 'Arıza']
    }
  ];

  // Siteler
  const sites = [
    { id: 1, name: 'A Blok Residans', address: 'Merkez Mah. Ana Cad. No:1', meters: 48 },
    { id: 2, name: 'B Blok Residans', address: 'Merkez Mah. Ana Cad. No:2', meters: 36 },
    { id: 3, name: 'C Blok Ticari', address: 'İş Merkezi Cad. No:5', meters: 24 },
    { id: 4, name: 'D Blok Konut', address: 'Yeşil Sok. No:10', meters: 60 }
  ];

  // Gateway listesi
  const gateways = [
    { id: 1, name: 'Gateway A1', siteId: 1, meters: 24 },
    { id: 2, name: 'Gateway A2', siteId: 1, meters: 24 },
    { id: 3, name: 'Gateway B1', siteId: 2, meters: 36 },
    { id: 4, name: 'Gateway C1', siteId: 3, meters: 24 },
    { id: 5, name: 'Gateway D1', siteId: 4, meters: 30 },
    { id: 6, name: 'Gateway D2', siteId: 4, meters: 30 }
  ];

  // İş atamaları
  const [workAssignments, setWorkAssignments] = useState([
    {
      id: 1,
      type: 'meter_reading',
      title: 'A Blok Aylık Sayaç Okuma',
      site: sites[0],
      description: 'A Blok tüm dairelerin aylık sayaç okuması',
      priority: 'high',
      status: 'in_progress',
      assignee: workers[1],
      createdAt: '2024-01-15 09:00',
      dueDate: '2024-01-16 18:00',
      meters: 48,
      completedMeters: 32,
      gateway: gateways[0],
      updates: [
        { time: '10:30', message: '32 sayaç okundu', type: 'progress' },
        { time: '09:15', message: 'İşe başlandı', type: 'start' }
      ],
      images: []
    },
    {
      id: 2,
      type: 'maintenance',
      title: 'Gateway B1 Bakım',
      site: sites[1],
      description: 'Gateway B1 periyodik bakım ve yazılım güncelleme',
      priority: 'normal',
      status: 'pending',
      assignee: workers[0],
      createdAt: '2024-01-15 11:00',
      dueDate: '2024-01-17 12:00',
      gateway: gateways[2],
      updates: [],
      images: []
    },
    {
      id: 3,
      type: 'installation',
      title: 'D Blok Yeni Sayaç Kurulumu',
      site: sites[3],
      description: '5 adet yeni sayaç kurulumu',
      priority: 'normal',
      status: 'pending',
      assignee: workers[2],
      createdAt: '2024-01-15 14:00',
      dueDate: '2024-01-18 16:00',
      meters: 5,
      completedMeters: 0,
      updates: [],
      images: []
    },
    {
      id: 4,
      type: 'repair',
      title: 'C Blok Gateway Arıza',
      site: sites[2],
      description: 'Gateway C1 iletişim sorunu giderme',
      priority: 'urgent',
      status: 'in_progress',
      assignee: workers[4],
      createdAt: '2024-01-15 08:00',
      dueDate: '2024-01-15 14:00',
      gateway: gateways[3],
      updates: [
        { time: '12:45', message: 'Sorun tespit edildi, parça değişimi gerekiyor', type: 'note', image: true },
        { time: '10:00', message: 'Arıza analizi başlatıldı', type: 'progress' },
        { time: '08:30', message: 'Sahaya ulaşıldı', type: 'start' }
      ],
      images: ['ariza1.jpg', 'ariza2.jpg']
    },
    {
      id: 5,
      type: 'meter_reading',
      title: 'B Blok Haftalık Kontrol',
      site: sites[1],
      description: 'Haftalık rutin sayaç kontrolü',
      priority: 'low',
      status: 'completed',
      assignee: workers[0],
      createdAt: '2024-01-14 09:00',
      dueDate: '2024-01-14 17:00',
      completedAt: '2024-01-14 15:30',
      meters: 36,
      completedMeters: 36,
      gateway: gateways[2],
      updates: [
        { time: '15:30', message: 'İş tamamlandı', type: 'complete' },
        { time: '12:00', message: '18 sayaç okundu', type: 'progress' },
        { time: '09:30', message: 'İşe başlandı', type: 'start' }
      ],
      images: []
    }
  ]);

  const workTypes = [
    { value: 'meter_reading', label: 'Sayaç Okuma', icon: Gauge },
    { value: 'maintenance', label: 'Bakım', icon: Wrench },
    { value: 'installation', label: 'Kurulum', icon: Plus },
    { value: 'repair', label: 'Arıza Giderme', icon: AlertTriangle },
    { value: 'inspection', label: 'Denetim', icon: Eye }
  ];

  const priorities = [
    { value: 'urgent', label: 'Acil', color: '#ef4444' },
    { value: 'high', label: 'Yüksek', color: '#f59e0b' },
    { value: 'normal', label: 'Normal', color: '#3b82f6' },
    { value: 'low', label: 'Düşük', color: '#10b981' }
  ];

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: 'Bekliyor', color: '#f59e0b', icon: Clock },
      in_progress: { label: 'Devam Ediyor', color: '#3b82f6', icon: RefreshCw },
      completed: { label: 'Tamamlandı', color: '#10b981', icon: CheckCircle2 },
      cancelled: { label: 'İptal', color: '#ef4444', icon: XCircle }
    };
    const config = statusConfig[status];
    const Icon = config.icon;
    return (
      <span className="status-badge" style={{ background: `${config.color}20`, color: config.color }}>
        <Icon size={14} />
        {config.label}
      </span>
    );
  };

  const getWorkerStatus = (status) => {
    const statusConfig = {
      available: { label: 'Müsait', color: '#10b981' },
      busy: { label: 'Meşgul', color: '#f59e0b' },
      offline: { label: 'Çevrimdışı', color: '#6b7280' }
    };
    return statusConfig[status];
  };

  const getWorkTypeIcon = (type) => {
    const config = workTypes.find(t => t.value === type);
    return config ? config.icon : Wrench;
  };

  const filteredAssignments = workAssignments.filter(work => {
    const matchesStatus = filterStatus === 'all' || work.status === filterStatus;
    const matchesWorker = filterWorker === 'all' || work.assignee?.id === parseInt(filterWorker);
    const matchesSearch = searchTerm === '' ||
      work.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      work.site.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesWorker && matchesSearch;
  });

  const stats = {
    total: workAssignments.length,
    pending: workAssignments.filter(w => w.status === 'pending').length,
    inProgress: workAssignments.filter(w => w.status === 'in_progress').length,
    completed: workAssignments.filter(w => w.status === 'completed').length,
    availableWorkers: workers.filter(w => w.status === 'available').length
  };

  const performanceData = workers.map(w => ({
    name: w.name.split(' ')[0],
    jobs: w.completedJobs,
    rating: w.rating * 20
  }));

  const workTypeDistribution = workTypes.map(type => ({
    name: type.label,
    value: workAssignments.filter(w => w.type === type.value).length
  })).filter(d => d.value > 0);

  const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6'];

  const handleCreateWork = () => {
    const site = sites.find(s => s.id === parseInt(newWork.site));
    const assignee = workers.find(w => w.id === parseInt(newWork.assignee));
    const gateway = gateways.find(g => g.id === parseInt(newWork.gateway));

    const work = {
      id: workAssignments.length + 1,
      type: newWork.type,
      title: `${site?.name} ${workTypes.find(t => t.value === newWork.type)?.label}`,
      site: site,
      description: newWork.description,
      priority: newWork.priority,
      status: 'pending',
      assignee: assignee,
      createdAt: new Date().toLocaleString('tr-TR'),
      dueDate: newWork.dueDate,
      gateway: gateway,
      meters: site?.meters || 0,
      completedMeters: 0,
      updates: [],
      images: []
    };

    setWorkAssignments([work, ...workAssignments]);
    setShowNewWorkModal(false);
    setNewWork({
      type: 'meter_reading',
      site: '',
      description: '',
      priority: 'normal',
      assignee: '',
      dueDate: '',
      meters: [],
      gateway: ''
    });
  };

  return (
    <div className="service-work-page">
      <div className="page-header">
        <div className="header-content">
          <div className="header-icon">
            <ClipboardList size={28} />
          </div>
          <div>
            <h1>Servis İş Atama</h1>
            <p>Saha personeline iş atama ve takip</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn-primary" onClick={() => setShowNewWorkModal(true)}>
            <Plus size={18} />
            Yeni İş Oluştur
          </button>
        </div>
      </div>

      {/* İstatistik Kartları */}
      <div className="work-stats-grid">
        <div className="work-stat-card">
          <div className="stat-icon">
            <ClipboardList size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Toplam İş</span>
          </div>
        </div>
        <div className="work-stat-card pending">
          <div className="stat-icon">
            <Clock size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.pending}</span>
            <span className="stat-label">Bekleyen</span>
          </div>
        </div>
        <div className="work-stat-card progress">
          <div className="stat-icon">
            <RefreshCw size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.inProgress}</span>
            <span className="stat-label">Devam Eden</span>
          </div>
        </div>
        <div className="work-stat-card completed">
          <div className="stat-icon">
            <CheckCircle2 size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.completed}</span>
            <span className="stat-label">Tamamlanan</span>
          </div>
        </div>
        <div className="work-stat-card workers">
          <div className="stat-icon">
            <Users size={24} />
          </div>
          <div className="stat-content">
            <span className="stat-value">{stats.availableWorkers}</span>
            <span className="stat-label">Müsait Personel</span>
          </div>
        </div>
      </div>

      {/* Tab Menü */}
      <div className="work-tabs">
        <button
          className={`tab ${activeTab === 'assignments' ? 'active' : ''}`}
          onClick={() => setActiveTab('assignments')}
        >
          <ClipboardList size={18} />
          İş Atamaları
        </button>
        <button
          className={`tab ${activeTab === 'workers' ? 'active' : ''}`}
          onClick={() => setActiveTab('workers')}
        >
          <Users size={18} />
          Personel
        </button>
        <button
          className={`tab ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <TrendingUp size={18} />
          Analiz
        </button>
      </div>

      {/* İş Atamaları Tab */}
      {activeTab === 'assignments' && (
        <div className="assignments-section">
          {/* Filtreler */}
          <div className="filter-bar">
            <div className="search-box">
              <Search size={18} />
              <input
                type="text"
                placeholder="İş veya site ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="filter-group">
              <Filter size={18} />
              <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="all">Tüm Durumlar</option>
                <option value="pending">Bekleyen</option>
                <option value="in_progress">Devam Eden</option>
                <option value="completed">Tamamlanan</option>
              </select>
            </div>
            <div className="filter-group">
              <Users size={18} />
              <select value={filterWorker} onChange={(e) => setFilterWorker(e.target.value)}>
                <option value="all">Tüm Personel</option>
                {workers.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* İş Listesi */}
          <div className="work-list">
            {filteredAssignments.map(work => {
              const TypeIcon = getWorkTypeIcon(work.type);
              const priorityConfig = priorities.find(p => p.value === work.priority);

              return (
                <div
                  key={work.id}
                  className={`work-card ${work.status}`}
                  onClick={() => setSelectedWork(selectedWork?.id === work.id ? null : work)}
                >
                  <div className="work-header">
                    <div className="work-type">
                      <TypeIcon size={20} />
                      <span
                        className="priority-dot"
                        style={{ background: priorityConfig?.color }}
                        title={priorityConfig?.label}
                      ></span>
                    </div>
                    <div className="work-info">
                      <h3>{work.title}</h3>
                      <div className="work-meta">
                        <span><Building2 size={14} /> {work.site.name}</span>
                        <span><Calendar size={14} /> {work.dueDate}</span>
                      </div>
                    </div>
                    <div className="work-status">
                      {getStatusBadge(work.status)}
                    </div>
                  </div>

                  {work.assignee && (
                    <div className="work-assignee">
                      <div className="assignee-avatar">{work.assignee.avatar}</div>
                      <div className="assignee-info">
                        <span className="name">{work.assignee.name}</span>
                        <span className="phone">{work.assignee.phone}</span>
                      </div>
                      <div className="assignee-actions">
                        <button title="Ara"><Phone size={16} /></button>
                        <button title="Mesaj"><MessageSquare size={16} /></button>
                      </div>
                    </div>
                  )}

                  {work.meters && (
                    <div className="work-progress">
                      <div className="progress-header">
                        <span>İlerleme</span>
                        <span>{work.completedMeters} / {work.meters} sayaç</span>
                      </div>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${(work.completedMeters / work.meters) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {selectedWork?.id === work.id && (
                    <div className="work-details">
                      <div className="detail-section">
                        <h4>Açıklama</h4>
                        <p>{work.description}</p>
                      </div>

                      {work.gateway && (
                        <div className="detail-section">
                          <h4>Gateway</h4>
                          <span className="gateway-badge">
                            <Radio size={14} />
                            {work.gateway.name}
                          </span>
                        </div>
                      )}

                      {work.updates.length > 0 && (
                        <div className="detail-section">
                          <h4>Güncellemeler</h4>
                          <div className="updates-timeline">
                            {work.updates.map((update, index) => (
                              <div key={index} className={`update-item ${update.type}`}>
                                <span className="update-time">{update.time}</span>
                                <span className="update-message">
                                  {update.message}
                                  {update.image && <Camera size={14} />}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {work.images.length > 0 && (
                        <div className="detail-section">
                          <h4>Fotoğraflar ({work.images.length})</h4>
                          <div className="images-grid">
                            {work.images.map((img, index) => (
                              <div key={index} className="image-thumb">
                                <Camera size={24} />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="detail-actions">
                        <button className="btn-secondary">
                          <Edit3 size={16} />
                          Düzenle
                        </button>
                        <button className="btn-secondary">
                          <MessageSquare size={16} />
                          Not Ekle
                        </button>
                        {work.status !== 'completed' && (
                          <button className="btn-primary">
                            <CheckCircle2 size={16} />
                            Tamamla
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Personel Tab */}
      {activeTab === 'workers' && (
        <div className="workers-section">
          <div className="workers-grid">
            {workers.map(worker => {
              const statusConfig = getWorkerStatus(worker.status);
              return (
                <div key={worker.id} className={`worker-card ${worker.status}`}>
                  <div className="worker-header">
                    <div className="worker-avatar">{worker.avatar}</div>
                    <div className="worker-info">
                      <h3>{worker.name}</h3>
                      <span
                        className="status-badge"
                        style={{ background: `${statusConfig.color}20`, color: statusConfig.color }}
                      >
                        {statusConfig.label}
                      </span>
                    </div>
                    <div className="worker-rating">
                      <Star size={16} />
                      <span>{worker.rating}</span>
                    </div>
                  </div>

                  <div className="worker-contact">
                    <a href={`tel:${worker.phone}`}>
                      <Phone size={16} />
                      {worker.phone}
                    </a>
                    <a href={`mailto:${worker.email}`}>
                      <Mail size={16} />
                      {worker.email}
                    </a>
                  </div>

                  <div className="worker-skills">
                    {worker.skills.map((skill, index) => (
                      <span key={index} className="skill-tag">{skill}</span>
                    ))}
                  </div>

                  <div className="worker-stats">
                    <div className="stat">
                      <span className="value">{worker.completedJobs}</span>
                      <span className="label">Tamamlanan İş</span>
                    </div>
                  </div>

                  {worker.currentJob && (
                    <div className="current-job">
                      <span className="label">Aktif İş:</span>
                      <span className="job-name">{worker.currentJob}</span>
                    </div>
                  )}

                  <div className="worker-actions">
                    <button className="btn-secondary">
                      <Eye size={16} />
                      Detay
                    </button>
                    <button
                      className="btn-primary"
                      disabled={worker.status !== 'available'}
                    >
                      <Send size={16} />
                      İş Ata
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Analiz Tab */}
      {activeTab === 'analytics' && (
        <div className="analytics-section">
          <div className="analytics-grid">
            <div className="chart-card">
              <h3>Personel Performansı</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" />
                  <YAxis stroke="rgba(255,255,255,0.5)" />
                  <Tooltip
                    contentStyle={{
                      background: 'rgba(30, 41, 59, 0.95)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="jobs" fill="#3b82f6" name="Tamamlanan İş" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="chart-card">
              <h3>İş Tipi Dağılımı</h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={workTypeDistribution}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, value }) => `${name}: ${value}`}
                  >
                    {workTypeDistribution.map((entry, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Yeni İş Modal */}
      {showNewWorkModal && (
        <div className="modal-overlay" onClick={() => setShowNewWorkModal(false)}>
          <div className="modal new-work-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Yeni İş Oluştur</h2>
              <button className="close-btn" onClick={() => setShowNewWorkModal(false)}>
                <XCircle size={24} />
              </button>
            </div>

            <div className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label>İş Tipi</label>
                  <select
                    value={newWork.type}
                    onChange={(e) => setNewWork({ ...newWork, type: e.target.value })}
                  >
                    {workTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Öncelik</label>
                  <select
                    value={newWork.priority}
                    onChange={(e) => setNewWork({ ...newWork, priority: e.target.value })}
                  >
                    {priorities.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Site</label>
                <select
                  value={newWork.site}
                  onChange={(e) => setNewWork({ ...newWork, site: e.target.value })}
                >
                  <option value="">Site Seçin</option>
                  {sites.map(site => (
                    <option key={site.id} value={site.id}>
                      {site.name} ({site.meters} sayaç)
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Gateway (Opsiyonel)</label>
                <select
                  value={newWork.gateway}
                  onChange={(e) => setNewWork({ ...newWork, gateway: e.target.value })}
                >
                  <option value="">Gateway Seçin</option>
                  {gateways
                    .filter(g => !newWork.site || g.siteId === parseInt(newWork.site))
                    .map(gateway => (
                      <option key={gateway.id} value={gateway.id}>
                        {gateway.name} ({gateway.meters} sayaç)
                      </option>
                    ))}
                </select>
              </div>

              <div className="form-group">
                <label>Açıklama</label>
                <textarea
                  value={newWork.description}
                  onChange={(e) => setNewWork({ ...newWork, description: e.target.value })}
                  placeholder="İş detaylarını yazın..."
                  rows={3}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Atanan Personel</label>
                  <select
                    value={newWork.assignee}
                    onChange={(e) => setNewWork({ ...newWork, assignee: e.target.value })}
                  >
                    <option value="">Personel Seçin</option>
                    {workers.filter(w => w.status === 'available').map(worker => (
                      <option key={worker.id} value={worker.id}>
                        {worker.name} ({worker.completedJobs} iş)
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Bitiş Tarihi</label>
                  <input
                    type="datetime-local"
                    value={newWork.dueDate}
                    onChange={(e) => setNewWork({ ...newWork, dueDate: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowNewWorkModal(false)}>
                İptal
              </button>
              <button
                className="btn-primary"
                onClick={handleCreateWork}
                disabled={!newWork.site || !newWork.assignee}
              >
                <Send size={18} />
                İş Oluştur
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ServiceWorkAssignment;
