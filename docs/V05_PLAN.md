# v0.5 Decision / execution plan

Spec: user-supplied v0.5 full development instruction, 2026-10-19. Baseline fetched main22da495; clean. Branch codex/v0.5-adapters. Work in existing checkout as requested; no destructive cleanup.

## Decision
Keep vanilla MV3, existing capture/sanitizer/render pipeline, offline fixed runtime. IR1.3 explicitly adds tabs@1/calculator@1/state@1; migrate1.0/1.1/1.2. Built-in versioned registry owns finite model validators, capability and runtime dispatch. Source registry separates explicit user-selected controlled contracts (model validation only), generic DOM native/static, and local files (always unverified). Every page including localhost fixtures needs explicit consent. Neither page markers nor pathnames grant trust; source equivalence lives in independent test evidence.

Adapters validate bindings, namespaces, parser-stable wrapper layouts, state/model equality, limits and non-overlap; unknown or invalid candidates degrade individually. Tabs/state hidden panels are captured only under explicit controlled source contract; generic hidden DOM remains omitted. Preserve visual styles, ARIA and finite keyboard logic; no arbitrary expressions. Existing Fourier/table validators remain strict while moving dispatch behind registry. Native details remains browser-owned.

## Tasks and ownership
1. Core adapter engine: registry + finite models + runtime + interactions/IR/schema/render integration and unit tests. Separate implementation agent under subagent-driven-development skill. Output interface: recipes tabs@1 (root,tabs[],panels[]; state.active), calculator@1 (root,left,right,output; state.left/right with fixed sum model), state@1 (root,control,panels[]; state.active boolean). Exact interfaces coordinated before capture.
2. Root: source contracts and capture integration, varied owned fixtures, real MV3 roundtrip/visual/negative tests, version/build/CI and packaging. Consumes core interface. No extension mutation while full test frozen.
3. UI refinement after rendered audit using installed refactoring-ui skill: preserve product layout and export styles; primary download, compact bounded capability report, explicit evidence/downgrade reasons. Independent UI agent after baseline screenshot evidence exists. Scope preview/popup CSS only, not core.
4. Integration/security review, fix and full original/new tests; installedZIP E2E; docs/evidence management; commit/push/PR+merge (standing authorization), verify main CI. No public Release/license/admin changes.

## Evidence
New generated full snapshots only ignored tests/artifacts/v0.5.0 + CI artifacts. Commit compact metric/hash/behavior summaries and limited representative screenshots; retain historical files. Windows/Obsidian must be real GUI or Unverified, never Linux substitute.

## Interface conflict audit
| Tasks | Shared contract | Ruling |
|---|---|---|
|1/2|recipe names/bindings/state|Agree exact API before capture; core owns validation/render, root owns capture/source.|
|1/3|analyze components|UI consumes existing component report plus optional reason/evidence, no model logic.|
|2/3|E2E DOM selectors|Preserve existing IDs and format/strategy options.|
|1|IR versus old migrations|Version1.3; keep1.2 finite old recipe support, never upgrade evidence on files.|
|2|fixture identity versus general scope|Controlled user consent authorizes model only; source equivalence remains separate test evidence, never inferred from a URL.|
|3|design versus source fidelity|Only plugin UI CSS scoped to extension, no export CSS redesign.|
