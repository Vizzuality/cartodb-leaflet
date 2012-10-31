[v 0.55]
- Added support for multiple subdomains.
- We no longer remove the interaction of the layer if there's a timeout.

[v 0.54]
- First tests added.
- Opacity bugs fixed.
- Now there are triggers when an action is performed.
- New 'loading' and 'load' events are triggered when layer is loading or done.
- Simple and interaction layers are both based on wax.
- All functins check first if the layer belongs to the map first.
- New function isAdded returns if the layer belongs to the map.
- Hide and show check if the layer is already shown or hidden.
- Support for hexagons and density visualizations.

[v 0.53]
- Examples index page back.
- Attribution paramater + function added.
- Wax (v7.0.0dev9) library updated.
- Leaflet (v0.4.4) library updated.
- Removed noscript redirects.

[v 0.52]
- Bug related to removing wax interacion fixex.

[v 0.51]
- Bug related to unbind interaction fixed.

[v 0.50]
- Bug related to iPad clientX and clientY position fixed.

[v 0.49]
- Hide and show bug fixed.
- Wax 7.0.0 touched and added.

[v 0.48]
- New function, setOptions, to change any param at the same time.
- Wax 6.2.3 touched and added.

[v 0.47]
- Touch events supported
- Feature event functions renamed (featureClick,featureOut,featureOver)
- New parameter added in those functions, position. Where it returns the x and y position where user clicked or touched.
- setBounds function improved
- setBounds function added for publicy using.
