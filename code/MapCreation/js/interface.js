/**
 * The interface class
 * @class Interface
 * @param {string} selector The selector for the interface
 * @param {Map} map The map that is connected to the interface
 */
class Interface {
    _self = null;
    _toggle_button = null;
    _body = null;
    _map = null;

    /**
     * Constructs a new Interface
     * @constructor
     * @param {string} selector The selector for the interface
     * @param {Map} map The map that is connected to the interface
     */
    constructor(selector = 'div.interface', map = null) {
        this._self = $(selector).data('interface', this); // The interface element
        this._map = map; // The map that is connected to the interface
        this._simulation_interface = new Simulation('div.simulation', this._map, this); // The simulation interface

        this.createElements() // Create the elements for the interface
        this.overview(); // Show the overview
    }

    /**
     * Creates the elements for the interface
     * @returns {Interface} Self reference for chaining
     */
    createElements() {
        this._toggle_button = $('<button>&#9664;</button>').addClass('interface_toggle').data('interface', this); // The toggle button
        this._toggle_button.on('click', function() { // Add the click event
            $(this).data('interface').toggle(); // Toggle the interface
        });

        // Add the click event for buttons that are clicked in the interface
        this._body = $('<div></div>').addClass('interface_body').on('click', '.interface_button, .interface_small_button, .interface_delete', {interface: this}, function(event) {
            event.data.interface.runCommand($(this).html(), $(this).data(), $(this));
        });

        this._self.append(this._toggle_button, this._body); // Add the elements to the interface

        return this;
    }

    /**
     * Toggles the interface
     * @returns {Interface} Self reference for chaining
     */
    toggle() {
        if (this._self.hasClass('interface_hidden')) {
            this._self.removeClass('interface_hidden');
            this._toggle_button.html('&#9654;');
        } else {
            this._self.addClass('interface_hidden');
            this._toggle_button.html('&#9664;');
        }

        return this;
    }

    /**
     * Shows the interface
     * @returns {Interface} Self reference for chaining
     */
    show() {
        if (this._self.hasClass('interface_hidden')) {
            this._self.removeClass('interface_hidden');
            this._toggle_button.html('&#9654;');
        }
        return this;
    }

    /**
     * Shows the overview screen
     * @returns {Interface} Self reference for chaining
     */
    overview() {
        this._body.empty();
        this._body.append('<h2>General</h2><div class="spacer"></div>');
        this._body.append('<button class="interface_button">Save</button>');
        this._body.append('<button class="interface_button">Load</button>');
        this._body.append('<button class="interface_button">Export as Save</button>');
        this._body.append('<button class="interface_button">Export for Simulation</button>');
        this._body.append('<button class="interface_button">Import Save</button>');
        this._body.append('<button class="interface_button">Import Simulation</button>');
        this._body.append('<button class="interface_button">Clear</button>')

        this._body.append('<h2>Creation</h2><div class="spacer"></div>');
        this._body.append('<button class="interface_button">Add Road</button>');
        this._body.append('<button class="interface_button">Add Wide Road</button>');
        this._body.append('<button class="interface_button">Add Intersection</button>');

        this._body.append($('<button class="interface_button">Edit Roads</button>'));
        this._body.append('<button class="interface_button">Edit Intersections</button>');

        return this;
    }

    /**
     * Shows the roads list screen
     * @returns {Interface} Self reference for chaining
     */
    editRoads() {
        this._body.empty();
        this._body.append('<button class="interface_small_button">Back to Menu</button>');
        this._body.append('<h2>Roads</h2><div class="spacer"></div>');
        let roads = Object.keys(this._map.getRoads());
        roads.sort();
        for (let road of roads) {
            this._body.append($('<button class="interface_button">' + road + '</button>').data('command', 'editRoad'));
        }

        return this;
    }

