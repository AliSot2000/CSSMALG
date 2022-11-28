/**
 * Map Class
 * @class Map
 *
 * @param {string} selector The selector of the element you would like to be the map
 */
class Map {
    _self = null; // Map element
    _road_wrapper = null; // Road Wrapper Element
    _intersection_wrapper = null; // Intersection Wrapper Element
    _agents_wrapper = null; // Agent Wrapper Element
    _roads = null; // Object with all the roads
    _intersections = null; // Object with all the intersections
    _grid = null; // Grid Element
    _loading = null; // Loading Screen
    _grab_points = null; // Grab Points Wrapper
    _snap_points = null; // Snap Points Wrapper
    _agents = null; // Object with all the agents on the map

    _size = null; // Current size of the window

    /**
     * Creates a Map
     * @constructor
     * @param {string} selector The selector of the element you would like to be the map
     */
    constructor(selector = 'div.drawing_area') {
        // Initialize Private Values
        this._self = $(selector); // Set the map element
        this._self.data('map', this); // Set the map data
        this._road_wrapper = $(svgElement("svg")).addClass("roads"); // Create the SVG element
        this._intersection_wrapper = $(svgElement("svg")).addClass("intersections"); // Create the SVG element
        this._roads = {}; // Create the roads object
        this._intersections = {}; // Create the intersections object
        this._agents = {}; // Create the agents object
        this._grid = new Grid(50); // Create the grid object
        this._loading = new Loading(); // Create the loading object

        this._grab_points = $('<div class="grabpoints"></div>'); // Create the grab points wrapper
        this._snap_points = $('<div class="snappoints"></div>'); // Create the snap points wrapper
        this._agents_wrapper = $('<div class="agents"></div>'); // Create the agents wrapper

        this._size = { // Set the size of the window
            width: window.innerWidth, // Set the width
            height: window.innerHeight // Set the height
        }
        this._grid.expand(this._size); // Expand the grid to the size of the window
        this.updateSize(); // Update the size of the map

        this._self.append( // Add the elements to the map
            this._road_wrapper, // Add the road wrapper
            this._intersection_wrapper, // Add the intersection wrapper
            this._grab_points, // Add the grab points wrapper
            this._snap_points, // Add the snap points wrapper
            this._grid.getGrid(), // Add the grid
            this._agents_wrapper // Add the agents wrapper
        );

        // Make the grabpoints element draggable
        $('div.grabpoints').on('mousedown', '.grabbable', {map: this}, function(event) {
            event.preventDefault(); // Prevent the default action
            let target = $(event.target); // Get the target element
            let link = target.data('link'); // Get the road object
            target.addClass('grabbed'); // Add the grabbed class to the target
            $(document.body).addClass('grabbing'); // Change the cursor to grabbing
            link.startDrag(target.data('type'), event.data.map); // Start dragging the road
        });

        // On a resize of the window update the size of the map and grid
        $(window).on('resize', {map: this}, function(event) {
           let map = event.data.map; // Get the map object
           map.recheckSize(); // Recheck the size of the map
        });

        let def = $(svgElement("defs")); // Create the defs element
        let arrow = $(svgElement("marker")); // Create the arrow element
        arrow.attr({ // Create arrow end marker
            id: 'arrow', // Set the id
            viewBox: '0 0 10 10', // Set the viewbox
            refX: '3', // Set the x reference
            refY: '3', // Set the y reference
            orient: 'auto-start-reverse', // Set the orientation
            markerWidth: '6', // Set the width
            markerHeight: '6', // Set the height
        });
        arrow.append($(svgElement("path")).addClass('arrow_head').attr({
            d: 'M 0 0 L 6 3 L 0 6 z', // Create the arrow head
        }));
        def.append(arrow); // Add the arrow element to the defs element

        this._road_wrapper.append(def); // Add the defs element to the SVG element
    }

    /**
     * Generates a random ID for a road or intersection
     * @return {string} A unique random ID
     */
    generateId() {
        let id; // Initialize the id variable
        do {
            id = Math.random().toString(16).slice(2); // Generate a random id
        } while (this.idInUse(id)); // Check if the id is already in use
        return id; // Return the id
    }

    /**
     * Checks if an ID is already in use
     * @param {string} id The ID you would like to check
     * @returns {boolean} True if the ID is in use, false if it is not
     */
    idInUse(id) {
        return id in this._roads || id in this._intersections || id in this._agents; // Check if the id is in use
    }

