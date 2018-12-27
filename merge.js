const fs = require("fs"),
path = require("path"),
recursive = require("recursive-readdir"),
promisify = require("util").promisify,
argv = require('minimist')(process.argv.slice(2));

const usage = ()=>{
	console.log([
		"This script will read INPUTFILE Look and write out a merged morph representing all used Morphs in the Look file.",
		"The script will also write out a new Look file of the same name as the morph file, retaining any clothing, hair, and skin settings, as well as any Custom or Standard morphs that could not be read",
		"",
		"Usage: node merge.js [options]",
		"",
		"Options:",
		" --vambase VAMPATH\t Required, specifies base VAM path.",
		" --inputfile INPUTFILE\t Required, specifies input Look .json file to evaluate",
		" --outputmorph OUTPUTMORPH\t Required, specifies your output morph file name.",
		"    Do not leave use a file extension.  A.dsf Morph and starter .json Look will be created for you.",
		" --vammorphpath VAMMORPHPATH\t Optional, specified path to Standard VAM morph JSON extracts*",
		" --looksubfolder LOOKSUBFOLDER\t Optional, specifies subfolder name within '\Saves\Person\appearance' to place new Look containing merged morph",
		" --morphsubfolder MORPHSUBFOLDER\t Optional, specifies subfolder name within '\Import\morphs\female' to place your merged morph",
		" --author AUTHOR\t Optional, specifies your name, otherwise you are John Doe.",
		"",
		"*Note: See extractMorphs.js for details on extracting VAM Morph information.  DO NOT distribute extracted standard morphs.",
		"Note 2: This morph merger is not intended to work with Genetalia morphs, as they are on a different graft."
		""
		].join("\n"));
}

if(!argv.inputfile || !argv.outputmorph || !argv.vambase){
	usage();
	return 1;
}

var author = argv.author || "John Doe";

var deltas = [];
for(var i=0;i<21556;i++){
	// deltas[i] = [i,0,0,0];
	deltas.push([i,0,0,0]);
}
var newMorph = {
	"file_version" : "0.6.0.0",
	"asset_info" : {
		"id" : argv.outputmorph + ".dsf",
		"type" : "modifier",
		"contributor" : {
			"author" : author,
			"email" : "",
			"website" : ""
		},
		"revision" : "1.0",
		"modified" : "2015-05-12T03:34:21Z"
	},
	"modifier_library" : [
		{
			"id" : argv.outputmorph,
			"name" : argv.outputmorph,
			"parent" : "/data/DAZ%203D/Genesis%202/Female/Genesis2Female.dsf#GenesisFemale-1",
			"presentation" : {
				"type" : "Modifier/Shape",
				"label" : argv.outputmorph,
				"description" : "",
				"icon_large" : "",
				"colors" : [ [ 0.3529412, 0.3529412, 0.3529412 ], [ 1, 1, 1 ] ]
			},
			"channel" : {
				"id" : "value",
				"type" : "float",
				"name" : "Value",
				"label" : argv.outputmorph,
				"auto_follow" : true,
				"value" : 0,
				"min" : -1,
				"max" : 1,
				"clamped" : true,
				"display_as_percent" : true,
				"step_size" : 0.01
			},
			"region" : "!Morph Merger",
			"group" : "Morph Merger",
			"morph" : {
				"vertex_count" : 21556,
				"deltas" : {
					"count" : 21556,
					"values" : deltas
				}
			}
		}
	],
	"scene" : {
		"modifiers" : [
			{
				"id" : argv.outputmorph + "-1",
				"url" : "#" + argv.outputmorph
			}
		]
	}
};

let data = fs.readFileSync(argv.inputfile);
let look = JSON.parse(data);

const ignore = (file, stats)=>{
	if(stats.isDirectory()) return false;
	var ext = path.extname(file);
	if(ext.toLowerCase() == ".dsf"){
		return false;
	}else{
		return true;
	}
}

const ignore2 = (file, stats)=>{
	if(stats.isDirectory()) return false;
	var ext = path.extname(file);
	if(ext.toLowerCase() == ".json"){
		return false;
	}else{
		return true;
	}
}

var modifiers = {}, 
	vamModifiers = {},
	categories = {},
	promises = [],
	vamPromises = [];

