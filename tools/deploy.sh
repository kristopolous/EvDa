#!/bin/bash
for file in evda evda-helper; do
  cp src/$file.js release/$file.js
done

echo "EvDa.__version__='`git describe`';" >> release/evda.js

cd release
for file in evda evda-helper; do
  ../tools/minifier.sh $file
done