    /**
     * Adds a road to the map
     * @param {Road} road The road you would like to add
     * @return {Map} Self reference for chaining
     */
    addRoad(road) {
        this._roads[road.getId()] = road; // Add the road to the roads object
        this._road_wrapper.append(road.getElement()); // Add the road to the SVG element
        return this;
    }

    /**
     * Adds an intersection to the map
     * @param {Intersection} intersection The intersection you would like to add
     * @returns {Map} Self reference for chaining
     */
    addIntersection(intersection) {
        this._intersections[intersection.getId()] = intersection; // Add the intersection to the intersections object
        this._intersection_wrapper.append(intersection.getElement()); // Add the intersection to the SVG element
        return this;
    }

    /**
     * Creates a road on the map
     * @param {Point} start The start point of the road
     * @param {Point} end The end point of the road
     * @return {Road} The road object you created
     */
    createRoad(start, end) {
        let road = new Road(this.generateId(), start, end); // Create the road
        this.addRoad(road); // Add the road to the map
        return road;
    }

    /**
     * Adds an intersection to the map
     * @param {Point} point The coordinate of the intersection
     * @returns {Intersection} The intersection object you created
     */
    createIntersection(point) {
        let intersection = new Intersection(this.generateId(), point); // Create the intersection
        this.addIntersection(intersection); // Add the intersection to the map
        return intersection;
    }

    /**
     * Gets a roads from the map
     * @returns {Object} The roads object
     */
    getRoads() {
        return this._roads;
    }

    /**
     * Gets an intersections from the map
     * @returns {Object} The intersections object
     */
    getIntersections() {
        return this._intersections;
    }

    /**
     * Gets a road with a certain id
     * @param {string} id The id of the road you would like to get
     * @returns {Road} The road object
     */
    getRoad(id) {
        return this._roads[id];
    }

    /**
     * Gets an intersection with a certain id
     * @param {string} id The id of the intersection you would like to get
     * @returns {Intersection} The intersection object
     */
    getIntersection(id) {
        return this._intersections[id];
    }

    /**
     * Gets all the agents on this map
     * @returns {Object} The agents on this road
     */
    getAgents() {
        return this._agents;
    }

    /**
     * Gets an agent with a certain id
     * @param {string} id The id of the agent you would like to get
     * @returns {Agent} The agent object
     */
    getAgent(id) {
        return this._agents[id];
    }

    /**
     * Removes a road from the map
     * @param {string} id The id of the road you would like to remove
     */
    removeRoad(id) {
        this.getRoad(id).remove(); // Remove the road from the SVG element
        delete this._roads[id]; // Remove the road from the roads object
    }

    /**
     * Removes an intersection from the map
     * @param {string} id The id of the intersection you would like to remove
     */
    removeIntersection(id) {
        this.getIntersection(id).remove(); // Remove the intersection from the SVG element
        delete this._intersections[id]; // Remove the intersection from the intersections object
    }

    removeAgent(id) {
        this.getAgent(id).remove(); // Remove the agent from the SVG element
        delete this._agents[id]; // Remove the agent from the agents object
    }

    /**
     * Exports the map as a object that can be used to recreate or load the map
     * @returns {Object} The map object
     */
    exportSaveData() {
        let data = { // Initialize the data object
            roads: {}, // Initialize the roads object
            intersections: {}, // Initialize the intersections object
            agents: {}, // Initialize the agents object
            peripherals : {} // Initialize the peripherals object
        };

        for (let id in this._roads) { // Loop through the roads
            data.roads[id] = this._roads[id].exportSaveData(); // Add the road to the roads object
        }

        for (let id in this._intersections) { // Loop through the intersections
            data.intersections[id] = this._intersections[id].exportSaveData(); // Add the intersection to the intersections object
        }

        for (let id in this._agents) { // Loop through the agents
            data.agents[id] = this._agents[id].exportSaveData(); // Add the agent to the agents object
        }

        data.peripherals.date = currentTime(); // Add the save date to the peripherals object
        data.peripherals.type = 'save'; // Add the type of the export
        return data;
    }

