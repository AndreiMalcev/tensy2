from flask import Flask, render_template
from flask_socketio import SocketIO
from flask_socketio import send, emit
from werkzeug.middleware.proxy_fix import ProxyFix


app = Flask(__name__)
socketio = SocketIO(app)
app.wsgi_app = ProxyFix(app.wsgi_app)


@app.route('/')
def index():
    return render_template('index.html')


@socketio.on('student')
def call(student):
    emit('')


if __name__ == '__main__':
    socketio.run(app)
