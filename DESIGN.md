# OpsCortex design guidelines

Read this before adding or changing any component, section, page, style, or motion.
This is the project design contract for human and AI contributors.

## Authority and scope

Explicit user instructions take precedence. Otherwise preserve the identity and
protected choices below. Use the live source for exact implementation details;
if source and this guide disagree, identify the mismatch before extending it.
An existing defect or placeholder is not permission to copy it.

Baseline: source inspected at commit `adb0cec`. This guide describes that
implementation and adds contribution rules; it is not an accessibility audit.
Update this document in the same change when an approved design decision changes.
Do not redesign adjacent sections while implementing a local request.

## Identity and protected choices

OpsCortex teaches production Kubernetes, SRE, DevOps, and cloud engineering.
The visual language combines editorial serif headlines, restrained technical
metadata, generous spacing, quiet surfaces, and practical engineering content.

- Preserve Instrument Serif headings, Inter body/UI, and JetBrains Mono metadata.
- Use neutral colors for body text and navigation. Use logo red for text accents.
- **Text accent is `--accent2: #f73938` in BOTH themes.** Do not replace it with
  salmon, pink, a gradient, or a theme-specific approximation.
- **Do not recolor butterflies.** Their artwork, materials, and scene are separate
  from brand text. Do not apply global filters, canvas tinting, or a shared color
  replacement to `src/scripts/wings.ts` or `src/scripts/hero3d.ts`.
- Keep both supplied owl logos. Light theme uses
  `public/images/brand/logo-light.png`; dark uses `logo-dark.png` in that folder.
  Public URLs omit `public`. Preserve aspect ratio; do not recolor or crop assets.
- Preserve the shared header, footer, theme switch, and existing content hierarchy.
  New sections may use different compositions within this language.

## Source map: read only what the change needs

| Concern | Source |
| --- | --- |
| Colors, type, spacing, primitives, reduced-motion CSS | [global.css](src/styles/global.css) |
| Shared shell, fonts, logos, initial theme, navigation | [Base.astro](src/layouts/Base.astro) |
| Section rhythm and homepage composition | [index.astro](src/pages/index.astro) |
| Course card contract | [CourseCard.astro](src/components/CourseCard.astro) |
| Subscription UI | [Newsletter.astro](src/components/Newsletter.astro) |
| Shared waitlist dialog | [Waitlist.astro](src/components/Waitlist.astro) |
| Existing animation hooks and theme event | [motion.ts](src/scripts/motion.ts) |
| Butterfly scene and wing artwork | [hero3d.ts](src/scripts/hero3d.ts), [wings.ts](src/scripts/wings.ts) |
| Course and post content model | [content.config.ts](src/content.config.ts) |
| Available commands and dependencies | [package.json](package.json) |

## Color and themes

Reference tokens instead of inserting new hex values into components.
Tailwind syntax: `text-[var(--accent2)]`, `bg-[var(--bg2)]`,
`border-[var(--line)]`. Do not introduce a second theme mechanism.

| Token | Dark | Light | Role |
| --- | --- | --- | --- |
| `--bg` | `#09090b` | `#f7f5f1` | Page |
| `--bg2` | `#0e0e11` | `#fdfcfa` | Alternate section / inset |
| `--text` | `#ededf0` | `#141416` | Primary text |
| `--muted` | `#8f8f99` | `#62626b` | Supporting text |
| `--dim` | `#5b5b64` | `#a3a3aa` | Low-emphasis decoration; check readability |
| `--accent2` | `#f73938` | `#f73938` | Emphasis, eyebrow text, accented links/numbers |
| `--accent` | `#e8524a` | `#e04a42` | Existing button fills and decorative accents |
| `--prose` | `#cfcfd6` | `#3a3a42` | Long-form reading |

Use `--surface`, `--line`, `--line2`, `--card-a`, `--card-b`,
`--card-shadow`, `--nav-bg`, `--code-bg`, and `--backdrop` for their existing
surface roles. Read their values from CSS instead of duplicating them here.

The user approved text accent changes, not a universal recoloring of buttons,
glows, terminal error colors, or butterflies. Preserve that distinction.
Code blocks and the homepage terminal intentionally remain dark in both themes.

Theme state lives on `html[data-theme]`. Base initializes it before paint;
`motion.ts` persists toggles and emits `themechange`. Header/footer logos follow
site theme; current favicon media queries follow OS preference.

