"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, X, ArrowUp, ArrowDown, Plus, Route as RouteIco, Wrench, Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";

export type LocationPoint = {
  id: string;
  name: string;
  region: string | null;
  latitude: number;
  longitude: number;
  openWorkOrders: number;
  urgentWorkOrders: number;
  pmOverdue: number;
};

export type AssignedJob = {
  id: string;
  title: string;
  priority: string;
  locationId: string;
  locationName: string;
};

type Leg = { from: string; to: string; durationSeconds: number; distanceMeters: number };
type RouteSummary = {
  legs: Leg[];
  totalDurationSeconds: number;
  totalDistanceMeters: number;
  geometry: GeoJSON.LineString | null;
};

const RED = "#E11D2A";
const YELLOW = "#F8C622";
const BLACK = "#0F0F10";
const GRAY = "#94a3b8";

function pinIcon(color: string, label?: string | number) {
  const html = `
    <div style="position:relative;width:32px;height:42px;filter:drop-shadow(0 2px 3px rgba(0,0,0,0.35))">
      <svg viewBox="0 0 32 42" xmlns="http://www.w3.org/2000/svg" width="32" height="42">
        <path d="M16 0C7.2 0 0 7.2 0 16c0 11 16 26 16 26s16-15 16-26C32 7.2 24.8 0 16 0z" fill="${color}" stroke="white" stroke-width="2"/>
        <circle cx="16" cy="16" r="6" fill="white"/>
      </svg>
      ${
        label !== undefined && label !== ""
          ? `<div style="position:absolute;inset:0;display:flex;align-items:flex-start;justify-content:center;padding-top:7px;font:600 11px system-ui;color:${color === YELLOW ? BLACK : BLACK}">${label}</div>`
          : ""
      }
    </div>`;
  return L.divIcon({
    html,
    className: "",
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -36],
  });
}

