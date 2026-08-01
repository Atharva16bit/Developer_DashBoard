// Vercel Speed Insights Integration
// This module imports and initializes Speed Insights for performance tracking
import { injectSpeedInsights } from './node_modules/@vercel/speed-insights/dist/index.mjs';

// Initialize Speed Insights
// The function will automatically track Core Web Vitals and page performance
injectSpeedInsights({
  debug: false, // Set to true in development to see debug logs
  // sampleRate: 1, // Track 100% of page loads (default)
});
