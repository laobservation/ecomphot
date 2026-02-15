import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Header } from './components/Header';
import { PhotoStudio } from './components/PhotoStudio';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { UploadIcon } from './components/Icons';
import { Theme } from './types';
import { ThemeSwitcher } from './components/ThemeSwitcher';

const App: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);
  const [selectedNiche, setSelectedNiche] = useState('furniture');

  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('theme') as Theme) || 'system';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    const isDark =
      theme === 'dark' ||
      (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    root.classList.toggle('dark', isDark);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
        if (theme === 'system') {
            const root = window.document.documentElement;
            root.classList.toggle('dark', mediaQuery.matches);
        }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);


  useEffect(() => {
    document.documentElement.lang = i18n.language;
    document.documentElement.dir = i18n.dir(i18n.language);
  }, [i18n, i18n.language]);

  const handleDrag = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer?.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragOut = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
    window.addEventListener('dragover', handleDrag);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragIn);
      window.removeEventListener('dragleave', handleDragOut);
      window.removeEventListener('dragover', handleDrag);
      window.removeEventListener('drop', handleDrop);
    };
  }, [handleDragIn, handleDragOut, handleDrag, handleDrop]);


  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-slate-200 font-sans transition-colors duration-300">
      <div className="container mx-auto px-4 py-4 md:py-12">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6 md:mb-12">
          <div className="order-2 sm:order-1 flex items-center gap-4 w-full sm:w-auto justify-center sm:justify-start">
             {/* This space intentionally left for logo branding */}
          </div>
          <div className="order-1 sm:order-2 flex items-center gap-2 sm:gap-4 w-full sm:w-auto justify-end">
            <LanguageSwitcher />
            <ThemeSwitcher theme={theme} setTheme={setTheme} />
          </div>
        </div>
        
        <main className="max-w-7xl mx-auto">
          <Header />
          <PhotoStudio selectedNiche={selectedNiche} setSelectedNiche={setSelectedNiche} />
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