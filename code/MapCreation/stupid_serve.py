from flask import Flask
from flask import send_from_directory

app = Flask(__name__)


@app.route("/<path:path>")
def send_file(path):
    return send_from_directory(".", path)


if __name__ == "__main__":
    app.run("0.0.0.0", 8080, True)
