import React, { useState } from 'react';
import { Magazine, MagazineStructure, GenerationState, ArticleImage, MagazineHistoryEntry } from '../types';
import HistoryPanel from './HistoryPanel';

interface MagazineComposerProps {
    magazine: Magazine;
    structure: MagazineStructure;
    generationStatus: Record<string, GenerationState>;
    history: MagazineHistoryEntry[];
    isHistoryPanelOpen: boolean;
    onGenerateCover: () => void;
    onGenerateArticle: (index: number) => void;
    onGenerateAll: () => void;
    onViewMagazine: () => void;
    onSaveToHistory: () => void;
    onRevertToVersion: (magazine: Magazine) => void;
    onToggleHistoryPanel: () => void;
}

const Spinner: React.FC = () => (
    <div className="w-6 h-6 border-4 border-t-4 border-t-white border-gray-600/50 rounded-full animate-spin"></div>
);

const StatusIndicator: React.FC<{ status: GenerationState }> = ({ status }) => {
    switch (status) {
        case 'pending':
            return <span className="text-xs font-bold text-gray-400">PENDENTE</span>;
        case 'generating':
            return <span className="text-xs font-bold text-yellow-400 animate-pulse">GERANDO...</span>;
        case 'done':
            return <span className="text-xs font-bold text-green-400">CONCLUÍDO</span>;
        case 'error':
            return <span className="text-xs font-bold text-red-400">ERRO</span>;
        default:
            return null;
    }
};

const GenerateButton: React.FC<{ status: GenerationState, onClick: () => void, text: string }> = ({ status, onClick, text }) => {
    const isError = status === 'error';
    const buttonText = isError ? "Tentar Novamente" : text;
    const isDisabled = status === 'generating' || status === 'done';

    const baseClasses = "font-bold py-2 px-5 transition-colors duration-300 shadow-lg font-display text-sm w-44 flex justify-center items-center h-10 rounded-md";
    let colorClasses = "bg-cyan-600 text-white hover:bg-cyan-700";
    if (isError) colorClasses = "bg-red-600 text-white hover:bg-red-700";
    if (isDisabled) colorClasses += " disabled:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed";

    return (
        <button
            onClick={onClick}
            disabled={isDisabled}
            className={`${baseClasses} ${colorClasses}`}
        >
            {status === 'generating' ? <Spinner /> : buttonText}
        </button>
    );
};


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
                <ListTag key={`list-${elements.length}`} className={`${listStyle} list-inside space-y-2 mb-4 pl-4 text-gray-300 leading-loose text-base`}>
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
            if (currentListType === 'ol') flushList();
            currentListType = 'ul';
            listItems.push(trimmedLine.substring(2).trim());
        } else if (isOrderedItem) {
            if (currentListType === 'ul') flushList();
            currentListType = 'ol';
            listItems.push(trimmedLine.substring(trimmedLine.indexOf(' ') + 1).trim());
        } else {
            flushList();
            if (trimmedLine !== '') {
                elements.push(<p key={index} className="mb-4 text-gray-300 leading-loose text-base">{renderLine(line)}</p>);
            }
        }
    });

    flushList();
    return elements;
};

