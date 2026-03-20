import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card } from "@/design-system";

const MOCK_POSTS = [
  { slug: "study-tips-exams", title: "5 study tips for exam season", excerpt: "Simple strategies to stay focused and retain more." },
  { slug: "flashcards-that-stick", title: "Flashcards that stick", excerpt: "How to build decks that actually help you remember." },
  { slug: "worksheets-for-teachers", title: "Worksheets that work", excerpt: "Design printables your students will love." },
  { slug: "selling-resources-online", title: "Selling resources online", excerpt: "A quick guide for educators and creators." },
];

export function BlogSection() {
  return (
    <section className="space-y-6 rounded-[32px] border border-surface-200 bg-white p-6 shadow-card sm:p-7 lg:p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-muted">
            Editorial picks
          </p>
          <h2 className="font-display text-xl font-semibold text-text-primary">Tips, Tricks, and Trends</h2>
          <p className="max-w-2xl text-sm leading-6 text-text-secondary">
            Fresh advice for studying smarter, building better resources, and making the most of the marketplace.
          </p>
        </div>
        <Link
          href="/blog"
          className="flex items-center gap-1 text-[13px] font-medium text-brand-600 transition hover:text-brand-700"
        >
          <span className="inline-flex items-center gap-1">
            <span>View all</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {MOCK_POSTS.map((post) => (
          <Link key={post.slug} href={`/blog/${post.slug}`}>
            <Card className="h-full rounded-2xl border border-surface-200 transition duration-200 hover:-translate-y-1 hover:shadow-card-lg">
              <div className="p-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-text-muted">
                  Insight
                </p>
                <h3 className="mt-3 font-semibold text-text-primary">{post.title}</h3>
                <p className="mt-2 text-[13px] leading-6 text-text-secondary">{post.excerpt}</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
