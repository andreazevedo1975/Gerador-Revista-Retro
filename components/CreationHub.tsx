/**
 * @fileoverview A React component that serves as the main hub for creating different types of retro gaming magazines.
 * @author AI-generated
 */
import React from 'react';
import { CreationType } from '../types';

interface CreationHubProps {
    onSelectCreationType: (type: CreationType) => void;
}

// --- Novas Ícones Pixel Art ---

const RetroConsoleIcon = () => (
    <svg width="48" height="48" viewBox="0 0 48 48" className="mb-4 text-cyan-400" fill="currentColor" xmlns="http://www.w3.org/2000/svg" shapeRendering="crispEdges">
        <path d="M8 20H40V32H8V20Z" fill="#71717A"/>
        <path d="M12 24H24V28H12V24Z" fill="#27272A"/>
        <path d="M32 25H36V27H32V25Z" fill="#EF4444"/>
        <path d="M12 36H36V40H12V36Z" fill="#A1A1AA"/>
        <path d="M16 36H20V40H16V36Z" fill="#52525B"/>
        <path d="M28 36H32V40H28V36Z" fill="#52525B"/>
    </svg>
);
const RetroGameIcon = () => (
    <svg width="48" height="48" viewBox="0 0 48 48" className="mb-4 text-cyan-400" fill="currentColor" xmlns="http://www.w3.org/2000/svg" shapeRendering="crispEdges">
        <path d="M20 12H28V16H20V12Z" fill="#EF4444"/>
        <path d="M16 16H32V20H16V16Z" fill="#71717A"/>
        <path d="M12 20H36V40H12V20Z" fill="#A1A1AA"/>
        <path d="M16 24H20V28H16V24Z" fill="#27272A"/>
        <path d="M16 32H20V36H16V32Z" fill="#27272A"/>
        <path d="M28 32H32V36H28V32Z" fill="#27272A"/>
    </svg>
);
const RetroGuideIcon = () => (
    <svg width="48" height="48" viewBox="0 0 48 48" className="mb-4 text-cyan-400" fill="currentColor" xmlns="http://www.w3.org/2000/svg" shapeRendering="crispEdges">
        <path d="M8 8H24V40H8V8Z" fill="#A1A1AA"/>
        <path d="M24 8H40V40H24V8Z" fill="#71717A"/>
        <path d="M12 12H20V16H12V12Z" fill="#52525B"/>
        <path d="M12 20H20V24H12V20Z" fill="#52525B"/>
        <path d="M12 28H20V32H12V28Z" fill="#52525B"/>
        <path d="M28 16H36V20H28V16Z" fill="#D4D4D8"/>
        <path d="M28 24H36V28H28V24Z" fill="#D4D4D8"/>
    </svg>
);
const RetroDeveloperIcon = () => (
    <svg width="48" height="48" viewBox="0 0 48 48" className="mb-4 text-cyan-400" fill="currentColor" xmlns="http://www.w3.org/2000/svg" shapeRendering="crispEdges">
        <path d="M16 12H32V16H16V12Z" fill="#27272A"/>
        <path d="M12 16H36V28H12V16Z" fill="#A16207"/>
        <path d="M20 20H16V24H20V20Z" fill="#FAFAF9"/>
        <path d="M32 20H28V24H32V20Z" fill="#FAFAF9"/>
        <path d="M20 20H28V24H20V20Z" fill="#27272A"/>
        <path d="M12 28H36V32H12V28Z" fill="#A16207"/>
        <path d="M20 28H28V32H20V28Z" fill="#DC2626"/>
        <path d="M16 32H32V36H16V32Z" fill="#7C2D12"/>
    </svg>
);
const RetroRivalryIcon = () => (
    <svg width="48" height="48" viewBox="0 0 48 48" className="mb-4 text-cyan-400" fill="currentColor" xmlns="http://www.w3.org/2000/svg" shapeRendering="crispEdges">
        <path d="M11 15L15 11L33 29L29 33L11 15Z" fill="#A1A1AA"/>
        <path d="M15 11L19 15L17 17L13 13L15 11Z" fill="#71717A"/>
        <path d="M33 15L29 11L11 29L15 33L33 15Z" fill="#3B82F6"/>
        <path d="M29 11L25 15L27 17L31 13L29 11Z" fill="#1D4ED8"/>
    </svg>
);
const RetroSoundtrackIcon = () => (
    <svg width="48" height="48" viewBox="0 0 48 48" className="mb-4 text-cyan-400" fill="currentColor" xmlns="http://www.w3.org/2000/svg" shapeRendering="crispEdges">
        <path d="M12 8H16V28H12V8Z" />
        <path d="M28 12H32V32H28V12Z" />
        <path d="M16 16H28V20H16V16Z" />
        <path d="M20 24A4 4 0 1 0 20 32A4 4 0 1 0 20 24Z" />
        <path d="M36 28A4 4 0 1 0 36 36A4 4 0 1 0 36 28Z" />
    </svg>
);


const creationTypes: {
    type: CreationType;
    title: string;
    description: string;
    icon: React.ReactNode;
}[] = [
    { type: 'console', title: "Dossiê: História de um Console", description: "Gere uma revista completa sobre seu console retrô favorito, explorando sua história, legado e jogos marcantes.", icon: <RetroConsoleIcon/> },
    { type: 'game', title: "Análise Profunda de um Jogo", description: "Crie uma edição especial com a análise de um jogo clássico, com dicas, curiosidades e segredos.", icon: <RetroGameIcon/> },
    { type: 'guide', title: "Guia de Dicas e Segredos", description: "Uma edição focada em detonados, com segredos, chefes e estratégias para um jogo específico.", icon: <RetroGuideIcon/> },
    { type: 'developer', title: "Lendas do Desenvolvimento", description: "Explore a história de um estúdio ou criador icônico que moldou o universo dos games.", icon: <RetroDeveloperIcon/> },
    { type: 'rivalry', title: "Rivalidades Históricas", description: "Uma revista sobre as grandes batalhas da indústria: consoles, jogos ou empresas.", icon: <RetroRivalryIcon/> },
    { type: 'soundtrack', title: "O Som dos Games", description: "Mergulhe nas trilhas sonoras que marcaram época. Uma edição sobre os compositores e a tecnologia musical.", icon: <RetroSoundtrackIcon/> },
];

const Card: React.FC<{
    title: string,
    description: string,
    icon: React.ReactNode,
    onClick: () => void
}> = ({ title, description, icon, onClick }) => (
    <button
        onClick={onClick}
        className="bg-gray-900/50 p-6 rounded-lg shadow-lg border-2 border-cyan-500/20 hover:border-cyan-400 hover:bg-gray-900 transition-all duration-300 transform hover:-translate-y-1 group h-full flex"
    >
        <div className="flex flex-col items-center text-center">
            {icon}
            <h3 className="text-lg font-display text-cyan-300 mb-2 group-hover:text-yellow-300 transition-colors">{title}</h3>
            <p className="text-gray-400 text-sm leading-relaxed mt-auto">{description}</p>
        </div>
    </button>
);

const CreationHub: React.FC<CreationHubProps> = ({ onSelectCreationType }) => {
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
                        icon={item.icon}
                        onClick={() => onSelectCreationType(item.type)}
                    />
                ))}
            </div>
        </div>
    );
};

export default CreationHub;