# MF-00 Visual Baseline

- Generated at (UTC): 2026-03-04T16:51:39.092Z
- Total captures: 66
- Captures with horizontal overflow: 0
- Captures with console/page errors: 6

## Coverage by actor

- Public captures: 21
- Therapist captures: 30
- Patient captures: 15

## Artifacts

- JSON report: `docs/baselines/mf00/baseline-visual.json`
- Screenshots: `docs/baselines/mf00/screenshots/<viewport>/<actor>/*.png`

## Known expected errors captured in baseline

1. `/_mf00_not_found_probe_route` logs 404 resource error by design (used to baseline `app/not-found.tsx`).
2. `/dashboard/consulta/room-stitch-check` logs CSP block for `https://example.com` iframe (placeholder URL outside allowed `frame-src`).

## Error rows

| Viewport | Actor | Route | Status | Final URL | Error |
|---|---|---|---|---|---|
| mobile-390x844 | public | `/_mf00_not_found_probe_route` | 404 | `http://localhost:3000/_mf00_not_found_probe_route` | console.error: Failed to load resource: the server responded with a status of 404 (Not Found) |
| mobile-390x844 | therapist | `/dashboard/consulta/room-stitch-check` | 200 | `http://localhost:3000/dashboard/consulta/room-stitch-check` | console.error: Framing 'https://example.com/' violates the following Content Security Policy directive: "frame-src https://js.stripe.com https://*.daily.co". The request has been blocked.
 |
| tablet-768x1024 | public | `/_mf00_not_found_probe_route` | 404 | `http://localhost:3000/_mf00_not_found_probe_route` | console.error: Failed to load resource: the server responded with a status of 404 (Not Found) |
| tablet-768x1024 | therapist | `/dashboard/consulta/room-stitch-check` | 200 | `http://localhost:3000/dashboard/consulta/room-stitch-check` | console.error: Framing 'https://example.com/' violates the following Content Security Policy directive: "frame-src https://js.stripe.com https://*.daily.co". The request has been blocked.
 |
| desktop-1440x900 | public | `/_mf00_not_found_probe_route` | 404 | `http://localhost:3000/_mf00_not_found_probe_route` | console.error: Failed to load resource: the server responded with a status of 404 (Not Found) |
| desktop-1440x900 | therapist | `/dashboard/consulta/room-stitch-check` | 200 | `http://localhost:3000/dashboard/consulta/room-stitch-check` | console.error: Framing 'https://example.com/' violates the following Content Security Policy directive: "frame-src https://js.stripe.com https://*.daily.co". The request has been blocked.
 |
