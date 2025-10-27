import { GoogleGenAI, Type } from "@google/genai";
import { MagazineStructure, ImageType } from '../types';

// Helper function for delays
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

/**
 * A wrapper function to retry an async operation if it fails due to a rate limit or quota error.
 * Uses exponential backoff for delays.
 * @param fn The async function to execute.
 * @param retries Number of retries.
 * @param initialDelay Initial delay in ms.
 * @returns The result of the async function.
 */
async function withRetry<T>(fn: () => Promise<T>, retries = 3, initialDelay = 2000): Promise<T> {
    let lastError: any;
    for (let i = 0; i < retries; i++) {
        try {
            return await fn();
        } catch (error: any) {
            lastError = error;
            // Check if the error message indicates a rate limit or quota issue
            const errorMessage = (error.message || error.toString()).toLowerCase();
            if (errorMessage.includes('429') || errorMessage.includes('resource_exhausted') || errorMessage.includes('quota')) {
                const delayTime = initialDelay * Math.pow(2, i);
                console.warn(`Rate limit or quota error detected. Retrying in ${delayTime}ms... (Attempt ${i + 1}/${retries})`);
                await delay(delayTime);
            } else {
                // Not a retryable error, throw immediately.
                throw error;
            }
        }
    }
    console.error("Operation failed after multiple retries.", lastError);
    throw lastError;
}


const structureSchema = {
    type: Type.OBJECT,
    properties: {
        title: {
            type: Type.STRING,
            description: "Um título de capa chamativo e criativo para uma revista de jogos retrô, em português do Brasil. Deve ter a ver com o tópico principal.",
        },
        coverImagePrompt: {
            type: Type.STRING,
            description: "Um prompt em inglês, altamente detalhado para gerar a capa da revista. O estilo deve ser 'vibrant 16-bit pixel art' ou '90s anime/manga box art'. O prompt deve descrever uma cena de ação dinâmica e cinematográfica com iluminação dramática. Ex: 'Vibrant and detailed 16-bit pixel art, cover of a 90s game magazine, a heroic knight in golden armor clashing swords with a massive fire dragon in a dark castle, sparks flying, dramatic lighting, epic cinematic angle'.",
        },
        articles: {
            type: Type.ARRAY,
            description: "Um array de exatamente 5 artigos para a revista.",
            items: {
                type: Type.OBJECT,
                properties: {
                    title: {
                        type: Type.STRING,
                        description: "O título do artigo, em português do Brasil."
                    },
                    contentPrompt: {
                        type: Type.STRING,
                        description: "Um prompt para a IA gerar o conteúdo textual completo para este artigo, em português do Brasil. O conteúdo deve ser informativo e divertido, como em uma revista de games dos anos 90, e formatado usando Markdown simples: '###' para subtítulos, '*palavra*' para itálico."
                    },
                    imagePrompts: {
                        type: Type.ARRAY,
                        description: "Um array com exatamente 3 prompts de imagem em inglês para o artigo, um para cada tipo: 'logo', 'gameplay' e 'artwork'.",
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                type: {
                                    type: Type.STRING,
                                    enum: ['logo', 'gameplay', 'artwork'],
                                    description: "O tipo de imagem a ser gerada."
                                },
                                prompt: {
                                    type: Type.STRING,
                                    description: "O prompt detalhado em inglês para gerar a imagem. Para 'logo': 'a stylized 16-bit pixel art logo for the game...'. Para 'gameplay': 'a detailed 16-bit pixel art screenshot of an iconic moment from the game...'. Para 'artwork': '16-bit pixel art inspired by the game's official box art or promotional material...'."
                                }
                            },
                            required: ["type", "prompt"],
                        }
                    },
                    tipsPrompt: {
                        type: Type.STRING,
                        description: "Um prompt para a IA gerar uma seção 'Dicas e Macetes' para o artigo, em português do Brasil. Deve ser uma lista de 2 a 4 dicas úteis, segredos ou curiosidades sobre o jogo. Formate a saída como uma lista de marcadores Markdown (ex: '- Dica 1...')."
                    },
                },
                required: ["title", "contentPrompt", "imagePrompts", "tipsPrompt"],
            }
        }
    },
    required: ["title", "coverImagePrompt", "articles"],
};

