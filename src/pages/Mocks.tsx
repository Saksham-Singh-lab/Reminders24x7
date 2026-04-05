import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, doc, updateDoc, orderBy } from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../lib/firebase';
import { useAuth } from '../App';
import { MockExam, Submission, Leaderboard } from '../types';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Upload, CheckCircle, Clock, FileText, Trophy, ExternalLink, Send, X, Star, Sparkles, Link as LinkIcon, Info } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';

export default function Mocks() {
  const { profile, isAdmin } = useAuth();
  const [mocks, setMocks] = useState<MockExam[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [leaderboards, setLeaderboards] = useState<Leaderboard[]>([]);
  const [selectedMock, setSelectedMock] = useState<MockExam | null>(null);
  const [pdfUrl, setPdfUrl] = useState('');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const qMocks = query(collection(db, 'mocks'), orderBy('date', 'desc'));
    const unsubscribeMocks = onSnapshot(qMocks, (snapshot) => {
      setMocks(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MockExam)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'mocks'));

    const qSubmissions = isAdmin 
      ? query(collection(db, 'submissions'), orderBy('submittedAt', 'desc'))
      : query(collection(db, 'submissions'), where('studentId', '==', profile?.uid));
    
    const unsubscribeSubmissions = onSnapshot(qSubmissions, (snapshot) => {
      setSubmissions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Submission)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'submissions'));

    const qLeaderboards = query(collection(db, 'leaderboards'));
    const unsubscribeLeaderboards = onSnapshot(qLeaderboards, (snapshot) => {
      setLeaderboards(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Leaderboard)));
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'leaderboards'));

    return () => {
      unsubscribeMocks();
      unsubscribeSubmissions();
      unsubscribeLeaderboards();
    };
  }, [isAdmin, profile?.uid]);

  const handleSubmit = async () => {
    if (!selectedMock || !pdfUrl) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'submissions'), {
        mockId: selectedMock.id,
        studentId: profile?.uid,
        studentName: profile?.name,
        pdfUrl,
        status: 'pending',
        submittedAt: new Date().toISOString(),
      });
      setPdfUrl('');
      setShowSubmitModal(false);
      setSelectedMock(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'submissions');
    } finally {
      setLoading(false);
    }
  };

  const getSubmissionForMock = (mockId: string) => {
    return submissions.find(s => s.mockId === mockId);
  };

  const getLeaderboardForMock = (mockId: string) => {
    return leaderboards.find(l => l.mockId === mockId);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Mock Exams 📝</h1>
          <p className="text-gray-500">Practice makes perfect. Upload your answers and get feedback.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Mock List */}
        <div className="lg:col-span-2 space-y-6">
          {mocks.map((mock) => {
            const submission = getSubmissionForMock(mock.id);
            const leaderboard = getLeaderboardForMock(mock.id);

            return (
              <motion.div
                key={mock.id}
                layout
                className="bg-white p-6 rounded-3xl shadow-xl shadow-pink-100 border border-pink-50 hover:shadow-2xl transition-all duration-300"
              >
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-pink-100 text-pink-600 rounded-2xl">
                        <FileText size={24} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-800">{mock.title}</h3>
                        <p className="text-sm text-gray-400 font-medium">{format(new Date(mock.date), 'MMMM do, yyyy')}</p>
                      </div>
                    </div>
                    <p className="text-gray-600 leading-relaxed">{mock.description}</p>
                    
                    <div className="flex flex-wrap gap-3">
                      <a
                        href={mock.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-pink-50 text-pink-600 rounded-xl hover:bg-pink-100 transition-colors text-sm font-bold"
                      >
                        <ExternalLink size={16} />
                        View Paper
                      </a>
                      
                      {!submission ? (
                        <button
                          onClick={() => {
                            setSelectedMock(mock);
                            setShowSubmitModal(true);
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-pink-500 text-white rounded-xl hover:bg-pink-600 transition-colors text-sm font-bold shadow-lg shadow-pink-100"
                        >
                          <Upload size={16} />
                          Submit Answers
                        </button>
                      ) : (
                        <div className={cn(
                          "flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold",
                          submission.status === 'checked' ? "bg-green-50 text-green-600" : "bg-blue-50 text-blue-600"
                        )}>
                          {submission.status === 'checked' ? <CheckCircle size={16} /> : <Clock size={16} />}
                          {submission.status === 'checked' ? 'Checked' : 'Pending Review'}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Results/Leaderboard Preview */}
                  <div className="w-full md:w-64 space-y-4">
                    {submission?.status === 'checked' && (
                      <div className="p-4 bg-green-50 rounded-2xl border border-green-100">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-green-600 uppercase">Your Score</span>
                          <Star size={16} className="text-green-500 fill-green-500" />
                        </div>
                        <div className="text-3xl font-black text-green-700">{submission.score}%</div>
                      </div>
                    )}

                    {leaderboard && (
                      <div className="p-4 bg-yellow-50 rounded-2xl border border-yellow-100">
                        <div className="flex items-center gap-2 mb-3">
                          <Trophy size={16} className="text-yellow-600" />
                          <span className="text-xs font-bold text-yellow-700 uppercase tracking-wider">Top Performers</span>
                        </div>
                        <div className="space-y-2">
                          {leaderboard.rankings.slice(0, 3).map((rank, i) => (
                            <div key={i} className="flex justify-between items-center text-sm">
                              <span className="text-gray-600 font-medium truncate max-w-[120px]">{rank.studentName}</span>
                              <span className="font-bold text-yellow-700">{rank.score}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Feedback Block */}
                {submission?.feedback && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    className="mt-6 p-6 bg-gray-50 rounded-2xl border border-gray-100 overflow-hidden"
                  >
                    <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                      <Sparkles size={18} className="text-pink-400" />
                      Review Feedback
                    </h4>
                    <div className="prose prose-pink prose-sm max-w-none text-gray-600">
                      <ReactMarkdown>{submission.feedback}</ReactMarkdown>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-xl shadow-pink-100 border border-pink-50">
            <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Clock className="text-pink-500" size={24} />
              Upcoming Mocks
            </h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              New mock papers are uploaded one week before every exam. Stay tuned and keep practicing!
            </p>
          </div>

          <div className="bg-pink-500 p-6 rounded-3xl shadow-xl shadow-pink-200 text-white">
            <Trophy className="mb-4 opacity-50" size={48} />
            <h2 className="text-xl font-bold mb-2">Leaderboard System</h2>
            <p className="text-pink-100 text-sm leading-relaxed">
              Compete with your classmates! Top scores are featured on the leaderboard after papers are checked.
            </p>
          </div>
        </div>
      </div>

      {/* Submit Modal */}
      <AnimatePresence>
        {showSubmitModal && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Submit Answers</h2>
                <button onClick={() => setShowSubmitModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-pink-50 rounded-2xl mb-4">
                  <p className="text-sm text-pink-600 font-bold">Mock: {selectedMock?.title}</p>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 ml-1">Answer Script Link (Google Drive/PDF)</label>
                  <div className="relative">
                    <LinkIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="url"
                      value={pdfUrl}
                      onChange={(e) => setPdfUrl(e.target.value)}
                      className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:border-pink-300 focus:bg-white rounded-2xl outline-none transition-all"
                      placeholder="https://drive.google.com/..."
                      required
                    />
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex gap-3">
                  <Info className="text-blue-500 shrink-0" size={20} />
                  <div className="text-xs text-blue-700 leading-relaxed">
                    <p className="font-bold mb-1">How to get a link:</p>
                    <ol className="list-decimal ml-4 space-y-1">
                      <li>Upload your PDF to Google Drive.</li>
                      <li>Right-click the file and select <b>Share</b>.</li>
                      <li>Change access to <b>"Anyone with the link"</b>.</li>
                      <li>Click <b>Copy link</b> and paste it here!</li>
                    </ol>
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={loading || !pdfUrl}
                  className="w-full py-4 bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-2xl shadow-lg shadow-pink-200 transition-all mt-4 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading ? 'Submitting...' : (
                    <>
                      <Send size={20} />
                      Submit Now
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
