# ABCO-1
the **ABCO-1** is a one instruction set computer that adds and branches conditionally.

to be more specific, each instruction takes the form `abcout A, B, C`. this adds the contents of memory address B to memory address A, stores the result in memory address A, and, if the carry bit is set, branches control to the instruction at ROM address C. if the carry bit is **not** set, execution proceeds to the next instruction in sequence.

this is still a mostly conceptual idea, though in the future i'd love to build a computer using TTL that follows this specification.

### folder structure
- [assembler/](https://github.com/sporeball/ABCO-1/tree/master/assembler) - contains an assembler for ABCO-1 ROM files. works with the simulator and, eventually, the actual hardware. 

- [simulator/](https://github.com/sporeball/ABCO-1/tree/master/simulator) - contains a simulation of the computer, built with Node.js.

- hardware/ - coming soon.

### donate
you can support the development of this project and others via Patreon:

<a href="https://patreon.com/sporeball"><img src="https://img.shields.io/endpoint.svg?url=https%3A%2F%2Fshieldsio-patreon.herokuapp.com%2Fsporeball%2Fpledgesssss&style=for-the-badge" /></a>
