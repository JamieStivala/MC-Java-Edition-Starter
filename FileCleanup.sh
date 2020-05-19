#!/bin/bash

npm i
tsc

shopt -s extglob
rm -rfv !("out"|"SampleStarter.service"|"node_modules"|"package.json")
unset GLOBIGNORE

mv out/* .
rm -r out