#!/usr/bin/env python

from flask import request, Flask

app = Flask(__name__)

@app.route('/', defaults={'u_path': ''}, methods=['GET', 'POST'])
@app.route('/<path:u_path>', methods=['GET', 'POST'])
def login(u_path):
    print(u_path)
    print('headers:', request.headers)
    if request.method == 'POST':
        return 'abc'
    else:
        return 'def'

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=9000, debug=True)
