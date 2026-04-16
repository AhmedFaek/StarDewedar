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
                    light: "#1a3a5c",
                    fixed: "#d6e3ff",
                    fixedDim: "#adc7f8"
                },
                onPrimary: {
                    DEFAULT: "#ffffff",
                    container: "#718bb9",
                    fixed: "#001b3d",
                    fixedVariant: "#2c4771"
                },
                // Tertiary - Electric Yellow (The Spark)
                tertiary: {
                    DEFAULT: "#6a5f00",
                    fixed: "#f9e454",
                    fixedDim: "#dcc839",
                    container: "#bfac1b"
                },
                onTertiary: {
                    DEFAULT: "#ffffff",
                    fixed: "#201c00",
                    fixedVariant: "#504700",
                    container: "#484000"
                },
                // Secondary - Steel
                secondary: {
                    DEFAULT: "#5d5e61",
                    container: "#e2e2e5",
                    containerHigh: "#f5f5f9",
                    fixed: "#e2e2e5",
                    fixedDim: "#c6c6c9"
                },
                onSecondary: {
                    DEFAULT: "#ffffff",
                    fixed: "#1a1c1e",
                    fixedVariant: "#454749",
                    container: "#636467"
                },
                // Error
                error: "#ba1a1a",
                onError: "#ffffff",
                errorContainer: "#ffdad6",
                onErrorContainer: "#93000a",

                // Surface Hierarchy
                background: "#f7f9fc",
                onBackground: "#191c1e",
                surface: "#f7f9fc",
                onSurface: "#191c1e",
                surfaceVariant: "#e0e3e6",
                onSurfaceVariant: "#43474e",
                surfaceContainerLowest: "#ffffff",
                surfaceContainerLow: "#f2f4f7",
                surfaceContainer: "#eceef1",
                surfaceContainerMid: "#ededf1",
                surfaceContainerHigh: "#e6e8eb",
                surfaceContainerHighest: "#e0e3e6",
                surfaceBright: "#f7f9fc",
                surfaceDim: "#d8dadd",
                inverseSurface: "#2d3133",
                inverseOnSurface: "#eff1f4",

                // Outline
                outline: "#74777f",
                outlineVariant: "#c4c6d0",
                surfaceTint: "#455f8a",
                inversePrimary: "#adc7f8"
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
