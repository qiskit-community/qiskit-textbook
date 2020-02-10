Bernstein-Vazirani Algorithm
============================

In this section, we first introduce the Bernstein-Vazirani problem, and
classical and quantum algorithms to solve it. We then implement the
quantum algorithm using Qiskit, and run on a simulator and device.

Contents
--------

1. `Introduction <#introduction>`__

   -  `Bernstein-Vazirani Problem <#bvproblem>`__
   -  `Bernstein-Vazirani Algorithm <#bvalgorithm>`__

2. `Example <#example>`__

3. `Qiskit Implementation <#implementation>`__

   -  `Simulation <#simulation>`__
   -  `Device <#device>`__

4. `Problems <#problems>`__

5. `References <#references>`__

1. Introduction 
---------------

The Bernstein-Vazirani algorithm, first introduced in Reference [1], can
be seen as an extension of the Deutsch-Josza algorithm covered in the
last section. It showed that there can be advantages in using a quantum
computer as a computational tool for more complex problems compared to
the Deutsch-Josza problem.

1a. Bernstein-Vazirani Problem  
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

We are again given a hidden function Boolean :math:`f`, which takes as
as input a string of bits, and returns either :math:`0` or :math:`1`,
that is:

.. raw:: html

   <center>

$f({x_0,x_1,x_2,…}) :raw-latex:`\rightarrow 0`
:raw-latex:`\textrm{ or }` 1 :raw-latex:`\textrm{ where }` x_n
:raw-latex:`\textrm{ is }`0 :raw-latex:`\textrm{ or }` 1 $.

Instead of the function being balanced or constant as in the
Deutsch-Josza problem, now the function is guaranteed to return the
bitwise product of the input with some string, :math:`s`. In other
words, given an input :math:`x`,
:math:`f(x) = s \cdot x \, \text{(mod 2)}`. We are expected to find
:math:`s`.

1b. Bernstein-Vazirani Algorithm  
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Classical Solution
^^^^^^^^^^^^^^^^^^

Classically, the oracle returns :math:`f_s(x) = s \cdot x \mod 2` given
an input :math:`x`. Thus, the hidden bit string :math:`s` can be
revealed by querying the oracle with
:math:`x = 1, 2, \ldots, 2^i, \ldots, 2^{n-1}`, where each query reveals
the :math:`i`-th bit of :math:`s` (or, :math:`s_i`). For example, with
:math:`x=1` one can obtain the least significant bit of :math:`s`, and
so on. This means we would need to call the function :math:`f_s(x)`
:math:`n` times.

Quantum Solution
^^^^^^^^^^^^^^^^

Using a quantum computer, we can solve this problem with 100% confidence
after only one call to the function :math:`f(x)`. The quantum
Bernstein-Vazirani algorithm to find the hidden integer is very simple:
(1) start from a :math:`|0\rangle^{\otimes n}` state, (2) apply Hadamard
gates, (3) query the oracle, (4) apply Hadamard gates, and (5) measure,
generically illustrated below:

The correctness of the algorithm is best explained by looking at the
transformation of a quantum register :math:`|a \rangle` by :math:`n`
Hadamard gates, each applied to the qubit of the register. It can be
shown that:

.. math::


   |a\rangle \xrightarrow{H^{\otimes n}} \frac{1}{\sqrt{2^n}} \sum_{x\in \{0,1\}^n} (-1)^{a\cdot x}|x\rangle.

In particular, when we start with a quantum register :math:`|0\rangle`
and apply :math:`n` Hadamard gates to it, we have the familiar quantum
superposition:

.. math::


   |0\rangle \xrightarrow{H^{\otimes n}} \frac{1}{\sqrt{2^n}} \sum_{x\in \{0,1\}^n} |x\rangle,

which is slightly different from the Hadamard transform of the reqister
:math:`|a \rangle` by the phase :math:`(-1)^{a\cdot x}`.

