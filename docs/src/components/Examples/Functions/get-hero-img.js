import fs from 'node:fs/promises'
import randomIndex from './random-index'


/**
 * getHeroImg
 * @returns url of random Hero Image from './public/images'
 */
export default async function getHeroImg(){
    try {
        const data =[]
        const paths =await fs.readdir('./public/images',{filesOnly:true})
        paths.map(path=>data.push(`/images/${path}`))
        return data[randomIndex(paths.length)]
    } catch (error) {
        console.log(error)
    }
}
