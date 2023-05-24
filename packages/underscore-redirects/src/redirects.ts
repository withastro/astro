import { print } from './print.js';

export type RedirectDefinition = {
	dynamic: boolean;
	input: string;
	target: string;
	weight: 0 | 1 | 2;
	status: number;
};

export class Redirects {
	public definitions: RedirectDefinition[] = [];
	public minInputLength = 4;
	public minTargetLength = 4;

	add(defn: RedirectDefinition) {
		// Find the longest input, so we can format things nicely
		if (defn.input.length > this.minInputLength) {
			this.minInputLength = defn.input.length;
		}
		// Same for the target
		if (defn.target.length > this.minTargetLength) {
			this.minTargetLength = defn.target.length;
		}

		binaryInsert(this.definitions, defn, (a, b) => {
			return a.weight > b.weight;
		});
	}

	print(): string {
		return print(this.definitions, this.minInputLength, this.minTargetLength);
	}

	empty(): boolean {
		return this.definitions.length === 0;
	}
}

function binaryInsert<T>(sorted: T[], item: T, comparator: (a: T, b: T) => boolean) {
  if(sorted.length === 0) {
    sorted.push(item);
    return 0;
  }
  let low = 0, high = sorted.length - 1, mid = 0;
  while (low <= high) {
    mid = low + (high - low >> 1);
    if(comparator(sorted[mid], item)) {
      low = mid + 1;
    } else {
      high = mid -1;
    }
  }

  if(comparator(sorted[mid], item)) {
    mid++;
  }

  sorted.splice(mid, 0, item);
  return mid;
}
