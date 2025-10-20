export type ImageType = 'logo' | 'gameplay' | 'artwork';

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

// FIX: Define and export Ebook, Chapter, Page, and PageContent types to resolve import errors.
export interface Chapter {
    id: string;
    title: string;
    content: string;
    image: string;
}

export interface Ebook {
    title: string;
    coverImage: string;
    chapters: Chapter[];
}

export type PageContent =
    | { type: 'cover'; title: string; image: string; }
    | { type: 'chapterHeader'; title: string; image: string; chapterId: string; }
    | { type: 'textBlock'; content: string; path: string; };

export interface Page {
    id: string;
    items: PageContent[];
}