import gamesData from './games.json';

// Mock games data - loaded from games.json
export const games = gamesData;

// Helper function to get games by location
export const getGamesByLocation = (locationId) => {
  return games.filter(game => game.coordinates && 
    game.coordinates.lat === locationId.lat && 
    game.coordinates.lng === locationId.lng);
};
