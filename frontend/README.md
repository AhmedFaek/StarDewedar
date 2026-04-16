# Star Dewedar - Frontend

A premium industrial design system frontend built with React, Vite, and Tailwind CSS.

## 🎨 Design System
This frontend implements the **Industrial Precision** design system, featuring:
- Deep navy (#000e24) primary color with electric yellow accents
- Sharp edges (0px border-radius) for structural integrity
- Space Grotesk + Inter typography
- Tonal layering for depth and hierarchy
- Premium glassmorphism effects

See [DESIGN.md](../DESIGN.md) for the complete design specification.

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ and npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

The dev server will open at `http://localhost:3000`

## 📁 Project Structure

```
frontend/
├── src/
│   ├── components/       # Reusable React components
│   ├── pages/           # Page components
│   ├── styles/          # Global styles and Tailwind config imports
│   ├── utils/           # Utility functions
│   ├── App.jsx          # Root component
│   └── main.jsx         # Entry point
├── public/              # Static assets
├── index.html           # HTML template
├── vite.config.js       # Vite configuration
├── tailwind.config.js   # Tailwind CSS configuration
└── package.json         # Dependencies and scripts
```

## 🎯 Available Scripts

- `npm run dev` - Start Vite dev server with hot reload
- `npm run build` - Build optimized production bundle
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## 🎨 Tailwind Configuration

The `tailwind.config.js` includes all design system colors and typography:
- **Colors**: Primary navy, tertiary yellow, and surface hierarchy
- **Typography**: Display, headline, title, body, and label sizes
- **Shadows**: Industrial ambient shadows with navy tints
- **Effects**: Glassmorphism and frosted backgrounds

## 📚 Component Guidelines

All component development should follow the design system:
- Use `rounded-none` for sharp corners (0px border-radius)
- Use background color shifts instead of borders
- Leverage the typography utility classes
- Use color tokens from the Tailwind config
- Apply tonal layering for depth

## 🔗 Integration

The frontend communicates with the backend API at:
- Development: `http://localhost:5000` (default)
- Production: Environment-specific URL

## 📝 License

© 2026 Star Dewedar. All rights reserved.
