
import React, { useState } from 'react';
import { Magazine, Article, ArticleImage } from '../types';
import EditableText from './EditableText';
import RegenerateImageButton from './RegenerateImageButton';
import Comments from './Comments';
import ReadingMode from './ReadingMode'; // Import the new component

interface MagazineViewerProps {
    magazine: Magazine;
    onTextUpdate: (path: string, newText: string) => void;
    onImageRegenerate: (path: string) => void;
    isGeneratingImage: Record<string, boolean>;
}

declare const jspdf: any;

const renderMarkdown = (markdown: string) => {
    const lines = markdown.split('\n');
    const elements: React.ReactNode[] = [];
    let listItems: string[] = [];
    let currentListType: 'ul' | 'ol' | null = null;

    const renderLine = (line: string): React.ReactNode[] => {
        const parts = line.split(/(\*.*?\*)/g);
        return parts.map((part, i) =>
            part.startsWith('*') && part.endsWith('*') ? (
                <em key={i} className="text-yellow-400 not-italic">{part.slice(1, -1)}</em>
            ) : (
                part
            )
        );
    };

    const flushList = () => {
        if (listItems.length > 0 && currentListType) {
            const ListTag = currentListType === 'ol' ? 'ol' : 'ul';
            const listStyle = currentListType === 'ol' ? 'list-decimal' : 'list-disc';
            elements.push(
                <ListTag key={`list-${elements.length}`} className={`${listStyle} list-inside space-y-2 mb-4 pl-4 text-gray-300 leading-loose`}>
                    {listItems.map((item, i) => <li key={i}>{renderLine(item)}</li>)}
                </ListTag>
            );
            listItems = [];
            currentListType = null;
        }
    };

    lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        const isUnorderedItem = trimmedLine.startsWith('- ');
        const isOrderedItem = /^\d+\.\s/.test(trimmedLine);

        if (line.startsWith('### ')) {
            flushList();
            elements.push(<h3 key={index} className="text-2xl font-bold mt-6 mb-3 text-cyan-400 font-display">{line.substring(4)}</h3>);
        } else if (isUnorderedItem) {
            if (currentListType === 'ol') {
                flushList();
            }
            currentListType = 'ul';
            listItems.push(trimmedLine.substring(2).trim());
        } else if (isOrderedItem) {
            if (currentListType === 'ul') {
                flushList();
            }
            currentListType = 'ol';
            listItems.push(trimmedLine.substring(trimmedLine.indexOf(' ') + 1).trim());
        } else {
            flushList();
            if (trimmedLine !== '') {
                elements.push(<p key={index} className="mb-4 text-gray-300 leading-loose">{renderLine(line)}</p>);
            }
        }
    });

    flushList();
    return elements;
};


const ImageGallery: React.FC<{
    images: ArticleImage[];
    onRegenerate: (path: string) => void;
    isGeneratingImage: Record<string, boolean>;
}> = ({ images, onRegenerate, isGeneratingImage }) => {
    const gameplay = images.find(img => img.type === 'gameplay');
    const others = images.filter(img => img.type !== 'gameplay');

    const ImageBox: React.FC<{image: ArticleImage}> = ({ image }) => (
        <div className="relative w-full h-full group border-2 border-cyan-500 shadow-lg shadow-cyan-500/20">
            <img src={image.url} alt={`Ilustração do tipo ${image.type}`} className="w-full h-full object-cover" />
            <RegenerateImageButton 
                imageId={image.id}
                onRegenerate={onRegenerate}
                isLoading={!!isGeneratingImage[image.id]}
            />
        </div>
    );

    return (
        <div className="grid grid-cols-2 grid-rows-2 gap-4 mb-6">
            <div className="col-span-2 row-span-1">
                {gameplay && <ImageBox image={gameplay} />}
            </div>
            {others.map(img => (
                <div key={img.id} className="col-span-1 row-span-1">
                    <ImageBox image={img} />
                </div>
            ))}
        </div>
    );
};

const DownloadIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
);


