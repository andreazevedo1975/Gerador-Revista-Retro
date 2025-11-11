import React, { useState } from 'react';
import { EditorialConceptData } from '../types';

interface EditorialConceptViewerProps {
    concept: EditorialConceptData;
    onBack: () => void;
    onConfirm: (concept: EditorialConceptData) => void;
}

const CopyIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
    </svg>
);


const EditorialConceptViewer: React.FC<EditorialConceptViewerProps> = ({ concept, onBack, onConfirm }) => {
    const [copyButtonText, setCopyButtonText] = useState('Copiar Prompt');

    const handleCopyPrompt = () => {
        navigator.clipboard.writeText(concept.imageGenerationPrompt).then(() => {
            setCopyButtonText('Copiado!');
            setTimeout(() => setCopyButtonText('Copiar Prompt'), 2000);
        });
    };

    const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
        <section className="bg-gray-800 p-6 rounded-lg shadow-lg border border-cyan-500/20">
            <h3 className="text-2xl font-display text-cyan-400 mb-4">{title}</h3>
            {children}
        </section>
    );

    const { technicalSheet, coverConcept, internalLayout, imageGenerationPrompt } = concept;

    return (
        <div className="max-w-3xl mx-auto space-y-8">
            <header className="text-center">
                <h2 className="text-3xl md:text-4xl font-display text-yellow-300 mb-2">Conceito Editorial Gerado</h2>
                <p className="text-lg text-gray-400 leading-relaxed">Aqui está a estrutura conceitual para a sua publicação. Use isso como base para o seu design.</p>
            </header>

            <Section title="I. Ficha Técnica do Conceito">
                <ul className="space-y-2 text-gray-300">
                    <li><strong className="text-cyan-300">Nome Proposto:</strong> {technicalSheet.proposedName}</li>
                    <li><strong className="text-cyan-300">Foco Editorial:</strong> {technicalSheet.editorialFocus}</li>
                    <li><strong className="text-cyan-300">Formato de Referência:</strong> {technicalSheet.referenceFormat}</li>
                    <li><strong className="text-cyan-300">Público-Chave:</strong> {technicalSheet.keyAudience}</li>
                </ul>
            </Section>

            <Section title="II. Capa e Manchete Principal">
                <div className="space-y-4">
                    <p className="text-gray-300 leading-relaxed italic bg-gray-900/50 p-4 rounded-md border-l-4 border-fuchsia-500">{coverConcept.description}</p>
                    <div>
                        <h4 className="font-display text-xl text-yellow-300">Manchete de Capa:</h4>
                        <p className="text-2xl font-bold text-white">{coverConcept.headline}</p>
                    </div>
                    <div>
                        <h4 className="font-display text-xl text-yellow-300">Texto de Apoio:</h4>
                        <p className="text-lg text-gray-300">{coverConcept.supportingText}</p>
                    </div>
                </div>
            </Section>

            <Section title="III. Seção de Layout Interno (Página Dupla)">
                 <p className="text-gray-300 leading-relaxed italic bg-gray-900/50 p-4 rounded-md border-l-4 border-fuchsia-500">{internalLayout.description}</p>
            </Section>

            <Section title="IV. Sugestão de Comando para Geração de Imagem">
                <div className="bg-gray-900/50 p-4 rounded-md">
                    <code className="text-base text-gray-300 block whitespace-pre-wrap font-mono">{imageGenerationPrompt}</code>
                </div>
                <button 
                    onClick={handleCopyPrompt}
                    className="mt-4 bg-fuchsia-600 text-white font-bold py-2 px-5 rounded-md hover:bg-fuchsia-700 transition-colors duration-300 shadow-lg font-display text-sm flex items-center gap-2"
                >
                    <CopyIcon className="w-4 h-4" />
                    {copyButtonText}
                </button>
            </Section>
            
            <div className="text-center mt-8 flex justify-center gap-4">
                <button onClick={onBack} className="bg-gray-700 text-white font-bold py-3 px-8 hover:bg-gray-600 transition-colors duration-300 shadow-lg font-display text-base">
                    Voltar
                </button>
                <button onClick={() => onConfirm(concept)} className="bg-green-600 text-white font-bold py-3 px-8 hover:bg-green-700 transition-colors duration-300 shadow-lg font-display text-base">
                    OK
                </button>
            </div>
        </div>
    );
};

export default EditorialConceptViewer;
