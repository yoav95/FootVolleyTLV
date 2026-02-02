import gamesData from './games.json';
import usersData from './users.json';

// Mock games data - loaded from games.json
export const games = gamesData;

// Mock users data - loaded from users.json
export const users = usersData;

// Helper function to get games by location
export const getGamesByLocation = (locationId) => {
  return games.filter(game => game.coordinates && 
    game.coordinates.lat === locationId.lat && 
    game.coordinates.lng === locationId.lng);
};
