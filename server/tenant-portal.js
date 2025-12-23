/**
 * Kiracı Portalı Backend API
 * Tenant Portal - Merkezi Isıtma Sistemi
 *
 * Bu API kiracıların kendi tüketim verilerini, faturalarını ve
 * ödeme durumlarını görüntüleyebilmeleri için tasarlanmıştır.
 */

import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const router = express.Router();

// JWT Secret (production'da environment variable olmalı)
const JWT_SECRET = process.env.TENANT_JWT_SECRET || 'tenant-portal-secret-key-2024';

// Demo kiracı verileri (production'da veritabanından gelecek)
const tenants = [
  {
    id: 1,
    email: 'ahmet@email.com',
    password: '$2a$10$rQo9YQrU3xUZPQ1fvBLYH.5rVn0Fo9BFKM1n9TQ9L7uX5VZ1OJFOO', // password: 123456
    name: 'Ahmet Yılmaz',
    phone: '0532 123 4567',
    apartment: 'A-12',
    building: 'Blok A',
    site: 'Merkez Site',
    meterId: 'USM-20240001',
    contractStart: '2023-01-01',
    contractEnd: '2025-12-31',
    active: true
  },
  {
    id: 2,
    email: 'mehmet@email.com',
    password: '$2a$10$rQo9YQrU3xUZPQ1fvBLYH.5rVn0Fo9BFKM1n9TQ9L7uX5VZ1OJFOO',
    name: 'Mehmet Demir',
    phone: '0533 234 5678',
    apartment: 'B-5',
    building: 'Blok B',
    site: 'Merkez Site',
    meterId: 'USM-20240002',
    contractStart: '2022-09-01',
    contractEnd: '2024-08-31',
    active: true
  },
  {
    id: 3,
    email: 'ayse@email.com',
    password: '$2a$10$rQo9YQrU3xUZPQ1fvBLYH.5rVn0Fo9BFKM1n9TQ9L7uX5VZ1OJFOO',
    name: 'Ayşe Kaya',
    phone: '0535 345 6789',
    apartment: 'C-8',
    building: 'Blok C',
    site: 'Batı Konutları',
    meterId: 'USM-20240003',
    contractStart: '2024-01-01',
    contractEnd: '2026-12-31',
    active: true
  }
];

// Demo fatura verileri
const bills = [
  { id: 1, tenantId: 1, month: 'Aralık 2024', amount: 1850.50, energy: 245.6, dueDate: '2025-01-15', status: 'unpaid' },
  { id: 2, tenantId: 1, month: 'Kasım 2024', amount: 1620.00, energy: 215.2, dueDate: '2024-12-15', status: 'paid', paidDate: '2024-12-10' },
  { id: 3, tenantId: 1, month: 'Ekim 2024', amount: 980.25, energy: 130.5, dueDate: '2024-11-15', status: 'paid', paidDate: '2024-11-08' },
  { id: 4, tenantId: 2, month: 'Aralık 2024', amount: 2100.00, energy: 280.0, dueDate: '2025-01-15', status: 'unpaid' },
  { id: 5, tenantId: 2, month: 'Kasım 2024', amount: 1890.50, energy: 252.3, dueDate: '2024-12-15', status: 'overdue' },
  { id: 6, tenantId: 3, month: 'Aralık 2024', amount: 1450.75, energy: 193.4, dueDate: '2025-01-15', status: 'unpaid' }
];

