
import { GoogleGenAI, Modality, Type } from "@google/genai";
import type { CustomizationOptions } from '../types';

const getErrorMessage = (error: unknown): string => {
  let message = "An unknown error occurred while communicating with the AI.";
  if (error instanceof Error) {
    message = error.message;
  } else if (typeof error === 'string') {
    message = error;
  }

  // Check for common error signatures in the message string
  if (message.includes('UNAUTHENTICATED') || message.includes('invalid authentication credentials') || message.includes('API key not valid')) {
    return "Authentication failed. Please ensure your API key is correctly configured and valid.";
  }
  if (message.includes('429')) {
    return "The service is currently busy. Please try again in a moment.";
  }

  // The error message itself might be a JSON string from the API
  try {
    const parsedError = JSON.parse(message);
    if (parsedError?.error?.message) {
      return `The AI service returned an error: ${parsedError.error.message}`;
    }
  } catch (e) {
    // Not a JSON string, so we'll just return the original message
  }
  
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
    aspectRatioInstruction = `CRITICAL REQUIREMENT: The final output image MUST be rendered with a strict aspect ratio of ${options.aspectRatio}. Creatively expand the background scene to fill these dimensions naturally. Do not crop, distort, or letterbox the original product. Failure to adhere to this aspect ratio is an unacceptable output.`;
  } else {
    aspectRatioInstruction = `The final output image should retain the original aspect ratio of the product photo.`;
  }
  
  let logoInstruction = '';
  if (hasLogo) {
    if (niche === 'furniture') {
      logoInstruction = `
**Brand Logo Integration (Wall Art):** A brand logo is provided (Image 2). You MUST place this logo on a wall within the generated room scene. Treat it as wall decor.
*   **Method:** Render the logo as a framed picture, a canvas print, or a wall decal.
*   **Style:** The style of the frame or print must match the room's aesthetic (e.g., minimalist frame for a Scandinavian room).
*   **Placement:** Find a natural-looking spot on a prominent wall. The logo should be clearly visible but integrated as a piece of art, not an out-of-place sticker.
*   **CRITICAL:** The logo must appear as an object *within* the room's perspective and lighting, not flatly overlaid.`;
    } else {
      logoInstruction = `
**Brand Logo Integration:** A brand logo has been provided as the second image. You MUST place this logo tastefully and subtly onto the final generated image. The logo should look naturally integrated.
*   **Placement Ideas:** Consider placing it on a product tag, as a small engraving on the product if appropriate (like on a wooden or metal part), or as a clean, semi-transparent watermark in a corner (e.g., bottom right).
*   **Goal:** The logo must be legible but discreet, clearly associating the product with the brand without overpowering the image.`;
    }
  }


  if (niche === 'restaurant' && options.restaurantMode === 'enhance') {
      if (hasAtmosphereImages) {
        let contextDescription = `
**Context:**
*   **Image 1:** The primary subject (the food dish). This is the hero element. DO NOT CHANGE IT.`;

        if (hasLogo) {
            contextDescription += `
*   **Image 2:** This is the brand logo.`;
            contextDescription += `
*   **Image 3 onwards:** These are "atmosphere" or "inspiration" photos of the restaurant's environment. Use these to construct the new background.`;
        } else {
            contextDescription += `
*   **Image 2 onwards:** These are "atmosphere" or "inspiration" photos of the restaurant's environment. Use these to construct the new background.`;
        }
        
        return `
**Absolute Primary Directive: PRESERVE THE ORIGINAL PRODUCT INTEGRITY.**

**Your task is to perfectly place the hero element from the first image into a new background. The subject itself must remain 100% IDENTICAL to the original in terms of form, pixels, and materiality.**

*   **TEXTURE & DETAIL FIDELITY:** You must maintain all fine-grained textures and subtle details of the original subject. Do not smooth, blur, or re-render the subject. If it is food, keep every grain, garnish, and sauce glisten. If it is a product, keep every stitch, grain of wood, or metallic reflection exactly as it is.
*   **ZERO ALTERATIONS:** You must not redraw, repaint, enhance, or modify the subject in any way. It is an immutable high-fidelity asset.
*   **PRESERVE INTERNAL LIGHTING:** The lighting and shadows *on the subject itself* must be preserved exactly as they appear in the original image.
*   **INTEGRATION METHOD:** Place the subject onto a plausible surface within the new background. Generate a realistic shadow cast by the subject onto the NEW background. Do NOT let the new background's lighting bleed into or wash out the subject's original textures.

${contextDescription}

**Scene Generation Instructions:**

1.  **Recreate Background from Atmosphere:**
    *   **Analyze Atmosphere:** Analyze the atmosphere photos to identify the best setting.
    *   **Recreate the Scene:** Recreate a new background scene directly inspired by the atmosphere photos. The scene must be clean and photorealistic.
2.  **Integration:**
    *   **Placement:** Place the preserved subject flawlessly into the newly created background.
    *   **Shadow Generation:** Create a soft, realistic shadow that the subject casts onto the background.

${logoInstruction}

**Technical & Aesthetic Excellence:**
*   **Aspect Ratio:** ${aspectRatioInstruction}
*   **Photorealism is Paramount:** The final result must be indistinguishable from a high-end professional photograph.
*   **Material Integrity:** The viewer should be able to clearly see the original product's specific textures (fabric, wood, metal, food texture) without any AI-generated artifacts or smoothing.
*   **Image Clarity:** Both the subject and the background must be sharp and high-resolution.

**Final Output:** A single, photorealistic, high-resolution image of the **original, untouched subject**, perfectly integrated into a background scene inspired by the provided atmosphere photos.
`;
    }
    return `
**Absolute Primary Directive: PRESERVE THE ORIGINAL PRODUCT INTEGRITY.**

**Your task is to completely regenerate the background of the provided photo while keeping the main subject (from the first image) 100% IDENTICAL to the original.**

*   **TEXTURE & DETAIL FIDELITY:** You must maintain all fine-grained textures and subtle details of the original subject. Do not apply any "AI smoothing" or "beautification" that might wash out the authentic materiality of the product. The specific weave of fabric, the grain of wood, or the crispness of a garnish must be preserved.
*   **ZERO ALTERATIONS:** Do not alter the subject's shape, appearance, colors, or textures in any way. Treat the subject as an immutable high-resolution object.
*   **PRESERVE INTERNAL LIGHTING:** The lighting and shadows *on the subject itself* must be preserved exactly as they appear in the original image.

**Scene Generation Instructions:**

1.  **Reimagine and Rebuild the Scene:**
    *   **Theme:** Rebuild a new background scene inspired by a high-end professional theme.
    *   **Composition:** Introduce subtle, professional props that complement the subject.
2.  **Masterful Lighting (for the background):**
    *   **Create Professional Lighting:** Light the newly created scene with professional-grade lighting.
    *   **Generate Realistic Soft Shadows:** Create natural, diffused soft shadows that the subject casts onto the new background.

${logoInstruction}

**Technical & Aesthetic Excellence:**
*   **Aspect Ratio:** ${aspectRatioInstruction}
*   **Photorealism is Paramount:** Indistinguishable from a professional shoot.
*   **Material Integrity:** Ensure the original subject's unique textures and sharp details are perfectly retained without any over-processing.
*   **Pristine Finish:** Seamless integration with NO visible artifacts or "glowing" edges around the subject.

**Final Output:** A single, breathtakingly realistic image of the **original, untouched subject**, flawlessly integrated into a professionally reimagined background.
`;
  }


  const basePrompt = `
**Absolute Primary Directive: PRESERVE THE ORIGINAL PRODUCT INTEGRITY.**

**Your task is to replace the background of a provided product image. The product itself must remain 100% IDENTICAL to the original in terms of form, textures, and structural details.**

*   **TEXTURE & DETAIL FIDELITY:** It is vital to preserve the specific material properties and fine-grained details of the original product (e.g., fabric weave, wood grain, metallic sheen, plastic texture, or fine labels). Do not apply any "beautification," "smoothing," or "denoising" filters to the product itself. It must retain its authentic, sharp appearance.
*   **ZERO ALTERATIONS:** You must not redraw, repaint, enhance, color-correct, resize, or modify the original product in any way. The materiality and structural integrity must remain untouched.
*   **SINGLE SUBJECT FOCUS:** The final image must contain ONLY the original product provided.
*   **PRESERVE INTERNAL LIGHTING:** Keep the lighting, shadows, and reflections *on the product itself* exactly as they appear in the original.

**Scene Generation Instructions:**

1.  **Background Replacement:** Remove the original background. Generate a new, photorealistic scene: "${options.backgroundColor}".
2.  **Shadow Generation:** Create a soft, realistic shadow cast by the original product onto the NEW background.
3.  **Aesthetic Goal:** The illusion of professional integration comes from the shadow quality and background context, NOT from altering the product pixels.

${logoInstruction}

**Technical & Aesthetic Excellence:**
*   **Aspect Ratio & Composition:** ${aspectRatioInstruction}
*   **Material Integrity:** Success is measured by the retention of the original product's specific textures and sharp details.
*   **Edge Quality:** The edges of the product must be clean and authentic, with no AI-generated blur or "blending" artifacts that muddy the product's shape.
*   **Image Quality:** Sharp, clear, and high-resolution. Both the original product and the new background must be in perfect focus.

**Final Check:** The final output must be a single, photorealistic image where the **original, untouched product** is perfectly integrated into a new scene, primarily through realistic shadow casting, while maintaining 100% of its original textural detail.
`;

  switch (niche) {
      case 'beauty':
      case 'furniture':
      case 'clothing':
          return basePrompt;
      default:
          return basePrompt;
  }
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

    const textPart = response.text;
    if (textPart && (textPart.includes("I'm not able to do that") || textPart.includes("I am not able to"))) {
      throw new Error("The AI was unable to fulfill this request due to safety or policy restrictions. Please try a different prompt or image.");
    }
    
    throw new Error(textPart || "No image was generated. The model might have refused the request.");

  } catch (error) {
    console.error("Error processing image with Gemini:", error);
    throw new Error(getErrorMessage(error));
  }
};

