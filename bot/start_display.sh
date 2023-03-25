rm -f /tmp/.X99-lock
while true
do
    Xvfb -ac :99 -screen 0 1280x720x16
done