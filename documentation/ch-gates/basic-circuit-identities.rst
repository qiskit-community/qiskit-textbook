Basic Circuit Identities
========================

.. code:: ipython3

    from qiskit import *
    from qiskit.circuit import Gate

When we program quantum computers, our aim is always to build useful
quantum circuits from the basic building blocks. But sometimes, we might
not have all the basic building blocks we want. In this section, we’ll
look at how we can transform basic gates into each other, and how to use
them to build some gates that are slightly more complex (but still
pretty basic).

Many of the techniques discussed in this chapter were first proposed in
a paper by Barenco and coauthors in 1995 [1].

Making a controlled-\ :math:`Z` from a CNOT
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The controlled-Z or ``cz`` gate is another well-used two-qubit gate.
Just as the CNOT applies an :math:`X` to its target qubit whenever its
control is in state :math:`|1\rangle`, the controlled-\ :math:`Z`
applies a :math:`Z` in the same case. In Qasm it can be invoked directly
with

.. code:: python

   # a controlled-Z
   qc.cz(c,t)

where c and t are the control and target qubits. In IBM Q devices,
however, the only kind of two-qubit gate that can be directly applied is
the CNOT. We therefore need a way to transform one to the other.

The process for this is quite simple. We know that the Hadamard
transforms the states :math:`|0\rangle` and :math:`|1\rangle` to the
states :math:`|+\rangle` and :math:`|-\rangle`. We also know that the
effect of the :math:`Z` gate on the states :math:`|+\rangle` and
:math:`|-\rangle` is the same as that for :math:`X` on the state
:math:`|0\rangle` and :math:`|1\rangle`. From this reasoning, or from
simply multiplying matrices, we find that

.. math::

   H X H = Z,\\\\
   H Z H = X.

 The same trick can be used to transform a CNOT into a
controlled-\ :math:`Z`. All we need to do is precede and follow the CNOT
with a Hadamard on the target qubit. This will transform any :math:`X`
applied to that qubit into a :math:`Z`.

.. code:: python

   # also a controlled-Z
   qc.h(t)
   qc.cx(c,t)
   qc.h(t)

More generally, we can transform a single CNOT into a controlled version
of any rotation around the Bloch sphere by an angle :math:`\pi`, by
simply preceding and following it with the correct rotations. For
example, a controlled-\ :math:`Y`:

.. code:: python

   # a controlled-Y
   qc.sdg(t)
   qc.cx(c,t)
   qc.s(t)

and a controlled-\ :math:`H`:

.. code:: python

   # a controlled-H
   qc.ry(-pi/4,t)
   qc.cx(c,t)
   qc.ry(pi/4,t)

Swapping qubits
~~~~~~~~~~~~~~~

Sometimes we need to move information around in a quantum computer. For
some qubit implementations, this could be done by physically moving
them. Another option is simply to move the state between two qubits.
This is done by the SWAP gate.

.. code:: python

   # swaps states of qubits a and b
   qc.swap(a,b)

The command above directly invokes this gate, but let’s see how we might
make it using our standard gate set. For this, we’ll need to consider a
few examples.

First, we’ll look at the case that qubit a is in state :math:`|1\rangle`
and qubit b is in state :math:`|0\rangle`. For this we’ll apply the
following gates:

.. code:: python

   # swap a 1 from a to b
   qc.cx(a,b) # copies 1 from a to b
   qc.cx(b,a) # uses the 1 on b to rotate the state of a to 0

This has the effect of putting qubit b in state :math:`|1\rangle` and
qubit a in state :math:`|0\rangle`. In this case at least, we have done
a SWAP.

Now let’s take this state and SWAP back to the original one. As you may
have guessed, we can do this with the reverse of the above process:

.. code:: python

   # swap a q from b to a
   qc.cx(b,a) # copies 1 from b to a
   qc.cx(a,b) # uses the 1 on a to rotate the state of b to 0

