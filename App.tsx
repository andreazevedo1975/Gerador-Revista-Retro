import React, { useState, useCallback, useEffect } from 'react';
import { Magazine, MagazineStructure, GenerationState, CreationType, MagazineHistoryEntry, ImageType, ArticleImagePrompt, VisualIdentity, EditorialConceptInputs, EditorialConceptData, FinalMagazineDraft } from './types';
import * as geminiService from './services/geminiService';
import MagazineViewer from './components/EbookViewer';
import LoadingOverlay from './components/LoadingOverlay';
import CreationHub from './components/CreationHub';
import CreateByTopic from './components/CreateByTopic';
import MagazineComposer from './components/MagazineComposer';
import LogoGenerator from './components/LogoGenerator';
import EditorialConceptCreator from './components/EditorialConceptCreator';
import EditorialConceptViewer from './components/EditorialConceptViewer';

type View = 'hub' | 'create' | 'composer' | 'finalReview' | 'logoGenerator' | 'editorialConceptCreator' | 'editorialConceptViewer';

const delay = (ms: number) => new Promise(res => setTimeout(res, ms));
const SAVE_KEY = 'retroGamerSaveData';
const HISTORY_KEY = 'retroGamerHistory';
const IDENTITY_KEY = 'retroGamerIdentity';
const API_CALL_DELAY = 4000; // 4 seconds, to stay within ~15 requests/minute rate limit.

