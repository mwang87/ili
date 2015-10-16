function Scene3D() {
    EventSource.call(this, Scene3D.Events);

    this._scene = new THREE.Scene();
    this._frontLight = new THREE.PointLight(0xffffff, 1.5, 0);
    this._mesh = null;
    this._meshContainer = new THREE.Object3D();
    this._color = new THREE.Color('#575757');
    this._backgroundColor = new THREE.Color('black');
    this._meshMaterial = new THREE.MeshLambertMaterial({
        vertexColors: THREE.VertexColors,
        transparent: true,
        opacity: 0.9,
        shininess: 3,
        shading: THREE.SmoothShading
    });

    this._spotBorder = 0.05;
    this._colorMap = null;
    this._adjustment = {x: 0, y: 0, z: 0, alpha: 0, beta: 0, gamma: 0};
    this._model_slicing = {xmin: -100.0, xmax: 100.0, ymin: -100.0, ymax: 100.0, zmin: -100.0, zmax: 100.0};
    this._model_bounds = null
    this._model_exploding = {do_explode: false, dimension: "x", num_partitions: 5, slice_separation: 0.3}
    this._model_slicing_real_coordinates = {xmin: "-100.0", xmax: "100.0", ymin: "-100.0", ymax: "100.0", zmin: "-100.0", zmax: "100.0"};
    this._model_export = { download:
        function(parent_obj){
            return function(){
                console.log(parent_obj)
                BinaryStlWriter.save(parent_obj.geometry, parent_obj.model_export_name)
            }
        }(this)
    };
    this._model_export_name = "export.stl"

    this._model_transparency = 0.9;

    this._spots = null;
    this._mapping = null;

    this._scene.add(new THREE.AxisHelper(20));
    this._scene.add(this._meshContainer);
    this._scene.add(this._frontLight);
};

Scene3D.Events = {
    CHANGE: 'change',
};

Scene3D._makeLightProperty = function(field) {
    return Scene3D._makeProxyProperty(field, ['intensity'], function() {
        this._notify(Scene3D.Events.CHANGE);
    });
};

Scene3D._makeProxyProperty = function(field, properties, callback) {
    var proxy;
    return {
        get: function() {
            if (proxy) return proxy;
            proxy = {};
            for (var i = 0; i < properties.length; i++) {
                Object.defineProperty(proxy, properties[i], {
                    get: function(prop) {
                        return this[field][prop]
                    }.bind(this, properties[i]),

                    set: function(prop, value) {
                        this[field][prop] = value;
                        callback.call(this);
                    }.bind(this, properties[i])
                });
            }
            return proxy;
        },

        set: function(value) {
            for (var i = 0; i < properties.length; i++) {
                var prop = properties[i]
                this[field][prop] = value[prop];
            }
            callback.call(this);
        }
    }
};

