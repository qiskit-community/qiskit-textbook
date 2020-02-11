Quantum Gates
=============

.. code:: ipython3

    from qiskit import *

To manipulate an input state we need to apply the basic operations of
quantum computing. These are known as quantum gates. Here we’ll give an
introduction to some of the most fundamental gates in quantum computing.
Most of those we’ll be looking at act only on a single qubit. This means
that their actions can be understood in terms of the Bloch sphere.

The Pauli operators
~~~~~~~~~~~~~~~~~~~

The simplest quantum gates are the Paulis: :math:`X`, :math:`Y` and
:math:`Z`. Their action is to perform a half rotation of the Bloch
sphere around the x, y and z axes. They therefore have effects similar
to the classical NOT gate or bit-flip. Specifically, the action of the
:math:`X` gate on the states :math:`|0\rangle` and :math:`|1\rangle` is

.. math::

   X |0\rangle = |1\rangle,\\\\ X |1\rangle = |0\rangle.

 The :math:`Z` gate has a similar effect on the states :math:`|+\rangle`
and :math:`|-\rangle`:

.. math::

   Z |+\rangle = |-\rangle, \\\\ Z |-\rangle = |+\rangle.

 These gates are implemented in Qiskit as follows (assuming a circuit
named ``qc``).

.. code:: python

   qc.x(0) # x on qubit 0
   qc.y(0) # y on qubit 0
   qc.z(0) # z on qubit 0

The matrix representations of these gates have already been shown in a
previous section.

.. math::

   X= \begin{pmatrix} 0&1 \\\\ 1&0 \end{pmatrix}\\\\
   Y= \begin{pmatrix} 0&-i \\\\ i&0 \end{pmatrix}\\\\
   Z= \begin{pmatrix} 1&0 \\\\ 0&-1 \end{pmatrix}

 There, their job was to help us make calculations regarding
measurements. But since these matrices are unitary, and therefore define
a reversible quantum operation, this additional interpretation of them
as gates is also possible.

Note that here we referred to these gates as :math:`X`, :math:`Y` and
:math:`Z` and ``x``, ``y`` and ``z``, depending on whether we were
talking about their matrix representation or the way they are written in
Qiskit. Typically we will use the style of :math:`X`, :math:`Y` and
:math:`Z` when referring to gates in text or equations, and ``x``, ``y``
and ``z`` when writing Qiskit code.

Hadamard and S
~~~~~~~~~~~~~~

The Hadamard gate is one that we’ve already used. It’s a key component
in performing an x measurement:

.. code:: python

   measure_x = QuantumCircuit(1,1)
   measure_x.h(0);
   measure_x.measure(0,0);

Like the Paulis, the Hadamard is also a half rotation of the Bloch
sphere. The difference is that it rotates around an axis located halfway
between x and z. This gives it the effect of rotating states that point
along the z axis to those pointing along x, and vice versa.

.. math::

   H |0\rangle = |+\rangle, \, \, \, \, H |1\rangle = |-\rangle,\\\\
   H |+\rangle = |0\rangle, \, \, \, \, H |-\rangle = |1\rangle.

 This effect makes it an essential part of making x measurements, since
the hardware behind quantum computing typically only allows the z
measurement to be performed directly. By moving x basis information to
the z basis, it allows an indirect measurement of x.

The property that $H \|0:raw-latex:`\rangle `= \|+:raw-latex:`\rangle `$
also makes the Hadamard our primary means of generating superposition
states. Its matrix form is

.. math::

   H = \frac{1}{\sqrt{2}} \begin{pmatrix} 1&1 \\\\ 1&-1 \end{pmatrix}.

 The :math:`S` and :math:`S^\dagger` gates have a similar role to play
in quantum computation.

.. code:: python

   qc.s(0) # s gate on qubit 0
   qc.sdg(0) # s† on qubit 0

They are quarter turns of the Bloch sphere around the z axis, and so can
be regarded as the two possible square roots of the :math:`Z` gate,

.. math::

   S = \begin{pmatrix} 1&0 \\\\ 0&i \end{pmatrix}, \, \, \, \, S^\dagger = \begin{pmatrix} 1&0 \\\\ 0&-i \end{pmatrix}.

 The effect of these gates is to rotate between the states of the x and
