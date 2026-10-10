# Octopus smart charging

HomeBoard connects directly to Octopus Energy UK to show the Intelligent charging schedule. Home Assistant is not required. It reads planned dispatches; it does not issue charging commands, change targets, or confirm the vehicle is actually charging.

## Connect

1. Open **Settings → Smart charging** and enable **Show smart charging**.
2. Enter your Octopus **account ID** (for example, A-12345678) and **API key** from your Octopus account’s developer settings.
3. Click **Save & test connection**. The result distinguishes a working connection with slots, an empty schedule, unavailable access and unsupported devices.
4. If your account has more than one vehicle/charger, choose **Charging device** and save/test again. Automatic selects the first supported device.
5. In the custom designer choose **Add panel → Smart charging**, then move and size it. Save dashboard settings to apply the design. Default dashboard themes show the enabled panel in the side column.

The panel shows the next charging countdown, planned start/end times, device name, smart/boost/test labels, planned energy when supplied, and last update. Times follow the dashboard’s timezone and 12/24-hour settings. Slots crossing midnight show both dates. Header visibility, text roles, spacing, crop, layers, compact styling and library/portable designs use the normal designer controls.

Blank credential inputs preserve previously saved values. Their placeholders indicate whether values are configured; saved account IDs and keys are never sent back to the browser. **Remove Octopus connection** removes both credentials and disables the integration. Portable designs/display-preference exports exclude these credentials. Encrypted full household backups include server credentials using the existing backup mechanism.

## Freshness and availability

The server shares a five-minute cache and coalesces concurrent requests so wall displays do not each contact Octopus. Save & test can request an earlier refresh after at least one minute; provider failures retain the five-minute retry delay. Authentication tokens are held only in server memory and renewed when near expiry. Credentials and selected device form the cache identity, preventing another account/key/device from inheriting the old schedule.

On a provider failure, the last successful schedule can be retained for up to thirty minutes and is explicitly labelled **Last known schedule / Stale data**. An older result is replaced by Connection unavailable. Expired slots are omitted when rendering. Charging responses are deliberately excluded from the browser’s offline API cache, so old windows cannot silently appear live offline.

Octopus may change or remove planned slots. An empty result means **Awaiting a charging schedule**; it does not mean a connection failed or that charging has finished. Some Intelligent providers/accounts do not expose this data. HomeBoard reports that limitation rather than substituting fixed off-peak tariff hours. A scheduled period is not evidence of actual charging or a billing guarantee.

## API references

The implementation uses Octopus’s documented [authentication mutation](https://docs.octopus.energy/graphql/reference/mutations/#obtainkrakentoken), [account device query](https://docs.octopus.energy/graphql/reference/queries/#devices) and [planned dispatch query](https://docs.octopus.energy/graphql/reference/queries/#flexplanneddispatches). Requests use the fixed HTTPS GraphQL endpoint and variables. Responses/errors are validated and raw upstream error text is excluded from display responses. Tokens, account ID and key stay server-side.

The designer adds schema 6 with an optional charging panel. Existing schema 1–5 files remain valid and are upgraded by the editor without mutating their source or rearranging their panels. Adding a thirteenth panel expands the stable front/back rank to 0–12 when all panel ranks are normalised.

The live account still requires verification using the connection test in Settings. Automated testing uses labelled demo accounts/devices and external HTTP fixtures; no personal Octopus credentials are included in source or test data.
