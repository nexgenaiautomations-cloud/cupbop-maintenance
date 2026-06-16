// Generate per-table multi-row SQL INSERTs for one-shot Supabase seeding.
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { randomBytes } from "node:crypto";

const LOCATIONS = [
  "Provo","Daybreak","Draper","American Fork","Murray","Midvale",
  "Downtown","West Valley","Orem","Layton","Park City","Tooele",
  "Washington","Fort Union","Hunter","Ogden","Logan","Saratoga Springs",
  "Millcreek","Herriman","Lehi","Foothills","Roy","Cedar Hills",
  "Salt Lake City","Cedar City","Hill AFB","Spanish Fork","Bountiful",
  "Huachuca Army Base",
];

const REGIONS = {
  Provo:"Utah County",Orem:"Utah County","American Fork":"Utah County",Lehi:"Utah County","Spanish Fork":"Utah County","Saratoga Springs":"Utah County","Cedar Hills":"Utah County",
  "Salt Lake City":"Salt Lake County",Downtown:"Salt Lake County",Murray:"Salt Lake County",Midvale:"Salt Lake County",Draper:"Salt Lake County","West Valley":"Salt Lake County",Daybreak:"Salt Lake County",Hunter:"Salt Lake County",Foothills:"Salt Lake County","Fort Union":"Salt Lake County",Herriman:"Salt Lake County",Millcreek:"Salt Lake County",
  Tooele:"Tooele County",Layton:"Davis County",Bountiful:"Davis County","Hill AFB":"Davis County",Roy:"Weber County",Ogden:"Weber County",Logan:"Cache County","Park City":"Summit County",Washington:"Washington County","Cedar City":"Iron County","Huachuca Army Base":"Arizona",
};

const TECHNICIANS = [
  { name:"Rodney", phone:"801-555-0101", email:"rodney@cupbopmaintenance.com" },
  { name:"Hyeong", phone:"801-555-0102", email:"hyeong@cupbopmaintenance.com" },
  { name:"Roger",  phone:"801-555-0103", email:"roger@cupbopmaintenance.com" },
  { name:"Technician", phone:null, email:null },
  { name:"Sign Co", phone:"801-555-0201", email:"vendor@signco.com" },
  { name:"Landlord", phone:null, email:null },
  { name:"Gina",  phone:"801-555-0104", email:"gina@cupbopmaintenance.com" },
  { name:"Bookie", phone:"801-555-0105", email:"bookie@cupbopmaintenance.com" },
];

const CATEGORIES = [
  { name:"Hot Water Heater", freq:6, description:"Tank flush, anode rod, relief valve inspection" },
  { name:"HVAC / Hood Systems / Filter Change", freq:3, description:"Filters, airflow, belt tension, rooftop units, hood" },
  { name:"Ice Machines", freq:3, description:"Sanitize bin, descale, condenser, water filter" },
  { name:"Refrigerators / Freezers", freq:3, description:"Condenser coils, fans, temps, drain lines" },
  { name:"Plumbing", freq:3, description:"Drains, sprayers, connections, grease trap" },
  { name:"Electrical", freq:3, description:"GFI outlets, panel labels, cords, circuits" },
  { name:"Water Boiler", freq:6, description:"Descale, sanitize, temp verification, leaks" },
];

