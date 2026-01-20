// Beach locations in Israel
export const beachLocations = [
  {
    id: 'tel-aviv-hilton',
    name: 'Hilton Beach',
    city: 'Tel Aviv',
    description: 'Popular beach with great footvolley courts',
    coordinates: { lat: 32.0853, lng: 34.7692 }
  },
  {
    id: 'tel-aviv-gordon',
    name: 'Gordon Beach',
    city: 'Tel Aviv',
    description: 'Central location with active sports community',
    coordinates: { lat: 32.0809, lng: 34.7697 }
  },
  {
    id: 'herzliya',
    name: 'Herzliya Beach',
    city: 'Herzliya',
    description: 'Clean beach with volleyball nets',
    coordinates: { lat: 32.1667, lng: 34.8000 }
  },
  {
    id: 'netanya',
    name: 'Netanya Beach',
    city: 'Netanya',
    description: 'Wide sandy beach perfect for beach sports',
    coordinates: { lat: 32.3315, lng: 34.8534 }
  },
  {
    id: 'haifa',
    name: 'Dado Beach',
    city: 'Haifa',
    description: 'North coast beach with sports facilities',
    coordinates: { lat: 32.8191, lng: 34.9983 }
  }
];

// Mock games data
export const games = [
  {
    id: '1',
    locationId: 'tel-aviv-hilton',
    date: '2026-01-22',
    time: '17:00',
    organizer: 'David Cohen',
    playersNeeded: 4,
    currentPlayers: 2,
    level: 'Intermediate',
    notes: 'Bring your own ball!'
  },
  {
    id: '2',
    locationId: 'tel-aviv-hilton',
    date: '2026-01-24',
    time: '18:00',
    organizer: 'Sarah Levy',
    playersNeeded: 6,
    currentPlayers: 4,
    level: 'Advanced',
    notes: 'Competitive game, experienced players only'
  },
  {
    id: '3',
    locationId: 'tel-aviv-gordon',
    date: '2026-01-23',
    time: '16:30',
    organizer: 'Michael Ben-David',
    playersNeeded: 4,
    currentPlayers: 1,
    level: 'Beginner',
    notes: 'Beginners welcome! We\'ll teach you the basics'
  },
  {
    id: '4',
    locationId: 'herzliya',
    date: '2026-01-25',
    time: '17:00',
    organizer: 'Rachel Mizrahi',
    playersNeeded: 4,
    currentPlayers: 3,
    level: 'Intermediate',
    notes: 'Sunset game session'
  },
  {
    id: '5',
    locationId: 'netanya',
    date: '2026-01-26',
    time: '10:00',
    organizer: 'Yoni Goldberg',
    playersNeeded: 6,
    currentPlayers: 2,
    level: 'All Levels',
    notes: 'Morning game, coffee after!'
  }
];

// Helper function to get games by location
export const getGamesByLocation = (locationId) => {
  return games.filter(game => game.locationId === locationId);
};

// Helper function to get location by id
export const getLocationById = (locationId) => {
  return beachLocations.find(location => location.id === locationId);
};
