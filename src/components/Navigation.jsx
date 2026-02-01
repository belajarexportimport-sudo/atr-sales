import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function Navigation({ currentPage, onNavigate }) {
    const { user, profile, signOut } = useAuth();

    const handleLogout = async () => {
        await signOut();
    };

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: '📊' },
        { id: 'leads', label: 'Leads', icon: '👥' },
        { id: 'new-inquiry', label: 'New RFQ', icon: '📝' },
        { id: 'tracking', label: 'Tracking', icon: '📦' },
        { id: 'debug', label: 'Diagnose', icon: '🛠️' },
        // Only show Ops for Admin
        ...(profile?.role === 'admin' ? [{ id: 'ops', label: 'Ops', icon: '🔧' }] : []),
    ];

    return (
        <nav className="bg-secondary-800 border-b border-gray-700 shadow-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    <div className="flex">
                        <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer" onClick={() => onNavigate('dashboard')}>
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-lg shadow-primary-900/50">
                                <span className="text-secondary-900 font-bold text-xs tracking-tighter">ATR</span>
                            </div>
                            <span className="font-bold text-lg text-primary-500 tracking-wide uppercase">ATR Express</span>
                            <span className="text-[10px] text-gray-500 ml-1 border border-primary-900/50 px-1 rounded bg-secondary-900">v2.7 COMMS</span>
                        </div>
                    </div>

                    <div className="flex items-center space-x-4">
                        <div className="hidden md:flex items-center space-x-2 mr-4">
                            <span className="text-sm font-medium text-gray-300">{profile?.full_name}</span>
                            <span className="text-xs px-2 py-1 rounded bg-secondary-700 text-primary-400 font-mono border border-gray-700">{profile?.role}</span>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="text-gray-400 hover:text-primary-400 transition-colors p-2 rounded-lg hover:bg-secondary-700"
                            title="Sign Out"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 01-3-3h4a3 3 0 01 3 3v1" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Navigation Bar */}
            <div className="bg-secondary-900 border-t border-gray-800 overflow-x-auto">
                <div className="max-w-7xl mx-auto px-2 flex space-x-1 py-2">
                    {menuItems.map(item => (
                        (!item.role || item.role === profile?.role) && (
                            <button
                                key={item.id}
                                onClick={() => onNavigate(item.id)}
                                className={`
                                    flex items-center px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200
                                    ${currentPage === item.id
                                        ? 'bg-gradient-to-r from-primary-900/40 to-primary-900/10 text-primary-400 border border-primary-900/50 shadow-[0_0_10px_rgba(212,175,55,0.1)]'
                                        : 'text-gray-400 hover:bg-secondary-700 hover:text-gray-200'}
                                `}
                            >
                                <span className={`mr-2 ${currentPage === item.id ? 'text-primary-500' : 'text-gray-500'}`}>{item.icon}</span>
                                {item.label}
                            </button>
                        )
                    ))}
                </div>
            </div>
        </nav>
    );
}
