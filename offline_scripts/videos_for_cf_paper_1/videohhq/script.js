//Initially setup positioning
set_pixel_ratio(2)
set_positioning_of_model(870, -1400, -881)
set_rotation_of_model(-99, -6, -51)

recursive_set_opacity("animation", 0, 1.0, 0.015, 0.10, 2000)()

//Setting up the other parameters
g_workspace._scene3d._model_exploding.num_partitions = 9
g_workspace._scene3d._model_exploding.dimension = 'z'

//Setup View of Model
set_color_scaling("log")
set_color_mapping("JET")
set_mapping_feature("244.168 465 1")

//Doing the actual separations now
set_separation(0)
set_slice_offset(0)
set_pixel_ratio(1)
recursive_set_separation("animation", 60, 0, 0.002, 0.10, 2000)()

set_separation(0.10)
recursive_slice_offset("animation", 110, 0, 0.005, 0.3, 2000)()
