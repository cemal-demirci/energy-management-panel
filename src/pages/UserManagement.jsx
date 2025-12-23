import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Shield,
  Mail,
  Phone,
  Calendar,
  MoreVertical,
  Edit,
  Trash2,
  Key,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Download,
  Clock,
  Activity,
  UserCheck,
  UserX,
  Building2
} from 'lucide-react';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [activeTab, setActiveTab] = useState('users');
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [activityLogs, setActivityLogs] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    // Sample users
    setUsers([
      { id: 1, name: 'Ahmet Yılmaz', email: 'ahmet@enerji.com', phone: '532 123 4567', role: 'admin', status: 'active', lastLogin: '2024-12-23 09:30', sites: 12 },
      { id: 2, name: 'Mehmet Kaya', email: 'mehmet@enerji.com', phone: '533 234 5678', role: 'operator', status: 'active', lastLogin: '2024-12-23 08:15', sites: 5 },
      { id: 3, name: 'Ayşe Demir', email: 'ayse@enerji.com', phone: '534 345 6789', role: 'viewer', status: 'active', lastLogin: '2024-12-22 14:20', sites: 3 },
      { id: 4, name: 'Fatma Çelik', email: 'fatma@enerji.com', phone: '535 456 7890', role: 'operator', status: 'inactive', lastLogin: '2024-12-15 11:00', sites: 8 },
      { id: 5, name: 'Ali Öztürk', email: 'ali@enerji.com', phone: '536 567 8901', role: 'technician', status: 'active', lastLogin: '2024-12-23 07:45', sites: 15 },
    ]);

    // Sample roles
    setRoles([
      { id: 'admin', name: 'Yönetici', description: 'Tam yetki', users: 2, color: '#EF4444', permissions: ['all'] },
      { id: 'operator', name: 'Operatör', description: 'Okuma ve yazma', users: 5, color: '#3B82F6', permissions: ['read', 'write', 'reports'] },
      { id: 'technician', name: 'Teknisyen', description: 'Saha işlemleri', users: 8, color: '#10B981', permissions: ['read', 'maintenance'] },
      { id: 'viewer', name: 'İzleyici', description: 'Sadece okuma', users: 12, color: '#8B5CF6', permissions: ['read'] },
      { id: 'billing', name: 'Muhasebe', description: 'Fatura işlemleri', users: 3, color: '#F59E0B', permissions: ['read', 'billing'] },
    ]);

    // Sample activity logs
    setActivityLogs([
      { id: 1, user: 'Ahmet Yılmaz', action: 'Giriş yaptı', timestamp: '2024-12-23 09:30:15', ip: '192.168.1.100', type: 'login' },
      { id: 2, user: 'Mehmet Kaya', action: 'Site A sayaç okuması', timestamp: '2024-12-23 09:25:00', ip: '192.168.1.101', type: 'read' },
      { id: 3, user: 'Ali Öztürk', action: 'Gateway bakımı tamamlandı', timestamp: '2024-12-23 09:20:30', ip: '192.168.1.102', type: 'maintenance' },
      { id: 4, user: 'Ayşe Demir', action: 'Rapor indirildi', timestamp: '2024-12-23 09:15:00', ip: '192.168.1.103', type: 'download' },
      { id: 5, user: 'Ahmet Yılmaz', action: 'Yeni kullanıcı ekledi', timestamp: '2024-12-23 09:10:00', ip: '192.168.1.100', type: 'create' },
      { id: 6, user: 'Mehmet Kaya', action: 'Fatura oluşturuldu', timestamp: '2024-12-23 09:05:00', ip: '192.168.1.101', type: 'billing' },
      { id: 7, user: 'Fatma Çelik', action: 'Çıkış yaptı', timestamp: '2024-12-15 11:30:00', ip: '192.168.1.104', type: 'logout' },
    ]);
  };

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'viewer',
    sites: []
  });

  const handleAddUser = () => {
    if (!newUser.name || !newUser.email) return;

    setUsers([...users, {
      id: users.length + 1,
      ...newUser,
      status: 'active',
      lastLogin: '-',
      sites: 0
    }]);
    setNewUser({ name: '', email: '', phone: '', role: 'viewer', sites: [] });
    setShowAddModal(false);
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = !filterRole || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (roleId) => {
    const role = roles.find(r => r.id === roleId);
    return role ? (
      <span className="role-badge" style={{ backgroundColor: role.color + '20', color: role.color }}>
        {role.name}
      </span>
    ) : roleId;
  };

  const getActionIcon = (type) => {
    switch(type) {
      case 'login': return <UserCheck size={14} className="text-green" />;
      case 'logout': return <UserX size={14} className="text-red" />;
      case 'read': return <Activity size={14} className="text-blue" />;
      case 'maintenance': return <Key size={14} className="text-orange" />;
      case 'download': return <Download size={14} className="text-purple" />;
      case 'create': return <UserPlus size={14} className="text-green" />;
      case 'billing': return <Building2 size={14} className="text-yellow" />;
      default: return <Activity size={14} />;
    }
  };

  return (
    <div className="user-management-page">
      <div className="page-header">
        <div className="header-title">
          <Users size={28} />
          <div>
            <h1>Kullanıcı Yönetimi</h1>
            <p className="subtitle">Kullanıcılar, roller ve yetkiler</p>
          </div>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <UserPlus size={18} />
          Yeni Kullanıcı
        </button>
      </div>

      {/* Stats */}
      <div className="user-stats-grid">
        <div className="user-stat-card">
          <Users size={24} />
          <div className="stat-info">
            <span className="stat-value">{users.length}</span>
            <span className="stat-label">Toplam Kullanıcı</span>
          </div>
        </div>
        <div className="user-stat-card">
          <UserCheck size={24} />
          <div className="stat-info">
            <span className="stat-value">{users.filter(u => u.status === 'active').length}</span>
            <span className="stat-label">Aktif</span>
          </div>
        </div>
        <div className="user-stat-card">
          <Shield size={24} />
          <div className="stat-info">
            <span className="stat-value">{roles.length}</span>
            <span className="stat-label">Rol</span>
          </div>
        </div>
        <div className="user-stat-card">
          <Clock size={24} />
          <div className="stat-info">
            <span className="stat-value">{activityLogs.length}</span>
            <span className="stat-label">Bugünkü İşlem</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <button
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <Users size={18} />
          Kullanıcılar
        </button>
        <button
          className={`tab-btn ${activeTab === 'roles' ? 'active' : ''}`}
          onClick={() => setActiveTab('roles')}
        >
          <Shield size={18} />
          Roller
        </button>
        <button
          className={`tab-btn ${activeTab === 'logs' ? 'active' : ''}`}
          onClick={() => setActiveTab('logs')}
        >
          <Activity size={18} />
          İşlem Geçmişi
        </button>
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="content-card">
          <div className="card-toolbar">
            <div className="search-box">
              <Search size={18} />
              <input
                type="text"
                placeholder="Kullanıcı ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
              <option value="">Tüm Roller</option>
              {roles.map(role => (
                <option key={role.id} value={role.id}>{role.name}</option>
              ))}
            </select>
          </div>

          <div className="users-table">
            <table>
              <thead>
                <tr>
                  <th>Kullanıcı</th>
                  <th>İletişim</th>
                  <th>Rol</th>
                  <th>Durum</th>
                  <th>Son Giriş</th>
                  <th>Site Sayısı</th>
                  <th>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.id}>
                    <td>
                      <div className="user-cell">
                        <div className="user-avatar">{user.name.charAt(0)}</div>
                        <span>{user.name}</span>
                      </div>
                    </td>
                    <td>
                      <div className="contact-info">
                        <span><Mail size={12} /> {user.email}</span>
                        <span><Phone size={12} /> {user.phone}</span>
                      </div>
                    </td>
                    <td>{getRoleBadge(user.role)}</td>
                    <td>
                      <span className={`status-badge ${user.status}`}>
                        {user.status === 'active' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                        {user.status === 'active' ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td>{user.lastLogin}</td>
                    <td>{user.sites}</td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-icon" title="Düzenle"><Edit size={16} /></button>
                        <button className="btn-icon" title="Şifre Sıfırla"><Key size={16} /></button>
                        <button className="btn-icon danger" title="Sil"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Roles Tab */}
      {activeTab === 'roles' && (
        <div className="roles-grid">
          {roles.map(role => (
            <div key={role.id} className="role-card" style={{ borderColor: role.color }}>
              <div className="role-header">
                <div className="role-icon" style={{ backgroundColor: role.color + '20', color: role.color }}>
                  <Shield size={24} />
                </div>
                <div className="role-info">
                  <h3>{role.name}</h3>
                  <p>{role.description}</p>
                </div>
              </div>
              <div className="role-stats">
                <span><Users size={14} /> {role.users} kullanıcı</span>
              </div>
              <div className="role-permissions">
                <h4>Yetkiler:</h4>
                <div className="permission-tags">
                  {role.permissions.map(perm => (
                    <span key={perm} className="permission-tag">{perm}</span>
                  ))}
                </div>
              </div>
              <div className="role-actions">
                <button className="btn btn-outline btn-sm">
                  <Edit size={14} /> Düzenle
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Activity Logs Tab */}
      {activeTab === 'logs' && (
        <div className="content-card">
          <div className="card-toolbar">
            <div className="search-box">
              <Search size={18} />
              <input type="text" placeholder="İşlem ara..." />
            </div>
            <button className="btn btn-outline">
              <Download size={16} /> Dışa Aktar
            </button>
          </div>

          <div className="activity-log-list">
            {activityLogs.map(log => (
              <div key={log.id} className="log-item">
                <div className="log-icon">{getActionIcon(log.type)}</div>
                <div className="log-content">
                  <span className="log-user">{log.user}</span>
                  <span className="log-action">{log.action}</span>
                </div>
                <div className="log-meta">
                  <span className="log-time">{log.timestamp}</span>
                  <span className="log-ip">IP: {log.ip}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2><UserPlus size={20} /> Yeni Kullanıcı Ekle</h2>
              <button className="close-btn" onClick={() => setShowAddModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Ad Soyad</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={e => setNewUser({...newUser, name: e.target.value})}
                  placeholder="Kullanıcı adı"
                />
              </div>
              <div className="form-group">
                <label>E-posta</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={e => setNewUser({...newUser, email: e.target.value})}
                  placeholder="E-posta adresi"
                />
              </div>
              <div className="form-group">
                <label>Telefon</label>
                <input
                  type="tel"
                  value={newUser.phone}
                  onChange={e => setNewUser({...newUser, phone: e.target.value})}
                  placeholder="Telefon numarası"
                />
              </div>
              <div className="form-group">
                <label>Rol</label>
                <select
                  value={newUser.role}
                  onChange={e => setNewUser({...newUser, role: e.target.value})}
                >
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowAddModal(false)}>İptal</button>
              <button className="btn btn-primary" onClick={handleAddUser}>Ekle</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserManagement;
