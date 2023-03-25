#!/bin/sh
./start_display.sh &

export DISPLAY=:99.0
node web.js