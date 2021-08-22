import { JSX } from '@babel/types';
import type { Component } from 'preact';
import { h, Fragment } from 'preact';
import { useRef } from 'preact/hooks';

export type CardLinkProps ={
    name:string
    children:JSX.Element | JSX.Element[]
}

const CardLink:Component<CardLinkProps>=({name,children}:CardLinkProps):JSX.Element=>{
    const Card = useRef(null)
    /**
     * Set Title Attribute when Hovering over Card
     * @param e - Mouse Enter Event
     */
    function handleOnMouseEnter(e){
        const cardBody = Card.current.querySelector('.card-body')
        const cardThumb = Card.current.querySelector('.icon-image')
        const cardImg = Card.current.querySelector('.glass')

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
        
        for(let area of clickableArea){
            if(e.target.classList.contains(area)) {
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