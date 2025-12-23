// Teknik Servis API Ana Sayfa
// teknik.sayac.cemal.online/api/field

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  return res.status(200).json({
    service: 'Teknik Servis API',
    version: '1.0.0',
    status: 'active',
    endpoints: {
      login: {
        method: 'POST',
        path: '/api/field/login',
        description: 'Tekniker girişi',
        body: { username: 'string', password: 'string' }
      },
      profile: {
        method: 'GET',
        path: '/api/field/profile',
        description: 'Tekniker profili',
        auth: 'Bearer token required'
      },
      workOrders: {
        method: 'GET',
        path: '/api/field/work-orders',
        description: 'İş emirleri listesi',
        auth: 'Bearer token required'
      },
      dailySummary: {
        method: 'GET',
        path: '/api/field/daily-summary',
        description: 'Günlük özet',
        auth: 'Bearer token required'
      },
      reading: {
        method: 'POST',
        path: '/api/field/reading',
        description: 'Sayaç okuma kaydet',
        auth: 'Bearer token required',
        body: { workOrderId: 'number', meterId: 'string', value: 'number' }
      },
      status: {
        method: 'PUT',
        path: '/api/field/status',
        description: 'İş durumu güncelle',
        auth: 'Bearer token required',
        body: { workOrderId: 'number', status: 'string' }
      },
      reportIssue: {
        method: 'POST',
        path: '/api/field/report-issue',
        description: 'Sorun bildir',
        auth: 'Bearer token required',
        body: { workOrderId: 'number', issueType: 'string', description: 'string' }
      }
    },
    demoUsers: [
      { username: 'tekniker1', password: '1234', role: 'technician' },
      { username: 'tekniker2', password: '1234', role: 'technician' },
      { username: 'supervisor', password: 'admin', role: 'supervisor' }
    ],
    timestamp: new Date().toISOString()
  });
}
