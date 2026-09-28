# Security policy

The island is a static website plus a daily routine that reads wishes written by strangers and writes to this
repository. The interesting attack surface is therefore the automation:

- **prompt injection** – a wish issue that makes the routine do something other than grant or decline one wish
  (see the guard rails in [evals/README.md](../evals/README.md)),
- the daily pull request and its automatic merge (`.github/workflows/ci.yml`, job `daily-merge`),
- the routine's instructions in [ROUTINE.md](../ROUTINE.md) and the read-only
  [wish-reader](../.claude/agents/wish-reader.md).

If you find a way to get content onto `main` that did not come through the rules, or anything else that looks
like a vulnerability, please **do not open a public issue** (and please do not test it with a real wish).
Use GitHub's [private vulnerability reporting](https://github.com/Fluory/wished-into-being/security/advisories/new)
instead. You will get an answer within a few days.