// Demo tüketim verileri
const consumptionHistory = [
  // Tenant 1 - Son 12 ay
  { tenantId: 1, month: '2024-12', energy: 245.6, volume: 32.5, avgTemp: 72.5, avgDelta: 24.2 },
  { tenantId: 1, month: '2024-11', energy: 215.2, volume: 28.6, avgTemp: 71.8, avgDelta: 23.5 },
  { tenantId: 1, month: '2024-10', energy: 130.5, volume: 17.4, avgTemp: 68.2, avgDelta: 20.1 },
  { tenantId: 1, month: '2024-09', energy: 45.2, volume: 6.0, avgTemp: 55.0, avgDelta: 12.5 },
  { tenantId: 1, month: '2024-08', energy: 0, volume: 0, avgTemp: 0, avgDelta: 0 },
  { tenantId: 1, month: '2024-07', energy: 0, volume: 0, avgTemp: 0, avgDelta: 0 },
  { tenantId: 1, month: '2024-06', energy: 0, volume: 0, avgTemp: 0, avgDelta: 0 },
  { tenantId: 1, month: '2024-05', energy: 0, volume: 0, avgTemp: 0, avgDelta: 0 },
  { tenantId: 1, month: '2024-04', energy: 85.6, volume: 11.4, avgTemp: 62.0, avgDelta: 18.2 },
  { tenantId: 1, month: '2024-03', energy: 185.4, volume: 24.7, avgTemp: 70.5, avgDelta: 22.8 },
  { tenantId: 1, month: '2024-02', energy: 256.8, volume: 34.2, avgTemp: 74.2, avgDelta: 25.1 },
  { tenantId: 1, month: '2024-01', energy: 278.5, volume: 37.1, avgTemp: 75.0, avgDelta: 26.0 },
  // Tenant 2 - Son 12 ay
  { tenantId: 2, month: '2024-12', energy: 280.0, volume: 37.3, avgTemp: 73.5, avgDelta: 25.0 },
  { tenantId: 2, month: '2024-11', energy: 252.3, volume: 33.6, avgTemp: 72.0, avgDelta: 24.0 },
  { tenantId: 2, month: '2024-10', energy: 165.8, volume: 22.1, avgTemp: 69.5, avgDelta: 21.5 },
  // Tenant 3
  { tenantId: 3, month: '2024-12', energy: 193.4, volume: 25.8, avgTemp: 71.0, avgDelta: 23.0 },
  { tenantId: 3, month: '2024-11', energy: 175.5, volume: 23.4, avgTemp: 70.5, avgDelta: 22.5 }
];

// Demo anlık okuma verileri
const currentReadings = {
  1: { energy: 4526.85, volume: 602.5, inletTemp: 73.2, outletTemp: 49.1, deltaT: 24.1, flowRate: 125.5, power: 3.52, lastRead: new Date() },
  2: { energy: 5842.30, volume: 778.2, inletTemp: 74.5, outletTemp: 49.8, deltaT: 24.7, flowRate: 142.3, power: 4.08, lastRead: new Date() },
  3: { energy: 3215.60, volume: 428.4, inletTemp: 72.8, outletTemp: 48.5, deltaT: 24.3, flowRate: 118.6, power: 3.35, lastRead: new Date() }
};

// Demo duyuru verileri
const announcements = [
  {
    id: 1,
    title: 'Kış Dönemi Isıtma Sistemi Bakımı',
    content: 'Değerli sakinlerimiz, 15 Ocak 2025 tarihinde saat 10:00-14:00 arasında merkezi ısıtma sistemi periyodik bakımı yapılacaktır. Bu süre zarfında ısıtma sistemi geçici olarak devre dışı kalacaktır.',
    date: '2024-12-20',
    important: true
  },
  {
    id: 2,
    title: 'Aralık Ayı Fatura Dönemi',
    content: 'Aralık ayı tüketim faturaları sistem üzerinden görüntülenebilir. Son ödeme tarihi 15 Ocak 2025\'tir.',
    date: '2024-12-18',
    important: false
  },
  {
    id: 3,
    title: 'Enerji Tasarrufu Önerileri',
    content: 'Kış aylarında enerji tasarrufu için radyatörlerinizin önünü kapatmayın, perdeleri gece kapalı tutun ve termostat ayarlarınızı 20-22°C arasında tutun.',
    date: '2024-12-10',
    important: false
  }
];

// Middleware: Token doğrulama
const authenticateTenant = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Yetkilendirme gerekli' });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.tenant = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Geçersiz veya süresi dolmuş token' });
  }
};

// ==========================================
// PUBLIC ENDPOINTS
// ==========================================

/**
 * Kiracı Girişi
 * POST /api/tenant/login
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'E-posta ve şifre gerekli' });
    }

    // Kiracıyı bul
    const tenant = tenants.find(t => t.email.toLowerCase() === email.toLowerCase());

    if (!tenant) {
      return res.status(401).json({ error: 'E-posta veya şifre hatalı' });
    }

    // Şifre kontrolü
    const isValid = await bcrypt.compare(password, tenant.password);

    if (!isValid) {
      // Demo için: şifre 123456 ise kabul et
      if (password !== '123456') {
        return res.status(401).json({ error: 'E-posta veya şifre hatalı' });
      }
    }

    if (!tenant.active) {
      return res.status(403).json({ error: 'Hesabınız devre dışı' });
    }

    // JWT token oluştur
    const token = jwt.sign(
      {
        id: tenant.id,
        email: tenant.email,
        name: tenant.name,
        apartment: tenant.apartment,
        site: tenant.site
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      token,
      tenant: {
        id: tenant.id,
        name: tenant.name,
        email: tenant.email,
        phone: tenant.phone,
        apartment: tenant.apartment,
        building: tenant.building,
        site: tenant.site,
        meterId: tenant.meterId
      }
    });

  } catch (err) {
    console.error('Tenant login error:', err);
    res.status(500).json({ error: 'Giriş işlemi başarısız' });
  }
});

/**
 * Duyuruları listele (public)
 * GET /api/tenant/announcements
 */
