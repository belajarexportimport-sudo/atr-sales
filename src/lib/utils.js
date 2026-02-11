import clsx from 'clsx'
import { twMerge } from 'tailwind-merge'

// Utility function to merge Tailwind classes
export function cn(...inputs) {
    return twMerge(clsx(inputs))
}

// Format currency to IDR
export function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount)
}

// Calculate commission based on GP only (10% of GP)
export function calculateCommission(revenue, gp, rate = 0.10) {
    return gp * rate;
}

// Mask customer name for leaderboard
export function maskCustomerName(name) {
    if (!name || name.length < 3) return '***'
    return name.substring(0, 3) + '*'.repeat(name.length - 3)
}

// Format date to readable format with robust parsing
export function formatDate(date) {
    if (!date) return '-';

    // 1. Force convert to string to be safe
    let dateStr = String(date);

    // 2. Optimization: If strict Supabase timestamp (YYYY-MM-DD HH:MM:SS+ZZ), replace space with T for strict ISO compliance
    // Safari and some browsers fail on "2026-01-01 12:00:00+00" without the 'T'
    if (dateStr.length > 10 && dateStr.charAt(10) === ' ' && dateStr.includes('+')) {
        dateStr = dateStr.replace(' ', 'T');
    }

    // 3. Try parsing
    let d = new Date(dateStr);

    // 4. If invalid, try the "Time" fallback (just in case there's legacy Dirty Data text)
    if (isNaN(d.getTime())) {
        // Handle "1/21/2026 Time 09:01 am" format manually
        if (dateStr.includes('Time')) {
            const match = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s*Time\s*(\d{1,2}):(\d{2})\s*(am|pm)/i);
            if (match) {
                let [_, month, day, year, hour, minute, ampm] = match;
                hour = parseInt(hour, 10);
                if (ampm.toLowerCase() === 'pm' && hour < 12) hour += 12;
                if (ampm.toLowerCase() === 'am' && hour === 12) hour = 0;
                d = new Date(year, month - 1, day, hour, minute);
            }
        }
    }

    // 5. Final check
    if (isNaN(d.getTime())) {
        // Try fallback: cleaning unknown characters
        const cleanDate = new Date(dateStr.replace(/Time/i, '').trim());
        if (!isNaN(cleanDate.getTime())) d = cleanDate;
        else return '-';
    }

    return d.toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Get Tailwind color class for status badge
export function getStatusColor(status) {
    const colors = {
        'Profiling': 'bg-blue-900/50 text-blue-200 border border-blue-800',
        'Proposal': 'bg-purple-900/50 text-purple-200 border border-purple-800',
        'Negotiation': 'bg-yellow-900/50 text-yellow-200 border border-yellow-800',
        'Won': 'bg-green-900/50 text-green-200 border border-green-800',
        'Won - Verification at WHS': 'bg-teal-900/50 text-teal-200 border border-teal-800',
        'Lost': 'bg-red-900/50 text-red-200 border border-red-800',
        'Invoiced': 'bg-indigo-900/50 text-indigo-200 border border-indigo-800',
        'Paid': 'bg-emerald-900/50 text-emerald-200 border border-emerald-800',
        'Overdue': 'bg-orange-900/50 text-orange-200 border border-orange-800',
    }
    return colors[status] || 'bg-gray-800 text-gray-300 border border-gray-700'
}

export function getLeadStatusColor(status) {
    const colors = {
        'Cold': 'bg-blue-900/50 text-blue-200 border border-blue-800',
        'Warm': 'bg-yellow-900/50 text-yellow-200 border border-yellow-800',
        'Hot': 'bg-red-900/50 text-red-200 border border-red-800',
    }
    return colors[status] || 'bg-gray-800 text-gray-300 border border-gray-700'
}