    /**
     * Shows the road edit screen
     * @param {string} road The id of the road
     * @returns {Interface} Self reference for chaining
     */
    editRoad(road) {
        let r = this._map.getRoad(road);
        this._body.empty();

        this._body.append('<button class="interface_small_button">Back to Roads</button>');
        this._body.append('<h2>Road: </h2>');
        this._body.append('<div class="input"><input name="roadName" type="text" placeholder="Road Name" value="' + road + '"></div>');
        this._body.append('<div class="spacer"></div>');
        this._body.append('<h2>Attributes:</h2>');
        this._body.append('<div class="input">Speed Limit <input name="speedLimit" type="number" min="0" step="10" value="' + r.getSpeedLimit() + '"></div>');
        this._body.append('<h2>Lanes:</h2>');
        this._body.append('<button class="interface_small_button">Add Lane</button>');
        let lane_list = $('<div class="interface_lanes"></div>'); // The list of lanes
        let lanes = r.getLanes(); // The lanes of the road
        let l; // The current lane
        let lane; // The current lane element
        for (let i = 0; i < lanes.length; i++) { // Loop through the lanes
            lane = lanes[i]; // Get the current lane
            l = this.generateLane(i, lane.type === 'bike', lane.type === 'car', lane.direction > 0, lane.left, lane.forward, lane.right); // Generate the lane element
            lane_list.append(l); // Add the lane to the list
        }
        this._body.append(lane_list);
        this._body.append('<h2>Edit Road</h2><div class="spacer"></div>');
        this._body.append($('<button class="interface_button">Save Road</button>').data('road', road));
        this._body.append($('<button class="interface_button">Delete Road</button>').data('road', road));
        this._body.append('<h2>Agents</h2>');
        this._body.append('<button class="interface_small_button">Add Agent</button>');
        let agent_list = $('<div class="interface_agent_list"></div>'); // The list of agents
        let agents = r.getAgents(); // The agents of the road
        let a; // The current agent
        let agent; // The current agent element
        for (let i = 0; i < agents.length; i++) { // Loop through the agents
            agent = agents[i]; // Get the current agent
            a = this.generateAgent(i, agent._distance_to_end, agent._lane, agent._speed, agent._type); // Generate the agent element
            agent_list.append(a); // Add the agent to the list
        }
        this._body.append(agent_list);
        this._body.append('<h2>Connected Intersections</h2>');
        let intersections = r.getLinkedIntersections(); // The intersections that are connected to the road
        if (!isEmpty(intersections.start)) { // If there is a start intersection
            this._body.append($('<button class="interface_button">' + intersections.start.intersection.getId() + '</button>').data('command', 'editIntersection'));
        }
        if (!isEmpty(intersections.end)) { // If there is an end intersection
            this._body.append($('<button class="interface_button">' + intersections.end.intersection.getId() + '</button>').data('command', 'editIntersection'));
        }

        return this;
    }

    /**
     * Generates a agent element
     * @param {number} count The number of the agent
     * @param {number} start Percentage of the road the agent is at
     * @param {number} lane Lane number
     * @param {number} speed Speed of the agent
     * @param {string} type Type of agent
     * @returns {string} The agent element
     */
    generateAgent(count, start, lane, speed, type) {
        let html = '<div class="interface_agent"><div class="name">Agent <span>' + count + '</span></div>';
        html += '<div class="input">Start <input type="number" name="start" min="0" max="1" step="0.01" value="' + start + '"></div>';
        html += '<div class="input">Lane <input type="number" name="lane" min="0" value="' + lane + '"></div>';
        html += '<div class="input">Type <select name="type"><option value="car"' + (type === 'car' ? ' selected' : '') + '>Car</option><option value="bike"' + (type === 'bike' ? ' selected' : '') + '>Bike</option></select></div>';
        html += '<div class="input">Speed <input type="number" name="speed" min="0" step="5" value="' + speed + '"></div>';
        html += '<button class="interface_delete">Delete</button>';
        html += '</div>';
        return html;
    }

    /**
     * Shows the intersections list screen
     * @returns {Interface} Self reference for chaining
     */
    editIntersections() {
        this._body.empty();
        this._body.append('<button class="interface_small_button">Back to Menu</button>');
        this._body.append('<h2>Intersections</h2><div class="spacer"></div>');
        let intersections = this._map.getIntersections();
        for (let intersection in intersections) {
            this._body.append($('<button class="interface_button">' + intersection + '</button>').data('command', 'editIntersection'));
        }
        return this;
    }

