import fs from 'node:fs/promises'

const randomIndex = (length) => Math.round(Math.random() * (0-length)) + length

/**
 * @returns url of random Icon Image
 */
export default async function generateThumbnailIcon(){
    const data =[]
    const paths =await fs.readdir('./public/icons/space-icons-rounded-small',{filesOnly:true})
    paths.map(path=>data.push(`/icons/space-icons-rounded-small/${path}`))
    return data[randomIndex(paths.length)]
}
