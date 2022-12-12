import matplotlib.pyplot as plt

class LinePlot:
    def __init__(self, data):
        self.data = data

    def plot(self):
        plt.plot(self.data)

    def show(self):
        plt.show()

    def save(self, path):
        plt.savefig(path)

    def setTitle(self, title):
        plt.title(title)

    def setXLabel(self, label):
        plt.xlabel(label)

    def setYLabel(self, label):
        plt.ylabel(label)

    def setYGrid(self, grid):
        plt.yaxis.grid(grid)