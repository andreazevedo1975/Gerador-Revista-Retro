import React, { useState, useEffect, useRef } from 'react';
import { Magazine, Article, ArticleImage, FinalMagazineDraft } from '../types';
import EditableText from './EditableText';
import RegenerateImageButton from './RegenerateImageButton';
import Comments from './Comments';
import ReadingMode from './ReadingMode';
import EditorialConceptPage from './EditorialConceptPage';

interface MagazineViewerProps {
    draft: FinalMagazineDraft;
    onTextUpdate: (path: string, newText: string) => void;
    onImageRegenerate: (path: string, options: { quality: 'standard' | 'high'; modificationPrompt?: string; }) => void;
    isGeneratingImage: Record<string, boolean>;
}

declare const jspdf: any;
declare const htmlDocx: any;
declare const saveAs: any;

const renderMarkdown = (markdown: string) => {
    const lines = markdown.split('\n');
    const elements: React.ReactNode[] = [];
    let listItems: string[] = [];
    let currentListType: 'ul' | 'ol' | null = null;

    const renderLine = (line: string): React.ReactNode[] => {
        const parts = line.split(/(\*.*?\*)/g);
        return parts.map((part, i) =>
            part.startsWith('*') && part.endsWith('*') ? (
                <em key={i} className="text-yellow-400 italic">{part.slice(1, -1)}</em>
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
                <ListTag key={`list-${elements.length}`} className={`${listStyle} list-inside space-y-2 mb-4 pl-4 text-gray-300 leading-loose text-lg`}>
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
                elements.push(<p key={index} className="mb-4 text-gray-300 leading-loose text-lg">{renderLine(line)}</p>);
            }
        }
    });

    flushList();
    return elements;
};


const ImageGallery: React.FC<{
    images: ArticleImage[];
    onRegenerate: (path: string, options: { quality: 'standard' | 'high'; modificationPrompt?: string; }) => void;
    isGeneratingImage: Record<string, boolean>;
    articleTitle: string;
    onDownloadImage: (imageUrl: string, articleTitle: string, imageType: string) => void;
}> = ({ images, onRegenerate, isGeneratingImage, articleTitle, onDownloadImage }) => {
    const gameplay = images.find(img => img.type === 'gameplay');
    const others = images.filter(img => img.type !== 'gameplay');

    const ImageBox: React.FC<{image: ArticleImage}> = ({ image }) => (
        <div className="relative w-full h-full group border-2 border-cyan-500 shadow-lg shadow-cyan-500/20">
            <img src={image.url} alt={`Ilustração do tipo ${image.type}`} className="w-full h-full object-cover" />
            <button
                onClick={() => onDownloadImage(image.url, articleTitle, image.type)}
                className="absolute top-2 right-2 bg-gray-700/50 p-2 rounded-full text-gray-300 hover:text-white hover:bg-purple-600 transition-all duration-300 opacity-0 group-hover:opacity-100 focus:opacity-100 z-10"
                title={`Baixar imagem (${image.type})`}
            >
                <DownloadIcon className="w-5 h-5" />
            </button>
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

const ChevronUpIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
    </svg>
);

const ChevronDownIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
);

const ShareIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 4.186m0-4.186L10.5 8.354m-3.283 2.553L10.5 15.646m3.283-7.292a2.25 2.25 0 100 4.186m0-4.186L10.5 8.354m3.283 2.553L10.5 15.646m0 0l3.283-2.553m0 0a2.25 2.25 0 100-4.186m0 4.186L10.5 15.646" />
    </svg>
);

const TwitterIcon: React.FC = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"></path>
    </svg>
);

const FacebookIcon: React.FC = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
        <path d="M14 13.5h2.5l1-4H14v-2c0-1.03 0-2 2-2h1.5V2.14c-.326-.043-1.557-.14-2.857-.14C11.928 2 10 3.657 10 6.7v2.8H7v4h3V22h4z"></path>
    </svg>
);

