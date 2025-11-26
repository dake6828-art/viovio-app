import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Search, Book, Volume2, X, Trash2, Star, Zap, AlertCircle, Monitor, Loader2, LogIn, Mail, Lock, User, SkipForward, RefreshCw, Type, Shuffle, Sparkles, Eye, EyeOff, Cat } from 'lucide-react';

// --- Global Configuration ---
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;; // API key is automatically injected at runtime

// --- Supabase Configuration (Reverted for Preview Compatibility) ---
const SUPABASE_PROJECT_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// 在预览环境中，直接使用硬编码的 Key，或者尝试读取全局变量
const supabaseUrl = typeof __supabase_url !== 'undefined' ? __supabase_url : SUPABASE_PROJECT_URL;
const supabaseAnonKey = typeof __supabase_anon_key !== 'undefined' ? __supabase_anon_key : SUPABASE_ANON_KEY;
const HISTORY_TABLE = 'user_history';

// --- 1. Local Selection Dictionary (Mock Data) ---
const MOCK_DICTIONARY = [
  {
    word: "Serendipity",
    phonetic: "/ˌser.ənˈdɪp.ə.ti/",
    meaning: "意外的惊喜",
    type: "noun",
    explanation: "就像你在旧大衣口袋里翻出了遗忘已久的钱，或者转角撞见了一本改变你一生的书。",
    example: "Finding this shop was pure serendipity.",
    exampleCn: "发现这家店纯属意外之喜。",
    tags: ["美好", "运气"]
  },
  {
    word: "Vibe",
    phonetic: "/vaɪb/",
    meaning: "氛围；感觉",
    type: "noun",
    explanation: "一种看不见但在空气中流动的感觉。走进一个房间，不用说话，你就能感受到那是“chill”还是“tense”。",
    example: "I really like this vibe, it makes me feel happy.",
    exampleCn: "我真的很喜欢这种氛围，它让我感到快乐。",
    tags: ["氛围", "流行"]
  }
];

// --- 2. Helper Components ---

const GameButton = ({ children, onClick, variant = 'primary', className = '', disabled = false, type = 'button' }) => {
  const variants = {
    primary: "bg-lime-500 border-lime-600 text-white active:border-b-0 hover:bg-lime-400", 
    secondary: "bg-white border-slate-200 text-slate-500 active:border-b-0 hover:bg-slate-50",
    danger: "bg-rose-500 border-rose-600 text-white active:border-b-0 hover:bg-rose-400",
    yellow: "bg-yellow-400 border-yellow-600 text-yellow-900 active:border-b-0 hover:bg-yellow-300",
    ghost: "bg-transparent border-transparent text-slate-400 shadow-none border-0 active:translate-y-0 hover:bg-slate-100/50"
  };
  const baseStyle = "relative font-bold uppercase tracking-wide py-2 px-4 rounded-xl border-b-4 transition-all active:translate-y-1 active:border-b-0 flex items-center justify-center gap-2 select-none cursor-pointer text-sm";
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed active:translate-y-0 active:border-b-4' : ''}`}>
      {children}
    </button>
  );
};

