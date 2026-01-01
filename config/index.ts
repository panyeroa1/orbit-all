import type { Metadata } from "next";

export const siteConfig: Metadata = {
  title: "Eburon",
  description: "Eburon: Real Estate Investment Mentorship & Hands-on Training",
  keywords: [
    "eburon",
    "mentorship",
    "denver",
    "hands-on training",
  ] as Array<string>,
  authors: {
    name: "Eburon",
    url: "https://eburon.ai",
  },
} as const;

export const links = {
  sourceCode: "https://eburon.ai",
} as const;
