import React, { useState, useEffect } from 'react';
import {
  CreditCard,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  Building2,
  Search,
  Filter,
  Download,
  Send,
  Phone,
  Mail,
  User,
  FileText,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  RefreshCw,
  Bell
} from 'lucide-react';
import { BarChart, Bar, PieChart as RechartsPie, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

function PaymentTracking() {
  const [invoices, setInvoices] = useState([]);
  const [payments, setPayments] = useState([]);
  const [activeTab, setActiveTab] = useState('invoices');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSite, setFilterSite] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    // Sample invoices
    setInvoices([
      { id: 'INV-2024-001', tenant: 'Ahmet Yılmaz', unit: 'A Blok - Daire 5', site: 'Site A', amount: 850, dueDate: '2024-12-25', status: 'pending', issueDate: '2024-12-01', phone: '532 123 4567', email: 'ahmet@email.com' },
      { id: 'INV-2024-002', tenant: 'Mehmet Kaya', unit: 'A Blok - Daire 12', site: 'Site A', amount: 920, dueDate: '2024-12-20', status: 'overdue', issueDate: '2024-11-20', phone: '533 234 5678', email: 'mehmet@email.com' },
      { id: 'INV-2024-003', tenant: 'Ayşe Demir', unit: 'B Blok - Daire 3', site: 'Site A', amount: 780, dueDate: '2024-12-28', status: 'pending', issueDate: '2024-12-05', phone: '534 345 6789', email: 'ayse@email.com' },
      { id: 'INV-2024-004', tenant: 'Fatma Çelik', unit: 'C Blok - Daire 8', site: 'Site B', amount: 1050, dueDate: '2024-12-15', status: 'paid', paidDate: '2024-12-14', issueDate: '2024-11-15', phone: '535 456 7890', email: 'fatma@email.com' },
      { id: 'INV-2024-005', tenant: 'Ali Öztürk', unit: 'D Blok - Daire 2', site: 'Site B', amount: 680, dueDate: '2024-12-10', status: 'overdue', issueDate: '2024-11-10', phone: '536 567 8901', email: 'ali@email.com' },
      { id: 'INV-2024-006', tenant: 'Zeynep Arslan', unit: 'A Blok - Daire 15', site: 'Site A', amount: 890, dueDate: '2024-12-30', status: 'pending', issueDate: '2024-12-10', phone: '537 678 9012', email: 'zeynep@email.com' },
      { id: 'INV-2024-007', tenant: 'Can Yıldız', unit: 'E Blok - Daire 4', site: 'Site C', amount: 720, dueDate: '2024-12-18', status: 'paid', paidDate: '2024-12-17', issueDate: '2024-11-18', phone: '538 789 0123', email: 'can@email.com' },
    ]);

    // Sample recent payments
    setPayments([
      { id: 1, invoiceId: 'INV-2024-004', tenant: 'Fatma Çelik', amount: 1050, date: '2024-12-14', method: 'Havale', reference: 'HVL-123456' },
      { id: 2, invoiceId: 'INV-2024-007', tenant: 'Can Yıldız', amount: 720, date: '2024-12-17', method: 'Kredi Kartı', reference: 'CC-789012' },
      { id: 3, invoiceId: 'INV-2024-008', tenant: 'Deniz Koç', amount: 550, date: '2024-12-16', method: 'Nakit', reference: 'CASH-001' },
      { id: 4, invoiceId: 'INV-2024-009', tenant: 'Ece Şahin', amount: 680, date: '2024-12-15', method: 'Havale', reference: 'HVL-456789' },
    ]);
  };

  const stats = {
    totalInvoiced: invoices.reduce((sum, inv) => sum + inv.amount, 0),
    collected: invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0),
    pending: invoices.filter(inv => inv.status === 'pending').reduce((sum, inv) => sum + inv.amount, 0),
    overdue: invoices.filter(inv => inv.status === 'overdue').reduce((sum, inv) => sum + inv.amount, 0),
    collectionRate: Math.round((invoices.filter(inv => inv.status === 'paid').length / invoices.length) * 100)
  };

  const statusDistribution = [
    { name: 'Ödendi', value: invoices.filter(inv => inv.status === 'paid').length, color: '#10B981' },
    { name: 'Bekleyen', value: invoices.filter(inv => inv.status === 'pending').length, color: '#F59E0B' },
    { name: 'Gecikmiş', value: invoices.filter(inv => inv.status === 'overdue').length, color: '#EF4444' },
  ];

  const getStatusBadge = (status) => {
    switch(status) {
      case 'paid':
        return <span className="status-badge success"><CheckCircle size={14} /> Ödendi</span>;
      case 'pending':
        return <span className="status-badge warning"><Clock size={14} /> Bekliyor</span>;
      case 'overdue':
        return <span className="status-badge danger"><AlertTriangle size={14} /> Gecikmiş</span>;
      default:
        return <span className="status-badge">{status}</span>;
    }
  };

  const filteredInvoices = invoices.filter(inv => {
    const matchesSearch = inv.tenant.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         inv.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filterStatus || inv.status === filterStatus;
    const matchesSite = !filterSite || inv.site === filterSite;
    return matchesSearch && matchesStatus && matchesSite;
  });

  const sendReminder = (invoice) => {
    alert(`${invoice.tenant} kişisine ödeme hatırlatması gönderildi.`);
  };

  return (
    <div className="payment-page">
      <div className="page-header">
        <div className="header-title">
          <CreditCard size={28} />
          <div>
            <h1>Tahsilat Takibi</h1>
            <p className="subtitle">Fatura ve ödeme yönetimi</p>
          </div>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary">
            <Download size={18} />
            Rapor İndir
          </button>
          <button className="btn btn-primary">
            <Send size={18} />
            Toplu Hatırlatma
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="payment-stats-grid">
        <div className="payment-stat-card">
          <DollarSign size={24} />
          <div className="stat-info">
            <span className="stat-value">{stats.totalInvoiced.toLocaleString()} ₺</span>
            <span className="stat-label">Toplam Fatura</span>
          </div>
        </div>
        <div className="payment-stat-card success">
          <CheckCircle size={24} />
          <div className="stat-info">
            <span className="stat-value">{stats.collected.toLocaleString()} ₺</span>
            <span className="stat-label">Tahsil Edilen</span>
          </div>
        </div>
        <div className="payment-stat-card warning">
          <Clock size={24} />
          <div className="stat-info">
            <span className="stat-value">{stats.pending.toLocaleString()} ₺</span>
            <span className="stat-label">Bekleyen</span>
          </div>
        </div>
        <div className="payment-stat-card danger">
          <AlertTriangle size={24} />
          <div className="stat-info">
            <span className="stat-value">{stats.overdue.toLocaleString()} ₺</span>
            <span className="stat-label">Gecikmiş</span>
          </div>
        </div>
        <div className="payment-stat-card main">
          <TrendingUp size={24} />
          <div className="stat-info">
            <span className="stat-value">%{stats.collectionRate}</span>
            <span className="stat-label">Tahsilat Oranı</span>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="payment-charts-row">
        <div className="chart-card">
          <div className="chart-header">
            <PieChart size={20} />
            <h3>Fatura Durumu</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <RechartsPie>
              <Pie
                data={statusDistribution}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={70}
                label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
              >
                {statusDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </RechartsPie>
          </ResponsiveContainer>
        </div>

        <div className="chart-card">
          <div className="chart-header">
            <BarChart3 size={20} />
            <h3>Son Tahsilatlar</h3>
          </div>
          <div className="recent-payments-mini">
            {payments.slice(0, 4).map(payment => (
              <div key={payment.id} className="payment-mini-item">
                <div className="payment-info">
                  <span className="payment-tenant">{payment.tenant}</span>
                  <span className="payment-date">{payment.date}</span>
                </div>
                <span className="payment-amount">{payment.amount.toLocaleString()} ₺</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-container">
        <button
          className={`tab-btn ${activeTab === 'invoices' ? 'active' : ''}`}
          onClick={() => setActiveTab('invoices')}
        >
          <FileText size={18} />
          Faturalar
        </button>
        <button
          className={`tab-btn ${activeTab === 'payments' ? 'active' : ''}`}
          onClick={() => setActiveTab('payments')}
        >
          <CreditCard size={18} />
          Ödemeler
        </button>
        <button
          className={`tab-btn ${activeTab === 'overdue' ? 'active' : ''}`}
          onClick={() => setActiveTab('overdue')}
        >
          <AlertTriangle size={18} />
          Gecikmiş ({invoices.filter(inv => inv.status === 'overdue').length})
        </button>
      </div>

      {/* Invoices Tab */}
      {activeTab === 'invoices' && (
        <div className="content-card">
          <div className="card-toolbar">
            <div className="search-box">
              <Search size={18} />
              <input
                type="text"
                placeholder="Fatura veya kiracı ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">Tüm Durumlar</option>
              <option value="pending">Bekleyen</option>
              <option value="paid">Ödenen</option>
              <option value="overdue">Gecikmiş</option>
            </select>
            <select value={filterSite} onChange={e => setFilterSite(e.target.value)}>
              <option value="">Tüm Siteler</option>
              <option value="Site A">Site A</option>
              <option value="Site B">Site B</option>
              <option value="Site C">Site C</option>
            </select>
          </div>

          <div className="invoices-table">
            <table>
              <thead>
                <tr>
                  <th>Fatura No</th>
                  <th>Kiracı</th>
                  <th>Daire</th>
                  <th>Tutar</th>
                  <th>Son Ödeme</th>
                  <th>Durum</th>
                  <th>İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map(invoice => (
                  <tr key={invoice.id} className={invoice.status === 'overdue' ? 'overdue-row' : ''}>
                    <td><strong>{invoice.id}</strong></td>
                    <td>
                      <div className="tenant-cell">
                        <User size={14} />
                        <span>{invoice.tenant}</span>
                      </div>
                    </td>
                    <td>
                      <div className="unit-cell">
                        <Building2 size={14} />
                        <span>{invoice.unit}</span>
                      </div>
                    </td>
                    <td><strong>{invoice.amount.toLocaleString()} ₺</strong></td>
                    <td>
                      <div className="date-cell">
                        <Calendar size={14} />
                        {invoice.dueDate}
                      </div>
                    </td>
                    <td>{getStatusBadge(invoice.status)}</td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-icon" title="Detay" onClick={() => setSelectedInvoice(invoice)}>
                          <FileText size={16} />
                        </button>
                        {invoice.status !== 'paid' && (
                          <>
                            <button className="btn-icon" title="Hatırlatma Gönder" onClick={() => sendReminder(invoice)}>
                              <Bell size={16} />
                            </button>
                            <button className="btn-icon success" title="Ödeme Al">
                              <CheckCircle size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Payments Tab */}
      {activeTab === 'payments' && (
        <div className="content-card">
          <div className="payments-list">
            {payments.map(payment => (
              <div key={payment.id} className="payment-item">
                <div className="payment-icon">
                  <CheckCircle size={20} />
                </div>
                <div className="payment-details">
                  <div className="payment-main">
                    <span className="payment-tenant">{payment.tenant}</span>
                    <span className="payment-ref">Ref: {payment.reference}</span>
                  </div>
                  <div className="payment-meta">
                    <span>{payment.invoiceId}</span>
                    <span>{payment.method}</span>
                    <span>{payment.date}</span>
                  </div>
                </div>
                <div className="payment-amount success">
                  +{payment.amount.toLocaleString()} ₺
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Overdue Tab */}
      {activeTab === 'overdue' && (
        <div className="overdue-section">
          {invoices.filter(inv => inv.status === 'overdue').map(invoice => (
            <div key={invoice.id} className="overdue-card">
              <div className="overdue-header">
                <AlertTriangle size={20} />
                <span className="days-overdue">
                  {Math.floor((new Date() - new Date(invoice.dueDate)) / (1000 * 60 * 60 * 24))} gün gecikmiş
                </span>
              </div>
              <div className="overdue-content">
                <div className="overdue-info">
                  <h3>{invoice.tenant}</h3>
                  <p>{invoice.unit}</p>
                  <p className="invoice-id">{invoice.id}</p>
                </div>
                <div className="overdue-amount">
                  <span className="amount">{invoice.amount.toLocaleString()} ₺</span>
                  <span className="due-date">Son ödeme: {invoice.dueDate}</span>
                </div>
              </div>
              <div className="overdue-actions">
                <button className="btn btn-outline" onClick={() => window.location.href = `tel:${invoice.phone}`}>
                  <Phone size={16} /> Ara
                </button>
                <button className="btn btn-outline" onClick={() => window.location.href = `mailto:${invoice.email}`}>
                  <Mail size={16} /> E-posta
                </button>
                <button className="btn btn-primary" onClick={() => sendReminder(invoice)}>
                  <Send size={16} /> Hatırlatma
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Invoice Detail Modal */}
      {selectedInvoice && (
        <div className="modal-overlay" onClick={() => setSelectedInvoice(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2><FileText size={20} /> Fatura Detayı</h2>
              <button className="close-btn" onClick={() => setSelectedInvoice(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="invoice-detail-header">
                <div className="invoice-id-large">{selectedInvoice.id}</div>
                {getStatusBadge(selectedInvoice.status)}
              </div>

              <div className="invoice-detail-grid">
                <div className="detail-item">
                  <User size={16} />
                  <div>
                    <span className="label">Kiracı</span>
                    <span className="value">{selectedInvoice.tenant}</span>
                  </div>
                </div>
                <div className="detail-item">
                  <Building2 size={16} />
                  <div>
                    <span className="label">Daire</span>
                    <span className="value">{selectedInvoice.unit}</span>
                  </div>
                </div>
                <div className="detail-item">
                  <Phone size={16} />
                  <div>
                    <span className="label">Telefon</span>
                    <span className="value">{selectedInvoice.phone}</span>
                  </div>
                </div>
                <div className="detail-item">
                  <Mail size={16} />
                  <div>
                    <span className="label">E-posta</span>
                    <span className="value">{selectedInvoice.email}</span>
                  </div>
                </div>
                <div className="detail-item">
                  <Calendar size={16} />
                  <div>
                    <span className="label">Fatura Tarihi</span>
                    <span className="value">{selectedInvoice.issueDate}</span>
                  </div>
                </div>
                <div className="detail-item">
                  <Clock size={16} />
                  <div>
                    <span className="label">Son Ödeme</span>
                    <span className="value">{selectedInvoice.dueDate}</span>
                  </div>
                </div>
              </div>

              <div className="invoice-amount-section">
                <span className="label">Tutar</span>
                <span className="amount">{selectedInvoice.amount.toLocaleString()} ₺</span>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedInvoice(null)}>Kapat</button>
              {selectedInvoice.status !== 'paid' && (
                <button className="btn btn-primary">
                  <CheckCircle size={16} /> Ödeme Al
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PaymentTracking;
