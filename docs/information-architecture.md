# Information architecture

Invented demo content throughout. Paths are relative to the repo root.

```
/                          Marketing entry
  index.html               Cinematic landing (Apple-inspired ONLY here)
  sitemap.html             Full site directory

/services                  Offerings
  index.html               Catalog hub (cards → offerings)
  fiber.html               Residential fiber plans + FAQ
  mobile-5g.html           5G plans + device notes
  business.html            Business packages + add-ons

/about                     Company
  index.html               Mission, story, leadership
  achievements.html        Awards, milestones, coverage stats (timeline)

/careers                   Hiring
  index.html               Open roles list
  apply.html               Demo application form

/contact                   Support & sales
  index.html               Form, hours, regional offices

/docs                      How-to guides (Markdown)
/styles                    Design tokens + dual themes
/js                        Shared chrome, forms, landing motion
```

## Primary navigation

Home · Services · About · Careers · Contact

Utility: Careers shortcut + Contact CTA button.

## Deep links from the landing

| Landing CTA | Destination |
|-------------|-------------|
| Explore plans | `services/index.html` |
| Our story | `about/index.html` |
| See our milestones | `about/achievements.html` |
| View fiber plans | `services/fiber.html` |
| Explore 5G | `services/mobile-5g.html` |

## Content ownership notes

- Offices: Nicosia HQ, Limassol NOC, Larnaca Retail, Paphos Hub
- Leadership: Elena Markides (CEO), Andreas Demetriou (CTO), Sofia Constantinou (CCO)
- Support phone: +357 22 123 456
- Email domains: `@cypruscomm.demo` (fictional)

When adding a page: update `sitemap.html`, this doc, and the footer “Explore” lists as needed.
