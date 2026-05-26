export default async function handler(req: any, res: any) {
  try {
    // Dynamically load server.ts (mapped as server.js for ESM resolution) on request
    const serverModule = await import("../server.js");
    const app = (serverModule.default || serverModule) as any;
    
    // Delegate request and response handling to the Express application
    return app(req, res);
  } catch (err: any) {
    console.error("❌ CARD MRI Vercel Handler Crash:", err);
    res.status(500).json({
      success: false,
      error: "CARD MRI Severe Runtime Error",
      message: err.message,
      stack: err.stack ? err.stack.toString().split("\n") : [],
      hint: "Review imports in server.ts or check dependencies.",
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        isVercel: process.env.VERCEL === "1",
        nodeEnv: process.env.NODE_ENV
      }
    });
  }
}

