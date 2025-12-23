import express from 'express';
import cors from 'cors';
import sql from 'mssql';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import gatewayManager from './mbus-gateway.js';

// Ayrı Portal Backend'leri
import tenantPortalRouter from './tenant-portal.js';
import fieldWorkerRouter from './field-worker-portal.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

const app = express();
app.use(cors());
app.use(express.json());

// Portal API Route'ları
app.use('/api/tenant', tenantPortalRouter);    // Kiracı Portalı: /api/tenant/*
app.use('/api/field', fieldWorkerRouter);      // Saha Personeli: /api/field/*

console.log('[Portal] Kiracı Portalı API aktif: /api/tenant/*');
console.log('[Portal] Saha Personeli API aktif: /api/field/*');

// M-Bus Gateway TCP Server başlat (port 5000)
const MBUS_TCP_PORT = parseInt(process.env.MBUS_TCP_PORT) || 5000;
gatewayManager.startServer(MBUS_TCP_PORT);
console.log(`[M-Bus] TCP sunucu port ${MBUS_TCP_PORT}'de başlatıldı`);

// Gateway event listeners
gatewayManager.on('gateway-connected', ({ imei, ip }) => {
  console.log(`[M-Bus] Gateway bağlandı: ${imei} (${ip})`);
});

gatewayManager.on('gateway-disconnected', ({ imei }) => {
  console.log(`[M-Bus] Gateway bağlantısı kesildi: ${imei}`);
});

gatewayManager.on('data-received', ({ imei, response }) => {
  console.log(`[M-Bus] Veri alındı: ${imei} - ${response.type}`);
});

// Health check endpoint for Railway
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: pool ? 'connected' : 'disconnected',
    mbusServer: 'running',
    connectedGateways: gatewayManager.getConnectedGateways().length
  });
});

// Zamanlanmış görevler için
const scheduledJobs = new Map();
const billingHistory = [];

// Gemini API Key
const GEMINI_API_KEY = process.env.VITE_GEMINI_API_KEY || 'AIzaSyBHrH4iiVSkQXsIOGpYOb97nYlih8n12CE';

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

// ============================================
// 🌍 COĞRAFYA API'leri (İl/İlçe/Site/Bina)
// ============================================

