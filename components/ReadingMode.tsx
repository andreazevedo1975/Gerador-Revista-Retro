import React, { useState } from 'react';
import { Article } from '../types';

const CloseIcon = ({ className = 'w-6 h-6' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const SunIcon = ({ className = 'w-6 h-6' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
    </svg>
);

const MoonIcon = ({ className = 'w-6 h-6' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
    </svg>
);

const renderReadingMarkdown = (markdown: string, theme: 'dark' | 'light') => {
    const lines = markdown.split('\n');
    const elements: React.ReactNode[] = [];
    let listItems: string[] = [];

    const renderLine = (line: string): React.ReactNode[] => {
        const parts = line.split(/(\*.*?\*)/g);
        return parts.map((part, i) =>
            part.startsWith('*') && part.endsWith('*') ? (
                <em key={i} className={`not-italic ${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'}`}>{part.slice(1, -1)}</em>
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
            elements.push(<h3 key={index} className={`text-2xl font-bold mt-8 mb-4 font-display ${theme === 'dark' ? 'text-cyan-400' : 'text-cyan-600'}`}>{line.substring(4)}</h3>);
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
    const [theme, setTheme] = useState<'dark' | 'light'>('dark');
    const [fontSizeIndex, setFontSizeIndex] = useState(1); // Default to 'text-lg'

    const toggleTheme = () => setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
    const increaseFontSize = () => setFontSizeIndex(prev => Math.min(prev + 1, fontSizes.length - 1));
    const decreaseFontSize = () => setFontSizeIndex(prev => Math.max(prev - 1, 0));

    const themeClasses = theme === 'dark' 
        ? 'bg-gray-900 text-gray-200' 
        : 'bg-gray-100 text-gray-800';
    
    const contentFontSizeClass = fontSizes[fontSizeIndex];

    const toolbarBg = theme === 'dark' ? 'bg-gray-900/80' : 'bg-gray-100/80';
    const buttonClasses = `p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-gray-700' : 'hover:bg-gray-300'}`;

    return (
        <div className={`fixed inset-0 z-50 p-4 sm:p-8 overflow-y-auto transition-colors duration-300 ${themeClasses}`}>
            <div className="max-w-3xl mx-auto">
                <div className={`flex justify-between items-center mb-8 sticky top-0 py-4 backdrop-blur-sm ${toolbarBg}`}>
                    <div className="flex items-center gap-2">
                         <button onClick={decreaseFontSize} className={buttonClasses} title="Diminuir fonte">
                            <span className="text-xl font-bold">A-</span>
                         </button>
                         <button onClick={increaseFontSize} className={buttonClasses} title="Aumentar fonte">
                            <span className="text-xl font-bold">A+</span>
                         </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={toggleTheme} className={buttonClasses} title="Mudar tema">
                            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
                        </button>
                        <button onClick={onClose} className={buttonClasses} title="Fechar">
                            <CloseIcon />
                        </button>
                    </div>
                </div>

                <article className={`${contentFontSizeClass} transition-all duration-200`}>
                    <h1 className={`text-4xl md:text-5xl font-bold font-display mb-8 ${theme === 'dark' ? 'text-yellow-300' : 'text-yellow-700'}`}>{article.title}</h1>
                    <div>
                        {renderReadingMarkdown(article.content, theme)}
                    </div>
                    <div className="mt-12 pt-8 border-t-2">
                        <h2 className={`text-3xl font-bold font-display mb-4 ${theme === 'dark' ? 'text-yellow-300' : 'text-yellow-700'}`}>Dicas e Macetes</h2>
                        {renderReadingMarkdown(article.tips, theme)}
                    </div>
                </article>
            </div>
        </div>
    );
};

export default ReadingMode;
