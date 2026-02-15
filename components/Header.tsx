import React from 'react';
import { useTranslation } from 'react-i18next';
import { CameraIcon } from './Icons';

export const Header: React.FC = () => {
  const { t } = useTranslation();

  return (
    <header className="text-center mb-8 md:mb-12 px-2">
      <div className="inline-flex items-center justify-center bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-full p-3 md:p-4 mb-4 md:mb-6">
        <CameraIcon className="w-8 h-8 md:w-10 md:h-10" />
      </div>
      <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-gray-900 dark:text-slate-100 leading-tight">
        {t('header.title')}
      </h1>
      <p className="mt-4 text-base md:text-lg text-gray-600 dark:text-slate-400 max-w-2xl mx-auto px-4">
        {t('header.subtitle')}
      </p>
    </header>
  );
};