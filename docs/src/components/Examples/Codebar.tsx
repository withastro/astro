import type { FunctionalComponent } from 'preact';
import { h, Fragment } from 'preact';
import{useState,useRef,useEffect} from 'preact/hooks'

export type CodeBar ={
    content:string
    command:string
}

const CodeBar:FunctionalComponent=({content,command})=>{
    const [clicked,setClicked]=useState(false)
    const [titleTxt,setTitleTxt] = useState("Copy Command to Clipboard")
    useEffect(()=>{
        const timeout = setTimeout(()=>{
            setClicked(false)
            setTitleTxt("Copy Command to Clipboard")
        },1500)
        return ()=> clearTimeout(timeout)
    },[clicked])
    /**
     * 
     */
    function onClick(e){
        setClicked(true)
        setTitleTxt("Copied to Clipboard!")
        const titleAttr= e.target
        const clipboard = navigator.clipboard
        return clipboard.writeText(`${command}`)
    }

    return(
        <div style="cursor:pointer;" onClick={onClick} title={titleTxt} > 
            <code >
                {content}
            </code>
        </div>
    )
}

export default CodeBar



