import { GoogleGenAI, Modality, Type } from "@google/genai";
import type { CustomizationOptions } from '../types';

const getErrorMessage = (error: unknown): string => {
  let message = "An unknown error occurred while communicating with the AI.";
  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  }

  // Handle common key-related errors with helpful UI instructions
  const lowerMessage = message.toLowerCase();
  if (
    lowerMessage.includes('api key must be set') || 
    lowerMessage.includes('api_key') || 
    lowerMessage.includes('unauthenticated') || 
    lowerMessage.includes('invalid authentication') ||
    lowerMessage.includes('entity was not found') ||
    lowerMessage.includes('permission denied') ||
    lowerMessage.includes('does not have permission')
  ) {
    // Dispatch a global event to trigger the connection UI in App.tsx
    window.dispatchEvent(new CustomEvent('trigger-key-selection'));
    return "Google AI Studio is not connected or the key is invalid. Please link your API key using the 'Connect AI Studio' button in the top right corner.";
  }
  
  if (message.includes('429')) {
    return "The AI service is currently at capacity (Rate Limit). Please try again in a moment.";
  }

  try {
    const parsedError = JSON.parse(message);
    if (parsedError?.error?.message) {
      const innerMessage = parsedError.error.message.toLowerCase();
      if (
        innerMessage.includes('permission') || 
        innerMessage.includes('unauthenticated') ||
        innerMessage.includes('api_key')
      ) {
        window.dispatchEvent(new CustomEvent('trigger-key-selection'));
        return "Google AI Studio is not connected or the key is invalid. Please link your API key using the 'Connect AI Studio' button in the top right corner.";
      }
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
  let aspectRatioInstruction = `CRITICAL: The final output image MUST be rendered with a strict aspect ratio of 1:1 (Square).`;
  
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
The product from the uploaded image must remain 100% identical in shape, color, texture, and branding. Do not alter its physical characteristics.

**Human Presence Rule:**
If a human is included in the scene (e.g., holding the product), DO NOT show the head or face. The human should only be visible from the neck or shoulders down.

**Scene Generation:**
1. **Background:** Generate a new photorealistic scene: "${options.backgroundColor}".
2. **Lighting:** Create realistic shadows and lighting consistent with the new scene, ensuring the product looks integrated.
3. **Dimensions:** ${aspectRatioInstruction} ${logoInstruction}
4. **Multilingual Context:** Interpret all instructions and scene descriptions accurately regardless of the language used.`;
};

const getApiKey = (): string => {
  // Try platform-injected API_KEY first (for selected keys)
  let key = process.env.API_KEY;
  
  // Fallback to GEMINI_API_KEY (for free tier or pre-configured keys)
  if (!key || key === 'undefined' || key === '') {
    key = process.env.GEMINI_API_KEY;
  }
  
  // Final check for window-level process if defined
  if (!key || key === 'undefined' || key === '') {
    key = (window as any).process?.env?.API_KEY || (window as any).process?.env?.GEMINI_API_KEY;
  }

  if (!key || key === 'undefined' || key === '') {
    window.dispatchEvent(new CustomEvent('trigger-key-selection'));
    throw new Error("Google AI Studio is not connected. Please click the 'Connect AI Studio' button in the top right corner to enable high-quality generation.");
  }
  
  return key;
};

export const processImageWithGemini = async (file: File, options: CustomizationOptions, niche: string, atmosphereFiles: File[], logoFile: File | null): Promise<string> => {
  try {
    const apiKey = getApiKey();
    // Create fresh instance right before call as per selection requirements
    const ai = new GoogleGenAI({ apiKey });
    const prompt = buildPrompt(options, niche, atmosphereFiles.length > 0, !!logoFile);
    
    const parts = [
      await fileToGenerativePart(file),
      ...(logoFile ? [await fileToGenerativePart(logoFile)] : []),
      ...(await Promise.all(atmosphereFiles.map(f => fileToGenerativePart(f)))),
      { text: prompt },
    ];

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image-preview',
      contents: { parts },
      config: {
          imageConfig: { 
            aspectRatio: "1:1",
            imageSize: "1K"
          }
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
        const apiKey = getApiKey();
        const ai = new GoogleGenAI({ apiKey });
        const imagePart = await fileToGenerativePart(file);
        const response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-image-preview',
          contents: { parts: [imagePart, { text: "Upscale this image to twice its original resolution while preserving detail. Maintain the 1:1 aspect ratio." }] },
          config: {
            imageConfig: {
              aspectRatio: "1:1",
              imageSize: "1K"
            }
          }
        });
        const generatedPart = response.candidates[0].content.parts.find(p => p.inlineData);
        if (generatedPart?.inlineData?.data) return `data:${generatedPart.inlineData.mimeType};base64,${generatedPart.inlineData.data}`;
        throw new Error("Upscaling process failed.");
    } catch (error) { throw new Error(getErrorMessage(error)); }
};

export const correctColorWithGemini = async (file: File): Promise<string> => {
    try {
        const apiKey = getApiKey();
        const ai = new GoogleGenAI({ apiKey });
        const imagePart = await fileToGenerativePart(file);
        const response = await ai.models.generateContent({
          model: 'gemini-3.1-flash-image-preview',
          contents: { parts: [imagePart, { text: "Perform professional studio color correction, white balance, and contrast optimization. Maintain the 1:1 aspect ratio." }] },
          config: {
            imageConfig: {
              aspectRatio: "1:1",
              imageSize: "1K"
            }
          }
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

const buildMarketingAnglePrompt = (angleId: string): string => {
  const baseInstructions = `
**Absolute Primary Directive: PRESERVE THE ORIGINAL PRODUCT.**
The product from the uploaded image must remain 100% identical in shape, color, texture, and branding. Do not alter its physical characteristics.

**Human Presence Rule:**
If a human is included in the scene (e.g., holding the product), DO NOT show the head or face. The human should only be visible from the neck or shoulders down.

**Multilingual Context:**
Interpret all instructions and scene descriptions accurately regardless of the language used.

**Dimensions:**
CRITICAL: The final output image MUST be rendered with a strict aspect ratio of 1:1 (Square).

You are generating a specific marketing angle for this product.
`;

  switch (angleId) {
    case 'hero':
      return `${baseInstructions}
**Angle: The "Hero" (The First Impression)**
1. **Scene:** Place the product on a clean, high-resolution, pure white background (#FFFFFF).
2. **Lighting:** Use soft, professional studio lighting with a subtle floor shadow to ground the product.
3. **Composition:** Front-facing or at a slight 3/4 tilt to show depth. No other objects in the scene.
4. **Goal:** Eliminate distractions and show exactly what the customer is buying.`;
    
    case 'context':
      return `${baseInstructions}
**Angle: The "Context" (Lifestyle/In-Use)**
1. **Scene:** Show the product in its natural, premium habitat (e.g., if it's kitchenware, a sleek modern kitchen; if it's a bag, a stylish urban setting).
2. **Atmosphere:** Create a warm, aspirational "vibe" that matches the brand.
3. **Action:** Show the product being used or positioned as if ready for use.
4. **Goal:** Help the customer visualize owning the product.`;

    case 'macro':
      return `${baseInstructions}
**Angle: The "Macro" (Quality & Texture)**
1. **Scene:** An extreme close-up shot focusing on a specific high-quality detail of the product (e.g., fabric weave, wood grain, stitching, or metallic finish).
2. **Lighting:** Use dramatic lighting to highlight the tactile texture and material quality.
3. **Composition:** Shallow depth of field (blurred background) to focus entirely on the texture.
4. **Goal:** Prove quality and durability through visual evidence.`;

    case 'scale':
      return `${baseInstructions}
**Angle: The "Scale" (Size Comparison)**
1. **Scene:** Place the product next to a common, recognizable object (like a smartphone, a human hand, or a common household item) to show its true size.
2. **Composition:** A clear side-by-side comparison or showing the product being held.
3. **Goal:** Set accurate expectations and reduce return rates by showing scale.`;

    case 'instructional':
      return `${baseInstructions}
**Angle: The "Instructional" (The Infographic)**
1. **Scene:** A clean, organized shot (flat lay or 45-degree angle) with plenty of negative space.
2. **Additions:** Add subtle, professional text callouts or arrows pointing to key features (e.g., "Water-resistant", "Ergonomic design").
3. **Goal:** Highlight Unique Selling Points (USPs) quickly for skimmers.`;

    case '360':
      return `${baseInstructions}
**Angle: The "360°/Full View" (Transparency)**
1. **Scene:** Show a different side of the product that isn't visible in the main shot (e.g., the back, the bottom, or the inside lining).
2. **Composition:** Clean studio background (light gray or white).
3. **Goal:** Leave no room for doubt about what the other sides look like.`;

    case 'proof':
      return `${baseInstructions}
**Angle: The "Proof" (Social or Results)**
1. **Scene:** An authentic, slightly less-polished "User Generated Content" (UGC) style shot.
2. **Context:** Show the product being unboxed or used by a real person in a casual, everyday setting.
3. **Goal:** Build psychological social proof and trust through authenticity.`;

    default:
      return `${baseInstructions} Generate a professional marketing shot of this product.`;
  }
};

export const generateMarketingAngle = async (file: File, angleId: string): Promise<string> => {
  try {
    const apiKey = getApiKey();
    const ai = new GoogleGenAI({ apiKey });
    const prompt = buildMarketingAnglePrompt(angleId);
    const imagePart = await fileToGenerativePart(file);

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image-preview',
      contents: { parts: [imagePart, { text: prompt }] },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
          imageSize: "1K"
        }
      }
    });

    const generatedPart = response.candidates[0].content.parts.find(p => p.inlineData);
    if (generatedPart?.inlineData?.data) {
      return `data:${generatedPart.inlineData.mimeType};base64,${generatedPart.inlineData.data}`;
    }
    throw new Error("Failed to generate marketing angle.");
  } catch (error) {
    throw new Error(getErrorMessage(error));
  }
};
