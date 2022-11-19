var CONFIG = {
    // Visual settings
    grid_size: 50,
    road_border_width: 2,
    road_lane_width: 20,
    arrow_length: 10,

    // Simulation settings
    simulation_interval: 250,
    pixels_to_meter: 0.1
};

/**
 * Gets the config value or returns the default config value
 * @param {string} name The name of the config value
 * @returns {*} The config value
 */
function getConfig(name) {
    try {
        return CONFIG[name]; // Try to get the config value
    } catch (e) {
        console.error('Default Config Used'); // Log a warning, since the config should always be set
        let defaultConfig = { // Create a default config
            grid_size: 50,
            road_border_width: 2,
            road_lane_width: 20,
            arrow_length: 20,
            simulation_interval: 250,
            pixels_to_meter: 0.1
        };
        return defaultConfig[name]; // Return the default config value
    }
}