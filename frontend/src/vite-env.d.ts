/// <reference types="vite/client" />

// Declaração para imports de side-effect CSS (TS2882)
declare module '*.css' {
    const content: Record<string, string>;
    export default content;
}