const WhatsAppIcon: React.FC = () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8">
        <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.38 1.25 4.82l-1.34 4.91 5.04-1.32c1.41.79 3.02 1.26 4.71 1.26h.01c5.46 0 9.91-4.45 9.91-9.91s-4.45-9.91-9.91-9.91zm0 18.23c-1.54 0-3.02-.42-4.32-1.16l-.31-.18-3.21.84.86-3.12-.2-.32c-.82-1.34-1.32-2.88-1.32-4.52 0-4.59 3.73-8.32 8.32-8.32 4.59 0 8.32 3.73 8.32 8.32 0 4.59-3.73 8.32-8.32 8.32zm4.52-6.13c-.25-.12-1.47-.72-1.7-.82s-.39-.12-.56.12c-.17.25-.64.82-.79.98s-.29.17-.54.06c-.25-.12-1.06-.39-2.02-1.25s-1.45-1.95-1.61-2.29c-.17-.34-.02-.51.11-.64s.25-.29.37-.43c.13-.14.17-.25.25-.41s.04-.3-.02-.43c-.06-.12-.56-1.34-.76-1.84s-.4-.42-.56-.42h-.48c-.17 0-.43.06-.66.31s-.86.84-.86 2.05c0 1.21.88 2.37 1 2.53s1.75 2.67 4.24 3.74c.59.25 1.05.41 1.41.51.6.19 1.14.16 1.56.1.48-.07 1.47-.6 1.68-1.18s.21-1.08.15-1.18c-.07-.1-.22-.16-.47-.28z"></path>
    </svg>
);


