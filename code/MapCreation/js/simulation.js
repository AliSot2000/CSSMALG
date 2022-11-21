class Simulation {
    _self = null;
    _slider = null;
    _map = null;
    _interface = null;
    _step = 1;
    _agents = null;
    _simulation = null;
    _sim_map = null;
    _a = null;
    _speed = 1;
    _interval = null;
    _time_interval = 1000;
    _play_button = null;
    _speed_dial = null;

    constructor(selector = 'div.simulation', map = null, gui = null) {
        this._self = $(selector).data('simulation', this).css('display', 'none'); // The interface element
        this._map = map; // The map that is connected to the interface
        this._interface = gui; // The interface that is connected to the map
        this._time_interval = getConfig('simulation_interval');
        this.createElements();
    }

    createElements() {
        let close_button = $('<button>Close</button>').addClass('simulation_input');
        this._slider = $('<input></input>').attr({
            'type': 'range',
            'min': 0,
            'max': 100,
            'value': 0,
        }).addClass('simulation_slider');

        this._play_button = $('<button>Play</button>').addClass('simulation_input');

        let speed = '<select class="simulation_input">';
        speed += '<option value="0.25">0.25x</option>';
        speed += '<option value="0.5">0.5x</option>';
        speed += '<option value="1" selected>1x</option>';
        speed += '<option value="2">2x</option>';
        speed += '<option value="4">4x</option>';
        speed += '</select>';
        this._speed_dial = $(speed);
        this._self.append(
            close_button,
            this._slider,
            this._play_button,
            this._speed_dial
        );

        this._self.on('click', 'button.simulation_input', function (e) {
            let target = $(e.target);
            target.parent().data('simulation').runCommand(target.text(), target);
        });

        this._self.on('change', 'select.simulation_input', function (e) {
            let target = $(e.target);
            let sim = target.parent().data('simulation');
            sim._speed = parseFloat(target.find('option:selected').val());
        });

        this._self.on('input', 'input.simulation_slider', function (e) {
            let target = $(e.target);
            target.parent().data('simulation').jumpToStep(target.val());
        });
    }

    loadSimulation(sim) {
        this._self.css('display', 'flex');
        this._interface._self.css('display', 'none');
        this._agents = sim.setup.agents;
        this._simulation = sim.simulation;
        this._sim_map = sim.setup.map;
        this._slider.attr('max', this._simulation.length - 1);
        this._slider.val(0);
        this.setupSimulation();
        return this;
    }

    setupSimulation() {
        this._map.clear();
        this._map.load(this._sim_map, false);
        this._map.simulationMode(true);

        for (let id in this._agents) {
            let a = new Agent(id, this._agents[id].type, this._map);
            this._map.addAgent(a);
        }

        this._a = this._map.getAgents();
        this.jumpToStep(0);
        return this;
    }

    runCommand(command, target) {
        switch (command) {
            case 'Play':
                if (this._step >= this._simulation.length) {
                    this._step = 0;
                    this.jumpToStep(0)
                }
                this._speed_dial.prop('disabled', true);
                this._slider.prop('disabled', true);
                this.runSimulation();
                target.text('Pause');
                break;
            case 'Pause':
                this.stopSimulation();
                this._speed_dial.prop('disabled', false);
                this._slider.prop('disabled', false);
                target.text('Play');
                break;
            case 'Close':
                this.close();
                break;
            default:
                throw new Error('Unknown command: ' + command);
        }
    }

    jumpToStep(index) {
        this._step = index;
        let step = this._simulation[index];
        for (let agent in step) {
            this._a[agent].jumpTo(step[agent]);
        }
        return this;
    }

    runSimulation() {
        this.simulate();
        this._interval = setInterval(() => {
            this.simulate();
        }, this._time_interval / this._speed);
        return this;
    }

    simulate() {
        this._slider.val(this._step - 1);
        if (this._step >= this._simulation.length) {
            this.stopSimulation();
        }

        let step = this._simulation[this._step];
        for (let agent in step) {
            this._a[agent].simulate(step[agent], this._speed);
        }

        this._step++;
        return this;
    }

    stopSimulation() {
        clearInterval(this._interval);
        this._play_button.text('Play');
        this._speed_dial.prop('disabled', false);
        this._slider.prop('disabled', false);
        return this;
    }

    close() {
        this.stopSimulation();
        this._self.css('display', 'none');
        this._map.simulationMode(false);
        this._map.clear();
        this._interface._self.css('display', 'block');
        return this;
    }
}