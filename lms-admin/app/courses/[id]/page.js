'use client';
import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../../../lib/api';
import { useAuth } from '../../../context/AuthContext';
import { 
  ArrowLeft, Plus, Trash2, Video, FileText, Layers, Clock, 
  Sparkles, CheckCircle2, Play, Eye, EyeOff, Film, Upload,
  Edit3, X, Subtitles, Check, AlertCircle, RefreshCw,
  BookOpen, Download, Paperclip, ExternalLink, FileDown, AlignLeft,
  ShieldCheck, ShieldAlert, Send, CheckCircle, MessageSquare, HelpCircle
} from 'lucide-react';
import EditCourseModal from '../../../components/EditCourseModal';
import QuizManagerModal from '../../../components/QuizManagerModal';

export default function CourseManagePage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [showEditCourseModal, setShowEditCourseModal] = useState(false);
  const [moduleTitle, setModuleTitle] = useState('');
  const [addingModule, setAddingModule] = useState(false);
  
  // Selected module to add/edit lesson
  const [activeModuleId, setActiveModuleId] = useState(null);
  const [editingLessonId, setEditingLessonId] = useState(null);

  // Lesson form state
  const [videoSourceMode, setVideoSourceMode] = useState('upload'); // 'upload' | 'url'
  const [documentSourceMode, setDocumentSourceMode] = useState('upload'); // 'upload' | 'url'
  const [lessonForm, setLessonForm] = useState({
    title: '',
    contentType: 'video', // 'video' | 'document' | 'text'
    videoUrl: '',
    videoType: 'upload',
    subtitlesUrl: '',
    subtitlesLabel: 'English',
    originalFileName: '',
    fileSize: 0,
    documentUrl: '',
    documentName: '',
    documentSize: 0,
    documentType: 'pdf',
    content: '',
    duration: 10,
    isFreePreview: false,
  });

  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [videoUploadProgress, setVideoUploadProgress] = useState(0);
  const [uploadingSubtitle, setUploadingSubtitle] = useState(false);
  const [subtitleUploadProgress, setSubtitleUploadProgress] = useState(0);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [documentUploadProgress, setDocumentUploadProgress] = useState(0);
  const [savingLesson, setSavingLesson] = useState(false);

  // Approval workflow state
  const [submittingReview, setSubmittingReview] = useState(false);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Preview modal (video, document, or text)
  const [previewLesson, setPreviewLesson] = useState(null);

  // Quiz manager modal state
  const [quizLesson, setQuizLesson] = useState(null); // { _id, title } of the lesson being managed

  const videoInputRef = useRef(null);
  const subtitleInputRef = useRef(null);
  const documentInputRef = useRef(null);
  const moduleInputRef = useRef(null);

  const handleSubmitForReview = async () => {
    if (!confirm('Submit this course to the platform administrator for content review and approval?')) return;
    setSubmittingReview(true);
    try {
      const res = await api.put(`/courses/${id}/submit-review`);
      alert(res.data.message || 'Course submitted for review!');
      fetchCourseDetails();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit course for review');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleApproveCourse = async () => {
    if (!confirm(`Are you sure you want to approve "${course?.title}" and publish it live on the student portal?`)) return;
    setApproving(true);
    try {
      const res = await api.put(`/courses/${id}/approve`);
      alert(res.data.message || 'Course approved and published live!');
      fetchCourseDetails();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve course');
    } finally {
      setApproving(false);
    }
  };

  const handleRejectCourse = async (e) => {
    e.preventDefault();
    if (!rejectReason.trim()) {
      alert('Please enter feedback or reason for requesting changes.');
      return;
    }
    setRejecting(true);
    try {
      const res = await api.put(`/courses/${id}/reject`, { reason: rejectReason.trim() });
      alert(res.data.message || 'Feedback sent and course marked as changes requested.');
      setShowRejectModal(false);
      setRejectReason('');
      fetchCourseDetails();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject course');
    } finally {
      setRejecting(false);
    }
  };

  const fetchCourseDetails = () => {
    setLoading(true);
    setErrorMessage('');
    api.get(`/courses/id/${id}?all=true`)
      .then((res) => {
        setCourse(res.data);
      })
      .catch((err) => {
        console.error('Failed to load course details:', err);
        setErrorMessage(err.response?.data?.message || 'Course not found or access denied');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (user && id) {
      fetchCourseDetails();
    }
  }, [user, id]);

  const handleAddModule = async (e) => {
    if (e) e.preventDefault();
    if (!moduleTitle.trim()) {
      moduleInputRef.current?.focus();
      alert('Please enter a module title (e.g., "Module 1: Introduction") in the input box.');
      return;
    }
    setAddingModule(true);
    try {
      await api.post(`/courses/${id}/modules`, {
        title: moduleTitle.trim(),
        order: course.modules ? course.modules.length : 0,
      });
      setModuleTitle('');
      fetchCourseDetails();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add module');
    } finally {
      setAddingModule(false);
    }
  };

  const handleCreateModuleWithPrompt = async () => {
    const title = window.prompt('Enter new module title (e.g. "Module 1: Introduction"):');
    if (title && title.trim()) {
      setAddingModule(true);
      try {
        await api.post(`/courses/${id}/modules`, {
          title: title.trim(),
          order: course.modules ? course.modules.length : 0,
        });
        fetchCourseDetails();
      } catch (err) {
        alert(err.response?.data?.message || 'Failed to add module');
      } finally {
        setAddingModule(false);
      }
    } else {
      moduleInputRef.current?.focus();
    }
  };

  const handleDeleteModule = async (moduleId) => {
    if (!confirm('Are you sure you want to delete this module and all its lessons?')) return;
    try {
      await api.delete(`/courses/modules/${moduleId}`);
      fetchCourseDetails();
    } catch (err) {
      alert('Failed to delete module');
    }
  };

  const handleOpenAddLesson = (moduleId) => {
    setActiveModuleId(moduleId);
    setEditingLessonId(null);
    setVideoSourceMode('upload');
    setDocumentSourceMode('upload');
    setLessonForm({
      title: '',
      contentType: 'video',
      videoUrl: '',
      videoType: 'upload',
      subtitlesUrl: '',
      subtitlesLabel: 'English',
      originalFileName: '',
      fileSize: 0,
      documentUrl: '',
      documentName: '',
      documentSize: 0,
      documentType: 'pdf',
      content: '',
      duration: 10,
      isFreePreview: false,
    });
    setVideoUploadProgress(0);
    setSubtitleUploadProgress(0);
    setDocumentUploadProgress(0);
  };

  const handleOpenEditLesson = (moduleId, lesson) => {
    setActiveModuleId(moduleId);
    setEditingLessonId(lesson._id);
    const isUploaded = lesson.videoUrl && (lesson.videoUrl.includes('/uploads/') || lesson.videoType === 'upload');
    const isDocUploaded = lesson.documentUrl && lesson.documentUrl.includes('/uploads/');
    setVideoSourceMode(isUploaded ? 'upload' : 'url');
    setDocumentSourceMode(isDocUploaded ? 'upload' : 'url');
    setLessonForm({
      title: lesson.title || '',
      contentType: lesson.contentType || (lesson.documentUrl ? 'document' : lesson.videoUrl ? 'video' : 'text'),
      videoUrl: lesson.videoUrl || '',
      videoType: lesson.videoType || (isUploaded ? 'upload' : 'direct'),
      subtitlesUrl: lesson.subtitlesUrl || '',
      subtitlesLabel: lesson.subtitlesLabel || 'English',
      originalFileName: lesson.originalFileName || '',
      fileSize: lesson.fileSize || 0,
      documentUrl: lesson.documentUrl || '',
      documentName: lesson.documentName || '',
      documentSize: lesson.documentSize || 0,
      documentType: lesson.documentType || 'pdf',
      content: lesson.content || '',
      duration: lesson.duration || 10,
      isFreePreview: !!lesson.isFreePreview,
    });
  };

  const handleDocumentUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDocument(true);
    setDocumentUploadProgress(0);

    const formData = new FormData();
    formData.append('document', file);

    try {
      const res = await api.post('/upload/document', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setDocumentUploadProgress(percent);
        },
      });

      const fileUrl = res.data.fullUrl || `http://localhost:5000${res.data.url}`;
      const ext = file.name.split('.').pop().toLowerCase();

      setLessonForm((prev) => ({
        ...prev,
        documentUrl: fileUrl,
        documentName: file.name,
        documentSize: file.size,
        documentType: res.data.documentType || ext,
        title: prev.title ? prev.title : file.name.replace(/\.[^/.]+$/, ''),
      }));
    } catch (err) {
      alert(err.response?.data?.message || 'Document upload failed');
    } finally {
      setUploadingDocument(false);
    }
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingVideo(true);
    setVideoUploadProgress(0);

    // Attempt auto-detecting duration in browser
    try {
      const videoEl = document.createElement('video');
      videoEl.preload = 'metadata';
      const objUrl = URL.createObjectURL(file);
      videoEl.src = objUrl;
      videoEl.onloadedmetadata = () => {
        URL.revokeObjectURL(objUrl);
        if (videoEl.duration && !isNaN(videoEl.duration)) {
          const mins = Math.max(1, Math.round(videoEl.duration / 60));
          setLessonForm((prev) => ({ ...prev, duration: mins }));
        }
      };
    } catch {
      // Ignored if unsupported file
    }

    const formData = new FormData();
    formData.append('video', file);

    try {
      const res = await api.post('/upload/video', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setVideoUploadProgress(percent);
        },
      });

      const fileUrl = res.data.fullUrl || `http://localhost:5000${res.data.url}`;
      const ext = file.name.split('.').pop().toLowerCase();
      const detectedType = ext === 'm3u8' ? 'hls' : ext === 'mpd' ? 'dash' : 'upload';

      setLessonForm((prev) => ({
        ...prev,
        videoUrl: fileUrl,
        videoType: detectedType,
        originalFileName: file.name,
        fileSize: file.size,
        title: prev.title ? prev.title : file.name.replace(/\.[^/.]+$/, ''),
      }));
    } catch (err) {
      alert(err.response?.data?.message || 'Video upload failed');
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleSubtitleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingSubtitle(true);
    setSubtitleUploadProgress(0);

    const formData = new FormData();
    formData.append('subtitle', file);

    try {
      const res = await api.post('/upload/subtitle', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setSubtitleUploadProgress(percent);
        },
      });

      const fileUrl = res.data.fullUrl || `http://localhost:5000${res.data.url}`;
      setLessonForm((prev) => ({
        ...prev,
        subtitlesUrl: fileUrl,
      }));
    } catch (err) {
      alert(err.response?.data?.message || 'Subtitle upload failed');
    } finally {
      setUploadingSubtitle(false);
    }
  };

  const handleSaveLesson = async (e) => {
    e.preventDefault();
    if (!lessonForm.title.trim()) {
      alert('Please enter a lesson title');
      return;
    }

    setSavingLesson(true);
    try {
      if (editingLessonId) {
        await api.put(`/courses/lessons/${editingLessonId}`, lessonForm);
      } else {
        await api.post(`/courses/modules/${activeModuleId}/lessons`, lessonForm);
      }

      setActiveModuleId(null);
      setEditingLessonId(null);
      fetchCourseDetails();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save lesson');
    } finally {
      setSavingLesson(false);
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    if (!confirm('Delete this lesson?')) return;
    try {
      await api.delete(`/courses/lessons/${lessonId}`);
      fetchCourseDetails();
    } catch (err) {
      alert('Failed to delete lesson');
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-slate-500 text-sm font-medium">Loading course curriculum...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="py-16 text-center max-w-md mx-auto space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">{errorMessage || 'Course Not Found'}</h2>
        <p className="text-xs text-slate-400">
          The course may have been removed or you may not have permission to view it.
        </p>
        <div>
          <Link href="/courses" className="inline-block mt-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl transition">
            Return to Courses Catalog
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* Top Header */}
      <div>
        <Link
          href="/courses"
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-indigo-600 transition mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Courses</span>
        </Link>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full">
                {course.category || 'General'}
              </span>
              <span className="text-xs text-slate-400 font-medium">Level: {course.level || 'Beginner'}</span>
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{course.title}</h1>
            <p className="text-xs text-slate-500 mt-1 max-w-xl line-clamp-1">{course.description}</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowEditCourseModal(true)}
              className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="Edit Course Information"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Course Details</span>
            </button>

            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
              course.approvalStatus === 'approved' 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                : course.approvalStatus === 'pending_approval'
                ? 'bg-amber-50 text-amber-800 border border-amber-200 animate-pulse'
                : course.approvalStatus === 'rejected'
                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                : 'bg-slate-100 text-slate-600 border border-slate-200'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                course.approvalStatus === 'approved' 
                  ? 'bg-emerald-500' 
                  : course.approvalStatus === 'pending_approval' 
                  ? 'bg-amber-500' 
                  : course.approvalStatus === 'rejected' 
                  ? 'bg-rose-500' 
                  : 'bg-slate-400'
              }`} />
              <span>
                {course.approvalStatus === 'approved' 
                  ? 'Live & Published' 
                  : course.approvalStatus === 'pending_approval' 
                  ? 'Awaiting Admin Review' 
                  : course.approvalStatus === 'rejected' 
                  ? 'Changes Requested' 
                  : 'Draft Mode'}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* 1. ADMIN INSPECTION & APPROVAL PANEL */}
      {user?.role === 'admin' && (
        <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-white shadow-xl space-y-4 animate-fadeIn">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Admin Verification Mode</span>
                </span>
                <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${
                  course.approvalStatus === 'approved'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : course.approvalStatus === 'pending_approval'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 animate-pulse'
                    : course.approvalStatus === 'rejected'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                    : 'bg-slate-700 text-slate-300 border-slate-600'
                }`}>
                  Status: {course.approvalStatus === 'approved' ? 'Approved & Live' : course.approvalStatus === 'pending_approval' ? 'Awaiting Your Review' : course.approvalStatus === 'rejected' ? 'Changes Requested' : 'Draft'}
                </span>
              </div>

              <div className="text-sm font-semibold text-slate-300 flex flex-wrap items-center gap-x-4 gap-y-1 pt-1">
                <span>Instructor: <strong className="text-white">{course.instructor?.name || 'Unknown'}</strong> ({course.instructor?.email})</span>
                {course.submittedAt && (
                  <span className="text-slate-400 text-xs">
                    Submitted: {new Date(course.submittedAt).toLocaleString()}
                  </span>
                )}
                {course.reviewedBy && (
                  <span className="text-slate-400 text-xs">
                    Reviewed by: {course.reviewedBy?.name || 'Admin'} {course.reviewedAt ? `(${new Date(course.reviewedAt).toLocaleDateString()})` : ''}
                  </span>
                )}
              </div>
            </div>

            {/* Admin Actions */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => setShowRejectModal(true)}
                disabled={rejecting || approving}
                className="px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold text-xs rounded-xl transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <AlertCircle className="w-4 h-4" />
                <span>Request Changes / Reject</span>
              </button>

              <button
                onClick={handleApproveCourse}
                disabled={approving || rejecting || course.approvalStatus === 'approved'}
                className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {approving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Approving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>{course.approvalStatus === 'approved' ? 'Already Approved' : 'Approve & Publish Live'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <p className="text-xs text-slate-400">
            💡 <strong>Verification Instructions:</strong> Review all modules and click into lessons below to inspect video lectures, download attached documents/PDFs, and verify study notes before approving.
          </p>
        </div>
      )}

      {/* 2. INSTRUCTOR WORKFLOW BANNER */}
      {user?.role === 'instructor' && (
        <div>
          {course.approvalStatus === 'approved' && (
            <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-emerald-900 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-emerald-950">Course is Approved & Live!</h4>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    Your curriculum has been verified by the administrator and is actively accessible to students on the public marketplace.
                  </p>
                </div>
              </div>
              <a
                href={`http://localhost:3000/courses/${course.slug}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5 shrink-0"
              >
                <span>View on Student Portal</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          )}

          {course.approvalStatus === 'pending_approval' && (
            <div className="p-5 bg-amber-50 border border-amber-200 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-amber-900 shadow-xs animate-fadeIn">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold shrink-0">
                  <Clock className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-amber-950">Curriculum Under Administrator Review</h4>
                  <p className="text-xs text-amber-800 mt-0.5">
                    Your course was submitted on {course.submittedAt ? new Date(course.submittedAt).toLocaleDateString() : 'recently'}. An administrator is currently reviewing the modules and video/document content. Once approved, it will go live automatically.
                  </p>
                </div>
              </div>
              <span className="px-3 py-1.5 bg-amber-100 text-amber-900 font-bold text-xs rounded-xl border border-amber-300 self-start sm:self-auto shrink-0">
                Awaiting Verification
              </span>
            </div>
          )}

          {course.approvalStatus === 'rejected' && (
            <div className="p-5 bg-rose-50 border border-rose-200 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-rose-900 shadow-xs animate-fadeIn">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold shrink-0 mt-0.5">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-rose-950">Changes Requested by Administrator</h4>
                  <p className="text-xs text-rose-800 mt-1 font-medium bg-white/80 p-2.5 rounded-xl border border-rose-200">
                    "{course.rejectionReason || 'Please review curriculum quality and add more detailed materials.'}"
                  </p>
                  <p className="text-xs text-rose-700 mt-2">
                    Make the suggested updates to your modules or lessons below, then click Re-submit for Review.
                  </p>
                </div>
              </div>
              <button
                onClick={handleSubmitForReview}
                disabled={submittingReview}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 shrink-0 self-start sm:self-auto"
              >
                <Send className="w-4 h-4" />
                <span>{submittingReview ? 'Submitting...' : 'Re-submit for Review'}</span>
              </button>
            </div>
          )}

          {(!course.approvalStatus || course.approvalStatus === 'draft') && (
            <div className="p-5 bg-slate-100 border border-slate-200 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-slate-800 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white text-slate-600 flex items-center justify-center font-bold shrink-0 border border-slate-200">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-slate-900">Course is Currently in Draft Mode</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Students cannot see this course yet. Build your modules, add your videos/documents, and submit for admin approval when ready.
                  </p>
                </div>
              </div>
              <button
                onClick={handleSubmitForReview}
                disabled={submittingReview || !course.modules || course.modules.length === 0}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 shrink-0 self-start sm:self-auto disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{submittingReview ? 'Submitting...' : 'Submit for Admin Approval'}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Curriculum Manager */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Curriculum & Video Content</h2>
            <p className="text-xs text-slate-500">
              Upload video lectures directly from your computer, configure HLS/DASH adaptive streams, and manage subtitles.
            </p>
          </div>

          {/* Add Module Input */}
          <form onSubmit={handleAddModule} className="flex items-center gap-2">
            <input
              ref={moduleInputRef}
              type="text"
              placeholder="Enter Module Title (e.g., Module 1)..."
              value={moduleTitle}
              onChange={(e) => setModuleTitle(e.target.value)}
              className="px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 w-72 shadow-xs transition"
            />
            <button
              type="submit"
              disabled={addingModule}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow transition disabled:opacity-70 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{addingModule ? 'Adding...' : 'Add Module'}</span>
            </button>
          </form>
        </div>

        {/* Modules List */}
        <div className="space-y-4">
          {(!course.modules || course.modules.length === 0) ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-300 p-8 space-y-3">
              <Film className="w-12 h-12 text-slate-300 mx-auto mb-1" />
              <p className="text-slate-800 text-sm font-bold">No modules created yet</p>
              <p className="text-slate-400 text-xs max-w-sm mx-auto">
                Organize your course into modules and chapters, then upload video lectures and reading materials.
              </p>
              <button
                type="button"
                onClick={handleCreateModuleWithPrompt}
                disabled={addingModule}
                className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-70 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create First Module</span>
              </button>
            </div>
          ) : (
            course.modules.map((mod, index) => (
              <div key={mod._id} className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
                
                {/* Module Bar */}
                <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                      {index + 1}
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm">{mod.title}</h3>
                    <span className="text-[11px] text-slate-400 font-medium">
                      ({mod.lessons ? mod.lessons.length : 0} lessons)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenAddLesson(mod._id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Video/Lesson</span>
                    </button>
                    <button
                      onClick={() => handleDeleteModule(mod._id)}
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                      title="Delete Module"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Add/Edit Lesson Form Modal/Inline */}
                {activeModuleId === mod._id && (
                  <div className="p-6 bg-gradient-to-b from-indigo-50/70 to-white border-b border-indigo-100 animate-fadeIn space-y-5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-indigo-950 text-sm flex items-center gap-2">
                        {lessonForm.contentType === 'document' ? (
                          <FileText className="w-4 h-4 text-amber-600" />
                        ) : lessonForm.contentType === 'text' ? (
                          <BookOpen className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Video className="w-4 h-4 text-indigo-600" />
                        )}
                        <span>{editingLessonId ? 'Edit Lesson' : `Add New Lesson to "${mod.title}"`}</span>
                      </span>
                      <button
                        onClick={() => { setActiveModuleId(null); setEditingLessonId(null); }}
                        className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <form onSubmit={handleSaveLesson} className="space-y-4">
                      
                      {/* Lesson Content Type Tabs */}
                      <div>
                        <label className="block text-xs font-semibold uppercase text-slate-600 mb-2">Lesson Type *</label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <button
                            type="button"
                            onClick={() => setLessonForm({ ...lessonForm, contentType: 'video' })}
                            className={`p-3 rounded-xl border flex items-center gap-3 transition text-left ${
                              lessonForm.contentType === 'video'
                                ? 'border-indigo-600 bg-indigo-50 text-indigo-950 font-bold shadow-xs'
                                : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              lessonForm.contentType === 'video' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'
                            }`}>
                              <Video className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-xs font-bold">Video Lecture</div>
                              <div className="text-[10px] text-slate-400">MP4, WebM, HLS stream</div>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => setLessonForm({ ...lessonForm, contentType: 'document' })}
                            className={`p-3 rounded-xl border flex items-center gap-3 transition text-left ${
                              lessonForm.contentType === 'document' || lessonForm.contentType === 'pdf'
                                ? 'border-amber-600 bg-amber-50 text-amber-950 font-bold shadow-xs'
                                : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              lessonForm.contentType === 'document' || lessonForm.contentType === 'pdf' ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-500'
                            }`}>
                              <FileText className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-xs font-bold">Document / PDF</div>
                              <div className="text-[10px] text-slate-400">PDF, Word, PPT slides</div>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => setLessonForm({ ...lessonForm, contentType: 'text' })}
                            className={`p-3 rounded-xl border flex items-center gap-3 transition text-left ${
                              lessonForm.contentType === 'text' || lessonForm.contentType === 'article'
                                ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold shadow-xs'
                                : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                              lessonForm.contentType === 'text' || lessonForm.contentType === 'article' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500'
                            }`}>
                              <BookOpen className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-xs font-bold">Article / Notes</div>
                              <div className="text-[10px] text-slate-400">Rich text & paragraphs</div>
                            </div>
                          </button>
                        </div>
                      </div>

                      {/* Lesson Title & Duration */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                          <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">Lesson Title *</label>
                          <input
                            type="text"
                            placeholder={
                              lessonForm.contentType === 'document' 
                                ? 'e.g., 02. Cheat Sheet & Architecture Blueprint (PDF)'
                                : lessonForm.contentType === 'text'
                                ? 'e.g., 03. Core Principles & Theory Explanation'
                                : 'e.g., 01. Introduction to Core Concepts'
                            }
                            value={lessonForm.title}
                            onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                            className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                            {lessonForm.contentType === 'text' ? 'Est. Read Time (Mins)' : 'Duration (Mins)'}
                          </label>
                          <input
                            type="number"
                            min="1"
                            value={lessonForm.duration}
                            onChange={(e) => setLessonForm({ ...lessonForm, duration: Number(e.target.value) })}
                            className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                          />
                        </div>
                      </div>

                      {/* 1. VIDEO CONTENT FORM */}
                      {lessonForm.contentType === 'video' && (
                        <div className="p-4 bg-white rounded-2xl border border-indigo-100/80 shadow-xs space-y-4">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setVideoSourceMode('upload')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                                  videoSourceMode === 'upload'
                                    ? 'bg-indigo-600 text-white shadow-xs'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                <Upload className="w-3.5 h-3.5" />
                                <span>Upload Video File</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setVideoSourceMode('url')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                                  videoSourceMode === 'url'
                                    ? 'bg-indigo-600 text-white shadow-xs'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                <Film className="w-3.5 h-3.5" />
                                <span>Provide Stream URL / HLS</span>
                              </button>
                            </div>

                            {lessonForm.videoUrl && (
                              <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Video Ready</span>
                              </span>
                            )}
                          </div>

                          {/* Upload Video Section */}
                          {videoSourceMode === 'upload' && (
                            <div>
                              <input
                                ref={videoInputRef}
                                type="file"
                                accept="video/*,.m3u8,.mpd,.mkv"
                                onChange={handleVideoUpload}
                                className="hidden"
                              />

                              <div 
                                onClick={() => !uploadingVideo && videoInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-2xl p-6 text-center transition cursor-pointer ${
                                  uploadingVideo 
                                    ? 'border-indigo-300 bg-indigo-50/50 cursor-wait'
                                    : 'border-slate-300 hover:border-indigo-500 hover:bg-indigo-50/30'
                                }`}
                              >
                                <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                                  {uploadingVideo ? (
                                    <RefreshCw className="w-6 h-6 animate-spin" />
                                  ) : (
                                    <Upload className="w-6 h-6" />
                                  )}
                                </div>

                                <p className="text-sm font-bold text-slate-800">
                                  {uploadingVideo ? 'Uploading Video File...' : 'Click to Upload Video from Device'}
                                </p>
                                <p className="text-xs text-slate-400 mt-1">
                                  Supports MP4, WebM, MKV, MOV, HLS (.m3u8) up to 1GB. Duration is auto-detected.
                                </p>

                                {uploadingVideo && (
                                  <div className="mt-4 max-w-xs mx-auto">
                                    <div className="flex justify-between text-xs font-bold text-indigo-900 mb-1">
                                      <span>Uploading</span>
                                      <span>{videoUploadProgress}%</span>
                                    </div>
                                    <div className="w-full bg-indigo-100 rounded-full h-2 overflow-hidden">
                                      <div 
                                        className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${videoUploadProgress}%` }}
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>

                              {lessonForm.videoUrl && !uploadingVideo && (
                                <div className="mt-3 p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <Video className="w-4 h-4 text-indigo-600 shrink-0" />
                                    <span className="font-mono text-slate-700 truncate">{lessonForm.videoUrl}</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => videoInputRef.current?.click()}
                                    className="text-indigo-600 hover:text-indigo-700 font-bold ml-3 shrink-0"
                                  >
                                    Replace File
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Stream URL Section */}
                          {videoSourceMode === 'url' && (
                            <div className="space-y-3">
                              <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                  Stream URL (HLS .m3u8, DASH .mpd, Direct MP4, or YouTube/Vimeo)
                                </label>
                                <input
                                  type="text"
                                  placeholder="https://.../stream.m3u8 or https://youtube.com/watch?v=..."
                                  value={lessonForm.videoUrl}
                                  onChange={(e) => {
                                    const url = e.target.value;
                                    let type = 'direct';
                                    if (url.includes('.m3u8')) type = 'hls';
                                    else if (url.includes('.mpd')) type = 'dash';
                                    else if (url.includes('youtube.com') || url.includes('youtu.be')) type = 'youtube';
                                    else if (url.includes('vimeo.com')) type = 'vimeo';

                                    setLessonForm({ ...lessonForm, videoUrl: url, videoType: type });
                                  }}
                                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                />
                              </div>
                            </div>
                          )}

                          {/* Subtitles / Captions */}
                          <div className="pt-3 border-t border-slate-100">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <Subtitles className="w-4 h-4 text-indigo-600" />
                                <span className="text-xs font-bold text-slate-800">Captions / Subtitles (Optional):</span>
                              </div>

                              <div className="flex items-center gap-2">
                                <input
                                  ref={subtitleInputRef}
                                  type="file"
                                  accept=".vtt,.srt"
                                  onChange={handleSubtitleUpload}
                                  className="hidden"
                                />
                                <button
                                  type="button"
                                  onClick={() => subtitleInputRef.current?.click()}
                                  disabled={uploadingSubtitle}
                                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition disabled:opacity-50"
                                >
                                  {uploadingSubtitle ? `Uploading (${subtitleUploadProgress}%)...` : 'Upload .vtt / .srt'}
                                </button>
                              </div>
                            </div>

                            {lessonForm.subtitlesUrl && (
                              <div className="mt-2 text-xs text-slate-500 font-mono flex items-center gap-2">
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span className="truncate">{lessonForm.subtitlesUrl}</span>
                                <button
                                  type="button"
                                  onClick={() => setLessonForm({ ...lessonForm, subtitlesUrl: '' })}
                                  className="text-rose-500 hover:underline font-sans ml-auto"
                                >
                                  Remove
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* 2. DOCUMENT / PDF CONTENT FORM */}
                      {(lessonForm.contentType === 'document' || lessonForm.contentType === 'pdf') && (
                        <div className="p-4 bg-white rounded-2xl border border-amber-200/80 shadow-xs space-y-4">
                          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setDocumentSourceMode('upload')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                                  documentSourceMode === 'upload'
                                    ? 'bg-amber-600 text-white shadow-xs'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                <Upload className="w-3.5 h-3.5" />
                                <span>Upload Document / PDF</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => setDocumentSourceMode('url')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                                  documentSourceMode === 'url'
                                    ? 'bg-amber-600 text-white shadow-xs'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                                <span>External Document URL</span>
                              </button>
                            </div>

                            {lessonForm.documentUrl && (
                              <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                <span>Document Attached</span>
                              </span>
                            )}
                          </div>

                          {documentSourceMode === 'upload' && (
                            <div>
                              <input
                                ref={documentInputRef}
                                type="file"
                                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip"
                                onChange={handleDocumentUpload}
                                className="hidden"
                              />

                              <div 
                                onClick={() => !uploadingDocument && documentInputRef.current?.click()}
                                className={`border-2 border-dashed rounded-2xl p-6 text-center transition cursor-pointer ${
                                  uploadingDocument 
                                    ? 'border-amber-300 bg-amber-50/50 cursor-wait'
                                    : 'border-slate-300 hover:border-amber-500 hover:bg-amber-50/30'
                                }`}
                              >
                                <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
                                  {uploadingDocument ? (
                                    <RefreshCw className="w-6 h-6 animate-spin" />
                                  ) : (
                                    <FileDown className="w-6 h-6" />
                                  )}
                                </div>

                                <p className="text-sm font-bold text-slate-800">
                                  {uploadingDocument ? 'Uploading Document...' : 'Click to Upload Document from Device'}
                                </p>
                                <p className="text-xs text-slate-400 mt-1">
                                  Supports PDF, DOC, DOCX, PPT, PPTX, TXT, ZIP up to 100MB.
                                </p>

                                {uploadingDocument && (
                                  <div className="mt-4 max-w-xs mx-auto">
                                    <div className="flex justify-between text-xs font-bold text-amber-900 mb-1">
                                      <span>Uploading</span>
                                      <span>{documentUploadProgress}%</span>
                                    </div>
                                    <div className="w-full bg-amber-100 rounded-full h-2 overflow-hidden">
                                      <div 
                                        className="bg-amber-600 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${documentUploadProgress}%` }}
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>

                              {lessonForm.documentUrl && !uploadingDocument && (
                                <div className="mt-3 p-3.5 bg-amber-50/60 border border-amber-200 rounded-xl flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 font-bold text-xs uppercase flex items-center justify-center shrink-0">
                                      {lessonForm.documentType || 'PDF'}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="font-bold text-slate-800 truncate">
                                        {lessonForm.documentName || 'Uploaded Document'}
                                      </div>
                                      <div className="text-[11px] text-slate-500 mt-0.5">
                                        {lessonForm.documentSize ? `${Math.round(lessonForm.documentSize / 1024)} KB • ` : ''}
                                        <a href={lessonForm.documentUrl} target="_blank" rel="noreferrer" className="text-amber-700 underline font-mono">
                                          View File
                                        </a>
                                      </div>
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => documentInputRef.current?.click()}
                                    className="text-amber-800 hover:text-amber-900 font-bold ml-3 shrink-0"
                                  >
                                    Replace File
                                  </button>
                                </div>
                              )}
                            </div>
                          )}

                          {documentSourceMode === 'url' && (
                            <div className="space-y-3">
                              <div>
                                <label className="block text-xs font-semibold text-slate-600 mb-1">
                                  External Document or Resource URL
                                </label>
                                <input
                                  type="text"
                                  placeholder="https://example.com/handout.pdf or Google Docs link"
                                  value={lessonForm.documentUrl}
                                  onChange={(e) => setLessonForm({ ...lessonForm, documentUrl: e.target.value })}
                                  className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* 3. PARAGRAPHS / ARTICLE / STUDY NOTES CONTENT */}
                      <div>
                        <label className="block text-xs font-semibold uppercase text-slate-600 mb-1">
                          {lessonForm.contentType === 'text' || lessonForm.contentType === 'article' 
                            ? 'Reading Material & Paragraphs *' 
                            : 'Lesson Summary / Study Notes (Optional)'}
                        </label>
                        <textarea
                          rows={lessonForm.contentType === 'text' || lessonForm.contentType === 'article' ? 8 : 3}
                          placeholder={
                            lessonForm.contentType === 'text' || lessonForm.contentType === 'article'
                              ? 'Write detailed lesson paragraphs, explanations, code snippets, or lecture notes here...'
                              : 'Key takeaways, resources, or transcript summary...'
                          }
                          value={lessonForm.content}
                          onChange={(e) => setLessonForm({ ...lessonForm, content: e.target.value })}
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 leading-relaxed font-sans"
                          required={lessonForm.contentType === 'text' || lessonForm.contentType === 'article'}
                        />
                      </div>

                      {/* Preview & Submit Footer */}
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                        <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                          <input
                            type="checkbox"
                            checked={lessonForm.isFreePreview}
                            onChange={(e) => setLessonForm({ ...lessonForm, isFreePreview: e.target.checked })}
                            className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                          />
                          <span>Allow Free Preview (Accessible to unenrolled visitors)</span>
                        </label>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => { setActiveModuleId(null); setEditingLessonId(null); }}
                            className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs rounded-xl transition"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={savingLesson || uploadingVideo || uploadingDocument}
                            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-70 flex items-center gap-2"
                          >
                            {savingLesson ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                <span>Saving...</span>
                              </>
                            ) : (
                              <span>{editingLessonId ? 'Update Lesson' : 'Save & Publish Lesson'}</span>
                            )}
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                )}

                {/* Module Lessons List */}
                {(!mod.lessons || mod.lessons.length === 0) ? (
                  <div className="p-6 text-center text-slate-400 text-xs">
                    No lessons added to this module yet. Click "+ Add Video/Lesson" above.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {mod.lessons.map((les) => {
                      const isDoc = les.contentType === 'document' || les.contentType === 'pdf' || Boolean(les.documentUrl);
                      const isText = les.contentType === 'text' || les.contentType === 'article';

                      return (
                        <div key={les._id} className="p-4 px-6 flex items-center justify-between hover:bg-slate-50/80 transition">
                          <div className="flex items-center gap-3.5 min-w-0">
                            {/* Type Icon Badge */}
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                              isDoc 
                                ? 'bg-amber-50 text-amber-700 border border-amber-200' 
                                : isText 
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            }`}>
                              {isDoc ? (
                                <FileText className="w-4 h-4" />
                              ) : isText ? (
                                <BookOpen className="w-4 h-4" />
                              ) : (
                                <Video className="w-4 h-4" />
                              )}
                            </div>

                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-slate-800 text-sm truncate">{les.title}</span>

                                {/* Type Tag */}
                                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                                  isDoc
                                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                                    : isText
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                }`}>
                                  {isDoc ? (les.documentType?.toUpperCase() || 'DOCUMENT') : isText ? 'ARTICLE' : 'VIDEO'}
                                </span>

                                {les.isFreePreview && (
                                  <span className="text-[10px] font-bold uppercase text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                    Free Preview
                                  </span>
                                )}

                                {les.videoType && !isDoc && !isText && (
                                  <span className="text-[10px] font-mono font-bold uppercase text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full">
                                    {les.videoType}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  <span>{les.duration || 10} {isText ? 'min read' : 'mins'}</span>
                                </span>

                                {isDoc && les.documentName && (
                                  <span className="text-slate-500 font-mono text-[11px] truncate max-w-xs">
                                    {les.documentName} {les.documentSize ? `(${Math.round(les.documentSize / 1024)} KB)` : ''}
                                  </span>
                                )}

                                {!isDoc && !isText && les.videoUrl && (
                                  <span className="text-slate-400 font-mono truncate max-w-xs text-[11px]">
                                    {les.videoUrl}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Action buttons */}
                          <div className="flex items-center gap-2 shrink-0 ml-4">
                            {/* Preview Trigger */}
                            <button
                              onClick={() => setPreviewLesson(les)}
                              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                              title={isDoc ? "Preview Document" : isText ? "Read Article" : "Preview Video"}
                            >
                              {isDoc ? (
                                <Eye className="w-4 h-4 text-amber-600" />
                              ) : isText ? (
                                <BookOpen className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <Play className="w-4 h-4 text-indigo-600" />
                              )}
                            </button>

                            {/* Quiz Manager Button */}
                            <button
                              id={`manage-quiz-${les._id}`}
                              onClick={() => setQuizLesson({ _id: les._id, title: les.title })}
                              className="p-2 text-violet-600 hover:bg-violet-50 rounded-lg transition"
                              title="Manage Quiz for this lesson"
                            >
                              <HelpCircle className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleOpenEditLesson(mod._id, les)}
                              className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
                              title="Edit Lesson"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteLesson(les._id)}
                              className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition"
                              title="Delete Lesson"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

              </div>
            ))
          )}
        </div>
      </div>

      {/* Instructor Lesson Preview Modal (Video, Document, or Article) */}
      {previewLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl max-w-3xl w-full flex flex-col max-h-[90vh]">
            <div className="p-4 px-6 bg-slate-950 flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                {previewLesson.contentType === 'document' || previewLesson.documentUrl ? (
                  <FileText className="w-4 h-4 text-amber-400" />
                ) : previewLesson.contentType === 'text' ? (
                  <BookOpen className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Play className="w-4 h-4 text-indigo-400" />
                )}
                <span>Preview: {previewLesson.title}</span>
              </div>
              <button
                onClick={() => setPreviewLesson(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* PREVIEW CONTENT */}
            <div className="overflow-y-auto flex-1">
              {/* VIDEO PREVIEW */}
              {(previewLesson.contentType === 'video' || (!previewLesson.documentUrl && previewLesson.contentType !== 'text')) && (
                <div className="aspect-video bg-black flex items-center justify-center">
                  <video
                    src={previewLesson.videoUrl}
                    controls
                    autoPlay
                    className="w-full h-full object-contain"
                  >
                    {previewLesson.subtitlesUrl && (
                      <track
                        kind="subtitles"
                        src={previewLesson.subtitlesUrl}
                        srcLang="en"
                        label={previewLesson.subtitlesLabel || 'English'}
                        default
                      />
                    )}
                    Your browser does not support the video tag.
                  </video>
                </div>
              )}

              {/* DOCUMENT / PDF PREVIEW */}
              {(previewLesson.contentType === 'document' || previewLesson.contentType === 'pdf' || previewLesson.documentUrl) && (
                <div className="p-6 bg-slate-900 space-y-5">
                  <div className="p-6 rounded-2xl bg-slate-800/80 border border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold text-sm uppercase">
                        {previewLesson.documentType || 'PDF'}
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-base">{previewLesson.documentName || previewLesson.title}</h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {previewLesson.documentSize ? `${Math.round(previewLesson.documentSize / 1024)} KB • ` : ''}
                          Resource Document
                        </p>
                      </div>
                    </div>

                    {previewLesson.documentUrl && (
                      <a
                        href={previewLesson.documentUrl}
                        download
                        target="_blank"
                        rel="noreferrer"
                        className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download Resource</span>
                      </a>
                    )}
                  </div>

                  {previewLesson.content && (
                    <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-700/60 text-slate-300 text-sm whitespace-pre-wrap leading-relaxed">
                      <h5 className="font-bold text-slate-200 text-xs uppercase tracking-wider mb-2">Reading Instructions / Notes:</h5>
                      {previewLesson.content}
                    </div>
                  )}
                </div>
              )}

              {/* TEXT / ARTICLE PREVIEW */}
              {(previewLesson.contentType === 'text' || previewLesson.contentType === 'article') && (
                <div className="p-8 bg-slate-900 space-y-4">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Reading Material • {previewLesson.duration || 5} min read</span>
                  </div>

                  <h3 className="text-xl font-bold text-white">{previewLesson.title}</h3>

                  <div className="p-6 rounded-2xl bg-slate-800/60 border border-slate-700 text-slate-200 text-sm leading-relaxed whitespace-pre-wrap font-sans">
                    {previewLesson.content || 'No text content provided.'}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 px-6 bg-slate-950 text-xs text-slate-400 flex items-center justify-between border-t border-slate-800 shrink-0">
              <span className="capitalize">Type: <strong className="text-white">{previewLesson.contentType || 'Video'}</strong></span>
              <button
                onClick={() => setPreviewLesson(null)}
                className="px-5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Reject / Request Changes Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 text-rose-600 font-bold text-base">
                <AlertCircle className="w-5 h-5" />
                <span>Request Changes / Reject Course</span>
              </div>
              <button
                onClick={() => setShowRejectModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Explain clearly what needs improvement or why the course cannot be published yet (e.g., missing course slides, poor video resolution, incomplete lessons). The instructor will see this feedback directly on their dashboard.
            </p>

            <form onSubmit={handleRejectCourse} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Feedback for Instructor *</label>
                <textarea
                  rows={4}
                  placeholder="e.g., Please provide a downloadable PDF cheat sheet for Module 1, and ensure the video audio in Lesson 2 is clear..."
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 font-bold text-xs rounded-xl hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={rejecting}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-50 flex items-center gap-2"
                >
                  {rejecting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <span>Send Feedback & Request Changes</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Edit Course Modal */}
      {showEditCourseModal && course && (
        <EditCourseModal
          isOpen={showEditCourseModal}
          course={course}
          onClose={() => setShowEditCourseModal(false)}
          onSuccess={(updated) => {
            setShowEditCourseModal(false);
            fetchCourseDetails();
          }}
        />
      )}

      {/* Quiz Manager Modal */}
      {quizLesson && (
        <QuizManagerModal
          lessonId={quizLesson._id}
          lessonTitle={quizLesson.title}
          onClose={() => setQuizLesson(null)}
        />
      )}

    </div>
  );
}