    /**
     * Exports the map as an object to be used in the simulation. This is a stripped down version of the save data.
     * However, it is includes a full save data under peripherals.map
     * @returns {Object} The map object
     */
    exportToBeSimulatedData() {
        let data = { // Initialize the data object
            roads: [], // Initialize the roads object
            intersections: [], // Initialize the intersections object
            agents: [], // Initialize the agents object
            peripherals : {} // Initialize the peripherals object
        };

        for (let id in this._roads) { // Loop through the roads
            let roads = this._roads[id].exportToBeSimulatedData(); // Add the road to the roads object
            for (let type in roads) { // Loop through the roads
                data.roads.push(roads[type]); // Add the road to the roads array
            }
        }

        for (let id in this._intersections) { // Loop through the intersections
            data.intersections.push(this._intersections[id].exportToBeSimulatedData()); // Add the intersection to the intersections object
        }

        for (let id in this._agents) { // Loop through the agents
            data.agents.push(this._agents[id].exportSaveData()); // Add the agent to the agents object
        }

        data.peripherals.date = currentTime(); // Add the save date to the peripherals object
        data.peripherals.type = 'to_be_simulated'; // Add the type of the export
        data.peripherals.map = this.exportSaveData(); // Add the map to the peripherals object
        return data;
    }

