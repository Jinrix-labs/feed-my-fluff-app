// Disabled CreateAnything error reporting/telemetry
// This function previously sent errors to CreateAnything's logging service
// Now it's a no-op to prevent console warnings

const reportErrorToRemote = async ({ error }) => {
  // Silently ignore - no telemetry/logging
  return { success: false };
};

module.exports = { reportErrorToRemote };
