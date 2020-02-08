The Standard Gate Set
=====================

For every possible realization of fault-tolerant quantum computing,
there is a set of quantum operations that are most straightforward to
realize. Often these consist of multiple so-called Clifford gates,
combined with a few single-qubit gates that do not belong to the
Clifford group. In this section we’ll introduce these concepts, in
preparation for showing that they are universal.

Clifford gates
~~~~~~~~~~~~~~

.. raw:: html

   <!-- #region -->

Some of the most important quantum operations are the so-called Clifford
operations. A prominent example is the Hadamard gate:

.. math::


   H = |+\rangle\langle0|~+~ |-\rangle\langle1| = |0\rangle\langle+|~+~ |1\rangle\langle-|.

This gate is expressed above using outer products, as described in the
last section. When expressed in this form, its famous effect becomes
obvious: it takes :math:`|0\rangle`, and rotates it to
:math:`|+\rangle`. More generally, we can say it rotates the basis
states of the z measurement, :math:`\{ |0\rangle,|1\rangle \}`, to the
basis states of the x measurement, :math:`\{ |+\rangle,|-\rangle \}`,
and vice versa.

This effect of the Hadamard is to move information around a qubit. It
swaps any information that would previously be accessed by an x
measurement with that accessed by a z measurement. Indeed, one of the
most important jobs of the Hadamard is to do exactly this. We use it
when wanting to make an x measurement, given that we can only physically
make z measurements.

.. code:: c

   // x measurement of qubit 0
   h q[0];
   measure q[0] -> c[0];

The Hadamard can be combined with other gates to perform different
operations, for example:

.. math::


   H X H = Z,\\\\
   H Z H = X.

By doing a Hadamard before and after an :math:`X`, we cause the action
it previously applied to the z basis states to be transferred to the x
basis states instead. The combined effect is then identical to that of a
:math:`Z`. Similarly, we can create an :math:`X` from Hadamards and a
:math:`Z`.

Similar behavior can be seen for the :math:`S` gate and its Hermitian
conjugate,

.. math::


   S X S^{\dagger} = Y,\\\\
   S Y S^{\dagger} = -X,\\\\
   S Z S^{\dagger} = Z.

This has a similar effect to the Hadamard, except that it swaps
:math:`X` and :math:`Y` instead of :math:`X` and :math:`Z`. In
combination with the Hadamard, we could then make a composite gate that
shifts information between y and z. This therefore gives us full control
over single-qubit Paulis.

The property of transforming Paulis into other Paulis is the defining
feature of Clifford gates. Stated explicitly for the single-qubit case:
if :math:`U` is a Clifford and :math:`P` is a Pauli,
:math:`U P U^{\dagger}` will also be a Pauli. For Hermitian gates, like
the Hadamard, we can simply use :math:`U P U`.

Further examples of single-qubit Clifford gates are the Paulis
themselves. These do not transform the Pauli they act on. Instead, they
simply assign a phase of :math:`-1` to the two that they anticommute
with. For example,

.. math::


   Z X Z = -X,\\\\
   Z Y Z = -Y,\\\\
   Z Z Z= ~~~~Z.

You may have noticed that a similar phase also arose in the effect of
the :math:`S` gate. By combining this with a Pauli, we could make a
composite gate that would cancel this phase, and swap :math:`X` and
:math:`Y` in a way more similar to the Hadamard’s swap of :math:`X` and
:math:`Z`.

For multiple-qubit Clifford gates, the defining property is that they
transform tensor products of Paulis to other tensor products of Paulis.
For example, the most prominent two-qubit Clifford gate is the CNOT. The
property of this that we will make use of in this chapter is

.. math::


   { CX}_{j,k}~ (X \otimes 1)~{ CX}_{j,k} = X \otimes X.

This effectively ‘copies’ an :math:`X` from the control qubit over to
the target.