export const upscaleImageWithGemini = async (file: File): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const imagePart = await fileToGenerativePart(file);
        const promptPart = { text: "Upscale this image to twice its original resolution. Preserve all original textures, material details, and edge sharpness. Do not smooth or blur the product details." };

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: { parts: [imagePart, promptPart] },
        });
        
        const generatedPart = response.candidates[0].content.parts.find(p => p.inlineData);
        if (generatedPart?.inlineData?.data) {
            return `data:${generatedPart.inlineData.mimeType};base64,${generatedPart.inlineData.data}`;
        }
        
        throw new Error(response.text || "Upscaling failed.");
    } catch (error) {
        console.error("Error upscaling image:", error);
        throw new Error(getErrorMessage(error));
    }
};

export const correctColorWithGemini = async (file: File): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const imagePart = await fileToGenerativePart(file);
        const promptPart = { text: "Perform a professional color correction. Adjust white balance and contrast while strictly preserving all fine-grained textures and material details of the product. Do not smooth or over-process the image." };
        
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: { parts: [imagePart, promptPart] },
        });

        const generatedPart = response.candidates[0].content.parts.find(p => p.inlineData);
        if (generatedPart?.inlineData?.data) {
            return `data:${generatedPart.inlineData.mimeType};base64,${generatedPart.inlineData.data}`;
        }
        
        throw new Error(response.text || "Color correction failed.");
    } catch (error) {
        console.error("Error correcting color:", error);
        throw new Error(getErrorMessage(error));
    }
}