const WORK_ORDER_SAMPLES = [
  { location:"Provo", title:"Kitchen floor grout chipping", description:"Several tiles near the fryer line have chipped grout creating tripping hazards.", priority:"IMPORTANT", status:"IN_PROGRESS", daysAgo:6, dueInDays:7, technician:"Rodney", category:"Building/Signage" },
  { location:"Daybreak", title:"Water softener not working", description:"Salt level not dropping; water testing hard. Possible motor issue.", priority:"URGENT", status:"WAITING_ON_VENDOR", daysAgo:4, dueInDays:2, technician:"Hyeong", category:"Plumbing" },
  { location:"Draper", title:"Ice machine not working", description:"Manitowoc unit producing no ice for 36 hours. Sourcing replacement evaporator.", priority:"URGENT", status:"ORDERED", daysAgo:3, dueInDays:1, technician:"Roger", category:"Ice Machine" },
  { location:"American Fork", title:"Hot water not working in 3 comp sink", description:"Hot side handle spins freely; no hot water reaching basin.", priority:"URGENT", status:"ASSIGNED", daysAgo:2, dueInDays:1, technician:"Rodney", category:"Plumbing" },
  { location:"Murray", title:"Fryer not lighting", description:"Pilot ignites then drops out. Possibly thermocouple failure.", priority:"URGENT", status:"IN_PROGRESS", daysAgo:1, dueInDays:1, technician:"Roger", category:"Equipment" },
  { location:"Midvale", title:"Freezer not holding temperature", description:"Walk-in freezer reading 12F overnight, alarms triggered twice.", priority:"URGENT", status:"ASSIGNED", daysAgo:1, dueInDays:1, technician:"Hyeong", category:"Refrigerator/Freezer" },
  { location:"Downtown", title:"Sink leaking under prep table", description:"Pooling water from p-trap.", priority:"IMPORTANT", status:"ASSIGNED", daysAgo:5, dueInDays:5, technician:"Rodney", category:"Plumbing" },
  { location:"West Valley", title:"Hood vent needs caulk", description:"Gap between hood and ceiling allowing grease drips on cook line.", priority:"SUBORDINATE", status:"SCHEDULED", daysAgo:9, dueInDays:14, technician:"Technician", category:"HVAC/Hood" },
  { location:"Orem", title:"Camera quality needs checking", description:"Lobby camera image grainy at night, possible focus drift.", priority:"SUBORDINATE", status:"NEW", daysAgo:2, category:"Building/Signage" },
  { location:"Layton", title:"Sign peeling on storefront", description:"Top left corner of front wall sign lifting from substrate.", priority:"IMPORTANT", status:"ORDERED", daysAgo:12, dueInDays:14, technician:"Sign Co", category:"Building/Signage" },
  { location:"Park City", title:"Ceiling vents need cleaned", description:"Dust accumulation visible from dining room.", priority:"SUBORDINATE", status:"NEW", daysAgo:1, category:"HVAC/Hood" },
  { location:"Tooele", title:"Water boiler leaking", description:"Bunn tea boiler dripping at relief valve.", priority:"IMPORTANT", status:"ASSIGNED", daysAgo:3, dueInDays:4, technician:"Hyeong", category:"Water Heater/Boiler" },
  { location:"Washington", title:"Lobby walls need repainting", description:"Scuffs and chair-rail damage along east wall.", priority:"SUBORDINATE", status:"SCHEDULED", daysAgo:30, dueInDays:30, technician:"Landlord", category:"Building/Signage" },
  { location:"Fort Union", title:"Restroom sink loose", description:"Lavatory pulling away from wall, anchor failing.", priority:"IMPORTANT", status:"ASSIGNED", daysAgo:2, dueInDays:3, technician:"Rodney", category:"Plumbing" },
  { location:"Hunter", title:"Soda machine leaking", description:"Bib syrup line drip behind machine.", priority:"IMPORTANT", status:"IN_PROGRESS", daysAgo:1, dueInDays:2, technician:"Roger", category:"Equipment" },
  { location:"Ogden", title:"Walk-in cooler door gasket torn", description:"Cold air loss; gasket has 4 inch tear at bottom.", priority:"IMPORTANT", status:"ORDERED", daysAgo:4, dueInDays:7, technician:"Hyeong", category:"Refrigerator/Freezer" },
  { location:"Logan", title:"POS receipt printer jammed", description:"Front counter printer continually paper jams.", priority:"SUBORDINATE", status:"ASSIGNED", daysAgo:1, dueInDays:5, technician:"Bookie", category:"Equipment" },
  { location:"Saratoga Springs", title:"Drive thru sign light out", description:"Half of menu board LED panel dark.", priority:"IMPORTANT", status:"ORDERED", daysAgo:6, dueInDays:10, technician:"Sign Co", category:"Building/Signage" },
];

