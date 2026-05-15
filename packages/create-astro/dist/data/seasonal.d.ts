interface SeasonalHouston {
	hats?: string[];
	ties?: string[];
	messages: string[];
}
export default function getSeasonalHouston({ fancy }: { fancy?: boolean }): SeasonalHouston;
export {};
