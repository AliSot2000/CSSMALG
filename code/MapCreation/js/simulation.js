/**
 * The simulation class is responsible for running the simulation.
 * It is responsible for creating the map, the agents, and the
 * simulation interface itself. It also handles the simulation loop.
 * @class Simulation
 * @param {string} selector The selector for the simulation interface
 * @param {Map} map The map to use for the simulation
 * @param {Interface} gui The interface to used to start the simulation
 */
class Simulation {
    _self = null; // The simulation interface
    _slider = null; // The simulation interface slider
    _map = null; // The map to use for the simulation
    _interface = null; // The simulation interface
    _step = 1; // The current step of the simulation
    _agents = null; // All the agents of the simulation
    _intersections = null; // The intersections of the simulation
    _pre_simulation = null; // The simulation that is loaded from the simulation file
    _sim_map = null; // The map exported that belongs to the simulation
    _speed = 1; // The speed of the simulation
    _interval = null; // The simulation interval
    _time_interval = 1000; // The time interval at which to read the positions of the agents
    _play_button = null; // The play/pause button
    _speed_dial = null; // The speed dial
    _agent_simulation = null; // The simulation of the agents
    _intersection_simulation = null; // The simulation of the intersections
    _frames_per_step = 1; // The number of frames per step

    /**
     * Creates the simulation
     * @param {string} selector The selector for the simulation interface
     * @param {Map} map The map to use for the simulation
     * @param {Interface} gui The interface to used to start the simulation
     */
    constructor(selector = 'div.simulation', map = null, gui = null) {
        this._self = $(selector).data('simulation', this).css('display', 'none'); // The interface element
        this._map = map; // The map that is connected to the interface
        this._interface = gui; // The interface that is connected to the map
        this.createElements();
    }

    /**
     * Creates the elements for the simulation interface
     * @returns {Simulation} Self Reference for chaining
     */
    createElements() {
        let close_button = $('<button>Close</button>').addClass('simulation_input'); // The close button
        this._slider = $('<input>').attr({ // The slider
            'type': 'range', // The type of the input
            'min': 0, // The minimum value of the slider
            'max': 100, // The maximum value of the slider
            'value': 0, // The current value of the slider
        }).addClass('simulation_slider'); // The class of the slider

        this._play_button = $('<button>Play</button>').addClass('simulation_input'); // The play button

        let speed = '<select class="simulation_input">'; // The speed dial
        speed += '<option value="0.25">0.25x</option>'; // The speed dial options
        speed += '<option value="0.5">0.5x</option>';
        speed += '<option value="1" selected>1x</option>';
        speed += '<option value="2">2x</option>';
        speed += '<option value="4">4x</option>';
        speed += '<option value="8">8x</option>';
        speed += '<option value="16">16x</option>';
        speed += '</select>'; // The end of the speed dial
        this._speed_dial = $(speed); // The speed dial
        this._self.append( // Append the elements to the interface
            close_button,
            this._slider,
            this._play_button,
            this._speed_dial
        );

        // On click of a button run a command over this class
        this._self.on('click', 'button.simulation_input', function (e) {
            let target = $(e.target); // The target of the click
            target.parent().data('simulation').runCommand(target.text(), target); // Run the command
        });

        // On change of the speed dial change the speed of the simulation
        this._self.on('change', 'select.simulation_input', function (e) {
            let target = $(e.target); // The target of the click
            let sim = target.parent().data('simulation'); // The simulation
            sim._speed = parseFloat(target.find('option:selected').val()); // The speed of the simulation
        });

        // On change of the slider run a command over this class
        this._self.on('input', 'input.simulation_slider', function (e) {
            let target = $(e.target); // The target of the click
            target.parent().data('simulation').stopSimulation().jumpToStep(parseInt(target.val())); // Change the step of the simulation
        });
        return this;
    }

    /**
     * Load the simulation and call the setup function
     * @param {Object} sim The simulation as it is outputted by the simulation file
     * @returns {Simulation} Self Reference for chaining
     */
    loadSimulation(sim) {
        this._self.css('display', 'flex'); // Show the simulation interface
        this._interface._self.css('display', 'none'); // Hide the interface
        this._agents = sim.setup.agents; // The agents of the simulation
        this._time_interval = sim.peripherals.time_step; // The time interval at which to read the positions of the agents
        this._pre_simulation = sim.simulation; // The simulation that is loaded from the simulation file
        if (isEmpty(sim.setup.map)) { // If there is no map
            alert('No map was given, so the simulation will not be loaded'); // Alert the user
            return this;
        }
        this._sim_map = sim.setup.map; // The map exported that belongs to the simulation
        this.setupSimulation(); // Setup the simulation
        return this;
    }


