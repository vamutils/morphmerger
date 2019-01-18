# morphmerger
Merge VAM Morphs in a Look to a Single Morph

# DISCLAIMER

This utility is for personal use, and is not intended to be used to re-distribute morphs where you do not have re-distribution rights.

Please note: all tools/scripts/instructions in this repo are released for use "AS IS" without any warranties of any kind, including, but not limited to their installation, use, or performance. We disclaim any and all warranties, either express or implied, including but not limited to any warranty of noninfringement, merchantability, and/ or fitness for a particular purpose. We do not warrant that the technology will meet your requirements, that the operation thereof will be uninterrupted or error-free, or that any errors will be corrected.

Any use of these scripts and tools is at your own risk. There is no guarantee that they have been through thorough testing in a comparable environment and we are not responsible for any damage or data loss incurred with their use.

You are responsible for reviewing and testing any scripts you run thoroughly before use in any non-testing environment.

# Installation

## Prerequisites

- Node installed [Node JS](https://nodejs.org/en/download/) - Version 10 works.  Reports that older versions do not, so I recommend to use 10.15.0 or higher.
- This repository cloned/downloaded and extracted into a folder.
- *Optional:* [Unity Asset Bundle Extractor](https://github.com/DerPopo/UABE/releases) downloaded.  Only needed if you want to extract standard VAM Morph information for use in Morph Merging.
- *Optional:* DSF Toolbox downloaded to decompress and custom morphs that are in compressed format.

## First One-Time Setup command

- From the Windows Command Prompt, navigate to the folder where you have cloned/downloaded this repository.  Run `npm install` to download the required `node_modules`  This should take less than 30 seconds.

## *Optional* One-Time standard Morph Extraction Steps

- Launch `AssetBundleExtractor.exe` located wherever you downloaded UABE.
- In the menu, select `File` -> `Open`, navigate to `your_vam_install_path\VaM_Data\StreamingAssets`' and select file `f_mb`.
- You will be prompted to unpack the file, answer Yes, and unpack as whatever name, preferably outside your VAM install folder.  You can delete this later.
- Click the 'Info' button.
- Sort the list by Name and select all `MonoBehaviour` entries.  Click `Export Dump`.
- Leave option as `UABE Text Dump` and click `OK`.
- Select the `dumps` folder where you extracted this program.
- Once you have confirmed that the .txt files have been dumped, you can close UABE.  You are finished.
- Launch a Command Prompt window and navigate to the folder of this program.
- type `node extractMorphs.js --dumpfolder dumps --outputfolder extracts`.  This example command assumes that you saved your .txt file dumps to the `dump` sub-folder.
- Confirm that your `extracts` sub-folder contains several .json files, each containing a standard VAM morphs name.  If so, congratulations, you are done with this part!

## *Optional* Make sure your custom .dsf morphs are uncompressed

- Get a copy of DSF Toolbox
- Uncompress your morphs

## General Morph Merging Usage:
```(bash)
This script will read INPUTFILE Look and write out a merged morph representing all used Morphs in the Look file.
The script will also write out a new Look file of the same name as the morph file, retaining any clothing, hair, and skin settings, as well as any Custom or Standard morphs that could not be read

Usage: node merge.js [options]

Example: 
node merge.js --vambase=c:\vam --bakeformulas=true --gender=female --vammorphpath=extracts --looksubfolder=!Propel --morphsubfolder=MyMorphs --inputfile=c:\vam\Saves\Person\appearance\somelook.json --outputmorph="My Morph Name" --strip=true
```

## Options Explained
| Option | Required? | Default | Description |
|--------|-----------|---------|-------------|
| `--vambase` | Yes    |         | Specifies base VAM path |
| `--inputfile` | Yes    |         | Specifies input Look .json file to evaluate |
| `--outputmorph` | Yes    |         | Specifies your output morph file name.  *Do not use a file extension, they will be created for you.* |
| `--vammorphpath` | Yes | | Specifies path to Standard VAM morph JSON extracts.  This folder must exist! |
| `--morphsubfolder` | Yes | | Specifies subfolder name within `<vambase>\Import\morphs\female` to place your merged morph.  This folder must exist! |
| `--looksubfolder` | Yes | | Specifies sub-folder name within `<vambase>\Saves\Person\appearance` to place new Look containing merged morph.  This folder must exist! |
| `--author` | Optional | `John Doe` | Specifies your name |
| `--bakeformulas` | Optional | `false` | Specify whether you want to bake in morph value formulas.  Valid values are `true` or `false` |
| `--strip` | Optional | `true` | Specify whether you want to bake in morph value formulas. Valid values are `true` or `false` |
| `--onlyface` | Optional | `false` | specify whether to just export the face vertices.  Valid values are `true` or `false` |

*Note:* See extractMorphs.js for details on extracting VAM Morph information.  DO NOT distribute extracted standard morphs.
*Note 2:* This morph merger is not intended to work with Genetalia morphs, as they are on a different graft.