y bases.

.. math::

   S |+\rangle = |\circlearrowright\rangle, \, \, \, \, S |-\rangle = |\circlearrowleft\rangle,\\\\
   S^\dagger |\circlearrowright\rangle = |+\rangle, \, \, \, \, S^\dagger |\circlearrowleft\rangle = |-\rangle.

 They are therefore used as part of y measurements.

.. code:: python

   measure_y = QuantumCircuit(1,1)
   measure_y.sdg(0)
   measure_y.h(0)
   measure_y.measure(0,0);

The :math:`H`, :math:`S` and :math:`S^\dagger` gates, along with the
Paulis, form the so-called ‘Clifford group’ for a single qubit, which
will be discussed more in later sections. These gates are extremely
useful for many tasks in making and manipulating superpositions, as well
as facilitating different kinds of measurements. But to unlock the full
potential of qubits, we need the next set of gates.

Other single-qubit gates
~~~~~~~~~~~~~~~~~~~~~~~~

We’ve already seen the :math:`X`, :math:`Y` and :math:`Z` gates, which
are rotations around the x , y and z axes by a specific angle. More
generally we can extend this concept to rotations by an arbitrary angle
:math:`\theta`. This gives us the gates :math:`R_x(\theta)`,
:math:`R_y(\theta)` and :math:`R_z(\theta)`. The angle is expressed in
radians, so the Pauli gates correspond to :math:`\theta=\pi` . Their
square roots require half this angle, :math:`\theta=\pm \pi/2`, and so
on.

In Qasm, these rotations can be implemented with ``rx``, ``ry``, and
``rz`` as follows.

.. code:: python

   qc.rx(theta,0) # rx rotation on qubit 0
   qc.ry(theta,0) # ry rotation on qubit 0
   qc.rz(theta,0) # rz rotation on qubit 0

Two specific examples of :math:`R_z(\theta)` have their own names: those
for :math:`\theta=\pm \pi/4`. These are the square roots of :math:`S`,
and are known as :math:`T` and :math:`T^\dagger`.

.. code:: python

   qc.t(0) # t gate on qubit 0
   qc.tdg(0) # t† on qubit 1

Their matrix form is

.. math::

   T = \begin{pmatrix} 1&0 \\\\ 0&e^{i\pi/4}\end{pmatrix}, \, \, \, \, T^\dagger = \begin{pmatrix} 1&0 \\\\ 0&e^{-i\pi/4} \end{pmatrix}.

All single-qubit operations are compiled down to gates known as
:math:`U_1` , :math:`U_2` and :math:`U_3` before running on real IBM
quantum hardware. For that reason they are sometimes called the
*physical gates*. Let’s have a more detailed look at them. The most
general is

.. math::

   U_3(\theta,\phi,\lambda) = \begin{pmatrix} \cos(\theta/2) & -e^{i\lambda}\sin(\theta/2) \\\\ e^{i\phi}\sin(\theta/2) 
   & e^{i\lambda+i\phi}\cos(\theta/2) \end{pmatrix}.

 This has the effect of rotating a qubit in the initial
:math:`|0\rangle` state to one with an arbitrary superposition and
relative phase:

.. math::

   U_3|0\rangle = \cos(\theta/2)|0\rangle + \sin(\theta/2)e^{i\phi}|1\rangle.

 The :math:`U_1` gate is known as the phase gate and is essentially the
same as :math:`R_z(\lambda)`. Its relationship with :math:`U_3` and its
matrix form are,

.. math::

   U_1(\lambda) = U_3(0,0,\lambda) = \begin{pmatrix} 1 & 0 \\\\ 0 & e^{i\lambda} \end{pmatrix}.

 In IBM Q hardware, this gate is implemented as a frame change and takes
zero time.

The second gate is :math:`U_2`, and has the form

.. math::

   U_2(\phi,\lambda) = U_3(\pi/2,\phi,\lambda) = \frac{1}{\sqrt{2}}\begin{pmatrix} 1 & -e^{i\lambda} \\\\ e^{i\phi} & e^{i\lambda+i\phi} \end{pmatrix}.

 From this gate, the Hadamard is done by :math:`H= U_2(0,\pi)`. In IBM Q
