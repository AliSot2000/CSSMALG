/**
 * Grid Class
 * @class Grid
 * @param {number} cellSize The size of the cells in the grid
 */
class Grid {
    _self = null;
    _gradient = null;
    _horizontalLines = null;
    _verticalLines = null;
    _cellSize = null;
    _currentSize = null;

    /**
     * Creates a Grid
     * @constructor
     * @param {number} cellSize The size of the cells in the grid
     * @param {Object} size The size of the grid
     */
    constructor(cellSize) {
        // Initialize Private Values
        this._self = $(svgElement("svg")); // Create the SVG element
        this._currentSize = {width: 0, height: 0}; // Set the current size to 0

        // Set the SVG element's attributes
        this._self.addClass("grid_container");

        this._horizontalLines = $(svgElement("g")).addClass("grid").attr('stroke', 'url(#gradient)');
        this._verticalLines = $(svgElement("g")).addClass("grid").attr('stroke', 'url(#gradient)');
        this._self.append(this._horizontalLines, this._verticalLines);

        this._cellSize = cellSize;

        // Create all the parts needed for the grid
        this.createGradient().makeMoveable();
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
            event.data.grid.updateGradientPosition(event.pageX + $(document.body).scrollLeft(), event.pageY + $(document.body).scrollTop()); // Update the gradient's position
        });

        return this;
    }

    /**
     * Creates the grid svg lines
     * @return {Grid} Self reference for chaining
     */
    expand(newSize) {
        let horizontal = this._horizontalLines.children(); // Get the horizontal lines
        let vertical = this._verticalLines.children(); // Get the vertical lines

        for (let i = 0; i < vertical.length; i++) { // For each horizontal line
            $(vertical[i]).attr("y2", newSize.height); // Set the line's new height
        }

        for (let i = 0; i < horizontal.length; i++) { // For each vertical line
            $(horizontal[i]).attr("x2", newSize.width); // Set the line's new width
        }


        for (let i = this._currentSize.width; i < newSize.width; i += this._cellSize) { // Loop through the width of the window in cellSize increments
            let line = $(svgElement("line"));
            line.attr("x1", i);
            line.attr("y1", 0);
            line.attr("x2", i);
            line.attr("y2", newSize.height);
            this._verticalLines.append(line); // Adding a vertical line to the grid element every loop
        }

        for (let i = this._currentSize.height; i < newSize.height; i += this._cellSize) { // Loop through the height of the window in cellSize increments
            let line = $(svgElement("line"));
            line.attr("x1", 0);
            line.attr("y1", i);
            line.attr("x2", newSize.width);
            line.attr("y2", i);
            this._horizontalLines.append(line); // Adding a horizontal line to the grid element every loop
        }

        return this;
    }

    recalculate(newSize) {
        if (this._currentSize.width < newSize.width || this._currentSize.height < newSize.height) {
            this.expand(newSize);
        }

        if (this._currentSize.width > newSize.width) {
            this._verticalLines.children().each(function () {
                if ($(this).attr("x1") > newSize.width) {
                    $(this).remove();
                }
            });
        }

        if (this._currentSize.height > newSize.height) {
            this._horizontalLines.children().each(function () {
                if ($(this).attr("y1") > newSize.height) {
                    $(this).remove();
                }
            });
        }
    }

    /**
     * Gets the grid element
     * @returns {jQuery} The grid element
     */
    getGrid() {
        return this._self;
    }
}