const COMPLETED = [
  { location:"Provo", title:"Walk-in light replacement", priority:"SUBORDINATE", completedDaysAgo:3, technician:"Rodney", category:"Electrical" },
  { location:"Draper", title:"Replaced ice machine water filter", priority:"IMPORTANT", completedDaysAgo:5, technician:"Roger", category:"Ice Machine" },
  { location:"Murray", title:"Sanitized hood system", priority:"IMPORTANT", completedDaysAgo:10, technician:"Hyeong", category:"HVAC/Hood" },
  { location:"Layton", title:"Patched dining room ceiling tile", priority:"SUBORDINATE", completedDaysAgo:12, technician:"Rodney", category:"Building/Signage" },
  { location:"Downtown", title:"Faucet cartridge replacement", priority:"IMPORTANT", completedDaysAgo:18, technician:"Rodney", category:"Plumbing" },
  { location:"Logan", title:"Drain line snaked", priority:"URGENT", completedDaysAgo:22, technician:"Hyeong", category:"Plumbing" },
  { location:"Orem", title:"Reset breaker on freezer circuit", priority:"URGENT", completedDaysAgo:30, technician:"Roger", category:"Electrical" },
  { location:"Ogden", title:"Water heater pilot relight", priority:"IMPORTANT", completedDaysAgo:38, technician:"Hyeong", category:"Water Heater/Boiler" },
  { location:"Tooele", title:"POS network cable replaced", priority:"IMPORTANT", completedDaysAgo:45, technician:"Bookie", category:"Equipment" },
  { location:"Park City", title:"Salt run for water softener", priority:"SUBORDINATE", completedDaysAgo:55, technician:"Rodney", category:"Plumbing" },
  { location:"Lehi", title:"Hood filter swap", priority:"IMPORTANT", completedDaysAgo:70, technician:"Hyeong", category:"HVAC/Hood" },
  { location:"Cedar Hills", title:"Replaced GFI in mop sink", priority:"URGENT", completedDaysAgo:85, technician:"Rodney", category:"Electrical" },
  { location:"Roy", title:"Reglued lobby tile", priority:"SUBORDINATE", completedDaysAgo:100, technician:"Rodney", category:"Building/Signage" },
  { location:"Bountiful", title:"Fryer thermocouple replaced", priority:"URGENT", completedDaysAgo:120, technician:"Roger", category:"Equipment" },
  { location:"Spanish Fork", title:"Ice machine deep clean", priority:"IMPORTANT", completedDaysAgo:140, technician:"Hyeong", category:"Ice Machine" },
  { location:"Foothills", title:"Caulked back splash", priority:"SUBORDINATE", completedDaysAgo:150, technician:"Technician", category:"Plumbing" },
];

function cuid() { return "c" + randomBytes(10).toString("hex").slice(0, 24); }
function s(v) { return v === null || v === undefined ? "NULL" : `'${String(v).replace(/'/g,"''")}'`; }
function daysAgo(d) { const x = new Date(); x.setDate(x.getDate()-d); x.setHours(10,0,0,0); return x; }
function daysAhead(d) { const x = new Date(); x.setDate(x.getDate()+d); x.setHours(10,0,0,0); return x; }
function addMonths(d, m) { const x = new Date(d); x.setMonth(x.getMonth()+m); return x; }
function iso(d) { return d ? `'${d.toISOString()}'` : "NULL"; }
function status(next, last) {
  if (!last && !next) return "NOT_STARTED";
  if (!next) return "NOT_STARTED";
  const diff = Math.ceil((next.getTime() - Date.now()) / 86400000);
  if (diff < 0) return "OVERDUE";
  if (diff <= 14) return "DUE_SOON";
  return "UPCOMING";
}

const NOW = new Date().toISOString();
const locById = {}, techById = {}, catById = {};