const getGradient = (str) => {
  const gradients = [
    "from-orange-100 to-rose-100 text-rose-500",
    "from-blue-100 to-cyan-100 text-blue-500",
    "from-emerald-100 to-lime-100 text-emerald-600",
    "from-violet-100 to-purple-100 text-purple-500",
    "from-amber-100 to-yellow-100 text-amber-600",
    "from-pink-100 to-rose-100 text-pink-500",
    "from-indigo-100 to-blue-100 text-indigo-500",
    "from-teal-100 to-green-100 text-teal-600",
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return gradients[Math.abs(hash) % gradients.length];
};

const WordArtCard = ({ word, type }) => {
  const gradientClass = getGradient(word || "");
  
  const getFontSize = (len) => {
      if (len <= 4) return "text-7xl";
      if (len <= 7) return "text-6xl"; 
      if (len <= 10) return "text-5xl"; 
      return "text-4xl";
  };
  const fontSize = getFontSize(word.length);

  return (
    <div className={`relative w-full h-full bg-gradient-to-br ${gradientClass} flex flex-col items-center justify-center overflow-hidden p-6 group select-none`}>
      <div className="absolute top-[-20%] left-[-20%] w-[50%] h-[50%] bg-white/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-white/30 rounded-full blur-2xl pointer-events-none"></div>
      
      <div className="relative z-10 text-center transform transition-transform duration-500 group-hover:scale-105 w-full break-words px-4">
        <h2 className={`${fontSize} font-black tracking-tighter drop-shadow-sm opacity-90 leading-none break-words`} style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
          {word}
        </h2>
        {type && (
          <span className="inline-block mt-4 px-3 py-1 bg-white/40 backdrop-blur-sm rounded-full text-[10px] font-bold uppercase tracking-widest opacity-75 border border-white/20">
            {type}
          </span>
        )}
      </div>

      <div className="absolute bottom-3 right-4 text-[8px] font-bold opacity-30 tracking-[0.3em] uppercase">
        VioVio
      </div>
    </div>
  );
};

const AuthModal = ({ show, onClose, isLoginMode, setIsLoginMode, handleAuthAction }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => { 
      if (show) { 
          setAuthError(''); 
          setAuthSuccess('');
          setEmail(''); 
          setPassword(''); 
      } 
  }, [show, isLoginMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError('');
    setAuthSuccess('');
    
    try {
      const { data, error } = await handleAuthAction(email, password, isLoginMode);
      
      if (error) throw error;

      if (isLoginMode) {
          if (data.user) onClose();
      } else {
          if (data.user && !data.session) {
             setAuthSuccess('注册成功！请前往邮箱点击确认链接，完成后即可登录。');
          } else if (data.user && data.session) {
             onClose();
          }
      }
    } catch (err) {
      let msg = '认证失败，请重试。';
      if (err.message.includes('Invalid login')) msg = '邮箱或密码不正确。';
      else if (err.message.includes('already registered')) msg = '该邮箱已被注册，请直接登录。';
      else if (err.message.includes('Password')) msg = '密码长度至少需要6位。';
      else if (err.message.includes('Email not confirmed')) msg = '登录失败：您的邮箱尚未验证。请检查收件箱（含垃圾邮件）并点击确认链接。';
      setAuthError(msg);
    } finally { 
      setAuthLoading(false); 
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border-b-4 border-slate-200 animate-in zoom-in-95" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between mb-6">
            <h2 className="text-xl font-black text-slate-800 flex gap-2">
                <LogIn className="w-5 h-5 text-yellow-500" /> {isLoginMode ? '登录' : '注册'}
            </h2>
            <button onClick={onClose}><X className="w-5 h-5 text-slate-400" /></button>
        </div>

        {authError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-600 p-3 rounded-xl mb-4 text-xs font-bold flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{authError}</span>
            </div>
        )}

        {authSuccess && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3 rounded-xl mb-4 text-xs font-bold flex items-start gap-2">
                <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{authSuccess}</span>
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="relative">
              <Mail className="absolute left-4 top-3 w-4 h-4 text-slate-400" />
              <input type="email" placeholder="邮箱" value={email} onChange={e => setEmail(e.target.value)} required className="w-full pl-10 py-2.5 border-2 border-slate-200 rounded-xl font-medium text-slate-700 focus:border-sky-400 outline-none" />
          </div>
          <div className="relative">
              <Lock className="absolute left-4 top-3 w-4 h-4 text-slate-400" />
              <input type="password" placeholder="密码" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} className="w-full pl-10 py-2.5 border-2 border-slate-200 rounded-xl font-medium text-slate-700 focus:border-sky-400 outline-none" />
          </div>
          <GameButton type="submit" variant="primary" className="w-full" disabled={authLoading}>
              {authLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isLoginMode ? '提交' : '注册')}
          </GameButton>
        </form>
        
        <div className="mt-4 text-center">
            <button onClick={() => setIsLoginMode(!isLoginMode)} className="text-xs font-bold text-slate-400 hover:text-sky-600">
                {isLoginMode ? '没有账号？去注册' : '已有账号？去登录'}
            </button>
        </div>
      </div>
    </div>
  );
};

