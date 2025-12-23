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
  Building2,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [activeTab, setActiveTab] = useState('users');
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [activityLogs, setActivityLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const safeJson = async (res) => {
    try {
      const ct = res.headers.get('content-type');
      if (res.ok && ct?.includes('application/json')) return await res.json();
    } catch {}
    return null;
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [usersRes, rolesRes, logsRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/roles'),
        fetch('/api/activity-logs?limit=50')
      ]);

      const usersData = await safeJson(usersRes);
      const rolesData = await safeJson(rolesRes);
      const logsData = await safeJson(logsRes);

      if (usersData) {
        setUsers(usersData.users || usersData || []);
      } else {
        setUsers([
          { id: 1, name: 'Admin User', email: 'admin@example.com', phone: '555-0001', role: 'admin', status: 'active', lastLogin: '2024-12-23 10:30' },
          { id: 2, name: 'Operator 1', email: 'operator@example.com', phone: '555-0002', role: 'operator', status: 'active', lastLogin: '2024-12-22 14:15' }
        ]);
      }

      if (rolesData) {
        setRoles(rolesData.roles || rolesData || []);
      } else {
        setRoles([
          { id: 'admin', name: 'Yönetici', permissions: ['all'] },
          { id: 'operator', name: 'Operatör', permissions: ['read', 'write'] },
          { id: 'viewer', name: 'İzleyici', permissions: ['read'] }
        ]);
      }

      if (logsData) {
        setActivityLogs(logsData.logs || logsData || []);
      } else {
        setActivityLogs([
          { id: 1, user: 'Admin User', action: 'Giriş yaptı', timestamp: '2024-12-23 10:30', ip: '192.168.1.1' },
          { id: 2, user: 'Operator 1', action: 'Sayaç okuması yaptı', timestamp: '2024-12-22 14:15', ip: '192.168.1.2' }
        ]);
      }

    } catch (err) {
      console.error('Load data error:', err);
      setUsers([]);
      setRoles([]);
      setActivityLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'viewer',
    sites: []
  });

  const handleAddUser = async () => {
    if (!newUser.name || !newUser.email) return;

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });

      if (!res.ok) throw new Error('Kullanıcı eklenemedi');

      await loadData(); // Listeyi yenile
      setNewUser({ name: '', email: '', phone: '', role: 'viewer', sites: [] });
      setShowAddModal(false);
    } catch (err) {
      console.error('Add user error:', err);
      alert('Kullanıcı eklenirken hata: ' + err.message);
    }
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

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Veriler yükleniyor...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <AlertTriangle size={48} />
        <h3>Veri Yüklenemedi</h3>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={loadData}>
          <RefreshCw size={18} />
          Tekrar Dene
        </button>
      </div>
    );
  }

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
