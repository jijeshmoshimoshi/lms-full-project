'use client';
import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { 
  Users, Search, Shield, Trash2, UserCheck, GraduationCap, 
  AlertTriangle, CheckCircle2, Clock, XCircle, Award, Sparkles,
  BookOpen, CreditCard, Banknote
} from 'lucide-react';

export default function AdminUsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [instructorStatsMap, setInstructorStatsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'pending' | 'verified' | 'students'
  const [processingId, setProcessingId] = useState(null);

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.get('/users'),
      api.get('/admin/instructors-overview').catch(() => ({ data: [] })),
    ])
      .then(([usersRes, instRes]) => {
        setUsers(usersRes.data || []);
        const map = {};
        (instRes.data || []).forEach(inst => {
          map[inst._id] = inst;
        });
        setInstructorStatsMap(map);
      })
      .catch(() => setUsers([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { 
    if (user?.role === 'admin') loadData(); 
  }, [user]);

  const changeRole = async (id, role) => {
    try {
      await api.put(`/users/${id}/role`, { role });
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update user role');
    }
  };

  const handleVerifyInstructor = async (id, isVerified) => {
    setProcessingId(id);
    try {
      await api.put(`/users/${id}/verify`, { isVerified });
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update verification status');
    } finally {
      setProcessingId(null);
    }
  };

  const removeUser = async (id) => {
    if (!confirm('Are you sure you want to delete this user? All associated progress will be removed.')) return;
    try {
      await api.delete(`/users/${id}`);
      loadData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user');
    }
  };

  if (!user) return <p className="p-8 text-center text-slate-500">Please log in.</p>;
  if (user.role !== 'admin') {
    return (
      <div className="p-12 text-center max-w-md mx-auto">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-md">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-800 mb-1">Access Restricted</h2>
          <p className="text-slate-500 text-sm">Only super administrators can access and manage user directory accounts.</p>
        </div>
      </div>
    );
  }

  // Counts for tabs
  const instructors = users.filter((u) => u.role === 'instructor');
  const pendingCount = instructors.filter((u) => !u.isVerified).length;
  const verifiedInstructorsCount = instructors.filter((u) => u.isVerified).length;
  const studentsCount = users.filter((u) => u.role === 'student').length;

  const filteredUsers = users.filter((u) => {
    const matchesSearch = 
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (activeTab === 'pending') {
      return u.role === 'instructor' && !u.isVerified;
    }
    if (activeTab === 'verified') {
      return u.role === 'instructor' && u.isVerified;
    }
    if (activeTab === 'students') {
      return u.role === 'student';
    }
    return true;
  });

  return (
    <div className="space-y-8 pb-16">
      
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full mb-2">
            <Users className="w-3.5 h-3.5" />
            <span>Platform User Governance</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">User & Instructor Directory</h1>
          <p className="text-slate-500 text-sm mt-1 max-w-2xl">
            Audit learner credentials, grant educator permissions, inspect instructor revenue contributions, and verify accounts to publish marketplace offerings.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-xs"
          />
        </div>
      </div>

      {/* 4 Stat Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total User Base</span>
          <div className="text-2xl font-extrabold text-slate-900">{users.length}</div>
          <p className="text-xs text-slate-500">Platform Accounts</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-sky-500">Student Learners</span>
          <div className="text-2xl font-extrabold text-slate-900">{studentsCount}</div>
          <p className="text-xs text-slate-500">Registered Students</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500">Verified Instructors</span>
          <div className="text-2xl font-extrabold text-emerald-600">{verifiedInstructorsCount}</div>
          <p className="text-xs text-slate-500">Active Course Creators</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500">Pending Verification</span>
          <div className={`text-2xl font-extrabold ${pendingCount > 0 ? 'text-amber-600 animate-pulse' : 'text-slate-900'}`}>
            {pendingCount}
          </div>
          <p className="text-xs text-slate-500">Awaiting Admin Action</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'all'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <span>All Accounts</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300">
            {users.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('pending')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'pending'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-amber-50 border border-slate-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Pending Verification</span>
          {pendingCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500 text-slate-950 font-black animate-pulse">
              {pendingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('verified')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'verified'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Verified Instructors</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-indigo-100 text-indigo-700">
            {verifiedInstructorsCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('students')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
            activeTab === 'students'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>Students</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700">
            {studentsCount}
          </span>
        </button>
      </div>

      {/* Users Table Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Fetching user records...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            No user accounts found matching your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase text-[11px] font-bold tracking-wider border-b border-slate-200/80">
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Role Permission</th>
                  <th className="px-6 py-4">Instructor Audit & KYC</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredUsers.map((u) => {
                  const isInstructor = u.role === 'instructor';
                  const isVerified = !!u.isVerified;
                  const instStats = instructorStatsMap[u._id];

                  return (
                    <tr key={u._id} className="hover:bg-slate-50/60 transition duration-150">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full text-white text-xs font-bold flex items-center justify-center uppercase shadow-xs ${
                            u.role === 'admin' 
                              ? 'bg-gradient-to-tr from-purple-600 to-indigo-600' 
                              : isInstructor 
                              ? 'bg-gradient-to-tr from-indigo-500 to-purple-500' 
                              : 'bg-gradient-to-tr from-slate-600 to-slate-800'
                          }`}>
                            {u.name ? u.name.charAt(0) : 'U'}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block">{u.name}</span>
                            <span className="text-xs text-slate-400 font-mono">ID: {u._id ? u._id.slice(-6) : 'N/A'}</span>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 text-slate-600 font-medium">{u.email}</td>

                      <td className="px-6 py-4">
                        <select 
                          value={u.role} 
                          onChange={(e) => changeRole(u._id, e.target.value)}
                          className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition cursor-pointer ${
                            u.role === 'admin'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : u.role === 'instructor'
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          <option value="student">Student</option>
                          <option value="instructor">Instructor</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>

                      {/* Instructor Details / Verification */}
                      <td className="px-6 py-4">
                        {isInstructor ? (
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-3">
                              {isVerified ? (
                                <div className="flex items-center gap-2">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    <span>Verified</span>
                                  </span>
                                  <button
                                    onClick={() => handleVerifyInstructor(u._id, false)}
                                    disabled={processingId === u._id}
                                    className="text-[11px] font-semibold text-slate-400 hover:text-rose-600 hover:underline transition cursor-pointer"
                                  >
                                    Revoke
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                                    <Clock className="w-3.5 h-3.5" />
                                    <span>Pending Approval</span>
                                  </span>
                                  <button
                                    onClick={() => handleVerifyInstructor(u._id, true)}
                                    disabled={processingId === u._id}
                                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-xs transition disabled:opacity-50 cursor-pointer"
                                  >
                                    {processingId === u._id ? 'Verifying...' : 'Verify Teacher'}
                                  </button>
                                </div>
                              )}
                            </div>

                            {instStats && (
                              <div className="text-[11px] text-slate-400 flex items-center gap-3">
                                <span>{instStats.coursesCount || 0} Courses</span>
                                <span>•</span>
                                <span>{instStats.totalStudents || 0} Learners</span>
                                <span>•</span>
                                <span className={`font-semibold capitalize ${
                                  instStats.payoutStatus === 'active' ? 'text-emerald-600' : 'text-amber-600'
                                }`}>
                                  Route: {instStats.payoutStatus?.replace('_', ' ')}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : u.role === 'admin' ? (
                          <span className="text-xs font-bold text-purple-700 flex items-center gap-1">
                            <Shield className="w-3.5 h-3.5" />
                            <span>System Super Admin</span>
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 font-medium">Standard Learner</span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => removeUser(u._id)}
                          className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                          title="Delete User"
                        >
                          <Trash2 className="w-4.5 h-4.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
