import fs from 'node:fs/promises'

const randomIndex = (length) => Math.round(Math.random() * (0-length)) + length - 1

/**
 * @returns url of random Icon Image
 */
export default async function generateHeroImg(){
    const data =[]
    try {
        const paths =await fs.readdir('./public/images',{filesOnly:true})
        
        paths.map(path=>data.push(`/images/${path}`))
        return data[randomIndex(paths.length)]
    } catch (error) {
        console.log(error)
    }
}
