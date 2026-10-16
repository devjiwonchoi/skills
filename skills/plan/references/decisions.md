# Decision collection

1. Identify the development targets, affected surfaces, and task kinds from the request and repository. Ask only about consequential ambiguities. Combine relevant contexts for changes that span multiple surfaces.
2. Check all common areas below. Expand each relevant area into concrete decision items for this change. Propose exclusions with reasons for unrelated areas and obtain user approval, individually or together.

   | Area | Decisions to check |
   | --- | --- |
   | Product intent | Problem, intended users or callers, and desired outcome. |
   | Scope | Included behavior, boundaries, and non-goals. |
   | UX | User flows, interaction, accessibility, and visible states. |
   | APIs and contracts | Public interfaces, types, compatibility, and versioning. |
   | Data and state | Ownership, persistence, lifecycle, consistency, and migration. |
   | Security and privacy | Access, trust boundaries, sensitive data, and retention. |
   | Integrations | Dependencies, external contracts, and unavailable services. |
   | Flags and rollout | Enablement, release conditions, rollout, and rollback. |
   | Operations | Configuration, deployment, capacity, maintenance, and recovery. |
   | Observability | Signals needed to detect success and diagnose failures. |
   | Failure cases | Invalid input, partial failure, retries, and user or caller recovery. |
   | Documentation and support | Usage guidance, migration notes, and support expectations. |
   | Testing and acceptance | Expected behavior, observable acceptance criteria, and regression protection. |
   | Delivery | Commit and PR boundaries, dependencies, permissions, and readiness. |

3. Adapt detailed questions to the affected surfaces. Treat these examples as prompts, not exclusive types or a complete questionnaire.
   - For apps, check user journeys, navigation, loading, empty, error, and success states.
   - For SDKs and libraries, check exported APIs, types, compatibility, and consumer migration.
   - For CLIs, check arguments, input/output, exit codes, and interactive or scripted use.
   - For servers, check request contracts, consistency, concurrency, and failure recovery.
4. Adapt decisions to the task kinds. Combine them when the work includes several kinds.
   - For new features, define new behavior and release conditions.
   - For bug fixes, establish expected behavior, reproduction, and regression protection.
   - For internal refactoring, identify preserved contracts and verification without inventing new product behavior.
5. Record each item under [Plan recording](recording.md). Close it only with one of these statuses and its evidence.
   - `user-confirmed`: an actual user answer settles the decision.
   - `contract-determined`: an authoritative repository contract directly determines the answer. Cite the source and explain how it settles the item without asking again.
   - `not applicable`: the user explicitly approves the exclusion and its reason.
6. Keep unanswered, ambiguous, conflicting, or merely proposed decisions `open`. Existing code or a convention that does not determine the answer is insufficient evidence. Ask the user to resolve conflicts that the recorded evidence cannot settle.
7. Allow explicit approval of grouped proposals or exclusions. Record which items and reasons the response covers. Do not treat silence, a blank row, reviewer agreement, or general plan approval as an answer to an unresolved item.
8. Allow drafts and early previews with open items clearly marked. Collect decision approvals before requesting final plan approval. Block final approval requests and implementation handoff while any item remains open.
9. Reopen affected items when decisions or their supporting contracts change. Preserve prior answers, approvals, and evidence when recording the revision.
