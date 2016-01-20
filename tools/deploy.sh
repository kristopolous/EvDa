#!/bin/bash
set +x
base=evda
cp $base.js $base-tmp.js
cp $base.min.js $base-tmp.min.js
echo "EvDa.__version__='`git describe`';" >> $base-tmp.js
./minifier.sh $base-tmp
mv $base-tmp.min.js $base.min.js
rm $base-tmp.js

./minifier.sh $base-helper
