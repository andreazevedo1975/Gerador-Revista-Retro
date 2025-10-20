import React, { useState, useEffect } from 'react';

interface LoadingOverlayProps {
    messages: string[];
}

const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ messages }) => {
    const [visibleMessages, setVisibleMessages] = useState<string[]>([]);

    useEffect(() => {
        if (messages.length > 0) {
            const lastMessage = messages[messages.length - 1];
            setVisibleMessages(prev => [...prev, lastMessage]);
        }
    }, [messages]);
    
    return (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-80 flex flex-col justify-center items-center z-50 backdrop-blur-sm">
            <div className="w-16 h-16 border-4 border-t-4 border-t-fuchsia-500 border-gray-600 rounded-full animate-spin mb-6"></div>
            <div className="text-white text-center">
                <h2 className="text-2xl font-bold mb-4 font-display text-yellow-300">CARREGANDO...</h2>
                <div className="h-48 overflow-y-auto text-lg space-y-2 text-cyan-300">
                   {visibleMessages.map((msg, index) => (
                       <p key={index} className="animate-fade-in">{`> ${msg}`}</p>
                   ))}
                </div>
            </div>
            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fade-in 0.5s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default LoadingOverlay;
