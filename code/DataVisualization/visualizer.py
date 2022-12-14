import json
import os

from linePlot import LinePlot


class Visualizer:
    path_to_data = ''
    output_dir = ''

    def __init__(self, path_to_data: str, output_dir: str):
        self.path_to_data = os.path.normcase(path_to_data)
        self.output_dir = os.path.normcase(output_dir)

    def get_simulations(self, name: str):
        simulations = []
        sim_dir = os.path.join(self.path_to_data, name)
        for simulation in sim_dir:
            if os.path.isdir(os.path.join(sim_dir, simulation)):
                simulations.append(simulation)

        return simulations

    def combine_simulations(self, name: str):
        log_time_interval = 15
        simulations = self.get_simulations(name)
        sim_count = len(simulations)

        intersection_bike_flow = []
        intersection_car_flow = []

        road_bike_flow = []
        road_car_flow = []
        road_bike_density = []
        road_car_density = []

        if sim_count < 1:
            raise Exception('No simulations found')

        sim_dir = os.path.join(self.path_to_data, name, simulations[0])

        for file in os.listdir(sim_dir):
            if os.path.isfile(os.path.join(sim_dir, file)):
                if file == 'agents.json':
                    continue
                if file == 'final.log':
                    continue

                intersection_car_flow.append([])
                intersection_bike_flow.append([])
                road_car_flow.append([])
                road_bike_flow.append([])
                road_car_density.append([])
                road_bike_density.append([])

        for simulation in simulations:
            sim_dir = os.path.join(self.path_to_data, name, simulation)

            time_steps = sort_time_steps(os.listdir(sim_dir))

            minute = log_time_interval
            for time_step in time_steps:
                if not approx_equal(time_step['timestep'], minute * 60):
                    raise Exception('Time steps are not equal')

                with open(os.path.join(sim_dir, time_step['file_name'])) as f:
                    data = json.load(f)

                    index = minute // log_time_interval - 1

                    for intersection in data['intersections']:
                        intersection_bike_flow[index].append(intersection['bikeFlow'])
                        intersection_car_flow[index].append(intersection['carFlow'])
                    for road in data['streets']:
                        road_bike_flow[index].append(road['bikeFlow'])
                        road_car_flow[index].append(road['carFlow'])
                        road_bike_density[index].append(road['bikeDensity'])
                        road_car_density[index].append(road['carDensity'])

                minute += log_time_interval

        return intersection_bike_flow, intersection_car_flow, road_bike_flow, road_car_flow, road_bike_density, road_car_density

    def calculate_and_plot_data(self, name: str):
        intersection_bike_flow, intersection_car_flow, road_bike_flow, road_car_flow, road_bike_density, road_car_density = self.combine_simulations(name)
        time_steps = len(intersection_bike_flow)
        minutes = [i * 15 for i in range(1, time_steps + 1)]

        intersection_bike_flow_data = tracked_data()
        intersection_car_flow_data = tracked_data()
        intersection_agent_flow_data = tracked_data()

        road_bike_flow_data = tracked_data()
        road_car_flow_data = tracked_data()
        road_agent_flow_data = tracked_data()

        road_bike_density_data = tracked_data()
        road_car_density_data = tracked_data()
        road_agent_density_data = tracked_data()

        for i in range(time_steps):
            calculate_data(intersection_bike_flow_data, intersection_bike_flow[i])
            calculate_data(intersection_car_flow_data, intersection_car_flow[i])
            intersection_agent_flow = intersection_car_flow[i] + intersection_bike_flow[i]
            calculate_data(intersection_agent_flow_data, intersection_agent_flow)

            calculate_data(road_bike_flow_data, road_bike_flow[i])
            calculate_data(road_car_flow_data, road_car_flow[i])
            road_agent_flow = road_car_flow[i] + road_bike_flow[i]
            calculate_data(road_agent_flow_data, road_agent_flow)

            calculate_data(road_bike_density_data, road_bike_density[i])
            calculate_data(road_car_density_data, road_car_density[i])
            road_agent_density = road_car_density[i] + road_bike_density[i]
            calculate_data(road_agent_density_data, road_agent_density)

        plot_and_save_data(minutes,
                           intersection_bike_flow_data,
                           'Intersection Bike Flow',
                           'Time (min)',
                           'Flow (veh/s)',
                           os.path.join(self.output_dir, 'intersection_bike_flow.png'))

        plot_and_save_data(minutes,
                           intersection_car_flow_data,
                           'Intersection Car Flow',
                           'Time (min)',
                           'Flow (veh/s)',
                           os.path.join(self.output_dir, 'intersection_car_flow.png'))

        plot_and_save_data(minutes,
                           intersection_agent_flow_data,
                           'Intersection Agent Flow',
                           'Time (min)',
                           'Flow (veh/s)',
                           os.path.join(self.output_dir, 'intersection_agent_flow.png'))

        plot_and_save_data(minutes,
                           road_bike_flow_data,
                           'Road Bike Flow',
                           'Time (min)',
                           'Flow (veh/s)',
                           os.path.join(self.output_dir, 'road_bike_flow.png'))

        plot_and_save_data(minutes,
                           road_car_flow_data,
                           'Road Car Flow',
                           'Time (min)',
                           'Flow (veh/s)',
                           os.path.join(self.output_dir, 'road_car_flow.png'))

        plot_and_save_data(minutes,
                           road_agent_flow_data,
                           'Road Agent Flow',
                           'Time (min)',
                           'Flow (veh/s)',
                           os.path.join(self.output_dir, 'road_agent_flow.png'))

        plot_and_save_data(minutes,
                           road_bike_density_data,
                           'Road Bike Density',
                           'Time (min)',
                           'Density (veh/m)',
                           os.path.join(self.output_dir, 'road_bike_density.png'))

        plot_and_save_data(minutes,
                           road_car_density_data,
                           'Road Car Density',
                           'Time (min)',
                           'Density (veh/m)',
                           os.path.join(self.output_dir, 'road_car_density.png'))

        plot_and_save_data(minutes,
                           road_agent_density_data,
                           'Road Agent Density',
                           'Time (min)',
                           'Density (veh/m)',
                           os.path.join(self.output_dir, 'road_agent_density.png'))

        with open(os.path.join(self.output_dir, 'data.json'), 'w') as f:
            json.dump({
                'intersection_bike_flow': intersection_bike_flow_data,
                'intersection_car_flow': intersection_car_flow_data,
                'intersection_agent_flow': intersection_agent_flow_data,
                'road_bike_flow': road_bike_flow_data,
                'road_car_flow': road_car_flow_data,
                'road_agent_flow': road_agent_flow_data,
                'road_bike_density': road_bike_density_data,
                'road_car_density': road_car_density_data,
                'road_agent_density': road_agent_density_data
            }, f)


