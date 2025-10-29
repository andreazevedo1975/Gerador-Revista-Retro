export type ImageType = 'logo' | 'gameplay' | 'artwork';
export type GenerationState = 'pending' | 'generating' | 'done' | 'error';
export type CreationType = 'console' | 'game' | 'guide' | 'developer' | 'rivalry' | 'soundtrack' | 'cover_choice' | 'editorial_concept';

export interface VisualIdentity {
    magazineName: string;
    logoUrl: string; // base64 image data
}

export interface ArticleImagePrompt {
    type: ImageType;
    prompt: string;
}

export interface ArticleStructure {
    title: string;
    contentPrompt: string;
    imagePrompts: ArticleImagePrompt[];
    tipsPrompt: string;
}

export interface MagazineStructure {
    title: string;
    coverImagePrompt: string;
    articles: ArticleStructure[];
}

export interface ArticleImage {
    id: string;
    type: ImageType;
    prompt: string;
    url: string; // base64 image data
}

export interface Article extends Omit<ArticleStructure, 'imagePrompts' | 'tipsPrompt'> {
    id: string;
    content: string; // Markdown content
    images: ArticleImage[];
    tips: string;
}

export interface Magazine {
    id: string;
    title: string;
    logoUrl?: string;
    coverImage: string; // base64 image data
    coverImagePrompt: string;
    articles: Article[];
}

export interface MagazineHistoryEntry {
    timestamp: number;
    magazine: Magazine;
}

// Tipos para o novo Gerador de Conceito Editorial
export type EditorialStyle = 'Magazine' | 'Jornal' | 'Quadrinhos' | 'Mangá' | 'Livro' | 'Zine';

export interface EditorialConceptInputs {
    publicationTitle: string;
    mainTheme: string;
    targetAudience: string;
    editorialStyles: EditorialStyle[];
    visualHighlight: string;
    dominantColor: string;
}

export interface EditorialConceptData {
    technicalSheet: {
        proposedName: string;
        editorialFocus: string;
        referenceFormat: string;
        keyAudience: string;
    };
    coverConcept: {
        description: string;
        headline: string;
        supportingText: string;
    };
    internalLayout: {
        description: string;
    };
    imageGenerationPrompt: string;
}

export interface FinalMagazineDraft {
    identity?: VisualIdentity;
    editorialConcept?: EditorialConceptData;
    magazine?: Magazine;
}
