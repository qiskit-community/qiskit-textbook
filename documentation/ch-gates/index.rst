Single Qubits and Multi-Qubits gates
====================================
.. contents:: Contents
   :local:

.. contents:: Contents
   :local:

.. contents:: Contents
   :local:

.. contents::
   :local:


.. toctree::
  :hidden:

  Quantum Gates <quantum-gates>
  Fun with Matrices <fun-matrices>
  The Standard Gate Set <standard-gate-set>
  Proving Universality <proving-universality>
  Basic Circuit Identities <basic-circuit-identities>

Just having some qubits is not enough: We also need to manipulate them.
All possible ways of doing this can be compiled down to a basic set of
operations, known as quantum gates.

Typically, the gates that can be directly implemented in hardware will
act only on one or two qubits. In our circuits, we may want to use
complex gates that act on a great number of qubits. Fortunately, this
will not be a problem. With the one and two qubit gates given to us by
the hardware, it is possible to build any other gate.

In this chapter we will first introduce the most basic gates, as well as
the mathematics used to describe and analyze them. Then we’ll show how
to prove that these gates can be used to create any possible quantum
algorithm.

The chapter then concludes by looking at small-scale uses of quantum
gates. For example, we see how to build three-qubit gates like the
Toffoli from single- and two-qubit operations.

.. figure:: https://s3.us-south.cloud-object-storage.appdomain.cloud/strapi/640242cc209e48a699164d98922cc60ebasic3.png
   :alt: A Toffoli made from single- and two-qubit gates

