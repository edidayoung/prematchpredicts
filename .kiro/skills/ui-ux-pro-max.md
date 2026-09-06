---
name: ui-ux-pro-max
description: AI-powered design intelligence toolkit providing searchable databases of UI styles, color palettes, font pairings, chart types, and UX guidelines
source: https://github.com/nextlevelbuilder/ui-ux-pro-max-skill
---

# UI UX Pro Max - Design Intelligence Toolkit

This file provides guidance when working with UI/UX design decisions in this project.

## Project Overview

UI UX Pro Max is an AI-powered design intelligence toolkit providing searchable databases of UI styles, color palettes, font pairings, chart types, and UX guidelines. It works as a skill/workflow for AI coding assistants (Claude Code, Windsurf, Cursor, etc.).

## Search Command

```bash
python3 src/ui-ux-pro-max/scripts/search.py "<query>" --domain <domain> [-n <max_results>]
```

**Domain search:**
- `product` - Product type recommendations (SaaS, e-commerce, portfolio)
- `style` - UI styles (glassmorphism, minimalism, brutalism) + AI prompts and CSS keywords
- `typography` - Font pairings with Google Fonts imports
- `color` - Color palettes by product type
- `landing` - Page structure and CTA strategies
- `chart` - Chart types and library recommendations
- `ux` - Best practices and anti-patterns
- `icons` - Icon recommendations with import code (Phosphor, Heroicons, Lucide)
- `react` - React/Next.js performance patterns
- `web` - App interface guidelines (iOS/Android/React Native)
- `google-fonts` - Individual Google Fonts lookup
- `gsap` - GSAP animation skeletons by intensity tier (hover, scroll reveal, stagger, page transition, parallax, loading)

**Design dials (optional, only with `--design-system`):**
```bash
python3 src/ui-ux-pro-max/scripts/search.py "<query>" --design-system --variance <1-10> --motion <1-10> --density <1-10>
```
`--variance` biases style selection (centered/minimal → bold/asymmetric), `--motion` attaches a matching GSAP snippet from `motion.csv`, `--density` overrides the spacing-scale tokens (spacious → dense/dashboard). Any dial left unset behaves exactly as before.

**Stack search:**
```bash
python3 src/ui-ux-pro-max/scripts/search.py "<query>" --stack <stack>
```
Available stacks: `html-tailwind` (default), `react`, `nextjs`, `astro`, `vue`, `nuxtjs`, `nuxt-ui`, `svelte`, `swiftui`, `react-native`, `flutter`, `shadcn`, `jetpack-compose`, `threejs`, `angular`, `laravel`, `javafx`, `wpf`, `winui`, `avalonia`, `uno`, `uwp`

## Architecture

```
src/ui-ux-pro-max/                # Source of Truth
├── data/                         # Canonical CSV databases
│   ├── products.csv, styles.csv, colors.csv, typography.csv, ...
│   └── stacks/                   # Stack-specific guidelines
├── scripts/
│   ├── search.py                 # CLI entry point
│   ├── core.py                   # BM25 + regex hybrid search engine
│   └── design_system.py          # Design system generation
└── templates/
    ├── base/                     # Base templates (skill-content.md, quick-reference.md)
    └── platforms/                # Platform configs (claude.json, cursor.json, ...)

cli/                              # CLI installer (ui-ux-pro-max-cli on npm)
├── src/
│   ├── commands/init.ts          # Install command with template generation
│   └── utils/template.ts         # Template rendering engine
├── scripts/sync-assets.mjs       # Mirrors src/ -> cli/assets/ AND src/ -> .claude/skills/ui-ux-pro-max/
└── assets/                       # Bundled assets (~564KB)
    ├── data/                     # Copy of src/ui-ux-pro-max/data/
    ├── scripts/                  # Copy of src/ui-ux-pro-max/scripts/
    └── templates/                # Copy of src/ui-ux-pro-max/templates/

.claude/skills/ui-ux-pro-max/     # Claude Code skill: hand-authored SKILL.md +
                                   # data/, scripts/ mirrored from src/ (see Sync Rules)
.claude-plugin/                   # Claude Marketplace publishing
```

The search engine uses BM25 ranking combined with regex matching. Domain auto-detection is available when `--domain` is omitted.

## Sync Rules

**Source of Truth:** `src/ui-ux-pro-max/`

There are no symlinks in this repo (git-on-Windows checks them out as plain
text files pointing at a path, which silently breaks the skill) -- every
mirrored copy below is a real, independently-committed file kept in sync by
`cli/scripts/sync-assets.mjs`, enforced by the "Check asset sync" CI workflow.

When modifying files:

1. **Data & Scripts** - Edit in `src/ui-ux-pro-max/`:
   - `data/*.csv` and `data/stacks/*.csv`
   - `scripts/*.py`
   - Then run the sync below -- changes are NOT automatically reflected anywhere else.

2. **Templates** - Edit in `src/ui-ux-pro-max/templates/`:
   - `base/skill-content.md` - Common SKILL.md content
   - `base/quick-reference.md` - Quick reference section (Claude only)
   - `platforms/*.json` - Platform-specific configs

3. **Sync before publishing / committing data or script changes:**
   ```bash
   cd cli
   npm run sync:assets   # mirrors src/ -> cli/assets/ AND src/ -> .claude/skills/ui-ux-pro-max/{data,scripts}
   npm run check:assets  # verify, no npm install required
   ```
   `.claude/skills/ui-ux-pro-max/SKILL.md` itself is hand-authored, not
   mirrored or template-generated -- edit it directly.

4. **Reference Folders** - No manual sync needed. The CLI generates these from templates during `uipro init`.

## Prerequisites

Python 3.x (no external dependencies required)

**Note:** On Windows, use `python` instead of `python3` to run the scripts.

## Git Workflow

Never push directly to `main`. Always:

1. Create a new branch: `git checkout -b feat/...` or `fix/...`
2. Commit changes
3. Push branch: `git push -u origin <branch>`
4. Create PR: `gh pr create`

## For AstroServices Project

This skill is available as a reference for making design decisions. The project uses:
- React with TypeScript
- Tailwind CSS v4
- shadcn/ui components

When making design choices, consider consulting this skill's databases for:
- Color palette recommendations
- Typography pairings
- UI style guidelines
- Component patterns
- UX best practices
