# Test plan — v0.3

Run:

```bash
node --test tests/*.test.js
npm run check
python3 replica/diff/parity.py replica/features.csv
```

Current expected results:

- 19/19 Node tests pass.
- JavaScript syntax checks pass.
- Parity: 86/100.
- Incomplete must-haves: 0.

Before production, add a separate integration suite using dedicated Meta test assets and Postgres, plus load/failure tests for webhook bursts, retries and rate limits.