Scene3D.prototype = Object.create(EventSource.prototype, {
    clone: {
        value: function(eventName, listener) {
            var result = new Scene3D();
            result.frontLight = this.frontLight;
            result.color = this.color;
            result.backgroundColor = this.backgroundColor;
            result.spotBorder = this.spotBorder;
            result.colorMap = this.colorMap;
            result.adjustment = this.adjustment;
            var geometry = new THREE.BufferGeometry();
            for (var i in this.geometry.attributes) {
                var a = this.geometry.attributes[i];
                geometry.addAttribute(i, new THREE.BufferAttribute(a.array, a.itemSize));
            }
            result.geometry = geometry;
            result.spots = this.spots;
            result.mapping = this.mapping;
            return result;
        }
    },

    frontLight: Scene3D._makeLightProperty('_frontLight'),

    color: {
        get: function() {
            return '#' + this._color.getHexString();
        },

        set: function(value) {
            var color = new THREE.Color(value);
            if (color.equals(this._color)) return;
            this._color.set(color);
            if (this._mesh) {
                this._recolor();
                this._notify(Scene3D.Events.CHANGE);
            }
        }
    },

    backgroundColor: {
        get: function() {
            return '#' + this._backgroundColor.getHexString();
        },

        set: function(value) {
            var color = new THREE.Color(value);
            if (color.equals(this._backgroundColor)) return;
            this._backgroundColor.set(color);
            this._notify(Scene3D.Events.CHANGE);
        }
    },

    backgroundColorValue: {
        get: function() {
            return this._backgroundColor;
        }
    },

    spotBorder: {
        get: function() {
            return this._spotBorder;
        },

        set: function(value) {
            if (this._spotBorder == value) return;
            if (value < 0.0) value = 0.0;
            if (value > 1.0) value = 1.0;
            this._spotBorder = value;
            if (this._mesh) {
                this._recolor();
                this._notify(Scene3D.Events.CHANGE);
            }
        }
    },

    adjustment: Scene3D._makeProxyProperty('_adjustment', ['x', 'y', 'z', 'alpha', 'beta', 'gamma'],
            function() {
        if (this._mesh) {
            this._applyAdjustment();
            this._notify(Scene3D.Events.CHANGE);
        }
    }),

    model_export: Scene3D._makeProxyProperty('_model_export', ['download']),

    model_export_name: {
        get: function() {
            return this._model_export_name;
        },

        set: function(value) {
            this._model_export_name = value;
        }
    },

    model_transparency: {
        get: function() {
            return this._model_transparency;
        },

        set: function(value) {
            this._model_transparency = value;
            this._mesh.material.opacity = value;
            this._notify(Scene3D.Events.CHANGE);
        }
    },


    model_slicing: Scene3D._makeProxyProperty('_model_slicing', ['xmin', 'xmax', 'ymin', 'ymax', 'zmin', 'zmax'],
            function() {
        if (this._mesh) {
            mapping_present = false
            if(this.mapping != null){
                mapping_present = true
            }

            //Save out the model when appropriate
            if(this._old_geometry == null){
                this._old_geometry = this.geometry.clone()
                if(mapping_present){
                    this._old_mapping = new Object()
                    this._old_mapping.closestSpotIndeces = new Int32Array(this.mapping.closestSpotIndeces.length)
                    this._old_mapping.closestSpotDistances = new Float32Array(this.mapping.closestSpotDistances.length)
                    for(i in this.mapping.closestSpotDistances){
                        this._old_mapping.closestSpotIndeces[i] = this.mapping.closestSpotIndeces[i]
                        this._old_mapping.closestSpotDistances[i] = this.mapping.closestSpotDistances[i]
                    }
                }
            }

            positions = this._old_geometry.getAttribute('position').array;
            normals = this._old_geometry.getAttribute('normal').array;
            colors = this._old_geometry.getAttribute('color').array;



            var t1 = new Date();

            if(this._model_bounds == null){
                model_min_x = 1000000
                model_max_x = -1000000
                model_min_y = 1000000
                model_max_y = -1000000
                model_min_z = 1000000
                model_max_z = -1000000

                for( i = 0; i < colors.length/3; i++){
                    base = i*3;
                    x_idx = base
                    y_idx = base + 1
                    z_idx = base + 2

                    model_min_x = Math.min(positions[x_idx], model_min_x)
                    model_max_x = Math.max(positions[x_idx], model_max_x)
                    model_min_y = Math.min(positions[y_idx], model_min_y)
                    model_max_y = Math.max(positions[y_idx], model_max_y)
                    model_min_z = Math.min(positions[z_idx], model_min_z)
                    model_max_z = Math.max(positions[z_idx], model_max_z)
                }

                this._model_bounds = {model_min_x: model_min_x, model_max_x: model_max_x, model_min_y: model_min_y, model_max_y: model_max_y,
                    model_min_z: model_min_z, model_max_z: model_max_z}
            }

            model_min_x = this._model_bounds.model_min_x
            model_max_x = this._model_bounds.model_max_x
            model_min_y = this._model_bounds.model_min_y
            model_max_y = this._model_bounds.model_max_y
            model_min_z = this._model_bounds.model_min_z
            model_max_z = this._model_bounds.model_max_z

            scaled_min_x = (model_max_x - model_min_x)/200.0 * (this._model_slicing.xmin+100.0) + model_min_x
            scaled_max_x = (model_max_x - model_min_x)/200.0 * (this._model_slicing.xmax+100.0) + model_min_x
            scaled_min_y = (model_max_y - model_min_y)/200.0 * (this._model_slicing.ymin+100.0) + model_min_y
            scaled_max_y = (model_max_y - model_min_y)/200.0 * (this._model_slicing.ymax+100.0) + model_min_y
            scaled_min_z = (model_max_z - model_min_z)/200.0 * (this._model_slicing.zmin+100.0) + model_min_z
            scaled_max_z = (model_max_z - model_min_z)/200.0 * (this._model_slicing.zmax+100.0) + model_min_z

            var t2 = new Date();

            triangle_count = 0
            for( i = 0; i < colors.length/9; i++){
                base = i*9


                //Find whether any vertex exceeds the threshold
                out_of_bounds = false
                for(j = 0; j < 3; j++){
                    x_idx = base + j * 3
                    y_idx = base + j * 3 + 1
                    z_idx = base + j * 3 + 2

                    if( positions[x_idx] >= scaled_min_x && positions[x_idx] <= scaled_max_x &&
                        positions[y_idx] >= scaled_min_y && positions[y_idx] <= scaled_max_y &&
                        positions[z_idx] >= scaled_min_z && positions[z_idx] <= scaled_max_z){
                        // in bounds
                    }
                    else{
                        out_of_bounds = true
                        break
                    }
                }

                if(out_of_bounds == false){
                    triangle_count++;
                }
            }

            //Doing Color Setting Based Upon
            //Saving the old colors, normals, and positions
            new_positions = new Float32Array(triangle_count * 9)
            new_colors = new Float32Array(triangle_count * 9)
            new_normals = new Float32Array(triangle_count * 9)

            closestSpotIndeces = null;
            closestSpotDistances = null;
            new_closestSpotIndeces = null;
            new_closestSpotDistances = null;
            if(mapping_present){
                closestSpotIndeces = this._old_mapping.closestSpotIndeces;
                closestSpotDistances = this._old_mapping.closestSpotDistances;
                new_closestSpotIndeces = new Int32Array(triangle_count * 3)
                new_closestSpotDistances = new Float32Array(triangle_count * 3)
            }



            current_array_pointer = 0
            mapping_index_pointer = 0
            //Look over three vertices at a time, and then remove all 3 if any of the exceed a certain threshold
            for( i = 0; i < colors.length/9; i++){
                base = i*9

                //Find whether any vertex exceeds the threshold
                out_of_bounds = false
                for(j = 0; j < 3; j++){
                    x_idx = base + j * 3
                    y_idx = base + j * 3 + 1
                    z_idx = base + j * 3 + 2

                    if( positions[x_idx] >= scaled_min_x && positions[x_idx] <= scaled_max_x &&
                        positions[y_idx] >= scaled_min_y && positions[y_idx] <= scaled_max_y &&
                        positions[z_idx] >= scaled_min_z && positions[z_idx] <= scaled_max_z){
                        // in bounds
                    }
                    else{
                        out_of_bounds = true
                        break
                    }
                }

                if(out_of_bounds == false){
                    for(j = 0; j < 3; j++){
                        x_idx = base + j * 3
                        y_idx = base + j * 3 + 1
                        z_idx = base + j * 3 + 2

                        new_positions[current_array_pointer] = positions[x_idx]
                        new_colors[current_array_pointer] = colors[x_idx]
                        new_normals[current_array_pointer] = normals[x_idx]
                        current_array_pointer++;
                        new_positions[current_array_pointer] = positions[y_idx]
                        new_colors[current_array_pointer] = colors[y_idx]
                        new_normals[current_array_pointer] = normals[y_idx]
                        current_array_pointer++;
                        new_positions[current_array_pointer] = positions[z_idx]
                        new_colors[current_array_pointer] = colors[z_idx]
                        new_normals[current_array_pointer] = normals[z_idx]
                        current_array_pointer++;

                        if(mapping_present){
                            new_closestSpotIndeces[mapping_index_pointer] = closestSpotIndeces[i*3+j]
                            new_closestSpotDistances[mapping_index_pointer] = closestSpotDistances[i*3+j]
                            mapping_index_pointer++;
                        }
                    }
                }
            }

            var t3 = new Date();


            //Updating the real coordinates
            this._model_slicing_real_coordinates["xmin"] = scaled_min_x
            this._model_slicing_real_coordinates["xmax"] = scaled_max_x
            this._model_slicing_real_coordinates["ymin"] = scaled_min_y
            this._model_slicing_real_coordinates["ymax"] = scaled_max_y
            this._model_slicing_real_coordinates["zmin"] = scaled_min_z
            this._model_slicing_real_coordinates["zmax"] = scaled_max_z

            updateGUIDisplay();

            geometry = this.geometry

            geometry.getAttribute('position').array = new_positions
            geometry.getAttribute('color').array = new_colors
            geometry.getAttribute('normal').array = new_normals

            geometry.getAttribute('position').needsUpdate = true;
            geometry.getAttribute('normal').needsUpdate = true;
            geometry.getAttribute('color').needsUpdate = true;


            if(mapping_present){
                this.mapping.closestSpotIndeces = new_closestSpotIndeces
                this.mapping.closestSpotDistances = new_closestSpotDistances
            }




            var t4 = new Date();


            console.log('T1-T2: ' + (t2.valueOf() - t1.valueOf()) / 1000);
            console.log('T2-T3: ' + (t3.valueOf() - t2.valueOf()) / 1000);
            console.log('T3-T4: ' + (t4.valueOf() - t3.valueOf()) / 1000);

            this._recolor();
            this._notify(Scene3D.Events.CHANGE);
        }
    }),

    model_exploding: Scene3D._makeProxyProperty('_model_exploding', ['dimension', 'do_explode', 'num_partitions', 'slice_separation'],
            function() {
        if (this._mesh) {
            //Save out the model when appropriate
            mapping_present = false
            if(this.mapping != null){
                mapping_present = true
            }

            if(this._old_geometry == null){
                this._old_geometry = this.geometry.clone()
                if(mapping_present){
                    this._old_mapping = new Object()
                    this._old_mapping.closestSpotIndeces = new Int32Array(this.mapping.closestSpotIndeces.length)
                    this._old_mapping.closestSpotDistances = new Float32Array(this.mapping.closestSpotDistances.length)
                    for(i in this.mapping.closestSpotDistances){
                        this._old_mapping.closestSpotIndeces[i] = this.mapping.closestSpotIndeces[i]
                        this._old_mapping.closestSpotDistances[i] = this.mapping.closestSpotDistances[i]
                    }
                }
            }



            if(this.mapping != null && this._old_mapping != null){
                this.mapping.closestSpotIndeces = this._old_mapping.closestSpotIndeces
                this.mapping.closestSpotDistances = this._old_mapping.closestSpotDistances
            }

            if(this._model_exploding.do_explode == false){
                geometry.getAttribute('position').array = this._old_geometry.getAttribute('position').array;
                geometry.getAttribute('color').array = this._old_geometry.getAttribute('color').array;
                geometry.getAttribute('normal').array = this._old_geometry.getAttribute('normal').array;

                geometry.getAttribute('position').needsUpdate = true;
                geometry.getAttribute('normal').needsUpdate = true;
                geometry.getAttribute('color').needsUpdate = true;

                this._notify(Scene3D.Events.CHANGE);
                return;
            }

            positions = this._old_geometry.getAttribute('position').array;
            normals = this._old_geometry.getAttribute('normal').array;
            colors = this._old_geometry.getAttribute('color').array;



            if(this._model_bounds == null){
                model_min_x = 1000000
                model_max_x = -1000000
                model_min_y = 1000000
                model_max_y = -1000000
                model_min_z = 1000000
                model_max_z = -1000000

                for( i = 0; i < colors.length/3; i++){
                    base = i*3;
                    x_idx = base
                    y_idx = base + 1
                    z_idx = base + 2

                    model_min_x = Math.min(positions[x_idx], model_min_x)
                    model_max_x = Math.max(positions[x_idx], model_max_x)
                    model_min_y = Math.min(positions[y_idx], model_min_y)
                    model_max_y = Math.max(positions[y_idx], model_max_y)
                    model_min_z = Math.min(positions[z_idx], model_min_z)
                    model_max_z = Math.max(positions[z_idx], model_max_z)
                }

                this._model_bounds = {model_min_x: model_min_x, model_max_x: model_max_x, model_min_y: model_min_y, model_max_y: model_max_y,
                    model_min_z: model_min_z, model_max_z: model_max_z}
            }

            model_min_x = this._model_bounds.model_min_x
            model_max_x = this._model_bounds.model_max_x
            model_min_y = this._model_bounds.model_min_y
            model_max_y = this._model_bounds.model_max_y
            model_min_z = this._model_bounds.model_min_z
            model_max_z = this._model_bounds.model_max_z

            number_of_partitions = this._model_exploding.num_partitions
            partition_separation_ratio = this._model_exploding.slice_separation

            //Doing Color Setting Based Upon
            //Saving the old colors, normals, and positions
            new_positions = new Float32Array(positions.length)
            new_colors = new Float32Array(positions.length)
            new_normals = new Float32Array(positions.length)

            //Look over three vertices at a time, and then remove all 3 if any of the exceed a certain threshold
            current_array_pointer = 0
            for( i = 0; i < colors.length/9; i++){
                base = i*9

                max_partition_number = 0
                //Determine which partition number this triangle is a part of
                for(j = 0; j < 3; j++){
                    x_idx = base + j * 3
                    y_idx = base + j * 3 + 1
                    z_idx = base + j * 3 + 2

                    if(this._model_exploding.dimension == "x"){
                        delta_x = model_max_x  - model_min_x;
                        transformed_x = positions[x_idx] - model_min_x;
                        normalized_x = transformed_x / delta_x;
                        partition_number = Math.floor(normalized_x/(1.0/number_of_partitions))
                        max_partition_number = Math.max(partition_number)
                    }

                    if(this._model_exploding.dimension == "y"){
                        delta_dim = model_max_y  - model_min_y;
                        transformed_dim = positions[y_idx] - model_min_y;
                        normalized_dim = transformed_dim / delta_dim;
                        partition_number = Math.floor(normalized_dim/(1.0/number_of_partitions))
                        max_partition_number = Math.max(partition_number)
                    }

                    if(this._model_exploding.dimension == "z"){
                        delta_dim = model_max_z  - model_min_z;
                        transformed_dim = positions[z_idx] - model_min_z;
                        normalized_dim = transformed_dim / delta_dim;
                        partition_number = Math.floor(normalized_dim/(1.0/number_of_partitions))
                        max_partition_number = Math.max(partition_number)
                    }
                }
                //console.log(max_partition_number);

                for(j = 0; j < 3; j++){
                    x_idx = base + j * 3
                    y_idx = base + j * 3 + 1
                    z_idx = base + j * 3 + 2

                    if(this._model_exploding.dimension == "x"){
                        delta_x = model_max_x  - model_min_x;

                        new_positions[current_array_pointer] = positions[x_idx] + partition_separation_ratio*delta_x*max_partition_number
                        new_colors[current_array_pointer] = colors[x_idx]
                        new_normals[current_array_pointer] = normals[x_idx]
                        current_array_pointer++;
                        new_positions[current_array_pointer] = positions[y_idx]
                        new_colors[current_array_pointer] = colors[y_idx]
                        new_normals[current_array_pointer] = normals[y_idx]
                        current_array_pointer++;
                        new_positions[current_array_pointer] = positions[z_idx]
                        new_colors[current_array_pointer] = colors[z_idx]
                        new_normals[current_array_pointer] = normals[z_idx]
                        current_array_pointer++;
                    }

                    if(this._model_exploding.dimension == "y"){
                        delta_y = model_max_y  - model_min_y;

                        new_positions[current_array_pointer] = positions[x_idx]
                        new_colors[current_array_pointer] = colors[x_idx]
                        new_normals[current_array_pointer] = normals[x_idx]
                        current_array_pointer++;
                        new_positions[current_array_pointer] = positions[y_idx] + partition_separation_ratio*delta_y*max_partition_number
                        new_colors[current_array_pointer] = colors[y_idx]
                        new_normals[current_array_pointer] = normals[y_idx]
                        current_array_pointer++;
                        new_positions[current_array_pointer] = positions[z_idx]
                        new_colors[current_array_pointer] = colors[z_idx]
                        new_normals[current_array_pointer] = normals[z_idx]
                        current_array_pointer++;
                    }

                    if(this._model_exploding.dimension == "z"){
                        delta_z = model_max_z  - model_min_z;

                        new_positions[current_array_pointer] = positions[x_idx]
                        new_colors[current_array_pointer] = colors[x_idx]
                        new_normals[current_array_pointer] = normals[x_idx]
                        current_array_pointer++;
                        new_positions[current_array_pointer] = positions[y_idx]
                        new_colors[current_array_pointer] = colors[y_idx]
                        new_normals[current_array_pointer] = normals[y_idx]
                        current_array_pointer++;
                        new_positions[current_array_pointer] = positions[z_idx] + partition_separation_ratio*delta_z*max_partition_number
                        new_colors[current_array_pointer] = colors[z_idx]
                        new_normals[current_array_pointer] = normals[z_idx]
                        current_array_pointer++;
                    }


                }
            }


            geometry = this.geometry

            geometry.getAttribute('position').array = new_positions
            geometry.getAttribute('color').array = new_colors
            geometry.getAttribute('normal').array = new_normals

            geometry.getAttribute('position').needsUpdate = true;
            geometry.getAttribute('normal').needsUpdate = true;
            geometry.getAttribute('color').needsUpdate = true;

            this._recolor();
            this._notify(Scene3D.Events.CHANGE);
        }
    }),

    spots: {
        get: function() {
            return this._spots;
        },

        set: function(value) {
            if (value) {
                this._spots = new Array(value.length);
                for (var i = 0; i < value.length; i++) {
                    this._spots[i] = {
                        x: value[i].x,
                        y: value[i].y,
                        z: value[i].z,
                        r: value[i].r,
                        intensity: value[i].intensity,
                        color: new THREE.Color(),
                        name: value[i].name,
                    };
                }
            } else {
                this._spots = null;
            }
            if (this._mapping) {
                this._mapping = null; // Mapping is obsolete.

                if (this._mesh) {
                    this._recolor();
                    this._notify(Scene3D.Events.CHANGE);
                }
            }
        }
    },

    updateIntensities: {
        value: function(spots) {
            if (!this._spots) return;

            for (var i = 0; i < this._spots.length; i++) {
                this._spots[i].intensity = spots[i].intensity;
            }
            if (this._mesh && this._mapping) {
                this._recolor();
                this._notify(Scene3D.Events.CHANGE);
            }
        }
    },

    mapping: {
        get: function() {
            return this._mapping;
        },

        set: function(value) {
            if (!this._spots) throw "Mapping donesn't make sense without spots";
            this._mapping = value;
            if (this._mesh) {
                this._recolor();
                this._notify(Scene3D.Events.CHANGE);
            }
        }
    },

    geometry: {
        get: function() {
            return this._mesh ? this._mesh.geometry : null;
        },

        set: function(geometry) {
            if (!this._mesh && !geometry) return;
            if (this._mesh) this._meshContainer.remove(this._mesh);
            this._mapping = null;
            if (geometry) {
                geometry.computeBoundingBox();
                this._mesh = new THREE.Mesh(geometry, this._meshMaterial);
                this._mesh.position.copy(geometry.boundingBox.center().negate());
                this._meshContainer.add(this._mesh);
                this._applyAdjustment();
                this._recolor();
            } else {
                this._mesh = null;
            }
            this._notify(Scene3D.Events.CHANGE);
        }
    },

    colorMap: {
        get: function() {
            return this._colorMap;
        },

        set: function(value) {
            this._colorMap = value;
            if (this._mesh && this._spots && this._mapping) {
                this._recolor();
                this._notify(Scene3D.Events.CHANGE);
            }
        }
    },

    position: {
        get: function() {
            return this._scene.position.clone();
        }
    },

    render: {
        value: function(renderer, camera) {
            this._frontLight.position.set(camera.position.x, camera.position.y, camera.position.z);
            renderer.render(this._scene, camera);
        }
    },

    raycast: {
        value: function(raycaster) {
            if (!this._mesh || !this._spots || !this._mapping) return null;
            var message = {
                positions: this._mesh.geometry.attributes.position.array,
                origin: new THREE.Vector3().copy(raycaster.ray.origin),
                direction: new THREE.Vector3().copy(raycaster.ray.direction),
                matrixWorld: new THREE.Matrix4().copy(this._mesh.matrixWorld),
            };
            var closestSpotIndeces = this._mapping.closestSpotIndeces;
            var spots = this._spots;
            var worker = new Worker('js/workers/Raycaster.js');

            var promise = new Promise(function(accept, reject) {
                worker.onmessage = function(event) {
                    worker.terminate();
                    var face = event.data;
                    var spotIndex = -1;
                    for (var i in (face || {})) {
                        if (closestSpotIndeces[face[i]] >= 0) {
                            spotIndex = closestSpotIndeces[face[i]];
                            break;
                        }
                    }
                    accept(spots[spotIndex]);
                };
                worker.onerror = function(event) {
                    console.log('Reycasting failed', event);
                    worker.terminate();
                    reject();
                };
                worker.postMessage(message);
            });

            Object.defineProperty(promise, 'cancel', {
                value: function() {
                    worker.terminate();
                }
            });

            return promise;
        }
    },

    spotToWorld: {
        value: function(spot) {
            if (!this._mesh) return null;

            var position = new THREE.Vector3(spot.x, spot.y, spot.z);
            position.applyMatrix4(this._mesh.matrixWorld);
            return position;
        }
    },

    _recolor: {
        value: function() {
            var startTime = new Date();
            var geometry = this.geometry;
            var mapping = this.mapping;
            var spots = this.spots;

            var position = geometry.getAttribute('position');
            var positionCount = position.array.length / position.itemSize;

            if (mapping) {
                for (var i = 0; i < spots.length; i++) {
                    if (!isNaN(spots[i].intensity)) {
                        this._colorMap.map(spots[i].color, spots[i].intensity);
                    }
                }
            }

            if (!geometry.getAttribute('color')) {
                geometry.addAttribute('color', new THREE.BufferAttribute(
                        new Float32Array(positionCount * 3), 3));
            }
            var color = geometry.getAttribute('color').array;


            // Fill |color| with this._color.
            if (positionCount) {
                var CHUNK_SIZE = 64;
                var last = 0;
                if (positionCount > CHUNK_SIZE) {
                    for (var i = 0; i < CHUNK_SIZE; i++) {
                        this._color.toArray(color, i * 3);
                    }
                    var chunk = new Float32Array(color.buffer, 0, CHUNK_SIZE * 3);
                    for (var i = CHUNK_SIZE; i <= positionCount - CHUNK_SIZE; last = i, i+= CHUNK_SIZE) {
                        color.set(chunk, i * 3);
                    }
                }
                for (var i = last; i < positionCount; i++) {
                    this._color.toArray(color, i * 3);
                }
            }

            if (mapping) {
                var spotBorder = 1.0 - this._spotBorder;
                var closestSpotIndeces = mapping.closestSpotIndeces;
                var closestSpotDistances = mapping.closestSpotDistances;
                for (var i = 0; i < positionCount; i++) {
                    var index = closestSpotIndeces[i];
                    if (index >= 0) {
                        var spot = spots[index];
                        if (!isNaN(spot.intensity)) {
                            var alpha = 1.0 - spotBorder * closestSpotDistances[i];
                            var base = i * 3;
                            color[base + 0] += (spot.color.r - color[base + 0]) * alpha;
                            color[base + 1] += (spot.color.g - color[base + 1]) * alpha;
                            color[base + 2] += (spot.color.b - color[base + 2]) * alpha;
                        }
                    }
                }
            }



            geometry.getAttribute('color').needsUpdate = true;

            var endTime = new Date();
            console.log('Recoloring time: ' +
                    (endTime.valueOf() - startTime.valueOf()) / 1000);
        }
    },

    _applyAdjustment: {
        value: function() {
            this._meshContainer.rotation.x = this._adjustment.alpha * Math.PI / 180;
            this._meshContainer.rotation.y = this._adjustment.beta * Math.PI / 180;
            this._meshContainer.rotation.z = this._adjustment.gamma * Math.PI / 180;
            this._meshContainer.position.copy(this._adjustment);
            this._meshContainer.updateMatrix();
        }
    },
});
