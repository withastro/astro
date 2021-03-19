/**
 * Debounce functions for better performance
 * (c) 2018 Chris Ferdinandi, MIT License, https://gomakethings.com
 * @param  {Function} fn The function to debounce
 */
function debounce(fn) {
  // Setup a timer
  var timeout;
  // Return a function to run debounced
  return function () {
    // Setup the arguments
    var context = this;
    var args = arguments;
    // If there's a timer, cancel it
    if (timeout) {
      window.cancelAnimationFrame(timeout);
    }
    // Setup the new requestAnimationFrame()
    timeout = window.requestAnimationFrame(function () {
      fn.apply(context, args);
    });
  };
}

function isScrolledIntoView(el) {
  const { top } = el.getBoundingClientRect();
  const halfHeight = window.innerHeight / 2;
  const isVisible = top <= halfHeight;
  return isVisible;
}

function setActiveToc() {
  if (window.innerWidth < 1240) {
    return;
  }
  if (!tableOfContentsEl) {
    return;
  }

  const headings = [
    ...document.querySelectorAll(
      '.content-body h1, .content-body h2, .content-body h3, .content-body h4',
    ),
  ].filter((el) => !!el.id);
  const scrolledToBeginning = window.scrollY === 0;
  const scrolledToEnd =
    Math.ceil(window.innerHeight + window.scrollY) >=
    Math.ceil(document.body.getBoundingClientRect().height);

  let el;
  if (scrolledToBeginning) {
    el = headings[0]; // if we‘re at the top of the page, highlight the first item
  } else if (scrolledToEnd) {
    el = headings[headings.length - 1]; // if we’re at the end of the page, highlight the last item
  } else {
    el = headings.reverse().find(isScrolledIntoView); // otherwise highlight the one that’s at least halfway up the page
  }

  if (!el) return;

  const elId = el.id;
  const href = `#${elId}`;
  const tocEl = tableOfContentsEl.querySelector(`a[href="${href}"]`);
  // only add the active class once, which will also prevent scroll from re-triggering while scrolling to the same element
  if (!tocEl || tocEl.classList.contains('active')) {
    return;
  }

  tableOfContentsEl.querySelectorAll(`a.active`).forEach((aEl) => {
    if (aEl.getAttribute('href') !== href) aEl.classList.remove('active');
  });

  tocEl.classList.add('active');

  // // update nav on desktop
  // if (window.innerWidth >= 860) {
  //   tocEl.scrollIntoView({behavior: 'smooth'});
  // }
  //   {
  //   top:
  //     tocEl.getBoundingClientRect().top + gridTocEl.scrollTop - PADDING_TOP,
  //   behavior: 'smooth',
  // });
}

const tableOfContentsEl = document.querySelector('.toc');
window.addEventListener('scroll', debounce(setActiveToc));
/* May not be needed:
  window.addEventListener('DOMContentLoaded', (event) => {
    if (!window.location.hash) {
      return;
    }
    const elNeedingScroll = document.getElementById(window.location.hash.substring(1));
    if (!elNeedingScroll) {
      return;
    }
    elNeedingScroll.scrollIntoView();
    elNeedingScroll.classList.add('highlighted');
  });
  */

window.addEventListener('DOMContentLoaded', (event) => {
  if (!tableOfContentsEl) {
    return;
  }
  document.querySelectorAll('.content h3, .content h4').forEach((headerEl) => {
    const linkEl = document.createElement('a');
    // linkEl.setAttribute('target', "_blank");
    linkEl.setAttribute('href', '#' + headerEl.id);
    linkEl.classList.add('header-link');
    linkEl.innerText = '#';
    headerEl.appendChild(linkEl);
  });
  setActiveToc();
});
