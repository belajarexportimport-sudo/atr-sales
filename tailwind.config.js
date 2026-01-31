/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#fbf8eb',
                    100: '#f6efcc',
                    200: '#eddfa0',
                    300: '#e3cc6e',
                    400: '#d7b53e',
                    500: '#d4af37', // ATR Gold Base
                    600: '#aa8625',
                    700: '#886620',
                    800: '#715220',
                    900: '#604421',
                    950: '#36240e',
                },
                secondary: {
                    900: '#000000',
                    800: '#111827',
                    600: '#374151',
                    700: '#1f2937', // Dark cards
                    500: '#6b7280',
                },
            },
        },
    },
    plugins: [],
}
