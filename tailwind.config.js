/** @type {import('tailwindcss').Config} */
export default {
    darkMode: ["class"],
    content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
  	extend: {
  		colors: {
  			forest: {
  				'50': '#f0fdf8',
  				'100': '#ccfbef',
  				'200': '#99f6db',
  				'300': '#5ceac3',
  				'400': '#2dd4a5',
  				'500': '#1a9d7a',
  				'600': '#1a7d62',
  				'700': '#1a6350',
  				'800': '#1a4d3e',
  				'900': '#0f2e25',
  				DEFAULT: '#1a4d3e'
  			},
  			primary: {
  				'50': '#FFF5EE',
  				'100': '#FFE4D4',
  				'200': '#FFC49E',
  				'300': '#FF9A62',
  				'400': '#F06A1A',
  				'500': '#F04A00',
  				'600': '#D94300',
  				'700': '#B53700',
  				'800': '#8C2B00',
  				'900': '#6B2100',
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			navy: {
  				'50': '#e8ecf0',
  				'100': '#c5cdd8',
  				'200': '#8a9bb3',
  				'300': '#5a7190',
  				'400': '#1e3a54',
  				'500': '#0a2a3f',
  				'600': '#072233',
  				'700': '#051b29',
  				'800': '#031927',
  				'900': '#020f18',
  				DEFAULT: '#031927'
  			},
  			dark: {
  				'50': '#e8eaf0',
  				'100': '#c5c9d6',
  				'200': '#9ea5bb',
  				'300': '#7780a0',
  				'400': '#59648c',
  				'500': '#3b4878',
  				'600': '#2f3a62',
  				'700': '#232e4e',
  				'800': '#031927',
  				'900': '#020f18',
  				DEFAULT: '#031927'
  			},
  			success: {
  				'50': '#f0fdf4',
  				'100': '#dcfce7',
  				'200': '#bbf7d0',
  				'300': '#86efac',
  				'400': '#4ade80',
  				'500': '#22c55e',
  				'600': '#16a34a'
  			},
  			warning: {
  				'50': '#fefce8',
  				'100': '#fef9c3',
  				'200': '#fef08a',
  				'300': '#fde047',
  				'400': '#facc15',
  				'500': '#eab308'
  			},
  			purple: {
  				'50': '#faf5ff',
  				'100': '#f3e8ff',
  				'200': '#e9d5ff',
  				'300': '#d8b4fe',
  				'400': '#c084fc',
  				'500': '#a855f7'
  			},
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		},
  		fontFamily: {
  			sans: [
  				'Urbanist',
  				'Inter',
  				'system-ui',
  				'sans-serif'
  			],
  			display: [
  				'Urbanist',
  				'Outfit',
  				'sans-serif'
  			],
  			playfair: [
  				'Urbanist',
  				'sans-serif'
  			]
  		},
  		boxShadow: {
  			sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  			DEFAULT: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  			md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  			lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  			card: '0 2px 8px rgba(0, 0, 0, 0.08)'
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}
