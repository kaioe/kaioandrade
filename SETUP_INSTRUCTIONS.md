# Setup Instructions for React + TypeScript + Tailwind CSS + shadcn/ui

## Overview

This project has been set up with:
- **Next.js 14** (React framework)
- **TypeScript** (Type safety)
- **Tailwind CSS** (Utility-first CSS)
- **shadcn/ui** (Component library structure)
- **framer-motion** (Animation library)

## Installation Steps

### 1. Install All Dependencies

```bash
npm install
```

This will install:
- React and Next.js
- TypeScript and type definitions
- Tailwind CSS and PostCSS
- framer-motion (for animations)
- Utility libraries (clsx, tailwind-merge, class-variance-authority)

### 2. Verify Installation

Check that all dependencies are installed:

```bash
npm list --depth=0
```

### 3. Run Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

## Project Structure

```
kaioandrade.com/
├── app/
│   ├── globals.css          # Tailwind CSS imports and shadcn variables
│   ├── layout.tsx           # Root layout component
│   └── page.tsx             # Demo page with HyperTextParagraph
├── components/
│   └── ui/
│       └── hyper-text-with-decryption.tsx  # Your integrated component
├── lib/
│   └── utils.ts            # Utility functions (cn helper)
├── components.json         # shadcn/ui configuration
├── tailwind.config.ts      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
├── postcss.config.js       # PostCSS configuration
├── next.config.js          # Next.js configuration
└── package.json            # Dependencies and scripts
```

## Why `/components/ui`?

The `/components/ui` folder is **critical** for shadcn/ui projects because:

1. **Standard Convention**: shadcn/ui CLI expects components in this location
2. **Easy Component Management**: All UI components are in one place
3. **CLI Integration**: When you run `npx shadcn-ui@latest add [component]`, it automatically adds components to this folder
4. **Organization**: Separates reusable UI components from business logic components
5. **Best Practice**: Follows the shadcn/ui project structure guidelines

## Component Usage

### HyperTextParagraph Component

The component is ready to use in any page or component:

```tsx
import HyperTextParagraph from "@/components/ui/hyper-text-with-decryption";

export default function MyPage() {
  return (
    <HyperTextParagraph
      text="Your text with interactive words"
      highlightWords={["interactive", "words"]}
      className="text-2xl"
    />
  );
}
```

**Props:**
- `text` (string, required): The text to display
- `highlightWords` (string[], optional): Words that trigger the decryption effect
- `className` (string, optional): Additional Tailwind CSS classes

## Adding More shadcn/ui Components

To add more shadcn/ui components in the future:

```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
# etc.
```

Components will automatically be added to `/components/ui` based on your `components.json` configuration.

## Troubleshooting

### TypeScript Errors

If you see TypeScript errors, ensure:
1. All dependencies are installed: `npm install`
2. TypeScript is properly configured (check `tsconfig.json`)
3. Restart your IDE/editor

### Tailwind CSS Not Working

If Tailwind styles aren't applying:
1. Check that `app/globals.css` imports Tailwind directives
2. Verify `tailwind.config.ts` includes your content paths
3. Restart the dev server

### Component Import Errors

If imports fail:
1. Check `tsconfig.json` has the correct path aliases (`@/*`)
2. Verify the file structure matches the import paths
3. Ensure `components.json` aliases match your `tsconfig.json` paths

## Next Steps

1. **Customize the demo**: Edit `app/page.tsx` to use your own content
2. **Add more components**: Use shadcn/ui CLI to add more components
3. **Style customization**: Modify `app/globals.css` for theme customization
4. **Build for production**: Run `npm run build` when ready to deploy
