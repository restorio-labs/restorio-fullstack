# Design System Strategy: Restorio Ecosystem

## 1. Overview & Creative North Star

**Creative North Star: "The Kinetic Hearth"**

In the high-pressure environment of restaurant management, software usually feels like a cold, skeletal spreadsheet. This design system rejects that sterility. **"The Kinetic Hearth"** focuses on a UI that feels alive, warm, and intentional. We achieve this by moving away from traditional "boxed" layouts toward an editorial, layered experience.

By utilizing **intentional asymmetry** (e.g., staggering dashboard widgets or using varied column widths), we break the monotonous grid. The goal is to transform a technical SaaS tool into a high-energy environment that feels as vibrant as a professional kitchen during peak service. We use depth, glassmorphism, and a sophisticated color palette to guide the eye, ensuring that while the interface is "friendly," it remains an authoritative, premium tool for enterprise-level decision-making.

---

## 2. Colors & Surface Philosophy

The palette is built on a foundation of deep, ink-like tones contrasted against electric, luminous accents.

### The Palette
- **Core Neutral:** `background: #0a0e14` (Deep Charcoal).
- **Primary Energy:** `primary: #89acff` (Electric Blue) and `secondary: #85f6e5` (Soft Teal).
- **Urgency/Action:** `tertiary: #ff8762` (Warm Orange).

### The "No-Line" Rule
To maintain a high-end, editorial feel, **explicitly prohibit 1px solid borders for sectioning.** Structural separation must be achieved through:
1.  **Background Shifts:** Placing a `surface-container-low` section against the base `background`.
2.  **Tonal Transitions:** Using subtle shifts in the surface hex values to define boundaries.
3.  **Negative Space:** Utilizing the spacing scale to let elements breathe rather than trapping them in boxes.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack of materials. 
- **Base Level:** `surface` (#0a0e14).
- **Secondary Tier:** `surface-container-low` (#0f141a) for large sidebar areas or background groupings.
- **Top Tier:** `surface-container-highest` (#20262f) for active cards or floating modals.

### The "Glass & Gradient" Rule
Standard flat colors are insufficient for a "living" theme.
- **Glassmorphism:** Use `surface-variant` with a 60% opacity and a `20px` backdrop blur for floating navigation or overlaying filters.
- **Signature Gradients:** Apply a linear gradient from `primary` (#89acff) to `primary_container` (#739eff) for hero actions. This provides a "glow" that flat colors cannot replicate.

---

## 3. Typography

The typography system is designed to be "Clean but Assertive," using **Inter** as the backbone.

- **Display & Headline:** Use `display-lg` (3.5rem) and `headline-lg` (2rem) with tight tracking (-0.02em) and **Bold** weights. This creates an editorial "magazine" feel for high-level analytics and welcome states.
- **Title & Body:** `title-md` (1.125rem) should be used for card headers to provide clear hierarchy. `body-md` (0.875rem) handles the heavy lifting of data and management tasks, ensuring readability in dense environments.
- **Labels:** Use `label-md` (0.75rem) in **Medium/Semi-bold** for data descriptors and button text to maintain a technical, organized aesthetic.

---

## 4. Elevation & Depth

We eschew "Standard Material" shadows in favor of **Tonal Layering**.

- **The Layering Principle:** Place a `surface-container-lowest` (#000000) card atop a `surface-container-low` (#0f141a) section. This creates a "recessed" or "elevated" feel through contrast alone.
- **Ambient Shadows:** When an element must float (e.g., a "New Order" notification), use an extra-diffused shadow: `box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4)`. The shadow color should never be pure black; it should be a tinted version of the surface it sits upon.
- **The "Ghost Border" Fallback:** If accessibility requires a border, use `outline-variant` (#44484f) at **20% opacity**. It should be felt, not seen.
- **Corner Radii:** Embrace the **"lg" (2rem)** and **"xl" (3rem)** tokens for containers. Large radii soften the technical nature of the SaaS, making the "Restorio" experience feel approachable and modern.

---

## 5. Components

### Buttons & CTAs
- **Primary:** Gradient-filled (`primary` to `primary_container`) with `xl` (3rem) rounding. Use `on_primary` text.
- **Secondary (The Warm CTA):** Use `tertiary` (#ff8762) for high-conversion actions like "Upgrade" or "Go Live."
- **Glass Variant:** For "Cancel" or "Secondary" actions, use a semi-transparent `surface_variant` with a `2px` blur.

### Input Fields
- **Styling:** Forbid traditional boxes. Use `surface-container-highest` with a `md` (1.5rem) corner radius. 
- **Focus State:** Instead of a thick border, use a subtle `primary` outer glow (4px spread, 10% opacity) and transition the background color slightly.

### Cards & Lists
- **Forbid Dividers:** Never use a horizontal line to separate list items. Use `spacing-4` (1rem) of vertical space or alternating background tones (`surface-container-low` vs `surface-container-high`).
- **Nesting:** A card should use the `DEFAULT` (1rem) rounding, but inner elements like "Action Chips" should use `full` (9999px).

### The "Kitchen Heat" Component (Custom)
- **Live Status Indicators:** Use the `secondary` (Teal) color with a "pulse" animation (a subtle scale-up and fade-out of an outer ring) to indicate active orders or live kitchen status.

---

## 6. Do's and Don'ts

### Do:
- **Use "Surface-Tint":** Apply a 2-3% `surface_tint` overlay on top-level cards to give them a cohesive blue/navy hue.
- **Embrace White Space:** Use the `spacing-12` and `spacing-16` tokens generously between disparate sections to maintain the editorial look.
- **Layer Glass:** Place glassmorphic elements over vibrant gradients to create "depth-color" interaction.

### Don't:
- **Don't use 100% Opaque Borders:** This creates a "boxed-in" feeling that kills the kinetic energy of the system.
- **Don't use "Pure" Greys:** All neutrals must be skewed toward the navy/charcoal base (`#0a0e14`).
- **Don't Over-Saturate:** Keep the electric blue and orange for interactive elements only. The "Hearth" must be warm, but the data must be the star.
- **Don't use Small Radii:** Avoid the `sm` (0.5rem) radius for main containers; it feels dated and "standard." Stick to `DEFAULT` (1rem) or higher.
