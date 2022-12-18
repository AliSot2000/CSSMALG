## Formulas

### General

Here we state the formulas of the values we want to observe. For each of the formulas we would like the following graphs:

 - Average of the value over the course of a day ( $x$-axis time (midnight to midnight), $y$-axis average of value) $\Rightarrow$ $f(x)=$ average value at timestep $x$.
   - One plot for each percentage of bikes and for each value
 - Average of the value over the whole day on the $y$-axis and percentage of bikes on the $x$-axis $\Rightarrow$ $f(x) =$ average of value over the whole day for $x$ percent bikes 
   - One plot per value is enough since the different percentages of bikes are shown in the plot

The values should be calculated for 
 - once only for cars
 - once only for bikes
 - once over all agents

### Average Speed
$$v_{avg} = \frac{\sum_{i \in \text{ agents}} d_i}{\sum_{i \in \text{ agents}} t_i}$$

$$d_i = \text{ distance travelled by agent } i \text{ in } km$$

$$t_i = \text{ time needed by agent } i \text{ in hours} $$

For the first plot we only want it for the distance travelled by agents in the certain intervall of the time resolution and for the second plot over the whole day.

### Vehicle Flow
$$ flow = \frac{veh}{h \cdot lane}$$

$$ veh = \text{ number of vehicles}$$

$$ h = \text{ hours of observation}$$

$$ lane = \text{ number of lanes}$$

For the first plot we only want it for the duration of the time resolution and for the second plot over the whole day.

### Vehicle Density
$$ density = \frac{veh}{km \cdot lane}$$

$$ veh = \text{ number of vehicles}$$

$$ km = \text{ distance in } km$$

$$ lane = \text{ number of lanes}$$

For the first plot we only want it for the duration of the time resolution and for the second plot over the whole day.

