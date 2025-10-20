
import React, { useState, useCallback, useEffect } from 'react';
import { Magazine, MagazineStructure, Article, ArticleImage } from './types';
import * as geminiService from './services/geminiService';
import MagazineViewer from './components/EbookViewer';
import LoadingOverlay from './components/LoadingOverlay';

const PixelArtIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M4 4H6V6H4V4ZM6 6H8V8H6V6ZM8 8H10V10H8V8ZM10 10H12V12H10V10ZM12 12H14V14H12V12ZM14 14H16V16H14V14ZM16 16H18V18H16V16ZM18 18H20V20H18V18ZM4 20H6V18H4V20ZM6 18H8V16H6V18ZM8 16H10V14H8V16ZM10 14H12V12H10V14ZM12 12H14V10H12V12ZM14 10H16V8H14V10ZM16 8H18V6H16V8ZM18 6H20V4H18V6ZM8 4H10V6H8V4ZM10 6H12V8H10V6ZM12 8H14V10H12V8ZM14 6H16V4H14V6ZM16 18H18V20H16V18ZM14 16H16V18H14V16ZM12 14H14V16H12V14ZM10 16H12V14H10V16ZM8 18H10V16H8V18ZM6 20H8V18H6V20Z"/>
    </svg>
);


const App: React.FC = () => {
    const [idea, setIdea] = useState('');
    const [magazine, setMagazine] = useState<Magazine | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [isGeneratingImage, setIsGeneratingImage] = useState<Record<string, boolean>>({});
    const [isPixelArtTheme, setIsPixelArtTheme] = useState(false);

    useEffect(() => {
        if (isPixelArtTheme) {
            document.body.classList.add('pixel-art-theme');
        } else {
            document.body.classList.remove('pixel-art-theme');
        }
    }, [isPixelArtTheme]);

    const addLoadingMessage = (message: string) => {
        setLoadingMessages(prev => [...prev, message]);
    };

    const handleGenerateMagazine = async () => {
        if (!idea.trim()) return;

        setIsLoading(true);
        setError(null);
        setMagazine(null);
        setLoadingMessages([]);
        
        try {
            addLoadingMessage('Consultando os anais dos games...');
            const structure: MagazineStructure = await geminiService.generateMagazineStructure(idea);
            addLoadingMessage(`Edição especial: "${structure.title}"`);
            addLoadingMessage('Desenhando a capa...');
            
            const coverImage = await geminiService.generateImage(structure.coverImagePrompt, 'cover');
            addLoadingMessage('Capa pronta!');

            const articles: Article[] = [];
            for (const [index, articleStructure] of structure.articles.entries()) {
                addLoadingMessage(`Escrevendo artigo ${index + 1}: "${articleStructure.title}"...`);
                const content = await geminiService.generateText(articleStructure.contentPrompt);

                addLoadingMessage(`Buscando dicas secretas para "${articleStructure.title}"...`);
                const tips = await geminiService.generateText(articleStructure.tipsPrompt);

                addLoadingMessage(`Criando imagens para "${articleStructure.title}"...`);
                const imageGenerationPromises = articleStructure.imagePrompts.map(imgPrompt => {
                    addLoadingMessage(`- Gerando ${imgPrompt.type}...`);
                    return geminiService.generateImage(imgPrompt.prompt, imgPrompt.type);
                });
                const generatedImageUrls = await Promise.all(imageGenerationPromises);
                
                const images: ArticleImage[] = articleStructure.imagePrompts.map((imgPrompt, i) => ({
                    id: `article-${index}-image-${i}`,
                    type: imgPrompt.type,
                    prompt: imgPrompt.prompt,
                    url: generatedImageUrls[i],
                }));
                
                articles.push({
                    id: `article-${index}`,
                    title: articleStructure.title,
                    contentPrompt: articleStructure.contentPrompt,
                    content,
                    tips,
                    images,
                });
            }

            setMagazine({
                title: structure.title,
                coverImage,
                coverImagePrompt: structure.coverImagePrompt,
                articles,
            });

        } catch (err: any) {
            console.error(err);
            setError(`Ocorreu um erro ao gerar a revista: ${err.message}.`);
        } finally {
            setIsLoading(false);
        }
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

    const handleImageRegenerate = useCallback(async (path: string) => {
        if (!magazine) {
            return;
        }

        const imageId = path;
        setIsGeneratingImage(prev => ({ ...prev, [imageId]: true }));

        try {
            let newImage: string;
            if (path === 'coverImage') {
                newImage = await geminiService.generateImage(magazine.coverImagePrompt, 'cover');
            } else {
                const parts = path.split('-');
                const articleIndex = parseInt(parts[1], 10);
                const imageIndex = parseInt(parts[3], 10);
                
                const article = magazine.articles[articleIndex];
                const imageInfo = article?.images[imageIndex];

                if (imageInfo) {
                    newImage = await geminiService.generateImage(imageInfo.prompt, imageInfo.type);
                } else {
                    throw new Error("Imagem ou artigo não encontrado para regeneração.");
                }
            }
            
            setMagazine(prevMagazine => {
                if (!prevMagazine) return null;
                const newMagazine = JSON.parse(JSON.stringify(prevMagazine)); // Deep copy for nested update
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

        } catch (err) {
            console.error(err);
            setError('Falha ao gerar nova imagem. Tente novamente.');
        } finally {
            setIsGeneratingImage(prev => ({ ...prev, [imageId]: false }));
        }
    }, [magazine]);

    return (
        <div className="min-h-screen bg-gray-900 text-gray-100">
            {isLoading && <LoadingOverlay messages={loadingMessages} />}
            <header className="bg-gray-800/50 backdrop-blur-sm shadow-lg border-b border-fuchsia-500/30 p-4 sticky top-0 z-20">
                <div className="container mx-auto flex justify-between items-center">
                    <h1 className="text-xl md:text-2xl font-display text-cyan-300">Revista Retrô Gamer AI</h1>
                    <button
                        onClick={() => setIsPixelArtTheme(prev => !prev)}
                        className="p-2 rounded-md hover:bg-fuchsia-500/50 transition-colors"
                        title={isPixelArtTheme ? "Desativar Tema Pixel" : "Ativar Tema Pixel"}
                    >
                        <PixelArtIcon className="w-6 h-6 text-yellow-300" />
                    </button>
                </div>
            </header>
            <main className="container mx-auto p-4 md:p-8">
                {!magazine ? (
                    <div className="max-w-3xl mx-auto bg-gray-800/50 p-8 rounded-lg shadow-2xl text-center border border-fuchsia-500/30">
                        <h2 className="text-3xl md:text-4xl font-display text-yellow-300 mb-4">Gerador de Revistas Retrô</h2>
                        <p className="text-gray-400 mb-6">Digite um tópico retrô e a IA criará uma edição inteira da revista para você!</p>
                        
                        <textarea
                            value={idea}
                            onChange={(e) => setIdea(e.target.value)}
                            placeholder="Ex: 'A história do Super Mario World', 'Os melhores jogos de luta do Mega Drive' ou 'Dicas e truques para The Legend of Zelda'"
                            className="w-full h-32 p-4 border-2 border-cyan-500/50 bg-gray-900 text-gray-200 rounded-md focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition duration-200 placeholder-gray-500"
                        />
                        <button
                            onClick={handleGenerateMagazine}
                            disabled={!idea.trim() || isLoading}
                            className="mt-6 w-full bg-fuchsia-600 text-white font-bold py-3 px-6 rounded-md hover:bg-fuchsia-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg shadow-fuchsia-500/20 font-display"
                        >
                            {isLoading ? 'Gerando...' : 'Gerar Revista!'}
                        </button>
                        {error && <p className="text-red-400 mt-4">{error}</p>}
                    </div>
                ) : (
                    <MagazineViewer
                        magazine={magazine}
                        onTextUpdate={handleTextUpdate}
                        onImageRegenerate={handleImageRegenerate}
                        isGeneratingImage={isGeneratingImage}
                    />
                )}
            </main>
        </div>
    );
};

export default App;