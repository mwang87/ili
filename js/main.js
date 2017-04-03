/**
 * Main application page.
 */
'use strict';

// High level object. Could be easily accessed from Web Inspector.
var g_workspace;
var g_views;
var g_gui;
var g_mapSelector;

/*
 * On load initialization.
 */
function init() {
    g_workspace = new Workspace();
    g_views = new ViewContainer(g_workspace, $('#view-container')[0]);
    g_mapSelector = new MapSelector(
            g_workspace,
            $('#map-selector')[0],
            $('#current-map-label')[0]);

    initGUI();

    g_workspace.addEventListener(Workspace.Events.STATUS_CHANGE,
                                 onWorkspaceStatusChange);
    g_workspace.addEventListener(Workspace.Events.ERRORS_CHANGE,
                                 onWorkspaceErrorsChange);

    document.addEventListener('keydown', onKeyDown, false);

    $('#open-button').click(chooseFilesToOpen);
    $('#current-map-label').click(function() {g_mapSelector.activate();});
    $('#view-container').mousedown(function(event) {g_mapSelector.deactivate();});
    $('dialog#errors #close').click(clearErrors);

    for (var e in DragAndDrop) {
        var fn = DragAndDrop[e];
        if (typeof fn != 'function') continue;
        document.addEventListener(e, DragAndDrop[e], true);
    }

    if (window.location.search) {
        var options = window.location.search.slice(1)
                      .split('&')
                      .reduce(function _reduce (/*Object*/ a, /*String*/ b) {
                        b = b.split('=');
                        a[b[0]] = decodeURIComponent(b[1]);
                        return a;
                      }, {});
        console.log(options)

        var stl_filename = options["stl"]
        var mapping_filename = options["mapping"]

        //var fileNames = window.location.search.substr(1).split(';');
        g_workspace.download([stl_filename, mapping_filename]);

        if("position_x" in options){
            var position_x = options["position_x"]
            var position_y = options["position_y"]
            var position_z = options["position_z"]

            set_positioning_of_model(position_x, position_y, position_z)
        }

        if("rotation_x" in options){
            var rotation_x = options["rotation_x"]
            var rotation_y = options["rotation_y"]
            var rotation_z = options["rotation_z"]

            set_rotation_of_model(rotation_x, rotation_y, rotation_z)
        }

        if("mapping_value" in options){
            var mapping_value = options["mapping_value"]
            set_color_scaling("log")
            set_color_mapping("JET")
        }


        if("mapping_scaling" in options){
            var mapping_scaling = options["mapping_scaling"]
            set_color_scaling(mapping_scaling)
        }

        if("mapping_color" in options){
            var mapping_color = options["mapping_color"]
            set_color_mapping(mapping_color)
        }

        if("mapping_feature" in options){
            var mapping_feature = options["mapping_feature"]
            setTimeout(function() {
                console.log(mapping_feature)
                set_mapping_feature(mapping_feature)
            }, 8000);
        }

        if("explode_partitions" in options){
            var explode_partitions = options["explode_partitions"]
            var explode_dimension = options["explode_dimension"]
            setTimeout(function() {
                console.log("Exploding")
                g_workspace._scene3d._model_exploding.dimension = explode_dimension
                g_workspace._scene3d._model_exploding.num_partitions = explode_partitions
            }, 10000);
        }

        if("slice_separation" in options){
            var slice_separation = options["slice_separation"]
            setTimeout(function() {
                console.log("Separating")
                set_separation(slice_separation)
            }, 12000);
        }

        if("slice_offset" in options){
            var slice_offset = options["slice_offset"]
            setTimeout(function() {
                console.log("Offsetting")
                set_slice_offset(slice_offset)
            }, 14000);
        }


    }
}

var KEYBOARD_SHORTCUTS = {
    'U+004F': chooseFilesToOpen, // Ctrl + O
    'U+0046': function() { // Ctrl + F
        g_mapSelector.activate();
    },
    'U+0053': function() { // Ctrl + S
        var name = g_workspace.mapName || 'image';
        g_views.export().then(function(blob) {
            saveAs(blob, name + '.png');
        });
    },
    'Up': function() {
        g_mapSelector.blink();
        g_mapSelector.navigate(MapSelector.Direction.UP);
    },
    'Down': function() {
        g_mapSelector.blink();
        g_mapSelector.navigate(MapSelector.Direction.DOWN);
    },
};

function onKeyDown(event) {
    if ((/^Mac/i).test(navigator.platform)) {
        if (event.ctrlKey || event.altKey || !event.metaKey) return;
    } else {
        if (!event.ctrlKey || event.altKey || event.metaKey) return;
    }

    if (event.keyIdentifier in KEYBOARD_SHORTCUTS) {
        var handler = KEYBOARD_SHORTCUTS[event.keyIdentifier];
        handler();
        event.stopPropagation();
        event.preventDefault();
    }
}

