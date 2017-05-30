const axios = require('axios');
//import axios from 'axios' also works
import dompurify from 'dompurify'; //sanitizes innerHTML, prevents onload javascript 

function searchReultsHTML(stores) {
    return stores.map(function(store) {
        return `<a href="/store/${store.slug}" class="search__result"><strong>${store.name}</strong></a>`;
         //One string html, instead of an array of html strings
    }).join('');

}

function typeAhead(search) {
    if (!search) {
        return;
    }
    const searchInput = search.querySelector('input[name="search"]');
    const searchResults = search.querySelector('.search__results');

    searchInput.on('input', function() {
        if(!this.value) { //if there is no value, quit all search results, and stop search from running
            searchResults.style.display = 'non';
            return; //stops it
        }
        //show the search results
        searchResults.style.display = 'block'; //shows them
       

        axios 
            .get(`/api/search?q=${this.value}`)
            .then(res => {
                if (res.data.length) {
                    const html = dompurify.sanitize(searchReultsHTML(res.data)); //res.data is the resulting stores from the get request
                    searchResults.innerHTML = html; //sets the searchResults variable to equal the html gathered from the
                    //searchResultsHTML function
                    return;
                }
                //tell them nothing came back, no search results
                 searchResults.innerHTML = dompurify.sanitize(`<div class=".search__results">No results for ${this.value} found</div>`);
            }).catch((err) => {
                console.error(err);
            }) ;
    });

    //handle keyboard inputs
    searchInput.on('keyup', (event) => {
        //if they aren't pressing up,down or enter do nothing
        if (![38, 40, 13].includes(event.keyCode)) { //keycodes 38, 40, 13 is up down enter 
            return; 
        }
        const activeClass = 'search__result--active';
        const current = search.querySelector(`.${activeClass}`);
        const items = search.querySelectorAll('.search__result');
        let next;
        if (event.keyCode === 40 && current) { //if they press down keyCode = 40, and they have selected one 
            next = current.nextElementSibling || items[0]; //if you are on the last one, there is no next sibling, 
            //so it will fall back to the first item in the array
            //next = the next element in list
        }else if (event.keyCode === 40) { //if its just down then its the next item
            next = items[0];
        }else if (event.keyCode === 38 && current) { //if someone presses up, and there is a current one
            next = current.previousElementSibling || items[items.length - 1]; //grabs the last item in array
        }else if (event.keyCode === 38) { 
            next = items[items.length -1];
        }else if (event.keyCode === 13 && current.href) { //when they hit enter, and there is a current element with a href value on it, 
            //then redirect to that page
            window.location = current.href; //redirects them to the selected href value
        }

        if (current) {
            current.classList.remove(activeClass) //if we have a current one, remove from active class list
        }
        next.classList.add(activeClass); 
    });

}

export default typeAhead;