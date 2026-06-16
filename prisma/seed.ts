import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const LOCATIONS = [
  "Provo", "Daybreak", "Draper", "American Fork", "Murray", "Midvale",
  "Downtown", "West Valley", "Orem", "Layton", "Park City", "Tooele",
  "Washington", "Fort Union", "Hunter", "Ogden", "Logan", "Saratoga Springs",
  "Millcreek", "Herriman", "Lehi", "Foothills", "Roy", "Cedar Hills",
  "Salt Lake City", "Cedar City", "Hill AFB", "Spanish Fork", "Bountiful",
  "Huachuca Army Base",
];

const REGIONS: Record<string, string> = {
  "Provo": "Utah County",
  "Orem": "Utah County",
  "American Fork": "Utah County",
  "Lehi": "Utah County",
  "Spanish Fork": "Utah County",
  "Saratoga Springs": "Utah County",
  "Cedar Hills": "Utah County",
  "Salt Lake City": "Salt Lake County",
  "Downtown": "Salt Lake County",
  "Murray": "Salt Lake County",
  "Midvale": "Salt Lake County",
  "Draper": "Salt Lake County",
  "West Valley": "Salt Lake County",
  "Daybreak": "Salt Lake County",
  "Hunter": "Salt Lake County",
  "Foothills": "Salt Lake County",
  "Fort Union": "Salt Lake County",
  "Herriman": "Salt Lake County",
  "Millcreek": "Salt Lake County",
  "Tooele": "Tooele County",
  "Layton": "Davis County",
  "Bountiful": "Davis County",
  "Hill AFB": "Davis County",
  "Roy": "Weber County",
  "Ogden": "Weber County",
  "Logan": "Cache County",
  "Park City": "Summit County",
  "Washington": "Washington County",
  "Cedar City": "Iron County",
  "Huachuca Army Base": "Arizona",
};

const TECHNICIANS = [
  { name: "Rodney", phone: "801-555-0101", email: "rodney@cupbopmaintenance.com" },
  { name: "Hyeong", phone: "801-555-0102", email: "hyeong@cupbopmaintenance.com" },
  { name: "Roger", phone: "801-555-0103", email: "roger@cupbopmaintenance.com" },
  { name: "Technician", phone: null, email: null },
  { name: "Sign Co", phone: "801-555-0201", email: "vendor@signco.com" },
  { name: "Landlord", phone: null, email: null },
  { name: "Gina", phone: "801-555-0104", email: "gina@cupbopmaintenance.com" },
  { name: "Bookie", phone: "801-555-0105", email: "bookie@cupbopmaintenance.com" },
];

const CATEGORIES = [
  { name: "Hot Water Heater", defaultFrequencyMonths: 6, description: "Tank flush, anode rod, relief valve inspection" },
  { name: "HVAC / Hood Systems / Filter Change", defaultFrequencyMonths: 3, description: "Filters, airflow, belt tension, rooftop units, hood" },
  { name: "Ice Machines", defaultFrequencyMonths: 3, description: "Sanitize bin, descale, condenser, water filter" },
  { name: "Refrigerators / Freezers", defaultFrequencyMonths: 3, description: "Condenser coils, fans, temps, drain lines" },
  { name: "Plumbing", defaultFrequencyMonths: 3, description: "Drains, sprayers, connections, grease trap" },
  { name: "Electrical", defaultFrequencyMonths: 3, description: "GFI outlets, panel labels, cords, circuits" },
  { name: "Water Boiler", defaultFrequencyMonths: 6, description: "Descale, sanitize, temp verification, leaks" },
];

