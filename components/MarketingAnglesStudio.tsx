import React, { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Header } from './Header';
import { ImageUploader } from './ImageUploader';
import { SparklesIcon, DownloadIcon, RefreshIcon, CheckIcon } from './Icons';
import { generateMarketingAngle } from '../services/geminiService';

interface AngleResult {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  status: 'idle' | 'processing' | 'completed' | 'error';
  error?: string;
}

const INITIAL_ANGLES: Omit<AngleResult, 'imageUrl' | 'status'>[] = [
  { id: 'hero', name: 'The "Hero"', description: 'Clean, high-resolution shot on a plain white background.' },
  { id: 'context', name: 'The "Context"', description: 'Lifestyle/In-use shot in a natural habitat.' },
  { id: 'macro', name: 'The "Macro"', description: 'Extreme close-up showing quality and texture.' },
  { id: 'scale', name: 'The "Scale"', description: 'Size comparison next to a common object.' },
  { id: 'instructional', name: 'The "Instructional"', description: 'Infographic style with key feature callouts.' },
  { id: '360', name: 'The "360°/Full View"', description: 'Transparency shot showing back, bottom, or inside.' },
  { id: 'proof', name: 'The "Proof"', description: 'Authentic social proof or Before/After results.' },
];

export const MarketingAnglesStudio: React.FC = () => {
  const { t } = useTranslation();
  const [sourceImage, setSourceImage] = useState<File | null>(null);
  const [sourcePreview, setSourcePreview] = useState<string | null>(null);
  const [results, setResults] = useState<AngleResult[]>(
    INITIAL_ANGLES.map(a => ({ ...a, imageUrl: null, status: 'idle' }))
  );
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);

  const handleImageUpload = (files: File[]) => {
    if (files.length > 0) {
      const file = files[0];
      setSourceImage(file);
      setSourcePreview(URL.createObjectURL(file));
      // Reset results when new image is uploaded
      setResults(INITIAL_ANGLES.map(a => ({ ...a, imageUrl: null, status: 'idle' })));
    }
  };

  const generateAngle = async (angleId: string) => {
    if (!sourceImage) return;

    setResults(prev => prev.map(r => 
      r.id === angleId ? { ...r, status: 'processing', error: undefined } : r
    ));

    try {
      const imageUrl = await generateMarketingAngle(sourceImage, angleId);
      setResults(prev => prev.map(r => 
        r.id === angleId ? { ...r, status: 'completed', imageUrl } : r
      ));
    } catch (err: any) {
      setResults(prev => prev.map(r => 
        r.id === angleId ? { ...r, status: 'error', error: err.message } : r
      ));
    }
  };

  const generateAll = async () => {
    if (!sourceImage || isGeneratingAll) return;
    setIsGeneratingAll(true);

    // Generate sequentially to avoid hitting rate limits too hard
    for (const angle of INITIAL_ANGLES) {
      await generateAngle(angle.id);
    }

    setIsGeneratingAll(false);
  };

  const downloadImage = (url: string, name: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = `vantage-${name.toLowerCase().replace(/\s+/g, '-')}.png`;
    link.click();
  };

  return (
    <div className="space-y-12 pb-24">
      <Header 
        title="Marketing Angles Generator" 
        subtitle="One photo, seven essential marketing shots. Boost your conversion rates with AI-generated professional angles."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* LEFT: Upload & Source */}
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl border border-gray-100 dark:border-gray-700">
            <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
              <span className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-lg flex items-center justify-center text-sm">1</span>
              Upload Product Photo
            </h3>
            
            <ImageUploader onFiles={handleImageUpload} />

            {sourcePreview && (
              <div className="mt-8 space-y-4">
                <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Source Image</p>
                <div className="relative aspect-square rounded-2xl overflow-hidden border-2 border-indigo-500 shadow-lg">
                  <img src={sourcePreview} alt="Source" className="w-full h-full object-contain bg-gray-50 dark:bg-gray-900" />
                </div>
                <button 
                  onClick={generateAll}
                  disabled={isGeneratingAll || !sourceImage}
                  className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-2xl font-black text-lg shadow-xl shadow-indigo-200 dark:shadow-none transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                >
                  {isGeneratingAll ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Generating All...
                    </>
                  ) : (
                    <>
                      <SparklesIcon className="w-6 h-6" />
                      Generate All 7 Angles
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-3xl p-8 border border-indigo-100 dark:border-indigo-800/50">
            <h4 className="font-bold text-indigo-900 dark:text-indigo-300 mb-4 flex items-center gap-2">
              <CheckIcon className="w-5 h-5" />
              Why 7 Angles?
            </h4>
            <ul className="space-y-3 text-sm text-indigo-800/70 dark:text-indigo-400/70 leading-relaxed">
              <li>• <strong>Hero:</strong> Perfect for main search results.</li>
              <li>• <strong>Context:</strong> Helps customers visualize ownership.</li>
              <li>• <strong>Macro:</strong> Proves quality through detail.</li>
              <li>• <strong>Scale:</strong> Reduces returns by showing size.</li>
              <li>• <strong>Instructional:</strong> Highlights key USPs.</li>
              <li>• <strong>360°:</strong> Provides full transparency.</li>
              <li>• <strong>Proof:</strong> Builds trust with UGC style.</li>
            </ul>
          </div>
        </div>

        {/* RIGHT: Results Grid */}
        <div className="lg:col-span-2 space-y-8">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold flex items-center gap-2">
              <span className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-lg flex items-center justify-center text-sm">2</span>
              Generated Marketing Assets
            </h3>
            {results.some(r => r.status === 'completed') && (
              <button 
                onClick={() => setResults(INITIAL_ANGLES.map(a => ({ ...a, imageUrl: null, status: 'idle' })))}
                className="text-sm font-bold text-gray-500 hover:text-indigo-600 flex items-center gap-1 transition-colors"
              >
                <RefreshIcon className="w-4 h-4" />
                Reset All
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {results.map((angle) => (
              <div 
                key={angle.id}
                className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-lg border border-gray-100 dark:border-gray-700 flex flex-col h-full"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="font-black text-gray-900 dark:text-white">{angle.name}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{angle.description}</p>
                  </div>
                  {angle.status === 'completed' && (
                    <span className="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 p-1.5 rounded-full">
                      <CheckIcon className="w-4 h-4" />
                    </span>
                  )}
                </div>

                <div className="relative aspect-square rounded-2xl overflow-hidden bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 flex-grow group">
                  {angle.imageUrl ? (
                    <>
                      <img 
                        src={angle.imageUrl} 
                        alt={angle.name} 
                        className="w-full h-full object-contain"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                        <button 
                          onClick={() => downloadImage(angle.imageUrl!, angle.name)}
                          className="bg-white text-gray-900 p-3 rounded-xl hover:bg-indigo-50 transition-colors shadow-xl"
                          title="Download"
                        >
                          <DownloadIcon className="w-6 h-6" />
                        </button>
                        <button 
                          onClick={() => generateAngle(angle.id)}
                          className="bg-white text-gray-900 p-3 rounded-xl hover:bg-indigo-50 transition-colors shadow-xl"
                          title="Regenerate"
                        >
                          <RefreshIcon className="w-6 h-6" />
                        </button>
                      </div>
                    </>
                  ) : angle.status === 'processing' ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                      <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-sm font-bold text-indigo-600 animate-pulse">AI is crafting...</p>
                    </div>
                  ) : angle.status === 'error' ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center gap-3">
                      <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center">
                        <RefreshIcon className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-bold text-rose-600">Generation Failed</p>
                      <p className="text-xs text-gray-500">{angle.error}</p>
                      <button 
                        onClick={() => generateAngle(angle.id)}
                        className="mt-2 text-xs font-bold text-indigo-600 hover:underline"
                      >
                        Try Again
                      </button>
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center gap-4">
                      <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center text-gray-300 dark:text-gray-600">
                        <SparklesIcon className="w-8 h-8" />
                      </div>
                      <button 
                        onClick={() => generateAngle(angle.id)}
                        disabled={!sourceImage || isGeneratingAll}
                        className="px-6 py-2 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm font-bold hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                      >
                        Generate Angle
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
