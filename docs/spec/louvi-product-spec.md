# Louvi: product spec and coding standard

_Captured from Lou's conversation with Claude Voice, 2026-11-06. Draft for Lou's review. Live copy: https://claude.ai/artifact/UUz5hqT6xoMpsui44K45fj_

## 1. What Louvi is

Louvi turns the AI organization Lou built over the past month into a product other people can use. Lou's setup — the roles, schedules, boundaries, rules, skills, GitHub-as-operating-system and the human-in-the-loop governance — becomes **Profile A**: a working, proven template.

People come to Louvi to design their own AI organization. They start from Profile A or another template, arrange the pieces visually like a flow diagram, adjust them to fit their own workflow, and test the result before they build it for real. Louvi tells them right away what won't work: a schedule clash, a role that can't merge, a hand-off with no reviewer, a permission that's too broad.

The long-term goal is that Louvi can **deploy** that design: real Docker images, real agents, running in the user's own environment.

**Repos:** `louisli/louvi` and `louisli/louvi-web`.

## 2. Two parts: the journey and the playground

Louvi has two parts: a curated story of how Lou's AI organization was built, and an interactive playground where people design and test their own.

**Part one: the journey.** A write-up of the development journey and the architecture Lou arrived at, with drill-downs. It shows the thinking, not everything.

- **The architecture:** roles, schedules, boundaries, escalation, GitHub as the operating system, and the human's decision kinds.
- **How it evolved:** what changed and why, from the first bots to the examiner, the equalizer and Bravo.
- **Lessons and failures:** the real breakages behind each rule. This is the same failure library the playground tests against.
- **The skills:** how roles draw on vetted best practice from Google, Anthropic, OpenAI, Amazon and Meta, and how that was vetted.
- **Flow diagrams** like the early READMEs, interactive where it helps.
- **What stays private:** secrets, scoring internals, and anything Lou chooses not to share.

**Part two: the playground.** People configure their own organization, starting from Profile A or another template, run a test, and get feedback (sections 4 and 5). Deployment is the end goal, so what they build there is real enough to use on an actual project.

**Why the journey ships first:** it costs almost nothing to build, it's how people find Louvi, and it earns trust in the playground's feedback by showing where those lessons came from.

## 3. Why it's valuable

- **The failure library is the moat.** Anyone can publish a template. Nobody else has a library of real failures from running an AI organization day to day. Each bug Lou's pipeline hits becomes a test scenario. Examples from 2026-11-05 alone: the ticket import that silently depended on the plan-file format; the thread mover that read a skip note as "done" and archived the thread; changes pushed to a branch whose PR was already merged.
- **It saves people the search.** Instead of piecing an agent organization together from generic advice, people start from something that already works and tweak it.
- **It reuses the arena's shape:** a private core that checks and scores, and a public app that shows the results.
- **It's a money path:** free templates and the visual designer bring people in; paid simulations, reviews and later a managed hosting option earn.

## 4. Phases, worked backwards from deployment

The end goal shapes every earlier phase. Each phase is a step on the same path, not a throwaway.

| Phase | What it does | Cost to Lou | Cost to user |
| --- | --- | --- | --- |
| 4. Deploy | Turns a configuration into a ready-to-run package: Docker images, a compose file, and a GitHub repo with their roles, rules and schedules. Self-hosted first; a managed (hosted) option later, as a paid subscription. | Near zero for self-hosted | Their own hosting and API keys |
| 3. Simulate | Runs real agents through scenarios from the failure library, on the user's own API keys. | Small: the scenario runner | Their tokens |
| 2. Check | A static checker: rules that read the configuration and catch schedule clashes, missing reviewers, risky permissions and broken hand-offs. No model calls. | Near zero | Free, instant |
| 1. Design | Shows an organization as a diagram; lets someone start from Profile A and edit it. | Small | Free |

**First version:** a page that shows Profile A as a diagram, lets someone edit one profile, and runs the static checks against the failure library. No model runs yet.

## 5. The configuration schema is the center

One configuration format is the single source of truth that the designer, the checker, the simulator and the deployer all read. It describes roles, schedules, permissions and access, boundaries and escalation, skills, hand-offs and the human's decision kinds.

Lou's repos already hold the raw material: role profiles, runbooks, schedules, access lists and the skills library. Louvi turns these into one format.

**Design rule:** design the schema for deployment from day one. If it can't produce a running setup, it's not finished.

## 6. Cost model: bring your own keys

- Users connect their own model API keys, so their model usage is billed to them, not to Lou. This is the standard approach and removes Lou's largest cost.
- Deployment runs on API keys, not personal subscriptions (provider terms).
- Self-hosting comes first, so hosting costs are the user's. A managed option comes later and is paid.

## 7. Security: shared responsibility

Louvi provides the skeleton; users secure their own environment. This is the shared responsibility model (as with AWS: the provider secures the platform, the customer secures what they put on it).

