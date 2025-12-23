// Teknik Servis Profil API
// teknik.sayac.cemal.online/api/field/profile

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

  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];

    // Extract username from token (demo)
    const parts = token.split('-');
    const username = parts[2] || 'tekniker1';

    // Demo profiles
    const profiles = {
      'tekniker1': {
        id: 1,
        name: 'Ahmet Yılmaz',
        username: 'tekniker1',
        region: 'Ataşehir',
        role: 'technician',
        phone: '0532 123 4567',
        email: 'ahmet@teknikservis.com',
        avatar: 'AY',
        rating: 4.8,
        completedJobs: 156,
        activeJobs: 3,
        joinDate: '2023-01-15'
      },
      'tekniker2': {
        id: 2,
        name: 'Mehmet Demir',
        username: 'tekniker2',
        region: 'Kadıköy',
        role: 'technician',
        phone: '0533 234 5678',
        email: 'mehmet@teknikservis.com',
        avatar: 'MD',
        rating: 4.6,
        completedJobs: 89,
        activeJobs: 2,
        joinDate: '2023-06-20'
      },
      'supervisor': {
        id: 3,
        name: 'Fatma Öz',
        username: 'supervisor',
        region: 'İstanbul',
        role: 'supervisor',
        phone: '0535 345 6789',
        email: 'fatma@teknikservis.com',
        avatar: 'FÖ',
        rating: 4.9,
        completedJobs: 312,
        activeJobs: 0,
        joinDate: '2022-03-01'
      }
    };

    const profile = profiles[username] || profiles['tekniker1'];

    return res.status(200).json(profile);

  } catch (error) {
    console.error('Profile error:', error);
    return res.status(500).json({ error: 'Sunucu hatası' });
  }
}
