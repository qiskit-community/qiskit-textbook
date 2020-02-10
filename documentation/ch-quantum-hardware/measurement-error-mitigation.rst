Measurement Error Mitigation
============================

.. code:: python

   from qiskit import *

Introduction
~~~~~~~~~~~~

The effect of noise is to give us outputs that are not quite correct.
The effect of noise that occurs throughout a computation will be quite
complex in general, as one would have to consider how each gate
transforms the effect of each error.

A simpler form of noise is that occuring during final measurement. At
this point, the only job remaining in the circuit is to extract a bit
string as an output. For an :math:`n` qubit final measurement, this
means extracting one of the :math:`2^n` possible :math:`n` bit strings.
As a simple model of the noise in this process, we can imagine that the
measurement first selects one of these outputs in a perfect and
noiseless manner, and then noise subsequently causes this perfect output
to be randomly perturbed before it is returned to the user.

Given this model, it is very easy to determine exactly what the effects
of measurement errors are. We can simply prepare each of the :math:`2^n`
possible basis states, immediately measure them, and see what
probability exists for each outcome.

As an example, we will first create a simple noise model, which randomly
flips each bit in an output with probability :math:`p`.

.. code:: python

   from qiskit.providers.aer.noise import NoiseModel
   from qiskit.providers.aer.noise.errors import pauli_error, depolarizing_error

   def get_noise(p):

       error_meas = pauli_error([('X',p), ('I', 1 - p)])

       noise_model = NoiseModel()
       noise_model.add_all_qubit_quantum_error(error_meas, "measure") # measurement error is applied to measurements
           
       return noise_model

Let’s start with an instance of this in which each bit is flipped
:math:`1\%` of the time.

.. code:: python

   noise_model = get_noise(0.01)

Now we can test out its effects. Specifically, let’s define a two qubit
circuit and prepare the states :math:`\left|00\right\rangle`,
:math:`\left|01\right\rangle`, :math:`\left|10\right\rangle` and
:math:`\left|11\right\rangle`. Without noise, these would lead to the
definite outputs ``'00'``, ``'01'``, ``'10'`` and ``'11'``,
respectively. Let’s see what happens with noise. Here, and in the rest
of this section, the number of samples taken for each circuit will be
``shots=10000``.

.. code:: python

   for state in ['00','01','10','11']:
       qc = QuantumCircuit(2,2)
       if state[0]=='1':
           qc.x(1)
       if state[1]=='1':
           qc.x(0)  
       qc.measure(qc.qregs[0],qc.cregs[0])
       print(state+' becomes',
             execute(qc,Aer.get_backend('qasm_simulator'),noise_model=noise_model,shots=10000).result().get_counts())

.. raw:: html

   <!-- #region -->

Here we find that the correct output is certainly the most dominant.
Ones that differ on only a single bit (such as ``'01'``, ``'10'`` in the
case that the correct output is ``'00'`` or ``'11'``), occur around
:math:`1\%` of the time. Those than differ on two bits occur only a
handful of times in 10000 samples, if at all.

So what about if we ran a circuit with this same noise model, and got an
result like the following?

::

   {'10': 98, '11': 4884, '01': 111, '00': 4907}

Here ``'01'`` and ``'10'`` occur for around :math:`1\%` of all samples.
We know from our analysis of the basis states that such a result can be
expected when these outcomes should in fact never occur, but instead the
result should be something that differs from them by only one bit:
``'00'`` or ``'11'``. When we look at the results for those two
outcomes, we can see that they occur with roughly equal probability. We
can therefore conclude that the initial state was not simply
:math:`\left|00\right\rangle`, or :math:`\left|11\right\rangle`, but an
equal superposition of the two. If true, this means that the result
should have been something along the lines of.

::

   {'11': 4977, '00': 5023}

Here is a circuit that produces results like this (up to statistical
fluctuations).

.. code:: python

   qc = QuantumCircuit(2,2)
   qc.h(0)
   qc.cx(0,1)  
   qc.measure(qc.qregs[0],qc.cregs[0])
   print(execute(qc,Aer.get_backend('qasm_simulator'),noise_model=noise_model,shots=10000).result().get_counts())

.. raw:: html

   <!-- #region -->

In this example we first looked at results for each of the definite
basis states, and used these results to mitigate the effects of errors
for a more general form of state. This is the basic principle behind
measurement error mitigation.

