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

        this._body = $('<div></div>').addClass('interface_body').on('click', '.interface_button, .small_button, .delete', {interface: this}, function(event) {
            event.data.interface.runCommand($(this).html(), $(this).data(), $(this));
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
            l += '<div class="input">Bike Only <input type="checkbox" name="bike"' + (lane.type === 'bike' ? ' checked' : '') + '></div>';
            l += '<div class="input">Facing <input type="checkbox" name="facing"' + (lane.direction > 0 ? ' checked' : '') + '></div>';
            l += '<button class="delete">Delete</button>';
            l += '<div class="input">Left <input type="checkbox" name="left"' + (1 > 0 ? ' checked' : '') + '></div>';
            l += '<div class="input">Forward <input type="checkbox" name="forward"' + (1 > 0 ? ' checked' : '') + '></div>';
            l += '<div class="input">Right <input type="checkbox" name="right"' + (1 > 0 ? ' checked' : '') + '></div>';
            l += '</div>';
            lane_list.append(l);
        }
        this._body.append(lane_list);
        this._body.append('<h2>Edit Road</h2><div class="spacer"></div>');
        this._body.append($('<button class="interface_button">Save Road</button>').data('road', road));
        this._body.append($('<button class="interface_button">Delete Road</button>').data('road', road));
        this._body.append('<h2>Connected Intersections</h2>');
        let intersections = r.getLinkedIntersections();
        if (!isEmpty(intersections.start)) {
            this._body.append($('<button class="interface_button">' + intersections.start.intersection.getId() + '</button>').data('command', 'editIntersection'));
        }
        if (!isEmpty(intersections.end)) {
            this._body.append($('<button class="interface_button">' + intersections.end.intersection.getId() + '</button>').data('command', 'editIntersection'));
        }
    }

    editIntersections() {
        this._body.empty();
        this._body.append('<button class="small_button">Back to Menu</button>');
        this._body.append('<h2>Intersections</h2><div class="spacer"></div>');
        let intersections = this._map.getIntersections();
        for (let intersection in intersections) {
            this._body.append($('<button class="interface_button">' + intersection + '</button>').data('command', 'editIntersection'));
        }
    }

    editIntersection(intersection) {
        this._body.empty();
        this._body.append('<button class="small_button">Back to Intersections</button>');
        this._body.append('<h2>Intersection: </h2><span>' + intersection + '</span>');
        this._body.append('<button class="small_button">Edit Name</button><div class="spacer"></div>');
        this._body.append('<h2>Edit Intersection</h2><div class="spacer"></div>');
        // this._body.append('<button class="interface_button">Save Road</button>');
        this._body.append($('<button class="interface_button">Delete Intersection</button>').data('intersection', intersection));
        this._body.append('<h2>Connected Roads</h2><div class="spacer"></div>');
        let roads = this._map.getIntersection(intersection).getLinkedRoads();
        console.log(roads);
        for (let i = 0; i < roads.length; i++) {
            this._body.append($('<button class="interface_button">' + roads[i].getId() + '</button>').data('command', 'editRoad'));
        }
    }

    runCommand(command, data, target) {
        console.log(command, data);
        switch (command) {
            case 'Save':
            case 'Load':
            case 'Export for Simulation':
            case 'Import Save':
                alert('Not Implemented');
                break;
            case 'Edit Roads':
                this.editRoads();
                break;
            case 'Edit Intersections':
                this.editIntersections();
                break;
            case 'Back to Menu':
                this.overview();
                break;
            case 'Back to Roads':
                this.editRoads();
                break;
            case 'Back to Intersections':
                this.editIntersections();
                break;
            case 'Add Road':
                let rx = snap((window.innerWidth / 2) + $(document).scrollLeft());
                let ry = snap((window.innerHeight / 2) + $(document).scrollTop());
                let r = this._map.createRoad(rx - 50, ry, degToRad(270), rx + 50, ry, degToRad(90));
                r.setLanes([{
                    type: 'car',
                    direction: 1,
                    left: true,
                    forward: true,
                    right: true
                }]);
                this.editRoad(r.getId());
                break;
            case 'Add Intersection':
                let ix = snap((window.innerWidth / 2) + $(document).scrollLeft());
                let iy = snap((window.innerHeight / 2) + $(document).scrollTop());
                let i = this._map.createIntersection(ix, iy);
                this.editIntersection(i.getId());
                break;
            case 'Add Lane':
                let count = this._body.find('.lane').length;
                let html = '<div class="lane"><div class="name">Lane <span>' + count + '</span></div>';
                html += '<div class="input">Bike Only <input type="checkbox" name="bike"></div>';
                html += '<div class="input">Facing <input type="checkbox" name="facing" checked></div>';
                html += '<button class="delete">Delete</button>';
                html += '<div class="input">Left <input type="checkbox" name="left" checked></div>';
                html += '<div class="input">Forward <input type="checkbox" name="forward" checked></div>';
                html += '<div class="input">Right <input type="checkbox" name="right" checked></div>';
                html += '</div>';
                this._body.find('.lanes').append(html);
                break;
            case 'Delete':
                target.closest('.lane').remove();
                break;
            case 'Delete Road':
                this._map.removeRoad(data.road);
                this.editRoads();
                break;
            case 'Delete Intersection':
                this._map.removeIntersection(data.intersection);
                this.editIntersections();
                break;
            case 'Export as Save':
                let dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(this._map.exportSaveData()));
                let downloadAnchorNode = document.createElement('a');
                let exportName = currentTime();
                downloadAnchorNode.setAttribute("href",     dataStr);
                downloadAnchorNode.setAttribute("download", exportName + ".json");
                document.body.appendChild(downloadAnchorNode); // required for firefox
                downloadAnchorNode.click();
                downloadAnchorNode.remove();
            case 'Save Road':
                let lanes = [];
                let lane;
                let lane_html = this._body.find('.lane');
                for (let i = 0; i < lane_html.length; i++) {
                    lane = $(lane_html[i]);
                    lanes.push({
                        type: lane.find('input[name="bike"]').is(':checked') ? 'bike' : 'car',
                        direction: lane.find('input[name="facing"]').is(':checked') ? 1 : -1,
                        left: lane.find('input[name="left"]').is(':checked'),
                        forward: lane.find('input[name="forward"]').is(':checked'),
                        right: lane.find('input[name="right"]').is(':checked')
                    });
                }
                let road = this._map.getRoad(data.road);
                road.setLanes(lanes);
                break;
            default:
                if (isEmpty(data.command)) {
                    throw new Error('Invalid Command');
                }
                switch (data.command) {
            case 'editRoad':
                this.editRoad(command);
                break;
            case 'editIntersection':
                this.editIntersection(command);
                break;
        }
        }
    }
}