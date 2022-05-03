// This is the key that stores whether or not telemetry is enabled or disabled.
export const TELEMETRY_ENABLED = 'telemetry.enabled';

// This is the key that specifies when the user was informed about anonymous
// telemetry collection.
export const TELEMETRY_NOTIFY_DATE = 'telemetry.notifiedAt';

// This is a quasi-persistent identifier used to dedupe recurring events. It's
// generated from random data and completely anonymous.
export const TELEMETRY_ID = `telemetry.anonymousId`;

// This is the cryptographic salt that is included within every hashed value.
// This salt value is never sent to us, ensuring privacy and the one-way nature
// of the hash (prevents dictionary lookups of pre-computed hashes).
// See the `oneWayHash` function.
export const TELEMETRY_SALT = `telemetry.salt`;