router.get('/announcements', (req, res) => {
  res.json(announcements);
});

// ==========================================
// PROTECTED ENDPOINTS (Giriş gerekli)
// ==========================================

/**
 * Kiracı profili
 * GET /api/tenant/profile
 */
router.get('/profile', authenticateTenant, (req, res) => {
  const tenant = tenants.find(t => t.id === req.tenant.id);

  if (!tenant) {
    return res.status(404).json({ error: 'Kiracı bulunamadı' });
  }

  res.json({
    id: tenant.id,
    name: tenant.name,
    email: tenant.email,
    phone: tenant.phone,
    apartment: tenant.apartment,
    building: tenant.building,
    site: tenant.site,
    meterId: tenant.meterId,
    contractStart: tenant.contractStart,
    contractEnd: tenant.contractEnd
  });
});

/**
 * Anlık sayaç okuması
 * GET /api/tenant/meter/current
 */
router.get('/meter/current', authenticateTenant, (req, res) => {
  const tenantId = req.tenant.id;
  const reading = currentReadings[tenantId];

  if (!reading) {
    return res.status(404).json({ error: 'Sayaç verisi bulunamadı' });
  }

  const tenant = tenants.find(t => t.id === tenantId);

  res.json({
    meterId: tenant?.meterId || '-',
    apartment: tenant?.apartment || '-',
    building: tenant?.building || '-',
    ...reading,
    lastRead: reading.lastRead.toISOString()
  });
});

/**
 * Tüketim geçmişi
 * GET /api/tenant/consumption
 */
router.get('/consumption', authenticateTenant, (req, res) => {
  const tenantId = req.tenant.id;
  const history = consumptionHistory.filter(c => c.tenantId === tenantId);

  // Aylık tüketime göre sırala (en yeni önce)
  history.sort((a, b) => b.month.localeCompare(a.month));

  res.json({
    tenantId,
    history
  });
});

/**
 * Faturalar
 * GET /api/tenant/bills
 */
router.get('/bills', authenticateTenant, (req, res) => {
  const tenantId = req.tenant.id;
  const tenantBills = bills.filter(b => b.tenantId === tenantId);

  res.json(tenantBills);
});

/**
 * Fatura detayı
 * GET /api/tenant/bills/:billId
 */
router.get('/bills/:billId', authenticateTenant, (req, res) => {
  const tenantId = req.tenant.id;
  const billId = parseInt(req.params.billId);

  const bill = bills.find(b => b.id === billId && b.tenantId === tenantId);

  if (!bill) {
    return res.status(404).json({ error: 'Fatura bulunamadı' });
  }

  const tenant = tenants.find(t => t.id === tenantId);

  res.json({
    ...bill,
    tenant: {
      name: tenant?.name,
      apartment: tenant?.apartment,
      building: tenant?.building,
      site: tenant?.site,
      meterId: tenant?.meterId
    }
  });
});

/**
 * Ödeme özeti
 * GET /api/tenant/payment-summary
 */
router.get('/payment-summary', authenticateTenant, (req, res) => {
  const tenantId = req.tenant.id;
  const tenantBills = bills.filter(b => b.tenantId === tenantId);

  const unpaid = tenantBills.filter(b => b.status === 'unpaid');
  const overdue = tenantBills.filter(b => b.status === 'overdue');
  const paid = tenantBills.filter(b => b.status === 'paid');

  const totalUnpaid = unpaid.reduce((sum, b) => sum + b.amount, 0);
  const totalOverdue = overdue.reduce((sum, b) => sum + b.amount, 0);
  const totalPaid = paid.reduce((sum, b) => sum + b.amount, 0);

  res.json({
    totalUnpaid: totalUnpaid + totalOverdue,
    unpaidCount: unpaid.length + overdue.length,
    overdueAmount: totalOverdue,
    overdueCount: overdue.length,
    totalPaid,
    paidCount: paid.length,
    nextDueDate: unpaid[0]?.dueDate || null
  });
});

/**
 * Yıllık tüketim özeti
 * GET /api/tenant/consumption/yearly
 */
