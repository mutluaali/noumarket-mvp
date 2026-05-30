module.exports = {
  darkMode: 'class',
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}', './lib/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          teal: '#00a0a0',
          'teal-dark': '#008585',
          'teal-light': '#2dd4bf',
          navy: '#0f172a',
          charcoal: '#111827',
        },
      },
      borderRadius: {
        card: '16px',
        panel: '20px',
        shell: '24px',
      },
      boxShadow: {
        card: '0 8px 30px rgba(15, 23, 42, 0.08)',
        'card-hover': '0 16px 40px rgba(15, 23, 42, 0.12)',
        premium: '0 20px 50px rgba(8, 145, 178, 0.15)',
        nav: '0 -8px 32px rgba(15, 23, 42, 0.08)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
