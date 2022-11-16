class Simulation {
    _self = null;
    _slider_wrapper = null;
    _slider = null;
    _map = null;
    _interface = null;

    constructor(selector = 'div.simulation', map = null, gui = null) {
        this._self = $(selector).data('simulation', this)//.css('display', 'none'); // The interface element
        this._map = map; // The map that is connected to the interface
        this._interface = gui; // The interface that is connected to the map
        this.createElements();
    }

    createElements() {
        this._slider_wrapper = $('<div></div>').addClass('slider_wrapper');
        this._slider = $('<input></input>').attr({
            'type': 'range',
            'min': 0,
            'max': 100,
            'value': 0,
        }).addClass('slider');
        this._slider_wrapper.append(this._slider);
        this._self.append(this._slider_wrapper);
    }
}