    /**
     * Shows the intersection edit screen
     * @param {string} intersection_id The id of the intersection
     * @returns {Interface} Self reference for chaining
     */
    editIntersection(intersection_id) {
        this._body.empty();
        this._body.append('<button class="interface_small_button">Back to Intersections</button>');
        this._body.append('<h2>Intersection: </h2>');
        this._body.append('<div class="input"><input name="intersectionName" type="text" placeholder="Intersection Name" value="' + intersection_id + '"></div>');
        this._body.append('<div class="input">Round About <input name="roundabout" type="checkbox"></div>');
        this._body.append('<div class="spacer"></div>');
        this._body.append('<h2>Edit Intersection</h2><div class="spacer"></div>');
        this._body.append($('<button class="interface_button">Save Intersection</button>').data('intersection', intersection_id));
        this._body.append($('<button class="interface_button">Delete Intersection</button>').data('intersection', intersection_id));

        let intersection = this._map.getIntersection(intersection_id);
        let directions = ['North', 'East', 'South', 'West'];

        let selector = '<div class="input">Flow <select>';
        selector += '<option value="right_of_way">Right of Way</option>'
        selector += '<option value="traffic_light">Traffic Light</option>';
        selector += '<option value="roundabout">Roundabout</option>';
        selector += '<option value="stop_sign">Stop Sign</option>';
        selector += '<option value="yield_sign">Yield Sign</option>';
        selector += '</select></div>';

        for (let i = 0; i < directions.length; i++) {
            let direction = directions[i]
            this._body.append('<h2>' + direction + '</h2>');
            direction = direction.toLowerCase();
            let select = $(selector);
            select.find('select').attr('name', direction + '_type');
            select.find('option[value="' + intersection.getTrafficControllerInDirection(direction) + '"]').attr('selected', 'selected');
            this._body.append(select);
            if (intersection.isConnected(direction)) {
                let road_id = intersection.getRoadInDirection(direction).getId();
                this._body.append($('<button class="interface_button">' + road_id + '</button>').data('command', 'editRoad'));
            }
            this._body.append('<div class="spacer"></div>');
        }

        return this;
    }

    /**
     * Loads the map from a cookie
     * @returns {Interface} Self reference for chaining
     */
    loadSave() {
        let save; // The save data
        try {
            let cookie = getCookie('map'); // Get the cookie
            if (isEmpty(cookie)) { // If the cookie is empty
                throw new Error('No save found'); // Throw an error
            }
            save = JSON.parse(decodeURIComponent(cookie)); // Parse the cookie
        } catch (e) {
            alert('Error loading save: ' + e); // Alert the user
            throw new Error('Error loading save'); // Throw an error
        }
        this._map.load(save); // Load the map
        return this;
    }

    /**
     * Adds a new road to the map
     * @param {boolean} wide Whether the road is wide
     * @returns {Interface} Self reference for chaining
     */
    addRoad(wide = false) {
        let start = getSnappedMiddleOfScreen(); // The middle of the screen
        let end = start.clone(); // The end of the road
        start.x -= 50; // Move the start to the left
        end.x += 50; // Move the end to the right
        start.angle = degToRad(270); // Set the start angle
        end.angle = degToRad(90); // Set the end angle
        let road = this._map.createRoad(start, end); // Create the road
        // Create a road with default parameters
        if (wide) { // If the road is wide
            road.setLanes([ // Set the lanes to 4 lanes. 2 in each direction
                {type: 'both', direction: 1, left: false, forward: true, right: false},
                {type: 'both', direction: 1, left: false, forward: true, right: false},
                {type: 'both', direction: -1, left: false, forward: true, right: false},
                {type: 'both', direction: -1, left: false, forward: true, right: false}
            ]);
        } else {
            road.setLanes([ // Set the lanes to 2 lanes. 1 in each direction
                {type: 'both', direction: 1, left: false, forward: true, right: false},
                {type: 'both', direction: -1, left: false, forward: true, right: false}
            ]);
        }

        this.editRoad(road.getId()); // Load the edit view

        return this;
    }

    /**
     * Adds a new intersection to the map
     * @returns {Interface} Self reference for chaining
     */
    addIntersection() {
        let mid = getSnappedMiddleOfScreen(); // The middle of the screen
        let intersection = this._map.createIntersection(mid); // Create an intersection with default parameters
        this.editIntersection(intersection.getId()); // Load the edit view
        return this;
    }

