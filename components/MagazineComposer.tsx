import React, { useState } from 'react';
import { Magazine, MagazineStructure, GenerationState, ArticleImage, MagazineHistoryEntry, ArticleImagePrompt } from '../types';
import HistoryPanel from './HistoryPanel';
import EditableText from './EditableText';

interface MagazineComposerProps {
    magazine: Magazine;
    structure: MagazineStructure;
    generationStatus: Record<string, GenerationState>;
    history: MagazineHistoryEntry[];
    isHistoryPanelOpen: boolean;
    onGenerateCover: (prompt: string) => void;
    onGenerateArticle: (index: number, contentPrompt: string, tipsPrompt: string, imagePrompts: ArticleImagePrompt[], quality: 'standard' | 'high') => void;
    onGenerateAll: () => void;
    onViewMagazine: () => void;
    onSaveToHistory: () => void;
    onRevertToVersion: (magazine: Magazine) => void;
    onToggleHistoryPanel: () => void;
    onPromptUpdate: (path: string, newText: string) => void;
    onResetCoverPrompt: () => void;
    onResetArticlePrompts: (index: number) => void;
}

const Spinner: React.FC = () => (
    <div className="w-6 h-6 border-4 border-t-4 border-t-white border-gray-600/50 rounded-full animate-spin"></div>
);

const ResetIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0 0 11.664 0M2.985 19.644L6.166 16.46m11.665-11.665h-4.992m0 0v4.992m0-4.993-3.181-3.183a8.25 8.25 0 0 0 -11.664 0M21.015 4.356L17.834 7.54m-11.665 11.665l3.181 3.183" />
    </svg>
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
    const isDone = status === 'done';
    const isDisabled = status === 'generating';

    let buttonText = text;
    let colorClasses = "bg-cyan-600 text-white hover:bg-cyan-700";

    if (isError) {
        buttonText = "Tentar Novamente";
        colorClasses = "bg-red-600 text-white hover:bg-red-700";
    } else if (isDone) {
        buttonText = "Gerar Novamente";
        colorClasses = "bg-purple-600 text-white hover:bg-purple-700";
    }
    
    const baseClasses = "font-bold py-2 px-5 transition-colors duration-300 shadow-lg font-display text-sm w-44 flex justify-center items-center h-10 rounded-md";
    if (isDisabled) {
        colorClasses += " disabled:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed";
    }

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
    onPromptUpdate,
    onResetCoverPrompt,
    onResetArticlePrompts
}) => {
    const [expandedArticleIndex, setExpandedArticleIndex] = useState<number | null>(null);
    const [qualitySelection, setQualitySelection] = useState<{ index: number; contentPrompt: string; tipsPrompt: string; imagePrompts: ArticleImagePrompt[] } | null>(null);
    const isAllDone = Object.values(generationStatus).every(s => s === 'done');
    const isGeneratingAnything = Object.values(generationStatus).some(s => s === 'generating');

    const handleTogglePreview = (index: number) => {
        setExpandedArticleIndex(prevIndex => (prevIndex === index ? null : index));
    };

    const handleConfirmGeneration = (quality: 'standard' | 'high') => {
        if (!qualitySelection) return;
        const { index, contentPrompt, tipsPrompt, imagePrompts } = qualitySelection;
        onGenerateArticle(index, contentPrompt, tipsPrompt, imagePrompts, quality);
        setQualitySelection(null);
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
            {qualitySelection && (
                <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setQualitySelection(null)}>
                    <div className="bg-gray-800 rounded-lg p-6 border border-fuchsia-500/30 w-full max-w-md" onClick={e => e.stopPropagation()}>
                        <h3 className="text-2xl font-display text-yellow-300 mb-2 text-center">Escolha a Qualidade</h3>
                        <p className="text-gray-400 text-center mb-6">"Alta Qualidade" usa um modelo mais avançado para imagens com mais detalhes, mas a geração pode ser mais lenta.</p>
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <button 
                                onClick={() => handleConfirmGeneration('standard')} 
                                className="flex-1 text-center px-4 py-3 text-lg text-gray-200 bg-gray-700 hover:bg-fuchsia-600 rounded-md transition-colors font-display"
                            >
                                Padrão
                            </button>
                            <button 
                                onClick={() => handleConfirmGeneration('high')} 
                                className="flex-1 text-center px-4 py-3 text-lg text-gray-200 bg-gray-700 hover:bg-fuchsia-600 rounded-md transition-colors font-display"
                            >
                                Alta Qualidade ✨
                            </button>
                        </div>
                        <button onClick={() => setQualitySelection(null)} className="mt-6 w-full text-center text-gray-400 hover:text-white transition-colors">
                            Cancelar
                        </button>
                    </div>
                </div>
            )}
            <header className="text-center">
                <h2 className="text-3xl md:text-4xl font-display text-yellow-300 mb-2">Compositor da Revista</h2>
                <p className="text-lg text-gray-400 leading-relaxed">Gere cada seção da sua revista. Você pode editar os prompts antes de gerar. Quando tudo estiver pronto, clique em "Visualizar Revista".</p>
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
                            <div className="flex items-center gap-4">
                                <h4 className="text-2xl font-display text-cyan-400">Capa</h4>
                                <button
                                    onClick={onResetCoverPrompt}
                                    className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors py-1 px-3 rounded-md hover:bg-gray-700"
                                    title="Resetar prompt para o original"
                                >
                                    <ResetIcon className="w-4 h-4" />
                                    <span>Resetar Prompt</span>
                                </button>
                            </div>
                            <p className="text-sm text-gray-400 mt-1">Edite o prompt para refinar a arte da capa.</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <StatusIndicator status={generationStatus.cover} />
                            <GenerateButton status={generationStatus.cover} onClick={() => onGenerateCover(structure.coverImagePrompt)} text="Gerar Capa" />
                        </div>
                    </div>
                    <EditableText
                        tag="div"
                        text={structure.coverImagePrompt}
                        onSave={(newText) => onPromptUpdate('coverImagePrompt', newText)}
                        className="text-base text-gray-300 bg-gray-900/50 p-3 rounded-md border border-gray-700 mb-4"
                        isTextArea
                    />
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
                                    <button
                                        onClick={() => handleTogglePreview(index)}
                                        className="text-cyan-300 hover:text-yellow-300 transition-colors font-display text-sm flex items-center gap-1 p-2 rounded-md hover:bg-cyan-500/10"
                                        title={isExpanded ? 'Ocultar detalhes' : 'Mostrar detalhes e prompts'}
                                    >
                                        <span>{isExpanded ? 'Ocultar' : 'Detalhes'}</span>
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                                        </svg>
                                    </button>
                                    <GenerateButton status={articleStatus} onClick={() => setQualitySelection({ index, contentPrompt: article.contentPrompt, tipsPrompt: article.tipsPrompt, imagePrompts: article.imagePrompts })} text="Gerar Artigo" />
                                </div>
                            </div>

                            {isExpanded && (
                                <div className="mt-4 pt-4 border-t border-cyan-500/20 animate-slide-down-fade-in">
                                    <div className="flex justify-between items-center mb-4">
                                        <h5 className="font-display text-xl text-yellow-300">
                                            Prompts de Geração
                                        </h5>
                                        <button
                                            onClick={() => onResetArticlePrompts(index)}
                                            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors py-1 px-3 rounded-md hover:bg-gray-700"
                                            title="Resetar prompts para o original"
                                        >
                                            <ResetIcon className="w-4 h-4" />
                                            <span>Resetar Prompts</span>
                                        </button>
                                    </div>

                                    {/* PROMPTS SECTION */}
                                    <div className="space-y-4 mb-6">
                                        <div>
                                            <h6 className="font-display text-lg text-cyan-400 mb-2">Prompt do Conteúdo</h6>
                                            <EditableText
                                                tag="div"
                                                text={article.contentPrompt}
                                                onSave={(newText) => onPromptUpdate(`articles.${index}.contentPrompt`, newText)}
                                                className="text-base text-gray-300 bg-gray-900/50 p-3 rounded-md border border-gray-700"
                                                isTextArea
                                            />
                                        </div>
                                        <div>
                                            <h6 className="font-display text-lg text-cyan-400 mb-2">Prompt de Dicas</h6>
                                            <EditableText
                                                tag="div"
                                                text={article.tipsPrompt}
                                                onSave={(newText) => onPromptUpdate(`articles.${index}.tipsPrompt`, newText)}
                                                className="text-base text-gray-300 bg-gray-900/50 p-3 rounded-md border border-gray-700"
                                                isTextArea
                                            />
                                        </div>
                                        <div>
                                            <h6 className="font-display text-lg text-cyan-400 mb-2">Prompts de Imagem</h6>
                                            <div className="space-y-3">
                                                {article.imagePrompts.map((imgPrompt, imgIndex) => (
                                                    <div key={imgIndex}>
                                                        <label className="text-xs font-bold text-cyan-400 uppercase">{imgPrompt.type}</label>
                                                        <EditableText
                                                            tag="div"
                                                            text={imgPrompt.prompt}
                                                            onSave={(newText) => onPromptUpdate(`articles.${index}.imagePrompts.${imgIndex}.prompt`, newText)}
                                                            className="text-base text-gray-300 bg-gray-900/50 p-3 rounded-md border border-gray-700"
                                                            isTextArea
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* PREVIEW SECTION (only if done) */}
                                    {articleStatus === 'done' && (
                                        <div>
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