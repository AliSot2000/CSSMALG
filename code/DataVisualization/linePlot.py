import matplotlib.pyplot as plt


class LinePlot:
    def __init__(self, data):
        self.data = data
        self.fig, self.ax = plt.subplots()

    def plot(self):
        self.ax.plot(self.data)

    def show(self):
        plt.show()

    def save(self, path):
        plt.savefig(path)

    def set_title(self, title):
        self.ax.title(title)

    def set_x_label(self, label):
        self.ax.xlabel(label)

    def set_y_label(self, label):
        self.ax.ylabel(label)

    def set_y_axis_grid(self, grid):
        self.ax.yaxis.grid(grid)
