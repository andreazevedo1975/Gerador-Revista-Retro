import React from 'react';
import { Page, PageContent } from '../types';
import EditableText from './EditableText';
import RegenerateImageButton from './RegenerateImageButton';

interface EbookPageProps {
    page: Page;
    pageNum: number;
    totalPages: number;
    onTextUpdate: (path: string, newText: string) => void;
    onImageRegenerate: (path: string) => void;
    isGeneratingImage: Record<string, boolean>;
}

const renderMarkdown = (markdown: string) => {
    // A simple markdown to JSX converter
    return markdown.split('\n').map((line, index) => {
        if (line.startsWith('### ')) {
            return <h3 key={index} className="text-xl font-semibold mt-4 mb-2">{line.substring(4)}</h3>;
        }
        if (line.trim() === '') {
            return null; // Don't render empty lines as paragraphs
        }
        // Handle italics with *word*
        const parts = line.split(/(\*.*?\*)/g);
        return (
            <p key={index} className="mb-4 text-gray-700 leading-relaxed">
                {parts.map((part, i) =>
                    part.startsWith('*') && part.endsWith('*') ? (
                        <em key={i}>{part.slice(1, -1)}</em>
                    ) : (
                        part
                    )
                )}
            </p>
        );
    }).filter(Boolean); // Filter out nulls
};

// FIX: Define a props interface for PageContentRenderer with specific function types.
interface PageContentRendererProps {
    item: PageContent;
    onTextUpdate: (path: string, newText: string) => void;
    onImageRegenerate: (path: string) => void;
    isGeneratingImage: Record<string, boolean>;
}

const PageContentRenderer: React.FC<PageContentRendererProps> = ({ item, onTextUpdate, onImageRegenerate, isGeneratingImage }) => {
    switch (item.type) {
        case 'cover':
            return (
                <div className="flex flex-col h-full">
                    <div className="relative w-full h-3/5 group">
                        <img src={item.image} alt="Capa do E-book" className="w-full h-full object-cover" />
                         <RegenerateImageButton 
                            imageId="coverImage" 
                            onRegenerate={onImageRegenerate}
                            isLoading={!!isGeneratingImage['coverImage']}
                         />
                    </div>
                    <div className="flex-grow flex items-center justify-center p-8">
                         <EditableText
                            tag="h1"
                            text={item.title}
                            onSave={(newText: string) => onTextUpdate('title', newText)}
                            className="text-4xl font-bold text-center text-gray-800"
                        />
                    </div>
                </div>
            );
        case 'chapterHeader':
            const chapterPath = `chapters.${item.chapterId.split('-')[1]}`;
            // FIX: Correctly pass props to RegenerateImageButton.
            // The imageId should be the path used by the handler, and the handler is passed directly.
            const imageRegenPath = `chapters-${item.chapterId.split('-')[1]}`;
            return (
                <div className="flex flex-col space-y-6">
                    <div className="relative w-full aspect-[4/3] group">
                        <img src={item.image} alt={`Ilustração para ${item.title}`} className="w-full h-full object-cover" />
                        <RegenerateImageButton 
                            imageId={imageRegenPath}
                            onRegenerate={onImageRegenerate}
                            isLoading={!!isGeneratingImage[imageRegenPath]}
                        />
                    </div>
                    <EditableText
                        tag="h2"
                        text={item.title}
                        onSave={(newText: string) => onTextUpdate(`${chapterPath}.title`, newText)}
                        className="text-3xl font-bold text-gray-800 pt-4 border-t border-gray-200"
                    />
                </div>
            );
        case 'textBlock':
            return (
                <EditableText
                    tag="div"
                    text={item.content}
                    onSave={(newText: string) => onTextUpdate(item.path, newText)}
                    className="text-base"
                    renderFunction={renderMarkdown}
                    isTextArea
                />
            );
        default:
            return null;
    }
};

const EbookPage: React.FC<EbookPageProps> = ({ page, pageNum, totalPages, onTextUpdate, onImageRegenerate, isGeneratingImage }) => {
    return (
        <div className="w-[210mm] h-[297mm] bg-white shadow-lg rounded-sm p-12 flex flex-col ebook-page-render relative">
            <div className="flex-grow">
                {page.items.map((item, index) => (
                    <PageContentRenderer 
                        key={index} 
                        item={item} 
                        onTextUpdate={onTextUpdate}
                        onImageRegenerate={onImageRegenerate}
                        isGeneratingImage={isGeneratingImage}
                    />
                ))}
            </div>
            <div className="text-center text-sm text-gray-400 mt-auto pt-4">
                {pageNum} / {totalPages}
            </div>
        </div>
    );
};

export default EbookPage;
