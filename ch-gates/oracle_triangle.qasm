OPENQASM 2.0;
include "qelib1.inc";
qreg xIn[6];
qreg ancillaXOR[6];
qreg ancillaOR[3];
qreg ancillaAND[1];
qreg flagIn[1];
creg xOut[6];
creg flagOut[1];

h xIn;

x ancillaOR;

cx xIn[0], xIn[2];
cx xIn[2], ancillaXOR[0];
cx xIn[0], xIn[2];

cx xIn[1], xIn[3];
cx xIn[3], ancillaXOR[1];
cx xIn[1], xIn[3];

cx xIn[0], xIn[4];
cx xIn[4], ancillaXOR[2];
cx xIn[0], xIn[4];

cx xIn[1], xIn[5];
cx xIn[5], ancillaXOR[3];
cx xIn[1], xIn[5];

cx xIn[2], xIn[4];
cx xIn[4], ancillaXOR[4];
cx xIn[2], xIn[4];

cx xIn[3], xIn[5];
cx xIn[5], ancillaXOR[5];
cx xIn[3], xIn[5];

x ancillaXOR;

ccx ancillaXOR[0], ancillaXOR[1], ancillaOR[0];
ccx ancillaXOR[2], ancillaXOR[3], ancillaOR[1];
ccx ancillaXOR[4], ancillaXOR[5], ancillaOR[2];

ccx ancillaOR[0], ancillaOR[1], ancillaAND[0];

ccx ancillaOR[2], ancillaAND[0], flagIn[0];

ccx ancillaOR[0], ancillaOR[1], ancillaAND[0];

ccx ancillaXOR[4], ancillaXOR[5], ancillaOR[2];
ccx ancillaXOR[2], ancillaXOR[3], ancillaOR[1];
ccx ancillaXOR[0], ancillaXOR[1], ancillaOR[0];

x ancillaXOR;

cx xIn[3], xIn[5];
cx xIn[5], ancillaXOR[5];
cx xIn[3], xIn[5];

cx xIn[2], xIn[4];
cx xIn[4], ancillaXOR[4];
cx xIn[2], xIn[4];

cx xIn[1], xIn[5];
cx xIn[5], ancillaXOR[3];
cx xIn[1], xIn[5];

cx xIn[0], xIn[4];
cx xIn[4], ancillaXOR[2];
cx xIn[0], xIn[4];

cx xIn[1], xIn[3];
cx xIn[3], ancillaXOR[1];
cx xIn[1], xIn[3];

cx xIn[0], xIn[2];
cx xIn[2], ancillaXOR[0];
cx xIn[0], xIn[2];

x ancillaOR;

measure xIn -> xOut;
measure flagIn -> flagOut;