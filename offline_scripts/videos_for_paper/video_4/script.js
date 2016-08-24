//Setting up the other parameters
g_workspace._scene3d._model_exploding.num_partitions = 9
g_workspace._scene3d._model_exploding.dimension = 'z'

//Setup View of Model
set_pixel_ratio(1)
set_positioning_of_model(870, -1400, -881)
set_rotation_of_model(-99, -6, -51)
set_color_scaling("log")
set_color_mapping("JET")
set_mapping_feature("272.201 420 1")

//Doing the actual separations now
set_separation(0)
set_slice_offset(0)
recursive_set_separation("animation", 0, 0, 0.002, 0.10, 2000)()
recursive_slice_offset("animation", 50, 0, 0.005, 0.3, 2000)()

max_number = 124


number_string = "000000000" + max_number;
output_filename = "animation_" + number_string.substr(number_string.length-3)
max_number--
feature_function = get_set_mapping_and_capture_function("328.264 537 1", output_filename, function(){alert("DONE")} )
number_string = "000000000" + max_number;
output_filename = "animation_" + number_string.substr(number_string.length-3)
max_number--
feature_function = get_set_mapping_and_capture_function("326.248 497 1", output_filename,  feature_function)
number_string = "000000000" + max_number;
output_filename = "animation_" + number_string.substr(number_string.length-3)
max_number--
feature_function = get_set_mapping_and_capture_function("316.227 478 1", output_filename,  feature_function)
number_string = "000000000" + max_number;
output_filename = "animation_" + number_string.substr(number_string.length-3)
max_number--
feature_function = get_set_mapping_and_capture_function("312.233 472 1", output_filename,  feature_function)
number_string = "000000000" + max_number;
output_filename = "animation_" + number_string.substr(number_string.length-3)
max_number--
feature_function = get_set_mapping_and_capture_function("286.181 410 1", output_filename,  feature_function)
number_string = "000000000" + max_number;
output_filename = "animation_" + number_string.substr(number_string.length-3)
max_number--
feature_function = get_set_mapping_and_capture_function("284.201 421 1", output_filename,  feature_function)
number_string = "000000000" + max_number;
output_filename = "animation_" + number_string.substr(number_string.length-3)
max_number--
feature_function = get_set_mapping_and_capture_function("258.186 392 1", output_filename,  feature_function)
number_string = "000000000" + max_number;
output_filename = "animation_" + number_string.substr(number_string.length-3)
max_number--
feature_function = get_set_mapping_and_capture_function("242.154 360 1", output_filename,  feature_function)
number_string = "000000000" + max_number;
output_filename = "animation_" + number_string.substr(number_string.length-3)
max_number--
feature_function = get_set_mapping_and_capture_function("298.216 444 1", output_filename,  feature_function)
number_string = "000000000" + max_number;
output_filename = "animation_" + number_string.substr(number_string.length-3)
max_number--
feature_function = get_set_mapping_and_capture_function("268.170 404 1", output_filename,  feature_function)
number_string = "000000000" + max_number;
output_filename = "animation_" + number_string.substr(number_string.length-3)
max_number--
feature_function = get_set_mapping_and_capture_function("288.196 423 1", output_filename,  feature_function)
number_string = "000000000" + max_number;
output_filename = "animation_" + number_string.substr(number_string.length-3)
max_number--
feature_function = get_set_mapping_and_capture_function("242.154 360 1", output_filename,  feature_function)
number_string = "000000000" + max_number;
output_filename = "animation_" + number_string.substr(number_string.length-3)
max_number--
feature_function = get_set_mapping_and_capture_function("300.232 478 1", output_filename,  feature_function)
number_string = "000000000" + max_number;
output_filename = "animation_" + number_string.substr(number_string.length-3)
max_number--
feature_function = get_set_mapping_and_capture_function("244.170 361 1", output_filename,  feature_function)
number_string = "000000000" + max_number;
output_filename = "animation_" + number_string.substr(number_string.length-3)
max_number--
feature_function = get_set_mapping_and_capture_function("270.185 419 1", output_filename,  feature_function)
feature_function()
