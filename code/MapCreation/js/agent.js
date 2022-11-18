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
        this._id = id;
        this._map = map;
        this._self = $('<div></div>').addClass('agent').data('link', this);
        this._model = $('<div></div>');
        this.updateType(type);
        this._self.append(this._model);
        this._lane_width = getConfig('road_lane_width');
        this._half_lane_width = this._lane_width / 2;
        this._time_interval = getConfig('simulation_interval');

        this.updateWidthAndHeight();
    }

    updatePosition(position) {
        this._self.css({
            left: position.x,
            top: position.y,
        });
        this._model.css({
            transform: 'rotate(' + -position.angle + 'rad)'
        });
    }

    snapToRoad(road) {
        this._current_road = road;
    }

    moveOnRoad(percent, side, flip) {
        let position = this._current_road.getAgentPosition(percent, side);
        if (flip) {
            position.angle = truncateAngle(position.angle + Math.PI, 2 * Math.PI);
        }
        this.updatePosition(position);
    }

    getElement() {
        return this._self;
    }

    getModel() {
        return this._model;
    }

    getId() {
        return this._id;
    }

    initialMapPosition(percent_to_end, lane, speed, road, type) {
        this._initial_lane = lane;
        this._initial_speed = speed;
        this._initial_percent_to_end = percent_to_end;
        this.updateType(type);
        this.snapToRoad(road);
        let facing = road.getLanes()[lane].direction < 0;
        this._initial_facing = facing;
        percent_to_end = facing ? 1 - percent_to_end : percent_to_end;
        let lane_width = getConfig('road_lane_width')
        this.moveOnRoad(percent_to_end, lane * this._lane_width + this._half_lane_width, facing);
    }

    initialMapUpdate() {
        this.moveOnRoad(this._initial_percent_to_end, this._initial_lane * this._lane_width + this._half_lane_width, this._initial_facing);
    }

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

    nextPosition(step) {
        if (step.road !== this._current_road_id) {
            this.snapToRoad(this._map.getRoad(step.road));
            this._current_road_id = step.road;
            this._current_road_width = this._current_road.getRoadWidth();
            this._current_flip = step.road.charAt(0) === '!';
        }
        let new_position;
        if (this._current_flip) {
            new_position = this._current_road.getAgentPosition(1 - step.percent_to_end, this._current_road_width - step.distance_to_side - this._half_width);
            new_position.angle = truncateAngle(new_position.angle + Math.PI, 2 * Math.PI);
        } else {
            new_position = this._current_road.getAgentPosition(step.percent_to_end, step.distance_to_side + this._half_lane_width);
        }
        console.log(new_position); //TODO: remove
        return new_position;
    }

    jumpTo(step) {
        this._current_position = this.nextPosition(step);
        this.updatePosition(this._current_position);
    }

    simulate(step, speed) {
        let new_position = this.nextPosition(step);

        this._animation.start(this._current_position, new_position, this._time_interval / speed);

        this._current_position = new_position;
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
}