import express from 'express';
import cors from 'cors';
import sql from 'mssql';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const app = express();
app.use(cors());
app.use(express.json());

// SQL Server Bağlantı Ayarları
const dbConfig = {
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT) || 1433,
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000
  }
};

let pool = null;

// Veritabanı bağlantısı
async function connectDB() {
  try {
    pool = await sql.connect(dbConfig);
    console.log('✅ SQL Server bağlantısı başarılı');
    return pool;
  } catch (err) {
    console.error('❌ SQL Server bağlantı hatası:', err.message);
    return null;
  }
}

// API: Tüm sayaçları getir
app.get('/api/meters', async (req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({ error: 'Veritabanı bağlantısı yok' });
    }

    const result = await pool.request().query(`
      SELECT TOP 100
        s.id as ID,
        s.secondaryno as SeriNo,
        d.daireno as DaireNo,
        s.blok as BlokAdi,
        d.isim as Adres,
        s.sonendeks as SonOkuma,
        s.sontarih as OkumaTarihi,
        s.okuma_durum as Durum,
        s.enerji as IsitmaEnerji,
        s.toplamtuketim as SogutmaEnerji,
        s.akis as Hacim,
        s.girissicaklik as GirisSicaklik,
        s.cikissicaklik as CikisSicaklik,
        s.sayactip as SayacTip,
        s.sayacmarka as SayacMarka
      FROM sayaclar s
      LEFT JOIN daireler d ON s.daire_id = d.id
      ORDER BY s.sontarih DESC
    `);

    res.json(result.recordset);
  } catch (err) {
    console.error('Sayaç listesi hatası:', err);
    res.status(500).json({ error: err.message });
  }
});

// API: Tek sayaç detayı
app.get('/api/meters/:id', async (req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({ error: 'Veritabanı bağlantısı yok' });
    }

    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query(`
        SELECT * FROM Sayaclar WHERE ID = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Sayaç bulunamadı' });
    }

    res.json(result.recordset[0]);
  } catch (err) {
    console.error('Sayaç detay hatası:', err);
    res.status(500).json({ error: err.message });
  }
});

// API: Sayaç geçmişi
app.get('/api/meters/:id/history', async (req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({ error: 'Veritabanı bağlantısı yok' });
    }

    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query(`
        SELECT TOP 24
          Tarih, IsitmaEnerji, SogutmaEnerji, Hacim, Guc
        FROM SayacGecmis
        WHERE SayacID = @id
        ORDER BY Tarih DESC
      `);

    res.json(result.recordset);
  } catch (err) {
    console.error('Geçmiş hatası:', err);
    res.status(500).json({ error: err.message });
  }
});

// API: Blok listesi
app.get('/api/blocks', async (req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({ error: 'Veritabanı bağlantısı yok' });
    }

    const result = await pool.request().query(`
      SELECT DISTINCT BlokAdi, COUNT(*) as SayacSayisi
      FROM Sayaclar
      GROUP BY BlokAdi
      ORDER BY BlokAdi
    `);

    res.json(result.recordset);
  } catch (err) {
    console.error('Blok listesi hatası:', err);
    res.status(500).json({ error: err.message });
  }
});

// API: Dashboard özeti
app.get('/api/dashboard', async (req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({ error: 'Veritabanı bağlantısı yok' });
    }

    const stats = await pool.request().query(`
      SELECT
        COUNT(*) as ToplamSayac,
        SUM(IsitmaEnerji) as ToplamIsitma,
        SUM(SogutmaEnerji) as ToplamSogutma,
        SUM(Hacim) as ToplamHacim,
        SUM(CASE WHEN Durum = 'Aktif' THEN 1 ELSE 0 END) as AktifSayac,
        SUM(CASE WHEN Durum = 'Hata' THEN 1 ELSE 0 END) as HataliSayac
      FROM Sayaclar
    `);

    res.json(stats.recordset[0]);
  } catch (err) {
    console.error('Dashboard hatası:', err);
    res.status(500).json({ error: err.message });
  }
});

// API: Veritabanı tabloları kontrol
app.get('/api/tables', async (req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({ error: 'Veritabanı bağlantısı yok' });
    }

    const result = await pool.request().query(`
      SELECT TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `);

    res.json(result.recordset);
  } catch (err) {
    console.error('Tablo listesi hatası:', err);
    res.status(500).json({ error: err.message });
  }
});

// API: Tablo sütunlarını getir
app.get('/api/columns/:table', async (req, res) => {
  try {
    if (!pool) {
      return res.status(500).json({ error: 'Veritabanı bağlantısı yok' });
    }

    const result = await pool.request()
      .input('table', sql.NVarChar, req.params.table)
      .query(`
        SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = @table
        ORDER BY ORDINAL_POSITION
      `);

    res.json(result.recordset);
  } catch (err) {
    console.error('Sütun listesi hatası:', err);
    res.status(500).json({ error: err.message });
  }
});

// API: Bağlantı durumu
app.get('/api/status', async (req, res) => {
  res.json({
    connected: pool !== null,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE
  });
});

// Static dosyalar (production için)
app.use(express.static(join(__dirname, '..', 'dist')));

// SPA routing
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, '..', 'dist', 'index.html'));
});

const PORT = process.env.PORT || 3001;

// Sunucuyu başlat
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server çalışıyor: http://localhost:${PORT}`);
    console.log(`📊 API endpoint: http://localhost:${PORT}/api`);
  });
});
