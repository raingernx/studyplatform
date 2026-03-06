import Link from "next/link";
import { BookOpen } from "lucide-react";

const LINKS = {
  Platform: [
    { href: "/resources", label: "Library" },
    { href: "/membership", label: "Membership" },
    { href: "/categories/mathematics", label: "Mathematics" },
    { href: "/categories/science", label: "Science" },
  ],
  Account: [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/login", label: "Sign in" },
    { href: "/register", label: "Sign up" },
  ],
  Company: [
    { href: "#", label: "About" },
    { href: "#", label: "Blog" },
    { href: "#", label: "Privacy" },
    { href: "#", label: "Terms" },
  ],
};

export function Footer() {
  return (
    <footer className="border-t border-zinc-100 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2 font-bold text-zinc-900">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-violet-600 shadow-sm">
                <BookOpen className="h-3.5 w-3.5 text-white" />
              </span>
              StudyPlatform
            </Link>
            <p className="mt-3 max-w-[200px] text-[13px] leading-relaxed text-zinc-500">
              Curated educational resources for every stage of learning.
            </p>
            {/* Social proof micro-badge */}
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1">
              <span className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <svg key={s} className="h-2.5 w-2.5 fill-orange-400 text-orange-400" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </span>
              <span className="text-[11px] font-medium text-zinc-500">18k+ learners</span>
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([group, links]) => (
            <div key={group}>
              <h3 className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                {group}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-[13px] text-zinc-500 transition-colors hover:text-zinc-900"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-zinc-100 pt-6 sm:flex-row">
          <p className="text-[12px] text-zinc-400">
            © {new Date().getFullYear()} StudyPlatform. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link href="#" className="text-[12px] text-zinc-400 hover:text-zinc-600 transition-colors">
              Privacy Policy
            </Link>
            <span className="text-zinc-200">·</span>
            <Link href="#" className="text-[12px] text-zinc-400 hover:text-zinc-600 transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
