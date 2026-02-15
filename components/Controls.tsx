import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { CustomizationOptions } from '../types';
import { regenerateBackgroundPrompts } from '../services/geminiService';
import { RefreshIcon } from './Icons';
import { AtmosphereUploader } from './AtmosphereUploader';
import { LogoUploader } from './LogoUploader';

interface ControlsProps {
  options: CustomizationOptions;
  setOptions: React.Dispatch<React.SetStateAction<CustomizationOptions>>;
  disabled: boolean;
  selectedNiche: string;
  setSelectedNiche: React.Dispatch<React.SetStateAction<string>>;
  atmosphereFiles: File[];
  setAtmosphereFiles: React.Dispatch<React.SetStateAction<File[]>>;
  logoFile: File | null;
  setLogoFile: React.Dispatch<React.SetStateAction<File | null>>;
}

const initialBackgroundSuggestions: Record<string, string[]> = {
  'beauty': [
    "Product on a single, imperfect freshwater pearl. Macro shot, extremely shallow depth of field, background of soft, out-of-focus dusty rose satin.",
    "A minimalist scene. Product rests on a floating, razor-thin sheet of frosted glass, casting a single, sharp shadow on a seamless white cyclorama.",
    "Product presented on a wet, black slate stone, surrounded by a fine mist.",
    "A sun-drenched setting. Product on a travertine pedestal.",
    "Product submerged in a glass container of crystal-clear, effervescent water.",
    "An opulent flat-lay on crushed, deep emerald green velvet.",
    "Product set within a cut geode, with crystalline structures catching the light.",
    "A clean, clinical aesthetic. Product placed on a brushed stainless steel surface.",
    "Product resting on a bed of rich, dark soil, with a single, dewy sprout emerging.",
    "A high-fashion shot. Product surrounded by draped, flowing silk in cobalt blue.",
    "A composition using stacked, clear acrylic blocks of various sizes.",
    "Product placed on a piece of raw, unfinished concrete.",
    "An ethereal scene where the product appears to float in a soft, colored cloud.",
    "Product on a mirrored surface, creating a perfect reflection.",
    "A texture-focused shot. Product is set against a background of handmade paper.",
    "Cosmetic swatched on a clean marble surface next to the product.",
    "Product rests on a fragment of a classical Roman statue.",
    "A clean, Japanese-inspired aesthetic on a simple wooden tray.",
    "Product is presented as a scientific discovery within a petri dish.",
    "A vibrant, pop-art inspired scene with bold yellow and blue."
  ],
  'furniture': [
    "A high-end minimalist bedroom featuring a raw, jagged exposed slate rock wall behind the bed, dramatic side-lighting catching the sharp edges of the stone, polished dark concrete floor, architectural photography style.",
    "A luxury outdoor patio at dusk with a pavement of rough, uneven natural cobblestones surrounding a smooth wooden sleeping platform, warm amber floor lighting hitting the textured rocks.",
    "A modern Mediterranean villa interior with oversized, unpolished limestone boulders placed as decorative elements near the bed, soft sunlight filtering through linen curtains onto a dusty stone floor.",
    "An industrial loft space with crumbling red brick walls and exposed rusted steel beams, a large floor-to-ceiling window showing a cold city skyline, contrasting with the bed’s plush textures.",
    "A serene Zen courtyard filled with crunchy grey pea gravel and a single large, sharp-edged granite monolith, the bed sitting centrally on a raised teak deck under a soft golden glow.",
    "A mountain lodge interior featuring walls made of raw, bark-covered logs and heavy timber beams with visible splinters and knots, a cold blue mist visible through the window.",
    "A minimalist bedroom with a floor of dark, polished obsidian that looks like cold black glass, reflecting the soft shadows of the bed, high-contrast cinematic lighting.",
    "A desert pavilion with a floor of dry, cracked clay earth and sun-bleached driftwood pillars, the warm orange glow of a sunset emphasizing the rough desert textures.",
    "A brutalist concrete bedroom with sharp 45-degree angles and cold grey shadows, a single spotlight focused on the center of the room to highlight the bed's softness.",
    "A coastal bedroom overlooking a stormy grey ocean with jagged basalt cliffs visible outside, the interior walls featuring a rough sand-plaster finish.",
    "A luxury tent interior with a floor of beaten, packed red earth and heavy canvas walls, rustic iron lanterns casting flickering shadows on the rugged ground.",
    "A room featuring a wall of vertical bamboo stalks and sharp-edged tropical plants like cacti and snake plants, creating a \"sharp\" perimeter around the sleeping area.",
    "An ancient stone cellar with vaulted ceilings and moss-covered damp rock walls, a modern bed placed in the center to look like a clean, warm sanctuary.",
    "A high-ceiling space with corrugated metal panels and oxidized iron accents, a floor of cold slate tiles with visible grout lines and rough textures.",
    "A glass-walled room surrounded by a garden of tall, jagged quartz crystals and sharp white stones, bright midday sun creating high-contrast shadows.",
    "A terrace made of weathered, reclaimed barn wood with deep grains and iron bolts, overlooking a valley of sharp pine trees and rocky peaks.",
    "A minimalist interior with a feature wall made of dry-stack flagstone, no mortar, showing deep crevices and sharp stone lips behind the headboard.",
    "A sleek, modern room with a floor of white terrazzo containing sharp glass chips, the walls finished in a cold, metallic silver leaf texture.",
    "A bedroom built into a natural sandstone cave, the ceiling and walls are rough-cut and abrasive, while a soft warm light glows from under the bed frame.",
    "A patio setting with a floor of loose, jagged volcanic rock (lava rock), a clean-lined modern bed sitting on a floating concrete slab in the center.",
    "A luxury attic with low-hanging, rough-sawn oak rafters and heavy iron hinges, the floor made of cold, wide-plank grey stone.",
    "An open-air pavilion surrounded by a shallow pool of dark, still water with sharp marble edges and a backdrop of textured concrete pillars.",
    "A room with a backdrop of heavy industrial chains and weathered rope coils, the floor made of polished steel plates with visible rivets.",
    "A winter-themed room with a view of frozen, jagged icicles hanging from a stone balcony, the interior lit with a warm, cozy hearth-like glow.",
    "A minimalist space featuring a floor of large, flat river stones with deep gaps, the wall behind the bed made of dark, charred \"shou sugi ban\" wood.",
    "A courtyard with a high wall of rusted Corten steel, the ground covered in sharp granite chippings, soft morning fog blurring the background.",
    "A bedroom with a floor of rough-cut travertine stone and a ceiling of exposed, dark-stained concrete with wooden formwork impressions.",
    "A setting featuring ancient weathered ruins with broken marble pillars and jagged fallen stones, a clean, modern bed placed perfectly in the center.",
    "A room with a floor of cold white marble and a feature wall of sharp, geometric 3D wood tiles that create a jagged, repetitive pattern.",
    "A coastal villa interior with walls made of compressed seashells and rough coral, the floor made of cold, grey-washed timber planks."
  ],
  'restaurant': [
    "A rustic, farm-to-table scene on a heavy, reclaimed wood table.",
    "A fine dining experience on a crisp white linen tablecloth.",
    "A bustling, authentic Italian pizzeria on a simple metal table.",
    "A bright and airy seaside cafe on a weathered, white-painted wooden table.",
    "A moody, intimate speakeasy bar on a dark, polished mahogany bar top.",
    "A modern, minimalist Nordic restaurant on a light, unfinished oak table.",
    "A vibrant, street-food market in Southeast Asia.",
    "A cozy, romantic French bistro on a small, marble-topped table.",
    "A chef's counter perspective on the stainless steel pass.",
    "A family-style Sunday brunch on a linen-covered table.",
    "A dramatic, high-contrast shot on a dark slate plate.",
    "An outdoor picnic on a checkered banner in a field of wildflowers.",
    "An elegant high-tea setting on a delicate, porcelain tiered stand.",
    "A healthy, vibrant California cafe on a clean, white table.",
    "A warm, cozy pub atmosphere on a dark, worn wooden table.",
    "A sleek, modern sushi bar on a minimalist ceramic plate.",
    "A festive, celebratory scene on a table decorated with confetti.",
    "A rustic vineyard setting on a wine barrel table at sunset.",
    "A clean, graphic, pop-art style with vibrant colors.",
    "An action shot of a chef's hand artfully garnishing the dish."
  ],
  'clothing': [
    "Ghost mannequin shot against a seamless, neutral gray cyclorama.",
    "A meticulous flat-lay composition on raw, deckle-edge paper.",
    "Lifestyle shot in a sun-drenched, minimalist loft with concrete floors.",
    "Garment hanging from a vintage brass hook against an olive green wall.",
    "A dynamic, frozen-motion shot with the fabric creating flowing shapes.",
    "A close-up, macro shot focusing on stitching and fabric texture.",
    "Apparel on a hanger against an old, grand European door.",
    "A luxury retail setting on a polished marble display table.",
    "Garment draped artfully over driftwood on a windswept sandy beach.",
    "Street-style context worn by an unrecognizable person.",
    "Clothing against a backdrop of lush, deep green tropical foliage.",
    "A high-key shot on a pure white background for e-commerce.",
    "A 'getaway' flat-lay on a light wood floor with travel items.",
    "Minimalist composition hanging on a simple rack against a dual-color wall.",
    "Apparel in a moody, atmospheric setting, like an old library.",
    "Studio shot using colored gels to create a vibrant, artistic background.",
    "Clothing laid on a bed with fresh, crisp white linen sheets.",
    "Detail shot of the garment being handcrafted by a tailor.",
    "Garment shot against a clean, architectural background.",
    "A seasonal shot draped over a rustic wooden fence with autumn leaves."
  ]
};

