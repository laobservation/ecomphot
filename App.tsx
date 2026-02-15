import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Header } from './components/Header';
import { PhotoStudio } from './components/PhotoStudio';
import { VideoStudio } from './components/VideoStudio';
import { ModeSwitcher } from './components/ModeSwitcher';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { UploadIcon, SparklesIcon, CameraIcon } from './components/Icons';
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
  const [hasApiKey, setHasApiKey] = useState(!!process.env.API_KEY);

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

  // Google Login Initialization
  useEffect(() => {
    if (!user && (window as any).google) {
      (window as any).google.accounts.id.initialize({
        client_id: "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com", // In a real app, this would be a real ID
        callback: (response: any) => {
          const payload = JSON.parse(atob(response.credential.split('.')[1]));
          const profile = {
            name: payload.name,
            email: payload.email,
            picture: payload.picture
          };
          setUser(profile);
          localStorage.setItem('vantage_user', JSON.stringify(profile));
        }
      });
      (window as any).google.accounts.id.renderButton(
        document.getElementById("google-login-btn"),
        { theme: "outline", size: "large", width: "100%" }
      );
    }
  }, [user]);

  const handleConnectApiKey = async () => {
    if ((window as any).aistudio?.openSelectKey) {
      await (window as any).aistudio.openSelectKey();
      // Assume success as per instructions to avoid race condition
      setHasApiKey(true);
      window.location.reload(); // Reload to ensure process.env.API_KEY is updated
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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-3xl shadow-2xl p-8 md:p-12 text-center border border-gray-100 dark:border-gray-700">
          <div className="inline-flex items-center justify-center bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-2xl p-4 mb-8">
            <CameraIcon className="w-12 h-12" />
          </div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white mb-4 tracking-tight">Vantage Studio</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-10 leading-relaxed">
            Professional AI product photography for your business. Sign in to start transforming your snapshots.
          </p>
          
          <div id="google-login-btn" className="mb-6 min-h-[44px]"></div>
          
          {/* Temporary Mock Login for Demo since we don't have a Client ID */}
          <button 
            onClick={() => {
                const mockUser = { name: 'Demo User', email: 'demo@example.com', picture: 'https://i.pravatar.cc/150?u=vantage' };
                setUser(mockUser);
                localStorage.setItem('vantage_user', JSON.stringify(mockUser));
            }}
            className="w-full py-3 text-sm font-bold text-gray-500 hover:text-indigo-600 transition-colors"
          >
            Continue as Guest
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
               <div className="hidden sm:block">
                 <p className="text-sm font-bold leading-none">{user.name}</p>
                 <button onClick={handleLogout} className="text-[10px] text-gray-500 hover:text-red-500 uppercase tracking-widest font-bold mt-1">Sign Out</button>
               </div>
             </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-end">
            {!hasApiKey && (
              <button 
                onClick={handleConnectApiKey}
                className="flex items-center gap-2 px-4 py-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs font-bold rounded-xl border border-amber-200 dark:border-amber-800 hover:bg-amber-200 transition-all"
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
              <p className="text-xl font-bold text-gray-700 dark:text-slate-200 text-center">{t('imageUploader.dropAnywhere')}</p>
              <p className="text-gray-500 dark:text-slate-400 text-center">{t('imageUploader.magic')}</p>
            </div>
          </div>
        )}
      </div>
      <footer className="mt-12 py-8 border-t border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row justify-center items-center gap-2">
          <p className="text-sm text-gray-500 dark:text-slate-400 text-center">
            &copy; {new Date().getFullYear()} Vantage Studio AI.
          </p>
          <p className="text-sm text-gray-500 dark:text-slate-400">
            {t('footer.poweredBy')}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;