    /**
     * Sets up the simulation. This includes the loading of the map, the creation of the agents and the precalculation of the simulation
     * @returns {Simulation} Self Reference for chaining
     */
    setupSimulation() {
        this._map.clear(); // Clear the map
        this._map.load(this._sim_map, false); // Load the map
        this._map.simulationMode(true); // Set the map to simulation mode

        for (let id in this._agents) { // For each agent
            let a = new Agent(id, this._agents[id].type, this._map); // Create the agent
            this._map.addAgent(a); // Add the agent to the map
        }

        this._agents = this._map.getAgents(); // Get the agents from the map
        this._intersections = this._map.getIntersections(); // Get the intersections from the map

        $(document.body).toggleClass('calculating'); // Toggle the loading class
        setTimeout(() => { // Wait for the map to load
            this.precalculateSimulation() // Precalculate the simulation

            this._slider.attr('max', this._agent_simulation.length); // Set the maximum value of the slider
            this._slider.val(0); // Set the value of the slider to 0

            this._step = 0; // Set the step to 0
            this.jumpToStep(0); // Jump to step 0
            setTimeout(() => {
                $(document.body).toggleClass('calculating'); // Hide the loading screen
            }, 100);
        }, 100);

        return this;
    }

    /**
     * Precalculates the simulation animation
     * @returns {Simulation} Self Reference for chaining
     */
    precalculateSimulation() {
        this._agent_simulation = []; // The simulation data
        this._intersection_simulation = []; // The simulation data
        let total_steps = this._pre_simulation.length;
        this._frames_per_step = Math.floor(1000/30 * this._time_interval); // The number of frames per step
        let agent_last_update = {}; // The last update for each agent in the simulation
        let intersection_last_update = {}; // The last update for each intersection in the simulation

        if (this._pre_simulation.length > 0) { // If there is a pre-simulation
            let agent_step = this._pre_simulation[0].agents; // The first step of the pre-simulation
            let intersection_step = this._pre_simulation[0].intersections; // The first step of the pre-simulation

            let agent_new_step = { // The first step of the simulation
                changed: {}
            }

            let intersection_new_step = { // The first step of the simulation
                changed: {}
            }

            for (let id in this._agents) { // For each agent
                agent_last_update[id] = 0; // Set the last update to 0
                if (id in agent_step) { // If the agent is in the pre-simulation
                    agent_new_step.changed[id] = this.calculatePosition(this._agents[id], agent_step[id]);
                } else { // If the agent is not in the pre-simulation
                    agent_new_step.changed[id] = { // Add the agent to the first step of the simulation
                        active: false // Set the agent to inactive
                    };
                }
            }

            for (let id in this._intersections) { // For each intersection
                intersection_last_update[id] = 0; // Set the last update to 0
                if (id in intersection_step) { // If the intersection is in the pre-simulation
                    intersection_new_step.changed[id] = {
                        green: sanitiseRoadIds(intersection_step[id].green),
                        red: sanitiseRoadIds(intersection_step[id].red)
                    }
                } else { // If the intersection is not in the pre-simulation
                    intersection_new_step.changed[id] = { // Add the intersection to the first step of the simulation
                        red: this._intersections[id].getConnectedRoads()
                    };
                }
            }

            this._agent_simulation.push(agent_new_step); // Add the first step to the simulation
            this._intersection_simulation.push(intersection_new_step); // Add the first step to the simulation
        } else {
            alert('Simulation is too short to be precalculated'); // If the simulation is too short to be precalculated
            return this; // Return
        }

        let percentage = 0; // The percentage of the simulation that has been precalculated
        for (let step_num = 1; step_num < total_steps; step_num++) { // For each step in the pre-simulation
            let new_percentage = snap(Math.floor((step_num / total_steps) * 100), 5); // Calculate the percentage of the simulation that has been precalculated
            if (percentage !== new_percentage) {
                percentage = new_percentage; // Set the percentage to the new percentage
                console.log('Precalculating: ' + percentage + '%');
            }
            let agent_step = this._pre_simulation[step_num].agents; // The current step

            let agent_new_steps = []; // The new steps that will be added to the simulation
            for (let frame = 0; frame < this._frames_per_step; frame++) { // For each frame in the step
                agent_new_steps.push({same: {}, changed: {}}); // Add a new step to the simulation
            }

            for (let id in this._agents) { // For each agent
                if (!isEmpty(agent_step) && id in agent_step) { // If the agent is in the pre-simulation
                    let new_position = this.calculatePosition(this._agents[id], agent_step[id]); // Calculate the new position of the agent
                    let current_position = this._agent_simulation[agent_last_update[id]].changed[id]; // Get the current position of the agent
                    if (new_position.active && !current_position.active) { // If an agent is getting turned active
                        for (let frame = 0; frame < agent_new_steps.length - 1; frame++) { // For each frame in the step
                            agent_new_steps[frame].same[id] = agent_last_update[id]; // Set the agent to the same as the last update
                        }

                        agent_new_steps[agent_new_steps.length - 1].changed[id] = new_position; // Set the last frame to the new position
                        agent_last_update[id] = step_num * agent_new_steps.length; // Set the last update to the last frame of the step
                        continue;
                    }

                    if (!new_position.active && current_position.active) { // If the agent is getting turned inactive
                        agent_new_steps[0].changed[id] = new_position; // Set the first frame to the new position
                        agent_last_update[id] = (step_num - 1) * agent_new_steps.length + 1; // Set the last update to the first frame of the step

                        for (let frame = 1; frame < agent_new_steps.length; frame++) { // For each frame in the step
                            agent_new_steps[frame].same[id] = agent_last_update[id]; // Set the agent to the same as the last update
                        }
                        continue;
                    }

                    // If the agent stays at the same position or stays inactive
                    if ((new_position.x === current_position.x && new_position.y === current_position.y) || (!new_position.active && !current_position.active)) {
                        for (let frame = 0; frame < agent_new_steps.length; frame++) { // For each frame in the step
                            agent_new_steps[frame].same[id] = agent_last_update[id]; // Set the agent to the same as the last update
                        }
                        continue;
                    }

                    agent_last_update[id] = step_num * agent_new_steps.length; // Set the last update to the last frame of the step
                    let start = new Point (current_position.x, current_position.y, current_position.angle); // The start point
                    let end = new Point (new_position.x, new_position.y,  truncateAngle(new_position.angle + Math.PI, 2 * Math.PI)); // The end point
                    let c = calculateCubicPoints(start, end);
                    let control_points = [start, c.pm, c.qm, end]; // The control points of the curve
                    for (let frame = 0; frame < agent_new_steps.length; frame++) { // For each frame in the step
                        let point = deCasteljausAlgorithm(control_points, (frame + 1) / (agent_new_steps.length + 1)); // Calculate the point on the curve
                        agent_new_steps[frame].changed[id] = {
                            x: point.x,
                            y: point.y,
                            angle: point.angle,
                            active: true
                        }
                    }
                } else { // If the agent is not in the pre-simulation
                    for (let frame = 0; frame < agent_new_steps.length; frame++) { // For each frame in the step
                        agent_new_steps[frame].same[id] = agent_last_update[id]; // Set the agent to the same as the last update
                    }
                    continue;
                }
            }

            let intersection_new_step = {same: {}, changed: {}}; // The new step that will be added to the simulation
            let intersection_step = this._pre_simulation[step_num].intersections; // The current step
            let intersection_empty_step = isEmpty(intersection_step); // If the step is empty
            for (let id in this._intersections) { // For each intersection
                if (!intersection_empty_step && id in intersection_step) { // If the intersection is in the pre-simulation
                    intersection_new_step.changed[id] = {
                        green: sanitiseRoadIds(intersection_step[id].green),
                        red: sanitiseRoadIds(intersection_step[id].red)
                    }
                    intersection_last_update[id] = step_num;
                } else { // If the intersection is not in the pre-simulation
                    intersection_new_step.same[id] = intersection_last_update[id];
                }
            }
            this._agent_simulation = this._agent_simulation.concat(agent_new_steps); // Add the new steps to the simulation
            this._intersection_simulation.push(intersection_new_step); // Add the new step to the simulation
        }
        return this;
    }

