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

// Calculate commission based on GP only
export function calculateCommission(revenue, gp, rate = 0.02) {
    return gp * rate;
}

// Mask customer name for leaderboard
export function maskCustomerName(name) {
    if (!name || name.length < 3) return '***'
    return name.substring(0, 3) + '*'.repeat(name.length - 3)
}

// Format date to readable format
export function formatDate(date) {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    })
}

// Get Tailwind color class for status badge
export function getStatusColor(status) {
    const colors = {
        'Profiling': 'bg-blue-900/50 text-blue-200 border border-blue-800',
        'Proposal': 'bg-purple-900/50 text-purple-200 border border-purple-800',
        'Negotiation': 'bg-yellow-900/50 text-yellow-200 border border-yellow-800',
        'Won': 'bg-green-900/50 text-green-200 border border-green-800',
        'Lost': 'bg-red-900/50 text-red-200 border border-red-800',
        'Invoiced': 'bg-indigo-900/50 text-indigo-200 border border-indigo-800',
        'Paid': 'bg-emerald-900/50 text-emerald-200 border border-emerald-800',
        'Overdue': 'bg-orange-900/50 text-orange-200 border border-orange-800',
    }
    return colors[status] || 'bg-gray-800 text-gray-300 border border-gray-700'
}

// Get Tailwind color class for lead status badge
export function getLeadStatusColor(status) {
    const colors = {
        'Cold': 'bg-blue-900/50 text-blue-200 border border-blue-800',
        'Warm': 'bg-yellow-900/50 text-yellow-200 border border-yellow-800',
        'Hot': 'bg-red-900/50 text-red-200 border border-red-800',
    }
    return colors[status] || 'bg-gray-800 text-gray-300 border border-gray-700'
}