const ImageGalleryPreview: React.FC<{ images: ArticleImage[] }> = ({ images }) => {
    const gameplay = images.find(img => img.type === 'gameplay');
    const others = images.filter(img => img.type !== 'gameplay');

    const ImageBox: React.FC<{image: ArticleImage}> = ({ image }) => (
        <div className="relative w-full h-full">
            <img src={image.url} alt={`Pré-visualização do tipo ${image.type}`} className="w-full h-full object-cover rounded shadow-md border-2 border-cyan-500/30" />
        </div>
    );

    return (
        <div className="grid grid-cols-2 grid-rows-2 gap-4 mb-6 h-80"> 
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


const MagazineComposer: React.FC<MagazineComposerProps> = ({
    magazine,
    structure,
    generationStatus,
    history,
    isHistoryPanelOpen,
    onGenerateCover,
    onGenerateArticle,
    onGenerateAll,
    onViewMagazine,
    onSaveToHistory,
    onRevertToVersion,
    onToggleHistoryPanel,
}) => {
    const [expandedArticleIndex, setExpandedArticleIndex] = useState<number | null>(null);
    const isAllDone = Object.values(generationStatus).every(s => s === 'done');
    const isGeneratingAnything = Object.values(generationStatus).some(s => s === 'generating');

    const handleTogglePreview = (index: number) => {
        setExpandedArticleIndex(prevIndex => (prevIndex === index ? null : index));
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
             {isHistoryPanelOpen && (
                <HistoryPanel
                    history={history}
                    onRevert={onRevertToVersion}
                    onClose={onToggleHistoryPanel}
                />
            )}
            <header className="text-center">
                <h2 className="text-3xl md:text-4xl font-display text-yellow-300 mb-2">Compositor da Revista</h2>
                <p className="text-lg text-gray-400 leading-relaxed">Gere cada seção da sua revista. Quando tudo estiver pronto, clique em "Visualizar Revista".</p>
                <h3 className="text-2xl font-display mt-4 text-cyan-300 break-words">{`"${magazine.title}"`}</h3>
            </header>

            <div className="flex justify-center items-center gap-2 flex-wrap p-4 bg-gray-800/50 rounded-lg">
                 <button
                    onClick={onSaveToHistory}
                    className="bg-blue-600 text-white font-bold py-3 px-6 hover:bg-blue-700 transition-colors duration-300 shadow-lg font-display text-sm"
                >
                    Salvar Versão
                </button>
                 <button
                    onClick={onToggleHistoryPanel}
                    className="bg-gray-700 text-white font-bold py-3 px-6 hover:bg-gray-600 transition-colors duration-300 shadow-lg font-display text-sm"
                >
                    Histórico ({history.length})
                </button>
                <button
                    onClick={onGenerateAll}
                    disabled={isGeneratingAnything || isAllDone}
                    className="bg-fuchsia-600 text-white font-bold py-3 px-6 hover:bg-fuchsia-700 disabled:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300 shadow-lg font-display text-sm"
                >
                    Gerar Tudo
                </button>
                 <button
                    onClick={onViewMagazine}
                    disabled={!isAllDone}
                    className="bg-green-600 text-white font-bold py-3 px-6 hover:bg-green-700 disabled:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300 shadow-lg font-display text-sm"
                >
                    Visualizar Revista
                </button>
            </div>

            <div className="space-y-6">
                {/* Cover Section */}
                <section className="bg-gray-800 p-6 rounded-lg shadow-lg border border-fuchsia-500/20">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h4 className="text-2xl font-display text-cyan-400">Capa</h4>
                            <p className="text-sm text-gray-400 italic max-w-md truncate" title={structure.coverImagePrompt}>
                                Prompt: {structure.coverImagePrompt}
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <StatusIndicator status={generationStatus.cover} />
                            <GenerateButton status={generationStatus.cover} onClick={onGenerateCover} text="Gerar Capa" />
                        </div>
                    </div>
                     <div className="flex justify-center items-center bg-gray-900/50 min-h-[320px] rounded">
                        {generationStatus.cover === 'generating' && <Spinner />}
                        {magazine.coverImage && <img src={magazine.coverImage} alt="Capa gerada" className="max-h-80 object-contain rounded" />}
                        {generationStatus.cover === 'pending' && <p className="text-gray-500">Aguardando geração da capa...</p>}
                        {generationStatus.cover === 'error' && <p className="text-red-400">Falha ao gerar a capa.</p>}
                    </div>
                </section>

                {/* Articles Section */}
                {structure.articles.map((article, index) => {
                    const articleId = `article-${index}`;
                    const articleStatus = generationStatus[articleId];
                    const generatedArticle = magazine.articles[index];
                    const isExpanded = expandedArticleIndex === index;

                    return (
                        <section key={articleId} className="bg-gray-800 p-6 rounded-lg shadow-lg border border-cyan-500/20">
                             <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h4 className="text-2xl font-display text-cyan-400">
                                        <span className="font-sans font-bold text-gray-500">{index + 1}.</span> {article.title}
                                    </h4>
                                     <p className="text-sm text-gray-400">3 Imagens | Conteúdo | Dicas</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <StatusIndicator status={articleStatus} />
                                    {articleStatus === 'done' && (
                                        <button
                                            onClick={() => handleTogglePreview(index)}
                                            className="text-cyan-300 hover:text-yellow-300 transition-colors font-display text-sm flex items-center gap-1 p-2 rounded-md hover:bg-cyan-500/10"
                                            title={isExpanded ? 'Ocultar pré-visualização' : 'Pré-visualizar artigo'}
                                        >
                                            <span>{isExpanded ? 'Ocultar' : 'Visualizar'}</span>
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                                            </svg>
                                        </button>
                                    )}
                                    <GenerateButton status={articleStatus} onClick={() => onGenerateArticle(index)} text="Gerar Artigo" />
                                </div>
                            </div>

                            {isExpanded && articleStatus === 'done' && (
                                <div className="mt-4 pt-4 border-t border-cyan-500/20 animate-slide-down-fade-in">
                                    <h5 className="font-display text-xl text-yellow-300 mb-4">Pré-visualização do Artigo</h5>
                                    <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                                        <ImageGalleryPreview images={generatedArticle.images} />
                                        <div className="space-y-6">
                                            <div>
                                                <h6 className="font-display text-lg text-cyan-400 mb-2">Conteúdo do Artigo</h6>
                                                <div className="bg-gray-800 p-4 rounded-md max-h-60 overflow-y-auto border border-gray-600">
                                                    {renderMarkdown(generatedArticle.content || 'Nenhum conteúdo gerado.')}
                                                </div>
                                            </div>
                                            <div className="mt-4 p-4 border-2 border-dashed border-yellow-400/50 bg-black/20 rounded-lg">
                                                <h6 className="font-display text-lg text-yellow-300 mb-2">Dicas e Macetes</h6>
                                                <div className="max-h-60 overflow-y-auto">
                                                    {renderMarkdown(generatedArticle.tips || 'Nenhuma dica gerada.')}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {articleStatus === 'generating' && (
                                <div className="flex justify-center items-center min-h-[120px]">
                                    <Spinner />
                                </div>
                            )}
                        </section>
                    );
                })}
            </div>
            <style>{`
                @keyframes slide-down-fade-in {
                    from { opacity: 0; transform: translateY(-10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-slide-down-fade-in {
                    animation: slide-down-fade-in 0.5s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default MagazineComposer;