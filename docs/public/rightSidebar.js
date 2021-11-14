/* For keeping the state of previous H2,H3,H4 that in the viewport */
let previousH2;
let previousH3;
let previousH4;

// This going to be our Intersection observer
let observer;

// Class to be applied H2,H3,H4 those are in viewport
const activeClass = {
  H2: ['active-link-color'],
  H3: ['active-link-color'],
  H4: ['active-link-color'],
};

// Classes to be applied when H2,H3,H4 are not in viewport
const inActiveClass = {
  H2: ['inactive-link-color'],
  H3: ['inactive-link-color'],
  H4: ['inactive-link-color'],
};

// getRelativeLinkElement()
// This will return Element relative to the viewport element
//  ⭐ document.getElementById( elementId + "-link") is a `p` tag by design
function getRelativeLinkElement(elementId) {
  return document.getElementById(elementId + '-link');
}

// Utility functions
function removeClass(elementId, Classes) {
  document.getElementById(elementId).classList.remove(...Classes);
}

function addClass(elementId, Classes) {
  document.getElementById(elementId).classList.add(...Classes);
}

function applyActiveClass(elementName, elementId) {
  removeClass(elementId, inActiveClass[elementName]);
  addClass(elementId, activeClass[elementName]);
  // Just a simple code to apply borderLeftColor to respective elements when in viewport
  document.getElementById(elementId).parentElement.style.borderLeftColor =
    'var(--theme-accent)';
}

function applyInactiveClass(elementName, elementId) {
  removeClass(elementId, activeClass[elementName]);
  addClass(elementId, inActiveClass[elementName]);
  document.getElementById(elementId).parentElement.style.borderLeftColor =
    'var(--theme-divider)';
}

// isUndefined
function isDefined(value) {
  return value !== undefined;
}

function unsetAppliedClass(...previousElements) {
  previousElements.forEach((previousElement) => {
    isDefined(previousElement)
      ? applyInactiveClass('H2', previousElement.id)
      : null;
  });
}

// getParentPTag()
function getParentPTag(elementId) {
  return getRelativeLinkElement(elementId).parentElement.parentElement // `p` tag // `a` tag //  `li` tag
    .parentElement.previousElementSibling.firstElementChild; // `ul` tag // Parent `a` tag // Parent's `p` tag
}

// isChildless is checking for ul element is there or not
/* 
  document.getElementById(elementId) --> `p` tag
  .parentElement --> `a` tag
  .nextElementSibling --> `ul` tag is not childless
*/
function isChildless(elementId) {
  return (
    getRelativeLinkElement(elementId).parentElement.nextElementSibling === null
  );
}

//  nextElement()

// Intersection Observer is insialized
observer = new IntersectionObserver(
  (entries, observer) => {
    for (let index = 0; index < entries.length; index++) {
      let element = entries[index];
      if (element.isIntersecting) {
        let elementId = element.target.id;
        // Is the element is Intersecting or Not
        switch (element.target.tagName) {
          case 'H2':
            // Checking for, Is H2 is alone or not
            if (!isChildless(elementId)) return;
            // If it's childless then return nothing
            if (previousH2 !== getRelativeLinkElement(elementId)) {
              unsetAppliedClass(previousH2, previousH3);
              previousH2 = getRelativeLinkElement(elementId);
              applyActiveClass('H2', previousH2.id);
            }
            break;
          case 'H3':
            if (previousH2 !== getParentPTag(elementId)) {
              unsetAppliedClass(previousH2, previousH3);
              previousH2 = getParentPTag(elementId);
              applyActiveClass('H2', previousH2.id);
            }
            if (previousH3 !== getRelativeLinkElement(elementId)) {
              unsetAppliedClass(previousH3);
              previousH3 = getRelativeLinkElement(elementId);
              applyActiveClass('H3', previousH3.id);
            }
            break;
          case 'H4':
            if (previousH3 !== getParentPTag(elementId)) {
              unsetAppliedClass(previousH3, previousH4);
              previousH3 = getParentPTag(elementId);
              applyActiveClass('H3', previousH3.id);
            }
            if (previousH4 !== getRelativeLinkElement(elementId)) {
              unsetAppliedClass(previousH4);
              previousH4 = getRelativeLinkElement(elementId);
              applyActiveClass('H4', previousH4.id);
            }
            break;
          default:
            break;
        }
      }
    }
  },
  {
    root: document.querySelector('root'),
    rootMargin: '0px',
    threshold: 0,
  }
);

for (let index = 0; index < headers.length; index++) {
  observer.observe(document.getElementById(headers[index]['slug']));
  // observer.observe( headers[index] );
}

/*
To improve Predictability,
HTML DOM TREE Examplanation
EveryList Item in RightSideBar will look like 
<ul>
  <TableItem uid="" link="" title="" depth="" >
    <ul>
      <TableItem uid="" link="" title="" depth="" >
        <ul>
          <TableItem  uid="" link="" title="" depth="" />
          ...        
        </ul>
      </TableItem>
  <TableItem />
    </ul>
  </TableItem>
  <TableItem />
  <TableItem />
  ...
</ul>

And Each TableItem is nothing but,
<li>
  <a href={link} class={`header-link depth-${depth}`}>
    <p id={uid}>{title}</p>
  </a>
  <slot/> 
</li>


Basically,
A TableContentWrapper wrapping TableContentItem
where in Each TableCOntentItem you can define more TableContentWrapper and SO, on

Basically I am making until depth of 1 to 3 covering H2 tag, H3 tag, H4 tag.

Benifits of this is that 
I now know that which TableContentItem is wrapped in Which TableCOntentWrapper

>> From that TableContentItem I can make that TableContentWrapper Highglight

Just a simple way is 

document.getElementById(elementId + "-link") --> This is `p` tag
                .parentElement --> Then this is `a` tag
                .parentElement --> This is `li` tag
                .parentElement --> this is `ul` tag
                .previousElementSibling --> this is `a` tag 
                .firstElementChild --> `p` tag
<li>
  <a>
    <p></p>  
  </a>
  <ul>
    ...
    <li>
      <a href={link} class={`header-link depth-${depth}`}> 
        <p id={uid}>{title}</p>
      </a>
      <slot/> 
    </li>
    ...
  </ul>
</li>

document.getElementById(elementId + "-link") --> `p` tag
                .parentElement --> `a` tag
                .nextElementSibling --> if ul present then `ul` tag but not then `null` 
*/
