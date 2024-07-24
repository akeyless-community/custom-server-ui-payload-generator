/** @type {import('tailwindcss').Config} */
// tailwind.config.js
module.exports = {
    purge: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
    darkMode: false,
    theme: {
        extend: {
            colors: {
                'akeyless-blue': '#00b9ff',
                'akeyless-bg': '#f0f4f8',
                'akeyless-sidebar': '#e5edf5',
                'akeyless-text': '#333333',
                'akeyless-border': '#e0e0e0',
            },
        },
    },
    variants: {
        extend: {},
    },
    plugins: [],
}