Error mitigation in with linear algebra
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Now we just need to find a way to perform the mitigation algorithmically
rather than manually. We will do this by describing the random process
using matrices. For this we need to rewrite our counts dictionaries as
column vectors. For example, the dictionary
``{'10': 96, '11': 1, '01': 95, '00': 9808}`` describing would be
rewritten as

.. math::


   C = 
   \begin{pmatrix}
       9808 \\
       95 \\
       96 \\
       1
   \end{pmatrix}.

Here the first element is that for ``'00'``, the next is that for
``'01'``, and so on.

The information gathered from the basis states
:math:`\left|00\right\rangle`, :math:`\left|01\right\rangle`,
:math:`\left|10\right\rangle` and :math:`\left|11\right\rangle` can then
be used to define a matrix, which rotates from an ideal set of counts to
one affected by measurement noise. This is done by simply taking the
counts dictionary for :math:`\left|00\right\rangle`, normalizing it it
so that all elements sum to one, and then using it as the first column
of the matrix. The next column is similarly defined by the counts
dictionary obtained for :math:`\left|00\right\rangle`, and so on.

There will be statistical variations each time the circuit for each
basis state is run. In the following, we will use the data obtained when
this section was written, which was as follows.

::

   00 becomes {'10': 96, '11': 1, '01': 95, '00': 9808}
   01 becomes {'10': 2, '11': 103, '01': 9788, '00': 107}
   10 becomes {'10': 9814, '11': 90, '01': 1, '00': 95}
   11 becomes {'10': 87, '11': 9805, '01': 107, '00': 1}

This gives us the following matrix.

.. math::


   M = 
   \begin{pmatrix}
       0.9808&0.0107&0.0095&0.0001 \\
       0.0095&0.9788&0.0001&0.0107 \\
       0.0096&0.0002&0.9814&0.0087 \\
       0.0001&0.0103&0.0090&0.9805
   \end{pmatrix}

If we now take the vector describing the perfect results for a given
state, applying this matrix gives us a good approximation of the results
when measurement noise is present.

.. math::  C_{noisy} = M ~ C_{ideal}

.

As an example, let’s apply this process for the state
:math:`(\left|00\right\rangle+\left|11\right\rangle)/\sqrt{2}`,

.. math::


   \begin{pmatrix}
       0.9808&0.0107&0.0095&0.0001 \\
       0.0095&0.9788&0.0001&0.0107 \\
       0.0096&0.0002&0.9814&0.0087 \\
       0.0001&0.0103&0.0090&0.9805
   \end{pmatrix}
   \begin{pmatrix}
       0 \\
       5000 \\
       5000 \\
       0
   \end{pmatrix}
   =
   \begin{pmatrix}
       101 \\
       4895.5 \\
       4908 \\
       96.5
   \end{pmatrix}.

In code, we can express this as follows.

.. code:: python

   import numpy as np

   M = [[0.9808,0.0107,0.0095,0.0001],
       [0.0095,0.9788,0.0001,0.0107],
       [0.0096,0.0002,0.9814,0.0087],
       [0.0001,0.0103,0.0090,0.9805]]

   Cideal = [[0],
             [5000],
             [5000],
             [0]]

   Cnoisy = np.dot( M, Cideal)
   print('C_noisy =\n',Cnoisy)

Either way, the resulting counts found in :math:`C_{noisy}`, for
measuring the
:math:`(\left|00\right\rangle+\left|11\right\rangle)/\sqrt{2}` with
measurement noise, come out quite close to the actual data we found
earlier. So this matrix method is indeed a good way of predicting noisy
results given a knowledge of what the results should be.

Unfortunately, this is the exact opposite of what we need. Instead of a
way to transform ideal counts data into noisy data, we need a way to
transform noisy data into ideal data. In linear algebra, we do this for
a matrix :math:`M` by finding the inverse matrix :math:`M^{-1}`,

.. math:: C_{ideal} = M^{-1} C_{noisy}.

.. code:: python

   import scipy.linalg as la


   M = [[0.9808,0.0107,0.0095,0.0001],
       [0.0095,0.9788,0.0001,0.0107],
       [0.0096,0.0002,0.9814,0.0087],
       [0.0001,0.0103,0.0090,0.9805]]

   Minv = la.inv(M)

   print(Minv)

Applying this inverse to :math:`C_{noisy}`, we can obtain an
approximation of the true counts.

