import React from 'react';
import { useTranslation } from 'react-i18next';
import type { ProcessedImage } from '../types';
import { DownloadIcon, ErrorIcon, ImagePlusIcon, ArrowUpOnSquareIcon, CheckIcon, RefreshIcon, SparklesIcon, WandIcon } from './Icons';

interface ImagePreviewGridProps {
  images: ProcessedImage[];
  onUpscale: (imageId: string) => void;
  onRegenerate: (imageId: string) => void;
  onProcess: (imageId: string) => void;
  onColorCorrect: (imageId: string) => void;
}

const ImagePreviewCard: React.FC<{ image: ProcessedImage, onUpscale: (id: string) => void, onRegenerate: (id: string) => void, onProcess: (id: string) => void, onColorCorrect: (id: string) => void }> = ({ image, onUpscale, onRegenerate, onProcess, onColorCorrect }) => {
  const { t } = useTranslation();

  const isUpscaled = image.upscaleStatus === 'done' && image.upscaledSrc;
  const isCorrected = image.colorCorrectStatus === 'done' && image.colorCorrectedSrc;

  const displaySrc = image.colorCorrectedSrc || image.processedSrc || image.originalSrc;
  const downloadSrc = isUpscaled ? image.upscaledSrc : (image.colorCorrectedSrc || image.processedSrc);
  
  const downloadSuffix = isUpscaled ? '-studio-2x' : (isCorrected ? '-studio-cc' : '-studio');
  const downloadName = `${image.file.name.split('.').slice(0, -1).join('.')}${downloadSuffix}.png`;

  const renderStatusOverlay = () => {
    switch (image.status) {
      case 'processing':
        return (
          <div className="absolute inset-0 bg-white/80 dark:bg-gray-950/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 p-4 text-center">
            <svg className="animate-spin h-10 w-10 text-indigo-600 dark:text-indigo-400 mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">{t('photoStudio.processing')}</span>
          </div>
        );
      case 'error':
        return (
          <div className="absolute inset-0 bg-red-50/90 dark:bg-red-950/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 text-center z-10">
            <ErrorIcon className="w-10 h-10 text-red-500 mb-2" />
            <p className="text-sm font-bold text-red-700 dark:text-red-300">{t('imagePreview.failed')}</p>
            <p className="text-xs text-red-600 dark:text-red-400 mt-2 line-clamp-2">{image.error}</p>
          </div>
        );
      default:
        return null;
    }
  };

  const renderActionButtons = () => {
    if (image.status !== 'done') return null;

    return (
      <div className="flex flex-wrap gap-2 mt-auto">
        {/* Color Correct Button */}
        {image.colorCorrectStatus === 'idle' && (
          <button
            onClick={() => onColorCorrect(image.id)}
            className="flex-1 min-h-[36px] flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-500/20 dark:text-blue-300 active:scale-95"
          >
            <WandIcon className="w-4 h-4" />
            <span>CC</span>
          </button>
        )}
        {image.colorCorrectStatus === 'processing' && (
          <div className="flex-1 min-h-[36px] flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-100 text-blue-700 animate-pulse dark:bg-blue-500/20 dark:text-blue-300">
             <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        {image.colorCorrectStatus === 'done' && (
          <div className="flex-1 min-h-[36px] flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300">
            <CheckIcon className="w-4 h-4" />
          </div>
        )}

        {/* Upscale Button */}
        {image.upscaleStatus === 'idle' && (
          <button
            onClick={() => onUpscale(image.id)}
            className="flex-1 min-h-[36px] flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-500/20 dark:text-purple-300 active:scale-95"
          >
            <ArrowUpOnSquareIcon className="w-4 h-4" />
            <span>2X</span>
          </button>
        )}
        {image.upscaleStatus === 'processing' && (
          <div className="flex-1 min-h-[36px] flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-purple-100 text-purple-700 animate-pulse dark:bg-purple-500/20 dark:text-purple-300">
            <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        {image.upscaleStatus === 'done' && (
          <div className="flex-1 min-h-[36px] flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-green-100 text-green-800 dark:bg-green-500/20 dark:text-green-300">
            <CheckIcon className="w-4 h-4" />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="group relative flex flex-col bg-white dark:bg-gray-900 rounded-2xl overflow-hidden shadow-lg border border-gray-200 dark:border-gray-700 transition-all hover:shadow-xl">
      <div className="relative aspect-square w-full bg-gray-50 dark:bg-gray-950 flex items-center justify-center overflow-hidden">
          <img 
              src={displaySrc} 
              alt={image.file.name}
              className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
          />
          {renderStatusOverlay()}
      </div>
      
      <div className="p-4 flex flex-col flex-grow bg-white dark:bg-gray-900">
          <p className="text-xs font-medium text-gray-500 dark:text-slate-400 truncate mb-3" title={image.file.name}>
            {image.file.name}
          </p>

          {image.status === 'idle' ? (
             <button
                onClick={() => onProcess(image.id)}
                className="w-full h-11 flex items-center justify-center gap-2 px-4 bg-indigo-600 text-white font-bold rounded-xl shadow-md hover:bg-indigo-700 transition-all active:scale-95 mt-auto"
              >
                <SparklesIcon className="w-5 h-5" />
                <span>{t('photoStudio.enhance')}</span>
              </button>
          ) : image.status === 'done' ? (
              <div className="flex flex-col gap-4 mt-auto">
                {renderActionButtons()}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
                   <button
                        onClick={() => onRegenerate(image.id)}
                        className="h-10 w-10 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-slate-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all active:scale-90"
                        title={t('imagePreview.regenerateTooltip')}
                    >
                        <RefreshIcon className="w-5 h-5" />
                    </button>
                    {downloadSrc && (
                        <a
                            href={downloadSrc}
                            download={downloadName}
                            className="h-10 px-4 flex items-center justify-center gap-2 rounded-xl bg-indigo-600 text-white font-bold text-sm shadow-md hover:bg-indigo-700 transition-all active:scale-90 flex-grow ms-3"
                        >
                            <DownloadIcon className="w-4 h-4" />
                            <span>{t('imagePreview.downloadTooltip')}</span>
                        </a>
                    )}
                </div>
              </div>
          ) : image.status === 'error' ? (
              <button
                 onClick={() => onRegenerate(image.id)}
                 className="w-full h-11 flex items-center justify-center gap-2 px-4 bg-red-600 text-white font-bold rounded-xl shadow-md hover:bg-red-700 transition-all active:scale-95 mt-auto"
              >
                 <RefreshIcon className="w-5 h-5" />
                 <span>{t('imagePreview.retry')}</span>
              </button>
          ) : null}
      </div>
    </div>
  );
};

export const ImagePreviewGrid: React.FC<ImagePreviewGridProps> = ({ images, onUpscale, onRegenerate, onProcess, onColorCorrect }) => {
  const { t } = useTranslation();

  if (images.length === 0) {
      return (
          <div className="flex flex-col items-center justify-center h-full min-h-[350px] border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl bg-gray-50/50 dark:bg-gray-800/20 text-center p-8">
              <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <ImagePlusIcon className="w-10 h-10 text-gray-400 dark:text-slate-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-slate-100">{t('imagePreview.emptyState.title')}</h3>
              <p className="text-gray-500 dark:text-slate-400 mt-2 max-w-xs">{t('imagePreview.emptyState.subtitle')}</p>
          </div>
      );
  }

  return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {images.map((image) => (
              <ImagePreviewCard 
                  key={image.id} 
                  image={image} 
                  onUpscale={onUpscale} 
                  onRegenerate={onRegenerate}
                  onProcess={onProcess}
                  onColorCorrect={onColorCorrect}
              />
          ))}
      </div>
  );
};