const fs = require("fs");
const csv = require("csvtojson");
const chalk = require("chalk");
const gjv = require("geojson-validation");

const inFilePath = __dirname + "/../project-files/Spills.csv";
const outFilePath = __dirname + "/../data/spilled_wells.json";

//set csv delimeter and then call the join function to join the geojson to the csv file
csv({
        delimiter: ","
    })
    .fromFile(inFilePath)
    .then(jsonObj => {
        jsonJoin(jsonObj)
    });

//Joins the CSV to the geojson and creates a new geojson for the spills based on the well location.  Join on facility id
function jsonJoin(jsonObj) {
    let rawdata = fs.readFileSync('../data/wells.json');
    let wellData = JSON.parse(rawdata);

    // geojson structure for feature collection
    const geojson = {
        type: "FeatureCollection",
        features: []
    };

    //delcare variables
    let feature; 
    let featureCount = 0; 

    //loop through all objects in the json object
    jsonObj.forEach((obj) => {

        //loop through the features within the feature collection to build GeoJson based on the joined well locations
        for (let i = 0; i < wellData.features.length; i++) {
            if (obj.Facility_ID == wellData.features[i].properties.Facil_Id) {

                // build a GeoJSON feature for each
                // following the GeoJSON
                feature = {
                    type: "Feature",
                    geometry: {
                        type: "Point",
                        coordinates: [+wellData.features[i].geometry.coordinates[0], +wellData.features[i].geometry.coordinates[1]]
                    },
                    properties: {
                        FEATURE_NAME: wellData.features[i].properties.Operator
                    }
                };
                // push the feature into the features array
                geojson.features.push(feature);
                featureCount++;
                //added break to speed up if statement since it's looping through thousands of wells and spills combined. 
                break;
            }
        }



    })

    console.log(
        chalk.green(
            `${featureCount} "Spills" features filtered from CSV file`
        )
    );
    validateGeoJson(geojson);

}

function validateGeoJson(geojson) {
    // check to see if the GeoJSON is valid
    if (gjv.valid(geojson)) {
        console.log(chalk.green("this is valid GeoJSON!"));
        // ... update call to validate GeoJSON
        writeToFile(geojson);

    } else {
        console.log(chalk.red("Sorry, not valid GeoJSON."));
    }
}

function writeToFile(geojson) {
    // write output file
    fs.writeFile(outFilePath, JSON.stringify(geojson), "utf-8", err => {
        if (err) throw err;

        console.log(chalk.green("done writing file"));
    });
}