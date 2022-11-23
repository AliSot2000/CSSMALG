/**
 * Loading screen class
 * @class Loading
 * @param {string} selector - The selector of the loading screen
 */
class Loading {
    _self = null;
    _bar_wrapper = null;
    _bar = null;
    _main_header = null;
    _sub_header = null;

    /**
     * Initialize the loading screen
     * @constructor
     * @param selector
     */
    constructor(selector = 'div.loading') {
        this._self = $(selector); // Get the loading screen
        this.createElements(); // Create the elements
    }

    createElements() {
        this._bar_wrapper = $('<div class="loading_bar_wrapper"></div>');
        this._bar = $('<div class="loading_bar"></div>');

        this._main_header = $('<div class="loading_main_header"></div>');
        this._sub_header = $('<div class="loading_sub_header"></div>');

        this._bar_wrapper.append(this._bar);
        this._self.append(this._bar_wrapper, this._main_header, this._sub_header);
        return this;
    }

    show() {
        this._self.css('display', 'flex');
        return this;
    }

    hide() {
        this._self.css('display', 'none');
        return this;
    }

    setPercent(percent) {
        this._bar.css('width', `${percent}%`);
        return this;
    }

    setMainHeader(text) {
        this._main_header.text(text);
        return this;
    }

    setSubHeader(text) {
        this._sub_header.text(text);
        return this;
    }
}