Brand red and muted/dim tokens are not blanket contrast guarantees. Check actual
foreground/background pairs, especially small red text on light backgrounds.
Keep essential new small copy in a readable neutral token if necessary; report
a conflict instead of silently changing the locked brand red.

## Typography and hierarchy

| Use | Existing classes / rules |
| --- | --- |
| Main page headline | `display h1`: clamp(3rem, 8.5vw, 7.75rem) |
| Section heading | `display h2`: clamp(2.25rem, 5.2vw, 4.5rem) |
| Editorial card heading | `display h3`: clamp(1.6rem, 2.6vw, 2.25rem) |
| Introductory paragraph | `lead`: fluid size, muted, max-width 44rem |
| Section label | `eyebrow`: uppercase mono, letter spacing, decorative dot |
| Metadata / numbering | `mono`; explicit accent class only where appropriate |
| Article body | `prose`: 1.1rem, line-height 1.75, max-width 42rem |

`display` uses regular-weight serif and tight tracking. Use `<em>` sparingly
for a meaningful phrase; it receives italic logo-red emphasis inside display text.
Avoid all-red headlines or paragraphs. Compact utility card headings may use
Inter semibold, as the homepage already does.

Use one h1 per page and ordered heading levels. Typography classes do not decide
HTML semantics. Avoid forced line breaks that break narrow screens.
Do not replace fonts because a generic style scanner prefers a different family.

## Layout, spacing, and surfaces

- Use `wrap`: maximum 1200px with 3rem total horizontal gutter.
- Use `section`: vertical padding clamp(5rem, 10vw, 9rem), or `section--tight`:
  clamp(3rem, 6vw, 5rem). Adjust a boundary locally when adjacent sections would
  double the intended spacing; do not invent a competing spacing system.
- Existing rhythm: eyebrow → heading `mt-5`; copy `mt-3` to `mt-7`;
  content grid `mt-14`; grid `gap-4`; larger editorial splits `gap-12`.
- Start with one column. Expand with existing `md:` / `lg:` utilities.
  Use `min-w-0`, wrapping actions, and contained code overflow where needed.
- Alternate quiet page backgrounds and occasional `--bg2` bands with thin
  borders. Do not wrap every paragraph in a card.
- Reuse `card` + `card__in`: 20px radius through `--r`, token-based surfaces,
  1px border, and fluid inner padding. Existing pointer tilt comes with this class.
- Reserve `gborder` for prominent conversion panels. Buttons are pills;
  inputs use 12px radius; terminal/code surfaces use 14px.
- Keep home hero composition special. Ordinary sections do not need a full-height
  hero, another canvas, or another moving background.
- Preserve overlay ordering: butterfly canvas 40, navigation 50, noninteractive
  grain 100. Use the existing native dialog rather than arbitrary huge z-indexes.

## Reuse and component behavior

Use Astro components and existing Tailwind utilities; no new UI framework or
animation dependency for an ordinary section.

- Pages use `Base` with title and an appropriate description. It already provides
  `main#main`, header, footer, Waitlist, and shared motion.
- Render courses with `CourseCard`; obtain course/post data from Astro content
  collections instead of duplicating prices, tags, hours, or titles.
- Use `btn` for primary actions, `btn btn--ghost` for secondary actions,
  `btn--sm` for compact controls, and `link` for understated navigation.
- Navigation uses anchors with real destinations. Actions use buttons.
  Do not nest a button or another link inside a whole-card anchor.
- Use native `details.acc` / `summary` for disclosure patterns, preserving
  keyboard behavior. Reuse `input`, `tag`, and `tag--accent`.
- Use `data-waitlist` to invoke the existing dialog. Do not duplicate its IDs
  or create a separate modal for the same intent.
- Existing newsletter submission fakes success and is marked TODO. Reuse its
  visual language without claiming a working subscription backend.
- Extract a new component for a repeated unit or a meaningful independent
  behavior. Keep a one-off section local; do not build speculative abstractions.

## Motion contract

Reuse the hooks in `motion.ts`; do not add a second Lenis loop or duplicate
GSAP registration. Static sections are valid.

| Hook | Use |
| --- | --- |
| `data-reveal` | Once-on-scroll content entrance |
| `data-delay="0.1"` | Optional reveal delay, in seconds |
| `data-split` | Word-based headline entrance; avoid interactive descendants |
| `data-hero` | Homepage hero entrance only |
| `data-parallax="18"` | Optional existing scroll translation |
| `magnetic` | Existing fine-pointer button treatment |
| `data-count`, `data-suffix` | Existing number animation |
| `data-term` with `.ln` | Existing terminal line entrance |

