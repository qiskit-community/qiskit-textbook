(window["webpackJsonp"] = window["webpackJsonp"] || []).push([[0],{

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/addon/mode/simple.js":
/*!*************************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/addon/mode/simple.js ***!
  \*************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"));
  else {}
})(function(CodeMirror) {
  "use strict";

  CodeMirror.defineSimpleMode = function(name, states) {
    CodeMirror.defineMode(name, function(config) {
      return CodeMirror.simpleMode(config, states);
    });
  };

  CodeMirror.simpleMode = function(config, states) {
    ensureState(states, "start");
    var states_ = {}, meta = states.meta || {}, hasIndentation = false;
    for (var state in states) if (state != meta && states.hasOwnProperty(state)) {
      var list = states_[state] = [], orig = states[state];
      for (var i = 0; i < orig.length; i++) {
        var data = orig[i];
        list.push(new Rule(data, states));
        if (data.indent || data.dedent) hasIndentation = true;
      }
    }
    var mode = {
      startState: function() {
        return {state: "start", pending: null,
                local: null, localState: null,
                indent: hasIndentation ? [] : null};
      },
      copyState: function(state) {
        var s = {state: state.state, pending: state.pending,
                 local: state.local, localState: null,
                 indent: state.indent && state.indent.slice(0)};
        if (state.localState)
          s.localState = CodeMirror.copyState(state.local.mode, state.localState);
        if (state.stack)
          s.stack = state.stack.slice(0);
        for (var pers = state.persistentStates; pers; pers = pers.next)
          s.persistentStates = {mode: pers.mode,
                                spec: pers.spec,
                                state: pers.state == state.localState ? s.localState : CodeMirror.copyState(pers.mode, pers.state),
                                next: s.persistentStates};
        return s;
      },
      token: tokenFunction(states_, config),
      innerMode: function(state) { return state.local && {mode: state.local.mode, state: state.localState}; },
      indent: indentFunction(states_, meta)
    };
    if (meta) for (var prop in meta) if (meta.hasOwnProperty(prop))
      mode[prop] = meta[prop];
    return mode;
  };

  function ensureState(states, name) {
    if (!states.hasOwnProperty(name))
      throw new Error("Undefined state " + name + " in simple mode");
  }

  function toRegex(val, caret) {
    if (!val) return /(?:)/;
    var flags = "";
    if (val instanceof RegExp) {
      if (val.ignoreCase) flags = "i";
      val = val.source;
    } else {
      val = String(val);
    }
    return new RegExp((caret === false ? "" : "^") + "(?:" + val + ")", flags);
  }

  function asToken(val) {
    if (!val) return null;
    if (val.apply) return val
    if (typeof val == "string") return val.replace(/\./g, " ");
    var result = [];
    for (var i = 0; i < val.length; i++)
      result.push(val[i] && val[i].replace(/\./g, " "));
    return result;
  }

  function Rule(data, states) {
    if (data.next || data.push) ensureState(states, data.next || data.push);
    this.regex = toRegex(data.regex);
    this.token = asToken(data.token);
    this.data = data;
  }

  function tokenFunction(states, config) {
    return function(stream, state) {
      if (state.pending) {
        var pend = state.pending.shift();
        if (state.pending.length == 0) state.pending = null;
        stream.pos += pend.text.length;
        return pend.token;
      }

      if (state.local) {
        if (state.local.end && stream.match(state.local.end)) {
          var tok = state.local.endToken || null;
          state.local = state.localState = null;
          return tok;
        } else {
          var tok = state.local.mode.token(stream, state.localState), m;
          if (state.local.endScan && (m = state.local.endScan.exec(stream.current())))
            stream.pos = stream.start + m.index;
          return tok;
        }
      }

      var curState = states[state.state];
      for (var i = 0; i < curState.length; i++) {
        var rule = curState[i];
        var matches = (!rule.data.sol || stream.sol()) && stream.match(rule.regex);
        if (matches) {
          if (rule.data.next) {
            state.state = rule.data.next;
          } else if (rule.data.push) {
            (state.stack || (state.stack = [])).push(state.state);
            state.state = rule.data.push;
          } else if (rule.data.pop && state.stack && state.stack.length) {
            state.state = state.stack.pop();
          }

          if (rule.data.mode)
            enterLocalMode(config, state, rule.data.mode, rule.token);
          if (rule.data.indent)
            state.indent.push(stream.indentation() + config.indentUnit);
          if (rule.data.dedent)
            state.indent.pop();
          var token = rule.token
          if (token && token.apply) token = token(matches)
          if (matches.length > 2 && rule.token && typeof rule.token != "string") {
            state.pending = [];
            for (var j = 2; j < matches.length; j++)
              if (matches[j])
                state.pending.push({text: matches[j], token: rule.token[j - 1]});
            stream.backUp(matches[0].length - (matches[1] ? matches[1].length : 0));
            return token[0];
          } else if (token && token.join) {
            return token[0];
          } else {
            return token;
          }
        }
      }
      stream.next();
      return null;
    };
  }

  function cmp(a, b) {
    if (a === b) return true;
    if (!a || typeof a != "object" || !b || typeof b != "object") return false;
    var props = 0;
    for (var prop in a) if (a.hasOwnProperty(prop)) {
      if (!b.hasOwnProperty(prop) || !cmp(a[prop], b[prop])) return false;
      props++;
    }
    for (var prop in b) if (b.hasOwnProperty(prop)) props--;
    return props == 0;
  }

  function enterLocalMode(config, state, spec, token) {
    var pers;
    if (spec.persistent) for (var p = state.persistentStates; p && !pers; p = p.next)
      if (spec.spec ? cmp(spec.spec, p.spec) : spec.mode == p.mode) pers = p;
    var mode = pers ? pers.mode : spec.mode || CodeMirror.getMode(config, spec.spec);
    var lState = pers ? pers.state : CodeMirror.startState(mode);
    if (spec.persistent && !pers)
      state.persistentStates = {mode: mode, spec: spec.spec, state: lState, next: state.persistentStates};

    state.localState = lState;
    state.local = {mode: mode,
                   end: spec.end && toRegex(spec.end),
                   endScan: spec.end && spec.forceEnd !== false && toRegex(spec.end, false),
                   endToken: token && token.join ? token[token.length - 1] : token};
  }

  function indexOf(val, arr) {
    for (var i = 0; i < arr.length; i++) if (arr[i] === val) return true;
  }

  function indentFunction(states, meta) {
    return function(state, textAfter, line) {
      if (state.local && state.local.mode.indent)
        return state.local.mode.indent(state.localState, textAfter, line);
      if (state.indent == null || state.local || meta.dontIndentStates && indexOf(state.state, meta.dontIndentStates) > -1)
        return CodeMirror.Pass;

      var pos = state.indent.length - 1, rules = states[state.state];
      scan: for (;;) {
        for (var i = 0; i < rules.length; i++) {
          var rule = rules[i];
          if (rule.data.dedent && rule.data.dedentIfLineStart !== false) {
            var m = rule.regex.exec(textAfter);
            if (m && m[0]) {
              pos--;
              if (rule.next || rule.push) rules = states[rule.next || rule.push];
              textAfter = textAfter.slice(m[0].length);
              continue scan;
            }
          }
        }
        break;
      }
      return pos < 0 ? 0 : state.indent[pos];
    };
  }
});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/apl/apl.js":
/*!********************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/apl/apl.js ***!
  \********************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"));
  else {}
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode("apl", function() {
  var builtInOps = {
    ".": "innerProduct",
    "\\": "scan",
    "/": "reduce",
    "⌿": "reduce1Axis",
    "⍀": "scan1Axis",
    "¨": "each",
    "⍣": "power"
  };
  var builtInFuncs = {
    "+": ["conjugate", "add"],
    "−": ["negate", "subtract"],
    "×": ["signOf", "multiply"],
    "÷": ["reciprocal", "divide"],
    "⌈": ["ceiling", "greaterOf"],
    "⌊": ["floor", "lesserOf"],
    "∣": ["absolute", "residue"],
    "⍳": ["indexGenerate", "indexOf"],
    "?": ["roll", "deal"],
    "⋆": ["exponentiate", "toThePowerOf"],
    "⍟": ["naturalLog", "logToTheBase"],
    "○": ["piTimes", "circularFuncs"],
    "!": ["factorial", "binomial"],
    "⌹": ["matrixInverse", "matrixDivide"],
    "<": [null, "lessThan"],
    "≤": [null, "lessThanOrEqual"],
    "=": [null, "equals"],
    ">": [null, "greaterThan"],
    "≥": [null, "greaterThanOrEqual"],
    "≠": [null, "notEqual"],
    "≡": ["depth", "match"],
    "≢": [null, "notMatch"],
    "∈": ["enlist", "membership"],
    "⍷": [null, "find"],
    "∪": ["unique", "union"],
    "∩": [null, "intersection"],
    "∼": ["not", "without"],
    "∨": [null, "or"],
    "∧": [null, "and"],
    "⍱": [null, "nor"],
    "⍲": [null, "nand"],
    "⍴": ["shapeOf", "reshape"],
    ",": ["ravel", "catenate"],
    "⍪": [null, "firstAxisCatenate"],
    "⌽": ["reverse", "rotate"],
    "⊖": ["axis1Reverse", "axis1Rotate"],
    "⍉": ["transpose", null],
    "↑": ["first", "take"],
    "↓": [null, "drop"],
    "⊂": ["enclose", "partitionWithAxis"],
    "⊃": ["diclose", "pick"],
    "⌷": [null, "index"],
    "⍋": ["gradeUp", null],
    "⍒": ["gradeDown", null],
    "⊤": ["encode", null],
    "⊥": ["decode", null],
    "⍕": ["format", "formatByExample"],
    "⍎": ["execute", null],
    "⊣": ["stop", "left"],
    "⊢": ["pass", "right"]
  };

  var isOperator = /[\.\/⌿⍀¨⍣]/;
  var isNiladic = /⍬/;
  var isFunction = /[\+−×÷⌈⌊∣⍳\?⋆⍟○!⌹<≤=>≥≠≡≢∈⍷∪∩∼∨∧⍱⍲⍴,⍪⌽⊖⍉↑↓⊂⊃⌷⍋⍒⊤⊥⍕⍎⊣⊢]/;
  var isArrow = /←/;
  var isComment = /[⍝#].*$/;

  var stringEater = function(type) {
    var prev;
    prev = false;
    return function(c) {
      prev = c;
      if (c === type) {
        return prev === "\\";
      }
      return true;
    };
  };
  return {
    startState: function() {
      return {
        prev: false,
        func: false,
        op: false,
        string: false,
        escape: false
      };
    },
    token: function(stream, state) {
      var ch, funcName;
      if (stream.eatSpace()) {
        return null;
      }
      ch = stream.next();
      if (ch === '"' || ch === "'") {
        stream.eatWhile(stringEater(ch));
        stream.next();
        state.prev = true;
        return "string";
      }
      if (/[\[{\(]/.test(ch)) {
        state.prev = false;
        return null;
      }
      if (/[\]}\)]/.test(ch)) {
        state.prev = true;
        return null;
      }
      if (isNiladic.test(ch)) {
        state.prev = false;
        return "niladic";
      }
      if (/[¯\d]/.test(ch)) {
        if (state.func) {
          state.func = false;
          state.prev = false;
        } else {
          state.prev = true;
        }
        stream.eatWhile(/[\w\.]/);
        return "number";
      }
      if (isOperator.test(ch)) {
        return "operator apl-" + builtInOps[ch];
      }
      if (isArrow.test(ch)) {
        return "apl-arrow";
      }
      if (isFunction.test(ch)) {
        funcName = "apl-";
        if (builtInFuncs[ch] != null) {
          if (state.prev) {
            funcName += builtInFuncs[ch][1];
          } else {
            funcName += builtInFuncs[ch][0];
          }
        }
        state.func = true;
        state.prev = false;
        return "function " + funcName;
      }
      if (isComment.test(ch)) {
        stream.skipToEnd();
        return "comment";
      }
      if (ch === "∘" && stream.peek() === ".") {
        stream.next();
        return "function jot-dot";
      }
      stream.eatWhile(/[\w\$_]/);
      state.prev = true;
      return "keyword";
    }
  };
});

CodeMirror.defineMIME("text/apl", "apl");

});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/asciiarmor/asciiarmor.js":
/*!**********************************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/asciiarmor/asciiarmor.js ***!
  \**********************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"));
  else {}
})(function(CodeMirror) {
  "use strict";

  function errorIfNotEmpty(stream) {
    var nonWS = stream.match(/^\s*\S/);
    stream.skipToEnd();
    return nonWS ? "error" : null;
  }

  CodeMirror.defineMode("asciiarmor", function() {
    return {
      token: function(stream, state) {
        var m;
        if (state.state == "top") {
          if (stream.sol() && (m = stream.match(/^-----BEGIN (.*)?-----\s*$/))) {
            state.state = "headers";
            state.type = m[1];
            return "tag";
          }
          return errorIfNotEmpty(stream);
        } else if (state.state == "headers") {
          if (stream.sol() && stream.match(/^\w+:/)) {
            state.state = "header";
            return "atom";
          } else {
            var result = errorIfNotEmpty(stream);
            if (result) state.state = "body";
            return result;
          }
        } else if (state.state == "header") {
          stream.skipToEnd();
          state.state = "headers";
          return "string";
        } else if (state.state == "body") {
          if (stream.sol() && (m = stream.match(/^-----END (.*)?-----\s*$/))) {
            if (m[1] != state.type) return "error";
            state.state = "end";
            return "tag";
          } else {
            if (stream.eatWhile(/[A-Za-z0-9+\/=]/)) {
              return null;
            } else {
              stream.next();
              return "error";
            }
          }
        } else if (state.state == "end") {
          return errorIfNotEmpty(stream);
        }
      },
      blankLine: function(state) {
        if (state.state == "headers") state.state = "body";
      },
      startState: function() {
        return {state: "top", type: null};
      }
    };
  });

  CodeMirror.defineMIME("application/pgp", "asciiarmor");
  CodeMirror.defineMIME("application/pgp-encrypted", "asciiarmor");
  CodeMirror.defineMIME("application/pgp-keys", "asciiarmor");
  CodeMirror.defineMIME("application/pgp-signature", "asciiarmor");
});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/asn.1/asn.1.js":
/*!************************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/asn.1/asn.1.js ***!
  \************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"));
  else {}
})(function(CodeMirror) {
  "use strict";

  CodeMirror.defineMode("asn.1", function(config, parserConfig) {
    var indentUnit = config.indentUnit,
        keywords = parserConfig.keywords || {},
        cmipVerbs = parserConfig.cmipVerbs || {},
        compareTypes = parserConfig.compareTypes || {},
        status = parserConfig.status || {},
        tags = parserConfig.tags || {},
        storage = parserConfig.storage || {},
        modifier = parserConfig.modifier || {},
        accessTypes = parserConfig.accessTypes|| {},
        multiLineStrings = parserConfig.multiLineStrings,
        indentStatements = parserConfig.indentStatements !== false;
    var isOperatorChar = /[\|\^]/;
    var curPunc;

    function tokenBase(stream, state) {
      var ch = stream.next();
      if (ch == '"' || ch == "'") {
        state.tokenize = tokenString(ch);
        return state.tokenize(stream, state);
      }
      if (/[\[\]\(\){}:=,;]/.test(ch)) {
        curPunc = ch;
        return "punctuation";
      }
      if (ch == "-"){
        if (stream.eat("-")) {
          stream.skipToEnd();
          return "comment";
        }
      }
      if (/\d/.test(ch)) {
        stream.eatWhile(/[\w\.]/);
        return "number";
      }
      if (isOperatorChar.test(ch)) {
        stream.eatWhile(isOperatorChar);
        return "operator";
      }

      stream.eatWhile(/[\w\-]/);
      var cur = stream.current();
      if (keywords.propertyIsEnumerable(cur)) return "keyword";
      if (cmipVerbs.propertyIsEnumerable(cur)) return "variable cmipVerbs";
      if (compareTypes.propertyIsEnumerable(cur)) return "atom compareTypes";
      if (status.propertyIsEnumerable(cur)) return "comment status";
      if (tags.propertyIsEnumerable(cur)) return "variable-3 tags";
      if (storage.propertyIsEnumerable(cur)) return "builtin storage";
      if (modifier.propertyIsEnumerable(cur)) return "string-2 modifier";
      if (accessTypes.propertyIsEnumerable(cur)) return "atom accessTypes";

      return "variable";
    }

    function tokenString(quote) {
      return function(stream, state) {
        var escaped = false, next, end = false;
        while ((next = stream.next()) != null) {
          if (next == quote && !escaped){
            var afterNext = stream.peek();
            //look if the character if the quote is like the B in '10100010'B
            if (afterNext){
              afterNext = afterNext.toLowerCase();
              if(afterNext == "b" || afterNext == "h" || afterNext == "o")
                stream.next();
            }
            end = true; break;
          }
          escaped = !escaped && next == "\\";
        }
        if (end || !(escaped || multiLineStrings))
          state.tokenize = null;
        return "string";
      };
    }

    function Context(indented, column, type, align, prev) {
      this.indented = indented;
      this.column = column;
      this.type = type;
      this.align = align;
      this.prev = prev;
    }
    function pushContext(state, col, type) {
      var indent = state.indented;
      if (state.context && state.context.type == "statement")
        indent = state.context.indented;
      return state.context = new Context(indent, col, type, null, state.context);
    }
    function popContext(state) {
      var t = state.context.type;
      if (t == ")" || t == "]" || t == "}")
        state.indented = state.context.indented;
      return state.context = state.context.prev;
    }

    //Interface
    return {
      startState: function(basecolumn) {
        return {
          tokenize: null,
          context: new Context((basecolumn || 0) - indentUnit, 0, "top", false),
          indented: 0,
          startOfLine: true
        };
      },

      token: function(stream, state) {
        var ctx = state.context;
        if (stream.sol()) {
          if (ctx.align == null) ctx.align = false;
          state.indented = stream.indentation();
          state.startOfLine = true;
        }
        if (stream.eatSpace()) return null;
        curPunc = null;
        var style = (state.tokenize || tokenBase)(stream, state);
        if (style == "comment") return style;
        if (ctx.align == null) ctx.align = true;

        if ((curPunc == ";" || curPunc == ":" || curPunc == ",")
            && ctx.type == "statement"){
          popContext(state);
        }
        else if (curPunc == "{") pushContext(state, stream.column(), "}");
        else if (curPunc == "[") pushContext(state, stream.column(), "]");
        else if (curPunc == "(") pushContext(state, stream.column(), ")");
        else if (curPunc == "}") {
          while (ctx.type == "statement") ctx = popContext(state);
          if (ctx.type == "}") ctx = popContext(state);
          while (ctx.type == "statement") ctx = popContext(state);
        }
        else if (curPunc == ctx.type) popContext(state);
        else if (indentStatements && (((ctx.type == "}" || ctx.type == "top")
            && curPunc != ';') || (ctx.type == "statement"
            && curPunc == "newstatement")))
          pushContext(state, stream.column(), "statement");

        state.startOfLine = false;
        return style;
      },

      electricChars: "{}",
      lineComment: "--",
      fold: "brace"
    };
  });

  function words(str) {
    var obj = {}, words = str.split(" ");
    for (var i = 0; i < words.length; ++i) obj[words[i]] = true;
    return obj;
  }

  CodeMirror.defineMIME("text/x-ttcn-asn", {
    name: "asn.1",
    keywords: words("DEFINITIONS OBJECTS IF DERIVED INFORMATION ACTION" +
    " REPLY ANY NAMED CHARACTERIZED BEHAVIOUR REGISTERED" +
    " WITH AS IDENTIFIED CONSTRAINED BY PRESENT BEGIN" +
    " IMPORTS FROM UNITS SYNTAX MIN-ACCESS MAX-ACCESS" +
    " MINACCESS MAXACCESS REVISION STATUS DESCRIPTION" +
    " SEQUENCE SET COMPONENTS OF CHOICE DistinguishedName" +
    " ENUMERATED SIZE MODULE END INDEX AUGMENTS EXTENSIBILITY" +
    " IMPLIED EXPORTS"),
    cmipVerbs: words("ACTIONS ADD GET NOTIFICATIONS REPLACE REMOVE"),
    compareTypes: words("OPTIONAL DEFAULT MANAGED MODULE-TYPE MODULE_IDENTITY" +
    " MODULE-COMPLIANCE OBJECT-TYPE OBJECT-IDENTITY" +
    " OBJECT-COMPLIANCE MODE CONFIRMED CONDITIONAL" +
    " SUBORDINATE SUPERIOR CLASS TRUE FALSE NULL" +
    " TEXTUAL-CONVENTION"),
    status: words("current deprecated mandatory obsolete"),
    tags: words("APPLICATION AUTOMATIC EXPLICIT IMPLICIT PRIVATE TAGS" +
    " UNIVERSAL"),
    storage: words("BOOLEAN INTEGER OBJECT IDENTIFIER BIT OCTET STRING" +
    " UTCTime InterfaceIndex IANAifType CMIP-Attribute" +
    " REAL PACKAGE PACKAGES IpAddress PhysAddress" +
    " NetworkAddress BITS BMPString TimeStamp TimeTicks" +
    " TruthValue RowStatus DisplayString GeneralString" +
    " GraphicString IA5String NumericString" +
    " PrintableString SnmpAdminAtring TeletexString" +
    " UTF8String VideotexString VisibleString StringStore" +
    " ISO646String T61String UniversalString Unsigned32" +
    " Integer32 Gauge Gauge32 Counter Counter32 Counter64"),
    modifier: words("ATTRIBUTE ATTRIBUTES MANDATORY-GROUP MANDATORY-GROUPS" +
    " GROUP GROUPS ELEMENTS EQUALITY ORDERING SUBSTRINGS" +
    " DEFINED"),
    accessTypes: words("not-accessible accessible-for-notify read-only" +
    " read-create read-write"),
    multiLineStrings: true
  });
});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/asterisk/asterisk.js":
/*!******************************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/asterisk/asterisk.js ***!
  \******************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

/*
 * =====================================================================================
 *
 *       Filename:  mode/asterisk/asterisk.js
 *
 *    Description:  CodeMirror mode for Asterisk dialplan
 *
 *        Created:  05/17/2012 09:20:25 PM
 *       Revision:  none
 *
 *         Author:  Stas Kobzar (stas@modulis.ca),
 *        Company:  Modulis.ca Inc.
 *
 * =====================================================================================
 */

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"));
  else {}
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode("asterisk", function() {
  var atoms    = ["exten", "same", "include","ignorepat","switch"],
      dpcmd    = ["#include","#exec"],
      apps     = [
                  "addqueuemember","adsiprog","aelsub","agentlogin","agentmonitoroutgoing","agi",
                  "alarmreceiver","amd","answer","authenticate","background","backgrounddetect",
                  "bridge","busy","callcompletioncancel","callcompletionrequest","celgenuserevent",
                  "changemonitor","chanisavail","channelredirect","chanspy","clearhash","confbridge",
                  "congestion","continuewhile","controlplayback","dahdiacceptr2call","dahdibarge",
                  "dahdiras","dahdiscan","dahdisendcallreroutingfacility","dahdisendkeypadfacility",
                  "datetime","dbdel","dbdeltree","deadagi","dial","dictate","directory","disa",
                  "dumpchan","eagi","echo","endwhile","exec","execif","execiftime","exitwhile","extenspy",
                  "externalivr","festival","flash","followme","forkcdr","getcpeid","gosub","gosubif",
                  "goto","gotoif","gotoiftime","hangup","iax2provision","ices","importvar","incomplete",
                  "ivrdemo","jabberjoin","jabberleave","jabbersend","jabbersendgroup","jabberstatus",
                  "jack","log","macro","macroexclusive","macroexit","macroif","mailboxexists","meetme",
                  "meetmeadmin","meetmechanneladmin","meetmecount","milliwatt","minivmaccmess","minivmdelete",
                  "minivmgreet","minivmmwi","minivmnotify","minivmrecord","mixmonitor","monitor","morsecode",
                  "mp3player","mset","musiconhold","nbscat","nocdr","noop","odbc","odbc","odbcfinish",
                  "originate","ospauth","ospfinish","osplookup","ospnext","page","park","parkandannounce",
                  "parkedcall","pausemonitor","pausequeuemember","pickup","pickupchan","playback","playtones",
                  "privacymanager","proceeding","progress","queue","queuelog","raiseexception","read","readexten",
                  "readfile","receivefax","receivefax","receivefax","record","removequeuemember",
                  "resetcdr","retrydial","return","ringing","sayalpha","saycountedadj","saycountednoun",
                  "saycountpl","saydigits","saynumber","sayphonetic","sayunixtime","senddtmf","sendfax",
                  "sendfax","sendfax","sendimage","sendtext","sendurl","set","setamaflags",
                  "setcallerpres","setmusiconhold","sipaddheader","sipdtmfmode","sipremoveheader","skel",
                  "slastation","slatrunk","sms","softhangup","speechactivategrammar","speechbackground",
                  "speechcreate","speechdeactivategrammar","speechdestroy","speechloadgrammar","speechprocessingsound",
                  "speechstart","speechunloadgrammar","stackpop","startmusiconhold","stopmixmonitor","stopmonitor",
                  "stopmusiconhold","stopplaytones","system","testclient","testserver","transfer","tryexec",
                  "trysystem","unpausemonitor","unpausequeuemember","userevent","verbose","vmauthenticate",
                  "vmsayname","voicemail","voicemailmain","wait","waitexten","waitfornoise","waitforring",
                  "waitforsilence","waitmusiconhold","waituntil","while","zapateller"
                 ];

  function basicToken(stream,state){
    var cur = '';
    var ch = stream.next();
    // comment
    if(ch == ";") {
      stream.skipToEnd();
      return "comment";
    }
    // context
    if(ch == '[') {
      stream.skipTo(']');
      stream.eat(']');
      return "header";
    }
    // string
    if(ch == '"') {
      stream.skipTo('"');
      return "string";
    }
    if(ch == "'") {
      stream.skipTo("'");
      return "string-2";
    }
    // dialplan commands
    if(ch == '#') {
      stream.eatWhile(/\w/);
      cur = stream.current();
      if(dpcmd.indexOf(cur) !== -1) {
        stream.skipToEnd();
        return "strong";
      }
    }
    // application args
    if(ch == '$'){
      var ch1 = stream.peek();
      if(ch1 == '{'){
        stream.skipTo('}');
        stream.eat('}');
        return "variable-3";
      }
    }
    // extension
    stream.eatWhile(/\w/);
    cur = stream.current();
    if(atoms.indexOf(cur) !== -1) {
      state.extenStart = true;
      switch(cur) {
        case 'same': state.extenSame = true; break;
        case 'include':
        case 'switch':
        case 'ignorepat':
          state.extenInclude = true;break;
        default:break;
      }
      return "atom";
    }
  }

  return {
    startState: function() {
      return {
        extenStart: false,
        extenSame:  false,
        extenInclude: false,
        extenExten: false,
        extenPriority: false,
        extenApplication: false
      };
    },
    token: function(stream, state) {

      var cur = '';
      if(stream.eatSpace()) return null;
      // extension started
      if(state.extenStart){
        stream.eatWhile(/[^\s]/);
        cur = stream.current();
        if(/^=>?$/.test(cur)){
          state.extenExten = true;
          state.extenStart = false;
          return "strong";
        } else {
          state.extenStart = false;
          stream.skipToEnd();
          return "error";
        }
      } else if(state.extenExten) {
        // set exten and priority
        state.extenExten = false;
        state.extenPriority = true;
        stream.eatWhile(/[^,]/);
        if(state.extenInclude) {
          stream.skipToEnd();
          state.extenPriority = false;
          state.extenInclude = false;
        }
        if(state.extenSame) {
          state.extenPriority = false;
          state.extenSame = false;
          state.extenApplication = true;
        }
        return "tag";
      } else if(state.extenPriority) {
        state.extenPriority = false;
        state.extenApplication = true;
        stream.next(); // get comma
        if(state.extenSame) return null;
        stream.eatWhile(/[^,]/);
        return "number";
      } else if(state.extenApplication) {
        stream.eatWhile(/,/);
        cur = stream.current();
        if(cur === ',') return null;
        stream.eatWhile(/\w/);
        cur = stream.current().toLowerCase();
        state.extenApplication = false;
        if(apps.indexOf(cur) !== -1){
          return "def strong";
        }
      } else{
        return basicToken(stream,state);
      }

      return null;
    }
  };
});

CodeMirror.defineMIME("text/x-asterisk", "asterisk");

});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/brainfuck/brainfuck.js":
/*!********************************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/brainfuck/brainfuck.js ***!
  \********************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

// Brainfuck mode created by Michael Kaminsky https://github.com/mkaminsky11

(function(mod) {
  if (true)
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"))
  else {}
})(function(CodeMirror) {
  "use strict"
  var reserve = "><+-.,[]".split("");
  /*
  comments can be either:
  placed behind lines

        +++    this is a comment

  where reserved characters cannot be used
  or in a loop
  [
    this is ok to use [ ] and stuff
  ]
  or preceded by #
  */
  CodeMirror.defineMode("brainfuck", function() {
    return {
      startState: function() {
        return {
          commentLine: false,
          left: 0,
          right: 0,
          commentLoop: false
        }
      },
      token: function(stream, state) {
        if (stream.eatSpace()) return null
        if(stream.sol()){
          state.commentLine = false;
        }
        var ch = stream.next().toString();
        if(reserve.indexOf(ch) !== -1){
          if(state.commentLine === true){
            if(stream.eol()){
              state.commentLine = false;
            }
            return "comment";
          }
          if(ch === "]" || ch === "["){
            if(ch === "["){
              state.left++;
            }
            else{
              state.right++;
            }
            return "bracket";
          }
          else if(ch === "+" || ch === "-"){
            return "keyword";
          }
          else if(ch === "<" || ch === ">"){
            return "atom";
          }
          else if(ch === "." || ch === ","){
            return "def";
          }
        }
        else{
          state.commentLine = true;
          if(stream.eol()){
            state.commentLine = false;
          }
          return "comment";
        }
        if(stream.eol()){
          state.commentLine = false;
        }
      }
    };
  });
CodeMirror.defineMIME("text/x-brainfuck","brainfuck")
});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/clojure/clojure.js":
/*!****************************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/clojure/clojure.js ***!
  \****************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"));
  else {}
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode("clojure", function (options) {
  var atoms = ["false", "nil", "true"];
  var specialForms = [".", "catch", "def", "do", "if", "monitor-enter",
      "monitor-exit", "new", "quote", "recur", "set!", "throw", "try", "var"];
  var coreSymbols = ["*", "*'", "*1", "*2", "*3", "*agent*",
      "*allow-unresolved-vars*", "*assert*", "*clojure-version*",
      "*command-line-args*", "*compile-files*", "*compile-path*",
      "*compiler-options*", "*data-readers*", "*default-data-reader-fn*", "*e",
      "*err*", "*file*", "*flush-on-newline*", "*fn-loader*", "*in*",
      "*math-context*", "*ns*", "*out*", "*print-dup*", "*print-length*",
      "*print-level*", "*print-meta*", "*print-namespace-maps*",
      "*print-readably*", "*read-eval*", "*reader-resolver*", "*source-path*",
      "*suppress-read*", "*unchecked-math*", "*use-context-classloader*",
      "*verbose-defrecords*", "*warn-on-reflection*", "+", "+'", "-", "-'",
      "->", "->>", "->ArrayChunk", "->Eduction", "->Vec", "->VecNode",
      "->VecSeq", "-cache-protocol-fn", "-reset-methods", "..", "/", "<", "<=",
      "=", "==", ">", ">=", "EMPTY-NODE", "Inst", "StackTraceElement->vec",
      "Throwable->map", "accessor", "aclone", "add-classpath", "add-watch",
      "agent", "agent-error", "agent-errors", "aget", "alength", "alias",
      "all-ns", "alter", "alter-meta!", "alter-var-root", "amap", "ancestors",
      "and", "any?", "apply", "areduce", "array-map", "as->", "aset",
      "aset-boolean", "aset-byte", "aset-char", "aset-double", "aset-float",
      "aset-int", "aset-long", "aset-short", "assert", "assoc", "assoc!",
      "assoc-in", "associative?", "atom", "await", "await-for", "await1",
      "bases", "bean", "bigdec", "bigint", "biginteger", "binding", "bit-and",
      "bit-and-not", "bit-clear", "bit-flip", "bit-not", "bit-or", "bit-set",
      "bit-shift-left", "bit-shift-right", "bit-test", "bit-xor", "boolean",
      "boolean-array", "boolean?", "booleans", "bound-fn", "bound-fn*",
      "bound?", "bounded-count", "butlast", "byte", "byte-array", "bytes",
      "bytes?", "case", "cast", "cat", "char", "char-array",
      "char-escape-string", "char-name-string", "char?", "chars", "chunk",
      "chunk-append", "chunk-buffer", "chunk-cons", "chunk-first", "chunk-next",
      "chunk-rest", "chunked-seq?", "class", "class?", "clear-agent-errors",
      "clojure-version", "coll?", "comment", "commute", "comp", "comparator",
      "compare", "compare-and-set!", "compile", "complement", "completing",
      "concat", "cond", "cond->", "cond->>", "condp", "conj", "conj!", "cons",
      "constantly", "construct-proxy", "contains?", "count", "counted?",
      "create-ns", "create-struct", "cycle", "dec", "dec'", "decimal?",
      "declare", "dedupe", "default-data-readers", "definline", "definterface",
      "defmacro", "defmethod", "defmulti", "defn", "defn-", "defonce",
      "defprotocol", "defrecord", "defstruct", "deftype", "delay", "delay?",
      "deliver", "denominator", "deref", "derive", "descendants", "destructure",
      "disj", "disj!", "dissoc", "dissoc!", "distinct", "distinct?", "doall",
      "dorun", "doseq", "dosync", "dotimes", "doto", "double", "double-array",
      "double?", "doubles", "drop", "drop-last", "drop-while", "eduction",
      "empty", "empty?", "ensure", "ensure-reduced", "enumeration-seq",
      "error-handler", "error-mode", "eval", "even?", "every-pred", "every?",
      "ex-data", "ex-info", "extend", "extend-protocol", "extend-type",
      "extenders", "extends?", "false?", "ffirst", "file-seq", "filter",
      "filterv", "find", "find-keyword", "find-ns", "find-protocol-impl",
      "find-protocol-method", "find-var", "first", "flatten", "float",
      "float-array", "float?", "floats", "flush", "fn", "fn?", "fnext", "fnil",
      "for", "force", "format", "frequencies", "future", "future-call",
      "future-cancel", "future-cancelled?", "future-done?", "future?",
      "gen-class", "gen-interface", "gensym", "get", "get-in", "get-method",
      "get-proxy-class", "get-thread-bindings", "get-validator", "group-by",
      "halt-when", "hash", "hash-combine", "hash-map", "hash-ordered-coll",
      "hash-set", "hash-unordered-coll", "ident?", "identical?", "identity",
      "if-let", "if-not", "if-some", "ifn?", "import", "in-ns", "inc", "inc'",
      "indexed?", "init-proxy", "inst-ms", "inst-ms*", "inst?", "instance?",
      "int", "int-array", "int?", "integer?", "interleave", "intern",
      "interpose", "into", "into-array", "ints", "io!", "isa?", "iterate",
      "iterator-seq", "juxt", "keep", "keep-indexed", "key", "keys", "keyword",
      "keyword?", "last", "lazy-cat", "lazy-seq", "let", "letfn", "line-seq",
      "list", "list*", "list?", "load", "load-file", "load-reader",
      "load-string", "loaded-libs", "locking", "long", "long-array", "longs",
      "loop", "macroexpand", "macroexpand-1", "make-array", "make-hierarchy",
      "map", "map-entry?", "map-indexed", "map?", "mapcat", "mapv", "max",
      "max-key", "memfn", "memoize", "merge", "merge-with", "meta",
      "method-sig", "methods", "min", "min-key", "mix-collection-hash", "mod",
      "munge", "name", "namespace", "namespace-munge", "nat-int?", "neg-int?",
      "neg?", "newline", "next", "nfirst", "nil?", "nnext", "not", "not-any?",
      "not-empty", "not-every?", "not=", "ns", "ns-aliases", "ns-imports",
      "ns-interns", "ns-map", "ns-name", "ns-publics", "ns-refers",
      "ns-resolve", "ns-unalias", "ns-unmap", "nth", "nthnext", "nthrest",
      "num", "number?", "numerator", "object-array", "odd?", "or", "parents",
      "partial", "partition", "partition-all", "partition-by", "pcalls", "peek",
      "persistent!", "pmap", "pop", "pop!", "pop-thread-bindings", "pos-int?",
      "pos?", "pr", "pr-str", "prefer-method", "prefers",
      "primitives-classnames", "print", "print-ctor", "print-dup",
      "print-method", "print-simple", "print-str", "printf", "println",
      "println-str", "prn", "prn-str", "promise", "proxy",
      "proxy-call-with-super", "proxy-mappings", "proxy-name", "proxy-super",
      "push-thread-bindings", "pvalues", "qualified-ident?",
      "qualified-keyword?", "qualified-symbol?", "quot", "rand", "rand-int",
      "rand-nth", "random-sample", "range", "ratio?", "rational?",
      "rationalize", "re-find", "re-groups", "re-matcher", "re-matches",
      "re-pattern", "re-seq", "read", "read-line", "read-string",
      "reader-conditional", "reader-conditional?", "realized?", "record?",
      "reduce", "reduce-kv", "reduced", "reduced?", "reductions", "ref",
      "ref-history-count", "ref-max-history", "ref-min-history", "ref-set",
      "refer", "refer-clojure", "reify", "release-pending-sends", "rem",
      "remove", "remove-all-methods", "remove-method", "remove-ns",
      "remove-watch", "repeat", "repeatedly", "replace", "replicate", "require",
      "reset!", "reset-meta!", "reset-vals!", "resolve", "rest",
      "restart-agent", "resultset-seq", "reverse", "reversible?", "rseq",
      "rsubseq", "run!", "satisfies?", "second", "select-keys", "send",
      "send-off", "send-via", "seq", "seq?", "seqable?", "seque", "sequence",
      "sequential?", "set", "set-agent-send-executor!",
      "set-agent-send-off-executor!", "set-error-handler!", "set-error-mode!",
      "set-validator!", "set?", "short", "short-array", "shorts", "shuffle",
      "shutdown-agents", "simple-ident?", "simple-keyword?", "simple-symbol?",
      "slurp", "some", "some->", "some->>", "some-fn", "some?", "sort",
      "sort-by", "sorted-map", "sorted-map-by", "sorted-set", "sorted-set-by",
      "sorted?", "special-symbol?", "spit", "split-at", "split-with", "str",
      "string?", "struct", "struct-map", "subs", "subseq", "subvec", "supers",
      "swap!", "swap-vals!", "symbol", "symbol?", "sync", "tagged-literal",
      "tagged-literal?", "take", "take-last", "take-nth", "take-while", "test",
      "the-ns", "thread-bound?", "time", "to-array", "to-array-2d",
      "trampoline", "transduce", "transient", "tree-seq", "true?", "type",
      "unchecked-add", "unchecked-add-int", "unchecked-byte", "unchecked-char",
      "unchecked-dec", "unchecked-dec-int", "unchecked-divide-int",
      "unchecked-double", "unchecked-float", "unchecked-inc",
      "unchecked-inc-int", "unchecked-int", "unchecked-long",
      "unchecked-multiply", "unchecked-multiply-int", "unchecked-negate",
      "unchecked-negate-int", "unchecked-remainder-int", "unchecked-short",
      "unchecked-subtract", "unchecked-subtract-int", "underive", "unquote",
      "unquote-splicing", "unreduced", "unsigned-bit-shift-right", "update",
      "update-in", "update-proxy", "uri?", "use", "uuid?", "val", "vals",
      "var-get", "var-set", "var?", "vary-meta", "vec", "vector", "vector-of",
      "vector?", "volatile!", "volatile?", "vreset!", "vswap!", "when",
      "when-first", "when-let", "when-not", "when-some", "while",
      "with-bindings", "with-bindings*", "with-in-str", "with-loading-context",
      "with-local-vars", "with-meta", "with-open", "with-out-str",
      "with-precision", "with-redefs", "with-redefs-fn", "xml-seq", "zero?",
      "zipmap"];
  var haveBodyParameter = [
      "->", "->>", "as->", "binding", "bound-fn", "case", "catch", "comment",
      "cond", "cond->", "cond->>", "condp", "def", "definterface", "defmethod",
      "defn", "defmacro", "defprotocol", "defrecord", "defstruct", "deftype",
      "do", "doseq", "dotimes", "doto", "extend", "extend-protocol",
      "extend-type", "fn", "for", "future", "if", "if-let", "if-not", "if-some",
      "let", "letfn", "locking", "loop", "ns", "proxy", "reify", "struct-map",
      "some->", "some->>", "try", "when", "when-first", "when-let", "when-not",
      "when-some", "while", "with-bindings", "with-bindings*", "with-in-str",
      "with-loading-context", "with-local-vars", "with-meta", "with-open",
      "with-out-str", "with-precision", "with-redefs", "with-redefs-fn"];

  CodeMirror.registerHelper("hintWords", "clojure",
    [].concat(atoms, specialForms, coreSymbols));

  var atom = createLookupMap(atoms);
  var specialForm = createLookupMap(specialForms);
  var coreSymbol = createLookupMap(coreSymbols);
  var hasBodyParameter = createLookupMap(haveBodyParameter);
  var delimiter = /^(?:[\\\[\]\s"(),;@^`{}~]|$)/;
  var numberLiteral = /^(?:[+\-]?\d+(?:(?:N|(?:[eE][+\-]?\d+))|(?:\.?\d*(?:M|(?:[eE][+\-]?\d+))?)|\/\d+|[xX][0-9a-fA-F]+|r[0-9a-zA-Z]+)?(?=[\\\[\]\s"#'(),;@^`{}~]|$))/;
  var characterLiteral = /^(?:\\(?:backspace|formfeed|newline|return|space|tab|o[0-7]{3}|u[0-9A-Fa-f]{4}|x[0-9A-Fa-f]{4}|.)?(?=[\\\[\]\s"(),;@^`{}~]|$))/;

  // simple-namespace := /^[^\\\/\[\]\d\s"#'(),;@^`{}~][^\\\[\]\s"(),;@^`{}~]*/
  // simple-symbol    := /^(?:\/|[^\\\/\[\]\d\s"#'(),;@^`{}~][^\\\[\]\s"(),;@^`{}~]*)/
  // qualified-symbol := (<simple-namespace>(<.><simple-namespace>)*</>)?<simple-symbol>
  var qualifiedSymbol = /^(?:(?:[^\\\/\[\]\d\s"#'(),;@^`{}~][^\\\[\]\s"(),;@^`{}~]*(?:\.[^\\\/\[\]\d\s"#'(),;@^`{}~][^\\\[\]\s"(),;@^`{}~]*)*\/)?(?:\/|[^\\\/\[\]\d\s"#'(),;@^`{}~][^\\\[\]\s"(),;@^`{}~]*)*(?=[\\\[\]\s"(),;@^`{}~]|$))/;

  function base(stream, state) {
    if (stream.eatSpace()) return ["space", null];
    if (stream.match(numberLiteral)) return [null, "number"];
    if (stream.match(characterLiteral)) return [null, "string-2"];
    if (stream.eat(/^"/)) return (state.tokenize = inString)(stream, state);
    if (stream.eat(/^[(\[{]/)) return ["open", "bracket"];
    if (stream.eat(/^[)\]}]/)) return ["close", "bracket"];
    if (stream.eat(/^;/)) {stream.skipToEnd(); return ["space", "comment"];}
    if (stream.eat(/^[#'@^`~]/)) return [null, "meta"];

    var matches = stream.match(qualifiedSymbol);
    var symbol = matches && matches[0];

    if (!symbol) {
      // advance stream by at least one character so we don't get stuck.
      stream.next();
      stream.eatWhile(function (c) {return !is(c, delimiter);});
      return [null, "error"];
    }

    if (symbol === "comment" && state.lastToken === "(")
      return (state.tokenize = inComment)(stream, state);
    if (is(symbol, atom) || symbol.charAt(0) === ":") return ["symbol", "atom"];
    if (is(symbol, specialForm) || is(symbol, coreSymbol)) return ["symbol", "keyword"];
    if (state.lastToken === "(") return ["symbol", "builtin"]; // other operator

    return ["symbol", "variable"];
  }

  function inString(stream, state) {
    var escaped = false, next;

    while (next = stream.next()) {
      if (next === "\"" && !escaped) {state.tokenize = base; break;}
      escaped = !escaped && next === "\\";
    }

    return [null, "string"];
  }

  function inComment(stream, state) {
    var parenthesisCount = 1;
    var next;

    while (next = stream.next()) {
      if (next === ")") parenthesisCount--;
      if (next === "(") parenthesisCount++;
      if (parenthesisCount === 0) {
        stream.backUp(1);
        state.tokenize = base;
        break;
      }
    }

    return ["space", "comment"];
  }

  function createLookupMap(words) {
    var obj = {};

    for (var i = 0; i < words.length; ++i) obj[words[i]] = true;

    return obj;
  }

  function is(value, test) {
    if (test instanceof RegExp) return test.test(value);
    if (test instanceof Object) return test.propertyIsEnumerable(value);
  }

  return {
    startState: function () {
      return {
        ctx: {prev: null, start: 0, indentTo: 0},
        lastToken: null,
        tokenize: base
      };
    },

    token: function (stream, state) {
      if (stream.sol() && (typeof state.ctx.indentTo !== "number"))
        state.ctx.indentTo = state.ctx.start + 1;

      var typeStylePair = state.tokenize(stream, state);
      var type = typeStylePair[0];
      var style = typeStylePair[1];
      var current = stream.current();

      if (type !== "space") {
        if (state.lastToken === "(" && state.ctx.indentTo === null) {
          if (type === "symbol" && is(current, hasBodyParameter))
            state.ctx.indentTo = state.ctx.start + options.indentUnit;
          else state.ctx.indentTo = "next";
        } else if (state.ctx.indentTo === "next") {
          state.ctx.indentTo = stream.column();
        }

        state.lastToken = current;
      }

      if (type === "open")
        state.ctx = {prev: state.ctx, start: stream.column(), indentTo: null};
      else if (type === "close") state.ctx = state.ctx.prev || state.ctx;

      return style;
    },

    indent: function (state) {
      var i = state.ctx.indentTo;

      return (typeof i === "number") ?
        i :
        state.ctx.start + 1;
    },

    closeBrackets: {pairs: "()[]{}\"\""},
    lineComment: ";;"
  };
});

CodeMirror.defineMIME("text/x-clojure", "clojure");
CodeMirror.defineMIME("text/x-clojurescript", "clojure");
CodeMirror.defineMIME("application/edn", "clojure");

});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/cmake/cmake.js":
/*!************************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/cmake/cmake.js ***!
  \************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function(mod) {
  if (true)
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"));
  else {}
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode("cmake", function () {
  var variable_regex = /({)?[a-zA-Z0-9_]+(})?/;

  function tokenString(stream, state) {
    var current, prev, found_var = false;
    while (!stream.eol() && (current = stream.next()) != state.pending) {
      if (current === '$' && prev != '\\' && state.pending == '"') {
        found_var = true;
        break;
      }
      prev = current;
    }
    if (found_var) {
      stream.backUp(1);
    }
    if (current == state.pending) {
      state.continueString = false;
    } else {
      state.continueString = true;
    }
    return "string";
  }

  function tokenize(stream, state) {
    var ch = stream.next();

    // Have we found a variable?
    if (ch === '$') {
      if (stream.match(variable_regex)) {
        return 'variable-2';
      }
      return 'variable';
    }
    // Should we still be looking for the end of a string?
    if (state.continueString) {
      // If so, go through the loop again
      stream.backUp(1);
      return tokenString(stream, state);
    }
    // Do we just have a function on our hands?
    // In 'cmake_minimum_required (VERSION 2.8.8)', 'cmake_minimum_required' is matched
    if (stream.match(/(\s+)?\w+\(/) || stream.match(/(\s+)?\w+\ \(/)) {
      stream.backUp(1);
      return 'def';
    }
    if (ch == "#") {
      stream.skipToEnd();
      return "comment";
    }
    // Have we found a string?
    if (ch == "'" || ch == '"') {
      // Store the type (single or double)
      state.pending = ch;
      // Perform the looping function to find the end
      return tokenString(stream, state);
    }
    if (ch == '(' || ch == ')') {
      return 'bracket';
    }
    if (ch.match(/[0-9]/)) {
      return 'number';
    }
    stream.eatWhile(/[\w-]/);
    return null;
  }
  return {
    startState: function () {
      var state = {};
      state.inDefinition = false;
      state.inInclude = false;
      state.continueString = false;
      state.pending = false;
      return state;
    },
    token: function (stream, state) {
      if (stream.eatSpace()) return null;
      return tokenize(stream, state);
    }
  };
});

CodeMirror.defineMIME("text/x-cmake", "cmake");

});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/cobol/cobol.js":
/*!************************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/cobol/cobol.js ***!
  \************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

/**
 * Author: Gautam Mehta
 * Branched from CodeMirror's Scheme mode
 */
(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"));
  else {}
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode("cobol", function () {
  var BUILTIN = "builtin", COMMENT = "comment", STRING = "string",
      ATOM = "atom", NUMBER = "number", KEYWORD = "keyword", MODTAG = "header",
      COBOLLINENUM = "def", PERIOD = "link";
  function makeKeywords(str) {
    var obj = {}, words = str.split(" ");
    for (var i = 0; i < words.length; ++i) obj[words[i]] = true;
    return obj;
  }
  var atoms = makeKeywords("TRUE FALSE ZEROES ZEROS ZERO SPACES SPACE LOW-VALUE LOW-VALUES ");
  var keywords = makeKeywords(
      "ACCEPT ACCESS ACQUIRE ADD ADDRESS " +
      "ADVANCING AFTER ALIAS ALL ALPHABET " +
      "ALPHABETIC ALPHABETIC-LOWER ALPHABETIC-UPPER ALPHANUMERIC ALPHANUMERIC-EDITED " +
      "ALSO ALTER ALTERNATE AND ANY " +
      "ARE AREA AREAS ARITHMETIC ASCENDING " +
      "ASSIGN AT ATTRIBUTE AUTHOR AUTO " +
      "AUTO-SKIP AUTOMATIC B-AND B-EXOR B-LESS " +
      "B-NOT B-OR BACKGROUND-COLOR BACKGROUND-COLOUR BEEP " +
      "BEFORE BELL BINARY BIT BITS " +
      "BLANK BLINK BLOCK BOOLEAN BOTTOM " +
      "BY CALL CANCEL CD CF " +
      "CH CHARACTER CHARACTERS CLASS CLOCK-UNITS " +
      "CLOSE COBOL CODE CODE-SET COL " +
      "COLLATING COLUMN COMMA COMMIT COMMITMENT " +
      "COMMON COMMUNICATION COMP COMP-0 COMP-1 " +
      "COMP-2 COMP-3 COMP-4 COMP-5 COMP-6 " +
      "COMP-7 COMP-8 COMP-9 COMPUTATIONAL COMPUTATIONAL-0 " +
      "COMPUTATIONAL-1 COMPUTATIONAL-2 COMPUTATIONAL-3 COMPUTATIONAL-4 COMPUTATIONAL-5 " +
      "COMPUTATIONAL-6 COMPUTATIONAL-7 COMPUTATIONAL-8 COMPUTATIONAL-9 COMPUTE " +
      "CONFIGURATION CONNECT CONSOLE CONTAINED CONTAINS " +
      "CONTENT CONTINUE CONTROL CONTROL-AREA CONTROLS " +
      "CONVERTING COPY CORR CORRESPONDING COUNT " +
      "CRT CRT-UNDER CURRENCY CURRENT CURSOR " +
      "DATA DATE DATE-COMPILED DATE-WRITTEN DAY " +
      "DAY-OF-WEEK DB DB-ACCESS-CONTROL-KEY DB-DATA-NAME DB-EXCEPTION " +
      "DB-FORMAT-NAME DB-RECORD-NAME DB-SET-NAME DB-STATUS DBCS " +
      "DBCS-EDITED DE DEBUG-CONTENTS DEBUG-ITEM DEBUG-LINE " +
      "DEBUG-NAME DEBUG-SUB-1 DEBUG-SUB-2 DEBUG-SUB-3 DEBUGGING " +
      "DECIMAL-POINT DECLARATIVES DEFAULT DELETE DELIMITED " +
      "DELIMITER DEPENDING DESCENDING DESCRIBED DESTINATION " +
      "DETAIL DISABLE DISCONNECT DISPLAY DISPLAY-1 " +
      "DISPLAY-2 DISPLAY-3 DISPLAY-4 DISPLAY-5 DISPLAY-6 " +
      "DISPLAY-7 DISPLAY-8 DISPLAY-9 DIVIDE DIVISION " +
      "DOWN DROP DUPLICATE DUPLICATES DYNAMIC " +
      "EBCDIC EGI EJECT ELSE EMI " +
      "EMPTY EMPTY-CHECK ENABLE END END. END-ACCEPT END-ACCEPT. " +
      "END-ADD END-CALL END-COMPUTE END-DELETE END-DISPLAY " +
      "END-DIVIDE END-EVALUATE END-IF END-INVOKE END-MULTIPLY " +
      "END-OF-PAGE END-PERFORM END-READ END-RECEIVE END-RETURN " +
      "END-REWRITE END-SEARCH END-START END-STRING END-SUBTRACT " +
      "END-UNSTRING END-WRITE END-XML ENTER ENTRY " +
      "ENVIRONMENT EOP EQUAL EQUALS ERASE " +
      "ERROR ESI EVALUATE EVERY EXCEEDS " +
      "EXCEPTION EXCLUSIVE EXIT EXTEND EXTERNAL " +
      "EXTERNALLY-DESCRIBED-KEY FD FETCH FILE FILE-CONTROL " +
      "FILE-STREAM FILES FILLER FINAL FIND " +
      "FINISH FIRST FOOTING FOR FOREGROUND-COLOR " +
      "FOREGROUND-COLOUR FORMAT FREE FROM FULL " +
      "FUNCTION GENERATE GET GIVING GLOBAL " +
      "GO GOBACK GREATER GROUP HEADING " +
      "HIGH-VALUE HIGH-VALUES HIGHLIGHT I-O I-O-CONTROL " +
      "ID IDENTIFICATION IF IN INDEX " +
      "INDEX-1 INDEX-2 INDEX-3 INDEX-4 INDEX-5 " +
      "INDEX-6 INDEX-7 INDEX-8 INDEX-9 INDEXED " +
      "INDIC INDICATE INDICATOR INDICATORS INITIAL " +
      "INITIALIZE INITIATE INPUT INPUT-OUTPUT INSPECT " +
      "INSTALLATION INTO INVALID INVOKE IS " +
      "JUST JUSTIFIED KANJI KEEP KEY " +
      "LABEL LAST LD LEADING LEFT " +
      "LEFT-JUSTIFY LENGTH LENGTH-CHECK LESS LIBRARY " +
      "LIKE LIMIT LIMITS LINAGE LINAGE-COUNTER " +
      "LINE LINE-COUNTER LINES LINKAGE LOCAL-STORAGE " +
      "LOCALE LOCALLY LOCK " +
      "MEMBER MEMORY MERGE MESSAGE METACLASS " +
      "MODE MODIFIED MODIFY MODULES MOVE " +
      "MULTIPLE MULTIPLY NATIONAL NATIVE NEGATIVE " +
      "NEXT NO NO-ECHO NONE NOT " +
      "NULL NULL-KEY-MAP NULL-MAP NULLS NUMBER " +
      "NUMERIC NUMERIC-EDITED OBJECT OBJECT-COMPUTER OCCURS " +
      "OF OFF OMITTED ON ONLY " +
      "OPEN OPTIONAL OR ORDER ORGANIZATION " +
      "OTHER OUTPUT OVERFLOW OWNER PACKED-DECIMAL " +
      "PADDING PAGE PAGE-COUNTER PARSE PERFORM " +
      "PF PH PIC PICTURE PLUS " +
      "POINTER POSITION POSITIVE PREFIX PRESENT " +
      "PRINTING PRIOR PROCEDURE PROCEDURE-POINTER PROCEDURES " +
      "PROCEED PROCESS PROCESSING PROGRAM PROGRAM-ID " +
      "PROMPT PROTECTED PURGE QUEUE QUOTE " +
      "QUOTES RANDOM RD READ READY " +
      "REALM RECEIVE RECONNECT RECORD RECORD-NAME " +
      "RECORDS RECURSIVE REDEFINES REEL REFERENCE " +
      "REFERENCE-MONITOR REFERENCES RELATION RELATIVE RELEASE " +
      "REMAINDER REMOVAL RENAMES REPEATED REPLACE " +
      "REPLACING REPORT REPORTING REPORTS REPOSITORY " +
      "REQUIRED RERUN RESERVE RESET RETAINING " +
      "RETRIEVAL RETURN RETURN-CODE RETURNING REVERSE-VIDEO " +
      "REVERSED REWIND REWRITE RF RH " +
      "RIGHT RIGHT-JUSTIFY ROLLBACK ROLLING ROUNDED " +
      "RUN SAME SCREEN SD SEARCH " +
      "SECTION SECURE SECURITY SEGMENT SEGMENT-LIMIT " +
      "SELECT SEND SENTENCE SEPARATE SEQUENCE " +
      "SEQUENTIAL SET SHARED SIGN SIZE " +
      "SKIP1 SKIP2 SKIP3 SORT SORT-MERGE " +
      "SORT-RETURN SOURCE SOURCE-COMPUTER SPACE-FILL " +
      "SPECIAL-NAMES STANDARD STANDARD-1 STANDARD-2 " +
      "START STARTING STATUS STOP STORE " +
      "STRING SUB-QUEUE-1 SUB-QUEUE-2 SUB-QUEUE-3 SUB-SCHEMA " +
      "SUBFILE SUBSTITUTE SUBTRACT SUM SUPPRESS " +
      "SYMBOLIC SYNC SYNCHRONIZED SYSIN SYSOUT " +
      "TABLE TALLYING TAPE TENANT TERMINAL " +
      "TERMINATE TEST TEXT THAN THEN " +
      "THROUGH THRU TIME TIMES TITLE " +
      "TO TOP TRAILING TRAILING-SIGN TRANSACTION " +
      "TYPE TYPEDEF UNDERLINE UNEQUAL UNIT " +
      "UNSTRING UNTIL UP UPDATE UPON " +
      "USAGE USAGE-MODE USE USING VALID " +
      "VALIDATE VALUE VALUES VARYING VLR " +
      "WAIT WHEN WHEN-COMPILED WITH WITHIN " +
      "WORDS WORKING-STORAGE WRITE XML XML-CODE " +
      "XML-EVENT XML-NTEXT XML-TEXT ZERO ZERO-FILL " );

  var builtins = makeKeywords("- * ** / + < <= = > >= ");
  var tests = {
    digit: /\d/,
    digit_or_colon: /[\d:]/,
    hex: /[0-9a-f]/i,
    sign: /[+-]/,
    exponent: /e/i,
    keyword_char: /[^\s\(\[\;\)\]]/,
    symbol: /[\w*+\-]/
  };
  function isNumber(ch, stream){
    // hex
    if ( ch === '0' && stream.eat(/x/i) ) {
      stream.eatWhile(tests.hex);
      return true;
    }
    // leading sign
    if ( ( ch == '+' || ch == '-' ) && ( tests.digit.test(stream.peek()) ) ) {
      stream.eat(tests.sign);
      ch = stream.next();
    }
    if ( tests.digit.test(ch) ) {
      stream.eat(ch);
      stream.eatWhile(tests.digit);
      if ( '.' == stream.peek()) {
        stream.eat('.');
        stream.eatWhile(tests.digit);
      }
      if ( stream.eat(tests.exponent) ) {
        stream.eat(tests.sign);
        stream.eatWhile(tests.digit);
      }
      return true;
    }
    return false;
  }
  return {
    startState: function () {
      return {
        indentStack: null,
        indentation: 0,
        mode: false
      };
    },
    token: function (stream, state) {
      if (state.indentStack == null && stream.sol()) {
        // update indentation, but only if indentStack is empty
        state.indentation = 6 ; //stream.indentation();
      }
      // skip spaces
      if (stream.eatSpace()) {
        return null;
      }
      var returnType = null;
      switch(state.mode){
      case "string": // multi-line string parsing mode
        var next = false;
        while ((next = stream.next()) != null) {
          if (next == "\"" || next == "\'") {
            state.mode = false;
            break;
          }
        }
        returnType = STRING; // continue on in string mode
        break;
      default: // default parsing mode
        var ch = stream.next();
        var col = stream.column();
        if (col >= 0 && col <= 5) {
          returnType = COBOLLINENUM;
        } else if (col >= 72 && col <= 79) {
          stream.skipToEnd();
          returnType = MODTAG;
        } else if (ch == "*" && col == 6) { // comment
          stream.skipToEnd(); // rest of the line is a comment
          returnType = COMMENT;
        } else if (ch == "\"" || ch == "\'") {
          state.mode = "string";
          returnType = STRING;
        } else if (ch == "'" && !( tests.digit_or_colon.test(stream.peek()) )) {
          returnType = ATOM;
        } else if (ch == ".") {
          returnType = PERIOD;
        } else if (isNumber(ch,stream)){
          returnType = NUMBER;
        } else {
          if (stream.current().match(tests.symbol)) {
            while (col < 71) {
              if (stream.eat(tests.symbol) === undefined) {
                break;
              } else {
                col++;
              }
            }
          }
          if (keywords && keywords.propertyIsEnumerable(stream.current().toUpperCase())) {
            returnType = KEYWORD;
          } else if (builtins && builtins.propertyIsEnumerable(stream.current().toUpperCase())) {
            returnType = BUILTIN;
          } else if (atoms && atoms.propertyIsEnumerable(stream.current().toUpperCase())) {
            returnType = ATOM;
          } else returnType = null;
        }
      }
      return returnType;
    },
    indent: function (state) {
      if (state.indentStack == null) return state.indentation;
      return state.indentStack.indent;
    }
  };
});

CodeMirror.defineMIME("text/x-cobol", "cobol");

});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/coffeescript/coffeescript.js":
/*!**************************************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/coffeescript/coffeescript.js ***!
  \**************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

/**
 * Link to the project's GitHub page:
 * https://github.com/pickhardt/coffeescript-codemirror-mode
 */
(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"));
  else {}
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode("coffeescript", function(conf, parserConf) {
  var ERRORCLASS = "error";

  function wordRegexp(words) {
    return new RegExp("^((" + words.join(")|(") + "))\\b");
  }

  var operators = /^(?:->|=>|\+[+=]?|-[\-=]?|\*[\*=]?|\/[\/=]?|[=!]=|<[><]?=?|>>?=?|%=?|&=?|\|=?|\^=?|\~|!|\?|(or|and|\|\||&&|\?)=)/;
  var delimiters = /^(?:[()\[\]{},:`=;]|\.\.?\.?)/;
  var identifiers = /^[_A-Za-z$][_A-Za-z$0-9]*/;
  var atProp = /^@[_A-Za-z$][_A-Za-z$0-9]*/;

  var wordOperators = wordRegexp(["and", "or", "not",
                                  "is", "isnt", "in",
                                  "instanceof", "typeof"]);
  var indentKeywords = ["for", "while", "loop", "if", "unless", "else",
                        "switch", "try", "catch", "finally", "class"];
  var commonKeywords = ["break", "by", "continue", "debugger", "delete",
                        "do", "in", "of", "new", "return", "then",
                        "this", "@", "throw", "when", "until", "extends"];

  var keywords = wordRegexp(indentKeywords.concat(commonKeywords));

  indentKeywords = wordRegexp(indentKeywords);


  var stringPrefixes = /^('{3}|\"{3}|['\"])/;
  var regexPrefixes = /^(\/{3}|\/)/;
  var commonConstants = ["Infinity", "NaN", "undefined", "null", "true", "false", "on", "off", "yes", "no"];
  var constants = wordRegexp(commonConstants);

  // Tokenizers
  function tokenBase(stream, state) {
    // Handle scope changes
    if (stream.sol()) {
      if (state.scope.align === null) state.scope.align = false;
      var scopeOffset = state.scope.offset;
      if (stream.eatSpace()) {
        var lineOffset = stream.indentation();
        if (lineOffset > scopeOffset && state.scope.type == "coffee") {
          return "indent";
        } else if (lineOffset < scopeOffset) {
          return "dedent";
        }
        return null;
      } else {
        if (scopeOffset > 0) {
          dedent(stream, state);
        }
      }
    }
    if (stream.eatSpace()) {
      return null;
    }

    var ch = stream.peek();

    // Handle docco title comment (single line)
    if (stream.match("####")) {
      stream.skipToEnd();
      return "comment";
    }

    // Handle multi line comments
    if (stream.match("###")) {
      state.tokenize = longComment;
      return state.tokenize(stream, state);
    }

    // Single line comment
    if (ch === "#") {
      stream.skipToEnd();
      return "comment";
    }

    // Handle number literals
    if (stream.match(/^-?[0-9\.]/, false)) {
      var floatLiteral = false;
      // Floats
      if (stream.match(/^-?\d*\.\d+(e[\+\-]?\d+)?/i)) {
        floatLiteral = true;
      }
      if (stream.match(/^-?\d+\.\d*/)) {
        floatLiteral = true;
      }
      if (stream.match(/^-?\.\d+/)) {
        floatLiteral = true;
      }

      if (floatLiteral) {
        // prevent from getting extra . on 1..
        if (stream.peek() == "."){
          stream.backUp(1);
        }
        return "number";
      }
      // Integers
      var intLiteral = false;
      // Hex
      if (stream.match(/^-?0x[0-9a-f]+/i)) {
        intLiteral = true;
      }
      // Decimal
      if (stream.match(/^-?[1-9]\d*(e[\+\-]?\d+)?/)) {
        intLiteral = true;
      }
      // Zero by itself with no other piece of number.
      if (stream.match(/^-?0(?![\dx])/i)) {
        intLiteral = true;
      }
      if (intLiteral) {
        return "number";
      }
    }

    // Handle strings
    if (stream.match(stringPrefixes)) {
      state.tokenize = tokenFactory(stream.current(), false, "string");
      return state.tokenize(stream, state);
    }
    // Handle regex literals
    if (stream.match(regexPrefixes)) {
      if (stream.current() != "/" || stream.match(/^.*\//, false)) { // prevent highlight of division
        state.tokenize = tokenFactory(stream.current(), true, "string-2");
        return state.tokenize(stream, state);
      } else {
        stream.backUp(1);
      }
    }



    // Handle operators and delimiters
    if (stream.match(operators) || stream.match(wordOperators)) {
      return "operator";
    }
    if (stream.match(delimiters)) {
      return "punctuation";
    }

    if (stream.match(constants)) {
      return "atom";
    }

    if (stream.match(atProp) || state.prop && stream.match(identifiers)) {
      return "property";
    }

    if (stream.match(keywords)) {
      return "keyword";
    }

    if (stream.match(identifiers)) {
      return "variable";
    }

    // Handle non-detected items
    stream.next();
    return ERRORCLASS;
  }

  function tokenFactory(delimiter, singleline, outclass) {
    return function(stream, state) {
      while (!stream.eol()) {
        stream.eatWhile(/[^'"\/\\]/);
        if (stream.eat("\\")) {
          stream.next();
          if (singleline && stream.eol()) {
            return outclass;
          }
        } else if (stream.match(delimiter)) {
          state.tokenize = tokenBase;
          return outclass;
        } else {
          stream.eat(/['"\/]/);
        }
      }
      if (singleline) {
        if (parserConf.singleLineStringErrors) {
          outclass = ERRORCLASS;
        } else {
          state.tokenize = tokenBase;
        }
      }
      return outclass;
    };
  }

  function longComment(stream, state) {
    while (!stream.eol()) {
      stream.eatWhile(/[^#]/);
      if (stream.match("###")) {
        state.tokenize = tokenBase;
        break;
      }
      stream.eatWhile("#");
    }
    return "comment";
  }

  function indent(stream, state, type) {
    type = type || "coffee";
    var offset = 0, align = false, alignOffset = null;
    for (var scope = state.scope; scope; scope = scope.prev) {
      if (scope.type === "coffee" || scope.type == "}") {
        offset = scope.offset + conf.indentUnit;
        break;
      }
    }
    if (type !== "coffee") {
      align = null;
      alignOffset = stream.column() + stream.current().length;
    } else if (state.scope.align) {
      state.scope.align = false;
    }
    state.scope = {
      offset: offset,
      type: type,
      prev: state.scope,
      align: align,
      alignOffset: alignOffset
    };
  }

  function dedent(stream, state) {
    if (!state.scope.prev) return;
    if (state.scope.type === "coffee") {
      var _indent = stream.indentation();
      var matched = false;
      for (var scope = state.scope; scope; scope = scope.prev) {
        if (_indent === scope.offset) {
          matched = true;
          break;
        }
      }
      if (!matched) {
        return true;
      }
      while (state.scope.prev && state.scope.offset !== _indent) {
        state.scope = state.scope.prev;
      }
      return false;
    } else {
      state.scope = state.scope.prev;
      return false;
    }
  }

  function tokenLexer(stream, state) {
    var style = state.tokenize(stream, state);
    var current = stream.current();

    // Handle scope changes.
    if (current === "return") {
      state.dedent = true;
    }
    if (((current === "->" || current === "=>") && stream.eol())
        || style === "indent") {
      indent(stream, state);
    }
    var delimiter_index = "[({".indexOf(current);
    if (delimiter_index !== -1) {
      indent(stream, state, "])}".slice(delimiter_index, delimiter_index+1));
    }
    if (indentKeywords.exec(current)){
      indent(stream, state);
    }
    if (current == "then"){
      dedent(stream, state);
    }


    if (style === "dedent") {
      if (dedent(stream, state)) {
        return ERRORCLASS;
      }
    }
    delimiter_index = "])}".indexOf(current);
    if (delimiter_index !== -1) {
      while (state.scope.type == "coffee" && state.scope.prev)
        state.scope = state.scope.prev;
      if (state.scope.type == current)
        state.scope = state.scope.prev;
    }
    if (state.dedent && stream.eol()) {
      if (state.scope.type == "coffee" && state.scope.prev)
        state.scope = state.scope.prev;
      state.dedent = false;
    }

    return style;
  }

  var external = {
    startState: function(basecolumn) {
      return {
        tokenize: tokenBase,
        scope: {offset:basecolumn || 0, type:"coffee", prev: null, align: false},
        prop: false,
        dedent: 0
      };
    },

    token: function(stream, state) {
      var fillAlign = state.scope.align === null && state.scope;
      if (fillAlign && stream.sol()) fillAlign.align = false;

      var style = tokenLexer(stream, state);
      if (style && style != "comment") {
        if (fillAlign) fillAlign.align = true;
        state.prop = style == "punctuation" && stream.current() == "."
      }

      return style;
    },

    indent: function(state, text) {
      if (state.tokenize != tokenBase) return 0;
      var scope = state.scope;
      var closer = text && "])}".indexOf(text.charAt(0)) > -1;
      if (closer) while (scope.type == "coffee" && scope.prev) scope = scope.prev;
      var closes = closer && scope.type === text.charAt(0);
      if (scope.align)
        return scope.alignOffset - (closes ? 1 : 0);
      else
        return (closes ? scope.prev : scope).offset;
    },

    lineComment: "#",
    fold: "indent"
  };
  return external;
});

// IANA registered media type
// https://www.iana.org/assignments/media-types/
CodeMirror.defineMIME("application/vnd.coffeescript", "coffeescript");

CodeMirror.defineMIME("text/x-coffeescript", "coffeescript");
CodeMirror.defineMIME("text/coffeescript", "coffeescript");

});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/commonlisp/commonlisp.js":
/*!**********************************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/commonlisp/commonlisp.js ***!
  \**********************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"));
  else {}
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode("commonlisp", function (config) {
  var specialForm = /^(block|let*|return-from|catch|load-time-value|setq|eval-when|locally|symbol-macrolet|flet|macrolet|tagbody|function|multiple-value-call|the|go|multiple-value-prog1|throw|if|progn|unwind-protect|labels|progv|let|quote)$/;
  var assumeBody = /^with|^def|^do|^prog|case$|^cond$|bind$|when$|unless$/;
  var numLiteral = /^(?:[+\-]?(?:\d+|\d*\.\d+)(?:[efd][+\-]?\d+)?|[+\-]?\d+(?:\/[+\-]?\d+)?|#b[+\-]?[01]+|#o[+\-]?[0-7]+|#x[+\-]?[\da-f]+)/;
  var symbol = /[^\s'`,@()\[\]";]/;
  var type;

  function readSym(stream) {
    var ch;
    while (ch = stream.next()) {
      if (ch == "\\") stream.next();
      else if (!symbol.test(ch)) { stream.backUp(1); break; }
    }
    return stream.current();
  }

  function base(stream, state) {
    if (stream.eatSpace()) {type = "ws"; return null;}
    if (stream.match(numLiteral)) return "number";
    var ch = stream.next();
    if (ch == "\\") ch = stream.next();

    if (ch == '"') return (state.tokenize = inString)(stream, state);
    else if (ch == "(") { type = "open"; return "bracket"; }
    else if (ch == ")" || ch == "]") { type = "close"; return "bracket"; }
    else if (ch == ";") { stream.skipToEnd(); type = "ws"; return "comment"; }
    else if (/['`,@]/.test(ch)) return null;
    else if (ch == "|") {
      if (stream.skipTo("|")) { stream.next(); return "symbol"; }
      else { stream.skipToEnd(); return "error"; }
    } else if (ch == "#") {
      var ch = stream.next();
      if (ch == "(") { type = "open"; return "bracket"; }
      else if (/[+\-=\.']/.test(ch)) return null;
      else if (/\d/.test(ch) && stream.match(/^\d*#/)) return null;
      else if (ch == "|") return (state.tokenize = inComment)(stream, state);
      else if (ch == ":") { readSym(stream); return "meta"; }
      else if (ch == "\\") { stream.next(); readSym(stream); return "string-2" }
      else return "error";
    } else {
      var name = readSym(stream);
      if (name == ".") return null;
      type = "symbol";
      if (name == "nil" || name == "t" || name.charAt(0) == ":") return "atom";
      if (state.lastType == "open" && (specialForm.test(name) || assumeBody.test(name))) return "keyword";
      if (name.charAt(0) == "&") return "variable-2";
      return "variable";
    }
  }

  function inString(stream, state) {
    var escaped = false, next;
    while (next = stream.next()) {
      if (next == '"' && !escaped) { state.tokenize = base; break; }
      escaped = !escaped && next == "\\";
    }
    return "string";
  }

  function inComment(stream, state) {
    var next, last;
    while (next = stream.next()) {
      if (next == "#" && last == "|") { state.tokenize = base; break; }
      last = next;
    }
    type = "ws";
    return "comment";
  }

  return {
    startState: function () {
      return {ctx: {prev: null, start: 0, indentTo: 0}, lastType: null, tokenize: base};
    },

    token: function (stream, state) {
      if (stream.sol() && typeof state.ctx.indentTo != "number")
        state.ctx.indentTo = state.ctx.start + 1;

      type = null;
      var style = state.tokenize(stream, state);
      if (type != "ws") {
        if (state.ctx.indentTo == null) {
          if (type == "symbol" && assumeBody.test(stream.current()))
            state.ctx.indentTo = state.ctx.start + config.indentUnit;
          else
            state.ctx.indentTo = "next";
        } else if (state.ctx.indentTo == "next") {
          state.ctx.indentTo = stream.column();
        }
        state.lastType = type;
      }
      if (type == "open") state.ctx = {prev: state.ctx, start: stream.column(), indentTo: null};
      else if (type == "close") state.ctx = state.ctx.prev || state.ctx;
      return style;
    },

    indent: function (state, _textAfter) {
      var i = state.ctx.indentTo;
      return typeof i == "number" ? i : state.ctx.start + 1;
    },

    closeBrackets: {pairs: "()[]{}\"\""},
    lineComment: ";;",
    blockCommentStart: "#|",
    blockCommentEnd: "|#"
  };
});

CodeMirror.defineMIME("text/x-common-lisp", "commonlisp");

});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/crystal/crystal.js":
/*!****************************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/crystal/crystal.js ***!
  \****************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"));
  else {}
})(function(CodeMirror) {
  "use strict";

  CodeMirror.defineMode("crystal", function(config) {
    function wordRegExp(words, end) {
      return new RegExp((end ? "" : "^") + "(?:" + words.join("|") + ")" + (end ? "$" : "\\b"));
    }

    function chain(tokenize, stream, state) {
      state.tokenize.push(tokenize);
      return tokenize(stream, state);
    }

    var operators = /^(?:[-+/%|&^]|\*\*?|[<>]{2})/;
    var conditionalOperators = /^(?:[=!]~|===|<=>|[<>=!]=?|[|&]{2}|~)/;
    var indexingOperators = /^(?:\[\][?=]?)/;
    var anotherOperators = /^(?:\.(?:\.{2})?|->|[?:])/;
    var idents = /^[a-z_\u009F-\uFFFF][a-zA-Z0-9_\u009F-\uFFFF]*/;
    var types = /^[A-Z_\u009F-\uFFFF][a-zA-Z0-9_\u009F-\uFFFF]*/;
    var keywords = wordRegExp([
      "abstract", "alias", "as", "asm", "begin", "break", "case", "class", "def", "do",
      "else", "elsif", "end", "ensure", "enum", "extend", "for", "fun", "if",
      "include", "instance_sizeof", "lib", "macro", "module", "next", "of", "out", "pointerof",
      "private", "protected", "rescue", "return", "require", "select", "sizeof", "struct",
      "super", "then", "type", "typeof", "uninitialized", "union", "unless", "until", "when", "while", "with",
      "yield", "__DIR__", "__END_LINE__", "__FILE__", "__LINE__"
    ]);
    var atomWords = wordRegExp(["true", "false", "nil", "self"]);
    var indentKeywordsArray = [
      "def", "fun", "macro",
      "class", "module", "struct", "lib", "enum", "union",
      "do", "for"
    ];
    var indentKeywords = wordRegExp(indentKeywordsArray);
    var indentExpressionKeywordsArray = ["if", "unless", "case", "while", "until", "begin", "then"];
    var indentExpressionKeywords = wordRegExp(indentExpressionKeywordsArray);
    var dedentKeywordsArray = ["end", "else", "elsif", "rescue", "ensure"];
    var dedentKeywords = wordRegExp(dedentKeywordsArray);
    var dedentPunctualsArray = ["\\)", "\\}", "\\]"];
    var dedentPunctuals = new RegExp("^(?:" + dedentPunctualsArray.join("|") + ")$");
    var nextTokenizer = {
      "def": tokenFollowIdent, "fun": tokenFollowIdent, "macro": tokenMacroDef,
      "class": tokenFollowType, "module": tokenFollowType, "struct": tokenFollowType,
      "lib": tokenFollowType, "enum": tokenFollowType, "union": tokenFollowType
    };
    var matching = {"[": "]", "{": "}", "(": ")", "<": ">"};

    function tokenBase(stream, state) {
      if (stream.eatSpace()) {
        return null;
      }

      // Macros
      if (state.lastToken != "\\" && stream.match("{%", false)) {
        return chain(tokenMacro("%", "%"), stream, state);
      }

      if (state.lastToken != "\\" && stream.match("{{", false)) {
        return chain(tokenMacro("{", "}"), stream, state);
      }

      // Comments
      if (stream.peek() == "#") {
        stream.skipToEnd();
        return "comment";
      }

      // Variables and keywords
      var matched;
      if (stream.match(idents)) {
        stream.eat(/[?!]/);

        matched = stream.current();
        if (stream.eat(":")) {
          return "atom";
        } else if (state.lastToken == ".") {
          return "property";
        } else if (keywords.test(matched)) {
          if (indentKeywords.test(matched)) {
            if (!(matched == "fun" && state.blocks.indexOf("lib") >= 0) && !(matched == "def" && state.lastToken == "abstract")) {
              state.blocks.push(matched);
              state.currentIndent += 1;
            }
          } else if ((state.lastStyle == "operator" || !state.lastStyle) && indentExpressionKeywords.test(matched)) {
            state.blocks.push(matched);
            state.currentIndent += 1;
          } else if (matched == "end") {
            state.blocks.pop();
            state.currentIndent -= 1;
          }

          if (nextTokenizer.hasOwnProperty(matched)) {
            state.tokenize.push(nextTokenizer[matched]);
          }

          return "keyword";
        } else if (atomWords.test(matched)) {
          return "atom";
        }

        return "variable";
      }

      // Class variables and instance variables
      // or attributes
      if (stream.eat("@")) {
        if (stream.peek() == "[") {
          return chain(tokenNest("[", "]", "meta"), stream, state);
        }

        stream.eat("@");
        stream.match(idents) || stream.match(types);
        return "variable-2";
      }

      // Constants and types
      if (stream.match(types)) {
        return "tag";
      }

      // Symbols or ':' operator
      if (stream.eat(":")) {
        if (stream.eat("\"")) {
          return chain(tokenQuote("\"", "atom", false), stream, state);
        } else if (stream.match(idents) || stream.match(types) ||
                   stream.match(operators) || stream.match(conditionalOperators) || stream.match(indexingOperators)) {
          return "atom";
        }
        stream.eat(":");
        return "operator";
      }

      // Strings
      if (stream.eat("\"")) {
        return chain(tokenQuote("\"", "string", true), stream, state);
      }

      // Strings or regexps or macro variables or '%' operator
      if (stream.peek() == "%") {
        var style = "string";
        var embed = true;
        var delim;

        if (stream.match("%r")) {
          // Regexps
          style = "string-2";
          delim = stream.next();
        } else if (stream.match("%w")) {
          embed = false;
          delim = stream.next();
        } else if (stream.match("%q")) {
          embed = false;
          delim = stream.next();
        } else {
          if(delim = stream.match(/^%([^\w\s=])/)) {
            delim = delim[1];
          } else if (stream.match(/^%[a-zA-Z0-9_\u009F-\uFFFF]*/)) {
            // Macro variables
            return "meta";
          } else {
            // '%' operator
            return "operator";
          }
        }

        if (matching.hasOwnProperty(delim)) {
          delim = matching[delim];
        }
        return chain(tokenQuote(delim, style, embed), stream, state);
      }

      // Here Docs
      if (matched = stream.match(/^<<-('?)([A-Z]\w*)\1/)) {
        return chain(tokenHereDoc(matched[2], !matched[1]), stream, state)
      }

      // Characters
      if (stream.eat("'")) {
        stream.match(/^(?:[^']|\\(?:[befnrtv0'"]|[0-7]{3}|u(?:[0-9a-fA-F]{4}|\{[0-9a-fA-F]{1,6}\})))/);
        stream.eat("'");
        return "atom";
      }

      // Numbers
      if (stream.eat("0")) {
        if (stream.eat("x")) {
          stream.match(/^[0-9a-fA-F]+/);
        } else if (stream.eat("o")) {
          stream.match(/^[0-7]+/);
        } else if (stream.eat("b")) {
          stream.match(/^[01]+/);
        }
        return "number";
      }

      if (stream.eat(/^\d/)) {
        stream.match(/^\d*(?:\.\d+)?(?:[eE][+-]?\d+)?/);
        return "number";
      }

      // Operators
      if (stream.match(operators)) {
        stream.eat("="); // Operators can follow assign symbol.
        return "operator";
      }

      if (stream.match(conditionalOperators) || stream.match(anotherOperators)) {
        return "operator";
      }

      // Parens and braces
      if (matched = stream.match(/[({[]/, false)) {
        matched = matched[0];
        return chain(tokenNest(matched, matching[matched], null), stream, state);
      }

      // Escapes
      if (stream.eat("\\")) {
        stream.next();
        return "meta";
      }

      stream.next();
      return null;
    }

    function tokenNest(begin, end, style, started) {
      return function (stream, state) {
        if (!started && stream.match(begin)) {
          state.tokenize[state.tokenize.length - 1] = tokenNest(begin, end, style, true);
          state.currentIndent += 1;
          return style;
        }

        var nextStyle = tokenBase(stream, state);
        if (stream.current() === end) {
          state.tokenize.pop();
          state.currentIndent -= 1;
          nextStyle = style;
        }

        return nextStyle;
      };
    }

    function tokenMacro(begin, end, started) {
      return function (stream, state) {
        if (!started && stream.match("{" + begin)) {
          state.currentIndent += 1;
          state.tokenize[state.tokenize.length - 1] = tokenMacro(begin, end, true);
          return "meta";
        }

        if (stream.match(end + "}")) {
          state.currentIndent -= 1;
          state.tokenize.pop();
          return "meta";
        }

        return tokenBase(stream, state);
      };
    }

    function tokenMacroDef(stream, state) {
      if (stream.eatSpace()) {
        return null;
      }

      var matched;
      if (matched = stream.match(idents)) {
        if (matched == "def") {
          return "keyword";
        }
        stream.eat(/[?!]/);
      }

      state.tokenize.pop();
      return "def";
    }

    function tokenFollowIdent(stream, state) {
      if (stream.eatSpace()) {
        return null;
      }

      if (stream.match(idents)) {
        stream.eat(/[!?]/);
      } else {
        stream.match(operators) || stream.match(conditionalOperators) || stream.match(indexingOperators);
      }
      state.tokenize.pop();
      return "def";
    }

    function tokenFollowType(stream, state) {
      if (stream.eatSpace()) {
        return null;
      }

      stream.match(types);
      state.tokenize.pop();
      return "def";
    }

    function tokenQuote(end, style, embed) {
      return function (stream, state) {
        var escaped = false;

        while (stream.peek()) {
          if (!escaped) {
            if (stream.match("{%", false)) {
              state.tokenize.push(tokenMacro("%", "%"));
              return style;
            }

            if (stream.match("{{", false)) {
              state.tokenize.push(tokenMacro("{", "}"));
              return style;
            }

            if (embed && stream.match("#{", false)) {
              state.tokenize.push(tokenNest("#{", "}", "meta"));
              return style;
            }

            var ch = stream.next();

            if (ch == end) {
              state.tokenize.pop();
              return style;
            }

            escaped = embed && ch == "\\";
          } else {
            stream.next();
            escaped = false;
          }
        }

        return style;
      };
    }

    function tokenHereDoc(phrase, embed) {
      return function (stream, state) {
        if (stream.sol()) {
          stream.eatSpace()
          if (stream.match(phrase)) {
            state.tokenize.pop();
            return "string";
          }
        }

        var escaped = false;
        while (stream.peek()) {
          if (!escaped) {
            if (stream.match("{%", false)) {
              state.tokenize.push(tokenMacro("%", "%"));
              return "string";
            }

            if (stream.match("{{", false)) {
              state.tokenize.push(tokenMacro("{", "}"));
              return "string";
            }

            if (embed && stream.match("#{", false)) {
              state.tokenize.push(tokenNest("#{", "}", "meta"));
              return "string";
            }

            escaped = embed && stream.next() == "\\";
          } else {
            stream.next();
            escaped = false;
          }
        }

        return "string";
      }
    }

    return {
      startState: function () {
        return {
          tokenize: [tokenBase],
          currentIndent: 0,
          lastToken: null,
          lastStyle: null,
          blocks: []
        };
      },

      token: function (stream, state) {
        var style = state.tokenize[state.tokenize.length - 1](stream, state);
        var token = stream.current();

        if (style && style != "comment") {
          state.lastToken = token;
          state.lastStyle = style;
        }

        return style;
      },

      indent: function (state, textAfter) {
        textAfter = textAfter.replace(/^\s*(?:\{%)?\s*|\s*(?:%\})?\s*$/g, "");

        if (dedentKeywords.test(textAfter) || dedentPunctuals.test(textAfter)) {
          return config.indentUnit * (state.currentIndent - 1);
        }

        return config.indentUnit * state.currentIndent;
      },

      fold: "indent",
      electricInput: wordRegExp(dedentPunctualsArray.concat(dedentKeywordsArray), true),
      lineComment: '#'
    };
  });

  CodeMirror.defineMIME("text/x-crystal", "crystal");
});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/cypher/cypher.js":
/*!**************************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/cypher/cypher.js ***!
  \**************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

// By the Neo4j Team and contributors.
// https://github.com/neo4j-contrib/CodeMirror

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"));
  else {}
})(function(CodeMirror) {
  "use strict";
  var wordRegexp = function(words) {
    return new RegExp("^(?:" + words.join("|") + ")$", "i");
  };

  CodeMirror.defineMode("cypher", function(config) {
    var tokenBase = function(stream/*, state*/) {
      var ch = stream.next();
      if (ch ==='"') {
        stream.match(/.*?"/);
        return "string";
      }
      if (ch === "'") {
        stream.match(/.*?'/);
        return "string";
      }
      if (/[{}\(\),\.;\[\]]/.test(ch)) {
        curPunc = ch;
        return "node";
      } else if (ch === "/" && stream.eat("/")) {
        stream.skipToEnd();
        return "comment";
      } else if (operatorChars.test(ch)) {
        stream.eatWhile(operatorChars);
        return null;
      } else {
        stream.eatWhile(/[_\w\d]/);
        if (stream.eat(":")) {
          stream.eatWhile(/[\w\d_\-]/);
          return "atom";
        }
        var word = stream.current();
        if (funcs.test(word)) return "builtin";
        if (preds.test(word)) return "def";
        if (keywords.test(word)) return "keyword";
        return "variable";
      }
    };
    var pushContext = function(state, type, col) {
      return state.context = {
        prev: state.context,
        indent: state.indent,
        col: col,
        type: type
      };
    };
    var popContext = function(state) {
      state.indent = state.context.indent;
      return state.context = state.context.prev;
    };
    var indentUnit = config.indentUnit;
    var curPunc;
    var funcs = wordRegexp(["abs", "acos", "allShortestPaths", "asin", "atan", "atan2", "avg", "ceil", "coalesce", "collect", "cos", "cot", "count", "degrees", "e", "endnode", "exp", "extract", "filter", "floor", "haversin", "head", "id", "keys", "labels", "last", "left", "length", "log", "log10", "lower", "ltrim", "max", "min", "node", "nodes", "percentileCont", "percentileDisc", "pi", "radians", "rand", "range", "reduce", "rel", "relationship", "relationships", "replace", "reverse", "right", "round", "rtrim", "shortestPath", "sign", "sin", "size", "split", "sqrt", "startnode", "stdev", "stdevp", "str", "substring", "sum", "tail", "tan", "timestamp", "toFloat", "toInt", "toString", "trim", "type", "upper"]);
    var preds = wordRegexp(["all", "and", "any", "contains", "exists", "has", "in", "none", "not", "or", "single", "xor"]);
    var keywords = wordRegexp(["as", "asc", "ascending", "assert", "by", "case", "commit", "constraint", "create", "csv", "cypher", "delete", "desc", "descending", "detach", "distinct", "drop", "else", "end", "ends", "explain", "false", "fieldterminator", "foreach", "from", "headers", "in", "index", "is", "join", "limit", "load", "match", "merge", "null", "on", "optional", "order", "periodic", "profile", "remove", "return", "scan", "set", "skip", "start", "starts", "then", "true", "union", "unique", "unwind", "using", "when", "where", "with", "call", "yield"]);
    var operatorChars = /[*+\-<>=&|~%^]/;

    return {
      startState: function(/*base*/) {
        return {
          tokenize: tokenBase,
          context: null,
          indent: 0,
          col: 0
        };
      },
      token: function(stream, state) {
        if (stream.sol()) {
          if (state.context && (state.context.align == null)) {
            state.context.align = false;
          }
          state.indent = stream.indentation();
        }
        if (stream.eatSpace()) {
          return null;
        }
        var style = state.tokenize(stream, state);
        if (style !== "comment" && state.context && (state.context.align == null) && state.context.type !== "pattern") {
          state.context.align = true;
        }
        if (curPunc === "(") {
          pushContext(state, ")", stream.column());
        } else if (curPunc === "[") {
          pushContext(state, "]", stream.column());
        } else if (curPunc === "{") {
          pushContext(state, "}", stream.column());
        } else if (/[\]\}\)]/.test(curPunc)) {
          while (state.context && state.context.type === "pattern") {
            popContext(state);
          }
          if (state.context && curPunc === state.context.type) {
            popContext(state);
          }
        } else if (curPunc === "." && state.context && state.context.type === "pattern") {
          popContext(state);
        } else if (/atom|string|variable/.test(style) && state.context) {
          if (/[\}\]]/.test(state.context.type)) {
            pushContext(state, "pattern", stream.column());
          } else if (state.context.type === "pattern" && !state.context.align) {
            state.context.align = true;
            state.context.col = stream.column();
          }
        }
        return style;
      },
      indent: function(state, textAfter) {
        var firstChar = textAfter && textAfter.charAt(0);
        var context = state.context;
        if (/[\]\}]/.test(firstChar)) {
          while (context && context.type === "pattern") {
            context = context.prev;
          }
        }
        var closing = context && firstChar === context.type;
        if (!context) return 0;
        if (context.type === "keywords") return CodeMirror.commands.newlineAndIndent;
        if (context.align) return context.col + (closing ? 0 : 1);
        return context.indent + (closing ? 0 : indentUnit);
      }
    };
  });

  CodeMirror.modeExtensions["cypher"] = {
    autoFormatLineBreaks: function(text) {
      var i, lines, reProcessedPortion;
      var lines = text.split("\n");
      var reProcessedPortion = /\s+\b(return|where|order by|match|with|skip|limit|create|delete|set)\b\s/g;
      for (var i = 0; i < lines.length; i++)
        lines[i] = lines[i].replace(reProcessedPortion, " \n$1 ").trim();
      return lines.join("\n");
    }
  };

  CodeMirror.defineMIME("application/x-cypher-query", "cypher");

});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/d/d.js":
/*!****************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/d/d.js ***!
  \****************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"));
  else {}
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode("d", function(config, parserConfig) {
  var indentUnit = config.indentUnit,
      statementIndentUnit = parserConfig.statementIndentUnit || indentUnit,
      keywords = parserConfig.keywords || {},
      builtin = parserConfig.builtin || {},
      blockKeywords = parserConfig.blockKeywords || {},
      atoms = parserConfig.atoms || {},
      hooks = parserConfig.hooks || {},
      multiLineStrings = parserConfig.multiLineStrings;
  var isOperatorChar = /[+\-*&%=<>!?|\/]/;

  var curPunc;

  function tokenBase(stream, state) {
    var ch = stream.next();
    if (hooks[ch]) {
      var result = hooks[ch](stream, state);
      if (result !== false) return result;
    }
    if (ch == '"' || ch == "'" || ch == "`") {
      state.tokenize = tokenString(ch);
      return state.tokenize(stream, state);
    }
    if (/[\[\]{}\(\),;\:\.]/.test(ch)) {
      curPunc = ch;
      return null;
    }
    if (/\d/.test(ch)) {
      stream.eatWhile(/[\w\.]/);
      return "number";
    }
    if (ch == "/") {
      if (stream.eat("+")) {
        state.tokenize = tokenNestedComment;
        return tokenNestedComment(stream, state);
      }
      if (stream.eat("*")) {
        state.tokenize = tokenComment;
        return tokenComment(stream, state);
      }
      if (stream.eat("/")) {
        stream.skipToEnd();
        return "comment";
      }
    }
    if (isOperatorChar.test(ch)) {
      stream.eatWhile(isOperatorChar);
      return "operator";
    }
    stream.eatWhile(/[\w\$_\xa1-\uffff]/);
    var cur = stream.current();
    if (keywords.propertyIsEnumerable(cur)) {
      if (blockKeywords.propertyIsEnumerable(cur)) curPunc = "newstatement";
      return "keyword";
    }
    if (builtin.propertyIsEnumerable(cur)) {
      if (blockKeywords.propertyIsEnumerable(cur)) curPunc = "newstatement";
      return "builtin";
    }
    if (atoms.propertyIsEnumerable(cur)) return "atom";
    return "variable";
  }

  function tokenString(quote) {
    return function(stream, state) {
      var escaped = false, next, end = false;
      while ((next = stream.next()) != null) {
        if (next == quote && !escaped) {end = true; break;}
        escaped = !escaped && next == "\\";
      }
      if (end || !(escaped || multiLineStrings))
        state.tokenize = null;
      return "string";
    };
  }

  function tokenComment(stream, state) {
    var maybeEnd = false, ch;
    while (ch = stream.next()) {
      if (ch == "/" && maybeEnd) {
        state.tokenize = null;
        break;
      }
      maybeEnd = (ch == "*");
    }
    return "comment";
  }

  function tokenNestedComment(stream, state) {
    var maybeEnd = false, ch;
    while (ch = stream.next()) {
      if (ch == "/" && maybeEnd) {
        state.tokenize = null;
        break;
      }
      maybeEnd = (ch == "+");
    }
    return "comment";
  }

  function Context(indented, column, type, align, prev) {
    this.indented = indented;
    this.column = column;
    this.type = type;
    this.align = align;
    this.prev = prev;
  }
  function pushContext(state, col, type) {
    var indent = state.indented;
    if (state.context && state.context.type == "statement")
      indent = state.context.indented;
    return state.context = new Context(indent, col, type, null, state.context);
  }
  function popContext(state) {
    var t = state.context.type;
    if (t == ")" || t == "]" || t == "}")
      state.indented = state.context.indented;
    return state.context = state.context.prev;
  }

  // Interface

  return {
    startState: function(basecolumn) {
      return {
        tokenize: null,
        context: new Context((basecolumn || 0) - indentUnit, 0, "top", false),
        indented: 0,
        startOfLine: true
      };
    },

    token: function(stream, state) {
      var ctx = state.context;
      if (stream.sol()) {
        if (ctx.align == null) ctx.align = false;
        state.indented = stream.indentation();
        state.startOfLine = true;
      }
      if (stream.eatSpace()) return null;
      curPunc = null;
      var style = (state.tokenize || tokenBase)(stream, state);
      if (style == "comment" || style == "meta") return style;
      if (ctx.align == null) ctx.align = true;

      if ((curPunc == ";" || curPunc == ":" || curPunc == ",") && ctx.type == "statement") popContext(state);
      else if (curPunc == "{") pushContext(state, stream.column(), "}");
      else if (curPunc == "[") pushContext(state, stream.column(), "]");
      else if (curPunc == "(") pushContext(state, stream.column(), ")");
      else if (curPunc == "}") {
        while (ctx.type == "statement") ctx = popContext(state);
        if (ctx.type == "}") ctx = popContext(state);
        while (ctx.type == "statement") ctx = popContext(state);
      }
      else if (curPunc == ctx.type) popContext(state);
      else if (((ctx.type == "}" || ctx.type == "top") && curPunc != ';') || (ctx.type == "statement" && curPunc == "newstatement"))
        pushContext(state, stream.column(), "statement");
      state.startOfLine = false;
      return style;
    },

    indent: function(state, textAfter) {
      if (state.tokenize != tokenBase && state.tokenize != null) return CodeMirror.Pass;
      var ctx = state.context, firstChar = textAfter && textAfter.charAt(0);
      if (ctx.type == "statement" && firstChar == "}") ctx = ctx.prev;
      var closing = firstChar == ctx.type;
      if (ctx.type == "statement") return ctx.indented + (firstChar == "{" ? 0 : statementIndentUnit);
      else if (ctx.align) return ctx.column + (closing ? 0 : 1);
      else return ctx.indented + (closing ? 0 : indentUnit);
    },

    electricChars: "{}",
    blockCommentStart: "/*",
    blockCommentEnd: "*/",
    blockCommentContinue: " * ",
    lineComment: "//",
    fold: "brace"
  };
});

  function words(str) {
    var obj = {}, words = str.split(" ");
    for (var i = 0; i < words.length; ++i) obj[words[i]] = true;
    return obj;
  }

  var blockKeywords = "body catch class do else enum for foreach foreach_reverse if in interface mixin " +
                      "out scope struct switch try union unittest version while with";

  CodeMirror.defineMIME("text/x-d", {
    name: "d",
    keywords: words("abstract alias align asm assert auto break case cast cdouble cent cfloat const continue " +
                    "debug default delegate delete deprecated export extern final finally function goto immutable " +
                    "import inout invariant is lazy macro module new nothrow override package pragma private " +
                    "protected public pure ref return shared short static super synchronized template this " +
                    "throw typedef typeid typeof volatile __FILE__ __LINE__ __gshared __traits __vector __parameters " +
                    blockKeywords),
    blockKeywords: words(blockKeywords),
    builtin: words("bool byte char creal dchar double float idouble ifloat int ireal long real short ubyte " +
                   "ucent uint ulong ushort wchar wstring void size_t sizediff_t"),
    atoms: words("exit failure success true false null"),
    hooks: {
      "@": function(stream, _state) {
        stream.eatWhile(/[\w\$_]/);
        return "meta";
      }
    }
  });

});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/dart/dart.js":
/*!**********************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/dart/dart.js ***!
  \**********************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"), __webpack_require__(/*! ../clike/clike */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/clike/clike.js"));
  else {}
})(function(CodeMirror) {
  "use strict";

  var keywords = ("this super static final const abstract class extends external factory " +
    "implements mixin get native set typedef with enum throw rethrow " +
    "assert break case continue default in return new deferred async await covariant " +
    "try catch finally do else for if switch while import library export " +
    "part of show hide is as").split(" ");
  var blockKeywords = "try catch finally do else for if switch while".split(" ");
  var atoms = "true false null".split(" ");
  var builtins = "void bool num int double dynamic var String".split(" ");

  function set(words) {
    var obj = {};
    for (var i = 0; i < words.length; ++i) obj[words[i]] = true;
    return obj;
  }

  function pushInterpolationStack(state) {
    (state.interpolationStack || (state.interpolationStack = [])).push(state.tokenize);
  }

  function popInterpolationStack(state) {
    return (state.interpolationStack || (state.interpolationStack = [])).pop();
  }

  function sizeInterpolationStack(state) {
    return state.interpolationStack ? state.interpolationStack.length : 0;
  }

  CodeMirror.defineMIME("application/dart", {
    name: "clike",
    keywords: set(keywords),
    blockKeywords: set(blockKeywords),
    builtin: set(builtins),
    atoms: set(atoms),
    hooks: {
      "@": function(stream) {
        stream.eatWhile(/[\w\$_\.]/);
        return "meta";
      },

      // custom string handling to deal with triple-quoted strings and string interpolation
      "'": function(stream, state) {
        return tokenString("'", stream, state, false);
      },
      "\"": function(stream, state) {
        return tokenString("\"", stream, state, false);
      },
      "r": function(stream, state) {
        var peek = stream.peek();
        if (peek == "'" || peek == "\"") {
          return tokenString(stream.next(), stream, state, true);
        }
        return false;
      },

      "}": function(_stream, state) {
        // "}" is end of interpolation, if interpolation stack is non-empty
        if (sizeInterpolationStack(state) > 0) {
          state.tokenize = popInterpolationStack(state);
          return null;
        }
        return false;
      },

      "/": function(stream, state) {
        if (!stream.eat("*")) return false
        state.tokenize = tokenNestedComment(1)
        return state.tokenize(stream, state)
      }
    }
  });

  function tokenString(quote, stream, state, raw) {
    var tripleQuoted = false;
    if (stream.eat(quote)) {
      if (stream.eat(quote)) tripleQuoted = true;
      else return "string"; //empty string
    }
    function tokenStringHelper(stream, state) {
      var escaped = false;
      while (!stream.eol()) {
        if (!raw && !escaped && stream.peek() == "$") {
          pushInterpolationStack(state);
          state.tokenize = tokenInterpolation;
          return "string";
        }
        var next = stream.next();
        if (next == quote && !escaped && (!tripleQuoted || stream.match(quote + quote))) {
          state.tokenize = null;
          break;
        }
        escaped = !raw && !escaped && next == "\\";
      }
      return "string";
    }
    state.tokenize = tokenStringHelper;
    return tokenStringHelper(stream, state);
  }

  function tokenInterpolation(stream, state) {
    stream.eat("$");
    if (stream.eat("{")) {
      // let clike handle the content of ${...},
      // we take over again when "}" appears (see hooks).
      state.tokenize = null;
    } else {
      state.tokenize = tokenInterpolationIdentifier;
    }
    return null;
  }

  function tokenInterpolationIdentifier(stream, state) {
    stream.eatWhile(/[\w_]/);
    state.tokenize = popInterpolationStack(state);
    return "variable";
  }

  function tokenNestedComment(depth) {
    return function (stream, state) {
      var ch
      while (ch = stream.next()) {
        if (ch == "*" && stream.eat("/")) {
          if (depth == 1) {
            state.tokenize = null
            break
          } else {
            state.tokenize = tokenNestedComment(depth - 1)
            return state.tokenize(stream, state)
          }
        } else if (ch == "/" && stream.eat("*")) {
          state.tokenize = tokenNestedComment(depth + 1)
          return state.tokenize(stream, state)
        }
      }
      return "comment"
    }
  }

  CodeMirror.registerHelper("hintWords", "application/dart", keywords.concat(atoms).concat(builtins));

  // This is needed to make loading through meta.js work.
  CodeMirror.defineMode("dart", function(conf) {
    return CodeMirror.getMode(conf, "application/dart");
  }, "clike");
});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/diff/diff.js":
/*!**********************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/diff/diff.js ***!
  \**********************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"));
  else {}
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode("diff", function() {

  var TOKEN_NAMES = {
    '+': 'positive',
    '-': 'negative',
    '@': 'meta'
  };

  return {
    token: function(stream) {
      var tw_pos = stream.string.search(/[\t ]+?$/);

      if (!stream.sol() || tw_pos === 0) {
        stream.skipToEnd();
        return ("error " + (
          TOKEN_NAMES[stream.string.charAt(0)] || '')).replace(/ $/, '');
      }

      var token_name = TOKEN_NAMES[stream.peek()] || stream.skipToEnd();

      if (tw_pos === -1) {
        stream.skipToEnd();
      } else {
        stream.pos = tw_pos;
      }

      return token_name;
    }
  };
});

CodeMirror.defineMIME("text/x-diff", "diff");

});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/django/django.js":
/*!**************************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/django/django.js ***!
  \**************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"), __webpack_require__(/*! ../htmlmixed/htmlmixed */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/htmlmixed/htmlmixed.js"),
        __webpack_require__(/*! ../../addon/mode/overlay */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/addon/mode/overlay.js"));
  else {}
})(function(CodeMirror) {
  "use strict";

  CodeMirror.defineMode("django:inner", function() {
    var keywords = ["block", "endblock", "for", "endfor", "true", "false", "filter", "endfilter",
                    "loop", "none", "self", "super", "if", "elif", "endif", "as", "else", "import",
                    "with", "endwith", "without", "context", "ifequal", "endifequal", "ifnotequal",
                    "endifnotequal", "extends", "include", "load", "comment", "endcomment",
                    "empty", "url", "static", "trans", "blocktrans", "endblocktrans", "now",
                    "regroup", "lorem", "ifchanged", "endifchanged", "firstof", "debug", "cycle",
                    "csrf_token", "autoescape", "endautoescape", "spaceless", "endspaceless",
                    "ssi", "templatetag", "verbatim", "endverbatim", "widthratio"],
        filters = ["add", "addslashes", "capfirst", "center", "cut", "date",
                   "default", "default_if_none", "dictsort",
                   "dictsortreversed", "divisibleby", "escape", "escapejs",
                   "filesizeformat", "first", "floatformat", "force_escape",
                   "get_digit", "iriencode", "join", "last", "length",
                   "length_is", "linebreaks", "linebreaksbr", "linenumbers",
                   "ljust", "lower", "make_list", "phone2numeric", "pluralize",
                   "pprint", "random", "removetags", "rjust", "safe",
                   "safeseq", "slice", "slugify", "stringformat", "striptags",
                   "time", "timesince", "timeuntil", "title", "truncatechars",
                   "truncatechars_html", "truncatewords", "truncatewords_html",
                   "unordered_list", "upper", "urlencode", "urlize",
                   "urlizetrunc", "wordcount", "wordwrap", "yesno"],
        operators = ["==", "!=", "<", ">", "<=", ">="],
        wordOperators = ["in", "not", "or", "and"];

    keywords = new RegExp("^\\b(" + keywords.join("|") + ")\\b");
    filters = new RegExp("^\\b(" + filters.join("|") + ")\\b");
    operators = new RegExp("^\\b(" + operators.join("|") + ")\\b");
    wordOperators = new RegExp("^\\b(" + wordOperators.join("|") + ")\\b");

    // We have to return "null" instead of null, in order to avoid string
    // styling as the default, when using Django templates inside HTML
    // element attributes
    function tokenBase (stream, state) {
      // Attempt to identify a variable, template or comment tag respectively
      if (stream.match("{{")) {
        state.tokenize = inVariable;
        return "tag";
      } else if (stream.match("{%")) {
        state.tokenize = inTag;
        return "tag";
      } else if (stream.match("{#")) {
        state.tokenize = inComment;
        return "comment";
      }

      // Ignore completely any stream series that do not match the
      // Django template opening tags.
      while (stream.next() != null && !stream.match(/\{[{%#]/, false)) {}
      return null;
    }

    // A string can be included in either single or double quotes (this is
    // the delimiter). Mark everything as a string until the start delimiter
    // occurs again.
    function inString (delimiter, previousTokenizer) {
      return function (stream, state) {
        if (!state.escapeNext && stream.eat(delimiter)) {
          state.tokenize = previousTokenizer;
        } else {
          if (state.escapeNext) {
            state.escapeNext = false;
          }

          var ch = stream.next();

          // Take into account the backslash for escaping characters, such as
          // the string delimiter.
          if (ch == "\\") {
            state.escapeNext = true;
          }
        }

        return "string";
      };
    }

    // Apply Django template variable syntax highlighting
    function inVariable (stream, state) {
      // Attempt to match a dot that precedes a property
      if (state.waitDot) {
        state.waitDot = false;

        if (stream.peek() != ".") {
          return "null";
        }

        // Dot followed by a non-word character should be considered an error.
        if (stream.match(/\.\W+/)) {
          return "error";
        } else if (stream.eat(".")) {
          state.waitProperty = true;
          return "null";
        } else {
          throw Error ("Unexpected error while waiting for property.");
        }
      }

      // Attempt to match a pipe that precedes a filter
      if (state.waitPipe) {
        state.waitPipe = false;

        if (stream.peek() != "|") {
          return "null";
        }

        // Pipe followed by a non-word character should be considered an error.
        if (stream.match(/\.\W+/)) {
          return "error";
        } else if (stream.eat("|")) {
          state.waitFilter = true;
          return "null";
        } else {
          throw Error ("Unexpected error while waiting for filter.");
        }
      }

      // Highlight properties
      if (state.waitProperty) {
        state.waitProperty = false;
        if (stream.match(/\b(\w+)\b/)) {
          state.waitDot = true;  // A property can be followed by another property
          state.waitPipe = true;  // A property can be followed by a filter
          return "property";
        }
      }

      // Highlight filters
      if (state.waitFilter) {
          state.waitFilter = false;
        if (stream.match(filters)) {
          return "variable-2";
        }
      }

      // Ignore all white spaces
      if (stream.eatSpace()) {
        state.waitProperty = false;
        return "null";
      }

      // Identify numbers
      if (stream.match(/\b\d+(\.\d+)?\b/)) {
        return "number";
      }

      // Identify strings
      if (stream.match("'")) {
        state.tokenize = inString("'", state.tokenize);
        return "string";
      } else if (stream.match('"')) {
        state.tokenize = inString('"', state.tokenize);
        return "string";
      }

      // Attempt to find the variable
      if (stream.match(/\b(\w+)\b/) && !state.foundVariable) {
        state.waitDot = true;
        state.waitPipe = true;  // A property can be followed by a filter
        return "variable";
      }

      // If found closing tag reset
      if (stream.match("}}")) {
        state.waitProperty = null;
        state.waitFilter = null;
        state.waitDot = null;
        state.waitPipe = null;
        state.tokenize = tokenBase;
        return "tag";
      }

      // If nothing was found, advance to the next character
      stream.next();
      return "null";
    }

    function inTag (stream, state) {
      // Attempt to match a dot that precedes a property
      if (state.waitDot) {
        state.waitDot = false;

        if (stream.peek() != ".") {
          return "null";
        }

        // Dot followed by a non-word character should be considered an error.
        if (stream.match(/\.\W+/)) {
          return "error";
        } else if (stream.eat(".")) {
          state.waitProperty = true;
          return "null";
        } else {
          throw Error ("Unexpected error while waiting for property.");
        }
      }

      // Attempt to match a pipe that precedes a filter
      if (state.waitPipe) {
        state.waitPipe = false;

        if (stream.peek() != "|") {
          return "null";
        }

        // Pipe followed by a non-word character should be considered an error.
        if (stream.match(/\.\W+/)) {
          return "error";
        } else if (stream.eat("|")) {
          state.waitFilter = true;
          return "null";
        } else {
          throw Error ("Unexpected error while waiting for filter.");
        }
      }

      // Highlight properties
      if (state.waitProperty) {
        state.waitProperty = false;
        if (stream.match(/\b(\w+)\b/)) {
          state.waitDot = true;  // A property can be followed by another property
          state.waitPipe = true;  // A property can be followed by a filter
          return "property";
        }
      }

      // Highlight filters
      if (state.waitFilter) {
          state.waitFilter = false;
        if (stream.match(filters)) {
          return "variable-2";
        }
      }

      // Ignore all white spaces
      if (stream.eatSpace()) {
        state.waitProperty = false;
        return "null";
      }

      // Identify numbers
      if (stream.match(/\b\d+(\.\d+)?\b/)) {
        return "number";
      }

      // Identify strings
      if (stream.match("'")) {
        state.tokenize = inString("'", state.tokenize);
        return "string";
      } else if (stream.match('"')) {
        state.tokenize = inString('"', state.tokenize);
        return "string";
      }

      // Attempt to match an operator
      if (stream.match(operators)) {
        return "operator";
      }

      // Attempt to match a word operator
      if (stream.match(wordOperators)) {
        return "keyword";
      }

      // Attempt to match a keyword
      var keywordMatch = stream.match(keywords);
      if (keywordMatch) {
        if (keywordMatch[0] == "comment") {
          state.blockCommentTag = true;
        }
        return "keyword";
      }

      // Attempt to match a variable
      if (stream.match(/\b(\w+)\b/)) {
        state.waitDot = true;
        state.waitPipe = true;  // A property can be followed by a filter
        return "variable";
      }

      // If found closing tag reset
      if (stream.match("%}")) {
        state.waitProperty = null;
        state.waitFilter = null;
        state.waitDot = null;
        state.waitPipe = null;
        // If the tag that closes is a block comment tag, we want to mark the
        // following code as comment, until the tag closes.
        if (state.blockCommentTag) {
          state.blockCommentTag = false;  // Release the "lock"
          state.tokenize = inBlockComment;
        } else {
          state.tokenize = tokenBase;
        }
        return "tag";
      }

      // If nothing was found, advance to the next character
      stream.next();
      return "null";
    }

    // Mark everything as comment inside the tag and the tag itself.
    function inComment (stream, state) {
      if (stream.match(/^.*?#\}/)) state.tokenize = tokenBase
      else stream.skipToEnd()
      return "comment";
    }

    // Mark everything as a comment until the `blockcomment` tag closes.
    function inBlockComment (stream, state) {
      if (stream.match(/\{%\s*endcomment\s*%\}/, false)) {
        state.tokenize = inTag;
        stream.match("{%");
        return "tag";
      } else {
        stream.next();
        return "comment";
      }
    }

    return {
      startState: function () {
        return {tokenize: tokenBase};
      },
      token: function (stream, state) {
        return state.tokenize(stream, state);
      },
      blockCommentStart: "{% comment %}",
      blockCommentEnd: "{% endcomment %}"
    };
  });

  CodeMirror.defineMode("django", function(config) {
    var htmlBase = CodeMirror.getMode(config, "text/html");
    var djangoInner = CodeMirror.getMode(config, "django:inner");
    return CodeMirror.overlayMode(htmlBase, djangoInner);
  });

  CodeMirror.defineMIME("text/x-django", "django");
});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/dockerfile/dockerfile.js":
/*!**********************************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/dockerfile/dockerfile.js ***!
  \**********************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"), __webpack_require__(/*! ../../addon/mode/simple */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/addon/mode/simple.js"));
  else {}
})(function(CodeMirror) {
  "use strict";

  var from = "from";
  var fromRegex = new RegExp("^(\\s*)\\b(" + from + ")\\b", "i");

  var shells = ["run", "cmd", "entrypoint", "shell"];
  var shellsAsArrayRegex = new RegExp("^(\\s*)(" + shells.join('|') + ")(\\s+\\[)", "i");

  var expose = "expose";
  var exposeRegex = new RegExp("^(\\s*)(" + expose + ")(\\s+)", "i");

  var others = [
    "arg", "from", "maintainer", "label", "env",
    "add", "copy", "volume", "user",
    "workdir", "onbuild", "stopsignal", "healthcheck", "shell"
  ];

  // Collect all Dockerfile directives
  var instructions = [from, expose].concat(shells).concat(others),
      instructionRegex = "(" + instructions.join('|') + ")",
      instructionOnlyLine = new RegExp("^(\\s*)" + instructionRegex + "(\\s*)(#.*)?$", "i"),
      instructionWithArguments = new RegExp("^(\\s*)" + instructionRegex + "(\\s+)", "i");

  CodeMirror.defineSimpleMode("dockerfile", {
    start: [
      // Block comment: This is a line starting with a comment
      {
        regex: /^\s*#.*$/,
        sol: true,
        token: "comment"
      },
      {
        regex: fromRegex,
        token: [null, "keyword"],
        sol: true,
        next: "from"
      },
      // Highlight an instruction without any arguments (for convenience)
      {
        regex: instructionOnlyLine,
        token: [null, "keyword", null, "error"],
        sol: true
      },
      {
        regex: shellsAsArrayRegex,
        token: [null, "keyword", null],
        sol: true,
        next: "array"
      },
      {
        regex: exposeRegex,
        token: [null, "keyword", null],
        sol: true,
        next: "expose"
      },
      // Highlight an instruction followed by arguments
      {
        regex: instructionWithArguments,
        token: [null, "keyword", null],
        sol: true,
        next: "arguments"
      },
      {
        regex: /./,
        token: null
      }
    ],
    from: [
      {
        regex: /\s*$/,
        token: null,
        next: "start"
      },
      {
        // Line comment without instruction arguments is an error
        regex: /(\s*)(#.*)$/,
        token: [null, "error"],
        next: "start"
      },
      {
        regex: /(\s*\S+\s+)(as)/i,
        token: [null, "keyword"],
        next: "start"
      },
      // Fail safe return to start
      {
        token: null,
        next: "start"
      }
    ],
    single: [
      {
        regex: /(?:[^\\']|\\.)/,
        token: "string"
      },
      {
        regex: /'/,
        token: "string",
        pop: true
      }
    ],
    double: [
      {
        regex: /(?:[^\\"]|\\.)/,
        token: "string"
      },
      {
        regex: /"/,
        token: "string",
        pop: true
      }
    ],
    array: [
      {
        regex: /\]/,
        token: null,
        next: "start"
      },
      {
        regex: /"(?:[^\\"]|\\.)*"?/,
        token: "string"
      }
    ],
    expose: [
      {
        regex: /\d+$/,
        token: "number",
        next: "start"
      },
      {
        regex: /[^\d]+$/,
        token: null,
        next: "start"
      },
      {
        regex: /\d+/,
        token: "number"
      },
      {
        regex: /[^\d]+/,
        token: null
      },
      // Fail safe return to start
      {
        token: null,
        next: "start"
      }
    ],
    arguments: [
      {
        regex: /^\s*#.*$/,
        sol: true,
        token: "comment"
      },
      {
        regex: /"(?:[^\\"]|\\.)*"?$/,
        token: "string",
        next: "start"
      },
      {
        regex: /"/,
        token: "string",
        push: "double"
      },
      {
        regex: /'(?:[^\\']|\\.)*'?$/,
        token: "string",
        next: "start"
      },
      {
        regex: /'/,
        token: "string",
        push: "single"
      },
      {
        regex: /[^#"']+[\\`]$/,
        token: null
      },
      {
        regex: /[^#"']+$/,
        token: null,
        next: "start"
      },
      {
        regex: /[^#"']+/,
        token: null
      },
      // Fail safe return to start
      {
        token: null,
        next: "start"
      }
    ],
    meta: {
      lineComment: "#"
    }
  });

  CodeMirror.defineMIME("text/x-dockerfile", "dockerfile");
});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/dtd/dtd.js":
/*!********************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/dtd/dtd.js ***!
  \********************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

/*
  DTD mode
  Ported to CodeMirror by Peter Kroon <plakroon@gmail.com>
  Report bugs/issues here: https://github.com/codemirror/CodeMirror/issues
  GitHub: @peterkroon
*/

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"));
  else {}
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode("dtd", function(config) {
  var indentUnit = config.indentUnit, type;
  function ret(style, tp) {type = tp; return style;}

  function tokenBase(stream, state) {
    var ch = stream.next();

    if (ch == "<" && stream.eat("!") ) {
      if (stream.eatWhile(/[\-]/)) {
        state.tokenize = tokenSGMLComment;
        return tokenSGMLComment(stream, state);
      } else if (stream.eatWhile(/[\w]/)) return ret("keyword", "doindent");
    } else if (ch == "<" && stream.eat("?")) { //xml declaration
      state.tokenize = inBlock("meta", "?>");
      return ret("meta", ch);
    } else if (ch == "#" && stream.eatWhile(/[\w]/)) return ret("atom", "tag");
    else if (ch == "|") return ret("keyword", "seperator");
    else if (ch.match(/[\(\)\[\]\-\.,\+\?>]/)) return ret(null, ch);//if(ch === ">") return ret(null, "endtag"); else
    else if (ch.match(/[\[\]]/)) return ret("rule", ch);
    else if (ch == "\"" || ch == "'") {
      state.tokenize = tokenString(ch);
      return state.tokenize(stream, state);
    } else if (stream.eatWhile(/[a-zA-Z\?\+\d]/)) {
      var sc = stream.current();
      if( sc.substr(sc.length-1,sc.length).match(/\?|\+/) !== null )stream.backUp(1);
      return ret("tag", "tag");
    } else if (ch == "%" || ch == "*" ) return ret("number", "number");
    else {
      stream.eatWhile(/[\w\\\-_%.{,]/);
      return ret(null, null);
    }
  }

  function tokenSGMLComment(stream, state) {
    var dashes = 0, ch;
    while ((ch = stream.next()) != null) {
      if (dashes >= 2 && ch == ">") {
        state.tokenize = tokenBase;
        break;
      }
      dashes = (ch == "-") ? dashes + 1 : 0;
    }
    return ret("comment", "comment");
  }

  function tokenString(quote) {
    return function(stream, state) {
      var escaped = false, ch;
      while ((ch = stream.next()) != null) {
        if (ch == quote && !escaped) {
          state.tokenize = tokenBase;
          break;
        }
        escaped = !escaped && ch == "\\";
      }
      return ret("string", "tag");
    };
  }

  function inBlock(style, terminator) {
    return function(stream, state) {
      while (!stream.eol()) {
        if (stream.match(terminator)) {
          state.tokenize = tokenBase;
          break;
        }
        stream.next();
      }
      return style;
    };
  }

  return {
    startState: function(base) {
      return {tokenize: tokenBase,
              baseIndent: base || 0,
              stack: []};
    },

    token: function(stream, state) {
      if (stream.eatSpace()) return null;
      var style = state.tokenize(stream, state);

      var context = state.stack[state.stack.length-1];
      if (stream.current() == "[" || type === "doindent" || type == "[") state.stack.push("rule");
      else if (type === "endtag") state.stack[state.stack.length-1] = "endtag";
      else if (stream.current() == "]" || type == "]" || (type == ">" && context == "rule")) state.stack.pop();
      else if (type == "[") state.stack.push("[");
      return style;
    },

    indent: function(state, textAfter) {
      var n = state.stack.length;

      if( textAfter.match(/\]\s+|\]/) )n=n-1;
      else if(textAfter.substr(textAfter.length-1, textAfter.length) === ">"){
        if(textAfter.substr(0,1) === "<") {}
        else if( type == "doindent" && textAfter.length > 1 ) {}
        else if( type == "doindent")n--;
        else if( type == ">" && textAfter.length > 1) {}
        else if( type == "tag" && textAfter !== ">") {}
        else if( type == "tag" && state.stack[state.stack.length-1] == "rule")n--;
        else if( type == "tag")n++;
        else if( textAfter === ">" && state.stack[state.stack.length-1] == "rule" && type === ">")n--;
        else if( textAfter === ">" && state.stack[state.stack.length-1] == "rule") {}
        else if( textAfter.substr(0,1) !== "<" && textAfter.substr(0,1) === ">" )n=n-1;
        else if( textAfter === ">") {}
        else n=n-1;
        //over rule them all
        if(type == null || type == "]")n--;
      }

      return state.baseIndent + n * indentUnit;
    },

    electricChars: "]>"
  };
});

CodeMirror.defineMIME("application/xml-dtd", "dtd");

});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/dylan/dylan.js":
/*!************************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/dylan/dylan.js ***!
  \************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"));
  else {}
})(function(CodeMirror) {
"use strict";

function forEach(arr, f) {
  for (var i = 0; i < arr.length; i++) f(arr[i], i)
}
function some(arr, f) {
  for (var i = 0; i < arr.length; i++) if (f(arr[i], i)) return true
  return false
}

CodeMirror.defineMode("dylan", function(_config) {
  // Words
  var words = {
    // Words that introduce unnamed definitions like "define interface"
    unnamedDefinition: ["interface"],

    // Words that introduce simple named definitions like "define library"
    namedDefinition: ["module", "library", "macro",
                      "C-struct", "C-union",
                      "C-function", "C-callable-wrapper"
                     ],

    // Words that introduce type definitions like "define class".
    // These are also parameterized like "define method" and are
    // appended to otherParameterizedDefinitionWords
    typeParameterizedDefinition: ["class", "C-subtype", "C-mapped-subtype"],

    // Words that introduce trickier definitions like "define method".
    // These require special definitions to be added to startExpressions
    otherParameterizedDefinition: ["method", "function",
                                   "C-variable", "C-address"
                                  ],

    // Words that introduce module constant definitions.
    // These must also be simple definitions and are
    // appended to otherSimpleDefinitionWords
    constantSimpleDefinition: ["constant"],

    // Words that introduce module variable definitions.
    // These must also be simple definitions and are
    // appended to otherSimpleDefinitionWords
    variableSimpleDefinition: ["variable"],

    // Other words that introduce simple definitions
    // (without implicit bodies).
    otherSimpleDefinition: ["generic", "domain",
                            "C-pointer-type",
                            "table"
                           ],

    // Words that begin statements with implicit bodies.
    statement: ["if", "block", "begin", "method", "case",
                "for", "select", "when", "unless", "until",
                "while", "iterate", "profiling", "dynamic-bind"
               ],

    // Patterns that act as separators in compound statements.
    // This may include any general pattern that must be indented
    // specially.
    separator: ["finally", "exception", "cleanup", "else",
                "elseif", "afterwards"
               ],

    // Keywords that do not require special indentation handling,
    // but which should be highlighted
    other: ["above", "below", "by", "from", "handler", "in",
            "instance", "let", "local", "otherwise", "slot",
            "subclass", "then", "to", "keyed-by", "virtual"
           ],

    // Condition signaling function calls
    signalingCalls: ["signal", "error", "cerror",
                     "break", "check-type", "abort"
                    ]
  };

  words["otherDefinition"] =
    words["unnamedDefinition"]
    .concat(words["namedDefinition"])
    .concat(words["otherParameterizedDefinition"]);

  words["definition"] =
    words["typeParameterizedDefinition"]
    .concat(words["otherDefinition"]);

  words["parameterizedDefinition"] =
    words["typeParameterizedDefinition"]
    .concat(words["otherParameterizedDefinition"]);

  words["simpleDefinition"] =
    words["constantSimpleDefinition"]
    .concat(words["variableSimpleDefinition"])
    .concat(words["otherSimpleDefinition"]);

  words["keyword"] =
    words["statement"]
    .concat(words["separator"])
    .concat(words["other"]);

  // Patterns
  var symbolPattern = "[-_a-zA-Z?!*@<>$%]+";
  var symbol = new RegExp("^" + symbolPattern);
  var patterns = {
    // Symbols with special syntax
    symbolKeyword: symbolPattern + ":",
    symbolClass: "<" + symbolPattern + ">",
    symbolGlobal: "\\*" + symbolPattern + "\\*",
    symbolConstant: "\\$" + symbolPattern
  };
  var patternStyles = {
    symbolKeyword: "atom",
    symbolClass: "tag",
    symbolGlobal: "variable-2",
    symbolConstant: "variable-3"
  };

  // Compile all patterns to regular expressions
  for (var patternName in patterns)
    if (patterns.hasOwnProperty(patternName))
      patterns[patternName] = new RegExp("^" + patterns[patternName]);

  // Names beginning "with-" and "without-" are commonly
  // used as statement macro
  patterns["keyword"] = [/^with(?:out)?-[-_a-zA-Z?!*@<>$%]+/];

  var styles = {};
  styles["keyword"] = "keyword";
  styles["definition"] = "def";
  styles["simpleDefinition"] = "def";
  styles["signalingCalls"] = "builtin";

  // protected words lookup table
  var wordLookup = {};
  var styleLookup = {};

  forEach([
    "keyword",
    "definition",
    "simpleDefinition",
    "signalingCalls"
  ], function(type) {
    forEach(words[type], function(word) {
      wordLookup[word] = type;
      styleLookup[word] = styles[type];
    });
  });


  function chain(stream, state, f) {
    state.tokenize = f;
    return f(stream, state);
  }

  function tokenBase(stream, state) {
    // String
    var ch = stream.peek();
    if (ch == "'" || ch == '"') {
      stream.next();
      return chain(stream, state, tokenString(ch, "string"));
    }
    // Comment
    else if (ch == "/") {
      stream.next();
      if (stream.eat("*")) {
        return chain(stream, state, tokenComment);
      } else if (stream.eat("/")) {
        stream.skipToEnd();
        return "comment";
      }
      stream.backUp(1);
    }
    // Decimal
    else if (/[+\-\d\.]/.test(ch)) {
      if (stream.match(/^[+-]?[0-9]*\.[0-9]*([esdx][+-]?[0-9]+)?/i) ||
          stream.match(/^[+-]?[0-9]+([esdx][+-]?[0-9]+)/i) ||
          stream.match(/^[+-]?\d+/)) {
        return "number";
      }
    }
    // Hash
    else if (ch == "#") {
      stream.next();
      // Symbol with string syntax
      ch = stream.peek();
      if (ch == '"') {
        stream.next();
        return chain(stream, state, tokenString('"', "string"));
      }
      // Binary number
      else if (ch == "b") {
        stream.next();
        stream.eatWhile(/[01]/);
        return "number";
      }
      // Hex number
      else if (ch == "x") {
        stream.next();
        stream.eatWhile(/[\da-f]/i);
        return "number";
      }
      // Octal number
      else if (ch == "o") {
        stream.next();
        stream.eatWhile(/[0-7]/);
        return "number";
      }
      // Token concatenation in macros
      else if (ch == '#') {
        stream.next();
        return "punctuation";
      }
      // Sequence literals
      else if ((ch == '[') || (ch == '(')) {
        stream.next();
        return "bracket";
      // Hash symbol
      } else if (stream.match(/f|t|all-keys|include|key|next|rest/i)) {
        return "atom";
      } else {
        stream.eatWhile(/[-a-zA-Z]/);
        return "error";
      }
    } else if (ch == "~") {
      stream.next();
      ch = stream.peek();
      if (ch == "=") {
        stream.next();
        ch = stream.peek();
        if (ch == "=") {
          stream.next();
          return "operator";
        }
        return "operator";
      }
      return "operator";
    } else if (ch == ":") {
      stream.next();
      ch = stream.peek();
      if (ch == "=") {
        stream.next();
        return "operator";
      } else if (ch == ":") {
        stream.next();
        return "punctuation";
      }
    } else if ("[](){}".indexOf(ch) != -1) {
      stream.next();
      return "bracket";
    } else if (".,".indexOf(ch) != -1) {
      stream.next();
      return "punctuation";
    } else if (stream.match("end")) {
      return "keyword";
    }
    for (var name in patterns) {
      if (patterns.hasOwnProperty(name)) {
        var pattern = patterns[name];
        if ((pattern instanceof Array && some(pattern, function(p) {
          return stream.match(p);
        })) || stream.match(pattern))
          return patternStyles[name];
      }
    }
    if (/[+\-*\/^=<>&|]/.test(ch)) {
      stream.next();
      return "operator";
    }
    if (stream.match("define")) {
      return "def";
    } else {
      stream.eatWhile(/[\w\-]/);
      // Keyword
      if (wordLookup.hasOwnProperty(stream.current())) {
        return styleLookup[stream.current()];
      } else if (stream.current().match(symbol)) {
        return "variable";
      } else {
        stream.next();
        return "variable-2";
      }
    }
  }

  function tokenComment(stream, state) {
    var maybeEnd = false, maybeNested = false, nestedCount = 0, ch;
    while ((ch = stream.next())) {
      if (ch == "/" && maybeEnd) {
        if (nestedCount > 0) {
          nestedCount--;
        } else {
          state.tokenize = tokenBase;
          break;
        }
      } else if (ch == "*" && maybeNested) {
        nestedCount++;
      }
      maybeEnd = (ch == "*");
      maybeNested = (ch == "/");
    }
    return "comment";
  }

  function tokenString(quote, style) {
    return function(stream, state) {
      var escaped = false, next, end = false;
      while ((next = stream.next()) != null) {
        if (next == quote && !escaped) {
          end = true;
          break;
        }
        escaped = !escaped && next == "\\";
      }
      if (end || !escaped) {
        state.tokenize = tokenBase;
      }
      return style;
    };
  }

  // Interface
  return {
    startState: function() {
      return {
        tokenize: tokenBase,
        currentIndent: 0
      };
    },
    token: function(stream, state) {
      if (stream.eatSpace())
        return null;
      var style = state.tokenize(stream, state);
      return style;
    },
    blockCommentStart: "/*",
    blockCommentEnd: "*/"
  };
});

CodeMirror.defineMIME("text/x-dylan", "dylan");

});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/ebnf/ebnf.js":
/*!**********************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/ebnf/ebnf.js ***!
  \**********************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"));
  else {}
})(function(CodeMirror) {
  "use strict";

  CodeMirror.defineMode("ebnf", function (config) {
    var commentType = {slash: 0, parenthesis: 1};
    var stateType = {comment: 0, _string: 1, characterClass: 2};
    var bracesMode = null;

    if (config.bracesMode)
      bracesMode = CodeMirror.getMode(config, config.bracesMode);

    return {
      startState: function () {
        return {
          stringType: null,
          commentType: null,
          braced: 0,
          lhs: true,
          localState: null,
          stack: [],
          inDefinition: false
        };
      },
      token: function (stream, state) {
        if (!stream) return;

        //check for state changes
        if (state.stack.length === 0) {
          //strings
          if ((stream.peek() == '"') || (stream.peek() == "'")) {
            state.stringType = stream.peek();
            stream.next(); // Skip quote
            state.stack.unshift(stateType._string);
          } else if (stream.match(/^\/\*/)) { //comments starting with /*
            state.stack.unshift(stateType.comment);
            state.commentType = commentType.slash;
          } else if (stream.match(/^\(\*/)) { //comments starting with (*
            state.stack.unshift(stateType.comment);
            state.commentType = commentType.parenthesis;
          }
        }

        //return state
        //stack has
        switch (state.stack[0]) {
        case stateType._string:
          while (state.stack[0] === stateType._string && !stream.eol()) {
            if (stream.peek() === state.stringType) {
              stream.next(); // Skip quote
              state.stack.shift(); // Clear flag
            } else if (stream.peek() === "\\") {
              stream.next();
              stream.next();
            } else {
              stream.match(/^.[^\\\"\']*/);
            }
          }
          return state.lhs ? "property string" : "string"; // Token style

        case stateType.comment:
          while (state.stack[0] === stateType.comment && !stream.eol()) {
            if (state.commentType === commentType.slash && stream.match(/\*\//)) {
              state.stack.shift(); // Clear flag
              state.commentType = null;
            } else if (state.commentType === commentType.parenthesis && stream.match(/\*\)/)) {
              state.stack.shift(); // Clear flag
              state.commentType = null;
            } else {
              stream.match(/^.[^\*]*/);
            }
          }
          return "comment";

        case stateType.characterClass:
          while (state.stack[0] === stateType.characterClass && !stream.eol()) {
            if (!(stream.match(/^[^\]\\]+/) || stream.match(/^\\./))) {
              state.stack.shift();
            }
          }
          return "operator";
        }

        var peek = stream.peek();

        if (bracesMode !== null && (state.braced || peek === "{")) {
          if (state.localState === null)
            state.localState = CodeMirror.startState(bracesMode);

          var token = bracesMode.token(stream, state.localState),
          text = stream.current();

          if (!token) {
            for (var i = 0; i < text.length; i++) {
              if (text[i] === "{") {
                if (state.braced === 0) {
                  token = "matchingbracket";
                }
                state.braced++;
              } else if (text[i] === "}") {
                state.braced--;
                if (state.braced === 0) {
                  token = "matchingbracket";
                }
              }
            }
          }
          return token;
        }

        //no stack
        switch (peek) {
        case "[":
          stream.next();
          state.stack.unshift(stateType.characterClass);
          return "bracket";
        case ":":
        case "|":
        case ";":
          stream.next();
          return "operator";
        case "%":
          if (stream.match("%%")) {
            return "header";
          } else if (stream.match(/[%][A-Za-z]+/)) {
            return "keyword";
          } else if (stream.match(/[%][}]/)) {
            return "matchingbracket";
          }
          break;
        case "/":
          if (stream.match(/[\/][A-Za-z]+/)) {
          return "keyword";
        }
        case "\\":
          if (stream.match(/[\][a-z]+/)) {
            return "string-2";
          }
        case ".":
          if (stream.match(".")) {
            return "atom";
          }
        case "*":
        case "-":
        case "+":
        case "^":
          if (stream.match(peek)) {
            return "atom";
          }
        case "$":
          if (stream.match("$$")) {
            return "builtin";
          } else if (stream.match(/[$][0-9]+/)) {
            return "variable-3";
          }
        case "<":
          if (stream.match(/<<[a-zA-Z_]+>>/)) {
            return "builtin";
          }
        }

        if (stream.match(/^\/\//)) {
          stream.skipToEnd();
          return "comment";
        } else if (stream.match(/return/)) {
          return "operator";
        } else if (stream.match(/^[a-zA-Z_][a-zA-Z0-9_]*/)) {
          if (stream.match(/(?=[\(.])/)) {
            return "variable";
          } else if (stream.match(/(?=[\s\n]*[:=])/)) {
            return "def";
          }
          return "variable-2";
        } else if (["[", "]", "(", ")"].indexOf(stream.peek()) != -1) {
          stream.next();
          return "bracket";
        } else if (!stream.eatSpace()) {
          stream.next();
        }
        return null;
      }
    };
  });

  CodeMirror.defineMIME("text/x-ebnf", "ebnf");
});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/ecl/ecl.js":
/*!********************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/ecl/ecl.js ***!
  \********************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"));
  else {}
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode("ecl", function(config) {

  function words(str) {
    var obj = {}, words = str.split(" ");
    for (var i = 0; i < words.length; ++i) obj[words[i]] = true;
    return obj;
  }

  function metaHook(stream, state) {
    if (!state.startOfLine) return false;
    stream.skipToEnd();
    return "meta";
  }

  var indentUnit = config.indentUnit;
  var keyword = words("abs acos allnodes ascii asin asstring atan atan2 ave case choose choosen choosesets clustersize combine correlation cos cosh count covariance cron dataset dedup define denormalize distribute distributed distribution ebcdic enth error evaluate event eventextra eventname exists exp failcode failmessage fetch fromunicode getisvalid global graph group hash hash32 hash64 hashcrc hashmd5 having if index intformat isvalid iterate join keyunicode length library limit ln local log loop map matched matchlength matchposition matchtext matchunicode max merge mergejoin min nolocal nonempty normalize parse pipe power preload process project pull random range rank ranked realformat recordof regexfind regexreplace regroup rejected rollup round roundup row rowdiff sample set sin sinh sizeof soapcall sort sorted sqrt stepped stored sum table tan tanh thisnode topn tounicode transfer trim truncate typeof ungroup unicodeorder variance which workunit xmldecode xmlencode xmltext xmlunicode");
  var variable = words("apply assert build buildindex evaluate fail keydiff keypatch loadxml nothor notify output parallel sequential soapcall wait");
  var variable_2 = words("__compressed__ all and any as atmost before beginc++ best between case const counter csv descend encrypt end endc++ endmacro except exclusive expire export extend false few first flat from full function group header heading hole ifblock import in interface joined keep keyed last left limit load local locale lookup macro many maxcount maxlength min skew module named nocase noroot noscan nosort not of only opt or outer overwrite packed partition penalty physicallength pipe quote record relationship repeat return right scan self separator service shared skew skip sql store terminator thor threshold token transform trim true type unicodeorder unsorted validate virtual whole wild within xml xpath");
  var variable_3 = words("ascii big_endian boolean data decimal ebcdic integer pattern qstring real record rule set of string token udecimal unicode unsigned varstring varunicode");
  var builtin = words("checkpoint deprecated failcode failmessage failure global independent onwarning persist priority recovery stored success wait when");
  var blockKeywords = words("catch class do else finally for if switch try while");
  var atoms = words("true false null");
  var hooks = {"#": metaHook};
  var isOperatorChar = /[+\-*&%=<>!?|\/]/;

  var curPunc;

  function tokenBase(stream, state) {
    var ch = stream.next();
    if (hooks[ch]) {
      var result = hooks[ch](stream, state);
      if (result !== false) return result;
    }
    if (ch == '"' || ch == "'") {
      state.tokenize = tokenString(ch);
      return state.tokenize(stream, state);
    }
    if (/[\[\]{}\(\),;\:\.]/.test(ch)) {
      curPunc = ch;
      return null;
    }
    if (/\d/.test(ch)) {
      stream.eatWhile(/[\w\.]/);
      return "number";
    }
    if (ch == "/") {
      if (stream.eat("*")) {
        state.tokenize = tokenComment;
        return tokenComment(stream, state);
      }
      if (stream.eat("/")) {
        stream.skipToEnd();
        return "comment";
      }
    }
    if (isOperatorChar.test(ch)) {
      stream.eatWhile(isOperatorChar);
      return "operator";
    }
    stream.eatWhile(/[\w\$_]/);
    var cur = stream.current().toLowerCase();
    if (keyword.propertyIsEnumerable(cur)) {
      if (blockKeywords.propertyIsEnumerable(cur)) curPunc = "newstatement";
      return "keyword";
    } else if (variable.propertyIsEnumerable(cur)) {
      if (blockKeywords.propertyIsEnumerable(cur)) curPunc = "newstatement";
      return "variable";
    } else if (variable_2.propertyIsEnumerable(cur)) {
      if (blockKeywords.propertyIsEnumerable(cur)) curPunc = "newstatement";
      return "variable-2";
    } else if (variable_3.propertyIsEnumerable(cur)) {
      if (blockKeywords.propertyIsEnumerable(cur)) curPunc = "newstatement";
      return "variable-3";
    } else if (builtin.propertyIsEnumerable(cur)) {
      if (blockKeywords.propertyIsEnumerable(cur)) curPunc = "newstatement";
      return "builtin";
    } else { //Data types are of from KEYWORD##
                var i = cur.length - 1;
                while(i >= 0 && (!isNaN(cur[i]) || cur[i] == '_'))
                        --i;

                if (i > 0) {
                        var cur2 = cur.substr(0, i + 1);
                if (variable_3.propertyIsEnumerable(cur2)) {
                        if (blockKeywords.propertyIsEnumerable(cur2)) curPunc = "newstatement";
                        return "variable-3";
                }
            }
    }
    if (atoms.propertyIsEnumerable(cur)) return "atom";
    return null;
  }

  function tokenString(quote) {
    return function(stream, state) {
      var escaped = false, next, end = false;
      while ((next = stream.next()) != null) {
        if (next == quote && !escaped) {end = true; break;}
        escaped = !escaped && next == "\\";
      }
      if (end || !escaped)
        state.tokenize = tokenBase;
      return "string";
    };
  }

  function tokenComment(stream, state) {
    var maybeEnd = false, ch;
    while (ch = stream.next()) {
      if (ch == "/" && maybeEnd) {
        state.tokenize = tokenBase;
        break;
      }
      maybeEnd = (ch == "*");
    }
    return "comment";
  }

  function Context(indented, column, type, align, prev) {
    this.indented = indented;
    this.column = column;
    this.type = type;
    this.align = align;
    this.prev = prev;
  }
  function pushContext(state, col, type) {
    return state.context = new Context(state.indented, col, type, null, state.context);
  }
  function popContext(state) {
    var t = state.context.type;
    if (t == ")" || t == "]" || t == "}")
      state.indented = state.context.indented;
    return state.context = state.context.prev;
  }

  // Interface

  return {
    startState: function(basecolumn) {
      return {
        tokenize: null,
        context: new Context((basecolumn || 0) - indentUnit, 0, "top", false),
        indented: 0,
        startOfLine: true
      };
    },

    token: function(stream, state) {
      var ctx = state.context;
      if (stream.sol()) {
        if (ctx.align == null) ctx.align = false;
        state.indented = stream.indentation();
        state.startOfLine = true;
      }
      if (stream.eatSpace()) return null;
      curPunc = null;
      var style = (state.tokenize || tokenBase)(stream, state);
      if (style == "comment" || style == "meta") return style;
      if (ctx.align == null) ctx.align = true;

      if ((curPunc == ";" || curPunc == ":") && ctx.type == "statement") popContext(state);
      else if (curPunc == "{") pushContext(state, stream.column(), "}");
      else if (curPunc == "[") pushContext(state, stream.column(), "]");
      else if (curPunc == "(") pushContext(state, stream.column(), ")");
      else if (curPunc == "}") {
        while (ctx.type == "statement") ctx = popContext(state);
        if (ctx.type == "}") ctx = popContext(state);
        while (ctx.type == "statement") ctx = popContext(state);
      }
      else if (curPunc == ctx.type) popContext(state);
      else if (ctx.type == "}" || ctx.type == "top" || (ctx.type == "statement" && curPunc == "newstatement"))
        pushContext(state, stream.column(), "statement");
      state.startOfLine = false;
      return style;
    },

    indent: function(state, textAfter) {
      if (state.tokenize != tokenBase && state.tokenize != null) return 0;
      var ctx = state.context, firstChar = textAfter && textAfter.charAt(0);
      if (ctx.type == "statement" && firstChar == "}") ctx = ctx.prev;
      var closing = firstChar == ctx.type;
      if (ctx.type == "statement") return ctx.indented + (firstChar == "{" ? 0 : indentUnit);
      else if (ctx.align) return ctx.column + (closing ? 0 : 1);
      else return ctx.indented + (closing ? 0 : indentUnit);
    },

    electricChars: "{}"
  };
});

CodeMirror.defineMIME("text/x-ecl", "ecl");

});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/eiffel/eiffel.js":
/*!**************************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/eiffel/eiffel.js ***!
  \**************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"));
  else {}
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode("eiffel", function() {
  function wordObj(words) {
    var o = {};
    for (var i = 0, e = words.length; i < e; ++i) o[words[i]] = true;
    return o;
  }
  var keywords = wordObj([
    'note',
    'across',
    'when',
    'variant',
    'until',
    'unique',
    'undefine',
    'then',
    'strip',
    'select',
    'retry',
    'rescue',
    'require',
    'rename',
    'reference',
    'redefine',
    'prefix',
    'once',
    'old',
    'obsolete',
    'loop',
    'local',
    'like',
    'is',
    'inspect',
    'infix',
    'include',
    'if',
    'frozen',
    'from',
    'external',
    'export',
    'ensure',
    'end',
    'elseif',
    'else',
    'do',
    'creation',
    'create',
    'check',
    'alias',
    'agent',
    'separate',
    'invariant',
    'inherit',
    'indexing',
    'feature',
    'expanded',
    'deferred',
    'class',
    'Void',
    'True',
    'Result',
    'Precursor',
    'False',
    'Current',
    'create',
    'attached',
    'detachable',
    'as',
    'and',
    'implies',
    'not',
    'or'
  ]);
  var operators = wordObj([":=", "and then","and", "or","<<",">>"]);

  function chain(newtok, stream, state) {
    state.tokenize.push(newtok);
    return newtok(stream, state);
  }

  function tokenBase(stream, state) {
    if (stream.eatSpace()) return null;
    var ch = stream.next();
    if (ch == '"'||ch == "'") {
      return chain(readQuoted(ch, "string"), stream, state);
    } else if (ch == "-"&&stream.eat("-")) {
      stream.skipToEnd();
      return "comment";
    } else if (ch == ":"&&stream.eat("=")) {
      return "operator";
    } else if (/[0-9]/.test(ch)) {
      stream.eatWhile(/[xXbBCc0-9\.]/);
      stream.eat(/[\?\!]/);
      return "ident";
    } else if (/[a-zA-Z_0-9]/.test(ch)) {
      stream.eatWhile(/[a-zA-Z_0-9]/);
      stream.eat(/[\?\!]/);
      return "ident";
    } else if (/[=+\-\/*^%<>~]/.test(ch)) {
      stream.eatWhile(/[=+\-\/*^%<>~]/);
      return "operator";
    } else {
      return null;
    }
  }

  function readQuoted(quote, style,  unescaped) {
    return function(stream, state) {
      var escaped = false, ch;
      while ((ch = stream.next()) != null) {
        if (ch == quote && (unescaped || !escaped)) {
          state.tokenize.pop();
          break;
        }
        escaped = !escaped && ch == "%";
      }
      return style;
    };
  }

  return {
    startState: function() {
      return {tokenize: [tokenBase]};
    },

    token: function(stream, state) {
      var style = state.tokenize[state.tokenize.length-1](stream, state);
      if (style == "ident") {
        var word = stream.current();
        style = keywords.propertyIsEnumerable(stream.current()) ? "keyword"
          : operators.propertyIsEnumerable(stream.current()) ? "operator"
          : /^[A-Z][A-Z_0-9]*$/g.test(word) ? "tag"
          : /^0[bB][0-1]+$/g.test(word) ? "number"
          : /^0[cC][0-7]+$/g.test(word) ? "number"
          : /^0[xX][a-fA-F0-9]+$/g.test(word) ? "number"
          : /^([0-9]+\.[0-9]*)|([0-9]*\.[0-9]+)$/g.test(word) ? "number"
          : /^[0-9]+$/g.test(word) ? "number"
          : "variable";
      }
      return style;
    },
    lineComment: "--"
  };
});

CodeMirror.defineMIME("text/x-eiffel", "eiffel");

});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/elm/elm.js":
/*!********************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/elm/elm.js ***!
  \********************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"));
  else {}
})(function(CodeMirror) {
  "use strict";

  CodeMirror.defineMode("elm", function() {

    function switchState(source, setState, f) {
      setState(f);
      return f(source, setState);
    }

    // These should all be Unicode extended, as per the Haskell 2010 report
    var smallRE = /[a-z_]/;
    var largeRE = /[A-Z]/;
    var digitRE = /[0-9]/;
    var hexitRE = /[0-9A-Fa-f]/;
    var octitRE = /[0-7]/;
    var idRE = /[a-z_A-Z0-9\']/;
    var symbolRE = /[-!#$%&*+.\/<=>?@\\^|~:\u03BB\u2192]/;
    var specialRE = /[(),;[\]`{}]/;
    var whiteCharRE = /[ \t\v\f]/; // newlines are handled in tokenizer

    function normal() {
      return function (source, setState) {
        if (source.eatWhile(whiteCharRE)) {
          return null;
        }

        var ch = source.next();
        if (specialRE.test(ch)) {
          if (ch == '{' && source.eat('-')) {
            var t = "comment";
            if (source.eat('#')) t = "meta";
            return switchState(source, setState, ncomment(t, 1));
          }
          return null;
        }

        if (ch == '\'') {
          if (source.eat('\\'))
            source.next();  // should handle other escapes here
          else
            source.next();

          if (source.eat('\''))
            return "string";
          return "error";
        }

        if (ch == '"') {
          return switchState(source, setState, stringLiteral);
        }

        if (largeRE.test(ch)) {
          source.eatWhile(idRE);
          if (source.eat('.'))
            return "qualifier";
          return "variable-2";
        }

        if (smallRE.test(ch)) {
          var isDef = source.pos === 1;
          source.eatWhile(idRE);
          return isDef ? "type" : "variable";
        }

        if (digitRE.test(ch)) {
          if (ch == '0') {
            if (source.eat(/[xX]/)) {
              source.eatWhile(hexitRE); // should require at least 1
              return "integer";
            }
            if (source.eat(/[oO]/)) {
              source.eatWhile(octitRE); // should require at least 1
              return "number";
            }
          }
          source.eatWhile(digitRE);
          var t = "number";
          if (source.eat('.')) {
            t = "number";
            source.eatWhile(digitRE); // should require at least 1
          }
          if (source.eat(/[eE]/)) {
            t = "number";
            source.eat(/[-+]/);
            source.eatWhile(digitRE); // should require at least 1
          }
          return t;
        }

        if (symbolRE.test(ch)) {
          if (ch == '-' && source.eat(/-/)) {
            source.eatWhile(/-/);
            if (!source.eat(symbolRE)) {
              source.skipToEnd();
              return "comment";
            }
          }
          source.eatWhile(symbolRE);
          return "builtin";
        }

        return "error";
      }
    }

    function ncomment(type, nest) {
      if (nest == 0) {
        return normal();
      }
      return function(source, setState) {
        var currNest = nest;
        while (!source.eol()) {
          var ch = source.next();
          if (ch == '{' && source.eat('-')) {
            ++currNest;
          } else if (ch == '-' && source.eat('}')) {
            --currNest;
            if (currNest == 0) {
              setState(normal());
              return type;
            }
          }
        }
        setState(ncomment(type, currNest));
        return type;
      }
    }

    function stringLiteral(source, setState) {
      while (!source.eol()) {
        var ch = source.next();
        if (ch == '"') {
          setState(normal());
          return "string";
        }
        if (ch == '\\') {
          if (source.eol() || source.eat(whiteCharRE)) {
            setState(stringGap);
            return "string";
          }
          if (!source.eat('&')) source.next(); // should handle other escapes here
        }
      }
      setState(normal());
      return "error";
    }

    function stringGap(source, setState) {
      if (source.eat('\\')) {
        return switchState(source, setState, stringLiteral);
      }
      source.next();
      setState(normal());
      return "error";
    }


    var wellKnownWords = (function() {
      var wkw = {};

      var keywords = [
        "case", "of", "as",
        "if", "then", "else",
        "let", "in",
        "infix", "infixl", "infixr",
        "type", "alias",
        "input", "output", "foreign", "loopback",
        "module", "where", "import", "exposing",
        "_", "..", "|", ":", "=", "\\", "\"", "->", "<-"
      ];

      for (var i = keywords.length; i--;)
        wkw[keywords[i]] = "keyword";

      return wkw;
    })();



    return {
      startState: function ()  { return { f: normal() }; },
      copyState:  function (s) { return { f: s.f }; },

      token: function(stream, state) {
        var t = state.f(stream, function(s) { state.f = s; });
        var w = stream.current();
        return (wellKnownWords.hasOwnProperty(w)) ? wellKnownWords[w] : t;
      }
    };

  });

  CodeMirror.defineMIME("text/x-elm", "elm");
});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/erlang/erlang.js":
/*!**************************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/erlang/erlang.js ***!
  \**************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

/*jshint unused:true, eqnull:true, curly:true, bitwise:true */
/*jshint undef:true, latedef:true, trailing:true */
/*global CodeMirror:true */

// erlang mode.
// tokenizer -> token types -> CodeMirror styles
// tokenizer maintains a parse stack
// indenter uses the parse stack

// TODO indenter:
//   bit syntax
//   old guard/bif/conversion clashes (e.g. "float/1")
//   type/spec/opaque

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"));
  else {}
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMIME("text/x-erlang", "erlang");

CodeMirror.defineMode("erlang", function(cmCfg) {
  "use strict";

/////////////////////////////////////////////////////////////////////////////
// constants

  var typeWords = [
    "-type", "-spec", "-export_type", "-opaque"];

  var keywordWords = [
    "after","begin","catch","case","cond","end","fun","if",
    "let","of","query","receive","try","when"];

  var separatorRE    = /[\->,;]/;
  var separatorWords = [
    "->",";",","];

  var operatorAtomWords = [
    "and","andalso","band","bnot","bor","bsl","bsr","bxor",
    "div","not","or","orelse","rem","xor"];

  var operatorSymbolRE    = /[\+\-\*\/<>=\|:!]/;
  var operatorSymbolWords = [
    "=","+","-","*","/",">",">=","<","=<","=:=","==","=/=","/=","||","<-","!"];

  var openParenRE    = /[<\(\[\{]/;
  var openParenWords = [
    "<<","(","[","{"];

  var closeParenRE    = /[>\)\]\}]/;
  var closeParenWords = [
    "}","]",")",">>"];

  var guardWords = [
    "is_atom","is_binary","is_bitstring","is_boolean","is_float",
    "is_function","is_integer","is_list","is_number","is_pid",
    "is_port","is_record","is_reference","is_tuple",
    "atom","binary","bitstring","boolean","function","integer","list",
    "number","pid","port","record","reference","tuple"];

  var bifWords = [
    "abs","adler32","adler32_combine","alive","apply","atom_to_binary",
    "atom_to_list","binary_to_atom","binary_to_existing_atom",
    "binary_to_list","binary_to_term","bit_size","bitstring_to_list",
    "byte_size","check_process_code","contact_binary","crc32",
    "crc32_combine","date","decode_packet","delete_module",
    "disconnect_node","element","erase","exit","float","float_to_list",
    "garbage_collect","get","get_keys","group_leader","halt","hd",
    "integer_to_list","internal_bif","iolist_size","iolist_to_binary",
    "is_alive","is_atom","is_binary","is_bitstring","is_boolean",
    "is_float","is_function","is_integer","is_list","is_number","is_pid",
    "is_port","is_process_alive","is_record","is_reference","is_tuple",
    "length","link","list_to_atom","list_to_binary","list_to_bitstring",
    "list_to_existing_atom","list_to_float","list_to_integer",
    "list_to_pid","list_to_tuple","load_module","make_ref","module_loaded",
    "monitor_node","node","node_link","node_unlink","nodes","notalive",
    "now","open_port","pid_to_list","port_close","port_command",
    "port_connect","port_control","pre_loaded","process_flag",
    "process_info","processes","purge_module","put","register",
    "registered","round","self","setelement","size","spawn","spawn_link",
    "spawn_monitor","spawn_opt","split_binary","statistics",
    "term_to_binary","time","throw","tl","trunc","tuple_size",
    "tuple_to_list","unlink","unregister","whereis"];

// upper case: [A-Z] [Ø-Þ] [À-Ö]
// lower case: [a-z] [ß-ö] [ø-ÿ]
  var anumRE       = /[\w@Ø-ÞÀ-Öß-öø-ÿ]/;
  var escapesRE    =
    /[0-7]{1,3}|[bdefnrstv\\"']|\^[a-zA-Z]|x[0-9a-zA-Z]{2}|x{[0-9a-zA-Z]+}/;

/////////////////////////////////////////////////////////////////////////////
// tokenizer

  function tokenizer(stream,state) {
    // in multi-line string
    if (state.in_string) {
      state.in_string = (!doubleQuote(stream));
      return rval(state,stream,"string");
    }

    // in multi-line atom
    if (state.in_atom) {
      state.in_atom = (!singleQuote(stream));
      return rval(state,stream,"atom");
    }

    // whitespace
    if (stream.eatSpace()) {
      return rval(state,stream,"whitespace");
    }

    // attributes and type specs
    if (!peekToken(state) &&
        stream.match(/-\s*[a-zß-öø-ÿ][\wØ-ÞÀ-Öß-öø-ÿ]*/)) {
      if (is_member(stream.current(),typeWords)) {
        return rval(state,stream,"type");
      }else{
        return rval(state,stream,"attribute");
      }
    }

    var ch = stream.next();

    // comment
    if (ch == '%') {
      stream.skipToEnd();
      return rval(state,stream,"comment");
    }

    // colon
    if (ch == ":") {
      return rval(state,stream,"colon");
    }

    // macro
    if (ch == '?') {
      stream.eatSpace();
      stream.eatWhile(anumRE);
      return rval(state,stream,"macro");
    }

    // record
    if (ch == "#") {
      stream.eatSpace();
      stream.eatWhile(anumRE);
      return rval(state,stream,"record");
    }

    // dollar escape
    if (ch == "$") {
      if (stream.next() == "\\" && !stream.match(escapesRE)) {
        return rval(state,stream,"error");
      }
      return rval(state,stream,"number");
    }

    // dot
    if (ch == ".") {
      return rval(state,stream,"dot");
    }

    // quoted atom
    if (ch == '\'') {
      if (!(state.in_atom = (!singleQuote(stream)))) {
        if (stream.match(/\s*\/\s*[0-9]/,false)) {
          stream.match(/\s*\/\s*[0-9]/,true);
          return rval(state,stream,"fun");      // 'f'/0 style fun
        }
        if (stream.match(/\s*\(/,false) || stream.match(/\s*:/,false)) {
          return rval(state,stream,"function");
        }
      }
      return rval(state,stream,"atom");
    }

    // string
    if (ch == '"') {
      state.in_string = (!doubleQuote(stream));
      return rval(state,stream,"string");
    }

    // variable
    if (/[A-Z_Ø-ÞÀ-Ö]/.test(ch)) {
      stream.eatWhile(anumRE);
      return rval(state,stream,"variable");
    }

    // atom/keyword/BIF/function
    if (/[a-z_ß-öø-ÿ]/.test(ch)) {
      stream.eatWhile(anumRE);

      if (stream.match(/\s*\/\s*[0-9]/,false)) {
        stream.match(/\s*\/\s*[0-9]/,true);
        return rval(state,stream,"fun");      // f/0 style fun
      }

      var w = stream.current();

      if (is_member(w,keywordWords)) {
        return rval(state,stream,"keyword");
      }else if (is_member(w,operatorAtomWords)) {
        return rval(state,stream,"operator");
      }else if (stream.match(/\s*\(/,false)) {
        // 'put' and 'erlang:put' are bifs, 'foo:put' is not
        if (is_member(w,bifWords) &&
            ((peekToken(state).token != ":") ||
             (peekToken(state,2).token == "erlang"))) {
          return rval(state,stream,"builtin");
        }else if (is_member(w,guardWords)) {
          return rval(state,stream,"guard");
        }else{
          return rval(state,stream,"function");
        }
      }else if (lookahead(stream) == ":") {
        if (w == "erlang") {
          return rval(state,stream,"builtin");
        } else {
          return rval(state,stream,"function");
        }
      }else if (is_member(w,["true","false"])) {
        return rval(state,stream,"boolean");
      }else{
        return rval(state,stream,"atom");
      }
    }

    // number
    var digitRE      = /[0-9]/;
    var radixRE      = /[0-9a-zA-Z]/;         // 36#zZ style int
    if (digitRE.test(ch)) {
      stream.eatWhile(digitRE);
      if (stream.eat('#')) {                // 36#aZ  style integer
        if (!stream.eatWhile(radixRE)) {
          stream.backUp(1);                 //"36#" - syntax error
        }
      } else if (stream.eat('.')) {       // float
        if (!stream.eatWhile(digitRE)) {
          stream.backUp(1);        // "3." - probably end of function
        } else {
          if (stream.eat(/[eE]/)) {        // float with exponent
            if (stream.eat(/[-+]/)) {
              if (!stream.eatWhile(digitRE)) {
                stream.backUp(2);            // "2e-" - syntax error
              }
            } else {
              if (!stream.eatWhile(digitRE)) {
                stream.backUp(1);            // "2e" - syntax error
              }
            }
          }
        }
      }
      return rval(state,stream,"number");   // normal integer
    }

    // open parens
    if (nongreedy(stream,openParenRE,openParenWords)) {
      return rval(state,stream,"open_paren");
    }

    // close parens
    if (nongreedy(stream,closeParenRE,closeParenWords)) {
      return rval(state,stream,"close_paren");
    }

    // separators
    if (greedy(stream,separatorRE,separatorWords)) {
      return rval(state,stream,"separator");
    }

    // operators
    if (greedy(stream,operatorSymbolRE,operatorSymbolWords)) {
      return rval(state,stream,"operator");
    }

    return rval(state,stream,null);
  }

/////////////////////////////////////////////////////////////////////////////
// utilities
  function nongreedy(stream,re,words) {
    if (stream.current().length == 1 && re.test(stream.current())) {
      stream.backUp(1);
      while (re.test(stream.peek())) {
        stream.next();
        if (is_member(stream.current(),words)) {
          return true;
        }
      }
      stream.backUp(stream.current().length-1);
    }
    return false;
  }

  function greedy(stream,re,words) {
    if (stream.current().length == 1 && re.test(stream.current())) {
      while (re.test(stream.peek())) {
        stream.next();
      }
      while (0 < stream.current().length) {
        if (is_member(stream.current(),words)) {
          return true;
        }else{
          stream.backUp(1);
        }
      }
      stream.next();
    }
    return false;
  }

  function doubleQuote(stream) {
    return quote(stream, '"', '\\');
  }

  function singleQuote(stream) {
    return quote(stream,'\'','\\');
  }

  function quote(stream,quoteChar,escapeChar) {
    while (!stream.eol()) {
      var ch = stream.next();
      if (ch == quoteChar) {
        return true;
      }else if (ch == escapeChar) {
        stream.next();
      }
    }
    return false;
  }

  function lookahead(stream) {
    var m = stream.match(/([\n\s]+|%[^\n]*\n)*(.)/,false);
    return m ? m.pop() : "";
  }

  function is_member(element,list) {
    return (-1 < list.indexOf(element));
  }

  function rval(state,stream,type) {

    // parse stack
    pushToken(state,realToken(type,stream));

    // map erlang token type to CodeMirror style class
    //     erlang             -> CodeMirror tag
    switch (type) {
      case "atom":        return "atom";
      case "attribute":   return "attribute";
      case "boolean":     return "atom";
      case "builtin":     return "builtin";
      case "close_paren": return null;
      case "colon":       return null;
      case "comment":     return "comment";
      case "dot":         return null;
      case "error":       return "error";
      case "fun":         return "meta";
      case "function":    return "tag";
      case "guard":       return "property";
      case "keyword":     return "keyword";
      case "macro":       return "variable-2";
      case "number":      return "number";
      case "open_paren":  return null;
      case "operator":    return "operator";
      case "record":      return "bracket";
      case "separator":   return null;
      case "string":      return "string";
      case "type":        return "def";
      case "variable":    return "variable";
      default:            return null;
    }
  }

  function aToken(tok,col,ind,typ) {
    return {token:  tok,
            column: col,
            indent: ind,
            type:   typ};
  }

  function realToken(type,stream) {
    return aToken(stream.current(),
                 stream.column(),
                 stream.indentation(),
                 type);
  }

  function fakeToken(type) {
    return aToken(type,0,0,type);
  }

  function peekToken(state,depth) {
    var len = state.tokenStack.length;
    var dep = (depth ? depth : 1);

    if (len < dep) {
      return false;
    }else{
      return state.tokenStack[len-dep];
    }
  }

  function pushToken(state,token) {

    if (!(token.type == "comment" || token.type == "whitespace")) {
      state.tokenStack = maybe_drop_pre(state.tokenStack,token);
      state.tokenStack = maybe_drop_post(state.tokenStack);
    }
  }

  function maybe_drop_pre(s,token) {
    var last = s.length-1;

    if (0 < last && s[last].type === "record" && token.type === "dot") {
      s.pop();
    }else if (0 < last && s[last].type === "group") {
      s.pop();
      s.push(token);
    }else{
      s.push(token);
    }
    return s;
  }

  function maybe_drop_post(s) {
    if (!s.length) return s
    var last = s.length-1;

    if (s[last].type === "dot") {
      return [];
    }
    if (last > 1 && s[last].type === "fun" && s[last-1].token === "fun") {
      return s.slice(0,last-1);
    }
    switch (s[last].token) {
      case "}":    return d(s,{g:["{"]});
      case "]":    return d(s,{i:["["]});
      case ")":    return d(s,{i:["("]});
      case ">>":   return d(s,{i:["<<"]});
      case "end":  return d(s,{i:["begin","case","fun","if","receive","try"]});
      case ",":    return d(s,{e:["begin","try","when","->",
                                  ",","(","[","{","<<"]});
      case "->":   return d(s,{r:["when"],
                               m:["try","if","case","receive"]});
      case ";":    return d(s,{E:["case","fun","if","receive","try","when"]});
      case "catch":return d(s,{e:["try"]});
      case "of":   return d(s,{e:["case"]});
      case "after":return d(s,{e:["receive","try"]});
      default:     return s;
    }
  }

  function d(stack,tt) {
    // stack is a stack of Token objects.
    // tt is an object; {type:tokens}
    // type is a char, tokens is a list of token strings.
    // The function returns (possibly truncated) stack.
    // It will descend the stack, looking for a Token such that Token.token
    //  is a member of tokens. If it does not find that, it will normally (but
    //  see "E" below) return stack. If it does find a match, it will remove
    //  all the Tokens between the top and the matched Token.
    // If type is "m", that is all it does.
    // If type is "i", it will also remove the matched Token and the top Token.
    // If type is "g", like "i", but add a fake "group" token at the top.
    // If type is "r", it will remove the matched Token, but not the top Token.
    // If type is "e", it will keep the matched Token but not the top Token.
    // If type is "E", it behaves as for type "e", except if there is no match,
    //  in which case it will return an empty stack.

    for (var type in tt) {
      var len = stack.length-1;
      var tokens = tt[type];
      for (var i = len-1; -1 < i ; i--) {
        if (is_member(stack[i].token,tokens)) {
          var ss = stack.slice(0,i);
          switch (type) {
              case "m": return ss.concat(stack[i]).concat(stack[len]);
              case "r": return ss.concat(stack[len]);
              case "i": return ss;
              case "g": return ss.concat(fakeToken("group"));
              case "E": return ss.concat(stack[i]);
              case "e": return ss.concat(stack[i]);
          }
        }
      }
    }
    return (type == "E" ? [] : stack);
  }

/////////////////////////////////////////////////////////////////////////////
// indenter

  function indenter(state,textAfter) {
    var t;
    var unit = cmCfg.indentUnit;
    var wordAfter = wordafter(textAfter);
    var currT = peekToken(state,1);
    var prevT = peekToken(state,2);

    if (state.in_string || state.in_atom) {
      return CodeMirror.Pass;
    }else if (!prevT) {
      return 0;
    }else if (currT.token == "when") {
      return currT.column+unit;
    }else if (wordAfter === "when" && prevT.type === "function") {
      return prevT.indent+unit;
    }else if (wordAfter === "(" && currT.token === "fun") {
      return  currT.column+3;
    }else if (wordAfter === "catch" && (t = getToken(state,["try"]))) {
      return t.column;
    }else if (is_member(wordAfter,["end","after","of"])) {
      t = getToken(state,["begin","case","fun","if","receive","try"]);
      return t ? t.column : CodeMirror.Pass;
    }else if (is_member(wordAfter,closeParenWords)) {
      t = getToken(state,openParenWords);
      return t ? t.column : CodeMirror.Pass;
    }else if (is_member(currT.token,[",","|","||"]) ||
              is_member(wordAfter,[",","|","||"])) {
      t = postcommaToken(state);
      return t ? t.column+t.token.length : unit;
    }else if (currT.token == "->") {
      if (is_member(prevT.token, ["receive","case","if","try"])) {
        return prevT.column+unit+unit;
      }else{
        return prevT.column+unit;
      }
    }else if (is_member(currT.token,openParenWords)) {
      return currT.column+currT.token.length;
    }else{
      t = defaultToken(state);
      return truthy(t) ? t.column+unit : 0;
    }
  }

  function wordafter(str) {
    var m = str.match(/,|[a-z]+|\}|\]|\)|>>|\|+|\(/);

    return truthy(m) && (m.index === 0) ? m[0] : "";
  }

  function postcommaToken(state) {
    var objs = state.tokenStack.slice(0,-1);
    var i = getTokenIndex(objs,"type",["open_paren"]);

    return truthy(objs[i]) ? objs[i] : false;
  }

  function defaultToken(state) {
    var objs = state.tokenStack;
    var stop = getTokenIndex(objs,"type",["open_paren","separator","keyword"]);
    var oper = getTokenIndex(objs,"type",["operator"]);

    if (truthy(stop) && truthy(oper) && stop < oper) {
      return objs[stop+1];
    } else if (truthy(stop)) {
      return objs[stop];
    } else {
      return false;
    }
  }

  function getToken(state,tokens) {
    var objs = state.tokenStack;
    var i = getTokenIndex(objs,"token",tokens);

    return truthy(objs[i]) ? objs[i] : false;
  }

  function getTokenIndex(objs,propname,propvals) {

    for (var i = objs.length-1; -1 < i ; i--) {
      if (is_member(objs[i][propname],propvals)) {
        return i;
      }
    }
    return false;
  }

  function truthy(x) {
    return (x !== false) && (x != null);
  }

/////////////////////////////////////////////////////////////////////////////
// this object defines the mode

  return {
    startState:
      function() {
        return {tokenStack: [],
                in_string:  false,
                in_atom:    false};
      },

    token:
      function(stream, state) {
        return tokenizer(stream, state);
      },

    indent:
      function(state, textAfter) {
        return indenter(state,textAfter);
      },

    lineComment: "%"
  };
});

});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/factor/factor.js":
/*!**************************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/factor/factor.js ***!
  \**************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

// Factor syntax highlight - simple mode
//
// by Dimage Sapelkin (https://github.com/kerabromsmu)

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"), __webpack_require__(/*! ../../addon/mode/simple */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/addon/mode/simple.js"));
  else {}
})(function(CodeMirror) {
  "use strict";

  CodeMirror.defineSimpleMode("factor", {
    // The start state contains the rules that are intially used
    start: [
      // comments
      {regex: /#?!.*/, token: "comment"},
      // strings """, multiline --> state
      {regex: /"""/, token: "string", next: "string3"},
      {regex: /(STRING:)(\s)/, token: ["keyword", null], next: "string2"},
      {regex: /\S*?"/, token: "string", next: "string"},
      // numbers: dec, hex, unicode, bin, fractional, complex
      {regex: /(?:0x[\d,a-f]+)|(?:0o[0-7]+)|(?:0b[0,1]+)|(?:\-?\d+.?\d*)(?=\s)/, token: "number"},
      //{regex: /[+-]?/} //fractional
      // definition: defining word, defined word, etc
      {regex: /((?:GENERIC)|\:?\:)(\s+)(\S+)(\s+)(\()/, token: ["keyword", null, "def", null, "bracket"], next: "stack"},
      // method definition: defining word, type, defined word, etc
      {regex: /(M\:)(\s+)(\S+)(\s+)(\S+)/, token: ["keyword", null, "def", null, "tag"]},
      // vocabulary using --> state
      {regex: /USING\:/, token: "keyword", next: "vocabulary"},
      // vocabulary definition/use
      {regex: /(USE\:|IN\:)(\s+)(\S+)(?=\s|$)/, token: ["keyword", null, "tag"]},
      // definition: a defining word, defined word
      {regex: /(\S+\:)(\s+)(\S+)(?=\s|$)/, token: ["keyword", null, "def"]},
      // "keywords", incl. ; t f . [ ] { } defining words
      {regex: /(?:;|\\|t|f|if|loop|while|until|do|PRIVATE>|<PRIVATE|\.|\S*\[|\]|\S*\{|\})(?=\s|$)/, token: "keyword"},
      // <constructors> and the like
      {regex: /\S+[\)>\.\*\?]+(?=\s|$)/, token: "builtin"},
      {regex: /[\)><]+\S+(?=\s|$)/, token: "builtin"},
      // operators
      {regex: /(?:[\+\-\=\/\*<>])(?=\s|$)/, token: "keyword"},
      // any id (?)
      {regex: /\S+/, token: "variable"},
      {regex: /\s+|./, token: null}
    ],
    vocabulary: [
      {regex: /;/, token: "keyword", next: "start"},
      {regex: /\S+/, token: "tag"},
      {regex: /\s+|./, token: null}
    ],
    string: [
      {regex: /(?:[^\\]|\\.)*?"/, token: "string", next: "start"},
      {regex: /.*/, token: "string"}
    ],
    string2: [
      {regex: /^;/, token: "keyword", next: "start"},
      {regex: /.*/, token: "string"}
    ],
    string3: [
      {regex: /(?:[^\\]|\\.)*?"""/, token: "string", next: "start"},
      {regex: /.*/, token: "string"}
    ],
    stack: [
      {regex: /\)/, token: "bracket", next: "start"},
      {regex: /--/, token: "bracket"},
      {regex: /\S+/, token: "meta"},
      {regex: /\s+|./, token: null}
    ],
    // The meta property contains global information about the mode. It
    // can contain properties like lineComment, which are supported by
    // all modes, and also directives like dontIndentStates, which are
    // specific to simple modes.
    meta: {
      dontIndentStates: ["start", "vocabulary", "string", "string3", "stack"],
      lineComment: [ "!", "#!" ]
    }
  });

  CodeMirror.defineMIME("text/x-factor", "factor");
});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/fcl/fcl.js":
/*!********************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/fcl/fcl.js ***!
  \********************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"));
  else {}
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode("fcl", function(config) {
  var indentUnit = config.indentUnit;

  var keywords = {
      "term": true,
      "method": true, "accu": true,
      "rule": true, "then": true, "is": true, "and": true, "or": true,
      "if": true, "default": true
  };

  var start_blocks = {
      "var_input": true,
      "var_output": true,
      "fuzzify": true,
      "defuzzify": true,
      "function_block": true,
      "ruleblock": true
  };

  var end_blocks = {
      "end_ruleblock": true,
      "end_defuzzify": true,
      "end_function_block": true,
      "end_fuzzify": true,
      "end_var": true
  };

  var atoms = {
      "true": true, "false": true, "nan": true,
      "real": true, "min": true, "max": true, "cog": true, "cogs": true
  };

  var isOperatorChar = /[+\-*&^%:=<>!|\/]/;

  function tokenBase(stream, state) {
    var ch = stream.next();

    if (/[\d\.]/.test(ch)) {
      if (ch == ".") {
        stream.match(/^[0-9]+([eE][\-+]?[0-9]+)?/);
      } else if (ch == "0") {
        stream.match(/^[xX][0-9a-fA-F]+/) || stream.match(/^0[0-7]+/);
      } else {
        stream.match(/^[0-9]*\.?[0-9]*([eE][\-+]?[0-9]+)?/);
      }
      return "number";
    }

    if (ch == "/" || ch == "(") {
      if (stream.eat("*")) {
        state.tokenize = tokenComment;
        return tokenComment(stream, state);
      }
      if (stream.eat("/")) {
        stream.skipToEnd();
        return "comment";
      }
    }
    if (isOperatorChar.test(ch)) {
      stream.eatWhile(isOperatorChar);
      return "operator";
    }
    stream.eatWhile(/[\w\$_\xa1-\uffff]/);

    var cur = stream.current().toLowerCase();
    if (keywords.propertyIsEnumerable(cur) ||
        start_blocks.propertyIsEnumerable(cur) ||
        end_blocks.propertyIsEnumerable(cur)) {
      return "keyword";
    }
    if (atoms.propertyIsEnumerable(cur)) return "atom";
    return "variable";
  }


  function tokenComment(stream, state) {
    var maybeEnd = false, ch;
    while (ch = stream.next()) {
      if ((ch == "/" || ch == ")") && maybeEnd) {
        state.tokenize = tokenBase;
        break;
      }
      maybeEnd = (ch == "*");
    }
    return "comment";
  }

  function Context(indented, column, type, align, prev) {
    this.indented = indented;
    this.column = column;
    this.type = type;
    this.align = align;
    this.prev = prev;
  }

  function pushContext(state, col, type) {
    return state.context = new Context(state.indented, col, type, null, state.context);
  }

  function popContext(state) {
    if (!state.context.prev) return;
    var t = state.context.type;
    if (t == "end_block")
      state.indented = state.context.indented;
    return state.context = state.context.prev;
  }

  // Interface

  return {
    startState: function(basecolumn) {
      return {
        tokenize: null,
        context: new Context((basecolumn || 0) - indentUnit, 0, "top", false),
        indented: 0,
        startOfLine: true
      };
    },

    token: function(stream, state) {
        var ctx = state.context;
        if (stream.sol()) {
            if (ctx.align == null) ctx.align = false;
            state.indented = stream.indentation();
            state.startOfLine = true;
        }
        if (stream.eatSpace()) return null;

        var style = (state.tokenize || tokenBase)(stream, state);
        if (style == "comment") return style;
        if (ctx.align == null) ctx.align = true;

        var cur = stream.current().toLowerCase();

        if (start_blocks.propertyIsEnumerable(cur)) pushContext(state, stream.column(), "end_block");
        else if (end_blocks.propertyIsEnumerable(cur))  popContext(state);

        state.startOfLine = false;
        return style;
    },

    indent: function(state, textAfter) {
      if (state.tokenize != tokenBase && state.tokenize != null) return 0;
      var ctx = state.context;

      var closing = end_blocks.propertyIsEnumerable(textAfter);
      if (ctx.align) return ctx.column + (closing ? 0 : 1);
      else return ctx.indented + (closing ? 0 : indentUnit);
    },

    electricChars: "ryk",
    fold: "brace",
    blockCommentStart: "(*",
    blockCommentEnd: "*)",
    lineComment: "//"
  };
});

CodeMirror.defineMIME("text/x-fcl", "fcl");
});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/forth/forth.js":
/*!************************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/forth/forth.js ***!
  \************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

// Author: Aliaksei Chapyzhenka

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"));
  else {}
})(function(CodeMirror) {
  "use strict";

  function toWordList(words) {
    var ret = [];
    words.split(' ').forEach(function(e){
      ret.push({name: e});
    });
    return ret;
  }

  var coreWordList = toWordList(
'INVERT AND OR XOR\
 2* 2/ LSHIFT RSHIFT\
 0= = 0< < > U< MIN MAX\
 2DROP 2DUP 2OVER 2SWAP ?DUP DEPTH DROP DUP OVER ROT SWAP\
 >R R> R@\
 + - 1+ 1- ABS NEGATE\
 S>D * M* UM*\
 FM/MOD SM/REM UM/MOD */ */MOD / /MOD MOD\
 HERE , @ ! CELL+ CELLS C, C@ C! CHARS 2@ 2!\
 ALIGN ALIGNED +! ALLOT\
 CHAR [CHAR] [ ] BL\
 FIND EXECUTE IMMEDIATE COUNT LITERAL STATE\
 ; DOES> >BODY\
 EVALUATE\
 SOURCE >IN\
 <# # #S #> HOLD SIGN BASE >NUMBER HEX DECIMAL\
 FILL MOVE\
 . CR EMIT SPACE SPACES TYPE U. .R U.R\
 ACCEPT\
 TRUE FALSE\
 <> U> 0<> 0>\
 NIP TUCK ROLL PICK\
 2>R 2R@ 2R>\
 WITHIN UNUSED MARKER\
 I J\
 TO\
 COMPILE, [COMPILE]\
 SAVE-INPUT RESTORE-INPUT\
 PAD ERASE\
 2LITERAL DNEGATE\
 D- D+ D0< D0= D2* D2/ D< D= DMAX DMIN D>S DABS\
 M+ M*/ D. D.R 2ROT DU<\
 CATCH THROW\
 FREE RESIZE ALLOCATE\
 CS-PICK CS-ROLL\
 GET-CURRENT SET-CURRENT FORTH-WORDLIST GET-ORDER SET-ORDER\
 PREVIOUS SEARCH-WORDLIST WORDLIST FIND ALSO ONLY FORTH DEFINITIONS ORDER\
 -TRAILING /STRING SEARCH COMPARE CMOVE CMOVE> BLANK SLITERAL');

  var immediateWordList = toWordList('IF ELSE THEN BEGIN WHILE REPEAT UNTIL RECURSE [IF] [ELSE] [THEN] ?DO DO LOOP +LOOP UNLOOP LEAVE EXIT AGAIN CASE OF ENDOF ENDCASE');

  CodeMirror.defineMode('forth', function() {
    function searchWordList (wordList, word) {
      var i;
      for (i = wordList.length - 1; i >= 0; i--) {
        if (wordList[i].name === word.toUpperCase()) {
          return wordList[i];
        }
      }
      return undefined;
    }
  return {
    startState: function() {
      return {
        state: '',
        base: 10,
        coreWordList: coreWordList,
        immediateWordList: immediateWordList,
        wordList: []
      };
    },
    token: function (stream, stt) {
      var mat;
      if (stream.eatSpace()) {
        return null;
      }
      if (stt.state === '') { // interpretation
        if (stream.match(/^(\]|:NONAME)(\s|$)/i)) {
          stt.state = ' compilation';
          return 'builtin compilation';
        }
        mat = stream.match(/^(\:)\s+(\S+)(\s|$)+/);
        if (mat) {
          stt.wordList.push({name: mat[2].toUpperCase()});
          stt.state = ' compilation';
          return 'def' + stt.state;
        }
        mat = stream.match(/^(VARIABLE|2VARIABLE|CONSTANT|2CONSTANT|CREATE|POSTPONE|VALUE|WORD)\s+(\S+)(\s|$)+/i);
        if (mat) {
          stt.wordList.push({name: mat[2].toUpperCase()});
          return 'def' + stt.state;
        }
        mat = stream.match(/^(\'|\[\'\])\s+(\S+)(\s|$)+/);
        if (mat) {
          return 'builtin' + stt.state;
        }
        } else { // compilation
        // ; [
        if (stream.match(/^(\;|\[)(\s)/)) {
          stt.state = '';
          stream.backUp(1);
          return 'builtin compilation';
        }
        if (stream.match(/^(\;|\[)($)/)) {
          stt.state = '';
          return 'builtin compilation';
        }
        if (stream.match(/^(POSTPONE)\s+\S+(\s|$)+/)) {
          return 'builtin';
        }
      }

      // dynamic wordlist
      mat = stream.match(/^(\S+)(\s+|$)/);
      if (mat) {
        if (searchWordList(stt.wordList, mat[1]) !== undefined) {
          return 'variable' + stt.state;
        }

        // comments
        if (mat[1] === '\\') {
          stream.skipToEnd();
            return 'comment' + stt.state;
          }

          // core words
          if (searchWordList(stt.coreWordList, mat[1]) !== undefined) {
            return 'builtin' + stt.state;
          }
          if (searchWordList(stt.immediateWordList, mat[1]) !== undefined) {
            return 'keyword' + stt.state;
          }

          if (mat[1] === '(') {
            stream.eatWhile(function (s) { return s !== ')'; });
            stream.eat(')');
            return 'comment' + stt.state;
          }

          // // strings
          if (mat[1] === '.(') {
            stream.eatWhile(function (s) { return s !== ')'; });
            stream.eat(')');
            return 'string' + stt.state;
          }
          if (mat[1] === 'S"' || mat[1] === '."' || mat[1] === 'C"') {
            stream.eatWhile(function (s) { return s !== '"'; });
            stream.eat('"');
            return 'string' + stt.state;
          }

          // numbers
          if (mat[1] - 0xfffffffff) {
            return 'number' + stt.state;
          }
          // if (mat[1].match(/^[-+]?[0-9]+\.[0-9]*/)) {
          //     return 'number' + stt.state;
          // }

          return 'atom' + stt.state;
        }
      }
    };
  });
  CodeMirror.defineMIME("text/x-forth", "forth");
});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/fortran/fortran.js":
/*!****************************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/fortran/fortran.js ***!
  \****************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"));
  else {}
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode("fortran", function() {
  function words(array) {
    var keys = {};
    for (var i = 0; i < array.length; ++i) {
      keys[array[i]] = true;
    }
    return keys;
  }

  var keywords = words([
                  "abstract", "accept", "allocatable", "allocate",
                  "array", "assign", "asynchronous", "backspace",
                  "bind", "block", "byte", "call", "case",
                  "class", "close", "common", "contains",
                  "continue", "cycle", "data", "deallocate",
                  "decode", "deferred", "dimension", "do",
                  "elemental", "else", "encode", "end",
                  "endif", "entry", "enumerator", "equivalence",
                  "exit", "external", "extrinsic", "final",
                  "forall", "format", "function", "generic",
                  "go", "goto", "if", "implicit", "import", "include",
                  "inquire", "intent", "interface", "intrinsic",
                  "module", "namelist", "non_intrinsic",
                  "non_overridable", "none", "nopass",
                  "nullify", "open", "optional", "options",
                  "parameter", "pass", "pause", "pointer",
                  "print", "private", "program", "protected",
                  "public", "pure", "read", "recursive", "result",
                  "return", "rewind", "save", "select", "sequence",
                  "stop", "subroutine", "target", "then", "to", "type",
                  "use", "value", "volatile", "where", "while",
                  "write"]);
  var builtins = words(["abort", "abs", "access", "achar", "acos",
                          "adjustl", "adjustr", "aimag", "aint", "alarm",
                          "all", "allocated", "alog", "amax", "amin",
                          "amod", "and", "anint", "any", "asin",
                          "associated", "atan", "besj", "besjn", "besy",
                          "besyn", "bit_size", "btest", "cabs", "ccos",
                          "ceiling", "cexp", "char", "chdir", "chmod",
                          "clog", "cmplx", "command_argument_count",
                          "complex", "conjg", "cos", "cosh", "count",
                          "cpu_time", "cshift", "csin", "csqrt", "ctime",
                          "c_funloc", "c_loc", "c_associated", "c_null_ptr",
                          "c_null_funptr", "c_f_pointer", "c_null_char",
                          "c_alert", "c_backspace", "c_form_feed",
                          "c_new_line", "c_carriage_return",
                          "c_horizontal_tab", "c_vertical_tab", "dabs",
                          "dacos", "dasin", "datan", "date_and_time",
                          "dbesj", "dbesj", "dbesjn", "dbesy", "dbesy",
                          "dbesyn", "dble", "dcos", "dcosh", "ddim", "derf",
                          "derfc", "dexp", "digits", "dim", "dint", "dlog",
                          "dlog", "dmax", "dmin", "dmod", "dnint",
                          "dot_product", "dprod", "dsign", "dsinh",
                          "dsin", "dsqrt", "dtanh", "dtan", "dtime",
                          "eoshift", "epsilon", "erf", "erfc", "etime",
                          "exit", "exp", "exponent", "extends_type_of",
                          "fdate", "fget", "fgetc", "float", "floor",
                          "flush", "fnum", "fputc", "fput", "fraction",
                          "fseek", "fstat", "ftell", "gerror", "getarg",
                          "get_command", "get_command_argument",
                          "get_environment_variable", "getcwd",
                          "getenv", "getgid", "getlog", "getpid",
                          "getuid", "gmtime", "hostnm", "huge", "iabs",
                          "iachar", "iand", "iargc", "ibclr", "ibits",
                          "ibset", "ichar", "idate", "idim", "idint",
                          "idnint", "ieor", "ierrno", "ifix", "imag",
                          "imagpart", "index", "int", "ior", "irand",
                          "isatty", "ishft", "ishftc", "isign",
                          "iso_c_binding", "is_iostat_end", "is_iostat_eor",
                          "itime", "kill", "kind", "lbound", "len", "len_trim",
                          "lge", "lgt", "link", "lle", "llt", "lnblnk", "loc",
                          "log", "logical", "long", "lshift", "lstat", "ltime",
                          "matmul", "max", "maxexponent", "maxloc", "maxval",
                          "mclock", "merge", "move_alloc", "min", "minexponent",
                          "minloc", "minval", "mod", "modulo", "mvbits",
                          "nearest", "new_line", "nint", "not", "or", "pack",
                          "perror", "precision", "present", "product", "radix",
                          "rand", "random_number", "random_seed", "range",
                          "real", "realpart", "rename", "repeat", "reshape",
                          "rrspacing", "rshift", "same_type_as", "scale",
                          "scan", "second", "selected_int_kind",
                          "selected_real_kind", "set_exponent", "shape",
                          "short", "sign", "signal", "sinh", "sin", "sleep",
                          "sngl", "spacing", "spread", "sqrt", "srand", "stat",
                          "sum", "symlnk", "system", "system_clock", "tan",
                          "tanh", "time", "tiny", "transfer", "transpose",
                          "trim", "ttynam", "ubound", "umask", "unlink",
                          "unpack", "verify", "xor", "zabs", "zcos", "zexp",
                          "zlog", "zsin", "zsqrt"]);

    var dataTypes =  words(["c_bool", "c_char", "c_double", "c_double_complex",
                     "c_float", "c_float_complex", "c_funptr", "c_int",
                     "c_int16_t", "c_int32_t", "c_int64_t", "c_int8_t",
                     "c_int_fast16_t", "c_int_fast32_t", "c_int_fast64_t",
                     "c_int_fast8_t", "c_int_least16_t", "c_int_least32_t",
                     "c_int_least64_t", "c_int_least8_t", "c_intmax_t",
                     "c_intptr_t", "c_long", "c_long_double",
                     "c_long_double_complex", "c_long_long", "c_ptr",
                     "c_short", "c_signed_char", "c_size_t", "character",
                     "complex", "double", "integer", "logical", "real"]);
  var isOperatorChar = /[+\-*&=<>\/\:]/;
  var litOperator = new RegExp("(\.and\.|\.or\.|\.eq\.|\.lt\.|\.le\.|\.gt\.|\.ge\.|\.ne\.|\.not\.|\.eqv\.|\.neqv\.)", "i");

  function tokenBase(stream, state) {

    if (stream.match(litOperator)){
        return 'operator';
    }

    var ch = stream.next();
    if (ch == "!") {
      stream.skipToEnd();
      return "comment";
    }
    if (ch == '"' || ch == "'") {
      state.tokenize = tokenString(ch);
      return state.tokenize(stream, state);
    }
    if (/[\[\]\(\),]/.test(ch)) {
      return null;
    }
    if (/\d/.test(ch)) {
      stream.eatWhile(/[\w\.]/);
      return "number";
    }
    if (isOperatorChar.test(ch)) {
      stream.eatWhile(isOperatorChar);
      return "operator";
    }
    stream.eatWhile(/[\w\$_]/);
    var word = stream.current().toLowerCase();

    if (keywords.hasOwnProperty(word)){
            return 'keyword';
    }
    if (builtins.hasOwnProperty(word) || dataTypes.hasOwnProperty(word)) {
            return 'builtin';
    }
    return "variable";
  }

  function tokenString(quote) {
    return function(stream, state) {
      var escaped = false, next, end = false;
      while ((next = stream.next()) != null) {
        if (next == quote && !escaped) {
            end = true;
            break;
        }
        escaped = !escaped && next == "\\";
      }
      if (end || !escaped) state.tokenize = null;
      return "string";
    };
  }

  // Interface

  return {
    startState: function() {
      return {tokenize: null};
    },

    token: function(stream, state) {
      if (stream.eatSpace()) return null;
      var style = (state.tokenize || tokenBase)(stream, state);
      if (style == "comment" || style == "meta") return style;
      return style;
    }
  };
});

CodeMirror.defineMIME("text/x-fortran", "fortran");

});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/gas/gas.js":
/*!********************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/gas/gas.js ***!
  \********************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"));
  else {}
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode("gas", function(_config, parserConfig) {
  'use strict';

  // If an architecture is specified, its initialization function may
  // populate this array with custom parsing functions which will be
  // tried in the event that the standard functions do not find a match.
  var custom = [];

  // The symbol used to start a line comment changes based on the target
  // architecture.
  // If no architecture is pased in "parserConfig" then only multiline
  // comments will have syntax support.
  var lineCommentStartSymbol = "";

  // These directives are architecture independent.
  // Machine specific directives should go in their respective
  // architecture initialization function.
  // Reference:
  // http://sourceware.org/binutils/docs/as/Pseudo-Ops.html#Pseudo-Ops
  var directives = {
    ".abort" : "builtin",
    ".align" : "builtin",
    ".altmacro" : "builtin",
    ".ascii" : "builtin",
    ".asciz" : "builtin",
    ".balign" : "builtin",
    ".balignw" : "builtin",
    ".balignl" : "builtin",
    ".bundle_align_mode" : "builtin",
    ".bundle_lock" : "builtin",
    ".bundle_unlock" : "builtin",
    ".byte" : "builtin",
    ".cfi_startproc" : "builtin",
    ".comm" : "builtin",
    ".data" : "builtin",
    ".def" : "builtin",
    ".desc" : "builtin",
    ".dim" : "builtin",
    ".double" : "builtin",
    ".eject" : "builtin",
    ".else" : "builtin",
    ".elseif" : "builtin",
    ".end" : "builtin",
    ".endef" : "builtin",
    ".endfunc" : "builtin",
    ".endif" : "builtin",
    ".equ" : "builtin",
    ".equiv" : "builtin",
    ".eqv" : "builtin",
    ".err" : "builtin",
    ".error" : "builtin",
    ".exitm" : "builtin",
    ".extern" : "builtin",
    ".fail" : "builtin",
    ".file" : "builtin",
    ".fill" : "builtin",
    ".float" : "builtin",
    ".func" : "builtin",
    ".global" : "builtin",
    ".gnu_attribute" : "builtin",
    ".hidden" : "builtin",
    ".hword" : "builtin",
    ".ident" : "builtin",
    ".if" : "builtin",
    ".incbin" : "builtin",
    ".include" : "builtin",
    ".int" : "builtin",
    ".internal" : "builtin",
    ".irp" : "builtin",
    ".irpc" : "builtin",
    ".lcomm" : "builtin",
    ".lflags" : "builtin",
    ".line" : "builtin",
    ".linkonce" : "builtin",
    ".list" : "builtin",
    ".ln" : "builtin",
    ".loc" : "builtin",
    ".loc_mark_labels" : "builtin",
    ".local" : "builtin",
    ".long" : "builtin",
    ".macro" : "builtin",
    ".mri" : "builtin",
    ".noaltmacro" : "builtin",
    ".nolist" : "builtin",
    ".octa" : "builtin",
    ".offset" : "builtin",
    ".org" : "builtin",
    ".p2align" : "builtin",
    ".popsection" : "builtin",
    ".previous" : "builtin",
    ".print" : "builtin",
    ".protected" : "builtin",
    ".psize" : "builtin",
    ".purgem" : "builtin",
    ".pushsection" : "builtin",
    ".quad" : "builtin",
    ".reloc" : "builtin",
    ".rept" : "builtin",
    ".sbttl" : "builtin",
    ".scl" : "builtin",
    ".section" : "builtin",
    ".set" : "builtin",
    ".short" : "builtin",
    ".single" : "builtin",
    ".size" : "builtin",
    ".skip" : "builtin",
    ".sleb128" : "builtin",
    ".space" : "builtin",
    ".stab" : "builtin",
    ".string" : "builtin",
    ".struct" : "builtin",
    ".subsection" : "builtin",
    ".symver" : "builtin",
    ".tag" : "builtin",
    ".text" : "builtin",
    ".title" : "builtin",
    ".type" : "builtin",
    ".uleb128" : "builtin",
    ".val" : "builtin",
    ".version" : "builtin",
    ".vtable_entry" : "builtin",
    ".vtable_inherit" : "builtin",
    ".warning" : "builtin",
    ".weak" : "builtin",
    ".weakref" : "builtin",
    ".word" : "builtin"
  };

  var registers = {};

  function x86(_parserConfig) {
    lineCommentStartSymbol = "#";

    registers.ax  = "variable";
    registers.eax = "variable-2";
    registers.rax = "variable-3";

    registers.bx  = "variable";
    registers.ebx = "variable-2";
    registers.rbx = "variable-3";

    registers.cx  = "variable";
    registers.ecx = "variable-2";
    registers.rcx = "variable-3";

    registers.dx  = "variable";
    registers.edx = "variable-2";
    registers.rdx = "variable-3";

    registers.si  = "variable";
    registers.esi = "variable-2";
    registers.rsi = "variable-3";

    registers.di  = "variable";
    registers.edi = "variable-2";
    registers.rdi = "variable-3";

    registers.sp  = "variable";
    registers.esp = "variable-2";
    registers.rsp = "variable-3";

    registers.bp  = "variable";
    registers.ebp = "variable-2";
    registers.rbp = "variable-3";

    registers.ip  = "variable";
    registers.eip = "variable-2";
    registers.rip = "variable-3";

    registers.cs  = "keyword";
    registers.ds  = "keyword";
    registers.ss  = "keyword";
    registers.es  = "keyword";
    registers.fs  = "keyword";
    registers.gs  = "keyword";
  }

  function armv6(_parserConfig) {
    // Reference:
    // http://infocenter.arm.com/help/topic/com.arm.doc.qrc0001l/QRC0001_UAL.pdf
    // http://infocenter.arm.com/help/topic/com.arm.doc.ddi0301h/DDI0301H_arm1176jzfs_r0p7_trm.pdf
    lineCommentStartSymbol = "@";
    directives.syntax = "builtin";

    registers.r0  = "variable";
    registers.r1  = "variable";
    registers.r2  = "variable";
    registers.r3  = "variable";
    registers.r4  = "variable";
    registers.r5  = "variable";
    registers.r6  = "variable";
    registers.r7  = "variable";
    registers.r8  = "variable";
    registers.r9  = "variable";
    registers.r10 = "variable";
    registers.r11 = "variable";
    registers.r12 = "variable";

    registers.sp  = "variable-2";
    registers.lr  = "variable-2";
    registers.pc  = "variable-2";
    registers.r13 = registers.sp;
    registers.r14 = registers.lr;
    registers.r15 = registers.pc;

    custom.push(function(ch, stream) {
      if (ch === '#') {
        stream.eatWhile(/\w/);
        return "number";
      }
    });
  }

  var arch = (parserConfig.architecture || "x86").toLowerCase();
  if (arch === "x86") {
    x86(parserConfig);
  } else if (arch === "arm" || arch === "armv6") {
    armv6(parserConfig);
  }

  function nextUntilUnescaped(stream, end) {
    var escaped = false, next;
    while ((next = stream.next()) != null) {
      if (next === end && !escaped) {
        return false;
      }
      escaped = !escaped && next === "\\";
    }
    return escaped;
  }

  function clikeComment(stream, state) {
    var maybeEnd = false, ch;
    while ((ch = stream.next()) != null) {
      if (ch === "/" && maybeEnd) {
        state.tokenize = null;
        break;
      }
      maybeEnd = (ch === "*");
    }
    return "comment";
  }

  return {
    startState: function() {
      return {
        tokenize: null
      };
    },

    token: function(stream, state) {
      if (state.tokenize) {
        return state.tokenize(stream, state);
      }

      if (stream.eatSpace()) {
        return null;
      }

      var style, cur, ch = stream.next();

      if (ch === "/") {
        if (stream.eat("*")) {
          state.tokenize = clikeComment;
          return clikeComment(stream, state);
        }
      }

      if (ch === lineCommentStartSymbol) {
        stream.skipToEnd();
        return "comment";
      }

      if (ch === '"') {
        nextUntilUnescaped(stream, '"');
        return "string";
      }

      if (ch === '.') {
        stream.eatWhile(/\w/);
        cur = stream.current().toLowerCase();
        style = directives[cur];
        return style || null;
      }

      if (ch === '=') {
        stream.eatWhile(/\w/);
        return "tag";
      }

      if (ch === '{') {
        return "braket";
      }

      if (ch === '}') {
        return "braket";
      }

      if (/\d/.test(ch)) {
        if (ch === "0" && stream.eat("x")) {
          stream.eatWhile(/[0-9a-fA-F]/);
          return "number";
        }
        stream.eatWhile(/\d/);
        return "number";
      }

      if (/\w/.test(ch)) {
        stream.eatWhile(/\w/);
        if (stream.eat(":")) {
          return 'tag';
        }
        cur = stream.current().toLowerCase();
        style = registers[cur];
        return style || null;
      }

      for (var i = 0; i < custom.length; i++) {
        style = custom[i](ch, stream, state);
        if (style) {
          return style;
        }
      }
    },

    lineComment: lineCommentStartSymbol,
    blockCommentStart: "/*",
    blockCommentEnd: "*/"
  };
});

});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/gherkin/gherkin.js":
/*!****************************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/gherkin/gherkin.js ***!
  \****************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

/*
Gherkin mode - http://www.cukes.info/
Report bugs/issues here: https://github.com/codemirror/CodeMirror/issues
*/

// Following Objs from Brackets implementation: https://github.com/tregusti/brackets-gherkin/blob/master/main.js
//var Quotes = {
//  SINGLE: 1,
//  DOUBLE: 2
//};

//var regex = {
//  keywords: /(Feature| {2}(Scenario|In order to|As|I)| {4}(Given|When|Then|And))/
//};

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"));
  else {}
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode("gherkin", function () {
  return {
    startState: function () {
      return {
        lineNumber: 0,
        tableHeaderLine: false,
        allowFeature: true,
        allowBackground: false,
        allowScenario: false,
        allowSteps: false,
        allowPlaceholders: false,
        allowMultilineArgument: false,
        inMultilineString: false,
        inMultilineTable: false,
        inKeywordLine: false
      };
    },
    token: function (stream, state) {
      if (stream.sol()) {
        state.lineNumber++;
        state.inKeywordLine = false;
        if (state.inMultilineTable) {
            state.tableHeaderLine = false;
            if (!stream.match(/\s*\|/, false)) {
              state.allowMultilineArgument = false;
              state.inMultilineTable = false;
            }
        }
      }

      stream.eatSpace();

      if (state.allowMultilineArgument) {

        // STRING
        if (state.inMultilineString) {
          if (stream.match('"""')) {
            state.inMultilineString = false;
            state.allowMultilineArgument = false;
          } else {
            stream.match(/.*/);
          }
          return "string";
        }

        // TABLE
        if (state.inMultilineTable) {
          if (stream.match(/\|\s*/)) {
            return "bracket";
          } else {
            stream.match(/[^\|]*/);
            return state.tableHeaderLine ? "header" : "string";
          }
        }

        // DETECT START
        if (stream.match('"""')) {
          // String
          state.inMultilineString = true;
          return "string";
        } else if (stream.match("|")) {
          // Table
          state.inMultilineTable = true;
          state.tableHeaderLine = true;
          return "bracket";
        }

      }

      // LINE COMMENT
      if (stream.match(/#.*/)) {
        return "comment";

      // TAG
      } else if (!state.inKeywordLine && stream.match(/@\S+/)) {
        return "tag";

      // FEATURE
      } else if (!state.inKeywordLine && state.allowFeature && stream.match(/(機能|功能|フィーチャ|기능|โครงหลัก|ความสามารถ|ความต้องการทางธุรกิจ|ಹೆಚ್ಚಳ|గుణము|ਮੁਹਾਂਦਰਾ|ਨਕਸ਼ ਨੁਹਾਰ|ਖਾਸੀਅਤ|रूप लेख|وِیژگی|خاصية|תכונה|Функціонал|Функция|Функционалност|Функционал|Үзенчәлеклелек|Свойство|Особина|Мөмкинлек|Могућност|Λειτουργία|Δυνατότητα|Właściwość|Vlastnosť|Trajto|Tính năng|Savybė|Pretty much|Požiadavka|Požadavek|Potrzeba biznesowa|Özellik|Osobina|Ominaisuus|Omadus|OH HAI|Mogućnost|Mogucnost|Jellemző|Hwæt|Hwaet|Funzionalità|Funktionalitéit|Funktionalität|Funkcja|Funkcionalnost|Funkcionalitāte|Funkcia|Fungsi|Functionaliteit|Funcționalitate|Funcţionalitate|Functionalitate|Funcionalitat|Funcionalidade|Fonctionnalité|Fitur|Fīča|Feature|Eiginleiki|Egenskap|Egenskab|Característica|Caracteristica|Business Need|Aspekt|Arwedd|Ahoy matey!|Ability):/)) {
        state.allowScenario = true;
        state.allowBackground = true;
        state.allowPlaceholders = false;
        state.allowSteps = false;
        state.allowMultilineArgument = false;
        state.inKeywordLine = true;
        return "keyword";

      // BACKGROUND
      } else if (!state.inKeywordLine && state.allowBackground && stream.match(/(背景|배경|แนวคิด|ಹಿನ್ನೆಲೆ|నేపథ్యం|ਪਿਛੋਕੜ|पृष्ठभूमि|زمینه|الخلفية|רקע|Тарих|Предыстория|Предистория|Позадина|Передумова|Основа|Контекст|Кереш|Υπόβαθρο|Założenia|Yo\-ho\-ho|Tausta|Taust|Situācija|Rerefons|Pozadina|Pozadie|Pozadí|Osnova|Latar Belakang|Kontext|Konteksts|Kontekstas|Kontekst|Háttér|Hannergrond|Grundlage|Geçmiş|Fundo|Fono|First off|Dis is what went down|Dasar|Contexto|Contexte|Context|Contesto|Cenário de Fundo|Cenario de Fundo|Cefndir|Bối cảnh|Bakgrunnur|Bakgrunn|Bakgrund|Baggrund|Background|B4|Antecedents|Antecedentes|Ær|Aer|Achtergrond):/)) {
        state.allowPlaceholders = false;
        state.allowSteps = true;
        state.allowBackground = false;
        state.allowMultilineArgument = false;
        state.inKeywordLine = true;
        return "keyword";

      // SCENARIO OUTLINE
      } else if (!state.inKeywordLine && state.allowScenario && stream.match(/(場景大綱|场景大纲|劇本大綱|剧本大纲|テンプレ|シナリオテンプレート|シナリオテンプレ|シナリオアウトライン|시나리오 개요|สรุปเหตุการณ์|โครงสร้างของเหตุการณ์|ವಿವರಣೆ|కథనం|ਪਟਕਥਾ ਰੂਪ ਰੇਖਾ|ਪਟਕਥਾ ਢਾਂਚਾ|परिदृश्य रूपरेखा|سيناريو مخطط|الگوی سناریو|תבנית תרחיש|Сценарийның төзелеше|Сценарий структураси|Структура сценарію|Структура сценария|Структура сценарија|Скица|Рамка на сценарий|Концепт|Περιγραφή Σεναρίου|Wharrimean is|Template Situai|Template Senario|Template Keadaan|Tapausaihio|Szenariogrundriss|Szablon scenariusza|Swa hwær swa|Swa hwaer swa|Struktura scenarija|Structură scenariu|Structura scenariu|Skica|Skenario konsep|Shiver me timbers|Senaryo taslağı|Schema dello scenario|Scenariomall|Scenariomal|Scenario Template|Scenario Outline|Scenario Amlinellol|Scenārijs pēc parauga|Scenarijaus šablonas|Reckon it's like|Raamstsenaarium|Plang vum Szenario|Plan du Scénario|Plan du scénario|Osnova scénáře|Osnova Scenára|Náčrt Scenáru|Náčrt Scénáře|Náčrt Scenára|MISHUN SRSLY|Menggariskan Senario|Lýsing Dæma|Lýsing Atburðarásar|Konturo de la scenaro|Koncept|Khung tình huống|Khung kịch bản|Forgatókönyv vázlat|Esquema do Cenário|Esquema do Cenario|Esquema del escenario|Esquema de l'escenari|Esbozo do escenario|Delineação do Cenário|Delineacao do Cenario|All y'all|Abstrakt Scenario|Abstract Scenario):/)) {
        state.allowPlaceholders = true;
        state.allowSteps = true;
        state.allowMultilineArgument = false;
        state.inKeywordLine = true;
        return "keyword";

      // EXAMPLES
      } else if (state.allowScenario && stream.match(/(例子|例|サンプル|예|ชุดของเหตุการณ์|ชุดของตัวอย่าง|ಉದಾಹರಣೆಗಳು|ఉదాహరణలు|ਉਦਾਹਰਨਾਂ|उदाहरण|نمونه ها|امثلة|דוגמאות|Үрнәкләр|Сценарији|Примеры|Примери|Приклади|Мисоллар|Мисаллар|Σενάρια|Παραδείγματα|You'll wanna|Voorbeelden|Variantai|Tapaukset|Se þe|Se the|Se ðe|Scenarios|Scenariji|Scenarijai|Przykłady|Primjeri|Primeri|Příklady|Príklady|Piemēri|Példák|Pavyzdžiai|Paraugs|Örnekler|Juhtumid|Exemplos|Exemples|Exemple|Exempel|EXAMPLZ|Examples|Esempi|Enghreifftiau|Ekzemploj|Eksempler|Ejemplos|Dữ liệu|Dead men tell no tales|Dæmi|Contoh|Cenários|Cenarios|Beispiller|Beispiele|Atburðarásir):/)) {
        state.allowPlaceholders = false;
        state.allowSteps = true;
        state.allowBackground = false;
        state.allowMultilineArgument = true;
        return "keyword";

      // SCENARIO
      } else if (!state.inKeywordLine && state.allowScenario && stream.match(/(場景|场景|劇本|剧本|シナリオ|시나리오|เหตุการณ์|ಕಥಾಸಾರಾಂಶ|సన్నివేశం|ਪਟਕਥਾ|परिदृश्य|سيناريو|سناریو|תרחיש|Сценарій|Сценарио|Сценарий|Пример|Σενάριο|Tình huống|The thing of it is|Tapaus|Szenario|Swa|Stsenaarium|Skenario|Situai|Senaryo|Senario|Scenaro|Scenariusz|Scenariu|Scénario|Scenario|Scenarijus|Scenārijs|Scenarij|Scenarie|Scénář|Scenár|Primer|MISHUN|Kịch bản|Keadaan|Heave to|Forgatókönyv|Escenario|Escenari|Cenário|Cenario|Awww, look mate|Atburðarás):/)) {
        state.allowPlaceholders = false;
        state.allowSteps = true;
        state.allowBackground = false;
        state.allowMultilineArgument = false;
        state.inKeywordLine = true;
        return "keyword";

      // STEPS
      } else if (!state.inKeywordLine && state.allowSteps && stream.match(/(那麼|那么|而且|當|当|并且|同時|同时|前提|假设|假設|假定|假如|但是|但し|並且|もし|ならば|ただし|しかし|かつ|하지만|조건|먼저|만일|만약|단|그리고|그러면|และ |เมื่อ |แต่ |ดังนั้น |กำหนดให้ |ಸ್ಥಿತಿಯನ್ನು |ಮತ್ತು |ನೀಡಿದ |ನಂತರ |ಆದರೆ |మరియు |చెప్పబడినది |కాని |ఈ పరిస్థితిలో |అప్పుడు |ਪਰ |ਤਦ |ਜੇਕਰ |ਜਿਵੇਂ ਕਿ |ਜਦੋਂ |ਅਤੇ |यदि |परन्तु |पर |तब |तदा |तथा |जब |चूंकि |किन्तु |कदा |और |अगर |و |هنگامی |متى |لكن |عندما |ثم |بفرض |با فرض |اما |اذاً |آنگاه |כאשר |וגם |בהינתן |אזי |אז |אבל |Якщо |Һәм |Унда |Тоді |Тогда |То |Также |Та |Пусть |Припустимо, що |Припустимо |Онда |Но |Нехай |Нәтиҗәдә |Лекин |Ләкин |Коли |Когда |Когато |Када |Кад |К тому же |І |И |Задато |Задати |Задате |Если |Допустим |Дано |Дадено |Вә |Ва |Бирок |Әмма |Әйтик |Әгәр |Аммо |Али |Але |Агар |А також |А |Τότε |Όταν |Και |Δεδομένου |Αλλά |Þurh |Þegar |Þa þe |Þá |Þa |Zatati |Zakładając |Zadato |Zadate |Zadano |Zadani |Zadan |Za předpokladu |Za predpokladu |Youse know when youse got |Youse know like when |Yna |Yeah nah |Y'know |Y |Wun |Wtedy |When y'all |When |Wenn |WEN |wann |Ve |Và |Und |Un |ugeholl |Too right |Thurh |Thì |Then y'all |Then |Tha the |Tha |Tetapi |Tapi |Tak |Tada |Tad |Stel |Soit |Siis |Și |Şi |Si |Sed |Se |Så |Quando |Quand |Quan |Pryd |Potom |Pokud |Pokiaľ |Però |Pero |Pak |Oraz |Onda |Ond |Oletetaan |Og |Och |O zaman |Niin |Nhưng |När |Når |Mutta |Men |Mas |Maka |Majd |Mając |Mais |Maar |mä |Ma |Lorsque |Lorsqu'|Logo |Let go and haul |Kun |Kuid |Kui |Kiedy |Khi |Ketika |Kemudian |Keď |Když |Kaj |Kai |Kada |Kad |Jeżeli |Jeśli |Ja |It's just unbelievable |Ir |I CAN HAZ |I |Ha |Givun |Givet |Given y'all |Given |Gitt |Gegeven |Gegeben seien |Gegeben sei |Gdy |Gangway! |Fakat |Étant donnés |Etant donnés |Étant données |Etant données |Étant donnée |Etant donnée |Étant donné |Etant donné |Et |És |Entonces |Entón |Então |Entao |En |Eğer ki |Ef |Eeldades |E |Ðurh |Duota |Dun |Donitaĵo |Donat |Donada |Do |Diyelim ki |Diberi |Dengan |Den youse gotta |DEN |De |Dato |Dați fiind |Daţi fiind |Dati fiind |Dati |Date fiind |Date |Data |Dat fiind |Dar |Dann |dann |Dan |Dados |Dado |Dadas |Dada |Ða ðe |Ða |Cuando |Cho |Cando |Când |Cand |Cal |But y'all |But at the end of the day I reckon |BUT |But |Buh |Blimey! |Biết |Bet |Bagi |Aye |awer |Avast! |Atunci |Atesa |Atès |Apabila |Anrhegedig a |Angenommen |And y'all |And |AN |An |an |Amikor |Amennyiben |Ama |Als |Alors |Allora |Ali |Aleshores |Ale |Akkor |Ak |Adott |Ac |Aber |A zároveň |A tiež |A taktiež |A také |A |a |7 |\* )/)) {
        state.inStep = true;
        state.allowPlaceholders = true;
        state.allowMultilineArgument = true;
        state.inKeywordLine = true;
        return "keyword";

      // INLINE STRING
      } else if (stream.match(/"[^"]*"?/)) {
        return "string";

      // PLACEHOLDER
      } else if (state.allowPlaceholders && stream.match(/<[^>]*>?/)) {
        return "variable";

      // Fall through
      } else {
        stream.next();
        stream.eatWhile(/[^@"<#]/);
        return null;
      }
    }
  };
});

CodeMirror.defineMIME("text/x-feature", "gherkin");

});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/go/go.js":
/*!******************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/go/go.js ***!
  \******************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"));
  else {}
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode("go", function(config) {
  var indentUnit = config.indentUnit;

  var keywords = {
    "break":true, "case":true, "chan":true, "const":true, "continue":true,
    "default":true, "defer":true, "else":true, "fallthrough":true, "for":true,
    "func":true, "go":true, "goto":true, "if":true, "import":true,
    "interface":true, "map":true, "package":true, "range":true, "return":true,
    "select":true, "struct":true, "switch":true, "type":true, "var":true,
    "bool":true, "byte":true, "complex64":true, "complex128":true,
    "float32":true, "float64":true, "int8":true, "int16":true, "int32":true,
    "int64":true, "string":true, "uint8":true, "uint16":true, "uint32":true,
    "uint64":true, "int":true, "uint":true, "uintptr":true, "error": true,
    "rune":true
  };

  var atoms = {
    "true":true, "false":true, "iota":true, "nil":true, "append":true,
    "cap":true, "close":true, "complex":true, "copy":true, "delete":true, "imag":true,
    "len":true, "make":true, "new":true, "panic":true, "print":true,
    "println":true, "real":true, "recover":true
  };

  var isOperatorChar = /[+\-*&^%:=<>!|\/]/;

  var curPunc;

  function tokenBase(stream, state) {
    var ch = stream.next();
    if (ch == '"' || ch == "'" || ch == "`") {
      state.tokenize = tokenString(ch);
      return state.tokenize(stream, state);
    }
    if (/[\d\.]/.test(ch)) {
      if (ch == ".") {
        stream.match(/^[0-9]+([eE][\-+]?[0-9]+)?/);
      } else if (ch == "0") {
        stream.match(/^[xX][0-9a-fA-F]+/) || stream.match(/^0[0-7]+/);
      } else {
        stream.match(/^[0-9]*\.?[0-9]*([eE][\-+]?[0-9]+)?/);
      }
      return "number";
    }
    if (/[\[\]{}\(\),;\:\.]/.test(ch)) {
      curPunc = ch;
      return null;
    }
    if (ch == "/") {
      if (stream.eat("*")) {
        state.tokenize = tokenComment;
        return tokenComment(stream, state);
      }
      if (stream.eat("/")) {
        stream.skipToEnd();
        return "comment";
      }
    }
    if (isOperatorChar.test(ch)) {
      stream.eatWhile(isOperatorChar);
      return "operator";
    }
    stream.eatWhile(/[\w\$_\xa1-\uffff]/);
    var cur = stream.current();
    if (keywords.propertyIsEnumerable(cur)) {
      if (cur == "case" || cur == "default") curPunc = "case";
      return "keyword";
    }
    if (atoms.propertyIsEnumerable(cur)) return "atom";
    return "variable";
  }

  function tokenString(quote) {
    return function(stream, state) {
      var escaped = false, next, end = false;
      while ((next = stream.next()) != null) {
        if (next == quote && !escaped) {end = true; break;}
        escaped = !escaped && quote != "`" && next == "\\";
      }
      if (end || !(escaped || quote == "`"))
        state.tokenize = tokenBase;
      return "string";
    };
  }

  function tokenComment(stream, state) {
    var maybeEnd = false, ch;
    while (ch = stream.next()) {
      if (ch == "/" && maybeEnd) {
        state.tokenize = tokenBase;
        break;
      }
      maybeEnd = (ch == "*");
    }
    return "comment";
  }

  function Context(indented, column, type, align, prev) {
    this.indented = indented;
    this.column = column;
    this.type = type;
    this.align = align;
    this.prev = prev;
  }
  function pushContext(state, col, type) {
    return state.context = new Context(state.indented, col, type, null, state.context);
  }
  function popContext(state) {
    if (!state.context.prev) return;
    var t = state.context.type;
    if (t == ")" || t == "]" || t == "}")
      state.indented = state.context.indented;
    return state.context = state.context.prev;
  }

  // Interface

  return {
    startState: function(basecolumn) {
      return {
        tokenize: null,
        context: new Context((basecolumn || 0) - indentUnit, 0, "top", false),
        indented: 0,
        startOfLine: true
      };
    },

    token: function(stream, state) {
      var ctx = state.context;
      if (stream.sol()) {
        if (ctx.align == null) ctx.align = false;
        state.indented = stream.indentation();
        state.startOfLine = true;
        if (ctx.type == "case") ctx.type = "}";
      }
      if (stream.eatSpace()) return null;
      curPunc = null;
      var style = (state.tokenize || tokenBase)(stream, state);
      if (style == "comment") return style;
      if (ctx.align == null) ctx.align = true;

      if (curPunc == "{") pushContext(state, stream.column(), "}");
      else if (curPunc == "[") pushContext(state, stream.column(), "]");
      else if (curPunc == "(") pushContext(state, stream.column(), ")");
      else if (curPunc == "case") ctx.type = "case";
      else if (curPunc == "}" && ctx.type == "}") popContext(state);
      else if (curPunc == ctx.type) popContext(state);
      state.startOfLine = false;
      return style;
    },

    indent: function(state, textAfter) {
      if (state.tokenize != tokenBase && state.tokenize != null) return CodeMirror.Pass;
      var ctx = state.context, firstChar = textAfter && textAfter.charAt(0);
      if (ctx.type == "case" && /^(?:case|default)\b/.test(textAfter)) {
        state.context.type = "}";
        return ctx.indented;
      }
      var closing = firstChar == ctx.type;
      if (ctx.align) return ctx.column + (closing ? 0 : 1);
      else return ctx.indented + (closing ? 0 : indentUnit);
    },

    electricChars: "{}):",
    closeBrackets: "()[]{}''\"\"``",
    fold: "brace",
    blockCommentStart: "/*",
    blockCommentEnd: "*/",
    lineComment: "//"
  };
});

CodeMirror.defineMIME("text/x-go", "go");

});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/groovy/groovy.js":
/*!**************************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/groovy/groovy.js ***!
  \**************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"));
  else {}
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode("groovy", function(config) {
  function words(str) {
    var obj = {}, words = str.split(" ");
    for (var i = 0; i < words.length; ++i) obj[words[i]] = true;
    return obj;
  }
  var keywords = words(
    "abstract as assert boolean break byte case catch char class const continue def default " +
    "do double else enum extends final finally float for goto if implements import in " +
    "instanceof int interface long native new package private protected public return " +
    "short static strictfp super switch synchronized threadsafe throw throws trait transient " +
    "try void volatile while");
  var blockKeywords = words("catch class def do else enum finally for if interface switch trait try while");
  var standaloneKeywords = words("return break continue");
  var atoms = words("null true false this");

  var curPunc;
  function tokenBase(stream, state) {
    var ch = stream.next();
    if (ch == '"' || ch == "'") {
      return startString(ch, stream, state);
    }
    if (/[\[\]{}\(\),;\:\.]/.test(ch)) {
      curPunc = ch;
      return null;
    }
    if (/\d/.test(ch)) {
      stream.eatWhile(/[\w\.]/);
      if (stream.eat(/eE/)) { stream.eat(/\+\-/); stream.eatWhile(/\d/); }
      return "number";
    }
    if (ch == "/") {
      if (stream.eat("*")) {
        state.tokenize.push(tokenComment);
        return tokenComment(stream, state);
      }
      if (stream.eat("/")) {
        stream.skipToEnd();
        return "comment";
      }
      if (expectExpression(state.lastToken, false)) {
        return startString(ch, stream, state);
      }
    }
    if (ch == "-" && stream.eat(">")) {
      curPunc = "->";
      return null;
    }
    if (/[+\-*&%=<>!?|\/~]/.test(ch)) {
      stream.eatWhile(/[+\-*&%=<>|~]/);
      return "operator";
    }
    stream.eatWhile(/[\w\$_]/);
    if (ch == "@") { stream.eatWhile(/[\w\$_\.]/); return "meta"; }
    if (state.lastToken == ".") return "property";
    if (stream.eat(":")) { curPunc = "proplabel"; return "property"; }
    var cur = stream.current();
    if (atoms.propertyIsEnumerable(cur)) { return "atom"; }
    if (keywords.propertyIsEnumerable(cur)) {
      if (blockKeywords.propertyIsEnumerable(cur)) curPunc = "newstatement";
      else if (standaloneKeywords.propertyIsEnumerable(cur)) curPunc = "standalone";
      return "keyword";
    }
    return "variable";
  }
  tokenBase.isBase = true;

  function startString(quote, stream, state) {
    var tripleQuoted = false;
    if (quote != "/" && stream.eat(quote)) {
      if (stream.eat(quote)) tripleQuoted = true;
      else return "string";
    }
    function t(stream, state) {
      var escaped = false, next, end = !tripleQuoted;
      while ((next = stream.next()) != null) {
        if (next == quote && !escaped) {
          if (!tripleQuoted) { break; }
          if (stream.match(quote + quote)) { end = true; break; }
        }
        if (quote == '"' && next == "$" && !escaped && stream.eat("{")) {
          state.tokenize.push(tokenBaseUntilBrace());
          return "string";
        }
        escaped = !escaped && next == "\\";
      }
      if (end) state.tokenize.pop();
      return "string";
    }
    state.tokenize.push(t);
    return t(stream, state);
  }

  function tokenBaseUntilBrace() {
    var depth = 1;
    function t(stream, state) {
      if (stream.peek() == "}") {
        depth--;
        if (depth == 0) {
          state.tokenize.pop();
          return state.tokenize[state.tokenize.length-1](stream, state);
        }
      } else if (stream.peek() == "{") {
        depth++;
      }
      return tokenBase(stream, state);
    }
    t.isBase = true;
    return t;
  }

  function tokenComment(stream, state) {
    var maybeEnd = false, ch;
    while (ch = stream.next()) {
      if (ch == "/" && maybeEnd) {
        state.tokenize.pop();
        break;
      }
      maybeEnd = (ch == "*");
    }
    return "comment";
  }

  function expectExpression(last, newline) {
    return !last || last == "operator" || last == "->" || /[\.\[\{\(,;:]/.test(last) ||
      last == "newstatement" || last == "keyword" || last == "proplabel" ||
      (last == "standalone" && !newline);
  }

  function Context(indented, column, type, align, prev) {
    this.indented = indented;
    this.column = column;
    this.type = type;
    this.align = align;
    this.prev = prev;
  }
  function pushContext(state, col, type) {
    return state.context = new Context(state.indented, col, type, null, state.context);
  }
  function popContext(state) {
    var t = state.context.type;
    if (t == ")" || t == "]" || t == "}")
      state.indented = state.context.indented;
    return state.context = state.context.prev;
  }

  // Interface

  return {
    startState: function(basecolumn) {
      return {
        tokenize: [tokenBase],
        context: new Context((basecolumn || 0) - config.indentUnit, 0, "top", false),
        indented: 0,
        startOfLine: true,
        lastToken: null
      };
    },

    token: function(stream, state) {
      var ctx = state.context;
      if (stream.sol()) {
        if (ctx.align == null) ctx.align = false;
        state.indented = stream.indentation();
        state.startOfLine = true;
        // Automatic semicolon insertion
        if (ctx.type == "statement" && !expectExpression(state.lastToken, true)) {
          popContext(state); ctx = state.context;
        }
      }
      if (stream.eatSpace()) return null;
      curPunc = null;
      var style = state.tokenize[state.tokenize.length-1](stream, state);
      if (style == "comment") return style;
      if (ctx.align == null) ctx.align = true;

      if ((curPunc == ";" || curPunc == ":") && ctx.type == "statement") popContext(state);
      // Handle indentation for {x -> \n ... }
      else if (curPunc == "->" && ctx.type == "statement" && ctx.prev.type == "}") {
        popContext(state);
        state.context.align = false;
      }
      else if (curPunc == "{") pushContext(state, stream.column(), "}");
      else if (curPunc == "[") pushContext(state, stream.column(), "]");
      else if (curPunc == "(") pushContext(state, stream.column(), ")");
      else if (curPunc == "}") {
        while (ctx.type == "statement") ctx = popContext(state);
        if (ctx.type == "}") ctx = popContext(state);
        while (ctx.type == "statement") ctx = popContext(state);
      }
      else if (curPunc == ctx.type) popContext(state);
      else if (ctx.type == "}" || ctx.type == "top" || (ctx.type == "statement" && curPunc == "newstatement"))
        pushContext(state, stream.column(), "statement");
      state.startOfLine = false;
      state.lastToken = curPunc || style;
      return style;
    },

    indent: function(state, textAfter) {
      if (!state.tokenize[state.tokenize.length-1].isBase) return CodeMirror.Pass;
      var firstChar = textAfter && textAfter.charAt(0), ctx = state.context;
      if (ctx.type == "statement" && !expectExpression(state.lastToken, true)) ctx = ctx.prev;
      var closing = firstChar == ctx.type;
      if (ctx.type == "statement") return ctx.indented + (firstChar == "{" ? 0 : config.indentUnit);
      else if (ctx.align) return ctx.column + (closing ? 0 : 1);
      else return ctx.indented + (closing ? 0 : config.indentUnit);
    },

    electricChars: "{}",
    closeBrackets: {triples: "'\""},
    fold: "brace"
  };
});

CodeMirror.defineMIME("text/x-groovy", "groovy");

});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/haml/haml.js":
/*!**********************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/haml/haml.js ***!
  \**********************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"), __webpack_require__(/*! ../htmlmixed/htmlmixed */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/htmlmixed/htmlmixed.js"), __webpack_require__(/*! ../ruby/ruby */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/ruby/ruby.js"));
  else {}
})(function(CodeMirror) {
"use strict";

  // full haml mode. This handled embedded ruby and html fragments too
  CodeMirror.defineMode("haml", function(config) {
    var htmlMode = CodeMirror.getMode(config, {name: "htmlmixed"});
    var rubyMode = CodeMirror.getMode(config, "ruby");

    function rubyInQuote(endQuote) {
      return function(stream, state) {
        var ch = stream.peek();
        if (ch == endQuote && state.rubyState.tokenize.length == 1) {
          // step out of ruby context as it seems to complete processing all the braces
          stream.next();
          state.tokenize = html;
          return "closeAttributeTag";
        } else {
          return ruby(stream, state);
        }
      };
    }

    function ruby(stream, state) {
      if (stream.match("-#")) {
        stream.skipToEnd();
        return "comment";
      }
      return rubyMode.token(stream, state.rubyState);
    }

    function html(stream, state) {
      var ch = stream.peek();

      // handle haml declarations. All declarations that cant be handled here
      // will be passed to html mode
      if (state.previousToken.style == "comment" ) {
        if (state.indented > state.previousToken.indented) {
          stream.skipToEnd();
          return "commentLine";
        }
      }

      if (state.startOfLine) {
        if (ch == "!" && stream.match("!!")) {
          stream.skipToEnd();
          return "tag";
        } else if (stream.match(/^%[\w:#\.]+=/)) {
          state.tokenize = ruby;
          return "hamlTag";
        } else if (stream.match(/^%[\w:]+/)) {
          return "hamlTag";
        } else if (ch == "/" ) {
          stream.skipToEnd();
          return "comment";
        }
      }

      if (state.startOfLine || state.previousToken.style == "hamlTag") {
        if ( ch == "#" || ch == ".") {
          stream.match(/[\w-#\.]*/);
          return "hamlAttribute";
        }
      }

      // donot handle --> as valid ruby, make it HTML close comment instead
      if (state.startOfLine && !stream.match("-->", false) && (ch == "=" || ch == "-" )) {
        state.tokenize = ruby;
        return state.tokenize(stream, state);
      }

      if (state.previousToken.style == "hamlTag" ||
          state.previousToken.style == "closeAttributeTag" ||
          state.previousToken.style == "hamlAttribute") {
        if (ch == "(") {
          state.tokenize = rubyInQuote(")");
          return state.tokenize(stream, state);
        } else if (ch == "{") {
          if (!stream.match(/^\{%.*/)) {
            state.tokenize = rubyInQuote("}");
            return state.tokenize(stream, state);
          }
        }
      }

      return htmlMode.token(stream, state.htmlState);
    }

    return {
      // default to html mode
      startState: function() {
        var htmlState = CodeMirror.startState(htmlMode);
        var rubyState = CodeMirror.startState(rubyMode);
        return {
          htmlState: htmlState,
          rubyState: rubyState,
          indented: 0,
          previousToken: { style: null, indented: 0},
          tokenize: html
        };
      },

      copyState: function(state) {
        return {
          htmlState : CodeMirror.copyState(htmlMode, state.htmlState),
          rubyState: CodeMirror.copyState(rubyMode, state.rubyState),
          indented: state.indented,
          previousToken: state.previousToken,
          tokenize: state.tokenize
        };
      },

      token: function(stream, state) {
        if (stream.sol()) {
          state.indented = stream.indentation();
          state.startOfLine = true;
        }
        if (stream.eatSpace()) return null;
        var style = state.tokenize(stream, state);
        state.startOfLine = false;
        // dont record comment line as we only want to measure comment line with
        // the opening comment block
        if (style && style != "commentLine") {
          state.previousToken = { style: style, indented: state.indented };
        }
        // if current state is ruby and the previous token is not `,` reset the
        // tokenize to html
        if (stream.eol() && state.tokenize == ruby) {
          stream.backUp(1);
          var ch = stream.peek();
          stream.next();
          if (ch && ch != ",") {
            state.tokenize = html;
          }
        }
        // reprocess some of the specific style tag when finish setting previousToken
        if (style == "hamlTag") {
          style = "tag";
        } else if (style == "commentLine") {
          style = "comment";
        } else if (style == "hamlAttribute") {
          style = "attribute";
        } else if (style == "closeAttributeTag") {
          style = null;
        }
        return style;
      }
    };
  }, "htmlmixed", "ruby");

  CodeMirror.defineMIME("text/x-haml", "haml");
});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/handlebars/handlebars.js":
/*!**********************************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/handlebars/handlebars.js ***!
  \**********************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"), __webpack_require__(/*! ../../addon/mode/simple */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/addon/mode/simple.js"), __webpack_require__(/*! ../../addon/mode/multiplex */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/addon/mode/multiplex.js"));
  else {}
})(function(CodeMirror) {
  "use strict";

  CodeMirror.defineSimpleMode("handlebars-tags", {
    start: [
      { regex: /\{\{!--/, push: "dash_comment", token: "comment" },
      { regex: /\{\{!/,   push: "comment", token: "comment" },
      { regex: /\{\{/,    push: "handlebars", token: "tag" }
    ],
    handlebars: [
      { regex: /\}\}/, pop: true, token: "tag" },

      // Double and single quotes
      { regex: /"(?:[^\\"]|\\.)*"?/, token: "string" },
      { regex: /'(?:[^\\']|\\.)*'?/, token: "string" },

      // Handlebars keywords
      { regex: />|[#\/]([A-Za-z_]\w*)/, token: "keyword" },
      { regex: /(?:else|this)\b/, token: "keyword" },

      // Numeral
      { regex: /\d+/i, token: "number" },

      // Atoms like = and .
      { regex: /=|~|@|true|false/, token: "atom" },

      // Paths
      { regex: /(?:\.\.\/)*(?:[A-Za-z_][\w\.]*)+/, token: "variable-2" }
    ],
    dash_comment: [
      { regex: /--\}\}/, pop: true, token: "comment" },

      // Commented code
      { regex: /./, token: "comment"}
    ],
    comment: [
      { regex: /\}\}/, pop: true, token: "comment" },
      { regex: /./, token: "comment" }
    ],
    meta: {
      blockCommentStart: "{{--",
      blockCommentEnd: "--}}"
    }
  });

  CodeMirror.defineMode("handlebars", function(config, parserConfig) {
    var handlebars = CodeMirror.getMode(config, "handlebars-tags");
    if (!parserConfig || !parserConfig.base) return handlebars;
    return CodeMirror.multiplexingMode(
      CodeMirror.getMode(config, parserConfig.base),
      {open: "{{", close: "}}", mode: handlebars, parseDelimiters: true}
    );
  });

  CodeMirror.defineMIME("text/x-handlebars-template", "handlebars");
});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/haskell-literate/haskell-literate.js":
/*!**********************************************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/haskell-literate/haskell-literate.js ***!
  \**********************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function (mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"), __webpack_require__(/*! ../haskell/haskell */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/haskell/haskell.js"))
  else {}
})(function (CodeMirror) {
  "use strict"

  CodeMirror.defineMode("haskell-literate", function (config, parserConfig) {
    var baseMode = CodeMirror.getMode(config, (parserConfig && parserConfig.base) || "haskell")

    return {
      startState: function () {
        return {
          inCode: false,
          baseState: CodeMirror.startState(baseMode)
        }
      },
      token: function (stream, state) {
        if (stream.sol()) {
          if (state.inCode = stream.eat(">"))
            return "meta"
        }
        if (state.inCode) {
          return baseMode.token(stream, state.baseState)
        } else {
          stream.skipToEnd()
          return "comment"
        }
      },
      innerMode: function (state) {
        return state.inCode ? {state: state.baseState, mode: baseMode} : null
      }
    }
  }, "haskell")

  CodeMirror.defineMIME("text/x-literate-haskell", "haskell-literate")
});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/haskell/haskell.js":
/*!****************************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/haskell/haskell.js ***!
  \****************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"));
  else {}
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode("haskell", function(_config, modeConfig) {

  function switchState(source, setState, f) {
    setState(f);
    return f(source, setState);
  }

  // These should all be Unicode extended, as per the Haskell 2010 report
  var smallRE = /[a-z_]/;
  var largeRE = /[A-Z]/;
  var digitRE = /\d/;
  var hexitRE = /[0-9A-Fa-f]/;
  var octitRE = /[0-7]/;
  var idRE = /[a-z_A-Z0-9'\xa1-\uffff]/;
  var symbolRE = /[-!#$%&*+.\/<=>?@\\^|~:]/;
  var specialRE = /[(),;[\]`{}]/;
  var whiteCharRE = /[ \t\v\f]/; // newlines are handled in tokenizer

  function normal(source, setState) {
    if (source.eatWhile(whiteCharRE)) {
      return null;
    }

    var ch = source.next();
    if (specialRE.test(ch)) {
      if (ch == '{' && source.eat('-')) {
        var t = "comment";
        if (source.eat('#')) {
          t = "meta";
        }
        return switchState(source, setState, ncomment(t, 1));
      }
      return null;
    }

    if (ch == '\'') {
      if (source.eat('\\')) {
        source.next();  // should handle other escapes here
      }
      else {
        source.next();
      }
      if (source.eat('\'')) {
        return "string";
      }
      return "string error";
    }

    if (ch == '"') {
      return switchState(source, setState, stringLiteral);
    }

    if (largeRE.test(ch)) {
      source.eatWhile(idRE);
      if (source.eat('.')) {
        return "qualifier";
      }
      return "variable-2";
    }

    if (smallRE.test(ch)) {
      source.eatWhile(idRE);
      return "variable";
    }

    if (digitRE.test(ch)) {
      if (ch == '0') {
        if (source.eat(/[xX]/)) {
          source.eatWhile(hexitRE); // should require at least 1
          return "integer";
        }
        if (source.eat(/[oO]/)) {
          source.eatWhile(octitRE); // should require at least 1
          return "number";
        }
      }
      source.eatWhile(digitRE);
      var t = "number";
      if (source.match(/^\.\d+/)) {
        t = "number";
      }
      if (source.eat(/[eE]/)) {
        t = "number";
        source.eat(/[-+]/);
        source.eatWhile(digitRE); // should require at least 1
      }
      return t;
    }

    if (ch == "." && source.eat("."))
      return "keyword";

    if (symbolRE.test(ch)) {
      if (ch == '-' && source.eat(/-/)) {
        source.eatWhile(/-/);
        if (!source.eat(symbolRE)) {
          source.skipToEnd();
          return "comment";
        }
      }
      var t = "variable";
      if (ch == ':') {
        t = "variable-2";
      }
      source.eatWhile(symbolRE);
      return t;
    }

    return "error";
  }

  function ncomment(type, nest) {
    if (nest == 0) {
      return normal;
    }
    return function(source, setState) {
      var currNest = nest;
      while (!source.eol()) {
        var ch = source.next();
        if (ch == '{' && source.eat('-')) {
          ++currNest;
        }
        else if (ch == '-' && source.eat('}')) {
          --currNest;
          if (currNest == 0) {
            setState(normal);
            return type;
          }
        }
      }
      setState(ncomment(type, currNest));
      return type;
    };
  }

  function stringLiteral(source, setState) {
    while (!source.eol()) {
      var ch = source.next();
      if (ch == '"') {
        setState(normal);
        return "string";
      }
      if (ch == '\\') {
        if (source.eol() || source.eat(whiteCharRE)) {
          setState(stringGap);
          return "string";
        }
        if (source.eat('&')) {
        }
        else {
          source.next(); // should handle other escapes here
        }
      }
    }
    setState(normal);
    return "string error";
  }

  function stringGap(source, setState) {
    if (source.eat('\\')) {
      return switchState(source, setState, stringLiteral);
    }
    source.next();
    setState(normal);
    return "error";
  }


  var wellKnownWords = (function() {
    var wkw = {};
    function setType(t) {
      return function () {
        for (var i = 0; i < arguments.length; i++)
          wkw[arguments[i]] = t;
      };
    }

    setType("keyword")(
      "case", "class", "data", "default", "deriving", "do", "else", "foreign",
      "if", "import", "in", "infix", "infixl", "infixr", "instance", "let",
      "module", "newtype", "of", "then", "type", "where", "_");

    setType("keyword")(
      "\.\.", ":", "::", "=", "\\", "<-", "->", "@", "~", "=>");

    setType("builtin")(
      "!!", "$!", "$", "&&", "+", "++", "-", ".", "/", "/=", "<", "<*", "<=",
      "<$>", "<*>", "=<<", "==", ">", ">=", ">>", ">>=", "^", "^^", "||", "*",
      "*>", "**");

    setType("builtin")(
      "Applicative", "Bool", "Bounded", "Char", "Double", "EQ", "Either", "Enum",
      "Eq", "False", "FilePath", "Float", "Floating", "Fractional", "Functor",
      "GT", "IO", "IOError", "Int", "Integer", "Integral", "Just", "LT", "Left",
      "Maybe", "Monad", "Nothing", "Num", "Ord", "Ordering", "Rational", "Read",
      "ReadS", "Real", "RealFloat", "RealFrac", "Right", "Show", "ShowS",
      "String", "True");

    setType("builtin")(
      "abs", "acos", "acosh", "all", "and", "any", "appendFile", "asTypeOf",
      "asin", "asinh", "atan", "atan2", "atanh", "break", "catch", "ceiling",
      "compare", "concat", "concatMap", "const", "cos", "cosh", "curry",
      "cycle", "decodeFloat", "div", "divMod", "drop", "dropWhile", "either",
      "elem", "encodeFloat", "enumFrom", "enumFromThen", "enumFromThenTo",
      "enumFromTo", "error", "even", "exp", "exponent", "fail", "filter",
      "flip", "floatDigits", "floatRadix", "floatRange", "floor", "fmap",
      "foldl", "foldl1", "foldr", "foldr1", "fromEnum", "fromInteger",
      "fromIntegral", "fromRational", "fst", "gcd", "getChar", "getContents",
      "getLine", "head", "id", "init", "interact", "ioError", "isDenormalized",
      "isIEEE", "isInfinite", "isNaN", "isNegativeZero", "iterate", "last",
      "lcm", "length", "lex", "lines", "log", "logBase", "lookup", "map",
      "mapM", "mapM_", "max", "maxBound", "maximum", "maybe", "min", "minBound",
      "minimum", "mod", "negate", "not", "notElem", "null", "odd", "or",
      "otherwise", "pi", "pred", "print", "product", "properFraction", "pure",
      "putChar", "putStr", "putStrLn", "quot", "quotRem", "read", "readFile",
      "readIO", "readList", "readLn", "readParen", "reads", "readsPrec",
      "realToFrac", "recip", "rem", "repeat", "replicate", "return", "reverse",
      "round", "scaleFloat", "scanl", "scanl1", "scanr", "scanr1", "seq",
      "sequence", "sequence_", "show", "showChar", "showList", "showParen",
      "showString", "shows", "showsPrec", "significand", "signum", "sin",
      "sinh", "snd", "span", "splitAt", "sqrt", "subtract", "succ", "sum",
      "tail", "take", "takeWhile", "tan", "tanh", "toEnum", "toInteger",
      "toRational", "truncate", "uncurry", "undefined", "unlines", "until",
      "unwords", "unzip", "unzip3", "userError", "words", "writeFile", "zip",
      "zip3", "zipWith", "zipWith3");

    var override = modeConfig.overrideKeywords;
    if (override) for (var word in override) if (override.hasOwnProperty(word))
      wkw[word] = override[word];

    return wkw;
  })();



  return {
    startState: function ()  { return { f: normal }; },
    copyState:  function (s) { return { f: s.f }; },

    token: function(stream, state) {
      var t = state.f(stream, function(s) { state.f = s; });
      var w = stream.current();
      return wellKnownWords.hasOwnProperty(w) ? wellKnownWords[w] : t;
    },

    blockCommentStart: "{-",
    blockCommentEnd: "-}",
    lineComment: "--"
  };

});

CodeMirror.defineMIME("text/x-haskell", "haskell");

});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/haxe/haxe.js":
/*!**********************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/haxe/haxe.js ***!
  \**********************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"));
  else {}
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode("haxe", function(config, parserConfig) {
  var indentUnit = config.indentUnit;

  // Tokenizer

  function kw(type) {return {type: type, style: "keyword"};}
  var A = kw("keyword a"), B = kw("keyword b"), C = kw("keyword c");
  var operator = kw("operator"), atom = {type: "atom", style: "atom"}, attribute = {type:"attribute", style: "attribute"};
  var type = kw("typedef");
  var keywords = {
    "if": A, "while": A, "else": B, "do": B, "try": B,
    "return": C, "break": C, "continue": C, "new": C, "throw": C,
    "var": kw("var"), "inline":attribute, "static": attribute, "using":kw("import"),
    "public": attribute, "private": attribute, "cast": kw("cast"), "import": kw("import"), "macro": kw("macro"),
    "function": kw("function"), "catch": kw("catch"), "untyped": kw("untyped"), "callback": kw("cb"),
    "for": kw("for"), "switch": kw("switch"), "case": kw("case"), "default": kw("default"),
    "in": operator, "never": kw("property_access"), "trace":kw("trace"),
    "class": type, "abstract":type, "enum":type, "interface":type, "typedef":type, "extends":type, "implements":type, "dynamic":type,
    "true": atom, "false": atom, "null": atom
  };

  var isOperatorChar = /[+\-*&%=<>!?|]/;

  function chain(stream, state, f) {
    state.tokenize = f;
    return f(stream, state);
  }

  function toUnescaped(stream, end) {
    var escaped = false, next;
    while ((next = stream.next()) != null) {
      if (next == end && !escaped)
        return true;
      escaped = !escaped && next == "\\";
    }
  }

  // Used as scratch variables to communicate multiple values without
  // consing up tons of objects.
  var type, content;
  function ret(tp, style, cont) {
    type = tp; content = cont;
    return style;
  }

  function haxeTokenBase(stream, state) {
    var ch = stream.next();
    if (ch == '"' || ch == "'") {
      return chain(stream, state, haxeTokenString(ch));
    } else if (/[\[\]{}\(\),;\:\.]/.test(ch)) {
      return ret(ch);
    } else if (ch == "0" && stream.eat(/x/i)) {
      stream.eatWhile(/[\da-f]/i);
      return ret("number", "number");
    } else if (/\d/.test(ch) || ch == "-" && stream.eat(/\d/)) {
      stream.match(/^\d*(?:\.\d*(?!\.))?(?:[eE][+\-]?\d+)?/);
      return ret("number", "number");
    } else if (state.reAllowed && (ch == "~" && stream.eat(/\//))) {
      toUnescaped(stream, "/");
      stream.eatWhile(/[gimsu]/);
      return ret("regexp", "string-2");
    } else if (ch == "/") {
      if (stream.eat("*")) {
        return chain(stream, state, haxeTokenComment);
      } else if (stream.eat("/")) {
        stream.skipToEnd();
        return ret("comment", "comment");
      } else {
        stream.eatWhile(isOperatorChar);
        return ret("operator", null, stream.current());
      }
    } else if (ch == "#") {
        stream.skipToEnd();
        return ret("conditional", "meta");
    } else if (ch == "@") {
      stream.eat(/:/);
      stream.eatWhile(/[\w_]/);
      return ret ("metadata", "meta");
    } else if (isOperatorChar.test(ch)) {
      stream.eatWhile(isOperatorChar);
      return ret("operator", null, stream.current());
    } else {
      var word;
      if(/[A-Z]/.test(ch)) {
        stream.eatWhile(/[\w_<>]/);
        word = stream.current();
        return ret("type", "variable-3", word);
      } else {
        stream.eatWhile(/[\w_]/);
        var word = stream.current(), known = keywords.propertyIsEnumerable(word) && keywords[word];
        return (known && state.kwAllowed) ? ret(known.type, known.style, word) :
                       ret("variable", "variable", word);
      }
    }
  }

  function haxeTokenString(quote) {
    return function(stream, state) {
      if (toUnescaped(stream, quote))
        state.tokenize = haxeTokenBase;
      return ret("string", "string");
    };
  }

  function haxeTokenComment(stream, state) {
    var maybeEnd = false, ch;
    while (ch = stream.next()) {
      if (ch == "/" && maybeEnd) {
        state.tokenize = haxeTokenBase;
        break;
      }
      maybeEnd = (ch == "*");
    }
    return ret("comment", "comment");
  }

  // Parser

  var atomicTypes = {"atom": true, "number": true, "variable": true, "string": true, "regexp": true};

  function HaxeLexical(indented, column, type, align, prev, info) {
    this.indented = indented;
    this.column = column;
    this.type = type;
    this.prev = prev;
    this.info = info;
    if (align != null) this.align = align;
  }

  function inScope(state, varname) {
    for (var v = state.localVars; v; v = v.next)
      if (v.name == varname) return true;
  }

  function parseHaxe(state, style, type, content, stream) {
    var cc = state.cc;
    // Communicate our context to the combinators.
    // (Less wasteful than consing up a hundred closures on every call.)
    cx.state = state; cx.stream = stream; cx.marked = null, cx.cc = cc;

    if (!state.lexical.hasOwnProperty("align"))
      state.lexical.align = true;

    while(true) {
      var combinator = cc.length ? cc.pop() : statement;
      if (combinator(type, content)) {
        while(cc.length && cc[cc.length - 1].lex)
          cc.pop()();
        if (cx.marked) return cx.marked;
        if (type == "variable" && inScope(state, content)) return "variable-2";
        if (type == "variable" && imported(state, content)) return "variable-3";
        return style;
      }
    }
  }

  function imported(state, typename) {
    if (/[a-z]/.test(typename.charAt(0)))
      return false;
    var len = state.importedtypes.length;
    for (var i = 0; i<len; i++)
      if(state.importedtypes[i]==typename) return true;
  }

  function registerimport(importname) {
    var state = cx.state;
    for (var t = state.importedtypes; t; t = t.next)
      if(t.name == importname) return;
    state.importedtypes = { name: importname, next: state.importedtypes };
  }
  // Combinator utils

  var cx = {state: null, column: null, marked: null, cc: null};
  function pass() {
    for (var i = arguments.length - 1; i >= 0; i--) cx.cc.push(arguments[i]);
  }
  function cont() {
    pass.apply(null, arguments);
    return true;
  }
  function inList(name, list) {
    for (var v = list; v; v = v.next)
      if (v.name == name) return true;
    return false;
  }
  function register(varname) {
    var state = cx.state;
    if (state.context) {
      cx.marked = "def";
      if (inList(varname, state.localVars)) return;
      state.localVars = {name: varname, next: state.localVars};
    } else if (state.globalVars) {
      if (inList(varname, state.globalVars)) return;
      state.globalVars = {name: varname, next: state.globalVars};
    }
  }

  // Combinators

  var defaultVars = {name: "this", next: null};
  function pushcontext() {
    if (!cx.state.context) cx.state.localVars = defaultVars;
    cx.state.context = {prev: cx.state.context, vars: cx.state.localVars};
  }
  function popcontext() {
    cx.state.localVars = cx.state.context.vars;
    cx.state.context = cx.state.context.prev;
  }
  popcontext.lex = true;
  function pushlex(type, info) {
    var result = function() {
      var state = cx.state;
      state.lexical = new HaxeLexical(state.indented, cx.stream.column(), type, null, state.lexical, info);
    };
    result.lex = true;
    return result;
  }
  function poplex() {
    var state = cx.state;
    if (state.lexical.prev) {
      if (state.lexical.type == ")")
        state.indented = state.lexical.indented;
      state.lexical = state.lexical.prev;
    }
  }
  poplex.lex = true;

  function expect(wanted) {
    function f(type) {
      if (type == wanted) return cont();
      else if (wanted == ";") return pass();
      else return cont(f);
    }
    return f;
  }

  function statement(type) {
    if (type == "@") return cont(metadef);
    if (type == "var") return cont(pushlex("vardef"), vardef1, expect(";"), poplex);
    if (type == "keyword a") return cont(pushlex("form"), expression, statement, poplex);
    if (type == "keyword b") return cont(pushlex("form"), statement, poplex);
    if (type == "{") return cont(pushlex("}"), pushcontext, block, poplex, popcontext);
    if (type == ";") return cont();
    if (type == "attribute") return cont(maybeattribute);
    if (type == "function") return cont(functiondef);
    if (type == "for") return cont(pushlex("form"), expect("("), pushlex(")"), forspec1, expect(")"),
                                   poplex, statement, poplex);
    if (type == "variable") return cont(pushlex("stat"), maybelabel);
    if (type == "switch") return cont(pushlex("form"), expression, pushlex("}", "switch"), expect("{"),
                                      block, poplex, poplex);
    if (type == "case") return cont(expression, expect(":"));
    if (type == "default") return cont(expect(":"));
    if (type == "catch") return cont(pushlex("form"), pushcontext, expect("("), funarg, expect(")"),
                                     statement, poplex, popcontext);
    if (type == "import") return cont(importdef, expect(";"));
    if (type == "typedef") return cont(typedef);
    return pass(pushlex("stat"), expression, expect(";"), poplex);
  }
  function expression(type) {
    if (atomicTypes.hasOwnProperty(type)) return cont(maybeoperator);
    if (type == "type" ) return cont(maybeoperator);
    if (type == "function") return cont(functiondef);
    if (type == "keyword c") return cont(maybeexpression);
    if (type == "(") return cont(pushlex(")"), maybeexpression, expect(")"), poplex, maybeoperator);
    if (type == "operator") return cont(expression);
    if (type == "[") return cont(pushlex("]"), commasep(maybeexpression, "]"), poplex, maybeoperator);
    if (type == "{") return cont(pushlex("}"), commasep(objprop, "}"), poplex, maybeoperator);
    return cont();
  }
  function maybeexpression(type) {
    if (type.match(/[;\}\)\],]/)) return pass();
    return pass(expression);
  }

  function maybeoperator(type, value) {
    if (type == "operator" && /\+\+|--/.test(value)) return cont(maybeoperator);
    if (type == "operator" || type == ":") return cont(expression);
    if (type == ";") return;
    if (type == "(") return cont(pushlex(")"), commasep(expression, ")"), poplex, maybeoperator);
    if (type == ".") return cont(property, maybeoperator);
    if (type == "[") return cont(pushlex("]"), expression, expect("]"), poplex, maybeoperator);
  }

  function maybeattribute(type) {
    if (type == "attribute") return cont(maybeattribute);
    if (type == "function") return cont(functiondef);
    if (type == "var") return cont(vardef1);
  }

  function metadef(type) {
    if(type == ":") return cont(metadef);
    if(type == "variable") return cont(metadef);
    if(type == "(") return cont(pushlex(")"), commasep(metaargs, ")"), poplex, statement);
  }
  function metaargs(type) {
    if(type == "variable") return cont();
  }

  function importdef (type, value) {
    if(type == "variable" && /[A-Z]/.test(value.charAt(0))) { registerimport(value); return cont(); }
    else if(type == "variable" || type == "property" || type == "." || value == "*") return cont(importdef);
  }

  function typedef (type, value)
  {
    if(type == "variable" && /[A-Z]/.test(value.charAt(0))) { registerimport(value); return cont(); }
    else if (type == "type" && /[A-Z]/.test(value.charAt(0))) { return cont(); }
  }

  function maybelabel(type) {
    if (type == ":") return cont(poplex, statement);
    return pass(maybeoperator, expect(";"), poplex);
  }
  function property(type) {
    if (type == "variable") {cx.marked = "property"; return cont();}
  }
  function objprop(type) {
    if (type == "variable") cx.marked = "property";
    if (atomicTypes.hasOwnProperty(type)) return cont(expect(":"), expression);
  }
  function commasep(what, end) {
    function proceed(type) {
      if (type == ",") return cont(what, proceed);
      if (type == end) return cont();
      return cont(expect(end));
    }
    return function(type) {
      if (type == end) return cont();
      else return pass(what, proceed);
    };
  }
  function block(type) {
    if (type == "}") return cont();
    return pass(statement, block);
  }
  function vardef1(type, value) {
    if (type == "variable"){register(value); return cont(typeuse, vardef2);}
    return cont();
  }
  function vardef2(type, value) {
    if (value == "=") return cont(expression, vardef2);
    if (type == ",") return cont(vardef1);
  }
  function forspec1(type, value) {
    if (type == "variable") {
      register(value);
      return cont(forin, expression)
    } else {
      return pass()
    }
  }
  function forin(_type, value) {
    if (value == "in") return cont();
  }
  function functiondef(type, value) {
    //function names starting with upper-case letters are recognised as types, so cludging them together here.
    if (type == "variable" || type == "type") {register(value); return cont(functiondef);}
    if (value == "new") return cont(functiondef);
    if (type == "(") return cont(pushlex(")"), pushcontext, commasep(funarg, ")"), poplex, typeuse, statement, popcontext);
  }
  function typeuse(type) {
    if(type == ":") return cont(typestring);
  }
  function typestring(type) {
    if(type == "type") return cont();
    if(type == "variable") return cont();
    if(type == "{") return cont(pushlex("}"), commasep(typeprop, "}"), poplex);
  }
  function typeprop(type) {
    if(type == "variable") return cont(typeuse);
  }
  function funarg(type, value) {
    if (type == "variable") {register(value); return cont(typeuse);}
  }

  // Interface
  return {
    startState: function(basecolumn) {
      var defaulttypes = ["Int", "Float", "String", "Void", "Std", "Bool", "Dynamic", "Array"];
      var state = {
        tokenize: haxeTokenBase,
        reAllowed: true,
        kwAllowed: true,
        cc: [],
        lexical: new HaxeLexical((basecolumn || 0) - indentUnit, 0, "block", false),
        localVars: parserConfig.localVars,
        importedtypes: defaulttypes,
        context: parserConfig.localVars && {vars: parserConfig.localVars},
        indented: 0
      };
      if (parserConfig.globalVars && typeof parserConfig.globalVars == "object")
        state.globalVars = parserConfig.globalVars;
      return state;
    },

    token: function(stream, state) {
      if (stream.sol()) {
        if (!state.lexical.hasOwnProperty("align"))
          state.lexical.align = false;
        state.indented = stream.indentation();
      }
      if (stream.eatSpace()) return null;
      var style = state.tokenize(stream, state);
      if (type == "comment") return style;
      state.reAllowed = !!(type == "operator" || type == "keyword c" || type.match(/^[\[{}\(,;:]$/));
      state.kwAllowed = type != '.';
      return parseHaxe(state, style, type, content, stream);
    },

    indent: function(state, textAfter) {
      if (state.tokenize != haxeTokenBase) return 0;
      var firstChar = textAfter && textAfter.charAt(0), lexical = state.lexical;
      if (lexical.type == "stat" && firstChar == "}") lexical = lexical.prev;
      var type = lexical.type, closing = firstChar == type;
      if (type == "vardef") return lexical.indented + 4;
      else if (type == "form" && firstChar == "{") return lexical.indented;
      else if (type == "stat" || type == "form") return lexical.indented + indentUnit;
      else if (lexical.info == "switch" && !closing)
        return lexical.indented + (/^(?:case|default)\b/.test(textAfter) ? indentUnit : 2 * indentUnit);
      else if (lexical.align) return lexical.column + (closing ? 0 : 1);
      else return lexical.indented + (closing ? 0 : indentUnit);
    },

    electricChars: "{}",
    blockCommentStart: "/*",
    blockCommentEnd: "*/",
    lineComment: "//"
  };
});

CodeMirror.defineMIME("text/x-haxe", "haxe");

CodeMirror.defineMode("hxml", function () {

  return {
    startState: function () {
      return {
        define: false,
        inString: false
      };
    },
    token: function (stream, state) {
      var ch = stream.peek();
      var sol = stream.sol();

      ///* comments */
      if (ch == "#") {
        stream.skipToEnd();
        return "comment";
      }
      if (sol && ch == "-") {
        var style = "variable-2";

        stream.eat(/-/);

        if (stream.peek() == "-") {
          stream.eat(/-/);
          style = "keyword a";
        }

        if (stream.peek() == "D") {
          stream.eat(/[D]/);
          style = "keyword c";
          state.define = true;
        }

        stream.eatWhile(/[A-Z]/i);
        return style;
      }

      var ch = stream.peek();

      if (state.inString == false && ch == "'") {
        state.inString = true;
        stream.next();
      }

      if (state.inString == true) {
        if (stream.skipTo("'")) {

        } else {
          stream.skipToEnd();
        }

        if (stream.peek() == "'") {
          stream.next();
          state.inString = false;
        }

        return "string";
      }

      stream.next();
      return null;
    },
    lineComment: "#"
  };
});

CodeMirror.defineMIME("text/x-hxml", "hxml");

});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/htmlembedded/htmlembedded.js":
/*!**************************************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/htmlembedded/htmlembedded.js ***!
  \**************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"), __webpack_require__(/*! ../htmlmixed/htmlmixed */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/htmlmixed/htmlmixed.js"),
        __webpack_require__(/*! ../../addon/mode/multiplex */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/addon/mode/multiplex.js"));
  else {}
})(function(CodeMirror) {
  "use strict";

  CodeMirror.defineMode("htmlembedded", function(config, parserConfig) {
    var closeComment = parserConfig.closeComment || "--%>"
    return CodeMirror.multiplexingMode(CodeMirror.getMode(config, "htmlmixed"), {
      open: parserConfig.openComment || "<%--",
      close: closeComment,
      delimStyle: "comment",
      mode: {token: function(stream) {
        stream.skipTo(closeComment) || stream.skipToEnd()
        return "comment"
      }}
    }, {
      open: parserConfig.open || parserConfig.scriptStartRegex || "<%",
      close: parserConfig.close || parserConfig.scriptEndRegex || "%>",
      mode: CodeMirror.getMode(config, parserConfig.scriptingModeSpec)
    });
  }, "htmlmixed");

  CodeMirror.defineMIME("application/x-ejs", {name: "htmlembedded", scriptingModeSpec:"javascript"});
  CodeMirror.defineMIME("application/x-aspx", {name: "htmlembedded", scriptingModeSpec:"text/x-csharp"});
  CodeMirror.defineMIME("application/x-jsp", {name: "htmlembedded", scriptingModeSpec:"text/x-java"});
  CodeMirror.defineMIME("application/x-erb", {name: "htmlembedded", scriptingModeSpec:"ruby"});
});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/htmlmixed/htmlmixed.js":
/*!********************************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/htmlmixed/htmlmixed.js ***!
  \********************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"), __webpack_require__(/*! ../xml/xml */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/xml/xml.js"), __webpack_require__(/*! ../javascript/javascript */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/javascript/javascript.js"), __webpack_require__(/*! ../css/css */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/css/css.js"));
  else {}
})(function(CodeMirror) {
  "use strict";

  var defaultTags = {
    script: [
      ["lang", /(javascript|babel)/i, "javascript"],
      ["type", /^(?:text|application)\/(?:x-)?(?:java|ecma)script$|^module$|^$/i, "javascript"],
      ["type", /./, "text/plain"],
      [null, null, "javascript"]
    ],
    style:  [
      ["lang", /^css$/i, "css"],
      ["type", /^(text\/)?(x-)?(stylesheet|css)$/i, "css"],
      ["type", /./, "text/plain"],
      [null, null, "css"]
    ]
  };

  function maybeBackup(stream, pat, style) {
    var cur = stream.current(), close = cur.search(pat);
    if (close > -1) {
      stream.backUp(cur.length - close);
    } else if (cur.match(/<\/?$/)) {
      stream.backUp(cur.length);
      if (!stream.match(pat, false)) stream.match(cur);
    }
    return style;
  }

  var attrRegexpCache = {};
  function getAttrRegexp(attr) {
    var regexp = attrRegexpCache[attr];
    if (regexp) return regexp;
    return attrRegexpCache[attr] = new RegExp("\\s+" + attr + "\\s*=\\s*('|\")?([^'\"]+)('|\")?\\s*");
  }

  function getAttrValue(text, attr) {
    var match = text.match(getAttrRegexp(attr))
    return match ? /^\s*(.*?)\s*$/.exec(match[2])[1] : ""
  }

  function getTagRegexp(tagName, anchored) {
    return new RegExp((anchored ? "^" : "") + "<\/\s*" + tagName + "\s*>", "i");
  }

  function addTags(from, to) {
    for (var tag in from) {
      var dest = to[tag] || (to[tag] = []);
      var source = from[tag];
      for (var i = source.length - 1; i >= 0; i--)
        dest.unshift(source[i])
    }
  }

  function findMatchingMode(tagInfo, tagText) {
    for (var i = 0; i < tagInfo.length; i++) {
      var spec = tagInfo[i];
      if (!spec[0] || spec[1].test(getAttrValue(tagText, spec[0]))) return spec[2];
    }
  }

  CodeMirror.defineMode("htmlmixed", function (config, parserConfig) {
    var htmlMode = CodeMirror.getMode(config, {
      name: "xml",
      htmlMode: true,
      multilineTagIndentFactor: parserConfig.multilineTagIndentFactor,
      multilineTagIndentPastTag: parserConfig.multilineTagIndentPastTag
    });

    var tags = {};
    var configTags = parserConfig && parserConfig.tags, configScript = parserConfig && parserConfig.scriptTypes;
    addTags(defaultTags, tags);
    if (configTags) addTags(configTags, tags);
    if (configScript) for (var i = configScript.length - 1; i >= 0; i--)
      tags.script.unshift(["type", configScript[i].matches, configScript[i].mode])

    function html(stream, state) {
      var style = htmlMode.token(stream, state.htmlState), tag = /\btag\b/.test(style), tagName
      if (tag && !/[<>\s\/]/.test(stream.current()) &&
          (tagName = state.htmlState.tagName && state.htmlState.tagName.toLowerCase()) &&
          tags.hasOwnProperty(tagName)) {
        state.inTag = tagName + " "
      } else if (state.inTag && tag && />$/.test(stream.current())) {
        var inTag = /^([\S]+) (.*)/.exec(state.inTag)
        state.inTag = null
        var modeSpec = stream.current() == ">" && findMatchingMode(tags[inTag[1]], inTag[2])
        var mode = CodeMirror.getMode(config, modeSpec)
        var endTagA = getTagRegexp(inTag[1], true), endTag = getTagRegexp(inTag[1], false);
        state.token = function (stream, state) {
          if (stream.match(endTagA, false)) {
            state.token = html;
            state.localState = state.localMode = null;
            return null;
          }
          return maybeBackup(stream, endTag, state.localMode.token(stream, state.localState));
        };
        state.localMode = mode;
        state.localState = CodeMirror.startState(mode, htmlMode.indent(state.htmlState, ""));
      } else if (state.inTag) {
        state.inTag += stream.current()
        if (stream.eol()) state.inTag += " "
      }
      return style;
    };

    return {
      startState: function () {
        var state = CodeMirror.startState(htmlMode);
        return {token: html, inTag: null, localMode: null, localState: null, htmlState: state};
      },

      copyState: function (state) {
        var local;
        if (state.localState) {
          local = CodeMirror.copyState(state.localMode, state.localState);
        }
        return {token: state.token, inTag: state.inTag,
                localMode: state.localMode, localState: local,
                htmlState: CodeMirror.copyState(htmlMode, state.htmlState)};
      },

      token: function (stream, state) {
        return state.token(stream, state);
      },

      indent: function (state, textAfter, line) {
        if (!state.localMode || /^\s*<\//.test(textAfter))
          return htmlMode.indent(state.htmlState, textAfter);
        else if (state.localMode.indent)
          return state.localMode.indent(state.localState, textAfter, line);
        else
          return CodeMirror.Pass;
      },

      innerMode: function (state) {
        return {state: state.localState || state.htmlState, mode: state.localMode || htmlMode};
      }
    };
  }, "xml", "javascript", "css");

  CodeMirror.defineMIME("text/html", "htmlmixed");
});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/http/http.js":
/*!**********************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/http/http.js ***!
  \**********************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"));
  else {}
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode("http", function() {
  function failFirstLine(stream, state) {
    stream.skipToEnd();
    state.cur = header;
    return "error";
  }

  function start(stream, state) {
    if (stream.match(/^HTTP\/\d\.\d/)) {
      state.cur = responseStatusCode;
      return "keyword";
    } else if (stream.match(/^[A-Z]+/) && /[ \t]/.test(stream.peek())) {
      state.cur = requestPath;
      return "keyword";
    } else {
      return failFirstLine(stream, state);
    }
  }

  function responseStatusCode(stream, state) {
    var code = stream.match(/^\d+/);
    if (!code) return failFirstLine(stream, state);

    state.cur = responseStatusText;
    var status = Number(code[0]);
    if (status >= 100 && status < 200) {
      return "positive informational";
    } else if (status >= 200 && status < 300) {
      return "positive success";
    } else if (status >= 300 && status < 400) {
      return "positive redirect";
    } else if (status >= 400 && status < 500) {
      return "negative client-error";
    } else if (status >= 500 && status < 600) {
      return "negative server-error";
    } else {
      return "error";
    }
  }

  function responseStatusText(stream, state) {
    stream.skipToEnd();
    state.cur = header;
    return null;
  }

  function requestPath(stream, state) {
    stream.eatWhile(/\S/);
    state.cur = requestProtocol;
    return "string-2";
  }

  function requestProtocol(stream, state) {
    if (stream.match(/^HTTP\/\d\.\d$/)) {
      state.cur = header;
      return "keyword";
    } else {
      return failFirstLine(stream, state);
    }
  }

  function header(stream) {
    if (stream.sol() && !stream.eat(/[ \t]/)) {
      if (stream.match(/^.*?:/)) {
        return "atom";
      } else {
        stream.skipToEnd();
        return "error";
      }
    } else {
      stream.skipToEnd();
      return "string";
    }
  }

  function body(stream) {
    stream.skipToEnd();
    return null;
  }

  return {
    token: function(stream, state) {
      var cur = state.cur;
      if (cur != header && cur != body && stream.eatSpace()) return null;
      return cur(stream, state);
    },

    blankLine: function(state) {
      state.cur = body;
    },

    startState: function() {
      return {cur: start};
    }
  };
});

CodeMirror.defineMIME("message/http", "http");

});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/idl/idl.js":
/*!********************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/idl/idl.js ***!
  \********************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"));
  else {}
})(function(CodeMirror) {
  "use strict";

  function wordRegexp(words) {
    return new RegExp('^((' + words.join(')|(') + '))\\b', 'i');
  };

  var builtinArray = [
    'a_correlate', 'abs', 'acos', 'adapt_hist_equal', 'alog',
    'alog2', 'alog10', 'amoeba', 'annotate', 'app_user_dir',
    'app_user_dir_query', 'arg_present', 'array_equal', 'array_indices',
    'arrow', 'ascii_template', 'asin', 'assoc', 'atan',
    'axis', 'axis', 'bandpass_filter', 'bandreject_filter', 'barplot',
    'bar_plot', 'beseli', 'beselj', 'beselk', 'besely',
    'beta', 'biginteger', 'bilinear', 'bin_date', 'binary_template',
    'bindgen', 'binomial', 'bit_ffs', 'bit_population', 'blas_axpy',
    'blk_con', 'boolarr', 'boolean', 'boxplot', 'box_cursor',
    'breakpoint', 'broyden', 'bubbleplot', 'butterworth', 'bytarr',
    'byte', 'byteorder', 'bytscl', 'c_correlate', 'calendar',
    'caldat', 'call_external', 'call_function', 'call_method',
    'call_procedure', 'canny', 'catch', 'cd', 'cdf', 'ceil',
    'chebyshev', 'check_math', 'chisqr_cvf', 'chisqr_pdf', 'choldc',
    'cholsol', 'cindgen', 'cir_3pnt', 'clipboard', 'close',
    'clust_wts', 'cluster', 'cluster_tree', 'cmyk_convert', 'code_coverage',
    'color_convert', 'color_exchange', 'color_quan', 'color_range_map',
    'colorbar', 'colorize_sample', 'colormap_applicable',
    'colormap_gradient', 'colormap_rotation', 'colortable',
    'comfit', 'command_line_args', 'common', 'compile_opt', 'complex',
    'complexarr', 'complexround', 'compute_mesh_normals', 'cond', 'congrid',
    'conj', 'constrained_min', 'contour', 'contour', 'convert_coord',
    'convol', 'convol_fft', 'coord2to3', 'copy_lun', 'correlate',
    'cos', 'cosh', 'cpu', 'cramer', 'createboxplotdata',
    'create_cursor', 'create_struct', 'create_view', 'crossp', 'crvlength',
    'ct_luminance', 'cti_test', 'cursor', 'curvefit', 'cv_coord',
    'cvttobm', 'cw_animate', 'cw_animate_getp', 'cw_animate_load',
    'cw_animate_run', 'cw_arcball', 'cw_bgroup', 'cw_clr_index',
    'cw_colorsel', 'cw_defroi', 'cw_field', 'cw_filesel', 'cw_form',
    'cw_fslider', 'cw_light_editor', 'cw_light_editor_get',
    'cw_light_editor_set', 'cw_orient', 'cw_palette_editor',
    'cw_palette_editor_get', 'cw_palette_editor_set', 'cw_pdmenu',
    'cw_rgbslider', 'cw_tmpl', 'cw_zoom', 'db_exists',
    'dblarr', 'dcindgen', 'dcomplex', 'dcomplexarr', 'define_key',
    'define_msgblk', 'define_msgblk_from_file', 'defroi', 'defsysv',
    'delvar', 'dendro_plot', 'dendrogram', 'deriv', 'derivsig',
    'determ', 'device', 'dfpmin', 'diag_matrix', 'dialog_dbconnect',
    'dialog_message', 'dialog_pickfile', 'dialog_printersetup',
    'dialog_printjob', 'dialog_read_image',
    'dialog_write_image', 'dictionary', 'digital_filter', 'dilate', 'dindgen',
    'dissolve', 'dist', 'distance_measure', 'dlm_load', 'dlm_register',
    'doc_library', 'double', 'draw_roi', 'edge_dog', 'efont',
    'eigenql', 'eigenvec', 'ellipse', 'elmhes', 'emboss',
    'empty', 'enable_sysrtn', 'eof', 'eos', 'erase',
    'erf', 'erfc', 'erfcx', 'erode', 'errorplot',
    'errplot', 'estimator_filter', 'execute', 'exit', 'exp',
    'expand', 'expand_path', 'expint', 'extrac', 'extract_slice',
    'f_cvf', 'f_pdf', 'factorial', 'fft', 'file_basename',
    'file_chmod', 'file_copy', 'file_delete', 'file_dirname',
    'file_expand_path', 'file_gunzip', 'file_gzip', 'file_info',
    'file_lines', 'file_link', 'file_mkdir', 'file_move',
    'file_poll_input', 'file_readlink', 'file_same',
    'file_search', 'file_tar', 'file_test', 'file_untar', 'file_unzip',
    'file_which', 'file_zip', 'filepath', 'findgen', 'finite',
    'fix', 'flick', 'float', 'floor', 'flow3',
    'fltarr', 'flush', 'format_axis_values', 'forward_function', 'free_lun',
    'fstat', 'fulstr', 'funct', 'function', 'fv_test',
    'fx_root', 'fz_roots', 'gamma', 'gamma_ct', 'gauss_cvf',
    'gauss_pdf', 'gauss_smooth', 'gauss2dfit', 'gaussfit',
    'gaussian_function', 'gaussint', 'get_drive_list', 'get_dxf_objects',
    'get_kbrd', 'get_login_info',
    'get_lun', 'get_screen_size', 'getenv', 'getwindows', 'greg2jul',
    'grib', 'grid_input', 'grid_tps', 'grid3', 'griddata',
    'gs_iter', 'h_eq_ct', 'h_eq_int', 'hanning', 'hash',
    'hdf', 'hdf5', 'heap_free', 'heap_gc', 'heap_nosave',
    'heap_refcount', 'heap_save', 'help', 'hilbert', 'hist_2d',
    'hist_equal', 'histogram', 'hls', 'hough', 'hqr',
    'hsv', 'i18n_multibytetoutf8',
    'i18n_multibytetowidechar', 'i18n_utf8tomultibyte',
    'i18n_widechartomultibyte',
    'ibeta', 'icontour', 'iconvertcoord', 'idelete', 'identity',
    'idl_base64', 'idl_container', 'idl_validname',
    'idlexbr_assistant', 'idlitsys_createtool',
    'idlunit', 'iellipse', 'igamma', 'igetcurrent', 'igetdata',
    'igetid', 'igetproperty', 'iimage', 'image', 'image_cont',
    'image_statistics', 'image_threshold', 'imaginary', 'imap', 'indgen',
    'int_2d', 'int_3d', 'int_tabulated', 'intarr', 'interpol',
    'interpolate', 'interval_volume', 'invert', 'ioctl', 'iopen',
    'ir_filter', 'iplot', 'ipolygon', 'ipolyline', 'iputdata',
    'iregister', 'ireset', 'iresolve', 'irotate', 'isa',
    'isave', 'iscale', 'isetcurrent', 'isetproperty', 'ishft',
    'isocontour', 'isosurface', 'isurface', 'itext', 'itranslate',
    'ivector', 'ivolume', 'izoom', 'journal', 'json_parse',
    'json_serialize', 'jul2greg', 'julday', 'keyword_set', 'krig2d',
    'kurtosis', 'kw_test', 'l64indgen', 'la_choldc', 'la_cholmprove',
    'la_cholsol', 'la_determ', 'la_eigenproblem', 'la_eigenql', 'la_eigenvec',
    'la_elmhes', 'la_gm_linear_model', 'la_hqr', 'la_invert',
    'la_least_square_equality', 'la_least_squares', 'la_linear_equation',
    'la_ludc', 'la_lumprove', 'la_lusol',
    'la_svd', 'la_tridc', 'la_trimprove', 'la_triql', 'la_trired',
    'la_trisol', 'label_date', 'label_region', 'ladfit', 'laguerre',
    'lambda', 'lambdap', 'lambertw', 'laplacian', 'least_squares_filter',
    'leefilt', 'legend', 'legendre', 'linbcg', 'lindgen',
    'linfit', 'linkimage', 'list', 'll_arc_distance', 'lmfit',
    'lmgr', 'lngamma', 'lnp_test', 'loadct', 'locale_get',
    'logical_and', 'logical_or', 'logical_true', 'lon64arr', 'lonarr',
    'long', 'long64', 'lsode', 'lu_complex', 'ludc',
    'lumprove', 'lusol', 'm_correlate', 'machar', 'make_array',
    'make_dll', 'make_rt', 'map', 'mapcontinents', 'mapgrid',
    'map_2points', 'map_continents', 'map_grid', 'map_image', 'map_patch',
    'map_proj_forward', 'map_proj_image', 'map_proj_info',
    'map_proj_init', 'map_proj_inverse',
    'map_set', 'matrix_multiply', 'matrix_power', 'max', 'md_test',
    'mean', 'meanabsdev', 'mean_filter', 'median', 'memory',
    'mesh_clip', 'mesh_decimate', 'mesh_issolid',
    'mesh_merge', 'mesh_numtriangles',
    'mesh_obj', 'mesh_smooth', 'mesh_surfacearea',
    'mesh_validate', 'mesh_volume',
    'message', 'min', 'min_curve_surf', 'mk_html_help', 'modifyct',
    'moment', 'morph_close', 'morph_distance',
    'morph_gradient', 'morph_hitormiss',
    'morph_open', 'morph_thin', 'morph_tophat', 'multi', 'n_elements',
    'n_params', 'n_tags', 'ncdf', 'newton', 'noise_hurl',
    'noise_pick', 'noise_scatter', 'noise_slur', 'norm', 'obj_class',
    'obj_destroy', 'obj_hasmethod', 'obj_isa', 'obj_new', 'obj_valid',
    'objarr', 'on_error', 'on_ioerror', 'online_help', 'openr',
    'openu', 'openw', 'oplot', 'oploterr', 'orderedhash',
    'p_correlate', 'parse_url', 'particle_trace', 'path_cache', 'path_sep',
    'pcomp', 'plot', 'plot3d', 'plot', 'plot_3dbox',
    'plot_field', 'ploterr', 'plots', 'polar_contour', 'polar_surface',
    'polyfill', 'polyshade', 'pnt_line', 'point_lun', 'polarplot',
    'poly', 'poly_2d', 'poly_area', 'poly_fit', 'polyfillv',
    'polygon', 'polyline', 'polywarp', 'popd', 'powell',
    'pref_commit', 'pref_get', 'pref_set', 'prewitt', 'primes',
    'print', 'printf', 'printd', 'pro', 'product',
    'profile', 'profiler', 'profiles', 'project_vol', 'ps_show_fonts',
    'psafm', 'pseudo', 'ptr_free', 'ptr_new', 'ptr_valid',
    'ptrarr', 'pushd', 'qgrid3', 'qhull', 'qromb',
    'qromo', 'qsimp', 'query_*', 'query_ascii', 'query_bmp',
    'query_csv', 'query_dicom', 'query_gif', 'query_image', 'query_jpeg',
    'query_jpeg2000', 'query_mrsid', 'query_pict', 'query_png', 'query_ppm',
    'query_srf', 'query_tiff', 'query_video', 'query_wav', 'r_correlate',
    'r_test', 'radon', 'randomn', 'randomu', 'ranks',
    'rdpix', 'read', 'readf', 'read_ascii', 'read_binary',
    'read_bmp', 'read_csv', 'read_dicom', 'read_gif', 'read_image',
    'read_interfile', 'read_jpeg', 'read_jpeg2000', 'read_mrsid', 'read_pict',
    'read_png', 'read_ppm', 'read_spr', 'read_srf', 'read_sylk',
    'read_tiff', 'read_video', 'read_wav', 'read_wave', 'read_x11_bitmap',
    'read_xwd', 'reads', 'readu', 'real_part', 'rebin',
    'recall_commands', 'recon3', 'reduce_colors', 'reform', 'region_grow',
    'register_cursor', 'regress', 'replicate',
    'replicate_inplace', 'resolve_all',
    'resolve_routine', 'restore', 'retall', 'return', 'reverse',
    'rk4', 'roberts', 'rot', 'rotate', 'round',
    'routine_filepath', 'routine_info', 'rs_test', 's_test', 'save',
    'savgol', 'scale3', 'scale3d', 'scatterplot', 'scatterplot3d',
    'scope_level', 'scope_traceback', 'scope_varfetch',
    'scope_varname', 'search2d',
    'search3d', 'sem_create', 'sem_delete', 'sem_lock', 'sem_release',
    'set_plot', 'set_shading', 'setenv', 'sfit', 'shade_surf',
    'shade_surf_irr', 'shade_volume', 'shift', 'shift_diff', 'shmdebug',
    'shmmap', 'shmunmap', 'shmvar', 'show3', 'showfont',
    'signum', 'simplex', 'sin', 'sindgen', 'sinh',
    'size', 'skewness', 'skip_lun', 'slicer3', 'slide_image',
    'smooth', 'sobel', 'socket', 'sort', 'spawn',
    'sph_4pnt', 'sph_scat', 'spher_harm', 'spl_init', 'spl_interp',
    'spline', 'spline_p', 'sprsab', 'sprsax', 'sprsin',
    'sprstp', 'sqrt', 'standardize', 'stddev', 'stop',
    'strarr', 'strcmp', 'strcompress', 'streamline', 'streamline',
    'stregex', 'stretch', 'string', 'strjoin', 'strlen',
    'strlowcase', 'strmatch', 'strmessage', 'strmid', 'strpos',
    'strput', 'strsplit', 'strtrim', 'struct_assign', 'struct_hide',
    'strupcase', 'surface', 'surface', 'surfr', 'svdc',
    'svdfit', 'svsol', 'swap_endian', 'swap_endian_inplace', 'symbol',
    'systime', 't_cvf', 't_pdf', 't3d', 'tag_names',
    'tan', 'tanh', 'tek_color', 'temporary', 'terminal_size',
    'tetra_clip', 'tetra_surface', 'tetra_volume', 'text', 'thin',
    'thread', 'threed', 'tic', 'time_test2', 'timegen',
    'timer', 'timestamp', 'timestamptovalues', 'tm_test', 'toc',
    'total', 'trace', 'transpose', 'tri_surf', 'triangulate',
    'trigrid', 'triql', 'trired', 'trisol', 'truncate_lun',
    'ts_coef', 'ts_diff', 'ts_fcast', 'ts_smooth', 'tv',
    'tvcrs', 'tvlct', 'tvrd', 'tvscl', 'typename',
    'uindgen', 'uint', 'uintarr', 'ul64indgen', 'ulindgen',
    'ulon64arr', 'ulonarr', 'ulong', 'ulong64', 'uniq',
    'unsharp_mask', 'usersym', 'value_locate', 'variance', 'vector',
    'vector_field', 'vel', 'velovect', 'vert_t3d', 'voigt',
    'volume', 'voronoi', 'voxel_proj', 'wait', 'warp_tri',
    'watershed', 'wdelete', 'wf_draw', 'where', 'widget_base',
    'widget_button', 'widget_combobox', 'widget_control',
    'widget_displaycontextmenu', 'widget_draw',
    'widget_droplist', 'widget_event', 'widget_info',
    'widget_label', 'widget_list',
    'widget_propertysheet', 'widget_slider', 'widget_tab',
    'widget_table', 'widget_text',
    'widget_tree', 'widget_tree_move', 'widget_window',
    'wiener_filter', 'window',
    'window', 'write_bmp', 'write_csv', 'write_gif', 'write_image',
    'write_jpeg', 'write_jpeg2000', 'write_nrif', 'write_pict', 'write_png',
    'write_ppm', 'write_spr', 'write_srf', 'write_sylk', 'write_tiff',
    'write_video', 'write_wav', 'write_wave', 'writeu', 'wset',
    'wshow', 'wtn', 'wv_applet', 'wv_cwt', 'wv_cw_wavelet',
    'wv_denoise', 'wv_dwt', 'wv_fn_coiflet',
    'wv_fn_daubechies', 'wv_fn_gaussian',
    'wv_fn_haar', 'wv_fn_morlet', 'wv_fn_paul',
    'wv_fn_symlet', 'wv_import_data',
    'wv_import_wavelet', 'wv_plot3d_wps', 'wv_plot_multires',
    'wv_pwt', 'wv_tool_denoise',
    'xbm_edit', 'xdisplayfile', 'xdxf', 'xfont', 'xinteranimate',
    'xloadct', 'xmanager', 'xmng_tmpl', 'xmtool', 'xobjview',
    'xobjview_rotate', 'xobjview_write_image',
    'xpalette', 'xpcolor', 'xplot3d',
    'xregistered', 'xroi', 'xsq_test', 'xsurface', 'xvaredit',
    'xvolume', 'xvolume_rotate', 'xvolume_write_image',
    'xyouts', 'zlib_compress', 'zlib_uncompress', 'zoom', 'zoom_24'
  ];
  var builtins = wordRegexp(builtinArray);

  var keywordArray = [
    'begin', 'end', 'endcase', 'endfor',
    'endwhile', 'endif', 'endrep', 'endforeach',
    'break', 'case', 'continue', 'for',
    'foreach', 'goto', 'if', 'then', 'else',
    'repeat', 'until', 'switch', 'while',
    'do', 'pro', 'function'
  ];
  var keywords = wordRegexp(keywordArray);

  CodeMirror.registerHelper("hintWords", "idl", builtinArray.concat(keywordArray));

  var identifiers = new RegExp('^[_a-z\xa1-\uffff][_a-z0-9\xa1-\uffff]*', 'i');

  var singleOperators = /[+\-*&=<>\/@#~$]/;
  var boolOperators = new RegExp('(and|or|eq|lt|le|gt|ge|ne|not)', 'i');

  function tokenBase(stream) {
    // whitespaces
    if (stream.eatSpace()) return null;

    // Handle one line Comments
    if (stream.match(';')) {
      stream.skipToEnd();
      return 'comment';
    }

    // Handle Number Literals
    if (stream.match(/^[0-9\.+-]/, false)) {
      if (stream.match(/^[+-]?0x[0-9a-fA-F]+/))
        return 'number';
      if (stream.match(/^[+-]?\d*\.\d+([EeDd][+-]?\d+)?/))
        return 'number';
      if (stream.match(/^[+-]?\d+([EeDd][+-]?\d+)?/))
        return 'number';
    }

    // Handle Strings
    if (stream.match(/^"([^"]|(""))*"/)) { return 'string'; }
    if (stream.match(/^'([^']|(''))*'/)) { return 'string'; }

    // Handle words
    if (stream.match(keywords)) { return 'keyword'; }
    if (stream.match(builtins)) { return 'builtin'; }
    if (stream.match(identifiers)) { return 'variable'; }

    if (stream.match(singleOperators) || stream.match(boolOperators)) {
      return 'operator'; }

    // Handle non-detected items
    stream.next();
    return null;
  };

  CodeMirror.defineMode('idl', function() {
    return {
      token: function(stream) {
        return tokenBase(stream);
      }
    };
  });

  CodeMirror.defineMIME('text/x-idl', 'idl');
});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/jinja2/jinja2.js":
/*!**************************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/jinja2/jinja2.js ***!
  \**************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"));
  else {}
})(function(CodeMirror) {
  "use strict";

  CodeMirror.defineMode("jinja2", function() {
    var keywords = ["and", "as", "block", "endblock", "by", "cycle", "debug", "else", "elif",
      "extends", "filter", "endfilter", "firstof", "for",
      "endfor", "if", "endif", "ifchanged", "endifchanged",
      "ifequal", "endifequal", "ifnotequal",
      "endifnotequal", "in", "include", "load", "not", "now", "or",
      "parsed", "regroup", "reversed", "spaceless",
      "endspaceless", "ssi", "templatetag", "openblock",
      "closeblock", "openvariable", "closevariable",
      "openbrace", "closebrace", "opencomment",
      "closecomment", "widthratio", "url", "with", "endwith",
      "get_current_language", "trans", "endtrans", "noop", "blocktrans",
      "endblocktrans", "get_available_languages",
      "get_current_language_bidi", "plural"],
    operator = /^[+\-*&%=<>!?|~^]/,
    sign = /^[:\[\(\{]/,
    atom = ["true", "false"],
    number = /^(\d[+\-\*\/])?\d+(\.\d+)?/;

    keywords = new RegExp("((" + keywords.join(")|(") + "))\\b");
    atom = new RegExp("((" + atom.join(")|(") + "))\\b");

    function tokenBase (stream, state) {
      var ch = stream.peek();

      //Comment
      if (state.incomment) {
        if(!stream.skipTo("#}")) {
          stream.skipToEnd();
        } else {
          stream.eatWhile(/\#|}/);
          state.incomment = false;
        }
        return "comment";
      //Tag
      } else if (state.intag) {
        //After operator
        if(state.operator) {
          state.operator = false;
          if(stream.match(atom)) {
            return "atom";
          }
          if(stream.match(number)) {
            return "number";
          }
        }
        //After sign
        if(state.sign) {
          state.sign = false;
          if(stream.match(atom)) {
            return "atom";
          }
          if(stream.match(number)) {
            return "number";
          }
        }

        if(state.instring) {
          if(ch == state.instring) {
            state.instring = false;
          }
          stream.next();
          return "string";
        } else if(ch == "'" || ch == '"') {
          state.instring = ch;
          stream.next();
          return "string";
        } else if(stream.match(state.intag + "}") || stream.eat("-") && stream.match(state.intag + "}")) {
          state.intag = false;
          return "tag";
        } else if(stream.match(operator)) {
          state.operator = true;
          return "operator";
        } else if(stream.match(sign)) {
          state.sign = true;
        } else {
          if(stream.eat(" ") || stream.sol()) {
            if(stream.match(keywords)) {
              return "keyword";
            }
            if(stream.match(atom)) {
              return "atom";
            }
            if(stream.match(number)) {
              return "number";
            }
            if(stream.sol()) {
              stream.next();
            }
          } else {
            stream.next();
          }

        }
        return "variable";
      } else if (stream.eat("{")) {
        if (stream.eat("#")) {
          state.incomment = true;
          if(!stream.skipTo("#}")) {
            stream.skipToEnd();
          } else {
            stream.eatWhile(/\#|}/);
            state.incomment = false;
          }
          return "comment";
        //Open tag
        } else if (ch = stream.eat(/\{|%/)) {
          //Cache close tag
          state.intag = ch;
          if(ch == "{") {
            state.intag = "}";
          }
          stream.eat("-");
          return "tag";
        }
      }
      stream.next();
    };

    return {
      startState: function () {
        return {tokenize: tokenBase};
      },
      token: function (stream, state) {
        return state.tokenize(stream, state);
      },
      blockCommentStart: "{#",
      blockCommentEnd: "#}"
    };
  });
});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/jsx/jsx.js":
/*!********************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/jsx/jsx.js ***!
  \********************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"), __webpack_require__(/*! ../xml/xml */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/xml/xml.js"), __webpack_require__(/*! ../javascript/javascript */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/javascript/javascript.js"))
  else {}
})(function(CodeMirror) {
  "use strict"

  // Depth means the amount of open braces in JS context, in XML
  // context 0 means not in tag, 1 means in tag, and 2 means in tag
  // and js block comment.
  function Context(state, mode, depth, prev) {
    this.state = state; this.mode = mode; this.depth = depth; this.prev = prev
  }

  function copyContext(context) {
    return new Context(CodeMirror.copyState(context.mode, context.state),
                       context.mode,
                       context.depth,
                       context.prev && copyContext(context.prev))
  }

  CodeMirror.defineMode("jsx", function(config, modeConfig) {
    var xmlMode = CodeMirror.getMode(config, {name: "xml", allowMissing: true, multilineTagIndentPastTag: false, allowMissingTagName: true})
    var jsMode = CodeMirror.getMode(config, modeConfig && modeConfig.base || "javascript")

    function flatXMLIndent(state) {
      var tagName = state.tagName
      state.tagName = null
      var result = xmlMode.indent(state, "")
      state.tagName = tagName
      return result
    }

    function token(stream, state) {
      if (state.context.mode == xmlMode)
        return xmlToken(stream, state, state.context)
      else
        return jsToken(stream, state, state.context)
    }

    function xmlToken(stream, state, cx) {
      if (cx.depth == 2) { // Inside a JS /* */ comment
        if (stream.match(/^.*?\*\//)) cx.depth = 1
        else stream.skipToEnd()
        return "comment"
      }

      if (stream.peek() == "{") {
        xmlMode.skipAttribute(cx.state)

        var indent = flatXMLIndent(cx.state), xmlContext = cx.state.context
        // If JS starts on same line as tag
        if (xmlContext && stream.match(/^[^>]*>\s*$/, false)) {
          while (xmlContext.prev && !xmlContext.startOfLine)
            xmlContext = xmlContext.prev
          // If tag starts the line, use XML indentation level
          if (xmlContext.startOfLine) indent -= config.indentUnit
          // Else use JS indentation level
          else if (cx.prev.state.lexical) indent = cx.prev.state.lexical.indented
        // Else if inside of tag
        } else if (cx.depth == 1) {
          indent += config.indentUnit
        }

        state.context = new Context(CodeMirror.startState(jsMode, indent),
                                    jsMode, 0, state.context)
        return null
      }

      if (cx.depth == 1) { // Inside of tag
        if (stream.peek() == "<") { // Tag inside of tag
          xmlMode.skipAttribute(cx.state)
          state.context = new Context(CodeMirror.startState(xmlMode, flatXMLIndent(cx.state)),
                                      xmlMode, 0, state.context)
          return null
        } else if (stream.match("//")) {
          stream.skipToEnd()
          return "comment"
        } else if (stream.match("/*")) {
          cx.depth = 2
          return token(stream, state)
        }
      }

      var style = xmlMode.token(stream, cx.state), cur = stream.current(), stop
      if (/\btag\b/.test(style)) {
        if (/>$/.test(cur)) {
          if (cx.state.context) cx.depth = 0
          else state.context = state.context.prev
        } else if (/^</.test(cur)) {
          cx.depth = 1
        }
      } else if (!style && (stop = cur.indexOf("{")) > -1) {
        stream.backUp(cur.length - stop)
      }
      return style
    }

    function jsToken(stream, state, cx) {
      if (stream.peek() == "<" && jsMode.expressionAllowed(stream, cx.state)) {
        jsMode.skipExpression(cx.state)
        state.context = new Context(CodeMirror.startState(xmlMode, jsMode.indent(cx.state, "")),
                                    xmlMode, 0, state.context)
        return null
      }

      var style = jsMode.token(stream, cx.state)
      if (!style && cx.depth != null) {
        var cur = stream.current()
        if (cur == "{") {
          cx.depth++
        } else if (cur == "}") {
          if (--cx.depth == 0) state.context = state.context.prev
        }
      }
      return style
    }

    return {
      startState: function() {
        return {context: new Context(CodeMirror.startState(jsMode), jsMode)}
      },

      copyState: function(state) {
        return {context: copyContext(state.context)}
      },

      token: token,

      indent: function(state, textAfter, fullLine) {
        return state.context.mode.indent(state.context.state, textAfter, fullLine)
      },

      innerMode: function(state) {
        return state.context
      }
    }
  }, "xml", "javascript")

  CodeMirror.defineMIME("text/jsx", "jsx")
  CodeMirror.defineMIME("text/typescript-jsx", {name: "jsx", base: {name: "javascript", typescript: true}})
});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/livescript/livescript.js":
/*!**********************************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/livescript/livescript.js ***!
  \**********************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

/**
 * Link to the project's GitHub page:
 * https://github.com/duralog/CodeMirror
 */

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"));
  else {}
})(function(CodeMirror) {
  "use strict";

  CodeMirror.defineMode('livescript', function(){
    var tokenBase = function(stream, state) {
      var next_rule = state.next || "start";
      if (next_rule) {
        state.next = state.next;
        var nr = Rules[next_rule];
        if (nr.splice) {
          for (var i$ = 0; i$ < nr.length; ++i$) {
            var r = nr[i$];
            if (r.regex && stream.match(r.regex)) {
              state.next = r.next || state.next;
              return r.token;
            }
          }
          stream.next();
          return 'error';
        }
        if (stream.match(r = Rules[next_rule])) {
          if (r.regex && stream.match(r.regex)) {
            state.next = r.next;
            return r.token;
          } else {
            stream.next();
            return 'error';
          }
        }
      }
      stream.next();
      return 'error';
    };
    var external = {
      startState: function(){
        return {
          next: 'start',
          lastToken: {style: null, indent: 0, content: ""}
        };
      },
      token: function(stream, state){
        while (stream.pos == stream.start)
          var style = tokenBase(stream, state);
        state.lastToken = {
          style: style,
          indent: stream.indentation(),
          content: stream.current()
        };
        return style.replace(/\./g, ' ');
      },
      indent: function(state){
        var indentation = state.lastToken.indent;
        if (state.lastToken.content.match(indenter)) {
          indentation += 2;
        }
        return indentation;
      }
    };
    return external;
  });

  var identifier = '(?![\\d\\s])[$\\w\\xAA-\\uFFDC](?:(?!\\s)[$\\w\\xAA-\\uFFDC]|-[A-Za-z])*';
  var indenter = RegExp('(?:[({[=:]|[-~]>|\\b(?:e(?:lse|xport)|d(?:o|efault)|t(?:ry|hen)|finally|import(?:\\s*all)?|const|var|let|new|catch(?:\\s*' + identifier + ')?))\\s*$');
  var keywordend = '(?![$\\w]|-[A-Za-z]|\\s*:(?![:=]))';
  var stringfill = {
    token: 'string',
    regex: '.+'
  };
  var Rules = {
    start: [
      {
        token: 'comment.doc',
        regex: '/\\*',
        next: 'comment'
      }, {
        token: 'comment',
        regex: '#.*'
      }, {
        token: 'keyword',
        regex: '(?:t(?:h(?:is|row|en)|ry|ypeof!?)|c(?:on(?:tinue|st)|a(?:se|tch)|lass)|i(?:n(?:stanceof)?|mp(?:ort(?:\\s+all)?|lements)|[fs])|d(?:e(?:fault|lete|bugger)|o)|f(?:or(?:\\s+own)?|inally|unction)|s(?:uper|witch)|e(?:lse|x(?:tends|port)|val)|a(?:nd|rguments)|n(?:ew|ot)|un(?:less|til)|w(?:hile|ith)|o[fr]|return|break|let|var|loop)' + keywordend
      }, {
        token: 'constant.language',
        regex: '(?:true|false|yes|no|on|off|null|void|undefined)' + keywordend
      }, {
        token: 'invalid.illegal',
        regex: '(?:p(?:ackage|r(?:ivate|otected)|ublic)|i(?:mplements|nterface)|enum|static|yield)' + keywordend
      }, {
        token: 'language.support.class',
        regex: '(?:R(?:e(?:gExp|ferenceError)|angeError)|S(?:tring|yntaxError)|E(?:rror|valError)|Array|Boolean|Date|Function|Number|Object|TypeError|URIError)' + keywordend
      }, {
        token: 'language.support.function',
        regex: '(?:is(?:NaN|Finite)|parse(?:Int|Float)|Math|JSON|(?:en|de)codeURI(?:Component)?)' + keywordend
      }, {
        token: 'variable.language',
        regex: '(?:t(?:hat|il|o)|f(?:rom|allthrough)|it|by|e)' + keywordend
      }, {
        token: 'identifier',
        regex: identifier + '\\s*:(?![:=])'
      }, {
        token: 'variable',
        regex: identifier
      }, {
        token: 'keyword.operator',
        regex: '(?:\\.{3}|\\s+\\?)'
      }, {
        token: 'keyword.variable',
        regex: '(?:@+|::|\\.\\.)',
        next: 'key'
      }, {
        token: 'keyword.operator',
        regex: '\\.\\s*',
        next: 'key'
      }, {
        token: 'string',
        regex: '\\\\\\S[^\\s,;)}\\]]*'
      }, {
        token: 'string.doc',
        regex: '\'\'\'',
        next: 'qdoc'
      }, {
        token: 'string.doc',
        regex: '"""',
        next: 'qqdoc'
      }, {
        token: 'string',
        regex: '\'',
        next: 'qstring'
      }, {
        token: 'string',
        regex: '"',
        next: 'qqstring'
      }, {
        token: 'string',
        regex: '`',
        next: 'js'
      }, {
        token: 'string',
        regex: '<\\[',
        next: 'words'
      }, {
        token: 'string.regex',
        regex: '//',
        next: 'heregex'
      }, {
        token: 'string.regex',
        regex: '\\/(?:[^[\\/\\n\\\\]*(?:(?:\\\\.|\\[[^\\]\\n\\\\]*(?:\\\\.[^\\]\\n\\\\]*)*\\])[^[\\/\\n\\\\]*)*)\\/[gimy$]{0,4}',
        next: 'key'
      }, {
        token: 'constant.numeric',
        regex: '(?:0x[\\da-fA-F][\\da-fA-F_]*|(?:[2-9]|[12]\\d|3[0-6])r[\\da-zA-Z][\\da-zA-Z_]*|(?:\\d[\\d_]*(?:\\.\\d[\\d_]*)?|\\.\\d[\\d_]*)(?:e[+-]?\\d[\\d_]*)?[\\w$]*)'
      }, {
        token: 'lparen',
        regex: '[({[]'
      }, {
        token: 'rparen',
        regex: '[)}\\]]',
        next: 'key'
      }, {
        token: 'keyword.operator',
        regex: '\\S+'
      }, {
        token: 'text',
        regex: '\\s+'
      }
    ],
    heregex: [
      {
        token: 'string.regex',
        regex: '.*?//[gimy$?]{0,4}',
        next: 'start'
      }, {
        token: 'string.regex',
        regex: '\\s*#{'
      }, {
        token: 'comment.regex',
        regex: '\\s+(?:#.*)?'
      }, {
        token: 'string.regex',
        regex: '\\S+'
      }
    ],
    key: [
      {
        token: 'keyword.operator',
        regex: '[.?@!]+'
      }, {
        token: 'identifier',
        regex: identifier,
        next: 'start'
      }, {
        token: 'text',
        regex: '',
        next: 'start'
      }
    ],
    comment: [
      {
        token: 'comment.doc',
        regex: '.*?\\*/',
        next: 'start'
      }, {
        token: 'comment.doc',
        regex: '.+'
      }
    ],
    qdoc: [
      {
        token: 'string',
        regex: ".*?'''",
        next: 'key'
      }, stringfill
    ],
    qqdoc: [
      {
        token: 'string',
        regex: '.*?"""',
        next: 'key'
      }, stringfill
    ],
    qstring: [
      {
        token: 'string',
        regex: '[^\\\\\']*(?:\\\\.[^\\\\\']*)*\'',
        next: 'key'
      }, stringfill
    ],
    qqstring: [
      {
        token: 'string',
        regex: '[^\\\\"]*(?:\\\\.[^\\\\"]*)*"',
        next: 'key'
      }, stringfill
    ],
    js: [
      {
        token: 'string',
        regex: '[^\\\\`]*(?:\\\\.[^\\\\`]*)*`',
        next: 'key'
      }, stringfill
    ],
    words: [
      {
        token: 'string',
        regex: '.*?\\]>',
        next: 'key'
      }, stringfill
    ]
  };
  for (var idx in Rules) {
    var r = Rules[idx];
    if (r.splice) {
      for (var i = 0, len = r.length; i < len; ++i) {
        var rr = r[i];
        if (typeof rr.regex === 'string') {
          Rules[idx][i].regex = new RegExp('^' + rr.regex);
        }
      }
    } else if (typeof rr.regex === 'string') {
      Rules[idx].regex = new RegExp('^' + r.regex);
    }
  }

  CodeMirror.defineMIME('text/x-livescript', 'livescript');

});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/lua/lua.js":
/*!********************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/lua/lua.js ***!
  \********************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

// LUA mode. Ported to CodeMirror 2 from Franciszek Wawrzak's
// CodeMirror 1 mode.
// highlights keywords, strings, comments (no leveling supported! ("[==[")), tokens, basic indenting

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"));
  else {}
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode("lua", function(config, parserConfig) {
  var indentUnit = config.indentUnit;

  function prefixRE(words) {
    return new RegExp("^(?:" + words.join("|") + ")", "i");
  }
  function wordRE(words) {
    return new RegExp("^(?:" + words.join("|") + ")$", "i");
  }
  var specials = wordRE(parserConfig.specials || []);

  // long list of standard functions from lua manual
  var builtins = wordRE([
    "_G","_VERSION","assert","collectgarbage","dofile","error","getfenv","getmetatable","ipairs","load",
    "loadfile","loadstring","module","next","pairs","pcall","print","rawequal","rawget","rawset","require",
    "select","setfenv","setmetatable","tonumber","tostring","type","unpack","xpcall",

    "coroutine.create","coroutine.resume","coroutine.running","coroutine.status","coroutine.wrap","coroutine.yield",

    "debug.debug","debug.getfenv","debug.gethook","debug.getinfo","debug.getlocal","debug.getmetatable",
    "debug.getregistry","debug.getupvalue","debug.setfenv","debug.sethook","debug.setlocal","debug.setmetatable",
    "debug.setupvalue","debug.traceback",

    "close","flush","lines","read","seek","setvbuf","write",

    "io.close","io.flush","io.input","io.lines","io.open","io.output","io.popen","io.read","io.stderr","io.stdin",
    "io.stdout","io.tmpfile","io.type","io.write",

    "math.abs","math.acos","math.asin","math.atan","math.atan2","math.ceil","math.cos","math.cosh","math.deg",
    "math.exp","math.floor","math.fmod","math.frexp","math.huge","math.ldexp","math.log","math.log10","math.max",
    "math.min","math.modf","math.pi","math.pow","math.rad","math.random","math.randomseed","math.sin","math.sinh",
    "math.sqrt","math.tan","math.tanh",

    "os.clock","os.date","os.difftime","os.execute","os.exit","os.getenv","os.remove","os.rename","os.setlocale",
    "os.time","os.tmpname",

    "package.cpath","package.loaded","package.loaders","package.loadlib","package.path","package.preload",
    "package.seeall",

    "string.byte","string.char","string.dump","string.find","string.format","string.gmatch","string.gsub",
    "string.len","string.lower","string.match","string.rep","string.reverse","string.sub","string.upper",

    "table.concat","table.insert","table.maxn","table.remove","table.sort"
  ]);
  var keywords = wordRE(["and","break","elseif","false","nil","not","or","return",
                         "true","function", "end", "if", "then", "else", "do",
                         "while", "repeat", "until", "for", "in", "local" ]);

  var indentTokens = wordRE(["function", "if","repeat","do", "\\(", "{"]);
  var dedentTokens = wordRE(["end", "until", "\\)", "}"]);
  var dedentPartial = prefixRE(["end", "until", "\\)", "}", "else", "elseif"]);

  function readBracket(stream) {
    var level = 0;
    while (stream.eat("=")) ++level;
    stream.eat("[");
    return level;
  }

  function normal(stream, state) {
    var ch = stream.next();
    if (ch == "-" && stream.eat("-")) {
      if (stream.eat("[") && stream.eat("["))
        return (state.cur = bracketed(readBracket(stream), "comment"))(stream, state);
      stream.skipToEnd();
      return "comment";
    }
    if (ch == "\"" || ch == "'")
      return (state.cur = string(ch))(stream, state);
    if (ch == "[" && /[\[=]/.test(stream.peek()))
      return (state.cur = bracketed(readBracket(stream), "string"))(stream, state);
    if (/\d/.test(ch)) {
      stream.eatWhile(/[\w.%]/);
      return "number";
    }
    if (/[\w_]/.test(ch)) {
      stream.eatWhile(/[\w\\\-_.]/);
      return "variable";
    }
    return null;
  }

  function bracketed(level, style) {
    return function(stream, state) {
      var curlev = null, ch;
      while ((ch = stream.next()) != null) {
        if (curlev == null) {if (ch == "]") curlev = 0;}
        else if (ch == "=") ++curlev;
        else if (ch == "]" && curlev == level) { state.cur = normal; break; }
        else curlev = null;
      }
      return style;
    };
  }

  function string(quote) {
    return function(stream, state) {
      var escaped = false, ch;
      while ((ch = stream.next()) != null) {
        if (ch == quote && !escaped) break;
        escaped = !escaped && ch == "\\";
      }
      if (!escaped) state.cur = normal;
      return "string";
    };
  }

  return {
    startState: function(basecol) {
      return {basecol: basecol || 0, indentDepth: 0, cur: normal};
    },

    token: function(stream, state) {
      if (stream.eatSpace()) return null;
      var style = state.cur(stream, state);
      var word = stream.current();
      if (style == "variable") {
        if (keywords.test(word)) style = "keyword";
        else if (builtins.test(word)) style = "builtin";
        else if (specials.test(word)) style = "variable-2";
      }
      if ((style != "comment") && (style != "string")){
        if (indentTokens.test(word)) ++state.indentDepth;
        else if (dedentTokens.test(word)) --state.indentDepth;
      }
      return style;
    },

    indent: function(state, textAfter) {
      var closing = dedentPartial.test(textAfter);
      return state.basecol + indentUnit * (state.indentDepth - (closing ? 1 : 0));
    },

    lineComment: "--",
    blockCommentStart: "--[[",
    blockCommentEnd: "]]"
  };
});

CodeMirror.defineMIME("text/x-lua", "lua");

});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/mathematica/mathematica.js":
/*!************************************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/mathematica/mathematica.js ***!
  \************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

// Mathematica mode copyright (c) 2015 by Calin Barbat
// Based on code by Patrick Scheibe (halirutan)
// See: https://github.com/halirutan/Mathematica-Source-Highlighting/tree/master/src/lang-mma.js

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"));
  else {}
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode('mathematica', function(_config, _parserConfig) {

  // used pattern building blocks
  var Identifier = '[a-zA-Z\\$][a-zA-Z0-9\\$]*';
  var pBase      = "(?:\\d+)";
  var pFloat     = "(?:\\.\\d+|\\d+\\.\\d*|\\d+)";
  var pFloatBase = "(?:\\.\\w+|\\w+\\.\\w*|\\w+)";
  var pPrecision = "(?:`(?:`?"+pFloat+")?)";

  // regular expressions
  var reBaseForm        = new RegExp('(?:'+pBase+'(?:\\^\\^'+pFloatBase+pPrecision+'?(?:\\*\\^[+-]?\\d+)?))');
  var reFloatForm       = new RegExp('(?:' + pFloat + pPrecision + '?(?:\\*\\^[+-]?\\d+)?)');
  var reIdInContext     = new RegExp('(?:`?)(?:' + Identifier + ')(?:`(?:' + Identifier + '))*(?:`?)');

  function tokenBase(stream, state) {
    var ch;

    // get next character
    ch = stream.next();

    // string
    if (ch === '"') {
      state.tokenize = tokenString;
      return state.tokenize(stream, state);
    }

    // comment
    if (ch === '(') {
      if (stream.eat('*')) {
        state.commentLevel++;
        state.tokenize = tokenComment;
        return state.tokenize(stream, state);
      }
    }

    // go back one character
    stream.backUp(1);

    // look for numbers
    // Numbers in a baseform
    if (stream.match(reBaseForm, true, false)) {
      return 'number';
    }

    // Mathematica numbers. Floats (1.2, .2, 1.) can have optionally a precision (`float) or an accuracy definition
    // (``float). Note: while 1.2` is possible 1.2`` is not. At the end an exponent (float*^+12) can follow.
    if (stream.match(reFloatForm, true, false)) {
      return 'number';
    }

    /* In[23] and Out[34] */
    if (stream.match(/(?:In|Out)\[[0-9]*\]/, true, false)) {
      return 'atom';
    }

    // usage
    if (stream.match(/([a-zA-Z\$][a-zA-Z0-9\$]*(?:`[a-zA-Z0-9\$]+)*::usage)/, true, false)) {
      return 'meta';
    }

    // message
    if (stream.match(/([a-zA-Z\$][a-zA-Z0-9\$]*(?:`[a-zA-Z0-9\$]+)*::[a-zA-Z\$][a-zA-Z0-9\$]*):?/, true, false)) {
      return 'string-2';
    }

    // this makes a look-ahead match for something like variable:{_Integer}
    // the match is then forwarded to the mma-patterns tokenizer.
    if (stream.match(/([a-zA-Z\$][a-zA-Z0-9\$]*\s*:)(?:(?:[a-zA-Z\$][a-zA-Z0-9\$]*)|(?:[^:=>~@\^\&\*\)\[\]'\?,\|])).*/, true, false)) {
      return 'variable-2';
    }

    // catch variables which are used together with Blank (_), BlankSequence (__) or BlankNullSequence (___)
    // Cannot start with a number, but can have numbers at any other position. Examples
    // blub__Integer, a1_, b34_Integer32
    if (stream.match(/[a-zA-Z\$][a-zA-Z0-9\$]*_+[a-zA-Z\$][a-zA-Z0-9\$]*/, true, false)) {
      return 'variable-2';
    }
    if (stream.match(/[a-zA-Z\$][a-zA-Z0-9\$]*_+/, true, false)) {
      return 'variable-2';
    }
    if (stream.match(/_+[a-zA-Z\$][a-zA-Z0-9\$]*/, true, false)) {
      return 'variable-2';
    }

    // Named characters in Mathematica, like \[Gamma].
    if (stream.match(/\\\[[a-zA-Z\$][a-zA-Z0-9\$]*\]/, true, false)) {
      return 'variable-3';
    }

    // Match all braces separately
    if (stream.match(/(?:\[|\]|{|}|\(|\))/, true, false)) {
      return 'bracket';
    }

    // Catch Slots (#, ##, #3, ##9 and the V10 named slots #name). I have never seen someone using more than one digit after #, so we match
    // only one.
    if (stream.match(/(?:#[a-zA-Z\$][a-zA-Z0-9\$]*|#+[0-9]?)/, true, false)) {
      return 'variable-2';
    }

    // Literals like variables, keywords, functions
    if (stream.match(reIdInContext, true, false)) {
      return 'keyword';
    }

    // operators. Note that operators like @@ or /; are matched separately for each symbol.
    if (stream.match(/(?:\\|\+|\-|\*|\/|,|;|\.|:|@|~|=|>|<|&|\||_|`|'|\^|\?|!|%)/, true, false)) {
      return 'operator';
    }

    // everything else is an error
    stream.next(); // advance the stream.
    return 'error';
  }

  function tokenString(stream, state) {
    var next, end = false, escaped = false;
    while ((next = stream.next()) != null) {
      if (next === '"' && !escaped) {
        end = true;
        break;
      }
      escaped = !escaped && next === '\\';
    }
    if (end && !escaped) {
      state.tokenize = tokenBase;
    }
    return 'string';
  };

  function tokenComment(stream, state) {
    var prev, next;
    while(state.commentLevel > 0 && (next = stream.next()) != null) {
      if (prev === '(' && next === '*') state.commentLevel++;
      if (prev === '*' && next === ')') state.commentLevel--;
      prev = next;
    }
    if (state.commentLevel <= 0) {
      state.tokenize = tokenBase;
    }
    return 'comment';
  }

  return {
    startState: function() {return {tokenize: tokenBase, commentLevel: 0};},
    token: function(stream, state) {
      if (stream.eatSpace()) return null;
      return state.tokenize(stream, state);
    },
    blockCommentStart: "(*",
    blockCommentEnd: "*)"
  };
});

CodeMirror.defineMIME('text/x-mathematica', {
  name: 'mathematica'
});

});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/mbox/mbox.js":
/*!**********************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/mbox/mbox.js ***!
  \**********************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"));
  else {}
})(function(CodeMirror) {
"use strict";

var rfc2822 = [
  "From", "Sender", "Reply-To", "To", "Cc", "Bcc", "Message-ID",
  "In-Reply-To", "References", "Resent-From", "Resent-Sender", "Resent-To",
  "Resent-Cc", "Resent-Bcc", "Resent-Message-ID", "Return-Path", "Received"
];
var rfc2822NoEmail = [
  "Date", "Subject", "Comments", "Keywords", "Resent-Date"
];

CodeMirror.registerHelper("hintWords", "mbox", rfc2822.concat(rfc2822NoEmail));

var whitespace = /^[ \t]/;
var separator = /^From /; // See RFC 4155
var rfc2822Header = new RegExp("^(" + rfc2822.join("|") + "): ");
var rfc2822HeaderNoEmail = new RegExp("^(" + rfc2822NoEmail.join("|") + "): ");
var header = /^[^:]+:/; // Optional fields defined in RFC 2822
var email = /^[^ ]+@[^ ]+/;
var untilEmail = /^.*?(?=[^ ]+?@[^ ]+)/;
var bracketedEmail = /^<.*?>/;
var untilBracketedEmail = /^.*?(?=<.*>)/;

function styleForHeader(header) {
  if (header === "Subject") return "header";
  return "string";
}

function readToken(stream, state) {
  if (stream.sol()) {
    // From last line
    state.inSeparator = false;
    if (state.inHeader && stream.match(whitespace)) {
      // Header folding
      return null;
    } else {
      state.inHeader = false;
      state.header = null;
    }

    if (stream.match(separator)) {
      state.inHeaders = true;
      state.inSeparator = true;
      return "atom";
    }

    var match;
    var emailPermitted = false;
    if ((match = stream.match(rfc2822HeaderNoEmail)) ||
        (emailPermitted = true) && (match = stream.match(rfc2822Header))) {
      state.inHeaders = true;
      state.inHeader = true;
      state.emailPermitted = emailPermitted;
      state.header = match[1];
      return "atom";
    }

    // Use vim's heuristics: recognize custom headers only if the line is in a
    // block of legitimate headers.
    if (state.inHeaders && (match = stream.match(header))) {
      state.inHeader = true;
      state.emailPermitted = true;
      state.header = match[1];
      return "atom";
    }

    state.inHeaders = false;
    stream.skipToEnd();
    return null;
  }

  if (state.inSeparator) {
    if (stream.match(email)) return "link";
    if (stream.match(untilEmail)) return "atom";
    stream.skipToEnd();
    return "atom";
  }

  if (state.inHeader) {
    var style = styleForHeader(state.header);

    if (state.emailPermitted) {
      if (stream.match(bracketedEmail)) return style + " link";
      if (stream.match(untilBracketedEmail)) return style;
    }
    stream.skipToEnd();
    return style;
  }

  stream.skipToEnd();
  return null;
};

CodeMirror.defineMode("mbox", function() {
  return {
    startState: function() {
      return {
        // Is in a mbox separator
        inSeparator: false,
        // Is in a mail header
        inHeader: false,
        // If bracketed email is permitted. Only applicable when inHeader
        emailPermitted: false,
        // Name of current header
        header: null,
        // Is in a region of mail headers
        inHeaders: false
      };
    },
    token: readToken,
    blankLine: function(state) {
      state.inHeaders = state.inSeparator = state.inHeader = false;
    }
  };
});

CodeMirror.defineMIME("application/mbox", "mbox");
});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/mirc/mirc.js":
/*!**********************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/mirc/mirc.js ***!
  \**********************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

//mIRC mode by Ford_Lawnmower :: Based on Velocity mode by Steve O'Hara

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"));
  else {}
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMIME("text/mirc", "mirc");
CodeMirror.defineMode("mirc", function() {
  function parseWords(str) {
    var obj = {}, words = str.split(" ");
    for (var i = 0; i < words.length; ++i) obj[words[i]] = true;
    return obj;
  }
  var specials = parseWords("$! $$ $& $? $+ $abook $abs $active $activecid " +
                            "$activewid $address $addtok $agent $agentname $agentstat $agentver " +
                            "$alias $and $anick $ansi2mirc $aop $appactive $appstate $asc $asctime " +
                            "$asin $atan $avoice $away $awaymsg $awaytime $banmask $base $bfind " +
                            "$binoff $biton $bnick $bvar $bytes $calc $cb $cd $ceil $chan $chanmodes " +
                            "$chantypes $chat $chr $cid $clevel $click $cmdbox $cmdline $cnick $color " +
                            "$com $comcall $comchan $comerr $compact $compress $comval $cos $count " +
                            "$cr $crc $creq $crlf $ctime $ctimer $ctrlenter $date $day $daylight " +
                            "$dbuh $dbuw $dccignore $dccport $dde $ddename $debug $decode $decompress " +
                            "$deltok $devent $dialog $did $didreg $didtok $didwm $disk $dlevel $dll " +
                            "$dllcall $dname $dns $duration $ebeeps $editbox $emailaddr $encode $error " +
                            "$eval $event $exist $feof $ferr $fgetc $file $filename $filtered $finddir " +
                            "$finddirn $findfile $findfilen $findtok $fline $floor $fopen $fread $fserve " +
                            "$fulladdress $fulldate $fullname $fullscreen $get $getdir $getdot $gettok $gmt " +
                            "$group $halted $hash $height $hfind $hget $highlight $hnick $hotline " +
                            "$hotlinepos $ial $ialchan $ibl $idle $iel $ifmatch $ignore $iif $iil " +
                            "$inelipse $ini $inmidi $inpaste $inpoly $input $inrect $inroundrect " +
                            "$insong $instok $int $inwave $ip $isalias $isbit $isdde $isdir $isfile " +
                            "$isid $islower $istok $isupper $keychar $keyrpt $keyval $knick $lactive " +
                            "$lactivecid $lactivewid $left $len $level $lf $line $lines $link $lock " +
                            "$lock $locked $log $logstamp $logstampfmt $longfn $longip $lower $ltimer " +
                            "$maddress $mask $matchkey $matchtok $md5 $me $menu $menubar $menucontext " +
                            "$menutype $mid $middir $mircdir $mircexe $mircini $mklogfn $mnick $mode " +
                            "$modefirst $modelast $modespl $mouse $msfile $network $newnick $nick $nofile " +
                            "$nopath $noqt $not $notags $notify $null $numeric $numok $oline $onpoly " +
                            "$opnick $or $ord $os $passivedcc $pic $play $pnick $port $portable $portfree " +
                            "$pos $prefix $prop $protect $puttok $qt $query $rand $r $rawmsg $read $readomo " +
                            "$readn $regex $regml $regsub $regsubex $remove $remtok $replace $replacex " +
                            "$reptok $result $rgb $right $round $scid $scon $script $scriptdir $scriptline " +
                            "$sdir $send $server $serverip $sfile $sha1 $shortfn $show $signal $sin " +
                            "$site $sline $snick $snicks $snotify $sock $sockbr $sockerr $sockname " +
                            "$sorttok $sound $sqrt $ssl $sreq $sslready $status $strip $str $stripped " +
                            "$syle $submenu $switchbar $tan $target $ticks $time $timer $timestamp " +
                            "$timestampfmt $timezone $tip $titlebar $toolbar $treebar $trust $ulevel " +
                            "$ulist $upper $uptime $url $usermode $v1 $v2 $var $vcmd $vcmdstat $vcmdver " +
                            "$version $vnick $vol $wid $width $wildsite $wildtok $window $wrap $xor");
  var keywords = parseWords("abook ajinvite alias aline ame amsg anick aop auser autojoin avoice " +
                            "away background ban bcopy beep bread break breplace bset btrunc bunset bwrite " +
                            "channel clear clearall cline clipboard close cnick color comclose comopen " +
                            "comreg continue copy creq ctcpreply ctcps dcc dccserver dde ddeserver " +
                            "debug dec describe dialog did didtok disable disconnect dlevel dline dll " +
                            "dns dqwindow drawcopy drawdot drawfill drawline drawpic drawrect drawreplace " +
                            "drawrot drawsave drawscroll drawtext ebeeps echo editbox emailaddr enable " +
                            "events exit fclose filter findtext finger firewall flash flist flood flush " +
                            "flushini font fopen fseek fsend fserve fullname fwrite ghide gload gmove " +
                            "gopts goto gplay gpoint gqreq groups gshow gsize gstop gtalk gunload hadd " +
                            "halt haltdef hdec hdel help hfree hinc hload hmake hop hsave ial ialclear " +
                            "ialmark identd if ignore iline inc invite iuser join kick linesep links list " +
                            "load loadbuf localinfo log mdi me menubar mkdir mnick mode msg nick noop notice " +
                            "notify omsg onotice part partall pdcc perform play playctrl pop protect pvoice " +
                            "qme qmsg query queryn quit raw reload remini remote remove rename renwin " +
                            "reseterror resetidle return rlevel rline rmdir run ruser save savebuf saveini " +
                            "say scid scon server set showmirc signam sline sockaccept sockclose socklist " +
                            "socklisten sockmark sockopen sockpause sockread sockrename sockudp sockwrite " +
                            "sound speak splay sreq strip switchbar timer timestamp titlebar tnick tokenize " +
                            "toolbar topic tray treebar ulist unload unset unsetall updatenl url uwho " +
                            "var vcadd vcmd vcrem vol while whois window winhelp write writeint if isalnum " +
                            "isalpha isaop isavoice isban ischan ishop isignore isin isincs isletter islower " +
                            "isnotify isnum ison isop isprotect isreg isupper isvoice iswm iswmcs " +
                            "elseif else goto menu nicklist status title icon size option text edit " +
                            "button check radio box scroll list combo link tab item");
  var functions = parseWords("if elseif else and not or eq ne in ni for foreach while switch");
  var isOperatorChar = /[+\-*&%=<>!?^\/\|]/;
  function chain(stream, state, f) {
    state.tokenize = f;
    return f(stream, state);
  }
  function tokenBase(stream, state) {
    var beforeParams = state.beforeParams;
    state.beforeParams = false;
    var ch = stream.next();
    if (/[\[\]{}\(\),\.]/.test(ch)) {
      if (ch == "(" && beforeParams) state.inParams = true;
      else if (ch == ")") state.inParams = false;
      return null;
    }
    else if (/\d/.test(ch)) {
      stream.eatWhile(/[\w\.]/);
      return "number";
    }
    else if (ch == "\\") {
      stream.eat("\\");
      stream.eat(/./);
      return "number";
    }
    else if (ch == "/" && stream.eat("*")) {
      return chain(stream, state, tokenComment);
    }
    else if (ch == ";" && stream.match(/ *\( *\(/)) {
      return chain(stream, state, tokenUnparsed);
    }
    else if (ch == ";" && !state.inParams) {
      stream.skipToEnd();
      return "comment";
    }
    else if (ch == '"') {
      stream.eat(/"/);
      return "keyword";
    }
    else if (ch == "$") {
      stream.eatWhile(/[$_a-z0-9A-Z\.:]/);
      if (specials && specials.propertyIsEnumerable(stream.current().toLowerCase())) {
        return "keyword";
      }
      else {
        state.beforeParams = true;
        return "builtin";
      }
    }
    else if (ch == "%") {
      stream.eatWhile(/[^,\s()]/);
      state.beforeParams = true;
      return "string";
    }
    else if (isOperatorChar.test(ch)) {
      stream.eatWhile(isOperatorChar);
      return "operator";
    }
    else {
      stream.eatWhile(/[\w\$_{}]/);
      var word = stream.current().toLowerCase();
      if (keywords && keywords.propertyIsEnumerable(word))
        return "keyword";
      if (functions && functions.propertyIsEnumerable(word)) {
        state.beforeParams = true;
        return "keyword";
      }
      return null;
    }
  }
  function tokenComment(stream, state) {
    var maybeEnd = false, ch;
    while (ch = stream.next()) {
      if (ch == "/" && maybeEnd) {
        state.tokenize = tokenBase;
        break;
      }
      maybeEnd = (ch == "*");
    }
    return "comment";
  }
  function tokenUnparsed(stream, state) {
    var maybeEnd = 0, ch;
    while (ch = stream.next()) {
      if (ch == ";" && maybeEnd == 2) {
        state.tokenize = tokenBase;
        break;
      }
      if (ch == ")")
        maybeEnd++;
      else if (ch != " ")
        maybeEnd = 0;
    }
    return "meta";
  }
  return {
    startState: function() {
      return {
        tokenize: tokenBase,
        beforeParams: false,
        inParams: false
      };
    },
    token: function(stream, state) {
      if (stream.eatSpace()) return null;
      return state.tokenize(stream, state);
    }
  };
});

});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/mllike/mllike.js":
/*!**************************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/mllike/mllike.js ***!
  \**************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"));
  else {}
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode('mllike', function(_config, parserConfig) {
  var words = {
    'as': 'keyword',
    'do': 'keyword',
    'else': 'keyword',
    'end': 'keyword',
    'exception': 'keyword',
    'fun': 'keyword',
    'functor': 'keyword',
    'if': 'keyword',
    'in': 'keyword',
    'include': 'keyword',
    'let': 'keyword',
    'of': 'keyword',
    'open': 'keyword',
    'rec': 'keyword',
    'struct': 'keyword',
    'then': 'keyword',
    'type': 'keyword',
    'val': 'keyword',
    'while': 'keyword',
    'with': 'keyword'
  };

  var extraWords = parserConfig.extraWords || {};
  for (var prop in extraWords) {
    if (extraWords.hasOwnProperty(prop)) {
      words[prop] = parserConfig.extraWords[prop];
    }
  }
  var hintWords = [];
  for (var k in words) { hintWords.push(k); }
  CodeMirror.registerHelper("hintWords", "mllike", hintWords);

  function tokenBase(stream, state) {
    var ch = stream.next();

    if (ch === '"') {
      state.tokenize = tokenString;
      return state.tokenize(stream, state);
    }
    if (ch === '{') {
      if (stream.eat('|')) {
        state.longString = true;
        state.tokenize = tokenLongString;
        return state.tokenize(stream, state);
      }
    }
    if (ch === '(') {
      if (stream.eat('*')) {
        state.commentLevel++;
        state.tokenize = tokenComment;
        return state.tokenize(stream, state);
      }
    }
    if (ch === '~' || ch === '?') {
      stream.eatWhile(/\w/);
      return 'variable-2';
    }
    if (ch === '`') {
      stream.eatWhile(/\w/);
      return 'quote';
    }
    if (ch === '/' && parserConfig.slashComments && stream.eat('/')) {
      stream.skipToEnd();
      return 'comment';
    }
    if (/\d/.test(ch)) {
      if (ch === '0' && stream.eat(/[bB]/)) {
        stream.eatWhile(/[01]/);
      } if (ch === '0' && stream.eat(/[xX]/)) {
        stream.eatWhile(/[0-9a-fA-F]/)
      } if (ch === '0' && stream.eat(/[oO]/)) {
        stream.eatWhile(/[0-7]/);
      } else {
        stream.eatWhile(/[\d_]/);
        if (stream.eat('.')) {
          stream.eatWhile(/[\d]/);
        }
        if (stream.eat(/[eE]/)) {
          stream.eatWhile(/[\d\-+]/);
        }
      }
      return 'number';
    }
    if ( /[+\-*&%=<>!?|@\.~:]/.test(ch)) {
      return 'operator';
    }
    if (/[\w\xa1-\uffff]/.test(ch)) {
      stream.eatWhile(/[\w\xa1-\uffff]/);
      var cur = stream.current();
      return words.hasOwnProperty(cur) ? words[cur] : 'variable';
    }
    return null
  }

  function tokenString(stream, state) {
    var next, end = false, escaped = false;
    while ((next = stream.next()) != null) {
      if (next === '"' && !escaped) {
        end = true;
        break;
      }
      escaped = !escaped && next === '\\';
    }
    if (end && !escaped) {
      state.tokenize = tokenBase;
    }
    return 'string';
  };

  function tokenComment(stream, state) {
    var prev, next;
    while(state.commentLevel > 0 && (next = stream.next()) != null) {
      if (prev === '(' && next === '*') state.commentLevel++;
      if (prev === '*' && next === ')') state.commentLevel--;
      prev = next;
    }
    if (state.commentLevel <= 0) {
      state.tokenize = tokenBase;
    }
    return 'comment';
  }

  function tokenLongString(stream, state) {
    var prev, next;
    while (state.longString && (next = stream.next()) != null) {
      if (prev === '|' && next === '}') state.longString = false;
      prev = next;
    }
    if (!state.longString) {
      state.tokenize = tokenBase;
    }
    return 'string';
  }

  return {
    startState: function() {return {tokenize: tokenBase, commentLevel: 0, longString: false};},
    token: function(stream, state) {
      if (stream.eatSpace()) return null;
      return state.tokenize(stream, state);
    },

    blockCommentStart: "(*",
    blockCommentEnd: "*)",
    lineComment: parserConfig.slashComments ? "//" : null
  };
});

CodeMirror.defineMIME('text/x-ocaml', {
  name: 'mllike',
  extraWords: {
    'and': 'keyword',
    'assert': 'keyword',
    'begin': 'keyword',
    'class': 'keyword',
    'constraint': 'keyword',
    'done': 'keyword',
    'downto': 'keyword',
    'external': 'keyword',
    'function': 'keyword',
    'initializer': 'keyword',
    'lazy': 'keyword',
    'match': 'keyword',
    'method': 'keyword',
    'module': 'keyword',
    'mutable': 'keyword',
    'new': 'keyword',
    'nonrec': 'keyword',
    'object': 'keyword',
    'private': 'keyword',
    'sig': 'keyword',
    'to': 'keyword',
    'try': 'keyword',
    'value': 'keyword',
    'virtual': 'keyword',
    'when': 'keyword',

    // builtins
    'raise': 'builtin',
    'failwith': 'builtin',
    'true': 'builtin',
    'false': 'builtin',

    // Pervasives builtins
    'asr': 'builtin',
    'land': 'builtin',
    'lor': 'builtin',
    'lsl': 'builtin',
    'lsr': 'builtin',
    'lxor': 'builtin',
    'mod': 'builtin',
    'or': 'builtin',

    // More Pervasives
    'raise_notrace': 'builtin',
    'trace': 'builtin',
    'exit': 'builtin',
    'print_string': 'builtin',
    'print_endline': 'builtin',

     'int': 'type',
     'float': 'type',
     'bool': 'type',
     'char': 'type',
     'string': 'type',
     'unit': 'type',

     // Modules
     'List': 'builtin'
  }
});

CodeMirror.defineMIME('text/x-fsharp', {
  name: 'mllike',
  extraWords: {
    'abstract': 'keyword',
    'assert': 'keyword',
    'base': 'keyword',
    'begin': 'keyword',
    'class': 'keyword',
    'default': 'keyword',
    'delegate': 'keyword',
    'do!': 'keyword',
    'done': 'keyword',
    'downcast': 'keyword',
    'downto': 'keyword',
    'elif': 'keyword',
    'extern': 'keyword',
    'finally': 'keyword',
    'for': 'keyword',
    'function': 'keyword',
    'global': 'keyword',
    'inherit': 'keyword',
    'inline': 'keyword',
    'interface': 'keyword',
    'internal': 'keyword',
    'lazy': 'keyword',
    'let!': 'keyword',
    'match': 'keyword',
    'member': 'keyword',
    'module': 'keyword',
    'mutable': 'keyword',
    'namespace': 'keyword',
    'new': 'keyword',
    'null': 'keyword',
    'override': 'keyword',
    'private': 'keyword',
    'public': 'keyword',
    'return!': 'keyword',
    'return': 'keyword',
    'select': 'keyword',
    'static': 'keyword',
    'to': 'keyword',
    'try': 'keyword',
    'upcast': 'keyword',
    'use!': 'keyword',
    'use': 'keyword',
    'void': 'keyword',
    'when': 'keyword',
    'yield!': 'keyword',
    'yield': 'keyword',

    // Reserved words
    'atomic': 'keyword',
    'break': 'keyword',
    'checked': 'keyword',
    'component': 'keyword',
    'const': 'keyword',
    'constraint': 'keyword',
    'constructor': 'keyword',
    'continue': 'keyword',
    'eager': 'keyword',
    'event': 'keyword',
    'external': 'keyword',
    'fixed': 'keyword',
    'method': 'keyword',
    'mixin': 'keyword',
    'object': 'keyword',
    'parallel': 'keyword',
    'process': 'keyword',
    'protected': 'keyword',
    'pure': 'keyword',
    'sealed': 'keyword',
    'tailcall': 'keyword',
    'trait': 'keyword',
    'virtual': 'keyword',
    'volatile': 'keyword',

    // builtins
    'List': 'builtin',
    'Seq': 'builtin',
    'Map': 'builtin',
    'Set': 'builtin',
    'Option': 'builtin',
    'int': 'builtin',
    'string': 'builtin',
    'not': 'builtin',
    'true': 'builtin',
    'false': 'builtin',

    'raise': 'builtin',
    'failwith': 'builtin'
  },
  slashComments: true
});


CodeMirror.defineMIME('text/x-sml', {
  name: 'mllike',
  extraWords: {
    'abstype': 'keyword',
    'and': 'keyword',
    'andalso': 'keyword',
    'case': 'keyword',
    'datatype': 'keyword',
    'fn': 'keyword',
    'handle': 'keyword',
    'infix': 'keyword',
    'infixr': 'keyword',
    'local': 'keyword',
    'nonfix': 'keyword',
    'op': 'keyword',
    'orelse': 'keyword',
    'raise': 'keyword',
    'withtype': 'keyword',
    'eqtype': 'keyword',
    'sharing': 'keyword',
    'sig': 'keyword',
    'signature': 'keyword',
    'structure': 'keyword',
    'where': 'keyword',
    'true': 'keyword',
    'false': 'keyword',

    // types
    'int': 'builtin',
    'real': 'builtin',
    'string': 'builtin',
    'char': 'builtin',
    'bool': 'builtin'
  },
  slashComments: true
});

});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/modelica/modelica.js":
/*!******************************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/modelica/modelica.js ***!
  \******************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

// Modelica support for CodeMirror, copyright (c) by Lennart Ochel

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"));
  else {}
})

(function(CodeMirror) {
  "use strict";

  CodeMirror.defineMode("modelica", function(config, parserConfig) {

    var indentUnit = config.indentUnit;
    var keywords = parserConfig.keywords || {};
    var builtin = parserConfig.builtin || {};
    var atoms = parserConfig.atoms || {};

    var isSingleOperatorChar = /[;=\(:\),{}.*<>+\-\/^\[\]]/;
    var isDoubleOperatorChar = /(:=|<=|>=|==|<>|\.\+|\.\-|\.\*|\.\/|\.\^)/;
    var isDigit = /[0-9]/;
    var isNonDigit = /[_a-zA-Z]/;

    function tokenLineComment(stream, state) {
      stream.skipToEnd();
      state.tokenize = null;
      return "comment";
    }

    function tokenBlockComment(stream, state) {
      var maybeEnd = false, ch;
      while (ch = stream.next()) {
        if (maybeEnd && ch == "/") {
          state.tokenize = null;
          break;
        }
        maybeEnd = (ch == "*");
      }
      return "comment";
    }

    function tokenString(stream, state) {
      var escaped = false, ch;
      while ((ch = stream.next()) != null) {
        if (ch == '"' && !escaped) {
          state.tokenize = null;
          state.sol = false;
          break;
        }
        escaped = !escaped && ch == "\\";
      }

      return "string";
    }

    function tokenIdent(stream, state) {
      stream.eatWhile(isDigit);
      while (stream.eat(isDigit) || stream.eat(isNonDigit)) { }


      var cur = stream.current();

      if(state.sol && (cur == "package" || cur == "model" || cur == "when" || cur == "connector")) state.level++;
      else if(state.sol && cur == "end" && state.level > 0) state.level--;

      state.tokenize = null;
      state.sol = false;

      if (keywords.propertyIsEnumerable(cur)) return "keyword";
      else if (builtin.propertyIsEnumerable(cur)) return "builtin";
      else if (atoms.propertyIsEnumerable(cur)) return "atom";
      else return "variable";
    }

    function tokenQIdent(stream, state) {
      while (stream.eat(/[^']/)) { }

      state.tokenize = null;
      state.sol = false;

      if(stream.eat("'"))
        return "variable";
      else
        return "error";
    }

    function tokenUnsignedNuber(stream, state) {
      stream.eatWhile(isDigit);
      if (stream.eat('.')) {
        stream.eatWhile(isDigit);
      }
      if (stream.eat('e') || stream.eat('E')) {
        if (!stream.eat('-'))
          stream.eat('+');
        stream.eatWhile(isDigit);
      }

      state.tokenize = null;
      state.sol = false;
      return "number";
    }

    // Interface
    return {
      startState: function() {
        return {
          tokenize: null,
          level: 0,
          sol: true
        };
      },

      token: function(stream, state) {
        if(state.tokenize != null) {
          return state.tokenize(stream, state);
        }

        if(stream.sol()) {
          state.sol = true;
        }

        // WHITESPACE
        if(stream.eatSpace()) {
          state.tokenize = null;
          return null;
        }

        var ch = stream.next();

        // LINECOMMENT
        if(ch == '/' && stream.eat('/')) {
          state.tokenize = tokenLineComment;
        }
        // BLOCKCOMMENT
        else if(ch == '/' && stream.eat('*')) {
          state.tokenize = tokenBlockComment;
        }
        // TWO SYMBOL TOKENS
        else if(isDoubleOperatorChar.test(ch+stream.peek())) {
          stream.next();
          state.tokenize = null;
          return "operator";
        }
        // SINGLE SYMBOL TOKENS
        else if(isSingleOperatorChar.test(ch)) {
          state.tokenize = null;
          return "operator";
        }
        // IDENT
        else if(isNonDigit.test(ch)) {
          state.tokenize = tokenIdent;
        }
        // Q-IDENT
        else if(ch == "'" && stream.peek() && stream.peek() != "'") {
          state.tokenize = tokenQIdent;
        }
        // STRING
        else if(ch == '"') {
          state.tokenize = tokenString;
        }
        // UNSIGNED_NUBER
        else if(isDigit.test(ch)) {
          state.tokenize = tokenUnsignedNuber;
        }
        // ERROR
        else {
          state.tokenize = null;
          return "error";
        }

        return state.tokenize(stream, state);
      },

      indent: function(state, textAfter) {
        if (state.tokenize != null) return CodeMirror.Pass;

        var level = state.level;
        if(/(algorithm)/.test(textAfter)) level--;
        if(/(equation)/.test(textAfter)) level--;
        if(/(initial algorithm)/.test(textAfter)) level--;
        if(/(initial equation)/.test(textAfter)) level--;
        if(/(end)/.test(textAfter)) level--;

        if(level > 0)
          return indentUnit*level;
        else
          return 0;
      },

      blockCommentStart: "/*",
      blockCommentEnd: "*/",
      lineComment: "//"
    };
  });

  function words(str) {
    var obj = {}, words = str.split(" ");
    for (var i=0; i<words.length; ++i)
      obj[words[i]] = true;
    return obj;
  }

  var modelicaKeywords = "algorithm and annotation assert block break class connect connector constant constrainedby der discrete each else elseif elsewhen encapsulated end enumeration equation expandable extends external false final flow for function if import impure in initial inner input loop model not operator or outer output package parameter partial protected public pure record redeclare replaceable return stream then true type when while within";
  var modelicaBuiltin = "abs acos actualStream asin atan atan2 cardinality ceil cos cosh delay div edge exp floor getInstanceName homotopy inStream integer log log10 mod pre reinit rem semiLinear sign sin sinh spatialDistribution sqrt tan tanh";
  var modelicaAtoms = "Real Boolean Integer String";

  function def(mimes, mode) {
    if (typeof mimes == "string")
      mimes = [mimes];

    var words = [];

    function add(obj) {
      if (obj)
        for (var prop in obj)
          if (obj.hasOwnProperty(prop))
            words.push(prop);
    }

    add(mode.keywords);
    add(mode.builtin);
    add(mode.atoms);

    if (words.length) {
      mode.helperType = mimes[0];
      CodeMirror.registerHelper("hintWords", mimes[0], words);
    }

    for (var i=0; i<mimes.length; ++i)
      CodeMirror.defineMIME(mimes[i], mode);
  }

  def(["text/x-modelica"], {
    name: "modelica",
    keywords: words(modelicaKeywords),
    builtin: words(modelicaBuiltin),
    atoms: words(modelicaAtoms)
  });
});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/mscgen/mscgen.js":
/*!**************************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/mscgen/mscgen.js ***!
  \**************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

// mode(s) for the sequence chart dsl's mscgen, xù and msgenny
// For more information on mscgen, see the site of the original author:
// http://www.mcternan.me.uk/mscgen
//
// This mode for mscgen and the two derivative languages were
// originally made for use in the mscgen_js interpreter
// (https://sverweij.github.io/mscgen_js)

(function(mod) {
  if ( true)// CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"));
  else {}
})(function(CodeMirror) {
  "use strict";

  var languages = {
    mscgen: {
      "keywords" : ["msc"],
      "options" : ["hscale", "width", "arcgradient", "wordwraparcs"],
      "constants" : ["true", "false", "on", "off"],
      "attributes" : ["label", "idurl", "id", "url", "linecolor", "linecolour", "textcolor", "textcolour", "textbgcolor", "textbgcolour", "arclinecolor", "arclinecolour", "arctextcolor", "arctextcolour", "arctextbgcolor", "arctextbgcolour", "arcskip"],
      "brackets" : ["\\{", "\\}"], // [ and  ] are brackets too, but these get handled in with lists
      "arcsWords" : ["note", "abox", "rbox", "box"],
      "arcsOthers" : ["\\|\\|\\|", "\\.\\.\\.", "---", "--", "<->", "==", "<<=>>", "<=>", "\\.\\.", "<<>>", "::", "<:>", "->", "=>>", "=>", ">>", ":>", "<-", "<<=", "<=", "<<", "<:", "x-", "-x"],
      "singlecomment" : ["//", "#"],
      "operators" : ["="]
    },
    xu: {
      "keywords" : ["msc", "xu"],
      "options" : ["hscale", "width", "arcgradient", "wordwraparcs", "wordwrapentities", "watermark"],
      "constants" : ["true", "false", "on", "off", "auto"],
      "attributes" : ["label", "idurl", "id", "url", "linecolor", "linecolour", "textcolor", "textcolour", "textbgcolor", "textbgcolour", "arclinecolor", "arclinecolour", "arctextcolor", "arctextcolour", "arctextbgcolor", "arctextbgcolour", "arcskip", "title", "deactivate", "activate", "activation"],
      "brackets" : ["\\{", "\\}"],  // [ and  ] are brackets too, but these get handled in with lists
      "arcsWords" : ["note", "abox", "rbox", "box", "alt", "else", "opt", "break", "par", "seq", "strict", "neg", "critical", "ignore", "consider", "assert", "loop", "ref", "exc"],
      "arcsOthers" : ["\\|\\|\\|", "\\.\\.\\.", "---", "--", "<->", "==", "<<=>>", "<=>", "\\.\\.", "<<>>", "::", "<:>", "->", "=>>", "=>", ">>", ":>", "<-", "<<=", "<=", "<<", "<:", "x-", "-x"],
      "singlecomment" : ["//", "#"],
      "operators" : ["="]
    },
    msgenny: {
      "keywords" : null,
      "options" : ["hscale", "width", "arcgradient", "wordwraparcs", "wordwrapentities", "watermark"],
      "constants" : ["true", "false", "on", "off", "auto"],
      "attributes" : null,
      "brackets" : ["\\{", "\\}"],
      "arcsWords" : ["note", "abox", "rbox", "box", "alt", "else", "opt", "break", "par", "seq", "strict", "neg", "critical", "ignore", "consider", "assert", "loop", "ref", "exc"],
      "arcsOthers" : ["\\|\\|\\|", "\\.\\.\\.", "---", "--", "<->", "==", "<<=>>", "<=>", "\\.\\.", "<<>>", "::", "<:>", "->", "=>>", "=>", ">>", ":>", "<-", "<<=", "<=", "<<", "<:", "x-", "-x"],
      "singlecomment" : ["//", "#"],
      "operators" : ["="]
    }
  }

  CodeMirror.defineMode("mscgen", function(_, modeConfig) {
    var language = languages[modeConfig && modeConfig.language || "mscgen"]
    return {
      startState: startStateFn,
      copyState: copyStateFn,
      token: produceTokenFunction(language),
      lineComment : "#",
      blockCommentStart : "/*",
      blockCommentEnd : "*/"
    };
  });

  CodeMirror.defineMIME("text/x-mscgen", "mscgen");
  CodeMirror.defineMIME("text/x-xu", {name: "mscgen", language: "xu"});
  CodeMirror.defineMIME("text/x-msgenny", {name: "mscgen", language: "msgenny"});

  function wordRegexpBoundary(pWords) {
    return new RegExp("\\b(" + pWords.join("|") + ")\\b", "i");
  }

  function wordRegexp(pWords) {
    return new RegExp("(" + pWords.join("|") + ")", "i");
  }

  function startStateFn() {
    return {
      inComment : false,
      inString : false,
      inAttributeList : false,
      inScript : false
    };
  }

  function copyStateFn(pState) {
    return {
      inComment : pState.inComment,
      inString : pState.inString,
      inAttributeList : pState.inAttributeList,
      inScript : pState.inScript
    };
  }

  function produceTokenFunction(pConfig) {

    return function(pStream, pState) {
      if (pStream.match(wordRegexp(pConfig.brackets), true, true)) {
        return "bracket";
      }
      /* comments */
      if (!pState.inComment) {
        if (pStream.match(/\/\*[^\*\/]*/, true, true)) {
          pState.inComment = true;
          return "comment";
        }
        if (pStream.match(wordRegexp(pConfig.singlecomment), true, true)) {
          pStream.skipToEnd();
          return "comment";
        }
      }
      if (pState.inComment) {
        if (pStream.match(/[^\*\/]*\*\//, true, true))
          pState.inComment = false;
        else
          pStream.skipToEnd();
        return "comment";
      }
      /* strings */
      if (!pState.inString && pStream.match(/\"(\\\"|[^\"])*/, true, true)) {
        pState.inString = true;
        return "string";
      }
      if (pState.inString) {
        if (pStream.match(/[^\"]*\"/, true, true))
          pState.inString = false;
        else
          pStream.skipToEnd();
        return "string";
      }
      /* keywords & operators */
      if (!!pConfig.keywords && pStream.match(wordRegexpBoundary(pConfig.keywords), true, true))
        return "keyword";

      if (pStream.match(wordRegexpBoundary(pConfig.options), true, true))
        return "keyword";

      if (pStream.match(wordRegexpBoundary(pConfig.arcsWords), true, true))
        return "keyword";

      if (pStream.match(wordRegexp(pConfig.arcsOthers), true, true))
        return "keyword";

      if (!!pConfig.operators && pStream.match(wordRegexp(pConfig.operators), true, true))
        return "operator";

      if (!!pConfig.constants && pStream.match(wordRegexp(pConfig.constants), true, true))
        return "variable";

      /* attribute lists */
      if (!pConfig.inAttributeList && !!pConfig.attributes && pStream.match(/\[/, true, true)) {
        pConfig.inAttributeList = true;
        return "bracket";
      }
      if (pConfig.inAttributeList) {
        if (pConfig.attributes !== null && pStream.match(wordRegexpBoundary(pConfig.attributes), true, true)) {
          return "attribute";
        }
        if (pStream.match(/]/, true, true)) {
          pConfig.inAttributeList = false;
          return "bracket";
        }
      }

      pStream.next();
      return "base";
    };
  }

});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/mumps/mumps.js":
/*!************************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/mumps/mumps.js ***!
  \************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

/*
  This MUMPS Language script was constructed using vbscript.js as a template.
*/

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"));
  else {}
})(function(CodeMirror) {
  "use strict";

  CodeMirror.defineMode("mumps", function() {
    function wordRegexp(words) {
      return new RegExp("^((" + words.join(")|(") + "))\\b", "i");
    }

    var singleOperators = new RegExp("^[\\+\\-\\*/&#!_?\\\\<>=\\'\\[\\]]");
    var doubleOperators = new RegExp("^(('=)|(<=)|(>=)|('>)|('<)|([[)|(]])|(^$))");
    var singleDelimiters = new RegExp("^[\\.,:]");
    var brackets = new RegExp("[()]");
    var identifiers = new RegExp("^[%A-Za-z][A-Za-z0-9]*");
    var commandKeywords = ["break","close","do","else","for","goto", "halt", "hang", "if", "job","kill","lock","merge","new","open", "quit", "read", "set", "tcommit", "trollback", "tstart", "use", "view", "write", "xecute", "b","c","d","e","f","g", "h", "i", "j","k","l","m","n","o", "q", "r", "s", "tc", "tro", "ts", "u", "v", "w", "x"];
    // The following list includes instrinsic functions _and_ special variables
    var intrinsicFuncsWords = ["\\$ascii", "\\$char", "\\$data", "\\$ecode", "\\$estack", "\\$etrap", "\\$extract", "\\$find", "\\$fnumber", "\\$get", "\\$horolog", "\\$io", "\\$increment", "\\$job", "\\$justify", "\\$length", "\\$name", "\\$next", "\\$order", "\\$piece", "\\$qlength", "\\$qsubscript", "\\$query", "\\$quit", "\\$random", "\\$reverse", "\\$select", "\\$stack", "\\$test", "\\$text", "\\$translate", "\\$view", "\\$x", "\\$y", "\\$a", "\\$c", "\\$d", "\\$e", "\\$ec", "\\$es", "\\$et", "\\$f", "\\$fn", "\\$g", "\\$h", "\\$i", "\\$j", "\\$l", "\\$n", "\\$na", "\\$o", "\\$p", "\\$q", "\\$ql", "\\$qs", "\\$r", "\\$re", "\\$s", "\\$st", "\\$t", "\\$tr", "\\$v", "\\$z"];
    var intrinsicFuncs = wordRegexp(intrinsicFuncsWords);
    var command = wordRegexp(commandKeywords);

    function tokenBase(stream, state) {
      if (stream.sol()) {
        state.label = true;
        state.commandMode = 0;
      }

      // The <space> character has meaning in MUMPS. Ignoring consecutive
      // spaces would interfere with interpreting whether the next non-space
      // character belongs to the command or argument context.

      // Examine each character and update a mode variable whose interpretation is:
      //   >0 => command    0 => argument    <0 => command post-conditional
      var ch = stream.peek();

      if (ch == " " || ch == "\t") { // Pre-process <space>
        state.label = false;
        if (state.commandMode == 0)
          state.commandMode = 1;
        else if ((state.commandMode < 0) || (state.commandMode == 2))
          state.commandMode = 0;
      } else if ((ch != ".") && (state.commandMode > 0)) {
        if (ch == ":")
          state.commandMode = -1;   // SIS - Command post-conditional
        else
          state.commandMode = 2;
      }

      // Do not color parameter list as line tag
      if ((ch === "(") || (ch === "\u0009"))
        state.label = false;

      // MUMPS comment starts with ";"
      if (ch === ";") {
        stream.skipToEnd();
        return "comment";
      }

      // Number Literals // SIS/RLM - MUMPS permits canonic number followed by concatenate operator
      if (stream.match(/^[-+]?\d+(\.\d+)?([eE][-+]?\d+)?/))
        return "number";

      // Handle Strings
      if (ch == '"') {
        if (stream.skipTo('"')) {
          stream.next();
          return "string";
        } else {
          stream.skipToEnd();
          return "error";
        }
      }

      // Handle operators and Delimiters
      if (stream.match(doubleOperators) || stream.match(singleOperators))
        return "operator";

      // Prevents leading "." in DO block from falling through to error
      if (stream.match(singleDelimiters))
        return null;

      if (brackets.test(ch)) {
        stream.next();
        return "bracket";
      }

      if (state.commandMode > 0 && stream.match(command))
        return "variable-2";

      if (stream.match(intrinsicFuncs))
        return "builtin";

      if (stream.match(identifiers))
        return "variable";

      // Detect dollar-sign when not a documented intrinsic function
      // "^" may introduce a GVN or SSVN - Color same as function
      if (ch === "$" || ch === "^") {
        stream.next();
        return "builtin";
      }

      // MUMPS Indirection
      if (ch === "@") {
        stream.next();
        return "string-2";
      }

      if (/[\w%]/.test(ch)) {
        stream.eatWhile(/[\w%]/);
        return "variable";
      }

      // Handle non-detected items
      stream.next();
      return "error";
    }

    return {
      startState: function() {
        return {
          label: false,
          commandMode: 0
        };
      },

      token: function(stream, state) {
        var style = tokenBase(stream, state);
        if (state.label) return "tag";
        return style;
      }
    };
  });

  CodeMirror.defineMIME("text/x-mumps", "mumps");
});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/nginx/nginx.js":
/*!************************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/nginx/nginx.js ***!
  \************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"));
  else {}
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode("nginx", function(config) {

  function words(str) {
    var obj = {}, words = str.split(" ");
    for (var i = 0; i < words.length; ++i) obj[words[i]] = true;
    return obj;
  }

  var keywords = words(
    /* ngxDirectiveControl */ "break return rewrite set" +
    /* ngxDirective */ " accept_mutex accept_mutex_delay access_log add_after_body add_before_body add_header addition_types aio alias allow ancient_browser ancient_browser_value auth_basic auth_basic_user_file auth_http auth_http_header auth_http_timeout autoindex autoindex_exact_size autoindex_localtime charset charset_types client_body_buffer_size client_body_in_file_only client_body_in_single_buffer client_body_temp_path client_body_timeout client_header_buffer_size client_header_timeout client_max_body_size connection_pool_size create_full_put_path daemon dav_access dav_methods debug_connection debug_points default_type degradation degrade deny devpoll_changes devpoll_events directio directio_alignment empty_gif env epoll_events error_log eventport_events expires fastcgi_bind fastcgi_buffer_size fastcgi_buffers fastcgi_busy_buffers_size fastcgi_cache fastcgi_cache_key fastcgi_cache_methods fastcgi_cache_min_uses fastcgi_cache_path fastcgi_cache_use_stale fastcgi_cache_valid fastcgi_catch_stderr fastcgi_connect_timeout fastcgi_hide_header fastcgi_ignore_client_abort fastcgi_ignore_headers fastcgi_index fastcgi_intercept_errors fastcgi_max_temp_file_size fastcgi_next_upstream fastcgi_param fastcgi_pass_header fastcgi_pass_request_body fastcgi_pass_request_headers fastcgi_read_timeout fastcgi_send_lowat fastcgi_send_timeout fastcgi_split_path_info fastcgi_store fastcgi_store_access fastcgi_temp_file_write_size fastcgi_temp_path fastcgi_upstream_fail_timeout fastcgi_upstream_max_fails flv geoip_city geoip_country google_perftools_profiles gzip gzip_buffers gzip_comp_level gzip_disable gzip_hash gzip_http_version gzip_min_length gzip_no_buffer gzip_proxied gzip_static gzip_types gzip_vary gzip_window if_modified_since ignore_invalid_headers image_filter image_filter_buffer image_filter_jpeg_quality image_filter_transparency imap_auth imap_capabilities imap_client_buffer index ip_hash keepalive_requests keepalive_timeout kqueue_changes kqueue_events large_client_header_buffers limit_conn limit_conn_log_level limit_rate limit_rate_after limit_req limit_req_log_level limit_req_zone limit_zone lingering_time lingering_timeout lock_file log_format log_not_found log_subrequest map_hash_bucket_size map_hash_max_size master_process memcached_bind memcached_buffer_size memcached_connect_timeout memcached_next_upstream memcached_read_timeout memcached_send_timeout memcached_upstream_fail_timeout memcached_upstream_max_fails merge_slashes min_delete_depth modern_browser modern_browser_value msie_padding msie_refresh multi_accept open_file_cache open_file_cache_errors open_file_cache_events open_file_cache_min_uses open_file_cache_valid open_log_file_cache output_buffers override_charset perl perl_modules perl_require perl_set pid pop3_auth pop3_capabilities port_in_redirect postpone_gzipping postpone_output protocol proxy proxy_bind proxy_buffer proxy_buffer_size proxy_buffering proxy_buffers proxy_busy_buffers_size proxy_cache proxy_cache_key proxy_cache_methods proxy_cache_min_uses proxy_cache_path proxy_cache_use_stale proxy_cache_valid proxy_connect_timeout proxy_headers_hash_bucket_size proxy_headers_hash_max_size proxy_hide_header proxy_ignore_client_abort proxy_ignore_headers proxy_intercept_errors proxy_max_temp_file_size proxy_method proxy_next_upstream proxy_pass_error_message proxy_pass_header proxy_pass_request_body proxy_pass_request_headers proxy_read_timeout proxy_redirect proxy_send_lowat proxy_send_timeout proxy_set_body proxy_set_header proxy_ssl_session_reuse proxy_store proxy_store_access proxy_temp_file_write_size proxy_temp_path proxy_timeout proxy_upstream_fail_timeout proxy_upstream_max_fails random_index read_ahead real_ip_header recursive_error_pages request_pool_size reset_timedout_connection resolver resolver_timeout rewrite_log rtsig_overflow_events rtsig_overflow_test rtsig_overflow_threshold rtsig_signo satisfy secure_link_secret send_lowat send_timeout sendfile sendfile_max_chunk server_name_in_redirect server_names_hash_bucket_size server_names_hash_max_size server_tokens set_real_ip_from smtp_auth smtp_capabilities smtp_client_buffer smtp_greeting_delay so_keepalive source_charset ssi ssi_ignore_recycled_buffers ssi_min_file_chunk ssi_silent_errors ssi_types ssi_value_length ssl ssl_certificate ssl_certificate_key ssl_ciphers ssl_client_certificate ssl_crl ssl_dhparam ssl_engine ssl_prefer_server_ciphers ssl_protocols ssl_session_cache ssl_session_timeout ssl_verify_client ssl_verify_depth starttls stub_status sub_filter sub_filter_once sub_filter_types tcp_nodelay tcp_nopush thread_stack_size timeout timer_resolution types_hash_bucket_size types_hash_max_size underscores_in_headers uninitialized_variable_warn use user userid userid_domain userid_expires userid_mark userid_name userid_p3p userid_path userid_service valid_referers variables_hash_bucket_size variables_hash_max_size worker_connections worker_cpu_affinity worker_priority worker_processes worker_rlimit_core worker_rlimit_nofile worker_rlimit_sigpending worker_threads working_directory xclient xml_entities xslt_stylesheet xslt_typesdrew@li229-23"
    );

  var keywords_block = words(
    /* ngxDirectiveBlock */ "http mail events server types location upstream charset_map limit_except if geo map"
    );

  var keywords_important = words(
    /* ngxDirectiveImportant */ "include root server server_name listen internal proxy_pass memcached_pass fastcgi_pass try_files"
    );

  var indentUnit = config.indentUnit, type;
  function ret(style, tp) {type = tp; return style;}

  function tokenBase(stream, state) {


    stream.eatWhile(/[\w\$_]/);

    var cur = stream.current();


    if (keywords.propertyIsEnumerable(cur)) {
      return "keyword";
    }
    else if (keywords_block.propertyIsEnumerable(cur)) {
      return "variable-2";
    }
    else if (keywords_important.propertyIsEnumerable(cur)) {
      return "string-2";
    }
    /**/

    var ch = stream.next();
    if (ch == "@") {stream.eatWhile(/[\w\\\-]/); return ret("meta", stream.current());}
    else if (ch == "/" && stream.eat("*")) {
      state.tokenize = tokenCComment;
      return tokenCComment(stream, state);
    }
    else if (ch == "<" && stream.eat("!")) {
      state.tokenize = tokenSGMLComment;
      return tokenSGMLComment(stream, state);
    }
    else if (ch == "=") ret(null, "compare");
    else if ((ch == "~" || ch == "|") && stream.eat("=")) return ret(null, "compare");
    else if (ch == "\"" || ch == "'") {
      state.tokenize = tokenString(ch);
      return state.tokenize(stream, state);
    }
    else if (ch == "#") {
      stream.skipToEnd();
      return ret("comment", "comment");
    }
    else if (ch == "!") {
      stream.match(/^\s*\w*/);
      return ret("keyword", "important");
    }
    else if (/\d/.test(ch)) {
      stream.eatWhile(/[\w.%]/);
      return ret("number", "unit");
    }
    else if (/[,.+>*\/]/.test(ch)) {
      return ret(null, "select-op");
    }
    else if (/[;{}:\[\]]/.test(ch)) {
      return ret(null, ch);
    }
    else {
      stream.eatWhile(/[\w\\\-]/);
      return ret("variable", "variable");
    }
  }

  function tokenCComment(stream, state) {
    var maybeEnd = false, ch;
    while ((ch = stream.next()) != null) {
      if (maybeEnd && ch == "/") {
        state.tokenize = tokenBase;
        break;
      }
      maybeEnd = (ch == "*");
    }
    return ret("comment", "comment");
  }

  function tokenSGMLComment(stream, state) {
    var dashes = 0, ch;
    while ((ch = stream.next()) != null) {
      if (dashes >= 2 && ch == ">") {
        state.tokenize = tokenBase;
        break;
      }
      dashes = (ch == "-") ? dashes + 1 : 0;
    }
    return ret("comment", "comment");
  }

  function tokenString(quote) {
    return function(stream, state) {
      var escaped = false, ch;
      while ((ch = stream.next()) != null) {
        if (ch == quote && !escaped)
          break;
        escaped = !escaped && ch == "\\";
      }
      if (!escaped) state.tokenize = tokenBase;
      return ret("string", "string");
    };
  }

  return {
    startState: function(base) {
      return {tokenize: tokenBase,
              baseIndent: base || 0,
              stack: []};
    },

    token: function(stream, state) {
      if (stream.eatSpace()) return null;
      type = null;
      var style = state.tokenize(stream, state);

      var context = state.stack[state.stack.length-1];
      if (type == "hash" && context == "rule") style = "atom";
      else if (style == "variable") {
        if (context == "rule") style = "number";
        else if (!context || context == "@media{") style = "tag";
      }

      if (context == "rule" && /^[\{\};]$/.test(type))
        state.stack.pop();
      if (type == "{") {
        if (context == "@media") state.stack[state.stack.length-1] = "@media{";
        else state.stack.push("{");
      }
      else if (type == "}") state.stack.pop();
      else if (type == "@media") state.stack.push("@media");
      else if (context == "{" && type != "comment") state.stack.push("rule");
      return style;
    },

    indent: function(state, textAfter) {
      var n = state.stack.length;
      if (/^\}/.test(textAfter))
        n -= state.stack[state.stack.length-1] == "rule" ? 2 : 1;
      return state.baseIndent + n * indentUnit;
    },

    electricChars: "}"
  };
});

CodeMirror.defineMIME("text/x-nginx-conf", "nginx");

});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/nsis/nsis.js":
/*!**********************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/nsis/nsis.js ***!
  \**********************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

// Author: Jan T. Sott (http://github.com/idleberg)

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"), __webpack_require__(/*! ../../addon/mode/simple */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/addon/mode/simple.js"));
  else {}
})(function(CodeMirror) {
"use strict";

CodeMirror.defineSimpleMode("nsis",{
  start:[
    // Numbers
    {regex: /(?:[+-]?)(?:0x[\d,a-f]+)|(?:0o[0-7]+)|(?:0b[0,1]+)|(?:\d+.?\d*)/, token: "number"},

    // Strings
    { regex: /"(?:[^\\"]|\\.)*"?/, token: "string" },
    { regex: /'(?:[^\\']|\\.)*'?/, token: "string" },
    { regex: /`(?:[^\\`]|\\.)*`?/, token: "string" },

    // Compile Time Commands
    {regex: /^\s*(?:\!(include|addincludedir|addplugindir|appendfile|cd|delfile|echo|error|execute|packhdr|pragma|finalize|getdllversion|gettlbversion|system|tempfile|warning|verbose|define|undef|insertmacro|macro|macroend|makensis|searchparse|searchreplace))\b/, token: "keyword"},

    // Conditional Compilation
    {regex: /^\s*(?:\!(if(?:n?def)?|ifmacron?def|macro))\b/, token: "keyword", indent: true},
    {regex: /^\s*(?:\!(else|endif|macroend))\b/, token: "keyword", dedent: true},

    // Runtime Commands
    {regex: /^\s*(?:Abort|AddBrandingImage|AddSize|AllowRootDirInstall|AllowSkipFiles|AutoCloseWindow|BGFont|BGGradient|BrandingText|BringToFront|Call|CallInstDLL|Caption|ChangeUI|CheckBitmap|ClearErrors|CompletedText|ComponentText|CopyFiles|CRCCheck|CreateDirectory|CreateFont|CreateShortCut|Delete|DeleteINISec|DeleteINIStr|DeleteRegKey|DeleteRegValue|DetailPrint|DetailsButtonText|DirText|DirVar|DirVerify|EnableWindow|EnumRegKey|EnumRegValue|Exch|Exec|ExecShell|ExecShellWait|ExecWait|ExpandEnvStrings|File|FileBufSize|FileClose|FileErrorText|FileOpen|FileRead|FileReadByte|FileReadUTF16LE|FileReadWord|FileWriteUTF16LE|FileSeek|FileWrite|FileWriteByte|FileWriteWord|FindClose|FindFirst|FindNext|FindWindow|FlushINI|GetCurInstType|GetCurrentAddress|GetDlgItem|GetDLLVersion|GetDLLVersionLocal|GetErrorLevel|GetFileTime|GetFileTimeLocal|GetFullPathName|GetFunctionAddress|GetInstDirError|GetLabelAddress|GetTempFileName|Goto|HideWindow|Icon|IfAbort|IfErrors|IfFileExists|IfRebootFlag|IfSilent|InitPluginsDir|InstallButtonText|InstallColors|InstallDir|InstallDirRegKey|InstProgressFlags|InstType|InstTypeGetText|InstTypeSetText|Int64Cmp|Int64CmpU|Int64Fmt|IntCmp|IntCmpU|IntFmt|IntOp|IntPtrCmp|IntPtrCmpU|IntPtrOp|IsWindow|LangString|LicenseBkColor|LicenseData|LicenseForceSelection|LicenseLangString|LicenseText|LoadLanguageFile|LockWindow|LogSet|LogText|ManifestDPIAware|ManifestSupportedOS|MessageBox|MiscButtonText|Name|Nop|OutFile|Page|PageCallbacks|PEDllCharacteristics|PESubsysVer|Pop|Push|Quit|ReadEnvStr|ReadINIStr|ReadRegDWORD|ReadRegStr|Reboot|RegDLL|Rename|RequestExecutionLevel|ReserveFile|Return|RMDir|SearchPath|SectionGetFlags|SectionGetInstTypes|SectionGetSize|SectionGetText|SectionIn|SectionSetFlags|SectionSetInstTypes|SectionSetSize|SectionSetText|SendMessage|SetAutoClose|SetBrandingImage|SetCompress|SetCompressor|SetCompressorDictSize|SetCtlColors|SetCurInstType|SetDatablockOptimize|SetDateSave|SetDetailsPrint|SetDetailsView|SetErrorLevel|SetErrors|SetFileAttributes|SetFont|SetOutPath|SetOverwrite|SetRebootFlag|SetRegView|SetShellVarContext|SetSilent|ShowInstDetails|ShowUninstDetails|ShowWindow|SilentInstall|SilentUnInstall|Sleep|SpaceTexts|StrCmp|StrCmpS|StrCpy|StrLen|SubCaption|Unicode|UninstallButtonText|UninstallCaption|UninstallIcon|UninstallSubCaption|UninstallText|UninstPage|UnRegDLL|Var|VIAddVersionKey|VIFileVersion|VIProductVersion|WindowIcon|WriteINIStr|WriteRegBin|WriteRegDWORD|WriteRegExpandStr|WriteRegMultiStr|WriteRegNone|WriteRegStr|WriteUninstaller|XPStyle)\b/, token: "keyword"},
    {regex: /^\s*(?:Function|PageEx|Section(?:Group)?)\b/, token: "keyword", indent: true},
    {regex: /^\s*(?:(Function|PageEx|Section(?:Group)?)End)\b/, token: "keyword", dedent: true},

    // Command Options
    {regex: /\b(?:ARCHIVE|FILE_ATTRIBUTE_ARCHIVE|FILE_ATTRIBUTE_HIDDEN|FILE_ATTRIBUTE_NORMAL|FILE_ATTRIBUTE_OFFLINE|FILE_ATTRIBUTE_READONLY|FILE_ATTRIBUTE_SYSTEM|FILE_ATTRIBUTE_TEMPORARY|HIDDEN|HKCC|HKCR(32|64)?|HKCU(32|64)?|HKDD|HKEY_CLASSES_ROOT|HKEY_CURRENT_CONFIG|HKEY_CURRENT_USER|HKEY_DYN_DATA|HKEY_LOCAL_MACHINE|HKEY_PERFORMANCE_DATA|HKEY_USERS|HKLM(32|64)?|HKPD|HKU|IDABORT|IDCANCEL|IDD_DIR|IDD_INST|IDD_INSTFILES|IDD_LICENSE|IDD_SELCOM|IDD_UNINST|IDD_VERIFY|IDIGNORE|IDNO|IDOK|IDRETRY|IDYES|MB_ABORTRETRYIGNORE|MB_DEFBUTTON1|MB_DEFBUTTON2|MB_DEFBUTTON3|MB_DEFBUTTON4|MB_ICONEXCLAMATION|MB_ICONINFORMATION|MB_ICONQUESTION|MB_ICONSTOP|MB_OK|MB_OKCANCEL|MB_RETRYCANCEL|MB_RIGHT|MB_RTLREADING|MB_SETFOREGROUND|MB_TOPMOST|MB_USERICON|MB_YESNO|MB_YESNOCANCEL|NORMAL|OFFLINE|READONLY|SHCTX|SHELL_CONTEXT|SW_HIDE|SW_SHOWDEFAULT|SW_SHOWMAXIMIZED|SW_SHOWMINIMIZED|SW_SHOWNORMAL|SYSTEM|TEMPORARY)\b/, token: "atom"},
    {regex: /\b(?:admin|all|auto|both|bottom|bzip2|components|current|custom|directory|false|force|hide|highest|ifdiff|ifnewer|instfiles|lastused|leave|left|license|listonly|lzma|nevershow|none|normal|notset|off|on|right|show|silent|silentlog|textonly|top|true|try|un\.components|un\.custom|un\.directory|un\.instfiles|un\.license|uninstConfirm|user|Win10|Win7|Win8|WinVista|zlib)\b/, token: "builtin"},

    // LogicLib.nsh
    {regex: /\$\{(?:And(?:If(?:Not)?|Unless)|Break|Case(?:Else)?|Continue|Default|Do(?:Until|While)?|Else(?:If(?:Not)?|Unless)?|End(?:If|Select|Switch)|Exit(?:Do|For|While)|For(?:Each)?|If(?:Cmd|Not(?:Then)?|Then)?|Loop(?:Until|While)?|Or(?:If(?:Not)?|Unless)|Select|Switch|Unless|While)\}/, token: "variable-2", indent: true},

    // FileFunc.nsh
    {regex: /\$\{(?:BannerTrimPath|DirState|DriveSpace|Get(BaseName|Drives|ExeName|ExePath|FileAttributes|FileExt|FileName|FileVersion|Options|OptionsS|Parameters|Parent|Root|Size|Time)|Locate|RefreshShellIcons)\}/, token: "variable-2", dedent: true},

    // Memento.nsh
    {regex: /\$\{(?:Memento(?:Section(?:Done|End|Restore|Save)?|UnselectedSection))\}/, token: "variable-2", dedent: true},

    // TextFunc.nsh
    {regex: /\$\{(?:Config(?:Read|ReadS|Write|WriteS)|File(?:Join|ReadFromEnd|Recode)|Line(?:Find|Read|Sum)|Text(?:Compare|CompareS)|TrimNewLines)\}/, token: "variable-2", dedent: true},

    // WinVer.nsh
    {regex: /\$\{(?:(?:At(?:Least|Most)|Is)(?:ServicePack|Win(?:7|8|10|95|98|200(?:0|3|8(?:R2)?)|ME|NT4|Vista|XP))|Is(?:NT|Server))\}/, token: "variable", dedent: true},

    // WordFunc.nsh
    {regex: /\$\{(?:StrFilterS?|Version(?:Compare|Convert)|Word(?:AddS?|Find(?:(?:2|3)X)?S?|InsertS?|ReplaceS?))\}/, token: "variable-2", dedent: true},

    // x64.nsh
    {regex: /\$\{(?:RunningX64)\}/, token: "variable", dedent: true},
    {regex: /\$\{(?:Disable|Enable)X64FSRedirection\}/, token: "variable-2", dedent: true},

    // Line Comment
    {regex: /(#|;).*/, token: "comment"},

    // Block Comment
    {regex: /\/\*/, token: "comment", next: "comment"},

    // Operator
    {regex: /[-+\/*=<>!]+/, token: "operator"},

    // Variable
    {regex: /\$\w+/, token: "variable"},

    // Constant
    {regex: /\${[\w\.:-]+}/, token: "variable-2"},

    // Language String
    {regex: /\$\([\w\.:-]+\)/, token: "variable-3"}
  ],
  comment: [
    {regex: /.*?\*\//, token: "comment", next: "start"},
    {regex: /.*/, token: "comment"}
  ],
  meta: {
    electricInput: /^\s*((Function|PageEx|Section|Section(Group)?)End|(\!(endif|macroend))|\$\{(End(If|Unless|While)|Loop(Until)|Next)\})$/,
    blockCommentStart: "/*",
    blockCommentEnd: "*/",
    lineComment: ["#", ";"]
  }
});

CodeMirror.defineMIME("text/x-nsis", "nsis");
});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/ntriples/ntriples.js":
/*!******************************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/ntriples/ntriples.js ***!
  \******************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

/**********************************************************
* This script provides syntax highlighting support for
* the N-Triples format.
* N-Triples format specification:
*     https://www.w3.org/TR/n-triples/
***********************************************************/

/*
    The following expression defines the defined ASF grammar transitions.

    pre_subject ->
        {
        ( writing_subject_uri | writing_bnode_uri )
            -> pre_predicate
                -> writing_predicate_uri
                    -> pre_object
                        -> writing_object_uri | writing_object_bnode |
                          (
                            writing_object_literal
                                -> writing_literal_lang | writing_literal_type
                          )
                            -> post_object
                                -> BEGIN
         } otherwise {
             -> ERROR
         }
*/

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"));
  else {}
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode("ntriples", function() {

  var Location = {
    PRE_SUBJECT         : 0,
    WRITING_SUB_URI     : 1,
    WRITING_BNODE_URI   : 2,
    PRE_PRED            : 3,
    WRITING_PRED_URI    : 4,
    PRE_OBJ             : 5,
    WRITING_OBJ_URI     : 6,
    WRITING_OBJ_BNODE   : 7,
    WRITING_OBJ_LITERAL : 8,
    WRITING_LIT_LANG    : 9,
    WRITING_LIT_TYPE    : 10,
    POST_OBJ            : 11,
    ERROR               : 12
  };
  function transitState(currState, c) {
    var currLocation = currState.location;
    var ret;

    // Opening.
    if     (currLocation == Location.PRE_SUBJECT && c == '<') ret = Location.WRITING_SUB_URI;
    else if(currLocation == Location.PRE_SUBJECT && c == '_') ret = Location.WRITING_BNODE_URI;
    else if(currLocation == Location.PRE_PRED    && c == '<') ret = Location.WRITING_PRED_URI;
    else if(currLocation == Location.PRE_OBJ     && c == '<') ret = Location.WRITING_OBJ_URI;
    else if(currLocation == Location.PRE_OBJ     && c == '_') ret = Location.WRITING_OBJ_BNODE;
    else if(currLocation == Location.PRE_OBJ     && c == '"') ret = Location.WRITING_OBJ_LITERAL;

    // Closing.
    else if(currLocation == Location.WRITING_SUB_URI     && c == '>') ret = Location.PRE_PRED;
    else if(currLocation == Location.WRITING_BNODE_URI   && c == ' ') ret = Location.PRE_PRED;
    else if(currLocation == Location.WRITING_PRED_URI    && c == '>') ret = Location.PRE_OBJ;
    else if(currLocation == Location.WRITING_OBJ_URI     && c == '>') ret = Location.POST_OBJ;
    else if(currLocation == Location.WRITING_OBJ_BNODE   && c == ' ') ret = Location.POST_OBJ;
    else if(currLocation == Location.WRITING_OBJ_LITERAL && c == '"') ret = Location.POST_OBJ;
    else if(currLocation == Location.WRITING_LIT_LANG && c == ' ') ret = Location.POST_OBJ;
    else if(currLocation == Location.WRITING_LIT_TYPE && c == '>') ret = Location.POST_OBJ;

    // Closing typed and language literal.
    else if(currLocation == Location.WRITING_OBJ_LITERAL && c == '@') ret = Location.WRITING_LIT_LANG;
    else if(currLocation == Location.WRITING_OBJ_LITERAL && c == '^') ret = Location.WRITING_LIT_TYPE;

    // Spaces.
    else if( c == ' ' &&
             (
               currLocation == Location.PRE_SUBJECT ||
               currLocation == Location.PRE_PRED    ||
               currLocation == Location.PRE_OBJ     ||
               currLocation == Location.POST_OBJ
             )
           ) ret = currLocation;

    // Reset.
    else if(currLocation == Location.POST_OBJ && c == '.') ret = Location.PRE_SUBJECT;

    // Error
    else ret = Location.ERROR;

    currState.location=ret;
  }

  return {
    startState: function() {
       return {
           location : Location.PRE_SUBJECT,
           uris     : [],
           anchors  : [],
           bnodes   : [],
           langs    : [],
           types    : []
       };
    },
    token: function(stream, state) {
      var ch = stream.next();
      if(ch == '<') {
         transitState(state, ch);
         var parsedURI = '';
         stream.eatWhile( function(c) { if( c != '#' && c != '>' ) { parsedURI += c; return true; } return false;} );
         state.uris.push(parsedURI);
         if( stream.match('#', false) ) return 'variable';
         stream.next();
         transitState(state, '>');
         return 'variable';
      }
      if(ch == '#') {
        var parsedAnchor = '';
        stream.eatWhile(function(c) { if(c != '>' && c != ' ') { parsedAnchor+= c; return true; } return false;});
        state.anchors.push(parsedAnchor);
        return 'variable-2';
      }
      if(ch == '>') {
          transitState(state, '>');
          return 'variable';
      }
      if(ch == '_') {
          transitState(state, ch);
          var parsedBNode = '';
          stream.eatWhile(function(c) { if( c != ' ' ) { parsedBNode += c; return true; } return false;});
          state.bnodes.push(parsedBNode);
          stream.next();
          transitState(state, ' ');
          return 'builtin';
      }
      if(ch == '"') {
          transitState(state, ch);
          stream.eatWhile( function(c) { return c != '"'; } );
          stream.next();
          if( stream.peek() != '@' && stream.peek() != '^' ) {
              transitState(state, '"');
          }
          return 'string';
      }
      if( ch == '@' ) {
          transitState(state, '@');
          var parsedLang = '';
          stream.eatWhile(function(c) { if( c != ' ' ) { parsedLang += c; return true; } return false;});
          state.langs.push(parsedLang);
          stream.next();
          transitState(state, ' ');
          return 'string-2';
      }
      if( ch == '^' ) {
          stream.next();
          transitState(state, '^');
          var parsedType = '';
          stream.eatWhile(function(c) { if( c != '>' ) { parsedType += c; return true; } return false;} );
          state.types.push(parsedType);
          stream.next();
          transitState(state, '>');
          return 'variable';
      }
      if( ch == ' ' ) {
          transitState(state, ch);
      }
      if( ch == '.' ) {
          transitState(state, ch);
      }
    }
  };
});

// define the registered Media Type for n-triples:
// https://www.w3.org/TR/n-triples/#n-triples-mediatype
CodeMirror.defineMIME("application/n-triples", "ntriples");

// N-Quads is based on the N-Triples format (so same highlighting works)
// https://www.w3.org/TR/n-quads/
CodeMirror.defineMIME("application/n-quads", "ntriples");

// previously used, though technically incorrect media type for n-triples
CodeMirror.defineMIME("text/n-triples", "ntriples");

});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/octave/octave.js":
/*!**************************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/octave/octave.js ***!
  \**************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"));
  else {}
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode("octave", function() {
  function wordRegexp(words) {
    return new RegExp("^((" + words.join(")|(") + "))\\b");
  }

  var singleOperators = new RegExp("^[\\+\\-\\*/&|\\^~<>!@'\\\\]");
  var singleDelimiters = new RegExp('^[\\(\\[\\{\\},:=;]');
  var doubleOperators = new RegExp("^((==)|(~=)|(<=)|(>=)|(<<)|(>>)|(\\.[\\+\\-\\*/\\^\\\\]))");
  var doubleDelimiters = new RegExp("^((!=)|(\\+=)|(\\-=)|(\\*=)|(/=)|(&=)|(\\|=)|(\\^=))");
  var tripleDelimiters = new RegExp("^((>>=)|(<<=))");
  var expressionEnd = new RegExp("^[\\]\\)]");
  var identifiers = new RegExp("^[_A-Za-z\xa1-\uffff][_A-Za-z0-9\xa1-\uffff]*");

  var builtins = wordRegexp([
    'error', 'eval', 'function', 'abs', 'acos', 'atan', 'asin', 'cos',
    'cosh', 'exp', 'log', 'prod', 'sum', 'log10', 'max', 'min', 'sign', 'sin', 'sinh',
    'sqrt', 'tan', 'reshape', 'break', 'zeros', 'default', 'margin', 'round', 'ones',
    'rand', 'syn', 'ceil', 'floor', 'size', 'clear', 'zeros', 'eye', 'mean', 'std', 'cov',
    'det', 'eig', 'inv', 'norm', 'rank', 'trace', 'expm', 'logm', 'sqrtm', 'linspace', 'plot',
    'title', 'xlabel', 'ylabel', 'legend', 'text', 'grid', 'meshgrid', 'mesh', 'num2str',
    'fft', 'ifft', 'arrayfun', 'cellfun', 'input', 'fliplr', 'flipud', 'ismember'
  ]);

  var keywords = wordRegexp([
    'return', 'case', 'switch', 'else', 'elseif', 'end', 'endif', 'endfunction',
    'if', 'otherwise', 'do', 'for', 'while', 'try', 'catch', 'classdef', 'properties', 'events',
    'methods', 'global', 'persistent', 'endfor', 'endwhile', 'printf', 'sprintf', 'disp', 'until',
    'continue', 'pkg'
  ]);


  // tokenizers
  function tokenTranspose(stream, state) {
    if (!stream.sol() && stream.peek() === '\'') {
      stream.next();
      state.tokenize = tokenBase;
      return 'operator';
    }
    state.tokenize = tokenBase;
    return tokenBase(stream, state);
  }


  function tokenComment(stream, state) {
    if (stream.match(/^.*%}/)) {
      state.tokenize = tokenBase;
      return 'comment';
    };
    stream.skipToEnd();
    return 'comment';
  }

  function tokenBase(stream, state) {
    // whitespaces
    if (stream.eatSpace()) return null;

    // Handle one line Comments
    if (stream.match('%{')){
      state.tokenize = tokenComment;
      stream.skipToEnd();
      return 'comment';
    }

    if (stream.match(/^[%#]/)){
      stream.skipToEnd();
      return 'comment';
    }

    // Handle Number Literals
    if (stream.match(/^[0-9\.+-]/, false)) {
      if (stream.match(/^[+-]?0x[0-9a-fA-F]+[ij]?/)) {
        stream.tokenize = tokenBase;
        return 'number'; };
      if (stream.match(/^[+-]?\d*\.\d+([EeDd][+-]?\d+)?[ij]?/)) { return 'number'; };
      if (stream.match(/^[+-]?\d+([EeDd][+-]?\d+)?[ij]?/)) { return 'number'; };
    }
    if (stream.match(wordRegexp(['nan','NaN','inf','Inf']))) { return 'number'; };

    // Handle Strings
    var m = stream.match(/^"(?:[^"]|"")*("|$)/) || stream.match(/^'(?:[^']|'')*('|$)/)
    if (m) { return m[1] ? 'string' : "string error"; }

    // Handle words
    if (stream.match(keywords)) { return 'keyword'; } ;
    if (stream.match(builtins)) { return 'builtin'; } ;
    if (stream.match(identifiers)) { return 'variable'; } ;

    if (stream.match(singleOperators) || stream.match(doubleOperators)) { return 'operator'; };
    if (stream.match(singleDelimiters) || stream.match(doubleDelimiters) || stream.match(tripleDelimiters)) { return null; };

    if (stream.match(expressionEnd)) {
      state.tokenize = tokenTranspose;
      return null;
    };


    // Handle non-detected items
    stream.next();
    return 'error';
  };


  return {
    startState: function() {
      return {
        tokenize: tokenBase
      };
    },

    token: function(stream, state) {
      var style = state.tokenize(stream, state);
      if (style === 'number' || style === 'variable'){
        state.tokenize = tokenTranspose;
      }
      return style;
    },

    lineComment: '%',

    fold: 'indent'
  };
});

CodeMirror.defineMIME("text/x-octave", "octave");

});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/oz/oz.js":
/*!******************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/oz/oz.js ***!
  \******************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"));
  else {}
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode("oz", function (conf) {

  function wordRegexp(words) {
    return new RegExp("^((" + words.join(")|(") + "))\\b");
  }

  var singleOperators = /[\^@!\|<>#~\.\*\-\+\\/,=]/;
  var doubleOperators = /(<-)|(:=)|(=<)|(>=)|(<=)|(<:)|(>:)|(=:)|(\\=)|(\\=:)|(!!)|(==)|(::)/;
  var tripleOperators = /(:::)|(\.\.\.)|(=<:)|(>=:)/;

  var middle = ["in", "then", "else", "of", "elseof", "elsecase", "elseif", "catch",
    "finally", "with", "require", "prepare", "import", "export", "define", "do"];
  var end = ["end"];

  var atoms = wordRegexp(["true", "false", "nil", "unit"]);
  var commonKeywords = wordRegexp(["andthen", "at", "attr", "declare", "feat", "from", "lex",
    "mod", "div", "mode", "orelse", "parser", "prod", "prop", "scanner", "self", "syn", "token"]);
  var openingKeywords = wordRegexp(["local", "proc", "fun", "case", "class", "if", "cond", "or", "dis",
    "choice", "not", "thread", "try", "raise", "lock", "for", "suchthat", "meth", "functor"]);
  var middleKeywords = wordRegexp(middle);
  var endKeywords = wordRegexp(end);

  // Tokenizers
  function tokenBase(stream, state) {
    if (stream.eatSpace()) {
      return null;
    }

    // Brackets
    if(stream.match(/[{}]/)) {
      return "bracket";
    }

    // Special [] keyword
    if (stream.match(/(\[])/)) {
        return "keyword"
    }

    // Operators
    if (stream.match(tripleOperators) || stream.match(doubleOperators)) {
      return "operator";
    }

    // Atoms
    if(stream.match(atoms)) {
      return 'atom';
    }

    // Opening keywords
    var matched = stream.match(openingKeywords);
    if (matched) {
      if (!state.doInCurrentLine)
        state.currentIndent++;
      else
        state.doInCurrentLine = false;

      // Special matching for signatures
      if(matched[0] == "proc" || matched[0] == "fun")
        state.tokenize = tokenFunProc;
      else if(matched[0] == "class")
        state.tokenize = tokenClass;
      else if(matched[0] == "meth")
        state.tokenize = tokenMeth;

      return 'keyword';
    }

    // Middle and other keywords
    if (stream.match(middleKeywords) || stream.match(commonKeywords)) {
      return "keyword"
    }

    // End keywords
    if (stream.match(endKeywords)) {
      state.currentIndent--;
      return 'keyword';
    }

    // Eat the next char for next comparisons
    var ch = stream.next();

    // Strings
    if (ch == '"' || ch == "'") {
      state.tokenize = tokenString(ch);
      return state.tokenize(stream, state);
    }

    // Numbers
    if (/[~\d]/.test(ch)) {
      if (ch == "~") {
        if(! /^[0-9]/.test(stream.peek()))
          return null;
        else if (( stream.next() == "0" && stream.match(/^[xX][0-9a-fA-F]+/)) || stream.match(/^[0-9]*(\.[0-9]+)?([eE][~+]?[0-9]+)?/))
          return "number";
      }

      if ((ch == "0" && stream.match(/^[xX][0-9a-fA-F]+/)) || stream.match(/^[0-9]*(\.[0-9]+)?([eE][~+]?[0-9]+)?/))
        return "number";

      return null;
    }

    // Comments
    if (ch == "%") {
      stream.skipToEnd();
      return 'comment';
    }
    else if (ch == "/") {
      if (stream.eat("*")) {
        state.tokenize = tokenComment;
        return tokenComment(stream, state);
      }
    }

    // Single operators
    if(singleOperators.test(ch)) {
      return "operator";
    }

    // If nothing match, we skip the entire alphanumerical block
    stream.eatWhile(/\w/);

    return "variable";
  }

  function tokenClass(stream, state) {
    if (stream.eatSpace()) {
      return null;
    }
    stream.match(/([A-Z][A-Za-z0-9_]*)|(`.+`)/);
    state.tokenize = tokenBase;
    return "variable-3"
  }

  function tokenMeth(stream, state) {
    if (stream.eatSpace()) {
      return null;
    }
    stream.match(/([a-zA-Z][A-Za-z0-9_]*)|(`.+`)/);
    state.tokenize = tokenBase;
    return "def"
  }

  function tokenFunProc(stream, state) {
    if (stream.eatSpace()) {
      return null;
    }

    if(!state.hasPassedFirstStage && stream.eat("{")) {
      state.hasPassedFirstStage = true;
      return "bracket";
    }
    else if(state.hasPassedFirstStage) {
      stream.match(/([A-Z][A-Za-z0-9_]*)|(`.+`)|\$/);
      state.hasPassedFirstStage = false;
      state.tokenize = tokenBase;
      return "def"
    }
    else {
      state.tokenize = tokenBase;
      return null;
    }
  }

  function tokenComment(stream, state) {
    var maybeEnd = false, ch;
    while (ch = stream.next()) {
      if (ch == "/" && maybeEnd) {
        state.tokenize = tokenBase;
        break;
      }
      maybeEnd = (ch == "*");
    }
    return "comment";
  }

  function tokenString(quote) {
    return function (stream, state) {
      var escaped = false, next, end = false;
      while ((next = stream.next()) != null) {
        if (next == quote && !escaped) {
          end = true;
          break;
        }
        escaped = !escaped && next == "\\";
      }
      if (end || !escaped)
        state.tokenize = tokenBase;
      return "string";
    };
  }

  function buildElectricInputRegEx() {
    // Reindentation should occur on [] or on a match of any of
    // the block closing keywords, at the end of a line.
    var allClosings = middle.concat(end);
    return new RegExp("[\\[\\]]|(" + allClosings.join("|") + ")$");
  }

  return {

    startState: function () {
      return {
        tokenize: tokenBase,
        currentIndent: 0,
        doInCurrentLine: false,
        hasPassedFirstStage: false
      };
    },

    token: function (stream, state) {
      if (stream.sol())
        state.doInCurrentLine = 0;

      return state.tokenize(stream, state);
    },

    indent: function (state, textAfter) {
      var trueText = textAfter.replace(/^\s+|\s+$/g, '');

      if (trueText.match(endKeywords) || trueText.match(middleKeywords) || trueText.match(/(\[])/))
        return conf.indentUnit * (state.currentIndent - 1);

      if (state.currentIndent < 0)
        return 0;

      return state.currentIndent * conf.indentUnit;
    },
    fold: "indent",
    electricInput: buildElectricInputRegEx(),
    lineComment: "%",
    blockCommentStart: "/*",
    blockCommentEnd: "*/"
  };
});

CodeMirror.defineMIME("text/x-oz", "oz");

});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/pascal/pascal.js":
/*!**************************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/pascal/pascal.js ***!
  \**************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"));
  else {}
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode("pascal", function() {
  function words(str) {
    var obj = {}, words = str.split(" ");
    for (var i = 0; i < words.length; ++i) obj[words[i]] = true;
    return obj;
  }
  var keywords = words(
    "absolute and array asm begin case const constructor destructor div do " +
    "downto else end file for function goto if implementation in inherited " +
    "inline interface label mod nil not object of operator or packed procedure " +
    "program record reintroduce repeat self set shl shr string then to type " +
    "unit until uses var while with xor as class dispinterface except exports " +
    "finalization finally initialization inline is library on out packed " +
    "property raise resourcestring threadvar try absolute abstract alias " +
    "assembler bitpacked break cdecl continue cppdecl cvar default deprecated " +
    "dynamic enumerator experimental export external far far16 forward generic " +
    "helper implements index interrupt iocheck local message name near " +
    "nodefault noreturn nostackframe oldfpccall otherwise overload override " +
    "pascal platform private protected public published read register " +
    "reintroduce result safecall saveregisters softfloat specialize static " +
    "stdcall stored strict unaligned unimplemented varargs virtual write");
  var atoms = {"null": true};

  var isOperatorChar = /[+\-*&%=<>!?|\/]/;

  function tokenBase(stream, state) {
    var ch = stream.next();
    if (ch == "#" && state.startOfLine) {
      stream.skipToEnd();
      return "meta";
    }
    if (ch == '"' || ch == "'") {
      state.tokenize = tokenString(ch);
      return state.tokenize(stream, state);
    }
    if (ch == "(" && stream.eat("*")) {
      state.tokenize = tokenComment;
      return tokenComment(stream, state);
    }
    if (/[\[\]{}\(\),;\:\.]/.test(ch)) {
      return null;
    }
    if (/\d/.test(ch)) {
      stream.eatWhile(/[\w\.]/);
      return "number";
    }
    if (ch == "/") {
      if (stream.eat("/")) {
        stream.skipToEnd();
        return "comment";
      }
    }
    if (isOperatorChar.test(ch)) {
      stream.eatWhile(isOperatorChar);
      return "operator";
    }
    stream.eatWhile(/[\w\$_]/);
    var cur = stream.current();
    if (keywords.propertyIsEnumerable(cur)) return "keyword";
    if (atoms.propertyIsEnumerable(cur)) return "atom";
    return "variable";
  }

  function tokenString(quote) {
    return function(stream, state) {
      var escaped = false, next, end = false;
      while ((next = stream.next()) != null) {
        if (next == quote && !escaped) {end = true; break;}
        escaped = !escaped && next == "\\";
      }
      if (end || !escaped) state.tokenize = null;
      return "string";
    };
  }

  function tokenComment(stream, state) {
    var maybeEnd = false, ch;
    while (ch = stream.next()) {
      if (ch == ")" && maybeEnd) {
        state.tokenize = null;
        break;
      }
      maybeEnd = (ch == "*");
    }
    return "comment";
  }

  // Interface

  return {
    startState: function() {
      return {tokenize: null};
    },

    token: function(stream, state) {
      if (stream.eatSpace()) return null;
      var style = (state.tokenize || tokenBase)(stream, state);
      if (style == "comment" || style == "meta") return style;
      return style;
    },

    electricChars: "{}"
  };
});

CodeMirror.defineMIME("text/x-pascal", "pascal");

});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/pegjs/pegjs.js":
/*!************************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/pegjs/pegjs.js ***!
  \************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"), __webpack_require__(/*! ../javascript/javascript */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/javascript/javascript.js"));
  else {}
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode("pegjs", function (config) {
  var jsMode = CodeMirror.getMode(config, "javascript");

  function identifier(stream) {
    return stream.match(/^[a-zA-Z_][a-zA-Z0-9_]*/);
  }

  return {
    startState: function () {
      return {
        inString: false,
        stringType: null,
        inComment: false,
        inCharacterClass: false,
        braced: 0,
        lhs: true,
        localState: null
      };
    },
    token: function (stream, state) {
      if (stream)

      //check for state changes
      if (!state.inString && !state.inComment && ((stream.peek() == '"') || (stream.peek() == "'"))) {
        state.stringType = stream.peek();
        stream.next(); // Skip quote
        state.inString = true; // Update state
      }
      if (!state.inString && !state.inComment && stream.match(/^\/\*/)) {
        state.inComment = true;
      }

      //return state
      if (state.inString) {
        while (state.inString && !stream.eol()) {
          if (stream.peek() === state.stringType) {
            stream.next(); // Skip quote
            state.inString = false; // Clear flag
          } else if (stream.peek() === '\\') {
            stream.next();
            stream.next();
          } else {
            stream.match(/^.[^\\\"\']*/);
          }
        }
        return state.lhs ? "property string" : "string"; // Token style
      } else if (state.inComment) {
        while (state.inComment && !stream.eol()) {
          if (stream.match(/\*\//)) {
            state.inComment = false; // Clear flag
          } else {
            stream.match(/^.[^\*]*/);
          }
        }
        return "comment";
      } else if (state.inCharacterClass) {
          while (state.inCharacterClass && !stream.eol()) {
            if (!(stream.match(/^[^\]\\]+/) || stream.match(/^\\./))) {
              state.inCharacterClass = false;
            }
          }
      } else if (stream.peek() === '[') {
        stream.next();
        state.inCharacterClass = true;
        return 'bracket';
      } else if (stream.match(/^\/\//)) {
        stream.skipToEnd();
        return "comment";
      } else if (state.braced || stream.peek() === '{') {
        if (state.localState === null) {
          state.localState = CodeMirror.startState(jsMode);
        }
        var token = jsMode.token(stream, state.localState);
        var text = stream.current();
        if (!token) {
          for (var i = 0; i < text.length; i++) {
            if (text[i] === '{') {
              state.braced++;
            } else if (text[i] === '}') {
              state.braced--;
            }
          };
        }
        return token;
      } else if (identifier(stream)) {
        if (stream.peek() === ':') {
          return 'variable';
        }
        return 'variable-2';
      } else if (['[', ']', '(', ')'].indexOf(stream.peek()) != -1) {
        stream.next();
        return 'bracket';
      } else if (!stream.eatSpace()) {
        stream.next();
      }
      return null;
    }
  };
}, "javascript");

});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/perl/perl.js":
/*!**********************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/perl/perl.js ***!
  \**********************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

// CodeMirror2 mode/perl/perl.js (text/x-perl) beta 0.10 (2011-11-08)
// This is a part of CodeMirror from https://github.com/sabaca/CodeMirror_mode_perl (mail@sabaca.com)

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"));
  else {}
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode("perl",function(){
        // http://perldoc.perl.org
        var PERL={                                      //   null - magic touch
                                                        //   1 - keyword
                                                        //   2 - def
                                                        //   3 - atom
                                                        //   4 - operator
                                                        //   5 - variable-2 (predefined)
                                                        //   [x,y] - x=1,2,3; y=must be defined if x{...}
                                                //      PERL operators
                '->'                            :   4,
                '++'                            :   4,
                '--'                            :   4,
                '**'                            :   4,
                                                        //   ! ~ \ and unary + and -
                '=~'                            :   4,
                '!~'                            :   4,
                '*'                             :   4,
                '/'                             :   4,
                '%'                             :   4,
                'x'                             :   4,
                '+'                             :   4,
                '-'                             :   4,
                '.'                             :   4,
                '<<'                            :   4,
                '>>'                            :   4,
                                                        //   named unary operators
                '<'                             :   4,
                '>'                             :   4,
                '<='                            :   4,
                '>='                            :   4,
                'lt'                            :   4,
                'gt'                            :   4,
                'le'                            :   4,
                'ge'                            :   4,
                '=='                            :   4,
                '!='                            :   4,
                '<=>'                           :   4,
                'eq'                            :   4,
                'ne'                            :   4,
                'cmp'                           :   4,
                '~~'                            :   4,
                '&'                             :   4,
                '|'                             :   4,
                '^'                             :   4,
                '&&'                            :   4,
                '||'                            :   4,
                '//'                            :   4,
                '..'                            :   4,
                '...'                           :   4,
                '?'                             :   4,
                ':'                             :   4,
                '='                             :   4,
                '+='                            :   4,
                '-='                            :   4,
                '*='                            :   4,  //   etc. ???
                ','                             :   4,
                '=>'                            :   4,
                '::'                            :   4,
                                                        //   list operators (rightward)
                'not'                           :   4,
                'and'                           :   4,
                'or'                            :   4,
                'xor'                           :   4,
                                                //      PERL predefined variables (I know, what this is a paranoid idea, but may be needed for people, who learn PERL, and for me as well, ...and may be for you?;)
                'BEGIN'                         :   [5,1],
                'END'                           :   [5,1],
                'PRINT'                         :   [5,1],
                'PRINTF'                        :   [5,1],
                'GETC'                          :   [5,1],
                'READ'                          :   [5,1],
                'READLINE'                      :   [5,1],
                'DESTROY'                       :   [5,1],
                'TIE'                           :   [5,1],
                'TIEHANDLE'                     :   [5,1],
                'UNTIE'                         :   [5,1],
                'STDIN'                         :    5,
                'STDIN_TOP'                     :    5,
                'STDOUT'                        :    5,
                'STDOUT_TOP'                    :    5,
                'STDERR'                        :    5,
                'STDERR_TOP'                    :    5,
                '$ARG'                          :    5,
                '$_'                            :    5,
                '@ARG'                          :    5,
                '@_'                            :    5,
                '$LIST_SEPARATOR'               :    5,
                '$"'                            :    5,
                '$PROCESS_ID'                   :    5,
                '$PID'                          :    5,
                '$$'                            :    5,
                '$REAL_GROUP_ID'                :    5,
                '$GID'                          :    5,
                '$('                            :    5,
                '$EFFECTIVE_GROUP_ID'           :    5,
                '$EGID'                         :    5,
                '$)'                            :    5,
                '$PROGRAM_NAME'                 :    5,
                '$0'                            :    5,
                '$SUBSCRIPT_SEPARATOR'          :    5,
                '$SUBSEP'                       :    5,
                '$;'                            :    5,
                '$REAL_USER_ID'                 :    5,
                '$UID'                          :    5,
                '$<'                            :    5,
                '$EFFECTIVE_USER_ID'            :    5,
                '$EUID'                         :    5,
                '$>'                            :    5,
                '$a'                            :    5,
                '$b'                            :    5,
                '$COMPILING'                    :    5,
                '$^C'                           :    5,
                '$DEBUGGING'                    :    5,
                '$^D'                           :    5,
                '${^ENCODING}'                  :    5,
                '$ENV'                          :    5,
                '%ENV'                          :    5,
                '$SYSTEM_FD_MAX'                :    5,
                '$^F'                           :    5,
                '@F'                            :    5,
                '${^GLOBAL_PHASE}'              :    5,
                '$^H'                           :    5,
                '%^H'                           :    5,
                '@INC'                          :    5,
                '%INC'                          :    5,
                '$INPLACE_EDIT'                 :    5,
                '$^I'                           :    5,
                '$^M'                           :    5,
                '$OSNAME'                       :    5,
                '$^O'                           :    5,
                '${^OPEN}'                      :    5,
                '$PERLDB'                       :    5,
                '$^P'                           :    5,
                '$SIG'                          :    5,
                '%SIG'                          :    5,
                '$BASETIME'                     :    5,
                '$^T'                           :    5,
                '${^TAINT}'                     :    5,
                '${^UNICODE}'                   :    5,
                '${^UTF8CACHE}'                 :    5,
                '${^UTF8LOCALE}'                :    5,
                '$PERL_VERSION'                 :    5,
                '$^V'                           :    5,
                '${^WIN32_SLOPPY_STAT}'         :    5,
                '$EXECUTABLE_NAME'              :    5,
                '$^X'                           :    5,
                '$1'                            :    5, // - regexp $1, $2...
                '$MATCH'                        :    5,
                '$&'                            :    5,
                '${^MATCH}'                     :    5,
                '$PREMATCH'                     :    5,
                '$`'                            :    5,
                '${^PREMATCH}'                  :    5,
                '$POSTMATCH'                    :    5,
                "$'"                            :    5,
                '${^POSTMATCH}'                 :    5,
                '$LAST_PAREN_MATCH'             :    5,
                '$+'                            :    5,
                '$LAST_SUBMATCH_RESULT'         :    5,
                '$^N'                           :    5,
                '@LAST_MATCH_END'               :    5,
                '@+'                            :    5,
                '%LAST_PAREN_MATCH'             :    5,
                '%+'                            :    5,
                '@LAST_MATCH_START'             :    5,
                '@-'                            :    5,
                '%LAST_MATCH_START'             :    5,
                '%-'                            :    5,
                '$LAST_REGEXP_CODE_RESULT'      :    5,
                '$^R'                           :    5,
                '${^RE_DEBUG_FLAGS}'            :    5,
                '${^RE_TRIE_MAXBUF}'            :    5,
                '$ARGV'                         :    5,
                '@ARGV'                         :    5,
                'ARGV'                          :    5,
                'ARGVOUT'                       :    5,
                '$OUTPUT_FIELD_SEPARATOR'       :    5,
                '$OFS'                          :    5,
                '$,'                            :    5,
                '$INPUT_LINE_NUMBER'            :    5,
                '$NR'                           :    5,
                '$.'                            :    5,
                '$INPUT_RECORD_SEPARATOR'       :    5,
                '$RS'                           :    5,
                '$/'                            :    5,
                '$OUTPUT_RECORD_SEPARATOR'      :    5,
                '$ORS'                          :    5,
                '$\\'                           :    5,
                '$OUTPUT_AUTOFLUSH'             :    5,
                '$|'                            :    5,
                '$ACCUMULATOR'                  :    5,
                '$^A'                           :    5,
                '$FORMAT_FORMFEED'              :    5,
                '$^L'                           :    5,
                '$FORMAT_PAGE_NUMBER'           :    5,
                '$%'                            :    5,
                '$FORMAT_LINES_LEFT'            :    5,
                '$-'                            :    5,
                '$FORMAT_LINE_BREAK_CHARACTERS' :    5,
                '$:'                            :    5,
                '$FORMAT_LINES_PER_PAGE'        :    5,
                '$='                            :    5,
                '$FORMAT_TOP_NAME'              :    5,
                '$^'                            :    5,
                '$FORMAT_NAME'                  :    5,
                '$~'                            :    5,
                '${^CHILD_ERROR_NATIVE}'        :    5,
                '$EXTENDED_OS_ERROR'            :    5,
                '$^E'                           :    5,
                '$EXCEPTIONS_BEING_CAUGHT'      :    5,
                '$^S'                           :    5,
                '$WARNING'                      :    5,
                '$^W'                           :    5,
                '${^WARNING_BITS}'              :    5,
                '$OS_ERROR'                     :    5,
                '$ERRNO'                        :    5,
                '$!'                            :    5,
                '%OS_ERROR'                     :    5,
                '%ERRNO'                        :    5,
                '%!'                            :    5,
                '$CHILD_ERROR'                  :    5,
                '$?'                            :    5,
                '$EVAL_ERROR'                   :    5,
                '$@'                            :    5,
                '$OFMT'                         :    5,
                '$#'                            :    5,
                '$*'                            :    5,
                '$ARRAY_BASE'                   :    5,
                '$['                            :    5,
                '$OLD_PERL_VERSION'             :    5,
                '$]'                            :    5,
                                                //      PERL blocks
                'if'                            :[1,1],
                elsif                           :[1,1],
                'else'                          :[1,1],
                'while'                         :[1,1],
                unless                          :[1,1],
                'for'                           :[1,1],
                foreach                         :[1,1],
                                                //      PERL functions
                'abs'                           :1,     // - absolute value function
                accept                          :1,     // - accept an incoming socket connect
                alarm                           :1,     // - schedule a SIGALRM
                'atan2'                         :1,     // - arctangent of Y/X in the range -PI to PI
                bind                            :1,     // - binds an address to a socket
                binmode                         :1,     // - prepare binary files for I/O
                bless                           :1,     // - create an object
                bootstrap                       :1,     //
                'break'                         :1,     // - break out of a "given" block
                caller                          :1,     // - get context of the current subroutine call
                chdir                           :1,     // - change your current working directory
                chmod                           :1,     // - changes the permissions on a list of files
                chomp                           :1,     // - remove a trailing record separator from a string
                chop                            :1,     // - remove the last character from a string
                chown                           :1,     // - change the ownership on a list of files
                chr                             :1,     // - get character this number represents
                chroot                          :1,     // - make directory new root for path lookups
                close                           :1,     // - close file (or pipe or socket) handle
                closedir                        :1,     // - close directory handle
                connect                         :1,     // - connect to a remote socket
                'continue'                      :[1,1], // - optional trailing block in a while or foreach
                'cos'                           :1,     // - cosine function
                crypt                           :1,     // - one-way passwd-style encryption
                dbmclose                        :1,     // - breaks binding on a tied dbm file
                dbmopen                         :1,     // - create binding on a tied dbm file
                'default'                       :1,     //
                defined                         :1,     // - test whether a value, variable, or function is defined
                'delete'                        :1,     // - deletes a value from a hash
                die                             :1,     // - raise an exception or bail out
                'do'                            :1,     // - turn a BLOCK into a TERM
                dump                            :1,     // - create an immediate core dump
                each                            :1,     // - retrieve the next key/value pair from a hash
                endgrent                        :1,     // - be done using group file
                endhostent                      :1,     // - be done using hosts file
                endnetent                       :1,     // - be done using networks file
                endprotoent                     :1,     // - be done using protocols file
                endpwent                        :1,     // - be done using passwd file
                endservent                      :1,     // - be done using services file
                eof                             :1,     // - test a filehandle for its end
                'eval'                          :1,     // - catch exceptions or compile and run code
                'exec'                          :1,     // - abandon this program to run another
                exists                          :1,     // - test whether a hash key is present
                exit                            :1,     // - terminate this program
                'exp'                           :1,     // - raise I to a power
                fcntl                           :1,     // - file control system call
                fileno                          :1,     // - return file descriptor from filehandle
                flock                           :1,     // - lock an entire file with an advisory lock
                fork                            :1,     // - create a new process just like this one
                format                          :1,     // - declare a picture format with use by the write() function
                formline                        :1,     // - internal function used for formats
                getc                            :1,     // - get the next character from the filehandle
                getgrent                        :1,     // - get next group record
                getgrgid                        :1,     // - get group record given group user ID
                getgrnam                        :1,     // - get group record given group name
                gethostbyaddr                   :1,     // - get host record given its address
                gethostbyname                   :1,     // - get host record given name
                gethostent                      :1,     // - get next hosts record
                getlogin                        :1,     // - return who logged in at this tty
                getnetbyaddr                    :1,     // - get network record given its address
                getnetbyname                    :1,     // - get networks record given name
                getnetent                       :1,     // - get next networks record
                getpeername                     :1,     // - find the other end of a socket connection
                getpgrp                         :1,     // - get process group
                getppid                         :1,     // - get parent process ID
                getpriority                     :1,     // - get current nice value
                getprotobyname                  :1,     // - get protocol record given name
                getprotobynumber                :1,     // - get protocol record numeric protocol
                getprotoent                     :1,     // - get next protocols record
                getpwent                        :1,     // - get next passwd record
                getpwnam                        :1,     // - get passwd record given user login name
                getpwuid                        :1,     // - get passwd record given user ID
                getservbyname                   :1,     // - get services record given its name
                getservbyport                   :1,     // - get services record given numeric port
                getservent                      :1,     // - get next services record
                getsockname                     :1,     // - retrieve the sockaddr for a given socket
                getsockopt                      :1,     // - get socket options on a given socket
                given                           :1,     //
                glob                            :1,     // - expand filenames using wildcards
                gmtime                          :1,     // - convert UNIX time into record or string using Greenwich time
                'goto'                          :1,     // - create spaghetti code
                grep                            :1,     // - locate elements in a list test true against a given criterion
                hex                             :1,     // - convert a string to a hexadecimal number
                'import'                        :1,     // - patch a module's namespace into your own
                index                           :1,     // - find a substring within a string
                'int'                           :1,     // - get the integer portion of a number
                ioctl                           :1,     // - system-dependent device control system call
                'join'                          :1,     // - join a list into a string using a separator
                keys                            :1,     // - retrieve list of indices from a hash
                kill                            :1,     // - send a signal to a process or process group
                last                            :1,     // - exit a block prematurely
                lc                              :1,     // - return lower-case version of a string
                lcfirst                         :1,     // - return a string with just the next letter in lower case
                length                          :1,     // - return the number of bytes in a string
                'link'                          :1,     // - create a hard link in the filesytem
                listen                          :1,     // - register your socket as a server
                local                           : 2,    // - create a temporary value for a global variable (dynamic scoping)
                localtime                       :1,     // - convert UNIX time into record or string using local time
                lock                            :1,     // - get a thread lock on a variable, subroutine, or method
                'log'                           :1,     // - retrieve the natural logarithm for a number
                lstat                           :1,     // - stat a symbolic link
                m                               :null,  // - match a string with a regular expression pattern
                map                             :1,     // - apply a change to a list to get back a new list with the changes
                mkdir                           :1,     // - create a directory
                msgctl                          :1,     // - SysV IPC message control operations
                msgget                          :1,     // - get SysV IPC message queue
                msgrcv                          :1,     // - receive a SysV IPC message from a message queue
                msgsnd                          :1,     // - send a SysV IPC message to a message queue
                my                              : 2,    // - declare and assign a local variable (lexical scoping)
                'new'                           :1,     //
                next                            :1,     // - iterate a block prematurely
                no                              :1,     // - unimport some module symbols or semantics at compile time
                oct                             :1,     // - convert a string to an octal number
                open                            :1,     // - open a file, pipe, or descriptor
                opendir                         :1,     // - open a directory
                ord                             :1,     // - find a character's numeric representation
                our                             : 2,    // - declare and assign a package variable (lexical scoping)
                pack                            :1,     // - convert a list into a binary representation
                'package'                       :1,     // - declare a separate global namespace
                pipe                            :1,     // - open a pair of connected filehandles
                pop                             :1,     // - remove the last element from an array and return it
                pos                             :1,     // - find or set the offset for the last/next m//g search
                print                           :1,     // - output a list to a filehandle
                printf                          :1,     // - output a formatted list to a filehandle
                prototype                       :1,     // - get the prototype (if any) of a subroutine
                push                            :1,     // - append one or more elements to an array
                q                               :null,  // - singly quote a string
                qq                              :null,  // - doubly quote a string
                qr                              :null,  // - Compile pattern
                quotemeta                       :null,  // - quote regular expression magic characters
                qw                              :null,  // - quote a list of words
                qx                              :null,  // - backquote quote a string
                rand                            :1,     // - retrieve the next pseudorandom number
                read                            :1,     // - fixed-length buffered input from a filehandle
                readdir                         :1,     // - get a directory from a directory handle
                readline                        :1,     // - fetch a record from a file
                readlink                        :1,     // - determine where a symbolic link is pointing
                readpipe                        :1,     // - execute a system command and collect standard output
                recv                            :1,     // - receive a message over a Socket
                redo                            :1,     // - start this loop iteration over again
                ref                             :1,     // - find out the type of thing being referenced
                rename                          :1,     // - change a filename
                require                         :1,     // - load in external functions from a library at runtime
                reset                           :1,     // - clear all variables of a given name
                'return'                        :1,     // - get out of a function early
                reverse                         :1,     // - flip a string or a list
                rewinddir                       :1,     // - reset directory handle
                rindex                          :1,     // - right-to-left substring search
                rmdir                           :1,     // - remove a directory
                s                               :null,  // - replace a pattern with a string
                say                             :1,     // - print with newline
                scalar                          :1,     // - force a scalar context
                seek                            :1,     // - reposition file pointer for random-access I/O
                seekdir                         :1,     // - reposition directory pointer
                select                          :1,     // - reset default output or do I/O multiplexing
                semctl                          :1,     // - SysV semaphore control operations
                semget                          :1,     // - get set of SysV semaphores
                semop                           :1,     // - SysV semaphore operations
                send                            :1,     // - send a message over a socket
                setgrent                        :1,     // - prepare group file for use
                sethostent                      :1,     // - prepare hosts file for use
                setnetent                       :1,     // - prepare networks file for use
                setpgrp                         :1,     // - set the process group of a process
                setpriority                     :1,     // - set a process's nice value
                setprotoent                     :1,     // - prepare protocols file for use
                setpwent                        :1,     // - prepare passwd file for use
                setservent                      :1,     // - prepare services file for use
                setsockopt                      :1,     // - set some socket options
                shift                           :1,     // - remove the first element of an array, and return it
                shmctl                          :1,     // - SysV shared memory operations
                shmget                          :1,     // - get SysV shared memory segment identifier
                shmread                         :1,     // - read SysV shared memory
                shmwrite                        :1,     // - write SysV shared memory
                shutdown                        :1,     // - close down just half of a socket connection
                'sin'                           :1,     // - return the sine of a number
                sleep                           :1,     // - block for some number of seconds
                socket                          :1,     // - create a socket
                socketpair                      :1,     // - create a pair of sockets
                'sort'                          :1,     // - sort a list of values
                splice                          :1,     // - add or remove elements anywhere in an array
                'split'                         :1,     // - split up a string using a regexp delimiter
                sprintf                         :1,     // - formatted print into a string
                'sqrt'                          :1,     // - square root function
                srand                           :1,     // - seed the random number generator
                stat                            :1,     // - get a file's status information
                state                           :1,     // - declare and assign a state variable (persistent lexical scoping)
                study                           :1,     // - optimize input data for repeated searches
                'sub'                           :1,     // - declare a subroutine, possibly anonymously
                'substr'                        :1,     // - get or alter a portion of a stirng
                symlink                         :1,     // - create a symbolic link to a file
                syscall                         :1,     // - execute an arbitrary system call
                sysopen                         :1,     // - open a file, pipe, or descriptor
                sysread                         :1,     // - fixed-length unbuffered input from a filehandle
                sysseek                         :1,     // - position I/O pointer on handle used with sysread and syswrite
                system                          :1,     // - run a separate program
                syswrite                        :1,     // - fixed-length unbuffered output to a filehandle
                tell                            :1,     // - get current seekpointer on a filehandle
                telldir                         :1,     // - get current seekpointer on a directory handle
                tie                             :1,     // - bind a variable to an object class
                tied                            :1,     // - get a reference to the object underlying a tied variable
                time                            :1,     // - return number of seconds since 1970
                times                           :1,     // - return elapsed time for self and child processes
                tr                              :null,  // - transliterate a string
                truncate                        :1,     // - shorten a file
                uc                              :1,     // - return upper-case version of a string
                ucfirst                         :1,     // - return a string with just the next letter in upper case
                umask                           :1,     // - set file creation mode mask
                undef                           :1,     // - remove a variable or function definition
                unlink                          :1,     // - remove one link to a file
                unpack                          :1,     // - convert binary structure into normal perl variables
                unshift                         :1,     // - prepend more elements to the beginning of a list
                untie                           :1,     // - break a tie binding to a variable
                use                             :1,     // - load in a module at compile time
                utime                           :1,     // - set a file's last access and modify times
                values                          :1,     // - return a list of the values in a hash
                vec                             :1,     // - test or set particular bits in a string
                wait                            :1,     // - wait for any child process to die
                waitpid                         :1,     // - wait for a particular child process to die
                wantarray                       :1,     // - get void vs scalar vs list context of current subroutine call
                warn                            :1,     // - print debugging info
                when                            :1,     //
                write                           :1,     // - print a picture record
                y                               :null}; // - transliterate a string

        var RXstyle="string-2";
        var RXmodifiers=/[goseximacplud]/;              // NOTE: "m", "s", "y" and "tr" need to correct real modifiers for each regexp type

        function tokenChain(stream,state,chain,style,tail){     // NOTE: chain.length > 2 is not working now (it's for s[...][...]geos;)
                state.chain=null;                               //                                                          12   3tail
                state.style=null;
                state.tail=null;
                state.tokenize=function(stream,state){
                        var e=false,c,i=0;
                        while(c=stream.next()){
                                if(c===chain[i]&&!e){
                                        if(chain[++i]!==undefined){
                                                state.chain=chain[i];
                                                state.style=style;
                                                state.tail=tail;}
                                        else if(tail)
                                                stream.eatWhile(tail);
                                        state.tokenize=tokenPerl;
                                        return style;}
                                e=!e&&c=="\\";}
                        return style;};
                return state.tokenize(stream,state);}

        function tokenSOMETHING(stream,state,string){
                state.tokenize=function(stream,state){
                        if(stream.string==string)
                                state.tokenize=tokenPerl;
                        stream.skipToEnd();
                        return "string";};
                return state.tokenize(stream,state);}

        function tokenPerl(stream,state){
                if(stream.eatSpace())
                        return null;
                if(state.chain)
                        return tokenChain(stream,state,state.chain,state.style,state.tail);
                if(stream.match(/^\-?[\d\.]/,false))
                        if(stream.match(/^(\-?(\d*\.\d+(e[+-]?\d+)?|\d+\.\d*)|0x[\da-fA-F]+|0b[01]+|\d+(e[+-]?\d+)?)/))
                                return 'number';
                if(stream.match(/^<<(?=\w)/)){                  // NOTE: <<SOMETHING\n...\nSOMETHING\n
                        stream.eatWhile(/\w/);
                        return tokenSOMETHING(stream,state,stream.current().substr(2));}
                if(stream.sol()&&stream.match(/^\=item(?!\w)/)){// NOTE: \n=item...\n=cut\n
                        return tokenSOMETHING(stream,state,'=cut');}
                var ch=stream.next();
                if(ch=='"'||ch=="'"){                           // NOTE: ' or " or <<'SOMETHING'\n...\nSOMETHING\n or <<"SOMETHING"\n...\nSOMETHING\n
                        if(prefix(stream, 3)=="<<"+ch){
                                var p=stream.pos;
                                stream.eatWhile(/\w/);
                                var n=stream.current().substr(1);
                                if(n&&stream.eat(ch))
                                        return tokenSOMETHING(stream,state,n);
                                stream.pos=p;}
                        return tokenChain(stream,state,[ch],"string");}
                if(ch=="q"){
                        var c=look(stream, -2);
                        if(!(c&&/\w/.test(c))){
                                c=look(stream, 0);
                                if(c=="x"){
                                        c=look(stream, 1);
                                        if(c=="("){
                                                eatSuffix(stream, 2);
                                                return tokenChain(stream,state,[")"],RXstyle,RXmodifiers);}
                                        if(c=="["){
                                                eatSuffix(stream, 2);
                                                return tokenChain(stream,state,["]"],RXstyle,RXmodifiers);}
                                        if(c=="{"){
                                                eatSuffix(stream, 2);
                                                return tokenChain(stream,state,["}"],RXstyle,RXmodifiers);}
                                        if(c=="<"){
                                                eatSuffix(stream, 2);
                                                return tokenChain(stream,state,[">"],RXstyle,RXmodifiers);}
                                        if(/[\^'"!~\/]/.test(c)){
                                                eatSuffix(stream, 1);
                                                return tokenChain(stream,state,[stream.eat(c)],RXstyle,RXmodifiers);}}
                                else if(c=="q"){
                                        c=look(stream, 1);
                                        if(c=="("){
                                                eatSuffix(stream, 2);
                                                return tokenChain(stream,state,[")"],"string");}
                                        if(c=="["){
                                                eatSuffix(stream, 2);
                                                return tokenChain(stream,state,["]"],"string");}
                                        if(c=="{"){
                                                eatSuffix(stream, 2);
                                                return tokenChain(stream,state,["}"],"string");}
                                        if(c=="<"){
                                                eatSuffix(stream, 2);
                                                return tokenChain(stream,state,[">"],"string");}
                                        if(/[\^'"!~\/]/.test(c)){
                                                eatSuffix(stream, 1);
                                                return tokenChain(stream,state,[stream.eat(c)],"string");}}
                                else if(c=="w"){
                                        c=look(stream, 1);
                                        if(c=="("){
                                                eatSuffix(stream, 2);
                                                return tokenChain(stream,state,[")"],"bracket");}
                                        if(c=="["){
                                                eatSuffix(stream, 2);
                                                return tokenChain(stream,state,["]"],"bracket");}
                                        if(c=="{"){
                                                eatSuffix(stream, 2);
                                                return tokenChain(stream,state,["}"],"bracket");}
                                        if(c=="<"){
                                                eatSuffix(stream, 2);
                                                return tokenChain(stream,state,[">"],"bracket");}
                                        if(/[\^'"!~\/]/.test(c)){
                                                eatSuffix(stream, 1);
                                                return tokenChain(stream,state,[stream.eat(c)],"bracket");}}
                                else if(c=="r"){
                                        c=look(stream, 1);
                                        if(c=="("){
                                                eatSuffix(stream, 2);
                                                return tokenChain(stream,state,[")"],RXstyle,RXmodifiers);}
                                        if(c=="["){
                                                eatSuffix(stream, 2);
                                                return tokenChain(stream,state,["]"],RXstyle,RXmodifiers);}
                                        if(c=="{"){
                                                eatSuffix(stream, 2);
                                                return tokenChain(stream,state,["}"],RXstyle,RXmodifiers);}
                                        if(c=="<"){
                                                eatSuffix(stream, 2);
                                                return tokenChain(stream,state,[">"],RXstyle,RXmodifiers);}
                                        if(/[\^'"!~\/]/.test(c)){
                                                eatSuffix(stream, 1);
                                                return tokenChain(stream,state,[stream.eat(c)],RXstyle,RXmodifiers);}}
                                else if(/[\^'"!~\/(\[{<]/.test(c)){
                                        if(c=="("){
                                                eatSuffix(stream, 1);
                                                return tokenChain(stream,state,[")"],"string");}
                                        if(c=="["){
                                                eatSuffix(stream, 1);
                                                return tokenChain(stream,state,["]"],"string");}
                                        if(c=="{"){
                                                eatSuffix(stream, 1);
                                                return tokenChain(stream,state,["}"],"string");}
                                        if(c=="<"){
                                                eatSuffix(stream, 1);
                                                return tokenChain(stream,state,[">"],"string");}
                                        if(/[\^'"!~\/]/.test(c)){
                                                return tokenChain(stream,state,[stream.eat(c)],"string");}}}}
                if(ch=="m"){
                        var c=look(stream, -2);
                        if(!(c&&/\w/.test(c))){
                                c=stream.eat(/[(\[{<\^'"!~\/]/);
                                if(c){
                                        if(/[\^'"!~\/]/.test(c)){
                                                return tokenChain(stream,state,[c],RXstyle,RXmodifiers);}
                                        if(c=="("){
                                                return tokenChain(stream,state,[")"],RXstyle,RXmodifiers);}
                                        if(c=="["){
                                                return tokenChain(stream,state,["]"],RXstyle,RXmodifiers);}
                                        if(c=="{"){
                                                return tokenChain(stream,state,["}"],RXstyle,RXmodifiers);}
                                        if(c=="<"){
                                                return tokenChain(stream,state,[">"],RXstyle,RXmodifiers);}}}}
                if(ch=="s"){
                        var c=/[\/>\]})\w]/.test(look(stream, -2));
                        if(!c){
                                c=stream.eat(/[(\[{<\^'"!~\/]/);
                                if(c){
                                        if(c=="[")
                                                return tokenChain(stream,state,["]","]"],RXstyle,RXmodifiers);
                                        if(c=="{")
                                                return tokenChain(stream,state,["}","}"],RXstyle,RXmodifiers);
                                        if(c=="<")
                                                return tokenChain(stream,state,[">",">"],RXstyle,RXmodifiers);
                                        if(c=="(")
                                                return tokenChain(stream,state,[")",")"],RXstyle,RXmodifiers);
                                        return tokenChain(stream,state,[c,c],RXstyle,RXmodifiers);}}}
                if(ch=="y"){
                        var c=/[\/>\]})\w]/.test(look(stream, -2));
                        if(!c){
                                c=stream.eat(/[(\[{<\^'"!~\/]/);
                                if(c){
                                        if(c=="[")
                                                return tokenChain(stream,state,["]","]"],RXstyle,RXmodifiers);
                                        if(c=="{")
                                                return tokenChain(stream,state,["}","}"],RXstyle,RXmodifiers);
                                        if(c=="<")
                                                return tokenChain(stream,state,[">",">"],RXstyle,RXmodifiers);
                                        if(c=="(")
                                                return tokenChain(stream,state,[")",")"],RXstyle,RXmodifiers);
                                        return tokenChain(stream,state,[c,c],RXstyle,RXmodifiers);}}}
                if(ch=="t"){
                        var c=/[\/>\]})\w]/.test(look(stream, -2));
                        if(!c){
                                c=stream.eat("r");if(c){
                                c=stream.eat(/[(\[{<\^'"!~\/]/);
                                if(c){
                                        if(c=="[")
                                                return tokenChain(stream,state,["]","]"],RXstyle,RXmodifiers);
                                        if(c=="{")
                                                return tokenChain(stream,state,["}","}"],RXstyle,RXmodifiers);
                                        if(c=="<")
                                                return tokenChain(stream,state,[">",">"],RXstyle,RXmodifiers);
                                        if(c=="(")
                                                return tokenChain(stream,state,[")",")"],RXstyle,RXmodifiers);
                                        return tokenChain(stream,state,[c,c],RXstyle,RXmodifiers);}}}}
                if(ch=="`"){
                        return tokenChain(stream,state,[ch],"variable-2");}
                if(ch=="/"){
                        if(!/~\s*$/.test(prefix(stream)))
                                return "operator";
                        else
                                return tokenChain(stream,state,[ch],RXstyle,RXmodifiers);}
                if(ch=="$"){
                        var p=stream.pos;
                        if(stream.eatWhile(/\d/)||stream.eat("{")&&stream.eatWhile(/\d/)&&stream.eat("}"))
                                return "variable-2";
                        else
                                stream.pos=p;}
                if(/[$@%]/.test(ch)){
                        var p=stream.pos;
                        if(stream.eat("^")&&stream.eat(/[A-Z]/)||!/[@$%&]/.test(look(stream, -2))&&stream.eat(/[=|\\\-#?@;:&`~\^!\[\]*'"$+.,\/<>()]/)){
                                var c=stream.current();
                                if(PERL[c])
                                        return "variable-2";}
                        stream.pos=p;}
                if(/[$@%&]/.test(ch)){
                        if(stream.eatWhile(/[\w$\[\]]/)||stream.eat("{")&&stream.eatWhile(/[\w$\[\]]/)&&stream.eat("}")){
                                var c=stream.current();
                                if(PERL[c])
                                        return "variable-2";
                                else
                                        return "variable";}}
                if(ch=="#"){
                        if(look(stream, -2)!="$"){
                                stream.skipToEnd();
                                return "comment";}}
                if(/[:+\-\^*$&%@=<>!?|\/~\.]/.test(ch)){
                        var p=stream.pos;
                        stream.eatWhile(/[:+\-\^*$&%@=<>!?|\/~\.]/);
                        if(PERL[stream.current()])
                                return "operator";
                        else
                                stream.pos=p;}
                if(ch=="_"){
                        if(stream.pos==1){
                                if(suffix(stream, 6)=="_END__"){
                                        return tokenChain(stream,state,['\0'],"comment");}
                                else if(suffix(stream, 7)=="_DATA__"){
                                        return tokenChain(stream,state,['\0'],"variable-2");}
                                else if(suffix(stream, 7)=="_C__"){
                                        return tokenChain(stream,state,['\0'],"string");}}}
                if(/\w/.test(ch)){
                        var p=stream.pos;
                        if(look(stream, -2)=="{"&&(look(stream, 0)=="}"||stream.eatWhile(/\w/)&&look(stream, 0)=="}"))
                                return "string";
                        else
                                stream.pos=p;}
                if(/[A-Z]/.test(ch)){
                        var l=look(stream, -2);
                        var p=stream.pos;
                        stream.eatWhile(/[A-Z_]/);
                        if(/[\da-z]/.test(look(stream, 0))){
                                stream.pos=p;}
                        else{
                                var c=PERL[stream.current()];
                                if(!c)
                                        return "meta";
                                if(c[1])
                                        c=c[0];
                                if(l!=":"){
                                        if(c==1)
                                                return "keyword";
                                        else if(c==2)
                                                return "def";
                                        else if(c==3)
                                                return "atom";
                                        else if(c==4)
                                                return "operator";
                                        else if(c==5)
                                                return "variable-2";
                                        else
                                                return "meta";}
                                else
                                        return "meta";}}
                if(/[a-zA-Z_]/.test(ch)){
                        var l=look(stream, -2);
                        stream.eatWhile(/\w/);
                        var c=PERL[stream.current()];
                        if(!c)
                                return "meta";
                        if(c[1])
                                c=c[0];
                        if(l!=":"){
                                if(c==1)
                                        return "keyword";
                                else if(c==2)
                                        return "def";
                                else if(c==3)
                                        return "atom";
                                else if(c==4)
                                        return "operator";
                                else if(c==5)
                                        return "variable-2";
                                else
                                        return "meta";}
                        else
                                return "meta";}
                return null;}

        return {
            startState: function() {
                return {
                    tokenize: tokenPerl,
                    chain: null,
                    style: null,
                    tail: null
                };
            },
            token: function(stream, state) {
                return (state.tokenize || tokenPerl)(stream, state);
            },
            lineComment: '#'
        };
});

CodeMirror.registerHelper("wordChars", "perl", /[\w$]/);

CodeMirror.defineMIME("text/x-perl", "perl");

// it's like "peek", but need for look-ahead or look-behind if index < 0
function look(stream, c){
  return stream.string.charAt(stream.pos+(c||0));
}

// return a part of prefix of current stream from current position
function prefix(stream, c){
  if(c){
    var x=stream.pos-c;
    return stream.string.substr((x>=0?x:0),c);}
  else{
    return stream.string.substr(0,stream.pos-1);
  }
}

// return a part of suffix of current stream from current position
function suffix(stream, c){
  var y=stream.string.length;
  var x=y-stream.pos+1;
  return stream.string.substr(stream.pos,(c&&c<y?c:x));
}

// eating and vomiting a part of stream from current position
function eatSuffix(stream, c){
  var x=stream.pos+c;
  var y;
  if(x<=0)
    stream.pos=0;
  else if(x>=(y=stream.string.length-1))
    stream.pos=y;
  else
    stream.pos=x;
}

});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/php/php.js":
/*!********************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/php/php.js ***!
  \********************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"), __webpack_require__(/*! ../htmlmixed/htmlmixed */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/htmlmixed/htmlmixed.js"), __webpack_require__(/*! ../clike/clike */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/clike/clike.js"));
  else {}
})(function(CodeMirror) {
  "use strict";

  function keywords(str) {
    var obj = {}, words = str.split(" ");
    for (var i = 0; i < words.length; ++i) obj[words[i]] = true;
    return obj;
  }

  // Helper for phpString
  function matchSequence(list, end, escapes) {
    if (list.length == 0) return phpString(end);
    return function (stream, state) {
      var patterns = list[0];
      for (var i = 0; i < patterns.length; i++) if (stream.match(patterns[i][0])) {
        state.tokenize = matchSequence(list.slice(1), end);
        return patterns[i][1];
      }
      state.tokenize = phpString(end, escapes);
      return "string";
    };
  }
  function phpString(closing, escapes) {
    return function(stream, state) { return phpString_(stream, state, closing, escapes); };
  }
  function phpString_(stream, state, closing, escapes) {
    // "Complex" syntax
    if (escapes !== false && stream.match("${", false) || stream.match("{$", false)) {
      state.tokenize = null;
      return "string";
    }

    // Simple syntax
    if (escapes !== false && stream.match(/^\$[a-zA-Z_][a-zA-Z0-9_]*/)) {
      // After the variable name there may appear array or object operator.
      if (stream.match("[", false)) {
        // Match array operator
        state.tokenize = matchSequence([
          [["[", null]],
          [[/\d[\w\.]*/, "number"],
           [/\$[a-zA-Z_][a-zA-Z0-9_]*/, "variable-2"],
           [/[\w\$]+/, "variable"]],
          [["]", null]]
        ], closing, escapes);
      }
      if (stream.match(/\-\>\w/, false)) {
        // Match object operator
        state.tokenize = matchSequence([
          [["->", null]],
          [[/[\w]+/, "variable"]]
        ], closing, escapes);
      }
      return "variable-2";
    }

    var escaped = false;
    // Normal string
    while (!stream.eol() &&
           (escaped || escapes === false ||
            (!stream.match("{$", false) &&
             !stream.match(/^(\$[a-zA-Z_][a-zA-Z0-9_]*|\$\{)/, false)))) {
      if (!escaped && stream.match(closing)) {
        state.tokenize = null;
        state.tokStack.pop(); state.tokStack.pop();
        break;
      }
      escaped = stream.next() == "\\" && !escaped;
    }
    return "string";
  }

  var phpKeywords = "abstract and array as break case catch class clone const continue declare default " +
    "do else elseif enddeclare endfor endforeach endif endswitch endwhile extends final " +
    "for foreach function global goto if implements interface instanceof namespace " +
    "new or private protected public static switch throw trait try use var while xor " +
    "die echo empty exit eval include include_once isset list require require_once return " +
    "print unset __halt_compiler self static parent yield insteadof finally";
  var phpAtoms = "true false null TRUE FALSE NULL __CLASS__ __DIR__ __FILE__ __LINE__ __METHOD__ __FUNCTION__ __NAMESPACE__ __TRAIT__";
  var phpBuiltin = "func_num_args func_get_arg func_get_args strlen strcmp strncmp strcasecmp strncasecmp each error_reporting define defined trigger_error user_error set_error_handler restore_error_handler get_declared_classes get_loaded_extensions extension_loaded get_extension_funcs debug_backtrace constant bin2hex hex2bin sleep usleep time mktime gmmktime strftime gmstrftime strtotime date gmdate getdate localtime checkdate flush wordwrap htmlspecialchars htmlentities html_entity_decode md5 md5_file crc32 getimagesize image_type_to_mime_type phpinfo phpversion phpcredits strnatcmp strnatcasecmp substr_count strspn strcspn strtok strtoupper strtolower strpos strrpos strrev hebrev hebrevc nl2br basename dirname pathinfo stripslashes stripcslashes strstr stristr strrchr str_shuffle str_word_count strcoll substr substr_replace quotemeta ucfirst ucwords strtr addslashes addcslashes rtrim str_replace str_repeat count_chars chunk_split trim ltrim strip_tags similar_text explode implode setlocale localeconv parse_str str_pad chop strchr sprintf printf vprintf vsprintf sscanf fscanf parse_url urlencode urldecode rawurlencode rawurldecode readlink linkinfo link unlink exec system escapeshellcmd escapeshellarg passthru shell_exec proc_open proc_close rand srand getrandmax mt_rand mt_srand mt_getrandmax base64_decode base64_encode abs ceil floor round is_finite is_nan is_infinite bindec hexdec octdec decbin decoct dechex base_convert number_format fmod ip2long long2ip getenv putenv getopt microtime gettimeofday getrusage uniqid quoted_printable_decode set_time_limit get_cfg_var magic_quotes_runtime set_magic_quotes_runtime get_magic_quotes_gpc get_magic_quotes_runtime import_request_variables error_log serialize unserialize memory_get_usage var_dump var_export debug_zval_dump print_r highlight_file show_source highlight_string ini_get ini_get_all ini_set ini_alter ini_restore get_include_path set_include_path restore_include_path setcookie header headers_sent connection_aborted connection_status ignore_user_abort parse_ini_file is_uploaded_file move_uploaded_file intval floatval doubleval strval gettype settype is_null is_resource is_bool is_long is_float is_int is_integer is_double is_real is_numeric is_string is_array is_object is_scalar ereg ereg_replace eregi eregi_replace split spliti join sql_regcase dl pclose popen readfile rewind rmdir umask fclose feof fgetc fgets fgetss fread fopen fpassthru ftruncate fstat fseek ftell fflush fwrite fputs mkdir rename copy tempnam tmpfile file file_get_contents file_put_contents stream_select stream_context_create stream_context_set_params stream_context_set_option stream_context_get_options stream_filter_prepend stream_filter_append fgetcsv flock get_meta_tags stream_set_write_buffer set_file_buffer set_socket_blocking stream_set_blocking socket_set_blocking stream_get_meta_data stream_register_wrapper stream_wrapper_register stream_set_timeout socket_set_timeout socket_get_status realpath fnmatch fsockopen pfsockopen pack unpack get_browser crypt opendir closedir chdir getcwd rewinddir readdir dir glob fileatime filectime filegroup fileinode filemtime fileowner fileperms filesize filetype file_exists is_writable is_writeable is_readable is_executable is_file is_dir is_link stat lstat chown touch clearstatcache mail ob_start ob_flush ob_clean ob_end_flush ob_end_clean ob_get_flush ob_get_clean ob_get_length ob_get_level ob_get_status ob_get_contents ob_implicit_flush ob_list_handlers ksort krsort natsort natcasesort asort arsort sort rsort usort uasort uksort shuffle array_walk count end prev next reset current key min max in_array array_search extract compact array_fill range array_multisort array_push array_pop array_shift array_unshift array_splice array_slice array_merge array_merge_recursive array_keys array_values array_count_values array_reverse array_reduce array_pad array_flip array_change_key_case array_rand array_unique array_intersect array_intersect_assoc array_diff array_diff_assoc array_sum array_filter array_map array_chunk array_key_exists array_intersect_key array_combine array_column pos sizeof key_exists assert assert_options version_compare ftok str_rot13 aggregate session_name session_module_name session_save_path session_id session_regenerate_id session_decode session_register session_unregister session_is_registered session_encode session_start session_destroy session_unset session_set_save_handler session_cache_limiter session_cache_expire session_set_cookie_params session_get_cookie_params session_write_close preg_match preg_match_all preg_replace preg_replace_callback preg_split preg_quote preg_grep overload ctype_alnum ctype_alpha ctype_cntrl ctype_digit ctype_lower ctype_graph ctype_print ctype_punct ctype_space ctype_upper ctype_xdigit virtual apache_request_headers apache_note apache_lookup_uri apache_child_terminate apache_setenv apache_response_headers apache_get_version getallheaders mysql_connect mysql_pconnect mysql_close mysql_select_db mysql_create_db mysql_drop_db mysql_query mysql_unbuffered_query mysql_db_query mysql_list_dbs mysql_list_tables mysql_list_fields mysql_list_processes mysql_error mysql_errno mysql_affected_rows mysql_insert_id mysql_result mysql_num_rows mysql_num_fields mysql_fetch_row mysql_fetch_array mysql_fetch_assoc mysql_fetch_object mysql_data_seek mysql_fetch_lengths mysql_fetch_field mysql_field_seek mysql_free_result mysql_field_name mysql_field_table mysql_field_len mysql_field_type mysql_field_flags mysql_escape_string mysql_real_escape_string mysql_stat mysql_thread_id mysql_client_encoding mysql_get_client_info mysql_get_host_info mysql_get_proto_info mysql_get_server_info mysql_info mysql mysql_fieldname mysql_fieldtable mysql_fieldlen mysql_fieldtype mysql_fieldflags mysql_selectdb mysql_createdb mysql_dropdb mysql_freeresult mysql_numfields mysql_numrows mysql_listdbs mysql_listtables mysql_listfields mysql_db_name mysql_dbname mysql_tablename mysql_table_name pg_connect pg_pconnect pg_close pg_connection_status pg_connection_busy pg_connection_reset pg_host pg_dbname pg_port pg_tty pg_options pg_ping pg_query pg_send_query pg_cancel_query pg_fetch_result pg_fetch_row pg_fetch_assoc pg_fetch_array pg_fetch_object pg_fetch_all pg_affected_rows pg_get_result pg_result_seek pg_result_status pg_free_result pg_last_oid pg_num_rows pg_num_fields pg_field_name pg_field_num pg_field_size pg_field_type pg_field_prtlen pg_field_is_null pg_get_notify pg_get_pid pg_result_error pg_last_error pg_last_notice pg_put_line pg_end_copy pg_copy_to pg_copy_from pg_trace pg_untrace pg_lo_create pg_lo_unlink pg_lo_open pg_lo_close pg_lo_read pg_lo_write pg_lo_read_all pg_lo_import pg_lo_export pg_lo_seek pg_lo_tell pg_escape_string pg_escape_bytea pg_unescape_bytea pg_client_encoding pg_set_client_encoding pg_meta_data pg_convert pg_insert pg_update pg_delete pg_select pg_exec pg_getlastoid pg_cmdtuples pg_errormessage pg_numrows pg_numfields pg_fieldname pg_fieldsize pg_fieldtype pg_fieldnum pg_fieldprtlen pg_fieldisnull pg_freeresult pg_result pg_loreadall pg_locreate pg_lounlink pg_loopen pg_loclose pg_loread pg_lowrite pg_loimport pg_loexport http_response_code get_declared_traits getimagesizefromstring socket_import_stream stream_set_chunk_size trait_exists header_register_callback class_uses session_status session_register_shutdown echo print global static exit array empty eval isset unset die include require include_once require_once json_decode json_encode json_last_error json_last_error_msg curl_close curl_copy_handle curl_errno curl_error curl_escape curl_exec curl_file_create curl_getinfo curl_init curl_multi_add_handle curl_multi_close curl_multi_exec curl_multi_getcontent curl_multi_info_read curl_multi_init curl_multi_remove_handle curl_multi_select curl_multi_setopt curl_multi_strerror curl_pause curl_reset curl_setopt_array curl_setopt curl_share_close curl_share_init curl_share_setopt curl_strerror curl_unescape curl_version mysqli_affected_rows mysqli_autocommit mysqli_change_user mysqli_character_set_name mysqli_close mysqli_commit mysqli_connect_errno mysqli_connect_error mysqli_connect mysqli_data_seek mysqli_debug mysqli_dump_debug_info mysqli_errno mysqli_error_list mysqli_error mysqli_fetch_all mysqli_fetch_array mysqli_fetch_assoc mysqli_fetch_field_direct mysqli_fetch_field mysqli_fetch_fields mysqli_fetch_lengths mysqli_fetch_object mysqli_fetch_row mysqli_field_count mysqli_field_seek mysqli_field_tell mysqli_free_result mysqli_get_charset mysqli_get_client_info mysqli_get_client_stats mysqli_get_client_version mysqli_get_connection_stats mysqli_get_host_info mysqli_get_proto_info mysqli_get_server_info mysqli_get_server_version mysqli_info mysqli_init mysqli_insert_id mysqli_kill mysqli_more_results mysqli_multi_query mysqli_next_result mysqli_num_fields mysqli_num_rows mysqli_options mysqli_ping mysqli_prepare mysqli_query mysqli_real_connect mysqli_real_escape_string mysqli_real_query mysqli_reap_async_query mysqli_refresh mysqli_rollback mysqli_select_db mysqli_set_charset mysqli_set_local_infile_default mysqli_set_local_infile_handler mysqli_sqlstate mysqli_ssl_set mysqli_stat mysqli_stmt_init mysqli_store_result mysqli_thread_id mysqli_thread_safe mysqli_use_result mysqli_warning_count";
  CodeMirror.registerHelper("hintWords", "php", [phpKeywords, phpAtoms, phpBuiltin].join(" ").split(" "));
  CodeMirror.registerHelper("wordChars", "php", /[\w$]/);

  var phpConfig = {
    name: "clike",
    helperType: "php",
    keywords: keywords(phpKeywords),
    blockKeywords: keywords("catch do else elseif for foreach if switch try while finally"),
    defKeywords: keywords("class function interface namespace trait"),
    atoms: keywords(phpAtoms),
    builtin: keywords(phpBuiltin),
    multiLineStrings: true,
    hooks: {
      "$": function(stream) {
        stream.eatWhile(/[\w\$_]/);
        return "variable-2";
      },
      "<": function(stream, state) {
        var before;
        if (before = stream.match(/<<\s*/)) {
          var quoted = stream.eat(/['"]/);
          stream.eatWhile(/[\w\.]/);
          var delim = stream.current().slice(before[0].length + (quoted ? 2 : 1));
          if (quoted) stream.eat(quoted);
          if (delim) {
            (state.tokStack || (state.tokStack = [])).push(delim, 0);
            state.tokenize = phpString(delim, quoted != "'");
            return "string";
          }
        }
        return false;
      },
      "#": function(stream) {
        while (!stream.eol() && !stream.match("?>", false)) stream.next();
        return "comment";
      },
      "/": function(stream) {
        if (stream.eat("/")) {
          while (!stream.eol() && !stream.match("?>", false)) stream.next();
          return "comment";
        }
        return false;
      },
      '"': function(_stream, state) {
        (state.tokStack || (state.tokStack = [])).push('"', 0);
        state.tokenize = phpString('"');
        return "string";
      },
      "{": function(_stream, state) {
        if (state.tokStack && state.tokStack.length)
          state.tokStack[state.tokStack.length - 1]++;
        return false;
      },
      "}": function(_stream, state) {
        if (state.tokStack && state.tokStack.length > 0 &&
            !--state.tokStack[state.tokStack.length - 1]) {
          state.tokenize = phpString(state.tokStack[state.tokStack.length - 2]);
        }
        return false;
      }
    }
  };

  CodeMirror.defineMode("php", function(config, parserConfig) {
    var htmlMode = CodeMirror.getMode(config, (parserConfig && parserConfig.htmlMode) || "text/html");
    var phpMode = CodeMirror.getMode(config, phpConfig);

    function dispatch(stream, state) {
      var isPHP = state.curMode == phpMode;
      if (stream.sol() && state.pending && state.pending != '"' && state.pending != "'") state.pending = null;
      if (!isPHP) {
        if (stream.match(/^<\?\w*/)) {
          state.curMode = phpMode;
          if (!state.php) state.php = CodeMirror.startState(phpMode, htmlMode.indent(state.html, ""))
          state.curState = state.php;
          return "meta";
        }
        if (state.pending == '"' || state.pending == "'") {
          while (!stream.eol() && stream.next() != state.pending) {}
          var style = "string";
        } else if (state.pending && stream.pos < state.pending.end) {
          stream.pos = state.pending.end;
          var style = state.pending.style;
        } else {
          var style = htmlMode.token(stream, state.curState);
        }
        if (state.pending) state.pending = null;
        var cur = stream.current(), openPHP = cur.search(/<\?/), m;
        if (openPHP != -1) {
          if (style == "string" && (m = cur.match(/[\'\"]$/)) && !/\?>/.test(cur)) state.pending = m[0];
          else state.pending = {end: stream.pos, style: style};
          stream.backUp(cur.length - openPHP);
        }
        return style;
      } else if (isPHP && state.php.tokenize == null && stream.match("?>")) {
        state.curMode = htmlMode;
        state.curState = state.html;
        if (!state.php.context.prev) state.php = null;
        return "meta";
      } else {
        return phpMode.token(stream, state.curState);
      }
    }

    return {
      startState: function() {
        var html = CodeMirror.startState(htmlMode)
        var php = parserConfig.startOpen ? CodeMirror.startState(phpMode) : null
        return {html: html,
                php: php,
                curMode: parserConfig.startOpen ? phpMode : htmlMode,
                curState: parserConfig.startOpen ? php : html,
                pending: null};
      },

      copyState: function(state) {
        var html = state.html, htmlNew = CodeMirror.copyState(htmlMode, html),
            php = state.php, phpNew = php && CodeMirror.copyState(phpMode, php), cur;
        if (state.curMode == htmlMode) cur = htmlNew;
        else cur = phpNew;
        return {html: htmlNew, php: phpNew, curMode: state.curMode, curState: cur,
                pending: state.pending};
      },

      token: dispatch,

      indent: function(state, textAfter) {
        if ((state.curMode != phpMode && /^\s*<\//.test(textAfter)) ||
            (state.curMode == phpMode && /^\?>/.test(textAfter)))
          return htmlMode.indent(state.html, textAfter);
        return state.curMode.indent(state.curState, textAfter);
      },

      blockCommentStart: "/*",
      blockCommentEnd: "*/",
      lineComment: "//",

      innerMode: function(state) { return {state: state.curState, mode: state.curMode}; }
    };
  }, "htmlmixed", "clike");

  CodeMirror.defineMIME("application/x-httpd-php", "php");
  CodeMirror.defineMIME("application/x-httpd-php-open", {name: "php", startOpen: true});
  CodeMirror.defineMIME("text/x-php", phpConfig);
});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/pig/pig.js":
/*!********************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/pig/pig.js ***!
  \********************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

/*
 *      Pig Latin Mode for CodeMirror 2
 *      @author Prasanth Jayachandran
 *      @link   https://github.com/prasanthj/pig-codemirror-2
 *  This implementation is adapted from PL/SQL mode in CodeMirror 2.
 */
(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"));
  else {}
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode("pig", function(_config, parserConfig) {
  var keywords = parserConfig.keywords,
  builtins = parserConfig.builtins,
  types = parserConfig.types,
  multiLineStrings = parserConfig.multiLineStrings;

  var isOperatorChar = /[*+\-%<>=&?:\/!|]/;

  function chain(stream, state, f) {
    state.tokenize = f;
    return f(stream, state);
  }

  function tokenComment(stream, state) {
    var isEnd = false;
    var ch;
    while(ch = stream.next()) {
      if(ch == "/" && isEnd) {
        state.tokenize = tokenBase;
        break;
      }
      isEnd = (ch == "*");
    }
    return "comment";
  }

  function tokenString(quote) {
    return function(stream, state) {
      var escaped = false, next, end = false;
      while((next = stream.next()) != null) {
        if (next == quote && !escaped) {
          end = true; break;
        }
        escaped = !escaped && next == "\\";
      }
      if (end || !(escaped || multiLineStrings))
        state.tokenize = tokenBase;
      return "error";
    };
  }


  function tokenBase(stream, state) {
    var ch = stream.next();

    // is a start of string?
    if (ch == '"' || ch == "'")
      return chain(stream, state, tokenString(ch));
    // is it one of the special chars
    else if(/[\[\]{}\(\),;\.]/.test(ch))
      return null;
    // is it a number?
    else if(/\d/.test(ch)) {
      stream.eatWhile(/[\w\.]/);
      return "number";
    }
    // multi line comment or operator
    else if (ch == "/") {
      if (stream.eat("*")) {
        return chain(stream, state, tokenComment);
      }
      else {
        stream.eatWhile(isOperatorChar);
        return "operator";
      }
    }
    // single line comment or operator
    else if (ch=="-") {
      if(stream.eat("-")){
        stream.skipToEnd();
        return "comment";
      }
      else {
        stream.eatWhile(isOperatorChar);
        return "operator";
      }
    }
    // is it an operator
    else if (isOperatorChar.test(ch)) {
      stream.eatWhile(isOperatorChar);
      return "operator";
    }
    else {
      // get the while word
      stream.eatWhile(/[\w\$_]/);
      // is it one of the listed keywords?
      if (keywords && keywords.propertyIsEnumerable(stream.current().toUpperCase())) {
        //keywords can be used as variables like flatten(group), group.$0 etc..
        if (!stream.eat(")") && !stream.eat("."))
          return "keyword";
      }
      // is it one of the builtin functions?
      if (builtins && builtins.propertyIsEnumerable(stream.current().toUpperCase()))
        return "variable-2";
      // is it one of the listed types?
      if (types && types.propertyIsEnumerable(stream.current().toUpperCase()))
        return "variable-3";
      // default is a 'variable'
      return "variable";
    }
  }

  // Interface
  return {
    startState: function() {
      return {
        tokenize: tokenBase,
        startOfLine: true
      };
    },

    token: function(stream, state) {
      if(stream.eatSpace()) return null;
      var style = state.tokenize(stream, state);
      return style;
    }
  };
});

(function() {
  function keywords(str) {
    var obj = {}, words = str.split(" ");
    for (var i = 0; i < words.length; ++i) obj[words[i]] = true;
    return obj;
  }

  // builtin funcs taken from trunk revision 1303237
  var pBuiltins = "ABS ACOS ARITY ASIN ATAN AVG BAGSIZE BINSTORAGE BLOOM BUILDBLOOM CBRT CEIL "
    + "CONCAT COR COS COSH COUNT COUNT_STAR COV CONSTANTSIZE CUBEDIMENSIONS DIFF DISTINCT DOUBLEABS "
    + "DOUBLEAVG DOUBLEBASE DOUBLEMAX DOUBLEMIN DOUBLEROUND DOUBLESUM EXP FLOOR FLOATABS FLOATAVG "
    + "FLOATMAX FLOATMIN FLOATROUND FLOATSUM GENERICINVOKER INDEXOF INTABS INTAVG INTMAX INTMIN "
    + "INTSUM INVOKEFORDOUBLE INVOKEFORFLOAT INVOKEFORINT INVOKEFORLONG INVOKEFORSTRING INVOKER "
    + "ISEMPTY JSONLOADER JSONMETADATA JSONSTORAGE LAST_INDEX_OF LCFIRST LOG LOG10 LOWER LONGABS "
    + "LONGAVG LONGMAX LONGMIN LONGSUM MAX MIN MAPSIZE MONITOREDUDF NONDETERMINISTIC OUTPUTSCHEMA  "
    + "PIGSTORAGE PIGSTREAMING RANDOM REGEX_EXTRACT REGEX_EXTRACT_ALL REPLACE ROUND SIN SINH SIZE "
    + "SQRT STRSPLIT SUBSTRING SUM STRINGCONCAT STRINGMAX STRINGMIN STRINGSIZE TAN TANH TOBAG "
    + "TOKENIZE TOMAP TOP TOTUPLE TRIM TEXTLOADER TUPLESIZE UCFIRST UPPER UTF8STORAGECONVERTER ";

  // taken from QueryLexer.g
  var pKeywords = "VOID IMPORT RETURNS DEFINE LOAD FILTER FOREACH ORDER CUBE DISTINCT COGROUP "
    + "JOIN CROSS UNION SPLIT INTO IF OTHERWISE ALL AS BY USING INNER OUTER ONSCHEMA PARALLEL "
    + "PARTITION GROUP AND OR NOT GENERATE FLATTEN ASC DESC IS STREAM THROUGH STORE MAPREDUCE "
    + "SHIP CACHE INPUT OUTPUT STDERROR STDIN STDOUT LIMIT SAMPLE LEFT RIGHT FULL EQ GT LT GTE LTE "
    + "NEQ MATCHES TRUE FALSE DUMP";

  // data types
  var pTypes = "BOOLEAN INT LONG FLOAT DOUBLE CHARARRAY BYTEARRAY BAG TUPLE MAP ";

  CodeMirror.defineMIME("text/x-pig", {
    name: "pig",
    builtins: keywords(pBuiltins),
    keywords: keywords(pKeywords),
    types: keywords(pTypes)
  });

  CodeMirror.registerHelper("hintWords", "pig", (pBuiltins + pTypes + pKeywords).split(" "));
}());

});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/powershell/powershell.js":
/*!**********************************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/powershell/powershell.js ***!
  \**********************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function(mod) {
  'use strict';
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"));
  else {}
})(function(CodeMirror) {
'use strict';

CodeMirror.defineMode('powershell', function() {
  function buildRegexp(patterns, options) {
    options = options || {};
    var prefix = options.prefix !== undefined ? options.prefix : '^';
    var suffix = options.suffix !== undefined ? options.suffix : '\\b';

    for (var i = 0; i < patterns.length; i++) {
      if (patterns[i] instanceof RegExp) {
        patterns[i] = patterns[i].source;
      }
      else {
        patterns[i] = patterns[i].replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      }
    }

    return new RegExp(prefix + '(' + patterns.join('|') + ')' + suffix, 'i');
  }

  var notCharacterOrDash = '(?=[^A-Za-z\\d\\-_]|$)';
  var varNames = /[\w\-:]/
  var keywords = buildRegexp([
    /begin|break|catch|continue|data|default|do|dynamicparam/,
    /else|elseif|end|exit|filter|finally|for|foreach|from|function|if|in/,
    /param|process|return|switch|throw|trap|try|until|where|while/
  ], { suffix: notCharacterOrDash });

  var punctuation = /[\[\]{},;`\.]|@[({]/;
  var wordOperators = buildRegexp([
    'f',
    /b?not/,
    /[ic]?split/, 'join',
    /is(not)?/, 'as',
    /[ic]?(eq|ne|[gl][te])/,
    /[ic]?(not)?(like|match|contains)/,
    /[ic]?replace/,
    /b?(and|or|xor)/
  ], { prefix: '-' });
  var symbolOperators = /[+\-*\/%]=|\+\+|--|\.\.|[+\-*&^%:=!|\/]|<(?!#)|(?!#)>/;
  var operators = buildRegexp([wordOperators, symbolOperators], { suffix: '' });

  var numbers = /^((0x[\da-f]+)|((\d+\.\d+|\d\.|\.\d+|\d+)(e[\+\-]?\d+)?))[ld]?([kmgtp]b)?/i;

  var identifiers = /^[A-Za-z\_][A-Za-z\-\_\d]*\b/;

  var symbolBuiltins = /[A-Z]:|%|\?/i;
  var namedBuiltins = buildRegexp([
    /Add-(Computer|Content|History|Member|PSSnapin|Type)/,
    /Checkpoint-Computer/,
    /Clear-(Content|EventLog|History|Host|Item(Property)?|Variable)/,
    /Compare-Object/,
    /Complete-Transaction/,
    /Connect-PSSession/,
    /ConvertFrom-(Csv|Json|SecureString|StringData)/,
    /Convert-Path/,
    /ConvertTo-(Csv|Html|Json|SecureString|Xml)/,
    /Copy-Item(Property)?/,
    /Debug-Process/,
    /Disable-(ComputerRestore|PSBreakpoint|PSRemoting|PSSessionConfiguration)/,
    /Disconnect-PSSession/,
    /Enable-(ComputerRestore|PSBreakpoint|PSRemoting|PSSessionConfiguration)/,
    /(Enter|Exit)-PSSession/,
    /Export-(Alias|Clixml|Console|Counter|Csv|FormatData|ModuleMember|PSSession)/,
    /ForEach-Object/,
    /Format-(Custom|List|Table|Wide)/,
    new RegExp('Get-(Acl|Alias|AuthenticodeSignature|ChildItem|Command|ComputerRestorePoint|Content|ControlPanelItem|Counter|Credential'
      + '|Culture|Date|Event|EventLog|EventSubscriber|ExecutionPolicy|FormatData|Help|History|Host|HotFix|Item|ItemProperty|Job'
      + '|Location|Member|Module|PfxCertificate|Process|PSBreakpoint|PSCallStack|PSDrive|PSProvider|PSSession|PSSessionConfiguration'
      + '|PSSnapin|Random|Service|TraceSource|Transaction|TypeData|UICulture|Unique|Variable|Verb|WinEvent|WmiObject)'),
    /Group-Object/,
    /Import-(Alias|Clixml|Counter|Csv|LocalizedData|Module|PSSession)/,
    /ImportSystemModules/,
    /Invoke-(Command|Expression|History|Item|RestMethod|WebRequest|WmiMethod)/,
    /Join-Path/,
    /Limit-EventLog/,
    /Measure-(Command|Object)/,
    /Move-Item(Property)?/,
    new RegExp('New-(Alias|Event|EventLog|Item(Property)?|Module|ModuleManifest|Object|PSDrive|PSSession|PSSessionConfigurationFile'
      + '|PSSessionOption|PSTransportOption|Service|TimeSpan|Variable|WebServiceProxy|WinEvent)'),
    /Out-(Default|File|GridView|Host|Null|Printer|String)/,
    /Pause/,
    /(Pop|Push)-Location/,
    /Read-Host/,
    /Receive-(Job|PSSession)/,
    /Register-(EngineEvent|ObjectEvent|PSSessionConfiguration|WmiEvent)/,
    /Remove-(Computer|Event|EventLog|Item(Property)?|Job|Module|PSBreakpoint|PSDrive|PSSession|PSSnapin|TypeData|Variable|WmiObject)/,
    /Rename-(Computer|Item(Property)?)/,
    /Reset-ComputerMachinePassword/,
    /Resolve-Path/,
    /Restart-(Computer|Service)/,
    /Restore-Computer/,
    /Resume-(Job|Service)/,
    /Save-Help/,
    /Select-(Object|String|Xml)/,
    /Send-MailMessage/,
    new RegExp('Set-(Acl|Alias|AuthenticodeSignature|Content|Date|ExecutionPolicy|Item(Property)?|Location|PSBreakpoint|PSDebug' +
               '|PSSessionConfiguration|Service|StrictMode|TraceSource|Variable|WmiInstance)'),
    /Show-(Command|ControlPanelItem|EventLog)/,
    /Sort-Object/,
    /Split-Path/,
    /Start-(Job|Process|Service|Sleep|Transaction|Transcript)/,
    /Stop-(Computer|Job|Process|Service|Transcript)/,
    /Suspend-(Job|Service)/,
    /TabExpansion2/,
    /Tee-Object/,
    /Test-(ComputerSecureChannel|Connection|ModuleManifest|Path|PSSessionConfigurationFile)/,
    /Trace-Command/,
    /Unblock-File/,
    /Undo-Transaction/,
    /Unregister-(Event|PSSessionConfiguration)/,
    /Update-(FormatData|Help|List|TypeData)/,
    /Use-Transaction/,
    /Wait-(Event|Job|Process)/,
    /Where-Object/,
    /Write-(Debug|Error|EventLog|Host|Output|Progress|Verbose|Warning)/,
    /cd|help|mkdir|more|oss|prompt/,
    /ac|asnp|cat|cd|chdir|clc|clear|clhy|cli|clp|cls|clv|cnsn|compare|copy|cp|cpi|cpp|cvpa|dbp|del|diff|dir|dnsn|ebp/,
    /echo|epal|epcsv|epsn|erase|etsn|exsn|fc|fl|foreach|ft|fw|gal|gbp|gc|gci|gcm|gcs|gdr|ghy|gi|gjb|gl|gm|gmo|gp|gps/,
    /group|gsn|gsnp|gsv|gu|gv|gwmi|h|history|icm|iex|ihy|ii|ipal|ipcsv|ipmo|ipsn|irm|ise|iwmi|iwr|kill|lp|ls|man|md/,
    /measure|mi|mount|move|mp|mv|nal|ndr|ni|nmo|npssc|nsn|nv|ogv|oh|popd|ps|pushd|pwd|r|rbp|rcjb|rcsn|rd|rdr|ren|ri/,
    /rjb|rm|rmdir|rmo|rni|rnp|rp|rsn|rsnp|rujb|rv|rvpa|rwmi|sajb|sal|saps|sasv|sbp|sc|select|set|shcm|si|sl|sleep|sls/,
    /sort|sp|spjb|spps|spsv|start|sujb|sv|swmi|tee|trcm|type|where|wjb|write/
  ], { prefix: '', suffix: '' });
  var variableBuiltins = buildRegexp([
    /[$?^_]|Args|ConfirmPreference|ConsoleFileName|DebugPreference|Error|ErrorActionPreference|ErrorView|ExecutionContext/,
    /FormatEnumerationLimit|Home|Host|Input|MaximumAliasCount|MaximumDriveCount|MaximumErrorCount|MaximumFunctionCount/,
    /MaximumHistoryCount|MaximumVariableCount|MyInvocation|NestedPromptLevel|OutputEncoding|Pid|Profile|ProgressPreference/,
    /PSBoundParameters|PSCommandPath|PSCulture|PSDefaultParameterValues|PSEmailServer|PSHome|PSScriptRoot|PSSessionApplicationName/,
    /PSSessionConfigurationName|PSSessionOption|PSUICulture|PSVersionTable|Pwd|ShellId|StackTrace|VerbosePreference/,
    /WarningPreference|WhatIfPreference/,

    /Event|EventArgs|EventSubscriber|Sender/,
    /Matches|Ofs|ForEach|LastExitCode|PSCmdlet|PSItem|PSSenderInfo|This/,
    /true|false|null/
  ], { prefix: '\\$', suffix: '' });

  var builtins = buildRegexp([symbolBuiltins, namedBuiltins, variableBuiltins], { suffix: notCharacterOrDash });

  var grammar = {
    keyword: keywords,
    number: numbers,
    operator: operators,
    builtin: builtins,
    punctuation: punctuation,
    identifier: identifiers
  };

  // tokenizers
  function tokenBase(stream, state) {
    // Handle Comments
    //var ch = stream.peek();

    var parent = state.returnStack[state.returnStack.length - 1];
    if (parent && parent.shouldReturnFrom(state)) {
      state.tokenize = parent.tokenize;
      state.returnStack.pop();
      return state.tokenize(stream, state);
    }

    if (stream.eatSpace()) {
      return null;
    }

    if (stream.eat('(')) {
      state.bracketNesting += 1;
      return 'punctuation';
    }

    if (stream.eat(')')) {
      state.bracketNesting -= 1;
      return 'punctuation';
    }

    for (var key in grammar) {
      if (stream.match(grammar[key])) {
        return key;
      }
    }

    var ch = stream.next();

    // single-quote string
    if (ch === "'") {
      return tokenSingleQuoteString(stream, state);
    }

    if (ch === '$') {
      return tokenVariable(stream, state);
    }

    // double-quote string
    if (ch === '"') {
      return tokenDoubleQuoteString(stream, state);
    }

    if (ch === '<' && stream.eat('#')) {
      state.tokenize = tokenComment;
      return tokenComment(stream, state);
    }

    if (ch === '#') {
      stream.skipToEnd();
      return 'comment';
    }

    if (ch === '@') {
      var quoteMatch = stream.eat(/["']/);
      if (quoteMatch && stream.eol()) {
        state.tokenize = tokenMultiString;
        state.startQuote = quoteMatch[0];
        return tokenMultiString(stream, state);
      } else if (stream.eol()) {
        return 'error';
      } else if (stream.peek().match(/[({]/)) {
        return 'punctuation';
      } else if (stream.peek().match(varNames)) {
        // splatted variable
        return tokenVariable(stream, state);
      }
    }
    return 'error';
  }

  function tokenSingleQuoteString(stream, state) {
    var ch;
    while ((ch = stream.peek()) != null) {
      stream.next();

      if (ch === "'" && !stream.eat("'")) {
        state.tokenize = tokenBase;
        return 'string';
      }
    }

    return 'error';
  }

  function tokenDoubleQuoteString(stream, state) {
    var ch;
    while ((ch = stream.peek()) != null) {
      if (ch === '$') {
        state.tokenize = tokenStringInterpolation;
        return 'string';
      }

      stream.next();
      if (ch === '`') {
        stream.next();
        continue;
      }

      if (ch === '"' && !stream.eat('"')) {
        state.tokenize = tokenBase;
        return 'string';
      }
    }

    return 'error';
  }

  function tokenStringInterpolation(stream, state) {
    return tokenInterpolation(stream, state, tokenDoubleQuoteString);
  }

  function tokenMultiStringReturn(stream, state) {
    state.tokenize = tokenMultiString;
    state.startQuote = '"'
    return tokenMultiString(stream, state);
  }

  function tokenHereStringInterpolation(stream, state) {
    return tokenInterpolation(stream, state, tokenMultiStringReturn);
  }

  function tokenInterpolation(stream, state, parentTokenize) {
    if (stream.match('$(')) {
      var savedBracketNesting = state.bracketNesting;
      state.returnStack.push({
        /*jshint loopfunc:true */
        shouldReturnFrom: function(state) {
          return state.bracketNesting === savedBracketNesting;
        },
        tokenize: parentTokenize
      });
      state.tokenize = tokenBase;
      state.bracketNesting += 1;
      return 'punctuation';
    } else {
      stream.next();
      state.returnStack.push({
        shouldReturnFrom: function() { return true; },
        tokenize: parentTokenize
      });
      state.tokenize = tokenVariable;
      return state.tokenize(stream, state);
    }
  }

  function tokenComment(stream, state) {
    var maybeEnd = false, ch;
    while ((ch = stream.next()) != null) {
      if (maybeEnd && ch == '>') {
          state.tokenize = tokenBase;
          break;
      }
      maybeEnd = (ch === '#');
    }
    return 'comment';
  }

  function tokenVariable(stream, state) {
    var ch = stream.peek();
    if (stream.eat('{')) {
      state.tokenize = tokenVariableWithBraces;
      return tokenVariableWithBraces(stream, state);
    } else if (ch != undefined && ch.match(varNames)) {
      stream.eatWhile(varNames);
      state.tokenize = tokenBase;
      return 'variable-2';
    } else {
      state.tokenize = tokenBase;
      return 'error';
    }
  }

  function tokenVariableWithBraces(stream, state) {
    var ch;
    while ((ch = stream.next()) != null) {
      if (ch === '}') {
        state.tokenize = tokenBase;
        break;
      }
    }
    return 'variable-2';
  }

  function tokenMultiString(stream, state) {
    var quote = state.startQuote;
    if (stream.sol() && stream.match(new RegExp(quote + '@'))) {
      state.tokenize = tokenBase;
    }
    else if (quote === '"') {
      while (!stream.eol()) {
        var ch = stream.peek();
        if (ch === '$') {
          state.tokenize = tokenHereStringInterpolation;
          return 'string';
        }

        stream.next();
        if (ch === '`') {
          stream.next();
        }
      }
    }
    else {
      stream.skipToEnd();
    }

    return 'string';
  }

  var external = {
    startState: function() {
      return {
        returnStack: [],
        bracketNesting: 0,
        tokenize: tokenBase
      };
    },

    token: function(stream, state) {
      return state.tokenize(stream, state);
    },

    blockCommentStart: '<#',
    blockCommentEnd: '#>',
    lineComment: '#',
    fold: 'brace'
  };
  return external;
});

CodeMirror.defineMIME('application/x-powershell', 'powershell');
});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/properties/properties.js":
/*!**********************************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/properties/properties.js ***!
  \**********************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"));
  else {}
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode("properties", function() {
  return {
    token: function(stream, state) {
      var sol = stream.sol() || state.afterSection;
      var eol = stream.eol();

      state.afterSection = false;

      if (sol) {
        if (state.nextMultiline) {
          state.inMultiline = true;
          state.nextMultiline = false;
        } else {
          state.position = "def";
        }
      }

      if (eol && ! state.nextMultiline) {
        state.inMultiline = false;
        state.position = "def";
      }

      if (sol) {
        while(stream.eatSpace()) {}
      }

      var ch = stream.next();

      if (sol && (ch === "#" || ch === "!" || ch === ";")) {
        state.position = "comment";
        stream.skipToEnd();
        return "comment";
      } else if (sol && ch === "[") {
        state.afterSection = true;
        stream.skipTo("]"); stream.eat("]");
        return "header";
      } else if (ch === "=" || ch === ":") {
        state.position = "quote";
        return null;
      } else if (ch === "\\" && state.position === "quote") {
        if (stream.eol()) {  // end of line?
          // Multiline value
          state.nextMultiline = true;
        }
      }

      return state.position;
    },

    startState: function() {
      return {
        position : "def",       // Current position, "def", "quote" or "comment"
        nextMultiline : false,  // Is the next line multiline value
        inMultiline : false,    // Is the current line a multiline value
        afterSection : false    // Did we just open a section
      };
    }

  };
});

CodeMirror.defineMIME("text/x-properties", "properties");
CodeMirror.defineMIME("text/x-ini", "properties");

});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/protobuf/protobuf.js":
/*!******************************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/protobuf/protobuf.js ***!
  \******************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"));
  else {}
})(function(CodeMirror) {
  "use strict";

  function wordRegexp(words) {
    return new RegExp("^((" + words.join(")|(") + "))\\b", "i");
  };

  var keywordArray = [
    "package", "message", "import", "syntax",
    "required", "optional", "repeated", "reserved", "default", "extensions", "packed",
    "bool", "bytes", "double", "enum", "float", "string",
    "int32", "int64", "uint32", "uint64", "sint32", "sint64", "fixed32", "fixed64", "sfixed32", "sfixed64",
    "option", "service", "rpc", "returns"
  ];
  var keywords = wordRegexp(keywordArray);

  CodeMirror.registerHelper("hintWords", "protobuf", keywordArray);

  var identifiers = new RegExp("^[_A-Za-z\xa1-\uffff][_A-Za-z0-9\xa1-\uffff]*");

  function tokenBase(stream) {
    // whitespaces
    if (stream.eatSpace()) return null;

    // Handle one line Comments
    if (stream.match("//")) {
      stream.skipToEnd();
      return "comment";
    }

    // Handle Number Literals
    if (stream.match(/^[0-9\.+-]/, false)) {
      if (stream.match(/^[+-]?0x[0-9a-fA-F]+/))
        return "number";
      if (stream.match(/^[+-]?\d*\.\d+([EeDd][+-]?\d+)?/))
        return "number";
      if (stream.match(/^[+-]?\d+([EeDd][+-]?\d+)?/))
        return "number";
    }

    // Handle Strings
    if (stream.match(/^"([^"]|(""))*"/)) { return "string"; }
    if (stream.match(/^'([^']|(''))*'/)) { return "string"; }

    // Handle words
    if (stream.match(keywords)) { return "keyword"; }
    if (stream.match(identifiers)) { return "variable"; } ;

    // Handle non-detected items
    stream.next();
    return null;
  };

  CodeMirror.defineMode("protobuf", function() {
    return {token: tokenBase};
  });

  CodeMirror.defineMIME("text/x-protobuf", "protobuf");
});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/pug/pug.js":
/*!********************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/pug/pug.js ***!
  \********************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"), __webpack_require__(/*! ../javascript/javascript */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/javascript/javascript.js"), __webpack_require__(/*! ../css/css */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/css/css.js"), __webpack_require__(/*! ../htmlmixed/htmlmixed */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/htmlmixed/htmlmixed.js"));
  else {}
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode("pug", function (config) {
  // token types
  var KEYWORD = 'keyword';
  var DOCTYPE = 'meta';
  var ID = 'builtin';
  var CLASS = 'qualifier';

  var ATTRS_NEST = {
    '{': '}',
    '(': ')',
    '[': ']'
  };

  var jsMode = CodeMirror.getMode(config, 'javascript');

  function State() {
    this.javaScriptLine = false;
    this.javaScriptLineExcludesColon = false;

    this.javaScriptArguments = false;
    this.javaScriptArgumentsDepth = 0;

    this.isInterpolating = false;
    this.interpolationNesting = 0;

    this.jsState = CodeMirror.startState(jsMode);

    this.restOfLine = '';

    this.isIncludeFiltered = false;
    this.isEach = false;

    this.lastTag = '';
    this.scriptType = '';

    // Attributes Mode
    this.isAttrs = false;
    this.attrsNest = [];
    this.inAttributeName = true;
    this.attributeIsType = false;
    this.attrValue = '';

    // Indented Mode
    this.indentOf = Infinity;
    this.indentToken = '';

    this.innerMode = null;
    this.innerState = null;

    this.innerModeForLine = false;
  }
  /**
   * Safely copy a state
   *
   * @return {State}
   */
  State.prototype.copy = function () {
    var res = new State();
    res.javaScriptLine = this.javaScriptLine;
    res.javaScriptLineExcludesColon = this.javaScriptLineExcludesColon;
    res.javaScriptArguments = this.javaScriptArguments;
    res.javaScriptArgumentsDepth = this.javaScriptArgumentsDepth;
    res.isInterpolating = this.isInterpolating;
    res.interpolationNesting = this.interpolationNesting;

    res.jsState = CodeMirror.copyState(jsMode, this.jsState);

    res.innerMode = this.innerMode;
    if (this.innerMode && this.innerState) {
      res.innerState = CodeMirror.copyState(this.innerMode, this.innerState);
    }

    res.restOfLine = this.restOfLine;

    res.isIncludeFiltered = this.isIncludeFiltered;
    res.isEach = this.isEach;
    res.lastTag = this.lastTag;
    res.scriptType = this.scriptType;
    res.isAttrs = this.isAttrs;
    res.attrsNest = this.attrsNest.slice();
    res.inAttributeName = this.inAttributeName;
    res.attributeIsType = this.attributeIsType;
    res.attrValue = this.attrValue;
    res.indentOf = this.indentOf;
    res.indentToken = this.indentToken;

    res.innerModeForLine = this.innerModeForLine;

    return res;
  };

  function javaScript(stream, state) {
    if (stream.sol()) {
      // if javaScriptLine was set at end of line, ignore it
      state.javaScriptLine = false;
      state.javaScriptLineExcludesColon = false;
    }
    if (state.javaScriptLine) {
      if (state.javaScriptLineExcludesColon && stream.peek() === ':') {
        state.javaScriptLine = false;
        state.javaScriptLineExcludesColon = false;
        return;
      }
      var tok = jsMode.token(stream, state.jsState);
      if (stream.eol()) state.javaScriptLine = false;
      return tok || true;
    }
  }
  function javaScriptArguments(stream, state) {
    if (state.javaScriptArguments) {
      if (state.javaScriptArgumentsDepth === 0 && stream.peek() !== '(') {
        state.javaScriptArguments = false;
        return;
      }
      if (stream.peek() === '(') {
        state.javaScriptArgumentsDepth++;
      } else if (stream.peek() === ')') {
        state.javaScriptArgumentsDepth--;
      }
      if (state.javaScriptArgumentsDepth === 0) {
        state.javaScriptArguments = false;
        return;
      }

      var tok = jsMode.token(stream, state.jsState);
      return tok || true;
    }
  }

  function yieldStatement(stream) {
    if (stream.match(/^yield\b/)) {
        return 'keyword';
    }
  }

  function doctype(stream) {
    if (stream.match(/^(?:doctype) *([^\n]+)?/)) {
        return DOCTYPE;
    }
  }

  function interpolation(stream, state) {
    if (stream.match('#{')) {
      state.isInterpolating = true;
      state.interpolationNesting = 0;
      return 'punctuation';
    }
  }

  function interpolationContinued(stream, state) {
    if (state.isInterpolating) {
      if (stream.peek() === '}') {
        state.interpolationNesting--;
        if (state.interpolationNesting < 0) {
          stream.next();
          state.isInterpolating = false;
          return 'punctuation';
        }
      } else if (stream.peek() === '{') {
        state.interpolationNesting++;
      }
      return jsMode.token(stream, state.jsState) || true;
    }
  }

  function caseStatement(stream, state) {
    if (stream.match(/^case\b/)) {
      state.javaScriptLine = true;
      return KEYWORD;
    }
  }

  function when(stream, state) {
    if (stream.match(/^when\b/)) {
      state.javaScriptLine = true;
      state.javaScriptLineExcludesColon = true;
      return KEYWORD;
    }
  }

  function defaultStatement(stream) {
    if (stream.match(/^default\b/)) {
      return KEYWORD;
    }
  }

  function extendsStatement(stream, state) {
    if (stream.match(/^extends?\b/)) {
      state.restOfLine = 'string';
      return KEYWORD;
    }
  }

  function append(stream, state) {
    if (stream.match(/^append\b/)) {
      state.restOfLine = 'variable';
      return KEYWORD;
    }
  }
  function prepend(stream, state) {
    if (stream.match(/^prepend\b/)) {
      state.restOfLine = 'variable';
      return KEYWORD;
    }
  }
  function block(stream, state) {
    if (stream.match(/^block\b *(?:(prepend|append)\b)?/)) {
      state.restOfLine = 'variable';
      return KEYWORD;
    }
  }

  function include(stream, state) {
    if (stream.match(/^include\b/)) {
      state.restOfLine = 'string';
      return KEYWORD;
    }
  }

  function includeFiltered(stream, state) {
    if (stream.match(/^include:([a-zA-Z0-9\-]+)/, false) && stream.match('include')) {
      state.isIncludeFiltered = true;
      return KEYWORD;
    }
  }

  function includeFilteredContinued(stream, state) {
    if (state.isIncludeFiltered) {
      var tok = filter(stream, state);
      state.isIncludeFiltered = false;
      state.restOfLine = 'string';
      return tok;
    }
  }

  function mixin(stream, state) {
    if (stream.match(/^mixin\b/)) {
      state.javaScriptLine = true;
      return KEYWORD;
    }
  }

  function call(stream, state) {
    if (stream.match(/^\+([-\w]+)/)) {
      if (!stream.match(/^\( *[-\w]+ *=/, false)) {
        state.javaScriptArguments = true;
        state.javaScriptArgumentsDepth = 0;
      }
      return 'variable';
    }
    if (stream.match(/^\+#{/, false)) {
      stream.next();
      state.mixinCallAfter = true;
      return interpolation(stream, state);
    }
  }
  function callArguments(stream, state) {
    if (state.mixinCallAfter) {
      state.mixinCallAfter = false;
      if (!stream.match(/^\( *[-\w]+ *=/, false)) {
        state.javaScriptArguments = true;
        state.javaScriptArgumentsDepth = 0;
      }
      return true;
    }
  }

  function conditional(stream, state) {
    if (stream.match(/^(if|unless|else if|else)\b/)) {
      state.javaScriptLine = true;
      return KEYWORD;
    }
  }

  function each(stream, state) {
    if (stream.match(/^(- *)?(each|for)\b/)) {
      state.isEach = true;
      return KEYWORD;
    }
  }
  function eachContinued(stream, state) {
    if (state.isEach) {
      if (stream.match(/^ in\b/)) {
        state.javaScriptLine = true;
        state.isEach = false;
        return KEYWORD;
      } else if (stream.sol() || stream.eol()) {
        state.isEach = false;
      } else if (stream.next()) {
        while (!stream.match(/^ in\b/, false) && stream.next());
        return 'variable';
      }
    }
  }

  function whileStatement(stream, state) {
    if (stream.match(/^while\b/)) {
      state.javaScriptLine = true;
      return KEYWORD;
    }
  }

  function tag(stream, state) {
    var captures;
    if (captures = stream.match(/^(\w(?:[-:\w]*\w)?)\/?/)) {
      state.lastTag = captures[1].toLowerCase();
      if (state.lastTag === 'script') {
        state.scriptType = 'application/javascript';
      }
      return 'tag';
    }
  }

  function filter(stream, state) {
    if (stream.match(/^:([\w\-]+)/)) {
      var innerMode;
      if (config && config.innerModes) {
        innerMode = config.innerModes(stream.current().substring(1));
      }
      if (!innerMode) {
        innerMode = stream.current().substring(1);
      }
      if (typeof innerMode === 'string') {
        innerMode = CodeMirror.getMode(config, innerMode);
      }
      setInnerMode(stream, state, innerMode);
      return 'atom';
    }
  }

  function code(stream, state) {
    if (stream.match(/^(!?=|-)/)) {
      state.javaScriptLine = true;
      return 'punctuation';
    }
  }

  function id(stream) {
    if (stream.match(/^#([\w-]+)/)) {
      return ID;
    }
  }

  function className(stream) {
    if (stream.match(/^\.([\w-]+)/)) {
      return CLASS;
    }
  }

  function attrs(stream, state) {
    if (stream.peek() == '(') {
      stream.next();
      state.isAttrs = true;
      state.attrsNest = [];
      state.inAttributeName = true;
      state.attrValue = '';
      state.attributeIsType = false;
      return 'punctuation';
    }
  }

  function attrsContinued(stream, state) {
    if (state.isAttrs) {
      if (ATTRS_NEST[stream.peek()]) {
        state.attrsNest.push(ATTRS_NEST[stream.peek()]);
      }
      if (state.attrsNest[state.attrsNest.length - 1] === stream.peek()) {
        state.attrsNest.pop();
      } else  if (stream.eat(')')) {
        state.isAttrs = false;
        return 'punctuation';
      }
      if (state.inAttributeName && stream.match(/^[^=,\)!]+/)) {
        if (stream.peek() === '=' || stream.peek() === '!') {
          state.inAttributeName = false;
          state.jsState = CodeMirror.startState(jsMode);
          if (state.lastTag === 'script' && stream.current().trim().toLowerCase() === 'type') {
            state.attributeIsType = true;
          } else {
            state.attributeIsType = false;
          }
        }
        return 'attribute';
      }

      var tok = jsMode.token(stream, state.jsState);
      if (state.attributeIsType && tok === 'string') {
        state.scriptType = stream.current().toString();
      }
      if (state.attrsNest.length === 0 && (tok === 'string' || tok === 'variable' || tok === 'keyword')) {
        try {
          Function('', 'var x ' + state.attrValue.replace(/,\s*$/, '').replace(/^!/, ''));
          state.inAttributeName = true;
          state.attrValue = '';
          stream.backUp(stream.current().length);
          return attrsContinued(stream, state);
        } catch (ex) {
          //not the end of an attribute
        }
      }
      state.attrValue += stream.current();
      return tok || true;
    }
  }

  function attributesBlock(stream, state) {
    if (stream.match(/^&attributes\b/)) {
      state.javaScriptArguments = true;
      state.javaScriptArgumentsDepth = 0;
      return 'keyword';
    }
  }

  function indent(stream) {
    if (stream.sol() && stream.eatSpace()) {
      return 'indent';
    }
  }

  function comment(stream, state) {
    if (stream.match(/^ *\/\/(-)?([^\n]*)/)) {
      state.indentOf = stream.indentation();
      state.indentToken = 'comment';
      return 'comment';
    }
  }

  function colon(stream) {
    if (stream.match(/^: */)) {
      return 'colon';
    }
  }

  function text(stream, state) {
    if (stream.match(/^(?:\| ?| )([^\n]+)/)) {
      return 'string';
    }
    if (stream.match(/^(<[^\n]*)/, false)) {
      // html string
      setInnerMode(stream, state, 'htmlmixed');
      state.innerModeForLine = true;
      return innerMode(stream, state, true);
    }
  }

  function dot(stream, state) {
    if (stream.eat('.')) {
      var innerMode = null;
      if (state.lastTag === 'script' && state.scriptType.toLowerCase().indexOf('javascript') != -1) {
        innerMode = state.scriptType.toLowerCase().replace(/"|'/g, '');
      } else if (state.lastTag === 'style') {
        innerMode = 'css';
      }
      setInnerMode(stream, state, innerMode);
      return 'dot';
    }
  }

  function fail(stream) {
    stream.next();
    return null;
  }


  function setInnerMode(stream, state, mode) {
    mode = CodeMirror.mimeModes[mode] || mode;
    mode = config.innerModes ? config.innerModes(mode) || mode : mode;
    mode = CodeMirror.mimeModes[mode] || mode;
    mode = CodeMirror.getMode(config, mode);
    state.indentOf = stream.indentation();

    if (mode && mode.name !== 'null') {
      state.innerMode = mode;
    } else {
      state.indentToken = 'string';
    }
  }
  function innerMode(stream, state, force) {
    if (stream.indentation() > state.indentOf || (state.innerModeForLine && !stream.sol()) || force) {
      if (state.innerMode) {
        if (!state.innerState) {
          state.innerState = state.innerMode.startState ? CodeMirror.startState(state.innerMode, stream.indentation()) : {};
        }
        return stream.hideFirstChars(state.indentOf + 2, function () {
          return state.innerMode.token(stream, state.innerState) || true;
        });
      } else {
        stream.skipToEnd();
        return state.indentToken;
      }
    } else if (stream.sol()) {
      state.indentOf = Infinity;
      state.indentToken = null;
      state.innerMode = null;
      state.innerState = null;
    }
  }
  function restOfLine(stream, state) {
    if (stream.sol()) {
      // if restOfLine was set at end of line, ignore it
      state.restOfLine = '';
    }
    if (state.restOfLine) {
      stream.skipToEnd();
      var tok = state.restOfLine;
      state.restOfLine = '';
      return tok;
    }
  }


  function startState() {
    return new State();
  }
  function copyState(state) {
    return state.copy();
  }
  /**
   * Get the next token in the stream
   *
   * @param {Stream} stream
   * @param {State} state
   */
  function nextToken(stream, state) {
    var tok = innerMode(stream, state)
      || restOfLine(stream, state)
      || interpolationContinued(stream, state)
      || includeFilteredContinued(stream, state)
      || eachContinued(stream, state)
      || attrsContinued(stream, state)
      || javaScript(stream, state)
      || javaScriptArguments(stream, state)
      || callArguments(stream, state)

      || yieldStatement(stream, state)
      || doctype(stream, state)
      || interpolation(stream, state)
      || caseStatement(stream, state)
      || when(stream, state)
      || defaultStatement(stream, state)
      || extendsStatement(stream, state)
      || append(stream, state)
      || prepend(stream, state)
      || block(stream, state)
      || include(stream, state)
      || includeFiltered(stream, state)
      || mixin(stream, state)
      || call(stream, state)
      || conditional(stream, state)
      || each(stream, state)
      || whileStatement(stream, state)
      || tag(stream, state)
      || filter(stream, state)
      || code(stream, state)
      || id(stream, state)
      || className(stream, state)
      || attrs(stream, state)
      || attributesBlock(stream, state)
      || indent(stream, state)
      || text(stream, state)
      || comment(stream, state)
      || colon(stream, state)
      || dot(stream, state)
      || fail(stream, state);

    return tok === true ? null : tok;
  }
  return {
    startState: startState,
    copyState: copyState,
    token: nextToken
  };
}, 'javascript', 'css', 'htmlmixed');

CodeMirror.defineMIME('text/x-pug', 'pug');
CodeMirror.defineMIME('text/x-jade', 'pug');

});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/puppet/puppet.js":
/*!**************************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/puppet/puppet.js ***!
  \**************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"));
  else {}
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode("puppet", function () {
  // Stores the words from the define method
  var words = {};
  // Taken, mostly, from the Puppet official variable standards regex
  var variable_regex = /({)?([a-z][a-z0-9_]*)?((::[a-z][a-z0-9_]*)*::)?[a-zA-Z0-9_]+(})?/;

  // Takes a string of words separated by spaces and adds them as
  // keys with the value of the first argument 'style'
  function define(style, string) {
    var split = string.split(' ');
    for (var i = 0; i < split.length; i++) {
      words[split[i]] = style;
    }
  }

  // Takes commonly known puppet types/words and classifies them to a style
  define('keyword', 'class define site node include import inherits');
  define('keyword', 'case if else in and elsif default or');
  define('atom', 'false true running present absent file directory undef');
  define('builtin', 'action augeas burst chain computer cron destination dport exec ' +
    'file filebucket group host icmp iniface interface jump k5login limit log_level ' +
    'log_prefix macauthorization mailalias maillist mcx mount nagios_command ' +
    'nagios_contact nagios_contactgroup nagios_host nagios_hostdependency ' +
    'nagios_hostescalation nagios_hostextinfo nagios_hostgroup nagios_service ' +
    'nagios_servicedependency nagios_serviceescalation nagios_serviceextinfo ' +
    'nagios_servicegroup nagios_timeperiod name notify outiface package proto reject ' +
    'resources router schedule scheduled_task selboolean selmodule service source ' +
    'sport ssh_authorized_key sshkey stage state table tidy todest toports tosource ' +
    'user vlan yumrepo zfs zone zpool');

  // After finding a start of a string ('|") this function attempts to find the end;
  // If a variable is encountered along the way, we display it differently when it
  // is encapsulated in a double-quoted string.
  function tokenString(stream, state) {
    var current, prev, found_var = false;
    while (!stream.eol() && (current = stream.next()) != state.pending) {
      if (current === '$' && prev != '\\' && state.pending == '"') {
        found_var = true;
        break;
      }
      prev = current;
    }
    if (found_var) {
      stream.backUp(1);
    }
    if (current == state.pending) {
      state.continueString = false;
    } else {
      state.continueString = true;
    }
    return "string";
  }

  // Main function
  function tokenize(stream, state) {
    // Matches one whole word
    var word = stream.match(/[\w]+/, false);
    // Matches attributes (i.e. ensure => present ; 'ensure' would be matched)
    var attribute = stream.match(/(\s+)?\w+\s+=>.*/, false);
    // Matches non-builtin resource declarations
    // (i.e. "apache::vhost {" or "mycustomclasss {" would be matched)
    var resource = stream.match(/(\s+)?[\w:_]+(\s+)?{/, false);
    // Matches virtual and exported resources (i.e. @@user { ; and the like)
    var special_resource = stream.match(/(\s+)?[@]{1,2}[\w:_]+(\s+)?{/, false);

    // Finally advance the stream
    var ch = stream.next();

    // Have we found a variable?
    if (ch === '$') {
      if (stream.match(variable_regex)) {
        // If so, and its in a string, assign it a different color
        return state.continueString ? 'variable-2' : 'variable';
      }
      // Otherwise return an invalid variable
      return "error";
    }
    // Should we still be looking for the end of a string?
    if (state.continueString) {
      // If so, go through the loop again
      stream.backUp(1);
      return tokenString(stream, state);
    }
    // Are we in a definition (class, node, define)?
    if (state.inDefinition) {
      // If so, return def (i.e. for 'class myclass {' ; 'myclass' would be matched)
      if (stream.match(/(\s+)?[\w:_]+(\s+)?/)) {
        return 'def';
      }
      // Match the rest it the next time around
      stream.match(/\s+{/);
      state.inDefinition = false;
    }
    // Are we in an 'include' statement?
    if (state.inInclude) {
      // Match and return the included class
      stream.match(/(\s+)?\S+(\s+)?/);
      state.inInclude = false;
      return 'def';
    }
    // Do we just have a function on our hands?
    // In 'ensure_resource("myclass")', 'ensure_resource' is matched
    if (stream.match(/(\s+)?\w+\(/)) {
      stream.backUp(1);
      return 'def';
    }
    // Have we matched the prior attribute regex?
    if (attribute) {
      stream.match(/(\s+)?\w+/);
      return 'tag';
    }
    // Do we have Puppet specific words?
    if (word && words.hasOwnProperty(word)) {
      // Negates the initial next()
      stream.backUp(1);
      // rs move the stream
      stream.match(/[\w]+/);
      // We want to process these words differently
      // do to the importance they have in Puppet
      if (stream.match(/\s+\S+\s+{/, false)) {
        state.inDefinition = true;
      }
      if (word == 'include') {
        state.inInclude = true;
      }
      // Returns their value as state in the prior define methods
      return words[word];
    }
    // Is there a match on a reference?
    if (/(^|\s+)[A-Z][\w:_]+/.test(word)) {
      // Negate the next()
      stream.backUp(1);
      // Match the full reference
      stream.match(/(^|\s+)[A-Z][\w:_]+/);
      return 'def';
    }
    // Have we matched the prior resource regex?
    if (resource) {
      stream.match(/(\s+)?[\w:_]+/);
      return 'def';
    }
    // Have we matched the prior special_resource regex?
    if (special_resource) {
      stream.match(/(\s+)?[@]{1,2}/);
      return 'special';
    }
    // Match all the comments. All of them.
    if (ch == "#") {
      stream.skipToEnd();
      return "comment";
    }
    // Have we found a string?
    if (ch == "'" || ch == '"') {
      // Store the type (single or double)
      state.pending = ch;
      // Perform the looping function to find the end
      return tokenString(stream, state);
    }
    // Match all the brackets
    if (ch == '{' || ch == '}') {
      return 'bracket';
    }
    // Match characters that we are going to assume
    // are trying to be regex
    if (ch == '/') {
      stream.match(/.*?\//);
      return 'variable-3';
    }
    // Match all the numbers
    if (ch.match(/[0-9]/)) {
      stream.eatWhile(/[0-9]+/);
      return 'number';
    }
    // Match the '=' and '=>' operators
    if (ch == '=') {
      if (stream.peek() == '>') {
          stream.next();
      }
      return "operator";
    }
    // Keep advancing through all the rest
    stream.eatWhile(/[\w-]/);
    // Return a blank line for everything else
    return null;
  }
  // Start it all
  return {
    startState: function () {
      var state = {};
      state.inDefinition = false;
      state.inInclude = false;
      state.continueString = false;
      state.pending = false;
      return state;
    },
    token: function (stream, state) {
      // Strip the spaces, but regex will account for them eitherway
      if (stream.eatSpace()) return null;
      // Go through the main process
      return tokenize(stream, state);
    }
  };
});

CodeMirror.defineMIME("text/x-puppet", "puppet");

});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/q/q.js":
/*!****************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/q/q.js ***!
  \****************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"));
  else {}
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode("q",function(config){
  var indentUnit=config.indentUnit,
      curPunc,
      keywords=buildRE(["abs","acos","aj","aj0","all","and","any","asc","asin","asof","atan","attr","avg","avgs","bin","by","ceiling","cols","cor","cos","count","cov","cross","csv","cut","delete","deltas","desc","dev","differ","distinct","div","do","each","ej","enlist","eval","except","exec","exit","exp","fby","fills","first","fkeys","flip","floor","from","get","getenv","group","gtime","hclose","hcount","hdel","hopen","hsym","iasc","idesc","if","ij","in","insert","inter","inv","key","keys","last","like","list","lj","load","log","lower","lsq","ltime","ltrim","mavg","max","maxs","mcount","md5","mdev","med","meta","min","mins","mmax","mmin","mmu","mod","msum","neg","next","not","null","or","over","parse","peach","pj","plist","prd","prds","prev","prior","rand","rank","ratios","raze","read0","read1","reciprocal","reverse","rload","rotate","rsave","rtrim","save","scan","select","set","setenv","show","signum","sin","sqrt","ss","ssr","string","sublist","sum","sums","sv","system","tables","tan","til","trim","txf","type","uj","ungroup","union","update","upper","upsert","value","var","view","views","vs","wavg","where","where","while","within","wj","wj1","wsum","xasc","xbar","xcol","xcols","xdesc","xexp","xgroup","xkey","xlog","xprev","xrank"]),
      E=/[|/&^!+:\\\-*%$=~#;@><,?_\'\"\[\(\]\)\s{}]/;
  function buildRE(w){return new RegExp("^("+w.join("|")+")$");}
  function tokenBase(stream,state){
    var sol=stream.sol(),c=stream.next();
    curPunc=null;
    if(sol)
      if(c=="/")
        return(state.tokenize=tokenLineComment)(stream,state);
      else if(c=="\\"){
        if(stream.eol()||/\s/.test(stream.peek()))
          return stream.skipToEnd(),/^\\\s*$/.test(stream.current())?(state.tokenize=tokenCommentToEOF)(stream):state.tokenize=tokenBase,"comment";
        else
          return state.tokenize=tokenBase,"builtin";
      }
    if(/\s/.test(c))
      return stream.peek()=="/"?(stream.skipToEnd(),"comment"):"whitespace";
    if(c=='"')
      return(state.tokenize=tokenString)(stream,state);
    if(c=='`')
      return stream.eatWhile(/[A-Za-z\d_:\/.]/),"symbol";
    if(("."==c&&/\d/.test(stream.peek()))||/\d/.test(c)){
      var t=null;
      stream.backUp(1);
      if(stream.match(/^\d{4}\.\d{2}(m|\.\d{2}([DT](\d{2}(:\d{2}(:\d{2}(\.\d{1,9})?)?)?)?)?)/)
      || stream.match(/^\d+D(\d{2}(:\d{2}(:\d{2}(\.\d{1,9})?)?)?)/)
      || stream.match(/^\d{2}:\d{2}(:\d{2}(\.\d{1,9})?)?/)
      || stream.match(/^\d+[ptuv]{1}/))
        t="temporal";
      else if(stream.match(/^0[NwW]{1}/)
      || stream.match(/^0x[\da-fA-F]*/)
      || stream.match(/^[01]+[b]{1}/)
      || stream.match(/^\d+[chijn]{1}/)
      || stream.match(/-?\d*(\.\d*)?(e[+\-]?\d+)?(e|f)?/))
        t="number";
      return(t&&(!(c=stream.peek())||E.test(c)))?t:(stream.next(),"error");
    }
    if(/[A-Za-z]|\./.test(c))
      return stream.eatWhile(/[A-Za-z._\d]/),keywords.test(stream.current())?"keyword":"variable";
    if(/[|/&^!+:\\\-*%$=~#;@><\.,?_\']/.test(c))
      return null;
    if(/[{}\(\[\]\)]/.test(c))
      return null;
    return"error";
  }
  function tokenLineComment(stream,state){
    return stream.skipToEnd(),/\/\s*$/.test(stream.current())?(state.tokenize=tokenBlockComment)(stream,state):(state.tokenize=tokenBase),"comment";
  }
  function tokenBlockComment(stream,state){
    var f=stream.sol()&&stream.peek()=="\\";
    stream.skipToEnd();
    if(f&&/^\\\s*$/.test(stream.current()))
      state.tokenize=tokenBase;
    return"comment";
  }
  function tokenCommentToEOF(stream){return stream.skipToEnd(),"comment";}
  function tokenString(stream,state){
    var escaped=false,next,end=false;
    while((next=stream.next())){
      if(next=="\""&&!escaped){end=true;break;}
      escaped=!escaped&&next=="\\";
    }
    if(end)state.tokenize=tokenBase;
    return"string";
  }
  function pushContext(state,type,col){state.context={prev:state.context,indent:state.indent,col:col,type:type};}
  function popContext(state){state.indent=state.context.indent;state.context=state.context.prev;}
  return{
    startState:function(){
      return{tokenize:tokenBase,
             context:null,
             indent:0,
             col:0};
    },
    token:function(stream,state){
      if(stream.sol()){
        if(state.context&&state.context.align==null)
          state.context.align=false;
        state.indent=stream.indentation();
      }
      //if (stream.eatSpace()) return null;
      var style=state.tokenize(stream,state);
      if(style!="comment"&&state.context&&state.context.align==null&&state.context.type!="pattern"){
        state.context.align=true;
      }
      if(curPunc=="(")pushContext(state,")",stream.column());
      else if(curPunc=="[")pushContext(state,"]",stream.column());
      else if(curPunc=="{")pushContext(state,"}",stream.column());
      else if(/[\]\}\)]/.test(curPunc)){
        while(state.context&&state.context.type=="pattern")popContext(state);
        if(state.context&&curPunc==state.context.type)popContext(state);
      }
      else if(curPunc=="."&&state.context&&state.context.type=="pattern")popContext(state);
      else if(/atom|string|variable/.test(style)&&state.context){
        if(/[\}\]]/.test(state.context.type))
          pushContext(state,"pattern",stream.column());
        else if(state.context.type=="pattern"&&!state.context.align){
          state.context.align=true;
          state.context.col=stream.column();
        }
      }
      return style;
    },
    indent:function(state,textAfter){
      var firstChar=textAfter&&textAfter.charAt(0);
      var context=state.context;
      if(/[\]\}]/.test(firstChar))
        while (context&&context.type=="pattern")context=context.prev;
      var closing=context&&firstChar==context.type;
      if(!context)
        return 0;
      else if(context.type=="pattern")
        return context.col;
      else if(context.align)
        return context.col+(closing?0:1);
      else
        return context.indent+(closing?0:indentUnit);
    }
  };
});
CodeMirror.defineMIME("text/x-q","q");

});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/rpm/rpm.js":
/*!********************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/rpm/rpm.js ***!
  \********************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"));
  else {}
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode("rpm-changes", function() {
  var headerSeperator = /^-+$/;
  var headerLine = /^(Mon|Tue|Wed|Thu|Fri|Sat|Sun) (Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)  ?\d{1,2} \d{2}:\d{2}(:\d{2})? [A-Z]{3,4} \d{4} - /;
  var simpleEmail = /^[\w+.-]+@[\w.-]+/;

  return {
    token: function(stream) {
      if (stream.sol()) {
        if (stream.match(headerSeperator)) { return 'tag'; }
        if (stream.match(headerLine)) { return 'tag'; }
      }
      if (stream.match(simpleEmail)) { return 'string'; }
      stream.next();
      return null;
    }
  };
});

CodeMirror.defineMIME("text/x-rpm-changes", "rpm-changes");

// Quick and dirty spec file highlighting

CodeMirror.defineMode("rpm-spec", function() {
  var arch = /^(i386|i586|i686|x86_64|ppc64le|ppc64|ppc|ia64|s390x|s390|sparc64|sparcv9|sparc|noarch|alphaev6|alpha|hppa|mipsel)/;

  var preamble = /^[a-zA-Z0-9()]+:/;
  var section = /^%(debug_package|package|description|prep|build|install|files|clean|changelog|preinstall|preun|postinstall|postun|pretrans|posttrans|pre|post|triggerin|triggerun|verifyscript|check|triggerpostun|triggerprein|trigger)/;
  var control_flow_complex = /^%(ifnarch|ifarch|if)/; // rpm control flow macros
  var control_flow_simple = /^%(else|endif)/; // rpm control flow macros
  var operators = /^(\!|\?|\<\=|\<|\>\=|\>|\=\=|\&\&|\|\|)/; // operators in control flow macros

  return {
    startState: function () {
        return {
          controlFlow: false,
          macroParameters: false,
          section: false
        };
    },
    token: function (stream, state) {
      var ch = stream.peek();
      if (ch == "#") { stream.skipToEnd(); return "comment"; }

      if (stream.sol()) {
        if (stream.match(preamble)) { return "header"; }
        if (stream.match(section)) { return "atom"; }
      }

      if (stream.match(/^\$\w+/)) { return "def"; } // Variables like '$RPM_BUILD_ROOT'
      if (stream.match(/^\$\{\w+\}/)) { return "def"; } // Variables like '${RPM_BUILD_ROOT}'

      if (stream.match(control_flow_simple)) { return "keyword"; }
      if (stream.match(control_flow_complex)) {
        state.controlFlow = true;
        return "keyword";
      }
      if (state.controlFlow) {
        if (stream.match(operators)) { return "operator"; }
        if (stream.match(/^(\d+)/)) { return "number"; }
        if (stream.eol()) { state.controlFlow = false; }
      }

      if (stream.match(arch)) {
        if (stream.eol()) { state.controlFlow = false; }
        return "number";
      }

      // Macros like '%make_install' or '%attr(0775,root,root)'
      if (stream.match(/^%[\w]+/)) {
        if (stream.match(/^\(/)) { state.macroParameters = true; }
        return "keyword";
      }
      if (state.macroParameters) {
        if (stream.match(/^\d+/)) { return "number";}
        if (stream.match(/^\)/)) {
          state.macroParameters = false;
          return "keyword";
        }
      }

      // Macros like '%{defined fedora}'
      if (stream.match(/^%\{\??[\w \-\:\!]+\}/)) {
        if (stream.eol()) { state.controlFlow = false; }
        return "def";
      }

      //TODO: Include bash script sub-parser (CodeMirror supports that)
      stream.next();
      return null;
    }
  };
});

CodeMirror.defineMIME("text/x-rpm-spec", "rpm-spec");

});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/rst/rst.js":
/*!********************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/rst/rst.js ***!
  \********************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"), __webpack_require__(/*! ../python/python */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/python/python.js"), __webpack_require__(/*! ../stex/stex */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/stex/stex.js"), __webpack_require__(/*! ../../addon/mode/overlay */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/addon/mode/overlay.js"));
  else {}
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode('rst', function (config, options) {

  var rx_strong = /^\*\*[^\*\s](?:[^\*]*[^\*\s])?\*\*/;
  var rx_emphasis = /^\*[^\*\s](?:[^\*]*[^\*\s])?\*/;
  var rx_literal = /^``[^`\s](?:[^`]*[^`\s])``/;

  var rx_number = /^(?:[\d]+(?:[\.,]\d+)*)/;
  var rx_positive = /^(?:\s\+[\d]+(?:[\.,]\d+)*)/;
  var rx_negative = /^(?:\s\-[\d]+(?:[\.,]\d+)*)/;

  var rx_uri_protocol = "[Hh][Tt][Tt][Pp][Ss]?://";
  var rx_uri_domain = "(?:[\\d\\w.-]+)\\.(?:\\w{2,6})";
  var rx_uri_path = "(?:/[\\d\\w\\#\\%\\&\\-\\.\\,\\/\\:\\=\\?\\~]+)*";
  var rx_uri = new RegExp("^" + rx_uri_protocol + rx_uri_domain + rx_uri_path);

  var overlay = {
    token: function (stream) {

      if (stream.match(rx_strong) && stream.match (/\W+|$/, false))
        return 'strong';
      if (stream.match(rx_emphasis) && stream.match (/\W+|$/, false))
        return 'em';
      if (stream.match(rx_literal) && stream.match (/\W+|$/, false))
        return 'string-2';
      if (stream.match(rx_number))
        return 'number';
      if (stream.match(rx_positive))
        return 'positive';
      if (stream.match(rx_negative))
        return 'negative';
      if (stream.match(rx_uri))
        return 'link';

      while (stream.next() != null) {
        if (stream.match(rx_strong, false)) break;
        if (stream.match(rx_emphasis, false)) break;
        if (stream.match(rx_literal, false)) break;
        if (stream.match(rx_number, false)) break;
        if (stream.match(rx_positive, false)) break;
        if (stream.match(rx_negative, false)) break;
        if (stream.match(rx_uri, false)) break;
      }

      return null;
    }
  };

  var mode = CodeMirror.getMode(
    config, options.backdrop || 'rst-base'
  );

  return CodeMirror.overlayMode(mode, overlay, true); // combine
}, 'python', 'stex');

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

CodeMirror.defineMode('rst-base', function (config) {

  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////

  function format(string) {
    var args = Array.prototype.slice.call(arguments, 1);
    return string.replace(/{(\d+)}/g, function (match, n) {
      return typeof args[n] != 'undefined' ? args[n] : match;
    });
  }

  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////

  var mode_python = CodeMirror.getMode(config, 'python');
  var mode_stex = CodeMirror.getMode(config, 'stex');

  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////

  var SEPA = "\\s+";
  var TAIL = "(?:\\s*|\\W|$)",
  rx_TAIL = new RegExp(format('^{0}', TAIL));

  var NAME =
    "(?:[^\\W\\d_](?:[\\w!\"#$%&'()\\*\\+,\\-\\.\/:;<=>\\?]*[^\\W_])?)",
  rx_NAME = new RegExp(format('^{0}', NAME));
  var NAME_WWS =
    "(?:[^\\W\\d_](?:[\\w\\s!\"#$%&'()\\*\\+,\\-\\.\/:;<=>\\?]*[^\\W_])?)";
  var REF_NAME = format('(?:{0}|`{1}`)', NAME, NAME_WWS);

  var TEXT1 = "(?:[^\\s\\|](?:[^\\|]*[^\\s\\|])?)";
  var TEXT2 = "(?:[^\\`]+)",
  rx_TEXT2 = new RegExp(format('^{0}', TEXT2));

  var rx_section = new RegExp(
    "^([!'#$%&\"()*+,-./:;<=>?@\\[\\\\\\]^_`{|}~])\\1{3,}\\s*$");
  var rx_explicit = new RegExp(
    format('^\\.\\.{0}', SEPA));
  var rx_link = new RegExp(
    format('^_{0}:{1}|^__:{1}', REF_NAME, TAIL));
  var rx_directive = new RegExp(
    format('^{0}::{1}', REF_NAME, TAIL));
  var rx_substitution = new RegExp(
    format('^\\|{0}\\|{1}{2}::{3}', TEXT1, SEPA, REF_NAME, TAIL));
  var rx_footnote = new RegExp(
    format('^\\[(?:\\d+|#{0}?|\\*)]{1}', REF_NAME, TAIL));
  var rx_citation = new RegExp(
    format('^\\[{0}\\]{1}', REF_NAME, TAIL));

  var rx_substitution_ref = new RegExp(
    format('^\\|{0}\\|', TEXT1));
  var rx_footnote_ref = new RegExp(
    format('^\\[(?:\\d+|#{0}?|\\*)]_', REF_NAME));
  var rx_citation_ref = new RegExp(
    format('^\\[{0}\\]_', REF_NAME));
  var rx_link_ref1 = new RegExp(
    format('^{0}__?', REF_NAME));
  var rx_link_ref2 = new RegExp(
    format('^`{0}`_', TEXT2));

  var rx_role_pre = new RegExp(
    format('^:{0}:`{1}`{2}', NAME, TEXT2, TAIL));
  var rx_role_suf = new RegExp(
    format('^`{1}`:{0}:{2}', NAME, TEXT2, TAIL));
  var rx_role = new RegExp(
    format('^:{0}:{1}', NAME, TAIL));

  var rx_directive_name = new RegExp(format('^{0}', REF_NAME));
  var rx_directive_tail = new RegExp(format('^::{0}', TAIL));
  var rx_substitution_text = new RegExp(format('^\\|{0}\\|', TEXT1));
  var rx_substitution_sepa = new RegExp(format('^{0}', SEPA));
  var rx_substitution_name = new RegExp(format('^{0}', REF_NAME));
  var rx_substitution_tail = new RegExp(format('^::{0}', TAIL));
  var rx_link_head = new RegExp("^_");
  var rx_link_name = new RegExp(format('^{0}|_', REF_NAME));
  var rx_link_tail = new RegExp(format('^:{0}', TAIL));

  var rx_verbatim = new RegExp('^::\\s*$');
  var rx_examples = new RegExp('^\\s+(?:>>>|In \\[\\d+\\]:)\\s');

  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////

  function to_normal(stream, state) {
    var token = null;

    if (stream.sol() && stream.match(rx_examples, false)) {
      change(state, to_mode, {
        mode: mode_python, local: CodeMirror.startState(mode_python)
      });
    } else if (stream.sol() && stream.match(rx_explicit)) {
      change(state, to_explicit);
      token = 'meta';
    } else if (stream.sol() && stream.match(rx_section)) {
      change(state, to_normal);
      token = 'header';
    } else if (phase(state) == rx_role_pre ||
               stream.match(rx_role_pre, false)) {

      switch (stage(state)) {
      case 0:
        change(state, to_normal, context(rx_role_pre, 1));
        stream.match(/^:/);
        token = 'meta';
        break;
      case 1:
        change(state, to_normal, context(rx_role_pre, 2));
        stream.match(rx_NAME);
        token = 'keyword';

        if (stream.current().match(/^(?:math|latex)/)) {
          state.tmp_stex = true;
        }
        break;
      case 2:
        change(state, to_normal, context(rx_role_pre, 3));
        stream.match(/^:`/);
        token = 'meta';
        break;
      case 3:
        if (state.tmp_stex) {
          state.tmp_stex = undefined; state.tmp = {
            mode: mode_stex, local: CodeMirror.startState(mode_stex)
          };
        }

        if (state.tmp) {
          if (stream.peek() == '`') {
            change(state, to_normal, context(rx_role_pre, 4));
            state.tmp = undefined;
            break;
          }

          token = state.tmp.mode.token(stream, state.tmp.local);
          break;
        }

        change(state, to_normal, context(rx_role_pre, 4));
        stream.match(rx_TEXT2);
        token = 'string';
        break;
      case 4:
        change(state, to_normal, context(rx_role_pre, 5));
        stream.match(/^`/);
        token = 'meta';
        break;
      case 5:
        change(state, to_normal, context(rx_role_pre, 6));
        stream.match(rx_TAIL);
        break;
      default:
        change(state, to_normal);
      }
    } else if (phase(state) == rx_role_suf ||
               stream.match(rx_role_suf, false)) {

      switch (stage(state)) {
      case 0:
        change(state, to_normal, context(rx_role_suf, 1));
        stream.match(/^`/);
        token = 'meta';
        break;
      case 1:
        change(state, to_normal, context(rx_role_suf, 2));
        stream.match(rx_TEXT2);
        token = 'string';
        break;
      case 2:
        change(state, to_normal, context(rx_role_suf, 3));
        stream.match(/^`:/);
        token = 'meta';
        break;
      case 3:
        change(state, to_normal, context(rx_role_suf, 4));
        stream.match(rx_NAME);
        token = 'keyword';
        break;
      case 4:
        change(state, to_normal, context(rx_role_suf, 5));
        stream.match(/^:/);
        token = 'meta';
        break;
      case 5:
        change(state, to_normal, context(rx_role_suf, 6));
        stream.match(rx_TAIL);
        break;
      default:
        change(state, to_normal);
      }
    } else if (phase(state) == rx_role || stream.match(rx_role, false)) {

      switch (stage(state)) {
      case 0:
        change(state, to_normal, context(rx_role, 1));
        stream.match(/^:/);
        token = 'meta';
        break;
      case 1:
        change(state, to_normal, context(rx_role, 2));
        stream.match(rx_NAME);
        token = 'keyword';
        break;
      case 2:
        change(state, to_normal, context(rx_role, 3));
        stream.match(/^:/);
        token = 'meta';
        break;
      case 3:
        change(state, to_normal, context(rx_role, 4));
        stream.match(rx_TAIL);
        break;
      default:
        change(state, to_normal);
      }
    } else if (phase(state) == rx_substitution_ref ||
               stream.match(rx_substitution_ref, false)) {

      switch (stage(state)) {
      case 0:
        change(state, to_normal, context(rx_substitution_ref, 1));
        stream.match(rx_substitution_text);
        token = 'variable-2';
        break;
      case 1:
        change(state, to_normal, context(rx_substitution_ref, 2));
        if (stream.match(/^_?_?/)) token = 'link';
        break;
      default:
        change(state, to_normal);
      }
    } else if (stream.match(rx_footnote_ref)) {
      change(state, to_normal);
      token = 'quote';
    } else if (stream.match(rx_citation_ref)) {
      change(state, to_normal);
      token = 'quote';
    } else if (stream.match(rx_link_ref1)) {
      change(state, to_normal);
      if (!stream.peek() || stream.peek().match(/^\W$/)) {
        token = 'link';
      }
    } else if (phase(state) == rx_link_ref2 ||
               stream.match(rx_link_ref2, false)) {

      switch (stage(state)) {
      case 0:
        if (!stream.peek() || stream.peek().match(/^\W$/)) {
          change(state, to_normal, context(rx_link_ref2, 1));
        } else {
          stream.match(rx_link_ref2);
        }
        break;
      case 1:
        change(state, to_normal, context(rx_link_ref2, 2));
        stream.match(/^`/);
        token = 'link';
        break;
      case 2:
        change(state, to_normal, context(rx_link_ref2, 3));
        stream.match(rx_TEXT2);
        break;
      case 3:
        change(state, to_normal, context(rx_link_ref2, 4));
        stream.match(/^`_/);
        token = 'link';
        break;
      default:
        change(state, to_normal);
      }
    } else if (stream.match(rx_verbatim)) {
      change(state, to_verbatim);
    }

    else {
      if (stream.next()) change(state, to_normal);
    }

    return token;
  }

  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////

  function to_explicit(stream, state) {
    var token = null;

    if (phase(state) == rx_substitution ||
        stream.match(rx_substitution, false)) {

      switch (stage(state)) {
      case 0:
        change(state, to_explicit, context(rx_substitution, 1));
        stream.match(rx_substitution_text);
        token = 'variable-2';
        break;
      case 1:
        change(state, to_explicit, context(rx_substitution, 2));
        stream.match(rx_substitution_sepa);
        break;
      case 2:
        change(state, to_explicit, context(rx_substitution, 3));
        stream.match(rx_substitution_name);
        token = 'keyword';
        break;
      case 3:
        change(state, to_explicit, context(rx_substitution, 4));
        stream.match(rx_substitution_tail);
        token = 'meta';
        break;
      default:
        change(state, to_normal);
      }
    } else if (phase(state) == rx_directive ||
               stream.match(rx_directive, false)) {

      switch (stage(state)) {
      case 0:
        change(state, to_explicit, context(rx_directive, 1));
        stream.match(rx_directive_name);
        token = 'keyword';

        if (stream.current().match(/^(?:math|latex)/))
          state.tmp_stex = true;
        else if (stream.current().match(/^python/))
          state.tmp_py = true;
        break;
      case 1:
        change(state, to_explicit, context(rx_directive, 2));
        stream.match(rx_directive_tail);
        token = 'meta';

        if (stream.match(/^latex\s*$/) || state.tmp_stex) {
          state.tmp_stex = undefined; change(state, to_mode, {
            mode: mode_stex, local: CodeMirror.startState(mode_stex)
          });
        }
        break;
      case 2:
        change(state, to_explicit, context(rx_directive, 3));
        if (stream.match(/^python\s*$/) || state.tmp_py) {
          state.tmp_py = undefined; change(state, to_mode, {
            mode: mode_python, local: CodeMirror.startState(mode_python)
          });
        }
        break;
      default:
        change(state, to_normal);
      }
    } else if (phase(state) == rx_link || stream.match(rx_link, false)) {

      switch (stage(state)) {
      case 0:
        change(state, to_explicit, context(rx_link, 1));
        stream.match(rx_link_head);
        stream.match(rx_link_name);
        token = 'link';
        break;
      case 1:
        change(state, to_explicit, context(rx_link, 2));
        stream.match(rx_link_tail);
        token = 'meta';
        break;
      default:
        change(state, to_normal);
      }
    } else if (stream.match(rx_footnote)) {
      change(state, to_normal);
      token = 'quote';
    } else if (stream.match(rx_citation)) {
      change(state, to_normal);
      token = 'quote';
    }

    else {
      stream.eatSpace();
      if (stream.eol()) {
        change(state, to_normal);
      } else {
        stream.skipToEnd();
        change(state, to_comment);
        token = 'comment';
      }
    }

    return token;
  }

  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////

  function to_comment(stream, state) {
    return as_block(stream, state, 'comment');
  }

  function to_verbatim(stream, state) {
    return as_block(stream, state, 'meta');
  }

  function as_block(stream, state, token) {
    if (stream.eol() || stream.eatSpace()) {
      stream.skipToEnd();
      return token;
    } else {
      change(state, to_normal);
      return null;
    }
  }

  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////

  function to_mode(stream, state) {

    if (state.ctx.mode && state.ctx.local) {

      if (stream.sol()) {
        if (!stream.eatSpace()) change(state, to_normal);
        return null;
      }

      return state.ctx.mode.token(stream, state.ctx.local);
    }

    change(state, to_normal);
    return null;
  }

  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////

  function context(phase, stage, mode, local) {
    return {phase: phase, stage: stage, mode: mode, local: local};
  }

  function change(state, tok, ctx) {
    state.tok = tok;
    state.ctx = ctx || {};
  }

  function stage(state) {
    return state.ctx.stage || 0;
  }

  function phase(state) {
    return state.ctx.phase;
  }

  ///////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////

  return {
    startState: function () {
      return {tok: to_normal, ctx: context(undefined, 0)};
    },

    copyState: function (state) {
      var ctx = state.ctx, tmp = state.tmp;
      if (ctx.local)
        ctx = {mode: ctx.mode, local: CodeMirror.copyState(ctx.mode, ctx.local)};
      if (tmp)
        tmp = {mode: tmp.mode, local: CodeMirror.copyState(tmp.mode, tmp.local)};
      return {tok: state.tok, ctx: ctx, tmp: tmp};
    },

    innerMode: function (state) {
      return state.tmp      ? {state: state.tmp.local, mode: state.tmp.mode}
      : state.ctx.mode ? {state: state.ctx.local, mode: state.ctx.mode}
      : null;
    },

    token: function (stream, state) {
      return state.tok(stream, state);
    }
  };
}, 'python', 'stex');

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

CodeMirror.defineMIME('text/x-rst', 'rst');

///////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////

});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/ruby/ruby.js":
/*!**********************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/ruby/ruby.js ***!
  \**********************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"));
  else {}
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode("ruby", function(config) {
  function wordObj(words) {
    var o = {};
    for (var i = 0, e = words.length; i < e; ++i) o[words[i]] = true;
    return o;
  }
  var keywords = wordObj([
    "alias", "and", "BEGIN", "begin", "break", "case", "class", "def", "defined?", "do", "else",
    "elsif", "END", "end", "ensure", "false", "for", "if", "in", "module", "next", "not", "or",
    "redo", "rescue", "retry", "return", "self", "super", "then", "true", "undef", "unless",
    "until", "when", "while", "yield", "nil", "raise", "throw", "catch", "fail", "loop", "callcc",
    "caller", "lambda", "proc", "public", "protected", "private", "require", "load",
    "require_relative", "extend", "autoload", "__END__", "__FILE__", "__LINE__", "__dir__"
  ]);
  var indentWords = wordObj(["def", "class", "case", "for", "while", "until", "module", "then",
                             "catch", "loop", "proc", "begin"]);
  var dedentWords = wordObj(["end", "until"]);
  var matching = {"[": "]", "{": "}", "(": ")"};
  var curPunc;

  function chain(newtok, stream, state) {
    state.tokenize.push(newtok);
    return newtok(stream, state);
  }

  function tokenBase(stream, state) {
    if (stream.sol() && stream.match("=begin") && stream.eol()) {
      state.tokenize.push(readBlockComment);
      return "comment";
    }
    if (stream.eatSpace()) return null;
    var ch = stream.next(), m;
    if (ch == "`" || ch == "'" || ch == '"') {
      return chain(readQuoted(ch, "string", ch == '"' || ch == "`"), stream, state);
    } else if (ch == "/") {
      if (regexpAhead(stream))
        return chain(readQuoted(ch, "string-2", true), stream, state);
      else
        return "operator";
    } else if (ch == "%") {
      var style = "string", embed = true;
      if (stream.eat("s")) style = "atom";
      else if (stream.eat(/[WQ]/)) style = "string";
      else if (stream.eat(/[r]/)) style = "string-2";
      else if (stream.eat(/[wxq]/)) { style = "string"; embed = false; }
      var delim = stream.eat(/[^\w\s=]/);
      if (!delim) return "operator";
      if (matching.propertyIsEnumerable(delim)) delim = matching[delim];
      return chain(readQuoted(delim, style, embed, true), stream, state);
    } else if (ch == "#") {
      stream.skipToEnd();
      return "comment";
    } else if (ch == "<" && (m = stream.match(/^<-?[\`\"\']?([a-zA-Z_?]\w*)[\`\"\']?(?:;|$)/))) {
      return chain(readHereDoc(m[1]), stream, state);
    } else if (ch == "0") {
      if (stream.eat("x")) stream.eatWhile(/[\da-fA-F]/);
      else if (stream.eat("b")) stream.eatWhile(/[01]/);
      else stream.eatWhile(/[0-7]/);
      return "number";
    } else if (/\d/.test(ch)) {
      stream.match(/^[\d_]*(?:\.[\d_]+)?(?:[eE][+\-]?[\d_]+)?/);
      return "number";
    } else if (ch == "?") {
      while (stream.match(/^\\[CM]-/)) {}
      if (stream.eat("\\")) stream.eatWhile(/\w/);
      else stream.next();
      return "string";
    } else if (ch == ":") {
      if (stream.eat("'")) return chain(readQuoted("'", "atom", false), stream, state);
      if (stream.eat('"')) return chain(readQuoted('"', "atom", true), stream, state);

      // :> :>> :< :<< are valid symbols
      if (stream.eat(/[\<\>]/)) {
        stream.eat(/[\<\>]/);
        return "atom";
      }

      // :+ :- :/ :* :| :& :! are valid symbols
      if (stream.eat(/[\+\-\*\/\&\|\:\!]/)) {
        return "atom";
      }

      // Symbols can't start by a digit
      if (stream.eat(/[a-zA-Z$@_\xa1-\uffff]/)) {
        stream.eatWhile(/[\w$\xa1-\uffff]/);
        // Only one ? ! = is allowed and only as the last character
        stream.eat(/[\?\!\=]/);
        return "atom";
      }
      return "operator";
    } else if (ch == "@" && stream.match(/^@?[a-zA-Z_\xa1-\uffff]/)) {
      stream.eat("@");
      stream.eatWhile(/[\w\xa1-\uffff]/);
      return "variable-2";
    } else if (ch == "$") {
      if (stream.eat(/[a-zA-Z_]/)) {
        stream.eatWhile(/[\w]/);
      } else if (stream.eat(/\d/)) {
        stream.eat(/\d/);
      } else {
        stream.next(); // Must be a special global like $: or $!
      }
      return "variable-3";
    } else if (/[a-zA-Z_\xa1-\uffff]/.test(ch)) {
      stream.eatWhile(/[\w\xa1-\uffff]/);
      stream.eat(/[\?\!]/);
      if (stream.eat(":")) return "atom";
      return "ident";
    } else if (ch == "|" && (state.varList || state.lastTok == "{" || state.lastTok == "do")) {
      curPunc = "|";
      return null;
    } else if (/[\(\)\[\]{}\\;]/.test(ch)) {
      curPunc = ch;
      return null;
    } else if (ch == "-" && stream.eat(">")) {
      return "arrow";
    } else if (/[=+\-\/*:\.^%<>~|]/.test(ch)) {
      var more = stream.eatWhile(/[=+\-\/*:\.^%<>~|]/);
      if (ch == "." && !more) curPunc = ".";
      return "operator";
    } else {
      return null;
    }
  }

  function regexpAhead(stream) {
    var start = stream.pos, depth = 0, next, found = false, escaped = false
    while ((next = stream.next()) != null) {
      if (!escaped) {
        if ("[{(".indexOf(next) > -1) {
          depth++
        } else if ("]})".indexOf(next) > -1) {
          depth--
          if (depth < 0) break
        } else if (next == "/" && depth == 0) {
          found = true
          break
        }
        escaped = next == "\\"
      } else {
        escaped = false
      }
    }
    stream.backUp(stream.pos - start)
    return found
  }

  function tokenBaseUntilBrace(depth) {
    if (!depth) depth = 1;
    return function(stream, state) {
      if (stream.peek() == "}") {
        if (depth == 1) {
          state.tokenize.pop();
          return state.tokenize[state.tokenize.length-1](stream, state);
        } else {
          state.tokenize[state.tokenize.length - 1] = tokenBaseUntilBrace(depth - 1);
        }
      } else if (stream.peek() == "{") {
        state.tokenize[state.tokenize.length - 1] = tokenBaseUntilBrace(depth + 1);
      }
      return tokenBase(stream, state);
    };
  }
  function tokenBaseOnce() {
    var alreadyCalled = false;
    return function(stream, state) {
      if (alreadyCalled) {
        state.tokenize.pop();
        return state.tokenize[state.tokenize.length-1](stream, state);
      }
      alreadyCalled = true;
      return tokenBase(stream, state);
    };
  }
  function readQuoted(quote, style, embed, unescaped) {
    return function(stream, state) {
      var escaped = false, ch;

      if (state.context.type === 'read-quoted-paused') {
        state.context = state.context.prev;
        stream.eat("}");
      }

      while ((ch = stream.next()) != null) {
        if (ch == quote && (unescaped || !escaped)) {
          state.tokenize.pop();
          break;
        }
        if (embed && ch == "#" && !escaped) {
          if (stream.eat("{")) {
            if (quote == "}") {
              state.context = {prev: state.context, type: 'read-quoted-paused'};
            }
            state.tokenize.push(tokenBaseUntilBrace());
            break;
          } else if (/[@\$]/.test(stream.peek())) {
            state.tokenize.push(tokenBaseOnce());
            break;
          }
        }
        escaped = !escaped && ch == "\\";
      }
      return style;
    };
  }
  function readHereDoc(phrase) {
    return function(stream, state) {
      if (stream.match(phrase)) state.tokenize.pop();
      else stream.skipToEnd();
      return "string";
    };
  }
  function readBlockComment(stream, state) {
    if (stream.sol() && stream.match("=end") && stream.eol())
      state.tokenize.pop();
    stream.skipToEnd();
    return "comment";
  }

  return {
    startState: function() {
      return {tokenize: [tokenBase],
              indented: 0,
              context: {type: "top", indented: -config.indentUnit},
              continuedLine: false,
              lastTok: null,
              varList: false};
    },

    token: function(stream, state) {
      curPunc = null;
      if (stream.sol()) state.indented = stream.indentation();
      var style = state.tokenize[state.tokenize.length-1](stream, state), kwtype;
      var thisTok = curPunc;
      if (style == "ident") {
        var word = stream.current();
        style = state.lastTok == "." ? "property"
          : keywords.propertyIsEnumerable(stream.current()) ? "keyword"
          : /^[A-Z]/.test(word) ? "tag"
          : (state.lastTok == "def" || state.lastTok == "class" || state.varList) ? "def"
          : "variable";
        if (style == "keyword") {
          thisTok = word;
          if (indentWords.propertyIsEnumerable(word)) kwtype = "indent";
          else if (dedentWords.propertyIsEnumerable(word)) kwtype = "dedent";
          else if ((word == "if" || word == "unless") && stream.column() == stream.indentation())
            kwtype = "indent";
          else if (word == "do" && state.context.indented < state.indented)
            kwtype = "indent";
        }
      }
      if (curPunc || (style && style != "comment")) state.lastTok = thisTok;
      if (curPunc == "|") state.varList = !state.varList;

      if (kwtype == "indent" || /[\(\[\{]/.test(curPunc))
        state.context = {prev: state.context, type: curPunc || style, indented: state.indented};
      else if ((kwtype == "dedent" || /[\)\]\}]/.test(curPunc)) && state.context.prev)
        state.context = state.context.prev;

      if (stream.eol())
        state.continuedLine = (curPunc == "\\" || style == "operator");
      return style;
    },

    indent: function(state, textAfter) {
      if (state.tokenize[state.tokenize.length-1] != tokenBase) return 0;
      var firstChar = textAfter && textAfter.charAt(0);
      var ct = state.context;
      var closing = ct.type == matching[firstChar] ||
        ct.type == "keyword" && /^(?:end|until|else|elsif|when|rescue)\b/.test(textAfter);
      return ct.indented + (closing ? 0 : config.indentUnit) +
        (state.continuedLine ? config.indentUnit : 0);
    },

    electricInput: /^\s*(?:end|rescue|elsif|else|\})$/,
    lineComment: "#",
    fold: "indent"
  };
});

CodeMirror.defineMIME("text/x-ruby", "ruby");

});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/rust/rust.js":
/*!**********************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/rust/rust.js ***!
  \**********************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"), __webpack_require__(/*! ../../addon/mode/simple */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/addon/mode/simple.js"));
  else {}
})(function(CodeMirror) {
"use strict";

CodeMirror.defineSimpleMode("rust",{
  start: [
    // string and byte string
    {regex: /b?"/, token: "string", next: "string"},
    // raw string and raw byte string
    {regex: /b?r"/, token: "string", next: "string_raw"},
    {regex: /b?r#+"/, token: "string", next: "string_raw_hash"},
    // character
    {regex: /'(?:[^'\\]|\\(?:[nrt0'"]|x[\da-fA-F]{2}|u\{[\da-fA-F]{6}\}))'/, token: "string-2"},
    // byte
    {regex: /b'(?:[^']|\\(?:['\\nrt0]|x[\da-fA-F]{2}))'/, token: "string-2"},

    {regex: /(?:(?:[0-9][0-9_]*)(?:(?:[Ee][+-]?[0-9_]+)|\.[0-9_]+(?:[Ee][+-]?[0-9_]+)?)(?:f32|f64)?)|(?:0(?:b[01_]+|(?:o[0-7_]+)|(?:x[0-9a-fA-F_]+))|(?:[0-9][0-9_]*))(?:u8|u16|u32|u64|i8|i16|i32|i64|isize|usize)?/,
     token: "number"},
    {regex: /(let(?:\s+mut)?|fn|enum|mod|struct|type)(\s+)([a-zA-Z_][a-zA-Z0-9_]*)/, token: ["keyword", null, "def"]},
    {regex: /(?:abstract|alignof|as|box|break|continue|const|crate|do|else|enum|extern|fn|for|final|if|impl|in|loop|macro|match|mod|move|offsetof|override|priv|proc|pub|pure|ref|return|self|sizeof|static|struct|super|trait|type|typeof|unsafe|unsized|use|virtual|where|while|yield)\b/, token: "keyword"},
    {regex: /\b(?:Self|isize|usize|char|bool|u8|u16|u32|u64|f16|f32|f64|i8|i16|i32|i64|str|Option)\b/, token: "atom"},
    {regex: /\b(?:true|false|Some|None|Ok|Err)\b/, token: "builtin"},
    {regex: /\b(fn)(\s+)([a-zA-Z_][a-zA-Z0-9_]*)/,
     token: ["keyword", null ,"def"]},
    {regex: /#!?\[.*\]/, token: "meta"},
    {regex: /\/\/.*/, token: "comment"},
    {regex: /\/\*/, token: "comment", next: "comment"},
    {regex: /[-+\/*=<>!]+/, token: "operator"},
    {regex: /[a-zA-Z_]\w*!/,token: "variable-3"},
    {regex: /[a-zA-Z_]\w*/, token: "variable"},
    {regex: /[\{\[\(]/, indent: true},
    {regex: /[\}\]\)]/, dedent: true}
  ],
  string: [
    {regex: /"/, token: "string", next: "start"},
    {regex: /(?:[^\\"]|\\(?:.|$))*/, token: "string"}
  ],
  string_raw: [
    {regex: /"/, token: "string", next: "start"},
    {regex: /[^"]*/, token: "string"}
  ],
  string_raw_hash: [
    {regex: /"#+/, token: "string", next: "start"},
    {regex: /(?:[^"]|"(?!#))*/, token: "string"}
  ],
  comment: [
    {regex: /.*?\*\//, token: "comment", next: "start"},
    {regex: /.*/, token: "comment"}
  ],
  meta: {
    dontIndentStates: ["comment"],
    electricInput: /^\s*\}$/,
    blockCommentStart: "/*",
    blockCommentEnd: "*/",
    lineComment: "//",
    fold: "brace"
  }
});


CodeMirror.defineMIME("text/x-rustsrc", "rust");
CodeMirror.defineMIME("text/rust", "rust");
});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/sas/sas.js":
/*!********************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/sas/sas.js ***!
  \********************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE


// SAS mode copyright (c) 2016 Jared Dean, SAS Institute
// Created by Jared Dean

// TODO
// indent and de-indent
// identify macro variables


//Definitions
//  comment -- text within * ; or /* */
//  keyword -- SAS language variable
//  variable -- macro variables starts with '&' or variable formats
//  variable-2 -- DATA Step, proc, or macro names
//  string -- text within ' ' or " "
//  operator -- numeric operator + / - * ** le eq ge ... and so on
//  builtin -- proc %macro data run mend
//  atom
//  def

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"));
  else {}
})(function(CodeMirror) {
  "use strict";

  CodeMirror.defineMode("sas", function () {
    var words = {};
    var isDoubleOperatorSym = {
      eq: 'operator',
      lt: 'operator',
      le: 'operator',
      gt: 'operator',
      ge: 'operator',
      "in": 'operator',
      ne: 'operator',
      or: 'operator'
    };
    var isDoubleOperatorChar = /(<=|>=|!=|<>)/;
    var isSingleOperatorChar = /[=\(:\),{}.*<>+\-\/^\[\]]/;

    // Takes a string of words separated by spaces and adds them as
    // keys with the value of the first argument 'style'
    function define(style, string, context) {
      if (context) {
        var split = string.split(' ');
        for (var i = 0; i < split.length; i++) {
          words[split[i]] = {style: style, state: context};
        }
      }
    }
    //datastep
    define('def', 'stack pgm view source debug nesting nolist', ['inDataStep']);
    define('def', 'if while until for do do; end end; then else cancel', ['inDataStep']);
    define('def', 'label format _n_ _error_', ['inDataStep']);
    define('def', 'ALTER BUFNO BUFSIZE CNTLLEV COMPRESS DLDMGACTION ENCRYPT ENCRYPTKEY EXTENDOBSCOUNTER GENMAX GENNUM INDEX LABEL OBSBUF OUTREP PW PWREQ READ REPEMPTY REPLACE REUSE ROLE SORTEDBY SPILL TOBSNO TYPE WRITE FILECLOSE FIRSTOBS IN OBS POINTOBS WHERE WHEREUP IDXNAME IDXWHERE DROP KEEP RENAME', ['inDataStep']);
    define('def', 'filevar finfo finv fipname fipnamel fipstate first firstobs floor', ['inDataStep']);
    define('def', 'varfmt varinfmt varlabel varlen varname varnum varray varrayx vartype verify vformat vformatd vformatdx vformatn vformatnx vformatw vformatwx vformatx vinarray vinarrayx vinformat vinformatd vinformatdx vinformatn vinformatnx vinformatw vinformatwx vinformatx vlabel vlabelx vlength vlengthx vname vnamex vnferr vtype vtypex weekday', ['inDataStep']);
    define('def', 'zipfips zipname zipnamel zipstate', ['inDataStep']);
    define('def', 'put putc putn', ['inDataStep']);
    define('builtin', 'data run', ['inDataStep']);


    //proc
    define('def', 'data', ['inProc']);

    // flow control for macros
    define('def', '%if %end %end; %else %else; %do %do; %then', ['inMacro']);

    //everywhere
    define('builtin', 'proc run; quit; libname filename %macro %mend option options', ['ALL']);

    define('def', 'footnote title libname ods', ['ALL']);
    define('def', '%let %put %global %sysfunc %eval ', ['ALL']);
    // automatic macro variables http://support.sas.com/documentation/cdl/en/mcrolref/61885/HTML/default/viewer.htm#a003167023.htm
    define('variable', '&sysbuffr &syscc &syscharwidth &syscmd &sysdate &sysdate9 &sysday &sysdevic &sysdmg &sysdsn &sysencoding &sysenv &syserr &syserrortext &sysfilrc &syshostname &sysindex &sysinfo &sysjobid &syslast &syslckrc &syslibrc &syslogapplname &sysmacroname &sysmenv &sysmsg &sysncpu &sysodspath &sysparm &syspbuff &sysprocessid &sysprocessname &sysprocname &sysrc &sysscp &sysscpl &sysscpl &syssite &sysstartid &sysstartname &systcpiphostname &systime &sysuserid &sysver &sysvlong &sysvlong4 &syswarningtext', ['ALL']);

    //footnote[1-9]? title[1-9]?

    //options statement
    define('def', 'source2 nosource2 page pageno pagesize', ['ALL']);

    //proc and datastep
    define('def', '_all_ _character_ _cmd_ _freq_ _i_ _infile_ _last_ _msg_ _null_ _numeric_ _temporary_ _type_ abort abs addr adjrsq airy alpha alter altlog altprint and arcos array arsin as atan attrc attrib attrn authserver autoexec awscontrol awsdef awsmenu awsmenumerge awstitle backward band base betainv between blocksize blshift bnot bor brshift bufno bufsize bxor by byerr byline byte calculated call cards cards4 catcache cbufno cdf ceil center cexist change chisq cinv class cleanup close cnonct cntllev coalesce codegen col collate collin column comamid comaux1 comaux2 comdef compbl compound compress config continue convert cos cosh cpuid create cross crosstab css curobs cv daccdb daccdbsl daccsl daccsyd dacctab dairy datalines datalines4 datejul datepart datetime day dbcslang dbcstype dclose ddm delete delimiter depdb depdbsl depsl depsyd deptab dequote descending descript design= device dflang dhms dif digamma dim dinfo display distinct dkricond dkrocond dlm dnum do dopen doptname doptnum dread drop dropnote dsname dsnferr echo else emaildlg emailid emailpw emailserver emailsys encrypt end endsas engine eof eov erf erfc error errorcheck errors exist exp fappend fclose fcol fdelete feedback fetch fetchobs fexist fget file fileclose fileexist filefmt filename fileref  fmterr fmtsearch fnonct fnote font fontalias  fopen foptname foptnum force formatted formchar formdelim formdlim forward fpoint fpos fput fread frewind frlen from fsep fuzz fwrite gaminv gamma getoption getvarc getvarn go goto group gwindow hbar hbound helpenv helploc hms honorappearance hosthelp hostprint hour hpct html hvar ibessel ibr id if index indexc indexw initcmd initstmt inner input inputc inputn inr insert int intck intnx into intrr invaliddata irr is jbessel join juldate keep kentb kurtosis label lag last lbound leave left length levels lgamma lib  library libref line linesize link list log log10 log2 logpdf logpmf logsdf lostcard lowcase lrecl ls macro macrogen maps mautosource max maxdec maxr mdy mean measures median memtype merge merror min minute missing missover mlogic mod mode model modify month mopen mort mprint mrecall msglevel msymtabmax mvarsize myy n nest netpv new news nmiss no nobatch nobs nocaps nocardimage nocenter nocharcode nocmdmac nocol nocum nodate nodbcs nodetails nodmr nodms nodmsbatch nodup nodupkey noduplicates noechoauto noequals noerrorabend noexitwindows nofullstimer noicon noimplmac noint nolist noloadlist nomiss nomlogic nomprint nomrecall nomsgcase nomstored nomultenvappl nonotes nonumber noobs noovp nopad nopercent noprint noprintinit normal norow norsasuser nosetinit  nosplash nosymbolgen note notes notitle notitles notsorted noverbose noxsync noxwait npv null number numkeys nummousekeys nway obs  on open     order ordinal otherwise out outer outp= output over ovp p(1 5 10 25 50 75 90 95 99) pad pad2  paired parm parmcards path pathdll pathname pdf peek peekc pfkey pmf point poisson poke position printer probbeta probbnml probchi probf probgam probhypr probit probnegb probnorm probsig probt procleave prt ps  pw pwreq qtr quote r ranbin rancau ranexp rangam range ranks rannor ranpoi rantbl rantri ranuni read recfm register regr remote remove rename repeat replace resolve retain return reuse reverse rewind right round rsquare rtf rtrace rtraceloc s s2 samploc sasautos sascontrol sasfrscr sasmsg sasmstore sasscript sasuser saving scan sdf second select selection separated seq serror set setcomm setot sign simple sin sinh siteinfo skewness skip sle sls sortedby sortpgm sortseq sortsize soundex  spedis splashlocation split spool sqrt start std stderr stdin stfips stimer stname stnamel stop stopover subgroup subpopn substr sum sumwgt symbol symbolgen symget symput sysget sysin sysleave sysmsg sysparm sysprint sysprintfont sysprod sysrc system t table tables tan tanh tapeclose tbufsize terminal test then timepart tinv  tnonct to today tol tooldef totper transformout translate trantab tranwrd trigamma trim trimn trunc truncover type unformatted uniform union until upcase update user usericon uss validate value var  weight when where while wincharset window work workinit workterm write wsum xsync xwait yearcutoff yes yyq  min max', ['inDataStep', 'inProc']);
    define('operator', 'and not ', ['inDataStep', 'inProc']);

    // Main function
    function tokenize(stream, state) {
      // Finally advance the stream
      var ch = stream.next();

      // BLOCKCOMMENT
      if (ch === '/' && stream.eat('*')) {
        state.continueComment = true;
        return "comment";
      } else if (state.continueComment === true) { // in comment block
        //comment ends at the beginning of the line
        if (ch === '*' && stream.peek() === '/') {
          stream.next();
          state.continueComment = false;
        } else if (stream.skipTo('*')) { //comment is potentially later in line
          stream.skipTo('*');
          stream.next();
          if (stream.eat('/'))
            state.continueComment = false;
        } else {
          stream.skipToEnd();
        }
        return "comment";
      }

      if (ch == "*" && stream.column() == stream.indentation()) {
        stream.skipToEnd()
        return "comment"
      }

      // DoubleOperator match
      var doubleOperator = ch + stream.peek();

      if ((ch === '"' || ch === "'") && !state.continueString) {
        state.continueString = ch
        return "string"
      } else if (state.continueString) {
        if (state.continueString == ch) {
          state.continueString = null;
        } else if (stream.skipTo(state.continueString)) {
          // quote found on this line
          stream.next();
          state.continueString = null;
        } else {
          stream.skipToEnd();
        }
        return "string";
      } else if (state.continueString !== null && stream.eol()) {
        stream.skipTo(state.continueString) || stream.skipToEnd();
        return "string";
      } else if (/[\d\.]/.test(ch)) { //find numbers
        if (ch === ".")
          stream.match(/^[0-9]+([eE][\-+]?[0-9]+)?/);
        else if (ch === "0")
          stream.match(/^[xX][0-9a-fA-F]+/) || stream.match(/^0[0-7]+/);
        else
          stream.match(/^[0-9]*\.?[0-9]*([eE][\-+]?[0-9]+)?/);
        return "number";
      } else if (isDoubleOperatorChar.test(ch + stream.peek())) { // TWO SYMBOL TOKENS
        stream.next();
        return "operator";
      } else if (isDoubleOperatorSym.hasOwnProperty(doubleOperator)) {
        stream.next();
        if (stream.peek() === ' ')
          return isDoubleOperatorSym[doubleOperator.toLowerCase()];
      } else if (isSingleOperatorChar.test(ch)) { // SINGLE SYMBOL TOKENS
        return "operator";
      }

      // Matches one whole word -- even if the word is a character
      var word;
      if (stream.match(/[%&;\w]+/, false) != null) {
        word = ch + stream.match(/[%&;\w]+/, true);
        if (/&/.test(word)) return 'variable'
      } else {
        word = ch;
      }
      // the word after DATA PROC or MACRO
      if (state.nextword) {
        stream.match(/[\w]+/);
        // match memname.libname
        if (stream.peek() === '.') stream.skipTo(' ');
        state.nextword = false;
        return 'variable-2';
      }

      word = word.toLowerCase()
      // Are we in a DATA Step?
      if (state.inDataStep) {
        if (word === 'run;' || stream.match(/run\s;/)) {
          state.inDataStep = false;
          return 'builtin';
        }
        // variable formats
        if ((word) && stream.next() === '.') {
          //either a format or libname.memname
          if (/\w/.test(stream.peek())) return 'variable-2';
          else return 'variable';
        }
        // do we have a DATA Step keyword
        if (word && words.hasOwnProperty(word) &&
            (words[word].state.indexOf("inDataStep") !== -1 ||
             words[word].state.indexOf("ALL") !== -1)) {
          //backup to the start of the word
          if (stream.start < stream.pos)
            stream.backUp(stream.pos - stream.start);
          //advance the length of the word and return
          for (var i = 0; i < word.length; ++i) stream.next();
          return words[word].style;
        }
      }
      // Are we in an Proc statement?
      if (state.inProc) {
        if (word === 'run;' || word === 'quit;') {
          state.inProc = false;
          return 'builtin';
        }
        // do we have a proc keyword
        if (word && words.hasOwnProperty(word) &&
            (words[word].state.indexOf("inProc") !== -1 ||
             words[word].state.indexOf("ALL") !== -1)) {
          stream.match(/[\w]+/);
          return words[word].style;
        }
      }
      // Are we in a Macro statement?
      if (state.inMacro) {
        if (word === '%mend') {
          if (stream.peek() === ';') stream.next();
          state.inMacro = false;
          return 'builtin';
        }
        if (word && words.hasOwnProperty(word) &&
            (words[word].state.indexOf("inMacro") !== -1 ||
             words[word].state.indexOf("ALL") !== -1)) {
          stream.match(/[\w]+/);
          return words[word].style;
        }

        return 'atom';
      }
      // Do we have Keywords specific words?
      if (word && words.hasOwnProperty(word)) {
        // Negates the initial next()
        stream.backUp(1);
        // Actually move the stream
        stream.match(/[\w]+/);
        if (word === 'data' && /=/.test(stream.peek()) === false) {
          state.inDataStep = true;
          state.nextword = true;
          return 'builtin';
        }
        if (word === 'proc') {
          state.inProc = true;
          state.nextword = true;
          return 'builtin';
        }
        if (word === '%macro') {
          state.inMacro = true;
          state.nextword = true;
          return 'builtin';
        }
        if (/title[1-9]/.test(word)) return 'def';

        if (word === 'footnote') {
          stream.eat(/[1-9]/);
          return 'def';
        }

        // Returns their value as state in the prior define methods
        if (state.inDataStep === true && words[word].state.indexOf("inDataStep") !== -1)
          return words[word].style;
        if (state.inProc === true && words[word].state.indexOf("inProc") !== -1)
          return words[word].style;
        if (state.inMacro === true && words[word].state.indexOf("inMacro") !== -1)
          return words[word].style;
        if (words[word].state.indexOf("ALL") !== -1)
          return words[word].style;
        return null;
      }
      // Unrecognized syntax
      return null;
    }

    return {
      startState: function () {
        return {
          inDataStep: false,
          inProc: false,
          inMacro: false,
          nextword: false,
          continueString: null,
          continueComment: false
        };
      },
      token: function (stream, state) {
        // Strip the spaces, but regex will account for them either way
        if (stream.eatSpace()) return null;
        // Go through the main process
        return tokenize(stream, state);
      },

      blockCommentStart: "/*",
      blockCommentEnd: "*/"
    };

  });

  CodeMirror.defineMIME("text/x-sas", "sas");
});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/sass/sass.js":
/*!**********************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/sass/sass.js ***!
  \**********************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"), __webpack_require__(/*! ../css/css */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/css/css.js"));
  else {}
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode("sass", function(config) {
  var cssMode = CodeMirror.mimeModes["text/css"];
  var propertyKeywords = cssMode.propertyKeywords || {},
      colorKeywords = cssMode.colorKeywords || {},
      valueKeywords = cssMode.valueKeywords || {},
      fontProperties = cssMode.fontProperties || {};

  function tokenRegexp(words) {
    return new RegExp("^" + words.join("|"));
  }

  var keywords = ["true", "false", "null", "auto"];
  var keywordsRegexp = new RegExp("^" + keywords.join("|"));

  var operators = ["\\(", "\\)", "=", ">", "<", "==", ">=", "<=", "\\+", "-",
                   "\\!=", "/", "\\*", "%", "and", "or", "not", ";","\\{","\\}",":"];
  var opRegexp = tokenRegexp(operators);

  var pseudoElementsRegexp = /^::?[a-zA-Z_][\w\-]*/;

  var word;

  function isEndLine(stream) {
    return !stream.peek() || stream.match(/\s+$/, false);
  }

  function urlTokens(stream, state) {
    var ch = stream.peek();

    if (ch === ")") {
      stream.next();
      state.tokenizer = tokenBase;
      return "operator";
    } else if (ch === "(") {
      stream.next();
      stream.eatSpace();

      return "operator";
    } else if (ch === "'" || ch === '"') {
      state.tokenizer = buildStringTokenizer(stream.next());
      return "string";
    } else {
      state.tokenizer = buildStringTokenizer(")", false);
      return "string";
    }
  }
  function comment(indentation, multiLine) {
    return function(stream, state) {
      if (stream.sol() && stream.indentation() <= indentation) {
        state.tokenizer = tokenBase;
        return tokenBase(stream, state);
      }

      if (multiLine && stream.skipTo("*/")) {
        stream.next();
        stream.next();
        state.tokenizer = tokenBase;
      } else {
        stream.skipToEnd();
      }

      return "comment";
    };
  }

  function buildStringTokenizer(quote, greedy) {
    if (greedy == null) { greedy = true; }

    function stringTokenizer(stream, state) {
      var nextChar = stream.next();
      var peekChar = stream.peek();
      var previousChar = stream.string.charAt(stream.pos-2);

      var endingString = ((nextChar !== "\\" && peekChar === quote) || (nextChar === quote && previousChar !== "\\"));

      if (endingString) {
        if (nextChar !== quote && greedy) { stream.next(); }
        if (isEndLine(stream)) {
          state.cursorHalf = 0;
        }
        state.tokenizer = tokenBase;
        return "string";
      } else if (nextChar === "#" && peekChar === "{") {
        state.tokenizer = buildInterpolationTokenizer(stringTokenizer);
        stream.next();
        return "operator";
      } else {
        return "string";
      }
    }

    return stringTokenizer;
  }

  function buildInterpolationTokenizer(currentTokenizer) {
    return function(stream, state) {
      if (stream.peek() === "}") {
        stream.next();
        state.tokenizer = currentTokenizer;
        return "operator";
      } else {
        return tokenBase(stream, state);
      }
    };
  }

  function indent(state) {
    if (state.indentCount == 0) {
      state.indentCount++;
      var lastScopeOffset = state.scopes[0].offset;
      var currentOffset = lastScopeOffset + config.indentUnit;
      state.scopes.unshift({ offset:currentOffset });
    }
  }

  function dedent(state) {
    if (state.scopes.length == 1) return;

    state.scopes.shift();
  }

  function tokenBase(stream, state) {
    var ch = stream.peek();

    // Comment
    if (stream.match("/*")) {
      state.tokenizer = comment(stream.indentation(), true);
      return state.tokenizer(stream, state);
    }
    if (stream.match("//")) {
      state.tokenizer = comment(stream.indentation(), false);
      return state.tokenizer(stream, state);
    }

    // Interpolation
    if (stream.match("#{")) {
      state.tokenizer = buildInterpolationTokenizer(tokenBase);
      return "operator";
    }

    // Strings
    if (ch === '"' || ch === "'") {
      stream.next();
      state.tokenizer = buildStringTokenizer(ch);
      return "string";
    }

    if(!state.cursorHalf){// state.cursorHalf === 0
    // first half i.e. before : for key-value pairs
    // including selectors

      if (ch === "-") {
        if (stream.match(/^-\w+-/)) {
          return "meta";
        }
      }

      if (ch === ".") {
        stream.next();
        if (stream.match(/^[\w-]+/)) {
          indent(state);
          return "qualifier";
        } else if (stream.peek() === "#") {
          indent(state);
          return "tag";
        }
      }

      if (ch === "#") {
        stream.next();
        // ID selectors
        if (stream.match(/^[\w-]+/)) {
          indent(state);
          return "builtin";
        }
        if (stream.peek() === "#") {
          indent(state);
          return "tag";
        }
      }

      // Variables
      if (ch === "$") {
        stream.next();
        stream.eatWhile(/[\w-]/);
        return "variable-2";
      }

      // Numbers
      if (stream.match(/^-?[0-9\.]+/))
        return "number";

      // Units
      if (stream.match(/^(px|em|in)\b/))
        return "unit";

      if (stream.match(keywordsRegexp))
        return "keyword";

      if (stream.match(/^url/) && stream.peek() === "(") {
        state.tokenizer = urlTokens;
        return "atom";
      }

      if (ch === "=") {
        // Match shortcut mixin definition
        if (stream.match(/^=[\w-]+/)) {
          indent(state);
          return "meta";
        }
      }

      if (ch === "+") {
        // Match shortcut mixin definition
        if (stream.match(/^\+[\w-]+/)){
          return "variable-3";
        }
      }

      if(ch === "@"){
        if(stream.match(/@extend/)){
          if(!stream.match(/\s*[\w]/))
            dedent(state);
        }
      }


      // Indent Directives
      if (stream.match(/^@(else if|if|media|else|for|each|while|mixin|function)/)) {
        indent(state);
        return "def";
      }

      // Other Directives
      if (ch === "@") {
        stream.next();
        stream.eatWhile(/[\w-]/);
        return "def";
      }

      if (stream.eatWhile(/[\w-]/)){
        if(stream.match(/ *: *[\w-\+\$#!\("']/,false)){
          word = stream.current().toLowerCase();
          var prop = state.prevProp + "-" + word;
          if (propertyKeywords.hasOwnProperty(prop)) {
            return "property";
          } else if (propertyKeywords.hasOwnProperty(word)) {
            state.prevProp = word;
            return "property";
          } else if (fontProperties.hasOwnProperty(word)) {
            return "property";
          }
          return "tag";
        }
        else if(stream.match(/ *:/,false)){
          indent(state);
          state.cursorHalf = 1;
          state.prevProp = stream.current().toLowerCase();
          return "property";
        }
        else if(stream.match(/ *,/,false)){
          return "tag";
        }
        else{
          indent(state);
          return "tag";
        }
      }

      if(ch === ":"){
        if (stream.match(pseudoElementsRegexp)){ // could be a pseudo-element
          return "variable-3";
        }
        stream.next();
        state.cursorHalf=1;
        return "operator";
      }

    } // cursorHalf===0 ends here
    else{

      if (ch === "#") {
        stream.next();
        // Hex numbers
        if (stream.match(/[0-9a-fA-F]{6}|[0-9a-fA-F]{3}/)){
          if (isEndLine(stream)) {
            state.cursorHalf = 0;
          }
          return "number";
        }
      }

      // Numbers
      if (stream.match(/^-?[0-9\.]+/)){
        if (isEndLine(stream)) {
          state.cursorHalf = 0;
        }
        return "number";
      }

      // Units
      if (stream.match(/^(px|em|in)\b/)){
        if (isEndLine(stream)) {
          state.cursorHalf = 0;
        }
        return "unit";
      }

      if (stream.match(keywordsRegexp)){
        if (isEndLine(stream)) {
          state.cursorHalf = 0;
        }
        return "keyword";
      }

      if (stream.match(/^url/) && stream.peek() === "(") {
        state.tokenizer = urlTokens;
        if (isEndLine(stream)) {
          state.cursorHalf = 0;
        }
        return "atom";
      }

      // Variables
      if (ch === "$") {
        stream.next();
        stream.eatWhile(/[\w-]/);
        if (isEndLine(stream)) {
          state.cursorHalf = 0;
        }
        return "variable-2";
      }

      // bang character for !important, !default, etc.
      if (ch === "!") {
        stream.next();
        state.cursorHalf = 0;
        return stream.match(/^[\w]+/) ? "keyword": "operator";
      }

      if (stream.match(opRegexp)){
        if (isEndLine(stream)) {
          state.cursorHalf = 0;
        }
        return "operator";
      }

      // attributes
      if (stream.eatWhile(/[\w-]/)) {
        if (isEndLine(stream)) {
          state.cursorHalf = 0;
        }
        word = stream.current().toLowerCase();
        if (valueKeywords.hasOwnProperty(word)) {
          return "atom";
        } else if (colorKeywords.hasOwnProperty(word)) {
          return "keyword";
        } else if (propertyKeywords.hasOwnProperty(word)) {
          state.prevProp = stream.current().toLowerCase();
          return "property";
        } else {
          return "tag";
        }
      }

      //stream.eatSpace();
      if (isEndLine(stream)) {
        state.cursorHalf = 0;
        return null;
      }

    } // else ends here

    if (stream.match(opRegexp))
      return "operator";

    // If we haven't returned by now, we move 1 character
    // and return an error
    stream.next();
    return null;
  }

  function tokenLexer(stream, state) {
    if (stream.sol()) state.indentCount = 0;
    var style = state.tokenizer(stream, state);
    var current = stream.current();

    if (current === "@return" || current === "}"){
      dedent(state);
    }

    if (style !== null) {
      var startOfToken = stream.pos - current.length;

      var withCurrentIndent = startOfToken + (config.indentUnit * state.indentCount);

      var newScopes = [];

      for (var i = 0; i < state.scopes.length; i++) {
        var scope = state.scopes[i];

        if (scope.offset <= withCurrentIndent)
          newScopes.push(scope);
      }

      state.scopes = newScopes;
    }


    return style;
  }

  return {
    startState: function() {
      return {
        tokenizer: tokenBase,
        scopes: [{offset: 0, type: "sass"}],
        indentCount: 0,
        cursorHalf: 0,  // cursor half tells us if cursor lies after (1)
                        // or before (0) colon (well... more or less)
        definedVars: [],
        definedMixins: []
      };
    },
    token: function(stream, state) {
      var style = tokenLexer(stream, state);

      state.lastToken = { style: style, content: stream.current() };

      return style;
    },

    indent: function(state) {
      return state.scopes[0].offset;
    }
  };
}, "css");

CodeMirror.defineMIME("text/x-sass", "sass");

});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/scheme/scheme.js":
/*!**************************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/scheme/scheme.js ***!
  \**************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

/**
 * Author: Koh Zi Han, based on implementation by Koh Zi Chun
 */

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"));
  else {}
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode("scheme", function () {
    var BUILTIN = "builtin", COMMENT = "comment", STRING = "string",
        ATOM = "atom", NUMBER = "number", BRACKET = "bracket";
    var INDENT_WORD_SKIP = 2;

    function makeKeywords(str) {
        var obj = {}, words = str.split(" ");
        for (var i = 0; i < words.length; ++i) obj[words[i]] = true;
        return obj;
    }

    var keywords = makeKeywords("λ case-lambda call/cc class define-class exit-handler field import inherit init-field interface let*-values let-values let/ec mixin opt-lambda override protect provide public rename require require-for-syntax syntax syntax-case syntax-error unit/sig unless when with-syntax and begin call-with-current-continuation call-with-input-file call-with-output-file case cond define define-syntax delay do dynamic-wind else for-each if lambda let let* let-syntax letrec letrec-syntax map or syntax-rules abs acos angle append apply asin assoc assq assv atan boolean? caar cadr call-with-input-file call-with-output-file call-with-values car cdddar cddddr cdr ceiling char->integer char-alphabetic? char-ci<=? char-ci<? char-ci=? char-ci>=? char-ci>? char-downcase char-lower-case? char-numeric? char-ready? char-upcase char-upper-case? char-whitespace? char<=? char<? char=? char>=? char>? char? close-input-port close-output-port complex? cons cos current-input-port current-output-port denominator display eof-object? eq? equal? eqv? eval even? exact->inexact exact? exp expt #f floor force gcd imag-part inexact->exact inexact? input-port? integer->char integer? interaction-environment lcm length list list->string list->vector list-ref list-tail list? load log magnitude make-polar make-rectangular make-string make-vector max member memq memv min modulo negative? newline not null-environment null? number->string number? numerator odd? open-input-file open-output-file output-port? pair? peek-char port? positive? procedure? quasiquote quote quotient rational? rationalize read read-char real-part real? remainder reverse round scheme-report-environment set! set-car! set-cdr! sin sqrt string string->list string->number string->symbol string-append string-ci<=? string-ci<? string-ci=? string-ci>=? string-ci>? string-copy string-fill! string-length string-ref string-set! string<=? string<? string=? string>=? string>? string? substring symbol->string symbol? #t tan transcript-off transcript-on truncate values vector vector->list vector-fill! vector-length vector-ref vector-set! with-input-from-file with-output-to-file write write-char zero?");
    var indentKeys = makeKeywords("define let letrec let* lambda");

    function stateStack(indent, type, prev) { // represents a state stack object
        this.indent = indent;
        this.type = type;
        this.prev = prev;
    }

    function pushStack(state, indent, type) {
        state.indentStack = new stateStack(indent, type, state.indentStack);
    }

    function popStack(state) {
        state.indentStack = state.indentStack.prev;
    }

    var binaryMatcher = new RegExp(/^(?:[-+]i|[-+][01]+#*(?:\/[01]+#*)?i|[-+]?[01]+#*(?:\/[01]+#*)?@[-+]?[01]+#*(?:\/[01]+#*)?|[-+]?[01]+#*(?:\/[01]+#*)?[-+](?:[01]+#*(?:\/[01]+#*)?)?i|[-+]?[01]+#*(?:\/[01]+#*)?)(?=[()\s;"]|$)/i);
    var octalMatcher = new RegExp(/^(?:[-+]i|[-+][0-7]+#*(?:\/[0-7]+#*)?i|[-+]?[0-7]+#*(?:\/[0-7]+#*)?@[-+]?[0-7]+#*(?:\/[0-7]+#*)?|[-+]?[0-7]+#*(?:\/[0-7]+#*)?[-+](?:[0-7]+#*(?:\/[0-7]+#*)?)?i|[-+]?[0-7]+#*(?:\/[0-7]+#*)?)(?=[()\s;"]|$)/i);
    var hexMatcher = new RegExp(/^(?:[-+]i|[-+][\da-f]+#*(?:\/[\da-f]+#*)?i|[-+]?[\da-f]+#*(?:\/[\da-f]+#*)?@[-+]?[\da-f]+#*(?:\/[\da-f]+#*)?|[-+]?[\da-f]+#*(?:\/[\da-f]+#*)?[-+](?:[\da-f]+#*(?:\/[\da-f]+#*)?)?i|[-+]?[\da-f]+#*(?:\/[\da-f]+#*)?)(?=[()\s;"]|$)/i);
    var decimalMatcher = new RegExp(/^(?:[-+]i|[-+](?:(?:(?:\d+#+\.?#*|\d+\.\d*#*|\.\d+#*|\d+)(?:[esfdl][-+]?\d+)?)|\d+#*\/\d+#*)i|[-+]?(?:(?:(?:\d+#+\.?#*|\d+\.\d*#*|\.\d+#*|\d+)(?:[esfdl][-+]?\d+)?)|\d+#*\/\d+#*)@[-+]?(?:(?:(?:\d+#+\.?#*|\d+\.\d*#*|\.\d+#*|\d+)(?:[esfdl][-+]?\d+)?)|\d+#*\/\d+#*)|[-+]?(?:(?:(?:\d+#+\.?#*|\d+\.\d*#*|\.\d+#*|\d+)(?:[esfdl][-+]?\d+)?)|\d+#*\/\d+#*)[-+](?:(?:(?:\d+#+\.?#*|\d+\.\d*#*|\.\d+#*|\d+)(?:[esfdl][-+]?\d+)?)|\d+#*\/\d+#*)?i|(?:(?:(?:\d+#+\.?#*|\d+\.\d*#*|\.\d+#*|\d+)(?:[esfdl][-+]?\d+)?)|\d+#*\/\d+#*))(?=[()\s;"]|$)/i);

    function isBinaryNumber (stream) {
        return stream.match(binaryMatcher);
    }

    function isOctalNumber (stream) {
        return stream.match(octalMatcher);
    }

    function isDecimalNumber (stream, backup) {
        if (backup === true) {
            stream.backUp(1);
        }
        return stream.match(decimalMatcher);
    }

    function isHexNumber (stream) {
        return stream.match(hexMatcher);
    }

    return {
        startState: function () {
            return {
                indentStack: null,
                indentation: 0,
                mode: false,
                sExprComment: false,
                sExprQuote: false
            };
        },

        token: function (stream, state) {
            if (state.indentStack == null && stream.sol()) {
                // update indentation, but only if indentStack is empty
                state.indentation = stream.indentation();
            }

            // skip spaces
            if (stream.eatSpace()) {
                return null;
            }
            var returnType = null;

            switch(state.mode){
                case "string": // multi-line string parsing mode
                    var next, escaped = false;
                    while ((next = stream.next()) != null) {
                        if (next == "\"" && !escaped) {

                            state.mode = false;
                            break;
                        }
                        escaped = !escaped && next == "\\";
                    }
                    returnType = STRING; // continue on in scheme-string mode
                    break;
                case "comment": // comment parsing mode
                    var next, maybeEnd = false;
                    while ((next = stream.next()) != null) {
                        if (next == "#" && maybeEnd) {

                            state.mode = false;
                            break;
                        }
                        maybeEnd = (next == "|");
                    }
                    returnType = COMMENT;
                    break;
                case "s-expr-comment": // s-expr commenting mode
                    state.mode = false;
                    if(stream.peek() == "(" || stream.peek() == "["){
                        // actually start scheme s-expr commenting mode
                        state.sExprComment = 0;
                    }else{
                        // if not we just comment the entire of the next token
                        stream.eatWhile(/[^\s\(\)\[\]]/); // eat symbol atom
                        returnType = COMMENT;
                        break;
                    }
                default: // default parsing mode
                    var ch = stream.next();

                    if (ch == "\"") {
                        state.mode = "string";
                        returnType = STRING;

                    } else if (ch == "'") {
                        if (stream.peek() == "(" || stream.peek() == "["){
                            if (typeof state.sExprQuote != "number") {
                                state.sExprQuote = 0;
                            } // else already in a quoted expression
                            returnType = ATOM;
                        } else {
                            stream.eatWhile(/[\w_\-!$%&*+\.\/:<=>?@\^~]/);
                            returnType = ATOM;
                        }
                    } else if (ch == '#') {
                        if (stream.eat("|")) {                    // Multi-line comment
                            state.mode = "comment"; // toggle to comment mode
                            returnType = COMMENT;
                        } else if (stream.eat(/[tf]/i)) {            // #t/#f (atom)
                            returnType = ATOM;
                        } else if (stream.eat(';')) {                // S-Expr comment
                            state.mode = "s-expr-comment";
                            returnType = COMMENT;
                        } else {
                            var numTest = null, hasExactness = false, hasRadix = true;
                            if (stream.eat(/[ei]/i)) {
                                hasExactness = true;
                            } else {
                                stream.backUp(1);       // must be radix specifier
                            }
                            if (stream.match(/^#b/i)) {
                                numTest = isBinaryNumber;
                            } else if (stream.match(/^#o/i)) {
                                numTest = isOctalNumber;
                            } else if (stream.match(/^#x/i)) {
                                numTest = isHexNumber;
                            } else if (stream.match(/^#d/i)) {
                                numTest = isDecimalNumber;
                            } else if (stream.match(/^[-+0-9.]/, false)) {
                                hasRadix = false;
                                numTest = isDecimalNumber;
                            // re-consume the intial # if all matches failed
                            } else if (!hasExactness) {
                                stream.eat('#');
                            }
                            if (numTest != null) {
                                if (hasRadix && !hasExactness) {
                                    // consume optional exactness after radix
                                    stream.match(/^#[ei]/i);
                                }
                                if (numTest(stream))
                                    returnType = NUMBER;
                            }
                        }
                    } else if (/^[-+0-9.]/.test(ch) && isDecimalNumber(stream, true)) { // match non-prefixed number, must be decimal
                        returnType = NUMBER;
                    } else if (ch == ";") { // comment
                        stream.skipToEnd(); // rest of the line is a comment
                        returnType = COMMENT;
                    } else if (ch == "(" || ch == "[") {
                      var keyWord = ''; var indentTemp = stream.column(), letter;
                        /**
                        Either
                        (indent-word ..
                        (non-indent-word ..
                        (;something else, bracket, etc.
                        */

                        while ((letter = stream.eat(/[^\s\(\[\;\)\]]/)) != null) {
                            keyWord += letter;
                        }

                        if (keyWord.length > 0 && indentKeys.propertyIsEnumerable(keyWord)) { // indent-word

                            pushStack(state, indentTemp + INDENT_WORD_SKIP, ch);
                        } else { // non-indent word
                            // we continue eating the spaces
                            stream.eatSpace();
                            if (stream.eol() || stream.peek() == ";") {
                                // nothing significant after
                                // we restart indentation 1 space after
                                pushStack(state, indentTemp + 1, ch);
                            } else {
                                pushStack(state, indentTemp + stream.current().length, ch); // else we match
                            }
                        }
                        stream.backUp(stream.current().length - 1); // undo all the eating

                        if(typeof state.sExprComment == "number") state.sExprComment++;
                        if(typeof state.sExprQuote == "number") state.sExprQuote++;

                        returnType = BRACKET;
                    } else if (ch == ")" || ch == "]") {
                        returnType = BRACKET;
                        if (state.indentStack != null && state.indentStack.type == (ch == ")" ? "(" : "[")) {
                            popStack(state);

                            if(typeof state.sExprComment == "number"){
                                if(--state.sExprComment == 0){
                                    returnType = COMMENT; // final closing bracket
                                    state.sExprComment = false; // turn off s-expr commenting mode
                                }
                            }
                            if(typeof state.sExprQuote == "number"){
                                if(--state.sExprQuote == 0){
                                    returnType = ATOM; // final closing bracket
                                    state.sExprQuote = false; // turn off s-expr quote mode
                                }
                            }
                        }
                    } else {
                        stream.eatWhile(/[\w_\-!$%&*+\.\/:<=>?@\^~]/);

                        if (keywords && keywords.propertyIsEnumerable(stream.current())) {
                            returnType = BUILTIN;
                        } else returnType = "variable";
                    }
            }
            return (typeof state.sExprComment == "number") ? COMMENT : ((typeof state.sExprQuote == "number") ? ATOM : returnType);
        },

        indent: function (state) {
            if (state.indentStack == null) return state.indentation;
            return state.indentStack.indent;
        },

        closeBrackets: {pairs: "()[]{}\"\""},
        lineComment: ";;"
    };
});

CodeMirror.defineMIME("text/x-scheme", "scheme");

});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/sieve/sieve.js":
/*!************************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/sieve/sieve.js ***!
  \************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"));
  else {}
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode("sieve", function(config) {
  function words(str) {
    var obj = {}, words = str.split(" ");
    for (var i = 0; i < words.length; ++i) obj[words[i]] = true;
    return obj;
  }

  var keywords = words("if elsif else stop require");
  var atoms = words("true false not");
  var indentUnit = config.indentUnit;

  function tokenBase(stream, state) {

    var ch = stream.next();
    if (ch == "/" && stream.eat("*")) {
      state.tokenize = tokenCComment;
      return tokenCComment(stream, state);
    }

    if (ch === '#') {
      stream.skipToEnd();
      return "comment";
    }

    if (ch == "\"") {
      state.tokenize = tokenString(ch);
      return state.tokenize(stream, state);
    }

    if (ch == "(") {
      state._indent.push("(");
      // add virtual angel wings so that editor behaves...
      // ...more sane incase of broken brackets
      state._indent.push("{");
      return null;
    }

    if (ch === "{") {
      state._indent.push("{");
      return null;
    }

    if (ch == ")")  {
      state._indent.pop();
      state._indent.pop();
    }

    if (ch === "}") {
      state._indent.pop();
      return null;
    }

    if (ch == ",")
      return null;

    if (ch == ";")
      return null;


    if (/[{}\(\),;]/.test(ch))
      return null;

    // 1*DIGIT "K" / "M" / "G"
    if (/\d/.test(ch)) {
      stream.eatWhile(/[\d]/);
      stream.eat(/[KkMmGg]/);
      return "number";
    }

    // ":" (ALPHA / "_") *(ALPHA / DIGIT / "_")
    if (ch == ":") {
      stream.eatWhile(/[a-zA-Z_]/);
      stream.eatWhile(/[a-zA-Z0-9_]/);

      return "operator";
    }

    stream.eatWhile(/\w/);
    var cur = stream.current();

    // "text:" *(SP / HTAB) (hash-comment / CRLF)
    // *(multiline-literal / multiline-dotstart)
    // "." CRLF
    if ((cur == "text") && stream.eat(":"))
    {
      state.tokenize = tokenMultiLineString;
      return "string";
    }

    if (keywords.propertyIsEnumerable(cur))
      return "keyword";

    if (atoms.propertyIsEnumerable(cur))
      return "atom";

    return null;
  }

  function tokenMultiLineString(stream, state)
  {
    state._multiLineString = true;
    // the first line is special it may contain a comment
    if (!stream.sol()) {
      stream.eatSpace();

      if (stream.peek() == "#") {
        stream.skipToEnd();
        return "comment";
      }

      stream.skipToEnd();
      return "string";
    }

    if ((stream.next() == ".")  && (stream.eol()))
    {
      state._multiLineString = false;
      state.tokenize = tokenBase;
    }

    return "string";
  }

  function tokenCComment(stream, state) {
    var maybeEnd = false, ch;
    while ((ch = stream.next()) != null) {
      if (maybeEnd && ch == "/") {
        state.tokenize = tokenBase;
        break;
      }
      maybeEnd = (ch == "*");
    }
    return "comment";
  }

  function tokenString(quote) {
    return function(stream, state) {
      var escaped = false, ch;
      while ((ch = stream.next()) != null) {
        if (ch == quote && !escaped)
          break;
        escaped = !escaped && ch == "\\";
      }
      if (!escaped) state.tokenize = tokenBase;
      return "string";
    };
  }

  return {
    startState: function(base) {
      return {tokenize: tokenBase,
              baseIndent: base || 0,
              _indent: []};
    },

    token: function(stream, state) {
      if (stream.eatSpace())
        return null;

      return (state.tokenize || tokenBase)(stream, state);
    },

    indent: function(state, _textAfter) {
      var length = state._indent.length;
      if (_textAfter && (_textAfter[0] == "}"))
        length--;

      if (length <0)
        length = 0;

      return length * indentUnit;
    },

    electricChars: "}"
  };
});

CodeMirror.defineMIME("application/sieve", "sieve");

});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/slim/slim.js":
/*!**********************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/slim/slim.js ***!
  \**********************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

// Slim Highlighting for CodeMirror copyright (c) HicknHack Software Gmbh

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"), __webpack_require__(/*! ../htmlmixed/htmlmixed */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/htmlmixed/htmlmixed.js"), __webpack_require__(/*! ../ruby/ruby */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/ruby/ruby.js"));
  else {}
})(function(CodeMirror) {
"use strict";

  CodeMirror.defineMode("slim", function(config) {
    var htmlMode = CodeMirror.getMode(config, {name: "htmlmixed"});
    var rubyMode = CodeMirror.getMode(config, "ruby");
    var modes = { html: htmlMode, ruby: rubyMode };
    var embedded = {
      ruby: "ruby",
      javascript: "javascript",
      css: "text/css",
      sass: "text/x-sass",
      scss: "text/x-scss",
      less: "text/x-less",
      styl: "text/x-styl", // no highlighting so far
      coffee: "coffeescript",
      asciidoc: "text/x-asciidoc",
      markdown: "text/x-markdown",
      textile: "text/x-textile", // no highlighting so far
      creole: "text/x-creole", // no highlighting so far
      wiki: "text/x-wiki", // no highlighting so far
      mediawiki: "text/x-mediawiki", // no highlighting so far
      rdoc: "text/x-rdoc", // no highlighting so far
      builder: "text/x-builder", // no highlighting so far
      nokogiri: "text/x-nokogiri", // no highlighting so far
      erb: "application/x-erb"
    };
    var embeddedRegexp = function(map){
      var arr = [];
      for(var key in map) arr.push(key);
      return new RegExp("^("+arr.join('|')+"):");
    }(embedded);

    var styleMap = {
      "commentLine": "comment",
      "slimSwitch": "operator special",
      "slimTag": "tag",
      "slimId": "attribute def",
      "slimClass": "attribute qualifier",
      "slimAttribute": "attribute",
      "slimSubmode": "keyword special",
      "closeAttributeTag": null,
      "slimDoctype": null,
      "lineContinuation": null
    };
    var closing = {
      "{": "}",
      "[": "]",
      "(": ")"
    };

    var nameStartChar = "_a-zA-Z\xC0-\xD6\xD8-\xF6\xF8-\u02FF\u0370-\u037D\u037F-\u1FFF\u200C-\u200D\u2070-\u218F\u2C00-\u2FEF\u3001-\uD7FF\uF900-\uFDCF\uFDF0-\uFFFD";
    var nameChar = nameStartChar + "\\-0-9\xB7\u0300-\u036F\u203F-\u2040";
    var nameRegexp = new RegExp("^[:"+nameStartChar+"](?::["+nameChar+"]|["+nameChar+"]*)");
    var attributeNameRegexp = new RegExp("^[:"+nameStartChar+"][:\\."+nameChar+"]*(?=\\s*=)");
    var wrappedAttributeNameRegexp = new RegExp("^[:"+nameStartChar+"][:\\."+nameChar+"]*");
    var classNameRegexp = /^\.-?[_a-zA-Z]+[\w\-]*/;
    var classIdRegexp = /^#[_a-zA-Z]+[\w\-]*/;

    function backup(pos, tokenize, style) {
      var restore = function(stream, state) {
        state.tokenize = tokenize;
        if (stream.pos < pos) {
          stream.pos = pos;
          return style;
        }
        return state.tokenize(stream, state);
      };
      return function(stream, state) {
        state.tokenize = restore;
        return tokenize(stream, state);
      };
    }

    function maybeBackup(stream, state, pat, offset, style) {
      var cur = stream.current();
      var idx = cur.search(pat);
      if (idx > -1) {
        state.tokenize = backup(stream.pos, state.tokenize, style);
        stream.backUp(cur.length - idx - offset);
      }
      return style;
    }

    function continueLine(state, column) {
      state.stack = {
        parent: state.stack,
        style: "continuation",
        indented: column,
        tokenize: state.line
      };
      state.line = state.tokenize;
    }
    function finishContinue(state) {
      if (state.line == state.tokenize) {
        state.line = state.stack.tokenize;
        state.stack = state.stack.parent;
      }
    }

    function lineContinuable(column, tokenize) {
      return function(stream, state) {
        finishContinue(state);
        if (stream.match(/^\\$/)) {
          continueLine(state, column);
          return "lineContinuation";
        }
        var style = tokenize(stream, state);
        if (stream.eol() && stream.current().match(/(?:^|[^\\])(?:\\\\)*\\$/)) {
          stream.backUp(1);
        }
        return style;
      };
    }
    function commaContinuable(column, tokenize) {
      return function(stream, state) {
        finishContinue(state);
        var style = tokenize(stream, state);
        if (stream.eol() && stream.current().match(/,$/)) {
          continueLine(state, column);
        }
        return style;
      };
    }

    function rubyInQuote(endQuote, tokenize) {
      // TODO: add multi line support
      return function(stream, state) {
        var ch = stream.peek();
        if (ch == endQuote && state.rubyState.tokenize.length == 1) {
          // step out of ruby context as it seems to complete processing all the braces
          stream.next();
          state.tokenize = tokenize;
          return "closeAttributeTag";
        } else {
          return ruby(stream, state);
        }
      };
    }
    function startRubySplat(tokenize) {
      var rubyState;
      var runSplat = function(stream, state) {
        if (state.rubyState.tokenize.length == 1 && !state.rubyState.context.prev) {
          stream.backUp(1);
          if (stream.eatSpace()) {
            state.rubyState = rubyState;
            state.tokenize = tokenize;
            return tokenize(stream, state);
          }
          stream.next();
        }
        return ruby(stream, state);
      };
      return function(stream, state) {
        rubyState = state.rubyState;
        state.rubyState = CodeMirror.startState(rubyMode);
        state.tokenize = runSplat;
        return ruby(stream, state);
      };
    }

    function ruby(stream, state) {
      return rubyMode.token(stream, state.rubyState);
    }

    function htmlLine(stream, state) {
      if (stream.match(/^\\$/)) {
        return "lineContinuation";
      }
      return html(stream, state);
    }
    function html(stream, state) {
      if (stream.match(/^#\{/)) {
        state.tokenize = rubyInQuote("}", state.tokenize);
        return null;
      }
      return maybeBackup(stream, state, /[^\\]#\{/, 1, htmlMode.token(stream, state.htmlState));
    }

    function startHtmlLine(lastTokenize) {
      return function(stream, state) {
        var style = htmlLine(stream, state);
        if (stream.eol()) state.tokenize = lastTokenize;
        return style;
      };
    }

    function startHtmlMode(stream, state, offset) {
      state.stack = {
        parent: state.stack,
        style: "html",
        indented: stream.column() + offset, // pipe + space
        tokenize: state.line
      };
      state.line = state.tokenize = html;
      return null;
    }

    function comment(stream, state) {
      stream.skipToEnd();
      return state.stack.style;
    }

    function commentMode(stream, state) {
      state.stack = {
        parent: state.stack,
        style: "comment",
        indented: state.indented + 1,
        tokenize: state.line
      };
      state.line = comment;
      return comment(stream, state);
    }

    function attributeWrapper(stream, state) {
      if (stream.eat(state.stack.endQuote)) {
        state.line = state.stack.line;
        state.tokenize = state.stack.tokenize;
        state.stack = state.stack.parent;
        return null;
      }
      if (stream.match(wrappedAttributeNameRegexp)) {
        state.tokenize = attributeWrapperAssign;
        return "slimAttribute";
      }
      stream.next();
      return null;
    }
    function attributeWrapperAssign(stream, state) {
      if (stream.match(/^==?/)) {
        state.tokenize = attributeWrapperValue;
        return null;
      }
      return attributeWrapper(stream, state);
    }
    function attributeWrapperValue(stream, state) {
      var ch = stream.peek();
      if (ch == '"' || ch == "\'") {
        state.tokenize = readQuoted(ch, "string", true, false, attributeWrapper);
        stream.next();
        return state.tokenize(stream, state);
      }
      if (ch == '[') {
        return startRubySplat(attributeWrapper)(stream, state);
      }
      if (stream.match(/^(true|false|nil)\b/)) {
        state.tokenize = attributeWrapper;
        return "keyword";
      }
      return startRubySplat(attributeWrapper)(stream, state);
    }

    function startAttributeWrapperMode(state, endQuote, tokenize) {
      state.stack = {
        parent: state.stack,
        style: "wrapper",
        indented: state.indented + 1,
        tokenize: tokenize,
        line: state.line,
        endQuote: endQuote
      };
      state.line = state.tokenize = attributeWrapper;
      return null;
    }

    function sub(stream, state) {
      if (stream.match(/^#\{/)) {
        state.tokenize = rubyInQuote("}", state.tokenize);
        return null;
      }
      var subStream = new CodeMirror.StringStream(stream.string.slice(state.stack.indented), stream.tabSize);
      subStream.pos = stream.pos - state.stack.indented;
      subStream.start = stream.start - state.stack.indented;
      subStream.lastColumnPos = stream.lastColumnPos - state.stack.indented;
      subStream.lastColumnValue = stream.lastColumnValue - state.stack.indented;
      var style = state.subMode.token(subStream, state.subState);
      stream.pos = subStream.pos + state.stack.indented;
      return style;
    }
    function firstSub(stream, state) {
      state.stack.indented = stream.column();
      state.line = state.tokenize = sub;
      return state.tokenize(stream, state);
    }

    function createMode(mode) {
      var query = embedded[mode];
      var spec = CodeMirror.mimeModes[query];
      if (spec) {
        return CodeMirror.getMode(config, spec);
      }
      var factory = CodeMirror.modes[query];
      if (factory) {
        return factory(config, {name: query});
      }
      return CodeMirror.getMode(config, "null");
    }

    function getMode(mode) {
      if (!modes.hasOwnProperty(mode)) {
        return modes[mode] = createMode(mode);
      }
      return modes[mode];
    }

    function startSubMode(mode, state) {
      var subMode = getMode(mode);
      var subState = CodeMirror.startState(subMode);

      state.subMode = subMode;
      state.subState = subState;

      state.stack = {
        parent: state.stack,
        style: "sub",
        indented: state.indented + 1,
        tokenize: state.line
      };
      state.line = state.tokenize = firstSub;
      return "slimSubmode";
    }

    function doctypeLine(stream, _state) {
      stream.skipToEnd();
      return "slimDoctype";
    }

    function startLine(stream, state) {
      var ch = stream.peek();
      if (ch == '<') {
        return (state.tokenize = startHtmlLine(state.tokenize))(stream, state);
      }
      if (stream.match(/^[|']/)) {
        return startHtmlMode(stream, state, 1);
      }
      if (stream.match(/^\/(!|\[\w+])?/)) {
        return commentMode(stream, state);
      }
      if (stream.match(/^(-|==?[<>]?)/)) {
        state.tokenize = lineContinuable(stream.column(), commaContinuable(stream.column(), ruby));
        return "slimSwitch";
      }
      if (stream.match(/^doctype\b/)) {
        state.tokenize = doctypeLine;
        return "keyword";
      }

      var m = stream.match(embeddedRegexp);
      if (m) {
        return startSubMode(m[1], state);
      }

      return slimTag(stream, state);
    }

    function slim(stream, state) {
      if (state.startOfLine) {
        return startLine(stream, state);
      }
      return slimTag(stream, state);
    }

    function slimTag(stream, state) {
      if (stream.eat('*')) {
        state.tokenize = startRubySplat(slimTagExtras);
        return null;
      }
      if (stream.match(nameRegexp)) {
        state.tokenize = slimTagExtras;
        return "slimTag";
      }
      return slimClass(stream, state);
    }
    function slimTagExtras(stream, state) {
      if (stream.match(/^(<>?|><?)/)) {
        state.tokenize = slimClass;
        return null;
      }
      return slimClass(stream, state);
    }
    function slimClass(stream, state) {
      if (stream.match(classIdRegexp)) {
        state.tokenize = slimClass;
        return "slimId";
      }
      if (stream.match(classNameRegexp)) {
        state.tokenize = slimClass;
        return "slimClass";
      }
      return slimAttribute(stream, state);
    }
    function slimAttribute(stream, state) {
      if (stream.match(/^([\[\{\(])/)) {
        return startAttributeWrapperMode(state, closing[RegExp.$1], slimAttribute);
      }
      if (stream.match(attributeNameRegexp)) {
        state.tokenize = slimAttributeAssign;
        return "slimAttribute";
      }
      if (stream.peek() == '*') {
        stream.next();
        state.tokenize = startRubySplat(slimContent);
        return null;
      }
      return slimContent(stream, state);
    }
    function slimAttributeAssign(stream, state) {
      if (stream.match(/^==?/)) {
        state.tokenize = slimAttributeValue;
        return null;
      }
      // should never happen, because of forward lookup
      return slimAttribute(stream, state);
    }

    function slimAttributeValue(stream, state) {
      var ch = stream.peek();
      if (ch == '"' || ch == "\'") {
        state.tokenize = readQuoted(ch, "string", true, false, slimAttribute);
        stream.next();
        return state.tokenize(stream, state);
      }
      if (ch == '[') {
        return startRubySplat(slimAttribute)(stream, state);
      }
      if (ch == ':') {
        return startRubySplat(slimAttributeSymbols)(stream, state);
      }
      if (stream.match(/^(true|false|nil)\b/)) {
        state.tokenize = slimAttribute;
        return "keyword";
      }
      return startRubySplat(slimAttribute)(stream, state);
    }
    function slimAttributeSymbols(stream, state) {
      stream.backUp(1);
      if (stream.match(/^[^\s],(?=:)/)) {
        state.tokenize = startRubySplat(slimAttributeSymbols);
        return null;
      }
      stream.next();
      return slimAttribute(stream, state);
    }
    function readQuoted(quote, style, embed, unescaped, nextTokenize) {
      return function(stream, state) {
        finishContinue(state);
        var fresh = stream.current().length == 0;
        if (stream.match(/^\\$/, fresh)) {
          if (!fresh) return style;
          continueLine(state, state.indented);
          return "lineContinuation";
        }
        if (stream.match(/^#\{/, fresh)) {
          if (!fresh) return style;
          state.tokenize = rubyInQuote("}", state.tokenize);
          return null;
        }
        var escaped = false, ch;
        while ((ch = stream.next()) != null) {
          if (ch == quote && (unescaped || !escaped)) {
            state.tokenize = nextTokenize;
            break;
          }
          if (embed && ch == "#" && !escaped) {
            if (stream.eat("{")) {
              stream.backUp(2);
              break;
            }
          }
          escaped = !escaped && ch == "\\";
        }
        if (stream.eol() && escaped) {
          stream.backUp(1);
        }
        return style;
      };
    }
    function slimContent(stream, state) {
      if (stream.match(/^==?/)) {
        state.tokenize = ruby;
        return "slimSwitch";
      }
      if (stream.match(/^\/$/)) { // tag close hint
        state.tokenize = slim;
        return null;
      }
      if (stream.match(/^:/)) { // inline tag
        state.tokenize = slimTag;
        return "slimSwitch";
      }
      startHtmlMode(stream, state, 0);
      return state.tokenize(stream, state);
    }

    var mode = {
      // default to html mode
      startState: function() {
        var htmlState = CodeMirror.startState(htmlMode);
        var rubyState = CodeMirror.startState(rubyMode);
        return {
          htmlState: htmlState,
          rubyState: rubyState,
          stack: null,
          last: null,
          tokenize: slim,
          line: slim,
          indented: 0
        };
      },

      copyState: function(state) {
        return {
          htmlState : CodeMirror.copyState(htmlMode, state.htmlState),
          rubyState: CodeMirror.copyState(rubyMode, state.rubyState),
          subMode: state.subMode,
          subState: state.subMode && CodeMirror.copyState(state.subMode, state.subState),
          stack: state.stack,
          last: state.last,
          tokenize: state.tokenize,
          line: state.line
        };
      },

      token: function(stream, state) {
        if (stream.sol()) {
          state.indented = stream.indentation();
          state.startOfLine = true;
          state.tokenize = state.line;
          while (state.stack && state.stack.indented > state.indented && state.last != "slimSubmode") {
            state.line = state.tokenize = state.stack.tokenize;
            state.stack = state.stack.parent;
            state.subMode = null;
            state.subState = null;
          }
        }
        if (stream.eatSpace()) return null;
        var style = state.tokenize(stream, state);
        state.startOfLine = false;
        if (style) state.last = style;
        return styleMap.hasOwnProperty(style) ? styleMap[style] : style;
      },

      blankLine: function(state) {
        if (state.subMode && state.subMode.blankLine) {
          return state.subMode.blankLine(state.subState);
        }
      },

      innerMode: function(state) {
        if (state.subMode) return {state: state.subState, mode: state.subMode};
        return {state: state, mode: mode};
      }

      //indent: function(state) {
      //  return state.indented;
      //}
    };
    return mode;
  }, "htmlmixed", "ruby");

  CodeMirror.defineMIME("text/x-slim", "slim");
  CodeMirror.defineMIME("application/x-slim", "slim");
});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/smalltalk/smalltalk.js":
/*!********************************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/smalltalk/smalltalk.js ***!
  \********************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"));
  else {}
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode('smalltalk', function(config) {

  var specialChars = /[+\-\/\\*~<>=@%|&?!.,:;^]/;
  var keywords = /true|false|nil|self|super|thisContext/;

  var Context = function(tokenizer, parent) {
    this.next = tokenizer;
    this.parent = parent;
  };

  var Token = function(name, context, eos) {
    this.name = name;
    this.context = context;
    this.eos = eos;
  };

  var State = function() {
    this.context = new Context(next, null);
    this.expectVariable = true;
    this.indentation = 0;
    this.userIndentationDelta = 0;
  };

  State.prototype.userIndent = function(indentation) {
    this.userIndentationDelta = indentation > 0 ? (indentation / config.indentUnit - this.indentation) : 0;
  };

  var next = function(stream, context, state) {
    var token = new Token(null, context, false);
    var aChar = stream.next();

    if (aChar === '"') {
      token = nextComment(stream, new Context(nextComment, context));

    } else if (aChar === '\'') {
      token = nextString(stream, new Context(nextString, context));

    } else if (aChar === '#') {
      if (stream.peek() === '\'') {
        stream.next();
        token = nextSymbol(stream, new Context(nextSymbol, context));
      } else {
        if (stream.eatWhile(/[^\s.{}\[\]()]/))
          token.name = 'string-2';
        else
          token.name = 'meta';
      }

    } else if (aChar === '$') {
      if (stream.next() === '<') {
        stream.eatWhile(/[^\s>]/);
        stream.next();
      }
      token.name = 'string-2';

    } else if (aChar === '|' && state.expectVariable) {
      token.context = new Context(nextTemporaries, context);

    } else if (/[\[\]{}()]/.test(aChar)) {
      token.name = 'bracket';
      token.eos = /[\[{(]/.test(aChar);

      if (aChar === '[') {
        state.indentation++;
      } else if (aChar === ']') {
        state.indentation = Math.max(0, state.indentation - 1);
      }

    } else if (specialChars.test(aChar)) {
      stream.eatWhile(specialChars);
      token.name = 'operator';
      token.eos = aChar !== ';'; // ; cascaded message expression

    } else if (/\d/.test(aChar)) {
      stream.eatWhile(/[\w\d]/);
      token.name = 'number';

    } else if (/[\w_]/.test(aChar)) {
      stream.eatWhile(/[\w\d_]/);
      token.name = state.expectVariable ? (keywords.test(stream.current()) ? 'keyword' : 'variable') : null;

    } else {
      token.eos = state.expectVariable;
    }

    return token;
  };

  var nextComment = function(stream, context) {
    stream.eatWhile(/[^"]/);
    return new Token('comment', stream.eat('"') ? context.parent : context, true);
  };

  var nextString = function(stream, context) {
    stream.eatWhile(/[^']/);
    return new Token('string', stream.eat('\'') ? context.parent : context, false);
  };

  var nextSymbol = function(stream, context) {
    stream.eatWhile(/[^']/);
    return new Token('string-2', stream.eat('\'') ? context.parent : context, false);
  };

  var nextTemporaries = function(stream, context) {
    var token = new Token(null, context, false);
    var aChar = stream.next();

    if (aChar === '|') {
      token.context = context.parent;
      token.eos = true;

    } else {
      stream.eatWhile(/[^|]/);
      token.name = 'variable';
    }

    return token;
  };

  return {
    startState: function() {
      return new State;
    },

    token: function(stream, state) {
      state.userIndent(stream.indentation());

      if (stream.eatSpace()) {
        return null;
      }

      var token = state.context.next(stream, state.context, state);
      state.context = token.context;
      state.expectVariable = token.eos;

      return token.name;
    },

    blankLine: function(state) {
      state.userIndent(0);
    },

    indent: function(state, textAfter) {
      var i = state.context.next === next && textAfter && textAfter.charAt(0) === ']' ? -1 : state.userIndentationDelta;
      return (state.indentation + i) * config.indentUnit;
    },

    electricChars: ']'
  };

});

CodeMirror.defineMIME('text/x-stsrc', {name: 'smalltalk'});

});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/smarty/smarty.js":
/*!**************************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/smarty/smarty.js ***!
  \**************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

/**
 * Smarty 2 and 3 mode.
 */

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"));
  else {}
})(function(CodeMirror) {
  "use strict";

  CodeMirror.defineMode("smarty", function(config, parserConf) {
    var rightDelimiter = parserConf.rightDelimiter || "}";
    var leftDelimiter = parserConf.leftDelimiter || "{";
    var version = parserConf.version || 2;
    var baseMode = CodeMirror.getMode(config, parserConf.baseMode || "null");

    var keyFunctions = ["debug", "extends", "function", "include", "literal"];
    var regs = {
      operatorChars: /[+\-*&%=<>!?]/,
      validIdentifier: /[a-zA-Z0-9_]/,
      stringChar: /['"]/
    };

    var last;
    function cont(style, lastType) {
      last = lastType;
      return style;
    }

    function chain(stream, state, parser) {
      state.tokenize = parser;
      return parser(stream, state);
    }

    // Smarty 3 allows { and } surrounded by whitespace to NOT slip into Smarty mode
    function doesNotCount(stream, pos) {
      if (pos == null) pos = stream.pos;
      return version === 3 && leftDelimiter == "{" &&
        (pos == stream.string.length || /\s/.test(stream.string.charAt(pos)));
    }

    function tokenTop(stream, state) {
      var string = stream.string;
      for (var scan = stream.pos;;) {
        var nextMatch = string.indexOf(leftDelimiter, scan);
        scan = nextMatch + leftDelimiter.length;
        if (nextMatch == -1 || !doesNotCount(stream, nextMatch + leftDelimiter.length)) break;
      }
      if (nextMatch == stream.pos) {
        stream.match(leftDelimiter);
        if (stream.eat("*")) {
          return chain(stream, state, tokenBlock("comment", "*" + rightDelimiter));
        } else {
          state.depth++;
          state.tokenize = tokenSmarty;
          last = "startTag";
          return "tag";
        }
      }

      if (nextMatch > -1) stream.string = string.slice(0, nextMatch);
      var token = baseMode.token(stream, state.base);
      if (nextMatch > -1) stream.string = string;
      return token;
    }

    // parsing Smarty content
    function tokenSmarty(stream, state) {
      if (stream.match(rightDelimiter, true)) {
        if (version === 3) {
          state.depth--;
          if (state.depth <= 0) {
            state.tokenize = tokenTop;
          }
        } else {
          state.tokenize = tokenTop;
        }
        return cont("tag", null);
      }

      if (stream.match(leftDelimiter, true)) {
        state.depth++;
        return cont("tag", "startTag");
      }

      var ch = stream.next();
      if (ch == "$") {
        stream.eatWhile(regs.validIdentifier);
        return cont("variable-2", "variable");
      } else if (ch == "|") {
        return cont("operator", "pipe");
      } else if (ch == ".") {
        return cont("operator", "property");
      } else if (regs.stringChar.test(ch)) {
        state.tokenize = tokenAttribute(ch);
        return cont("string", "string");
      } else if (regs.operatorChars.test(ch)) {
        stream.eatWhile(regs.operatorChars);
        return cont("operator", "operator");
      } else if (ch == "[" || ch == "]") {
        return cont("bracket", "bracket");
      } else if (ch == "(" || ch == ")") {
        return cont("bracket", "operator");
      } else if (/\d/.test(ch)) {
        stream.eatWhile(/\d/);
        return cont("number", "number");
      } else {

        if (state.last == "variable") {
          if (ch == "@") {
            stream.eatWhile(regs.validIdentifier);
            return cont("property", "property");
          } else if (ch == "|") {
            stream.eatWhile(regs.validIdentifier);
            return cont("qualifier", "modifier");
          }
        } else if (state.last == "pipe") {
          stream.eatWhile(regs.validIdentifier);
          return cont("qualifier", "modifier");
        } else if (state.last == "whitespace") {
          stream.eatWhile(regs.validIdentifier);
          return cont("attribute", "modifier");
        } if (state.last == "property") {
          stream.eatWhile(regs.validIdentifier);
          return cont("property", null);
        } else if (/\s/.test(ch)) {
          last = "whitespace";
          return null;
        }

        var str = "";
        if (ch != "/") {
          str += ch;
        }
        var c = null;
        while (c = stream.eat(regs.validIdentifier)) {
          str += c;
        }
        for (var i=0, j=keyFunctions.length; i<j; i++) {
          if (keyFunctions[i] == str) {
            return cont("keyword", "keyword");
          }
        }
        if (/\s/.test(ch)) {
          return null;
        }
        return cont("tag", "tag");
      }
    }

    function tokenAttribute(quote) {
      return function(stream, state) {
        var prevChar = null;
        var currChar = null;
        while (!stream.eol()) {
          currChar = stream.peek();
          if (stream.next() == quote && prevChar !== '\\') {
            state.tokenize = tokenSmarty;
            break;
          }
          prevChar = currChar;
        }
        return "string";
      };
    }

    function tokenBlock(style, terminator) {
      return function(stream, state) {
        while (!stream.eol()) {
          if (stream.match(terminator)) {
            state.tokenize = tokenTop;
            break;
          }
          stream.next();
        }
        return style;
      };
    }

    return {
      startState: function() {
        return {
          base: CodeMirror.startState(baseMode),
          tokenize: tokenTop,
          last: null,
          depth: 0
        };
      },
      copyState: function(state) {
        return {
          base: CodeMirror.copyState(baseMode, state.base),
          tokenize: state.tokenize,
          last: state.last,
          depth: state.depth
        };
      },
      innerMode: function(state) {
        if (state.tokenize == tokenTop)
          return {mode: baseMode, state: state.base};
      },
      token: function(stream, state) {
        var style = state.tokenize(stream, state);
        state.last = last;
        return style;
      },
      indent: function(state, text) {
        if (state.tokenize == tokenTop && baseMode.indent)
          return baseMode.indent(state.base, text);
        else
          return CodeMirror.Pass;
      },
      blockCommentStart: leftDelimiter + "*",
      blockCommentEnd: "*" + rightDelimiter
    };
  });

  CodeMirror.defineMIME("text/x-smarty", "smarty");
});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/solr/solr.js":
/*!**********************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/solr/solr.js ***!
  \**********************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"));
  else {}
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode("solr", function() {
  "use strict";

  var isStringChar = /[^\s\|\!\+\-\*\?\~\^\&\:\(\)\[\]\{\}\"\\]/;
  var isOperatorChar = /[\|\!\+\-\*\?\~\^\&]/;
  var isOperatorString = /^(OR|AND|NOT|TO)$/i;

  function isNumber(word) {
    return parseFloat(word).toString() === word;
  }

  function tokenString(quote) {
    return function(stream, state) {
      var escaped = false, next;
      while ((next = stream.next()) != null) {
        if (next == quote && !escaped) break;
        escaped = !escaped && next == "\\";
      }

      if (!escaped) state.tokenize = tokenBase;
      return "string";
    };
  }

  function tokenOperator(operator) {
    return function(stream, state) {
      var style = "operator";
      if (operator == "+")
        style += " positive";
      else if (operator == "-")
        style += " negative";
      else if (operator == "|")
        stream.eat(/\|/);
      else if (operator == "&")
        stream.eat(/\&/);
      else if (operator == "^")
        style += " boost";

      state.tokenize = tokenBase;
      return style;
    };
  }

  function tokenWord(ch) {
    return function(stream, state) {
      var word = ch;
      while ((ch = stream.peek()) && ch.match(isStringChar) != null) {
        word += stream.next();
      }

      state.tokenize = tokenBase;
      if (isOperatorString.test(word))
        return "operator";
      else if (isNumber(word))
        return "number";
      else if (stream.peek() == ":")
        return "field";
      else
        return "string";
    };
  }

  function tokenBase(stream, state) {
    var ch = stream.next();
    if (ch == '"')
      state.tokenize = tokenString(ch);
    else if (isOperatorChar.test(ch))
      state.tokenize = tokenOperator(ch);
    else if (isStringChar.test(ch))
      state.tokenize = tokenWord(ch);

    return (state.tokenize != tokenBase) ? state.tokenize(stream, state) : null;
  }

  return {
    startState: function() {
      return {
        tokenize: tokenBase
      };
    },

    token: function(stream, state) {
      if (stream.eatSpace()) return null;
      return state.tokenize(stream, state);
    }
  };
});

CodeMirror.defineMIME("text/x-solr", "solr");

});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/soy/soy.js":
/*!********************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/soy/soy.js ***!
  \********************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"), __webpack_require__(/*! ../htmlmixed/htmlmixed */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/htmlmixed/htmlmixed.js"));
  else {}
})(function(CodeMirror) {
  "use strict";

  var indentingTags = ["template", "literal", "msg", "fallbackmsg", "let", "if", "elseif",
                       "else", "switch", "case", "default", "foreach", "ifempty", "for",
                       "call", "param", "deltemplate", "delcall", "log"];

  CodeMirror.defineMode("soy", function(config) {
    var textMode = CodeMirror.getMode(config, "text/plain");
    var modes = {
      html: CodeMirror.getMode(config, {name: "text/html", multilineTagIndentFactor: 2, multilineTagIndentPastTag: false}),
      attributes: textMode,
      text: textMode,
      uri: textMode,
      trusted_resource_uri: textMode,
      css: CodeMirror.getMode(config, "text/css"),
      js: CodeMirror.getMode(config, {name: "text/javascript", statementIndent: 2 * config.indentUnit})
    };

    function last(array) {
      return array[array.length - 1];
    }

    function tokenUntil(stream, state, untilRegExp) {
      if (stream.sol()) {
        for (var indent = 0; indent < state.indent; indent++) {
          if (!stream.eat(/\s/)) break;
        }
        if (indent) return null;
      }
      var oldString = stream.string;
      var match = untilRegExp.exec(oldString.substr(stream.pos));
      if (match) {
        // We don't use backUp because it backs up just the position, not the state.
        // This uses an undocumented API.
        stream.string = oldString.substr(0, stream.pos + match.index);
      }
      var result = stream.hideFirstChars(state.indent, function() {
        var localState = last(state.localStates);
        return localState.mode.token(stream, localState.state);
      });
      stream.string = oldString;
      return result;
    }

    function contains(list, element) {
      while (list) {
        if (list.element === element) return true;
        list = list.next;
      }
      return false;
    }

    function prepend(list, element) {
      return {
        element: element,
        next: list
      };
    }

    // Reference a variable `name` in `list`.
    // Let `loose` be truthy to ignore missing identifiers.
    function ref(list, name, loose) {
      return contains(list, name) ? "variable-2" : (loose ? "variable" : "variable-2 error");
    }

    function popscope(state) {
      if (state.scopes) {
        state.variables = state.scopes.element;
        state.scopes = state.scopes.next;
      }
    }

    return {
      startState: function() {
        return {
          kind: [],
          kindTag: [],
          soyState: [],
          templates: null,
          variables: prepend(null, 'ij'),
          scopes: null,
          indent: 0,
          quoteKind: null,
          localStates: [{
            mode: modes.html,
            state: CodeMirror.startState(modes.html)
          }]
        };
      },

      copyState: function(state) {
        return {
          tag: state.tag, // Last seen Soy tag.
          kind: state.kind.concat([]), // Values of kind="" attributes.
          kindTag: state.kindTag.concat([]), // Opened tags with kind="" attributes.
          soyState: state.soyState.concat([]),
          templates: state.templates,
          variables: state.variables,
          scopes: state.scopes,
          indent: state.indent, // Indentation of the following line.
          quoteKind: state.quoteKind,
          localStates: state.localStates.map(function(localState) {
            return {
              mode: localState.mode,
              state: CodeMirror.copyState(localState.mode, localState.state)
            };
          })
        };
      },

      token: function(stream, state) {
        var match;

        switch (last(state.soyState)) {
          case "comment":
            if (stream.match(/^.*?\*\//)) {
              state.soyState.pop();
            } else {
              stream.skipToEnd();
            }
            if (!state.scopes) {
              var paramRe = /@param\??\s+(\S+)/g;
              var current = stream.current();
              for (var match; (match = paramRe.exec(current)); ) {
                state.variables = prepend(state.variables, match[1]);
              }
            }
            return "comment";

          case "string":
            var match = stream.match(/^.*?(["']|\\[\s\S])/);
            if (!match) {
              stream.skipToEnd();
            } else if (match[1] == state.quoteKind) {
              state.quoteKind = null;
              state.soyState.pop();
            }
            return "string";
        }

        if (!state.soyState.length || last(state.soyState) != "literal") {
          if (stream.match(/^\/\*/)) {
            state.soyState.push("comment");
            return "comment";
          } else if (stream.match(stream.sol() ? /^\s*\/\/.*/ : /^\s+\/\/.*/)) {
            return "comment";
          }
        }

        switch (last(state.soyState)) {
          case "templ-def":
            if (match = stream.match(/^\.?([\w]+(?!\.[\w]+)*)/)) {
              state.templates = prepend(state.templates, match[1]);
              state.scopes = prepend(state.scopes, state.variables);
              state.soyState.pop();
              return "def";
            }
            stream.next();
            return null;

          case "templ-ref":
            if (match = stream.match(/(\.?[a-zA-Z_][a-zA-Z_0-9]+)+/)) {
              state.soyState.pop();
              // If the first character is '.', it can only be a local template.
              if (match[0][0] == '.') {
                return "variable-2"
              }
              // Otherwise
              return "variable";
            }
            stream.next();
            return null;

          case "namespace-def":
            if (match = stream.match(/^\.?([\w\.]+)/)) {
              state.soyState.pop();
              return "variable";
            }
            stream.next();
            return null;

          case "param-def":
            if (match = stream.match(/^\w+/)) {
              state.variables = prepend(state.variables, match[0]);
              state.soyState.pop();
              state.soyState.push("param-type");
              return "def";
            }
            stream.next();
            return null;

          case "param-ref":
            if (match = stream.match(/^\w+/)) {
              state.soyState.pop();
              return "property";
            }
            stream.next();
            return null;

          case "param-type":
            if (stream.peek() == "}") {
              state.soyState.pop();
              return null;
            }
            if (stream.eatWhile(/^([\w]+|[?])/)) {
              return "type";
            }
            stream.next();
            return null;

          case "var-def":
            if (match = stream.match(/^\$([\w]+)/)) {
              state.variables = prepend(state.variables, match[1]);
              state.soyState.pop();
              return "def";
            }
            stream.next();
            return null;

          case "tag":
            if (stream.match(/^\/?}/)) {
              if (state.tag == "/template" || state.tag == "/deltemplate") {
                popscope(state);
                state.variables = prepend(null, 'ij');
                state.indent = 0;
              } else {
                if (state.tag == "/for" || state.tag == "/foreach") {
                  popscope(state);
                }
                state.indent -= config.indentUnit *
                    (stream.current() == "/}" || indentingTags.indexOf(state.tag) == -1 ? 2 : 1);
              }
              state.soyState.pop();
              return "keyword";
            } else if (stream.match(/^([\w?]+)(?==)/)) {
              if (stream.current() == "kind" && (match = stream.match(/^="([^"]+)/, false))) {
                var kind = match[1];
                state.kind.push(kind);
                state.kindTag.push(state.tag);
                var mode = modes[kind] || modes.html;
                var localState = last(state.localStates);
                if (localState.mode.indent) {
                  state.indent += localState.mode.indent(localState.state, "");
                }
                state.localStates.push({
                  mode: mode,
                  state: CodeMirror.startState(mode)
                });
              }
              return "attribute";
            } else if (match = stream.match(/([\w]+)(?=\()/)) {
              return "variable callee";
            } else if (match = stream.match(/^["']/)) {
              state.soyState.push("string");
              state.quoteKind = match;
              return "string";
            }
            if (stream.match(/(true|false)(?!\w)/) ||
              stream.match(/0x([0-9a-fA-F]{2,})/) ||
              stream.match(/-?([0-9]*[.])?[0-9]+/)) {
              return "atom";
            }
            if (stream.match(/(\||[+\-*\/%]|[=!][=]|[<>][=]?)/)) {
              // Tokenize filter, binary, and equality operators.
              return "operator";
            }
            if (match = stream.match(/^\$([\w]+)/)) {
              return ref(state.variables, match[1]);
            }
            if (match = stream.match(/^\w+/)) {
              return /^(?:as|and|or|not|in)$/.test(match[0]) ? "keyword" : null;
            }
            stream.next();
            return null;

          case "literal":
            if (stream.match(/^(?=\{\/literal})/)) {
              state.indent -= config.indentUnit;
              state.soyState.pop();
              return this.token(stream, state);
            }
            return tokenUntil(stream, state, /\{\/literal}/);
        }

        if (stream.match(/^\{literal}/)) {
          state.indent += config.indentUnit;
          state.soyState.push("literal");
          return "keyword";

        // A tag-keyword must be followed by whitespace, comment or a closing tag.
        } else if (match = stream.match(/^\{([/@\\]?\w+\??)(?=$|[\s}]|\/[/*])/)) {
          if (match[1] != "/switch")
            state.indent += (/^(\/|(else|elseif|ifempty|case|fallbackmsg|default)$)/.test(match[1]) && state.tag != "switch" ? 1 : 2) * config.indentUnit;
          state.tag = match[1];
          if (state.tag == "/" + last(state.kindTag)) {
            // We found the tag that opened the current kind="".
            state.kind.pop();
            state.kindTag.pop();
            state.localStates.pop();
            var localState = last(state.localStates);
            if (localState.mode.indent) {
              state.indent -= localState.mode.indent(localState.state, "");
            }
          }
          state.soyState.push("tag");
          if (state.tag == "template" || state.tag == "deltemplate") {
            state.soyState.push("templ-def");
          } else if (state.tag == "call" || state.tag == "delcall") {
            state.soyState.push("templ-ref");
          } else if (state.tag == "let") {
            state.soyState.push("var-def");
          } else if (state.tag == "for" || state.tag == "foreach") {
            state.scopes = prepend(state.scopes, state.variables);
            state.soyState.push("var-def");
          } else if (state.tag == "namespace") {
            state.soyState.push("namespace-def");
            if (!state.scopes) {
              state.variables = prepend(null, 'ij');
            }
          } else if (state.tag.match(/^@(?:param\??|inject|prop)/)) {
            state.soyState.push("param-def");
          } else if (state.tag.match(/^(?:param)/)) {
            state.soyState.push("param-ref");
          }
          return "keyword";

        // Not a tag-keyword; it's an implicit print tag.
        } else if (stream.eat('{')) {
          state.tag = "print";
          state.indent += 2 * config.indentUnit;
          state.soyState.push("tag");
          return "keyword";
        }

        return tokenUntil(stream, state, /\{|\s+\/\/|\/\*/);
      },

      indent: function(state, textAfter) {
        var indent = state.indent, top = last(state.soyState);
        if (top == "comment") return CodeMirror.Pass;

        if (top == "literal") {
          if (/^\{\/literal}/.test(textAfter)) indent -= config.indentUnit;
        } else {
          if (/^\s*\{\/(template|deltemplate)\b/.test(textAfter)) return 0;
          if (/^\{(\/|(fallbackmsg|elseif|else|ifempty)\b)/.test(textAfter)) indent -= config.indentUnit;
          if (state.tag != "switch" && /^\{(case|default)\b/.test(textAfter)) indent -= config.indentUnit;
          if (/^\{\/switch\b/.test(textAfter)) indent -= config.indentUnit;
        }
        var localState = last(state.localStates);
        if (indent && localState.mode.indent) {
          indent += localState.mode.indent(localState.state, textAfter);
        }
        return indent;
      },

      innerMode: function(state) {
        if (state.soyState.length && last(state.soyState) != "literal") return null;
        else return last(state.localStates);
      },

      electricInput: /^\s*\{(\/|\/template|\/deltemplate|\/switch|fallbackmsg|elseif|else|case|default|ifempty|\/literal\})$/,
      lineComment: "//",
      blockCommentStart: "/*",
      blockCommentEnd: "*/",
      blockCommentContinue: " * ",
      useInnerComments: false,
      fold: "indent"
    };
  }, "htmlmixed");

  CodeMirror.registerHelper("wordChars", "soy", /[\w$]/);

  CodeMirror.registerHelper("hintWords", "soy", indentingTags.concat(
      ["delpackage", "namespace", "alias", "print", "css", "debugger"]));

  CodeMirror.defineMIME("text/x-soy", "soy");
});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/sparql/sparql.js":
/*!**************************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/sparql/sparql.js ***!
  \**************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"));
  else {}
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode("sparql", function(config) {
  var indentUnit = config.indentUnit;
  var curPunc;

  function wordRegexp(words) {
    return new RegExp("^(?:" + words.join("|") + ")$", "i");
  }
  var ops = wordRegexp(["str", "lang", "langmatches", "datatype", "bound", "sameterm", "isiri", "isuri",
                        "iri", "uri", "bnode", "count", "sum", "min", "max", "avg", "sample",
                        "group_concat", "rand", "abs", "ceil", "floor", "round", "concat", "substr", "strlen",
                        "replace", "ucase", "lcase", "encode_for_uri", "contains", "strstarts", "strends",
                        "strbefore", "strafter", "year", "month", "day", "hours", "minutes", "seconds",
                        "timezone", "tz", "now", "uuid", "struuid", "md5", "sha1", "sha256", "sha384",
                        "sha512", "coalesce", "if", "strlang", "strdt", "isnumeric", "regex", "exists",
                        "isblank", "isliteral", "a", "bind"]);
  var keywords = wordRegexp(["base", "prefix", "select", "distinct", "reduced", "construct", "describe",
                             "ask", "from", "named", "where", "order", "limit", "offset", "filter", "optional",
                             "graph", "by", "asc", "desc", "as", "having", "undef", "values", "group",
                             "minus", "in", "not", "service", "silent", "using", "insert", "delete", "union",
                             "true", "false", "with",
                             "data", "copy", "to", "move", "add", "create", "drop", "clear", "load"]);
  var operatorChars = /[*+\-<>=&|\^\/!\?]/;

  function tokenBase(stream, state) {
    var ch = stream.next();
    curPunc = null;
    if (ch == "$" || ch == "?") {
      if(ch == "?" && stream.match(/\s/, false)){
        return "operator";
      }
      stream.match(/^[\w\d]*/);
      return "variable-2";
    }
    else if (ch == "<" && !stream.match(/^[\s\u00a0=]/, false)) {
      stream.match(/^[^\s\u00a0>]*>?/);
      return "atom";
    }
    else if (ch == "\"" || ch == "'") {
      state.tokenize = tokenLiteral(ch);
      return state.tokenize(stream, state);
    }
    else if (/[{}\(\),\.;\[\]]/.test(ch)) {
      curPunc = ch;
      return "bracket";
    }
    else if (ch == "#") {
      stream.skipToEnd();
      return "comment";
    }
    else if (operatorChars.test(ch)) {
      stream.eatWhile(operatorChars);
      return "operator";
    }
    else if (ch == ":") {
      stream.eatWhile(/[\w\d\._\-]/);
      return "atom";
    }
    else if (ch == "@") {
      stream.eatWhile(/[a-z\d\-]/i);
      return "meta";
    }
    else {
      stream.eatWhile(/[_\w\d]/);
      if (stream.eat(":")) {
        stream.eatWhile(/[\w\d_\-]/);
        return "atom";
      }
      var word = stream.current();
      if (ops.test(word))
        return "builtin";
      else if (keywords.test(word))
        return "keyword";
      else
        return "variable";
    }
  }

  function tokenLiteral(quote) {
    return function(stream, state) {
      var escaped = false, ch;
      while ((ch = stream.next()) != null) {
        if (ch == quote && !escaped) {
          state.tokenize = tokenBase;
          break;
        }
        escaped = !escaped && ch == "\\";
      }
      return "string";
    };
  }

  function pushContext(state, type, col) {
    state.context = {prev: state.context, indent: state.indent, col: col, type: type};
  }
  function popContext(state) {
    state.indent = state.context.indent;
    state.context = state.context.prev;
  }

  return {
    startState: function() {
      return {tokenize: tokenBase,
              context: null,
              indent: 0,
              col: 0};
    },

    token: function(stream, state) {
      if (stream.sol()) {
        if (state.context && state.context.align == null) state.context.align = false;
        state.indent = stream.indentation();
      }
      if (stream.eatSpace()) return null;
      var style = state.tokenize(stream, state);

      if (style != "comment" && state.context && state.context.align == null && state.context.type != "pattern") {
        state.context.align = true;
      }

      if (curPunc == "(") pushContext(state, ")", stream.column());
      else if (curPunc == "[") pushContext(state, "]", stream.column());
      else if (curPunc == "{") pushContext(state, "}", stream.column());
      else if (/[\]\}\)]/.test(curPunc)) {
        while (state.context && state.context.type == "pattern") popContext(state);
        if (state.context && curPunc == state.context.type) {
          popContext(state);
          if (curPunc == "}" && state.context && state.context.type == "pattern")
            popContext(state);
        }
      }
      else if (curPunc == "." && state.context && state.context.type == "pattern") popContext(state);
      else if (/atom|string|variable/.test(style) && state.context) {
        if (/[\}\]]/.test(state.context.type))
          pushContext(state, "pattern", stream.column());
        else if (state.context.type == "pattern" && !state.context.align) {
          state.context.align = true;
          state.context.col = stream.column();
        }
      }

      return style;
    },

    indent: function(state, textAfter) {
      var firstChar = textAfter && textAfter.charAt(0);
      var context = state.context;
      if (/[\]\}]/.test(firstChar))
        while (context && context.type == "pattern") context = context.prev;

      var closing = context && firstChar == context.type;
      if (!context)
        return 0;
      else if (context.type == "pattern")
        return context.col;
      else if (context.align)
        return context.col + (closing ? 0 : 1);
      else
        return context.indent + (closing ? 0 : indentUnit);
    },

    lineComment: "#"
  };
});

CodeMirror.defineMIME("application/sparql-query", "sparql");

});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/spreadsheet/spreadsheet.js":
/*!************************************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/spreadsheet/spreadsheet.js ***!
  \************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"));
  else {}
})(function(CodeMirror) {
  "use strict";

  CodeMirror.defineMode("spreadsheet", function () {
    return {
      startState: function () {
        return {
          stringType: null,
          stack: []
        };
      },
      token: function (stream, state) {
        if (!stream) return;

        //check for state changes
        if (state.stack.length === 0) {
          //strings
          if ((stream.peek() == '"') || (stream.peek() == "'")) {
            state.stringType = stream.peek();
            stream.next(); // Skip quote
            state.stack.unshift("string");
          }
        }

        //return state
        //stack has
        switch (state.stack[0]) {
        case "string":
          while (state.stack[0] === "string" && !stream.eol()) {
            if (stream.peek() === state.stringType) {
              stream.next(); // Skip quote
              state.stack.shift(); // Clear flag
            } else if (stream.peek() === "\\") {
              stream.next();
              stream.next();
            } else {
              stream.match(/^.[^\\\"\']*/);
            }
          }
          return "string";

        case "characterClass":
          while (state.stack[0] === "characterClass" && !stream.eol()) {
            if (!(stream.match(/^[^\]\\]+/) || stream.match(/^\\./)))
              state.stack.shift();
          }
          return "operator";
        }

        var peek = stream.peek();

        //no stack
        switch (peek) {
        case "[":
          stream.next();
          state.stack.unshift("characterClass");
          return "bracket";
        case ":":
          stream.next();
          return "operator";
        case "\\":
          if (stream.match(/\\[a-z]+/)) return "string-2";
          else {
            stream.next();
            return "atom";
          }
        case ".":
        case ",":
        case ";":
        case "*":
        case "-":
        case "+":
        case "^":
        case "<":
        case "/":
        case "=":
          stream.next();
          return "atom";
        case "$":
          stream.next();
          return "builtin";
        }

        if (stream.match(/\d+/)) {
          if (stream.match(/^\w+/)) return "error";
          return "number";
        } else if (stream.match(/^[a-zA-Z_]\w*/)) {
          if (stream.match(/(?=[\(.])/, false)) return "keyword";
          return "variable-2";
        } else if (["[", "]", "(", ")", "{", "}"].indexOf(peek) != -1) {
          stream.next();
          return "bracket";
        } else if (!stream.eatSpace()) {
          stream.next();
        }
        return null;
      }
    };
  });

  CodeMirror.defineMIME("text/x-spreadsheet", "spreadsheet");
});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/stylus/stylus.js":
/*!**************************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/stylus/stylus.js ***!
  \**************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

// Stylus mode created by Dmitry Kiselyov http://git.io/AaRB

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"));
  else {}
})(function(CodeMirror) {
  "use strict";

  CodeMirror.defineMode("stylus", function(config) {
    var indentUnit = config.indentUnit,
        indentUnitString = '',
        tagKeywords = keySet(tagKeywords_),
        tagVariablesRegexp = /^(a|b|i|s|col|em)$/i,
        propertyKeywords = keySet(propertyKeywords_),
        nonStandardPropertyKeywords = keySet(nonStandardPropertyKeywords_),
        valueKeywords = keySet(valueKeywords_),
        colorKeywords = keySet(colorKeywords_),
        documentTypes = keySet(documentTypes_),
        documentTypesRegexp = wordRegexp(documentTypes_),
        mediaFeatures = keySet(mediaFeatures_),
        mediaTypes = keySet(mediaTypes_),
        fontProperties = keySet(fontProperties_),
        operatorsRegexp = /^\s*([.]{2,3}|&&|\|\||\*\*|[?!=:]?=|[-+*\/%<>]=?|\?:|\~)/,
        wordOperatorKeywordsRegexp = wordRegexp(wordOperatorKeywords_),
        blockKeywords = keySet(blockKeywords_),
        vendorPrefixesRegexp = new RegExp(/^\-(moz|ms|o|webkit)-/i),
        commonAtoms = keySet(commonAtoms_),
        firstWordMatch = "",
        states = {},
        ch,
        style,
        type,
        override;

    while (indentUnitString.length < indentUnit) indentUnitString += ' ';

    /**
     * Tokenizers
     */
    function tokenBase(stream, state) {
      firstWordMatch = stream.string.match(/(^[\w-]+\s*=\s*$)|(^\s*[\w-]+\s*=\s*[\w-])|(^\s*(\.|#|@|\$|\&|\[|\d|\+|::?|\{|\>|~|\/)?\s*[\w-]*([a-z0-9-]|\*|\/\*)(\(|,)?)/);
      state.context.line.firstWord = firstWordMatch ? firstWordMatch[0].replace(/^\s*/, "") : "";
      state.context.line.indent = stream.indentation();
      ch = stream.peek();

      // Line comment
      if (stream.match("//")) {
        stream.skipToEnd();
        return ["comment", "comment"];
      }
      // Block comment
      if (stream.match("/*")) {
        state.tokenize = tokenCComment;
        return tokenCComment(stream, state);
      }
      // String
      if (ch == "\"" || ch == "'") {
        stream.next();
        state.tokenize = tokenString(ch);
        return state.tokenize(stream, state);
      }
      // Def
      if (ch == "@") {
        stream.next();
        stream.eatWhile(/[\w\\-]/);
        return ["def", stream.current()];
      }
      // ID selector or Hex color
      if (ch == "#") {
        stream.next();
        // Hex color
        if (stream.match(/^[0-9a-f]{3}([0-9a-f]([0-9a-f]{2}){0,2})?\b/i)) {
          return ["atom", "atom"];
        }
        // ID selector
        if (stream.match(/^[a-z][\w-]*/i)) {
          return ["builtin", "hash"];
        }
      }
      // Vendor prefixes
      if (stream.match(vendorPrefixesRegexp)) {
        return ["meta", "vendor-prefixes"];
      }
      // Numbers
      if (stream.match(/^-?[0-9]?\.?[0-9]/)) {
        stream.eatWhile(/[a-z%]/i);
        return ["number", "unit"];
      }
      // !important|optional
      if (ch == "!") {
        stream.next();
        return [stream.match(/^(important|optional)/i) ? "keyword": "operator", "important"];
      }
      // Class
      if (ch == "." && stream.match(/^\.[a-z][\w-]*/i)) {
        return ["qualifier", "qualifier"];
      }
      // url url-prefix domain regexp
      if (stream.match(documentTypesRegexp)) {
        if (stream.peek() == "(") state.tokenize = tokenParenthesized;
        return ["property", "word"];
      }
      // Mixins / Functions
      if (stream.match(/^[a-z][\w-]*\(/i)) {
        stream.backUp(1);
        return ["keyword", "mixin"];
      }
      // Block mixins
      if (stream.match(/^(\+|-)[a-z][\w-]*\(/i)) {
        stream.backUp(1);
        return ["keyword", "block-mixin"];
      }
      // Parent Reference BEM naming
      if (stream.string.match(/^\s*&/) && stream.match(/^[-_]+[a-z][\w-]*/)) {
        return ["qualifier", "qualifier"];
      }
      // / Root Reference & Parent Reference
      if (stream.match(/^(\/|&)(-|_|:|\.|#|[a-z])/)) {
        stream.backUp(1);
        return ["variable-3", "reference"];
      }
      if (stream.match(/^&{1}\s*$/)) {
        return ["variable-3", "reference"];
      }
      // Word operator
      if (stream.match(wordOperatorKeywordsRegexp)) {
        return ["operator", "operator"];
      }
      // Word
      if (stream.match(/^\$?[-_]*[a-z0-9]+[\w-]*/i)) {
        // Variable
        if (stream.match(/^(\.|\[)[\w-\'\"\]]+/i, false)) {
          if (!wordIsTag(stream.current())) {
            stream.match(/\./);
            return ["variable-2", "variable-name"];
          }
        }
        return ["variable-2", "word"];
      }
      // Operators
      if (stream.match(operatorsRegexp)) {
        return ["operator", stream.current()];
      }
      // Delimiters
      if (/[:;,{}\[\]\(\)]/.test(ch)) {
        stream.next();
        return [null, ch];
      }
      // Non-detected items
      stream.next();
      return [null, null];
    }

    /**
     * Token comment
     */
    function tokenCComment(stream, state) {
      var maybeEnd = false, ch;
      while ((ch = stream.next()) != null) {
        if (maybeEnd && ch == "/") {
          state.tokenize = null;
          break;
        }
        maybeEnd = (ch == "*");
      }
      return ["comment", "comment"];
    }

    /**
     * Token string
     */
    function tokenString(quote) {
      return function(stream, state) {
        var escaped = false, ch;
        while ((ch = stream.next()) != null) {
          if (ch == quote && !escaped) {
            if (quote == ")") stream.backUp(1);
            break;
          }
          escaped = !escaped && ch == "\\";
        }
        if (ch == quote || !escaped && quote != ")") state.tokenize = null;
        return ["string", "string"];
      };
    }

    /**
     * Token parenthesized
     */
    function tokenParenthesized(stream, state) {
      stream.next(); // Must be "("
      if (!stream.match(/\s*[\"\')]/, false))
        state.tokenize = tokenString(")");
      else
        state.tokenize = null;
      return [null, "("];
    }

    /**
     * Context management
     */
    function Context(type, indent, prev, line) {
      this.type = type;
      this.indent = indent;
      this.prev = prev;
      this.line = line || {firstWord: "", indent: 0};
    }

    function pushContext(state, stream, type, indent) {
      indent = indent >= 0 ? indent : indentUnit;
      state.context = new Context(type, stream.indentation() + indent, state.context);
      return type;
    }

    function popContext(state, currentIndent) {
      var contextIndent = state.context.indent - indentUnit;
      currentIndent = currentIndent || false;
      state.context = state.context.prev;
      if (currentIndent) state.context.indent = contextIndent;
      return state.context.type;
    }

    function pass(type, stream, state) {
      return states[state.context.type](type, stream, state);
    }

    function popAndPass(type, stream, state, n) {
      for (var i = n || 1; i > 0; i--)
        state.context = state.context.prev;
      return pass(type, stream, state);
    }


    /**
     * Parser
     */
    function wordIsTag(word) {
      return word.toLowerCase() in tagKeywords;
    }

    function wordIsProperty(word) {
      word = word.toLowerCase();
      return word in propertyKeywords || word in fontProperties;
    }

    function wordIsBlock(word) {
      return word.toLowerCase() in blockKeywords;
    }

    function wordIsVendorPrefix(word) {
      return word.toLowerCase().match(vendorPrefixesRegexp);
    }

    function wordAsValue(word) {
      var wordLC = word.toLowerCase();
      var override = "variable-2";
      if (wordIsTag(word)) override = "tag";
      else if (wordIsBlock(word)) override = "block-keyword";
      else if (wordIsProperty(word)) override = "property";
      else if (wordLC in valueKeywords || wordLC in commonAtoms) override = "atom";
      else if (wordLC == "return" || wordLC in colorKeywords) override = "keyword";

      // Font family
      else if (word.match(/^[A-Z]/)) override = "string";
      return override;
    }

    function typeIsBlock(type, stream) {
      return ((endOfLine(stream) && (type == "{" || type == "]" || type == "hash" || type == "qualifier")) || type == "block-mixin");
    }

    function typeIsInterpolation(type, stream) {
      return type == "{" && stream.match(/^\s*\$?[\w-]+/i, false);
    }

    function typeIsPseudo(type, stream) {
      return type == ":" && stream.match(/^[a-z-]+/, false);
    }

    function startOfLine(stream) {
      return stream.sol() || stream.string.match(new RegExp("^\\s*" + escapeRegExp(stream.current())));
    }

    function endOfLine(stream) {
      return stream.eol() || stream.match(/^\s*$/, false);
    }

    function firstWordOfLine(line) {
      var re = /^\s*[-_]*[a-z0-9]+[\w-]*/i;
      var result = typeof line == "string" ? line.match(re) : line.string.match(re);
      return result ? result[0].replace(/^\s*/, "") : "";
    }


    /**
     * Block
     */
    states.block = function(type, stream, state) {
      if ((type == "comment" && startOfLine(stream)) ||
          (type == "," && endOfLine(stream)) ||
          type == "mixin") {
        return pushContext(state, stream, "block", 0);
      }
      if (typeIsInterpolation(type, stream)) {
        return pushContext(state, stream, "interpolation");
      }
      if (endOfLine(stream) && type == "]") {
        if (!/^\s*(\.|#|:|\[|\*|&)/.test(stream.string) && !wordIsTag(firstWordOfLine(stream))) {
          return pushContext(state, stream, "block", 0);
        }
      }
      if (typeIsBlock(type, stream)) {
        return pushContext(state, stream, "block");
      }
      if (type == "}" && endOfLine(stream)) {
        return pushContext(state, stream, "block", 0);
      }
      if (type == "variable-name") {
        if (stream.string.match(/^\s?\$[\w-\.\[\]\'\"]+$/) || wordIsBlock(firstWordOfLine(stream))) {
          return pushContext(state, stream, "variableName");
        }
        else {
          return pushContext(state, stream, "variableName", 0);
        }
      }
      if (type == "=") {
        if (!endOfLine(stream) && !wordIsBlock(firstWordOfLine(stream))) {
          return pushContext(state, stream, "block", 0);
        }
        return pushContext(state, stream, "block");
      }
      if (type == "*") {
        if (endOfLine(stream) || stream.match(/\s*(,|\.|#|\[|:|{)/,false)) {
          override = "tag";
          return pushContext(state, stream, "block");
        }
      }
      if (typeIsPseudo(type, stream)) {
        return pushContext(state, stream, "pseudo");
      }
      if (/@(font-face|media|supports|(-moz-)?document)/.test(type)) {
        return pushContext(state, stream, endOfLine(stream) ? "block" : "atBlock");
      }
      if (/@(-(moz|ms|o|webkit)-)?keyframes$/.test(type)) {
        return pushContext(state, stream, "keyframes");
      }
      if (/@extends?/.test(type)) {
        return pushContext(state, stream, "extend", 0);
      }
      if (type && type.charAt(0) == "@") {

        // Property Lookup
        if (stream.indentation() > 0 && wordIsProperty(stream.current().slice(1))) {
          override = "variable-2";
          return "block";
        }
        if (/(@import|@require|@charset)/.test(type)) {
          return pushContext(state, stream, "block", 0);
        }
        return pushContext(state, stream, "block");
      }
      if (type == "reference" && endOfLine(stream)) {
        return pushContext(state, stream, "block");
      }
      if (type == "(") {
        return pushContext(state, stream, "parens");
      }

      if (type == "vendor-prefixes") {
        return pushContext(state, stream, "vendorPrefixes");
      }
      if (type == "word") {
        var word = stream.current();
        override = wordAsValue(word);

        if (override == "property") {
          if (startOfLine(stream)) {
            return pushContext(state, stream, "block", 0);
          } else {
            override = "atom";
            return "block";
          }
        }

        if (override == "tag") {

          // tag is a css value
          if (/embed|menu|pre|progress|sub|table/.test(word)) {
            if (wordIsProperty(firstWordOfLine(stream))) {
              override = "atom";
              return "block";
            }
          }

          // tag is an attribute
          if (stream.string.match(new RegExp("\\[\\s*" + word + "|" + word +"\\s*\\]"))) {
            override = "atom";
            return "block";
          }

          // tag is a variable
          if (tagVariablesRegexp.test(word)) {
            if ((startOfLine(stream) && stream.string.match(/=/)) ||
                (!startOfLine(stream) &&
                 !stream.string.match(/^(\s*\.|#|\&|\[|\/|>|\*)/) &&
                 !wordIsTag(firstWordOfLine(stream)))) {
              override = "variable-2";
              if (wordIsBlock(firstWordOfLine(stream)))  return "block";
              return pushContext(state, stream, "block", 0);
            }
          }

          if (endOfLine(stream)) return pushContext(state, stream, "block");
        }
        if (override == "block-keyword") {
          override = "keyword";

          // Postfix conditionals
          if (stream.current(/(if|unless)/) && !startOfLine(stream)) {
            return "block";
          }
          return pushContext(state, stream, "block");
        }
        if (word == "return") return pushContext(state, stream, "block", 0);

        // Placeholder selector
        if (override == "variable-2" && stream.string.match(/^\s?\$[\w-\.\[\]\'\"]+$/)) {
          return pushContext(state, stream, "block");
        }
      }
      return state.context.type;
    };


    /**
     * Parens
     */
    states.parens = function(type, stream, state) {
      if (type == "(") return pushContext(state, stream, "parens");
      if (type == ")") {
        if (state.context.prev.type == "parens") {
          return popContext(state);
        }
        if ((stream.string.match(/^[a-z][\w-]*\(/i) && endOfLine(stream)) ||
            wordIsBlock(firstWordOfLine(stream)) ||
            /(\.|#|:|\[|\*|&|>|~|\+|\/)/.test(firstWordOfLine(stream)) ||
            (!stream.string.match(/^-?[a-z][\w-\.\[\]\'\"]*\s*=/) &&
             wordIsTag(firstWordOfLine(stream)))) {
          return pushContext(state, stream, "block");
        }
        if (stream.string.match(/^[\$-]?[a-z][\w-\.\[\]\'\"]*\s*=/) ||
            stream.string.match(/^\s*(\(|\)|[0-9])/) ||
            stream.string.match(/^\s+[a-z][\w-]*\(/i) ||
            stream.string.match(/^\s+[\$-]?[a-z]/i)) {
          return pushContext(state, stream, "block", 0);
        }
        if (endOfLine(stream)) return pushContext(state, stream, "block");
        else return pushContext(state, stream, "block", 0);
      }
      if (type && type.charAt(0) == "@" && wordIsProperty(stream.current().slice(1))) {
        override = "variable-2";
      }
      if (type == "word") {
        var word = stream.current();
        override = wordAsValue(word);
        if (override == "tag" && tagVariablesRegexp.test(word)) {
          override = "variable-2";
        }
        if (override == "property" || word == "to") override = "atom";
      }
      if (type == "variable-name") {
        return pushContext(state, stream, "variableName");
      }
      if (typeIsPseudo(type, stream)) {
        return pushContext(state, stream, "pseudo");
      }
      return state.context.type;
    };


    /**
     * Vendor prefixes
     */
    states.vendorPrefixes = function(type, stream, state) {
      if (type == "word") {
        override = "property";
        return pushContext(state, stream, "block", 0);
      }
      return popContext(state);
    };


    /**
     * Pseudo
     */
    states.pseudo = function(type, stream, state) {
      if (!wordIsProperty(firstWordOfLine(stream.string))) {
        stream.match(/^[a-z-]+/);
        override = "variable-3";
        if (endOfLine(stream)) return pushContext(state, stream, "block");
        return popContext(state);
      }
      return popAndPass(type, stream, state);
    };


    /**
     * atBlock
     */
    states.atBlock = function(type, stream, state) {
      if (type == "(") return pushContext(state, stream, "atBlock_parens");
      if (typeIsBlock(type, stream)) {
        return pushContext(state, stream, "block");
      }
      if (typeIsInterpolation(type, stream)) {
        return pushContext(state, stream, "interpolation");
      }
      if (type == "word") {
        var word = stream.current().toLowerCase();
        if (/^(only|not|and|or)$/.test(word))
          override = "keyword";
        else if (documentTypes.hasOwnProperty(word))
          override = "tag";
        else if (mediaTypes.hasOwnProperty(word))
          override = "attribute";
        else if (mediaFeatures.hasOwnProperty(word))
          override = "property";
        else if (nonStandardPropertyKeywords.hasOwnProperty(word))
          override = "string-2";
        else override = wordAsValue(stream.current());
        if (override == "tag" && endOfLine(stream)) {
          return pushContext(state, stream, "block");
        }
      }
      if (type == "operator" && /^(not|and|or)$/.test(stream.current())) {
        override = "keyword";
      }
      return state.context.type;
    };

    states.atBlock_parens = function(type, stream, state) {
      if (type == "{" || type == "}") return state.context.type;
      if (type == ")") {
        if (endOfLine(stream)) return pushContext(state, stream, "block");
        else return pushContext(state, stream, "atBlock");
      }
      if (type == "word") {
        var word = stream.current().toLowerCase();
        override = wordAsValue(word);
        if (/^(max|min)/.test(word)) override = "property";
        if (override == "tag") {
          tagVariablesRegexp.test(word) ? override = "variable-2" : override = "atom";
        }
        return state.context.type;
      }
      return states.atBlock(type, stream, state);
    };


    /**
     * Keyframes
     */
    states.keyframes = function(type, stream, state) {
      if (stream.indentation() == "0" && ((type == "}" && startOfLine(stream)) || type == "]" || type == "hash"
                                          || type == "qualifier" || wordIsTag(stream.current()))) {
        return popAndPass(type, stream, state);
      }
      if (type == "{") return pushContext(state, stream, "keyframes");
      if (type == "}") {
        if (startOfLine(stream)) return popContext(state, true);
        else return pushContext(state, stream, "keyframes");
      }
      if (type == "unit" && /^[0-9]+\%$/.test(stream.current())) {
        return pushContext(state, stream, "keyframes");
      }
      if (type == "word") {
        override = wordAsValue(stream.current());
        if (override == "block-keyword") {
          override = "keyword";
          return pushContext(state, stream, "keyframes");
        }
      }
      if (/@(font-face|media|supports|(-moz-)?document)/.test(type)) {
        return pushContext(state, stream, endOfLine(stream) ? "block" : "atBlock");
      }
      if (type == "mixin") {
        return pushContext(state, stream, "block", 0);
      }
      return state.context.type;
    };


    /**
     * Interpolation
     */
    states.interpolation = function(type, stream, state) {
      if (type == "{") popContext(state) && pushContext(state, stream, "block");
      if (type == "}") {
        if (stream.string.match(/^\s*(\.|#|:|\[|\*|&|>|~|\+|\/)/i) ||
            (stream.string.match(/^\s*[a-z]/i) && wordIsTag(firstWordOfLine(stream)))) {
          return pushContext(state, stream, "block");
        }
        if (!stream.string.match(/^(\{|\s*\&)/) ||
            stream.match(/\s*[\w-]/,false)) {
          return pushContext(state, stream, "block", 0);
        }
        return pushContext(state, stream, "block");
      }
      if (type == "variable-name") {
        return pushContext(state, stream, "variableName", 0);
      }
      if (type == "word") {
        override = wordAsValue(stream.current());
        if (override == "tag") override = "atom";
      }
      return state.context.type;
    };


    /**
     * Extend/s
     */
    states.extend = function(type, stream, state) {
      if (type == "[" || type == "=") return "extend";
      if (type == "]") return popContext(state);
      if (type == "word") {
        override = wordAsValue(stream.current());
        return "extend";
      }
      return popContext(state);
    };


    /**
     * Variable name
     */
    states.variableName = function(type, stream, state) {
      if (type == "string" || type == "[" || type == "]" || stream.current().match(/^(\.|\$)/)) {
        if (stream.current().match(/^\.[\w-]+/i)) override = "variable-2";
        return "variableName";
      }
      return popAndPass(type, stream, state);
    };


    return {
      startState: function(base) {
        return {
          tokenize: null,
          state: "block",
          context: new Context("block", base || 0, null)
        };
      },
      token: function(stream, state) {
        if (!state.tokenize && stream.eatSpace()) return null;
        style = (state.tokenize || tokenBase)(stream, state);
        if (style && typeof style == "object") {
          type = style[1];
          style = style[0];
        }
        override = style;
        state.state = states[state.state](type, stream, state);
        return override;
      },
      indent: function(state, textAfter, line) {

        var cx = state.context,
            ch = textAfter && textAfter.charAt(0),
            indent = cx.indent,
            lineFirstWord = firstWordOfLine(textAfter),
            lineIndent = line.match(/^\s*/)[0].replace(/\t/g, indentUnitString).length,
            prevLineFirstWord = state.context.prev ? state.context.prev.line.firstWord : "",
            prevLineIndent = state.context.prev ? state.context.prev.line.indent : lineIndent;

        if (cx.prev &&
            (ch == "}" && (cx.type == "block" || cx.type == "atBlock" || cx.type == "keyframes") ||
             ch == ")" && (cx.type == "parens" || cx.type == "atBlock_parens") ||
             ch == "{" && (cx.type == "at"))) {
          indent = cx.indent - indentUnit;
        } else if (!(/(\})/.test(ch))) {
          if (/@|\$|\d/.test(ch) ||
              /^\{/.test(textAfter) ||
/^\s*\/(\/|\*)/.test(textAfter) ||
              /^\s*\/\*/.test(prevLineFirstWord) ||
              /^\s*[\w-\.\[\]\'\"]+\s*(\?|:|\+)?=/i.test(textAfter) ||
/^(\+|-)?[a-z][\w-]*\(/i.test(textAfter) ||
/^return/.test(textAfter) ||
              wordIsBlock(lineFirstWord)) {
            indent = lineIndent;
          } else if (/(\.|#|:|\[|\*|&|>|~|\+|\/)/.test(ch) || wordIsTag(lineFirstWord)) {
            if (/\,\s*$/.test(prevLineFirstWord)) {
              indent = prevLineIndent;
            } else if (/^\s+/.test(line) && (/(\.|#|:|\[|\*|&|>|~|\+|\/)/.test(prevLineFirstWord) || wordIsTag(prevLineFirstWord))) {
              indent = lineIndent <= prevLineIndent ? prevLineIndent : prevLineIndent + indentUnit;
            } else {
              indent = lineIndent;
            }
          } else if (!/,\s*$/.test(line) && (wordIsVendorPrefix(lineFirstWord) || wordIsProperty(lineFirstWord))) {
            if (wordIsBlock(prevLineFirstWord)) {
              indent = lineIndent <= prevLineIndent ? prevLineIndent : prevLineIndent + indentUnit;
            } else if (/^\{/.test(prevLineFirstWord)) {
              indent = lineIndent <= prevLineIndent ? lineIndent : prevLineIndent + indentUnit;
            } else if (wordIsVendorPrefix(prevLineFirstWord) || wordIsProperty(prevLineFirstWord)) {
              indent = lineIndent >= prevLineIndent ? prevLineIndent : lineIndent;
            } else if (/^(\.|#|:|\[|\*|&|@|\+|\-|>|~|\/)/.test(prevLineFirstWord) ||
                      /=\s*$/.test(prevLineFirstWord) ||
                      wordIsTag(prevLineFirstWord) ||
                      /^\$[\w-\.\[\]\'\"]/.test(prevLineFirstWord)) {
              indent = prevLineIndent + indentUnit;
            } else {
              indent = lineIndent;
            }
          }
        }
        return indent;
      },
      electricChars: "}",
      lineComment: "//",
      fold: "indent"
    };
  });

  // developer.mozilla.org/en-US/docs/Web/HTML/Element
  var tagKeywords_ = ["a","abbr","address","area","article","aside","audio", "b", "base","bdi", "bdo","bgsound","blockquote","body","br","button","canvas","caption","cite", "code","col","colgroup","data","datalist","dd","del","details","dfn","div", "dl","dt","em","embed","fieldset","figcaption","figure","footer","form","h1", "h2","h3","h4","h5","h6","head","header","hgroup","hr","html","i","iframe", "img","input","ins","kbd","keygen","label","legend","li","link","main","map", "mark","marquee","menu","menuitem","meta","meter","nav","nobr","noframes", "noscript","object","ol","optgroup","option","output","p","param","pre", "progress","q","rp","rt","ruby","s","samp","script","section","select", "small","source","span","strong","style","sub","summary","sup","table","tbody","td","textarea","tfoot","th","thead","time","tr","track", "u","ul","var","video"];

  // github.com/codemirror/CodeMirror/blob/master/mode/css/css.js
  var documentTypes_ = ["domain", "regexp", "url", "url-prefix"];
  var mediaTypes_ = ["all","aural","braille","handheld","print","projection","screen","tty","tv","embossed"];
  var mediaFeatures_ = ["width","min-width","max-width","height","min-height","max-height","device-width","min-device-width","max-device-width","device-height","min-device-height","max-device-height","aspect-ratio","min-aspect-ratio","max-aspect-ratio","device-aspect-ratio","min-device-aspect-ratio","max-device-aspect-ratio","color","min-color","max-color","color-index","min-color-index","max-color-index","monochrome","min-monochrome","max-monochrome","resolution","min-resolution","max-resolution","scan","grid"];
  var propertyKeywords_ = ["align-content","align-items","align-self","alignment-adjust","alignment-baseline","anchor-point","animation","animation-delay","animation-direction","animation-duration","animation-fill-mode","animation-iteration-count","animation-name","animation-play-state","animation-timing-function","appearance","azimuth","backface-visibility","background","background-attachment","background-clip","background-color","background-image","background-origin","background-position","background-repeat","background-size","baseline-shift","binding","bleed","bookmark-label","bookmark-level","bookmark-state","bookmark-target","border","border-bottom","border-bottom-color","border-bottom-left-radius","border-bottom-right-radius","border-bottom-style","border-bottom-width","border-collapse","border-color","border-image","border-image-outset","border-image-repeat","border-image-slice","border-image-source","border-image-width","border-left","border-left-color","border-left-style","border-left-width","border-radius","border-right","border-right-color","border-right-style","border-right-width","border-spacing","border-style","border-top","border-top-color","border-top-left-radius","border-top-right-radius","border-top-style","border-top-width","border-width","bottom","box-decoration-break","box-shadow","box-sizing","break-after","break-before","break-inside","caption-side","clear","clip","color","color-profile","column-count","column-fill","column-gap","column-rule","column-rule-color","column-rule-style","column-rule-width","column-span","column-width","columns","content","counter-increment","counter-reset","crop","cue","cue-after","cue-before","cursor","direction","display","dominant-baseline","drop-initial-after-adjust","drop-initial-after-align","drop-initial-before-adjust","drop-initial-before-align","drop-initial-size","drop-initial-value","elevation","empty-cells","fit","fit-position","flex","flex-basis","flex-direction","flex-flow","flex-grow","flex-shrink","flex-wrap","float","float-offset","flow-from","flow-into","font","font-feature-settings","font-family","font-kerning","font-language-override","font-size","font-size-adjust","font-stretch","font-style","font-synthesis","font-variant","font-variant-alternates","font-variant-caps","font-variant-east-asian","font-variant-ligatures","font-variant-numeric","font-variant-position","font-weight","grid","grid-area","grid-auto-columns","grid-auto-flow","grid-auto-position","grid-auto-rows","grid-column","grid-column-end","grid-column-start","grid-row","grid-row-end","grid-row-start","grid-template","grid-template-areas","grid-template-columns","grid-template-rows","hanging-punctuation","height","hyphens","icon","image-orientation","image-rendering","image-resolution","inline-box-align","justify-content","left","letter-spacing","line-break","line-height","line-stacking","line-stacking-ruby","line-stacking-shift","line-stacking-strategy","list-style","list-style-image","list-style-position","list-style-type","margin","margin-bottom","margin-left","margin-right","margin-top","marker-offset","marks","marquee-direction","marquee-loop","marquee-play-count","marquee-speed","marquee-style","max-height","max-width","min-height","min-width","move-to","nav-down","nav-index","nav-left","nav-right","nav-up","object-fit","object-position","opacity","order","orphans","outline","outline-color","outline-offset","outline-style","outline-width","overflow","overflow-style","overflow-wrap","overflow-x","overflow-y","padding","padding-bottom","padding-left","padding-right","padding-top","page","page-break-after","page-break-before","page-break-inside","page-policy","pause","pause-after","pause-before","perspective","perspective-origin","pitch","pitch-range","play-during","position","presentation-level","punctuation-trim","quotes","region-break-after","region-break-before","region-break-inside","region-fragment","rendering-intent","resize","rest","rest-after","rest-before","richness","right","rotation","rotation-point","ruby-align","ruby-overhang","ruby-position","ruby-span","shape-image-threshold","shape-inside","shape-margin","shape-outside","size","speak","speak-as","speak-header","speak-numeral","speak-punctuation","speech-rate","stress","string-set","tab-size","table-layout","target","target-name","target-new","target-position","text-align","text-align-last","text-decoration","text-decoration-color","text-decoration-line","text-decoration-skip","text-decoration-style","text-emphasis","text-emphasis-color","text-emphasis-position","text-emphasis-style","text-height","text-indent","text-justify","text-outline","text-overflow","text-shadow","text-size-adjust","text-space-collapse","text-transform","text-underline-position","text-wrap","top","transform","transform-origin","transform-style","transition","transition-delay","transition-duration","transition-property","transition-timing-function","unicode-bidi","vertical-align","visibility","voice-balance","voice-duration","voice-family","voice-pitch","voice-range","voice-rate","voice-stress","voice-volume","volume","white-space","widows","width","will-change","word-break","word-spacing","word-wrap","z-index","clip-path","clip-rule","mask","enable-background","filter","flood-color","flood-opacity","lighting-color","stop-color","stop-opacity","pointer-events","color-interpolation","color-interpolation-filters","color-rendering","fill","fill-opacity","fill-rule","image-rendering","marker","marker-end","marker-mid","marker-start","shape-rendering","stroke","stroke-dasharray","stroke-dashoffset","stroke-linecap","stroke-linejoin","stroke-miterlimit","stroke-opacity","stroke-width","text-rendering","baseline-shift","dominant-baseline","glyph-orientation-horizontal","glyph-orientation-vertical","text-anchor","writing-mode","font-smoothing","osx-font-smoothing"];
  var nonStandardPropertyKeywords_ = ["scrollbar-arrow-color","scrollbar-base-color","scrollbar-dark-shadow-color","scrollbar-face-color","scrollbar-highlight-color","scrollbar-shadow-color","scrollbar-3d-light-color","scrollbar-track-color","shape-inside","searchfield-cancel-button","searchfield-decoration","searchfield-results-button","searchfield-results-decoration","zoom"];
  var fontProperties_ = ["font-family","src","unicode-range","font-variant","font-feature-settings","font-stretch","font-weight","font-style"];
  var colorKeywords_ = ["aliceblue","antiquewhite","aqua","aquamarine","azure","beige","bisque","black","blanchedalmond","blue","blueviolet","brown","burlywood","cadetblue","chartreuse","chocolate","coral","cornflowerblue","cornsilk","crimson","cyan","darkblue","darkcyan","darkgoldenrod","darkgray","darkgreen","darkkhaki","darkmagenta","darkolivegreen","darkorange","darkorchid","darkred","darksalmon","darkseagreen","darkslateblue","darkslategray","darkturquoise","darkviolet","deeppink","deepskyblue","dimgray","dodgerblue","firebrick","floralwhite","forestgreen","fuchsia","gainsboro","ghostwhite","gold","goldenrod","gray","grey","green","greenyellow","honeydew","hotpink","indianred","indigo","ivory","khaki","lavender","lavenderblush","lawngreen","lemonchiffon","lightblue","lightcoral","lightcyan","lightgoldenrodyellow","lightgray","lightgreen","lightpink","lightsalmon","lightseagreen","lightskyblue","lightslategray","lightsteelblue","lightyellow","lime","limegreen","linen","magenta","maroon","mediumaquamarine","mediumblue","mediumorchid","mediumpurple","mediumseagreen","mediumslateblue","mediumspringgreen","mediumturquoise","mediumvioletred","midnightblue","mintcream","mistyrose","moccasin","navajowhite","navy","oldlace","olive","olivedrab","orange","orangered","orchid","palegoldenrod","palegreen","paleturquoise","palevioletred","papayawhip","peachpuff","peru","pink","plum","powderblue","purple","rebeccapurple","red","rosybrown","royalblue","saddlebrown","salmon","sandybrown","seagreen","seashell","sienna","silver","skyblue","slateblue","slategray","snow","springgreen","steelblue","tan","teal","thistle","tomato","turquoise","violet","wheat","white","whitesmoke","yellow","yellowgreen"];
  var valueKeywords_ = ["above","absolute","activeborder","additive","activecaption","afar","after-white-space","ahead","alias","all","all-scroll","alphabetic","alternate","always","amharic","amharic-abegede","antialiased","appworkspace","arabic-indic","armenian","asterisks","attr","auto","avoid","avoid-column","avoid-page","avoid-region","background","backwards","baseline","below","bidi-override","binary","bengali","blink","block","block-axis","bold","bolder","border","border-box","both","bottom","break","break-all","break-word","bullets","button","button-bevel","buttonface","buttonhighlight","buttonshadow","buttontext","calc","cambodian","capitalize","caps-lock-indicator","caption","captiontext","caret","cell","center","checkbox","circle","cjk-decimal","cjk-earthly-branch","cjk-heavenly-stem","cjk-ideographic","clear","clip","close-quote","col-resize","collapse","column","compact","condensed","contain","content","contents","content-box","context-menu","continuous","copy","counter","counters","cover","crop","cross","crosshair","currentcolor","cursive","cyclic","dashed","decimal","decimal-leading-zero","default","default-button","destination-atop","destination-in","destination-out","destination-over","devanagari","disc","discard","disclosure-closed","disclosure-open","document","dot-dash","dot-dot-dash","dotted","double","down","e-resize","ease","ease-in","ease-in-out","ease-out","element","ellipse","ellipsis","embed","end","ethiopic","ethiopic-abegede","ethiopic-abegede-am-et","ethiopic-abegede-gez","ethiopic-abegede-ti-er","ethiopic-abegede-ti-et","ethiopic-halehame-aa-er","ethiopic-halehame-aa-et","ethiopic-halehame-am-et","ethiopic-halehame-gez","ethiopic-halehame-om-et","ethiopic-halehame-sid-et","ethiopic-halehame-so-et","ethiopic-halehame-ti-er","ethiopic-halehame-ti-et","ethiopic-halehame-tig","ethiopic-numeric","ew-resize","expanded","extends","extra-condensed","extra-expanded","fantasy","fast","fill","fixed","flat","flex","footnotes","forwards","from","geometricPrecision","georgian","graytext","groove","gujarati","gurmukhi","hand","hangul","hangul-consonant","hebrew","help","hidden","hide","higher","highlight","highlighttext","hiragana","hiragana-iroha","horizontal","hsl","hsla","icon","ignore","inactiveborder","inactivecaption","inactivecaptiontext","infinite","infobackground","infotext","inherit","initial","inline","inline-axis","inline-block","inline-flex","inline-table","inset","inside","intrinsic","invert","italic","japanese-formal","japanese-informal","justify","kannada","katakana","katakana-iroha","keep-all","khmer","korean-hangul-formal","korean-hanja-formal","korean-hanja-informal","landscape","lao","large","larger","left","level","lighter","line-through","linear","linear-gradient","lines","list-item","listbox","listitem","local","logical","loud","lower","lower-alpha","lower-armenian","lower-greek","lower-hexadecimal","lower-latin","lower-norwegian","lower-roman","lowercase","ltr","malayalam","match","matrix","matrix3d","media-controls-background","media-current-time-display","media-fullscreen-button","media-mute-button","media-play-button","media-return-to-realtime-button","media-rewind-button","media-seek-back-button","media-seek-forward-button","media-slider","media-sliderthumb","media-time-remaining-display","media-volume-slider","media-volume-slider-container","media-volume-sliderthumb","medium","menu","menulist","menulist-button","menulist-text","menulist-textfield","menutext","message-box","middle","min-intrinsic","mix","mongolian","monospace","move","multiple","myanmar","n-resize","narrower","ne-resize","nesw-resize","no-close-quote","no-drop","no-open-quote","no-repeat","none","normal","not-allowed","nowrap","ns-resize","numbers","numeric","nw-resize","nwse-resize","oblique","octal","open-quote","optimizeLegibility","optimizeSpeed","oriya","oromo","outset","outside","outside-shape","overlay","overline","padding","padding-box","painted","page","paused","persian","perspective","plus-darker","plus-lighter","pointer","polygon","portrait","pre","pre-line","pre-wrap","preserve-3d","progress","push-button","radial-gradient","radio","read-only","read-write","read-write-plaintext-only","rectangle","region","relative","repeat","repeating-linear-gradient","repeating-radial-gradient","repeat-x","repeat-y","reset","reverse","rgb","rgba","ridge","right","rotate","rotate3d","rotateX","rotateY","rotateZ","round","row-resize","rtl","run-in","running","s-resize","sans-serif","scale","scale3d","scaleX","scaleY","scaleZ","scroll","scrollbar","scroll-position","se-resize","searchfield","searchfield-cancel-button","searchfield-decoration","searchfield-results-button","searchfield-results-decoration","semi-condensed","semi-expanded","separate","serif","show","sidama","simp-chinese-formal","simp-chinese-informal","single","skew","skewX","skewY","skip-white-space","slide","slider-horizontal","slider-vertical","sliderthumb-horizontal","sliderthumb-vertical","slow","small","small-caps","small-caption","smaller","solid","somali","source-atop","source-in","source-out","source-over","space","spell-out","square","square-button","start","static","status-bar","stretch","stroke","sub","subpixel-antialiased","super","sw-resize","symbolic","symbols","table","table-caption","table-cell","table-column","table-column-group","table-footer-group","table-header-group","table-row","table-row-group","tamil","telugu","text","text-bottom","text-top","textarea","textfield","thai","thick","thin","threeddarkshadow","threedface","threedhighlight","threedlightshadow","threedshadow","tibetan","tigre","tigrinya-er","tigrinya-er-abegede","tigrinya-et","tigrinya-et-abegede","to","top","trad-chinese-formal","trad-chinese-informal","translate","translate3d","translateX","translateY","translateZ","transparent","ultra-condensed","ultra-expanded","underline","up","upper-alpha","upper-armenian","upper-greek","upper-hexadecimal","upper-latin","upper-norwegian","upper-roman","uppercase","urdu","url","var","vertical","vertical-text","visible","visibleFill","visiblePainted","visibleStroke","visual","w-resize","wait","wave","wider","window","windowframe","windowtext","words","x-large","x-small","xor","xx-large","xx-small","bicubic","optimizespeed","grayscale","row","row-reverse","wrap","wrap-reverse","column-reverse","flex-start","flex-end","space-between","space-around", "unset"];

  var wordOperatorKeywords_ = ["in","and","or","not","is not","is a","is","isnt","defined","if unless"],
      blockKeywords_ = ["for","if","else","unless", "from", "to"],
      commonAtoms_ = ["null","true","false","href","title","type","not-allowed","readonly","disabled"],
      commonDef_ = ["@font-face", "@keyframes", "@media", "@viewport", "@page", "@host", "@supports", "@block", "@css"];

  var hintWords = tagKeywords_.concat(documentTypes_,mediaTypes_,mediaFeatures_,
                                      propertyKeywords_,nonStandardPropertyKeywords_,
                                      colorKeywords_,valueKeywords_,fontProperties_,
                                      wordOperatorKeywords_,blockKeywords_,
                                      commonAtoms_,commonDef_);

  function wordRegexp(words) {
    words = words.sort(function(a,b){return b > a;});
    return new RegExp("^((" + words.join(")|(") + "))\\b");
  }

  function keySet(array) {
    var keys = {};
    for (var i = 0; i < array.length; ++i) keys[array[i]] = true;
    return keys;
  }

  function escapeRegExp(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
  }

  CodeMirror.registerHelper("hintWords", "stylus", hintWords);
  CodeMirror.defineMIME("text/x-styl", "stylus");
});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/swift/swift.js":
/*!************************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/swift/swift.js ***!
  \************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

// Swift mode created by Michael Kaminsky https://github.com/mkaminsky11

(function(mod) {
  if (true)
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"))
  else {}
})(function(CodeMirror) {
  "use strict"

  function wordSet(words) {
    var set = {}
    for (var i = 0; i < words.length; i++) set[words[i]] = true
    return set
  }

  var keywords = wordSet(["_","var","let","class","enum","extension","import","protocol","struct","func","typealias","associatedtype",
                          "open","public","internal","fileprivate","private","deinit","init","new","override","self","subscript","super",
                          "convenience","dynamic","final","indirect","lazy","required","static","unowned","unowned(safe)","unowned(unsafe)","weak","as","is",
                          "break","case","continue","default","else","fallthrough","for","guard","if","in","repeat","switch","where","while",
                          "defer","return","inout","mutating","nonmutating","catch","do","rethrows","throw","throws","try","didSet","get","set","willSet",
                          "assignment","associativity","infix","left","none","operator","postfix","precedence","precedencegroup","prefix","right",
                          "Any","AnyObject","Type","dynamicType","Self","Protocol","__COLUMN__","__FILE__","__FUNCTION__","__LINE__"])
  var definingKeywords = wordSet(["var","let","class","enum","extension","import","protocol","struct","func","typealias","associatedtype","for"])
  var atoms = wordSet(["true","false","nil","self","super","_"])
  var types = wordSet(["Array","Bool","Character","Dictionary","Double","Float","Int","Int8","Int16","Int32","Int64","Never","Optional","Set","String",
                       "UInt8","UInt16","UInt32","UInt64","Void"])
  var operators = "+-/*%=|&<>~^?!"
  var punc = ":;,.(){}[]"
  var binary = /^\-?0b[01][01_]*/
  var octal = /^\-?0o[0-7][0-7_]*/
  var hexadecimal = /^\-?0x[\dA-Fa-f][\dA-Fa-f_]*(?:(?:\.[\dA-Fa-f][\dA-Fa-f_]*)?[Pp]\-?\d[\d_]*)?/
  var decimal = /^\-?\d[\d_]*(?:\.\d[\d_]*)?(?:[Ee]\-?\d[\d_]*)?/
  var identifier = /^\$\d+|(`?)[_A-Za-z][_A-Za-z$0-9]*\1/
  var property = /^\.(?:\$\d+|(`?)[_A-Za-z][_A-Za-z$0-9]*\1)/
  var instruction = /^\#[A-Za-z]+/
  var attribute = /^@(?:\$\d+|(`?)[_A-Za-z][_A-Za-z$0-9]*\1)/
  //var regexp = /^\/(?!\s)(?:\/\/)?(?:\\.|[^\/])+\//

  function tokenBase(stream, state, prev) {
    if (stream.sol()) state.indented = stream.indentation()
    if (stream.eatSpace()) return null

    var ch = stream.peek()
    if (ch == "/") {
      if (stream.match("//")) {
        stream.skipToEnd()
        return "comment"
      }
      if (stream.match("/*")) {
        state.tokenize.push(tokenComment)
        return tokenComment(stream, state)
      }
    }
    if (stream.match(instruction)) return "builtin"
    if (stream.match(attribute)) return "attribute"
    if (stream.match(binary)) return "number"
    if (stream.match(octal)) return "number"
    if (stream.match(hexadecimal)) return "number"
    if (stream.match(decimal)) return "number"
    if (stream.match(property)) return "property"
    if (operators.indexOf(ch) > -1) {
      stream.next()
      return "operator"
    }
    if (punc.indexOf(ch) > -1) {
      stream.next()
      stream.match("..")
      return "punctuation"
    }
    if (ch = stream.match(/("{3}|"|')/)) {
      var tokenize = tokenString(ch[0])
      state.tokenize.push(tokenize)
      return tokenize(stream, state)
    }

    if (stream.match(identifier)) {
      var ident = stream.current()
      if (types.hasOwnProperty(ident)) return "variable-2"
      if (atoms.hasOwnProperty(ident)) return "atom"
      if (keywords.hasOwnProperty(ident)) {
        if (definingKeywords.hasOwnProperty(ident))
          state.prev = "define"
        return "keyword"
      }
      if (prev == "define") return "def"
      return "variable"
    }

    stream.next()
    return null
  }

  function tokenUntilClosingParen() {
    var depth = 0
    return function(stream, state, prev) {
      var inner = tokenBase(stream, state, prev)
      if (inner == "punctuation") {
        if (stream.current() == "(") ++depth
        else if (stream.current() == ")") {
          if (depth == 0) {
            stream.backUp(1)
            state.tokenize.pop()
            return state.tokenize[state.tokenize.length - 1](stream, state)
          }
          else --depth
        }
      }
      return inner
    }
  }

  function tokenString(quote) {
    var singleLine = quote.length == 1
    return function(stream, state) {
      var ch, escaped = false
      while (ch = stream.next()) {
        if (escaped) {
          if (ch == "(") {
            state.tokenize.push(tokenUntilClosingParen())
            return "string"
          }
          escaped = false
        } else if (stream.match(quote)) {
          state.tokenize.pop()
          return "string"
        } else {
          escaped = ch == "\\"
        }
      }
      if (singleLine) {
        state.tokenize.pop()
      }
      return "string"
    }
  }

  function tokenComment(stream, state) {
    var ch
    while (true) {
      stream.match(/^[^/*]+/, true)
      ch = stream.next()
      if (!ch) break
      if (ch === "/" && stream.eat("*")) {
        state.tokenize.push(tokenComment)
      } else if (ch === "*" && stream.eat("/")) {
        state.tokenize.pop()
      }
    }
    return "comment"
  }

  function Context(prev, align, indented) {
    this.prev = prev
    this.align = align
    this.indented = indented
  }

  function pushContext(state, stream) {
    var align = stream.match(/^\s*($|\/[\/\*])/, false) ? null : stream.column() + 1
    state.context = new Context(state.context, align, state.indented)
  }

  function popContext(state) {
    if (state.context) {
      state.indented = state.context.indented
      state.context = state.context.prev
    }
  }

  CodeMirror.defineMode("swift", function(config) {
    return {
      startState: function() {
        return {
          prev: null,
          context: null,
          indented: 0,
          tokenize: []
        }
      },

      token: function(stream, state) {
        var prev = state.prev
        state.prev = null
        var tokenize = state.tokenize[state.tokenize.length - 1] || tokenBase
        var style = tokenize(stream, state, prev)
        if (!style || style == "comment") state.prev = prev
        else if (!state.prev) state.prev = style

        if (style == "punctuation") {
          var bracket = /[\(\[\{]|([\]\)\}])/.exec(stream.current())
          if (bracket) (bracket[1] ? popContext : pushContext)(state, stream)
        }

        return style
      },

      indent: function(state, textAfter) {
        var cx = state.context
        if (!cx) return 0
        var closing = /^[\]\}\)]/.test(textAfter)
        if (cx.align != null) return cx.align - (closing ? 1 : 0)
        return cx.indented + (closing ? 0 : config.indentUnit)
      },

      electricInput: /^\s*[\)\}\]]$/,

      lineComment: "//",
      blockCommentStart: "/*",
      blockCommentEnd: "*/",
      fold: "brace",
      closeBrackets: "()[]{}''\"\"``"
    }
  })

  CodeMirror.defineMIME("text/x-swift","swift")
});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/tcl/tcl.js":
/*!********************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/tcl/tcl.js ***!
  \********************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

//tcl mode by Ford_Lawnmower :: Based on Velocity mode by Steve O'Hara

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"));
  else {}
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode("tcl", function() {
  function parseWords(str) {
    var obj = {}, words = str.split(" ");
    for (var i = 0; i < words.length; ++i) obj[words[i]] = true;
    return obj;
  }
  var keywords = parseWords("Tcl safe after append array auto_execok auto_import auto_load " +
        "auto_mkindex auto_mkindex_old auto_qualify auto_reset bgerror " +
        "binary break catch cd close concat continue dde eof encoding error " +
        "eval exec exit expr fblocked fconfigure fcopy file fileevent filename " +
        "filename flush for foreach format gets glob global history http if " +
        "incr info interp join lappend lindex linsert list llength load lrange " +
        "lreplace lsearch lset lsort memory msgcat namespace open package parray " +
        "pid pkg::create pkg_mkIndex proc puts pwd re_syntax read regex regexp " +
        "registry regsub rename resource return scan seek set socket source split " +
        "string subst switch tcl_endOfWord tcl_findLibrary tcl_startOfNextWord " +
        "tcl_wordBreakAfter tcl_startOfPreviousWord tcl_wordBreakBefore tcltest " +
        "tclvars tell time trace unknown unset update uplevel upvar variable " +
    "vwait");
    var functions = parseWords("if elseif else and not or eq ne in ni for foreach while switch");
    var isOperatorChar = /[+\-*&%=<>!?^\/\|]/;
    function chain(stream, state, f) {
      state.tokenize = f;
      return f(stream, state);
    }
    function tokenBase(stream, state) {
      var beforeParams = state.beforeParams;
      state.beforeParams = false;
      var ch = stream.next();
      if ((ch == '"' || ch == "'") && state.inParams) {
        return chain(stream, state, tokenString(ch));
      } else if (/[\[\]{}\(\),;\.]/.test(ch)) {
        if (ch == "(" && beforeParams) state.inParams = true;
        else if (ch == ")") state.inParams = false;
          return null;
      } else if (/\d/.test(ch)) {
        stream.eatWhile(/[\w\.]/);
        return "number";
      } else if (ch == "#") {
        if (stream.eat("*"))
          return chain(stream, state, tokenComment);
        if (ch == "#" && stream.match(/ *\[ *\[/))
          return chain(stream, state, tokenUnparsed);
        stream.skipToEnd();
        return "comment";
      } else if (ch == '"') {
        stream.skipTo(/"/);
        return "comment";
      } else if (ch == "$") {
        stream.eatWhile(/[$_a-z0-9A-Z\.{:]/);
        stream.eatWhile(/}/);
        state.beforeParams = true;
        return "builtin";
      } else if (isOperatorChar.test(ch)) {
        stream.eatWhile(isOperatorChar);
        return "comment";
      } else {
        stream.eatWhile(/[\w\$_{}\xa1-\uffff]/);
        var word = stream.current().toLowerCase();
        if (keywords && keywords.propertyIsEnumerable(word))
          return "keyword";
        if (functions && functions.propertyIsEnumerable(word)) {
          state.beforeParams = true;
          return "keyword";
        }
        return null;
      }
    }
    function tokenString(quote) {
      return function(stream, state) {
      var escaped = false, next, end = false;
      while ((next = stream.next()) != null) {
        if (next == quote && !escaped) {
          end = true;
          break;
        }
        escaped = !escaped && next == "\\";
      }
      if (end) state.tokenize = tokenBase;
        return "string";
      };
    }
    function tokenComment(stream, state) {
      var maybeEnd = false, ch;
      while (ch = stream.next()) {
        if (ch == "#" && maybeEnd) {
          state.tokenize = tokenBase;
          break;
        }
        maybeEnd = (ch == "*");
      }
      return "comment";
    }
    function tokenUnparsed(stream, state) {
      var maybeEnd = 0, ch;
      while (ch = stream.next()) {
        if (ch == "#" && maybeEnd == 2) {
          state.tokenize = tokenBase;
          break;
        }
        if (ch == "]")
          maybeEnd++;
        else if (ch != " ")
          maybeEnd = 0;
      }
      return "meta";
    }
    return {
      startState: function() {
        return {
          tokenize: tokenBase,
          beforeParams: false,
          inParams: false
        };
      },
      token: function(stream, state) {
        if (stream.eatSpace()) return null;
        return state.tokenize(stream, state);
      }
    };
});
CodeMirror.defineMIME("text/x-tcl", "tcl");

});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/textile/textile.js":
/*!****************************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/textile/textile.js ***!
  \****************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function(mod) {
  if (true) { // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"));
  } else {}
})(function(CodeMirror) {
  "use strict";

  var TOKEN_STYLES = {
    addition: "positive",
    attributes: "attribute",
    bold: "strong",
    cite: "keyword",
    code: "atom",
    definitionList: "number",
    deletion: "negative",
    div: "punctuation",
    em: "em",
    footnote: "variable",
    footCite: "qualifier",
    header: "header",
    html: "comment",
    image: "string",
    italic: "em",
    link: "link",
    linkDefinition: "link",
    list1: "variable-2",
    list2: "variable-3",
    list3: "keyword",
    notextile: "string-2",
    pre: "operator",
    p: "property",
    quote: "bracket",
    span: "quote",
    specialChar: "tag",
    strong: "strong",
    sub: "builtin",
    sup: "builtin",
    table: "variable-3",
    tableHeading: "operator"
  };

  function startNewLine(stream, state) {
    state.mode = Modes.newLayout;
    state.tableHeading = false;

    if (state.layoutType === "definitionList" && state.spanningLayout &&
        stream.match(RE("definitionListEnd"), false))
      state.spanningLayout = false;
  }

  function handlePhraseModifier(stream, state, ch) {
    if (ch === "_") {
      if (stream.eat("_"))
        return togglePhraseModifier(stream, state, "italic", /__/, 2);
      else
        return togglePhraseModifier(stream, state, "em", /_/, 1);
    }

    if (ch === "*") {
      if (stream.eat("*")) {
        return togglePhraseModifier(stream, state, "bold", /\*\*/, 2);
      }
      return togglePhraseModifier(stream, state, "strong", /\*/, 1);
    }

    if (ch === "[") {
      if (stream.match(/\d+\]/)) state.footCite = true;
      return tokenStyles(state);
    }

    if (ch === "(") {
      var spec = stream.match(/^(r|tm|c)\)/);
      if (spec)
        return tokenStylesWith(state, TOKEN_STYLES.specialChar);
    }

    if (ch === "<" && stream.match(/(\w+)[^>]+>[^<]+<\/\1>/))
      return tokenStylesWith(state, TOKEN_STYLES.html);

    if (ch === "?" && stream.eat("?"))
      return togglePhraseModifier(stream, state, "cite", /\?\?/, 2);

    if (ch === "=" && stream.eat("="))
      return togglePhraseModifier(stream, state, "notextile", /==/, 2);

    if (ch === "-" && !stream.eat("-"))
      return togglePhraseModifier(stream, state, "deletion", /-/, 1);

    if (ch === "+")
      return togglePhraseModifier(stream, state, "addition", /\+/, 1);

    if (ch === "~")
      return togglePhraseModifier(stream, state, "sub", /~/, 1);

    if (ch === "^")
      return togglePhraseModifier(stream, state, "sup", /\^/, 1);

    if (ch === "%")
      return togglePhraseModifier(stream, state, "span", /%/, 1);

    if (ch === "@")
      return togglePhraseModifier(stream, state, "code", /@/, 1);

    if (ch === "!") {
      var type = togglePhraseModifier(stream, state, "image", /(?:\([^\)]+\))?!/, 1);
      stream.match(/^:\S+/); // optional Url portion
      return type;
    }
    return tokenStyles(state);
  }

  function togglePhraseModifier(stream, state, phraseModifier, closeRE, openSize) {
    var charBefore = stream.pos > openSize ? stream.string.charAt(stream.pos - openSize - 1) : null;
    var charAfter = stream.peek();
    if (state[phraseModifier]) {
      if ((!charAfter || /\W/.test(charAfter)) && charBefore && /\S/.test(charBefore)) {
        var type = tokenStyles(state);
        state[phraseModifier] = false;
        return type;
      }
    } else if ((!charBefore || /\W/.test(charBefore)) && charAfter && /\S/.test(charAfter) &&
               stream.match(new RegExp("^.*\\S" + closeRE.source + "(?:\\W|$)"), false)) {
      state[phraseModifier] = true;
      state.mode = Modes.attributes;
    }
    return tokenStyles(state);
  };

  function tokenStyles(state) {
    var disabled = textileDisabled(state);
    if (disabled) return disabled;

    var styles = [];
    if (state.layoutType) styles.push(TOKEN_STYLES[state.layoutType]);

    styles = styles.concat(activeStyles(
      state, "addition", "bold", "cite", "code", "deletion", "em", "footCite",
      "image", "italic", "link", "span", "strong", "sub", "sup", "table", "tableHeading"));

    if (state.layoutType === "header")
      styles.push(TOKEN_STYLES.header + "-" + state.header);

    return styles.length ? styles.join(" ") : null;
  }

  function textileDisabled(state) {
    var type = state.layoutType;

    switch(type) {
    case "notextile":
    case "code":
    case "pre":
      return TOKEN_STYLES[type];
    default:
      if (state.notextile)
        return TOKEN_STYLES.notextile + (type ? (" " + TOKEN_STYLES[type]) : "");
      return null;
    }
  }

  function tokenStylesWith(state, extraStyles) {
    var disabled = textileDisabled(state);
    if (disabled) return disabled;

    var type = tokenStyles(state);
    if (extraStyles)
      return type ? (type + " " + extraStyles) : extraStyles;
    else
      return type;
  }

  function activeStyles(state) {
    var styles = [];
    for (var i = 1; i < arguments.length; ++i) {
      if (state[arguments[i]])
        styles.push(TOKEN_STYLES[arguments[i]]);
    }
    return styles;
  }

  function blankLine(state) {
    var spanningLayout = state.spanningLayout, type = state.layoutType;

    for (var key in state) if (state.hasOwnProperty(key))
      delete state[key];

    state.mode = Modes.newLayout;
    if (spanningLayout) {
      state.layoutType = type;
      state.spanningLayout = true;
    }
  }

  var REs = {
    cache: {},
    single: {
      bc: "bc",
      bq: "bq",
      definitionList: /- .*?:=+/,
      definitionListEnd: /.*=:\s*$/,
      div: "div",
      drawTable: /\|.*\|/,
      foot: /fn\d+/,
      header: /h[1-6]/,
      html: /\s*<(?:\/)?(\w+)(?:[^>]+)?>(?:[^<]+<\/\1>)?/,
      link: /[^"]+":\S/,
      linkDefinition: /\[[^\s\]]+\]\S+/,
      list: /(?:#+|\*+)/,
      notextile: "notextile",
      para: "p",
      pre: "pre",
      table: "table",
      tableCellAttributes: /[\/\\]\d+/,
      tableHeading: /\|_\./,
      tableText: /[^"_\*\[\(\?\+~\^%@|-]+/,
      text: /[^!"_=\*\[\(<\?\+~\^%@-]+/
    },
    attributes: {
      align: /(?:<>|<|>|=)/,
      selector: /\([^\(][^\)]+\)/,
      lang: /\[[^\[\]]+\]/,
      pad: /(?:\(+|\)+){1,2}/,
      css: /\{[^\}]+\}/
    },
    createRe: function(name) {
      switch (name) {
      case "drawTable":
        return REs.makeRe("^", REs.single.drawTable, "$");
      case "html":
        return REs.makeRe("^", REs.single.html, "(?:", REs.single.html, ")*", "$");
      case "linkDefinition":
        return REs.makeRe("^", REs.single.linkDefinition, "$");
      case "listLayout":
        return REs.makeRe("^", REs.single.list, RE("allAttributes"), "*\\s+");
      case "tableCellAttributes":
        return REs.makeRe("^", REs.choiceRe(REs.single.tableCellAttributes,
                                            RE("allAttributes")), "+\\.");
      case "type":
        return REs.makeRe("^", RE("allTypes"));
      case "typeLayout":
        return REs.makeRe("^", RE("allTypes"), RE("allAttributes"),
                          "*\\.\\.?", "(\\s+|$)");
      case "attributes":
        return REs.makeRe("^", RE("allAttributes"), "+");

      case "allTypes":
        return REs.choiceRe(REs.single.div, REs.single.foot,
                            REs.single.header, REs.single.bc, REs.single.bq,
                            REs.single.notextile, REs.single.pre, REs.single.table,
                            REs.single.para);

      case "allAttributes":
        return REs.choiceRe(REs.attributes.selector, REs.attributes.css,
                            REs.attributes.lang, REs.attributes.align, REs.attributes.pad);

      default:
        return REs.makeRe("^", REs.single[name]);
      }
    },
    makeRe: function() {
      var pattern = "";
      for (var i = 0; i < arguments.length; ++i) {
        var arg = arguments[i];
        pattern += (typeof arg === "string") ? arg : arg.source;
      }
      return new RegExp(pattern);
    },
    choiceRe: function() {
      var parts = [arguments[0]];
      for (var i = 1; i < arguments.length; ++i) {
        parts[i * 2 - 1] = "|";
        parts[i * 2] = arguments[i];
      }

      parts.unshift("(?:");
      parts.push(")");
      return REs.makeRe.apply(null, parts);
    }
  };

  function RE(name) {
    return (REs.cache[name] || (REs.cache[name] = REs.createRe(name)));
  }

  var Modes = {
    newLayout: function(stream, state) {
      if (stream.match(RE("typeLayout"), false)) {
        state.spanningLayout = false;
        return (state.mode = Modes.blockType)(stream, state);
      }
      var newMode;
      if (!textileDisabled(state)) {
        if (stream.match(RE("listLayout"), false))
          newMode = Modes.list;
        else if (stream.match(RE("drawTable"), false))
          newMode = Modes.table;
        else if (stream.match(RE("linkDefinition"), false))
          newMode = Modes.linkDefinition;
        else if (stream.match(RE("definitionList")))
          newMode = Modes.definitionList;
        else if (stream.match(RE("html"), false))
          newMode = Modes.html;
      }
      return (state.mode = (newMode || Modes.text))(stream, state);
    },

    blockType: function(stream, state) {
      var match, type;
      state.layoutType = null;

      if (match = stream.match(RE("type")))
        type = match[0];
      else
        return (state.mode = Modes.text)(stream, state);

      if (match = type.match(RE("header"))) {
        state.layoutType = "header";
        state.header = parseInt(match[0][1]);
      } else if (type.match(RE("bq"))) {
        state.layoutType = "quote";
      } else if (type.match(RE("bc"))) {
        state.layoutType = "code";
      } else if (type.match(RE("foot"))) {
        state.layoutType = "footnote";
      } else if (type.match(RE("notextile"))) {
        state.layoutType = "notextile";
      } else if (type.match(RE("pre"))) {
        state.layoutType = "pre";
      } else if (type.match(RE("div"))) {
        state.layoutType = "div";
      } else if (type.match(RE("table"))) {
        state.layoutType = "table";
      }

      state.mode = Modes.attributes;
      return tokenStyles(state);
    },

    text: function(stream, state) {
      if (stream.match(RE("text"))) return tokenStyles(state);

      var ch = stream.next();
      if (ch === '"')
        return (state.mode = Modes.link)(stream, state);
      return handlePhraseModifier(stream, state, ch);
    },

    attributes: function(stream, state) {
      state.mode = Modes.layoutLength;

      if (stream.match(RE("attributes")))
        return tokenStylesWith(state, TOKEN_STYLES.attributes);
      else
        return tokenStyles(state);
    },

    layoutLength: function(stream, state) {
      if (stream.eat(".") && stream.eat("."))
        state.spanningLayout = true;

      state.mode = Modes.text;
      return tokenStyles(state);
    },

    list: function(stream, state) {
      var match = stream.match(RE("list"));
      state.listDepth = match[0].length;
      var listMod = (state.listDepth - 1) % 3;
      if (!listMod)
        state.layoutType = "list1";
      else if (listMod === 1)
        state.layoutType = "list2";
      else
        state.layoutType = "list3";

      state.mode = Modes.attributes;
      return tokenStyles(state);
    },

    link: function(stream, state) {
      state.mode = Modes.text;
      if (stream.match(RE("link"))) {
        stream.match(/\S+/);
        return tokenStylesWith(state, TOKEN_STYLES.link);
      }
      return tokenStyles(state);
    },

    linkDefinition: function(stream, state) {
      stream.skipToEnd();
      return tokenStylesWith(state, TOKEN_STYLES.linkDefinition);
    },

    definitionList: function(stream, state) {
      stream.match(RE("definitionList"));

      state.layoutType = "definitionList";

      if (stream.match(/\s*$/))
        state.spanningLayout = true;
      else
        state.mode = Modes.attributes;

      return tokenStyles(state);
    },

    html: function(stream, state) {
      stream.skipToEnd();
      return tokenStylesWith(state, TOKEN_STYLES.html);
    },

    table: function(stream, state) {
      state.layoutType = "table";
      return (state.mode = Modes.tableCell)(stream, state);
    },

    tableCell: function(stream, state) {
      if (stream.match(RE("tableHeading")))
        state.tableHeading = true;
      else
        stream.eat("|");

      state.mode = Modes.tableCellAttributes;
      return tokenStyles(state);
    },

    tableCellAttributes: function(stream, state) {
      state.mode = Modes.tableText;

      if (stream.match(RE("tableCellAttributes")))
        return tokenStylesWith(state, TOKEN_STYLES.attributes);
      else
        return tokenStyles(state);
    },

    tableText: function(stream, state) {
      if (stream.match(RE("tableText")))
        return tokenStyles(state);

      if (stream.peek() === "|") { // end of cell
        state.mode = Modes.tableCell;
        return tokenStyles(state);
      }
      return handlePhraseModifier(stream, state, stream.next());
    }
  };

  CodeMirror.defineMode("textile", function() {
    return {
      startState: function() {
        return { mode: Modes.newLayout };
      },
      token: function(stream, state) {
        if (stream.sol()) startNewLine(stream, state);
        return state.mode(stream, state);
      },
      blankLine: blankLine
    };
  });

  CodeMirror.defineMIME("text/x-textile", "textile");
});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/tiddlywiki/tiddlywiki.js":
/*!**********************************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/tiddlywiki/tiddlywiki.js ***!
  \**********************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

/***
    |''Name''|tiddlywiki.js|
    |''Description''|Enables TiddlyWikiy syntax highlighting using CodeMirror|
    |''Author''|PMario|
    |''Version''|0.1.7|
    |''Status''|''stable''|
    |''Source''|[[GitHub|https://github.com/pmario/CodeMirror2/blob/tw-syntax/mode/tiddlywiki]]|
    |''Documentation''|https://codemirror.tiddlyspace.com/|
    |''License''|[[MIT License|http://www.opensource.org/licenses/mit-license.php]]|
    |''CoreVersion''|2.5.0|
    |''Requires''|codemirror.js|
    |''Keywords''|syntax highlighting color code mirror codemirror|
    ! Info
    CoreVersion parameter is needed for TiddlyWiki only!
***/

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"));
  else {}
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode("tiddlywiki", function () {
  // Tokenizer
  var textwords = {};

  var keywords = {
    "allTags": true, "closeAll": true, "list": true,
    "newJournal": true, "newTiddler": true,
    "permaview": true, "saveChanges": true,
    "search": true, "slider": true, "tabs": true,
    "tag": true, "tagging": true, "tags": true,
    "tiddler": true, "timeline": true,
    "today": true, "version": true, "option": true,
    "with": true, "filter": true
  };

  var isSpaceName = /[\w_\-]/i,
      reHR = /^\-\-\-\-+$/,                                 // <hr>
      reWikiCommentStart = /^\/\*\*\*$/,            // /***
      reWikiCommentStop = /^\*\*\*\/$/,             // ***/
      reBlockQuote = /^<<<$/,

      reJsCodeStart = /^\/\/\{\{\{$/,                       // //{{{ js block start
      reJsCodeStop = /^\/\/\}\}\}$/,                        // //}}} js stop
      reXmlCodeStart = /^<!--\{\{\{-->$/,           // xml block start
      reXmlCodeStop = /^<!--\}\}\}-->$/,            // xml stop

      reCodeBlockStart = /^\{\{\{$/,                        // {{{ TW text div block start
      reCodeBlockStop = /^\}\}\}$/,                 // }}} TW text stop

      reUntilCodeStop = /.*?\}\}\}/;

  function chain(stream, state, f) {
    state.tokenize = f;
    return f(stream, state);
  }

  function tokenBase(stream, state) {
    var sol = stream.sol(), ch = stream.peek();

    state.block = false;        // indicates the start of a code block.

    // check start of  blocks
    if (sol && /[<\/\*{}\-]/.test(ch)) {
      if (stream.match(reCodeBlockStart)) {
        state.block = true;
        return chain(stream, state, twTokenCode);
      }
      if (stream.match(reBlockQuote))
        return 'quote';
      if (stream.match(reWikiCommentStart) || stream.match(reWikiCommentStop))
        return 'comment';
      if (stream.match(reJsCodeStart) || stream.match(reJsCodeStop) || stream.match(reXmlCodeStart) || stream.match(reXmlCodeStop))
        return 'comment';
      if (stream.match(reHR))
        return 'hr';
    }

    stream.next();
    if (sol && /[\/\*!#;:>|]/.test(ch)) {
      if (ch == "!") { // tw header
        stream.skipToEnd();
        return "header";
      }
      if (ch == "*") { // tw list
        stream.eatWhile('*');
        return "comment";
      }
      if (ch == "#") { // tw numbered list
        stream.eatWhile('#');
        return "comment";
      }
      if (ch == ";") { // definition list, term
        stream.eatWhile(';');
        return "comment";
      }
      if (ch == ":") { // definition list, description
        stream.eatWhile(':');
        return "comment";
      }
      if (ch == ">") { // single line quote
        stream.eatWhile(">");
        return "quote";
      }
      if (ch == '|')
        return 'header';
    }

    if (ch == '{' && stream.match(/\{\{/))
      return chain(stream, state, twTokenCode);

    // rudimentary html:// file:// link matching. TW knows much more ...
    if (/[hf]/i.test(ch) &&
        /[ti]/i.test(stream.peek()) &&
        stream.match(/\b(ttps?|tp|ile):\/\/[\-A-Z0-9+&@#\/%?=~_|$!:,.;]*[A-Z0-9+&@#\/%=~_|$]/i))
      return "link";

    // just a little string indicator, don't want to have the whole string covered
    if (ch == '"')
      return 'string';

    if (ch == '~')    // _no_ CamelCase indicator should be bold
      return 'brace';

    if (/[\[\]]/.test(ch) && stream.match(ch)) // check for [[..]]
      return 'brace';

    if (ch == "@") {    // check for space link. TODO fix @@...@@ highlighting
      stream.eatWhile(isSpaceName);
      return "link";
    }

    if (/\d/.test(ch)) {        // numbers
      stream.eatWhile(/\d/);
      return "number";
    }

    if (ch == "/") { // tw invisible comment
      if (stream.eat("%")) {
        return chain(stream, state, twTokenComment);
      } else if (stream.eat("/")) { //
        return chain(stream, state, twTokenEm);
      }
    }

    if (ch == "_" && stream.eat("_")) // tw underline
        return chain(stream, state, twTokenUnderline);

    // strikethrough and mdash handling
    if (ch == "-" && stream.eat("-")) {
      // if strikethrough looks ugly, change CSS.
      if (stream.peek() != ' ')
        return chain(stream, state, twTokenStrike);
      // mdash
      if (stream.peek() == ' ')
        return 'brace';
    }

    if (ch == "'" && stream.eat("'")) // tw bold
      return chain(stream, state, twTokenStrong);

    if (ch == "<" && stream.eat("<")) // tw macro
      return chain(stream, state, twTokenMacro);

    // core macro handling
    stream.eatWhile(/[\w\$_]/);
    return textwords.propertyIsEnumerable(stream.current()) ? "keyword" : null
  }

  // tw invisible comment
  function twTokenComment(stream, state) {
    var maybeEnd = false, ch;
    while (ch = stream.next()) {
      if (ch == "/" && maybeEnd) {
        state.tokenize = tokenBase;
        break;
      }
      maybeEnd = (ch == "%");
    }
    return "comment";
  }

  // tw strong / bold
  function twTokenStrong(stream, state) {
    var maybeEnd = false,
    ch;
    while (ch = stream.next()) {
      if (ch == "'" && maybeEnd) {
        state.tokenize = tokenBase;
        break;
      }
      maybeEnd = (ch == "'");
    }
    return "strong";
  }

  // tw code
  function twTokenCode(stream, state) {
    var sb = state.block;

    if (sb && stream.current()) {
      return "comment";
    }

    if (!sb && stream.match(reUntilCodeStop)) {
      state.tokenize = tokenBase;
      return "comment";
    }

    if (sb && stream.sol() && stream.match(reCodeBlockStop)) {
      state.tokenize = tokenBase;
      return "comment";
    }

    stream.next();
    return "comment";
  }

  // tw em / italic
  function twTokenEm(stream, state) {
    var maybeEnd = false,
    ch;
    while (ch = stream.next()) {
      if (ch == "/" && maybeEnd) {
        state.tokenize = tokenBase;
        break;
      }
      maybeEnd = (ch == "/");
    }
    return "em";
  }

  // tw underlined text
  function twTokenUnderline(stream, state) {
    var maybeEnd = false,
    ch;
    while (ch = stream.next()) {
      if (ch == "_" && maybeEnd) {
        state.tokenize = tokenBase;
        break;
      }
      maybeEnd = (ch == "_");
    }
    return "underlined";
  }

  // tw strike through text looks ugly
  // change CSS if needed
  function twTokenStrike(stream, state) {
    var maybeEnd = false, ch;

    while (ch = stream.next()) {
      if (ch == "-" && maybeEnd) {
        state.tokenize = tokenBase;
        break;
      }
      maybeEnd = (ch == "-");
    }
    return "strikethrough";
  }

  // macro
  function twTokenMacro(stream, state) {
    if (stream.current() == '<<') {
      return 'macro';
    }

    var ch = stream.next();
    if (!ch) {
      state.tokenize = tokenBase;
      return null;
    }
    if (ch == ">") {
      if (stream.peek() == '>') {
        stream.next();
        state.tokenize = tokenBase;
        return "macro";
      }
    }

    stream.eatWhile(/[\w\$_]/);
    return keywords.propertyIsEnumerable(stream.current()) ? "keyword" : null
  }

  // Interface
  return {
    startState: function () {
      return {tokenize: tokenBase};
    },

    token: function (stream, state) {
      if (stream.eatSpace()) return null;
      var style = state.tokenize(stream, state);
      return style;
    }
  };
});

CodeMirror.defineMIME("text/x-tiddlywiki", "tiddlywiki");
});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/tiki/tiki.js":
/*!**********************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/tiki/tiki.js ***!
  \**********************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"));
  else {}
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode('tiki', function(config) {
  function inBlock(style, terminator, returnTokenizer) {
    return function(stream, state) {
      while (!stream.eol()) {
        if (stream.match(terminator)) {
          state.tokenize = inText;
          break;
        }
        stream.next();
      }

      if (returnTokenizer) state.tokenize = returnTokenizer;

      return style;
    };
  }

  function inLine(style) {
    return function(stream, state) {
      while(!stream.eol()) {
        stream.next();
      }
      state.tokenize = inText;
      return style;
    };
  }

  function inText(stream, state) {
    function chain(parser) {
      state.tokenize = parser;
      return parser(stream, state);
    }

    var sol = stream.sol();
    var ch = stream.next();

    //non start of line
    switch (ch) { //switch is generally much faster than if, so it is used here
    case "{": //plugin
      stream.eat("/");
      stream.eatSpace();
      stream.eatWhile(/[^\s\u00a0=\"\'\/?(}]/);
      state.tokenize = inPlugin;
      return "tag";
    case "_": //bold
      if (stream.eat("_"))
        return chain(inBlock("strong", "__", inText));
      break;
    case "'": //italics
      if (stream.eat("'"))
        return chain(inBlock("em", "''", inText));
      break;
    case "(":// Wiki Link
      if (stream.eat("("))
        return chain(inBlock("variable-2", "))", inText));
      break;
    case "[":// Weblink
      return chain(inBlock("variable-3", "]", inText));
      break;
    case "|": //table
      if (stream.eat("|"))
        return chain(inBlock("comment", "||"));
      break;
    case "-":
      if (stream.eat("=")) {//titleBar
        return chain(inBlock("header string", "=-", inText));
      } else if (stream.eat("-")) {//deleted
        return chain(inBlock("error tw-deleted", "--", inText));
      }
      break;
    case "=": //underline
      if (stream.match("=="))
        return chain(inBlock("tw-underline", "===", inText));
      break;
    case ":":
      if (stream.eat(":"))
        return chain(inBlock("comment", "::"));
      break;
    case "^": //box
      return chain(inBlock("tw-box", "^"));
      break;
    case "~": //np
      if (stream.match("np~"))
        return chain(inBlock("meta", "~/np~"));
      break;
    }

    //start of line types
    if (sol) {
      switch (ch) {
      case "!": //header at start of line
        if (stream.match('!!!!!')) {
          return chain(inLine("header string"));
        } else if (stream.match('!!!!')) {
          return chain(inLine("header string"));
        } else if (stream.match('!!!')) {
          return chain(inLine("header string"));
        } else if (stream.match('!!')) {
          return chain(inLine("header string"));
        } else {
          return chain(inLine("header string"));
        }
        break;
      case "*": //unordered list line item, or <li /> at start of line
      case "#": //ordered list line item, or <li /> at start of line
      case "+": //ordered list line item, or <li /> at start of line
        return chain(inLine("tw-listitem bracket"));
        break;
      }
    }

    //stream.eatWhile(/[&{]/); was eating up plugins, turned off to act less like html and more like tiki
    return null;
  }

  var indentUnit = config.indentUnit;

  // Return variables for tokenizers
  var pluginName, type;
  function inPlugin(stream, state) {
    var ch = stream.next();
    var peek = stream.peek();

    if (ch == "}") {
      state.tokenize = inText;
      //type = ch == ")" ? "endPlugin" : "selfclosePlugin"; inPlugin
      return "tag";
    } else if (ch == "(" || ch == ")") {
      return "bracket";
    } else if (ch == "=") {
      type = "equals";

      if (peek == ">") {
        stream.next();
        peek = stream.peek();
      }

      //here we detect values directly after equal character with no quotes
      if (!/[\'\"]/.test(peek)) {
        state.tokenize = inAttributeNoQuote();
      }
      //end detect values

      return "operator";
    } else if (/[\'\"]/.test(ch)) {
      state.tokenize = inAttribute(ch);
      return state.tokenize(stream, state);
    } else {
      stream.eatWhile(/[^\s\u00a0=\"\'\/?]/);
      return "keyword";
    }
  }

  function inAttribute(quote) {
    return function(stream, state) {
      while (!stream.eol()) {
        if (stream.next() == quote) {
          state.tokenize = inPlugin;
          break;
        }
      }
      return "string";
    };
  }

  function inAttributeNoQuote() {
    return function(stream, state) {
      while (!stream.eol()) {
        var ch = stream.next();
        var peek = stream.peek();
        if (ch == " " || ch == "," || /[ )}]/.test(peek)) {
      state.tokenize = inPlugin;
      break;
    }
  }
  return "string";
};
                     }

var curState, setStyle;
function pass() {
  for (var i = arguments.length - 1; i >= 0; i--) curState.cc.push(arguments[i]);
}

function cont() {
  pass.apply(null, arguments);
  return true;
}

function pushContext(pluginName, startOfLine) {
  var noIndent = curState.context && curState.context.noIndent;
  curState.context = {
    prev: curState.context,
    pluginName: pluginName,
    indent: curState.indented,
    startOfLine: startOfLine,
    noIndent: noIndent
  };
}

function popContext() {
  if (curState.context) curState.context = curState.context.prev;
}

function element(type) {
  if (type == "openPlugin") {curState.pluginName = pluginName; return cont(attributes, endplugin(curState.startOfLine));}
  else if (type == "closePlugin") {
    var err = false;
    if (curState.context) {
      err = curState.context.pluginName != pluginName;
      popContext();
    } else {
      err = true;
    }
    if (err) setStyle = "error";
    return cont(endcloseplugin(err));
  }
  else if (type == "string") {
    if (!curState.context || curState.context.name != "!cdata") pushContext("!cdata");
    if (curState.tokenize == inText) popContext();
    return cont();
  }
  else return cont();
}

function endplugin(startOfLine) {
  return function(type) {
    if (
      type == "selfclosePlugin" ||
        type == "endPlugin"
    )
      return cont();
    if (type == "endPlugin") {pushContext(curState.pluginName, startOfLine); return cont();}
    return cont();
  };
}

function endcloseplugin(err) {
  return function(type) {
    if (err) setStyle = "error";
    if (type == "endPlugin") return cont();
    return pass();
  };
}

function attributes(type) {
  if (type == "keyword") {setStyle = "attribute"; return cont(attributes);}
  if (type == "equals") return cont(attvalue, attributes);
  return pass();
}
function attvalue(type) {
  if (type == "keyword") {setStyle = "string"; return cont();}
  if (type == "string") return cont(attvaluemaybe);
  return pass();
}
function attvaluemaybe(type) {
  if (type == "string") return cont(attvaluemaybe);
  else return pass();
}
return {
  startState: function() {
    return {tokenize: inText, cc: [], indented: 0, startOfLine: true, pluginName: null, context: null};
  },
  token: function(stream, state) {
    if (stream.sol()) {
      state.startOfLine = true;
      state.indented = stream.indentation();
    }
    if (stream.eatSpace()) return null;

    setStyle = type = pluginName = null;
    var style = state.tokenize(stream, state);
    if ((style || type) && style != "comment") {
      curState = state;
      while (true) {
        var comb = state.cc.pop() || element;
        if (comb(type || style)) break;
      }
    }
    state.startOfLine = false;
    return setStyle || style;
  },
  indent: function(state, textAfter) {
    var context = state.context;
    if (context && context.noIndent) return 0;
    if (context && /^{\//.test(textAfter))
        context = context.prev;
    while (context && !context.startOfLine)
        context = context.prev;
    if (context) return context.indent + indentUnit;
    else return 0;
  },
  electricChars: "/"
};
});

CodeMirror.defineMIME("text/tiki", "tiki");

});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/toml/toml.js":
/*!**********************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/toml/toml.js ***!
  \**********************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"));
  else {}
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode("toml", function () {
  return {
    startState: function () {
      return {
        inString: false,
        stringType: "",
        lhs: true,
        inArray: 0
      };
    },
    token: function (stream, state) {
      //check for state changes
      if (!state.inString && ((stream.peek() == '"') || (stream.peek() == "'"))) {
        state.stringType = stream.peek();
        stream.next(); // Skip quote
        state.inString = true; // Update state
      }
      if (stream.sol() && state.inArray === 0) {
        state.lhs = true;
      }
      //return state
      if (state.inString) {
        while (state.inString && !stream.eol()) {
          if (stream.peek() === state.stringType) {
            stream.next(); // Skip quote
            state.inString = false; // Clear flag
          } else if (stream.peek() === '\\') {
            stream.next();
            stream.next();
          } else {
            stream.match(/^.[^\\\"\']*/);
          }
        }
        return state.lhs ? "property string" : "string"; // Token style
      } else if (state.inArray && stream.peek() === ']') {
        stream.next();
        state.inArray--;
        return 'bracket';
      } else if (state.lhs && stream.peek() === '[' && stream.skipTo(']')) {
        stream.next();//skip closing ]
        // array of objects has an extra open & close []
        if (stream.peek() === ']') stream.next();
        return "atom";
      } else if (stream.peek() === "#") {
        stream.skipToEnd();
        return "comment";
      } else if (stream.eatSpace()) {
        return null;
      } else if (state.lhs && stream.eatWhile(function (c) { return c != '=' && c != ' '; })) {
        return "property";
      } else if (state.lhs && stream.peek() === "=") {
        stream.next();
        state.lhs = false;
        return null;
      } else if (!state.lhs && stream.match(/^\d\d\d\d[\d\-\:\.T]*Z/)) {
        return 'atom'; //date
      } else if (!state.lhs && (stream.match('true') || stream.match('false'))) {
        return 'atom';
      } else if (!state.lhs && stream.peek() === '[') {
        state.inArray++;
        stream.next();
        return 'bracket';
      } else if (!state.lhs && stream.match(/^\-?\d+(?:\.\d+)?/)) {
        return 'number';
      } else if (!stream.eatSpace()) {
        stream.next();
      }
      return null;
    }
  };
});

CodeMirror.defineMIME('text/x-toml', 'toml');

});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/tornado/tornado.js":
/*!****************************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/tornado/tornado.js ***!
  \****************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"), __webpack_require__(/*! ../htmlmixed/htmlmixed */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/htmlmixed/htmlmixed.js"),
        __webpack_require__(/*! ../../addon/mode/overlay */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/addon/mode/overlay.js"));
  else {}
})(function(CodeMirror) {
  "use strict";

  CodeMirror.defineMode("tornado:inner", function() {
    var keywords = ["and","as","assert","autoescape","block","break","class","comment","context",
                    "continue","datetime","def","del","elif","else","end","escape","except",
                    "exec","extends","false","finally","for","from","global","if","import","in",
                    "include","is","json_encode","lambda","length","linkify","load","module",
                    "none","not","or","pass","print","put","raise","raw","return","self","set",
                    "squeeze","super","true","try","url_escape","while","with","without","xhtml_escape","yield"];
    keywords = new RegExp("^((" + keywords.join(")|(") + "))\\b");

    function tokenBase (stream, state) {
      stream.eatWhile(/[^\{]/);
      var ch = stream.next();
      if (ch == "{") {
        if (ch = stream.eat(/\{|%|#/)) {
          state.tokenize = inTag(ch);
          return "tag";
        }
      }
    }
    function inTag (close) {
      if (close == "{") {
        close = "}";
      }
      return function (stream, state) {
        var ch = stream.next();
        if ((ch == close) && stream.eat("}")) {
          state.tokenize = tokenBase;
          return "tag";
        }
        if (stream.match(keywords)) {
          return "keyword";
        }
        return close == "#" ? "comment" : "string";
      };
    }
    return {
      startState: function () {
        return {tokenize: tokenBase};
      },
      token: function (stream, state) {
        return state.tokenize(stream, state);
      }
    };
  });

  CodeMirror.defineMode("tornado", function(config) {
    var htmlBase = CodeMirror.getMode(config, "text/html");
    var tornadoInner = CodeMirror.getMode(config, "tornado:inner");
    return CodeMirror.overlayMode(htmlBase, tornadoInner);
  });

  CodeMirror.defineMIME("text/x-tornado", "tornado");
});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/troff/troff.js":
/*!************************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/troff/troff.js ***!
  \************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function(mod) {
  if (true)
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"));
  else {}
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode('troff', function() {

  var words = {};

  function tokenBase(stream) {
    if (stream.eatSpace()) return null;

    var sol = stream.sol();
    var ch = stream.next();

    if (ch === '\\') {
      if (stream.match('fB') || stream.match('fR') || stream.match('fI') ||
          stream.match('u')  || stream.match('d')  ||
          stream.match('%')  || stream.match('&')) {
        return 'string';
      }
      if (stream.match('m[')) {
        stream.skipTo(']');
        stream.next();
        return 'string';
      }
      if (stream.match('s+') || stream.match('s-')) {
        stream.eatWhile(/[\d-]/);
        return 'string';
      }
      if (stream.match('\(') || stream.match('*\(')) {
        stream.eatWhile(/[\w-]/);
        return 'string';
      }
      return 'string';
    }
    if (sol && (ch === '.' || ch === '\'')) {
      if (stream.eat('\\') && stream.eat('\"')) {
        stream.skipToEnd();
        return 'comment';
      }
    }
    if (sol && ch === '.') {
      if (stream.match('B ') || stream.match('I ') || stream.match('R ')) {
        return 'attribute';
      }
      if (stream.match('TH ') || stream.match('SH ') || stream.match('SS ') || stream.match('HP ')) {
        stream.skipToEnd();
        return 'quote';
      }
      if ((stream.match(/[A-Z]/) && stream.match(/[A-Z]/)) || (stream.match(/[a-z]/) && stream.match(/[a-z]/))) {
        return 'attribute';
      }
    }
    stream.eatWhile(/[\w-]/);
    var cur = stream.current();
    return words.hasOwnProperty(cur) ? words[cur] : null;
  }

  function tokenize(stream, state) {
    return (state.tokens[0] || tokenBase) (stream, state);
  };

  return {
    startState: function() {return {tokens:[]};},
    token: function(stream, state) {
      return tokenize(stream, state);
    }
  };
});

CodeMirror.defineMIME('text/troff', 'troff');
CodeMirror.defineMIME('text/x-troff', 'troff');
CodeMirror.defineMIME('application/x-troff', 'troff');

});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/ttcn-cfg/ttcn-cfg.js":
/*!******************************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/ttcn-cfg/ttcn-cfg.js ***!
  \******************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"));
  else {}
})(function(CodeMirror) {
  "use strict";

  CodeMirror.defineMode("ttcn-cfg", function(config, parserConfig) {
    var indentUnit = config.indentUnit,
        keywords = parserConfig.keywords || {},
        fileNCtrlMaskOptions = parserConfig.fileNCtrlMaskOptions || {},
        externalCommands = parserConfig.externalCommands || {},
        multiLineStrings = parserConfig.multiLineStrings,
        indentStatements = parserConfig.indentStatements !== false;
    var isOperatorChar = /[\|]/;
    var curPunc;

    function tokenBase(stream, state) {
      var ch = stream.next();
      if (ch == '"' || ch == "'") {
        state.tokenize = tokenString(ch);
        return state.tokenize(stream, state);
      }
      if (/[:=]/.test(ch)) {
        curPunc = ch;
        return "punctuation";
      }
      if (ch == "#"){
        stream.skipToEnd();
        return "comment";
      }
      if (/\d/.test(ch)) {
        stream.eatWhile(/[\w\.]/);
        return "number";
      }
      if (isOperatorChar.test(ch)) {
        stream.eatWhile(isOperatorChar);
        return "operator";
      }
      if (ch == "["){
        stream.eatWhile(/[\w_\]]/);
        return "number sectionTitle";
      }

      stream.eatWhile(/[\w\$_]/);
      var cur = stream.current();
      if (keywords.propertyIsEnumerable(cur)) return "keyword";
      if (fileNCtrlMaskOptions.propertyIsEnumerable(cur))
        return "negative fileNCtrlMaskOptions";
      if (externalCommands.propertyIsEnumerable(cur)) return "negative externalCommands";

      return "variable";
    }

    function tokenString(quote) {
      return function(stream, state) {
        var escaped = false, next, end = false;
        while ((next = stream.next()) != null) {
          if (next == quote && !escaped){
            var afterNext = stream.peek();
            //look if the character if the quote is like the B in '10100010'B
            if (afterNext){
              afterNext = afterNext.toLowerCase();
              if(afterNext == "b" || afterNext == "h" || afterNext == "o")
                stream.next();
            }
            end = true; break;
          }
          escaped = !escaped && next == "\\";
        }
        if (end || !(escaped || multiLineStrings))
          state.tokenize = null;
        return "string";
      };
    }

    function Context(indented, column, type, align, prev) {
      this.indented = indented;
      this.column = column;
      this.type = type;
      this.align = align;
      this.prev = prev;
    }
    function pushContext(state, col, type) {
      var indent = state.indented;
      if (state.context && state.context.type == "statement")
        indent = state.context.indented;
      return state.context = new Context(indent, col, type, null, state.context);
    }
    function popContext(state) {
      var t = state.context.type;
      if (t == ")" || t == "]" || t == "}")
        state.indented = state.context.indented;
      return state.context = state.context.prev;
    }

    //Interface
    return {
      startState: function(basecolumn) {
        return {
          tokenize: null,
          context: new Context((basecolumn || 0) - indentUnit, 0, "top", false),
          indented: 0,
          startOfLine: true
        };
      },

      token: function(stream, state) {
        var ctx = state.context;
        if (stream.sol()) {
          if (ctx.align == null) ctx.align = false;
          state.indented = stream.indentation();
          state.startOfLine = true;
        }
        if (stream.eatSpace()) return null;
        curPunc = null;
        var style = (state.tokenize || tokenBase)(stream, state);
        if (style == "comment") return style;
        if (ctx.align == null) ctx.align = true;

        if ((curPunc == ";" || curPunc == ":" || curPunc == ",")
            && ctx.type == "statement"){
          popContext(state);
        }
        else if (curPunc == "{") pushContext(state, stream.column(), "}");
        else if (curPunc == "[") pushContext(state, stream.column(), "]");
        else if (curPunc == "(") pushContext(state, stream.column(), ")");
        else if (curPunc == "}") {
          while (ctx.type == "statement") ctx = popContext(state);
          if (ctx.type == "}") ctx = popContext(state);
          while (ctx.type == "statement") ctx = popContext(state);
        }
        else if (curPunc == ctx.type) popContext(state);
        else if (indentStatements && (((ctx.type == "}" || ctx.type == "top")
            && curPunc != ';') || (ctx.type == "statement"
            && curPunc == "newstatement")))
          pushContext(state, stream.column(), "statement");
        state.startOfLine = false;
        return style;
      },

      electricChars: "{}",
      lineComment: "#",
      fold: "brace"
    };
  });

  function words(str) {
    var obj = {}, words = str.split(" ");
    for (var i = 0; i < words.length; ++i)
      obj[words[i]] = true;
    return obj;
  }

  CodeMirror.defineMIME("text/x-ttcn-cfg", {
    name: "ttcn-cfg",
    keywords: words("Yes No LogFile FileMask ConsoleMask AppendFile" +
    " TimeStampFormat LogEventTypes SourceInfoFormat" +
    " LogEntityName LogSourceInfo DiskFullAction" +
    " LogFileNumber LogFileSize MatchingHints Detailed" +
    " Compact SubCategories Stack Single None Seconds" +
    " DateTime Time Stop Error Retry Delete TCPPort KillTimer" +
    " NumHCs UnixSocketsEnabled LocalAddress"),
    fileNCtrlMaskOptions: words("TTCN_EXECUTOR TTCN_ERROR TTCN_WARNING" +
    " TTCN_PORTEVENT TTCN_TIMEROP TTCN_VERDICTOP" +
    " TTCN_DEFAULTOP TTCN_TESTCASE TTCN_ACTION" +
    " TTCN_USER TTCN_FUNCTION TTCN_STATISTICS" +
    " TTCN_PARALLEL TTCN_MATCHING TTCN_DEBUG" +
    " EXECUTOR ERROR WARNING PORTEVENT TIMEROP" +
    " VERDICTOP DEFAULTOP TESTCASE ACTION USER" +
    " FUNCTION STATISTICS PARALLEL MATCHING DEBUG" +
    " LOG_ALL LOG_NOTHING ACTION_UNQUALIFIED" +
    " DEBUG_ENCDEC DEBUG_TESTPORT" +
    " DEBUG_UNQUALIFIED DEFAULTOP_ACTIVATE" +
    " DEFAULTOP_DEACTIVATE DEFAULTOP_EXIT" +
    " DEFAULTOP_UNQUALIFIED ERROR_UNQUALIFIED" +
    " EXECUTOR_COMPONENT EXECUTOR_CONFIGDATA" +
    " EXECUTOR_EXTCOMMAND EXECUTOR_LOGOPTIONS" +
    " EXECUTOR_RUNTIME EXECUTOR_UNQUALIFIED" +
    " FUNCTION_RND FUNCTION_UNQUALIFIED" +
    " MATCHING_DONE MATCHING_MCSUCCESS" +
    " MATCHING_MCUNSUCC MATCHING_MMSUCCESS" +
    " MATCHING_MMUNSUCC MATCHING_PCSUCCESS" +
    " MATCHING_PCUNSUCC MATCHING_PMSUCCESS" +
    " MATCHING_PMUNSUCC MATCHING_PROBLEM" +
    " MATCHING_TIMEOUT MATCHING_UNQUALIFIED" +
    " PARALLEL_PORTCONN PARALLEL_PORTMAP" +
    " PARALLEL_PTC PARALLEL_UNQUALIFIED" +
    " PORTEVENT_DUALRECV PORTEVENT_DUALSEND" +
    " PORTEVENT_MCRECV PORTEVENT_MCSEND" +
    " PORTEVENT_MMRECV PORTEVENT_MMSEND" +
    " PORTEVENT_MQUEUE PORTEVENT_PCIN" +
    " PORTEVENT_PCOUT PORTEVENT_PMIN" +
    " PORTEVENT_PMOUT PORTEVENT_PQUEUE" +
    " PORTEVENT_STATE PORTEVENT_UNQUALIFIED" +
    " STATISTICS_UNQUALIFIED STATISTICS_VERDICT" +
    " TESTCASE_FINISH TESTCASE_START" +
    " TESTCASE_UNQUALIFIED TIMEROP_GUARD" +
    " TIMEROP_READ TIMEROP_START TIMEROP_STOP" +
    " TIMEROP_TIMEOUT TIMEROP_UNQUALIFIED" +
    " USER_UNQUALIFIED VERDICTOP_FINAL" +
    " VERDICTOP_GETVERDICT VERDICTOP_SETVERDICT" +
    " VERDICTOP_UNQUALIFIED WARNING_UNQUALIFIED"),
    externalCommands: words("BeginControlPart EndControlPart BeginTestCase" +
    " EndTestCase"),
    multiLineStrings: true
  });
});

/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/ttcn/ttcn.js":
/*!**********************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/ttcn/ttcn.js ***!
  \**********************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"));
  else {}
})(function(CodeMirror) {
  "use strict";

  CodeMirror.defineMode("ttcn", function(config, parserConfig) {
    var indentUnit = config.indentUnit,
        keywords = parserConfig.keywords || {},
        builtin = parserConfig.builtin || {},
        timerOps = parserConfig.timerOps || {},
        portOps  = parserConfig.portOps || {},
        configOps = parserConfig.configOps || {},
        verdictOps = parserConfig.verdictOps || {},
        sutOps = parserConfig.sutOps || {},
        functionOps = parserConfig.functionOps || {},

        verdictConsts = parserConfig.verdictConsts || {},
        booleanConsts = parserConfig.booleanConsts || {},
        otherConsts   = parserConfig.otherConsts || {},

        types = parserConfig.types || {},
        visibilityModifiers = parserConfig.visibilityModifiers || {},
        templateMatch = parserConfig.templateMatch || {},
        multiLineStrings = parserConfig.multiLineStrings,
        indentStatements = parserConfig.indentStatements !== false;
    var isOperatorChar = /[+\-*&@=<>!\/]/;
    var curPunc;

    function tokenBase(stream, state) {
      var ch = stream.next();

      if (ch == '"' || ch == "'") {
        state.tokenize = tokenString(ch);
        return state.tokenize(stream, state);
      }
      if (/[\[\]{}\(\),;\\:\?\.]/.test(ch)) {
        curPunc = ch;
        return "punctuation";
      }
      if (ch == "#"){
        stream.skipToEnd();
        return "atom preprocessor";
      }
      if (ch == "%"){
        stream.eatWhile(/\b/);
        return "atom ttcn3Macros";
      }
      if (/\d/.test(ch)) {
        stream.eatWhile(/[\w\.]/);
        return "number";
      }
      if (ch == "/") {
        if (stream.eat("*")) {
          state.tokenize = tokenComment;
          return tokenComment(stream, state);
        }
        if (stream.eat("/")) {
          stream.skipToEnd();
          return "comment";
        }
      }
      if (isOperatorChar.test(ch)) {
        if(ch == "@"){
          if(stream.match("try") || stream.match("catch")
              || stream.match("lazy")){
            return "keyword";
          }
        }
        stream.eatWhile(isOperatorChar);
        return "operator";
      }
      stream.eatWhile(/[\w\$_\xa1-\uffff]/);
      var cur = stream.current();

      if (keywords.propertyIsEnumerable(cur)) return "keyword";
      if (builtin.propertyIsEnumerable(cur)) return "builtin";

      if (timerOps.propertyIsEnumerable(cur)) return "def timerOps";
      if (configOps.propertyIsEnumerable(cur)) return "def configOps";
      if (verdictOps.propertyIsEnumerable(cur)) return "def verdictOps";
      if (portOps.propertyIsEnumerable(cur)) return "def portOps";
      if (sutOps.propertyIsEnumerable(cur)) return "def sutOps";
      if (functionOps.propertyIsEnumerable(cur)) return "def functionOps";

      if (verdictConsts.propertyIsEnumerable(cur)) return "string verdictConsts";
      if (booleanConsts.propertyIsEnumerable(cur)) return "string booleanConsts";
      if (otherConsts.propertyIsEnumerable(cur)) return "string otherConsts";

      if (types.propertyIsEnumerable(cur)) return "builtin types";
      if (visibilityModifiers.propertyIsEnumerable(cur))
        return "builtin visibilityModifiers";
      if (templateMatch.propertyIsEnumerable(cur)) return "atom templateMatch";

      return "variable";
    }

    function tokenString(quote) {
      return function(stream, state) {
        var escaped = false, next, end = false;
        while ((next = stream.next()) != null) {
          if (next == quote && !escaped){
            var afterQuote = stream.peek();
            //look if the character after the quote is like the B in '10100010'B
            if (afterQuote){
              afterQuote = afterQuote.toLowerCase();
              if(afterQuote == "b" || afterQuote == "h" || afterQuote == "o")
                stream.next();
            }
            end = true; break;
          }
          escaped = !escaped && next == "\\";
        }
        if (end || !(escaped || multiLineStrings))
          state.tokenize = null;
        return "string";
      };
    }

    function tokenComment(stream, state) {
      var maybeEnd = false, ch;
      while (ch = stream.next()) {
        if (ch == "/" && maybeEnd) {
          state.tokenize = null;
          break;
        }
        maybeEnd = (ch == "*");
      }
      return "comment";
    }

    function Context(indented, column, type, align, prev) {
      this.indented = indented;
      this.column = column;
      this.type = type;
      this.align = align;
      this.prev = prev;
    }

    function pushContext(state, col, type) {
      var indent = state.indented;
      if (state.context && state.context.type == "statement")
        indent = state.context.indented;
      return state.context = new Context(indent, col, type, null, state.context);
    }

    function popContext(state) {
      var t = state.context.type;
      if (t == ")" || t == "]" || t == "}")
        state.indented = state.context.indented;
      return state.context = state.context.prev;
    }

    //Interface
    return {
      startState: function(basecolumn) {
        return {
          tokenize: null,
          context: new Context((basecolumn || 0) - indentUnit, 0, "top", false),
          indented: 0,
          startOfLine: true
        };
      },

      token: function(stream, state) {
        var ctx = state.context;
        if (stream.sol()) {
          if (ctx.align == null) ctx.align = false;
          state.indented = stream.indentation();
          state.startOfLine = true;
        }
        if (stream.eatSpace()) return null;
        curPunc = null;
        var style = (state.tokenize || tokenBase)(stream, state);
        if (style == "comment") return style;
        if (ctx.align == null) ctx.align = true;

        if ((curPunc == ";" || curPunc == ":" || curPunc == ",")
            && ctx.type == "statement"){
          popContext(state);
        }
        else if (curPunc == "{") pushContext(state, stream.column(), "}");
        else if (curPunc == "[") pushContext(state, stream.column(), "]");
        else if (curPunc == "(") pushContext(state, stream.column(), ")");
        else if (curPunc == "}") {
          while (ctx.type == "statement") ctx = popContext(state);
          if (ctx.type == "}") ctx = popContext(state);
          while (ctx.type == "statement") ctx = popContext(state);
        }
        else if (curPunc == ctx.type) popContext(state);
        else if (indentStatements &&
            (((ctx.type == "}" || ctx.type == "top") && curPunc != ';') ||
            (ctx.type == "statement" && curPunc == "newstatement")))
          pushContext(state, stream.column(), "statement");

        state.startOfLine = false;

        return style;
      },

      electricChars: "{}",
      blockCommentStart: "/*",
      blockCommentEnd: "*/",
      lineComment: "//",
      fold: "brace"
    };
  });

  function words(str) {
    var obj = {}, words = str.split(" ");
    for (var i = 0; i < words.length; ++i) obj[words[i]] = true;
    return obj;
  }

  function def(mimes, mode) {
    if (typeof mimes == "string") mimes = [mimes];
    var words = [];
    function add(obj) {
      if (obj) for (var prop in obj) if (obj.hasOwnProperty(prop))
        words.push(prop);
    }

    add(mode.keywords);
    add(mode.builtin);
    add(mode.timerOps);
    add(mode.portOps);

    if (words.length) {
      mode.helperType = mimes[0];
      CodeMirror.registerHelper("hintWords", mimes[0], words);
    }

    for (var i = 0; i < mimes.length; ++i)
      CodeMirror.defineMIME(mimes[i], mode);
  }

  def(["text/x-ttcn", "text/x-ttcn3", "text/x-ttcnpp"], {
    name: "ttcn",
    keywords: words("activate address alive all alt altstep and and4b any" +
    " break case component const continue control deactivate" +
    " display do else encode enumerated except exception" +
    " execute extends extension external for from function" +
    " goto group if import in infinity inout interleave" +
    " label language length log match message mixed mod" +
    " modifies module modulepar mtc noblock not not4b nowait" +
    " of on optional or or4b out override param pattern port" +
    " procedure record recursive rem repeat return runs select" +
    " self sender set signature system template testcase to" +
    " type union value valueof var variant while with xor xor4b"),
    builtin: words("bit2hex bit2int bit2oct bit2str char2int char2oct encvalue" +
    " decomp decvalue float2int float2str hex2bit hex2int" +
    " hex2oct hex2str int2bit int2char int2float int2hex" +
    " int2oct int2str int2unichar isbound ischosen ispresent" +
    " isvalue lengthof log2str oct2bit oct2char oct2hex oct2int" +
    " oct2str regexp replace rnd sizeof str2bit str2float" +
    " str2hex str2int str2oct substr unichar2int unichar2char" +
    " enum2int"),
    types: words("anytype bitstring boolean char charstring default float" +
    " hexstring integer objid octetstring universal verdicttype timer"),
    timerOps: words("read running start stop timeout"),
    portOps: words("call catch check clear getcall getreply halt raise receive" +
    " reply send trigger"),
    configOps: words("create connect disconnect done kill killed map unmap"),
    verdictOps: words("getverdict setverdict"),
    sutOps: words("action"),
    functionOps: words("apply derefers refers"),

    verdictConsts: words("error fail inconc none pass"),
    booleanConsts: words("true false"),
    otherConsts: words("null NULL omit"),

    visibilityModifiers: words("private public friend"),
    templateMatch: words("complement ifpresent subset superset permutation"),
    multiLineStrings: true
  });
});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/turtle/turtle.js":
/*!**************************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/turtle/turtle.js ***!
  \**************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"));
  else {}
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode("turtle", function(config) {
  var indentUnit = config.indentUnit;
  var curPunc;

  function wordRegexp(words) {
    return new RegExp("^(?:" + words.join("|") + ")$", "i");
  }
  var ops = wordRegexp([]);
  var keywords = wordRegexp(["@prefix", "@base", "a"]);
  var operatorChars = /[*+\-<>=&|]/;

  function tokenBase(stream, state) {
    var ch = stream.next();
    curPunc = null;
    if (ch == "<" && !stream.match(/^[\s\u00a0=]/, false)) {
      stream.match(/^[^\s\u00a0>]*>?/);
      return "atom";
    }
    else if (ch == "\"" || ch == "'") {
      state.tokenize = tokenLiteral(ch);
      return state.tokenize(stream, state);
    }
    else if (/[{}\(\),\.;\[\]]/.test(ch)) {
      curPunc = ch;
      return null;
    }
    else if (ch == "#") {
      stream.skipToEnd();
      return "comment";
    }
    else if (operatorChars.test(ch)) {
      stream.eatWhile(operatorChars);
      return null;
    }
    else if (ch == ":") {
          return "operator";
        } else {
      stream.eatWhile(/[_\w\d]/);
      if(stream.peek() == ":") {
        return "variable-3";
      } else {
             var word = stream.current();

             if(keywords.test(word)) {
                        return "meta";
             }

             if(ch >= "A" && ch <= "Z") {
                    return "comment";
                 } else {
                        return "keyword";
                 }
      }
      var word = stream.current();
      if (ops.test(word))
        return null;
      else if (keywords.test(word))
        return "meta";
      else
        return "variable";
    }
  }

  function tokenLiteral(quote) {
    return function(stream, state) {
      var escaped = false, ch;
      while ((ch = stream.next()) != null) {
        if (ch == quote && !escaped) {
          state.tokenize = tokenBase;
          break;
        }
        escaped = !escaped && ch == "\\";
      }
      return "string";
    };
  }

  function pushContext(state, type, col) {
    state.context = {prev: state.context, indent: state.indent, col: col, type: type};
  }
  function popContext(state) {
    state.indent = state.context.indent;
    state.context = state.context.prev;
  }

  return {
    startState: function() {
      return {tokenize: tokenBase,
              context: null,
              indent: 0,
              col: 0};
    },

    token: function(stream, state) {
      if (stream.sol()) {
        if (state.context && state.context.align == null) state.context.align = false;
        state.indent = stream.indentation();
      }
      if (stream.eatSpace()) return null;
      var style = state.tokenize(stream, state);

      if (style != "comment" && state.context && state.context.align == null && state.context.type != "pattern") {
        state.context.align = true;
      }

      if (curPunc == "(") pushContext(state, ")", stream.column());
      else if (curPunc == "[") pushContext(state, "]", stream.column());
      else if (curPunc == "{") pushContext(state, "}", stream.column());
      else if (/[\]\}\)]/.test(curPunc)) {
        while (state.context && state.context.type == "pattern") popContext(state);
        if (state.context && curPunc == state.context.type) popContext(state);
      }
      else if (curPunc == "." && state.context && state.context.type == "pattern") popContext(state);
      else if (/atom|string|variable/.test(style) && state.context) {
        if (/[\}\]]/.test(state.context.type))
          pushContext(state, "pattern", stream.column());
        else if (state.context.type == "pattern" && !state.context.align) {
          state.context.align = true;
          state.context.col = stream.column();
        }
      }

      return style;
    },

    indent: function(state, textAfter) {
      var firstChar = textAfter && textAfter.charAt(0);
      var context = state.context;
      if (/[\]\}]/.test(firstChar))
        while (context && context.type == "pattern") context = context.prev;

      var closing = context && firstChar == context.type;
      if (!context)
        return 0;
      else if (context.type == "pattern")
        return context.col;
      else if (context.align)
        return context.col + (closing ? 0 : 1);
      else
        return context.indent + (closing ? 0 : indentUnit);
    },

    lineComment: "#"
  };
});

CodeMirror.defineMIME("text/turtle", "turtle");

});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/twig/twig.js":
/*!**********************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/twig/twig.js ***!
  \**********************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"),  __webpack_require__(/*! ../../addon/mode/multiplex */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/addon/mode/multiplex.js"));
  else {}
})(function(CodeMirror) {
  "use strict";

  CodeMirror.defineMode("twig:inner", function() {
    var keywords = ["and", "as", "autoescape", "endautoescape", "block", "do", "endblock", "else", "elseif", "extends", "for", "endfor", "embed", "endembed", "filter", "endfilter", "flush", "from", "if", "endif", "in", "is", "include", "import", "not", "or", "set", "spaceless", "endspaceless", "with", "endwith", "trans", "endtrans", "blocktrans", "endblocktrans", "macro", "endmacro", "use", "verbatim", "endverbatim"],
        operator = /^[+\-*&%=<>!?|~^]/,
        sign = /^[:\[\(\{]/,
        atom = ["true", "false", "null", "empty", "defined", "divisibleby", "divisible by", "even", "odd", "iterable", "sameas", "same as"],
        number = /^(\d[+\-\*\/])?\d+(\.\d+)?/;

    keywords = new RegExp("((" + keywords.join(")|(") + "))\\b");
    atom = new RegExp("((" + atom.join(")|(") + "))\\b");

    function tokenBase (stream, state) {
      var ch = stream.peek();

      //Comment
      if (state.incomment) {
        if (!stream.skipTo("#}")) {
          stream.skipToEnd();
        } else {
          stream.eatWhile(/\#|}/);
          state.incomment = false;
        }
        return "comment";
      //Tag
      } else if (state.intag) {
        //After operator
        if (state.operator) {
          state.operator = false;
          if (stream.match(atom)) {
            return "atom";
          }
          if (stream.match(number)) {
            return "number";
          }
        }
        //After sign
        if (state.sign) {
          state.sign = false;
          if (stream.match(atom)) {
            return "atom";
          }
          if (stream.match(number)) {
            return "number";
          }
        }

        if (state.instring) {
          if (ch == state.instring) {
            state.instring = false;
          }
          stream.next();
          return "string";
        } else if (ch == "'" || ch == '"') {
          state.instring = ch;
          stream.next();
          return "string";
        } else if (stream.match(state.intag + "}") || stream.eat("-") && stream.match(state.intag + "}")) {
          state.intag = false;
          return "tag";
        } else if (stream.match(operator)) {
          state.operator = true;
          return "operator";
        } else if (stream.match(sign)) {
          state.sign = true;
        } else {
          if (stream.eat(" ") || stream.sol()) {
            if (stream.match(keywords)) {
              return "keyword";
            }
            if (stream.match(atom)) {
              return "atom";
            }
            if (stream.match(number)) {
              return "number";
            }
            if (stream.sol()) {
              stream.next();
            }
          } else {
            stream.next();
          }

        }
        return "variable";
      } else if (stream.eat("{")) {
        if (stream.eat("#")) {
          state.incomment = true;
          if (!stream.skipTo("#}")) {
            stream.skipToEnd();
          } else {
            stream.eatWhile(/\#|}/);
            state.incomment = false;
          }
          return "comment";
        //Open tag
        } else if (ch = stream.eat(/\{|%/)) {
          //Cache close tag
          state.intag = ch;
          if (ch == "{") {
            state.intag = "}";
          }
          stream.eat("-");
          return "tag";
        }
      }
      stream.next();
    };

    return {
      startState: function () {
        return {};
      },
      token: function (stream, state) {
        return tokenBase(stream, state);
      }
    };
  });

  CodeMirror.defineMode("twig", function(config, parserConfig) {
    var twigInner = CodeMirror.getMode(config, "twig:inner");
    if (!parserConfig || !parserConfig.base) return twigInner;
    return CodeMirror.multiplexingMode(
      CodeMirror.getMode(config, parserConfig.base), {
        open: /\{[{#%]/, close: /[}#%]\}/, mode: twigInner, parseDelimiters: true
      }
    );
  });
  CodeMirror.defineMIME("text/x-twig", "twig");
});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/vb/vb.js":
/*!******************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/vb/vb.js ***!
  \******************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"));
  else {}
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode("vb", function(conf, parserConf) {
    var ERRORCLASS = 'error';

    function wordRegexp(words) {
        return new RegExp("^((" + words.join(")|(") + "))\\b", "i");
    }

    var singleOperators = new RegExp("^[\\+\\-\\*/%&\\\\|\\^~<>!]");
    var singleDelimiters = new RegExp('^[\\(\\)\\[\\]\\{\\}@,:`=;\\.]');
    var doubleOperators = new RegExp("^((==)|(<>)|(<=)|(>=)|(<>)|(<<)|(>>)|(//)|(\\*\\*))");
    var doubleDelimiters = new RegExp("^((\\+=)|(\\-=)|(\\*=)|(%=)|(/=)|(&=)|(\\|=)|(\\^=))");
    var tripleDelimiters = new RegExp("^((//=)|(>>=)|(<<=)|(\\*\\*=))");
    var identifiers = new RegExp("^[_A-Za-z][_A-Za-z0-9]*");

    var openingKeywords = ['class','module', 'sub','enum','select','while','if','function',  'get','set','property', 'try'];
    var middleKeywords = ['else','elseif','case', 'catch'];
    var endKeywords = ['next','loop'];

    var operatorKeywords = ['and', 'or', 'not', 'xor', 'in'];
    var wordOperators = wordRegexp(operatorKeywords);
    var commonKeywords = ['as', 'dim', 'break',  'continue','optional', 'then',  'until',
                          'goto', 'byval','byref','new','handles','property', 'return',
                          'const','private', 'protected', 'friend', 'public', 'shared', 'static', 'true','false'];
    var commontypes = ['integer','string','double','decimal','boolean','short','char', 'float','single'];

    var keywords = wordRegexp(commonKeywords);
    var types = wordRegexp(commontypes);
    var stringPrefixes = '"';

    var opening = wordRegexp(openingKeywords);
    var middle = wordRegexp(middleKeywords);
    var closing = wordRegexp(endKeywords);
    var doubleClosing = wordRegexp(['end']);
    var doOpening = wordRegexp(['do']);

    var indentInfo = null;

    CodeMirror.registerHelper("hintWords", "vb", openingKeywords.concat(middleKeywords).concat(endKeywords)
                                .concat(operatorKeywords).concat(commonKeywords).concat(commontypes));

    function indent(_stream, state) {
      state.currentIndent++;
    }

    function dedent(_stream, state) {
      state.currentIndent--;
    }
    // tokenizers
    function tokenBase(stream, state) {
        if (stream.eatSpace()) {
            return null;
        }

        var ch = stream.peek();

        // Handle Comments
        if (ch === "'") {
            stream.skipToEnd();
            return 'comment';
        }


        // Handle Number Literals
        if (stream.match(/^((&H)|(&O))?[0-9\.a-f]/i, false)) {
            var floatLiteral = false;
            // Floats
            if (stream.match(/^\d*\.\d+F?/i)) { floatLiteral = true; }
            else if (stream.match(/^\d+\.\d*F?/)) { floatLiteral = true; }
            else if (stream.match(/^\.\d+F?/)) { floatLiteral = true; }

            if (floatLiteral) {
                // Float literals may be "imaginary"
                stream.eat(/J/i);
                return 'number';
            }
            // Integers
            var intLiteral = false;
            // Hex
            if (stream.match(/^&H[0-9a-f]+/i)) { intLiteral = true; }
            // Octal
            else if (stream.match(/^&O[0-7]+/i)) { intLiteral = true; }
            // Decimal
            else if (stream.match(/^[1-9]\d*F?/)) {
                // Decimal literals may be "imaginary"
                stream.eat(/J/i);
                // TODO - Can you have imaginary longs?
                intLiteral = true;
            }
            // Zero by itself with no other piece of number.
            else if (stream.match(/^0(?![\dx])/i)) { intLiteral = true; }
            if (intLiteral) {
                // Integer literals may be "long"
                stream.eat(/L/i);
                return 'number';
            }
        }

        // Handle Strings
        if (stream.match(stringPrefixes)) {
            state.tokenize = tokenStringFactory(stream.current());
            return state.tokenize(stream, state);
        }

        // Handle operators and Delimiters
        if (stream.match(tripleDelimiters) || stream.match(doubleDelimiters)) {
            return null;
        }
        if (stream.match(doubleOperators)
            || stream.match(singleOperators)
            || stream.match(wordOperators)) {
            return 'operator';
        }
        if (stream.match(singleDelimiters)) {
            return null;
        }
        if (stream.match(doOpening)) {
            indent(stream,state);
            state.doInCurrentLine = true;
            return 'keyword';
        }
        if (stream.match(opening)) {
            if (! state.doInCurrentLine)
              indent(stream,state);
            else
              state.doInCurrentLine = false;
            return 'keyword';
        }
        if (stream.match(middle)) {
            return 'keyword';
        }

        if (stream.match(doubleClosing)) {
            dedent(stream,state);
            dedent(stream,state);
            return 'keyword';
        }
        if (stream.match(closing)) {
            dedent(stream,state);
            return 'keyword';
        }

        if (stream.match(types)) {
            return 'keyword';
        }

        if (stream.match(keywords)) {
            return 'keyword';
        }

        if (stream.match(identifiers)) {
            return 'variable';
        }

        // Handle non-detected items
        stream.next();
        return ERRORCLASS;
    }

    function tokenStringFactory(delimiter) {
        var singleline = delimiter.length == 1;
        var OUTCLASS = 'string';

        return function(stream, state) {
            while (!stream.eol()) {
                stream.eatWhile(/[^'"]/);
                if (stream.match(delimiter)) {
                    state.tokenize = tokenBase;
                    return OUTCLASS;
                } else {
                    stream.eat(/['"]/);
                }
            }
            if (singleline) {
                if (parserConf.singleLineStringErrors) {
                    return ERRORCLASS;
                } else {
                    state.tokenize = tokenBase;
                }
            }
            return OUTCLASS;
        };
    }


    function tokenLexer(stream, state) {
        var style = state.tokenize(stream, state);
        var current = stream.current();

        // Handle '.' connected identifiers
        if (current === '.') {
            style = state.tokenize(stream, state);
            if (style === 'variable') {
                return 'variable';
            } else {
                return ERRORCLASS;
            }
        }


        var delimiter_index = '[({'.indexOf(current);
        if (delimiter_index !== -1) {
            indent(stream, state );
        }
        if (indentInfo === 'dedent') {
            if (dedent(stream, state)) {
                return ERRORCLASS;
            }
        }
        delimiter_index = '])}'.indexOf(current);
        if (delimiter_index !== -1) {
            if (dedent(stream, state)) {
                return ERRORCLASS;
            }
        }

        return style;
    }

    var external = {
        electricChars:"dDpPtTfFeE ",
        startState: function() {
            return {
              tokenize: tokenBase,
              lastToken: null,
              currentIndent: 0,
              nextLineIndent: 0,
              doInCurrentLine: false


          };
        },

        token: function(stream, state) {
            if (stream.sol()) {
              state.currentIndent += state.nextLineIndent;
              state.nextLineIndent = 0;
              state.doInCurrentLine = 0;
            }
            var style = tokenLexer(stream, state);

            state.lastToken = {style:style, content: stream.current()};



            return style;
        },

        indent: function(state, textAfter) {
            var trueText = textAfter.replace(/^\s+|\s+$/g, '') ;
            if (trueText.match(closing) || trueText.match(doubleClosing) || trueText.match(middle)) return conf.indentUnit*(state.currentIndent-1);
            if(state.currentIndent < 0) return 0;
            return state.currentIndent * conf.indentUnit;
        },

        lineComment: "'"
    };
    return external;
});

CodeMirror.defineMIME("text/x-vb", "vb");

});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/vbscript/vbscript.js":
/*!******************************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/vbscript/vbscript.js ***!
  \******************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

/*
For extra ASP classic objects, initialize CodeMirror instance with this option:
    isASP: true

E.G.:
    var editor = CodeMirror.fromTextArea(document.getElementById("code"), {
        lineNumbers: true,
        isASP: true
      });
*/

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"));
  else {}
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode("vbscript", function(conf, parserConf) {
    var ERRORCLASS = 'error';

    function wordRegexp(words) {
        return new RegExp("^((" + words.join(")|(") + "))\\b", "i");
    }

    var singleOperators = new RegExp("^[\\+\\-\\*/&\\\\\\^<>=]");
    var doubleOperators = new RegExp("^((<>)|(<=)|(>=))");
    var singleDelimiters = new RegExp('^[\\.,]');
    var brakets = new RegExp('^[\\(\\)]');
    var identifiers = new RegExp("^[A-Za-z][_A-Za-z0-9]*");

    var openingKeywords = ['class','sub','select','while','if','function', 'property', 'with', 'for'];
    var middleKeywords = ['else','elseif','case'];
    var endKeywords = ['next','loop','wend'];

    var wordOperators = wordRegexp(['and', 'or', 'not', 'xor', 'is', 'mod', 'eqv', 'imp']);
    var commonkeywords = ['dim', 'redim', 'then',  'until', 'randomize',
                          'byval','byref','new','property', 'exit', 'in',
                          'const','private', 'public',
                          'get','set','let', 'stop', 'on error resume next', 'on error goto 0', 'option explicit', 'call', 'me'];

    //This list was from: http://msdn.microsoft.com/en-us/library/f8tbc79x(v=vs.84).aspx
    var atomWords = ['true', 'false', 'nothing', 'empty', 'null'];
    //This list was from: http://msdn.microsoft.com/en-us/library/3ca8tfek(v=vs.84).aspx
    var builtinFuncsWords = ['abs', 'array', 'asc', 'atn', 'cbool', 'cbyte', 'ccur', 'cdate', 'cdbl', 'chr', 'cint', 'clng', 'cos', 'csng', 'cstr', 'date', 'dateadd', 'datediff', 'datepart',
                        'dateserial', 'datevalue', 'day', 'escape', 'eval', 'execute', 'exp', 'filter', 'formatcurrency', 'formatdatetime', 'formatnumber', 'formatpercent', 'getlocale', 'getobject',
                        'getref', 'hex', 'hour', 'inputbox', 'instr', 'instrrev', 'int', 'fix', 'isarray', 'isdate', 'isempty', 'isnull', 'isnumeric', 'isobject', 'join', 'lbound', 'lcase', 'left',
                        'len', 'loadpicture', 'log', 'ltrim', 'rtrim', 'trim', 'maths', 'mid', 'minute', 'month', 'monthname', 'msgbox', 'now', 'oct', 'replace', 'rgb', 'right', 'rnd', 'round',
                        'scriptengine', 'scriptenginebuildversion', 'scriptenginemajorversion', 'scriptengineminorversion', 'second', 'setlocale', 'sgn', 'sin', 'space', 'split', 'sqr', 'strcomp',
                        'string', 'strreverse', 'tan', 'time', 'timer', 'timeserial', 'timevalue', 'typename', 'ubound', 'ucase', 'unescape', 'vartype', 'weekday', 'weekdayname', 'year'];

    //This list was from: http://msdn.microsoft.com/en-us/library/ydz4cfk3(v=vs.84).aspx
    var builtinConsts = ['vbBlack', 'vbRed', 'vbGreen', 'vbYellow', 'vbBlue', 'vbMagenta', 'vbCyan', 'vbWhite', 'vbBinaryCompare', 'vbTextCompare',
                         'vbSunday', 'vbMonday', 'vbTuesday', 'vbWednesday', 'vbThursday', 'vbFriday', 'vbSaturday', 'vbUseSystemDayOfWeek', 'vbFirstJan1', 'vbFirstFourDays', 'vbFirstFullWeek',
                         'vbGeneralDate', 'vbLongDate', 'vbShortDate', 'vbLongTime', 'vbShortTime', 'vbObjectError',
                         'vbOKOnly', 'vbOKCancel', 'vbAbortRetryIgnore', 'vbYesNoCancel', 'vbYesNo', 'vbRetryCancel', 'vbCritical', 'vbQuestion', 'vbExclamation', 'vbInformation', 'vbDefaultButton1', 'vbDefaultButton2',
                         'vbDefaultButton3', 'vbDefaultButton4', 'vbApplicationModal', 'vbSystemModal', 'vbOK', 'vbCancel', 'vbAbort', 'vbRetry', 'vbIgnore', 'vbYes', 'vbNo',
                         'vbCr', 'VbCrLf', 'vbFormFeed', 'vbLf', 'vbNewLine', 'vbNullChar', 'vbNullString', 'vbTab', 'vbVerticalTab', 'vbUseDefault', 'vbTrue', 'vbFalse',
                         'vbEmpty', 'vbNull', 'vbInteger', 'vbLong', 'vbSingle', 'vbDouble', 'vbCurrency', 'vbDate', 'vbString', 'vbObject', 'vbError', 'vbBoolean', 'vbVariant', 'vbDataObject', 'vbDecimal', 'vbByte', 'vbArray'];
    //This list was from: http://msdn.microsoft.com/en-us/library/hkc375ea(v=vs.84).aspx
    var builtinObjsWords = ['WScript', 'err', 'debug', 'RegExp'];
    var knownProperties = ['description', 'firstindex', 'global', 'helpcontext', 'helpfile', 'ignorecase', 'length', 'number', 'pattern', 'source', 'value', 'count'];
    var knownMethods = ['clear', 'execute', 'raise', 'replace', 'test', 'write', 'writeline', 'close', 'open', 'state', 'eof', 'update', 'addnew', 'end', 'createobject', 'quit'];

    var aspBuiltinObjsWords = ['server', 'response', 'request', 'session', 'application'];
    var aspKnownProperties = ['buffer', 'cachecontrol', 'charset', 'contenttype', 'expires', 'expiresabsolute', 'isclientconnected', 'pics', 'status', //response
                              'clientcertificate', 'cookies', 'form', 'querystring', 'servervariables', 'totalbytes', //request
                              'contents', 'staticobjects', //application
                              'codepage', 'lcid', 'sessionid', 'timeout', //session
                              'scripttimeout']; //server
    var aspKnownMethods = ['addheader', 'appendtolog', 'binarywrite', 'end', 'flush', 'redirect', //response
                           'binaryread', //request
                           'remove', 'removeall', 'lock', 'unlock', //application
                           'abandon', //session
                           'getlasterror', 'htmlencode', 'mappath', 'transfer', 'urlencode']; //server

    var knownWords = knownMethods.concat(knownProperties);

    builtinObjsWords = builtinObjsWords.concat(builtinConsts);

    if (conf.isASP){
        builtinObjsWords = builtinObjsWords.concat(aspBuiltinObjsWords);
        knownWords = knownWords.concat(aspKnownMethods, aspKnownProperties);
    };

    var keywords = wordRegexp(commonkeywords);
    var atoms = wordRegexp(atomWords);
    var builtinFuncs = wordRegexp(builtinFuncsWords);
    var builtinObjs = wordRegexp(builtinObjsWords);
    var known = wordRegexp(knownWords);
    var stringPrefixes = '"';

    var opening = wordRegexp(openingKeywords);
    var middle = wordRegexp(middleKeywords);
    var closing = wordRegexp(endKeywords);
    var doubleClosing = wordRegexp(['end']);
    var doOpening = wordRegexp(['do']);
    var noIndentWords = wordRegexp(['on error resume next', 'exit']);
    var comment = wordRegexp(['rem']);


    function indent(_stream, state) {
      state.currentIndent++;
    }

    function dedent(_stream, state) {
      state.currentIndent--;
    }
    // tokenizers
    function tokenBase(stream, state) {
        if (stream.eatSpace()) {
            return 'space';
            //return null;
        }

        var ch = stream.peek();

        // Handle Comments
        if (ch === "'") {
            stream.skipToEnd();
            return 'comment';
        }
        if (stream.match(comment)){
            stream.skipToEnd();
            return 'comment';
        }


        // Handle Number Literals
        if (stream.match(/^((&H)|(&O))?[0-9\.]/i, false) && !stream.match(/^((&H)|(&O))?[0-9\.]+[a-z_]/i, false)) {
            var floatLiteral = false;
            // Floats
            if (stream.match(/^\d*\.\d+/i)) { floatLiteral = true; }
            else if (stream.match(/^\d+\.\d*/)) { floatLiteral = true; }
            else if (stream.match(/^\.\d+/)) { floatLiteral = true; }

            if (floatLiteral) {
                // Float literals may be "imaginary"
                stream.eat(/J/i);
                return 'number';
            }
            // Integers
            var intLiteral = false;
            // Hex
            if (stream.match(/^&H[0-9a-f]+/i)) { intLiteral = true; }
            // Octal
            else if (stream.match(/^&O[0-7]+/i)) { intLiteral = true; }
            // Decimal
            else if (stream.match(/^[1-9]\d*F?/)) {
                // Decimal literals may be "imaginary"
                stream.eat(/J/i);
                // TODO - Can you have imaginary longs?
                intLiteral = true;
            }
            // Zero by itself with no other piece of number.
            else if (stream.match(/^0(?![\dx])/i)) { intLiteral = true; }
            if (intLiteral) {
                // Integer literals may be "long"
                stream.eat(/L/i);
                return 'number';
            }
        }

        // Handle Strings
        if (stream.match(stringPrefixes)) {
            state.tokenize = tokenStringFactory(stream.current());
            return state.tokenize(stream, state);
        }

        // Handle operators and Delimiters
        if (stream.match(doubleOperators)
            || stream.match(singleOperators)
            || stream.match(wordOperators)) {
            return 'operator';
        }
        if (stream.match(singleDelimiters)) {
            return null;
        }

        if (stream.match(brakets)) {
            return "bracket";
        }

        if (stream.match(noIndentWords)) {
            state.doInCurrentLine = true;

            return 'keyword';
        }

        if (stream.match(doOpening)) {
            indent(stream,state);
            state.doInCurrentLine = true;

            return 'keyword';
        }
        if (stream.match(opening)) {
            if (! state.doInCurrentLine)
              indent(stream,state);
            else
              state.doInCurrentLine = false;

            return 'keyword';
        }
        if (stream.match(middle)) {
            return 'keyword';
        }


        if (stream.match(doubleClosing)) {
            dedent(stream,state);
            dedent(stream,state);

            return 'keyword';
        }
        if (stream.match(closing)) {
            if (! state.doInCurrentLine)
              dedent(stream,state);
            else
              state.doInCurrentLine = false;

            return 'keyword';
        }

        if (stream.match(keywords)) {
            return 'keyword';
        }

        if (stream.match(atoms)) {
            return 'atom';
        }

        if (stream.match(known)) {
            return 'variable-2';
        }

        if (stream.match(builtinFuncs)) {
            return 'builtin';
        }

        if (stream.match(builtinObjs)){
            return 'variable-2';
        }

        if (stream.match(identifiers)) {
            return 'variable';
        }

        // Handle non-detected items
        stream.next();
        return ERRORCLASS;
    }

    function tokenStringFactory(delimiter) {
        var singleline = delimiter.length == 1;
        var OUTCLASS = 'string';

        return function(stream, state) {
            while (!stream.eol()) {
                stream.eatWhile(/[^'"]/);
                if (stream.match(delimiter)) {
                    state.tokenize = tokenBase;
                    return OUTCLASS;
                } else {
                    stream.eat(/['"]/);
                }
            }
            if (singleline) {
                if (parserConf.singleLineStringErrors) {
                    return ERRORCLASS;
                } else {
                    state.tokenize = tokenBase;
                }
            }
            return OUTCLASS;
        };
    }


    function tokenLexer(stream, state) {
        var style = state.tokenize(stream, state);
        var current = stream.current();

        // Handle '.' connected identifiers
        if (current === '.') {
            style = state.tokenize(stream, state);

            current = stream.current();
            if (style && (style.substr(0, 8) === 'variable' || style==='builtin' || style==='keyword')){//|| knownWords.indexOf(current.substring(1)) > -1) {
                if (style === 'builtin' || style === 'keyword') style='variable';
                if (knownWords.indexOf(current.substr(1)) > -1) style='variable-2';

                return style;
            } else {
                return ERRORCLASS;
            }
        }

        return style;
    }

    var external = {
        electricChars:"dDpPtTfFeE ",
        startState: function() {
            return {
              tokenize: tokenBase,
              lastToken: null,
              currentIndent: 0,
              nextLineIndent: 0,
              doInCurrentLine: false,
              ignoreKeyword: false


          };
        },

        token: function(stream, state) {
            if (stream.sol()) {
              state.currentIndent += state.nextLineIndent;
              state.nextLineIndent = 0;
              state.doInCurrentLine = 0;
            }
            var style = tokenLexer(stream, state);

            state.lastToken = {style:style, content: stream.current()};

            if (style==='space') style=null;

            return style;
        },

        indent: function(state, textAfter) {
            var trueText = textAfter.replace(/^\s+|\s+$/g, '') ;
            if (trueText.match(closing) || trueText.match(doubleClosing) || trueText.match(middle)) return conf.indentUnit*(state.currentIndent-1);
            if(state.currentIndent < 0) return 0;
            return state.currentIndent * conf.indentUnit;
        }

    };
    return external;
});

CodeMirror.defineMIME("text/vbscript", "vbscript");

});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/velocity/velocity.js":
/*!******************************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/velocity/velocity.js ***!
  \******************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"));
  else {}
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode("velocity", function() {
    function parseWords(str) {
        var obj = {}, words = str.split(" ");
        for (var i = 0; i < words.length; ++i) obj[words[i]] = true;
        return obj;
    }

    var keywords = parseWords("#end #else #break #stop #[[ #]] " +
                              "#{end} #{else} #{break} #{stop}");
    var functions = parseWords("#if #elseif #foreach #set #include #parse #macro #define #evaluate " +
                               "#{if} #{elseif} #{foreach} #{set} #{include} #{parse} #{macro} #{define} #{evaluate}");
    var specials = parseWords("$foreach.count $foreach.hasNext $foreach.first $foreach.last $foreach.topmost $foreach.parent.count $foreach.parent.hasNext $foreach.parent.first $foreach.parent.last $foreach.parent $velocityCount $!bodyContent $bodyContent");
    var isOperatorChar = /[+\-*&%=<>!?:\/|]/;

    function chain(stream, state, f) {
        state.tokenize = f;
        return f(stream, state);
    }
    function tokenBase(stream, state) {
        var beforeParams = state.beforeParams;
        state.beforeParams = false;
        var ch = stream.next();
        // start of unparsed string?
        if ((ch == "'") && !state.inString && state.inParams) {
            state.lastTokenWasBuiltin = false;
            return chain(stream, state, tokenString(ch));
        }
        // start of parsed string?
        else if ((ch == '"')) {
            state.lastTokenWasBuiltin = false;
            if (state.inString) {
                state.inString = false;
                return "string";
            }
            else if (state.inParams)
                return chain(stream, state, tokenString(ch));
        }
        // is it one of the special signs []{}().,;? Seperator?
        else if (/[\[\]{}\(\),;\.]/.test(ch)) {
            if (ch == "(" && beforeParams)
                state.inParams = true;
            else if (ch == ")") {
                state.inParams = false;
                state.lastTokenWasBuiltin = true;
            }
            return null;
        }
        // start of a number value?
        else if (/\d/.test(ch)) {
            state.lastTokenWasBuiltin = false;
            stream.eatWhile(/[\w\.]/);
            return "number";
        }
        // multi line comment?
        else if (ch == "#" && stream.eat("*")) {
            state.lastTokenWasBuiltin = false;
            return chain(stream, state, tokenComment);
        }
        // unparsed content?
        else if (ch == "#" && stream.match(/ *\[ *\[/)) {
            state.lastTokenWasBuiltin = false;
            return chain(stream, state, tokenUnparsed);
        }
        // single line comment?
        else if (ch == "#" && stream.eat("#")) {
            state.lastTokenWasBuiltin = false;
            stream.skipToEnd();
            return "comment";
        }
        // variable?
        else if (ch == "$") {
            stream.eatWhile(/[\w\d\$_\.{}-]/);
            // is it one of the specials?
            if (specials && specials.propertyIsEnumerable(stream.current())) {
                return "keyword";
            }
            else {
                state.lastTokenWasBuiltin = true;
                state.beforeParams = true;
                return "builtin";
            }
        }
        // is it a operator?
        else if (isOperatorChar.test(ch)) {
            state.lastTokenWasBuiltin = false;
            stream.eatWhile(isOperatorChar);
            return "operator";
        }
        else {
            // get the whole word
            stream.eatWhile(/[\w\$_{}@]/);
            var word = stream.current();
            // is it one of the listed keywords?
            if (keywords && keywords.propertyIsEnumerable(word))
                return "keyword";
            // is it one of the listed functions?
            if (functions && functions.propertyIsEnumerable(word) ||
                    (stream.current().match(/^#@?[a-z0-9_]+ *$/i) && stream.peek()=="(") &&
                     !(functions && functions.propertyIsEnumerable(word.toLowerCase()))) {
                state.beforeParams = true;
                state.lastTokenWasBuiltin = false;
                return "keyword";
            }
            if (state.inString) {
                state.lastTokenWasBuiltin = false;
                return "string";
            }
            if (stream.pos > word.length && stream.string.charAt(stream.pos-word.length-1)=="." && state.lastTokenWasBuiltin)
                return "builtin";
            // default: just a "word"
            state.lastTokenWasBuiltin = false;
            return null;
        }
    }

    function tokenString(quote) {
        return function(stream, state) {
            var escaped = false, next, end = false;
            while ((next = stream.next()) != null) {
                if ((next == quote) && !escaped) {
                    end = true;
                    break;
                }
                if (quote=='"' && stream.peek() == '$' && !escaped) {
                    state.inString = true;
                    end = true;
                    break;
                }
                escaped = !escaped && next == "\\";
            }
            if (end) state.tokenize = tokenBase;
            return "string";
        };
    }

    function tokenComment(stream, state) {
        var maybeEnd = false, ch;
        while (ch = stream.next()) {
            if (ch == "#" && maybeEnd) {
                state.tokenize = tokenBase;
                break;
            }
            maybeEnd = (ch == "*");
        }
        return "comment";
    }

    function tokenUnparsed(stream, state) {
        var maybeEnd = 0, ch;
        while (ch = stream.next()) {
            if (ch == "#" && maybeEnd == 2) {
                state.tokenize = tokenBase;
                break;
            }
            if (ch == "]")
                maybeEnd++;
            else if (ch != " ")
                maybeEnd = 0;
        }
        return "meta";
    }
    // Interface

    return {
        startState: function() {
            return {
                tokenize: tokenBase,
                beforeParams: false,
                inParams: false,
                inString: false,
                lastTokenWasBuiltin: false
            };
        },

        token: function(stream, state) {
            if (stream.eatSpace()) return null;
            return state.tokenize(stream, state);
        },
        blockCommentStart: "#*",
        blockCommentEnd: "*#",
        lineComment: "##",
        fold: "velocity"
    };
});

CodeMirror.defineMIME("text/velocity", "velocity");

});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/verilog/verilog.js":
/*!****************************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/verilog/verilog.js ***!
  \****************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"));
  else {}
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode("verilog", function(config, parserConfig) {

  var indentUnit = config.indentUnit,
      statementIndentUnit = parserConfig.statementIndentUnit || indentUnit,
      dontAlignCalls = parserConfig.dontAlignCalls,
      noIndentKeywords = parserConfig.noIndentKeywords || [],
      multiLineStrings = parserConfig.multiLineStrings,
      hooks = parserConfig.hooks || {};

  function words(str) {
    var obj = {}, words = str.split(" ");
    for (var i = 0; i < words.length; ++i) obj[words[i]] = true;
    return obj;
  }

  /**
   * Keywords from IEEE 1800-2012
   */
  var keywords = words(
    "accept_on alias always always_comb always_ff always_latch and assert assign assume automatic before begin bind " +
    "bins binsof bit break buf bufif0 bufif1 byte case casex casez cell chandle checker class clocking cmos config " +
    "const constraint context continue cover covergroup coverpoint cross deassign default defparam design disable " +
    "dist do edge else end endcase endchecker endclass endclocking endconfig endfunction endgenerate endgroup " +
    "endinterface endmodule endpackage endprimitive endprogram endproperty endspecify endsequence endtable endtask " +
    "enum event eventually expect export extends extern final first_match for force foreach forever fork forkjoin " +
    "function generate genvar global highz0 highz1 if iff ifnone ignore_bins illegal_bins implements implies import " +
    "incdir include initial inout input inside instance int integer interconnect interface intersect join join_any " +
    "join_none large let liblist library local localparam logic longint macromodule matches medium modport module " +
    "nand negedge nettype new nexttime nmos nor noshowcancelled not notif0 notif1 null or output package packed " +
    "parameter pmos posedge primitive priority program property protected pull0 pull1 pulldown pullup " +
    "pulsestyle_ondetect pulsestyle_onevent pure rand randc randcase randsequence rcmos real realtime ref reg " +
    "reject_on release repeat restrict return rnmos rpmos rtran rtranif0 rtranif1 s_always s_eventually s_nexttime " +
    "s_until s_until_with scalared sequence shortint shortreal showcancelled signed small soft solve specify " +
    "specparam static string strong strong0 strong1 struct super supply0 supply1 sync_accept_on sync_reject_on " +
    "table tagged task this throughout time timeprecision timeunit tran tranif0 tranif1 tri tri0 tri1 triand trior " +
    "trireg type typedef union unique unique0 unsigned until until_with untyped use uwire var vectored virtual void " +
    "wait wait_order wand weak weak0 weak1 while wildcard wire with within wor xnor xor");

  /** Operators from IEEE 1800-2012
     unary_operator ::=
       + | - | ! | ~ | & | ~& | | | ~| | ^ | ~^ | ^~
     binary_operator ::=
       + | - | * | / | % | == | != | === | !== | ==? | !=? | && | || | **
       | < | <= | > | >= | & | | | ^ | ^~ | ~^ | >> | << | >>> | <<<
       | -> | <->
     inc_or_dec_operator ::= ++ | --
     unary_module_path_operator ::=
       ! | ~ | & | ~& | | | ~| | ^ | ~^ | ^~
     binary_module_path_operator ::=
       == | != | && | || | & | | | ^ | ^~ | ~^
  */
  var isOperatorChar = /[\+\-\*\/!~&|^%=?:]/;
  var isBracketChar = /[\[\]{}()]/;

  var unsignedNumber = /\d[0-9_]*/;
  var decimalLiteral = /\d*\s*'s?d\s*\d[0-9_]*/i;
  var binaryLiteral = /\d*\s*'s?b\s*[xz01][xz01_]*/i;
  var octLiteral = /\d*\s*'s?o\s*[xz0-7][xz0-7_]*/i;
  var hexLiteral = /\d*\s*'s?h\s*[0-9a-fxz?][0-9a-fxz?_]*/i;
  var realLiteral = /(\d[\d_]*(\.\d[\d_]*)?E-?[\d_]+)|(\d[\d_]*\.\d[\d_]*)/i;

  var closingBracketOrWord = /^((\w+)|[)}\]])/;
  var closingBracket = /[)}\]]/;

  var curPunc;
  var curKeyword;

  // Block openings which are closed by a matching keyword in the form of ("end" + keyword)
  // E.g. "task" => "endtask"
  var blockKeywords = words(
    "case checker class clocking config function generate interface module package " +
    "primitive program property specify sequence table task"
  );

  // Opening/closing pairs
  var openClose = {};
  for (var keyword in blockKeywords) {
    openClose[keyword] = "end" + keyword;
  }
  openClose["begin"] = "end";
  openClose["casex"] = "endcase";
  openClose["casez"] = "endcase";
  openClose["do"   ] = "while";
  openClose["fork" ] = "join;join_any;join_none";
  openClose["covergroup"] = "endgroup";

  for (var i in noIndentKeywords) {
    var keyword = noIndentKeywords[i];
    if (openClose[keyword]) {
      openClose[keyword] = undefined;
    }
  }

  // Keywords which open statements that are ended with a semi-colon
  var statementKeywords = words("always always_comb always_ff always_latch assert assign assume else export for foreach forever if import initial repeat while");

  function tokenBase(stream, state) {
    var ch = stream.peek(), style;
    if (hooks[ch] && (style = hooks[ch](stream, state)) != false) return style;
    if (hooks.tokenBase && (style = hooks.tokenBase(stream, state)) != false)
      return style;

    if (/[,;:\.]/.test(ch)) {
      curPunc = stream.next();
      return null;
    }
    if (isBracketChar.test(ch)) {
      curPunc = stream.next();
      return "bracket";
    }
    // Macros (tick-defines)
    if (ch == '`') {
      stream.next();
      if (stream.eatWhile(/[\w\$_]/)) {
        return "def";
      } else {
        return null;
      }
    }
    // System calls
    if (ch == '$') {
      stream.next();
      if (stream.eatWhile(/[\w\$_]/)) {
        return "meta";
      } else {
        return null;
      }
    }
    // Time literals
    if (ch == '#') {
      stream.next();
      stream.eatWhile(/[\d_.]/);
      return "def";
    }
    // Strings
    if (ch == '"') {
      stream.next();
      state.tokenize = tokenString(ch);
      return state.tokenize(stream, state);
    }
    // Comments
    if (ch == "/") {
      stream.next();
      if (stream.eat("*")) {
        state.tokenize = tokenComment;
        return tokenComment(stream, state);
      }
      if (stream.eat("/")) {
        stream.skipToEnd();
        return "comment";
      }
      stream.backUp(1);
    }

    // Numeric literals
    if (stream.match(realLiteral) ||
        stream.match(decimalLiteral) ||
        stream.match(binaryLiteral) ||
        stream.match(octLiteral) ||
        stream.match(hexLiteral) ||
        stream.match(unsignedNumber) ||
        stream.match(realLiteral)) {
      return "number";
    }

    // Operators
    if (stream.eatWhile(isOperatorChar)) {
      return "meta";
    }

    // Keywords / plain variables
    if (stream.eatWhile(/[\w\$_]/)) {
      var cur = stream.current();
      if (keywords[cur]) {
        if (openClose[cur]) {
          curPunc = "newblock";
        }
        if (statementKeywords[cur]) {
          curPunc = "newstatement";
        }
        curKeyword = cur;
        return "keyword";
      }
      return "variable";
    }

    stream.next();
    return null;
  }

  function tokenString(quote) {
    return function(stream, state) {
      var escaped = false, next, end = false;
      while ((next = stream.next()) != null) {
        if (next == quote && !escaped) {end = true; break;}
        escaped = !escaped && next == "\\";
      }
      if (end || !(escaped || multiLineStrings))
        state.tokenize = tokenBase;
      return "string";
    };
  }

  function tokenComment(stream, state) {
    var maybeEnd = false, ch;
    while (ch = stream.next()) {
      if (ch == "/" && maybeEnd) {
        state.tokenize = tokenBase;
        break;
      }
      maybeEnd = (ch == "*");
    }
    return "comment";
  }

  function Context(indented, column, type, align, prev) {
    this.indented = indented;
    this.column = column;
    this.type = type;
    this.align = align;
    this.prev = prev;
  }
  function pushContext(state, col, type) {
    var indent = state.indented;
    var c = new Context(indent, col, type, null, state.context);
    return state.context = c;
  }
  function popContext(state) {
    var t = state.context.type;
    if (t == ")" || t == "]" || t == "}") {
      state.indented = state.context.indented;
    }
    return state.context = state.context.prev;
  }

  function isClosing(text, contextClosing) {
    if (text == contextClosing) {
      return true;
    } else {
      // contextClosing may be multiple keywords separated by ;
      var closingKeywords = contextClosing.split(";");
      for (var i in closingKeywords) {
        if (text == closingKeywords[i]) {
          return true;
        }
      }
      return false;
    }
  }

  function buildElectricInputRegEx() {
    // Reindentation should occur on any bracket char: {}()[]
    // or on a match of any of the block closing keywords, at
    // the end of a line
    var allClosings = [];
    for (var i in openClose) {
      if (openClose[i]) {
        var closings = openClose[i].split(";");
        for (var j in closings) {
          allClosings.push(closings[j]);
        }
      }
    }
    var re = new RegExp("[{}()\\[\\]]|(" + allClosings.join("|") + ")$");
    return re;
  }

  // Interface
  return {

    // Regex to force current line to reindent
    electricInput: buildElectricInputRegEx(),

    startState: function(basecolumn) {
      var state = {
        tokenize: null,
        context: new Context((basecolumn || 0) - indentUnit, 0, "top", false),
        indented: 0,
        startOfLine: true
      };
      if (hooks.startState) hooks.startState(state);
      return state;
    },

    token: function(stream, state) {
      var ctx = state.context;
      if (stream.sol()) {
        if (ctx.align == null) ctx.align = false;
        state.indented = stream.indentation();
        state.startOfLine = true;
      }
      if (hooks.token) {
        // Call hook, with an optional return value of a style to override verilog styling.
        var style = hooks.token(stream, state);
        if (style !== undefined) {
          return style;
        }
      }
      if (stream.eatSpace()) return null;
      curPunc = null;
      curKeyword = null;
      var style = (state.tokenize || tokenBase)(stream, state);
      if (style == "comment" || style == "meta" || style == "variable") return style;
      if (ctx.align == null) ctx.align = true;

      if (curPunc == ctx.type) {
        popContext(state);
      } else if ((curPunc == ";" && ctx.type == "statement") ||
               (ctx.type && isClosing(curKeyword, ctx.type))) {
        ctx = popContext(state);
        while (ctx && ctx.type == "statement") ctx = popContext(state);
      } else if (curPunc == "{") {
        pushContext(state, stream.column(), "}");
      } else if (curPunc == "[") {
        pushContext(state, stream.column(), "]");
      } else if (curPunc == "(") {
        pushContext(state, stream.column(), ")");
      } else if (ctx && ctx.type == "endcase" && curPunc == ":") {
        pushContext(state, stream.column(), "statement");
      } else if (curPunc == "newstatement") {
        pushContext(state, stream.column(), "statement");
      } else if (curPunc == "newblock") {
        if (curKeyword == "function" && ctx && (ctx.type == "statement" || ctx.type == "endgroup")) {
          // The 'function' keyword can appear in some other contexts where it actually does not
          // indicate a function (import/export DPI and covergroup definitions).
          // Do nothing in this case
        } else if (curKeyword == "task" && ctx && ctx.type == "statement") {
          // Same thing for task
        } else {
          var close = openClose[curKeyword];
          pushContext(state, stream.column(), close);
        }
      }

      state.startOfLine = false;
      return style;
    },

    indent: function(state, textAfter) {
      if (state.tokenize != tokenBase && state.tokenize != null) return CodeMirror.Pass;
      if (hooks.indent) {
        var fromHook = hooks.indent(state);
        if (fromHook >= 0) return fromHook;
      }
      var ctx = state.context, firstChar = textAfter && textAfter.charAt(0);
      if (ctx.type == "statement" && firstChar == "}") ctx = ctx.prev;
      var closing = false;
      var possibleClosing = textAfter.match(closingBracketOrWord);
      if (possibleClosing)
        closing = isClosing(possibleClosing[0], ctx.type);
      if (ctx.type == "statement") return ctx.indented + (firstChar == "{" ? 0 : statementIndentUnit);
      else if (closingBracket.test(ctx.type) && ctx.align && !dontAlignCalls) return ctx.column + (closing ? 0 : 1);
      else if (ctx.type == ")" && !closing) return ctx.indented + statementIndentUnit;
      else return ctx.indented + (closing ? 0 : indentUnit);
    },

    blockCommentStart: "/*",
    blockCommentEnd: "*/",
    lineComment: "//"
  };
});

  CodeMirror.defineMIME("text/x-verilog", {
    name: "verilog"
  });

  CodeMirror.defineMIME("text/x-systemverilog", {
    name: "verilog"
  });



  // TL-Verilog mode.
  // See tl-x.org for language spec.
  // See the mode in action at makerchip.com.
  // Contact: steve.hoover@redwoodeda.com

  // TLV Identifier prefixes.
  // Note that sign is not treated separately, so "+/-" versions of numeric identifiers
  // are included.
  var tlvIdentifierStyle = {
    "|": "link",
    ">": "property",  // Should condition this off for > TLV 1c.
    "$": "variable",
    "$$": "variable",
    "?$": "qualifier",
    "?*": "qualifier",
    "-": "hr",
    "/": "property",
    "/-": "property",
    "@": "variable-3",
    "@-": "variable-3",
    "@++": "variable-3",
    "@+=": "variable-3",
    "@+=-": "variable-3",
    "@--": "variable-3",
    "@-=": "variable-3",
    "%+": "tag",
    "%-": "tag",
    "%": "tag",
    ">>": "tag",
    "<<": "tag",
    "<>": "tag",
    "#": "tag",  // Need to choose a style for this.
    "^": "attribute",
    "^^": "attribute",
    "^!": "attribute",
    "*": "variable-2",
    "**": "variable-2",
    "\\": "keyword",
    "\"": "comment"
  };

  // Lines starting with these characters define scope (result in indentation).
  var tlvScopePrefixChars = {
    "/": "beh-hier",
    ">": "beh-hier",
    "-": "phys-hier",
    "|": "pipe",
    "?": "when",
    "@": "stage",
    "\\": "keyword"
  };
  var tlvIndentUnit = 3;
  var tlvTrackStatements = false;
  var tlvIdentMatch = /^([~!@#\$%\^&\*-\+=\?\/\\\|'"<>]+)([\d\w_]*)/;  // Matches an identifiere.
  // Note that ':' is excluded, because of it's use in [:].
  var tlvFirstLevelIndentMatch = /^[! ]  /;
  var tlvLineIndentationMatch = /^[! ] */;
  var tlvCommentMatch = /^\/[\/\*]/;


  // Returns a style specific to the scope at the given indentation column.
  // Type is one of: "indent", "scope-ident", "before-scope-ident".
  function tlvScopeStyle(state, indentation, type) {
    // Begin scope.
    var depth = indentation / tlvIndentUnit;  // TODO: Pass this in instead.
    return "tlv-" + state.tlvIndentationStyle[depth] + "-" + type;
  }

  // Return true if the next thing in the stream is an identifier with a mnemonic.
  function tlvIdentNext(stream) {
    var match;
    return (match = stream.match(tlvIdentMatch, false)) && match[2].length > 0;
  }

  CodeMirror.defineMIME("text/x-tlv", {
    name: "verilog",

    hooks: {

      electricInput: false,


      // Return undefined for verilog tokenizing, or style for TLV token (null not used).
      // Standard CM styles are used for most formatting, but some TL-Verilog-specific highlighting
      // can be enabled with the definition of cm-tlv-* styles, including highlighting for:
      //   - M4 tokens
      //   - TLV scope indentation
      //   - Statement delimitation (enabled by tlvTrackStatements)
      token: function(stream, state) {
        var style = undefined;
        var match;  // Return value of pattern matches.

        // Set highlighting mode based on code region (TLV or SV).
        if (stream.sol() && ! state.tlvInBlockComment) {
          // Process region.
          if (stream.peek() == '\\') {
            style = "def";
            stream.skipToEnd();
            if (stream.string.match(/\\SV/)) {
              state.tlvCodeActive = false;
            } else if (stream.string.match(/\\TLV/)){
              state.tlvCodeActive = true;
            }
          }
          // Correct indentation in the face of a line prefix char.
          if (state.tlvCodeActive && stream.pos == 0 &&
              (state.indented == 0) && (match = stream.match(tlvLineIndentationMatch, false))) {
            state.indented = match[0].length;
          }

          // Compute indentation state:
          //   o Auto indentation on next line
          //   o Indentation scope styles
          var indented = state.indented;
          var depth = indented / tlvIndentUnit;
          if (depth <= state.tlvIndentationStyle.length) {
            // not deeper than current scope

            var blankline = stream.string.length == indented;
            var chPos = depth * tlvIndentUnit;
            if (chPos < stream.string.length) {
              var bodyString = stream.string.slice(chPos);
              var ch = bodyString[0];
              if (tlvScopePrefixChars[ch] && ((match = bodyString.match(tlvIdentMatch)) &&
                  tlvIdentifierStyle[match[1]])) {
                // This line begins scope.
                // Next line gets indented one level.
                indented += tlvIndentUnit;
                // Style the next level of indentation (except non-region keyword identifiers,
                //   which are statements themselves)
                if (!(ch == "\\" && chPos > 0)) {
                  state.tlvIndentationStyle[depth] = tlvScopePrefixChars[ch];
                  if (tlvTrackStatements) {state.statementComment = false;}
                  depth++;
                }
              }
            }
            // Clear out deeper indentation levels unless line is blank.
            if (!blankline) {
              while (state.tlvIndentationStyle.length > depth) {
                state.tlvIndentationStyle.pop();
              }
            }
          }
          // Set next level of indentation.
          state.tlvNextIndent = indented;
        }

        if (state.tlvCodeActive) {
          // Highlight as TLV.

          var beginStatement = false;
          if (tlvTrackStatements) {
            // This starts a statement if the position is at the scope level
            // and we're not within a statement leading comment.
            beginStatement =
                   (stream.peek() != " ") &&   // not a space
                   (style === undefined) &&    // not a region identifier
                   !state.tlvInBlockComment && // not in block comment
                   //!stream.match(tlvCommentMatch, false) && // not comment start
                   (stream.column() == state.tlvIndentationStyle.length * tlvIndentUnit);  // at scope level
            if (beginStatement) {
              if (state.statementComment) {
                // statement already started by comment
                beginStatement = false;
              }
              state.statementComment =
                   stream.match(tlvCommentMatch, false); // comment start
            }
          }

          var match;
          if (style !== undefined) {
            // Region line.
            style += " " + tlvScopeStyle(state, 0, "scope-ident")
          } else if (((stream.pos / tlvIndentUnit) < state.tlvIndentationStyle.length) &&
                     (match = stream.match(stream.sol() ? tlvFirstLevelIndentMatch : /^   /))) {
            // Indentation
            style = // make this style distinct from the previous one to prevent
                    // codemirror from combining spans
                    "tlv-indent-" + (((stream.pos % 2) == 0) ? "even" : "odd") +
                    // and style it
                    " " + tlvScopeStyle(state, stream.pos - tlvIndentUnit, "indent");
            // Style the line prefix character.
            if (match[0].charAt(0) == "!") {
              style += " tlv-alert-line-prefix";
            }
            // Place a class before a scope identifier.
            if (tlvIdentNext(stream)) {
              style += " " + tlvScopeStyle(state, stream.pos, "before-scope-ident");
            }
          } else if (state.tlvInBlockComment) {
            // In a block comment.
            if (stream.match(/^.*?\*\//)) {
              // Exit block comment.
              state.tlvInBlockComment = false;
              if (tlvTrackStatements && !stream.eol()) {
                // Anything after comment is assumed to be real statement content.
                state.statementComment = false;
              }
            } else {
              stream.skipToEnd();
            }
            style = "comment";
          } else if ((match = stream.match(tlvCommentMatch)) && !state.tlvInBlockComment) {
            // Start comment.
            if (match[0] == "//") {
              // Line comment.
              stream.skipToEnd();
            } else {
              // Block comment.
              state.tlvInBlockComment = true;
            }
            style = "comment";
          } else if (match = stream.match(tlvIdentMatch)) {
            // looks like an identifier (or identifier prefix)
            var prefix = match[1];
            var mnemonic = match[2];
            if (// is identifier prefix
                tlvIdentifierStyle.hasOwnProperty(prefix) &&
                // has mnemonic or we're at the end of the line (maybe it hasn't been typed yet)
                (mnemonic.length > 0 || stream.eol())) {
              style = tlvIdentifierStyle[prefix];
              if (stream.column() == state.indented) {
                // Begin scope.
                style += " " + tlvScopeStyle(state, stream.column(), "scope-ident")
              }
            } else {
              // Just swallow one character and try again.
              // This enables subsequent identifier match with preceding symbol character, which
              //   is legal within a statement.  (Eg, !$reset).  It also enables detection of
              //   comment start with preceding symbols.
              stream.backUp(stream.current().length - 1);
              style = "tlv-default";
            }
          } else if (stream.match(/^\t+/)) {
            // Highlight tabs, which are illegal.
            style = "tlv-tab";
          } else if (stream.match(/^[\[\]{}\(\);\:]+/)) {
            // [:], (), {}, ;.
            style = "meta";
          } else if (match = stream.match(/^[mM]4([\+_])?[\w\d_]*/)) {
            // m4 pre proc
            style = (match[1] == "+") ? "tlv-m4-plus" : "tlv-m4";
          } else if (stream.match(/^ +/)){
            // Skip over spaces.
            if (stream.eol()) {
              // Trailing spaces.
              style = "error";
            } else {
              // Non-trailing spaces.
              style = "tlv-default";
            }
          } else if (stream.match(/^[\w\d_]+/)) {
            // alpha-numeric token.
            style = "number";
          } else {
            // Eat the next char w/ no formatting.
            stream.next();
            style = "tlv-default";
          }
          if (beginStatement) {
            style += " tlv-statement";
          }
        } else {
          if (stream.match(/^[mM]4([\w\d_]*)/)) {
            // m4 pre proc
            style = "tlv-m4";
          }
        }
        return style;
      },

      indent: function(state) {
        return (state.tlvCodeActive == true) ? state.tlvNextIndent : -1;
      },

      startState: function(state) {
        state.tlvIndentationStyle = [];  // Styles to use for each level of indentation.
        state.tlvCodeActive = true;  // True when we're in a TLV region (and at beginning of file).
        state.tlvNextIndent = -1;    // The number of spaces to autoindent the next line if tlvCodeActive.
        state.tlvInBlockComment = false;  // True inside /**/ comment.
        if (tlvTrackStatements) {
          state.statementComment = false;  // True inside a statement's header comment.
        }
      }

    }
  });
});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/vhdl/vhdl.js":
/*!**********************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/vhdl/vhdl.js ***!
  \**********************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

// Originally written by Alf Nielsen, re-written by Michael Zhou
(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"));
  else {}
})(function(CodeMirror) {
"use strict";

function words(str) {
  var obj = {}, words = str.split(",");
  for (var i = 0; i < words.length; ++i) {
    var allCaps = words[i].toUpperCase();
    var firstCap = words[i].charAt(0).toUpperCase() + words[i].slice(1);
    obj[words[i]] = true;
    obj[allCaps] = true;
    obj[firstCap] = true;
  }
  return obj;
}

function metaHook(stream) {
  stream.eatWhile(/[\w\$_]/);
  return "meta";
}

CodeMirror.defineMode("vhdl", function(config, parserConfig) {
  var indentUnit = config.indentUnit,
      atoms = parserConfig.atoms || words("null"),
      hooks = parserConfig.hooks || {"`": metaHook, "$": metaHook},
      multiLineStrings = parserConfig.multiLineStrings;

  var keywords = words("abs,access,after,alias,all,and,architecture,array,assert,attribute,begin,block," +
      "body,buffer,bus,case,component,configuration,constant,disconnect,downto,else,elsif,end,end block,end case," +
      "end component,end for,end generate,end if,end loop,end process,end record,end units,entity,exit,file,for," +
      "function,generate,generic,generic map,group,guarded,if,impure,in,inertial,inout,is,label,library,linkage," +
      "literal,loop,map,mod,nand,new,next,nor,null,of,on,open,or,others,out,package,package body,port,port map," +
      "postponed,procedure,process,pure,range,record,register,reject,rem,report,return,rol,ror,select,severity,signal," +
      "sla,sll,sra,srl,subtype,then,to,transport,type,unaffected,units,until,use,variable,wait,when,while,with,xnor,xor");

  var blockKeywords = words("architecture,entity,begin,case,port,else,elsif,end,for,function,if");

  var isOperatorChar = /[&|~><!\)\(*#%@+\/=?\:;}{,\.\^\-\[\]]/;
  var curPunc;

  function tokenBase(stream, state) {
    var ch = stream.next();
    if (hooks[ch]) {
      var result = hooks[ch](stream, state);
      if (result !== false) return result;
    }
    if (ch == '"') {
      state.tokenize = tokenString2(ch);
      return state.tokenize(stream, state);
    }
    if (ch == "'") {
      state.tokenize = tokenString(ch);
      return state.tokenize(stream, state);
    }
    if (/[\[\]{}\(\),;\:\.]/.test(ch)) {
      curPunc = ch;
      return null;
    }
    if (/[\d']/.test(ch)) {
      stream.eatWhile(/[\w\.']/);
      return "number";
    }
    if (ch == "-") {
      if (stream.eat("-")) {
        stream.skipToEnd();
        return "comment";
      }
    }
    if (isOperatorChar.test(ch)) {
      stream.eatWhile(isOperatorChar);
      return "operator";
    }
    stream.eatWhile(/[\w\$_]/);
    var cur = stream.current();
    if (keywords.propertyIsEnumerable(cur.toLowerCase())) {
      if (blockKeywords.propertyIsEnumerable(cur)) curPunc = "newstatement";
      return "keyword";
    }
    if (atoms.propertyIsEnumerable(cur)) return "atom";
    return "variable";
  }

  function tokenString(quote) {
    return function(stream, state) {
      var escaped = false, next, end = false;
      while ((next = stream.next()) != null) {
        if (next == quote && !escaped) {end = true; break;}
        escaped = !escaped && next == "--";
      }
      if (end || !(escaped || multiLineStrings))
        state.tokenize = tokenBase;
      return "string";
    };
  }
  function tokenString2(quote) {
    return function(stream, state) {
      var escaped = false, next, end = false;
      while ((next = stream.next()) != null) {
        if (next == quote && !escaped) {end = true; break;}
        escaped = !escaped && next == "--";
      }
      if (end || !(escaped || multiLineStrings))
        state.tokenize = tokenBase;
      return "string-2";
    };
  }

  function Context(indented, column, type, align, prev) {
    this.indented = indented;
    this.column = column;
    this.type = type;
    this.align = align;
    this.prev = prev;
  }
  function pushContext(state, col, type) {
    return state.context = new Context(state.indented, col, type, null, state.context);
  }
  function popContext(state) {
    var t = state.context.type;
    if (t == ")" || t == "]" || t == "}")
      state.indented = state.context.indented;
    return state.context = state.context.prev;
  }

  // Interface
  return {
    startState: function(basecolumn) {
      return {
        tokenize: null,
        context: new Context((basecolumn || 0) - indentUnit, 0, "top", false),
        indented: 0,
        startOfLine: true
      };
    },

    token: function(stream, state) {
      var ctx = state.context;
      if (stream.sol()) {
        if (ctx.align == null) ctx.align = false;
        state.indented = stream.indentation();
        state.startOfLine = true;
      }
      if (stream.eatSpace()) return null;
      curPunc = null;
      var style = (state.tokenize || tokenBase)(stream, state);
      if (style == "comment" || style == "meta") return style;
      if (ctx.align == null) ctx.align = true;

      if ((curPunc == ";" || curPunc == ":") && ctx.type == "statement") popContext(state);
      else if (curPunc == "{") pushContext(state, stream.column(), "}");
      else if (curPunc == "[") pushContext(state, stream.column(), "]");
      else if (curPunc == "(") pushContext(state, stream.column(), ")");
      else if (curPunc == "}") {
        while (ctx.type == "statement") ctx = popContext(state);
        if (ctx.type == "}") ctx = popContext(state);
        while (ctx.type == "statement") ctx = popContext(state);
      }
      else if (curPunc == ctx.type) popContext(state);
      else if (ctx.type == "}" || ctx.type == "top" || (ctx.type == "statement" && curPunc == "newstatement"))
        pushContext(state, stream.column(), "statement");
      state.startOfLine = false;
      return style;
    },

    indent: function(state, textAfter) {
      if (state.tokenize != tokenBase && state.tokenize != null) return 0;
      var firstChar = textAfter && textAfter.charAt(0), ctx = state.context, closing = firstChar == ctx.type;
      if (ctx.type == "statement") return ctx.indented + (firstChar == "{" ? 0 : indentUnit);
      else if (ctx.align) return ctx.column + (closing ? 0 : 1);
      else return ctx.indented + (closing ? 0 : indentUnit);
    },

    electricChars: "{}"
  };
});

CodeMirror.defineMIME("text/x-vhdl", "vhdl");

});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/vue/vue.js":
/*!********************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/vue/vue.js ***!
  \********************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function (mod) {
  "use strict";
  if (true) {// CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"),
        __webpack_require__(/*! ../../addon/mode/overlay */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/addon/mode/overlay.js"),
        __webpack_require__(/*! ../xml/xml */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/xml/xml.js"),
        __webpack_require__(/*! ../javascript/javascript */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/javascript/javascript.js"),
        __webpack_require__(/*! ../coffeescript/coffeescript */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/coffeescript/coffeescript.js"),
        __webpack_require__(/*! ../css/css */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/css/css.js"),
        __webpack_require__(/*! ../sass/sass */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/sass/sass.js"),
        __webpack_require__(/*! ../stylus/stylus */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/stylus/stylus.js"),
        __webpack_require__(/*! ../pug/pug */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/pug/pug.js"),
        __webpack_require__(/*! ../handlebars/handlebars */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/handlebars/handlebars.js"));
  } else {}
})(function (CodeMirror) {
  var tagLanguages = {
    script: [
      ["lang", /coffee(script)?/, "coffeescript"],
      ["type", /^(?:text|application)\/(?:x-)?coffee(?:script)?$/, "coffeescript"],
      ["lang", /^babel$/, "javascript"],
      ["type", /^text\/babel$/, "javascript"],
      ["type", /^text\/ecmascript-\d+$/, "javascript"]
    ],
    style: [
      ["lang", /^stylus$/i, "stylus"],
      ["lang", /^sass$/i, "sass"],
      ["lang", /^less$/i, "text/x-less"],
      ["lang", /^scss$/i, "text/x-scss"],
      ["type", /^(text\/)?(x-)?styl(us)?$/i, "stylus"],
      ["type", /^text\/sass/i, "sass"],
      ["type", /^(text\/)?(x-)?scss$/i, "text/x-scss"],
      ["type", /^(text\/)?(x-)?less$/i, "text/x-less"]
    ],
    template: [
      ["lang", /^vue-template$/i, "vue"],
      ["lang", /^pug$/i, "pug"],
      ["lang", /^handlebars$/i, "handlebars"],
      ["type", /^(text\/)?(x-)?pug$/i, "pug"],
      ["type", /^text\/x-handlebars-template$/i, "handlebars"],
      [null, null, "vue-template"]
    ]
  };

  CodeMirror.defineMode("vue-template", function (config, parserConfig) {
    var mustacheOverlay = {
      token: function (stream) {
        if (stream.match(/^\{\{.*?\}\}/)) return "meta mustache";
        while (stream.next() && !stream.match("{{", false)) {}
        return null;
      }
    };
    return CodeMirror.overlayMode(CodeMirror.getMode(config, parserConfig.backdrop || "text/html"), mustacheOverlay);
  });

  CodeMirror.defineMode("vue", function (config) {
    return CodeMirror.getMode(config, {name: "htmlmixed", tags: tagLanguages});
  }, "htmlmixed", "xml", "javascript", "coffeescript", "css", "sass", "stylus", "pug", "handlebars");

  CodeMirror.defineMIME("script/x-vue", "vue");
  CodeMirror.defineMIME("text/x-vue", "vue");
});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/webidl/webidl.js":
/*!**************************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/webidl/webidl.js ***!
  \**************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"));
  else {}
})(function(CodeMirror) {
"use strict";

function wordRegexp(words) {
  return new RegExp("^((" + words.join(")|(") + "))\\b");
};

var builtinArray = [
  "Clamp",
  "Constructor",
  "EnforceRange",
  "Exposed",
  "ImplicitThis",
  "Global", "PrimaryGlobal",
  "LegacyArrayClass",
  "LegacyUnenumerableNamedProperties",
  "LenientThis",
  "NamedConstructor",
  "NewObject",
  "NoInterfaceObject",
  "OverrideBuiltins",
  "PutForwards",
  "Replaceable",
  "SameObject",
  "TreatNonObjectAsNull",
  "TreatNullAs",
    "EmptyString",
  "Unforgeable",
  "Unscopeable"
];
var builtins = wordRegexp(builtinArray);

var typeArray = [
  "unsigned", "short", "long",                  // UnsignedIntegerType
  "unrestricted", "float", "double",            // UnrestrictedFloatType
  "boolean", "byte", "octet",                   // Rest of PrimitiveType
  "Promise",                                    // PromiseType
  "ArrayBuffer", "DataView", "Int8Array", "Int16Array", "Int32Array",
  "Uint8Array", "Uint16Array", "Uint32Array", "Uint8ClampedArray",
  "Float32Array", "Float64Array",               // BufferRelatedType
  "ByteString", "DOMString", "USVString", "sequence", "object", "RegExp",
  "Error", "DOMException", "FrozenArray",       // Rest of NonAnyType
  "any",                                        // Rest of SingleType
  "void"                                        // Rest of ReturnType
];
var types = wordRegexp(typeArray);

var keywordArray = [
  "attribute", "callback", "const", "deleter", "dictionary", "enum", "getter",
  "implements", "inherit", "interface", "iterable", "legacycaller", "maplike",
  "partial", "required", "serializer", "setlike", "setter", "static",
  "stringifier", "typedef",                     // ArgumentNameKeyword except
                                                // "unrestricted"
  "optional", "readonly", "or"
];
var keywords = wordRegexp(keywordArray);

var atomArray = [
  "true", "false",                              // BooleanLiteral
  "Infinity", "NaN",                            // FloatLiteral
  "null"                                        // Rest of ConstValue
];
var atoms = wordRegexp(atomArray);

CodeMirror.registerHelper("hintWords", "webidl",
    builtinArray.concat(typeArray).concat(keywordArray).concat(atomArray));

var startDefArray = ["callback", "dictionary", "enum", "interface"];
var startDefs = wordRegexp(startDefArray);

var endDefArray = ["typedef"];
var endDefs = wordRegexp(endDefArray);

var singleOperators = /^[:<=>?]/;
var integers = /^-?([1-9][0-9]*|0[Xx][0-9A-Fa-f]+|0[0-7]*)/;
var floats = /^-?(([0-9]+\.[0-9]*|[0-9]*\.[0-9]+)([Ee][+-]?[0-9]+)?|[0-9]+[Ee][+-]?[0-9]+)/;
var identifiers = /^_?[A-Za-z][0-9A-Z_a-z-]*/;
var identifiersEnd = /^_?[A-Za-z][0-9A-Z_a-z-]*(?=\s*;)/;
var strings = /^"[^"]*"/;
var multilineComments = /^\/\*.*?\*\//;
var multilineCommentsStart = /^\/\*.*/;
var multilineCommentsEnd = /^.*?\*\//;

function readToken(stream, state) {
  // whitespace
  if (stream.eatSpace()) return null;

  // comment
  if (state.inComment) {
    if (stream.match(multilineCommentsEnd)) {
      state.inComment = false;
      return "comment";
    }
    stream.skipToEnd();
    return "comment";
  }
  if (stream.match("//")) {
    stream.skipToEnd();
    return "comment";
  }
  if (stream.match(multilineComments)) return "comment";
  if (stream.match(multilineCommentsStart)) {
    state.inComment = true;
    return "comment";
  }

  // integer and float
  if (stream.match(/^-?[0-9\.]/, false)) {
    if (stream.match(integers) || stream.match(floats)) return "number";
  }

  // string
  if (stream.match(strings)) return "string";

  // identifier
  if (state.startDef && stream.match(identifiers)) return "def";

  if (state.endDef && stream.match(identifiersEnd)) {
    state.endDef = false;
    return "def";
  }

  if (stream.match(keywords)) return "keyword";

  if (stream.match(types)) {
    var lastToken = state.lastToken;
    var nextToken = (stream.match(/^\s*(.+?)\b/, false) || [])[1];

    if (lastToken === ":" || lastToken === "implements" ||
        nextToken === "implements" || nextToken === "=") {
      // Used as identifier
      return "builtin";
    } else {
      // Used as type
      return "variable-3";
    }
  }

  if (stream.match(builtins)) return "builtin";
  if (stream.match(atoms)) return "atom";
  if (stream.match(identifiers)) return "variable";

  // other
  if (stream.match(singleOperators)) return "operator";

  // unrecognized
  stream.next();
  return null;
};

CodeMirror.defineMode("webidl", function() {
  return {
    startState: function() {
      return {
        // Is in multiline comment
        inComment: false,
        // Last non-whitespace, matched token
        lastToken: "",
        // Next token is a definition
        startDef: false,
        // Last token of the statement is a definition
        endDef: false
      };
    },
    token: function(stream, state) {
      var style = readToken(stream, state);

      if (style) {
        var cur = stream.current();
        state.lastToken = cur;
        if (style === "keyword") {
          state.startDef = startDefs.test(cur);
          state.endDef = state.endDef || endDefs.test(cur);
        } else {
          state.startDef = false;
        }
      }

      return style;
    }
  };
});

CodeMirror.defineMIME("text/x-webidl", "webidl");
});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/xquery/xquery.js":
/*!**************************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/xquery/xquery.js ***!
  \**************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"));
  else {}
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode("xquery", function() {

  // The keywords object is set to the result of this self executing
  // function. Each keyword is a property of the keywords object whose
  // value is {type: atype, style: astyle}
  var keywords = function(){
    // convenience functions used to build keywords object
    function kw(type) {return {type: type, style: "keyword"};}
    var operator = kw("operator")
      , atom = {type: "atom", style: "atom"}
      , punctuation = {type: "punctuation", style: null}
      , qualifier = {type: "axis_specifier", style: "qualifier"};

    // kwObj is what is return from this function at the end
    var kwObj = {
      ',': punctuation
    };

    // a list of 'basic' keywords. For each add a property to kwObj with the value of
    // {type: basic[i], style: "keyword"} e.g. 'after' --> {type: "after", style: "keyword"}
    var basic = ['after', 'all', 'allowing', 'ancestor', 'ancestor-or-self', 'any', 'array', 'as',
    'ascending', 'at', 'attribute', 'base-uri', 'before', 'boundary-space', 'by', 'case', 'cast',
    'castable', 'catch', 'child', 'collation', 'comment', 'construction', 'contains', 'content',
    'context', 'copy', 'copy-namespaces', 'count', 'decimal-format', 'declare', 'default', 'delete',
    'descendant', 'descendant-or-self', 'descending', 'diacritics', 'different', 'distance',
    'document', 'document-node', 'element', 'else', 'empty', 'empty-sequence', 'encoding', 'end',
    'entire', 'every', 'exactly', 'except', 'external', 'first', 'following', 'following-sibling',
    'for', 'from', 'ftand', 'ftnot', 'ft-option', 'ftor', 'function', 'fuzzy', 'greatest', 'group',
    'if', 'import', 'in', 'inherit', 'insensitive', 'insert', 'instance', 'intersect', 'into',
    'invoke', 'is', 'item', 'language', 'last', 'lax', 'least', 'let', 'levels', 'lowercase', 'map',
    'modify', 'module', 'most', 'namespace', 'next', 'no', 'node', 'nodes', 'no-inherit',
    'no-preserve', 'not', 'occurs', 'of', 'only', 'option', 'order', 'ordered', 'ordering',
    'paragraph', 'paragraphs', 'parent', 'phrase', 'preceding', 'preceding-sibling', 'preserve',
    'previous', 'processing-instruction', 'relationship', 'rename', 'replace', 'return',
    'revalidation', 'same', 'satisfies', 'schema', 'schema-attribute', 'schema-element', 'score',
    'self', 'sensitive', 'sentence', 'sentences', 'sequence', 'skip', 'sliding', 'some', 'stable',
    'start', 'stemming', 'stop', 'strict', 'strip', 'switch', 'text', 'then', 'thesaurus', 'times',
    'to', 'transform', 'treat', 'try', 'tumbling', 'type', 'typeswitch', 'union', 'unordered',
    'update', 'updating', 'uppercase', 'using', 'validate', 'value', 'variable', 'version',
    'weight', 'when', 'where', 'wildcards', 'window', 'with', 'without', 'word', 'words', 'xquery'];
    for(var i=0, l=basic.length; i < l; i++) { kwObj[basic[i]] = kw(basic[i]);};

    // a list of types. For each add a property to kwObj with the value of
    // {type: "atom", style: "atom"}
    var types = ['xs:anyAtomicType', 'xs:anySimpleType', 'xs:anyType', 'xs:anyURI',
    'xs:base64Binary', 'xs:boolean', 'xs:byte', 'xs:date', 'xs:dateTime', 'xs:dateTimeStamp',
    'xs:dayTimeDuration', 'xs:decimal', 'xs:double', 'xs:duration', 'xs:ENTITIES', 'xs:ENTITY',
    'xs:float', 'xs:gDay', 'xs:gMonth', 'xs:gMonthDay', 'xs:gYear', 'xs:gYearMonth', 'xs:hexBinary',
    'xs:ID', 'xs:IDREF', 'xs:IDREFS', 'xs:int', 'xs:integer', 'xs:item', 'xs:java', 'xs:language',
    'xs:long', 'xs:Name', 'xs:NCName', 'xs:negativeInteger', 'xs:NMTOKEN', 'xs:NMTOKENS',
    'xs:nonNegativeInteger', 'xs:nonPositiveInteger', 'xs:normalizedString', 'xs:NOTATION',
    'xs:numeric', 'xs:positiveInteger', 'xs:precisionDecimal', 'xs:QName', 'xs:short', 'xs:string',
    'xs:time', 'xs:token', 'xs:unsignedByte', 'xs:unsignedInt', 'xs:unsignedLong',
    'xs:unsignedShort', 'xs:untyped', 'xs:untypedAtomic', 'xs:yearMonthDuration'];
    for(var i=0, l=types.length; i < l; i++) { kwObj[types[i]] = atom;};

    // each operator will add a property to kwObj with value of {type: "operator", style: "keyword"}
    var operators = ['eq', 'ne', 'lt', 'le', 'gt', 'ge', ':=', '=', '>', '>=', '<', '<=', '.', '|', '?', 'and', 'or', 'div', 'idiv', 'mod', '*', '/', '+', '-'];
    for(var i=0, l=operators.length; i < l; i++) { kwObj[operators[i]] = operator;};

    // each axis_specifiers will add a property to kwObj with value of {type: "axis_specifier", style: "qualifier"}
    var axis_specifiers = ["self::", "attribute::", "child::", "descendant::", "descendant-or-self::", "parent::",
    "ancestor::", "ancestor-or-self::", "following::", "preceding::", "following-sibling::", "preceding-sibling::"];
    for(var i=0, l=axis_specifiers.length; i < l; i++) { kwObj[axis_specifiers[i]] = qualifier; };

    return kwObj;
  }();

  function chain(stream, state, f) {
    state.tokenize = f;
    return f(stream, state);
  }

  // the primary mode tokenizer
  function tokenBase(stream, state) {
    var ch = stream.next(),
        mightBeFunction = false,
        isEQName = isEQNameAhead(stream);

    // an XML tag (if not in some sub, chained tokenizer)
    if (ch == "<") {
      if(stream.match("!--", true))
        return chain(stream, state, tokenXMLComment);

      if(stream.match("![CDATA", false)) {
        state.tokenize = tokenCDATA;
        return "tag";
      }

      if(stream.match("?", false)) {
        return chain(stream, state, tokenPreProcessing);
      }

      var isclose = stream.eat("/");
      stream.eatSpace();
      var tagName = "", c;
      while ((c = stream.eat(/[^\s\u00a0=<>\"\'\/?]/))) tagName += c;

      return chain(stream, state, tokenTag(tagName, isclose));
    }
    // start code block
    else if(ch == "{") {
      pushStateStack(state, { type: "codeblock"});
      return null;
    }
    // end code block
    else if(ch == "}") {
      popStateStack(state);
      return null;
    }
    // if we're in an XML block
    else if(isInXmlBlock(state)) {
      if(ch == ">")
        return "tag";
      else if(ch == "/" && stream.eat(">")) {
        popStateStack(state);
        return "tag";
      }
      else
        return "variable";
    }
    // if a number
    else if (/\d/.test(ch)) {
      stream.match(/^\d*(?:\.\d*)?(?:E[+\-]?\d+)?/);
      return "atom";
    }
    // comment start
    else if (ch === "(" && stream.eat(":")) {
      pushStateStack(state, { type: "comment"});
      return chain(stream, state, tokenComment);
    }
    // quoted string
    else if (!isEQName && (ch === '"' || ch === "'"))
      return chain(stream, state, tokenString(ch));
    // variable
    else if(ch === "$") {
      return chain(stream, state, tokenVariable);
    }
    // assignment
    else if(ch ===":" && stream.eat("=")) {
      return "keyword";
    }
    // open paren
    else if(ch === "(") {
      pushStateStack(state, { type: "paren"});
      return null;
    }
    // close paren
    else if(ch === ")") {
      popStateStack(state);
      return null;
    }
    // open paren
    else if(ch === "[") {
      pushStateStack(state, { type: "bracket"});
      return null;
    }
    // close paren
    else if(ch === "]") {
      popStateStack(state);
      return null;
    }
    else {
      var known = keywords.propertyIsEnumerable(ch) && keywords[ch];

      // if there's a EQName ahead, consume the rest of the string portion, it's likely a function
      if(isEQName && ch === '\"') while(stream.next() !== '"'){}
      if(isEQName && ch === '\'') while(stream.next() !== '\''){}

      // gobble up a word if the character is not known
      if(!known) stream.eatWhile(/[\w\$_-]/);

      // gobble a colon in the case that is a lib func type call fn:doc
      var foundColon = stream.eat(":");

      // if there's not a second colon, gobble another word. Otherwise, it's probably an axis specifier
      // which should get matched as a keyword
      if(!stream.eat(":") && foundColon) {
        stream.eatWhile(/[\w\$_-]/);
      }
      // if the next non whitespace character is an open paren, this is probably a function (if not a keyword of other sort)
      if(stream.match(/^[ \t]*\(/, false)) {
        mightBeFunction = true;
      }
      // is the word a keyword?
      var word = stream.current();
      known = keywords.propertyIsEnumerable(word) && keywords[word];

      // if we think it's a function call but not yet known,
      // set style to variable for now for lack of something better
      if(mightBeFunction && !known) known = {type: "function_call", style: "variable def"};

      // if the previous word was element, attribute, axis specifier, this word should be the name of that
      if(isInXmlConstructor(state)) {
        popStateStack(state);
        return "variable";
      }
      // as previously checked, if the word is element,attribute, axis specifier, call it an "xmlconstructor" and
      // push the stack so we know to look for it on the next word
      if(word == "element" || word == "attribute" || known.type == "axis_specifier") pushStateStack(state, {type: "xmlconstructor"});

      // if the word is known, return the details of that else just call this a generic 'word'
      return known ? known.style : "variable";
    }
  }

  // handle comments, including nested
  function tokenComment(stream, state) {
    var maybeEnd = false, maybeNested = false, nestedCount = 0, ch;
    while (ch = stream.next()) {
      if (ch == ")" && maybeEnd) {
        if(nestedCount > 0)
          nestedCount--;
        else {
          popStateStack(state);
          break;
        }
      }
      else if(ch == ":" && maybeNested) {
        nestedCount++;
      }
      maybeEnd = (ch == ":");
      maybeNested = (ch == "(");
    }

    return "comment";
  }

  // tokenizer for string literals
  // optionally pass a tokenizer function to set state.tokenize back to when finished
  function tokenString(quote, f) {
    return function(stream, state) {
      var ch;

      if(isInString(state) && stream.current() == quote) {
        popStateStack(state);
        if(f) state.tokenize = f;
        return "string";
      }

      pushStateStack(state, { type: "string", name: quote, tokenize: tokenString(quote, f) });

      // if we're in a string and in an XML block, allow an embedded code block
      if(stream.match("{", false) && isInXmlAttributeBlock(state)) {
        state.tokenize = tokenBase;
        return "string";
      }


      while (ch = stream.next()) {
        if (ch ==  quote) {
          popStateStack(state);
          if(f) state.tokenize = f;
          break;
        }
        else {
          // if we're in a string and in an XML block, allow an embedded code block in an attribute
          if(stream.match("{", false) && isInXmlAttributeBlock(state)) {
            state.tokenize = tokenBase;
            return "string";
          }

        }
      }

      return "string";
    };
  }

  // tokenizer for variables
  function tokenVariable(stream, state) {
    var isVariableChar = /[\w\$_-]/;

    // a variable may start with a quoted EQName so if the next character is quote, consume to the next quote
    if(stream.eat("\"")) {
      while(stream.next() !== '\"'){};
      stream.eat(":");
    } else {
      stream.eatWhile(isVariableChar);
      if(!stream.match(":=", false)) stream.eat(":");
    }
    stream.eatWhile(isVariableChar);
    state.tokenize = tokenBase;
    return "variable";
  }

  // tokenizer for XML tags
  function tokenTag(name, isclose) {
    return function(stream, state) {
      stream.eatSpace();
      if(isclose && stream.eat(">")) {
        popStateStack(state);
        state.tokenize = tokenBase;
        return "tag";
      }
      // self closing tag without attributes?
      if(!stream.eat("/"))
        pushStateStack(state, { type: "tag", name: name, tokenize: tokenBase});
      if(!stream.eat(">")) {
        state.tokenize = tokenAttribute;
        return "tag";
      }
      else {
        state.tokenize = tokenBase;
      }
      return "tag";
    };
  }

  // tokenizer for XML attributes
  function tokenAttribute(stream, state) {
    var ch = stream.next();

    if(ch == "/" && stream.eat(">")) {
      if(isInXmlAttributeBlock(state)) popStateStack(state);
      if(isInXmlBlock(state)) popStateStack(state);
      return "tag";
    }
    if(ch == ">") {
      if(isInXmlAttributeBlock(state)) popStateStack(state);
      return "tag";
    }
    if(ch == "=")
      return null;
    // quoted string
    if (ch == '"' || ch == "'")
      return chain(stream, state, tokenString(ch, tokenAttribute));

    if(!isInXmlAttributeBlock(state))
      pushStateStack(state, { type: "attribute", tokenize: tokenAttribute});

    stream.eat(/[a-zA-Z_:]/);
    stream.eatWhile(/[-a-zA-Z0-9_:.]/);
    stream.eatSpace();

    // the case where the attribute has not value and the tag was closed
    if(stream.match(">", false) || stream.match("/", false)) {
      popStateStack(state);
      state.tokenize = tokenBase;
    }

    return "attribute";
  }

  // handle comments, including nested
  function tokenXMLComment(stream, state) {
    var ch;
    while (ch = stream.next()) {
      if (ch == "-" && stream.match("->", true)) {
        state.tokenize = tokenBase;
        return "comment";
      }
    }
  }


  // handle CDATA
  function tokenCDATA(stream, state) {
    var ch;
    while (ch = stream.next()) {
      if (ch == "]" && stream.match("]", true)) {
        state.tokenize = tokenBase;
        return "comment";
      }
    }
  }

  // handle preprocessing instructions
  function tokenPreProcessing(stream, state) {
    var ch;
    while (ch = stream.next()) {
      if (ch == "?" && stream.match(">", true)) {
        state.tokenize = tokenBase;
        return "comment meta";
      }
    }
  }


  // functions to test the current context of the state
  function isInXmlBlock(state) { return isIn(state, "tag"); }
  function isInXmlAttributeBlock(state) { return isIn(state, "attribute"); }
  function isInXmlConstructor(state) { return isIn(state, "xmlconstructor"); }
  function isInString(state) { return isIn(state, "string"); }

  function isEQNameAhead(stream) {
    // assume we've already eaten a quote (")
    if(stream.current() === '"')
      return stream.match(/^[^\"]+\"\:/, false);
    else if(stream.current() === '\'')
      return stream.match(/^[^\"]+\'\:/, false);
    else
      return false;
  }

  function isIn(state, type) {
    return (state.stack.length && state.stack[state.stack.length - 1].type == type);
  }

  function pushStateStack(state, newState) {
    state.stack.push(newState);
  }

  function popStateStack(state) {
    state.stack.pop();
    var reinstateTokenize = state.stack.length && state.stack[state.stack.length-1].tokenize;
    state.tokenize = reinstateTokenize || tokenBase;
  }

  // the interface for the mode API
  return {
    startState: function() {
      return {
        tokenize: tokenBase,
        cc: [],
        stack: []
      };
    },

    token: function(stream, state) {
      if (stream.eatSpace()) return null;
      var style = state.tokenize(stream, state);
      return style;
    },

    blockCommentStart: "(:",
    blockCommentEnd: ":)"

  };

});

CodeMirror.defineMIME("application/xquery", "xquery");

});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/yacas/yacas.js":
/*!************************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/yacas/yacas.js ***!
  \************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

// Yacas mode copyright (c) 2015 by Grzegorz Mazur
// Loosely based on mathematica mode by Calin Barbat

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"));
  else {}
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode('yacas', function(_config, _parserConfig) {

  function words(str) {
    var obj = {}, words = str.split(" ");
    for (var i = 0; i < words.length; ++i) obj[words[i]] = true;
    return obj;
  }

  var bodiedOps = words("Assert BackQuote D Defun Deriv For ForEach FromFile " +
                        "FromString Function Integrate InverseTaylor Limit " +
                        "LocalSymbols Macro MacroRule MacroRulePattern " +
                        "NIntegrate Rule RulePattern Subst TD TExplicitSum " +
                        "TSum Taylor Taylor1 Taylor2 Taylor3 ToFile " +
                        "ToStdout ToString TraceRule Until While");

  // patterns
  var pFloatForm  = "(?:(?:\\.\\d+|\\d+\\.\\d*|\\d+)(?:[eE][+-]?\\d+)?)";
  var pIdentifier = "(?:[a-zA-Z\\$'][a-zA-Z0-9\\$']*)";

  // regular expressions
  var reFloatForm    = new RegExp(pFloatForm);
  var reIdentifier   = new RegExp(pIdentifier);
  var rePattern      = new RegExp(pIdentifier + "?_" + pIdentifier);
  var reFunctionLike = new RegExp(pIdentifier + "\\s*\\(");

  function tokenBase(stream, state) {
    var ch;

    // get next character
    ch = stream.next();

    // string
    if (ch === '"') {
      state.tokenize = tokenString;
      return state.tokenize(stream, state);
    }

    // comment
    if (ch === '/') {
      if (stream.eat('*')) {
        state.tokenize = tokenComment;
        return state.tokenize(stream, state);
      }
      if (stream.eat("/")) {
        stream.skipToEnd();
        return "comment";
      }
    }

    // go back one character
    stream.backUp(1);

    // update scope info
    var m = stream.match(/^(\w+)\s*\(/, false);
    if (m !== null && bodiedOps.hasOwnProperty(m[1]))
      state.scopes.push('bodied');

    var scope = currentScope(state);

    if (scope === 'bodied' && ch === '[')
      state.scopes.pop();

    if (ch === '[' || ch === '{' || ch === '(')
      state.scopes.push(ch);

    scope = currentScope(state);

    if (scope === '[' && ch === ']' ||
        scope === '{' && ch === '}' ||
        scope === '(' && ch === ')')
      state.scopes.pop();

    if (ch === ';') {
      while (scope === 'bodied') {
        state.scopes.pop();
        scope = currentScope(state);
      }
    }

    // look for ordered rules
    if (stream.match(/\d+ *#/, true, false)) {
      return 'qualifier';
    }

    // look for numbers
    if (stream.match(reFloatForm, true, false)) {
      return 'number';
    }

    // look for placeholders
    if (stream.match(rePattern, true, false)) {
      return 'variable-3';
    }

    // match all braces separately
    if (stream.match(/(?:\[|\]|{|}|\(|\))/, true, false)) {
      return 'bracket';
    }

    // literals looking like function calls
    if (stream.match(reFunctionLike, true, false)) {
      stream.backUp(1);
      return 'variable';
    }

    // all other identifiers
    if (stream.match(reIdentifier, true, false)) {
      return 'variable-2';
    }

    // operators; note that operators like @@ or /; are matched separately for each symbol.
    if (stream.match(/(?:\\|\+|\-|\*|\/|,|;|\.|:|@|~|=|>|<|&|\||_|`|'|\^|\?|!|%|#)/, true, false)) {
      return 'operator';
    }

    // everything else is an error
    return 'error';
  }

  function tokenString(stream, state) {
    var next, end = false, escaped = false;
    while ((next = stream.next()) != null) {
      if (next === '"' && !escaped) {
        end = true;
        break;
      }
      escaped = !escaped && next === '\\';
    }
    if (end && !escaped) {
      state.tokenize = tokenBase;
    }
    return 'string';
  };

  function tokenComment(stream, state) {
    var prev, next;
    while((next = stream.next()) != null) {
      if (prev === '*' && next === '/') {
        state.tokenize = tokenBase;
        break;
      }
      prev = next;
    }
    return 'comment';
  }

  function currentScope(state) {
    var scope = null;
    if (state.scopes.length > 0)
      scope = state.scopes[state.scopes.length - 1];
    return scope;
  }

  return {
    startState: function() {
      return {
        tokenize: tokenBase,
        scopes: []
      };
    },
    token: function(stream, state) {
      if (stream.eatSpace()) return null;
      return state.tokenize(stream, state);
    },
    indent: function(state, textAfter) {
      if (state.tokenize !== tokenBase && state.tokenize !== null)
        return CodeMirror.Pass;

      var delta = 0;
      if (textAfter === ']' || textAfter === '];' ||
          textAfter === '}' || textAfter === '};' ||
          textAfter === ');')
        delta = -1;

      return (state.scopes.length + delta) * _config.indentUnit;
    },
    electricChars: "{}[]();",
    blockCommentStart: "/*",
    blockCommentEnd: "*/",
    lineComment: "//"
  };
});

CodeMirror.defineMIME('text/x-yacas', {
  name: 'yacas'
});

});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/yaml-frontmatter/yaml-frontmatter.js":
/*!**********************************************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/yaml-frontmatter/yaml-frontmatter.js ***!
  \**********************************************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function (mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"), __webpack_require__(/*! ../yaml/yaml */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/yaml/yaml.js"))
  else {}
})(function (CodeMirror) {

  var START = 0, FRONTMATTER = 1, BODY = 2

  // a mixed mode for Markdown text with an optional YAML front matter
  CodeMirror.defineMode("yaml-frontmatter", function (config, parserConfig) {
    var yamlMode = CodeMirror.getMode(config, "yaml")
    var innerMode = CodeMirror.getMode(config, parserConfig && parserConfig.base || "gfm")

    function curMode(state) {
      return state.state == BODY ? innerMode : yamlMode
    }

    return {
      startState: function () {
        return {
          state: START,
          inner: CodeMirror.startState(yamlMode)
        }
      },
      copyState: function (state) {
        return {
          state: state.state,
          inner: CodeMirror.copyState(curMode(state), state.inner)
        }
      },
      token: function (stream, state) {
        if (state.state == START) {
          if (stream.match(/---/, false)) {
            state.state = FRONTMATTER
            return yamlMode.token(stream, state.inner)
          } else {
            state.state = BODY
            state.inner = CodeMirror.startState(innerMode)
            return innerMode.token(stream, state.inner)
          }
        } else if (state.state == FRONTMATTER) {
          var end = stream.sol() && stream.match(/---/, false)
          var style = yamlMode.token(stream, state.inner)
          if (end) {
            state.state = BODY
            state.inner = CodeMirror.startState(innerMode)
          }
          return style
        } else {
          return innerMode.token(stream, state.inner)
        }
      },
      innerMode: function (state) {
        return {mode: curMode(state), state: state.inner}
      },
      blankLine: function (state) {
        var mode = curMode(state)
        if (mode.blankLine) return mode.blankLine(state.inner)
      }
    }
  })
});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/yaml/yaml.js":
/*!**********************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/yaml/yaml.js ***!
  \**********************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function(mod) {
  if (true) // CommonJS
    mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"));
  else {}
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode("yaml", function() {

  var cons = ['true', 'false', 'on', 'off', 'yes', 'no'];
  var keywordRegex = new RegExp("\\b(("+cons.join(")|(")+"))$", 'i');

  return {
    token: function(stream, state) {
      var ch = stream.peek();
      var esc = state.escaped;
      state.escaped = false;
      /* comments */
      if (ch == "#" && (stream.pos == 0 || /\s/.test(stream.string.charAt(stream.pos - 1)))) {
        stream.skipToEnd();
        return "comment";
      }

      if (stream.match(/^('([^']|\\.)*'?|"([^"]|\\.)*"?)/))
        return "string";

      if (state.literal && stream.indentation() > state.keyCol) {
        stream.skipToEnd(); return "string";
      } else if (state.literal) { state.literal = false; }
      if (stream.sol()) {
        state.keyCol = 0;
        state.pair = false;
        state.pairStart = false;
        /* document start */
        if(stream.match(/---/)) { return "def"; }
        /* document end */
        if (stream.match(/\.\.\./)) { return "def"; }
        /* array list item */
        if (stream.match(/\s*-\s+/)) { return 'meta'; }
      }
      /* inline pairs/lists */
      if (stream.match(/^(\{|\}|\[|\])/)) {
        if (ch == '{')
          state.inlinePairs++;
        else if (ch == '}')
          state.inlinePairs--;
        else if (ch == '[')
          state.inlineList++;
        else
          state.inlineList--;
        return 'meta';
      }

      /* list seperator */
      if (state.inlineList > 0 && !esc && ch == ',') {
        stream.next();
        return 'meta';
      }
      /* pairs seperator */
      if (state.inlinePairs > 0 && !esc && ch == ',') {
        state.keyCol = 0;
        state.pair = false;
        state.pairStart = false;
        stream.next();
        return 'meta';
      }

      /* start of value of a pair */
      if (state.pairStart) {
        /* block literals */
        if (stream.match(/^\s*(\||\>)\s*/)) { state.literal = true; return 'meta'; };
        /* references */
        if (stream.match(/^\s*(\&|\*)[a-z0-9\._-]+\b/i)) { return 'variable-2'; }
        /* numbers */
        if (state.inlinePairs == 0 && stream.match(/^\s*-?[0-9\.\,]+\s?$/)) { return 'number'; }
        if (state.inlinePairs > 0 && stream.match(/^\s*-?[0-9\.\,]+\s?(?=(,|}))/)) { return 'number'; }
        /* keywords */
        if (stream.match(keywordRegex)) { return 'keyword'; }
      }

      /* pairs (associative arrays) -> key */
      if (!state.pair && stream.match(/^\s*(?:[,\[\]{}&*!|>'"%@`][^\s'":]|[^,\[\]{}#&*!|>'"%@`])[^#]*?(?=\s*:($|\s))/)) {
        state.pair = true;
        state.keyCol = stream.indentation();
        return "atom";
      }
      if (state.pair && stream.match(/^:\s*/)) { state.pairStart = true; return 'meta'; }

      /* nothing found, continue */
      state.pairStart = false;
      state.escaped = (ch == '\\');
      stream.next();
      return null;
    },
    startState: function() {
      return {
        pair: false,
        pairStart: false,
        keyCol: 0,
        inlinePairs: 0,
        inlineList: 0,
        literal: false,
        escaped: false
      };
    },
    lineComment: "#",
    fold: "indent"
  };
});

CodeMirror.defineMIME("text/x-yaml", "yaml");
CodeMirror.defineMIME("text/yaml", "yaml");

});


/***/ }),

/***/ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/z80/z80.js":
/*!********************************************************************************************!*\
  !*** ./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/mode/z80/z80.js ***!
  \********************************************************************************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: https://codemirror.net/LICENSE

(function(mod) {
  if (true) // CommonJS
  mod(__webpack_require__(/*! ../../lib/codemirror */ "./node_modules/@jupyter-widgets/html-manager/node_modules/codemirror/lib/codemirror.js"));
  else {}
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode('z80', function(_config, parserConfig) {
  var ez80 = parserConfig.ez80;
  var keywords1, keywords2;
  if (ez80) {
    keywords1 = /^(exx?|(ld|cp)([di]r?)?|[lp]ea|pop|push|ad[cd]|cpl|daa|dec|inc|neg|sbc|sub|and|bit|[cs]cf|x?or|res|set|r[lr]c?a?|r[lr]d|s[lr]a|srl|djnz|nop|[de]i|halt|im|in([di]mr?|ir?|irx|2r?)|ot(dmr?|[id]rx|imr?)|out(0?|[di]r?|[di]2r?)|tst(io)?|slp)(\.([sl]?i)?[sl])?\b/i;
    keywords2 = /^(((call|j[pr]|rst|ret[in]?)(\.([sl]?i)?[sl])?)|(rs|st)mix)\b/i;
  } else {
    keywords1 = /^(exx?|(ld|cp|in)([di]r?)?|pop|push|ad[cd]|cpl|daa|dec|inc|neg|sbc|sub|and|bit|[cs]cf|x?or|res|set|r[lr]c?a?|r[lr]d|s[lr]a|srl|djnz|nop|rst|[de]i|halt|im|ot[di]r|out[di]?)\b/i;
    keywords2 = /^(call|j[pr]|ret[in]?|b_?(call|jump))\b/i;
  }

  var variables1 = /^(af?|bc?|c|de?|e|hl?|l|i[xy]?|r|sp)\b/i;
  var variables2 = /^(n?[zc]|p[oe]?|m)\b/i;
  var errors = /^([hl][xy]|i[xy][hl]|slia|sll)\b/i;
  var numbers = /^([\da-f]+h|[0-7]+o|[01]+b|\d+d?)\b/i;

  return {
    startState: function() {
      return {
        context: 0
      };
    },
    token: function(stream, state) {
      if (!stream.column())
        state.context = 0;

      if (stream.eatSpace())
        return null;

      var w;

      if (stream.eatWhile(/\w/)) {
        if (ez80 && stream.eat('.')) {
          stream.eatWhile(/\w/);
        }
        w = stream.current();

        if (stream.indentation()) {
          if ((state.context == 1 || state.context == 4) && variables1.test(w)) {
            state.context = 4;
            return 'var2';
          }

          if (state.context == 2 && variables2.test(w)) {
            state.context = 4;
            return 'var3';
          }

          if (keywords1.test(w)) {
            state.context = 1;
            return 'keyword';
          } else if (keywords2.test(w)) {
            state.context = 2;
            return 'keyword';
          } else if (state.context == 4 && numbers.test(w)) {
            return 'number';
          }

          if (errors.test(w))
            return 'error';
        } else if (stream.match(numbers)) {
          return 'number';
        } else {
          return null;
        }
      } else if (stream.eat(';')) {
        stream.skipToEnd();
        return 'comment';
      } else if (stream.eat('"')) {
        while (w = stream.next()) {
          if (w == '"')
            break;

          if (w == '\\')
            stream.next();
        }
        return 'string';
      } else if (stream.eat('\'')) {
        if (stream.match(/\\?.'/))
          return 'number';
      } else if (stream.eat('.') || stream.sol() && stream.eat('#')) {
        state.context = 5;

        if (stream.eatWhile(/\w/))
          return 'def';
      } else if (stream.eat('$')) {
        if (stream.eatWhile(/[\da-f]/i))
          return 'number';
      } else if (stream.eat('%')) {
        if (stream.eatWhile(/[01]/))
          return 'number';
      } else {
        stream.next();
      }
      return null;
    }
  };
});

CodeMirror.defineMIME("text/x-z80", "z80");
CodeMirror.defineMIME("text/x-ez80", { name: "z80", ez80: true });

});


/***/ })

}]);
//# sourceMappingURL=0.index.js.map