Note that in these two processes, the first gate of one would have no
effect on the initial state of the other. For example, when we swap the
:math:`|1\rangle` b to a, the first gate is ``cx q[b], q[a]``. If this
were instead applied to a state where no :math:`|1\rangle` was initially
on b, it would have no effect.

Note also that for these two processes, the final gate of one would have
no effect on the final state of the other. For example, the final
``cx q[b], q[a]`` that is required when we swap the :math:`|1\rangle`
from a to b has no effect on the state where the :math:`|1\rangle` is
not on b.

With these observations, we can combine the two processes by adding an
ineffective gate from one onto the other. For example,

.. code:: python

   qc.cx(b,a)
   qc.cx(a,b)
   qc.cx(b,a)

We can think of this as a process that swaps a :math:`|1\rangle` from a
to b, but with a useless ``qc.cx(b,a)`` at the beginning. We can also
think of it as a process that swaps a :math:`|1\rangle` from b to a, but
with a useless ``qc.cx(b,a)`` at the end. Either way, the result is a
process that can do the swap both ways around.

It also has the correct effect on the :math:`|00\rangle` state. This is
symmetric, and so swapping the states should have no effect. Since the
CNOT gates have no effect when their control qubits are
:math:`|0\rangle`, the process correctly does nothing.

The :math:`|11\rangle` state is also symmetric, and so needs a trivial
effect from the swap. In this case, the first CNOT gate in the process
above will cause the second to have no effect, and the third undoes the
first. Therefore, the whole effect is indeed trivial.

We have thus found a way to decompose SWAP gates into our standard gate
set of single-qubit rotations and CNOT gates.

.. code:: python

   # swaps states of qubits a and b
   qc.cx(b,a)
   qc.cx(a,b)
   qc.cx(b,a)

It works for the states :math:`|00\rangle`, :math:`|01\rangle`,
:math:`|10\rangle` and :math:`|11\rangle`, as well as for all
superpositions of them. It therefore swaps all possible two-qubit
states.

The same effect would also result if we changed the order of the CNOT
gates:

.. code:: python

   # swaps states of qubits a and b
   qc.cx(a,b)
   qc.cx(b,a)
   qc.cx(a,b)

This is an equally valid way to get the SWAP gate.

The derivation used here was very much based on the z basis states, but
it could also be done by thinking about what is required to swap qubits
in states :math:`|+\rangle` and :math:`|-\rangle`. The resulting ways of
implementing the SWAP gate will be completely equivalent to the ones
here.

Making the CNOTs we need from the CNOTs we have
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The gates in any quantum computer are driven by the physics of the
underlying system. In IBM Q devices, the physics behind CNOTs means that
they cannot be directly applied to all possible pairs of qubits. For
those pairs for which a CNOT can be applied, it typically has a
particular orientation. One specific qubit must act as control, and the
other must act as the target, without allowing us to choose.

Changing the direction of a CNOT
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

Let’s deal with the second problem described above: If we have a CNOT
with control qubit :math:`c` and target qubit :math:`t`, how can we make
one for which qubit :math:`t` acts as the control and qubit :math:`c` is
the target?

This question would be very simple to answer for the
controlled-\ :math:`Z`. For this gate, it doesn’t matter which way
around the control and target qubits are.

.. code:: python

   qc.cz(c,t)

has exactly the same effect as

.. code:: python

   qc.cz(t,c)

This means that we can think of either one as the control, and the other
as the target.

To see why this is true, let’s remind ourselves of what the Z gate is:

.. math::

   Z= \begin{pmatrix} 1&0 \\\\\\\\ 0&-1 \end{pmatrix}.

 We can think of this as multiplying the state by :math:`-1`, but only
when it is :math:`|1\rangle`.