const App: React.FC = () => {
    const [magazine, setMagazine] = useState<Magazine | null>(null);
    const [magazineStructure, setMagazineStructure] = useState<MagazineStructure | null>(null);
    const [initialStructure, setInitialStructure] = useState<MagazineStructure | null>(null);
    const [generationStatus, setGenerationStatus] = useState<Record<string, GenerationState>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [isGeneratingAll, setIsGeneratingAll] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isGeneratingImage, setIsGeneratingImage] = useState<Record<string, boolean>>({});
    const [view, setView] = useState<View>('hub');
    const [currentCreationType, setCurrentCreationType] = useState<CreationType | null>(null);
    const [history, setHistory] = useState<MagazineHistoryEntry[]>([]);
    const [isHistoryPanelOpen, setIsHistoryPanelOpen] = useState(false);
    const [visualIdentity, setVisualIdentity] = useState<VisualIdentity | null>(null);
    
    // Logo Generator State
    const [generatedLogo, setGeneratedLogo] = useState<string | null>(null);
    const [isGeneratingLogo, setIsGeneratingLogo] = useState(false);
    const [logoError, setLogoError] = useState<string | null>(null);

    // Editorial Concept State
    const [editorialConcept, setEditorialConcept] = useState<EditorialConceptData | null>(null);

    // Final Draft State
    const [finalMagazineDraft, setFinalMagazineDraft] = useState<FinalMagazineDraft>({});


    // Load visual identity on mount
    useEffect(() => {
        try {
            const savedIdentityJSON = localStorage.getItem(IDENTITY_KEY);
            if (savedIdentityJSON) {
                setVisualIdentity(JSON.parse(savedIdentityJSON));
            }
        } catch (error) {
            console.error("Falha ao carregar identidade visual:", error);
        }
    }, []);

    // Save magazine state to localStorage whenever it changes
    useEffect(() => {
        if (magazine && (view === 'composer')) { // Only save during composition
            try {
                // Save a "light" version without base64 image data to prevent quota errors.
                const lightMagazine = {
                    ...magazine,
                    logoUrl: '',
                    coverImage: '',
                    articles: magazine.articles.map(article => ({
                        ...article,
                        images: article.images.map(image => ({
                            ...image,
                            url: '',
                        })),
                    })),
                };
                const saveData = {
                    magazine: lightMagazine,
                    magazineStructure: magazineStructure,
                };
                localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
            } catch (error) {
                console.error("Falha ao salvar o estado da revista:", error);
            }
        }
    }, [magazine, magazineStructure, view]);

    const addLoadingMessage = useCallback((message: string) => {
        setLoadingMessages(prev => [...prev, message]);
    }, []);

    const handleGenerateStructure = async (topic: string, generationType: CreationType, isDeepMode: boolean) => {
        if (!topic.trim()) return;

        setIsLoading(true);
        setError(null);
        setMagazine(null);
        setMagazineStructure(null);
        setInitialStructure(null);
        setLoadingMessages([]);
        
        try {
            addLoadingMessage(isDeepMode ? 'Acessando arquivos secretos da Warp Zone...' : 'Consultando os anais dos games...');
            const structure = await geminiService.generateMagazineStructure(topic, isDeepMode, visualIdentity?.magazineName);
            
            setMagazineStructure(structure);
            setInitialStructure(structure);

            const status: Record<string, GenerationState> = { cover: 'pending' };
            structure.articles.forEach((_, index) => {
                status[`article-${index}`] = 'pending';
            });
            setGenerationStatus(status);

            const newId = `mag_${Date.now()}`;
            const skeletonMagazine: Magazine = {
                id: newId,
                title: structure.title,
                logoUrl: visualIdentity?.logoUrl,
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
            setHistory([]); // Reset history for new magazine
            setView('composer');

        } catch (err: any) {
            console.error(err);
            setError(`Ocorreu um erro ao gerar a estrutura da revista para "${topic}": ${err.message}. Tente novamente.`);
            setView('create');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateCover = useCallback(async (prompt: string) => {
        if (!magazine || !magazineStructure) return;

        addLoadingMessage("Desenhando a capa em 16-bits...");
        setGenerationStatus(prev => ({ ...prev, cover: 'generating' }));
        setError(null);

        try {
            const image = await geminiService.generateImage({
                prompt: prompt,
                type: 'cover'
            });
            setMagazine(prev => prev ? { ...prev, coverImage: image } : null);
            setGenerationStatus(prev => ({ ...prev, cover: 'done' }));
            addLoadingMessage("✅ Capa finalizada com sucesso!");
        } catch (err: any) {
            console.error("Failed to generate cover:", err);
            setError(`Falha ao gerar a capa: ${err.message}`);
            setGenerationStatus(prev => ({ ...prev, cover: 'error' }));
            addLoadingMessage(`❌ Erro ao criar a capa.`);
        }
    }, [magazine, magazineStructure, addLoadingMessage]);

    const handleGenerateArticle = useCallback(async (
        articleIndex: number,
        contentPrompt: string,
        tipsPrompt: string,
        imagePrompts: ArticleImagePrompt[],
        quality: 'standard' | 'high' = 'standard'
    ) => {
        if (!magazine || !magazineStructure) return;

        const articleId = `article-${articleIndex}`;
        const articleStruct = magazineStructure.articles[articleIndex];

        addLoadingMessage(`Iniciando artigo: "${articleStruct.title}"...`);
        setGenerationStatus(prev => ({ ...prev, [articleId]: 'generating' }));
        setError(null);

        try {
            addLoadingMessage(`- Gerando texto principal do artigo ${articleIndex + 1}...`);
            const content = await geminiService.generateText(contentPrompt);
            
            addLoadingMessage(`- Procurando dicas e segredos...`);
            await delay(API_CALL_DELAY);
            const tips = await geminiService.generateText(tipsPrompt);
            
            const images: string[] = [];
            for (const [i, imgPrompt] of imagePrompts.entries()) {
                addLoadingMessage(`- Criando imagem ${i + 1}/3 do artigo ${articleIndex + 1}...`);
                await delay(API_CALL_DELAY);
                const imageUrl = await geminiService.generateImage({ prompt: imgPrompt.prompt, type: imgPrompt.type, quality });
                images.push(imageUrl);
            }

            setMagazine(prev => {
                if (!prev) return null;
                const newArticles = [...prev.articles];
                newArticles[articleIndex] = {
                    ...newArticles[articleIndex],
                    content,
                    tips,
                    images: newArticles[articleIndex].images.map((img, i) => ({
                        ...img,
                        url: images[i],
                    })),
                };
                return { ...prev, articles: newArticles };
            });

            setGenerationStatus(prev => ({ ...prev, [articleId]: 'done' }));
            addLoadingMessage(`✅ Artigo "${articleStruct.title}" completo!`);

        } catch (err: any) {
            console.error(`Failed to generate article ${articleIndex}:`, err);
            setError(`Falha ao gerar o artigo "${articleStruct.title}": ${err.message}`);
            setGenerationStatus(prev => ({ ...prev, [articleId]: 'error' }));
            addLoadingMessage(`❌ Erro ao gerar o artigo: "${articleStruct.title}".`);
        }
    }, [magazine, magazineStructure, addLoadingMessage]);


    const handleGenerateAll = useCallback(async () => {
        if (!magazine || !magazineStructure) return;
    
        setIsGeneratingAll(true);
        setLoadingMessages([]);
        setError(null);
    
        addLoadingMessage("Iniciando a criação completa da revista...");
        await delay(1000);
    
        // Use the latest prompts from the structure
        await handleGenerateCover(magazineStructure.coverImagePrompt);
    
        for (let i = 0; i < magazineStructure.articles.length; i++) {
            await delay(API_CALL_DELAY);
            const articleStruct = magazineStructure.articles[i];
            await handleGenerateArticle(i, articleStruct.contentPrompt, articleStruct.tipsPrompt, articleStruct.imagePrompts);
        }
        
        addLoadingMessage("Geração concluída. Verifique o resultado no compositor.");
        await delay(2000); // Give user time to read final message
        
        setIsGeneratingAll(false);
    
    }, [magazine, magazineStructure, handleGenerateCover, handleGenerateArticle, addLoadingMessage]);
    
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
            case 'cover_choice':
                prompt = `Crie uma revista completa sobre capas de jogos com o tema "${topic}". A revista deve analisar o design, o impacto e a arte de várias capas icônicas, comparando-as e, em um artigo final, argumentar qual é a melhor e por quê.`;
                break;
        }
        handleGenerateStructure(prompt, type, isDeepMode);
    };

    const handleSelectCreationType = (type: CreationType) => {
        setCurrentCreationType(type);
        if (type === 'editorial_concept') {
            setView('editorialConceptCreator');
        } else {
            setView('create');
        }
    };

    const handleBackToHub = () => {
        // Don't clear the draft, but clear transient states
        setMagazine(null);
        setMagazineStructure(null);
        setInitialStructure(null);
        setGenerationStatus({});
        setError(null);
        setCurrentCreationType(null);
        setGeneratedLogo(null);
        setIsGeneratingLogo(false);
        setLogoError(null);
        setEditorialConcept(null);
        setView('hub');
    };
    
    const handleConfirmMagazineAndGoToReview = () => {
        if (magazine) {
            setFinalMagazineDraft(prev => ({...prev, magazine: magazine}));
            setView('finalReview');
        }
    };

    const handleTextUpdate = useCallback((path: string, newText: string) => {
        setMagazine(prevMagazine => {
            if (!prevMagazine) return null;

            const keys = path.split('.');
            
            if (keys.length === 1 && keys[0] === 'title') {
                return { ...prevMagazine, title: newText };
            }
            
            if (keys.length === 3 && keys[0] === 'articles') {
                const articleIndex = parseInt(keys[1], 10);
                const property = keys[2] as 'title' | 'content' | 'tips';

                const newArticles = [...prevMagazine.articles];
                const oldArticle = newArticles[articleIndex];
                
                if (oldArticle && oldArticle[property] !== newText) {
                     newArticles[articleIndex] = {
                        ...oldArticle,
                        [property]: newText
                    };
                    return { ...prevMagazine, articles: newArticles };
                }
            }
            
            return prevMagazine;
        });
    }, []);

    const handlePromptUpdate = useCallback((path: string, newText: string) => {
        const keys = path.split('.');
        
        // Update magazineStructure
        setMagazineStructure(prev => {
            if (!prev) return null;
            const newStructure = JSON.parse(JSON.stringify(prev)); // Deep copy
    
            if (keys.length === 1 && keys[0] === 'coverImagePrompt') {
                newStructure.coverImagePrompt = newText;
            } else if (keys.length === 3 && keys[0] === 'articles') {
                const index = parseInt(keys[1], 10);
                const prop = keys[2] as 'contentPrompt' | 'tipsPrompt';
                newStructure.articles[index][prop] = newText;
            } else if (keys.length === 5 && keys[0] === 'articles' && keys[2] === 'imagePrompts' && keys[4] === 'prompt') {
                const articleIndex = parseInt(keys[1], 10);
                const imageIndex = parseInt(keys[3], 10);
                newStructure.articles[articleIndex].imagePrompts[imageIndex].prompt = newText;
            }
    
            return newStructure;
        });
    
        // Update magazine skeleton prompts for consistency
        setMagazine(prev => {
            if (!prev) return null;
            const newMagazine = JSON.parse(JSON.stringify(prev));
    
            if (keys.length === 1 && keys[0] === 'coverImagePrompt') {
                newMagazine.coverImagePrompt = newText;
            } else if (keys.length === 3 && keys[0] === 'articles' && keys[2] === 'contentPrompt') {
                const index = parseInt(keys[1], 10);
                newMagazine.articles[index].contentPrompt = newText;
            } else if (keys.length === 5 && keys[0] === 'articles' && keys[2] === 'imagePrompts' && keys[4] === 'prompt') {
                const articleIndex = parseInt(keys[1], 10);
                const imageIndex = parseInt(keys[3], 10);
                newMagazine.articles[articleIndex].images[imageIndex].prompt = newText;
            }
    
            return newMagazine;
        });
    
    }, []);

    const handleResetCoverPrompt = useCallback(() => {
        if (!initialStructure || !magazineStructure) return;

        const originalCoverPrompt = initialStructure.coverImagePrompt;

        // Update the editable magazineStructure
        setMagazineStructure(prev => {
            if (!prev) return null;
            return { ...prev, coverImagePrompt: originalCoverPrompt };
        });

        // Update the magazine skeleton for consistency
        setMagazine(prev => {
            if (!prev) return null;
            return { ...prev, coverImagePrompt: originalCoverPrompt };
        });

    }, [initialStructure, magazineStructure]);

    const handleResetArticlePrompts = useCallback((articleIndex: number) => {
        if (!initialStructure || !magazineStructure) return;

        const originalArticleStructure = initialStructure.articles[articleIndex];

        // Update the editable magazineStructure
        const newStructure = { ...magazineStructure };
        newStructure.articles = [...magazineStructure.articles];
        newStructure.articles[articleIndex] = originalArticleStructure;
        setMagazineStructure(newStructure);

        // Update the magazine skeleton for consistency
        setMagazine(prev => {
            if (!prev) return null;
            const newMagazine = { ...prev };
            newMagazine.articles = [...prev.articles];

            const newArticle = { ...newMagazine.articles[articleIndex] };
            newArticle.contentPrompt = originalArticleStructure.contentPrompt;
            newArticle.images = newArticle.images.map((img, i) => ({
                ...img,
                prompt: originalArticleStructure.imagePrompts[i].prompt,
                type: originalArticleStructure.imagePrompts[i].type,
            }));
            
            newMagazine.articles[articleIndex] = newArticle;
            return newMagazine;
        });

    }, [initialStructure, magazineStructure]);

    const handleImageRegenerate = useCallback(async (path: string, options: { quality: 'standard' | 'high'; modificationPrompt?: string; }) => {
        if (!magazine) return;

        const imageId = path;
        setIsGeneratingImage(prev => ({ ...prev, [imageId]: true }));
        setError(null);

        try {
            let newImage: string;
            if (path === 'coverImage') {
                newImage = await geminiService.generateImage({
                    prompt: magazine.coverImagePrompt, 
                    type: 'cover',
                    quality: options.quality,
                    modificationPrompt: options.modificationPrompt,
                    isRegeneration: true,
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
                    modificationPrompt: options.modificationPrompt,
                    isRegeneration: true,
                });
            }
            
            setMagazine(prevMagazine => {
                if (!prevMagazine) return null;
                if (path === 'coverImage') {
                    return { ...prevMagazine, coverImage: newImage };
                } else {
                    const parts = path.split('-');
                    const articleIndex = parseInt(parts[1], 10);
                    const imageIndex = parseInt(parts[3], 10);
                    
                    const newArticles = [...prevMagazine.articles];
                    const newImages = [...newArticles[articleIndex].images];
                    newImages[imageIndex] = { ...newImages[imageIndex], url: newImage };
                    newArticles[articleIndex] = { ...newArticles[articleIndex], images: newImages };
                    
                    return { ...prevMagazine, articles: newArticles };
                }
            });

        } catch (err: any) {
            console.error(err);
            setError(`Falha ao gerar nova imagem. ${err.message}`);
        } finally {
            setIsGeneratingImage(prev => ({ ...prev, [imageId]: false }));
        }
    }, [magazine]);
    
    const hasSavedMagazine = (): boolean => {
        try {
            return !!localStorage.getItem(SAVE_KEY);
        } catch (error) {
            console.error("Não foi possível verificar a revista salva:", error);
            return false;
        }
    };

    const handleLoadSavedMagazine = () => {
        try {
            const savedDataJSON = localStorage.getItem(SAVE_KEY);
            if (savedDataJSON) {
                let { magazine: savedMagazine, magazineStructure: savedStructure } = JSON.parse(savedDataJSON);

                if (!savedMagazine || !savedStructure) {
                    setError("Não foi possível carregar a revista salva. O arquivo pode estar corrompido.");
                    localStorage.removeItem(SAVE_KEY);
                    return;
                }
                
                if (!savedMagazine.id) {
                    savedMagazine.id = `mag_${Date.now()}`;
                }

                if (visualIdentity?.logoUrl) {
                    savedMagazine.logoUrl = visualIdentity.logoUrl;
                }

                setMagazine(savedMagazine);
                setMagazineStructure(savedStructure);
                setInitialStructure(savedStructure);

                // Load history
                const allHistoriesJSON = localStorage.getItem(HISTORY_KEY);
                if (allHistoriesJSON) {
                    const allHistories = JSON.parse(allHistoriesJSON);
                    const loadedHistory = allHistories[savedMagazine.id] || [];
                    setHistory(loadedHistory);
                } else {
                    setHistory([]);
                }


                // Reconstruct status to allow regeneration of missing images
                const status: Record<string, GenerationState> = { cover: 'pending' };
                savedMagazine.articles.forEach((_: any, index: number) => {
                    status[`article-${index}`] = 'pending';
                });
                setGenerationStatus(status);
                
                // Go to the composer to finish generating
                setView('composer');
            } else {
                setError("Nenhuma revista salva foi encontrada.");
            }
        } catch (error) {
            console.error("Falha ao carregar a revista salva:", error);
            setError("Não foi possível carregar a revista salva. O arquivo pode estar corrompido.");
        }
    };

    const handleSaveToHistory = useCallback(() => {
        if (!magazine) return;
    
        const lightMagazine = {
            ...magazine,
            coverImage: '',
            articles: magazine.articles.map(article => ({
                ...article,
                images: article.images.map(image => ({ ...image, url: '' })),
            })),
        };

        const newEntry: MagazineHistoryEntry = {
            timestamp: Date.now(),
            magazine: lightMagazine,
        };
    
        const updatedHistory = [newEntry, ...history];
        setHistory(updatedHistory);
    
        try {
            const allHistoriesJSON = localStorage.getItem(HISTORY_KEY);
            const allHistories = allHistoriesJSON ? JSON.parse(allHistoriesJSON) : {};
            allHistories[magazine.id] = updatedHistory;
            localStorage.setItem(HISTORY_KEY, JSON.stringify(allHistories));
        } catch (error) {
            console.error("Falha ao salvar o histórico:", error);
        }
    }, [magazine, history]);
    
    const handleRevertToVersion = (versionMagazine: Magazine) => {
        setMagazine(versionMagazine);
    
        const status: Record<string, GenerationState> = { cover: 'pending' };
        versionMagazine.articles.forEach((_, index: number) => {
            status[`article-${index}`] = 'pending';
        });
        setGenerationStatus(status);
        
        setIsHistoryPanelOpen(false);
    };

    const handleGoToLogoGenerator = () => {
        setView('logoGenerator');
    };

    const handleGenerateLogo = async (prompt: string) => {
        setIsGeneratingLogo(true);
        setGeneratedLogo(null);
        setLogoError(null);
        try {
            const logo = await geminiService.generateLogo(prompt);
            setGeneratedLogo(logo);
        } catch (err: any) {
            console.error(err);
            setLogoError(`Ocorreu um erro ao gerar o logo: ${err.message}. Tente novamente.`);
        } finally {
            setIsGeneratingLogo(false);
        }
    };

    const handleConfirmIdentity = (name: string, logoUrl: string) => {
        const newIdentity: VisualIdentity = { magazineName: name, logoUrl };
        setVisualIdentity(newIdentity);
        setFinalMagazineDraft(prev => ({ ...prev, identity: newIdentity }));
        try {
            localStorage.setItem(IDENTITY_KEY, JSON.stringify(newIdentity));
            alert("Identidade visual armazenada para a revisão final!");
        } catch (error) {
            console.error("Falha ao salvar identidade visual:", error);
            setLogoError("Não foi possível salvar a identidade visual. O armazenamento pode estar cheio.");
        }
        handleBackToHub();
    };

    const handleGenerateEditorialConcept = async (inputs: EditorialConceptInputs) => {
        setIsLoading(true);
        setError(null);
        setEditorialConcept(null);
        setLoadingMessages([]);
        addLoadingMessage("Consultando o Diretor de Arte Editorial...");

        try {
            const concept = await geminiService.generateEditorialConcept(inputs);
            setEditorialConcept(concept);
            setView('editorialConceptViewer');
        } catch (err: any)
        {
            console.error(err);
            setError(`Ocorreu um erro ao gerar o conceito editorial: ${err.message}. Tente novamente.`);
            setView('editorialConceptCreator');
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmEditorialConcept = (concept: EditorialConceptData) => {
        setEditorialConcept(concept);
        setFinalMagazineDraft(prev => ({ ...prev, editorialConcept: concept }));
        alert("Conceito editorial armazenado para a revisão final!");
        handleBackToHub();
    };

    const renderContent = () => {
        switch(view) {
            case 'finalReview':
                return (
                    <MagazineViewer
                        draft={finalMagazineDraft}
                        onTextUpdate={handleTextUpdate}
                        onImageRegenerate={handleImageRegenerate}
                        isGeneratingImage={isGeneratingImage}
                    />
                );
            case 'composer':
                return magazine && magazineStructure ? (
                    <MagazineComposer
                        magazine={magazine}
                        structure={magazineStructure}
                        generationStatus={generationStatus}
                        history={history}
                        isHistoryPanelOpen={isHistoryPanelOpen}
                        onGenerateCover={handleGenerateCover}
                        onGenerateArticle={handleGenerateArticle}
                        onGenerateAll={handleGenerateAll}
                        onGoToFinalReview={handleConfirmMagazineAndGoToReview}
                        onSaveToHistory={handleSaveToHistory}
                        onRevertToVersion={handleRevertToVersion}
                        onToggleHistoryPanel={() => setIsHistoryPanelOpen(prev => !prev)}
                        onPromptUpdate={handlePromptUpdate}
                        onResetCoverPrompt={handleResetCoverPrompt}
                        onResetArticlePrompts={handleResetArticlePrompts}
                    />
                ) : null;
             case 'create':
                return currentCreationType ? <CreateByTopic type={currentCreationType} onGenerate={handleGenerate} onBack={handleBackToHub} /> : null;
            case 'logoGenerator':
                return (
                    <LogoGenerator
                        onGenerate={handleGenerateLogo}
                        onBack={handleBackToHub}
                        isLoading={isGeneratingLogo}
                        generatedLogo={generatedLogo}
                        error={logoError}
                        onConfirm={handleConfirmIdentity}
                        initialMagazineName={visualIdentity?.magazineName}
                    />
                );
            case 'editorialConceptCreator':
                return <EditorialConceptCreator onGenerate={handleGenerateEditorialConcept} />;
            case 'editorialConceptViewer':
                return editorialConcept ? <EditorialConceptViewer concept={editorialConcept} onConfirm={handleConfirmEditorialConcept} onBack={() => setView('editorialConceptCreator')} /> : null;
            case 'hub':
            default:
                return <CreationHub 
                    onSelectCreationType={handleSelectCreationType} 
                    onLoadSavedMagazine={handleLoadSavedMagazine}
                    hasSavedMagazine={hasSavedMagazine()}
                    onGoToLogoGenerator={handleGoToLogoGenerator}
                    onGoToFinalReview={() => setView('finalReview')}
                    hasDraftContent={Object.keys(finalMagazineDraft).length > 0}
                />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
            {(isLoading || isGeneratingAll) && <LoadingOverlay messages={loadingMessages} />}
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
                        {visualIdentity?.logoUrl && (
                            <img src={visualIdentity.logoUrl} alt="Logo da Revista" className="h-10 w-10 object-contain rounded-md hidden md:block" />
                        )}
                        <h1 className="text-xl md:text-2xl font-display text-cyan-300">{visualIdentity?.magazineName || 'Revista Retrô Gamer AI'}</h1>
                    </div>
                </div>
            </header>
            
            {error && (
                <div className="sticky top-[72px] z-30 bg-red-900/90 backdrop-blur-sm border-b-2 border-red-500 text-red-200 p-4 shadow-lg">
                    <div className="container mx-auto flex justify-between items-center gap-4">
                        <div className="flex items-start gap-3">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6 flex-shrink-0 text-red-400">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                            </svg>
                            <span className="flex-1 font-semibold">{error}</span>
                        </div>
                        <button 
                            onClick={() => setError(null)} 
                            className="p-1 rounded-full hover:bg-red-800/50 transition-colors"
                            aria-label="Fechar alerta de erro"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}

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