Do not stack split/reveal/parallax on the same element without checking transform
ownership; use separate wrappers when combining effects. Prefer a restrained
entrance over introducing another continuously moving element.

Reduced motion must show content in its final state. Essential information must
remain available without animation and without JavaScript. Do not hide new
content with unconditional opacity rules. Touch users must not depend on hover.
Changing the shared motion engine or butterfly behavior requires explicit scope.

## Example: an ordinary section inside a Base page

This is a markup pattern, not approved marketing copy. Replace wording with
verified content. No additional CSS or JavaScript is needed.

```astro
<section class="section" aria-labelledby="practice-heading">
  <div class="wrap">
    <p class="eyebrow" data-reveal>Practice</p>
    <h2 id="practice-heading" class="display h2 mt-5" data-split>
      Understand the <em>failure</em>.
    </h2>
    <p class="lead mt-7" data-reveal>
      Work through the system behavior behind each exercise.
    </p>
    <div class="mt-9 flex flex-wrap gap-3" data-reveal>
      <a href="/courses" class="btn">Explore courses</a>
      <a href="/newsletter" class="btn btn--ghost">Read the newsletter</a>
    </div>
  </div>
</section>
```

For a collection of independent items, follow the homepage's responsive grid
and card anatomy. For a reading list, use separated rows like the newsletter.
Choose structure for the content instead of defaulting to a bento grid.

## Copy and assets

Write concrete, direct engineering language: what learners do, what breaks, what
they learn. Keep labels short and actions specific. No generic AI superlatives.
Do not invent testimonials, subscriber counts, credentials, outcomes, or backend
success. Existing TODO content is a known placeholder, not factual source material.

Store new public assets under a descriptive folder in `public/images/`, with
explicit dimensions and meaningful alt text; use empty alt for decorative images.
Use existing simple stroke SVG conventions for UI icons. Do not replace the owl
or add unrelated stock illustration styles to a routine section.

## Before declaring a UI change complete

1. Name the closest existing section/component and the reused tokens. State any
   intentional departure; obtain direction only when it changes a protected choice.
2. Check the real changed page in both themes at 375px, 768px, and 1440px widths.
   These are contribution test widths, not a claim about existing breakpoints.
   Inspect heading wrapping, long content, card alignment, and horizontal overflow.
3. Exercise relevant hover, keyboard focus, links, form validation, disclosure or
   dialog states. Keep visible focus and accessible labels. Check contrast and
   reduced-motion/no-JavaScript content; report defects rather than copying them.
4. Confirm correct logos and unchanged butterfly artwork when working near the
   shell or hero. Capture before/after views when judging visual parity.
5. Run `npm run build`, then `npx --yes impeccable detect <changed-paths>`,
   replacing the placeholder with actual affected files or directories.
   Assess scanner findings against this contract; do not redesign fonts to clear
   a generic preference warning. Add focused behavioral checks when behavior changes.
6. Run `git diff --check` and inspect the final diff for unrelated changes.
   Report exact checks and any unverified states. Build success alone is not
   proof of rendered appearance or working integrations.

For documentation-only edits, validate referenced paths, tokens, and examples;
a site build or screenshot run is unnecessary unless runtime files changed.



## Behind the Click visual prototype

The user authorized a new look-and-feel prototype at `/experience` on the isolated
`codex/behind-the-click` branch. Its short cinematic opening, mission reveal,
prepared recovery simulation and editorial course close intentionally differ
from the existing butterfly homepage composition. The prototype uses its own
scoped page motion and native scrolling; it does not load a second global Lenis
loop. Existing homepage and butterfly artwork remain intact.

Keep supplied owl logos, three font families and `--accent2: #f73938` in both
themes. Original Blender imagery may retain a dark photographic exposure in
both themes; ordinary content and controls follow theme tokens. The 3D scene
is decorative; course information, navigation and simulation state live in HTML.
Do not present the recovery demonstration as a live Kubernetes lab.

The current scope tests appearance and interaction, not paid enrollment or
completed course delivery. No placeholder testimonials or simulated waitlist
success should be added to this preview.

The approved connected slice replaces the isolated opt-in aisle viewer with one
scroll-controlled application → Docker image → Kubernetes Pods scene. Real
chapter links and captions remain HTML. Static illustrations are the default;
activate the pinned canvas only after a rendered frame is available. Reduced
motion, no JavaScript, load failure and lost WebGL context must keep all three
chapters readable in normal document flow.
