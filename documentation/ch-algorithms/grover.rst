Grover’s Algorithm
==================

.. raw:: html

   <!-- #region -->

In this section, we introduce Grover’s algorithm and how it can be used
to solve unstructured search problems. We then implement the quantum
algorithm using Qiskit, and run on a simulator and device.

Contents
--------

1. `Introduction <#introduction>`__

2. `Example: 2 Qubits <#2qubits>`__

   -  `Simulation <#2qubits-simulation>`__
   -  `Device <#2qubits-device>`__

3. `Example: 3 Qubits <#3qubits>`__

   -  `Simulation <#3qubits-simulation>`__
   -  `Device <#3qubits-device>`__

4. `Problems <#problems>`__

5. `References <#references>`__

.. raw:: html

   <!-- #region -->

1. Introduction 
---------------

You have likely heard that one of the many advantages a quantum computer
has over a classical computer is its superior speed searching databases.
Grover’s algorithm demonstrates this capability. This algorithm can
speed up an unstructured search problem quadratically, but its uses
extend beyond that; it can serve as a general trick or subroutine to
obtain quadratic run time improvements for a variety of other
algorithms. This is called the amplitude amplification trick.

Unstructured Search
~~~~~~~~~~~~~~~~~~~

Suppose you are given a large list of :math:`N` items. Among these items
there is one item with a unique property that we wish to locate; we will
call this one the winner :math:`w`. Think of each item in the list as a
box of a particular color. Say all items in the list are gray except the
winner :math:`w`, which is pink.

To find the pink box – the *marked item* – using classical computation,
one would have to check on average :math:`N/2` of these boxes, and in
the worst case, all :math:`N` of them. On a quantum computer, however,
we can find the marked item in roughly :math:`\sqrt{N}` steps with
Grover’s amplitude amplification trick. A quadratic speedup is indeed a
substantial time-saver for finding marked items in long lists.
Additionally, the algorithm does not use the list’s internal structure,
which makes it *generic;* this is why it immediately provides a
quadratic quantum speed-up for many classical problems.

Oracle
~~~~~~

How will the list items be provided to the quantum computer? A common
way to encode such a list is in terms of a function :math:`f` which
returns :math:`f(x) = 0` for all unmarked items :math:`x` and
:math:`f(w) = 1` for the winner. To use a quantum computer for this
problem, we must provide the items in superposition to this function, so
we encode the function into a unitary matrix called an *oracle*. First
we choose a binary encoding of the items :math:`x, w \in \{0,1\}^n` so
that :math:`N = 2^n`; now we can represent it in terms of qubits on a
quantum computer. Then we define the oracle matrix :math:`U_f` to act on
any of the simple, standard basis states :math:`| x \rangle` by
:math:`U_f | x \rangle = (-1)^{f(x)} | x \rangle.`

We see that if :math:`x` is an unmarked item, the oracle does nothing to
the state. However, when we apply the oracle to the basis state
:math:`| w \rangle`, it maps :math:`U_f | w \rangle = -| w \rangle`.
Geometrically, this unitary matrix corresponds to a reflection about the
origin for the marked item in an :math:`N = 2^n` dimensional vector
space.

Amplitude Amplification
~~~~~~~~~~~~~~~~~~~~~~~

So how does the algorithm work? Before looking at the list of items, we
have no idea where the marked item is. Therefore, any guess of its
location is as good as any other, which can be expressed in terms of a
uniform superposition:
:math:`|s \rangle = \frac{1}{\sqrt{N}} \sum_{x = 0}^{N -1} | x \rangle.`

If at this point we were to measure in the standard basis
:math:`\{ | x \rangle \}`, this superposition would collapse, according
to the fifth quantum law, to any one of the basis states with the same
probability of :math:`\frac{1}{N} = \frac{1}{2^n}`. Our chances of
guessing the right value :math:`w` is therefore :math:`1` in
:math:`2^n`, as could be expected. Hence, on average we would need to
try about :math:`N = 2^n` times to guess the correct item.

Enter the procedure called amplitude amplification, which is how a
quantum computer significantly enhances this probability. This procedure
stretches out (amplifies) the amplitude of the marked item, which
shrinks the other items’ amplitude, so that measuring the final state
will return the right item with near-certainty.