    /**
     * Adds a new lane to the edit road screen
     * @returns {Interface} Self reference for chaining
     */
    addLane() {
        let count = this._body.find('.interface_lane').length; // The number of lanes
        let html = this.generateLane(count); // Generate the lane element
        this._body.find('.interface_lanes').append(html); // Add the lane to the list
        return this;
    }

    /**
     * Adds a agent to the edit road screen
     * @returns {Interface} Self reference for chaining
     */
    addAgent() {
        let count = this._body.find('.interface_agent').length; // The number of agents
        let html = this.generateAgent(count, 0, 0, 0, 'car'); // Generate the agent element
        this._body.find('.interface_agent_list').append(html); // Add the agent to the list
        return this;
    }

    /**
     * Generates a lane element for the edit road screen
     * @param {number} count The number of the lane
     * @param {boolean} bike Whether the lane is for bikes only
     * @param {boolean} car Whether the lane is for cars only
     * @param {boolean} facing What direction the lane is facing
     * @param {boolean} left Whether the lane has a left turn
     * @param {boolean} forward Whether the lane has a forward turn
     * @param {boolean} right Whether the lane has a right turn
     * @return {string} The html for the lane
     */
    generateLane(count, bike = false, car = false, facing = true, left = true, forward = true, right = true) {
        let html = '<div class="interface_lane"><div class="name">Lane <span>' + count + '</span></div>';
        html += '<div class="input">Facing <input type="checkbox" name="facing"' + (facing ? ' checked' : '') + '></div>';
        html += '<div class="input">Bike Only <input type="checkbox" name="bike" onchange="toggle_only(this)"' + (bike ? ' checked' : '') + '></div>';
        html += '<div class="input">Car Only <input type="checkbox" name="car" onchange="toggle_only(this)"' + (car ? ' checked' : '') + '></div>';
        html += '<div class="input">Left <input type="checkbox" name="left"' + (left ? ' checked' : '') + '></div>';
        html += '<div class="input">Forward <input type="checkbox" name="forward"' + (forward ? ' checked' : '') + '></div>';
        html += '<div class="input">Right <input type="checkbox" name="right"' + (right ? ' checked' : '') + '></div>';
        html += '<button class="interface_delete">Delete</button>';
        html += '</div>';
        return html;
    }

    /**
     * The upload screen
     * @returns {Interface} Self reference for chaining
     */
    upload() {
        this._body.empty();
        this._body.append('<button class="interface_small_button">Back to Menu</button>');
        this._body.append('<h2>Upload</h2><div class="spacer"></div>');
        this._body.append('<input type="file" class="inputfile" accept=".map,.tsim,.sim"><div class="spacer"></div>');
        this._body.append('<button class="interface_button">Upload</button>');
        return this;
    }

    /**
     * The simulation upload screen
     * @returns {Interface} Self reference for chaining
     */
    simulate() {
        this._body.empty();
        this._body.append('<button class="interface_small_button">Back to Menu</button>');
        this._body.append('<h2>Simulation</h2><div class="spacer"></div>');
        this._body.append('<input type="file" class="inputfile" accept=".sim"><div class="spacer"></div>');
        this._body.append('<button class="interface_button">Load Simulation</button>');
        return this;
    }

    /**
     * Uploads a file and loads the map
     */
    uploadSave() {
        let files = document.getElementsByClassName('inputfile')[0].files; // The files of the input
        if (isEmpty(files)) { // If there are no files
            alert('No file selected'); // Alert the user
            return;
        }
        let reader = new FileReader(); // Create a file reader
        reader.onload = function(e) { // When the file is loaded
            let save = JSON.parse(e.target.result); // Parse the file
            this._map.load(save); // Load the map
            this.overview(); // Load the overview
        }.bind(this);
        reader.readAsText(files[0]); // Read the file
        return this;
    }

