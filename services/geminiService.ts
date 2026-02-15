import { GoogleGenAI, Modality, Type } from "@google/genai";
import type { CustomizationOptions } from '../types';

const getErrorMessage = (error: unknown): string => {
  let message = "An unknown error occurred while communicating with the AI.";
  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  }

  if (message.includes('429')) {
    return "The AI service is currently at capacity. Please try again in a moment.";
  }

  try {
    const parsedError = JSON.parse(message);
    if (parsedError?.error?.message) {
      return `AI Service Error: ${parsedError.error.message}`;
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
    aspectRatioInstruction = `CRITICAL: The final output image MUST be rendered with a strict aspect ratio of ${options.aspectRatio}. Expand the scene naturally to fill these dimensions.`;
  } else {
    aspectRatioInstruction = `The final output image should retain the original aspect ratio.`;
  }
  
  let logoInstruction = '';
  if (hasLogo) {
    if (niche === 'furniture') {
      logoInstruction = `
**Brand Integration:** Place the provided logo (Image 2) naturally within the room scene (e.g., as framed wall art).`;
    } else {
      logoInstruction = `
**Brand Integration:** Integrate the brand logo provided as the second image naturally onto the product or setting.`;
    }
  }

  return `
**Absolute Primary Directive: PRESERVE THE ORIGINAL PRODUCT.**
Replace the background of the product image. The product must remain 100% identical.
1. **Background:** Generate a new photorealistic scene: "${options.backgroundColor}".
2. **Lighting:** Create realistic shadows and lighting consistent with the new scene.
3. **Dimensions:** ${aspectRatioInstruction} ${logoInstruction}`;
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
    throw new Error(response.text || "No image content returned from the model.");
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
          contents: { parts: [imagePart, { text: "Upscale this image to twice its original resolution while preserving detail." }] },
        });
        const generatedPart = response.candidates[0].content.parts.find(p => p.inlineData);
        if (generatedPart?.inlineData?.data) return `data:${generatedPart.inlineData.mimeType};base64,${generatedPart.inlineData.data}`;
        throw new Error("Upscaling process failed.");
    } catch (error) { throw new Error(getErrorMessage(error)); }
};

export const correctColorWithGemini = async (file: File): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const imagePart = await fileToGenerativePart(file);
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: { parts: [imagePart, { text: "Perform professional studio color correction, white balance, and contrast optimization." }] },
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
        contents: `Generate 20 creative and cinematic background scene prompts for "${niche}" product photography. Format as a simple JSON array of strings.`,
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
    
    onProgress("Preparing visual assets...");
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

    onProgress("Synthesizing cinematic video...");
    
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 8000));
      operation = await ai.operations.getVideosOperation({ operation: operation });
    }

    if (operation.error) throw new Error(operation.error.message);

    onProgress("Finalizing download...");
    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    const videoBlob = await videoResponse.blob();
    return URL.createObjectURL(videoBlob);
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};