import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams?: { payment?: string };
}

export default async function Page({ params, searchParams }: PageProps) {
  const { id } = await params;
  const resource = await prisma.resource.findUnique({
    where: { id },
    select: { slug: true },
  });

  if (!resource) {
    notFound();
  }

  const payment = searchParams?.payment;
  const query = payment ? `?payment=${encodeURIComponent(payment)}` : "";

  redirect(`/resources/${resource.slug}${query}`);
}

