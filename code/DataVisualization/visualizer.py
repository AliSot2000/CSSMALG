import os
from linePlot import LinePlot
from boxPlot import BoxPlot
from mongo_api import MongoAPI  # Import API for MongoDB
from database import db_username, db_password, db_ip  # Import username and password from database.py


class Visualizer:
    """
    This class is used to visualize the data from the database.
    """

    def __init__(self, output_path):
        """
        Initialize the visualizer.
        :param output_path: path to the output folder
        """
        self.mongo = MongoAPI(db_ip, db_username, db_password)  # Connect to the database
        self.output_path = output_path  # Set the output path

    def change_path(self, output_path):
        """
        Change the output path.
        :param output_path: path to the output folder
        :return: None
        """
        self.output_path = output_path

    def visualize_over_different_runs(self, simulation: str, road_type: str = 'intersection', agent_type: str = 'car', attribute: str = 'flow'):
        """
        Visualize the data over different runs.
        :param simulation: Simulation name
        :param road_type: road type (intersection, road)
        :param agent_type: agent type (car, bike, agent)
        :param attribute: attribute (flow, density - only for roads)
        :return:
        """
        print(f'Visualizing {simulation} {road_type} {agent_type} {attribute}')
        all_collections = self.mongo.get_collections(simulation)  # Get all collections

        collections = []
        for collection in all_collections:  # Filter out the collections that are not needed
            if '_timesteps' in collection:  # Only get the timesteps
                collections.append(collection)  # Add the collection to the list

        data = []  # Initialize the data list

        tracked_attribute = f'{road_type}_{agent_type}_{attribute}'  # Set the tracked attribute

        is_agent = agent_type == 'agent'  # Check if the agent type is agent

        if is_agent:  # If the agent type is agent
            for collection in collections:
                data.append(self.mongo.find(simulation,
                                            collection,
                                            {f'{road_type}_car_{attribute}': {'$gte': 0}, f'{road_type}_bike_{attribute}': {'$gte': 0}, 'time': {'$lte': 1000}},
                                            {f'{road_type}_car_{attribute}': 1, f'{road_type}_bike_{attribute}': 1},
                                            [('time', 1)]))
        else:  # If the agent type is not agent
            for collection in collections:
                data.append(self.mongo.find(simulation,
                                            collection,
                                            {tracked_attribute: {'$gte': 0}, 'time': {'$lte': 1000}},
                                            {tracked_attribute: 1},
                                            [('time', 1)]))

        data_length = len(data)  # Get the length of the data
        if data_length < 1:  # If the data length is less than 1
            raise Exception('No valid data found')  # Raise an exception

        time_steps = len(data[0])  # Get the number of time steps

        tracked_data = {  # Initialize the tracked data
            'mean': [],
            '95percentile': [],
            '5percentile': [],
            'mean+variance': [],
            'mean-variance': []
        }

        for time_step in range(time_steps):  # Loop over all time steps
            data_points = []
            for data_point in range(data_length):  # Loop over all data points
                if is_agent:
                    data_points.extend(data[data_point][time_step][f'{road_type}_car_{attribute}'])
                    data_points.extend(data[data_point][time_step][f'{road_type}_bike_{attribute}'])
                else:
                    data_points.extend(data[data_point][time_step][tracked_attribute])
            # Calculate all the data we might want to display
            m = mean(data_points)
            tracked_data['mean'].append(m)
            tracked_data['95percentile'].append(percentile(data_points, 95))
            tracked_data['5percentile'].append(percentile(data_points, 5))
            v = variance(data_points, m)
            tracked_data['mean+variance'].append(m + v)
            tracked_data['mean-variance'].append(m - v)

        minutes = []  # Initialize the minutes list

        current_minute = 15  # Set the current minute to 15
        for i in range(time_steps):  # Loop over all time steps
            minutes.append(current_minute)  # Add the current minute to the minutes list
            current_minute += 15  # Add 15 to the current minute

        plot_and_save_data(minutes,
                           tracked_data,
                           f'{int("".join(x for x in simulation if x.isdigit()))}% Bikes - {tracked_attribute.title().replace("_", " ")}',
                           'Minutes',
                           attribute.title(),
                           os.path.join(self.output_path, f'{tracked_attribute}.png'))

    def visualize_seperated_agents(self, simulation: str, road_type: str = 'intersection', attribute: str = 'flow'):
        """
        Visualize the data seperated by agents.
        :param simulation: Simulation name
        :param road_type: road type (intersection, road)
        :param attribute: attribute (flow, density - only for roads)
        :return:
        """
        print(f'Visualizing {simulation} {road_type} {attribute}')

        all_collections = self.mongo.get_collections(simulation)  # Get all collections

        collections = []
        for collection in all_collections:  # Filter out the collections that are not needed
            if '_timesteps' in collection:  # Only get the timesteps
                collections.append(collection)  # Add the collection to the list

        data = []  # Initialize the data list

        for collection in collections:
            data.append(self.mongo.find(simulation,
                                        collection,
                                        {f'{road_type}_car_{attribute}': {'$gte': 0},
                                         f'{road_type}_bike_{attribute}': {'$gte': 0}},
                                        {f'{road_type}_car_{attribute}': 1, f'{road_type}_bike_{attribute}': 1},
                                        [('time', 1)]))

        data_length = len(data)  # Get the length of the data
        if data_length < 1:  # If the data length is less than 1
            raise Exception('No valid data found')  # Raise an exception

        time_steps = len(data[0])  # Get the number of time steps

        tracked_data = {  # Initialize the tracked data
            'cars': [],
            'bikes': [],
            'total': []
        }

        for time_step in range(time_steps):  # Loop over all time steps
            cars = []
            bikes = []
            for data_point in range(data_length):  # Loop over all data points
                cars.extend(data[data_point][time_step][f'{road_type}_car_{attribute}'])
                bikes.extend(data[data_point][time_step][f'{road_type}_bike_{attribute}'])

            car_mean = mean(cars)
            bike_mean = mean(bikes)

            tracked_data['cars'].append(car_mean)
            tracked_data['bikes'].append(bike_mean)
            tracked_data['total'].append(car_mean + bike_mean)

        minutes = []  # Initialize the minutes list

        current_minute = 10  # Set the current minute to 15
        for i in range(time_steps):  # Loop over all time steps
            minutes.append(current_minute)  # Add the current minute to the minutes list
            current_minute += 10  # Add 15 to the current minute

        p = LinePlot()
        p.plot(minutes, tracked_data['cars'], 'c', '#003dd6', 'dashed')
        p.plot(minutes, tracked_data['bikes'], 'b', '#e60022', 'dashed')
        p.plot(minutes, tracked_data['total'], 't', '#5b5b5b')
        p.set_x_label('Minutes')
        p.set_y_label(attribute.title())
        p.set_title(f'{get_number(simulation)}% Bikes - {attribute.title()} Comparison')
        p.annotate_lines()
        p.save(os.path.join(self.output_path, f'{road_type}_{attribute}_comparison.png'))
        p.close()

    def visualize_avg_speed_multiple_sims(self, simulations, agent_type: str):
        """
        Visualize the average speed over multiple simulations.
        :param simulations: List of simulations
        :param agent_type: Agent type (car, bike, agent)
        :return:
        """
        print(f'Visualizing {agent_type} AVG Speed over all Simulations')
        data = []

        simulations.sort(key=get_number)  # Sort the simulations

        is_agent = agent_type == 'agent'  # Check if the agent type is agent
        pretty_names = []  # Initialize the pretty names list

        for simulation in simulations:  # Loop over all simulations
            pretty_names.append(f'{get_number(simulation)}%')  # Add the pretty name to the list
            all_runs = self.mongo.get_collections(simulation)  # Get all the collections
            data_point = []  # Initialize the data point list
            runs = []  # Initialize the runs list
            for run in all_runs:  # Loop over all runs
                if '_agents' in run:  # If the run is an agent run
                    runs.append(run)  # Add the run to the runs list

            for run in runs:  # Loop over all runs
                if is_agent:  # If the agent type is agent
                    results = self.mongo.find(simulation,
                                              run,
                                              {'end_time': {'$gt': 0}},
                                              {'end_time': 1, 'start_time': 1, 'travel_distance': 1})
                else:  # If the agent type is not agent
                    results = self.mongo.find(simulation,
                                              run,
                                              {'end_time': {'$gt': 0}, 'type': agent_type},
                                              {'end_time': 1, 'start_time': 1, 'travel_distance': 1})

                for agent in results:  # Loop over all agents
                    data_point.append(agent['travel_distance'] / (agent['end_time'] - agent['start_time']))

            data.append(data_point)  # Add the data point to the data list

        box_plot = BoxPlot(data, False)  # Create a box plot
        box_plot.set_title(f'Average Speed of {agent_type.title()}s')
        box_plot.set_x_label('Simulations')
        box_plot.set_y_label('Speed (m/s)')
        box_plot.set_x_ticks(pretty_names)
        box_plot.save(os.path.join(self.output_path, f'avg_speed_{agent_type}.png'))
        box_plot.close()

    def visualize_over_different_sims(self, simulations, road_type: str = 'intersection', agent_type: str = 'car', attribute: str = 'flow'):
        print(f'Visualizing {road_type} {agent_type} {attribute} over all Simulations')

        data = []

        simulations.sort(key=get_number)  # Sort the simulations

        is_agent = agent_type == 'agent'  # Check if the agent type is agent

        tracked_attribute = f'{road_type}_{agent_type}_{attribute}'  # Set the tracked attribute

        pretty_names = []  # Initialize the pretty names list

        for simulation in simulations:  # Loop over all simulations
            pretty_names.append(f'{get_number(simulation)}%')  # Add the pretty name to the list
            all_runs = self.mongo.get_collections(simulation)  # Get all the collections
            data_point = []  # Initialize the data point list
            runs = []  # Initialize the runs list
            for run in all_runs:  # Loop over all runs
                if '_timesteps' in run:  # If the run is an agent run
                    runs.append(run)  # Add the run to the runs list

            for run in runs:  # Loop over all runs
                if is_agent:  # If the agent type is agent
                    results = self.mongo.find(simulation,
                                              run,
                                              {f'{road_type}_car_{attribute}': {'$gte': 0}, f'{road_type}_bike_{attribute}': {'$gte': 0}, 'time': {'$lte': 1000}},
                                              {f'{road_type}_car_{attribute}': 1, f'{road_type}_bike_{attribute}': 1},
                                              [('time', 1)])
                else:  # If the agent type is not agent
                    results = self.mongo.find(simulation,
                                              run,
                                              {tracked_attribute: {'$gte': 0}, 'time': {'$lte': 1000}},
                                              {tracked_attribute: 1},
                                              [('time', 1)])

                for timestep in results:
                    if is_agent:
                        data_point.extend(timestep[f'{road_type}_car_{attribute}'])
                        data_point.extend(timestep[f'{road_type}_bike_{attribute}'])
                    else:
                        data_point.extend(timestep[tracked_attribute])

            data.append(data_point)  # Add the data point to the data list

        box_plot = BoxPlot(data, False)  # Create a box plot
        box_plot.set_title(f'{road_type.title()} {attribute.title()} of {agent_type.title()}s')
        box_plot.set_x_label('Simulations')
        box_plot.set_y_label(f'{attribute.title()}')
        box_plot.set_x_ticks(pretty_names)
        box_plot.save(os.path.join(self.output_path, f'{attribute}_{agent_type}.png'))
        box_plot.close()