function emitTableInsert(table, cols, rows) {
  if (rows.length === 0) return "";
  const valuesRows = rows.map((r) => `(${r.join(",")})`).join(",\n");
  return `INSERT INTO "${table}" (${cols.map((c) => `"${c}"`).join(",")}) VALUES\n${valuesRows};`;
}

const outDir = process.argv[2] ?? "seed-sql";
mkdirSync(outDir, { recursive: true });

// 01 — Locations
{
  const rows = LOCATIONS.map((name) => {
    const id = cuid(); locById[name] = id;
    const region = REGIONS[name] ?? "Other";
    const state = name === "Huachuca Army Base" ? "AZ" : "UT";
    const email = `${name.toLowerCase().replace(/\s+/g,"")}@cupbopmaintenance.com`;
    return [s(id), s(name), s(region), s(name), s(state), s("ACTIVE"), s(name+" Manager"), s(email), s("801-555-0000"), `'${NOW}'`, `'${NOW}'`];
  });
  writeFileSync(`${outDir}/01-locations.sql`,
    emitTableInsert("Location",
      ["id","name","region","city","state","status","managerName","managerEmail","managerPhone","createdAt","updatedAt"],
      rows));
}

// 02 — Technicians
{
  const rows = TECHNICIANS.map((t) => {
    const id = cuid(); techById[t.name] = id;
    return [s(id), s(t.name), s(t.email), s(t.phone), "TRUE", `'${NOW}'`, `'${NOW}'`];
  });
  writeFileSync(`${outDir}/02-technicians.sql`,
    emitTableInsert("Technician",
      ["id","name","email","phone","active","createdAt","updatedAt"], rows));
}

// 03 — Categories
{
  const rows = CATEGORIES.map((c) => {
    const id = cuid(); catById[c.name] = id;
    return [s(id), s(c.name), String(c.freq), s(c.description), "TRUE"];
  });
  writeFileSync(`${outDir}/03-categories.sql`,
    emitTableInsert("MaintenanceCategory",
      ["id","name","defaultFrequencyMonths","description","active"], rows));
}

// 04 — Users
{
  const adminId = cuid();
  globalThis.__adminId = adminId;
  const rows = [];
  rows.push([s(adminId), s("Admin"), s("admin@cupbopmaintenance.com"), s("ADMIN"), "NULL", "NULL", `'${NOW}'`, `'${NOW}'`]);
  rows.push([s(cuid()), s("Rodney (Technician)"), s("technician@cupbopmaintenance.com"), s("TECHNICIAN"), "NULL", s(techById["Rodney"]), `'${NOW}'`, `'${NOW}'`]);
  for (const name of LOCATIONS) {
    const email = `${name.toLowerCase().replace(/\s+/g,"")}@cupbopmaintenance.com`;
    rows.push([s(cuid()), s(name+" Manager"), s(email), s("LOCATION_MANAGER"), s(locById[name]), "NULL", `'${NOW}'`, `'${NOW}'`]);
  }
  writeFileSync(`${outDir}/04-users.sql`,
    emitTableInsert("User",
      ["id","name","email","role","locationId","technicianId","createdAt","updatedAt"], rows));
}

// 05 — Preventive tasks (210 rows)
const pmTasks = [];
{
  const rows = [];
  for (const locName of LOCATIONS) {
    for (const cat of CATEGORIES) {
      const variance = Math.floor(Math.random() * 6) - 2;
      const lastD = cat.freq * 30 - 14 + variance * 10;
      const last = lastD > 0 ? daysAgo(lastD) : null;
      const next = last ? addMonths(last, cat.freq) : daysAhead(10 + variance * 5);
      const st = status(next, last);
      const techName = ["Rodney","Hyeong","Roger"][Math.floor(Math.random() * 3)];
      const id = cuid();
      pmTasks.push({ id, locationId: locById[locName], categoryId: catById[cat.name], freq: cat.freq });
      rows.push([
        s(id), s(locById[locName]), s(catById[cat.name]),
        s(cat.name+" — "+locName), s(cat.description), String(cat.freq),
        iso(last), iso(next), s(techById[techName]), s(st), `'${NOW}'`, `'${NOW}'`
      ]);
    }
  }
  writeFileSync(`${outDir}/05-preventive-tasks.sql`,
    emitTableInsert("PreventiveTask",
      ["id","locationId","categoryId","taskName","description","frequencyMonths","lastServiceDate","nextServiceDate","assignedTechnicianId","status","createdAt","updatedAt"], rows));
}

