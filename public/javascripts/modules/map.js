import axios from 'axios';
import {$} from './bling';

const mapOptions = {
    center: {
        lat: 43.2,
        lng: -79.8
    },
    zoom: 5
};

function loadPlaces(map, lat = 43.2, lng = -79.8) {
    axios.get(`/api/stores/near?lat=${lat}&lng=${lng}`) //get request for the lat and lng passed in
        .then((res) => {
            const places = res.data; //the data that comes back, all the documents 
            if (!places.length) {
                alert('No places found');
                return;
            }

            //create a bounds
            const bounds = new google.maps.LatLngBounds();
            //create info window
            const infoWindow = new google.maps.InfoWindow();

            //create new array markers that for each document, grab the location.coordinates field
            const markers = places.map(place => { //places array response data comes as lng, lat
                //const [placeLng, placeLat] = place.location.coordinates; //array destructuring can also do
                const placeLng = place.location.coordinates[0];
                const placeLat = place.location.coordinates[1];
                const position = {
                    lat: placeLat,
                    lng: placeLng
                };
                bounds.extend(position); //each marker extends the bounds, as it loops through every marker, wraps around all the markers
                const marker = new google.maps.Marker({
                    map: map, //map created from mapDiv and mapOptions
                    position: position //put the marker at this position which is specified
                });
                //the marker location is equal to the each individual doc element
                marker.place = place;
                return marker;
                //each marker has a place object, that has all the information required
            });

            //when marker is clicked, show details
            markers.forEach((marker) => {//iterating through each marker in markers array, and adding a click listener
                //with each click on marker it will create an info window
                marker.addListener('click', function() {
                    const html = 
                    `
                    <div class="popup">
                        <a href="/store/${this.place.slug}">
                            <img src="uploads/${this.place.photo || 'store.png'}" alt="${this.place.name}"/>
                            <p>${this.place.name} - ${this.place.location.address}</p>
                        </a>
                    </div> 
                    `;
                    infoWindow.setContent(html); //the content to be displayed on the info window which is just the name of store
                    infoWindow.open(map, this); //opens info window on the map, and where do you want it to go, the info window will pop ontop of the clicked on marker

            });
                
            });

            //then zoom the map to fit all markers in it
            map.setCenter(bounds.getCenter()); //sets the center of the map, to the center of the bounds
            map.fitBounds(bounds);//zooms in to the bounds
        });
}
                //mapDiv is #map id passed in
function makeMap(mapDiv) { //already have googleapi map loaded under layout.pug scripts
    if (!mapDiv) return; 
    //Make the map
    const map = new google.maps.Map(mapDiv, mapOptions); //pass in the mapDiv #map ID and the mapOptions, creates the map on page
    loadPlaces(map); //which asks for the map, and needs the specified lat and lng, which gets passed to our end point
    const input = $('[name="geolocate"]');
    const autoComplete = new google.maps.places.Autocomplete(input);
    autoComplete.addListener('place_changed', () => {
        const place = autoComplete.getPlace();
        loadPlaces(map, place.geometry.location.lat(), place.geometry.location.lng())
    });
}

export default makeMap;