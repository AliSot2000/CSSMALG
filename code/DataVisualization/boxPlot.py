import matplotlib.pyplot as plt


class BoxPlot:
    """
    BoxPlot because I want to plot boxes.
    """
    def __init__(self, data):
        """
        Initialize the plot.
        :param data: Data to plot
        """
        self.data = data  # Data to plot
        self.fig, self.ax = plt.subplots()  # Initialize the plot
        self.ax.boxplot(self.data)  # Plot the data
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
        Set the grid of the y axis.
        :param grid: Show the grid of the y axis
        :return:
        """
        self.ax.yaxis.grid(grid)  # Set the grid of the y axis

    def set_x_ticks(self, labels):
        """
        Set the x ticks.
        :param labels: Labels of the x ticks
        :return:
        """
        self.ax.set_xticks(range(1, len(labels) + 1), labels)  # Set the x ticks
