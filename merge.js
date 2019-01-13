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
		"    Do not use a file extension. A .dsf Morph and .json Look will be created for you.",
		" --gender male/female\t Optional, specify your output morphs gender.  Default is female.",
		" --bakeformulas true/false\t Optional, specify whether you want to bake in morph value formulas.  Default is false.",
		" --strip true/false\t Optional, specify whether you want to strip out animatable/min/max leftovers in new Look.  Default is false.",
		" --vammorphpath VAMMORPHPATH\t Optional, specified path to Standard VAM morph JSON extracts*",
		" --looksubfolder LOOKSUBFOLDER\t Optional, specifies subfolder name within '/Saves/Person/appearance' to place new Look containing merged morph",
		" --morphsubfolder MORPHSUBFOLDER\t Optional, specifies subfolder within '/Import/morphs/male', or  '/Import/morphs/female', to place your merged morph",
		" --author AUTHOR\t Optional, specifies your name, otherwise you are 'John Doe'.",
		"",
		"*Note: See extractMorphs.js for details on extracting VAM Morph information.  DO NOT distribute extracted standard morphs.",
		"Note 2: This morph merger is not intended to work with Genetalia morphs, as they are on a different graft.",
		""
		].join("\r\n"));
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
			"group" : "!Morph Merger",
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

const ignore3 = (file, stats)=>{
	if(stats.isDirectory()) return false;
	var ext = path.extname(file);
	if(ext.toLowerCase() == ".vmb"){
		return false;
	}else{
		return true;
	}
}

