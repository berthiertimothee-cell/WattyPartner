# VoltYield — UX Wireframe Structure

Low-fidelity layout notes for every page. Visual language: white background,
soft cards (`rounded-xl`, subtle shadow), generous spacing, royal dark blue
`#0B1F4D` accent, secondary blue `#1E4ED8`, muted text `#6B7280`. Airbnb-style
simplicity — few colors, lots of whitespace, no chrome.

## Global shell

```
┌───────────┬──────────────────────────────────────────────────────────┐
│ Sidebar   │ Topbar:  Org name · "Pricing & Revenue Workspace"   🔔(n) 👤│
│ (240px)   ├──────────────────────────────────────────────────────────┤
│           │                                                          │
│ ▣ Dashboard                                                          │
│ ⌖ Sites   │   <page content, max-w-7xl, 24–40px padding>             │
│ ⚖ Competitors                                                        │
│ ✦ Recommendations                                                    │
│ 🔔 Alerts │                                                          │
│ 📄 Reports│                                                          │
│ ⚙ Settings│                                                          │
│           │                                                          │
│ ─────────  │                                                          │
│ Org card  │                                                          │
└───────────┴──────────────────────────────────────────────────────────┘
```

Sidebar collapses on small screens; topbar keeps the bell + user chip.

## /dashboard

```
Dashboard                                              <subtitle: N sites · FR>
[ KPI ][ KPI ][ KPI ][ KPI ][ KPI ]   ← 5 cards: Avg price, Competitor gap,
                                          Revenue opportunity, Utilization,
                                          Recommended actions (clickable)
┌───────────────────────────────┬──────────────────────┐
│ Site map (schematic)          │ AI recommendation    │
│ • your sites  • competitors   │  (top-impact card:   │
│ hover → tooltip               │   rationale, action, │
│                               │   impact, accept/    │
│                               │   dismiss/export)    │
└───────────────────────────────┴──────────────────────┘
┌───────────────────────────────┬──────────────────────┐
│ Pricing benchmark (table)     │ Alerts (feed, 6)     │
│ Site | Our | Avg | Gap | Pos. │  • dotted severity   │
└───────────────────────────────┴──────────────────────┘
```

## /sites

```
Sites                                                  <subtitle: N sites>
┌──────────────────────────────────────────────────────┐
│ Portfolio map (schematic)                             │
└──────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────┐
│ Table: Site | Operator | Power | Price | Util |       │
│        Sessions/d | Revenue/mo | Uptime | Status |    │
│        Actions(open recs badge)                       │
└──────────────────────────────────────────────────────┘
```

## /sites/[id]

```
← All sites
<Site name>                                            [status badge]
<address, city · operated by …>
┌──────────────────────────────────────────────────────┐
│ Stats row: Price | Local avg(+gap) | Utilization |    │
│            Sessions/d | Revenue/mo | Uptime | Power   │
│ Chargers: 4× Pylon A · 150 kW · CCS/CHAdeMO  …        │
└──────────────────────────────────────────────────────┘
┌───────────────────────────────┬──────────────────────┐
│ Location & competitors map     │ Demand signals       │
│ (site highlighted + comp dots) │  composite demand,   │
│                                │  weather, holiday,   │
│                                │  events, traffic,    │
│                                │  day type            │
└───────────────────────────────┴──────────────────────┘
┌───────────────────────────────┬──────────────────────┐
│ Hourly utilization (area)      │ Utilization by weekday (bars) │
└───────────────────────────────┴──────────────────────┘
┌───────────────────────────────┬──────────────────────┐
│ Competitor benchmark (table)   │ Price positioning    │
│ Station|Op|Dist|Power|Price|   │  (horizontal bars vs │
│ Avail|Gap|Source               │   competitors + avg) │
└───────────────────────────────┴──────────────────────┘
┌───────────────────────────────┬──────────────────────┐
│ Recommendations (cards grid)   │ Site alerts (feed)   │
└───────────────────────────────┴──────────────────────┘
```

## /competitors

```
Competitor benchmarking
[ stat ][ stat ][ stat ][ stat ]   ← stations, operators, avg gap, overpriced
┌──────────────────────────────────────────────────────┐
│ Benchmark by site (table)                             │
└──────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────┐
│ All competitor stations (table)                       │
│ Station|Op|Near site|Dist|Power|Price|Avail|Gap|Source│
└──────────────────────────────────────────────────────┘
```

## /recommendations

```
Pricing recommendations
[ stat ][ stat ][ stat ][ stat ]   ← open, est. opportunity, price-down, price-up
[All][Open][Accepted][Dismissed][Exported]   ← filter chips (counts)
┌───────────────┐ ┌───────────────┐
│ Rec card      │ │ Rec card      │  ← 2-col grid, sorted by € impact
│ type/severity │ │  …            │
│ title · site  │ │               │
│ rationale     │ │               │
│ action        │ │               │
│ impact row    │ │               │
│ Accept Dismiss Export            │
└───────────────┘ └───────────────┘
```

## /alerts

```
Alerts
[ stat ][ stat ][ stat ][ stat ]   ← total, pricing, competitor moves, opps
┌──────────────────────────────────────────────────────┐
│ Alert feed (newest first)                             │
│  ● <title>  [severity]  type             3h ago       │
│    <message>                                          │
│    <site link>   Mark read                            │
│  …                                                    │
│  Mark all read                                        │
└──────────────────────────────────────────────────────┘
```

## /reports

```
Reports                                  [Print/PDF] [Export JSON]
[ May 2026 ][ April 2026 ]   ← period chips
┌──────────────────────────────────────────────────────┐
│ <Org> — Pricing & Revenue Report · period · generated │
│ Stats: Avg price | Comp avg(gap) | Util | Revenue/mo  │
│        | Revenue opportunity | Recommended actions    │
└──────────────────────────────────────────────────────┘
┌───────────────────────────────┬──────────────────────┐
│ Pricing performance (notes)    │ Benchmark vs comp.   │
└───────────────────────────────┴──────────────────────┘
┌───────────────────────────────┬──────────────────────┐
│ Top underperforming sites      │ Top price-increase   │
│ (table)                        │ opportunities (table)│
└───────────────────────────────┴──────────────────────┘
┌──────────────────────────────────────────────────────┐
│ Recommended actions summary → link to /recommendations│
└──────────────────────────────────────────────────────┘
```

## /settings

```
Settings
┌───────────────────────────────┬──────────────────────┐
│ Organization                   │ Pricing strategy     │
│ name/country/currency/mode     │  engine thresholds   │
└───────────────────────────────┴──────────────────────┘
┌──────────────────────────────────────────────────────┐
│ Team (name | email | role)                            │
└──────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────┐
│ Data sources & integrations                           │
│ Provider | Purpose | Env var | Status                 │
└──────────────────────────────────────────────────────┘
```
