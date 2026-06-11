# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A Shopify storefront theme for **Body Restore** (a skincare/DTC brand), built on **Dawn 11.0.0** and heavily customized. There is no build step, package.json, or test suite — Liquid templates and assets are served directly by Shopify. Work happens through the Shopify CLI against a live/dev store.

## Commands

Development uses the [Shopify CLI](https://shopify.dev/docs/themes/tools/cli) (no local config file is committed, so connection is interactive):

```bash
shopify theme dev          # local dev server with hot reload against the store
shopify theme pull         # pull latest theme files from the store
shopify theme push         # push local changes to a theme
shopify theme check        # lint Liquid (theme-check); the closest thing to a test
```

There are no unit tests. "Testing" a change means previewing it with `shopify theme dev` and verifying in the browser, since most logic is Liquid + client-side JS.

## Architecture & conventions

Standard Shopify theme directory model — read these to understand a page:
`layout/theme.liquid` (global wrapper) → `templates/*.json` (section ordering, as JSON) or `templates/*.liquid` (hardcoded) → `sections/*.liquid` → `snippets/*.liquid` (reusable partials, rendered via `{% render %}`) → `blocks/*.liquid` (block-level partials). Theme settings live in `config/settings_schema.json` (definitions) and `config/settings_data.json` (saved values); markets in `config/markets.json`; translations in `locales/`.

Key things that are non-obvious and easy to get wrong:

- **This is NOT vanilla Dawn.** Many files are bespoke or duplicated with suffixes — e.g. `buy-buttons.liquid` vs `buy-buttons-new.liquid` vs `buy-buttons-new-temp.liquid`, `addtocart-sticky.liquid` vs `addtocart-sticky-new.liquid`. When editing, first confirm which variant the relevant template/section actually renders rather than assuming the canonical Dawn file is live.

- **Bundle builder** is a major custom feature spanning `sections/bundle-landing-page-product.liquid` and the `bundle-*` snippets (`bundle-progressbar`, `bundle-progressgrid`, `bundle-product-lists`, `bundle-static-variant-*`, `bundle-free-gift-info`, etc.). Bundle/gift logic lives across these snippets — changes usually touch several of them together.

- **Replo landing pages.** ~22 `templates/page.replo*.liquid` and `templates/*.replo*` files plus `snippets/replo-head.liquid` are generated/managed by the [Replo](https://replo.app) page builder. Treat these as builder output — prefer editing in Replo over hand-editing unless doing a targeted fix.

- **Influencer pages.** ~31 `templates/page.influencer-*.json` files are per-creator landing pages following the same section recipe; new ones are typically cloned from an existing one.

- **`.icart` templates** (`cart.icart.liquid`, `collection.icart.liquid`) are alternate cart/collection variants tied to a cart-drawer app integration — distinct from the default `cart.json` / `collection.json`.

- **Product/collection templates are heavily forked.** Many product variants exist as `templates/product.*.json` (e.g. `product.beef-tallow-lip-mask.json` and its `-b` A/B counterpart). The `-b` suffix denotes A/B test variants — keep both in sync when changing shared behavior.

## Front-end JS & third-party stack

`layout/theme.liquid` loads a lot globally, so assume these are available everywhere and account for them when debugging client behavior:

- **jQuery 3.7.1** (CDN) plus `assets/at-jquery.js` and `assets/custom.js` for bespoke jQuery-based behavior — much of the custom interactivity is jQuery, not Dawn's web components.
- Carousels/galleries use a mix of **Slick**, **Swiper 11**, **Flickity**, and **Fancybox 3** (all CDN) — check which one a given section uses before touching slider markup.
- Dawn's own web-component JS still ships in `assets/` (`global.js`, `cart.js`, `cart-drawer.js`, `pubsub.js`, `constants.js`, etc.) and coexists with the jQuery layer.
- **Analytics/attribution pixels are injected inline at the top of `theme.liquid`**: Heatmap.com, Northbeam, Jumbleberry, Squaredance. These run on every page — be careful editing the `<head>` and don't remove them inadvertently.

## Editing guidance

- Match the existing style of the file you're in (Dawn conventions in Dawn-derived files; the project's jQuery style in custom files). Many snippets mix both.
- When fixing a bug, trace from the rendering template down through `{% render %}` calls to find the actual snippet in play — duplicated/`-new`/`-temp` files mean grepping a class name or string is more reliable than guessing the filename.
- Avoid editing Replo-generated files by hand unless the fix is small and surgical.
