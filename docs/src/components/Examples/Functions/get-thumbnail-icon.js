import fs from 'node:fs/promises'
import randomIndex from './random-index.js'


/**
 * getThumbnailIcon
 * @returns url of random Icon Image from './public/icons'
 */
export default async function getThumbnailIcon(){
    try {
        const data =[]
        const paths =await fs.readdir('./public/icons/space-icons-rounded-small',{filesOnly:true})
        paths.map(path=>data.push(`/icons/space-icons-rounded-small/${path}`))
        return data[randomIndex(paths.length)]
    } catch (error) {
        console.log(`Error Generating Thumbnail : ${error}`)
    }
}