This algorithm has a nice geometrical interpretation in terms of two
reflections, which generate a rotation in a two-dimensional plane. The
only two special states we need to consider are the winner
:math:`| w \rangle` and the uniform superposition :math:`| s \rangle`.
These two vectors span a two-dimensional plane in the vector space
:math:`\mathbb{C}^N.` They are not quite perpendicular because
:math:`| w \rangle` occurs in the superposition with amplitude
:math:`N^{-1/2}` as well. We can, however, introduce an additional state
:math:`|s'\rangle` that is in the span of these two vectors, which is
perpendicular to :math:`| w \rangle` and is obtained from
:math:`|s \rangle` by removing :math:`| w \rangle` and rescaling.

**Step 1**: The amplitude amplification procedure starts out in the
uniform superposition :math:`| s \rangle`, which is easily constructed
from :math:`| s \rangle = H^{\otimes n} | 0 \rangle^n`.

The left graphic corresponds to the two-dimensional plane spanned by
perpendicular vectors :math:`|w\rangle` and :math:`|s'\rangle` which
allows to express the initial state as
:math:`|s\rangle = \sin \theta | w \rangle + \cos \theta | s' \rangle,`
where
:math:`\theta = \arcsin \langle s | w \rangle = \arcsin \frac{1}{\sqrt{N}}`.
The right graphic is a bar graph of the amplitudes of the state
:math:`| s \rangle` for the case :math:`N = 2^2 = 4`. The average
amplitude is indicated by a dashed line.

**Step 2**: We apply the oracle reflection :math:`U_f` to the state
:math:`|s\rangle`.

Geometrically this corresponds to a reflection of the state
:math:`|s\rangle` about :math:`|s'\rangle`. This transformation means
that the amplitude in front of the :math:`|w\rangle` state becomes
negative, which in turn means that the average amplitude has been
lowered.

**Step 3**: We now apply an additional reflection :math:`U_s` about the
state :math:`|s\rangle`:
:math:`U_s = 2|s\rangle\langle s| - \mathbb{1}`. This transformation
maps the state to :math:`U_s U_f| s \rangle` and completes the
transformation.

Two reflections always correspond to a rotation. The transformation
:math:`U_s U_f` rotates the initial state :math:`|s\rangle` closer
towards the winner :math:`|w\rangle`. The action of the reflection
:math:`U_s` in the amplitude bar diagram can be understood as a
reflection about the average amplitude. Since the average amplitude has
been lowered by the first reflection, this transformation boosts the
negative amplitude of :math:`|w\rangle` to roughly three times its
original value, while it decreases the other amplitudes. We then go to
**step 2** to repeat the application. This procedure will be repeated
several times to zero in on the winner.

After :math:`t` steps we will be in the state :math:`|\psi_t\rangle`
where: :math:`| \psi_t \rangle = (U_s U_f)^t | s \rangle.`

How many times do we need to apply the rotation? It turns out that
roughly :math:`\sqrt{N}` rotations suffice. This becomes clear when
looking at the amplitudes of the state :math:`| \psi \rangle`. We can
see that the amplitude of :math:`| w \rangle` grows linearly with the
number of applications :math:`\sim t N^{-1/2}`. However, since we are
dealing with amplitudes and not probabilities, the vector space’s
dimension enters as a square root. Therefore it is the amplitude, and
not just the probability, that is being amplified in this procedure.

In the case that there are multiple solutions, :math:`M`, it can be
shown that roughly :math:`\sqrt{(N/M)}` rotations will suffice.

.. raw:: html

   <!-- #endregion -->

2. Example: 2 Qubits 
--------------------

Let’s first have a look at the case of Grover’s algorithm for
:math:`N=4` which is realized with 2 qubits. In this particular case,
contrary to inuition, only one rotation is required which will rotate
the initial state :math:`|s\rangle` to the winner :math:`|w\rangle`
which can easily be shown [3]:

.. raw:: html

   <ol>

.. raw:: html

   <li>

Following the above introduction, in the case :math:`N=4` we have

