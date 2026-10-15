import { getCount } from "./other";

export class MiscUtils {
	nestedImportCount() {
		return getCount();
	}

  arrayToString(arr) {
    return arr.join(" ");
  }
}
