export interface ChessComGame {
  url: string;
  pgn: string;
  time_control: string;
  end_time: number;
  rated: boolean;
  tcn: string;
  uuid: string;
  initial_setup: string;
  fen: string;
  time_class: string;
  rules: string;
  white: {
    rating: number;
    result: string;
    '@id': string;
    username: string;
    uuid: string;
  };
  black: {
    rating: number;
    result: string;
    '@id': string;
    username: string;
    uuid: string;
  };
}

export async function fetchRecentGames(username: string): Promise<ChessComGame[]> {
  try {
    // Fetch archives list
    const archivesRes = await fetch(`https://api.chess.com/pub/player/${username}/games/archives`);
    if (!archivesRes.ok) throw new Error('Failed to fetch archives');
    const archivesData = await archivesRes.json();
    
    if (!archivesData.archives || archivesData.archives.length === 0) {
      return [];
    }

    // Fetch the most recent month's games
    const latestArchiveUrl = archivesData.archives[archivesData.archives.length - 1];
    const gamesRes = await fetch(latestArchiveUrl);
    if (!gamesRes.ok) throw new Error('Failed to fetch games');
    const gamesData = await gamesRes.json();

    // Return the last 20 games, sorted by end_time descending
    return (gamesData.games || [])
      .sort((a: ChessComGame, b: ChessComGame) => b.end_time - a.end_time)
      .slice(0, 20);
  } catch (error) {
    console.error('Error fetching games:', error);
    throw error;
  }
}
