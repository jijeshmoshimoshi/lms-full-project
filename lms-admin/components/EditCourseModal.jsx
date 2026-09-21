'use client';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';
import {
  X, Check, AlertCircle, Sparkles, Upload, Image as ImageIcon,
  Trash2, Plus, Globe, DollarSign, Layers, CheckCircle2, RefreshCw,
  FileText, ListChecks, HelpCircle, BookOpen, Tag, Info, Flame, Percent, Clock
} from 'lucide-react';

export default function EditCourseModal({ isOpen, course, onClose, onSuccess }) {
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState('basic'); // 'basic' | 'media' | 'curriculum' | 'pricing'

  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    category: '',
    level: 'beginner',
    language: 'English',
    price: 0,
    originalPrice: 0,
    isOfferActive: false,
    offerExpiresAt: '',
    offerBadgeText: 'Special Offer',
    currency: 'INR',
    platformSharePercent: 30,
    instructorSharePercent: 70,
    thumbnail: '',
    whatYouWillLearn: [],
    requirements: [],
    whoThisCourseIsFor: [],
    isPublished: false,
  });

  // Inputs for adding new list items
  const [newLearnItem, setNewLearnItem] = useState('');
  const [newReqItem, setNewReqItem] = useState('');
  const [newAudienceItem, setNewAudienceItem] = useState('');

  // Thumbnail upload state
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageUploadProgress, setImageUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (course && isOpen) {
      setFormData({
        title: course.title || '',
        subtitle: course.subtitle || '',
        description: course.description || '',
        category: course.category || '',
        level: course.level || 'beginner',
        language: course.language || 'English',
        price: course.price ?? 0,
        originalPrice: course.originalPrice ?? 0,
        isOfferActive: course.isOfferActive ?? (Boolean(course.originalPrice && course.originalPrice > course.price)),
        offerExpiresAt: course.offerExpiresAt ? new Date(course.offerExpiresAt).toISOString().slice(0, 16) : '',
        offerBadgeText: course.offerBadgeText || 'Special Offer',
        currency: course.currency || 'INR',
        platformSharePercent: course.platformSharePercent ?? 30,
        instructorSharePercent: course.instructorSharePercent ?? 70,
        thumbnail: course.thumbnail || '',
        whatYouWillLearn: Array.isArray(course.whatYouWillLearn) ? [...course.whatYouWillLearn] : [],
        requirements: Array.isArray(course.requirements) ? [...course.requirements] : [],
        whoThisCourseIsFor: Array.isArray(course.whoThisCourseIsFor) ? [...course.whoThisCourseIsFor] : [],
        isPublished: Boolean(course.isPublished),
      });
      setActiveTab('basic');
      setErrorMsg('');
      setSuccessMsg('');
      setNewLearnItem('');
      setNewReqItem('');
      setNewAudienceItem('');
    }
  }, [course, isOpen]);

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !course || !mounted) return null;

  const isAdmin = user?.role === 'admin';

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, WEBP, SVG, GIF)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('Image file size must be less than 10MB');
      return;
    }

    setUploadingImage(true);
    setImageUploadProgress(10);

    const uploadPayload = new FormData();
    uploadPayload.append('image', file);

    try {
      const res = await api.post('/upload/image', uploadPayload, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setImageUploadProgress(percent);
          }
        },
      });

      const imageUrl = res.data.fullUrl || res.data.url;
      setFormData((prev) => ({ ...prev, thumbnail: imageUrl }));
    } catch (err) {
      console.error('Failed to upload thumbnail:', err);
      alert(err.response?.data?.message || 'Failed to upload image. Please check format and try again.');
    } finally {
      setUploadingImage(false);
      setImageUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Bullet items handlers
  const handleAddLearnItem = () => {
    if (newLearnItem.trim()) {
      setFormData((prev) => ({
        ...prev,
        whatYouWillLearn: [...prev.whatYouWillLearn, newLearnItem.trim()],
      }));
      setNewLearnItem('');
    }
  };

  const handleRemoveLearnItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      whatYouWillLearn: prev.whatYouWillLearn.filter((_, i) => i !== index),
    }));
  };

  const handleAddReqItem = () => {
    if (newReqItem.trim()) {
      setFormData((prev) => ({
        ...prev,
        requirements: [...prev.requirements, newReqItem.trim()],
      }));
      setNewReqItem('');
    }
  };

  const handleRemoveReqItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      requirements: prev.requirements.filter((_, i) => i !== index),
    }));
  };

  const handleAddAudienceItem = () => {
    if (newAudienceItem.trim()) {
      setFormData((prev) => ({
        ...prev,
        whoThisCourseIsFor: [...prev.whoThisCourseIsFor, newAudienceItem.trim()],
      }));
      setNewAudienceItem('');
    }
  };

  const handleRemoveAudienceItem = (index) => {
    setFormData((prev) => ({
      ...prev,
      whoThisCourseIsFor: prev.whoThisCourseIsFor.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setErrorMsg('Course title cannot be empty.');
      setActiveTab('basic');
      return;
    }
    if (!formData.description.trim()) {
      setErrorMsg('Course description cannot be empty.');
      setActiveTab('curriculum');
      return;
    }

    if (isAdmin && (Number(formData.platformSharePercent) + Number(formData.instructorSharePercent) !== 100)) {
      setErrorMsg('Platform share and instructor share percentages must sum to 100%.');
      setActiveTab('pricing');
      return;
    }

    setSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const payload = {
        title: formData.title.trim(),
        subtitle: formData.subtitle.trim(),
        description: formData.description.trim(),
        category: formData.category.trim() || 'general',
        level: formData.level,
        language: formData.language.trim() || 'English',
        price: Math.max(0, Number(formData.price) || 0),
        originalPrice: Math.max(0, Number(formData.originalPrice) || 0),
        isOfferActive: Boolean(formData.isOfferActive),
        offerExpiresAt: formData.offerExpiresAt ? new Date(formData.offerExpiresAt).toISOString() : null,
        offerBadgeText: formData.offerBadgeText?.trim() || 'Special Offer',
        currency: formData.currency || 'INR',
        thumbnail: formData.thumbnail.trim(),
        whatYouWillLearn: formData.whatYouWillLearn,
        requirements: formData.requirements,
        whoThisCourseIsFor: formData.whoThisCourseIsFor,
      };

      if (course.approvalStatus === 'approved' || isAdmin) {
        payload.isPublished = Boolean(formData.isPublished);
      }

      if (isAdmin) {
        payload.platformSharePercent = Number(formData.platformSharePercent);
        payload.instructorSharePercent = Number(formData.instructorSharePercent);
      }

      const res = await api.put(`/courses/${course._id}`, payload);
      setSuccessMsg('Course details successfully updated!');
      setTimeout(() => {
        onSuccess(res.data);
      }, 1000);
    } catch (err) {
      console.error('Update course failed:', err);
      setErrorMsg(err.response?.data?.message || 'Failed to update course details.');
    } finally {
      setSaving(false);
    }
  };

  const modalContent = (
    <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full my-auto text-white shadow-2xl relative flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">

        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <span>Edit Course Details</span>
                <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                  course.approvalStatus === 'approved'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : course.approvalStatus === 'pending_approval'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    : 'bg-slate-800 text-slate-300 border-slate-700'
                }`}>
                  {course.approvalStatus || 'draft'}
                </span>
              </h2>
              <p className="text-xs text-slate-400 truncate max-w-xs sm:max-w-md">
                {course.title}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
            title="Close Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-800 bg-slate-900/60 overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('basic')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'basic'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10 rounded-t-xl'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Basic Info</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('media')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'media'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10 rounded-t-xl'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Thumbnail & Media</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('curriculum')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'curriculum'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10 rounded-t-xl'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ListChecks className="w-4 h-4" />
            <span>Objectives & Details</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pricing')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition whitespace-nowrap cursor-pointer ${
              activeTab === 'pricing'
                ? 'border-indigo-500 text-indigo-400 bg-indigo-500/10 rounded-t-xl'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>Pricing & Visibility</span>
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Notifications */}
          {errorMsg && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-2xl flex items-center gap-3 text-xs">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-2xl flex items-center gap-3 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: BASIC INFO */}
          {activeTab === 'basic' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Course Title <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Master Full-Stack Web Development: From Scratch to Senior"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Short Subtitle / Tagline
                </label>
                <input
                  type="text"
                  placeholder="e.g. Build real production apps with React, Node.js, MongoDB and Deploy to AWS"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">Appears directly below the main title on the public course page.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Category
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Development, Design, AI"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Target Skill Level
                  </label>
                  <select
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Primary Language
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. English, Hindi, Spanish"
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: THUMBNAIL & MEDIA */}
          {activeTab === 'media' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Course Card & Cover Image
                </label>

                {/* Upload or URL Options */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* File Upload Box */}
                  <div className="border-2 border-dashed border-slate-700 rounded-2xl p-5 text-center bg-slate-800/40 hover:bg-slate-800/70 transition flex flex-col items-center justify-center">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      className="hidden"
                      id="course-thumbnail-upload"
                    />
                    <label
                      htmlFor="course-thumbnail-upload"
                      className="cursor-pointer flex flex-col items-center gap-2 text-slate-300 hover:text-white"
                    >
                      <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                        <Upload className="w-6 h-6" />
                      </div>
                      <span className="font-bold text-xs text-indigo-400 hover:underline">
                        {uploadingImage ? `Uploading (${imageUploadProgress}%)...` : 'Click to upload image'}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Supports PNG, JPG, WEBP up to 10MB
                      </span>
                    </label>
                  </div>

                  {/* Direct Image URL input */}
                  <div className="flex flex-col justify-center space-y-2 p-4 bg-slate-800/40 rounded-2xl border border-slate-800">
                    <label className="text-xs font-semibold text-slate-300">Or Paste Image URL</label>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/photo-..."
                      value={formData.thumbnail}
                      onChange={(e) => setFormData({ ...formData, thumbnail: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                    />
                    <span className="text-[10px] text-slate-500">Provide an external hosted image URL or use uploaded file above.</span>
                  </div>
                </div>
              </div>

              {/* Thumbnail Live Preview */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Thumbnail Preview
                </label>
                {formData.thumbnail ? (
                  <div className="relative rounded-2xl overflow-hidden border border-slate-700 max-w-md aspect-video bg-slate-950 group">
                    <img
                      src={formData.thumbnail}
                      alt="Course Thumbnail"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className="hidden absolute inset-0 items-center justify-center bg-slate-900 text-slate-400 text-xs font-medium">
                      Failed to load preview image
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, thumbnail: '' })}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-rose-600/90 text-white hover:bg-rose-500 transition opacity-0 group-hover:opacity-100 cursor-pointer"
                      title="Remove image"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="rounded-2xl border border-slate-800 bg-slate-800/20 p-8 text-center text-slate-500 text-xs flex flex-col items-center gap-2 max-w-md aspect-video justify-center">
                    <ImageIcon className="w-8 h-8 opacity-40" />
                    <span>No thumbnail selected yet. A default placeholder will be displayed.</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: OBJECTIVES & DETAILS */}
          {activeTab === 'curriculum' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Full Description */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                  Full Course Description <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Provide an in-depth summary of what students will accomplish in this course..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 leading-relaxed"
                />
              </div>

              {/* What You Will Learn List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                    What Students Will Learn ({formData.whatYouWillLearn.length})
                  </label>
                  <span className="text-[11px] text-slate-400">Appears in "What you'll learn" card</span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Master React hooks, state management, and custom hooks"
                    value={newLearnItem}
                    onChange={(e) => setNewLearnItem(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddLearnItem();
                      }
                    }}
                    className="flex-1 px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                  <button
                    type="button"
                    onClick={handleAddLearnItem}
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>

                {formData.whatYouWillLearn.length > 0 && (
                  <div className="space-y-1.5 max-h-40 overflow-y-auto p-2 bg-slate-800/30 rounded-xl border border-slate-800">
                    {formData.whatYouWillLearn.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-800/80 text-xs text-slate-200">
                        <div className="flex items-center gap-2 min-w-0">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="truncate">{item}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveLearnItem(idx)}
                          className="text-slate-400 hover:text-rose-400 transition p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Requirements List */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Prerequisites / Requirements ({formData.requirements.length})
                </label>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Basic understanding of HTML and JavaScript"
                    value={newReqItem}
                    onChange={(e) => setNewReqItem(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddReqItem();
                      }
                    }}
                    className="flex-1 px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                  <button
                    type="button"
                    onClick={handleAddReqItem}
                    className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>

                {formData.requirements.length > 0 && (
                  <div className="space-y-1.5 max-h-32 overflow-y-auto p-2 bg-slate-800/30 rounded-xl border border-slate-800">
                    {formData.requirements.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-800/80 text-xs text-slate-200">
                        <span className="truncate">• {item}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveReqItem(idx)}
                          className="text-slate-400 hover:text-rose-400 transition p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Who This Course Is For */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Target Audience ({formData.whoThisCourseIsFor.length})
                </label>

                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Developers transitioning to full-stack engineering"
                    value={newAudienceItem}
                    onChange={(e) => setNewAudienceItem(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddAudienceItem();
                      }
                    }}
                    className="flex-1 px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                  />
                  <button
                    type="button"
                    onClick={handleAddAudienceItem}
                    className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add</span>
                  </button>
                </div>

                {formData.whoThisCourseIsFor.length > 0 && (
                  <div className="space-y-1.5 max-h-32 overflow-y-auto p-2 bg-slate-800/30 rounded-xl border border-slate-800">
                    {formData.whoThisCourseIsFor.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-2 p-2 rounded-lg bg-slate-800/80 text-xs text-slate-200">
                        <span className="truncate">• {item}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveAudienceItem(idx)}
                          className="text-slate-400 hover:text-rose-400 transition p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 4: PRICING & VISIBILITY */}
          {activeTab === 'pricing' && (
            <div className="space-y-6 animate-in fade-in duration-200">

              {/* Regular vs Offer Pricing Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className=" text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
                    <span>Regular / MRP Price (₹)</span>
                    <span className="text-[10px] text-slate-500 font-normal">Original catalog price</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="e.g. 2999"
                      value={formData.originalPrice || ''}
                      onChange={(e) => {
                        const val = Math.max(0, Number(e.target.value));
                        setFormData({
                          ...formData,
                          originalPrice: val,
                          isOfferActive: val > formData.price && formData.price > 0 ? true : formData.isOfferActive
                        });
                      }}
                      className="w-full pl-8 pr-4 py-2.5 bg-slate-800/80 border border-slate-700/80 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    Strikethrough base price displayed to students
                  </span>
                </div>

                <div>
                  <label className=" text-xs font-bold uppercase tracking-wider text-indigo-300 mb-1.5 flex items-center justify-between">
                    <span>Offer / Selling Price (₹)</span>
                    <span className="text-[10px] text-emerald-400 font-bold">Charged at Checkout</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-400 font-bold text-sm">₹</span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="0 for Free"
                      value={formData.price}
                      onChange={(e) => {
                        const val = Math.max(0, Number(e.target.value));
                        setFormData({
                          ...formData,
                          price: val,
                          isOfferActive: formData.originalPrice > val && val > 0 ? true : formData.isOfferActive
                        });
                      }}
                      className="w-full pl-8 pr-4 py-2.5 bg-slate-800/80 border border-indigo-500/50 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 font-bold"
                    />
                  </div>
                  <span className="text-[11px] text-slate-400 mt-1 block">
                    {formData.price === 0 ? 'Free enrollment course' : `Actual price student pays: ₹${formData.price.toLocaleString('en-IN')}`}
                  </span>
                </div>
              </div>

              {/* Dynamic Discount Savings Banner */}
              {formData.originalPrice > formData.price && formData.price > 0 && (
                <div className="p-4 bg-gradient-to-r from-indigo-950/70 via-purple-950/60 to-slate-900 rounded-2xl border border-indigo-500/30 flex items-center justify-between gap-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                      <Flame className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Offer Deal Active</span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-black text-xs border border-emerald-500/30">
                          {Math.round(((formData.originalPrice - formData.price) / formData.originalPrice) * 100)}% OFF
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-0.5">
                        Students save <strong className="text-white">₹{(formData.originalPrice - formData.price).toLocaleString('en-IN')}</strong> when purchasing this course.
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 hidden sm:block">
                    <span className="text-slate-400 line-through text-xs block">₹{formData.originalPrice.toLocaleString('en-IN')}</span>
                    <span className="text-emerald-400 font-black text-lg">₹{formData.price.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              )}

              {/* Promotional Offer Campaign Settings */}
              <div className="p-4 bg-slate-800/40 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-white flex items-center gap-2">
                      <Tag className="w-4 h-4 text-indigo-400" />
                      <span>Promotional Offer Campaign</span>
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Highlight this course across the marketplace with an offer badge and optional deadline timer.
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isOfferActive}
                      onChange={(e) => setFormData({ ...formData, isOfferActive: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                  </label>
                </div>

                {formData.isOfferActive && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-700/60 animate-in fade-in duration-150">
                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                        <Tag className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Offer Badge Label</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Limited Deal, Flash Sale, Weekend Deal"
                        value={formData.offerBadgeText}
                        onChange={(e) => setFormData({ ...formData, offerBadgeText: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                      />
                      <div className="flex gap-1.5 mt-2 flex-wrap">
                        {['Special Offer', 'Limited Deal', 'Flash Sale', 'Early Bird', 'Festive Offer'].map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            onClick={() => setFormData({ ...formData, offerBadgeText: tag })}
                            className={`text-[10px] px-2 py-0.5 rounded-lg border transition ${
                              formData.offerBadgeText === tag
                                ? 'bg-indigo-600 border-indigo-500 text-white font-bold'
                                : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-white'
                            }`}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-400" />
                        <span>Offer Expiry Date & Time (Optional)</span>
                      </label>
                      <input
                        type="datetime-local"
                        value={formData.offerExpiresAt}
                        onChange={(e) => setFormData({ ...formData, offerExpiresAt: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                      />
                      <span className="text-[10px] text-slate-400 mt-1 block">
                        Shows a dynamic countdown timer to students. Leave empty for ongoing offer.
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Revenue Splits (Admin can edit, Instructor sees informative summary) */}
              <div className="p-5 bg-slate-800/40 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-indigo-400" />
                    <span>Revenue Settlement Shares</span>
                  </h4>
                  {!isAdmin && (
                    <span className="text-[10px] text-slate-400 font-medium">Standard Platform Agreement</span>
                  )}
                </div>

                {isAdmin ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Platform Share (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.platformSharePercent}
                        onChange={(e) => {
                          const val = Math.min(100, Math.max(0, Number(e.target.value)));
                          setFormData({
                            ...formData,
                            platformSharePercent: val,
                            instructorSharePercent: 100 - val,
                          });
                        }}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-400 mb-1">Instructor Share (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.instructorSharePercent}
                        onChange={(e) => {
                          const val = Math.min(100, Math.max(0, Number(e.target.value)));
                          setFormData({
                            ...formData,
                            instructorSharePercent: val,
                            platformSharePercent: 100 - val,
                          });
                        }}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-white text-sm"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 text-center">
                    <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Instructor Cut</span>
                      <span className="text-lg font-extrabold text-emerald-400">{formData.instructorSharePercent || 70}%</span>
                    </div>
                    <div className="p-3 bg-slate-800/80 rounded-xl border border-slate-700/60">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Platform Commission</span>
                      <span className="text-lg font-extrabold text-indigo-400">{formData.platformSharePercent || 30}%</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Publishing Live Status (if approved or admin) */}
              {(course.approvalStatus === 'approved' || isAdmin) && (
                <div className="p-4 bg-slate-800/40 rounded-2xl border border-slate-800 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-white">Marketplace Visibility (isPublished)</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {formData.isPublished
                        ? 'Course is active and visible on the student public catalog.'
                        : 'Course is hidden from public student marketplace.'}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isPublished}
                      onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>
              )}
            </div>
          )}

          {/* Modal Footer Controls */}
          <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs text-slate-400">
              Fields marked with <span className="text-rose-400">*</span> are mandatory.
            </span>

            <div className="flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2 text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving || uploadingImage}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/25 transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving Updates...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Save Course Details</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
