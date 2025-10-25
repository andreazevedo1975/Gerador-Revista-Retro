export type ImageType = 'logo' | 'gameplay' | 'artwork';
export type GenerationState = 'pending' | 'generating' | 'done' | 'error';
export type CreationType = 'console' | 'game' | 'guide' | 'developer' | 'rivalry' | 'soundtrack';

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
    title: string;
    coverImage: string; // base64 image data
    coverImagePrompt: string;
    articles: Article[];
}
