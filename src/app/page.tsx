import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ResourceCard, type ResourceCardData } from "@/components/resources/ResourceCard";
import { Badge } from "@/components/ui/Badge";
import { getBaseUrl } from "@/lib/api";
import {
  BookOpen, Zap, Shield, Users, ArrowRight,
  Star, Download, FileText, Check,
} from "lucide-react";

/* ── Data fetching ─────────────────────────────────────────────────────────── */
async function getFeaturedResources(): Promise<ResourceCardData[]> {
  try {
    const res = await fetch(`${getBaseUrl()}/api/resources?pageSize=4`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return PLACEHOLDER_RESOURCES;
    const json = await res.json();
    const items = json.data?.items ?? [];
    return items.length > 0 ? items : PLACEHOLDER_RESOURCES;
  } catch {
    return PLACEHOLDER_RESOURCES;
  }
}

/* ── Static data ───────────────────────────────────────────────────────────── */
const STATS = [
  { value: "2,400+", label: "Resources",   icon: FileText  },
  { value: "18k+",   label: "Students",    icon: Users     },
  { value: "4.9",    label: "Avg. rating", icon: Star      },
  { value: "150+",   label: "Instructors", icon: BookOpen  },
];

const FEATURES = [
  {
    icon: BookOpen,
    title: "Expert-curated content",
    desc: "Every resource is vetted by subject-matter educators before it reaches the library.",
    accent: "bg-blue-500/10 text-blue-600",
    border: "hover:ring-blue-200/50",
  },
  {
    icon: Zap,
    title: "Instant download",
    desc: "Purchase once — access forever. No subscriptions needed for individual resources.",
    accent: "bg-orange-500/10 text-orange-500",
    border: "hover:ring-orange-200/50",
  },
  {
    icon: Shield,
    title: "30-day guarantee",
    desc: "Not what you expected? Get a full refund within 30 days, no questions asked.",
    accent: "bg-violet-500/10 text-violet-600",
    border: "hover:ring-violet-200/50",
  },
  {
    icon: Users,
    title: "Peer-reviewed ratings",
    desc: "Thousands of real student reviews so you know what you're getting.",
    accent: "bg-emerald-500/10 text-emerald-600",
    border: "hover:ring-emerald-200/50",
  },
];

const CATEGORIES = [
  { name: "Mathematics", slug: "mathematics", emoji: "📐", count: 320, color: "from-blue-600 to-blue-800"   },
  { name: "Science",     slug: "science",     emoji: "🔬", count: 215, color: "from-emerald-600 to-teal-800" },
  { name: "Humanities",  slug: "humanities",  emoji: "📚", count: 180, color: "from-violet-600 to-purple-800"},
  { name: "Languages",   slug: "languages",   emoji: "🌐", count: 140, color: "from-orange-600 to-rose-700"  },
];

const SOCIAL_PROOF = [
  { quote: "The algebra worksheets saved my grade. Incredible quality.", name: "Sarah K.", role: "High school junior" },
  { quote: "Best exam prep materials I've found anywhere online.",         name: "James R.", role: "Pre-med student"    },
  { quote: "My students love it. Easy to find, great value.",              name: "Dr. Patel", role: "AP Chemistry teacher"},
];

const PRO_FEATURES = [
  "Unlimited resource downloads",
  "Access to all premium content",
  "New resources every week",
  "Priority support",
];

/* ── Page ──────────────────────────────────────────────────────────────────── */
export default async function HomePage() {
  const featuredResources = await getFeaturedResources();

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50">
      <Navbar />

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* HERO                                                                 */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-zinc-950 px-4 pb-28 pt-24 sm:px-6 lg:px-8">
        {/* Dot grid */}
        <div className="absolute inset-0 bg-dot-dark" />

        {/* Glow orbs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-[15%] top-[-10%] h-[500px] w-[500px] rounded-full
                          bg-blue-600/20 blur-[120px]" />
          <div className="absolute right-[5%] bottom-[-5%] h-[400px] w-[400px] rounded-full
                          bg-violet-600/20 blur-[100px]" />
        </div>

        <div className="relative mx-auto max-w-4xl text-center">
          {/* Eyebrow */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full
                          border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-sm">
            <Star className="h-3.5 w-3.5 fill-orange-400 text-orange-400" />
            <span className="text-[13px] font-medium text-white/70">
              Trusted by 18,000+ students worldwide
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl font-bold tracking-tight text-white text-balance
                         sm:text-6xl lg:text-7xl leading-[1.05]">
            Study smarter with{" "}
            <span className="bg-gradient-to-r from-blue-400 via-violet-400 to-blue-400
                             bg-clip-text text-transparent">
              expert materials
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-zinc-400">
            Thousands of curated worksheets, study guides, and practice sets —
            built by educators, rated by students.
          </p>

          {/* CTA row */}
          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/resources"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3
                         text-[15px] font-semibold text-zinc-900 shadow-lg
                         transition-all duration-150 hover:bg-zinc-100 hover:shadow-xl
                         group"
            >
              Browse Library
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/membership"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10
                         bg-white/5 px-6 py-3 text-[15px] font-semibold text-white
                         backdrop-blur-sm transition-all duration-150
                         hover:border-white/20 hover:bg-white/10"
            >
              View pricing
            </Link>
          </div>

          {/* Stats strip */}
          <div className="mt-20 grid grid-cols-2 gap-8 sm:grid-cols-4">
            {STATS.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.label} className="flex flex-col items-center gap-1">
                  <div className="mb-1 flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 ring-1 ring-white/10">
                    <Icon className="h-4 w-4 text-zinc-400" />
                  </div>
                  <span className="text-2xl font-bold text-white">{s.value}</span>
                  <span className="text-xs text-zinc-500">{s.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* CATEGORIES                                                           */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <section className="bg-white px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <p className="eyebrow">Subjects</p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
              Browse by discipline
            </h2>
            <p className="mt-3 text-base text-zinc-500">
              Explore our growing library across every subject area
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/categories/${cat.slug}`}
                className="group relative overflow-hidden rounded-2xl bg-white
                           ring-1 ring-zinc-200 shadow-card p-6 text-center
                           transition-all duration-200 hover:shadow-card-lg hover:-translate-y-1
                           hover:ring-zinc-300"
              >
                {/* Gradient accent bar at top */}
                <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${cat.color}`} />

                <div className="mt-2 text-4xl">{cat.emoji}</div>
                <p className="mt-3 text-[15px] font-semibold text-zinc-900
                               group-hover:text-blue-700 transition-colors">
                  {cat.name}
                </p>
                <p className="mt-1 text-xs text-zinc-400">{cat.count} resources</p>

                <div className="mt-3 flex items-center justify-center gap-1 text-xs
                                font-medium text-zinc-400 opacity-0 transition-opacity
                                group-hover:opacity-100 group-hover:text-blue-600">
                  Explore <ArrowRight className="h-3 w-3" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* FEATURED RESOURCES                                                   */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <section className="bg-zinc-50 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex items-end justify-between">
            <div>
              <p className="eyebrow">Featured</p>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
                Popular this week
              </h2>
            </div>
            <Link
              href="/resources"
              className="flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white
                         px-3.5 py-2 text-[13px] font-medium text-zinc-600 shadow-card
                         transition-all hover:shadow-card-md hover:text-zinc-900"
            >
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {featuredResources.map((r) => (
              <ResourceCard key={r.id} resource={r} />
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* FEATURES (Why us)                                                    */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <section className="bg-white px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-14 text-center">
            <p className="eyebrow">Why StudyPlatform</p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
              Built for how students actually learn
            </h2>
            <p className="mt-3 text-base text-zinc-500 max-w-lg mx-auto">
              We obsess over quality so every resource you download is worth your time.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className={`card p-6 transition-all duration-200
                              hover:shadow-card-md hover:-translate-y-0.5
                              ring-1 ring-transparent ${f.border}`}
                >
                  <span className={`inline-flex h-10 w-10 items-center justify-center
                                   rounded-xl ${f.accent}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-[15px] font-semibold text-zinc-900">{f.title}</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-zinc-500">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* SOCIAL PROOF                                                         */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <section className="bg-zinc-50 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <p className="eyebrow">Reviews</p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-zinc-900">
              What students say
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            {SOCIAL_PROOF.map((p) => (
              <div key={p.name} className="card p-6">
                {/* Stars */}
                <div className="flex gap-0.5 mb-4">
                  {[1,2,3,4,5].map((i) => (
                    <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-[14px] leading-relaxed text-zinc-700 font-medium">
                  &ldquo;{p.quote}&rdquo;
                </p>
                <div className="mt-4 flex items-center gap-3 border-t border-zinc-100 pt-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full
                                   bg-gradient-to-br from-blue-500 to-violet-500 text-xs font-bold text-white">
                    {p.name[0]}
                  </span>
                  <div>
                    <p className="text-[13px] font-semibold text-zinc-900">{p.name}</p>
                    <p className="text-[11px] text-zinc-400">{p.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* CTA — Pro upgrade                                                    */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden bg-zinc-950 px-4 py-24 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-dot-dark" />
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[400px] w-[600px] -translate-x-1/2
                          rounded-full bg-blue-600/15 blur-[80px]" />
        </div>

        <div className="relative mx-auto max-w-4xl">
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-center">
            {/* Left */}
            <div>
              <p className="eyebrow-dark">Pro plan</p>
              <h2 className="mt-4 text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Unlimited access.<br />
                <span className="bg-gradient-to-r from-blue-400 to-violet-400
                                 bg-clip-text text-transparent">
                  One flat price.
                </span>
              </h2>
              <p className="mt-4 text-base text-zinc-400 leading-relaxed">
                Get unrestricted access to every resource on the platform —
                present and future — for less than a single textbook.
              </p>
              <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                <Link
                  href="/membership"
                  className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5
                             text-[15px] font-semibold text-white shadow-glow-orange
                             transition-all hover:bg-orange-600 group"
                >
                  Start free trial
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href="/resources"
                  className="text-[13px] font-medium text-zinc-500 hover:text-zinc-300 transition-colors"
                >
                  Browse free resources →
                </Link>
              </div>
            </div>

            {/* Right — feature list card */}
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
              <p className="mb-5 text-xs font-semibold uppercase tracking-widest text-zinc-500">
                Everything in Pro
              </p>
              <ul className="space-y-3.5">
                {PRO_FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-3">
                    <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center
                                     rounded-full bg-blue-600/20 ring-1 ring-blue-500/30">
                      <Check className="h-3 w-3 text-blue-400" />
                    </span>
                    <span className="text-sm text-zinc-300">{f}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-6 border-t border-white/10 pt-5">
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-white">$9</span>
                  <span className="text-sm text-zinc-500">/mo billed annually</span>
                </div>
                <p className="mt-1 text-xs text-zinc-500">7-day free trial · Cancel anytime</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

/* ── Placeholder resources ─────────────────────────────────────────────────── */
const PLACEHOLDER_RESOURCES: ResourceCardData[] = [
  { id: "p1", title: "Intro to Algebra Worksheet", slug: "intro-algebra", description: "A beginner-friendly worksheet covering linear equations and basic algebra concepts.", isFree: true, price: 0, downloadCount: 1240, author: { name: "Admin" }, category: { name: "Mathematics", slug: "mathematics" }, tags: [{ tag: { name: "beginner", slug: "beginner" } }], _count: { purchases: 0, reviews: 12 } },
  { id: "p2", title: "AP Chemistry Exam Prep Pack", slug: "ap-chem", description: "Comprehensive exam prep including practice tests and formula sheets.", isFree: false, price: 999, downloadCount: 880, author: { name: "Dr. Chen" }, category: { name: "Science", slug: "science" }, tags: [{ tag: { name: "exam-prep", slug: "exam-prep" } }], _count: { purchases: 88, reviews: 24 } },
  { id: "p3", title: "World History Study Guide: 1900–2000", slug: "world-history", description: "A detailed study guide covering 20th-century events, movements, and key figures.", isFree: false, price: 799, downloadCount: 540, author: { name: "Prof. Williams" }, category: { name: "Humanities", slug: "humanities" }, tags: [{ tag: { name: "intermediate", slug: "intermediate" } }], _count: { purchases: 54, reviews: 9 } },
  { id: "p4", title: "Calculus Quick Reference Sheet", slug: "calculus-ref", description: "A concise cheat sheet covering derivatives, integrals, and key theorems.", isFree: true, price: 0, downloadCount: 3210, author: { name: "Admin" }, category: { name: "Mathematics", slug: "mathematics" }, tags: [{ tag: { name: "advanced", slug: "advanced" } }], _count: { purchases: 0, reviews: 31 } },
];
