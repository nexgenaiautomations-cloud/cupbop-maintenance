"use client";

import dynamic from "next/dynamic";
import type { AssignedJob, LocationPoint } from "./route-planner";

const RoutePlanner = dynamic(
  () => import("./route-planner").then((m) => m.RoutePlanner),
  { ssr: false, loading: () => <div className="card-shell h-[680px] animate-pulse" /> }
);

export function ClientRoutePlanner(props: { locations: LocationPoint[]; todaysJobs: AssignedJob[] }) {
  return <RoutePlanner {...props} />;
}
