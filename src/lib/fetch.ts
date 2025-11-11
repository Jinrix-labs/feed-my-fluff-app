// Disabled CreateAnything proxy and logging
// This file previously handled CreateAnything telemetry and proxy requests
// Now using direct fetch for Supabase and other API calls

import { fetch as expoFetch } from 'expo/fetch';

// Export the original expo fetch directly without any proxy/telemetry wrapping
export default expoFetch;
