import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Plus,
  Filter,
  Search,
  MapPin,
  User,
  Phone,
  FileText,
  Camera,
  MessageSquare,
  ChevronRight,
  Radio,
  Gauge,
  Building2,
  RefreshCw,
  Download,
  Bell,
  Settings
} from 'lucide-react';

function MaintenanceManagement() {
  const [tasks, setTasks] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [activeTab, setActiveTab] = useState('tasks');
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sites, setSites] = useState([]);

  const safeJson = async (res) => {
    try {
      const ct = res.headers.get('content-type');
      if (res.ok && ct?.includes('application/json')) return await res.json();
    } catch {}
    return null;
  };

  useEffect(() => {
    loadData();
    loadSites();
  }, []);

  const loadSites = async () => {
    try {
      const res = await fetch('/api/sites?limit=500');
      const data = await safeJson(res);
      if (data) {
        setSites(data.sites || data || []);
      }
    } catch (err) {
      console.error('Sites load error:', err);
    }
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [tasksRes, schedulesRes] = await Promise.all([
        fetch('/api/maintenance/tasks'),
        fetch('/api/maintenance/schedules')
      ]);

      const tasksData = await safeJson(tasksRes);
      const schedulesData = await safeJson(schedulesRes);

      // Demo data if API unavailable
      if (tasksData) {
        setTasks(tasksData.tasks || tasksData || []);
      } else {
        setTasks([
          { id: 1, title: 'Gateway batarya kontrolü', type: 'gateway', site: 'Merkez Site', building: 'A Blok', priority: 'high', status: 'pending', dueDate: '2024-01-15', assignee: 'Ali Öztürk', description: 'Gateway batarya seviyesi düşük', estimatedTime: '30 dk' },
          { id: 2, title: 'Sayaç veri okuma hatası', type: 'meter', site: 'Kuzey Site', building: 'B Blok', priority: 'medium', status: 'in_progress', dueDate: '2024-01-16', assignee: 'Mehmet Kaya', description: 'Sayaç veri göndermiyor', estimatedTime: '1 saat' },
          { id: 3, title: 'Haberleşme kesintisi', type: 'communication', site: 'Güney Site', building: 'C Blok', priority: 'high', status: 'pending', dueDate: '2024-01-14', assignee: '', description: 'Gateway bağlantı sorunu', estimatedTime: '2 saat' }
        ]);
      }

      if (schedulesData) {
        setSchedules(schedulesData.schedules || schedulesData || []);
      } else {
        setSchedules([
          { id: 1, name: 'Aylık Gateway Kontrolü', frequency: 'monthly', lastRun: '2024-01-01', nextRun: '2024-02-01', sites: ['Merkez Site', 'Kuzey Site'], tasks: 12, active: true },
          { id: 2, name: 'Haftalık Sayaç Okuma', frequency: 'weekly', lastRun: '2024-01-10', nextRun: '2024-01-17', sites: ['Tüm Siteler'], tasks: 150, active: true },
          { id: 3, name: 'Yıllık Kalibrasyon', frequency: 'yearly', lastRun: '2023-06-15', nextRun: '2024-06-15', sites: ['Merkez Site'], tasks: 50, active: false }
        ]);
      }

    } catch (err) {
      console.error('Load data error:', err);
      setTasks([]);
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  const [newTask, setNewTask] = useState({
    title: '',
    type: 'meter',
    site: '',
    building: '',
    priority: 'medium',
    dueDate: '',
    assignee: '',
    description: ''
  });

  const getPriorityBadge = (priority) => {
    const styles = {
      high: { bg: '#FEE2E2', color: '#DC2626', label: 'Yüksek' },
      medium: { bg: '#FEF3C7', color: '#D97706', label: 'Orta' },
      low: { bg: '#DCFCE7', color: '#16A34A', label: 'Düşük' }
    };
    const style = styles[priority] || styles.medium;
    return (
      <span className="priority-badge" style={{ backgroundColor: style.bg, color: style.color }}>
        {style.label}
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: { icon: Clock, color: '#F59E0B', label: 'Bekliyor' },
      in_progress: { icon: RefreshCw, color: '#3B82F6', label: 'Devam Ediyor' },
      scheduled: { icon: Calendar, color: '#8B5CF6', label: 'Planlandı' },
      completed: { icon: CheckCircle, color: '#10B981', label: 'Tamamlandı' },
      cancelled: { icon: XCircle, color: '#EF4444', label: 'İptal' }
    };
    const style = styles[status] || styles.pending;
    const IconComponent = style.icon;
    return (
      <span className="status-badge" style={{ color: style.color }}>
        <IconComponent size={14} />
        {style.label}
      </span>
    );
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'gateway': return <Radio size={18} className="type-icon gateway" />;
      case 'meter': return <Gauge size={18} className="type-icon meter" />;
      case 'communication': return <Bell size={18} className="type-icon comm" />;
      default: return <Wrench size={18} />;
    }
  };

  const getFrequencyLabel = (freq) => {
    switch(freq) {
      case 'daily': return 'Günlük';
      case 'weekly': return 'Haftalık';
      case 'monthly': return 'Aylık';
      case 'quarterly': return 'Çeyreklik';
      case 'yearly': return 'Yıllık';
      default: return freq;
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.site.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filterStatus || task.status === filterStatus;
    const matchesPriority = !filterPriority || task.priority === filterPriority;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const stats = {
    total: tasks.length,
    pending: tasks.filter(t => t.status === 'pending').length,
    inProgress: tasks.filter(t => t.status === 'in_progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    overdue: tasks.filter(t => t.status === 'pending' && new Date(t.dueDate) < new Date()).length
  };

  const handleAddTask = () => {
    if (!newTask.title) return;

    setTasks([...tasks, {
      id: tasks.length + 1,
      ...newTask,
      status: 'pending',
      createdAt: new Date().toISOString().split('T')[0],
      estimatedTime: '1 saat'
    }]);
    setNewTask({ title: '', type: 'meter', site: '', building: '', priority: 'medium', dueDate: '', assignee: '', description: '' });
    setShowAddModal(false);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Veriler yükleniyor...</p>
      </div>
    );
  }


  return (
    <div className="maintenance-page">
      <div className="page-header">
        <div className="header-title">
          <Wrench size={28} />
          <div>
            <h1>Bakım Yönetimi</h1>
            <p className="subtitle">Sayaç ve gateway bakım takibi</p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={18} />
          Yeni İş Emri
        </button>
      </div>

      {/* Stats */}
      <div className="maintenance-stats-grid">
        <div className="maint-stat-card">
          <Wrench size={24} />
          <div className="stat-info">
            <span className="stat-value">{stats.total}</span>
            <span className="stat-label">Toplam</span>
          </div>
        </div>
        <div className="maint-stat-card warning">
          <Clock size={24} />
          <div className="stat-info">
            <span className="stat-value">{stats.pending}</span>
            <span className="stat-label">Bekleyen</span>
          </div>
        </div>
        <div className="maint-stat-card info">
          <RefreshCw size={24} />
          <div className="stat-info">
            <span className="stat-value">{stats.inProgress}</span>
            <span className="stat-label">Devam Eden</span>
          </div>
        </div>
        <div className="maint-stat-card success">
          <CheckCircle size={24} />
          <div className="stat-info">
            <span className="stat-value">{stats.completed}</span>
            <span className="stat-label">Tamamlanan</span>
          </div>
        </div>
        <div className="maint-stat-card danger">
          <AlertTriangle size={24} />
          <div className="stat-info">
            <span className="stat-value">{stats.overdue}</span>
            <span className="stat-label">Gecikmiş</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <button
          className={`tab-btn ${activeTab === 'tasks' ? 'active' : ''}`}
          onClick={() => setActiveTab('tasks')}
        >
          <Wrench size={18} />
          İş Emirleri
        </button>
        <button
          className={`tab-btn ${activeTab === 'schedules' ? 'active' : ''}`}
          onClick={() => setActiveTab('schedules')}
        >
          <Calendar size={18} />
          Planlı Bakımlar
        </button>
      </div>

      {/* Tasks Tab */}
      {activeTab === 'tasks' && (
        <div className="content-card">
          <div className="card-toolbar">
            <div className="search-box">
              <Search size={18} />
              <input
                type="text"
                placeholder="İş emri ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">Tüm Durumlar</option>
              <option value="pending">Bekleyen</option>
              <option value="in_progress">Devam Eden</option>
              <option value="scheduled">Planlanmış</option>
              <option value="completed">Tamamlanan</option>
            </select>
            <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
              <option value="">Tüm Öncelikler</option>
              <option value="high">Yüksek</option>
              <option value="medium">Orta</option>
              <option value="low">Düşük</option>
            </select>
          </div>

          <div className="task-list">
            {filteredTasks.map(task => (
              <div key={task.id} className={`task-card ${task.priority}`}>
                <div className="task-header">
                  <div className="task-type">
                    {getTypeIcon(task.type)}
                    {getPriorityBadge(task.priority)}
                  </div>
                  {getStatusBadge(task.status)}
                </div>

                <h3 className="task-title">{task.title}</h3>
                <p className="task-desc">{task.description}</p>

                <div className="task-meta">
                  <span><MapPin size={14} /> {task.site} - {task.building}</span>
                  <span><Calendar size={14} /> {task.dueDate}</span>
                  <span><Clock size={14} /> {task.estimatedTime}</span>
                </div>

                <div className="task-footer">
                  {task.assignee ? (
                    <div className="assignee">
                      <User size={14} />
                      <span>{task.assignee}</span>
                    </div>
                  ) : (
                    <span className="unassigned">Atanmadı</span>
                  )}
                  <div className="task-actions">
                    <button className="btn btn-sm btn-outline">Detay</button>
                    {task.status === 'pending' && (
                      <button className="btn btn-sm btn-primary">Başlat</button>
                    )}
                    {task.status === 'in_progress' && (
                      <button className="btn btn-sm btn-success">Tamamla</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Schedules Tab */}
      {activeTab === 'schedules' && (
        <div className="schedules-grid">
          {schedules.map(schedule => (
            <div key={schedule.id} className={`schedule-card ${schedule.active ? 'active' : 'inactive'}`}>
              <div className="schedule-header">
                <div className="schedule-icon">
                  <Calendar size={24} />
                </div>
                <div className="schedule-status">
                  {schedule.active ? (
                    <span className="badge active">Aktif</span>
                  ) : (
                    <span className="badge inactive">Pasif</span>
                  )}
                </div>
              </div>

              <h3 className="schedule-name">{schedule.name}</h3>

              <div className="schedule-frequency">
                <RefreshCw size={14} />
                <span>{getFrequencyLabel(schedule.frequency)}</span>
              </div>

              <div className="schedule-dates">
                <div className="date-item">
                  <span className="date-label">Son Çalışma</span>
                  <span className="date-value">{schedule.lastRun}</span>
                </div>
                <div className="date-item">
                  <span className="date-label">Sonraki</span>
                  <span className="date-value">{schedule.nextRun}</span>
                </div>
              </div>

              <div className="schedule-sites">
                <Building2 size={14} />
                <span>{schedule.sites.join(', ')}</span>
              </div>

              <div className="schedule-tasks">
                <span className="tasks-count">{schedule.tasks}</span>
                <span className="tasks-label">iş emri oluşturulacak</span>
              </div>

              <div className="schedule-actions">
                <button className="btn btn-sm btn-outline">
                  <Settings size={14} /> Düzenle
                </button>
                <button className="btn btn-sm btn-outline">
                  <RefreshCw size={14} /> Şimdi Çalıştır
                </button>
              </div>
            </div>
          ))}

          <div className="schedule-card add-card" onClick={() => {}}>
            <Plus size={32} />
            <span>Yeni Plan Ekle</span>
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2><Wrench size={20} /> Yeni İş Emri</h2>
              <button className="close-btn" onClick={() => setShowAddModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>İş Emri Başlığı</label>
                <input
                  type="text"
                  value={newTask.title}
                  onChange={e => setNewTask({...newTask, title: e.target.value})}
                  placeholder="Örn: Gateway batarya değişimi"
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Tür</label>
                  <select
                    value={newTask.type}
                    onChange={e => setNewTask({...newTask, type: e.target.value})}
                  >
                    <option value="meter">Sayaç</option>
                    <option value="gateway">Gateway</option>
                    <option value="communication">Haberleşme</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Öncelik</label>
                  <select
                    value={newTask.priority}
                    onChange={e => setNewTask({...newTask, priority: e.target.value})}
                  >
                    <option value="low">Düşük</option>
                    <option value="medium">Orta</option>
                    <option value="high">Yüksek</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Site</label>
                  <select
                    value={newTask.site}
                    onChange={e => setNewTask({...newTask, site: e.target.value})}
                  >
                    <option value="">Seçin</option>
                    {sites.map(site => (
                      <option key={site.id || site.siteId} value={site.name || site.siteName}>
                        {site.name || site.siteName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Bina</label>
                  <input
                    type="text"
                    value={newTask.building}
                    onChange={e => setNewTask({...newTask, building: e.target.value})}
                    placeholder="Bina adı"
                  />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Teslim Tarihi</label>
                  <input
                    type="date"
                    value={newTask.dueDate}
                    onChange={e => setNewTask({...newTask, dueDate: e.target.value})}
                  />
                </div>
                <div className="form-group">
                  <label>Atanan Kişi</label>
                  <select
                    value={newTask.assignee}
                    onChange={e => setNewTask({...newTask, assignee: e.target.value})}
                  >
                    <option value="">Seçin</option>
                    <option value="Ali Öztürk">Ali Öztürk</option>
                    <option value="Mehmet Kaya">Mehmet Kaya</option>
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label>Açıklama</label>
                <textarea
                  value={newTask.description}
                  onChange={e => setNewTask({...newTask, description: e.target.value})}
                  placeholder="İş emri detayları..."
                  rows={3}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>İptal</button>
              <button className="btn btn-primary" onClick={handleAddTask}>Oluştur</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MaintenanceManagement;
