import capitalise from './function-capitalise.js'

export default function formatTemplateName(name){
    return name.includes('multiple')
    ?
    `${capitalise(name.split('-')[1])} ${capitalise(name.split('-')[0])}'s`
    :
    name
        .split('-')
        .map((str)=>(
            str.replace('with','')
        ))
        .map((str)=>(
            str.replace('framework','')
        ))
        .map((str)=>(capitalise(str)))
        .join(' ')
        .trim()
}