var modifiers = {},
	modifiers2 = {},
	vamModifiers = {},
	vmbModifiers = {},
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
					var morphName = morph.morphName;
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
								// console.log("Unknown target type " + formula.targetType + " for morph " + morphId + " and target " + formula.target);
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
						};
						modifiers2[morphName] = modifiers[morphId];
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
								// console.warn("Duplicate morph found - " + morphId + "(" + filename + ").  Already found in " + modifiers[morphId].filename);
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
						throw("No modifiers in morph " + filename);
					}
				}catch(e){
					console.error("Error parsing " + filename + " Is it compressed ?");
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

/*
VMB Morphs
*/
var vmbMorphPromise = new Promise((resolve,reject)=>{
	var vmbFiles = recursive(argv.vambase + "/Import/Morphs", [ignore3]);
	vmbFiles.then(vmbFiles=>{
		var vmbPromises = [];
		for(file of vmbFiles){
			let filename = file;
			let vmiFile = file.replace(/\.[^/.]+$/, "") + ".vmi";
			var morphPromise = Promise.all([
				promisify(fs.readFile)(file),
				promisify(fs.readFile)(vmiFile)
			]).then(data=>{
				var vmbData = data[0];
				var vmiData = data[1];
				var deltas = [];
				var offset = 0;
				var vertexCount = vmbData.readInt32LE(offset);
				offset+=4;
				var verts = (vmbData.length - 4)/16;
				if(verts != vertexCount){
					console.error("Header byte says there should be " + vertexCount + " vertices but file size does not match.");
					return 1;
				}
				while(offset<vmbData.length){
					// Vertex Index
					var index = vmbData.readInt32LE(offset);
					offset +=4;
					// X
					var x = vmbData.readFloatLE(offset);
					offset +=4;
					// Y
					var y = vmbData.readFloatLE(offset);
					offset +=4;
					// Z
					var z = vmbData.readFloatLE(offset);
					offset +=4;
					deltas.push([
						index, x * -100, y * 100, z * 100
					]);
				}
				var info = JSON.parse(vmiData);
				vmbModifiers[info.id] = {
					filename : filename,
					vmi : info,
					vmb : deltas
				};
				return vmbModifiers[info.id];
			})
			vmbPromises.push(morphPromise);
		}
		Promise.all(vmbPromises).then(data=>{
			resolve(data);
		});
	});
});

// First read all morphs to get file paths
Promise.all([vamMorphPromise,customMorphPromise,vmbMorphPromise]).then(allData=>{
	var data = allData[0];
	var i = 0, j = 0;
	for(modifier in modifiers){
		i++;
	}
	for(var m in vmbModifiers){
		var vmb = vmbModifiers[m];
		j++;
		var formulas = [];
		vmb.vmi.formulas.map(formula=>{
			// TODO
		});
		modifiers[vmb.vmi.displayName] = modifiers[vmb.vmi.displayName] || {
			filename : vmb.filename,
			type : "vmb",
			modifier : {},
			morph : {
				deltas : {
					values : vmb.vmb
				}
			},
			formulas : formulas
		};
	}
	console.log(i + " morphs indexed.");
	console.log(j + " VMBs indexed.");
	// Category analysis left over from another script.  Not really important here.
	for(category in categories){
		// console.log(" - " + category);
		for(morph in categories[category]){
			// console.log(" |--" + morph + " (" + categories[category][morph].filename + ")");
		}
	}
	
	if(look.atoms){
		console.log("Parsing look file: '" + argv.inputfile + "'");
		for(atom of look.atoms){
			if(atom.type == "Person"){
				console.log("Found Person atom with ID: '" + atom.id + "'");
				for(storable of atom.storables){
					if(storable.morphs){
						console.log("Found Morph storables");
						var newMorphs = [];
						var newFormulas = {};
						var morphHash = {};
						for(morph of storable.morphs){
							morphHash[morph.name] = morph;
						}
						for(morph of storable.morphs){
							if(!modifiers[morph.name]){
								newMorphs.push(morph);
								console.warn("Morph '" + morph.name + "' not found in custom or standard morphs.  Not computing, and leaving reference in new Look file.");
							}else if(morph.name=="Nipples"){
								console.log("Ignoring Nipples  (VAM will re-apply them and make them longer than original otherwise.");
								newMorphs.push(morph);
							}else{
								if(morph.value != undefined){
									// console.log("Custom Morph '" + morph.name + "' used with a value of " + morph.value + "...");
									if(modifiers[morph.name].morph){	// It IS possible to not have a morph section in a DSF modifier
										var morphDelta = modifiers[morph.name].morph.deltas.values;
										console.log("Applying " + modifiers[morph.name].morph.deltas.values.length + " vertex changes from " + modifiers[morph.name].type + " morph '" + morph.name + "' with a morph value of " + morph.value);
										for(delta of morphDelta){
											var deltaDelta = [delta[0],delta[1] * morph.value, delta[2] * morph.value, delta[3] * morph.value];
											
											deltas[delta[0]][1]+=deltaDelta[1];
											deltas[delta[0]][2]+=deltaDelta[2];
											deltas[delta[0]][3]+=deltaDelta[3];
										}										
									}
									
									var morphFormulas = modifiers[morph.name].formulas;
									if(morphFormulas){
										var i = 0;
										for(formula of morphFormulas) i++;
										if(i>0) console.log("Analyzing " + i + " formulas in " + morph.name);
										for(formula of morphFormulas){
											var url = "";
											var value = 0.0;
											var formulaValue = 0.0;
											for(operation of formula.operations){
												if(operation.url) url = operation.url;
												if(operation.val !=undefined) {
													formulaValue = operation.val;
													value = (operation.val * morph.value);
												}
											}
											var urlKey = url.split("?")[1];
											var formulaKey = formula.output + "|" + urlKey;
											var outputQuerystring = (formula.output + "?").split("?")[1];
											var pass = true;
											if(outputQuerystring == "value"){
												// console.log("Checking '" + outputQuerystring + "'...");
												try{
													var mn = formula.output.split("#")[1].split("?")[0];
													if(morphHash[mn]){
														pass = false;
														console.log("Not applying value formula, as morph '" + mn + "' is already present in Look file.");
													}else{
														if(modifiers2[mn]){
															if(argv.bakeformulas=="true"){
																console.log("Baking formula in with morph '" + mn + "' vertices");
																// This really should be recursive but it's late.
																// console.log(JSON.stringify(formula));
																if(modifiers2[mn].morph){	// It IS possible to not have a morph section in a DSF modifier
																	var morphDelta = modifiers2[mn].morph.deltas.values;
																	console.log("Baking " + modifiers2[mn].morph.deltas.values.length + " vertex changes from " +  mn);
																	
																	for(delta of morphDelta){
																		var val = value;
																		deltas[delta[0]][1]+= (delta[1] * val);
																		deltas[delta[0]][2]+= (delta[2] * val);
																		deltas[delta[0]][3]+= (delta[3] * val);
																		pass = false;
																	}
																}
																if(modifiers2[mn].formulas && modifiers2[mn].length>0){
																	console.log("Warning.  More formulas to compute, not supported yet.");
																}
															}
														}else{
															console.log("Couldn't find '" + mn + "' morph to convert.  Leaving as a formula.");
														}
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
															// console.log(morph.name + " - " + formulaKey + "from " + operation.val + "to " + value);
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
									if(argv.strip=="true"){
										// Don't leave min/max/animatable to the Look
									}else{
										// Leave it in the look
										newMorphs.push(morph);
									}
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
						if(argv.morphsubfolder){
							var morphFolder = argv.vambase+"/Import/Morphs/" + (argv.gender || "female") + "/" + argv.morphsubfolder + "/";
						} else {
							var morphFolder = argv.vambase+"/Import/Morphs/" + (argv.gender || "female") +"/";
						}
						if (!fs.existsSync(morphFolder)){
							fs.mkdirSync(morphFolder);
						}
						if(argv.looksubfolder){						
							var lookFolder = argv.vambase+"/Saves/Person/appearance/" + argv.looksubfolder + "/";
						} else {
							var lookFolder = argv.vambase+"/Saves/Person/appearance/";
						}
						if (!fs.existsSync(lookFolder)){
							fs.mkdirSync(lookFolder);
						}						
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