#!/usr/bin/env python3

import requests
import base64
import os

HOST = 'http://0.0.0.0:8080'
HOST = 'http://saturn.picoctf.net:63273'

def get_reports(host: str):
    return requests.get(host + '/api/reports/get')

def read_screenshots(host=HOST):
    if not os.path.exists('screenshots'):
        os.makedirs('screenshots')

    reports: list = get_reports(host=host).json()

    for report, index in zip(reports, range(len(reports))):
        screenshot = report['screenshot']
        binary = base64.b64decode(screenshot)

        with open(f"screenshots/{index}.png", 'wb') as file:
            file.write(binary)

        # with open(f"screenshots/{index}.json", 'w') as file:
        #     file.write(stringify(report, indent=4))


if __name__ == '__main__':
    read_screenshots()
