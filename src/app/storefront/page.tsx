import { StorefrontClient } from "@/components/storefront/StorefrontClient";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function StorefrontPage() {
  return (
    <ErrorBoundary fallbackMessage="Reload the page to continue browsing the menu.">
      <StorefrontClient />
    </ErrorBoundary>
  );
}
