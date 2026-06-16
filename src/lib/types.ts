export type Role = "ADMIN" | "TECHNICIAN" | "LOCATION_MANAGER";

export type PreventiveStatus =
  | "NOT_STARTED"
  | "UPCOMING"
  | "DUE_SOON"
  | "OVERDUE"
  | "COMPLETED";

export type WorkOrderPriority = "SUBORDINATE" | "IMPORTANT" | "URGENT";

export type WorkOrderStatus =
  | "NEW"
  | "ASSIGNED"
  | "ORDERED"
  | "SCHEDULED"
  | "IN_PROGRESS"
  | "WAITING_ON_VENDOR"
  | "COMPLETE"
  | "CANCELLED";

export const WORK_ORDER_STATUSES: WorkOrderStatus[] = [
  "NEW",
  "ASSIGNED",
  "ORDERED",
  "SCHEDULED",
  "IN_PROGRESS",
  "WAITING_ON_VENDOR",
  "COMPLETE",
  "CANCELLED",
];

export const WORK_ORDER_PRIORITIES: WorkOrderPriority[] = [
  "URGENT",
  "IMPORTANT",
  "SUBORDINATE",
];

export const WORK_ORDER_CATEGORIES = [
  "Equipment",
  "Plumbing",
  "Electrical",
  "HVAC/Hood",
  "Ice Machine",
  "Refrigerator/Freezer",
  "Water Heater/Boiler",
  "Building/Signage",
  "Other",
] as const;
