# Next.js TypeScript Project Structure

This document outlines the standard folder structure and architectural patterns for Next.js TypeScript websites. Use this as a foundation before defining specific page requirements and content.

## Directory Structure

Store all source code in an src/ directory at project root.

### App Router

Navigation and routing live in src/app/ following Next.js App Router conventions:
- src/app/page.tsx - Home page
- src/app/layout.tsx - Root layout
- src/app/[route]/page.tsx - Dynamic routes
- src/app/globals.css - Import global styles here

### Components Organization

Structure src/components/ with descriptive subdirectories:
- src/components/tables/ - Table components
- src/components/modals/ - Modal dialogs
- src/components/dropdowns/ - Dropdown menus
- src/components/forms/ - Form components
- src/components/ui/ - Reusable UI primitives

Use descriptive filenames that clearly indicate component purpose (e.g., UserProfileTable.tsx, ConfirmationModal.tsx).

### State Management

Redux store files live in src/store/:
- src/store/hooks.ts - Typed Redux hooks
- src/store/index.ts - Store configuration
- src/store/features/userSlice.ts - Feature slices

### Styling

Tailwind CSS configuration:
- src/styles/globals.css - Global styles and Tailwind directives
- Import into src/app/layout.tsx

### Static Assets

SVG and image files in public/ directory:
- Reference as absolute paths: "/logo.svg"
- Use Next.js Image component for optimization

### Configuration

Optional src/config/ directory:
- src/config/logging.ts - Only if requirements specify logging

### Path Aliases

Configure tsconfig.json with baseUrl: "src" and path mappings:
- @/* maps to src/*
- @/components/* maps to src/components/*
- @/lib/* maps to src/lib/*
