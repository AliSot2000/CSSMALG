var map; // The map object
var gui; // The GUI object
var car;

window.addEventListener('load', function() { // When the window has finished loading
    map = new Map(); // Create a new map object
    gui = new Interface('div.interface', map); // Create a new GUI object
});