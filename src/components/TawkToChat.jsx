import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

/**
 * TawkTo Chat Widget Component
 * Only shows for non-admin users (sales)
 * Admin should use Tawk.to Dashboard instead
 */
export default function TawkToChat() {
    const { profile } = useAuth();

    useEffect(() => {
        // Only load Tawk.to for non-admin users
        if (profile?.role === 'admin') {
            // Hide widget for admin
            if (window.Tawk_API && typeof window.Tawk_API.hideWidget === 'function') {
                window.Tawk_API.hideWidget();
            }
            return;
        }

        // Show widget for sales/regular users
        if (window.Tawk_API && typeof window.Tawk_API.showWidget === 'function') {
            window.Tawk_API.showWidget();
        }

        // Set user attributes for better tracking
        if (profile && window.Tawk_API && typeof window.Tawk_API.setAttributes === 'function') {
            window.Tawk_API.setAttributes({
                name: profile.full_name || 'Unknown',
                email: profile.email || '',
                salesCode: profile.sales_code || '',
                role: profile.role || 'sales'
            }, function (error) {
                if (error) console.error('Tawk.to setAttributes error:', error);
            });
        }
    }, [profile]);

    return null; // This component doesn't render anything
}
