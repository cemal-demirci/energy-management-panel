import React, { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
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

function App() {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const navItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/sites', label: 'Site Yönetimi', icon: '🏢' },
    { path: '/meters', label: 'Sayaçlar', icon: '📈' },
    { path: '/gateways', label: 'Gateway Yönetimi', icon: '📡' },
    { path: '/mbus', label: 'M-Bus Okuma', icon: '📖' },
    { path: '/billing', label: 'Faturalandırma', icon: '💰' },
    { path: '/analytics', label: 'Analitik', icon: '📉' },
    { path: '/alerts', label: 'Uyarılar', icon: '🔔' },
    { path: '/map', label: 'Harita', icon: '🗺️' },
    { path: '/ai', label: 'AI Asistan', icon: '🤖' },
    { path: '/notes', label: 'Notlar', icon: '📝' },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="app-container">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="logo">
            <span className="logo-icon">⚡</span>
            {sidebarOpen && <h1>Enerji Yönetim</h1>}
          </div>
          <button className="toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {sidebarOpen && <span className="nav-label">{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          {sidebarOpen && (
            <div className="version-info">
              <span>v2.0.0 - AI Powered</span>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/sites" element={<SiteView />} />
          <Route path="/meters" element={<MeterList />} />
          <Route path="/meters/:id" element={<MeterDetail />} />
          <Route path="/gateways" element={<GatewayManagement />} />
          <Route path="/mbus" element={<MBusReader />} />
          <Route path="/billing" element={<Billing />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/map" element={<MapView />} />
          <Route path="/ai" element={<AIAssistant />} />
          <Route path="/notes" element={<Notes />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