For a controlled-\ :math:`Z` gate, the control qubit must be in state
:math:`|1\rangle` for a :math:`Z` to be applied to the target qubit.
Given the above property of :math:`Z`, this only has an effect when the
target is in state :math:`|1\rangle`. We can therefore think of the
controlled-\ :math:`Z` gate as one that multiplies the state of two
qubits by :math:`-1`, but only when the state is :math:`|11\rangle`.

This new interpretation is phrased in a perfectly symmetric way, and
demonstrates that the labels of ‘control’ and ‘target’ are not necessary
for this gate.

This property gives us a way to reverse the orientation of a CNOT. We
can first turn the CNOT into a controlled-\ :math:`Z` by using the
method described earlier: placing a Hadamard both before and after on
the target qubit.

.. code:: python

   # a cz
   qc.h(t)
   qc.cx(c,t)
   qc.h(t)

Then, since we are free to choose which way around to think about a
controlled-\ :math:`Z`\ ’s action, we can choose to think of :math:`t`
as the control and :math:`c` as the target. We can then transform this
controlled-\ :math:`Z` into a corresponding CNOT. We just need to place
a Hadamard both before and after on the target qubit (which is now qubit
:math:`c`).

.. code:: python

   # a cx with control qubit t and target qubit c
   qc.h(c)
   qc.h(t)
   qc.cx(c,t)
   qc.h(t)
   qc.h(c)

And there we have it: we’ve turned around the CNOT. All that is needed
is a Hadamard on both qubits before and after.

The rest of this subsection is dedicated to another explanation of how
to turn around a CNOT, with a bit of math (introduced in the ‘States for
Many Qubits’ article of the previous chapter, and the ‘Fun with
Matrices’ article of this chapter), and some different insight. Feel
free to skip over it.

Here is another way to write the CNOT gate:

.. math::

   {\rm CX}_{c,t} = |0\rangle \langle0| \otimes I + |1\rangle \langle1| \otimes X.

 Here the :math:`|1\rangle \langle1|` ensures that the second term only
affects those parts of a superposition for which the control qubit
:math:`c` is in state :math:`|1\rangle`. For those, the effect on the
target qubit t is :math:`X`. The first terms similarly address those
parts of the superposition for which the control qubit is in state
:math:`|0\rangle`, in which case it leaves the target qubit unaffected.

Now let’s do a little math. The :math:`X` gate has eigenvalues
:math:`\pm 1` for the states :math:`|+\rangle` and :math:`|-\rangle`.
The :math:`I` gate has an eigenvalue of :math:`1` for all states
including :math:`|+\rangle` and :math:`|-\rangle`. We can thus write
them in spectral form as

.. math::

   X = |+\rangle \langle+| \, \, - \, \, |-\rangle \langle-|, \, \, \, \,  I = |+\rangle \langle+| \, \,  + \, \,  |-\rangle \langle-|

 Substituting these into the expression above gives us

.. math::

   {\rm CX}_{c,t} = |0\rangle \langle0| \otimes |+\rangle \langle+| \, \,  + \, \, |0\rangle \langle0| \otimes |-\rangle \langle-| \, \,  + \, \, |1\rangle \langle1| \otimes |+\rangle \langle+| \, \,  - \, \, |1\rangle \langle1| \otimes |-\rangle \langle-|

 Using the states :math:`|0\rangle` and :math:`|1\rangle`, we can write
the :math:`Z` gate in spectral form, and also use an alternative (but
completely equivalent) spectral form for :math:`I`:

.. math::

   Z = |0\rangle \langle0| ~-~ |1\rangle \langle1|, ~~~ I = |0\rangle \langle0| ~+~ |1\rangle \langle1|.

 With these, we can factorize the parts of the CNOT expressed with the
:math:`|0\rangle` and :math:`|1\rangle` state:

.. math::

   {\rm CX}_{c,t} = I \otimes |+\rangle \langle+| \, \,  + \, \, Z \otimes |-\rangle \langle-|

 This gives us a whole new way to interpret the effect of the CNOT. The
