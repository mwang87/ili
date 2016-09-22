//Setting up the other parameters
g_workspace._scene3d._model_exploding.num_partitions = 9
g_workspace._scene3d._model_exploding.dimension = 'z'

//Setup View of Model
set_pixel_ratio(1)
set_positioning_of_model(870, -1400, -881)
set_rotation_of_model(-99, -6, -51)
set_color_scaling("log")
set_color_mapping("JET")
set_mapping_feature("518.171 292 1")

//Doing the actual separations now
set_separation(0)
set_slice_offset(0)
recursive_set_separation("animation", 0, 0, 0.002, 0.10, 2000)()
recursive_slice_offset("animation", 50, 0, 0.005, 0.3, 2000)()

max_number = 119

number_string = "000000000" + max_number;
output_filename = "animation_" + number_string.substr(number_string.length-3)
max_number--
feature_function = get_set_mapping_and_capture_function("332.141 209 1", output_filename, function(){alert("DONE")} )
number_string = "000000000" + max_number;
output_filename = "animation_" + number_string.substr(number_string.length-3)
max_number--
feature_function = get_set_mapping_and_capture_function("547.106 176 1", output_filename,  feature_function)
number_string = "000000000" + max_number;
output_filename = "animation_" + number_string.substr(number_string.length-3)
max_number--
feature_function = get_set_mapping_and_capture_function("518.171 292 1", output_filename,  feature_function)
number_string = "000000000" + max_number;
output_filename = "animation_" + number_string.substr(number_string.length-3)
max_number--
feature_function = get_set_mapping_and_capture_function("540.152 292 1", output_filename,  feature_function)
number_string = "000000000" + max_number;
output_filename = "animation_" + number_string.substr(number_string.length-3)
max_number--
feature_function = get_set_mapping_and_capture_function("490.139 266 1", output_filename,  feature_function)
number_string = "000000000" + max_number;
output_filename = "animation_" + number_string.substr(number_string.length-3)
max_number--
feature_function = get_set_mapping_and_capture_function("536.197 292 1", output_filename,  feature_function)
number_string = "000000000" + max_number;
output_filename = "animation_" + number_string.substr(number_string.length-3)
max_number--
feature_function = get_set_mapping_and_capture_function("749.518 247 1", output_filename,  feature_function)
number_string = "000000000" + max_number;
output_filename = "animation_" + number_string.substr(number_string.length-3)
max_number--
feature_function = get_set_mapping_and_capture_function("591.423 193 1", output_filename,  feature_function)
number_string = "000000000" + max_number;
output_filename = "animation_" + number_string.substr(number_string.length-3)
max_number--
feature_function = get_set_mapping_and_capture_function("368.253 247 2", output_filename,  feature_function)
number_string = "000000000" + max_number;
output_filename = "animation_" + number_string.substr(number_string.length-3)
max_number--
feature_function = get_set_mapping_and_capture_function("382.269 265 1", output_filename,  feature_function)
feature_function()
