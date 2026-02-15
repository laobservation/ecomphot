import React from 'react';
import { useTranslation } from 'react-i18next';
import { Theme } from '../types';
import { SunIcon, MoonIcon, ComputerDesktopIcon } from './Icons';

interface ThemeSwitcherProps {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ theme, setTheme }) => {
  const { t } = useTranslation();

  const themes = [
    { name: t('themeSwitcher.light'), value: 'light', Icon: SunIcon },
    { name: t('themeSwitcher.dark'), value: 'dark', Icon: MoonIcon },
    { name: t('themeSwitcher.system'), value: 'system', Icon: ComputerDesktopIcon },
  ];

  return (
    <div>
      <span className="sr-only">{t('themeSwitcher.label')}</span>
      <div className="flex items-center p-1 space-x-1 bg-gray-200 dark:bg-gray-700/50 rounded-lg">
        {themes.map(({ name, value, Icon }) => (
          <button
            key={value}
            onClick={() => setTheme(value as Theme)}
            className={`p-1.5 rounded-md transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900
              ${theme === value
                ? 'bg-white dark:bg-gray-900 shadow-sm'
                : 'hover:bg-gray-300/50 dark:hover:bg-white/10'
              }`
            }
            aria-pressed={theme === value}
            title={name}
          >
            <Icon className={`w-5 h-5 ${theme === value ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 dark:text-slate-400'}`} />
            <span className="sr-only">{name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};