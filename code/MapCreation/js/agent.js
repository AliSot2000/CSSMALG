/**
 * The Agent Class
 * @class Agent
 * @param {String} id The id of the agent
 * @param {String} type The type of the agent. Either "car" or "bike"
 * @param {Map} map The map the agent is on
 */
class Agent {
    _type = 'agent'; // Type of the agent

    _id = ''; // ID of the agent

    _self = null; // Self Reference
    _model = null; // Reference to the picture of the agent
    _map = null; // Current Map the agent is on

    _width = 0; // Width of the agent
    _half_width = 0; // Half width of the agent
    _height = 0; // Height of the agent
    _half_height = 0; // Half height of the agent
    _lane_width = 0; // Width of a lane
    _half_lane_width = 0; // Half width of a lane

    _initial_facing = 0; // Initial Facing direction of the agent
    _initial_speed = 0; // Initial Speed of the agent
    _initial_lane = 0; // Initial Lane the agent is on
    _initial_percent_to_end = 0; // Initial percent to the end of the road

    _current_road = null; // Current Road the agent is on
    _time_interval = 1000; // Time interval between two steps

    /**
     * Initialize the agent
     * @constructor
     * @param {String} id The id of the agent
     * @param {String} type The type of the agent. Either "car" or "bike"
     * @param {Map} map The map the agent is on
     */
    constructor(id, type, map) {
        this._id = id; // ID of the agent
        this._map = map; // Current Map the agent is on
        this._self = $('<div></div>').addClass('agent').data('link', this); // Self Reference
        this._model = $('<div></div>'); // Reference to the picture of the agent
        this.updateType(type); // Update the type of the agent
        this._self.append(this._model); // Append the model to the self
        this._lane_width = getConfig('road_lane_width'); // Width of a lane
        this._half_lane_width = this._lane_width / 2; // Half width of a lane
        this._time_interval = getConfig('simulation_interval'); // Time interval between two steps

        this.updateWidthAndHeight(); // Update the width and height of the agent
    }

    /**
     * Update the position of the agent
     * @param {Point} position The new position of the agent
     * @returns {Agent} Self Reference for chaining
     */
    updatePosition(position) {
        this._self.css({ // Update the position of the agent
            left: position.x,
            top: position.y,
        });
        this._model.css({ // Update the rotation of the picture
            transform: 'rotate(' + -position.angle + 'rad)'
        });

        return this;
    }

    /**
     * Snap a agent to a road
     * @param {Road} road The road to snap to
     * @returns {Agent} Self Reference for chaining
     */
    snapToRoad(road) {
        this._current_road = road; // Current Road the agent is on
        return this; // Self Reference for chaining
    }

    /**
     * Move the agent on the road it is snapped to
     * @param {number} percent The percent to the end of the road
     * @param {number} distance_to_side The distance to the side of the road
     * @param {boolean} flip The facing direction of the agent
     */
    moveOnRoad(percent, distance_to_side, flip) {
        let position = this._current_road.getAgentPosition(percent, distance_to_side); // Get the position of the agent
        if (flip) { // If the agent is facing the other direction
            position.angle = truncateAngle(position.angle + Math.PI, 2 * Math.PI); // Flip the angle
        }
        this.updatePosition(position); // Update the position of the agent
    }

    /**
     * Returns a reference to the html element of the agent
     * @return {jQuery} The html element of the agent
     */
    getElement() {
        return this._self;
    }

    /**
     * Returns a reference to the html element of the picture of the agent
     * @return {jQuery} The html element of the picture of the agent
     */
    getModel() {
        return this._model;
    }

    /**
     * Returns the id of the agent
     * @return {string} The id of the agent
     */
    getId() {
        return this._id;
    }

