/**
 * THE white-label file. Everything that names the client lives here.
 * See general-spec/09-white-label-guide.md.
 */
export type BranchId = "gulberg" | "lakecity" | "paragon";

export const school = {
  productName: "Sanad",
  productTagline: "Every seat, one system.",
  productMeaning: "Sanad (سند): the unbroken chain through which the Quran and knowledge are passed from teacher to student.",
  schoolName: "Rosans Islamic School",
  shortName: "Rosans",
  website: "https://rosansislamicschool.edu.pk",
  motto: "Incorporating the highest level of modern education with Islamic values",
  founded: 1996,
  city: "Lahore",
  locale: { primary: "en", secondary: "ur" } as const,
  branches: [
    { id: "gulberg" as BranchId, name: "Gulberg", address: "4 Canal Park, Rana Shaukat Mehmood Road, Gulberg 2", city: "Lahore" },
    { id: "lakecity" as BranchId, name: "Lake City", address: "5B-5C Public Building, Lake City", city: "Lahore" },
    { id: "paragon" as BranchId, name: "Paragon City", address: "65 Office Block, Main Paragon City Boulevard", city: "Lahore" },
  ],
  sections: ["Montessori", "Junior", "Senior", "Hifz"] as const,
  board: "Cambridge International (O Level)",
  programmes: { academic: true, hifz: true, tarbiyah: true },
  theme: { accent: "#0F5C46", accentSoft: "#E4F1EB", gold: "#B8892B" },
  contact: { phone: "+92 328 122 3957", email: "admin@rosansislamicschool.edu.pk" },
  vendor: { name: "EduSoft", platform: "Minhaj" },
} as const;

export type School = typeof school;

export function branchName(id: BranchId): string {
  return school.branches.find((b) => b.id === id)?.name ?? id;
}
