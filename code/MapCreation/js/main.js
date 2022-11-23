var map; // The map object
var gui; // The GUI object
var car;

// Wait for the page to load before loading the map
window.addEventListener('load', function() {
    map = new Map(); // Create a new map object
    gui = new Interface('div.interface', map); // Create a new GUI object
});