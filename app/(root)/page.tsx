"use client";

import { useAuth } from "@clerk/nextjs";
import { MoveRight, Star, Users, Building, GraduationCap } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/navbar";

export default function LandingPage() {
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && isSignedIn) {
      router.push("/home");
    }
  }, [mounted, isSignedIn, router]);

  if (!mounted || isSignedIn) return null;

  return (
    <div className="min-h-screen bg-black text-white font-[Roboto,sans-serif]">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 lg:px-10 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full pointer-events-none opacity-20">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600 rounded-full blur-[120px] animate-pulse" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600 rounded-full blur-[120px] animate-pulse delay-700" />
        </div>

        <div className="relative max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
          <div className="flex-1 text-center lg:text-left space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-purple-400 text-sm font-medium animate-fade-in">
              <Star className="size-4 fill-purple-400" />
              <span>Denver&apos;s Premier Real Estate Training</span>
            </div>
            
            <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.1]">
              Master Real Estate <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-blue-400 to-emerald-400">
                Success Class
              </span>
            </h1>

            <p className="text-lg text-zinc-400 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Join our 12-month hands-on mentorship program. We teach you how to <span className="text-white font-semibold">Find, Fund, Fix, and Flip</span> properties for maximum profit. No fluff, just real rehab projects.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
              <Link
                href="/sign-in"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 font-bold text-lg transition-all shadow-xl shadow-purple-500/20 active:scale-[0.98]"
              >
                Get Started
              </Link>
              <Link
                href="#how-it-works"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 font-bold transition-all flex items-center justify-center gap-2"
              >
                Learn More <MoveRight className="size-5" />
              </Link>
            </div>
            
            <div className="flex items-center justify-center lg:justify-start gap-6 pt-8 text-sm text-zinc-500 font-medium">
               <div className="flex items-center gap-2">
                 <Users className="size-5 text-emerald-400" />
                 <span>500+ Mentored Students</span>
               </div>
               <div className="flex items-center gap-2">
                 <Building className="size-5 text-blue-400" />
                 <span>$50M+ in Closed Deals</span>
               </div>
            </div>
          </div>

          <div className="flex-1 relative animate-float">
            <div className="relative rounded-3xl border border-white/10 bg-zinc-900/50 p-4 backdrop-blur-xl shadow-2xl overflow-hidden group">
               <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-blue-500/10 pointer-events-none" />
               <Image 
                  src="https://invest-success.com/wp-content/uploads/2021/03/mentorship-photo.jpg" 
                  alt="Students at rehab site" 
                  width={600} 
                  height={800}
                  className="rounded-2xl object-cover aspect-[4/5] grayscale hover:grayscale-0 transition-all duration-700"
               />
               <div className="absolute bottom-10 left-10 p-6 rounded-2xl bg-black/80 border border-white/10 backdrop-blur-lg max-w-[280px]">
                  <p className="text-sm font-bold text-purple-400 uppercase tracking-widest mb-2">Live Session</p>
                  <p className="text-lg font-bold text-white">Project: Lakewood Duplex Flip #14</p>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section className="py-24 px-6 lg:px-10 bg-zinc-950/50" id="how-it-works">
         <div className="max-w-7xl mx-auto space-y-16">
            <div className="text-center space-y-4">
               <h2 className="text-4xl font-bold tracking-tight">How we build <span className="text-purple-400">Success Class</span></h2>
               <p className="text-zinc-400 max-w-2xl mx-auto">Unlike other &quot;seminars&quot;, we take you into the field. You learn by doing on actual investment properties.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
               {[
                 { 
                   icon: GraduationCap, 
                   title: "12-Month Mentorship", 
                   desc: "Continuous training and support while you find and close your first investment deals.",
                   color: "from-purple-500/20 to-purple-500/5",
                   iconColor: "text-purple-400"
                 },
                 { 
                   icon: Building, 
                   title: "Rehab Site Tours", 
                   desc: "Bi-weekly house tours to learn estimating, scopes of work, and contractor management.",
                   color: "from-blue-500/20 to-blue-500/5",
                   iconColor: "text-blue-400"
                 },
                 { 
                   icon: Star, 
                   title: "Exclusive Tools", 
                   desc: "Access our proprietary 'Deal or No Deal' calculator and industry-tested legal contracts.",
                   color: "from-emerald-500/20 to-emerald-400/5",
                   iconColor: "text-emerald-400"
                 }
               ].map((feature, i) => (
                 <div key={i} className={`p-8 rounded-3xl border border-white/10 bg-gradient-to-br ${feature.color} backdrop-blur-sm hover:border-white/20 transition-all group lg:hover:-translate-y-2 cursor-default`}>
                    <feature.icon className={`size-12 ${feature.iconColor} mb-6 group-hover:scale-110 transition-transform`} />
                    <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                    <p className="text-zinc-500 leading-relaxed text-sm">{feature.desc}</p>
                 </div>
               ))}
            </div>
         </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 lg:px-10 border-t border-white/5 text-center">
         <div className="max-w-7xl mx-auto flex flex-col items-center gap-6">
            <Image
              src="https://assets.cdn.filesafe.space/CIoDjNuoDah4NuMMfWMQ/media/643b5be449341f3eb47abe34.png"
              alt="Success Class Logo"
              width={40}
              height={40}
              className="object-contain opacity-50"
            />
            <p className="text-zinc-500 text-sm italic">
               &copy; 2026 Success Class. All rights reserved. <br />
               Tailored Real Estate Mentorship based in Denver, CO.
            </p>
         </div>
      </footer>
    </div>
  );
}
