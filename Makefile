REPORTER = dot

all:	semper.min.js # runtime.min.js

benchmark:
	@node support/benchmark

lint:
	jsl -conf .jsl.conf -process semper.js

semper.js: $(SRC)
	@node support/compile.js $^

semper.min.js: semper.js
	<semper.js java -jar ~/bin/yuicompressor-2.4.2.jar --type js -o semper-min.js
	<semper-min.js gzip >semper-min.js.gz

test:
	@./node_modules/.bin/mocha --reporter $(REPORTER)

test-cov: lib-cov
	JADE_COV=1 $(MAKE) test REPORTER=html-cov > coverage.html

lib-cov:
	jscoverage lib lib-cov

clean:
	rm -f semper.min.js
	rm -f runtime.js
	rm -f runtime.min.js

.PHONY: test-cov test benchmark clean
