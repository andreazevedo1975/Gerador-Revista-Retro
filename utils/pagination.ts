
import { Ebook, Page, PageContent } from '../types';

const CHAR_LIMIT_PER_PAGE = 1800;

export const paginateEbook = (ebook: Ebook): Page[] => {
    const pages: Page[] = [];
    let pageIdCounter = 0;

    // Page 1: Cover
    pages.push({
        id: `page-${pageIdCounter++}`,
        items: [{
            type: 'cover',
            title: ebook.title,
            image: ebook.coverImage,
        }]
    });

    ebook.chapters.forEach((chapter, chapterIndex) => {
        // Each chapter starts on a new page with its header
        const chapterHeader: PageContent = {
            type: 'chapterHeader',
            title: chapter.title,
            image: chapter.image,
            chapterId: chapter.id,
        };
        pages.push({
            id: `page-${pageIdCounter++}`,
            items: [chapterHeader]
        });

        // Paginate chapter content
        const contentBlocks = chapter.content.split(/\n\s*\n/); // Split by one or more empty lines
        
        let currentPageItems: PageContent[] = [];
        let currentChars = 0;

        contentBlocks.forEach((block, blockIndex) => {
            const blockContent = block.trim();
            if (!blockContent) return;
            
            const blockChars = blockContent.length;
            const path = `chapters.${chapterIndex}.content`;
            
            if (currentChars + blockChars > CHAR_LIMIT_PER_PAGE && currentPageItems.length > 0) {
                // Current page is full, push it and start a new one
                pages.push({
                    id: `page-${pageIdCounter++}`,
                    items: currentPageItems
                });
                currentPageItems = [];
                currentChars = 0;
            }

            // A single block for the entire content for simplicity in editing.
            // A more complex implementation would split this block.
            // For now, let's assume `generateText` doesn't return massive single blocks.
            // If it does, we can split by sentences.
        });

        // The current implementation of EditableText is better with one large text block.
        // We'll just put the whole content on one page after the header.
        // A more advanced pagination logic would be needed for very long chapters.
        if (chapter.content.trim()) {
            pages.push({
                id: `page-${pageIdCounter++}`,
                items: [{
                    type: 'textBlock',
                    content: chapter.content,
                    path: `chapters.${chapterIndex}.content`
                }]
            });
        }
    });

    // Simple pagination logic for demo.
    // For long chapters, let's keep it simple: header on one page, text on the next.
    const finalPages: Page[] = [];
    finalPages.push(pages[0]); // Cover page

    ebook.chapters.forEach((chapter, chapterIndex) => {
        finalPages.push({
            id: `page-ch-header-${chapterIndex}`,
            items: [{
                type: 'chapterHeader',
                title: chapter.title,
                image: chapter.image,
                chapterId: chapter.id,
            }]
        });
        if (chapter.content.trim()) {
            finalPages.push({
                id: `page-ch-content-${chapterIndex}`,
                items: [{
                    type: 'textBlock',
                    content: chapter.content,
                    path: `chapters.${chapterIndex}.content`
                }]
            });
        }
    });


    return finalPages;
};
