// Teknik Servis İş Durumu Güncelleme API
// teknik.sayac.cemal.online/api/field/status

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { workOrderId, status, notes, readings, completionData } = req.body;

    if (!workOrderId || !status) {
      return res.status(400).json({
        success: false,
        message: 'İş emri ID ve durum gerekli'
      });
    }

    const validStatuses = ['pending', 'assigned', 'in_progress', 'completed', 'cancelled', 'on_hold'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz durum'
      });
    }

    const statusLabels = {
      'pending': 'Beklemede',
      'assigned': 'Atandı',
      'in_progress': 'Devam Ediyor',
      'completed': 'Tamamlandı',
      'cancelled': 'İptal Edildi',
      'on_hold': 'Askıda'
    };

    const update = {
      workOrderId,
      previousStatus: 'assigned',
      newStatus: status,
      statusLabel: statusLabels[status],
      notes: notes || '',
      readingsSubmitted: readings ? Object.keys(readings).length : 0,
      updatedAt: new Date().toISOString(),
      technician: 'Ahmet Yılmaz'
    };

    if (status === 'completed') {
      update.completedAt = new Date().toISOString();
      update.completionData = completionData || {};
    }

    return res.status(200).json({
      success: true,
      update,
      message: `İş durumu "${statusLabels[status]}" olarak güncellendi`
    });

  } catch (error) {
    console.error('Status update error:', error);
    return res.status(500).json({ error: 'Sunucu hatası' });
  }
}
