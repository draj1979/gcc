export type CityArea = {
  city: string;
  area?: string;
  lat: number;
  lng: number;
};

export const KNOWN_AREAS: CityArea[] = [
  { city: "Bengaluru", area: "Whitefield", lat: 12.9698, lng: 77.7499 },
  { city: "Bengaluru", area: "Electronic City", lat: 12.8456, lng: 77.6603 },
  { city: "Bengaluru", area: "Koramangala", lat: 12.9352, lng: 77.6146 },
  { city: "Bengaluru", area: "Marathahalli", lat: 12.9591, lng: 77.6974 },
  { city: "Bengaluru", area: "Manyata Tech Park", lat: 13.0473, lng: 77.6207 },
  { city: "Bengaluru", area: "Outer Ring Road", lat: 12.9352, lng: 77.6245 },
  { city: "Bengaluru", area: "RMZ Ecoworld", lat: 12.9279, lng: 77.6271 },
  { city: "Bengaluru", area: "Embassy GolfLinks", lat: 12.9608, lng: 77.6469 },
  { city: "Bengaluru", area: "Indiranagar", lat: 12.9784, lng: 77.6408 },
  { city: "Bengaluru", area: "HSR Layout", lat: 12.9116, lng: 77.6473 },
  { city: "Bengaluru", area: "Hebbal", lat: 13.0359, lng: 77.5970 },
  { city: "Bengaluru", lat: 12.9716, lng: 77.5946 },

  { city: "Hyderabad", area: "HITEC City", lat: 17.4474, lng: 78.3762 },
  { city: "Hyderabad", area: "Gachibowli", lat: 17.4435, lng: 78.3772 },
  { city: "Hyderabad", area: "Madhapur", lat: 17.4486, lng: 78.3908 },
  { city: "Hyderabad", area: "Financial District", lat: 17.4147, lng: 78.3424 },
  { city: "Hyderabad", area: "Banjara Hills", lat: 17.4156, lng: 78.4347 },
  { city: "Hyderabad", lat: 17.385, lng: 78.4867 },

  { city: "Mumbai", area: "BKC", lat: 19.067, lng: 72.8686 },
  { city: "Mumbai", area: "Powai", lat: 19.1197, lng: 72.9051 },
  { city: "Mumbai", area: "Goregaon", lat: 19.1646, lng: 72.8493 },
  { city: "Mumbai", area: "Andheri", lat: 19.1136, lng: 72.8697 },
  { city: "Mumbai", area: "Lower Parel", lat: 19.0011, lng: 72.8302 },
  { city: "Mumbai", lat: 19.076, lng: 72.8777 },

  { city: "Pune", area: "Hinjewadi", lat: 18.5912, lng: 73.7392 },
  { city: "Pune", area: "Kharadi", lat: 18.5526, lng: 73.9443 },
  { city: "Pune", area: "Magarpatta", lat: 18.5151, lng: 73.9296 },
  { city: "Pune", area: "Baner", lat: 18.5598, lng: 73.7799 },
  { city: "Pune", area: "Viman Nagar", lat: 18.5679, lng: 73.9143 },
  { city: "Pune", lat: 18.5204, lng: 73.8567 },

  { city: "Chennai", area: "OMR", lat: 12.9089, lng: 80.2275 },
  { city: "Chennai", area: "Sholinganallur", lat: 12.901, lng: 80.2279 },
  { city: "Chennai", area: "Guindy", lat: 13.0067, lng: 80.2206 },
  { city: "Chennai", area: "Tidel Park", lat: 12.9913, lng: 80.2438 },
  { city: "Chennai", lat: 13.0827, lng: 80.2707 },

  { city: "Gurugram", area: "Cyber City", lat: 28.4945, lng: 77.0884 },
  { city: "Gurugram", area: "Udyog Vihar", lat: 28.5028, lng: 77.0859 },
  { city: "Gurugram", lat: 28.4595, lng: 77.0266 },

  { city: "Noida", area: "Sector 62", lat: 28.6217, lng: 77.3605 },
  { city: "Noida", area: "Sector 132", lat: 28.5142, lng: 77.405 },
  { city: "Noida", lat: 28.5355, lng: 77.391 },

  { city: "Delhi", lat: 28.6139, lng: 77.209 },
  { city: "Kolkata", area: "Salt Lake", lat: 22.5697, lng: 88.4096 },
  { city: "Kolkata", lat: 22.5726, lng: 88.3639 },
  { city: "Ahmedabad", area: "GIFT City", lat: 23.1646, lng: 72.6892 },
  { city: "Ahmedabad", lat: 23.0225, lng: 72.5714 },
  { city: "Jaipur", lat: 26.9124, lng: 75.7873 },
  { city: "Coimbatore", lat: 11.0168, lng: 76.9558 },
  { city: "Thiruvananthapuram", area: "Technopark", lat: 8.5566, lng: 76.8814 },
  { city: "Thiruvananthapuram", lat: 8.5241, lng: 76.9366 },
  { city: "Kochi", area: "Infopark", lat: 10.0103, lng: 76.3608 },
  { city: "Kochi", lat: 9.9312, lng: 76.2673 },
  { city: "Bhubaneswar", lat: 20.2961, lng: 85.8245 },
  { city: "Indore", lat: 22.7196, lng: 75.8577 },
  { city: "Chandigarh", lat: 30.7333, lng: 76.7794 },
  { city: "Mysuru", lat: 12.2958, lng: 76.6394 },
  { city: "Visakhapatnam", lat: 17.6868, lng: 83.2185 },
  { city: "Vadodara", lat: 22.3072, lng: 73.1812 },
  { city: "Nagpur", lat: 21.1458, lng: 79.0882 },
];

export const ALLOWED_CITIES: string[] = Array.from(
  new Set(KNOWN_AREAS.map((c) => c.city)),
).sort();

export function lookupCoords(city: string, area?: string): CityArea | null {
  if (area) {
    const exact = KNOWN_AREAS.find(
      (c) =>
        c.city.toLowerCase() === city.toLowerCase() &&
        c.area?.toLowerCase() === area.toLowerCase(),
    );
    if (exact) return exact;
  }
  const cityFallback = KNOWN_AREAS.find(
    (c) => c.city.toLowerCase() === city.toLowerCase() && !c.area,
  );
  return cityFallback ?? null;
}
