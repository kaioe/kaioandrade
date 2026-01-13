# Kaio Andrade Portfolio

This is a Next.js project with TypeScript, Tailwind CSS, and shadcn/ui components.

## Project Structure

- `/components/ui` - shadcn/ui components (including the hyper-text-with-decryption component)
- `/lib` - Utility functions (including the `cn` helper for className merging)
- `/app` - Next.js app directory with pages and layouts

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the demo page.

## Component Integration

### HyperTextParagraph Component

The `hyper-text-with-decryption` component is located at `/components/ui/hyper-text-with-decryption.tsx`.

**Usage:**
```tsx
import HyperTextParagraph from "@/components/ui/hyper-text-with-decryption";

<HyperTextParagraph
  text="Your text here"
  highlightWords={["keyword1", "keyword2"]}
  className="text-2xl"
/>
```

**Props:**
- `text` (string, required): The text to display
- `highlightWords` (string[], optional): Array of words that will trigger the decryption effect on hover
- `className` (string, optional): Additional CSS classes

## Dependencies

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **framer-motion** - Animations
- **shadcn/ui** - Component library setup

## Why `/components/ui`?

The `/components/ui` folder is the standard location for shadcn/ui components. This convention:
- Keeps UI components organized and separate from business logic components
- Makes it easy to add more shadcn/ui components using their CLI
- Follows the shadcn/ui project structure best practices
- Ensures components are easily discoverable and maintainable
