import React, { useState, useEffect } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

function Notes() {
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState({ title: '', content: '', category: 'genel' });
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadNotes();
  }, []);

  const loadNotes = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/notes');
      const contentType = res.headers.get('content-type');

      if (!res.ok || !contentType?.includes('application/json')) {
        // API mevcut değil - localStorage kullan
        const saved = localStorage.getItem('notes');
        setNotes(saved ? JSON.parse(saved) : []);
        setLoading(false);
        return;
      }

      const data = await res.json();
      setNotes(data.notes || data || []);

    } catch (err) {
      console.error('Notes load error:', err);
      const saved = localStorage.getItem('notes');
      setNotes(saved ? JSON.parse(saved) : []);
    } finally {
      setLoading(false);
    }
  };

  const saveToLocalStorage = (updatedNotes) => {
    localStorage.setItem('notes', JSON.stringify(updatedNotes));
  };

  const addNote = async () => {
    if (!newNote.title.trim() || !newNote.content.trim()) return;

    try {
      setSaving(true);

      const res = await fetch('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newNote, pinned: false })
      });

      const contentType = res.headers.get('content-type');

      if (res.ok && contentType?.includes('application/json')) {
        const data = await res.json();
        const savedNote = data.note || data;
        setNotes([savedNote, ...notes]);
      } else {
        // Fallback to localStorage
        const newNoteObj = {
          id: Date.now(),
          ...newNote,
          pinned: false,
          createdAt: new Date().toISOString()
        };
        const updatedNotes = [newNoteObj, ...notes];
        setNotes(updatedNotes);
        saveToLocalStorage(updatedNotes);
      }

      setNewNote({ title: '', content: '', category: 'genel' });

    } catch (err) {
      console.error('Add note error:', err);
      // Fallback to localStorage
      const newNoteObj = {
        id: Date.now(),
        ...newNote,
        pinned: false,
        createdAt: new Date().toISOString()
      };
      const updatedNotes = [newNoteObj, ...notes];
      setNotes(updatedNotes);
      saveToLocalStorage(updatedNotes);
      setNewNote({ title: '', content: '', category: 'genel' });
    } finally {
      setSaving(false);
    }
  };

  const deleteNote = async (id) => {
    if (!confirm('Bu notu silmek istediğinize emin misiniz?')) return;

    try {
      const res = await fetch(`/api/notes/${id}`, { method: 'DELETE' });
      const updatedNotes = notes.filter(n => n.id !== id);
      setNotes(updatedNotes);
      saveToLocalStorage(updatedNotes);

    } catch (err) {
      console.error('Delete note error:', err);
      const updatedNotes = notes.filter(n => n.id !== id);
      setNotes(updatedNotes);
      saveToLocalStorage(updatedNotes);
    }
  };

  const togglePin = async (id) => {
    const note = notes.find(n => n.id === id);
    if (!note) return;

    try {
      const res = await fetch(`/api/notes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinned: !note.pinned })
      });

      const updatedNotes = notes.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n);
      setNotes(updatedNotes);
      saveToLocalStorage(updatedNotes);

    } catch (err) {
      console.error('Toggle pin error:', err);
      const updatedNotes = notes.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n);
      setNotes(updatedNotes);
      saveToLocalStorage(updatedNotes);
    }
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

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Notlar yükleniyor...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <AlertTriangle size={48} />
        <h3>Veri Yüklenemedi</h3>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={loadNotes}>
          <RefreshCw size={18} />
          Tekrar Dene
        </button>
      </div>
    );
  }

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
          <button className="btn btn-primary" onClick={addNote} disabled={saving}>
            {saving ? 'Ekleniyor...' : 'Not Ekle'}
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
