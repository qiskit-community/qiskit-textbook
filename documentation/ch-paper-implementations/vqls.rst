.. raw:: html

.. contents:: Contents
   :local:

   <h1>

The Variational Quantum Linear Solver

.. raw:: html

   </h1>

.. code:: ipython3

    import qiskit
    from qiskit import QuantumCircuit, QuantumRegister, ClassicalRegister
    from qiskit import Aer, execute
    import math
    import random
    import numpy as np
    from scipy.optimize import minimize
    %config InlineBackend.figure_format = 'svg' # Makes the images look nice

**Introduction**

The Variational Quantum Linear Solver, or the VQLS is a variational
quantum algorithm that utilizes VQE in order to solve systems of linear
equations more efficiently than classical computational algortihms.
Specifically, if we are given some matrix :math:`\textbf{A}`, such that
:math:`\textbf{A} |\textbf{x}\rangle \ = \ |\textbf{b}\rangle`, where
:math:`|\textbf{b}\rangle` is some known vector, the VQLS algorithm is
theoretically able to find a normalized :math:`|x\rangle` that is
proportional to :math:`|\textbf{x}\rangle`, which makes the above
relationship true.

The output of this algorithm is identical to that of the HHL Quantum
Linear-Solving Algorithm, except, while HHL provides a much more
favourable computation speedup over VQLS, the variational nature of our
algorithm allows for it to be performed on NISQ quantum computers, while
HHL would require much more robust quantum hardware, and many more
qubits.

**The Algorithm**

To begin, the inputs into this algorithm are evidently the matrix
:math:`\textbf{A}`, which we have to decompose into a linear combination
of unitaries with complex coefficients:

.. math:: A \ = \ \displaystyle\sum_{n} c_n \ A_n

Where each :math:`A_n` is some unitary, and some unitary :math:`U` that
prepares state :math:`|\textbf{b}\rangle` from :math:`|0\rangle`. Now,
recall the general structure of a variational quantum algorithm. We have
to construct a quantum cost function, which can be evaluated with a
low-depth parametrized quantum circuit, then output to the classical
optimizer. This allows us to search a parameter space for some set of
parameters :math:`\alpha`, such that
:math:`|\psi(\alpha)\rangle \ = \ \frac{|\textbf{x}\rangle}{|| \textbf{x} ||}`,
where :math:`|\psi(k)\rangle` is the output of out quantum circuit
corresponding to some parameter set :math:`k`.

Before we actually begin constructing the cost function, let’s take a
look at a “high level” overview of the sub-routines within this
algorithm, as illustrated in this image from the original paper:

.. figure:: images/bro.png
   :alt: alt text


So essentially, we start off with a qubit register, with each qubit
initialized to :math:`|0\rangle`. Our algorithm takes its inputs, then
prepares and evaluates the cost function, starting with the creation of
some ansatz :math:`V(\alpha)`. If the computed cost is greater than some
parameter :math:`\gamma`, the algorithm is run again with updated
parameters, and if not, the algorithm terminates, and the ansatz is
calculated with the optimal parameters (determined at termination). This
gives us the state vector that minimizes our cost function, and
therefore the normalized form of :math:`|\textbf{x}\rangle`.

Let’s start off by considering the ansatz :math:`V(\alpha)`, which is
just a circuit that prepares some arbitrary state
:math:`|\psi(k)\rangle`. This allows us to “search” the state space by
varying some set of parameters, :math:`k`. Anyways, the ansatz that we
will use for this implementation is given as follows:

.. code:: ipython3

    def apply_fixed_ansatz(qubits, parameters):
    
        for iz in range (0, len(qubits)):
            circ.ry(parameters[0][iz], qubits[iz])
    
        circ.cz(qubits[0], qubits[1])
        circ.cz(qubits[2], qubits[0])
    
        for iz in range (0, len(qubits)):
            circ.ry(parameters[1][iz], qubits[iz])
    
        circ.cz(qubits[1], qubits[2])
        circ.cz(qubits[2], qubits[0])
    
        for iz in range (0, len(qubits)):
            circ.ry(parameters[2][iz], qubits[iz])
    
    circ = QuantumCircuit(3)
    apply_fixed_ansatz([0, 1, 2], [[1, 1, 1], [1, 1, 1], [1, 1, 1]])
    circ.draw(output='mpl')




.. image:: vqls_files/vqls_5_0.svg



This is called a **fixed hardware ansatz**: the configuration of quantum
gates remains the same for each run of the circuit, all that changes are
the parameters. Unlike the QAOA ansatz, it is not composed solely of
Trotterized Hamiltonians. The applications of :math:`Ry` gates allows us
to search the state space, while the :math:`CZ` gates create
“interference” between the different qubit states.

Now, it makes sense for us to consider the actual **cost function**. The
goal of our algorithm will be to minimize cost, so when
:math:`|\Phi\rangle \ = \ \textbf{A} |\psi(k)\rangle` is very close to
:math:`|\textbf{b}\rangle`, we want our cost function’s output to be
very small, and when the vectors are close to being ortohognal, we want
the cost function to be very large. Thus, we introduce the “projection”
Hamiltonian:

.. math:: H_P \ = \ \mathbb{I} \ - \ |b\rangle \langle b|

Where we have:

.. math:: C_P \ = \ \langle \Phi | H_P | \Phi \rangle \ = \ \langle \Phi | (\mathbb{I} \ - \ |b\rangle \langle b|) |\Phi \rangle \ = \ \langle \Phi | \Phi \rangle \ - \ \langle \Phi |b\rangle \langle b | \Phi \rangle

Notice how the second term tells us “how much” of :math:`|\Phi\rangle`
lies along :math:`|b\rangle`. We then subtract this from another number
to get the desired low number when the inner product of
:math:`|\Phi\rangle` and :math:`|b\rangle` is greater (they agree more),
and the opposite for when they are close to being orthogonal. This is
looking good so far! However, there is still one more thing we can do to
increase the accuracy of the algorithm: normalizing the cost function.
This is due to the fact that if :math:`|\Phi\rangle` has a small norm,
then the cost function will still be low, even if it does not agree with
:math:`|\textbf{b}\rangle`. Thus, we replace :math:`|\Phi\rangle` with
:math:`\frac{|\Phi\rangle}{\sqrt{\langle \Phi | \Phi \rangle}}`:

.. math:: \hat{C}_P \ = \ \frac{\langle \Phi | \Phi \rangle}{\langle \Phi | \Phi \rangle} \ - \ \frac{\langle \Phi |b\rangle \langle b | \Phi \rangle}{\langle \Phi | \Phi \rangle} \ = \ 1 \ - \ \frac{\langle \Phi |b\rangle \langle b | \Phi \rangle}{\langle \Phi | \Phi \rangle} \ = \ 1 \ - \ \frac{|\langle b | \Phi \rangle|^2}{\langle \Phi | \Phi \rangle}

