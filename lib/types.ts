// Bus Stop Types
export interface BusStop {
  id?: string;
  name: string;
  latitude: number;
  longitude: number;
  priority: number;
}


export interface LKHResponse {
  routeId: string; // Unique identifier for the optimized route
  status: "success" | "failure"; // Indicates if optimization was successful
  stops: {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    priority: number;
    sequence: number; // Order in the route
  }[];
  totalDistance: number; // in kilometers
  totalDuration: number; // in minutes
  estimatedFuelConsumption?: number; // in liters
  estimatedCost?: number; // in currency units
  routeGeometry?: string; // encoded polyline or GeoJSON
  optimizationMetadata: {
    algorithm: "LKH" | "LKH-3" | "other"; // LKH variant used
    optimizationTime: number; // in milliseconds
    iterations: number;
    constraints: RouteOptimizationParams;
  };
}

export interface WorkerSchedule {
  id: string;                     // Unique identifier for the schedule
  worker_id: string;              // Reference to the Worker's id
  route_id: string;               // Reference to the OptimizedRoute's id
  date: string;                   // Date in YYYY-MM-DD format
  shift: string;                  // Shift identifier (morning, afternoon, night)
  createdAt?: string;             // Timestamp when the schedule was created
  updatedAt?: string;             // Timestamp for last update
  
  // Populated relation fields (when using .select("*, workers(*), optimized_routes(*)"))
  workers?: Worker;               // Worker details when included in the query
  optimized_routes?: OptimizedRoute; // Route details when included in the query
}

export type Worker = {
  id: string; // Optional unique identifier
  name: string; // Required: Worker's full name
  email: string; // Required: Contact email
  phone: string; // Required: Contact number
  assignedRouteId?: string | null; // Optional: The route assigned to the worker
  availability?: boolean; // Optional: Worker availability status
  shiftStart?: string; // Optional: Shift start time
  shiftEnd?: string; // Optional: Shift end time
  role: "Driver" | "Conductor"; // Only two roles allowed
  createdAt?: string; // Optional: Timestamp when the worker was added
  updatedAt?: string; // Optional: Timestamp for the last update
};


export interface BusStopAmenities {
  hasShelter: boolean;
  hasBench: boolean;
  hasLighting: boolean;
  hasTrashCan: boolean;
  isAccessible: boolean;
  hasRealTimeDisplay: boolean;
}

export interface BusStopCreateParams {
  name: string;
  latitude: number;
  longitude: number;
  priority: number;
  address?: string;
  city?: string;
  zipCode?: string;
  amenities?: Partial<BusStopAmenities>;
  isActive?: boolean;
}

export interface BusStopUpdateParams {
  id: string;
  name?: string;
  latitude?: number;
  longitude?: number;
  priority?: number;
  address?: string;
  city?: string;
  zipCode?: string;
  amenities?: Partial<BusStopAmenities>;
  isActive?: boolean;
}

// Depot Types
export interface Depot {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  zipCode?: string;
  capacity: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  operatingHours?: {
    open: string; // HH:MM format
    close: string; // HH:MM format
  };
  notes?: string;
}

export interface DepotCreateParams {
  name: string;
  latitude: number;
  longitude: number;
  address?: string;
  city?: string;
  zipCode?: string;
  capacity: number;
  isActive?: boolean;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  operatingHours?: {
    open: string;
    close: string;
  };
}

export interface DepotUpdateParams {
  id: string;
  name?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  city?: string;
  zipCode?: string;
  capacity?: number;
  isActive?: boolean;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  operatingHours?: {
    open?: string;
    close?: string;
  };
}

export interface BusRoute {
  id: string; // Unique identifier for the route
  name: string; // Route name or identifier
  stops: { 
    id: string; 
    name: string; 
    latitude: number; 
    longitude: number; 
  }[]; // List of stops with coordinates
  distance: number; // Total distance of the route (in km or meters)
  duration: number; // Estimated duration (in minutes or seconds)
  busesAssigned: number; // Number of buses assigned to this route
  frequency: number; // Frequency of buses (e.g., every 15 mins)
  depotId?: string; // Optional depot reference
  createdAt?: Date; // Optional timestamp for creation
  updatedAt?: Date; // Optional timestamp for last update
  isActive?: boolean; // Whether the route is currently active
};


// Optimized Route Types
export interface OptimizedRoute {
  id: string;
  stops: {
    id: string;
    name: string;
    latitude: number;
    longitude: number;
    priority: number;
  }[];
  distance: number; // in kilometers
  duration: number; // in minutes
  buses: number;
  frequency: number; // in minutes
  name: string | null;
  stops_number: number | null;
  depotId?: string;
  createdAt?: string;
  updatedAt?: string;
  isActive?: boolean;
  estimatedFuelConsumption?: number; // in liters
  estimatedCost?: number; // in currency units
  routeGeometry?: string; // encoded polyline or GeoJSON
  totalRidership?: number;
  efficiencyScore?: number; // calculated metric (0-100)
}

export interface OptimizedRouteCreateParams {
  stops: string[]; // Array of stop IDs
  distance: number;
  duration: number;
  buses: number;
  frequency: number;
  name?: string;
  depotId: string;
  isActive?: boolean;
  routeGeometry?: string;
}

export interface OptimizedRouteUpdateParams {
  id: string;
  stops?: string[];
  distance?: number;
  duration?: number;
  buses?: number;
  frequency?: number;
  name?: string;
  depotId?: string;
  isActive?: boolean;
  routeGeometry?: string;
}

// Route Optimization Parameters
export interface RouteOptimizationParams {
  depotId: string;
  minStops: number;
  maxStops: number;
  maxDistance: number; // in kilometers
  maxDuration: number; // in minutes
  priorityWeight: number; // 1-10 scale
  buses: number;
  frequency: number; // in minutes
  existingStopIds?: string[]; // Optional stops that must be included
  avoidStopIds?: string[]; // Optional stops to avoid
  preferHighPriorityStops?: boolean;
  optimizationMethod?: 'distance' | 'duration' | 'ridership' | 'mixed';
  startTime?: string; // HH:MM format
  endTime?: string; // HH:MM format
  daysOfWeek?: string[]; // ["Monday", "Tuesday", etc.]
  maxTransfers?: number;
  considerTraffic?: boolean;
  balanceLoad?: boolean; // distribute passengers evenly
}

export interface OptimizationResult {
  route: OptimizedRoute;
  alternativeRoutes?: OptimizedRoute[];
  metadata: {
    optimizationTime: number; // in milliseconds
    iterations: number;
    algorithm: string;
    optimizationScore: number;
    constraints: RouteOptimizationParams;
  };
}