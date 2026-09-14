import { createFileRoute, Link } from "@tanstack/react-router";
import { GstDocPreview } from "@/modules/compliance/documents/gallery";

export const Route = createFileRoute("/dev/docs/$slug")({ component: DocPreview });

function DocPreview() {
  const { slug } = Route.useParams();
  return (
    <div>
      <div className="no-print px-3 pt-2 text-micro">
        <Link to="/dev/docs" className="text-navy underline">
          All GST documents
        </Link>
      </div>
      <GstDocPreview slug={slug} />
    </div>
  );
}
