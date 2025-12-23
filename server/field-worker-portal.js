/**
 * Teknik Servis / Saha Personeli Portal Backend API
 * Field Worker Portal - Merkezi Isıtma Sistemi
 *
 * Bu API saha teknikerlerinin iş emirlerini, sayaç okumalarını ve
 * bakım işlemlerini yönetebilmeleri için tasarlanmıştır.
 */

import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const router = express.Router();

// JWT Secret
const JWT_SECRET = process.env.FIELD_JWT_SECRET || 'field-worker-portal-secret-2024';

// Demo saha personeli verileri
const fieldWorkers = [
  {
    id: 1,
    username: 'tekniker1',
    password: '$2a$10$rQo9YQrU3xUZPQ1fvBLYH.5rVn0Fo9BFKM1n9TQ9L7uX5VZ1OJFOO', // 123456
    name: 'Ali Yıldız',
    phone: '0532 111 2233',
    role: 'technician',
    specialization: 'meter_reading',
    region: 'İstanbul - Anadolu',
    active: true,
    vehiclePlate: '34 ABC 123',
    photo: null
  },
  {
    id: 2,
    username: 'tekniker2',
    password: '$2a$10$rQo9YQrU3xUZPQ1fvBLYH.5rVn0Fo9BFKM1n9TQ9L7uX5VZ1OJFOO',
    name: 'Mehmet Kara',
    phone: '0533 222 3344',
    role: 'senior_technician',
    specialization: 'maintenance',
    region: 'İstanbul - Avrupa',
    active: true,
    vehiclePlate: '34 DEF 456',
    photo: null
  },
  {
    id: 3,
    username: 'supervisor1',
    password: '$2a$10$rQo9YQrU3xUZPQ1fvBLYH.5rVn0Fo9BFKM1n9TQ9L7uX5VZ1OJFOO',
    name: 'Hasan Şahin',
    phone: '0535 333 4455',
    role: 'supervisor',
    specialization: 'all',
    region: 'İstanbul',
    active: true,
    vehiclePlate: '34 GHI 789',
    photo: null
  }
];

// Demo iş emirleri
let workOrders = [
  {
    id: 1,
    type: 'meter_reading',
    priority: 'normal',
    status: 'assigned',
    assignedTo: 1,
    assignedDate: '2024-12-23T08:00:00',
    site: 'Merkez Site',
    building: 'Blok A',
    address: 'Merkez Mah. Site Cad. No:1, Kadıköy/İstanbul',
    lat: 40.9910,
    lng: 29.0229,
    meterCount: 24,
    description: 'Aylık rutin sayaç okuma',
    notes: '',
    createdAt: '2024-12-22T14:30:00',
    completedAt: null,
    readings: []
  },
  {
    id: 2,
    type: 'maintenance',
    priority: 'high',
    status: 'in_progress',
    assignedTo: 2,
    assignedDate: '2024-12-23T09:00:00',
    site: 'Batı Konutları',
    building: 'Blok C',
    apartment: 'C-8',
    address: 'Batı Mah. Konut Sok. No:15, Beşiktaş/İstanbul',
    lat: 41.0422,
    lng: 29.0083,
    meterCount: 1,
    meterId: 'USM-20240003',
    description: 'Sayaç arıza - Sıcaklık sensörü hatası',
    notes: 'Müşteri sabah erken saatler için randevu istedi',
    createdAt: '2024-12-22T16:45:00',
    completedAt: null,
    errorCode: 'T_ERR_SENSOR',
    readings: []
  },
  {
    id: 3,
    type: 'installation',
    priority: 'normal',
    status: 'pending',
    assignedTo: 2,
    assignedDate: '2024-12-24T10:00:00',
    site: 'Doğu Rezidans',
    building: 'Blok D',
    apartment: 'D-12',
    address: 'Doğu Mah. Rezidans Cad. No:22, Şişli/İstanbul',
    lat: 41.0602,
    lng: 28.9877,
    meterCount: 1,
    description: 'Yeni sayaç kurulumu',
    notes: 'Yeni taşınan daire, su ve elektrik hazır',
    createdAt: '2024-12-21T11:00:00',
    completedAt: null,
    readings: []
  },
  {
    id: 4,
    type: 'meter_reading',
    priority: 'low',
    status: 'completed',
    assignedTo: 1,
    assignedDate: '2024-12-22T08:00:00',
    site: 'Kuzey Park',
    building: 'Blok B',
    address: 'Kuzey Mah. Park Sok. No:5, Ümraniye/İstanbul',
    lat: 41.0266,
    lng: 29.1026,
    meterCount: 18,
    description: 'Aylık rutin sayaç okuma',
    notes: '',
    createdAt: '2024-12-21T09:00:00',
    completedAt: '2024-12-22T12:30:00',
    readings: [
      { meterId: 'USM-20240010', energy: 1256.80, volume: 167.5, inletTemp: 72.5, outletTemp: 48.2 },
      { meterId: 'USM-20240011', energy: 1089.50, volume: 145.2, inletTemp: 71.8, outletTemp: 47.9 }
      // ... diğer okumalar
    ]
  },
  {
    id: 5,
    type: 'inspection',
    priority: 'normal',
    status: 'assigned',
    assignedTo: 3,
    assignedDate: '2024-12-23T14:00:00',
    site: 'Merkez Site',
    building: 'Tüm Bloklar',
    address: 'Merkez Mah. Site Cad. No:1, Kadıköy/İstanbul',
    lat: 40.9910,
    lng: 29.0229,
    meterCount: 0,
    description: 'Merkezi kazan dairesi denetimi',
    notes: 'Yıllık periyodik kontrol',
    createdAt: '2024-12-20T10:00:00',
    completedAt: null,
    readings: []
  }
];