router.get('/consumption/yearly', authenticateTenant, (req, res) => {
  const tenantId = req.tenant.id;
  const history = consumptionHistory.filter(c => c.tenantId === tenantId);

  const totalEnergy = history.reduce((sum, c) => sum + c.energy, 0);
  const totalVolume = history.reduce((sum, c) => sum + c.volume, 0);
  const avgEnergy = totalEnergy / 12;

  // Aylık karşılaştırma için
  const currentMonth = history[0];
  const lastMonth = history[1];

  let energyChange = 0;
  if (lastMonth && lastMonth.energy > 0) {
    energyChange = ((currentMonth?.energy || 0) - lastMonth.energy) / lastMonth.energy * 100;
  }

  res.json({
    totalEnergy: totalEnergy.toFixed(2),
    totalVolume: totalVolume.toFixed(2),
    averageMonthly: avgEnergy.toFixed(2),
    currentMonth: currentMonth?.energy || 0,
    lastMonth: lastMonth?.energy || 0,
    energyChange: energyChange.toFixed(1),
    history: history.slice(0, 12)
  });
});

/**
 * Destek talebi gönder
 * POST /api/tenant/support
 */
router.post('/support', authenticateTenant, (req, res) => {
  const { subject, message, category } = req.body;
  const tenantId = req.tenant.id;
  const tenant = tenants.find(t => t.id === tenantId);

  if (!subject || !message) {
    return res.status(400).json({ error: 'Konu ve mesaj gerekli' });
  }

  // Demo - talep kaydedildi varsay
  const ticketId = 'TKT-' + Date.now();

  console.log('Yeni destek talebi:', {
    ticketId,
    tenantId,
    tenantName: tenant?.name,
    apartment: tenant?.apartment,
    subject,
    message,
    category: category || 'general',
    date: new Date().toISOString()
  });

  res.json({
    success: true,
    ticketId,
    message: 'Talebiniz başarıyla kaydedildi. En kısa sürede size dönüş yapılacaktır.'
  });
});

/**
 * Şifre değiştir
 * POST /api/tenant/change-password
 */
router.post('/change-password', authenticateTenant, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const tenantId = req.tenant.id;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Mevcut ve yeni şifre gerekli' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Yeni şifre en az 6 karakter olmalı' });
  }

  const tenant = tenants.find(t => t.id === tenantId);

  if (!tenant) {
    return res.status(404).json({ error: 'Kiracı bulunamadı' });
  }

  // Demo: mevcut şifre kontrolü
  if (currentPassword !== '123456') {
    return res.status(401).json({ error: 'Mevcut şifre hatalı' });
  }

  // Demo - şifre değiştirildi varsay
  console.log(`Şifre değiştirildi: Tenant ${tenantId}`);

  res.json({
    success: true,
    message: 'Şifreniz başarıyla değiştirildi'
  });
});

/**
 * Karşılaştırma - Ortalama ile
 * GET /api/tenant/comparison
 */
router.get('/comparison', authenticateTenant, (req, res) => {
  const tenantId = req.tenant.id;
  const tenant = tenants.find(t => t.id === tenantId);
  const tenantHistory = consumptionHistory.filter(c => c.tenantId === tenantId);

  // Mevcut ay tüketimi
  const currentConsumption = tenantHistory[0]?.energy || 0;

  // Site ortalaması hesapla (tüm kiracılar)
  const allCurrentMonth = consumptionHistory.filter(c => c.month === tenantHistory[0]?.month);
  const siteAverage = allCurrentMonth.length > 0
    ? allCurrentMonth.reduce((sum, c) => sum + c.energy, 0) / allCurrentMonth.length
    : 0;

  // Aynı tip dairelerin ortalaması (demo: tüm sitelerden)
  const similarAverage = siteAverage * 0.95; // Demo varsayım

  // Karşılaştırma yüzdeleri
  const vsAverage = siteAverage > 0
    ? ((currentConsumption - siteAverage) / siteAverage * 100).toFixed(1)
    : 0;

  res.json({
    yourConsumption: currentConsumption,
    siteAverage: siteAverage.toFixed(2),
    similarApartments: similarAverage.toFixed(2),
    percentVsAverage: parseFloat(vsAverage),
    rating: parseFloat(vsAverage) < -10 ? 'excellent'
          : parseFloat(vsAverage) < 10 ? 'normal'
          : 'high',
    tips: [
      'Termostat ayarınızı 20°C\'ye ayarlayın',
      'Radyatör vanalarını tam açık tutmayın, 3-4 arasında ayarlayın',
      'Gece perdeleri kapalı tutun'
    ]
  });
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'tenant-portal',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

export default router;
