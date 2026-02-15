import React, { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { UploadIcon } from './Icons';

interface AtmosphereUploaderProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  disabled?: boolean;
}

const AtmosphereImagePreview: React.FC<{ file: File, onRemove: () => void }> = ({ file, onRemove }) => {
    const [objectUrl] = useState(() => URL.createObjectURL(file));
    
    return (
        <div className="relative group aspect-square">
            <img src={objectUrl} alt={file.name} className="w-full h-full object-cover rounded-md" />
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-colors duration-200 flex items-center justify-center">
                <button
                    onClick={onRemove}
                    className="absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full p-0.5 hover:bg-red-500 transition-all opacity-0 group-hover:opacity-100 transform scale-75 group-hover:scale-100"
                    aria-label={`Remove ${file.name}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
        </div>
    );
};


export const AtmosphereUploader: React.FC<AtmosphereUploaderProps> = ({ files, onFilesChange, disabled }) => {
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  }, [disabled]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (disabled) return;
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      // FIX: Explicitly type `file` as `File` to resolve TypeScript error.
      const imageFiles = Array.from(e.dataTransfer.files).filter((file: File) => file.type.startsWith('image/'));
      onFilesChange([...files, ...imageFiles]);
      e.dataTransfer.clearData();
    }
  }, [onFilesChange, files, disabled]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // FIX: Explicitly type `file` as `File` to resolve TypeScript error.
      const imageFiles = Array.from(e.target.files).filter((file: File) => file.type.startsWith('image/'));
      onFilesChange([...files, ...imageFiles]);
      // Reset input value to allow selecting the same file again
      e.target.value = '';
    }
  };

  const handleClick = () => {
    if (!disabled) {
        fileInputRef.current?.click();
    }
  };

  const handleRemoveFile = (indexToRemove: number) => {
    onFilesChange(files.filter((_, index) => index !== indexToRemove));
  };


  return (
    <div className="space-y-3">
        <div>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-slate-200">{t('atmosphereUploader.title')}</h3>
            <p className="text-xs text-gray-500 dark:text-slate-400">{t('atmosphereUploader.description')}</p>
        </div>
        {files.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
                {files.map((file, index) => (
                    <AtmosphereImagePreview key={`${file.name}-${index}`} file={file} onRemove={() => handleRemoveFile(index)} />
                ))}
            </div>
        )}
        <div
          onClick={handleClick}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`flex items-center justify-center p-4 border-2 border-dashed rounded-lg cursor-pointer transition-colors duration-300
            ${disabled ? 'bg-gray-200 dark:bg-gray-800 border-gray-300 dark:border-gray-700 cursor-not-allowed' : 
            isDragging ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/50' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 hover:border-indigo-400 dark:hover:border-indigo-500'}`}
        >
            <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={handleChange}
                className="hidden"
                disabled={disabled}
            />
            <div className="flex items-center gap-2 text-center">
                <UploadIcon className="w-5 h-5 text-gray-400 dark:text-slate-500" />
                <p className="text-sm font-semibold text-gray-600 dark:text-slate-300">
                <span className="text-indigo-600 dark:text-indigo-400">{t('atmosphereUploader.upload')}</span>
                </p>
            </div>
        </div>
    </div>
  );
};