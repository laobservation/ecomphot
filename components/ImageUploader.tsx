import React, { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { UploadIcon } from './Icons';

interface ImageUploaderProps {
  onFiles: (files: File[]) => void;
}

export const ImageUploader: React.FC<ImageUploaderProps> = ({ onFiles }) => {
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      // FIX: Explicitly type `file` as `File` to resolve TypeScript error.
      const imageFiles = Array.from(e.dataTransfer.files).filter((file: File) => file.type.startsWith('image/'));
      onFiles(imageFiles);
      e.dataTransfer.clearData();
    }
  }, [onFiles]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // FIX: Explicitly type `file` as `File` to resolve TypeScript error.
       const imageFiles = Array.from(e.target.files).filter((file: File) => file.type.startsWith('image/'));
      onFiles(imageFiles);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div
      onClick={handleClick}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl cursor-pointer transition-colors duration-300
        ${isDragging 
          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/50' 
          : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 hover:border-indigo-400 dark:hover:border-indigo-500'}`}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        onChange={handleChange}
        className="hidden"
      />
      <div className="flex flex-col items-center text-center">
        <UploadIcon className="w-10 h-10 text-gray-400 dark:text-slate-500 mb-3" />
        <p className="font-semibold text-gray-600 dark:text-slate-300">
          <span className="text-indigo-600 dark:text-indigo-400">{t('imageUploader.upload')}</span> {t('imageUploader.drag')}
        </p>
        <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{t('imageUploader.welcome')}</p>
      </div>
    </div>
  );
};