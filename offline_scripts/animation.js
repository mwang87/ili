//Pringint the screen
capture_screen = function(name){
	g_views.export().then(function(blob) {
		saveAs(blob, name + '.png');
	});
}



set_separation = function(value){
	g_workspace._scene3d._model_exploding.slice_separation = value
	g_workspace._scene3d.model_exploding.do_explode = true
}



recursive_set_separation = function(base_filename, current_index, separation, increments, max_separation, waits){
	return function(){
		if(separation > max_separation){
			return
		}
		else{
			console.log(separation)
			set_separation(separation)
			number_string = "000000000" + current_index;
			output_filename = base_filename + "_" + number_string.substr(number_string.length-3)
			console.log(output_filename)
			capture_screen(output_filename)
			setTimeout(recursive_set_separation(base_filename, current_index + 1, separation + increments, increments, max_separation, waits), waits);
		}
	}
}

//Setting up the other parameters
g_workspace._scene3d._model_exploding.num_partitions = 9
g_workspace._scene3d._model_exploding.dimension = 'z'

//Doing the actual separations now
recursive_set_separation("animation", 0, 0, 0.005, 0.15, 1000)()


