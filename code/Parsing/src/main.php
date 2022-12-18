<?php
include_once("Parser.php");
include_once("AgentGenerator.php");
// tiny coords (north zurich): 8.52, 8.57, 47.40, 47.42
// small coords: 8.50, 8.55, 47.36, 47.41
// full coords: 8.50, 8.56, 47.36, 47.42

// create and run Parser
$parser = new Parser(8.50, 8.56, 47.36, 47.42, "full");
$parser->execute();

// create and run AgentGenerator
$agentGen = new AgentGenerator(8.50, 8.56, 47.36, 47.42, "full");
$agentGen->execute();
?>
