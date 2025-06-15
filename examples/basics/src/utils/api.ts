interface Match {
    id: number;
    homeTeam: string;
    awayTeam: string;
    time: string;
    venue: string;
    group: string;
    homeFlag: string;
    awayFlag: string;
    homeScore?: number;
    awayScore?: number;
    statistics?: {
        possession: {
            home: number;
            away: number;
        };
        shots: {
            home: number;
            away: number;
        };
        shotsOnTarget: {
            home: number;
            away: number;
        };
        corners: {
            home: number;
            away: number;
        };
        fouls: {
            home: number;
            away: number;
        };
    };
    status: 'scheduled' | 'live' | 'finished';
    weather?: {
        temperature: number;
        condition: string;
        humidity: number;
    };
}

interface ScheduleDay {
    date: string;
    matches: Match[];
}

export async function fetchFIFASchedule(): Promise<ScheduleDay[]> {
    try {
        // Replace this URL with the actual FIFA API endpoint
        const response = await fetch('https://api.fifa.com/worldcup/2025/schedule');
        
        if (!response.ok) {
            throw new Error('Failed to fetch schedule');
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching FIFA schedule:', error);
        
        // Return sample data for development/fallback
        return getSampleData();
    }
}

// Sample data function for development and fallback
function getSampleData(): ScheduleDay[] {
    return [
        {
            date: '2025-06-20',
            matches: [
                {
                    id: 1,
                    homeTeam: 'Brazil',
                    awayTeam: 'France',
                    time: '20:00',
                    venue: 'Maracanã Stadium, Rio de Janeiro',
                    group: 'A',
                    homeFlag: '🇧🇷',
                    awayFlag: '🇫🇷',
                    homeScore: 2,
                    awayScore: 1,
                    status: 'live',
                    statistics: {
                        possession: { home: 55, away: 45 },
                        shots: { home: 15, away: 12 },
                        shotsOnTarget: { home: 8, away: 5 },
                        corners: { home: 6, away: 4 },
                        fouls: { home: 10, away: 12 }
                    },
                    weather: {
                        temperature: 24,
                        condition: 'Clear',
                        humidity: 65
                    }
                },
                {
                    id: 2,
                    homeTeam: 'Germany',
                    awayTeam: 'Spain',
                    time: '17:00',
                    venue: 'Allianz Arena, Munich',
                    group: 'B',
                    homeFlag: '🇩🇪',
                    awayFlag: '🇪🇸',
                    status: 'scheduled',
                    weather: {
                        temperature: 22,
                        condition: 'Partly Cloudy',
                        humidity: 70
                    }
                }
            ]
        },
        {
            date: '2025-06-21',
            matches: [
                {
                    id: 3,
                    homeTeam: 'Argentina',
                    awayTeam: 'England',
                    time: '19:00',
                    venue: 'Lusail Stadium, Qatar',
                    group: 'C',
                    homeFlag: '🇦🇷',
                    awayFlag: '🇬🇧',
                    homeScore: 3,
                    awayScore: 2,
                    status: 'finished',
                    statistics: {
                        possession: { home: 60, away: 40 },
                        shots: { home: 18, away: 10 },
                        shotsOnTarget: { home: 9, away: 4 },
                        corners: { home: 8, away: 3 },
                        fouls: { home: 8, away: 14 }
                    },
                    weather: {
                        temperature: 28,
                        condition: 'Hot',
                        humidity: 55
                    }
                }
            ]
        }
    ];
}
