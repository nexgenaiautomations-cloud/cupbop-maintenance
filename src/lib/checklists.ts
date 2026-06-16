export const CATEGORY_CHECKLISTS: Record<string, string[]> = {
  "HVAC / Hood Systems / Filter Change": [
    "Replace/clean filters",
    "Verify airflow",
    "Check belt tension",
    "Inspect rooftop units",
    "Check hood system",
    "Note filter sizes",
  ],
  "Ice Machines": [
    "Clean and sanitize bin",
    "Run descaling cycle",
    "Clean condenser",
    "Replace water filter",
    "Inspect inlet valve",
    "Test float switch",
    "Verify airflow",
  ],
  "Hot Water Heater": [
    "Flush tank",
    "Inspect anode rod",
    "Test relief valve",
    "Inspect burners/elements",
    "Check recirculation pump",
    "Verify temperature",
  ],
  "Water Boiler": [
    "Descale",
    "Sanitize",
    "Drain",
    "Verify temperature",
    "Inspect spout/nozzle",
    "Check leaks",
  ],
  "Refrigerators / Freezers": [
    "Clean condenser coils",
    "Inspect inlet valve",
    "Lubricate hinges",
    "Clear drain line",
    "Verify temps",
    "Check fans",
    "Clean compressor area",
  ],
  "Plumbing": [
    "Clear drains",
    "Inspect sprayers",
    "Tighten connections",
    "Check grease trap",
    "Verify drain flow",
    "Inspect booster heater",
  ],
  "Electrical": [
    "Test GFI outlets",
    "Label panels",
    "Inspect cords/plugs",
    "Verify circuits",
  ],
};

export function getChecklistFor(categoryName: string): string[] {
  return CATEGORY_CHECKLISTS[categoryName] ?? [];
}
