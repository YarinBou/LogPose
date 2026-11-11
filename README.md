# LogPose

An interactive, Next.js-powered chronicle of the One Piece timeline, lore, and geography.

## What is in it

- **Hero**: the entrance to the Grand Line (Red Line, Calm Belts, four Blues) with a waving Jolly Roger and a "Set Sail" button.
- **The Grand Timeline**: every arc in sailing order, grouped by saga, dated on the Sea Circle Calendar. A miniature Thousand Sunny follows an SVG course down the page as you scroll.
- **The Crew**: wanted posters with current bounties.
- **The World Map**: an abstract SVG chart with about 330 named places, the Poneglyphs, and the Straw Hats' course. Pan, zoom, search, and filter by sea.
- **Easter eggs**: three hidden Pandamen, the Alabasta "X" cursor, Usopp's Lies Tracker, "Waraibanashi" at Laugh Tale, a dachshund in a straw hat, Doskoi Panda and Criminal brand marks, and Minatomo on the 404 page.

## Data and sources

- `data/timeline.ts`: sagas, arcs, dates, crew, bounties, easter-egg flags. Dates follow the [Library of Ohara timeline](https://thelibraryofohara.com/the-one-piece-timeline/) (v5.0, which ends at Egghead).
- `data/map.ts`: place names, coordinates and points of interest from the [Library of Ohara world map](https://thelibraryofohara.com/onepieceworldmap/).

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build, includes the TypeScript check
npm run typecheck  # TypeScript only
```

Built with Next.js (App Router), React, Tailwind CSS v4, and Framer Motion. Deploys to Vercel with no extra configuration.

LogPose is an unofficial fan project. One Piece is created by Eiichiro Oda and published by Shueisha.
