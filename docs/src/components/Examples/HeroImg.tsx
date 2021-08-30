import { h, Fragment } from 'preact';
import{useState,useCallback,useEffect} from 'preact/hooks'

const HeroImg= () =>{
    const [img,setImg]=useState()
    
    const getImg = useCallback(async()=>{
        let hero = await generateHeroImg()
        setImg(hero)
        console.log(hero)
    },[img])

    useEffect(()=>{
        getImg()
        console.log(img)
    },[getImg])
    return(
        <>
        <picture class="heroImg">
            <source srcset={img} media="(min-width:100px)"/>
            <img src='https://source.unsplash.com/600x300/?space,cosmos'
            class='glass'/> 
        </picture>    
        </>
    )

}

export default HeroImg