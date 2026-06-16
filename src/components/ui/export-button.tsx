import Link from "next/link";
import { Download } from "lucide-react";
import { Button } from "./button";

export function ExportButton({
  href,
  label = "Export CSV",
  variant = "outline",
}: {
  href: string;
  label?: string;
  variant?: "outline" | "default" | "secondary";
}) {
  return (
    <Link href={href} prefetch={false}>
      <Button type="button" variant={variant} size="sm">
        <Download className="h-4 w-4" /> {label}
      </Button>
    </Link>
  );
}
