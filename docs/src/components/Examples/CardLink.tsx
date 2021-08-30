import { JSX } from '@babel/types';
import type { Component } from 'preact';
import { h, Fragment } from 'preact';
import { useRef } from 'preact/hooks';

export type CardLinkProps ={
    href:string
    name:string
    children:JSX | JSX[]
}

const CardLink:Component<CardLinkProps>=({href,name,children}:CardLinkProps):JSX.Element=>{
    const Card = useRef(null)
    /**
     * Set Title Attribute when Hovering over Card
     * @param e - Mouse Enter Event
     */
    function handleOnMouseEnter(e){
        const cardBody = Card.current.querySelector('.card-body')
        const cardThumb = Card.current.querySelector('.icon-image')
        const cardImg = Card.current.querySelector('.heroImg')

        if(e.target === cardBody || e.target === cardThumb || e.target === cardImg ) {
            e.target.setAttribute('title',`Click to find out more about our ${name} template`)
        }
    
        
    }
    /**
     * Click Link Card to Page
     * @param e - Click Event
     * @returns new window location
     */
    function handleOnClick(e){
        const card = e.target
        const mainLink = card.querySelector('.main-link')
        const clickableArea = ['.card-body','.icon-image','.heroImg']
        for(let area of clickableArea){
            if(e.currentTarget.classList.contains(area)) {
                return mainLink.click()
            }
        }
    }
    return(
        <div  ref={Card} onClick={handleOnClick} onMouseOver={handleOnMouseEnter} aria-label={`Clickable Card taking you directly to the ${name} template`} tabIndex="0">
            {children}
        </div>
    )
}

export default CardLink