Ok, so, we have prepared our state :math:`|\psi(k)\rangle` with the
ansatz. Now, we have two values to calculate in order to evaluate the
cost function, namely :math:`|\langle b | \Phi \rangle|^2` and
:math:`\langle \Phi | \Phi \rangle`. Luckily, a nifty little quantum
subroutine called the **Hadamard Test** allows us to do this!
Essentially, if we have some unitary :math:`U` and some state
:math:`|\phi\rangle`, and we want to find the expectation value of
:math:`U` with respect to the state,
:math:`\langle \phi | U | \phi \rangle`, then we can evaluate the
following circuit:

.. figure:: images/h.png
   :alt: image1


Then, the probability of measuring the first qubit to be :math:`0` is
equal to :math:`\frac{1}{2} (1 \ + \ \text{Re}\langle U \rangle)` and
the probability of measuring :math:`1` is
:math:`\frac{1}{2} (1 \ - \ \text{Re}\langle U \rangle)`, so subtracting
the two probabilities gives us :math:`\text{Re} \langle U \rangle`.
Luckily, the matrices we will be dealing with when we test this
algorithm are completely real, so
:math:`\text{Re} \langle U \rangle \ = \ \langle U \rangle`, for this
specific implementation. Here is how the Hadamard test works. By the
circuit diagram, we have as our general state vector:

.. math:: \frac{|0\rangle \ + \ |1\rangle}{\sqrt{2}} \ \otimes \ |\psi\rangle \ = \ \frac{|0\rangle \ \otimes \ |\psi\rangle \ + \ |1\rangle \ \otimes \ |\psi\rangle}{\sqrt{2}}

Applying our controlled unitay:

.. math:: \frac{|0\rangle \ \otimes \ |\psi\rangle \ + \ |1\rangle \ \otimes \ |\psi\rangle}{\sqrt{2}} \ \rightarrow \ \frac{|0\rangle \ \otimes \ |\psi\rangle \ + \ |1\rangle \ \otimes \ U|\psi\rangle}{\sqrt{2}}

Then applying the Hadamard gate to the first qubit:

.. math:: \frac{|0\rangle \ \otimes \ |\psi\rangle \ + \ |1\rangle \ \otimes \ U|\psi\rangle}{\sqrt{2}} \ \rightarrow \ \frac{1}{2} \ \big[ |0\rangle \ \otimes \ |\psi\rangle \ + \ |1\rangle \ \otimes \ |\psi\rangle \ + \ |0\rangle \ \otimes \ U|\psi\rangle \ - \ |1\rangle \ \otimes \ U|\psi\rangle \big]

.. math:: \Rightarrow \ |0\rangle \ \otimes \ (\mathbb{I} \ + \ U)|\psi\rangle \ + \ |1\rangle \ \otimes \ (\mathbb{I} \ - \ U)|\psi\rangle

When we take a measurement of the first qubit, remember that in order to
find the probability of measuring :math:`0`, we must take the inner
product of the state vector with :math:`|0\rangle`, then multiply by its
complex conjugate (see the quantum mechanics section if you are not
familiar with this). The same follows for the probability of measuring
:math:`1`. Thus, we have:

.. math:: P(0) \ = \ \frac{1}{4} \ \langle \psi | (\mathbb{I} \ + \ U) (\mathbb{I} \ + \ U^{\dagger}) |\psi\rangle \ = \ \frac{1}{4} \ \langle \psi | (\mathbb{I}^2 \ + U \ + \ U^{\dagger} \ + \ U^{\dagger} U) |\psi\rangle \ = \ \frac{1}{4} \ \langle \psi | (2\mathbb{I} \ + U \ + \ U^{\dagger}) |\psi\rangle

.. math:: \Rightarrow \ \frac{1}{4} \Big[ 2 \ + \ \langle \psi | U^{\dagger} | \psi \rangle \ + \ \langle \psi | U | \psi \rangle \Big] \ = \ \frac{1}{4} \Big[ 2 \ + \ (\langle \psi | U | \psi \rangle)^{*} \ + \ \langle \psi | U | \psi \rangle \Big] \ = \ \frac{1}{2} (1 \ + \ \text{Re} \ \langle \psi | U | \psi \rangle)

By a similar procedure, we get:

.. math:: P(1) \ = \ \frac{1}{2} \ (1 \ - \ \text{Re} \ \langle \psi | U | \psi \rangle)

And so, by taking the difference:

.. math:: P(0) \ - \ P(1) \ = \ \text{Re} \ \langle \psi | U | \psi \rangle

Cool! Now, we can actually implement this for the two values we have to
compute. Starting with :math:`\langle \Phi | \Phi \rangle`, we have:

.. math:: \langle \Phi | \Phi \rangle \ = \ \langle \psi(k) | A^{\dagger} A |\psi(k) \rangle \ = \ \langle 0 | V(k)^{\dagger} A^{\dagger} A V(k) |0\rangle \ = \ \langle 0 | V(k)^{\dagger} \Big( \displaystyle\sum_{n} c_n \ A_n \Big)^{\dagger} \Big( \displaystyle\sum_{n} c_n \ A_n \Big) V(k) |0\rangle

.. math:: \Rightarrow \ \langle \Phi | \Phi \rangle \ = \ \displaystyle\sum_{m} \displaystyle\sum_{n} c_m^{*} c_n \langle 0 | V(k)^{\dagger} A_m^{\dagger} A_n V(k) |0\rangle

and so our task becomes computing every possible term
:math:`\langle 0 | V(k)^{\dagger} A_m^{\dagger} A_n V(k) |0\rangle`
using the Hadamard test. This requires us prepare the state
:math:`V(k) |0\rangle`, and then perform controlled operations with some
control-ancilla qubit for the unitary matrices :math:`A_m^{\dagger}` and
:math:`A_n`. We can implement this in code:

.. code:: ipython3

    #Creates the Hadamard test
    
    def had_test(gate_type, qubits, ancilla_index, parameters):
    
        circ.h(ancilla_index)
    
        apply_fixed_ansatz(qubits, parameters)
    
        for ie in range (0, len(gate_type[0])):
            if (gate_type[0][ie] == 1):
                circ.cz(ancilla_index, qubits[ie])
    
        for ie in range (0, len(gate_type[1])):
            if (gate_type[1][ie] == 1):
                circ.cz(ancilla_index, qubits[ie])
        
        circ.h(ancilla_index)
        
    circ = QuantumCircuit(4)
    had_test([[0, 0, 0], [0, 0, 1]], [1, 2, 3], 0, [[1, 1, 1], [1, 1, 1], [1, 1, 1]])
    circ.draw(output='mpl')




.. image:: vqls_files/vqls_7_0.svg



The reason why we are applying two different “gate_types” is because
this represents the pairs of gates shown in the expanded form of
:math:`\langle \Phi | \Phi \rangle`.

