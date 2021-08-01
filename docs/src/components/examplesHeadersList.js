import {templatesList as data} from '../templatesList.ts'
const examplesHeaders = data.map(section=>{
    let arr = []
    let obj = {
        depth:2,
        slug:section.title,
        text:section.title,
    }
    arr.push(obj)
    let childObj= section.children.map(example=>{
        let ob={
        depth:3,
        slug:example.text,
        text:example.text,
        }
        arr.push(ob)
    })
    return [...arr]
}).flat(2) 


export {examplesHeaders}