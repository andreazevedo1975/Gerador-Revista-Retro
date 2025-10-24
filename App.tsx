import React, { useState, useCallback } from 'react';
import { Magazine, MagazineStructure, GenerationState, CreationType } from './types';
import * as geminiService from './services/geminiService';
import MagazineViewer from './components/EbookViewer';
import LoadingOverlay from './components/LoadingOverlay';
import CreationHub from './components/CreationHub';
import CreateByTopic from './components/CreateByTopic';
import MagazineComposer from './components/MagazineComposer';

type View = 'hub' | 'create' | 'composer' | 'magazine';

const App: React.FC = () => {
    const [magazine, setMagazine] = useState<Magazine | null>(null);
    const [magazineStructure, setMagazineStructure] = useState<MagazineStructure | null>(null);
    const [generationStatus, setGenerationStatus] = useState<Record<string, GenerationState>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isGeneratingImage, setIsGeneratingImage] = useState<Record<string, boolean>>({});
    const [view, setView] = useState<View>('hub');
    const [currentCreationType, setCurrentCreationType] = useState<CreationType | null>(null);

    const addLoadingMessage = (message: string) => {
        setLoadingMessages(prev => [...prev, message]);
    };

    const handleGenerateStructure = async (topic: string, generationType: CreationType, isDeepMode: boolean) => {
        if (!topic.trim()) return;

        setIsLoading(true);
        setError(null);
        setMagazine(null);
        setMagazineStructure(null);
        setLoadingMessages([]);
        
        try {
            addLoadingMessage(isDeepMode ? 'Acessando arquivos secretos da Warp Zone...' : 'Consultando os anais dos games...');
            const structure = await geminiService.generateMagazineStructure(topic, isDeepMode);
            
            setMagazineStructure(structure);

            const status: Record<string, GenerationState> = { cover: 'pending' };
            structure.articles.forEach((_, index) => {
                status[`article-${index}`] = 'pending';
            });
            setGenerationStatus(status);

            const skeletonMagazine: Magazine = {
                title: structure.title,
                coverImagePrompt: structure.coverImagePrompt,
                coverImage: '',
                articles: structure.articles.map((articleStruct, index) => ({
                    id: `article-${index}`,
                    title: articleStruct.title,
                    contentPrompt: articleStruct.contentPrompt,
                    tips: '',
                    content: '',
                    images: articleStruct.imagePrompts.map((imgPrompt, i) => ({
                        id: `article-${index}-image-${i}`,
                        type: imgPrompt.type,
                        prompt: imgPrompt.prompt,
                        url: '',
                    })),
                })),
            };
            setMagazine(skeletonMagazine);
            setView('composer');

        } catch (err: any) {
            console.error(err);
            setError(`Ocorreu um erro ao gerar a estrutura da revista para "${topic}": ${err.message}. Tente novamente.`);
            setView('create');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateCover = useCallback(async () => {
        if (!magazine || !magazineStructure) return;

        setGenerationStatus(prev => ({ ...prev, cover: 'generating' }));

        try {
            const image = await geminiService.generateImage({
                prompt: magazine.coverImagePrompt, 
                type: 'cover'
            });
            setMagazine(prev => prev ? { ...prev, coverImage: image } : null);
            setGenerationStatus(prev => ({ ...prev, cover: 'done' }));
        } catch (err: any) {
            console.error("Failed to generate cover:", err);
            setError(`Falha ao gerar a capa: ${err.message}`);
            setGenerationStatus(prev => ({ ...prev, cover: 'error' }));
        }
    }, [magazine, magazineStructure]);

    const handleGenerateArticle = useCallback(async (articleIndex: number) => {
        if (!magazine || !magazineStructure) return;

        const articleId = `article-${articleIndex}`;
        const articleStruct = magazineStructure.articles[articleIndex];

        setGenerationStatus(prev => ({ ...prev, [articleId]: 'generating' }));

        try {
            // Generate text and images in parallel
            const [content, tips, images] = await Promise.all([
                geminiService.generateText(articleStruct.contentPrompt),
                geminiService.generateText(articleStruct.tipsPrompt),
                Promise.all(articleStruct.imagePrompts.map(imgPrompt =>
                    geminiService.generateImage({prompt: imgPrompt.prompt, type: imgPrompt.type})
                ))
            ]);

            setMagazine(prev => {
                if (!prev) return null;
                const newMagazine = JSON.parse(JSON.stringify(prev)); // Deep copy
                newMagazine.articles[articleIndex].content = content;
                newMagazine.articles[articleIndex].tips = tips;
                newMagazine.articles[articleIndex].images.forEach((img: any, i: number) => {
                    img.url = images[i];
                });
                return newMagazine;
            });

            setGenerationStatus(prev => ({ ...prev, [articleId]: 'done' }));

        } catch (err: any) {
            console.error(`Failed to generate article ${articleIndex}:`, err);
            setError(`Falha ao gerar o artigo "${articleStruct.title}": ${err.message}`);
            setGenerationStatus(prev => ({ ...prev, [articleId]: 'error' }));
        }
    }, [magazine, magazineStructure]);

    const handleGenerateAll = useCallback(() => {
        if (!magazine || !magazineStructure) return;

        handleGenerateCover();
        magazineStructure.articles.forEach((_, index) => {
            handleGenerateArticle(index);
        });
    }, [magazine, magazineStructure, handleGenerateCover, handleGenerateArticle]);
    
    const handleGenerate = (topic: string, type: CreationType, isDeepMode: boolean) => {
        let prompt = '';
        switch(type) {
            case 'console':
                prompt = `Crie uma revista completa sobre a história do console ${topic}, destacando seu impacto, legado e seus jogos mais icônicos.`;
                break;
            case 'game':
                prompt = `Crie uma revista fazendo uma análise aprofundada do jogo ${topic}, abordando sua história, gameplay, gráficos, som, curiosidades e dicas.`;
                break;
            case 'guide':
                prompt = `Crie uma revista focada em ser um guia completo de dicas, segredos e macetes para o jogo ${topic}. Inclua guias de chefes, localização de itens secretos e estratégias avançadas.`;
                break;
            case 'developer':
                prompt = `Crie uma revista sobre a história e o legado do estúdio ou desenvolvedor de jogos ${topic}. Destaque sua filosofia de design, seus maiores sucessos e seu impacto na indústria.`;
                break;
            case 'rivalry':
                prompt = `Crie uma revista sobre a famosa rivalidade da indústria de games: "${topic}". Analise os concorrentes, as estratégias de marketing e quem saiu vitorioso.`;
                break;
            case 'soundtrack':
                prompt = `Crie uma revista sobre a música e o som dos games, com foco em ${topic}. Analise as composições, a tecnologia de som da época e o impacto emocional das trilhas sonoras.`;
                break;
        }
        handleGenerateStructure(prompt, type, isDeepMode);
    };

    const handleSelectCreationType = (type: CreationType) => {
        setCurrentCreationType(type);
        setView('create');
    };

    const handleBackToHub = () => {
        setMagazine(null);
        setMagazineStructure(null);
        setGenerationStatus({});
        setError(null);
        setCurrentCreationType(null);
        setView('hub');
    };
    
    const handleViewMagazine = () => {
        setView('magazine');
    };

    const handleTextUpdate = useCallback((path: string, newText: string) => {
        setMagazine(prevMagazine => {
            if (!prevMagazine) return null;
            
            const newMagazine = JSON.parse(JSON.stringify(prevMagazine)); // Deep copy
            const keys = path.split('.');
            let current: any = newMagazine;
            
            for (let i = 0; i < keys.length - 1; i++) {
                const key = keys[i];
                const nextKey = keys[i+1];
                if (!isNaN(Number(nextKey))) { // Array index
                    current = current[key][Number(nextKey)];
                    i++;
                } else {
                    current = current[key];
                }
            }
            current[keys[keys.length - 1]] = newText;
            
            return newMagazine;
        });
    }, []);

    const handleImageRegenerate = useCallback(async (path: string, options: { quality: 'standard' | 'high'; modificationPrompt?: string; }) => {
        if (!magazine) return;

        const imageId = path;
        setIsGeneratingImage(prev => ({ ...prev, [imageId]: true }));

        try {
            let newImage: string;
            if (path === 'coverImage') {
                newImage = await geminiService.generateImage({
                    prompt: magazine.coverImagePrompt, 
                    type: 'cover',
                    quality: options.quality,
                    modificationPrompt: options.modificationPrompt
                });
            } else {
                const parts = path.split('-');
                const articleIndex = parseInt(parts[1], 10);
                const imageIndex = parseInt(parts[3], 10);
                
                const article = magazine.articles[articleIndex];
                const imageInfo = article?.images[imageIndex];

                if (!imageInfo) throw new Error("Imagem ou artigo não encontrado para regeneração.");
                newImage = await geminiService.generateImage({
                    prompt: imageInfo.prompt,
                    type: imageInfo.type,
                    quality: options.quality,
                    modificationPrompt: options.modificationPrompt
                });
            }
            
            setMagazine(prevMagazine => {
                if (!prevMagazine) return null;
                const newMagazine = JSON.parse(JSON.stringify(prevMagazine)); // Deep copy
                if (path === 'coverImage') {
                    newMagazine.coverImage = newImage;
                } else {
                    const parts = path.split('-');
                    const articleIndex = parseInt(parts[1], 10);
                    const imageIndex = parseInt(parts[3], 10);
                    newMagazine.articles[articleIndex].images[imageIndex].url = newImage;
                }
                return newMagazine;
            });

        } catch (err: any) {
            console.error(err);
            setError(`Falha ao gerar nova imagem. ${err.message}`);
        } finally {
            setIsGeneratingImage(prev => ({ ...prev, [imageId]: false }));
        }
    }, [magazine]);
    
    const renderContent = () => {
        if (error && !isLoading) {
             return (
                <div className="max-w-3xl mx-auto bg-red-900/50 p-4 mb-6 rounded-lg border border-red-500 text-center">
                    <p className="text-red-300">{error}</p>
                </div>
             );
        }

        switch(view) {
            case 'magazine':
                return magazine ? (
                    <MagazineViewer
                        magazine={magazine}
                        onTextUpdate={handleTextUpdate}
                        onImageRegenerate={handleImageRegenerate}
                        isGeneratingImage={isGeneratingImage}
                    />
                ) : null;
            case 'composer':
                return magazine && magazineStructure ? (
                    <MagazineComposer
                        magazine={magazine}
                        structure={magazineStructure}
                        generationStatus={generationStatus}
                        onGenerateCover={handleGenerateCover}
                        onGenerateArticle={handleGenerateArticle}
                        onGenerateAll={handleGenerateAll}
                        onViewMagazine={handleViewMagazine}
                    />
                ) : null;
             case 'create':
                return currentCreationType ? <CreateByTopic type={currentCreationType} onGenerate={handleGenerate} onBack={handleBackToHub} /> : null;
            case 'hub':
            default:
                return <CreationHub onSelectCreationType={handleSelectCreationType} />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
            {isLoading && <LoadingOverlay messages={loadingMessages} />}
            <header className="bg-gray-800/50 backdrop-blur-sm shadow-lg border-b border-fuchsia-500/30 p-4 sticky top-0 z-20">
                <div className="container mx-auto flex justify-center items-center">
                    <div className="flex items-center gap-4 relative w-full justify-center">
                        {(view !== 'hub') && (
                             <button
                                onClick={handleBackToHub}
                                className="absolute left-0 text-cyan-300 flex items-center gap-2 hover:text-yellow-300 transition-colors p-2 rounded-md hover:bg-fuchsia-500/50"
                                title="Voltar para Central de Criação"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                                </svg>
                            </button>
                        )}
                        <h1 className="text-xl md:text-2xl font-display text-cyan-300">Revista Retrô Gamer AI</h1>
                    </div>
                </div>
            </header>
            <main className="container mx-auto p-4 md:p-8 flex-grow">
               {renderContent()}
            </main>
            <footer className="text-center p-4 text-gray-500 text-sm">
                Copyright By André Azevedo
            </footer>
        </div>
    );
};

export default App;