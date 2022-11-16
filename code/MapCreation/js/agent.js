class Agent {
    _current_road = null;
    _percent_to_end = 0;
    _distance_to_side = 0;
    _type = 'agent';

    _id = '';

    _self = null;
    _model = null;

    _width = 0;
    _half_width = 0;
    _height = 0;
    _half_height = 0;

    _initial_facing = 0;
    _initial_speed = 0;
    _initial_lane = 0;
    _initial_percent_to_end = 0;

    constructor(id, type) {
        this._id = id;
        this._self = $('<div></div>').addClass('agent').data('link', this);
        this._model = $('<div></div>');
        this.updateType(type);
        this._self.append(this._model);
        this.updateWidthAndHeight();
    }

    updatePosition(position) {
        this._self.css({
            'left': position.x,
            'top': position.y,
        });
        this._model.css({
            'transform': 'rotate(' + -position.angle + 'rad)'
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
        this.moveOnRoad(percent_to_end, lane * lane_width + 0.5 * lane_width, facing);
    }

    initialMapUpdate() {
        let lane_width = getConfig('road_lane_width')
        this.moveOnRoad(this._initial_percent_to_end, this._initial_lane * lane_width + 0.5 * lane_width, this._initial_facing);
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
}