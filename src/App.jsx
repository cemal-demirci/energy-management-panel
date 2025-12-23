import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Gauge,
  Radio,
  BookOpen,
  Receipt,
  TrendingUp,
  Bell,
  Map,
  Bot,
  StickyNote,
  PenSquare,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  Flame,
  Users,
  Leaf,
  Target,
  Wrench,
  GitCompare,
  Award,
  CreditCard,
  Calculator,
  Home,
  Brain,
  Layers,
  Wifi,
  ClipboardList,
  HardHat,
  LogOut,
  User,
  Command
} from 'lucide-react';

// Page imports
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MeterList from './pages/MeterList';
import MeterDetail from './pages/MeterDetail';
import SiteView from './pages/SiteView';
import MapView from './pages/MapView';
import Analytics from './pages/Analytics';
import AIAssistant from './pages/AIAssistant';
import Alerts from './pages/Alerts';
import MBusReader from './pages/MBusReader';
import Billing from './pages/Billing';
import GatewayManagement from './pages/GatewayManagement';
import Notes from './pages/Notes';
import ManualEntry from './pages/ManualEntry';
import Reports from './pages/Reports';
import SettingsPage from './pages/Settings';

// New page imports
import UserManagement from './pages/UserManagement';
import CarbonFootprint from './pages/CarbonFootprint';
import ConsumptionGoals from './pages/ConsumptionGoals';
import MaintenanceManagement from './pages/MaintenanceManagement';
import ComparisonAnalysis from './pages/ComparisonAnalysis';
import BuildingPerformance from './pages/BuildingPerformance';
import PaymentTracking from './pages/PaymentTracking';
import BudgetPlanning from './pages/BudgetPlanning';
import TenantPortal from './pages/TenantPortal';

// New advanced page imports
import MLDataEntry from './pages/MLDataEntry';
import BulkSiteEntry from './pages/BulkSiteEntry';
import LiveMBusReader from './pages/LiveMBusReader';
import ServiceWorkAssignment from './pages/ServiceWorkAssignment';
import FieldWorkerPortal from './pages/FieldWorkerPortal';
import RemoteControl from './pages/RemoteControl';

