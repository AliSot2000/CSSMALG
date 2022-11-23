var map; // The map object
var gui; // The GUI object
var car;

// Wait for the page to load before loading the map
window.addEventListener('load', function() {
    map = new Map(); // Create a new map object
    gui = new Interface('div.interface', map); // Create a new GUI object

    // Create Hotkeys for quicker editing
    hotkeys('ctrl+s,ctrl+shift+s,ctrl+l,ctrl+shift+l,ctrl+1,ctrl+2,ctrl+3,ctrl+4,ctrl+5,ctrl+m', function (event, handler) {
        event.preventDefault(); // Prevent the default action
        switch (handler.key) {
            case 'ctrl+s':
                gui.exportAsSave();
                break;
            case 'ctrl+shift+s':
                gui.exportForSimulation();
                break;
            case 'ctrl+l':
                gui.show();
                gui.upload();
                break;
            case 'ctrl+shift+l':
                gui.show();
                gui.simulate();
                break;
            case 'ctrl+1':
                gui.show();
                gui.editRoads();
                break;
            case 'ctrl+2':
                gui.show();
                gui.addRoad();
                break;
            case 'ctrl+3':
                gui.show();
                gui.addRoad(true);
                break;
            case 'ctrl+4':
                gui.show();
                gui.editIntersections();
                break;
            case 'ctrl+5':
                gui.show();
                gui.addIntersection();
                break;
            case 'ctrl+m':
                gui.show();
                gui.overview();
                break;
        }
    });
});