const WORK_ORDER_SAMPLES: Array<{
  location: string;
  title: string;
  description: string;
  priority: "URGENT" | "IMPORTANT" | "SUBORDINATE";
  status: "NEW" | "ASSIGNED" | "ORDERED" | "SCHEDULED" | "IN_PROGRESS" | "WAITING_ON_VENDOR" | "COMPLETE";
  daysAgo: number;
  dueInDays?: number;
  completedDaysAgo?: number;
  technician?: string;
  category?: string;
}> = [
  { location: "Provo", title: "Kitchen floor grout chipping", description: "Several tiles near the fryer line have chipped grout creating tripping hazards.", priority: "IMPORTANT", status: "IN_PROGRESS", daysAgo: 6, dueInDays: 7, technician: "Rodney", category: "Building/Signage" },
  { location: "Daybreak", title: "Water softener not working", description: "Salt level not dropping; water testing hard. Possible motor issue.", priority: "URGENT", status: "WAITING_ON_VENDOR", daysAgo: 4, dueInDays: 2, technician: "Hyeong", category: "Plumbing" },
  { location: "Draper", title: "Ice machine not working", description: "Manitowoc unit producing no ice for 36 hours. Sourcing replacement evaporator.", priority: "URGENT", status: "ORDERED", daysAgo: 3, dueInDays: 1, technician: "Roger", category: "Ice Machine" },
  { location: "American Fork", title: "Hot water not working in 3 comp sink", description: "Hot side handle spins freely; no hot water reaching basin.", priority: "URGENT", status: "ASSIGNED", daysAgo: 2, dueInDays: 1, technician: "Rodney", category: "Plumbing" },
  { location: "Murray", title: "Fryer not lighting", description: "Pilot ignites then drops out. Possibly thermocouple failure.", priority: "URGENT", status: "IN_PROGRESS", daysAgo: 1, dueInDays: 1, technician: "Roger", category: "Equipment" },
  { location: "Midvale", title: "Freezer not holding temperature", description: "Walk-in freezer reading 12°F overnight, alarms triggered twice.", priority: "URGENT", status: "ASSIGNED", daysAgo: 1, dueInDays: 1, technician: "Hyeong", category: "Refrigerator/Freezer" },
  { location: "Downtown", title: "Sink leaking under prep table", description: "Pooling water from p-trap.", priority: "IMPORTANT", status: "ASSIGNED", daysAgo: 5, dueInDays: 5, technician: "Rodney", category: "Plumbing" },
  { location: "West Valley", title: "Hood vent needs caulk", description: "Gap between hood and ceiling allowing grease drips on cook line.", priority: "SUBORDINATE", status: "SCHEDULED", daysAgo: 9, dueInDays: 14, technician: "Technician", category: "HVAC/Hood" },
  { location: "Orem", title: "Camera quality needs checking", description: "Lobby camera image grainy at night, possible focus drift.", priority: "SUBORDINATE", status: "NEW", daysAgo: 2, category: "Building/Signage" },
  { location: "Layton", title: "Sign peeling on storefront", description: "Top left corner of front wall sign lifting from substrate.", priority: "IMPORTANT", status: "ORDERED", daysAgo: 12, dueInDays: 14, technician: "Sign Co", category: "Building/Signage" },
  { location: "Park City", title: "Ceiling vents need cleaned", description: "Dust accumulation visible from dining room.", priority: "SUBORDINATE", status: "NEW", daysAgo: 1, category: "HVAC/Hood" },
  { location: "Tooele", title: "Water boiler leaking", description: "Bunn tea boiler dripping at relief valve.", priority: "IMPORTANT", status: "ASSIGNED", daysAgo: 3, dueInDays: 4, technician: "Hyeong", category: "Water Heater/Boiler" },
  { location: "Washington", title: "Lobby walls need repainting", description: "Scuffs and chair-rail damage along east wall.", priority: "SUBORDINATE", status: "SCHEDULED", daysAgo: 30, dueInDays: 30, technician: "Landlord", category: "Building/Signage" },
  { location: "Fort Union", title: "Restroom sink loose", description: "Lavatory pulling away from wall, anchor failing.", priority: "IMPORTANT", status: "ASSIGNED", daysAgo: 2, dueInDays: 3, technician: "Rodney", category: "Plumbing" },
  { location: "Hunter", title: "Soda machine leaking", description: "Bib syrup line drip behind machine.", priority: "IMPORTANT", status: "IN_PROGRESS", daysAgo: 1, dueInDays: 2, technician: "Roger", category: "Equipment" },
  { location: "Ogden", title: "Walk-in cooler door gasket torn", description: "Cold air loss; gasket has 4 inch tear at bottom.", priority: "IMPORTANT", status: "ORDERED", daysAgo: 4, dueInDays: 7, technician: "Hyeong", category: "Refrigerator/Freezer" },
  { location: "Logan", title: "POS receipt printer jammed", description: "Front counter printer continually paper jams.", priority: "SUBORDINATE", status: "ASSIGNED", daysAgo: 1, dueInDays: 5, technician: "Bookie", category: "Equipment" },
  { location: "Saratoga Springs", title: "Drive thru sign light out", description: "Half of menu board LED panel dark.", priority: "IMPORTANT", status: "ORDERED", daysAgo: 6, dueInDays: 10, technician: "Sign Co", category: "Building/Signage" },
];

