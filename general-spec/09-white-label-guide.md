# 09 — White-Label Guide

To ship Minhaj for a new school under a new name, change only the items below. If a change is
needed anywhere else, the base needs a fix; update this spec rather than patching the instance.

## 1. `src/lib/config/school.ts` (the only file that names the client)

```ts
export const school = {
  productName: "Sanad",              // the instance's product name
  productTagline: "Every seat, one system.",
  schoolName: "Rosans Islamic School",
  shortName: "Rosans",
  website: "https://rosansislamicschool.edu.pk",
  locale: { primary: "en", secondary: "ur" },
  branches: [
    { id: "gulberg", name: "Gulberg", city: "Lahore" },
    ...
  ],
  sections: ["Montessori", "Junior", "Senior", "Hifz"],
  board: "Cambridge International (O Level)",
  programmes: { academic: true, hifz: true, tarbiyah: true },
  theme: { accent: "#0F5C46", accentSoft: "#E4F1EB", gold: "#B8892B" },
  logo: "/brand/logo.svg",
};
```

## 2. Brand assets

`public/brand/logo.svg`, `public/brand/mark.svg`, `public/brand/og.png`. Favicon generated from the mark.

## 3. Content catalogues (`src/content/`)

- `syllabus/*.ts` per subject: official codes and topics for the school's board.
- `resources.ts`: genuine links only.
- `quran/*.ts`: only if `programmes.hifz` is true.

## 4. Mock data (demo builds only)

`src/lib/data/mock/*.ts`: people, classes, spaces, records. Names should fit the school's community.

## 5. Copy

`src/content/copy/en.ts`, `ur.ts`. Landing page copy per instance; portal strings shared.

## 6. Feature flags

`programmes.hifz`, `programmes.tarbiyah`, `locale.secondary`. Off means the nav item, routes,
and personas for that programme are not rendered.

## Naming guidance

Pick a word from the school's own tradition that reads well in Latin script and has a clean domain:
Rosans → **Sanad** (chain of transmission). Alternatives kept in reserve: **Rushd** (right guidance),
**Noor** (light), **Irtiqa** (ascent), **Minhaj** (base platform name; avoid reusing for a client).