// Demo malzeme stoku
const inventory = [
  { id: 1, code: 'USM-DN15', name: 'Ultrasonik Isı Sayacı DN15', stock: 45, unit: 'adet' },
  { id: 2, code: 'USM-DN20', name: 'Ultrasonik Isı Sayacı DN20', stock: 32, unit: 'adet' },
  { id: 3, code: 'USM-DN25', name: 'Ultrasonik Isı Sayacı DN25', stock: 18, unit: 'adet' },
  { id: 4, code: 'PT1000', name: 'PT1000 Sıcaklık Sensörü', stock: 120, unit: 'adet' },
  { id: 5, code: 'VANA-DN15', name: 'Küresel Vana DN15', stock: 85, unit: 'adet' },
  { id: 6, code: 'VANA-DN20', name: 'Küresel Vana DN20', stock: 62, unit: 'adet' },
  { id: 7, code: 'FITING-SET', name: 'Bağlantı Seti (Rekor, Conta)', stock: 200, unit: 'set' },
  { id: 8, code: 'KABLO-2M', name: 'Sensör Kablosu 2m', stock: 150, unit: 'adet' }
];

// Demo mesaj/duyuru verileri
const messages = [
  {
    id: 1,
    from: 'Sistem',
    subject: 'Yeni İş Emri Atandı',
    message: 'Merkez Site Blok A için sayaç okuma görevi atandı.',
    date: '2024-12-22T14:30:00',
    read: true,
    type: 'assignment'
  },
  {
    id: 2,
    from: 'Yönetim',
    subject: 'Kış Dönemi Önlemleri',
    message: 'Saha çalışmalarında don önlemi alınması ve araç kontrollerinin yapılması gerekmektedir.',
    date: '2024-12-20T09:00:00',
    read: false,
    type: 'announcement'
  },
  {
    id: 3,
    from: 'Depo',
    subject: 'Malzeme Talebi Onaylandı',
    message: '5 adet DN20 sayaç talebi onaylandı, depoda hazır.',
    date: '2024-12-19T11:30:00',
    read: true,
    type: 'inventory'
  }
];

// Middleware: Token doğrulama
const authenticateWorker = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Yetkilendirme gerekli' });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.worker = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Geçersiz veya süresi dolmuş token' });
  }
};

// Sadece supervisor erişimi
const supervisorOnly = (req, res, next) => {
  if (req.worker.role !== 'supervisor') {
    return res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
  }
  next();
};

// ==========================================
// PUBLIC ENDPOINTS
// ==========================================

