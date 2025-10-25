import React from 'react';
import { CreationType } from '../types';

interface TopicIconProps {
    type: CreationType;
}

const TopicIcon: React.FC<TopicIconProps> = ({ type }) => {
    const iconProps = {
        viewBox: "0 0 64 64",
        width: "48",
        height: "48",
        shapeRendering: "crispEdges" as const,
        className: "w-12 h-12"
    };

    switch (type) {
        case 'console':
            return (
                <svg {...iconProps}>
                    <g fill="#71717A"><path d="M4 24h56v20H4z"/></g>
                    <g fill="#A1A1AA"><path d="M6 26h52v16H6z"/></g>
                    <g fill="#52525B"><path d="M12 32h16v4H12z M36 32h16v4H36z"/></g>
                    <g fill="#A78BFA"><path d="M46 38h2v2h-2z M50 38h2v2h-2z"/></g>
                </svg>
            );
        case 'game':
            return (
                <svg {...iconProps}>
                    <g fill="#404040"><path d="M14 8h36v40h-8v-4h-4v4h-4v-4h-8v4h-4v-4h-4v4h-4z"/></g>
                    <g fill="#262626"><path d="M18 48h28v10H18z"/></g>
                    <g fill="#DC2626"><path d="M22 14h20v24H22z"/></g>
                    <g fill="#FBBF24"><path d="M26 20h4v4h-4z M34 20h4v4h-4z M30 26h4v4h-4z"/></g>
                </svg>
            );
        case 'guide':
            return (
                <svg {...iconProps}>
                    <g fill="#FDE68A"><path d="M12 4h40v56H12z"/></g>
                    <g fill="#FCD34D"><path d="M12 4h4v56h-4z M48 4h4v56h-4z"/></g>
                    <g fill="#DC2626"><path d="M20 12h4v4h-4z M24 16h4v4h-4z M28 20h4v4h-4z M32 24h4v4h-4z M36 28h4v4h-4z M40 32h4v4h-4z"/></g>
                    <g fill="#16A34A"><path d="M24 40h4v4h-4z M28 44h4v4h-4z M32 48h4v4h-4z"/></g>
                    <g fill="#EF4444"><path d="M40 36h8v8h-8z M42 38h4v4h-4z"/></g>
                </svg>
            );
        case 'developer':
            return (
                <svg {...iconProps}>
                    <g fill="#F472B6"><path d="M20 16h24v4h4v16h-4v4h-4v4H24v-4h-4v-4h-4V20h4z"/></g>
                    <g fill="#EC4899"><path d="M24 20h4v-4h16v4h4v12h-4v4h-4v4H28v-4h-4z"/></g>
                    <g fill="#FBBF24"><path d="M30 30h4v4h-4z M42 22h2v2h-2z"/></g>
                    <g fill="#BEF264"><path d="M22 24h2v2h-2z M36 40h2v2h-2z"/></g>
                </svg>
            );
        case 'rivalry':
            return (
                <svg {...iconProps}>
                    <g fill="#60A5FA"><path d="M12 40 L24 28 L40 44 L28 56 Z M26 26 L38 14 L42 18 L30 30 Z M22 30 L18 26 L14 30 L18 34 Z"/></g>
                    <g fill="#3B82F6"><path d="M12 40 L22 30 L18 26 L12 32 Z M28 56 L38 46 L40 44 L30 54 Z"/></g>
                    <g fill="#F87171"><path d="M52 40 L40 28 L24 44 L36 56 Z M38 26 L26 14 L22 18 L34 30 Z M42 30 L46 26 L50 30 L46 34 Z"/></g>
                    <g fill="#EF4444"><path d="M52 40 L42 30 L46 26 L52 32 Z M36 56 L26 46 L24 44 L34 54 Z"/></g>
                    <g fill="#FACC15"><path d="M30 28h4v-4h4v4h4v4h-4v4h-4v-4h-4z"/></g>
                </svg>
            );
        case 'soundtrack':
            return (
                <svg {...iconProps}>
                    <g fill="#E5E7EB"><path d="M8 18h48v28H8z"/></g>
                    <g fill="#D1D5DB"><path d="M12 22h40v20H12z"/></g>
                    <g fill="#374151"><path d="M22 28a6 6 0 1 0 12 0a6 6 0 1 0-12 0 M24 30h8v4h-8z M40 34h4v2h-4z"/></g>
                    <g fill="#4B5563"><path d="M25 31a3 3 0 1 0 6 0a3 3 0 1 0-6 0 M35 31a3 3 0 1 0 6 0a3 3 0 1 0-6 0"/></g>
                </svg>
            );
        default:
            return (
                <svg {...iconProps} className="w-12 h-12 text-gray-700">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            );
    }
};

export default TopicIcon;