export const regenerateBackgroundPrompts = async (niche: string): Promise<string[]> => {
  try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
          You are an expert creative director specializing in product photography for e-commerce.
          Your task is to generate a list of 20 creative, specific, and appealing background scene descriptions for a product in the "${niche}" category.
          These descriptions will be used as prompts for an AI image generator.
          
          Guidelines:
          - Be descriptive: Mention lighting, textures, materials, mood, and composition.
          - Be specific: Instead of "a nice background," say "A pristine white marble pedestal against a soft-focus, pastel pink studio backdrop."
          - Be diverse: Provide a wide range of ideas, from simple studio setups to complex lifestyle scenes.
          - Focus on the background: The prompt should describe the environment where the product will be placed.
          
          Output Format:
          Return ONLY a JSON array of 20 strings. Do not include any other text, titles, or markdown formatting. The output must be a valid JSON array.
      `;
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      const text = response.text.trim();
      const jsonString = text.startsWith('```json') ? text.replace('```json', '').replace('```', '') : text;
      const prompts = JSON.parse(jsonString);
      if (Array.isArray(prompts) && prompts.every(p => typeof p === 'string')) {
          return prompts;
      }
      throw new Error("AI did not return a valid list of prompts.");
  } catch (error) {
      console.error("Error generating new prompts:", error);
      throw new Error(getErrorMessage(error));
  }
};