It is also important to note that for the purposes of this
implementation (the systems of equations we will actually be sovling, we
are only concerned with the gates :math:`Z` and :math:`\mathbb{I}`, so I
only include support for these gates (The code includes number
“identifiers” that signify the application of different gates, :math:`0`
for :math:`\mathbb{I}` and :math:`1` for :math:`Z`).

Now, we can move on to the second value we must calculate, which is
:math:`|\langle b | \Phi \rangle|^2`. We get:

.. math:: |\langle b | \Phi \rangle|^2 \ = \ |\langle b | A V(k) | 0 \rangle|^2 \ = \ |\langle 0 | U^{\dagger} A V(k) | 0 \rangle|^2 \ = \ \langle 0 | U^{\dagger} A V(k) | 0 \rangle \langle 0 | V(k)^{\dagger} A^{\dagger} U |0\rangle

All we have to do now is the same expansion as before for the product
:math:`\langle 0 | U^{\dagger} A V(k) | 0 \rangle \langle 0 | V(k)^{\dagger} A^{\dagger} U |0\rangle`:

.. math:: \langle 0 | U^{\dagger} A V(k) | 0 \rangle^2 \ = \ \displaystyle\sum_{m} \displaystyle\sum_{n} c_m^{*} c_n \langle 0 | U^{\dagger} A_n V(k) | 0 \rangle \langle 0 | V(k)^{\dagger} A_m^{\dagger} U |0\rangle

Now, again, for the purposes of this demonstration, we will soon see
that all the outputs/expectation values of our implementation will be
real, so we have:

.. math:: \Rightarrow \ \langle 0 | U^{\dagger} A V(k) | 0 \rangle \ = \ (\langle 0 | U^{\dagger} A V(k) | 0 \rangle)^{*} \ = \ \langle 0 | V(k)^{\dagger} A^{\dagger} U |0\rangle

Thus, in this particular implementation:

.. math:: |\langle b | \Phi \rangle|^2 \ = \ \displaystyle\sum_{m} \displaystyle\sum_{n} c_m c_n \langle 0 | U^{\dagger} A_n V(k) | 0 \rangle \langle 0 | U^{\dagger} A_m V(k) | 0 \rangle

There is a sophisticated way of solving for this value, using a
newly-proposed subroutine called the **Hadamard Overlap Test** (see
cited paper), but for this tutorial, we will just be using a standard
Hadamard Test, where we control each matrix. This unfortauntely requires
the use of an extra ancilla qubit. We essentially just place a control
on each of the gates involved in the ancilla, the :math:`|b\rangle`
preparation unitary, and the :math:`A_n` unitaries. We get something
like this for the controlled-ansatz:

.. code:: ipython3

    #Creates controlled anstaz for calculating |<b|psi>|^2 with a Hadamard test
    
    def control_fixed_ansatz(qubits, parameters, ancilla, reg):
    
        for i in range (0, len(qubits)):
            circ.cry(parameters[0][i], qiskit.circuit.Qubit(reg, ancilla), qiskit.circuit.Qubit(reg, qubits[i]))
    
        circ.ccx(ancilla, qubits[1], 4)
        circ.cz(qubits[0], 4)
        circ.ccx(ancilla, qubits[1], 4)
    
        circ.ccx(ancilla, qubits[0], 4)
        circ.cz(qubits[2], 4)
        circ.ccx(ancilla, qubits[0], 4)
    
        for i in range (0, len(qubits)):
            circ.cry(parameters[1][i], qiskit.circuit.Qubit(reg, ancilla), qiskit.circuit.Qubit(reg, qubits[i]))
    
        circ.ccx(ancilla, qubits[2], 4)
        circ.cz(qubits[1], 4)
        circ.ccx(ancilla, qubits[2], 4)
    
        circ.ccx(ancilla, qubits[0], 4)
        circ.cz(qubits[2], 4)
        circ.ccx(ancilla, qubits[0], 4)
    
        for i in range (0, len(qubits)):
            circ.cry(parameters[2][i], qiskit.circuit.Qubit(reg, ancilla), qiskit.circuit.Qubit(reg, qubits[i]))
    
    q_reg = QuantumRegister(5)
    circ = QuantumCircuit(q_reg)
    control_fixed_ansatz([1, 2, 3], [[1, 1, 1], [1, 1, 1], [1, 1, 1]], 0, q_reg)
    circ.draw(output='mpl')




.. image:: vqls_files/vqls_9_0.svg



Notice the extra qubit, ``q0_4``. This is an ancilla, and allows us to
create a :math:`CCZ` gate, as is shown in the circuit. Now, we also have
to create the circuit for :math:`U`. In our implementation, we will pick
:math:`U` as:

.. math:: U \ = \ H_1 H_2 H_3

Thus, we have:

.. code:: ipython3

    def control_b(ancilla, qubits):
    
        for ia in qubits:
            circ.ch(ancilla, ia)
    
    circ = QuantumCircuit(4)
    control_b(0, [1, 2, 3])
    circ.draw(output='mpl')




.. image:: vqls_files/vqls_11_0.svg



Finally, we construct our new Hadamard test:

.. code:: ipython3

    #Create the controlled Hadamard test, for calculating <psi|psi>
    
    def special_had_test(gate_type, qubits, ancilla_index, parameters, reg):
    
        circ.h(ancilla_index)
    
        control_fixed_ansatz(qubits, parameters, ancilla_index, reg)
    
        for ty in range (0, len(gate_type)):
            if (gate_type[ty] == 1):
                circ.cz(ancilla_index, qubits[ty])
    
    
        control_b(ancilla_index, qubits)
        
        circ.h(ancilla_index)
    
    q_reg = QuantumRegister(5)
    circ = QuantumCircuit(q_reg)
    special_had_test([[0, 0, 0], [0, 0, 1]], [1, 2, 3], 0, [[1, 1, 1], [1, 1, 1], [1, 1, 1]], q_reg)
    print(circ)


.. parsed-literal::

                  ┌───┐                                                         »
    q1_0: |0>─────┤ H ├───────■────────────────────■────■────────────────────■──»
             ┌────┴───┴────┐┌─┴─┐┌──────────────┐┌─┴─┐  │                    │  »
    q1_1: |0>┤ U3(0.5,0,0) ├┤ X ├┤ U3(-0.5,0,0) ├┤ X ├──┼────────────────────┼──»
             ├─────────────┤└───┘└──────────────┘└───┘┌─┴─┐┌──────────────┐┌─┴─┐»
    q1_2: |0>┤ U3(0.5,0,0) ├──────────────────────────┤ X ├┤ U3(-0.5,0,0) ├┤ X ├»
             ├─────────────┤                          └───┘└──────────────┘└───┘»
    q1_3: |0>┤ U3(0.5,0,0) ├────────────────────────────────────────────────────»
             └─────────────┘                                                    »
    q1_4: |0>───────────────────────────────────────────────────────────────────»
                                                                                »
    «                                                                      »
    «q1_0: ──■────────────────────■────■───────■────■───────────────────■──»
    «        │                    │    │       │    │                   │  »
    «q1_1: ──┼────────────────────┼────┼───■───┼────■───────────────────■──»
    «        │                    │    │   │   │    │  ┌─────────────┐  │  »
    «q1_2: ──┼────────────────────┼────■───┼───■────┼──┤ U3(0.5,0,0) ├──┼──»
    «      ┌─┴─┐┌──────────────┐┌─┴─┐  │   │   │    │  └─────────────┘  │  »
    «q1_3: ┤ X ├┤ U3(-0.5,0,0) ├┤ X ├──┼───┼───┼────┼─────────■─────────┼──»
    «      └───┘└──────────────┘└───┘┌─┴─┐ │ ┌─┴─┐┌─┴─┐       │       ┌─┴─┐»
    «q1_4: ──────────────────────────┤ X ├─■─┤ X ├┤ X ├───────■───────┤ X ├»
    «                                └───┘   └───┘└───┘               └───┘»
    «                                                                              »
    «q1_0: ─────────────────■────────────────────■────■────────────────────■────■──»
    «      ┌─────────────┐┌─┴─┐┌──────────────┐┌─┴─┐  │                    │    │  »
    «q1_1: ┤ U3(0.5,0,0) ├┤ X ├┤ U3(-0.5,0,0) ├┤ X ├──┼────────────────────┼────┼──»
    «      └─────────────┘└───┘└──────────────┘└───┘┌─┴─┐┌──────────────┐┌─┴─┐  │  »
    «q1_2: ─────────────────────────────────────────┤ X ├┤ U3(-0.5,0,0) ├┤ X ├──┼──»
    «      ┌─────────────┐                          └───┘└──────────────┘└───┘┌─┴─┐»
    «q1_3: ┤ U3(0.5,0,0) ├────────────────────────────────────────────────────┤ X ├»
    «      └─────────────┘                                                    └───┘»
    «q1_4: ────────────────────────────────────────────────────────────────────────»
    «                                                                              »
    «                                                                    »
    «q1_0: ──────────────────■────■───────■───────────────────■───────■──»
    «                        │    │       │                   │       │  »
    «q1_1: ──────────────────┼────┼───────┼───────────────────■───────■──»
    «                        │    │       │  ┌─────────────┐  │       │  »
    «q1_2: ──────────────────┼────┼───■───┼──┤ U3(0.5,0,0) ├──┼───────┼──»
    «      ┌──────────────┐┌─┴─┐  │   │   │  └─────────────┘  │       │  »
    «q1_3: ┤ U3(-0.5,0,0) ├┤ X ├──■───┼───■───────────────────┼───■───┼──»
    «      └──────────────┘└───┘┌─┴─┐ │ ┌─┴─┐               ┌─┴─┐ │ ┌─┴─┐»
    «q1_4: ─────────────────────┤ X ├─■─┤ X ├───────────────┤ X ├─■─┤ X ├»
    «                           └───┘   └───┘               └───┘   └───┘»
    «                                                                              »
    «q1_0: ─────────────────■────────────────────■────■────────────────────■────■──»
    «      ┌─────────────┐┌─┴─┐┌──────────────┐┌─┴─┐  │                    │    │  »
    «q1_1: ┤ U3(0.5,0,0) ├┤ X ├┤ U3(-0.5,0,0) ├┤ X ├──┼────────────────────┼────┼──»
    «      └─────────────┘└───┘└──────────────┘└───┘┌─┴─┐┌──────────────┐┌─┴─┐  │  »
    «q1_2: ─────────────────────────────────────────┤ X ├┤ U3(-0.5,0,0) ├┤ X ├──┼──»
    «      ┌─────────────┐                          └───┘└──────────────┘└───┘┌─┴─┐»
    «q1_3: ┤ U3(0.5,0,0) ├────────────────────────────────────────────────────┤ X ├»
    «      └─────────────┘                                                    └───┘»
    «q1_4: ────────────────────────────────────────────────────────────────────────»
    «                                                                              »
    «                                          ┌───┐
    «q1_0: ──────────────────■────■────■────■──┤ H ├
    «                        │  ┌─┴─┐  │    │  └───┘
    «q1_1: ──────────────────┼──┤ H ├──┼────┼───────
    «                        │  └───┘┌─┴─┐  │       
    «q1_2: ──────────────────┼───────┤ H ├──┼───────
    «      ┌──────────────┐┌─┴─┐     └───┘┌─┴─┐     
    «q1_3: ┤ U3(-0.5,0,0) ├┤ X ├──────────┤ H ├─────
    «      └──────────────┘└───┘          └───┘     
    «q1_4: ─────────────────────────────────────────
    «                                               


This is for the specific implementation when all of our parameters are
set to :math:`1`, and the set of gates :math:`A_n` is simply
``[0, 0, 0]``, and ``[0, 0, 1]``, which corresponds to the identity
matrix on all qubits, as well as the :math:`Z` matrix on the third qubit
(with my “code notation”).

Now, we are ready to calculate the final cost function. This simply
involves us taking the products of all combinations of the expectation
outputs from the different circuits, multiplying by their respective
coefficients, and arranging into the cost function that we discussed
previously!

.. code:: ipython3

    #Implements the entire cost function on the quantum circuit
    
    def calculate_cost_function(parameters):
        
        global opt
    
        overall_sum_1 = 0
        
        parameters = [parameters[0:3], parameters[3:6], parameters[6:9]]
    
        for i in range(0, len(gate_set)):
            for j in range(0, len(gate_set)):
    
                global circ
    
                qctl = QuantumRegister(5)
                qc = ClassicalRegister(5)
                circ = QuantumCircuit(qctl, qc)
    
                backend = Aer.get_backend('statevector_simulator')
                
                multiply = coefficient_set[i]*coefficient_set[j]
    
                had_test([gate_set[i], gate_set[j]], [1, 2, 3], 0, parameters)
    
                job = execute(circ, backend)
    
                result = job.result()
                outputstate = np.real(result.get_statevector(circ, decimals=100))
                o = outputstate
    
                m_sum = 0
                for l in range (0, len(o)):
                    if (l%2 == 1):
                        n = o[l]**2
                        m_sum+=n
    
                overall_sum_1+=multiply*(1-(2*m_sum))
    
        overall_sum_2 = 0
    
        for i in range(0, len(gate_set)):
            for j in range(0, len(gate_set)):
    
                multiply = coefficient_set[i]*coefficient_set[j]
                mult = 1
    
                for extra in range(0, 2):
    
                    qctl = QuantumRegister(5)
                    qc = ClassicalRegister(5)
                    circ = QuantumCircuit(qctl, qc)
    
                    backend = Aer.get_backend('statevector_simulator')
    
                    if (extra == 0):
                        special_had_test(gate_set[i], [1, 2, 3], 0, parameters, qctl)
                    if (extra == 1):
                        special_had_test(gate_set[j], [1, 2, 3], 0, parameters, qctl)
    
                    job = execute(circ, backend)
    
                    result = job.result()
                    outputstate = np.real(result.get_statevector(circ, decimals=100))
                    o = outputstate
    
                    m_sum = 0
                    for l in range (0, len(o)):
                        if (l%2 == 1):
                            n = o[l]**2
                            m_sum+=n
                    mult = mult*(1-(2*m_sum))
    
                overall_sum_2+=multiply*mult
                
        print(1-float(overall_sum_2/overall_sum_1))
    
        return 1-float(overall_sum_2/overall_sum_1)

This code may look long and daunting, but it isn’t! In this simulation,
I’m taking a **numerical** approach, where I’m calculating the amplitude
squared of each state corresponding to a measurement of the ancilla
Hadamard test qubit in the :math:`1` state, then calculating
:math:`P(0) \ - \ P(1) \ = \ 1 \ - \ 2P(1)` with that information. This
is very exact, but is not realistic, as a real quantum device would have
to sample the circuit many times to generate these probabilities (I’ll
discuss sampling later). In addition, this code is not completely
optimized (it completes more evaluations of the quantum circuit than it
has to), but this is the simplest way in which the code can be
implemented, and I will be optimizing it in an update to thiss tutorial
in the near future.

The final step is to actually use this code to solve a real linear
system. We will first be looking at the example:

.. math:: A \ = \ 0.45 Z_3 \ + \ 0.55 \mathbb{I}

In order to minimize the cost function, we use the COBYLA optimizer
method, which we repeatedly applying. Our search space for parameters is
determined by :math:`\frac{k}{1000} \ k \ \in \ \{0, \ 3000\}`, which is
initially chosen randomly. We will run the optimizer for :math:`200`
steps, then terminate and apply the ansatz for our optimal parameters,
to get our optimized state vector! In addition, we will compute some
post-processing, to see if our algorithm actually works! In order to do
this, we will apply :math:`A` to our optimal vector
:math:`|\psi\rangle_o`, normalize it, then calculate the inner product
squared of this vector and the solution vector, :math:`|b\rangle`! We
can put this all into code as:

.. code:: ipython3

    coefficient_set = [0.55, 0.45]
    gate_set = [[0, 0, 0], [0, 0, 1]]
    
    out = minimize(calculate_cost_function, x0=[float(random.randint(0,3000))/1000 for i in range(0, 9)], method="COBYLA", options={'maxiter':200})
    print(out)
    
    out_f = [out['x'][0:3], out['x'][3:6], out['x'][6:9]]
    
    circ = QuantumCircuit(3, 3)
    apply_fixed_ansatz([0, 1, 2], out_f)
    
    backend = Aer.get_backend('statevector_simulator')
    
    job = execute(circ, backend)
    
    result = job.result()
    o = result.get_statevector(circ, decimals=10)
    
    a1 = coefficient_set[1]*np.array([[1,0,0,0,0,0,0,0], [0,1,0,0,0,0,0,0], [0,0,1,0,0,0,0,0], [0,0,0,1,0,0,0,0], [0,0,0,0,-1,0,0,0], [0,0,0,0,0,-1,0,0], [0,0,0,0,0,0,-1,0], [0,0,0,0,0,0,0,-1]])
    a2 = coefficient_set[0]*np.array([[1,0,0,0,0,0,0,0], [0,1,0,0,0,0,0,0], [0,0,1,0,0,0,0,0], [0,0,0,1,0,0,0,0], [0,0,0,0,1,0,0,0], [0,0,0,0,0,1,0,0], [0,0,0,0,0,0,1,0], [0,0,0,0,0,0,0,1]])
    a3 = np.add(a1, a2)
    
    b = np.array([float(1/np.sqrt(8)),float(1/np.sqrt(8)),float(1/np.sqrt(8)),float(1/np.sqrt(8)),float(1/np.sqrt(8)),float(1/np.sqrt(8)),float(1/np.sqrt(8)),float(1/np.sqrt(8))])
    
    print((b.dot(a3.dot(o)/(np.linalg.norm(a3.dot(o)))))**2)


.. parsed-literal::

    0.6017174103231802
    0.8452068663805011
    0.7926209980674456
    0.5862481777252873
    0.4744752958517403
    0.6550261087730241
    0.5949737190512439
    0.693770598056454
    0.5619966586351923
    0.8493658077499103
    0.5489278919446864
    0.45661936152179106
    0.4957857928172634
    0.4299653506467377
    0.41243299265080524
    0.3820096469198764
    0.38527929412040784
    0.3485574447310915
    0.10622386683187346
    0.9104468020032959
    0.12192808306316272
    0.3239534161012889
    0.050247910816056174
    0.47311289740939066
    0.09159980576138382
    0.7551186103585631
    0.08168157104819906
    0.05761680499043775
    0.16079143781553318
    0.014954675055753097
    0.15366633057296442
    0.08493703236588146
    0.06430375058539461
    0.06491362913677412
    0.02191577413988144
    0.24850590847841725
    0.014390611745114246
    0.07938166320298434
    0.014560494270461133
    0.0452797208222574
    0.013052625491852154
    0.014181070928444117
    0.023285924584662276
    0.031351680556921946
    0.01696414623728848
    0.008618791280770255
    0.0126408809978803
    0.012902577405942361
    0.010004088999535088
    0.007896188397597759
    0.008268365023776036
    0.010015413449780741
    0.010961503839837183
    0.013474532195497102
    0.008538576128282238
    0.009171100509735575
    0.008473393117828465
    0.007633286540729367
    0.008254721358576522
    0.007865489381172264
    0.006945749211719199
    0.007072164478298837
    0.007425457642972977
    0.007449079330277275
    0.006727397433633375
    0.006656464207245971
    0.006647137881383158
    0.010907216587362045
    0.008055162006546657
    0.006282681041365423
    0.007112244953434765
    0.007674100737964595
    0.006257365306849061
    0.007791553795346462
    0.004975147712478312
    0.008650676535742585
    0.004847369052416228
    0.004635162094574374
    0.0050793237954247505
    0.0047253828835442935
    0.004847244802865469
    0.004366681139013062
    0.00412361366998748
    0.00413409416317001
    0.004633363413727221
    0.004002761696536128
    0.003908850209907944
    0.0035070660514775476
    0.0034714308250949344
    0.0034380260197407475
    0.003730544874516406
    0.0035748877561703196
    0.0030621574949832864
    0.0036427177168892877
    0.0030163506106777316
    0.003121929880540497
    0.002994649485741574
    0.0034626811499561816
    0.002905199883263987
    0.002886099169572831
    0.0028244547734125325
    0.002837767586811646
    0.0029016468822927743
    0.0028860425395179634
    0.0030483669941183678
    0.0029145618709637278
    0.0026366211610008294
    0.0025962537904703487
    0.0026016297136980393
    0.0026187009472375955
    0.002598185753001192
    0.0025967747574061617
    0.0025922302678597076
    0.0025453419806533706
    0.0025068215748556
    0.00252306904322408
    0.0025031562093253967
    0.002514032383296949
    0.0025185224528583294
    0.002512303723994025
    0.0025290636711712278
    0.002445477136668428
    0.0023526657275374507
    0.0022936967384710183
    0.0022340510146208192
    0.002244016169635432
    0.002245519656168038
    0.0022029890032436716
    0.002168932719561867
    0.002179927143492022
    0.0021661438321013415
    0.002101115624211891
    0.0020676044245776515
    0.0020707702896617386
    0.0021290420684665357
    0.002006905628485711
    0.0019239060486289095
    0.001905993287464769
    0.0019103519072112274
    0.0018886513425545592
    0.0018953958332752485
    0.0019212010691280756
    0.0018487225129657503
    0.0017890596290450755
    0.0018364721612629253
    0.0017903107585418576
    0.0017432069948674078
    0.0016797519464661903
    0.0016840094532055705
    0.001671391525096766
    0.0017283780098157342
    0.0016710503165124901
    0.0015981956919475238
    0.001551509665221329
    0.0015175755209799746
    0.0015493526625172116
    0.0015530106411880684
    0.001472833881958291
    0.0014204768599944684
    0.0014426450422840853
    0.0014277565233505873
    0.0014326789562542075
    0.0014168845484978654
    0.0014446606499375347
    0.001458767830576524
    0.0013545827516822095
    0.0013408709031342836
    0.0013280535213419098
    0.00135555346820726
    0.0013162744498420587
    0.0012859240084290846
    0.0012983848932200948
    0.0012804903207893625
    0.001279119985533539
    0.0012684232638012771
    0.0013115217990159467
    0.0013131422675531912
    0.0011898815157646014
    0.00117789725747941
    0.0011729427503986978
    0.0012266070509000526
    0.0011812302795192187
    0.0011399918367663853
    0.0011176822993013147
    0.001145040044963186
    0.0010933907949612909
    0.001109051354800994
    0.001119213066673841
    0.001032334483681896
    0.0010057079223679821
    0.000982038129443752
    0.0010233354508044634
    0.0009784162817211284
    0.0009617217152099178
    0.0009483509889176567
    0.0009425839280653436
    0.0008830559074982647
    0.0008772938007254316
    0.0008737404976689733
    0.0008307462249473874
         fun: 0.0008307462249473874
       maxcv: 0.0
     message: 'Maximum number of function evaluations has been exceeded.'
        nfev: 200
      status: 2
     success: False
           x: array([3.14062838, 1.20308229, 2.55502772, 2.98038061, 1.47389457,
           2.5237916 , 1.68971102, 1.36399038, 2.97391395])
    (0.9991692537744958-0j)


As you can see, our cost function has acheived a fairly low value of
``0.03273673575407443``, and when we calculate our classical cost
function, we get ``0.96776862579723``, which agrees perfectly with what
we measured, the vectors :math:`|\psi\rangle_o` and :math:`|b\rangle`
are very similar!

Let’s do another test! This time, we will keep :math:`|b\rangle` the
same, but we will have:

.. math:: A \ = \ 0.55 \mathbb{I} \ + \ 0.225 Z_2 \ + \ 0.225 Z_3

Again, we run our optimization code:

.. code:: ipython3

    coefficient_set = [0.55, 0.225, 0.225]
    gate_set = [[0, 0, 0], [0, 1, 0], [0, 0, 1]]
    
    out = minimize(calculate_cost_function, x0=[float(random.randint(0,3000))/1000 for i in range(0, 9)], method="COBYLA", options={'maxiter':200})
    print(out)
    
    out_f = [out['x'][0:3], out['x'][3:6], out['x'][6:9]]
    
    circ = QuantumCircuit(3, 3)
    apply_fixed_ansatz([0, 1, 2], out_f)
    
    backend = Aer.get_backend('statevector_simulator')
    
    job = execute(circ, backend)
    
    result = job.result()
    o = result.get_statevector(circ, decimals=10)
    
    a1 = coefficient_set[2]*np.array([[1,0,0,0,0,0,0,0], [0,1,0,0,0,0,0,0], [0,0,1,0,0,0,0,0], [0,0,0,1,0,0,0,0], [0,0,0,0,-1,0,0,0], [0,0,0,0,0,-1,0,0], [0,0,0,0,0,0,-1,0], [0,0,0,0,0,0,0,-1]])
    a0 = coefficient_set[1]*np.array([[1,0,0,0,0,0,0,0], [0,1,0,0,0,0,0,0], [0,0,-1,0,0,0,0,0], [0,0,0,-1,0,0,0,0], [0,0,0,0,1,0,0,0], [0,0,0,0,0,1,0,0], [0,0,0,0,0,0,-1,0], [0,0,0,0,0,0,0,-1]])
    a2 = coefficient_set[0]*np.array([[1,0,0,0,0,0,0,0], [0,1,0,0,0,0,0,0], [0,0,1,0,0,0,0,0], [0,0,0,1,0,0,0,0], [0,0,0,0,1,0,0,0], [0,0,0,0,0,1,0,0], [0,0,0,0,0,0,1,0], [0,0,0,0,0,0,0,1]])
    
    a3 = np.add(np.add(a2, a0), a1)
    
    b = np.array([float(1/np.sqrt(8)),float(1/np.sqrt(8)),float(1/np.sqrt(8)),float(1/np.sqrt(8)),float(1/np.sqrt(8)),float(1/np.sqrt(8)),float(1/np.sqrt(8)),float(1/np.sqrt(8))])
    
    print((b.dot(a3.dot(o)/(np.linalg.norm(a3.dot(o)))))**2)


.. parsed-literal::

    0.9625990356163793
    0.9812676658344904
    0.9749531745614726
    0.9980269383263304
    0.980969419038813
    0.9955419015753743
    0.9862528118088076
    0.9209267481727295
    0.8060368597245977
    0.6740965129755434
    0.4802556708393011
    0.5228362594277741
    0.5654654315565814
    0.6412462351715975
    0.5404116604316811
    0.5178433059282209
    0.6664847025047036
    0.47781895721354595
    0.4969945936748076
    0.5024556753819819
    0.3937758330211326
    0.4753833645448795
    0.4340579324323217
    0.34402988809424295
    0.4098682018347406
    0.36517898468794796
    0.2977342667699524
    0.3754857073269753
    0.19926071771637766
    0.2563034041139086
    0.21594421964017807
    0.2655202690864956
    0.2204544245062383
    0.28816986002134626
    0.1967636837900696
    0.19116955071754071
    0.2350133755901591
    0.18228073196388261
    0.1848659441508942
    0.19681937325920573
    0.19408682434761193
    0.17118757155596043
    0.18042520940081042
    0.17832056739229674
    0.1909249045830177
    0.17214287636766368
    0.17092526858025747
    0.16968988997017842
    0.1509418883342194
    0.1520059744354112
    0.1592076852718004
    0.146604242155571
    0.151129473222808
    0.151199230543548
    0.14959828591378743
    0.1502033378311607
    0.15110848166388402
    0.14676755180562773
    0.14782322742551846
    0.14673079514245746
    0.1529963093673402
    0.14885506589976483
    0.14251144431462248
    0.13811495326561196
    0.13494564093160244
    0.13551725489295596
    0.13489623206717782
    0.13101186042069646
    0.12652434168634275
    0.12590572847022452
    0.1262921912920657
    0.12673373143960098
    0.126217939644515
    0.12112981541400336
    0.11734562899040857
    0.11666049960644509
    0.11993219434108848
    0.11303669176141407
    0.11165533421650042
    0.10913575099804029
    0.1053435233747615
    0.10759635277388968
    0.10595760138133148
    0.10373388701931485
    0.10820772030992287
    0.10082880721881837
    0.09782110338881844
    0.09719691415396947
    0.09823804085599308
    0.10406368872618665
    0.09738657180910026
    0.09242967621962206
    0.08876182221910878
    0.08527461952060755
    0.07941214261215257
    0.07396302969203417
    0.06656247447023045
    0.059195104691923905
    0.052716387371406825
    0.049131599950556826
    0.046567853313936314
    0.03541575976686473
    0.02826742390963921
    0.029303178523629958
    0.0262895928508895
    0.027419092711995496
    0.025776052849771247
    0.02722350808944274
    0.0259774412621413
    0.03349745191479425
    0.022372997012332863
    0.019797829124515776
    0.023780947117384987
    0.020873089989512206
    0.019495538637146592
    0.015893899171438686
    0.013226825005560272
    0.012933093857134703
    0.012137154188319732
    0.013932970088413321
    0.012100899573102675
    0.012294551530151354
    0.013804533780770956
    0.013456063990659128
    0.0113726009151075
    0.01224590309355178
    0.011597757969954103
    0.010763546693739579
    0.010533716998310516
    0.01029664437828548
    0.011052489060047632
    0.01188342203305004
    0.008689307686357006
    0.007309126950865719
    0.007350291981779944
    0.007507630813750388
    0.006421533525813983
    0.006697061878433885
    0.005871036329061052
    0.006325960014176513
    0.005166757913154574
    0.004641477596180277
    0.004532395577672932
    0.00366065633902235
    0.004037525530102948
    0.004140950824897516
    0.003039295955555965
    0.0030153242258573743
    0.0030930173753374035
    0.002698572251383924
    0.0025136970808998793
    0.0032962590690809312
    0.002514138652555342
    0.0016414547783503153
    0.002357636286048903
    0.0015483735076918803
    0.002061480838722818
    0.0013847238524695715
    0.0014872655862092632
    0.0012981794817268355
    0.0011027457990494538
    0.0009100419940986093
    0.0010783786072975365
    0.0011153673868314895
    0.0009270188319526751
    0.0009164806409012183
    0.0009259978731008811
    0.0008629584391465217
    0.0006702913583783721
    0.0008786649722077877
    0.0008709449871522335
    0.000584151999995286
    0.0008077937969642734
    0.0005170388936960313
    0.0004039854213840899
    0.00040739520032762044
    0.0004451905269919898
    0.00045149582058023885
    0.0004133067379875621
    0.0004866678517517764
    0.00044083279262874253
    0.0007541584220110975
    0.0004029454365667151
    0.0004024199619747648
    0.0004410397374983166
    0.00042789497833251033
    0.00040252178399091676
    0.00043478518519890486
    0.0003796493372016929
    0.00034797173808331916
    0.0003390447936343355
    0.00033034646717644556
    0.00034172394526921224
    0.00033562909875473057
    0.0003517450458128124
    0.00033620709549797567
    0.0003463680142710146
    0.000354925351359503
    0.00037651172879415995
    0.00037866311542333886
         fun: 0.00033034646717644556
       maxcv: 0.0
     message: 'Maximum number of function evaluations has been exceeded.'
        nfev: 200
      status: 2
     success: False
           x: array([ 0.75983962,  3.1633498 , -0.23017442,  0.61927745,  0.14937424,
            2.48316147,  1.43236175,  6.00656311,  5.06876161])
    (0.999669653530172-0j)


Again, very low error, ``0.00014718223342624626``, and the classical
cost function agrees, being ``0.9998563418983931``! Great, so it works!

Now, we have found that this algorithm works **in theory**. I tried to
run some simulations with a circuit that samples the circuit instead of
calculating the probabilities numerically. Now, let’s try to **sample**
the quantum circuit, as a real quantum computer would do! For some
reason, this simulation would only converge somewhat well for a
ridiculously high number of “shots” (runs of the circuit, in order to
calculate the probability distribution of outcomes). I think that this
is mostly to do with limitations in the classical optimizer (COBYLA),
due to the noisy nature of sampling a quantum circuit (a measurement
with the same parameters won’t always yield the same outcome). Luckily,
there are other optimizers that are built for noisy functions, such as
SPSA, but we won’t be looking into that in this tutorial. Let’s try our
sampling for our second value of :math:`A`, with the same matrix
:math:`U`:

.. code:: ipython3

    #Implements the entire cost function on the quantum circuit (sampling, 100000 shots)
    
    def calculate_cost_function(parameters):
    
        global opt
    
        overall_sum_1 = 0
        
        parameters = [parameters[0:3], parameters[3:6], parameters[6:9]]
    
        for i in range(0, len(gate_set)):
            for j in range(0, len(gate_set)):
    
                global circ
    
                qctl = QuantumRegister(5)
                qc = ClassicalRegister(1)
                circ = QuantumCircuit(qctl, qc)
    
                backend = Aer.get_backend('qasm_simulator')
                
                multiply = coefficient_set[i]*coefficient_set[j]
    
                had_test([gate_set[i], gate_set[j]], [1, 2, 3], 0, parameters)
    
                circ.measure(0, 0)
    
                job = execute(circ, backend, shots=100000)
    
                result = job.result()
                outputstate = result.get_counts(circ)
    
                if ('1' in outputstate.keys()):
                    m_sum = float(outputstate["1"])/100000
                else:
                    m_sum = 0
    
                overall_sum_1+=multiply*(1-2*m_sum)
    
        overall_sum_2 = 0
    
        for i in range(0, len(gate_set)):
            for j in range(0, len(gate_set)):
    
                multiply = coefficient_set[i]*coefficient_set[j]
                mult = 1
    
                for extra in range(0, 2):
    
                    qctl = QuantumRegister(5)
                    qc = ClassicalRegister(1)
                    
                    circ = QuantumCircuit(qctl, qc)
    
                    backend = Aer.get_backend('qasm_simulator')
    
                    if (extra == 0):
                        special_had_test(gate_set[i], [1, 2, 3], 0, parameters, qctl)
                    if (extra == 1):
                        special_had_test(gate_set[j], [1, 2, 3], 0, parameters, qctl)
    
                    circ.measure(0, 0)
    
                    job = execute(circ, backend, shots=100000)
    
                    result = job.result()
                    outputstate = result.get_counts(circ)
    
                    if ('1' in outputstate.keys()):
                        m_sum = float(outputstate["1"])/100000
                    else:
                        m_sum = 0
    
                    mult = mult*(1-2*m_sum)
                
                overall_sum_2+=multiply*mult
                
        print(1-float(overall_sum_2/overall_sum_1))
    
        return 1-float(overall_sum_2/overall_sum_1)

.. code:: ipython3

    coefficient_set = [0.55, 0.225, 0.225]
    gate_set = [[0, 0, 0], [0, 1, 0], [0, 0, 1]]
    
    out = minimize(calculate_cost_function, x0=[float(random.randint(0,3000))/1000 for i in range(0, 9)], method="COBYLA", options={'maxiter':200})
    print(out)
    
    out_f = [out['x'][0:3], out['x'][3:6], out['x'][6:9]]
    
    circ = QuantumCircuit(3, 3)
    apply_fixed_ansatz([0, 1, 2], out_f)
    
    backend = Aer.get_backend('statevector_simulator')
    
    job = execute(circ, backend)
    
    result = job.result()
    o = result.get_statevector(circ, decimals=10)
    
    a1 = coefficient_set[2]*np.array([[1,0,0,0,0,0,0,0], [0,1,0,0,0,0,0,0], [0,0,1,0,0,0,0,0], [0,0,0,1,0,0,0,0], [0,0,0,0,-1,0,0,0], [0,0,0,0,0,-1,0,0], [0,0,0,0,0,0,-1,0], [0,0,0,0,0,0,0,-1]])
    a0 = coefficient_set[1]*np.array([[1,0,0,0,0,0,0,0], [0,1,0,0,0,0,0,0], [0,0,-1,0,0,0,0,0], [0,0,0,-1,0,0,0,0], [0,0,0,0,1,0,0,0], [0,0,0,0,0,1,0,0], [0,0,0,0,0,0,-1,0], [0,0,0,0,0,0,0,-1]])
    a2 = coefficient_set[0]*np.array([[1,0,0,0,0,0,0,0], [0,1,0,0,0,0,0,0], [0,0,1,0,0,0,0,0], [0,0,0,1,0,0,0,0], [0,0,0,0,1,0,0,0], [0,0,0,0,0,1,0,0], [0,0,0,0,0,0,1,0], [0,0,0,0,0,0,0,1]])
    
    a3 = np.add(np.add(a2, a0), a1)
    
    b = np.array([float(1/np.sqrt(8)),float(1/np.sqrt(8)),float(1/np.sqrt(8)),float(1/np.sqrt(8)),float(1/np.sqrt(8)),float(1/np.sqrt(8)),float(1/np.sqrt(8)),float(1/np.sqrt(8))])
    
    print((b.dot(a3.dot(o)/(np.linalg.norm(a3.dot(o)))))**2)


.. parsed-literal::

    0.9993425426515787
    0.9730165174430788
    0.9880819280791053
    0.9796088274567379
    0.9290243654181647
    0.8265670875986172
    0.9077777637633613
    0.8098045756660055
    0.7201400094412083
    0.8897169624290471
    0.5979615597265484
    0.7639559379232632
    0.5550148838902862
    0.4983302554618563
    0.47729061674645346
    0.5158180749364317
    0.48554037933654015
    0.4858841515153194
    0.5091987062798102
    0.2879760529044991
    0.2279385477279645
    0.4897532938320206
    0.18234196811925152
    0.6134294839829809
    0.17803988318612163
    0.45591409296156704
    0.14620177277542434
    0.8850627192771191
    0.22311487162561794
    0.33385745916532217
    0.334392585024644
    0.1343116575208103
    0.52876704223542
    0.136152373957369
    0.17943186680358603
    0.2183827444858255
    0.2288989401730449
    0.07090315604995656
    0.10839255263359415
    0.15024656199441078
    0.08068082232472562
    0.15674256659651808
    0.10743242119927554
    0.10017452837219687
    0.09986703418292975
    0.0762463755702073
    0.11159051242872775
    0.08547973471219183
    0.07859745504021665
    0.07874022693756733
    0.09249944340400718
    0.09372644802424968
    0.08131347356628515
    0.08376726132547274
    0.10246916940869288
    0.09440748079528893
    0.09742408931046598
    0.08955648059975552
    0.07178099217294298
    0.09263489981929429
    0.08081793175684238
    0.10329962296569395
    0.10060954012082157
    0.10277972349554876
    0.08906960854668056
    0.10115040766743455
    0.08527427822929501
    0.09469882168504151
    0.11298405039337933
    0.08116972441977532
    0.06822891614692006
    0.08948542457947806
    0.10224107232081403
    0.09602782564067314
    0.08338770725188938
    0.08525037878093233
    0.08980927751496237
    0.09512140993854012
    0.08014978464080469
    0.08445143572233171
    0.07618029579131202
    0.08113716758493295
    0.07906372086675584
    0.09536128641735786
    0.08806289769473918
    0.08227584064144577
    0.07749738036162179
    0.07394172835404245
    0.08061160369553788
    0.08650924184773401
    0.0941745327455098
    0.06940040832774186
    0.08742836257266395
    0.08316538130130757
    0.09207838564503312
    0.05012244743257932
    0.10438572515192346
    0.10023172153844195
    0.09150126861943297
         fun: 0.09150126861943297
       maxcv: 0.0
     message: 'Optimization terminated successfully.'
        nfev: 99
      status: 1
     success: True
           x: array([ 0.84999505,  0.20197536, -0.74899066,  3.52507634,  5.88174778,
            0.14404227,  3.01507468,  2.72105785,  1.83812439])
    (0.912670424600107+0j)


So as you can see, not amazing, our solution is still off by a fairly
significant margin (:math:`3.677\%` error isn’t awful, but ideally, we
want it to be **much** closer to 0). Again, I think this is due to the
optimizer itself, not the actual quantum circuit. I will be making an
update to this Notebook once I figure out how to correct this problem
(likely with the introduction of a noisy optimizer, as I previously
mentioned).

**Acknowledgements**

This implementation is based off of the work presented in the research
paper “Variational Quantum Linear Solver: A Hybrid Algorithm for Linear
Systems”, written by Carlos Bravo-Prieto, Ryan LaRose, M. Cerezo, Yiğit
Subaşı, Lukasz Cincio, and Patrick J. Coles, which is available at
`this <https://arxiv.org/abs/1909.05820>`__ link.

Special thanks to Carlos Bravo-Prieto for personally helping me out, by
answering some of my questions concerning the paper!

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


