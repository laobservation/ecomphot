import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LightbulbIcon } from './Icons';

interface InfoBannerProps {
    title: string;
    children: React.ReactNode;
}

export const InfoBanner: React.FC<InfoBannerProps> = ({ title, children }) => {
    const { t, i18n } = useTranslation();
    const [isVisible, setIsVisible] = useState(true);
    const isRtl = i18n.dir() === 'rtl';

    if (!isVisible) {
        return null;
    }

    const borderClasses = isRtl ? 'border-r-4 rounded-l-lg' : 'border-l-4 rounded-r-lg';
    const iconMargin = isRtl ? 'ml-4' : 'mr-4';

    return (
        <div className={`bg-indigo-50 dark:bg-gray-900/50 border-indigo-400 dark:border-indigo-600 text-indigo-800 dark:text-indigo-200 p-4 mb-6 shadow-sm ${borderClasses}`} role="alert">
            <div className="flex">
                <div className="py-1">
                    <LightbulbIcon className={`w-6 h-6 ${iconMargin} text-indigo-500 dark:text-indigo-400`} />
                </div>
                <div>
                    <p className="font-bold">{title}</p>
                    <div className="text-sm">{children}</div>
                </div>
                <button 
                    onClick={() => setIsVisible(false)}
                    className="ms-auto -mx-1.5 -my-1.5 bg-indigo-50 dark:bg-transparent text-indigo-500 dark:text-indigo-300 rounded-lg focus:ring-2 focus:ring-indigo-400 p-1.5 hover:bg-indigo-200 dark:hover:bg-gray-700 inline-flex h-8 w-8"
                    aria-label={t('infoBanner.dismiss')}
                >
                    <span className="sr-only">{t('infoBanner.dismiss')}</span>
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
                </button>
            </div>
        </div>
    );
};