/**
 * Generates a video from an image and prompt using the Veo model.
 * Handles API key selection as required by the guidelines for Veo models.
 */
export const generateVideoWithGemini = async (
  imageFile: File,
  prompt: string,
  duration: number, // Note: Veo generation duration is typically fixed by the model
  onProgress: (message: string) => void
): Promise<string> => {
  try {
    // API Key Selection check for Veo models as per guidelines
    if (typeof window !== 'undefined' && (window as any).aistudio) {
      const hasKey = await (window as any).aistudio.hasSelectedApiKey();
      if (!hasKey) {
        onProgress("Please select a paid API key to use video generation...");
        await (window as any).aistudio.openSelectKey();
        // Proceeding as per guidelines: assume the key selection was successful after triggering openSelectKey()
      }
    }

    // Creating a new GoogleGenAI instance right before the call to ensure it uses the latest key
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    onProgress("Preparing image data...");
    const imagePart = await fileToGenerativePart(imageFile);
    
    onProgress("Initiating video generation operation...");
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: prompt,
      image: {
        imageBytes: imagePart.inlineData.data,
        mimeType: imagePart.inlineData.mimeType,
      },
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: '16:9'
      }
    });

    onProgress("Video is being generated by AI. This usually takes 1-3 minutes. Please wait...");
    
    // Polling the operation until completion
    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      try {
        operation = await ai.operations.getVideosOperation({ operation: operation });
      } catch (pollError: any) {
        // If the request fails with an error message containing "Requested entity was not found.",
        // reset the key selection state and prompt the user to select a key again via openSelectKey()
        if (pollError?.message?.includes("Requested entity was not found")) {
           if (typeof window !== 'undefined' && (window as any).aistudio) {
             await (window as any).aistudio.openSelectKey();
           }
           throw new Error("API key invalid or not found. Please select a valid paid API key from the dialog.");
        }
        throw pollError;
      }
    }

    if (operation.error) {
        throw new Error(operation.error.message || "Video generation failed on the server.");
    }

    onProgress("Processing complete! Fetching video bytes...");
    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) {
        throw new Error("Generation completed but no video URI was found in the response.");
    }

    // Fetch the MP4 bytes using the download link and appending the API key
    const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
    if (!videoResponse.ok) {
        throw new Error(`Failed to download generated video: ${videoResponse.statusText}`);
    }
    
    const videoBlob = await videoResponse.blob();
    onProgress("Video ready!");
    return URL.createObjectURL(videoBlob);

  } catch (error) {
    console.error("Error in generateVideoWithGemini:", error);
    throw new Error(getErrorMessage(error));
  }
};
