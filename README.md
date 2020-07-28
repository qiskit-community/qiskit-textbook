
| stable: | [![Build Status](https://travis-ci.com/qiskit-community/qiskit-textbook.svg?branch=stable)](https://travis-ci.com/qiskit-community/qiskit-textbook) | master: | [![Build Status](https://travis-ci.com/qiskit-community/qiskit-textbook.svg?branch=master)](https://travis-ci.com/qiskit-community/qiskit-textbook) |
|---|---|---|---|

# Qiskit Textbook Source Code

This is the repository for the interactive open-source [Learn Quantum Computation using Qiskit](http://community.qiskit.org/textbook) textbook. The textbook is intended for use as a university quantum algorithms course supplement as well as a guide for self-learners who are interested in learning quantum programming.

The Jupyter notebooks corresponding to each section of the textbook can be found in the [`content` folder](content/). The code in these notebooks will constantly be updated to the latest version of Qiskit.

The notebooks are compiled into html and exported to [the website](http://community.qiskit.org/textbook).

## Installing the `qiskit_textbook` Package

The Qiskit Textbook provides some tools and widgets specific to the Textbook. This is not part of Qiskit and is available through the `qiskit_textbook` package. The quickest way to install this with [Pip](https://pypi.org/project/pip/) and [Git](https://git-scm.com/) is through the command:

```pip install git+https://github.com/qiskit-community/qiskit-textbook.git#subdirectory=qiskit-textbook-src```

Alternatively, you can download the folder [`qiskit-textbook-src`](qiskit-textbook-src) and run:

```pip install ./qiskit-textbook-src``` 

from the directory that contains this folder.

# License
The materials and associated source code of this open-source textbook are licensed under [Apache License 2.0](http://github.com/qiskit-community/qiskit-textbook/blob/master/LICENSE.txt).

# Contact
For any issues, please contact Francis Harkins (francis.harkins@ibm.com) and Abraham Asfaw (abraham.asfaw@ibm.com).
