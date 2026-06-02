# DESIGN.md

## Purpose

This file defines the visual and structural rules for this product.
Follow it before writing or changing any UI code.

The goal is clean, usable, production-grade interface design.
Do not generate generic AI-looking UI. Do not decorate the page to make it look “designed”. Design must come from hierarchy, spacing, typography, content, and clear interaction states.

## Non-negotiable rules

1. Do not add UI elements that were not required by the product task.
2. Do not create decorative cards, badges, pills, gradients, glows, fake stats, fake testimonials, abstract shapes, or random icons.
3. Do not wrap every piece of content in a card.
4. Do not use multiple accent colors on one screen.
5. Do not create repeated sections that say the same thing in different words.
6. Do not create marketing filler such as “unlock your potential”, “seamless experience”, “powerful insights”, “all-in-one platform”, or similar generic copy.
7. Do not use emoji as UI icons.
8. Do not invent data, metrics, users, logos, quotes, reviews, or social proof.
9. Do not use animation unless it explains state change or improves interaction clarity.
10. Do not start coding a page before defining its structure.

## Required process before UI implementation

Before creating or modifying any page, identify:

* The page purpose.
* The primary user action.
* The secondary user actions, if any.
* The content hierarchy.
* The layout structure.
* The existing components that should be reused.
* The states that must exist: loading, empty, error, success, disabled.

If this cannot be determined from the request, make the smallest reasonable assumption and keep the UI minimal.


## Layout principles

Use layout to create clarity.

* Use a 4px base spacing grid.
* Use consistent spacing scale: 4, 8, 12, 16, 24, 32, 48, 64.
* Use more space between groups than inside groups.
* Align related elements to the same left edge.
* Keep page content width intentional.
* Use max width for readable text.
* Avoid full-width content unless the content needs it.
* Prefer one strong column over many weak columns.
* Use two columns only when the secondary column clearly supports the primary task.
* On mobile, stack content in the order users need it.

Recommended widths:

* Main page container: 1120px max
* Reading content: 680px to 760px max
* Forms: 420px to 560px max
* Modals: 420px to 640px max
* Dense tables: full container width

## Typography

Typography should carry most of the design.

Use one font family unless the project already has a defined type system.

Default stack:

```css
font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
```

Type scale:

```css
--text-xs: 12px;
--text-sm: 14px;
--text-md: 16px;
--text-lg: 18px;
--text-xl: 24px;
--text-2xl: 32px;
--text-3xl: 40px;
```

Line heights:

```css
--leading-tight: 1.15;
--leading-title: 1.2;
--leading-body: 1.5;
```

Rules:

* One H1 per page.
* H1 should describe the page, not market the product.
* Body text should be 14px or 16px.
* Do not use tiny gray text for important information.
* Do not use excessive uppercase labels.
* Do not bold random words inside paragraphs.
* Do not use gradient text.
* Do not center-align long text.
* Do not use more than 3 type sizes in one component.

## Color system

Use restrained color. Most screens should be neutral.

Core tokens:

```css
:root {
  --color-bg: #ffffff;
  --color-surface: #f7f7f7;
  --color-surface-raised: #ffffff;
  --color-text: #171717;
  --color-text-muted: #666666;
  --color-text-subtle: #8a8a8a;
  --color-border: #e5e5e5;
  --color-border-strong: #d4d4d4;
  --color-accent: #111827;
  --color-accent-hover: #000000;
  --color-focus: #2563eb;
  --color-danger: #dc2626;
  --color-success: #15803d;
  --color-warning: #b45309;
}
```

Rules:

* Use background, text, muted text, border, and one accent color.
* Use accent color only for primary actions, selected states, links, and focus.
* Use danger only for destructive actions.
* Use success only for confirmed successful states.
* Use warning only for actual warnings.
* Do not use color as the only way to communicate meaning.
* Do not add a new color unless it becomes a named token.
* Do not use purple-blue gradients, rainbow accents, neon colors, or glowing borders.
* Do not use colored section backgrounds unless they support information hierarchy.

## Surfaces, borders, radius, shadows

Surfaces should be quiet.

Tokens:

```css
--radius-sm: 6px;
--radius-md: 10px;
--radius-lg: 14px;

--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.06);
--shadow-md: 0 8px 24px rgba(0, 0, 0, 0.08);
```

Rules:

* Use borders before shadows.
* Use shadows only for overlays, dropdowns, popovers, and modals.
* Do not use large soft shadows on normal content.
* Do not use glassmorphism.
* Do not use blurred translucent panels.
* Do not use large rounded cards everywhere.
* Do not use different radius values randomly.
* Default radius is 10px or less.

## Cards

Cards are allowed only when they group one coherent object.

Use cards for:

* Product item
* User item
* Pricing plan
* Document item
* Repository item
* Notification item
* Dashboard metric, only when metrics are explicitly required

Do not use cards for:

* Every section of a landing page
* Every paragraph
* Every feature
* Form fields
* Simple navigation links
* Content that would work better as a list, table, or plain section

Card rules:

* A card must represent one object.
* A card must have a clear title.
* A card should not contain another card.
* Card grids must not repeat the same visual rhythm for the whole page.
* If all cards look equally important, the design has no hierarchy.

## Buttons and actions

Each screen should have one primary action.

Button hierarchy:

* Primary: one per screen region, used for the main action.
* Secondary: neutral outline or subtle surface.
* Tertiary: text button.
* Destructive: only for destructive actions.

Rules:

* The primary CTA must be visible within 3 seconds.
* Do not place multiple primary buttons next to each other.
* Button labels must describe the action: “Create project”, “Save changes”, “Invite member”.
* Avoid vague labels: “Submit”, “Continue”, “Learn more”, unless context makes them precise.
* Disabled buttons must explain why the action is unavailable when needed.
* Destructive actions require confirmation or undo.

## Forms

Forms should be simple and structured.

Rules:

* Group fields by user mental model, not database schema.
* Labels must always be visible.
* Do not rely on placeholder text as a label.
* Show validation near the field.
* Explain constraints before submit.
* Keep helper text short.
* Use select, radio, checkbox, or combobox according to the real choice type.
* Do not split simple forms into unnecessary cards.
* Keep the submit action close to the form.

Required states:

* Default
* Focus
* Filled
* Error
* Disabled
* Loading during submit
* Success after submit

## Navigation

Navigation must reflect product structure.

Rules:

* Keep top navigation short.
* Do not add nav items for pages that do not exist.
* Current page must be visually clear.
* Do not duplicate the same navigation in multiple places.
* Use breadcrumbs only for nested hierarchy.
* On mobile, prioritize the current task over exposing every route.

## Data display

Choose the data pattern based on the user task.

Use tables for:

* Comparing rows with the same fields
* Sorting
* Scanning many records
* Admin or operational workflows

Use lists for:

* Feeds
* Messages
* Notifications
* Search results with varied content

Use charts only when:

* The user needs trends, proportions, or comparisons
* Real data exists
* The chart answers a specific question

Rules:

* Do not invent charts for visual interest.
* Do not invent metrics.
* Do not show fake analytics.
* Empty data must show a useful empty state.
* Tables need clear column names and sensible alignment.
* Numeric values align right.
* Text aligns left.

## Empty, loading, error, and success states

Every interactive screen must handle states.

Loading:

* Use skeletons only where layout is known.
* Use spinner only for short blocking actions.
* Do not show both skeleton and spinner for the same region.

Empty:

* Explain what is missing.
* Provide the next useful action.
* Do not use cute illustrations unless the product already has that visual language.

Error:

* Explain what failed.
* Tell the user what they can do next.
* Preserve user input when possible.
* Do not blame the user.

Success:

* Confirm what changed.
* Show the next logical action.
* Avoid excessive celebration.



## Motion

Use motion only for clarity.

Allowed:

* Menu open and close
* Modal entrance and exit
* Toast appearance
* Small hover or pressed states
* Loading progress

Not allowed:

* Decorative bouncing
* Constant floating elements
* Parallax by default
* Scroll-triggered spectacle
* Animations that delay task completion

Motion tokens:

```css
--duration-fast: 120ms;
--duration-md: 180ms;
--ease-standard: cubic-bezier(0.2, 0, 0, 1);
```

## Content rules

Use concrete product language.

Rules:

* Prefer nouns and verbs from the domain.
* Do not write generic SaaS marketing copy.
* Do not add explanatory text when labels are enough.
* Do not repeat the same claim in hero, cards, and CTA.
* Do not create fake testimonials, fake logos, fake avatars, or fake company names.
* If content is unknown, use neutral placeholders in brackets, for example `[Project name]`.
* Keep paragraphs short.
* Use bullets only when the user benefits from scanning.


## Component reuse

Before creating a new component:

1. Search existing components.
2. Reuse existing primitives.
3. Extend via props or variants if the behavior is the same.
4. Create a new component only for a new semantic purpose.
5. Do not duplicate similar components with different styling.

No one-off visual values. Use tokens.

## Implementation rules

* Use CSS variables or theme tokens.
* Avoid hardcoded random hex colors.
* Avoid hardcoded random spacing.
* Avoid arbitrary Tailwind values unless the design system has no matching token.
* Prefer simple layout primitives.
* Keep component APIs small.
* Separate structure, behavior, and styling.
* Do not install a UI library only to make one screen look better.
* Do not add dependencies for decorative effects.

## Anti-slop checklist

Before finishing any UI task, verify:

* The page has one clear purpose.
* The primary action is obvious.
* The information hierarchy is clear.
* The layout works at 390px mobile width.
* There are no unnecessary cards.
* There are no duplicate sections.
* There are no fake metrics, testimonials, logos, or avatars.
* There are no gradients, glows, or decorative blobs.
* There are no random accent colors.
* Typography is consistent.
* Spacing follows the 4px grid.
* All interactive elements have visible focus states.
* Loading, empty, error, and success states exist where needed.
* The design looks like a real product, not a generated landing page.

If any item fails, fix the UI before reporting completion.
