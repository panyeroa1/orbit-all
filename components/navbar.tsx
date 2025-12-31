import { SignedIn, UserButton } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";

import { links } from "@/config";

import { MobileNav } from "./mobile-nav";

export const Navbar = () => {
  return (
    <nav className="flex-between fixed z-50 w-full border-b border-white/5 bg-black/70 px-6 py-4 backdrop-blur-lg lg:px-10">
      <Link href="/" className="flex items-center gap-1">
        <Image
          src="/images/logo.png"
          alt="Orbit logo"
          width={32}
          height={32}
          className="max-sm:size-10"
        />

        <p className="text-[26px] font-extrabold tracking-wide text-white max-sm:hidden">
          Orbit
        </p>
      </Link>

      <div className="flex-between gap-5">
        <SignedIn>
          <UserButton afterSignOutUrl="/sign-in" />
        </SignedIn>

        <Link
          href={links.sourceCode}
          target="_blank"
          rel="noreferrer noopener"
          title="Source Code"
        >
          <Image src="/icons/github.svg" alt="GitHub" height={80} width={80} />
        </Link>

        <MobileNav />
      </div>
    </nav>
  );
};
