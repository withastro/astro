
import acorn, { isIdentifierStart, isIdentifierChar, parse as parse$3, parseExpressionAt } from 'acorn';
import parse$2 from 'css-tree/lib/parser/index.js';
import MagicString from 'magic-string';

const now = (typeof process !== 'undefined' && process.hrtime)
	? () => {
		const t = process.hrtime();
		return t[0] * 1e3 + t[1] / 1e6;
	}
	: () => self.performance.now();








function collapse_timings(timings) {
	const result = {};
	timings.forEach(timing => {
		result[timing.label] = Object.assign({
			total: timing.end - timing.start
		}, timing.children && collapse_timings(timing.children));
	});
	return result;
}

class Stats {
	
	
	
	
	

	constructor() {
		this.start_time = now();
		this.stack = [];
		this.current_children = this.timings = [];
	}

	start(label) {
		const timing = {
			label,
			start: now(),
			end: null,
			children: []
		};

		this.current_children.push(timing);
		this.stack.push(timing);

		this.current_timing = timing;
		this.current_children = timing.children;
	}

	stop(label) {
		if (label !== this.current_timing.label) {
			throw new Error(`Mismatched timing labels (expected ${this.current_timing.label}, got ${label})`);
		}

		this.current_timing.end = now();
		this.stack.pop();
		this.current_timing = this.stack[this.stack.length - 1];
		this.current_children = this.current_timing ? this.current_timing.children : this.timings;
	}

	render() {
		const timings = Object.assign({
			total: now() - this.start_time
		}, collapse_timings(this.timings));

		return {
			timings
		};
	}
}

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var xhtml = {
  quot: '\u0022',
  amp: '&',
  apos: '\u0027',
  lt: '<',
  gt: '>',
  nbsp: '\u00A0',
  iexcl: '\u00A1',
  cent: '\u00A2',
  pound: '\u00A3',
  curren: '\u00A4',
  yen: '\u00A5',
  brvbar: '\u00A6',
  sect: '\u00A7',
  uml: '\u00A8',
  copy: '\u00A9',
  ordf: '\u00AA',
  laquo: '\u00AB',
  not: '\u00AC',
  shy: '\u00AD',
  reg: '\u00AE',
  macr: '\u00AF',
  deg: '\u00B0',
  plusmn: '\u00B1',
  sup2: '\u00B2',
  sup3: '\u00B3',
  acute: '\u00B4',
  micro: '\u00B5',
  para: '\u00B6',
  middot: '\u00B7',
  cedil: '\u00B8',
  sup1: '\u00B9',
  ordm: '\u00BA',
  raquo: '\u00BB',
  frac14: '\u00BC',
  frac12: '\u00BD',
  frac34: '\u00BE',
  iquest: '\u00BF',
  Agrave: '\u00C0',
  Aacute: '\u00C1',
  Acirc: '\u00C2',
  Atilde: '\u00C3',
  Auml: '\u00C4',
  Aring: '\u00C5',
  AElig: '\u00C6',
  Ccedil: '\u00C7',
  Egrave: '\u00C8',
  Eacute: '\u00C9',
  Ecirc: '\u00CA',
  Euml: '\u00CB',
  Igrave: '\u00CC',
  Iacute: '\u00CD',
  Icirc: '\u00CE',
  Iuml: '\u00CF',
  ETH: '\u00D0',
  Ntilde: '\u00D1',
  Ograve: '\u00D2',
  Oacute: '\u00D3',
  Ocirc: '\u00D4',
  Otilde: '\u00D5',
  Ouml: '\u00D6',
  times: '\u00D7',
  Oslash: '\u00D8',
  Ugrave: '\u00D9',
  Uacute: '\u00DA',
  Ucirc: '\u00DB',
  Uuml: '\u00DC',
  Yacute: '\u00DD',
  THORN: '\u00DE',
  szlig: '\u00DF',
  agrave: '\u00E0',
  aacute: '\u00E1',
  acirc: '\u00E2',
  atilde: '\u00E3',
  auml: '\u00E4',
  aring: '\u00E5',
  aelig: '\u00E6',
  ccedil: '\u00E7',
  egrave: '\u00E8',
  eacute: '\u00E9',
  ecirc: '\u00EA',
  euml: '\u00EB',
  igrave: '\u00EC',
  iacute: '\u00ED',
  icirc: '\u00EE',
  iuml: '\u00EF',
  eth: '\u00F0',
  ntilde: '\u00F1',
  ograve: '\u00F2',
  oacute: '\u00F3',
  ocirc: '\u00F4',
  otilde: '\u00F5',
  ouml: '\u00F6',
  divide: '\u00F7',
  oslash: '\u00F8',
  ugrave: '\u00F9',
  uacute: '\u00FA',
  ucirc: '\u00FB',
  uuml: '\u00FC',
  yacute: '\u00FD',
  thorn: '\u00FE',
  yuml: '\u00FF',
  OElig: '\u0152',
  oelig: '\u0153',
  Scaron: '\u0160',
  scaron: '\u0161',
  Yuml: '\u0178',
  fnof: '\u0192',
  circ: '\u02C6',
  tilde: '\u02DC',
  Alpha: '\u0391',
  Beta: '\u0392',
  Gamma: '\u0393',
  Delta: '\u0394',
  Epsilon: '\u0395',
  Zeta: '\u0396',
  Eta: '\u0397',
  Theta: '\u0398',
  Iota: '\u0399',
  Kappa: '\u039A',
  Lambda: '\u039B',
  Mu: '\u039C',
  Nu: '\u039D',
  Xi: '\u039E',
  Omicron: '\u039F',
  Pi: '\u03A0',
  Rho: '\u03A1',
  Sigma: '\u03A3',
  Tau: '\u03A4',
  Upsilon: '\u03A5',
  Phi: '\u03A6',
  Chi: '\u03A7',
  Psi: '\u03A8',
  Omega: '\u03A9',
  alpha: '\u03B1',
  beta: '\u03B2',
  gamma: '\u03B3',
  delta: '\u03B4',
  epsilon: '\u03B5',
  zeta: '\u03B6',
  eta: '\u03B7',
  theta: '\u03B8',
  iota: '\u03B9',
  kappa: '\u03BA',
  lambda: '\u03BB',
  mu: '\u03BC',
  nu: '\u03BD',
  xi: '\u03BE',
  omicron: '\u03BF',
  pi: '\u03C0',
  rho: '\u03C1',
  sigmaf: '\u03C2',
  sigma: '\u03C3',
  tau: '\u03C4',
  upsilon: '\u03C5',
  phi: '\u03C6',
  chi: '\u03C7',
  psi: '\u03C8',
  omega: '\u03C9',
  thetasym: '\u03D1',
  upsih: '\u03D2',
  piv: '\u03D6',
  ensp: '\u2002',
  emsp: '\u2003',
  thinsp: '\u2009',
  zwnj: '\u200C',
  zwj: '\u200D',
  lrm: '\u200E',
  rlm: '\u200F',
  ndash: '\u2013',
  mdash: '\u2014',
  lsquo: '\u2018',
  rsquo: '\u2019',
  sbquo: '\u201A',
  ldquo: '\u201C',
  rdquo: '\u201D',
  bdquo: '\u201E',
  dagger: '\u2020',
  Dagger: '\u2021',
  bull: '\u2022',
  hellip: '\u2026',
  permil: '\u2030',
  prime: '\u2032',
  Prime: '\u2033',
  lsaquo: '\u2039',
  rsaquo: '\u203A',
  oline: '\u203E',
  frasl: '\u2044',
  euro: '\u20AC',
  image: '\u2111',
  weierp: '\u2118',
  real: '\u211C',
  trade: '\u2122',
  alefsym: '\u2135',
  larr: '\u2190',
  uarr: '\u2191',
  rarr: '\u2192',
  darr: '\u2193',
  harr: '\u2194',
  crarr: '\u21B5',
  lArr: '\u21D0',
  uArr: '\u21D1',
  rArr: '\u21D2',
  dArr: '\u21D3',
  hArr: '\u21D4',
  forall: '\u2200',
  part: '\u2202',
  exist: '\u2203',
  empty: '\u2205',
  nabla: '\u2207',
  isin: '\u2208',
  notin: '\u2209',
  ni: '\u220B',
  prod: '\u220F',
  sum: '\u2211',
  minus: '\u2212',
  lowast: '\u2217',
  radic: '\u221A',
  prop: '\u221D',
  infin: '\u221E',
  ang: '\u2220',
  and: '\u2227',
  or: '\u2228',
  cap: '\u2229',
  cup: '\u222A',
  'int': '\u222B',
  there4: '\u2234',
  sim: '\u223C',
  cong: '\u2245',
  asymp: '\u2248',
  ne: '\u2260',
  equiv: '\u2261',
  le: '\u2264',
  ge: '\u2265',
  sub: '\u2282',
  sup: '\u2283',
  nsub: '\u2284',
  sube: '\u2286',
  supe: '\u2287',
  oplus: '\u2295',
  otimes: '\u2297',
  perp: '\u22A5',
  sdot: '\u22C5',
  lceil: '\u2308',
  rceil: '\u2309',
  lfloor: '\u230A',
  rfloor: '\u230B',
  lang: '\u2329',
  rang: '\u232A',
  loz: '\u25CA',
  spades: '\u2660',
  clubs: '\u2663',
  hearts: '\u2665',
  diams: '\u2666'
};

var acornJsx = createCommonjsModule(function (module) {



const hexNumber = /^[\da-fA-F]+$/;
const decimalNumber = /^\d+$/;

// The map to `acorn-jsx` tokens from `acorn` namespace objects.
const acornJsxMap = new WeakMap();

// Get the original tokens for the given `acorn` namespace object.
function getJsxTokens(acorn) {
  acorn = acorn.Parser.acorn || acorn;
  let acornJsx = acornJsxMap.get(acorn);
  if (!acornJsx) {
    const tt = acorn.tokTypes;
    const TokContext = acorn.TokContext;
    const TokenType = acorn.TokenType;
    const tc_oTag = new TokContext('<tag', false);
    const tc_cTag = new TokContext('</tag', false);
    const tc_expr = new TokContext('<tag>...</tag>', true, true);
    const tokContexts = {
      tc_oTag: tc_oTag,
      tc_cTag: tc_cTag,
      tc_expr: tc_expr
    };
    const tokTypes = {
      jsxName: new TokenType('jsxName'),
      jsxText: new TokenType('jsxText', {beforeExpr: true}),
      jsxTagStart: new TokenType('jsxTagStart', {startsExpr: true}),
      jsxTagEnd: new TokenType('jsxTagEnd')
    };

    tokTypes.jsxTagStart.updateContext = function() {
      this.context.push(tc_expr); // treat as beginning of JSX expression
      this.context.push(tc_oTag); // start opening tag context
      this.exprAllowed = false;
    };
    tokTypes.jsxTagEnd.updateContext = function(prevType) {
      let out = this.context.pop();
      if (out === tc_oTag && prevType === tt.slash || out === tc_cTag) {
        this.context.pop();
        this.exprAllowed = this.curContext() === tc_expr;
      } else {
        this.exprAllowed = true;
      }
    };

    acornJsx = { tokContexts: tokContexts, tokTypes: tokTypes };
    acornJsxMap.set(acorn, acornJsx);
  }

  return acornJsx;
}

// Transforms JSX element name to string.

function getQualifiedJSXName(object) {
  if (!object)
    return object;

  if (object.type === 'JSXIdentifier')
    return object.name;

  if (object.type === 'JSXNamespacedName')
    return object.namespace.name + ':' + object.name.name;

  if (object.type === 'JSXMemberExpression')
    return getQualifiedJSXName(object.object) + '.' +
    getQualifiedJSXName(object.property);
}

module.exports = function(options) {
  options = options || {};
  return function(Parser) {
    return plugin({
      allowNamespaces: options.allowNamespaces !== false,
      allowNamespacedObjects: !!options.allowNamespacedObjects
    }, Parser);
  };
};

// This is `tokTypes` of the peer dep.
// This can be different instances from the actual `tokTypes` this plugin uses.
Object.defineProperty(module.exports, "tokTypes", {
  get: function get_tokTypes() {
    return getJsxTokens(acorn).tokTypes;
  },
  configurable: true,
  enumerable: true
});

function plugin(options, Parser) {
  const acorn$1 = Parser.acorn || acorn;
  const acornJsx = getJsxTokens(acorn$1);
  const tt = acorn$1.tokTypes;
  const tok = acornJsx.tokTypes;
  const tokContexts = acorn$1.tokContexts;
  const tc_oTag = acornJsx.tokContexts.tc_oTag;
  const tc_cTag = acornJsx.tokContexts.tc_cTag;
  const tc_expr = acornJsx.tokContexts.tc_expr;
  const isNewLine = acorn$1.isNewLine;
  const isIdentifierStart = acorn$1.isIdentifierStart;
  const isIdentifierChar = acorn$1.isIdentifierChar;

  return class extends Parser {
    // Expose actual `tokTypes` and `tokContexts` to other plugins.
    static get acornJsx() {
      return acornJsx;
    }

    // Reads inline JSX contents token.
    jsx_readToken() {
      let out = '', chunkStart = this.pos;
      for (;;) {
        if (this.pos >= this.input.length)
          this.raise(this.start, 'Unterminated JSX contents');
        let ch = this.input.charCodeAt(this.pos);

        switch (ch) {
        case 60: // '<'
        case 123: // '{'
          if (this.pos === this.start) {
            if (ch === 60 && this.exprAllowed) {
              ++this.pos;
              return this.finishToken(tok.jsxTagStart);
            }
            return this.getTokenFromCode(ch);
          }
          out += this.input.slice(chunkStart, this.pos);
          return this.finishToken(tok.jsxText, out);

        case 38: // '&'
          out += this.input.slice(chunkStart, this.pos);
          out += this.jsx_readEntity();
          chunkStart = this.pos;
          break;

        case 62: // '>'
        case 125: // '}'
          this.raise(
            this.pos,
            "Unexpected token `" + this.input[this.pos] + "`. Did you mean `" +
              (ch === 62 ? "&gt;" : "&rbrace;") + "` or " + "`{\"" + this.input[this.pos] + "\"}" + "`?"
          );

        default:
          if (isNewLine(ch)) {
            out += this.input.slice(chunkStart, this.pos);
            out += this.jsx_readNewLine(true);
            chunkStart = this.pos;
          } else {
            ++this.pos;
          }
        }
      }
    }

    jsx_readNewLine(normalizeCRLF) {
      let ch = this.input.charCodeAt(this.pos);
      let out;
      ++this.pos;
      if (ch === 13 && this.input.charCodeAt(this.pos) === 10) {
        ++this.pos;
        out = normalizeCRLF ? '\n' : '\r\n';
      } else {
        out = String.fromCharCode(ch);
      }
      if (this.options.locations) {
        ++this.curLine;
        this.lineStart = this.pos;
      }

      return out;
    }

    jsx_readString(quote) {
      let out = '', chunkStart = ++this.pos;
      for (;;) {
        if (this.pos >= this.input.length)
          this.raise(this.start, 'Unterminated string constant');
        let ch = this.input.charCodeAt(this.pos);
        if (ch === quote) break;
        if (ch === 38) { // '&'
          out += this.input.slice(chunkStart, this.pos);
          out += this.jsx_readEntity();
          chunkStart = this.pos;
        } else if (isNewLine(ch)) {
          out += this.input.slice(chunkStart, this.pos);
          out += this.jsx_readNewLine(false);
          chunkStart = this.pos;
        } else {
          ++this.pos;
        }
      }
      out += this.input.slice(chunkStart, this.pos++);
      return this.finishToken(tt.string, out);
    }

    jsx_readEntity() {
      let str = '', count = 0, entity;
      let ch = this.input[this.pos];
      if (ch !== '&')
        this.raise(this.pos, 'Entity must start with an ampersand');
      let startPos = ++this.pos;
      while (this.pos < this.input.length && count++ < 10) {
        ch = this.input[this.pos++];
        if (ch === ';') {
          if (str[0] === '#') {
            if (str[1] === 'x') {
              str = str.substr(2);
              if (hexNumber.test(str))
                entity = String.fromCharCode(parseInt(str, 16));
            } else {
              str = str.substr(1);
              if (decimalNumber.test(str))
                entity = String.fromCharCode(parseInt(str, 10));
            }
          } else {
            entity = xhtml[str];
          }
          break;
        }
        str += ch;
      }
      if (!entity) {
        this.pos = startPos;
        return '&';
      }
      return entity;
    }

    // Read a JSX identifier (valid tag or attribute name).
    //
    // Optimized version since JSX identifiers can't contain
    // escape characters and so can be read as single slice.
    // Also assumes that first character was already checked
    // by isIdentifierStart in readToken.

    jsx_readWord() {
      let ch, start = this.pos;
      do {
        ch = this.input.charCodeAt(++this.pos);
      } while (isIdentifierChar(ch) || ch === 45); // '-'
      return this.finishToken(tok.jsxName, this.input.slice(start, this.pos));
    }

    // Parse next token as JSX identifier

    jsx_parseIdentifier() {
      let node = this.startNode();
      if (this.type === tok.jsxName)
        node.name = this.value;
      else if (this.type.keyword)
        node.name = this.type.keyword;
      else
        this.unexpected();
      this.next();
      return this.finishNode(node, 'JSXIdentifier');
    }

    // Parse namespaced identifier.

    jsx_parseNamespacedName() {
      let startPos = this.start, startLoc = this.startLoc;
      let name = this.jsx_parseIdentifier();
      if (!options.allowNamespaces || !this.eat(tt.colon)) return name;
      var node = this.startNodeAt(startPos, startLoc);
      node.namespace = name;
      node.name = this.jsx_parseIdentifier();
      return this.finishNode(node, 'JSXNamespacedName');
    }

    // Parses element name in any form - namespaced, member
    // or single identifier.

    jsx_parseElementName() {
      if (this.type === tok.jsxTagEnd) return '';
      let startPos = this.start, startLoc = this.startLoc;
      let node = this.jsx_parseNamespacedName();
      if (this.type === tt.dot && node.type === 'JSXNamespacedName' && !options.allowNamespacedObjects) {
        this.unexpected();
      }
      while (this.eat(tt.dot)) {
        let newNode = this.startNodeAt(startPos, startLoc);
        newNode.object = node;
        newNode.property = this.jsx_parseIdentifier();
        node = this.finishNode(newNode, 'JSXMemberExpression');
      }
      return node;
    }

    // Parses any type of JSX attribute value.

    jsx_parseAttributeValue() {
      switch (this.type) {
      case tt.braceL:
        let node = this.jsx_parseExpressionContainer();
        if (node.expression.type === 'JSXEmptyExpression')
          this.raise(node.start, 'JSX attributes must only be assigned a non-empty expression');
        return node;

      case tok.jsxTagStart:
      case tt.string:
        return this.parseExprAtom();

      default:
        this.raise(this.start, 'JSX value should be either an expression or a quoted JSX text');
      }
    }

    // JSXEmptyExpression is unique type since it doesn't actually parse anything,
    // and so it should start at the end of last read token (left brace) and finish
    // at the beginning of the next one (right brace).

    jsx_parseEmptyExpression() {
      let node = this.startNodeAt(this.lastTokEnd, this.lastTokEndLoc);
      return this.finishNodeAt(node, 'JSXEmptyExpression', this.start, this.startLoc);
    }

    // Parses JSX expression enclosed into curly brackets.

    jsx_parseExpressionContainer() {
      let node = this.startNode();
      this.next();
      node.expression = this.type === tt.braceR
        ? this.jsx_parseEmptyExpression()
        : this.parseExpression();
      this.expect(tt.braceR);
      return this.finishNode(node, 'JSXExpressionContainer');
    }

    // Parses following JSX attribute name-value pair.

    jsx_parseAttribute() {
      let node = this.startNode();
      if (this.eat(tt.braceL)) {
        this.expect(tt.ellipsis);
        node.argument = this.parseMaybeAssign();
        this.expect(tt.braceR);
        return this.finishNode(node, 'JSXSpreadAttribute');
      }
      node.name = this.jsx_parseNamespacedName();
      node.value = this.eat(tt.eq) ? this.jsx_parseAttributeValue() : null;
      return this.finishNode(node, 'JSXAttribute');
    }

    // Parses JSX opening tag starting after '<'.

    jsx_parseOpeningElementAt(startPos, startLoc) {
      let node = this.startNodeAt(startPos, startLoc);
      node.attributes = [];
      let nodeName = this.jsx_parseElementName();
      if (nodeName) node.name = nodeName;
      while (this.type !== tt.slash && this.type !== tok.jsxTagEnd)
        node.attributes.push(this.jsx_parseAttribute());
      node.selfClosing = this.eat(tt.slash);
      this.expect(tok.jsxTagEnd);
      return this.finishNode(node, nodeName ? 'JSXOpeningElement' : 'JSXOpeningFragment');
    }

    // Parses JSX closing tag starting after '</'.

    jsx_parseClosingElementAt(startPos, startLoc) {
      let node = this.startNodeAt(startPos, startLoc);
      let nodeName = this.jsx_parseElementName();
      if (nodeName) node.name = nodeName;
      this.expect(tok.jsxTagEnd);
      return this.finishNode(node, nodeName ? 'JSXClosingElement' : 'JSXClosingFragment');
    }

    // Parses entire JSX element, including it's opening tag
    // (starting after '<'), attributes, contents and closing tag.

    jsx_parseElementAt(startPos, startLoc) {
      let node = this.startNodeAt(startPos, startLoc);
      let children = [];
      let openingElement = this.jsx_parseOpeningElementAt(startPos, startLoc);
      let closingElement = null;

      if (!openingElement.selfClosing) {
        contents: for (;;) {
          switch (this.type) {
          case tok.jsxTagStart:
            startPos = this.start; startLoc = this.startLoc;
            this.next();
            if (this.eat(tt.slash)) {
              closingElement = this.jsx_parseClosingElementAt(startPos, startLoc);
              break contents;
            }
            children.push(this.jsx_parseElementAt(startPos, startLoc));
            break;

          case tok.jsxText:
            children.push(this.parseExprAtom());
            break;

          case tt.braceL:
            children.push(this.jsx_parseExpressionContainer());
            break;

          default:
            this.unexpected();
          }
        }
        if (getQualifiedJSXName(closingElement.name) !== getQualifiedJSXName(openingElement.name)) {
          this.raise(
            closingElement.start,
            'Expected corresponding JSX closing tag for <' + getQualifiedJSXName(openingElement.name) + '>');
        }
      }
      let fragmentOrElement = openingElement.name ? 'Element' : 'Fragment';

      node['opening' + fragmentOrElement] = openingElement;
      node['closing' + fragmentOrElement] = closingElement;
      node.children = children;
      if (this.type === tt.relational && this.value === "<") {
        this.raise(this.start, "Adjacent JSX elements must be wrapped in an enclosing tag");
      }
      return this.finishNode(node, 'JSX' + fragmentOrElement);
    }

    // Parse JSX text

    jsx_parseText() {
      let node = this.parseLiteral(this.value);
      node.type = "JSXText";
      return node;
    }

    // Parses entire JSX element from current position.

    jsx_parseElement() {
      let startPos = this.start, startLoc = this.startLoc;
      this.next();
      return this.jsx_parseElementAt(startPos, startLoc);
    }

    parseExprAtom(refShortHandDefaultPos) {
      if (this.type === tok.jsxText)
        return this.jsx_parseText();
      else if (this.type === tok.jsxTagStart)
        return this.jsx_parseElement();
      else
        return super.parseExprAtom(refShortHandDefaultPos);
    }

    readToken(code) {
      let context = this.curContext();

      if (context === tc_expr) return this.jsx_readToken();

      if (context === tc_oTag || context === tc_cTag) {
        if (isIdentifierStart(code)) return this.jsx_readWord();

        if (code == 62) {
          ++this.pos;
          return this.finishToken(tok.jsxTagEnd);
        }

        if ((code === 34 || code === 39) && context == tc_oTag)
          return this.jsx_readString(code);
      }

      if (code === 60 && this.exprAllowed && this.input.charCodeAt(this.pos + 1) !== 33) {
        ++this.pos;
        return this.finishToken(tok.jsxTagStart);
      }
      return super.readToken(code);
    }

    updateContext(prevType) {
      if (this.type == tt.braceL) {
        var curContext = this.curContext();
        if (curContext == tc_oTag) this.context.push(tokContexts.b_expr);
        else if (curContext == tc_expr) this.context.push(tokContexts.b_tmpl);
        else super.updateContext(prevType);
        this.exprAllowed = true;
      } else if (this.type === tt.slash && prevType === tok.jsxTagStart) {
        this.context.length -= 2; // do not consider JSX expr -> JSX open tag -> ... anymore
        this.context.push(tc_cTag); // reconsider as closing tag context
        this.exprAllowed = false;
      } else {
        return super.updateContext(prevType);
      }
    }
  };
}
});

const acornJsx$1 = acorn.Parser.extend(acornJsx());

const parse = (source) => acorn.parse(source, {
	sourceType: 'module',
	ecmaVersion: 2020,
	locations: true
});

const parse_expression_at = (source, index) => acornJsx$1.parseExpressionAt(source, index, {
	sourceType: 'module',
	ecmaVersion: 2020,
	locations: true
});

const whitespace = /[ \t\r\n]/;

const dimensions = /^(?:offset|client)(?:Width|Height)$/;

// import { Node } from 'estree';

function read_expression(parser) {
	try {
		const node = parse_expression_at(parser.template, parser.index);

		let num_parens = 0;

		for (let i = parser.index; i < node.start; i += 1) {
			if (parser.template[i] === '(') num_parens += 1;
		}

		let index = node.end;
		while (num_parens > 0) {
			const char = parser.template[index];

			if (char === ')') {
				num_parens -= 1;
			} else if (!whitespace.test(char)) {
				parser.error({
					code: 'unexpected-token',
					message: 'Expected )'
				}, index);
			}

			index += 1;
		}

		parser.index = index;
		
		return parser.template.substring(node.start, node.end);
		// return node as Node;
	} catch (err) {
		parser.acorn_error(err);
	}
}

const script_closing_tag = '</script>';

function get_context(parser, attributes, start) {
	const context = attributes.find(attribute => attribute.name === 'context');
	if (!context) return 'default';

	if (context.value.length !== 1 || context.value[0].type !== 'Text') {
		parser.error({
			code: 'invalid-script',
			message: 'context attribute must be static'
		}, start);
	}

	const value = context.value[0].data;

	if (value !== 'module') {
		parser.error({
			code: 'invalid-script',
			message: 'If the context attribute is supplied, its value must be "module"'
		}, context.start);
	}

	return value;
}

function read_script(parser, start, attributes) {
	const script_start = parser.index;
	const script_end = parser.template.indexOf(script_closing_tag, script_start);

	if (script_end === -1) {
		parser.error({
			code: 'unclosed-script',
			message: '<script> must have a closing tag'
		});
	}

	const source = parser.template.slice(0, script_start).replace(/[^\n]/g, ' ') +
		parser.template.slice(script_start, script_end);
	parser.index = script_end + script_closing_tag.length;

	let ast;

	try {
		ast = parse(source) ;
	} catch (err) {
		parser.acorn_error(err);
	}

	// TODO is this necessary?
	(ast ).start = script_start;

	return {
		type: 'Script',
		start,
		end: parser.index,
		context: get_context(parser, attributes, start),
		content: ast
	};
}

function walk(ast, { enter, leave }) {
	return visit(ast, null, enter, leave);
}

let should_skip = false;
let should_remove = false;
let replacement = null;
const context = {
	skip: () => should_skip = true,
	remove: () => should_remove = true,
	replace: (node) => replacement = node
};

function replace(parent, prop, index, node) {
	if (parent) {
		if (index !== null) {
			parent[prop][index] = node;
		} else {
			parent[prop] = node;
		}
	}
}

function remove(parent, prop, index) {
	if (parent) {
		if (index !== null) {
			parent[prop].splice(index, 1);
		} else {
			delete parent[prop];
		}
	}
}

function visit(
	node,
	parent,
	enter,
	leave,
	prop,
	index
) {
	if (node) {
		if (enter) {
			const _should_skip = should_skip;
			const _should_remove = should_remove;
			const _replacement = replacement;
			should_skip = false;
			should_remove = false;
			replacement = null;

			enter.call(context, node, parent, prop, index);

			if (replacement) {
				node = replacement;
				replace(parent, prop, index, node);
			}

			if (should_remove) {
				remove(parent, prop, index);
			}

			const skipped = should_skip;
			const removed = should_remove;

			should_skip = _should_skip;
			should_remove = _should_remove;
			replacement = _replacement;

			if (skipped) return node;
			if (removed) return null;
		}

		for (const key in node) {
			const value = (node )[key];

			if (typeof value !== 'object') {
				continue;
			}

			else if (Array.isArray(value)) {
				for (let j = 0, k = 0; j < value.length; j += 1, k += 1) {
					if (value[j] !== null && typeof value[j].type === 'string') {
						if (!visit(value[j], node, enter, leave, key, k)) {
							// removed
							j--;
						}
					}
				}
			}

			else if (value !== null && typeof value.type === 'string') {
				visit(value, node, enter, leave, key, null);
			}
		}

		if (leave) {
			const _replacement = replacement;
			const _should_remove = should_remove;
			replacement = null;
			should_remove = false;

			leave.call(context, node, parent, prop, index);

			if (replacement) {
				node = replacement;
				replace(parent, prop, index, node);
			}

			if (should_remove) {
				remove(parent, prop, index);
			}

			const removed = should_remove;

			replacement = _replacement;
			should_remove = _should_remove;

			if (removed) return null;
		}
	}

	return node;
}

function read_style(parser, start, attributes) {
	const content_start = parser.index;
	const styles = parser.read_until(/<\/style>/);
	const content_end = parser.index;

	let ast;

	try {
		ast = parse$2(styles, {
			positions: true,
			offset: content_start,
			onParseError(error) {
				throw error;
			}
		});
	} catch (err) {
		if (err.name === 'SyntaxError') {
			parser.error({
				code: 'css-syntax-error',
				message: err.message
			}, err.offset);
		} else {
			throw err;
		}
	}

	ast = JSON.parse(JSON.stringify(ast));

	// tidy up AST
	walk(ast, {
		enter: (node) => { // `any` because this isn't an ESTree node
			// replace `ref:a` nodes
			if (node.type === 'Selector') {
				for (let i = 0; i < node.children.length; i += 1) {
					const a = node.children[i];
					const b = node.children[i + 1];

					if (is_ref_selector(a, b)) {
						parser.error({
							code: 'invalid-ref-selector',
							message: 'ref selectors are no longer supported'
						}, a.loc.start.offset);
					}
				}
			}

			if (node.type === 'Declaration' && node.value.type === 'Value' && node.value.children.length === 0) {
				parser.error({
					code: 'invalid-declaration',
					message: 'Declaration cannot be empty'
				}, node.start);
			}

			if (node.type === 'PseudoClassSelector' && node.name === 'global' && node.children === null) {
				parser.error({
					code: 'css-syntax-error',
					message: ':global() must contain a selector'
				}, node.loc.start.offset);
			}

			if (node.loc) {
				node.start = node.loc.start.offset;
				node.end = node.loc.end.offset;
				delete node.loc;
			}
		}
	});

	parser.eat('</style>', true);
	const end = parser.index;

	return {
		type: 'Style',
		start,
		end,
		attributes,
		children: ast.children,
		content: {
			start: content_start,
			end: content_end,
			styles
		}
	};
}

function is_ref_selector(a, b) { // TODO add CSS node types
	if (!b) return false;

	return (
		a.type === 'TypeSelector' &&
		a.name === 'ref' &&
		b.type === 'PseudoClassSelector'
	);
}

// https://dev.w3.org/html5/html-author/charref
var entities = {
	CounterClockwiseContourIntegral: 8755,
	ClockwiseContourIntegral: 8754,
	DoubleLongLeftRightArrow: 10234,
	DiacriticalDoubleAcute: 733,
	NotSquareSupersetEqual: 8931,
	CloseCurlyDoubleQuote: 8221,
	DoubleContourIntegral: 8751,
	FilledVerySmallSquare: 9642,
	NegativeVeryThinSpace: 8203,
	NotPrecedesSlantEqual: 8928,
	NotRightTriangleEqual: 8941,
	NotSucceedsSlantEqual: 8929,
	CapitalDifferentialD: 8517,
	DoubleLeftRightArrow: 8660,
	DoubleLongRightArrow: 10233,
	EmptyVerySmallSquare: 9643,
	NestedGreaterGreater: 8811,
	NotDoubleVerticalBar: 8742,
	NotLeftTriangleEqual: 8940,
	NotSquareSubsetEqual: 8930,
	OpenCurlyDoubleQuote: 8220,
	ReverseUpEquilibrium: 10607,
	DoubleLongLeftArrow: 10232,
	DownLeftRightVector: 10576,
	LeftArrowRightArrow: 8646,
	NegativeMediumSpace: 8203,
	RightArrowLeftArrow: 8644,
	SquareSupersetEqual: 8850,
	leftrightsquigarrow: 8621,
	DownRightTeeVector: 10591,
	DownRightVectorBar: 10583,
	LongLeftRightArrow: 10231,
	Longleftrightarrow: 10234,
	NegativeThickSpace: 8203,
	PrecedesSlantEqual: 8828,
	ReverseEquilibrium: 8651,
	RightDoubleBracket: 10215,
	RightDownTeeVector: 10589,
	RightDownVectorBar: 10581,
	RightTriangleEqual: 8885,
	SquareIntersection: 8851,
	SucceedsSlantEqual: 8829,
	blacktriangleright: 9656,
	longleftrightarrow: 10231,
	DoubleUpDownArrow: 8661,
	DoubleVerticalBar: 8741,
	DownLeftTeeVector: 10590,
	DownLeftVectorBar: 10582,
	FilledSmallSquare: 9724,
	GreaterSlantEqual: 10878,
	LeftDoubleBracket: 10214,
	LeftDownTeeVector: 10593,
	LeftDownVectorBar: 10585,
	LeftTriangleEqual: 8884,
	NegativeThinSpace: 8203,
	NotReverseElement: 8716,
	NotTildeFullEqual: 8775,
	RightAngleBracket: 10217,
	RightUpDownVector: 10575,
	SquareSubsetEqual: 8849,
	VerticalSeparator: 10072,
	blacktriangledown: 9662,
	blacktriangleleft: 9666,
	leftrightharpoons: 8651,
	rightleftharpoons: 8652,
	twoheadrightarrow: 8608,
	DiacriticalAcute: 180,
	DiacriticalGrave: 96,
	DiacriticalTilde: 732,
	DoubleRightArrow: 8658,
	DownArrowUpArrow: 8693,
	EmptySmallSquare: 9723,
	GreaterEqualLess: 8923,
	GreaterFullEqual: 8807,
	LeftAngleBracket: 10216,
	LeftUpDownVector: 10577,
	LessEqualGreater: 8922,
	NonBreakingSpace: 160,
	NotRightTriangle: 8939,
	NotSupersetEqual: 8841,
	RightTriangleBar: 10704,
	RightUpTeeVector: 10588,
	RightUpVectorBar: 10580,
	UnderParenthesis: 9181,
	UpArrowDownArrow: 8645,
	circlearrowright: 8635,
	downharpoonright: 8642,
	ntrianglerighteq: 8941,
	rightharpoondown: 8641,
	rightrightarrows: 8649,
	twoheadleftarrow: 8606,
	vartriangleright: 8883,
	CloseCurlyQuote: 8217,
	ContourIntegral: 8750,
	DoubleDownArrow: 8659,
	DoubleLeftArrow: 8656,
	DownRightVector: 8641,
	LeftRightVector: 10574,
	LeftTriangleBar: 10703,
	LeftUpTeeVector: 10592,
	LeftUpVectorBar: 10584,
	LowerRightArrow: 8600,
	NotGreaterEqual: 8817,
	NotGreaterTilde: 8821,
	NotLeftTriangle: 8938,
	OverParenthesis: 9180,
	RightDownVector: 8642,
	ShortRightArrow: 8594,
	UpperRightArrow: 8599,
	bigtriangledown: 9661,
	circlearrowleft: 8634,
	curvearrowright: 8631,
	downharpoonleft: 8643,
	leftharpoondown: 8637,
	leftrightarrows: 8646,
	nLeftrightarrow: 8654,
	nleftrightarrow: 8622,
	ntrianglelefteq: 8940,
	rightleftarrows: 8644,
	rightsquigarrow: 8605,
	rightthreetimes: 8908,
	straightepsilon: 1013,
	trianglerighteq: 8885,
	vartriangleleft: 8882,
	DiacriticalDot: 729,
	DoubleRightTee: 8872,
	DownLeftVector: 8637,
	GreaterGreater: 10914,
	HorizontalLine: 9472,
	InvisibleComma: 8291,
	InvisibleTimes: 8290,
	LeftDownVector: 8643,
	LeftRightArrow: 8596,
	Leftrightarrow: 8660,
	LessSlantEqual: 10877,
	LongRightArrow: 10230,
	Longrightarrow: 10233,
	LowerLeftArrow: 8601,
	NestedLessLess: 8810,
	NotGreaterLess: 8825,
	NotLessGreater: 8824,
	NotSubsetEqual: 8840,
	NotVerticalBar: 8740,
	OpenCurlyQuote: 8216,
	ReverseElement: 8715,
	RightTeeVector: 10587,
	RightVectorBar: 10579,
	ShortDownArrow: 8595,
	ShortLeftArrow: 8592,
	SquareSuperset: 8848,
	TildeFullEqual: 8773,
	UpperLeftArrow: 8598,
	ZeroWidthSpace: 8203,
	curvearrowleft: 8630,
	doublebarwedge: 8966,
	downdownarrows: 8650,
	hookrightarrow: 8618,
	leftleftarrows: 8647,
	leftrightarrow: 8596,
	leftthreetimes: 8907,
	longrightarrow: 10230,
	looparrowright: 8620,
	nshortparallel: 8742,
	ntriangleright: 8939,
	rightarrowtail: 8611,
	rightharpoonup: 8640,
	trianglelefteq: 8884,
	upharpoonright: 8638,
	ApplyFunction: 8289,
	DifferentialD: 8518,
	DoubleLeftTee: 10980,
	DoubleUpArrow: 8657,
	LeftTeeVector: 10586,
	LeftVectorBar: 10578,
	LessFullEqual: 8806,
	LongLeftArrow: 10229,
	Longleftarrow: 10232,
	NotTildeEqual: 8772,
	NotTildeTilde: 8777,
	Poincareplane: 8460,
	PrecedesEqual: 10927,
	PrecedesTilde: 8830,
	RightArrowBar: 8677,
	RightTeeArrow: 8614,
	RightTriangle: 8883,
	RightUpVector: 8638,
	SucceedsEqual: 10928,
	SucceedsTilde: 8831,
	SupersetEqual: 8839,
	UpEquilibrium: 10606,
	VerticalTilde: 8768,
	VeryThinSpace: 8202,
	bigtriangleup: 9651,
	blacktriangle: 9652,
	divideontimes: 8903,
	fallingdotseq: 8786,
	hookleftarrow: 8617,
	leftarrowtail: 8610,
	leftharpoonup: 8636,
	longleftarrow: 10229,
	looparrowleft: 8619,
	measuredangle: 8737,
	ntriangleleft: 8938,
	shortparallel: 8741,
	smallsetminus: 8726,
	triangleright: 9657,
	upharpoonleft: 8639,
	DownArrowBar: 10515,
	DownTeeArrow: 8615,
	ExponentialE: 8519,
	GreaterEqual: 8805,
	GreaterTilde: 8819,
	HilbertSpace: 8459,
	HumpDownHump: 8782,
	Intersection: 8898,
	LeftArrowBar: 8676,
	LeftTeeArrow: 8612,
	LeftTriangle: 8882,
	LeftUpVector: 8639,
	NotCongruent: 8802,
	NotLessEqual: 8816,
	NotLessTilde: 8820,
	Proportional: 8733,
	RightCeiling: 8969,
	RoundImplies: 10608,
	ShortUpArrow: 8593,
	SquareSubset: 8847,
	UnderBracket: 9141,
	VerticalLine: 124,
	blacklozenge: 10731,
	exponentiale: 8519,
	risingdotseq: 8787,
	triangledown: 9663,
	triangleleft: 9667,
	CircleMinus: 8854,
	CircleTimes: 8855,
	Equilibrium: 8652,
	GreaterLess: 8823,
	LeftCeiling: 8968,
	LessGreater: 8822,
	MediumSpace: 8287,
	NotPrecedes: 8832,
	NotSucceeds: 8833,
	OverBracket: 9140,
	RightVector: 8640,
	Rrightarrow: 8667,
	RuleDelayed: 10740,
	SmallCircle: 8728,
	SquareUnion: 8852,
	SubsetEqual: 8838,
	UpDownArrow: 8597,
	Updownarrow: 8661,
	VerticalBar: 8739,
	backepsilon: 1014,
	blacksquare: 9642,
	circledcirc: 8858,
	circleddash: 8861,
	curlyeqprec: 8926,
	curlyeqsucc: 8927,
	diamondsuit: 9830,
	eqslantless: 10901,
	expectation: 8496,
	nRightarrow: 8655,
	nrightarrow: 8603,
	preccurlyeq: 8828,
	precnapprox: 10937,
	quaternions: 8461,
	straightphi: 981,
	succcurlyeq: 8829,
	succnapprox: 10938,
	thickapprox: 8776,
	updownarrow: 8597,
	Bernoullis: 8492,
	CirclePlus: 8853,
	EqualTilde: 8770,
	Fouriertrf: 8497,
	ImaginaryI: 8520,
	Laplacetrf: 8466,
	LeftVector: 8636,
	Lleftarrow: 8666,
	NotElement: 8713,
	NotGreater: 8815,
	Proportion: 8759,
	RightArrow: 8594,
	RightFloor: 8971,
	Rightarrow: 8658,
	TildeEqual: 8771,
	TildeTilde: 8776,
	UnderBrace: 9183,
	UpArrowBar: 10514,
	UpTeeArrow: 8613,
	circledast: 8859,
	complement: 8705,
	curlywedge: 8911,
	eqslantgtr: 10902,
	gtreqqless: 10892,
	lessapprox: 10885,
	lesseqqgtr: 10891,
	lmoustache: 9136,
	longmapsto: 10236,
	mapstodown: 8615,
	mapstoleft: 8612,
	nLeftarrow: 8653,
	nleftarrow: 8602,
	precapprox: 10935,
	rightarrow: 8594,
	rmoustache: 9137,
	sqsubseteq: 8849,
	sqsupseteq: 8850,
	subsetneqq: 10955,
	succapprox: 10936,
	supsetneqq: 10956,
	upuparrows: 8648,
	varepsilon: 949,
	varnothing: 8709,
	Backslash: 8726,
	CenterDot: 183,
	CircleDot: 8857,
	Congruent: 8801,
	Coproduct: 8720,
	DoubleDot: 168,
	DownArrow: 8595,
	DownBreve: 785,
	Downarrow: 8659,
	HumpEqual: 8783,
	LeftArrow: 8592,
	LeftFloor: 8970,
	Leftarrow: 8656,
	LessTilde: 8818,
	Mellintrf: 8499,
	MinusPlus: 8723,
	NotCupCap: 8813,
	NotExists: 8708,
	OverBrace: 9182,
	PlusMinus: 177,
	Therefore: 8756,
	ThinSpace: 8201,
	TripleDot: 8411,
	UnionPlus: 8846,
	backprime: 8245,
	backsimeq: 8909,
	bigotimes: 10754,
	centerdot: 183,
	checkmark: 10003,
	complexes: 8450,
	dotsquare: 8865,
	downarrow: 8595,
	gtrapprox: 10886,
	gtreqless: 8923,
	heartsuit: 9829,
	leftarrow: 8592,
	lesseqgtr: 8922,
	nparallel: 8742,
	nshortmid: 8740,
	nsubseteq: 8840,
	nsupseteq: 8841,
	pitchfork: 8916,
	rationals: 8474,
	spadesuit: 9824,
	subseteqq: 10949,
	subsetneq: 8842,
	supseteqq: 10950,
	supsetneq: 8843,
	therefore: 8756,
	triangleq: 8796,
	varpropto: 8733,
	DDotrahd: 10513,
	DotEqual: 8784,
	Integral: 8747,
	LessLess: 10913,
	NotEqual: 8800,
	NotTilde: 8769,
	PartialD: 8706,
	Precedes: 8826,
	RightTee: 8866,
	Succeeds: 8827,
	SuchThat: 8715,
	Superset: 8835,
	Uarrocir: 10569,
	UnderBar: 818,
	andslope: 10840,
	angmsdaa: 10664,
	angmsdab: 10665,
	angmsdac: 10666,
	angmsdad: 10667,
	angmsdae: 10668,
	angmsdaf: 10669,
	angmsdag: 10670,
	angmsdah: 10671,
	angrtvbd: 10653,
	approxeq: 8778,
	awconint: 8755,
	backcong: 8780,
	barwedge: 8965,
	bbrktbrk: 9142,
	bigoplus: 10753,
	bigsqcup: 10758,
	biguplus: 10756,
	bigwedge: 8896,
	boxminus: 8863,
	boxtimes: 8864,
	capbrcup: 10825,
	circledR: 174,
	circledS: 9416,
	cirfnint: 10768,
	clubsuit: 9827,
	cupbrcap: 10824,
	curlyvee: 8910,
	cwconint: 8754,
	doteqdot: 8785,
	dotminus: 8760,
	drbkarow: 10512,
	dzigrarr: 10239,
	elinters: 9191,
	emptyset: 8709,
	eqvparsl: 10725,
	fpartint: 10765,
	geqslant: 10878,
	gesdotol: 10884,
	gnapprox: 10890,
	hksearow: 10533,
	hkswarow: 10534,
	imagline: 8464,
	imagpart: 8465,
	infintie: 10717,
	integers: 8484,
	intercal: 8890,
	intlarhk: 10775,
	laemptyv: 10676,
	ldrushar: 10571,
	leqslant: 10877,
	lesdotor: 10883,
	llcorner: 8990,
	lnapprox: 10889,
	lrcorner: 8991,
	lurdshar: 10570,
	mapstoup: 8613,
	multimap: 8888,
	naturals: 8469,
	otimesas: 10806,
	parallel: 8741,
	plusacir: 10787,
	pointint: 10773,
	precneqq: 10933,
	precnsim: 8936,
	profalar: 9006,
	profline: 8978,
	profsurf: 8979,
	raemptyv: 10675,
	realpart: 8476,
	rppolint: 10770,
	rtriltri: 10702,
	scpolint: 10771,
	setminus: 8726,
	shortmid: 8739,
	smeparsl: 10724,
	sqsubset: 8847,
	sqsupset: 8848,
	subseteq: 8838,
	succneqq: 10934,
	succnsim: 8937,
	supseteq: 8839,
	thetasym: 977,
	thicksim: 8764,
	timesbar: 10801,
	triangle: 9653,
	triminus: 10810,
	trpezium: 9186,
	ulcorner: 8988,
	urcorner: 8989,
	varkappa: 1008,
	varsigma: 962,
	vartheta: 977,
	Because: 8757,
	Cayleys: 8493,
	Cconint: 8752,
	Cedilla: 184,
	Diamond: 8900,
	DownTee: 8868,
	Element: 8712,
	Epsilon: 917,
	Implies: 8658,
	LeftTee: 8867,
	NewLine: 10,
	NoBreak: 8288,
	NotLess: 8814,
	Omicron: 927,
	OverBar: 175,
	Product: 8719,
	UpArrow: 8593,
	Uparrow: 8657,
	Upsilon: 933,
	alefsym: 8501,
	angrtvb: 8894,
	angzarr: 9084,
	asympeq: 8781,
	backsim: 8765,
	because: 8757,
	bemptyv: 10672,
	between: 8812,
	bigcirc: 9711,
	bigodot: 10752,
	bigstar: 9733,
	boxplus: 8862,
	ccupssm: 10832,
	cemptyv: 10674,
	cirscir: 10690,
	coloneq: 8788,
	congdot: 10861,
	cudarrl: 10552,
	cudarrr: 10549,
	cularrp: 10557,
	curarrm: 10556,
	dbkarow: 10511,
	ddagger: 8225,
	ddotseq: 10871,
	demptyv: 10673,
	diamond: 8900,
	digamma: 989,
	dotplus: 8724,
	dwangle: 10662,
	epsilon: 949,
	eqcolon: 8789,
	equivDD: 10872,
	gesdoto: 10882,
	gtquest: 10876,
	gtrless: 8823,
	harrcir: 10568,
	intprod: 10812,
	isindot: 8949,
	larrbfs: 10527,
	larrsim: 10611,
	lbrksld: 10639,
	lbrkslu: 10637,
	ldrdhar: 10599,
	lesdoto: 10881,
	lessdot: 8918,
	lessgtr: 8822,
	lesssim: 8818,
	lotimes: 10804,
	lozenge: 9674,
	ltquest: 10875,
	luruhar: 10598,
	maltese: 10016,
	minusdu: 10794,
	napprox: 8777,
	natural: 9838,
	nearrow: 8599,
	nexists: 8708,
	notinva: 8713,
	notinvb: 8951,
	notinvc: 8950,
	notniva: 8716,
	notnivb: 8958,
	notnivc: 8957,
	npolint: 10772,
	nsqsube: 8930,
	nsqsupe: 8931,
	nvinfin: 10718,
	nwarrow: 8598,
	olcross: 10683,
	omicron: 959,
	orderof: 8500,
	orslope: 10839,
	pertenk: 8241,
	planckh: 8462,
	pluscir: 10786,
	plussim: 10790,
	plustwo: 10791,
	precsim: 8830,
	quatint: 10774,
	questeq: 8799,
	rarrbfs: 10528,
	rarrsim: 10612,
	rbrksld: 10638,
	rbrkslu: 10640,
	rdldhar: 10601,
	realine: 8475,
	rotimes: 10805,
	ruluhar: 10600,
	searrow: 8600,
	simplus: 10788,
	simrarr: 10610,
	subedot: 10947,
	submult: 10945,
	subplus: 10943,
	subrarr: 10617,
	succsim: 8831,
	supdsub: 10968,
	supedot: 10948,
	suphsub: 10967,
	suplarr: 10619,
	supmult: 10946,
	supplus: 10944,
	swarrow: 8601,
	topfork: 10970,
	triplus: 10809,
	tritime: 10811,
	uparrow: 8593,
	upsilon: 965,
	uwangle: 10663,
	vzigzag: 10650,
	zigrarr: 8669,
	Aacute: 193,
	Abreve: 258,
	Agrave: 192,
	Assign: 8788,
	Atilde: 195,
	Barwed: 8966,
	Bumpeq: 8782,
	Cacute: 262,
	Ccaron: 268,
	Ccedil: 199,
	Colone: 10868,
	Conint: 8751,
	CupCap: 8781,
	Dagger: 8225,
	Dcaron: 270,
	DotDot: 8412,
	Dstrok: 272,
	Eacute: 201,
	Ecaron: 282,
	Egrave: 200,
	Exists: 8707,
	ForAll: 8704,
	Gammad: 988,
	Gbreve: 286,
	Gcedil: 290,
	HARDcy: 1066,
	Hstrok: 294,
	Iacute: 205,
	Igrave: 204,
	Itilde: 296,
	Jsercy: 1032,
	Kcedil: 310,
	Lacute: 313,
	Lambda: 923,
	Lcaron: 317,
	Lcedil: 315,
	Lmidot: 319,
	Lstrok: 321,
	Nacute: 323,
	Ncaron: 327,
	Ncedil: 325,
	Ntilde: 209,
	Oacute: 211,
	Odblac: 336,
	Ograve: 210,
	Oslash: 216,
	Otilde: 213,
	Otimes: 10807,
	Racute: 340,
	Rarrtl: 10518,
	Rcaron: 344,
	Rcedil: 342,
	SHCHcy: 1065,
	SOFTcy: 1068,
	Sacute: 346,
	Scaron: 352,
	Scedil: 350,
	Square: 9633,
	Subset: 8912,
	Supset: 8913,
	Tcaron: 356,
	Tcedil: 354,
	Tstrok: 358,
	Uacute: 218,
	Ubreve: 364,
	Udblac: 368,
	Ugrave: 217,
	Utilde: 360,
	Vdashl: 10982,
	Verbar: 8214,
	Vvdash: 8874,
	Yacute: 221,
	Zacute: 377,
	Zcaron: 381,
	aacute: 225,
	abreve: 259,
	agrave: 224,
	andand: 10837,
	angmsd: 8737,
	angsph: 8738,
	apacir: 10863,
	approx: 8776,
	atilde: 227,
	barvee: 8893,
	barwed: 8965,
	becaus: 8757,
	bernou: 8492,
	bigcap: 8898,
	bigcup: 8899,
	bigvee: 8897,
	bkarow: 10509,
	bottom: 8869,
	bowtie: 8904,
	boxbox: 10697,
	bprime: 8245,
	brvbar: 166,
	bullet: 8226,
	bumpeq: 8783,
	cacute: 263,
	capand: 10820,
	capcap: 10827,
	capcup: 10823,
	capdot: 10816,
	ccaron: 269,
	ccedil: 231,
	circeq: 8791,
	cirmid: 10991,
	colone: 8788,
	commat: 64,
	compfn: 8728,
	conint: 8750,
	coprod: 8720,
	copysr: 8471,
	cularr: 8630,
	cupcap: 10822,
	cupcup: 10826,
	cupdot: 8845,
	curarr: 8631,
	curren: 164,
	cylcty: 9005,
	dagger: 8224,
	daleth: 8504,
	dcaron: 271,
	dfisht: 10623,
	divide: 247,
	divonx: 8903,
	dlcorn: 8990,
	dlcrop: 8973,
	dollar: 36,
	drcorn: 8991,
	drcrop: 8972,
	dstrok: 273,
	eacute: 233,
	easter: 10862,
	ecaron: 283,
	ecolon: 8789,
	egrave: 232,
	egsdot: 10904,
	elsdot: 10903,
	emptyv: 8709,
	emsp13: 8196,
	emsp14: 8197,
	eparsl: 10723,
	eqcirc: 8790,
	equals: 61,
	equest: 8799,
	female: 9792,
	ffilig: 64259,
	ffllig: 64260,
	forall: 8704,
	frac12: 189,
	frac13: 8531,
	frac14: 188,
	frac15: 8533,
	frac16: 8537,
	frac18: 8539,
	frac23: 8532,
	frac25: 8534,
	frac34: 190,
	frac35: 8535,
	frac38: 8540,
	frac45: 8536,
	frac56: 8538,
	frac58: 8541,
	frac78: 8542,
	gacute: 501,
	gammad: 989,
	gbreve: 287,
	gesdot: 10880,
	gesles: 10900,
	gtlPar: 10645,
	gtrarr: 10616,
	gtrdot: 8919,
	gtrsim: 8819,
	hairsp: 8202,
	hamilt: 8459,
	hardcy: 1098,
	hearts: 9829,
	hellip: 8230,
	hercon: 8889,
	homtht: 8763,
	horbar: 8213,
	hslash: 8463,
	hstrok: 295,
	hybull: 8259,
	hyphen: 8208,
	iacute: 237,
	igrave: 236,
	iiiint: 10764,
	iinfin: 10716,
	incare: 8453,
	inodot: 305,
	intcal: 8890,
	iquest: 191,
	isinsv: 8947,
	itilde: 297,
	jsercy: 1112,
	kappav: 1008,
	kcedil: 311,
	kgreen: 312,
	lAtail: 10523,
	lacute: 314,
	lagran: 8466,
	lambda: 955,
	langle: 10216,
	larrfs: 10525,
	larrhk: 8617,
	larrlp: 8619,
	larrpl: 10553,
	larrtl: 8610,
	latail: 10521,
	lbrace: 123,
	lbrack: 91,
	lcaron: 318,
	lcedil: 316,
	ldquor: 8222,
	lesdot: 10879,
	lesges: 10899,
	lfisht: 10620,
	lfloor: 8970,
	lharul: 10602,
	llhard: 10603,
	lmidot: 320,
	lmoust: 9136,
	loplus: 10797,
	lowast: 8727,
	lowbar: 95,
	lparlt: 10643,
	lrhard: 10605,
	lsaquo: 8249,
	lsquor: 8218,
	lstrok: 322,
	lthree: 8907,
	ltimes: 8905,
	ltlarr: 10614,
	ltrPar: 10646,
	mapsto: 8614,
	marker: 9646,
	mcomma: 10793,
	midast: 42,
	midcir: 10992,
	middot: 183,
	minusb: 8863,
	minusd: 8760,
	mnplus: 8723,
	models: 8871,
	mstpos: 8766,
	nVDash: 8879,
	nVdash: 8878,
	nacute: 324,
	ncaron: 328,
	ncedil: 326,
	nearhk: 10532,
	nequiv: 8802,
	nesear: 10536,
	nexist: 8708,
	nltrie: 8940,
	nprcue: 8928,
	nrtrie: 8941,
	nsccue: 8929,
	nsimeq: 8772,
	ntilde: 241,
	numero: 8470,
	nvDash: 8877,
	nvHarr: 10500,
	nvdash: 8876,
	nvlArr: 10498,
	nvrArr: 10499,
	nwarhk: 10531,
	nwnear: 10535,
	oacute: 243,
	odblac: 337,
	odsold: 10684,
	ograve: 242,
	ominus: 8854,
	origof: 8886,
	oslash: 248,
	otilde: 245,
	otimes: 8855,
	parsim: 10995,
	percnt: 37,
	period: 46,
	permil: 8240,
	phmmat: 8499,
	planck: 8463,
	plankv: 8463,
	plusdo: 8724,
	plusdu: 10789,
	plusmn: 177,
	preceq: 10927,
	primes: 8473,
	prnsim: 8936,
	propto: 8733,
	prurel: 8880,
	puncsp: 8200,
	qprime: 8279,
	rAtail: 10524,
	racute: 341,
	rangle: 10217,
	rarrap: 10613,
	rarrfs: 10526,
	rarrhk: 8618,
	rarrlp: 8620,
	rarrpl: 10565,
	rarrtl: 8611,
	ratail: 10522,
	rbrace: 125,
	rbrack: 93,
	rcaron: 345,
	rcedil: 343,
	rdquor: 8221,
	rfisht: 10621,
	rfloor: 8971,
	rharul: 10604,
	rmoust: 9137,
	roplus: 10798,
	rpargt: 10644,
	rsaquo: 8250,
	rsquor: 8217,
	rthree: 8908,
	rtimes: 8906,
	sacute: 347,
	scaron: 353,
	scedil: 351,
	scnsim: 8937,
	searhk: 10533,
	seswar: 10537,
	sfrown: 8994,
	shchcy: 1097,
	sigmaf: 962,
	sigmav: 962,
	simdot: 10858,
	smashp: 10803,
	softcy: 1100,
	solbar: 9023,
	spades: 9824,
	sqsube: 8849,
	sqsupe: 8850,
	square: 9633,
	squarf: 9642,
	ssetmn: 8726,
	ssmile: 8995,
	sstarf: 8902,
	subdot: 10941,
	subset: 8834,
	subsim: 10951,
	subsub: 10965,
	subsup: 10963,
	succeq: 10928,
	supdot: 10942,
	supset: 8835,
	supsim: 10952,
	supsub: 10964,
	supsup: 10966,
	swarhk: 10534,
	swnwar: 10538,
	target: 8982,
	tcaron: 357,
	tcedil: 355,
	telrec: 8981,
	there4: 8756,
	thetav: 977,
	thinsp: 8201,
	thksim: 8764,
	timesb: 8864,
	timesd: 10800,
	topbot: 9014,
	topcir: 10993,
	tprime: 8244,
	tridot: 9708,
	tstrok: 359,
	uacute: 250,
	ubreve: 365,
	udblac: 369,
	ufisht: 10622,
	ugrave: 249,
	ulcorn: 8988,
	ulcrop: 8975,
	urcorn: 8989,
	urcrop: 8974,
	utilde: 361,
	vangrt: 10652,
	varphi: 966,
	varrho: 1009,
	veebar: 8891,
	vellip: 8942,
	verbar: 124,
	wedbar: 10847,
	wedgeq: 8793,
	weierp: 8472,
	wreath: 8768,
	xoplus: 10753,
	xotime: 10754,
	xsqcup: 10758,
	xuplus: 10756,
	xwedge: 8896,
	yacute: 253,
	zacute: 378,
	zcaron: 382,
	zeetrf: 8488,
	AElig: 198,
	Acirc: 194,
	Alpha: 913,
	Amacr: 256,
	Aogon: 260,
	Aring: 197,
	Breve: 728,
	Ccirc: 264,
	Colon: 8759,
	Cross: 10799,
	Dashv: 10980,
	Delta: 916,
	Ecirc: 202,
	Emacr: 274,
	Eogon: 280,
	Equal: 10869,
	Gamma: 915,
	Gcirc: 284,
	Hacek: 711,
	Hcirc: 292,
	IJlig: 306,
	Icirc: 206,
	Imacr: 298,
	Iogon: 302,
	Iukcy: 1030,
	Jcirc: 308,
	Jukcy: 1028,
	Kappa: 922,
	OElig: 338,
	Ocirc: 212,
	Omacr: 332,
	Omega: 937,
	Prime: 8243,
	RBarr: 10512,
	Scirc: 348,
	Sigma: 931,
	THORN: 222,
	TRADE: 8482,
	TSHcy: 1035,
	Theta: 920,
	Tilde: 8764,
	Ubrcy: 1038,
	Ucirc: 219,
	Umacr: 362,
	Union: 8899,
	Uogon: 370,
	UpTee: 8869,
	Uring: 366,
	VDash: 8875,
	Vdash: 8873,
	Wcirc: 372,
	Wedge: 8896,
	Ycirc: 374,
	acirc: 226,
	acute: 180,
	aelig: 230,
	aleph: 8501,
	alpha: 945,
	amacr: 257,
	amalg: 10815,
	angle: 8736,
	angrt: 8735,
	angst: 8491,
	aogon: 261,
	aring: 229,
	asymp: 8776,
	awint: 10769,
	bcong: 8780,
	bdquo: 8222,
	bepsi: 1014,
	blank: 9251,
	blk12: 9618,
	blk14: 9617,
	blk34: 9619,
	block: 9608,
	boxDL: 9559,
	boxDR: 9556,
	boxDl: 9558,
	boxDr: 9555,
	boxHD: 9574,
	boxHU: 9577,
	boxHd: 9572,
	boxHu: 9575,
	boxUL: 9565,
	boxUR: 9562,
	boxUl: 9564,
	boxUr: 9561,
	boxVH: 9580,
	boxVL: 9571,
	boxVR: 9568,
	boxVh: 9579,
	boxVl: 9570,
	boxVr: 9567,
	boxdL: 9557,
	boxdR: 9554,
	boxdl: 9488,
	boxdr: 9484,
	boxhD: 9573,
	boxhU: 9576,
	boxhd: 9516,
	boxhu: 9524,
	boxuL: 9563,
	boxuR: 9560,
	boxul: 9496,
	boxur: 9492,
	boxvH: 9578,
	boxvL: 9569,
	boxvR: 9566,
	boxvh: 9532,
	boxvl: 9508,
	boxvr: 9500,
	breve: 728,
	bsemi: 8271,
	bsime: 8909,
	bsolb: 10693,
	bumpE: 10926,
	bumpe: 8783,
	caret: 8257,
	caron: 711,
	ccaps: 10829,
	ccirc: 265,
	ccups: 10828,
	cedil: 184,
	check: 10003,
	clubs: 9827,
	colon: 58,
	comma: 44,
	crarr: 8629,
	cross: 10007,
	csube: 10961,
	csupe: 10962,
	ctdot: 8943,
	cuepr: 8926,
	cuesc: 8927,
	cupor: 10821,
	cuvee: 8910,
	cuwed: 8911,
	cwint: 8753,
	dashv: 8867,
	dblac: 733,
	ddarr: 8650,
	delta: 948,
	dharl: 8643,
	dharr: 8642,
	diams: 9830,
	disin: 8946,
	doteq: 8784,
	dtdot: 8945,
	dtrif: 9662,
	duarr: 8693,
	duhar: 10607,
	eDDot: 10871,
	ecirc: 234,
	efDot: 8786,
	emacr: 275,
	empty: 8709,
	eogon: 281,
	eplus: 10865,
	epsiv: 949,
	eqsim: 8770,
	equiv: 8801,
	erDot: 8787,
	erarr: 10609,
	esdot: 8784,
	exist: 8707,
	fflig: 64256,
	filig: 64257,
	fllig: 64258,
	fltns: 9649,
	forkv: 10969,
	frasl: 8260,
	frown: 8994,
	gamma: 947,
	gcirc: 285,
	gescc: 10921,
	gimel: 8503,
	gneqq: 8809,
	gnsim: 8935,
	grave: 96,
	gsime: 10894,
	gsiml: 10896,
	gtcir: 10874,
	gtdot: 8919,
	harrw: 8621,
	hcirc: 293,
	hoarr: 8703,
	icirc: 238,
	iexcl: 161,
	iiint: 8749,
	iiota: 8489,
	ijlig: 307,
	imacr: 299,
	image: 8465,
	imath: 305,
	imped: 437,
	infin: 8734,
	iogon: 303,
	iprod: 10812,
	isinE: 8953,
	isins: 8948,
	isinv: 8712,
	iukcy: 1110,
	jcirc: 309,
	jmath: 567,
	jukcy: 1108,
	kappa: 954,
	lAarr: 8666,
	lBarr: 10510,
	langd: 10641,
	laquo: 171,
	larrb: 8676,
	lbarr: 10508,
	lbbrk: 10098,
	lbrke: 10635,
	lceil: 8968,
	ldquo: 8220,
	lescc: 10920,
	lhard: 8637,
	lharu: 8636,
	lhblk: 9604,
	llarr: 8647,
	lltri: 9722,
	lneqq: 8808,
	lnsim: 8934,
	loang: 10220,
	loarr: 8701,
	lobrk: 10214,
	lopar: 10629,
	lrarr: 8646,
	lrhar: 8651,
	lrtri: 8895,
	lsime: 10893,
	lsimg: 10895,
	lsquo: 8216,
	ltcir: 10873,
	ltdot: 8918,
	ltrie: 8884,
	ltrif: 9666,
	mDDot: 8762,
	mdash: 8212,
	micro: 181,
	minus: 8722,
	mumap: 8888,
	nabla: 8711,
	napos: 329,
	natur: 9838,
	ncong: 8775,
	ndash: 8211,
	neArr: 8663,
	nearr: 8599,
	ngsim: 8821,
	nhArr: 8654,
	nharr: 8622,
	nhpar: 10994,
	nlArr: 8653,
	nlarr: 8602,
	nless: 8814,
	nlsim: 8820,
	nltri: 8938,
	notin: 8713,
	notni: 8716,
	nprec: 8832,
	nrArr: 8655,
	nrarr: 8603,
	nrtri: 8939,
	nsime: 8772,
	nsmid: 8740,
	nspar: 8742,
	nsube: 8840,
	nsucc: 8833,
	nsupe: 8841,
	numsp: 8199,
	nwArr: 8662,
	nwarr: 8598,
	ocirc: 244,
	odash: 8861,
	oelig: 339,
	ofcir: 10687,
	ohbar: 10677,
	olarr: 8634,
	olcir: 10686,
	oline: 8254,
	omacr: 333,
	omega: 969,
	operp: 10681,
	oplus: 8853,
	orarr: 8635,
	order: 8500,
	ovbar: 9021,
	parsl: 11005,
	phone: 9742,
	plusb: 8862,
	pluse: 10866,
	pound: 163,
	prcue: 8828,
	prime: 8242,
	prnap: 10937,
	prsim: 8830,
	quest: 63,
	rAarr: 8667,
	rBarr: 10511,
	radic: 8730,
	rangd: 10642,
	range: 10661,
	raquo: 187,
	rarrb: 8677,
	rarrc: 10547,
	rarrw: 8605,
	ratio: 8758,
	rbarr: 10509,
	rbbrk: 10099,
	rbrke: 10636,
	rceil: 8969,
	rdquo: 8221,
	reals: 8477,
	rhard: 8641,
	rharu: 8640,
	rlarr: 8644,
	rlhar: 8652,
	rnmid: 10990,
	roang: 10221,
	roarr: 8702,
	robrk: 10215,
	ropar: 10630,
	rrarr: 8649,
	rsquo: 8217,
	rtrie: 8885,
	rtrif: 9656,
	sbquo: 8218,
	sccue: 8829,
	scirc: 349,
	scnap: 10938,
	scsim: 8831,
	sdotb: 8865,
	sdote: 10854,
	seArr: 8664,
	searr: 8600,
	setmn: 8726,
	sharp: 9839,
	sigma: 963,
	simeq: 8771,
	simgE: 10912,
	simlE: 10911,
	simne: 8774,
	slarr: 8592,
	smile: 8995,
	sqcap: 8851,
	sqcup: 8852,
	sqsub: 8847,
	sqsup: 8848,
	srarr: 8594,
	starf: 9733,
	strns: 175,
	subnE: 10955,
	subne: 8842,
	supnE: 10956,
	supne: 8843,
	swArr: 8665,
	swarr: 8601,
	szlig: 223,
	theta: 952,
	thkap: 8776,
	thorn: 254,
	tilde: 732,
	times: 215,
	trade: 8482,
	trisb: 10701,
	tshcy: 1115,
	twixt: 8812,
	ubrcy: 1118,
	ucirc: 251,
	udarr: 8645,
	udhar: 10606,
	uharl: 8639,
	uharr: 8638,
	uhblk: 9600,
	ultri: 9720,
	umacr: 363,
	uogon: 371,
	uplus: 8846,
	upsih: 978,
	uring: 367,
	urtri: 9721,
	utdot: 8944,
	utrif: 9652,
	uuarr: 8648,
	vBarv: 10985,
	vDash: 8872,
	varpi: 982,
	vdash: 8866,
	veeeq: 8794,
	vltri: 8882,
	vprop: 8733,
	vrtri: 8883,
	wcirc: 373,
	wedge: 8743,
	xcirc: 9711,
	xdtri: 9661,
	xhArr: 10234,
	xharr: 10231,
	xlArr: 10232,
	xlarr: 10229,
	xodot: 10752,
	xrArr: 10233,
	xrarr: 10230,
	xutri: 9651,
	ycirc: 375,
	Aopf: 120120,
	Ascr: 119964,
	Auml: 196,
	Barv: 10983,
	Beta: 914,
	Bopf: 120121,
	Bscr: 8492,
	CHcy: 1063,
	COPY: 169,
	Cdot: 266,
	Copf: 8450,
	Cscr: 119966,
	DJcy: 1026,
	DScy: 1029,
	DZcy: 1039,
	Darr: 8609,
	Dopf: 120123,
	Dscr: 119967,
	Edot: 278,
	Eopf: 120124,
	Escr: 8496,
	Esim: 10867,
	Euml: 203,
	Fopf: 120125,
	Fscr: 8497,
	GJcy: 1027,
	Gdot: 288,
	Gopf: 120126,
	Gscr: 119970,
	Hopf: 8461,
	Hscr: 8459,
	IEcy: 1045,
	IOcy: 1025,
	Idot: 304,
	Iopf: 120128,
	Iota: 921,
	Iscr: 8464,
	Iuml: 207,
	Jopf: 120129,
	Jscr: 119973,
	KHcy: 1061,
	KJcy: 1036,
	Kopf: 120130,
	Kscr: 119974,
	LJcy: 1033,
	Lang: 10218,
	Larr: 8606,
	Lopf: 120131,
	Lscr: 8466,
	Mopf: 120132,
	Mscr: 8499,
	NJcy: 1034,
	Nopf: 8469,
	Nscr: 119977,
	Oopf: 120134,
	Oscr: 119978,
	Ouml: 214,
	Popf: 8473,
	Pscr: 119979,
	QUOT: 34,
	Qopf: 8474,
	Qscr: 119980,
	Rang: 10219,
	Rarr: 8608,
	Ropf: 8477,
	Rscr: 8475,
	SHcy: 1064,
	Sopf: 120138,
	Sqrt: 8730,
	Sscr: 119982,
	Star: 8902,
	TScy: 1062,
	Topf: 120139,
	Tscr: 119983,
	Uarr: 8607,
	Uopf: 120140,
	Upsi: 978,
	Uscr: 119984,
	Uuml: 220,
	Vbar: 10987,
	Vert: 8214,
	Vopf: 120141,
	Vscr: 119985,
	Wopf: 120142,
	Wscr: 119986,
	Xopf: 120143,
	Xscr: 119987,
	YAcy: 1071,
	YIcy: 1031,
	YUcy: 1070,
	Yopf: 120144,
	Yscr: 119988,
	Yuml: 376,
	ZHcy: 1046,
	Zdot: 379,
	Zeta: 918,
	Zopf: 8484,
	Zscr: 119989,
	andd: 10844,
	andv: 10842,
	ange: 10660,
	aopf: 120146,
	apid: 8779,
	apos: 39,
	ascr: 119990,
	auml: 228,
	bNot: 10989,
	bbrk: 9141,
	beta: 946,
	beth: 8502,
	bnot: 8976,
	bopf: 120147,
	boxH: 9552,
	boxV: 9553,
	boxh: 9472,
	boxv: 9474,
	bscr: 119991,
	bsim: 8765,
	bsol: 92,
	bull: 8226,
	bump: 8782,
	cdot: 267,
	cent: 162,
	chcy: 1095,
	cirE: 10691,
	circ: 710,
	cire: 8791,
	comp: 8705,
	cong: 8773,
	copf: 120148,
	copy: 169,
	cscr: 119992,
	csub: 10959,
	csup: 10960,
	dArr: 8659,
	dHar: 10597,
	darr: 8595,
	dash: 8208,
	diam: 8900,
	djcy: 1106,
	dopf: 120149,
	dscr: 119993,
	dscy: 1109,
	dsol: 10742,
	dtri: 9663,
	dzcy: 1119,
	eDot: 8785,
	ecir: 8790,
	edot: 279,
	emsp: 8195,
	ensp: 8194,
	eopf: 120150,
	epar: 8917,
	epsi: 1013,
	escr: 8495,
	esim: 8770,
	euml: 235,
	euro: 8364,
	excl: 33,
	flat: 9837,
	fnof: 402,
	fopf: 120151,
	fork: 8916,
	fscr: 119995,
	gdot: 289,
	geqq: 8807,
	gjcy: 1107,
	gnap: 10890,
	gneq: 10888,
	gopf: 120152,
	gscr: 8458,
	gsim: 8819,
	gtcc: 10919,
	hArr: 8660,
	half: 189,
	harr: 8596,
	hbar: 8463,
	hopf: 120153,
	hscr: 119997,
	iecy: 1077,
	imof: 8887,
	iocy: 1105,
	iopf: 120154,
	iota: 953,
	iscr: 119998,
	isin: 8712,
	iuml: 239,
	jopf: 120155,
	jscr: 119999,
	khcy: 1093,
	kjcy: 1116,
	kopf: 120156,
	kscr: 120000,
	lArr: 8656,
	lHar: 10594,
	lang: 10216,
	larr: 8592,
	late: 10925,
	lcub: 123,
	ldca: 10550,
	ldsh: 8626,
	leqq: 8806,
	ljcy: 1113,
	lnap: 10889,
	lneq: 10887,
	lopf: 120157,
	lozf: 10731,
	lpar: 40,
	lscr: 120001,
	lsim: 8818,
	lsqb: 91,
	ltcc: 10918,
	ltri: 9667,
	macr: 175,
	male: 9794,
	malt: 10016,
	mlcp: 10971,
	mldr: 8230,
	mopf: 120158,
	mscr: 120002,
	nbsp: 160,
	ncap: 10819,
	ncup: 10818,
	ngeq: 8817,
	ngtr: 8815,
	nisd: 8954,
	njcy: 1114,
	nldr: 8229,
	nleq: 8816,
	nmid: 8740,
	nopf: 120159,
	npar: 8742,
	nscr: 120003,
	nsim: 8769,
	nsub: 8836,
	nsup: 8837,
	ntgl: 8825,
	ntlg: 8824,
	oast: 8859,
	ocir: 8858,
	odiv: 10808,
	odot: 8857,
	ogon: 731,
	oint: 8750,
	omid: 10678,
	oopf: 120160,
	opar: 10679,
	ordf: 170,
	ordm: 186,
	oror: 10838,
	oscr: 8500,
	osol: 8856,
	ouml: 246,
	para: 182,
	part: 8706,
	perp: 8869,
	phiv: 966,
	plus: 43,
	popf: 120161,
	prap: 10935,
	prec: 8826,
	prnE: 10933,
	prod: 8719,
	prop: 8733,
	pscr: 120005,
	qint: 10764,
	qopf: 120162,
	qscr: 120006,
	quot: 34,
	rArr: 8658,
	rHar: 10596,
	race: 10714,
	rang: 10217,
	rarr: 8594,
	rcub: 125,
	rdca: 10551,
	rdsh: 8627,
	real: 8476,
	rect: 9645,
	rhov: 1009,
	ring: 730,
	ropf: 120163,
	rpar: 41,
	rscr: 120007,
	rsqb: 93,
	rtri: 9657,
	scap: 10936,
	scnE: 10934,
	sdot: 8901,
	sect: 167,
	semi: 59,
	sext: 10038,
	shcy: 1096,
	sime: 8771,
	simg: 10910,
	siml: 10909,
	smid: 8739,
	smte: 10924,
	solb: 10692,
	sopf: 120164,
	spar: 8741,
	squf: 9642,
	sscr: 120008,
	star: 9734,
	subE: 10949,
	sube: 8838,
	succ: 8827,
	sung: 9834,
	sup1: 185,
	sup2: 178,
	sup3: 179,
	supE: 10950,
	supe: 8839,
	tbrk: 9140,
	tdot: 8411,
	tint: 8749,
	toea: 10536,
	topf: 120165,
	tosa: 10537,
	trie: 8796,
	tscr: 120009,
	tscy: 1094,
	uArr: 8657,
	uHar: 10595,
	uarr: 8593,
	uopf: 120166,
	upsi: 965,
	uscr: 120010,
	utri: 9653,
	uuml: 252,
	vArr: 8661,
	vBar: 10984,
	varr: 8597,
	vert: 124,
	vopf: 120167,
	vscr: 120011,
	wopf: 120168,
	wscr: 120012,
	xcap: 8898,
	xcup: 8899,
	xmap: 10236,
	xnis: 8955,
	xopf: 120169,
	xscr: 120013,
	xvee: 8897,
	yacy: 1103,
	yicy: 1111,
	yopf: 120170,
	yscr: 120014,
	yucy: 1102,
	yuml: 255,
	zdot: 380,
	zeta: 950,
	zhcy: 1078,
	zopf: 120171,
	zscr: 120015,
	zwnj: 8204,
	AMP: 38,
	Acy: 1040,
	Afr: 120068,
	And: 10835,
	Bcy: 1041,
	Bfr: 120069,
	Cap: 8914,
	Cfr: 8493,
	Chi: 935,
	Cup: 8915,
	Dcy: 1044,
	Del: 8711,
	Dfr: 120071,
	Dot: 168,
	ENG: 330,
	ETH: 208,
	Ecy: 1069,
	Efr: 120072,
	Eta: 919,
	Fcy: 1060,
	Ffr: 120073,
	Gcy: 1043,
	Gfr: 120074,
	Hat: 94,
	Hfr: 8460,
	Icy: 1048,
	Ifr: 8465,
	Int: 8748,
	Jcy: 1049,
	Jfr: 120077,
	Kcy: 1050,
	Kfr: 120078,
	Lcy: 1051,
	Lfr: 120079,
	Lsh: 8624,
	Map: 10501,
	Mcy: 1052,
	Mfr: 120080,
	Ncy: 1053,
	Nfr: 120081,
	Not: 10988,
	Ocy: 1054,
	Ofr: 120082,
	Pcy: 1055,
	Pfr: 120083,
	Phi: 934,
	Psi: 936,
	Qfr: 120084,
	REG: 174,
	Rcy: 1056,
	Rfr: 8476,
	Rho: 929,
	Rsh: 8625,
	Scy: 1057,
	Sfr: 120086,
	Sub: 8912,
	Sum: 8721,
	Sup: 8913,
	Tab: 9,
	Tau: 932,
	Tcy: 1058,
	Tfr: 120087,
	Ucy: 1059,
	Ufr: 120088,
	Vcy: 1042,
	Vee: 8897,
	Vfr: 120089,
	Wfr: 120090,
	Xfr: 120091,
	Ycy: 1067,
	Yfr: 120092,
	Zcy: 1047,
	Zfr: 8488,
	acd: 8767,
	acy: 1072,
	afr: 120094,
	amp: 38,
	and: 8743,
	ang: 8736,
	apE: 10864,
	ape: 8778,
	ast: 42,
	bcy: 1073,
	bfr: 120095,
	bot: 8869,
	cap: 8745,
	cfr: 120096,
	chi: 967,
	cir: 9675,
	cup: 8746,
	dcy: 1076,
	deg: 176,
	dfr: 120097,
	die: 168,
	div: 247,
	dot: 729,
	ecy: 1101,
	efr: 120098,
	egs: 10902,
	ell: 8467,
	els: 10901,
	eng: 331,
	eta: 951,
	eth: 240,
	fcy: 1092,
	ffr: 120099,
	gEl: 10892,
	gap: 10886,
	gcy: 1075,
	gel: 8923,
	geq: 8805,
	ges: 10878,
	gfr: 120100,
	ggg: 8921,
	glE: 10898,
	gla: 10917,
	glj: 10916,
	gnE: 8809,
	gne: 10888,
	hfr: 120101,
	icy: 1080,
	iff: 8660,
	ifr: 120102,
	int: 8747,
	jcy: 1081,
	jfr: 120103,
	kcy: 1082,
	kfr: 120104,
	lEg: 10891,
	lap: 10885,
	lat: 10923,
	lcy: 1083,
	leg: 8922,
	leq: 8804,
	les: 10877,
	lfr: 120105,
	lgE: 10897,
	lnE: 8808,
	lne: 10887,
	loz: 9674,
	lrm: 8206,
	lsh: 8624,
	map: 8614,
	mcy: 1084,
	mfr: 120106,
	mho: 8487,
	mid: 8739,
	nap: 8777,
	ncy: 1085,
	nfr: 120107,
	nge: 8817,
	ngt: 8815,
	nis: 8956,
	niv: 8715,
	nle: 8816,
	nlt: 8814,
	not: 172,
	npr: 8832,
	nsc: 8833,
	num: 35,
	ocy: 1086,
	ofr: 120108,
	ogt: 10689,
	ohm: 8486,
	olt: 10688,
	ord: 10845,
	orv: 10843,
	par: 8741,
	pcy: 1087,
	pfr: 120109,
	phi: 966,
	piv: 982,
	prE: 10931,
	pre: 10927,
	psi: 968,
	qfr: 120110,
	rcy: 1088,
	reg: 174,
	rfr: 120111,
	rho: 961,
	rlm: 8207,
	rsh: 8625,
	scE: 10932,
	sce: 10928,
	scy: 1089,
	sfr: 120112,
	shy: 173,
	sim: 8764,
	smt: 10922,
	sol: 47,
	squ: 9633,
	sub: 8834,
	sum: 8721,
	sup: 8835,
	tau: 964,
	tcy: 1090,
	tfr: 120113,
	top: 8868,
	ucy: 1091,
	ufr: 120114,
	uml: 168,
	vcy: 1074,
	vee: 8744,
	vfr: 120115,
	wfr: 120116,
	xfr: 120117,
	ycy: 1099,
	yen: 165,
	yfr: 120118,
	zcy: 1079,
	zfr: 120119,
	zwj: 8205,
	DD: 8517,
	GT: 62,
	Gg: 8921,
	Gt: 8811,
	Im: 8465,
	LT: 60,
	Ll: 8920,
	Lt: 8810,
	Mu: 924,
	Nu: 925,
	Or: 10836,
	Pi: 928,
	Pr: 10939,
	Re: 8476,
	Sc: 10940,
	Xi: 926,
	ac: 8766,
	af: 8289,
	ap: 8776,
	dd: 8518,
	ee: 8519,
	eg: 10906,
	el: 10905,
	gE: 8807,
	ge: 8805,
	gg: 8811,
	gl: 8823,
	gt: 62,
	ic: 8291,
	ii: 8520,
	in: 8712,
	it: 8290,
	lE: 8806,
	le: 8804,
	lg: 8822,
	ll: 8810,
	lt: 60,
	mp: 8723,
	mu: 956,
	ne: 8800,
	ni: 8715,
	nu: 957,
	oS: 9416,
	or: 8744,
	pi: 960,
	pm: 177,
	pr: 8826,
	rx: 8478,
	sc: 8827,
	wp: 8472,
	wr: 8768,
	xi: 958
};

const windows_1252 = [
	8364,
	129,
	8218,
	402,
	8222,
	8230,
	8224,
	8225,
	710,
	8240,
	352,
	8249,
	338,
	141,
	381,
	143,
	144,
	8216,
	8217,
	8220,
	8221,
	8226,
	8211,
	8212,
	732,
	8482,
	353,
	8250,
	339,
	157,
	382,
	376
];

const entity_pattern = new RegExp(
	`&(#?(?:x[\\w\\d]+|\\d+|${Object.keys(entities).join('|')}))(?:;|\\b)`,
	'g'
);

function decode_character_references(html) {
	return html.replace(entity_pattern, (match, entity) => {
		let code;

		// Handle named entities
		if (entity[0] !== '#') {
			code = entities[entity];
		} else if (entity[1] === 'x') {
			code = parseInt(entity.substring(2), 16);
		} else {
			code = parseInt(entity.substring(1), 10);
		}

		if (!code) {
			return match;
		}

		return String.fromCodePoint(validate_code(code));
	});
}

const NUL = 0;

// some code points are verboten. If we were inserting HTML, the browser would replace the illegal
// code points with alternatives in some cases - since we're bypassing that mechanism, we need
// to replace them ourselves
//
// Source: http://en.wikipedia.org/wiki/Character_encodings_in_HTML#Illegal_characters
function validate_code(code) {
	// line feed becomes generic whitespace
	if (code === 10) {
		return 32;
	}

	// ASCII range. (Why someone would use HTML entities for ASCII characters I don't know, but...)
	if (code < 128) {
		return code;
	}

	// code points 128-159 are dealt with leniently by browsers, but they're incorrect. We need
	// to correct the mistake or we'll end up with missing € signs and so on
	if (code <= 159) {
		return windows_1252[code - 128];
	}

	// basic multilingual plane
	if (code < 55296) {
		return code;
	}

	// UTF-16 surrogate halves
	if (code <= 57343) {
		return NUL;
	}

	// rest of the basic multilingual plane
	if (code <= 65535) {
		return code;
	}

	// supplementary multilingual plane 0x10000 - 0x1ffff
	if (code >= 65536 && code <= 131071) {
		return code;
	}

	// supplementary ideographic plane 0x20000 - 0x2ffff
	if (code >= 131072 && code <= 196607) {
		return code;
	}

	return NUL;
}

// based on http://developers.whatwg.org/syntax.html#syntax-tag-omission
const disallowed_contents = new Map([
	['li', new Set(['li'])],
	['dt', new Set(['dt', 'dd'])],
	['dd', new Set(['dt', 'dd'])],
	[
		'p',
		new Set(
			'address article aside blockquote div dl fieldset footer form h1 h2 h3 h4 h5 h6 header hgroup hr main menu nav ol p pre section table ul'.split(
				' '
			)
		)
	],
	['rt', new Set(['rt', 'rp'])],
	['rp', new Set(['rt', 'rp'])],
	['optgroup', new Set(['optgroup'])],
	['option', new Set(['option', 'optgroup'])],
	['thead', new Set(['tbody', 'tfoot'])],
	['tbody', new Set(['tbody', 'tfoot'])],
	['tfoot', new Set(['tbody'])],
	['tr', new Set(['tr', 'tbody'])],
	['td', new Set(['td', 'th', 'tr'])],
	['th', new Set(['td', 'th', 'tr'])]
]);

// can this be a child of the parent element, or does it implicitly
// close it, like `<li>one<li>two`?
function closing_tag_omitted(current, next) {
	if (disallowed_contents.has(current)) {
		if (!next || disallowed_contents.get(current).has(next)) {
			return true;
		}
	}

	return false;
}

// Adapted from https://github.com/acornjs/acorn/blob/6584815dca7440e00de841d1dad152302fdd7ca5/src/tokenize.js
// Reproduced under MIT License https://github.com/acornjs/acorn/blob/master/LICENSE

function full_char_code_at(str, i) {
	const code = str.charCodeAt(i);
	if (code <= 0xd7ff || code >= 0xe000) return code;

	const next = str.charCodeAt(i + 1);
	return (code << 10) + next - 0x35fdc00;
}

const globals = new Set([
	'alert',
	'Array',
	'Boolean',
	'clearInterval',
	'clearTimeout',
	'confirm',
	'console',
	'Date',
	'decodeURI',
	'decodeURIComponent',
	'document',
	'Element',
	'encodeURI',
	'encodeURIComponent',
	'Error',
	'EvalError',
	'Event',
	'EventSource',
	'fetch',
	'global',
	'globalThis',
	'history',
	'Infinity',
	'InternalError',
	'Intl',
	'isFinite',
	'isNaN',
	'JSON',
	'localStorage',
	'location',
	'Map',
	'Math',
	'NaN',
	'navigator',
	'Number',
	'Node',
	'Object',
	'parseFloat',
	'parseInt',
	'process',
	'Promise',
	'prompt',
	'RangeError',
	'ReferenceError',
	'RegExp',
	'sessionStorage',
	'Set',
	'setInterval',
	'setTimeout',
	'String',
	'SyntaxError',
	'TypeError',
	'undefined',
	'URIError',
	'URL',
	'window'
]);

const reserved = new Set([
	'arguments',
	'await',
	'break',
	'case',
	'catch',
	'class',
	'const',
	'continue',
	'debugger',
	'default',
	'delete',
	'do',
	'else',
	'enum',
	'eval',
	'export',
	'extends',
	'false',
	'finally',
	'for',
	'function',
	'if',
	'implements',
	'import',
	'in',
	'instanceof',
	'interface',
	'let',
	'new',
	'null',
	'package',
	'private',
	'protected',
	'public',
	'return',
	'static',
	'super',
	'switch',
	'this',
	'throw',
	'true',
	'try',
	'typeof',
	'var',
	'void',
	'while',
	'with',
	'yield'
]);

const void_element_names = /^(?:area|base|br|col|command|embed|hr|img|input|keygen|link|meta|param|source|track|wbr)$/;

function is_void(name) {
	return void_element_names.test(name) || name.toLowerCase() === '!doctype';
}

function is_valid(str) {
	let i = 0;

	while (i < str.length) {
		const code = full_char_code_at(str, i);
		if (!(i === 0 ? isIdentifierStart : isIdentifierChar)(code, true)) return false;

		i += code <= 0xffff ? 1 : 2;
	}

	return true;
}

function sanitize(name) {
	return name
		.replace(/[^a-zA-Z0-9_]+/g, '_')
		.replace(/^_/, '')
		.replace(/_$/, '')
		.replace(/^[0-9]/, '_$&');
}

function fuzzymatch(name, names) {
	const set = new FuzzySet(names);
	const matches = set.get(name);

	return matches && matches[0] && matches[0][0] > 0.7 ? matches[0][1] : null;
}

// adapted from https://github.com/Glench/fuzzyset.js/blob/master/lib/fuzzyset.js
// BSD Licensed

const GRAM_SIZE_LOWER = 2;
const GRAM_SIZE_UPPER = 3;

// return an edit distance from 0 to 1
function _distance(str1, str2) {
	if (str1 === null && str2 === null) {
		throw 'Trying to compare two null values';
	}
	if (str1 === null || str2 === null) return 0;
	str1 = String(str1);
	str2 = String(str2);

	const distance = levenshtein(str1, str2);
	if (str1.length > str2.length) {
		return 1 - distance / str1.length;
	} else {
		return 1 - distance / str2.length;
	}
}

// helper functions
function levenshtein(str1, str2) {
	const current = [];
	let prev;
	let value;

	for (let i = 0; i <= str2.length; i++) {
		for (let j = 0; j <= str1.length; j++) {
			if (i && j) {
				if (str1.charAt(j - 1) === str2.charAt(i - 1)) {
					value = prev;
				} else {
					value = Math.min(current[j], current[j - 1], prev) + 1;
				}
			} else {
				value = i + j;
			}

			prev = current[j];
			current[j] = value;
		}
	}

	return current.pop();
}

const non_word_regex = /[^\w, ]+/;

function iterate_grams(value, gram_size = 2) {
	const simplified = '-' + value.toLowerCase().replace(non_word_regex, '') + '-';
	const len_diff = gram_size - simplified.length;
	const results = [];

	if (len_diff > 0) {
		for (let i = 0; i < len_diff; ++i) {
			value += '-';
		}
	}
	for (let i = 0; i < simplified.length - gram_size + 1; ++i) {
		results.push(simplified.slice(i, i + gram_size));
	}
	return results;
}

function gram_counter(value, gram_size = 2) {
	// return an object where key=gram, value=number of occurrences
	const result = {};
	const grams = iterate_grams(value, gram_size);
	let i = 0;

	for (i; i < grams.length; ++i) {
		if (grams[i] in result) {
			result[grams[i]] += 1;
		} else {
			result[grams[i]] = 1;
		}
	}
	return result;
}

function sort_descending(a, b) {
	return b[0] - a[0];
}

class FuzzySet {
	__init() {this.exact_set = {};}
	__init2() {this.match_dict = {};}
	__init3() {this.items = {};}

	constructor(arr) {FuzzySet.prototype.__init.call(this);FuzzySet.prototype.__init2.call(this);FuzzySet.prototype.__init3.call(this);
		// initialization
		for (let i = GRAM_SIZE_LOWER; i < GRAM_SIZE_UPPER + 1; ++i) {
			this.items[i] = [];
		}

		// add all the items to the set
		for (let i = 0; i < arr.length; ++i) {
			this.add(arr[i]);
		}
	}

	add(value) {
		const normalized_value = value.toLowerCase();
		if (normalized_value in this.exact_set) {
			return false;
		}

		let i = GRAM_SIZE_LOWER;
		for (i; i < GRAM_SIZE_UPPER + 1; ++i) {
			this._add(value, i);
		}
	}

	_add(value, gram_size) {
		const normalized_value = value.toLowerCase();
		const items = this.items[gram_size] || [];
		const index = items.length;

		items.push(0);
		const gram_counts = gram_counter(normalized_value, gram_size);
		let sum_of_square_gram_counts = 0;
		let gram;
		let gram_count;

		for (gram in gram_counts) {
			gram_count = gram_counts[gram];
			sum_of_square_gram_counts += Math.pow(gram_count, 2);
			if (gram in this.match_dict) {
				this.match_dict[gram].push([index, gram_count]);
			} else {
				this.match_dict[gram] = [[index, gram_count]];
			}
		}
		const vector_normal = Math.sqrt(sum_of_square_gram_counts);
		items[index] = [vector_normal, normalized_value];
		this.items[gram_size] = items;
		this.exact_set[normalized_value] = value;
	}

	get(value) {
		const normalized_value = value.toLowerCase();
		const result = this.exact_set[normalized_value];

		if (result) {
			return [[1, result]];
		}

		let results = [];
		// start with high gram size and if there are no results, go to lower gram sizes
		for (
			let gram_size = GRAM_SIZE_UPPER;
			gram_size >= GRAM_SIZE_LOWER;
			--gram_size
		) {
			results = this.__get(value, gram_size);
			if (results) {
				return results;
			}
		}
		return null;
	}

	__get(value, gram_size) {
		const normalized_value = value.toLowerCase();
		const matches = {};
		const gram_counts = gram_counter(normalized_value, gram_size);
		const items = this.items[gram_size];
		let sum_of_square_gram_counts = 0;
		let gram;
		let gram_count;
		let i;
		let index;
		let other_gram_count;

		for (gram in gram_counts) {
			gram_count = gram_counts[gram];
			sum_of_square_gram_counts += Math.pow(gram_count, 2);
			if (gram in this.match_dict) {
				for (i = 0; i < this.match_dict[gram].length; ++i) {
					index = this.match_dict[gram][i][0];
					other_gram_count = this.match_dict[gram][i][1];
					if (index in matches) {
						matches[index] += gram_count * other_gram_count;
					} else {
						matches[index] = gram_count * other_gram_count;
					}
				}
			}
		}

		const vector_normal = Math.sqrt(sum_of_square_gram_counts);
		let results = [];
		let match_score;

		// build a results list of [score, str]
		for (const match_index in matches) {
			match_score = matches[match_index];
			results.push([
				match_score / (vector_normal * items[match_index][0]),
				items[match_index][1]
			]);
		}

		results.sort(sort_descending);

		let new_results = [];
		const end_index = Math.min(50, results.length);
		// truncate somewhat arbitrarily to 50
		for (let i = 0; i < end_index; ++i) {
			new_results.push([
				_distance(results[i][1], normalized_value),
				results[i][1]
			]);
		}
		results = new_results;
		results.sort(sort_descending);

		new_results = [];
		for (let i = 0; i < results.length; ++i) {
			if (results[i][0] == results[0][0]) {
				new_results.push([results[i][0], this.exact_set[results[i][1]]]);
			}
		}

		return new_results;
	}
}

function list(items, conjunction = 'or') {
	if (items.length === 1) return items[0];
	return `${items.slice(0, -1).join(', ')} ${conjunction} ${items[
		items.length - 1
	]}`;
}

// eslint-disable-next-line no-useless-escape
const valid_tag_name = /^\!?[a-zA-Z]{1,}:?[a-zA-Z0-9\-]*/;

const meta_tags = new Map([
	['svelte:head', 'Head'],
	['svelte:options', 'Options'],
	['svelte:window', 'Window'],
	['svelte:body', 'Body']
]);

const valid_meta_tags = Array.from(meta_tags.keys()).concat('svelte:self', 'svelte:component', 'svelte:fragment');

const specials = new Map([
	[
		'script',
		{
			read: read_script,
			property: 'js'
		}
	],
	[
		'style',
		{
			read: read_style,
			property: 'css'
		}
	]
]);

const SELF = /^svelte:self(?=[\s/>])/;
const COMPONENT = /^svelte:component(?=[\s/>])/;
const SLOT = /^svelte:fragment(?=[\s/>])/;

function parent_is_head(stack) {
	let i = stack.length;
	while (i--) {
		const { type } = stack[i];
		if (type === 'Head') return true;
		if (type === 'Element' || type === 'InlineComponent') return false;
	}
	return false;
}

function tag(parser) {
	const start = parser.index++;

	let parent = parser.current();

	if (parser.eat('!--')) {
		const data = parser.read_until(/-->/);
		parser.eat('-->', true, 'comment was left open, expected -->');

		parser.current().children.push({
			start,
			end: parser.index,
			type: 'Comment',
			data
		});

		return;
	}

	const is_closing_tag = parser.eat('/');

	const name = read_tag_name(parser);

	if (meta_tags.has(name)) {
		const slug = meta_tags.get(name).toLowerCase();
		if (is_closing_tag) {
			if (
				(name === 'svelte:window' || name === 'svelte:body') &&
				parser.current().children.length
			) {
				parser.error({
					code: `invalid-${slug}-content`,
					message: `<${name}> cannot have children`
				}, parser.current().children[0].start);
			}
		} else {
			if (name in parser.meta_tags) {
				parser.error({
					code: `duplicate-${slug}`,
					message: `A component can only have one <${name}> tag`
				}, start);
			}

			if (parser.stack.length > 1) {
				parser.error({
					code: `invalid-${slug}-placement`,
					message: `<${name}> tags cannot be inside elements or blocks`
				}, start);
			}

			parser.meta_tags[name] = true;
		}
	}

	const type = meta_tags.has(name)
		? meta_tags.get(name)
		: (/[A-Z]/.test(name[0]) || name === 'svelte:self' || name === 'svelte:component') ? 'InlineComponent'
			: name === 'svelte:fragment' ? 'SlotTemplate'
				: name === 'title' && parent_is_head(parser.stack) ? 'Title'
					: name === 'slot' && !parser.customElement ? 'Slot' : 'Element';

	const element = {
		start,
		end: null, // filled in later
		type,
		name,
		attributes: [],
		children: []
	};

	parser.allow_whitespace();

	if (is_closing_tag) {
		if (is_void(name)) {
			parser.error({
				code: 'invalid-void-content',
				message: `<${name}> is a void element and cannot have children, or a closing tag`
			}, start);
		}

		parser.eat('>', true);

		// close any elements that don't have their own closing tags, e.g. <div><p></div>
		while (parent.name !== name) {
			if (parent.type !== 'Element') {
				const message = parser.last_auto_closed_tag && parser.last_auto_closed_tag.tag === name
					? `</${name}> attempted to close <${name}> that was already automatically closed by <${parser.last_auto_closed_tag.reason}>`
					: `</${name}> attempted to close an element that was not open`;
				parser.error({
					code: 'invalid-closing-tag',
					message
				}, start);
			}

			parent.end = start;
			parser.stack.pop();

			parent = parser.current();
		}

		parent.end = parser.index;
		parser.stack.pop();

		if (parser.last_auto_closed_tag && parser.stack.length < parser.last_auto_closed_tag.depth) {
			parser.last_auto_closed_tag = null;
		}

		return;
	} else if (closing_tag_omitted(parent.name, name)) {
		parent.end = start;
		parser.stack.pop();
		parser.last_auto_closed_tag = {
			tag: parent.name,
			reason: name,
			depth: parser.stack.length
		};
	}

	const unique_names = new Set();

	let attribute;
	while ((attribute = read_attribute(parser, unique_names))) {
		element.attributes.push(attribute);
		parser.allow_whitespace();
	}

	if (name === 'svelte:component') {
		const index = element.attributes.findIndex(attr => attr.type === 'Attribute' && attr.name === 'this');
		if (!~index) {
			parser.error({
				code: 'missing-component-definition',
				message: "<svelte:component> must have a 'this' attribute"
			}, start);
		}

		const definition = element.attributes.splice(index, 1)[0];
		if (definition.value === true || definition.value.length !== 1 || definition.value[0].type === 'Text') {
			parser.error({
				code: 'invalid-component-definition',
				message: 'invalid component definition'
			}, definition.start);
		}

		element.expression = definition.value[0].expression;
	}

	// special cases – top-level <script> and <style>
	if (specials.has(name) && parser.stack.length === 1) {
		const special = specials.get(name);

		parser.eat('>', true);
		const content = special.read(parser, start, element.attributes);
		if (content) parser[special.property].push(content);
		return;
	}

	parser.current().children.push(element);

	const self_closing = parser.eat('/') || is_void(name);

	parser.eat('>', true);

	if (self_closing) {
		// don't push self-closing elements onto the stack
		element.end = parser.index;
	} else if (name === 'textarea') {
		// special case
		element.children = read_sequence(
			parser,
			() =>
				parser.template.slice(parser.index, parser.index + 11) === '</textarea>'
		);
		parser.read(/<\/textarea>/);
		element.end = parser.index;
	} else if (name === 'script' || name === 'style') {
		// special case
		const start = parser.index;
		const data = parser.read_until(new RegExp(`</${name}>`));
		const end = parser.index;
		element.children.push({ start, end, type: 'Text', data });
		parser.eat(`</${name}>`, true);
		element.end = parser.index;
	} else {
		parser.stack.push(element);
	}
}

function read_tag_name(parser) {
	const start = parser.index;

	if (parser.read(SELF)) {
		// check we're inside a block, otherwise this
		// will cause infinite recursion
		let i = parser.stack.length;
		let legal = false;

		while (i--) {
			const fragment = parser.stack[i];
			if (fragment.type === 'IfBlock' || fragment.type === 'EachBlock' || fragment.type === 'InlineComponent') {
				legal = true;
				break;
			}
		}

		if (!legal) {
			parser.error({
				code: 'invalid-self-placement',
				message: '<svelte:self> components can only exist inside {#if} blocks, {#each} blocks, or slots passed to components'
			}, start);
		}

		return 'svelte:self';
	}

	if (parser.read(COMPONENT)) return 'svelte:component';

	if (parser.read(SLOT)) return 'svelte:fragment';

	const name = parser.read_until(/(\s|\/|>)/);

	if (meta_tags.has(name)) return name;

	if (name.startsWith('svelte:')) {
		const match = fuzzymatch(name.slice(7), valid_meta_tags);

		let message = `Valid <svelte:...> tag names are ${list(valid_meta_tags)}`;
		if (match) message += ` (did you mean '${match}'?)`;

		parser.error({
			code: 'invalid-tag-name',
			message
		}, start);
	}

	if (!valid_tag_name.test(name)) {
		parser.error({
			code: 'invalid-tag-name',
			message: 'Expected valid tag name'
		}, start);
	}

	return name;
}

function read_attribute(parser, unique_names) {
	const start = parser.index;

	function check_unique(name) {
		if (unique_names.has(name)) {
			parser.error({
				code: 'duplicate-attribute',
				message: 'Attributes need to be unique'
			}, start);
		}
		unique_names.add(name);
	}

	if (parser.eat('{')) {
		parser.allow_whitespace();

		if (parser.eat('...')) {
			const expression = read_expression(parser);

			parser.allow_whitespace();
			parser.eat('}', true);

			return {
				start,
				end: parser.index,
				type: 'Spread',
				expression
			};
		} else {
			const value_start = parser.index;

			const name = parser.read_identifier();
			parser.allow_whitespace();
			parser.eat('}', true);

			check_unique(name);

			return {
				start,
				end: parser.index,
				type: 'Attribute',
				name,
				value: [{
					start: value_start,
					end: value_start + name.length,
					type: 'AttributeShorthand',
					expression: {
						start: value_start,
						end: value_start + name.length,
						type: 'Identifier',
						name
					}
				}]
			};
		}
	}

	// eslint-disable-next-line no-useless-escape
	const name = parser.read_until(/[\s=\/>"']/);
	if (!name) return null;

	let end = parser.index;

	parser.allow_whitespace();

	const colon_index = name.indexOf(':');
	const type = colon_index !== -1 && get_directive_type(name.slice(0, colon_index));

	let value = true;
	if (parser.eat('=')) {
		parser.allow_whitespace();
		value = read_attribute_value(parser);
		end = parser.index;
	} else if (parser.match_regex(/["']/)) {
		parser.error({
			code: 'unexpected-token',
			message: 'Expected ='
		}, parser.index);
	}

	if (type) {
		const [directive_name, ...modifiers] = name.slice(colon_index + 1).split('|');

		if (type === 'Binding' && directive_name !== 'this') {
			check_unique(directive_name);
		} else if (type !== 'EventHandler' && type !== 'Action') {
			check_unique(name);
		}

		if (type === 'Ref') {
			parser.error({
				code: 'invalid-ref-directive',
				message: `The ref directive is no longer supported — use \`bind:this={${directive_name}}\` instead`
			}, start);
		}

		if (type === 'Class' && directive_name === '') {
			parser.error({
				code: 'invalid-class-directive',
				message: 'Class binding name cannot be empty'
			}, start + colon_index + 1);
		}

		if (value[0]) {
			if ((value ).length > 1 || value[0].type === 'Text') {
				parser.error({
					code: 'invalid-directive-value',
					message: 'Directive value must be a JavaScript expression enclosed in curly braces'
				}, value[0].start);
			}
		}

		const directive = {
			start,
			end,
			type,
			name: directive_name,
			modifiers,
			expression: (value[0] && value[0].expression) || null
		};

		if (type === 'Transition') {
			const direction = name.slice(0, colon_index);
			directive.intro = direction === 'in' || direction === 'transition';
			directive.outro = direction === 'out' || direction === 'transition';
		}

		if (!directive.expression && (type === 'Binding' || type === 'Class')) {
			directive.expression = {
				start: directive.start + colon_index + 1,
				end: directive.end,
				type: 'Identifier',
				name: directive.name
			} ;
		}

		return directive;
	}

	check_unique(name);

	return {
		start,
		end,
		type: 'Attribute',
		name,
		value
	};
}

function get_directive_type(name) {
	if (name === 'use') return 'Action';
	if (name === 'animate') return 'Animation';
	if (name === 'bind') return 'Binding';
	if (name === 'class') return 'Class';
	if (name === 'on') return 'EventHandler';
	if (name === 'let') return 'Let';
	if (name === 'ref') return 'Ref';
	if (name === 'in' || name === 'out' || name === 'transition') return 'Transition';
}

function read_attribute_value(parser) {
	const quote_mark = parser.eat("'") ? "'" : parser.eat('"') ? '"' : null;

	const regex = (
		quote_mark === "'" ? /'/ :
			quote_mark === '"' ? /"/ :
				/(\/>|[\s"'=<>`])/
	);

	const value = read_sequence(parser, () => !!parser.match_regex(regex));

	if (quote_mark) parser.index += 1;
	return value;
}

function read_sequence(parser, done) {
	let current_chunk = {
		start: parser.index,
		end: null,
		type: 'Text',
		raw: '',
		data: null
	};

	function flush() {
		if (current_chunk.raw) {
			current_chunk.data = decode_character_references(current_chunk.raw);
			current_chunk.end = parser.index;
			chunks.push(current_chunk);
		}
	}

	const chunks = [];

	while (parser.index < parser.template.length) {
		const index = parser.index;

		if (done()) {
			flush();
			return chunks;
		} else if (parser.eat('{')) {
			flush();

			parser.allow_whitespace();
			const expression = read_expression(parser);
			parser.allow_whitespace();
			parser.eat('}', true);

			chunks.push({
				start: index,
				end: parser.index,
				type: 'MustacheTag',
				expression
			});

			current_chunk = {
				start: parser.index,
				end: null,
				type: 'Text',
				raw: '',
				data: null
			};
		} else {
			current_chunk.raw += parser.template[parser.index++];
		}
	}

	parser.error({
		code: 'unexpected-eof',
		message: 'Unexpected end of input'
	});
}

const SQUARE_BRACKET_OPEN = '['.charCodeAt(0);
const SQUARE_BRACKET_CLOSE = ']'.charCodeAt(0);
const CURLY_BRACKET_OPEN = '{'.charCodeAt(0);
const CURLY_BRACKET_CLOSE = '}'.charCodeAt(0);

function is_bracket_open(code) {
	return code === SQUARE_BRACKET_OPEN || code === CURLY_BRACKET_OPEN;
}

function is_bracket_close(code) {
	return code === SQUARE_BRACKET_CLOSE || code === CURLY_BRACKET_CLOSE;
}

function is_bracket_pair(open, close) {
	return (
		(open === SQUARE_BRACKET_OPEN && close === SQUARE_BRACKET_CLOSE) ||
		(open === CURLY_BRACKET_OPEN && close === CURLY_BRACKET_CLOSE)
	);
}

function get_bracket_close(open) {
	if (open === SQUARE_BRACKET_OPEN) {
		return SQUARE_BRACKET_CLOSE;
	}
	if (open === CURLY_BRACKET_OPEN) {
		return CURLY_BRACKET_CLOSE;
	}
}

function read_context(
	parser
) {
	const start = parser.index;
	let i = parser.index;

	const code = full_char_code_at(parser.template, i);
	if (isIdentifierStart(code, true)) {
		return {
			type: 'Identifier',
			name: parser.read_identifier(),
			start,
			end: parser.index
		};
	}

	if (!is_bracket_open(code)) {
		parser.error({
			code: 'unexpected-token',
			message: 'Expected identifier or destructure pattern'
		});
	}

	const bracket_stack = [code];
	i += code <= 0xffff ? 1 : 2;

	while (i < parser.template.length) {
		const code = full_char_code_at(parser.template, i);
		if (is_bracket_open(code)) {
			bracket_stack.push(code);
		} else if (is_bracket_close(code)) {
			if (!is_bracket_pair(bracket_stack[bracket_stack.length - 1], code)) {
				parser.error({
					code: 'unexpected-token',
					message: `Expected ${String.fromCharCode(
						get_bracket_close(bracket_stack[bracket_stack.length - 1])
					)}`
				});
			}
			bracket_stack.pop();
			if (bracket_stack.length === 0) {
				i += code <= 0xffff ? 1 : 2;
				break;
			}
		}
		i += code <= 0xffff ? 1 : 2;
	}

	parser.index = i;

	const pattern_string = parser.template.slice(start, i);
	try {
		// the length of the `space_with_newline` has to be start - 1
		// because we added a `(` in front of the pattern_string,
		// which shifted the entire string to right by 1
		// so we offset it by removing 1 character in the `space_with_newline`
		// to achieve that, we remove the 1st space encountered,
		// so it will not affect the `column` of the node
		let space_with_newline = parser.template.slice(0, start).replace(/[^\n]/g, ' ');
		const first_space = space_with_newline.indexOf(' ');
		space_with_newline = space_with_newline.slice(0, first_space) + space_with_newline.slice(first_space + 1);

		return (parse_expression_at(
			`${space_with_newline}(${pattern_string} = 1)`,
			start - 1
		) ).left;
	} catch (error) {
		parser.acorn_error(error);
	}
}

function trim_start(str) {
	let i = 0;
	while (whitespace.test(str[i])) i += 1;

	return str.slice(i);
}

function trim_end(str) {
	let i = str.length;
	while (whitespace.test(str[i - 1])) i -= 1;

	return str.slice(0, i);
}

function to_string(node) {
	switch (node.type) {
		case 'IfBlock':
			return '{#if} block';
		case 'ThenBlock':
			return '{:then} block';
		case 'ElseBlock':
			return '{:else} block';
		case 'PendingBlock':
		case 'AwaitBlock':
			return '{#await} block';
		case 'CatchBlock':
			return '{:catch} block';
		case 'EachBlock':
			return '{#each} block';
		case 'RawMustacheTag':
			return '{@html} block';
		case 'DebugTag':
			return '{@debug} block';
		case 'Element':
		case 'InlineComponent':
		case 'Slot':
		case 'Title':
			return `<${node.name}> tag`;
		default:
			return node.type;
	}
}

function trim_whitespace(block, trim_before, trim_after) {
	if (!block.children || block.children.length === 0) return; // AwaitBlock

	const first_child = block.children[0];
	const last_child = block.children[block.children.length - 1];

	if (first_child.type === 'Text' && trim_before) {
		first_child.data = trim_start(first_child.data);
		if (!first_child.data) block.children.shift();
	}

	if (last_child.type === 'Text' && trim_after) {
		last_child.data = trim_end(last_child.data);
		if (!last_child.data) block.children.pop();
	}

	if (block.else) {
		trim_whitespace(block.else, trim_before, trim_after);
	}

	if (first_child.elseif) {
		trim_whitespace(first_child, trim_before, trim_after);
	}
}

function mustache(parser) {
	const start = parser.index;
	parser.index += 1;

	parser.allow_whitespace();

	// {/if}, {/each}, {/await} or {/key}
	if (parser.eat('/')) {
		let block = parser.current();
		let expected;

		if (closing_tag_omitted(block.name)) {
			block.end = start;
			parser.stack.pop();
			block = parser.current();
		}

		if (block.type === 'ElseBlock' || block.type === 'PendingBlock' || block.type === 'ThenBlock' || block.type === 'CatchBlock') {
			block.end = start;
			parser.stack.pop();
			block = parser.current();

			expected = 'await';
		}

		if (block.type === 'IfBlock') {
			expected = 'if';
		} else if (block.type === 'EachBlock') {
			expected = 'each';
		} else if (block.type === 'AwaitBlock') {
			expected = 'await';
		} else if (block.type === 'KeyBlock') {
			expected = 'key';
		} else {
			parser.error({
				code: 'unexpected-block-close',
				message: 'Unexpected block closing tag'
			});
		}

		parser.eat(expected, true);
		parser.allow_whitespace();
		parser.eat('}', true);

		while (block.elseif) {
			block.end = parser.index;
			parser.stack.pop();
			block = parser.current();

			if (block.else) {
				block.else.end = start;
			}
		}

		// strip leading/trailing whitespace as necessary
		const char_before = parser.template[block.start - 1];
		const char_after = parser.template[parser.index];
		const trim_before = !char_before || whitespace.test(char_before);
		const trim_after = !char_after || whitespace.test(char_after);

		trim_whitespace(block, trim_before, trim_after);

		block.end = parser.index;
		parser.stack.pop();
	} else if (parser.eat(':else')) {
		if (parser.eat('if')) {
			parser.error({
				code: 'invalid-elseif',
				message: "'elseif' should be 'else if'"
			});
		}

		parser.allow_whitespace();

		// :else if
		if (parser.eat('if')) {
			const block = parser.current();
			if (block.type !== 'IfBlock') {
				parser.error({
					code: 'invalid-elseif-placement',
					message: parser.stack.some(block => block.type === 'IfBlock')
						? `Expected to close ${to_string(block)} before seeing {:else if ...} block`
						: 'Cannot have an {:else if ...} block outside an {#if ...} block'
				});
			}

			parser.require_whitespace();

			const expression = read_expression(parser);

			parser.allow_whitespace();
			parser.eat('}', true);

			block.else = {
				start: parser.index,
				end: null,
				type: 'ElseBlock',
				children: [
					{
						start: parser.index,
						end: null,
						type: 'IfBlock',
						elseif: true,
						expression,
						children: []
					}
				]
			};

			parser.stack.push(block.else.children[0]);
		} else {
			// :else
			const block = parser.current();
			if (block.type !== 'IfBlock' && block.type !== 'EachBlock') {
				parser.error({
					code: 'invalid-else-placement',
					message: parser.stack.some(block => block.type === 'IfBlock' || block.type === 'EachBlock')
						? `Expected to close ${to_string(block)} before seeing {:else} block`
						: 'Cannot have an {:else} block outside an {#if ...} or {#each ...} block'
				});
			}

			parser.allow_whitespace();
			parser.eat('}', true);

			block.else = {
				start: parser.index,
				end: null,
				type: 'ElseBlock',
				children: []
			};

			parser.stack.push(block.else);
		}
	} else if (parser.match(':then') || parser.match(':catch')) {
		const block = parser.current();
		const is_then = parser.eat(':then') || !parser.eat(':catch');

		if (is_then) {
			if (block.type !== 'PendingBlock') {
				parser.error({
					code: 'invalid-then-placement',
					message: parser.stack.some(block => block.type === 'PendingBlock')
						? `Expected to close ${to_string(block)} before seeing {:then} block`
						: 'Cannot have an {:then} block outside an {#await ...} block'
				});
			}
		} else {
			if (block.type !== 'ThenBlock' && block.type !== 'PendingBlock') {
				parser.error({
					code: 'invalid-catch-placement',
					message: parser.stack.some(block => block.type === 'ThenBlock' || block.type === 'PendingBlock')
						? `Expected to close ${to_string(block)} before seeing {:catch} block`
						: 'Cannot have an {:catch} block outside an {#await ...} block'
				});
			}
		}

		block.end = start;
		parser.stack.pop();
		const await_block = parser.current();

		if (!parser.eat('}')) {
			parser.require_whitespace();
			await_block[is_then ? 'value' : 'error'] = read_context(parser);
			parser.allow_whitespace();
			parser.eat('}', true);
		}

		const new_block = {
			start,
			end: null,
			type: is_then ? 'ThenBlock' : 'CatchBlock',
			children: [],
			skip: false
		};

		await_block[is_then ? 'then' : 'catch'] = new_block;
		parser.stack.push(new_block);
	} else if (parser.eat('#')) {
		// {#if foo}, {#each foo} or {#await foo}
		let type;

		if (parser.eat('if')) {
			type = 'IfBlock';
		} else if (parser.eat('each')) {
			type = 'EachBlock';
		} else if (parser.eat('await')) {
			type = 'AwaitBlock';
		} else if (parser.eat('key')) {
			type = 'KeyBlock';
		} else {
			parser.error({
				code: 'expected-block-type',
				message: 'Expected if, each, await or key'
			});
		}

		parser.require_whitespace();

		const expression = read_expression(parser);

		const block = type === 'AwaitBlock' ?
			{
				start,
				end: null,
				type,
				expression,
				value: null,
				error: null,
				pending: {
					start: null,
					end: null,
					type: 'PendingBlock',
					children: [],
					skip: true
				},
				then: {
					start: null,
					end: null,
					type: 'ThenBlock',
					children: [],
					skip: true
				},
				catch: {
					start: null,
					end: null,
					type: 'CatchBlock',
					children: [],
					skip: true
				}
			} :
			{
				start,
				end: null,
				type,
				expression,
				children: []
			};

		parser.allow_whitespace();

		// {#each} blocks must declare a context – {#each list as item}
		if (type === 'EachBlock') {
			parser.eat('as', true);
			parser.require_whitespace();

			block.context = read_context(parser);

			parser.allow_whitespace();

			if (parser.eat(',')) {
				parser.allow_whitespace();
				block.index = parser.read_identifier();
				if (!block.index) {
					parser.error({
						code: 'expected-name',
						message: 'Expected name'
					});
				}

				parser.allow_whitespace();
			}

			if (parser.eat('(')) {
				parser.allow_whitespace();

				block.key = read_expression(parser);
				parser.allow_whitespace();
				parser.eat(')', true);
				parser.allow_whitespace();
			}
		}

		const await_block_shorthand = type === 'AwaitBlock' && parser.eat('then');
		if (await_block_shorthand) {
			parser.require_whitespace();
			block.value = read_context(parser);
			parser.allow_whitespace();
		}

		const await_block_catch_shorthand = !await_block_shorthand && type === 'AwaitBlock' && parser.eat('catch');
		if (await_block_catch_shorthand) {
			parser.require_whitespace();
			block.error = read_context(parser);
			parser.allow_whitespace();
		}

		parser.eat('}', true);

		parser.current().children.push(block);
		parser.stack.push(block);

		if (type === 'AwaitBlock') {
			let child_block;
			if (await_block_shorthand) {
				block.then.skip = false;
				child_block = block.then;
			} else if (await_block_catch_shorthand) {
				block.catch.skip = false;
				child_block = block.catch;
			} else {
				block.pending.skip = false;
				child_block = block.pending;
			}

			child_block.start = parser.index;
			parser.stack.push(child_block);
		}
	} else if (parser.eat('@html')) {
		// {@html content} tag
		parser.require_whitespace();

		const expression = read_expression(parser);

		parser.allow_whitespace();
		parser.eat('}', true);

		parser.current().children.push({
			start,
			end: parser.index,
			type: 'RawMustacheTag',
			expression
		});
	} else if (parser.eat('@debug')) {
		// let identifiers;

		// // Implies {@debug} which indicates "debug all"
		// if (parser.read(/\s*}/)) {
		// 	identifiers = [];
		// } else {
		// 	const expression = read_expression(parser);

		// 	identifiers = expression.type === 'SequenceExpression'
		// 		? expression.expressions
		// 		: [expression];

		// 	identifiers.forEach(node => {
		// 		if (node.type !== 'Identifier') {
		// 			parser.error({
		// 				code: 'invalid-debug-args',
		// 				message: '{@debug ...} arguments must be identifiers, not arbitrary expressions'
		// 			}, node.start);
		// 		}
		// 	});

		// 	parser.allow_whitespace();
		// 	parser.eat('}', true);
		// }

		// parser.current().children.push({
		// 	start,
		// 	end: parser.index,
		// 	type: 'DebugTag',
		// 	identifiers
		// });
		throw new Error('@debug not yet supported');
	} else {
		const expression = read_expression(parser);

		parser.allow_whitespace();
		parser.eat('}', true);

		parser.current().children.push({
			start,
			end: parser.index,
			type: 'MustacheTag',
			expression
		});
	}
}

function text(parser) {
	const start = parser.index;

	let data = '';

	while (
		parser.index < parser.template.length &&
		!parser.match('<') &&
		!parser.match('{')
	) {
		data += parser.template[parser.index++];
	}

	const node = {
		start,
		end: parser.index,
		type: 'Text',
		raw: data,
		data: decode_character_references(data)
	};

	parser.current().children.push(node);
}

function fragment(parser) {
	if (parser.match('<')) {
		return tag;
	}

	if (parser.match('{')) {
		return mustache;
	}

	return text;
}

function getLocator(source, options) {
    if (options === void 0) { options = {}; }
    var offsetLine = options.offsetLine || 0;
    var offsetColumn = options.offsetColumn || 0;
    var originalLines = source.split('\n');
    var start = 0;
    var lineRanges = originalLines.map(function (line, i) {
        var end = start + line.length + 1;
        var range = { start: start, end: end, line: i };
        start = end;
        return range;
    });
    var i = 0;
    function rangeContains(range, index) {
        return range.start <= index && index < range.end;
    }
    function getLocation(range, index) {
        return { line: offsetLine + range.line, column: offsetColumn + index - range.start, character: index };
    }
    function locate(search, startIndex) {
        if (typeof search === 'string') {
            search = source.indexOf(search, startIndex || 0);
        }
        var range = lineRanges[i];
        var d = search >= range.end ? 1 : -1;
        while (range) {
            if (rangeContains(range, search))
                return getLocation(range, search);
            i += d;
            range = lineRanges[i];
        }
    }
    return locate;
}
function locate(source, search, options) {
    if (typeof options === 'number') {
        throw new Error('locate takes a { startIndex, offsetLine, offsetColumn } object as the third argument');
    }
    return getLocator(source, options)(search, options && options.startIndex);
}

function tabs_to_spaces(str) {
	return str.replace(/^\t+/, match => match.split('\t').join('  '));
}

function get_code_frame(
	source,
	line,
	column
) {
	const lines = source.split('\n');

	const frame_start = Math.max(0, line - 2);
	const frame_end = Math.min(line + 3, lines.length);

	const digits = String(frame_end + 1).length;

	return lines
		.slice(frame_start, frame_end)
		.map((str, i) => {
			const isErrorLine = frame_start + i === line;
			const line_num = String(i + frame_start + 1).padStart(digits, ' ');

			if (isErrorLine) {
				const indicator = ' '.repeat(digits + 2 + tabs_to_spaces(str.slice(0, column)).length) + '^';
				return `${line_num}: ${tabs_to_spaces(str)}\n${indicator}`;
			}

			return `${line_num}: ${tabs_to_spaces(str)}`;
		})
		.join('\n');
}

class CompileError extends Error {
	
	
	
	
	
	

	toString() {
		return `${this.message} (${this.start.line}:${this.start.column})\n${this.frame}`;
	}
}

function error(message, props






) {
	const error = new CompileError(message);
	error.name = props.name;

	const start = locate(props.source, props.start, { offsetLine: 1 });
	const end = locate(props.source, props.end || props.start, { offsetLine: 1 });

	error.code = props.code;
	error.start = start;
	error.end = end;
	error.pos = props.start;
	error.filename = props.filename;

	error.frame = get_code_frame(props.source, start.line - 1, start.column);

	throw error;
}

class Parser {
	
	
	

	__init() {this.index = 0;}
	__init2() {this.stack = [];}

	
	__init3() {this.css = [];}
	__init4() {this.js = [];}
	__init5() {this.meta_tags = {};}
	

	constructor(template, options) {Parser.prototype.__init.call(this);Parser.prototype.__init2.call(this);Parser.prototype.__init3.call(this);Parser.prototype.__init4.call(this);Parser.prototype.__init5.call(this);
		if (typeof template !== 'string') {
			throw new TypeError('Template must be a string');
		}

		this.template = template.replace(/\s+$/, '');
		this.filename = options.filename;
		this.customElement = options.customElement;

		this.html = {
			start: null,
			end: null,
			type: 'Fragment',
			children: []
		};

		this.stack.push(this.html);

		let state = fragment;

		while (this.index < this.template.length) {
			state = state(this) || fragment;
		}

		if (this.stack.length > 1) {
			const current = this.current();

			const type = current.type === 'Element' ? `<${current.name}>` : 'Block';
			const slug = current.type === 'Element' ? 'element' : 'block';

			this.error({
				code: `unclosed-${slug}`,
				message: `${type} was left open`
			}, current.start);
		}

		if (state !== fragment) {
			this.error({
				code: 'unexpected-eof',
				message: 'Unexpected end of input'
			});
		}

		if (this.html.children.length) {
			let start = this.html.children[0].start;
			while (whitespace.test(template[start])) start += 1;

			let end = this.html.children[this.html.children.length - 1].end;
			while (whitespace.test(template[end - 1])) end -= 1;

			this.html.start = start;
			this.html.end = end;
		} else {
			this.html.start = this.html.end = null;
		}
	}

	current() {
		return this.stack[this.stack.length - 1];
	}

	acorn_error(err) {
		this.error({
			code: 'parse-error',
			message: err.message.replace(/ \(\d+:\d+\)$/, '')
		}, err.pos);
	}

	error({ code, message }, index = this.index) {
		error(message, {
			name: 'ParseError',
			code,
			source: this.template,
			start: index,
			filename: this.filename
		});
	}

	eat(str, required, message) {
		if (this.match(str)) {
			this.index += str.length;
			return true;
		}

		if (required) {
			this.error({
				code: `unexpected-${this.index === this.template.length ? 'eof' : 'token'}`,
				message: message || `Expected ${str}`
			});
		}

		return false;
	}

	match(str) {
		return this.template.slice(this.index, this.index + str.length) === str;
	}

	match_regex(pattern) {
		const match = pattern.exec(this.template.slice(this.index));
		if (!match || match.index !== 0) return null;

		return match[0];
	}

	allow_whitespace() {
		while (
			this.index < this.template.length &&
			whitespace.test(this.template[this.index])
		) {
			this.index++;
		}
	}

	read(pattern) {
		const result = this.match_regex(pattern);
		if (result) this.index += result.length;
		return result;
	}

	read_identifier(allow_reserved = false) {
		const start = this.index;

		let i = this.index;

		const code = full_char_code_at(this.template, i);
		if (!isIdentifierStart(code, true)) return null;

		i += code <= 0xffff ? 1 : 2;

		while (i < this.template.length) {
			const code = full_char_code_at(this.template, i);

			if (!isIdentifierChar(code, true)) break;
			i += code <= 0xffff ? 1 : 2;
		}

		const identifier = this.template.slice(this.index, this.index = i);

		if (!allow_reserved && reserved.has(identifier)) {
			this.error({
				code: 'unexpected-reserved-word',
				message: `'${identifier}' is a reserved word in JavaScript and cannot be used here`
			}, start);
		}

		return identifier;
	}

	read_until(pattern) {
		if (this.index >= this.template.length) {
			this.error({
				code: 'unexpected-eof',
				message: 'Unexpected end of input'
			});
		}

		const start = this.index;
		const match = pattern.exec(this.template.slice(start));

		if (match) {
			this.index = start + match.index;
			return this.template.slice(start, this.index);
		}

		this.index = this.template.length;
		return this.template.slice(start);
	}

	require_whitespace() {
		if (!whitespace.test(this.template[this.index])) {
			this.error({
				code: 'missing-whitespace',
				message: 'Expected whitespace'
			});
		}

		this.allow_whitespace();
	}
}

function parse$1(
	template,
	options = {}
) {
	const parser = new Parser(template, options);

	// TODO we may want to allow multiple <style> tags —
	// one scoped, one global. for now, only allow one
	if (parser.css.length > 1) {
		parser.error({
			code: 'duplicate-style',
			message: 'You can only have one top-level <style> tag per component'
		}, parser.css[1].start);
	}

	const instance_scripts = parser.js.filter(script => script.context === 'default');
	const module_scripts = parser.js.filter(script => script.context === 'module');

	if (instance_scripts.length > 1) {
		parser.error({
			code: 'invalid-script',
			message: 'A component can only have one instance-level <script> element'
		}, instance_scripts[1].start);
	}

	if (module_scripts.length > 1) {
		parser.error({
			code: 'invalid-script',
			message: 'A component can only have one <script context="module"> element'
		}, module_scripts[1].start);
	}

	return {
		html: parser.html,
		css: parser.css[0],
		instance: instance_scripts[0],
		module: module_scripts[0]
	};
}

function isReference(node, parent) {
    if (node.type === 'MemberExpression') {
        return !node.computed && isReference(node.object, node);
    }
    if (node.type === 'Identifier') {
        if (!parent)
            return true;
        switch (parent.type) {
            // disregard `bar` in `foo.bar`
            case 'MemberExpression': return parent.computed || node === parent.object;
            // disregard the `foo` in `class {foo(){}}` but keep it in `class {[foo](){}}`
            case 'MethodDefinition': return parent.computed;
            // disregard the `foo` in `class {foo=bar}` but keep it in `class {[foo]=bar}` and `class {bar=foo}`
            case 'FieldDefinition': return parent.computed || node === parent.value;
            // disregard the `bar` in `{ bar: foo }`, but keep it in `{ [bar]: foo }`
            case 'Property': return parent.computed || node === parent.value;
            // disregard the `bar` in `export { foo as bar }` or
            // the foo in `import { foo as bar }`
            case 'ExportSpecifier':
            case 'ImportSpecifier': return node === parent.local;
            // disregard the `foo` in `foo: while (...) { ... break foo; ... continue foo;}`
            case 'LabeledStatement':
            case 'BreakStatement':
            case 'ContinueStatement': return false;
            default: return true;
        }
    }
    return false;
}

function analyze(expression) {
	const map = new WeakMap();

	let scope = new Scope(null, false);

	walk(expression, {
		enter(node, parent) {
			if (node.type === 'ImportDeclaration') {
				node.specifiers.forEach((specifier) => {
					scope.declarations.set(specifier.local.name, specifier);
				});
			} else if (/(Function(Declaration|Expression)|ArrowFunctionExpression)/.test(node.type)) {
				if (node.type === 'FunctionDeclaration') {
					scope.declarations.set(node.id.name, node);
					map.set(node, scope = new Scope(scope, false));
				} else {
					map.set(node, scope = new Scope(scope, false));
					if (node.type === 'FunctionExpression' && node.id) scope.declarations.set(node.id.name, node);
				}

				node.params.forEach((param) => {
					extract_names(param).forEach(name => {
						scope.declarations.set(name, node);
					});
				});
			} else if (/For(?:In|Of)?Statement/.test(node.type)) {
				map.set(node, scope = new Scope(scope, true));
			} else if (node.type === 'BlockStatement') {
				map.set(node, scope = new Scope(scope, true));
			} else if (/(Class|Variable)Declaration/.test(node.type)) {
				scope.add_declaration(node);
			} else if (node.type === 'CatchClause') {
				map.set(node, scope = new Scope(scope, true));

				if (node.param) {
					extract_names(node.param).forEach(name => {
						scope.declarations.set(name, node.param);
					});
				}
			}
		},

		leave(node) {
			if (map.has(node)) {
				scope = scope.parent;
			}
		}
	});

	const globals = new Map();

	walk(expression, {
		enter(node, parent) {
			if (map.has(node)) scope = map.get(node);

			if (node.type === 'Identifier' && isReference(node, parent)) {
				const owner = scope.find_owner(node.name);
				if (!owner) globals.set(node.name, node);

				add_reference(scope, node.name);
			}
		},
		leave(node) {
			if (map.has(node)) {
				scope = scope.parent;
			}
		}
	});

	return { map, scope, globals };
}

function add_reference(scope, name) {
	scope.references.add(name);
	if (scope.parent) add_reference(scope.parent, name);
}

class Scope {
	
	
	__init() {this.declarations = new Map();}
	__init2() {this.initialised_declarations = new Set();}
	__init3() {this.references = new Set();}

	constructor(parent, block) {Scope.prototype.__init.call(this);Scope.prototype.__init2.call(this);Scope.prototype.__init3.call(this);
		this.parent = parent;
		this.block = block;
	}


	add_declaration(node) {
		if (node.type === 'VariableDeclaration') {
			if (node.kind === 'var' && this.block && this.parent) {
				this.parent.add_declaration(node);
			} else if (node.type === 'VariableDeclaration') {
				node.declarations.forEach((declarator) => {
					extract_names(declarator.id).forEach(name => {
						this.declarations.set(name, node);
						if (declarator.init) this.initialised_declarations.add(name);
					});
				});
			}
		} else {
			this.declarations.set(node.id.name, node);
		}
	}

	find_owner(name) {
		if (this.declarations.has(name)) return this;
		return this.parent && this.parent.find_owner(name);
	}

	has(name) {
		return (
			this.declarations.has(name) || (this.parent && this.parent.has(name))
		);
	}
}

function extract_names(param) {
	return extract_identifiers(param).map(node => node.name);
}

function extract_identifiers(param) {
	const nodes = [];
	extractors[param.type] && extractors[param.type](nodes, param);
	return nodes;
}

const extractors = {
	Identifier(nodes, param) {
		nodes.push(param);
	},

	MemberExpression(nodes, param) {
		let object = param;
		while (object.type === 'MemberExpression') object = object.object;
		nodes.push(object);
	},

	ObjectPattern(nodes, param) {
		param.properties.forEach((prop) => {
			if (prop.type === 'RestElement') {
				nodes.push(prop.argument);
			} else {
				extractors[prop.value.type](nodes, prop.value);
			}
		});
	},

	ArrayPattern(nodes, param) {
		param.elements.forEach((element) => {
			if (element) extractors[element.type](nodes, element);
		});
	},

	RestElement(nodes, param) {
		extractors[param.argument.type](nodes, param.argument);
	},

	AssignmentPattern(nodes, param) {
		extractors[param.left.type](nodes, param.left);
	}
};

var charToInteger = {};
var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
for (var i = 0; i < chars.length; i++) {
    charToInteger[chars.charCodeAt(i)] = i;
}
function decode(mappings) {
    var decoded = [];
    var line = [];
    var segment = [
        0,
        0,
        0,
        0,
        0,
    ];
    var j = 0;
    for (var i = 0, shift = 0, value = 0; i < mappings.length; i++) {
        var c = mappings.charCodeAt(i);
        if (c === 44) { // ","
            segmentify(line, segment, j);
            j = 0;
        }
        else if (c === 59) { // ";"
            segmentify(line, segment, j);
            j = 0;
            decoded.push(line);
            line = [];
            segment[0] = 0;
        }
        else {
            var integer = charToInteger[c];
            if (integer === undefined) {
                throw new Error('Invalid character (' + String.fromCharCode(c) + ')');
            }
            var hasContinuationBit = integer & 32;
            integer &= 31;
            value += integer << shift;
            if (hasContinuationBit) {
                shift += 5;
            }
            else {
                var shouldNegate = value & 1;
                value >>>= 1;
                if (shouldNegate) {
                    value = value === 0 ? -0x80000000 : -value;
                }
                segment[j] += value;
                j++;
                value = shift = 0; // reset
            }
        }
    }
    segmentify(line, segment, j);
    decoded.push(line);
    return decoded;
}
function segmentify(line, segment, j) {
    // This looks ugly, but we're creating specialized arrays with a specific
    // length. This is much faster than creating a new array (which v8 expands to
    // a capacity of 17 after pushing the first item), or slicing out a subarray
    // (which is slow). Length 4 is assumed to be the most frequent, followed by
    // length 5 (since not everything will have an associated name), followed by
    // length 1 (it's probably rare for a source substring to not have an
    // associated segment data).
    if (j === 4)
        line.push([segment[0], segment[1], segment[2], segment[3]]);
    else if (j === 5)
        line.push([segment[0], segment[1], segment[2], segment[3], segment[4]]);
    else if (j === 1)
        line.push([segment[0]]);
}
function encode(decoded) {
    var sourceFileIndex = 0; // second field
    var sourceCodeLine = 0; // third field
    var sourceCodeColumn = 0; // fourth field
    var nameIndex = 0; // fifth field
    var mappings = '';
    for (var i = 0; i < decoded.length; i++) {
        var line = decoded[i];
        if (i > 0)
            mappings += ';';
        if (line.length === 0)
            continue;
        var generatedCodeColumn = 0; // first field
        var lineMappings = [];
        for (var _i = 0, line_1 = line; _i < line_1.length; _i++) {
            var segment = line_1[_i];
            var segmentMappings = encodeInteger(segment[0] - generatedCodeColumn);
            generatedCodeColumn = segment[0];
            if (segment.length > 1) {
                segmentMappings +=
                    encodeInteger(segment[1] - sourceFileIndex) +
                        encodeInteger(segment[2] - sourceCodeLine) +
                        encodeInteger(segment[3] - sourceCodeColumn);
                sourceFileIndex = segment[1];
                sourceCodeLine = segment[2];
                sourceCodeColumn = segment[3];
            }
            if (segment.length === 5) {
                segmentMappings += encodeInteger(segment[4] - nameIndex);
                nameIndex = segment[4];
            }
            lineMappings.push(segmentMappings);
        }
        mappings += lineMappings.join(',');
    }
    return mappings;
}
function encodeInteger(num) {
    var result = '';
    num = num < 0 ? (-num << 1) | 1 : num << 1;
    do {
        var clamped = num & 31;
        num >>>= 5;
        if (num > 0) {
            clamped |= 32;
        }
        result += chars[clamped];
    } while (num > 0);
    return result;
}

// generate an ID that is, to all intents and purposes, unique
const id = (Math.round(Math.random() * 1e20)).toString(36);
const re = new RegExp(`_${id}_(?:(\\d+)|(AT)|(HASH))_(\\w+)?`, 'g');

const get_comment_handlers = (comments, raw) => ({

	// pass to acorn options
	onComment: (block, value, start, end) => {
		if (block && /\n/.test(value)) {
			let a = start;
			while (a > 0 && raw[a - 1] !== '\n') a -= 1;

			let b = a;
			while (/[ \t]/.test(raw[b])) b += 1;

			const indentation = raw.slice(a, b);
			value = value.replace(new RegExp(`^${indentation}`, 'gm'), '');
		}

		comments.push({ type: block ? 'Block' : 'Line', value, start, end });
	},

	// pass to estree-walker options
	enter(node) {
		let comment;

		while (comments[0] && comments[0].start < (node ).start) {
			comment = comments.shift();

			comment.value = comment.value.replace(re, (match, id, at, hash, value) => {
				if (hash) return `#${value}`;
				if (at) return `@${value}`;

				return match;
			});

			const next = comments[0] || node;
			(comment ).has_trailing_newline = (
				comment.type === 'Line' ||
				/\n/.test(raw.slice(comment.end, (next ).start))
			);

			(node.leadingComments || (node.leadingComments = [])).push(comment);
		}
	},
	leave(node) {
		if (comments[0]) {
			const slice = raw.slice((node ).end, comments[0].start);

			if (/^[,) \t]*$/.test(slice)) {
				node.trailingComments = [comments.shift()];
			}
		}
	}

});

function handle(node, state) {
	const handler = handlers[node.type];

	if (!handler) {
		throw new Error(`Not implemented ${node.type}`);
	}

	const result = handler(node, state);

	if (node.leadingComments) {
		result.unshift(c(node.leadingComments.map(comment => comment.type === 'Block'
			? `/*${comment.value}*/${(comment ).has_trailing_newline ? `\n${state.indent}` : ` `}`
			: `//${comment.value}${(comment ).has_trailing_newline ? `\n${state.indent}` : ` `}`).join(``)));
	}

	if (node.trailingComments) {
		state.comments.push(node.trailingComments[0]); // there is only ever one
	}

	return result;
}

function c(content, node) {
	return {
		content,
		loc: node && node.loc,
		has_newline: /\n/.test(content)
	};
}

const OPERATOR_PRECEDENCE = {
	'||': 2,
	'&&': 3,
	'??': 4,
	'|': 5,
	'^': 6,
	'&': 7,
	'==': 8,
	'!=': 8,
	'===': 8,
	'!==': 8,
	'<': 9,
	'>': 9,
	'<=': 9,
	'>=': 9,
	in: 9,
	instanceof: 9,
	'<<': 10,
	'>>': 10,
	'>>>': 10,
	'+': 11,
	'-': 11,
	'*': 12,
	'%': 12,
	'/': 12,
	'**': 13,
};

const EXPRESSIONS_PRECEDENCE = {
	ArrayExpression: 20,
	TaggedTemplateExpression: 20,
	ThisExpression: 20,
	Identifier: 20,
	Literal: 18,
	TemplateLiteral: 20,
	Super: 20,
	SequenceExpression: 20,
	MemberExpression: 19,
	CallExpression: 19,
	NewExpression: 19,
	AwaitExpression: 17,
	ClassExpression: 17,
	FunctionExpression: 17,
	ObjectExpression: 17,
	UpdateExpression: 16,
	UnaryExpression: 15,
	BinaryExpression: 14,
	LogicalExpression: 13,
	ConditionalExpression: 4,
	ArrowFunctionExpression: 3,
	AssignmentExpression: 3,
	YieldExpression: 2,
	RestElement: 1
};

function needs_parens(node, parent, is_right) {
	// special case where logical expressions and coalesce expressions cannot be mixed,
	// either of them need to be wrapped with parentheses
	if (
		node.type === 'LogicalExpression' &&
		parent.type === 'LogicalExpression' &&
		((parent.operator === '??' && node.operator !== '??') ||
			(parent.operator !== '??' && node.operator === '??'))
	) {
		return true;
	}

	const precedence = EXPRESSIONS_PRECEDENCE[node.type];
	const parent_precedence = EXPRESSIONS_PRECEDENCE[parent.type];

	if (precedence !== parent_precedence) {
		// Different node types
		return (
			(!is_right &&
				precedence === 15 &&
				parent_precedence === 14 &&
				parent.operator === '**') ||
			precedence < parent_precedence
		);
	}

	if (precedence !== 13 && precedence !== 14) {
		// Not a `LogicalExpression` or `BinaryExpression`
		return false;
	}

	if ((node ).operator === '**' && parent.operator === '**') {
		// Exponentiation operator has right-to-left associativity
		return !is_right;
	}

	if (is_right) {
		// Parenthesis are used if both operators have the same precedence
		return (
			OPERATOR_PRECEDENCE[(node ).operator] <=
			OPERATOR_PRECEDENCE[parent.operator]
		);
	}

	return (
		OPERATOR_PRECEDENCE[(node ).operator] <
		OPERATOR_PRECEDENCE[parent.operator]
	);
}

function has_call_expression(node) {
	while (node) {
		if (node.type[0] === 'CallExpression') {
			return true;
		} else if (node.type === 'MemberExpression') {
			node = node.object;
		} else {
			return false;
		}
	}
}

const has_newline = (chunks) => {
	for (let i = 0; i < chunks.length; i += 1) {
		if (chunks[i].has_newline) return true;
	}
	return false;
};

const get_length = (chunks) => {
	let total = 0;
	for (let i = 0; i < chunks.length; i += 1) {
		total += chunks[i].content.length;
	}
	return total;
};

const sum = (a, b) => a + b;

const join = (nodes, separator) => {
	if (nodes.length === 0) return [];
	const joined = [...nodes[0]];
	for (let i = 1; i < nodes.length; i += 1) {
		joined.push(separator, ...nodes[i] );
	}
	return joined;
};

const scoped = (fn) => {
	return (node, state) => {
		return fn(node, {
			...state,
			scope: state.scope_map.get(node)
		});
	};
};

const deconflict = (name, names) => {
	const original = name;
	let i = 1;

	while (names.has(name)) {
		name = `${original}$${i++}`;
	}

	return name;
};

const handle_body = (nodes, state) => {
	const chunks = [];

	const body = nodes.map(statement => {
		const chunks = handle(statement, {
			...state,
			indent: state.indent
		});

		let add_newline = false;

		while (state.comments.length) {
			const comment = state.comments.shift();
			const prefix = add_newline ? `\n${state.indent}` : ` `;

			chunks.push(c(comment.type === 'Block'
				? `${prefix}/*${comment.value}*/`
				: `${prefix}//${comment.value}`));

			add_newline = (comment.type === 'Line');
		}

		return chunks;
	});

	let needed_padding = false;

	for (let i = 0; i < body.length; i += 1) {
		const needs_padding = has_newline(body[i]);

		if (i > 0) {
			chunks.push(
				c(needs_padding || needed_padding ? `\n\n${state.indent}` : `\n${state.indent}`)
			);
		}

		chunks.push(
			...body[i]
		);

		needed_padding = needs_padding;
	}

	return chunks;
};

const handle_var_declaration = (node, state) => {
	const chunks = [c(`${node.kind} `)];

	const declarators = node.declarations.map(d => handle(d, {
		...state,
		indent: state.indent + (node.declarations.length === 1 ? '' : '\t')
	}));

	const multiple_lines = (
		declarators.some(has_newline) ||
		(declarators.map(get_length).reduce(sum, 0) + (state.indent.length + declarators.length - 1) * 2) > 80
	);

	const separator = c(multiple_lines ? `,\n${state.indent}\t` : ', ');

	if (multiple_lines) {
		chunks.push(...join(declarators, separator));
	} else {
		chunks.push(
			...join(declarators, separator)
		);
	}

	return chunks;
};

const handlers = {
	Program(node, state) {
		return handle_body(node.body, state);
	},

	BlockStatement: scoped((node, state) => {
		return [
			c(`{\n${state.indent}\t`),
			...handle_body(node.body, { ...state, indent: state.indent + '\t' }),
			c(`\n${state.indent}}`)
		];
	}),

	EmptyStatement(node, state) {
		return [];
	},

	ParenthesizedExpression(node, state) {
		return handle(node.expression, state);
	},

	ExpressionStatement(node, state) {
		if (
			node.expression.type === 'AssignmentExpression' &&
			node.expression.left.type === 'ObjectPattern'
		) {
			// is an AssignmentExpression to an ObjectPattern
			return [
				c('('),
				...handle(node.expression, state),
				c(');')
			];
		}

		return [
			...handle(node.expression, state),
			c(';')
		];
	},

	IfStatement(node, state) {
		const chunks = [
			c('if ('),
			...handle(node.test, state),
			c(') '),
			...handle(node.consequent, state)
		];

		if (node.alternate) {
			chunks.push(
				c(' else '),
				...handle(node.alternate, state)
			);
		}

		return chunks;
	},

	LabeledStatement(node, state) {
		return [
			...handle(node.label, state),
			c(': '),
			...handle(node.body, state)
		];
	},

	BreakStatement(node, state) {
		return node.label
			? [c('break '), ...handle(node.label, state), c(';')]
			: [c('break;')];
	},

	ContinueStatement(node, state) {
		return node.label
			? [c('continue '), ...handle(node.label, state), c(';')]
			: [c('continue;')];
	},

	WithStatement(node, state) {
		return [
			c('with ('),
			...handle(node.object, state),
			c(') '),
			...handle(node.body, state)
		];
	},

	SwitchStatement(node, state) {
		const chunks = [
			c('switch ('),
			...handle(node.discriminant, state),
			c(') {')
		];

		node.cases.forEach(block => {
			if (block.test) {
				chunks.push(
					c(`\n${state.indent}\tcase `),
					...handle(block.test, { ...state, indent: `${state.indent}\t` }),
					c(':')
				);
			} else {
				chunks.push(c(`\n${state.indent}\tdefault:`));
			}

			block.consequent.forEach(statement => {
				chunks.push(
					c(`\n${state.indent}\t\t`),
					...handle(statement, { ...state, indent: `${state.indent}\t\t` })
				);
			});
		});

		chunks.push(c(`\n${state.indent}}`));

		return chunks;
	},

	ReturnStatement(node, state) {
		if (node.argument) {
			return [
				c('return '),
				...handle(node.argument, state),
				c(';')
			];
		} else {
			return [c('return;')];
		}
	},

	ThrowStatement(node, state) {
		return [
			c('throw '),
			...handle(node.argument, state),
			c(';')
		];
	},

	TryStatement(node, state) {
		const chunks = [
			c('try '),
			...handle(node.block, state)
		];

		if (node.handler) {
			if (node.handler.param) {
				chunks.push(
					c(' catch('),
					...handle(node.handler.param, state),
					c(') ')
				);
			} else {
				chunks.push(c(' catch '));
			}

			chunks.push(...handle(node.handler.body, state));
		}

		if (node.finalizer) {
			chunks.push(c(' finally '), ...handle(node.finalizer, state));
		}

		return chunks;
	},

	WhileStatement(node, state) {
		return [
			c('while ('),
			...handle(node.test, state),
			c(') '),
			...handle(node.body, state)
		];
	},

	DoWhileStatement(node, state) {
		return [
			c('do '),
			...handle(node.body, state),
			c(' while ('),
			...handle(node.test, state),
			c(');')
		];
	},

	ForStatement: scoped((node, state) => {
		const chunks = [c('for (')];

		if (node.init) {
			if ((node.init ).type === 'VariableDeclaration') {
				chunks.push(...handle_var_declaration(node.init , state));
			} else {
				chunks.push(...handle(node.init, state));
			}
		}

		chunks.push(c('; '));
		if (node.test) chunks.push(...handle(node.test, state));
		chunks.push(c('; '));
		if (node.update) chunks.push(...handle(node.update, state));

		chunks.push(
			c(') '),
			...handle(node.body, state)
		);

		return chunks;
	}),

	ForInStatement: scoped((node, state) => {
		const chunks = [
			c(`for ${(node ).await ? 'await ' : ''}(`)
		];

		if ((node.left ).type === 'VariableDeclaration') {
			chunks.push(...handle_var_declaration(node.left , state));
		} else {
			chunks.push(...handle(node.left, state));
		}

		chunks.push(
			c(node.type === 'ForInStatement' ? ` in ` : ` of `),
			...handle(node.right, state),
			c(') '),
			...handle(node.body, state)
		);

		return chunks;
	}),

	DebuggerStatement(node, state) {
		return [c('debugger', node), c(';')];
	},

	FunctionDeclaration: scoped((node, state) => {
		const chunks = [];

		if (node.async) chunks.push(c('async '));
		chunks.push(c(node.generator ? 'function* ' : 'function '));
		if (node.id) chunks.push(...handle(node.id, state));
		chunks.push(c('('));

		const params = node.params.map(p => handle(p, {
			...state,
			indent: state.indent + '\t'
		}));

		const multiple_lines = (
			params.some(has_newline) ||
			(params.map(get_length).reduce(sum, 0) + (state.indent.length + params.length - 1) * 2) > 80
		);

		const separator = c(multiple_lines ? `,\n${state.indent}` : ', ');

		if (multiple_lines) {
			chunks.push(
				c(`\n${state.indent}\t`),
				...join(params, separator),
				c(`\n${state.indent}`)
			);
		} else {
			chunks.push(
				...join(params, separator)
			);
		}

		chunks.push(
			c(') '),
			...handle(node.body, state)
		);

		return chunks;
	}),

	VariableDeclaration(node, state) {
		return handle_var_declaration(node, state).concat(c(';'));
	},

	VariableDeclarator(node, state) {
		if (node.init) {
			return [
				...handle(node.id, state),
				c(' = '),
				...handle(node.init, state)
			];
		} else {
			return handle(node.id, state);
		}
	},

	ClassDeclaration(node, state) {
		const chunks = [c('class ')];

		if (node.id) chunks.push(...handle(node.id, state), c(' '));

		if (node.superClass) {
			chunks.push(
				c('extends '),
				...handle(node.superClass, state),
				c(' ')
			);
		}

		chunks.push(...handle(node.body, state));

		return chunks;
	},

	ImportDeclaration(node, state) {
		const chunks = [c('import ')];

		const { length } = node.specifiers;
		const source = handle(node.source, state);

		if (length > 0) {
			let i = 0;

			while (i < length) {
				if (i > 0) {
					chunks.push(c(', '));
				}

				const specifier = node.specifiers[i];

				if (specifier.type === 'ImportDefaultSpecifier') {
					chunks.push(c(specifier.local.name, specifier));
					i += 1;
				} else if (specifier.type === 'ImportNamespaceSpecifier') {
					chunks.push(c('* as ' + specifier.local.name, specifier));
					i += 1;
				} else {
					break;
				}
			}

			if (i < length) {
				// we have named specifiers
				const specifiers = node.specifiers.slice(i).map((specifier) => {
					const name = handle(specifier.imported, state)[0];
					const as = handle(specifier.local, state)[0];

					if (name.content === as.content) {
						return [as];
					}

					return [name, c(' as '), as];
				});

				const width = get_length(chunks) + specifiers.map(get_length).reduce(sum, 0) + (2 * specifiers.length) + 6 + get_length(source);

				if (width > 80) {
					chunks.push(
						c(`{\n\t`),
						...join(specifiers, c(',\n\t')),
						c('\n}')
					);
				} else {
					chunks.push(
						c(`{ `),
						...join(specifiers, c(', ')),
						c(' }')
					);
				}
			}

			chunks.push(c(' from '));
		}

		chunks.push(
			...source,
			c(';')
		);

		return chunks;
	},

	ImportExpression(node, state) {
		return [c('import('), ...handle(node.source, state), c(')')];
	},

	ExportDefaultDeclaration(node, state) {
		const chunks = [
			c(`export default `),
			...handle(node.declaration, state)
		];

		if (node.declaration.type !== 'FunctionDeclaration') {
			chunks.push(c(';'));
		}

		return chunks;
	},

	ExportNamedDeclaration(node, state) {
		const chunks = [c('export ')];

		if (node.declaration) {
			chunks.push(...handle(node.declaration, state));
		} else {
			const specifiers = node.specifiers.map(specifier => {
				const name = handle(specifier.local, state)[0];
				const as = handle(specifier.exported, state)[0];

				if (name.content === as.content) {
					return [name];
				}

				return [name, c(' as '), as];
			});

			const width = 7 + specifiers.map(get_length).reduce(sum, 0) + 2 * specifiers.length;

			if (width > 80) {
				chunks.push(
					c('{\n\t'),
					...join(specifiers, c(',\n\t')),
					c('\n}')
				);
			} else {
				chunks.push(
					c('{ '),
					...join(specifiers, c(', ')),
					c(' }')
				);
			}

			if (node.source) {
				chunks.push(
					c(' from '),
					...handle(node.source, state)
				);
			}
		}

		chunks.push(c(';'));

		return chunks;
	},

	ExportAllDeclaration(node, state) {
		return [
			c(`export * from `),
			...handle(node.source, state),
			c(`;`)
		];
	},

	MethodDefinition(node, state) {
		const chunks = [];

		if (node.static) {
			chunks.push(c('static '));
		}

		if (node.kind === 'get' || node.kind === 'set') {
			// Getter or setter
			chunks.push(c(node.kind + ' '));
		}

		if (node.value.async) {
			chunks.push(c('async '));
		}

		if (node.value.generator) {
			chunks.push(c('*'));
		}

		if (node.computed) {
			chunks.push(
				c('['),
				...handle(node.key, state),
				c(']')
			);
		} else {
			chunks.push(...handle(node.key, state));
		}

		chunks.push(c('('));

		const { params } = node.value;
		for (let i = 0; i < params.length; i += 1) {
			chunks.push(...handle(params[i], state));
			if (i < params.length - 1) chunks.push(c(', '));
		}

		chunks.push(
			c(') '),
			...handle(node.value.body, state)
		);

		return chunks;
	},

	ArrowFunctionExpression: scoped((node, state) => {
		const chunks = [];

		if (node.async) chunks.push(c('async '));

		if (node.params.length === 1 && node.params[0].type === 'Identifier') {
			chunks.push(...handle(node.params[0], state));
		} else {
			const params = node.params.map(param => handle(param, {
				...state,
				indent: state.indent + '\t'
			}));

			chunks.push(
				c('('),
				...join(params, c(', ')),
				c(')')
			);
		}

		chunks.push(c(' => '));

		if (node.body.type === 'ObjectExpression') {
			chunks.push(
				c('('),
				...handle(node.body, state),
				c(')')
			);
		} else {
			chunks.push(...handle(node.body, state));
		}

		return chunks;
	}),

	ThisExpression(node, state) {
		return [c('this', node)];
	},

	Super(node, state) {
		return [c('super', node)];
	},

	RestElement(node, state) {
		return [c('...'), ...handle(node.argument, state)];
	},

	YieldExpression(node, state) {
		if (node.argument) {
			return [c(node.delegate ? `yield* ` : `yield `), ...handle(node.argument, state)];
		}

		return [c(node.delegate ? `yield*` : `yield`)];
	},

	AwaitExpression(node, state) {
		if (node.argument) {
			const precedence = EXPRESSIONS_PRECEDENCE[node.argument.type];

			if (precedence && (precedence < EXPRESSIONS_PRECEDENCE.AwaitExpression)) {
				return [c('await ('), ...handle(node.argument, state), c(')')];
			} else {
				return [c('await '), ...handle(node.argument, state)];
			}
		}

		return [c('await')];
	},

	TemplateLiteral(node, state) {
		const chunks = [c('`')];

		const { quasis, expressions } = node;

		for (let i = 0; i < expressions.length; i++) {
			chunks.push(
				c(quasis[i].value.raw),
				c('${'),
				...handle(expressions[i], state),
				c('}')
			);
		}

		chunks.push(
			c(quasis[quasis.length - 1].value.raw),
			c('`')
		);

		return chunks;
	},

	TaggedTemplateExpression(node, state) {
		return handle(node.tag, state).concat(handle(node.quasi, state));
	},

	ArrayExpression(node, state) {
		const chunks = [c('[')];

		const elements = [];
		let sparse_commas = [];

		for (let i = 0; i < node.elements.length; i += 1) {
			// can't use map/forEach because of sparse arrays
			const element = node.elements[i];
			if (element) {
				elements.push([...sparse_commas, ...handle(element, {
					...state,
					indent: state.indent + '\t'
				})]);
				sparse_commas = [];
			} else {
				sparse_commas.push(c(','));
			}
		}

		const multiple_lines = (
			elements.some(has_newline) ||
			(elements.map(get_length).reduce(sum, 0) + (state.indent.length + elements.length - 1) * 2) > 80
		);

		if (multiple_lines) {
			chunks.push(
				c(`\n${state.indent}\t`),
				...join(elements, c(`,\n${state.indent}\t`)),
				c(`\n${state.indent}`),
				...sparse_commas
			);
		} else {
			chunks.push(...join(elements, c(', ')), ...sparse_commas);
		}

		chunks.push(c(']'));

		return chunks;
	},

	ObjectExpression(node, state) {
		if (node.properties.length === 0) {
			return [c('{}')];
		}

		let has_inline_comment = false;

		const chunks = [];
		const separator = c(', ');

		node.properties.forEach((p, i) => {
			chunks.push(...handle(p, {
				...state,
				indent: state.indent + '\t'
			}));

			if (state.comments.length) {
				// TODO generalise this, so it works with ArrayExpressions and other things.
				// At present, stuff will just get appended to the closest statement/declaration
				chunks.push(c(', '));

				while (state.comments.length) {
					const comment = state.comments.shift();

					chunks.push(c(comment.type === 'Block'
						? `/*${comment.value}*/\n${state.indent}\t`
						: `//${comment.value}\n${state.indent}\t`));

					if (comment.type === 'Line') {
						has_inline_comment = true;
					}
				}
			} else {
				if (i < node.properties.length - 1) {
					chunks.push(separator);
				}
			}
		});

		const multiple_lines = (
			has_inline_comment ||
			has_newline(chunks) ||
			get_length(chunks) > 40
		);

		if (multiple_lines) {
			separator.content = `,\n${state.indent}\t`;
		}

		return [
			c(multiple_lines ? `{\n${state.indent}\t` : `{ `),
			...chunks,
			c(multiple_lines ? `\n${state.indent}}` : ` }`)
		];
	},

	Property(node, state) {
		const value = handle(node.value, state);

		if (node.key === node.value) {
			return value;
		}

		// special case
		if (
			!node.computed &&
			node.value.type === 'AssignmentPattern' &&
			node.value.left.type === 'Identifier' &&
			node.value.left.name === (node.key ).name
		) {
			return value;
		}

		if (node.value.type === 'Identifier' && (
			(node.key.type === 'Identifier' && node.key.name === value[0].content) ||
			(node.key.type === 'Literal' && node.key.value === value[0].content)
		)) {
			return value;
		}

		const key = handle(node.key, state);

		if (node.value.type === 'FunctionExpression' && !node.value.id) {
			state = {
				...state,
				scope: state.scope_map.get(node.value)
			};

			const chunks = node.kind !== 'init'
				? [c(`${node.kind} `)]
				: [];

			if (node.value.async) {
				chunks.push(c('async '));
			}
			if (node.value.generator) {
				chunks.push(c('*'));
			}

			chunks.push(
				...(node.computed ? [c('['), ...key, c(']')] : key),
				c('('),
				...join((node.value ).params.map(param => handle(param, state)), c(', ')),
				c(') '),
				...handle((node.value ).body, state)
			);

			return chunks;
		}

		if (node.computed) {
			return [
				c('['),
				...key,
				c(']: '),
				...value
			];
		}

		return [
			...key,
			c(': '),
			...value
		];
	},

	ObjectPattern(node, state) {
		const chunks = [c('{ ')];

		for (let i = 0; i < node.properties.length; i += 1) {
			chunks.push(...handle(node.properties[i], state));
			if (i < node.properties.length - 1) chunks.push(c(', '));
		}

		chunks.push(c(' }'));

		return chunks;
	},

	SequenceExpression(node, state) {
		const expressions = node.expressions.map(e => handle(e, state));

		return [
			c('('),
			...join(expressions, c(', ')),
			c(')')
		];
	},

	UnaryExpression(node, state) {
		const chunks = [c(node.operator)];

		if (node.operator.length > 1) {
			chunks.push(c(' '));
		}

		if (
			EXPRESSIONS_PRECEDENCE[node.argument.type] <
			EXPRESSIONS_PRECEDENCE.UnaryExpression
		) {
			chunks.push(
				c('('),
				...handle(node.argument, state),
				c(')')
			);
		} else {
			chunks.push(...handle(node.argument, state));
		}

		return chunks;
	},

	UpdateExpression(node, state) {
		return node.prefix
			? [c(node.operator), ...handle(node.argument, state)]
			: [...handle(node.argument, state), c(node.operator)];
	},

	AssignmentExpression(node, state) {
		return [
			...handle(node.left, state),
			c(` ${node.operator || '='} `),
			...handle(node.right, state)
		];
	},

	BinaryExpression(node, state) {
		const chunks = [];

		// TODO
		// const is_in = node.operator === 'in';
		// if (is_in) {
		// 	// Avoids confusion in `for` loops initializers
		// 	chunks.push(c('('));
		// }

		if (needs_parens(node.left, node, false)) {
			chunks.push(
				c('('),
				...handle(node.left, state),
				c(')')
			);
		} else {
			chunks.push(...handle(node.left, state));
		}

		chunks.push(c(` ${node.operator} `));

		if (needs_parens(node.right, node, true)) {
			chunks.push(
				c('('),
				...handle(node.right, state),
				c(')')
			);
		} else {
			chunks.push(...handle(node.right, state));
		}

		return chunks;
	},

	ConditionalExpression(node, state) {
		const chunks = [];

		if (
			EXPRESSIONS_PRECEDENCE[node.test.type] >
			EXPRESSIONS_PRECEDENCE.ConditionalExpression
		) {
			chunks.push(...handle(node.test, state));
		} else {
			chunks.push(
				c('('),
				...handle(node.test, state),
				c(')')
			);
		}

		const child_state = { ...state, indent: state.indent + '\t' };

		const consequent = handle(node.consequent, child_state);
		const alternate = handle(node.alternate, child_state);

		const multiple_lines = (
			has_newline(consequent) || has_newline(alternate) ||
			get_length(chunks) + get_length(consequent) + get_length(alternate) > 50
		);

		if (multiple_lines) {
			chunks.push(
				c(`\n${state.indent}? `),
				...consequent,
				c(`\n${state.indent}: `),
				...alternate
			);
		} else {
			chunks.push(
				c(` ? `),
				...consequent,
				c(` : `),
				...alternate
			);
		}

		return chunks;
	},

	NewExpression(node, state) {
		const chunks = [c('new ')];

		if (
			EXPRESSIONS_PRECEDENCE[node.callee.type] <
			EXPRESSIONS_PRECEDENCE.CallExpression || has_call_expression(node.callee)
		) {
			chunks.push(
				c('('),
				...handle(node.callee, state),
				c(')')
			);
		} else {
			chunks.push(...handle(node.callee, state));
		}

		// TODO this is copied from CallExpression — DRY it out
		const args = node.arguments.map(arg => handle(arg, {
			...state,
			indent: state.indent + '\t'
		}));

		const separator = args.some(has_newline) // TODO or length exceeds 80
			? c(',\n' + state.indent)
			: c(', ');

		chunks.push(
			c('('),
			...join(args, separator) ,
			c(')')
		);

		return chunks;
	},

	ChainExpression(node, state) {
		return handle(node.expression, state);
	},

	CallExpression(node, state) {
		const chunks = [];

		if (
			EXPRESSIONS_PRECEDENCE[node.callee.type] <
			EXPRESSIONS_PRECEDENCE.CallExpression
		) {
			chunks.push(
				c('('),
				...handle(node.callee, state),
				c(')')
			);
		} else {
			chunks.push(...handle(node.callee, state));
		}

		if ((node ).optional) {
			chunks.push(c('?.'));
		}

		const args = node.arguments.map(arg => handle(arg, state));

		const multiple_lines = args.slice(0, -1).some(has_newline); // TODO or length exceeds 80

		if (multiple_lines) {
			// need to handle args again. TODO find alternative approach?
			const args = node.arguments.map(arg => handle(arg, {
				...state,
				indent: `${state.indent}\t`
			}));

			chunks.push(
				c(`(\n${state.indent}\t`),
				...join(args, c(`,\n${state.indent}\t`)),
				c(`\n${state.indent})`)
			);
		} else {
			chunks.push(
				c('('),
				...join(args, c(', ')),
				c(')')
			);
		}

		return chunks;
	},

	MemberExpression(node, state) {
		const chunks = [];

		if (EXPRESSIONS_PRECEDENCE[node.object.type] < EXPRESSIONS_PRECEDENCE.MemberExpression) {
			chunks.push(
				c('('),
				...handle(node.object, state),
				c(')')
			);
		} else {
			chunks.push(...handle(node.object, state));
		}

		if (node.computed) {
			if (node.optional) {
				chunks.push(c('?.'));
			}
			chunks.push(
				c('['),
				...handle(node.property, state),
				c(']')
			);
		} else {
			chunks.push(
				c(node.optional ? '?.' : '.'),
				...handle(node.property, state)
			);
		}

		return chunks;
	},

	MetaProperty(node, state) {
		return [...handle(node.meta, state), c('.'), ...handle(node.property, state)];
	},

	Identifier(node, state) {
		let name = node.name;

		if (name[0] === '@') {
			name = state.getName(name.slice(1));
		} else if (node.name[0] === '#') {
			const owner = state.scope.find_owner(node.name);

			if (!owner) {
				throw new Error(`Could not find owner for node`);
			}

			if (!state.deconflicted.has(owner)) {
				state.deconflicted.set(owner, new Map());
			}

			const deconflict_map = state.deconflicted.get(owner);

			if (!deconflict_map.has(node.name)) {
				deconflict_map.set(node.name, deconflict(node.name.slice(1), owner.references));
			}

			name = deconflict_map.get(node.name);
		}

		return [c(name, node)];
	},

	Literal(node, state) {
		if (typeof node.value === 'string') {
			return [
				// TODO do we need to handle weird unicode characters somehow?
				// str.replace(/\\u(\d{4})/g, (m, n) => String.fromCharCode(+n))
				c(JSON.stringify(node.value).replace(re, (_m, _i, at, hash, name) => {
					if (at)	return '@' + name;
					if (hash) return '#' + name;
					throw new Error(`this shouldn't happen`);
				}), node)
			];
		}

		const { regex } = node ; // TODO is this right?
		if (regex) {
			return [c(`/${regex.pattern}/${regex.flags}`, node)];
		}

		return [c(String(node.value), node)];
	}
};

handlers.ForOfStatement = handlers.ForInStatement;
handlers.FunctionExpression = handlers.FunctionDeclaration;
handlers.ClassExpression = handlers.ClassDeclaration;
handlers.ClassBody = handlers.BlockStatement;
handlers.SpreadElement = handlers.RestElement;
handlers.ArrayPattern = handlers.ArrayExpression;
handlers.LogicalExpression = handlers.BinaryExpression;
handlers.AssignmentPattern = handlers.AssignmentExpression;

let btoa$1 = () => {
	throw new Error('Unsupported environment: `window.btoa` or `Buffer` should be supported.');
};
if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
	btoa$1 = (str) => window.btoa(unescape(encodeURIComponent(str)));
} else if (typeof Buffer === 'function') {
	btoa$1 = (str) => Buffer.from(str, 'utf-8').toString('base64');
}








function print(node, opts = {}) {
	if (Array.isArray(node)) {
		return print({
			type: 'Program',
			body: node
		} , opts);
	}

	const {
		getName = (x) => {
			throw new Error(`Unhandled sigil @${x}`);
		}
	} = opts;

	let { map: scope_map, scope } = analyze(node);
	const deconflicted = new WeakMap();

	const chunks = handle(node, {
		indent: '',
		getName,
		scope,
		scope_map,
		deconflicted,
		comments: []
	});

	

	let code = '';
	let mappings = [];
	let current_line = [];
	let current_column = 0;

	for (let i = 0; i < chunks.length; i += 1) {
		const chunk = chunks[i];

		code += chunk.content;

		if (chunk.loc) {
			current_line.push([
				current_column,
				0, // source index is always zero
				chunk.loc.start.line - 1,
				chunk.loc.start.column,
			]);
		}

		for (let i = 0; i < chunk.content.length; i += 1) {
			if (chunk.content[i] === '\n') {
				mappings.push(current_line);
				current_line = [];
				current_column = 0;
			} else {
				current_column += 1;
			}
		}

		if (chunk.loc) {
			current_line.push([
				current_column,
				0, // source index is always zero
				chunk.loc.end.line - 1,
				chunk.loc.end.column,
			]);
		}
	}

	mappings.push(current_line);

	const map = {
		version: 3,
		names: [] ,
		sources: [opts.sourceMapSource || null],
		sourcesContent: [opts.sourceMapContent || null],
		mappings: encode(mappings)
	};

	Object.defineProperties(map, {
		toString: {
			enumerable: false,
			value: function toString() {
				return JSON.stringify(this);
			}
		},
		toUrl: {
			enumerable: false,
			value: function toUrl() {
				return 'data:application/json;charset=utf-8;base64,' + btoa$1(this.toString());
			}
		}
	});

	return {
		code,
		map
	};
}

const sigils = {
	'@': 'AT',
	'#': 'HASH'
};

const join$1 = (strings) => {
	let str = strings[0];
	for (let i = 1; i < strings.length; i += 1) {
		str += `_${id}_${i - 1}_${strings[i]}`;
	}
	return str.replace(/([@#])(\w+)/g, (_m, sigil, name) => `_${id}_${sigils[sigil]}_${name}`);
};

const flatten_body = (array, target) => {
	for (let i = 0; i < array.length; i += 1) {
		const statement = array[i];
		if (Array.isArray(statement)) {
			flatten_body(statement, target);
			continue;
		}

		if (statement.type === 'ExpressionStatement') {
			if (statement.expression === EMPTY) continue;

			if (Array.isArray(statement.expression)) {
				// TODO this is hacktacular
				let node = statement.expression[0];
				while (Array.isArray(node)) node = node[0];
				if (node) node.leadingComments = statement.leadingComments;

				flatten_body(statement.expression, target);
				continue;
			}

			if (/(Expression|Literal)$/.test(statement.expression.type)) {
				target.push(statement);
				continue;
			}

			if (statement.leadingComments) statement.expression.leadingComments = statement.leadingComments;
			if (statement.trailingComments) statement.expression.trailingComments = statement.trailingComments;

			target.push(statement.expression);
			continue;
		}

		target.push(statement);
	}

	return target;
};

const flatten_properties = (array, target) => {
	for (let i = 0; i < array.length; i += 1) {
		const property = array[i];

		if (property.value === EMPTY) continue;

		if (property.key === property.value && Array.isArray(property.key)) {
			flatten_properties(property.key, target);
			continue;
		}

		target.push(property);
	}

	return target;
};

const flatten = (nodes, target) => {
	for (let i = 0; i < nodes.length; i += 1) {
		const node = nodes[i];

		if (node === EMPTY) continue;

		if (Array.isArray(node)) {
			flatten(node, target);
			continue;
		}

		target.push(node);
	}

	return target;
};

const EMPTY = { type: 'Empty' };

const acorn_opts = (comments, raw) => {
	const { onComment } = get_comment_handlers(comments, raw);
	return {
		ecmaVersion: 2020,
		sourceType: 'module',
		allowAwaitOutsideFunction: true,
		allowImportExportEverywhere: true,
		allowReturnOutsideFunction: true,
		onComment
	} ;
};

const inject = (raw, node, values, comments) => {
	comments.forEach(comment => {
		comment.value = comment.value.replace(re, (m, i) => +i in values ? values[+i] : m);
	});

	const { enter, leave } = get_comment_handlers(comments, raw);

	walk(node, {
		enter,

		leave(node, parent, key, index) {
			if (node.type === 'Identifier') {
				re.lastIndex = 0;
				const match = re.exec(node.name);

				if (match) {
					if (match[1]) {
						if (+match[1] in values) {
							let value = values[+match[1]];

							if (typeof value === 'string') {
								value = { type: 'Identifier', name: value, leadingComments: node.leadingComments, trailingComments: node.trailingComments };
							} else if (typeof value === 'number') {
								value = { type: 'Literal', value, leadingComments: node.leadingComments, trailingComments: node.trailingComments };
							}

							this.replace(value || EMPTY);
						}
					} else {
						node.name = `${match[2] ? `@` : `#`}${match[4]}`;
					}
				}
			}

			if (node.type === 'Literal') {
				if (typeof node.value === 'string') {
					re.lastIndex = 0;
					node.value = node.value.replace(re, (m, i) => +i in values ? values[+i] : m);
				}
			}

			if (node.type === 'TemplateElement') {
				re.lastIndex = 0;
				node.value.raw = (node.value.raw ).replace(re, (m, i) => +i in values ? values[+i] : m);
			}

			if (node.type === 'Program' || node.type === 'BlockStatement') {
				node.body = flatten_body(node.body, []);
			}

			if (node.type === 'ObjectExpression' || node.type === 'ObjectPattern') {
				node.properties = flatten_properties(node.properties, []);
			}

			if (node.type === 'ArrayExpression' || node.type === 'ArrayPattern') {
				node.elements = flatten(node.elements, []);
			}

			if (node.type === 'FunctionExpression' || node.type === 'FunctionDeclaration' || node.type === 'ArrowFunctionExpression') {
				node.params = flatten(node.params, []);
			}

			if (node.type === 'CallExpression' || node.type === 'NewExpression') {
				node.arguments = flatten(node.arguments, []);
			}

			if (node.type === 'ImportDeclaration' || node.type === 'ExportNamedDeclaration') {
				node.specifiers = flatten(node.specifiers, []);
			}

			if (node.type === 'ForStatement') {
				node.init = node.init === EMPTY ? null : node.init;
				node.test = node.test === EMPTY ? null : node.test;
				node.update = node.update === EMPTY ? null : node.update;
			}

			leave(node);
		}
	});
};

function b(strings, ...values) {
	const str = join$1(strings);
	const comments = [];

	try {
		const ast = parse$3(str,  acorn_opts(comments, str));

		inject(str, ast, values, comments);

		return ast.body;
	} catch (err) {
		handle_error(str, err);
	}
}

function x(strings, ...values) {
	const str = join$1(strings);
	const comments = [];

	try {
		const expression = parseExpressionAt(str, 0, acorn_opts(comments, str)) ;
		const match = /\S+/.exec(str.slice((expression ).end));
		if (match) {
			throw new Error(`Unexpected token '${match[0]}'`);
		}

		inject(str, expression, values, comments);

		return expression;
	} catch (err) {
		handle_error(str, err);
	}
}

function p(strings, ...values) {
	const str = `{${join$1(strings)}}`;
	const comments = [];

	try {
		const expression = parseExpressionAt(str, 0, acorn_opts(comments, str)) ;

		inject(str, expression, values, comments);

		return expression.properties[0];
	} catch (err) {
		handle_error(str, err);
	}
}

function handle_error(str, err) {
	// TODO location/code frame

	re.lastIndex = 0;

	str = str.replace(re, (m, i, at, hash, name) => {
		if (at) return `@${name}`;
		if (hash) return `#${name}`;

		return '${...}';
	});

	console.log(`failed to parse:\n${str}`);
	throw err;
}

function is_head(node) {
	return node && node.type === 'MemberExpression' && node.object.name === '@_document' && node.property.name === 'head';
}

class Block {
	
	
	
	
	

	

	
	

	__init() {this.dependencies = new Set();}

	
	__init2() {this.binding_group_initialised = new Set();}

	















	__init3() {this.event_listeners = [];}

	
	
	
	
	 // could have the method without the transition, due to siblings
	
	

	
	__init4() {this.variables = new Map();}
	

	__init5() {this.has_update_method = false;}
	

	constructor(options) {Block.prototype.__init.call(this);Block.prototype.__init2.call(this);Block.prototype.__init3.call(this);Block.prototype.__init4.call(this);Block.prototype.__init5.call(this);
		this.parent = options.parent;
		this.renderer = options.renderer;
		this.name = options.name;
		this.type = options.type;
		this.comment = options.comment;

		this.wrappers = [];

		// for keyed each blocks
		this.key = options.key;
		this.first = null;

		this.bindings = options.bindings;

		this.chunks = {
			declarations: [],
			init: [],
			create: [],
			claim: [],
			hydrate: [],
			mount: [],
			measure: [],
			fix: [],
			animate: [],
			intro: [],
			update: [],
			outro: [],
			destroy: []
		};

		this.has_animation = false;
		this.has_intro_method = false; // a block could have an intro method but not intro transitions, e.g. if a sibling block has intros
		this.has_outro_method = false;
		this.outros = 0;

		this.get_unique_name = this.renderer.component.get_unique_name_maker();

		this.aliases = new Map();
		if (this.key) this.aliases.set('key', this.get_unique_name('key'));
	}

	assign_variable_names() {
		const seen = new Set();
		const dupes = new Set();

		let i = this.wrappers.length;

		while (i--) {
			const wrapper = this.wrappers[i];

			if (!wrapper.var) continue;

			if (seen.has(wrapper.var.name)) {
				dupes.add(wrapper.var.name);
			}

			seen.add(wrapper.var.name);
		}

		const counts = new Map();
		i = this.wrappers.length;

		while (i--) {
			const wrapper = this.wrappers[i];

			if (!wrapper.var) continue;

			let suffix = '';
			if (dupes.has(wrapper.var.name)) {
				const i = counts.get(wrapper.var.name) || 0;
				counts.set(wrapper.var.name, i + 1);
				suffix = i;
			}
			wrapper.var.name = this.get_unique_name(wrapper.var.name + suffix).name;
		}
	}

	add_dependencies(dependencies) {
		dependencies.forEach(dependency => {
			this.dependencies.add(dependency);
		});

		this.has_update_method = true;
		if (this.parent) {
			this.parent.add_dependencies(dependencies);
		}
	}

	add_element(
		id,
		render_statement,
		claim_statement,
		parent_node,
		no_detach
	) {
		this.add_variable(id);
		this.chunks.create.push(b`${id} = ${render_statement};`);

		if (this.renderer.options.hydratable) {
			this.chunks.claim.push(b`${id} = ${claim_statement || render_statement};`);
		}

		if (parent_node) {
			this.chunks.mount.push(b`@append(${parent_node}, ${id});`);
			if (is_head(parent_node) && !no_detach) this.chunks.destroy.push(b`@detach(${id});`);
		} else {
			this.chunks.mount.push(b`@insert(#target, ${id}, #anchor);`);
			if (!no_detach) this.chunks.destroy.push(b`if (detaching) @detach(${id});`);
		}
	}

	add_intro(local) {
		this.has_intros = this.has_intro_method = true;
		if (!local && this.parent) this.parent.add_intro();
	}

	add_outro(local) {
		this.has_outros = this.has_outro_method = true;
		this.outros += 1;
		if (!local && this.parent) this.parent.add_outro();
	}

	add_animation() {
		this.has_animation = true;
	}

	add_variable(id, init) {
		if (this.variables.has(id.name)) {
			throw new Error(
				`Variable '${id.name}' already initialised with a different value`
			);
		}

		this.variables.set(id.name, { id, init });
	}

	alias(name) {
		if (!this.aliases.has(name)) {
			this.aliases.set(name, this.get_unique_name(name));
		}

		return this.aliases.get(name);
	}

	child(options) {
		return new Block(Object.assign({}, this, { key: null }, options, { parent: this }));
	}

	get_contents(key) {
		const { dev } = this.renderer.options;

		if (this.has_outros) {
			this.add_variable({ type: 'Identifier', name: '#current' });

			if (this.chunks.intro.length > 0) {
				this.chunks.intro.push(b`#current = true;`);
				this.chunks.mount.push(b`#current = true;`);
			}

			if (this.chunks.outro.length > 0) {
				this.chunks.outro.push(b`#current = false;`);
			}
		}

		if (this.autofocus) {
			this.chunks.mount.push(b`${this.autofocus}.focus();`);
		}

		this.render_listeners();

		const properties = {};

		const noop = x`@noop`;

		properties.key = key;

		if (this.first) {
			properties.first = x`null`;
			this.chunks.hydrate.push(b`this.first = ${this.first};`);
		}

		if (this.chunks.create.length === 0 && this.chunks.hydrate.length === 0) {
			properties.create = noop;
		} else {
			const hydrate = this.chunks.hydrate.length > 0 && (
				this.renderer.options.hydratable
					? b`this.h();`
					: this.chunks.hydrate
			);

			properties.create = x`function #create() {
				${this.chunks.create}
				${hydrate}
			}`;
		}

		if (this.renderer.options.hydratable || this.chunks.claim.length > 0) {
			if (this.chunks.claim.length === 0 && this.chunks.hydrate.length === 0) {
				properties.claim = noop;
			} else {
				properties.claim = x`function #claim(#nodes) {
					${this.chunks.claim}
					${this.renderer.options.hydratable && this.chunks.hydrate.length > 0 && b`this.h();`}
				}`;
			}
		}

		if (this.renderer.options.hydratable && this.chunks.hydrate.length > 0) {
			properties.hydrate = x`function #hydrate() {
				${this.chunks.hydrate}
			}`;
		}

		if (this.chunks.mount.length === 0) {
			properties.mount = noop;
		} else if (this.event_listeners.length === 0) {
			properties.mount = x`function #mount(#target, #anchor) {
				${this.chunks.mount}
			}`;
		} else {
			properties.mount = x`function #mount(#target, #anchor) {
				${this.chunks.mount}
			}`;
		}

		if (this.has_update_method || this.maintain_context) {
			if (this.chunks.update.length === 0 && !this.maintain_context) {
				properties.update = noop;
			} else {
				const ctx = this.maintain_context ? x`#new_ctx` : x`#ctx`;

				let dirty = { type: 'Identifier', name: '#dirty' };
				if (!this.renderer.context_overflow && !this.parent) {
					dirty = { type: 'ArrayPattern', elements: [dirty] };
				}

				properties.update = x`function #update(${ctx}, ${dirty}) {
					${this.maintain_context && b`#ctx = ${ctx};`}
					${this.chunks.update}
				}`;
			}
		}

		if (this.has_animation) {
			properties.measure = x`function #measure() {
				${this.chunks.measure}
			}`;

			properties.fix = x`function #fix() {
				${this.chunks.fix}
			}`;

			properties.animate = x`function #animate() {
				${this.chunks.animate}
			}`;
		}

		if (this.has_intro_method || this.has_outro_method) {
			if (this.chunks.intro.length === 0) {
				properties.intro = noop;
			} else {
				properties.intro = x`function #intro(#local) {
					${this.has_outros && b`if (#current) return;`}
					${this.chunks.intro}
				}`;
			}

			if (this.chunks.outro.length === 0) {
				properties.outro = noop;
			} else {
				properties.outro = x`function #outro(#local) {
					${this.chunks.outro}
				}`;
			}
		}

		if (this.chunks.destroy.length === 0) {
			properties.destroy = noop;
		} else {
			properties.destroy = x`function #destroy(detaching) {
				${this.chunks.destroy}
			}`;
		}

		if (!this.renderer.component.compile_options.dev) {
			// allow shorthand names
			for (const name in properties) {
				const property = properties[name];
				if (property) property.id = null;
			}
		}

		const return_value = x`{
			key: ${properties.key},
			first: ${properties.first},
			c: ${properties.create},
			l: ${properties.claim},
			h: ${properties.hydrate},
			m: ${properties.mount},
			p: ${properties.update},
			r: ${properties.measure},
			f: ${properties.fix},
			a: ${properties.animate},
			i: ${properties.intro},
			o: ${properties.outro},
			d: ${properties.destroy}
		}`;

		const block = dev && this.get_unique_name('block');

		const body = b`
			${this.chunks.declarations}

			${Array.from(this.variables.values()).map(({ id, init }) => {
				return init
					? b`let ${id} = ${init}`
					: b`let ${id}`;
			})}

			${this.chunks.init}

			${dev
				? b`
					const ${block} = ${return_value};
					@dispatch_dev("SvelteRegisterBlock", {
						block: ${block},
						id: ${this.name || 'create_fragment'}.name,
						type: "${this.type}",
						source: "${this.comment ? this.comment.replace(/"/g, '\\"') : ''}",
						ctx: #ctx
					});
					return ${block};`
				: b`
					return ${return_value};`
			}
		`;

		return body;
	}

	has_content() {
		return !!this.first ||
			this.event_listeners.length > 0 ||
			this.chunks.intro.length > 0 ||
			this.chunks.outro.length > 0  ||
			this.chunks.create.length > 0 ||
			this.chunks.hydrate.length > 0 ||
			this.chunks.claim.length > 0 ||
			this.chunks.mount.length > 0 ||
			this.chunks.update.length > 0 ||
			this.chunks.destroy.length > 0 ||
			this.has_animation;
	}

	render() {
		const key = this.key && this.get_unique_name('key');

		const args = [x`#ctx`];
		if (key) args.unshift(key);

		const fn = b`function ${this.name}(${args}) {
			${this.get_contents(key)}
		}`;

		return this.comment
			? b`
				// ${this.comment}
				${fn}`
			: fn;
	}

	render_listeners(chunk = '') {
		if (this.event_listeners.length > 0) {
			this.add_variable({ type: 'Identifier', name: '#mounted' });
			this.chunks.destroy.push(b`#mounted = false`);

			const dispose = {
				type: 'Identifier',
				name: `#dispose${chunk}`
			};

			this.add_variable(dispose);

			if (this.event_listeners.length === 1) {
				this.chunks.mount.push(
					b`
						if (!#mounted) {
							${dispose} = ${this.event_listeners[0]};
							#mounted = true;
						}
					`
				);

				this.chunks.destroy.push(
					b`${dispose}();`
				);
			} else {
				this.chunks.mount.push(b`
					if (!#mounted) {
						${dispose} = [
							${this.event_listeners}
						];
						#mounted = true;
					}
				`);

				this.chunks.destroy.push(
					b`@run_all(${dispose});`
				);
			}
		}
	}
}

class Wrapper {
	
	
	

	
	

	
	
	

	constructor(
		renderer,
		block,
		parent,
		node
	) {
		this.node = node;

		// make these non-enumerable so that they can be logged sensibly
		// (TODO in dev only?)
		Object.defineProperties(this, {
			renderer: {
				value: renderer
			},
			parent: {
				value: parent
			}
		});

		this.can_use_innerhtml = !renderer.options.hydratable;
		this.is_static_content = !renderer.options.hydratable;

		block.wrappers.push(this);
	}

	cannot_use_innerhtml() {
		this.can_use_innerhtml = false;
		if (this.parent) this.parent.cannot_use_innerhtml();
	}

	not_static_content() {
		this.is_static_content = false;
		if (this.parent) this.parent.not_static_content();
	}

	get_or_create_anchor(block, parent_node, parent_nodes) {
		// TODO use this in EachBlock and IfBlock — tricky because
		// children need to be created first
		const needs_anchor = this.next ? !this.next.is_dom_node() : !parent_node || !this.parent.is_dom_node();
		const anchor = needs_anchor
			? block.get_unique_name(`${this.var.name}_anchor`)
			: (this.next && this.next.var) || { type: 'Identifier', name: 'null' };

		if (needs_anchor) {
			block.add_element(
				anchor,
				x`@empty()`,
				parent_nodes && x`@empty()`,
				parent_node 
			);
		}

		return anchor;
	}

	get_update_mount_node(anchor) {
		return ((this.parent && this.parent.is_dom_node())
			? this.parent.var
			: x`${anchor}.parentNode`) ;
	}

	is_dom_node() {
		return (
			this.node.type === 'Element' ||
			this.node.type === 'Text' ||
			this.node.type === 'MustacheTag'
		);
	}

	render(_block, _parent_node, _parent_nodes) {
		throw Error('Wrapper class is not renderable');
	}
}

function create_debugging_comment(
	node,
	component
) {
	const { locate, source } = component;

	let c = node.start;
	if (node.type === 'ElseBlock') {
		while (source[c - 1] !== '{') c -= 1;
		while (source[c - 1] === '{') c -= 1;
	}

	let d;

	if (node.type === 'InlineComponent' || node.type === 'Element' || node.type === 'SlotTemplate') {
		if (node.children.length) {
			d = node.children[0].start;
			while (source[d - 1] !== '>') d -= 1;
		} else {
			d = node.start;
			while (source[d] !== '>') d += 1;
			d += 1;
		}
	} else if (node.type === 'Text' || node.type === 'Comment') {
		d = node.end;
	} else {
		// @ts-ignore
		d = node.expression ? node.expression.node.end : c;
		while (source[d] !== '}' && d <= source.length) d += 1;
		while (source[d] === '}') d += 1;
	}

	const start = locate(c);
	const loc = `(${start.line}:${start.column})`;

	return `${loc} ${source.slice(c, d)}`.replace(/\s/g, ' ');
}

class AwaitBlockBranch extends Wrapper {
	
	
	
	
	

	__init() {this.var = null;}
	

	
	
	
	

	constructor(
		status,
		renderer,
		block,
		parent,
		node,
		strip_whitespace,
		next_sibling
	) {
		super(renderer, block, parent, node);AwaitBlockBranch.prototype.__init.call(this);		this.status = status;

		this.block = block.child({
			comment: create_debugging_comment(node, this.renderer.component),
			name: this.renderer.component.get_unique_name(`create_${status}_block`),
			type: status
		});

		this.add_context(parent.node[status + '_node'], parent.node[status + '_contexts']);

		this.fragment = new FragmentWrapper(
			renderer,
			this.block,
			this.node.children,
			parent,
			strip_whitespace,
			next_sibling
		);

		this.is_dynamic = this.block.dependencies.size > 0;
	}

	add_context(node, contexts) {
		if (!node) return;

		if (node.type === 'Identifier') {
			this.value = node.name;
			this.renderer.add_to_context(this.value, true);
		} else {
			contexts.forEach(context => {
				this.renderer.add_to_context(context.key.name, true);
			});
			this.value = this.block.parent.get_unique_name('value').name;
			this.value_contexts = contexts;
			this.renderer.add_to_context(this.value, true);
			this.is_destructured = true;
		}
		this.value_index = this.renderer.context_lookup.get(this.value).index;
	}

	render(block, parent_node, parent_nodes) {
		this.fragment.render(block, parent_node, parent_nodes);

		if (this.is_destructured) {
			this.render_destructure();
		}
	}

	render_destructure() {
		const props = this.value_contexts.map(prop => b`#ctx[${this.block.renderer.context_lookup.get(prop.key.name).index}] = ${prop.default_modifier(prop.modifier(x`#ctx[${this.value_index}]`), name => this.renderer.reference(name))};`);
		const get_context = this.block.renderer.component.get_unique_name(`get_${this.status}_context`);
		this.block.renderer.blocks.push(b`
			function ${get_context}(#ctx) {
				${props}
			}
		`);
		this.block.chunks.declarations.push(b`${get_context}(#ctx)`);
		if (this.block.has_update_method) {
			this.block.chunks.update.unshift(b`${get_context}(#ctx)`);
		}
	}
}

class AwaitBlockWrapper extends Wrapper {
	

	
	
	

	__init2() {this.var = { type: 'Identifier', name: 'await_block' };}

	constructor(
		renderer,
		block,
		parent,
		node,
		strip_whitespace,
		next_sibling
	) {
		super(renderer, block, parent, node);AwaitBlockWrapper.prototype.__init2.call(this);
		this.cannot_use_innerhtml();
		this.not_static_content();

		block.add_dependencies(this.node.expression.dependencies);

		let is_dynamic = false;
		let has_intros = false;
		let has_outros = false;

		['pending', 'then', 'catch'].forEach((status) => {
			const child = this.node[status];

			const branch = new AwaitBlockBranch(
				status,
				renderer,
				block,
				this,
				child,
				strip_whitespace,
				next_sibling
			);

			renderer.blocks.push(branch.block);

			if (branch.is_dynamic) {
				is_dynamic = true;
				// TODO should blocks update their own parents?
				block.add_dependencies(branch.block.dependencies);
			}

			if (branch.block.has_intros) has_intros = true;
			if (branch.block.has_outros) has_outros = true;

			this[status] = branch;
		});

		['pending', 'then', 'catch'].forEach(status => {
			this[status].block.has_update_method = is_dynamic;
			this[status].block.has_intro_method = has_intros;
			this[status].block.has_outro_method = has_outros;
		});

		if (has_outros) {
			block.add_outro();
		}
	}

	render(
		block,
		parent_node,
		parent_nodes
	) {
		const anchor = this.get_or_create_anchor(block, parent_node, parent_nodes);
		const update_mount_node = this.get_update_mount_node(anchor);

		const snippet = this.node.expression.manipulate(block);

		const info = block.get_unique_name('info');
		const promise = block.get_unique_name('promise');

		block.add_variable(promise);

		block.maintain_context = true;

		const info_props = x`{
			ctx: #ctx,
			current: null,
			token: null,
			hasCatch: ${this.catch.node.start !== null ? 'true' : 'false'},
			pending: ${this.pending.block.name},
			then: ${this.then.block.name},
			catch: ${this.catch.block.name},
			value: ${this.then.value_index},
			error: ${this.catch.value_index},
			blocks: ${this.pending.block.has_outro_method && x`[,,,]`}
		}`;

		block.chunks.init.push(b`
			let ${info} = ${info_props};
		`);

		block.chunks.init.push(b`
			@handle_promise(${promise} = ${snippet}, ${info});
		`);

		block.chunks.create.push(b`
			${info}.block.c();
		`);

		if (parent_nodes && this.renderer.options.hydratable) {
			block.chunks.claim.push(b`
				${info}.block.l(${parent_nodes});
			`);
		}

		const initial_mount_node = parent_node || '#target';
		const anchor_node = parent_node ? 'null' : '#anchor';

		const has_transitions = this.pending.block.has_intro_method || this.pending.block.has_outro_method;

		block.chunks.mount.push(b`
			${info}.block.m(${initial_mount_node}, ${info}.anchor = ${anchor_node});
			${info}.mount = () => ${update_mount_node};
			${info}.anchor = ${anchor};
		`);

		if (has_transitions) {
			block.chunks.intro.push(b`@transition_in(${info}.block);`);
		}

		const dependencies = this.node.expression.dynamic_dependencies();

		let update_child_context;
		if (this.then.value && this.catch.value) {
			update_child_context = b`#child_ctx[${this.then.value_index}] = #child_ctx[${this.catch.value_index}] = ${info}.resolved;`;
		} else if (this.then.value) {
			update_child_context = b`#child_ctx[${this.then.value_index}] = ${info}.resolved;`;
		} else if (this.catch.value) {
			update_child_context = b`#child_ctx[${this.catch.value_index}] = ${info}.resolved;`;
		}

		if (dependencies.length > 0) {
			const condition = x`
				${block.renderer.dirty(dependencies)} &&
				${promise} !== (${promise} = ${snippet}) &&
				@handle_promise(${promise}, ${info})`;

			block.chunks.update.push(
				b`${info}.ctx = #ctx;`
			);

			if (this.pending.block.has_update_method) {
				block.chunks.update.push(b`
					if (${condition}) {

					} else {
						const #child_ctx = #ctx.slice();
						${update_child_context}
						${info}.block.p(#child_ctx, #dirty);
					}
				`);
			} else {
				block.chunks.update.push(b`
					${condition}
				`);
			}
		} else {
			if (this.pending.block.has_update_method) {
				block.chunks.update.push(b`
					{
						const #child_ctx = #ctx.slice();
						${update_child_context}
						${info}.block.p(#child_ctx, #dirty);
					}
				`);
			}
		}

		if (this.pending.block.has_outro_method) {
			block.chunks.outro.push(b`
				for (let #i = 0; #i < 3; #i += 1) {
					const block = ${info}.blocks[#i];
					@transition_out(block);
				}
			`);
		}

		block.chunks.destroy.push(b`
			${info}.block.d(${parent_node ? null : 'detaching'});
			${info}.token = null;
			${info} = null;
		`);

		[this.pending, this.then, this.catch].forEach(branch => {
			branch.render(branch.block, null, x`#nodes` );
		});
	}
}

const TRUE = x`true`;
const FALSE = x`false`;

class EventHandlerWrapper {
	
	

	constructor(node, parent) {
		this.node = node;
		this.parent = parent;

		if (!node.expression) {
			this.parent.renderer.add_to_context(node.handler_name.name);

			this.parent.renderer.component.partly_hoisted.push(b`
				function ${node.handler_name.name}(event) {
					@bubble($$self, event);
				}
			`);
		}
	}

	get_snippet(block) {
		const snippet = this.node.expression ? this.node.expression.manipulate(block) : block.renderer.reference(this.node.handler_name);

		if (this.node.reassigned) {
			block.maintain_context = true;
			return x`function () { if (@is_function(${snippet})) ${snippet}.apply(this, arguments); }`;
		}
		return snippet;
	}

	render(block, target) {
		let snippet = this.get_snippet(block);

		if (this.node.modifiers.has('preventDefault')) snippet = x`@prevent_default(${snippet})`;
		if (this.node.modifiers.has('stopPropagation')) snippet = x`@stop_propagation(${snippet})`;
		if (this.node.modifiers.has('self')) snippet = x`@self(${snippet})`;

		const args = [];

		const opts = ['nonpassive', 'passive', 'once', 'capture'].filter(mod => this.node.modifiers.has(mod));
		if (opts.length) {
			if (opts.length === 1 && opts[0] === 'capture') {
				args.push(TRUE);
			} else {
				args.push(x`{ ${ opts.map(opt =>
					opt === 'nonpassive'
						? p`passive: false`
						: p`${opt}: true`
				) } }`);
			}
		} else if (block.renderer.options.dev) {
			args.push(FALSE);
		}

		if (block.renderer.options.dev) {
			args.push(this.node.modifiers.has('preventDefault') ? TRUE : FALSE);
			args.push(this.node.modifiers.has('stopPropagation') ? TRUE : FALSE);
		}

		block.event_listeners.push(
			x`@listen(${target}, "${this.node.name}", ${snippet}, ${args})`
		);
	}
}

function add_event_handlers(
	block,
	target,
	handlers
) {
	handlers.forEach(handler => add_event_handler(block, target, handler));
}

function add_event_handler(
	block,
	target,
	handler
) {
	handler.render(block, target);
}

class BodyWrapper extends Wrapper {
	
	

	constructor(renderer, block, parent, node) {
		super(renderer, block, parent, node);
		this.handlers = this.node.handlers.map(handler => new EventHandlerWrapper(handler, this));
	}

	render(block, _parent_node, _parent_nodes) {
		add_event_handlers(block, x`@_document.body`, this.handlers);
	}
}

function add_to_set(a, b) {
	// @ts-ignore
	b.forEach(item => {
		a.add(item);
	});
}

class DebugTagWrapper extends Wrapper {
	

	constructor(
		renderer,
		block,
		parent,
		node,
		_strip_whitespace,
		_next_sibling
	) {
		super(renderer, block, parent, node);
	}

	render(block, _parent_node, _parent_nodes) {
		const { renderer } = this;
		const { component } = renderer;

		if (!renderer.options.dev) return;

		const { var_lookup } = component;

		const start = component.locate(this.node.start + 1);
		const end = { line: start.line, column: start.column + 6 };

		const loc = { start, end };

		const debug = {
			type: 'DebuggerStatement',
			loc
		};

		if (this.node.expressions.length === 0) {
			// Debug all
			block.chunks.create.push(debug);
			block.chunks.update.push(debug);
		} else {
			const log = {
				type: 'Identifier',
				name: 'log',
				loc
			};

			const dependencies = new Set();
			this.node.expressions.forEach(expression => {
				add_to_set(dependencies, expression.dependencies);
			});

			const contextual_identifiers = this.node.expressions
				.filter(e => {
					const variable = var_lookup.get((e.node ).name);
					return !(variable && variable.hoistable);
				})
				.map(e => (e.node ).name);

			const logged_identifiers = this.node.expressions.map(e => p`${(e.node ).name}`);

			const debug_statements = b`
				${contextual_identifiers.map(name => b`const ${name} = ${renderer.reference(name)};`)}
				@_console.${log}({ ${logged_identifiers} });
				debugger;`;

			if (dependencies.size) {
				const condition = renderer.dirty(Array.from(dependencies));

				block.chunks.update.push(b`
					if (${condition}) {
						${debug_statements}
					}
				`);
			}

			block.chunks.create.push(b`{
				${debug_statements}
			}`);
		}
	}
}

function get_object(node) {
	while (node.type === 'MemberExpression') node = node.object;
	return node ;
}

class ElseBlockWrapper extends Wrapper {
	
	
	
	

	__init() {this.var = null;}

	constructor(
		renderer,
		block,
		parent,
		node,
		strip_whitespace,
		next_sibling
	) {
		super(renderer, block, parent, node);ElseBlockWrapper.prototype.__init.call(this);
		this.block = block.child({
			comment: create_debugging_comment(node, this.renderer.component),
			name: this.renderer.component.get_unique_name('create_else_block'),
			type: 'else'
		});

		this.fragment = new FragmentWrapper(
			renderer,
			this.block,
			this.node.children,
			parent,
			strip_whitespace,
			next_sibling
		);

		this.is_dynamic = this.block.dependencies.size > 0;
	}
}

class EachBlockWrapper extends Wrapper {
	
	
	
	
	









	
	
	__init2() {this.updates = [];}
	

	__init3() {this.var = { type: 'Identifier', name: 'each' };}

	constructor(
		renderer,
		block,
		parent,
		node,
		strip_whitespace,
		next_sibling
	) {
		super(renderer, block, parent, node);EachBlockWrapper.prototype.__init2.call(this);EachBlockWrapper.prototype.__init3.call(this);		this.cannot_use_innerhtml();
		this.not_static_content();

		const { dependencies } = node.expression;
		block.add_dependencies(dependencies);

		this.node.contexts.forEach(context => {
			renderer.add_to_context(context.key.name, true);
		});

		this.block = block.child({
			comment: create_debugging_comment(this.node, this.renderer.component),
			name: renderer.component.get_unique_name('create_each_block'),
			type: 'each',
			// @ts-ignore todo: probably error
			key: node.key ,

			bindings: new Map(block.bindings)
		});

		// TODO this seems messy
		this.block.has_animation = this.node.has_animation;

		this.index_name = this.node.index
			? { type: 'Identifier', name: this.node.index }
			: renderer.component.get_unique_name(`${this.node.context}_index`);

		const fixed_length =
			node.expression.node.type === 'ArrayExpression' &&
			node.expression.node.elements.every(element => element.type !== 'SpreadElement')
				? node.expression.node.elements.length
				: null;

		// hack the sourcemap, so that if data is missing the bug
		// is easy to find
		let c = this.node.start + 2;
		while (renderer.component.source[c] !== 'e') c += 1;
		const start = renderer.component.locate(c);
		const end = { line: start.line, column: start.column + 4 };
		const length = {
			type: 'Identifier',
			name: 'length',
			loc: { start, end }
		};

		const each_block_value = renderer.component.get_unique_name(`${this.var.name}_value`);
		const iterations = block.get_unique_name(`${this.var.name}_blocks`);

		renderer.add_to_context(each_block_value.name, true);
		renderer.add_to_context(this.index_name.name, true);

		this.vars = {
			create_each_block: this.block.name,
			each_block_value,
			get_each_context: renderer.component.get_unique_name(`get_${this.var.name}_context`),
			iterations,

			// optimisation for array literal
			fixed_length,
			data_length: fixed_length === null ? x`${each_block_value}.${length}` : fixed_length,
			view_length: fixed_length === null ? x`${iterations}.length` : fixed_length
		};

		const object = get_object(node.expression.node);
		const store = object.type === 'Identifier' && object.name[0] === '$' ? object.name.slice(1) : null;

		node.contexts.forEach(prop => {
			this.block.bindings.set(prop.key.name, {
				object: this.vars.each_block_value,
				property: this.index_name,
				modifier: prop.modifier,
				snippet: prop.modifier(x`${this.vars.each_block_value}[${this.index_name}]` ),
				store
			});
		});

		if (this.node.index) {
			this.block.get_unique_name(this.node.index); // this prevents name collisions (#1254)
		}

		renderer.blocks.push(this.block);

		this.fragment = new FragmentWrapper(renderer, this.block, node.children, this, strip_whitespace, next_sibling);

		if (this.node.else) {
			this.else = new ElseBlockWrapper(
				renderer,
				block,
				this,
				this.node.else,
				strip_whitespace,
				next_sibling
			);

			renderer.blocks.push(this.else.block);

			if (this.else.is_dynamic) {
				this.block.add_dependencies(this.else.block.dependencies);
			}
		}

		block.add_dependencies(this.block.dependencies);

		if (this.block.has_outros || (this.else && this.else.block.has_outros)) {
			block.add_outro();
		}
	}

	render(block, parent_node, parent_nodes) {
		if (this.fragment.nodes.length === 0) return;

		const { renderer } = this;
		const { component } = renderer;

		const needs_anchor = this.next
			? !this.next.is_dom_node() :
			!parent_node || !this.parent.is_dom_node();

		const snippet = this.node.expression.manipulate(block);

		block.chunks.init.push(b`let ${this.vars.each_block_value} = ${snippet};`);
		if (this.renderer.options.dev) {
			block.chunks.init.push(b`@validate_each_argument(${this.vars.each_block_value});`);
		}

		const initial_anchor_node = { type: 'Identifier', name: parent_node ? 'null' : '#anchor' };
		const initial_mount_node = parent_node || { type: 'Identifier', name: '#target' };
		const update_anchor_node = needs_anchor
			? block.get_unique_name(`${this.var.name}_anchor`)
			: (this.next && this.next.var) || { type: 'Identifier', name: 'null' };
		const update_mount_node = this.get_update_mount_node((update_anchor_node ));

		const args = {
			block,
			parent_node,
			parent_nodes,
			snippet,
			initial_anchor_node,
			initial_mount_node,
			update_anchor_node,
			update_mount_node
		};

		const all_dependencies = new Set(this.block.dependencies); // TODO should be dynamic deps only
		this.node.expression.dynamic_dependencies().forEach((dependency) => {
			all_dependencies.add(dependency);
		});
		if (this.node.key) {
			this.node.key.dynamic_dependencies().forEach((dependency) => {
				all_dependencies.add(dependency);
			});
		}
		this.dependencies = all_dependencies;

		if (this.node.key) {
			this.render_keyed(args);
		} else {
			this.render_unkeyed(args);
		}

		if (this.block.has_intro_method || this.block.has_outro_method) {
			block.chunks.intro.push(b`
				for (let #i = 0; #i < ${this.vars.data_length}; #i += 1) {
					@transition_in(${this.vars.iterations}[#i]);
				}
			`);
		}

		if (needs_anchor) {
			block.add_element(
				update_anchor_node ,
				x`@empty()`,
				parent_nodes && x`@empty()`,
				parent_node
			);
		}

		if (this.else) {
			const each_block_else = component.get_unique_name(`${this.var.name}_else`);

			block.chunks.init.push(b`let ${each_block_else} = null;`);

			// TODO neaten this up... will end up with an empty line in the block
			block.chunks.init.push(b`
				if (!${this.vars.data_length}) {
					${each_block_else} = ${this.else.block.name}(#ctx);
				}
			`);

			block.chunks.create.push(b`
				if (${each_block_else}) {
					${each_block_else}.c();
				}
			`);

			if (this.renderer.options.hydratable) {
				block.chunks.claim.push(b`
					if (${each_block_else}) {
						${each_block_else}.l(${parent_nodes});
					}
				`);
			}

			block.chunks.mount.push(b`
				if (${each_block_else}) {
					${each_block_else}.m(${initial_mount_node}, ${initial_anchor_node});
				}
			`);

			const has_transitions = !!(this.else.block.has_intro_method || this.else.block.has_outro_method);

			const destroy_block_else = this.else.block.has_outro_method
				? b`
					@group_outros();
					@transition_out(${each_block_else}, 1, 1, () => {
						${each_block_else} = null;
					});
					@check_outros();`
				: b`
					${each_block_else}.d(1);
					${each_block_else} = null;`;

			if (this.else.block.has_update_method) {
				this.updates.push(b`
					if (!${this.vars.data_length} && ${each_block_else}) {
						${each_block_else}.p(#ctx, #dirty);
					} else if (!${this.vars.data_length}) {
						${each_block_else} = ${this.else.block.name}(#ctx);
						${each_block_else}.c();
						${has_transitions && b`@transition_in(${each_block_else}, 1);`}
						${each_block_else}.m(${update_mount_node}, ${update_anchor_node});
					} else if (${each_block_else}) {
						${destroy_block_else};
					}
				`);
			} else {
				this.updates.push(b`
					if (${this.vars.data_length}) {
						if (${each_block_else}) {
							${destroy_block_else};
						}
					} else if (!${each_block_else}) {
						${each_block_else} = ${this.else.block.name}(#ctx);
						${each_block_else}.c();
						${has_transitions && b`@transition_in(${each_block_else}, 1);`}
						${each_block_else}.m(${update_mount_node}, ${update_anchor_node});
					}
				`);
			}

			block.chunks.destroy.push(b`
				if (${each_block_else}) ${each_block_else}.d(${parent_node ? '' : 'detaching'});
			`);
		}

		if (this.updates.length) {
			block.chunks.update.push(b`
				if (${block.renderer.dirty(Array.from(all_dependencies))}) {
					${this.updates}
				}
			`);
		}

		this.fragment.render(this.block, null, x`#nodes` );

		if (this.else) {
			this.else.fragment.render(this.else.block, null, x`#nodes` );
		}

		this.context_props = this.node.contexts.map(prop => b`child_ctx[${renderer.context_lookup.get(prop.key.name).index}] = ${prop.default_modifier(prop.modifier(x`list[i]`), name => renderer.context_lookup.has(name) ? x`child_ctx[${renderer.context_lookup.get(name).index}]`: { type: 'Identifier', name })};`);

		if (this.node.has_binding) this.context_props.push(b`child_ctx[${renderer.context_lookup.get(this.vars.each_block_value.name).index}] = list;`);
		if (this.node.has_binding || this.node.has_index_binding || this.node.index) this.context_props.push(b`child_ctx[${renderer.context_lookup.get(this.index_name.name).index}] = i;`);
		// TODO which is better — Object.create(array) or array.slice()?
		renderer.blocks.push(b`
			function ${this.vars.get_each_context}(#ctx, list, i) {
				const child_ctx = #ctx.slice();
				${this.context_props}
				return child_ctx;
			}
		`);
	}

	render_keyed({
		block,
		parent_node,
		parent_nodes,
		snippet,
		initial_anchor_node,
		initial_mount_node,
		update_anchor_node,
		update_mount_node
	}








) {
		const {
			create_each_block,
			iterations,
			data_length,
			view_length
		} = this.vars;

		const get_key = block.get_unique_name('get_key');
		const lookup = block.get_unique_name(`${this.var.name}_lookup`);

		block.add_variable(iterations, x`[]`);
		block.add_variable(lookup, x`new @_Map()`);

		if (this.fragment.nodes[0].is_dom_node()) {
			this.block.first = this.fragment.nodes[0].var;
		} else {
			this.block.first = this.block.get_unique_name('first');
			this.block.add_element(
				this.block.first,
				x`@empty()`,
				parent_nodes && x`@empty()`,
				null
			);
		}

		block.chunks.init.push(b`
			const ${get_key} = #ctx => ${this.node.key.manipulate(block)};

			${this.renderer.options.dev && b`@validate_each_keys(#ctx, ${this.vars.each_block_value}, ${this.vars.get_each_context}, ${get_key});`}
			for (let #i = 0; #i < ${data_length}; #i += 1) {
				let child_ctx = ${this.vars.get_each_context}(#ctx, ${this.vars.each_block_value}, #i);
				let key = ${get_key}(child_ctx);
				${lookup}.set(key, ${iterations}[#i] = ${create_each_block}(key, child_ctx));
			}
		`);

		block.chunks.create.push(b`
			for (let #i = 0; #i < ${view_length}; #i += 1) {
				${iterations}[#i].c();
			}
		`);

		if (parent_nodes && this.renderer.options.hydratable) {
			block.chunks.claim.push(b`
				for (let #i = 0; #i < ${view_length}; #i += 1) {
					${iterations}[#i].l(${parent_nodes});
				}
			`);
		}

		block.chunks.mount.push(b`
			for (let #i = 0; #i < ${view_length}; #i += 1) {
				${iterations}[#i].m(${initial_mount_node}, ${initial_anchor_node});
			}
		`);

		const dynamic = this.block.has_update_method;

		const destroy = this.node.has_animation
			? (this.block.has_outros
				? '@fix_and_outro_and_destroy_block'
				: '@fix_and_destroy_block')
			: this.block.has_outros
				? '@outro_and_destroy_block'
				: '@destroy_block';

		if (this.dependencies.size) {
			this.block.maintain_context = true;

			this.updates.push(b`
				${this.vars.each_block_value} = ${snippet};
				${this.renderer.options.dev && b`@validate_each_argument(${this.vars.each_block_value});`}

				${this.block.has_outros && b`@group_outros();`}
				${this.node.has_animation && b`for (let #i = 0; #i < ${view_length}; #i += 1) ${iterations}[#i].r();`}
				${this.renderer.options.dev && b`@validate_each_keys(#ctx, ${this.vars.each_block_value}, ${this.vars.get_each_context}, ${get_key});`}
				${iterations} = @update_keyed_each(${iterations}, #dirty, ${get_key}, ${dynamic ? 1 : 0}, #ctx, ${this.vars.each_block_value}, ${lookup}, ${update_mount_node}, ${destroy}, ${create_each_block}, ${update_anchor_node}, ${this.vars.get_each_context});
				${this.node.has_animation && b`for (let #i = 0; #i < ${view_length}; #i += 1) ${iterations}[#i].a();`}
				${this.block.has_outros && b`@check_outros();`}
			`);
		}

		if (this.block.has_outros) {
			block.chunks.outro.push(b`
				for (let #i = 0; #i < ${view_length}; #i += 1) {
					@transition_out(${iterations}[#i]);
				}
			`);
		}

		block.chunks.destroy.push(b`
			for (let #i = 0; #i < ${view_length}; #i += 1) {
				${iterations}[#i].d(${parent_node ? null : 'detaching'});
			}
		`);
	}

	render_unkeyed({
		block,
		parent_nodes,
		snippet,
		initial_anchor_node,
		initial_mount_node,
		update_anchor_node,
		update_mount_node
	}







) {
		const {
			create_each_block,
			iterations,
			fixed_length,
			data_length,
			view_length
		} = this.vars;

		block.chunks.init.push(b`
			let ${iterations} = [];

			for (let #i = 0; #i < ${data_length}; #i += 1) {
				${iterations}[#i] = ${create_each_block}(${this.vars.get_each_context}(#ctx, ${this.vars.each_block_value}, #i));
			}
		`);

		block.chunks.create.push(b`
			for (let #i = 0; #i < ${view_length}; #i += 1) {
				${iterations}[#i].c();
			}
		`);

		if (parent_nodes && this.renderer.options.hydratable) {
			block.chunks.claim.push(b`
				for (let #i = 0; #i < ${view_length}; #i += 1) {
					${iterations}[#i].l(${parent_nodes});
				}
			`);
		}

		block.chunks.mount.push(b`
			for (let #i = 0; #i < ${view_length}; #i += 1) {
				${iterations}[#i].m(${initial_mount_node}, ${initial_anchor_node});
			}
		`);

		if (this.dependencies.size) {
			const has_transitions = !!(this.block.has_intro_method || this.block.has_outro_method);

			const for_loop_body = this.block.has_update_method
				? b`
					if (${iterations}[#i]) {
						${iterations}[#i].p(child_ctx, #dirty);
						${has_transitions && b`@transition_in(${this.vars.iterations}[#i], 1);`}
					} else {
						${iterations}[#i] = ${create_each_block}(child_ctx);
						${iterations}[#i].c();
						${has_transitions && b`@transition_in(${this.vars.iterations}[#i], 1);`}
						${iterations}[#i].m(${update_mount_node}, ${update_anchor_node});
					}
				`
				: has_transitions
					? b`
						if (${iterations}[#i]) {
							@transition_in(${this.vars.iterations}[#i], 1);
						} else {
							${iterations}[#i] = ${create_each_block}(child_ctx);
							${iterations}[#i].c();
							@transition_in(${this.vars.iterations}[#i], 1);
							${iterations}[#i].m(${update_mount_node}, ${update_anchor_node});
						}
					`
					: b`
						if (!${iterations}[#i]) {
							${iterations}[#i] = ${create_each_block}(child_ctx);
							${iterations}[#i].c();
							${iterations}[#i].m(${update_mount_node}, ${update_anchor_node});
						}
					`;

			const start = this.block.has_update_method ? 0 : '#old_length';

			let remove_old_blocks;

			if (this.block.has_outros) {
				const out = block.get_unique_name('out');

				block.chunks.init.push(b`
					const ${out} = i => @transition_out(${iterations}[i], 1, 1, () => {
						${iterations}[i] = null;
					});
				`);
				remove_old_blocks = b`
					@group_outros();
					for (#i = ${data_length}; #i < ${view_length}; #i += 1) {
						${out}(#i);
					}
					@check_outros();
				`;
			} else {
				remove_old_blocks = b`
					for (${this.block.has_update_method ? null : x`#i = ${data_length}`}; #i < ${this.block.has_update_method ? view_length : '#old_length'}; #i += 1) {
						${iterations}[#i].d(1);
					}
					${!fixed_length && b`${view_length} = ${data_length};`}
				`;
			}

			// We declare `i` as block scoped here, as the `remove_old_blocks` code
			// may rely on continuing where this iteration stopped.
			const update = b`
				${!this.block.has_update_method && b`const #old_length = ${this.vars.each_block_value}.length;`}
				${this.vars.each_block_value} = ${snippet};
				${this.renderer.options.dev && b`@validate_each_argument(${this.vars.each_block_value});`}

				let #i;
				for (#i = ${start}; #i < ${data_length}; #i += 1) {
					const child_ctx = ${this.vars.get_each_context}(#ctx, ${this.vars.each_block_value}, #i);

					${for_loop_body}
				}

				${remove_old_blocks}
			`;

			this.updates.push(update);
		}

		if (this.block.has_outros) {
			block.chunks.outro.push(b`
				${iterations} = ${iterations}.filter(@_Boolean);
				for (let #i = 0; #i < ${view_length}; #i += 1) {
					@transition_out(${iterations}[#i]);
				}
			`);
		}

		block.chunks.destroy.push(b`@destroy_each(${iterations}, detaching);`);
	}
}

function string_literal(data) {
	return {
		type: 'Literal',
		value: data
	};
}

const escaped = {
	'"': '&quot;',
	"'": '&#39;',
	'&': '&amp;',
	'<': '&lt;',
	'>': '&gt;'
};

function escape_html(html) {
	return String(html).replace(/["'&<>]/g, match => escaped[match]);
}

function escape_template(str) {
	return str.replace(/(\${|`|\\)/g, '\\$1');
}

class TextWrapper extends Wrapper {
	
	
	
	

	constructor(
		renderer,
		block,
		parent,
		node,
		data
	) {
		super(renderer, block, parent, node);

		this.skip = this.node.should_skip();
		this.data = data;
		this.var = (this.skip ? null : x`t`) ;
	}

	use_space() {
		if (this.renderer.component.component_options.preserveWhitespace) return false;
		if (/[\S\u00A0]/.test(this.data)) return false;

		let node = this.parent && this.parent.node;
		while (node) {
			if (node.type === 'Element' && node.name === 'pre') {
				return false;
			}
			node = node.parent;
		}

		return true;
	}

	render(block, parent_node, parent_nodes) {
		if (this.skip) return;
		const use_space = this.use_space();

		block.add_element(
			this.var,
			use_space ? x`@space()` : x`@text("${this.data}")`,
			parent_nodes && (use_space ? x`@claim_space(${parent_nodes})` : x`@claim_text(${parent_nodes}, "${this.data}")`),
			parent_node 
		);
	}
}

const svg_attributes = 'accent-height accumulate additive alignment-baseline allowReorder alphabetic amplitude arabic-form ascent attributeName attributeType autoReverse azimuth baseFrequency baseline-shift baseProfile bbox begin bias by calcMode cap-height class clip clipPathUnits clip-path clip-rule color color-interpolation color-interpolation-filters color-profile color-rendering contentScriptType contentStyleType cursor cx cy d decelerate descent diffuseConstant direction display divisor dominant-baseline dur dx dy edgeMode elevation enable-background end exponent externalResourcesRequired fill fill-opacity fill-rule filter filterRes filterUnits flood-color flood-opacity font-family font-size font-size-adjust font-stretch font-style font-variant font-weight format from fr fx fy g1 g2 glyph-name glyph-orientation-horizontal glyph-orientation-vertical glyphRef gradientTransform gradientUnits hanging height href horiz-adv-x horiz-origin-x id ideographic image-rendering in in2 intercept k k1 k2 k3 k4 kernelMatrix kernelUnitLength kerning keyPoints keySplines keyTimes lang lengthAdjust letter-spacing lighting-color limitingConeAngle local marker-end marker-mid marker-start markerHeight markerUnits markerWidth mask maskContentUnits maskUnits mathematical max media method min mode name numOctaves offset onabort onactivate onbegin onclick onend onerror onfocusin onfocusout onload onmousedown onmousemove onmouseout onmouseover onmouseup onrepeat onresize onscroll onunload opacity operator order orient orientation origin overflow overline-position overline-thickness panose-1 paint-order pathLength patternContentUnits patternTransform patternUnits pointer-events points pointsAtX pointsAtY pointsAtZ preserveAlpha preserveAspectRatio primitiveUnits r radius refX refY rendering-intent repeatCount repeatDur requiredExtensions requiredFeatures restart result rotate rx ry scale seed shape-rendering slope spacing specularConstant specularExponent speed spreadMethod startOffset stdDeviation stemh stemv stitchTiles stop-color stop-opacity strikethrough-position strikethrough-thickness string stroke stroke-dasharray stroke-dashoffset stroke-linecap stroke-linejoin stroke-miterlimit stroke-opacity stroke-width style surfaceScale systemLanguage tabindex tableValues target targetX targetY text-anchor text-decoration text-rendering textLength to transform type u1 u2 underline-position underline-thickness unicode unicode-bidi unicode-range units-per-em v-alphabetic v-hanging v-ideographic v-mathematical values version vert-adv-y vert-origin-x vert-origin-y viewBox viewTarget visibility width widths word-spacing writing-mode x x-height x1 x2 xChannelSelector xlink:actuate xlink:arcrole xlink:href xlink:role xlink:show xlink:title xlink:type xml:base xml:lang xml:space y y1 y2 yChannelSelector z zoomAndPan'.split(' ');

const svg_attribute_lookup = new Map();

svg_attributes.forEach(name => {
	svg_attribute_lookup.set(name.toLowerCase(), name);
});

function fix_attribute_casing(name) {
	name = name.toLowerCase();
	return svg_attribute_lookup.get(name) || name;
}

// The `foreign` namespace covers all DOM implementations that aren't HTML5.
// It opts out of HTML5-specific a11y checks and case-insensitive attribute names.
const foreign = 'https://svelte.dev/docs#svelte_options';
const html = 'http://www.w3.org/1999/xhtml';
const mathml = 'http://www.w3.org/1998/Math/MathML';
const svg = 'http://www.w3.org/2000/svg';
const xlink = 'http://www.w3.org/1999/xlink';
const xml = 'http://www.w3.org/XML/1998/namespace';
const xmlns = 'http://www.w3.org/2000/xmlns';

const valid_namespaces = [
	'foreign',
	'html',
	'mathml',
	'svg',
	'xlink',
	'xml',
	'xmlns',
	foreign,
	html,
	mathml,
	svg,
	xlink,
	xml,
	xmlns
];

const namespaces = { foreign, html, mathml, svg, xlink, xml, xmlns };

function handle_select_value_binding(
	attr,
	dependencies
) {
	const { parent } = attr;
	if (parent.node.name === 'select') {
		(parent ).select_binding_dependencies = dependencies;
		dependencies.forEach((prop) => {
			parent.renderer.component.indirect_dependencies.set(prop, new Set());
		});
	}
}

class BaseAttributeWrapper {
	
	

	constructor(parent, block, node) {
		this.node = node;
		this.parent = parent;

		if (node.dependencies.size > 0) {
			parent.cannot_use_innerhtml();
			parent.not_static_content();

			block.add_dependencies(node.dependencies);
		}
	}

	render(_block) {}
}

class AttributeWrapper extends BaseAttributeWrapper {
	
	
	
	
	
	
	
	
	
	
	

	constructor(parent, block, node) {
		super(parent, block, node);

		if (node.dependencies.size > 0) {
			// special case — <option value={foo}> — see below
			if (this.parent.node.name === 'option' && node.name === 'value') {
				let select = this.parent;
				while (select && (select.node.type !== 'Element' || select.node.name !== 'select')) {
					// @ts-ignore todo: doublecheck this, but looks to be correct
					select = select.parent;
				}

				if (select && select.select_binding_dependencies) {
					select.select_binding_dependencies.forEach(prop => {
						this.node.dependencies.forEach((dependency) => {
							this.parent.renderer.component.indirect_dependencies.get(prop).add(dependency);
						});
					});
				}
			}

			if (node.name === 'value') {
				handle_select_value_binding(this, node.dependencies);
			}
		}

		if (this.parent.node.namespace == namespaces.foreign) {
			// leave attribute case alone for elements in the "foreign" namespace
			this.name = this.node.name;
			this.metadata = this.get_metadata();
			this.is_indirectly_bound_value = false;
			this.property_name = null;
			this.is_select_value_attribute = false;
			this.is_input_value = false;
		} else {
			this.name = fix_attribute_casing(this.node.name);
			this.metadata = this.get_metadata();
			this.is_indirectly_bound_value = is_indirectly_bound_value(this);
			this.property_name = this.is_indirectly_bound_value
				? '__value'
				: this.metadata && this.metadata.property_name;
			this.is_select_value_attribute = this.name === 'value' && this.parent.node.name === 'select';
			this.is_input_value = this.name === 'value' && this.parent.node.name === 'input';
		}
		
		this.is_src = this.name === 'src'; // TODO retire this exception in favour of https://github.com/sveltejs/svelte/issues/3750
		this.should_cache = should_cache(this);
	}

	render(block) {
		const element = this.parent;
		const { name, property_name, should_cache, is_indirectly_bound_value } = this;

		// xlink is a special case... we could maybe extend this to generic
		// namespaced attributes but I'm not sure that's applicable in
		// HTML5?
		const method = /-/.test(element.node.name)
			? '@set_custom_element_data'
			: name.slice(0, 6) === 'xlink:'
				? '@xlink_attr'
				: '@attr';

		const is_legacy_input_type = element.renderer.component.compile_options.legacy && name === 'type' && this.parent.node.name === 'input';

		const dependencies = this.get_dependencies();
		const value = this.get_value(block);

		let updater;
		const init = this.get_init(block, value);

		if (is_legacy_input_type) {
			block.chunks.hydrate.push(
				b`@set_input_type(${element.var}, ${init});`
			);
			updater = b`@set_input_type(${element.var}, ${should_cache ? this.last : value});`;
		} else if (this.is_select_value_attribute) {
			// annoying special case
			const is_multiple_select = element.node.get_static_attribute_value('multiple');

			if (is_multiple_select) {
				updater = b`@select_options(${element.var}, ${value});`;
			} else {
				updater = b`@select_option(${element.var}, ${value});`;
			}

			block.chunks.mount.push(b`
				${updater}
			`);
		} else if (this.is_src) {
			block.chunks.hydrate.push(
				b`if (${element.var}.src !== ${init}) ${method}(${element.var}, "${name}", ${this.last});`
			);
			updater = b`${method}(${element.var}, "${name}", ${should_cache ? this.last : value});`;
		} else if (property_name) {
			block.chunks.hydrate.push(
				b`${element.var}.${property_name} = ${init};`
			);
			updater = block.renderer.options.dev
				? b`@prop_dev(${element.var}, "${property_name}", ${should_cache ? this.last : value});`
				: b`${element.var}.${property_name} = ${should_cache ? this.last : value};`;
		} else {
			block.chunks.hydrate.push(
				b`${method}(${element.var}, "${name}", ${init});`
			);
			updater = b`${method}(${element.var}, "${name}", ${should_cache ? this.last : value});`;
		}

		if (is_indirectly_bound_value) {
			const update_value = b`${element.var}.value = ${element.var}.__value;`;
			block.chunks.hydrate.push(update_value);

			updater = b`
				${updater}
				${update_value};
			`;
		}

		if (dependencies.length > 0) {
			const condition = this.get_dom_update_conditions(block, block.renderer.dirty(dependencies));

			block.chunks.update.push(b`
				if (${condition}) {
					${updater}
				}`);
		}

		// special case – autofocus. has to be handled in a bit of a weird way
		if (this.node.is_true && name === 'autofocus') {
			block.autofocus = element.var;
		}
	}

	get_init(block, value) {
		this.last = this.should_cache && block.get_unique_name(
			`${this.parent.var.name}_${this.name.replace(/[^a-zA-Z_$]/g, '_')}_value`
		);

		if (this.should_cache) block.add_variable(this.last);

		return this.should_cache ? x`${this.last} = ${value}` : value;
	}

	get_dom_update_conditions(block, dependency_condition) {
		const { property_name, should_cache, last } = this;
		const element = this.parent;
		const value = this.get_value(block);

		let condition = dependency_condition;

		if (should_cache) {
			condition = this.is_src
				? x`${condition} && (${element.var}.src !== (${last} = ${value}))`
				: x`${condition} && (${last} !== (${last} = ${value}))`;
		}

		if (this.is_input_value) {
			const type = element.node.get_static_attribute_value('type');

			if (type === null || type === '' || type === 'text' || type === 'email' || type === 'password') {
				condition = x`${condition} && ${element.var}.${property_name} !== ${should_cache ? last : value}`;
			}
		}

		if (block.has_outros) {
			condition = x`!#current || ${condition}`;
		}

		return condition;
	}

	get_dependencies() {
		const node_dependencies = this.node.get_dependencies();
		const dependencies = new Set(node_dependencies);

		node_dependencies.forEach((prop) => {
			const indirect_dependencies = this.parent.renderer.component.indirect_dependencies.get(prop);
			if (indirect_dependencies) {
				indirect_dependencies.forEach(indirect_dependency => {
					dependencies.add(indirect_dependency);
				});
			}
		});

		return Array.from(dependencies);
	}

	get_metadata() {
		if (this.parent.node.namespace) return null;
		const metadata = attribute_lookup[this.name];
		if (metadata && metadata.applies_to && !metadata.applies_to.includes(this.parent.node.name)) return null;
		return metadata;
	}

	get_value(block) {
		if (this.node.is_true) {
			if (this.metadata && boolean_attribute.has(this.metadata.property_name.toLowerCase())) {
				return x`true`;
			}
			return x`""`;
		}
		if (this.node.chunks.length === 0) return x`""`;

		// TODO some of this code is repeated in Tag.ts — would be good to
		// DRY it out if that's possible without introducing crazy indirection
		if (this.node.chunks.length === 1) {
			return this.node.chunks[0].type === 'Text'
				? string_literal((this.node.chunks[0] ).data)
				: (this.node.chunks[0] ).manipulate(block);
		}

		let value = this.node.name === 'class'
			? this.get_class_name_text(block)
			: this.render_chunks(block).reduce((lhs, rhs) => x`${lhs} + ${rhs}`);

		// '{foo} {bar}' — treat as string concatenation
		if (this.node.chunks[0].type !== 'Text') {
			value = x`"" + ${value}`;
		}

		return value;
	}

	get_class_name_text(block) {
		const scoped_css = this.node.chunks.some((chunk) => chunk.synthetic);
		const rendered = this.render_chunks(block);

		if (scoped_css && rendered.length === 2) {
			// we have a situation like class={possiblyUndefined}
			rendered[0] = x`@null_to_empty(${rendered[0]})`;
		}

		return rendered.reduce((lhs, rhs) => x`${lhs} + ${rhs}`);
	}

	render_chunks(block) {
		return this.node.chunks.map((chunk) => {
			if (chunk.type === 'Text') {
				return string_literal(chunk.data);
			}

			return chunk.manipulate(block);
		});
	}

	stringify() {
		if (this.node.is_true) return '';

		const value = this.node.chunks;
		if (value.length === 0) return '=""';

		return `="${value.map(chunk => {
			return chunk.type === 'Text'
				? chunk.data.replace(/"/g, '\\"')
				: `\${${chunk.manipulate()}}`;
		}).join('')}"`;
	}
}

// source: https://html.spec.whatwg.org/multipage/indices.html
const attribute_lookup = {
	allowfullscreen: { property_name: 'allowFullscreen', applies_to: ['iframe'] },
	allowpaymentrequest: { property_name: 'allowPaymentRequest', applies_to: ['iframe'] },
	async: { applies_to: ['script'] },
	autofocus: { applies_to: ['button', 'input', 'keygen', 'select', 'textarea'] },
	autoplay: { applies_to: ['audio', 'video'] },
	checked: { applies_to: ['input'] },
	controls: { applies_to: ['audio', 'video'] },
	default: { applies_to: ['track'] },
	defer: { applies_to: ['script'] },
	disabled: {
		applies_to: [
			'button',
			'fieldset',
			'input',
			'keygen',
			'optgroup',
			'option',
			'select',
			'textarea'
		]
	},
	formnovalidate: { property_name: 'formNoValidate', applies_to: ['button', 'input'] },
	hidden: {},
	indeterminate: { applies_to: ['input'] },
	ismap: { property_name: 'isMap', applies_to: ['img'] },
	loop: { applies_to: ['audio', 'bgsound', 'video'] },
	multiple: { applies_to: ['input', 'select'] },
	muted: { applies_to: ['audio', 'video'] },
	nomodule: { property_name: 'noModule', applies_to: ['script'] },
	novalidate: { property_name: 'noValidate', applies_to: ['form'] },
	open: { applies_to: ['details', 'dialog'] },
	playsinline: { property_name: 'playsInline', applies_to: ['video'] },
	readonly: { property_name: 'readOnly', applies_to: ['input', 'textarea'] },
	required: { applies_to: ['input', 'select', 'textarea'] },
	reversed: { applies_to: ['ol'] },
	selected: { applies_to: ['option'] },
	value: {
		applies_to: [
			'button',
			'option',
			'input',
			'li',
			'meter',
			'progress',
			'param',
			'select',
			'textarea'
		]
	}
};

Object.keys(attribute_lookup).forEach(name => {
	const metadata = attribute_lookup[name];
	if (!metadata.property_name) metadata.property_name = name;
});

// source: https://html.spec.whatwg.org/multipage/indices.html
const boolean_attribute = new Set([
	'allowfullscreen',
	'allowpaymentrequest',
	'async',
	'autofocus',
	'autoplay',
	'checked',
	'controls',
	'default',
	'defer',
	'disabled',
	'formnovalidate',
	'hidden',
	'ismap',
	'itemscope',
	'loop',
	'multiple',
	'muted',
	'nomodule',
	'novalidate',
	'open',
	'playsinline',
	'readonly',
	'required',
	'reversed',
	'selected'
]);

function should_cache(attribute) {
	return attribute.is_src || attribute.node.should_cache();
}

function is_indirectly_bound_value(attribute) {
	const element = attribute.parent;
	return attribute.name === 'value' &&
		(element.node.name === 'option' || // TODO check it's actually bound
			(element.node.name === 'input' &&
				element.node.bindings.some(
					(binding) =>
						/checked|group/.test(binding.name)
				)));
}

class StyleAttributeWrapper extends AttributeWrapper {
	
	

	render(block) {
		const style_props = optimize_style(this.node.chunks);
		if (!style_props) return super.render(block);

		style_props.forEach((prop) => {
			let value;

			if (is_dynamic(prop.value)) {
				const prop_dependencies = new Set();

				value = prop.value
					.map(chunk => {
						if (chunk.type === 'Text') {
							return string_literal(chunk.data);
						} else {
							add_to_set(prop_dependencies, chunk.dynamic_dependencies());
							return chunk.manipulate(block);
						}
					})
					.reduce((lhs, rhs) => x`${lhs} + ${rhs}`);

				// TODO is this necessary? style.setProperty always treats value as string, no?
				// if (prop.value.length === 1 || prop.value[0].type !== 'Text') {
				// 	value = x`"" + ${value}`;
				// }

				if (prop_dependencies.size) {
					let condition = block.renderer.dirty(Array.from(prop_dependencies));

					if (block.has_outros) {
						condition = x`!#current || ${condition}`;
					}

					const update = b`
						if (${condition}) {
							@set_style(${this.parent.var}, "${prop.key}", ${value}, ${prop.important ? 1 : null});
						}`;

					block.chunks.update.push(update);
				}
			} else {
				value = string_literal((prop.value[0] ).data);
			}

			block.chunks.hydrate.push(
				b`@set_style(${this.parent.var}, "${prop.key}", ${value}, ${prop.important ? 1 : null});`
			);
		});
	}
}

function optimize_style(value) {
	const props = [];
	let chunks = value.slice();

	while (chunks.length) {
		const chunk = chunks[0];

		if (chunk.type !== 'Text') return null;

		const key_match = /^\s*([\w-]+):\s*/.exec(chunk.data);
		if (!key_match) return null;

		const key = key_match[1];

		const offset = key_match.index + key_match[0].length;
		const remaining_data = chunk.data.slice(offset);

		if (remaining_data) {
			chunks[0] = {
				start: chunk.start + offset,
				end: chunk.end,
				type: 'Text',
				data: remaining_data
			} ;
		} else {
			chunks.shift();
		}

		const result = get_style_value(chunks);

		props.push({ key, value: result.value, important: result.important });
		chunks = result.chunks;
	}

	return props;
}

function get_style_value(chunks) {
	const value = [];

	let in_url = false;
	let quote_mark = null;
	let escaped = false;
	let closed = false;

	while (chunks.length && !closed) {
		const chunk = chunks.shift();

		if (chunk.type === 'Text') {
			let c = 0;
			while (c < chunk.data.length) {
				const char = chunk.data[c];

				if (escaped) {
					escaped = false;
				} else if (char === '\\') {
					escaped = true;
				} else if (char === quote_mark) {
					quote_mark = null;
				} else if (char === '"' || char === "'") {
					quote_mark = char;
				} else if (char === ')' && in_url) {
					in_url = false;
				} else if (char === 'u' && chunk.data.slice(c, c + 4) === 'url(') {
					in_url = true;
				} else if (char === ';' && !in_url && !quote_mark) {
					closed = true;
					break;
				}

				c += 1;
			}

			if (c > 0) {
				value.push({
					type: 'Text',
					start: chunk.start,
					end: chunk.start + c,
					data: chunk.data.slice(0, c)
				} );
			}

			while (/[;\s]/.test(chunk.data[c])) c += 1;
			const remaining_data = chunk.data.slice(c);

			if (remaining_data) {
				chunks.unshift({
					start: chunk.start + c,
					end: chunk.end,
					type: 'Text',
					data: remaining_data
				} );

				break;
			}
		} else {
			value.push(chunk);
		}
	}

	let important = false;

	const last_chunk = value[value.length - 1];
	if (last_chunk && last_chunk.type === 'Text' && /\s*!important\s*$/.test(last_chunk.data)) {
		important = true;
		last_chunk.data = last_chunk.data.replace(/\s*!important\s*$/, '');
		if (!last_chunk.data) value.pop();
	}

	return {
		chunks,
		value,
		important
	};
}

function is_dynamic(value) {
	return value.length > 1 || value[0].type !== 'Text';
}

class SpreadAttributeWrapper extends BaseAttributeWrapper {}

function replace_object(node, replacement) {
	if (node.type === 'Identifier') return replacement;

	const ancestor = node;
	let parent;
	while (node.type === 'MemberExpression') {
		parent = node;
		node = node.object;
	}
	parent.object = replacement;
	return ancestor;
}

function flatten_reference(node) {
	const nodes = [];
	const parts = [];
	
	while (node.type === 'MemberExpression') {
		nodes.unshift(node.property);

		if (!node.computed) {
			parts.unshift((node.property ).name);
		} else {
			const computed_property = to_string$1(node.property);
			if (computed_property) {
				parts.unshift(`[${computed_property}]`);
			}
		}
		node = node.object;
	}

	const name = node.type === 'Identifier'
		? node.name
		: node.type === 'ThisExpression' ? 'this' : null;

	nodes.unshift(node);

	parts.unshift(name);

	return { name, nodes, parts };
}

function to_string$1(node) {
	switch (node.type) {
		case 'Literal':
			return String(node.value);
		case 'Identifier':
			return node.name;
	}
}

function mark_each_block_bindings(
	parent,
	binding
) {
	// we need to ensure that the each block creates a context including
	// the list and the index, if they're not otherwise referenced
	binding.expression.references.forEach(name => {
		const each_block = parent.node.scope.get_owner(name);
		if (each_block) {
			(each_block ).has_binding = true;
		}
	});

	if (binding.name === 'group') {
		const add_index_binding = (name) => {
			const each_block = parent.node.scope.get_owner(name);
			if (each_block.type === 'EachBlock') {
				each_block.has_index_binding = true;
				for (const dep of each_block.expression.contextual_dependencies) {
					add_index_binding(dep);
				}
			}
		};
		// for `<input bind:group={} >`, we make sure that all the each blocks creates context with `index`
		for (const name of binding.expression.contextual_dependencies) {
			add_index_binding(name);
		}
	}
}

class BindingWrapper {
	
	

	
	





	
	
	

	constructor(block, node, parent) {
		this.node = node;
		this.parent = parent;

		const { dependencies } = this.node.expression;

		block.add_dependencies(dependencies);

		// TODO does this also apply to e.g. `<input type='checkbox' bind:group='foo'>`?

		handle_select_value_binding(this, dependencies);

		if (node.is_contextual) {
			mark_each_block_bindings(this.parent, this.node);
		}

		this.object = get_object(this.node.expression.node).name;

		// view to model
		this.handler = get_event_handler(this, parent.renderer, block, this.object, this.node.raw_expression);

		this.snippet = this.node.expression.manipulate(block);

		this.is_readonly = this.node.is_readonly;

		this.needs_lock = this.node.name === 'currentTime';  // TODO others?
	}

	get_dependencies() {
		const dependencies = new Set(this.node.expression.dependencies);

		this.node.expression.dependencies.forEach((prop) => {
			const indirect_dependencies = this.parent.renderer.component.indirect_dependencies.get(prop);
			if (indirect_dependencies) {
				indirect_dependencies.forEach(indirect_dependency => {
					dependencies.add(indirect_dependency);
				});
			}
		});

		return dependencies;
	}

	is_readonly_media_attribute() {
		return this.node.is_readonly_media_attribute();
	}

	render(block, lock) {
		if (this.is_readonly) return;

		const { parent } = this;

		const update_conditions = this.needs_lock ? [x`!${lock}`] : [];
		const mount_conditions = [];

		const dependency_array = Array.from(this.get_dependencies());

		if (dependency_array.length > 0) {
			update_conditions.push(block.renderer.dirty(dependency_array));
		}

		if (parent.node.name === 'input') {
			const type = parent.node.get_static_attribute_value('type');

			if (
				type === null ||
				type === '' ||
				type === 'text' ||
				type === 'email' ||
				type === 'password'
			) {
				update_conditions.push(
					x`${parent.var}.${this.node.name} !== ${this.snippet}`
				);
			} else if (type === 'number') {
				update_conditions.push(
					x`@to_number(${parent.var}.${this.node.name}) !== ${this.snippet}`
				);
			}
		}

		// model to view
		let update_dom = get_dom_updater(parent, this);
		let mount_dom = update_dom;

		// special cases
		switch (this.node.name) {
			case 'group':
			{
				const { binding_group, is_context, contexts, index, keypath } = get_binding_group(parent.renderer, this.node, block);

				block.renderer.add_to_context('$$binding_groups');

				if (is_context && !block.binding_group_initialised.has(keypath)) {
					if (contexts.length > 1) {
						let binding_group = x`${block.renderer.reference('$$binding_groups')}[${index}]`;
						for (const name of contexts.slice(0, -1)) {
							binding_group = x`${binding_group}[${block.renderer.reference(name)}]`;
							block.chunks.init.push(
								b`${binding_group} = ${binding_group} || [];`
							);
						}
					}
					block.chunks.init.push(
						b`${binding_group(true)} = [];`
					);
					block.binding_group_initialised.add(keypath);
				}

				block.chunks.hydrate.push(
					b`${binding_group(true)}.push(${parent.var});`
				);

				block.chunks.destroy.push(
					b`${binding_group(true)}.splice(${binding_group(true)}.indexOf(${parent.var}), 1);`
				);
				break;
			}

			case 'textContent':
				update_conditions.push(x`${this.snippet} !== ${parent.var}.textContent`);
				mount_conditions.push(x`${this.snippet} !== void 0`);
				break;

			case 'innerHTML':
				update_conditions.push(x`${this.snippet} !== ${parent.var}.innerHTML`);
				mount_conditions.push(x`${this.snippet} !== void 0`);
				break;

			case 'currentTime':
				update_conditions.push(x`!@_isNaN(${this.snippet})`);
				mount_dom = null;
				break;

			case 'playbackRate':
			case 'volume':
				update_conditions.push(x`!@_isNaN(${this.snippet})`);
				mount_conditions.push(x`!@_isNaN(${this.snippet})`);
				break;

			case 'paused':
			{
				// this is necessary to prevent audio restarting by itself
				const last = block.get_unique_name(`${parent.var.name}_is_paused`);
				block.add_variable(last, x`true`);

				update_conditions.push(x`${last} !== (${last} = ${this.snippet})`);
				update_dom = b`${parent.var}[${last} ? "pause" : "play"]();`;
				mount_dom = null;
				break;
			}

			case 'value':
				if (parent.node.get_static_attribute_value('type') === 'file') {
					update_dom = null;
					mount_dom = null;
				}
		}

		if (update_dom) {
			if (update_conditions.length > 0) {
				const condition = update_conditions.reduce((lhs, rhs) => x`${lhs} && ${rhs}`);

				block.chunks.update.push(b`
					if (${condition}) {
						${update_dom}
					}
				`);
			} else {
				block.chunks.update.push(update_dom);
			}
		}

		if (mount_dom) {
			if (mount_conditions.length > 0) {
				const condition = mount_conditions.reduce((lhs, rhs) => x`${lhs} && ${rhs}`);

				block.chunks.mount.push(b`
					if (${condition}) {
						${mount_dom}
					}
				`);
			} else {
				block.chunks.mount.push(mount_dom);
			}
		}
	}
}

function get_dom_updater(
	element,
	binding
) {
	const { node } = element;

	if (binding.is_readonly_media_attribute()) {
		return null;
	}

	if (binding.node.name === 'this') {
		return null;
	}

	if (node.name === 'select') {
		return node.get_static_attribute_value('multiple') === true ?
			b`@select_options(${element.var}, ${binding.snippet})` :
			b`@select_option(${element.var}, ${binding.snippet})`;
	}

	if (binding.node.name === 'group') {
		const type = node.get_static_attribute_value('type');

		const condition = type === 'checkbox'
			? x`~${binding.snippet}.indexOf(${element.var}.__value)`
			: x`${element.var}.__value === ${binding.snippet}`;

		return b`${element.var}.checked = ${condition};`;
	}

	if (binding.node.name === 'value') {
		return b`@set_input_value(${element.var}, ${binding.snippet});`;
	}

	return b`${element.var}.${binding.node.name} = ${binding.snippet};`;
}

function get_binding_group(renderer, value, block) {
	const { parts } = flatten_reference(value.raw_expression);
	let keypath = parts.join('.');

	const contexts = [];
	const contextual_dependencies = new Set();
	const { template_scope } = value.expression;
	const add_contextual_dependency = (dep) => {
		contextual_dependencies.add(dep);
		const owner = template_scope.get_owner(dep);
		if (owner.type === 'EachBlock') {
			for (const dep of owner.expression.contextual_dependencies) {
				add_contextual_dependency(dep);
			}
		}
	};
	for (const dep of value.expression.contextual_dependencies) {
		add_contextual_dependency(dep);
	}

	for (const dep of contextual_dependencies) {
		const context = block.bindings.get(dep);
		let key;
		let name;
		if (context) {
			key = context.object.name;
			name = context.property.name;
		} else {
			key = dep;
			name = dep;
		}
		keypath = `${key}@${keypath}`;
		contexts.push(name);
	}

	if (!renderer.binding_groups.has(keypath)) {
		const index = renderer.binding_groups.size;

		contexts.forEach(context => {
			renderer.add_to_context(context, true);
		});

		renderer.binding_groups.set(keypath, {
			binding_group: (to_reference = false) => {
				let binding_group = '$$binding_groups';
				let _secondary_indexes = contexts;

				if (to_reference) {
					binding_group = block.renderer.reference(binding_group);
					_secondary_indexes = _secondary_indexes.map(name => block.renderer.reference(name));
				}

				if (_secondary_indexes.length > 0) {
					let obj = x`${binding_group}[${index}]`;
					_secondary_indexes.forEach(secondary_index => {
						obj = x`${obj}[${secondary_index}]`;
					});
					return obj;
				} else {
					return x`${binding_group}[${index}]`;
				}
			},
			is_context: contexts.length > 0,
			contexts,
			index,
			keypath
		});
	}

	return renderer.binding_groups.get(keypath);
}

function get_event_handler(
	binding,
	renderer,
	block,
	name,
	lhs
)




 {
	const contextual_dependencies = new Set(binding.node.expression.contextual_dependencies);

	const context = block.bindings.get(name);
	let set_store;

	if (context) {
		const { object, property, store, snippet } = context;
		lhs = replace_object(lhs, snippet);
		contextual_dependencies.add(object.name);
		contextual_dependencies.add(property.name);
		contextual_dependencies.delete(name);

		if (store) {
			set_store = b`${store}.set(${`$${store}`});`;
		}
	} else {
		const object = get_object(lhs);
		if (object.name[0] === '$') {
			const store = object.name.slice(1);
			set_store = b`${store}.set(${object.name});`;
		}
	}

	const value = get_value_from_dom(renderer, binding.parent, binding, block, contextual_dependencies);

	const mutation = b`
		${lhs} = ${value};
		${set_store}
	`;

	return {
		uses_context: binding.node.is_contextual || binding.node.expression.uses_context, // TODO this is messy
		mutation,
		contextual_dependencies,
		lhs
	};
}

function get_value_from_dom(
	renderer,
	element,
	binding,
	block,
	contextual_dependencies
) {
	const { node } = element;
	const { name } = binding.node;

	if (name === 'this') {
		return x`$$value`;
	}

	// <select bind:value='selected>
	if (node.name === 'select') {
		return node.get_static_attribute_value('multiple') === true ?
			x`@select_multiple_value(this)` :
			x`@select_value(this)`;
	}

	const type = node.get_static_attribute_value('type');

	// <input type='checkbox' bind:group='foo'>
	if (name === 'group') {
		if (type === 'checkbox') {
			const { binding_group, contexts } = get_binding_group(renderer, binding.node, block);
			add_to_set(contextual_dependencies, contexts);
			return x`@get_binding_group_value(${binding_group()}, this.__value, this.checked)`;
		}

		return x`this.__value`;
	}

	// <input type='range|number' bind:value>
	if (type === 'range' || type === 'number') {
		return x`@to_number(this.${name})`;
	}

	if ((name === 'buffered' || name === 'seekable' || name === 'played')) {
		return x`@time_ranges_to_array(this.${name})`;
	}

	// everything else
	return x`this.${name}`;
}

const reserved_keywords = new Set(['$$props', '$$restProps', '$$slots']);

function is_reserved_keyword(name) {
	return reserved_keywords.has(name);
}

function is_contextual(component, scope, name) {
	if (is_reserved_keyword(name)) return true;

	// if it's a name below root scope, it's contextual
	if (!scope.is_top_level(name)) return true;

	const variable = component.var_lookup.get(name);

	// hoistables, module declarations, and imports are non-contextual
	if (!variable || variable.hoistable) return false;

	// assume contextual
	return true;
}

function add_actions(
	block,
	target,
	actions
) {
	actions.forEach(action => add_action(block, target, action));
}

function add_action(block, target, action) {
	const { expression, template_scope } = action;
	let snippet;
	let dependencies;

	if (expression) {
		snippet = expression.manipulate(block);
		dependencies = expression.dynamic_dependencies();
	}

	const id = block.get_unique_name(
		`${action.name.replace(/[^a-zA-Z0-9_$]/g, '_')}_action`
	);

	block.add_variable(id);

	const [obj, ...properties] = action.name.split('.');

	const fn = is_contextual(action.component, template_scope, obj)
		? block.renderer.reference(obj)
		: obj;

	if (properties.length) {
		const member_expression = properties.reduce((lhs, rhs) => x`${lhs}.${rhs}`, fn);
		block.event_listeners.push(
			x`@action_destroyer(${id} = ${member_expression}(${target}, ${snippet}))`
		);
	} else {
		block.event_listeners.push(
			x`@action_destroyer(${id} = ${fn}.call(null, ${target}, ${snippet}))`
		);
	}

	if (dependencies && dependencies.length > 0) {
		let condition = x`${id} && @is_function(${id}.update)`;

		if (dependencies.length > 0) {
			condition = x`${condition} && ${block.renderer.dirty(dependencies)}`;
		}

		block.chunks.update.push(
			b`if (${condition}) ${id}.update.call(null, ${snippet});`
		);
	}
}

function compare_node(a, b) {
	if (a === b) return true;
	if (!a || !b) return false;
	if (a.type !== b.type) return false;
	switch (a.type) {
		case 'Identifier':
			return a.name === (b ).name;
		case 'MemberExpression':
			return (
				compare_node(a.object, (b ).object) &&
				compare_node(a.property, (b ).property) &&
				a.computed === (b ).computed
			);
		case 'Literal':
			return a.value === (b ).value;
	}
}

function bind_this(component, block, binding, variable) {
	const fn = component.get_unique_name(`${variable.name}_binding`);

	block.renderer.add_to_context(fn.name);
	const callee = block.renderer.reference(fn.name);

	const { contextual_dependencies, mutation } = binding.handler;
	const dependencies = binding.get_dependencies();

	const body = b`
		${mutation}
		${Array.from(dependencies)
			.filter(dep => dep[0] !== '$')
			.filter(dep => !contextual_dependencies.has(dep))
			.map(dep => b`${block.renderer.invalidate(dep)};`)}
	`;

	if (contextual_dependencies.size) {
		const params = Array.from(contextual_dependencies).map(name => ({
			type: 'Identifier',
			name
		}));
		component.partly_hoisted.push(b`
			function ${fn}($$value, ${params}) {
				@binding_callbacks[$$value ? 'unshift' : 'push'](() => {
					${body}
				});
			}
		`);

		const alias_map = new Map();
		const args = [];
		for (let id of params) {
			const value = block.renderer.reference(id.name);
			let found = false;
			if (block.variables.has(id.name)) {
				let alias = id.name;
				for (
					let i = 1;
					block.variables.has(alias) && !compare_node(block.variables.get(alias).init, value);
					alias = `${id.name}_${i++}`
				);
				alias_map.set(alias, id.name);
				id = { type: 'Identifier', name: alias };
				found = block.variables.has(alias);
			}
			args.push(id);
			if (!found) {
				block.add_variable(id, value);
			}
		}

		const assign = block.get_unique_name(`assign_${variable.name}`);
		const unassign = block.get_unique_name(`unassign_${variable.name}`);

		block.chunks.init.push(b`
			const ${assign} = () => ${callee}(${variable}, ${args});
			const ${unassign} = () => ${callee}(null, ${args});
		`);

		const condition = Array.from(args)
			.map(name => x`${name} !== ${block.renderer.reference(alias_map.get(name.name) || name.name)}`)
			.reduce((lhs, rhs) => x`${lhs} || ${rhs}`);

		// we push unassign and unshift assign so that references are
		// nulled out before they're created, to avoid glitches
		// with shifting indices
		block.chunks.update.push(b`
			if (${condition}) {
				${unassign}();
				${args.map(a => b`${a} = ${block.renderer.reference(alias_map.get(a.name) || a.name)}`)};
				${assign}();
			}`
		);

		block.chunks.destroy.push(b`${unassign}();`);
		return b`${assign}();`;
	}

	component.partly_hoisted.push(b`
		function ${fn}($$value) {
			@binding_callbacks[$$value ? 'unshift' : 'push'](() => {
				${body}
			});
		}
	`);

	block.chunks.destroy.push(b`${callee}(null);`);
	return b`${callee}(${variable});`;
}

class Node {
	
	
	
	
	

	
	

	
	
	

	constructor(component, parent, _scope, info) {
		this.start = info.start;
		this.end = info.end;
		this.type = info.type;

		// this makes properties non-enumerable, which makes logging
		// bearable. might have a performance cost. TODO remove in prod?
		Object.defineProperties(this, {
			component: {
				value: component
			},
			parent: {
				value: parent
			}
		});
	}

	cannot_use_innerhtml() {
		if (this.can_use_innerhtml !== false) {
			this.can_use_innerhtml = false;
			if (this.parent) this.parent.cannot_use_innerhtml();
		}
	}

	find_nearest(selector) {
		if (selector.test(this.type)) return this;
		if (this.parent) return this.parent.find_nearest(selector);
	}

	get_static_attribute_value(name) {
		const attribute = this.attributes && this.attributes.find(
			(attr) => attr.type === 'Attribute' && attr.name.toLowerCase() === name
		);

		if (!attribute) return null;

		if (attribute.is_true) return true;
		if (attribute.chunks.length === 0) return '';

		if (attribute.chunks.length === 1 && attribute.chunks[0].type === 'Text') {
			return (attribute.chunks[0] ).data;
		}

		return null;
	}

	has_ancestor(type) {
		return this.parent ?
			this.parent.type === type || this.parent.has_ancestor(type) :
			false;
	}
}

function create_scopes(expression) {
	return analyze(expression);
}

function is_dynamic$1(variable) {
	if (variable) {
		if (variable.mutated || variable.reassigned) return true; // dynamic internal state
		if (!variable.module && variable.writable && variable.export_name) return true; // writable props
		if (is_reserved_keyword(variable.name)) return true;
	}

	return false;
}

function nodes_match(a, b) {
	if (!!a !== !!b) return false;
	if (Array.isArray(a) !== Array.isArray(b)) return false;

	if (a && typeof a === 'object') {
		if (Array.isArray(a)) {
			if (a.length !== b.length) return false;
			return a.every((child, i) => nodes_match(child, b[i]));
		}

		const a_keys = Object.keys(a).sort();
		const b_keys = Object.keys(b).sort();

		if (a_keys.length !== b_keys.length) return false;

		let i = a_keys.length;
		while (i--) {
			const key = a_keys[i];
			if (b_keys[i] !== key) return false;

			if (key === 'start' || key === 'end') continue;

			if (!nodes_match(a[key], b[key])) {
				return false;
			}
		}

		return true;
	}

	return a === b;
}

function invalidate(renderer, scope, node, names, main_execution_context = false) {
	const { component } = renderer;

	const [head, ...tail] = Array.from(names)
		.filter(name => {
			const owner = scope.find_owner(name);
			return !owner || owner === component.instance_scope;
		})
		.map(name => component.var_lookup.get(name))
		.filter(variable =>	{
			return variable && (
				!variable.hoistable &&
				!variable.global &&
				!variable.module &&
				(
					variable.referenced ||
					variable.subscribable ||
					variable.is_reactive_dependency ||
					variable.export_name ||
					variable.name[0] === '$'
				)
			);
		}) ;

	function get_invalidated(variable, node) {
		if (main_execution_context && !variable.subscribable && variable.name[0] !== '$') {
			return node;
		}
		return renderer_invalidate(renderer, variable.name, undefined, main_execution_context);
	}

	if (!head) {
		return node;
	}

	component.has_reactive_assignments = true;

	if (node.type === 'AssignmentExpression' && node.operator === '=' && nodes_match(node.left, node.right) && tail.length === 0) {
		return get_invalidated(head, node);
	}

	const is_store_value = head.name[0] === '$' && head.name[1] !== '$';
	const extra_args = tail.map(variable => get_invalidated(variable)).filter(Boolean);

	if (is_store_value) {
		return x`@set_store_value(${head.name.slice(1)}, ${node}, ${head.name}, ${extra_args})`;
	}
	
	let invalidate;
	if (!main_execution_context) {
		const pass_value = (
			extra_args.length > 0 ||
			(node.type === 'AssignmentExpression' && node.left.type !== 'Identifier') ||
			(node.type === 'UpdateExpression' && (!node.prefix || node.argument.type !== 'Identifier'))
		);
		if (pass_value) {
			extra_args.unshift({
				type: 'Identifier',
				name: head.name
			});
		}
		invalidate = x`$$invalidate(${renderer.context_lookup.get(head.name).index}, ${node}, ${extra_args})`;
	} else {
		// skip `$$invalidate` if it is in the main execution context
		invalidate = extra_args.length ? [node, ...extra_args] : node;
	}

	if (head.subscribable && head.reassigned) {
		const subscribe = `$$subscribe_${head.name}`;
		invalidate = x`${subscribe}(${invalidate})`;
	}

	return invalidate;
}

function renderer_invalidate(renderer, name, value, main_execution_context = false) {
	const variable = renderer.component.var_lookup.get(name);

	if (variable && (variable.subscribable && (variable.reassigned || variable.export_name))) {
		if (main_execution_context) {
			return x`${`$$subscribe_${name}`}(${value || name})`;
		} else {
			const member = renderer.context_lookup.get(name);
			return x`${`$$subscribe_${name}`}($$invalidate(${member.index}, ${value || name}))`;
		}
	}

	if (name[0] === '$' && name[1] !== '$') {
		return x`${name.slice(1)}.set(${value || name})`;
	}

	if (
		variable && (
			variable.module || (
				!variable.referenced &&
				!variable.is_reactive_dependency &&
				!variable.export_name &&
				!name.startsWith('$$')
			)
		)
	) {
		return value || name;
	}

	if (value) {
		if (main_execution_context) {
			return x`${value}`;
		} else {
			const member = renderer.context_lookup.get(name);
			return x`$$invalidate(${member.index}, ${value})`;
		}
	}

	if (main_execution_context) return;

	// if this is a reactive declaration, invalidate dependencies recursively
	const deps = new Set([name]);

	deps.forEach(name => {
		const reactive_declarations = renderer.component.reactive_declarations.filter(x =>
			x.assignees.has(name)
		);
		reactive_declarations.forEach(declaration => {
			declaration.dependencies.forEach(name => {
				deps.add(name);
			});
		});
	});

	// TODO ideally globals etc wouldn't be here in the first place
	const filtered = Array.from(deps).filter(n => renderer.context_lookup.has(n));
	if (!filtered.length) return null;

	return filtered
		.map(n => x`$$invalidate(${renderer.context_lookup.get(n).index}, ${n})`)
		.reduce((lhs, rhs) => x`${lhs}, ${rhs}`);
}

class Expression {
	__init() {this.type = 'Expression';}
	
	
	
	__init2() {this.references = new Set();}
	__init3() {this.dependencies = new Set();}
	__init4() {this.contextual_dependencies = new Set();}

	
	
	

	__init5() {this.declarations = [];}
	__init6() {this.uses_context = false;}

	

	constructor(component, owner, template_scope, info, lazy) {Expression.prototype.__init.call(this);Expression.prototype.__init2.call(this);Expression.prototype.__init3.call(this);Expression.prototype.__init4.call(this);Expression.prototype.__init5.call(this);Expression.prototype.__init6.call(this);
		// TODO revert to direct property access in prod?
		Object.defineProperties(this, {
			component: {
				value: component
			}
		});

		this.node = info;
		this.template_scope = template_scope;
		this.owner = owner;

		const { dependencies, contextual_dependencies, references } = this;

		let { map, scope } = create_scopes(info);
		this.scope = scope;
		this.scope_map = map;

		const expression = this;
		let function_expression;

		// discover dependencies, but don't change the code yet
		walk(info, {
			enter(node, parent, key) {
				// don't manipulate shorthand props twice
				if (key === 'value' && parent.shorthand) return;
				// don't manipulate `import.meta`, `new.target`
				if (node.type === 'MetaProperty') return this.skip();

				if (map.has(node)) {
					scope = map.get(node);
				}

				if (!function_expression && /FunctionExpression/.test(node.type)) {
					function_expression = node;
				}

				if (isReference(node, parent)) {
					const { name, nodes } = flatten_reference(node);
					references.add(name);

					if (scope.has(name)) return;

					if (name[0] === '$') {
						const store_name = name.slice(1);
						if (template_scope.names.has(store_name) || scope.has(store_name)) {
							component.error(node, {
								code: 'contextual-store',
								message: 'Stores must be declared at the top level of the component (this may change in a future version of Svelte)'
							});
						}
					}

					if (template_scope.is_let(name)) {
						if (!function_expression) { // TODO should this be `!lazy` ?
							contextual_dependencies.add(name);
							dependencies.add(name);
						}
					} else if (template_scope.names.has(name)) {
						expression.uses_context = true;

						contextual_dependencies.add(name);

						const owner = template_scope.get_owner(name);
						const is_index = owner.type === 'EachBlock' && owner.key && name === owner.index;

						if (!lazy || is_index) {
							template_scope.dependencies_for_name.get(name).forEach(name => dependencies.add(name));
						}
					} else {
						if (!lazy) {
							dependencies.add(name);
						}

						component.add_reference(name);
						component.warn_if_undefined(name, nodes[0], template_scope);
					}

					this.skip();
				}

				// track any assignments from template expressions as mutable
				let names;
				let deep = false;

				if (function_expression) {
					if (node.type === 'AssignmentExpression') {
						deep = node.left.type === 'MemberExpression';
						names = extract_names(deep ? get_object(node.left) : node.left);
					} else if (node.type === 'UpdateExpression') {
						names = extract_names(get_object(node.argument));
					}
				}

				if (names) {
					names.forEach(name => {
						if (template_scope.names.has(name)) {
							template_scope.dependencies_for_name.get(name).forEach(name => {
								const variable = component.var_lookup.get(name);
								if (variable) variable[deep ? 'mutated' : 'reassigned'] = true;
							});
							const each_block = template_scope.get_owner(name);
							(each_block ).has_binding = true;
						} else {
							component.add_reference(name);

							const variable = component.var_lookup.get(name);
							if (variable) variable[deep ? 'mutated' : 'reassigned'] = true;
						}
					});
				}
			},

			leave(node) {
				if (map.has(node)) {
					scope = scope.parent;
				}

				if (node === function_expression) {
					function_expression = null;
				}
			}
		});
	}

	dynamic_dependencies() {
		return Array.from(this.dependencies).filter(name => {
			if (this.template_scope.is_let(name)) return true;
			if (is_reserved_keyword(name)) return true;

			const variable = this.component.var_lookup.get(name);
			return is_dynamic$1(variable);
		});
	}

	// TODO move this into a render-dom wrapper?
	manipulate(block) {
		// TODO ideally we wouldn't end up calling this method
		// multiple times
		if (this.manipulated) return this.manipulated;

		const {
			component,
			declarations,
			scope_map: map,
			template_scope,
			owner
		} = this;
		let scope = this.scope;

		let function_expression;

		let dependencies;
		let contextual_dependencies;

		const node = walk(this.node, {
			enter(node, parent) {
				if (node.type === 'Property' && node.shorthand) {
					node.value = JSON.parse(JSON.stringify(node.value));
					node.shorthand = false;
				}

				if (map.has(node)) {
					scope = map.get(node);
				}

				if (node.type === 'Identifier' && isReference(node, parent)) {
					const { name } = flatten_reference(node);

					if (scope.has(name)) return;

					if (function_expression) {
						if (template_scope.names.has(name)) {
							contextual_dependencies.add(name);

							template_scope.dependencies_for_name.get(name).forEach(dependency => {
								dependencies.add(dependency);
							});
						} else {
							dependencies.add(name);
							component.add_reference(name); // TODO is this redundant/misplaced?
						}
					} else if (is_contextual(component, template_scope, name)) {
						const reference = block.renderer.reference(node);
						this.replace(reference);
					}

					this.skip();
				}

				if (!function_expression) {
					if (node.type === 'AssignmentExpression') ;

					if (node.type === 'FunctionExpression' || node.type === 'ArrowFunctionExpression') {
						function_expression = node;
						dependencies = new Set();
						contextual_dependencies = new Set();
					}
				}
			},

			leave(node, parent) {
				if (map.has(node)) scope = scope.parent;

				if (node === function_expression) {
					const id = component.get_unique_name(
						sanitize(get_function_name(node, owner))
					);

					const declaration = b`const ${id} = ${node}`;

					if (dependencies.size === 0 && contextual_dependencies.size === 0) {
						// we can hoist this out of the component completely
						component.fully_hoisted.push(declaration);

						this.replace(id );

						component.add_var({
							name: id.name,
							internal: true,
							hoistable: true,
							referenced: true
						});
					} else if (contextual_dependencies.size === 0) {
						// function can be hoisted inside the component init
						component.partly_hoisted.push(declaration);

						block.renderer.add_to_context(id.name);
						this.replace(block.renderer.reference(id));
					} else {
						// we need a combo block/init recipe
						const deps = Array.from(contextual_dependencies);
						const function_expression = node ;

						const has_args = function_expression.params.length > 0;
						function_expression.params = [
							...deps.map(name => ({ type: 'Identifier', name } )),
							...function_expression.params
						];

						const context_args = deps.map(name => block.renderer.reference(name));

						component.partly_hoisted.push(declaration);

						block.renderer.add_to_context(id.name);
						const callee = block.renderer.reference(id);

						this.replace(id );

						const func_declaration = has_args
							? b`function ${id}(...args) {
								return ${callee}(${context_args}, ...args);
							}`
							: b`function ${id}() {
								return ${callee}(${context_args});
							}`;

						if (owner.type === 'Attribute' && owner.parent.name === 'slot') {
							const dep_scopes = new Set(deps.map(name => template_scope.get_owner(name)));
							// find the nearest scopes
							let node = owner.parent;
							while (node && !dep_scopes.has(node)) {
								node = node.parent;
							}

							const func_expression = func_declaration[0];

							if (node.type === 'InlineComponent') {
								// <Comp let:data />
								this.replace(func_expression);
							} else {
								// {#each}, {#await}
								const func_id = component.get_unique_name(id.name + '_func');
								block.renderer.add_to_context(func_id.name, true);
								// rename #ctx -> child_ctx;
								walk(func_expression, {
									enter(node) {
										if (node.type === 'Identifier' && node.name === '#ctx') {
											node.name = 'child_ctx';
										}
									}
								});
								// add to get_xxx_context
								// child_ctx[x] = function () { ... }
								(template_scope.get_owner(deps[0]) ).contexts.push({
									key: func_id,
									modifier: () => func_expression,
									default_modifier: node => node
								});
								this.replace(block.renderer.reference(func_id));
							}
						} else {
							declarations.push(func_declaration);
						}
					}

					function_expression = null;
					dependencies = null;
					contextual_dependencies = null;

					if (parent && parent.type === 'Property') {
						parent.method = false;
					}
				}

				if (node.type === 'AssignmentExpression' || node.type === 'UpdateExpression') {
					const assignee = node.type === 'AssignmentExpression' ? node.left : node.argument;

					const object_name = get_object(assignee).name;

					if (scope.has(object_name)) return;

					// normally (`a = 1`, `b.c = 2`), there'll be a single name
					// (a or b). In destructuring cases (`[d, e] = [e, d]`) there
					// may be more, in which case we need to tack the extra ones
					// onto the initial function call
					const names = new Set(extract_names(assignee));

					const traced = new Set();
					names.forEach(name => {
						const dependencies = template_scope.dependencies_for_name.get(name);
						if (dependencies) {
							dependencies.forEach(name => traced.add(name));
						} else {
							traced.add(name);
						}
					});

					const context = block.bindings.get(object_name);

					if (context) {
						// for `{#each array as item}`
						// replace `item = 1` to `each_array[each_index] = 1`, this allow us to mutate the array
						// rather than mutating the local `item` variable
						const { snippet, object, property } = context;
						const replaced = replace_object(assignee, snippet);
						if (node.type === 'AssignmentExpression') {
							node.left = replaced;
						} else {
							node.argument = replaced;
						}
						contextual_dependencies.add(object.name);
						contextual_dependencies.add(property.name);
					}

					this.replace(invalidate(block.renderer, scope, node, traced));
				}
			}
		});

		if (declarations.length > 0) {
			block.maintain_context = true;
			declarations.forEach(declaration => {
				block.chunks.init.push(declaration);
			});
		}

		return (this.manipulated = node );
	}
}

function get_function_name(_node, parent) {
	if (parent.type === 'EventHandler') {
		return `${parent.name}_handler`;
	}

	if (parent.type === 'Action') {
		return `${parent.name}_function`;
	}

	return 'func';
}

class Action extends Node {
	
	
	
	
	

	constructor(component, parent, scope, info) {
		super(component, parent, scope, info);

		const object = info.name.split('.')[0];
		component.warn_if_undefined(object, info, scope);

		this.name = info.name;
		component.add_reference(object);

		this.expression = info.expression
			? new Expression(component, this, scope, info.expression)
			: null;

		this.template_scope = scope;

		this.uses_context = this.expression && this.expression.uses_context;
	}
}

class Tag extends Wrapper {
	

	constructor(renderer, block, parent, node) {
		super(renderer, block, parent, node);

		this.cannot_use_innerhtml();
		if (!this.is_dependencies_static()) {
			this.not_static_content();
		}

		block.add_dependencies(node.expression.dependencies);
	}

	is_dependencies_static() {
		return this.node.expression.contextual_dependencies.size === 0 && this.node.expression.dynamic_dependencies().length === 0;
	}

	rename_this_method(
		block,
		update
	) {
		const dependencies = this.node.expression.dynamic_dependencies();
		let snippet = this.node.expression.manipulate(block);

		const value = this.node.should_cache && block.get_unique_name(`${this.var.name}_value`);
		const content = this.node.should_cache ? value : snippet;

		snippet = x`${snippet} + ""`;

		if (this.node.should_cache) block.add_variable(value, snippet); // TODO may need to coerce snippet to string

		if (dependencies.length > 0) {
			let condition = block.renderer.dirty(dependencies);

			if (block.has_outros) {
				condition = x`!#current || ${condition}`;
			}

			const update_cached_value = x`${value} !== (${value} = ${snippet})`;

			if (this.node.should_cache) {
				condition = x`${condition} && ${update_cached_value}`;
			}

			block.chunks.update.push(b`if (${condition}) ${update(content )}`);
		}

		return { init: content };
	}
}

class MustacheTagWrapper extends Tag {
	__init() {this.var = { type: 'Identifier', name: 't' };}

	constructor(renderer, block, parent, node) {
		super(renderer, block, parent, node);MustacheTagWrapper.prototype.__init.call(this);	}

	render(block, parent_node, parent_nodes) {
		const { init } = this.rename_this_method(
			block,
			value => x`@set_data(${this.var}, ${value})`
		);

		block.add_element(
			this.var,
			x`@text(${init})`,
			parent_nodes && x`@claim_text(${parent_nodes}, ${init})`,
			parent_node
		);
	}
}

class RawMustacheTagWrapper extends Tag {
	__init() {this.var = { type: 'Identifier', name: 'raw' };}

	constructor(
		renderer,
		block,
		parent,
		node
	) {
		super(renderer, block, parent, node);RawMustacheTagWrapper.prototype.__init.call(this);		this.cannot_use_innerhtml();
		this.not_static_content();
	}

	render(block, parent_node, _parent_nodes) {
		const in_head = is_head(parent_node);

		const can_use_innerhtml = !in_head && parent_node && !this.prev && !this.next;

		if (can_use_innerhtml) {
			const insert = content => b`${parent_node}.innerHTML = ${content};`[0];

			const { init } = this.rename_this_method(
				block,
				content => insert(content)
			);

			block.chunks.mount.push(insert(init));
		} else {
			const needs_anchor = in_head || (this.next ? !this.next.is_dom_node() : (!this.parent || !this.parent.is_dom_node()));

			const html_tag = block.get_unique_name('html_tag');
			const html_anchor = needs_anchor && block.get_unique_name('html_anchor');

			block.add_variable(html_tag);

			const { init } = this.rename_this_method(
				block,
				content => x`${html_tag}.p(${content})`
			);

			const update_anchor = needs_anchor ? html_anchor : this.next ? this.next.var : 'null';

			block.chunks.hydrate.push(b`${html_tag} = new @HtmlTag(${update_anchor});`);
			block.chunks.mount.push(b`${html_tag}.m(${init}, ${parent_node || '#target'}, ${parent_node ? null : '#anchor'});`);

			if (needs_anchor) {
				block.add_element(html_anchor, x`@empty()`, x`@empty()`, parent_node);
			}

			if (!parent_node || in_head) {
				block.chunks.destroy.push(b`if (detaching) ${html_tag}.d();`);
			}
		}
	}
}

const events = [
	{
		event_names: ['input'],
		filter: (node, _name) =>
			node.name === 'textarea' ||
			node.name === 'input' && !/radio|checkbox|range|file/.test(node.get_static_attribute_value('type') )
	},
	{
		event_names: ['input'],
		filter: (node, name) =>
			(name === 'textContent' || name === 'innerHTML') &&
			node.attributes.some(attribute => attribute.name === 'contenteditable')
	},
	{
		event_names: ['change'],
		filter: (node, _name) =>
			node.name === 'select' ||
			node.name === 'input' && /radio|checkbox|file/.test(node.get_static_attribute_value('type') )
	},
	{
		event_names: ['change', 'input'],
		filter: (node, _name) =>
			node.name === 'input' && node.get_static_attribute_value('type') === 'range'
	},

	{
		event_names: ['elementresize'],
		filter: (_node, name) =>
			dimensions.test(name)
	},

	// media events
	{
		event_names: ['timeupdate'],
		filter: (node, name) =>
			node.is_media_node() &&
			(name === 'currentTime' || name === 'played' || name === 'ended')
	},
	{
		event_names: ['durationchange'],
		filter: (node, name) =>
			node.is_media_node() &&
			name === 'duration'
	},
	{
		event_names: ['play', 'pause'],
		filter: (node, name) =>
			node.is_media_node() &&
			name === 'paused'
	},
	{
		event_names: ['progress'],
		filter: (node, name) =>
			node.is_media_node() &&
			name === 'buffered'
	},
	{
		event_names: ['loadedmetadata'],
		filter: (node, name) =>
			node.is_media_node() &&
			(name === 'buffered' || name === 'seekable')
	},
	{
		event_names: ['volumechange'],
		filter: (node, name) =>
			node.is_media_node() &&
			(name === 'volume' || name === 'muted')
	},
	{
		event_names: ['ratechange'],
		filter: (node, name) =>
			node.is_media_node() &&
			name === 'playbackRate'
	},
	{
		event_names: ['seeking', 'seeked'],
		filter: (node, name) =>
			node.is_media_node() &&
			(name === 'seeking')
	},
	{
		event_names: ['ended'],
		filter: (node, name) =>
			node.is_media_node() &&
			name === 'ended'
	},
	{
		event_names: ['resize'],
		filter: (node, name) =>
			node.is_media_node() &&
			(name === 'videoHeight' || name === 'videoWidth')
	},

	// details event
	{
		event_names: ['toggle'],
		filter: (node, _name) =>
			node.name === 'details'
	}
];

class ElementWrapper extends Wrapper {
	
	
	
	
	
	

	

	
	

	constructor(
		renderer,
		block,
		parent,
		node,
		strip_whitespace,
		next_sibling
	) {
		super(renderer, block, parent, node);
		this.var = {
			type: 'Identifier',
			name: node.name.replace(/[^a-zA-Z0-9_$]/g, '_')
		};

		this.void = is_void(node.name);

		this.class_dependencies = [];

		if (this.node.children.length) {
			this.node.lets.forEach(l => {
				extract_names(l.value || l.name).forEach(name => {
					renderer.add_to_context(name, true);
				});
			});
		}

		this.attributes = this.node.attributes.map(attribute => {
			if (attribute.name === 'style') {
				return new StyleAttributeWrapper(this, block, attribute);
			}
			if (attribute.type === 'Spread') {
				return new SpreadAttributeWrapper(this, block, attribute);
			}
			return new AttributeWrapper(this, block, attribute);
		});

		// ordinarily, there'll only be one... but we need to handle
		// the rare case where an element can have multiple bindings,
		// e.g. <audio bind:paused bind:currentTime>
		this.bindings = this.node.bindings.map(binding => new BindingWrapper(block, binding, this));

		this.event_handlers = this.node.handlers.map(event_handler => new EventHandlerWrapper(event_handler, this));

		if (node.intro || node.outro) {
			if (node.intro) block.add_intro(node.intro.is_local);
			if (node.outro) block.add_outro(node.outro.is_local);
		}

		if (node.animation) {
			block.add_animation();
		}

		// add directive and handler dependencies
		[node.animation, node.outro, ...node.actions, ...node.classes].forEach(directive => {
			if (directive && directive.expression) {
				block.add_dependencies(directive.expression.dependencies);
			}
		});

		node.handlers.forEach(handler => {
			if (handler.expression) {
				block.add_dependencies(handler.expression.dependencies);
			}
		});

		if (this.parent) {
			if (node.actions.length > 0 ||
				node.animation ||
				node.bindings.length > 0 ||
				node.classes.length > 0 ||
				node.intro || node.outro ||
				node.handlers.length > 0 ||
				this.node.name === 'option' ||
				renderer.options.dev
			) {
				this.parent.cannot_use_innerhtml(); // need to use add_location
				this.parent.not_static_content();
			}
		}

		this.fragment = new FragmentWrapper(renderer, block, node.children, this, strip_whitespace, next_sibling);
	}

	render(block, parent_node, parent_nodes) {
		const { renderer } = this;

		if (this.node.name === 'noscript') return;

		const node = this.var;
		const nodes = parent_nodes && block.get_unique_name(`${this.var.name}_nodes`); // if we're in unclaimable territory, i.e. <head>, parent_nodes is null
		const children = x`@children(${this.node.name === 'template' ? x`${node}.content` : node})`;

		block.add_variable(node);
		const render_statement = this.get_render_statement(block);
		block.chunks.create.push(
			b`${node} = ${render_statement};`
		);

		if (renderer.options.hydratable) {
			if (parent_nodes) {
				block.chunks.claim.push(b`
					${node} = ${this.get_claim_statement(parent_nodes)};
				`);

				if (!this.void && this.node.children.length > 0) {
					block.chunks.claim.push(b`
						var ${nodes} = ${children};
					`);
				}
			} else {
				block.chunks.claim.push(
					b`${node} = ${render_statement};`
				);
			}
		}

		if (parent_node) {
			block.chunks.mount.push(
				b`@append(${parent_node}, ${node});`
			);

			if (is_head(parent_node)) {
				block.chunks.destroy.push(b`@detach(${node});`);
			}
		} else {
			block.chunks.mount.push(b`@insert(#target, ${node}, #anchor);`);

			// TODO we eventually need to consider what happens to elements
			// that belong to the same outgroup as an outroing element...
			block.chunks.destroy.push(b`if (detaching) @detach(${node});`);
		}

		// insert static children with textContent or innerHTML
		const can_use_textcontent = this.can_use_textcontent();
		if (!this.node.namespace && (this.can_use_innerhtml || can_use_textcontent) && this.fragment.nodes.length > 0) {
			if (this.fragment.nodes.length === 1 && this.fragment.nodes[0].node.type === 'Text') {
				block.chunks.create.push(
					b`${node}.textContent = ${string_literal((this.fragment.nodes[0] ).data)};`
				);
			} else {
				const state = {
					quasi: {
						type: 'TemplateElement',
						value: { raw: '' }
					}
				};

				const literal = {
					type: 'TemplateLiteral',
					expressions: [],
					quasis: []
				};

				const can_use_raw_text = !this.can_use_innerhtml && can_use_textcontent;
				to_html((this.fragment.nodes ), block, literal, state, can_use_raw_text);
				literal.quasis.push(state.quasi);

				block.chunks.create.push(
					b`${node}.${this.can_use_innerhtml ? 'innerHTML' : 'textContent'} = ${literal};`
				);
			}
		} else {
			this.fragment.nodes.forEach((child) => {
				child.render(
					block,
					this.node.name === 'template' ? x`${node}.content` : node,
					nodes
				);
			});
		}

		const event_handler_or_binding_uses_context = (
			this.bindings.some(binding => binding.handler.uses_context) ||
			this.node.handlers.some(handler => handler.uses_context) ||
			this.node.actions.some(action => action.uses_context)
		);

		if (event_handler_or_binding_uses_context) {
			block.maintain_context = true;
		}

		this.add_attributes(block);
		this.add_directives_in_order(block);
		this.add_transitions(block);
		this.add_animation(block);
		this.add_classes(block);
		this.add_manual_style_scoping(block);

		if (nodes && this.renderer.options.hydratable && !this.void) {
			block.chunks.claim.push(
				b`${this.node.children.length > 0 ? nodes : children}.forEach(@detach);`
			);
		}

		if (renderer.options.dev) {
			const loc = renderer.locate(this.node.start);
			block.chunks.hydrate.push(
				b`@add_location(${this.var}, ${renderer.file_var}, ${loc.line - 1}, ${loc.column}, ${this.node.start});`
			);
		}
	}

	can_use_textcontent() {
		return this.is_static_content && this.fragment.nodes.every(node => node.node.type === 'Text' || node.node.type === 'MustacheTag');
	}

	get_render_statement(block) {
		const { name, namespace } = this.node;

		if (namespace === namespaces.svg) {
			return x`@svg_element("${name}")`;
		}

		if (namespace) {
			return x`@_document.createElementNS("${namespace}", "${name}")`;
		}

		const is = this.attributes.find(attr => attr.node.name === 'is') ;
		if (is) {
			return x`@element_is("${name}", ${is.render_chunks(block).reduce((lhs, rhs) => x`${lhs} + ${rhs}`)})`;
		}

		return x`@element("${name}")`;
	}

	get_claim_statement(nodes) {
		const attributes = this.node.attributes
			.filter((attr) => attr.type === 'Attribute')
			.map((attr) => p`${attr.name}: true`);

		const name = this.node.namespace
			? this.node.name
			: this.node.name.toUpperCase();

		const svg = this.node.namespace === namespaces.svg ? 1 : null;

		return x`@claim_element(${nodes}, "${name}", { ${attributes} }, ${svg})`;
	}

	add_directives_in_order (block) {
		

		const binding_groups = events
			.map(event => ({
				events: event.event_names,
				bindings: this.bindings
					.filter(binding => binding.node.name !== 'this')
					.filter(binding => event.filter(this.node, binding.node.name))
			}))
			.filter(group => group.bindings.length);

		const this_binding = this.bindings.find(b => b.node.name === 'this');

		function getOrder (item) {
			if (item instanceof EventHandlerWrapper) {
				return item.node.start;
			} else if (item instanceof BindingWrapper) {
				return item.node.start;
			} else if (item instanceof Action) {
				return item.start;
			} else {
				return item.bindings[0].node.start;
			}
		}

		([
			...binding_groups,
			...this.event_handlers,
			this_binding,
			...this.node.actions
		] )
			.filter(Boolean)
			.sort((a, b) => getOrder(a) - getOrder(b))
			.forEach(item => {
				if (item instanceof EventHandlerWrapper) {
					add_event_handler(block, this.var, item);
				} else if (item instanceof BindingWrapper) {
					this.add_this_binding(block, item);
				} else if (item instanceof Action) {
					add_action(block, this.var, item);
				} else {
					this.add_bindings(block, item);
				}
			});
	}

	add_bindings(block, binding_group) {
		const { renderer } = this;

		if (binding_group.bindings.length === 0) return;

		renderer.component.has_reactive_assignments = true;

		const lock = binding_group.bindings.some(binding => binding.needs_lock) ?
			block.get_unique_name(`${this.var.name}_updating`) :
			null;

		if (lock) block.add_variable(lock, x`false`);

		const handler = renderer.component.get_unique_name(`${this.var.name}_${binding_group.events.join('_')}_handler`);
		renderer.add_to_context(handler.name);

		// TODO figure out how to handle locks
		const needs_lock = binding_group.bindings.some(binding => binding.needs_lock);

		const dependencies = new Set();
		const contextual_dependencies = new Set();

		binding_group.bindings.forEach(binding => {
			// TODO this is a mess
			add_to_set(dependencies, binding.get_dependencies());
			add_to_set(contextual_dependencies, binding.handler.contextual_dependencies);

			binding.render(block, lock);
		});

		// media bindings — awkward special case. The native timeupdate events
		// fire too infrequently, so we need to take matters into our
		// own hands
		let animation_frame;
		if (binding_group.events[0] === 'timeupdate') {
			animation_frame = block.get_unique_name(`${this.var.name}_animationframe`);
			block.add_variable(animation_frame);
		}

		const has_local_function = contextual_dependencies.size > 0 || needs_lock || animation_frame;

		let callee = renderer.reference(handler);

		// TODO dry this out — similar code for event handlers and component bindings
		if (has_local_function) {
			const args = Array.from(contextual_dependencies).map(name => renderer.reference(name));

			// need to create a block-local function that calls an instance-level function
			if (animation_frame) {
				block.chunks.init.push(b`
					function ${handler}() {
						@_cancelAnimationFrame(${animation_frame});
						if (!${this.var}.paused) {
							${animation_frame} = @raf(${handler});
							${needs_lock && b`${lock} = true;`}
						}
						${callee}.call(${this.var}, ${args});
					}
				`);
			} else {
				block.chunks.init.push(b`
					function ${handler}() {
						${needs_lock && b`${lock} = true;`}
						${callee}.call(${this.var}, ${args});
					}
				`);
			}

			callee = handler;
		}

		const params = Array.from(contextual_dependencies).map(name => ({
			type: 'Identifier',
			name
		}));

		this.renderer.component.partly_hoisted.push(b`
			function ${handler}(${params}) {
				${binding_group.bindings.map(b => b.handler.mutation)}
				${Array.from(dependencies)
					.filter(dep => dep[0] !== '$')
					.filter(dep => !contextual_dependencies.has(dep))
					.map(dep => b`${this.renderer.invalidate(dep)};`)}
			}
		`);

		binding_group.events.forEach(name => {
			if (name === 'elementresize') {
				// special case
				const resize_listener = block.get_unique_name(`${this.var.name}_resize_listener`);
				block.add_variable(resize_listener);

				block.chunks.mount.push(
					b`${resize_listener} = @add_resize_listener(${this.var}, ${callee}.bind(${this.var}));`
				);

				block.chunks.destroy.push(
					b`${resize_listener}();`
				);
			} else {
				block.event_listeners.push(
					x`@listen(${this.var}, "${name}", ${callee})`
				);
			}
		});

		const some_initial_state_is_undefined = binding_group.bindings
			.map(binding => x`${binding.snippet} === void 0`)
			.reduce((lhs, rhs) => x`${lhs} || ${rhs}`);

		const should_initialise = (
			this.node.name === 'select' ||
			binding_group.bindings.find(binding => {
				return (
					binding.node.name === 'indeterminate' ||
					binding.node.name === 'textContent' ||
					binding.node.name === 'innerHTML' ||
					binding.is_readonly_media_attribute()
				);
			})
		);

		if (should_initialise) {
			const callback = has_local_function ? handler : x`() => ${callee}.call(${this.var})`;
			block.chunks.hydrate.push(
				b`if (${some_initial_state_is_undefined}) @add_render_callback(${callback});`
			);
		}

		if (binding_group.events[0] === 'elementresize') {
			block.chunks.hydrate.push(
				b`@add_render_callback(() => ${callee}.call(${this.var}));`
			);
		}

		if (lock) {
			block.chunks.update.push(b`${lock} = false;`);
		}
	}

	add_this_binding(block, this_binding) {
		const { renderer } = this;

		renderer.component.has_reactive_assignments = true;

		const binding_callback = bind_this(renderer.component, block, this_binding, this.var);
		block.chunks.mount.push(binding_callback);
	}

	add_attributes(block) {
		// Get all the class dependencies first
		this.attributes.forEach((attribute) => {
			if (attribute.node.name === 'class') {
				const dependencies = attribute.node.get_dependencies();
				this.class_dependencies.push(...dependencies);
			}
		});

		if (this.node.attributes.some(attr => attr.is_spread)) {
			this.add_spread_attributes(block);
			return;
		}

		this.attributes.forEach((attribute) => {
			attribute.render(block);
		});
	}

	add_spread_attributes(block) {
		const levels = block.get_unique_name(`${this.var.name}_levels`);
		const data = block.get_unique_name(`${this.var.name}_data`);

		const initial_props = [];
		const updates = [];

		this.attributes
			.forEach(attr => {
				const dependencies = attr.node.get_dependencies();

				const condition = dependencies.length > 0
					? block.renderer.dirty(dependencies)
					: null;

				if (attr instanceof SpreadAttributeWrapper) {
					const snippet = attr.node.expression.manipulate(block);

					initial_props.push(snippet);

					updates.push(condition ? x`${condition} && ${snippet}` : snippet);
				} else {
					const name = attr.property_name || attr.name;
					initial_props.push(x`{ ${name}: ${attr.get_init(block, attr.get_value(block))} }`);
					const snippet = x`{ ${name}: ${attr.should_cache ? attr.last : attr.get_value(block)} }`;

					updates.push(condition ? x`${attr.get_dom_update_conditions(block, condition)} && ${snippet}` : snippet);
				}
			});

		block.chunks.init.push(b`
			let ${levels} = [${initial_props}];

			let ${data} = {};
			for (let #i = 0; #i < ${levels}.length; #i += 1) {
				${data} = @assign(${data}, ${levels}[#i]);
			}
		`);

		const fn = this.node.namespace === namespaces.svg ? x`@set_svg_attributes` : x`@set_attributes`;

		block.chunks.hydrate.push(
			b`${fn}(${this.var}, ${data});`
		);

		block.chunks.update.push(b`
			${fn}(${this.var}, ${data} = @get_spread_update(${levels}, [
				${updates}
			]));
		`);

		// handle edge cases for elements
		if (this.node.name === 'select') {
			const dependencies = new Set();
			for (const attr of this.attributes) {
				for (const dep of attr.node.dependencies) {
					dependencies.add(dep);
				}
			}

			block.chunks.mount.push(b`
				if (${data}.multiple) @select_options(${this.var}, ${data}.value);
			`);
			block.chunks.update.push(b`
				if (${block.renderer.dirty(Array.from(dependencies))} && ${data}.multiple) @select_options(${this.var}, ${data}.value);
			`);
		} else if (this.node.name === 'input' && this.attributes.find(attr => attr.node.name === 'value')) {
			const type = this.node.get_static_attribute_value('type');
			if (type === null || type === '' || type === 'text' || type === 'email' || type === 'password') {
				block.chunks.mount.push(b`
					${this.var}.value = ${data}.value;
				`);
				block.chunks.update.push(b`
					if ('value' in ${data}) {
						${this.var}.value = ${data}.value;
					}
				`);
			}
		}
	}

	add_transitions(
		block
	) {
		const { intro, outro } = this.node;
		if (!intro && !outro) return;

		if (intro === outro) {
			// bidirectional transition
			const name = block.get_unique_name(`${this.var.name}_transition`);
			const snippet = intro.expression
				? intro.expression.manipulate(block)
				: x`{}`;

			block.add_variable(name);

			const fn = this.renderer.reference(intro.name);

			const intro_block = b`
				@add_render_callback(() => {
					if (!${name}) ${name} = @create_bidirectional_transition(${this.var}, ${fn}, ${snippet}, true);
					${name}.run(1);
				});
			`;

			const outro_block = b`
				if (!${name}) ${name} = @create_bidirectional_transition(${this.var}, ${fn}, ${snippet}, false);
				${name}.run(0);
			`;

			if (intro.is_local) {
				block.chunks.intro.push(b`
					if (#local) {
						${intro_block}
					}
				`);

				block.chunks.outro.push(b`
					if (#local) {
						${outro_block}
					}
				`);
			} else {
				block.chunks.intro.push(intro_block);
				block.chunks.outro.push(outro_block);
			}

			block.chunks.destroy.push(b`if (detaching && ${name}) ${name}.end();`);
		} else {
			const intro_name = intro && block.get_unique_name(`${this.var.name}_intro`);
			const outro_name = outro && block.get_unique_name(`${this.var.name}_outro`);

			if (intro) {
				block.add_variable(intro_name);
				const snippet = intro.expression
					? intro.expression.manipulate(block)
					: x`{}`;

				const fn = this.renderer.reference(intro.name);

				let intro_block;

				if (outro) {
					intro_block = b`
						@add_render_callback(() => {
							if (${outro_name}) ${outro_name}.end(1);
							if (!${intro_name}) ${intro_name} = @create_in_transition(${this.var}, ${fn}, ${snippet});
							${intro_name}.start();
						});
					`;

					block.chunks.outro.push(b`if (${intro_name}) ${intro_name}.invalidate();`);
				} else {
					intro_block = b`
						if (!${intro_name}) {
							@add_render_callback(() => {
								${intro_name} = @create_in_transition(${this.var}, ${fn}, ${snippet});
								${intro_name}.start();
							});
						}
					`;
				}

				if (intro.is_local) {
					intro_block = b`
						if (#local) {
							${intro_block}
						}
					`;
				}

				block.chunks.intro.push(intro_block);
			}

			if (outro) {
				block.add_variable(outro_name);
				const snippet = outro.expression
					? outro.expression.manipulate(block)
					: x`{}`;

				const fn = this.renderer.reference(outro.name);

				if (!intro) {
					block.chunks.intro.push(b`
						if (${outro_name}) ${outro_name}.end(1);
					`);
				}

				// TODO hide elements that have outro'd (unless they belong to a still-outroing
				// group) prior to their removal from the DOM
				let outro_block = b`
					${outro_name} = @create_out_transition(${this.var}, ${fn}, ${snippet});
				`;

				if (outro.is_local) {
					outro_block = b`
						if (#local) {
							${outro_block}
						}
					`;
				}

				block.chunks.outro.push(outro_block);

				block.chunks.destroy.push(b`if (detaching && ${outro_name}) ${outro_name}.end();`);
			}
		}

		if ((intro && intro.expression && intro.expression.dependencies.size) || (outro && outro.expression && outro.expression.dependencies.size)) {
			block.maintain_context = true;
		}
	}

	add_animation(block) {
		if (!this.node.animation) return;

		const { outro } = this.node;

		const rect = block.get_unique_name('rect');
		const stop_animation = block.get_unique_name('stop_animation');

		block.add_variable(rect);
		block.add_variable(stop_animation, x`@noop`);

		block.chunks.measure.push(b`
			${rect} = ${this.var}.getBoundingClientRect();
		`);

		block.chunks.fix.push(b`
			@fix_position(${this.var});
			${stop_animation}();
			${outro && b`@add_transform(${this.var}, ${rect});`}
		`);

		let params;
		if (this.node.animation.expression) {
			params = this.node.animation.expression.manipulate(block);

			if (this.node.animation.expression.dynamic_dependencies().length) {
				// if `params` is dynamic, calculate params ahead of time in the `.r()` method
				const params_var = block.get_unique_name('params');
				block.add_variable(params_var);

				block.chunks.measure.push(b`${params_var} = ${params};`);
				params = params_var;
			}
		} else {
			params = x`{}`;
		}

		const name = this.renderer.reference(this.node.animation.name);

		block.chunks.animate.push(b`
			${stop_animation}();
			${stop_animation} = @create_animation(${this.var}, ${rect}, ${name}, ${params});
		`);
	}

	add_classes(block) {
		const has_spread = this.node.attributes.some(attr => attr.is_spread);
		this.node.classes.forEach(class_directive => {
			const { expression, name } = class_directive;
			let snippet;
			let dependencies;
			if (expression) {
				snippet = expression.manipulate(block);
				dependencies = expression.dependencies;
			} else {
				snippet = name;
				dependencies = new Set([name]);
			}
			const updater = b`@toggle_class(${this.var}, "${name}", ${snippet});`;

			block.chunks.hydrate.push(updater);

			if (has_spread) {
				block.chunks.update.push(updater);
			} else if ((dependencies && dependencies.size > 0) || this.class_dependencies.length) {
				const all_dependencies = this.class_dependencies.concat(...dependencies);
				const condition = block.renderer.dirty(all_dependencies);

				// If all of the dependencies are non-dynamic (don't get updated) then there is no reason
				// to add an updater for this.
				const any_dynamic_dependencies = all_dependencies.some((dep) => {
					const variable = this.renderer.component.var_lookup.get(dep);
					return !variable || is_dynamic$1(variable);
				});
				if (any_dynamic_dependencies) {
					block.chunks.update.push(b`
						if (${condition}) {
							${updater}
						}
					`);
				}
			}
		});
	}

	add_manual_style_scoping(block) {
		if (this.node.needs_manual_style_scoping) {
			const updater = b`@toggle_class(${this.var}, "${this.node.component.stylesheet.id}", true);`;
			block.chunks.hydrate.push(updater);
			block.chunks.update.push(updater);
		}
	}
}

function to_html(wrappers, block, literal, state, can_use_raw_text) {
	wrappers.forEach(wrapper => {
		if (wrapper instanceof TextWrapper) {
			if ((wrapper ).use_space()) state.quasi.value.raw += ' ';

			const parent = wrapper.node.parent ;

			const raw = parent && (
				parent.name === 'script' ||
				parent.name === 'style' ||
				can_use_raw_text
			);

			state.quasi.value.raw += (raw ? wrapper.data : escape_html(wrapper.data))
				.replace(/\\/g, '\\\\')
				.replace(/`/g, '\\`')
				.replace(/\$/g, '\\$');
		} else if (wrapper instanceof MustacheTagWrapper || wrapper instanceof RawMustacheTagWrapper) {
			literal.quasis.push(state.quasi);
			literal.expressions.push(wrapper.node.expression.manipulate(block));
			state.quasi = {
				type: 'TemplateElement',
				value: { raw: '' }
			};
		} else if (wrapper.node.name === 'noscript') ; else {
			// element
			state.quasi.value.raw += `<${wrapper.node.name}`;

			(wrapper ).attributes.forEach((attr) => {
				state.quasi.value.raw += ` ${fix_attribute_casing(attr.node.name)}="`;

				attr.node.chunks.forEach(chunk => {
					if (chunk.type === 'Text') {
						state.quasi.value.raw += escape_html(chunk.data);
					} else {
						literal.quasis.push(state.quasi);
						literal.expressions.push(chunk.manipulate(block));

						state.quasi = {
							type: 'TemplateElement',
							value: { raw: '' }
						};
					}
				});

				state.quasi.value.raw += '"';
			});

			if (!wrapper.void) {
				state.quasi.value.raw += '>';

				to_html(wrapper.fragment.nodes , block, literal, state);

				state.quasi.value.raw += `</${wrapper.node.name}>`;
			} else {
				state.quasi.value.raw += '/>';
			}
		}
	});
}

class HeadWrapper extends Wrapper {
	
	

	constructor(
		renderer,
		block,
		parent,
		node,
		strip_whitespace,
		next_sibling
	) {
		super(renderer, block, parent, node);

		this.can_use_innerhtml = false;

		this.fragment = new FragmentWrapper(
			renderer,
			block,
			node.children,
			this,
			strip_whitespace,
			next_sibling
		);
	}

	render(block, _parent_node, _parent_nodes) {
		let nodes;
		if (this.renderer.options.hydratable && this.fragment.nodes.length) {
			nodes = block.get_unique_name('head_nodes');
			block.chunks.claim.push(b`const ${nodes} = @query_selector_all('[data-svelte="${this.node.id}"]', @_document.head);`);
		}

		this.fragment.render(block, x`@_document.head` , nodes);

		if (nodes && this.renderer.options.hydratable) {
			block.chunks.claim.push(
				b`${nodes}.forEach(@detach);`
			);
		}
	}
}

function is_else_if(node) {
	return (
		node && node.children.length === 1 && node.children[0].type === 'IfBlock'
	);
}

class IfBlockBranch extends Wrapper {
	
	
	
	
	
	

	__init() {this.var = null;}

	constructor(
		renderer,
		block,
		parent,
		node,
		strip_whitespace,
		next_sibling
	) {
		super(renderer, block, parent, node);IfBlockBranch.prototype.__init.call(this);
		const { expression } = (node );
		const is_else = !expression;

		if (expression) {
			this.dependencies = expression.dynamic_dependencies();

			// TODO is this the right rule? or should any non-reference count?
			// const should_cache = !is_reference(expression.node, null) && dependencies.length > 0;
			let should_cache = false;
			walk(expression.node, {
				enter(node) {
					if (node.type === 'CallExpression' || node.type === 'NewExpression') {
						should_cache = true;
					}
				}
			});

			if (should_cache) {
				this.condition = block.get_unique_name('show_if');
				this.snippet = (expression.manipulate(block) );
			} else {
				this.condition = expression.manipulate(block);
			}
		}

		this.block = block.child({
			comment: create_debugging_comment(node, parent.renderer.component),
			name: parent.renderer.component.get_unique_name(
				is_else ? 'create_else_block' : 'create_if_block'
			),
			type: (node ).expression ? 'if' : 'else'
		});

		this.fragment = new FragmentWrapper(renderer, this.block, node.children, parent, strip_whitespace, next_sibling);

		this.is_dynamic = this.block.dependencies.size > 0;
	}
}

class IfBlockWrapper extends Wrapper {
	
	
	__init2() {this.needs_update = false;}

	__init3() {this.var = { type: 'Identifier', name: 'if_block' };}

	constructor(
		renderer,
		block,
		parent,
		node,
		strip_whitespace,
		next_sibling
	) {
		super(renderer, block, parent, node);IfBlockWrapper.prototype.__init2.call(this);IfBlockWrapper.prototype.__init3.call(this);
		this.cannot_use_innerhtml();
		this.not_static_content();

		this.branches = [];

		const blocks = [];
		let is_dynamic = false;
		let has_intros = false;
		let has_outros = false;

		const create_branches = (node) => {
			const branch = new IfBlockBranch(
				renderer,
				block,
				this,
				node,
				strip_whitespace,
				next_sibling
			);

			this.branches.push(branch);

			blocks.push(branch.block);
			block.add_dependencies(node.expression.dependencies);

			if (branch.block.dependencies.size > 0) {
				// the condition, or its contents, is dynamic
				is_dynamic = true;
				block.add_dependencies(branch.block.dependencies);
			}

			if (branch.dependencies && branch.dependencies.length > 0) {
				// the condition itself is dynamic
				this.needs_update = true;
			}

			if (branch.block.has_intros) has_intros = true;
			if (branch.block.has_outros) has_outros = true;

			if (is_else_if(node.else)) {
				create_branches(node.else.children[0] );
			} else if (node.else) {
				const branch = new IfBlockBranch(
					renderer,
					block,
					this,
					node.else,
					strip_whitespace,
					next_sibling
				);

				this.branches.push(branch);

				blocks.push(branch.block);

				if (branch.block.dependencies.size > 0) {
					is_dynamic = true;
					block.add_dependencies(branch.block.dependencies);
				}

				if (branch.block.has_intros) has_intros = true;
				if (branch.block.has_outros) has_outros = true;
			}
		};

		create_branches(this.node);

		blocks.forEach(block => {
			block.has_update_method = is_dynamic;
			block.has_intro_method = has_intros;
			block.has_outro_method = has_outros;
		});

		renderer.blocks.push(...blocks);
	}

	render(
		block,
		parent_node,
		parent_nodes
	) {
		const name = this.var;

		const needs_anchor = this.next ? !this.next.is_dom_node() : !parent_node || !this.parent.is_dom_node();
		const anchor = needs_anchor
			? block.get_unique_name(`${this.var.name}_anchor`)
			: (this.next && this.next.var) || 'null';

		const has_else = !(this.branches[this.branches.length - 1].condition);
		const if_exists_condition = has_else ? null : name;

		const dynamic = this.branches[0].block.has_update_method; // can use [0] as proxy for all, since they necessarily have the same value
		const has_intros = this.branches[0].block.has_intro_method;
		const has_outros = this.branches[0].block.has_outro_method;
		const has_transitions = has_intros || has_outros;

		const vars = { name, anchor, if_exists_condition, has_else, has_transitions };

		const detaching = parent_node && !is_head(parent_node) ? null : 'detaching';

		if (this.node.else) {
			this.branches.forEach(branch => {
				if (branch.snippet) block.add_variable(branch.condition);
			});

			if (has_outros) {
				this.render_compound_with_outros(block, parent_node, parent_nodes, dynamic, vars, detaching);

				block.chunks.outro.push(b`@transition_out(${name});`);
			} else {
				this.render_compound(block, parent_node, parent_nodes, dynamic, vars, detaching);
			}
		} else {
			this.render_simple(block, parent_node, parent_nodes, dynamic, vars, detaching);

			if (has_outros) {
				block.chunks.outro.push(b`@transition_out(${name});`);
			}
		}

		if (if_exists_condition) {
			block.chunks.create.push(b`if (${if_exists_condition}) ${name}.c();`);
		} else {
			block.chunks.create.push(b`${name}.c();`);
		}

		if (parent_nodes && this.renderer.options.hydratable) {
			if (if_exists_condition) {
				block.chunks.claim.push(
					b`if (${if_exists_condition}) ${name}.l(${parent_nodes});`
				);
			} else {
				block.chunks.claim.push(
					b`${name}.l(${parent_nodes});`
				);
			}
		}

		if (has_intros || has_outros) {
			block.chunks.intro.push(b`@transition_in(${name});`);
		}

		if (needs_anchor) {
			block.add_element(
				anchor ,
				x`@empty()`,
				parent_nodes && x`@empty()`,
				parent_node
			);
		}

		this.branches.forEach(branch => {
			branch.fragment.render(branch.block, null, x`#nodes` );
		});
	}

	render_compound(
		block,
		parent_node,
		_parent_nodes,
		dynamic,
		{ name, anchor, has_else, if_exists_condition, has_transitions },
		detaching
	) {
		const select_block_type = this.renderer.component.get_unique_name('select_block_type');
		const current_block_type = block.get_unique_name('current_block_type');
		const get_block = has_else
			? x`${current_block_type}(#ctx)`
			: x`${current_block_type} && ${current_block_type}(#ctx)`;

		if (this.needs_update) {
			block.chunks.init.push(b`
				function ${select_block_type}(#ctx, #dirty) {
					${this.branches.map(({ dependencies, condition, snippet, block }) => condition
					? b`
					${snippet && (
						dependencies.length > 0
							? b`if (${condition} == null || ${block.renderer.dirty(dependencies)}) ${condition} = !!${snippet}`
							: b`if (${condition} == null) ${condition} = !!${snippet}`
					)}
					if (${condition}) return ${block.name};`
					: b`return ${block.name};`)}
				}
			`);
		} else {
			block.chunks.init.push(b`
				function ${select_block_type}(#ctx, #dirty) {
					${this.branches.map(({ condition, snippet, block }) => condition
					? b`if (${snippet || condition}) return ${block.name};`
					: b`return ${block.name};`)}
				}
			`);
		}

		block.chunks.init.push(b`
			let ${current_block_type} = ${select_block_type}(#ctx, ${this.get_initial_dirty_bit()});
			let ${name} = ${get_block};
		`);

		const initial_mount_node = parent_node || '#target';
		const anchor_node = parent_node ? 'null' : '#anchor';

		if (if_exists_condition) {
			block.chunks.mount.push(
				b`if (${if_exists_condition}) ${name}.m(${initial_mount_node}, ${anchor_node});`
			);
		} else {
			block.chunks.mount.push(
				b`${name}.m(${initial_mount_node}, ${anchor_node});`
			);
		}

		if (this.needs_update) {
			const update_mount_node = this.get_update_mount_node(anchor);

			const change_block = b`
				${if_exists_condition ? b`if (${if_exists_condition}) ${name}.d(1)` : b`${name}.d(1)`};
				${name} = ${get_block};
				if (${name}) {
					${name}.c();
					${has_transitions && b`@transition_in(${name}, 1);`}
					${name}.m(${update_mount_node}, ${anchor});
				}
			`;

			if (dynamic) {
				block.chunks.update.push(b`
					if (${current_block_type} === (${current_block_type} = ${select_block_type}(#ctx, #dirty)) && ${name}) {
						${name}.p(#ctx, #dirty);
					} else {
						${change_block}
					}
				`);
			} else {
				block.chunks.update.push(b`
					if (${current_block_type} !== (${current_block_type} = ${select_block_type}(#ctx, #dirty))) {
						${change_block}
					}
				`);
			}
		} else if (dynamic) {
			if (if_exists_condition) {
				block.chunks.update.push(b`if (${if_exists_condition}) ${name}.p(#ctx, #dirty);`);
			} else {
				block.chunks.update.push(b`${name}.p(#ctx, #dirty);`);
			}
		}

		if (if_exists_condition) {
			block.chunks.destroy.push(b`
				if (${if_exists_condition}) {
					${name}.d(${detaching});
				}
			`);
		} else {
			block.chunks.destroy.push(b`
				${name}.d(${detaching});
			`);
		}
	}

	// if any of the siblings have outros, we need to keep references to the blocks
	// (TODO does this only apply to bidi transitions?)
	render_compound_with_outros(
		block,
		parent_node,
		_parent_nodes,
		dynamic,
		{ name, anchor, has_else, has_transitions, if_exists_condition },
		detaching
	) {
		const select_block_type = this.renderer.component.get_unique_name('select_block_type');
		const current_block_type_index = block.get_unique_name('current_block_type_index');
		const previous_block_index = block.get_unique_name('previous_block_index');
		const if_block_creators = block.get_unique_name('if_block_creators');
		const if_blocks = block.get_unique_name('if_blocks');

		const if_current_block_type_index = has_else
			? nodes => nodes
			: nodes => b`if (~${current_block_type_index}) { ${nodes} }`;

		block.add_variable(current_block_type_index);
		block.add_variable(name);

		block.chunks.init.push(b`
			const ${if_block_creators} = [
				${this.branches.map(branch => branch.block.name)}
			];

			const ${if_blocks} = [];

			${this.needs_update
				? b`
					function ${select_block_type}(#ctx, #dirty) {
						${this.branches.map(({ dependencies, condition, snippet }, i) => condition
						? b`
						${snippet && (
							dependencies.length > 0
								? b`if (${block.renderer.dirty(dependencies)}) ${condition} = !!${snippet}`
								: b`if (${condition} == null) ${condition} = !!${snippet}`
						)}
						if (${condition}) return ${i};`
						: b`return ${i};`)}
						${!has_else && b`return -1;`}
					}
				`
				: b`
					function ${select_block_type}(#ctx, #dirty) {
						${this.branches.map(({ condition, snippet }, i) => condition
						? b`if (${snippet || condition}) return ${i};`
						: b`return ${i};`)}
						${!has_else && b`return -1;`}
					}
				`}
		`);

		if (has_else) {
			block.chunks.init.push(b`
				${current_block_type_index} = ${select_block_type}(#ctx, ${this.get_initial_dirty_bit()});
				${name} = ${if_blocks}[${current_block_type_index}] = ${if_block_creators}[${current_block_type_index}](#ctx);
			`);
		} else {
			block.chunks.init.push(b`
				if (~(${current_block_type_index} = ${select_block_type}(#ctx, ${this.get_initial_dirty_bit()}))) {
					${name} = ${if_blocks}[${current_block_type_index}] = ${if_block_creators}[${current_block_type_index}](#ctx);
				}
			`);
		}

		const initial_mount_node = parent_node || '#target';
		const anchor_node = parent_node ? 'null' : '#anchor';

		block.chunks.mount.push(
			if_current_block_type_index(
				b`${if_blocks}[${current_block_type_index}].m(${initial_mount_node}, ${anchor_node});`
			)
		);

		if (this.needs_update) {
			const update_mount_node = this.get_update_mount_node(anchor);

			const destroy_old_block = b`
				@group_outros();
				@transition_out(${if_blocks}[${previous_block_index}], 1, 1, () => {
					${if_blocks}[${previous_block_index}] = null;
				});
				@check_outros();
			`;

			const create_new_block = b`
				${name} = ${if_blocks}[${current_block_type_index}];
				if (!${name}) {
					${name} = ${if_blocks}[${current_block_type_index}] = ${if_block_creators}[${current_block_type_index}](#ctx);
					${name}.c();
				} else {
					${dynamic && b`${name}.p(#ctx, #dirty);`}
				}
				${has_transitions && b`@transition_in(${name}, 1);`}
				${name}.m(${update_mount_node}, ${anchor});
			`;

			const change_block = has_else
				? b`
					${destroy_old_block}

					${create_new_block}
				`
				: b`
					if (${name}) {
						${destroy_old_block}
					}

					if (~${current_block_type_index}) {
						${create_new_block}
					} else {
						${name} = null;
					}
				`;

			block.chunks.update.push(b`
				let ${previous_block_index} = ${current_block_type_index};
				${current_block_type_index} = ${select_block_type}(#ctx, #dirty);
			`);

			if (dynamic) {
				block.chunks.update.push(b`
					if (${current_block_type_index} === ${previous_block_index}) {
						${if_current_block_type_index(b`${if_blocks}[${current_block_type_index}].p(#ctx, #dirty);`)}
					} else {
						${change_block}
					}
				`);
			} else {
				block.chunks.update.push(b`
					if (${current_block_type_index} !== ${previous_block_index}) {
						${change_block}
					}
				`);
			}
		} else if (dynamic) {
			if (if_exists_condition) {
				block.chunks.update.push(b`if (${if_exists_condition}) ${name}.p(#ctx, #dirty);`);
			} else {
				block.chunks.update.push(b`${name}.p(#ctx, #dirty);`);
			}
		}

		block.chunks.destroy.push(
			if_current_block_type_index(b`${if_blocks}[${current_block_type_index}].d(${detaching});`)
		);
	}

	render_simple(
		block,
		parent_node,
		_parent_nodes,
		dynamic,
		{ name, anchor, if_exists_condition, has_transitions },
		detaching
	) {
		const branch = this.branches[0];

		if (branch.snippet) block.add_variable(branch.condition, branch.snippet);

		block.chunks.init.push(b`
			let ${name} = ${branch.condition} && ${branch.block.name}(#ctx);
		`);

		const initial_mount_node = parent_node || '#target';
		const anchor_node = parent_node ? 'null' : '#anchor';

		block.chunks.mount.push(
			b`if (${name}) ${name}.m(${initial_mount_node}, ${anchor_node});`
		);

		if (branch.dependencies.length > 0) {
			const update_mount_node = this.get_update_mount_node(anchor);

			const enter = b`
				if (${name}) {
					${dynamic && b`${name}.p(#ctx, #dirty);`}
					${
						has_transitions &&
						b`if (${block.renderer.dirty(branch.dependencies)}) {
							@transition_in(${name}, 1);
						}`
					}
				} else {
					${name} = ${branch.block.name}(#ctx);
					${name}.c();
					${has_transitions && b`@transition_in(${name}, 1);`}
					${name}.m(${update_mount_node}, ${anchor});
				}
			`;

			if (branch.snippet) {
				block.chunks.update.push(b`if (${block.renderer.dirty(branch.dependencies)}) ${branch.condition} = ${branch.snippet}`);
			}

			// no `p()` here — we don't want to update outroing nodes,
			// as that will typically result in glitching
			if (branch.block.has_outro_method) {
				block.chunks.update.push(b`
					if (${branch.condition}) {
						${enter}
					} else if (${name}) {
						@group_outros();
						@transition_out(${name}, 1, 1, () => {
							${name} = null;
						});
						@check_outros();
					}
				`);
			} else {
				block.chunks.update.push(b`
					if (${branch.condition}) {
						${enter}
					} else if (${name}) {
						${name}.d(1);
						${name} = null;
					}
				`);
			}
		} else if (dynamic) {
			block.chunks.update.push(b`
				if (${branch.condition}) ${name}.p(#ctx, #dirty);
			`);
		}

		if (if_exists_condition) {
			block.chunks.destroy.push(b`
				if (${if_exists_condition}) ${name}.d(${detaching});
			`);
		} else {
			block.chunks.destroy.push(b`
				${name}.d(${detaching});
			`);
		}
	}

	get_initial_dirty_bit() {
		const _this = this;
		// TODO: context-overflow make it less gross
		const val = x`-1` ;
		return {
			get type() {
				return _this.renderer.context_overflow ? 'ArrayExpression' : 'UnaryExpression';
			},
			// as [-1]
			elements: [val],
			// as -1
			operator: val.operator,
			prefix: val.prefix,
			argument: val.argument
		};
	}
}

class KeyBlockWrapper extends Wrapper {
	
	
	
	
	__init() {this.var = { type: 'Identifier', name: 'key_block' };}

	constructor(
		renderer,
		block,
		parent,
		node,
		strip_whitespace,
		next_sibling
	) {
		super(renderer, block, parent, node);KeyBlockWrapper.prototype.__init.call(this);
		this.cannot_use_innerhtml();
		this.not_static_content();

		this.dependencies = node.expression.dynamic_dependencies();

		if (this.dependencies.length) {
			block = block.child({
				comment: create_debugging_comment(node, renderer.component),
				name: renderer.component.get_unique_name('create_key_block'),
				type: 'key'
			});
			renderer.blocks.push(block);
		}

		this.block = block;
		this.fragment = new FragmentWrapper(
			renderer,
			this.block,
			node.children,
			this,
			strip_whitespace,
			next_sibling
		);
	}

	render(block, parent_node, parent_nodes) {
		if (this.dependencies.length === 0) {
			this.render_static_key(block, parent_node, parent_nodes);
		} else {
			this.render_dynamic_key(block, parent_node, parent_nodes);
		}
	}

	render_static_key(_block, parent_node, parent_nodes) {
		this.fragment.render(this.block, parent_node, parent_nodes);
	}

	render_dynamic_key(block, parent_node, parent_nodes) {
		this.fragment.render(
			this.block,
			null,
			(x`#nodes` ) 
		);

		const has_transitions = !!(
			this.block.has_intro_method || this.block.has_outro_method
		);
		const dynamic = this.block.has_update_method;

		const previous_key = block.get_unique_name('previous_key');
		const snippet = this.node.expression.manipulate(block);
		block.add_variable(previous_key, snippet);

		const not_equal = this.renderer.component.component_options.immutable ? x`@not_equal` : x`@safe_not_equal`;
		const condition = x`${this.renderer.dirty(this.dependencies)} && ${not_equal}(${previous_key}, ${previous_key} = ${snippet})`;

		block.chunks.init.push(b`
			let ${this.var} = ${this.block.name}(#ctx);
		`);
		block.chunks.create.push(b`${this.var}.c();`);
		if (this.renderer.options.hydratable) {
			block.chunks.claim.push(b`${this.var}.l(${parent_nodes});`);
		}
		block.chunks.mount.push(
			b`${this.var}.m(${parent_node || '#target'}, ${
				parent_node ? 'null' : '#anchor'
			});`
		);
		const anchor = this.get_or_create_anchor(block, parent_node, parent_nodes);
		const body = b`
			${
				has_transitions
					? b`
						@group_outros();
						@transition_out(${this.var}, 1, 1, @noop);
						@check_outros();
					`
					: b`${this.var}.d(1);`
			}
			${this.var} = ${this.block.name}(#ctx);
			${this.var}.c();
			${has_transitions && b`@transition_in(${this.var})`}
			${this.var}.m(${this.get_update_mount_node(anchor)}, ${anchor});
		`;

		if (dynamic) {
			block.chunks.update.push(b`
				if (${condition}) {
					${body}
				} else {
					${this.var}.p(#ctx, #dirty);
				}
			`);
		} else {
			block.chunks.update.push(b`
				if (${condition}) {
					${body}
				}
			`);
		}

		if (has_transitions) {
			block.chunks.intro.push(b`@transition_in(${this.var})`);
			block.chunks.outro.push(b`@transition_out(${this.var})`);
		}

		block.chunks.destroy.push(b`${this.var}.d(detaching)`);
	}
}

function get_slot_definition(block, scope, lets) {
	if (lets.length === 0) return { block, scope };

	const context_input = {
		type: 'ObjectPattern',
		properties: lets.map(l => ({
			type: 'Property',
			kind: 'init',
			key: l.name,
			value: l.value || l.name
		}))
	};

	const properties = [];
	const value_map = new Map();

	lets.forEach(l => {
		let value;
		if (l.names.length > 1) {
			// more than one, probably destructuring
			const unique_name = block.get_unique_name(l.names.join('_')).name;
			value_map.set(l.value, unique_name);
			value = { type: 'Identifier', name: unique_name };
		} else {
			value = l.value || l.name;
		}
		properties.push({
			type: 'Property',
			kind: 'init',
			key: l.name,
			value
		});
	});

	const changes_input = {
		type: 'ObjectPattern',
		properties
	};

	const names = new Set();
	const names_lookup = new Map();

	lets.forEach(l => {
		l.names.forEach(name => {
			names.add(name);
			if (value_map.has(l.value)) {
				names_lookup.set(name, value_map.get(l.value));
			}
		});
	});

	const context = {
		type: 'ObjectExpression',
		properties: Array.from(names).map(name => p`${block.renderer.context_lookup.get(name).index}: ${name}`)
	};

	const { context_lookup } = block.renderer;

	// i am well aware that this code is gross
	// TODO: context-overflow make it less gross
	const changes = {
		type: 'ParenthesizedExpression',
		get expression() {
			if (block.renderer.context_overflow) {
				const grouped = [];

				Array.from(names).forEach(name => {
					const i = context_lookup.get(name).index.value ;
					const g = Math.floor(i / 31);

					const lookup_name = names_lookup.has(name) ? names_lookup.get(name) : name;

					if (!grouped[g]) grouped[g] = [];
					grouped[g].push({ name: lookup_name, n: i % 31 });
				});

				const elements = [];

				for (let g = 0; g < grouped.length; g += 1) {
					elements[g] = grouped[g]
						? grouped[g]
							.map(({ name, n }) => x`${name} ? ${1 << n} : 0`)
							.reduce((lhs, rhs) => x`${lhs} | ${rhs}`)
						: x`0`;
				}

				return {
					type: 'ArrayExpression',
					elements
				};
			}

			return Array.from(names)
				.map(name => {
					const lookup_name = names_lookup.has(name) ? names_lookup.get(name) : name;
					const i = context_lookup.get(name).index.value ;
					return x`${lookup_name} ? ${1 << i} : 0`;
				})
				.reduce((lhs, rhs) => x`${lhs} | ${rhs}`) ;
		}
	};

	return {
		block,
		scope,
		get_context: x`${context_input} => ${context}`,
		get_changes: x`${changes_input} => ${changes}`
	};
}

class SlotTemplateWrapper extends Wrapper {
	
	
	
	

	constructor(
		renderer,
		block,
		parent,
		node,
		strip_whitespace,
		next_sibling
	) {
		super(renderer, block, parent, node);

		const { scope, lets, slot_template_name } = this.node;

		lets.forEach(l => {
			extract_names(l.value || l.name).forEach(name => {
				renderer.add_to_context(name, true);
			});
		});

		this.block = block.child({
			comment: create_debugging_comment(this.node, this.renderer.component),
			name: this.renderer.component.get_unique_name(
				`create_${sanitize(slot_template_name)}_slot`
			),
			type: 'slot'
		});
		this.renderer.blocks.push(this.block);

		const seen = new Set(lets.map(l => l.name.name));
		this.parent.node.lets.forEach(l => {
			if (!seen.has(l.name.name)) lets.push(l);
		});

		this.parent.set_slot(
			slot_template_name,
			get_slot_definition(this.block, scope, lets)
		);

		this.fragment = new FragmentWrapper(
			renderer,
			this.block,
			node.type === 'SlotTemplate' ? node.children : [node],
			this,
			strip_whitespace,
			next_sibling
		);

		this.block.parent.add_dependencies(this.block.dependencies);
	}

	render() {
		this.fragment.render(this.block, null, x`#nodes` );
	}
}

function string_to_member_expression(name) {
	const parts = name.split('.');
	let node = {
		type: 'Identifier',
		name: parts[0]
	};
	for (let i = 1; i < parts.length; i++) {
		node = {
			type: 'MemberExpression',
			object: node,
			property: { type: 'Identifier', name: parts[i] }
		} ;
	}
	return node;
}

class InlineComponentWrapper extends Wrapper {
	
	__init() {this.slots = new Map();}
	
	
	__init2() {this.children = [];}

	constructor(
		renderer,
		block,
		parent,
		node,
		strip_whitespace,
		next_sibling
	) {
		super(renderer, block, parent, node);InlineComponentWrapper.prototype.__init.call(this);InlineComponentWrapper.prototype.__init2.call(this);
		this.cannot_use_innerhtml();
		this.not_static_content();

		if (this.node.expression) {
			block.add_dependencies(this.node.expression.dependencies);
		}

		this.node.attributes.forEach(attr => {
			block.add_dependencies(attr.dependencies);
		});

		this.node.bindings.forEach(binding => {
			if (binding.is_contextual) {
				mark_each_block_bindings(this, binding);
			}

			block.add_dependencies(binding.expression.dependencies);
		});

		this.node.handlers.forEach(handler => {
			if (handler.expression) {
				block.add_dependencies(handler.expression.dependencies);
			}
		});

		this.var = {
			type: 'Identifier',
			name: (
				this.node.name === 'svelte:self' ? renderer.component.name.name :
					this.node.name === 'svelte:component' ? 'switch_instance' :
						sanitize(this.node.name)
			).toLowerCase()
		};

		if (this.node.children.length) {
			this.node.lets.forEach(l => {
				extract_names(l.value || l.name).forEach(name => {
					renderer.add_to_context(name, true);
				});
			});

			this.children = this.node.children.map(child => new SlotTemplateWrapper(renderer, block, this, child , strip_whitespace, next_sibling));
		}

		block.add_outro();
	}

	set_slot(name, slot_definition) {
		if (this.slots.has(name)) {
			if (name === 'default') {
				throw new Error('Found elements without slot attribute when using slot="default"');
			}
			throw new Error(`Duplicate slot name "${name}" in <${this.node.name}>`);
		}
		this.slots.set(name, slot_definition);
	}

	warn_if_reactive() {
		const { name } = this.node;
		const variable = this.renderer.component.var_lookup.get(name);
		if (!variable) {
			return;
		}

		if (variable.reassigned || variable.export_name || variable.is_reactive_dependency) {
			this.renderer.component.warn(this.node, {
				code: 'reactive-component',
				message: `<${name}/> will not be reactive if ${name} changes. Use <svelte:component this={${name}}/> if you want this reactivity.`
			});
		}
	}

	render(
		block,
		parent_node,
		parent_nodes
	) {
		this.warn_if_reactive();

		const { renderer } = this;
		const { component } = renderer;

		const name = this.var;
		block.add_variable(name);

		const component_opts = x`{}` ;

		const statements = [];
		const updates = [];

		this.children.forEach((child) => {
			this.renderer.add_to_context('$$scope', true);
			child.render(block, null, x`#nodes` );
		});

		let props;
		const name_changes = block.get_unique_name(`${name.name}_changes`);

		const uses_spread = !!this.node.attributes.find(a => a.is_spread);

		// removing empty slot
		for (const slot of this.slots.keys()) {
			if (!this.slots.get(slot).block.has_content()) {
				this.renderer.remove_block(this.slots.get(slot).block);
				this.slots.delete(slot);
			}
		}

		const initial_props = this.slots.size > 0
			? [
				p`$$slots: {
					${Array.from(this.slots).map(([name, slot]) => {
						return p`${name}: [${slot.block.name}, ${slot.get_context || null}, ${slot.get_changes || null}]`;
					})}
				}`,
				p`$$scope: {
					ctx: #ctx
				}`
			]
			: [];

		const attribute_object = uses_spread
			? x`{ ${initial_props} }`
			: x`{
				${this.node.attributes.map(attr => p`${attr.name}: ${attr.get_value(block)}`)},
				${initial_props}
			}`;

		if (this.node.attributes.length || this.node.bindings.length || initial_props.length) {
			if (!uses_spread && this.node.bindings.length === 0) {
				component_opts.properties.push(p`props: ${attribute_object}`);
			} else {
				props = block.get_unique_name(`${name.name}_props`);
				component_opts.properties.push(p`props: ${props}`);
			}
		}

		if (component.compile_options.dev) {
			// TODO this is a terrible hack, but without it the component
			// will complain that options.target is missing. This would
			// work better if components had separate public and private
			// APIs
			component_opts.properties.push(p`$$inline: true`);
		}

		const fragment_dependencies = new Set(this.slots.size ? ['$$scope'] : []);
		this.slots.forEach(slot => {
			slot.block.dependencies.forEach(name => {
				const is_let = slot.scope.is_let(name);
				const variable = renderer.component.var_lookup.get(name);

				if (is_let || is_dynamic$1(variable)) fragment_dependencies.add(name);
			});
		});

		const dynamic_attributes = this.node.attributes.filter(a => a.get_dependencies().length > 0);

		if (!uses_spread && (dynamic_attributes.length > 0 || this.node.bindings.length > 0 || fragment_dependencies.size > 0)) {
			updates.push(b`const ${name_changes} = {};`);
		}

		if (this.node.attributes.length) {
			if (uses_spread) {
				const levels = block.get_unique_name(`${this.var.name}_spread_levels`);

				const initial_props = [];
				const changes = [];

				const all_dependencies = new Set();

				this.node.attributes.forEach(attr => {
					add_to_set(all_dependencies, attr.dependencies);
				});

				this.node.attributes.forEach((attr, i) => {
					const { name, dependencies } = attr;

					const condition = dependencies.size > 0 && (dependencies.size !== all_dependencies.size)
						? renderer.dirty(Array.from(dependencies))
						: null;
					const unchanged = dependencies.size === 0;

					let change_object;
					if (attr.is_spread) {
						const value = attr.expression.manipulate(block);
						initial_props.push(value);

						let value_object = value;
						if (attr.expression.node.type !== 'ObjectExpression') {
							value_object = x`@get_spread_object(${value})`;
						}
						change_object = value_object;
					} else {
						const obj = x`{ ${name}: ${attr.get_value(block)} }`;
						initial_props.push(obj);
						change_object = obj;
					}

					changes.push(
						unchanged
							? x`${levels}[${i}]`
							: condition
							? x`${condition} && ${change_object}`
							: change_object
					);
				});

				block.chunks.init.push(b`
					const ${levels} = [
						${initial_props}
					];
				`);

				statements.push(b`
					for (let #i = 0; #i < ${levels}.length; #i += 1) {
						${props} = @assign(${props}, ${levels}[#i]);
					}
				`);

				if (all_dependencies.size) {
					const condition = renderer.dirty(Array.from(all_dependencies));

					updates.push(b`
						const ${name_changes} = ${condition} ? @get_spread_update(${levels}, [
							${changes}
						]) : {}
					`);
				} else {
					updates.push(b`
						const ${name_changes} = {};
					`);
				}
			} else {
				dynamic_attributes.forEach((attribute) => {
					const dependencies = attribute.get_dependencies();
					if (dependencies.length > 0) {
						const condition = renderer.dirty(dependencies);

						updates.push(b`
							if (${condition}) ${name_changes}.${attribute.name} = ${attribute.get_value(block)};
						`);
					}
				});
			}
		}

		if (fragment_dependencies.size > 0) {
			updates.push(b`
				if (${renderer.dirty(Array.from(fragment_dependencies))}) {
					${name_changes}.$$scope = { dirty: #dirty, ctx: #ctx };
				}`);
		}

		const munged_bindings = this.node.bindings.map(binding => {
			component.has_reactive_assignments = true;

			if (binding.name === 'this') {
				return bind_this(component, block, new BindingWrapper(block, binding, this), this.var);
			}

			const id = component.get_unique_name(`${this.var.name}_${binding.name}_binding`);
			renderer.add_to_context(id.name);
			const callee = renderer.reference(id);

			const updating = block.get_unique_name(`updating_${binding.name}`);
			block.add_variable(updating);

			const snippet = binding.expression.manipulate(block);

			statements.push(b`
				if (${snippet} !== void 0) {
					${props}.${binding.name} = ${snippet};
				}`
			);

			updates.push(b`
				if (!${updating} && ${renderer.dirty(Array.from(binding.expression.dependencies))}) {
					${updating} = true;
					${name_changes}.${binding.name} = ${snippet};
					@add_flush_callback(() => ${updating} = false);
				}
			`);

			const contextual_dependencies = Array.from(binding.expression.contextual_dependencies);
			const dependencies = Array.from(binding.expression.dependencies);

			let lhs = binding.raw_expression;

			if (binding.is_contextual && binding.expression.node.type === 'Identifier') {
				// bind:x={y} — we can't just do `y = x`, we need to
				// to `array[index] = x;
				const { name } = binding.expression.node;
				const { object, property, snippet } = block.bindings.get(name);
				lhs = snippet;
				contextual_dependencies.push(object.name, property.name);
			}

			const params = [x`#value`];
			const args = [x`#value`];
			if (contextual_dependencies.length > 0) {

				contextual_dependencies.forEach(name => {
					params.push({
						type: 'Identifier',
						name
					});

					renderer.add_to_context(name, true);
					args.push(renderer.reference(name));
				});


				block.maintain_context = true; // TODO put this somewhere more logical
			}

			block.chunks.init.push(b`
				function ${id}(#value) {
					${callee}(${args});
				}
			`);

			let invalidate_binding = b`
				${lhs} = #value;
				${renderer.invalidate(dependencies[0])};
			`;
			if (binding.expression.node.type === 'MemberExpression') {
				invalidate_binding = b`
					if ($$self.$$.not_equal(${lhs}, #value)) {
						${invalidate_binding}
					}
				`;
			}

			const body = b`
				function ${id}(${params}) {
					${invalidate_binding}
				}
			`;

			component.partly_hoisted.push(body);

			return b`@binding_callbacks.push(() => @bind(${this.var}, '${binding.name}', ${id}));`;
		});

		const munged_handlers = this.node.handlers.map(handler => {
			const event_handler = new EventHandlerWrapper(handler, this);
			let snippet = event_handler.get_snippet(block);
			if (handler.modifiers.has('once')) snippet = x`@once(${snippet})`;

			return b`${name}.$on("${handler.name}", ${snippet});`;
		});

		if (this.node.name === 'svelte:component') {
			const switch_value = block.get_unique_name('switch_value');
			const switch_props = block.get_unique_name('switch_props');

			const snippet = this.node.expression.manipulate(block);

			block.chunks.init.push(b`
				var ${switch_value} = ${snippet};

				function ${switch_props}(#ctx) {
					${(this.node.attributes.length > 0 || this.node.bindings.length > 0) && b`
					${props && b`let ${props} = ${attribute_object};`}`}
					${statements}
					return ${component_opts};
				}

				if (${switch_value}) {
					${name} = new ${switch_value}(${switch_props}(#ctx));

					${munged_bindings}
					${munged_handlers}
				}
			`);

			block.chunks.create.push(
				b`if (${name}) @create_component(${name}.$$.fragment);`
			);

			if (parent_nodes && this.renderer.options.hydratable) {
				block.chunks.claim.push(
					b`if (${name}) @claim_component(${name}.$$.fragment, ${parent_nodes});`
				);
			}

			block.chunks.mount.push(b`
				if (${name}) {
					@mount_component(${name}, ${parent_node || '#target'}, ${parent_node ? 'null' : '#anchor'});
				}
			`);

			const anchor = this.get_or_create_anchor(block, parent_node, parent_nodes);
			const update_mount_node = this.get_update_mount_node(anchor);

			if (updates.length) {
				block.chunks.update.push(b`
					${updates}
				`);
			}

			block.chunks.update.push(b`
				if (${switch_value} !== (${switch_value} = ${snippet})) {
					if (${name}) {
						@group_outros();
						const old_component = ${name};
						@transition_out(old_component.$$.fragment, 1, 0, () => {
							@destroy_component(old_component, 1);
						});
						@check_outros();
					}

					if (${switch_value}) {
						${name} = new ${switch_value}(${switch_props}(#ctx));

						${munged_bindings}
						${munged_handlers}

						@create_component(${name}.$$.fragment);
						@transition_in(${name}.$$.fragment, 1);
						@mount_component(${name}, ${update_mount_node}, ${anchor});
					} else {
						${name} = null;
					}
				} else if (${switch_value}) {
					${updates.length > 0 && b`${name}.$set(${name_changes});`}
				}
			`);

			block.chunks.intro.push(b`
				if (${name}) @transition_in(${name}.$$.fragment, #local);
			`);

			block.chunks.outro.push(
				b`if (${name}) @transition_out(${name}.$$.fragment, #local);`
			);

			block.chunks.destroy.push(b`if (${name}) @destroy_component(${name}, ${parent_node ? null : 'detaching'});`);
		} else {
			const expression = this.node.name === 'svelte:self'
				? component.name
				: this.renderer.reference(string_to_member_expression(this.node.name));

			block.chunks.init.push(b`
				${(this.node.attributes.length > 0 || this.node.bindings.length > 0) && b`
				${props && b`let ${props} = ${attribute_object};`}`}
				${statements}
				${name} = new ${expression}(${component_opts});

				${munged_bindings}
				${munged_handlers}
			`);

			block.chunks.create.push(b`@create_component(${name}.$$.fragment);`);

			if (parent_nodes && this.renderer.options.hydratable) {
				block.chunks.claim.push(
					b`@claim_component(${name}.$$.fragment, ${parent_nodes});`
				);
			}

			block.chunks.mount.push(
				b`@mount_component(${name}, ${parent_node || '#target'}, ${parent_node ? 'null' : '#anchor'});`
			);

			block.chunks.intro.push(b`
				@transition_in(${name}.$$.fragment, #local);
			`);

			if (updates.length) {
				block.chunks.update.push(b`
					${updates}
					${name}.$set(${name_changes});
				`);
			}

			block.chunks.destroy.push(b`
				@destroy_component(${name}, ${parent_node ? null : 'detaching'});
			`);

			block.chunks.outro.push(
				b`@transition_out(${name}.$$.fragment, #local);`
			);
		}
	}
}

function get_slot_data(values, block = null) {
	return {
		type: 'ObjectExpression',
		properties: Array.from(values.values())
			.filter(attribute => attribute.name !== 'name')
			.map(attribute => {
				if (attribute.is_spread) {
					const argument = get_spread_value(block, attribute);
					return {
						type: 'SpreadElement',
						argument
					};
				}

				const value = get_value(block, attribute);
				return p`${attribute.name}: ${value}`;
			})
	};
}

function get_value(block, attribute) {
	if (attribute.is_true) return x`true`;
	if (attribute.chunks.length === 0) return x`""`;

	let value = attribute.chunks
		.map(chunk => chunk.type === 'Text' ? string_literal(chunk.data) : (block ? chunk.manipulate(block) : chunk.node))
		.reduce((lhs, rhs) => x`${lhs} + ${rhs}`);

	if (attribute.chunks.length > 1 && attribute.chunks[0].type !== 'Text') {
		value = x`"" + ${value}`;
	}

	return value;
}

function get_spread_value(block, attribute) {
	return block ? attribute.expression.manipulate(block) : attribute.expression.node;
}

class SlotWrapper extends Wrapper {
	
	
	__init() {this.fallback = null;}
	

	__init2() {this.var = { type: 'Identifier', name: 'slot' };}
	__init3() {this.dependencies = new Set(['$$scope']);}

	constructor(
		renderer,
		block,
		parent,
		node,
		strip_whitespace,
		next_sibling
	) {
		super(renderer, block, parent, node);SlotWrapper.prototype.__init.call(this);SlotWrapper.prototype.__init2.call(this);SlotWrapper.prototype.__init3.call(this);		this.cannot_use_innerhtml();
		this.not_static_content();

		if (this.node.children.length) {
			this.fallback = block.child({
				comment: create_debugging_comment(this.node.children[0], this.renderer.component),
				name: this.renderer.component.get_unique_name('fallback_block'),
				type: 'fallback'
			});
			renderer.blocks.push(this.fallback);
		}

		this.fragment = new FragmentWrapper(
			renderer,
			this.fallback,
			node.children,
			this,
			strip_whitespace,
			next_sibling
		);

		this.node.values.forEach(attribute => {
			add_to_set(this.dependencies, attribute.dependencies);
		});

		block.add_dependencies(this.dependencies);

		// we have to do this, just in case
		block.add_intro();
		block.add_outro();
	}

	render(
		block,
		parent_node,
		parent_nodes
	) {
		const { renderer } = this;

		const { slot_name } = this.node;

		if (this.slot_block) {
			block = this.slot_block;
		}

		let get_slot_changes_fn;
		let get_slot_spread_changes_fn;
		let get_slot_context_fn;

		if (this.node.values.size > 0) {
			get_slot_changes_fn = renderer.component.get_unique_name(`get_${sanitize(slot_name)}_slot_changes`);
			get_slot_context_fn = renderer.component.get_unique_name(`get_${sanitize(slot_name)}_slot_context`);

			const changes = x`{}` ;

			const spread_dynamic_dependencies = new Set();

			this.node.values.forEach(attribute => {
				if (attribute.type === 'Spread') {
					add_to_set(spread_dynamic_dependencies, Array.from(attribute.dependencies).filter((name) => this.is_dependency_dynamic(name)));
				} else {
					const dynamic_dependencies = Array.from(attribute.dependencies).filter((name) => this.is_dependency_dynamic(name));
	
					if (dynamic_dependencies.length > 0) {
						changes.properties.push(p`${attribute.name}: ${renderer.dirty(dynamic_dependencies)}`);
					}
				}
			});

			renderer.blocks.push(b`
				const ${get_slot_changes_fn} = #dirty => ${changes};
				const ${get_slot_context_fn} = #ctx => ${get_slot_data(this.node.values, block)};
			`);

			if (spread_dynamic_dependencies.size) {
				get_slot_spread_changes_fn = renderer.component.get_unique_name(`get_${sanitize(slot_name)}_slot_spread_changes`);
				renderer.blocks.push(b`
					const ${get_slot_spread_changes_fn} = #dirty => ${renderer.dirty(Array.from(spread_dynamic_dependencies))} > 0 ? -1 : 0;
				`);
			}
		} else {
			get_slot_changes_fn = 'null';
			get_slot_context_fn = 'null';
		}

		let has_fallback = !!this.fallback;
		if (this.fallback) {
			this.fragment.render(this.fallback, null, x`#nodes` );
			has_fallback = this.fallback.has_content();
			if (!has_fallback) {
				renderer.remove_block(this.fallback);
			}
		}

		const slot = block.get_unique_name(`${sanitize(slot_name)}_slot`);
		const slot_definition = block.get_unique_name(`${sanitize(slot_name)}_slot_template`);
		const slot_or_fallback = has_fallback ? block.get_unique_name(`${sanitize(slot_name)}_slot_or_fallback`) : slot;

		block.chunks.init.push(b`
			const ${slot_definition} = ${renderer.reference('#slots')}.${slot_name};
			const ${slot} = @create_slot(${slot_definition}, #ctx, ${renderer.reference('$$scope')}, ${get_slot_context_fn});
			${has_fallback ? b`const ${slot_or_fallback} = ${slot} || ${this.fallback.name}(#ctx);` : null}
		`);

		block.chunks.create.push(
			b`if (${slot_or_fallback}) ${slot_or_fallback}.c();`
		);

		if (renderer.options.hydratable) {
			block.chunks.claim.push(
				b`if (${slot_or_fallback}) ${slot_or_fallback}.l(${parent_nodes});`
			);
		}

		block.chunks.mount.push(b`
			if (${slot_or_fallback}) {
				${slot_or_fallback}.m(${parent_node || '#target'}, ${parent_node ? 'null' : '#anchor'});
			}
		`);

		block.chunks.intro.push(
			b`@transition_in(${slot_or_fallback}, #local);`
		);

		block.chunks.outro.push(
			b`@transition_out(${slot_or_fallback}, #local);`
		);

		const dynamic_dependencies = Array.from(this.dependencies).filter((name) => this.is_dependency_dynamic(name));

		const fallback_dynamic_dependencies = has_fallback
			? Array.from(this.fallback.dependencies).filter((name) => this.is_dependency_dynamic(name))
			: [];

		const slot_update = get_slot_spread_changes_fn ? b`
			if (${slot}.p && ${renderer.dirty(dynamic_dependencies)}) {
				@update_slot_spread(${slot}, ${slot_definition}, #ctx, ${renderer.reference('$$scope')}, #dirty, ${get_slot_changes_fn}, ${get_slot_spread_changes_fn}, ${get_slot_context_fn});
			}
		` : b`
			if (${slot}.p && ${renderer.dirty(dynamic_dependencies)}) {
				@update_slot(${slot}, ${slot_definition}, #ctx, ${renderer.reference('$$scope')}, #dirty, ${get_slot_changes_fn}, ${get_slot_context_fn});
			}
		`;
		const fallback_update = has_fallback && fallback_dynamic_dependencies.length > 0 && b`
			if (${slot_or_fallback} && ${slot_or_fallback}.p && ${renderer.dirty(fallback_dynamic_dependencies)}) {
				${slot_or_fallback}.p(#ctx, #dirty);
			}
		`;

		if (fallback_update) {
			block.chunks.update.push(b`
				if (${slot}) {
					${slot_update}
				} else {
					${fallback_update}
				}
			`);
		} else {
			block.chunks.update.push(b`
				if (${slot}) {
					${slot_update}
				}
			`);
		}

		block.chunks.destroy.push(
			b`if (${slot_or_fallback}) ${slot_or_fallback}.d(detaching);`
		);
	}

	is_dependency_dynamic(name) {
		if (name === '$$scope') return true;
		if (this.node.scope.is_let(name)) return true;
		if (is_reserved_keyword(name)) return true;
		const variable = this.renderer.component.var_lookup.get(name);
		return is_dynamic$1(variable);
	}
}

class TitleWrapper extends Wrapper {
	

	constructor(
		renderer,
		block,
		parent,
		node,
		_strip_whitespace,
		_next_sibling
	) {
		super(renderer, block, parent, node);
	}

	render(block, _parent_node, _parent_nodes) {
		const is_dynamic = !!this.node.children.find(node => node.type !== 'Text');

		if (is_dynamic) {
			let value;

			const all_dependencies = new Set();

			// TODO some of this code is repeated in Tag.ts — would be good to
			// DRY it out if that's possible without introducing crazy indirection
			if (this.node.children.length === 1) {
				// single {tag} — may be a non-string
				// @ts-ignore todo: check this
				const { expression } = this.node.children[0];
				value = expression.manipulate(block);
				add_to_set(all_dependencies, expression.dependencies);
			} else {
				// '{foo} {bar}' — treat as string concatenation
				value = this.node.children
					.map(chunk => {
						if (chunk.type === 'Text') return string_literal(chunk.data);

						(chunk ).expression.dependencies.forEach(d => {
							all_dependencies.add(d);
						});

						return (chunk ).expression.manipulate(block);
					})
					.reduce((lhs, rhs) => x`${lhs} + ${rhs}`);

				if (this.node.children[0].type !== 'Text') {
					value = x`"" + ${value}`;
				}
			}

			const last = this.node.should_cache && block.get_unique_name(
				'title_value'
			);

			if (this.node.should_cache) block.add_variable(last);

			const init = this.node.should_cache ? x`${last} = ${value}` : value;

			block.chunks.init.push(
				b`@_document.title = ${init};`
			);

			const updater = b`@_document.title = ${this.node.should_cache ? last : value};`;

			if (all_dependencies.size) {
				const dependencies = Array.from(all_dependencies);

				let condition = block.renderer.dirty(dependencies);

				if (block.has_outros) {
					condition = x`!#current || ${condition}`;
				}

				if (this.node.should_cache) {
					condition = x`${condition} && (${last} !== (${last} = ${value}))`;
				}

				block.chunks.update.push(b`
					if (${condition}) {
						${updater}
					}`);
			}
		} else {
			const value = this.node.children.length > 0
				? string_literal((this.node.children[0] ).data)
				: x`""`;

			block.chunks.hydrate.push(b`@_document.title = ${value};`);
		}
	}
}

const associated_events = {
	innerWidth: 'resize',
	innerHeight: 'resize',
	outerWidth: 'resize',
	outerHeight: 'resize',

	scrollX: 'scroll',
	scrollY: 'scroll'
};

const properties = {
	scrollX: 'pageXOffset',
	scrollY: 'pageYOffset'
};

const readonly = new Set([
	'innerWidth',
	'innerHeight',
	'outerWidth',
	'outerHeight',
	'online'
]);

class WindowWrapper extends Wrapper {
	
	

	constructor(renderer, block, parent, node) {
		super(renderer, block, parent, node);
		this.handlers = this.node.handlers.map(handler => new EventHandlerWrapper(handler, this));
	}

	render(block, _parent_node, _parent_nodes) {
		const { renderer } = this;
		const { component } = renderer;

		const events = {};
		const bindings = {};

		add_actions(block, '@_window', this.node.actions);
		add_event_handlers(block, '@_window', this.handlers);

		this.node.bindings.forEach(binding => {
			// TODO: what if it's a MemberExpression?
			const binding_name = (binding.expression.node ).name;

			// in dev mode, throw if read-only values are written to
			if (readonly.has(binding.name)) {
				renderer.readonly.add(binding_name);
			}

			bindings[binding.name] = binding_name;

			// bind:online is a special case, we need to listen for two separate events
			if (binding.name === 'online') return;

			const associated_event = associated_events[binding.name];
			const property = properties[binding.name] || binding.name;

			if (!events[associated_event]) events[associated_event] = [];
			events[associated_event].push({
				name: binding_name,
				value: property
			});
		});

		const scrolling = block.get_unique_name('scrolling');
		const clear_scrolling = block.get_unique_name('clear_scrolling');
		const scrolling_timeout = block.get_unique_name('scrolling_timeout');

		Object.keys(events).forEach(event => {
			const id = block.get_unique_name(`onwindow${event}`);
			const props = events[event];

			renderer.add_to_context(id.name);
			const fn = renderer.reference(id.name);

			if (event === 'scroll') {
				// TODO other bidirectional bindings...
				block.add_variable(scrolling, x`false`);
				block.add_variable(clear_scrolling, x`() => { ${scrolling} = false }`);
				block.add_variable(scrolling_timeout);

				const condition = bindings.scrollX && bindings.scrollY
					? x`"${bindings.scrollX}" in this._state || "${bindings.scrollY}" in this._state`
					: x`"${bindings.scrollX || bindings.scrollY}" in this._state`;

				const scrollX = bindings.scrollX && x`this._state.${bindings.scrollX}`;
				const scrollY = bindings.scrollY && x`this._state.${bindings.scrollY}`;

				renderer.meta_bindings.push(b`
					if (${condition}) {
						@_scrollTo(${scrollX || '@_window.pageXOffset'}, ${scrollY || '@_window.pageYOffset'});
					}
					${scrollX && `${scrollX} = @_window.pageXOffset;`}
					${scrollY && `${scrollY} = @_window.pageYOffset;`}
				`);

				block.event_listeners.push(x`
					@listen(@_window, "${event}", () => {
						${scrolling} = true;
						@_clearTimeout(${scrolling_timeout});
						${scrolling_timeout} = @_setTimeout(${clear_scrolling}, 100);
						${fn}();
					})
				`);
			} else {
				props.forEach(prop => {
					renderer.meta_bindings.push(
						b`this._state.${prop.name} = @_window.${prop.value};`
					);
				});

				block.event_listeners.push(x`
					@listen(@_window, "${event}", ${fn})
				`);
			}

			component.partly_hoisted.push(b`
				function ${id}() {
					${props.map(prop => renderer.invalidate(prop.name, x`${prop.name} = @_window.${prop.value}`))}
				}
			`);

			block.chunks.init.push(b`
				@add_render_callback(${fn});
			`);

			component.has_reactive_assignments = true;
		});

		// special case... might need to abstract this out if we add more special cases
		if (bindings.scrollX || bindings.scrollY) {
			const condition = renderer.dirty([bindings.scrollX, bindings.scrollY].filter(Boolean));

			const scrollX = bindings.scrollX ? renderer.reference(bindings.scrollX) : x`@_window.pageXOffset`;
			const scrollY = bindings.scrollY ? renderer.reference(bindings.scrollY) : x`@_window.pageYOffset`;

			block.chunks.update.push(b`
				if (${condition} && !${scrolling}) {
					${scrolling} = true;
					@_clearTimeout(${scrolling_timeout});
					@_scrollTo(${scrollX}, ${scrollY});
					${scrolling_timeout} = @_setTimeout(${clear_scrolling}, 100);
				}
			`);
		}

		// another special case. (I'm starting to think these are all special cases.)
		if (bindings.online) {
			const id = block.get_unique_name('onlinestatuschanged');
			const name = bindings.online;

			renderer.add_to_context(id.name);
			const reference = renderer.reference(id.name);

			component.partly_hoisted.push(b`
				function ${id}() {
					${renderer.invalidate(name, x`${name} = @_navigator.onLine`)}
				}
			`);

			block.chunks.init.push(b`
				@add_render_callback(${reference});
			`);

			block.event_listeners.push(
				x`@listen(@_window, "online", ${reference})`,
				x`@listen(@_window, "offline", ${reference})`
			);

			component.has_reactive_assignments = true;
		}
	}
}

function link(next, prev) {
	prev.next = next;
	if (next) next.prev = prev;
}

const wrappers = {
	AwaitBlock: AwaitBlockWrapper,
	Body: BodyWrapper,
	Comment: null,
	DebugTag: DebugTagWrapper,
	EachBlock: EachBlockWrapper,
	Element: ElementWrapper,
	Head: HeadWrapper,
	IfBlock: IfBlockWrapper,
	InlineComponent: InlineComponentWrapper,
	KeyBlock: KeyBlockWrapper,
	MustacheTag: MustacheTagWrapper,
	Options: null,
	RawMustacheTag: RawMustacheTagWrapper,
	Slot: SlotWrapper,
	SlotTemplate: SlotTemplateWrapper,
	Text: TextWrapper,
	Title: TitleWrapper,
	Window: WindowWrapper
};

function trimmable_at(child, next_sibling) {
	// Whitespace is trimmable if one of the following is true:
	// The child and its sibling share a common nearest each block (not at an each block boundary)
	// The next sibling's previous node is an each block
	return (next_sibling.node.find_nearest(/EachBlock/) === child.find_nearest(/EachBlock/)) || next_sibling.node.prev.type === 'EachBlock';
}

class FragmentWrapper {
	

	constructor(
		renderer,
		block,
		nodes,
		parent,
		strip_whitespace,
		next_sibling
	) {
		this.nodes = [];

		let last_child;
		let window_wrapper;

		let i = nodes.length;
		while (i--) {
			const child = nodes[i];

			if (!child.type) {
				throw new Error('missing type');
			}

			if (!(child.type in wrappers)) {
				throw new Error(`TODO implement ${child.type}`);
			}

			// special case — this is an easy way to remove whitespace surrounding
			// <svelte:window/>. lil hacky but it works
			if (child.type === 'Window') {
				window_wrapper = new WindowWrapper(renderer, block, parent, child);
				continue;
			}

			if (child.type === 'Text') {
				let { data } = child;

				// We want to remove trailing whitespace inside an element/component/block,
				// *unless* there is no whitespace between this node and its next sibling
				if (this.nodes.length === 0) {
					const should_trim = (
						next_sibling ? (next_sibling.node.type === 'Text' && /^\s/.test(next_sibling.node.data) && trimmable_at(child, next_sibling)) : !child.has_ancestor('EachBlock')
					);

					if (should_trim) {
						data = trim_end(data);
						if (!data) continue;
					}
				}

				// glue text nodes (which could e.g. be separated by comments) together
				if (last_child && last_child.node.type === 'Text') {
					(last_child ).data = data + (last_child ).data;
					continue;
				}

				const wrapper = new TextWrapper(renderer, block, parent, child, data);
				if (wrapper.skip) continue;

				this.nodes.unshift(wrapper);

				link(last_child, last_child = wrapper);
			} else {
				const Wrapper = wrappers[child.type];
				if (!Wrapper) continue;

				const wrapper = new Wrapper(renderer, block, parent, child, strip_whitespace, last_child || next_sibling);
				this.nodes.unshift(wrapper);

				link(last_child, last_child = wrapper);
			}
		}

		if (strip_whitespace) {
			const first = this.nodes[0] ;

			if (first && first.node.type === 'Text') {
				first.data = trim_start(first.data);
				if (!first.data) {
					first.var = null;
					this.nodes.shift();

					if (this.nodes[0]) {
						this.nodes[0].prev = null;
					}
				}
			}
		}

		if (window_wrapper) {
			this.nodes.unshift(window_wrapper);
			link(last_child, window_wrapper);
		}
	}

	render(block, parent_node, parent_nodes) {
		for (let i = 0; i < this.nodes.length; i += 1) {
			this.nodes[i].render(block, parent_node, parent_nodes);
		}
	}
}

class Renderer {
	 // TODO Maybe Renderer shouldn't know about Component?
	

	__init() {this.context = [];}
	__init2() {this.initial_context = [];}
	__init3() {this.context_lookup = new Map();}
	
	__init4() {this.blocks = [];}
	__init5() {this.readonly = new Set();}
	__init6() {this.meta_bindings = [];} // initial values for e.g. window.innerWidth, if there's a <svelte:window> meta tag
	__init7() {this.binding_groups = new Map();}

	
	

	
	

	constructor(component, options) {Renderer.prototype.__init.call(this);Renderer.prototype.__init2.call(this);Renderer.prototype.__init3.call(this);Renderer.prototype.__init4.call(this);Renderer.prototype.__init5.call(this);Renderer.prototype.__init6.call(this);Renderer.prototype.__init7.call(this);
		this.component = component;
		this.options = options;
		this.locate = component.locate; // TODO messy

		this.file_var = options.dev && this.component.get_unique_name('file');

		component.vars.filter(v => !v.hoistable || (v.export_name && !v.module)).forEach(v => this.add_to_context(v.name));

		// ensure store values are included in context
		component.vars.filter(v => v.subscribable).forEach(v => this.add_to_context(`$${v.name}`));

		reserved_keywords.forEach(keyword => {
			if (component.var_lookup.has(keyword)) {
				this.add_to_context(keyword);
			}
		});

		if (component.slots.size > 0) {
			this.add_to_context('$$scope');
			this.add_to_context('#slots');
		}

		if (this.binding_groups.size > 0) {
			this.add_to_context('$$binding_groups');
		}

		// main block
		this.block = new Block({
			renderer: this,
			name: null,
			type: 'component',
			key: null,

			bindings: new Map(),

			dependencies: new Set()
		});

		this.block.has_update_method = true;

		this.fragment = new FragmentWrapper(
			this,
			this.block,
			component.fragment.children,
			null,
			true,
			null
		);

		// TODO messy
		this.blocks.forEach(block => {
			if (block instanceof Block) {
				block.assign_variable_names();
			}
		});

		this.block.assign_variable_names();

		this.fragment.render(this.block, null, x`#nodes` );

		this.context_overflow = this.context.length > 31;

		this.context.forEach(member => {
			const { variable } = member;
			if (variable) {
				member.priority += 2;
				if (variable.mutated || variable.reassigned) member.priority += 4;

				// these determine whether variable is included in initial context
				// array, so must have the highest priority
				if (variable.is_reactive_dependency && (variable.mutated || variable.reassigned)) member.priority += 16;
				if (variable.export_name) member.priority += 32;
				if (variable.referenced) member.priority += 64;
			} else if (member.is_non_contextual) {
				// determine whether variable is included in initial context
				// array, so must have the highest priority
				member.priority += 8;
			}

			if (!member.is_contextual) {
				member.priority += 1;
			}
		});

		this.context.sort((a, b) => (b.priority - a.priority) || ((a.index.value ) - (b.index.value )));
		this.context.forEach((member, i) => member.index.value = i);

		let i = this.context.length;
		while (i--) {
			const member = this.context[i];
			if (member.variable) {
				if (member.variable.referenced || member.variable.export_name || (member.variable.is_reactive_dependency && (member.variable.mutated || member.variable.reassigned))) break;
			} else if (member.is_non_contextual) {
				break;
			}
		}
		this.initial_context = this.context.slice(0, i + 1);
	}

	add_to_context(name, contextual = false) {
		if (!this.context_lookup.has(name)) {
			const member = {
				name,
				index: { type: 'Literal', value: this.context.length }, // index is updated later, but set here to preserve order within groups
				is_contextual: false,
				is_non_contextual: false, // shadowed vars could be contextual and non-contextual
				variable: null,
				priority: 0
			};

			this.context_lookup.set(name, member);
			this.context.push(member);
		}

		const member = this.context_lookup.get(name);

		if (contextual) {
			member.is_contextual = true;
		} else {
			member.is_non_contextual = true;
			member.variable = this.component.var_lookup.get(name);
		}

		return member;
	}

	invalidate(name, value, main_execution_context = false) {
		return renderer_invalidate(this, name, value, main_execution_context);
	}

	dirty(names, is_reactive_declaration = false) {
		const renderer = this;

		const dirty = (is_reactive_declaration
			? x`$$self.$$.dirty`
			: x`#dirty`) ;

		const get_bitmask = () => {
			const bitmask = [];
			names.forEach((name) => {
				const member = renderer.context_lookup.get(name);

				if (!member) return;

				if (member.index.value === -1) {
					throw new Error('unset index');
				}

				const value = member.index.value ;
				const i = (value / 31) | 0;
				const n = 1 << (value % 31);

				if (!bitmask[i]) bitmask[i] = { n: 0, names: [] };

				bitmask[i].n |= n;
				bitmask[i].names.push(name);
			});
			return bitmask;
		};

		// TODO: context-overflow make it less gross
		return {
			// Using a ParenthesizedExpression allows us to create
			// the expression lazily. TODO would be better if
			// context was determined before rendering, so that
			// this indirection was unnecessary
			type: 'ParenthesizedExpression',
			get expression() {
				const bitmask = get_bitmask();

				if (!bitmask.length) {
					return x`${dirty} & /*${names.join(', ')}*/ 0` ;
				}

				if (renderer.context_overflow) {
					return bitmask
						.map((b, i) => ({ b, i }))
						.filter(({ b }) => b)
						.map(({ b, i }) => x`${dirty}[${i}] & /*${b.names.join(', ')}*/ ${b.n}`)
						.reduce((lhs, rhs) => x`${lhs} | ${rhs}`);
				}

				return x`${dirty} & /*${names.join(', ')}*/ ${bitmask[0].n}` ;
			}
		} ;
	}

	reference(node) {
		if (typeof node === 'string') {
			node = { type: 'Identifier', name: node };
		}

		const { name, nodes } = flatten_reference(node);
		const member = this.context_lookup.get(name);

		// TODO is this correct?
		if (this.component.var_lookup.get(name)) {
			this.component.add_reference(name);
		}

		if (member !== undefined) {
			const replacement = x`/*${member.name}*/ #ctx[${member.index}]` ;

			if (nodes[0].loc) replacement.object.loc = nodes[0].loc;
			nodes[0] = replacement;

			return nodes.reduce((lhs, rhs) => x`${lhs}.${rhs}`);
		}

		return node;
	}

	remove_block(block) {
		this.blocks.splice(this.blocks.indexOf(block), 1);
	}
}

var charToInteger$1 = {};
var chars$1 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
for (var i$1 = 0; i$1 < chars$1.length; i$1++) {
    charToInteger$1[chars$1.charCodeAt(i$1)] = i$1;
}
function decode$1(mappings) {
    var decoded = [];
    var line = [];
    var segment = [
        0,
        0,
        0,
        0,
        0,
    ];
    var j = 0;
    for (var i = 0, shift = 0, value = 0; i < mappings.length; i++) {
        var c = mappings.charCodeAt(i);
        if (c === 44) { // ","
            segmentify$1(line, segment, j);
            j = 0;
        }
        else if (c === 59) { // ";"
            segmentify$1(line, segment, j);
            j = 0;
            decoded.push(line);
            line = [];
            segment[0] = 0;
        }
        else {
            var integer = charToInteger$1[c];
            if (integer === undefined) {
                throw new Error('Invalid character (' + String.fromCharCode(c) + ')');
            }
            var hasContinuationBit = integer & 32;
            integer &= 31;
            value += integer << shift;
            if (hasContinuationBit) {
                shift += 5;
            }
            else {
                var shouldNegate = value & 1;
                value >>>= 1;
                if (shouldNegate) {
                    value = value === 0 ? -0x80000000 : -value;
                }
                segment[j] += value;
                j++;
                value = shift = 0; // reset
            }
        }
    }
    segmentify$1(line, segment, j);
    decoded.push(line);
    return decoded;
}
function segmentify$1(line, segment, j) {
    // This looks ugly, but we're creating specialized arrays with a specific
    // length. This is much faster than creating a new array (which v8 expands to
    // a capacity of 17 after pushing the first item), or slicing out a subarray
    // (which is slow). Length 4 is assumed to be the most frequent, followed by
    // length 5 (since not everything will have an associated name), followed by
    // length 1 (it's probably rare for a source substring to not have an
    // associated segment data).
    if (j === 4)
        line.push([segment[0], segment[1], segment[2], segment[3]]);
    else if (j === 5)
        line.push([segment[0], segment[1], segment[2], segment[3], segment[4]]);
    else if (j === 1)
        line.push([segment[0]]);
}
function encode$1(decoded) {
    var sourceFileIndex = 0; // second field
    var sourceCodeLine = 0; // third field
    var sourceCodeColumn = 0; // fourth field
    var nameIndex = 0; // fifth field
    var mappings = '';
    for (var i = 0; i < decoded.length; i++) {
        var line = decoded[i];
        if (i > 0)
            mappings += ';';
        if (line.length === 0)
            continue;
        var generatedCodeColumn = 0; // first field
        var lineMappings = [];
        for (var _i = 0, line_1 = line; _i < line_1.length; _i++) {
            var segment = line_1[_i];
            var segmentMappings = encodeInteger$1(segment[0] - generatedCodeColumn);
            generatedCodeColumn = segment[0];
            if (segment.length > 1) {
                segmentMappings +=
                    encodeInteger$1(segment[1] - sourceFileIndex) +
                        encodeInteger$1(segment[2] - sourceCodeLine) +
                        encodeInteger$1(segment[3] - sourceCodeColumn);
                sourceFileIndex = segment[1];
                sourceCodeLine = segment[2];
                sourceCodeColumn = segment[3];
            }
            if (segment.length === 5) {
                segmentMappings += encodeInteger$1(segment[4] - nameIndex);
                nameIndex = segment[4];
            }
            lineMappings.push(segmentMappings);
        }
        mappings += lineMappings.join(',');
    }
    return mappings;
}
function encodeInteger$1(num) {
    var result = '';
    num = num < 0 ? (-num << 1) | 1 : num << 1;
    do {
        var clamped = num & 31;
        num >>>= 5;
        if (num > 0) {
            clamped |= 32;
        }
        result += chars$1[clamped];
    } while (num > 0);
    return result;
}

/**
 * Copyright 2019 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * Creates a brand new (prototype-less) object with the enumerable-own
 * properties of `target`. Any enumerable-own properties from `source` which
 * are not present on `target` will be copied as well.
 */
function defaults(target, source) {
    return Object.assign(Object.create(null), source, target);
}

/**
 * Copyright 2019 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * Decodes an input sourcemap into a `DecodedSourceMap` sourcemap object.
 *
 * Valid input maps include a `DecodedSourceMap`, a `RawSourceMap`, or JSON
 * representations of either type.
 */
function decodeSourceMap(map) {
    if (typeof map === 'string') {
        map = JSON.parse(map);
    }
    let { mappings } = map;
    if (typeof mappings === 'string') {
        mappings = decode$1(mappings);
    }
    else {
        // Clone the Line so that we can sort it. We don't want to mutate an array
        // that we don't own directly.
        mappings = mappings.map(cloneSegmentLine);
    }
    // Sort each Line's segments. There's no guarantee that segments are sorted for us,
    // and even Chrome's implementation sorts:
    // https://cs.chromium.org/chromium/src/third_party/devtools-frontend/src/front_end/sdk/SourceMap.js?l=507-508&rcl=109232bcf479c8f4ef8ead3cf56c49eb25f8c2f0
    mappings.forEach(sortSegments);
    return defaults({ mappings }, map);
}
function cloneSegmentLine(segments) {
    return segments.slice();
}
function sortSegments(segments) {
    segments.sort(segmentComparator);
}
function segmentComparator(a, b) {
    return a[0] - b[0];
}

/**
 * Copyright 2019 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * A "leaf" node in the sourcemap tree, representing an original, unmodified
 * source file. Recursive segment tracing ends at the `OriginalSource`.
 */
class OriginalSource {
    constructor(filename, content) {
        this.filename = filename;
        this.content = content;
    }
    /**
     * Tracing a `SourceMapSegment` ends when we get to an `OriginalSource`,
     * meaning this line/column location originated from this source file.
     */
    traceSegment(line, column, name) {
        return { column, line, name, source: this };
    }
}

/* istanbul ignore next */
const Url = (typeof URL !== 'undefined' ? URL : require('url').URL);
// Matches "..", which must be preceeded by "/" or the start of the string, and
// must be followed by a "/". We do not eat the following "/", so that the next
// iteration can match on it.
const parentRegex = /(^|\/)\.\.(?=\/|$)/g;
function isAbsoluteUrl(url) {
    try {
        return !!new Url(url);
    }
    catch (e) {
        return false;
    }
}
/**
 * Creates a directory name that is guaranteed to not be in `str`.
 */
function uniqInStr(str) {
    let uniq = String(Math.random()).slice(2);
    while (str.indexOf(uniq) > -1) {
        /* istanbul ignore next */
        uniq += uniq;
    }
    return uniq;
}
/**
 * Removes the filename from the path (everything trailing the last "/"). This
 * is only safe to call on a path, never call with an absolute or protocol
 * relative URL.
 */
function stripPathFilename(path) {
    path = normalizePath(path);
    const index = path.lastIndexOf('/');
    return path.slice(0, index + 1);
}
/**
 * Normalizes a protocol-relative URL, but keeps it protocol relative by
 * stripping out the protocl before returning it.
 */
function normalizeProtocolRelative(input, absoluteBase) {
    const { href, protocol } = new Url(input, absoluteBase);
    return href.slice(protocol.length);
}
/**
 * Normalizes a simple path (one that has no ".."s, or is absolute so ".."s can
 * be normalized absolutely).
 */
function normalizeSimplePath(input) {
    const { href } = new Url(input, 'https://foo.com/');
    return href.slice('https://foo.com/'.length);
}
/**
 * Normalizes a path, ensuring that excess ".."s are preserved for relative
 * paths in the output.
 *
 * If the input is absolute, this will return an absolutey normalized path, but
 * it will not have a leading "/".
 *
 * If the input has a leading "..", the output will have a leading "..".
 *
 * If the input has a leading ".", the output will not have a leading "."
 * unless there are too many ".."s, in which case there will be a leading "..".
 */
function normalizePath(input) {
    // If there are no ".."s, we can treat this as if it were an absolute path.
    // The return won't be an absolute path, so it's easy.
    if (!parentRegex.test(input))
        return normalizeSimplePath(input);
    // We already found one "..". Let's see how many there are.
    let total = 1;
    while (parentRegex.test(input))
        total++;
    // If there are ".."s, we need to prefix the the path with the same number of
    // unique directories. This is to ensure that we "remember" how many parent
    // directories we are accessing. Eg, "../../.." must keep 3, and "foo/../.."
    // must keep 1.
    const uniqDirectory = `z${uniqInStr(input)}/`;
    // uniqDirectory is just a "z", followed by numbers, followed by a "/". So
    // generating a runtime regex from it is safe. We'll use this search regex to
    // strip out our uniq directory names and insert any needed ".."s.
    const search = new RegExp(`^(?:${uniqDirectory})*`);
    // Now we can resolve the total path. If there are excess ".."s, they will
    // eliminate one or more of the unique directories we prefix with.
    const relative = normalizeSimplePath(uniqDirectory.repeat(total) + input);
    // We can now count the number of unique directories that were eliminated. If
    // there were 3, and 1 was eliminated, we know we only need to add 1 "..". If
    // 2 were eliminated, we need to insert 2 ".."s. If all 3 were eliminated,
    // then we need 3, etc. This replace is guranteed to match (it may match 0 or
    // more times), and we can count the total match to see how many were eliminated.
    return relative.replace(search, (all) => {
        const leftover = all.length / uniqDirectory.length;
        return '../'.repeat(total - leftover);
    });
}
/**
 * Attempts to resolve `input` URL relative to `base`.
 */
function resolve(input, base) {
    if (!base)
        base = '';
    // Absolute URLs are very easy to resolve right.
    if (isAbsoluteUrl(input))
        return new Url(input).href;
    if (base) {
        // Absolute URLs are easy...
        if (isAbsoluteUrl(base))
            return new Url(input, base).href;
        // If base is protocol relative, we'll resolve with it but keep the result
        // protocol relative.
        if (base.startsWith('//'))
            return normalizeProtocolRelative(input, `https:${base}`);
    }
    // Normalize input, but keep it protocol relative. We know base doesn't supply
    // a protocol, because that would have been handled above.
    if (input.startsWith('//'))
        return normalizeProtocolRelative(input, 'https://foo.com/');
    // We now know that base (if there is one) and input are paths. We've handled
    // both absolute and protocol-relative variations above.
    // Absolute paths don't need any special handling, because they cannot have
    // extra "." or ".."s. That'll all be stripped away. Input takes priority here,
    // because if input is an absolute path, base path won't affect it in any way.
    if (input.startsWith('/'))
        return '/' + normalizeSimplePath(input);
    // Since input and base are paths, we need to join them to do any further
    // processing. Paths are joined at the directory level, so we need to remove
    // the base's filename before joining. We also know that input does not have a
    // leading slash, and that the stripped base will have a trailing slash if
    // there are any directories (or it'll be empty).
    const joined = stripPathFilename(base) + input;
    // If base is an absolute path, then input will be relative to it.
    if (base.startsWith('/'))
        return '/' + normalizeSimplePath(joined);
    // We now know both base (if there is one) and input are relative paths.
    const relative = normalizePath(joined);
    // If base started with a leading ".", or there is no base and input started
    // with a ".", then we need to ensure that the relative path starts with a
    // ".". We don't know if relative starts with a "..", though, so check before
    // prepending.
    if ((base || input).startsWith('.') && !relative.startsWith('.')) {
        return './' + relative;
    }
    return relative;
}

/**
 * Copyright 2019 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
function resolve$1(input, base) {
    // The base is always treated as a directory, if it's not empty.
    // https://github.com/mozilla/source-map/blob/8cb3ee57/lib/util.js#L327
    // https://github.com/chromium/chromium/blob/da4adbb3/third_party/blink/renderer/devtools/front_end/sdk/SourceMap.js#L400-L401
    if (base && !base.endsWith('/'))
        base += '/';
    return resolve(input, base);
}

/**
 * Copyright 2019 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * A binary search implementation that returns the index if a match is found,
 * or the negated index of where the `needle` should be inserted.
 *
 * The `comparator` callback receives both the `item` under comparison and the
 * needle we are searching for. It must return `0` if the `item` is a match,
 * any negative number if `item` is too small (and we must search after it), or
 * any positive number if the `item` is too large (and we must search before
 * it).
 *
 * If no match is found, a negated index of where to insert the `needle` is
 * returned. This negated index is guaranteed to be less than 0. To insert an
 * item, negate it (again) and splice:
 *
 * ```js
 * const array = [1, 3];
 * const needle = 2;
 * const index = binarySearch(array, needle, (item, needle) => item - needle);
 *
 * assert.equal(index, -2);
 * assert.equal(~index, 1);
 * array.splice(~index, 0, needle);
 * assert.deepEqual(array, [1, 2, 3]);
 * ```
 */
function binarySearch(haystack, needle, comparator) {
    let low = 0;
    let high = haystack.length - 1;
    while (low <= high) {
        const mid = low + ((high - low) >> 1);
        const cmp = comparator(haystack[mid], needle);
        if (cmp === 0) {
            return mid;
        }
        if (cmp < 0) {
            low = mid + 1;
        }
        else {
            high = mid - 1;
        }
    }
    return ~low;
}

/**
 * Copyright 2019 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * FastStringArray acts like a `Set` (allowing only one occurrence of a string
 * `key`), but provides the index of the `key` in the backing array.
 *
 * This is designed to allow synchronizing a second array with the contents of
 * the backing array, like how `sourcesContent[i]` is the source content
 * associated with `source[i]`, and there are never duplicates.
 */
class FastStringArray {
    constructor() {
        this.indexes = Object.create(null);
        this.array = [];
    }
    /**
     * Puts `key` into the backing array, if it is not already present. Returns
     * the index of the `key` in the backing array.
     */
    put(key) {
        const { array, indexes } = this;
        // The key may or may not be present. If it is present, it's a number.
        let index = indexes[key];
        // If it's not yet present, we need to insert it and track the index in the
        // indexes.
        if (index === undefined) {
            index = indexes[key] = array.length;
            array.push(key);
        }
        return index;
    }
}

/**
 * Copyright 2019 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * SourceMapTree represents a single sourcemap, with the ability to trace
 * mappings into its child nodes (which may themselves be SourceMapTrees).
 */
class SourceMapTree {
    constructor(map, sources) {
        this.map = map;
        this.sources = sources;
    }
    /**
     * traceMappings is only called on the root level SourceMapTree, and begins
     * the process of resolving each mapping in terms of the original source
     * files.
     */
    traceMappings() {
        const mappings = [];
        const names = new FastStringArray();
        const sources = new FastStringArray();
        const sourcesContent = [];
        const { mappings: rootMappings, names: rootNames } = this.map;
        for (let i = 0; i < rootMappings.length; i++) {
            const segments = rootMappings[i];
            const tracedSegments = [];
            for (let j = 0; j < segments.length; j++) {
                const segment = segments[j];
                // 1-length segments only move the current generated column, there's no
                // source information to gather from it.
                if (segment.length === 1)
                    continue;
                const source = this.sources[segment[1]];
                const traced = source.traceSegment(segment[2], segment[3], segment.length === 5 ? rootNames[segment[4]] : '');
                if (!traced)
                    continue;
                // So we traced a segment down into its original source file. Now push a
                // new segment pointing to this location.
                const { column, line, name } = traced;
                const { content, filename } = traced.source;
                // Store the source location, and ensure we keep sourcesContent up to
                // date with the sources array.
                const sourceIndex = sources.put(filename);
                sourcesContent[sourceIndex] = content;
                // This looks like unnecessary duplication, but it noticeably increases
                // performance. If we were to push the nameIndex onto length-4 array, v8
                // would internally allocate 22 slots! That's 68 wasted bytes! Array
                // literals have the same capacity as their length, saving memory.
                if (name) {
                    tracedSegments.push([segment[0], sourceIndex, line, column, names.put(name)]);
                }
                else {
                    tracedSegments.push([segment[0], sourceIndex, line, column]);
                }
            }
            mappings.push(tracedSegments);
        }
        // TODO: Make all sources relative to the sourceRoot.
        return defaults({
            mappings,
            names: names.array,
            sources: sources.array,
            sourcesContent,
        }, this.map);
    }
    /**
     * traceSegment is only called on children SourceMapTrees. It recurses down
     * into its own child SourceMapTrees, until we find the original source map.
     */
    traceSegment(line, column, name) {
        const { mappings, names } = this.map;
        // It's common for parent sourcemaps to have pointers to lines that have no
        // mapping (like a "//# sourceMappingURL=") at the end of the child file.
        if (line >= mappings.length)
            return null;
        const segments = mappings[line];
        if (segments.length === 0)
            return null;
        let index = binarySearch(segments, column, segmentComparator$1);
        if (index === -1)
            return null; // we come before any mapped segment
        // If we can't find a segment that lines up to this column, we use the
        // segment before.
        if (index < 0) {
            index = ~index - 1;
        }
        const segment = segments[index];
        // 1-length segments only move the current generated column, there's no
        // source information to gather from it.
        if (segment.length === 1)
            return null;
        const source = this.sources[segment[1]];
        // So now we can recurse down, until we hit the original source file.
        return source.traceSegment(segment[2], segment[3], 
        // A child map's recorded name for this segment takes precedence over the
        // parent's mapped name. Imagine a mangler changing the name over, etc.
        segment.length === 5 ? names[segment[4]] : name);
    }
}
function segmentComparator$1(segment, column) {
    return segment[0] - column;
}

/**
 * Copyright 2019 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * Removes the filename from a path.
 */
function stripFilename(path) {
    if (!path)
        return '';
    const index = path.lastIndexOf('/');
    return path.slice(0, index + 1);
}

/**
 * Copyright 2019 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
function asArray(value) {
    if (Array.isArray(value))
        return value;
    return [value];
}
/**
 * Recursively builds a tree structure out of sourcemap files, with each node
 * being either an `OriginalSource` "leaf" or a `SourceMapTree` composed of
 * `OriginalSource`s and `SourceMapTree`s.
 *
 * Every sourcemap is composed of a collection of source files and mappings
 * into locations of those source files. When we generate a `SourceMapTree` for
 * the sourcemap, we attempt to load each source file's own sourcemap. If it
 * does not have an associated sourcemap, it is considered an original,
 * unmodified source file.
 */
function buildSourceMapTree(input, loader, relativeRoot) {
    const maps = asArray(input).map(decodeSourceMap);
    const map = maps.pop();
    for (let i = 0; i < maps.length; i++) {
        if (maps[i].sources.length !== 1) {
            throw new Error(`Transformation map ${i} must have exactly one source file.\n` +
                'Did you specify these with the most recent transformation maps first?');
        }
    }
    const { sourceRoot, sources, sourcesContent } = map;
    const children = sources.map((sourceFile, i) => {
        // Each source file is loaded relative to the sourcemap's own sourceRoot,
        // which is itself relative to the sourcemap's parent.
        const uri = resolve$1(sourceFile || '', resolve$1(sourceRoot || '', stripFilename(relativeRoot)));
        // Use the provided loader callback to retrieve the file's sourcemap.
        // TODO: We should eventually support async loading of sourcemap files.
        const sourceMap = loader(uri);
        // If there is no sourcemap, then it is an unmodified source file.
        if (!sourceMap) {
            // The source file's actual contents must be included in the sourcemap
            // (done when generating the sourcemap) for it to be included as a
            // sourceContent in the output sourcemap.
            const sourceContent = sourcesContent ? sourcesContent[i] : null;
            return new OriginalSource(uri, sourceContent);
        }
        // Else, it's a real sourcemap, and we need to recurse into it to load its
        // source files.
        return buildSourceMapTree(decodeSourceMap(sourceMap), loader, uri);
    });
    let tree = new SourceMapTree(map, children);
    for (let i = maps.length - 1; i >= 0; i--) {
        tree = new SourceMapTree(maps[i], [tree]);
    }
    return tree;
}

/**
 * Copyright 2019 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * A SourceMap v3 compatible sourcemap, which only includes fields that were
 * provided to it.
 */
class SourceMap {
    constructor(map, excludeContent) {
        this.version = 3; // SourceMap spec says this should be first.
        if ('file' in map)
            this.file = map.file;
        this.mappings = encode$1(map.mappings);
        this.names = map.names;
        // TODO: We first need to make all source URIs relative to the sourceRoot
        // before we can support a sourceRoot.
        // if ('sourceRoot' in map) this.sourceRoot = map.sourceRoot;
        this.sources = map.sources;
        if (!excludeContent && 'sourcesContent' in map)
            this.sourcesContent = map.sourcesContent;
    }
    toString() {
        return JSON.stringify(this);
    }
}

/**
 * Copyright 2019 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
/**
 * Traces through all the mappings in the root sourcemap, through the sources
 * (and their sourcemaps), all the way back to the original source location.
 *
 * `loader` will be called every time we encounter a source file. If it returns
 * a sourcemap, we will recurse into that sourcemap to continue the trace. If
 * it returns a falsey value, that source file is treated as an original,
 * unmodified source file.
 *
 * Pass `excludeContent` content to exclude any self-containing source file
 * content from the output sourcemap.
 */
function remapping(input, loader, excludeContent) {
    const graph = buildSourceMapTree(input, loader);
    return new SourceMap(graph.traceMappings(), !!excludeContent);
}

function last_line_length(s) {
	return s.length - s.lastIndexOf('\n') - 1;
}

// mutate map in-place
function sourcemap_add_offset(
	map, offset, source_index
) {
	if (map.mappings.length == 0) return;
	for (let line = 0; line < map.mappings.length; line++) {
		const segment_list = map.mappings[line];
		for (let segment = 0; segment < segment_list.length; segment++) {
			const seg = segment_list[segment];
			// shift only segments that belong to component source file
			if (seg[1] === source_index) { // also ensures that seg.length >= 4
				// shift column if it points at the first line
				if (seg[2] === 0) {
					seg[3] += offset.column;
				}
				// shift line
				seg[2] += offset.line;
			}
		}
	}
}

function merge_tables(this_table, other_table) {
	const new_table = this_table.slice();
	const idx_map = [];
	other_table = other_table || [];
	let val_changed = false;
	for (const [other_idx, other_val] of other_table.entries()) {
		const this_idx = this_table.indexOf(other_val);
		if (this_idx >= 0) {
			idx_map[other_idx] = this_idx;
		} else {
			const new_idx = new_table.length;
			new_table[new_idx] = other_val;
			idx_map[other_idx] = new_idx;
			val_changed = true;
		}
	}
	let idx_changed = val_changed;
	if (val_changed) {
		if (idx_map.find((val, idx) => val != idx) === undefined) {
			// idx_map is identity map [0, 1, 2, 3, 4, ....]
			idx_changed = false;
		}
	}
	return [new_table, idx_map, val_changed, idx_changed];
}

function pushArray(_this, other) {
	// We use push to mutate in place for memory and perf reasons
	// We use the for loop instead of _this.push(...other) to avoid the JS engine's function argument limit (65,535 in JavascriptCore)
	for (let i = 0; i < other.length; i++) {
		_this.push(other[i]);
	}
}

class MappedCode {
	
	

	constructor(string = '', map = null) {
		this.string = string;
		if (map) {
			this.map = map ;
		} else {
			this.map = {
				version: 3,
				mappings: [],
				sources: [],
				names: []
			};
		}
	}

	/**
	 * concat in-place (mutable), return this (chainable)
	 * will also mutate the `other` object
	 */
	concat(other) {
		// noop: if one is empty, return the other
		if (other.string == '') return this;
		if (this.string == '') {
			this.string = other.string;
			this.map = other.map;
			return this;
		}

		// compute last line length before mutating
		const column_offset = last_line_length(this.string);

		this.string += other.string;

		const m1 = this.map;
		const m2 = other.map;

		if (m2.mappings.length == 0) return this;

		// combine sources and names
		const [sources, new_source_idx, sources_changed, sources_idx_changed] = merge_tables(m1.sources, m2.sources);
		const [names, new_name_idx, names_changed, names_idx_changed] = merge_tables(m1.names, m2.names);

		if (sources_changed) m1.sources = sources;
		if (names_changed) m1.names = names;

		// unswitched loops are faster
		if (sources_idx_changed && names_idx_changed) {
			for (let line = 0; line < m2.mappings.length; line++) {
				const segment_list = m2.mappings[line];
				for (let segment = 0; segment < segment_list.length; segment++) {
					const seg = segment_list[segment];
					if (seg[1] >= 0) seg[1] = new_source_idx[seg[1]];
					if (seg[4] >= 0) seg[4] = new_name_idx[seg[4]];
				}
			}
		} else if (sources_idx_changed) {
			for (let line = 0; line < m2.mappings.length; line++) {
				const segment_list = m2.mappings[line];
				for (let segment = 0; segment < segment_list.length; segment++) {
					const seg = segment_list[segment];
					if (seg[1] >= 0) seg[1] = new_source_idx[seg[1]];
				}
			}
		} else if (names_idx_changed) {
			for (let line = 0; line < m2.mappings.length; line++) {
				const segment_list = m2.mappings[line];
				for (let segment = 0; segment < segment_list.length; segment++) {
					const seg = segment_list[segment];
					if (seg[4] >= 0) seg[4] = new_name_idx[seg[4]];
				}
			}
		}

		// combine the mappings

		// combine
		// 1. last line of first map
		// 2. first line of second map
		// columns of 2 must be shifted

		if (m2.mappings.length > 0 && column_offset > 0) {
			const first_line = m2.mappings[0];
			for (let i = 0; i < first_line.length; i++) {
				first_line[i][0] += column_offset;
			}
		}

		// combine last line + first line
		pushArray(m1.mappings[m1.mappings.length - 1], m2.mappings.shift());

		// append other lines
		pushArray(m1.mappings, m2.mappings);

		return this;
	}

	static from_processed(string, map) {
		const line_count = string.split('\n').length;

		if (map) {
			// ensure that count of source map mappings lines
			// is equal to count of generated code lines
			// (some tools may produce less)
			const missing_lines = line_count - map.mappings.length;
			for (let i = 0; i < missing_lines; i++) {
				map.mappings.push([]);
			}
			return new MappedCode(string, map);
		}

		if (string == '') return new MappedCode();
		map = { version: 3, names: [], sources: [], mappings: [] };

		// add empty SourceMapSegment[] for every line
		for (let i = 0; i < line_count; i++) map.mappings.push([]);
		return new MappedCode(string, map);
	}

	static from_source({ source, file_basename, get_location }) {
		let offset = get_location(0);

		if (!offset) offset = { line: 0, column: 0 };
		const map = { version: 3, names: [], sources: [file_basename], mappings: [] };
		if (source == '') return new MappedCode(source, map);

		// we create a high resolution identity map here,
		// we know that it will eventually be merged with svelte's map,
		// at which stage the resolution will decrease.
		const line_list = source.split('\n');
		for (let line = 0; line < line_list.length; line++) {
			map.mappings.push([]);
			const token_list = line_list[line].split(/([^\d\w\s]|\s+)/g);
			for (let token = 0, column = 0; token < token_list.length; token++) {
				if (token_list[token] == '') continue;
				map.mappings[line].push([column, 0, offset.line + line, column]);
				column += token_list[token].length;
			}
		}
		// shift columns in first line
		const segment_list = map.mappings[0];
		for (let segment = 0; segment < segment_list.length; segment++) {
			segment_list[segment][3] += offset.column;
		}
		return new MappedCode(source, map);
	}
}

function combine_sourcemaps(
	filename,
	sourcemap_list
) {
	if (sourcemap_list.length == 0) return null;

	let map_idx = 1;
	const map =
		sourcemap_list.slice(0, -1)
			.find(m => m.sources.length !== 1) === undefined

			? remapping( // use array interface
				// only the oldest sourcemap can have multiple sources
				sourcemap_list,
				() => null,
				true // skip optional field `sourcesContent`
			)

			: remapping( // use loader interface
				sourcemap_list[0], // last map
				function loader(sourcefile) {
					if (sourcefile === filename && sourcemap_list[map_idx]) {
						return sourcemap_list[map_idx++]; // idx 1, 2, ...
						// bundle file = branch node
					} else {
						return null; // source file = leaf node
					}
				} ,
				true
			);

	if (!map.file) delete map.file; // skip optional field `file`

	return map;
}

// browser vs node.js
const b64enc = typeof btoa == 'function' ? btoa : b => Buffer.from(b).toString('base64');
const b64dec = typeof atob == 'function' ? atob : a => Buffer.from(a, 'base64').toString();

function apply_preprocessor_sourcemap(filename, svelte_map, preprocessor_map_input) {
	if (!svelte_map || !preprocessor_map_input) return svelte_map;

	const preprocessor_map = typeof preprocessor_map_input === 'string' ? JSON.parse(preprocessor_map_input) : preprocessor_map_input;

	const result_map = combine_sourcemaps(
		filename,
		[
			svelte_map ,
			preprocessor_map
		]
	) ;

	// Svelte expects a SourceMap which includes toUrl and toString. Instead of wrapping our output in a class,
	// we just tack on the extra properties.
	Object.defineProperties(result_map, {
		toString: {
			enumerable: false,
			value: function toString() {
				return JSON.stringify(this);
			}
		},
		toUrl: {
			enumerable: false,
			value: function toUrl() {
				return 'data:application/json;charset=utf-8;base64,' + b64enc(this.toString());
			}
		}
	});

	return result_map ;
}

// parse attached sourcemap in processed.code
function parse_attached_sourcemap(processed, tag_name) {
	const r_in = '[#@]\\s*sourceMappingURL\\s*=\\s*(\\S*)';
	const regex = (tag_name == 'script')
		? new RegExp('(?://'+r_in+')|(?:/\\*'+r_in+'\\s*\\*/)$')
		: new RegExp('/\\*'+r_in+'\\s*\\*/$');
	function log_warning(message) {
		// code_start: help to find preprocessor
		const code_start = processed.code.length < 100 ? processed.code : (processed.code.slice(0, 100) + ' [...]');
		console.warn(`warning: ${message}. processed.code = ${JSON.stringify(code_start)}`);
	}
	processed.code = processed.code.replace(regex, (_, match1, match2) => {
		const map_url = (tag_name == 'script') ? (match1 || match2) : match1;
		const map_data = (map_url.match(/data:(?:application|text)\/json;(?:charset[:=]\S+?;)?base64,(\S*)/) || [])[1];
		if (map_data) {
			// sourceMappingURL is data URL
			if (processed.map) {
				log_warning('Not implemented. ' +
					'Found sourcemap in both processed.code and processed.map. ' +
					'Please update your preprocessor to return only one sourcemap.');
				// ignore attached sourcemap
				return '';
			}
			processed.map = b64dec(map_data); // use attached sourcemap
			return ''; // remove from processed.code
		}
		// sourceMappingURL is path or URL
		if (!processed.map) {
			log_warning(`Found sourcemap path ${JSON.stringify(map_url)} in processed.code, but no sourcemap data. ` +
				'Please update your preprocessor to return sourcemap data directly.');
		}
		// ignore sourcemap path
		return ''; // remove from processed.code
	});
}

function dom(
	component,
	options
) {
	const { name } = component;

	const renderer = new Renderer(component, options);
	const { block } = renderer;

	block.has_outro_method = true;

	// prevent fragment being created twice (#1063)
	if (options.customElement) block.chunks.create.push(b`this.c = @noop;`);

	const body = [];

	if (renderer.file_var) {
		const file = component.file ? x`"${component.file}"` : x`undefined`;
		body.push(b`const ${renderer.file_var} = ${file};`);
	}

	const css = component.stylesheet.render(options.filename, !options.customElement);

	css.map = apply_preprocessor_sourcemap(options.filename, css.map, options.sourcemap );

	const styles = component.stylesheet.has_styles && options.dev
		? `${css.code}\n/*# sourceMappingURL=${css.map.toUrl()} */`
		: css.code;

	const add_css = component.get_unique_name('add_css');

	const should_add_css = (
		!options.customElement &&
		!!styles &&
		options.css !== false
	);

	if (should_add_css) {
		body.push(b`
			function ${add_css}() {
				var style = @element("style");
				style.id = "${component.stylesheet.id}-style";
				style.textContent = "${styles}";
				@append(@_document.head, style);
			}
		`);
	}

	// fix order
	// TODO the deconflicted names of blocks are reversed... should set them here
	const blocks = renderer.blocks.slice().reverse();

	body.push(...blocks.map(block => {
		// TODO this is a horrible mess — renderer.blocks
		// contains a mixture of Blocks and Nodes
		if ((block ).render) return (block ).render();
		return block;
	}));

	if (options.dev && !options.hydratable) {
		block.chunks.claim.push(
			b`throw new @_Error("options.hydrate only works if the component was compiled with the \`hydratable: true\` option");`
		);
	}

	const uses_slots = component.var_lookup.has('$$slots');
	let compute_slots;
	if (uses_slots) {
		compute_slots = b`
			const $$slots = @compute_slots(#slots);
		`;
	}


	const uses_props = component.var_lookup.has('$$props');
	const uses_rest = component.var_lookup.has('$$restProps');
	const $$props = uses_props || uses_rest ? '$$new_props' : '$$props';
	const props = component.vars.filter(variable => !variable.module && variable.export_name);
	const writable_props = props.filter(variable => variable.writable);

	const omit_props_names = component.get_unique_name('omit_props_names');
	const compute_rest = x`@compute_rest_props($$props, ${omit_props_names.name})`;
	const rest = uses_rest ? b`
		const ${omit_props_names.name} = [${props.map(prop => `"${prop.export_name}"`).join(',')}];
		let $$restProps = ${compute_rest};
	` : null;

	const set = (uses_props || uses_rest || writable_props.length > 0 || component.slots.size > 0)
		? x`
			${$$props} => {
				${uses_props && renderer.invalidate('$$props', x`$$props = @assign(@assign({}, $$props), @exclude_internal_props($$new_props))`)}
				${uses_rest && !uses_props && x`$$props = @assign(@assign({}, $$props), @exclude_internal_props($$new_props))`}
				${uses_rest && renderer.invalidate('$$restProps', x`$$restProps = ${compute_rest}`)}
				${writable_props.map(prop =>
					b`if ('${prop.export_name}' in ${$$props}) ${renderer.invalidate(prop.name, x`${prop.name} = ${$$props}.${prop.export_name}`)};`
				)}
				${component.slots.size > 0 &&
				b`if ('$$scope' in ${$$props}) ${renderer.invalidate('$$scope', x`$$scope = ${$$props}.$$scope`)};`}
			}
		`
		: null;

	const accessors = [];

	const not_equal = component.component_options.immutable ? x`@not_equal` : x`@safe_not_equal`;
	let dev_props_check;
	let inject_state;
	let capture_state;
	let props_inject;

	props.forEach(prop => {
		const variable = component.var_lookup.get(prop.name);

		if (!variable.writable || component.component_options.accessors) {
			accessors.push({
				type: 'MethodDefinition',
				kind: 'get',
				key: { type: 'Identifier', name: prop.export_name },
				value: x`function() {
					return ${prop.hoistable ? prop.name : x`this.$$.ctx[${renderer.context_lookup.get(prop.name).index}]`}
				}`
			});
		} else if (component.compile_options.dev) {
			accessors.push({
				type: 'MethodDefinition',
				kind: 'get',
				key: { type: 'Identifier', name: prop.export_name },
				value: x`function() {
					throw new @_Error("<${component.tag}>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
				}`
			});
		}

		if (component.component_options.accessors) {
			if (variable.writable && !renderer.readonly.has(prop.name)) {
				accessors.push({
					type: 'MethodDefinition',
					kind: 'set',
					key: { type: 'Identifier', name: prop.export_name },
					value: x`function(${prop.name}) {
						this.$set({ ${prop.export_name}: ${prop.name} });
						@flush();
					}`
				});
			} else if (component.compile_options.dev) {
				accessors.push({
					type: 'MethodDefinition',
					kind: 'set',
					key: { type: 'Identifier', name: prop.export_name },
					value: x`function(value) {
						throw new @_Error("<${component.tag}>: Cannot set read-only property '${prop.export_name}'");
					}`
				});
			}
		} else if (component.compile_options.dev) {
			accessors.push({
				type: 'MethodDefinition',
				kind: 'set',
				key: { type: 'Identifier', name: prop.export_name },
				value: x`function(value) {
					throw new @_Error("<${component.tag}>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
				}`
			});
		}
	});

	if (component.compile_options.dev) {
		// checking that expected ones were passed
		const expected = props.filter(prop => prop.writable && !prop.initialised);

		if (expected.length) {
			dev_props_check = b`
				const { ctx: #ctx } = this.$$;
				const props = ${options.customElement ? x`this.attributes` : x`options.props || {}`};
				${expected.map(prop => b`
				if (${renderer.reference(prop.name)} === undefined && !('${prop.export_name}' in props)) {
					@_console.warn("<${component.tag}> was created without expected prop '${prop.export_name}'");
				}`)}
			`;
		}

		const capturable_vars = component.vars.filter(v => !v.internal && !v.global && !v.name.startsWith('$$'));

		if (capturable_vars.length > 0) {
			capture_state = x`() => ({ ${capturable_vars.map(prop => p`${prop.name}`)} })`;
		}

		const injectable_vars = capturable_vars.filter(v => !v.module && v.writable && v.name[0] !== '$');

		if (uses_props || injectable_vars.length > 0) {
			inject_state = x`
				${$$props} => {
					${uses_props && renderer.invalidate('$$props', x`$$props = @assign(@assign({}, $$props), $$new_props)`)}
					${injectable_vars.map(
						v => b`if ('${v.name}' in $$props) ${renderer.invalidate(v.name, x`${v.name} = ${$$props}.${v.name}`)};`
					)}
				}
			`;

			props_inject = b`
				if ($$props && "$$inject" in $$props) {
					$$self.$inject_state($$props.$$inject);
				}
			`;
		}
	}

	// instrument assignments
	if (component.ast.instance) {
		let scope = component.instance_scope;
		const map = component.instance_scope_map;
		let execution_context = null;

		walk(component.ast.instance.content, {
			enter(node) {
				if (map.has(node)) {
					scope = map.get(node) ;

					if (!execution_context && !scope.block) {
						execution_context = node;
					}
				} else if (!execution_context && node.type === 'LabeledStatement' && node.label.name === '$') {
					execution_context = node;
				}
			},

			leave(node) {
				if (map.has(node)) {
					scope = scope.parent;
				}

				if (execution_context === node) {
					execution_context = null;
				}

				if (node.type === 'AssignmentExpression' || node.type === 'UpdateExpression') {
					const assignee = node.type === 'AssignmentExpression' ? node.left : node.argument;

					// normally (`a = 1`, `b.c = 2`), there'll be a single name
					// (a or b). In destructuring cases (`[d, e] = [e, d]`) there
					// may be more, in which case we need to tack the extra ones
					// onto the initial function call
					const names = new Set(extract_names(assignee));

					this.replace(invalidate(renderer, scope, node, names, execution_context === null));
				}
			}
		});

		component.rewrite_props(({ name, reassigned, export_name }) => {
			const value = `$${name}`;
			const i = renderer.context_lookup.get(`$${name}`).index;

			const insert = (reassigned || export_name)
				? b`${`$$subscribe_${name}`}()`
				: b`@component_subscribe($$self, ${name}, #value => $$invalidate(${i}, ${value} = #value))`;

			if (component.compile_options.dev) {
				return b`@validate_store(${name}, '${name}'); ${insert}`;
			}

			return insert;
		});
	}

	const args = [x`$$self`];
	const has_invalidate = props.length > 0 ||
		component.has_reactive_assignments ||
		component.slots.size > 0 ||
		capture_state ||
		inject_state;
	if (has_invalidate) {
		args.push(x`$$props`, x`$$invalidate`);
	} else if (component.compile_options.dev) {
		// $$props arg is still needed for unknown prop check
		args.push(x`$$props`);
	}

	const has_create_fragment = component.compile_options.dev || block.has_content();
	if (has_create_fragment) {
		body.push(b`
			function create_fragment(#ctx) {
				${block.get_contents()}
			}
		`);
	}

	body.push(b`
		${component.extract_javascript(component.ast.module)}

		${component.fully_hoisted}
	`);

	const filtered_props = props.filter(prop => {
		const variable = component.var_lookup.get(prop.name);

		if (variable.hoistable) return false;
		return prop.name[0] !== '$';
	});

	const reactive_stores = component.vars.filter(variable => variable.name[0] === '$' && variable.name[1] !== '$');

	const instance_javascript = component.extract_javascript(component.ast.instance);

	const has_definition = (
		component.compile_options.dev ||
		(instance_javascript && instance_javascript.length > 0) ||
		filtered_props.length > 0 ||
		uses_props ||
		component.partly_hoisted.length > 0 ||
		renderer.initial_context.length > 0 ||
		component.reactive_declarations.length > 0 ||
		capture_state ||
		inject_state
	);

	const definition = has_definition
		? component.alias('instance')
		: { type: 'Literal', value: null };

	const reactive_store_subscriptions = reactive_stores
		.filter(store => {
			const variable = component.var_lookup.get(store.name.slice(1));
			return !variable || variable.hoistable;
		})
		.map(({ name }) => b`
			${component.compile_options.dev && b`@validate_store(${name.slice(1)}, '${name.slice(1)}');`}
			@component_subscribe($$self, ${name.slice(1)}, $$value => $$invalidate(${renderer.context_lookup.get(name).index}, ${name} = $$value));
		`);

	const resubscribable_reactive_store_unsubscribers = reactive_stores
		.filter(store => {
			const variable = component.var_lookup.get(store.name.slice(1));
			return variable && (variable.reassigned || variable.export_name);
		})
		.map(({ name }) => b`$$self.$$.on_destroy.push(() => ${`$$unsubscribe_${name.slice(1)}`}());`);

	if (has_definition) {
		const reactive_declarations = [];
		const fixed_reactive_declarations = []; // not really 'reactive' but whatever

		component.reactive_declarations.forEach(d => {
			const dependencies = Array.from(d.dependencies);
			const uses_rest_or_props = !!dependencies.find(n => n === '$$props' || n === '$$restProps');

			const writable = dependencies.filter(n => {
				const variable = component.var_lookup.get(n);
				return variable && (variable.export_name || variable.mutated || variable.reassigned);
			});

			const condition = !uses_rest_or_props && writable.length > 0 && renderer.dirty(writable, true);

			let statement = d.node; // TODO remove label (use d.node.body) if it's not referenced

			if (condition) statement = b`if (${condition}) { ${statement} }`[0] ;

			if (condition || uses_rest_or_props) {
				reactive_declarations.push(statement);
			} else {
				fixed_reactive_declarations.push(statement);
			}
		});

		const injected = Array.from(component.injected_reactive_declaration_vars).filter(name => {
			const variable = component.var_lookup.get(name);
			return variable.injected && variable.name[0] !== '$';
		});

		const reactive_store_declarations = reactive_stores.map(variable => {
			const $name = variable.name;
			const name = $name.slice(1);

			const store = component.var_lookup.get(name);
			if (store && (store.reassigned || store.export_name)) {
				const unsubscribe = `$$unsubscribe_${name}`;
				const subscribe = `$$subscribe_${name}`;
				const i = renderer.context_lookup.get($name).index;

				return b`let ${$name}, ${unsubscribe} = @noop, ${subscribe} = () => (${unsubscribe}(), ${unsubscribe} = @subscribe(${name}, $$value => $$invalidate(${i}, ${$name} = $$value)), ${name})`;
			}

			return b`let ${$name};`;
		});

		let unknown_props_check;
		if (component.compile_options.dev && !(uses_props || uses_rest)) {
			unknown_props_check = b`
				const writable_props = [${writable_props.map(prop => x`'${prop.export_name}'`)}];
				@_Object.keys($$props).forEach(key => {
					if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$') @_console.warn(\`<${component.tag}> was created with unknown prop '\${key}'\`);
				});
			`;
		}

		const return_value = {
			type: 'ArrayExpression',
			elements: renderer.initial_context.map(member => ({
				type: 'Identifier',
				name: member.name
			}) )
		};

		body.push(b`
			function ${definition}(${args}) {
				${injected.map(name => b`let ${name};`)}

				${rest}

				${reactive_store_declarations}

				${reactive_store_subscriptions}

				${resubscribable_reactive_store_unsubscribers}

				${component.slots.size || component.compile_options.dev || uses_slots ? b`let { $$slots: #slots = {}, $$scope } = $$props;` : null}
				${component.compile_options.dev && b`@validate_slots('${component.tag}', #slots, [${[...component.slots.keys()].map(key => `'${key}'`).join(',')}]);`}
				${compute_slots}

				${instance_javascript}

				${unknown_props_check}

				${renderer.binding_groups.size > 0 && b`const $$binding_groups = [${[...renderer.binding_groups.keys()].map(_ => x`[]`)}];`}

				${component.partly_hoisted}

				${set && b`$$self.$$set = ${set};`}

				${capture_state && b`$$self.$capture_state = ${capture_state};`}

				${inject_state && b`$$self.$inject_state = ${inject_state};`}

				${/* before reactive declarations */ props_inject}

				${reactive_declarations.length > 0 && b`
				$$self.$$.update = () => {
					${reactive_declarations}
				};
				`}

				${fixed_reactive_declarations}

				${uses_props && b`$$props = @exclude_internal_props($$props);`}

				return ${return_value};
			}
		`);
	}

	const prop_indexes = x`{
		${props.filter(v => v.export_name && !v.module).map(v => p`${v.export_name}: ${renderer.context_lookup.get(v.name).index}`)}
	}` ;

	let dirty;
	if (renderer.context_overflow) {
		dirty = x`[]`;
		for (let i = 0; i < renderer.context.length; i += 31) {
			dirty.elements.push(x`-1`);
		}
	}

	if (options.customElement) {

		let init_props = x`@attribute_to_object(this.attributes)`;
		if (uses_slots) {
			init_props = x`{ ...${init_props}, $$slots: @get_custom_elements_slots(this) }`;
		}

		const declaration = b`
			class ${name} extends @SvelteElement {
				constructor(options) {
					super();

					${css.code && b`this.shadowRoot.innerHTML = \`<style>${css.code.replace(/\\/g, '\\\\')}${options.dev ? `\n/*# sourceMappingURL=${css.map.toUrl()} */` : ''}</style>\`;`}

					@init(this, { target: this.shadowRoot, props: ${init_props}, customElement: true }, ${definition}, ${has_create_fragment ? 'create_fragment' : 'null'}, ${not_equal}, ${prop_indexes}, ${dirty});

					${dev_props_check}

					if (options) {
						if (options.target) {
							@insert(options.target, this, options.anchor);
						}

						${(props.length > 0 || uses_props || uses_rest) && b`
						if (options.props) {
							this.$set(options.props);
							@flush();
						}`}
					}
				}
			}
		`[0] ;

		if (props.length > 0) {
			declaration.body.body.push({
				type: 'MethodDefinition',
				kind: 'get',
				static: true,
				computed: false,
				key: { type: 'Identifier', name: 'observedAttributes' },
				value: x`function() {
					return [${props.map(prop => x`"${prop.export_name}"`)}];
				}` 
			});
		}

		declaration.body.body.push(...accessors);

		body.push(declaration);

		if (component.tag != null) {
			body.push(b`
				@_customElements.define("${component.tag}", ${name});
			`);
		}
	} else {
		const superclass = {
			type: 'Identifier',
			name: options.dev ? '@SvelteComponentDev' : '@SvelteComponent'
		};

		const declaration = b`
			class ${name} extends ${superclass} {
				constructor(options) {
					super(${options.dev && 'options'});
					${should_add_css && b`if (!@_document.getElementById("${component.stylesheet.id}-style")) ${add_css}();`}
					@init(this, options, ${definition}, ${has_create_fragment ? 'create_fragment' : 'null'}, ${not_equal}, ${prop_indexes}, ${dirty});
					${options.dev && b`@dispatch_dev("SvelteRegisterComponent", { component: this, tagName: "${name.name}", options, id: create_fragment.name });`}

					${dev_props_check}
				}
			}
		`[0] ;

		declaration.body.body.push(...accessors);

		body.push(declaration);
	}

	return { js: flatten$1(body, []), css };
}

function flatten$1(nodes, target) {
	for (let i = 0; i < nodes.length; i += 1) {
		const node = nodes[i];
		if (Array.isArray(node)) {
			flatten$1(node, target);
		} else {
			target.push(node);
		}
	}

	return target;
}

function AwaitBlock(node, renderer, options) {
	renderer.push();
	renderer.render(node.pending.children, options);
	const pending = renderer.pop();

	renderer.push();
	renderer.render(node.then.children, options);
	const then = renderer.pop();

	renderer.add_expression(x`
		function(__value) {
			if (@is_promise(__value)) return ${pending};
			return (function(${node.then_node ? node.then_node : ''}) { return ${then}; }(__value));
		}(${node.expression.node})
	`);
}

function Comment(_node, _renderer, _options) {
	// TODO preserve comments

	// if (options.preserveComments) {
	// 	renderer.append(`<!--${node.data}-->`);
	// }
}

function DebugTag(node, renderer, options) {
	if (!options.dev) return;

	const filename = options.filename || null;
	const { line, column } = options.locate(node.start + 1);

	const obj = x`{
		${node.expressions.map(e => p`${(e.node ).name}`)}
	}`;

	renderer.add_expression(x`@debug(${filename ? x`"${filename}"` : x`null`}, ${line - 1}, ${column}, ${obj})`);
}

function EachBlock(node, renderer, options) {
	const args = [node.context_node];
	if (node.index) args.push({ type: 'Identifier', name: node.index });

	renderer.push();
	renderer.render(node.children, options);
	const result = renderer.pop();

	const consequent = x`@each(${node.expression.node}, (${args}) => ${result})`;

	if (node.else) {
		renderer.push();
		renderer.render(node.else.children, options);
		const alternate = renderer.pop();

		renderer.add_expression(x`${node.expression.node}.length ? ${consequent} : ${alternate}`);
	} else {
		renderer.add_expression(consequent);
	}
}

function get_class_attribute_value(attribute) {
	// handle special case — `class={possiblyUndefined}` with scoped CSS
	if (attribute.chunks.length === 2 && (attribute.chunks[1] ).synthetic) {
		const value = (attribute.chunks[0] ).node;
		return x`@escape(@null_to_empty(${value})) + "${(attribute.chunks[1] ).data}"`;
	}

	return get_attribute_value(attribute);
}

function get_attribute_value(attribute) {
	if (attribute.chunks.length === 0) return x`""`;

	return attribute.chunks
		.map((chunk) => {
			return chunk.type === 'Text'
				? string_literal(chunk.data.replace(/"/g, '&quot;')) 
				: x`@escape(${chunk.node})`;
		})
		.reduce((lhs, rhs) => x`${lhs} + ${rhs}`);
}

// source: https://html.spec.whatwg.org/multipage/indices.html
const boolean_attributes = new Set([
	'allowfullscreen',
	'allowpaymentrequest',
	'async',
	'autofocus',
	'autoplay',
	'checked',
	'controls',
	'default',
	'defer',
	'disabled',
	'formnovalidate',
	'hidden',
	'ismap',
	'loop',
	'multiple',
	'muted',
	'nomodule',
	'novalidate',
	'open',
	'playsinline',
	'readonly',
	'required',
	'reversed',
	'selected'
]);

// similar logic from `compile/render_dom/wrappers/Fragment`
// We want to remove trailing whitespace inside an element/component/block,
// *unless* there is no whitespace between this node and its next sibling
function remove_whitespace_children(children, next) {
	const nodes = [];
	let last_child;
	let i = children.length;
	while (i--) {
		const child = children[i];

		if (child.type === 'Text') {
			if (child.should_skip()) {
				continue;
			}

			let { data } = child;

			if (nodes.length === 0) {
				const should_trim = next
					? next.type === 'Text' &&
					  /^\s/.test(next.data) &&
					  trimmable_at$1(child, next)
					: !child.has_ancestor('EachBlock');

				if (should_trim) {
					data = trim_end(data);
					if (!data) continue;
				}
			}

			// glue text nodes (which could e.g. be separated by comments) together
			if (last_child && last_child.type === 'Text') {
				last_child.data = data + last_child.data;
				continue;
			}

			nodes.unshift(child);
			link(last_child, last_child = child);
		} else {
			nodes.unshift(child);
			link(last_child, last_child = child);
		}
	}

	const first = nodes[0];
	if (first && first.type === 'Text') {
		first.data = trim_start(first.data);
		if (!first.data) {
			first.var = null;
			nodes.shift();

			if (nodes[0]) {
				nodes[0].prev = null;
			}
		}
	}

	return nodes;
}

function trimmable_at$1(child, next_sibling) {
	// Whitespace is trimmable if one of the following is true:
	// The child and its sibling share a common nearest each block (not at an each block boundary)
	// The next sibling's previous node is an each block
	return (
		next_sibling.find_nearest(/EachBlock/) ===
			child.find_nearest(/EachBlock/) || next_sibling.prev.type === 'EachBlock'
	);
}

function Element(node, renderer, options) {

	const children = remove_whitespace_children(node.children, node.next);

	// awkward special case
	let node_contents;

	const contenteditable = (
		node.name !== 'textarea' &&
		node.name !== 'input' &&
		node.attributes.some((attribute) => attribute.name === 'contenteditable')
	);

	renderer.add_string(`<${node.name}`);

	const class_expression_list = node.classes.map(class_directive => {
		const { expression, name } = class_directive;
		const snippet = expression ? expression.node : x`#ctx.${name}`; // TODO is this right?
		return x`${snippet} ? "${name}" : ""`;
	});
	if (node.needs_manual_style_scoping) {
		class_expression_list.push(x`"${node.component.stylesheet.id}"`);
	}
	const class_expression =
		class_expression_list.length > 0 &&
		class_expression_list.reduce((lhs, rhs) => x`${lhs} + ' ' + ${rhs}`);

	if (node.attributes.some(attr => attr.is_spread)) {
		// TODO dry this out
		const args = [];
		node.attributes.forEach(attribute => {
			if (attribute.is_spread) {
				args.push(attribute.expression.node);
			} else {
				const name = attribute.name.toLowerCase();
				if (name === 'value' && node.name.toLowerCase() === 'textarea') {
					node_contents = get_attribute_value(attribute);
				} else if (attribute.is_true) {
					args.push(x`{ ${attribute.name}: true }`);
				} else if (
					boolean_attributes.has(name) &&
					attribute.chunks.length === 1 &&
					attribute.chunks[0].type !== 'Text'
				) {
					// a boolean attribute with one non-Text chunk
					args.push(x`{ ${attribute.name}: ${(attribute.chunks[0] ).node} || null }`);
				} else {
					args.push(x`{ ${attribute.name}: ${get_attribute_value(attribute)} }`);
				}
			}
		});

		renderer.add_expression(x`@spread([${args}], ${class_expression})`);
	} else {
		let add_class_attribute = !!class_expression;
		node.attributes.forEach(attribute => {
			const name = attribute.name.toLowerCase();
			if (name === 'value' && node.name.toLowerCase() === 'textarea') {
				node_contents = get_attribute_value(attribute);
			} else if (attribute.is_true) {
				renderer.add_string(` ${attribute.name}`);
			} else if (
				boolean_attributes.has(name) &&
				attribute.chunks.length === 1 &&
				attribute.chunks[0].type !== 'Text'
			) {
				// a boolean attribute with one non-Text chunk
				renderer.add_string(' ');
				renderer.add_expression(x`${(attribute.chunks[0] ).node} ? "${attribute.name}" : ""`);
			} else if (name === 'class' && class_expression) {
				add_class_attribute = false;
				renderer.add_string(` ${attribute.name}="`);
				renderer.add_expression(x`[${get_class_attribute_value(attribute)}, ${class_expression}].join(' ').trim()`);
				renderer.add_string('"');
			} else if (attribute.chunks.length === 1 && attribute.chunks[0].type !== 'Text') {
				const snippet = (attribute.chunks[0] ).node;
				renderer.add_expression(x`@add_attribute("${attribute.name}", ${snippet}, ${boolean_attributes.has(name) ? 1 : 0})`);
			} else {
				renderer.add_string(` ${attribute.name}="`);
				renderer.add_expression((name === 'class' ? get_class_attribute_value : get_attribute_value)(attribute));
				renderer.add_string('"');
			}
		});
		if (add_class_attribute) {
			renderer.add_expression(x`@add_classes([${class_expression}].join(' ').trim())`);
		}
	}

	node.bindings.forEach(binding => {
		const { name, expression } = binding;

		if (binding.is_readonly) {
			return;
		}

		if (name === 'group') ; else if (contenteditable && (name === 'textContent' || name === 'innerHTML')) {
			node_contents = expression.node;

			// TODO where was this used?
			// value = name === 'textContent' ? x`@escape($$value)` : x`$$value`;
		} else if (binding.name === 'value' && node.name === 'textarea') {
			const snippet = expression.node;
			node_contents = x`${snippet} || ""`;
		} else {
			const snippet = expression.node;
			renderer.add_expression(x`@add_attribute("${name}", ${snippet}, 1)`);
		}
	});

	if (options.hydratable && options.head_id) {
		renderer.add_string(` data-svelte="${options.head_id}"`);
	}

	renderer.add_string('>');

	if (node_contents !== undefined) {
		if (contenteditable) {
			renderer.push();
			renderer.render(children, options);
			const result = renderer.pop();

			renderer.add_expression(x`($$value => $$value === void 0 ? ${result} : $$value)(${node_contents})`);
		} else {
			renderer.add_expression(node_contents);
		}

		if (!is_void(node.name)) {
			renderer.add_string(`</${node.name}>`);
		}
	} else {
		renderer.render(children, options);

		if (!is_void(node.name)) {
			renderer.add_string(`</${node.name}>`);
		}
	}
}

function Head(node, renderer, options) {
	const head_options = {
		...options,
		head_id: node.id
	};

	renderer.push();
	renderer.render(node.children, head_options);
	const result = renderer.pop();

	renderer.add_expression(x`$$result.head += ${result}, ""`);
}

function HtmlTag(node, renderer, _options) {
	renderer.add_expression(node.expression.node );
}

function IfBlock(node, renderer, options) {
	const condition = node.expression.node;

	renderer.push();
	renderer.render(node.children, options);
	const consequent = renderer.pop();

	renderer.push();
	if (node.else) renderer.render(node.else.children, options);
	const alternate = renderer.pop();

	renderer.add_expression(x`${condition} ? ${consequent} : ${alternate}`);
}

function get_prop_value(attribute) {
	if (attribute.is_true) return x`true`;
	if (attribute.chunks.length === 0) return x`''`;

	return attribute.chunks
		.map(chunk => {
			if (chunk.type === 'Text') return string_literal(chunk.data);
			return chunk.node;
		})
		.reduce((lhs, rhs) => x`${lhs} + ${rhs}`);
}

function InlineComponent(node, renderer, options) {
	const binding_props = [];
	const binding_fns = [];

	node.bindings.forEach(binding => {
		renderer.has_bindings = true;

		// TODO this probably won't work for contextual bindings
		const snippet = binding.expression.node;

		binding_props.push(p`${binding.name}: ${snippet}`);
		binding_fns.push(p`${binding.name}: $$value => { ${snippet} = $$value; $$settled = false }`);
	});

	const uses_spread = node.attributes.find(attr => attr.is_spread);

	let props;

	if (uses_spread) {
		props = x`@_Object.assign(${
			node.attributes
				.map(attribute => {
					if (attribute.is_spread) {
						return attribute.expression.node;
					} else {
						return x`{ ${attribute.name}: ${get_prop_value(attribute)} }`;
					}
				})
				.concat(binding_props.map(p => x`{ ${p} }`))
		})`;
	} else {
		props = x`{
			${node.attributes.map(attribute => p`${attribute.name}: ${get_prop_value(attribute)}`)},
			${binding_props}
		}`;
	}

	const bindings = x`{
		${binding_fns}
	}`;

	const expression = (
		node.name === 'svelte:self'
			? renderer.name
			: node.name === 'svelte:component'
				? x`(${node.expression.node}) || @missing_component`
				: node.name.split('.').reduce(((lhs, rhs) => x`${lhs}.${rhs}`) )
	);

	const slot_fns = [];

	const children = node.children;

	if (children.length) {
		const slot_scopes = new Map();

		renderer.render(children, Object.assign({}, options, {
			slot_scopes
		}));

		slot_scopes.forEach(({ input, output }, name) => {
			slot_fns.push(
				p`${name}: (${input}) => ${output}`
			);
		});
	}

	const slots = x`{
		${slot_fns}
	}`;

	renderer.add_expression(x`@validate_component(${expression}, "${node.name}").$$render($$result, ${props}, ${bindings}, ${slots})`);
}

function KeyBlock(node, renderer, options) {
	renderer.render(node.children, options);
}

function get_slot_scope(lets) {
	if (lets.length === 0) return null;

	return {
		type: 'ObjectPattern',
		properties: lets.map(l => {
			return {
				type: 'Property',
				kind: 'init',
				method: false,
				shorthand: false,
				computed: false,
				key: l.name,
				value: l.value || l.name
			};
		})
	};
}

function Slot(node, renderer, options

) {
	const slot_data = get_slot_data(node.values);
	const slot = node.get_static_attribute_value('slot');
	const nearest_inline_component = node.find_nearest(/InlineComponent/);

	if (slot && nearest_inline_component) {
		renderer.push();
	}

	renderer.push();
	renderer.render(node.children, options);
	const result = renderer.pop();

	renderer.add_expression(x`
		#slots.${node.slot_name}
			? #slots.${node.slot_name}(${slot_data})
			: ${result}
	`);

	if (slot && nearest_inline_component) {
		const lets = node.lets;
		const seen = new Set(lets.map(l => l.name.name));

		nearest_inline_component.lets.forEach(l => {
			if (!seen.has(l.name.name)) lets.push(l);
		});
		options.slot_scopes.set(slot, {
			input: get_slot_scope(node.lets),
			output: renderer.pop()
		});
	}
}

class AbstractBlock extends Node {
	
	

	constructor(component, parent, scope, info) {
		super(component, parent, scope, info);
	}

	warn_if_empty_block() {
		if (!this.children || this.children.length > 1) return;

		const child = this.children[0];

		if (!child || (child.type === 'Text' && !/[^ \r\n\f\v\t]/.test(child.data))) {
			this.component.warn(this, {
				code: 'empty-block',
				message: 'Empty block'
			});
		}
	}
}

class PendingBlock extends AbstractBlock {
	
	constructor(component, parent, scope, info) {
		super(component, parent, scope, info);
		this.children = map_children(component, parent, scope, info.children);

		if (!info.skip) {
			this.warn_if_empty_block();
		}
	}
}

class ThenBlock extends AbstractBlock {
	
	

	constructor(component, parent, scope, info) {
		super(component, parent, scope, info);

		this.scope = scope.child();
		if (parent.then_node) {
			parent.then_contexts.forEach(context => {
				this.scope.add(context.key.name, parent.expression.dependencies, this);
			});
		}
		this.children = map_children(component, parent, this.scope, info.children);

		if (!info.skip) {
			this.warn_if_empty_block();
		}
	}
}

class CatchBlock extends AbstractBlock {
	
	

	constructor(component, parent, scope, info) {
		super(component, parent, scope, info);

		this.scope = scope.child();
		if (parent.catch_node) {
			parent.catch_contexts.forEach(context => {
				this.scope.add(context.key.name, parent.expression.dependencies, this);
			});
		}
		this.children = map_children(component, parent, this.scope, info.children);

		if (!info.skip) {
			this.warn_if_empty_block();
		}
	}
}

function unpack_destructuring(contexts, node, modifier = node => node, default_modifier = node => node) {
	if (!node) return;

	if (node.type === 'Identifier') {
		contexts.push({
			key: node ,
			modifier,
			default_modifier
		});
	} else if (node.type === 'RestElement') {
		contexts.push({
			key: node.argument ,
			modifier,
			default_modifier
		});
	} else if (node.type === 'ArrayPattern') {
		node.elements.forEach((element, i) => {
			if (element && element.type === 'RestElement') {
				unpack_destructuring(contexts, element, node => x`${modifier(node)}.slice(${i})` , default_modifier);
			} else if (element && element.type === 'AssignmentPattern') {
				const n = contexts.length;

				unpack_destructuring(contexts, element.left, node => x`${modifier(node)}[${i}]`, (node, to_ctx) => x`${node} !== undefined ? ${node} : ${update_reference(contexts, n, element.right, to_ctx)}` );
			} else {
				unpack_destructuring(contexts, element, node => x`${modifier(node)}[${i}]` , default_modifier);
			}
		});
	} else if (node.type === 'ObjectPattern') {
		const used_properties = [];

		node.properties.forEach((property) => {
			if (property.type === 'RestElement') {
				unpack_destructuring(
					contexts,
					property.argument,
					node => x`@object_without_properties(${modifier(node)}, [${used_properties}])` ,
					default_modifier
				);
			} else {
				const key = property.key ;
				const value = property.value;

				used_properties.push(x`"${key.name}"`);
				if (value.type === 'AssignmentPattern') {
					const n = contexts.length;

					unpack_destructuring(contexts, value.left, node => x`${modifier(node)}.${key.name}`, (node, to_ctx) => x`${node} !== undefined ? ${node} : ${update_reference(contexts, n, value.right, to_ctx)}` );
				} else {
					unpack_destructuring(contexts, value, node => x`${modifier(node)}.${key.name}` , default_modifier);
				}
			}
		});
	}
}

function update_reference(contexts, n, expression, to_ctx) {
	const find_from_context = (node) => {
		for (let i = n; i < contexts.length; i++) {
			const { key } = contexts[i];
			if (node.name === key.name) {
				throw new Error(`Cannot access '${node.name}' before initialization`);
			}
		}
		return to_ctx(node.name);
	};

	if (expression.type === 'Identifier') {
		return find_from_context(expression);
	}

	// NOTE: avoid unnecessary deep clone?
	expression = JSON.parse(JSON.stringify(expression)) ;
	walk(expression, {
		enter(node, parent) {
			if (isReference(node, parent)) {
				this.replace(find_from_context(node ));
				this.skip();
			}
		}
	});

	return expression;
}

class AwaitBlock$1 extends Node {
	
	

	
	

	
	

	
	
	

	constructor(component, parent, scope, info) {
		super(component, parent, scope, info);

		this.expression = new Expression(component, this, scope, info.expression);

		this.then_node = info.value;
		this.catch_node = info.error;

		if (this.then_node) {
			this.then_contexts = [];
			unpack_destructuring(this.then_contexts, info.value);
		}

		if (this.catch_node) {
			this.catch_contexts = [];
			unpack_destructuring(this.catch_contexts, info.error);
		}

		this.pending = new PendingBlock(component, this, scope, info.pending);
		this.then = new ThenBlock(component, this, scope, info.then);
		this.catch = new CatchBlock(component, this, scope, info.catch);
	}
}

class EventHandler extends Node {
	
	
	
	
	
	__init() {this.uses_context = false;}
	__init2() {this.can_make_passive = false;}

	constructor(component, parent, template_scope, info) {
		super(component, parent, template_scope, info);EventHandler.prototype.__init.call(this);EventHandler.prototype.__init2.call(this);
		this.name = info.name;
		this.modifiers = new Set(info.modifiers);

		if (info.expression) {
			this.expression = new Expression(component, this, template_scope, info.expression);
			this.uses_context = this.expression.uses_context;

			if (/FunctionExpression/.test(info.expression.type) && info.expression.params.length === 0) {
				// TODO make this detection more accurate — if `event.preventDefault` isn't called, and
				// `event` is passed to another function, we can make it passive
				this.can_make_passive = true;
			} else if (info.expression.type === 'Identifier') {
				let node = component.node_for_declaration.get(info.expression.name);

				if (node) {
					if (node.type === 'VariableDeclaration') {
						// for `const handleClick = () => {...}`, we want the [arrow] function expression node
						const declarator = node.declarations.find(d => (d.id ).name === info.expression.name);
						node = declarator && declarator.init;
					}

					if (node && (node.type === 'FunctionExpression' || node.type === 'FunctionDeclaration' || node.type === 'ArrowFunctionExpression') && node.params.length === 0) {
						this.can_make_passive = true;
					}
				}
			}
		} else {
			this.handler_name = component.get_unique_name(`${sanitize(this.name)}_handler`);
		}
	}

	get reassigned() {
		if (!this.expression) {
			return false;
		}
		const node = this.expression.node;

		if (/FunctionExpression/.test(node.type)) {
			return false;
		}

		return this.expression.dynamic_dependencies().length > 0;
	}
}

class Body extends Node {
	
	

	constructor(component, parent, scope, info) {
		super(component, parent, scope, info);

		this.handlers = [];

		info.attributes.forEach((node) => {
			if (node.type === 'EventHandler') {
				this.handlers.push(new EventHandler(component, this, scope, node));
			}
		});
	}
}

const pattern = /^\s*svelte-ignore\s+([\s\S]+)\s*$/m;

class Comment$1 extends Node {
	
	
	

	constructor(component, parent, scope, info) {
		super(component, parent, scope, info);
		this.data = info.data;

		const match = pattern.exec(this.data);
		this.ignores = match ? match[1].split(/[^\S]/).map(x => x.trim()).filter(Boolean) : [];
	}
}

class ElseBlock extends AbstractBlock {
	

	constructor(component, parent, scope, info) {
		super(component, parent, scope, info);
		this.children = map_children(component, this, scope, info.children);

		this.warn_if_empty_block();
	}
}

class EachBlock$1 extends AbstractBlock {
	

	
	

	
	
	
	
	
	
	
	__init() {this.has_binding = false;}
	__init2() {this.has_index_binding = false;}

	

	constructor(component, parent, scope, info) {
		super(component, parent, scope, info);EachBlock$1.prototype.__init.call(this);EachBlock$1.prototype.__init2.call(this);
		this.expression = new Expression(component, this, scope, info.expression);
		this.context = info.context.name || 'each'; // TODO this is used to facilitate binding; currently fails with destructuring
		this.context_node = info.context;
		this.index = info.index;

		this.scope = scope.child();

		this.contexts = [];
		unpack_destructuring(this.contexts, info.context);

		this.contexts.forEach(context => {
			this.scope.add(context.key.name, this.expression.dependencies, this);
		});

		if (this.index) {
			// index can only change if this is a keyed each block
			const dependencies = info.key ? this.expression.dependencies : new Set([]);
			this.scope.add(this.index, dependencies, this);
		}

		this.key = info.key
			? new Expression(component, this, this.scope, info.key)
			: null;

		this.has_animation = false;

		this.children = map_children(component, this, this.scope, info.children);

		if (this.has_animation) {
			if (this.children.length !== 1) {
				const child = this.children.find(child => !!(child ).animation);
				component.error((child ).animation, {
					code: 'invalid-animation',
					message: 'An element that uses the animate directive must be the sole child of a keyed each block'
				});
			}
		}

		this.warn_if_empty_block();

		this.else = info.else
			? new ElseBlock(component, this, this.scope, info.else)
			: null;
	}
}

class Attribute extends Node {
	
	
	
	

	
	
	
	
	
	
	
	
	

	constructor(component, parent, scope, info) {
		super(component, parent, scope, info);
		this.scope = scope;

		if (info.type === 'Spread') {
			this.name = null;
			this.is_spread = true;
			this.is_true = false;

			this.expression = new Expression(component, this, scope, info.expression);
			this.dependencies = this.expression.dependencies;
			this.chunks = null;

			this.is_static = false;
		} else {
			this.name = info.name;
			this.is_true = info.value === true;
			this.is_static = true;

			this.dependencies = new Set();

			this.chunks = this.is_true
				? []
				: info.value.map(node => {
					if (node.type === 'Text') return node;

					this.is_static = false;

					const expression = new Expression(component, this, scope, node.expression);

					add_to_set(this.dependencies, expression.dependencies);
					return expression;
				});
		}
	}

	get_dependencies() {
		if (this.is_spread) return this.expression.dynamic_dependencies();

		const dependencies = new Set();
		this.chunks.forEach(chunk => {
			if (chunk.type === 'Expression') {
				add_to_set(dependencies, chunk.dynamic_dependencies());
			}
		});

		return Array.from(dependencies);
	}

	get_value(block) {
		if (this.is_true) return x`true`;
		if (this.chunks.length === 0) return x`""`;

		if (this.chunks.length === 1) {
			return this.chunks[0].type === 'Text'
				? string_literal((this.chunks[0] ).data)
				: (this.chunks[0] ).manipulate(block);
		}

		let expression = this.chunks
			.map(chunk => chunk.type === 'Text' ? string_literal(chunk.data) : chunk.manipulate(block))
			.reduce((lhs, rhs) => x`${lhs} + ${rhs}`);

		if (this.chunks[0].type !== 'Text') {
			expression = x`"" + ${expression}`;
		}

		return expression;
	}

	get_static_value() {
		if (this.is_spread || this.dependencies.size > 0) return null;

		return this.is_true
			? true
			: this.chunks[0]
				// method should be called only when `is_static = true`
				? (this.chunks[0] ).data
				: '';
	}

	should_cache() {
		return this.is_static
			? false
			: this.chunks.length === 1
				// @ts-ignore todo: probably error
				? this.chunks[0].node.type !== 'Identifier' || this.scope.names.has(this.chunks[0].node.name)
				: true;
	}
}

// TODO this should live in a specific binding
const read_only_media_attributes = new Set([
	'duration',
	'buffered',
	'seekable',
	'played',
	'seeking',
	'ended',
	'videoHeight',
	'videoWidth'
]);

class Binding extends Node {
	
	
	
	 // TODO exists only for bind:this — is there a more elegant solution?
	
	

	constructor(component, parent, scope, info) {
		super(component, parent, scope, info);

		if (info.expression.type !== 'Identifier' && info.expression.type !== 'MemberExpression') {
			component.error(info, {
				code: 'invalid-directive-value',
				message: 'Can only bind to an identifier (e.g. `foo`) or a member expression (e.g. `foo.bar` or `foo[baz]`)'
			});
		}

		this.name = info.name;
		this.expression = new Expression(component, this, scope, info.expression);
		this.raw_expression = JSON.parse(JSON.stringify(info.expression));

		const { name } = get_object(this.expression.node);

		this.is_contextual = Array.from(this.expression.references).some(name => scope.names.has(name));

		// make sure we track this as a mutable ref
		if (scope.is_let(name)) {
			component.error(this, {
				code: 'invalid-binding',
				message: 'Cannot bind to a variable declared with the let: directive'
			});
		} else if (scope.names.has(name)) {
			if (scope.is_await(name)) {
				component.error(this, {
					code: 'invalid-binding',
					message: 'Cannot bind to a variable declared with {#await ... then} or {:catch} blocks'
				});
			}

			scope.dependencies_for_name.get(name).forEach(name => {
				const variable = component.var_lookup.get(name);
				if (variable) {
					variable.mutated = true;
				}
			});
		} else {
			const variable = component.var_lookup.get(name);

			if (!variable || variable.global) {
				component.error(this.expression.node , {
					code: 'binding-undeclared',
					message: `${name} is not declared`
				});
			}

			variable[this.expression.node.type === 'MemberExpression' ? 'mutated' : 'reassigned'] = true;

			if (info.expression.type === 'Identifier' && !variable.writable) {
				component.error(this.expression.node , {
					code: 'invalid-binding',
					message: 'Cannot bind to a variable which is not writable'
				});
			}
		}

		const type = parent.get_static_attribute_value('type');

		this.is_readonly =
			dimensions.test(this.name) ||
			(isElement(parent) &&
				((parent.is_media_node() && read_only_media_attributes.has(this.name)) ||
					(parent.name === 'input' && type === 'file')) /* TODO others? */);
	}

	is_readonly_media_attribute() {
		return read_only_media_attributes.has(this.name);
	}
}

function isElement(node) {
	return !!(node ).is_media_node;
}

class Transition extends Node {
	
	
	
	
	

	constructor(component, parent, scope, info) {
		super(component, parent, scope, info);

		component.warn_if_undefined(info.name, info, scope);

		this.name = info.name;
		component.add_reference(info.name.split('.')[0]);

		this.directive = info.intro && info.outro ? 'transition' : info.intro ? 'in' : 'out';
		this.is_local = info.modifiers.includes('local');

		if ((info.intro && parent.intro) || (info.outro && parent.outro)) {
			const parent_transition = (parent.intro || parent.outro);

			const message = this.directive === parent_transition.directive
				? `An element can only have one '${this.directive}' directive`
				: `An element cannot have both ${describe(parent_transition)} directive and ${describe(this)} directive`;

			component.error(info, {
				code: 'duplicate-transition',
				message
			});
		}

		this.expression = info.expression
			? new Expression(component, this, scope, info.expression)
			: null;
	}
}

function describe(transition) {
	return transition.directive === 'transition'
		? "a 'transition'"
		: `an '${transition.directive}'`;
}

class Animation extends Node {
	
	
	

	constructor(component, parent, scope, info) {
		super(component, parent, scope, info);

		component.warn_if_undefined(info.name, info, scope);

		this.name = info.name;
		component.add_reference(info.name.split('.')[0]);

		if (parent.animation) {
			component.error(this, {
				code: 'duplicate-animation',
				message: "An element can only have one 'animate' directive"
			});
		}

		const block = parent.parent;
		if (!block || block.type !== 'EachBlock' || !block.key) {
			// TODO can we relax the 'immediate child' rule?
			component.error(this, {
				code: 'invalid-animation',
				message: 'An element that uses the animate directive must be the immediate child of a keyed each block'
			});
		}

		(block ).has_animation = true;

		this.expression = info.expression
			? new Expression(component, this, scope, info.expression, true)
			: null;
	}
}

class Class extends Node {
	
	
	

	constructor(component, parent, scope, info) {
		super(component, parent, scope, info);

		this.name = info.name;

		this.expression = info.expression
			? new Expression(component, this, scope, info.expression)
			: null;
	}
}

// Whitespace inside one of these elements will not result in
// a whitespace node being created in any circumstances. (This
// list is almost certainly very incomplete)
const elements_without_text = new Set([
	'audio',
	'datalist',
	'dl',
	'optgroup',
	'select',
	'video'
]);

class Text extends Node {
	
	
	

	constructor(component, parent, scope, info) {
		super(component, parent, scope, info);
		this.data = info.data;
		this.synthetic = info.synthetic || false;
	}

	should_skip() {
		if (/\S/.test(this.data)) return false;

		const parent_element = this.find_nearest(/(?:Element|InlineComponent|SlotTemplate|Head)/);
		if (!parent_element) return false;

		if (parent_element.type === 'Head') return true;
		if (parent_element.type === 'InlineComponent') return parent_element.children.length === 1 && this === parent_element.children[0];

		// svg namespace exclusions
		if (/svg$/.test(parent_element.namespace)) {
			if (this.prev && this.prev.type === 'Element' && this.prev.name === 'tspan') return false;
		}

		return parent_element.namespace || elements_without_text.has(parent_element.name);
	}
}

const applicable = new Set(['Identifier', 'ObjectExpression', 'ArrayExpression', 'Property']);

class Let extends Node {
	
	
	
	__init() {this.names = [];}

	constructor(component, parent, scope, info) {
		super(component, parent, scope, info);Let.prototype.__init.call(this);
		this.name = { type: 'Identifier', name: info.name };

		const { names } = this;

		if (info.expression) {
			this.value = info.expression;

			walk(info.expression, {
				enter(node) {
					if (!applicable.has(node.type)) {
						component.error(node , {
							code: 'invalid-let',
							message: 'let directive value must be an identifier or an object/array pattern'
						});
					}

					if (node.type === 'Identifier') {
						names.push((node ).name);
					}

					// slightly unfortunate hack
					if (node.type === 'ArrayExpression') {
						node.type = 'ArrayPattern';
					}

					if (node.type === 'ObjectExpression') {
						node.type = 'ObjectPattern';
					}
				}
			});
		} else {
			names.push(this.name.name);
		}
	}
}

const svg$1 = /^(?:altGlyph|altGlyphDef|altGlyphItem|animate|animateColor|animateMotion|animateTransform|circle|clipPath|color-profile|cursor|defs|desc|discard|ellipse|feBlend|feColorMatrix|feComponentTransfer|feComposite|feConvolveMatrix|feDiffuseLighting|feDisplacementMap|feDistantLight|feDropShadow|feFlood|feFuncA|feFuncB|feFuncG|feFuncR|feGaussianBlur|feImage|feMerge|feMergeNode|feMorphology|feOffset|fePointLight|feSpecularLighting|feSpotLight|feTile|feTurbulence|filter|font|font-face|font-face-format|font-face-name|font-face-src|font-face-uri|foreignObject|g|glyph|glyphRef|hatch|hatchpath|hkern|image|line|linearGradient|marker|mask|mesh|meshgradient|meshpatch|meshrow|metadata|missing-glyph|mpath|path|pattern|polygon|polyline|radialGradient|rect|set|solidcolor|stop|svg|switch|symbol|text|textPath|tref|tspan|unknown|use|view|vkern)$/;

const aria_attributes = 'activedescendant atomic autocomplete busy checked colcount colindex colspan controls current describedby details disabled dropeffect errormessage expanded flowto grabbed haspopup hidden invalid keyshortcuts label labelledby level live modal multiline multiselectable orientation owns placeholder posinset pressed readonly relevant required roledescription rowcount rowindex rowspan selected setsize sort valuemax valuemin valuenow valuetext'.split(' ');
const aria_attribute_set = new Set(aria_attributes);

const aria_roles = 'alert alertdialog application article banner blockquote button caption cell checkbox code columnheader combobox complementary contentinfo definition deletion dialog directory document emphasis feed figure form generic graphics-document graphics-object graphics-symbol grid gridcell group heading img link list listbox listitem log main marquee math meter menu menubar menuitem menuitemcheckbox menuitemradio navigation none note option paragraph presentation progressbar radio radiogroup region row rowgroup rowheader scrollbar search searchbox separator slider spinbutton status strong subscript superscript switch tab table tablist tabpanel term textbox time timer toolbar tooltip tree treegrid treeitem'.split(' ');
const aria_role_set = new Set(aria_roles);

const a11y_required_attributes = {
	a: ['href'],
	area: ['alt', 'aria-label', 'aria-labelledby'],

	// html-has-lang
	html: ['lang'],

	// iframe-has-title
	iframe: ['title'],
	img: ['alt'],
	object: ['title', 'aria-label', 'aria-labelledby']
};

const a11y_distracting_elements = new Set([
	'blink',
	'marquee'
]);

const a11y_required_content = new Set([
	// anchor-has-content
	'a',

	// heading-has-content
	'h1',
	'h2',
	'h3',
	'h4',
	'h5',
	'h6'
]);

const a11y_no_onchange = new Set([
	'select',
	'option'
]);

const a11y_labelable = new Set([
	'button',
	'input',
	'keygen',
	'meter',
	'output',
	'progress',
	'select',
	'textarea'
]);

const invisible_elements = new Set(['meta', 'html', 'script', 'style']);

const valid_modifiers = new Set([
	'preventDefault',
	'stopPropagation',
	'capture',
	'once',
	'passive',
	'nonpassive',
	'self'
]);

const passive_events = new Set([
	'wheel',
	'touchstart',
	'touchmove',
	'touchend',
	'touchcancel'
]);

const react_attributes = new Map([
	['className', 'class'],
	['htmlFor', 'for']
]);

function get_namespace(parent, element, explicit_namespace) {
	const parent_element = parent.find_nearest(/^Element/);

	if (!parent_element) {
		return explicit_namespace || (svg$1.test(element.name)
			? namespaces.svg
			: null);
	}

	if (svg$1.test(element.name.toLowerCase())) return namespaces.svg;
	if (parent_element.name.toLowerCase() === 'foreignobject') return null;

	return parent_element.namespace;
}

class Element$1 extends Node {
	
	
	
	__init() {this.attributes = [];}
	__init2() {this.actions = [];}
	__init3() {this.bindings = [];}
	__init4() {this.classes = [];}
	__init5() {this.handlers = [];}
	__init6() {this.lets = [];}
	__init7() {this.intro = null;}
	__init8() {this.outro = null;}
	__init9() {this.animation = null;}
	
	
	

	constructor(component, parent, scope, info) {
		super(component, parent, scope, info);Element$1.prototype.__init.call(this);Element$1.prototype.__init2.call(this);Element$1.prototype.__init3.call(this);Element$1.prototype.__init4.call(this);Element$1.prototype.__init5.call(this);Element$1.prototype.__init6.call(this);Element$1.prototype.__init7.call(this);Element$1.prototype.__init8.call(this);Element$1.prototype.__init9.call(this);		this.name = info.name;

		this.namespace = get_namespace(parent , this, component.namespace);

		if (this.namespace !== namespaces.foreign) {
			if (this.name === 'textarea') {
				if (info.children.length > 0) {
					const value_attribute = info.attributes.find(node => node.name === 'value');
					if (value_attribute) {
						component.error(value_attribute, {
							code: 'textarea-duplicate-value',
							message: 'A <textarea> can have either a value attribute or (equivalently) child content, but not both'
						});
					}

					// this is an egregious hack, but it's the easiest way to get <textarea>
					// children treated the same way as a value attribute
					info.attributes.push({
						type: 'Attribute',
						name: 'value',
						value: info.children
					});

					info.children = [];
				}
			}

			if (this.name === 'option') {
				// Special case — treat these the same way:
				//   <option>{foo}</option>
				//   <option value={foo}>{foo}</option>
				const value_attribute = info.attributes.find(attribute => attribute.name === 'value');

				if (!value_attribute) {
					info.attributes.push({
						type: 'Attribute',
						name: 'value',
						value: info.children,
						synthetic: true
					});
				}
			}
		}
		const has_let = info.attributes.some(node => node.type === 'Let');
		if (has_let) {
			scope = scope.child();
		}

		// Binding relies on Attribute, defer its evaluation
		const order = ['Binding']; // everything else is -1
		info.attributes.sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type));

		info.attributes.forEach(node => {
			switch (node.type) {
				case 'Action':
					this.actions.push(new Action(component, this, scope, node));
					break;

				case 'Attribute':
				case 'Spread':
					// special case
					if (node.name === 'xmlns') this.namespace = node.value[0].data;

					this.attributes.push(new Attribute(component, this, scope, node));
					break;

				case 'Binding':
					this.bindings.push(new Binding(component, this, scope, node));
					break;

				case 'Class':
					this.classes.push(new Class(component, this, scope, node));
					break;

				case 'EventHandler':
					this.handlers.push(new EventHandler(component, this, scope, node));
					break;

				case 'Let': {
					const l = new Let(component, this, scope, node);
					this.lets.push(l);
					const dependencies = new Set([l.name.name]);

					l.names.forEach(name => {
						scope.add(name, dependencies, this);
					});
					break;
				}

				case 'Transition':
				{
					const transition = new Transition(component, this, scope, node);
					if (node.intro) this.intro = transition;
					if (node.outro) this.outro = transition;
					break;
				}

				case 'Animation':
					this.animation = new Animation(component, this, scope, node);
					break;

				default:
					throw new Error(`Not implemented: ${node.type}`);
			}
		});

		this.scope = scope;
		this.children = map_children(component, this, this.scope, info.children);

		this.validate();

		component.apply_stylesheet(this);
	}

	validate() {
		if (this.component.var_lookup.has(this.name) && this.component.var_lookup.get(this.name).imported) {
			this.component.warn(this, {
				code: 'component-name-lowercase',
				message: `<${this.name}> will be treated as an HTML element unless it begins with a capital letter`
			});
		}

		this.validate_attributes();
		this.validate_event_handlers();
		if (this.namespace === namespaces.foreign) {
			this.validate_bindings_foreign();
		} else {
			this.validate_attributes_a11y();
			this.validate_special_cases();
			this.validate_bindings();
			this.validate_content();
		}

	}

	validate_attributes() {
		const { component, parent } = this;

		this.attributes.forEach(attribute => {
			if (attribute.is_spread) return;

			const name = attribute.name.toLowerCase();

			// Errors

			if (/(^[0-9-.])|[\^$@%&#?!|()[\]{}^*+~;]/.test(name)) {
				component.error(attribute, {
					code: 'illegal-attribute',
					message: `'${name}' is not a valid attribute name`
				});
			}

			if (name === 'slot') {
				if (!attribute.is_static) {
					component.error(attribute, {
						code: 'invalid-slot-attribute',
						message: 'slot attribute cannot have a dynamic value'
					});
				}

				if (component.slot_outlets.has(name)) {
					component.error(attribute, {
						code: 'duplicate-slot-attribute',
						message: `Duplicate '${name}' slot`
					});

					component.slot_outlets.add(name);
				}

				if (!(parent.type === 'SlotTemplate' || within_custom_element(parent))) {
					component.error(attribute, {
						code: 'invalid-slotted-content',
						message: 'Element with a slot=\'...\' attribute must be a child of a component or a descendant of a custom element'
					});
				}
			}

			// Warnings

			if (this.namespace !== namespaces.foreign) {
				if (name === 'is') {
					component.warn(attribute, {
						code: 'avoid-is',
						message: 'The \'is\' attribute is not supported cross-browser and should be avoided'
					});
				}

				if (react_attributes.has(attribute.name)) {
					component.warn(attribute, {
						code: 'invalid-html-attribute',
						message: `'${attribute.name}' is not a valid HTML attribute. Did you mean '${react_attributes.get(attribute.name)}'?`
					});
				}
			}
		});
	}

	validate_attributes_a11y() {
		const { component } = this;

		this.attributes.forEach(attribute => {
			if (attribute.is_spread) return;

			const name = attribute.name.toLowerCase();

			// aria-props
			if (name.startsWith('aria-')) {
				if (invisible_elements.has(this.name)) {
					// aria-unsupported-elements
					component.warn(attribute, {
						code: 'a11y-aria-attributes',
						message: `A11y: <${this.name}> should not have aria-* attributes`
					});
				}

				const type = name.slice(5);
				if (!aria_attribute_set.has(type)) {
					const match = fuzzymatch(type, aria_attributes);
					let message = `A11y: Unknown aria attribute 'aria-${type}'`;
					if (match) message += ` (did you mean '${match}'?)`;

					component.warn(attribute, {
						code: 'a11y-unknown-aria-attribute',
						message
					});
				}

				if (name === 'aria-hidden' && /^h[1-6]$/.test(this.name)) {
					component.warn(attribute, {
						code: 'a11y-hidden',
						message: `A11y: <${this.name}> element should not be hidden`
					});
				}
			}

			// aria-role
			if (name === 'role') {
				if (invisible_elements.has(this.name)) {
					// aria-unsupported-elements
					component.warn(attribute, {
						code: 'a11y-misplaced-role',
						message: `A11y: <${this.name}> should not have role attribute`
					});
				}

				const value = attribute.get_static_value();
				// @ts-ignore
				if (value && !aria_role_set.has(value)) {
					// @ts-ignore
					const match = fuzzymatch(value, aria_roles);
					let message = `A11y: Unknown role '${value}'`;
					if (match) message += ` (did you mean '${match}'?)`;

					component.warn(attribute, {
						code: 'a11y-unknown-role',
						message
					});
				}
			}

			// no-access-key
			if (name === 'accesskey') {
				component.warn(attribute, {
					code: 'a11y-accesskey',
					message: 'A11y: Avoid using accesskey'
				});
			}

			// no-autofocus
			if (name === 'autofocus') {
				component.warn(attribute, {
					code: 'a11y-autofocus',
					message: 'A11y: Avoid using autofocus'
				});
			}

			// scope
			if (name === 'scope' && this.name !== 'th') {
				component.warn(attribute, {
					code: 'a11y-misplaced-scope',
					message: 'A11y: The scope attribute should only be used with <th> elements'
				});
			}

			// tabindex-no-positive
			if (name === 'tabindex') {
				const value = attribute.get_static_value();
				// @ts-ignore todo is tabindex=true correct case?
				if (!isNaN(value) && +value > 0) {
					component.warn(attribute, {
						code: 'a11y-positive-tabindex',
						message: 'A11y: avoid tabindex values above zero'
					});
				}
			}
		});
	}


	validate_special_cases() {
		const { component, attributes, handlers } = this;

		const attribute_map = new Map();
		const handlers_map = new Map();

		attributes.forEach(attribute => (
			attribute_map.set(attribute.name, attribute)
		));

		handlers.forEach(handler => (
			handlers_map.set(handler.name, handler)
		));

		if (this.name === 'a') {
			const href_attribute = attribute_map.get('href') || attribute_map.get('xlink:href');
			const id_attribute = attribute_map.get('id');
			const name_attribute = attribute_map.get('name');

			if (href_attribute) {
				const href_value = href_attribute.get_static_value();

				if (href_value === '' || href_value === '#' || /^\W*javascript:/i.test(href_value)) {
					component.warn(href_attribute, {
						code: 'a11y-invalid-attribute',
						message: `A11y: '${href_value}' is not a valid ${href_attribute.name} attribute`
					});
				}
			} else {
				const id_attribute_valid = id_attribute && id_attribute.get_static_value() !== '';
				const name_attribute_valid = name_attribute && name_attribute.get_static_value() !== '';

				if (!id_attribute_valid && !name_attribute_valid) {
					component.warn(this, {
						code: 'a11y-missing-attribute',
						message: 'A11y: <a> element should have an href attribute'
					});
				}
			}
		} else {
			const required_attributes = a11y_required_attributes[this.name];
			if (required_attributes) {
				const has_attribute = required_attributes.some(name => attribute_map.has(name));

				if (!has_attribute) {
					should_have_attribute(this, required_attributes);
				}
			}
		}

		if (this.name === 'input') {
			const type = attribute_map.get('type');
			if (type && type.get_static_value() === 'image') {
				const required_attributes = ['alt', 'aria-label', 'aria-labelledby'];
				const has_attribute = required_attributes.some(name => attribute_map.has(name));

				if (!has_attribute) {
					should_have_attribute(this, required_attributes, 'input type="image"');
				}
			}
		}

		if (this.name === 'img') {
			const alt_attribute = attribute_map.get('alt');
			const aria_hidden_attribute = attribute_map.get('aria-hidden');

			const aria_hidden_exist = aria_hidden_attribute && aria_hidden_attribute.get_static_value();

			if (alt_attribute && !aria_hidden_exist) {
				const alt_value = alt_attribute.get_static_value();

				if (/\b(image|picture|photo)\b/i.test(alt_value)) {
					component.warn(this, {
						code: 'a11y-img-redundant-alt',
						message: 'A11y: Screenreaders already announce <img> elements as an image.'
					});
				}
			}
		}

		if (this.name === 'label') {
			const has_input_child = this.children.some(i => (i instanceof Element$1 && a11y_labelable.has(i.name) ));
			if (!attribute_map.has('for') && !has_input_child) {
				component.warn(this, {
					code: 'a11y-label-has-associated-control',
					message: 'A11y: A form label must be associated with a control.'
				});
			}
		}

		if (this.is_media_node()) {
			if (attribute_map.has('muted')) {
				return;
			}

			let has_caption;
			const track = this.children.find((i) => i.name === 'track');
			if (track) {
				has_caption = track.attributes.find(a => a.name === 'kind' && a.get_static_value() === 'captions');
			}

			if (!has_caption) {
				component.warn(this, {
					code: 'a11y-media-has-caption',
					message: 'A11y: Media elements must have a <track kind="captions">'
				});
			}
		}

		if (a11y_no_onchange.has(this.name)) {
			if (handlers_map.has('change') && !handlers_map.has('blur')) {
				component.warn(this, {
					code: 'a11y-no-onchange',
					message: 'A11y: on:blur must be used instead of on:change, unless absolutely necessary and it causes no negative consequences for keyboard only or screen reader users.'
				});
			}
		}

		if (a11y_distracting_elements.has(this.name)) {
			// no-distracting-elements
			component.warn(this, {
				code: 'a11y-distracting-elements',
				message: `A11y: Avoid <${this.name}> elements`
			});
		}

		if (this.name === 'figcaption') {
			let { parent } = this;
			let is_figure_parent = false;

			while (parent) {
				if ((parent ).name === 'figure') {
					is_figure_parent = true;
					break;
				}
				if (parent.type === 'Element') {
					break;
				}
				parent = parent.parent;
			}

			if (!is_figure_parent) {
				component.warn(this, {
					code: 'a11y-structure',
					message: 'A11y: <figcaption> must be an immediate child of <figure>'
				});
			}
		}

		if (this.name === 'figure') {
			const children = this.children.filter(node => {
				if (node.type === 'Comment') return false;
				if (node.type === 'Text') return /\S/.test(node.data);
				return true;
			});

			const index = children.findIndex(child => (child ).name === 'figcaption');

			if (index !== -1 && (index !== 0 && index !== children.length - 1)) {
				component.warn(children[index], {
					code: 'a11y-structure',
					message: 'A11y: <figcaption> must be first or last child of <figure>'
				});
			}
		}
	}

	validate_bindings_foreign() {
		this.bindings.forEach(binding => {
			if (binding.name !== 'this') {
				this.component.error(binding, {
					code: 'invalid-binding',
					message: `'${binding.name}' is not a valid binding. Foreign elements only support bind:this`
				});
			}
		});
	}

	validate_bindings() {
		const { component } = this;

		const check_type_attribute = () => {
			const attribute = this.attributes.find(
				(attribute) => attribute.name === 'type'
			);

			if (!attribute) return null;

			if (!attribute.is_static) {
				component.error(attribute, {
					code: 'invalid-type',
					message: '\'type\' attribute cannot be dynamic if input uses two-way binding'
				});
			}

			const value = attribute.get_static_value();

			if (value === true) {
				component.error(attribute, {
					code: 'missing-type',
					message: '\'type\' attribute must be specified'
				});
			}

			return value;
		};

		this.bindings.forEach(binding => {
			const { name } = binding;

			if (name === 'value') {
				if (
					this.name !== 'input' &&
					this.name !== 'textarea' &&
					this.name !== 'select'
				) {
					component.error(binding, {
						code: 'invalid-binding',
						message: `'value' is not a valid binding on <${this.name}> elements`
					});
				}

				if (this.name === 'select') {
					const attribute = this.attributes.find(
						(attribute) => attribute.name === 'multiple'
					);

					if (attribute && !attribute.is_static) {
						component.error(attribute, {
							code: 'dynamic-multiple-attribute',
							message: '\'multiple\' attribute cannot be dynamic if select uses two-way binding'
						});
					}
				} else {
					check_type_attribute();
				}
			} else if (name === 'checked' || name === 'indeterminate') {
				if (this.name !== 'input') {
					component.error(binding, {
						code: 'invalid-binding',
						message: `'${name}' is not a valid binding on <${this.name}> elements`
					});
				}

				const type = check_type_attribute();

				if (type !== 'checkbox') {
					let message = `'${name}' binding can only be used with <input type="checkbox">`;
					if (type === 'radio') message += ' — for <input type="radio">, use \'group\' binding';
					component.error(binding, { code: 'invalid-binding', message });
				}
			} else if (name === 'group') {
				if (this.name !== 'input') {
					component.error(binding, {
						code: 'invalid-binding',
						message: `'group' is not a valid binding on <${this.name}> elements`
					});
				}

				const type = check_type_attribute();

				if (type !== 'checkbox' && type !== 'radio') {
					component.error(binding, {
						code: 'invalid-binding',
						message: '\'group\' binding can only be used with <input type="checkbox"> or <input type="radio">'
					});
				}
			} else if (name === 'files') {
				if (this.name !== 'input') {
					component.error(binding, {
						code: 'invalid-binding',
						message: `'files' is not a valid binding on <${this.name}> elements`
					});
				}

				const type = check_type_attribute();

				if (type !== 'file') {
					component.error(binding, {
						code: 'invalid-binding',
						message: '\'files\' binding can only be used with <input type="file">'
					});
				}

			} else if (name === 'open') {
				if (this.name !== 'details') {
					component.error(binding, {
						code: 'invalid-binding',
						message: `'${name}' binding can only be used with <details>`
					});
				}
			} else if (
				name === 'currentTime' ||
				name === 'duration' ||
				name === 'paused' ||
				name === 'buffered' ||
				name === 'seekable' ||
				name === 'played' ||
				name === 'volume' ||
				name === 'muted' ||
				name === 'playbackRate' ||
				name === 'seeking' ||
				name === 'ended'
			) {
				if (this.name !== 'audio' && this.name !== 'video') {
					component.error(binding, {
						code: 'invalid-binding',
						message: `'${name}' binding can only be used with <audio> or <video>`
					});
				}
			} else if (
				name === 'videoHeight' ||
				name === 'videoWidth'
			) {
				if (this.name !== 'video') {
					component.error(binding, {
						code: 'invalid-binding',
						message: `'${name}' binding can only be used with <video>`
					});
				}
			} else if (dimensions.test(name)) {
				if (this.name === 'svg' && (name === 'offsetWidth' || name === 'offsetHeight')) {
					component.error(binding, {
						code: 'invalid-binding',
						message: `'${binding.name}' is not a valid binding on <svg>. Use '${name.replace('offset', 'client')}' instead`
					});
				} else if (svg$1.test(this.name)) {
					component.error(binding, {
						code: 'invalid-binding',
						message: `'${binding.name}' is not a valid binding on SVG elements`
					});
				} else if (is_void(this.name)) {
					component.error(binding, {
						code: 'invalid-binding',
						message: `'${binding.name}' is not a valid binding on void elements like <${this.name}>. Use a wrapper element instead`
					});
				}
			} else if (
				name === 'textContent' ||
				name === 'innerHTML'
			) {
				const contenteditable = this.attributes.find(
					(attribute) => attribute.name === 'contenteditable'
				);

				if (!contenteditable) {
					component.error(binding, {
						code: 'missing-contenteditable-attribute',
						message: '\'contenteditable\' attribute is required for textContent and innerHTML two-way bindings'
					});
				} else if (contenteditable && !contenteditable.is_static) {
					component.error(contenteditable, {
						code: 'dynamic-contenteditable-attribute',
						message: '\'contenteditable\' attribute cannot be dynamic if element uses two-way binding'
					});
				}
			} else if (name !== 'this') {
				component.error(binding, {
					code: 'invalid-binding',
					message: `'${binding.name}' is not a valid binding`
				});
			}
		});
	}

	validate_content() {
		if (!a11y_required_content.has(this.name)) return;
		if (
			this.bindings
				.some((binding) => ['textContent', 'innerHTML'].includes(binding.name))
		) return;

		if (this.children.length === 0) {
			this.component.warn(this, {
				code: 'a11y-missing-content',
				message: `A11y: <${this.name}> element should have child content`
			});
		}
	}

	validate_event_handlers() {
		const { component } = this;

		this.handlers.forEach(handler => {
			if (handler.modifiers.has('passive') && handler.modifiers.has('preventDefault')) {
				component.error(handler, {
					code: 'invalid-event-modifier',
					message: 'The \'passive\' and \'preventDefault\' modifiers cannot be used together'
				});
			}

			if (handler.modifiers.has('passive') && handler.modifiers.has('nonpassive')) {
				component.error(handler, {
					code: 'invalid-event-modifier',
					message: 'The \'passive\' and \'nonpassive\' modifiers cannot be used together'
				});
			}

			handler.modifiers.forEach(modifier => {
				if (!valid_modifiers.has(modifier)) {
					component.error(handler, {
						code: 'invalid-event-modifier',
						message: `Valid event modifiers are ${list(Array.from(valid_modifiers))}`
					});
				}

				if (modifier === 'passive') {
					if (passive_events.has(handler.name)) {
						if (handler.can_make_passive) {
							component.warn(handler, {
								code: 'redundant-event-modifier',
								message: 'Touch event handlers that don\'t use the \'event\' object are passive by default'
							});
						}
					} else {
						component.warn(handler, {
							code: 'redundant-event-modifier',
							message: 'The passive modifier only works with wheel and touch events'
						});
					}
				}

				if (component.compile_options.legacy && (modifier === 'once' || modifier === 'passive')) {
					// TODO this could be supported, but it would need a few changes to
					// how event listeners work
					component.error(handler, {
						code: 'invalid-event-modifier',
						message: `The '${modifier}' modifier cannot be used in legacy mode`
					});
				}
			});

			if (passive_events.has(handler.name) && handler.can_make_passive && !handler.modifiers.has('preventDefault') && !handler.modifiers.has('nonpassive')) {
				// touch/wheel events should be passive by default
				handler.modifiers.add('passive');
			}
		});
	}

	is_media_node() {
		return this.name === 'audio' || this.name === 'video';
	}

	add_css_class() {
		if (this.attributes.some(attr => attr.is_spread)) {
			this.needs_manual_style_scoping = true;
			return;
		}

		const { id } = this.component.stylesheet;

		const class_attribute = this.attributes.find(a => a.name === 'class');

		if (class_attribute && !class_attribute.is_true) {
			if (class_attribute.chunks.length === 1 && class_attribute.chunks[0].type === 'Text') {
				(class_attribute.chunks[0] ).data += ` ${id}`;
			} else {
				(class_attribute.chunks ).push(
					new Text(this.component, this, this.scope, {
						type: 'Text',
						data: ` ${id}`,
						synthetic: true
					} )
				);
			}
		} else {
			this.attributes.push(
				new Attribute(this.component, this, this.scope, {
					type: 'Attribute',
					name: 'class',
					value: [{ type: 'Text', data: id, synthetic: true }]
				} )
			);
		}
	}

	get slot_template_name() {
		return this.attributes.find(attribute => attribute.name === 'slot').get_static_value() ;
	}
}

function should_have_attribute(
	node,
	attributes,
	name = node.name
) {
	const article = /^[aeiou]/.test(attributes[0]) ? 'an' : 'a';
	const sequence = attributes.length > 1 ?
		attributes.slice(0, -1).join(', ') + ` or ${attributes[attributes.length - 1]}` :
		attributes[0];

	node.component.warn(node, {
		code: 'a11y-missing-attribute',
		message: `A11y: <${name}> element should have ${article} ${sequence} attribute`
	});
}

function within_custom_element(parent) {
	while (parent) {
		if (parent.type === 'InlineComponent') return false;
		if (parent.type === 'Element' && /-/.test(parent.name)) return true;
		parent = parent.parent;
	}
	return false;
}

// https://github.com/darkskyapp/string-hash/blob/master/index.js
function hash(str) {
	str = str.replace(/\r/g, '');
	let hash = 5381;
	let i = str.length;

	while (i--) hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
	return (hash >>> 0).toString(36);
}

class Head$1 extends Node {
	
	 // TODO
	

	constructor(component, parent, scope, info) {
		super(component, parent, scope, info);

		if (info.attributes.length) {
			component.error(info.attributes[0], {
				code: 'invalid-attribute',
				message: '<svelte:head> should not have any attributes or directives'
			});
		}

		this.children = map_children(component, parent, scope, info.children.filter(child => {
			return (child.type !== 'Text' || /\S/.test(child.data));
		}));

		if (this.children.length > 0) {
			this.id = `svelte-${hash(this.component.source.slice(this.start, this.end))}`;
		}
	}
}

class IfBlock$1 extends AbstractBlock {
	
	
	

	constructor(component, parent, scope, info) {
		super(component, parent, scope, info);

		this.expression = new Expression(component, this, scope, info.expression);
		this.children = map_children(component, this, scope, info.children);

		this.else = info.else
			? new ElseBlock(component, this, scope, info.else)
			: null;

		this.warn_if_empty_block();
	}
}

class InlineComponent$1 extends Node {
	
	
	
	__init() {this.attributes = [];}
	__init2() {this.bindings = [];}
	__init3() {this.handlers = [];}
	__init4() {this.lets = [];}
	
	

	constructor(component, parent, scope, info) {
		super(component, parent, scope, info);InlineComponent$1.prototype.__init.call(this);InlineComponent$1.prototype.__init2.call(this);InlineComponent$1.prototype.__init3.call(this);InlineComponent$1.prototype.__init4.call(this);
		if (info.name !== 'svelte:component' && info.name !== 'svelte:self') {
			const name = info.name.split('.')[0]; // accommodate namespaces
			component.warn_if_undefined(name, info, scope);
			component.add_reference(name);
		}

		this.name = info.name;

		this.expression = this.name === 'svelte:component'
			? new Expression(component, this, scope, info.expression)
			: null;

		info.attributes.forEach(node => {
			/* eslint-disable no-fallthrough */
			switch (node.type) {
				case 'Action':
					component.error(node, {
						code: 'invalid-action',
						message: 'Actions can only be applied to DOM elements, not components'
					});

				case 'Attribute':
					// fallthrough
				case 'Spread':
					this.attributes.push(new Attribute(component, this, scope, node));
					break;

				case 'Binding':
					this.bindings.push(new Binding(component, this, scope, node));
					break;

				case 'Class':
					component.error(node, {
						code: 'invalid-class',
						message: 'Classes can only be applied to DOM elements, not components'
					});

				case 'EventHandler':
					this.handlers.push(new EventHandler(component, this, scope, node));
					break;

				case 'Let':
					this.lets.push(new Let(component, this, scope, node));
					break;

				case 'Transition':
					component.error(node, {
						code: 'invalid-transition',
						message: 'Transitions can only be applied to DOM elements, not components'
					});

				default:
					throw new Error(`Not implemented: ${node.type}`);
			}
			/* eslint-enable no-fallthrough */
		});

		if (this.lets.length > 0) {
			this.scope = scope.child();

			this.lets.forEach(l => {
				const dependencies = new Set([l.name.name]);

				l.names.forEach(name => {
					this.scope.add(name, dependencies, this);
				});
			});
		} else {
			this.scope = scope;
		}

		this.handlers.forEach(handler => {
			handler.modifiers.forEach(modifier => {
				if (modifier !== 'once') {
					component.error(handler, {
						code: 'invalid-event-modifier',
						message: "Event modifiers other than 'once' can only be used on DOM elements"
					});
				}
			});
		});

		const children = [];
		for (let i=info.children.length - 1; i >= 0; i--) {
			const child = info.children[i];
			if (child.type === 'SlotTemplate') {
				children.push(child);
				info.children.splice(i, 1);
			} else if ((child.type === 'Element' || child.type === 'InlineComponent' || child.type === 'Slot') && child.attributes.find(attribute => attribute.name === 'slot')) {
				const slot_template = {
					start: child.start,
					end: child.end,
					type: 'SlotTemplate',
					name: 'svelte:fragment',
					attributes: [],
					children: [child]
				};

				// transfer attributes
				for (let i=child.attributes.length - 1; i >= 0; i--) {
					const attribute = child.attributes[i];
					if (attribute.type === 'Let') {
						slot_template.attributes.push(attribute);
						child.attributes.splice(i, 1);
					} else if (attribute.type === 'Attribute' && attribute.name === 'slot') {
						slot_template.attributes.push(attribute);
					}
				}
		
				children.push(slot_template);
				info.children.splice(i, 1);
			}
		}

		if (info.children.some(node => not_whitespace_text(node))) {
			children.push({ 
				start: info.start,
				end: info.end,
				type: 'SlotTemplate', 
				name: 'svelte:fragment',
				attributes: [],
				children: info.children
			});
		}

		this.children = map_children(component, this, this.scope, children);
	}

	get slot_template_name() {
		return this.attributes.find(attribute => attribute.name === 'slot').get_static_value() ;
	}
}

function not_whitespace_text(node) {
	return !(node.type === 'Text' && /^\s+$/.test(node.data));
}

class KeyBlock$1 extends AbstractBlock {
	

	

	constructor(component, parent, scope, info) {
		super(component, parent, scope, info);

		this.expression = new Expression(component, this, scope, info.expression);

		this.children = map_children(component, this, scope, info.children);

		this.warn_if_empty_block();
	}
}

class Tag$1 extends Node {
	
	
	

	constructor(component, parent, scope, info) {
		super(component, parent, scope, info);
		this.expression = new Expression(component, this, scope, info.expression);

		this.should_cache = (
			info.expression.type !== 'Identifier' ||
			(this.expression.dependencies.size && scope.names.has(info.expression.name))
		);
	}
}

class MustacheTag extends Tag$1 {
	
}

class Options extends Node {
	
}

class RawMustacheTag extends Tag$1 {
	
}

class DebugTag$1 extends Node {
	
	

	constructor(component, parent, scope, info) {
		super(component, parent, scope, info);

		this.expressions = info.identifiers.map((node) => {
			return new Expression(component, parent, scope, node);
		});
	}
}

class Slot$1 extends Element$1 {
	
	
	
	
	__init() {this.values = new Map();}

	constructor(component, parent, scope, info) {
		super(component, parent, scope, info);Slot$1.prototype.__init.call(this);
		info.attributes.forEach(attr => {
			if (attr.type !== 'Attribute' && attr.type !== 'Spread') {
				component.error(attr, {
					code: 'invalid-slot-directive',
					message: '<slot> cannot have directives'
				});
			}

			if (attr.name === 'name') {
				if (attr.value.length !== 1 || attr.value[0].type !== 'Text') {
					component.error(attr, {
						code: 'dynamic-slot-name',
						message: '<slot> name cannot be dynamic'
					});
				}

				this.slot_name = attr.value[0].data;
				if (this.slot_name === 'default') {
					component.error(attr, {
						code: 'invalid-slot-name',
						message: 'default is a reserved word — it cannot be used as a slot name'
					});
				}
			}

			this.values.set(attr.name, new Attribute(component, this, scope, attr));
		});

		if (!this.slot_name) this.slot_name = 'default';

		if (this.slot_name === 'default') {
			// if this is the default slot, add our dependencies to any
			// other slots (which inherit our slot values) that were
			// previously encountered
			component.slots.forEach((slot) => {
				this.values.forEach((attribute, name) => {
					if (!slot.values.has(name)) {
						slot.values.set(name, attribute);
					}
				});
			});
		} else if (component.slots.has('default')) {
			// otherwise, go the other way — inherit values from
			// a previously encountered default slot
			const default_slot = component.slots.get('default');
			default_slot.values.forEach((attribute, name) => {
				if (!this.values.has(name)) {
					this.values.set(name, attribute);
				}
			});
		}

		component.slots.set(this.slot_name, this);
	}
}

class Title extends Node {
	
	
	

	constructor(component, parent, scope, info) {
		super(component, parent, scope, info);
		this.children = map_children(component, parent, scope, info.children);

		if (info.attributes.length > 0) {
			component.error(info.attributes[0], {
				code: 'illegal-attribute',
				message: '<title> cannot have attributes'
			});
		}

		info.children.forEach(child => {
			if (child.type !== 'Text' && child.type !== 'MustacheTag') {
				component.error(child, {
					code: 'illegal-structure',
					message: '<title> can only contain text and {tags}'
				});
			}
		});

		this.should_cache = info.children.length === 1
			? (
				info.children[0].type !== 'Identifier' ||
				scope.names.has(info.children[0].name)
			)
			: true;
	}
}

const valid_bindings = [
	'innerWidth',
	'innerHeight',
	'outerWidth',
	'outerHeight',
	'scrollX',
	'scrollY',
	'online'
];

class Window extends Node {
	
	__init() {this.handlers = [];}
	__init2() {this.bindings = [];}
	__init3() {this.actions = [];}

	constructor(component, parent, scope, info) {
		super(component, parent, scope, info);Window.prototype.__init.call(this);Window.prototype.__init2.call(this);Window.prototype.__init3.call(this);
		info.attributes.forEach(node => {
			if (node.type === 'EventHandler') {
				this.handlers.push(new EventHandler(component, this, scope, node));
			} else if (node.type === 'Binding') {
				if (node.expression.type !== 'Identifier') {
					const { parts } = flatten_reference(node.expression);

					// TODO is this constraint necessary?
					component.error(node.expression, {
						code: 'invalid-binding',
						message: `Bindings on <svelte:window> must be to top-level properties, e.g. '${parts[parts.length - 1]}' rather than '${parts.join('.')}'`
					});
				}

				if (!~valid_bindings.indexOf(node.name)) {
					const match = (
						node.name === 'width' ? 'innerWidth' :
							node.name === 'height' ? 'innerHeight' :
								fuzzymatch(node.name, valid_bindings)
					);

					const message = `'${node.name}' is not a valid binding on <svelte:window>`;

					if (match) {
						component.error(node, {
							code: 'invalid-binding',
							message: `${message} (did you mean '${match}'?)`
						});
					} else {
						component.error(node, {
							code: 'invalid-binding',
							message: `${message} — valid bindings are ${list(valid_bindings)}`
						});
					}
				}

				this.bindings.push(new Binding(component, this, scope, node));
			} else if (node.type === 'Action') {
				this.actions.push(new Action(component, this, scope, node));
			}
		});
	}
}

function get_constructor(type) {
	switch (type) {
		case 'AwaitBlock': return AwaitBlock$1;
		case 'Body': return Body;
		case 'Comment': return Comment$1;
		case 'EachBlock': return EachBlock$1;
		case 'Element': return Element$1;
		case 'Head': return Head$1;
		case 'IfBlock': return IfBlock$1;
		case 'InlineComponent': return InlineComponent$1;
		case 'KeyBlock': return KeyBlock$1;
		case 'MustacheTag': return MustacheTag;
		case 'Options': return Options;
		case 'RawMustacheTag': return RawMustacheTag;
		case 'DebugTag': return DebugTag$1;
		case 'Slot': return Slot$1;
		case 'SlotTemplate': return SlotTemplate;
		case 'Text': return Text;
		case 'Title': return Title;
		case 'Window': return Window;
		default: throw new Error(`Not implemented: ${type}`);
	}
}

function map_children(component, parent, scope, children) {
	let last = null;
	let ignores = [];

	return children.map(child => {
		const constructor = get_constructor(child.type);

		const use_ignores = child.type !== 'Text' && child.type !== 'Comment' && ignores.length;

		if (use_ignores) component.push_ignores(ignores);
		const node = new constructor(component, parent, scope, child);
		if (use_ignores) component.pop_ignores(), ignores = [];

		if (node.type === 'Comment' && node.ignores.length) {
			ignores.push(...node.ignores);
		}

		if (last) last.next = node;
		node.prev = last;
		last = node;

		return node;
	});
}

class SlotTemplate extends Node {
	
	
	
	__init() {this.lets = [];}
	
	__init2() {this.slot_template_name = 'default';}

	constructor(
		component,
		parent,
		scope,
		info
	) {
		super(component, parent, scope, info);SlotTemplate.prototype.__init.call(this);SlotTemplate.prototype.__init2.call(this);
		this.validate_slot_template_placement();

		const has_let = info.attributes.some((node) => node.type === 'Let');
		if (has_let) {
			scope = scope.child();
		}

		info.attributes.forEach((node) => {
			switch (node.type) {
				case 'Let': {
					const l = new Let(component, this, scope, node);
					this.lets.push(l);
					const dependencies = new Set([l.name.name]);

					l.names.forEach((name) => {
						scope.add(name, dependencies, this);
					});
					break;
				}
				case 'Attribute': {
					if (node.name === 'slot') {
						this.slot_attribute = new Attribute(component, this, scope, node);
						if (!this.slot_attribute.is_static) {
							component.error(node, {
								code: 'invalid-slot-attribute',
								message: 'slot attribute cannot have a dynamic value'
							});
						}
						const value = this.slot_attribute.get_static_value();
						if (typeof value === 'boolean') {
							component.error(node, {
								code: 'invalid-slot-attribute',
								message: 'slot attribute value is missing'
							});
						}
						this.slot_template_name = value ;
						break;
					}
					throw new Error(`Invalid attribute '${node.name}' in <svelte:fragment>`);
				}
				default:
					throw new Error(`Not implemented: ${node.type}`);
			}
		});

		this.scope = scope;
		this.children = map_children(component, this, this.scope, info.children);
	}

	validate_slot_template_placement() {
		if (this.parent.type !== 'InlineComponent') {
			this.component.error(this, {
				code: 'invalid-slotted-content',
				message: '<svelte:fragment> must be a child of a component'
			});
		}
	}
}

function SlotTemplate$1(node, renderer, options

) {
	const parent_inline_component = node.parent ;
	const children = remove_whitespace_children(node instanceof SlotTemplate ? node.children : [node], node.next);

	renderer.push();
	renderer.render(children, options);

	const lets = node.lets;
	const seen = new Set(lets.map(l => l.name.name));
	parent_inline_component.lets.forEach(l => {
		if (!seen.has(l.name.name)) lets.push(l);
	});

	const slot_fragment_content = renderer.pop();
	if (!is_empty_template_literal(slot_fragment_content)) {
		if (options.slot_scopes.has(node.slot_template_name)) {
			if (node.slot_template_name === 'default') {
				throw new Error('Found elements without slot attribute when using slot="default"');
			}
			throw new Error(`Duplicate slot name "${node.slot_template_name}" in <${parent_inline_component.name}>`);
		}

		options.slot_scopes.set(node.slot_template_name, {
			input: get_slot_scope(node.lets),
			output: slot_fragment_content
		});
	}
}

function is_empty_template_literal(template_literal) {
	return (
		template_literal.expressions.length === 0 &&
		template_literal.quasis.length === 1 &&
		template_literal.quasis[0].value.raw === ''
	);
}

function Tag$2(node, renderer, _options) {
	const snippet = node.expression.node;

	renderer.add_expression(
		node.parent &&
		node.parent.type === 'Element' &&
		node.parent.name === 'style'
			? snippet
			: x`@escape(${snippet})`
	);
}

function Text$1(node, renderer, _options) {
	let text = node.data;
	if (
		!node.parent ||
		node.parent.type !== 'Element' ||
		((node.parent ).name !== 'script' && (node.parent ).name !== 'style')
	) {
		// unless this Text node is inside a <script> or <style> element, escape &,<,>
		text = escape_html(text);
	}

	renderer.add_string(text);
}

function Title$1(node, renderer, options) {
	renderer.push();

	renderer.add_string('<title>');

	renderer.render(node.children, options);

	renderer.add_string('</title>');
	const result = renderer.pop();

	renderer.add_expression(x`$$result.title = ${result}, ""`);
}

function noop() {}

const handlers$1 = {
	AwaitBlock,
	Body: noop,
	Comment,
	DebugTag,
	EachBlock,
	Element,
	Head,
	IfBlock,
	InlineComponent,
	KeyBlock,
	MustacheTag: Tag$2, // TODO MustacheTag is an anachronism
	Options: noop,
	RawMustacheTag: HtmlTag,
	Slot,
	SlotTemplate: SlotTemplate$1,
	Text: Text$1,
	Title: Title$1,
	Window: noop
};






class Renderer$1 {
	__init() {this.has_bindings = false;}

	

	__init2() {this.stack = [];}
	 // TODO can it just be `current: string`?
	

	__init3() {this.targets = [];}

	constructor({ name }) {Renderer$1.prototype.__init.call(this);Renderer$1.prototype.__init2.call(this);Renderer$1.prototype.__init3.call(this);
		this.name = name;
		this.push();
	}

	add_string(str) {
		this.current.value += escape_template(str);
	}

	add_expression(node) {
		this.literal.quasis.push({
			type: 'TemplateElement',
			value: { raw: this.current.value, cooked: null },
			tail: false
		});

		this.literal.expressions.push(node);
		this.current.value = '';
	}

	push() {
		const current = this.current = { value: '' };

		const literal = this.literal = {
			type: 'TemplateLiteral',
			expressions: [],
			quasis: []
		};

		this.stack.push({ current, literal });
	}

	pop() {
		this.literal.quasis.push({
			type: 'TemplateElement',
			value: { raw: this.current.value, cooked: null },
			tail: true
		});

		const popped = this.stack.pop();
		const last = this.stack[this.stack.length - 1];

		if (last) {
			this.literal = last.literal;
			this.current = last.current;
		}

		return popped.literal;
	}

	render(nodes, options) {
		nodes.forEach(node => {
			const handler = handlers$1[node.type];

			if (!handler) {
				throw new Error(`No handler for '${node.type}' nodes`);
			}

			handler(node, this, options);
		});
	}
}

function ssr(
	component,
	options
) {
	const renderer = new Renderer$1({
		name: component.name
	});

	const { name } = component;

	// create $$render function
	renderer.render(trim(component.fragment.children), Object.assign({
		locate: component.locate
	}, options));

	// TODO put this inside the Renderer class
	const literal = renderer.pop();

	// TODO concatenate CSS maps
	const css = options.customElement ?
		{ code: null, map: null } :
		component.stylesheet.render(options.filename, true);

	const uses_rest = component.var_lookup.has('$$restProps');
	const props = component.vars.filter(variable => !variable.module && variable.export_name);
	const rest = uses_rest ? b`let $$restProps = @compute_rest_props($$props, [${props.map(prop => `"${prop.export_name}"`).join(',')}]);` : null;

	const uses_slots = component.var_lookup.has('$$slots');
	const slots = uses_slots ? b`let $$slots = @compute_slots(#slots);` : null;

	const reactive_stores = component.vars.filter(variable => variable.name[0] === '$' && variable.name[1] !== '$');
	const reactive_store_subscriptions = reactive_stores
		.filter(store => {
			const variable = component.var_lookup.get(store.name.slice(1));
			return !variable || variable.hoistable;
		})
		.map(({ name }) => {
			const store_name = name.slice(1);
			return b`
				${component.compile_options.dev && b`@validate_store(${store_name}, '${store_name}');`}
				${`$$unsubscribe_${store_name}`} = @subscribe(${store_name}, #value => ${name} = #value)
			`;
		});
	const reactive_store_unsubscriptions = reactive_stores.map(
		({ name }) => b`${`$$unsubscribe_${name.slice(1)}`}()`
	);

	const reactive_store_declarations = reactive_stores
		.map(({ name }) => {
			const store_name = name.slice(1);
			const store = component.var_lookup.get(store_name);

			if (store && store.reassigned) {
				const unsubscribe = `$$unsubscribe_${store_name}`;
				const subscribe = `$$subscribe_${store_name}`;

				return b`let ${name}, ${unsubscribe} = @noop, ${subscribe} = () => (${unsubscribe}(), ${unsubscribe} = @subscribe(${store_name}, $$value => ${name} = $$value), ${store_name})`;
			}
			return b`let ${name}, ${`$$unsubscribe_${store_name}`};`;
		});

	// instrument get/set store value
	if (component.ast.instance) {
		let scope = component.instance_scope;
		const map = component.instance_scope_map;

		walk(component.ast.instance.content, {
			enter(node) {
				if (map.has(node)) {
					scope = map.get(node);
				}
			},
			leave(node) {
				if (map.has(node)) {
					scope = scope.parent;
				}

				if (node.type === 'AssignmentExpression' || node.type === 'UpdateExpression') {
					const assignee = node.type === 'AssignmentExpression' ? node.left : node.argument;
					const names = new Set(extract_names(assignee));
					const to_invalidate = new Set();

					for (const name of names) {
						const variable = component.var_lookup.get(name);
						if (variable &&
							!variable.hoistable &&
							!variable.global &&
							!variable.module &&
							(
								variable.subscribable || variable.name[0] === '$'
							)) {
								to_invalidate.add(variable.name);
							}
					}

					if (to_invalidate.size) {
						this.replace(
							invalidate(
								{ component } ,
								scope,
								node,
								to_invalidate,
								true
							)
						);
					}
				}
			}
		});
	}

	component.rewrite_props(({ name, reassigned }) => {
		const value = `$${name}`;

		let insert = reassigned
			? b`${`$$subscribe_${name}`}()`
			: b`${`$$unsubscribe_${name}`} = @subscribe(${name}, #value => $${value} = #value)`;

		if (component.compile_options.dev) {
			insert = b`@validate_store(${name}, '${name}'); ${insert}`;
		}

		return insert;
	});

	const instance_javascript = component.extract_javascript(component.ast.instance);

	// TODO only do this for props with a default value
	const parent_bindings = instance_javascript
		? component.vars
			.filter(variable => !variable.module && variable.export_name)
			.map(prop => {
				return b`if ($$props.${prop.export_name} === void 0 && $$bindings.${prop.export_name} && ${prop.name} !== void 0) $$bindings.${prop.export_name}(${prop.name});`;
			})
		: [];

	const injected = Array.from(component.injected_reactive_declaration_vars).filter(name => {
		const variable = component.var_lookup.get(name);
		return variable.injected;
	});

	const reactive_declarations = component.reactive_declarations.map(d => {
		const body = (d.node ).body;

		let statement = b`${body}`;

		if (!d.declaration) { // TODO do not add label if it's not referenced
			statement = b`$: { ${statement} }`;
		}

		return statement;
	});

	const main = renderer.has_bindings
		? b`
			let $$settled;
			let $$rendered;

			do {
				$$settled = true;

				${reactive_declarations}

				$$rendered = ${literal};
			} while (!$$settled);

			${reactive_store_unsubscriptions}

			return $$rendered;
		`
		: b`
			${reactive_declarations}

			${reactive_store_unsubscriptions}

			return ${literal};`;

	const blocks = [
		...injected.map(name => b`let ${name};`),
		rest,
		slots,
		...reactive_store_declarations,
		...reactive_store_subscriptions,
		instance_javascript,
		...parent_bindings,
		css.code && b`$$result.css.add(#css);`,
		main
	].filter(Boolean);

	const js = b`
		${css.code ? b`
		const #css = {
			code: "${css.code}",
			map: ${css.map ? string_literal(css.map.toString()) : 'null'}
		};` : null}

		${component.extract_javascript(component.ast.module)}

		${component.fully_hoisted}

		const ${name} = @create_ssr_component(($$result, $$props, $$bindings, #slots) => {
			${blocks}
		});
	`;

	return {js, css};
}

function trim(nodes) {
	let start = 0;
	for (; start < nodes.length; start += 1) {
		const node = nodes[start] ;
		if (node.type !== 'Text') break;

		node.data = node.data.replace(/^\s+/, '');
		if (node.data) break;
	}

	let end = nodes.length;
	for (; end > start; end -= 1) {
		const node = nodes[end - 1] ;
		if (node.type !== 'Text') break;

		node.data = node.data.replace(/\s+$/, '');
		if (node.data) break;
	}

	return nodes.slice(start, end);
}

const wrappers$1 = { esm, cjs };






function create_module(
	program,
	format,
	name,
	banner,
	sveltePath = 'svelte',
	helpers,
	globals,
	imports,
	module_exports
) {
	const internal_path = `${sveltePath}/internal`;

	helpers.sort((a, b) => (a.name < b.name) ? -1 : 1);
	globals.sort((a, b) => (a.name < b.name) ? -1 : 1);

	if (format === 'esm') {
		return esm(program, name, banner, sveltePath, internal_path, helpers, globals, imports, module_exports);
	}

	if (format === 'cjs') return cjs(program, name, banner, sveltePath, internal_path, helpers, globals, imports, module_exports);

	throw new Error(`options.format is invalid (must be ${list(Object.keys(wrappers$1))})`);
}

function edit_source(source, sveltePath) {
	return source === 'svelte' || source.startsWith('svelte/')
		? source.replace('svelte', sveltePath)
		: source;
}

function get_internal_globals(
	globals, 
	helpers
) {
	return globals.length > 0 && {
		type: 'VariableDeclaration',
		kind: 'const',
		declarations: [{
			type: 'VariableDeclarator',
			id: {
				type: 'ObjectPattern',
				properties: globals.map(g => ({
					type: 'Property',
					method: false,
					shorthand: false,
					computed: false,
					key: { type: 'Identifier', name: g.name },
					value: g.alias,
					kind: 'init'
				}))
			},
			init: helpers.find(({ name }) => name === 'globals').alias
		}]
	};
} 

function esm(
	program,
	name,
	banner,
	sveltePath,
	internal_path,
	helpers,
	globals,
	imports,
	module_exports
) {
	const import_declaration = {
		type: 'ImportDeclaration',
		specifiers: helpers.map(h => ({
			type: 'ImportSpecifier',
			local: h.alias,
			imported: { type: 'Identifier', name: h.name }
		})),
		source: { type: 'Literal', value: internal_path }
	};

	const internal_globals = get_internal_globals(globals, helpers);

	// edit user imports
	imports.forEach(node => {
		node.source.value = edit_source(node.source.value, sveltePath);
	});

	const exports = module_exports.length > 0 && {
		type: 'ExportNamedDeclaration',
		specifiers: module_exports.map(x => ({
			type: 'Specifier',
			local: { type: 'Identifier', name: x.name },
			exported: { type: 'Identifier', name: x.as }
		}))
	};

	program.body = b`
		/* ${banner} */

		${import_declaration}
		${internal_globals}
		${imports}

		${program.body}

		export default ${name};
		${exports}
	`;
}

function cjs(
	program,
	name,
	banner,
	sveltePath,
	internal_path,
	helpers,
	globals,
	imports,
	module_exports
) {
	const internal_requires = {
		type: 'VariableDeclaration',
		kind: 'const',
		declarations: [{
			type: 'VariableDeclarator',
			id: {
				type: 'ObjectPattern',
				properties: helpers.map(h => ({
					type: 'Property',
					method: false,
					shorthand: false,
					computed: false,
					key: { type: 'Identifier', name: h.name },
					value: h.alias,
					kind: 'init'
				}))
			},
			init: x`require("${internal_path}")`
		}]
	};

	const internal_globals = get_internal_globals(globals, helpers);

	const user_requires = imports.map(node => {
		const init = x`require("${edit_source(node.source.value, sveltePath)}")`;
		if (node.specifiers.length === 0) {
			return b`${init};`;
		}
		return {
			type: 'VariableDeclaration',
			kind: 'const',
			declarations: [{
				type: 'VariableDeclarator',
				id: node.specifiers[0].type === 'ImportNamespaceSpecifier'
					? { type: 'Identifier', name: node.specifiers[0].local.name }
					: {
						type: 'ObjectPattern',
						properties: node.specifiers.map(s => ({
							type: 'Property',
							method: false,
							shorthand: false,
							computed: false,
							key: s.type === 'ImportSpecifier' ? s.imported : { type: 'Identifier', name: 'default' },
							value: s.local,
							kind: 'init'
						}))
					},
				init
			}]
		};
	});

	const exports = module_exports.map(x => b`exports.${{ type: 'Identifier', name: x.as }} = ${{ type: 'Identifier', name: x.name }};`);

	program.body = b`
		/* ${banner} */

		"use strict";
		${internal_requires}
		${internal_globals}
		${user_requires}

		${program.body}

		exports.default = ${name};
		${exports}
	`;
}

const UNKNOWN = {};

function gather_possible_values(node, set) {
	if (node.type === 'Literal') {
		set.add(node.value);
	} else if (node.type === 'ConditionalExpression') {
		gather_possible_values(node.consequent, set);
		gather_possible_values(node.alternate, set);
	} else {
		set.add(UNKNOWN);
	}
}

var BlockAppliesToNode; (function (BlockAppliesToNode) {
	const NotPossible = 0; BlockAppliesToNode[BlockAppliesToNode["NotPossible"] = NotPossible] = "NotPossible";
	const Possible = NotPossible + 1; BlockAppliesToNode[BlockAppliesToNode["Possible"] = Possible] = "Possible";
	const UnknownSelectorType = Possible + 1; BlockAppliesToNode[BlockAppliesToNode["UnknownSelectorType"] = UnknownSelectorType] = "UnknownSelectorType";
})(BlockAppliesToNode || (BlockAppliesToNode = {}));
var NodeExist; (function (NodeExist) {
	const Probably = 1; NodeExist[NodeExist["Probably"] = Probably] = "Probably";
	const Definitely = 2; NodeExist[NodeExist["Definitely"] = Definitely] = "Definitely";
})(NodeExist || (NodeExist = {}));

const whitelist_attribute_selector = new Map([
	['details', new Set(['open'])]
]);

class Selector {
	
	
	
	
	

	constructor(node, stylesheet) {
		this.node = node;
		this.stylesheet = stylesheet;

		this.blocks = group_selectors(node);

		// take trailing :global(...) selectors out of consideration
		let i = this.blocks.length;
		while (i > 0) {
			if (!this.blocks[i - 1].global) break;
			i -= 1;
		}

		this.local_blocks = this.blocks.slice(0, i);

		const host_only = this.blocks.length === 1 && this.blocks[0].host;

		this.used = this.local_blocks.length === 0 || host_only;
	}

	apply(node) {
		const to_encapsulate = [];

		apply_selector(this.local_blocks.slice(), node, to_encapsulate);

		if (to_encapsulate.length > 0) {
			to_encapsulate.forEach(({ node, block }) => {
				this.stylesheet.nodes_with_css_class.add(node);
				block.should_encapsulate = true;
			});

			this.used = true;
		}
	}

	minify(code) {
		let c = null;
		this.blocks.forEach((block, i) => {
			if (i > 0) {
				if (block.start - c > 1) {
					code.overwrite(c, block.start, block.combinator.name || ' ');
				}
			}

			c = block.end;
		});
	}

	transform(code, attr, max_amount_class_specificity_increased) {
		const amount_class_specificity_to_increase = max_amount_class_specificity_increased - this.blocks.filter(block => block.should_encapsulate).length;

		function encapsulate_block(block, attr) {
			let i = block.selectors.length;

			while (i--) {
				const selector = block.selectors[i];
				if (selector.type === 'PseudoElementSelector' || selector.type === 'PseudoClassSelector') {
					if (selector.name !== 'root' && selector.name !== 'host') {
						if (i === 0) code.prependRight(selector.start, attr);
					}
					continue;
				}

				if (selector.type === 'TypeSelector' && selector.name === '*') {
					code.overwrite(selector.start, selector.end, attr);
				} else {
					code.appendLeft(selector.end, attr);
				}

				break;
			}
		}

		this.blocks.forEach((block, index) => {
			if (block.global) {
				const selector = block.selectors[0];
				const first = selector.children[0];
				const last = selector.children[selector.children.length - 1];
				code.remove(selector.start, first.start).remove(last.end, selector.end);
			}
			if (block.should_encapsulate) encapsulate_block(block, index === this.blocks.length - 1 ? attr.repeat(amount_class_specificity_to_increase + 1) : attr);
		});
	}

	validate(component) {
		this.blocks.forEach((block) => {
			let i = block.selectors.length;
			while (i-- > 1) {
				const selector = block.selectors[i];
				if (selector.type === 'PseudoClassSelector' && selector.name === 'global') {
					component.error(selector, {
						code: 'css-invalid-global',
						message: ':global(...) must be the first element in a compound selector'
					});
				}
			}
		});

		let start = 0;
		let end = this.blocks.length;

		for (; start < end; start += 1) {
			if (!this.blocks[start].global) break;
		}

		for (; end > start; end -= 1) {
			if (!this.blocks[end - 1].global) break;
		}

		for (let i = start; i < end; i += 1) {
			if (this.blocks[i].global) {
				component.error(this.blocks[i].selectors[0], {
					code: 'css-invalid-global',
					message: ':global(...) can be at the start or end of a selector sequence, but not in the middle'
				});
			}
		}
	}

	get_amount_class_specificity_increased() {
		let count = 0;
		for (const block of this.blocks) {
			if (block.should_encapsulate) {
				count ++;
			}
		}
		return count;
	}
}

function apply_selector(blocks, node, to_encapsulate) {
	const block = blocks.pop();
	if (!block) return false;

	if (!node) {
		return (
      (block.global && blocks.every(block => block.global)) ||
      (block.host && blocks.length === 0)
    );
	}

	switch (block_might_apply_to_node(block, node)) {
		case BlockAppliesToNode.NotPossible:
			return false;

		case BlockAppliesToNode.UnknownSelectorType:
		// bail. TODO figure out what these could be
			to_encapsulate.push({ node, block });
			return true;
	}

	if (block.combinator) {
		if (block.combinator.type === 'WhiteSpace') {
			for (const ancestor_block of blocks) {
				if (ancestor_block.global) {
					continue;
				}

				if (ancestor_block.host) {
					to_encapsulate.push({ node, block });
					return true;
				}

				let parent = node;
				while (parent = get_element_parent(parent)) {
					if (block_might_apply_to_node(ancestor_block, parent) !== BlockAppliesToNode.NotPossible) {
						to_encapsulate.push({ node: parent, block: ancestor_block });
					}
				}

				if (to_encapsulate.length) {
					to_encapsulate.push({ node, block });
					return true;
				}
			}

			if (blocks.every(block => block.global)) {
				to_encapsulate.push({ node, block });
				return true;
			}

			return false;
		} else if (block.combinator.name === '>') {
			if (apply_selector(blocks, get_element_parent(node), to_encapsulate)) {
				to_encapsulate.push({ node, block });
				return true;
			}

			return false;
		} else if (block.combinator.name === '+' || block.combinator.name === '~') {
			const siblings = get_possible_element_siblings(node, block.combinator.name === '+');
			let has_match = false;

			// NOTE: if we have :global(), we couldn't figure out what is selected within `:global` due to the 
			// css-tree limitation that does not parse the inner selector of :global
			// so unless we are sure there will be no sibling to match, we will consider it as matched
			const has_global = blocks.some(block => block.global);
			if (has_global) {
				if (siblings.size === 0 && get_element_parent(node) !== null) {
					return false;
				}
				to_encapsulate.push({ node, block });
				return true;
			}

			for (const possible_sibling of siblings.keys()) {
				if (apply_selector(blocks.slice(), possible_sibling, to_encapsulate)) {
					to_encapsulate.push({ node, block });
					has_match = true;
				}
			}
			return has_match;
		}

		// TODO other combinators
		to_encapsulate.push({ node, block });
		return true;
	}

	to_encapsulate.push({ node, block });
	return true;
}

function block_might_apply_to_node(block, node) {
	let i = block.selectors.length;

	while (i--) {
		const selector = block.selectors[i];
		const name = typeof selector.name === 'string' && selector.name.replace(/\\(.)/g, '$1');

		if (selector.type === 'PseudoClassSelector' && name === 'host') {
			return BlockAppliesToNode.NotPossible;
		}

		if (selector.type === 'PseudoClassSelector' || selector.type === 'PseudoElementSelector') {
			continue;
		}

		if (selector.type === 'PseudoClassSelector' && name === 'global') {
			// TODO shouldn't see this here... maybe we should enforce that :global(...)
			// cannot be sandwiched between non-global selectors?
			return BlockAppliesToNode.NotPossible;
		}

		if (selector.type === 'ClassSelector') {
			if (!attribute_matches(node, 'class', name, '~=', false) && !node.classes.some(c => c.name === name)) return BlockAppliesToNode.NotPossible;
		} else if (selector.type === 'IdSelector') {
			if (!attribute_matches(node, 'id', name, '=', false)) return BlockAppliesToNode.NotPossible;
		} else if (selector.type === 'AttributeSelector') {
			if (
				!(whitelist_attribute_selector.has(node.name.toLowerCase()) && whitelist_attribute_selector.get(node.name.toLowerCase()).has(selector.name.name.toLowerCase())) &&
				!attribute_matches(node, selector.name.name, selector.value && unquote(selector.value), selector.matcher, selector.flags)) {
				return BlockAppliesToNode.NotPossible;
			}
		} else if (selector.type === 'TypeSelector') {
			if (node.name.toLowerCase() !== name.toLowerCase() && name !== '*') return BlockAppliesToNode.NotPossible;
		} else {
			return BlockAppliesToNode.UnknownSelectorType;
		}
	}

	return BlockAppliesToNode.Possible;
}

function test_attribute(operator, expected_value, case_insensitive, value) {
	if (case_insensitive) {
		expected_value = expected_value.toLowerCase();
		value = value.toLowerCase();
	}
	switch (operator) {
		case '=': return value === expected_value;
		case '~=': return value.split(/\s/).includes(expected_value);
		case '|=': return `${value}-`.startsWith(`${expected_value}-`);
		case '^=': return value.startsWith(expected_value);
		case '$=': return value.endsWith(expected_value);
		case '*=': return value.includes(expected_value);
		default: throw new Error("this shouldn't happen");
	}
}

function attribute_matches(node, name, expected_value, operator, case_insensitive) {
	const spread = node.attributes.find(attr => attr.type === 'Spread');
	if (spread) return true;

	if (node.bindings.some((binding) => binding.name === name)) return true;

	const attr = node.attributes.find((attr) => attr.name === name);
	if (!attr) return false;
	if (attr.is_true) return operator === null;
	if (!expected_value) return true;

	if (attr.chunks.length === 1) {
		const value = attr.chunks[0];
		if (!value) return false;
		if (value.type === 'Text') return test_attribute(operator, expected_value, case_insensitive, value.data);
	}

	const possible_values = new Set();

	let prev_values = [];
	for (const chunk of attr.chunks) {
		const current_possible_values = new Set();
		if (chunk.type === 'Text') {
			current_possible_values.add(chunk.data);
		} else {
			gather_possible_values(chunk.node, current_possible_values);
		}

		// impossible to find out all combinations
		if (current_possible_values.has(UNKNOWN)) return true;

		if (prev_values.length > 0) {
			const start_with_space = [];
			const remaining = [];
			current_possible_values.forEach((current_possible_value) => {
				if (/^\s/.test(current_possible_value)) {
					start_with_space.push(current_possible_value);
				} else {
					remaining.push(current_possible_value);
				}
			});

			if (remaining.length > 0) {
				if (start_with_space.length > 0) {
					prev_values.forEach(prev_value => possible_values.add(prev_value));
				}

				const combined = [];
				prev_values.forEach((prev_value) => {
					remaining.forEach((value) => {
						combined.push(prev_value + value);
					});
				});
				prev_values = combined;

				start_with_space.forEach((value) => {
					if (/\s$/.test(value)) {
						possible_values.add(value);
					} else {
						prev_values.push(value);
					}
				});
				continue;
			} else {
				prev_values.forEach(prev_value => possible_values.add(prev_value));
				prev_values = [];
			}
		}

		current_possible_values.forEach((current_possible_value) => {
			if (/\s$/.test(current_possible_value)) {
				possible_values.add(current_possible_value);
			} else {
				prev_values.push(current_possible_value);
			}
		});
		if (prev_values.length < current_possible_values.size) {
			prev_values.push(' ');
		}

		if (prev_values.length > 20) {
			// might grow exponentially, bail out
			return true;
		}
	}
	prev_values.forEach(prev_value => possible_values.add(prev_value));

	if (possible_values.has(UNKNOWN)) return true;

	for (const value of possible_values) {
		if (test_attribute(operator, expected_value, case_insensitive, value)) return true;
	}

	return false;
}

function unquote(value) {
	if (value.type === 'Identifier') return value.name;
	const str = value.value;
	if (str[0] === str[str.length - 1] && str[0] === "'" || str[0] === '"') {
		return str.slice(1, str.length - 1);
	}
	return str;
}

function get_element_parent(node) {
	let parent = node;
	while ((parent = parent.parent) && parent.type !== 'Element');
	return parent ;
}

function get_possible_element_siblings(node, adjacent_only) {
	const result = new Map();
	let prev = node;
	while (prev = prev.prev) {
		if (prev.type === 'Element') {
			if (!prev.attributes.find(attr => attr.type === 'Attribute' && attr.name.toLowerCase() === 'slot')) {
				result.set(prev, NodeExist.Definitely);
			}

			if (adjacent_only) {
				break;
			}
		} else if (prev.type === 'EachBlock' || prev.type === 'IfBlock' || prev.type === 'AwaitBlock') {
			const possible_last_child = get_possible_last_child(prev, adjacent_only);

			add_to_map(possible_last_child, result);
			if (adjacent_only && has_definite_elements(possible_last_child)) {
				return result;
			}
		}
	}

	if (!prev || !adjacent_only) {
		let parent = node;
		let skip_each_for_last_child = node.type === 'ElseBlock';
		while ((parent = parent.parent) && (parent.type === 'EachBlock' || parent.type === 'IfBlock' || parent.type === 'ElseBlock' || parent.type === 'AwaitBlock')) {
			const possible_siblings = get_possible_element_siblings(parent, adjacent_only);
			add_to_map(possible_siblings, result);
			
			if (parent.type === 'EachBlock') {
				// first child of each block can select the last child of each block as previous sibling
				if (skip_each_for_last_child) {
					skip_each_for_last_child = false;
				} else {
					add_to_map(get_possible_last_child(parent, adjacent_only), result);
				}
			} else if (parent.type === 'ElseBlock') {
				skip_each_for_last_child = true;
				parent = parent.parent;
			}

			if (adjacent_only && has_definite_elements(possible_siblings)) {
				break;
			}
		}
	}

	return result;
}

function get_possible_last_child(block, adjacent_only) {
	const result = new Map();

	if (block.type === 'EachBlock') {
		const each_result = loop_child(block.children, adjacent_only);
		const else_result = block.else ? loop_child(block.else.children, adjacent_only) : new Map();
		
		const not_exhaustive = !has_definite_elements(else_result);

		if (not_exhaustive) {
			mark_as_probably(each_result);
			mark_as_probably(else_result);
		}
		add_to_map(each_result, result);
		add_to_map(else_result, result);
	} else if (block.type === 'IfBlock') {
		const if_result = loop_child(block.children, adjacent_only);
		const else_result = block.else ? loop_child(block.else.children, adjacent_only) : new Map();

		const not_exhaustive = !has_definite_elements(if_result) || !has_definite_elements(else_result);

		if (not_exhaustive) {
			mark_as_probably(if_result);
			mark_as_probably(else_result);
		}

		add_to_map(if_result, result);
		add_to_map(else_result, result);
	} else if (block.type === 'AwaitBlock') {
		const pending_result = block.pending ? loop_child(block.pending.children, adjacent_only) : new Map();
		const then_result = block.then ? loop_child(block.then.children, adjacent_only) : new Map();
		const catch_result = block.catch ? loop_child(block.catch.children, adjacent_only) : new Map();

		const not_exhaustive = !has_definite_elements(pending_result) || !has_definite_elements(then_result) || !has_definite_elements(catch_result);

		if (not_exhaustive) {
			mark_as_probably(pending_result);
			mark_as_probably(then_result);
			mark_as_probably(catch_result);
		}

		add_to_map(pending_result, result);
		add_to_map(then_result, result);
		add_to_map(catch_result, result);
	}

	return result;
}

function has_definite_elements(result) {
	if (result.size === 0) return false;
	for (const exist of result.values()) {
		if (exist === NodeExist.Definitely) {
			return true;
		}
	}
	return false;
}

function add_to_map(from, to) {
	from.forEach((exist, element) => {
		to.set(element, higher_existance(exist, to.get(element)));
	});
}

function higher_existance(exist1, exist2) {
	if (exist1 === undefined || exist2 === undefined) return exist1 || exist2;
	return exist1 > exist2 ? exist1 : exist2;
}

function mark_as_probably(result) {
	for (const key of result.keys()) {
		result.set(key, NodeExist.Probably);
	}
}

function loop_child(children, adjacent_only) {
	const result = new Map();
	for (let i = children.length - 1; i >= 0; i--) {
		const child = children[i];
		if (child.type === 'Element') {
			result.set(child, NodeExist.Definitely);
			if (adjacent_only) {
				break;
			}
		} else if (child.type === 'EachBlock' || child.type === 'IfBlock' || child.type === 'AwaitBlock') {
			const child_result = get_possible_last_child(child, adjacent_only);
			add_to_map(child_result, result);
			if (adjacent_only && has_definite_elements(child_result)) {
				break;
			}
		}
	}
	return result;
}

class Block$1 {
	
	
	
	
	
	
	

	constructor(combinator) {
		this.combinator = combinator;
		this.global = false;
		this.host = false;
		this.selectors = [];

		this.start = null;
		this.end = null;

		this.should_encapsulate = false;
	}

	add(selector) {
		if (this.selectors.length === 0) {
			this.start = selector.start;
			this.global = selector.type === 'PseudoClassSelector' && selector.name === 'global';
			this.host = selector.type === 'PseudoClassSelector' && selector.name === 'host';
		}

		this.selectors.push(selector);
		this.end = selector.end;
	}
}

function group_selectors(selector) {
	let block = new Block$1(null);

	const blocks = [block];

	selector.children.forEach((child) => {
		if (child.type === 'WhiteSpace' || child.type === 'Combinator') {
			block = new Block$1(child);
			blocks.push(block);
		} else {
			block.add(child);
		}
	});

	return blocks;
}

function remove_css_prefix(name) {
	return name.replace(/^-((webkit)|(moz)|(o)|(ms))-/, '');
}

const is_keyframes_node = (node) =>
	remove_css_prefix(node.name) === 'keyframes';

const at_rule_has_declaration = ({ block }) =>
	block &&
	block.children &&
	block.children.find((node) => node.type === 'Declaration');

function minify_declarations(
	code,
	start,
	declarations
) {
	let c = start;

	declarations.forEach((declaration, i) => {
		const separator = i > 0 ? ';' : '';
		if ((declaration.node.start - c) > separator.length) {
			code.overwrite(c, declaration.node.start, separator);
		}
		declaration.minify(code);
		c = declaration.node.end;
	});

	return c;
}

class Rule {
	
	
	
	

	constructor(node, stylesheet, parent) {
		this.node = node;
		this.parent = parent;
		this.selectors = node.prelude.children.map((node) => new Selector(node, stylesheet));
		this.declarations = node.block.children.map((node) => new Declaration(node));
	}

	apply(node) {
		this.selectors.forEach(selector => selector.apply(node)); // TODO move the logic in here?
	}

	is_used(dev) {
		if (this.parent && this.parent.node.type === 'Atrule' && is_keyframes_node(this.parent.node)) return true;
		if (this.declarations.length === 0) return dev;
		return this.selectors.some(s => s.used);
	}

	minify(code, _dev) {
		let c = this.node.start;
		let started = false;

		this.selectors.forEach((selector) => {
			if (selector.used) {
				const separator = started ? ',' : '';
				if ((selector.node.start - c) > separator.length) {
					code.overwrite(c, selector.node.start, separator);
				}

				selector.minify(code);
				c = selector.node.end;

				started = true;
			}
		});

		code.remove(c, this.node.block.start);

		c = this.node.block.start + 1;
		c = minify_declarations(code, c, this.declarations);

		code.remove(c, this.node.block.end - 1);
	}

	transform(code, id, keyframes, max_amount_class_specificity_increased) {
		if (this.parent && this.parent.node.type === 'Atrule' && is_keyframes_node(this.parent.node)) return true;

		const attr = `.${id}`;

		this.selectors.forEach(selector => selector.transform(code, attr, max_amount_class_specificity_increased));
		this.declarations.forEach(declaration => declaration.transform(code, keyframes));
	}

	validate(component) {
		this.selectors.forEach(selector => {
			selector.validate(component);
		});
	}

	warn_on_unused_selector(handler) {
		this.selectors.forEach(selector => {
			if (!selector.used) handler(selector);
		});
	}

	get_max_amount_class_specificity_increased() {
		return Math.max(...this.selectors.map(selector => selector.get_amount_class_specificity_increased()));
	}
}

class Declaration {
	

	constructor(node) {
		this.node = node;
	}

	transform(code, keyframes) {
		const property = this.node.property && remove_css_prefix(this.node.property.toLowerCase());
		if (property === 'animation' || property === 'animation-name') {
			this.node.value.children.forEach((block) => {
				if (block.type === 'Identifier') {
					const name = block.name;
					if (keyframes.has(name)) {
						code.overwrite(block.start, block.end, keyframes.get(name));
					}
				}
			});
		}
	}

	minify(code) {
		if (!this.node.property) return; // @apply, and possibly other weird cases?

		const c = this.node.start + this.node.property.length;
		const first = this.node.value.children
			? this.node.value.children[0]
			: this.node.value;

		let start = first.start;
		while (/\s/.test(code.original[start])) start += 1;

		if (start - c > 1) {
			code.overwrite(c, start, ':');
		}
	}
}

class Atrule {
	
	
	

	constructor(node) {
		this.node = node;
		this.children = [];
		this.declarations = [];
	}

	apply(node) {
		if (this.node.name === 'media' || this.node.name === 'supports') {
			this.children.forEach(child => {
				child.apply(node);
			});
		} else if (is_keyframes_node(this.node)) {
			this.children.forEach((rule) => {
				rule.selectors.forEach(selector => {
					selector.used = true;
				});
			});
		}
	}

	is_used(_dev) {
		return true; // TODO
	}

	minify(code, dev) {
		if (this.node.name === 'media') {
			const expression_char = code.original[this.node.prelude.start];
			let c = this.node.start + (expression_char === '(' ? 6 : 7);
			if (this.node.prelude.start > c) code.remove(c, this.node.prelude.start);

			this.node.prelude.children.forEach((query) => {
				// TODO minify queries
				c = query.end;
			});

			code.remove(c, this.node.block.start);
		} else if (this.node.name === 'supports') {
			let c = this.node.start + 9;
			if (this.node.prelude.start - c > 1) code.overwrite(c, this.node.prelude.start, ' ');
			this.node.prelude.children.forEach((query) => {
				// TODO minify queries
				c = query.end;
			});
			code.remove(c, this.node.block.start);
		} else {
			let c = this.node.start + this.node.name.length + 1;
			if (this.node.prelude) {
				if (this.node.prelude.start - c > 1) code.overwrite(c, this.node.prelude.start, ' ');
				c = this.node.prelude.end;
			}
			if (this.node.block && this.node.block.start - c > 0) {
				code.remove(c, this.node.block.start);
			}
		}

		// TODO other atrules

		if (this.node.block) {
			let c = this.node.block.start + 1;
			if (this.declarations.length) {
				c = minify_declarations(code, c, this.declarations);
				// if the atrule has children, leave the last declaration semicolon alone
				if (this.children.length) c++;
			}

			this.children.forEach(child => {
				if (child.is_used(dev)) {
					code.remove(c, child.node.start);
					child.minify(code, dev);
					c = child.node.end;
				}
			});

			code.remove(c, this.node.block.end - 1);
		}
	}

	transform(code, id, keyframes, max_amount_class_specificity_increased) {
		if (is_keyframes_node(this.node)) {
			this.node.prelude.children.forEach(({ type, name, start, end }) => {
				if (type === 'Identifier') {
					if (name.startsWith('-global-')) {
						code.remove(start, start + 8);
						this.children.forEach((rule) => {
							rule.selectors.forEach(selector => {
								selector.used = true;
							});
						});
					} else {
						code.overwrite(start, end, keyframes.get(name));
					}
				}
			});
		}

		this.children.forEach(child => {
			child.transform(code, id, keyframes, max_amount_class_specificity_increased);
		});
	}

	validate(component) {
		this.children.forEach(child => {
			child.validate(component);
		});
	}

	warn_on_unused_selector(handler) {
		if (this.node.name !== 'media') return;

		this.children.forEach(child => {
			child.warn_on_unused_selector(handler);
		});
	}

	get_max_amount_class_specificity_increased() {
		return Math.max(...this.children.map(rule => rule.get_max_amount_class_specificity_increased()));
	}
}

const get_default_css_hash = ({ css, hash }) => {
	return `svelte-${hash(css)}`;
};

class Stylesheet {
	
	
	
	

	
	

	__init() {this.children = [];}
	__init2() {this.keyframes = new Map();}

	__init3() {this.nodes_with_css_class = new Set();}

	constructor({
		source,
		ast,
		component_name,
		filename,
		dev,
		get_css_hash = get_default_css_hash
	}






) {Stylesheet.prototype.__init.call(this);Stylesheet.prototype.__init2.call(this);Stylesheet.prototype.__init3.call(this);
		this.source = source;
		this.ast = ast;
		this.filename = filename;
		this.dev = dev;

		if (ast.css && ast.css.children.length) {
			this.id = get_css_hash({
				filename,
				name: component_name,
				css: ast.css.content.styles,
				hash
			});

			this.has_styles = true;

			const stack = [];
			let depth = 0;
			let current_atrule = null;

			walk(ast.css , {
				enter: (node) => {
					if (node.type === 'Atrule') {
						const atrule = new Atrule(node);
						stack.push(atrule);

						if (current_atrule) {
							current_atrule.children.push(atrule);
						} else if (depth <= 1) {
							this.children.push(atrule);
						}

						if (is_keyframes_node(node)) {
							node.prelude.children.forEach((expression) => {
								if (expression.type === 'Identifier' && !expression.name.startsWith('-global-')) {
									this.keyframes.set(expression.name, `${this.id}-${expression.name}`);
								}
							});
						} else if (at_rule_has_declaration(node)) {
							const at_rule_declarations = node.block.children
								.filter(node => node.type === 'Declaration')
								.map(node => new Declaration(node));
							atrule.declarations.push(...at_rule_declarations);
						}

						current_atrule = atrule;
					}

					if (node.type === 'Rule') {
						const rule = new Rule(node, this, current_atrule);

						if (current_atrule) {
							current_atrule.children.push(rule);
						} else if (depth <= 1) {
							this.children.push(rule);
						}
					}

					depth += 1;
				},

				leave: (node) => {
					if (node.type === 'Atrule') {
						stack.pop();
						current_atrule = stack[stack.length - 1];
					}

					depth -= 1;
				}
			});
		} else {
			this.has_styles = false;
		}
	}

	apply(node) {
		if (!this.has_styles) return;

		for (let i = 0; i < this.children.length; i += 1) {
			const child = this.children[i];
			child.apply(node);
		}
	}

	reify() {
		this.nodes_with_css_class.forEach((node) => {
			node.add_css_class();
		});
	}

	render(file, should_transform_selectors) {
		if (!this.has_styles) {
			return { code: null, map: null };
		}

		const code = new MagicString(this.source);

		walk(this.ast.css , {
			enter: (node) => {
				code.addSourcemapLocation(node.start);
				code.addSourcemapLocation(node.end);
			}
		});

		if (should_transform_selectors) {
			const max = Math.max(...this.children.map(rule => rule.get_max_amount_class_specificity_increased()));
			this.children.forEach((child) => {
				child.transform(code, this.id, this.keyframes, max);
			});
		}

		let c = 0;
		this.children.forEach(child => {
			if (child.is_used(this.dev)) {
				code.remove(c, child.node.start);
				child.minify(code, this.dev);
				c = child.node.end;
			}
		});

		code.remove(c, this.source.length);

		return {
			code: code.toString(),
			map: code.generateMap({
				includeContent: true,
				source: this.filename,
				file
			})
		};
	}

	validate(component) {
		this.children.forEach(child => {
			child.validate(component);
		});
	}

	warn_on_unused_selectors(component) {
		this.children.forEach(child => {
			child.warn_on_unused_selector((selector) => {
				component.warn(selector.node, {
					code: 'css-unused-selector',
					message: `Unused CSS selector "${this.source.slice(selector.node.start, selector.node.end)}"`
				});
			});
		});
	}
}

const test = typeof process !== 'undefined' && process.env.TEST;

class TemplateScope {
	
	
	__init() {this.owners = new Map();}
	

	constructor(parent) {TemplateScope.prototype.__init.call(this);
		this.parent = parent;
		this.names = new Set(parent ? parent.names : []);
		this.dependencies_for_name = new Map(parent ? parent.dependencies_for_name : []);
	}

	add(name, dependencies, owner) {
		this.names.add(name);
		this.dependencies_for_name.set(name, dependencies);
		this.owners.set(name, owner);
		return this;
	}

	child() {
		const child = new TemplateScope(this);
		return child;
	}

	is_top_level(name) {
		return !this.parent || !this.names.has(name) && this.parent.is_top_level(name);
	}

	get_owner(name) {
		return this.owners.get(name) || (this.parent && this.parent.get_owner(name));
	}

	is_let(name) {
		const owner = this.get_owner(name);
		return owner && (owner.type === 'Element' || owner.type === 'InlineComponent' || owner.type === 'SlotTemplate');
	}

	is_await(name) {
		const owner = this.get_owner(name);
		return owner && (owner.type === 'ThenBlock' || owner.type === 'CatchBlock');
	}
}

class Fragment extends Node {
	
	
	
	

	constructor(component, info) {
		const scope = new TemplateScope();
		super(component, null, scope, info);

		this.scope = scope;
		this.children = map_children(component, this, scope, info.children);
	}
}

// This file is automatically generated
var internal_exports = new Set(["HtmlTag","SvelteComponent","SvelteComponentDev","SvelteComponentTyped","SvelteElement","action_destroyer","add_attribute","add_classes","add_flush_callback","add_location","add_render_callback","add_resize_listener","add_transform","afterUpdate","append","append_dev","assign","attr","attr_dev","attribute_to_object","beforeUpdate","bind","binding_callbacks","blank_object","bubble","check_outros","children","claim_component","claim_element","claim_space","claim_text","clear_loops","component_subscribe","compute_rest_props","compute_slots","createEventDispatcher","create_animation","create_bidirectional_transition","create_component","create_in_transition","create_out_transition","create_slot","create_ssr_component","current_component","custom_event","dataset_dev","debug","destroy_block","destroy_component","destroy_each","detach","detach_after_dev","detach_before_dev","detach_between_dev","detach_dev","dirty_components","dispatch_dev","each","element","element_is","empty","escape","escaped","exclude_internal_props","fix_and_destroy_block","fix_and_outro_and_destroy_block","fix_position","flush","getContext","get_binding_group_value","get_current_component","get_custom_elements_slots","get_slot_changes","get_slot_context","get_spread_object","get_spread_update","get_store_value","globals","group_outros","handle_promise","hasContext","has_prop","identity","init","insert","insert_dev","intros","invalid_attribute_name_character","is_client","is_crossorigin","is_empty","is_function","is_promise","listen","listen_dev","loop","loop_guard","missing_component","mount_component","noop","not_equal","now","null_to_empty","object_without_properties","onDestroy","onMount","once","outro_and_destroy_block","prevent_default","prop_dev","query_selector_all","raf","run","run_all","safe_not_equal","schedule_update","select_multiple_value","select_option","select_options","select_value","self","setContext","set_attributes","set_current_component","set_custom_element_data","set_data","set_data_dev","set_input_type","set_input_value","set_now","set_raf","set_store_value","set_style","set_svg_attributes","space","spread","stop_propagation","subscribe","svg_element","text","tick","time_ranges_to_array","to_number","toggle_class","transition_in","transition_out","update_keyed_each","update_slot","update_slot_spread","validate_component","validate_each_argument","validate_each_keys","validate_slots","validate_store","xlink_attr"]);

function is_used_as_reference(
	node,
	parent
) {
	if (!isReference(node, parent)) {
		return false;
	}
	if (!parent) {
		return true;
	}

	/* eslint-disable no-fallthrough */
	switch (parent.type) {
		// disregard the `foo` in `const foo = bar`
		case 'VariableDeclarator':
			return node !== parent.id;
		// disregard the `foo`, `bar` in `function foo(bar){}`
		case 'FunctionDeclaration':
		// disregard the `foo` in `import { foo } from 'foo'`
		case 'ImportSpecifier':
		// disregard the `foo` in `import foo from 'foo'`
		case 'ImportDefaultSpecifier':
		// disregard the `foo` in `import * as foo from 'foo'`
		case 'ImportNamespaceSpecifier':
		// disregard the `foo` in `export { foo }`
		case 'ExportSpecifier':
			return false;
		default:
			return true;
	}
}

function check_graph_for_cycles(edges) {
	const graph = edges.reduce((g, edge) => {
		const [u, v] = edge;
		if (!g.has(u)) g.set(u, []);
		if (!g.has(v)) g.set(v, []);
		g.get(u).push(v);
		return g;
	}, new Map());

	const visited = new Set();
	const on_stack = new Set();
	const cycles = [];

	function visit (v) {
		visited.add(v);
		on_stack.add(v);

		graph.get(v).forEach(w => {
			if (!visited.has(w)) {
				visit(w);
			} else if (on_stack.has(w)) {
				cycles.push([...on_stack, w]);
			}
		});

		on_stack.delete(v);
	}

	graph.forEach((_, v) => {
		if (!visited.has(v)) {
			visit(v);
		}
	});

	return cycles[0];
}

class Component {
	
	
	
	__init() {this.ignore_stack = [];}

	
	
	
	
	
	
	
	
	

	
	
	
	

	__init2() {this.vars = [];}
	__init3() {this.var_lookup = new Map();}

	__init4() {this.imports = [];}

	__init5() {this.hoistable_nodes = new Set();}
	__init6() {this.node_for_declaration = new Map();}
	__init7() {this.partly_hoisted = [];}
	__init8() {this.fully_hoisted = [];}
	__init9() {this.reactive_declarations




 = [];}
	__init10() {this.reactive_declaration_nodes = new Set();}
	__init11() {this.has_reactive_assignments = false;}
	__init12() {this.injected_reactive_declaration_vars = new Set();}
	__init13() {this.helpers = new Map();}
	__init14() {this.globals = new Map();}

	__init15() {this.indirect_dependencies = new Map();}

	
	

	__init16() {this.elements = [];}
	

	__init17() {this.aliases = new Map();}
	__init18() {this.used_names = new Set();}
	__init19() {this.globally_used_names = new Set();}

	__init20() {this.slots = new Map();}
	__init21() {this.slot_outlets = new Set();}

	constructor(
		ast,
		source,
		name,
		compile_options,
		stats,
		warnings
	) {Component.prototype.__init.call(this);Component.prototype.__init2.call(this);Component.prototype.__init3.call(this);Component.prototype.__init4.call(this);Component.prototype.__init5.call(this);Component.prototype.__init6.call(this);Component.prototype.__init7.call(this);Component.prototype.__init8.call(this);Component.prototype.__init9.call(this);Component.prototype.__init10.call(this);Component.prototype.__init11.call(this);Component.prototype.__init12.call(this);Component.prototype.__init13.call(this);Component.prototype.__init14.call(this);Component.prototype.__init15.call(this);Component.prototype.__init16.call(this);Component.prototype.__init17.call(this);Component.prototype.__init18.call(this);Component.prototype.__init19.call(this);Component.prototype.__init20.call(this);Component.prototype.__init21.call(this);
		this.name = { type: 'Identifier', name };

		this.stats = stats;
		this.warnings = warnings;
		this.ast = ast;
		this.source = source;
		this.compile_options = compile_options;

		// the instance JS gets mutated, so we park
		// a copy here for later. TODO this feels gross
		this.original_ast = {
			html: ast.html,
			css: ast.css,
			instance: ast.instance && JSON.parse(JSON.stringify(ast.instance)),
			module: ast.module
		};

		this.file =
			compile_options.filename &&
			(typeof process !== 'undefined'
				? compile_options.filename
					.replace(process.cwd(), '')
					.replace(/^[/\\]/, '')
				: compile_options.filename);
		this.locate = getLocator(this.source, { offsetLine: 1 });

		// styles
		this.stylesheet = new Stylesheet({
			source,
			ast,
			filename: compile_options.filename,
			component_name: name,
			dev: compile_options.dev,
			get_css_hash: compile_options.cssHash
		});
		this.stylesheet.validate(this);

		this.component_options = process_component_options(
			this,
			this.ast.html.children
		);
		this.namespace =
			namespaces[this.component_options.namespace] ||
			this.component_options.namespace;

		if (compile_options.customElement) {
			if (
				this.component_options.tag === undefined &&
				compile_options.tag === undefined
			) {
				const svelteOptions = ast.html.children.find(
					child => child.name === 'svelte:options'
				) || { start: 0, end: 0 };
				this.warn(svelteOptions, {
					code: 'custom-element-no-tag',
					message: 'No custom element \'tag\' option was specified. To automatically register a custom element, specify a name with a hyphen in it, e.g. <svelte:options tag="my-thing"/>. To hide this warning, use <svelte:options tag={null}/>'
				});
			}
			this.tag = this.component_options.tag || compile_options.tag;
		} else {
			this.tag = this.name.name;
		}

		this.walk_module_js();
		this.walk_instance_js_pre_template();

		this.fragment = new Fragment(this, ast.html);
		this.name = this.get_unique_name(name);

		this.walk_instance_js_post_template();

		this.elements.forEach(element => this.stylesheet.apply(element));
		if (!compile_options.customElement) this.stylesheet.reify();
		this.stylesheet.warn_on_unused_selectors(this);
	}

	add_var(variable) {
		this.vars.push(variable);
		this.var_lookup.set(variable.name, variable);
	}

	add_reference(name) {
		const variable = this.var_lookup.get(name);

		if (variable) {
			variable.referenced = true;
		} else if (is_reserved_keyword(name)) {
			this.add_var({
				name,
				injected: true,
				referenced: true
			});
		} else if (name[0] === '$') {
			this.add_var({
				name,
				injected: true,
				referenced: true,
				mutated: true,
				writable: true
			});

			const subscribable_name = name.slice(1);

			const variable = this.var_lookup.get(subscribable_name);
			if (variable) {
				variable.referenced = true;
				variable.subscribable = true;
			}
		} else {
			this.used_names.add(name);
		}
	}

	alias(name) {
		if (!this.aliases.has(name)) {
			this.aliases.set(name, this.get_unique_name(name));
		}

		return this.aliases.get(name);
	}

	apply_stylesheet(element) {
		this.elements.push(element);
	}

	global(name) {
		const alias = this.alias(name);
		this.globals.set(name, alias);
		return alias;
	}

	generate(result) {
		let js = null;
		let css = null;

		if (result) {
			const { compile_options, name } = this;
			const { format = 'esm' } = compile_options;

			const banner = `${this.file ? `${this.file} ` : ''}generated by Svelte v${'3.35.0'}`;

			const program = { type: 'Program', body: result.js };

			walk(program, {
				enter: (node, parent, key) => {
					if (node.type === 'Identifier') {
						if (node.name[0] === '@') {
							if (node.name[1] === '_') {
								const alias = this.global(node.name.slice(2));
								node.name = alias.name;
							} else {
								let name = node.name.slice(1);

								if (compile_options.dev) {
									if (internal_exports.has(`${name}_dev`)) {
										name += '_dev';
									} else if (internal_exports.has(`${name}Dev`)) {
										name += 'Dev';
									}
								}

								const alias = this.alias(name);
								this.helpers.set(name, alias);
								node.name = alias.name;
							}
						} else if (node.name[0] !== '#' && !is_valid(node.name)) {
							// this hack allows x`foo.${bar}` where bar could be invalid
							const literal = { type: 'Literal', value: node.name };

							if (parent.type === 'Property' && key === 'key') {
								parent.key = literal;
							} else if (parent.type === 'MemberExpression' && key === 'property') {
								parent.property = literal;
								parent.computed = true;
							}
						}
					}
				}
			});

			const referenced_globals = Array.from(
				this.globals,
				([name, alias]) => name !== alias.name && { name, alias }
			).filter(Boolean);
			if (referenced_globals.length) {
				this.helpers.set('globals', this.alias('globals'));
			}
			const imported_helpers = Array.from(this.helpers, ([name, alias]) => ({
				name,
				alias
			}));

			create_module(
				program,
				format,
				name,
				banner,
				compile_options.sveltePath,
				imported_helpers,
				referenced_globals,
				this.imports,
				this.vars
					.filter(variable => variable.module && variable.export_name)
					.map(variable => ({
						name: variable.name,
						as: variable.export_name
					}))
			);

			css = compile_options.customElement
				? { code: null, map: null }
				: result.css;

			js = print(program, {
				sourceMapSource: compile_options.filename
			});

			js.map.sources = [
				compile_options.filename ? get_relative_path(compile_options.outputFilename || '', compile_options.filename) : null
			];

			js.map.sourcesContent = [
				this.source
			];

			js.map = apply_preprocessor_sourcemap(this.file, js.map, compile_options.sourcemap );
		}

		return {
			js,
			css,
			ast: this.original_ast,
			warnings: this.warnings,
			vars: this.vars
				.filter(v => !v.global && !v.internal)
				.map(v => ({
					name: v.name,
					export_name: v.export_name || null,
					injected: v.injected || false,
					module: v.module || false,
					mutated: v.mutated || false,
					reassigned: v.reassigned || false,
					referenced: v.referenced || false,
					writable: v.writable || false,
					referenced_from_script: v.referenced_from_script || false
				})),
			stats: this.stats.render()
		};
	}

	get_unique_name(name, scope) {
		if (test) name = `${name}$`;
		let alias = name;
		for (
			let i = 1;
			reserved.has(alias) ||
			this.var_lookup.has(alias) ||
			this.used_names.has(alias) ||
			this.globally_used_names.has(alias) ||
			(scope && scope.has(alias));
			alias = `${name}_${i++}`
		);
		this.used_names.add(alias);
		return { type: 'Identifier', name: alias };
	}

	get_unique_name_maker() {
		const local_used_names = new Set();

		function add(name) {
			local_used_names.add(name);
		}

		reserved.forEach(add);
		internal_exports.forEach(add);
		this.var_lookup.forEach((_value, key) => add(key));

		return (name) => {
			if (test) name = `${name}$`;
			let alias = name;
			for (
				let i = 1;
				this.used_names.has(alias) || local_used_names.has(alias);
				alias = `${name}_${i++}`
			);
			local_used_names.add(alias);
			this.globally_used_names.add(alias);

			return {
				type: 'Identifier',
				name: alias
			};
		};
	}

	error(
		pos


,
		e



	) {
		error(e.message, {
			name: 'ValidationError',
			code: e.code,
			source: this.source,
			start: pos.start,
			end: pos.end,
			filename: this.compile_options.filename
		});
	}

	warn(
		pos


,
		warning



	) {
		if (this.ignores && this.ignores.has(warning.code)) {
			return;
		}

		const start = this.locate(pos.start);
		const end = this.locate(pos.end);

		const frame = get_code_frame(this.source, start.line - 1, start.column);

		this.warnings.push({
			code: warning.code,
			message: warning.message,
			frame,
			start,
			end,
			pos: pos.start,
			filename: this.compile_options.filename,
			toString: () =>
				`${warning.message} (${start.line}:${start.column})\n${frame}`
		});
	}

	extract_imports(node) {
		this.imports.push(node);
	}

	extract_exports(node) {
		if (node.type === 'ExportDefaultDeclaration') {
			this.error(node, {
				code: 'default-export',
				message: 'A component cannot have a default export'
			});
		}

		if (node.type === 'ExportNamedDeclaration') {
			if (node.source) {
				this.error(node, {
					code: 'not-implemented',
					message: 'A component currently cannot have an export ... from'
				});
			}
			if (node.declaration) {
				if (node.declaration.type === 'VariableDeclaration') {
					node.declaration.declarations.forEach(declarator => {
						extract_names(declarator.id).forEach(name => {
							const variable = this.var_lookup.get(name);
							variable.export_name = name;
							if (variable.writable && !(variable.referenced || variable.referenced_from_script || variable.subscribable)) {
								this.warn(declarator, {
									code: 'unused-export-let',
									message: `${this.name.name} has unused export property '${name}'. If it is for external reference only, please consider using \`export const ${name}\``
								});
							}
						});
					});
				} else {
					const { name } = node.declaration.id;

					const variable = this.var_lookup.get(name);
					variable.export_name = name;
				}

				return node.declaration;
			} else {
				node.specifiers.forEach(specifier => {
					const variable = this.var_lookup.get(specifier.local.name);

					if (variable) {
						variable.export_name = specifier.exported.name;

						if (variable.writable && !(variable.referenced || variable.referenced_from_script || variable.subscribable)) {
							this.warn(specifier, {
								code: 'unused-export-let',
								message: `${this.name.name} has unused export property '${specifier.exported.name}'. If it is for external reference only, please consider using \`export const ${specifier.exported.name}\``
							});
						}
					}
				});

				return null;
			}
		}
	}

	extract_javascript(script) {
		if (!script) return null;

		return script.content.body.filter(node => {
			if (!node) return false;
			if (this.hoistable_nodes.has(node)) return false;
			if (this.reactive_declaration_nodes.has(node)) return false;
			if (node.type === 'ImportDeclaration') return false;
			if (node.type === 'ExportDeclaration' && node.specifiers.length > 0) return false;
			return true;
		});
	}

	walk_module_js() {
		const component = this;
		const script = this.ast.module;
		if (!script) return;

		walk(script.content, {
			enter(node) {
				if (node.type === 'LabeledStatement' && node.label.name === '$') {
					component.warn(node , {
						code: 'module-script-reactive-declaration',
						message: '$: has no effect in a module script'
					});
				}
			}
		});

		const { scope, globals } = create_scopes(script.content);
		this.module_scope = scope;

		scope.declarations.forEach((node, name) => {
			if (name[0] === '$') {
				this.error(node , {
					code: 'illegal-declaration',
					message: 'The $ prefix is reserved, and cannot be used for variable and import names'
				});
			}

			const writable = node.type === 'VariableDeclaration' && (node.kind === 'var' || node.kind === 'let');

			this.add_var({
				name,
				module: true,
				hoistable: true,
				writable
			});
		});

		globals.forEach((node, name) => {
			if (name[0] === '$') {
				this.error(node , {
					code: 'illegal-subscription',
					message: 'Cannot reference store value inside <script context="module">'
				});
			} else {
				this.add_var({
					name,
					global: true,
					hoistable: true
				});
			}
		});

		const { body } = script.content;
		let i = body.length;
		while (--i >= 0) {
			const node = body[i];
			if (node.type === 'ImportDeclaration') {
				this.extract_imports(node);
				body.splice(i, 1);
			}

			if (/^Export/.test(node.type)) {
				const replacement = this.extract_exports(node);
				if (replacement) {
					body[i] = replacement;
				} else {
					body.splice(i, 1);
				}
			}
		}
	}

	walk_instance_js_pre_template() {
		const script = this.ast.instance;
		if (!script) return;

		// inject vars for reactive declarations
		script.content.body.forEach(node => {
			if (node.type !== 'LabeledStatement') return;
			if (node.body.type !== 'ExpressionStatement') return;

			const { expression } = node.body;
			if (expression.type !== 'AssignmentExpression') return;
			if (expression.left.type === 'MemberExpression') return;

			extract_names(expression.left).forEach(name => {
				if (!this.var_lookup.has(name) && name[0] !== '$') {
					this.injected_reactive_declaration_vars.add(name);
				}
			});
		});

		const { scope: instance_scope, map, globals } = create_scopes(
			script.content
		);
		this.instance_scope = instance_scope;
		this.instance_scope_map = map;

		instance_scope.declarations.forEach((node, name) => {
			if (name[0] === '$') {
				this.error(node , {
					code: 'illegal-declaration',
					message: 'The $ prefix is reserved, and cannot be used for variable and import names'
				});
			}

			const writable = node.type === 'VariableDeclaration' && (node.kind === 'var' || node.kind === 'let');
			const imported = node.type.startsWith('Import');

			this.add_var({
				name,
				initialised: instance_scope.initialised_declarations.has(name),
				writable,
				imported
			});

			this.node_for_declaration.set(name, node);
		});

		globals.forEach((node, name) => {
			if (this.var_lookup.has(name)) return;

			if (this.injected_reactive_declaration_vars.has(name)) {
				this.add_var({
					name,
					injected: true,
					writable: true,
					reassigned: true,
					initialised: true
				});
			} else if (is_reserved_keyword(name)) {
				this.add_var({
					name,
					injected: true
				});
			} else if (name[0] === '$') {
				if (name === '$' || name[1] === '$') {
					this.error(node , {
						code: 'illegal-global',
						message: `${name} is an illegal variable name`
					});
				}

				this.add_var({
					name,
					injected: true,
					mutated: true,
					writable: true
				});

				this.add_reference(name.slice(1));

				const variable = this.var_lookup.get(name.slice(1));
				if (variable) {
					variable.subscribable = true;
					variable.referenced_from_script = true;
				}
			} else {
				this.add_var({
					name,
					global: true,
					hoistable: true
				});
			}
		});

		this.track_references_and_mutations();
	}

	walk_instance_js_post_template() {
		const script = this.ast.instance;
		if (!script) return;

		this.post_template_walk();

		this.hoist_instance_declarations();
		this.extract_reactive_declarations();
	}

	post_template_walk() {
		const script = this.ast.instance;
		if (!script) return;

		const component = this;
		const { content } = script;
		const { instance_scope, instance_scope_map: map } = this;

		let scope = instance_scope;

		const to_remove = [];
		const remove = (parent, prop, index) => {
			to_remove.unshift([parent, prop, index]);
		};
		let scope_updated = false;

		let generator_count = 0;

		walk(content, {
			enter(node, parent, prop, index) {
				if ((node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression') && node.generator === true) {
					generator_count++;
				}

				if (map.has(node)) {
					scope = map.get(node);
				}

				if (node.type === 'ImportDeclaration') {
					component.extract_imports(node);
					// TODO: to use actual remove
					remove(parent, prop, index);
					return this.skip();
				}

				if (/^Export/.test(node.type)) {
					const replacement = component.extract_exports(node);
					if (replacement) {
						this.replace(replacement);
					} else {
						// TODO: to use actual remove
						remove(parent, prop, index);
					}
					return this.skip();
				}

				component.warn_on_undefined_store_value_references(node, parent, prop, scope);
			},

			leave(node) {
				if ((node.type === 'FunctionDeclaration' || node.type === 'FunctionExpression') && node.generator === true) {
					generator_count--;
				}

				// do it on leave, to prevent infinite loop
				if (component.compile_options.dev && component.compile_options.loopGuardTimeout > 0 && generator_count <= 0) {
					const to_replace_for_loop_protect = component.loop_protect(node, scope, component.compile_options.loopGuardTimeout);
					if (to_replace_for_loop_protect) {
						this.replace(to_replace_for_loop_protect);
						scope_updated = true;
					}
				}

				if (map.has(node)) {
					scope = scope.parent;
				}
			}
		});

		for (const [parent, prop, index] of to_remove) {
			if (parent) {
				if (index !== null) {
					parent[prop].splice(index, 1);
				} else {
					delete parent[prop];
				}
			}
		}

		if (scope_updated) {
			const { scope, map } = create_scopes(script.content);
			this.instance_scope = scope;
			this.instance_scope_map = map;
		}
	}

	track_references_and_mutations() {
		const script = this.ast.instance;
		if (!script) return;

		const component = this;
		const { content } = script;
		const { instance_scope, module_scope, instance_scope_map: map } = this;

		let scope = instance_scope;

		walk(content, {
			enter(node, parent) {
				if (map.has(node)) {
					scope = map.get(node);
				}

				if (node.type === 'AssignmentExpression' || node.type === 'UpdateExpression') {
					const assignee = node.type === 'AssignmentExpression' ? node.left : node.argument;
					const names = extract_names(assignee);

					const deep = assignee.type === 'MemberExpression';

					names.forEach(name => {
						const scope_owner = scope.find_owner(name);
						if (
							scope_owner !== null
								? scope_owner === instance_scope
								: module_scope && module_scope.has(name)
						) {
							const variable = component.var_lookup.get(name);
							variable[deep ? 'mutated' : 'reassigned'] = true;
						}
					});
				}

				if (is_used_as_reference(node, parent)) {
					const object = get_object(node);
					if (scope.find_owner(object.name) === instance_scope) {
						const variable = component.var_lookup.get(object.name);
						variable.referenced_from_script = true;
					}
				}
			},

			leave(node) {
				if (map.has(node)) {
					scope = scope.parent;
				}
			}
		});
	}

	warn_on_undefined_store_value_references(node, parent, prop, scope) {
		if (
			node.type === 'LabeledStatement' &&
			node.label.name === '$' &&
			parent.type !== 'Program'
		) {
			this.warn(node , {
				code: 'non-top-level-reactive-declaration',
				message: '$: has no effect outside of the top-level'
			});
		}

		if (isReference(node, parent)) {
			const object = get_object(node);
			const { name } = object;

			if (name[0] === '$') {
				if (!scope.has(name)) {
					this.warn_if_undefined(name, object, null);
				}

				if (name[1] !== '$' && scope.has(name.slice(1)) && scope.find_owner(name.slice(1)) !== this.instance_scope) {
					if (!((/Function/.test(parent.type) && prop === 'params') || (parent.type === 'VariableDeclarator' && prop === 'id'))) {
						this.error(node , {
							code: 'contextual-store',
							message: 'Stores must be declared at the top level of the component (this may change in a future version of Svelte)'
						});
					}
				}
			}
		}
	}

	loop_protect(node, scope, timeout) {
		if (node.type === 'WhileStatement' ||
			node.type === 'ForStatement' ||
			node.type === 'DoWhileStatement') {
			const guard = this.get_unique_name('guard', scope);
			this.used_names.add(guard.name);

			const before = b`const ${guard} = @loop_guard(${timeout})`;
			const inside = b`${guard}();`;

			// wrap expression statement with BlockStatement
			if (node.body.type !== 'BlockStatement') {
				node.body = {
					type: 'BlockStatement',
					body: [node.body]
				};
			}
			node.body.body.push(inside[0]);

			return {
				type: 'BlockStatement',
				body: [
					before[0],
					node
				]
			};
		}
		return null;
	}

	rewrite_props(get_insert) {
		if (!this.ast.instance) return;

		const component = this;
		const { instance_scope, instance_scope_map: map } = this;
		let scope = instance_scope;

		walk(this.ast.instance.content, {
			enter(node, parent, key, index) {
				if (/Function/.test(node.type)) {
					return this.skip();
				}

				if (map.has(node)) {
					scope = map.get(node);
				}

				if (node.type === 'VariableDeclaration') {
					if (node.kind === 'var' || scope === instance_scope) {
						node.declarations.forEach(declarator => {
							if (declarator.id.type !== 'Identifier') {
								const inserts = [];

								extract_names(declarator.id).forEach(name => {
									const variable = component.var_lookup.get(name);

									if (variable.export_name) {
										// TODO is this still true post-#3539?
										component.error(declarator , {
											code: 'destructured-prop',
											message: 'Cannot declare props in destructured declaration'
										});
									}

									if (variable.subscribable) {
										inserts.push(get_insert(variable));
									}
								});

								if (inserts.length) {
									parent[key].splice(index + 1, 0, ...inserts);
								}

								return;
							}

							const { name } = declarator.id;
							const variable = component.var_lookup.get(name);

							if (variable.export_name && variable.writable) {
								declarator.id = {
									type: 'ObjectPattern',
									properties: [{
										type: 'Property',
										method: false,
										shorthand: false,
										computed: false,
										kind: 'init',
										key: { type: 'Identifier', name: variable.export_name },
										value: declarator.init
											? {
												type: 'AssignmentPattern',
												left: declarator.id,
												right: declarator.init
											}
											: declarator.id
									}]
								};

								declarator.init = x`$$props`;
							}

							if (variable.subscribable && declarator.init) {
								const insert = get_insert(variable);
								parent[key].splice(index + 1, 0, ...insert);
							}
						});
					}
				}
			},

			leave(node, parent, _key, index) {
				if (map.has(node)) {
					scope = scope.parent;
				}

				if (node.type === 'ExportNamedDeclaration' && node.declaration) {
					(parent ).body[index] = node.declaration;
				}
			}
		});
	}

	hoist_instance_declarations() {
		// we can safely hoist variable declarations that are
		// initialised to literals, and functions that don't
		// reference instance variables other than other
		// hoistable functions. TODO others?

		const {
			hoistable_nodes,
			var_lookup,
			injected_reactive_declaration_vars,
			imports
		} = this;

		const top_level_function_declarations = new Map();

		const { body } = this.ast.instance.content;

		for (let i = 0; i < body.length; i += 1) {
			const node = body[i];

			if (node.type === 'VariableDeclaration') {
				const all_hoistable = node.declarations.every(d => {
					if (!d.init) return false;
					if (d.init.type !== 'Literal') return false;

					// everything except const values can be changed by e.g. svelte devtools
					// which means we can't hoist it
					if (node.kind !== 'const' && this.compile_options.dev) return false;

					const { name } = d.id ;

					const v = this.var_lookup.get(name);
					if (v.reassigned) return false;
					if (v.export_name) return false;

					if (this.var_lookup.get(name).reassigned) return false;
					if (
						this.vars.find(
							variable => variable.name === name && variable.module
						)
					) {
						return false;
					}

					return true;
				});

				if (all_hoistable) {
					node.declarations.forEach(d => {
						const variable = this.var_lookup.get((d.id ).name);
						variable.hoistable = true;
					});

					hoistable_nodes.add(node);

					body.splice(i--, 1);
					this.fully_hoisted.push(node);
				}
			}

			if (
				node.type === 'ExportNamedDeclaration' &&
				node.declaration &&
				node.declaration.type === 'FunctionDeclaration'
			) {
				top_level_function_declarations.set(node.declaration.id.name, node);
			}

			if (node.type === 'FunctionDeclaration') {
				top_level_function_declarations.set(node.id.name, node);
			}
		}

		const checked = new Set();
		const walking = new Set();

		const is_hoistable = fn_declaration => {
			if (fn_declaration.type === 'ExportNamedDeclaration') {
				fn_declaration = fn_declaration.declaration;
			}

			const instance_scope = this.instance_scope;
			let scope = this.instance_scope;
			const map = this.instance_scope_map;

			let hoistable = true;

			// handle cycles
			walking.add(fn_declaration);

			walk(fn_declaration, {
				enter(node, parent) {
					if (!hoistable) return this.skip();

					if (map.has(node)) {
						scope = map.get(node);
					}

					if (isReference(node , parent )) {
						const { name } = flatten_reference(node);
						const owner = scope.find_owner(name);

						if (injected_reactive_declaration_vars.has(name)) {
							hoistable = false;
						} else if (name[0] === '$' && !owner) {
							hoistable = false;
						} else if (owner === instance_scope) {
							const variable = var_lookup.get(name);

							if (variable.reassigned || variable.mutated) hoistable = false;

							if (name === fn_declaration.id.name) return;

							if (variable.hoistable) return;

							if (top_level_function_declarations.has(name)) {
								const other_declaration = top_level_function_declarations.get(
									name
								);

								if (walking.has(other_declaration)) {
									hoistable = false;
								} else if (
									other_declaration.type === 'ExportNamedDeclaration' &&
									walking.has(other_declaration.declaration)
								) {
									hoistable = false;
								} else if (!is_hoistable(other_declaration)) {
									hoistable = false;
								}
							} else {
								hoistable = false;
							}
						}

						this.skip();
					}
				},

				leave(node) {
					if (map.has(node)) {
						scope = scope.parent;
					}
				}
			});

			checked.add(fn_declaration);
			walking.delete(fn_declaration);

			return hoistable;
		};

		for (const [name, node] of top_level_function_declarations) {
			if (is_hoistable(node)) {
				const variable = this.var_lookup.get(name);
				variable.hoistable = true;
				hoistable_nodes.add(node);

				const i = body.indexOf(node);
				body.splice(i, 1);
				this.fully_hoisted.push(node);
			}
		}

		for (const { specifiers } of imports) {
			for (const specifier of specifiers) {
				const variable = var_lookup.get(specifier.local.name);

				if (!variable.mutated || variable.subscribable) {
					variable.hoistable = true;
				}
			}
		}
	}

	extract_reactive_declarations() {
		const component = this;

		const unsorted_reactive_declarations




 = [];

		this.ast.instance.content.body.forEach(node => {
			if (node.type === 'LabeledStatement' && node.label.name === '$') {
				this.reactive_declaration_nodes.add(node);

				const assignees = new Set();
				const assignee_nodes = new Set();
				const dependencies = new Set();

				let scope = this.instance_scope;
				const map = this.instance_scope_map;

				walk(node.body, {
					enter(node, parent) {
						if (map.has(node)) {
							scope = map.get(node);
						}

						if (node.type === 'AssignmentExpression') {
							const left = get_object(node.left);

							extract_identifiers(left).forEach(node => {
								assignee_nodes.add(node);
								assignees.add(node.name);
							});

							if (node.operator !== '=') {
								dependencies.add(left.name);
							}
						} else if (node.type === 'UpdateExpression') {
							const identifier = get_object(node.argument);
							assignees.add(identifier.name);
						} else if (isReference(node , parent )) {
							const identifier = get_object(node);
							if (!assignee_nodes.has(identifier)) {
								const { name } = identifier;
								const owner = scope.find_owner(name);
								const variable = component.var_lookup.get(name);
								let should_add_as_dependency = true;

								if (variable) {
									variable.is_reactive_dependency = true;
									if (variable.module) {
										should_add_as_dependency = false;
										component.warn(node , {
											code: 'module-script-reactive-declaration',
											message: `"${name}" is declared in a module script and will not be reactive`
										});
									}
								}
								const is_writable_or_mutated =
									variable && (variable.writable || variable.mutated);
								if (
									should_add_as_dependency &&
									(!owner || owner === component.instance_scope) &&
									(name[0] === '$' || is_writable_or_mutated)
								) {
									dependencies.add(name);
								}
							}

							this.skip();
						}
					},

					leave(node) {
						if (map.has(node)) {
							scope = scope.parent;
						}
					}
				});

				const { expression } = node.body ;
				const declaration = expression && (expression ).left;

				unsorted_reactive_declarations.push({
					assignees,
					dependencies,
					node,
					declaration
				});
			}
		});

		const lookup = new Map();

		unsorted_reactive_declarations.forEach(declaration => {
			declaration.assignees.forEach(name => {
				if (!lookup.has(name)) {
					lookup.set(name, []);
				}

				// TODO warn or error if a name is assigned to in
				// multiple reactive declarations?
				lookup.get(name).push(declaration);
			});
		});

		const cycle = check_graph_for_cycles(unsorted_reactive_declarations.reduce((acc, declaration) => {
			declaration.assignees.forEach(v => {
				declaration.dependencies.forEach(w => {
					if (!declaration.assignees.has(w)) {
						acc.push([v, w]);
					}
				});
			});
			return acc;
		}, []));

		if (cycle && cycle.length) {
			const declarationList = lookup.get(cycle[0]);
			const declaration = declarationList[0];
			this.error(declaration.node, {
				code: 'cyclical-reactive-declaration',
				message: `Cyclical dependency detected: ${cycle.join(' → ')}`
			});
		}

		const add_declaration = declaration => {
			if (this.reactive_declarations.includes(declaration)) return;

			declaration.dependencies.forEach(name => {
				if (declaration.assignees.has(name)) return;
				const earlier_declarations = lookup.get(name);
				if (earlier_declarations) {
					earlier_declarations.forEach(add_declaration);
				}
			});

			this.reactive_declarations.push(declaration);
		};

		unsorted_reactive_declarations.forEach(add_declaration);
	}

	warn_if_undefined(name, node, template_scope) {
		if (name[0] === '$') {
			if (name === '$' || name[1] === '$' && !is_reserved_keyword(name)) {
				this.error(node, {
					code: 'illegal-global',
					message: `${name} is an illegal variable name`
				});
			}

			this.has_reactive_assignments = true; // TODO does this belong here?

			if (is_reserved_keyword(name)) return;

			name = name.slice(1);
		}

		if (this.var_lookup.has(name) && !this.var_lookup.get(name).global) return;
		if (template_scope && template_scope.names.has(name)) return;
		if (globals.has(name) && node.type !== 'InlineComponent') return;

		let message = `'${name}' is not defined`;
		if (!this.ast.instance) {
			message += `. Consider adding a <script> block with 'export let ${name}' to declare a prop`;
		}

		this.warn(node, {
			code: 'missing-declaration',
			message
		});
	}

	push_ignores(ignores) {
		this.ignores = new Set(this.ignores || []);
		add_to_set(this.ignores, ignores);
		this.ignore_stack.push(this.ignores);
	}

	pop_ignores() {
		this.ignore_stack.pop();
		this.ignores = this.ignore_stack[this.ignore_stack.length - 1];
	}
}

function process_component_options(component, nodes) {
	const component_options = {
		immutable: component.compile_options.immutable || false,
		accessors:
			'accessors' in component.compile_options
				? component.compile_options.accessors
				: !!component.compile_options.customElement,
		preserveWhitespace: !!component.compile_options.preserveWhitespace,
		namespace: component.compile_options.namespace
	};

	const node = nodes.find(node => node.name === 'svelte:options');

	function get_value(attribute, code, message) {
		const { value } = attribute;
		const chunk = value[0];

		if (!chunk) return true;

		if (value.length > 1) {
			component.error(attribute, { code, message });
		}

		if (chunk.type === 'Text') return chunk.data;

		if (chunk.expression.type !== 'Literal') {
			component.error(attribute, { code, message });
		}

		return chunk.expression.value;
	}

	if (node) {
		node.attributes.forEach(attribute => {
			if (attribute.type === 'Attribute') {
				const { name } = attribute;

				switch (name) {
					case 'tag': {
						const code = 'invalid-tag-attribute';
						const message = "'tag' must be a string literal";
						const tag = get_value(attribute, code, message);

						if (typeof tag !== 'string' && tag !== null) {
							component.error(attribute, { code, message });
						}

						if (tag && !/^[a-zA-Z][a-zA-Z0-9]*-[a-zA-Z0-9-]+$/.test(tag)) {
							component.error(attribute, {
								code: 'invalid-tag-property',
								message: "tag name must be two or more words joined by the '-' character"
							});
						}

						if (tag && !component.compile_options.customElement) {
							component.warn(attribute, {
								code: 'missing-custom-element-compile-options',
								message: "The 'tag' option is used when generating a custom element. Did you forget the 'customElement: true' compile option?"
							});
						}

						component_options.tag = tag;
						break;
					}

					case 'namespace': {
						const code = 'invalid-namespace-attribute';
						const message = "The 'namespace' attribute must be a string literal representing a valid namespace";
						const ns = get_value(attribute, code, message);

						if (typeof ns !== 'string') {
							component.error(attribute, { code, message });
						}

						if (valid_namespaces.indexOf(ns) === -1) {
							const match = fuzzymatch(ns, valid_namespaces);
							if (match) {
								component.error(attribute, {
									code: 'invalid-namespace-property',
									message: `Invalid namespace '${ns}' (did you mean '${match}'?)`
								});
							} else {
								component.error(attribute, {
									code: 'invalid-namespace-property',
									message: `Invalid namespace '${ns}'`
								});
							}
						}

						component_options.namespace = ns;
						break;
					}

					case 'accessors':
					case 'immutable':
					case 'preserveWhitespace': {
						const code = `invalid-${name}-value`;
						const message = `${name} attribute must be true or false`;
						const value = get_value(attribute, code, message);

						if (typeof value !== 'boolean') {
							component.error(attribute, { code, message });
						}

						component_options[name] = value;
						break;
					}

					default:
						component.error(attribute, {
							code: 'invalid-options-attribute',
							message: '<svelte:options> unknown attribute'
						});
				}
			} else {
				component.error(attribute, {
					code: 'invalid-options-attribute',
					message: "<svelte:options> can only have static 'tag', 'namespace', 'accessors', 'immutable' and 'preserveWhitespace' attributes"
				});
			}
		});
	}

	return component_options;
}

function get_relative_path(from, to) {
	const from_parts = from.split(/[/\\]/);
	const to_parts = to.split(/[/\\]/);

	from_parts.pop(); // get dirname

	while (from_parts[0] === to_parts[0]) {
		from_parts.shift();
		to_parts.shift();
	}

	if (from_parts.length) {
		let i = from_parts.length;
		while (i--) from_parts[i] = '..';
	}

	return from_parts.concat(to_parts).join('/');
}

function get_name_from_filename(filename) {
	if (!filename) return null;

	const parts = filename.split(/[/\\]/).map(encodeURI);

	if (parts.length > 1) {
		const index_match = parts[parts.length - 1].match(/^index(\.\w+)/);
		if (index_match) {
			parts.pop();
			parts[parts.length - 1] += index_match[1];
		}
	}

	const base = parts.pop()
		.replace(/%/g, 'u')
		.replace(/\.[^.]+$/, '')
		.replace(/[^a-zA-Z_$0-9]+/g, '_')
		.replace(/^_/, '')
		.replace(/_$/, '')
		.replace(/^(\d)/, '_$1');

	if (!base) {
		throw new Error(`Could not derive component name from file ${filename}`);
	}

	return base[0].toUpperCase() + base.slice(1);
}

const valid_options = [
	'format',
	'name',
	'filename',
	'sourcemap',
	'generate',
	'outputFilename',
	'cssOutputFilename',
	'sveltePath',
	'dev',
	'accessors',
	'immutable',
	'hydratable',
	'legacy',
	'customElement',
	'namespace',
	'tag',
	'css',
	'loopGuardTimeout',
	'preserveComments',
	'preserveWhitespace',
	'cssHash'
];

function validate_options(options, warnings) {
	const { name, filename, loopGuardTimeout, dev, namespace } = options;

	Object.keys(options).forEach(key => {
		if (!valid_options.includes(key)) {
			const match = fuzzymatch(key, valid_options);
			let message = `Unrecognized option '${key}'`;
			if (match) message += ` (did you mean '${match}'?)`;

			throw new Error(message);
		}
	});

	if (name && !/^[a-zA-Z_$][a-zA-Z_$0-9]*$/.test(name)) {
		throw new Error(`options.name must be a valid identifier (got '${name}')`);
	}

	if (name && /^[a-z]/.test(name)) {
		const message = 'options.name should be capitalised';
		warnings.push({
			code: 'options-lowercase-name',
			message,
			filename,
			toString: () => message
		});
	}

	if (loopGuardTimeout && !dev) {
		const message = 'options.loopGuardTimeout is for options.dev = true only';
		warnings.push({
			code: 'options-loop-guard-timeout',
			message,
			filename,
			toString: () => message
		});
	}

	if (namespace && valid_namespaces.indexOf(namespace) === -1) {
		const match = fuzzymatch(namespace, valid_namespaces);
		if (match) {
			throw new Error(`Invalid namespace '${namespace}' (did you mean '${match}'?)`);
		} else {
			throw new Error(`Invalid namespace '${namespace}'`);
		}
	}
}

function compile(source, options = {}) {
	options = Object.assign({ generate: 'dom', dev: false }, options);

	const stats = new Stats();
	const warnings = [];

	validate_options(options, warnings);

	stats.start('parse');
	const ast = parse$1(source, options);
	stats.stop('parse');

	stats.start('create component');
	const component = new Component(
		ast,
		source,
		options.name || get_name_from_filename(options.filename) || 'Component',
		options,
		stats,
		warnings
	);
	stats.stop('create component');

	const result = options.generate === false
		? null
		: options.generate === 'ssr'
			? ssr(component, options)
			: dom(component, options);

	return component.generate(result);
}

/**
 * Import decoded sourcemap from mozilla/source-map/SourceMapGenerator
 * Forked from source-map/lib/source-map-generator.js
 * from methods _serializeMappings and toJSON.
 * We cannot use source-map.d.ts types, because we access hidden properties.
 */
function decoded_sourcemap_from_generator(generator) {
	let previous_generated_line = 1;
	const converted_mappings = [[]];
	let result_line;
	let result_segment;
	let mapping;

	const source_idx = generator._sources.toArray()
		.reduce((acc, val, idx) => (acc[val] = idx, acc), {});

	const name_idx = generator._names.toArray()
		.reduce((acc, val, idx) => (acc[val] = idx, acc), {});

	const mappings = generator._mappings.toArray();
	result_line = converted_mappings[0];

	for (let i = 0, len = mappings.length; i < len; i++) {
		mapping = mappings[i];

		if (mapping.generatedLine > previous_generated_line) {
			while (mapping.generatedLine > previous_generated_line) {
				converted_mappings.push([]);
				previous_generated_line++;
			}
			result_line = converted_mappings[mapping.generatedLine - 1]; // line is one-based
		} else if (i > 0) {
			const previous_mapping = mappings[i - 1];
			if (
				// sorted by selectivity
				mapping.generatedColumn === previous_mapping.generatedColumn &&
				mapping.originalColumn === previous_mapping.originalColumn &&
				mapping.name === previous_mapping.name &&
				mapping.generatedLine === previous_mapping.generatedLine &&
				mapping.originalLine === previous_mapping.originalLine &&
				mapping.source === previous_mapping.source
		) {
				continue;
			}
		}
		result_line.push([mapping.generatedColumn]);
		result_segment = result_line[result_line.length - 1];

		if (mapping.source != null) {
			result_segment.push(...[
				source_idx[mapping.source],
				mapping.originalLine - 1, // line is one-based
				mapping.originalColumn
			]);
			if (mapping.name != null) {
				result_segment.push(name_idx[mapping.name]);
			}
		}
	}

	const map = {
		version: generator._version,
		sources: generator._sources.toArray(),
		names: generator._names.toArray(),
		mappings: converted_mappings
	};
	if (generator._file != null) {
		(map ).file = generator._file;
	}
	// not needed: map.sourcesContent and map.sourceRoot
	return map;
}

function decode_map(processed) {
	let decoded_map = typeof processed.map === 'string' ? JSON.parse(processed.map) : processed.map;
	if (typeof(decoded_map.mappings) === 'string') {
		decoded_map.mappings = decode(decoded_map.mappings);
	}
	if ((decoded_map )._mappings && decoded_map.constructor.name === 'SourceMapGenerator') {
		// import decoded sourcemap from mozilla/source-map/SourceMapGenerator
		decoded_map = decoded_sourcemap_from_generator(decoded_map);
	}

	return decoded_map;
}

function slice_source(
	code_slice,
	offset,
	{ file_basename, filename, get_location }
) {
	return {
		source: code_slice,
		get_location: (index) => get_location(index + offset),
		file_basename,
		filename
	};
}

function calculate_replacements(
	re,
	get_replacement,
	source
) {
	const replacements = [];

	source.replace(re, (...match) => {
		replacements.push(
			get_replacement(...match).then(
				replacement => {
					const matched_string = match[0];
					const offset = match[match.length-2];

					return ({ offset, length: matched_string.length, replacement });
				}
			)
		);
		return '';
	});

	return Promise.all(replacements);
}

function perform_replacements(
	replacements,
	source
) {
	const out = new MappedCode();
	let last_end = 0;

	for (const { offset, length, replacement } of replacements) {
		const unchanged_prefix = MappedCode.from_source(
			slice_source(source.source.slice(last_end, offset), last_end, source)
		);
		out.concat(unchanged_prefix).concat(replacement);
		last_end = offset + length;
	}

	const unchanged_suffix = MappedCode.from_source(slice_source(source.source.slice(last_end), last_end, source));

	return out.concat(unchanged_suffix);
}

async function replace_in_code(
	regex,
	get_replacement,
	location
) {
	const replacements = await calculate_replacements(regex, get_replacement, location.source);

	return perform_replacements(replacements, location);
}

function _nullishCoalesce(lhs, rhsFn) { if (lhs != null) { return lhs; } else { return rhsFn(); } }








function get_file_basename(filename) {
	return filename.split(/[/\\]/).pop();
}

/**
 * Represents intermediate states of the preprocessing.
 */
class PreprocessResult  {
	// sourcemap_list is sorted in reverse order from last map (index 0) to first map (index -1)
	// so we use sourcemap_list.unshift() to add new maps
	// https://github.com/ampproject/remapping#multiple-transformations-of-a-file
	__init() {this.sourcemap_list = [];}
	__init2() {this.dependencies = [];}
	

	

	constructor( source,  filename) {this.source = source;this.filename = filename;PreprocessResult.prototype.__init.call(this);PreprocessResult.prototype.__init2.call(this);
		this.update_source({ string: source });

		// preprocess source must be relative to itself or equal null
		this.file_basename = filename == null ? null : get_file_basename(filename);
	}

	update_source({ string: source, map, dependencies }) {
		if (source != null) {
			this.source = source;
			this.get_location = getLocator(source);
		}

		if (map) {
			this.sourcemap_list.unshift(map);
		}

		if (dependencies) {
			this.dependencies.push(...dependencies);
		}
	}

	to_processed() {
		// Combine all the source maps for each preprocessor function into one
		const map = combine_sourcemaps(this.file_basename, this.sourcemap_list);

		return {
			// TODO return separated output, in future version where svelte.compile supports it:
			// style: { code: styleCode, map: styleMap },
			// script { code: scriptCode, map: scriptMap },
			// markup { code: markupCode, map: markupMap },

			code: this.source,
			dependencies: [...new Set(this.dependencies)],
			map: map ,
			toString: () => this.source
		};
	}
}

/**
 * Convert preprocessor output for the tag content into MappedCode
 */
function processed_content_to_code(processed, location, file_basename) {
	// Convert the preprocessed code and its sourcemap to a MappedCode
	let decoded_map;
	if (processed.map) {
		decoded_map = decode_map(processed);

		// offset only segments pointing at original component source
		const source_index = decoded_map.sources.indexOf(file_basename);
		if (source_index !== -1) {
			sourcemap_add_offset(decoded_map, location, source_index);
		}
	}

	return MappedCode.from_processed(processed.code, decoded_map);
}

/**
 * Given the whole tag including content, return a `MappedCode`
 * representing the tag content replaced with `processed`.
 */
function processed_tag_to_code(
	processed,
	tag_name,
	attributes,
	source
) {
	const { file_basename, get_location } = source;

	const build_mapped_code = (code, offset) =>
		MappedCode.from_source(slice_source(code, offset, source));

	const tag_open = `<${tag_name}${attributes || ''}>`;
	const tag_close = `</${tag_name}>`;

	const tag_open_code = build_mapped_code(tag_open, 0);
	const tag_close_code = build_mapped_code(tag_close, tag_open.length + source.source.length);

	parse_attached_sourcemap(processed, tag_name);

	const content_code = processed_content_to_code(processed, get_location(tag_open.length), file_basename);

	return tag_open_code.concat(content_code).concat(tag_close_code);
}

function parse_tag_attributes(str) {
	// note: won't work with attribute values containing spaces.
	return str
		.split(/\s+/)
		.filter(Boolean)
		.reduce((attrs, attr) => {
			const i = attr.indexOf('=');
			const [key, value] = i > 0 ? [attr.slice(0, i), attr.slice(i+1)] : [attr];
			const [, unquoted] = (value && value.match(/^['"](.*)['"]$/)) || [];

			return { ...attrs, [key]: _nullishCoalesce(_nullishCoalesce(unquoted, () => ( value)), () => ( true)) };
		}, {});
}

/**
 * Calculate the updates required to process all instances of the specified tag.
 */
async function process_tag(
	tag_name,
	preprocessor,
	source
) {
	const { filename } = source;
	const tag_regex =
		tag_name === 'style'
			? /<!--[^]*?-->|<style(\s[^]*?)?(?:>([^]*?)<\/style>|\/>)/gi
			: /<!--[^]*?-->|<script(\s[^]*?)?(?:>([^]*?)<\/script>|\/>)/gi;

	const dependencies = [];

	async function process_single_tag(
		tag_with_content,
		attributes = '',
		content = '',
		tag_offset
	) {
		const no_change = () => MappedCode.from_source(slice_source(tag_with_content, tag_offset, source));

		if (!attributes && !content) return no_change();

		const processed = await preprocessor({
			content: content || '',
			attributes: parse_tag_attributes(attributes || ''),
			filename
		});

		if (!processed) return no_change();
		if (processed.dependencies) dependencies.push(...processed.dependencies);
		if (!processed.map && processed.code === content) return no_change();

		return processed_tag_to_code(processed, tag_name, attributes, slice_source(content, tag_offset, source));
	}

	const { string, map } = await replace_in_code(tag_regex, process_single_tag, source);

	return { string, map, dependencies };
}

async function process_markup(filename, process, source) {
	const processed = await process({
		content: source.source,
		filename
	});

	if (processed) {
		return {
			string: processed.code,
			map: processed.map
				? // TODO: can we use decode_sourcemap?
				  typeof processed.map === 'string'
					? JSON.parse(processed.map)
					: processed.map
				: undefined,
			dependencies: processed.dependencies
		};
	} else {
		return {};
	}
}

async function preprocess(
	source,
	preprocessor,
	options
) {
	// @ts-ignore todo: doublecheck
	const filename = (options && options.filename) || preprocessor.filename; // legacy

	const preprocessors = preprocessor ? (Array.isArray(preprocessor) ? preprocessor : [preprocessor]) : [];

	const markup = preprocessors.map(p => p.markup).filter(Boolean);
	const script = preprocessors.map(p => p.script).filter(Boolean);
	const style = preprocessors.map(p => p.style).filter(Boolean);

	const result = new PreprocessResult(source, filename);

	// TODO keep track: what preprocessor generated what sourcemap?
	// to make debugging easier = detect low-resolution sourcemaps in fn combine_mappings

	for (const process of markup) {
		result.update_source(await process_markup(filename, process, result));
	}

	for (const process of script) {
		result.update_source(await process_tag('script', process, result));
	}

	for (const preprocess of style) {
		result.update_source(await process_tag('style', preprocess, result));
	}

	return result.to_processed();
}

const VERSION = '3.35.0';

export { VERSION, compile, parse$1 as parse, preprocess, walk };
//# sourceMappingURL=compiler.mjs.map
