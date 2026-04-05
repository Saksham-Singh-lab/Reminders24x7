import { useState, useEffect } from 'react';
import { collection, query, onSnapshot, doc, updateDoc, deleteDoc, addDoc, setDoc, getDoc } from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../lib/firebase';
import { UserProfile, MockExam, Submission, PasswordResetRequest, Leaderboard } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Users, BookOpen, FileCheck, Key, Plus, Trash2, Check, X, Star, Trophy, RefreshCw, Clock, ExternalLink, Link as LinkIcon } from 'lucide-react';
import { format, isAfter, subMinutes } from 'date-fns';
import { cn } from '../lib/utils';

export default function Admin() {
  const [activeTab, setActiveTab] = useState<'users' | 'mocks' | 'submissions' | 'resets'>('users');
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [mocks, setMocks] = useState<MockExam[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [resets, setResets] = useState<PasswordResetRequest[]>([]);
  
  const [newMock, setNewMock] = useState({ title: '', date: '', pdfUrl: '', description: '' });
  const [checkingSubmission, setCheckingSubmission] = useState<Submission | null>(null);
  const [feedback, setFeedback] = useState('');
  const [score, setScore] = useState(0);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string, type: 'user' | 'mock' } | null>(null);

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (s) => setUsers(s.docs.map(d => d.data() as UserProfile)));
    const unsubMocks = onSnapshot(collection(db, 'mocks'), (s) => setMocks(s.docs.map(d => ({ id: d.id, ...d.data() } as MockExam))));
    const unsubSubmissions = onSnapshot(collection(db, 'submissions'), (s) => setSubmissions(s.docs.map(d => ({ id: d.id, ...d.data() } as Submission))));
    const unsubResets = onSnapshot(collection(db, 'passwordResetRequests'), (s) => setResets(s.docs.map(d => ({ id: d.id, ...d.data() } as PasswordResetRequest))));

    return () => { unsubUsers(); unsubMocks(); unsubSubmissions(); unsubResets(); };
  }, []);

  const handleApproveUser = async (uid: string) => {
    try {
      await updateDoc(doc(db, 'users', uid), { approved: true });
    } catch (e) { handleFirestoreError(e, OperationType.UPDATE, `users/${uid}`); }
  };

  const handleMakeAdmin = async (uid: string) => {
    try {
      await updateDoc(doc(db, 'users', uid), { role: 'admin' });
    } catch (e) { handleFirestoreError(e, OperationType.UPDATE, `users/${uid}`); }
  };

  const handleDeleteUser = async (uid: string) => {
    try {
      await deleteDoc(doc(db, 'users', uid));
      setDeleteConfirm(null);
    } catch (e) { handleFirestoreError(e, OperationType.DELETE, `users/${uid}`); }
  };

  const handleAddMock = async () => {
    if (!newMock.title || !newMock.pdfUrl) return;
    try {
      await addDoc(collection(db, 'mocks'), newMock);
      setNewMock({ title: '', date: '', pdfUrl: '', description: '' });
    } catch (e) { handleFirestoreError(e, OperationType.CREATE, 'mocks'); }
  };

  const handleDeleteMock = async (mockId: string) => {
    try {
      await deleteDoc(doc(db, 'mocks', mockId));
      setDeleteConfirm(null);
    } catch (e) { handleFirestoreError(e, OperationType.DELETE, `mocks/${mockId}`); }
  };

  const handleCheckSubmission = async () => {
    if (!checkingSubmission) return;
    try {
      await updateDoc(doc(db, 'submissions', checkingSubmission.id), {
        status: 'checked',
        score,
        feedback,
      });
      setCheckingSubmission(null);
      setFeedback('');
      setScore(0);
    } catch (e) { handleFirestoreError(e, OperationType.UPDATE, `submissions/${checkingSubmission.id}`); }
  };

  const handleRefreshLeaderboard = async (mockId: string) => {
    const mockSubmissions = submissions.filter(s => s.mockId === mockId && s.status === 'checked');
    const rankings = mockSubmissions
      .map(s => ({ studentName: s.studentName, score: s.score || 0 }))
      .sort((a, b) => b.score - a.score);

    try {
      await setDoc(doc(db, 'leaderboards', mockId), {
        mockId,
        rankings,
      });
    } catch (e) { handleFirestoreError(e, OperationType.WRITE, `leaderboards/${mockId}`); }
  };

  const handleApproveReset = async (requestId: string) => {
    try {
      await updateDoc(doc(db, 'passwordResetRequests', requestId), { status: 'approved' });
    } catch (e) { handleFirestoreError(e, OperationType.UPDATE, `passwordResetRequests/${requestId}`); }
  };

  const isRequestValid = (timestamp: string) => {
    return isAfter(new Date(timestamp), subMinutes(new Date(), 5));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Admin Portal 👑</h1>
          <p className="text-slate-500">Manage users, mocks, and community requests.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-white p-2 rounded-2xl shadow-sm border border-primary-100 overflow-x-auto no-scrollbar">
        {[
          { id: 'users', icon: Users, label: 'Users' },
          { id: 'mocks', icon: BookOpen, label: 'Mocks' },
          { id: 'submissions', icon: FileCheck, label: 'Submissions' },
          { id: 'resets', icon: Key, label: 'Resets' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all whitespace-nowrap",
              activeTab === tab.id ? "bg-primary-500 text-white shadow-lg shadow-primary-200" : "text-slate-500 hover:bg-primary-50"
            )}
          >
            <tab.icon size={20} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-white rounded-3xl shadow-xl shadow-primary-100/20 border border-primary-50 p-8">
        {activeTab === 'users' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800 mb-6">User Management</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-slate-400 text-sm font-bold uppercase tracking-wider border-b border-primary-50">
                    <th className="pb-4 pl-4">User</th>
                    <th className="pb-4">Role</th>
                    <th className="pb-4">Status</th>
                    <th className="pb-4 text-right pr-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-primary-50">
                  {users.map((user) => (
                    <tr key={user.uid} className="group hover:bg-primary-50/50 transition-colors">
                      <td className="py-4 pl-4">
                        <div className="flex items-center gap-3">
                          <img src={user.avatar} className="w-10 h-10 rounded-full" alt="" />
                          <div>
                            <div className="font-bold text-slate-800">{user.name}</div>
                            <div className="text-xs text-slate-400">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-xs font-bold",
                          user.role === 'admin' ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600"
                        )}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-4">
                        <span className={cn(
                          "px-3 py-1 rounded-full text-xs font-bold",
                          user.approved ? "bg-green-100 text-green-600" : "bg-yellow-100 text-yellow-600"
                        )}>
                          {user.approved ? 'Approved' : 'Pending'}
                        </span>
                      </td>
                      <td className="py-4 text-right pr-4 space-x-2">
                        {!user.approved && (
                          <button onClick={() => handleApproveUser(user.uid)} className="p-2 text-green-500 hover:bg-green-50 rounded-xl transition-colors" title="Approve">
                            <Check size={20} />
                          </button>
                        )}
                        {user.role !== 'admin' && (
                          <button onClick={() => handleMakeAdmin(user.uid)} className="p-2 text-purple-500 hover:bg-purple-50 rounded-xl transition-colors" title="Make Admin">
                            <Star size={20} />
                          </button>
                        )}
                        <button onClick={() => setDeleteConfirm({ id: user.uid, type: 'user' })} className="p-2 text-red-400 hover:bg-red-50 rounded-xl transition-colors" title="Delete">
                          <Trash2 size={20} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'mocks' && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-slate-800">Mock Papers</h2>
              <button onClick={() => setActiveTab('mocks')} className="p-3 bg-primary-500 text-white rounded-2xl shadow-lg shadow-primary-200">
                <Plus size={24} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-primary-50/50 rounded-3xl border border-primary-100 space-y-4">
                <h3 className="font-bold text-slate-800">Create New Mock</h3>
                <input
                  type="text"
                  placeholder="Mock Title"
                  value={newMock.title}
                  onChange={(e) => setNewMock({ ...newMock, title: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-primary-100 rounded-2xl outline-none"
                />
                <input
                  type="date"
                  value={newMock.date}
                  onChange={(e) => setNewMock({ ...newMock, date: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-primary-100 rounded-2xl outline-none"
                />
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Mock Paper Link (Google Drive/PDF)</label>
                  <div className="relative">
                    <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                      type="url"
                      value={newMock.pdfUrl}
                      onChange={(e) => setNewMock({ ...newMock, pdfUrl: e.target.value })}
                      className="w-full pl-12 pr-4 py-4 bg-white border border-primary-100 rounded-2xl outline-none focus:border-primary-300 transition-all"
                      placeholder="https://drive.google.com/..."
                      required
                    />
                  </div>
                </div>
                <textarea
                  placeholder="Description"
                  value={newMock.description}
                  onChange={(e) => setNewMock({ ...newMock, description: e.target.value })}
                  className="w-full px-4 py-3 bg-white border border-primary-100 rounded-2xl outline-none h-24"
                />
                <button 
                  onClick={handleAddMock} 
                  disabled={!newMock.pdfUrl || !newMock.title}
                  className="w-full py-4 bg-primary-500 text-white font-bold rounded-2xl shadow-lg shadow-primary-200 disabled:opacity-50"
                >
                  Upload Mock
                </button>
              </div>

              <div className="space-y-4">
                {mocks.map(mock => (
                  <div key={mock.id} className="p-4 bg-white border border-primary-100 rounded-2xl flex justify-between items-center">
                    <div>
                      <div className="font-bold text-slate-800">{mock.title}</div>
                      <div className="text-xs text-slate-400">{mock.date}</div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleRefreshLeaderboard(mock.id)} className="p-2 text-yellow-600 hover:bg-yellow-50 rounded-xl" title="Refresh Leaderboard">
                        <RefreshCw size={18} />
                      </button>
                      <button onClick={() => setDeleteConfirm({ id: mock.id!, type: 'mock' })} className="p-2 text-red-400 hover:bg-red-50 rounded-xl" title="Delete Mock">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'submissions' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">Submissions to Review</h2>
            <div className="grid grid-cols-1 gap-4">
              {submissions.map(sub => (
                <div key={sub.id} className="p-6 bg-white border border-primary-100 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary-50 text-primary-500 rounded-2xl">
                      <FileCheck size={24} />
                    </div>
                    <div>
                      <div className="font-bold text-slate-800">{sub.studentName}</div>
                      <div className="text-xs text-slate-400">Mock ID: {sub.mockId} • {format(new Date(sub.submittedAt), 'MMM d, h:mm a')}</div>
                    </div>
                  </div>
                  <div className="flex gap-3 w-full md:w-auto">
                    <a href={sub.pdfUrl} target="_blank" rel="noopener noreferrer" className="flex-1 md:flex-none px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm text-center">
                      View PDF
                    </a>
                    <button
                      onClick={() => setCheckingSubmission(sub)}
                      className={cn(
                        "flex-1 md:flex-none px-4 py-2 rounded-xl font-bold text-sm",
                        sub.status === 'checked' ? "bg-green-100 text-green-600" : "bg-primary-500 text-white shadow-lg shadow-primary-200"
                      )}
                    >
                      {sub.status === 'checked' ? 'Edit Review' : 'Check Paper'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'resets' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-800">Password Reset Requests</h2>
            <div className="grid grid-cols-1 gap-4">
              {resets.map(req => {
                const isValid = isRequestValid(req.timestamp);
                return (
                  <div key={req.id} className={cn(
                    "p-6 rounded-3xl border flex justify-between items-center",
                    !isValid ? "bg-slate-50 border-slate-100 opacity-60" : "bg-white border-primary-100"
                  )}>
                    <div className="flex items-center gap-4">
                      <div className={cn("p-3 rounded-2xl", isValid ? "bg-primary-50 text-primary-500" : "bg-slate-200 text-slate-400")}>
                        <Clock size={24} />
                      </div>
                      <div>
                        <div className="font-bold text-slate-800">{req.userName || req.userId}</div>
                        <div className="text-xs text-slate-400">
                          Requested: {format(new Date(req.timestamp), 'h:mm:ss a')} 
                          {!isValid && <span className="text-red-400 ml-2 font-bold">(EXPIRED)</span>}
                        </div>
                      </div>
                    </div>
                    {isValid && req.status === 'pending' && (
                      <div className="flex gap-2">
                        <button onClick={() => handleApproveReset(req.id)} className="p-3 bg-green-500 text-white rounded-2xl shadow-lg shadow-green-100">
                          <Check size={20} />
                        </button>
                        <button className="p-3 bg-red-500 text-white rounded-2xl shadow-lg shadow-red-100">
                          <X size={20} />
                        </button>
                      </div>
                    )}
                    {req.status !== 'pending' && (
                      <span className={cn(
                        "px-4 py-2 rounded-xl font-bold text-sm",
                        req.status === 'approved' ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                      )}>
                        {req.status}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white w-full max-w-sm rounded-3xl p-8 shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Are you sure?</h3>
              <p className="text-slate-500 mb-8">This action cannot be undone. This {deleteConfirm.type} will be permanently removed.</p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-2xl"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => deleteConfirm.type === 'user' ? handleDeleteUser(deleteConfirm.id) : handleDeleteMock(deleteConfirm.id)}
                  className="flex-1 py-3 bg-red-500 text-white font-bold rounded-2xl shadow-lg shadow-red-100"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Checking Modal */}
      <AnimatePresence>
        {checkingSubmission && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white w-full max-w-2xl rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-slate-800">Check Submission</h2>
                <button onClick={() => setCheckingSubmission(null)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                  <X size={20} className="text-slate-400" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex justify-between items-center p-4 bg-primary-50 rounded-2xl">
                  <div className="font-bold text-primary-600">{checkingSubmission.studentName}</div>
                  <a href={checkingSubmission.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-primary-500 underline flex items-center gap-1">
                    Open PDF <ExternalLink size={14} />
                  </a>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Score (%)</label>
                  <input
                    type="number"
                    value={score}
                    onChange={(e) => setScore(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-primary-300 focus:bg-white rounded-2xl outline-none transition-all"
                    min="0" max="100"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">Feedback (Markdown supported)</label>
                  <textarea
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border-2 border-transparent focus:border-primary-300 focus:bg-white rounded-2xl outline-none transition-all h-48 resize-none"
                    placeholder="Great work! Here are some points to improve..."
                  />
                </div>

                <button
                  onClick={handleCheckSubmission}
                  className="w-full py-4 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-2xl shadow-lg shadow-primary-200 transition-all"
                >
                  Submit Review
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