const DisplayNameModal = ({ show, onClose, onSave }) => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  if (!show) return null;
  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border-b-4 border-slate-200">
        <div className="text-center mb-4"><div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3"><User className="w-6 h-6 text-yellow-600" /></div><h2 className="text-xl font-black">欢迎加入!</h2><p className="text-slate-400 text-xs mt-1">取个好听的名字吧</p></div>
        <form onSubmit={async (e) => { e.preventDefault(); if(!name.trim())return; setLoading(true); await onSave(name); setLoading(false); }} className="space-y-4">
          <input type="text" placeholder="您的昵称" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2.5 text-center text-lg border-2 border-slate-200 rounded-xl font-bold text-slate-700 focus:border-sky-400 outline-none" autoFocus />
          <div className="flex gap-2"><GameButton onClick={onClose} variant="ghost" className="flex-1">跳过</GameButton><GameButton type="submit" variant="primary" className="flex-[2]" disabled={!name.trim() || loading}>{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : '开始'}</GameButton></div>
        </form>
      </div>
    </div>
  );
};

// --- Main Component ---
export default function VisualVocabApp() {
  const [activeTab, setActiveTab] = useState('search');
  const [query, setQuery] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);
  const [error, setError] = useState(null);
  
  const [randomReviewWord, setRandomReviewWord] = useState(null);

  const [supabase, setSupabase] = useState(null);
  const [user, setUser] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true); 
  const [showDisplayNameModal, setShowDisplayNameModal] = useState(false);

  const [history, setHistory] = useState([]);
  const inputRef = useRef(null);
  
  // Load Supabase via CDN for Preview Compatibility
  useEffect(() => {
    const loadSupabase = async () => {
      if (window.supabase) { initSupabaseClient(); return; }
      const script = document.createElement('script');
      script.src = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2";
      script.async = true;
      script.onload = () => initSupabaseClient();
      document.body.appendChild(script);
    };

    const initSupabaseClient = () => {
        try {
            const { createClient } = window.supabase;
            const client = createClient(supabaseUrl, supabaseAnonKey);
            setSupabase(client);
            client.auth.onAuthStateChange((event, session) => {
                const currentUser = session?.user ?? null;
                setUser(currentUser);
                setIsAuthReady(true);
                if (event === 'SIGNED_IN' && currentUser && !currentUser.user_metadata?.display_name) setShowDisplayNameModal(true);
            });
            client.auth.getSession().then(({ data: { session } }) => {
                setUser(session?.user ?? null);
                setIsAuthReady(true);
            });
        } catch (e) { console.error("Supabase init error:", e); setIsAuthReady(true); }
    };
    loadSupabase();
    if (window.innerWidth > 768) inputRef.current?.focus();
  }, []);

  // Fetch History
  const fetchHistory = useCallback(async () => {
      if (!supabase || !user) return;
      const { data, error } = await supabase
          .from(HISTORY_TABLE)
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
      if (!error && data) {
        setHistory(data);
        if (data.length > 0 && !result) { 
            const randomItem = data[Math.floor(Math.random() * data.length)];
            setRandomReviewWord(randomItem);
        }
      }
  }, [supabase, user, result]);

  useEffect(() => {
      if (supabase && user) fetchHistory(); else setHistory([]);
  }, [supabase, user, fetchHistory]);
  
  // Actions
  const handleAuthAction = async (email, password, isLogin) => {
      if (!supabase) throw new Error("Loading...");
      return isLogin ? supabase.auth.signInWithPassword({ email, password }) : supabase.auth.signUp({ email, password });
  };
  const handleSignOut = async () => { if (supabase) await supabase.auth.signOut(); };
  const handleUpdateDisplayName = async (name) => {
    if (!supabase) return;
    const { error } = await supabase.auth.updateUser({ data: { display_name: name } });
    if (!error) {
      const { data: { user: updatedUser } } = await supabase.auth.getUser();
      setUser(updatedUser);
      setShowDisplayNameModal(false);
    }
  };

  const saveToHistory = async (item) => {
    if (!supabase || !user) return; 
    const { word, meaning, type, explanation, example, exampleCn, tags, phonetic, audioUrl, imageUrl, isAi } = item;
    const existingItem = history.find(h => h.word.toLowerCase() === word.toLowerCase());
    
    const docData = { 
      user_id: user.id, 
      word, meaning, type, explanation, example, exampleCn, tags, phonetic, 
      audioUrl: audioUrl || null,
      imageUrl: imageUrl || null,
      isAi: isAi || false,
      timestamp: new Date().toISOString() 
    };

    try {
        if (existingItem?.id) {
            await supabase.from(HISTORY_TABLE).update(docData).eq('id', existingItem.id);
        } else {
            await supabase.from(HISTORY_TABLE).insert(docData);
        }
        fetchHistory();
    } catch(e) { 
        console.warn("Full save failed, retrying minimal save...", e);
        const minimalData = { ...docData };
        delete minimalData.audioUrl; delete minimalData.imageUrl; delete minimalData.isAi;
        try {
             if (existingItem?.id) await supabase.from(HISTORY_TABLE).update(minimalData).eq('id', existingItem.id);
             else await supabase.from(HISTORY_TABLE).insert(minimalData);
             fetchHistory();
        } catch (retryErr) { console.error("Retry save failed:", retryErr); }
    }
  };

  const deleteHistoryItem = async (id) => {
      if (supabase && user) {
        await supabase.from(HISTORY_TABLE).delete().eq('id', id);
        fetchHistory(); 
      }
  };
  
  const fetchGeminiData = async (word) => {
    const prompt = `Vocabulary tutor backend. Word: "${word}". Return JSON (NO markdown): { "word": "Corrected", "meaning": "Concise Chinese", "explanation": "Fun Chinese expl (max 60 chars)", "example": "English sentence", "exampleCn": "Chinese translation", "type": "Part of speech", "tags": ["Tag1"] }`;
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json" } })
      });
      if (!response.ok) throw new Error('API Error');
      const data = await response.json();
      return JSON.parse(data.candidates[0].content.parts[0].text);
    } catch (err) { return null; }
  };

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!query.trim()) return;
    setLoading(true); setAiThinking(false); setResult(null); setError(null);
    setRandomReviewWord(null); 
    if (window.innerWidth < 1024) setActiveTab('search');
    
    const cleanQuery = query.trim();
    const lowerQuery = cleanQuery.toLowerCase();
    const localMatch = MOCK_DICTIONARY.find(item => item.word.toLowerCase() === lowerQuery);
    
    if (localMatch) {
      setTimeout(() => {
        const finalResult = { ...localMatch, searchedAt: Date.now(), isAi: false, audioUrl: null, phonetic: localMatch.phonetic || '/.../' };
        setResult(finalResult); saveToHistory(finalResult); setLoading(false);
      }, 300);
      return;
    }

    setAiThinking(true);
    try {
      const [dictResponse, aiData] = await Promise.allSettled([
        fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${lowerQuery}`).then(res => res.json()),
        fetchGeminiData(cleanQuery)
      ]);

      if (aiData.status === 'fulfilled' && aiData.value) {
        const aiInfo = aiData.value;
        let audioUrl = "", phonetic = "";
        if (dictResponse.status === 'fulfilled' && Array.isArray(dictResponse.value) && dictResponse.value.length > 0) {
          phonetic = dictResponse.value[0].phonetics?.find(p => p.text)?.text || "";
          audioUrl = dictResponse.value[0].phonetics?.find(p => p.audio)?.audio || "";
        }
        
        const finalResult = {
          word: aiInfo.word || cleanQuery, phonetic: phonetic || "/.../", audioUrl, 
          meaning: aiInfo.meaning, type: aiInfo.type, explanation: aiInfo.explanation, 
          example: aiInfo.example, exampleCn: aiInfo.exampleCn, tags: aiInfo.tags || ["AI"],
          isAi: true
        };
        setResult(finalResult); 
        await saveToHistory(finalResult); 
      } else { throw new Error("Service unavailable"); }
    } catch (err) { setError(`无法解析 "${cleanQuery}"。`); } 
    finally { setLoading(false); setAiThinking(false); }
  };

  const playAudio = (text, e, url) => {
    e?.stopPropagation();
    if (url) new Audio(url).play().catch(() => speakText(text)); else speakText(text);
  };
  const speakText = (text) => {
    if(!text) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = /[\u4e00-\u9fa5]/.test(text) ? 'zh-CN' : 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  const handleHistoryClick = (item) => {
    setQuery(item.word);
    setResult(item);
    setRandomReviewWord(null); 
    if (window.innerWidth < 1024) setActiveTab('search');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFlashbackClick = () => {
      if (randomReviewWord) {
          setQuery(randomReviewWord.word);
          setResult(randomReviewWord);
          setRandomReviewWord(null);
      }
  };

  return (
    <div className="min-h-screen bg-[#fff9e6] font-sans text-slate-700 flex flex-col">
      <AuthModal show={showAuthModal} onClose={() => setShowAuthModal(false)} isLoginMode={isLoginMode} setIsLoginMode={setIsLoginMode} handleAuthAction={handleAuthAction} />
      <DisplayNameModal show={showDisplayNameModal} onClose={() => setShowDisplayNameModal(false)} onSave={handleUpdateDisplayName} />
      
      {/* Header */}
      <header className="bg-[#fff9e6]/95 backdrop-blur-sm sticky top-0 z-20 border-b border-slate-100/50 lg:border-none px-4 py-3">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" onClick={() => {setResult(null); setQuery(''); fetchHistory();}}>
            {/* 3. Logo 换成 Cat */}
            <div className="bg-lime-500 p-1.5 rounded-lg border-b-4 border-lime-700 shadow-sm text-white"><Cat className="w-5 h-5 fill-current" /></div>
            <div className="flex flex-col leading-tight">
                <span className="text-xl font-extrabold text-slate-700 tracking-tight">VioVio</span>
                <span className="text-[10px] text-slate-400 font-bold tracking-wider uppercase">Just Words. Nothing Else.</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
             {isAuthReady ? ( user ? (
                  <><div className="hidden lg:flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border-2 border-slate-100 font-bold text-slate-400 text-xs"><Monitor className="w-3 h-3" /><span className="truncate max-w-[80px]">{user.user_metadata?.display_name || user.email?.split('@')[0]}</span></div><GameButton onClick={handleSignOut} variant="secondary" className="!py-1.5 !px-3 !text-xs font-bold">Exit</GameButton></>
                ) : (<GameButton onClick={() => { setIsLoginMode(true); setShowAuthModal(true); }} variant="yellow" className="!py-1.5 !px-3 !text-xs font-bold"><LogIn className="w-3 h-3 fill-yellow-900" /> Login</GameButton>)
             ) : (<Loader2 className="w-5 h-5 animate-spin text-slate-400" />)}
             <div className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-full border-2 border-slate-100 font-bold text-yellow-500 text-xs shadow-sm"><Zap className="w-3 h-3 fill-current" /><span>{history.length}</span></div>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto p-4 lg:p-6 lg:grid lg:grid-cols-12 lg:gap-8 pb-24 lg:pb-10">
        <div className={`lg:col-span-8 flex flex-col gap-6 ${activeTab === 'search' ? 'block' : 'hidden lg:flex'}`}>
          {/* Search Bar */}
          <div className="bg-white rounded-3xl p-2 pl-4 border-2 border-slate-100 shadow-xl shadow-slate-200/40 flex items-center gap-2 transition-all focus-within:border-sky-300 focus-within:ring-4 focus-within:ring-sky-100">
            <Search className="w-6 h-6 text-slate-400 shrink-0" />
            <form onSubmit={handleSearch} className="flex-1"><input ref={inputRef} type="text" value={query} onChange={(e) => { setQuery(e.target.value); setError(null); }} placeholder="Type a word..." className="w-full bg-transparent py-4 text-xl font-bold text-slate-700 placeholder:text-slate-300 placeholder:font-medium focus:outline-none" /></form>
            {query && <button type="button" onClick={() => { setQuery(''); setError(null); setResult(null); setRandomReviewWord(null); fetchHistory(); inputRef.current?.focus(); }} className="p-2 rounded-full text-slate-300 hover:bg-slate-100 hover:text-slate-500 transition-colors mr-2"><X className="w-5 h-5" /></button>}
            <GameButton type="submit" onClick={handleSearch} variant="primary" className="mr-2 !py-2.5 !px-6 text-base" disabled={loading || !query || !isAuthReady}>{loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "GO"}</GameButton>
          </div>
          
          {error && <div className="bg-rose-50 border-2 border-rose-100 rounded-2xl p-8 text-center animate-in zoom-in-95"><p className="text-rose-600 font-bold">{error}</p></div>}
          {aiThinking && !result && <div className="h-64 bg-white/50 rounded-[2rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-slate-400 animate-pulse"><Sparkles className="w-12 h-12 text-sky-400 mb-4 animate-bounce" /><p className="font-bold text-lg text-sky-600">AI Thinking...</p></div>}
          
          {/* Flashback Card */}
          {!result && !loading && !aiThinking && !error && randomReviewWord && (
             <div className="animate-in fade-in zoom-in-95 duration-500">
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-[2rem] p-1 border-2 border-yellow-100 shadow-lg cursor-pointer hover:scale-[1.01] transition-transform" onClick={handleFlashbackClick}>
                    <div className="bg-white/60 rounded-[1.8rem] p-6 flex flex-col items-center text-center h-80 justify-center relative overflow-hidden group">
                        <div className="absolute top-4 left-4 bg-yellow-200 text-yellow-800 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                            <Shuffle className="w-3 h-3" /> Memory Flashback
                        </div>
                        <h2 className="text-6xl font-black text-slate-800 mb-2 group-hover:text-yellow-600 transition-colors">{randomReviewWord.word}</h2>
                        
                        {/* 2. 修复：使用不透明涂层覆盖，缩小按钮，改文案为 REMOVE */}
                        <div className="relative group/reveal mt-4 cursor-help inline-block max-w-lg w-full">
                            {/* 遮罩层：绝对定位覆盖文字 */}
                            <div className="absolute inset-0 flex items-center justify-center z-10 group-hover/reveal:opacity-0 transition-opacity duration-300 pointer-events-none">
                                {/* 缩小后的遮罩按钮 */}
                                <div className="bg-yellow-300/90 px-4 py-2 rounded-full shadow-sm flex items-center gap-2 text-yellow-900 font-black text-[10px] uppercase tracking-widest transform transition-transform group-hover/reveal:scale-110">
                                    <EyeOff className="w-4 h-4" /> REMOVE
                                </div>
                            </div>
                            {/* 实际文字：字号加大 */}
                            <p className="text-slate-600 font-bold text-3xl md:text-4xl px-6 py-4 opacity-10 group-hover/reveal:opacity-100 transition-opacity duration-300 leading-relaxed">
                                {randomReviewWord.meaning}
                            </p>
                        </div>

                        <div className="mt-8 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold text-slate-400 uppercase tracking-widest">Click to Review</div>
                    </div>
                </div>
             </div>
          )}

          {/* Empty State */}
          {!result && !loading && !aiThinking && !error && !randomReviewWord && (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-12 opacity-50 lg:min-h-[300px]">
              <div className="p-6 bg-yellow-100 rounded-full mb-4 text-yellow-500"><Type className="w-12 h-12" /></div>
              <h2 className="text-2xl font-black text-slate-300 mb-2">Start Collecting Words</h2>
            </div>
          )}

          {/* Search Result - 布局优化: 上下结构，顶部艺术字图片高度减小 */}
          {result && !loading && (
            <div className="animate-in zoom-in-95 duration-300">
              <div className="bg-white border-2 border-b-4 border-slate-200 rounded-[2rem] overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col">
                
                {/* 上方：艺术字卡片 (固定高度作为 Banner, 减少高度至 h-40 / h-48) */}
                <div className="w-full h-40 sm:h-48 border-b-2 border-slate-100 relative">
                  <WordArtCard word={result.word} type={result.type} />
                </div>

                {/* 下方：查询结果文字信息 */}
                <div className="w-full p-6 sm:p-8 flex flex-col">
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3"><div className="group flex items-center gap-3 cursor-pointer select-none" onClick={(e) => playAudio(result.word, e, result.audioUrl)}><h1 className="text-4xl sm:text-5xl font-black text-slate-800 tracking-tight group-hover:text-sky-500 transition-colors">{result.word}</h1><div className="p-2.5 bg-sky-50 text-sky-500 rounded-full group-hover:bg-sky-500 group-hover:text-white transition-all"><Volume2 className="w-5 h-5" /></div></div></div>
                    <div className="flex items-center gap-2"><span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-lg text-xs font-bold border-b-2 border-yellow-200 uppercase">{result.type}</span>{result.phonetic && <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-lg text-xs font-bold border-b-2 border-slate-200 font-mono">{result.phonetic}</span>}</div>
                  </div>
                  
                  {/* 1. 修复：查询结果页完全移除遮罩，直接展示清晰文字 */}
                  <div className="mb-6 space-y-4">
                     <h3 className="text-2xl font-bold text-slate-700 mb-2">{result.meaning}</h3>
                     <div className="bg-sky-50 p-4 rounded-2xl border border-sky-100 text-slate-600 leading-relaxed text-sm">{result.explanation}</div>
                  </div>

                  <div className="bg-lime-50 p-5 rounded-2xl border border-lime-100 hover:border-lime-200 transition-colors group cursor-pointer" onClick={() => speakText(result.example)}><div className="flex items-start gap-3"><div className="mt-1 p-1.5 bg-white rounded-full text-lime-600 shadow-sm"><Volume2 className="w-3 h-3" /></div><div><p className="text-lg font-bold text-slate-700 leading-snug group-hover:text-lime-700 transition-colors">"{result.example}"</p><p className="text-slate-500 text-sm mt-1 font-medium">{result.exampleCn}</p></div></div></div>
                  {result.tags && <div className="mt-6 flex gap-2 flex-wrap">{result.tags.map(tag => <span key={tag} className="px-2.5 py-1 bg-slate-100 text-slate-400 rounded-md text-[10px] font-bold uppercase tracking-wider">#{tag}</span>)}</div>}
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Notebook: 3. 优化缩略图 */}
        <div className={`lg:col-span-4 flex flex-col h-full ${activeTab === 'notebook' ? 'block' : 'hidden lg:flex'}`}>
          <div className="bg-white rounded-[2rem] border-2 border-slate-100 shadow-lg shadow-slate-200/30 flex flex-col h-full lg:h-auto lg:min-h-[calc(100vh-140px)] overflow-hidden sticky top-24">
            <div className="p-4 border-b-2 border-slate-50 bg-slate-50/50 flex justify-between items-center"><div className="flex items-center gap-2"><Book className="w-4 h-4 text-yellow-500 fill-yellow-500" /><h3 className="text-base font-black text-slate-700">My Notebook</h3></div><span className="text-xs font-bold text-slate-400 bg-white px-2 py-1 rounded-lg border border-slate-200">{history.length}</span></div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
              {!isAuthReady ? <div className="h-64 flex flex-col items-center justify-center text-center text-slate-300"><Loader2 className="w-8 h-8 mb-4 animate-spin" /><p className="font-bold text-sm">Loading...</p></div> : user && history.length === 0 ? <div className="h-64 flex flex-col items-center justify-center text-center text-slate-300"><Book className="w-10 h-10 mb-3 opacity-20" /><p className="font-bold text-xs">No words yet.</p></div> : history.length === 0 && !user ? <div className="h-64 flex flex-col items-center justify-center text-center text-slate-300"><Lock className="w-10 h-10 mb-3 opacity-20" /><p className="font-bold text-xs">Sign in to sync.</p></div> : history.map((item, index) => (
                  <div key={item.id || `${item.word}-${index}`} onClick={() => { setQuery(item.word); setResult(item); setRandomReviewWord(null); if (window.innerWidth < 1024) setActiveTab('search'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className={`group relative p-3 rounded-xl border-2 transition-all cursor-pointer hover:scale-[1.02] active:scale-95 flex items-center gap-3 ${result?.word === item.word ? 'bg-sky-50 border-sky-200 shadow-sm' : 'bg-white border-slate-100 hover:border-sky-100 hover:shadow-md'}`}>
                    {/* 3. 彩色缩略图: 使用与 WordArtCard 相同的渐变逻辑 */}
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${getGradient(item.word)} flex items-center justify-center shrink-0 border border-white/50 font-black text-white/90 text-sm shadow-sm`}>
                        {item.word.substring(0, 1).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0"><div className="flex items-center justify-between"><h4 className={`font-black text-sm truncate ${result?.word === item.word ? 'text-sky-600' : 'text-slate-700'}`}>{item.word}</h4></div><p className="text-[10px] text-slate-400 truncate">{item.meaning}</p></div>
                    {user && <button onClick={(e) => { e.stopPropagation(); deleteHistoryItem(item.id); }} className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all" title="Remove"><Trash2 className="w-3 h-3" /></button>}
                  </div>
                ))}
            </div>
          </div>
        </div>
      </main>
      <div className="lg:hidden fixed bottom-6 left-0 right-0 px-4 z-40">
        <nav className="max-w-xs mx-auto bg-white rounded-full shadow-2xl shadow-slate-900/20 border border-slate-100 p-1.5 flex justify-between items-center relative">
          <button onClick={() => setActiveTab('search')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-full font-bold transition-all duration-300 ${activeTab === 'search' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}><Search className="w-5 h-5 stroke-[3px]" /></button>
          <button onClick={() => setActiveTab('notebook')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-full font-bold transition-all duration-300 ${activeTab === 'notebook' ? 'bg-yellow-400 text-yellow-900 shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}><Book className="w-5 h-5 stroke-[3px]" /></button>
        </nav>
      </div>
    </div>
  );
}