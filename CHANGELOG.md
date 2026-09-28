# Changelog – Wished into Being

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/). Newest entry first.
Only what changes **in the product** – the daily wishes live in [LOGBOOK.md](LOGBOOK.md).

## [Unreleased]

### Added
- Island engine: 16 × 16 sprites in a fifteen-colour palette with checks, six kinds with room that grows with the land, a sea that raises two tiles of shore every dawn (grass and beach derived from the land, harbours kept open around boats), placement hints, messages in a bottle as the fallback, and a validator that replays every dawn and every wish.
- Wish flow: an issue form, labels as code, the read-only `wish-reader` agent, `npm run day -- wishes` to check and rank wishes in code, fixed wording for granted, waiting and declined wishes, the wisher as co-author of the day's commit.
- README picture `world/isle.svg`: the island at night with a star for every waiting wish, the moon in its real phase, glowing lights and today's wish marked; still layers embedded as deterministic PNG. Every wish also as `world/sprites/<id>.svg`.
- Day CLI for the routine: `status`, `plan`, `wishes`, `try`, `sprite-preview`, `apply` (wish or bottle), `auto`, `check`, `render`, `pr-body`, `commit-title`, `commit-message`, `comment`, `genesis`.
- Generated `LOGBOOK.md` (with sprites and credits) and `RULES.md`; the routine's instructions in `ROUTINE.md`; CI merges the routine's daily pull request with squash when green.
- Eval set with fifteen wishes that try to break the routine (prompt injection, fake JSON, links, claimed votes, brands, politics, rule changes), checked on every pull request.
- Website: persistent 3D night island behind every page (voxel wishes that face the camera, light pools, moonlit sea, wish-stars), the story, a pixel map with timeline, a gallery of every wish, logbook, day pages, four MDX chapters, imprint and privacy pages.
- Genesis: day 0 on 2026-09-28 – a wishing well on a small island.
