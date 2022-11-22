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
    _current_road_id = ''; // Current Road ID
    _current_position = null; // Current Position of the agent
    _current_flip = false; // Current Facing direction of the agent
    _current_road_width = 0; // Current Road Width
    _time_interval = 1000; // Time interval between two steps

    _animation = new Animate(this);

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
        this._model.removeClass(this._type);
        switch (type) {
            case 'car':
                this._width = 16;
                this._height = 32;
                break;
            case 'bike':
                this._width = 7;
                this._height = 16;
                break;
            default:
                throw new Error('Unknown agent type: ' + type);
        }
        this._type = type;
        this.updateWidthAndHeight();
        this._model.addClass(type);
    }

    remove() {
        this._self.remove();
    }

    updateWidthAndHeight() {
        this._model.css({
            'width': this._width,
            'height': this._height
        });
        this._half_width = this._width / 2;
        this._half_height = this._height / 2;
    }

    simulate(x, y, angle, active = true) {
        if (active) {
            this._self.css('display', 'block');
            this.updatePosition(new Point(x, y, angle));
        } else {
            this._self.css('display', 'none');
        }
    }

    exportSaveData() {
        return {
            id: this._id,
            type: this._type,
            speed: this._initial_speed,
            lane: this._initial_lane,
            percent_to_end: this._initial_percent_to_end,
            road: this._current_road.getId()
        };
    }

    exportToBeSimulatedData() {
        let pixel_to_meter = getConfig('pixels_to_meter');
        return {
            id: this._id,
            type: this._type,
            speed: this._initial_speed,
            lane: this._initial_lane,
            percent_to_end: this._initial_percent_to_end,
            road: this._current_road.getId()
        };
    }
}