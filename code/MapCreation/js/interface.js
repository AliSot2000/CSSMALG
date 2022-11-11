class Interface {
    _self = null;
    _toggle_button = null;
    _body = null;
    _map = null;

    constructor(selector = 'div.interface', map = null) {
        this._self = $(selector).data('interface', this);
        this._map = map;

        this.createElements()
        this.overview();
    }

    createElements() {
        this._toggle_button = $('<button>&#9664;</button>').addClass('interface_toggle').data('interface', this);
        this._toggle_button.on('click', function() {
            $(this).data('interface').toggle();
        });

        this._body = $('<div></div>').addClass('interface_body').on('click', '.interface_button, .small_button', {interface: this}, function(event) {
            event.data.interface.runCommand($(this).html(), $(this).data());
        });

        this._self.append(this._toggle_button, this._body);
    }

    toggle() {
        if (this._self.hasClass('interface_hidden')) {
            this._self.removeClass('interface_hidden');
            this._toggle_button.html('&#9654;');
        } else {
            this._self.addClass('interface_hidden');
            this._toggle_button.html('&#9664;');
        }
    }

    overview() {
        this._body.empty();
        this._body.append('<h2>General</h2><div class="spacer"></div>');
        this._body.append('<button class="interface_button">Save</button>');
        this._body.append('<button class="interface_button">Load</button>');
        this._body.append('<button class="interface_button">Export as Save</button>');
        this._body.append('<button class="interface_button">Export for Simulation</button>');
        this._body.append('<button class="interface_button">Import Save</button>');

        this._body.append('<h2>Creation</h2><div class="spacer"></div>');
        this._body.append('<button class="interface_button">Add Road</button>');
        this._body.append('<button class="interface_button">Add Intersection</button>');

        this._body.append($('<button class="interface_button">Edit Roads</button>'));
        this._body.append('<button class="interface_button">Edit Intersections</button>');
    }

    editRoads() {
        this._body.empty();
        this._body.append('<button class="small_button">Back to Menu</button>');
        this._body.append('<h2>Roads</h2><div class="spacer"></div>');
        let roads = this._map.getRoads();
        for (let road in roads) {
            this._body.append($('<button class="interface_button">' + road + '</button>').data('command', 'editRoad'));
        }
    }

    editRoad(road) {
        let r = this._map.getRoad(road);
        this._body.empty();

        this._body.append('<button class="small_button">Back to Roads</button>');
        this._body.append('<h2>Road: </h2><span>' + road + '</span>');
        this._body.append('<button class="small_button">Edit Name</button><div class="spacer"></div>');
        this._body.append('<h2>Lanes:</h2>');
        this._body.append('<button class="small_button">Add Lane</button>');
        let lane_list = $('<div class="lanes"></div>');
        let lanes = r.getLanes();
        let l;
        let lane;
        for (let i = 0; i < lanes.length; i++) {
            lane = lanes[i];
            l = '<div class="lane"><div class="name">Lane <span>' + i + '</span></div>';
            l += '<div class="input">Bike Only <input type="checkbox"' + (lane.type === 'bike' ? ' checked' : '') + '></div>';
            l += '<div class="input">Facing <input type="checkbox"' + (lane.direction > 0 ? ' checked' : '') + '></div>';
            l += '<button class="del_lane">Delete</button>';
            l += '<div class="input">Left <input type="checkbox"' + (1 > 0 ? ' checked' : '') + '></div>';
            l += '<div class="input">Straight <input type="checkbox"' + (1 > 0 ? ' checked' : '') + '></div>';
            l += '<div class="input">Right <input type="checkbox"' + (1 > 0 ? ' checked' : '') + '></div>';
            l += '</div>';
            lane_list.append(l);
        }
        this._body.append(lane_list);
        this._body.append('<h2>Edit Road</h2><div class="spacer"></div>');
        this._body.append('<button class="interface_button">Save Changes</button>');
        this._body.append($('<button class="interface_button">Delete</button>').data('road', road));
        this._body.append('<h2>Connected Intersections</h2>');
        let intersections = r.getLinkedIntersections();
        if (!isEmpty(intersections.start)) {
            this._body.append($('<button class="interface_button">' + intersections.start.intersection.getId() + '</button>').data('command', 'editIntersection'));
        }
        if (!isEmpty(intersections.end)) {
            this._body.append($('<button class="interface_button">' + intersections.end.intersection.getId() + '</button>').data('command', 'editIntersection'));
        }
    }

    editIntersection() {
        this._body.empty();
        this._body.append('<button class="small_button">Back to Menu</button>');
        this._body.append('<h2>Intersections</h2><div class="spacer"></div>');
        let intersections = this._map.getIntersections();
        for (let intersection in intersections) {
            this._body.append($('<button class="interface_button">' + intersection + '</button>').data('command', 'editIntersection'));
        }
    }

    runCommand(command, data) {
        console.log(command, data);
        switch (command) {
            case 'Save':
            case 'Load':
            case 'Export as Save':
            case 'Export for Simulation':
            case 'Import Save':
                throw new Error('Not Implemented');
            case 'Edit Roads':
                this.editRoads();
                break;
            case 'Edit Intersections':
                this.editIntersection();
                break;
            case 'Back to Menu':
                this.overview();
                break;
            case 'Back to Roads':
                this.editRoads();
                break;
            default:
                switch (data.command) {
            case 'editRoad':
                this.editRoad(command);
                break;
        }
        }
    }
}