def plot_and_save_data(x: list, y: dict, name: str, x_label: str = 'Time', y_label: str = 'Flow', output_name: str = ''):
    """
    Plot and save the data.
    :param x: X data
    :param y: Y data
    :param name: Name of the plot
    :param x_label: X Axis label
    :param y_label: Y Axis label
    :param output_name: output file path/name
    :return:
    """
    p = LinePlot()
    p.plot(x, y['mean'], 'Arithmetic Mean')
    p.plot(x, y['95percentile'], '95% Percentile', '#5b5b5b', 'dashed')
    p.plot(x, y['5percentile'], '5% Percentile', '#5b5b5b', 'dashed')
    p.plot(x, y['mean+variance'], 'Mean + Variance', '#999999', 'dotted')
    p.plot(x, y['mean-variance'], 'Mean - Variance', '#999999', 'dotted')
    p.set_x_label(x_label)
    p.set_y_label(y_label)
    p.set_title(name)
    p.annotate_lines()
    p.save(output_name)
    p.close()


def mean(data: list = None):
    """
    Calculate the mean of a list of numbers.
    :param data: All the data points
    :return: Mean
    """
    return sum(data) / len(data)


def variance(data, m: float = None):
    """
    Calculate the variance of a list of numbers.
    :param data: All the data points
    :param m: Mean
    :return: Variance
    """
    if mean is None:  # If the mean is not given
        m = mean(data)  # Calculate the mean
    return sum((x - m) ** 2 for x in data) / len(data)


def percentile(data: list = None, percent: int = 50):
    """
    Calculate the percentile of a list of numbers.
    :param data: All the data points
    :param percent: Percentile between 0 and 100
    :return: Percentile
    """
    data.sort()
    index = int(len(data) * percent / 100)
    return data[index]


def get_number(text: str):
    """
    Get the number from a string.
    :param text: Text
    :return: Number
    """
    return int("".join(x for x in text if x.isdigit()))
