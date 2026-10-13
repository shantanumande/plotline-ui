<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- All network access goes through `src/lib/api.ts` (mock or live); components never call fetch. Why: one switch point for demo vs real backend.
- The UI never computes statistics; numbers come from the API and are only formatted via `src/lib/format.ts`. Why: backend is the single source of truth.
- Mock fixtures in `src/mocks/` are verbatim backend output; never edit their numbers. Why: they mirror the real contract.
