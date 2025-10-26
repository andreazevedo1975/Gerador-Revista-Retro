import React from 'react';
import { Magazine, MagazineHistoryEntry } from '../types';

interface HistoryPanelProps {
    history: MagazineHistoryEntry[];
    onRevert: (magazine: Magazine) => void;
    onClose: () => void;
}

const CloseIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);


const HistoryPanel: React.FC<HistoryPanelProps> = ({ history, onRevert, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black/70 z-40 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-2xl p-6 border border-fuchsia-500/30 w-full max-w-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-display text-yellow-300">Histórico de Versões</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-700 transition-colors">
                        <CloseIcon />
                    </button>
                </div>

                {history.length > 0 ? (
                    <ul className="space-y-3 max-h-96 overflow-y-auto pr-2">
                        {history.map(entry => (
                            <li key={entry.timestamp} className="bg-gray-900/50 p-4 rounded-md flex justify-between items-center border border-cyan-500/20 transition-colors hover:border-cyan-400/50">
                                <div>
                                    <p className="font-bold text-gray-200">{new Date(entry.timestamp).toLocaleString('pt-BR')}</p>
                                    <p className="text-sm text-gray-400">{entry.magazine.title}</p>
                                </div>
                                <button
                                    onClick={() => onRevert(entry.magazine)}
                                    className="bg-cyan-600 text-white font-bold py-2 px-4 rounded-md hover:bg-cyan-700 transition-colors font-display text-sm"
                                >
                                    Restaurar
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="text-center text-gray-500 italic py-8">
                        <p>Nenhuma versão foi salva ainda.</p>
                        <p className="text-sm mt-2">Clique em "Salvar Versão" no compositor para criar um ponto de restauração.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HistoryPanel;
