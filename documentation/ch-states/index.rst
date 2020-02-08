Quantum States and Qubits
=========================

.. toctree::
  :hidden:

  The Atoms of Computation. <atoms-computation>
  The Unique Properties of Qubits. <unique-properties-qubits>
  Writing Down Qubit States. <writing-down-qubit-states>
  Pauli Matrices and the Bloch Sphere. <pauli-matrices-bloch-sphere>
  States for Many Qubits. <states-many-qubits>

If you think quantum mechanics sounds challenging, you are not alone.
All of our intuitions are based on day-to-day experiences, and so are
better at understanding the behavior of balls and bananas than atoms or
electrons. Though quantum objects can seem random and chaotic at first,
they just follow a different set of rules. Once we know what those rules
are, we can use them to create new and powerful technology. Quantum
computing will be the most revolutionary example of this.

To get you started on your journey towards quantum computing, let’s test
what you already know. Which of the following is the correct description
of a *bit*?

-  A blade used by a carpenter.
-  The smallest unit of information: either a ``0`` or a ``1``.
-  Something you put in a horse’s mouth.

Actually, they are all correct: it’s a very multi-purpose word! But if
you chose the second one, it shows that you are already thinking along
the right lines. The idea that information can be stored and processed
as a series of ``0``\ s and ``1``\ s is quite a big conceptual hurdle,
but it’s something most people today know without even thinking about
it. Taking this as a starting point, we can start to imagine bits that
obey the rules of quantum mechanics. These quantum bits, or *qubits*,
will then allow us to process information in new and different ways.

The first few sections in this chapter are intended for the broadest
possible audience. You won’t see any math that you didn’t learn before
you were age 10. We’ll look at how bits work in standard computers, and
then start to explore how qubits can allow us to do things in a
different way. After reading this, you should already be able to start
thinking about interesting things to try out with qubits.

We’ll start diving deeper into the world of qubits. For this, we’ll need
some way of keeping track of what they are doing when we apply gates.
The most powerful way to do this is to use the mathematical language of
vectors and matrices.

This chapter will be most effective for readers who are already familiar
with vectors and matrices. Those who aren’t familiar will likely be fine
too, though it might be useful to consult our `Introduction to Linear
Algebra for Quantum
Computing <../ch-prerequisites/linear_algebra.html>`__ from time to
time.

Since we will be using Qiskit, our Python-based framework for quantum
computing, it would also be useful to know the basics of Python. Those
who need a primer can consult the `Introduction to Python and Jupyter
notebooks <../ch-prerequisites/python-and-jupyter-notebooks.html>`__.
