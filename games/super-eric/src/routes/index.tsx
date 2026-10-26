import { createFileRoute } from "@tanstack/react-router";
import { SuperEric } from "@/components/super-eric";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <SuperEric />;
}
