Solving Satisfiability Problems using Grover’s Algorithm
========================================================

In this section, we demonstrate how to solve satisfiability problems
using the implementation of Grover’s algorithm in Qiskit Aqua.

Contents
--------

1. `Introduction <#introduction>`__

2. `3-Satisfiability Problem <#3satproblem>`__

3. `Qiskit Implementation <#implementation>`__

4. `Problems <#problems>`__

5. `References <#references>`__

1. Introduction 
---------------

Grover’s algorithm for unstructured search was introduced in an `earlier
section <../ch-algorithms/grover.ipynb>`__, with an example and
implementation using Qiskit Terra. We saw that Grover search is a
quantum algorithm that can be used search for correct solutions
quadratically faster than its classical counterparts. Here, we are going
to illustrate the use of Grover’s algorithm to solve a particular
combinatorial Boolean satisfiability problem.

In computer science, the Boolean satisfiability problem is the problem
of determining if there exists an interpretation that satisfies a given
Boolean formula. In other words, it asks whether the variables of a
given Boolean formula can be consistently replaced by the values TRUE or
FALSE in such a way that the formula evaluates to TRUE. If this is the
case, the formula is called satisfiable. On the other hand, if no such
assignment exists, the function expressed by the formula is FALSE for
all possible variable assignments and the formula is unsatisfiable. This
can be seen as a search problem, where the solution is the assignment
where the Boolean formula is satisfied.

2. 3-Satisfiability Problem 
---------------------------

The 3-Satisfiability (3SAT) Problem is best explained with the following
concrete problem. Let us consider a Boolean function :math:`f` with
three Boolean variables :math:`v_1,v_2,v_3` as below:

.. math:: f(v_1,v_2,v_3) = (\neg v_1 \vee \neg v_2 \vee \neg v_3) \wedge (v_1 \vee \neg v_2 \vee v_3) \wedge (v_1 \vee v_2 \vee \neg v_3) \wedge (v_1 \vee \neg v_2 \vee \neg v_3) \wedge (\neg v_1 \vee v_2 \vee v_3)

In the above function, the terms on the right-hand side equation which
are inside :math:`()` are called clauses; this function has 5 clauses.
Being a 3SAT problem, each clause has exactly three literals. For
instance, the first clause has :math:`\neg v_1`, :math:`\neg v_2` and
:math:`\neg v_3` as its literals. The symbol :math:`\neg` is the Boolean
NOT that negates (or, flips) the value of its succeeding literal. The
symbols :math:`\vee` and :math:`\wedge` are, respectively, the Boolean
OR and AND. The Boolean :math:`f` is satisfiable if there is an
assignment of :math:`v_1, v_2, v_3` that evaluates to
:math:`f(v_1, v_2, v_3) = 1` (that is, :math:`f` evaluates to True).

A naive way to find such an assignment is by trying every possible
combinations of input values of :math:`f`. Below is the table obtained
from trying all possible combinations of :math:`v_1, v_2, v_3`. For ease
of explanation, we interchangably use :math:`0` and False, as well as
:math:`1` and True.

+-------------+-------------+-------------+-----------+-------------+
| :math:`v_1` | :math:`v_2` | :math:`v_3` | :math:`f` | Comment     |
+=============+=============+=============+===========+=============+
| 0           | 0           | 0           | 1         | *           |
|             |             |             |           | *Solution** |
+-------------+-------------+-------------+-----------+-------------+
| 0           | 0           | 1           | 0         | Not a       |
|             |             |             |           | solution    |
|             |             |             |           | because     |
|             |             |             |           | :math:`f`   |
|             |             |             |           | is False    |
+-------------+-------------+-------------+-----------+-------------+
| 0           | 1           | 0           | 0         | Not a       |
|             |             |             |           | solution    |
|             |             |             |           | because     |
|             |             |             |           | :math:`f`   |
|             |             |             |           | is False    |
+-------------+-------------+-------------+-----------+-------------+
| 0           | 1           | 1           | 0         | Not a       |
|             |             |             |           | solution    |
|             |             |             |           | because     |
|             |             |             |           | :math:`f`   |
|             |             |             |           | is False    |
+-------------+-------------+-------------+-----------+-------------+
| 1           | 0           | 0           | 0         | Not a       |
|             |             |             |           | solution    |
|             |             |             |           | because     |
|             |             |             |           | :math:`f`   |
|             |             |             |           | is False    |
+-------------+-------------+-------------+-----------+-------------+
| 1           | 0           | 1           | 1         | *           |
|             |             |             |           | *Solution** |
+-------------+-------------+-------------+-----------+-------------+
| 1           | 1           | 0           | 1         | *           |
|             |             |             |           | *Solution** |
+-------------+-------------+-------------+-----------+-------------+
| 1           | 1           | 1           | 0         | Not a       |
|             |             |             |           | solution    |
|             |             |             |           | because     |
|             |             |             |           | :math:`f`   |
|             |             |             |           | is False    |
+-------------+-------------+-------------+-----------+-------------+

From the table above, we can see that this 3-SAT problem instance has
three satisfying solutions: :math:`(v_1, v_2, v_3) = (T, F, T)` or
:math:`(F, F, F)` or :math:`(T, T, F)`.

In general, the Boolean function :math:`f` can have many clauses and
more Boolean variables. Note that 3SAT problems can be always written in
what is known as conjunctive normal form (CNF), that is, a conjunction
of one or more clauses, where a clause is a disjunction of three
literals; otherwise put, it is an AND of 3 ORs.

3. Qiskit Implementation 
------------------------

Let’s now use Qiskit Aqua to solve the example 3SAT problem:

.. math:: f(v_1,v_2,v_3) = (\neg v_1 \vee \neg v_2 \vee \neg v_3) \wedge (v_1 \vee \neg v_2 \vee v_3) \wedge (v_1 \vee v_2 \vee \neg v_3) \wedge (v_1 \vee \neg v_2 \vee \neg v_3) \wedge (\neg v_1 \vee v_2 \vee v_3)

First we need to understand the input `DIMACS
CNF <http://www.satcompetition.org/2009/format-benchmarks2009.html>`__
format that Qiskit Aqua uses for such problem, which looks like the
following for the problem:

::

   c example DIMACS CNF 3-SAT
   p cnf 3 5
   -1 -2 -3 0
   1 -2 3 0
   1 2 -3 0
   1 -2 -3 0
   -1 2 3 0

-  Lines that start with ``c`` are comments

   -  eg. ``c example DIMACS CNF 3-SAT``

-  The first non-comment line needs to be of the form
   ``p cnf nbvar nbclauses``, where

   -  ``cnf`` indicates that the input is in CNF format
   -  ``nbvar`` is the exact number of variables appearing in the file
   -  ``nbclauses`` is the exact number of clauses contained in the file
   -  eg. ``p cnf 3 5``

-  Then there is a line for each clause, where

   -  each clause is a sequence of distinct non-null numbers between
      ``-nbvar`` and ``nbvar`` ending with ``0`` on the same line
   -  it cannot contain the opposite literals i and -i simultaneously
   -  positive numbers denote the corresponding variables
   -  negative numbers denote the negations of the corresponding
      variables
   -  eg. ``-1 2 3 0`` corresponds to the clause
      :math:`\neg v_1 \vee v_2 \vee v_3`

Similarly the solutions to the problem
:math:`(v_1, v_2, v_3) = (T, F, T)` or :math:`(F, F, F)` or
:math:`(T, T, F)` can be written as ``1 -2 3``, or ``-1 -2 -3``, or
``1 2 -3``.

With this example problem input, we create the corresponding oracle for
our Grover search. In particular, we use the LogicalExpressionOracle
component provided by Aqua, which supports parsing DIMACS CNF format
strings and constructing the corresponding oracle circuit.

.. code:: python

   import numpy as np
   from qiskit import BasicAer
   from qiskit.visualization import plot_histogram
   %config InlineBackend.figure_format = 'svg' # Makes the images look nice
   from qiskit.aqua import QuantumInstance, run_algorithm
   from qiskit.aqua.algorithms import Grover
   from qiskit.aqua.components.oracles import LogicalExpressionOracle, TruthTableOracle

.. code:: python

   input_3sat = '''
   c example DIMACS-CNF 3-SAT
   p cnf 3 5
   -1 -2 -3 0
   1 -2 3 0
   1 2 -3 0
   1 -2 -3 0
   -1 2 3 0
   '''

.. code:: python

   oracle = LogicalExpressionOracle(input_3sat)

The ``oracle`` can now be used to create an Grover instance:

.. code:: python

   grover = Grover(oracle)

We can then configure a simulator backend and run the Grover instance to
get the result:

.. code:: python

   backend = BasicAer.get_backend('qasm_simulator')
   quantum_instance = QuantumInstance(backend, shots=1024)
   result = grover.run(quantum_instance)
   print(result['result'])

As seen above, a satisfying solution to the specified 3-SAT problem is
obtained. And it is indeed one of the three satisfying solutions.

Since we used a simulator backend, the complete measurement result is
also returned, as shown in the plot below, where it can be seen that the
binary strings ``000``, ``011``, and ``101`` (note the bit order in each
string), corresponding to the three satisfying solutions all have high
probabilities associated with them.

.. code:: python

   plot_histogram(result['measurement'])

We have seen that the simulator can find the solutions to the example
problem. We would like to see what happens if we use the real quantum
devices that have noise and imperfect gates.

However, due to the restriction on the length of strings that can be
sent over the network to the real devices (there are more than sixty
thousands characters of QASM of the circuit), at the moment the above
circuit cannot be run on real device backends. We can see the compiled
QASM on real-device ``ibmq_16_melbourne`` backend as follows:

.. code:: python

   # Load our saved IBMQ accounts and get the ibmq_16_melbourne backend
   from qiskit import IBMQ
   IBMQ.load_account()
   provider = IBMQ.get_provider(hub='ibm-q')
   backend = provider.get_backend('ibmq_16_melbourne')

.. code:: python

   from qiskit.compiler import transpile

   # transpile the circuit for ibmq_16_melbourne
   grover_compiled = transpile(result['circuit'], backend=backend, optimization_level=3)

   print('gates = ', grover_compiled.count_ops())
   print('depth = ', grover_compiled.depth())

The number of gates needed is far above the limits regarding decoherence
time of the current near-term quantum computers. It is a challenge to
design a quantum circuit for Grover search to solve satisfiability and
other optimization problems.

4. Problems 
-----------

1. Use Qiskit Aqua to solve the following 3SAT problem:
   :math:`f(x_1, x_2, x_3) = (x_1 \vee x_2 \vee \neg x_3) \wedge (\neg x_1 \vee \neg x_2 \vee \neg x_3) \wedge (\neg x_1 \vee x_2 \vee x_3)`.
   Are the results what you expect?

5. References 
-------------

1. Giacomo Nannicini (2017), “An Introduction to Quantum Computing,
   Without the Physics”,
   `arXiv:1708.03684 <https://arxiv.org/abs/1708.03684>`__

.. code:: python

   import qiskit
   qiskit.__qiskit_version__