$Z :raw-latex:`\otimes `\|-:raw-latex:`\rangle `:raw-latex:`\langle`-\|
$ term addresses the parts of a superposition for which qubit :math:`t`
is in state :math:`|-\rangle` and then applies a :math:`Z` gate to qubit
:math:`c`. The other term similarly does nothing to qubit :math:`c` when
qubit :math:`t` is in state :math:`|+\rangle.`

In this new interpretation, it is qubit :math:`t` that acts as the
control. It is the :math:`|+\rangle` and :math:`|-\rangle` states that
decide whether an action is performed, and that action is the gate
:math:`Z`. This sounds like a very different gate to our familiar CNOT,
and yet it is the CNOT. These are two equally true descriptions of its
effects.

Among the many uses of this property is the method to turn around a
CNOT. For example, consider applying a Hadamard to qubit :math:`c` both
before and after this CNOT:

.. code:: python

   h(c)
   cx(c,t)
   h(c)

This transforms the :math:`Z` in the $Z
:raw-latex:`\otimes `\|-:raw-latex:`\rangle `:raw-latex:`\langle`-\| $
term into an :math:`X`, and leaves the other term unchanged. The
combined effect is then a gate that applies an :math:`X` to qubit
:math:`c` when qubit :math:`t` is in state :math:`|-\rangle`. This is
halfway to what we are wanting to build.

To complete the process, we can apply a Hadamard both before and after
on qubit :math:`t`. This transforms the :math:`|+\rangle` and
:math:`|-\rangle` states in each term into :math:`|0\rangle` and
:math:`|1\rangle`. Now we have something that applies an :math:`X` to
qubit :math:`c` when qubit :math:`t` is in state :math:`|1\rangle`. This
is exactly what we want: a CNOT in reverse, with qubit :math:`t` as the
control and :math:`c` as the target.

CNOT between distant qubits
^^^^^^^^^^^^^^^^^^^^^^^^^^^

Suppose we have a control qubit :math:`c` and a target qubit :math:`t`,
and we want to do a CNOT gate between them. If this gate is directly
possible on a device, we can just do it. If it’s only possible to do the
CNOT in the wrong direction, we can use the method explained above. But
what if qubits :math:`c` and :math:`t` are not connected at all?

If qubits :math:`c` and :math:`t` are on completely different devices in
completely different labs in completely different countries, you may be
out of luck. But consider the case where it is possible to do a CNOT
between qubit :math:`c` and an additional qubit :math:`a`, and it is
also possible to do one between qubits :math:`a` and :math:`t`. The new
qubit can then be used to mediate the interaction between :math:`c` and
:math:`t`.

One way to do this is with the SWAP gate. We can simply SWAP :math:`a`
and t, do the CNOT between :math:`c` and :math:`a`, and then swap
:math:`a` and :math:`t` back again. The end result is that we have
effectively done a CNOT between :math:`c` and :math:`t`. The drawback of
this method is that it costs a lot of CNOT gates, with six needed to
implement the two SWAPs.

Another method is to use the following sequence of gates.

.. code:: python

   # a CNOT between qubits c and t, with no end effect on qubit a
   qc.cx(a,t)
   qc.cx(c,a)
   qc.cx(a,t)
   qc.cx(c,a)

To see how this works, first consider the case where qubit :math:`c` is
in state :math:`|0\rangle`. The effect of the ``cx(c,a)`` gates in this
case are trivial. This leaves only the two ``cx q[a], q[t]`` gates,
which cancel each other out. The net effect is therefore that nothing
happens.

If qubit :math:`c` is in state :math:`|1\rangle`, things are not quite
so simple. The effect of the ``cx q(c,a)`` gates is to toggle the value
of qubit :math:`a`; it turns any :math:`|0\rangle` in the state of qubit
:math:`a` into :math:`|1\rangle` and back again, and vice versa.

