export type ImageStatus = 'idle' | 'processing' | 'done' | 'error';
export type UpscaleStatus = 'idle' | 'processing' | 'done' | 'error';
export type ColorCorrectStatus = 'idle' | 'processing' | 'done' | 'error';
export type Theme = 'light' | 'dark' | 'system';

export interface ProcessedImage {
  id: string;
  file: File;
  originalSrc: string;
  processedSrc: string | null;
  status: ImageStatus;
  error: string | null;
  upscaledSrc: string | null;
  upscaleStatus: UpscaleStatus;
  upscaleError: string | null;
  colorCorrectedSrc: string | null;
  colorCorrectStatus: ColorCorrectStatus;
  colorCorrectError: string | null;
}

export interface CustomizationOptions {
  backgroundColor: string;
  aspectRatio?: string;
  restaurantMode?: 'enhance' | 'replace';
}