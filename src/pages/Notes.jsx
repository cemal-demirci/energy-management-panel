import React, { useState, useEffect } from 'react';

function Notes() {
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState({ title: '', content: '', category: 'genel' });
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = () => {
    const saved = localStorage.getItem('system_notes');
    if (saved) {
      setNotes(JSON.parse(saved));
    } else {
      // Varsayilan notlar
      const defaultNotes = [
        {
          id: 1,
          title: 'Gateway Sunucu Bilgileri',
          content: `MEVCUT SUNUCU: 94.73.148.5
DATABASE: u9773530_paylas
USER: u9773530_paylas
PORT: 1433 (SQL Server)

Gateway'ler bu sunucuya baglanıyor ve veritabanini guncelliyor.
IIS uzerinde bir servis calisiyor (403 Forbidden - erisim engelli).

GATEWAY TURLERI:
- Orion GSM: 202 adet (TCP port 5000 veya 80 uzerinden)
- Wimbus: 28 adet (RF uzerinden yerel toplayici)
- Belirsiz: 7 adet

AKTIF DURUM:
- Son 1 saat: ~161 gateway aktif
- Toplam: 237 gateway

YAPILACAKLAR:
1. 94.73.148.5 sunucusuna RDP/SSH erisimi saglanmali
2. Gateway baglanti servisinin konfigurasyonu incelenmeli
3. Gerekirse bu panel sunucuya deploy edilmeli`,
          category: 'sunucu',
          createdAt: new Date().toISOString(),
          pinned: true
        },
        {
          id: 2,
          title: 'Backend Deploy Bilgileri',
          content: `FRONTEND (Vercel):
- URL: https://web-panel-beta.vercel.app

BACKEND (Render):
- URL: https://energy-management-panel.onrender.com
- Health: https://energy-management-panel.onrender.com/api/health

ENVIRONMENT VARIABLES:
DB_SERVER=94.73.148.5
DB_DATABASE=u9773530_paylas
DB_USER=u9773530_paylas
DB_PASSWORD=QQwv35N7UDjc38K
DB_PORT=1433

RAILWAY DEPLOY:
1. railway.app'e giris yap
2. New Project > Deploy from GitHub
3. Environment variables ekle (yukaridakiler)
4. Deploy!

ALTERNATIF - RENDER.COM:
1. render.com'a giris yap
2. New > Web Service
3. Build Command: npm install
4. Start Command: node server/index.js
5. Environment variables ekle`,
          category: 'sunucu',
          createdAt: new Date().toISOString(),
          pinned: true
        },
        {
          id: 3,
          title: 'Veritabani Yapisi',
          content: `TABLOLAR:
- siteler: 1,227 site
- binalar: 2,399 bina (237 gateway'li)
- daireler: 89,149 daire
- sayaclar: 111,848 sayac
- sayacdegerler: Okuma gecmisi
- okumalar: Okuma loglari
- firmalar: Orion Enerji, INTEGRAL SAYAC, TUGRA GRUP

ONEMLI SUTUNLAR (binalar):
- imei: Gateway kimlik numarasi
- modemip: Gateway'in public IP adresi
- sonerisim: Son erisim zamani
- cihaztur: Orion, Wimbus, vb.
- otomatikokuma: Otomatik okuma aktif mi`,
          category: 'veritabani',
          createdAt: new Date().toISOString(),
          pinned: false
        },
        {
          id: 4,
          title: 'API Endpointleri',
          content: `GATEWAY YONETIMI:
- GET /api/mbus/gateways - Tum gateway'ler
- GET /api/gateways/stats/overview - Istatistikler
- POST /api/gateways/:id/ping - Durum kontrolu
- GET /api/health - Sunucu saglik kontrolu

FATURALANDIRMA:
- POST /api/billing/generate - Fatura olustur
- POST /api/billing/distribute - Fatura dagit
- GET /api/billing/analysis/:siteId - Analiz

OKUMA:
- POST /api/mbus/read-site - Site okuma baslat
- POST /api/mbus/read-building - Bina okuma baslat
- GET /api/mbus/status/:jobId - Okuma durumu

ZAMANLAMA:
- GET /api/schedule/jobs - Zamanlanmis isler
- POST /api/schedule/set - Zamanlama ayarla`,
          category: 'api',
          createdAt: new Date().toISOString(),
          pinned: false
        }
      ];
      setNotes(defaultNotes);
      localStorage.setItem('system_notes', JSON.stringify(defaultNotes));
    }
  };

  const saveNotes = (updatedNotes) => {
    setNotes(updatedNotes);
    localStorage.setItem('system_notes', JSON.stringify(updatedNotes));
  };

  const addNote = () => {
    if (!newNote.title.trim() || !newNote.content.trim()) return;

    const note = {
      id: Date.now(),
      ...newNote,
      createdAt: new Date().toISOString(),
      pinned: false
    };

    saveNotes([note, ...notes]);
    setNewNote({ title: '', content: '', category: 'genel' });
  };

  const deleteNote = (id) => {
    if (confirm('Bu notu silmek istediginize emin misiniz?')) {
      saveNotes(notes.filter(n => n.id !== id));
    }
  };

  const togglePin = (id) => {
    saveNotes(notes.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n));
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('tr-TR');
  };

  const categories = {
    genel: { label: 'Genel', color: '#64748b' },
    sunucu: { label: 'Sunucu', color: '#2563eb' },
    veritabani: { label: 'Veritabani', color: '#16a34a' },
    api: { label: 'API', color: '#9333ea' },
    hata: { label: 'Hata', color: '#dc2626' },
    todo: { label: 'Yapilacak', color: '#f59e0b' }
  };

  const filteredNotes = notes
    .filter(n => filter === 'all' || n.category === filter)
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  return (
    <div className="notes-page">
      <div className="page-header">
        <h1>Sistem Notlari</h1>
        <p className="subtitle">Onemli bilgiler ve yapilacaklar</p>
      </div>

      {/* Yeni Not Ekleme */}
      <div className="add-note-section">
        <h3>Yeni Not Ekle</h3>
        <div className="note-form">
          <div className="form-row">
            <input
              type="text"
              placeholder="Baslik"
              value={newNote.title}
              onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
            />
            <select
              value={newNote.category}
              onChange={(e) => setNewNote({ ...newNote, category: e.target.value })}
            >
              {Object.entries(categories).map(([key, cat]) => (
                <option key={key} value={key}>{cat.label}</option>
              ))}
            </select>
          </div>
          <textarea
            placeholder="Not icerigi..."
            value={newNote.content}
            onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
            rows={4}
          />
          <button className="btn btn-primary" onClick={addNote}>
            Not Ekle
          </button>
        </div>
      </div>

      {/* Filtreler */}
      <div className="notes-filter">
        <button
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          Tumu ({notes.length})
        </button>
        {Object.entries(categories).map(([key, cat]) => {
          const count = notes.filter(n => n.category === key).length;
          if (count === 0) return null;
          return (
            <button
              key={key}
              className={`filter-btn ${filter === key ? 'active' : ''}`}
              onClick={() => setFilter(key)}
              style={{ borderColor: filter === key ? cat.color : undefined }}
            >
              {cat.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Notlar Listesi */}
      <div className="notes-list">
        {filteredNotes.length === 0 ? (
          <div className="empty-state">
            <p>Henuz not yok</p>
          </div>
        ) : (
          filteredNotes.map(note => (
            <div key={note.id} className={`note-card ${note.pinned ? 'pinned' : ''}`}>
              <div className="note-header">
                <div className="note-title-row">
                  {note.pinned && <span className="pin-icon">📌</span>}
                  <h4>{note.title}</h4>
                  <span
                    className="category-badge"
                    style={{ backgroundColor: categories[note.category]?.color }}
                  >
                    {categories[note.category]?.label}
                  </span>
                </div>
                <div className="note-actions">
                  <button
                    className="btn-icon"
                    onClick={() => togglePin(note.id)}
                    title={note.pinned ? 'Sabitlemeyi kaldir' : 'Sabitle'}
                  >
                    {note.pinned ? '📍' : '📌'}
                  </button>
                  <button
                    className="btn-icon danger"
                    onClick={() => deleteNote(note.id)}
                    title="Sil"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              <pre className="note-content">{note.content}</pre>
              <div className="note-footer">
                <span className="note-date">{formatDate(note.createdAt)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default Notes;
