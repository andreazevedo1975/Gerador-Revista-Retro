import React, { useState } from 'react';
import { EditorialConceptInputs, EditorialStyle } from '../types';

interface EditorialConceptCreatorProps {
    onGenerate: (inputs: EditorialConceptInputs) => void;
}

const editorialStyles: { id: EditorialStyle, name: string }[] = [
    { id: 'Magazine', name: 'Magazine' },
    { id: 'Jornal', name: 'Jornal' },
    { id: 'Quadrinhos', name: 'Quadrinhos' },
    { id: 'Mangá', name: 'Mangá' },
    { id: 'Livro', name: 'Livro Ilustrado' },
    { id: 'Zine', name: 'Zine' },
];

const EditorialConceptCreator: React.FC<EditorialConceptCreatorProps> = ({ onGenerate }) => {
    const [inputs, setInputs] = useState<EditorialConceptInputs>({
        publicationTitle: '',
        mainTheme: '',
        targetAudience: '',
        editorialStyles: [],
        visualHighlight: '',
        dominantColor: '',
    });

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setInputs(prev => ({ ...prev, [name]: value }));
    };

    const handleStyleToggle = (style: EditorialStyle) => {
        setInputs(prev => {
            const currentStyles = prev.editorialStyles;
            if (currentStyles.includes(style)) {
                return { ...prev, editorialStyles: currentStyles.filter(s => s !== style) };
            }
            if (currentStyles.length < 2) {
                return { ...prev, editorialStyles: [...currentStyles, style] };
            }
            return prev; // Limit to 2 selections
        });
    };

    const isFormValid = () => {
        return (
            inputs.publicationTitle.trim() &&
            inputs.mainTheme.trim() &&
            inputs.targetAudience.trim() &&
            inputs.editorialStyles.length > 0 &&
            inputs.visualHighlight.trim() &&
            inputs.dominantColor.trim()
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isFormValid()) {
            onGenerate(inputs);
        }
    };

    const formFieldClasses = "w-full p-3 border-2 border-cyan-500/50 bg-gray-900 text-gray-200 rounded-md focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition duration-200 placeholder-gray-500";
    const labelClasses = "block text-lg font-display text-cyan-300 mb-2";

    return (
        <div className="max-w-2xl mx-auto bg-gray-800/50 p-8 rounded-lg shadow-2xl border border-fuchsia-500/30">
            <h2 className="text-3xl md:text-4xl font-display text-yellow-300 mb-4 text-center">Conceito Editorial</h2>
            <p className="text-lg text-gray-400 mb-8 text-center leading-relaxed">Defina a base do seu projeto. A IA irá gerar um plano editorial completo para você.</p>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label htmlFor="publicationTitle" className={labelClasses}>A. Título Provisório</label>
                    <input type="text" id="publicationTitle" name="publicationTitle" value={inputs.publicationTitle} onChange={handleInputChange} className={formFieldClasses} required />
                </div>

                <div>
                    <label htmlFor="mainTheme" className={labelClasses}>B. Tema Principal</label>
                    <textarea id="mainTheme" name="mainTheme" value={inputs.mainTheme} onChange={handleInputChange} className={formFieldClasses} rows={2} required />
                </div>

                <div>
                    <label htmlFor="targetAudience" className={labelClasses}>C. Público-Alvo</label>
                    <input type="text" id="targetAudience" name="targetAudience" value={inputs.targetAudience} onChange={handleInputChange} className={formFieldClasses} required />
                </div>

                <div>
                    <label className={labelClasses}>D. Estilo de Editoração (Escolha até 2)</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {editorialStyles.map(({ id, name }) => (
                            <button
                                type="button"
                                key={id}
                                onClick={() => handleStyleToggle(id)}
                                className={`p-3 rounded-md border-2 font-bold transition-all duration-200 ${inputs.editorialStyles.includes(id) ? 'bg-fuchsia-600 border-fuchsia-400 text-white' : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-fuchsia-500'}`}
                            >
                                {name}
                            </button>
                        ))}
                    </div>
                </div>

                <div>
                    <label htmlFor="visualHighlight" className={labelClasses}>E. Elemento de Destaque Visual</label>
                    <input type="text" id="visualHighlight" name="visualHighlight" value={inputs.visualHighlight} onChange={handleInputChange} className={formFieldClasses} placeholder="Ex: Ilustrações vintage, fotos de alto contraste..." required />
                </div>

                <div>
                    <label htmlFor="dominantColor" className={labelClasses}>F. Cor Predominante</label>
                    <input type="text" id="dominantColor" name="dominantColor" value={inputs.dominantColor} onChange={handleInputChange} className={formFieldClasses} placeholder="Ex: Vermelho e preto, Tons pastel..." required />
                </div>

                <button
                    type="submit"
                    disabled={!isFormValid()}
                    className="w-full bg-fuchsia-600 text-white font-bold py-4 px-6 rounded-md hover:bg-fuchsia-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-lg shadow-fuchsia-500/20 font-display text-xl"
                >
                    Gerar Conceito
                </button>
            </form>
        </div>
    );
};

export default EditorialConceptCreator;