    /**
     * Loads a map from a save object
     * @param data The save object
     * @param {boolean} with_agents Whether or not to load the agents
     */
    load(data, with_agents = true) {
        switch (data.peripherals.type) {
            case 'save':
                break;
            case 'to_be_simulated':
                data = data.peripherals.map;
                break;
            case 'simulation':
                data = data.setup.map;
                break;
            default:
                alert("This is not a valid save!"); // Alert the user that the data is not a save object
                throw new Error('Invalid Save Data');
                break;
        }

        let count = 0; // Initialize the count variable
        let total = data.intersections.length + data.roads.length + (with_agents ? data.agents.length : 0); // Calculate the total amount of elements to load
        this._loading.show().setMainHeader('Loading Map').setSubHeader('Clearing Old Map').setPercent(0); // Show the loading screen

        this.clear(); // Clear the map

        let has_intersections = !isEmpty(data.intersections); // Check if there are intersections in the save object

        // Add the intersections first, "1 &bull; Tunnel Westseite ",
        //   "15 &bull; Rennpiste ",
        //   "Hexenschuss",
        //   "Schneekringel",
        //   "16 &bull; L&auml;gni ",
        //   "2 &bull; H&uuml;lsen ",
        //   "3 &bull; H&auml;x oben ",
        //   "17 &bull; Piste Nord ",
        //   "50 &bull; Tunnel Westseite Roti Blatte ",
        //   "51 &bull; R&auml;mifl&uuml;o ",
        //   "18 &bull; Bruchji ",
        //   "4 &bull; H&auml;x unten ",
        //   "5 &bull; Grat ",
        //   "19 &bull; Loch ",
        //   "52 &bull; Bromat ",
        //   "53 &bull; F&uuml;lmoos ",
        //   "20 &bull; Sattlen ",
        //   "6 &bull; JO-Piste ",
        //   "7 &bull; Tola oben ",
        //   "21 &bull; T&auml;lli ",
        //   "54 &bull; Ofubiel ",
        //   "55 &bull; Schwiibiel  ",
        //   "22 &bull; Mausefalle ",
        //   "8 &bull; Tola unten ",
        //   "9 &bull; Gletscher ",
        //   "23 &bull; Stafel ",
        //   "24 &bull; Tschuggen-Blatten ",
        //   "25 &bull; Belalp - Tschuggen ",
        //   "24 &bull; Tschuggen-Blatten ",
        //   "10 &bull; Aletsch ",
        //   "11 &bull; F&auml;rrichpista ",
        //   "25 &bull; Belalp-Tschuggen ",
        //   "26 &bull; Chatzulecher ",
        //   "27 &bull; Weisse Meile ",
        //   "28 &bull; Strasse Bruchegg-Bergstation ",
        //   "12 &bull; Kanonenrohr ",
        //   "13 &bull; Tyndall ",
        //   "Snowpark Belalp",
        //   "9a &bull; Aussichtspunkt ",
        //   "Chiematte Skating ",
        //   "Wellenmulde",
        //   "14 &bull; Aletschbord ",
        //   " A &bull; Wanderung von Bergstation Luftseilbahn - Bruchegg - Aletschbord ",
        //   "G &bull; Tschuggen - Mittelstat. Pendelbahn ",
        //   "31 &bull; L&uuml;sgersee-Trail ",
        //   "B &bull; Weisse Meile ",
        //   "36 &bull; Wanderung von Talstation Blatten - Rischinerwald - Stalden ",
        //   "32 &bull; Tyndall-Trail ",
        //   "33 &bull; St. Antonius-Trail ",
        //   "D &bull; Sch&ouml;nbiel-Bruchegg ",
        //   "E &bull; Wanderung von Chiematte - Wolfstola - Bergstation Pendelbahn ",
        //   "34 &bull; Holzji-Trail ",
        //   "35 &bull; Aletschbord - Tyndall - Trail ",
        //   "F &bull; Wanderung von Rischinen - Stausee Gibidum ",
        //   "H &bull; F&auml;rrich",
        //   "E &bull; Sparrhorngrat",
        //   "F &bull; Hohstock",
        //   "D &bull; Sparrhorn",
        //   "C &bull; Bruchegg"
        //   "A &bull; Blatten-Belalp",
        //   "J &bull; Blatten-Chiematte",
        //   "B &bull; Kelchbach",
        //   "I &bull; Hexenland"so that we can add the roads and directly snap them to the intersections
        if (has_intersections) { // Check if there are intersections
            for (let id in data.intersections) { // Loop through the intersections
                this._loading.setSubHeader('Loading Intersection ' + id).setPercent(calculatePercent(count++, total)); // Update the loading screen
                let intersection = data.intersections[id]; // Get the intersection
                let i = new Intersection(id, new Point(intersection.position.x, intersection.position.y)); // Create the intersection
                if (!isEmpty(intersection.isRoundAbout)) { // Check if the intersection is a roundabout, and make old save files compatible
                    i.setRoundAbout(true); // Set the roundabout property
                }
                if (!isEmpty(intersection.traffic_controllers)) { // Check if the intersection has traffic controllers, and make old save files compatible
                    for (let direction in intersection.traffic_controllers) { // Loop through the traffic controllers
                        i.setTrafficControllerInDirection(direction, intersection.traffic_controllers[direction]); // Set the traffic controller
                    }
                }
                this.addIntersection(i); // Add the intersection to the map
            }
        }

        if (!isEmpty(data.roads)) { // Check if there are roads
            for (let id in data.roads) { // Loop through the roads
                this._loading.setSubHeader('Loading Road ' + id).setPercent(calculatePercent(count++, total)); // Update the loading screen
                let road = data.roads[id]; // Get the road
                let r = new Road(id, new Point(road.start.x, road.start.y, road.start.angle), new Point(road.end.x, road.end.y, road.end.angle)); // Create the road
                this.addRoad(r); // Add the road to the map
                r.setLanes(road.lanes); // Set the lanes of the road
                r.changeSpeedLimit(road.speed_limit); // Set the speed limit of the road
                if (has_intersections) { // Check if there are intersections
                    if (!isEmpty(road.intersections.start)) { // Check if the road has an intersection at the start
                        let intersection = this.getIntersection(road.intersections.start.id); // Get the intersection
                        intersection.snapRoad(r, r._start, 'start', road.intersections.start.snap_point); // Snap the road to the intersection
                    }
                    if (!isEmpty(road.intersections.end)) { // Check if the road has an intersection at the end
                        let intersection = this.getIntersection(road.intersections.end.id); // Get the intersection
                        intersection.snapRoad(r, r._end, 'end', road.intersections.end.snap_point); // Snap the road to the intersection
                    }
                }
            }
        }

        if (with_agents && !isEmpty(data.agents)) { // Check if there are agents
            for (let id in data.agents) { // Loop through the agents
                this._loading.setSubHeader('Loading Agent ' + id).setPercent(calculatePercent(count++, total)); // Update the loading screen
                let agent = data.agents[id]; // Get the agent
                let a = new Agent(id, agent.type, this); // Create the agent
                this.addAgent(a); // Add the agent to the map
                a.initialMapPosition(agent.percent_to_end, agent.lane, agent.speed, this.getRoad(agent.road), agent.type); // Set the initial position of the agent
            }
        }
        this.recheckSize(); // Recheck the size of the map
        this._loading.hide(); // Hide the loading screen
    }

    /**
     * Clears the map
     * @returns {Map} Self Reference for chaining
     */
    clear() {
        for (let id in this._agents) { // Loop through the agents
            this.removeAgent(id); // Remove the agent
        }
        for (let id in this._roads) { // Loop through the roads
            this.removeRoad(id); // Remove the road
        }
        for (let id in this._intersections) { // Loop through the intersections
            this.removeIntersection(id); // Remove the intersection
        }
        return this;
    }

    /**
     * Adds an agent to the map
     * @param {Agent} agent The agent to add
     * @returns {Map} Self Reference for chaining
     */
    addAgent(agent) {
        this._agents[agent.getId()] = agent; // Add the agent to the agents object
        this._agents_wrapper.append(agent.getElement()); // Add the agent to the agents wrapper
        return this;
    }

