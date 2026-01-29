import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export default function Navigation({ currentPage, onNavigate }) {
    const { user, profile, signOut } = useAuth();
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showMobileMenu, setShowMobileMenu] = useState(false);

    const handleLogout = async () => {
        await signOut();
        // AuthContext will handle redirect to login
    };

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: '📊' },
        { id: 'leads', label: 'Leads', icon: '👥' },
        { id: 'new-inquiry', label: 'New RFQ', icon: '📝' },
        { id: 'tracking', label: 'Tracking', icon: '📦' },
        // Only show Ops for Admin
        ...(profile?.role === 'admin' ? [{ id: 'ops', label: 'Ops', icon: '🔧' }] : []),
    ];

    return (
        <nav className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16">
                    {/* Logo and Brand */}
                    <div className="flex items-center">
                        <h1 className="text-xl font-bold text-primary-700">ATR Express</h1>
                        <span className="ml-2 text-sm text-gray-500 hidden sm:inline">Sales CRM</span>
                    </div>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex md:items-center md:space-x-4">
                        {menuItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => onNavigate(item.id)}
                                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentPage === item.id
                                    ? 'bg-primary-100 text-primary-700'
                                    : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                            >
                                <span className="mr-1">{item.icon}</span>
                                {item.label}
                            </button>
                        ))}

                        {/* User Menu */}
                        <div className="relative ml-3">
                            <button
                                onClick={() => setShowUserMenu(!showUserMenu)}
                                className="flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100"
                            >
                                <div className="w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center">
                                    {user?.email?.[0]?.toUpperCase() || 'U'}
                                </div>
                                <span className="hidden lg:inline">{user?.email}</span>
                            </button>

                            {showUserMenu && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
                                    <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-200">
                                        <p className="font-medium">{user?.email}</p>
                                        <p className="text-xs text-gray-500 mt-1">Sales Representative</p>
                                    </div>
                                    <button
                                        onClick={handleLogout}
                                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                                    >
                                        🚪 Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setShowMobileMenu(!showMobileMenu)}
                            className="p-2 rounded-md text-gray-700 hover:bg-gray-100"
                        >
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {showMobileMenu && (
                <div className="md:hidden border-t border-gray-200">
                    <div className="px-2 pt-2 pb-3 space-y-1">
                        {menuItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => {
                                    onNavigate(item.id);
                                    setShowMobileMenu(false);
                                }}
                                className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium ${currentPage === item.id
                                    ? 'bg-primary-100 text-primary-700'
                                    : 'text-gray-700 hover:bg-gray-100'
                                    }`}
                            >
                                <span className="mr-2">{item.icon}</span>
                                {item.label}
                            </button>
                        ))}
                        <div className="border-t border-gray-200 pt-2 mt-2">
                            <div className="px-3 py-2 text-sm text-gray-700">
                                <p className="font-medium">{user?.email}</p>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="block w-full text-left px-3 py-2 text-base font-medium text-red-600 hover:bg-red-50 rounded-md"
                            >
                                🚪 Logout
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}
