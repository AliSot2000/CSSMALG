class Simulation {
    _self = null;
    _slider = null;
    _map = null;
    _interface = null;
    _step = 1;
    _agents = null;
    _pre_simulation = null;
    _sim_map = null;
    _speed = 1;
    _interval = null;
    _time_interval = 1000;
    _play_button = null;
    _speed_dial = null;

    constructor(selector = 'div.simulation', map = null, gui = null) {
        this._self = $(selector).data('simulation', this).css('display', 'none'); // The interface element
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
            target.parent().data('simulation').stopSimulation().jumpToStep(target.val());
        });
    }

    loadSimulation(sim) {
        this._self.css('display', 'flex');
        this._interface._self.css('display', 'none');
        this._agents = sim.setup.agents;
        this._time_interval = sim.peripherals.time_step;
        this._pre_simulation = sim.simulation;
        this._sim_map = sim.setup.map;
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

        this._agents = this._map.getAgents();

        this.precalculateSimulation()

        this._slider.attr('max', this._simulation.length);
        this._slider.val(0);

        this._step = 0;
        this.jumpToStep(0);

        return this;
    }

    precalculateSimulation() {
        this._simulation = []; // The simulation data
        let frames_per_step = Math.floor(1000/30 * this._time_interval); // The number of frames per step
        let last_update = {}; // The last update for each agent in the simulation
        if (this._pre_simulation.length > 0) { // If there is a pre-simulation
            let step = this._pre_simulation[0]; // The first step of the pre-simulation

            let new_step = { // The first step of the simulation
                changed: {}
            }

            for (let id in this._agents) { // For each agent
                last_update[id] = 0; // Set the last update to 0
                if (id in step) { // If the agent is in the pre-simulation
                    new_step.changed[id] = this.calculatePosition(this._agents[id], step[id]);
                } else { // If the agent is not in the pre-simulation
                    new_step.changed[id] = { // Add the agent to the first step of the simulation
                        active: false // Set the agent to inactive
                    };
                }
            }
            this._simulation.push(new_step); // Add the first step to the simulation
        } else {
            alert('Simulation is too short to be precalculated'); // If the simulation is too short to be precalculated
            return this; // Return
        }

        for (let step_num = 1; step_num < this._pre_simulation.length; step_num++) { // For each step in the pre-simulation
            let pre_calculated_step = this._pre_simulation[step_num]; // The current step

            let new_steps = []; // The new steps that will be added to the simulation
            for (let frame = 0; frame < frames_per_step; frame++) { // For each frame in the step
                new_steps.push({same: {}, changed: {}}); // Add a new step to the simulation
            }

            for (let id in this._agents) { // For each agent
                if (id in pre_calculated_step) { // If the agent is in the pre-simulation
                    let new_position = this.calculatePosition(this._agents[id], pre_calculated_step[id]); // Calculate the new position of the agent
                    let current_position = this._simulation[last_update[id]].changed[id];

                    if (new_position.active && !current_position.active) { // If a agent is getting turned active
                        for (let frame = 0; frame < new_steps.length - 1; frame++) { // For each frame in the step
                            new_steps[frame].same[id] = last_update[id]; // Set the agent to the same as the last update
                        }

                        new_steps[new_steps.length - 1].changed[id] = new_position; // Set the last frame to the new position
                        last_update[id] = (step_num - 1) * new_steps.length + new_steps.length - 1; // Set the last update to the last frame of the step
                        continue;
                    }

                    if (!new_position.active && current_position.active) { // If the agent is getting turned inactive
                        new_steps[0].changed[id] = new_position; // Set the first frame to the new position
                        last_update[id] = (step_num - 1) * new_steps.length; // Set the last update to the first frame of the step

                        for (let frame = 1; frame < new_steps.length; frame++) {
                            new_steps[frame].same[id] = last_update[id];
                        }
                        continue;
                    }

                    // If the agent stays at the same position or stays inactive
                    if (((new_position.x === current_position.x && new_position.y === current_position.y) && new_position.angle === current_position.angle) || (!new_position.active && !current_position.active)) {
                        for (let frame = 0; frame < new_steps.length; frame++) {
                            new_steps[frame].same[id] = last_update[id];
                        }
                        continue;
                    }

                    last_update[id] = (step_num - 1) * new_steps.length + new_steps.length - 1; // Set the last update to the last frame of the step
                    if (current_position.angle < new_position.angle && new_position.angle - current_position.angle > Math.PI) { // Make sure the angle is the shortest path
                        current_position.angle += 2 * Math.PI;
                    }
                    for (let frame = 0; frame < new_steps.length; frame++) { // For each frame in the step
                        new_steps[frame].changed[id] = this.calculateStep(frame / new_steps.length, current_position, new_position); // Calculate the position of the agent in the frame
                    }
                } else { // If the agent is not in the pre-simulation
                    for (let frame = 0; frame < new_steps.length; frame++) { // For each frame in the step
                        new_steps[frame].same[id] = last_update[id]; // Set the agent to the same as the last update
                    }
                    break;
                }
            }
            this._simulation = this._simulation.concat(new_steps); // Add the new steps to the simulation
        }
    }

    calculateStep(percent, start, end) {
        return {
            x: lerp(start.x, end.x, percent),
            y: lerp(start.y, end.y, percent),
            angle: truncateAngle(lerp(start.angle, end.angle, percent), 2 * Math.PI),
            active: true
        }
    }

    calculatePosition(agent, agent_step) {
        let flip = agent_step.road.charAt(0) === '!';
        let road_id = flip ? agent_step.road.substr(1) : agent_step.road;
        let road = this._map.getRoad(road_id);
        let road_width = road.getRoadWidth();
        let position;
        if (flip) {
            position = road.getAgentPosition(1 - agent_step.percent_to_end, road_width - agent_step.distance_to_side - agent._half_width);
            position.angle += Math.PI;
        } else {
            position = road.getAgentPosition(agent_step.percent_to_end, agent_step.distance_to_side + agent._half_width);
        }
        if (agent_step.active || agent_step.active === undefined) {
            return {
                x: position.x,
                y: position.y,
                angle: truncateAngle(position.angle, 2 * Math.PI),
                active: true
            }
        }
        return {
            active: false
        }
    }


    runCommand(command, target) {
        switch (command) {
            case 'Play':
                if (this._step >= this._simulation.length) {
                    this._step = 0;
                    this.jumpToStep(0)
                }
                this._speed_dial.prop('disabled', true);
                this.runSimulation();
                target.text('Pause');
                break;
            case 'Pause':
                this.stopSimulation();
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
        if (index < 0) {
            index = 0;
        }
        if (index >= this._simulation.length) {
            index = this._simulation.length - 1;
        }
        let step = this._simulation[index];
        for (let id in this._agents) {
            if (id in step.changed) {
                this._agents[id].simulate(step.changed[id].x, step.changed[id].y, step.changed[id].angle, step.changed[id].active);
            } else {
                let last_step = this._simulation[step.same[id]].changed[id];
                this._agents[id].simulate(last_step.x, last_step.y, last_step.angle, last_step.active);
            }
        }
        return this;
    }

    runSimulation() {
        this.simulate();
        this._interval = setInterval(() => {
            this.simulate();
        }, 1000/30);
        return this;
    }

    simulate() {
        this._slider.val(this._step - 1);
        if (this._step >= this._simulation.length) {
            this.stopSimulation();
        }

        let step = this._simulation[this._step];
        for (let id in step.changed) {
            this._agents[id].simulate(step.changed[id].x, step.changed[id].y, step.changed[id].angle, step.changed[id].active);
        }

        this._step++;
        return this;
    }

    stopSimulation() {
        clearInterval(this._interval);
        this._play_button.text('Play');
        this._speed_dial.prop('disabled', false);
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