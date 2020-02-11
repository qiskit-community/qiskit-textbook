.. raw:: html

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
   :alt: bro

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

|image0|

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

.. |image0| image:: images/h.png%22%20style=%22height:100px

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

    0.7981882374929201
    0.695079723686692
    0.9383315647350008
    0.6904371919572654
    0.8118640291562185
    0.5316453678635433
    0.551728552357031
    0.6920305600054013
    0.6807879045328953
    0.5316795795484354
    0.5615493114504355
    0.6337226703872034
    0.5387687667203485
    0.5537048540227931
    0.5278672705655283
    0.5413429164379344
    0.5445707704280724
    0.5055250325522496
    0.5133938926912365
    0.5195888939849718
    0.47093644683706126
    0.46703582833467194
    0.4784145187585943
    0.46597165376213256
    0.47086446070753296
    0.46304971283138174
    0.460240735844604
    0.4660153941277323
    0.4560458171973345
    0.45617005619061735
    0.4638809627961601
    0.4612095506503203
    0.46140212772159306
    0.458889566943529
    0.45579617421881347
    0.44990648262768196
    0.44998572755957134
    0.45039605205405175
    0.4421228591945511
    0.441890276284997
    0.4437110523705171
    0.4434645307996946
    0.44205066856339836
    0.4364071083250417
    0.4329664627608324
    0.4361375297139538
    0.4298225401730671
    0.4252736856357817
    0.42438502158563896
    0.4313497797126
    0.41407697692944123
    0.4044874934240883
    0.40252932156752264
    0.4036748070558034
    0.40162877218351023
    0.4060409124584706
    0.39152405566434334
    0.39425836675532266
    0.39248919122817694
    0.3731990112985316
    0.3717816807382943
    0.36878447867287
    0.3598812345991862
    0.35547711466381793
    0.3567879514685114
    0.3393495045388326
    0.35339770166457807
    0.3417612236391264
    0.3321842827901036
    0.3328715436589471
    0.3081345094344037
    0.297329678934666
    0.29949774697094855
    0.29830906648129096
    0.28101322762135794
    0.2884548594148012
    0.31159962382721507
    0.28671365894104195
    0.26311712696624856
    0.2551133120170621
    0.23926315142168997
    0.2138991281260082
    0.16481569776062133
    0.13353474717113367
    0.04998385592403409
    0.12937698444344348
    0.046646974178992884
    0.0618329335903538
    0.04920606041185993
    0.0719655916054247
    0.0554486610220859
    0.03490261484276669
    0.04544435264807145
    0.18157597940965775
    0.10829348010550643
    0.05465763705964466
    0.03092303493173887
    0.04279664246713755
    0.02943337813425173
    0.03831951339355877
    0.026463066721570838
    0.033210479819336114
    0.025599302297286464
    0.04856575636652538
    0.028330947480558533
    0.031449696631425716
    0.016789141678396513
    0.015253531086060645
    0.020454951150170264
    0.019311532833585
    0.014126043292870705
    0.02438597573188761
    0.016039375483319906
    0.014987980504499454
    0.013927392054066234
    0.012463641237805079
    0.012895113143497339
    0.020395835220229253
    0.009752451691799835
    0.010512293727326871
    0.019757952294517822
    0.009590178994102638
    0.009481000893007852
    0.010746228153094228
    0.008905363238395414
    0.00810883243760041
    0.007842591600740745
    0.009303565447177808
    0.007824773772464488
    0.011313073388597106
    0.008020330891869931
    0.00692849326439493
    0.007494934095255923
    0.006896663369389988
    0.008811007791958314
    0.008286593850963309
    0.005615860194908007
    0.008450282732209935
    0.006150199808108603
    0.005691770859177492
    0.005405614035595252
    0.005471098378355244
    0.006293622656660891
    0.005703445361649573
    0.005421736516446063
    0.005329212079300705
    0.0062177290164662224
    0.0054043968931751785
    0.004848635823206382
    0.005041163775023949
    0.004754453459699826
    0.005632061126455867
    0.004606282552126584
    0.004685459832036054
    0.004587462532705255
    0.004609802542991037
    0.0046607963309238665
    0.004513130227000062
    0.00470652939656413
    0.004161561568595373
    0.003907903724580608
    0.003777061960084205
    0.0036009594692828495
    0.003701947956697982
    0.003612466465385822
    0.003542404886246908
    0.0035329038578691963
    0.0035933218095010044
    0.0035509460416507377
    0.003560333533083937
    0.0036726032392179198
    0.003574960217041623
    0.003609136988663497
    0.003440571650141333
    0.003466467076855162
    0.0034238989990884594
    0.003295364740221074
    0.0032699538952464247
    0.0032603439878690077
    0.003213302648513827
    0.0030991019937528508
    0.0030796060758140342
    0.0030684315954759844
    0.003017510685418223
    0.0029817851683706653
    0.0029160246589944316
    0.0027818181564590594
    0.0027134256435770165
    0.002620844445092918
    0.0025683725921936684
    0.0024997549248527706
    0.002399199562217791
    0.002361142992890919
    0.002356328391382667
    0.0023532339176929318
    0.0023410840064426175
    0.002343602071609996
    0.0022509992786227118
    0.0022169012392679877
    0.0023651236509357743
         fun: 0.0022169012392679877
       maxcv: 0.0
     message: 'Maximum number of function evaluations has been exceeded.'
        nfev: 200
      status: 2
     success: False
           x: array([3.12360188, 1.14326325, 3.57354899, 1.45122415, 1.98407074,
           3.5674926 , 3.15272459, 0.70619594, 2.94284128])
    (0.9977830987551144-0j)


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

    0.3952774027185464
    0.2162246586915585
    0.4319311831101368
    0.393641005084447
    0.4717038910603193
    0.6963182694534497
    0.2432487309511685
    0.448221393482501
    0.5984548822588494
    0.2683738822047419
    0.39395836928737804
    0.2637555431472365
    0.259398853016487
    0.21539986680011258
    0.25651594403371725
    0.2164559218080937
    0.2083753234558383
    0.20542299132210717
    0.3016986090203012
    0.218481750275191
    0.1838759768697611
    0.17371232961186933
    0.1918228133418346
    0.17456399490769914
    0.19134363251030062
    0.16252939073039663
    0.15063919277942683
    0.14047001199629294
    0.1489507769793431
    0.14683648552157835
    0.14845391568450905
    0.14029941216726138
    0.1446710046433285
    0.14269514921311754
    0.13031966785476423
    0.12936443305132816
    0.1339081546010571
    0.14171731534709142
    0.13149994407337384
    0.12543676118023583
    0.11296959236502147
    0.11542109409623258
    0.118079875516514
    0.1055901748230782
    0.1144591970971407
    0.1023256681620015
    0.10162198175521664
    0.09631021589190192
    0.11390415244072971
    0.09960270391426362
    0.12593801244104574
    0.09112557727736992
    0.09357537841139663
    0.09510082410184739
    0.0987785888674736
    0.09406840078085099
    0.08262102159009244
    0.07663718660566265
    0.07867771210767349
    0.0784644539966668
    0.07407404142731289
    0.07228536322710011
    0.06871004484325749
    0.0665308136386108
    0.0635440527742519
    0.06482218423350294
    0.0699493192319669
    0.07032837557441851
    0.058003922519174966
    0.06305444732260124
    0.06330205931638655
    0.05618029711369277
    0.05532331649110522
    0.06023711651467234
    0.0494389135588732
    0.04133463292832473
    0.041828459987421795
    0.04800158793063236
    0.03977899063977841
    0.03881772011712237
    0.02947385471124897
    0.03373310588173528
    0.03189459373803816
    0.04283303019300766
    0.027128362541458007
    0.026245577774710926
    0.024689549390821686
    0.027197710389211927
    0.020783908584539934
    0.02506678749999236
    0.021906933754917146
    0.01923041577670459
    0.014781103240647075
    0.01633801053558337
    0.014712278811706891
    0.015919036604352454
    0.016256559374346446
    0.01537110613724535
    0.013895892483348993
    0.01398282210168067
    0.01353737475369865
    0.012385887832926268
    0.012775978283403266
    0.012880647226342856
    0.013476757786335614
    0.01230215489986275
    0.011599467278231246
    0.012585759425063459
    0.009080120179750795
    0.008333545184789237
    0.00789487081354745
    0.007673487418142888
    0.008439593223279473
    0.007118618351235284
    0.005991592151517788
    0.006222670690063881
    0.00770820916696513
    0.005665517141542953
    0.004405032165295308
    0.005236595452875026
    0.005110769182576247
    0.004672721892373222
    0.004185975212606219
    0.00351957080276577
    0.00400889670488247
    0.003268893589045252
    0.0030903505270191145
    0.0029937543304076053
    0.0028207207933632628
    0.004097442380300964
    0.0021822292433893997
    0.001045476108167409
    0.0013637977636592469
    0.001485997899802416
    0.0011094884525270077
    0.0008309962103687507
    0.0019335841656210606
    0.0006159003289559761
    0.0002982881516073732
    0.00047411515054940345
    0.00025143508867819797
    0.0002684648390413047
    0.0003806150396438168
    0.00032540946340431365
    0.0003629022008962979
    0.0003138640219515487
    0.00020833292080546517
    0.0002798292325705276
    0.00023367356725156885
    0.0002794346362418043
    0.00016416839149635543
    0.00010823704865881023
    8.381824042058561e-05
    8.372132301015522e-05
    0.00013372667616784462
    3.206766912533521e-05
    2.0942209740915096e-05
    2.8158183158044636e-05
    3.253775591760544e-05
    2.379144814279588e-05
    4.1034382505023004e-05
    5.961453376612802e-05
    2.6769072829391227e-05
    3.32310051630591e-05
    1.4195708027742171e-05
    1.4152542624823461e-05
    1.5200591248931694e-05
    2.773167653036257e-05
    2.3269737731035356e-05
    2.2739474240029978e-05
    1.3588714115386757e-05
    1.2517112819687704e-05
    1.1073306448117215e-05
    1.1728394669230369e-05
    1.7917514529064427e-05
    8.762499833281368e-06
    5.4928664197095856e-06
    8.098934183631279e-06
    7.2807895425963665e-06
    4.6821304032773625e-06
    6.4890399931183396e-06
    5.882496981635121e-06
    4.737891041495246e-06
    3.980598783037692e-06
    3.287113491179383e-06
    4.9169092850576135e-06
    5.556546984863964e-06
    3.216520228277453e-06
    3.0594135511652354e-06
    4.020563954543199e-06
    3.936897261413996e-06
    3.0120926477472665e-06
    3.692139019850771e-06
    2.7229739106848783e-06
    2.9978460336366197e-06
    2.988580743989999e-06
    2.968083584575787e-06
    2.9169394460959452e-06
    2.64019698548168e-06
    2.5599724614577823e-06
         fun: 2.5599724614577823e-06
       maxcv: 0.0
     message: 'Maximum number of function evaluations has been exceeded.'
        nfev: 200
      status: 2
     success: False
           x: array([ 2.68028419e+00,  3.95196041e-04,  1.83080539e+00,  3.18188156e+00,
           -1.31983626e-01,  3.05310917e+00,  1.10100070e+00,  2.80144102e+00,
            1.52829793e+00])
    (0.9999974400275905-0j)


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

    0.9950635309411491
    0.9260912072556469
    0.9868993944782353
    0.9444438622755092
    0.9374395315382393
    0.9903539042661887
    0.9478993066779516
    0.9321504417657379
    0.7678894075160189
    0.7323635180975403
    0.4425236455321221
    0.6984841388945596
    0.4406752156787772
    0.2508645908013145
    0.2530841294735623
    0.24448213545055442
    0.5969828098408341
    0.3576306885479933
    0.2666260189790811
    0.2627826477717151
    0.3345644533081945
    0.35386879803334725
    0.2461004546031188
    0.30961042616370227
    0.26198133830786285
    0.34043517186981276
    0.2452377710474004
    0.2389557969804339
    0.25692697879639403
    0.23461539142689725
    0.23604518829926047
    0.2383365864018966
    0.22857570863676224
    0.2328281732281754
    0.23519361425736585
    0.22325049097255711
    0.21723913437145348
    0.21398917917188742
    0.2146167977571951
    0.21417141497881909
    0.20787636540402243
    0.2006943962432548
    0.2042390716873692
    0.20224863418589478
    0.1962125536427013
    0.21107054174546902
    0.19335800999772534
    0.19828451381228018
    0.19203671539525324
    0.1902630025533406
    0.18558300508924408
    0.1889720120692735
    0.18304236446000555
    0.18243049933536815
    0.18075803277657687
    0.1871132015429976
    0.191089688369385
    0.18581203747300956
    0.18769806425682134
    0.1713478119566798
    0.16514716201714774
    0.17146919737713484
    0.16418261347568086
    0.15397344532536894
    0.1560827743757175
    0.16805519167218153
    0.17379892177642597
    0.16362396117729394
    0.16562354491505338
    0.16829597013141273
    0.16028280106400628
    0.1789221120422183
    0.16688585722369553
    0.1642180102212456
    0.1632140565818656
    0.1604980829527165
    0.16769713850107326
    0.16172411686134447
    0.16046961301471918
    0.17149396164676056
    0.17367361281926097
    0.16317488138130543
    0.16411088655378214
    0.16181114659658435
    0.16839476374999995
    0.16437176715122082
    0.16825658140177635
    0.1617742111984216
    0.1612479349455639
    0.154603570459667
    0.16778136341195082
    0.16679003277929738
    0.16846362638204848
    0.16885713853756423
    0.1597383146516117
    0.1709594582928169
    0.16553273233345955
    0.16613812573868325
    0.16009835809551842
    0.16241499826131234
    0.1696808312064506
    0.17212763047535573
    0.16757791732633687
    0.1599333618086639
    0.16425129630665636
    0.1635622275360078
    0.1654776592561964
    0.1635888979056621
    0.1677140850137333
    0.16677563318436006
    0.16566938761223693
    0.1620487704260798
    0.16478861483302398
    0.16806743037584948
    0.16856872564298853
    0.1610429358516744
    0.15905554537404432
    0.1676002911082144
    0.16409507035888593
    0.1695723354289791
    0.16821312492829343
    0.1666450370774687
    0.16877217240147224
         fun: 0.16877217240147224
       maxcv: 0.0
     message: 'Optimization terminated successfully.'
        nfev: 123
      status: 1
     success: True
           x: array([ 0.87269529,  1.90639667,  1.51945183,  1.22454921, -0.2306003 ,
            1.40955809,  2.72463269,  3.75085649,  4.09938408])
    (0.8354956375523418-0j)


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