    /**
     * Uploads a file and loads the simulation
     */
    loadSimulation() {
        let files = document.getElementsByClassName('inputfile')[0].files; // The files of the input
        if (isEmpty(files)) { // If there are no files
            alert('No file selected'); // Alert the user
            return;
        }
        let reader = new FileReader(); // Create a file reader
        reader.onload = function(e) { // When the file is loaded
            let simulation = JSON.parse(e.target.result); // Parse the file
            this._simulation_interface.loadSimulation(simulation);
            this.toggle().overview(); // Toggle the interface and load the overview
        }.bind(this);
        reader.readAsText(files[0]); // Read the file
    }

    /**
     * Saves a road including all its parameters
     * @param {string} road_id The id of the road
     */
    saveRoad(road_id) {
        let lanes = []; // The lanes of the road
        let lane; // The current lane
        let lane_html = this._body.find('.interface_lane'); // The lane elements
        for (let i = 0; i < lane_html.length; i++) { // For each lane
            lane = $(lane_html[i]); // Get the lane
            lanes.push({ // Add the lane to the list by getting the inputs
                type: lane.find('input[name="bike"]').is(':checked') ? 'bike' : (lane.find('input[name="car"]').is(':checked') ? 'car' : 'both'),
                direction: lane.find('input[name="facing"]').is(':checked') ? 1 : -1,
                left: lane.find('input[name="left"]').is(':checked'),
                forward: lane.find('input[name="forward"]').is(':checked'),
                right: lane.find('input[name="right"]').is(':checked')
            });
        }
        let road = this._map.getRoad(road_id); // Get the road
        road.setLanes(lanes); // Set the lanes

        let newName = this._body.find('input[name="roadName"]').val(); // Get the new name
        if (road_id !== newName) { // If the name has changed
            if (this._map.idInUse(newName)) { // If the name is already in use
                alert('Name already in use'); // Alert the user
            } else {
                this._map.renameRoad(road_id, newName); // Rename the road
            }
        }

        road.changeSpeedLimit(parseInt(this._body.find('input[name="speedLimit"]').val())); // Change the speed limit

        let agents = road.getAgents(); // The agents of the road
        let agent_html = this._body.find('.interface_agent'); // The agent elements
        for (let i = 0; i < Math.min(agent_html.length, agents.length); i++) { // For each agent
            let agent = $(agent_html[i]); // Get the agent
            agents[i].initialMapPosition( // Set the initial position
                agent.find('input[name="start"]').val(),
                agent.find('input[name="lane"]').val(),
                agent.find('input[name="speed"]').val(),
                road,
                agent.find('select[name="type"] option:selected').val()
            );
        }

        if (agent_html.length > agents.length) { // If there are more agents in the interface than in the road
            for (let i = agents.length; i < agent_html.length; i++) { // For each agent
                let agent = $(agent_html[i]); // Get the agent
                let type = agent.find('select[name="type"] option:selected').val();
                let ag = this._map.createAgent(type); // Create the agent
                road.addAgent(ag); // Add the agent to the road
                ag.initialMapPosition(
                    agent.find('input[name="start"]').val(),
                    agent.find('input[name="lane"]').val(),
                    agent.find('input[name="speed"]').val(),
                    road,
                    type
                );
            }
        } else if (agent_html.length < agents.length) { // If there are more agents in the road than in the interface
            for (let i = agent_html.length; i < agents.length; i++) { // For each agent
                this._map.removeAgent(agents[i].getId()); // Remove the agent
            }
            road.removeAgents(agents.length - agent_html.length); // Remove the agents from the road
        }

        return this;
    }

    /**
     * Saves an intersection including all its parameters
     * @param {string} intersection_id The id of the intersection
     * @returns {Interface} Self reference for chaining
     */
    saveIntersection (intersection_id) {
        let newName = this._body.find('input[name="intersectionName"]').val(); // Get the new name
        let intersection = this._map.getIntersection(intersection_id); // Get the intersection
        if (intersection_id !== newName) { // If the name has changed
            if (this._map.idInUse(newName)) { // If the name is already in use
                alert('Name already in use'); // Alert the user
            } else { // If the name is not in use
                this._map.renameIntersection(intersection_id, newName); // Rename the intersection
            }
        }

        let directions = ['north', 'east', 'south', 'west']; // The directions
        for (let i = 0; i < directions.length; i++) { // For each direction
            let direction = directions[i]; // Get the direction
            let traffic_control_type = this._body.find('select[name="' + direction + '_type"] option:selected').val(); // Get the traffic control type
            intersection.setTrafficControllerInDirection(direction, traffic_control_type); // Set the traffic controller in the direction
        }

        let isRoundAbout = this._body.find('input[name="roundabout"]').is(':checked'); // If the intersection is a roundabout
        intersection.setRoundAbout(isRoundAbout); // Set the roundabout

        return this;
    }

