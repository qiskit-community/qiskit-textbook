
| stable: | [![Build Status](https://github.com/qiskit-community/qiskit-textbook/workflows/build%20and%20deploy/badge.svg?branch=stable)](https://github.com/qiskit-community/qiskit-textbook/actions) | main: | [![Build Status](https://github.com/qiskit-community/qiskit-textbook/workflows/build%20and%20deploy/badge.svg?branch=main)](https://github.com/qiskit-community/qiskit-textbook/actions) |
|---|---|---|---|

# Qiskit Textbook Source Code

This is the repository for the interactive open-source [Learn Quantum Computation using Qiskit](https://qiskit.org/textbook/preface.html) textbook. The textbook is intended for use as a university quantum algorithms course supplement as well as a guide for self-learners who are interested in learning quantum programming.

The Jupyter notebooks corresponding to each section of the textbook can be found in the [`content` folder](content/). The code in these notebooks will constantly be updated to the latest version of Qiskit.

The notebooks are compiled into html and exported to [the website](http://community.qiskit.org/textbook).

## Installing the `qiskit_textbook` Package

The Qiskit Textbook provides some tools and widgets specific to the Textbook. This is not part of Qiskit and is available through the `qiskit_textbook` package. The quickest way to install this with [pip](https://pypi.org/project/pip/) and [Git](https://git-scm.com/) is through the command:

```
pip install git+https://github.com/qiskit-community/qiskit-textbook.git#subdirectory=qiskit-textbook-src
```

Or, if you prefer using [pipenv](https://pypi.org/project/pipenv/):

```
pipenv install "git+https://github.com/qiskit-community/qiskit-textbook.git#subdirectory=qiskit-textbook-src&egg=qiskit_textbook"
```

Alternatively, you can download the folder [`qiskit-textbook-src`](qiskit-textbook-src) and run:

```
pip install ./qiskit-textbook-src
``` 

from the directory that contains this folder.

# Contribution Guidelines
If you'd like to contribute to Qiskit Textbook, please take a look at our [contributors guide](CONTRIBUTING.md).

# License
The materials and associated source code of this open-source textbook are licensed under [Apache License 2.0](http://github.com/qiskit-community/qiskit-textbook/blob/main/LICENSE.txt).

# Contact
For any issues, please contact Frank Harkins in the [Qiskit Slack workspace](https://ibm.co/joinqiskitslack). You can also email Frank Harkins (francis.harkins@ibm.com).
