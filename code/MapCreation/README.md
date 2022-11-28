# Map Creation Interface
## Table of Contents

1. [About The Interface](#about-the-interface)
   - [History](#history)
       - [Original Idea](#original-idea)
       - [Result](#result)
       - [Future](#future)
   - [Built With](#built-with)
2. [Getting Started](#getting-started)
3. [Usage](#usage)
4. [Code Structure](#code-structure)
   - [index.html](#indexhtml)
   - [widescreen.css](#widescreencss)
   - [MapCreationWebServer.py](#mapcreationwebserverpy)
   - [main.js](#mainjs)
   - [map.js](#mapjs)
   - [agent.js](#agentjs)
   - [config.js](#configjs)
   - [grid.js](#gridjs)
   - [interface.js](#interfacejs)
   - [intersection.js](#intersectionjs)
   - [road.js](#roadjs)
   - [simulation.js](#simulationjs)
   - [utils.js](#utilsjs)


## About The Interface
The Map-Creation-Interface allows users to create maps for the simulation. The interface can after the simulation has be
calculated also display the results of the simulation.

### History
#### Original Idea
The Map-Creation-Interface was originally thought as a way to create maps for the simulation. This would have been for
the purpose of testing the simulation and the pathfinding algorithms. It was also thought to create maps for the final
project as we were unsure if we would be able to get usable maps of Zürich.

#### Result
As we got the maps of Zürich, we decided to use the interface not only for creating maps for testing, but also for displaying
the calculated simulations. This gave our team a lot of flexibility and allowed us to test the simulation with different
parameters and different maps. It also allowed us to display the simulation in a way that was easy to understand and to
debug. As we had quite a few bugs along the way, this was a very useful tool.

#### Future
The Map-Creation-Interface is still lacking some features that would be useful for other projects. Some parts of the code
are a bit hacky and could be improved. This is something the user doesn't really notice, but it would be nice to have a
cleaner code base. As time goes on, the interface will probably need to be updated to work with newer versions of
browsers, libraries and our own simulation. This is something that will be done as needed.

After the project is submitted the interface will be tracked in a 
[separate repository](https://github.com/IQisMySenpai/CoolMapCreationInterface). 
This will allow us to continue working on it and to add new features.

### Built With
The Map-Creation-Interface was built with following languages:
- [JavaScript](https://www.javascript.com/) - The main language used for the interface
- [Python](https://www.python.org/) - Used for a simple webserver to serve the interface on the localhost

The Map-Creation-Interface uses the following libraries:
- [JQuery](https://jquery.com/) - Used manipulating the DOM. This was used to create the map and to display the simulation
- [HotkeysJS](https://github.com/jaywcjlove/hotkeys) - Used for the keyboard shortcuts
- [Flask](https://flask.palletsprojects.com/en/2.2.x/) - Used for the webserver

## Getting Started
To get a local copy up and running follow these simple steps.
Clone the repository
```sh
git clone git@github.com:AliSot2000/CSSMALG.git
```
Change into the MapCreation directory
```sh
cd CSSMALG/code/MapCreation
```
[1] Start the webserver or [2] open the index.html file in your browser

[1]
```sh
python3 MapCreationWebServer.py
```
[2] *(Note you might have some issues with cookies)*
```sh
firefox index.html
```

## Usage
The Map-Creation-Interface is quite simple to use. The user can create roads and intersections by clicking on the
buttons on the interface or using the shortcuts. The roads and intersections can be moved by dragging them by their
drag-points. In the interface single roads and intersections can be edited to have different names and attributes.
Connecting a road with an intersection happens, when you pull the grab-point to one of the sides of the intersection. The
map can finally be exported as a `.map` export or a `.tsim` export. Old maps can can be imported from one of the following
files formats: `.map`, `.tsim`, or `.sim` (the last one is the format used by the simulation). The simulation can be
loaded by clicking the `Import Simulation` button. The simulation can be played, paused and reset.

## Code Structure
All the code is in the `code/MapCreation` directory. The main file is `index.html`. This file contains all the HTML and
imports all the CSS, JavaScript and Libraries. The JavaScript code is in the `js` directory. The CSS code is in the `css`
directory. The libraries are imported from the web.

The code is split into the following files:
### index.html
This is the main file. It contains all the HTML and imports all the CSS, JavaScript and Libraries. It also contains the
foundation for the map, interface, simulation interface and loading screen.

### widescreen.css
This file contains all the CSS code for the interface. It is used to style the map, interface, simulation interface and
loading screen.

### MapCreationWebServer.py
This is a simple webserver that serves the `index.html` file. It is used to serve the interface on the localhost.
We need this file as some browsers don't allow us to load cookies if we have saved them for a file that is loaded from
the local filesystem.

### main.js
This file contains the main code for loading the interface and the map. It creates globals for these two objects and
creates all the shortcuts for the interface.

The shortcuts are the following:

- <kbd>Ctrl+S</kbd> Export As Save
- <kbd>Ctrl+Shift+S</kbd> Export As Simulation
- <kbd>Ctrl+L</kbd> Import Save
- <kbd>Ctrl+Shift+L</kbd> Import Simulation
- <kbd>Ctrl+1</kbd> Roads Overview
- <kbd>Ctrl+2</kbd> New Road
- <kbd>Ctrl+3</kbd> New Wide Road
- <kbd>Ctrl+4</kbd> Intersections Overview
- <kbd>Ctrl+5</kbd> New Intersection
- <kbd>Ctrl+M</kbd> Overview

### map.js
This file contains all the code for the map. It contains the code for creating the map, adding roads, intersections and
agents are all managed by this file. It lays the foundation for everything that is displayed on the map. It also provides
functions for content loading and exporting as well as verfiying the uniqueness of IDs of roads and intersections.

### agent.js
This file contains the code for the agents. It contains the code for creating the agents, moving them and displaying them
on the map. It also contains the code for the simulation interface to access and animated them.

### config.js
This file contains the configuration for the interface. It contains the default values for the roads and intersections
and the default values for the simulation. 

### grid.js
This file contains the code for the grid. It contains the code for creating the grid, displaying it and updating it on
window change. It also makes sure that the spot that is shown around the cursor is always moved to the center of the
cursor.

### interface.js
This file contains the code for the interface. It contains the code for creating the interface, displaying it and
updating it on window change. It works by calling the same function for each button press and then running a different
function depending on what data is given with the button press.

### intersection.js
This file contains the code for the intersections. It contains the code for creating the intersections, displaying them
and moving them.

### loading.js
This file contains the code for the loading screen. It contains the code for creating the loading screen, displaying it.
It also can be animated during the loading process.

### road.js
This file contains the code for the roads. It contains the code for creating the roads, displaying them and moving them.
It also has supporting functions for animating the agents later in the simulation.

### simulation.js 
This file contains the code for the simulation. It contains the code for creating the simulation, precalculating the
animation and displaying the simulation. It also contains the code for the simulation interface.

### utils.js
This file contains all the code that is supporting and not directly related to any of the other files. It mostly contains
math functions and algorithms that are used in multiple files.