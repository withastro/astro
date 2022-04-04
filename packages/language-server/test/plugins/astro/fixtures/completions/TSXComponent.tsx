interface Props {
	name: string
}

export default function Hello({name}: Props){
	return <div>{name}</div>
}