Now, the quantum oracle :math:`f_a` returns :math:`1` on input :math:`x`
such that :math:`a \cdot x \equiv 1 \mod 2`, and returns :math:`0`
otherwise. This means we have the following transformation:

.. math::


   |x \rangle \xrightarrow{f_a} | x \rangle = (-1)^{a\cdot x} |x \rangle. 

The algorithm to reveal the hidden integer follows naturally by querying
the quantum oracle :math:`f_a` with the quantum superposition obtained
from the Hadamard transformation of :math:`|0\rangle`. Namely,

.. math::


   |0\rangle \xrightarrow{H^{\otimes n}} \frac{1}{\sqrt{2^n}} \sum_{x\in \{0,1\}^n} |x\rangle \xrightarrow{f_a} \frac{1}{\sqrt{2^n}} \sum_{x\in \{0,1\}^n} (-1)^{a\cdot x}|x\rangle.

Because the inverse of the :math:`n` Hadamard gates is again the
:math:`n` Hadamard gates, we can obtain :math:`a` by

.. math::


   \frac{1}{\sqrt{2^n}} \sum_{x\in \{0,1\}^n} (-1)^{a\cdot x}|x\rangle \xrightarrow{H^{\otimes n}} |a\rangle.

.. raw:: html

   <!-- #region -->

2. Example 
----------

Let’s go through a specific example for :math:`n=2` qubits and a secret
string :math:`s=11`. Note that we are following the formulation in
Reference [2] that generates a circuit for the Bernstein-Vazirani
quantum oracle using only one register.

.. raw:: html

   <ol>

.. raw:: html

   <li>

The register of two qubits is initialized to zero:

.. math:: \lvert \psi_0 \rangle = \lvert 0 0 \rangle

.. raw:: html

   </li>

.. raw:: html

   <li>

Apply a Hadamard gate to both qubits:

.. math:: \lvert \psi_1 \rangle = \frac{1}{2} \left( \lvert 0 0 \rangle + \lvert 0 1 \rangle + \lvert 1 0 \rangle + \lvert 1 1 \rangle \right) 

.. raw:: html

   </li>

.. raw:: html

   <li>

For the string :math:`s=11`, the quantum oracle can be implemented as
:math:`\text{Q}_f = Z_{1}Z_{2}`:

.. math:: \lvert \psi_2 \rangle = \frac{1}{2} \left( \lvert 0 0 \rangle - \lvert 0 1 \rangle - \lvert 1 0 \rangle + \lvert 1 1 \rangle \right)

.. raw:: html

   </li>

.. raw:: html

   <li>

Apply a Hadamard gate to both qubits:

.. math:: \lvert \psi_3 \rangle = \lvert 1 1 \rangle

.. raw:: html

   </li>

.. raw:: html

   <li>

Measure to find the secret string :math:`s=11`

.. raw:: html

   </li>

.. raw:: html

   </ol>

.. raw:: html

   <!-- #endregion -->

3. Qiskit Implementation 
------------------------

We now implement the Bernstein-Vazirani algorithm with Qiskit for a two
bit function with :math:`s=11`.

.. code:: python

   # initialization
   import matplotlib.pyplot as plt
   %matplotlib inline
   %config InlineBackend.figure_format = 'svg' # Makes the images look nice
   import numpy as np

   # importing Qiskit
   from qiskit import IBMQ, BasicAer
   from qiskit.providers.ibmq import least_busy
   from qiskit import QuantumCircuit, ClassicalRegister, QuantumRegister, execute

   # import basic plot tools
   from qiskit.visualization import plot_histogram

We first set the number of qubits used in the experiment, and the hidden
integer :math:`s` to be found by the algorithm. The hidden integer
:math:`s` determines the circuit for the quantum oracle.

.. code:: python

   nQubits = 2 # number of physical qubits used to represent s
   s = 3       # the hidden integer 

   # make sure that a can be represented with nqubits
   s = s % 2**(nQubits)

We then use Qiskit to program the Bernstein-Vazirani algorithm.

