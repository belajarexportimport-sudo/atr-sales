import { useEffect } from 'react';

export default function Toast({ message, type, onClose }) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 3000); // Disappears after 3 seconds

        return () => clearTimeout(timer);
    }, [onClose]);

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
            flex items-center gap-3 px-6 py-3 rounded-full shadow-2xl 
            border backdrop-blur-md animate-fade-in-down transition-all
            ${colors[type] || colors.info}
        `}>
            <span className="text-xl">{icon[type]}</span>
            <span className="font-medium text-sm">{message}</span>
            <button onClick={onClose} className="ml-2 text-white/50 hover:text-white">
                ✕
            </button>
        </div>
    );
}
