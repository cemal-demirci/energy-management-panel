// Teknik Servis Login API
// teknik.sayac.cemal.online/api/field/login

export default function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, password } = req.body;

    // Demo users for technical service
    const technicians = {
      'tekniker1': { password: '1234', name: 'Ahmet Yılmaz', region: 'Ataşehir', role: 'technician' },
      'tekniker2': { password: '1234', name: 'Mehmet Demir', region: 'Kadıköy', role: 'technician' },
      'tekniker3': { password: '1234', name: 'Ali Kaya', region: 'Üsküdar', role: 'technician' },
      'supervisor': { password: 'admin', name: 'Fatma Öz', region: 'İstanbul', role: 'supervisor' }
    };

    const user = technicians[username];

    if (!user || user.password !== password) {
      return res.status(401).json({
        success: false,
        message: 'Kullanıcı adı veya şifre hatalı'
      });
    }

    // Generate demo token
    const token = `field-token-${username}-${Date.now()}`;

    return res.status(200).json({
      success: true,
      token: token,
      user: {
        username: username,
        name: user.name,
        region: user.region,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Sunucu hatası'
    });
  }
}
