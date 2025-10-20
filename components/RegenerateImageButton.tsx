import React from 'react';

interface RegenerateImageButtonProps {
    imageId: string;
    onRegenerate: (id: string) => void;
    isLoading: boolean;
}

const RegenerateIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0011.664 0M2.985 19.644L6.166 16.46m11.665-11.665h-4.992m0 0v4.992m0-4.993l-3.181-3.183a8.25 8.25 0 00-11.664 0M21.015 4.356L17.834 7.54m-11.665 11.665l3.181 3.183" />
    </svg>
);

const SpinnerIcon: React.FC<{className?: string}> = ({ className }) => (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const RegenerateImageButton: React.FC<RegenerateImageButtonProps> = ({ imageId, onRegenerate, isLoading }) => {
    return (
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 flex justify-center items-center">
            <button
                onClick={() => onRegenerate(imageId)}
                disabled={isLoading}
                className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-fuchsia-600 text-white font-bold py-2 px-4 rounded-md shadow-lg flex items-center space-x-2 disabled:cursor-wait hover:bg-fuchsia-700 font-display text-sm"
            >
                {isLoading ? (
                    <>
                        <SpinnerIcon className="w-5 h-5" />
                        <span>Gerando...</span>
                    </>
                ) : (
                    <>
                        <RegenerateIcon className="w-5 h-5" />
                        <span>Nova Imagem</span>
                    </>
                )}
            </button>
        </div>
    );
};

export default RegenerateImageButton;