The process of sandwiching a matrix between a unitary and its Hermitian
conjugate is known as conjugation by that unitary. This process
transforms the eigenstates of the matrix, but leaves the eigenvalues
unchanged. The reason why conjugation by Cliffords can transform between
Paulis is because all Paulis share the same set of eigenvalues.

Non-Clifford gates
~~~~~~~~~~~~~~~~~~

The Clifford gates are very important, but they are not powerful on
their own. In order to do any quantum computation, we need gates that
are not Cliffords. Three important examples are arbitrary rotations
around the three axes of the qubit, :math:`R_x(\theta)`,
:math:`R_y(\theta)` and :math:`R_z(\theta)`.

Let’s focus on :math:`R_x(\theta)`. As we saw in the last section, any
unitary can be expressed in an exponential form using a Hermitian
matrix. For this gate, we find

.. math::


   R_x(\theta) = e^{i \frac{\theta}{2} X}.

The last section also showed us that the unitary and its corresponding
Hermitian matrix have the same eigenstates. In this section, we’ve seen
that conjugation by a unitary transforms eigenstates and leaves
eigenvalues unchanged. With this in mind, it can be shown that

.. math::


   U R_x(\theta)U^\dagger = e^{i \frac{\theta}{2} ~U X U^\dagger}.

By conjugating this rotation by a Clifford, we can therefore transform
it to the same rotation around another axis. So even if we didn’t have a
direct way to perform :math:`R_y(\theta)` and :math:`R_z(\theta)`, we
could do it with :math:`R_x(\theta)` combined with Clifford gates. This
technique of boosting the power of non-Clifford gates by combining them
with Clifford gates is one that we make great use of in quantum
computing.

Certain examples of these rotations have specific names. Rotations by
:math:`\theta = \pi` around the x, y and z axes are X, Y and Z,
respectively. Rotations by :math:`\theta = \pm \pi/2` around the z axis
are :math:`S` and :math:`S^†`, and rotations by
:math:`\theta = \pm \pi/4` around the z axis are :math:`T` and
:math:`T^†`.

Composite gates
~~~~~~~~~~~~~~~

As another example of combining :math:`R_x(\theta)` with Cliffords,
let’s conjugate it with a CNOT.

.. math::


   CX_{j,k} ~(R_x(\theta) \otimes 1)~ CX_{j,k} = CX_{j,k} ~ e^{i \frac{\theta}{2} ~ (X\otimes 1)}~ CX_{j,k} = e^{i \frac{\theta}{2} ~CX_{j,k} ~ (X\otimes 1)~ CX_{j,k}} = e^{i \frac{\theta}{2} ~ X\otimes X}

This transforms our simple, single-qubit rotation into a much more
powerful two-qubit gate. This is not just equivalent to performing the
same rotation independently on both qubits. Instead, it is a gate
capable of generating and manipulating entangled states.

We needn’t stop there. We can use the same trick to extend the operation
to any number of qubits. All that’s needed is more conjugates by the
CNOT to keep copying the :math:`X` over to new qubits.

Furthermore, we can use single-qubit Cliffords to transform the Pauli on
different qubits. For example, in our two-qubit example we could
conjugate by :math:`S` on the qubit on the left to turn the :math:`X`
there into a :math:`Y`:

.. math::


   S ~e^{i \frac{\theta}{2} ~ X\otimes X}~S^\dagger = e^{i \frac{\theta}{2} ~ X\otimes Y}.

With these techniques, we can make complex entangling operations that
act on any arbitrary number of qubits, of the form

.. math::


   U = e^{i\frac{\theta}{2} ~ P_{n-1}\otimes P_{n-2}\otimes...\otimes P_0}, ~~~ P_j \in \{I,X,Y,Z\}.

This all goes to show that combining the single and two-qubit Clifford
gates with rotations around the x axis gives us a powerful set of
possibilities. What’s left to demonstrate is that we can use them to do
anything.
