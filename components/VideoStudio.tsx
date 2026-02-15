import React, { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { generateVideoWithGemini } from '../services/geminiService';
import { UploadIcon, FilmIcon, DownloadIcon, ErrorIcon } from './Icons';
import { InfoBanner } from './InfoBanner';
import { usePageVisibility, playNotificationSound } from '../utils';

const VideoImageUploader: React.FC<{onFile: (file: File | null) => void, image: File | null}> = ({ onFile, image }) => {
    const { t } = useTranslation();
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") setIsDragging(true);
        else if (e.type === "dragleave") setIsDragging(false);
    }, []);

    const processFile = (file: File | null) => {
        if (file && file.type.startsWith('image/')) {
            onFile(file);
        }
    }

    const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault(); e.stopPropagation(); setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            processFile(e.dataTransfer.files[0]);
            e.dataTransfer.clearData();
        }
    }, [onFile]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            processFile(e.target.files[0]);
        }
    };
    
    const handleClick = () => fileInputRef.current?.click();
    
    if (image) {
        return (
            <div className="relative group">
                <img src={URL.createObjectURL(image)} alt="Product preview" className="w-full rounded-xl" />
                <button 
                    onClick={() => onFile(null)} 
                    className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full p-1.5 hover:bg-opacity-75 transition-opacity opacity-0 group-hover:opacity-100"
                    aria-label="Remove image"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
        )
    }

    return (
        <div
            onClick={handleClick} onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop}
            className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-xl cursor-pointer transition-colors duration-300 ${isDragging ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/50' : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 hover:border-indigo-400 dark:hover:border-indigo-500'}`}
        >
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleChange} className="hidden" />
            <div className="flex flex-col items-center text-center">
                <UploadIcon className="w-10 h-10 text-gray-400 dark:text-slate-500 mb-3" />
                <p className="font-semibold text-gray-600 dark:text-slate-300"><span className="text-indigo-600 dark:text-indigo-400">{t('imageUploader.upload')}</span> {t('imageUploader.drag')}</p>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">{t('imageUploader.single')}</p>
            </div>
        </div>
    );
};

const promptSuggestions = [
    "spin",
    "assembly",
    "float",
    "nature",
    "splash",
    "blueprint",
    "urban",
    "minimalist",
];

const fullPrompts: { [key: string]: string } = {
    "spin": "A cinematic 360-degree rotation of the product on a reflective, dark surface with dramatic studio lighting.",
    "assembly": "The product assembles itself piece by piece in a playful stop-motion animation style against a solid, vibrant color background.",
    "float": "The product floats serenely in a zero-gravity environment, slowly tumbling with soft light glinting off its surfaces.",
    "nature": "A breathtaking shot of the product placed on a mossy rock in a lush, sun-dappled forest.",
    "splash": "An elegant, ultra slow-motion shot of clear water splashing over the product, highlighting its form and water-resistant features.",
    "blueprint": "The product materializes from a futuristic, holographic blueprint animation with glowing digital lines and particles.",
    "urban": "A fast-paced, energetic commercial showing the product used in a stylish, modern urban city environment with quick cuts.",
    "minimalist": "A minimalist, clean presentation of the product on a pedestal, with the camera slowly pushing in to reveal fine details.",
};


export const VideoStudio: React.FC = () => {
    const { t } = useTranslation();
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [prompt, setPrompt] = useState('');
    const [duration, setDuration] = useState(4);
    const [status, setStatus] = useState<'idle' | 'processing' | 'done' | 'error'>('idle');
    const [videoSrc, setVideoSrc] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [loadingMessage, setLoadingMessage] = useState('');
    const isPageVisibleRef = usePageVisibility();
    
    const isGenerating = status === 'processing';
    const canGenerate = imageFile && prompt.trim() !== '' && !isGenerating;

    const handleGenerate = async () => {
        if (!canGenerate || !imageFile) return;

        setStatus('processing');
        setError(null);
        setVideoSrc(null);

        try {
            const onProgress = (message: string) => {
                let messageKey = 'checking'; // Default message
                if (message.includes("Preparing")) messageKey = 'preparing';
                else if (message.includes("Initiating")) messageKey = 'initiating';
                else if (message.includes("started")) messageKey = 'started';
                else if (message.includes("Downloading")) messageKey = 'downloading';
                else if (message.includes("ready")) messageKey = 'ready';
                
                setLoadingMessage(t(`videoStudio.processingState.messages.${messageKey}`));
            };
            const resultSrc = await generateVideoWithGemini(imageFile, prompt, duration, onProgress);
            setVideoSrc(resultSrc);
            setStatus('done');
            if (!isPageVisibleRef.current) {
                playNotificationSound();
            }
        } catch (err) {
            setStatus('error');
            const errorMessage = err instanceof Error ? err.message : t('common.error.unknown');
            setError(errorMessage);
            console.error(err);
        }
    };

    const renderResultArea = () => {
        switch(status) {
            case 'idle':
                return (
                    <div className="flex flex-col items-center justify-center h-full min-h-[400px] border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800/50 text-center p-4">
                        <FilmIcon className="w-16 h-16 text-gray-400 dark:text-slate-500 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-slate-200">{t('videoStudio.idleState.title')}</h3>
                        <p className="text-gray-500 dark:text-slate-400 mt-1">{t('videoStudio.idleState.subtitle')}</p>
                    </div>
                );
            case 'processing':
                return (
                    <div className="relative w-full flex flex-col items-center justify-center h-full min-h-[400px] border border-gray-300 dark:border-gray-700 rounded-xl bg-gray-900 text-center p-4 overflow-hidden">
                        <div className="animate-pulse">
                            <svg className="animate-spin h-10 w-10 text-indigo-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        </div>
                        <p className="text-white font-semibold mt-4 text-lg">{t('videoStudio.processingState.title')}</p>
                        <p className="text-gray-300 mt-2 text-sm">{loadingMessage}</p>
                    </div>
                );
            case 'done':
                return (
                    <div>
                        <video src={videoSrc!} controls autoPlay loop className="w-full rounded-xl aspect-video bg-black" />
                        <a
                            href={videoSrc!}
                            download={`${imageFile?.name.split('.').slice(0, -1).join('.') || 'product-video'}.mp4`}
                            className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition-all duration-300"
                        >
                            <DownloadIcon className="w-5 h-5" />
                            <span>{t('videoStudio.downloadVideo')}</span>
                        </a>
                    </div>
                );
            case 'error':
                 return (
                    <div className="flex flex-col items-center justify-center h-full min-h-[400px] border-2 border-dashed border-red-300 dark:border-red-700 rounded-xl bg-red-50 dark:bg-red-950/50 text-center p-4">
                        <ErrorIcon className="w-16 h-16 text-red-500 mb-4" />
                        <h3 className="text-lg font-semibold text-red-700 dark:text-red-300">{t('videoStudio.errorState.title')}</h3>
                        <p className="text-red-600 dark:text-red-400 mt-1 max-w-sm">{error}</p>
                    </div>
                 );
        }
    };
    
    return (
        <div className="mt-8 p-6 md:p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
            <InfoBanner title={t('videoStudio.howItWorksTitle')}>
                <ol className="list-decimal list-inside space-y-1">
                    <li>{t('videoStudio.step1')}</li>
                    <li>{t('videoStudio.step2')}</li>
                    <li>{t('videoStudio.step3')}</li>
                </ol>
            </InfoBanner>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-6">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-700 dark:text-slate-200 mb-4">{t('videoStudio.uploadTitle')}</h2>
                        <VideoImageUploader onFile={setImageFile} image={imageFile} />
                    </div>
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold text-gray-700 dark:text-slate-200">{t('videoStudio.configureTitle')}</h2>
                         <div>
                             <label htmlFor="video-prompt" className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('videoStudio.promptLabel')}</label>
                            <textarea
                                id="video-prompt"
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                disabled={isGenerating}
                                placeholder={t('videoStudio.promptPlaceholder')}
                                rows={4}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100 dark:bg-gray-900 dark:border-gray-600 dark:placeholder-slate-400 dark:text-white dark:focus:ring-indigo-500 dark:focus:border-indigo-500 dark:disabled:bg-gray-800"
                                aria-label="Video prompt"
                            />
                         </div>
                        <div>
                             <p className="text-xs text-gray-500 dark:text-slate-400 mb-2">{t('videoStudio.suggestionLabel')}</p>
                             <div className="flex flex-wrap gap-2">
                                {promptSuggestions.map((suggestionKey) => (
                                    <button
                                        key={suggestionKey}
                                        onClick={() => !isGenerating && setPrompt(fullPrompts[suggestionKey])}
                                        disabled={isGenerating}
                                        className="px-3 py-1 text-xs text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                        title={fullPrompts[suggestionKey]}
                                    >
                                        {t(`videoStudio.suggestions.${suggestionKey}`)}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                           <label htmlFor="video-duration" className="block text-sm font-medium text-gray-700 dark:text-slate-300" title={t('videoStudio.durationTooltip')}>{t('videoStudio.durationLabel', { duration })}</label>
                           <input
                                id="video-duration"
                                type="range"
                                min="2"
                                max="10"
                                step="1"
                                value={duration}
                                onChange={(e) => setDuration(Number(e.target.value))}
                                disabled={isGenerating}
                                className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer mt-1 accent-indigo-600 disabled:opacity-50"
                            />
                        </div>
                    </div>
                    <button
                        onClick={handleGenerate}
                        disabled={!canGenerate}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 disabled:bg-indigo-300 disabled:cursor-not-allowed transition-all duration-300"
                    >
                        <FilmIcon className="w-5 h-5" />
                        <span>{isGenerating ? t('videoStudio.creating') : t('videoStudio.createVideo')}</span>
                    </button>
                </div>
                <div className="lg:col-span-2">
                    <h2 className="text-xl font-semibold text-gray-700 dark:text-slate-200 mb-4">{t('videoStudio.resultsTitle')}</h2>
                    {renderResultArea()}
                </div>
            </div>
        </div>
    );
};