function fmtDuration(seconds: number) {
  if (!isFinite(seconds) || seconds <= 0) return "—";
  const h = Math.floor(seconds / 3600);
  const m = Math.round((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function fmtDistance(meters: number) {
  if (!isFinite(meters) || meters <= 0) return "—";
  const miles = meters / 1609.344;
  return `${miles.toFixed(1)} mi`;
}

async function fetchRoute(points: LocationPoint[]): Promise<RouteSummary | null> {
  if (points.length < 2) return null;
  const coords = points.map((p) => `${p.longitude},${p.latitude}`).join(";");
  const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson&steps=false`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Routing failed: ${res.status}`);
  const data = await res.json();
  if (!data.routes?.[0]) return null;
  const route = data.routes[0];
  const legs: Leg[] = (route.legs ?? []).map((l: { duration: number; distance: number }, i: number) => ({
    from: points[i].name,
    to: points[i + 1].name,
    durationSeconds: l.duration,
    distanceMeters: l.distance,
  }));
  return {
    legs,
    totalDurationSeconds: route.duration,
    totalDistanceMeters: route.distance,
    geometry: route.geometry,
  };
}

export function RoutePlanner({
  locations,
  todaysJobs,
}: {
  locations: LocationPoint[];
  todaysJobs: AssignedJob[];
}) {
  const mapDivRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const routeLineRef = useRef<L.GeoJSON | null>(null);

  const [stopIds, setStopIds] = useState<string[]>([]);
  const [route, setRoute] = useState<RouteSummary | null>(null);
  const [routing, setRouting] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);

  const locById = useMemo(() => {
    const m = new Map<string, LocationPoint>();
    for (const l of locations) m.set(l.id, l);
    return m;
  }, [locations]);

  const stops = useMemo(
    () => stopIds.map((id) => locById.get(id)).filter((p): p is LocationPoint => !!p),
    [stopIds, locById]
  );

  // Initialize the map once on mount
  useEffect(() => {
    if (!mapDivRef.current || mapRef.current) return;
    const valid = locations.filter((l) => isFinite(l.latitude) && isFinite(l.longitude));
    const center: [number, number] =
      valid.length > 0
        ? [
            valid.reduce((s, l) => s + l.latitude, 0) / valid.length,
            valid.reduce((s, l) => s + l.longitude, 0) / valid.length,
          ]
        : [40.5, -111.9];

    const map = L.map(mapDivRef.current, {
      center,
      zoom: 8,
      scrollWheelZoom: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> · routing &copy; <a href="https://project-osrm.org/">OSRM</a>',
      maxZoom: 19,
    }).addTo(map);

    if (valid.length > 0) {
      map.fitBounds(L.latLngBounds(valid.map((v) => [v.latitude, v.longitude] as [number, number])), {
        padding: [40, 40],
      });
    }

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Redraw markers whenever stops or locations change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    for (const m of markersRef.current) m.remove();
    markersRef.current = [];
    for (const loc of locations) {
      const isStart = stopIds[0] === loc.id;
      const stopIndex = stopIds.indexOf(loc.id);
      const isStop = stopIndex >= 0;
      const color = isStart
        ? BLACK
        : isStop
          ? YELLOW
          : loc.urgentWorkOrders > 0 || loc.pmOverdue > 0
            ? RED
            : GRAY;
      const label = isStop ? stopIndex + 1 : undefined;
      const marker = L.marker([loc.latitude, loc.longitude], { icon: pinIcon(color, label) })
        .addTo(map)
        .bindPopup(
          `<div style="font:14px system-ui;min-width:160px">
            <div style="font-weight:600;margin-bottom:4px">${loc.name}</div>
            <div style="color:#666;font-size:12px;margin-bottom:6px">${loc.region ?? ""}</div>
            <div style="font-size:12px">Open WO: <b>${loc.openWorkOrders}</b>${loc.urgentWorkOrders > 0 ? ` · <span style="color:${RED}">${loc.urgentWorkOrders} urgent</span>` : ""}</div>
            <div style="font-size:12px">PM overdue: <b style="color:${loc.pmOverdue > 0 ? RED : "#111"}">${loc.pmOverdue}</b></div>
            <button data-stop-id="${loc.id}" style="margin-top:8px;background:${RED};color:white;border:none;border-radius:6px;padding:6px 10px;font-size:12px;font-weight:600;cursor:pointer">${isStop ? "Remove from route" : isStart ? "Set as start" : "Add to route"}</button>
          </div>`
        );
      markersRef.current.push(marker);
    }

    const onClick = (e: Event) => {
      const t = e.target as HTMLElement;
      const btn = t.closest("[data-stop-id]") as HTMLElement | null;
      if (!btn) return;
      const id = btn.dataset.stopId;
      if (!id) return;
      setStopIds((prev) =>
        prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
      );
      map.closePopup();
    };
    map.getContainer().addEventListener("click", onClick);
    return () => {
      map.getContainer().removeEventListener("click", onClick);
    };
  }, [locations, stopIds]);

  // Fetch and draw the route whenever stops change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (routeLineRef.current) {
      routeLineRef.current.remove();
      routeLineRef.current = null;
    }
    setRouteError(null);
    if (stops.length < 2) {
      setRoute(null);
      return;
    }
    let cancelled = false;
    setRouting(true);
    fetchRoute(stops)
      .then((r) => {
        if (cancelled) return;
        setRoute(r);
        if (r?.geometry) {
          routeLineRef.current = L.geoJSON(r.geometry, {
            style: { color: RED, weight: 5, opacity: 0.85 },
          }).addTo(map);
          map.fitBounds(routeLineRef.current.getBounds(), { padding: [40, 40] });
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          const message = e instanceof Error ? e.message : "Routing failed";
          setRouteError(message);
        }
      })
      .finally(() => !cancelled && setRouting(false));
    return () => {
      cancelled = true;
    };
  }, [stops]);

  function moveStop(idx: number, dir: -1 | 1) {
    setStopIds((prev) => {
      const next = [...prev];
      const j = idx + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[idx], next[j]] = [next[j], next[idx]];
      return next;
    });
  }

  function removeStop(idx: number) {
    setStopIds((prev) => prev.filter((_, i) => i !== idx));
  }

  function addJobsLocations() {
    const ids = Array.from(new Set(todaysJobs.map((j) => j.locationId)));
    setStopIds((prev) => {
      const next = [...prev];
      for (const id of ids) if (!next.includes(id)) next.push(id);
      return next;
    });
  }

  function clearRoute() {
    setStopIds([]);
  }

  const sortedLocations = useMemo(
    () => [...locations].sort((a, b) => a.name.localeCompare(b.name)),
    [locations]
  );

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
      <div className="card-shell relative overflow-hidden">
        <div ref={mapDivRef} className="h-[520px] w-full rounded-xl lg:h-[680px]" />
      </div>
      <div className="space-y-4">
        <div className="card-shell p-4">
          <div className="mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RouteIco className="h-4 w-4 text-cupbop-red" />
              <span className="text-sm font-semibold">Route Planner</span>
            </div>
            {stops.length > 0 ? (
              <button onClick={clearRoute} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                <Eraser className="h-3.5 w-3.5" /> Clear
              </button>
            ) : null}
          </div>
          <div>
            <label htmlFor="start-location" className="text-xs font-medium text-muted-foreground">
              Start location
            </label>
            <select
              id="start-location"
              value={stopIds[0] ?? ""}
              onChange={(e) => {
                const id = e.target.value;
                setStopIds((prev) => {
                  if (!id) return prev.slice(1);
                  const rest = prev.filter((p) => p !== id).slice(prev[0] ? 1 : 0);
                  return [id, ...rest];
                });
              }}
              className="field-input"
            >
              <option value="">— Pick a start —</option>
              {sortedLocations.map((l) => (
                <option key={l.id} value={l.id}>{l.name}</option>
              ))}
            </select>
          </div>
          {todaysJobs.length > 0 ? (
            <Button
              onClick={addJobsLocations}
              variant="outline"
              size="sm"
              className="mt-3 w-full"
            >
              <Plus className="h-4 w-4" /> Add today&apos;s {todaysJobs.length} job{todaysJobs.length === 1 ? "" : "s"} to route
            </Button>
          ) : null}
          <p className="mt-2 text-[11px] text-muted-foreground">
            Tip: click any pin on the map to add or remove that location.
          </p>
        </div>

        {stops.length === 0 ? (
          <div className="card-shell p-4 text-sm text-muted-foreground">
            Pick a start location and add stops to see drive times.
          </div>
        ) : (
          <div className="card-shell p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm font-semibold">Stops &amp; drive times</div>
              {route ? (
                <div className="text-right text-xs leading-tight">
                  <div className="font-semibold text-foreground">{fmtDuration(route.totalDurationSeconds)}</div>
                  <div className="text-muted-foreground">{fmtDistance(route.totalDistanceMeters)}</div>
                </div>
              ) : routing ? (
                <span className="text-xs text-muted-foreground">Calculating…</span>
              ) : null}
            </div>
            {routeError ? (
              <div className="mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                {routeError}
              </div>
            ) : null}
            <ol className="space-y-1.5">
              {stops.map((s, idx) => {
                const leg = route?.legs[idx - 1];
                return (
                  <li key={s.id}>
                    {idx > 0 && leg ? (
                      <div className="ml-4 my-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                        <div className="h-3 w-px bg-border" />
                        <span>{fmtDuration(leg.durationSeconds)} · {fmtDistance(leg.distanceMeters)}</span>
                      </div>
                    ) : null}
                    <div className="flex items-center gap-2 rounded-md border bg-white p-2 text-sm">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-cupbop-red text-[11px] font-bold text-white">
                        {idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{s.name}</div>
                        <div className="truncate text-[11px] text-muted-foreground">
                          {s.openWorkOrders} open · {s.urgentWorkOrders} urgent · {s.pmOverdue} PM overdue
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5">
                        <button
                          onClick={() => moveStop(idx, -1)}
                          disabled={idx === 0}
                          className="rounded-md p-1 text-muted-foreground hover:bg-secondary disabled:opacity-30"
                          aria-label="Move up"
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => moveStop(idx, 1)}
                          disabled={idx === stops.length - 1}
                          className="rounded-md p-1 text-muted-foreground hover:bg-secondary disabled:opacity-30"
                          aria-label="Move down"
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => removeStop(idx)}
                          className="rounded-md p-1 text-muted-foreground hover:bg-red-50 hover:text-red-600"
                          aria-label="Remove"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        )}

        {todaysJobs.length > 0 ? (
          <div className="card-shell p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
              <Wrench className="h-4 w-4 text-cupbop-red" /> Today&apos;s assigned jobs
            </div>
            <ul className="space-y-1">
              {todaysJobs.slice(0, 12).map((j) => (
                <li
                  key={j.id}
                  className="flex items-center justify-between rounded-md border bg-white px-2.5 py-1.5 text-xs"
                >
                  <span className="truncate">
                    <span className="font-medium">{j.locationName}</span>
                    <span className="ml-2 text-muted-foreground">{j.title}</span>
                  </span>
                  <span
                    className={
                      j.priority === "URGENT"
                        ? "text-red-600"
                        : j.priority === "IMPORTANT"
                          ? "text-amber-600"
                          : "text-muted-foreground"
                    }
                  >
                    {j.priority.charAt(0)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="card-shell p-3 text-[11px] text-muted-foreground">
          <div className="mb-1 flex items-center gap-1.5">
            <MapPin className="h-3 w-3" /> Legend
          </div>
          <div className="flex flex-wrap gap-3">
            <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: BLACK }} /> Start</span>
            <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: YELLOW }} /> Stop</span>
            <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: RED }} /> Has urgent or overdue</span>
            <span className="flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: GRAY }} /> Clear</span>
          </div>
        </div>
      </div>
    </div>
  );
}
