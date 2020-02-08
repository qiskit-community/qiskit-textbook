.. raw:: html

   <h1>

The Variational Quantum Linear Solver

.. raw:: html

   </h1>

.. code:: python

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

   alt text

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

.. code:: python

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

.. code:: python

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

.. code:: python

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

Notice the extra qubit, ``q0_4``. This is an ancilla, and allows us to
create a :math:`CCZ` gate, as is shown in the circuit. Now, we also have
to create the circuit for :math:`U`. In our implementation, we will pick
:math:`U` as:

.. math:: U \ = \ H_1 H_2 H_3

Thus, we have:

.. code:: python

   def control_b(ancilla, qubits):

       for ia in qubits:
           circ.ch(ancilla, ia)

   circ = QuantumCircuit(4)
   control_b(0, [1, 2, 3])
   circ.draw(output='mpl')

Finally, we construct our new Hadamard test:

.. code:: python

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

.. code:: python

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

.. code:: python

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

As you can see, our cost function has acheived a fairly low value of
``0.03273673575407443``, and when we calculate our classical cost
function, we get ``0.96776862579723``, which agrees perfectly with what
we measured, the vectors :math:`|\psi\rangle_o` and :math:`|b\rangle`
are very similar!

Let’s do another test! This time, we will keep :math:`|b\rangle` the
same, but we will have:

.. math:: A \ = \ 0.55 \mathbb{I} \ + \ 0.225 Z_2 \ + \ 0.225 Z_3

Again, we run our optimization code:

.. code:: python

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

.. code:: python

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

.. code:: python

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

.. code:: python

   import qiskit
   qiskit.__qiskit_version__
