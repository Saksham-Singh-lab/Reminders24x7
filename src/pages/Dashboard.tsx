import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../lib/firebase';
import { useAuth } from '../App';
import { Reminder } from '../types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Bell, Trash2, X, Sparkles } from 'lucide-react';
import { cn } from '../lib/utils';

export default function Dashboard() {
  const { profile, isAdmin } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newReminder, setNewReminder] = useState({ title: '', description: '' });

  useEffect(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    
    const q = query(
      collection(db, 'reminders'),
      where('date', '>=', format(start, 'yyyy-MM-dd')),
      where('date', '<=', format(end, 'yyyy-MM-dd'))
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reminder));
      setReminders(data);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'reminders');
    });

    return () => unsubscribe();
  }, [currentMonth]);

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const selectedDateReminders = reminders.filter(r => isSameDay(new Date(r.date), selectedDate));

  const handleAddReminder = async () => {
    if (!newReminder.title) return;
    try {
      await addDoc(collection(db, 'reminders'), {
        ...newReminder,
        date: format(selectedDate, 'yyyy-MM-dd'),
        createdBy: profile?.uid,
      });
      setNewReminder({ title: '', description: '' });
      setShowAddModal(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'reminders');
    }
  };

  const handleDeleteReminder = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'reminders', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, 'reminders');
    }
  };

  if (!profile?.approved) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8 bg-white rounded-3xl shadow-xl">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="text-6xl mb-6"
        >
          ⏳
        </motion.div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Account Pending Approval</h2>
        <p className="text-gray-500 max-w-md">
          Welcome {profile?.name}! Your account is currently pending approval from the admin. 
          Please check back later once Saksham Singh has approved your access. ✨
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Hello, {profile?.name}! 👋</h1>
          <p className="text-gray-500">Here's what's happening in our community.</p>
        </div>
        <div className="flex items-center gap-2 bg-white p-2 rounded-2xl shadow-sm border border-pink-100">
          <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-pink-50 rounded-xl transition-colors">
            <ChevronLeft size={20} className="text-pink-500" />
          </button>
          <span className="text-lg font-bold text-gray-700 min-w-[140px] text-center">
            {format(currentMonth, 'MMMM yyyy')}
          </span>
          <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-pink-50 rounded-xl transition-colors">
            <ChevronRight size={20} className="text-pink-500" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-xl shadow-pink-100 border border-pink-50">
          <div className="grid grid-cols-7 gap-2 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center text-xs font-bold text-pink-300 uppercase tracking-wider py-2">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {days.map((day, idx) => {
              const dayReminders = reminders.filter(r => isSameDay(new Date(r.date), day));
              const isSelected = isSameDay(day, selectedDate);
              const isTodayDate = isToday(day);

              return (
                <button
                  key={day.toString()}
                  onClick={() => setSelectedDate(day)}
                  className={cn(
                    "relative h-16 md:h-24 p-2 rounded-2xl transition-all duration-200 border-2 flex flex-col items-center justify-center gap-1",
                    isSelected ? "bg-pink-500 border-pink-500 text-white shadow-lg shadow-pink-200" : "bg-white border-transparent hover:border-pink-200 text-gray-700",
                    isTodayDate && !isSelected && "text-pink-500 font-bold"
                  )}
                >
                  <span className="text-sm md:text-lg font-bold">{format(day, 'd')}</span>
                  {dayReminders.length > 0 && (
                    <div className="flex gap-1">
                      {dayReminders.slice(0, 3).map((_, i) => (
                        <div key={i} className={cn("w-1.5 h-1.5 rounded-full", isSelected ? "bg-white" : "bg-pink-400")} />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Reminders List */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-xl shadow-pink-100 border border-pink-50 flex flex-col h-full min-h-[400px]">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <Bell className="text-pink-500" size={24} />
                <h2 className="text-xl font-bold text-gray-800">Reminders</h2>
              </div>
              {isAdmin && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="p-2 bg-pink-100 text-pink-600 rounded-xl hover:bg-pink-200 transition-colors"
                >
                  <Plus size={20} />
                </button>
              )}
            </div>

            <div className="text-sm text-gray-400 mb-4 font-medium">
              {format(selectedDate, 'EEEE, MMMM do')}
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto pr-2">
              <AnimatePresence mode="popLayout">
                {selectedDateReminders.length > 0 ? (
                  selectedDateReminders.map((reminder) => (
                    <motion.div
                      key={reminder.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="p-4 bg-pink-50/50 rounded-2xl border border-pink-100 group relative"
                    >
                      <h3 className="font-bold text-gray-800 mb-1">{reminder.title}</h3>
                      <p className="text-sm text-gray-500 leading-relaxed">{reminder.description}</p>
                      {isAdmin && (
                        <button
                          onClick={() => handleDeleteReminder(reminder.id)}
                          className="absolute top-2 right-2 p-1 text-pink-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </motion.div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-40 text-gray-400">
                    <Sparkles size={32} className="mb-2 opacity-20" />
                    <p className="text-sm">No reminders for today!</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Add Reminder Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Add Reminder</h2>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Title</label>
                  <input
                    type="text"
                    value={newReminder.title}
                    onChange={(e) => setNewReminder({ ...newReminder, title: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-pink-300 focus:bg-white rounded-2xl outline-none transition-all"
                    placeholder="Exam tomorrow!"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Description</label>
                  <textarea
                    value={newReminder.description}
                    onChange={(e) => setNewReminder({ ...newReminder, description: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-transparent focus:border-pink-300 focus:bg-white rounded-2xl outline-none transition-all h-32 resize-none"
                    placeholder="Don't forget to bring your admit card..."
                  />
                </div>
                <button
                  onClick={handleAddReminder}
                  className="w-full py-4 bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-2xl shadow-lg shadow-pink-200 transition-all mt-4"
                >
                  Create Reminder
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