.. math:: \theta = \arcsin \frac{1}{2} = \frac{\pi}{6}.

.. raw:: html

   </li>

.. raw:: html

   <li>

After :math:`t` steps, we have

.. math:: (U_s U_f)^t  \lvert s \rangle = \sin \theta_t \lvert w \rangle + \cos \theta_t \lvert s' \rangle ,

\ where

.. math:: \theta_t = (2t+1)\theta.

.. raw:: html

   </li>

.. raw:: html

   <li>

In order to obtain :math:`\lvert w \rangle` we need
:math:`\theta_t = \frac{\pi}{2}`, which with
:math:`\theta=\frac{\pi}{6}` inserted above results to :math:`t=1`. This
implies that after :math:`t=1` rotation the searched element is found.

.. raw:: html

   </li>

.. raw:: html

   </ol>

Now let us look into the possible oracles. We have :math:`N=4` possible
elements,
i.e. :math:`\lvert 00 \rangle, \lvert 01 \rangle, \lvert 10 \rangle, \lvert 11 \rangle`
and hence require in total :math:`4` oracles.

Oracle for :math:`\lvert w \rangle = \lvert 11 \rangle`
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

Let us start with the case :math:`\lvert w \rangle = \lvert 11 \rangle`.
The oracle :math:`U_f` in this case acts as follows:

.. math:: U_f \lvert s \rangle = U_f\frac{1}{2}\left( \lvert 00 \rangle + \lvert 01 \rangle + \lvert 10 \rangle + \lvert 11 \rangle \right) = \frac{1}{2}\left( \lvert 00 \rangle + \lvert 01 \rangle + \lvert 10 \rangle - \lvert 11 \rangle \right).

\ In order to realize the sign flip for :math:`\lvert 11 \rangle` we
simply need to apply a controlled Z gate to the initial state. This
leads to the following circuit:

Oracle for :math:`\lvert w \rangle = \lvert 00 \rangle`
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

In the case of :math:`\lvert w \rangle = \lvert 00 \rangle` the oracle
:math:`U_f` acts as follows:

.. math:: U_f \lvert s \rangle = U_f\frac{1}{2}\left( \lvert 00 \rangle + \lvert 01 \rangle + \lvert 10 \rangle + \lvert 11 \rangle \right) = \frac{1}{2}\left( -\lvert 00 \rangle + \lvert 01 \rangle + \lvert 10 \rangle + \lvert 11 \rangle \right).

\ In order to realize the sign flip for :math:`\lvert 00 \rangle` we
need to apply an “inverted” controlled Z gate to the initial state
leading to the following circuit:

Oracles for :math:`\lvert w \rangle = \lvert 01 \rangle` and :math:`\lvert w \rangle = \lvert 10 \rangle`
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

Following the above logic one can straight forwardly construct the
oracles for :math:`\lvert w \rangle = \lvert 01 \rangle` (left circuit)
and :math:`\lvert w \rangle = \lvert 10 \rangle` (right circuit):

Reflection :math:`U_s`
^^^^^^^^^^^^^^^^^^^^^^

In order to complete the circuit we need to implement the additional
reflection :math:`U_s = 2|s\rangle\langle s| - \mathbb{1}` which acts as
follows

.. math:: U_s \frac{1}{2}\left( \lvert 00 \rangle + \lvert 01 \rangle + \lvert 10 \rangle + \lvert 11 \rangle \right) = \frac{1}{2}\left( \lvert 00 \rangle - \lvert 01 \rangle - \lvert 10 \rangle - \lvert 11 \rangle \right),

\ i.e. the signs of each state are flipped except for
:math:`\lvert 00 \rangle`. As can easily be verified, one way of
implementing :math:`U_s` is the following circuit:

Full Circuit for :math:`\lvert w \rangle = \lvert 00 \rangle`
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

Since in the particular case of :math:`N=4` only one rotation is
required we can combine the above components to build the full circuit
for Grover’s algorithm for the case
:math:`\lvert w \rangle = \lvert 00 \rangle`:

The other three circuits can be constructed in the same way and will not
be depicted here.

2.1 Qiskit Implementation
~~~~~~~~~~~~~~~~~~~~~~~~~

