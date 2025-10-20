import React, { useState, useEffect } from 'react';

interface CommentsProps {
    articleId: string;
}

const Comments: React.FC<CommentsProps> = ({ articleId }) => {
    const [comments, setComments] = useState<string[]>([]);
    const [newComment, setNewComment] = useState('');

    useEffect(() => {
        try {
            const allCommentsJSON = localStorage.getItem('retroGamerComments');
            if (allCommentsJSON) {
                const allComments = JSON.parse(allCommentsJSON);
                const articleComments = allComments[articleId] || [];
                setComments(articleComments);
            }
        } catch (error) {
            console.error("Failed to load comments from localStorage", error);
        }
    }, [articleId]);

    const saveComments = (updatedComments: string[]) => {
        try {
            const allCommentsJSON = localStorage.getItem('retroGamerComments');
            const allComments = allCommentsJSON ? JSON.parse(allCommentsJSON) : {};
            allComments[articleId] = updatedComments;
            localStorage.setItem('retroGamerComments', JSON.stringify(allComments));
        } catch (error) {
            console.error("Failed to save comments to localStorage", error);
        }
    };

    const handleCommentSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newComment.trim()) {
            const updatedComments = [...comments, newComment.trim()];
            setComments(updatedComments);
            saveComments(updatedComments);
            setNewComment('');
        }
    };

    return (
        <div className="mt-12">
            <h4 className="font-display text-2xl text-yellow-300 mb-6 border-t-2 border-fuchsia-500/30 pt-6">Comentários dos Leitores</h4>
            
            <div className="space-y-4 mb-8">
                {comments.length > 0 ? (
                    comments.map((comment, index) => (
                        <div key={index} className="bg-gray-900/50 p-4 rounded-md border border-cyan-500/20">
                            <p className="text-gray-300 whitespace-pre-wrap">{comment}</p>
                        </div>
                    ))
                ) : (
                    <p className="text-gray-500 italic">Seja o primeiro a comentar!</p>
                )}
            </div>

            <form onSubmit={handleCommentSubmit} className="flex flex-col gap-4">
                <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Deixe seu comentário aqui..."
                    className="w-full h-24 p-3 border-2 border-cyan-500/50 bg-gray-900 text-gray-200 rounded-md focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 transition duration-200 placeholder-gray-500"
                    required
                />
                <button
                    type="submit"
                    className="self-end bg-fuchsia-600 text-white font-bold py-2 px-6 rounded-md hover:bg-fuchsia-700 disabled:bg-gray-600 transition-colors duration-300 transform hover:scale-105 shadow-lg shadow-fuchsia-500/20 font-display text-sm"
                >
                    Enviar Comentário
                </button>
            </form>
        </div>
    );
};

export default Comments;
