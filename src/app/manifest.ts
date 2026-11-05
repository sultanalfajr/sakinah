import type { MetadataRoute } from "next";

/** بيان تثبيت التطبيق — يُخدَم تلقائيًا على /manifest.webmanifest */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "سَكِينَة",
    short_name: "سَكِينَة",
    description:
      "مشاهدٌ صوتية للنوم، قصصٌ تُروى ببطء، القرآن الكريم، ومؤقّتٌ يتلاشى بلطفٍ حتى الصمت.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    dir: "rtl",
    lang: "ar",
    background_color: "#08161c",
    theme_color: "#08161c",
    categories: ["health", "lifestyle", "music"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      {
        src: "/icons/maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
