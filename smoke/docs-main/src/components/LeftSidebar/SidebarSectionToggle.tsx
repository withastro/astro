import { h } from 'preact';
import { useState } from 'preact/hooks';
import './SidebarSectionToggle.css';

const SidebarSectionToggle = ({ defaultActiveTab }) => {
	const [activeTab, setActiveTab] = useState(defaultActiveTab);
	function toggleType(type: 'learn' | 'api') {
		document.querySelectorAll(`li.nav-group`).forEach((el) => el.classList.remove('active'));
		document.querySelectorAll(`li.nav-group.${type}`).forEach((el) => el.classList.add('active'));
		setActiveTab(type);
	}
	return (
		<div class="SidebarSectionToggle">
			<button class={activeTab === 'learn' ? 'active' : ''} onClick={() => toggleType('learn')}>
				Learn
			</button>
			<button class={activeTab === 'api' ? 'active' : ''} onClick={() => toggleType('api')}>
				API
			</button>
		</div>
	);
};

export default SidebarSectionToggle;
