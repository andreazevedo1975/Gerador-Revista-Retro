import React from 'react';
import { Magazine, MagazineStructure, GenerationState } from '../types';

interface MagazineComposerProps {
    magazine: Magazine;
    structure: MagazineStructure;
    generationStatus: Record<string, GenerationState>;
    onGenerateCover: () => void;
    onGenerateArticle: (index: number) => void;
    onGenerateAll: () => void;
    onViewMagazine: () => void;
}

const Spinner: React.FC = () => (
    <div className="w-8 h-8 border-4 border-t-4 border-t-fuchsia-500 border-gray-600 rounded-full animate-spin"></div>
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

const GenerateButton: React.FC<{ status: GenerationState, onClick: () => void, text: string }> = ({ status, onClick, text }) => (
    <button
        onClick={onClick}
        disabled={status === 'generating' || status === 'done'}
        className="bg-cyan-600 text-white font-bold py-2 px-5 hover:bg-cyan-700 disabled:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300 shadow-lg font-display text-sm"
    >
        {status === 'generating' ? <Spinner /> : text}
    </button>
);


const MagazineComposer: React.FC<MagazineComposerProps> = ({
    magazine,
    structure,
    generationStatus,
    onGenerateCover,
    onGenerateArticle,
    onGenerateAll,
    onViewMagazine,
}) => {
    const isAllDone = Object.values(generationStatus).every(s => s === 'done');
    const isGeneratingAnything = Object.values(generationStatus).some(s => s === 'generating');

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <header className="text-center">
                <h2 className="text-3xl md:text-4xl font-display text-yellow-300 mb-2">Compositor da Revista</h2>
                <p className="text-gray-400">Gere cada seção da sua revista. Quando tudo estiver pronto, clique em "Visualizar Revista".</p>
                <h3 className="text-2xl font-bold mt-4 text-cyan-300 break-words">{`"${magazine.title}"`}</h3>
            </header>

            <div className="flex justify-center items-center gap-4 p-4 bg-gray-800/50 rounded-lg">
                <button
                    onClick={onGenerateAll}
                    disabled={isGeneratingAnything || isAllDone}
                    className="bg-fuchsia-600 text-white font-bold py-3 px-8 hover:bg-fuchsia-700 disabled:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300 shadow-lg font-display text-base"
                >
                    Gerar Tudo
                </button>
                 <button
                    onClick={onViewMagazine}
                    disabled={!isAllDone}
                    className="bg-green-600 text-white font-bold py-3 px-8 hover:bg-green-700 disabled:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300 shadow-lg font-display text-base"
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
                                    <GenerateButton status={articleStatus} onClick={() => onGenerateArticle(index)} text="Gerar Artigo" />
                                </div>
                            </div>
                            {articleStatus === 'done' && (
                                <div className="grid grid-cols-3 gap-4 p-4 bg-gray-900/50 rounded">
                                    {generatedArticle.images.map(img => (
                                        <img key={img.id} src={img.url} alt={img.type} className="w-full h-auto object-cover rounded" />
                                    ))}
                                    <div className="col-span-3 text-sm text-gray-400 mt-2">
                                        <p className="font-bold">Conteúdo:</p>
                                        <p className="line-clamp-2">{generatedArticle.content || '...'}</p>
                                        <p className="font-bold mt-2">Dicas:</p>
                                        <p className="line-clamp-2">{generatedArticle.tips || '...'}</p>
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
        </div>
    );
};

export default MagazineComposer;