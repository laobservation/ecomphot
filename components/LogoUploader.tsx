import React, { useCallback, useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { UploadIcon } from './Icons';

interface LogoUploaderProps {
  logo: File | null;
  onLogoChange: (file: File | null) => void;
  disabled?: boolean;
}

export const LogoUploader: React.FC<LogoUploaderProps> = ({ logo, onLogoChange, disabled }) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (logo) {
      const url = URL.createObjectURL(logo);
      setObjectUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setObjectUrl(null);
    }
  }, [logo]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      onLogoChange(file);
    }
    // Reset input to allow re-uploading the same file
    e.target.value = '';
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onLogoChange(null);
  };

  return (
    <div>
      <label className="block text-md font-medium text-gray-700 dark:text-slate-300 mb-2">
        {t('controls.logo.title')}
      </label>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/webp, image/svg+xml"
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />
      {logo && objectUrl ? (
        <div className="relative flex items-center p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900">
          <img src={objectUrl} alt={logo.name} className="w-10 h-10 object-contain rounded-md bg-gray-100 dark:bg-gray-800" />
          <p className="ms-3 text-sm text-gray-700 dark:text-slate-300 truncate" title={logo.name}>
            {logo.name}
          </p>
          <button
            onClick={handleRemove}
            disabled={disabled}
            className="ms-auto text-gray-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 disabled:opacity-50"
            aria-label={t('controls.logo.remove')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ) : (
        <button
          onClick={handleClick}
          disabled={disabled}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-indigo-500 dark:hover:border-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <UploadIcon className="w-5 h-5 text-gray-500 dark:text-slate-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-slate-300">{t('controls.logo.upload')}</span>
        </button>
      )}
    </div>
  );
};