    /**
     * Calculates the position of the agent in the step
     * @param {Agent} agent The agent
     * @param {Object} agent_step The step of the agent
     * @returns {{x: number, y: number, angle: number, active: true} | {active: false}} The position of the agent in the step
     */
    calculatePosition(agent, agent_step) {
        if (agent_step.active || agent_step.active === undefined) { // If the agent is active
            let flip = agent_step.road.charAt(0) === '!'; // If the agent is going in the opposite direction
            let road_id = flip ? agent_step.road.substr(1) : agent_step.road; // The id of the road
            let road = this._map.getRoad(road_id); // The road
            let road_width = road.getRoadWidth(); // The width of the road
            let position; // The position of the agent
            if (flip) { // If the agent is going in the opposite direction
                position = road.getAgentPosition(1 - agent_step.percent_to_end, road_width - agent_step.distance_to_side - agent._half_width); // Get the position of the agent
                position.angle += Math.PI; // Add PI to the angle to make the agent face the opposite direction
            } else {
                position = road.getAgentPosition(agent_step.percent_to_end, agent_step.distance_to_side + agent._half_width); // Get the position of the agent
            }

            return {
                x: position.x, // Set the x position
                y: position.y, // Set the y position
                angle: truncateAngle(position.angle, 2 * Math.PI), // Set the angle
                active: true // Set the agent to active
            }
        }
        return {
            active: false // Set the agent to inactive
        }
    }

