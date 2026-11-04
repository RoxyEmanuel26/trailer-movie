#!/usr/bin/env node
const path = require('path');
const { startServer } = require('next/dist/server/lib/start-server');

const port = parseInt(process.env.PORT || process.env.SERVER_PORT || '5060', 10);
const hostname = process.env.HOSTNAME || '0.0.0.0';
const dir = path.resolve(__dirname);

process.env.NODE_ENV = 'production';
process.env.PORT = String(port);
process.env.HOSTNAME = hostname;

startServer({
  dir,
  isDev: false,
  hostname,
  port,
}).catch((err) => {
  console.error('[MovieFlix] Server startup error:', err);
  process.exit(1);
});
