export type ShipmentStatus =
  | "booked"
  | "picked_up"
  | "at_hub"
  | "in_transit"
  | "out_for_delivery"
  | "delivered"
  | "exception"
  | "returned";

export type Shipment = {
  id: string;
  tracking: string;
  from: string;
  to: string;
  fromCity: string;
  toCity: string;
  status: ShipmentStatus;
  weight: number;
  packageType: "Standard" | "Fragile" | "Medical" | "Express" | "Document";
  fragile?: boolean;
  medical?: boolean;
  eta: string;
  price: number;
  driver?: string;
  driverPhone?: string;
  vehicle?: string;
  hub?: string;
  progress: number;
  bookedAt: string;
  sustainability: number;
};

export const shipments: Shipment[] = [
  {
    id: "SL-8842013",
    tracking: "SLX-77420-IN",
    from: "88 Marine Drive, Mumbai",
    to: "402, Prestige Skyline, Bengaluru",
    fromCity: "Mumbai",
    toCity: "Bengaluru",
    status: "out_for_delivery",
    weight: 2.4,
    packageType: "Express",
    eta: "Today, 4:35 PM",
    price: 480,
    driver: "Ravi Kumar",
    driverPhone: "+91 98•••• 4421",
    vehicle: "EV Cargo · KA-05-EV-2210",
    hub: "BLR-South Hub",
    progress: 82,
    bookedAt: "2 days ago",
    sustainability: 92,
  },
  {
    id: "SL-8842014",
    tracking: "SLX-77421-IN",
    from: "AIIMS Blood Bank, Delhi",
    to: "Fortis Hospital, Gurugram",
    fromCity: "Delhi",
    toCity: "Gurugram",
    status: "in_transit",
    weight: 0.8,
    packageType: "Medical",
    medical: true,
    eta: "Today, 2:10 PM",
    price: 1240,
    driver: "Anita Sharma",
    driverPhone: "+91 98•••• 1102",
    vehicle: "Bike · DL-8C-AB-7788",
    hub: "DEL-Central Hub",
    progress: 58,
    bookedAt: "3 hours ago",
    sustainability: 88,
  },
  {
    id: "SL-8842015",
    tracking: "SLX-77422-IN",
    from: "Studio 12, Koramangala, Bengaluru",
    to: "Salt Lake Sector V, Kolkata",
    fromCity: "Bengaluru",
    toCity: "Kolkata",
    status: "at_hub",
    weight: 5.6,
    packageType: "Fragile",
    fragile: true,
    eta: "Tomorrow, 11:00 AM",
    price: 780,
    hub: "BLR-North Hub",
    progress: 34,
    bookedAt: "Yesterday",
    sustainability: 74,
  },
  {
    id: "SL-8842016",
    tracking: "SLX-77423-IN",
    from: "Hitech City, Hyderabad",
    to: "Anna Nagar, Chennai",
    fromCity: "Hyderabad",
    toCity: "Chennai",
    status: "delivered",
    weight: 1.2,
    packageType: "Standard",
    eta: "Delivered 9:42 AM",
    price: 220,
    driver: "Suresh N.",
    hub: "CHN-West Hub",
    progress: 100,
    bookedAt: "3 days ago",
    sustainability: 81,
  },
  {
    id: "SL-8842017",
    tracking: "SLX-77424-IN",
    from: "Baner, Pune",
    to: "Vasant Kunj, Delhi",
    fromCity: "Pune",
    toCity: "Delhi",
    status: "exception",
    weight: 3.1,
    packageType: "Standard",
    eta: "Delayed · Recalculating",
    price: 340,
    driver: "Manish D.",
    hub: "PUN-Main Hub",
    progress: 46,
    bookedAt: "Yesterday",
    sustainability: 69,
  },
  {
    id: "SL-8842018",
    tracking: "SLX-77425-IN",
    from: "Kochi Airport Cargo",
    to: "Panjim, Goa",
    fromCity: "Kochi",
    toCity: "Goa",
    status: "booked",
    weight: 12.0,
    packageType: "Standard",
    eta: "In 2 days",
    price: 920,
    progress: 8,
    bookedAt: "1 hour ago",
    sustainability: 77,
  },
];

export const statusLabel: Record<ShipmentStatus, string> = {
  booked: "Booked",
  picked_up: "Picked up",
  at_hub: "At hub",
  in_transit: "In transit",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  exception: "Exception",
  returned: "Returned",
};

