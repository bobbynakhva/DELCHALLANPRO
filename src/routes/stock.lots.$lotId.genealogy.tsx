import { createFileRoute } from "@tanstack/react-router";
import { GenealogyView } from "./genealogy.$lotId";

export const Route = createFileRoute("/stock/lots/$lotId/genealogy")({
  component: StockGenePage,
});

function StockGenePage() {
  const { lotId } = Route.useParams();
  return <GenealogyView lotId={lotId} />;
}
