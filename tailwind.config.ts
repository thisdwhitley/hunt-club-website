import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Hunting Club Primary Colors
        'burnt-orange': '#FA7921',
        'bright-orange': '#FE9920',
        'muted-gold': '#B9A44C',
        'olive-green': '#566E3D',
        'dark-teal': '#0C4767',
        
        // Hunting Club Secondary Colors
        'forest-shadow': '#2D3E1F',
        'weathered-wood': '#8B7355',
        'morning-mist': '#E8E6E0',
        'clay-earth': '#A0653A',
        'pine-needle': '#4A5D32',
        'sunset-amber': '#D4A574',
        
        // Semantic color mappings
        primary: {
          DEFAULT: '#566E3D', // olive-green
          50: '#f6f7f4',
          100: '#e9ecdf',
          200: '#d4dbc2',
          300: '#b6c29b',
          400: '#96a372',
          500: '#7a8a54',
          600: '#566E3D', // Main olive green
          700: '#485936',
          800: '#3c472e',
          900: '#343c29',
        },
        
        secondary: {
          DEFAULT: '#B9A44C', // muted-gold
          50: '#faf9f4',
          100: '#f4f1e4',
          200: '#e9e0c4',
          300: '#dbc89f',
          400: '#ccad78',
          500: '#B9A44C', // Main muted gold
          600: '#ad8e42',
          700: '#907439',
          800: '#765f34',
          900: '#624f2e',
        },
        
        accent: {
          DEFAULT: '#FA7921', // burnt-orange
          50: '#fef7f3',
          100: '#feede6',
          200: '#fdd8c7',
          300: '#fcba9a',
          400: '#fa926c',
          500: '#FA7921', // Main burnt orange
          600: '#eb5b1c',
          700: '#c4481a',
          800: '#9c3c1c',
          900: '#7e331a',
        },
        
        success: {
          DEFAULT: '#FE9920', // bright-orange
          50: '#fff7ed',
          100: '#ffeed4',
          200: '#fed9a9',
          300: '#febc72',
          400: '#FE9920', // Main bright orange
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
        
        warning: {
          DEFAULT: '#B9A44C', // muted-gold
          50: '#faf9f4',
          100: '#f4f1e4',
          200: '#e9e0c4',
          300: '#dbc89f',
          400: '#ccad78',
          500: '#B9A44C', // Main muted gold
          600: '#ad8e42',
          700: '#907439',
          800: '#765f34',
          900: '#624f2e',
        },
        
        destructive: {
          DEFAULT: '#A0653A', // clay-earth
          50: '#faf6f3',
          100: '#f4eae4',
          200: '#e8d2c4',
          300: '#dab49f',
          400: '#c8916f',
          500: '#A0653A', // Main clay earth
          600: '#8f5633',
          700: '#77472b',
          800: '#623c28',
          900: '#523325',
        },
        
        info: {
          DEFAULT: '#0C4767', // dark-teal
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#0C4767', // Main dark teal
          900: '#0c2844',
        },
        
        // Background colors
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        
        // Card colors
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        
        // Popover colors
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        
        // Muted colors
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        
        // Border and input colors
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
      },
      
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      
      boxShadow: {
        'club': '0 4px 6px -1px rgba(86, 110, 61, 0.1), 0 2px 4px -1px rgba(86, 110, 61, 0.06)',
        'club-lg': '0 10px 15px -3px rgba(86, 110, 61, 0.1), 0 4px 6px -2px rgba(86, 110, 61, 0.05)',
        'club-xl': '0 20px 25px -5px rgba(86, 110, 61, 0.1), 0 10px 10px -5px rgba(86, 110, 61, 0.04)',
      },
      
      backgroundImage: {
        'hunt-gradient': 'linear-gradient(135deg, #566E3D, #4A5D32)',
        'autumn-gradient': 'linear-gradient(135deg, #FA7921, #FE9920)',
        'earth-gradient': 'linear-gradient(135deg, #8B7355, #A0653A)',
        'morning-gradient': 'linear-gradient(135deg, #E8E6E0, #f5f4f0)',
      },
      
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      
      screens: {
        'xs': '475px',
        '3xl': '1600px',
      },
      
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      
      borderRadius: {
        'club': '0.75rem', // 12px - standard club border radius
      },
      
      fontSize: {
        'xxs': ['0.625rem', { lineHeight: '0.75rem' }],
      },
      
      zIndex: {
        'modal': '1000',
        'tooltip': '1100',
        'notification': '1200',
      },
    },
  },
  plugins: [
    // Add any required plugins here
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
  
  // Enable dark mode if needed
  darkMode: ['class'],
};

export default config;
