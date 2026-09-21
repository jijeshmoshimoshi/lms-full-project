'use client';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { User, Sparkles, FileText, Image, Check, X, AlertCircle } from 'lucide-react';

export default function ProfileSettingsModal({ isOpen, onClose }) {
  const { user, updateUser } = useAuth();
  const [mounted, setMounted] = useState(false);

  const [formData, setFormData] = useState({
    name: user?.name || '',
    headline: user?.headline || '',
    bio: user?.bio || '',
    avatar: user?.avatar || '',
  });

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (user && isOpen) {
      setFormData({
        name: user.name || '',
        headline: user.headline || '',
        bio: user.bio || '',
        avatar: user.avatar || '',
      });
      setSuccessMsg('');
      setErrorMsg('');
    }
  }, [user, isOpen]);

  if (!isOpen || !user || !mounted) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await api.put('/auth/profile', formData);
      updateUser(res.data.user);
      setSuccessMsg('Profile updated successfully! Course pages will now reflect your real information.');
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 1600);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 text-white shadow-2xl relative space-y-5 animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-extrabold text-base text-white">Instructor Profile Settings</h3>
              <p className="text-xs text-slate-400 mt-0.5">Manage your real headline, bio, and public avatar</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Notices */}
        {successMsg && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-xl flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
        {errorMsg && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Display Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. John Doe"
            />
          </div>

          {/* Professional Headline */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">
              Professional Headline
              <span className="text-slate-500 font-normal ml-1.5">(shown beneath your name on course pages)</span>
            </label>
            <input
              type="text"
              value={formData.headline}
              onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. Senior Software Engineer & Cloud Architect"
            />
          </div>

          {/* Biography */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">
              Instructor Biography
              <span className="text-slate-500 font-normal ml-1.5">(your real teaching background)</span>
            </label>
            <textarea
              rows={4}
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="Tell students about your real professional experience, projects, and certifications..."
            />
          </div>

          {/* Avatar URL */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">
              Avatar Image URL
              <span className="text-slate-500 font-normal ml-1.5">(optional image link)</span>
            </label>
            <input
              type="url"
              value={formData.avatar}
              onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="https://..."
            />
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow transition cursor-pointer disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