function onWorkspaceStatusChange() {
    if (g_workspace.status) {
        $('#status').text(g_workspace.status);
        $('#status').prop('hidden', false);
    } else {
        $('#status').prop('hidden', true);
    }
}

function onWorkspaceErrorsChange() {
    var dialog = document.querySelector('dialog#errors');
    var list = dialog.querySelector('ul');
    list.textContent = '';
    g_workspace.errors.forEach(function(error) {
        var item = document.createElement('li');
        item.textContent = error;
        list.appendChild(item);
    });
    if (g_workspace.errors.length == 0) {
        dialog.close();
        dialog.hidden = true;
    } else {
        dialog.hidden = false;
        if (!dialog.open) dialog.showModal();
    }
}

function clearErrors() {
    g_workspace.clearErrors();
}

/*
 * Initializing DAT.GUI (http://workshop.chromeexperiments.com/examples/gui) controls.
 */
function initGUI() {
    g_gui = new dat.GUI();


    var f2d = g_gui.addFolder('2D');
    f2d.add(g_workspace.scene2d, 'spotBorder', 0, 1).name('Spot border').step(0.01);

    var f3d = g_gui.addFolder('3D');
    f3d.add(g_views.g3d, 'layout', {
        'Single view': ViewGroup3D.Layout.SINGLE,
        'Double view': ViewGroup3D.Layout.DOUBLE,
        'Triple view': ViewGroup3D.Layout.TRIPLE,
        'Quadriple view': ViewGroup3D.Layout.QUADRIPLE,
    }).name('Layout');
    f3d.addColor(g_workspace.scene3d, 'color').name('Color');
    f3d.addColor(g_workspace.scene3d, 'backgroundColor').name('Background');
    f3d.add(g_workspace.scene3d.frontLight, 'intensity', 0, 3).name('Light');
    f3d.add(g_workspace.scene3d, 'model_transparency', 0, 1.0).name('Opacity').step(0.1);
    f3d.add(g_workspace.scene3d, 'spotBorder', 0, 1).name('Spot border').step(0.01);
    f3d.add(g_views, 'exportPixelRatio3d', [0.5, 1.0, 2.0, 4.0]).name('Export pixel ratio');
    var adjustment = f3d.addFolder('Adjustment');
    adjustment.add(g_workspace.scene3d.adjustment, 'alpha', -180.0, 180.0).name('0X rotation').step(1);
    adjustment.add(g_workspace.scene3d.adjustment, 'beta', -180.0, 180.0).name('0Y rotation').step(1);
    adjustment.add(g_workspace.scene3d.adjustment, 'gamma', -180.0, 180.0).name('0Z rotation').step(1);
    adjustment.add(g_workspace.scene3d.adjustment, 'x').name('X offset').step(0.1);
    adjustment.add(g_workspace.scene3d.adjustment, 'y').name('Y offset').step(0.1);
    adjustment.add(g_workspace.scene3d.adjustment, 'z').name('Z offset').step(0.1);

    //Model Cutting submenu for 3D
    var model_slicing = f3d.addFolder('Slicing');
    model_slicing.add(g_workspace.scene3d.model_slicing, 'xmin', -100.0, 100.0).name('xmin').step(1);
    model_slicing.add(g_workspace.scene3d.model_slicing, 'xmax', -100.0, 100.0).name('xmax').step(1);
    model_slicing.add(g_workspace.scene3d.model_slicing, 'ymin', -100.0, 100.0).name('ymin').step(1);
    model_slicing.add(g_workspace.scene3d.model_slicing, 'ymax', -100.0, 100.0).name('ymax').step(1);
    model_slicing.add(g_workspace.scene3d.model_slicing, 'zmin', -100.0, 100.0).name('zmin').step(1);
    model_slicing.add(g_workspace.scene3d.model_slicing, 'zmax', -100.0, 100.0).name('zmax').step(1);

    var model_slicing_real_coordinates = f3d.addFolder('Slicing Coordinates Display');
    model_slicing_real_coordinates.add(g_workspace.scene3d._model_slicing_real_coordinates, 'xmin')
    model_slicing_real_coordinates.add(g_workspace.scene3d._model_slicing_real_coordinates, 'xmax')
    model_slicing_real_coordinates.add(g_workspace.scene3d._model_slicing_real_coordinates, 'ymin')
    model_slicing_real_coordinates.add(g_workspace.scene3d._model_slicing_real_coordinates, 'ymax')
    model_slicing_real_coordinates.add(g_workspace.scene3d._model_slicing_real_coordinates, 'zmin')
    model_slicing_real_coordinates.add(g_workspace.scene3d._model_slicing_real_coordinates, 'zmax')

    //Model Expanding View for 3D
    var model_exploding = f3d.addFolder('1D Exploding');
    model_exploding.add(g_workspace.scene3d.model_exploding, 'dimension', ["x", "y", "z"]).name('dimension');
    model_exploding.add(g_workspace.scene3d.model_exploding, 'do_explode').name('do_explode');
    model_exploding.add(g_workspace.scene3d.model_exploding, 'num_partitions', 4, 25).name('num_partitions').step(1);
    model_exploding.add(g_workspace.scene3d.model_exploding, 'slice_separation', 0.00, 1.0).name('slice_separation').step(0.001);
    model_exploding.add(g_workspace.scene3d.model_exploding, 'offset_dimension', ["x", "y", "z"]).name('offset_dimension');
    model_exploding.add(g_workspace.scene3d.model_exploding, 'slice_offset', 0.00, 1.0).name('slice_offset').step(0.05);


    //Model Export Button
    var model_exports = f3d.addFolder('Model Exports');
    model_exports.add(g_workspace.scene3d,'model_export_name').name("Export Name");
    model_exports.add(g_workspace.scene3d.model_export,'download').name("Export STL");




    var fMapping = g_gui.addFolder('Mapping');
    fMapping.add(g_workspace, 'scaleId', {'Linear': Workspace.Scale.LINEAR.id, 'Logarithmic': Workspace.Scale.LOG.id}).name('Scale');
    fMapping.add(g_workspace, 'hotspotQuantile').name('Hotspot quantile').step(0.0001);
    var colorMaps = Object.keys(ColorMap.Maps).reduce(function(m, k) {
        m[ColorMap.Maps[k].name] = k;
        return m;
    }, {});
    fMapping.add(g_workspace, 'colorMapId', colorMaps).name('Color map');

    var mapping = {
        flag: fMapping.add(g_workspace, 'autoMinMax').name('Auto MinMax'),
        min: fMapping.add(g_workspace, 'minValue').name('Min value').step(0.00001),
        max: fMapping.add(g_workspace, 'maxValue').name('Max value').step(0.00001),
    };
    g_workspace.addEventListener(Workspace.Events.AUTO_MAPPING_CHANGE,
                                 onAutoMappingChange.bind(null, mapping));
    onAutoMappingChange(mapping);

    g_workspace.addEventListener(Workspace.Events.MODE_CHANGE, function() {
        f2d.closed = (g_workspace.mode != Workspace.Mode.MODE_2D);
        f3d.closed = (g_workspace.mode != Workspace.Mode.MODE_3D);
    });
}

