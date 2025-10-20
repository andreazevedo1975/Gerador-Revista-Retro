import React, { useState, useEffect, useRef } from 'react';

interface EditableTextProps {
    text: string;
    onSave: (newText: string) => void;
    tag: React.ElementType;
    className?: string;
    isTextArea?: boolean;
    renderFunction?: (text: string) => React.ReactNode;
}

const EditableText: React.FC<EditableTextProps> = ({ text, onSave, tag: Tag, className, isTextArea = false, renderFunction }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [currentText, setCurrentText] = useState(text);
    const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);

    useEffect(() => {
        setCurrentText(text);
    }, [text]);

    useEffect(() => {
        if (isEditing) {
            inputRef.current?.focus();
            inputRef.current?.select();
        }
    }, [isEditing]);
    
    const handleSave = () => {
        setIsEditing(false);
        if (currentText.trim() !== text.trim()) {
            onSave(currentText);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !isTextArea && !e.shiftKey) {
            handleSave();
        } else if (e.key === 'Escape') {
            setCurrentText(text);
            setIsEditing(false);
        }
    };

    if (isEditing) {
        const commonProps = {
            value: currentText,
            onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setCurrentText(e.target.value),
            onBlur: handleSave,
            onKeyDown: handleKeyDown,
            className: `${className} bg-gray-900 border-2 border-cyan-400 rounded-md focus:outline-none w-full p-1`
        };

        return isTextArea ? (
            <textarea {...commonProps} ref={inputRef as React.Ref<HTMLTextAreaElement>} rows={Math.max(10, currentText.split('\n').length)} />
        ) : (
            <input type="text" {...commonProps} ref={inputRef as React.Ref<HTMLInputElement>} />
        );
    }
    
    const CustomTag = Tag as any;

    return (
        <CustomTag 
            onClick={() => setIsEditing(true)} 
            className={`${className} cursor-pointer hover:bg-gray-700/50 rounded-md p-1 transition-colors duration-200`}
            title="Clique para editar"
        >
            {renderFunction ? renderFunction(text) : text}
        </CustomTag>
    );
};

export default EditableText;
