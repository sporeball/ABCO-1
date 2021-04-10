## assembler
this folder contains an assembler for ABCO-1 ROM files, built with Node.js.

### usage
first, clone the ABCO-1 repository, `cd` into this directory, and install the assembler's dependencies:

```
npm install
```

you can then assemble any correctly written program like so:

```
node assembler.js prog.abcout
```

this will create a file named `rom.bin`, suitable for use with both the [simulator](https://github.com/sporeball/ABCO-1/tree/master/simulator) and the actual hardware.
