States for Many Qubits
======================

.. code:: ipython3

    from qiskit import *

Introduction
~~~~~~~~~~~~

We’ve already seen how to write down the state of a single qubit. Now we
can look at how to do it when we have more than just one.

Let’s start by looking at bits. The state of a single bit is expressed
as ``0`` or ``1``. For two bits we can have ``00``, ``01``, ``10`` or
``11``, where each digit tells us the state of one of the bits. For more
bits, we just use longer strings of bit values, known as ‘bit strings’.

The conversion to qubits is quite straightforward: we simply put a
:math:`|` and :math:`\rangle` around bit strings. For example, to
describe two qubits, both of which are in state :math:`|0\rangle`, we
write :math:`|00\rangle`. The four possible bit strings for two bits are
then converted into four orthogonal states, which together completely
specify the state of two qubits:

.. math::

   |a\rangle = a_{00}|00\rangle+ a_{01}|01\rangle+a_{10}|10\rangle+ a_{11}|11\rangle = \begin{pmatrix} a_{00} \\\\ a_{01} \\\\ a_{10} \\\\ a_{11} \end{pmatrix}.

 As in the single-qubit case, the elements of this vector are complex
numbers. We require the state to be normalized so that
:math:`\langle a|a\rangle = 1`, and probabilites are given by the Born
rule (:math:`p_{00}^{zz} = |\langle00|a\rangle |^2`, etc).

When designing quantum software, there are times when we will want to
look at the state of our qubits. This can be done in Qiskit using the
‘statevector simulator’.

For example, here is the state vector for a simple circuit on two
qubits.

.. code:: ipython3

    # set up circuit (no measurements required)
    qc = QuantumCircuit(2)
    qc.h(0)
    qc.h(1)
    qc.rz(3.14/4,1)
    
    # set up simulator that returns statevectors
    backend = Aer.get_backend('statevector_simulator')
    
    # run the circuit to get the state vector
    state = execute(qc,backend).result().get_statevector()
    
    # now we use some fanciness to display it in latex
    from IPython.display import display, Markdown, Latex
    def state2latex(state):
        state_latex = '\\begin{pmatrix}'
        for amplitude in state:
            state_latex += str(amplitude) + '\\\\'
        state_latex  = state_latex[0:-4]
        state_latex += '\end{pmatrix}'
        display(Markdown(state_latex))
    
    state2latex(state)