/**
 * Personel Girişi
 * POST /api/field/login
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Kullanıcı adı ve şifre gerekli' });
    }

    const worker = fieldWorkers.find(w => w.username.toLowerCase() === username.toLowerCase());

    if (!worker) {
      return res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı' });
    }

    // Demo: şifre 123456 kabul
    if (password !== '123456') {
      return res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı' });
    }

    if (!worker.active) {
      return res.status(403).json({ error: 'Hesabınız devre dışı' });
    }

    const token = jwt.sign(
      {
        id: worker.id,
        username: worker.username,
        name: worker.name,
        role: worker.role,
        region: worker.region
      },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.json({
      success: true,
      token,
      worker: {
        id: worker.id,
        name: worker.name,
        username: worker.username,
        phone: worker.phone,
        role: worker.role,
        specialization: worker.specialization,
        region: worker.region,
        vehiclePlate: worker.vehiclePlate
      }
    });

  } catch (err) {
    console.error('Worker login error:', err);
    res.status(500).json({ error: 'Giriş işlemi başarısız' });
  }
});

// ==========================================
// PROTECTED ENDPOINTS
// ==========================================

/**
 * Personel profili
 * GET /api/field/profile
 */
router.get('/profile', authenticateWorker, (req, res) => {
  const worker = fieldWorkers.find(w => w.id === req.worker.id);

  if (!worker) {
    return res.status(404).json({ error: 'Personel bulunamadı' });
  }

  res.json({
    id: worker.id,
    name: worker.name,
    username: worker.username,
    phone: worker.phone,
    role: worker.role,
    specialization: worker.specialization,
    region: worker.region,
    vehiclePlate: worker.vehiclePlate,
    active: worker.active
  });
});

/**
 * Atanan iş emirleri
 * GET /api/field/work-orders
 */
router.get('/work-orders', authenticateWorker, (req, res) => {
  const workerId = req.worker.id;
  const { status, type } = req.query;

  let orders = workOrders.filter(o => o.assignedTo === workerId);

  if (status) {
    orders = orders.filter(o => o.status === status);
  }

  if (type) {
    orders = orders.filter(o => o.type === type);
  }

  // Öncelik ve tarih sırasına göre sırala
  const priorityOrder = { high: 0, normal: 1, low: 2 };
  orders.sort((a, b) => {
    if (a.status === 'completed' && b.status !== 'completed') return 1;
    if (a.status !== 'completed' && b.status === 'completed') return -1;
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return new Date(a.assignedDate) - new Date(b.assignedDate);
  });

  res.json(orders);
});

/**
 * İş emri detayı
 * GET /api/field/work-orders/:id
 */
router.get('/work-orders/:id', authenticateWorker, (req, res) => {
  const workerId = req.worker.id;
  const orderId = parseInt(req.params.id);

  const order = workOrders.find(o => o.id === orderId);

  if (!order) {
    return res.status(404).json({ error: 'İş emri bulunamadı' });
  }

  // Supervisor tüm emirleri görebilir
  if (req.worker.role !== 'supervisor' && order.assignedTo !== workerId) {
    return res.status(403).json({ error: 'Bu iş emrine erişim yetkiniz yok' });
  }

  res.json(order);
});

/**
 * İş emri durumu güncelle
 * PATCH /api/field/work-orders/:id/status
 */
router.patch('/work-orders/:id/status', authenticateWorker, (req, res) => {
  const workerId = req.worker.id;
  const orderId = parseInt(req.params.id);
  const { status, notes } = req.body;

  const orderIndex = workOrders.findIndex(o => o.id === orderId);

  if (orderIndex === -1) {
    return res.status(404).json({ error: 'İş emri bulunamadı' });
  }

  const order = workOrders[orderIndex];

  if (req.worker.role !== 'supervisor' && order.assignedTo !== workerId) {
    return res.status(403).json({ error: 'Bu iş emrini güncelleme yetkiniz yok' });
  }

  const validStatuses = ['pending', 'assigned', 'in_progress', 'completed', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Geçersiz durum' });
  }

  workOrders[orderIndex].status = status;

  if (notes) {
    workOrders[orderIndex].notes = notes;
  }

  if (status === 'completed') {
    workOrders[orderIndex].completedAt = new Date().toISOString();
  }

  res.json({
    success: true,
    message: 'İş emri güncellendi',
    order: workOrders[orderIndex]
  });
});

