import React from 'react';
import { CreationType } from '../types';
import TopicIcon from './TopicIcon';

interface CreationHubProps {
    onSelectCreationType: (type: CreationType) => void;
    onLoadSavedMagazine: () => void;
    hasSavedMagazine: boolean;
    onGoToLogoGenerator: () => void;
    onGoToFinalReview: () => void;
    hasDraftContent: boolean;
}

const creationTypes: {
    type: CreationType;
    title: string;
    description: string;
}[] = [
    { type: 'console', title: "Dossiê de Console", description: "Explore a história, o legado e os jogos marcantes de um console." },
    { type: 'game', title: "Análise de Jogo", description: "Crie uma edição especial sobre um jogo clássico, com dicas e segredos." },
    { type: 'guide', title: "Guia de Segredos", description: "Foque em detonados, com estratégias para um jogo específico." },
    { type: 'developer', title: "Lendas do Dev", description: "Explore a história de um estúdio ou criador icônico de games." },
    { type: 'rivalry', title: "Rivalidades Históricas", description: "Uma revista sobre as grandes batalhas da indústria: consoles, jogos ou empresas." },
    { type: 'soundtrack', title: "O Som dos Games", description: "Mergulhe nas trilhas sonoras que marcaram época." },
    { type: 'cover_choice', title: "Batalha de Capas", description: "Uma edição que analisa capas icônicas, com a IA ajudando a eleger a melhor." },
    { type: 'editorial_concept', title: "Conceito Editorial", description: "Defina a base de uma publicação e receba um plano editorial detalhado." },
];

const CreationHub: React.FC<CreationHubProps> = ({ onSelectCreationType, onLoadSavedMagazine, hasSavedMagazine, onGoToLogoGenerator, onGoToFinalReview, hasDraftContent }) => {
    
    const mainCreationTypes = creationTypes.filter(item => !['editorial_concept', 'cover_choice'].includes(item.type));
    const toolCreationTypes = creationTypes.filter(item => ['editorial_concept', 'cover_choice'].includes(item.type));

    const ActionButton: React.FC<{onClick: () => void, text: string, className: string, icon?: React.ReactNode}> = ({onClick, text, className, icon}) => (
        <button onClick={onClick} className={`font-bold py-3 px-8 transition-colors duration-300 shadow-lg font-display text-base flex items-center justify-center gap-3 ${className}`}>
            {icon}
            <span>{text}</span>
        </button>
    );

    const ToolCard: React.FC<{type: CreationType, title: string, description: string, onClick: () => void, color: string}> = ({ type, title, description, onClick, color }) => (
         <div className="flex-1 text-center flex flex-col p-6 bg-gray-800/50 rounded-lg border border-fuchsia-500/30">
            <div className="w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                <TopicIcon type={type} />
            </div>
            <h3 className={`text-xl font-display ${color} mb-2`}>{title}</h3>
            <p className="text-gray-400 mb-4 flex-grow">{description}</p>
            <ActionButton
                onClick={onClick}
                text="Criar Agora"
                className="bg-purple-600 text-white hover:bg-purple-700 mt-auto"
            />
        </div>
    );

    return (
        <div className="max-w-5xl mx-auto text-center flex flex-col gap-12">
            <div>
                <h2 className="text-3xl md:text-4xl font-display text-yellow-300 mb-4">Central de Criação</h2>
                <p className="text-lg text-gray-400 max-w-3xl mx-auto leading-relaxed">Bem-vindo, editor! Escolha uma opção abaixo para começar a dar vida à sua próxima edição.</p>
            </div>

            {(hasSavedMagazine || hasDraftContent) && (
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    {hasSavedMagazine && (
                         <ActionButton
                            onClick={onLoadSavedMagazine}
                            text="Continuar Edição Salva"
                            className="bg-fuchsia-600 text-white hover:bg-fuchsia-700 flex-1"
                        />
                    )}
                    {hasDraftContent && (
                        <ActionButton
                            onClick={onGoToFinalReview}
                            text="Ir para Revisão Final"
                            className="bg-green-600 text-white hover:bg-green-700 flex-1 animate-pulse"
                        />
                    )}
                </div>
            )}
            
            <section>
                <h3 className="text-2xl font-display text-yellow-300 mb-6">Toolkit do Editor</h3>
                 <div className="flex flex-col sm:flex-row gap-6 justify-center items-stretch">
                    <ToolCard 
                        type="editorial_concept"
                        title="Conceito Editorial"
                        description="Defina a base de uma publicação e receba um plano editorial detalhado da IA."
                        onClick={() => onSelectCreationType('editorial_concept')}
                        color="text-cyan-300"
                    />
                    <ToolCard 
                        type="logo"
                        title="Gerador de Logo"
                        description="Crie um logo exclusivo em pixel art para a sua revista e defina sua identidade visual."
                        onClick={onGoToLogoGenerator}
                        color="text-cyan-300"
                    />
                 </div>
            </section>

            <section>
                <h3 className="text-2xl font-display text-yellow-300 mb-6">Começar uma Nova Edição</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {mainCreationTypes.map(item => (
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
                     <button
                        onClick={() => onSelectCreationType('cover_choice')}
                        className="bg-gray-900/50 rounded-lg shadow-lg border-2 border-cyan-500/20 transition-all duration-300 flex flex-col p-6 hover:bg-gray-900 hover:border-cyan-500/50 group items-center text-center md:col-span-2 lg:col-span-1"
                    >
                        <div className="w-16 h-16 mb-4 flex items-center justify-center">
                           <TopicIcon type={'cover_choice'} />
                        </div>
                        <h3 className="text-lg font-display text-cyan-300 mb-2 group-hover:text-yellow-300 transition-colors">Batalha de Capas</h3>
                        <p className="text-base text-gray-400 leading-relaxed mt-auto flex-grow">Uma edição que analisa capas icônicas, com a IA ajudando a eleger a melhor.</p>
                    </button>
                </div>
            </section>
        </div>
    );
};

export default CreationHub;
