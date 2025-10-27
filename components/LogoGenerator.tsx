import React, { useState, useEffect } from 'react';

interface LogoGeneratorProps {
    onGenerate: (prompt: string) => void;
    onBack: () => void;
    isLoading: boolean;
    generatedLogo: string | null;
    error: string | null;
    onSaveIdentity: (name: string, logoUrl: string) => void;
    initialMagazineName?: string;
}

const Spinner: React.FC = () => (
    <div className="w-16 h-16 border-4 border-t-4 border-t-fuchsia-500 border-gray-600 rounded-full animate-spin"></div>
);

const DownloadIcon: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
);

const LogoGenerator: React.FC<LogoGeneratorProps> = ({ onGenerate, isLoading, generatedLogo, error, onSaveIdentity, initialMagazineName }) => {
    const [prompt, setPrompt] = useState("Um logo em pixel art 16-bits para uma revista chamada 'Retrô Gamer AI', com um controle de videogame e cores neon vibrantes.");
    const [magazineName, setMagazineName] = useState(initialMagazineName || "Retrô Gamer AI");

    useEffect(() => {
        if (initialMagazineName) {
            setMagazineName(initialMagazineName);
        }
    }, [initialMagazineName]);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (prompt.trim()) {
            onGenerate(prompt);
        }
    };

    const handleDownload = () => {
        if (!generatedLogo) return;
        const link = document.createElement('a');
        link.href = generatedLogo;
        link.download = 'retro-gamer-ai-logo.jpg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleSave = () => {
        if (generatedLogo && magazineName.trim()) {
            onSaveIdentity(magazineName.trim(), generatedLogo);
        }
    };

    return (
        <div className="max-w-2xl mx-auto bg-gray-800/50 p-8 rounded-lg shadow-2xl border border-fuchsia-500/30">
            <h2 className="text-3xl md:text-4xl font-display text-yellow-300 mb-4 text-center">Gerador de Logo</h2>
            <p className="text-lg text-gray-400 mb-6 text-center leading-relaxed">Descreva o logo que você quer criar para a sua revista. Seja criativo!</p>

            <div className="flex flex-col items-center gap-8">
                <div className="w-full h-80 bg-gray-900/50 rounded-lg border-2 border-cyan-500/30 flex justify-center items-center p-4">
                    {isLoading ? (
                        <Spinner />
                    ) : generatedLogo ? (
                        <img src={generatedLogo} alt="Logo Gerado" className="max-w-full max-h-full object-contain rounded-md" />
                    ) : (
                         <p className="text-gray-500 text-center">A imagem do seu logo aparecerá aqui.</p>
                    )}
                </div>

                {generatedLogo && !isLoading && (
                    <div className="w-full flex flex-col items-center gap-6 mt-6">
                        <button
                            onClick={handleDownload}
                            className="bg-green-600 text-white font-bold py-3 px-8 hover:bg-green-700 transition-colors duration-300 shadow-lg font-display text-base flex items-center gap-3"
                        >
                            <DownloadIcon className="w-5 h-5" />
                            Baixar Logo
                        </button>

                        <div className="w-full space-y-4 p-6 bg-gray-900/50 rounded-lg border-2 border-green-500/30">
                            <h3 className="text-xl font-display text-green-300 text-center">Salvar Identidade Visual</h3>
                            <p className="text-gray-400 text-center text-sm">Salve o nome e o logo para usar em suas próximas revistas.</p>
                            <div>
                                <label htmlFor="magazineName" className="block text-sm font-bold text-gray-300 mb-2">
                                    Nome da Revista
                                </label>
                                <input
                                    id="magazineName"
                                    type="text"
                                    value={magazineName}
                                    onChange={(e) => setMagazineName(e.target.value)}
                                    placeholder="Nome da Revista"
                                    className="w-full p-3 border-2 border-green-500/50 bg-gray-800 text-gray-200 rounded-md focus:ring-2 focus:ring-green-400 focus:border-green-400 transition"
                                />
                            </div>
                            <button onClick={handleSave} disabled={!magazineName.trim()} className="w-full bg-green-700 text-white font-bold py-3 px-6 rounded-md hover:bg-green-800 disabled:bg-gray-500 transition-colors font-display">
                                Salvar Identidade
                            </button>
                        </div>
                    </div>
                )}

                {error && <p className="text-red-400 text-center bg-red-900/50 p-3 rounded-md">{error}</p>}

                <form onSubmit={handleSubmit} className="w-full space-y-6">
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Descreva seu logo..."
                        className="w-full h-28 p-4 border-2 border-cyan-500/50 bg-gray-900 text-gray-200 rounded-md focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition duration-200 placeholder-gray-500"
                        required
                    />
                    <button
                        type="submit"
                        disabled={!prompt.trim() || isLoading}
                        className="w-full bg-fuchsia-600 text-white font-bold py-3 px-6 rounded-md hover:bg-fuchsia-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg shadow-fuchsia-500/20 font-display"
                    >
                        {isLoading ? 'Gerando...' : 'Gerar Logo'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LogoGenerator;