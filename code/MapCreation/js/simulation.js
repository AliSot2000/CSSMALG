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
        let close_button = $('<button>Close</button>').addClass('simulation_input');
        this._slider = $('<input></input>').attr({
            'type': 'range',
            'min': 0,
            'max': 100,
            'value': 0,
        }).addClass('slider');

        let html = '<button class="simulation_input">Play</button>';
        html += '<select class="simulation_input">';
        html += '<option value="0.25">0.25x</option>';
        html += '<option value="0.5">0.5x</option>';
        html += '<option value="1" selected>1x</option>';
        html += '<option value="2">2x</option>';
        html += '<option value="4">4x</option>';
        html += '</select>';
        this._self.append(
            close_button,
            this._slider,
            html
        );
    }
}