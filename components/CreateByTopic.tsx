import React, { useState } from 'react';
import { CreationType } from '../types';

interface CreateByTopicProps {
    type: CreationType;
    onGenerate: (topic: string, type: CreationType) => void;
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

const CreateByTopic: React.FC<CreateByTopicProps> = ({ type, onGenerate, onBack }) => {
    const [topic, setTopic] = useState('');
    const { title, description, placeholder } = config[type];

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (topic.trim()) {
            onGenerate(topic.trim(), type);
        }
    };

    return (
        <div className="max-w-xl mx-auto bg-gray-800/50 p-8 rounded-lg shadow-2xl border border-fuchsia-500/30">
             <button
                onClick={onBack}
                className="text-cyan-300 flex items-center gap-2 hover:text-yellow-300 transition-colors mb-6 p-2 -ml-2 rounded-md hover:bg-fuchsia-500/50"
                title="Voltar para Central de Criação"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
                <span>Voltar</span>
            </button>
            <h2 className="text-3xl md:text-4xl font-display text-yellow-300 mb-4 text-center">{title}</h2>
            <p className="text-gray-400 mb-6 text-center">{description}</p>
            
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder={placeholder}
                    className="w-full p-4 border-2 border-cyan-500/50 bg-gray-900 text-gray-200 rounded-md focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition duration-200 placeholder-gray-500"
                />
                <button
                    type="submit"
                    disabled={!topic.trim()}
                    className="mt-4 w-full bg-fuchsia-600 text-white font-bold py-3 px-6 rounded-md hover:bg-fuchsia-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg shadow-fuchsia-500/20 font-display"
                >
                    Gerar Revista
                </button>
            </form>
        </div>
    );
};

export default CreateByTopic;
