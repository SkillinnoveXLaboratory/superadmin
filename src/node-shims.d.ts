declare const __dirname: string;

declare module 'node:path' {
  const path: {
    resolve: (...parts: string[]) => string;
  };
  export default path;
}