const COMPLETED_WO_SAMPLES: Array<{ location: string; title: string; priority: "URGENT" | "IMPORTANT" | "SUBORDINATE"; completedDaysAgo: number; technician: string; category: string }> = [
  { location: "Provo", title: "Walk-in light replacement", priority: "SUBORDINATE", completedDaysAgo: 3, technician: "Rodney", category: "Electrical" },
  { location: "Draper", title: "Replaced ice machine water filter", priority: "IMPORTANT", completedDaysAgo: 5, technician: "Roger", category: "Ice Machine" },
  { location: "Murray", title: "Sanitized hood system", priority: "IMPORTANT", completedDaysAgo: 10, technician: "Hyeong", category: "HVAC/Hood" },
  { location: "Layton", title: "Patched dining room ceiling tile", priority: "SUBORDINATE", completedDaysAgo: 12, technician: "Rodney", category: "Building/Signage" },
  { location: "Downtown", title: "Faucet cartridge replacement", priority: "IMPORTANT", completedDaysAgo: 18, technician: "Rodney", category: "Plumbing" },
  { location: "Logan", title: "Drain line snaked", priority: "URGENT", completedDaysAgo: 22, technician: "Hyeong", category: "Plumbing" },
  { location: "Orem", title: "Reset breaker on freezer circuit", priority: "URGENT", completedDaysAgo: 30, technician: "Roger", category: "Electrical" },
  { location: "Ogden", title: "Water heater pilot relight", priority: "IMPORTANT", completedDaysAgo: 38, technician: "Hyeong", category: "Water Heater/Boiler" },
  { location: "Tooele", title: "POS network cable replaced", priority: "IMPORTANT", completedDaysAgo: 45, technician: "Bookie", category: "Equipment" },
  { location: "Park City", title: "Salt run for water softener", priority: "SUBORDINATE", completedDaysAgo: 55, technician: "Rodney", category: "Plumbing" },
  { location: "Lehi", title: "Hood filter swap", priority: "IMPORTANT", completedDaysAgo: 70, technician: "Hyeong", category: "HVAC/Hood" },
  { location: "Cedar Hills", title: "Replaced GFI in mop sink", priority: "URGENT", completedDaysAgo: 85, technician: "Rodney", category: "Electrical" },
  { location: "Roy", title: "Reglued lobby tile", priority: "SUBORDINATE", completedDaysAgo: 100, technician: "Rodney", category: "Building/Signage" },
  { location: "Bountiful", title: "Fryer thermocouple replaced", priority: "URGENT", completedDaysAgo: 120, technician: "Roger", category: "Equipment" },
  { location: "Spanish Fork", title: "Ice machine deep clean", priority: "IMPORTANT", completedDaysAgo: 140, technician: "Hyeong", category: "Ice Machine" },
  { location: "Foothills", title: "Caulked back splash", priority: "SUBORDINATE", completedDaysAgo: 150, technician: "Technician", category: "Plumbing" },
];