.. raw:: latex

   \begin{pmatrix}(0.5000000000000001+0j)\\(0.5+0j)\\(0.3536941345835999+0.353412590552683j)\\(0.35369413458359983+0.3534125905526829\end{pmatrix}


Note that Python uses :math:`j` to denote :math:`\sqrt{-1}`, rather than
:math:`i` as we use.

The tensor product
~~~~~~~~~~~~~~~~~~

Suppose we have two qubits, with one in state
:math:`|a\rangle = a_0 |0\rangle + a_1 |1\rangle` and the other in state
:math:`|b\rangle = b_0 |0\rangle + b_1 |1\rangle`, and we want to create
the two-qubit state that describes them both.

To see how to do this, we can use the Born rule as a guide. We know that
the probability of getting a ``0`` is :math:`| a_0 |^2` for one qubit
and :math:`| b_0 |^2` for the other. The probability of getting ``00``
is therefore :math:`| a_0 |^2 | b_0 |^2 = | a_0 b_0 |^2`. Working
backwards from this probability, it makes sense for the
:math:`|00\rangle` state to have the amplitude :math:`a_{0}b_0`.
Repeating this principle, the whole state becomes.

$$a_{0}b_0|00:raw-latex:`\rangle`+
a_{0}b_1|01:raw-latex:`\rangle`+a_{1}b_0|10:raw-latex:`\rangle`+
a_{1}b_1|11:raw-latex:`\rangle`.

$$

This is exactly the result we would get when using the ‘tensor product’
[1], which is a standard method for combining vectors and matrices in a
way that preserves all the information they contain. Using the notation
of the tensor product, we can write this state as
:math:`|a\rangle \otimes |b\rangle`.

We also make use of the tensor product to represent the action of
single-qubit matrices on these multiqubit vectors. For example, here’s
an :math:`X` that acts only on the qubit on the right:

.. math::

   I \otimes X=  \begin{pmatrix} 1&0 \\\\ 0&1 \end{pmatrix} \otimes \begin{pmatrix} 0&1 \\\\ 1&0 \end{pmatrix} = \begin{pmatrix} 0&1&0&0 \\\\ 1&0&0&0\\\\0&0&0&1\\\\0&0&1&0 \end{pmatrix}, ~~~ I= \begin{pmatrix} 1&0 \\\\ 0&1 \end{pmatrix}.

 This was made by combining the :math:`X` matrix for the qubit on the
right with the single-qubit identity operator, :math:`I`, for the qubit
on the left. The identity operator is the unique operator that does
absolutely nothing to a vector. The two-qubit operation resulting from
the tensor product allows us to calculate expectation values for x
measurements of the qubit on the left, in exactly the same way as
before.

Entangled states
~~~~~~~~~~~~~~~~

Using the tensor product we can construct matrices such as
:math:`X \otimes X`, :math:`Z \otimes Z`, :math:`Z \otimes X`, and so
on. The expectation values of these also represent probabilities. For
example, for a general two qubit state :math:`|a\rangle`,

.. math::

   \langle a|Z\otimes Z|a\rangle = P^{zz}_{0} - P^{zz}_{1}.

 The :math:`zz` in :math:`P^{zz}_{0}` and :math:`P^{zz}_{1}` refers to
the fact that these probabilities describe the outcomes when a z
measurement is made on both qubits. A quantity such as
:math:`\langle a|Z\otimes X|a\rangle` will reflect similar probabilities
for different choices of measurements on the qubits.

The :math:`0` and :math:`1` of :math:`P^{zz}_{0}` and :math:`P^{zz}_{1}`
refer to whether there are an even (for :math:`0`) or odd (for
:math:`1`) number of ``1`` outcomes in the output. So :math:`P^{zz}_{0}`
is the probability that the result is either ``00`` or ``11``, and
:math:`P^{zz}_{1}` is the probability that the result is either ``01``
or ``10``.

These multiqubit Pauli operators can be used to analyze a new kind of
state, that cannot be described as a simple tensor product of two
independent qubit states. For example,

.. math::

   |\Phi^+\rangle =\frac{1}{\sqrt{2}}\left(|00\rangle+|11\rangle\right).

 This represents a quantum form of correlated state, known as an
entangled state. The correlations can be easily seen from the fact that
only the ``00`` and ``11`` outcomes are possible when making z
measurements of both qubits, and so the outcomes of these measurements
will always agree. This can also be seen from the fact that

.. math::


   \langle \Phi^+|Z\otimes Z|\Phi^+\rangle = 1, \quad \therefore P^{zz}_{0} = 1 .

 These aren’t the only correlations in this state. If you use x
measurements, you’d find that the results still always agree. For y
measurements, they always disagree. So we find that
:math:`\langle \Phi^+|X\otimes X|\Phi^+\rangle = 1` and
:math:`\langle \Phi^+|Y\otimes Y|\Phi^+\rangle = -1`. There are a lot of
correlations in this little state!

For more qubits, we can get ever larger multiqubit Pauli operators. In
this case, the probabilities such as :math:`P^{zz\ldots zz}_{0}` and
:math:`P^{zz\ldots zz}_{1}` are understood in the same way as for two
qubits: they reflect the cases where the total output bit string
consists of an even or odd number of ``1``\ s, respectively. We can use
these to quantify even more complex correlations.

The generation of complex entangled states is a neccessary part of
gaining a quantum advantage. The use of large vectors and multiqubit
correlation functions is therefore important if we want to
mathematically analyze what our qubits are doing.

References
~~~~~~~~~~

[1] For more on tensor products, see: Michael A. Nielsen and Isaac L.
Chuang. 2011. *Quantum Computation and Quantum Information: 10th
Anniversary Edition (10th ed.).* Cambridge University Press: New York,
NY, USA.

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


