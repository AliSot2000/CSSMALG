import matplotlib.pyplot as plt


class LinePlot:
    """
    LinePlot because I want to plot lines.
    """

    lines = None  # List of all the lines

    def __init__(self):
        """
        Initialize the plot.
        """
        self.fig, self.ax = plt.subplots()
        self.lines = []
        self.labels = []

    def plot(self, x, y, label, color='Black', dash_style='solid'):
        """
        Plot a line.
        :param x: X values
        :param y: Y values
        :param label: Label of the line
        :param color: Color of the line
        :param dash_style: Dash style of the line
        :return:
        """
        self.labels.append(label)
        self.lines.append(self.ax.plot(x, y, color=color, linestyle=dash_style)[0])  # Plot the line

    def show(self):
        """
        Show the plot.
        :return:
        """
        plt.show()  # Show the plot

    def save(self, path):
        """
        Save the plot.
        :param path: Path to save the plot
        :return:
        """
        plt.savefig(path)  # Save the plot

    def set_title(self, title):
        """
        Set the title of the plot.
        :param title: Title of the plot
        :return:
        """
        self.ax.set_title(title)  # Set the title of the plot

    def set_x_label(self, label):
        """
        Set the x label of the plot.
        :param label: Label of the x axis
        :return:
        """
        self.ax.set_xlabel(label)  # Set the x label of the plot

    def set_y_label(self, label):
        """
        Set the y label of the plot.
        :param label: Label of the y axis
        :return:
        """
        self.ax.set_ylabel(label)  # Set the y label of the plot

    def set_y_axis_grid(self, grid):
        """
        Set the y axis grid.
        :param grid: True if the grid should be shown, False otherwise
        :return:
        """
        self.ax.yaxis.grid(grid)  # Set the y axis grid

    def annotate_lines(self):
        """
        Annotate the lines.
        :return:
        """
        self.ax.legend(handles=self.lines, labels=self.labels, loc="upper right")  # Annotate the lines

    def close (self):
        """
        Close the plot.
        :return:
        """
        plt.close()
