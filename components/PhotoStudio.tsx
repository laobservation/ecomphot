import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ImageUploader } from './ImageUploader';
import { Controls } from './Controls';
import { ImagePreviewGrid } from './ImagePreviewGrid';
import type { ProcessedImage, CustomizationOptions } from '../types';
import { processImageWithGemini, upscaleImageWithGemini, correctColorWithGemini } from '../services/geminiService';
import { DownloadIcon, CameraPlusIcon, SparklesIcon } from './Icons';
import { InfoBanner } from './InfoBanner';
import { CameraCapture } from './CameraCapture';
import { usePageVisibility, playNotificationSound } from '../utils';

interface PhotoStudioProps {
  selectedNiche: string;
  setSelectedNiche: React.Dispatch<React.SetStateAction<string>>;
}

const ProgressBar: React.FC<{ current: number; total: number }> = ({ current, total }) => {
    const { t } = useTranslation();
    const percentage = total > 0 ? (current / total) * 100 : 0;

    return (
        <div className="mb-6 space-y-2" role="status" aria-live="polite">
            <div className="flex justify-between items-center px-1">
                <p className="text-xs md:text-sm font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                    {t('photoStudio.progress.processing', { current, total })}
                </p>
                <p className="text-xs md:text-sm font-medium text-gray-500 dark:text-slate-400">
                    {Math.round(percentage)}%
                </p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 dark:bg-gray-700 overflow-hidden" aria-label={t('photoStudio.progress.label')}>
                <div 
                    className="bg-indigo-600 h-full rounded-full transition-all duration-500 ease-in-out shadow-[0_0_10px_rgba(79,70,229,0.5)]" 
                    style={{ width: `${percentage}%` }}
                    role="progressbar"
                    aria-valuenow={current}
                    aria-valuemin={0}
                    aria-valuemax={total}
                ></div>
            </div>
        </div>
    );
};

