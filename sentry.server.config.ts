import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
Sentry.init({
  dsn,
  enabled: Boolean(dsn),

  // Define how likely traces are sampled. Adjust this value in production, or use tracesSampler for greater control.
  tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE || '0.05'),

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: false,
});
