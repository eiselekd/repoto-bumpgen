all:

start-server:
	python3 bumpgen.py

prep:
	sudo apt-get install python3-flask
	sudo apt install python3-gevent-websocket
	sudo apt-get install python3-pygit2
