import React, { useState, useEffect } from 'react';
import { CreationType } from '../types';
import * as geminiService from '../services/geminiService';

interface CreationHubProps {
    onSelectCreationType: (type: CreationType) => void;
}

const creationTypes: {
    type: CreationType;
    title: string;
    description: string;
    prompt: string;
}[] = [
    { type: 'console', title: "Dossiê: História de um Console", description: "Gere uma revista completa sobre seu console retrô favorito, explorando sua história, legado e jogos marcantes.", prompt: "A simple 16-bit pixel art icon of a retro video game console, clean background, icon style." },
    { type: 'game', title: "Análise Profunda de um Jogo", description: "Crie uma edição especial com a análise de um jogo clássico, com dicas, curiosidades e segredos.", prompt: "A simple 16-bit pixel art icon of a retro arcade joystick, clean background, icon style." },
    { type: 'guide', title: "Guia de Dicas e Segredos", description: "Uma edição focada em detonados, com segredos, chefes e estratégias para um jogo específico.", prompt: "A simple 16-bit pixel art icon of an open book, representing a game guide, clean background, icon style." },
    { type: 'developer', title: "Lendas do Desenvolvimento", description: "Explore a história de um estúdio ou criador icônico que moldou o universo dos games.", prompt: "A simple 16-bit pixel art icon of a wise creator's face, clean background, icon style." },
    { type: 'rivalry', title: "Rivalidades Históricas", description: "Uma revista sobre as grandes batalhas da indústria: consoles, jogos ou empresas.", prompt: "A simple 16-bit pixel art icon of two swords crossing, representing a rivalry, clean background, icon style." },
    { type: 'soundtrack', title: "O Som dos Games", description: "Mergulhe nas trilhas sonoras que marcaram época. Uma edição sobre os compositores e a tecnologia musical.", prompt: "A simple 16-bit pixel art icon of musical notes, clean background, icon style." },
];

const SpinnerIcon: React.FC = () => (
    <div className="w-8 h-8 border-4 border-t-4 border-t-cyan-500 border-gray-600 rounded-full animate-spin"></div>
);

const Card: React.FC<{
    title: string,
    description: string,
    iconUrl?: string,
    onClick: () => void
}> = ({ title, description, iconUrl, onClick }) => (
    <button
        onClick={onClick}
        className="bg-gray-900/50 p-6 rounded-lg shadow-lg border-2 border-cyan-500/20 hover:border-cyan-400 hover:bg-gray-900 transition-all duration-300 transform hover:-translate-y-1 group h-full flex"
    >
        <div className="flex flex-col items-center text-center">
            <div className="w-12 h-12 mb-4 flex items-center justify-center">
                {iconUrl ? (
                    <img src={iconUrl} alt={`${title} icon`} className="w-full h-full object-cover rounded-md" />
                ) : (
                    <div className="w-12 h-12 bg-gray-800 rounded-md flex items-center justify-center">
                        <SpinnerIcon />
                    </div>
                )}
            </div>
            <h3 className="text-lg font-display text-cyan-300 mb-2 group-hover:text-yellow-300 transition-colors">{title}</h3>
            <p className="text-gray-400 text-sm leading-relaxed mt-auto">{description}</p>
        </div>
    </button>
);

const CreationHub: React.FC<CreationHubProps> = ({ onSelectCreationType }) => {
    const [icons, setIcons] = useState<Partial<Record<CreationType, string>>>({});

    useEffect(() => {
        const generateAllIcons = async () => {
            // Process requests sequentially to avoid hitting rate limits
            for (const item of creationTypes) {
                try {
                    const url = await geminiService.generateImage({
                        prompt: item.prompt,
                        type: 'icon',
                    });
                    setIcons(prev => ({ ...prev, [item.type]: url }));
                } catch (e) {
                    console.error(`Error generating icon for ${item.type}`, e);
                }
            }
        };

        generateAllIcons();
    }, []); // Empty dependency array ensures this runs only once on mount

    return (
        <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-display text-yellow-300 mb-4">Central de Criação</h2>
            <p className="text-gray-400 mb-10 max-w-2xl mx-auto">Escolha o tipo de pauta que você quer criar na sua próxima edição da Retrô Gamer AI.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {creationTypes.map(item => (
                    <Card
                        key={item.type}
                        title={item.title}
                        description={item.description}
                        iconUrl={icons[item.type]}
                        onClick={() => onSelectCreationType(item.type)}
                    />
                ))}
            </div>
        </div>
    );
};

export default CreationHub;