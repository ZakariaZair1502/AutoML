# AutoModler React Application

## Overview

This project is a React-based frontend for the AutoModler application, which provides an intuitive platform for machine learning workflows, including data preprocessing, model training, and evaluation.

## Project Structure

### Components

#### Layout Components

- `Layout.tsx` - Main layout wrapper that includes Navbar and optional Footer
- `Navbar.tsx` - Navigation bar with responsive mobile menu
- `Footer.tsx` - Footer with links and copyright information

#### UI Components

- `button.tsx` - Original button component using class-variance-authority
- `card.tsx` - Original card component with various sub-components
- `custom-button.tsx` - Custom button component with styles from the original CSS
- `custom-card.tsx` - Custom card component with styles from the original CSS
- `custom-form.tsx` - Form components with styles from the original CSS

### Styles

- `index.css` - Main CSS file with Tailwind directives and global styles
- `variables.css` - CSS variables imported from the original CSS
- `Navbar.module.css` - CSS module for Navbar-specific styles

## Features

- Responsive design with mobile navigation
- Custom UI components based on the original design
- CSS variables for consistent theming
- Tailwind CSS integration for utility-based styling

## Conversion Notes

This project was converted from traditional HTML, CSS, and JavaScript files to a React application. The conversion process included:

1. Creating React components from HTML structure
2. Converting CSS to a combination of CSS modules and Tailwind CSS
3. Converting JavaScript functionality to React hooks and event handlers
4. Integrating with the existing React project structure

## Technologies Used

- React
- TypeScript
- Tailwind CSS
- CSS Modules
- Vite (for build and development)

---

# Original Vite Template Information

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ["./tsconfig.node.json", "./tsconfig.app.json"],
      tsconfigRootDir: import.meta.dirname,
    },
  },
});
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    "react-x": reactX,
    "react-dom": reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs["recommended-typescript"].rules,
    ...reactDom.configs.recommended.rules,
  },
});
```
