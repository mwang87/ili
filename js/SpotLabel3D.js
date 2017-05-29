'use strict';

function SpotLabel3D(group, scene) {
    SpotLabelBase.apply(this);
    this._group = group;
    this._scene = scene;
    this._view = null;
    this._raycastPromise = null;
    this._div = null;
    this._divs = [];
    this._changed = false;
}

SpotLabel3D.prototype = Object.create(SpotLabelBase.prototype, asProps({
    showFor: function(pageX, pageY) {
        if (this._raycastPromise) {
            this._raycastPromise.cancel();
            this._raycastPromise = null;
        }
        this._view = this._group.findView(pageX, pageY);
        this._spot = null;
        this._changed = true;
        if (this._view) {
            var raycaster = new THREE.Raycaster();
            this._view.setupRaycaster(raycaster, pageX, pageY);

            this._raycastPromise = this._scene.raycast(raycaster);
            if (this._raycastPromise) {
                this._raycastPromise.then(this._onRaycastComplete.bind(this));
            } else {
                this._view = null;
            }
        }
        this._group.requestAnimationFrame();
    },

    _onRaycastComplete: function(spot) {
        this._raycastPromise = null;
        this._spot = spot;
        this._changed = true;
        this._group.requestAnimationFrame();
    },

    update: function () {
        if (this._changed) {
            if (this._divs) {
                this._divs.forEach(function(div) {
                    div.parentNode.removeChild(div);
                });
                this._divs = [];
            }
            if (this._view && this._spot) {
                this._scene.spots.forEach(function (spot) {
                    this.createDiv('SpotLabel3D');
                    this._div.textContent = spot.name;
                    this._view.div.appendChild(this.div);

                    var position = this._scene.spotToWorld(spot);
                    if (position) {
                        var point2D = this._view.projectPosition(position);
                        this._div.style.left = point2D.x + 'px'
                        this._div.style.top = point2D.y + 'px'
                    }
                    this._divs.push(this.div);
                }.bind(this));
            }
            this._changed = false;
        }
    },
}));