**Louvi's part (small, done carefully):**
1. **Safe defaults.** The skeleton starts with narrow permissions, so nobody inherits a hole by copying the template.
2. **No secrets in configuration.** A configuration says where a key is kept, never the key itself.
3. **A clear line.** Documentation states exactly what is the user's: their keys, hosting, access choices and anything they loosen.
4. **Warnings.** The checker flags any permission that widens access before deployment.

**The user's part:** locking down their servers, rotating keys, securing their repos, and any permission they choose to loosen.

**Known risks to keep in mind:** agents that read issues and PRs can be fed hidden instructions (prompt injection), so "data, not instructions" stays a core rule; most people keep defaults, so defaults must be safe; and liability for a leaked secret or damaged repo needs real legal advice before launch.

## 8. Support

Support is a normal cost of any technology product: users' setups will differ and break in new ways. Every new breakage is also a new scenario for the failure library, so support feeds the moat.

## 9. Coding standard (Louvi is the pilot)

Louvi's core idea is straightforward, so it's the cleanest place to prove a code-quality standard. Once it's applied on Louvi and shown to work, the pattern is extracted and rolled out to all repos (a separate, later decision). j-benchmark and the other repos keep their current practice for now.

### The standard

In one line: **Clean or Hexagonal Architecture with contract-first modules and a test pyramid.**

| Expectation | Industry name | Sources |
| --- | --- | --- |
| Config-driven | Externalized configuration, feature flags | The Twelve-Factor App; Martin Fowler on feature toggles |
| Common helpers | DRY, shared utility modules, extracted on the third repeat (rule of three) | The Pragmatic Programmer; Fowler, Refactoring |
| Extracted layers | Clean or Hexagonal architecture (ports and adapters): pure core, I/O at the edges | Robert C. Martin, Clean Architecture; Alistair Cockburn |
| Avoid complexity | KISS, YAGNI, deep modules | John Ousterhout, A Philosophy of Software Design |
| Lego pieces | High cohesion, low coupling, single responsibility | SOLID |
| Each piece knows what it serves | Bounded contexts with explicit contracts | Eric Evans, Domain-Driven Design |
| Guardrails | Design by contract; validate inputs at boundaries | Bertrand Meyer; Alexis King, "Parse, don't validate" |
| Testable | Dependency injection, pure core logic | Clean Architecture; Michael Feathers |
| Feature tests across modules | Test pyramid: unit per module, contract tests between modules, journey tests per user flow (given/when/then) | Mike Cohn and Martin Fowler; Pact; Dan North (BDD) |
| Readable | Optimize for the reader; small changes | Google Engineering Practices |

**Two rules that keep it from over-engineering:**
- Abstract on the third repeat, not the first. Fewer, deeper modules beat many thin wrappers.
- Contracts at the boundaries, simplicity inside.

**In real-world terms:** a modular, ports-and-adapters architecture with configuration-driven behavior. Each module is a bounded, single-purpose component with an explicit contract and validated inputs. Business logic stays pure and dependency-injected, so every unit is independently testable. Features are composed from these modules and verified through a test pyramid.

This style is also the most AI-friendly: explicit contracts, pure functions, injected dependencies and journey tests let an agent change one piece safely and prove it didn't break the rest. It fits Louvi itself too — a configurable organization builder is made of exactly these pieces.

### Rollout in the pipeline

**Round 1: the roles inherit it.**
1. Add the standard as a shared skill, `core/skills/shared/coding-standard.md` in earth-616-jarvis, each rule tied to its source.
2. The engineer, senior engineer and infra engineer skills point to it: build to the standard and say in the PR how each touched module meets it.
3. The reviewer checks against it: a missing contract, untestable code or a missing journey test is a change request.
4. Skill rules A–D apply: verified and current sources only, stored locally, three-way vetting (Claude Voice, Muse, Groky) before use.

**Round 2: the specs state it.**
1. The planner, product reviewer, auditor and debaters include a **Code quality** section in every Louvi spec or ticket: the modules involved, their contracts and guardrails, what's config-driven, and the tests required.
2. Acceptance criteria name those tests explicitly.
3. The auditor flags a Louvi spec missing the section before export.

**Keep it light in practice.** A long list only helps if it stays short per change. Like the skills library, each PR or spec applies the few rules that matter for that change, with the full list as the reference.

**Done when:** the shared standard exists, is vetted, and is loaded by the builders and reviewer; Louvi specs carry the Code quality section; and the first Louvi web feature built under the standard passes its journey test and review with no standard-related change requests.

## 10. Open questions for Lou

- Where does the simulator run long-term: Lou's servers or the user's environment?
- Which parts of Profile A ship by default, and which are optional modules?
- License for the templates and skeleton.
- How the coding-standard ticket gets filed (earth-616-jarvis, as drafted) and when.
