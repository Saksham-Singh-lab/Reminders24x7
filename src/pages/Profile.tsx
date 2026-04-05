import { useState, useEffect } from 'react';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db, OperationType, handleFirestoreError } from '../lib/firebase';
import { useAuth } from '../App';
import { UserProfile } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { User, Camera, Sparkles, Check, Save, Shield, Mail, UserCircle, Layout, Terminal, Heart, Moon, Sun, Monitor } from 'lucide-react';
import { cn } from '../lib/utils';
import { DashboardTheme } from '../types';

const AVATARS = [
  // Hacker / Cool Guy
  { id: 'h1', url: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=Hacker&backgroundColor=000000', label: 'Cyber Hacker', style: 'hacker' },
  { id: 'h2', url: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Neo&backgroundColor=1a1a1a', label: 'Pixel Neo', style: 'hacker' },
  { id: 'h3', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=HackerGirl&backgroundColor=1a1a1a&top=shortHair&accessories=wayfarers&clothing=hoodie', label: 'Tech Girl', style: 'hacker' },
  { id: 'c1', url: 'https://api.dicebear.com/7.x/big-smile/svg?seed=CoolGuy&backgroundColor=b6e3f4', label: 'Cool Guy', style: 'cool' },
  { id: 'c2', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix&backgroundColor=ffdfbf&top=shortHair&accessories=sunglasses', label: 'Shades', style: 'cool' },
  { id: 'c3', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=CoolGirl&backgroundColor=ffd5dc&top=longHair&accessories=sunglasses&clothing=graphicShirt', label: 'Vibe Girl', style: 'cool' },
  
  // Cute Girl / Boy
  { id: 'g1', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Mochi&backgroundColor=ffd5dc', label: 'Cute Mochi', style: 'cute' },
  { id: 'g2', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Sakura&backgroundColor=c0aede', label: 'Sakura', style: 'cute' },
  { id: 'g3', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=PetGirl&backgroundColor=b6e3f4&top=longHair&clothing=overall', label: 'Pet Lover', style: 'cute' },
  { id: 'g4', url: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Bunny&backgroundColor=fdf2f8', label: 'Bunny Girl', style: 'cute' },
  { id: 'b1', url: 'https://api.dicebear.com/7.x/big-smile/svg?seed=HappyBoy&backgroundColor=d1d4f9', label: 'Happy Boy', style: 'cute' },
  { id: 'b2', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=SoftBoy&backgroundColor=e0e7ff&top=shortHair&clothing=sweater', label: 'Soft Boy', style: 'cute' },
  
  // Diverse / Professional
  { id: 'd1', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Diverse1&backgroundColor=ffdfbf', label: 'Aria', style: 'diverse' },
  { id: 'd2', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Diverse2&backgroundColor=c0aede', label: 'Kai', style: 'diverse' },
  { id: 'd3', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Diverse3&backgroundColor=ffd5dc', label: 'Zoe', style: 'diverse' },
  { id: 'd4', url: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Diverse4&backgroundColor=b6e3f4', label: 'Leo', style: 'diverse' },
];

const THEMES: { id: DashboardTheme; label: string; icon: any; color: string; description: string }[] = [
  { id: 'classic', label: 'Classic Indigo', icon: Monitor, color: 'bg-primary-500', description: 'The original clean and professional look.' },
  { id: 'hacker', label: 'Hacker Terminal', icon: Terminal, color: 'bg-green-500', description: 'Dark mode with matrix green accents and mono fonts.' },
  { id: 'cute-boy', label: 'Soft Blue', icon: Sun, color: 'bg-blue-400', description: 'Gentle blue pastels and rounded aesthetics.' },
  { id: 'cute-girl', label: 'Pastel Pink', icon: Heart, color: 'bg-pink-400', description: 'Warm pink tones and playful interactions.' },
  { id: 'cyberpunk', label: 'Neon Night', icon: Moon, color: 'bg-purple-600', description: 'Vibrant neon colors and high-contrast dark mode.' },
  { id: 'minimalist', label: 'Pure White', icon: Layout, color: 'bg-slate-400', description: 'Clean, focused, and distraction-free.' },
];

export default function Profile() {
  const { profile } = useAuth();
  const [name, setName] = useState(profile?.name || '');
  const [selectedAvatar, setSelectedAvatar] = useState(profile?.avatar || '');
  const [selectedTheme, setSelectedTheme] = useState<DashboardTheme>(profile?.theme || 'classic');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setSelectedAvatar(profile.avatar);
      setSelectedTheme(profile.theme || 'classic');
    }
  }, [profile]);

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, 'users', profile.uid), {
        name,
        avatar: selectedAvatar,
        theme: selectedTheme,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e) {
      handleFirestoreError(e, OperationType.UPDATE, `users/${profile.uid}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">My Aesthetic ✨</h1>
          <p className="text-slate-500">Customize how your dashboard feels and looks.</p>
        </div>
        <AnimatePresence>
          {success && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-green-100 text-green-600 px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2"
            >
              <Check size={18} /> Saved successfully!
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Basic Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="glass-card rounded-3xl p-8 flex flex-col items-center text-center">
            <div className="relative mb-6">
              <div className="w-32 h-32 rounded-full border-4 border-primary-100 overflow-hidden shadow-xl shadow-primary-100/50">
                <img src={selectedAvatar} className="w-full h-full object-cover" alt="Avatar Preview" />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-primary-500 text-white p-2 rounded-full shadow-lg">
                <Camera size={18} />
              </div>
            </div>
            
            <div className="space-y-1 mb-6">
              <h2 className="text-xl font-bold text-slate-800">{name}</h2>
              <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                <Mail size={12} /> {profile?.email}
              </div>
              <div className="flex items-center justify-center gap-2 mt-2">
                <span className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                  profile?.role === 'admin' ? "bg-purple-100 text-purple-600" : "bg-blue-100 text-blue-600"
                )}>
                  {profile?.role}
                </span>
                {profile?.approved && (
                  <span className="bg-green-100 text-green-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    Verified
                  </span>
                )}
              </div>
            </div>

            <div className="w-full space-y-4 text-left">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 ml-1">Display Name</label>
                <div className="relative">
                  <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:border-primary-300 transition-all"
                    placeholder="Your Name"
                  />
                </div>
              </div>
              
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-4 bg-primary-500 hover:bg-primary-600 text-white font-bold rounded-2xl shadow-lg shadow-primary-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? 'Saving...' : <><Save size={20} /> Save Changes</>}
              </button>
            </div>
          </div>

          <div className="glass-card rounded-3xl p-6 border-l-4 border-l-accent-400">
            <div className="flex items-center gap-3 mb-2">
              <Shield className="text-accent-500" size={20} />
              <h3 className="font-bold text-slate-800">Account Security</h3>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Your account is secured with Firebase Authentication. To change your password, please use the "Forgot Password" option on the login page.
            </p>
          </div>
        </div>

        {/* Right Column: Customization */}
        <div className="lg:col-span-2 space-y-8">
          {/* Avatar Selection */}
          <div className="glass-card rounded-3xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <User className="text-primary-500" size={24} />
              <h2 className="text-xl font-bold text-slate-800">Choose Your Avatar</h2>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {AVATARS.map((avatar) => (
                <button
                  key={avatar.id}
                  onClick={() => setSelectedAvatar(avatar.url)}
                  className={cn(
                    "relative group w-full aspect-square rounded-2xl overflow-hidden border-4 transition-all",
                    selectedAvatar === avatar.url ? "border-primary-500 scale-105 shadow-lg" : "border-transparent hover:border-primary-200"
                  )}
                >
                  <img src={avatar.url} className="w-full h-full object-cover" alt={avatar.label} />
                  {selectedAvatar === avatar.url && (
                    <div className="absolute inset-0 bg-primary-500/20 flex items-center justify-center">
                      <div className="bg-white text-primary-500 p-1 rounded-full shadow-lg">
                        <Check size={16} />
                      </div>
                    </div>
                  )}
                  <div className="absolute bottom-0 inset-x-0 bg-black/60 text-[10px] text-white py-1 font-bold uppercase opacity-0 group-hover:opacity-100 transition-opacity">
                    {avatar.label}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Theme Selection */}
          <div className="glass-card rounded-3xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <Layout className="text-accent-500" size={24} />
              <h2 className="text-xl font-bold text-slate-800">Dashboard Feel</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {THEMES.map((theme) => (
                <button
                  key={theme.id}
                  onClick={() => setSelectedTheme(theme.id)}
                  className={cn(
                    "flex items-center gap-4 p-4 rounded-2xl border-2 transition-all text-left",
                    selectedTheme === theme.id ? "border-primary-500 bg-primary-50 shadow-md" : "border-slate-100 hover:border-primary-200"
                  )}
                >
                  <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-white", theme.color)}>
                    <theme.icon size={24} />
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-slate-800 flex items-center gap-2">
                      {theme.label}
                      {selectedTheme === theme.id && <Sparkles size={14} className="text-accent-500" />}
                    </div>
                    <div className="text-[10px] text-slate-500 leading-tight">{theme.description}</div>
                  </div>
                  {selectedTheme === theme.id && (
                    <div className="bg-primary-500 text-white p-1 rounded-full">
                      <Check size={14} />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