We now implement Grover’s algorithm for the above case of 2 qubits for
:math:`\lvert w \rangle = \lvert 00 \rangle`.

.. code:: python

   #initialization
   import matplotlib.pyplot as plt
   %matplotlib inline
   %config InlineBackend.figure_format = 'svg' # Makes the images look nice
   import numpy as np

   # importing Qiskit
   from qiskit import IBMQ, BasicAer, Aer
   from qiskit.providers.ibmq import least_busy
   from qiskit import QuantumCircuit, ClassicalRegister, QuantumRegister, execute

   # import basic plot tools
   from qiskit.visualization import plot_histogram

We start by preparing a quantum circuit for two qubits and a classical
register with two bits.

.. code:: python

   qr = QuantumRegister(2)
   cr = ClassicalRegister(2)

   groverCircuit = QuantumCircuit(qr,cr)

Then we simply need to write out the commands for the circuit depicted
above. First, Initialize the state :math:`|s\rangle`:

.. code:: python

   groverCircuit.h(qr)

Apply the Oracle for :math:`|w\rangle = |00\rangle`:

.. code:: python

   groverCircuit.x(qr)
   groverCircuit.cz(qr[0],qr[1])
   groverCircuit.x(qr)

Apply a Hadamard operation to both qubits:

.. code:: python

   groverCircuit.h(qr)

Apply the reflection :math:`U_s`:

.. code:: python

   groverCircuit.z(qr)
   groverCircuit.cz(qr[0],qr[1])

Apply the final Hadamard to both qubits:

.. code:: python

   groverCircuit.h(qr)

Drawing the circuit confirms that we have assembled it correctly:

.. code:: python

   groverCircuit.draw(output="mpl")

2.1.1 Experiment with Simulators 
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Let’s run the circuit in simulation. First, we can verify that we have
the correct statevector:

.. code:: python

   backend_sim = Aer.get_backend('statevector_simulator')
   job_sim = execute(groverCircuit, backend_sim)
   statevec = job_sim.result().get_statevector()
   print(statevec)

Now let us measure the state and create the corresponding histogram
experiments:

.. code:: python

   groverCircuit.measure(qr,cr)

   backend = BasicAer.get_backend('qasm_simulator')
   shots = 1024
   results = execute(groverCircuit, backend=backend, shots=shots).result()
   answer = results.get_counts()
   plot_histogram(answer)

We confirm that in 100% of the cases the element :math:`|00\rangle` is
found.

2.1.2 Experiment with Real Devices 
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

We can run the circuit on the real device as below.

.. code:: python

   # Load IBM Q account and get the least busy backend device
   provider = IBMQ.load_account()
   device = least_busy(provider.backends(simulator=False))
   print("Running on current least busy device: ", device)

.. code:: python

   # Run our circuit on the least busy backend. Monitor the execution of the job in the queue
   from qiskit.tools.monitor import job_monitor
   job = execute(groverCircuit, backend=device, shots=1024, max_credits=10)
   job_monitor(job, interval = 2)

.. code:: python

   # Get the results from the computation
   results = job.result()
   answer = results.get_counts(groverCircuit)
   plot_histogram(answer)

We confirm that in the majority of the cases the element
:math:`|00\rangle` is found. The other results are due to errors in the
quantum computation.

3. Example: 3 Qubits 
--------------------

We now go through the example of Grover’s algorithm for 3 qubits with
two marked states :math:`\lvert101\rangle` and :math:`\lvert110\rangle`,
following the implementation found in Reference [2]. The quantum circuit
to solve the problem using a phase oracle is:

.. raw:: html

   <ol>

.. raw:: html

   <li>

Apply Hadamard gates to :math:`3` qubits initialised to
:math:`\lvert000\rangle` to create a uniform superposition:

.. math::

   \lvert \psi_1 \rangle = \frac{1}{\sqrt{8}} \left( 
       \lvert000\rangle + \lvert001\rangle + \lvert010\rangle + \lvert011\rangle + 
       \lvert100\rangle + \lvert101\rangle + \lvert110\rangle + \lvert111\rangle \right) 

.. raw:: html

   </li>

