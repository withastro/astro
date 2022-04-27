import clickToComponent from "./click-to-component.js";

class AstroDevToolsInstance {
	init() {
		clickToComponent();
	}
}

export const AstroDevTools = new AstroDevToolsInstance();
