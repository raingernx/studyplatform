"use client";

interface ScrollableCategoryNavProps {
  children: React.ReactNode;
}

export function ScrollableCategoryNav({ children }: ScrollableCategoryNavProps) {
  return (
    <div className="flex min-w-0 flex-1 items-center">
      <div
        className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto overflow-y-hidden scroll-smooth whitespace-nowrap pr-3 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
    </div>
  );
}