.. code:: python

   Cmitigated = np.dot( Minv, Cnoisy)
   print('C_mitigated =\n',Cmitigated)

Of course, counts should be integers, and so these values need to be
rounded. This gives us a very nice result.

.. math::


   C_{mitigated} = 
   \begin{pmatrix}
       0 \\
       5000 \\
       5000 \\
       0
   \end{pmatrix}

This is exactly the true result we desire. Our mitigation worked
extremely well!

Error mitigation in Qiskit
~~~~~~~~~~~~~~~~~~~~~~~~~~

.. code:: python

   from qiskit.ignis.mitigation.measurement import (complete_meas_cal,CompleteMeasFitter)

The process of measurement error mitigation can also be done using tools
from Qiskit. This handles the collection of data for the basis states,
the construction of the matrices and the calculation of the inverse. The
latter can be done using the pseudo inverse, as we saw above. However,
the default is an even more sophisticated method using least squares
fitting.

As an example, let’s stick with doing error mitigation for a pair of
qubits. For this we define a two qubit quantum register, and feed it
into the function ``complete_meas_cal``.

.. code:: python

   qr = qiskit.QuantumRegister(2)
   meas_calibs, state_labels = complete_meas_cal(qr=qr, circlabel='mcal')

This creates a set of circuits to take measurements for each of the four
basis states for two qubits: :math:`\left|00\right\rangle`,
:math:`\left|01\right\rangle`, :math:`\left|10\right\rangle` and
:math:`\left|11\right\rangle`.

.. code:: python

   for circuit in meas_calibs:
       print('Circuit',circuit.name)
       print(circuit)
       print()

Let’s now run these circuits without any noise present.

.. code:: python

   # Execute the calibration circuits without noise
   backend = qiskit.Aer.get_backend('qasm_simulator')
   job = qiskit.execute(meas_calibs, backend=backend, shots=1000)
   cal_results = job.result()

With the results we can construct the calibration matrix, which we have
been calling :math:`M`.

.. code:: python

   meas_fitter = CompleteMeasFitter(cal_results, state_labels, circlabel='mcal')
   print(meas_fitter.cal_matrix)

With no noise present, this is simply the identity matrix.

Now let’s create a noise model. And to make things interesting, let’s
have the errors be ten times more likely than before.

.. code:: python

   noise_model = get_noise(0.1)

Again we can run the circuits, and look at the calibration matrix,
:math:`M`.

.. code:: python

   backend = qiskit.Aer.get_backend('qasm_simulator')
   job = qiskit.execute(meas_calibs, backend=backend, shots=1000, noise_model=noise_model)
   cal_results = job.result()

   meas_fitter = CompleteMeasFitter(cal_results, state_labels, circlabel='mcal')
   print(meas_fitter.cal_matrix)

This time we find a more interesting matrix, and one that is not
invertible. Let’s see how well we can mitigate for this noise. Again,
let’s use the Bell state
:math:`(\left|00\right\rangle+\left|11\right\rangle)/\sqrt{2}` for our
test.

.. code:: python

   qc = QuantumCircuit(2,2)
   qc.h(0)
   qc.cx(0,1)  
   qc.measure(qc.qregs[0],qc.cregs[0])

   results = qiskit.execute(qc, backend=backend, shots=10000, noise_model=noise_model).result()

   noisy_counts = results.get_counts()
   print(noisy_counts)

In Qiskit we mitigate for the noise by creating a measurement filter
object. Then, taking the results from above, we use this to calulate a
mitigated set of counts. Qiskit returns this as a dictionary, so that
the user doesn’t need to use vectors themselves to get the result.

.. code:: python

   # Get the filter object
   meas_filter = meas_fitter.filter

   # Results with mitigation
   mitigated_results = meas_filter.apply(results)
   mitigated_counts = mitigated_results.get_counts(0)

To see the results most clearly, let’s plot both the noisy and mitigated
results.

.. code:: python

   from qiskit.visualization import *
   %config InlineBackend.figure_format = 'svg' # Makes the images look nice
   plot_histogram([noisy_counts, mitigated_counts], legend=['noisy', 'mitigated'])

Here we have taken results for which almost :math:`20\%` of samples are
in the wrong state, and turned it into an exact representation of what
the true results should be. However, this example does have just two
qubits with a simple noise model. For more qubits, and more complex
noise models or data from real devices, the mitigation will have more of
a challenge. Perhaps you might find methods that are better than those
Qiskit uses!
