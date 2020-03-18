## simulator
this folder contains a simulation of the ABCO-1, built with Node.js.

### usage
first, clone the ABCO-1 repository, `cd` into this directory, and install the simulator's dependencies:

```
npm install
```

you can then run the simulation using any [properly assembled ROM](https://github.com/sporeball/ABCO-1/tree/master/assembler) like so:

```
node simulator.js rom.bin
```