This toggle effect affects the action of the two ``cx(a,t)`` gates. It
ensures that whenever one is controlled on a :math:`|0\rangle` and has
trivial effect, the other is controlled on a :math:`|1\rangle` and
applies an :math:`X` to qubit :math:`t`. The end effect is that qubit
:math:`a` is left unchanged, but qubit :math:`t` will always have had an
:math:`X` applied to it.

Putting everything together, this means that an :math:`X` is applied to
qubit :math:`t` only when qubit :math:`c` is in state :math:`|1\rangle`.
Qubit :math:`a` is left unaffected. We have therefore engineered a CNOT
between qubits :math:`c` and :math:`t`. Unlike when using SWAP gates,
this required only four CNOT gates to implement.

It is similarly possible to engineer CNOT gates when there is a longer
chain of qubits required to connect our desired control and target. The
methods described above simply need to be scaled up.

Controlled rotations
~~~~~~~~~~~~~~~~~~~~

We have already seen how to build controlled :math:`\pi` rotations from
a single CNOT gate. Now we’ll look at how to build any controlled
rotation.

First, let’s consider arbitrary rotations around the y axis.
Specifically, consider the following sequence of gates.

.. code:: python

   qc.ry(theta/2,t)
   qc.cx(c,t)
   qc.ry(-theta/2,t)
   qc.cx(c,t)

If the control qubit is in state :math:`|0\rangle`, all we have here is
a :math:`R_y(\theta/2)` immediately followed by its inverse,
:math:`R_y(-\theta/2)`. The end effect is trivial. If the control qubit
is in state :math:`|1\rangle`, however, the ``ry(-theta/2)`` is
effectively preceded and followed by an X gate. This has the effect of
flipping the direction of the y rotation and making a second
:math:`R_y(\theta/2)`. The net effect in this case is therefore to make
a controlled version of the rotation :math:`R_y(\theta)`.

This method works because the x and y axis are orthogonal, which causes
the x gates to flip the direction of the rotation. It therefore
similarly works to make a controlled :math:`R_z(\theta)`. A controlled
:math:`R_x(\theta)` could similarly be made using CNOT gates.

We can also make a controlled version of any single-qubit rotation,
:math:`U`. For this we simply need to find three rotations A, B and C,
and a phase :math:`\alpha` such that

.. math::

   ABC = I, ~~~e^{i\alpha}AZBZC = U

 We then use controlled-Z gates to cause the first of these relations to
happen whenever the control is in state :math:`|0\rangle`, and the
second to happen when the control is state :math:`|1\rangle`. An
:math:`R_z(2\alpha)` rotation is also used on the control to get the
right phase, which will be important whenever there are superposition
states.

.. code:: python

   qc.append(a, [t])
   qc.cz(c,t)
   qc.append(b, [t])
   qc.cz(c,t)
   qc.append(c, [t])
   qc.u1(alpha,c)

.. figure:: https://s3.us-south.cloud-object-storage.appdomain.cloud/strapi/4efe86a907a64a59a720b4dc54a98a88iden1.png
   :alt: A controlled version of a gate V

Here ``A``, ``B`` and ``C`` are gates that implement :math:`A` ,
:math:`B` and :math:`C`, respectively, and must be defined as custom
gates. For example, if we wanted :math:`A` to be :math:`R_x(\pi/4)`, the
custom would be defined as

.. code:: python

   qc_a = QuantumCircuit(1, name='A')
   qc_a.rx(np.pi/4,0)
   A = qc_a.to_instruction()

The Toffoli
~~~~~~~~~~~

The Toffoli gate is a three-qubit gate with two controls and one target.
It performs an X on the target only if both controls are in the state
:math:`|1\rangle`. The final state of the target is then equal to either
the AND or the NAND of the two controls, depending on whether the
initial state of the target was :math:`|0\rangle` or :math:`|1\rangle`.
A Toffoli can also be thought of as a controlled-controlled-NOT, and is
also called the CCX gate.

