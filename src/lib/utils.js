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

// Calculate commission based on revenue and GP
export function calculateCommission(revenue, gp, rate = 0.02) {
    return (revenue - gp) * rate
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
        'Profiling': 'bg-blue-100 text-blue-800',
        'Proposal': 'bg-purple-100 text-purple-800',
        'Negotiation': 'bg-yellow-100 text-yellow-800',
        'Won': 'bg-green-100 text-green-800',
        'Lost': 'bg-red-100 text-red-800',
        'Invoiced': 'bg-indigo-100 text-indigo-800',
        'Paid': 'bg-emerald-100 text-emerald-800',
        'Overdue': 'bg-orange-100 text-orange-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
}

// Get Tailwind color class for lead status badge
export function getLeadStatusColor(status) {
    const colors = {
        'Cold': 'bg-blue-100 text-blue-800',
        'Warm': 'bg-yellow-100 text-yellow-800',
        'Hot': 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
}
