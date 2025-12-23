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

      const [invoicesRes, paymentsRes] = await Promise.all([
        fetch('/api/invoices'),
        fetch('/api/payments?limit=50')
      ]);

      const invoicesData = await safeJson(invoicesRes);
      const paymentsData = await safeJson(paymentsRes);

      if (invoicesData) {
        setInvoices(invoicesData.invoices || invoicesData || []);
      } else {
        // Demo data
        setInvoices([
          { id: 1, invoiceNo: 'FTR-2024-001', tenant: 'Ali Yılmaz', site: 'Merkez Site', building: 'A Blok', unit: 'D5', amount: 1250, dueDate: '2024-12-15', status: 'paid', paidAt: '2024-12-10' },
          { id: 2, invoiceNo: 'FTR-2024-002', tenant: 'Ayşe Demir', site: 'Merkez Site', building: 'B Blok', unit: 'D12', amount: 980, dueDate: '2024-12-20', status: 'pending' },
          { id: 3, invoiceNo: 'FTR-2024-003', tenant: 'Mehmet Kaya', site: 'Kuzey Site', building: 'A Blok', unit: 'D3', amount: 1450, dueDate: '2024-12-01', status: 'overdue' }
        ]);
      }

      if (paymentsData) {
        setPayments(paymentsData.payments || paymentsData || []);
      } else {
        setPayments([
          { id: 1, invoiceNo: 'FTR-2024-001', tenant: 'Ali Yılmaz', amount: 1250, date: '2024-12-10', method: 'Havale' },
          { id: 2, invoiceNo: 'FTR-2024-004', tenant: 'Fatma Öz', amount: 890, date: '2024-12-08', method: 'Kredi Kartı' }
        ]);
      }

    } catch (err) {
      console.error('Load data error:', err);
      setInvoices([]);
      setPayments([]);
    } finally {
      setLoading(false);
    }
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

  // Unique sites from invoices
  const sites = [...new Set(invoices.map(inv => inv.site).filter(Boolean))];

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
              {sites.map(site => (
                <option key={site} value={site}>{site}</option>
              ))}
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
