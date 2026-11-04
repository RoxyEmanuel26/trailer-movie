export async function register() {
  // Empty register hook for standalone/self-hosted deployment.
  // Complex server lifecycle tasks (like DB pruning) run in server.js
  // to avoid Turbopack pnpm synthetic external isolation bugs.
}
