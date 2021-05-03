import React, {FC, useEffect} from 'react';
import { prepareTemplate, isEmpty, emptyDir } from '../utils';
import Header from './Header';
import Install from './Install';
import ProjectName from './ProjectName';
import Template from './Template';
import Confirm from './Confirm';
import Finalize from './Finalize';

interface Context {
	use: 'npm'|'yarn';
	run: boolean;
	projectExists?: boolean;
	force?: boolean;
	projectName?: string;
	template?: string;
	templates: string[];
	ready?: boolean;
}

const getStep = ({ projectName, projectExists: exists, template, force, ready }: Context) => {
    switch (true) {
        case !projectName: return {
			key: 'projectName',
			Component: ProjectName
		};
		case projectName && exists === true && typeof force === 'undefined': return {
			key: 'force',
			Component: Confirm
		}
        case (exists === false || force) && !template: return {
			key: 'template',
			Component: Template
		};
        case !ready: return {
			key: 'install',
			Component: Install
		};
		default: return {
			key: 'final',
			Component: Finalize
		}
    }
}

const App: FC<{ context: Context }> = ({ context }) => {
	const [state, setState] = React.useState(context);
	const step = React.useRef(getStep(context));
	const onSubmit = (value: string|boolean) => {
		const { key } = step.current;
		const newState = { ...state, [key]: value };
		step.current = getStep(newState)
		setState(newState)
	}

	useEffect(() => {
		let isSubscribed = true
		if (state.projectName && typeof state.projectExists === 'undefined') {
			const newState = { ...state, projectExists: !isEmpty(state.projectName) };
			step.current = getStep(newState)
			if (isSubscribed) {
				setState(newState);
			}
		}

		if (state.projectName && (state.projectExists === false || state.force) && state.template) {
			if (state.force) emptyDir(state.projectName);
			prepareTemplate(context.use, state.template, state.projectName).then(() => {
				if (isSubscribed) {
					setState(v => { 
						const newState = {...v, ready: true };
						step.current = getStep(newState);
						return newState;
					});
				}
			});
		}

		return () => {
			isSubscribed = false;
		}
	}, [state]);
	const { Component } = step.current;

	return (
		<>
			<Header context={state}/>
			<Component context={state} onSubmit={onSubmit} />
		</>
	)
};

export default App;
