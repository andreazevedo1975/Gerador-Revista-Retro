import React, { useState } from 'react';
import { Article } from '../types';

type Theme = 'dark' | 'light' | 'console' | 'arcade';

const themeConfig: Record<Theme, {
    name: string;
    containerClasses: string;
    toolbarBg: string;
    buttonClasses: string;
    headingClasses: string;
    highlightClasses: string;
}> = {
    dark: {
        name: 'Escuro',
        containerClasses: 'bg-gray-900 text-gray-200',
        toolbarBg: 'bg-gray-900/80',
        buttonClasses: 'hover:bg-gray-700',
        headingClasses: 'text-cyan-400',
        highlightClasses: 'text-yellow-400',
    },
    light: {
        name: 'Claro',
        containerClasses: 'bg-gray-100 text-gray-800',
        toolbarBg: 'bg-gray-100/80',
        buttonClasses: 'hover:bg-gray-300',
        headingClasses: 'text-cyan-600',
        highlightClasses: 'text-yellow-600',
    },
    console: {
        name: 'Console 90s',
        containerClasses: 'bg-[#c4cfa1] text-[#343a1a]',
        toolbarBg: 'bg-[#c4cfa1]/80',
        buttonClasses: 'hover:bg-[#b0bb8b]',
        headingClasses: 'text-[#5a6331]',
        highlightClasses: 'text-[#5a6331] font-bold',
    },
    arcade: {
        name: 'Arcade Neon',
        containerClasses: 'bg-[#1a0c2e] text-gray-200',
        toolbarBg: 'bg-[#1a0c2e]/80',
        buttonClasses: 'hover:bg-[#2c1a4d]',
        headingClasses: 'text-fuchsia-400',
        highlightClasses: 'text-cyan-400',
    },
};

const themeOrder: Theme[] = ['dark', 'light', 'console', 'arcade'];

const CloseIcon = ({ className = 'w-6 h-6' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const PaletteIcon = ({ className = 'w-6 h-6' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.098 19.902a3.75 3.75 0 0 0 5.304 0l6.401-6.402a3.75 3.75 0 0 0-5.304-5.304L4.098 14.6c-.44 1.897.283 3.932 2.185 5.303m-2.185-5.303l5.304-5.304m0 0a3.75 3.75 0 0 0 5.304 5.304l6.402-6.402a3.75 3.75 0 0 0-5.304-5.304l-6.402 6.402" />
    </svg>
);


const renderReadingMarkdown = (markdown: string, theme: Theme) => {
    const { headingClasses, highlightClasses } = themeConfig[theme];
    const lines = markdown.split('\n');
    const elements: React.ReactNode[] = [];
    let listItems: string[] = [];

    const renderLine = (line: string): React.ReactNode[] => {
        const parts = line.split(/(\*.*?\*)/g);
        return parts.map((part, i) =>
            part.startsWith('*') && part.endsWith('*') ? (
                <em key={i} className={`italic ${highlightClasses}`}>{part.slice(1, -1)}</em>
            ) : (
                part
            )
        );
    };

    const flushList = () => {
        if (listItems.length > 0) {
            elements.push(
                <ul key={`ul-${elements.length}`} className="list-disc list-inside space-y-2 mb-4 pl-4 leading-relaxed">
                    {listItems.map((item, i) => <li key={i}>{renderLine(item)}</li>)}
                </ul>
            );
            listItems = [];
        }
    };

    lines.forEach((line, index) => {
        if (line.startsWith('### ')) {
            flushList();
            elements.push(<h3 key={index} className={`text-2xl font-bold mt-8 mb-4 font-display ${headingClasses}`}>{line.substring(4)}</h3>);
        } else if (line.trim().startsWith('- ')) {
            listItems.push(line.trim().substring(2).trim());
        } else {
            flushList();
            if (line.trim() !== '') {
                elements.push(<p key={index} className="mb-4 leading-relaxed">{renderLine(line)}</p>);
            }
        }
    });

    flushList();
    return elements;
};

interface ReadingModeProps {
    article: Article;
    onClose: () => void;
}

const fontSizes = ['text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl'];

const ReadingMode: React.FC<ReadingModeProps> = ({ article, onClose }) => {
    const [theme, setTheme] = useState<Theme>('dark');
    const [fontSizeIndex, setFontSizeIndex] = useState(1); // Default to 'text-lg'

    const toggleTheme = () => {
        const currentIndex = themeOrder.indexOf(theme);
        const nextIndex = (currentIndex + 1) % themeOrder.length;
        setTheme(themeOrder[nextIndex]);
    };
    const increaseFontSize = () => setFontSizeIndex(prev => Math.min(prev + 1, fontSizes.length - 1));
    const decreaseFontSize = () => setFontSizeIndex(prev => Math.max(prev - 1, 0));

    const currentTheme = themeConfig[theme];
    const contentFontSizeClass = fontSizes[fontSizeIndex];
    const baseButtonClasses = `p-2 rounded-full transition-colors ${currentTheme.buttonClasses}`;

    return (
        <div className={`fixed inset-0 z-50 p-4 sm:p-8 overflow-y-auto transition-colors duration-300 ${currentTheme.containerClasses}`}>
            <div className="max-w-3xl mx-auto">
                <div className={`flex justify-between items-center mb-8 sticky top-0 py-4 backdrop-blur-sm ${currentTheme.toolbarBg}`}>
                    <div className="flex items-center gap-2">
                         <button onClick={decreaseFontSize} className={baseButtonClasses} title="Diminuir fonte">
                            <span className="text-xl font-bold">A-</span>
                         </button>
                         <button onClick={increaseFontSize} className={baseButtonClasses} title="Aumentar fonte">
                            <span className="text-xl font-bold">A+</span>
                         </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={toggleTheme} className={`${baseButtonClasses} flex items-center gap-2 px-3`} title="Mudar tema">
                            <PaletteIcon className="w-5 h-5" />
                            <span className="text-sm font-bold">{currentTheme.name}</span>
                        </button>
                        <button onClick={onClose} className={baseButtonClasses} title="Fechar">
                            <CloseIcon />
                        </button>
                    </div>
                </div>

                <article className={`${contentFontSizeClass} transition-all duration-200`}>
                    <h1 className={`text-4xl md:text-5xl font-bold font-display mb-8 ${currentTheme.highlightClasses}`}>{article.title}</h1>
                    <div>
                        {renderReadingMarkdown(article.content, theme)}
                    </div>
                    <div className="mt-12 pt-8 border-t-2">
                        <h2 className={`text-3xl font-bold font-display mb-4 ${currentTheme.highlightClasses}`}>Dicas e Macetes</h2>
                        {renderReadingMarkdown(article.tips, theme)}
                    </div>
                </article>
            </div>
        </div>
    );
};

export default ReadingMode;