hardware, this is implemented by a pre- and post-frame change and an
:math:`X_{\pi/2}` pulse.

Multiqubit gates
~~~~~~~~~~~~~~~~

To create quantum algorithms that beat their classical counterparts, we
need more than isolated qubits. We need ways for them to interact. This
is done by multiqubit gates.

The most prominent multiqubit gates are the two-qubit CNOT and the
three-qubit Toffoli. These have already been introduced in ‘The atoms of
computation’. They essentially perform reversible versions of the
classical XOR and AND gates, respectively.

.. code:: python

   qc.cx(0,1) # CNOT controlled on qubit 0 with qubit 1 as target
   qc.ccx(0,1,2) # Toffoli controlled on qubits 0 and 1 with qubit 2 as target

Note that the CNOT is referred to as ``cx`` in Qiskit.

We can also interpret the CNOT as performing an :math:`X` on its target
qubit, but only when its control qubit is in state :math:`|1\rangle`,
and doing nothing when the control is in state :math:`|0\rangle`. With
this interpretation in mind, we can similarly define gates that work in
the same way, but instead peform a :math:`Y` or :math:`Z` on the target
qubit depending on the :math:`|0\rangle` and :math:`|1\rangle` states of
the control.

.. code:: python

   qc.cy(0,1) # controlled-Y, controlled on qubit 0 with qubit 1 as target
   qc.cz(0,1) # controlled-Z, controlled on qubit 0 with qubit 1 as target

The Toffoli gate can be interpreted in a similar manner, except that it
has a pair of control qubits. Only if both are in state
:math:`|1\rangle` is the :math:`X` applied to the target.

Composite gates
~~~~~~~~~~~~~~~

When we combine gates, we make new gates. If we want to see the matrix
representation of these, we can use the ‘unitary simulator’ of Qiskit.

For example, let’s try something simple: a two qubit circuit with an
``x`` applied to one and a ``z`` to the other. Using tensor products, we
can expect the result to be,

.. math::

   Z \otimes X=  \begin{pmatrix} 1&0 \\\\ 0&-1 \end{pmatrix} \otimes \begin{pmatrix} 0&1 \\\\ 1&0 \end{pmatrix} = \begin{pmatrix} 0&1&0&0 \\\\ 1&0&0&0\\\\0&0&0&-1\\\\0&0&-1&0 \end{pmatrix}.

 This is exactly what we find when we analyze the circuit with this
tool.

.. code:: ipython3

    # set up circuit (no measurements required)
    qc = QuantumCircuit(2)
    qc.x(0) # qubits numbered from the right, so qubit 0 is the qubit on the right
    qc.z(1) # and qubit 1 is on the left
    
    # set up simulator that returns unitary matrix
    backend = Aer.get_backend('unitary_simulator')
    
    # run the circuit to get the matrix
    gate = execute(qc,backend).result().get_unitary()
    
    # now we use some fanciness to display it in latex
    from IPython.display import display, Markdown, Latex
    gate_latex = '\\begin{pmatrix}'
    for line in gate:
        for element in line:
            gate_latex += str(element) + '&'
        gate_latex  = gate_latex[0:-1]
        gate_latex +=  '\\\\'
    gate_latex  = gate_latex[0:-2]
    gate_latex += '\end{pmatrix}'
    display(Markdown(gate_latex))



.. raw:: latex

   \begin{pmatrix}0j&(1+0j)&0j&0j\\(1+0j)&0j&0j&0j\\0j&0j&0j&(-1+0j)\\0j&0j&(-1+0j)&0j\end{pmatrix}


.. code:: ipython3

    import qiskit
    qiskit.__qiskit_version__




.. parsed-literal::

    {'qiskit-terra': '0.11.1',
     'qiskit-aer': '0.3.4',
     'qiskit-ignis': '0.2.0',
     'qiskit-ibmq-provider': '0.4.5',
     'qiskit-aqua': '0.6.2',
     'qiskit': '0.14.1'}


