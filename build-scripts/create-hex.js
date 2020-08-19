const fs = require("fs");
const turf = require("@turf/turf");
const chalk = require("chalk");

fs.readFile(__dirname + "/../data/wells.json", "utf8", (err, data) => {
    if (err) throw err;

    // parse the incoming GeoJSON text
    const oil = JSON.parse(data);

    let wellData = fs.readFileSync(__dirname + "/../data/spilled_wells.json", "utf8", (err, data) => {
        if (err) throw err;
        const well = JSON.parse(data);
        return well;
    })

    wellData = JSON.parse(wellData);
    createHexGrid(oil, wellData);
});

function createHexGrid(oil, wellData) {
    // note that we could use turf to get a bounding box of our points, but this includes points all over the globe (US territories, etc.)
    // const bbox = turf.bbox(churches)

    // Bounding box for Colorado
    // [ minX, minY, maxX, maxY ]
    const bbox = [-109.060253, 36.992426, -102.041524, 41.003444];

    // define our cell Diameter
    const cellSide = 0.2;
    // define units
    const options = {
        units: "degrees"
    };
    // create the hex polygons
    let hexgrid = turf.hexGrid(bbox, cellSide, options);

    sumPoints(oil, wellData, hexgrid);
}

function sumPoints(oil, wellData, hexgrid) {
    // option for turf.booleanPointInPolygon()
    // and other variables don't
    // need redefined with each loop
    const options = {
        ignoreBoundary: true
    };

    let count;
    let wellCount;

    // // loop through each hex in hexgrid
    turf.featureEach(hexgrid, (hex, i) => {
        // reset counter to zero for each hex
        count = 0;
        wellCount = 0;

        // loop through each point point in oil
        turf.featureEach(oil, point => {
            // if the point is inside the hex
            if (turf.booleanPointInPolygon(point, hex, options)) {
                count++; // increment by one
            }
        });

        // loop through each point point in wells
        turf.featureEach(wellData, point => {
            // if the point is inside the hex
            if (turf.booleanPointInPolygon(point, hex, options)) {
                wellCount++; // increment by one
            }
        });

        if (count > 0) {
            // output progress
            console.log(chalk.green("adding count of " + count + " to hex #: " + i));
        }
        if (wellCount > 0) {
            // output progress
            console.log(chalk.green("adding count of wells " + wellCount + " to hex #: " + i));
        }

        // update hex properties with count
        hex.properties = Object.assign({}, hex.properties, {
            count: count,
            wellCount: wellCount
        });
    });

    console.log(chalk.blue("ready to write the hexgrid to file"));

    // truncate the coordinate precision to reduce file size
    hexgrid = turf.truncate(hexgrid, {
        precision: 5
    });

    writeHexGrid(hexgrid);
}

function writeHexGrid(hexgrid) {
    // stringify the hexgrid and write to file
    fs.writeFile(
        __dirname + "/../data/us-hexgrid-spilled-oil-well.json",
        JSON.stringify(hexgrid),
        "utf-8",
        err => {
            if (err) throw err;
            console.log(chalk.green("done writing file!"));
        }
    );
}