#!/bin/bash
for file in evda evda-helper; do
  cp src/$file.js release/$file.js
done

version=`git describe | awk -F '-' ' { print $1"."$(NF-1) } '`
age=`date +%Y%m%d`
echo "EvDa.version='$version-$age';" >> release/evda.js

cd release
for file in evda evda-helper; do
  ../tools/minifier.sh $file
done