    /**
     * Runs a command executed by a button
     * @param {string} command The command to run
     * @param {jQuery} target The target of the command
     * @returns {Simulation} Self Reference for chaining
     */
    runCommand(command, target) {
        switch (command) {
            case 'Play': // If the command is play
                if (this._step >= this._agent_simulation.length) { // If the simulation is at the end
                    this._step = 0; // Set the step to 0
                    this.jumpToStep(0) // Jump to the step
                }
                this._speed_dial.prop('disabled', true); // Disable the speed dial
                this.runSimulation(); // Run the simulation
                target.text('Pause'); // Set the text to pause
                break;
            case 'Pause': // If the command is pause
                this.stopSimulation(); // Stop the simulation
                target.text('Play'); // Set the text to play
                break;
            case 'Close':
                this.close(); // Close the simulation
                break;
            default:
                throw new Error('Unknown command: ' + command); // Throw an error if the command is unknown
        }
        return this;
    }

    /**
     * Runs a single step of the simulation. Gets the last change of each agent and sets the position of the agent to that
     * @param {number} index The index of the step
     * @returns {Simulation} Self Reference for chaining
     */
    jumpToStep(index) {
        this._step = index; // Set the step
        let intersection_index = Math.ceil(index / this._frames_per_step);

        if (index < 1) { // If the step is less than 0
            index = 0; // Set the step to 0
            intersection_index = 0; // Set the intersection index to 0
        }
        if (index >= this._agent_simulation.length) { // If the step is greater than the length of the simulation
            index = this._agent_simulation.length - 1; // Set the step to the last step
            intersection_index = this._intersection_simulation.length - 1; // Set the intersection index to the last step
        }

        let step = this._agent_simulation[index]; // The step
        for (let id in this._agents) { // For each agent
            if (id in step.changed) { // If the agent changed in the step
                this._agents[id].simulate(step.changed[id]); // Set the position of the agent to the position in the step
            } else {
                let last_step = this._agent_simulation[step.same[id]].changed[id]; // The last step that the agent changed
                this._agents[id].simulate(last_step); // Set the position of the agent to the position in the step
            }
        }

        let intersection_step = this._intersection_simulation[intersection_index]; // The intersection step
        for (let id in this._intersections) { // For each intersection
            if (id in intersection_step.changed) { // If the intersection changed in the step
                this._intersections[id].setTrafficLights(intersection_step.changed[id]); // Set the position of the intersection to the position in the step
            } else {
                let last_step = this._intersection_simulation[intersection_step.same[id]].changed[id]; // The last step that the intersection changed
                this._intersections[id].setTrafficLights(last_step); // Set the position of the intersection to the position in the step
            }
        }
        return this;
    }

    /**
     * Runs the simulation
     * @returns {Simulation} Self Reference for chaining
     */
    runSimulation() {
        this.simulate(); // Run the simulation
        this._interval = setInterval(() => { // Set the interval
            this.simulate(); // Run the simulation
        }, 1000/(30 * (this._speed < 1 ? this._speed : 1))); // Run the simulation 30 times a second if the speed is bigger than 1
        return this;
    }

    /**
     * A single simulation step
     * @returns {Simulation} Self Reference for chaining
     */
    simulate() {
        this._slider.val(this._step - 1); // Set the slider to the step
        if (this._step >= this._agent_simulation.length) { // If the step is greater than the length of the simulation
            this.stopSimulation(); // Stop the simulation
        }

        let step = this._agent_simulation[this._step]; // The step
        let intersection_index = Math.ceil(this._step / this._frames_per_step);

        for (let id in step.changed) { // For each agent that changed in the step
            this._agents[id].simulate(step.changed[id]); // Set the position of the agent to the position in the step
        }

        let intersection_step = this._intersection_simulation[intersection_index]; // The intersection step
        for (let id in intersection_step.changed) { // For each intersection that changed in the step
            this._intersections[id].setTrafficLights(intersection_step.changed[id]); // Set the position of the intersection to the position in the step
        }

        this._step += this._speed > 1 ? this._speed : 1; // Increase the step. This will skip steps if the speed is bigger than 1
        return this;
    }

    /**
     * Stops the simulation
     * @returns {Simulation} Self Reference for chaining
     */
    stopSimulation() {
        clearInterval(this._interval); // Clear the interval
        this._play_button.text('Play'); // Set the text of the play button to play
        this._speed_dial.prop('disabled', false); // Enable the speed dial
        return this;
    }

    /**
     * Closes the simulation and clear the map
     * @returns {Simulation} Self Reference for chaining
     */
    close() {
        this.stopSimulation(); // Stop the simulation
        this._self.css('display', 'none'); // Hide the simulation
        this._map.simulationMode(false); // Disable simulation mode
        this._map.clear(); // Clear the map
        this._interface._self.css('display', 'block'); // Show the interface
        return this;
    }
}