cat semper.js | java -jar ~/bin/yuicompressor-2.4.2.jar --type js -o semper-min.js

gzip < semper-min.js  >semper-min.js.gz