.. raw:: html

   <li>

Mark states :math:`\lvert101\rangle` and :math:`\lvert110\rangle` using
a phase oracle:

.. math::

   \lvert \psi_2 \rangle = \frac{1}{\sqrt{8}} \left( 
       \lvert000\rangle + \lvert001\rangle + \lvert010\rangle + \lvert011\rangle + 
       \lvert100\rangle - \lvert101\rangle - \lvert110\rangle + \lvert111\rangle \right) 

.. raw:: html

   </li>

.. raw:: html

   <li>

Perform the reflection around the average amplitute:

.. raw:: html

   <ol>

.. raw:: html

   <li>

Apply Hadamard gates to the qubits

.. math::

   \lvert \psi_{3a} \rangle = \frac{1}{2} \left( 
           \lvert000\rangle +\lvert011\rangle +\lvert100\rangle -\lvert111\rangle \right) 

.. raw:: html

   </li>

.. raw:: html

   <li>

Apply X gates to the qubits

.. math::

   \lvert \psi_{3b} \rangle = \frac{1}{2} \left( 
           -\lvert000\rangle +\lvert011\rangle +\lvert100\rangle +\lvert111\rangle \right) 

.. raw:: html

   </li>

.. raw:: html

   <li>

Apply a doubly controlled Z gate between the 1, 2 (controls) and 3
(target) qubits

.. math::

   \lvert \psi_{3c} \rangle = \frac{1}{2} \left( 
           -\lvert000\rangle +\lvert011\rangle +\lvert100\rangle -\lvert111\rangle \right) 

.. raw:: html

   </li>

.. raw:: html

   <li>

Apply X gates to the qubits

.. math::

   \lvert \psi_{3d} \rangle = \frac{1}{2} \left( 
           -\lvert000\rangle +\lvert011\rangle +\lvert100\rangle -\lvert111\rangle \right) 

.. raw:: html

   </li>

.. raw:: html

   <li>

Apply Hadamard gates to the qubits

.. math::

   \lvert \psi_{3e} \rangle = \frac{1}{\sqrt{2}} \left( 
           -\lvert101\rangle -\lvert110\rangle \right) 

.. raw:: html

   </li>

.. raw:: html

   </ol>

.. raw:: html

   </li>

.. raw:: html

   <li>

Measure the :math:`3` qubits to retrieve states :math:`\lvert101\rangle`
and :math:`\lvert110\rangle`

.. raw:: html

   </li>

.. raw:: html

   </ol>

Note that since there are 2 solutions and 8 possibilities, we will only
need to run one iteration (steps 2 & 3).

.. _qiskit-implementation-1:

3.1 Qiskit Implementation 
~~~~~~~~~~~~~~~~~~~~~~~~~

We now implement Grover’s algorithm for the above `example <example>`__
for :math:`3`-qubits and searching for two marked states
:math:`\lvert101\rangle` and :math:`\lvert110\rangle`.

We create a phase oracle that will mark states :math:`\lvert101\rangle`
and :math:`\lvert110\rangle` as the results (step 1).

.. code:: python

   def phase_oracle(circuit, register):
       circuit.cz(qr[2],qr[0])
       circuit.cz(qr[2],qr[1])

Next we set up the circuit for inversion about the average (step 2),
where we will first need to define a function that creates a
multiple-controlled Z gate.

.. code:: python

   def n_controlled_Z(circuit, controls, target):
       """Implement a Z gate with multiple controls"""
       if (len(controls) > 2):
           raise ValueError('The controlled Z with more than 2 controls is not implemented')
       elif (len(controls) == 1):
           circuit.h(target)
           circuit.cx(controls[0], target)
           circuit.h(target)
       elif (len(controls) == 2):
           circuit.h(target)
           circuit.ccx(controls[0], controls[1], target)
           circuit.h(target)

.. code:: python

   def inversion_about_average(circuit, register, n, barriers):
       """Apply inversion about the average step of Grover's algorithm."""
       circuit.h(register)
       circuit.x(register)
       
       if barriers:
           circuit.barrier()
       
       n_controlled_Z(circuit, [register[j] for j in range(n-1)], register[n-1])
       
       if barriers:
           circuit.barrier()
       
       circuit.x(register)
       circuit.h(register)