/*
Standard Morphs (Optional)
*/
var vamMorphPromise = new Promise((resolve,reject)=>{
	if(argv.vammorphpath != undefined){
		recursive(argv.vammorphpath, [ignore2]).then(files=>{
			for(file of files){
				let filename = file;
				vamPromises.push(promisify(fs.readFile)(file).then(data=>{
					var morph = JSON.parse(data);
					var morphId = morph.overrideName || morph.displayName;
					if(modifiers[morphId]){
						// console.error("Duplicate morph found - " + morphId + "(" + filename + ").  Already found in " + modifiers[morphId].filename);
					}else{
						var deltas = [], formulas = [];
						morph.deltas.map(delta=>{
							deltas.push([delta.index, delta.x, delta.y, delta.z]);
						});
						morph.formulas.map(formula=>{
							/*
							Sample:
							{
								"output" : "neck:/data/DAZ%203D/Genesis%202/Female/Genesis2Female.dsf#neck?center_point/x",
								"operations" : [
									{ "op" : "push", "url" : "GenesisFemale:#Parisa?value" },
									{ "op" : "push", "val" : -5.412102e-05 },
									{ "op" : "mult" }
								]
							}
							*/

							var output = "";
							var value = formula.multiplier;
							// targetType seems to be any integer value from 0 to 16...  I used trial and error and comparison with raw morphs to derive most
							// My guess I think is pretty solid on 0... Shot in the dark on what 7, 11, 12, and 15 are however this seems to be an OK guess, too.
							if(formula.targetType == 0 || formula.targetType == 11 || formula.targetType == 12 || formula.targetType == 7 || formula.targetType == 15){
								output = formula.target + ":/data/DAZ%203D/Genesis%202/Female/Genesis2Female.dsf#" + formula.target + "?value"
							}
							// 100% sure 1 - 3 are for center_point
							if(formula.targetType == 1){
								//"neck:/data/DAZ%203D/Genesis%202/Female/Genesis2Female.dsf#neck?center_point/x"
								output = formula.target + ":/data/DAZ%203D/Genesis%202/Female/Genesis2Female.dsf#" + formula.target + "?center_point/x";
								value = value * 100;
							}
							if(formula.targetType == 2){
								output = formula.target + ":/data/DAZ%203D/Genesis%202/Female/Genesis2Female.dsf#" + formula.target + "?center_point/y"
								value = value * 100;
							}
							if(formula.targetType == 3){
								output = formula.target + ":/data/DAZ%203D/Genesis%202/Female/Genesis2Female.dsf#" + formula.target + "?center_point/z"
								value = value * 100;
							}
							// 100% sure that 4 - 6 are orientation
							if(formula.targetType == 4){
								output = formula.target + ":/data/DAZ%203D/Genesis%202/Female/Genesis2Female.dsf#" + formula.target + "?orientation/x"
								value = value * 100;
							}
							if(formula.targetType == 5){
								output = formula.target + ":/data/DAZ%203D/Genesis%202/Female/Genesis2Female.dsf#" + formula.target + "?orientation/y"
								value = value * 100;
							}
							if(formula.targetType == 6){
								output = formula.target + ":/data/DAZ%203D/Genesis%202/Female/Genesis2Female.dsf#" + formula.target + "?orientation/z"
								value = value * 100;
							}
							
							if(output!=""){
								formulas.push({
									output : output,
									operations : [
										{ op : "push", url : "GenesisFemale:#" + morphId + "?value" },
										{ op : "push", val : value },
										{ op : "mult" }
									]
								});
							}else{
								console.log("Unknown target type " + formula.targetType + " for morph " + morphId + " and target " + formula.target);
								// Unknown Target Type
							}
						});
						modifiers[morphId] = {
							filename : filename,
							type : "standard",
							modifier : morph,
							morph : {
								deltas : {
									values : deltas
								}
							},
							formulas : formulas
						}
					}
					// console.log(morph);
				}));
			}
			Promise.all(vamPromises).then(data=>{
				resolve(data);
			});
		});
	}else{
		resolve([]);
	}
});

/*
Custom Morphs
*/
var customMorphPromise = new Promise((resolve,reject)=>{
	recursive(argv.vambase + "/Import/Morphs", [ignore]).then(files=>{
		for(file of files){
			let filename = file;
			// Add to huge promise
			promises.push(promisify(fs.readFile)(file).then((data)=>{
				try{
					var morph = JSON.parse(data);
					if(morph.modifier_library){
						for(modifier of morph.modifier_library){
							var morphId = modifier.id;	// Default
							if(modifier.channel && modifier.channel.label) morphId = modifier.channel.label;
							if(modifiers[morphId]){
								console.error("Duplicate morph found - " + morphId + "(" + filename + ").  Already found in " + modifiers[morphId].filename);
							}else{
								// console.log("Morph loaded - " + morphId + "(" + filename + ")");
								modifiers[morphId] = {
									filename : filename,
									type : "custom",
									modifier : modifier,
									morph : modifier.morph,
									formulas : modifier.formulas
								}
								if(modifier.Region && !modifier.region) modifier.region = modifier.Region;
								if(modifier.region){
									categories[modifier.region] = categories[modifier.region] || {};
									categories[modifier.region][morphId] = modifiers[morphId];
								}else{
									categories[modifier.group] = categories[modifier.group] || {};
									categories[modifier.group][morphId] = modifiers[morphId];
								}
							}
							// console.log(morphId);
						}
					}else{
						throw("No modifiers in morph " + file);
					}
				}catch(e){
					console.error("Error parsing " + file);
				}
			})
			.catch(err=>{
				console.error(err);
			}));
		}
		Promise.all(promises).then(data=>{
			resolve(data);
		});
	});
});