/**
 * Sayaç okuma kaydet
 * POST /api/field/work-orders/:id/readings
 */
router.post('/work-orders/:id/readings', authenticateWorker, (req, res) => {
  const workerId = req.worker.id;
  const orderId = parseInt(req.params.id);
  const { readings } = req.body;

  const orderIndex = workOrders.findIndex(o => o.id === orderId);

  if (orderIndex === -1) {
    return res.status(404).json({ error: 'İş emri bulunamadı' });
  }

  const order = workOrders[orderIndex];

  if (order.assignedTo !== workerId) {
    return res.status(403).json({ error: 'Bu iş emrine okuma ekleme yetkiniz yok' });
  }

  if (!readings || !Array.isArray(readings)) {
    return res.status(400).json({ error: 'Geçerli okuma verisi gerekli' });
  }

  // Okuma verilerini doğrula
  for (const reading of readings) {
    if (!reading.meterId || reading.energy === undefined) {
      return res.status(400).json({ error: 'Her okuma için meterId ve energy gerekli' });
    }
  }

  // Okumaları ekle
  workOrders[orderIndex].readings = [
    ...workOrders[orderIndex].readings,
    ...readings.map(r => ({
      ...r,
      timestamp: new Date().toISOString(),
      recordedBy: workerId
    }))
  ];

  console.log('Yeni okumalar kaydedildi:', {
    orderId,
    workerId,
    readingCount: readings.length
  });

  res.json({
    success: true,
    message: `${readings.length} adet okuma kaydedildi`,
    totalReadings: workOrders[orderIndex].readings.length
  });
});

/**
 * Konum güncelleme
 * POST /api/field/location
 */
router.post('/location', authenticateWorker, (req, res) => {
  const workerId = req.worker.id;
  const { lat, lng, accuracy } = req.body;

  if (!lat || !lng) {
    return res.status(400).json({ error: 'Konum verisi gerekli' });
  }

  // Demo - konum kaydedildi varsay
  console.log('Konum güncellendi:', {
    workerId,
    lat,
    lng,
    accuracy,
    timestamp: new Date().toISOString()
  });

  res.json({
    success: true,
    message: 'Konum güncellendi'
  });
});

/**
 * Günlük özet
 * GET /api/field/daily-summary
 */
router.get('/daily-summary', authenticateWorker, (req, res) => {
  const workerId = req.worker.id;
  const today = new Date().toISOString().split('T')[0];

  const workerOrders = workOrders.filter(o => o.assignedTo === workerId);

  const todayOrders = workerOrders.filter(o =>
    o.assignedDate.startsWith(today) || o.completedAt?.startsWith(today)
  );

  const completed = todayOrders.filter(o => o.status === 'completed');
  const inProgress = workerOrders.filter(o => o.status === 'in_progress');
  const pending = workerOrders.filter(o => o.status === 'pending' || o.status === 'assigned');

  const totalReadings = completed.reduce((sum, o) => sum + (o.readings?.length || 0), 0);

  res.json({
    date: today,
    todayCompleted: completed.length,
    inProgress: inProgress.length,
    pending: pending.length,
    totalReadings,
    nextTask: pending.length > 0 ? {
      id: pending[0].id,
      type: pending[0].type,
      site: pending[0].site,
      building: pending[0].building,
      scheduledTime: pending[0].assignedDate
    } : null
  });
});

/**
 * Mesajlar
 * GET /api/field/messages
 */
router.get('/messages', authenticateWorker, (req, res) => {
  const { unreadOnly } = req.query;

  let msgs = [...messages];

  if (unreadOnly === 'true') {
    msgs = msgs.filter(m => !m.read);
  }

  // En yeni önce
  msgs.sort((a, b) => new Date(b.date) - new Date(a.date));

  res.json(msgs);
});

/**
 * Mesajı okundu işaretle
 * PATCH /api/field/messages/:id/read
 */
