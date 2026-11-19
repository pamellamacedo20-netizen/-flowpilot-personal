# GraftMap reconstruction v2 — deployment candidate 0.10.58

This directory is independent of graftmap_backend. Existing services and their Supabase assets remain unchanged. Do not deploy from the old graftmap-personal branch.

## Prepared service

DEPLOYMENT.json contains the exact proposed Render create-web-service arguments except the secret. Before creation, add a freshly generated GRAFTMAP_API_TOKEN of at least 24 characters via the environment-variable API. Never commit its value. Use one Uvicorn worker. start.sh honors Render's PORT.

Creation is pending explicit approval of compute charges. The smallest paid candidate with more memory than our observed native worker peak is 1c-2g: 1 CPU, 2 GB, US$25/month equivalent, prorated while provisioned, as published 19 November 2026. This is a limited integration-test candidate, not a capacity guarantee for a full 48-image or stereo job. No persistent disk or database is requested. On redeploy, ephemeral results may be lost; the iPad must download and preserve its returned mesh. Add persistent storage only as a separately priced decision.

## Verified locally

- 148 backend tests passed, including protocol, masks, physical reference, stereo checks, geometry validity and three new restart tests.
- A real PyCOLMAP CPU run with the nine available patient photographs exited normally, registered only 2/9 images and yielded zero accepted points. No usable head mesh was produced.
- Native worker peak resident memory: 1102.4 MiB. Server process memory is additional. The current Render free plan has 512 MB and cannot accommodate this observed run.
- Native engine import peak alone: 259.5 MiB.
- Tests include controlled/mocked cases; their success does not establish reconstruction accuracy.

## Changes relative to backend 0.10.51

- Implements the current iPad contract: GET /health; authenticated POST /v1/jobs; GET /v1/jobs/{id}; GET /v1/jobs/{id}/mesh; DELETE /v1/jobs/{id}.
- Persists failed job status. After a process restart, interrupted jobs return an actionable failure instead of an indefinite processing state.
- Preserves completed mesh recovery where the filesystem survives.
- Docker startup honors PORT and explicitly uses one API process.
- Existing multi-view registration, mask support, photographic vertex colors, triangulation checks and experimental stereo/continuity processing are included.

## Required verification after paid creation

1. Monitor the specific deploy until live; a deploy request alone is not success.
2. Verify HTTPS /health reports 0.10.58, colmap_sparse and colmap_installed=true.
3. Verify unauthenticated job requests are rejected.
4. Submit 12–48 distinct overlapping test views, poll to a terminal status, fetch mesh, check finite coordinates, valid face indices and matching case UUID.
5. Inspect the actual surface and registration coverage before describing it as a usable head.
6. Configure the iPad server URL and token, capture a new overlapping guided sequence, and verify the complete path on the iPad.

The pipeline remains experimental. It does not implement a complete dense multi-view reconstruction engine, and a larger server will not itself fix missing views, subject motion or failed feature matching. Do not replace the missing anatomy with a convex hull or a generic head and call it reconstructed.
