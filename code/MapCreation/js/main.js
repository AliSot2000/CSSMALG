var map; // The map object
var gui; // The GUI object

// Wait for the page to load before loading the map
window.addEventListener('load', function() {
    map = new Map(); // Create a new map object
    gui = new Interface('div.interface', map); // Create a new GUI object

    // Create Hotkeys for quicker editing
    hotkeys('ctrl+s,ctrl+shift+s,ctrl+l,ctrl+shift+l,ctrl+1,ctrl+2,ctrl+3,ctrl+4,ctrl+5,ctrl+m', function (event, handler) {
        event.preventDefault(); // Prevent the default action
        switch (handler.key) {
            case 'ctrl+s': // Save the map to a file
                gui.exportAsSave();
                break;
            case 'ctrl+shift+s': // Save the map to a "to be simulated" file
                gui.exportForSimulation();
                break;
            case 'ctrl+l': // Load a map from a file
                gui.show();
                gui.upload();
                break;
            case 'ctrl+shift+l': // Load a simulation file
                gui.show();
                gui.simulate();
                break;
            case 'ctrl+1': // Go to the edit roads tab
                gui.show();
                gui.editRoads();
                break;
            case 'ctrl+2': // Add a new road
                gui.show();
                gui.addRoad();
                break;
            case 'ctrl+3': // Add a wide road
                gui.show();
                gui.addRoad(true);
                break;
            case 'ctrl+4': // Go to the edit intersections tab
                gui.show();
                gui.editIntersections();
                break;
            case 'ctrl+5': // Add a new intersection
                gui.show();
                gui.addIntersection();
                break;
            case 'ctrl+m': // Go to the overview tab
                gui.show();
                gui.overview();
                break;
        }
    });
});