router.patch('/messages/:id/read', authenticateWorker, (req, res) => {
  const msgId = parseInt(req.params.id);

  const msgIndex = messages.findIndex(m => m.id === msgId);
  if (msgIndex !== -1) {
    messages[msgIndex].read = true;
  }

  res.json({ success: true });
});

/**
 * Malzeme stok durumu
 * GET /api/field/inventory
 */
router.get('/inventory', authenticateWorker, (req, res) => {
  res.json(inventory);
});

/**
 * Malzeme talebi oluştur
 * POST /api/field/inventory/request
 */
router.post('/inventory/request', authenticateWorker, (req, res) => {
  const workerId = req.worker.id;
  const { items, notes, urgency } = req.body;

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Malzeme listesi gerekli' });
  }

  const requestId = 'MR-' + Date.now();

  console.log('Yeni malzeme talebi:', {
    requestId,
    workerId,
    workerName: req.worker.name,
    items,
    notes,
    urgency: urgency || 'normal',
    date: new Date().toISOString()
  });

  res.json({
    success: true,
    requestId,
    message: 'Malzeme talebi oluşturuldu'
  });
});

/**
 * Fotoğraf yükle (simülasyon)
 * POST /api/field/upload-photo
 */
router.post('/upload-photo', authenticateWorker, (req, res) => {
  const workerId = req.worker.id;
  const { workOrderId, photoType, photoData } = req.body;

  if (!workOrderId || !photoType) {
    return res.status(400).json({ error: 'İş emri ID ve fotoğraf tipi gerekli' });
  }

  const photoId = 'PHOTO-' + Date.now();

  console.log('Fotoğraf yüklendi:', {
    photoId,
    workOrderId,
    photoType, // 'before', 'after', 'meter', 'problem'
    workerId,
    date: new Date().toISOString()
  });

  res.json({
    success: true,
    photoId,
    message: 'Fotoğraf yüklendi'
  });
});

/**
 * Arıza bildirimi
 * POST /api/field/report-issue
 */
router.post('/report-issue', authenticateWorker, (req, res) => {
  const workerId = req.worker.id;
  const { workOrderId, meterId, issueType, description, severity } = req.body;

  if (!issueType || !description) {
    return res.status(400).json({ error: 'Arıza tipi ve açıklama gerekli' });
  }

  const issueId = 'ISS-' + Date.now();

  console.log('Arıza bildirimi:', {
    issueId,
    workerId,
    workerName: req.worker.name,
    workOrderId,
    meterId,
    issueType, // 'sensor_error', 'communication_error', 'mechanical_damage', 'other'
    description,
    severity: severity || 'medium',
    date: new Date().toISOString()
  });

  res.json({
    success: true,
    issueId,
    message: 'Arıza bildirimi kaydedildi'
  });
});

// ==========================================
// SUPERVISOR ONLY ENDPOINTS
// ==========================================

/**
 * Tüm personel listesi
 * GET /api/field/workers
 */
router.get('/workers', authenticateWorker, supervisorOnly, (req, res) => {
  const workers = fieldWorkers.map(w => ({
    id: w.id,
    name: w.name,
    username: w.username,
    phone: w.phone,
    role: w.role,
    specialization: w.specialization,
    region: w.region,
    active: w.active
  }));

  res.json(workers);
});

/**
 * Tüm iş emirleri (supervisor)
 * GET /api/field/all-work-orders
 */
router.get('/all-work-orders', authenticateWorker, supervisorOnly, (req, res) => {
  const { status, type, assignedTo } = req.query;

  let orders = [...workOrders];

  if (status) {
    orders = orders.filter(o => o.status === status);
  }

  if (type) {
    orders = orders.filter(o => o.type === type);
  }

  if (assignedTo) {
    orders = orders.filter(o => o.assignedTo === parseInt(assignedTo));
  }

  // Personel isimlerini ekle
  orders = orders.map(o => ({
    ...o,
    assignedToName: fieldWorkers.find(w => w.id === o.assignedTo)?.name || '-'
  }));

  res.json(orders);
});

/**
 * Yeni iş emri oluştur (supervisor)
 * POST /api/field/work-orders
 */
