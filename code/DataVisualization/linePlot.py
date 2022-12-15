import matplotlib.pyplot as plt


class LinePlot:
    lines = []

    def __init__(self):
        self.fig, self.ax = plt.subplots()

    def plot(self, x, y, label, color='Black', dash_style='solid'):
        self.lines.append(label)
        self.ax.plot(x, y, label=label, color=color, linestyle=dash_style)

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

    def annotate_lines(self):
        lines = self.ax.get_lines()
        for line_index in range(len(lines)):
            y = lines[line_index].get_ydata()[-1]
            self.ax.annotate(self.lines[line_index],
                             xy=(1, y),
                             xytext=(8, 0),
                             xycoords=('axes fraction', 'data'),
                             textcoords='offset points',
                             size=14,
                             va="center")