const MagazineViewer: React.FC<MagazineViewerProps> = ({ draft, onTextUpdate, onImageRegenerate, isGeneratingImage }) => {
    const { magazine, identity, editorialConcept } = draft;
    
    const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
    const [isDownloadingDocx, setIsDownloadingDocx] = useState(false);
    const [readingArticle, setReadingArticle] = useState<Article | null>(null);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [currentArticleIndex, setCurrentArticleIndex] = useState(0);
    const [isNavOpen, setIsNavOpen] = useState(false);
    const articleRefs = useRef<(HTMLElement | null)[]>([]);
    const navFooterRef = useRef<HTMLElement>(null);

    useEffect(() => {
        if (!isNavOpen) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (navFooterRef.current && !navFooterRef.current.contains(event.target as Node)) {
                setIsNavOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isNavOpen]);

    useEffect(() => {
        if (!magazine) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const visibleEntry = entries.find(entry => entry.isIntersecting);
                if (visibleEntry) {
                    const index = magazine.articles.findIndex(
                        (article) => article.id === visibleEntry.target.id
                    );
                    if (index !== -1) {
                        setCurrentArticleIndex(index);
                    }
                }
            },
            {
                root: null,
                rootMargin: '0px 0px -50% 0px',
                threshold: 0,
            }
        );

        const currentArticleRefs = articleRefs.current;
        currentArticleRefs.forEach((ref) => {
            if (ref) observer.observe(ref);
        });

        return () => {
            currentArticleRefs.forEach((ref) => {
                if (ref) observer.unobserve(ref);
            });
        };
    }, [magazine]);

    if (!magazine) {
        return (
            <div className="max-w-4xl mx-auto">
                 <header className="text-center mb-8 bg-gray-800/50 p-6 rounded-lg border border-fuchsia-500/30">
                    <h2 className="text-3xl md:text-4xl font-display text-yellow-300 mb-2">Revisão Final da Revista Pronta</h2>
                    <p className="text-lg text-gray-400">Ainda não há conteúdo de revista para exibir.</p>
                    <p className="text-md text-gray-500 mt-2">Use um dos tópicos da Central de Criação para gerar os artigos e clique em "OK" para adicioná-los aqui.</p>
                    {identity && <p className="mt-4 text-green-400">✅ Identidade Visual está pronta!</p>}
                    {editorialConcept && <p className="mt-2 text-green-400">✅ Conceito Editorial está pronto!</p>}
                </header>
                 {editorialConcept && <EditorialConceptPage concept={editorialConcept} />}
            </div>
        )
    }
    
    const finalTitle = identity?.magazineName || magazine.title;
    const finalLogoUrl = identity?.logoUrl || magazine.logoUrl;


    const scrollToArticle = (index: number) => {
        if (articleRefs.current[index]) {
            articleRefs.current[index]?.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            });
            setCurrentArticleIndex(index);
        }
    };

    const handlePrevArticle = () => {
        if (currentArticleIndex > 0) {
            scrollToArticle(currentArticleIndex - 1);
        }
    };

    const handleNextArticle = () => {
        if (currentArticleIndex < magazine.articles.length - 1) {
            scrollToArticle(currentArticleIndex + 1);
        }
    };
    
    const handleDownloadPdf = async () => {
        setIsDownloadingPdf(true);
        try {
            const { jsPDF } = jspdf;
            const pdf = new jsPDF('p', 'pt', 'a4');
    
            const pageHeight = pdf.internal.pageSize.getHeight();
            const pageWidth = pdf.internal.pageSize.getWidth();
            const margin = 40;
            const contentWidth = pageWidth - margin * 2;
            let y = margin;
    
            const addPageIfNeeded = (spaceNeeded: number) => {
                if (y + spaceNeeded > pageHeight - margin) {
                    pdf.addPage();
                    y = margin;
                }
            };
    
            const loadImage = (src: string): Promise<HTMLImageElement> => {
                return new Promise((resolve, reject) => {
                    const img = new Image();
                    img.crossOrigin = "anonymous";
                    img.onload = () => resolve(img);
                    img.onerror = (err) => reject(err);
                    img.src = src;
                });
            };
    
            const parseMarkdownForPdf = (markdown: string) => {
                const lines = markdown.split('\n');
                let isUl = false;
                let isOl = false;
                let olCounter = 1;
    
                lines.forEach(line => {
                    const trimmedLine = line.trim();
                    const isUnorderedItem = trimmedLine.startsWith('- ');
                    const isOrderedItem = /^\d+\.\s/.test(trimmedLine);
    
                    if (line.startsWith('### ')) {
                        isUl = isOl = false;
                        addPageIfNeeded(30);
                        pdf.setFontSize(16);
                        pdf.setFont('helvetica', 'bold');
                        const text = line.substring(4);
                        const textLines = pdf.splitTextToSize(text, contentWidth);
                        const textHeight = pdf.getTextDimensions(textLines).h;
                        addPageIfNeeded(textHeight);
                        pdf.text(textLines, margin, y);
                        y += textHeight + 10;
                    } else if (isUnorderedItem) {
                        if (isOl) olCounter = 1; // Reset OL counter if switching from OL to UL
                        isOl = false;
                        if (!isUl) y += 5;
                        isUl = true;
                        
                        pdf.setFontSize(12);
                        pdf.setFont('helvetica', 'normal');
                        const text = trimmedLine.substring(2).trim();
                        const textLines = pdf.splitTextToSize(text, contentWidth - 20); // Indent
                        const textHeight = pdf.getTextDimensions(textLines).h;
                        addPageIfNeeded(textHeight);
                        pdf.text('•', margin, y + pdf.getLineHeight() / 2);
                        pdf.text(textLines, margin + 15, y);
                        y += textHeight + 5;
                    } else if (isOrderedItem) {
                        isUl = false;
                        if (!isOl) {
                            olCounter = 1;
                            y += 5;
                        }
                        isOl = true;

                        pdf.setFontSize(12);
                        pdf.setFont('helvetica', 'normal');
                        const text = trimmedLine.substring(trimmedLine.indexOf(' ') + 1).trim();
                        const textLines = pdf.splitTextToSize(text, contentWidth - 20); // Indent
                        const textHeight = pdf.getTextDimensions(textLines).h;
                        addPageIfNeeded(textHeight);
                        pdf.text(`${olCounter++}.`, margin, y);
                        pdf.text(textLines, margin + 15, y);
                        y += textHeight + 5;
                    } else if (trimmedLine !== '') {
                        if (isUl || isOl) y += 10;
                        isUl = isOl = false;
                        olCounter = 1; // Reset OL counter after list block
                        
                        addPageIfNeeded(20);
                        pdf.setFontSize(12);
                        pdf.setFont('helvetica', 'normal');
                        const textLines = pdf.splitTextToSize(line, contentWidth);
                        const textHeight = pdf.getTextDimensions(textLines).h;
                        addPageIfNeeded(textHeight);
                        pdf.text(textLines, margin, y);
                        y += textHeight + 10;
                    }
                });
            };
    
            // 1. Cover Page
            pdf.setFontSize(28);
            pdf.setFont('helvetica', 'bold');
            pdf.setTextColor(40, 40, 40);
    
            if (magazine.coverImage) {
                const coverImg = await loadImage(magazine.coverImage);
                const imgAspectRatio = coverImg.width / coverImg.height;
                let imgHeight = (pageWidth * 0.75) / imgAspectRatio;
                let imgWidth = pageWidth * 0.75;
                if (imgHeight > pageHeight * 0.6) {
                    imgHeight = pageHeight * 0.6;
                    imgWidth = imgHeight * imgAspectRatio;
                }
                const imgX = (pageWidth - imgWidth) / 2;
                y = margin;
                pdf.addImage(coverImg, 'JPEG', imgX, y, imgWidth, imgHeight);
                y += imgHeight + 30;
            }
    
            const titleLines = pdf.splitTextToSize(finalTitle, contentWidth * 0.8);
            const titleHeight = pdf.getTextDimensions(titleLines).h;
            addPageIfNeeded(titleHeight);
            pdf.text(titleLines, pageWidth / 2, y, { align: 'center' });
    
            // 2. Articles
            for (const article of magazine.articles) {
                pdf.addPage();
                y = margin;
    
                pdf.setFontSize(22);
                pdf.setFont('helvetica', 'bold');
                pdf.setTextColor(0, 82, 122);
                const articleTitleLines = pdf.splitTextToSize(article.title, contentWidth);
                const articleTitleHeight = pdf.getTextDimensions(articleTitleLines).h;
                addPageIfNeeded(articleTitleHeight);
                pdf.text(articleTitleLines, margin, y);
                y += articleTitleHeight + 20;
                
                pdf.setTextColor(40, 40, 40);

                if (article.images && article.images.length > 0) {
                    for (const image of article.images) {
                        if (!image.url) continue;
                        try {
                            const articleImg = await loadImage(image.url);
                            const articleImgAspectRatio = articleImg.width / articleImg.height;
                            const articleImgHeight = contentWidth / articleImgAspectRatio;
                            addPageIfNeeded(articleImgHeight + 15);
                            pdf.addImage(articleImg, 'JPEG', margin, y, contentWidth, articleImgHeight);
                            y += articleImgHeight + 15;
                        } catch (e) {
                            console.error("Could not load image for PDF:", e);
                        }
                    }
                }
    
                parseMarkdownForPdf(article.content);
                
                addPageIfNeeded(40);
                y += 20;
                pdf.setDrawColor(200, 200, 200);
                pdf.line(margin, y, pageWidth - margin, y);
                y += 20;
                pdf.setFontSize(18);
                pdf.setFont('helvetica', 'bold');
                pdf.setTextColor(0, 82, 122);
                pdf.text("Dicas e Macetes", margin, y);
                y += 25;
                pdf.setTextColor(40, 40, 40);
                parseMarkdownForPdf(article.tips);
            }
    
            pdf.save(`${finalTitle.replace(/\s+/g, '_')}.pdf`);
    
        } catch (error) {
            console.error("Erro ao gerar PDF:", error);
        } finally {
            setIsDownloadingPdf(false);
        }
    };

    const handleDownloadDocx = async () => {
        setIsDownloadingDocx(true);
        try {
            const markdownToHtml = (markdown: string): string => {
                const lines = markdown.split('\n');
                let html = '';
                const listStack: ('ul' | 'ol')[] = [];
    
                const closeLists = (targetLevel = 0) => {
                    while (listStack.length > targetLevel) {
                        const listType = listStack.pop();
                        html += `</${listType}>`;
                    }
                };
    
                const processLine = (line: string) => line.replace(/\*(.*?)\*/g, '<em>$1</em>');
    
                lines.forEach(line => {
                    const trimmedLine = line.trim();
                    const isUl = trimmedLine.startsWith('- ');
                    const isOl = /^\d+\.\s/.test(trimmedLine);
    
                    if (trimmedLine.startsWith('### ')) {
                        closeLists();
                        html += `<h3>${processLine(trimmedLine.substring(4))}</h3>`;
                    } else if (isUl) {
                        if (listStack[listStack.length - 1] !== 'ul') {
                            closeLists();
                            html += '<ul>';
                            listStack.push('ul');
                        }
                        html += `<li>${processLine(trimmedLine.substring(2))}</li>`;
                    } else if (isOl) {
                        if (listStack[listStack.length - 1] !== 'ol') {
                            closeLists();
                            html += '<ol>';
                            listStack.push('ol');
                        }
                        html += `<li>${processLine(trimmedLine.substring(trimmedLine.indexOf(' ') + 1))}</li>`;
                    } else {
                        closeLists();
                        if (trimmedLine !== '') {
                            html += `<p>${processLine(trimmedLine)}</p>`;
                        }
                    }
                });
                closeLists();
                return html;
            };
    
            const styles = `
                <style>
                    body { font-family: Calibri, sans-serif; font-size: 11pt; }
                    h1 { font-size: 24pt; font-weight: bold; color: #1E4E79; text-align: center; }
                    h2 { font-size: 18pt; font-weight: bold; color: #1E4E79; page-break-before: always; border-bottom: 1px solid #BFBFBF; padding-bottom: 6px; margin-top: 24px; }
                    h3 { font-size: 14pt; font-weight: bold; color: #2E74B5; margin-top: 18px; }
                    p { margin-bottom: 12px; line-height: 1.5; }
                    em { font-style: italic; color: #595959; }
                    ul, ol { margin-left: 40px; }
                    li { margin-bottom: 6px; }
                </style>
            `;
    
            const articlesHtml = magazine.articles.map(article => `
                <div>
                    <h2>${article.title}</h2>
                    ${(article.images || []).map(img =>
                        img.url ? `<p><img src="${img.url}" style="width: 500px; max-width: 100%; height: auto;" alt="${img.type}"></p>` : ''
                    ).join('')}
                    ${markdownToHtml(article.content)}
                    <h3>Dicas e Macetes</h3>
                    ${markdownToHtml(article.tips)}
                </div>
            `).join('');
    
            const fullHtml = `
                <!DOCTYPE html>
                <html lang="pt-BR">
                <head>
                    <meta charset="UTF-8">
                    <title>${finalTitle}</title>
                    ${styles}
                </head>
                <body>
                    <div style="text-align: center; page-break-after: always;">
                        <h1>${finalTitle}</h1>
                        ${magazine.coverImage ? `<p><img src="${magazine.coverImage}" style="width: 500px; max-width: 100%; height: auto;" alt="Capa da Revista"></p>` : ''}
                    </div>
                    ${articlesHtml}
                </body>
                </html>
            `;
            
            const docxBlob = await htmlDocx.asBlob(fullHtml, {
                orientation: 'portrait',
                margins: { top: 720, bottom: 720, left: 720, right: 720 }
            });
    
            saveAs(docxBlob, `${finalTitle.replace(/\s+/g, '_')}.docx`);
    
        } catch (error) {
            console.error("Erro ao gerar DOCX:", error);
        } finally {
            setIsDownloadingDocx(false);
        }
    };

    const handleDownloadSection = (markdown: string, articleTitle: string, sectionTitle: string) => {
        const markdownToHtml = (md: string): string => {
            const lines = md.split('\n');
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
        
        const sectionHtml = markdownToHtml(markdown);
        const fullHtml = `
            <!DOCTYPE html>
            <html lang="pt-BR">
            <head>
                <meta charset="UTF-8">
                <title>${sectionTitle} - ${articleTitle}</title>
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; background-color: #fdfdfd; max-width: 800px; margin: 0 auto; padding: 2rem; }
                    h1 { font-size: 2em; color: #000; }
                    h2 { font-size: 1.2em; color: #555; margin-bottom: 2rem; }
                    h3 { font-size: 1.5em; margin-top: 2rem; margin-bottom: 1rem; border-bottom: 1px solid #eee; padding-bottom: 0.5rem; }
                    em { color: #8A2BE2; font-style: normal; font-weight: bold; }
                    ul, ol { padding-left: 20px; }
                    li { margin-bottom: 0.5rem; }
                    p { margin-bottom: 1rem; }
                </style>
            </head>
            <body>
                <h1>${sectionTitle}</h1>
                <h2>Do artigo: "${articleTitle}"</h2>
                <hr />
                ${sectionHtml}
            </body>
            </html>
        `;

        const blob = new Blob([fullHtml], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        const fileName = `${articleTitle.replace(/[^a-z0-9]/gi, '_')}_${sectionTitle.replace(/[^a-z0-9]/gi, '_')}.html`.toLowerCase();
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
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

    const handleDownloadImage = (imageUrl: string, articleTitle: string, imageType: string) => {
        const safeMagazineTitle = finalTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const safeArticleTitle = articleTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const fileName = `${safeMagazineTitle}_${safeArticleTitle}_${imageType}.jpg`;
        
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleShare = async () => {
        const shareData = {
            title: `Revista Retrô Gamer AI: ${finalTitle}`,
            text: `Confira a revista "${finalTitle}" que eu criei usando a Retrô Gamer AI!`,
            url: window.location.href,
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (error) {
                console.error('Erro ao compartilhar:', error);
                // Fallback to modal if user cancels share dialog
                setIsShareModalOpen(true);
            }
        } else {
            setIsShareModalOpen(true);
        }
    };
    
    return (
        <div className="max-w-4xl mx-auto">
            <header className="text-center mb-8 bg-gray-800/50 p-6 rounded-lg border border-fuchsia-500/30">
                <h2 className="text-3xl md:text-4xl font-display text-yellow-300 mb-2">Revisão Final da Revista Pronta</h2>
                <p className="text-lg text-gray-400">Aqui está a sua revista completa. Revise o conteúdo, faça edições de última hora clicando nos textos e, quando estiver satisfeito, use os botões abaixo para compartilhar ou baixar.</p>
            </header>

            {readingArticle && (
                <ReadingMode 
                    article={readingArticle} 
                    onClose={() => setReadingArticle(null)} 
                />
            )}

            {isShareModalOpen && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setIsShareModalOpen(false)}>
                    <div className="bg-gray-800 rounded-lg shadow-2xl p-6 border border-fuchsia-500/30 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                        <h3 className="text-2xl font-display text-yellow-300 mb-6 text-center">Compartilhar Revista</h3>
                        <div className="flex justify-center items-center gap-6">
                            <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(`Confira a revista "${finalTitle}" que criei com a Retrô Gamer AI!`)}`} target="_blank" rel="noopener noreferrer" className="text-white hover:text-cyan-400 transition-colors" title="Compartilhar no Twitter">
                                <TwitterIcon />
                            </a>
                             <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`} target="_blank" rel="noopener noreferrer" className="text-white hover:text-blue-500 transition-colors" title="Compartilhar no Facebook">
                                <FacebookIcon />
                            </a>
                            <a href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Confira a revista "${finalTitle}" que criei com a Retrô Gamer AI! ${window.location.href}`)}`} target="_blank" rel="noopener noreferrer" className="text-white hover:text-green-500 transition-colors" title="Compartilhar no WhatsApp">
                                <WhatsAppIcon />
                            </a>
                        </div>
                        <button onClick={() => setIsShareModalOpen(false)} className="mt-8 w-full bg-gray-700 text-white font-bold py-2 px-4 rounded hover:bg-gray-600 transition-colors font-display text-sm">
                            Fechar
                        </button>
                    </div>
                </div>
            )}

            <div className="flex justify-end mb-6 sticky top-24 z-10 gap-4">
                <button
                    onClick={handleShare}
                    className="bg-yellow-500 text-gray-900 font-bold py-2 px-6 hover:bg-yellow-600 transition-colors duration-300 shadow-lg font-display text-sm flex items-center gap-2"
                >
                    <ShareIcon className="w-4 h-4" />
                    <span>Compartilhar</span>
                </button>
                <button
                    onClick={handleDownloadDocx}
                    disabled={isDownloadingDocx}
                    className="bg-blue-600 text-white font-bold py-2 px-6 hover:bg-blue-700 transition-colors duration-300 shadow-lg font-display text-sm disabled:bg-blue-800 disabled:cursor-wait flex items-center gap-2"
                >
                    {isDownloadingDocx ? 'Gerando...' : 'Baixar DOCX'}
                </button>
                <button
                    onClick={handleDownloadPdf}
                    disabled={isDownloadingPdf}
                    className="bg-green-600 text-white font-bold py-2 px-6 hover:bg-green-700 transition-colors duration-300 shadow-lg font-display text-sm disabled:bg-green-800 disabled:cursor-wait flex items-center gap-2"
                >
                    {isDownloadingPdf ? 'Gerando...' : 'Baixar PDF'}
                </button>
            </div>
            
            <div id="magazine-content-wrapper" className="bg-gray-800">
                <article id="magazine-content" className="bg-gray-800 p-4 sm:p-8 md:p-12 shadow-2xl relative overflow-hidden">
                    
                    <header className="mb-12 text-center">
                        <div className="relative w-full h-auto mb-6 group border-4 border-fuchsia-500 shadow-lg shadow-fuchsia-500/20">
                            {finalLogoUrl && (
                                <img 
                                    src={finalLogoUrl} 
                                    alt="Logo da Revista" 
                                    className="absolute top-4 left-4 w-16 h-16 md:w-24 md:h-24 object-contain bg-black/30 p-1 rounded-md z-10"
                                />
                            )}
                            <img src={magazine.coverImage} alt="Capa da Revista" className="w-full h-full object-cover" />
                            <RegenerateImageButton 
                                imageId="coverImage" 
                                onRegenerate={onImageRegenerate}
                                isLoading={!!isGeneratingImage['coverImage']}
                            />
                        </div>
                        <EditableText
                            tag="h1"
                            text={finalTitle}
                            onSave={(newText: string) => onTextUpdate('title', newText)}
                            className="text-4xl md:text-6xl font-display text-yellow-300 break-words"
                        />
                    </header>

                    {editorialConcept && <EditorialConceptPage concept={editorialConcept} />}

                    <div className="flex flex-col space-y-16">
                        {magazine.articles.map((article, index) => {
                            const articlePath = `articles.${index}`;
                            return (
                                <section
                                    key={article.id}
                                    id={article.id}
                                    ref={(el) => {
                                        articleRefs.current[index] = el;
                                    }}
                                >
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
                                        articleTitle={article.title}
                                        onDownloadImage={handleDownloadImage}
                                    />
                                    <div className="relative group">
                                        <EditableText
                                            tag="div"
                                            text={article.content}
                                            onSave={(newText) => onTextUpdate(`${articlePath}.content`, newText)}
                                            className="text-lg"
                                            renderFunction={renderMarkdown}
                                            isTextArea
                                        />
                                        <button 
                                            onClick={() => handleDownloadSection(article.content, article.title, 'Artigo Principal')}
                                            className="absolute top-2 right-2 bg-gray-700/50 p-2 rounded-full text-gray-300 hover:text-white hover:bg-purple-600 transition-all duration-300 opacity-0 group-hover:opacity-100 focus:opacity-100"
                                            title={`Baixar conteúdo de "${article.title}"`}
                                        >
                                            <DownloadIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <div className="mt-8 p-6 border-2 border-dashed border-yellow-400 bg-black/20 rounded-lg relative group">
                                        <h4 className="font-display text-xl text-yellow-300 mb-4">Dicas e Macetes</h4>
                                        <EditableText
                                            tag="div"
                                            text={article.tips}
                                            onSave={(newText) => onTextUpdate(`${articlePath}.tips`, newText)}
                                            className="text-lg"
                                            renderFunction={renderMarkdown}
                                            isTextArea
                                        />
                                        <button 
                                            onClick={() => handleDownloadSection(article.tips, article.title, 'Dicas e Macetes')}
                                            className="absolute top-4 right-4 bg-gray-700/50 p-2 rounded-full text-gray-300 hover:text-white hover:bg-purple-600 transition-all duration-300 opacity-0 group-hover:opacity-100 focus:opacity-100"
                                            title={`Baixar Dicas de "${article.title}"`}
                                        >
                                            <DownloadIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <Comments articleId={article.id} />
                                </section>
                            );
                        })}
                    </div>
                </article>
            </div>

            <footer ref={navFooterRef} className="sticky bottom-0 z-30 mt-8">
                 {isNavOpen && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 w-full max-w-lg mb-2">
                        <div className="bg-gray-800 border-2 border-fuchsia-500/50 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                            <ul className="p-2 space-y-1">
                                {magazine.articles.map((article, index) => (
                                    <li key={article.id}>
                                        <button
                                            onClick={() => {
                                                scrollToArticle(index);
                                                setIsNavOpen(false);
                                            }}
                                            className={`w-full text-left p-2 rounded-md font-display text-sm transition-colors duration-200 truncate ${
                                                currentArticleIndex === index
                                                    ? 'bg-fuchsia-600 text-white'
                                                    : 'text-gray-300 hover:bg-gray-700'
                                            }`}
                                        >
                                            <span className="font-sans font-bold">{index + 1}.</span> {article.title}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}
                <div className="bg-gray-900/80 backdrop-blur-sm border-t border-fuchsia-500/30 p-3">
                    <div className="container mx-auto flex justify-between items-center max-w-4xl">
                        <button
                            onClick={handlePrevArticle}
                            disabled={currentArticleIndex === 0}
                            className="bg-fuchsia-600 text-white font-bold py-2 px-6 hover:bg-fuchsia-700 disabled:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300 shadow-lg font-display text-sm"
                        >
                            Anterior
                        </button>
                        <button
                            onClick={() => setIsNavOpen(prev => !prev)}
                            className="font-display text-yellow-300 text-sm text-center flex flex-col items-center gap-1 hover:bg-fuchsia-500/20 px-4 py-1 rounded-md transition-colors"
                            title="Navegar para artigo"
                        >
                            {isNavOpen ? <ChevronDownIcon /> : <ChevronUpIcon />}
                            <span>Artigo {currentArticleIndex + 1} de {magazine.articles.length}</span>
                        </button>
                        <button
                            onClick={handleNextArticle}
                            disabled={currentArticleIndex === magazine.articles.length - 1}
                            className="bg-fuchsia-600 text-white font-bold py-2 px-6 hover:bg-fuchsia-700 disabled:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300 shadow-lg font-display text-sm"
                        >
                            Próximo
                        </button>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default MagazineViewer;