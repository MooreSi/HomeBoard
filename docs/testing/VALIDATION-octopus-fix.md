# Octopus live connection fix · 10 October 2026

Live investigation identified two integration defects: the authentication input is the case-sensitive `APIKey`, and valid EV dispatches can contain negative `energyAddedKwh` values. The lowercase field caused HTTP 400 schema validation before authentication; rejecting the signed energy would then discard an otherwise valid schedule.

The authentication fixture now enforces the real schema field. Existing authentication tests failed against the old code, and passed after the correction. A separate signed-energy regression then failed for the expected schedule-validation reason before the parser was corrected. The parser accepts finite signed values and displays their magnitude; malformed intervals and non-finite energy remain rejected. The browser provider fixture now supplies signed energy and asserts the positive planned-energy label.

Verification: 132 API/unit tests locally and in the Docker image; targeted Octopus setup/display regressions pass in Chrome and WebKit; Docker build, isolated restart/persistence smoke, installer syntax and whitespace checks pass. Existing assertions remain, with the mock authentication-field correction preserving its exact payload contract.

Live read-only requests using credentials already saved on the user's server confirmed authentication, device discovery and dispatch retrieval. The corrected production provider returns a scheduled result with no error and valid energy magnitudes. Diagnostic output contained only stage/status/count/type metadata; credentials, tokens, account ID, device names and schedule timestamps were not written to artifacts or Git.

Compose preflight confirms that configured environment values and the homeboard-data volume match the existing container, allowing the verified source to replace the HomeBoard service while retaining its data. Physical tablet testing and compatibility with other users' chargers/accounts remain unverified.