.. code:: python

   # Creating registers
   # qubits for querying the oracle and finding the hidden integer
   qr = QuantumRegister(nQubits)
   # bits for recording the measurement on qr
   cr = ClassicalRegister(nQubits)

   bvCircuit = QuantumCircuit(qr, cr)
   barriers = True

   # Apply Hadamard gates before querying the oracle
   for i in range(nQubits):
       bvCircuit.h(qr[i])
       
   # Apply barrier 
   if barriers:
       bvCircuit.barrier()

   # Apply the inner-product oracle
   for i in range(nQubits):
       if (s & (1 << i)):
           bvCircuit.z(qr[i])
       else:
           bvCircuit.iden(qr[i])
           
   # Apply barrier 
   if barriers:
       bvCircuit.barrier()

   #Apply Hadamard gates after querying the oracle
   for i in range(nQubits):
       bvCircuit.h(qr[i])
       
   # Apply barrier 
   if barriers:
       bvCircuit.barrier()

   # Measurement
   bvCircuit.measure(qr, cr)

.. code:: python

   bvCircuit.draw(output='mpl')

3a. Experiment with Simulators 
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

We can run the above circuit on the simulator.

.. code:: python

   # use local simulator
   backend = BasicAer.get_backend('qasm_simulator')
   shots = 1024
   results = execute(bvCircuit, backend=backend, shots=shots).result()
   answer = results.get_counts()

   plot_histogram(answer)

We can see that the result of the measurement is the binary
representation of the hidden integer :math:`3` :math:`(11)`.

3b. Experiment with Real Devices 
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

We can run the circuit on the real device as below.

.. code:: python

   # Load our saved IBMQ accounts and get the least busy backend device with less than or equal to 5 qubits
   IBMQ.load_account()
   provider = IBMQ.get_provider(hub='ibm-q')
   provider.backends()
   backend = least_busy(provider.backends(filters=lambda x: x.configuration().n_qubits <= 5 and
                                      x.configuration().n_qubits >= 2 and
                                      not x.configuration().simulator and x.status().operational==True))
   print("least busy backend: ", backend)

.. code:: python

   # Run our circuit on the least busy backend. Monitor the execution of the job in the queue
   from qiskit.tools.monitor import job_monitor

   shots = 1024
   job = execute(bvCircuit, backend=backend, shots=shots)

   job_monitor(job, interval = 2)

.. code:: python

   # Get the results from the computation
   results = job.result()
   answer = results.get_counts()

   plot_histogram(answer)

As we can see, most of the results are :math:`11`. The other results are
due to errors in the quantum computation.

4. Problems 
-----------

1. The above `implementation <#implementation>`__ of Bernstein-Vazirani
   is for a secret bit string of :math:`s = 11`. Modify the
   implementation for a secret string os :math:`s = 1011`. Are the
   results what you expect? Explain.
2. The above `implementation <#implementation>`__ of Bernstein-Vazirani
   is for a secret bit string of :math:`s = 11`. Modify the
   implementation for a secret string os :math:`s = 1110110101`. Are the
   results what you expect? Explain.

5. References 
-------------

1. Ethan Bernstein and Umesh Vazirani (1997) “Quantum Complexity Theory”
   SIAM Journal on Computing, Vol. 26, No. 5: 1411-1473,
   `doi:10.1137/S0097539796300921 <https://doi.org/10.1137/S0097539796300921>`__.
2. Jiangfeng Du, Mingjun Shi, Jihui Wu, Xianyi Zhou, Yangmei Fan,
   BangJiao Ye, Rongdian Han (2001) “Implementation of a quantum
   algorithm to solve the Bernstein-Vazirani parity problem without
   entanglement on an ensemble quantum computer”, Phys. Rev. A 64,
   042306,
   `10.1103/PhysRevA.64.042306 <https://doi.org/10.1103/PhysRevA.64.042306>`__,
   `arXiv:quant-ph/0012114 <https://arxiv.org/abs/quant-ph/0012114>`__.

.. code:: python

   import qiskit
   qiskit.__qiskit_version__

.. code:: python
