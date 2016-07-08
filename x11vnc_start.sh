#!/bin/bash

/usr/bin/xset -dpms
/usr/bin/xset s noblank
/usr/bin/xset s off

/usr/bin/x11vnc \
    -dontdisconnect \
	-no6 -noipv6 \
    -display :0 \
    -noxfixes \
    -shared \
    -forever \
    -rfbport 5900 \
    -tightfilexfer \
    -bg \
    -o ~/x11vnc.log \
    -rfbauth ~/.vnc/passwd

exit 0
