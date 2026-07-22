---
name: Premium Utility
colors:
  surface: '#fcf8fa'
  surface-dim: '#dcd9db'
  surface-bright: '#fcf8fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f5'
  surface-container: '#f0edef'
  surface-container-high: '#eae7e9'
  surface-container-highest: '#e4e2e4'
  on-surface: '#1b1b1d'
  on-surface-variant: '#45464d'
  inverse-surface: '#303032'
  inverse-on-surface: '#f3f0f2'
  outline: '#76777d'
  outline-variant: '#c6c6cd'
  surface-tint: '#565e74'
  primary: '#000000'
  on-primary: '#ffffff'
  primary-container: '#131b2e'
  on-primary-container: '#7c839b'
  inverse-primary: '#bec6e0'
  secondary: '#5c5f60'
  on-secondary: '#ffffff'
  secondary-container: '#e1e3e4'
  on-secondary-container: '#626566'
  tertiary: '#000000'
  on-tertiary: '#ffffff'
  tertiary-container: '#07006c'
  on-tertiary-container: '#7073ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dae2fd'
  primary-fixed-dim: '#bec6e0'
  on-primary-fixed: '#131b2e'
  on-primary-fixed-variant: '#3f465c'
  secondary-fixed: '#e1e3e4'
  secondary-fixed-dim: '#c5c7c8'
  on-secondary-fixed: '#191c1d'
  on-secondary-fixed-variant: '#454748'
  tertiary-fixed: '#e1e0ff'
  tertiary-fixed-dim: '#c0c1ff'
  on-tertiary-fixed: '#07006c'
  on-tertiary-fixed-variant: '#2f2ebe'
  background: '#fcf8fa'
  on-background: '#1b1b1d'
  surface-variant: '#e4e2e4'
  cream-bg: '#FCFBF7'
  border-subtle: '#E2E8F0'
  status-active: '#10B981'
  status-pending: '#F59E0B'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.3'
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '600'
    lineHeight: '1.3'
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 24px
    fontWeight: '600'
    lineHeight: '1.4'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
  label-sm:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.2'
    letterSpacing: 0.01em
  label-xs:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.2'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  container-max: 1280px
  gutter: 1.5rem
  section-gap: 5rem
  stack-sm: 0.5rem
  stack-md: 1rem
  stack-lg: 2rem
---

## Brand & Style

The design system is centered on **Modern Minimalism**, emphasizing trust, efficiency, and a premium "as-a-service" aesthetic. Inspired by the clarity of Figma’s workspace, the interface prioritizes content and utility through generous whitespace and a refined, monochromatic foundation.

The brand personality is **Professional, Dependable, and Transparent**. It aims to evoke a sense of security for users purchasing digital assets. The visual language uses high-quality typography and subtle depth to guide the user through the marketplace and checkout flows without unnecessary friction. 

- **Primary Style:** Minimalism with a hint of Glassmorphism for overlays.
- **Visual Cues:** Subtle 1px borders, soft shadows, and a restricted color palette to maintain a high-end feel.
- **Target Audience:** Tech-savvy individuals and general users seeking seamless access to premium digital tools.

## Colors

The palette is anchored in a high-contrast relationship between deep navy and soft neutrals. 

- **Primary:** Deep Navy (#0F172A) is used for text, primary buttons, and core branding elements to project authority.
- **Secondary:** Near-white (#F8F9FA) serves as the primary surface color.
- **Neutral/Background:** A warm Cream-white (#FCFBF7) is used for the main page background to differentiate from pure white containers, creating a sophisticated layered effect.
- **Accent:** A vibrant Indigo (#6366F1) is used sparingly for interactive cues, links, or specific "Success" highlights to draw attention without breaking the minimalist harmony.
- **Functional:** Status colors for "Active" (Emerald) and "Pending" (Amber) are desaturated to align with the professional tone.

## Typography

Typography is the primary driver of the "Premium" feel. 

- **Headlines:** Plus Jakarta Sans provides a friendly yet modern geometric structure. Large headings should use negative letter spacing for a more "designed" look.
- **Body & Labels:** Inter is utilized for its exceptional legibility in data-heavy views (Admin dashboards and Checkout forms). 
- **Hierarchy:** Use weight over color to establish hierarchy. Headers should be noticeably heavier (600-700) compared to body text (400) to ensure clear content scanning.

## Layout & Spacing

This design system uses a **Fixed Grid** model for desktop and a **Fluid Fluid** approach for mobile.

- **Grid:** A 12-column grid with a maximum width of 1280px. Gutters are fixed at 24px (1.5rem) to ensure a clean vertical rhythm.
- **Margins:** Desktop margins are flexible, while mobile/tablet use a safe margin of 20px.
- **Spacing Logic:** Vertical spacing between sections should be generous (80px+) to maintain the minimalist aesthetic. Inside cards and components, use a base-8 increment system.
- **Responsive Reflow:** On mobile, 3-column product grids reflow to 1-column cards. Admin tables should transition to "Data Card" views to maintain readability.

## Elevation & Depth

To achieve the "Figma-like" aesthetic, the system relies on **Low-contrast outlines** and **Tonal Layers** rather than heavy shadows.

- **Surfaces:** Use `#FFFFFF` for primary cards and modals against the `#FCFBF7` background. This subtle shift creates depth without visual noise.
- **Borders:** Use 1px solid `#E2E8F0` for all containers. Interactive elements (hover) may transition the border color to a slightly darker shade or the Primary Navy.
- **Shadows:** Only use shadows for "Floating" elements like dropdowns or active modals. Shadows should be ultra-soft: `0 10px 15px -3px rgba(0, 0, 0, 0.04)`.

## Shapes

The shape language is **Rounded**, balancing modern tech aesthetics with approachability.

- **Components:** Buttons, Input fields, and Product cards use a base radius of `0.5rem` (8px).
- **Large Containers:** Modals and feature sections use `rounded-xl` (1.5rem/24px) to feel more inviting.
- **Chips:** Status badges (Active/Pending) should use full rounded pills for distinct shape recognition against rectangular cards.

## Components

- **Buttons:** Primary buttons are solid Deep Navy with white text. Secondary buttons use a white background with a 1px border. All buttons have a subtle scaling transition on click.
- **Cards:** Product cards must have a 1px subtle border, no shadow by default, and a background color of White. Padding should be a minimum of `2rem` (32px).
- **Input Fields:** Inputs feature a light grey background (`#F1F5F9`) with a 1px border that turns Navy on focus. Labels sit clearly above the field in `label-sm`.
- **Chips/Badges:** Small, high-contrast text on desaturated background tints (e.g., Active status = dark green text on light green background).
- **Dashboard Sidebar:** The admin sidebar uses a pure white surface with a vertical border separator and `label-sm` links for a systematic, professional look.
- **Checkboxes:** Square with a 4px corner radius, using the Primary Navy for the checked state.