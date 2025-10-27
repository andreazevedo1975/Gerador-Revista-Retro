import React from 'react';
import { EditorialConceptData } from '../types';

interface EditorialConceptPageProps {
  concept: EditorialConceptData;
}

const EditorialConceptPage: React.FC<EditorialConceptPageProps> = ({ concept }) => {
    const { technicalSheet, coverConcept, internalLayout } = concept;
    return (
        <section className="bg-gray-900/50 p-8 my-12 rounded-lg border-2 border-dashed border-yellow-400">
            <h2 className="text-4xl font-display text-yellow-300 mb-8 text-center">Conceito da Edição</h2>

            <div className="grid md:grid-cols-2 gap-8">
                <div>
                    <h3 className="text-2xl font-display text-cyan-400 mb-4">Ficha Técnica</h3>
                    <ul className="space-y-2 text-gray-300 text-lg">
                        <li><strong className="text-cyan-300">Nome:</strong> {technicalSheet.proposedName}</li>
                        <li><strong className="text-cyan-300">Foco:</strong> {technicalSheet.editorialFocus}</li>
                        <li><strong className="text-cyan-300">Formato:</strong> {technicalSheet.referenceFormat}</li>
                        <li><strong className="text-cyan-300">Público:</strong> {technicalSheet.keyAudience}</li>
                    </ul>
                </div>
                <div>
                    <h3 className="text-2xl font-display text-cyan-400 mb-4">Capa e Manchete</h3>
                     <p className="text-gray-300 italic mb-4 text-lg">"{coverConcept.description}"</p>
                    <p className="text-lg"><strong className="text-yellow-300">Manchete:</strong> {coverConcept.headline}</p>
                    <p className="text-lg"><strong className="text-yellow-300">Apoio:</strong> {coverConcept.supportingText}</p>
                </div>
            </div>

            <div className="mt-8">
                 <h3 className="text-2xl font-display text-cyan-400 mb-4">Layout Interno</h3>
                 <p className="text-gray-300 italic text-lg">"{internalLayout.description}"</p>
            </div>
        </section>
    );
};

export default EditorialConceptPage;
