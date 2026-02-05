import { useState, useEffect } from 'react';

export default function Toast({ message, type, details, onClose }) {
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
        if (!details) {
            const timer = setTimeout(() => {
                onClose();
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [onClose, details]);

    // Color based on type
    const colors = {
        success: 'bg-green-900/90 border-green-500 text-green-100',
        error: 'bg-red-900/90 border-red-500 text-red-100',
        info: 'bg-blue-900/90 border-blue-500 text-blue-100'
    };

    const icon = {
        success: '✅',
        error: '❌',
        info: 'ℹ️'
    };

    return (
        <div className={`
            fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999] 
            flex flex-col px-6 py-3 rounded-xl shadow-2xl 
            border backdrop-blur-md animate-fade-in-down transition-all max-w-sm w-full
            ${colors[type] || colors.info}
        `}>
            <div className="flex items-center gap-3 justify-between w-full">
                <div className="flex items-center gap-3">
                    <span className="text-xl">{icon[type]}</span>
                    <span className="font-medium text-sm">{message}</span>
                </div>
                <button onClick={onClose} className="text-white/50 hover:text-white">✕</button>
            </div>

            {details && (
                <div className="mt-2">
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="text-[10px] uppercase tracking-wider font-bold text-white/60 hover:text-white border-b border-white/20 pb-0.5"
                    >
                        {expanded ? 'Hide Details' : 'Show Details'}
                    </button>
                    {expanded && (
                        <div className="mt-2 p-2 bg-black/30 rounded text-xs font-mono break-all max-h-32 overflow-y-auto text-white/80">
                            {typeof details === 'object' ? JSON.stringify(details, null, 2) : details}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