function App() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [auth, setAuth] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check for existing auth on mount
  useEffect(() => {
    const savedAuth = localStorage.getItem('auth');
    if (savedAuth) {
      try {
        setAuth(JSON.parse(savedAuth));
      } catch (e) {
        localStorage.removeItem('auth');
      }
    }
    setLoading(false);
  }, []);

  const handleLogin = (authData) => {
    setAuth(authData);
  };

  const handleLogout = () => {
    localStorage.removeItem('auth');
    setAuth(null);
  };

  const navItems = [
    // Ana Menü
    { path: '/', label: 'Dashboard', icon: LayoutDashboard, section: 'main' },
    { path: '/sites', label: 'Site Yönetimi', icon: Building2, section: 'main' },
    { path: '/meters', label: 'Isı Sayaçları', icon: Gauge, section: 'main' },
    { path: '/gateways', label: 'Gateway Yönetimi', icon: Radio, section: 'main' },

    // Operasyonlar
    { path: '/mbus', label: 'M-Bus Okuma', icon: BookOpen, section: 'operations' },
    { path: '/live-mbus', label: 'Canlı M-Bus', icon: Wifi, section: 'operations' },
    { path: '/remote-control', label: 'Uzaktan Kontrol', icon: Command, section: 'operations' },
    { path: '/manual-entry', label: 'Manuel Giriş', icon: PenSquare, section: 'operations' },
    { path: '/ml-entry', label: 'ML Veri Girişi', icon: Brain, section: 'operations' },
    { path: '/bulk-entry', label: 'Toplu Okuma', icon: Layers, section: 'operations' },
    { path: '/maintenance', label: 'Bakım Yönetimi', icon: Wrench, section: 'operations' },
    { path: '/work-assignment', label: 'İş Atama', icon: ClipboardList, section: 'operations' },
    { path: '/field-portal', label: 'Saha Portalı', icon: HardHat, section: 'operations' },

    // Finans
    { path: '/billing', label: 'Faturalandırma', icon: Receipt, section: 'finance' },
    { path: '/payments', label: 'Tahsilat Takibi', icon: CreditCard, section: 'finance' },
    { path: '/budget', label: 'Bütçe Planlama', icon: Calculator, section: 'finance' },

    // Analiz & Raporlar
    { path: '/analytics', label: 'Analitik', icon: TrendingUp, section: 'analytics' },
    { path: '/comparison', label: 'Karşılaştırma', icon: GitCompare, section: 'analytics' },
    { path: '/performance', label: 'Bina Performansı', icon: Award, section: 'analytics' },
    { path: '/goals', label: 'Tüketim Hedefleri', icon: Target, section: 'analytics' },
    { path: '/carbon', label: 'Karbon Ayak İzi', icon: Leaf, section: 'analytics' },
    { path: '/reports', label: 'Raporlar', icon: FileText, section: 'analytics' },

    // Diğer
    { path: '/alerts', label: 'Uyarılar', icon: Bell, section: 'other' },
    { path: '/map', label: 'Harita', icon: Map, section: 'other' },
    { path: '/ai', label: 'AI Asistan', icon: Bot, section: 'other' },
    { path: '/notes', label: 'Notlar', icon: StickyNote, section: 'other' },

    // Yönetim
    { path: '/users', label: 'Kullanıcılar', icon: Users, section: 'admin' },
    { path: '/tenant-portal', label: 'Kiracı Portalı', icon: Home, section: 'admin' },
    { path: '/settings', label: 'Ayarlar', icon: Settings, section: 'admin' },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const sections = [
    { id: 'main', label: 'Ana Menü' },
    { id: 'operations', label: 'Operasyonlar' },
    { id: 'finance', label: 'Finans' },
    { id: 'analytics', label: 'Analiz & Raporlar' },
    { id: 'other', label: 'Araçlar' },
    { id: 'admin', label: 'Yönetim' },
  ];

  // Show loading state
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Yükleniyor...</p>
      </div>
    );
  }

  // Show login if not authenticated
  if (!auth) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon-wrapper">
              <Flame size={24} />
            </div>
            {sidebarOpen && <h1>Integral Bina</h1>}
          </div>
          <button className="toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
          </button>
        </div>

        <nav className="sidebar-nav">
          {sections.map((section) => (
            <div key={section.id} className="nav-section">
              {sidebarOpen && <span className="section-label">{section.label}</span>}
              {navItems
                .filter((item) => item.section === section.id)
                .map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
                      title={!sidebarOpen ? item.label : ''}
                    >
                      <span className="nav-icon">
                        <IconComponent size={20} />
                      </span>
                      {sidebarOpen && <span className="nav-label">{item.label}</span>}
                    </Link>
                  );
                })}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          {sidebarOpen ? (
            <div className="footer-content">
              <div className="user-info">
                <div className="user-avatar">
                  <User size={16} />
                </div>
                <div className="user-details">
                  <span className="user-name">{auth.user?.name || 'Admin'}</span>
                  <span className="user-role">{auth.user?.role || 'Yönetici'}</span>
                </div>
              </div>
              <button className="logout-btn" onClick={handleLogout} title="Çıkış Yap">
                <LogOut size={18} />
              </button>
            </div>
          ) : (
            <button className="logout-btn-mini" onClick={handleLogout} title="Çıkış Yap">
              <LogOut size={18} />
            </button>
          )}
          {sidebarOpen && (
            <div className="version-info">
              <span>v3.2.0 - Enterprise</span>
              <a href="https://cemal.online" target="_blank" rel="noopener noreferrer" className="footer-link">
                cemal.online
              </a>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <Routes>
          {/* Main */}
          <Route path="/" element={<Dashboard />} />
          <Route path="/sites" element={<SiteView />} />
          <Route path="/meters" element={<MeterList />} />
          <Route path="/meters/:id" element={<MeterDetail />} />
          <Route path="/gateways" element={<GatewayManagement />} />

          {/* Operations */}
          <Route path="/mbus" element={<MBusReader />} />
          <Route path="/live-mbus" element={<LiveMBusReader />} />
          <Route path="/remote-control" element={<RemoteControl />} />
          <Route path="/manual-entry" element={<ManualEntry />} />
          <Route path="/ml-entry" element={<MLDataEntry />} />
          <Route path="/bulk-entry" element={<BulkSiteEntry />} />
          <Route path="/maintenance" element={<MaintenanceManagement />} />
          <Route path="/work-assignment" element={<ServiceWorkAssignment />} />
          <Route path="/field-portal" element={<FieldWorkerPortal />} />

          {/* Finance */}
          <Route path="/billing" element={<Billing />} />
          <Route path="/payments" element={<PaymentTracking />} />
          <Route path="/budget" element={<BudgetPlanning />} />

          {/* Analytics & Reports */}
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/comparison" element={<ComparisonAnalysis />} />
          <Route path="/performance" element={<BuildingPerformance />} />
          <Route path="/goals" element={<ConsumptionGoals />} />
          <Route path="/carbon" element={<CarbonFootprint />} />
          <Route path="/reports" element={<Reports />} />

          {/* Other */}
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/map" element={<MapView />} />
          <Route path="/ai" element={<AIAssistant />} />
          <Route path="/notes" element={<Notes />} />

          {/* Admin */}
          <Route path="/users" element={<UserManagement />} />
          <Route path="/tenant-portal" element={<TenantPortal />} />
          <Route path="/settings" element={<SettingsPage />} />

          {/* Catch all - redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