.. code:: python

   # Toffoli with control qubits a and b and target t
   qc.ccx(a,b,t)

To see how to build it from single- and two-qubit gates, it is helpful
to first show how to build something even more general: an arbitrary
controlled-controlled-U for any single-qubit rotation U. For this we
need to define controlled versions of :math:`V = \sqrt{U}` and
:math:`V^\dagger`. In the Qasm code below, we assume that subroutines
``cv`` and ``cvdg`` have been defined for these, respectively. The
controls are qubits :math:`a` and :math:`b`, and the target is qubit
:math:`t`.

.. code:: python

   qc.cv(b,t)
   qc.cx(a,b)
   qc.cvdg(b,t)
   qc.cx(a,b)
   qc.cv(a,t)

.. figure:: https://s3.us-south.cloud-object-storage.appdomain.cloud/strapi/693974b222d24dba9111e02ae25e9151iden2.png
   :alt: A doubly controlled version of a gate V

By tracing through each value of the two control qubits, you can
convince yourself that a U gate is applied to the target qubit if and
only if both controls are 1. Using ideas we have already described, you
could now implement each controlled-V gate to arrive at some circuit for
the doubly-controlled-U gate. It turns out that the minimum number of
CNOT gates required to implement the Toffoli gate is six [2].

.. figure:: https://s3.us-south.cloud-object-storage.appdomain.cloud/strapi/b3cbeb9b7d674d60a75bed351e4f2bcbiden3.png
   :alt: A Toffoli

The Toffoli is not the unique way to implement an AND gate in quantum
computing. We could also define other gates that have the same effect,
but which also introduce relative phases. In these cases, we can
implement the gate with fewer CNOTs.

For example, suppose we use both the controlled-Hadamard and
controlled-\ :math:`Z` gates, which can both be implemented with a
single CNOT. With these we can make the following circuit:

.. code:: python

   qc.ch(a,t)
   qc.cz(b,t)
   qc.ch(a,t)

For the state :math:`|00\rangle` on the two controls, this does nothing
to the target. For :math:`|11\rangle`, the target experiences a
:math:`Z` gate that is both preceded and followed by an H. The net
effect is an :math:`X` on the target. For the states :math:`|01\rangle`
and :math:`|10\rangle`, the target experiences either just the two
Hadamards (which cancel each other out) or just the :math:`Z` (which
only induces a relative phase). This therefore also reproduces the
effect of an AND, because the value of the target is only changed for
the :math:`|11\rangle` state on the controls – but it does it with the
equivalent of just three CNOT gates.

Arbitrary rotations from H and T
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

The qubits in current devices are subject to noise, which basically
consists of gates that are done by mistake. Simple things like
temperature, stray magnetic fields or activity on neighboring qubits can
make things happen that we didn’t intend.

For large applications of quantum computers, it will be necessary to
encode our qubits in a way that protects them from this noise. This is
done by making gates much harder to do by mistake, or to implement in a
manner that is slightly wrong.

This is unfortunate for the single-qubit rotations :math:`R_x(\theta)`,
:math:`R_y(\theta)` and :math:`R_z(\theta)`. It is impossible to implent
an angle :math:`\theta` with perfect accuracy, such that you are sure
that you are not accidentally implementing something like
:math:`\theta + 0.0000001`. There will always be a limit to the accuracy
we can achieve, and it will always be larger than is tolerable when we
account for the build-up of imperfections over large circuits. We will
therefore not be able to implement these rotations directly in
fault-tolerant quantum computers, but will instead need to build them in
a much more deliberate manner.

Fault-tolerant schemes typically perform these rotations using multiple
applications of just two gates: :math:`H` and :math:`T`.

The T gate is expressed in Qasm as

.. code:: python

   qc.t(0) # T gate on qubit 0

It is a rotation around the z axis by :math:`\theta = \pi/4`, and so is
expressed mathematically as :math:`R_z(\pi/4) = e^{i\pi/8~Z}`.

