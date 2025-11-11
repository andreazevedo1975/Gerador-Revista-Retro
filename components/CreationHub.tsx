import React from 'react';
import { CreationType, VisualIdentity, EditorialConceptData } from '../types';
import TopicIcon from './TopicIcon';

interface CreationHubProps {
    onSelectCreationType: (type: CreationType) => void;
    onLoadSavedMagazine: () => void;
    hasSavedMagazine: boolean;
    onGoToLogoGenerator: () => void;
    onGoToFinalReview: () => void;
    hasDraftContent: boolean;
    visualIdentity: VisualIdentity | null;
    editorialConcept: EditorialConceptData | null;
    onClearIdentityAndConcept: () => void;
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
];

const CreationHub: React.FC<CreationHubProps> = ({ 
    onSelectCreationType, 
    onLoadSavedMagazine, 
    hasSavedMagazine, 
    onGoToLogoGenerator, 
    onGoToFinalReview, 
    hasDraftContent,
    visualIdentity,
    editorialConcept,
    onClearIdentityAndConcept 
}) => {
    
    const ActionButton: React.FC<{onClick: () => void, text: string, className: string, icon?: React.ReactNode}> = ({onClick, text, className, icon}) => (
        <button onClick={onClick} className={`font-bold py-3 px-8 transition-colors duration-300 shadow-lg font-display text-base flex items-center justify-center gap-3 ${className}`}>
            {icon}
            <span>{text}</span>
        </button>
    );

    return (
        <div className="max-w-5xl mx-auto text-center flex flex-col gap-12">
            <div>
                <h2 className="text-3xl md:text-4xl font-display text-yellow-300 mb-4">Central de Criação</h2>
                <p className="text-lg text-gray-400 max-w-3xl mx-auto leading-relaxed">Bem-vindo, editor! Configure a identidade da sua revista e escolha um tópico para começar a dar vida à sua próxima edição.</p>
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
            
            <section className="bg-gray-800/50 p-6 rounded-lg border border-fuchsia-500/30 text-left">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-display text-yellow-300">Configuração da Edição</h3>
                    {(visualIdentity || editorialConcept) && (
                        <button onClick={onClearIdentityAndConcept} className="text-sm text-red-400 hover:text-red-300 hover:underline font-semibold">
                            Limpar Tudo
                        </button>
                    )}
                </div>
                <p className="text-gray-400 mb-6">Defina a identidade e o conceito editorial que serão usados pela IA para criar sua nova revista.</p>
                <div className="grid md:grid-cols-2 gap-6">
                    {/* Visual Identity Column */}
                    <div className="bg-gray-900/50 p-4 rounded-md flex flex-col justify-between border border-cyan-500/20">
                        {visualIdentity ? (
                            <>
                                <div className="flex items-center gap-4 mb-4">
                                    <img src={visualIdentity.logoUrl} alt="Logo" className="w-16 h-16 rounded-md object-cover border-2 border-green-400" />
                                    <div>
                                        <p className="text-gray-400 text-sm">Nome da Revista</p>
                                        <p className="text-xl font-bold">{visualIdentity.magazineName}</p>
                                    </div>
                                </div>
                                <ActionButton
                                    onClick={onGoToLogoGenerator}
                                    text="Alterar Identidade"
                                    className="bg-purple-600 text-white hover:bg-purple-700 w-full text-sm"
                                />
                            </>
                        ) : (
                            <>
                                <div className="text-center text-gray-500 mb-4 flex-grow flex flex-col items-center justify-center p-4">
                                     <p>Nenhuma identidade visual definida.</p>
                                </div>
                                <ActionButton
                                    onClick={onGoToLogoGenerator}
                                    text="Definir Identidade"
                                    className="bg-cyan-600 text-white hover:bg-cyan-700 w-full text-sm"
                                />
                            </>
                        )}
                    </div>

                    {/* Editorial Concept Column */}
                     <div className="bg-gray-900/50 p-4 rounded-md flex flex-col justify-between border border-cyan-500/20">
                         {editorialConcept ? (
                            <>
                                <div className="mb-4">
                                    <p className="text-gray-400 text-sm">Conceito Editorial</p>
                                    <p className="font-bold text-lg">{editorialConcept.technicalSheet.proposedName}</p>
                                    <p className="text-sm text-gray-300 italic truncate">Foco: {editorialConcept.technicalSheet.editorialFocus}</p>
                                </div>
                                <ActionButton
                                    onClick={() => onSelectCreationType('editorial_concept')}
                                    text="Alterar Conceito"
                                    className="bg-purple-600 text-white hover:bg-purple-700 w-full text-sm"
                                />
                            </>
                         ) : (
                            <>
                                <div className="text-center text-gray-500 mb-4 flex-grow flex flex-col items-center justify-center p-4">
                                     <p>Nenhum conceito editorial definido.</p>
                                </div>
                                <ActionButton
                                    onClick={() => onSelectCreationType('editorial_concept')}
                                    text="Definir Conceito"
                                    className="bg-cyan-600 text-white hover:bg-cyan-700 w-full text-sm"
                                />
                            </>
                         )}
                    </div>
                </div>
            </section>

            <section>
                <h3 className="text-2xl font-display text-yellow-300 mb-6">Começar uma Nova Edição</h3>
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
            </section>
        </div>
    );
};

export default CreationHub;
