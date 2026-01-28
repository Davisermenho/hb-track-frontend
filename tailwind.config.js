/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
  	extend: {
  		screens: {
  			'2xsm': '375px',
  			xsm: '425px',
  			'3xl': '2000px'
  		},
  		colors: {
  			slate: {
  				'850': '#151b28'
  			},
  			hb: {
  				surface: '#ffffff',
  				background: '#f8fafc',
  				border: '#e2e8f0',
  				text: '#0f172a',
  				muted: '#64748b',
  				subtle: '#94a3b8',
  				active: '#f1f5f9'
  			},
  			brand: {
  				'25': '#eff6ff',
  				'50': '#dbeafe',
  				'100': '#bfdbfe',
  				'200': '#93c5fd',
  				'300': '#60a5fa',
  				'400': '#3b82f6',
  				'500': '#3b82f6',
  				'600': '#2563eb',
  				'700': '#1d4ed8',
  				'800': '#1e40af',
  				'900': '#1e3a8a',
  				'950': '#172554'
  			},
  			gray: {
  				'25': '#fcfcfd',
  				'50': '#f9fafb',
  				'100': '#f2f4f7',
  				'200': '#e4e7ec',
  				'300': '#d0d5dd',
  				'400': '#98a2b3',
  				'500': '#667085',
  				'600': '#475467',
  				'700': '#344054',
  				'800': '#1d2939',
  				'900': '#101828',
  				'950': '#0c111d',
  				dark: '#1a2231'
  			},
  			success: {
  				'25': '#f6fef9',
  				'50': '#ecfdf3',
  				'100': '#d1fadf',
  				'200': '#a6f4c5',
  				'300': '#6ce9a6',
  				'400': '#32d583',
  				'500': '#12b76a',
  				'600': '#039855',
  				'700': '#027a48',
  				'800': '#05603a',
  				'900': '#054f31',
  				'950': '#053321'
  			},
  			error: {
  				'25': '#fffbfa',
  				'50': '#fef3f2',
  				'100': '#fee4e2',
  				'200': '#fecdca',
  				'300': '#fda29b',
  				'400': '#f97066',
  				'500': '#f04438',
  				'600': '#d92d20',
  				'700': '#b42318',
  				'800': '#912018',
  				'900': '#7a271a',
  				'950': '#55160c'
  			},
  			warning: {
  				'25': '#fffcf5',
  				'50': '#fffaeb',
  				'100': '#fef0c7',
  				'200': '#fedf89',
  				'300': '#fec84b',
  				'400': '#fdb022',
  				'500': '#f79009',
  				'600': '#dc6803',
  				'700': '#b54708',
  				'800': '#93370d',
  				'900': '#7a2e0e',
  				'950': '#4e1d09'
  			},
  			orange: {
  				'25': '#fffaf5',
  				'50': '#fff6ed',
  				'100': '#ffead5',
  				'200': '#fddcab',
  				'300': '#feb273',
  				'400': '#fd853a',
  				'500': '#fb6514',
  				'600': '#ec4a0a',
  				'700': '#c4320a',
  				'800': '#9c2a10',
  				'900': '#7e2410',
  				'950': '#511c10'
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
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
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
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
}