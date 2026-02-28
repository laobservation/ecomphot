import React from 'react';
import { useTranslation } from 'react-i18next';
import { SparklesIcon, CameraIcon, WandIcon, CameraPlusIcon } from './Icons';

interface LandingPageProps {
  onSelectTool: (toolId: string) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onSelectTool }) => {
  const { t } = useTranslation();

  const tools = [
    {
      id: 'atmosphere-generator',
      name: 'Product Atmosphere Generator',
      description: 'Transform amateur snapshots into studio-quality photos with AI-powered lighting and backgrounds.',
      icon: <SparklesIcon className="w-8 h-8" />,
      color: 'bg-indigo-500',
      tag: 'Active'
    },
    {
      id: 'marketing-angles',
      name: 'Marketing Angles Generator',
      description: 'Generate 7 essential marketing shots from a single product photo to boost your sales conversion.',
      icon: <CameraPlusIcon className="w-8 h-8" />,
      color: 'bg-rose-500',
      tag: 'Active'
    },
    {
      id: 'background-remover',
      name: 'Smart Background Remover',
      description: 'Instantly remove backgrounds from any product photo with high precision.',
      icon: <WandIcon className="w-8 h-8" />,
      color: 'bg-emerald-500',
      tag: 'Coming Soon'
    },
    {
      id: 'upscaler',
      name: 'AI Image Upscaler',
      description: 'Enhance image resolution and clarity without losing detail.',
      icon: <CameraIcon className="w-8 h-8" />,
      color: 'bg-amber-500',
      tag: 'Coming Soon'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <div className="text-center mb-16">
        <h1 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white mb-6 tracking-tight">
          The Future of <span className="text-indigo-600 dark:text-indigo-400">Product Photography</span>
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto leading-relaxed">
          One platform, all the tools you need to create stunning visual content for your brand. 
          Powered by advanced generative AI.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {tools.map((tool) => (
          <div 
            key={tool.id}
            onClick={() => (tool.id === 'atmosphere-generator' || tool.id === 'marketing-angles') && onSelectTool(tool.id)}
            className={`group relative bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-xl border border-gray-100 dark:border-gray-700 transition-all duration-300 ${ (tool.id === 'atmosphere-generator' || tool.id === 'marketing-angles') ? 'cursor-pointer hover:scale-[1.02] hover:shadow-2xl' : 'opacity-75 cursor-not-allowed'}`}
          >
            {tool.tag && (
              <span className={`absolute top-6 right-6 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${tool.id === 'atmosphere-generator' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'}`}>
                {tool.tag}
              </span>
            )}
            
            <div className={`${tool.color} w-16 h-16 rounded-2xl flex items-center justify-center text-white mb-8 shadow-lg group-hover:rotate-6 transition-transform`}>
              {tool.icon}
            </div>
            
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{tool.name}</h3>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-8">
              {tool.description}
            </p>
            
            <div className="flex items-center text-indigo-600 dark:text-indigo-400 font-bold">
              {(tool.id === 'atmosphere-generator' || tool.id === 'marketing-angles') ? (
                <>
                  <span>Launch Tool</span>
                  <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              ) : (
                <span className="text-gray-400">Coming Soon</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-24 p-12 bg-indigo-600 rounded-[3rem] text-white text-center shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl"></div>
        
        <h2 className="text-3xl md:text-5xl font-black mb-6 relative z-10">Ready to transform your brand?</h2>
        <p className="text-xl text-indigo-100 mb-10 max-w-2xl mx-auto relative z-10">
          Join thousands of creators who are using Vantage Studio to save time and money on professional photography.
        </p>
        <button 
          onClick={() => onSelectTool('atmosphere-generator')}
          className="bg-white text-indigo-600 px-10 py-4 rounded-2xl font-black text-lg hover:bg-indigo-50 transition-colors shadow-xl relative z-10"
        >
          Get Started Now
        </button>
      </div>
    </div>
  );
};
