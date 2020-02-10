Proving Universality
====================

What does it mean for a computer to do everything that it could possibly
do? This was a question tackled by Alan Turing before we even had a good
idea of what a computer was.

To ask this question for our classical computers, and specifically for
our standard digital computers, we need to strip away all the screens,
speakers and fancy input devices. What we are left with is simply a
machine that converts input bit strings into output bit strings. If a
device can perform any such conversion, taking any arbitrary set of
inputs and coverting them to an arbitrarily chosen set of outputs, we
call it *universal*.

It turns out that the requirements for universality on these devices are
quite reasonable. The gates we needed to perform addition in ‘The atoms
of computation’ are also sufficient to implement any possible
computation. In fact, just the classical NAND gate is enough, when
combined together in sufficient quantities.

Though our current computers can do everything in theory, some tasks are
too resource-intensive in practice. In our study of how to add, we saw
that the required resources scaled linearly with the problem size. For
example, if we double the number of digits in the numbers, we double the
number of small scale additions we need to make.

For many other problems, the required resources scale exponentially with
the input size. Factorization is a prominent example. In a recent study
[1], a 320-digit number took CPU years to factorize. For numbers that
are not much larger, there aren’t enough computing resources in the
world to tackle them – even though those same numbers could be added or
multiplied on just a smartphone in a much more reasonable time.

Quantum computers will alleviate these problems by achieving
universality in a fundamentally different way. As we saw in ‘The unique
properties of qubits’, the variables of quantum computing are not
equivalent to those of standard computers. The gates that we use, such
as those in the last section, go beyond what is possible for the gates
of standard computers. Because of this, we can find ways to achieve
results that are otherwise impossible.

So how to define what universality is for a quantum computer? We can do
this in a way that mirrors the definition discussed above. Just as
digital computers convert sets of input bit strings to sets of output
bit strings, unitary operations convert sets of orthogonal input states
into orthogonal output states.

As a special case, these states could describe bit strings expressed in
quantum form. If we can achieve any unitary, we can therefore achieve
universality in the same way as for digital computers.

Another special case is that the input and output states could describe
real physical systems. The unitary would then correspond to a time
evolution. When expressed in an exponential form using a suitable
Hermitian matrix, that matrix would correspond to the Hamiltonian.
Achieving any unitary would therefore correspond to simulating any time
evolution, and engineering the effects of any Hamiltonian. This is also
an important problem that is impractical for classical computers, but is
a natural application of quantum computers.

Universality for quantum computers is then simply this: the ability to
achieve any desired unitary on any arbitrary number of qubits.

As for classical computers, we will need to split this big job up into
manageable chunks. We’ll need to find a basic set of gates that will
allow us to achieve this. As we’ll see, the single- and two-qubit gates
of the last section are sufficient for the task.

Suppose we wish to implement the unitary

.. math::


   U = e^{i(aX + bZ)},

but the only gates we have are
:math:`R_x(\theta) = e^{i \frac{\theta}{2} X}` and
:math:`R_z(\theta) = e^{i \frac{\theta}{2} Z}`. The best way to solve
this problem would be to use Euler angles. But let’s instead consider a
different method.

The Hermitian matrix in the exponential for :math:`U` is simply the sum
of those for the :math:`R_x(\theta)` and :math:`R_z(\theta)` rotations.
This suggests a naive approach to solving our problem: we could apply
:math:`R_z(a) = e^{i bZ}` followed by :math:`R_x(b) = e^{i a X}`.
Unfortunately, because we are exponentiating matrices that do not
commute, this approach will not work.

.. math::


   e^{i a X} e^{i b X} \neq e^{i(aX + bZ)}

However, we could use the following modified version:

.. math::


   U = \lim_{n\rightarrow\infty} ~ \left(e^{iaX/n}e^{ibZ/n}\right)^n.

Here we split :math:`U` up into :math:`n` small slices. For each slice,
it is a good approximation to say that

.. math::


   e^{iaX/n}e^{ibZ/n} = e^{i(aX + bZ)/n}

The error in this approximation scales as :math:`1/n^2`. When we combine
the :math:`n` slices, we get an approximation of our target unitary
whose error scales as :math:`1/n`. So by simply increasing the number of
slices, we can get as close to :math:`U` as we need. Other methods of
creating the sequence are also possible to get even more accurate
versions of our target unitary.

The power of this method is that it can be used in complex cases than
just a single qubit. For example, consider the unitary

.. math::


   U = e^{i(aX\otimes X\otimes X + bZ\otimes Z\otimes Z)}.

We know how to create the unitary
:math:`e^{i\frac{\theta}{2} X\otimes X\otimes X}` from a single qubit
:math:`R_x(\theta)` and two controlled-NOTs.

.. code:: python

   qc.cx(0,2)
   qc.cx(0,1)
   qc.rx(theta,0)
   qc.cx(0,1)
   qc.cx(0,1)

With a few Hadamards, we can do the same for
:math:`e^{i\frac{\theta}{2} Z\otimes Z\otimes Z}`.

.. code:: python

   qc.h(0)
   qc.h(1)
   qc.h(2)
   qc.cx(0,2)
   qc.cx(0,1)
   qc.rx(theta,0)
   qc.cx(0,1)
   qc.cx(0,1)
   qc.h(2)
   qc.h(1)
   qc.h(0)

This gives us the ability to reproduce a small slice of our new,
three-qubit :math:`U`:

.. math::


   e^{iaX\otimes X\otimes X/n}e^{ibZ\otimes Z\otimes Z/n} = e^{i(aX\otimes X\otimes X + bZ\otimes Z\otimes Z)/n}.

As before, we can then combine the slices together to get an arbitrarily
accurate approximation of :math:`U`.

This method continues to work as we increase the number of qubits, and
also the number of terms that need simulating. Care must be taken to
ensure that the approximation remains accurate, but this can be done in
ways that require reasonable resources. Adding extra terms to simulate,
or increasing the desired accuracy, only require the complexity of the
method to increase polynomially.

Methods of this form can reproduce any unitary :math:`U = e^{iH}` for
which :math:`H` can be expressed as a sum of tensor products of Paulis.
Since we have shown previously that all matrices can be expressed in
this way, this is sufficient to show that we can reproduce all
unitaries. Though other methods may be better in practice, the main
concept to take away from this chapter is that there is certainly a way
to reproduce all multi-qubit unitaries using only the basic operations
found in Qiskit. Quantum universality can be achieved.

References
~~~~~~~~~~

[1] `“Factorization of a 1061-bit number by the Special Number Field
Sieve” <https://eprint.iacr.org/2012/444.pdf>`__ by Greg Childers.
