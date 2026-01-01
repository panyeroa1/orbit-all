import type { Metadata } from "next";

export const siteConfig: Metadata = {
  title: "Success Class",
  description: "Success Class: Real Estate Investment Mentorship & Hands-on Training",
  keywords: [
    "success class",
    "mentorship",
    "denver",
    "hands-on training",
  ] as Array<string>,
  authors: {
    name: "Success Class",
    url: "https://eburon.ai",
  },
} as const;

export const links = {
  sourceCode: "https://eburon.ai",
} as const;
