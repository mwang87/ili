//Pringint the screen
capture_screen = function(name){
	g_views.export().then(function(blob) {
		saveAs(blob, name + '.png');
	});
}


set_positioning_of_model = function(x,y,z){
	g_workspace._scene3d.adjustment.x = x
	g_workspace._scene3d.adjustment.y = y
	g_workspace._scene3d.adjustment.z = z
}

set_rotation_of_model = function(x,y,z){
	g_workspace._scene3d.adjustment.alpha = x
	g_workspace._scene3d.adjustment.beta = y
	g_workspace._scene3d.adjustment.gamma = z
}

set_separation = function(value){
	g_workspace._scene3d._model_exploding.slice_separation = value
	g_workspace._scene3d.model_exploding.do_explode = true
}

set_opacity = function(value){
	g_workspace._scene3d.model_transparency = value
}


set_slice_offset = function(value){
	g_workspace._scene3d._model_exploding.slice_offset = value
	g_workspace._scene3d.model_exploding.do_explode = true
}

set_color_scaling = function(value){
	g_workspace.scaleId = value
}

set_color_mapping = function(value){
	g_workspace.colorMapId = value
}

set_mapping_feature = function(value){
	g_mapSelector._updateSelectedText = value
}

get_set_mapping_and_capture_function = function(value, output_filename, follow_up_function){
	return function(){
		set_mapping_feature(value)
		capture_screen(output_filename)
		setTimeout(follow_up_function, 2000)
	}
}

set_pixel_ratio = function(value){
	g_views._exportPixelRatio3d = value
}

recursive_set_opacity = function(base_filename, current_index, opacity, increments, min_opacity, waits){
	return function(){
		if(opacity < min_opacity){
			return
		}
		else{
			set_opacity(opacity)
			number_string = "000000000" + current_index;
			output_filename = base_filename + "_" + number_string.substr(number_string.length-3)
			capture_screen(output_filename)
			setTimeout(recursive_set_opacity(base_filename, current_index + 1, opacity - increments, increments, min_opacity, waits), waits);
		}
	}
}

recursive_set_separation = function(base_filename, current_index, separation, increments, max_separation, waits){
	return function(){
		if(separation > max_separation){
			return
		}
		else{
			set_separation(separation)
			number_string = "000000000" + current_index;
			output_filename = base_filename + "_" + number_string.substr(number_string.length-3)
			capture_screen(output_filename)
			setTimeout(recursive_set_separation(base_filename, current_index + 1, separation + increments, increments, max_separation, waits), waits);
		}
	}
}

recursive_slice_offset = function(base_filename, current_index, start_offset, increments, max_offset, waits){
	return function(){
		if(start_offset > max_offset){
			return
		}
		else{
			set_slice_offset(start_offset)
			number_string = "000000000" + current_index;
			output_filename = base_filename + "_" + number_string.substr(number_string.length-3)
			capture_screen(output_filename)
			setTimeout(recursive_slice_offset(base_filename, current_index + 1, start_offset + increments, increments, max_offset, waits), waits);
		}
	}
}

//Setting up the other parameters
g_workspace._scene3d._model_exploding.num_partitions = 9
g_workspace._scene3d._model_exploding.dimension = 'z'

//Setup View of Model
set_pixel_ratio(1)
set_positioning_of_model(870, -1400, -881)
set_rotation_of_model(-99, -6, -51)
set_color_scaling("log")
set_color_mapping("JET")
set_mapping_feature("103.054 30 1")

//Doing the actual separations now
set_separation(0)
set_slice_offset(0)
recursive_set_separation("animation", 0, 0, 0.002, 0.10, 2000)()
recursive_slice_offset("animation", 50, 0, 0.01, 0.3, 2000)()
