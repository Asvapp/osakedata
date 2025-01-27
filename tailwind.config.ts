import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'nav-blue': '#1a4b8c',  // Yläpalkin sininen
        'btn-blue': '#0d2b50',  // Tummansininen napeille
        'card-gray': '#f5f5f5'  // Vaalea harmaa elementeille
      },
      fontFamily: {
        'quicksand': ['Quicksand', 'sans-serif']
      },
      borderRadius: {
        'custom': '10px'
      },
      boxShadow: {
        'custom': 'rgba(0,0,0,0.2) -4px 4px 4px'
      }
    },
  },
  plugins: [],
}

export default config