In the following we assume that the :math:`H` and :math:`T` gates are
effectively perfect. This can be engineered by suitable methods for
error correction and fault-tolerance.

Using the Hadamard and the methods discussed in the last chapter, we can
use the T gate to create a similar rotation around the x axis.

.. code:: python

   qc.h(0)
   qc.t(0)
   qc.h(0)

Now let’s put the two together. Let’s make the gate
:math:`R_z(\pi/4)~R_x(\pi/4)`.

.. code:: python

   qc.h(0)
   qc.t(0)
   qc.h(0)
   qc.t(0)

Since this is a single-qubit gate, we can think of it as a rotation
around the Bloch sphere. That means that it is a rotation around some
axis by some angle. We don’t need to think about the axis too much here,
but it clearly won’t be simply x, y or z. More important is the angle.

The crucial property of the angle for this rotation is that it is
irrational. You can prove this yourself with a bunch of math, but you
can also see the irrationality in action by applying the gate. Repeating
it :math:`n` times results in a rotation around the same axis by a
different angle. Due to the irrationality, the angles that result from
different repetitions will never be the same.

We can use this to our advantage. Each angle will be somewhere between
:math:`0` and :math:`2\pi`. Let’s split this interval up into :math:`n`
slices of width :math:`2\pi/n`. For each repetition, the resulting angle
will fall in one of these slices. If we look at the angles for the first
:math:`n+1` repetitions, it must be true that at least one slice
contains two of these angles. Let’s use :math:`n_1` to denote the number
of repetitions required for the first, and :math:`n_2` for the second.

With this, we can prove something about the angle for :math:`n_2-n_1`
repetitions. This is effectively the same as doing :math:`n_2`
repetitions, followed by the inverse of :math:`n_1` repetitions. Since
the angles for these are not equal (because of the irrationality) but
also differ by no greater than :math:`2\pi/n` (because they correspond
to the same slice), the angle for :math:`n_2-n_1` repetitions satisfies

.. math::

   \theta_{n_2-n_1} \neq 0, ~~~~-\frac{2\pi}{n} \leq \theta_{n_2-n_1} \leq \frac{2\pi}{n} .

 We therefore have the ability to do rotations around small angles. We
can use this to rotate around angles that are as small as we like, just
by increasing the number of times we repeat this gate.

By using many small-angle rotations, we can also rotate by any angle we
like. This won’t always be exact, but it is guaranteed to be accurate up
to :math:`2\pi/n`, which can be made as small as we like. We now have
power over the inaccuracies in our rotations.

So far, we only have the power to do these arbitrary rotations around
one axis. For a second axis, we simply do the :math:`R_z(\pi/4)` and
:math:`R_x(\pi/4)` rotations in the opposite order.

.. code:: python

   qc.h(0)
   qc.t(0)
   qc.h(0)
   qc.t(0)

The axis that corresponds to this rotation is not the same as that for
the gate considered previously. We therefore now have arbitrary rotation
around two axes, which can be used to generate any arbitrary rotation
around the Bloch sphere. We are back to being able to do everything,
though it costs quite a lot of :math:`T` gates.

It is because of this kind of application that :math:`T` gates are so
prominent in quantum computation. In fact, the complexity of algorithms
for fault-tolerant quantum computers is often quoted in terms of how
many :math:`T` gates they’ll need. This motivates the quest to achieve
things with as few :math:`T` gates as possible. Note that the discussion
above was simply intended to prove that :math:`T` gates can be used in
this way, and does not represent the most efficient method we know.

References
~~~~~~~~~~

[1] `Barenco, et al.
1995 <https://journals.aps.org/pra/abstract/10.1103/PhysRevA.52.3457?cm_mc_uid=43781767191014577577895&cm_mc_sid_50200000=1460741020>`__

[2] `Shende and Markov,
2009 <http://dl.acm.org/citation.cfm?id=2011799>`__
