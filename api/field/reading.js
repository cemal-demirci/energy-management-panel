// Teknik Servis Sayaç Okuma API
// teknik.sayac.cemal.online/api/field/reading

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    if (req.method === 'POST') {
      const { workOrderId, meterId, value, type, notes, photos } = req.body;

      if (!meterId || value === undefined) {
        return res.status(400).json({
          success: false,
          message: 'Sayaç ID ve değer gerekli'
        });
      }

      // Demo okuma kaydı
      const reading = {
        id: Date.now(),
        workOrderId,
        meterId,
        value: parseFloat(value),
        type: type || 'heat_energy',
        notes: notes || '',
        photoCount: photos?.length || 0,
        timestamp: new Date().toISOString(),
        location: {
          lat: 40.9923 + Math.random() * 0.01,
          lng: 29.1244 + Math.random() * 0.01
        },
        technician: 'Ahmet Yılmaz',
        status: 'recorded'
      };

      return res.status(201).json({
        success: true,
        reading,
        message: 'Okuma başarıyla kaydedildi'
      });
    }

    if (req.method === 'GET') {
      const { meterId, workOrderId } = req.query;

      // Demo okuma geçmişi
      const readings = [
        {
          id: 1,
          meterId: meterId || 'H-1234',
          value: 1250.456,
          type: 'heat_energy',
          timestamp: new Date(Date.now() - 86400000 * 30).toISOString(),
          technician: 'Ahmet Yılmaz'
        },
        {
          id: 2,
          meterId: meterId || 'H-1234',
          value: 1320.789,
          type: 'heat_energy',
          timestamp: new Date(Date.now() - 86400000 * 60).toISOString(),
          technician: 'Mehmet Demir'
        }
      ];

      return res.status(200).json({ readings });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Reading error:', error);
    return res.status(500).json({ error: 'Sunucu hatası' });
  }
}
