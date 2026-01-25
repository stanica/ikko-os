'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { FileText, Plus, RefreshCw } from 'lucide-react';
import NoteItem from './NoteItem';
import CreateNoteModal from './CreateNoteModal';
import NoteDetailsModal from './NoteDetailsModal';

const NOTES_CACHE_KEY = 'ikko_notes_cache';

const loadCachedNotes = () => {
  if (typeof window === 'undefined') return [];
  try {
    const cached = localStorage.getItem(NOTES_CACHE_KEY);
    return cached ? JSON.parse(cached) : [];
  } catch {
    return [];
  }
};

const saveCachedNotes = (notes) => {
  try {
    localStorage.setItem(NOTES_CACHE_KEY, JSON.stringify(notes));
  } catch (e) {
    console.error('Failed to cache notes:', e);
  }
};

export default function NotesPanel() {
  const { sessionId, authFetch } = useAuth();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasCachedData, setHasCachedData] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [noteDetails, setNoteDetails] = useState([]);
  const [editData, setEditData] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load cached notes on mount
  useEffect(() => {
    const cached = loadCachedNotes();
    if (cached.length > 0) {
      setNotes(cached);
      setHasCachedData(true);
    }
    setLoading(false);
  }, []);

  const fetchNotes = async (showLoading = true) => {
    if (!sessionId) return;

    // Only show loading if we don't have cached data
    if (showLoading && !hasCachedData) {
      setLoading(true);
    }

    try {
      const response = await authFetch('/api/notes/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId: 'AI-Meetings',
          delFlag: 0,
          limit: 50,
          offset: 0,
        }),
      });

      const data = await response.json();

      if (data.code === 200) {
        const notesList = data.data || [];

        // Fetch categories for notes
        await Promise.all(
          notesList.map(async (note) => {
            try {
              const detailsRes = await authFetch('/api/notes/details', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  sessionId: note.sessionId,
                }),
              });
              const detailsData = await detailsRes.json();
              if (detailsData.code === 200 && detailsData.data?.[0]) {
                note.taskType = detailsData.data[0].taskType;
              }
            } catch (e) {
              console.error('Error fetching note category:', e);
            }
          })
        );

        setNotes(notesList);
        saveCachedNotes(notesList);
        setHasCachedData(true);
      }
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch notes when sessionId is available
  useEffect(() => {
    if (sessionId) {
      fetchNotes();
    }
  }, [sessionId]);

  const viewNoteDetails = async (note) => {
    try {
      const response = await authFetch('/api/notes/details', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: note.sessionId,
        }),
      });

      const data = await response.json();

      if (data.code === 200) {
        setSelectedNote(note);
        setNoteDetails(data.data || []);
        setShowDetailsModal(true);
      }
    } catch (error) {
      console.error('Error fetching note details:', error);
    }
  };

  const handleCreateNote = async (noteData) => {
    try {
      const response = await authFetch('/api/notes/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appId: 'AI-Meetings',
          ...noteData,
        }),
      });

      const data = await response.json();

      if (data.code === 200) {
        setShowCreateModal(false);
        setEditData(null);
        await fetchNotes();
      }
    } catch (error) {
      console.error('Error creating note:', error);
    }
  };

  const handleEdit = (record) => {
    setEditData({
      sessionId: record.sessionId,
      sessionName: record.sessionName,
      taskType: record.taskType,
      inputText: record.inputText || '',
    });
    setShowDetailsModal(false);
    setShowCreateModal(true);
  };

  const handleDelete = async () => {
    if (!selectedNote) return;

    if (!confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await authFetch('/api/notes/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: selectedNote.sessionId,
        }),
      });

      const data = await response.json();

      if (data.code === 200) {
        setShowDetailsModal(false);
        setSelectedNote(null);
        await fetchNotes();
      } else {
        alert('Failed to delete note: ' + (data.msg || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error deleting note:', error);
      alert('Error deleting note: ' + error.message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <div className="flex-1 overflow-y-auto p-5 bg-surface-secondary">
        {loading && notes.length === 0 ? (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400">Loading notes...</div>
        ) : notes.length === 0 ? (
          <div className="text-center py-15 px-5 text-gray-500 dark:text-gray-400">
            <FileText size={48} className="mx-auto mb-4 text-gray-400 dark:text-gray-500" />
            <div>No notes yet. Create your first note!</div>
          </div>
        ) : (
          notes.map((note) => (
            <NoteItem
              key={note.sessionId}
              note={note}
              onClick={() => viewNoteDetails(note)}
            />
          ))
        )}
      </div>
      <div className="p-5 bg-surface border-t border-border flex gap-3">
        <button
          className="flex-1 py-3 border-none rounded-xl text-base font-semibold cursor-pointer transition-all bg-brand-500 text-white hover:-translate-y-0.5 hover:shadow-lg"
          onClick={() => {
            setEditData(null);
            setShowCreateModal(true);
          }}
        >
          <Plus size={18} className="inline mr-1.5" /> Create Note
        </button>
        <button
          className="flex-1 py-3 border-none rounded-xl text-base font-semibold cursor-pointer transition-all bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
          onClick={fetchNotes}
        >
          <RefreshCw size={18} className="inline mr-1.5" /> Refresh
        </button>
      </div>

      {showCreateModal && (
        <CreateNoteModal
          editData={editData}
          onClose={() => {
            setShowCreateModal(false);
            setEditData(null);
          }}
          onSubmit={handleCreateNote}
        />
      )}

      {showDetailsModal && selectedNote && (
        <NoteDetailsModal
          title={selectedNote.sessionName}
          records={noteDetails}
          onClose={() => setShowDetailsModal(false)}
          onEdit={handleEdit}
          onDelete={handleDelete}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
}
