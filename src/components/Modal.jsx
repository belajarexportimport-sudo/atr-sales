export default function Modal({ isOpen, title, message, onConfirm, onCancel, type = 'warning' }) {
    if (!isOpen) return null;

    const colors = {
        warning: 'text-yellow-500 bg-yellow-900/20 border-yellow-600',
        danger: 'text-red-500 bg-red-900/20 border-red-600',
        info: 'text-blue-500 bg-blue-900/20 border-blue-600',
    };

    return (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
            <div className="bg-secondary-800 border border-gray-700 rounded-xl shadow-2xl max-w-sm w-full p-6 transform transition-all scale-100">
                <div className="flex items-center gap-3 mb-4">
                    <div className={`p-2 rounded-full border ${colors[type]}`}>
                        {type === 'warning' && '⚠️'}
                        {type === 'danger' && '🛑'}
                        {type === 'info' && 'ℹ️'}
                    </div>
                    <h3 className="text-xl font-bold text-gray-100">{title}</h3>
                </div>

                <p className="text-gray-300 mb-6 leading-relaxed">
                    {message}
                </p>

                <div className="flex justify-end gap-3">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors font-medium text-sm"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={onConfirm}
                        className="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-500 text-white font-bold text-sm shadow-lg shadow-primary-900/50"
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
}
