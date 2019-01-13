# morphmerger
Merge VAM Morphs in a Look to a Single Morph

# DISCLAIMER

This utility is for personal use, and is not intended to be used to re-distribute morphs where you do not have re-distribution rights.

Please note: all tools/scripts/instructions in this repo are released for use "AS IS" without any warranties of any kind, including, but not limited to their installation, use, or performance. We disclaim any and all warranties, either express or implied, including but not limited to any warranty of noninfringement, merchantability, and/ or fitness for a particular purpose. We do not warrant that the technology will meet your requirements, that the operation thereof will be uninterrupted or error-free, or that any errors will be corrected.

Any use of these scripts and tools is at your own risk. There is no guarantee that they have been through thorough testing in a comparable environment and we are not responsible for any damage or data loss incurred with their use.

You are responsible for reviewing and testing any scripts you run thoroughly before use in any non-testing environment.

# Installation

## Prerequisites

- Node installed [Node JS](https://nodejs.org/en/download/)
- This repository cloned/downloaded and extracted into a folder.
- *Optional:* [Unity Asset Bundle Extractor](https://github.com/DerPopo/UABE/releases) downloaded.  Only needed if you want to extract standard VAM Morph information for use in Morph Merging.
- *Optional:* DSF Toolbox downloaded to decompress and custom morphs that are in compressed format.

## First One-Time Setup command

- Navigate to the folder where you have cloned/downloaded this repository.  Run `npm install` to download the require `node_modules`  This should take less than 30 seconds.

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

Options:
 --vambase VAMPATH Required, specifies base VAM path.
 --inputfile INPUTFILE Required, specifies input Look .json file to evaluate
 --outputmorph OUTPUTMORPH Required, specifies your output morph file name.
    Do not leave use a file extension.  A.dsf Morph and starter .json Look will be created for you.
 --vammorphpath VAMMORPHPATH Optional, specified path to Standard VAM morph JSON extracts
 --looksubfolder LOOKSUBFOLDER Optional, specifies subfolder name within '\Saves\Person\appearance' to place new Look containing merged morph
 --morphsubfolder MORPHSUBFOLDER Optional, specifies subfolder name within '\Import\morphs\female' to place your merged morph
 --author AUTHOR Optional, specifies your name, otherwise you are John Doe.

*Note:* See extractMorphs.js for details on extracting VAM Morph information.  DO NOT distribute extracted standard morphs.
*Note 2:* This morph merger is not intended to work with Genetalia morphs, as they are on a different graft.
```

## Sample Command:
`node merge.js --vambase=c:\vam --bakeformulas=true --gender=female --vammorphpath=extracts --looksubfolder=!Propel --morphsubfolder=!Propel --inputfile=c:\vam\Saves\Person\appearance\somelook.json --outputmorph="My Morph Name" --strip=true`
