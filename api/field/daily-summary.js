// Teknik Servis Günlük Özet API
// teknik.sayac.cemal.online/api/field/daily-summary

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Demo günlük özet
    const today = new Date().toISOString().split('T')[0];

    const summary = {
      date: today,
      totalAssigned: 5,
      inProgress: 1,
      completedToday: 3,
      pendingToday: 1,
      metersRead: 72,
      maintenanceDone: 2,
      repairsDone: 1,
      installationsDone: 0,
      workingHours: 6.5,
      distanceTraveled: 45.2, // km
      performance: {
        onTimeCompletion: 92, // %
        customerSatisfaction: 4.7,
        averageJobTime: 45 // minutes
      },
      earnings: {
        daily: 850,
        weekly: 4250,
        monthly: 18500
      }
    };

    return res.status(200).json(summary);

  } catch (error) {
    console.error('Daily summary error:', error);
    return res.status(500).json({ error: 'Sunucu hatası' });
  }
}
