import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/Card";

const MOCK_POSTS = [
  { slug: "study-tips-exams", title: "5 study tips for exam season", excerpt: "Simple strategies to stay focused and retain more." },
  { slug: "flashcards-that-stick", title: "Flashcards that stick", excerpt: "How to build decks that actually help you remember." },
  { slug: "worksheets-for-teachers", title: "Worksheets that work", excerpt: "Design printables your students will love." },
  { slug: "selling-resources-online", title: "Selling resources online", excerpt: "A quick guide for educators and creators." },
];

export function BlogSection() {
  return (
    <section className="space-y-6 py-12">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold text-text-primary">Tips, Tricks, and Trends</h2>
        <Link
          href="/blog"
          className="flex items-center gap-1 text-[13px] font-medium text-brand-600 transition hover:text-brand-700"
        >
          View all
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {MOCK_POSTS.map((post) => (
          <Link key={post.slug} href={`/blog/${post.slug}`}>
            <Card className="h-full transition-shadow hover:shadow-card-md">
              <div className="p-4">
                <h3 className="font-semibold text-text-primary">{post.title}</h3>
                <p className="mt-1 text-[13px] text-text-secondary">{post.excerpt}</p>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