// 06 — PM Completions (cut to ~120 so chart is populated but SQL fits one call)
{
  const rows = [];
  const distribution = [4,6,8,10,7,11,10,6,9,12,7,15,12,11,9,14,8,5];
  let bucket = 0;
  for (const count of distribution) {
    const base = bucket * 10 + 3;
    for (let i = 0; i < count; i++) {
      const t = pmTasks[Math.floor(Math.random() * pmTasks.length)];
      const completedAt = daysAgo(base + Math.floor(Math.random() * 8));
      const next = addMonths(completedAt, t.freq);
      rows.push([
        s(cuid()), s(t.id), s(t.locationId), s(t.categoryId), s(globalThis.__adminId),
        iso(completedAt), iso(next), s("Service confirmed; all checks passed."), `'${NOW}'`
      ]);
    }
    bucket++;
  }
  writeFileSync(`${outDir}/06-pm-completions.sql`,
    emitTableInsert("PreventiveTaskCompletion",
      ["id","preventiveTaskId","locationId","categoryId","completedById","completedAt","nextServiceDateGenerated","notes","createdAt"], rows));
}

// 07 — Work orders (open + completed)
{
  const rows = [];
  for (const wo of WORK_ORDER_SAMPLES) {
    const locId = locById[wo.location]; if (!locId) continue;
    const techId = wo.technician ? techById[wo.technician] : null;
    rows.push([
      s(cuid()), s(locId), s(wo.title), s(wo.description), s(wo.priority), s(wo.status),
      s(wo.category), s(techId), iso(daysAgo(wo.daysAgo)),
      wo.dueInDays ? iso(daysAhead(wo.dueInDays)) : "NULL", "NULL", "NULL", `'${NOW}'`, `'${NOW}'`
    ]);
  }
  for (const wo of COMPLETED) {
    const locId = locById[wo.location]; if (!locId) continue;
    const techId = techById[wo.technician];
    const completedAt = daysAgo(wo.completedDaysAgo);
    const requestDate = daysAgo(wo.completedDaysAgo + 3 + Math.floor(Math.random() * 7));
    rows.push([
      s(cuid()), s(locId), s(wo.title), s("Completed: "+wo.title.toLowerCase()+"."),
      s(wo.priority), s("COMPLETE"), s(wo.category), s(techId), iso(requestDate),
      iso(completedAt), iso(completedAt), s("Resolved on site."), `'${NOW}'`, `'${NOW}'`
    ]);
  }
  writeFileSync(`${outDir}/07-work-orders.sql`,
    emitTableInsert("WorkOrder",
      ["id","locationId","title","description","priority","status","category","assignedTechnicianId","requestDate","dueDate","completedAt","progressNotes","createdAt","updatedAt"], rows));
}

// 08 — Vendors
{
  const rows = [
    [s(cuid()), s("Bigham Signs"), s("Signage"), `'${NOW}'`],
    [s(cuid()), s("All Hours Plumbing"), s("Plumbing"), `'${NOW}'`],
    [s(cuid()), s("Whipple Service Champions"), s("HVAC"), `'${NOW}'`],
    [s(cuid()), s("Manitowoc Ice Service"), s("Ice Machine"), `'${NOW}'`],
  ];
  writeFileSync(`${outDir}/08-vendors.sql`,
    emitTableInsert("Vendor", ["id","name","type","createdAt"], rows));
}

console.log(`Wrote seed files to ${outDir}/`);