export async function generateMagazineStructure(idea: string, isDeepMode: boolean, magazineName?: string): Promise<MagazineStructure> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const modelName = isDeepMode ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
    const magazineNameToUse = magazineName || "Retrô Gamer AI";

    let prompt = `
        Você é um editor de uma revista de videogames retrô dos anos 90 chamada "${magazineNameToUse}".
        Crie a estrutura para uma nova edição da revista com base na seguinte pauta: "${idea}".
        A revista deve ter um tom divertido, informativo e nostálgico e conter exatamente 5 artigos.
        Para a capa, crie um prompt de imagem em inglês que seja extremamente detalhado e evocativo. O objetivo é gerar uma arte de capa espetacular no estilo das revistas de videogame dos anos 90. Instrua a IA de imagem a usar um estilo 'vibrant 16-bit pixel art' ou '90s Japanese box art'. O prompt deve focar em uma cena de ação dinâmica, com composição cinematográfica, iluminação dramática e cores vibrantes, capturando a essência do tópico principal.
        Para cada artigo, forneça um título, um prompt para gerar seu conteúdo, um prompt para uma seção de 'Dicas e Macetes', e um array com exatamente 3 prompts de imagem em inglês.

        As imagens devem ser relevantes para o artigo.
        - Se o artigo for sobre um JOGO específico, os tipos de imagem devem ser 'logo', 'gameplay' e 'artwork'.
        - Se o artigo for sobre um CONSOLE específico (como SNES, Mega Drive, NES, Master System), um dos prompts de imagem, do tipo 'artwork', deve ser para gerar uma imagem do hardware do console em pixel art. Os outros dois prompts podem ser de 'gameplay' de jogos icônicos para aquele console.
        - Para outros tópicos (como um gênero de jogo ou um desenvolvedor), use a criatividade para definir prompts de imagem relevantes que se encaixem nos tipos 'logo', 'gameplay' e 'artwork'.

        Exemplos de prompts de imagem:
        1.  'logo': "a stylized 16-bit pixel art logo for the game..."
        2.  'gameplay': "a detailed 16-bit pixel art screenshot of an iconic moment from the game..."
        3.  'artwork': "16-bit pixel art inspired by the game's official box art or promotional material..." OU "a detailed 16-bit pixel art illustration of the Super Nintendo (SNES) console on a table".
        
        O resultado deve ser um objeto JSON bem formatado.
    `;

    if (isDeepMode) {
        prompt += `\nMODO PROFUNDO ATIVADO: A pauta deve ser abordada com profundidade máxima, oferecendo insights únicos e uma análise crítica e detalhada. O nível de escrita deve ser profissional e aprofundado, e os prompts gerados devem refletir essa complexidade.`;
    }

    return withRetry(async () => {
        const response = await ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: structureSchema,
            },
        });

        const jsonText = response.text.trim();
        try {
            const parsed = JSON.parse(jsonText);
            // Ensure imagePrompts exist and have 3 items
            parsed.articles.forEach((article: any) => {
                if (!article.imagePrompts || article.imagePrompts.length !== 3) {
                    throw new Error("Validation failed: Each article must have exactly 3 image prompts.");
                }
            });
            return parsed as MagazineStructure;
        } catch (e) {
            console.error("Failed to parse or validate JSON from Gemini:", jsonText, e);
            throw new Error("A resposta da IA não estava no formato JSON esperado ou falhou na validação.");
        }
    });
}

export async function generateText(prompt: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    return withRetry(async () => {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction: "Você é um jornalista de uma revista de games dos anos 90. Sua escrita é empolgante, cheia de gírias da época e muito informativa. Você formata o texto usando Markdown simples."
            }
        });
        return response.text;
    });
}

const getAspectRatioForType = (type: ImageType): '3:4' | '16:9' => {
    switch (type) {
        case 'artwork':
            return '3:4'; // Box art style
        case 'logo':
        case 'gameplay':
            return '16:9'; // Widescreen for logos and gameplay
        default:
            return '16:9';
    }
};

interface GenerateImageOptions {
    prompt: string;
    type: ImageType | 'cover';
    quality?: 'standard' | 'high';
    modificationPrompt?: string;
    isRegeneration?: boolean;
}

export async function generateImage({
    prompt,
    type,
    quality = 'standard',
    modificationPrompt = '',
    isRegeneration = false,
}: GenerateImageOptions): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    return withRetry(async () => {
        const aspectRatio = type === 'cover' ? '3:4' : getAspectRatioForType(type as ImageType);
        
        let finalPrompt = prompt;
        
        if (isRegeneration) {
            if (modificationPrompt.trim()) {
                finalPrompt = `Based on the idea "${prompt}", generate a new 16-bit pixel art image with the following modification: "${modificationPrompt}". Maintain the original style.`;
            } else {
                finalPrompt = `Generate a new creative variation of this 16-bit pixel art image concept: "${prompt}".`;
            }
        }
        
        if (quality === 'high') {
            finalPrompt += ", masterpiece, ultra detailed, high fidelity pixel art, best quality, cinematic lighting";
        }
        
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: finalPrompt,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/jpeg',
              aspectRatio: aspectRatio,
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
            return `data:image/jpeg;base64,${base64ImageBytes}`;
        }
        throw new Error("A geração de imagem falhou ou não retornou imagens.");
    });
}

export async function generateLogo(prompt: string): Promise<string> {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    return withRetry(async () => {
        const finalPrompt = `A stylized 16-bit pixel art logo, clean background, vector style, vibrant colors. Concept: "${prompt}"`;

        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: finalPrompt,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/jpeg',
              aspectRatio: '1:1',
            },
        });

        if (response.generatedImages && response.generatedImages.length > 0) {
            const base64ImageBytes: string = response.generatedImages[0].image.imageBytes;
            return `data:image/jpeg;base64,${base64ImageBytes}`;
        }
        throw new Error("A geração de logo falhou ou não retornou imagens.");
    });
}