// import {templatesList as data} from './templatesList.ts'
import templateData from './get-examples-data.js'
const data = await templateData()
console.log(data)

// const examplesHeaders = data.map(section=>{
//     let arr = []
//     let obj = {
//         depth:2,
//         slug:section.title,
//         text:section.title,
//     }
//     arr.push(obj)
    
//     section.children.map(example=>{
//         let obj={
//         depth:3,
//         slug:example.text,
//         text:example.text,
//         }
//         arr.push(obj)
//     })
//     return [...arr]
// }).flat(2) 


// export default examplesHeaders