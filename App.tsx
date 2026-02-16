import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Header } from './components/Header';
import { PhotoStudio } from './components/PhotoStudio';
import { VideoStudio } from './components/VideoStudio';
import { ModeSwitcher } from './components/ModeSwitcher';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { UploadIcon, CameraIcon, SparklesIcon } from './components/Icons';
import { Theme } from './types';
import { ThemeSwitcher } from './components/ThemeSwitcher';

interface UserProfile {
  name: string;
  email: string;
  picture: string;
}

const App: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [user, setUser] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('vantage_user');
    return saved ? JSON.parse(saved) : null;
  });
  
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);
  const [selectedNiche, setSelectedNiche] = useState('furniture');
  const [mode, setMode] = useState<'photo' | 'video'>('photo');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);

  // Check for API Key on mount
  const checkKeyStatus = useCallback(async () => {
    if ((window as any).aistudio?.hasSelectedApiKey) {
      const hasKey = await (window as any).aistudio.hasSelectedApiKey();
      setHasApiKey(hasKey);
    } else {
      // Fallback for environments without the helper
      setHasApiKey(!!process.env.API_KEY && process.env.API_KEY !== 'undefined');
    }
  }, []);

  useEffect(() => {
    checkKeyStatus();
  }, [checkKeyStatus]);

  // Handle automatic re-authentication if service fails
  useEffect(() => {
    const handleReauth = () => {
      handleConnectApiKey();
    };
    window.addEventListener('trigger-key-selection', handleReauth);
    return () => window.removeEventListener('trigger-key-selection', handleReauth);
  }, []);

  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('theme') as Theme) || 'system';
  });

  // Handle Theme
  useEffect(() => {
    const root = window.document.documentElement;
    const isDark =
      theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    root.classList.toggle('dark', isDark);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Handle i18n Direction
  useEffect(() => {
    if (i18n.language) {
      document.documentElement.lang = i18n.language;
      if (i18n.dir && typeof i18n.dir === 'function') {
        document.documentElement.dir = i18n.dir(i18n.language);
      }
    }
  }, [i18n, i18n.language]);

  const handleSimulatedLogin = () => {
    setIsLoggingIn(true);
    setTimeout(() => {
      const mockUser = { 
        name: 'Vantage Designer', 
        email: 'studio@vantage.ai', 
        picture: 'https://i.pravatar.cc/150?u=vantage' 
      };
      setUser(mockUser);
      localStorage.setItem('vantage_user', JSON.stringify(mockUser));
      setIsLoggingIn(false);
    }, 800);
  };

  const handleConnectApiKey = async () => {
    if ((window as any).aistudio?.openSelectKey) {
      await (window as any).aistudio.openSelectKey();
      // Assume success to avoid race condition as per instructions
      setHasApiKey(true);
      // Re-verify after a short delay
      setTimeout(checkKeyStatus, 2000);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('vantage_user');
  };

  // Drag and Drop handlers
  const handleDragIn = useCallback((e: DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) setIsDragging(true);
  }, []);

  const handleDragOut = useCallback((e: DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault(); e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      const fileDropEvent = new CustomEvent('filesdropped', {
        detail: Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/')),
      });
      window.dispatchEvent(fileDropEvent);
      e.dataTransfer.clearData();
      dragCounter.current = 0;
    }
  }, []);

  useEffect(() => {
    window.addEventListener('dragenter', handleDragIn);
    window.addEventListener('dragleave', handleDragOut);
    window.addEventListener('drop', handleDrop);
    window.addEventListener('dragover', (e) => e.preventDefault());
    return () => {
      window.removeEventListener('dragenter', handleDragIn);
      window.removeEventListener('dragleave', handleDragOut);
      window.removeEventListener('drop', handleDrop);
    };
  }, [handleDragIn, handleDragOut, handleDrop]);

  // LOGIN SCREEN
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 md:p-12 text-center border border-gray-100 dark:border-gray-700">
          <div className="inline-flex items-center justify-center bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-2xl p-4 mb-8">
            <CameraIcon className="w-12 h-12" />
          </div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-4 tracking-tight text-center">Vantage Studio</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-10 leading-relaxed text-center">
            Transform amateur snapshots into studio-quality photos. Sign in with Google to access the AI Studio.
          </p>
          
          <button 
            onClick={handleSimulatedLogin}
            disabled={isLoggingIn}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl font-bold text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-600 transition-all shadow-sm active:scale-[0.98] disabled:opacity-70"
          >
            {isLoggingIn ? (
              <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
            )}
            {isLoggingIn ? "Authenticating..." : "Sign in with Google"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-slate-200 font-sans transition-colors duration-300">
      <div className="container mx-auto px-4 py-4 md:py-8">
        
        {/* TOP NAV */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 md:mb-12">
          <div className="flex items-center gap-4 w-full sm:w-auto">
             <div className="flex items-center gap-3">
               <img src={user.picture} className="w-10 h-10 rounded-full border-2 border-indigo-500 shadow-sm" alt="Profile" />
               <div className="hidden sm:block text-left">
                 <p className="text-sm font-bold leading-none">{user.name}</p>
                 <button onClick={handleLogout} className="text-[10px] text-gray-500 hover:text-red-500 uppercase tracking-widest font-bold mt-1 transition-colors">Sign Out</button>
               </div>
             </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-end">
            {!hasApiKey && (
              <button 
                onClick={handleConnectApiKey}
                className="flex items-center gap-2 px-4 py-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold rounded-xl border border-amber-200 dark:border-amber-800 hover:bg-amber-200 transition-all shadow-sm animate-pulse"
              >
                <SparklesIcon className="w-4 h-4" />
                Connect AI Studio
              </button>
            )}
            <LanguageSwitcher />
            <ThemeSwitcher theme={theme} setTheme={setTheme} />
          </div>
        </div>
        
        <main className="max-w-7xl mx-auto">
          <Header />
          <ModeSwitcher mode={mode} setMode={setMode} />
          
          {mode === 'photo' ? (
            <PhotoStudio selectedNiche={selectedNiche} setSelectedNiche={setSelectedNiche} />
          ) : (
            <VideoStudio />
          )}
        </main>

        {isDragging && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center pointer-events-none p-4">
            <div className="bg-white dark:bg-slate-800 p-8 md:p-12 rounded-2xl shadow-2xl flex flex-col items-center gap-4 border-4 border-dashed border-indigo-500 dark:border-indigo-400 max-w-sm w-full">
              <UploadIcon className="w-16 h-16 text-indigo-500 dark:text-indigo-400 animate-bounce" />
              <p className="text-xl font-bold text-gray-700 dark:text-slate-200 text-center uppercase tracking-tight">Drop Images Anywhere</p>
              <p className="text-gray-500 dark:text-slate-400 text-center">Release to add to your current studio session</p>
            </div>
          </div>
        )}
      </div>
      <footer className="mt-12 py-8 border-t border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row justify-center items-center gap-2">
          <p className="text-sm text-gray-500 dark:text-slate-400 text-center font-medium">
            &copy; {new Date().getFullYear()} Vantage Studio AI. All rights reserved.
          </p>
          <p className="text-sm text-gray-500 dark:text-slate-400 font-medium">
            {t('footer.poweredBy')}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;