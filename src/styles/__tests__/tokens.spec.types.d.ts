/*
 * Minimal ambient declarations for the Node.js APIs used by tokens.spec.ts.
 * The project does not depend on @types/node (it is a browser app); this scoped
 * declaration keeps the contract test self-contained without pulling a global
 * Node typing surface that would mask DOM/Browser API mistakes elsewhere.
 */

declare module 'node:fs' {
  export function readFileSync(path: string, encoding: 'utf8'): string;
  export function existsSync(path: string): boolean;
  export function statSync(path: string): { readonly size: number };
}

declare module 'node:path' {
  const path: {
    resolve(...segments: string[]): string;
  };
  export default path;
}

declare const process: {
  cwd(): string;
};
