import type { MetadataRoute } from "next";
import { school } from "@/lib/config/school";

/** Installable web app shell. The portal is the start screen; branding comes from the white-label file. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${school.productName} · ${school.schoolName}`,
    short_name: school.productName,
    description: `${school.productName}: the school operating system for ${school.schoolName}. ${school.productTagline}`,
    start_url: "/portal",
    display: "standalone",
    background_color: "#F6F7F4",
    theme_color: school.theme.accent,
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