function updateGUIDisplay(root_object){
    if(root_object == null){
        updateGUIDisplay(g_gui)
        return;
    }

    for (var i in root_object.__controllers) {
        root_object.__controllers[i].updateDisplay();
    }

    for(var i in root_object.__folders){
        if(i != null){
            updateGUIDisplay(root_object.__folders[i])
        }
    }
}

function onAutoMappingChange(mapping) {
    var disabled = g_workspace.autoMinMax ? '' : null;
    $(mapping.min.domElement).find('input').attr('disabled', disabled);
    $(mapping.max.domElement).find('input').attr('disabled', disabled);
    if (g_workspace.autoMinMax) {
        mapping.min.updateDisplay();
        mapping.max.updateDisplay();
    }
}

/**
 * Implementation of dropping files via system's D&D.'
 */
var DragAndDrop = {
    _counter: 0,

    dragenter: function(e) {
        e.preventDefault();
        if (++DragAndDrop._counter == 1)
            $('body').attr('drop-target', '');
    },

    dragleave: function(e) {
        e.preventDefault();
        if (--DragAndDrop._counter === 0)
            $('body').removeAttr('drop-target');
    },

    dragover: function(e) {
        e.preventDefault();
    },

    drop: function(e) {
        DragAndDrop._counter = 0;
        $('body').removeAttr('drop-target');

        e.preventDefault();
        e.stopPropagation();

        openFiles(e.dataTransfer.files);
    }
};

function openFiles(files) {
    var handlers = findFileHandlers(files);
    for (var i = 0; i < handlers.length; i++) {
        handlers[i]();
    }
};

function findFileHandlers(files) {
    var result = [];
    for (var i = 0; i < files.length; i++) {
        var file = files[i];

        if ((/\.png$/i.test(file.name))) {
            result.push(g_workspace.loadImage.bind(g_workspace, file));
        } else if (/\.stl$/i.test(file.name)) {
            result.push(g_workspace.loadMesh.bind(g_workspace, file));
        } else if (/\.csv$/i.test(file.name)) {
            result.push(g_workspace.loadIntensities.bind(g_workspace, file));
        }
    }
    return result;
}

/**
 * Shows file open dialog.
 */
function chooseFilesToOpen() {
    var fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = true;
    fileInput.addEventListener('change', function() {
        openFiles(fileInput.files);
    });
    fileInput.click();
}

$(init);
