import { KitchenBoard } from "@/components/kitchen/KitchenBoard";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function KitchenPage() {
  return (
    <ErrorBoundary fallbackMessage="Reload the page to continue viewing orders.">
      <KitchenBoard />
    </ErrorBoundary>
  );
}
