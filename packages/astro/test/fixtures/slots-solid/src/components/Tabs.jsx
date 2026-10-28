export default function Tabs(props) {
	return <div id={props.id}>{props[props.active]}</div>;
}
