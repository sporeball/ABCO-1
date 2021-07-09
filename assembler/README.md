## assembler
this folder contains an assembler for ABCO-1 ROM files, built with Node.js.

**the assembler is currently under development.** not everything is completed yet, and there are probably still some bugs; use at your own risk.

### usage
first, clone the ABCO-1 repository, `cd` into this directory, and install the assembler's dependencies:

```
$ npm install
```

you can then assemble any correctly written program like so:

```
$ node assembler.js prog.abcout
```

assembled ROMs are suitable for use with both the [simulator](https://github.com/sporeball/ABCO-1/tree/master/simulator) and the actual hardware.

### command line flags
- `-o` / `--out` - the filename for the assembled ROM (default: `rom.bin`)

### writing programs

#### basics
ABCO-1 programs are written with a syntax similar to, but not exactly like, that of x86 assembly. instructions can be given either with or without the mnemonic `abcout`; an argument preceded by `$` will be parsed as a hex literal, and `;` will begin a comment.

if present, each abcout instruction's `C` argument mod 6 **must** equal 0 (to prevent programs from branching to the middle of an instruction). alternatively, the `C` argument can be omitted, in which case it will automatically be replaced with the address of the following instruction.

#### labels
to allow you to branch to sections of your program more easily, *symbolic labels* can be placed at the start of a line; these can replace the `C` argument of any instruction.

label names are always followed by a colon `:`, and can consist of lowercase letters, digits, and underscores; the only exception is that names cannot begin with a digit.

#### macros
a *macro* is a block of instructions that can be defined with its own mnemonic, then expanded at compile time. they follow the same naming rules as labels, and can call any other previously defined macros.

macro declaration begins with the keyword `%macro`, followed by a macro name and a number of parameters it should take (e.g. `%macro beq 2`), and ends with the keyword `%endmacro`.

you can pass `%n` as an argument to an instruction to access the *n*-th parameter passed to the macro it is found within (0-indexed); for example, a simple `double` macro would consist of the single instruction `abcout %0, %0`.

macros can even define their own labels, which can be referenced within the macro by prefacing them with `#` (e.g. `abcout 1, 2, #label`). labels defined in this way will be given a unique name every time the macro is expanded, to ensure no naming collisions.

#### imports
*imports* allow you to add macros defined in other files to your program. import statements begin with the keyword `@import`, followed by a comma-separated list of macros to import, the keyword `from`, and a filename (excluding the suffix `.abcout`.)

for example, to import three macros from the file `basics.abcout`, you can write `@import jmp, beq, mov from basics`.

*this feature is in progress!*
