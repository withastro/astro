import {templatesList as data} from '../templatesList.ts'
const examplesHeaders = data.map(section=>{
    let obj = {
        depth:2,
        slug:section.title,
        text:section.title,
    }
    let childObj= section.children.map(example=>(
        {
        depth:3,
        slug:example.text,
        text:example.text,
        }
    ))
    return {...obj,...childObj}
}) 

export default examplesHeaders