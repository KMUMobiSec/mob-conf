// Pacing for the bulk "Send to all" QR-pass flow. Shared by the client (which chunks the
// year's registration IDs) and the server action (which throttles individual Resend sends).
//
// SEND_THROTTLE_MS keeps the outbound send rate under Resend's default ~2 requests/second.
// SEND_CHUNK_SIZE bounds each server-action call's wall time (≈ SEND_CHUNK_SIZE × SEND_THROTTLE_MS)
// safely under the serverless function timeout, while still ticking the progress bar every few
// seconds. Raise SEND_THROTTLE_MS if the Resend plan's rate limit is lower; both are the only
// knobs and have no other call-site coupling.
export const SEND_THROTTLE_MS = 550;
export const SEND_CHUNK_SIZE = 8;
