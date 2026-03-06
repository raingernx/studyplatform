"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ShoppingCart, Download, Lock } from "lucide-react";
import { formatPrice } from "@/lib/utils";

interface BuyButtonProps {
  resourceId: string;
  price: number;
  isFree: boolean;
  owned: boolean;
  fileUrl?: string | null;
}

export function BuyButton({ resourceId, price, isFree, owned, fileUrl }: BuyButtonProps) {
  const [loading, setLoading] = useState(false);
  const { data: session } = useSession();
  const router = useRouter();

  // Already owned or free → show download
  if (owned || isFree) {
    return fileUrl ? (
      <a href={fileUrl} download target="_blank" rel="noopener noreferrer">
        <Button variant="primary" size="lg" fullWidth className="gap-2">
          <Download className="h-4 w-4" />
          Download resource
        </Button>
      </a>
    ) : (
      <Button variant="primary" size="lg" fullWidth disabled className="gap-2">
        <Download className="h-4 w-4" />
        {isFree ? "Free resource" : "Already owned"}
      </Button>
    );
  }

  async function handlePurchase() {
    if (!session?.user) {
      router.push(`/login?next=/resources/${resourceId}`);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: "payment", resourceId }),
      });
      const json = await res.json();
      if (json.data?.url) {
        window.location.href = json.data.url;
      } else {
        alert(json.error ?? "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <Button
        onClick={handlePurchase}
        loading={loading}
        variant="accent"
        size="lg"
        fullWidth
        className="gap-2 shadow-md"
      >
        <ShoppingCart className="h-4 w-4" />
        Buy for {formatPrice(price)}
      </Button>
      <p className="flex items-center justify-center gap-1.5 text-xs text-gray-400">
        <Lock className="h-3 w-3" /> Secure checkout via Stripe · 30-day refund
      </p>
    </div>
  );
}
