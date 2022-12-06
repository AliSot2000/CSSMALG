/**
 * Loading screen class
 * @class Loading
 * @param {string} selector The selector of the loading screen
 */
class Loading {
    _self = null;
    _bar_wrapper = null;
    _bar = null;
    _main_header = null;
    _sub_header = null;
    _percent = 0;

    /**
     * Initialize the loading screen
     * @constructor
     * @param {string} selector The selector of the loading screen
     */
    constructor(selector = 'div.loading') {
        this._self = $(selector); // Get the loading screen
        this.createElements(); // Create the elements
    }

    /**
     * Create the elements of the loading screen
     * @returns {Loading} Self Reference for chaining
     */
    createElements() {
        this._bar_wrapper = $('<div class="loading_bar_wrapper"></div>'); // Create the bar wrapper
        this._bar = $('<div class="loading_bar"></div>'); // Create the bar

        this._main_header = $('<div class="loading_main_header"></div>'); // Create the main header
        this._sub_header = $('<div class="loading_sub_header"></div>'); // Create the sub header

        this._bar_wrapper.append(this._bar); // Append the bar to the bar wrapper
        this._self.append(this._bar_wrapper, this._main_header, this._sub_header); // Append the bar wrapper, main header and sub header to the loading screen
        return this;
    }

    /**
     * Show the loading screen
     * @returns {Loading} Self Reference for chaining
     */
    show() {
        this._self.css('display', 'flex'); // Show the loading screen
        return this;
    }

    /**
     * Hide the loading screen
     * @returns {Loading} Self Reference for chaining
     */
    hide() {
        this._self.css('display', 'none'); // Hide the loading screen
        return this;
    }

    /**
     * Set the progress of the loading screen
     * @param {number} percent The percentage of the progress
     * @returns {Loading} Self Reference for chaining
     */
    setPercent(percent) {
        this._percent = percent; // Set the percentage
        this._bar.css('width', `${percent}%`);
        return this;
    }

    /**
     * Get the percentage of the loading screen
     * @returns {number} The percentage of the loading screen
     */
    getPercent() {
        return this._percent;
    }
    /**
     * Set the main header of the loading screen
     * @param {string} text The text of the main header
     * @returns {Loading} Self Reference for chaining
     */
    setMainHeader(text) {
        this._main_header.text(text); // Set the text of the main header
        return this;
    }

    /**
     * Set the sub header of the loading screen
     * @param {string} text The text of the sub header
     * @returns {Loading} Self Reference for chaining
     */
    setSubHeader(text) {
        this._sub_header.text(text);
        return this;
    }
}