import { GoogleGenAI, Modality, Type } from "@google/genai";
import type { CustomizationOptions } from '../types';

const getErrorMessage = (error: unknown): string => {
  let message = "An unknown error occurred while communicating with the AI.";
  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  }

  if (message.includes('UNAUTHENTICATED') || message.includes('invalid authentication credentials') || message.includes('API key not valid')) {
    return "Authentication failed. Please ensure your API key is correctly configured and valid.";
  }
  if (message.includes('429')) {
    return "The service is currently busy. Please try again in a moment.";
  }

  try {
    const parsedError = JSON.parse(message);
    if (parsedError?.error?.message) {
      return `The AI service returned an error: ${parsedError.error.message}`;
    }
  } catch (e) {}
  
  return message;
};

const fileToGenerativePart = async (file: File) => {
  const base64EncodedDataPromise = new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result.split(',')[1]);
      } else {
        resolve('');
      }
    };
    reader.readAsDataURL(file);
  });
  const base64Data = await base64EncodedDataPromise;
  return {
    inlineData: {
      data: base64Data,
      mimeType: file.type,
    },
  };
};

const buildPrompt = (options: CustomizationOptions, niche: string, hasAtmosphereImages: boolean, hasLogo: boolean): string => {
  let aspectRatioInstruction: string;
  if (options.aspectRatio && options.aspectRatio !== 'Original') {
    aspectRatioInstruction = `CRITICAL REQUIREMENT: The final output image MUST be rendered with a strict aspect ratio of ${options.aspectRatio}. Creatively expand the background scene to fill these dimensions naturally. Do not crop, distort, or letterbox the original product.`;
  } else {
    aspectRatioInstruction = `The final output image should retain the original aspect ratio of the product photo.`;
  }
  
  let logoInstruction = '';
  if (hasLogo) {
    if (niche === 'furniture') {
      logoInstruction = `
**Brand Logo Integration (Wall Art):** A brand logo is provided (Image 2). You MUST place this logo on a wall within the generated room scene as wall decor (framed or canvas).`;
    } else {
      logoInstruction = `
**Brand Logo Integration:** A brand logo has been provided as the second image. Place this logo naturally (e.g., on a tag or as a subtle watermark).`;
    }
  }

  const basePrompt = `
**Absolute Primary Directive: PRESERVE THE ORIGINAL PRODUCT INTEGRITY.**
Your task is to replace the background of a provided product image. The product itself must remain 100% IDENTICAL to the original.
1. **Background Replacement:** Remove original background. Generate new scene: "${options.backgroundColor}".
2. **Shadow Generation:** Create a soft, realistic shadow cast by the product onto the NEW background.
**Technical:** Aspect ratio: ${aspectRatioInstruction}. ${logoInstruction}`;

  return basePrompt;
};

export const processImageWithGemini = async (file: File, options: CustomizationOptions, niche: string, atmosphereFiles: File[], logoFile: File | null): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = buildPrompt(options, niche, atmosphereFiles.length > 0, !!logoFile);
    
    const parts = [
      await fileToGenerativePart(file),
      ...(logoFile ? [await fileToGenerativePart(logoFile)] : []),
      ...(await Promise.all(atmosphereFiles.map(f => fileToGenerativePart(f)))),
      { text: prompt },
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts },
      config: {
          imageConfig: options.aspectRatio && options.aspectRatio !== 'Original' 
            ? { aspectRatio: options.aspectRatio as any } 
            : undefined
      },
    });

    const imagePart = response.candidates[0].content.parts.find(p => p.inlineData);
    if (imagePart?.inlineData?.data) {
        return `data:${imagePart.inlineData.mimeType};base64,${imagePart.inlineData.data}`;
    }
    throw new Error(response.text || "No image was generated.");
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};

export const upscaleImageWithGemini = async (file: File): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const imagePart = await fileToGenerativePart(file);
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: { parts: [imagePart, { text: "Upscale this image to twice its resolution." }] },
        });
        const generatedPart = response.candidates[0].content.parts.find(p => p.inlineData);
        if (generatedPart?.inlineData?.data) return `data:${generatedPart.inlineData.mimeType};base64,${generatedPart.inlineData.data}`;
        throw new Error("Upscaling failed.");
    } catch (error) { throw new Error(getErrorMessage(error)); }
};

export const correctColorWithGemini = async (file: File): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const imagePart = await fileToGenerativePart(file);
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: { parts: [imagePart, { text: "Perform professional color correction." }] },
        });
        const generatedPart = response.candidates[0].content.parts.find(p => p.inlineData);
        if (generatedPart?.inlineData?.data) return `data:${generatedPart.inlineData.mimeType};base64,${generatedPart.inlineData.data}`;
        throw new Error("Color correction failed.");
    } catch (error) { throw new Error(getErrorMessage(error)); }
}

export const regenerateBackgroundPrompts = async (niche: string): Promise<string[]> => {
  try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Generate a JSON array of 20 background scene descriptions for "${niche}" e-commerce photography.`,
      });
      const text = response.text.trim();
      const jsonString = text.startsWith('```json') ? text.replace('```json', '').replace('```', '') : text;
      return JSON.parse(jsonString);
  } catch (error) { throw new Error(getErrorMessage(error)); }
};

export const generateVideoWithGemini = async (
  imageFile: File,
  prompt: string,
  duration: number,
  onProgress: (message: string) => void
): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    onProgress("Preparing image...");
    const imagePart = await fileToGenerativePart(imageFile);
    
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      image: {
        imageBytes: imagePart.inlineData.data,
        mimeType: imagePart.inlineData.mimeType,
      },
      config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '16:9' }
    });

    onProgress("Generating video (this may take a few minutes)...");
    
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    if (operation.error) throw new Error(operation.error.message);

    onProgress("Downloading video...");
    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const videoBlob = await videoResponse.blob();
    return URL.createObjectURL(videoBlob);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};