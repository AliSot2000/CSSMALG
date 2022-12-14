<?php

/**
 * class to read raw data from OSM and parse it
 */
class Parser
{
    private array $coordinates;
    private string $prefix;
    private array $rawNodes = array();
    private array $rawStreets = array();
    private array $parsedNodes = array();
    private array $parsedStreets = array();
    private int $streetCount = 0;

    /**
     * constructor where coordinates (in OSM defined order) for bounding box can be passed
     * @param float $lon1
     * @param float $lon2
     * @param float $lat1
     * @param float $lat2
     * @param string $prefix
     */
    public function __construct(float $lon1, float $lon2, float $lat1, float $lat2, string $prefix)
    {
        $this->coordinates = array("lon1" => $lon1, "lon2" => $lon2, "lat1" => $lat1, "lat2" => $lat2);
        $this->prefix = $prefix;
    }


    /**
     * main method of class bundling all important other methods
     * @return void
     */
    public function execute(): void
    {
        $this->readData();
        $this->parseNodes();
        $this->parseStreets();
        $this->writeJSON();
    }

    /**
     * read the raw input OSM data from overpass API
     * @return void
     */
    private function readData(): void
    {
        // overpass query
        $query = "http://overpass-api.de/api/interpreter?data=[out:json][bbox:" . $this->coordinates["lat1"] . "," . $this->coordinates["lon1"] . "," . $this->coordinates["lat2"] . "," . $this->coordinates["lon2"] . "];(way[highway=primary];way[highway=secondary];way[highway=trunk];way[highway=tertiary];way[highway=service];way[highway=residential];)->.a;(.a;>;);out;";
        // collecting results in JSON format
        $html = file_get_contents($query);
        $rawData = json_decode($html, true);
        //sorting the nodes and streets into two separate arrays
        foreach ($rawData["elements"] as $element) {
            if ($element["type"] == "node") {
                $this->rawNodes[] = $element;
            } else if ($element["type"] == "way") {
                $this->rawStreets[] = $element;
            }
        }
    }

    /**
     * parse raw node data
     * @return void
     */
    private function parseNodes(): void
    {
        $nodeCounter = array();
        // counting how often each node is used, counting nodes at end of street twice to not accidentally delete these
        foreach ($this->rawStreets as $streetData) {
            foreach ($streetData["nodes"] as $id => $nodeId) {
                if ($id != 0 && $id != count($streetData["nodes"]) - 1) {
                    if (isset($nodeCounter[strval($nodeId)])) {
                        $nodeCounter[strval($nodeId)]++;
                    } else {
                        $nodeCounter[strval($nodeId)] = 1;
                    }
                } else {
                    if (isset($nodeCounter[strval($nodeId)])) {
                        $nodeCounter[strval($nodeId)] += 2;
                    } else {
                        $nodeCounter[strval($nodeId)] = 2;
                    }
                }
            }
        }
        // filter out unconnected streets
        foreach ($this->rawStreets as $roadId => $streetData) {
            $sum = 0;

            foreach ($streetData["nodes"] as $nodeId) {
                $sum += $nodeCounter[strval($nodeId)];
            }

            if ($sum == count($streetData["nodes"]) + 2) {
                unset($this->rawStreets[$roadId]);

                foreach ($streetData["nodes"] as $nodeId) {
                    $nodeCounter[strval($nodeId)] = 0;
                }
            }
        }


        // if node is only used once or not at all, delete it since it is unnecessary in the middle of a road
        foreach ($this->rawNodes as $nodeData) {
            if (isset($nodeCounter[strval($nodeData["id"])]) && $nodeCounter[strval($nodeData["id"])] > 1) {
                $this->parsedNodes[strval($nodeData["id"])]["id"] = strval($nodeData["id"]);
                $this->parsedNodes[strval($nodeData["id"])]["coordinates"] = array("lon" => $nodeData["lon"], "lat" => $nodeData["lat"]);
                $this->parsedNodes[strval($nodeData["id"])]["roads"] = array();
                // roundabouts and traffic signal always set to same value as simplification
                $this->parsedNodes[strval($nodeData["id"])]["trafficSignal"] = true;
                $this->parsedNodes[strval($nodeData["id"])]["roundabout"] = false;
            }
        }
        unset($this->rawNodes);
    }

