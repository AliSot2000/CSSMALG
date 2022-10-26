/**
 * Grid Class
 * @class Grid
 * @param {number} cellSize The size of the cells in the grid
 */
class Grid {
    _self = null;
    _gradient = null;

    /**
     * Creates a Grid
     * @constructor
     * @param {number} cellSize The size of the cells in the grid
     */
    constructor(cellSize) {
        // Initialize Private Values
        this._self = $(svgElement("svg")); // Create the SVG element

        $('div.drawing_area').append(this._self); // Add the SVG element to the DOM

        // Set the SVG element's attributes
        this._self.addClass("grid_container");

        // Create all the parts needed for the grid
        this.createGradient().createGrid(cellSize).makeMoveable();
    }

    /**
     * Creates the gradient for the grid
     * @function createGradient
     * @return {Grid} Self reference for chaining
     */
    createGradient() {
        let defs = $(svgElement("defs")); // Create the wrapping defs element
        this._gradient = $(svgElement("radialGradient")); // Create the gradient element
        this._gradient.append($(svgElement("stop")).addClass("gradient_inner").attr('offset', '50%')); // Create the inner circle element
        this._gradient.append($(svgElement("stop")).addClass("gradient_outer").attr('offset', '100%')); // Create the outer circle element
        this._gradient.attr({'r': '150', 'id': 'gradient', 'gradientUnits': 'userSpaceOnUse'}); // Set the gradient's attributes
        defs.append(this._gradient); // Add the gradient to the defs element
        this._self.append(defs); // Add the defs element to the grid_container element

        return this;
    }

    /**
     * Updates the position of the gradient
     * @param {number} x The x coordinate of the gradient
     * @param {number} y The y coordinate of the gradient
     * @return {Grid} Self reference for chaining
     */
    updateGradientPosition(x, y) {
        this._gradient.attr({'cx': x, 'cy': y, 'fx': x, 'fy': y}); // Set the gradient's new position

        return this;
    }

    /**
     * Makes the grid moveable
     * @function makeMoveable
     * @return {Grid} Self reference for chaining
     */
    makeMoveable() {
        $(document.body).on('mousemove', {'grid': this}, function (event){ // When the mouse moves
            event.data.grid.updateGradientPosition(event.pageX, event.pageY); // Update the gradient's position
        });

        return this;
    }

    /**
     * Creates the grid svg lines
     * @param {number} cellSize The size of the cells in the grid
     * @return {Grid} Self reference for chaining
     */
    createGrid(cellSize) {
        let width = window.innerWidth; // Get the width of the window
        let height = window.innerHeight; // Get the height of the window

        let grid = $(svgElement("g")).attr('stroke', 'url(#gradient)').addClass("grid"); // Create the surrounding grid element
        this._self.append(grid); // Add the grid element to the grid_container element

        for (let i = 0; i < width; i += cellSize) { // Loop through the width of the window in cellSize increments
            let line = $(svgElement("line"));
            line.attr("x1", i);
            line.attr("y1", 0);
            line.attr("x2", i);
            line.attr("y2", height);
            grid.append(line); // Adding a vertical line to the grid element every loop
        }

        for (let i = 0; i < height; i += cellSize) { // Loop through the height of the window in cellSize increments
            let line = $(svgElement("line"));
            line.attr("x1", 0);
            line.attr("y1", i);
            line.attr("x2", width);
            line.attr("y2", i);
            grid.append(line); // Adding a horizontal line to the grid element every loop
        }

        return this;
    }
}