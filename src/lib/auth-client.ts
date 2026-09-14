import { createAuthClient } from 'better-auth/react';
import { siteConfig } from './site-config';

export const authClient = createAuthClient({
  baseURL:
    typeof window !== 'undefined'
      ? window.location.origin
      : siteConfig.url,
});