    /**
     * parse raw road data
     * @return void
     */
    private function parseStreets(): void
    {
        $splittedRoads = array();

        foreach ($this->rawStreets as $arrayId => $streetData) {
            $osmId = $streetData["id"];
            $nodes = $streetData["nodes"];
            $segments = array();
            $segments[] = array("start" => strval($nodes[0]));
            $current = 0;

            // split roads at intersections
            for ($i = 1; $i < count($nodes); $i++) {
                if (isset($this->parsedNodes[strval($nodes[$i])])) {
                    $segments[$current]["end"] = strval($nodes[$i]);
                    if ($i != count($nodes) - 1) {
                        $segments[++$current]["start"] = strval($nodes[$i]);
                    }
                }
            }
            // go through segments and check the properties
            foreach ($segments as $segment) {
                // filter out reflexive streets
                if (strval($segment["start"]) != strval($segment["end"])) {
                    if (isset($streetData["tags"]["oneway"]) && $streetData["tags"]["oneway"] === "yes") {
                        $splittedRoads[strval($this->streetCount)] = array("id" => strval($this->streetCount), "osmId" => $osmId, "arrayId" => $arrayId, "startNodeId" => strval($segment["start"]), "endNodeId" => strval($segment["end"]), "oppositeStreetId" => "-1");
                        $this->parsedNodes[strval($segment["start"])]["roads"][] = array("id" => strval($this->streetCount), "traffic_controller" => "outgoing");
                        $this->parsedNodes[strval($segment["end"])]["roads"][] = array("id" => strval($this->streetCount), "traffic_controller" => "traffic_light");
                        $this->streetCount++;
                    } else {
                        $splittedRoads[strval($this->streetCount)] = array("id" => strval($this->streetCount), "osmId" => strval($osmId), "arrayId" => strval($arrayId), "startNodeId" => strval($segment["start"]), "endNodeId" => strval($segment["end"]), "oppositeStreetId" => strval($this->streetCount + 1));
                        $splittedRoads[strval($this->streetCount + 1)] = array("id" => strval($this->streetCount + 1), "osmId" => strval($osmId), "arrayId" => strval($arrayId), "startNodeId" => strval($segment["end"]), "endNodeId" => strval($segment["start"]), "oppositeStreetId" => strval($this->streetCount));
                        $this->parsedNodes[strval($segment["start"])]["roads"][] = array("id" => strval($this->streetCount), "traffic_controller" => "outgoing");
                        $this->parsedNodes[strval($segment["end"])]["roads"][] = array("id" => strval($this->streetCount), "traffic_controller" => "traffic_light");
                        $this->parsedNodes[strval($segment["end"])]["roads"][] = array("id" => strval($this->streetCount + 1), "traffic_controller" => "outgoing");
                        $this->parsedNodes[strval($segment["start"])]["roads"][] = array("id" => strval($this->streetCount + 1), "traffic_controller" => "traffic_light");
                        $this->streetCount += 2;
                    }
                }
            }
        }

        $endPointTracker = array();

        // check how many lanes need to be made
        foreach ($splittedRoads as $id => $data) {
            $coordinate1 = $this->parsedNodes[strval($data["startNodeId"])]["coordinates"];
            $coordinate2 = $this->parsedNodes[strval($data["endNodeId"])]["coordinates"];
            $length = round($this->distance($coordinate1["lon"], $coordinate1["lat"], $coordinate2["lon"], $coordinate2["lat"]));
            $rawData = $this->rawStreets[strval($data["arrayId"])];
            // standard speed of 50 km/h if no value in OSM
            $maxSpeed = intval($rawData["tags"]["maxspeed"] ?? 50);

            if ($data["oppositeStreetId"] == "-1") {
                $lanes = $rawData["tags"]["lanes"] ?? 1;
            } else {
                if (isset($rawData["tags"]["lanes"])) {
                    if (isset($rawData["tags"]["lanes:forward"])) {
                        // if original direction or other direction
                        $lanes = ($data["oppositeStreetId"] > $id) ? $rawData["tags"]["lanes:forward"] : $rawData["tags"]["lanes"] - $rawData["tags"]["lanes:forward"];
                    } else {
                        $lanes = $rawData["tags"]["lanes"];
                    }
                } else {
                    $lanes = 1;
                }
            }

            $type = "both";
            if (isset($rawData["tags"]["bicycle"]) && $rawData["tags"]["bicycle"] == "no") {
                $type = "car";
            }

            $laneArray = array();

            // with these road types we assume they wide enough roads to always overtake so we add a seperate road for bicycles
            if (($rawData["tags"]["highway"] == "primary" || $rawData["tags"]["highway"] == "trunk" || $rawData["tags"]["highway"] == "secondary") && !(isset($rawData["tags"]["bicycle"]) && $rawData["tags"]["bicycle"] == "no")) {
                $this->parsedStreets[strval($this->streetCount + 1)] = array("id" => strval($this->streetCount + 1), "intersections" => array("start" => array("id" => strval($data["startNodeId"])), "end" => array("id" => strval($data["endNodeId"]))), "lanes" => array(array("type" => "bike", "left" => true, "forward" => true, "right" => true)), "speed_limit" => $maxSpeed, "distance" => $length);
                $this->parsedNodes[strval($data["startNodeId"])]["roads"][] = array("id" => strval($this->streetCount + 1), "traffic_controller" => "outgoing");
                $this->parsedNodes[strval($data["endNodeId"])]["roads"][] = array("id" => strval($this->streetCount + 1), "traffic_controller" => "traffic_light");

                // count how many streets between each node pair to stop multigraph from happening
                if (!isset($endPointTracker["bike"][strval($data["startNodeId"]) . " " . strval($data["endNodeId"])])) {
                    $endPointTracker["bike"][strval($data["startNodeId"]) . " " . strval($data["endNodeId"])] = 1;
                } else {
                    $endPointTracker["bike"][strval($data["startNodeId"]) . " " . strval($data["endNodeId"])]++;
                }

                $this->streetCount++;
                $type = "car";
            }

            // actually add the lanes
            for ($i = 0; $i < $lanes; $i++) {
                $laneArray[] = array("type" => $type, "left" => true, "forward" => true, "right" => true);
            }

            // if it is not a oneway node, add the ID of the opposite street
            if ($data["oppositeStreetId"] == "-1") {
                $this->parsedStreets[strval($id)] = array("id" => strval($data["id"]), "intersections" => array("start" => array("id" => strval($data["startNodeId"])), "end" => array("id" => strval($data["endNodeId"]))), "lanes" => array_values($laneArray), "speed_limit" => $maxSpeed, "distance" => $length);
            } else {
                $this->parsedStreets[strval($id)] = array("id" => strval($data["id"]), "intersections" => array("start" => array("id" => strval($data["startNodeId"])), "end" => array("id" => strval($data["endNodeId"]))), "lanes" => array_values($laneArray), "speed_limit" => $maxSpeed, "distance" => $length, "oppositeStreetId" => $data["oppositeStreetId"]);
            }

            // count how many streets between node pairs to stop multiple roads of same type between to intersections
            if (!isset($endPointTracker["both"][strval($data["startNodeId"]) . " " . strval($data["endNodeId"])])) {
                $endPointTracker["both"][strval($data["startNodeId"]) . " " . strval($data["endNodeId"])] = 1;
            } else {
                $endPointTracker["both"][strval($data["startNodeId"]) . " " . strval($data["endNodeId"])]++;
            }

            $data = NULL;
        }

        unset($data);
        // filter out multiple roads of same type between two nodes, if both streets are either of type both or car, filter out both firt => two iterations
        foreach ($this->parsedStreets as $id => $data) {
            if ($data["lanes"][0]["type"] == "both") {
                $type = "both";
            } else {
                continue;
            }

            if ($endPointTracker[$type][$data["intersections"]["start"]["id"] . " " . $data["intersections"]["end"]["id"]] > 1) {
                $endPointTracker[$type][$data["intersections"]["start"]["id"] . " " . $data["intersections"]["end"]["id"]]--;
                foreach ($this->parsedNodes[$data["intersections"]["start"]["id"]]["roads"] as $listId => $listData) {
                    if ($listData["id"] == $id) {
                        unset($this->parsedNodes[$data["intersections"]["start"]["id"]]["roads"][$listId]);
                        break;
                    }
                }
                foreach ($this->parsedNodes[$data["intersections"]["end"]["id"]]["roads"] as $listId => $listData) {
                    if ($listData["id"] == $id) {
                        unset($this->parsedNodes[$data["intersections"]["end"]["id"]]["roads"][$listId]);
                        break;
                    }
                }
                if (isset($data["oppositeStreetId"])) {
                    unset($this->parsedStreets[$data["oppositeStreetId"]]["oppositeStreetId"]);
                }
                unset($this->parsedStreets[$id]);
            }
        }

        foreach ($this->parsedStreets as $id => $data) {
            if ($data["lanes"][0]["type"] == "bike") {
                $type = "bike";
            } else {
                $type = "both";
            }

            if ($endPointTracker[$type][$data["intersections"]["start"]["id"] . " " . $data["intersections"]["end"]["id"]] > 1) {
                $endPointTracker[$type][$data["intersections"]["start"]["id"] . " " . $data["intersections"]["end"]["id"]]--;
                foreach ($this->parsedNodes[$data["intersections"]["start"]["id"]]["roads"] as $listId => $listData) {
                    if ($listData["id"] == $id) {
                        unset($this->parsedNodes[$data["intersections"]["start"]["id"]]["roads"][$listId]);
                        break;
                    }
                }
                foreach ($this->parsedNodes[$data["intersections"]["end"]["id"]]["roads"] as $listId => $listData) {
                    if ($listData["id"] == $id) {
                        unset($this->parsedNodes[$data["intersections"]["end"]["id"]]["roads"][$listId]);
                        break;
                    }
                }
                if (isset($data["oppositeStreetId"])) {
                    unset($this->parsedStreets[$data["oppositeStreetId"]]["oppositeStreetId"]);
                }
                unset($this->parsedStreets[$id]);
            }
        }
        unset($endPointTracker);
        unset($this->rawStreets);
    }

