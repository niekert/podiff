# podiff

podiff compares the contents of a PO file on the file system, to that same PO file on another branch in git. It outputs only outputs messages that differ from the compared branch.

## Usage

```
podiff -d ./src/locales -b master
```

Options
|Argument|Description|
|--------|-----------|
| -d | directory to recursively scan for PO files|
| -b | Branch to compare the file to. Default: master|

Podiff will scan for all `.po` files in the given directory and compare the PO file with a version on the given branch. Only additions and differences will be outputted in the resulting PO file.