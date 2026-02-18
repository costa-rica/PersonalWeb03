# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PersonalWeb03 is a personal portfolio website built with Next.js 16, React 19, TypeScript, and Tailwind CSS 4. It features a modern, responsive design with sections for hero, projects, resume, and blog posts. The frontend connects to a separate FastAPI backend for blog content and authentication.

## Common Commands

```bash
# Development
npm run dev          # Start development server (http://localhost:3000)

# Build
npm run build        # Build for production

# Linting
npm run lint         # Run ESLint

# Production
npm start            # Start production server (requires build first)
```

## Environment Variables

Required environment variables (configured in `.env.local`):

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000  # Backend API base URL
```

This variable is used for API calls to fetch dynamic content like hero section data.

## Architecture

### Frontend Stack
- **Framework**: Next.js 16 with App Router (RSC enabled)
- **UI**: Tailwind CSS 4 + shadcn/ui components
- **State Management**: Redux Toolkit with per-request store pattern
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod validation
- **Analytics**: Vercel Analytics

### Project Structure

```
app/                    # Next.js App Router
├── layout.tsx         # Root layout with StoreProvider and Analytics
├── page.tsx           # Home page (composition of section components)
└── globals.css        # Global styles and Tailwind directives

components/            # React components
├── ui/               # shadcn/ui components
├── HeroSection.tsx   # Hero/landing section
├── ProjectsSection.tsx
├── ResumeSection.tsx
├── BlogSection.tsx
├── Navigation.tsx
└── StoreProvider.tsx # Redux Provider wrapper

lib/                   # Utilities and state management
├── store.ts          # Redux store configuration (per-request pattern)
├── hooks.ts          # Typed Redux hooks
├── utils.ts          # cn() utility for class merging
└── features/
    └── userSlice.ts  # User state slice

docs/                  # API documentation
└── API_REFERENCE.md  # Backend API endpoints and usage

public/               # Static assets (images, icons)
```

### State Management Pattern

Uses Redux Toolkit with the **per-request store pattern** for RSC compatibility:
- Store is created per request via `makeStore()` in `lib/store.ts`
- `StoreProvider.tsx` wraps the app and maintains store reference
- Use typed hooks from `lib/hooks.ts`: `useAppDispatch`, `useAppSelector`, `useAppStore`

### Path Aliases

Configured in `tsconfig.json`:
- `@/*` maps to project root
- Example: `@/components/HeroSection`, `@/lib/utils`

### UI Component System

Uses **shadcn/ui** (New York style):
- Configuration: `components.json`
- Base color: neutral, CSS variables enabled
- Import UI components from `@/components/ui`
- Custom components composed using shadcn/ui primitives + Radix UI
- Style utilities: `cn()` from `@/lib/utils` for class merging (clsx + tailwind-merge)

### Backend Integration

The frontend connects to a FastAPI backend (see `docs/API_REFERENCE.md`):
- Base URL: `http://localhost:8000`
- JWT authentication for protected endpoints
- Blog posts served as markdown with static assets
- Hero section data with activity summary
- API routers: `/auth`, `/blog`, `/hero-section/data`, `/posts`

Key backend features:
- JWT tokens never expire
- Blog posts created from ZIP archives
- Markdown content with asset management
- SQLite database with SQLAlchemy ORM

## Build Configuration

### next.config.mjs
- TypeScript build errors ignored (`ignoreBuildErrors: true`)
- Image optimization disabled (`unoptimized: true`)

### Tailwind CSS 4
- Using `@tailwindcss/postcss` plugin
- Global styles in `app/globals.css`
- CSS variables for theming

## Component Guidelines

### Section Components
Each major section (Hero, Projects, Resume, Blog) is a separate component that handles its own layout and data. The main page (`app/page.tsx`) composes these sections.

**HeroSection**: Fetches dynamic content from `/hero-section/data` API endpoint on mount. Displays:
- Static intro content
- `up_to_lately.text` from API (with loading/error states)
- Project hours table from `toggl_table` API data (project name and hours formatted to 1 decimal place)
- Table is hidden if API fails or returns no data

### Client vs Server Components
- Most section components are client components (`"use client"`)
- Layout is a server component that wraps with `StoreProvider` and `Analytics`
- Redux requires client components for hooks

## Development Notes

- The project uses React 19 and Next.js 16 (latest versions)
- TypeScript strict mode is enabled
- ESLint configured for Next.js
- Vercel Analytics integrated in root layout
- All images should use Next.js `<Image>` component
- Static assets stored in `/public` directory
