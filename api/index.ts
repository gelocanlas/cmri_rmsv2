import serverApp from "../dist/server.cjs";

// Safely handle both standard default and named module exports for seamless ES Module / CommonJS interop
const app = (serverApp as any).default || serverApp;

export default app;
