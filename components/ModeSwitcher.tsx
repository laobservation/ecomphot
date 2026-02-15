import React from 'react';
import { useTranslation } from 'react-i18next';
import { CameraIcon, FilmIcon } from './Icons';

interface ModeSwitcherProps {
  mode: 'photo' | 'video';
  setMode: (mode: 'photo' | 'video') => void;
}

export const ModeSwitcher: React.FC<ModeSwitcherProps> = ({ mode, setMode }) => {
  const { t } = useTranslation();
  const baseClasses = 'flex items-center justify-center gap-2 w-full sm:w-48 px-6 py-3 font-semibold rounded-lg transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2';
  const activeClasses = 'bg-white dark:bg-gray-900 text-indigo-600 dark:text-indigo-400 shadow-md';
  const inactiveClasses = 'bg-transparent text-gray-500 dark:text-slate-400 hover:text-gray-800 dark:hover:text-slate-200';

  return (
    <div className="flex justify-center my-8">
      <div role="radiogroup" className="flex flex-col sm:flex-row p-1 bg-gray-200 dark:bg-gray-700/50 rounded-xl w-full max-w-sm sm:w-auto">
        <button
          role="radio"
          aria-checked={mode === 'photo'}
          onClick={() => setMode('photo')}
          className={`${baseClasses} ${mode === 'photo' ? activeClasses : inactiveClasses}`}
        >
          <CameraIcon className="w-5 h-5" />
          <span>{t('modeSwitcher.photoStudio')}</span>
        </button>
        <button
          role="radio"
          aria-checked={mode === 'video'}
          onClick={() => setMode('video')}
          className={`${baseClasses} ${mode === 'video' ? activeClasses : inactiveClasses}`}
        >
          <FilmIcon className="w-5 h-5" />
          <span>{t('modeSwitcher.videoStudio')}</span>
        </button>
      </div>
    </div>
  );
};