// First read all morphs to get file paths
Promise.all([vamMorphPromise,customMorphPromise]).then(allData=>{
	var data = allData[0];
	var i = 0;
	for(modifier in modifiers){
		i++;
	}
	console.log(i + " morphs indexed.");
	// Category analysis left over from another script.  Not really important here.
	for(category in categories){
		// console.log(" - " + category);
		for(morph in categories[category]){
			// console.log(" |--" + morph + " (" + categories[category][morph].filename + ")");
		}
	}
	
	if(look.atoms){
		for(atom of look.atoms){
			if(atom.type == "Person"){
				console.log("Person found: '" + atom.id + "'");
				for(storable of atom.storables){
					if(storable.morphs){
						console.log("Found Morphs");
						var newMorphs = [];
						var newFormulas = {};
						for(morph of storable.morphs){
							if(!modifiers[morph.name]){
								newMorphs.push(morph);
								console.log("Morph '" + morph.name + "' not found in custom or standard morphs.  Not computing, and leaving reference in new Look file.");
							}else{
								if(morph.value != undefined){
									console.log("Custom Morph '" + morph.name + "' used with a value of " + morph.value + "...");
									if(modifiers[morph.name].morph){	// It IS possible to not have a morph section in a DSF modifier
										var morphDelta = modifiers[morph.name].morph.deltas.values;
										console.log("Applying " + modifiers[morph.name].morph.deltas.values.length + " vertex changes from " + morph.name);
										for(delta of morphDelta){
											var deltaDelta = [delta[0],delta[1] * morph.value, delta[2] * morph.value, delta[3] * morph.value];
											
											deltas[delta[0]][1]+=deltaDelta[1];
											deltas[delta[0]][2]+=deltaDelta[2];
											deltas[delta[0]][3]+=deltaDelta[3];
										}										
									}
									
									var morphFormulas = modifiers[morph.name].formulas;
									if(morphFormulas){
										for(formula of morphFormulas){
											var url = "";
											var value = 0.0;
											for(operation of formula.operations){
												if(operation.url) url = operation.url;
												if(operation.val !=undefined) value = (operation.val * morph.value);
											}
											var urlKey = url.split("?")[1];
											var formulaKey = formula.output + "|" + urlKey;
											var outputQuerystring = (formula.output + "?").split("?")[1];
											var pass = true;
											if(outputQuerystring == "value"){
												console.log("Checking '" + outputQuerystring + "'...");
												try{
													var mn = formula.output.split("#")[1].split("?")[0];
													if(modifiers[mn]){
														pass = false;
														console.log("Not applying value formula, as morph '" + mn + "' is already present in Look file.");
													}
												}catch(e){
													console.log(e);
													// fuck it
												}
											}
											if(pass){
												newFormulas[formulaKey] = newFormulas[formulaKey] || {
													"output" : formula.output,
													"operations" : [
														{ "op" : "push", "url" : "GenesisFemale:#" + argv.outputmorph + "?" + urlKey },
														{ "op" : "push", "val" : 0.0 },
														{ "op" : "mult" }
													]
												};
												for(operation of newFormulas[formulaKey].operations){
													if(operation.val !=undefined) {
														if(outputQuerystring == "center_point/y" || outputQuerystring == "orientation/y" ||
															outputQuerystring == "center_point/z" || outputQuerystring == "orientation/z" ||
															outputQuerystring == "center_point/x" || outputQuerystring == "orientation/x"){
															console.log(morph.name + " - " + formulaKey + "from " + operation.val + "to " + value);
															operation.val += value;
														}else{
															operation.val += value;
															// delete newFormulas[formulaKey];
														}
													}
												}												
											}
										}
									}
									
								}else{
									// Probably a min/max override or something is animatable.  Leave it in the look
									// newMorphs.push(morph);
								}
							}								
						}
						newMorphs.push({
							"name" : argv.outputmorph,
							"value" : "1.0"
						});
						storable.morphs = newMorphs;
						newMorph.modifier_library[0].formulas = [];
						for(formula in newFormulas){
							newMorph.modifier_library[0].formulas.push(newFormulas[formula]);
						}
						let morphData = JSON.stringify(newMorph,null,"\t");
						let lookData = JSON.stringify(look,null,"\t");
						var morphFolder = argv.vambase+"/Import/Morphs/female/" + argv.morphsubfolder + "/";
						var lookFolder = argv.vambase+"/Saves/Person/appearance/" + argv.looksubfolder + "/";
						fs.writeFileSync( morphFolder + argv.outputmorph + ".dsf" , morphData); 
						try{
							// Delete any VAM morph cache
							fs.unlinkSync(morphFolder + argv.outputmorph + ".vmb"); 
							fs.unlinkSync(morphFolder + argv.outputmorph + ".vmi"); 
						}catch(e){
							// Not a problem if files don't exist.
						}
						fs.writeFileSync(lookFolder + argv.outputmorph + ".json" , lookData); 
					}
				}
			}
		}
	}else{
		console.error("Bad VAM file");
	}
	
});