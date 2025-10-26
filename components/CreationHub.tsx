import React from 'react';
import { CreationType } from '../types';
import TopicIcon from './TopicIcon';

interface CreationHubProps {
    onSelectCreationType: (type: CreationType) => void;
    onLoadSavedMagazine: () => void;
    hasSavedMagazine: boolean;
}

const creationTypes: {
    type: CreationType;
    title: string;
    description: string;
}[] = [
    { type: 'console', title: "Dossiê: História de um Console", description: "Gere uma revista completa sobre seu console retrô favorito, explorando sua história, legado e jogos marcantes." },
    { type: 'game', title: "Análise Profunda de um Jogo", description: "Crie uma edição especial com a análise de um jogo clássico, com dicas, curiosidades e segredos." },
    { type: 'guide', title: "Guia de Dicas e Segredos", description: "Uma edição focada em detonados, com segredos, chefes e estratégias para um jogo específico." },
    { type: 'developer', title: "Lendas do Desenvolvimento", description: "Explore a história de um estúdio ou criador icônico que moldou o universo dos games." },
    { type: 'rivalry', title: "Rivalidades Históricas", description: "Uma revista sobre as grandes batalhas da indústria: consoles, jogos ou empresas." },
    { type: 'soundtrack', title: "O Som dos Games", description: "Mergulhe nas trilhas sonoras que marcaram época. Uma edição sobre os compositores e a tecnologia musical." },
    { type: 'cover_choice', title: "Escolha de Capa da Edição", description: "Uma edição que analisa capas de jogos icônicos, com a IA ajudando a eleger a melhor." },
];

const CreationHub: React.FC<CreationHubProps> = ({ onSelectCreationType, onLoadSavedMagazine, hasSavedMagazine }) => {
    return (
        <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-display text-yellow-300 mb-4">Central de Criação</h2>
            <p className="text-lg text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">Escolha o tipo de pauta que você quer criar na sua próxima edição da Retrô Gamer AI.</p>
            
            {hasSavedMagazine && (
                 <div className="mb-12 p-6 bg-gray-800/50 rounded-lg border border-fuchsia-500/30">
                    <h3 className="text-xl font-display text-cyan-300 mb-2">Continue de onde parou</h3>
                    <p className="text-gray-400 mb-4">Você tem uma revista em andamento. Carregue-a para continuar editando.</p>
                    <button
                        onClick={onLoadSavedMagazine}
                        className="bg-fuchsia-600 text-white font-bold py-3 px-8 hover:bg-fuchsia-700 transition-colors duration-300 shadow-lg font-display text-base"
                    >
                        Carregar Última Revista Salva
                    </button>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {creationTypes.map(item => (
                    <button
                        key={item.type}
                        onClick={() => onSelectCreationType(item.type)}
                        className="bg-gray-900/50 rounded-lg shadow-lg border-2 border-cyan-500/20 transition-all duration-300 flex flex-col p-6 hover:bg-gray-900 hover:border-cyan-500/50 group items-center text-center"
                    >
                        <div className="w-16 h-16 mb-4 flex items-center justify-center">
                           <TopicIcon type={item.type} />
                        </div>
                        <h3 className="text-lg font-display text-cyan-300 mb-2 group-hover:text-yellow-300 transition-colors">{item.title}</h3>
                        <p className="text-base text-gray-400 leading-relaxed mt-auto flex-grow">{item.description}</p>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default CreationHub;