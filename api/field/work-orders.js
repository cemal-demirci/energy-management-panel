// Teknik Servis İş Emirleri API
// teknik.sayac.cemal.online/api/field/work-orders

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    if (req.method === 'GET') {
      // Demo iş emirleri
      const workOrders = [
        {
          id: 1,
          type: 'meter_reading',
          description: 'Aylık Sayaç Okuma',
          site: 'Merkez Sitesi',
          building: 'A Blok',
          address: 'Ataköy Mah. Çiçek Sk. No:15, Ataşehir',
          lat: 40.9923,
          lng: 29.1244,
          priority: 'normal',
          status: 'assigned',
          meterCount: 24,
          assignedDate: new Date().toISOString().split('T')[0],
          dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
          notes: 'Kapıcı Ahmet Bey ile iletişime geçin.'
        },
        {
          id: 2,
          type: 'maintenance',
          description: 'Sayaç Bakımı',
          site: 'Yeşil Vadi',
          building: 'B Blok',
          address: 'Yeşil Mah. Park Cd. No:8, Kadıköy',
          lat: 40.9821,
          lng: 29.0567,
          priority: 'high',
          status: 'pending',
          meterCount: 0,
          meterId: 'H-1234',
          assignedDate: new Date().toISOString().split('T')[0],
          dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          notes: 'Sayaç ekranı okunmuyor, pil değişimi gerekebilir.'
        },
        {
          id: 3,
          type: 'repair',
          description: 'Arıza Giderme',
          site: 'Güneş Konutları',
          building: 'C Blok Daire 5',
          address: 'Güneş Mah. Ay Sk. No:22, Üsküdar',
          lat: 41.0234,
          lng: 29.0156,
          priority: 'urgent',
          status: 'in_progress',
          meterCount: 0,
          meterId: 'H-5678',
          assignedDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
          dueDate: new Date().toISOString().split('T')[0],
          notes: 'Sayaç veri göndermiyor, sensör kontrolü yapılmalı.'
        },
        {
          id: 4,
          type: 'installation',
          description: 'Yeni Sayaç Kurulumu',
          site: 'Mavi Rezidans',
          building: 'D Blok Daire 12',
          address: 'Mavi Mah. Deniz Cd. No:45, Maltepe',
          lat: 40.9345,
          lng: 29.1567,
          priority: 'normal',
          status: 'pending',
          meterCount: 1,
          assignedDate: new Date().toISOString().split('T')[0],
          dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
          notes: 'Yeni daire, kurulum için randevu alındı.'
        },
        {
          id: 5,
          type: 'meter_reading',
          description: 'Acil Okuma Talebi',
          site: 'Merkez Sitesi',
          building: 'A Blok Daire 8',
          address: 'Ataköy Mah. Çiçek Sk. No:15/8, Ataşehir',
          lat: 40.9923,
          lng: 29.1244,
          priority: 'high',
          status: 'assigned',
          meterCount: 1,
          meterId: 'H-0808',
          assignedDate: new Date().toISOString().split('T')[0],
          dueDate: new Date().toISOString().split('T')[0],
          notes: 'Kiracı taşınıyor, son okuma gerekli.'
        }
      ];

      return res.status(200).json({ workOrders });
    }

    if (req.method === 'POST') {
      // Yeni iş emri oluştur
      const newOrder = req.body;
      return res.status(201).json({
        success: true,
        workOrder: {
          id: Date.now(),
          ...newOrder,
          status: 'pending',
          assignedDate: new Date().toISOString()
        }
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Work orders error:', error);
    return res.status(500).json({ error: 'Sunucu hatası' });
  }
}