    /**
     * Saves the map to a file
     * @returns {Interface} Self reference for chaining
     */
    exportAsSave() {
        downloadAsJson(this._map.exportSaveData(), currentTime(), 'map'); // Export the map as a save
        return this;
    }

    /**
     * Saves the simulation to a file
     * @returns {Interface} Self reference for chaining
     */
    exportForSimulation() {
        downloadAsJson(this._map.exportToBeSimulatedData(), currentTime(), 'tsim'); // Export the map as a 'to be simulated file'
        return this;
    }



    /**
     * Runs a command based on the button that was clicked
     * @param {string} command The command to run
     * @param {Object} data The extra data for the command
     * @param {jQuery} target The button that was pressed
     */
    runCommand(command, data, target) {
        switch (command) { // Switch on the command
            case 'Export for Simulation':
                this.exportForSimulation();
                break;
            case 'Import Save':
                this.upload();
                break;
            case 'Upload':
                this.uploadSave();
                break;
            case 'Load Simulation':
                this.loadSimulation();
                break;
            case 'Import Simulation':
                this.simulate();
                break;
            case 'Load':
                this.loadSave();
                break;
            case 'Edit Roads':
                this.editRoads();
                break;
            case 'Edit Intersections':
                this.editIntersections();
                break;
            case 'Back to Menu':
                this.overview();
                break;
            case 'Back to Roads':
                this.editRoads();
                break;
            case 'Back to Intersections':
                this.editIntersections();
                break;
            case 'Add Road':
                this.addRoad();
                break;
            case 'Add Wide Road':
                this.addRoad(true);
                break
            case 'Add Intersection':
                this.addIntersection();
                break;
            case 'Add Agent':
                this.addAgent();
                break;
            case 'Clear':
                this._map.clear(); // Clear the map
                break;
            case 'Add Lane':
                this.addLane();
                break;
            case 'Delete':
                if (target.parent().hasClass('interface_agent')) {
                    target.closest('.interface_agent').remove();
                } else {
                    target.closest('.interface_lane').remove(); // Remove the lane
                }
                target.closest('.interface_lane').remove(); // Remove the lane
                break;
            case 'Delete Road':
                this._map.removeRoad(data.road); // Remove the road
                this.editRoads(); // Load the edit roads screen
                break;
            case 'Delete Intersection':
                this._map.removeIntersection(data.intersection); // Remove the intersection
                this.editIntersections(); // Load the edit intersections screen
                break;
            case 'Export as Save':
                this.exportAsSave();
                break;
            case 'Save':
                setCookie('map', encodeURIComponent(JSON.stringify(this._map.exportSaveData())), 14); // Save the map to a cookie
                break;
            case 'Save Road':
                this.saveRoad(data.road);
                break;
            case 'Save Intersection':
                this.saveIntersection(data.intersection);
                break;
            default: // If the command is not recognized
                if (isEmpty(data.command)) { // If there is no command in the data
                    throw new Error('Invalid Command');
                }
                switch (data.command) { // Switch on the data command
            case 'editRoad':
                this.editRoad(command); // Edit the road
                break;
            case 'editIntersection':
                this.editIntersection(command); // Edit the intersection
                break;
            default: // If the command is not recognized
                throw new Error('Invalid Command');
        }
        }
    }
}

/**
 * Checks that you have car only and bike only lanes at the same time
 * @param {Element} element The element to check
 */
function toggle_only (element) {
    element = $(element); // Get the element

    if (element.is(':checked')) { // If the element is checked
        let name = element.attr('name'); // Get the name
        let other = name === 'car' ? 'bike' : 'car'; // Get name of the other element
        element.closest('div.interface_lane').find(`input[name="${other}"]`).prop('checked', false); // Uncheck the other element
    }
}