    /**
     * write the result JSON
     * @return void
     */
    private function writeJSON(): void
    {
        $handle = fopen("../data/" . $this->prefix . "MapExport.tsim", 'w+');
        $toWrite = array("peripherals" => array("type" => "to-be-simulated", "date" => date("Y-m-d_H-i-s")), "intersections" => array_values($this->parsedNodes), "roads" => array_values($this->parsedStreets));

        unset($this->parsedNodes);
        unset($this->parsedStreets);

        fwrite($handle, json_encode($toWrite));
        fclose($handle);

        unset($toWrite);
    }

    /**
     * calculate the distance in meters between two pairs of earth coordinates
     * @param float $lon1
     * @param float $lat1
     * @param float $lon2
     * @param float $lat2
     * @return float
     */
    private function distance(float $lon1, float $lat1, float $lon2, float $lat2): float
    {
        $radius = 6371e3;

        $phi1 = $lat1 * pi() / 180;
        $phi2 = $lat2 * pi() / 180;

        $deltaPhi = ($lat2 - $lat1) * pi() / 180;
        $deltaLambda = ($lon2 - $lon1) * pi() / 180;

        $a = pow(sin($deltaPhi / 2), 2) + cos($phi1) * cos($phi2) * pow(sin($deltaLambda / 2), 2);
        $b = 2 * atan2(sqrt($a), sqrt(1 - $a));

        return $radius * $b;
    }
}
