// Teknik Servis Sorun Bildirme API
// teknik.sayac.cemal.online/api/field/report-issue

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { workOrderId, issueType, description, photos, severity } = req.body;

    if (!workOrderId || !description) {
      return res.status(400).json({
        success: false,
        message: 'İş emri ID ve açıklama gerekli'
      });
    }

    const issueTypes = {
      'access_denied': 'Erişim Engeli',
      'equipment_failure': 'Ekipman Arızası',
      'meter_damaged': 'Sayaç Hasarlı',
      'communication_error': 'İletişim Hatası',
      'customer_complaint': 'Müşteri Şikayeti',
      'safety_hazard': 'Güvenlik Riski',
      'general': 'Genel'
    };

    const issue = {
      id: Date.now(),
      workOrderId,
      issueType: issueType || 'general',
      issueTypeLabel: issueTypes[issueType] || 'Genel',
      description,
      photoCount: photos?.length || 0,
      severity: severity || 'medium',
      timestamp: new Date().toISOString(),
      status: 'reported',
      technician: 'Ahmet Yılmaz',
      location: {
        lat: 40.9923,
        lng: 29.1244
      }
    };

    return res.status(201).json({
      success: true,
      issue,
      message: 'Sorun başarıyla bildirildi. Yetkili en kısa sürede sizinle iletişime geçecek.'
    });

  } catch (error) {
    console.error('Report issue error:', error);
    return res.status(500).json({ error: 'Sunucu hatası' });
  }
}
