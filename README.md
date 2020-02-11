
| stable: | [![Build Status](https://travis-ci.com/Qiskit/qiskit-textbook.svg?branch=stable)](https://travis-ci.com/Qiskit/qiskit-textbook) | master: | [![Build Status](https://travis-ci.com/Qiskit/qiskit-textbook.svg?branch=master)](https://travis-ci.com/Qiskit/qiskit-textbook) |
|---|---|---|---|

# Qiskit Textbook Source Code

This is the repository for the open-source [Learn Quantum Computation using Qiskit](http://community.qiskit.org/textbook) textbook. The textbook is intended for use as a university quantum algorithms course supplement as well as a guide for self-learners who are interested in learning quantum programming.

The source code of the textbook can be found in the [`documentation` folder](documentation/). The code in these RST files will constantly be updated to the latest version of Qiskit.

## How to work with the textbook

The documentation server has a development mode to see a preview while you are editing the documentation. The only dependency is to have `docker` installed on your system (You can install it [following these instructions](https://docs.docker.com/install/)).

One you have `docker` installed. This command will launch the dev server

```
./dev.sh
```

> ⚠️ Note: The first time you run it, it will take some time because it needs to downloads a lot of dependencies

Once the dev server is started you can see the preview on http://localhost:3000.

The dev server has "live-reload" which means any changes in the source of the textbook will trigger a new compilation. Once done, the browser will reload the current page.

The command have some extra options

```sh
./dev.sh --help

Usage:
  ./dev.sh [--help] [--clean --external]

Options:
  --help  : show help
  --clean : make a clean build
  --external : enable external documentation repositories
```

> ⚠️ Note: The `--external` argument will slow down the whole process (qiskit documentation is huge)

## Customizing the page render

There are some properties to customize the way a page is rendered

- `showFooterNavigation`(`boolean`, default: `true`): Controls if the footer navigation (the one with the links to the previous and next page) should be shown.

- `fullWidth`(`boolean`, default: `false`): Controls if the page should be rendered taking the whole page width.

To use these properties you need to include them on the meta block

```
.. meta::
   :showFooterNavigation: false
   :fullWidth: true
```

## Contributions
Contributions of all types are always welcome. Please read "Editing Jupyter Notebooks" below to make sure they can be converted properly for the IBMQX. Please [start a pull request](https://help.github.com/en/articles/creating-a-pull-request) to submit changes, or create an issue to request updates.

For a list of contributors, see the [.bib](https://github.com/Qiskit/qiskit-textbook/blob/master/content/qiskit-textbook.bib) file.

## Editing Jupyter Notebooks
The automatic conversion process between the notebooks and the IBMQX website requires certain conventions are followed:
1. The contents at the top of the notebook should be of the form below, note the blank lines:
```
## Contents

1. [Title](#link)
2. [Title](#link)

```
2. Attention needs to be paid to the dollar signs in the display mathematics, they need one blank line above and below the display equation:
```

$$
\equation{}
$$

```

3. Images _need_ a caption, and cannot be in html:
```![essential_caption](link_to_image)


## License
The materials and associated source code of this open-source textbook are licensed under [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0).

## Contact
For any issues, please contact Abraham Asfaw (abraham.asfaw@ibm.com).
