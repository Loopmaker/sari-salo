interface FooterCategory {
  id: string;
  name: string;
}

export function StorefrontFooter({
  categories,
  onCategorySelect,
}: {
  categories: FooterCategory[];
  onCategorySelect: (categoryId: string) => void;
}) {
  return (
    <footer className="bg-counter border-t border-counter-line px-6 py-10">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-8">
        <div>
          <div className="font-semibold text-ink text-lg">Sari-Salo</div>
          <p className="text-ink/60 text-sm mt-2 max-w-xs">
            Fresh home-cooked meals, made daily.
          </p>
        </div>

        <div>
          <div className="text-ink/50 text-xs font-medium tracking-wide uppercase mb-3">
            Menu
          </div>
          <ul className="space-y-2">
            {categories.map((cat) => (
              <li key={cat.id}>
                <button
                  onClick={() => onCategorySelect(cat.id)}
                  className="text-ink/70 text-sm hover:text-annatto transition-colors"
                >
                  {cat.name}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="text-ink/50 text-xs font-medium tracking-wide uppercase mb-3">
            About
          </div>
          <p className="text-ink/70 text-sm max-w-xs">
            A neighborhood stall serving home-style Filipino meals, made fresh
            every day.
          </p>
        </div>
      </div>

      <div className="border-t border-counter-line pt-4">
        <p className="text-ink/40 text-xs">
          © {new Date().getFullYear()} Sari-Salo. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
