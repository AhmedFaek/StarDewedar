/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,jsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Primary Blue (Brand Action & Highlights) - #1B75BA
                primary: {
                    DEFAULT: "#1B75BA",
                    container: "#102A43",
                    light: "#358FD6",
                    dark: "#145D94",
                    fixed: "#DCEBF7",
                    fixedDim: "#B9D7F0"
                },
                onPrimary: {
                    DEFAULT: "#ffffff",
                    container: "#DCEBF7",
                    fixed: "#102A43",
                    fixedVariant: "#253746"
                },
                // Deep Blue (Architectural Contrast & Headings) - #102A43
                "deep-blue": {
                    DEFAULT: "#102A43",
                    container: "#0B1D30",
                    light: "#1C3B5E",
                    dark: "#081523"
                },
                // Tertiary Token - mapped to Brand Blue to update existing tertiary usages
                tertiary: {
                    DEFAULT: "#1B75BA",
                    fixed: "#1B75BA",
                    fixedDim: "#145D94",
                    container: "#DCEBF7"
                },
                onTertiary: {
                    DEFAULT: "#ffffff",
                    fixed: "#ffffff",
                    fixedVariant: "#102A43",
                    container: "#102A43"
                },
                // Kebab aliases used widely in JSX (Material-style token names)
                "on-tertiary": {
                    DEFAULT: "#ffffff",
                    fixed: "#ffffff",
                    "fixed-variant": "#102A43",
                    container: "#102A43"
                },
                "on-primary": {
                    DEFAULT: "#ffffff",
                    container: "#DCEBF7",
                    fixed: "#102A43",
                    "fixed-variant": "#253746"
                },
                // Secondary - Slate Steel - #5D6D7E
                secondary: {
                    DEFAULT: "#5D6D7E",
                    container: "#F3F6F9",
                    containerHigh: "#EAEEF3",
                    fixed: "#E2E8F0",
                    fixedDim: "#CBD5E1"
                },
                onSecondary: {
                    DEFAULT: "#ffffff",
                    fixed: "#253746",
                    fixedVariant: "#435364",
                    container: "#253746"
                },
                "on-secondary": {
                    DEFAULT: "#ffffff",
                    fixed: "#253746",
                    "fixed-variant": "#435364",
                    container: "#253746"
                },
                // Body text token
                bodyText: "#253746",

                // Error
                error: "#ba1a1a",
                onError: "#ffffff",
                errorContainer: "#ffdad6",
                onErrorContainer: "#93000a",

                // Surface Hierarchy - Light background (#F3F6F9) & White (#FFFFFF)
                background: "#F3F6F9",
                onBackground: "#253746",
                "on-background": "#253746",
                surface: "#ffffff",
                onSurface: "#253746",
                "on-surface": "#253746",
                surfaceVariant: "#EAEEF3",
                "surface-variant": "#EAEEF3",
                onSurfaceVariant: "#5D6D7E",
                "on-surface-variant": "#5D6D7E",
                surfaceContainerLowest: "#ffffff",
                "surface-container-lowest": "#ffffff",
                surfaceContainerLow: "#F3F6F9",
                "surface-container-low": "#F3F6F9",
                surfaceContainer: "#EBF0F5",
                "surface-container": "#EBF0F5",
                surfaceContainerMid: "#E4EBF1",
                "surface-container-mid": "#E4EBF1",
                surfaceContainerHigh: "#DEE6EE",
                "surface-container-high": "#DEE6EE",
                surfaceContainerHighest: "#D5E0EB",
                "surface-container-highest": "#D5E0EB",
                surfaceBright: "#ffffff",
                "surface-bright": "#ffffff",
                surfaceDim: "#E2E8F0",
                "surface-dim": "#E2E8F0",
                inverseSurface: "#102A43",
                "inverse-surface": "#102A43",
                inverseOnSurface: "#F3F6F9",
                "inverse-on-surface": "#F3F6F9",

                // Outline
                outline: "#8FA3B5",
                outlineVariant: "#D0DCE5",
                "outline-variant": "#D0DCE5",
                surfaceTint: "#1B75BA",
                "surface-tint": "#1B75BA",
                inversePrimary: "#94C5EB",
                "inverse-primary": "#94C5EB"
            },
            borderRadius: {
                none: "0px"
            },
            fontSize: {
                // Display
                "display-lg": "3.5rem",
                "display-md": "2.8rem",
                "display-sm": "2.2rem",
                // Headline
                "headline-lg": "2rem",
                "headline-md": "1.75rem",
                "headline-sm": "1.5rem",
                // Title
                "title-lg": "1.375rem",
                "title-md": "1.125rem",
                "title-sm": "1rem",
                // Body
                "body-lg": "1rem",
                "body-md": "0.875rem",
                "body-sm": "0.75rem",
                // Label
                "label-lg": "0.875rem",
                "label-md": "0.75rem",
                "label-sm": "0.6875rem"
            },
            fontFamily: {
                "space-grotesk": ["Space Grotesk", "sans-serif"],
                "inter": ["Inter", "sans-serif"],
                "headline": ["Space Grotesk", "sans-serif"],
                "body": ["Inter", "sans-serif"],
                "label": ["Inter", "sans-serif"]
            },
            letterSpacing: {
                tighter: "-0.02em",
                wider: "+0.05em"
            },
            boxShadow: {
                // Ambient industrial shadows with deep blue tint
                ambient: "0px 24px 48px rgba(16, 42, 67, 0.08)",
                ambient2: "0px 16px 32px rgba(16, 42, 67, 0.06)",
                ambient3: "0px 8px 16px rgba(16, 42, 67, 0.04)",
                xs: "0px 1px 2px rgba(16, 42, 67, 0.06)"
            },
            backdropBlur: {
                frosted: "20px"
            }
        },
    },
    plugins: [],
}
