/**
 * Map Class
 * @class Map
 *
 * @param {string} selector The selector of the element you would like to be the map
 */
class Map {
    _self = null;
    _road_wrapper = null;
    _agents_wrapper = null;
    _roads = null;
    _intersections = null;
    _grid = null;
    _grab_points = null;
    _snap_points = null;
    _agents = null;

    /**
     * Creates a Map
     * @constructor
     * @param {string} selector The selector of the element you would like to be the map
     */
    constructor(selector = 'div.drawing_area') {
        // Initialize Private Values
        this._self = $(selector);
        this._self.data('map', this);
        this._road_wrapper = $(svgElement("svg")); // Create the SVG element
        this._intersection_wrapper = $(svgElement("svg")); // Create the SVG element
        this._roads = {}; // Create the roads object
        this._intersections = {}; // Create the intersections object
        this._agents = {}; // Create the agents object
        this._grid = new Grid(50); // Create the grid object
        this._grab_points = $('<div class="grabpoints"></div>');
        this._snap_points = $('<div class="snappoints"></div>');
        this._agents_wrapper = $('<div class="agents"></div>');

        this._self.append(
            this._road_wrapper,
            this._intersection_wrapper,
            this._grab_points,
            this._snap_points,
            this._grid.getGrid(),
            this._agents_wrapper
        ); // Add the SVG element to the map

        // Make the grabpoints element draggable
        $('div.grabpoints').on('mousedown', '.grabbable', function(event) {
            event.preventDefault(); // Prevent the default action
            let target = $(event.target); // Get the target element
            let link = target.data('link'); // Get the road object
            target.addClass('grabbed'); // Add the grabbed class to the target
            $(document.body).addClass('grabbing'); // Change the cursor to grabbing
            link.startDrag(target.data('type')); // Start dragging the road
        });

        // Set the SVG element's attributes
        this._road_wrapper.addClass("roads");
        this._intersection_wrapper.addClass("intersections");

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
     * @param  {Road} road The road you would like to add
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
     * @param {Point} start
     * @param {Point} end
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

    getAgents() {
        return this._agents;
    }

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
     * Loads a map from a save object
     * @param data The save object
     * @param {boolean} with_agents Whether or not to load the agents
     */
    load(data, with_agents = true) {
        if (data.peripherals.type !== 'save') { // Check if the data is a save object
            alert("This is not a valid save!"); // Alert the user that the data is not a save object
            throw new Error('Invalid Save Data');
        }

        this.clear(); // Clear the map

        let has_intersections = !isEmpty(data.intersections); // Check if there are intersections in the save object

        // Add the intersections first, so that we can add the roads and directly snap them to the intersections
        if (has_intersections) { // Check if there are intersections
            for (let id in data.intersections) { // Loop through the intersections
                let intersection = data.intersections[id]; // Get the intersection
                let i = new Intersection(id, new Point(intersection.position.x, intersection.position.y)); // Create the intersection
                this.addIntersection(i); // Add the intersection to the map
            }
        }

        if (!isEmpty(data.roads)) { // Check if there are roads
            for (let id in data.roads) { // Loop through the roads
                let road = data.roads[id]; // Get the road
                let r = new Road(id, new Point(road.start.x, road.start.y, road.start.angle), new Point(road.end.x, road.end.y, road.end.angle)); // Create the road
                this.addRoad(r); // Add the road to the map
                r.setLanes(road.lanes); // Set the lanes of the road
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
                let agent = data.agents[id]; // Get the agent
                let a = new Agent(id, agent.type, this); // Create the agent
                this.addAgent(a); // Add the agent to the map
                a.initialMapPosition(agent.percent_to_end, agent.lane, agent.speed, this.getRoad(agent.road), agent.type); // Set the initial position of the agent
            }
        }

        alert('Finished loading save of ' + data.peripherals.date); // Notify the user that the save has been loaded
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

    addAgent(agent) {
        this._agents[agent.getId()] = agent;
        this._agents_wrapper.append(agent.getElement());
        return this;
    }

    createAgent(type) {
        let agent;
        agent = new Agent(this.generateId(), type, this);
        this.addAgent(agent);
        return agent;
    }

    simulationMode(set) {
        for (let id in this._roads) {
            this._roads[id].simulationMode(set);
        }
        let type = set ? 'none' : 'block';
        this._snap_points.css('display', type);
        this._grab_points.css('display', type);
        this._grid.getGrid().css('display', type);
    }
}