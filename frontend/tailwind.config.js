/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,jsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Primary - Deep Navy (Foundation)
                primary: {
                    DEFAULT: "#000e24",
                    container: "#00234b",
                    light: "#1a3a5c"
                },
                // Tertiary - Electric Yellow (The Spark)
                tertiary: {
                    DEFAULT: "#6a5f00",
                    fixed: "#f9e454",
                    fixedDim: "#e8d82f"
                },
                onTertiary: {
                    fixed: "#201c00",
                    fixedVariant: "#5d5200"
                },
                // Secondary - Steel
                secondary: {
                    DEFAULT: "#5d5e61",
                    container: "#e1e2e6",
                    containerHigh: "#f5f5f9"
                },
                onSecondary: "#ffffff",

                // Surface Hierarchy
                surface: "#f7f9fc",
                surfaceContainerLowest: "#ffffff",
                surfaceContainerLow: "#f2f4f7",
                surfaceContainerMid: "#ededf1",
                surfaceContainerHigh: "#e8e8ec",
                surfaceContainerHighest: "#e2e2e6",
                surfaceVariant: "#c4c6d0",
                onSurface: "#1a1a1e",
                onSurfaceVariant: "#48484f",

                // Outline
                outline: "#79747e",
                outlineVariant: "#c4c6d0"
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
                "inter": ["Inter", "sans-serif"]
            },
            letterSpacing: {
                tighter: "-0.02em",
                wider: "+0.05em"
            },
            boxShadow: {
                // Ambient industrial shadows with navy tint
                ambient: "0px 24px 48px rgba(0, 14, 36, 0.08)",
                ambient2: "0px 16px 32px rgba(0, 14, 36, 0.06)",
                ambient3: "0px 8px 16px rgba(0, 14, 36, 0.04)"
            },
            backdropBlur: {
                frosted: "20px"
            }
        },
    },
    plugins: [],
}