    /**
     * Creates an agent and adds it to the map
     * @param {string} type Type of the agent. Either 'car' or 'bike'
     * @returns {Agent} The created agent
     */
    createAgent(type) {
        let agent = new Agent(this.generateId(), type, this); // Create the agent
        this.addAgent(agent); // Add the agent to the map
        return agent;
    }

    /**
     * Sets all the roads, the grid wrapper, snap points and grab points in or out of simulation mode
     * @param {boolean} set Whether or not to set the roads in simulation mode
     */
    simulationMode(set) {
        for (let id in this._roads) { // Loop through the roads
            this._roads[id].simulationMode(set); // Set the road in simulation mode
        }
        let type = set ? 'none' : 'block'; // Get if wrappers should be set to block or none
        this._snap_points.css('display', type); // Set the display of the snap points
        this._grab_points.css('display', type); // Set the display of the grab points
        this._grid.getGrid().css('display', type); // Set the display of the grid
    }

    /**
     * Updates the size of the map
     * @returns {Map} Self Reference for chaining
     */
    updateSize () {
        this._self.css({ // Set the size of the map
            width: `${this._size.width}px`, // Set the width of the map
            height: `${this._size.height}px` // Set the height of the map
        });
        return this;
    }

    /**
     * Checks if the map needs to be extended and scrolls if a road is placed to close to the edge
     * @param {Point} position Position of the road end point
     * @returns {Map} Self Reference for chaining
     */
    checkNewSize(position) {
        position.x += 200; // Add 200 to the x position
        position.y += 200; // Add 200 to the y position
        let new_size = false; // Whether the size needs to be changed

        if (position.x > this._size.width) { // Check if the x position is larger than the width
            this._size.width = position.x; // Set the width to the x position
            $(document.body).scrollLeft(this._size.width - window.innerWidth) // Scroll to the right
            new_size = true; // Set the size to be changed
        }

        if (position.y > this._size.height) { // Check if the y position is larger than the height
            this._size.height = position.y; // Set the height to the y position
            $(document.body).scrollTop(this._size.height - window.innerHeight) // Scroll to the bottom
            new_size = true; // Set the size to be changed
        }

        if (new_size) { // Check if the size needs to be changed
            this.updateSize(); // Update the size of the map
            this._grid.expand(this._size); // Expand the grid
        }

        return this;
    }

    /**
     * Rechecks the size of the map. This might also make a map smaller. It is not used as much as checkNewSize as it is more expensive.
     * @returns {Map} Self Reference for chaining
     */
    recheckSize() {
        let size = { // Create a new size object
            width: window.innerWidth, // Set the width to the window width
            height: window.innerHeight // Set the height to the window height
        };
        let grabpoints = this._grab_points.children(); // Get the grab points
        for (let i = 0; i < grabpoints.length; i++) { // Loop through the grab points
            let point = $(grabpoints[i]); // Get the grab point
            let x = parseInt(point.css('left')) + 200; // Get the x position of the grab point
            let y = parseInt(point.css('top')) + 200; // Get the y position of the grab point
            if (x > size.width) { // Check if the x position is larger than the width
                size.width = x; // Set the width to the x position
            }
            if (y > size.height) { // Check if the y position is larger than the height
                size.height = y; // Set the height to the y position
            }
        }
        this._size = size; // Set the size of the map
        this._grid.recalculate(size); // Recalculate the grid
        this.updateSize(); // Update the size of the map
        return this;
    }

    /**
     * Renames a road
     * @param {string} old_id The old id of the road
     * @param {string} new_id The new id of the road
     */
    renameRoad (old_id, new_id) {
        let road = this.getRoad(old_id); // Get the road
        this._roads[new_id] = road; // Add the road to the roads object with the new id
        delete this._roads[old_id]; // Remove the road from the roads object with the old id
        road.rename(new_id); // Rename the road
    }

    /**
     * Renames an intersection
     * @param {string} old_id The old id of the intersection
     * @param {string} new_id The new id of the intersection
     */
    renameIntersection (old_id, new_id) {
        let intersection = this.getIntersection(old_id); // Get the intersection
        this._intersections[new_id] = intersection; // Add the intersection to the intersections object with the new id
        delete this._intersections[old_id]; // Remove the intersection from the intersections object with the old id
        intersection.rename(new_id); // Rename the intersection
    }
}