function daysAgoDate(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(10, 0, 0, 0);
  return d;
}

function daysFromNowDate(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(10, 0, 0, 0);
  return d;
}

function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function computeStatus(nextServiceDate: Date | null, lastServiceDate: Date | null): string {
  if (!lastServiceDate && !nextServiceDate) return "NOT_STARTED";
  if (!nextServiceDate) return "NOT_STARTED";
  const now = new Date();
  const diffDays = Math.ceil((nextServiceDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return "OVERDUE";
  if (diffDays <= 14) return "DUE_SOON";
  return "UPCOMING";
}

async function main() {
  console.log("Resetting maintenance database...");

  // Clean in dependency order
  await prisma.workOrderComment.deleteMany();
  await prisma.workOrder.deleteMany();
  await prisma.preventiveTaskCompletion.deleteMany();
  await prisma.preventiveTask.deleteMany();
  await prisma.maintenanceCategory.deleteMany();
  await prisma.user.deleteMany();
  await prisma.technician.deleteMany();
  await prisma.location.deleteMany();
  await prisma.vendor.deleteMany();

  console.log("Creating locations...");
  const locations = await Promise.all(
    LOCATIONS.map((name) =>
      prisma.location.create({
        data: {
          name,
          region: REGIONS[name] ?? "Other",
          city: name,
          state: name === "Huachuca Army Base" ? "AZ" : "UT",
          status: "ACTIVE",
          managerName: `${name} Manager`,
          managerEmail: `${name.toLowerCase().replace(/\s+/g, "")}@cupbopmaintenance.com`,
          managerPhone: "801-555-0000",
        },
      })
    )
  );
  const locByName: Record<string, (typeof locations)[number]> = {};
  for (const l of locations) locByName[l.name] = l;

  console.log("Creating technicians...");
  const techs = await Promise.all(
    TECHNICIANS.map((t) =>
      prisma.technician.create({
        data: { name: t.name, email: t.email, phone: t.phone, active: true },
      })
    )
  );
  const techByName: Record<string, (typeof techs)[number]> = {};
  for (const t of techs) techByName[t.name] = t;

  console.log("Creating categories...");
  const cats = await Promise.all(
    CATEGORIES.map((c) =>
      prisma.maintenanceCategory.create({
        data: {
          name: c.name,
          defaultFrequencyMonths: c.defaultFrequencyMonths,
          description: c.description,
          active: true,
        },
      })
    )
  );
  const catByName: Record<string, (typeof cats)[number]> = {};
  for (const c of cats) catByName[c.name] = c;

  console.log("Creating users (demo accounts)...");
  const adminUser = await prisma.user.create({
    data: {
      name: "Admin",
      email: "admin@cupbopmaintenance.com",
      role: "ADMIN",
    },
  });
  await prisma.user.create({
    data: {
      name: "Rodney (Technician)",
      email: "technician@cupbopmaintenance.com",
      role: "TECHNICIAN",
      technicianId: techByName["Rodney"].id,
    },
  });
  await prisma.user.create({
    data: {
      name: "Provo Manager",
      email: "provo@cupbopmaintenance.com",
      role: "LOCATION_MANAGER",
      locationId: locByName["Provo"].id,
    },
  });
  // Convenience location managers for all locations
  await Promise.all(
    locations
      .filter((l) => l.name !== "Provo")
      .map((l) =>
        prisma.user.create({
          data: {
            name: `${l.name} Manager`,
            email: `${l.name.toLowerCase().replace(/\s+/g, "")}@cupbopmaintenance.com`,
            role: "LOCATION_MANAGER",
            locationId: l.id,
          },
        })
      )
  );

  console.log("Creating preventive tasks (recurring per location/category)...");
  const allPmTasks: Array<{ id: string; locationId: string; categoryId: string; frequencyMonths: number }> = [];

  for (const location of locations) {
    for (const cat of cats) {
      const variance = Math.floor(Math.random() * 6) - 2; // -2..+3
      const lastDaysAgo = cat.defaultFrequencyMonths * 30 - 14 + variance * 10;
      const last = lastDaysAgo > 0 ? daysAgoDate(lastDaysAgo) : null;
      const next = last ? addMonths(last, cat.defaultFrequencyMonths) : daysFromNowDate(10 + variance * 5);
      const status = computeStatus(next, last);

      const assignedTechName = ["Rodney", "Hyeong", "Roger"][Math.floor(Math.random() * 3)];

      const task = await prisma.preventiveTask.create({
        data: {
          locationId: location.id,
          categoryId: cat.id,
          taskName: `${cat.name} — ${location.name}`,
          description: cat.description ?? null,
          frequencyMonths: cat.defaultFrequencyMonths,
          lastServiceDate: last,
          nextServiceDate: next,
          assignedTechnicianId: techByName[assignedTechName].id,
          status,
        },
      });
      allPmTasks.push({
        id: task.id,
        locationId: location.id,
        categoryId: cat.id,
        frequencyMonths: cat.defaultFrequencyMonths,
      });
    }
  }

  console.log("Creating historical PM completions (Jan–June 2026 spread)...");
  // Distribute completions across the past 180 days
  const completionDistribution = [5, 8, 12, 14, 11, 17, 15, 9, 13, 18, 10, 22, 19, 16, 14, 21, 12, 8];
  let bucketIndex = 0;
  for (const bucketCount of completionDistribution) {
    const bucketDaysAgo = bucketIndex * 10 + 3;
    for (let i = 0; i < bucketCount; i++) {
      const t = allPmTasks[Math.floor(Math.random() * allPmTasks.length)];
      const completedAt = daysAgoDate(bucketDaysAgo + Math.floor(Math.random() * 8));
      const next = addMonths(completedAt, t.frequencyMonths);
      await prisma.preventiveTaskCompletion.create({
        data: {
          preventiveTaskId: t.id,
          locationId: t.locationId,
          categoryId: t.categoryId,
          completedById: adminUser.id,
          completedAt,
          nextServiceDateGenerated: next,
          notes: "Service confirmed; all checks passed.",
        },
      });
    }
    bucketIndex++;
  }

  console.log("Creating sample open work orders...");
  for (const wo of WORK_ORDER_SAMPLES) {
    const location = locByName[wo.location];
    if (!location) continue;
    const tech = wo.technician ? techByName[wo.technician] : null;
    await prisma.workOrder.create({
      data: {
        locationId: location.id,
        title: wo.title,
        description: wo.description,
        priority: wo.priority,
        status: wo.status,
        category: wo.category,
        assignedTechnicianId: tech?.id,
        requestDate: daysAgoDate(wo.daysAgo),
        dueDate: wo.dueInDays ? daysFromNowDate(wo.dueInDays) : null,
      },
    });
  }

  console.log("Creating completed work orders across the year...");
  for (const wo of COMPLETED_WO_SAMPLES) {
    const location = locByName[wo.location];
    if (!location) continue;
    const tech = techByName[wo.technician];
    const completedAt = daysAgoDate(wo.completedDaysAgo);
    const requestDate = daysAgoDate(wo.completedDaysAgo + 3 + Math.floor(Math.random() * 7));
    await prisma.workOrder.create({
      data: {
        locationId: location.id,
        title: wo.title,
        description: `Completed: ${wo.title.toLowerCase()}.`,
        priority: wo.priority,
        status: "COMPLETE",
        category: wo.category,
        assignedTechnicianId: tech?.id,
        requestDate,
        dueDate: completedAt,
        completedAt,
        progressNotes: "Resolved on site.",
      },
    });
  }

  // Some vendors
  await prisma.vendor.createMany({
    data: [
      { name: "Bigham Signs", type: "Signage" },
      { name: "All Hours Plumbing", type: "Plumbing" },
      { name: "Whipple Service Champions", type: "HVAC" },
      { name: "Manitowoc Ice Service", type: "Ice Machine" },
    ],
  });

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
