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
        this._body = $('<div></div>').addClass('interface_body').on('click', '.interface_button, .small_button, .delete', {interface: this}, function(event) {
            event.data.interface.runCommand($(this).html(), $(this).data(), $(this));
        });

        this._self.append(this._toggle_button, this._body); // Add the elements to the interface

        return this;
    }

    /**
     * Toggles the interface
     */
    toggle() {
        if (this._self.hasClass('interface_hidden')) {
            this._self.removeClass('interface_hidden');
            this._toggle_button.html('&#9654;');
        } else {
            this._self.addClass('interface_hidden');
            this._toggle_button.html('&#9664;');
        }
    }

    /**
     * Shows the overview screen
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
        this._body.append('<button class="interface_button">Add THICC Road</button>');
        this._body.append('<button class="interface_button">Add Intersection</button>');

        this._body.append($('<button class="interface_button">Edit Roads</button>'));
        this._body.append('<button class="interface_button">Edit Intersections</button>');
    }

    /**
     * Shows the roads list screen
     */
    editRoads() {
        this._body.empty();
        this._body.append('<button class="small_button">Back to Menu</button>');
        this._body.append('<h2>Roads</h2><div class="spacer"></div>');
        let roads = Object.keys(this._map.getRoads());
        roads.sort();
        for (let road of roads) {
            this._body.append($('<button class="interface_button">' + road + '</button>').data('command', 'editRoad'));
        }
    }

    /**
     * Shows the road edit screen
     * @param {string} road The id of the road
     */
    editRoad(road) {
        let r = this._map.getRoad(road);
        this._body.empty();

        this._body.append('<button class="small_button">Back to Roads</button>');
        this._body.append('<h2>Road: </h2>');
        this._body.append('<div class="input"><input name="roadName" type="text" placeholder="Road Name" value="' + road + '"></div>');
        this._body.append('<div class="spacer"></div>');
        this._body.append('<h2>Attributes:</h2>');
        this._body.append('<div class="input">Speed Limit <input name="speedLimit" type="number" min="0" step="10" value="' + r.getSpeedLimit() + '"></div>');
        this._body.append('<h2>Lanes:</h2>');
        this._body.append('<button class="small_button">Add Lane</button>');
        let lane_list = $('<div class="lanes"></div>'); // The list of lanes
        let lanes = r.getLanes(); // The lanes of the road
        let l; // The current lane
        let lane; // The current lane element
        for (let i = 0; i < lanes.length; i++) { // Loop through the lanes
            lane = lanes[i]; // Get the current lane
            l = this.generateLane(i, lane.type === 'bike', lane.direction > 0, lane.left, lane.forward, lane.right); // Generate the lane element
            lane_list.append(l); // Add the lane to the list
        }
        this._body.append(lane_list);
        this._body.append('<h2>Edit Road</h2><div class="spacer"></div>');
        this._body.append($('<button class="interface_button">Save Road</button>').data('road', road));
        this._body.append($('<button class="interface_button">Delete Road</button>').data('road', road));
        this._body.append('<h2>Agents</h2>');
        this._body.append('<button class="small_button">Add Agent</button>');
        let agent_list = $('<div class="agent_list"></div>'); // The list of agents
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
    }

    generateAgent(count, start, lane, speed, type) {
        let html = '<div class="ag"><div class="name">Agent <span>' + count + '</span></div>';
        html += '<div class="input">Start <input type="number" name="start" min="0" max="1" step="0.01" value="' + start + '"></div>';
        html += '<div class="input">Lane <input type="number" name="lane" min="0" value="' + lane + '"></div>';
        html += '<div class="input">Type <select name="type"><option value="car"' + (type === 'car' ? ' selected' : '') + '>Car</option><option value="bike"' + (type === 'bike' ? ' selected' : '') + '>Bike</option></select></div>';
        html += '<div class="input">Speed <input type="number" name="speed" min="0" step="5" value="' + speed + '"></div>';
        html += '<button class="delete">Delete</button>';
        html += '</div>';
        return html;
    }

    /**
     * Shows the intersections list screen
     */
    editIntersections() {
        this._body.empty();
        this._body.append('<button class="small_button">Back to Menu</button>');
        this._body.append('<h2>Intersections</h2><div class="spacer"></div>');
        let intersections = this._map.getIntersections();
        for (let intersection in intersections) {
            this._body.append($('<button class="interface_button">' + intersection + '</button>').data('command', 'editIntersection'));
        }
    }

    /**
     * Shows the intersection edit screen
     * @param {string} intersection The id of the intersection
     */
    editIntersection(intersection) {
        this._body.empty();
        this._body.append('<button class="small_button">Back to Intersections</button>');
        this._body.append('<h2>Intersection: </h2>');
        this._body.append('<div class="input"><input name="intersectionName" type="text" placeholder="Intersection Name" value="' + intersection + '"></div>');
        this._body.append('<div class="spacer"></div>');
        this._body.append('<h2>Edit Intersection</h2><div class="spacer"></div>');
        this._body.append($('<button class="interface_button">Save Intersection</button>').data('intersection', intersection));
        this._body.append($('<button class="interface_button">Delete Intersection</button>').data('intersection', intersection));
        this._body.append('<h2>Connected Roads</h2><div class="spacer"></div>');
        let roads = this._map.getIntersection(intersection).getLinkedRoads(); // The roads that are connected to the intersection
        for (let i = 0; i < roads.length; i++) { // Loop through the roads
            this._body.append($('<button class="interface_button">' + roads[i].getId() + '</button>').data('command', 'editRoad')); // Add the road to the list
        }
    }

    /**
     * Loads the map from a cookie
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
    }

    /**
     * Adds a new road to the map
     * @param {boolean} thicc Whether the road is thicc
     */
    addRoad(thicc = false) {
        let start = getSnappedMiddleOfScreen(); // The middle of the screen
        let end = start.clone();
        start.x -= 50;
        end.x += 50;
        start.angle = degToRad(270);
        end.angle = degToRad(90);
        let road = this._map.createRoad(start, end); // Create the road
        // Create a road with default parameters
        if (thicc) {
            road.setLanes([
                {type: 'car', direction: 1, left: false, forward: true, right: false},
                {type: 'car', direction: 1, left: false, forward: true, right: false},
                {type: 'car', direction: -1, left: false, forward: true, right: false},
                {type: 'car', direction: -1, left: false, forward: true, right: false}
            ]);
        } else {
            road.setLanes([
                {type: 'car', direction: 1, left: false, forward: true, right: false},
                {type: 'car', direction: -1, left: false, forward: true, right: false}
            ]);
        }

        this.editRoad(road.getId()); // Load the edit view
    }

    /**
     * Adds a new intersection to the map
     */
    addIntersection() {
        let mid = getSnappedMiddleOfScreen(); // The middle of the screen
        let intersection = this._map.createIntersection(mid); // Create an intersection with default parameters
        this.editIntersection(intersection.getId()); // Load the edit view
    }

    /**
     * Adds a new lane to the edit road screen
     */
    addLane() {
        let count = this._body.find('.lane').length; // The number of lanes
        let html = this.generateLane(count); // Generate the lane element
        this._body.find('.lanes').append(html); // Add the lane to the list
    }

    addAgent() {
        let count = this._body.find('.ag').length; // The number of agents
        let html = this.generateAgent(count, 0, 0, 0, 'car'); // Generate the agent element
        this._body.find('.agent_list').append(html); // Add the agent to the list
    }

    /**
     * Generates a lane element for the edit road screen
     * @param {number} count The number of the lane
     * @param {boolean} bike Whether the lane is for bikes
     * @param {boolean} facing What direction the lane is facing
     * @param {boolean} left Whether the lane has a left turn
     * @param {boolean} forward Whether the lane has a forward turn
     * @param {boolean} right Whether the lane has a right turn
     * @return {string} The html for the lane
     */
    generateLane(count, bike = false, facing = true, left = true, forward = true, right = true) {
        let html = '<div class="lane"><div class="name">Lane <span>' + count + '</span></div>';
        html += '<div class="input">Bike Only <input type="checkbox" name="bike"' + (bike ? ' checked' : '') + '></div>';
        html += '<div class="input">Facing <input type="checkbox" name="facing"' + (facing ? ' checked' : '') + '></div>';
        html += '<button class="delete">Delete</button>';
        html += '<div class="input">Left <input type="checkbox" name="left"' + (left ? ' checked' : '') + '></div>';
        html += '<div class="input">Forward <input type="checkbox" name="forward"' + (forward ? ' checked' : '') + '></div>';
        html += '<div class="input">Right <input type="checkbox" name="right"' + (right ? ' checked' : '') + '></div>';
        html += '</div>';
        return html;
    }

    /**
     * The upload screen
     */
    upload() {
        this._body.empty();
        this._body.append('<button class="small_button">Back to Menu</button>');
        this._body.append('<h2>Upload</h2><div class="spacer"></div>');
        this._body.append('<input type="file" class="inputfile" accept=".map"><div class="spacer"></div>');
        this._body.append('<button class="interface_button">Upload</button>');
    }

    simulate() {
        this._body.empty();
        this._body.append('<button class="small_button">Back to Menu</button>');
        this._body.append('<h2>Simulation</h2><div class="spacer"></div>');
        this._body.append('<input type="file" class="inputfile" accept=".sim"><div class="spacer"></div>');
        this._body.append('<button class="interface_button">Load Simulation</button>');
    }

    /**
     * Uploads a file and loads the map from that
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
    }

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
            this.toggle(); // Toggle the interface
            this.overview(); // Load the overview
        }.bind(this);
        reader.readAsText(files[0]); // Read the file
    }

    saveRoad(road_id) {
        let lanes = []; // The lanes of the road
        let lane; // The current lane
        let lane_html = this._body.find('.lane'); // The lane elements
        for (let i = 0; i < lane_html.length; i++) { // For each lane
            lane = $(lane_html[i]); // Get the lane
            lanes.push({ // Add the lane to the list by getting the inputs
                type: lane.find('input[name="bike"]').is(':checked') ? 'bike' : 'car',
                direction: lane.find('input[name="facing"]').is(':checked') ? 1 : -1,
                left: lane.find('input[name="left"]').is(':checked'),
                forward: lane.find('input[name="forward"]').is(':checked'),
                right: lane.find('input[name="right"]').is(':checked')
            });
        }
        let road = this._map.getRoad(road_id); // Get the road
        road.setLanes(lanes); // Set the lanes

        let newName = this._body.find('input[name="roadName"]').val();
        if (this._map.idInUse(newName)) {
            alert('Name already in use');
        } else {
            this._map.renameRoad(road_id, newName);
        }

        let agents = road.getAgents(); // The agents of the road
        let agent_html = this._body.find('.ag'); // The agent elements
        for (let i = 0; i < Math.min(agent_html.length, agents.length); i++) { // For each agent
            let agent = $(agent_html[i]); // Get the agent
            agents[i].initialMapPosition(
                agent.find('input[name="start"]').val(),
                agent.find('input[name="lane"]').val(),
                agent.find('input[name="speed"]').val(),
                road,
                agent.find('select[name="type"] option:selected').val()
            );
        }

        if (agent_html.length > agents.length) {
            for (let i = agents.length; i < agent_html.length; i++) { // For each agent
                let agent = $(agent_html[i]); // Get the agent
                let type = agent.find('select[name="type"] option:selected').val();
                let ag = this._map.createAgent(type);
                road.addAgent(ag);
                ag.initialMapPosition(
                    agent.find('input[name="start"]').val(),
                    agent.find('input[name="lane"]').val(),
                    agent.find('input[name="speed"]').val(),
                    road,
                    type
                );
            }
        } else if (agent_html.length < agents.length) {
            for (let i = agent_html.length; i < agents.length; i++) {
                this._map.removeAgent(agents[i].getId());
            }
            road.removeAgents(agents.length - agent_html.length);
        }
    }

    saveIntersection (intersection_id) {
        let newName = this._body.find('input[name="intersectionName"]').val();
        if (this._map.idInUse(newName)) {
            alert('Name already in use');
        } else {
            this._map.renameIntersection(intersection_id, newName);
        }
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
                downloadAsJson(this._map.exportToBeSimulatedData(), currentTime(), 'tsim'); // Export the map as a to be simulated file
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
            case 'Add THICC Road':
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
                if (target.parent().hasClass('ag')) {
                    target.closest('.ag').remove();
                } else {
                    target.closest('.lane').remove(); // Remove the lane
                }
                target.closest('.lane').remove(); // Remove the lane
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
                downloadAsJson(this._map.exportSaveData(), currentTime(), 'map'); // Export the map as a save
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
        }
        }
    }
}