export const timeline = (s: Shipment) => {
  const base = [
    { key: "booked", label: "Shipment booked", time: "Mon, 10:14 AM", location: s.fromCity, note: "Payment confirmed · ₹" + s.price, done: true },
    { key: "picked_up", label: "Picked up by courier", time: "Mon, 12:40 PM", location: s.fromCity, note: "Ravi Kumar · EV Bike", done: s.progress >= 20 },
    { key: "at_hub", label: "Arrived at origin hub", time: "Mon, 3:12 PM", location: s.fromCity + " · " + (s.hub ?? "Main Hub"), note: "Scanned · dimensional check passed", done: s.progress >= 34 },
    { key: "processed", label: "Processed & loaded", time: "Mon, 7:20 PM", location: s.fromCity, note: "Assigned to line-haul VH-2210", done: s.progress >= 45 },
    { key: "in_transit", label: "In transit", time: "Tue, 6:02 AM", location: "Highway checkpoint", note: "AI ETA recalculated · +12 min traffic", done: s.progress >= 58 },
    { key: "arrived_dest", label: "Arrived at destination hub", time: "Tue, 11:45 AM", location: s.toCity + " · Dispatch Center", done: s.progress >= 70 },
    { key: "out_for_delivery", label: "Out for delivery", time: "Tue, 1:20 PM", location: s.toCity, note: (s.driver ?? "Driver") + " · " + (s.vehicle ?? "Van"), done: s.progress >= 80 },
    { key: "delivered", label: "Delivered", time: s.status === "delivered" ? "Tue, 4:35 PM" : "Expected " + s.eta, location: s.toCity, note: s.status === "delivered" ? "Signed by recipient · POD captured" : "Awaiting delivery", done: s.progress >= 100 },
  ];
  return base;
};

export const hubs = [
  { code: "DEL-Central", city: "Delhi", load: 78, capacity: 4200, staff: 42, incoming: 340, outgoing: 512, status: "healthy" },
  { code: "BOM-Main", city: "Mumbai", load: 92, capacity: 5200, staff: 58, incoming: 620, outgoing: 480, status: "congested" },
  { code: "BLR-South", city: "Bengaluru", load: 64, capacity: 3800, staff: 38, incoming: 280, outgoing: 410, status: "healthy" },
  { code: "MAA-West", city: "Chennai", load: 71, capacity: 3200, staff: 34, incoming: 220, outgoing: 260, status: "healthy" },
  { code: "HYD-Tech", city: "Hyderabad", load: 55, capacity: 2800, staff: 26, incoming: 180, outgoing: 210, status: "healthy" },
  { code: "CCU-East", city: "Kolkata", load: 84, capacity: 3000, staff: 30, incoming: 260, outgoing: 190, status: "warning" },
];

export const drivers = [
  { id: "DP-201", name: "Ravi Kumar", city: "Bengaluru", vehicle: "EV Cargo", rating: 4.9, deliveries: 812, onDuty: true, load: 6 },
  { id: "DP-202", name: "Anita Sharma", city: "Delhi", vehicle: "Medical Bike", rating: 4.95, deliveries: 1240, onDuty: true, load: 3 },
  { id: "DP-203", name: "Suresh N.", city: "Chennai", vehicle: "Mini Van", rating: 4.7, deliveries: 640, onDuty: true, load: 8 },
  { id: "DP-204", name: "Manish D.", city: "Pune", vehicle: "Bike", rating: 4.6, deliveries: 512, onDuty: false, load: 0 },
  { id: "DP-205", name: "Priya R.", city: "Mumbai", vehicle: "EV Van", rating: 4.85, deliveries: 902, onDuty: true, load: 5 },
];

export const notifications = [
  { id: 1, type: "medical", title: "Medical shipment picked up", body: "AIIMS → Fortis · Priority route locked", time: "2m ago" },
  { id: 2, type: "info", title: "AI rerouted SL-8842017", body: "Saved 24 min via NH-48 bypass", time: "8m ago" },
  { id: 3, type: "warning", title: "Hub BOM-Main at 92% load", body: "Redirecting 40 packages to BOM-East", time: "14m ago" },
  { id: 4, type: "success", title: "Delivery completed", body: "SL-8842016 · Signed by recipient", time: "1h ago" },
];

export const analytics = {
  volume: [
    { day: "Mon", shipments: 3120, delivered: 2890 },
    { day: "Tue", shipments: 3380, delivered: 3110 },
    { day: "Wed", shipments: 3540, delivered: 3290 },
    { day: "Thu", shipments: 3720, delivered: 3480 },
    { day: "Fri", shipments: 4120, delivered: 3870 },
    { day: "Sat", shipments: 4480, delivered: 4180 },
    { day: "Sun", shipments: 3860, delivered: 3620 },
  ],
  categoryMix: [
    { name: "Standard", value: 48 },
    { name: "Express", value: 22 },
    { name: "Medical", value: 12 },
    { name: "Fragile", value: 10 },
    { name: "Document", value: 8 },
  ],
  eta: [
    { hour: "00", actual: 42, predicted: 44 },
    { hour: "04", actual: 38, predicted: 39 },
    { hour: "08", actual: 62, predicted: 58 },
    { hour: "12", actual: 71, predicted: 69 },
    { hour: "16", actual: 84, predicted: 80 },
    { hour: "20", actual: 58, predicted: 60 },
  ],
};