export const PhotoStudio: React.FC<PhotoStudioProps> = ({ selectedNiche, setSelectedNiche }) => {
  const { t } = useTranslation();
  const [images, setImages] = useState<ProcessedImage[]>([]);
  const [options, setOptions] = useState<CustomizationOptions>({
    backgroundColor: 'a seamless white background',
    aspectRatio: 'Original',
    restaurantMode: 'enhance',
  });
  const [atmosphereFiles, setAtmosphereFiles] = useState<File[]>([]);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number } | null>(null);
  const isPageVisibleRef = usePageVisibility();

  useEffect(() => {
    if (selectedNiche !== 'restaurant') {
      setAtmosphereFiles([]);
    }
  }, [selectedNiche]);

  const handleFiles = useCallback((files: File[]) => {
    const newImages: ProcessedImage[] = files.map((file) => ({
      id: `${file.name}-${Date.now()}`,
      file,
      originalSrc: URL.createObjectURL(file),
      processedSrc: null,
      status: 'idle',
      error: null,
      upscaledSrc: null,
      upscaleStatus: 'idle',
      upscaleError: null,
      colorCorrectedSrc: null,
      colorCorrectStatus: 'idle',
      colorCorrectError: null,
    }));
    setImages((prev) => [...prev, ...newImages]);
  }, []);

  useEffect(() => {
    const handleFilesDropped = (event: Event) => {
      const customEvent = event as CustomEvent<File[]>;
      if (customEvent.detail) {
        handleFiles(customEvent.detail);
      }
    };

    window.addEventListener('filesdropped', handleFilesDropped);

    return () => {
      window.removeEventListener('filesdropped', handleFilesDropped);
    };
  }, [handleFiles]);

  const handleCapture = useCallback((file: File) => {
    const newImage: ProcessedImage = {
        id: `${file.name}-${Date.now()}`,
        file,
        originalSrc: URL.createObjectURL(file),
        processedSrc: null,
        status: 'idle',
        error: null,
        upscaledSrc: null,
        upscaleStatus: 'idle',
        upscaleError: null,
        colorCorrectedSrc: null,
        colorCorrectStatus: 'idle',
        colorCorrectError: null,
    };
    setImages((prev) => [newImage, ...prev]);
    setIsCameraOpen(false);
  }, []);

  const handleProcessOne = useCallback(async (imageId: string) => {
    const imageToProcess = images.find(img => img.id === imageId);
    if (!imageToProcess) return;

    setImages(prev => prev.map(img => 
      img.id === imageId 
      ? { ...img, status: 'processing', error: null } 
      : img
    ));

    try {
      const fileToProcess = imageToProcess.file;
      const processedSrc = await processImageWithGemini(fileToProcess, options, selectedNiche, atmosphereFiles, logoFile);
      setImages(prev => prev.map(img => 
        img.id === imageId 
        ? { ...img, status: 'done', processedSrc } 
        : img
      ));
      if (!isPageVisibleRef.current) {
        playNotificationSound();
      }
    } catch (error) {
      console.error(`Failed to process ${imageToProcess.file.name}:`, error);
      const errorMessage = error instanceof Error ? error.message : t('common.error.unknown');
      setImages(prev => prev.map(img => 
        img.id === imageId 
        ? { ...img, status: 'error', error: errorMessage } 
        : img
      ));
    }
  }, [images, options, t, selectedNiche, atmosphereFiles, logoFile, isPageVisibleRef]);


  const handleRegenerate = useCallback(async (imageId: string) => {
    const imageToRegenerate = images.find(img => img.id === imageId);
    if (!imageToRegenerate) return;

    setImages(prev => prev.map(img => 
      img.id === imageId 
      ? { 
          ...img, 
          status: 'processing', 
          processedSrc: null, 
          error: null,
          upscaledSrc: null,
          upscaleStatus: 'idle',
          upscaleError: null,
          colorCorrectedSrc: null,
          colorCorrectStatus: 'idle',
          colorCorrectError: null,
        } 
      : img
    ));

    try {
      const fileToProcess = imageToRegenerate.file;
      const processedSrc = await processImageWithGemini(fileToProcess, options, selectedNiche, atmosphereFiles, logoFile);
      setImages(prev => prev.map(img => 
        img.id === imageId 
        ? { ...img, status: 'done', processedSrc } 
        : img
      ));
      if (!isPageVisibleRef.current) {
        playNotificationSound();
      }
    } catch (error) {
      console.error(`Failed to re-process ${imageToRegenerate.file.name}:`, error);
      const errorMessage = error instanceof Error ? error.message : t('common.error.unknown');
      setImages(prev => prev.map(img => 
        img.id === imageId 
        ? { ...img, status: 'error', error: errorMessage } 
        : img
      ));
    }
  }, [images, options, t, selectedNiche, atmosphereFiles, logoFile, isPageVisibleRef]);

  const handleColorCorrect = useCallback(async (imageId: string) => {
    const imageToCorrect = images.find(img => img.id === imageId);
    const sourceForCorrection = imageToCorrect?.colorCorrectedSrc || imageToCorrect?.processedSrc;

    if (!imageToCorrect || !sourceForCorrection) return;

    setImages(prev => prev.map(img => img.id === imageId ? { ...img, colorCorrectStatus: 'processing', colorCorrectError: null } : img));

    try {
      const response = await fetch(sourceForCorrection);
      const blob = await response.blob();
      const fileToCorrect = new File([blob], `for-correction-${imageToCorrect.file.name}`, { type: blob.type });

      const newColorCorrectedSrc = await correctColorWithGemini(fileToCorrect);

      setImages(prev => prev.map(img => 
        img.id === imageId 
        ? { 
            ...img, 
            colorCorrectStatus: 'done', 
            colorCorrectedSrc: newColorCorrectedSrc, 
            upscaleStatus: 'idle'
          } 
        : img
      ));
      if (!isPageVisibleRef.current) {
        playNotificationSound();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('common.error.unknown');
      setImages(prev => prev.map(img => img.id === imageId ? { ...img, colorCorrectStatus: 'error', colorCorrectError: errorMessage } : img));
    }
  }, [images, t, isPageVisibleRef]);
  
  const handleUpscale = useCallback(async (imageId: string) => {
    const imageToUpscale = images.find(img => img.id === imageId);
    const sourceForUpscale = imageToUpscale?.colorCorrectedSrc || imageToUpscale?.processedSrc;
    if (!imageToUpscale || !sourceForUpscale) return;

    setImages(prev => prev.map(img => img.id === imageId ? { ...img, upscaleStatus: 'processing', upscaleError: null } : img));

    try {
      const response = await fetch(sourceForUpscale);
      const blob = await response.blob();
      const processedFile = new File([blob], `processed-${imageToUpscale.file.name}`, { type: blob.type });

      const upscaledSrc = await upscaleImageWithGemini(processedFile);
      setImages(prev => prev.map(img => img.id === imageId ? { ...img, upscaleStatus: 'done', upscaledSrc } : img));
      if (!isPageVisibleRef.current) {
        playNotificationSound();
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : t('common.error.unknown');
      setImages(prev => prev.map(img => img.id === imageId ? { ...img, upscaleStatus: 'error', upscaleError: errorMessage } : img));
    }
  }, [images, t, isPageVisibleRef]);

  const handleProcessAllIdle = useCallback(async () => {
    const idleImages = images.filter(img => img.status === 'idle');
    if (idleImages.length === 0) return;

    setBatchProgress({ current: 0, total: idleImages.length });

    for (let i = 0; i < idleImages.length; i++) {
        const imageToProcess = idleImages[i];
        await handleProcessOne(imageToProcess.id);
        setBatchProgress({ current: i + 1, total: idleImages.length });
    }
    
    setBatchProgress(null);
  }, [images, handleProcessOne]);

  const handleDownloadAll = () => {
    images.forEach(image => {
      const downloadSrc = image.upscaledSrc || image.colorCorrectedSrc || image.processedSrc;
      if (image.status === 'done' && downloadSrc) {
        const link = document.createElement('a');
        link.href = downloadSrc;
        const nameParts = image.file.name.split('.');
        nameParts.pop();
        const suffix = image.upscaledSrc ? '-2x' : (image.colorCorrectedSrc ? '-cc' : '');
        link.download = `${nameParts.join('.')}-studio${suffix}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    });
  };

  const isAnyImageProcessing = images.some(img => img.status === 'processing' || img.upscaleStatus === 'processing' || img.colorCorrectStatus === 'processing');
  const doneImageCount = images.filter(img => img.status === 'done').length;
  const idleImageCount = images.filter(img => img.status === 'idle').length;

  return (
    <div className="space-y-8">
      <div className="p-4 md:p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700">
        <InfoBanner title={t('photoStudio.howItWorksTitle')}>
          <ol className="list-decimal list-inside space-y-2 mt-2">
              <li>{t('photoStudio.step1')}</li>
              <li>{t('photoStudio.step2')}</li>
              <li>{t('photoStudio.step3')}</li>
          </ol>
        </InfoBanner>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 md:gap-12">
          <div className="lg:col-span-1 space-y-8">
            <section>
              <h2 className="text-xl font-bold text-gray-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                <span className="flex items-center justify-center w-7 h-7 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-full text-sm">1</span>
                {t('photoStudio.uploadTitle')}
              </h2>
              <div className="space-y-4">
                <ImageUploader onFiles={handleFiles} />
                 <button
                    onClick={() => setIsCameraOpen(true)}
                    disabled={isAnyImageProcessing}
                    className="w-full h-12 flex items-center justify-center gap-2 px-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-slate-200 font-bold rounded-xl border border-gray-300 dark:border-gray-600 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 transition-all active:scale-95"
                  >
                    <CameraPlusIcon className="w-5 h-5" />
                    <span>{t('photoStudio.takePhoto')}</span>
                  </button>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-gray-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                <span className="flex items-center justify-center w-7 h-7 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-full text-sm">2</span>
                {t('photoStudio.customizeTitle')}
              </h2>
              <Controls 
                options={options} 
                setOptions={setOptions} 
                disabled={isAnyImageProcessing}
                selectedNiche={selectedNiche}
                setSelectedNiche={setSelectedNiche}
                atmosphereFiles={atmosphereFiles}
                setAtmosphereFiles={setAtmosphereFiles}
                logoFile={logoFile}
                setLogoFile={setLogoFile}
              />
            </section>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
               <h2 className="text-xl font-bold text-gray-800 dark:text-slate-100 flex items-center gap-2">
                 <span className="flex items-center justify-center w-7 h-7 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-full text-sm">3</span>
                 {t('photoStudio.resultsTitle')}
               </h2>
               <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3">
                 <button
                   onClick={handleProcessAllIdle}
                   disabled={isAnyImageProcessing || idleImageCount === 0}
                   className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-all active:scale-95"
                 >
                   <SparklesIcon className="w-5 h-5" />
                   <span>{t('photoStudio.enhancePhoto', { count: idleImageCount })}</span>
                 </button>
                 <button
                  onClick={handleDownloadAll}
                  disabled={isAnyImageProcessing || doneImageCount === 0}
                  className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-2.5 bg-green-600 text-white font-bold rounded-xl shadow-lg shadow-green-500/20 hover:bg-green-700 disabled:bg-green-300 disabled:cursor-not-allowed transition-all active:scale-95"
                 >
                   <DownloadIcon className="w-5 h-5" />
                   <span>{t('photoStudio.downloadAll')}</span>
                 </button>
               </div>
            </div>
            
            {batchProgress && <ProgressBar current={batchProgress.current} total={batchProgress.total} />}

            <div className="min-h-[400px]">
              <ImagePreviewGrid 
                images={images} 
                onUpscale={handleUpscale}
                onRegenerate={handleRegenerate}
                onProcess={handleProcessOne}
                onColorCorrect={handleColorCorrect}
              />
            </div>
          </div>
        </div>
      </div>
      {isCameraOpen && (
          <CameraCapture 
              onCapture={handleCapture}
              onClose={() => setIsCameraOpen(false)}
          />
      )}
    </div>
  );
};
