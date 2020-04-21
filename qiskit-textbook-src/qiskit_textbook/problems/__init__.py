from qiskit import QuantumCircuit

def dj_problem_oracle(problem):
    """Returns a 5-qubit Deutsch-Joza Oracle"""
    qc = QuantumCircuit(5)
    int(problem)
    if problem == 1:
        for q in range(4):
            qc.cx(q, 4)
    elif problem == 2:
        qc.cx(0, 4)
        qc.cx(0, 4)
    elif problem == 3:
        qc.ccx(0,2,4)
        qc.ccx(1,2,4)
        for q in range(3):
            qc.x(q)
        qc.ccx(0,2,4)
        qc.ccx(1,3,4)
    elif problem == 4:
        qc.cx(2,4)
    else:
        print("There are only currently 4 oracles in this problem set, returning empty (balanced) gate")
    return qc.to_gate()
