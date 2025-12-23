// Health Check API
// /api/health

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  return res.status(200).json({
    status: 'healthy',
    service: 'Sayaç Yönetim Sistemi',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: {
      connected: true,
      type: 'demo'
    },
    features: {
      mbus: true,
      fieldService: true,
      tenantPortal: true,
      aiAssistant: true
    }
  });
}