def plot_and_save_data(x: list, y: dict, name: str, x_label: str = 'Time', y_label: str = 'Flow', output_name: str = ''):
    p = LinePlot()
    p.plot(x, y['mean'], 'Mean')
    p.plot(x, y['95percentile'], '95th Percentile', '#5b5b5b', 'dashed')
    p.plot(x, y['5percentile'], '5th Percentile', '#5b5b5b', 'dashed')
    p.plot(x, y['mean+variance'], 'Variance', '#5b5b5b', 'dashed')
    p.plot(x, y['mean-variance'], 'Variance', '#5b5b5b', 'dashed')
    p.set_x_label(x_label)
    p.set_y_label(y_label)
    p.set_title(name)
    p.annotate_lines()
    p.save()


def approx_equal(a, b, epsilon: int = 10):
    return abs(a - b) < epsilon

def calculate_data(calculated_data: dict, data: list):
    m = mean(data)
    calculated_data['mean'].append(m)
    calculated_data['95percentile'].append(percentile(data, 95))
    calculated_data['5percentile'].append(percentile(data, 5))
    v = variance(data, m)
    calculated_data['mean+variance'].append(m + v)
    calculated_data['mean-variance'].append(m - v)


def sort_time_steps(time_steps):
    new_time_steps = []
    agent_file_name = 'agents.json'
    final_file_name = 'final.json'
    for time_step in time_steps:
        if time_step == agent_file_name or time_step == final_file_name:
            continue

        new_time_steps.append({
            'time_step': int(time_step.partition('.')[0]),
            'file_name': time_step
        })

    new_time_steps.sort(key=lambda x: x['time_step'])
    return new_time_steps


def tracked_data():
    return {
        'mean': [],
        '95percentile': [],
        '5percentile': [],
        'mean+variance': [],
        'mean-variance': []
    }


def mean(data):
    return sum(data) / len(data)


def variance(data, m: float = None):
    if mean is None:
        m = mean(data)
    return sum((x - m) ** 2 for x in data) / len(data)


def percentile(data, percent: int):
    data.sort()
    index = int(len(data) * percent / 100)
    return data[index]
