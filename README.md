# ABCO-1
the **ABCO-1** is a hardware implementation of the OISC [abcout](https://esolangs.org/wiki/Abcout).

each `abcout` instruction takes the form `A, B, C` and adds memory address `B` to memory address `A`; execution will then branch to memory address `C` if the result is greater than 255, or to the next instruction in sequence otherwise. it is assumed that addresses `A` and `B` both contain an unsigned 8-bit integer.

this is equivalent to the following C-like syntax:

```c
*a += *b; if (*a > 255) { *a %= 256; ip = *c; }
```

instructions are not memory-mapped, and instead instructions and user space are kept in separate blocks of memory.

### folder structure
- [assembler/](https://github.com/sporeball/ABCO-1/tree/master/assembler) - contains an assembler for ABCO-1 ROM files.

- [simulator/](https://github.com/sporeball/ABCO-1/tree/master/simulator) - contains a software simulation of the ABCO-1.

- hardware/ - coming soon.

### writing programs

#### basics
ABCO-1 programs are written with an x86-like syntax. instructions can be given either with or without the mnemonic `abcout`; an argument preceded by `$` will be parsed as a hex literal, and `;` will begin a comment.

to prevent programs from branching to the middle of an instruction, `C` mod 6 **must** equal 0 for all instructions.

#### labels
to allow you to branch to sections of your program more easily, *symbolic labels* can be placed at the start of a line; these can replace the `C` argument of any instruction.

label names are always followed by a colon `:`, and can consist of lowercase letters, digits, and underscores; the only exception is that names cannot begin with a digit.

### donate
you can support the development of this project and others via Patreon:

[![Support me on Patreon](https://img.shields.io/endpoint.svg?url=https%3A%2F%2Fshieldsio-patreon.vercel.app%2Fapi%3Fusername%3Dsporeball%26type%3Dpledges%26suffix%3D%252Fmonth&style=for-the-badge)](https://patreon.com/sporeball)
