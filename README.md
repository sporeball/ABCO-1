# ABCO-1

[![js-semistandard-style](https://img.shields.io/badge/code%20style-semistandard-brightgreen.svg?style=flat-square)](https://github.com/standard/semistandard)

the **ABCO-1** is a hardware implementation of the OISC [abcout](https://esolangs.org/wiki/Abcout).

each `abcout` instruction takes the form `A, B, C` and adds the value at memory address `B` to the value at memory address `A`; execution will then branch to memory address `C` if the result is greater than 255, or to the next instruction in sequence otherwise. it is assumed that addresses `A` and `B` both contain an unsigned 8-bit integer.

this is equivalent to the following C-like syntax:

```c
*a += *b; if (*a > 255) { *a %= 256; ip = c; }
```

instructions are not memory-mapped, and instead instructions and user space are kept in separate blocks of memory.

it is important to keep in mind that abcout and its implementation in the form of the ABCO-1 are *different things*. i welcome implementations which don't adhere to all of the finer details that this one does.

### folder structure
- [assembler/](https://github.com/sporeball/ABCO-1/tree/master/assembler) - contains an assembler for ABCO-1 ROM files. you'll probably want to start here.

- [simulator/](https://github.com/sporeball/ABCO-1/tree/master/simulator) - contains a software simulation of the ABCO-1.

- hardware/ - coming soon.

### donate
you can support the development of this project and others via Patreon:

[![Support me on Patreon](https://img.shields.io/endpoint.svg?url=https%3A%2F%2Fshieldsio-patreon.vercel.app%2Fapi%3Fusername%3Dsporeball%26type%3Dpledges%26suffix%3D%252Fmonth&style=for-the-badge)](https://patreon.com/sporeball)