const aspectRatios = [
  { labelKey: 'original', value: 'Original' },
  { labelKey: '1:1', value: '1:1' },
  { labelKey: '16:9', value: '16:9' },
  { labelKey: '9:16', value: '9:16' },
  { labelKey: '4:3', value: '4:3' },
  { labelKey: '3:4', value: '3:4' },
];

export const Controls: React.FC<ControlsProps> = ({ 
  options, 
  setOptions, 
  disabled,
  selectedNiche,
  setSelectedNiche,
  atmosphereFiles,
  setAtmosphereFiles,
  logoFile,
  setLogoFile
}) => {
  const { t, i18n } = useTranslation();
  const [backgroundMode, setBackgroundMode] = useState<'prompt' | 'quick'>('quick');
  const [backgroundSuggestions, setBackgroundSuggestions] = useState(initialBackgroundSuggestions);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const handleBackgroundChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
     setOptions(prev => ({...prev, backgroundColor: e.target.value}));
  }

  const handleAspectRatioClick = (value: string) => {
    setOptions(prev => ({ ...prev, aspectRatio: value }));
  };
  
  const isAspectRatioActive = (value: string) => {
    return options.aspectRatio === value;
  };

  const handleRegeneratePrompts = async () => {
    setIsRegenerating(true);
    try {
      const newPrompts = await regenerateBackgroundPrompts(selectedNiche);
      setBackgroundSuggestions(prev => ({
        ...prev,
        [selectedNiche]: newPrompts,
      }));
      setOptions(prev => ({...prev, backgroundColor: ''}));
    } catch (error) {
      console.error("Failed to regenerate prompts:", error);
      const message = error instanceof Error ? error.message : t('common.error.unknown');
      alert(`${t('controls.regenerateErrorTitle')}: ${message}`);
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {selectedNiche === 'restaurant' && (
        <div className="space-y-3">
          <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wide">{t('controls.backgroundStyle')}</label>
          <div role="radiogroup" className="grid grid-cols-2 gap-1 p-1 bg-gray-100 dark:bg-gray-700/50 rounded-xl">
            <button
              role="radio"
              aria-checked={options.restaurantMode === 'enhance'}
              onClick={() => setOptions(prev => ({ ...prev, restaurantMode: 'enhance' }))}
              disabled={disabled}
              className={`h-11 px-3 text-sm font-bold rounded-lg transition-all duration-200 focus:outline-none disabled:opacity-50
                ${options.restaurantMode === 'enhance' ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'bg-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'}`}
            >
              {t('controls.restaurantModes.enhance')}
            </button>
            <button
              role="radio"
              aria-checked={options.restaurantMode === 'replace'}
              onClick={() => setOptions(prev => ({ ...prev, restaurantMode: 'replace' }))}
              disabled={disabled}
              className={`h-11 px-3 text-sm font-bold rounded-lg transition-all duration-200 focus:outline-none disabled:opacity-50
                ${options.restaurantMode === 'replace' ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'bg-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'}`}
            >
              {t('controls.restaurantModes.replace')}
            </button>
          </div>
          {options.restaurantMode === 'enhance' && (
             <div className="mt-4 p-4 bg-indigo-50/30 dark:bg-gray-900/40 rounded-xl border border-indigo-100 dark:border-gray-700">
               <AtmosphereUploader files={atmosphereFiles} onFilesChange={setAtmosphereFiles} disabled={disabled} />
             </div>
          )}
        </div>
      )}
      
      {(selectedNiche !== 'restaurant' || options.restaurantMode === 'replace') && (
        <div className="space-y-3">
          <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wide">{t('controls.background')}</label>
          <div role="radiogroup" className="grid grid-cols-2 gap-1 p-1 bg-gray-100 dark:bg-gray-700/50 rounded-xl">
            <button
              role="radio"
              aria-checked={backgroundMode === 'prompt'}
              onClick={() => setBackgroundMode('prompt')}
              disabled={disabled}
              className={`h-11 px-3 text-sm font-bold rounded-lg transition-all duration-200 focus:outline-none disabled:opacity-50
                ${backgroundMode === 'prompt' ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'bg-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'}`}
            >
              {t('controls.customPrompt')}
            </button>
            <button
              role="radio"
              aria-checked={backgroundMode === 'quick'}
              onClick={() => setBackgroundMode('quick')}
              disabled={disabled}
              className={`h-11 px-3 text-sm font-bold rounded-lg transition-all duration-200 focus:outline-none disabled:opacity-50
                ${backgroundMode === 'quick' ? 'bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'bg-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'}`}
            >
              {t('controls.quickOptions')}
            </button>
          </div>

          {backgroundMode === 'prompt' && (
            <div className="mt-4">
                <input
                    id="background-prompt"
                    type="text"
                    value={options.backgroundColor}
                    onChange={handleBackgroundChange}
                    placeholder={t('controls.promptPlaceholder')}
                    disabled={disabled}
                    className="w-full h-12 px-4 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm disabled:bg-gray-100 dark:bg-gray-900 dark:border-gray-600 dark:placeholder-slate-500 dark:text-white dark:disabled:bg-gray-800 transition-all"
                    aria-label="Enter a descriptive prompt for the background"
                />
            </div>
          )}

          {backgroundMode === 'quick' && (
            <div className="mt-4 space-y-4">
              <div>
                <label htmlFor="niche-select" className="block text-xs font-semibold text-gray-500 dark:text-slate-400 mb-1 uppercase tracking-wider">
                  {t('controls.nicheLabel')}
                </label>
                <select
                  id="niche-select"
                  value={selectedNiche}
                  onChange={(e) => setSelectedNiche(e.target.value)}
                  disabled={disabled || isRegenerating}
                  className="w-full h-11 px-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm dark:bg-gray-900 dark:border-gray-600 dark:text-white transition-all"
                >
                  {Object.keys(backgroundSuggestions).map((niche) => (
                    <option key={niche} value={niche}>
                      {t(`controls.niches.${niche}`)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label htmlFor="background-suggestion-select" className="block text-xs font-semibold text-gray-500 dark:text-slate-400 uppercase tracking-wider">
                    {t('controls.suggestionLabel')}
                  </label>
                  <button
                    onClick={handleRegeneratePrompts}
                    disabled={disabled || isRegenerating}
                    className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 disabled:text-gray-400 transition-colors dark:text-indigo-400 dark:hover:text-indigo-300"
                  >
                    <RefreshIcon className={`w-3.5 h-3.5 ${isRegenerating ? 'animate-spin' : ''}`} />
                    <span>{isRegenerating ? t('controls.regeneratingPrompts') : t('controls.regeneratePrompts')}</span>
                  </button>
                </div>
                <select
                  id="background-suggestion-select"
                  value={backgroundSuggestions[selectedNiche as keyof typeof backgroundSuggestions]?.includes(options.backgroundColor) ? options.backgroundColor : ""}
                  onChange={handleBackgroundChange}
                  disabled={disabled || isRegenerating}
                  className="w-full h-11 px-3 border border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm dark:bg-gray-900 dark:border-gray-600 dark:text-white transition-all"
                >
                  <option value="" disabled>{t('controls.selectPlaceholder')}</option>
                  {backgroundSuggestions[selectedNiche as keyof typeof backgroundSuggestions]?.map((prompt) => (
                    <option key={prompt} value={prompt}>
                      {prompt.length > 45 ? prompt.substring(0, 42) + '...' : prompt}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      )}

      <LogoUploader logo={logoFile} onLogoChange={setLogoFile} disabled={disabled} />

      <div className="space-y-3">
        <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wide">
            {t('controls.aspectRatio')}
        </label>
        <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
          {aspectRatios.map(({ labelKey, value }) => (
            <button
              key={value}
              onClick={() => handleAspectRatioClick(value)}
              disabled={disabled}
              className={`h-11 flex items-center justify-center text-xs font-bold rounded-xl transition-all duration-200 disabled:opacity-50 active:scale-95
              ${isAspectRatioActive(value) 
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/30' 
                : 'bg-gray-100 dark:bg-gray-700/70 dark:text-slate-200 hover:bg-gray-200 dark:hover:bg-gray-600'}`
              }
            >
              {labelKey === 'original' ? t('controls.aspectRatios.original') : labelKey}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
