
UGLIFYJS = ./node_modules/.bin/uglifyjs

dist: dist/cartodb-leaflet-min.js

dist/cartodb-leaflet-min.js:
	$(UGLIFYJS) dist/cartodb-leaflet.js > dist/cartodb-leaflet-min.js

clean: 
	rm -rf dist/cartodb-leaflet-min.js


PHONY: clean 

