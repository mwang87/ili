// Written by Paul Kaplan
// Updated by Mingxun Wang

var BinaryStlWriter = (function() {
    var that = {};

    var writeVector = function(dataview, offset, vector, isLittleEndian) {
        offset = writeFloat(dataview, offset, vector.x, isLittleEndian);
        offset = writeFloat(dataview, offset, vector.y, isLittleEndian);
        return writeFloat(dataview, offset, vector.z, isLittleEndian);
    };

    var writeFloat = function(dataview, offset, float, isLittleEndian) {
        dataview.setFloat32(offset, float, isLittleEndian);
        return offset + 4;
    };

    var geometryToDataView = function(geometry) {
        normals = geometry.getAttribute('normal').array;
        positions = geometry.getAttribute('position').array;
        number_triangles = positions.length/9
        //var tris = geometry.faces;
        //var verts = geometry.vertices;

        var isLittleEndian = true; // STL files assume little endian, see wikipedia page

        var bufferSize = 84 + (50 * number_triangles);
        var buffer = new ArrayBuffer(bufferSize);
        var dv = new DataView(buffer);
        var offset = 0;

        offset += 80; // Header is empty

        dv.setUint32(offset, number_triangles, isLittleEndian);
        offset += 4;

        for(var n = 0; n < number_triangles; n++) {
            base = n*9;

            x_idx = base
            y_idx = base + 1
            z_idx = base + 2

            offset = writeFloat(dv, offset, normals[x_idx], isLittleEndian);
            offset = writeFloat(dv, offset, normals[y_idx], isLittleEndian);
            offset = writeFloat(dv, offset, normals[z_idx], isLittleEndian);

            for(j = 0; j < 3; j++){
                x_idx = base + j * 3
                y_idx = base + j * 3 + 1
                z_idx = base + j * 3 + 2

                offset = writeFloat(dv, offset, positions[x_idx], isLittleEndian);
                offset = writeFloat(dv, offset, positions[y_idx], isLittleEndian);
                offset = writeFloat(dv, offset, positions[z_idx], isLittleEndian);
            }
            offset += 2; // unused 'attribute byte count' is a Uint16
        }

        return dv;
    };

    var save = function(geometry, filename) {
        var dv = geometryToDataView(geometry);
        var blob = new Blob([dv], {type: 'application/octet-binary'});

        // FileSaver.js defines `saveAs` for saving files out of the browser
        saveAs(blob, filename);
    };

    that.save = save;
    return that;
}());
