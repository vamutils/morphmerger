const fs = require("fs"),
path = require("path"),
recursive = require("recursive-readdir"),
promisify = require("util").promisify,
argv = require('minimist')(process.argv.slice(2));

const usage = ()=>{
	console.log([
		"",
		"This OPTIONAL script will parse a UABE .txt dump of the MonoBehaviour entries in '[vaminstallpath]\\VAM_Data\\StreamingAssets\\f_mb'",
		"The parsed results are stored in individual .json files containing the necessary vertex and formula information needed in order to use Standard VAM morphs",
		"If you opt not to use these .json files, the morph merger program will ignore Standard Morphs and not merge them, leaving the Standard morph values in the new Look file",
		"",
		"NOTE: The output .json files are for optional personal use ONLY.  Do NOT redistribute these .json files.",
		"",
		"Usage: node extractMorphs.js [options]",
		"",
		"Options:",
		" --dumpfolder DUMPFOLDER\t Required, specifies the folder containing Unity Assets Bundle Extractor .txt Dump Files",
		" --outputfolder OUTPUTFOLDER\t Required, specifies output JSON folder.",
		"",
		"You can download Unity Assets Bundle Extractor here: https://github.com/DerPopo/UABE/releases",
		""
		].join("\r\n"));
}

if(!argv.dumpfolder || !argv.outputfolder){
	usage();
	return 1;
}

const ignore = (file, stats)=>{
	if(stats.isDirectory()) return false;
	var ext = path.extname(file);
	if(ext.toLowerCase() == ".txt"){
		return false;
	}else{
		return true;
	}
}
var modifiers = {}, categories = {}, targetTypeHash = {};

// First read all morphs to get file paths
recursive(argv.dumpfolder, [ignore]).then(files=>{
	var promises = [];
	for(file of files){
		let filename = file;
		// console.log(file);
		// Add to huge promise
		promises.push(promisify(fs.readFile)(file).then((data)=>{
			var genetalia = false;
			var lines = data.toString().split("\r\n");
			var size = lines[12].split(" = ")[1];
			var index = 0;
			var morphBank = [];
			var offset = 13;
			"   [0]"
			while(index < size){
				/*
				
				Header stuff
				
				 1 UInt8 visible = 1
				 1 UInt8 preserveValueOnReimport = 0
				 1 UInt8 disable = 0
				 1 UInt8 isPoseControl = 0
				 1 string morphName = "SR Tracey Body"
				 1 string displayName = "SR Tracey Body"
				 1 string overrideName = ""
				 1 string region = "Actor"
				 1 string group = "Full Body/Real World"
				 0 float importValue = 0
				 0 float startValue = 0
				 0 float _morphValue = 0
				 0 float appliedValue = 0
				 0 float min = 0
				 0 float max = 1
				 0 int numDeltas = 14584
				 1 UInt8 triggerNormalRecalc = 1
				 1 UInt8 triggerTangentRecalc = 1
				 0 DAZMorphVertex deltas
				 
				 */
				var formulaOffset = offset + (parseInt(lines[offset + 17].split(" = ")[1] * 7)) + 25;
				var newMorph = {
					morphName : lines[offset + 6].match(/"(.*?)"/)[1],
					displayName : lines[offset + 7].match(/"(.*?)"/)[1],
					overrideName : lines[offset + 8].match(/"(.*?)"/)[1],
					region : lines[offset + 9].match(/"(.*?)"/)[1],
					group : lines[offset + 10].match(/"(.*?)"/)[1],
					importValue : lines[offset + 11].split(" = ")[1],
					startValue : lines[offset + 12].split(" = ")[1],
					_morphValue : lines[offset + 13].split(" = ")[1],
					appliedValue : lines[offset + 14].split(" = ")[1],
					min : lines[offset + 15].split(" = ")[1],
					max : lines[offset + 16].split(" = ")[1],
					numDeltas : parseInt(lines[offset + 17].split(" = ")[1]),
					numFormulas : parseInt(lines[formulaOffset].split(" = ")[1]),
					deltas : [],
					formulas : []
				};
				// Grab Vertices
				for(var j=0;j<newMorph.numDeltas;j++){
					newMorph.deltas.push({
						index : parseInt(lines[offset + (j*7) + 25].split(" = ")[1]),
						x : -1 * (parseFloat(lines[offset + (j*7) + 27].split(" = ")[1]) * 100),
						y : parseFloat(lines[offset + (j*7) + 28].split(" = ")[1]) * 100,
						z : parseFloat(lines[offset + (j*7) + 29].split(" = ")[1]) * 100
					});
				};
				// Grab Formulas
				for(var j=0;j<newMorph.numFormulas;j++){
					var targetType = parseInt(lines[formulaOffset + (j*5) + 3].split(" = ")[1]);
					newMorph.formulas.push({
						targetType : targetType,
						target : lines[formulaOffset + (j*5) + 4].match(/"(.*?)"/)[1],
						multiplier : parseFloat(lines[formulaOffset + (j*5) + 5].split(" = ")[1])
					});
					targetTypeHash[targetType] = targetTypeHash[targetType] || {
						morphs : []
					};
					targetTypeHash[targetType].morphs.push(newMorph);
				};
				/*
				
				Footer stuff 
				
				 1 UInt8 _animatable = 0
				 1 UInt8 isTransient = 0
				 1 UInt8 isRuntime = 0
				 1 string loadPath = ""
				 1 string metaJSONFile = ""
				 1 UInt8 deltasLoaded = 0
				 1 string deltasJSONFile = ""
				 
				1 UInt8 simpleView = 0
				1 UInt8 useOverrideRegionName = 1
				1 string overrideRegionName = "Genitalia"
				 */
				// console.log(newMorph);
				morphBank.push(newMorph);
				 // Punch through until next morph found. Lazy, I know...
				for(var i=offset;i<lines.length;i++){
					if(lines[i] == "   [" + (index + 1) + "]" || i==lines.length-1){
						index++;
						offset = i;
						i=lines.length;
						break;
					}else{
						 if(lines[i].split("overrideRegionName = ").length>0){
							if(lines[i].split("overrideRegionName = ")[1] == "\"Genitalia\"") genetalia = true;
						 }
					}
				}
			}
			// Don't extract genetalia morphs.  They are on a graft/different set of vertices not in the scope of this exercise.
			if(genetalia == true) morphBank = [];
			return {
				filename : filename,
				morphs : morphBank
			};
			
		}));
	}
	var writePromises = [];
	Promise.all(promises).then(data=>{
		for(item of data){
			// console.log(item.filename);
			for(morph of item.morphs){
				console.log(morph.displayName + " (" + morph.overrideName + ") " + morph.deltas.length + " vertices, " + morph.formulas.length + " formulas");
				let morphData = JSON.stringify(morph,null,"\t");
				let filename = argv.outputfolder + "\\" + morph.displayName.replace(/\./g,"_") + ".json";
				writePromises.push(promisify(fs.writeFile)(filename, morphData).then(()=>{
					console.log(filename + " saved.");
				}));
			}
		}
	}).then(()=>{
		Promise.all(writePromises).then(()=>{
			console.log("Extraction complete.");
			/*
			Curious on count of targetTypes....  Just for research.  16 types are used.  Only know what values 0 - 6 are truly for currently.
			for(target in targetTypeHash){
				console.log(target + " - " + targetTypeHash[target].morphs.length);
			}
			*/
		});
	});
});