router.post('/work-orders', authenticateWorker, supervisorOnly, (req, res) => {
  const {
    type,
    priority,
    assignedTo,
    assignedDate,
    site,
    building,
    apartment,
    address,
    lat,
    lng,
    meterCount,
    meterId,
    description,
    notes
  } = req.body;

  if (!type || !assignedTo || !site || !description) {
    return res.status(400).json({ error: 'Gerekli alanlar eksik' });
  }

  const newOrder = {
    id: workOrders.length + 1,
    type,
    priority: priority || 'normal',
    status: 'assigned',
    assignedTo,
    assignedDate: assignedDate || new Date().toISOString(),
    site,
    building: building || '',
    apartment: apartment || '',
    address: address || '',
    lat: lat || 0,
    lng: lng || 0,
    meterCount: meterCount || 1,
    meterId: meterId || '',
    description,
    notes: notes || '',
    createdAt: new Date().toISOString(),
    createdBy: req.worker.id,
    completedAt: null,
    readings: []
  };

  workOrders.push(newOrder);

  res.json({
    success: true,
    message: 'İş emri oluşturuldu',
    order: newOrder
  });
});

/**
 * İş emri ata/transfer et (supervisor)
 * PATCH /api/field/work-orders/:id/assign
 */
router.patch('/work-orders/:id/assign', authenticateWorker, supervisorOnly, (req, res) => {
  const orderId = parseInt(req.params.id);
  const { assignedTo, notes } = req.body;

  const orderIndex = workOrders.findIndex(o => o.id === orderId);

  if (orderIndex === -1) {
    return res.status(404).json({ error: 'İş emri bulunamadı' });
  }

  if (!fieldWorkers.find(w => w.id === assignedTo)) {
    return res.status(400).json({ error: 'Geçersiz personel' });
  }

  workOrders[orderIndex].assignedTo = assignedTo;
  workOrders[orderIndex].assignedDate = new Date().toISOString();

  if (notes) {
    workOrders[orderIndex].notes = (workOrders[orderIndex].notes || '') + '\n' + notes;
  }

  const assignedWorker = fieldWorkers.find(w => w.id === assignedTo);

  res.json({
    success: true,
    message: `İş emri ${assignedWorker.name} personeline atandı`,
    order: workOrders[orderIndex]
  });
});

/**
 * Performans raporu (supervisor)
 * GET /api/field/performance
 */
router.get('/performance', authenticateWorker, supervisorOnly, (req, res) => {
  const { period } = req.query; // 'today', 'week', 'month'

  const now = new Date();
  let startDate;

  switch (period) {
    case 'today':
      startDate = new Date(now.setHours(0, 0, 0, 0));
      break;
    case 'week':
      startDate = new Date(now.setDate(now.getDate() - 7));
      break;
    case 'month':
      startDate = new Date(now.setMonth(now.getMonth() - 1));
      break;
    default:
      startDate = new Date(now.setHours(0, 0, 0, 0));
  }

  const performance = fieldWorkers
    .filter(w => w.role !== 'supervisor')
    .map(worker => {
      const workerOrders = workOrders.filter(o => o.assignedTo === worker.id);
      const completed = workerOrders.filter(o => o.status === 'completed');
      const totalReadings = completed.reduce((sum, o) => sum + (o.readings?.length || 0), 0);

      return {
        id: worker.id,
        name: worker.name,
        role: worker.role,
        region: worker.region,
        totalOrders: workerOrders.length,
        completed: completed.length,
        inProgress: workerOrders.filter(o => o.status === 'in_progress').length,
        pending: workerOrders.filter(o => o.status === 'pending' || o.status === 'assigned').length,
        totalReadings,
        completionRate: workerOrders.length > 0
          ? (completed.length / workerOrders.length * 100).toFixed(1)
          : 0
      };
    });

  const totalStats = {
    totalOrders: workOrders.length,
    completed: workOrders.filter(o => o.status === 'completed').length,
    inProgress: workOrders.filter(o => o.status === 'in_progress').length,
    pending: workOrders.filter(o => o.status === 'pending' || o.status === 'assigned').length
  };

  res.json({
    period: period || 'today',
    workers: performance,
    totals: totalStats
  });
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'field-worker-portal',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

export default router;