    /**
     * Set the initial position of the agent
     * @param {number} percent_to_end The percent to the end of the road
     * @param {number} lane The lane the agent is on
     * @param {number} speed The speed of the agent
     * @param {Road} road The road the agent is on
     * @param {string} type The type of the agent
     * @returns {Agent} Self Reference for chaining
     */
    initialMapPosition(percent_to_end, lane, speed, road, type) {
        this._initial_lane = lane; // Initial Lane the agent is on
        this._initial_speed = speed; // Initial Speed of the agent
        this._initial_percent_to_end = percent_to_end; // Initial percent to the end of the road
        this.updateType(type); // Update the type of the agent
        this.snapToRoad(road); // Snap the agent to the road
        let facing = road.getLanes()[lane].direction < 0; // Get the facing direction of the agent
        this._initial_facing = facing; // Initial Facing direction of the agent
        percent_to_end = facing ? 1 - percent_to_end : percent_to_end; // If the agent is facing the other direction, reverse the percent
        this.moveOnRoad(percent_to_end, lane * this._lane_width + this._half_lane_width, facing);
        return this;
    }

    /**
     * Update the agent position on road move
     * @returns {Agent} Self Reference for chaining
     */
    initialMapUpdate() {
        this.moveOnRoad(this._initial_percent_to_end, this._initial_lane * this._lane_width + this._half_lane_width, this._initial_facing);
        return this;
    }

    /**
     * Update the type of the agent
     * @param {string} type The type of the agent
     * @returns {Agent} Self Reference for chaining
     */
    updateType(type) {
        this._model.removeClass(this._type); // Remove the old type
        switch (type) { // Switch the type
            case 'car': // If the type is car
                this._width = 16; // Width of the agent
                this._height = 32; // Height of the agent
                break;
            case 'bike':  // If the type is bike
                this._width = 7; // Width of the agent
                this._height = 16; // Height of the agent
                break;
            default:
                throw new Error('Unknown agent type: ' + type); // Throw an error if the type is unknown
        }
        this._type = type; // Set the type
        this.updateWidthAndHeight(); // Update the width and height of the agent
        this._model.addClass(type); // Add the new type
        return this;
    }

    /**
     * Removes deletes the agent
     * @returns {Agent} Self Reference for chaining
     */
    remove() {
        this._self.remove();
        return this;
    }

    /**
     * Update the width and height of the agent
     * @return {Agent} Self Reference for chaining
     */
    updateWidthAndHeight() {
        this._model.css({ // Update the width and height of the agent
            'width': this._width,
            'height': this._height
        });
        this._half_width = this._width / 2; // Half width of the agent
        this._half_height = this._height / 2; // Half height of the agent
        return this;
    }

    /**
     * positions a current timestep
     * @param {{x: number, y: number, angle: number, active: boolean}} step The current timestep
     * @returns {Agent} Self Reference for chaining
     */
    simulate(step) {
        if (step.active) { // If the agent is active
            this._self.css('display', 'block'); // Show the agent
            this.updatePosition(new Point(step.x, step.y, step.angle)); // Update the position of the agent
        } else {
            this._self.css('display', 'none'); // Hide the agent
        }
        return this;
    }

    /**
     * Exports the agent for a save
     * @returns {Object} The exported agent
     */
    exportSaveData() {
        return {
            id: this._id, // ID of the agent
            type: this._type, // Type of the agent
            speed: this._initial_speed, // Initial Speed of the agent
            lane: this._initial_lane, // Initial Lane of the agent
            percent_to_end: this._initial_percent_to_end, // Initial percent to the end of the road
            road: this._current_road.getId() // ID of the road the agent is on
        };
    }

    /**
     * Exports the agent for a simulation
     * @returns {Object} The exported agent
     */
    exportToBeSimulatedData() {
        // let pixel_to_meter = getConfig('pixels_to_meter'); // Get the pixels to meter ratio
        return {
            id: this._id, // ID of the agent
            type: this._type, // Type of the agent
            speed: this._initial_speed, // Initial Speed of the agent
            lane: this._initial_lane, // Initial Lane of the agent
            percent_to_end: this._initial_percent_to_end, // Initial percent to the end of the road
            road: this._current_road.getId() // ID of the road the agent is on
        };
    }
}