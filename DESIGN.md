```markdown
# Design System Specification: Industrial Precision

## 1. Overview & Creative North Star
**Creative North Star: "The Architectural Monolith"**

This design system is engineered to reflect the raw power and meticulous precision of heavy electrical manufacturing. It moves away from the "softness" of consumer tech, instead embracing a high-end editorial aesthetic that feels like a premium technical blueprint. 

To break the "template" look, we utilize **The Monolithic Grid**: a layout strategy characterized by intentional asymmetry, 0px radius "sharp-edge" containers, and massive typographic scale shifts. We aren't just building a website; we are constructing a digital environment that feels as solid and reliable as an industrial power grid. Trust is established through structural integrity, high-contrast clarity, and an uncompromising rejection of visual clutter.

---

## 2. Colors & Tonal Architecture
The palette is rooted in deep structural tones, punctuated by high-voltage accents.

### The "No-Line" Rule
**Standard 1px borders are strictly prohibited for sectioning.** To define space, designers must use background color shifts. For example, a `surface-container-low` section should sit directly against a `surface` background. The eye should perceive boundaries through shifts in "mass" rather than "strokes."

### Surface Hierarchy & Nesting
Treat the UI as a physical assembly of plates.
*   **Base Layer:** `surface` (#f7f9fc)
*   **Primary Sectioning:** `surface-container-low` (#f2f4f7)
*   **Interactive/Elevated Plates:** `surface-container-lowest` (#ffffff) for maximum contrast against the primary navy.

### The "Voltage" Gradient
To move beyond flat, "out-of-the-box" navy, main CTAs and Hero backgrounds should utilize a **Signature Texture**:
*   **Linear Gradient:** `primary` (#000e24) at 0% to `primary_container` (#00234b) at 100%. This provides a "machine-finish" depth that feels premium and industrial.

### Key Tokens:
*   **Primary (The Foundation):** `#000e24` (Deep Navy)
*   **Tertiary (The Spark):** `#6a5f00` / `tertiary_fixed` `#f9e454` (Electric Yellow)
*   **Neutral (The Steel):** `secondary` `#5d5e61`

---

## 3. Typography
The typographic system creates an "Authority Gap"—using significant size differences between headlines and body text to command attention.

*   **Display & Headlines (Space Grotesk):** This typeface was chosen for its geometric, "engineered" look. It should be tracked tightly (-0.02em) to feel like stamped metal.
    *   *Usage:* Use `display-lg` (3.5rem) for hero statements to evoke industry-leading scale.
*   **Title & Body (Inter):** A workhorse for readability. 
    *   *Usage:* `body-lg` (1rem) for technical specs and long-form copy.
*   **Labels (Inter Bold):** All labels should be uppercase with +0.05em tracking to mimic industrial equipment labeling.

---

## 4. Elevation & Depth: Tonal Layering
Traditional drop shadows are too "soft" for an industrial manufacturer. We achieve depth through **Tonal Layering** and **Glassmorphism**.

*   **The Layering Principle:** Depth is achieved by "stacking" surfaces. A `surface-container-highest` card should be placed on a `surface-variant` background to create a "lifted plate" effect without shadows.
*   **Ambient Industrial Shadows:** If a floating element (like a modal) is required, use a high-diffusion shadow: `0px 24px 48px rgba(0, 14, 36, 0.08)`. The shadow must use a tint of the `primary` navy, never pure black.
*   **The "Ghost Border":** For technical data tables where containment is vital, use `outline_variant` (#c4c6d0) at **15% opacity**. A solid 100% border is a failure of the system.
*   **Glassmorphism:** Use semi-transparent `surface_container_lowest` with a `20px backdrop-blur` for navigation bars. This creates a "frosted polycarbonate" effect common in high-end electrical enclosures.

---

## 5. Components

### Buttons: The "Solid-State" Variants
*   **Primary:** `primary` background, `on_primary` text. **0px border-radius.** High-contrast hover state using the "Voltage Gradient."
*   **Secondary:** `outline` token ghost-border (at 30% opacity) with `primary` text.
*   **Tertiary (The Warning/Action):** `tertiary_fixed` (#f9e454) background with `on_tertiary_fixed` (#201c00) text. Reserved strictly for "Request Quote" or "Emergency" actions.

### Cards & Industrial Lists
*   **Rule:** No dividers. Use `surface-container-low` and `surface-container-high` to create alternating zebra-striping or grouped containers.
*   **Padding:** Aggressive white space (minimum 32px) to ensure technical data feels organized, not cramped.

### Input Fields: "Technical Entries"
*   **Style:** Underline-only or subtle `surface-variant` fills.
*   **Active State:** Transition the underline to `tertiary` (Electric Yellow) to signify a "closed circuit" or active connection.

### New Component: The "Spec-Sheet" Chip
*   **Design:** Small, rectangular chips using `secondary_container`. Used for categorizing technical specifications (e.g., "600V," "IP67"). 

---

## 6. Do’s and Don’ts

### Do:
*   **Do** use 0px border-radius everywhere. Sharp corners convey precision and structural integrity.
*   **Do** use massive "Display" type (3.5rem+) overlapping high-quality industrial photography.
*   **Do** use the Electric Yellow sparingly. It is a "warning" and "action" color, not a decorative one.

### Don’t:
*   **Don’t** use rounded corners. Even a 4px radius dilutes the industrial "Monolith" aesthetic.
*   **Don’t** use standard grey shadows. They look "cheap." Use tonal navy blurs.
*   **Don’t** use 1px solid borders to separate sections. If the sections blend together, increase the background contrast between `surface` and `surface-container`.
*   **Don’t** use "Stock" imagery. Use high-contrast, macro-photography of electrical components, copper, and steel.

---

## 7. Director's Final Note
This design system is about the beauty of engineering. Every element should feel intentional and heavy. When in doubt, simplify the color but maximize the typographic scale. The goal is to make the user feel they are interacting with a company that builds things that last for a hundred years.```