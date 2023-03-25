#!/usr/bin/env python3

import requests
import base64
from json import dumps as stringify

HOST = 'http://0.0.0.0:8080'
# HOST = 'http://saturn.picoctf.net:51675'

def get_reports():
    return requests.get(HOST + '/api/reports/get')

reports: list = get_reports().json()

for report, index in zip(reports, range(len(reports))):


    screenshot = report['screenshot']
    binary = base64.b64decode(screenshot)

    with open(f"screenshots/{index}.png", 'wb') as file:
        file.write(binary)

    with open(f"screenshots/{index}.json", 'w') as file:
        file.write(stringify(report, indent=4))