// İller
app.get('/api/cities', async (req, res) => {
  try {
    if (!pool) return res.status(500).json({ error: 'Veritabanı bağlantısı yok' });

    const result = await pool.request().query(`
      SELECT DISTINCT s.il as name, s.il_index as id,
        COUNT(DISTINCT s.id) as siteSayisi,
        (SELECT COUNT(*) FROM sayaclar sa WHERE sa.site_id IN (SELECT id FROM siteler WHERE il = s.il)) as sayacSayisi
      FROM siteler s
      WHERE s.il IS NOT NULL AND s.il != ''
      GROUP BY s.il, s.il_index
      ORDER BY s.il
    `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// İlçeler
app.get('/api/cities/:city/districts', async (req, res) => {
  try {
    if (!pool) return res.status(500).json({ error: 'Veritabanı bağlantısı yok' });

    const result = await pool.request()
      .input('city', sql.NVarChar, req.params.city)
      .query(`
        SELECT DISTINCT s.ilce as name, s.ilce_index as id,
          COUNT(DISTINCT s.id) as siteSayisi,
          (SELECT COUNT(*) FROM sayaclar sa WHERE sa.site_id IN (SELECT id FROM siteler WHERE ilce = s.ilce AND il = @city)) as sayacSayisi
        FROM siteler s
        WHERE s.il = @city AND s.ilce IS NOT NULL AND s.ilce != ''
        GROUP BY s.ilce, s.ilce_index
        ORDER BY s.ilce
      `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Siteler
app.get('/api/sites', async (req, res) => {
  try {
    if (!pool) return res.status(500).json({ error: 'Veritabanı bağlantısı yok' });

    const { city, district, limit = 100 } = req.query;
    let query = `
      SELECT TOP ${parseInt(limit)}
        s.id, s.site as name, s.il as city, s.ilce as district,
        s.adres as address, s.Latitude as lat, s.Longitude as lng,
        s.yonetici_isim as manager, s.yonetici_telefon as phone,
        s.aktif as active, s.firma_id,
        (SELECT COUNT(*) FROM binalar b WHERE b.site_id = s.id) as binaSayisi,
        (SELECT COUNT(*) FROM sayaclar sa WHERE sa.site_id = s.id) as sayacSayisi,
        (SELECT ISNULL(SUM(enerji), 0) FROM sayaclar sa WHERE sa.site_id = s.id) as toplamEnerji
      FROM siteler s
      WHERE 1=1
    `;

    const request = pool.request();
    if (city) {
      query += ` AND s.il = @city`;
      request.input('city', sql.NVarChar, city);
    }
    if (district) {
      query += ` AND s.ilce = @district`;
      request.input('district', sql.NVarChar, district);
    }
    query += ` ORDER BY s.site`;

    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Site detayı
app.get('/api/sites/:id', async (req, res) => {
  try {
    if (!pool) return res.status(500).json({ error: 'Veritabanı bağlantısı yok' });

    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query(`
        SELECT s.*, f.firma as firmaAdi,
          (SELECT COUNT(*) FROM binalar b WHERE b.site_id = s.id) as binaSayisi,
          (SELECT COUNT(*) FROM daireler d WHERE d.site_id = s.id) as daireSayisi,
          (SELECT COUNT(*) FROM sayaclar sa WHERE sa.site_id = s.id) as sayacSayisi,
          (SELECT ISNULL(SUM(enerji), 0) FROM sayaclar sa WHERE sa.site_id = s.id) as toplamEnerji,
          (SELECT ISNULL(SUM(akis), 0) FROM sayaclar sa WHERE sa.site_id = s.id) as toplamHacim
        FROM siteler s
        LEFT JOIN firmalar f ON s.firma_id = f.id
        WHERE s.id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Site bulunamadı' });
    }
    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Binalar
app.get('/api/buildings', async (req, res) => {
  try {
    if (!pool) return res.status(500).json({ error: 'Veritabanı bağlantısı yok' });

    const { siteId, limit = 100 } = req.query;
    let query = `
      SELECT TOP ${parseInt(limit)}
        b.id, b.bina as name, b.site_id, s.site as siteName,
        b.dairesayisi, b.sayacsayisi, b.imei,
        b.yonetici_isim as manager, b.yonetici_telefon as phone,
        b.sonerisim as lastAccess, b.cihaztur as deviceType,
        (SELECT ISNULL(SUM(enerji), 0) FROM sayaclar sa WHERE sa.bina_id = b.id) as toplamEnerji
      FROM binalar b
      LEFT JOIN siteler s ON b.site_id = s.id
      WHERE 1=1
    `;

    const request = pool.request();
    if (siteId) {
      query += ` AND b.site_id = @siteId`;
      request.input('siteId', sql.Int, siteId);
    }
    query += ` ORDER BY b.bina`;

    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Firmalar
app.get('/api/companies', async (req, res) => {
  try {
    if (!pool) return res.status(500).json({ error: 'Veritabanı bağlantısı yok' });

    const result = await pool.request().query(`
      SELECT f.id, f.firma as name, f.adres as address,
        f.telefon as phone, f.email, f.yetkili_isim as manager,
        f.firma_durum as active,
        (SELECT COUNT(*) FROM siteler s WHERE s.firma_id = f.id) as siteSayisi,
        (SELECT COUNT(*) FROM sayaclar sa WHERE sa.firma_id = f.id) as sayacSayisi
      FROM firmalar f
      ORDER BY f.firma
    `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// 📊 SAYAÇ API'leri
// ============================================

// Tüm sayaçları getir
app.get('/api/meters', async (req, res) => {
  try {
    if (!pool) return res.status(500).json({ error: 'Veritabanı bağlantısı yok' });

    const { siteId, buildingId, city, district, limit = 100 } = req.query;

    let query = `
      SELECT TOP ${parseInt(limit)}
        s.id as ID, s.secondaryno as SeriNo,
        d.daireno as DaireNo, s.blok as BlokAdi,
        d.isim as Adres, s.sonendeks as SonOkuma,
        s.sontarih as OkumaTarihi, s.okuma_durum as Durum,
        s.enerji as IsitmaEnerji, s.toplamtuketim as SogutmaEnerji,
        s.akis as Hacim, s.girissicaklik as GirisSicaklik,
        s.cikissicaklik as CikisSicaklik, s.sayactip as SayacTip,
        s.sayacmarka as SayacMarka, s.site_id, s.bina_id,
        st.site as SiteAdi, st.il as Il, st.ilce as Ilce,
        b.bina as BinaAdi
      FROM sayaclar s
      LEFT JOIN daireler d ON s.daire_id = d.id
      LEFT JOIN siteler st ON s.site_id = st.id
      LEFT JOIN binalar b ON s.bina_id = b.id
      WHERE 1=1
    `;

    const request = pool.request();
    if (siteId) {
      query += ` AND s.site_id = @siteId`;
      request.input('siteId', sql.Int, siteId);
    }
    if (buildingId) {
      query += ` AND s.bina_id = @buildingId`;
      request.input('buildingId', sql.Int, buildingId);
    }
    if (city) {
      query += ` AND st.il = @city`;
      request.input('city', sql.NVarChar, city);
    }
    if (district) {
      query += ` AND st.ilce = @district`;
      request.input('district', sql.NVarChar, district);
    }
    query += ` ORDER BY s.sontarih DESC`;

    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Sayaç detayı
app.get('/api/meters/:id', async (req, res) => {
  try {
    if (!pool) return res.status(500).json({ error: 'Veritabanı bağlantısı yok' });

    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query(`
        SELECT s.*, d.daireno as DaireNo, d.isim as DaireIsim,
          st.site as SiteAdi, st.il as Il, st.ilce as Ilce,
          b.bina as BinaAdi
        FROM sayaclar s
        LEFT JOIN daireler d ON s.daire_id = d.id
        LEFT JOIN siteler st ON s.site_id = st.id
        LEFT JOIN binalar b ON s.bina_id = b.id
        WHERE s.id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Sayaç bulunamadı' });
    }
    res.json(result.recordset[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Sayaç geçmişi
app.get('/api/meters/:id/history', async (req, res) => {
  try {
    if (!pool) return res.status(500).json({ error: 'Veritabanı bağlantısı yok' });

    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query(`
        SELECT TOP 100
          tarih as Tarih, enerji as Enerji,
          tuketim as Tuketim, akis as Hacim,
          endeks as Endeks, girissicaklik as GirisSicaklik,
          cikissicaklik as CikisSicaklik
        FROM sayacdegerler
        WHERE sayac_id = @id
        ORDER BY tarih DESC
      `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// 📈 ANALİTİK & DASHBOARD API'leri
// ============================================

// Genel Dashboard
app.get('/api/dashboard', async (req, res) => {
  try {
    if (!pool) return res.status(500).json({ error: 'Veritabanı bağlantısı yok' });

    const stats = await pool.request().query(`
      SELECT
        (SELECT COUNT(*) FROM sayaclar) as toplamSayac,
        (SELECT COUNT(*) FROM siteler) as toplamSite,
        (SELECT COUNT(*) FROM binalar) as toplamBina,
        (SELECT COUNT(*) FROM daireler) as toplamDaire,
        (SELECT COUNT(DISTINCT il) FROM siteler WHERE il IS NOT NULL AND il != '') as toplamIl,
        (SELECT COUNT(DISTINCT ilce) FROM siteler WHERE ilce IS NOT NULL AND ilce != '') as toplamIlce,
        (SELECT ISNULL(SUM(enerji), 0) FROM sayaclar) as toplamEnerji,
        (SELECT ISNULL(SUM(akis), 0) FROM sayaclar) as toplamHacim,
        (SELECT COUNT(*) FROM sayaclar WHERE okuma_durum = 'Sayaç Okundu' OR okuma_durum IS NOT NULL) as aktifSayac,
        (SELECT COUNT(*) FROM sayaclar WHERE okuma_hata > 0) as hataliSayac,
        (SELECT COUNT(*) FROM sayaclar WHERE sontarih >= DATEADD(day, -1, GETDATE())) as bugunOkunan,
        (SELECT COUNT(*) FROM sayaclar WHERE sontarih >= DATEADD(day, -7, GETDATE())) as haftaOkunan
    `);

    res.json(stats.recordset[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// İl bazlı istatistikler
app.get('/api/analytics/by-city', async (req, res) => {
  try {
    if (!pool) return res.status(500).json({ error: 'Veritabanı bağlantısı yok' });

    const result = await pool.request().query(`
      SELECT
        st.il as city,
        COUNT(DISTINCT st.id) as siteSayisi,
        COUNT(DISTINCT sa.id) as sayacSayisi,
        ISNULL(SUM(sa.enerji), 0) as toplamEnerji,
        ISNULL(SUM(sa.akis), 0) as toplamHacim,
        ISNULL(AVG(sa.enerji), 0) as ortalamaEnerji
      FROM siteler st
      LEFT JOIN sayaclar sa ON sa.site_id = st.id
      WHERE st.il IS NOT NULL AND st.il != ''
      GROUP BY st.il
      ORDER BY sayacSayisi DESC
    `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Zaman bazlı tüketim analizi
app.get('/api/analytics/consumption', async (req, res) => {
  try {
    if (!pool) return res.status(500).json({ error: 'Veritabanı bağlantısı yok' });

    const { period = 'daily', siteId } = req.query;

    let dateFormat, groupBy;
    switch (period) {
      case 'hourly':
        dateFormat = 'DATEPART(hour, tarih)';
        groupBy = 'DATEPART(hour, tarih)';
        break;
      case 'monthly':
        dateFormat = "FORMAT(tarih, 'yyyy-MM')";
        groupBy = "FORMAT(tarih, 'yyyy-MM')";
        break;
      default:
        dateFormat = 'CAST(tarih AS DATE)';
        groupBy = 'CAST(tarih AS DATE)';
    }

    let query = `
      SELECT TOP 30
        ${dateFormat} as period,
        COUNT(*) as okumaSayisi,
        ISNULL(SUM(enerji), 0) as toplamEnerji,
        ISNULL(SUM(tuketim), 0) as toplamTuketim,
        ISNULL(AVG(enerji), 0) as ortalamaEnerji
      FROM sayacdegerler sd
    `;

    const request = pool.request();
    if (siteId) {
      query += ` WHERE sd.site_id = @siteId`;
      request.input('siteId', sql.Int, siteId);
    }

    query += ` GROUP BY ${groupBy} ORDER BY ${groupBy} DESC`;

    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Anomali tespiti
app.get('/api/analytics/anomalies', async (req, res) => {
  try {
    if (!pool) return res.status(500).json({ error: 'Veritabanı bağlantısı yok' });

    const result = await pool.request().query(`
      WITH AvgConsumption AS (
        SELECT site_id, AVG(enerji) as avgEnerji, STDEV(enerji) as stdEnerji
        FROM sayaclar
        WHERE enerji > 0
        GROUP BY site_id
      )
      SELECT TOP 50
        s.id, s.secondaryno as seriNo, s.enerji,
        st.site as siteAdi, st.il, st.ilce,
        ac.avgEnerji, ac.stdEnerji,
        CASE
          WHEN s.enerji > ac.avgEnerji + (2 * ac.stdEnerji) THEN 'Yüksek Tüketim'
          WHEN s.enerji < ac.avgEnerji - (2 * ac.stdEnerji) AND s.enerji > 0 THEN 'Düşük Tüketim'
          WHEN s.okuma_hata > 0 THEN 'Okuma Hatası'
          ELSE 'Normal'
        END as anomaliTipi
      FROM sayaclar s
      JOIN siteler st ON s.site_id = st.id
      JOIN AvgConsumption ac ON s.site_id = ac.site_id
      WHERE s.enerji > ac.avgEnerji + (2 * ac.stdEnerji)
         OR (s.enerji < ac.avgEnerji - (2 * ac.stdEnerji) AND s.enerji > 0)
         OR s.okuma_hata > 0
      ORDER BY
        CASE
          WHEN s.enerji > ac.avgEnerji + (2 * ac.stdEnerji) THEN 1
          WHEN s.okuma_hata > 0 THEN 2
          ELSE 3
        END
    `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Harita verileri
app.get('/api/map/sites', async (req, res) => {
  try {
    if (!pool) return res.status(500).json({ error: 'Veritabanı bağlantısı yok' });

    const result = await pool.request().query(`
      SELECT
        s.id, s.site as name, s.il as city, s.ilce as district,
        s.Latitude as lat, s.Longitude as lng,
        s.adres as address,
        (SELECT COUNT(*) FROM sayaclar sa WHERE sa.site_id = s.id) as meterCount,
        (SELECT ISNULL(SUM(enerji), 0) FROM sayaclar sa WHERE sa.site_id = s.id) as totalEnergy
      FROM siteler s
      WHERE s.Latitude IS NOT NULL AND s.Longitude IS NOT NULL
        AND s.Latitude != '' AND s.Longitude != ''
    `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// 🤖 YAPAY ZEKA API'leri (Gemini)
// ============================================

// AI Sohbet
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, context } = req.body;

    // Veritabanından güncel istatistikleri al
    let dbStats = {};
    if (pool) {
      const stats = await pool.request().query(`
        SELECT
          (SELECT COUNT(*) FROM sayaclar) as toplamSayac,
          (SELECT COUNT(*) FROM siteler) as toplamSite,
          (SELECT COUNT(*) FROM binalar) as toplamBina,
          (SELECT ISNULL(SUM(enerji), 0) FROM sayaclar) as toplamEnerji,
          (SELECT COUNT(*) FROM sayaclar WHERE okuma_hata > 0) as hataliSayac,
          (SELECT COUNT(DISTINCT il) FROM siteler WHERE il IS NOT NULL) as toplamIl
      `);
      dbStats = stats.recordset[0];
    }

    const systemPrompt = `Sen bir bina yönetim sistemi ve enerji sayacı uzmanısın.
Kullanıcıya Türkçe yanıt ver. Sistemde şu veriler mevcut:
- Toplam ${dbStats.toplamSayac || 0} sayaç
- Toplam ${dbStats.toplamSite || 0} site
- Toplam ${dbStats.toplamBina || 0} bina
- Toplam ${dbStats.toplamIl || 0} il
- Toplam enerji: ${(dbStats.toplamEnerji / 1000000).toFixed(2)} GWh
- Hatalı sayaç: ${dbStats.hataliSayac || 0}

Kullanıcının sorularına bu verilere dayanarak profesyonel ve yardımcı cevaplar ver.
Enerji tasarrufu, tüketim analizi, anomali tespiti konularında önerilerde bulun.`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            { role: 'user', parts: [{ text: systemPrompt }] },
            { role: 'model', parts: [{ text: 'Anladım, bina yönetim sistemi hakkında yardımcı olmaya hazırım.' }] },
            { role: 'user', parts: [{ text: message }] }
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024
          }
        })
      }
    );

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Yanıt alınamadı.';

    res.json({ response: aiResponse, stats: dbStats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Tüketim Analizi
app.post('/api/ai/analyze', async (req, res) => {
  try {
    const { siteId, meterId } = req.body;

    let analysisData = {};

    if (pool && siteId) {
      const siteData = await pool.request()
        .input('siteId', sql.Int, siteId)
        .query(`
          SELECT
            s.site, s.il, s.ilce,
            (SELECT COUNT(*) FROM sayaclar WHERE site_id = @siteId) as sayacSayisi,
            (SELECT ISNULL(SUM(enerji), 0) FROM sayaclar WHERE site_id = @siteId) as toplamEnerji,
            (SELECT ISNULL(AVG(enerji), 0) FROM sayaclar WHERE site_id = @siteId) as ortalamaEnerji,
            (SELECT COUNT(*) FROM sayaclar WHERE site_id = @siteId AND okuma_hata > 0) as hataliSayac
          FROM siteler s WHERE s.id = @siteId
        `);
      analysisData = siteData.recordset[0];
    }

    const prompt = `Aşağıdaki site verilerini analiz et ve Türkçe öneriler sun:
Site: ${analysisData.site || 'Bilinmiyor'}
Konum: ${analysisData.il || ''} / ${analysisData.ilce || ''}
Sayaç Sayısı: ${analysisData.sayacSayisi || 0}
Toplam Enerji: ${analysisData.toplamEnerji || 0} kWh
Ortalama Enerji: ${analysisData.ortalamaEnerji || 0} kWh
Hatalı Sayaç: ${analysisData.hataliSayac || 0}

Lütfen:
1. Tüketim durumunu değerlendir
2. Olası sorunları belirt
3. İyileştirme önerileri sun
4. Maliyet tasarrufu fırsatlarını belirt`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.5, maxOutputTokens: 1024 }
        })
      }
    );

    const data = await response.json();
    const analysis = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Analiz yapılamadı.';

    res.json({ analysis, data: analysisData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// AI Tahmin
app.post('/api/ai/predict', async (req, res) => {
  try {
    const { siteId } = req.body;

    let historicalData = [];
    if (pool && siteId) {
      const result = await pool.request()
        .input('siteId', sql.Int, siteId)
        .query(`
          SELECT TOP 12
            FORMAT(tarih, 'yyyy-MM') as ay,
            SUM(enerji) as toplamEnerji,
            AVG(enerji) as ortalamaEnerji,
            COUNT(*) as okumaSayisi
          FROM sayacdegerler
          WHERE site_id = @siteId
          GROUP BY FORMAT(tarih, 'yyyy-MM')
          ORDER BY FORMAT(tarih, 'yyyy-MM') DESC
        `);
      historicalData = result.recordset;
    }

    const prompt = `Aşağıdaki aylık enerji tüketim verilerini analiz et ve gelecek 3 ay için tahmin yap:

${historicalData.map(h => `${h.ay}: ${h.toplamEnerji} kWh (${h.okumaSayisi} okuma)`).join('\n')}

Lütfen:
1. Tüketim trendini analiz et
2. Gelecek 3 ay için tahmini tüketim değerlerini ver
3. Mevsimsel faktörleri değerlendir
4. Beklenen maliyet değişimini belirt`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.3, maxOutputTokens: 1024 }
        })
      }
    );

    const data = await response.json();
    const prediction = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Tahmin yapılamadı.';

    res.json({ prediction, historicalData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// 📡 M-BUS TOPLU OKUMA API'leri
// ============================================

// M-Bus Gateway'leri listele (IMEI olan binalar)
app.get('/api/mbus/gateways', async (req, res) => {
  try {
    if (!pool) return res.status(500).json({ error: 'Veritabanı bağlantısı yok' });

    const result = await pool.request().query(`
      SELECT
        b.id, b.bina as name, b.imei, b.site_id,
        s.site as siteName, s.il as city, s.ilce as district,
        b.sonerisim as lastAccess, b.cihaztur as deviceType,
        (SELECT COUNT(*) FROM sayaclar sa WHERE sa.bina_id = b.id) as sayacSayisi
      FROM binalar b
      LEFT JOIN siteler s ON b.site_id = s.id
      WHERE b.imei IS NOT NULL AND b.imei != '' AND LEN(b.imei) > 5
      ORDER BY b.sonerisim DESC
    `);

    res.json({
      total: result.recordset.length,
      gateways: result.recordset
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// M-Bus okuma durumu (memory'de tutulur)
const readingJobs = new Map();

// Site bazlı toplu okuma başlat
app.post('/api/mbus/read-site', async (req, res) => {
  try {
    const { siteId } = req.body;
    if (!siteId) return res.status(400).json({ error: 'Site ID gerekli' });
    if (!pool) return res.status(500).json({ error: 'Veritabanı bağlantısı yok' });

    // Site sayaçlarını al
    const metersResult = await pool.request()
      .input('siteId', sql.Int, siteId)
      .query(`
        SELECT s.id, s.secondaryno as seriNo, s.sayacadres as adres,
          b.imei, b.bina as binaAdi, d.daireno
        FROM sayaclar s
        LEFT JOIN binalar b ON s.bina_id = b.id
        LEFT JOIN daireler d ON s.daire_id = d.id
        WHERE s.site_id = @siteId
        ORDER BY b.bina, d.daireno
      `);

    const meters = metersResult.recordset;
    const jobId = `job_${Date.now()}_${siteId}`;

    // İş durumunu kaydet
    readingJobs.set(jobId, {
      siteId,
      totalMeters: meters.length,
      completedMeters: 0,
      successCount: 0,
      errorCount: 0,
      status: 'running',
      startTime: new Date(),
      logs: [],
      results: []
    });

    // Arka planda okuma işlemini başlat
    processReadings(jobId, siteId, meters);

    res.json({
      jobId,
      message: `${meters.length} sayaç okunmaya başlandı`,
      totalMeters: meters.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Okuma işlemini simüle et (gerçek M-Bus okuma için burası değiştirilecek)
async function processReadings(jobId, siteId, meters) {
  const job = readingJobs.get(jobId);
  if (!job) return;

  // Her sayaç için ortalama 2-5 saniye okuma süresi (gerçek M-Bus okuma süresi)
  for (const meter of meters) {
    try {
      job.logs.push({
        time: new Date(),
        type: 'info',
        message: `[${meter.binaAdi}/${meter.daireno}] ${meter.seriNo} okunuyor...`
      });

      // Simüle edilmiş okuma gecikmesi (gerçek sistemde M-Bus komutu gönderilir)
      const readingTime = 2000 + Math.random() * 3000; // 2-5 saniye
      await new Promise(resolve => setTimeout(resolve, readingTime));

      // %95 başarı oranı simülasyonu
      const success = Math.random() > 0.05;

      if (success) {
        // Rastgele değerler (gerçek sistemde M-Bus'tan alınır)
        const reading = {
          meterId: meter.id,
          seriNo: meter.seriNo,
          enerji: Math.floor(Math.random() * 50000),
          hacim: Math.floor(Math.random() * 1000) / 10,
          girisSicaklik: 50 + Math.random() * 30,
          cikisSicaklik: 30 + Math.random() * 20,
          timestamp: new Date()
        };

        // Veritabanına kaydet
        if (pool) {
          await pool.request()
            .input('sayacId', sql.Int, meter.id)
            .input('enerji', sql.Float, reading.enerji)
            .input('hacim', sql.Float, reading.hacim)
            .input('girisSicaklik', sql.Float, reading.girisSicaklik)
            .input('cikisSicaklik', sql.Float, reading.cikisSicaklik)
            .input('tarih', sql.DateTime, reading.timestamp)
            .query(`
              UPDATE sayaclar SET
                enerji = @enerji,
                akis = @hacim,
                girissicaklik = @girisSicaklik,
                cikissicaklik = @cikisSicaklik,
                sontarih = @tarih,
                okuma_durum = 'Sayaç Okundu'
              WHERE id = @sayacId
            `);

          // Sayaç değerleri tablosuna ekle
          await pool.request()
            .input('sayacId', sql.Int, meter.id)
            .input('siteId', sql.Int, siteId)
            .input('enerji', sql.Float, reading.enerji)
            .input('hacim', sql.Float, reading.hacim)
            .input('girisSicaklik', sql.Float, reading.girisSicaklik)
            .input('cikisSicaklik', sql.Float, reading.cikisSicaklik)
            .input('tarih', sql.DateTime, reading.timestamp)
            .query(`
              INSERT INTO sayacdegerler (sayac_id, site_id, enerji, akis, girissicaklik, cikissicaklik, tarih)
              VALUES (@sayacId, @siteId, @enerji, @hacim, @girisSicaklik, @cikisSicaklik, @tarih)
            `);
        }

        job.successCount++;
        job.results.push({ ...reading, status: 'success' });
        job.logs.push({
          time: new Date(),
          type: 'success',
          message: `[${meter.binaAdi}/${meter.daireno}] ${meter.seriNo} başarıyla okundu: ${reading.enerji} kWh`
        });
      } else {
        job.errorCount++;
        job.results.push({ meterId: meter.id, seriNo: meter.seriNo, status: 'error' });
        job.logs.push({
          time: new Date(),
          type: 'error',
          message: `[${meter.binaAdi}/${meter.daireno}] ${meter.seriNo} okunamadı: İletişim hatası`
        });

        // Hata durumunu veritabanına yaz
        if (pool) {
          await pool.request()
            .input('sayacId', sql.Int, meter.id)
            .query(`
              UPDATE sayaclar SET okuma_hata = okuma_hata + 1 WHERE id = @sayacId
            `);
        }
      }

      job.completedMeters++;

    } catch (err) {
      job.errorCount++;
      job.logs.push({
        time: new Date(),
        type: 'error',
        message: `[${meter.seriNo}] Sistem hatası: ${err.message}`
      });
    }
  }

  job.status = 'completed';
  job.endTime = new Date();

  // Tamamlandığında AI analizi oluştur
  job.logs.push({
    time: new Date(),
    type: 'info',
    message: `Okuma tamamlandı: ${job.successCount} başarılı, ${job.errorCount} hatalı`
  });
}

// Okuma durumunu sorgula
app.get('/api/mbus/status/:jobId', async (req, res) => {
  const job = readingJobs.get(req.params.jobId);
  if (!job) {
    return res.status(404).json({ error: 'İş bulunamadı' });
  }

  res.json({
    status: job.status,
    totalMeters: job.totalMeters,
    completedMeters: job.completedMeters,
    successCount: job.successCount,
    errorCount: job.errorCount,
    progress: Math.round((job.completedMeters / job.totalMeters) * 100),
    startTime: job.startTime,
    endTime: job.endTime,
    logs: job.logs.slice(-50), // Son 50 log
    elapsedTime: job.endTime
      ? (job.endTime - job.startTime) / 1000
      : (Date.now() - job.startTime) / 1000
  });
});

// Okuma geçmişi
app.get('/api/mbus/history', async (req, res) => {
  try {
    const history = Array.from(readingJobs.entries())
      .map(([id, job]) => ({
        jobId: id,
        siteId: job.siteId,
        status: job.status,
        totalMeters: job.totalMeters,
        successCount: job.successCount,
        errorCount: job.errorCount,
        startTime: job.startTime,
        endTime: job.endTime
      }))
      .sort((a, b) => new Date(b.startTime) - new Date(a.startTime))
      .slice(0, 20);

    res.json(history);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bina bazlı toplu okuma
app.post('/api/mbus/read-building', async (req, res) => {
  try {
    const { buildingId } = req.body;
    if (!buildingId) return res.status(400).json({ error: 'Bina ID gerekli' });
    if (!pool) return res.status(500).json({ error: 'Veritabanı bağlantısı yok' });

    const buildingInfo = await pool.request()
      .input('buildingId', sql.Int, buildingId)
      .query(`SELECT site_id FROM binalar WHERE id = @buildingId`);

    if (buildingInfo.recordset.length === 0) {
      return res.status(404).json({ error: 'Bina bulunamadı' });
    }

    const siteId = buildingInfo.recordset[0].site_id;

    const metersResult = await pool.request()
      .input('buildingId', sql.Int, buildingId)
      .query(`
        SELECT s.id, s.secondaryno as seriNo, s.sayacadres as adres,
          b.imei, b.bina as binaAdi, d.daireno
        FROM sayaclar s
        LEFT JOIN binalar b ON s.bina_id = b.id
        LEFT JOIN daireler d ON s.daire_id = d.id
        WHERE s.bina_id = @buildingId
        ORDER BY d.daireno
      `);

    const meters = metersResult.recordset;
    const jobId = `job_${Date.now()}_bina_${buildingId}`;

    readingJobs.set(jobId, {
      siteId,
      buildingId,
      totalMeters: meters.length,
      completedMeters: 0,
      successCount: 0,
      errorCount: 0,
      status: 'running',
      startTime: new Date(),
      logs: [],
      results: []
    });

    processReadings(jobId, siteId, meters);

    res.json({
      jobId,
      message: `${meters.length} sayaç okunmaya başlandı`,
      totalMeters: meters.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// 📡 GELİŞMİŞ GATEWAY YÖNETİM API'leri
// ============================================

// Gateway detay bilgisi
app.get('/api/gateways/:id', async (req, res) => {
  try {
    if (!pool) return res.status(500).json({ error: 'Veritabanı bağlantısı yok' });

    const result = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query(`
        SELECT b.*, s.site as siteName, s.il as city, s.ilce as district,
          (SELECT COUNT(*) FROM sayaclar sa WHERE sa.bina_id = b.id) as sayacSayisi,
          (SELECT COUNT(*) FROM daireler d WHERE d.bina_id = b.id) as daireSayisi
        FROM binalar b
        LEFT JOIN siteler s ON b.site_id = s.id
        WHERE b.id = @id
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Gateway bulunamadı' });
    }

    const gateway = result.recordset[0];

    // TCP bağlantı durumu
    const tcpStatus = gatewayManager.getGatewayStatus(gateway.imei);

    res.json({
      ...gateway,
      tcpConnected: tcpStatus.connected,
      tcpLastSeen: tcpStatus.lastSeen
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Gateway istatistikleri
app.get('/api/gateways/stats/overview', async (req, res) => {
  try {
    if (!pool) return res.status(500).json({ error: 'Veritabanı bağlantısı yok' });

    const result = await pool.request().query(`
      SELECT
        COUNT(*) as toplamGateway,
        SUM(CASE WHEN sonerisim >= DATEADD(hour, -1, GETDATE()) THEN 1 ELSE 0 END) as sonBirSaatAktif,
        SUM(CASE WHEN sonerisim >= DATEADD(day, -1, GETDATE()) THEN 1 ELSE 0 END) as sonBirGunAktif,
        SUM(CASE WHEN sonerisim >= DATEADD(day, -7, GETDATE()) THEN 1 ELSE 0 END) as sonBirHaftaAktif,
        SUM(CASE WHEN modemip IS NOT NULL AND modemip != '' THEN 1 ELSE 0 END) as modemIPOlan,
        SUM(CASE WHEN cihaztur = 'Orion' THEN 1 ELSE 0 END) as orionSayisi,
        SUM(CASE WHEN cihaztur = 'Wimbus' THEN 1 ELSE 0 END) as wimbusSayisi
      FROM binalar
      WHERE imei IS NOT NULL AND LEN(imei) > 5
    `);

    const stats = result.recordset[0];
    const tcpConnected = gatewayManager.getConnectedGateways().length;

    res.json({
      ...stats,
      tcpConnected
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Gateway'e komut gönder (test ping) - Veritabanı durumuna göre
app.post('/api/gateways/:id/ping', async (req, res) => {
  try {
    if (!pool) return res.status(500).json({ error: 'Veritabanı bağlantısı yok' });

    const gateway = await pool.request()
      .input('id', sql.Int, req.params.id)
      .query(`
        SELECT b.imei, b.bina, b.modemip, b.sonerisim, b.cihaztur,
          s.site as siteName
        FROM binalar b
        LEFT JOIN siteler s ON b.site_id = s.id
        WHERE b.id = @id
      `);

    if (gateway.recordset.length === 0) {
      return res.status(404).json({ error: 'Gateway bulunamadı' });
    }

    const gw = gateway.recordset[0];
    const lastAccess = gw.sonerisim ? new Date(gw.sonerisim) : null;
    const hourAgo = new Date(Date.now() - 3600000);
    const dayAgo = new Date(Date.now() - 86400000);

    let status = 'offline';
    let statusText = 'Çevrimdışı';

    if (lastAccess) {
      if (lastAccess > hourAgo) {
        status = 'online';
        statusText = 'Çevrimiçi - Son 1 saat içinde aktif';
      } else if (lastAccess > dayAgo) {
        status = 'warning';
        statusText = 'Uyarı - Son 24 saat içinde aktif';
      } else {
        statusText = 'Çevrimdışı - Uzun süredir bağlantı yok';
      }
    }

    res.json({
      success: status === 'online',
      status,
      message: statusText,
      gateway: {
        name: gw.bina,
        imei: gw.imei,
        ip: gw.modemip,
        type: gw.cihaztur,
        site: gw.siteName
      },
      lastAccess: lastAccess,
      timeSinceAccess: lastAccess ? Math.round((Date.now() - lastAccess) / 60000) + ' dakika önce' : 'Bilinmiyor'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// ⏰ OTOMATİK OKUMA ZAMANLAYICI API'leri
// ============================================

// Zamanlanmış okumaları listele
app.get('/api/schedule/jobs', async (req, res) => {
  try {
    if (!pool) return res.status(500).json({ error: 'Veritabanı bağlantısı yok' });

    // Veritabanından otomatik okuma ayarlı binaları getir
    const result = await pool.request().query(`
      SELECT
        b.id, b.bina as name, b.imei, b.site_id,
        b.otomatikokuma, b.otomatik_okuma_gun, b.otomatik_okuma_saat,
        b.aylikokunacakgunler,
        s.site as siteName, s.il as city,
        (SELECT COUNT(*) FROM sayaclar sa WHERE sa.bina_id = b.id) as sayacSayisi
      FROM binalar b
      LEFT JOIN siteler s ON b.site_id = s.id
      WHERE b.otomatikokuma = 1 AND b.imei IS NOT NULL
      ORDER BY b.otomatik_okuma_saat
    `);

    res.json({
      total: result.recordset.length,
      jobs: result.recordset
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Otomatik okuma ayarla
app.post('/api/schedule/set', async (req, res) => {
  try {
    const { buildingId, enabled, day, time, monthlyDays } = req.body;
    if (!buildingId) return res.status(400).json({ error: 'Bina ID gerekli' });
    if (!pool) return res.status(500).json({ error: 'Veritabanı bağlantısı yok' });

    await pool.request()
      .input('id', sql.Int, buildingId)
      .input('enabled', sql.Int, enabled ? 1 : 0)
      .input('day', sql.Int, day || 0)
      .input('time', sql.Time, time || '09:00')
      .input('monthlyDays', sql.NVarChar, monthlyDays || '')
      .query(`
        UPDATE binalar SET
          otomatikokuma = @enabled,
          otomatik_okuma_gun = @day,
          otomatik_okuma_saat = @time,
          aylikokunacakgunler = @monthlyDays
        WHERE id = @id
      `);

    res.json({
      success: true,
      message: enabled ? 'Otomatik okuma aktifleştirildi' : 'Otomatik okuma devre dışı'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Site için toplu zamanlama
app.post('/api/schedule/site', async (req, res) => {
  try {
    const { siteId, enabled, time, monthlyDays } = req.body;
    if (!siteId) return res.status(400).json({ error: 'Site ID gerekli' });
    if (!pool) return res.status(500).json({ error: 'Veritabanı bağlantısı yok' });

    const result = await pool.request()
      .input('siteId', sql.Int, siteId)
      .input('enabled', sql.Int, enabled ? 1 : 0)
      .input('time', sql.Time, time || '09:00')
      .input('monthlyDays', sql.NVarChar, monthlyDays || '')
      .query(`
        UPDATE binalar SET
          otomatikokuma = @enabled,
          otomatik_okuma_saat = @time,
          aylikokunacakgunler = @monthlyDays
        WHERE site_id = @siteId AND imei IS NOT NULL;
        SELECT @@ROWCOUNT as affected;
      `);

    res.json({
      success: true,
      affectedBuildings: result.recordset[0]?.affected || 0,
      message: `${result.recordset[0]?.affected || 0} bina güncellendi`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// 💵 GELİŞMİŞ FATURALANDIRMA API'leri
// ============================================

// Site bazlı detaylı fatura analizi
app.get('/api/billing/analysis/:siteId', async (req, res) => {
  try {
    if (!pool) return res.status(500).json({ error: 'Veritabanı bağlantısı yok' });

    const { siteId } = req.params;
    const { months = 6 } = req.query;

    // Site bilgisi
    const siteInfo = await pool.request()
      .input('siteId', sql.Int, siteId)
      .query(`
        SELECT st.*, f.firma as firmaAdi,
          (SELECT COUNT(*) FROM daireler WHERE site_id = @siteId) as daireSayisi,
          (SELECT COUNT(*) FROM sayaclar WHERE site_id = @siteId) as sayacSayisi
        FROM siteler st
        LEFT JOIN firmalar f ON st.firma_id = f.id
        WHERE st.id = @siteId
      `);

    if (siteInfo.recordset.length === 0) {
      return res.status(404).json({ error: 'Site bulunamadı' });
    }

    // Aylık tüketim trendi
    const monthlyTrend = await pool.request()
      .input('siteId', sql.Int, siteId)
      .input('months', sql.Int, parseInt(months))
      .query(`
        SELECT TOP (@months)
          FORMAT(tarih, 'yyyy-MM') as ay,
          SUM(enerji) as toplamEnerji,
          SUM(tuketim) as toplamTuketim,
          COUNT(DISTINCT sayac_id) as sayacSayisi,
          AVG(enerji) as ortalamaEnerji
        FROM sayacdegerler
        WHERE site_id = @siteId
        GROUP BY FORMAT(tarih, 'yyyy-MM')
        ORDER BY FORMAT(tarih, 'yyyy-MM') DESC
      `);

    // Daire bazlı tüketim dağılımı
    const unitConsumption = await pool.request()
      .input('siteId', sql.Int, siteId)
      .query(`
        SELECT TOP 20
          d.daireno, d.isim as malik, b.bina as binaAdi,
          s.toplamtuketim as tuketim, s.enerji,
          s.sontarih as sonOkuma
        FROM daireler d
        LEFT JOIN sayaclar s ON s.daire_id = d.id
        LEFT JOIN binalar b ON d.bina_id = b.id
        WHERE d.site_id = @siteId
        ORDER BY s.enerji DESC
      `);

    // Tüketim istatistikleri
    const stats = await pool.request()
      .input('siteId', sql.Int, siteId)
      .query(`
        SELECT
          ISNULL(SUM(enerji), 0) as toplamEnerji,
          ISNULL(SUM(toplamtuketim), 0) as toplamTuketim,
          ISNULL(AVG(enerji), 0) as ortalamaEnerji,
          ISNULL(MIN(enerji), 0) as minEnerji,
          ISNULL(MAX(enerji), 0) as maxEnerji,
          ISNULL(STDEV(enerji), 0) as stdEnerji
        FROM sayaclar
        WHERE site_id = @siteId AND enerji > 0
      `);

    res.json({
      site: siteInfo.recordset[0],
      stats: stats.recordset[0],
      monthlyTrend: monthlyTrend.recordset,
      topConsumers: unitConsumption.recordset
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fatura karşılaştırma
app.post('/api/billing/compare', async (req, res) => {
  try {
    const { siteId, period1, period2 } = req.body;
    if (!siteId) return res.status(400).json({ error: 'Site ID gerekli' });
    if (!pool) return res.status(500).json({ error: 'Veritabanı bağlantısı yok' });

    const getPeriodData = async (period) => {
      const result = await pool.request()
        .input('siteId', sql.Int, siteId)
        .input('startDate', sql.Date, period.start)
        .input('endDate', sql.Date, period.end)
        .query(`
          SELECT
            SUM(enerji) as toplamEnerji,
            SUM(tuketim) as toplamTuketim,
            COUNT(DISTINCT sayac_id) as sayacSayisi,
            AVG(enerji) as ortalamaEnerji
          FROM sayacdegerler
          WHERE site_id = @siteId
            AND tarih >= @startDate
            AND tarih <= @endDate
        `);
      return result.recordset[0];
    };

    const data1 = await getPeriodData(period1);
    const data2 = await getPeriodData(period2);

    const change = {
      enerji: data2.toplamEnerji - data1.toplamEnerji,
      enerjiPercent: data1.toplamEnerji > 0
        ? ((data2.toplamEnerji - data1.toplamEnerji) / data1.toplamEnerji * 100).toFixed(2)
        : 0
    };

    res.json({
      period1: { ...period1, data: data1 },
      period2: { ...period2, data: data2 },
      change,
      analysis: change.enerjiPercent > 10
        ? 'Tüketimde önemli artış var'
        : change.enerjiPercent < -10
          ? 'Tüketimde önemli azalma var'
          : 'Tüketim stabil'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Otomatik fatura dağıtımı kaydet
app.post('/api/billing/save-distribution', async (req, res) => {
  try {
    const { siteId, period, totalAmount, distribution, notes } = req.body;
    if (!siteId || !distribution) {
      return res.status(400).json({ error: 'Eksik parametreler' });
    }

    const record = {
      id: `bill_${Date.now()}`,
      siteId,
      period: period || { month: new Date().getMonth() + 1, year: new Date().getFullYear() },
      totalAmount,
      distribution,
      notes,
      createdAt: new Date(),
      status: 'created'
    };

    billingHistory.push(record);

    // Son 100 kayıt tut
    if (billingHistory.length > 100) {
      billingHistory.shift();
    }

    res.json({
      success: true,
      billId: record.id,
      message: 'Fatura dağıtımı kaydedildi'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fatura geçmişi
app.get('/api/billing/history', async (req, res) => {
  try {
    const { siteId, limit = 20 } = req.query;

    let history = billingHistory;
    if (siteId) {
      history = history.filter(b => b.siteId === parseInt(siteId));
    }

    res.json(history.slice(-parseInt(limit)).reverse());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// 🏢 BİNA YÖNETİM SİSTEMİ API'leri
// ============================================

// Bina yönetim dashboard
app.get('/api/building-management/dashboard', async (req, res) => {
  try {
    if (!pool) return res.status(500).json({ error: 'Veritabanı bağlantısı yok' });

    // Genel istatistikler
    const stats = await pool.request().query(`
      SELECT
        (SELECT COUNT(*) FROM siteler) as toplamSite,
        (SELECT COUNT(*) FROM binalar) as toplamBina,
        (SELECT COUNT(*) FROM daireler) as toplamDaire,
        (SELECT COUNT(*) FROM sayaclar) as toplamSayac,
        (SELECT COUNT(*) FROM binalar WHERE imei IS NOT NULL AND LEN(imei) > 5) as gatewaylieBina,
        (SELECT COUNT(*) FROM binalar WHERE sonerisim >= DATEADD(day, -1, GETDATE())) as aktifGateway,
        (SELECT ISNULL(SUM(enerji), 0) FROM sayaclar) as toplamEnerji,
        (SELECT ISNULL(SUM(toplamtuketim), 0) FROM sayaclar) as toplamTuketim,
        (SELECT COUNT(*) FROM sayaclar WHERE okuma_hata > 0) as hataliSayac,
        (SELECT COUNT(*) FROM sayaclar WHERE sontarih >= DATEADD(day, -1, GETDATE())) as bugunOkunan
    `);

    // Son okumaları yapılan binalar
    const recentReadings = await pool.request().query(`
      SELECT TOP 10
        b.id, b.bina as name, b.sonerisim, s.site as siteName,
        (SELECT COUNT(*) FROM sayaclar WHERE bina_id = b.id) as sayacSayisi
      FROM binalar b
      LEFT JOIN siteler s ON b.site_id = s.id
      WHERE b.sonerisim IS NOT NULL
      ORDER BY b.sonerisim DESC
    `);

    // Hatalı sayaçlar
    const errorMeters = await pool.request().query(`
      SELECT TOP 10
        sa.id, sa.secondaryno as seriNo, sa.okuma_hata as hataSayisi,
        b.bina as binaAdi, s.site as siteAdi
      FROM sayaclar sa
      LEFT JOIN binalar b ON sa.bina_id = b.id
      LEFT JOIN siteler s ON sa.site_id = s.id
      WHERE sa.okuma_hata > 0
      ORDER BY sa.okuma_hata DESC
    `);

    res.json({
      stats: stats.recordset[0],
      recentReadings: recentReadings.recordset,
      errorMeters: errorMeters.recordset
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Site tüm detayları
app.get('/api/building-management/site/:siteId/full', async (req, res) => {
  try {
    if (!pool) return res.status(500).json({ error: 'Veritabanı bağlantısı yok' });

    const { siteId } = req.params;

    // Site bilgisi
    const siteInfo = await pool.request()
      .input('siteId', sql.Int, siteId)
      .query(`
        SELECT st.*, f.firma as firmaAdi
        FROM siteler st
        LEFT JOIN firmalar f ON st.firma_id = f.id
        WHERE st.id = @siteId
      `);

    if (siteInfo.recordset.length === 0) {
      return res.status(404).json({ error: 'Site bulunamadı' });
    }

    // Binalar
    const buildings = await pool.request()
      .input('siteId', sql.Int, siteId)
      .query(`
        SELECT b.*,
          (SELECT COUNT(*) FROM daireler WHERE bina_id = b.id) as daireSayisi,
          (SELECT COUNT(*) FROM sayaclar WHERE bina_id = b.id) as sayacSayisi,
          (SELECT ISNULL(SUM(enerji), 0) FROM sayaclar WHERE bina_id = b.id) as toplamEnerji
        FROM binalar b
        WHERE b.site_id = @siteId
        ORDER BY b.bina
      `);

    // Daireler
    const apartments = await pool.request()
      .input('siteId', sql.Int, siteId)
      .query(`
        SELECT d.*, b.bina as binaAdi,
          (SELECT TOP 1 enerji FROM sayaclar WHERE daire_id = d.id) as enerji,
          (SELECT TOP 1 toplamtuketim FROM sayaclar WHERE daire_id = d.id) as tuketim
        FROM daireler d
        LEFT JOIN binalar b ON d.bina_id = b.id
        WHERE d.site_id = @siteId
        ORDER BY b.bina, d.daireno
      `);

    // Sayaçlar
    const meters = await pool.request()
      .input('siteId', sql.Int, siteId)
      .query(`
        SELECT s.*, d.daireno, d.isim as malik, b.bina as binaAdi
        FROM sayaclar s
        LEFT JOIN daireler d ON s.daire_id = d.id
        LEFT JOIN binalar b ON s.bina_id = b.id
        WHERE s.site_id = @siteId
        ORDER BY b.bina, d.daireno
      `);

    res.json({
      site: siteInfo.recordset[0],
      buildings: buildings.recordset,
      apartments: apartments.recordset,
      meters: meters.recordset,
      summary: {
        totalBuildings: buildings.recordset.length,
        totalApartments: apartments.recordset.length,
        totalMeters: meters.recordset.length,
        totalEnergy: meters.recordset.reduce((sum, m) => sum + (m.enerji || 0), 0)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// 💰 FATURALANDIRMA OTOMATİK API'leri
// ============================================

// Fatura özeti getir
app.get('/api/billing/summary', async (req, res) => {
  try {
    if (!pool) return res.status(500).json({ error: 'Veritabanı bağlantısı yok' });

    const { siteId, month, year } = req.query;
    const currentMonth = month || new Date().getMonth() + 1;
    const currentYear = year || new Date().getFullYear();

    let query = `
      SELECT
        st.id as siteId, st.site as siteName, st.il, st.ilce,
        COUNT(DISTINCT s.id) as sayacSayisi,
        ISNULL(SUM(s.toplamtuketim), 0) as toplamTuketim,
        ISNULL(SUM(s.enerji), 0) as toplamEnerji,
        ISNULL(AVG(s.enerji), 0) as ortalamaEnerji
      FROM siteler st
      LEFT JOIN sayaclar s ON s.site_id = st.id
      WHERE 1=1
    `;

    const request = pool.request();
    if (siteId) {
      query += ` AND st.id = @siteId`;
      request.input('siteId', sql.Int, siteId);
    }

    query += ` GROUP BY st.id, st.site, st.il, st.ilce ORDER BY st.site`;

    const result = await request.query(query);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Site için fatura oluştur
app.post('/api/billing/generate', async (req, res) => {
  try {
    const { siteId, month, year, birimFiyat = 0.25 } = req.body;
    if (!siteId) return res.status(400).json({ error: 'Site ID gerekli' });
    if (!pool) return res.status(500).json({ error: 'Veritabanı bağlantısı yok' });

    const currentMonth = month || new Date().getMonth() + 1;
    const currentYear = year || new Date().getFullYear();

    // Site ve sayaç verilerini al
    const siteData = await pool.request()
      .input('siteId', sql.Int, siteId)
      .query(`
        SELECT
          st.id, st.site, st.il, st.ilce, st.adres,
          f.firma as firmaAdi
        FROM siteler st
        LEFT JOIN firmalar f ON st.firma_id = f.id
        WHERE st.id = @siteId
      `);

    if (siteData.recordset.length === 0) {
      return res.status(404).json({ error: 'Site bulunamadı' });
    }

    const site = siteData.recordset[0];

    // Daire bazlı tüketim verilerini al
    const consumptionData = await pool.request()
      .input('siteId', sql.Int, siteId)
      .query(`
        SELECT
          d.id as daireId, d.daireno, d.isim as maliksim,
          s.id as sayacId, s.secondaryno as seriNo,
          s.toplamtuketim as tuketim, s.enerji,
          b.bina as binaAdi
        FROM daireler d
        LEFT JOIN sayaclar s ON s.daire_id = d.id
        LEFT JOIN binalar b ON d.bina_id = b.id
        WHERE d.site_id = @siteId
        ORDER BY b.bina, d.daireno
      `);

    // Faturaları hesapla
    const faturalar = consumptionData.recordset.map(daire => {
      const tuketim = daire.tuketim || 0;
      const enerji = daire.enerji || 0;
      const tutar = tuketim * birimFiyat;

      return {
        daireId: daire.daireId,
        daireno: daire.daireno,
        malik: daire.maliksim,
        binaAdi: daire.binaAdi,
        sayacSeriNo: daire.seriNo,
        tuketim,
        enerji,
        birimFiyat,
        tutar: Math.round(tutar * 100) / 100,
        kdv: Math.round(tutar * 0.20 * 100) / 100,
        genelToplam: Math.round(tutar * 1.20 * 100) / 100
      };
    });

    const toplamTuketim = faturalar.reduce((sum, f) => sum + f.tuketim, 0);
    const toplamTutar = faturalar.reduce((sum, f) => sum + f.genelToplam, 0);

    // AI ile fatura analizi yap
    let aiAnalysis = '';
    try {
      const aiPrompt = `
        Aşağıdaki site için fatura analizi yap:
        Site: ${site.site}
        Konum: ${site.il} / ${site.ilce}
        Toplam Daire: ${faturalar.length}
        Toplam Tüketim: ${toplamTuketim} kWh
        Toplam Tutar: ${toplamTutar.toFixed(2)} TL
        Dönem: ${currentMonth}/${currentYear}

        En yüksek tüketen 3 daire:
        ${faturalar.sort((a, b) => b.tuketim - a.tuketim).slice(0, 3).map(f =>
          `- ${f.daireno}: ${f.tuketim} kWh (${f.genelToplam.toFixed(2)} TL)`
        ).join('\n')}

        Lütfen:
        1. Genel tüketim değerlendirmesi yap
        2. Anormal tüketim var mı kontrol et
        3. Tasarruf önerileri sun
      `;

      const aiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: aiPrompt }] }],
            generationConfig: { temperature: 0.5, maxOutputTokens: 512 }
          })
        }
      );

      const aiData = await aiResponse.json();
      aiAnalysis = aiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } catch (aiErr) {
      console.error('AI analizi hatası:', aiErr);
    }

    res.json({
      site: {
        id: site.id,
        name: site.site,
        city: site.il,
        district: site.ilce,
        address: site.adres,
        company: site.firmaAdi
      },
      period: {
        month: currentMonth,
        year: currentYear
      },
      summary: {
        totalUnits: faturalar.length,
        totalConsumption: toplamTuketim,
        totalAmount: Math.round(toplamTutar * 100) / 100,
        averageConsumption: Math.round(toplamTuketim / faturalar.length * 100) / 100,
        unitPrice: birimFiyat
      },
      invoices: faturalar,
      aiAnalysis
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Gelen faturayı işle ve dağıt
app.post('/api/billing/distribute', async (req, res) => {
  try {
    const { siteId, totalAmount, period, distributionMethod = 'consumption' } = req.body;
    if (!siteId || !totalAmount) {
      return res.status(400).json({ error: 'Site ID ve toplam tutar gerekli' });
    }
    if (!pool) return res.status(500).json({ error: 'Veritabanı bağlantısı yok' });

    // Site tüketim verilerini al
    const consumptionData = await pool.request()
      .input('siteId', sql.Int, siteId)
      .query(`
        SELECT
          d.id as daireId, d.daireno, d.isim,
          s.toplamtuketim as tuketim, s.enerji,
          b.bina as binaAdi
        FROM daireler d
        LEFT JOIN sayaclar s ON s.daire_id = d.id
        LEFT JOIN binalar b ON d.bina_id = b.id
        WHERE d.site_id = @siteId
      `);

    const daireler = consumptionData.recordset;
    const toplamTuketim = daireler.reduce((sum, d) => sum + (d.tuketim || 0), 0);

    let distribution = [];

    if (distributionMethod === 'consumption' && toplamTuketim > 0) {
      // Tüketime göre oransal dağıtım
      distribution = daireler.map(daire => {
        const tuketim = daire.tuketim || 0;
        const oran = tuketim / toplamTuketim;
        const pay = totalAmount * oran;

        return {
          daireId: daire.daireId,
          daireno: daire.daireno,
          malik: daire.isim,
          binaAdi: daire.binaAdi,
          tuketim,
          oran: Math.round(oran * 10000) / 100, // Yüzde olarak
          pay: Math.round(pay * 100) / 100
        };
      });
    } else {
      // Eşit dağıtım
      const payPerUnit = totalAmount / daireler.length;
      distribution = daireler.map(daire => ({
        daireId: daire.daireId,
        daireno: daire.daireno,
        malik: daire.isim,
        binaAdi: daire.binaAdi,
        tuketim: daire.tuketim || 0,
        oran: Math.round(10000 / daireler.length) / 100,
        pay: Math.round(payPerUnit * 100) / 100
      }));
    }

    // AI ile dağıtım analizi
    let aiAnalysis = '';
    try {
      const highConsumers = distribution
        .sort((a, b) => b.pay - a.pay)
        .slice(0, 5);

      const aiPrompt = `
        Enerji faturası dağıtım analizi yap:
        Toplam Fatura: ${totalAmount} TL
        Dağıtım Yöntemi: ${distributionMethod === 'consumption' ? 'Tüketime Göre' : 'Eşit'}
        Toplam Daire: ${daireler.length}
        Toplam Tüketim: ${toplamTuketim} kWh

        En yüksek paylı 5 daire:
        ${highConsumers.map(d => `- ${d.daireno}: %${d.oran} (${d.pay.toFixed(2)} TL)`).join('\n')}

        Dağıtımın adaletli olup olmadığını değerlendir ve öneriler sun.
      `;

      const aiResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: aiPrompt }] }],
            generationConfig: { temperature: 0.5, maxOutputTokens: 512 }
          })
        }
      );

      const aiData = await aiResponse.json();
      aiAnalysis = aiData.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } catch (aiErr) {
      console.error('AI analizi hatası:', aiErr);
    }

    res.json({
      totalAmount,
      totalConsumption: toplamTuketim,
      unitCount: daireler.length,
      distributionMethod,
      distribution: distribution.sort((a, b) => {
        const binaA = String(a.binaAdi || '');
        const binaB = String(b.binaAdi || '');
        if (binaA !== binaB) return binaA.localeCompare(binaB);
        return (a.daireno || 0) - (b.daireno || 0);
      }),
      aiAnalysis
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fatura raporu oluştur (Excel/PDF için veri)
app.get('/api/billing/report/:siteId', async (req, res) => {
  try {
    if (!pool) return res.status(500).json({ error: 'Veritabanı bağlantısı yok' });

    const { siteId } = req.params;
    const { format = 'json' } = req.query;

    // Site bilgisi
    const siteInfo = await pool.request()
      .input('siteId', sql.Int, siteId)
      .query(`
        SELECT st.*, f.firma as firmaAdi
        FROM siteler st
        LEFT JOIN firmalar f ON st.firma_id = f.id
        WHERE st.id = @siteId
      `);

    if (siteInfo.recordset.length === 0) {
      return res.status(404).json({ error: 'Site bulunamadı' });
    }

    // Detaylı rapor verisi
    const reportData = await pool.request()
      .input('siteId', sql.Int, siteId)
      .query(`
        SELECT
          b.bina as BinaAdi,
          d.daireno as DaireNo,
          d.isim as MalikIsmi,
          s.secondaryno as SayacSeriNo,
          s.toplamtuketim as Tuketim,
          s.enerji as Enerji,
          s.sontarih as SonOkuma
        FROM daireler d
        LEFT JOIN sayaclar s ON s.daire_id = d.id
        LEFT JOIN binalar b ON d.bina_id = b.id
        WHERE d.site_id = @siteId
        ORDER BY b.bina, d.daireno
      `);

    res.json({
      site: siteInfo.recordset[0],
      report: reportData.recordset,
      generatedAt: new Date(),
      format
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// 🔧 YARDIMCI API'ler
// ============================================

// Bağlantı durumu
app.get('/api/status', async (req, res) => {
  res.json({
    connected: pool !== null,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    aiEnabled: !!GEMINI_API_KEY
  });
});

// Tablo listesi
app.get('/api/tables', async (req, res) => {
  try {
    if (!pool) return res.status(500).json({ error: 'Veritabanı bağlantısı yok' });

    const result = await pool.request().query(`
      SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_TYPE = 'BASE TABLE' ORDER BY TABLE_NAME
    `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Tablo sütunları
app.get('/api/columns/:table', async (req, res) => {
  try {
    if (!pool) return res.status(500).json({ error: 'Veritabanı bağlantısı yok' });

    const result = await pool.request()
      .input('table', sql.NVarChar, req.params.table)
      .query(`
        SELECT COLUMN_NAME, DATA_TYPE, CHARACTER_MAXIMUM_LENGTH
        FROM INFORMATION_SCHEMA.COLUMNS
        WHERE TABLE_NAME = @table ORDER BY ORDINAL_POSITION
      `);
    res.json(result.recordset);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// 🔴 CANLI M-BUS OKUMA API'leri
// ============================================

// Bağlı TCP gateway'leri listele
app.get('/api/mbus/live/gateways', (req, res) => {
  try {
    const connectedGateways = gatewayManager.getConnectedGateways();
    res.json({
      total: connectedGateways.length,
      gateways: connectedGateways.map(gw => ({
        imei: gw.imei,
        ip: gw.ip,
        port: gw.port,
        connected: gw.connected,
        lastSeen: gw.lastSeen
      }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Gateway durumunu sorgula
app.get('/api/mbus/live/gateway/:imei/status', (req, res) => {
  try {
    const { imei } = req.params;
    const status = gatewayManager.getGatewayStatus(imei);
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Tek sayaç oku (gerçek M-Bus komutu)
app.post('/api/mbus/live/read-meter', async (req, res) => {
  try {
    const { imei, primaryAddress } = req.body;

    if (!imei || primaryAddress === undefined) {
      return res.status(400).json({ error: 'IMEI ve primaryAddress gerekli' });
    }

    const status = gatewayManager.getGatewayStatus(imei);
    if (!status.connected) {
      return res.status(400).json({ error: 'Gateway bağlı değil' });
    }

    console.log(`[M-Bus Live] Sayaç okuma başlatılıyor: ${imei}/${primaryAddress}`);

    const reading = await gatewayManager.readMeter(imei, primaryAddress);

    if (reading) {
      // Veritabanına kaydet (opsiyonel)
      if (pool) {
        try {
          const energyValue = reading.values.find(v => v.unit === 'kWh' || v.unit === 'Wh');
          const volumeValue = reading.values.find(v => v.unit === 'm³' || v.unit === 'L');
          const tempValue = reading.values.find(v => v.unit === '°C');

          if (energyValue || volumeValue) {
            await pool.request()
              .input('primaryAddress', sql.Int, primaryAddress)
              .input('energy', sql.Float, energyValue?.value || 0)
              .input('volume', sql.Float, volumeValue?.value || 0)
              .input('temp', sql.Float, tempValue?.value || 0)
              .query(`
                UPDATE sayaclar SET
                  enerji = @energy,
                  akis = @volume,
                  sicaklik = @temp,
                  sontarih = GETDATE(),
                  okuma_hata = 0
                WHERE sayacadres = @primaryAddress
              `);
          }
        } catch (dbErr) {
          console.error('[M-Bus Live] DB kayıt hatası:', dbErr.message);
        }
      }

      res.json({
        success: true,
        reading: {
          address: reading.address,
          timestamp: new Date().toISOString(),
          values: reading.values
        }
      });
    } else {
      res.json({
        success: false,
        error: 'Okuma başarısız veya timeout'
      });
    }
  } catch (err) {
    console.error('[M-Bus Live] Hata:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Gateway'deki tüm sayaçları tarama (broadcast)
app.post('/api/mbus/live/scan-gateway', async (req, res) => {
  try {
    const { imei, startAddress = 1, endAddress = 250 } = req.body;

    if (!imei) {
      return res.status(400).json({ error: 'IMEI gerekli' });
    }

    const status = gatewayManager.getGatewayStatus(imei);
    if (!status.connected) {
      return res.status(400).json({ error: 'Gateway bağlı değil' });
    }

    const foundMeters = [];

    for (let addr = startAddress; addr <= Math.min(endAddress, 250); addr++) {
      try {
        const reading = await gatewayManager.readMeter(imei, addr);
        if (reading && reading.values.length > 0) {
          foundMeters.push({
            address: addr,
            values: reading.values
          });
        }
      } catch (err) {
        // Adres bulunamadı, devam et
      }
    }

    res.json({
      imei,
      scannedRange: { startAddress, endAddress },
      foundMeters,
      totalFound: foundMeters.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Canlı okuma stream'i başlat (WebSocket benzeri polling için)
const liveReadingSessions = new Map();

app.post('/api/mbus/live/start-session', async (req, res) => {
  try {
    const { imei, meterAddresses, interval = 5000 } = req.body;

    if (!imei || !meterAddresses || !Array.isArray(meterAddresses)) {
      return res.status(400).json({ error: 'IMEI ve meterAddresses listesi gerekli' });
    }

    const sessionId = `live_${Date.now()}_${imei}`;

    liveReadingSessions.set(sessionId, {
      imei,
      meterAddresses,
      interval,
      status: 'running',
      startTime: new Date(),
      readings: [],
      lastReading: null
    });

    // Arka planda okuma döngüsü başlat
    startLiveReadingLoop(sessionId);

    res.json({
      sessionId,
      message: `Canlı okuma oturumu başlatıldı`,
      meterCount: meterAddresses.length,
      interval
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Canlı okuma döngüsü
async function startLiveReadingLoop(sessionId) {
  const session = liveReadingSessions.get(sessionId);
  if (!session) return;

  while (session.status === 'running' && liveReadingSessions.has(sessionId)) {
    const status = gatewayManager.getGatewayStatus(session.imei);

    if (status.connected) {
      for (const address of session.meterAddresses) {
        if (session.status !== 'running') break;

        try {
          const reading = await gatewayManager.readMeter(session.imei, address);
          if (reading) {
            const readingData = {
              address,
              timestamp: new Date().toISOString(),
              values: reading.values
            };
            session.readings.push(readingData);
            session.lastReading = readingData;

            // Sadece son 100 okumayı tut
            if (session.readings.length > 100) {
              session.readings = session.readings.slice(-100);
            }
          }
        } catch (err) {
          console.error(`[Live] Okuma hatası ${address}:`, err.message);
        }
      }
    }

    // Belirtilen aralık kadar bekle
    await new Promise(resolve => setTimeout(resolve, session.interval));
  }
}

// Canlı okuma verilerini al
app.get('/api/mbus/live/session/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;
    const { since } = req.query;

    const session = liveReadingSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Oturum bulunamadı' });
    }

    let readings = session.readings;

    // Belirli zamandan sonraki okumaları filtrele
    if (since) {
      const sinceDate = new Date(since);
      readings = readings.filter(r => new Date(r.timestamp) > sinceDate);
    }

    res.json({
      sessionId,
      status: session.status,
      startTime: session.startTime,
      meterAddresses: session.meterAddresses,
      lastReading: session.lastReading,
      readings,
      readingCount: session.readings.length
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Canlı okuma oturumunu durdur
app.post('/api/mbus/live/stop-session/:sessionId', (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = liveReadingSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Oturum bulunamadı' });
    }

    session.status = 'stopped';
    session.endTime = new Date();

    res.json({
      sessionId,
      message: 'Oturum durduruldu',
      totalReadings: session.readings.length,
      duration: (session.endTime - session.startTime) / 1000
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Tüm aktif oturumları listele
app.get('/api/mbus/live/sessions', (req, res) => {
  try {
    const sessions = Array.from(liveReadingSessions.entries()).map(([id, session]) => ({
      sessionId: id,
      imei: session.imei,
      status: session.status,
      meterCount: session.meterAddresses.length,
      readingCount: session.readings.length,
      startTime: session.startTime,
      lastReading: session.lastReading?.timestamp
    }));

    res.json({
      total: sessions.length,
      active: sessions.filter(s => s.status === 'running').length,
      sessions
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// M-Bus sayaç veri formatları (firmware yapısına göre)
app.get('/api/mbus/data-format', (req, res) => {
  res.json({
    heatMeter: {
      description: 'Ultrasonik Isı Sayacı Veri Yapısı',
      fields: {
        heat_high_resolution: 'Isı enerjisi (yüksek çözünürlük) - Wh/kWh',
        cool_high_resolution: 'Soğutma enerjisi (yüksek çözünürlük) - Wh/kWh',
        volume_high_resolution: 'Hacim (yüksek çözünürlük) - L/m³',
        T_inlet: 'Giriş sıcaklığı (T1) - 0.01°C',
        T_outlet: 'Çıkış sıcaklığı (T2) - 0.01°C',
        T_diff: 'Sıcaklık farkı (ΔT) - 0.01°C',
        volume_velosity: 'Anlık debi - L/h',
        power: 'Anlık güç - W',
        work_hours: 'Çalışma saati',
        sys_flag: 'Sistem durumu bayrakları'
      },
      sysFlags: {
        bat_err: 0x0001,
        T_err: 0x0002,
        Flow_err: 0x0004,
        valve_open: 0x0040
      },
      vifCodes: {
        '0x00-0x07': 'Enerji (Wh/kWh/MWh)',
        '0x10-0x17': 'Hacim (m³/L)',
        '0x58-0x5F': 'Sıcaklık (°C)',
        '0x3E': 'Debi (L/h)',
        '0x2E': 'Güç (W)'
      }
    }
  });
});

// ============================================
// 👷 TEKNİKER / WORKER API'leri
// ============================================

// Tekniker listesi
app.get('/api/workers', async (req, res) => {
  try {
    // Demo veri - gerçek sistemde veritabanından gelir
    const workers = [
      { id: 1, name: 'Ali Öztürk', ad_soyad: 'Ali Öztürk', phone: '555-0001', telefon: '555-0001', email: 'ali@example.com', status: 'available', completedJobs: 45, tamamlanan_is: 45, rating: 4.8, currentJob: null, skills: ['sayaç', 'gateway', 'mbus'] },
      { id: 2, name: 'Mehmet Kaya', ad_soyad: 'Mehmet Kaya', phone: '555-0002', telefon: '555-0002', email: 'mehmet@example.com', status: 'busy', completedJobs: 32, tamamlanan_is: 32, rating: 4.5, currentJob: 'İş #WO-2024-123', skills: ['sayaç', 'bakım'] },
      { id: 3, name: 'Ahmet Yılmaz', ad_soyad: 'Ahmet Yılmaz', phone: '555-0003', telefon: '555-0003', email: 'ahmet@example.com', status: 'available', completedJobs: 28, tamamlanan_is: 28, rating: 4.7, currentJob: null, skills: ['sayaç', 'kurulum'] },
      { id: 4, name: 'Fatma Öz', ad_soyad: 'Fatma Öz', phone: '555-0004', telefon: '555-0004', email: 'fatma@example.com', status: 'offline', completedJobs: 15, tamamlanan_is: 15, rating: 4.9, currentJob: null, skills: ['gateway', 'teknik destek'] },
      { id: 5, name: 'Hasan Demir', ad_soyad: 'Hasan Demir', phone: '555-0005', telefon: '555-0005', email: 'hasan@example.com', status: 'available', completedJobs: 52, tamamlanan_is: 52, rating: 4.6, currentJob: null, skills: ['sayaç', 'gateway', 'mbus', 'bakım'] }
    ];
    res.json({ success: true, workers, total: workers.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// İş atamaları
app.get('/api/work-assignments', async (req, res) => {
  try {
    const today = new Date().toLocaleDateString('tr-TR');
    // Demo iş atamaları
    const assignments = [
      {
        id: 'WO-2024-001',
        type: 'meter_reading',
        description: 'Aylık Sayaç Okuma',
        site: 'GOLDEN LİFE SİTESİ 2.ETAP',
        siteId: 1816,
        building: 'A-B Blok',
        address: 'Tekirdağ, Çorlu',
        priority: 'normal',
        status: 'assigned',
        assignee: { id: 1, name: 'Ali Öztürk' },
        meterCount: 192,
        dueDate: today,
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        notes: 'Aylık periyodik okuma'
      },
      {
        id: 'WO-2024-002',
        type: 'maintenance',
        description: 'Gateway Bakımı',
        site: 'MÜMİN AĞA SİTESİ',
        siteId: 1230,
        building: 'A-B Blok',
        address: 'İstanbul',
        priority: 'high',
        status: 'in_progress',
        assignee: { id: 2, name: 'Mehmet Kaya' },
        meterCount: 36,
        dueDate: today,
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        notes: 'Gateway sinyal sorunu'
      },
      {
        id: 'WO-2024-003',
        type: 'repair',
        description: 'Sayaç Arızası',
        site: 'EGE NOVA SİTESİ',
        siteId: 436,
        building: 'C Blok',
        address: 'İzmir',
        priority: 'urgent',
        status: 'pending',
        assignee: null,
        meterCount: 1,
        dueDate: today,
        createdAt: new Date().toISOString(),
        notes: 'Sayaç veri göndermiyor - acil müdahale'
      },
      {
        id: 'WO-2024-004',
        type: 'installation',
        description: 'Yeni Sayaç Kurulumu',
        site: 'UYSAL PİAZZA',
        siteId: 1719,
        building: 'D Blok',
        address: 'Tekirdağ',
        priority: 'normal',
        status: 'pending',
        assignee: null,
        meterCount: 5,
        dueDate: new Date(Date.now() + 86400000).toLocaleDateString('tr-TR'),
        createdAt: new Date().toISOString(),
        notes: 'Yeni daireler için sayaç montajı'
      },
      {
        id: 'WO-2024-005',
        type: 'meter_reading',
        description: 'Haftalık Kontrol Okuma',
        site: 'NAVI TOWERS',
        siteId: 2001,
        building: 'A Blok',
        address: 'Samsun, Atakum',
        priority: 'low',
        status: 'completed',
        assignee: { id: 3, name: 'Ahmet Yılmaz' },
        meterCount: 73,
        dueDate: new Date(Date.now() - 86400000).toLocaleDateString('tr-TR'),
        completedAt: new Date(Date.now() - 43200000).toISOString(),
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        notes: 'Haftalık kontrol okuma tamamlandı'
      }
    ];

    // İstatistikler
    const stats = {
      total: assignments.length,
      pending: assignments.filter(a => a.status === 'pending').length,
      assigned: assignments.filter(a => a.status === 'assigned').length,
      inProgress: assignments.filter(a => a.status === 'in_progress').length,
      completed: assignments.filter(a => a.status === 'completed').length
    };

    res.json({ success: true, assignments, stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// İş ataması oluştur
app.post('/api/work-assignments', async (req, res) => {
  try {
    const { type, siteId, description, priority, assigneeId, dueDate, notes, meters } = req.body;

    const newAssignment = {
      id: `WO-${Date.now()}`,
      type: type || 'meter_reading',
      siteId,
      description,
      priority: priority || 'normal',
      status: assigneeId ? 'assigned' : 'pending',
      assignee: assigneeId ? { id: assigneeId } : null,
      dueDate,
      notes,
      meters: meters || [],
      createdAt: new Date().toISOString()
    };

    res.json({ success: true, assignment: newAssignment, message: 'İş emri oluşturuldu' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// İş ataması güncelle
app.put('/api/work-assignments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    res.json({
      success: true,
      message: `İş emri ${id} güncellendi`,
      assignment: { id, ...updates, updatedAt: new Date().toISOString() }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Static dosyalar
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
    console.log(`🤖 AI endpoint: http://localhost:${PORT}/api/ai`);
  });
});
