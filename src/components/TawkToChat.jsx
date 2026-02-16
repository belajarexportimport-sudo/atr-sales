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

        // Function to set visitor attributes
        const setVisitorAttributes = () => {
            if (profile && window.Tawk_API && typeof window.Tawk_API.setAttributes === 'function') {
                console.log("Setting Tawk.to attributes for:", profile.full_name);
                window.Tawk_API.setAttributes({
                    name: profile.full_name || 'Unknown',
                    email: profile.email || '',
                    hash: '', // Ensure no hash is sent if not used (security feature of Tawk.to)
                    sales_code: profile.sales_code || '', // Custom attribute
                    role: profile.role || 'sales'
                }, function (error) {
                    if (error) console.error('Tawk.to setAttributes error:', error);
                });
            }
        };

        // Check if Tawk_API is ready
        if (window.Tawk_API?.onLoaded) {
            setVisitorAttributes();
        } else {
            // If not ready, hook into onLoad
            // We need to be careful not to overwrite existing onLoad if any (though usually fine)
            // Ideally, Tawk.to supports multiple callbacks? No, it's a global function.
            // But for this app, we are the only consumer.

            // Backup existing onLoad
            const existingOnLoad = window.Tawk_API?.onLoad;

            window.Tawk_API = window.Tawk_API || {};
            window.Tawk_API.onLoad = function () {
                if (existingOnLoad) existingOnLoad();
                setVisitorAttributes();
            };
        }

        // Also try setting immediately in case it's missed
        setVisitorAttributes();

    }, [profile]);

    return null; // This component doesn't render anything
}
