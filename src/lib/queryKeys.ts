/**
 * Query key factory for React Query cache management.
 * Provides structured, consistent keys for all server state.
 */
export const vehicleKeys = {
  all: ["vehicles"] as const,
  lists: () => [...vehicleKeys.all, "list"] as const,
  list: (filters: Record<string, unknown>) => [...vehicleKeys.lists(), filters] as const,
  details: () => [...vehicleKeys.all, "detail"] as const,
  detail: (id: string) => [...vehicleKeys.details(), id] as const,
  models: (make: string) => [...vehicleKeys.all, "models", make] as const,
  brands: () => [...vehicleKeys.all, "brands"] as const,
};

export const bidKeys = {
  all: ["bids"] as const,
  forVehicle: (vehicleId: string) => [...bidKeys.all, "vehicle", vehicleId] as const,
  forUser: (userId: string) => [...bidKeys.all, "user", userId] as const,
};

export const profileKeys = {
  all: ["profiles"] as const,
  detail: (userId: string) => [...profileKeys.all, userId] as const,
};

export const notificationKeys = {
  all: ["notifications"] as const,
  forUser: (userId: string) => [...notificationKeys.all, userId] as const,
};

export const watchlistKeys = {
  all: ["watchlist"] as const,
  forUser: (userId: string) => [...watchlistKeys.all, userId] as const,
};