const MagazineViewer: React.FC<MagazineViewerProps> = ({ magazine, onTextUpdate, onImageRegenerate, isGeneratingImage }) => {
    const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
    const [readingArticle, setReadingArticle] = useState<Article | null>(null);
    
    const handleDownloadPdf = async () => {
        setIsDownloadingPdf(true);
        try {
            const { jsPDF } = jspdf;
            const doc = new jsPDF('p', 'pt', 'a4');

            const pageHeight = doc.internal.pageSize.getHeight();
            const pageWidth = doc.internal.pageSize.getWidth();
            const margin = 40;
            const contentWidth = pageWidth - margin * 2;
            
            // Helper to add base64 images to the PDF
            const addImageFromBase64 = (base64: string, x: number, y: number, width: number, height: number): Promise<void> => {
                return new Promise((resolve) => {
                    const img = new Image();
                    img.onload = () => {
                        const format = base64.split(';')[0].split('/')[1].toUpperCase();
                        doc.addImage(img, format, x, y, width, height);
                        resolve();
                    };
                    img.src = base64;
                });
            };

            // --- Page 1: Cover ---
            await addImageFromBase64(magazine.coverImage, 0, 0, pageWidth, pageHeight * 0.8);
            
            doc.setFontSize(28);
            doc.setFont('helvetica', 'bold');
            const titleLines = doc.splitTextToSize(magazine.title, contentWidth);
            doc.text(titleLines, pageWidth / 2, pageHeight * 0.8 + 40, { align: 'center' });

            // --- Smart Markdown Renderer ---
            // This function renders markdown and handles page breaks intelligently
            const renderContent = (markdown: string, startY: number): number => {
                let cursorY = startY;
                const lines = markdown.split('\n');

                const addPageIfNeeded = (requiredHeight: number) => {
                    if (cursorY + requiredHeight > pageHeight - margin) {
                        doc.addPage();
                        cursorY = margin;
                        return true;
                    }
                    return false;
                };

                for (const line of lines) {
                    if (line.trim() === '') continue;

                    let isSubtitle = line.startsWith('### ');
                    let isListItem = line.trim().startsWith('- ') || /^\d+\.\s/.test(line.trim());
                    let lineContent = line;

                    // Clean up markdown syntax for PDF
                    if (isSubtitle) lineContent = line.substring(4);
                    else if (line.trim().startsWith('- ')) lineContent = '• ' + line.trim().substring(2);
                    else if (/^\d+\.\s/.test(line.trim())) lineContent = '  ' + line.trim(); // Indent ordered lists
                    lineContent = lineContent.replace(/\*(.*?)\*/g, '$1');

                    // --- Logic for Subtitles ---
                    if (isSubtitle) {
                        doc.setFontSize(14);
                        doc.setFont('helvetica', 'bold');
                        const splitLines = doc.splitTextToSize(lineContent, contentWidth);
                        const textHeight = doc.getTextDimensions(splitLines).h;
                        
                        // Avoid orphan subtitles: check for space for subtitle + one line of text
                        addPageIfNeeded(textHeight + 20);
                        cursorY += 10;
                        doc.text(splitLines, margin, cursorY);
                        cursorY += textHeight + 5;
                        continue;
                    }
                    
                    // --- Logic for Paragraphs & Lists ---
                    doc.setFontSize(10);
                    doc.setFont('helvetica', 'normal');
                    const xPos = isListItem ? margin + 10 : margin;
                    const effectiveWidth = contentWidth - (isListItem ? 10 : 0);
                    const splitLines = doc.splitTextToSize(lineContent, effectiveWidth);

                    for (const splitLine of splitLines) {
                        const lineHeight = 12; // Approx height for 10pt font
                        addPageIfNeeded(lineHeight);
                        doc.text(splitLine, xPos, cursorY);
                        cursorY += lineHeight;
                    }
                    if (!isListItem) cursorY += 4; // Add a small gap after paragraphs
                }
                return cursorY;
            };


            // --- Render Articles ---
            for (const article of magazine.articles) {
                doc.addPage();
                let cursorY = margin;

                // --- Article Title ---
                doc.setFontSize(20);
                doc.setFont('helvetica', 'bold');
                const articleTitleLines = doc.splitTextToSize(article.title, contentWidth);
                const titleHeight = doc.getTextDimensions(articleTitleLines).h;
                doc.text(articleTitleLines, margin, cursorY);
                cursorY += titleHeight + 20;

                // --- Gameplay Image ---
                const gameplayImg = article.images.find(img => img.type === 'gameplay');
                if (gameplayImg) {
                    const imgHeight = contentWidth * (9 / 16);
                    if (cursorY + imgHeight > pageHeight - margin) {
                        doc.addPage();
                        cursorY = margin;
                    }
                    await addImageFromBase64(gameplayImg.url, margin, cursorY, contentWidth, imgHeight);
                    cursorY += imgHeight + 20;
                }
                
                // --- Article Content ---
                cursorY = renderContent(article.content, cursorY);

                // --- Tips Section Header ---
                const tipsTitle = 'Dicas e Macetes';
                doc.setFontSize(16);
                doc.setFont('helvetica', 'bold');
                const tipsTitleHeight = doc.getTextDimensions(tipsTitle).h;
                // Check if there's enough room for the header and some content
                if (cursorY + tipsTitleHeight + 24 > pageHeight - margin) {
                    doc.addPage();
                    cursorY = margin;
                }
                cursorY += 20; // Space before tips section
                doc.text(tipsTitle, margin, cursorY);
                cursorY += tipsTitleHeight + 10;

                // --- Tips Content ---
                cursorY = renderContent(article.tips, cursorY);
            }

            doc.save(`${magazine.title.replace(/\s+/g, '_')}.pdf`);
        } catch (error) {
            console.error("Erro ao gerar PDF:", error);
        } finally {
            setIsDownloadingPdf(false);
        }
    };

    const handleDownloadArticle = (article: Article) => {
        const markdownToHtml = (markdown: string): string => {
            const lines = markdown.split('\n');
            let html = '';
            let currentListType: 'ul' | 'ol' | null = null;
    
            const processLine = (line: string) => line.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
            const flushList = () => {
                if (currentListType) {
                    html += `</${currentListType}>`;
                    currentListType = null;
                }
            };
    
            lines.forEach(line => {
                const trimmedLine = line.trim();
                const isUnorderedItem = trimmedLine.startsWith('- ');
                const isOrderedItem = /^\d+\.\s/.test(trimmedLine);
    
                if (trimmedLine.startsWith('### ')) {
                    flushList();
                    html += `<h3>${processLine(trimmedLine.substring(4))}</h3>`;
                } else if (isUnorderedItem) {
                    if (currentListType === 'ol') flushList();
                    if (!currentListType) {
                        html += '<ul>';
                        currentListType = 'ul';
                    }
                    html += `<li>${processLine(trimmedLine.substring(2).trim())}</li>`;
                } else if (isOrderedItem) {
                    if (currentListType === 'ul') flushList();
                    if (!currentListType) {
                        html += '<ol>';
                        currentListType = 'ol';
                    }
                    html += `<li>${processLine(trimmedLine.substring(trimmedLine.indexOf(' ') + 1).trim())}</li>`;
                } else {
                    flushList();
                    if (trimmedLine !== '') {
                        html += `<p>${processLine(trimmedLine)}</p>`;
                    }
                }
            });
    
            flushList();
            return html;
        };

        const imagesHtml = article.images.map(img => 
            `<div style="margin-bottom: 1rem;">
                <img src="${img.url}" alt="${img.type}" style="max-width: 100%; height: auto; border: 2px solid #333; border-radius: 8px;" />
             </div>`
        ).join('');

        const contentHtml = markdownToHtml(article.content);
        const tipsHtml = markdownToHtml(article.tips);

        const fullHtml = `
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${article.title}</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; background-color: #fdfdfd; max-width: 800px; margin: 0 auto; padding: 2rem; }
                    h1, h2, h3 { color: #000; }
                    h1 { font-size: 2.5em; text-align: center; margin-bottom: 2rem; }
                    h2 { font-size: 2em; border-bottom: 2px solid #eee; padding-bottom: 0.5rem; margin-top: 3rem; margin-bottom: 1.5rem; }
                    h3 { font-size: 1.5em; margin-top: 2rem; margin-bottom: 1rem; }
                    img { max-width: 100%; height: auto; border-radius: 8px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
                    em { color: #8A2BE2; font-style: normal; font-weight: bold; }
                    ul, ol { padding-left: 20px; }
                    li { margin-bottom: 0.5rem; }
                    p { margin-bottom: 1rem; }
                </style>
            </head>
            <body>
                <h1>${article.title}</h1>
                <section>
                    <h2>Imagens</h2>
                    ${imagesHtml}
                </section>
                <section>
                    <h2>Artigo</h2>
                    ${contentHtml}
                </section>
                <section>
                    <h2>Dicas e Macetes</h2>
                    ${tipsHtml}
                </section>
            </body>
            </html>
        `;

        const blob = new Blob([fullHtml], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${article.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.html`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="max-w-4xl mx-auto">
            {readingArticle && (
                <ReadingMode 
                    article={readingArticle} 
                    onClose={() => setReadingArticle(null)} 
                />
            )}
            <div className="flex justify-end mb-6 sticky top-24 z-10">
                <button
                    onClick={handleDownloadPdf}
                    disabled={isDownloadingPdf}
                    className="bg-green-600 text-white font-bold py-2 px-6 hover:bg-green-700 transition-colors duration-300 shadow-lg font-display text-sm disabled:bg-green-800 disabled:cursor-wait"
                >
                    {isDownloadingPdf ? 'Gerando PDF...' : 'Baixar PDF'}
                </button>
            </div>
            
            <article id="magazine-content" className="bg-gray-800 p-4 sm:p-8 md:p-12 shadow-2xl relative overflow-hidden">
                <div className="scanlines"></div>
                
                <header className="mb-12 text-center">
                    <div className="relative w-full h-auto mb-6 group border-4 border-fuchsia-500 shadow-lg shadow-fuchsia-500/20">
                        <img src={magazine.coverImage} alt="Capa da Revista" className="w-full h-full object-cover" />
                        <RegenerateImageButton 
                            imageId="coverImage" 
                            onRegenerate={onImageRegenerate}
                            isLoading={!!isGeneratingImage['coverImage']}
                        />
                    </div>
                    <EditableText
                        tag="h1"
                        text={magazine.title}
                        onSave={(newText: string) => onTextUpdate('title', newText)}
                        className="text-4xl md:text-6xl font-display text-yellow-300 break-words"
                    />
                </header>

                <div className="flex flex-col space-y-16">
                    {magazine.articles.map((article, index) => {
                        const articlePath = `articles.${index}`;
                        return (
                            <section key={article.id}>
                                <div className="flex justify-between items-start gap-4 mb-6">
                                    <EditableText
                                        tag="h2"
                                        text={article.title}
                                        onSave={(newText) => onTextUpdate(`${articlePath}.title`, newText)}
                                        className="text-3xl md:text-4xl font-display text-cyan-400 break-words flex-1"
                                    />
                                     <div className="flex items-center gap-2 flex-shrink-0">
                                        <button
                                            onClick={() => setReadingArticle(article)}
                                            className="bg-cyan-600 text-white font-bold py-2 px-4 hover:bg-cyan-700 transition-colors duration-300 shadow-lg font-display text-xs"
                                            title="Entrar no modo leitura"
                                        >
                                            Leitura
                                        </button>
                                        <button
                                            onClick={() => handleDownloadArticle(article)}
                                            className="bg-purple-600 text-white font-bold py-2 px-4 hover:bg-purple-700 transition-colors duration-300 shadow-lg font-display text-xs flex items-center gap-2"
                                            title="Baixar este artigo em HTML"
                                        >
                                            <DownloadIcon className="w-4 h-4" />
                                            <span>Salvar</span>
                                        </button>
                                     </div>
                                </div>
                                <ImageGallery
                                    images={article.images}
                                    onRegenerate={onImageRegenerate}
                                    isGeneratingImage={isGeneratingImage}
                                />
                                <EditableText
                                    tag="div"
                                    text={article.content}
                                    onSave={(newText) => onTextUpdate(`${articlePath}.content`, newText)}
                                    className="text-lg"
                                    renderFunction={renderMarkdown}
                                    isTextArea
                                />
                                <div className="mt-8 p-6 border-2 border-dashed border-yellow-400 bg-black/20 rounded-lg">
                                    <h4 className="font-display text-xl text-yellow-300 mb-4">Dicas e Macetes</h4>
                                    <EditableText
                                        tag="div"
                                        text={article.tips}
                                        onSave={(newText) => onTextUpdate(`${articlePath}.tips`, newText)}
                                        className="text-lg"
                                        renderFunction={renderMarkdown}
                                        isTextArea
                                    />
                                </div>
                                <Comments articleId={article.id} />
                            </section>
                        );
                    })}
                </div>
            </article>
        </div>
    );
};

export default MagazineViewer;
