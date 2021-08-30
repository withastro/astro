import glob from 'tiny-glob'
import fs from 'fs'


/**
 * @returns list of templates's package.json from the examples folder
 */
async function getPkgJSON(){
    let data = []
    const paths = await glob('../examples/*/package.json',{filesOnly:true})
    paths.map((files)=>{
        let readFile =  fs.readFileSync(files)
        let json = JSON.parse(readFile)
        return data.push({...json})
    })
    return data
}

/**
 * @returns list of templates readme from the examples folder
 */
async function getExamplesREADME(){
    let data = []
    const paths = await glob('../examples/*/README.md',{filesOnly:true})
    paths.map( (files)=>{
        const buffer = fs.readFileSync(files)
        let text = buffer.toString()  
        let fileName = files.split('/')[2]
        data.push({fileName,text})
    })
    return data
}

/**
 * @returns list of template data
 */
async function getTemplateData(){ 
    let data = []
    const pkgJSONS =  await getPkgJSON()
    pkgJSONS.map((pkg)=>{
        let {name} = pkg
        name = name.replace('@example/','')
        let obj = {
            name,
            pkgJSON: pkg,
            readme:undefined,
        }
        data.push(obj)
    })
    return data
}


/**
 * 
 * @returns Array of Template objects, 
 */
async function templateData() {
    let readmeData = await getExamplesREADME()
    let templateData = await getTemplateData()
    let arr = templateData.map((obj,i)=>{
        let {name} = obj
        readmeData.map((file)=>{
            let {fileName,text} = file
            if(name === fileName)
            obj.readme = text
        })

        return obj
    })
    return arr
}

export default templateData

