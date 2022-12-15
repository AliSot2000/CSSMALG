import json
import os
from linePlot import LinePlot
from mongo_api import MongoAPI
from database import db_username, db_password, db_ip


class Visualizer:
    def __init__(self, output_path):
        self.mongo = MongoAPI(db_ip, db_username, db_password)
        self.output_path = output_path

    def change_path(self, output_path):
        self.output_path = output_path

    def visualize_over_different_runs(self, simulation: str, road_type: str = 'intersection', agent_type: str = 'car', attribute: str = 'flow'):
        print(f'Visualizing {simulation} {road_type} {agent_type} {attribute}')
        all_collections = self.mongo.get_collections(simulation)

        collections = []
        for collection in all_collections:
            if '_timesteps' in collection:
                collections.append(collection)

        data = []

        tracked_attribute = f'{road_type}_{agent_type}_{attribute}'

        is_agent = agent_type == 'agent'

        if is_agent:
            for collection in collections:
                data.append(self.mongo.find(simulation,
                                            collection,
                                            {f'{road_type}_car_{attribute}': {'$exists': True}, f'{road_type}_bike_{attribute}': {'$exists': True}},
                                            {f'{road_type}_car_{attribute}': 1, f'{road_type}_bike_{attribute}': 1},
                                            [('time', 1)]))
        else:
            for collection in collections:
                data.append(self.mongo.find(simulation,
                                            collection,
                                            {tracked_attribute: {'$exists': True}},
                                            {tracked_attribute: 1},
                                            [('time', 1)]))

        data_length = len(data)
        if data_length < 1:
            raise Exception('No valid data found')

        time_steps = len(data[0])

        tracked_data = {
            'mean': [],
            '95percentile': [],
            '5percentile': [],
            'mean+variance': [],
            'mean-variance': []
        }

        for time_step in range(time_steps):
            data_points = []
            for data_point in range(data_length):
                if is_agent:
                    data_points.extend(data[data_point][time_step][f'{road_type}_car_{attribute}'])
                    data_points.extend(data[data_point][time_step][f'{road_type}_bike_{attribute}'])
                else:
                    data_points.extend(data[data_point][time_step][tracked_attribute])
            m = mean(data_points)
            tracked_data['mean'].append(m)
            tracked_data['95percentile'].append(percentile(data_points, 95))
            tracked_data['5percentile'].append(percentile(data_points, 5))
            v = variance(data_points, m)
            tracked_data['mean+variance'].append(m + v)
            tracked_data['mean-variance'].append(m - v)

        minutes = []

        current_minute = 15
        for i in range(time_steps):
            minutes.append(current_minute)
            current_minute += 15

        minutes = [(x + 1) * 15 for x in range(time_steps)]

        plot_and_save_data(minutes,
                           tracked_data,
                           f'{int("".join(x for x in simulation if x.isdigit()))}% Bikes - {tracked_attribute.title().replace("_", " ")}',
                           'Minutes',
                           attribute.title(),
                           os.path.join(self.output_path, f'{tracked_attribute}.png'))


def plot_and_save_data(x: list, y: dict, name: str, x_label: str = 'Time', y_label: str = 'Flow', output_name: str = ''):
    p = LinePlot()
    p.plot(x, y['mean'], 'Mean')
    p.plot(x, y['95percentile'], '95th Percentile', '#5b5b5b', 'dashed')
    p.plot(x, y['5percentile'], '5th Percentile', '#5b5b5b', 'dashed')
    # p.plot(x, y['mean+variance'], 'Variance', '#5b5b5b', 'dashed')
    # p.plot(x, y['mean-variance'], 'Variance', '#5b5b5b', 'dashed')
    p.set_x_label(x_label)
    p.set_y_label(y_label)
    p.set_title(name)
    p.annotate_lines()
    p.save(output_name)


def approx_equal(a, b, epsilon: int = 10):
    return abs(a - b) < epsilon


def mean(data: list = None):
    return sum(data) / len(data)


def variance(data, m: float = None):
    if mean is None:
        m = mean(data)
    return sum((x - m) ** 2 for x in data) / len(data)


def percentile(data: list = None, percent: int = 50):
    data.sort()
    index = int(len(data) * percent / 100)
    return data[index]
