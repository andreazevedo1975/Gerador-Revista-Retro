import React, { useState } from 'react';
import { CreationType } from '../types';

interface CreateByTopicProps {
    type: CreationType;
    onGenerate: (topic: string, type: CreationType, isDeepMode: boolean) => void;
    onBack: () => void;
}

const config: Record<CreationType, {
    title: string;
    description: string;
    placeholder: string;
}> = {
    console: {
        title: "História de um Console",
        description: "Digite o nome do console para gerar uma revista sobre sua história, legado e jogos marcantes.",
        placeholder: "Ex: Super Nintendo, Mega Drive, NES..."
    },
    game: {
        title: "Análise de um Jogo",
        description: "Digite o nome do jogo para criar uma edição especial com sua análise completa, dicas e curiosidades.",
        placeholder: "Ex: Chrono Trigger, Sonic the Hedgehog 2..."
    },
    guide: {
        title: "Guia de Dicas e Segredos",
        description: "Digite o nome do jogo para o qual você quer um guia completo de segredos e estratégias.",
        placeholder: "Ex: Super Metroid, The Legend of Zelda..."
    },
    developer: {
        title: "Lendas do Desenvolvimento",
        description: "Digite o nome do estúdio ou desenvolvedor para gerar uma revista sobre sua história e legado.",
        placeholder: "Ex: Square, Konami, Hideo Kojima..."
    },
    rivalry: {
        title: "Rivalidades Históricas",
        description: "Descreva a rivalidade sobre a qual você quer ler.",
        placeholder: "Ex: Nintendo vs. Sega, Street Fighter vs. Mortal Kombat..."
    },
    soundtrack: {
        title: "O Som dos Games",
        description: "Digite o tema para a revista de trilhas sonoras.",
        placeholder: "Ex: Nobuo Uematsu, O chip de som do SNES..."
    },
};

const InfoIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-cyan-400">
        <path strokeLinecap="round" strokeLinejoin="round" d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
    </svg>
);


const CreateByTopic: React.FC<CreateByTopicProps> = ({ type, onGenerate }) => {
    const [topic, setTopic] = useState('');
    const [isDeepMode, setIsDeepMode] = useState(false);
    const { title, description, placeholder } = config[type];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (topic.trim()) {
            onGenerate(topic.trim(), type, isDeepMode);
        }
    };

    return (
        <div className="max-w-xl mx-auto bg-gray-800/50 p-8 rounded-lg shadow-2xl border border-fuchsia-500/30">
            <h2 className="text-3xl md:text-4xl font-display text-yellow-300 mb-4 text-center">{title}</h2>
            <p className="text-gray-400 mb-6 text-center">{description}</p>
            
            <form onSubmit={handleSubmit} className="space-y-6">
                <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder={placeholder}
                    className="w-full p-4 border-2 border-cyan-500/50 bg-gray-900 text-gray-200 rounded-md focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition duration-200 placeholder-gray-500"
                />
                <div className="flex items-center justify-center gap-4">
                    <label htmlFor="deep-mode" className="flex items-center gap-2 cursor-pointer text-gray-300">
                        <input
                            type="checkbox"
                            id="deep-mode"
                            checked={isDeepMode}
                            onChange={(e) => setIsDeepMode(e.target.checked)}
                            className="w-5 h-5 rounded bg-gray-700 border-cyan-500/50 text-fuchsia-500 focus:ring-fuchsia-600"
                        />
                        <span className="font-bold">Ativar Modo Profundo</span>
                    </label>
                    <div className="relative group">
                        <InfoIcon />
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-2 bg-gray-900 text-gray-300 text-xs rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 border border-cyan-500/50">
                            Usa um modelo de IA mais avançado (Gemini 2.5 Pro) para gerar análises mais detalhadas e prompts mais criativos. A geração pode demorar mais.
                        </div>
                    </div>
                </div>
                <button
                    type="submit"
                    disabled={!topic.trim()}
                    className="w-full bg-fuchsia-600 text-white font-bold py-3 px-6 rounded-md hover:bg-fuchsia-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg shadow-fuchsia-500/20 font-display"
                >
                    Gerar Revista
                </button>
            </form>
        </div>
    );
};

export default CreateByTopic;