Now we put the pieces together, with the creation of a uniform
superposition at the start of the circuit and a measurement at the end.
Note that since there are 2 solutions and 8 possibilities, we will only
need to run one iteration.

.. code:: python

   barriers = True

   qr = QuantumRegister(3)
   cr = ClassicalRegister(3)

   groverCircuit = QuantumCircuit(qr,cr)
   groverCircuit.h(qr)

   if barriers:
       groverCircuit.barrier()

   phase_oracle(groverCircuit, qr)

   if barriers:
       groverCircuit.barrier()

   inversion_about_average(groverCircuit, qr, 3, barriers)

   if barriers:
       groverCircuit.barrier()

   groverCircuit.measure(qr,cr)

.. code:: python

   groverCircuit.draw(output="mpl")

.. _experiment-with-simulators-1:

3.1.1 Experiment with Simulators 
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

We can run the above circuit on the simulator.

.. code:: python

   backend = BasicAer.get_backend('qasm_simulator')
   shots = 1024
   results = execute(groverCircuit, backend=backend, shots=shots).result()
   answer = results.get_counts()
   plot_histogram(answer)

As we can see, the algorithm discovers our marked states
:math:`\lvert101\rangle` and :math:`\lvert110\rangle`.

.. _experiment-with-real-devices-1:

3.1.2 Experiment with Real Devices 
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

We can run the circuit on the real device as below.

.. code:: python

   backend = least_busy(provider.backends(filters=lambda x: x.configuration().n_qubits >= 3 and 
                                      not x.configuration().simulator and x.status().operational==True))
   print("least busy backend: ", backend)

.. code:: python

   # Run our circuit on the least busy backend. Monitor the execution of the job in the queue
   from qiskit.tools.monitor import job_monitor

   shots = 1024
   job = execute(groverCircuit, backend=backend, shots=shots)

   job_monitor(job, interval = 2)

.. code:: python

   # Get the results from the computation
   results = job.result()
   answer = results.get_counts(groverCircuit)
   plot_histogram(answer)

As we can see, the algorithm discovers our marked states
:math:`\lvert101\rangle` and :math:`\lvert110\rangle`. The other results
are due to errors in the quantum computation.

4. Problems 
-----------

1. The above `example <#example>`__ and
   `implementation <#implementation>`__ of Grover is to find the two
   marked :math:`3`-qubit states :math:`\lvert101\rangle` and
   :math:`\lvert110\rangle`. Modify the implementation to find one
   marked :math:`2`-qubit state :math:`\lvert01\rangle`. Are the results
   what you expect? Explain.

2. The above `example <#example>`__ and
   `implementation <#implementation>`__ of Grover is to find the two
   marked :math:`3`-qubit states :math:`\lvert101\rangle` and
   :math:`\lvert110\rangle`. Modify the implementation to find one
   marked :math:`4`-qubit state :math:`\lvert0101\rangle`. Are the
   results what you expect? Explain.

5. References 
-------------

1. L. K. Grover (1996), “A fast quantum mechanical algorithm for
   database search”, Proceedings of the 28th Annual ACM Symposium on the
   Theory of Computing (STOC 1996),
   `doi:10.1145/237814.237866 <http://doi.acm.org/10.1145/237814.237866>`__,
   `arXiv:quant-ph/9605043 <https://arxiv.org/abs/quant-ph/9605043>`__
2. C. Figgatt, D. Maslov, K. A. Landsman, N. M. Linke, S. Debnath & C.
   Monroe (2017), “Complete 3-Qubit Grover search on a programmable
   quantum computer”, Nature Communications, Vol 8, Art 1918,
   `doi:10.1038/s41467-017-01904-7 <https://doi.org/10.1038/s41467-017-01904-7>`__,
   `arXiv:1703.10535 <https://arxiv.org/abs/1703.10535>`__
3. I. Chuang & M. Nielsen, “Quantum Computation and Quantum
   Information”, Cambridge: Cambridge University Press, 2000.

.. code:: python

   import qiskit
   qiskit.__qiskit_version__
