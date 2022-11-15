class Agent {
    _current_road = null;
    _percent_to_end = 0;
    _distance_to_side = 0;
    _position = 0;

    _id = 0;

    _self = null;
    _model = null;

    _width = 0;
    _half_width = 0;
    _height = 0;
    _half_height = 0;

    constructor(id) {
        this._self = $('<div></div>').addClass('agent').data('link', this);
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

    moveOnRoad(percent) {
        this.updatePosition(this._current_road.getCarPosition(percent, this._distance_to_side));
    }

    getElement() {
        return this._self;
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


class Car extends Agent {
    constructor(id) {
        super(id);
        this._model = $('<div></div>').addClass('car');
        this._self.append(this._model);
        this._width = 16;
        this._height = 32;
        this.updateWidthAndHeight();
    }
}

class Bike extends Agent {
    constructor(id) {
        super(id);
        this._model = $('<div></div>').addClass('bike');
        this._self.append(this._model);
        this._width = 7;
        this._height = 16;
        this.updateWidthAndHeight();
    }
}