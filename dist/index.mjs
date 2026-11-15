import { createRequire as __reaCreateRequire } from 'node:module';
const require = __reaCreateRequire(import.meta.url);
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/source-map-js/lib/base64.js
var require_base64 = __commonJS({
  "node_modules/source-map-js/lib/base64.js"(exports) {
    var intToCharMap = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/".split("");
    exports.encode = function(number) {
      if (0 <= number && number < intToCharMap.length) {
        return intToCharMap[number];
      }
      throw new TypeError("Must be between 0 and 63: " + number);
    };
    exports.decode = function(charCode) {
      var bigA = 65;
      var bigZ = 90;
      var littleA = 97;
      var littleZ = 122;
      var zero = 48;
      var nine = 57;
      var plus = 43;
      var slash = 47;
      var littleOffset = 26;
      var numberOffset = 52;
      if (bigA <= charCode && charCode <= bigZ) {
        return charCode - bigA;
      }
      if (littleA <= charCode && charCode <= littleZ) {
        return charCode - littleA + littleOffset;
      }
      if (zero <= charCode && charCode <= nine) {
        return charCode - zero + numberOffset;
      }
      if (charCode == plus) {
        return 62;
      }
      if (charCode == slash) {
        return 63;
      }
      return -1;
    };
  }
});

// node_modules/source-map-js/lib/base64-vlq.js
var require_base64_vlq = __commonJS({
  "node_modules/source-map-js/lib/base64-vlq.js"(exports) {
    var base64 = require_base64();
    var VLQ_BASE_SHIFT = 5;
    var VLQ_BASE = 1 << VLQ_BASE_SHIFT;
    var VLQ_BASE_MASK = VLQ_BASE - 1;
    var VLQ_CONTINUATION_BIT = VLQ_BASE;
    function toVLQSigned(aValue) {
      return aValue < 0 ? (-aValue << 1) + 1 : (aValue << 1) + 0;
    }
    function fromVLQSigned(aValue) {
      var isNegative = (aValue & 1) === 1;
      var shifted = aValue >> 1;
      return isNegative ? -shifted : shifted;
    }
    exports.encode = function base64VLQ_encode(aValue) {
      var encoded = "";
      var digit;
      var vlq = toVLQSigned(aValue);
      do {
        digit = vlq & VLQ_BASE_MASK;
        vlq >>>= VLQ_BASE_SHIFT;
        if (vlq > 0) {
          digit |= VLQ_CONTINUATION_BIT;
        }
        encoded += base64.encode(digit);
      } while (vlq > 0);
      return encoded;
    };
    exports.decode = function base64VLQ_decode(aStr, aIndex, aOutParam) {
      var strLen = aStr.length;
      var result = 0;
      var shift = 0;
      var continuation, digit;
      do {
        if (aIndex >= strLen) {
          throw new Error("Expected more digits in base 64 VLQ value.");
        }
        digit = base64.decode(aStr.charCodeAt(aIndex++));
        if (digit === -1) {
          throw new Error("Invalid base64 digit: " + aStr.charAt(aIndex - 1));
        }
        continuation = !!(digit & VLQ_CONTINUATION_BIT);
        digit &= VLQ_BASE_MASK;
        result = result + (digit << shift);
        shift += VLQ_BASE_SHIFT;
      } while (continuation);
      aOutParam.value = fromVLQSigned(result);
      aOutParam.rest = aIndex;
    };
  }
});

// node_modules/source-map-js/lib/util.js
var require_util = __commonJS({
  "node_modules/source-map-js/lib/util.js"(exports) {
    function getArg(aArgs, aName, aDefaultValue) {
      if (aName in aArgs) {
        return aArgs[aName];
      } else if (arguments.length === 3) {
        return aDefaultValue;
      } else {
        throw new Error('"' + aName + '" is a required argument.');
      }
    }
    exports.getArg = getArg;
    var urlRegexp = /^(?:([\w+\-.]+):)?\/\/(?:(\w+:\w+)@)?([\w.-]*)(?::(\d+))?(.*)$/;
    var dataUrlRegexp = /^data:.+\,.+$/;
    function urlParse(aUrl) {
      var match = aUrl.match(urlRegexp);
      if (!match) {
        return null;
      }
      return {
        scheme: match[1],
        auth: match[2],
        host: match[3],
        port: match[4],
        path: match[5]
      };
    }
    exports.urlParse = urlParse;
    function urlGenerate(aParsedUrl) {
      var url = "";
      if (aParsedUrl.scheme) {
        url += aParsedUrl.scheme + ":";
      }
      url += "//";
      if (aParsedUrl.auth) {
        url += aParsedUrl.auth + "@";
      }
      if (aParsedUrl.host) {
        url += aParsedUrl.host;
      }
      if (aParsedUrl.port) {
        url += ":" + aParsedUrl.port;
      }
      if (aParsedUrl.path) {
        url += aParsedUrl.path;
      }
      return url;
    }
    exports.urlGenerate = urlGenerate;
    var MAX_CACHED_INPUTS = 32;
    function lruMemoize(f) {
      var cache = [];
      return function(input) {
        for (var i = 0; i < cache.length; i++) {
          if (cache[i].input === input) {
            var temp = cache[0];
            cache[0] = cache[i];
            cache[i] = temp;
            return cache[0].result;
          }
        }
        var result = f(input);
        cache.unshift({
          input,
          result
        });
        if (cache.length > MAX_CACHED_INPUTS) {
          cache.pop();
        }
        return result;
      };
    }
    var normalize = lruMemoize(function normalize2(aPath) {
      var path6 = aPath;
      var url = urlParse(aPath);
      if (url) {
        if (!url.path) {
          return aPath;
        }
        path6 = url.path;
      }
      var isAbsolute = exports.isAbsolute(path6);
      var parts = [];
      var start = 0;
      var i = 0;
      while (true) {
        start = i;
        i = path6.indexOf("/", start);
        if (i === -1) {
          parts.push(path6.slice(start));
          break;
        } else {
          parts.push(path6.slice(start, i));
          while (i < path6.length && path6[i] === "/") {
            i++;
          }
        }
      }
      for (var part, up = 0, i = parts.length - 1; i >= 0; i--) {
        part = parts[i];
        if (part === ".") {
          parts.splice(i, 1);
        } else if (part === "..") {
          up++;
        } else if (up > 0) {
          if (part === "") {
            parts.splice(i + 1, up);
            up = 0;
          } else {
            parts.splice(i, 2);
            up--;
          }
        }
      }
      path6 = parts.join("/");
      if (path6 === "") {
        path6 = isAbsolute ? "/" : ".";
      }
      if (url) {
        url.path = path6;
        return urlGenerate(url);
      }
      return path6;
    });
    exports.normalize = normalize;
    function join(aRoot, aPath) {
      if (aRoot === "") {
        aRoot = ".";
      }
      if (aPath === "") {
        aPath = ".";
      }
      var aPathUrl = urlParse(aPath);
      var aRootUrl = urlParse(aRoot);
      if (aRootUrl) {
        aRoot = aRootUrl.path || "/";
      }
      if (aPathUrl && !aPathUrl.scheme) {
        if (aRootUrl) {
          aPathUrl.scheme = aRootUrl.scheme;
        }
        return urlGenerate(aPathUrl);
      }
      if (aPathUrl || aPath.match(dataUrlRegexp)) {
        return aPath;
      }
      if (aRootUrl && !aRootUrl.host && !aRootUrl.path) {
        aRootUrl.host = aPath;
        return urlGenerate(aRootUrl);
      }
      var joined = aPath.charAt(0) === "/" ? aPath : normalize(aRoot.replace(/\/+$/, "") + "/" + aPath);
      if (aRootUrl) {
        aRootUrl.path = joined;
        return urlGenerate(aRootUrl);
      }
      return joined;
    }
    exports.join = join;
    exports.isAbsolute = function(aPath) {
      return aPath.charAt(0) === "/" || urlRegexp.test(aPath);
    };
    function relative(aRoot, aPath) {
      if (aRoot === "") {
        aRoot = ".";
      }
      aRoot = aRoot.replace(/\/$/, "");
      var level = 0;
      while (aPath.indexOf(aRoot + "/") !== 0) {
        var index = aRoot.lastIndexOf("/");
        if (index < 0) {
          return aPath;
        }
        aRoot = aRoot.slice(0, index);
        if (aRoot.match(/^([^\/]+:\/)?\/*$/)) {
          return aPath;
        }
        ++level;
      }
      return Array(level + 1).join("../") + aPath.substr(aRoot.length + 1);
    }
    exports.relative = relative;
    var supportsNullProto = (function() {
      var obj = /* @__PURE__ */ Object.create(null);
      return !("__proto__" in obj);
    })();
    function identity(s) {
      return s;
    }
    function toSetString(aStr) {
      if (isProtoString(aStr)) {
        return "$" + aStr;
      }
      return aStr;
    }
    exports.toSetString = supportsNullProto ? identity : toSetString;
    function fromSetString(aStr) {
      if (isProtoString(aStr)) {
        return aStr.slice(1);
      }
      return aStr;
    }
    exports.fromSetString = supportsNullProto ? identity : fromSetString;
    function isProtoString(s) {
      if (!s) {
        return false;
      }
      var length = s.length;
      if (length < 9) {
        return false;
      }
      if (s.charCodeAt(length - 1) !== 95 || s.charCodeAt(length - 2) !== 95 || s.charCodeAt(length - 3) !== 111 || s.charCodeAt(length - 4) !== 116 || s.charCodeAt(length - 5) !== 111 || s.charCodeAt(length - 6) !== 114 || s.charCodeAt(length - 7) !== 112 || s.charCodeAt(length - 8) !== 95 || s.charCodeAt(length - 9) !== 95) {
        return false;
      }
      for (var i = length - 10; i >= 0; i--) {
        if (s.charCodeAt(i) !== 36) {
          return false;
        }
      }
      return true;
    }
    function compareByOriginalPositions(mappingA, mappingB, onlyCompareOriginal) {
      var cmp = strcmp(mappingA.source, mappingB.source);
      if (cmp !== 0) {
        return cmp;
      }
      cmp = mappingA.originalLine - mappingB.originalLine;
      if (cmp !== 0) {
        return cmp;
      }
      cmp = mappingA.originalColumn - mappingB.originalColumn;
      if (cmp !== 0 || onlyCompareOriginal) {
        return cmp;
      }
      cmp = mappingA.generatedColumn - mappingB.generatedColumn;
      if (cmp !== 0) {
        return cmp;
      }
      cmp = mappingA.generatedLine - mappingB.generatedLine;
      if (cmp !== 0) {
        return cmp;
      }
      return strcmp(mappingA.name, mappingB.name);
    }
    exports.compareByOriginalPositions = compareByOriginalPositions;
    function compareByOriginalPositionsNoSource(mappingA, mappingB, onlyCompareOriginal) {
      var cmp;
      cmp = mappingA.originalLine - mappingB.originalLine;
      if (cmp !== 0) {
        return cmp;
      }
      cmp = mappingA.originalColumn - mappingB.originalColumn;
      if (cmp !== 0 || onlyCompareOriginal) {
        return cmp;
      }
      cmp = mappingA.generatedColumn - mappingB.generatedColumn;
      if (cmp !== 0) {
        return cmp;
      }
      cmp = mappingA.generatedLine - mappingB.generatedLine;
      if (cmp !== 0) {
        return cmp;
      }
      return strcmp(mappingA.name, mappingB.name);
    }
    exports.compareByOriginalPositionsNoSource = compareByOriginalPositionsNoSource;
    function compareByGeneratedPositionsDeflated(mappingA, mappingB, onlyCompareGenerated) {
      var cmp = mappingA.generatedLine - mappingB.generatedLine;
      if (cmp !== 0) {
        return cmp;
      }
      cmp = mappingA.generatedColumn - mappingB.generatedColumn;
      if (cmp !== 0 || onlyCompareGenerated) {
        return cmp;
      }
      cmp = strcmp(mappingA.source, mappingB.source);
      if (cmp !== 0) {
        return cmp;
      }
      cmp = mappingA.originalLine - mappingB.originalLine;
      if (cmp !== 0) {
        return cmp;
      }
      cmp = mappingA.originalColumn - mappingB.originalColumn;
      if (cmp !== 0) {
        return cmp;
      }
      return strcmp(mappingA.name, mappingB.name);
    }
    exports.compareByGeneratedPositionsDeflated = compareByGeneratedPositionsDeflated;
    function compareByGeneratedPositionsDeflatedNoLine(mappingA, mappingB, onlyCompareGenerated) {
      var cmp = mappingA.generatedColumn - mappingB.generatedColumn;
      if (cmp !== 0 || onlyCompareGenerated) {
        return cmp;
      }
      cmp = strcmp(mappingA.source, mappingB.source);
      if (cmp !== 0) {
        return cmp;
      }
      cmp = mappingA.originalLine - mappingB.originalLine;
      if (cmp !== 0) {
        return cmp;
      }
      cmp = mappingA.originalColumn - mappingB.originalColumn;
      if (cmp !== 0) {
        return cmp;
      }
      return strcmp(mappingA.name, mappingB.name);
    }
    exports.compareByGeneratedPositionsDeflatedNoLine = compareByGeneratedPositionsDeflatedNoLine;
    function strcmp(aStr1, aStr2) {
      if (aStr1 === aStr2) {
        return 0;
      }
      if (aStr1 === null) {
        return 1;
      }
      if (aStr2 === null) {
        return -1;
      }
      if (aStr1 > aStr2) {
        return 1;
      }
      return -1;
    }
    function compareByGeneratedPositionsInflated(mappingA, mappingB) {
      var cmp = mappingA.generatedLine - mappingB.generatedLine;
      if (cmp !== 0) {
        return cmp;
      }
      cmp = mappingA.generatedColumn - mappingB.generatedColumn;
      if (cmp !== 0) {
        return cmp;
      }
      cmp = strcmp(mappingA.source, mappingB.source);
      if (cmp !== 0) {
        return cmp;
      }
      cmp = mappingA.originalLine - mappingB.originalLine;
      if (cmp !== 0) {
        return cmp;
      }
      cmp = mappingA.originalColumn - mappingB.originalColumn;
      if (cmp !== 0) {
        return cmp;
      }
      return strcmp(mappingA.name, mappingB.name);
    }
    exports.compareByGeneratedPositionsInflated = compareByGeneratedPositionsInflated;
    function parseSourceMapInput(str) {
      return JSON.parse(str.replace(/^\)]}'[^\n]*\n/, ""));
    }
    exports.parseSourceMapInput = parseSourceMapInput;
    function computeSourceURL(sourceRoot, sourceURL, sourceMapURL) {
      sourceURL = sourceURL || "";
      if (sourceRoot) {
        if (sourceRoot[sourceRoot.length - 1] !== "/" && sourceURL[0] !== "/") {
          sourceRoot += "/";
        }
        sourceURL = sourceRoot + sourceURL;
      }
      if (sourceMapURL) {
        var parsed = urlParse(sourceMapURL);
        if (!parsed) {
          throw new Error("sourceMapURL could not be parsed");
        }
        if (parsed.path) {
          var index = parsed.path.lastIndexOf("/");
          if (index >= 0) {
            parsed.path = parsed.path.substring(0, index + 1);
          }
        }
        sourceURL = join(urlGenerate(parsed), sourceURL);
      }
      return normalize(sourceURL);
    }
    exports.computeSourceURL = computeSourceURL;
  }
});

// node_modules/source-map-js/lib/array-set.js
var require_array_set = __commonJS({
  "node_modules/source-map-js/lib/array-set.js"(exports) {
    var util = require_util();
    var has = Object.prototype.hasOwnProperty;
    var hasNativeMap = typeof Map !== "undefined";
    function ArraySet() {
      this._array = [];
      this._set = hasNativeMap ? /* @__PURE__ */ new Map() : /* @__PURE__ */ Object.create(null);
    }
    ArraySet.fromArray = function ArraySet_fromArray(aArray, aAllowDuplicates) {
      var set = new ArraySet();
      for (var i = 0, len = aArray.length; i < len; i++) {
        set.add(aArray[i], aAllowDuplicates);
      }
      return set;
    };
    ArraySet.prototype.size = function ArraySet_size() {
      return hasNativeMap ? this._set.size : Object.getOwnPropertyNames(this._set).length;
    };
    ArraySet.prototype.add = function ArraySet_add(aStr, aAllowDuplicates) {
      var sStr = hasNativeMap ? aStr : util.toSetString(aStr);
      var isDuplicate = hasNativeMap ? this.has(aStr) : has.call(this._set, sStr);
      var idx = this._array.length;
      if (!isDuplicate || aAllowDuplicates) {
        this._array.push(aStr);
      }
      if (!isDuplicate) {
        if (hasNativeMap) {
          this._set.set(aStr, idx);
        } else {
          this._set[sStr] = idx;
        }
      }
    };
    ArraySet.prototype.has = function ArraySet_has(aStr) {
      if (hasNativeMap) {
        return this._set.has(aStr);
      } else {
        var sStr = util.toSetString(aStr);
        return has.call(this._set, sStr);
      }
    };
    ArraySet.prototype.indexOf = function ArraySet_indexOf(aStr) {
      if (hasNativeMap) {
        var idx = this._set.get(aStr);
        if (idx >= 0) {
          return idx;
        }
      } else {
        var sStr = util.toSetString(aStr);
        if (has.call(this._set, sStr)) {
          return this._set[sStr];
        }
      }
      throw new Error('"' + aStr + '" is not in the set.');
    };
    ArraySet.prototype.at = function ArraySet_at(aIdx) {
      if (aIdx >= 0 && aIdx < this._array.length) {
        return this._array[aIdx];
      }
      throw new Error("No element indexed by " + aIdx);
    };
    ArraySet.prototype.toArray = function ArraySet_toArray() {
      return this._array.slice();
    };
    exports.ArraySet = ArraySet;
  }
});

// node_modules/source-map-js/lib/mapping-list.js
var require_mapping_list = __commonJS({
  "node_modules/source-map-js/lib/mapping-list.js"(exports) {
    var util = require_util();
    function generatedPositionAfter(mappingA, mappingB) {
      var lineA = mappingA.generatedLine;
      var lineB = mappingB.generatedLine;
      var columnA = mappingA.generatedColumn;
      var columnB = mappingB.generatedColumn;
      return lineB > lineA || lineB == lineA && columnB >= columnA || util.compareByGeneratedPositionsInflated(mappingA, mappingB) <= 0;
    }
    function MappingList() {
      this._array = [];
      this._sorted = true;
      this._last = { generatedLine: -1, generatedColumn: 0 };
    }
    MappingList.prototype.unsortedForEach = function MappingList_forEach(aCallback, aThisArg) {
      this._array.forEach(aCallback, aThisArg);
    };
    MappingList.prototype.add = function MappingList_add(aMapping) {
      if (generatedPositionAfter(this._last, aMapping)) {
        this._last = aMapping;
        this._array.push(aMapping);
      } else {
        this._sorted = false;
        this._array.push(aMapping);
      }
    };
    MappingList.prototype.toArray = function MappingList_toArray() {
      if (!this._sorted) {
        this._array.sort(util.compareByGeneratedPositionsInflated);
        this._sorted = true;
      }
      return this._array;
    };
    exports.MappingList = MappingList;
  }
});

// node_modules/source-map-js/lib/source-map-generator.js
var require_source_map_generator = __commonJS({
  "node_modules/source-map-js/lib/source-map-generator.js"(exports) {
    var base64VLQ = require_base64_vlq();
    var util = require_util();
    var ArraySet = require_array_set().ArraySet;
    var MappingList = require_mapping_list().MappingList;
    function SourceMapGenerator(aArgs) {
      if (!aArgs) {
        aArgs = {};
      }
      this._file = util.getArg(aArgs, "file", null);
      this._sourceRoot = util.getArg(aArgs, "sourceRoot", null);
      this._skipValidation = util.getArg(aArgs, "skipValidation", false);
      this._ignoreInvalidMapping = util.getArg(aArgs, "ignoreInvalidMapping", false);
      this._sources = new ArraySet();
      this._names = new ArraySet();
      this._mappings = new MappingList();
      this._sourcesContents = null;
    }
    SourceMapGenerator.prototype._version = 3;
    SourceMapGenerator.fromSourceMap = function SourceMapGenerator_fromSourceMap(aSourceMapConsumer, generatorOps) {
      var sourceRoot = aSourceMapConsumer.sourceRoot;
      var generator = new SourceMapGenerator(Object.assign(generatorOps || {}, {
        file: aSourceMapConsumer.file,
        sourceRoot
      }));
      aSourceMapConsumer.eachMapping(function(mapping) {
        var newMapping = {
          generated: {
            line: mapping.generatedLine,
            column: mapping.generatedColumn
          }
        };
        if (mapping.source != null) {
          newMapping.source = mapping.source;
          if (sourceRoot != null) {
            newMapping.source = util.relative(sourceRoot, newMapping.source);
          }
          newMapping.original = {
            line: mapping.originalLine,
            column: mapping.originalColumn
          };
          if (mapping.name != null) {
            newMapping.name = mapping.name;
          }
        }
        generator.addMapping(newMapping);
      });
      aSourceMapConsumer.sources.forEach(function(sourceFile) {
        var sourceRelative = sourceFile;
        if (sourceRoot !== null) {
          sourceRelative = util.relative(sourceRoot, sourceFile);
        }
        if (!generator._sources.has(sourceRelative)) {
          generator._sources.add(sourceRelative);
        }
        var content = aSourceMapConsumer.sourceContentFor(sourceFile);
        if (content != null) {
          generator.setSourceContent(sourceFile, content);
        }
      });
      return generator;
    };
    SourceMapGenerator.prototype.addMapping = function SourceMapGenerator_addMapping(aArgs) {
      var generated = util.getArg(aArgs, "generated");
      var original = util.getArg(aArgs, "original", null);
      var source = util.getArg(aArgs, "source", null);
      var name = util.getArg(aArgs, "name", null);
      if (!this._skipValidation) {
        if (this._validateMapping(generated, original, source, name) === false) {
          return;
        }
      }
      if (source != null) {
        source = String(source);
        if (!this._sources.has(source)) {
          this._sources.add(source);
        }
      }
      if (name != null) {
        name = String(name);
        if (!this._names.has(name)) {
          this._names.add(name);
        }
      }
      this._mappings.add({
        generatedLine: generated.line,
        generatedColumn: generated.column,
        originalLine: original != null && original.line,
        originalColumn: original != null && original.column,
        source,
        name
      });
    };
    SourceMapGenerator.prototype.setSourceContent = function SourceMapGenerator_setSourceContent(aSourceFile, aSourceContent) {
      var source = aSourceFile;
      if (this._sourceRoot != null) {
        source = util.relative(this._sourceRoot, source);
      }
      if (aSourceContent != null) {
        if (!this._sourcesContents) {
          this._sourcesContents = /* @__PURE__ */ Object.create(null);
        }
        this._sourcesContents[util.toSetString(source)] = aSourceContent;
      } else if (this._sourcesContents) {
        delete this._sourcesContents[util.toSetString(source)];
        if (Object.keys(this._sourcesContents).length === 0) {
          this._sourcesContents = null;
        }
      }
    };
    SourceMapGenerator.prototype.applySourceMap = function SourceMapGenerator_applySourceMap(aSourceMapConsumer, aSourceFile, aSourceMapPath) {
      var sourceFile = aSourceFile;
      if (aSourceFile == null) {
        if (aSourceMapConsumer.file == null) {
          throw new Error(
            `SourceMapGenerator.prototype.applySourceMap requires either an explicit source file, or the source map's "file" property. Both were omitted.`
          );
        }
        sourceFile = aSourceMapConsumer.file;
      }
      var sourceRoot = this._sourceRoot;
      if (sourceRoot != null) {
        sourceFile = util.relative(sourceRoot, sourceFile);
      }
      var newSources = new ArraySet();
      var newNames = new ArraySet();
      this._mappings.unsortedForEach(function(mapping) {
        if (mapping.source === sourceFile && mapping.originalLine != null) {
          var original = aSourceMapConsumer.originalPositionFor({
            line: mapping.originalLine,
            column: mapping.originalColumn
          });
          if (original.source != null) {
            mapping.source = original.source;
            if (aSourceMapPath != null) {
              mapping.source = util.join(aSourceMapPath, mapping.source);
            }
            if (sourceRoot != null) {
              mapping.source = util.relative(sourceRoot, mapping.source);
            }
            mapping.originalLine = original.line;
            mapping.originalColumn = original.column;
            if (original.name != null) {
              mapping.name = original.name;
            }
          }
        }
        var source = mapping.source;
        if (source != null && !newSources.has(source)) {
          newSources.add(source);
        }
        var name = mapping.name;
        if (name != null && !newNames.has(name)) {
          newNames.add(name);
        }
      }, this);
      this._sources = newSources;
      this._names = newNames;
      aSourceMapConsumer.sources.forEach(function(sourceFile2) {
        var content = aSourceMapConsumer.sourceContentFor(sourceFile2);
        if (content != null) {
          if (aSourceMapPath != null) {
            sourceFile2 = util.join(aSourceMapPath, sourceFile2);
          }
          if (sourceRoot != null) {
            sourceFile2 = util.relative(sourceRoot, sourceFile2);
          }
          this.setSourceContent(sourceFile2, content);
        }
      }, this);
    };
    SourceMapGenerator.prototype._validateMapping = function SourceMapGenerator_validateMapping(aGenerated, aOriginal, aSource, aName) {
      if (aOriginal && typeof aOriginal.line !== "number" && typeof aOriginal.column !== "number") {
        var message = "original.line and original.column are not numbers -- you probably meant to omit the original mapping entirely and only map the generated position. If so, pass null for the original mapping instead of an object with empty or null values.";
        if (this._ignoreInvalidMapping) {
          if (typeof console !== "undefined" && console.warn) {
            console.warn(message);
          }
          return false;
        } else {
          throw new Error(message);
        }
      }
      if (aGenerated && "line" in aGenerated && "column" in aGenerated && aGenerated.line > 0 && aGenerated.column >= 0 && !aOriginal && !aSource && !aName) {
        return;
      } else if (aGenerated && "line" in aGenerated && "column" in aGenerated && aOriginal && "line" in aOriginal && "column" in aOriginal && aGenerated.line > 0 && aGenerated.column >= 0 && aOriginal.line > 0 && aOriginal.column >= 0 && aSource) {
        return;
      } else {
        var message = "Invalid mapping: " + JSON.stringify({
          generated: aGenerated,
          source: aSource,
          original: aOriginal,
          name: aName
        });
        if (this._ignoreInvalidMapping) {
          if (typeof console !== "undefined" && console.warn) {
            console.warn(message);
          }
          return false;
        } else {
          throw new Error(message);
        }
      }
    };
    SourceMapGenerator.prototype._serializeMappings = function SourceMapGenerator_serializeMappings() {
      var previousGeneratedColumn = 0;
      var previousGeneratedLine = 1;
      var previousOriginalColumn = 0;
      var previousOriginalLine = 0;
      var previousName = 0;
      var previousSource = 0;
      var result = "";
      var next;
      var mapping;
      var nameIdx;
      var sourceIdx;
      var mappings = this._mappings.toArray();
      for (var i = 0, len = mappings.length; i < len; i++) {
        mapping = mappings[i];
        next = "";
        if (mapping.generatedLine !== previousGeneratedLine) {
          previousGeneratedColumn = 0;
          var lineDelta = mapping.generatedLine - previousGeneratedLine;
          next += lineDelta === 1 ? ";" : ";".repeat(lineDelta);
          previousGeneratedLine = mapping.generatedLine;
        } else {
          if (i > 0) {
            if (!util.compareByGeneratedPositionsInflated(mapping, mappings[i - 1])) {
              continue;
            }
            next += ",";
          }
        }
        next += base64VLQ.encode(mapping.generatedColumn - previousGeneratedColumn);
        previousGeneratedColumn = mapping.generatedColumn;
        if (mapping.source != null) {
          sourceIdx = this._sources.indexOf(mapping.source);
          next += base64VLQ.encode(sourceIdx - previousSource);
          previousSource = sourceIdx;
          next += base64VLQ.encode(mapping.originalLine - 1 - previousOriginalLine);
          previousOriginalLine = mapping.originalLine - 1;
          next += base64VLQ.encode(mapping.originalColumn - previousOriginalColumn);
          previousOriginalColumn = mapping.originalColumn;
          if (mapping.name != null) {
            nameIdx = this._names.indexOf(mapping.name);
            next += base64VLQ.encode(nameIdx - previousName);
            previousName = nameIdx;
          }
        }
        result += next;
      }
      return result;
    };
    SourceMapGenerator.prototype._generateSourcesContent = function SourceMapGenerator_generateSourcesContent(aSources, aSourceRoot) {
      return aSources.map(function(source) {
        if (!this._sourcesContents) {
          return null;
        }
        if (aSourceRoot != null) {
          source = util.relative(aSourceRoot, source);
        }
        var key = util.toSetString(source);
        return Object.prototype.hasOwnProperty.call(this._sourcesContents, key) ? this._sourcesContents[key] : null;
      }, this);
    };
    SourceMapGenerator.prototype.toJSON = function SourceMapGenerator_toJSON() {
      var map = {
        version: this._version,
        sources: this._sources.toArray(),
        names: this._names.toArray(),
        mappings: this._serializeMappings()
      };
      if (this._file != null) {
        map.file = this._file;
      }
      if (this._sourceRoot != null) {
        map.sourceRoot = this._sourceRoot;
      }
      if (this._sourcesContents) {
        map.sourcesContent = this._generateSourcesContent(map.sources, map.sourceRoot);
      }
      return map;
    };
    SourceMapGenerator.prototype.toString = function SourceMapGenerator_toString() {
      return JSON.stringify(this.toJSON());
    };
    exports.SourceMapGenerator = SourceMapGenerator;
  }
});

// node_modules/source-map-js/lib/binary-search.js
var require_binary_search = __commonJS({
  "node_modules/source-map-js/lib/binary-search.js"(exports) {
    exports.GREATEST_LOWER_BOUND = 1;
    exports.LEAST_UPPER_BOUND = 2;
    function recursiveSearch(aLow, aHigh, aNeedle, aHaystack, aCompare, aBias) {
      var mid = Math.floor((aHigh - aLow) / 2) + aLow;
      var cmp = aCompare(aNeedle, aHaystack[mid], true);
      if (cmp === 0) {
        return mid;
      } else if (cmp > 0) {
        if (aHigh - mid > 1) {
          return recursiveSearch(mid, aHigh, aNeedle, aHaystack, aCompare, aBias);
        }
        if (aBias == exports.LEAST_UPPER_BOUND) {
          return aHigh < aHaystack.length ? aHigh : -1;
        } else {
          return mid;
        }
      } else {
        if (mid - aLow > 1) {
          return recursiveSearch(aLow, mid, aNeedle, aHaystack, aCompare, aBias);
        }
        if (aBias == exports.LEAST_UPPER_BOUND) {
          return mid;
        } else {
          return aLow < 0 ? -1 : aLow;
        }
      }
    }
    exports.search = function search(aNeedle, aHaystack, aCompare, aBias) {
      if (aHaystack.length === 0) {
        return -1;
      }
      var index = recursiveSearch(
        -1,
        aHaystack.length,
        aNeedle,
        aHaystack,
        aCompare,
        aBias || exports.GREATEST_LOWER_BOUND
      );
      if (index < 0) {
        return -1;
      }
      while (index - 1 >= 0) {
        if (aCompare(aHaystack[index], aHaystack[index - 1], true) !== 0) {
          break;
        }
        --index;
      }
      return index;
    };
  }
});

// node_modules/source-map-js/lib/quick-sort.js
var require_quick_sort = __commonJS({
  "node_modules/source-map-js/lib/quick-sort.js"(exports) {
    function SortTemplate(comparator) {
      function swap(ary, x, y) {
        var temp = ary[x];
        ary[x] = ary[y];
        ary[y] = temp;
      }
      function randomIntInRange(low, high) {
        return Math.round(low + Math.random() * (high - low));
      }
      function doQuickSort(ary, comparator2, p, r) {
        if (p < r) {
          var pivotIndex = randomIntInRange(p, r);
          var i = p - 1;
          swap(ary, pivotIndex, r);
          var pivot = ary[r];
          for (var j = p; j < r; j++) {
            if (comparator2(ary[j], pivot, false) <= 0) {
              i += 1;
              swap(ary, i, j);
            }
          }
          swap(ary, i + 1, j);
          var q = i + 1;
          doQuickSort(ary, comparator2, p, q - 1);
          doQuickSort(ary, comparator2, q + 1, r);
        }
      }
      return doQuickSort;
    }
    function cloneSort(comparator) {
      let template = SortTemplate.toString();
      let templateFn = new Function(`return ${template}`)();
      return templateFn(comparator);
    }
    var isEvalAllowed = (function() {
      try {
        new Function("return 0")();
        return true;
      } catch {
        return false;
      }
    })();
    var sortCache = /* @__PURE__ */ new WeakMap();
    exports.quickSort = function(ary, comparator, start = 0) {
      let doQuickSort = isEvalAllowed ? sortCache.get(comparator) : SortTemplate(comparator);
      if (doQuickSort === void 0) {
        doQuickSort = cloneSort(comparator);
        sortCache.set(comparator, doQuickSort);
      }
      doQuickSort(ary, comparator, start, ary.length - 1);
    };
  }
});

// node_modules/source-map-js/lib/source-map-consumer.js
var require_source_map_consumer = __commonJS({
  "node_modules/source-map-js/lib/source-map-consumer.js"(exports) {
    var util = require_util();
    var binarySearch = require_binary_search();
    var ArraySet = require_array_set().ArraySet;
    var base64VLQ = require_base64_vlq();
    var quickSort = require_quick_sort().quickSort;
    var MAX_SECTION_OFFSET_LINE = 1e7;
    function SourceMapConsumer2(aSourceMap, aSourceMapURL) {
      var sourceMap = aSourceMap;
      if (typeof aSourceMap === "string") {
        sourceMap = util.parseSourceMapInput(aSourceMap);
      }
      return sourceMap.sections != null ? new IndexedSourceMapConsumer(sourceMap, aSourceMapURL) : new BasicSourceMapConsumer(sourceMap, aSourceMapURL);
    }
    SourceMapConsumer2.fromSourceMap = function(aSourceMap, aSourceMapURL) {
      return BasicSourceMapConsumer.fromSourceMap(aSourceMap, aSourceMapURL);
    };
    SourceMapConsumer2.prototype._version = 3;
    SourceMapConsumer2.prototype.__generatedMappings = null;
    Object.defineProperty(SourceMapConsumer2.prototype, "_generatedMappings", {
      configurable: true,
      enumerable: true,
      get: function() {
        if (!this.__generatedMappings) {
          this._parseMappings(this._mappings, this.sourceRoot);
        }
        return this.__generatedMappings;
      }
    });
    SourceMapConsumer2.prototype.__originalMappings = null;
    Object.defineProperty(SourceMapConsumer2.prototype, "_originalMappings", {
      configurable: true,
      enumerable: true,
      get: function() {
        if (!this.__originalMappings) {
          this._parseMappings(this._mappings, this.sourceRoot);
        }
        return this.__originalMappings;
      }
    });
    SourceMapConsumer2.prototype._charIsMappingSeparator = function SourceMapConsumer_charIsMappingSeparator(aStr, index) {
      var c = aStr.charAt(index);
      return c === ";" || c === ",";
    };
    SourceMapConsumer2.prototype._parseMappings = function SourceMapConsumer_parseMappings(aStr, aSourceRoot) {
      throw new Error("Subclasses must implement _parseMappings");
    };
    SourceMapConsumer2.GENERATED_ORDER = 1;
    SourceMapConsumer2.ORIGINAL_ORDER = 2;
    SourceMapConsumer2.GREATEST_LOWER_BOUND = 1;
    SourceMapConsumer2.LEAST_UPPER_BOUND = 2;
    SourceMapConsumer2.prototype.eachMapping = function SourceMapConsumer_eachMapping(aCallback, aContext, aOrder) {
      var context = aContext || null;
      var order = aOrder || SourceMapConsumer2.GENERATED_ORDER;
      var mappings;
      switch (order) {
        case SourceMapConsumer2.GENERATED_ORDER:
          mappings = this._generatedMappings;
          break;
        case SourceMapConsumer2.ORIGINAL_ORDER:
          mappings = this._originalMappings;
          break;
        default:
          throw new Error("Unknown order of iteration.");
      }
      var sourceRoot = this.sourceRoot;
      var boundCallback = aCallback.bind(context);
      var names = this._names;
      var sources = this._sources;
      var sourceMapURL = this._sourceMapURL;
      for (var i = 0, n = mappings.length; i < n; i++) {
        var mapping = mappings[i];
        var source = mapping.source === null ? null : sources.at(mapping.source);
        if (source !== null) {
          source = util.computeSourceURL(sourceRoot, source, sourceMapURL);
        }
        boundCallback({
          source,
          generatedLine: mapping.generatedLine,
          generatedColumn: mapping.generatedColumn,
          originalLine: mapping.originalLine,
          originalColumn: mapping.originalColumn,
          name: mapping.name === null ? null : names.at(mapping.name)
        });
      }
    };
    SourceMapConsumer2.prototype.allGeneratedPositionsFor = function SourceMapConsumer_allGeneratedPositionsFor(aArgs) {
      var line = util.getArg(aArgs, "line");
      var needle = {
        source: util.getArg(aArgs, "source"),
        originalLine: line,
        originalColumn: util.getArg(aArgs, "column", 0)
      };
      needle.source = this._findSourceIndex(needle.source);
      if (needle.source < 0) {
        return [];
      }
      var mappings = [];
      var index = this._findMapping(
        needle,
        this._originalMappings,
        "originalLine",
        "originalColumn",
        util.compareByOriginalPositions,
        binarySearch.LEAST_UPPER_BOUND
      );
      if (index >= 0) {
        var mapping = this._originalMappings[index];
        if (aArgs.column === void 0) {
          var originalLine = mapping.originalLine;
          while (mapping && mapping.originalLine === originalLine) {
            mappings.push({
              line: util.getArg(mapping, "generatedLine", null),
              column: util.getArg(mapping, "generatedColumn", null),
              lastColumn: util.getArg(mapping, "lastGeneratedColumn", null)
            });
            mapping = this._originalMappings[++index];
          }
        } else {
          var originalColumn = mapping.originalColumn;
          while (mapping && mapping.originalLine === line && mapping.originalColumn == originalColumn) {
            mappings.push({
              line: util.getArg(mapping, "generatedLine", null),
              column: util.getArg(mapping, "generatedColumn", null),
              lastColumn: util.getArg(mapping, "lastGeneratedColumn", null)
            });
            mapping = this._originalMappings[++index];
          }
        }
      }
      return mappings;
    };
    exports.SourceMapConsumer = SourceMapConsumer2;
    function BasicSourceMapConsumer(aSourceMap, aSourceMapURL) {
      var sourceMap = aSourceMap;
      if (typeof aSourceMap === "string") {
        sourceMap = util.parseSourceMapInput(aSourceMap);
      }
      var version = util.getArg(sourceMap, "version");
      var sources = util.getArg(sourceMap, "sources");
      var names = util.getArg(sourceMap, "names", []);
      var sourceRoot = util.getArg(sourceMap, "sourceRoot", null);
      var sourcesContent = util.getArg(sourceMap, "sourcesContent", null);
      var mappings = util.getArg(sourceMap, "mappings");
      var file = util.getArg(sourceMap, "file", null);
      if (version != this._version) {
        throw new Error("Unsupported version: " + version);
      }
      if (sourceRoot) {
        sourceRoot = util.normalize(sourceRoot);
      }
      sources = sources.map(String).map(util.normalize).map(function(source) {
        return sourceRoot && util.isAbsolute(sourceRoot) && util.isAbsolute(source) ? util.relative(sourceRoot, source) : source;
      });
      this._names = ArraySet.fromArray(names.map(String), true);
      this._sources = ArraySet.fromArray(sources, true);
      this._absoluteSources = this._sources.toArray().map(function(s) {
        return util.computeSourceURL(sourceRoot, s, aSourceMapURL);
      });
      this.sourceRoot = sourceRoot;
      this.sourcesContent = sourcesContent;
      this._mappings = mappings;
      this._sourceMapURL = aSourceMapURL;
      this.file = file;
    }
    BasicSourceMapConsumer.prototype = Object.create(SourceMapConsumer2.prototype);
    BasicSourceMapConsumer.prototype.consumer = SourceMapConsumer2;
    BasicSourceMapConsumer.prototype._findSourceIndex = function(aSource) {
      var relativeSource = aSource;
      if (this.sourceRoot != null) {
        relativeSource = util.relative(this.sourceRoot, relativeSource);
      }
      if (this._sources.has(relativeSource)) {
        return this._sources.indexOf(relativeSource);
      }
      var i;
      for (i = 0; i < this._absoluteSources.length; ++i) {
        if (this._absoluteSources[i] == aSource) {
          return i;
        }
      }
      return -1;
    };
    BasicSourceMapConsumer.fromSourceMap = function SourceMapConsumer_fromSourceMap(aSourceMap, aSourceMapURL) {
      var smc = Object.create(BasicSourceMapConsumer.prototype);
      var names = smc._names = ArraySet.fromArray(aSourceMap._names.toArray(), true);
      var sources = smc._sources = ArraySet.fromArray(aSourceMap._sources.toArray(), true);
      smc.sourceRoot = aSourceMap._sourceRoot;
      smc.sourcesContent = aSourceMap._generateSourcesContent(
        smc._sources.toArray(),
        smc.sourceRoot
      );
      smc.file = aSourceMap._file;
      smc._sourceMapURL = aSourceMapURL;
      smc._absoluteSources = smc._sources.toArray().map(function(s) {
        return util.computeSourceURL(smc.sourceRoot, s, aSourceMapURL);
      });
      var generatedMappings = aSourceMap._mappings.toArray().slice();
      var destGeneratedMappings = smc.__generatedMappings = [];
      var destOriginalMappings = smc.__originalMappings = [];
      for (var i = 0, length = generatedMappings.length; i < length; i++) {
        var srcMapping = generatedMappings[i];
        var destMapping = new Mapping();
        destMapping.generatedLine = srcMapping.generatedLine;
        destMapping.generatedColumn = srcMapping.generatedColumn;
        if (srcMapping.source) {
          destMapping.source = sources.indexOf(srcMapping.source);
          destMapping.originalLine = srcMapping.originalLine;
          destMapping.originalColumn = srcMapping.originalColumn;
          if (srcMapping.name) {
            destMapping.name = names.indexOf(srcMapping.name);
          }
          destOriginalMappings.push(destMapping);
        }
        destGeneratedMappings.push(destMapping);
      }
      quickSort(smc.__originalMappings, util.compareByOriginalPositions);
      return smc;
    };
    BasicSourceMapConsumer.prototype._version = 3;
    Object.defineProperty(BasicSourceMapConsumer.prototype, "sources", {
      get: function() {
        return this._absoluteSources.slice();
      }
    });
    function Mapping() {
      this.generatedLine = 0;
      this.generatedColumn = 0;
      this.source = null;
      this.originalLine = null;
      this.originalColumn = null;
      this.name = null;
    }
    var compareGenerated = util.compareByGeneratedPositionsDeflatedNoLine;
    function sortGenerated(array, start) {
      let l = array.length;
      let n = array.length - start;
      if (n <= 1) {
        return;
      } else if (n == 2) {
        let a = array[start];
        let b = array[start + 1];
        if (compareGenerated(a, b) > 0) {
          array[start] = b;
          array[start + 1] = a;
        }
      } else if (n < 20) {
        for (let i = start; i < l; i++) {
          for (let j = i; j > start; j--) {
            let a = array[j - 1];
            let b = array[j];
            if (compareGenerated(a, b) <= 0) {
              break;
            }
            array[j - 1] = b;
            array[j] = a;
          }
        }
      } else {
        quickSort(array, compareGenerated, start);
      }
    }
    BasicSourceMapConsumer.prototype._parseMappings = function SourceMapConsumer_parseMappings(aStr, aSourceRoot) {
      var generatedLine = 1;
      var previousGeneratedColumn = 0;
      var previousOriginalLine = 0;
      var previousOriginalColumn = 0;
      var previousSource = 0;
      var previousName = 0;
      var length = aStr.length;
      var index = 0;
      var cachedSegments = {};
      var temp = {};
      var originalMappings = [];
      var generatedMappings = [];
      var mapping, str, segment, end, value;
      let subarrayStart = 0;
      while (index < length) {
        if (aStr.charAt(index) === ";") {
          generatedLine++;
          index++;
          previousGeneratedColumn = 0;
          sortGenerated(generatedMappings, subarrayStart);
          subarrayStart = generatedMappings.length;
        } else if (aStr.charAt(index) === ",") {
          index++;
        } else {
          mapping = new Mapping();
          mapping.generatedLine = generatedLine;
          for (end = index; end < length; end++) {
            if (this._charIsMappingSeparator(aStr, end)) {
              break;
            }
          }
          str = aStr.slice(index, end);
          segment = [];
          while (index < end) {
            base64VLQ.decode(aStr, index, temp);
            value = temp.value;
            index = temp.rest;
            segment.push(value);
          }
          if (segment.length === 2) {
            throw new Error("Found a source, but no line and column");
          }
          if (segment.length === 3) {
            throw new Error("Found a source and line, but no column");
          }
          mapping.generatedColumn = previousGeneratedColumn + segment[0];
          previousGeneratedColumn = mapping.generatedColumn;
          if (segment.length > 1) {
            mapping.source = previousSource + segment[1];
            previousSource += segment[1];
            mapping.originalLine = previousOriginalLine + segment[2];
            previousOriginalLine = mapping.originalLine;
            mapping.originalLine += 1;
            mapping.originalColumn = previousOriginalColumn + segment[3];
            previousOriginalColumn = mapping.originalColumn;
            if (segment.length > 4) {
              mapping.name = previousName + segment[4];
              previousName += segment[4];
            }
          }
          generatedMappings.push(mapping);
          if (typeof mapping.originalLine === "number") {
            let currentSource = mapping.source;
            while (originalMappings.length <= currentSource) {
              originalMappings.push(null);
            }
            if (originalMappings[currentSource] === null) {
              originalMappings[currentSource] = [];
            }
            originalMappings[currentSource].push(mapping);
          }
        }
      }
      sortGenerated(generatedMappings, subarrayStart);
      this.__generatedMappings = generatedMappings;
      for (var i = 0; i < originalMappings.length; i++) {
        if (originalMappings[i] != null) {
          quickSort(originalMappings[i], util.compareByOriginalPositionsNoSource);
        }
      }
      this.__originalMappings = [].concat(...originalMappings);
    };
    BasicSourceMapConsumer.prototype._findMapping = function SourceMapConsumer_findMapping(aNeedle, aMappings, aLineName, aColumnName, aComparator, aBias) {
      if (aNeedle[aLineName] <= 0) {
        throw new TypeError("Line must be greater than or equal to 1, got " + aNeedle[aLineName]);
      }
      if (aNeedle[aColumnName] < 0) {
        throw new TypeError("Column must be greater than or equal to 0, got " + aNeedle[aColumnName]);
      }
      return binarySearch.search(aNeedle, aMappings, aComparator, aBias);
    };
    BasicSourceMapConsumer.prototype.computeColumnSpans = function SourceMapConsumer_computeColumnSpans() {
      for (var index = 0; index < this._generatedMappings.length; ++index) {
        var mapping = this._generatedMappings[index];
        if (index + 1 < this._generatedMappings.length) {
          var nextMapping = this._generatedMappings[index + 1];
          if (mapping.generatedLine === nextMapping.generatedLine) {
            mapping.lastGeneratedColumn = nextMapping.generatedColumn - 1;
            continue;
          }
        }
        mapping.lastGeneratedColumn = Infinity;
      }
    };
    BasicSourceMapConsumer.prototype.originalPositionFor = function SourceMapConsumer_originalPositionFor(aArgs) {
      var needle = {
        generatedLine: util.getArg(aArgs, "line"),
        generatedColumn: util.getArg(aArgs, "column")
      };
      var index = this._findMapping(
        needle,
        this._generatedMappings,
        "generatedLine",
        "generatedColumn",
        util.compareByGeneratedPositionsDeflated,
        util.getArg(aArgs, "bias", SourceMapConsumer2.GREATEST_LOWER_BOUND)
      );
      if (index >= 0) {
        var mapping = this._generatedMappings[index];
        if (mapping.generatedLine === needle.generatedLine) {
          var source = util.getArg(mapping, "source", null);
          if (source !== null) {
            source = this._sources.at(source);
            source = util.computeSourceURL(this.sourceRoot, source, this._sourceMapURL);
          }
          var name = util.getArg(mapping, "name", null);
          if (name !== null) {
            name = this._names.at(name);
          }
          return {
            source,
            line: util.getArg(mapping, "originalLine", null),
            column: util.getArg(mapping, "originalColumn", null),
            name
          };
        }
      }
      return {
        source: null,
        line: null,
        column: null,
        name: null
      };
    };
    BasicSourceMapConsumer.prototype.hasContentsOfAllSources = function BasicSourceMapConsumer_hasContentsOfAllSources() {
      if (!this.sourcesContent) {
        return false;
      }
      return this.sourcesContent.length >= this._sources.size() && !this.sourcesContent.some(function(sc) {
        return sc == null;
      });
    };
    BasicSourceMapConsumer.prototype.sourceContentFor = function SourceMapConsumer_sourceContentFor(aSource, nullOnMissing) {
      if (!this.sourcesContent) {
        return null;
      }
      var index = this._findSourceIndex(aSource);
      if (index >= 0) {
        return this.sourcesContent[index];
      }
      var relativeSource = aSource;
      if (this.sourceRoot != null) {
        relativeSource = util.relative(this.sourceRoot, relativeSource);
      }
      var url;
      if (this.sourceRoot != null && (url = util.urlParse(this.sourceRoot))) {
        var fileUriAbsPath = relativeSource.replace(/^file:\/\//, "");
        if (url.scheme == "file" && this._sources.has(fileUriAbsPath)) {
          return this.sourcesContent[this._sources.indexOf(fileUriAbsPath)];
        }
        if ((!url.path || url.path == "/") && this._sources.has("/" + relativeSource)) {
          return this.sourcesContent[this._sources.indexOf("/" + relativeSource)];
        }
      }
      if (nullOnMissing) {
        return null;
      } else {
        throw new Error('"' + relativeSource + '" is not in the SourceMap.');
      }
    };
    BasicSourceMapConsumer.prototype.generatedPositionFor = function SourceMapConsumer_generatedPositionFor(aArgs) {
      var source = util.getArg(aArgs, "source");
      source = this._findSourceIndex(source);
      if (source < 0) {
        return {
          line: null,
          column: null,
          lastColumn: null
        };
      }
      var needle = {
        source,
        originalLine: util.getArg(aArgs, "line"),
        originalColumn: util.getArg(aArgs, "column")
      };
      var index = this._findMapping(
        needle,
        this._originalMappings,
        "originalLine",
        "originalColumn",
        util.compareByOriginalPositions,
        util.getArg(aArgs, "bias", SourceMapConsumer2.GREATEST_LOWER_BOUND)
      );
      if (index >= 0) {
        var mapping = this._originalMappings[index];
        if (mapping.source === needle.source) {
          return {
            line: util.getArg(mapping, "generatedLine", null),
            column: util.getArg(mapping, "generatedColumn", null),
            lastColumn: util.getArg(mapping, "lastGeneratedColumn", null)
          };
        }
      }
      return {
        line: null,
        column: null,
        lastColumn: null
      };
    };
    exports.BasicSourceMapConsumer = BasicSourceMapConsumer;
    function IndexedSourceMapConsumer(aSourceMap, aSourceMapURL) {
      var sourceMap = aSourceMap;
      if (typeof aSourceMap === "string") {
        sourceMap = util.parseSourceMapInput(aSourceMap);
      }
      var version = util.getArg(sourceMap, "version");
      var sections = util.getArg(sourceMap, "sections");
      if (version != this._version) {
        throw new Error("Unsupported version: " + version);
      }
      this._sources = new ArraySet();
      this._names = new ArraySet();
      var lastOffset = {
        line: -1,
        column: 0
      };
      var maxOffsetLine = 0;
      this._sections = sections.map(function(s) {
        if (s.url) {
          throw new Error("Support for url field in sections not implemented.");
        }
        var offset = util.getArg(s, "offset");
        var offsetLine = util.getArg(offset, "line");
        var offsetColumn = util.getArg(offset, "column");
        if (!isValidOffset(offsetLine) || !isValidOffset(offsetColumn)) {
          throw new Error("Section offset line and column must be non-negative integers.");
        }
        if (offsetLine > MAX_SECTION_OFFSET_LINE) {
          throw new Error("Section offset line must not exceed " + MAX_SECTION_OFFSET_LINE + ".");
        }
        if (offsetLine < lastOffset.line || offsetLine === lastOffset.line && offsetColumn < lastOffset.column) {
          throw new Error("Section offsets must be ordered and non-overlapping.");
        }
        lastOffset = offset;
        var consumer = new SourceMapConsumer2(util.getArg(s, "map"), aSourceMapURL);
        var totalOffsetLine = offsetLine + (consumer._maxOffsetLine || 0);
        if (totalOffsetLine > MAX_SECTION_OFFSET_LINE) {
          throw new Error("Section offset line must not exceed " + MAX_SECTION_OFFSET_LINE + ", including offsets of nested sections.");
        }
        if (totalOffsetLine > maxOffsetLine) {
          maxOffsetLine = totalOffsetLine;
        }
        return {
          generatedOffset: {
            // The offset fields are 0-based, but we use 1-based indices when
            // encoding/decoding from VLQ.
            generatedLine: offsetLine + 1,
            generatedColumn: offsetColumn + 1
          },
          consumer
        };
      });
      this._maxOffsetLine = maxOffsetLine;
    }
    function isValidOffset(aValue) {
      return typeof aValue === "number" && aValue >= 0 && aValue <= 9007199254740991 && // Number.MAX_SAFE_INTEGER
      Math.floor(aValue) === aValue;
    }
    IndexedSourceMapConsumer.prototype = Object.create(SourceMapConsumer2.prototype);
    IndexedSourceMapConsumer.prototype.constructor = SourceMapConsumer2;
    IndexedSourceMapConsumer.prototype._version = 3;
    Object.defineProperty(IndexedSourceMapConsumer.prototype, "sources", {
      get: function() {
        var sources = [];
        for (var i = 0; i < this._sections.length; i++) {
          var sectionSources = this._sections[i].consumer.sources;
          for (var j = 0; j < sectionSources.length; j++) {
            sources.push(sectionSources[j]);
          }
        }
        return sources;
      }
    });
    IndexedSourceMapConsumer.prototype.originalPositionFor = function IndexedSourceMapConsumer_originalPositionFor(aArgs) {
      var needle = {
        generatedLine: util.getArg(aArgs, "line"),
        generatedColumn: util.getArg(aArgs, "column")
      };
      var sectionIndex = binarySearch.search(
        needle,
        this._sections,
        function(needle2, section2) {
          var cmp = needle2.generatedLine - section2.generatedOffset.generatedLine;
          if (cmp) {
            return cmp;
          }
          return needle2.generatedColumn - section2.generatedOffset.generatedColumn;
        }
      );
      var section = this._sections[sectionIndex];
      if (!section) {
        return {
          source: null,
          line: null,
          column: null,
          name: null
        };
      }
      return section.consumer.originalPositionFor({
        line: needle.generatedLine - (section.generatedOffset.generatedLine - 1),
        column: needle.generatedColumn - (section.generatedOffset.generatedLine === needle.generatedLine ? section.generatedOffset.generatedColumn - 1 : 0),
        bias: aArgs.bias
      });
    };
    IndexedSourceMapConsumer.prototype.hasContentsOfAllSources = function IndexedSourceMapConsumer_hasContentsOfAllSources() {
      return this._sections.every(function(s) {
        return s.consumer.hasContentsOfAllSources();
      });
    };
    IndexedSourceMapConsumer.prototype.sourceContentFor = function IndexedSourceMapConsumer_sourceContentFor(aSource, nullOnMissing) {
      for (var i = 0; i < this._sections.length; i++) {
        var section = this._sections[i];
        var content = section.consumer.sourceContentFor(aSource, true);
        if (content || content === "") {
          return content;
        }
      }
      if (nullOnMissing) {
        return null;
      } else {
        throw new Error('"' + aSource + '" is not in the SourceMap.');
      }
    };
    IndexedSourceMapConsumer.prototype.generatedPositionFor = function IndexedSourceMapConsumer_generatedPositionFor(aArgs) {
      for (var i = 0; i < this._sections.length; i++) {
        var section = this._sections[i];
        if (section.consumer._findSourceIndex(util.getArg(aArgs, "source")) === -1) {
          continue;
        }
        var generatedPosition = section.consumer.generatedPositionFor(aArgs);
        if (generatedPosition) {
          var ret = {
            line: generatedPosition.line + (section.generatedOffset.generatedLine - 1),
            column: generatedPosition.column + (section.generatedOffset.generatedLine === generatedPosition.line ? section.generatedOffset.generatedColumn - 1 : 0)
          };
          return ret;
        }
      }
      return {
        line: null,
        column: null
      };
    };
    IndexedSourceMapConsumer.prototype._parseMappings = function IndexedSourceMapConsumer_parseMappings(aStr, aSourceRoot) {
      this.__generatedMappings = [];
      this.__originalMappings = [];
      for (var i = 0; i < this._sections.length; i++) {
        var section = this._sections[i];
        var sectionMappings = section.consumer._generatedMappings;
        for (var j = 0; j < sectionMappings.length; j++) {
          var mapping = sectionMappings[j];
          var source = section.consumer._sources.at(mapping.source);
          if (source !== null) {
            source = util.computeSourceURL(section.consumer.sourceRoot, source, this._sourceMapURL);
          }
          this._sources.add(source);
          source = this._sources.indexOf(source);
          var name = null;
          if (mapping.name) {
            name = section.consumer._names.at(mapping.name);
            this._names.add(name);
            name = this._names.indexOf(name);
          }
          var adjustedMapping = {
            source,
            generatedLine: mapping.generatedLine + (section.generatedOffset.generatedLine - 1),
            generatedColumn: mapping.generatedColumn + (section.generatedOffset.generatedLine === mapping.generatedLine ? section.generatedOffset.generatedColumn - 1 : 0),
            originalLine: mapping.originalLine,
            originalColumn: mapping.originalColumn,
            name
          };
          this.__generatedMappings.push(adjustedMapping);
          if (typeof adjustedMapping.originalLine === "number") {
            this.__originalMappings.push(adjustedMapping);
          }
        }
      }
      quickSort(this.__generatedMappings, util.compareByGeneratedPositionsDeflated);
      quickSort(this.__originalMappings, util.compareByOriginalPositions);
    };
    exports.IndexedSourceMapConsumer = IndexedSourceMapConsumer;
  }
});

// node_modules/source-map-js/lib/source-node.js
var require_source_node = __commonJS({
  "node_modules/source-map-js/lib/source-node.js"(exports) {
    var SourceMapGenerator = require_source_map_generator().SourceMapGenerator;
    var util = require_util();
    var REGEX_NEWLINE = /(\r?\n)/;
    var NEWLINE_CODE = 10;
    var isSourceNode = "$$$isSourceNode$$$";
    function SourceNode(aLine, aColumn, aSource, aChunks, aName) {
      this.children = [];
      this.sourceContents = {};
      this.line = aLine == null ? null : aLine;
      this.column = aColumn == null ? null : aColumn;
      this.source = aSource == null ? null : aSource;
      this.name = aName == null ? null : aName;
      this[isSourceNode] = true;
      if (aChunks != null) this.add(aChunks);
    }
    SourceNode.fromStringWithSourceMap = function SourceNode_fromStringWithSourceMap(aGeneratedCode, aSourceMapConsumer, aRelativePath) {
      var node = new SourceNode();
      var remainingLines = aGeneratedCode.split(REGEX_NEWLINE);
      var remainingLinesIndex = 0;
      var shiftNextLine = function() {
        var lineContents = getNextLine();
        var newLine = getNextLine() || "";
        return lineContents + newLine;
        function getNextLine() {
          return remainingLinesIndex < remainingLines.length ? remainingLines[remainingLinesIndex++] : void 0;
        }
      };
      var lastGeneratedLine = 1, lastGeneratedColumn = 0;
      var lastMapping = null;
      aSourceMapConsumer.eachMapping(function(mapping) {
        if (lastMapping !== null) {
          if (lastGeneratedLine < mapping.generatedLine) {
            addMappingWithCode(lastMapping, shiftNextLine());
            lastGeneratedLine++;
            lastGeneratedColumn = 0;
          } else {
            var nextLine = remainingLines[remainingLinesIndex] || "";
            var code = nextLine.substr(0, mapping.generatedColumn - lastGeneratedColumn);
            remainingLines[remainingLinesIndex] = nextLine.substr(mapping.generatedColumn - lastGeneratedColumn);
            lastGeneratedColumn = mapping.generatedColumn;
            addMappingWithCode(lastMapping, code);
            lastMapping = mapping;
            return;
          }
        }
        while (lastGeneratedLine < mapping.generatedLine) {
          if (remainingLinesIndex >= remainingLines.length) {
            lastGeneratedLine = mapping.generatedLine;
            break;
          }
          node.add(shiftNextLine());
          lastGeneratedLine++;
        }
        if (lastGeneratedColumn < mapping.generatedColumn) {
          var nextLine = remainingLines[remainingLinesIndex] || "";
          node.add(nextLine.substr(0, mapping.generatedColumn));
          remainingLines[remainingLinesIndex] = nextLine.substr(mapping.generatedColumn);
          lastGeneratedColumn = mapping.generatedColumn;
        }
        lastMapping = mapping;
      }, this);
      if (remainingLinesIndex < remainingLines.length) {
        if (lastMapping) {
          addMappingWithCode(lastMapping, shiftNextLine());
        }
        node.add(remainingLines.splice(remainingLinesIndex).join(""));
      }
      aSourceMapConsumer.sources.forEach(function(sourceFile) {
        var content = aSourceMapConsumer.sourceContentFor(sourceFile);
        if (content != null) {
          if (aRelativePath != null) {
            sourceFile = util.join(aRelativePath, sourceFile);
          }
          node.setSourceContent(sourceFile, content);
        }
      });
      return node;
      function addMappingWithCode(mapping, code) {
        if (mapping === null || mapping.source === void 0) {
          node.add(code);
        } else {
          var source = aRelativePath ? util.join(aRelativePath, mapping.source) : mapping.source;
          node.add(new SourceNode(
            mapping.originalLine,
            mapping.originalColumn,
            source,
            code,
            mapping.name
          ));
        }
      }
    };
    SourceNode.prototype.add = function SourceNode_add(aChunk) {
      if (Array.isArray(aChunk)) {
        aChunk.forEach(function(chunk) {
          this.add(chunk);
        }, this);
      } else if (aChunk[isSourceNode] || typeof aChunk === "string") {
        if (aChunk) {
          this.children.push(aChunk);
        }
      } else {
        throw new TypeError(
          "Expected a SourceNode, string, or an array of SourceNodes and strings. Got " + aChunk
        );
      }
      return this;
    };
    SourceNode.prototype.prepend = function SourceNode_prepend(aChunk) {
      if (Array.isArray(aChunk)) {
        for (var i = aChunk.length - 1; i >= 0; i--) {
          this.prepend(aChunk[i]);
        }
      } else if (aChunk[isSourceNode] || typeof aChunk === "string") {
        this.children.unshift(aChunk);
      } else {
        throw new TypeError(
          "Expected a SourceNode, string, or an array of SourceNodes and strings. Got " + aChunk
        );
      }
      return this;
    };
    SourceNode.prototype.walk = function SourceNode_walk(aFn) {
      var chunk;
      for (var i = 0, len = this.children.length; i < len; i++) {
        chunk = this.children[i];
        if (chunk[isSourceNode]) {
          chunk.walk(aFn);
        } else {
          if (chunk !== "") {
            aFn(chunk, {
              source: this.source,
              line: this.line,
              column: this.column,
              name: this.name
            });
          }
        }
      }
    };
    SourceNode.prototype.join = function SourceNode_join(aSep) {
      var newChildren;
      var i;
      var len = this.children.length;
      if (len > 0) {
        newChildren = [];
        for (i = 0; i < len - 1; i++) {
          newChildren.push(this.children[i]);
          newChildren.push(aSep);
        }
        newChildren.push(this.children[i]);
        this.children = newChildren;
      }
      return this;
    };
    SourceNode.prototype.replaceRight = function SourceNode_replaceRight(aPattern, aReplacement) {
      var lastChild = this.children[this.children.length - 1];
      if (lastChild[isSourceNode]) {
        lastChild.replaceRight(aPattern, aReplacement);
      } else if (typeof lastChild === "string") {
        this.children[this.children.length - 1] = lastChild.replace(aPattern, aReplacement);
      } else {
        this.children.push("".replace(aPattern, aReplacement));
      }
      return this;
    };
    SourceNode.prototype.setSourceContent = function SourceNode_setSourceContent(aSourceFile, aSourceContent) {
      this.sourceContents[util.toSetString(aSourceFile)] = aSourceContent;
    };
    SourceNode.prototype.walkSourceContents = function SourceNode_walkSourceContents(aFn) {
      for (var i = 0, len = this.children.length; i < len; i++) {
        if (this.children[i][isSourceNode]) {
          this.children[i].walkSourceContents(aFn);
        }
      }
      var sources = Object.keys(this.sourceContents);
      for (var i = 0, len = sources.length; i < len; i++) {
        aFn(util.fromSetString(sources[i]), this.sourceContents[sources[i]]);
      }
    };
    SourceNode.prototype.toString = function SourceNode_toString() {
      var str = "";
      this.walk(function(chunk) {
        str += chunk;
      });
      return str;
    };
    SourceNode.prototype.toStringWithSourceMap = function SourceNode_toStringWithSourceMap(aArgs) {
      var generated = {
        code: "",
        line: 1,
        column: 0
      };
      var map = new SourceMapGenerator(aArgs);
      var sourceMappingActive = false;
      var lastOriginalSource = null;
      var lastOriginalLine = null;
      var lastOriginalColumn = null;
      var lastOriginalName = null;
      this.walk(function(chunk, original) {
        generated.code += chunk;
        if (original.source !== null && original.line !== null && original.column !== null) {
          if (lastOriginalSource !== original.source || lastOriginalLine !== original.line || lastOriginalColumn !== original.column || lastOriginalName !== original.name) {
            map.addMapping({
              source: original.source,
              original: {
                line: original.line,
                column: original.column
              },
              generated: {
                line: generated.line,
                column: generated.column
              },
              name: original.name
            });
          }
          lastOriginalSource = original.source;
          lastOriginalLine = original.line;
          lastOriginalColumn = original.column;
          lastOriginalName = original.name;
          sourceMappingActive = true;
        } else if (sourceMappingActive) {
          map.addMapping({
            generated: {
              line: generated.line,
              column: generated.column
            }
          });
          lastOriginalSource = null;
          sourceMappingActive = false;
        }
        for (var idx = 0, length = chunk.length; idx < length; idx++) {
          if (chunk.charCodeAt(idx) === NEWLINE_CODE) {
            generated.line++;
            generated.column = 0;
            if (idx + 1 === length) {
              lastOriginalSource = null;
              sourceMappingActive = false;
            } else if (sourceMappingActive) {
              map.addMapping({
                source: original.source,
                original: {
                  line: original.line,
                  column: original.column
                },
                generated: {
                  line: generated.line,
                  column: generated.column
                },
                name: original.name
              });
            }
          } else {
            generated.column++;
          }
        }
      });
      this.walkSourceContents(function(sourceFile, sourceContent) {
        map.setSourceContent(sourceFile, sourceContent);
      });
      return { code: generated.code, map };
    };
    exports.SourceNode = SourceNode;
  }
});

// node_modules/source-map-js/source-map.js
var require_source_map = __commonJS({
  "node_modules/source-map-js/source-map.js"(exports) {
    exports.SourceMapGenerator = require_source_map_generator().SourceMapGenerator;
    exports.SourceMapConsumer = require_source_map_consumer().SourceMapConsumer;
    exports.SourceNode = require_source_node().SourceNode;
  }
});

// node_modules/js-beautify/js/src/core/output.js
var require_output = __commonJS({
  "node_modules/js-beautify/js/src/core/output.js"(exports, module) {
    "use strict";
    function OutputLine(parent) {
      this.__parent = parent;
      this.__character_count = 0;
      this.__indent_count = -1;
      this.__alignment_count = 0;
      this.__wrap_point_index = 0;
      this.__wrap_point_character_count = 0;
      this.__wrap_point_indent_count = -1;
      this.__wrap_point_alignment_count = 0;
      this.__items = [];
    }
    OutputLine.prototype.clone_empty = function() {
      var line = new OutputLine(this.__parent);
      line.set_indent(this.__indent_count, this.__alignment_count);
      return line;
    };
    OutputLine.prototype.item = function(index) {
      if (index < 0) {
        return this.__items[this.__items.length + index];
      } else {
        return this.__items[index];
      }
    };
    OutputLine.prototype.has_match = function(pattern) {
      for (var lastCheckedOutput = this.__items.length - 1; lastCheckedOutput >= 0; lastCheckedOutput--) {
        if (this.__items[lastCheckedOutput].match(pattern)) {
          return true;
        }
      }
      return false;
    };
    OutputLine.prototype.set_indent = function(indent, alignment) {
      if (this.is_empty()) {
        this.__indent_count = indent || 0;
        this.__alignment_count = alignment || 0;
        this.__character_count = this.__parent.get_indent_size(this.__indent_count, this.__alignment_count);
      }
    };
    OutputLine.prototype._set_wrap_point = function() {
      if (this.__parent.wrap_line_length) {
        this.__wrap_point_index = this.__items.length;
        this.__wrap_point_character_count = this.__character_count;
        this.__wrap_point_indent_count = this.__parent.next_line.__indent_count;
        this.__wrap_point_alignment_count = this.__parent.next_line.__alignment_count;
      }
    };
    OutputLine.prototype._should_wrap = function() {
      return this.__wrap_point_index && this.__character_count > this.__parent.wrap_line_length && this.__wrap_point_character_count > this.__parent.next_line.__character_count;
    };
    OutputLine.prototype._allow_wrap = function() {
      if (this._should_wrap()) {
        this.__parent.add_new_line();
        var next = this.__parent.current_line;
        next.set_indent(this.__wrap_point_indent_count, this.__wrap_point_alignment_count);
        next.__items = this.__items.slice(this.__wrap_point_index);
        this.__items = this.__items.slice(0, this.__wrap_point_index);
        next.__character_count += this.__character_count - this.__wrap_point_character_count;
        this.__character_count = this.__wrap_point_character_count;
        if (next.__items[0] === " ") {
          next.__items.splice(0, 1);
          next.__character_count -= 1;
        }
        return true;
      }
      return false;
    };
    OutputLine.prototype.is_empty = function() {
      return this.__items.length === 0;
    };
    OutputLine.prototype.last = function() {
      if (!this.is_empty()) {
        return this.__items[this.__items.length - 1];
      } else {
        return null;
      }
    };
    OutputLine.prototype.push = function(item) {
      this.__items.push(item);
      var last_newline_index = item.lastIndexOf("\n");
      if (last_newline_index !== -1) {
        this.__character_count = item.length - last_newline_index;
      } else {
        this.__character_count += item.length;
      }
    };
    OutputLine.prototype.pop = function() {
      var item = null;
      if (!this.is_empty()) {
        item = this.__items.pop();
        this.__character_count -= item.length;
      }
      return item;
    };
    OutputLine.prototype._remove_indent = function() {
      if (this.__indent_count > 0) {
        this.__indent_count -= 1;
        this.__character_count -= this.__parent.indent_size;
      }
    };
    OutputLine.prototype._remove_wrap_indent = function() {
      if (this.__wrap_point_indent_count > 0) {
        this.__wrap_point_indent_count -= 1;
      }
    };
    OutputLine.prototype.trim = function() {
      while (this.last() === " ") {
        this.__items.pop();
        this.__character_count -= 1;
      }
    };
    OutputLine.prototype.toString = function() {
      var result = "";
      if (this.is_empty()) {
        if (this.__parent.indent_empty_lines) {
          result = this.__parent.get_indent_string(this.__indent_count);
        }
      } else {
        result = this.__parent.get_indent_string(this.__indent_count, this.__alignment_count);
        result += this.__items.join("");
      }
      return result;
    };
    function IndentStringCache(options, baseIndentString) {
      this.__cache = [""];
      this.__indent_size = options.indent_size;
      this.__indent_string = options.indent_char;
      if (!options.indent_with_tabs) {
        this.__indent_string = new Array(options.indent_size + 1).join(options.indent_char);
      }
      baseIndentString = baseIndentString || "";
      if (options.indent_level > 0) {
        baseIndentString = new Array(options.indent_level + 1).join(this.__indent_string);
      }
      this.__base_string = baseIndentString;
      this.__base_string_length = baseIndentString.length;
    }
    IndentStringCache.prototype.get_indent_size = function(indent, column) {
      var result = this.__base_string_length;
      column = column || 0;
      if (indent < 0) {
        result = 0;
      }
      result += indent * this.__indent_size;
      result += column;
      return result;
    };
    IndentStringCache.prototype.get_indent_string = function(indent_level, column) {
      var result = this.__base_string;
      column = column || 0;
      if (indent_level < 0) {
        indent_level = 0;
        result = "";
      }
      column += indent_level * this.__indent_size;
      this.__ensure_cache(column);
      result += this.__cache[column];
      return result;
    };
    IndentStringCache.prototype.__ensure_cache = function(column) {
      while (column >= this.__cache.length) {
        this.__add_column();
      }
    };
    IndentStringCache.prototype.__add_column = function() {
      var column = this.__cache.length;
      var indent = 0;
      var result = "";
      if (this.__indent_size && column >= this.__indent_size) {
        indent = Math.floor(column / this.__indent_size);
        column -= indent * this.__indent_size;
        result = new Array(indent + 1).join(this.__indent_string);
      }
      if (column) {
        result += new Array(column + 1).join(" ");
      }
      this.__cache.push(result);
    };
    function Output(options, baseIndentString) {
      this.__indent_cache = new IndentStringCache(options, baseIndentString);
      this.raw = false;
      this._end_with_newline = options.end_with_newline;
      this.indent_size = options.indent_size;
      this.wrap_line_length = options.wrap_line_length;
      this.indent_empty_lines = options.indent_empty_lines;
      this.__lines = [];
      this.previous_line = null;
      this.current_line = null;
      this.next_line = new OutputLine(this);
      this.space_before_token = false;
      this.non_breaking_space = false;
      this.previous_token_wrapped = false;
      this.__add_outputline();
    }
    Output.prototype.__add_outputline = function() {
      this.previous_line = this.current_line;
      this.current_line = this.next_line.clone_empty();
      this.__lines.push(this.current_line);
    };
    Output.prototype.get_line_number = function() {
      return this.__lines.length;
    };
    Output.prototype.get_indent_string = function(indent, column) {
      return this.__indent_cache.get_indent_string(indent, column);
    };
    Output.prototype.get_indent_size = function(indent, column) {
      return this.__indent_cache.get_indent_size(indent, column);
    };
    Output.prototype.is_empty = function() {
      return !this.previous_line && this.current_line.is_empty();
    };
    Output.prototype.add_new_line = function(force_newline) {
      if (this.is_empty() || !force_newline && this.just_added_newline()) {
        return false;
      }
      if (!this.raw) {
        this.__add_outputline();
      }
      return true;
    };
    Output.prototype.get_code = function(eol) {
      this.trim(true);
      var last_item = this.current_line.pop();
      if (last_item) {
        if (last_item[last_item.length - 1] === "\n") {
          last_item = last_item.replace(/\n+$/g, "");
        }
        this.current_line.push(last_item);
      }
      if (this._end_with_newline) {
        this.__add_outputline();
      }
      var sweet_code = this.__lines.join("\n");
      if (eol !== "\n") {
        sweet_code = sweet_code.replace(/[\n]/g, eol);
      }
      return sweet_code;
    };
    Output.prototype.set_wrap_point = function() {
      this.current_line._set_wrap_point();
    };
    Output.prototype.set_indent = function(indent, alignment) {
      indent = indent || 0;
      alignment = alignment || 0;
      this.next_line.set_indent(indent, alignment);
      if (this.__lines.length > 1) {
        this.current_line.set_indent(indent, alignment);
        return true;
      }
      this.current_line.set_indent();
      return false;
    };
    Output.prototype.add_raw_token = function(token) {
      for (var x = 0; x < token.newlines; x++) {
        this.__add_outputline();
      }
      this.current_line.set_indent(-1);
      this.current_line.push(token.whitespace_before);
      this.current_line.push(token.text);
      this.space_before_token = false;
      this.non_breaking_space = false;
      this.previous_token_wrapped = false;
    };
    Output.prototype.add_token = function(printable_token) {
      this.__add_space_before_token();
      this.current_line.push(printable_token);
      this.space_before_token = false;
      this.non_breaking_space = false;
      this.previous_token_wrapped = this.current_line._allow_wrap();
    };
    Output.prototype.__add_space_before_token = function() {
      if (this.space_before_token && !this.just_added_newline()) {
        if (!this.non_breaking_space) {
          this.set_wrap_point();
        }
        this.current_line.push(" ");
      }
    };
    Output.prototype.remove_indent = function(index) {
      var output_length = this.__lines.length;
      while (index < output_length) {
        this.__lines[index]._remove_indent();
        index++;
      }
      this.current_line._remove_wrap_indent();
    };
    Output.prototype.trim = function(eat_newlines) {
      eat_newlines = eat_newlines === void 0 ? false : eat_newlines;
      this.current_line.trim();
      while (eat_newlines && this.__lines.length > 1 && this.current_line.is_empty()) {
        this.__lines.pop();
        this.current_line = this.__lines[this.__lines.length - 1];
        this.current_line.trim();
      }
      this.previous_line = this.__lines.length > 1 ? this.__lines[this.__lines.length - 2] : null;
    };
    Output.prototype.just_added_newline = function() {
      return this.current_line.is_empty();
    };
    Output.prototype.just_added_blankline = function() {
      return this.is_empty() || this.current_line.is_empty() && this.previous_line.is_empty();
    };
    Output.prototype.ensure_empty_line_above = function(starts_with, ends_with) {
      var index = this.__lines.length - 2;
      while (index >= 0) {
        var potentialEmptyLine = this.__lines[index];
        if (potentialEmptyLine.is_empty()) {
          break;
        } else if (potentialEmptyLine.item(0).indexOf(starts_with) !== 0 && potentialEmptyLine.item(-1) !== ends_with) {
          this.__lines.splice(index + 1, 0, new OutputLine(this));
          this.previous_line = this.__lines[this.__lines.length - 2];
          break;
        }
        index--;
      }
    };
    module.exports.Output = Output;
  }
});

// node_modules/js-beautify/js/src/core/token.js
var require_token = __commonJS({
  "node_modules/js-beautify/js/src/core/token.js"(exports, module) {
    "use strict";
    function Token(type, text, newlines, whitespace_before) {
      this.type = type;
      this.text = text;
      this.comments_before = null;
      this.newlines = newlines || 0;
      this.whitespace_before = whitespace_before || "";
      this.parent = null;
      this.next = null;
      this.previous = null;
      this.opened = null;
      this.closed = null;
      this.directives = null;
    }
    module.exports.Token = Token;
  }
});

// node_modules/js-beautify/js/src/javascript/acorn.js
var require_acorn = __commonJS({
  "node_modules/js-beautify/js/src/javascript/acorn.js"(exports) {
    "use strict";
    var baseASCIIidentifierStartChars = "\\x23\\x24\\x40\\x41-\\x5a\\x5f\\x61-\\x7a";
    var baseASCIIidentifierChars = "\\x24\\x30-\\x39\\x41-\\x5a\\x5f\\x61-\\x7a";
    var nonASCIIidentifierStartChars = "\\xaa\\xb5\\xba\\xc0-\\xd6\\xd8-\\xf6\\xf8-\\u02c1\\u02c6-\\u02d1\\u02e0-\\u02e4\\u02ec\\u02ee\\u0370-\\u0374\\u0376\\u0377\\u037a-\\u037d\\u0386\\u0388-\\u038a\\u038c\\u038e-\\u03a1\\u03a3-\\u03f5\\u03f7-\\u0481\\u048a-\\u0527\\u0531-\\u0556\\u0559\\u0561-\\u0587\\u05d0-\\u05ea\\u05f0-\\u05f2\\u0620-\\u064a\\u066e\\u066f\\u0671-\\u06d3\\u06d5\\u06e5\\u06e6\\u06ee\\u06ef\\u06fa-\\u06fc\\u06ff\\u0710\\u0712-\\u072f\\u074d-\\u07a5\\u07b1\\u07ca-\\u07ea\\u07f4\\u07f5\\u07fa\\u0800-\\u0815\\u081a\\u0824\\u0828\\u0840-\\u0858\\u08a0\\u08a2-\\u08ac\\u0904-\\u0939\\u093d\\u0950\\u0958-\\u0961\\u0971-\\u0977\\u0979-\\u097f\\u0985-\\u098c\\u098f\\u0990\\u0993-\\u09a8\\u09aa-\\u09b0\\u09b2\\u09b6-\\u09b9\\u09bd\\u09ce\\u09dc\\u09dd\\u09df-\\u09e1\\u09f0\\u09f1\\u0a05-\\u0a0a\\u0a0f\\u0a10\\u0a13-\\u0a28\\u0a2a-\\u0a30\\u0a32\\u0a33\\u0a35\\u0a36\\u0a38\\u0a39\\u0a59-\\u0a5c\\u0a5e\\u0a72-\\u0a74\\u0a85-\\u0a8d\\u0a8f-\\u0a91\\u0a93-\\u0aa8\\u0aaa-\\u0ab0\\u0ab2\\u0ab3\\u0ab5-\\u0ab9\\u0abd\\u0ad0\\u0ae0\\u0ae1\\u0b05-\\u0b0c\\u0b0f\\u0b10\\u0b13-\\u0b28\\u0b2a-\\u0b30\\u0b32\\u0b33\\u0b35-\\u0b39\\u0b3d\\u0b5c\\u0b5d\\u0b5f-\\u0b61\\u0b71\\u0b83\\u0b85-\\u0b8a\\u0b8e-\\u0b90\\u0b92-\\u0b95\\u0b99\\u0b9a\\u0b9c\\u0b9e\\u0b9f\\u0ba3\\u0ba4\\u0ba8-\\u0baa\\u0bae-\\u0bb9\\u0bd0\\u0c05-\\u0c0c\\u0c0e-\\u0c10\\u0c12-\\u0c28\\u0c2a-\\u0c33\\u0c35-\\u0c39\\u0c3d\\u0c58\\u0c59\\u0c60\\u0c61\\u0c85-\\u0c8c\\u0c8e-\\u0c90\\u0c92-\\u0ca8\\u0caa-\\u0cb3\\u0cb5-\\u0cb9\\u0cbd\\u0cde\\u0ce0\\u0ce1\\u0cf1\\u0cf2\\u0d05-\\u0d0c\\u0d0e-\\u0d10\\u0d12-\\u0d3a\\u0d3d\\u0d4e\\u0d60\\u0d61\\u0d7a-\\u0d7f\\u0d85-\\u0d96\\u0d9a-\\u0db1\\u0db3-\\u0dbb\\u0dbd\\u0dc0-\\u0dc6\\u0e01-\\u0e30\\u0e32\\u0e33\\u0e40-\\u0e46\\u0e81\\u0e82\\u0e84\\u0e87\\u0e88\\u0e8a\\u0e8d\\u0e94-\\u0e97\\u0e99-\\u0e9f\\u0ea1-\\u0ea3\\u0ea5\\u0ea7\\u0eaa\\u0eab\\u0ead-\\u0eb0\\u0eb2\\u0eb3\\u0ebd\\u0ec0-\\u0ec4\\u0ec6\\u0edc-\\u0edf\\u0f00\\u0f40-\\u0f47\\u0f49-\\u0f6c\\u0f88-\\u0f8c\\u1000-\\u102a\\u103f\\u1050-\\u1055\\u105a-\\u105d\\u1061\\u1065\\u1066\\u106e-\\u1070\\u1075-\\u1081\\u108e\\u10a0-\\u10c5\\u10c7\\u10cd\\u10d0-\\u10fa\\u10fc-\\u1248\\u124a-\\u124d\\u1250-\\u1256\\u1258\\u125a-\\u125d\\u1260-\\u1288\\u128a-\\u128d\\u1290-\\u12b0\\u12b2-\\u12b5\\u12b8-\\u12be\\u12c0\\u12c2-\\u12c5\\u12c8-\\u12d6\\u12d8-\\u1310\\u1312-\\u1315\\u1318-\\u135a\\u1380-\\u138f\\u13a0-\\u13f4\\u1401-\\u166c\\u166f-\\u167f\\u1681-\\u169a\\u16a0-\\u16ea\\u16ee-\\u16f0\\u1700-\\u170c\\u170e-\\u1711\\u1720-\\u1731\\u1740-\\u1751\\u1760-\\u176c\\u176e-\\u1770\\u1780-\\u17b3\\u17d7\\u17dc\\u1820-\\u1877\\u1880-\\u18a8\\u18aa\\u18b0-\\u18f5\\u1900-\\u191c\\u1950-\\u196d\\u1970-\\u1974\\u1980-\\u19ab\\u19c1-\\u19c7\\u1a00-\\u1a16\\u1a20-\\u1a54\\u1aa7\\u1b05-\\u1b33\\u1b45-\\u1b4b\\u1b83-\\u1ba0\\u1bae\\u1baf\\u1bba-\\u1be5\\u1c00-\\u1c23\\u1c4d-\\u1c4f\\u1c5a-\\u1c7d\\u1ce9-\\u1cec\\u1cee-\\u1cf1\\u1cf5\\u1cf6\\u1d00-\\u1dbf\\u1e00-\\u1f15\\u1f18-\\u1f1d\\u1f20-\\u1f45\\u1f48-\\u1f4d\\u1f50-\\u1f57\\u1f59\\u1f5b\\u1f5d\\u1f5f-\\u1f7d\\u1f80-\\u1fb4\\u1fb6-\\u1fbc\\u1fbe\\u1fc2-\\u1fc4\\u1fc6-\\u1fcc\\u1fd0-\\u1fd3\\u1fd6-\\u1fdb\\u1fe0-\\u1fec\\u1ff2-\\u1ff4\\u1ff6-\\u1ffc\\u2071\\u207f\\u2090-\\u209c\\u2102\\u2107\\u210a-\\u2113\\u2115\\u2119-\\u211d\\u2124\\u2126\\u2128\\u212a-\\u212d\\u212f-\\u2139\\u213c-\\u213f\\u2145-\\u2149\\u214e\\u2160-\\u2188\\u2c00-\\u2c2e\\u2c30-\\u2c5e\\u2c60-\\u2ce4\\u2ceb-\\u2cee\\u2cf2\\u2cf3\\u2d00-\\u2d25\\u2d27\\u2d2d\\u2d30-\\u2d67\\u2d6f\\u2d80-\\u2d96\\u2da0-\\u2da6\\u2da8-\\u2dae\\u2db0-\\u2db6\\u2db8-\\u2dbe\\u2dc0-\\u2dc6\\u2dc8-\\u2dce\\u2dd0-\\u2dd6\\u2dd8-\\u2dde\\u2e2f\\u3005-\\u3007\\u3021-\\u3029\\u3031-\\u3035\\u3038-\\u303c\\u3041-\\u3096\\u309d-\\u309f\\u30a1-\\u30fa\\u30fc-\\u30ff\\u3105-\\u312d\\u3131-\\u318e\\u31a0-\\u31ba\\u31f0-\\u31ff\\u3400-\\u4db5\\u4e00-\\u9fcc\\ua000-\\ua48c\\ua4d0-\\ua4fd\\ua500-\\ua60c\\ua610-\\ua61f\\ua62a\\ua62b\\ua640-\\ua66e\\ua67f-\\ua697\\ua6a0-\\ua6ef\\ua717-\\ua71f\\ua722-\\ua788\\ua78b-\\ua78e\\ua790-\\ua793\\ua7a0-\\ua7aa\\ua7f8-\\ua801\\ua803-\\ua805\\ua807-\\ua80a\\ua80c-\\ua822\\ua840-\\ua873\\ua882-\\ua8b3\\ua8f2-\\ua8f7\\ua8fb\\ua90a-\\ua925\\ua930-\\ua946\\ua960-\\ua97c\\ua984-\\ua9b2\\ua9cf\\uaa00-\\uaa28\\uaa40-\\uaa42\\uaa44-\\uaa4b\\uaa60-\\uaa76\\uaa7a\\uaa80-\\uaaaf\\uaab1\\uaab5\\uaab6\\uaab9-\\uaabd\\uaac0\\uaac2\\uaadb-\\uaadd\\uaae0-\\uaaea\\uaaf2-\\uaaf4\\uab01-\\uab06\\uab09-\\uab0e\\uab11-\\uab16\\uab20-\\uab26\\uab28-\\uab2e\\uabc0-\\uabe2\\uac00-\\ud7a3\\ud7b0-\\ud7c6\\ud7cb-\\ud7fb\\uf900-\\ufa6d\\ufa70-\\ufad9\\ufb00-\\ufb06\\ufb13-\\ufb17\\ufb1d\\ufb1f-\\ufb28\\ufb2a-\\ufb36\\ufb38-\\ufb3c\\ufb3e\\ufb40\\ufb41\\ufb43\\ufb44\\ufb46-\\ufbb1\\ufbd3-\\ufd3d\\ufd50-\\ufd8f\\ufd92-\\ufdc7\\ufdf0-\\ufdfb\\ufe70-\\ufe74\\ufe76-\\ufefc\\uff21-\\uff3a\\uff41-\\uff5a\\uff66-\\uffbe\\uffc2-\\uffc7\\uffca-\\uffcf\\uffd2-\\uffd7\\uffda-\\uffdc";
    var nonASCIIidentifierChars = "\\u0300-\\u036f\\u0483-\\u0487\\u0591-\\u05bd\\u05bf\\u05c1\\u05c2\\u05c4\\u05c5\\u05c7\\u0610-\\u061a\\u0620-\\u0649\\u0672-\\u06d3\\u06e7-\\u06e8\\u06fb-\\u06fc\\u0730-\\u074a\\u0800-\\u0814\\u081b-\\u0823\\u0825-\\u0827\\u0829-\\u082d\\u0840-\\u0857\\u08e4-\\u08fe\\u0900-\\u0903\\u093a-\\u093c\\u093e-\\u094f\\u0951-\\u0957\\u0962-\\u0963\\u0966-\\u096f\\u0981-\\u0983\\u09bc\\u09be-\\u09c4\\u09c7\\u09c8\\u09d7\\u09df-\\u09e0\\u0a01-\\u0a03\\u0a3c\\u0a3e-\\u0a42\\u0a47\\u0a48\\u0a4b-\\u0a4d\\u0a51\\u0a66-\\u0a71\\u0a75\\u0a81-\\u0a83\\u0abc\\u0abe-\\u0ac5\\u0ac7-\\u0ac9\\u0acb-\\u0acd\\u0ae2-\\u0ae3\\u0ae6-\\u0aef\\u0b01-\\u0b03\\u0b3c\\u0b3e-\\u0b44\\u0b47\\u0b48\\u0b4b-\\u0b4d\\u0b56\\u0b57\\u0b5f-\\u0b60\\u0b66-\\u0b6f\\u0b82\\u0bbe-\\u0bc2\\u0bc6-\\u0bc8\\u0bca-\\u0bcd\\u0bd7\\u0be6-\\u0bef\\u0c01-\\u0c03\\u0c46-\\u0c48\\u0c4a-\\u0c4d\\u0c55\\u0c56\\u0c62-\\u0c63\\u0c66-\\u0c6f\\u0c82\\u0c83\\u0cbc\\u0cbe-\\u0cc4\\u0cc6-\\u0cc8\\u0cca-\\u0ccd\\u0cd5\\u0cd6\\u0ce2-\\u0ce3\\u0ce6-\\u0cef\\u0d02\\u0d03\\u0d46-\\u0d48\\u0d57\\u0d62-\\u0d63\\u0d66-\\u0d6f\\u0d82\\u0d83\\u0dca\\u0dcf-\\u0dd4\\u0dd6\\u0dd8-\\u0ddf\\u0df2\\u0df3\\u0e34-\\u0e3a\\u0e40-\\u0e45\\u0e50-\\u0e59\\u0eb4-\\u0eb9\\u0ec8-\\u0ecd\\u0ed0-\\u0ed9\\u0f18\\u0f19\\u0f20-\\u0f29\\u0f35\\u0f37\\u0f39\\u0f41-\\u0f47\\u0f71-\\u0f84\\u0f86-\\u0f87\\u0f8d-\\u0f97\\u0f99-\\u0fbc\\u0fc6\\u1000-\\u1029\\u1040-\\u1049\\u1067-\\u106d\\u1071-\\u1074\\u1082-\\u108d\\u108f-\\u109d\\u135d-\\u135f\\u170e-\\u1710\\u1720-\\u1730\\u1740-\\u1750\\u1772\\u1773\\u1780-\\u17b2\\u17dd\\u17e0-\\u17e9\\u180b-\\u180d\\u1810-\\u1819\\u1920-\\u192b\\u1930-\\u193b\\u1951-\\u196d\\u19b0-\\u19c0\\u19c8-\\u19c9\\u19d0-\\u19d9\\u1a00-\\u1a15\\u1a20-\\u1a53\\u1a60-\\u1a7c\\u1a7f-\\u1a89\\u1a90-\\u1a99\\u1b46-\\u1b4b\\u1b50-\\u1b59\\u1b6b-\\u1b73\\u1bb0-\\u1bb9\\u1be6-\\u1bf3\\u1c00-\\u1c22\\u1c40-\\u1c49\\u1c5b-\\u1c7d\\u1cd0-\\u1cd2\\u1d00-\\u1dbe\\u1e01-\\u1f15\\u200c\\u200d\\u203f\\u2040\\u2054\\u20d0-\\u20dc\\u20e1\\u20e5-\\u20f0\\u2d81-\\u2d96\\u2de0-\\u2dff\\u3021-\\u3028\\u3099\\u309a\\ua640-\\ua66d\\ua674-\\ua67d\\ua69f\\ua6f0-\\ua6f1\\ua7f8-\\ua800\\ua806\\ua80b\\ua823-\\ua827\\ua880-\\ua881\\ua8b4-\\ua8c4\\ua8d0-\\ua8d9\\ua8f3-\\ua8f7\\ua900-\\ua909\\ua926-\\ua92d\\ua930-\\ua945\\ua980-\\ua983\\ua9b3-\\ua9c0\\uaa00-\\uaa27\\uaa40-\\uaa41\\uaa4c-\\uaa4d\\uaa50-\\uaa59\\uaa7b\\uaae0-\\uaae9\\uaaf2-\\uaaf3\\uabc0-\\uabe1\\uabec\\uabed\\uabf0-\\uabf9\\ufb20-\\ufb28\\ufe00-\\ufe0f\\ufe20-\\ufe26\\ufe33\\ufe34\\ufe4d-\\ufe4f\\uff10-\\uff19\\uff3f";
    var unicodeEscapeOrCodePoint = "\\\\u[0-9a-fA-F]{4}|\\\\u\\{[0-9a-fA-F]+\\}";
    var identifierStart = "(?:" + unicodeEscapeOrCodePoint + "|[" + baseASCIIidentifierStartChars + nonASCIIidentifierStartChars + "])";
    var identifierChars = "(?:" + unicodeEscapeOrCodePoint + "|[" + baseASCIIidentifierChars + nonASCIIidentifierStartChars + nonASCIIidentifierChars + "])*";
    exports.identifier = new RegExp(identifierStart + identifierChars, "g");
    exports.identifierStart = new RegExp(identifierStart);
    exports.identifierMatch = new RegExp("(?:" + unicodeEscapeOrCodePoint + "|[" + baseASCIIidentifierChars + nonASCIIidentifierStartChars + nonASCIIidentifierChars + "])+");
    exports.newline = /[\n\r\u2028\u2029]/;
    exports.lineBreak = new RegExp("\r\n|" + exports.newline.source);
    exports.allLineBreaks = new RegExp(exports.lineBreak.source, "g");
  }
});

// node_modules/js-beautify/js/src/core/options.js
var require_options = __commonJS({
  "node_modules/js-beautify/js/src/core/options.js"(exports, module) {
    "use strict";
    function Options(options, merge_child_field) {
      this.raw_options = _mergeOpts(options, merge_child_field);
      this.disabled = this._get_boolean("disabled");
      this.eol = this._get_characters("eol", "auto");
      this.end_with_newline = this._get_boolean("end_with_newline");
      this.indent_size = this._get_number("indent_size", 4);
      this.indent_char = this._get_characters("indent_char", " ");
      this.indent_level = this._get_number("indent_level");
      this.preserve_newlines = this._get_boolean("preserve_newlines", true);
      this.max_preserve_newlines = this._get_number("max_preserve_newlines", 32786);
      if (!this.preserve_newlines) {
        this.max_preserve_newlines = 0;
      }
      this.indent_with_tabs = this._get_boolean("indent_with_tabs", this.indent_char === "	");
      if (this.indent_with_tabs) {
        this.indent_char = "	";
        if (this.indent_size === 1) {
          this.indent_size = 4;
        }
      }
      this.wrap_line_length = this._get_number("wrap_line_length", this._get_number("max_char"));
      this.indent_empty_lines = this._get_boolean("indent_empty_lines");
      this.templating = this._get_selection_list("templating", ["auto", "none", "angular", "django", "erb", "handlebars", "php", "smarty"], ["auto"]);
    }
    Options.prototype._get_array = function(name, default_value) {
      var option_value = this.raw_options[name];
      var result = default_value || [];
      if (typeof option_value === "object") {
        if (option_value !== null && typeof option_value.concat === "function") {
          result = option_value.concat();
        }
      } else if (typeof option_value === "string") {
        result = option_value.split(/[^a-zA-Z0-9_\/\-]+/);
      }
      return result;
    };
    Options.prototype._get_boolean = function(name, default_value) {
      var option_value = this.raw_options[name];
      var result = option_value === void 0 ? !!default_value : !!option_value;
      return result;
    };
    Options.prototype._get_characters = function(name, default_value) {
      var option_value = this.raw_options[name];
      var result = default_value || "";
      if (typeof option_value === "string") {
        result = option_value.replace(/\\r/, "\r").replace(/\\n/, "\n").replace(/\\t/, "	");
      }
      return result;
    };
    Options.prototype._get_number = function(name, default_value) {
      var option_value = this.raw_options[name];
      default_value = parseInt(default_value, 10);
      if (isNaN(default_value)) {
        default_value = 0;
      }
      var result = parseInt(option_value, 10);
      if (isNaN(result)) {
        result = default_value;
      }
      return result;
    };
    Options.prototype._get_selection = function(name, selection_list, default_value) {
      var result = this._get_selection_list(name, selection_list, default_value);
      if (result.length !== 1) {
        throw new Error(
          "Invalid Option Value: The option '" + name + "' can only be one of the following values:\n" + selection_list + "\nYou passed in: '" + this.raw_options[name] + "'"
        );
      }
      return result[0];
    };
    Options.prototype._get_selection_list = function(name, selection_list, default_value) {
      if (!selection_list || selection_list.length === 0) {
        throw new Error("Selection list cannot be empty.");
      }
      default_value = default_value || [selection_list[0]];
      if (!this._is_valid_selection(default_value, selection_list)) {
        throw new Error("Invalid Default Value!");
      }
      var result = this._get_array(name, default_value);
      if (!this._is_valid_selection(result, selection_list)) {
        throw new Error(
          "Invalid Option Value: The option '" + name + "' can contain only the following values:\n" + selection_list + "\nYou passed in: '" + this.raw_options[name] + "'"
        );
      }
      return result;
    };
    Options.prototype._is_valid_selection = function(result, selection_list) {
      return result.length && selection_list.length && !result.some(function(item) {
        return selection_list.indexOf(item) === -1;
      });
    };
    function _mergeOpts(allOptions, childFieldName) {
      var finalOpts = {};
      allOptions = _normalizeOpts(allOptions);
      var name;
      for (name in allOptions) {
        if (name !== childFieldName) {
          finalOpts[name] = allOptions[name];
        }
      }
      if (childFieldName && allOptions[childFieldName]) {
        for (name in allOptions[childFieldName]) {
          finalOpts[name] = allOptions[childFieldName][name];
        }
      }
      return finalOpts;
    }
    function _normalizeOpts(options) {
      var convertedOpts = {};
      var key;
      for (key in options) {
        var newKey = key.replace(/-/g, "_");
        convertedOpts[newKey] = options[key];
      }
      return convertedOpts;
    }
    module.exports.Options = Options;
    module.exports.normalizeOpts = _normalizeOpts;
    module.exports.mergeOpts = _mergeOpts;
  }
});

// node_modules/js-beautify/js/src/javascript/options.js
var require_options2 = __commonJS({
  "node_modules/js-beautify/js/src/javascript/options.js"(exports, module) {
    "use strict";
    var BaseOptions = require_options().Options;
    var validPositionValues = ["before-newline", "after-newline", "preserve-newline"];
    function Options(options) {
      BaseOptions.call(this, options, "js");
      var raw_brace_style = this.raw_options.brace_style || null;
      if (raw_brace_style === "expand-strict") {
        this.raw_options.brace_style = "expand";
      } else if (raw_brace_style === "collapse-preserve-inline") {
        this.raw_options.brace_style = "collapse,preserve-inline";
      } else if (this.raw_options.braces_on_own_line !== void 0) {
        this.raw_options.brace_style = this.raw_options.braces_on_own_line ? "expand" : "collapse";
      }
      var brace_style_split = this._get_selection_list("brace_style", ["collapse", "expand", "end-expand", "none", "preserve-inline"]);
      this.brace_preserve_inline = false;
      this.brace_style = "collapse";
      for (var bs = 0; bs < brace_style_split.length; bs++) {
        if (brace_style_split[bs] === "preserve-inline") {
          this.brace_preserve_inline = true;
        } else {
          this.brace_style = brace_style_split[bs];
        }
      }
      this.unindent_chained_methods = this._get_boolean("unindent_chained_methods");
      this.break_chained_methods = this._get_boolean("break_chained_methods");
      this.space_in_paren = this._get_boolean("space_in_paren");
      this.space_in_empty_paren = this._get_boolean("space_in_empty_paren");
      this.jslint_happy = this._get_boolean("jslint_happy");
      this.space_after_anon_function = this._get_boolean("space_after_anon_function");
      this.space_after_named_function = this._get_boolean("space_after_named_function");
      this.keep_array_indentation = this._get_boolean("keep_array_indentation");
      this.space_before_conditional = this._get_boolean("space_before_conditional", true);
      this.unescape_strings = this._get_boolean("unescape_strings");
      this.e4x = this._get_boolean("e4x");
      this.comma_first = this._get_boolean("comma_first");
      this.operator_position = this._get_selection("operator_position", validPositionValues);
      this.test_output_raw = this._get_boolean("test_output_raw");
      if (this.jslint_happy) {
        this.space_after_anon_function = true;
      }
    }
    Options.prototype = new BaseOptions();
    module.exports.Options = Options;
  }
});

// node_modules/js-beautify/js/src/core/inputscanner.js
var require_inputscanner = __commonJS({
  "node_modules/js-beautify/js/src/core/inputscanner.js"(exports, module) {
    "use strict";
    var regexp_has_sticky = RegExp.prototype.hasOwnProperty("sticky");
    function InputScanner(input_string) {
      this.__input = input_string || "";
      this.__input_length = this.__input.length;
      this.__position = 0;
    }
    InputScanner.prototype.restart = function() {
      this.__position = 0;
    };
    InputScanner.prototype.back = function() {
      if (this.__position > 0) {
        this.__position -= 1;
      }
    };
    InputScanner.prototype.hasNext = function() {
      return this.__position < this.__input_length;
    };
    InputScanner.prototype.next = function() {
      var val = null;
      if (this.hasNext()) {
        val = this.__input.charAt(this.__position);
        this.__position += 1;
      }
      return val;
    };
    InputScanner.prototype.peek = function(index) {
      var val = null;
      index = index || 0;
      index += this.__position;
      if (index >= 0 && index < this.__input_length) {
        val = this.__input.charAt(index);
      }
      return val;
    };
    InputScanner.prototype.__match = function(pattern, index) {
      pattern.lastIndex = index;
      var pattern_match = pattern.exec(this.__input);
      if (pattern_match && !(regexp_has_sticky && pattern.sticky)) {
        if (pattern_match.index !== index) {
          pattern_match = null;
        }
      }
      return pattern_match;
    };
    InputScanner.prototype.test = function(pattern, index) {
      index = index || 0;
      index += this.__position;
      if (index >= 0 && index < this.__input_length) {
        return !!this.__match(pattern, index);
      } else {
        return false;
      }
    };
    InputScanner.prototype.testChar = function(pattern, index) {
      var val = this.peek(index);
      pattern.lastIndex = 0;
      return val !== null && pattern.test(val);
    };
    InputScanner.prototype.match = function(pattern) {
      var pattern_match = this.__match(pattern, this.__position);
      if (pattern_match) {
        this.__position += pattern_match[0].length;
      } else {
        pattern_match = null;
      }
      return pattern_match;
    };
    InputScanner.prototype.read = function(starting_pattern, until_pattern, until_after) {
      var val = "";
      var match;
      if (starting_pattern) {
        match = this.match(starting_pattern);
        if (match) {
          val += match[0];
        }
      }
      if (until_pattern && (match || !starting_pattern)) {
        val += this.readUntil(until_pattern, until_after);
      }
      return val;
    };
    InputScanner.prototype.readUntil = function(pattern, until_after) {
      var val = "";
      var match_index = this.__position;
      pattern.lastIndex = this.__position;
      var pattern_match = pattern.exec(this.__input);
      if (pattern_match) {
        match_index = pattern_match.index;
        if (until_after) {
          match_index += pattern_match[0].length;
        }
      } else {
        match_index = this.__input_length;
      }
      val = this.__input.substring(this.__position, match_index);
      this.__position = match_index;
      return val;
    };
    InputScanner.prototype.readUntilAfter = function(pattern) {
      return this.readUntil(pattern, true);
    };
    InputScanner.prototype.get_regexp = function(pattern, match_from) {
      var result = null;
      var flags = "g";
      if (match_from && regexp_has_sticky) {
        flags = "y";
      }
      if (typeof pattern === "string" && pattern !== "") {
        result = new RegExp(pattern, flags);
      } else if (pattern) {
        result = new RegExp(pattern.source, flags);
      }
      return result;
    };
    InputScanner.prototype.get_literal_regexp = function(literal_string) {
      return RegExp(literal_string.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&"));
    };
    InputScanner.prototype.peekUntilAfter = function(pattern) {
      var start = this.__position;
      var val = this.readUntilAfter(pattern);
      this.__position = start;
      return val;
    };
    InputScanner.prototype.lookBack = function(testVal) {
      var start = this.__position - 1;
      return start >= testVal.length && this.__input.substring(start - testVal.length, start).toLowerCase() === testVal;
    };
    module.exports.InputScanner = InputScanner;
  }
});

// node_modules/js-beautify/js/src/core/tokenstream.js
var require_tokenstream = __commonJS({
  "node_modules/js-beautify/js/src/core/tokenstream.js"(exports, module) {
    "use strict";
    function TokenStream(parent_token) {
      this.__tokens = [];
      this.__tokens_length = this.__tokens.length;
      this.__position = 0;
      this.__parent_token = parent_token;
    }
    TokenStream.prototype.restart = function() {
      this.__position = 0;
    };
    TokenStream.prototype.isEmpty = function() {
      return this.__tokens_length === 0;
    };
    TokenStream.prototype.hasNext = function() {
      return this.__position < this.__tokens_length;
    };
    TokenStream.prototype.next = function() {
      var val = null;
      if (this.hasNext()) {
        val = this.__tokens[this.__position];
        this.__position += 1;
      }
      return val;
    };
    TokenStream.prototype.peek = function(index) {
      var val = null;
      index = index || 0;
      index += this.__position;
      if (index >= 0 && index < this.__tokens_length) {
        val = this.__tokens[index];
      }
      return val;
    };
    TokenStream.prototype.add = function(token) {
      if (this.__parent_token) {
        token.parent = this.__parent_token;
      }
      this.__tokens.push(token);
      this.__tokens_length += 1;
    };
    module.exports.TokenStream = TokenStream;
  }
});

// node_modules/js-beautify/js/src/core/pattern.js
var require_pattern = __commonJS({
  "node_modules/js-beautify/js/src/core/pattern.js"(exports, module) {
    "use strict";
    function Pattern(input_scanner, parent) {
      this._input = input_scanner;
      this._starting_pattern = null;
      this._match_pattern = null;
      this._until_pattern = null;
      this._until_after = false;
      if (parent) {
        this._starting_pattern = this._input.get_regexp(parent._starting_pattern, true);
        this._match_pattern = this._input.get_regexp(parent._match_pattern, true);
        this._until_pattern = this._input.get_regexp(parent._until_pattern);
        this._until_after = parent._until_after;
      }
    }
    Pattern.prototype.read = function() {
      var result = this._input.read(this._starting_pattern);
      if (!this._starting_pattern || result) {
        result += this._input.read(this._match_pattern, this._until_pattern, this._until_after);
      }
      return result;
    };
    Pattern.prototype.read_match = function() {
      return this._input.match(this._match_pattern);
    };
    Pattern.prototype.until_after = function(pattern) {
      var result = this._create();
      result._until_after = true;
      result._until_pattern = this._input.get_regexp(pattern);
      result._update();
      return result;
    };
    Pattern.prototype.until = function(pattern) {
      var result = this._create();
      result._until_after = false;
      result._until_pattern = this._input.get_regexp(pattern);
      result._update();
      return result;
    };
    Pattern.prototype.starting_with = function(pattern) {
      var result = this._create();
      result._starting_pattern = this._input.get_regexp(pattern, true);
      result._update();
      return result;
    };
    Pattern.prototype.matching = function(pattern) {
      var result = this._create();
      result._match_pattern = this._input.get_regexp(pattern, true);
      result._update();
      return result;
    };
    Pattern.prototype._create = function() {
      return new Pattern(this._input, this);
    };
    Pattern.prototype._update = function() {
    };
    module.exports.Pattern = Pattern;
  }
});

// node_modules/js-beautify/js/src/core/whitespacepattern.js
var require_whitespacepattern = __commonJS({
  "node_modules/js-beautify/js/src/core/whitespacepattern.js"(exports, module) {
    "use strict";
    var Pattern = require_pattern().Pattern;
    function WhitespacePattern(input_scanner, parent) {
      Pattern.call(this, input_scanner, parent);
      if (parent) {
        this._line_regexp = this._input.get_regexp(parent._line_regexp);
      } else {
        this.__set_whitespace_patterns("", "");
      }
      this.newline_count = 0;
      this.whitespace_before_token = "";
    }
    WhitespacePattern.prototype = new Pattern();
    WhitespacePattern.prototype.__set_whitespace_patterns = function(whitespace_chars, newline_chars) {
      whitespace_chars += "\\t ";
      newline_chars += "\\n\\r";
      this._match_pattern = this._input.get_regexp(
        "[" + whitespace_chars + newline_chars + "]+",
        true
      );
      this._newline_regexp = this._input.get_regexp(
        "\\r\\n|[" + newline_chars + "]"
      );
    };
    WhitespacePattern.prototype.read = function() {
      this.newline_count = 0;
      this.whitespace_before_token = "";
      var resulting_string = this._input.read(this._match_pattern);
      if (resulting_string === " ") {
        this.whitespace_before_token = " ";
      } else if (resulting_string) {
        var matches = this.__split(this._newline_regexp, resulting_string);
        this.newline_count = matches.length - 1;
        this.whitespace_before_token = matches[this.newline_count];
      }
      return resulting_string;
    };
    WhitespacePattern.prototype.matching = function(whitespace_chars, newline_chars) {
      var result = this._create();
      result.__set_whitespace_patterns(whitespace_chars, newline_chars);
      result._update();
      return result;
    };
    WhitespacePattern.prototype._create = function() {
      return new WhitespacePattern(this._input, this);
    };
    WhitespacePattern.prototype.__split = function(regexp, input_string) {
      regexp.lastIndex = 0;
      var start_index = 0;
      var result = [];
      var next_match = regexp.exec(input_string);
      while (next_match) {
        result.push(input_string.substring(start_index, next_match.index));
        start_index = next_match.index + next_match[0].length;
        next_match = regexp.exec(input_string);
      }
      if (start_index < input_string.length) {
        result.push(input_string.substring(start_index, input_string.length));
      } else {
        result.push("");
      }
      return result;
    };
    module.exports.WhitespacePattern = WhitespacePattern;
  }
});

// node_modules/js-beautify/js/src/core/tokenizer.js
var require_tokenizer = __commonJS({
  "node_modules/js-beautify/js/src/core/tokenizer.js"(exports, module) {
    "use strict";
    var InputScanner = require_inputscanner().InputScanner;
    var Token = require_token().Token;
    var TokenStream = require_tokenstream().TokenStream;
    var WhitespacePattern = require_whitespacepattern().WhitespacePattern;
    var TOKEN = {
      START: "TK_START",
      RAW: "TK_RAW",
      EOF: "TK_EOF"
    };
    var Tokenizer = function(input_string, options) {
      this._input = new InputScanner(input_string);
      this._options = options || {};
      this.__tokens = null;
      this._patterns = {};
      this._patterns.whitespace = new WhitespacePattern(this._input);
    };
    Tokenizer.prototype.tokenize = function() {
      this._input.restart();
      this.__tokens = new TokenStream();
      this._reset();
      var current;
      var previous = new Token(TOKEN.START, "");
      var open_token = null;
      var open_stack = [];
      var comments = new TokenStream();
      while (previous.type !== TOKEN.EOF) {
        current = this._get_next_token(previous, open_token);
        while (this._is_comment(current)) {
          comments.add(current);
          current = this._get_next_token(previous, open_token);
        }
        if (!comments.isEmpty()) {
          current.comments_before = comments;
          comments = new TokenStream();
        }
        current.parent = open_token;
        if (this._is_opening(current)) {
          open_stack.push(open_token);
          open_token = current;
        } else if (open_token && this._is_closing(current, open_token)) {
          current.opened = open_token;
          open_token.closed = current;
          open_token = open_stack.pop();
          current.parent = open_token;
        }
        current.previous = previous;
        previous.next = current;
        this.__tokens.add(current);
        previous = current;
      }
      return this.__tokens;
    };
    Tokenizer.prototype._is_first_token = function() {
      return this.__tokens.isEmpty();
    };
    Tokenizer.prototype._reset = function() {
    };
    Tokenizer.prototype._get_next_token = function(previous_token, open_token) {
      this._readWhitespace();
      var resulting_string = this._input.read(/.+/g);
      if (resulting_string) {
        return this._create_token(TOKEN.RAW, resulting_string);
      } else {
        return this._create_token(TOKEN.EOF, "");
      }
    };
    Tokenizer.prototype._is_comment = function(current_token) {
      return false;
    };
    Tokenizer.prototype._is_opening = function(current_token) {
      return false;
    };
    Tokenizer.prototype._is_closing = function(current_token, open_token) {
      return false;
    };
    Tokenizer.prototype._create_token = function(type, text) {
      var token = new Token(
        type,
        text,
        this._patterns.whitespace.newline_count,
        this._patterns.whitespace.whitespace_before_token
      );
      return token;
    };
    Tokenizer.prototype._readWhitespace = function() {
      return this._patterns.whitespace.read();
    };
    module.exports.Tokenizer = Tokenizer;
    module.exports.TOKEN = TOKEN;
  }
});

// node_modules/js-beautify/js/src/core/directives.js
var require_directives = __commonJS({
  "node_modules/js-beautify/js/src/core/directives.js"(exports, module) {
    "use strict";
    function Directives(start_block_pattern, end_block_pattern) {
      start_block_pattern = typeof start_block_pattern === "string" ? start_block_pattern : start_block_pattern.source;
      end_block_pattern = typeof end_block_pattern === "string" ? end_block_pattern : end_block_pattern.source;
      this.__directives_block_pattern = new RegExp(start_block_pattern + / beautify( \w+[:]\w+)+ /.source + end_block_pattern, "g");
      this.__directive_pattern = / (\w+)[:](\w+)/g;
      this.__directives_end_ignore_pattern = new RegExp(start_block_pattern + /\sbeautify\signore:end\s/.source + end_block_pattern, "g");
    }
    Directives.prototype.get_directives = function(text) {
      if (!text.match(this.__directives_block_pattern)) {
        return null;
      }
      var directives = {};
      this.__directive_pattern.lastIndex = 0;
      var directive_match = this.__directive_pattern.exec(text);
      while (directive_match) {
        directives[directive_match[1]] = directive_match[2];
        directive_match = this.__directive_pattern.exec(text);
      }
      return directives;
    };
    Directives.prototype.readIgnored = function(input) {
      return input.readUntilAfter(this.__directives_end_ignore_pattern);
    };
    module.exports.Directives = Directives;
  }
});

// node_modules/js-beautify/js/src/core/templatablepattern.js
var require_templatablepattern = __commonJS({
  "node_modules/js-beautify/js/src/core/templatablepattern.js"(exports, module) {
    "use strict";
    var Pattern = require_pattern().Pattern;
    var template_names = {
      django: false,
      erb: false,
      handlebars: false,
      php: false,
      smarty: false,
      angular: false
    };
    function TemplatablePattern(input_scanner, parent) {
      Pattern.call(this, input_scanner, parent);
      this.__template_pattern = null;
      this._disabled = Object.assign({}, template_names);
      this._excluded = Object.assign({}, template_names);
      if (parent) {
        this.__template_pattern = this._input.get_regexp(parent.__template_pattern);
        this._excluded = Object.assign(this._excluded, parent._excluded);
        this._disabled = Object.assign(this._disabled, parent._disabled);
      }
      var pattern = new Pattern(input_scanner);
      this.__patterns = {
        handlebars_comment: pattern.starting_with(/{{!--/).until_after(/--}}/),
        handlebars_unescaped: pattern.starting_with(/{{{/).until_after(/}}}/),
        handlebars: pattern.starting_with(/{{/).until_after(/}}/),
        php: pattern.starting_with(/<\?(?:[= ]|php)/).until_after(/\?>/),
        erb: pattern.starting_with(/<%[^%]/).until_after(/[^%]%>/),
        // django coflicts with handlebars a bit.
        django: pattern.starting_with(/{%/).until_after(/%}/),
        django_value: pattern.starting_with(/{{/).until_after(/}}/),
        django_comment: pattern.starting_with(/{#/).until_after(/#}/),
        smarty: pattern.starting_with(/{(?=[^}{\s\n])/).until_after(/[^\s\n]}/),
        smarty_comment: pattern.starting_with(/{\*/).until_after(/\*}/),
        smarty_literal: pattern.starting_with(/{literal}/).until_after(/{\/literal}/)
      };
    }
    TemplatablePattern.prototype = new Pattern();
    TemplatablePattern.prototype._create = function() {
      return new TemplatablePattern(this._input, this);
    };
    TemplatablePattern.prototype._update = function() {
      this.__set_templated_pattern();
    };
    TemplatablePattern.prototype.disable = function(language) {
      var result = this._create();
      result._disabled[language] = true;
      result._update();
      return result;
    };
    TemplatablePattern.prototype.read_options = function(options) {
      var result = this._create();
      for (var language in template_names) {
        result._disabled[language] = options.templating.indexOf(language) === -1;
      }
      result._update();
      return result;
    };
    TemplatablePattern.prototype.exclude = function(language) {
      var result = this._create();
      result._excluded[language] = true;
      result._update();
      return result;
    };
    TemplatablePattern.prototype.read = function() {
      var result = "";
      if (this._match_pattern) {
        result = this._input.read(this._starting_pattern);
      } else {
        result = this._input.read(this._starting_pattern, this.__template_pattern);
      }
      var next = this._read_template();
      while (next) {
        if (this._match_pattern) {
          next += this._input.read(this._match_pattern);
        } else {
          next += this._input.readUntil(this.__template_pattern);
        }
        result += next;
        next = this._read_template();
      }
      if (this._until_after) {
        result += this._input.readUntilAfter(this._until_pattern);
      }
      return result;
    };
    TemplatablePattern.prototype.__set_templated_pattern = function() {
      var items = [];
      if (!this._disabled.php) {
        items.push(this.__patterns.php._starting_pattern.source);
      }
      if (!this._disabled.handlebars) {
        items.push(this.__patterns.handlebars._starting_pattern.source);
      }
      if (!this._disabled.angular) {
        items.push(this.__patterns.handlebars._starting_pattern.source);
      }
      if (!this._disabled.erb) {
        items.push(this.__patterns.erb._starting_pattern.source);
      }
      if (!this._disabled.django) {
        items.push(this.__patterns.django._starting_pattern.source);
        items.push(this.__patterns.django_value._starting_pattern.source);
        items.push(this.__patterns.django_comment._starting_pattern.source);
      }
      if (!this._disabled.smarty) {
        items.push(this.__patterns.smarty._starting_pattern.source);
      }
      if (this._until_pattern) {
        items.push(this._until_pattern.source);
      }
      this.__template_pattern = this._input.get_regexp("(?:" + items.join("|") + ")");
    };
    TemplatablePattern.prototype._read_template = function() {
      var resulting_string = "";
      var c = this._input.peek();
      if (c === "<") {
        var peek1 = this._input.peek(1);
        if (!this._disabled.php && !this._excluded.php && peek1 === "?") {
          resulting_string = resulting_string || this.__patterns.php.read();
        }
        if (!this._disabled.erb && !this._excluded.erb && peek1 === "%") {
          resulting_string = resulting_string || this.__patterns.erb.read();
        }
      } else if (c === "{") {
        if (!this._disabled.handlebars && !this._excluded.handlebars) {
          resulting_string = resulting_string || this.__patterns.handlebars_comment.read();
          resulting_string = resulting_string || this.__patterns.handlebars_unescaped.read();
          resulting_string = resulting_string || this.__patterns.handlebars.read();
        }
        if (!this._disabled.django) {
          if (!this._excluded.django && !this._excluded.handlebars) {
            resulting_string = resulting_string || this.__patterns.django_value.read();
          }
          if (!this._excluded.django) {
            resulting_string = resulting_string || this.__patterns.django_comment.read();
            resulting_string = resulting_string || this.__patterns.django.read();
          }
        }
        if (!this._disabled.smarty) {
          if (this._disabled.django && this._disabled.handlebars) {
            resulting_string = resulting_string || this.__patterns.smarty_comment.read();
            resulting_string = resulting_string || this.__patterns.smarty_literal.read();
            resulting_string = resulting_string || this.__patterns.smarty.read();
          }
        }
      }
      return resulting_string;
    };
    module.exports.TemplatablePattern = TemplatablePattern;
  }
});

// node_modules/js-beautify/js/src/javascript/tokenizer.js
var require_tokenizer2 = __commonJS({
  "node_modules/js-beautify/js/src/javascript/tokenizer.js"(exports, module) {
    "use strict";
    var InputScanner = require_inputscanner().InputScanner;
    var BaseTokenizer = require_tokenizer().Tokenizer;
    var BASETOKEN = require_tokenizer().TOKEN;
    var Directives = require_directives().Directives;
    var acorn = require_acorn();
    var Pattern = require_pattern().Pattern;
    var TemplatablePattern = require_templatablepattern().TemplatablePattern;
    function in_array(what, arr) {
      return arr.indexOf(what) !== -1;
    }
    var TOKEN = {
      START_EXPR: "TK_START_EXPR",
      END_EXPR: "TK_END_EXPR",
      START_BLOCK: "TK_START_BLOCK",
      END_BLOCK: "TK_END_BLOCK",
      WORD: "TK_WORD",
      RESERVED: "TK_RESERVED",
      SEMICOLON: "TK_SEMICOLON",
      STRING: "TK_STRING",
      EQUALS: "TK_EQUALS",
      OPERATOR: "TK_OPERATOR",
      COMMA: "TK_COMMA",
      BLOCK_COMMENT: "TK_BLOCK_COMMENT",
      COMMENT: "TK_COMMENT",
      DOT: "TK_DOT",
      UNKNOWN: "TK_UNKNOWN",
      START: BASETOKEN.START,
      RAW: BASETOKEN.RAW,
      EOF: BASETOKEN.EOF
    };
    var directives_core = new Directives(/\/\*/, /\*\//);
    var number_pattern = /0[xX][0123456789abcdefABCDEF_]*n?|0[oO][01234567_]*n?|0[bB][01_]*n?|\d[\d_]*n|(?:\.\d[\d_]*|\d[\d_]*\.?[\d_]*)(?:[eE][+-]?[\d_]+)?/;
    var digit = /[0-9]/;
    var dot_pattern = /[^\d\.]/;
    var positionable_operators = ">>> === !== &&= ??= ||= << && >= ** != == <= >> || ?? |> < / - + > : & % ? ^ | *".split(" ");
    var punct = ">>>= ... >>= <<= === >>> !== **= &&= ??= ||= => ^= :: /= << <= == && -= >= >> != -- += ** || ?? ++ %= &= *= |= |> = ! ? > < : / ^ - + * & % ~ |";
    punct = punct.replace(/[-[\]{}()*+?.,\\^$|#]/g, "\\$&");
    punct = "\\?\\.(?!\\d) " + punct;
    punct = punct.replace(/ /g, "|");
    var punct_pattern = new RegExp(punct);
    var line_starters = "continue,try,throw,return,var,let,const,if,switch,case,default,for,while,break,function,import,export".split(",");
    var reserved_words = line_starters.concat(["do", "in", "of", "else", "get", "set", "new", "catch", "finally", "typeof", "yield", "async", "await", "from", "as", "class", "extends"]);
    var reserved_word_pattern = new RegExp("^(?:" + reserved_words.join("|") + ")$");
    var in_html_comment;
    var Tokenizer = function(input_string, options) {
      BaseTokenizer.call(this, input_string, options);
      this._patterns.whitespace = this._patterns.whitespace.matching(
        /\u00A0\u1680\u180e\u2000-\u200a\u202f\u205f\u3000\ufeff/.source,
        /\u2028\u2029/.source
      );
      var pattern_reader = new Pattern(this._input);
      var templatable = new TemplatablePattern(this._input).read_options(this._options);
      this.__patterns = {
        template: templatable,
        identifier: templatable.starting_with(acorn.identifier).matching(acorn.identifierMatch),
        number: pattern_reader.matching(number_pattern),
        punct: pattern_reader.matching(punct_pattern),
        // comment ends just before nearest linefeed or end of file
        comment: pattern_reader.starting_with(/\/\//).until(/[\n\r\u2028\u2029]/),
        //  /* ... */ comment ends with nearest */ or end of file
        block_comment: pattern_reader.starting_with(/\/\*/).until_after(/\*\//),
        html_comment_start: pattern_reader.matching(/<!--/),
        html_comment_end: pattern_reader.matching(/-->/),
        include: pattern_reader.starting_with(/#include/).until_after(acorn.lineBreak),
        shebang: pattern_reader.starting_with(/#!/).until_after(acorn.lineBreak),
        xml: pattern_reader.matching(/[\s\S]*?<(\/?)([-a-zA-Z:0-9_.]+|{[^}]+?}|!\[CDATA\[[^\]]*?\]\]|)(\s*{[^}]+?}|\s+[-a-zA-Z:0-9_.]+|\s+[-a-zA-Z:0-9_.]+\s*=\s*('[^']*'|"[^"]*"|{([^{}]|{[^}]+?})+?}))*\s*(\/?)\s*>/),
        single_quote: templatable.until(/['\\\n\r\u2028\u2029]/),
        double_quote: templatable.until(/["\\\n\r\u2028\u2029]/),
        template_text: templatable.until(/[`\\$]/),
        template_expression: templatable.until(/[`}\\]/)
      };
    };
    Tokenizer.prototype = new BaseTokenizer();
    Tokenizer.prototype._is_comment = function(current_token) {
      return current_token.type === TOKEN.COMMENT || current_token.type === TOKEN.BLOCK_COMMENT || current_token.type === TOKEN.UNKNOWN;
    };
    Tokenizer.prototype._is_opening = function(current_token) {
      return current_token.type === TOKEN.START_BLOCK || current_token.type === TOKEN.START_EXPR;
    };
    Tokenizer.prototype._is_closing = function(current_token, open_token) {
      return (current_token.type === TOKEN.END_BLOCK || current_token.type === TOKEN.END_EXPR) && (open_token && (current_token.text === "]" && open_token.text === "[" || current_token.text === ")" && open_token.text === "(" || current_token.text === "}" && open_token.text === "{"));
    };
    Tokenizer.prototype._reset = function() {
      in_html_comment = false;
    };
    Tokenizer.prototype._get_next_token = function(previous_token, open_token) {
      var token = null;
      this._readWhitespace();
      var c = this._input.peek();
      if (c === null) {
        return this._create_token(TOKEN.EOF, "");
      }
      token = token || this._read_non_javascript(c);
      token = token || this._read_string(c);
      token = token || this._read_pair(c, this._input.peek(1));
      token = token || this._read_word(previous_token);
      token = token || this._read_singles(c);
      token = token || this._read_comment(c);
      token = token || this._read_regexp(c, previous_token);
      token = token || this._read_xml(c, previous_token);
      token = token || this._read_punctuation();
      token = token || this._create_token(TOKEN.UNKNOWN, this._input.next());
      return token;
    };
    Tokenizer.prototype._read_word = function(previous_token) {
      var resulting_string;
      resulting_string = this.__patterns.identifier.read();
      if (resulting_string !== "") {
        resulting_string = resulting_string.replace(acorn.allLineBreaks, "\n");
        if (!(previous_token.type === TOKEN.DOT || previous_token.type === TOKEN.RESERVED && (previous_token.text === "set" || previous_token.text === "get")) && reserved_word_pattern.test(resulting_string)) {
          if ((resulting_string === "in" || resulting_string === "of") && (previous_token.type === TOKEN.WORD || previous_token.type === TOKEN.STRING)) {
            return this._create_token(TOKEN.OPERATOR, resulting_string);
          }
          return this._create_token(TOKEN.RESERVED, resulting_string);
        }
        return this._create_token(TOKEN.WORD, resulting_string);
      }
      resulting_string = this.__patterns.number.read();
      if (resulting_string !== "") {
        return this._create_token(TOKEN.WORD, resulting_string);
      }
    };
    Tokenizer.prototype._read_singles = function(c) {
      var token = null;
      if (c === "(" || c === "[") {
        token = this._create_token(TOKEN.START_EXPR, c);
      } else if (c === ")" || c === "]") {
        token = this._create_token(TOKEN.END_EXPR, c);
      } else if (c === "{") {
        token = this._create_token(TOKEN.START_BLOCK, c);
      } else if (c === "}") {
        token = this._create_token(TOKEN.END_BLOCK, c);
      } else if (c === ";") {
        token = this._create_token(TOKEN.SEMICOLON, c);
      } else if (c === "." && dot_pattern.test(this._input.peek(1))) {
        token = this._create_token(TOKEN.DOT, c);
      } else if (c === ",") {
        token = this._create_token(TOKEN.COMMA, c);
      }
      if (token) {
        this._input.next();
      }
      return token;
    };
    Tokenizer.prototype._read_pair = function(c, d) {
      var token = null;
      if (c === "#" && d === "{") {
        token = this._create_token(TOKEN.START_BLOCK, c + d);
      }
      if (token) {
        this._input.next();
        this._input.next();
      }
      return token;
    };
    Tokenizer.prototype._read_punctuation = function() {
      var resulting_string = this.__patterns.punct.read();
      if (resulting_string !== "") {
        if (resulting_string === "=") {
          return this._create_token(TOKEN.EQUALS, resulting_string);
        } else if (resulting_string === "?.") {
          return this._create_token(TOKEN.DOT, resulting_string);
        } else {
          return this._create_token(TOKEN.OPERATOR, resulting_string);
        }
      }
    };
    Tokenizer.prototype._read_non_javascript = function(c) {
      var resulting_string = "";
      if (c === "#") {
        if (this._is_first_token()) {
          resulting_string = this.__patterns.shebang.read();
          if (resulting_string) {
            return this._create_token(TOKEN.UNKNOWN, resulting_string.trim() + "\n");
          }
        }
        resulting_string = this.__patterns.include.read();
        if (resulting_string) {
          return this._create_token(TOKEN.UNKNOWN, resulting_string.trim() + "\n");
        }
        c = this._input.next();
        var sharp = "#";
        if (this._input.hasNext() && this._input.testChar(digit)) {
          do {
            c = this._input.next();
            sharp += c;
          } while (this._input.hasNext() && c !== "#" && c !== "=");
          if (c === "#") {
          } else if (this._input.peek() === "[" && this._input.peek(1) === "]") {
            sharp += "[]";
            this._input.next();
            this._input.next();
          } else if (this._input.peek() === "{" && this._input.peek(1) === "}") {
            sharp += "{}";
            this._input.next();
            this._input.next();
          }
          return this._create_token(TOKEN.WORD, sharp);
        }
        this._input.back();
      } else if (c === "<" && this._is_first_token()) {
        resulting_string = this.__patterns.html_comment_start.read();
        if (resulting_string) {
          while (this._input.hasNext() && !this._input.testChar(acorn.newline)) {
            resulting_string += this._input.next();
          }
          in_html_comment = true;
          return this._create_token(TOKEN.COMMENT, resulting_string);
        }
      } else if (in_html_comment && c === "-") {
        resulting_string = this.__patterns.html_comment_end.read();
        if (resulting_string) {
          in_html_comment = false;
          return this._create_token(TOKEN.COMMENT, resulting_string);
        }
      }
      return null;
    };
    Tokenizer.prototype._read_comment = function(c) {
      var token = null;
      if (c === "/") {
        var comment = "";
        if (this._input.peek(1) === "*") {
          comment = this.__patterns.block_comment.read();
          var directives = directives_core.get_directives(comment);
          if (directives && directives.ignore === "start") {
            comment += directives_core.readIgnored(this._input);
          }
          comment = comment.replace(acorn.allLineBreaks, "\n");
          token = this._create_token(TOKEN.BLOCK_COMMENT, comment);
          token.directives = directives;
        } else if (this._input.peek(1) === "/") {
          comment = this.__patterns.comment.read();
          token = this._create_token(TOKEN.COMMENT, comment);
        }
      }
      return token;
    };
    Tokenizer.prototype._read_string = function(c) {
      if (c === "`" || c === "'" || c === '"') {
        var resulting_string = this._input.next();
        this.has_char_escapes = false;
        if (c === "`") {
          resulting_string += this._read_string_recursive("`", true, "${");
        } else {
          resulting_string += this._read_string_recursive(c);
        }
        if (this.has_char_escapes && this._options.unescape_strings) {
          resulting_string = unescape_string(resulting_string);
        }
        if (this._input.peek() === c) {
          resulting_string += this._input.next();
        }
        resulting_string = resulting_string.replace(acorn.allLineBreaks, "\n");
        return this._create_token(TOKEN.STRING, resulting_string);
      }
      return null;
    };
    Tokenizer.prototype._allow_regexp_or_xml = function(previous_token) {
      return previous_token.type === TOKEN.RESERVED && in_array(previous_token.text, ["return", "case", "throw", "else", "do", "typeof", "yield"]) || previous_token.type === TOKEN.END_EXPR && previous_token.text === ")" && previous_token.opened && previous_token.opened.previous.type === TOKEN.RESERVED && in_array(previous_token.opened.previous.text, ["if", "while", "for"]) || in_array(previous_token.type, [
        TOKEN.COMMENT,
        TOKEN.START_EXPR,
        TOKEN.START_BLOCK,
        TOKEN.START,
        TOKEN.END_BLOCK,
        TOKEN.OPERATOR,
        TOKEN.EQUALS,
        TOKEN.EOF,
        TOKEN.SEMICOLON,
        TOKEN.COMMA
      ]);
    };
    Tokenizer.prototype._read_regexp = function(c, previous_token) {
      if (c === "/" && this._allow_regexp_or_xml(previous_token)) {
        var resulting_string = this._input.next();
        var esc = false;
        var in_char_class = false;
        while (this._input.hasNext() && ((esc || in_char_class || this._input.peek() !== c) && !this._input.testChar(acorn.newline))) {
          resulting_string += this._input.peek();
          if (!esc) {
            esc = this._input.peek() === "\\";
            if (this._input.peek() === "[") {
              in_char_class = true;
            } else if (this._input.peek() === "]") {
              in_char_class = false;
            }
          } else {
            esc = false;
          }
          this._input.next();
        }
        if (this._input.peek() === c) {
          resulting_string += this._input.next();
          resulting_string += this._input.read(acorn.identifier);
        }
        return this._create_token(TOKEN.STRING, resulting_string);
      }
      return null;
    };
    Tokenizer.prototype._read_xml = function(c, previous_token) {
      if (this._options.e4x && c === "<" && this._allow_regexp_or_xml(previous_token)) {
        var xmlStr = "";
        var match = this.__patterns.xml.read_match();
        if (match) {
          var rootTag = match[2].replace(/^{\s+/, "{").replace(/\s+}$/, "}");
          var isCurlyRoot = rootTag.indexOf("{") === 0;
          var depth = 0;
          while (match) {
            var isEndTag = !!match[1];
            var tagName = match[2];
            var isSingletonTag = !!match[match.length - 1] || tagName.slice(0, 8) === "![CDATA[";
            if (!isSingletonTag && (tagName === rootTag || isCurlyRoot && tagName.replace(/^{\s+/, "{").replace(/\s+}$/, "}"))) {
              if (isEndTag) {
                --depth;
              } else {
                ++depth;
              }
            }
            xmlStr += match[0];
            if (depth <= 0) {
              break;
            }
            match = this.__patterns.xml.read_match();
          }
          if (!match) {
            xmlStr += this._input.match(/[\s\S]*/g)[0];
          }
          xmlStr = xmlStr.replace(acorn.allLineBreaks, "\n");
          return this._create_token(TOKEN.STRING, xmlStr);
        }
      }
      return null;
    };
    function unescape_string(s) {
      var out = "", escaped = 0;
      var input_scan = new InputScanner(s);
      var matched = null;
      while (input_scan.hasNext()) {
        matched = input_scan.match(/([\s]|[^\\]|\\\\)+/g);
        if (matched) {
          out += matched[0];
        }
        if (input_scan.peek() === "\\") {
          input_scan.next();
          if (input_scan.peek() === "x") {
            matched = input_scan.match(/x([0-9A-Fa-f]{2})/g);
          } else if (input_scan.peek() === "u") {
            matched = input_scan.match(/u([0-9A-Fa-f]{4})/g);
            if (!matched) {
              matched = input_scan.match(/u\{([0-9A-Fa-f]+)\}/g);
            }
          } else {
            out += "\\";
            if (input_scan.hasNext()) {
              out += input_scan.next();
            }
            continue;
          }
          if (!matched) {
            return s;
          }
          escaped = parseInt(matched[1], 16);
          if (escaped > 126 && escaped <= 255 && matched[0].indexOf("x") === 0) {
            return s;
          } else if (escaped >= 0 && escaped < 32) {
            out += "\\" + matched[0];
          } else if (escaped > 1114111) {
            out += "\\" + matched[0];
          } else if (escaped === 34 || escaped === 39 || escaped === 92) {
            out += "\\" + String.fromCharCode(escaped);
          } else {
            out += String.fromCharCode(escaped);
          }
        }
      }
      return out;
    }
    Tokenizer.prototype._read_string_recursive = function(delimiter, allow_unescaped_newlines, start_sub) {
      var current_char;
      var pattern;
      if (delimiter === "'") {
        pattern = this.__patterns.single_quote;
      } else if (delimiter === '"') {
        pattern = this.__patterns.double_quote;
      } else if (delimiter === "`") {
        pattern = this.__patterns.template_text;
      } else if (delimiter === "}") {
        pattern = this.__patterns.template_expression;
      }
      var resulting_string = pattern.read();
      var next = "";
      while (this._input.hasNext()) {
        next = this._input.next();
        if (next === delimiter || !allow_unescaped_newlines && acorn.newline.test(next)) {
          this._input.back();
          break;
        } else if (next === "\\" && this._input.hasNext()) {
          current_char = this._input.peek();
          if (current_char === "x" || current_char === "u") {
            this.has_char_escapes = true;
          } else if (current_char === "\r" && this._input.peek(1) === "\n") {
            this._input.next();
          }
          next += this._input.next();
        } else if (start_sub) {
          if (start_sub === "${" && next === "$" && this._input.peek() === "{") {
            next += this._input.next();
          }
          if (start_sub === next) {
            if (delimiter === "`") {
              next += this._read_string_recursive("}", allow_unescaped_newlines, "`");
            } else {
              next += this._read_string_recursive("`", allow_unescaped_newlines, "${");
            }
            if (this._input.hasNext()) {
              next += this._input.next();
            }
          }
        }
        next += pattern.read();
        resulting_string += next;
      }
      return resulting_string;
    };
    module.exports.Tokenizer = Tokenizer;
    module.exports.TOKEN = TOKEN;
    module.exports.positionable_operators = positionable_operators.slice();
    module.exports.line_starters = line_starters.slice();
  }
});

// node_modules/js-beautify/js/src/javascript/beautifier.js
var require_beautifier = __commonJS({
  "node_modules/js-beautify/js/src/javascript/beautifier.js"(exports, module) {
    "use strict";
    var Output = require_output().Output;
    var Token = require_token().Token;
    var acorn = require_acorn();
    var Options = require_options2().Options;
    var Tokenizer = require_tokenizer2().Tokenizer;
    var line_starters = require_tokenizer2().line_starters;
    var positionable_operators = require_tokenizer2().positionable_operators;
    var TOKEN = require_tokenizer2().TOKEN;
    function in_array(what, arr) {
      return arr.indexOf(what) !== -1;
    }
    function ltrim(s) {
      return s.replace(/^\s+/g, "");
    }
    function generateMapFromStrings(list) {
      var result = {};
      for (var x = 0; x < list.length; x++) {
        result[list[x].replace(/-/g, "_")] = list[x];
      }
      return result;
    }
    function reserved_word(token, word) {
      return token && token.type === TOKEN.RESERVED && token.text === word;
    }
    function reserved_array(token, words) {
      return token && token.type === TOKEN.RESERVED && in_array(token.text, words);
    }
    var special_words = ["case", "return", "do", "if", "throw", "else", "await", "break", "continue", "async"];
    var validPositionValues = ["before-newline", "after-newline", "preserve-newline"];
    var OPERATOR_POSITION = generateMapFromStrings(validPositionValues);
    var OPERATOR_POSITION_BEFORE_OR_PRESERVE = [OPERATOR_POSITION.before_newline, OPERATOR_POSITION.preserve_newline];
    var MODE = {
      BlockStatement: "BlockStatement",
      // 'BLOCK'
      Statement: "Statement",
      // 'STATEMENT'
      ObjectLiteral: "ObjectLiteral",
      // 'OBJECT',
      ArrayLiteral: "ArrayLiteral",
      //'[EXPRESSION]',
      ForInitializer: "ForInitializer",
      //'(FOR-EXPRESSION)',
      Conditional: "Conditional",
      //'(COND-EXPRESSION)',
      Expression: "Expression"
      //'(EXPRESSION)'
    };
    function remove_redundant_indentation(output, frame) {
      if (frame.multiline_frame || frame.mode === MODE.ForInitializer || frame.mode === MODE.Conditional) {
        return;
      }
      output.remove_indent(frame.start_line_index);
    }
    function split_linebreaks(s) {
      s = s.replace(acorn.allLineBreaks, "\n");
      var out = [];
      var start = 0;
      var idx = s.indexOf("\n", start);
      while (idx !== -1) {
        out.push(s.substring(start, idx));
        start = idx + 1;
        idx = s.indexOf("\n", start);
      }
      if (start < s.length) {
        out.push(s.substring(start));
      }
      return out;
    }
    function is_array(mode) {
      return mode === MODE.ArrayLiteral;
    }
    function is_expression(mode) {
      return in_array(mode, [MODE.Expression, MODE.ForInitializer, MODE.Conditional]);
    }
    function all_lines_start_with(lines, c) {
      for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();
        if (line.charAt(0) !== c) {
          return false;
        }
      }
      return true;
    }
    function each_line_matches_indent(lines, indent) {
      var i = 0, len = lines.length, line;
      for (; i < len; i++) {
        line = lines[i];
        if (line && line.indexOf(indent) !== 0) {
          return false;
        }
      }
      return true;
    }
    function Beautifier(source_text, options) {
      options = options || {};
      this._source_text = source_text || "";
      this._output = null;
      this._tokens = null;
      this._last_last_text = null;
      this._flags = null;
      this._previous_flags = null;
      this._flag_store = null;
      this._options = new Options(options);
    }
    Beautifier.prototype.create_flags = function(flags_base, mode) {
      var next_indent_level = 0;
      if (flags_base) {
        next_indent_level = flags_base.indentation_level;
        if (!this._output.just_added_newline() && flags_base.line_indent_level > next_indent_level) {
          next_indent_level = flags_base.line_indent_level;
        }
      }
      var next_flags = {
        mode,
        parent: flags_base,
        last_token: flags_base ? flags_base.last_token : new Token(TOKEN.START_BLOCK, ""),
        // last token text
        last_word: flags_base ? flags_base.last_word : "",
        // last TOKEN.WORD passed
        declaration_statement: false,
        declaration_assignment: false,
        multiline_frame: false,
        inline_frame: false,
        if_block: false,
        else_block: false,
        class_start_block: false,
        // class A { INSIDE HERE } or class B extends C { INSIDE HERE }
        do_block: false,
        do_while: false,
        import_block: false,
        in_case_statement: false,
        // switch(..){ INSIDE HERE }
        in_case: false,
        // we're on the exact line with "case 0:"
        case_body: false,
        // the indented case-action block
        case_block: false,
        // the indented case-action block is wrapped with {}
        indentation_level: next_indent_level,
        alignment: 0,
        line_indent_level: flags_base ? flags_base.line_indent_level : next_indent_level,
        start_line_index: this._output.get_line_number(),
        ternary_depth: 0
      };
      return next_flags;
    };
    Beautifier.prototype._reset = function(source_text) {
      var baseIndentString = source_text.match(/^[\t ]*/)[0];
      this._last_last_text = "";
      this._output = new Output(this._options, baseIndentString);
      this._output.raw = this._options.test_output_raw;
      this._flag_store = [];
      this.set_mode(MODE.BlockStatement);
      var tokenizer = new Tokenizer(source_text, this._options);
      this._tokens = tokenizer.tokenize();
      return source_text;
    };
    Beautifier.prototype.beautify = function() {
      if (this._options.disabled) {
        return this._source_text;
      }
      var sweet_code;
      var source_text = this._reset(this._source_text);
      var eol = this._options.eol;
      if (this._options.eol === "auto") {
        eol = "\n";
        if (source_text && acorn.lineBreak.test(source_text || "")) {
          eol = source_text.match(acorn.lineBreak)[0];
        }
      }
      var current_token = this._tokens.next();
      while (current_token) {
        this.handle_token(current_token);
        this._last_last_text = this._flags.last_token.text;
        this._flags.last_token = current_token;
        current_token = this._tokens.next();
      }
      sweet_code = this._output.get_code(eol);
      return sweet_code;
    };
    Beautifier.prototype.handle_token = function(current_token, preserve_statement_flags) {
      if (current_token.type === TOKEN.START_EXPR) {
        this.handle_start_expr(current_token);
      } else if (current_token.type === TOKEN.END_EXPR) {
        this.handle_end_expr(current_token);
      } else if (current_token.type === TOKEN.START_BLOCK) {
        this.handle_start_block(current_token);
      } else if (current_token.type === TOKEN.END_BLOCK) {
        this.handle_end_block(current_token);
      } else if (current_token.type === TOKEN.WORD) {
        this.handle_word(current_token);
      } else if (current_token.type === TOKEN.RESERVED) {
        this.handle_word(current_token);
      } else if (current_token.type === TOKEN.SEMICOLON) {
        this.handle_semicolon(current_token);
      } else if (current_token.type === TOKEN.STRING) {
        this.handle_string(current_token);
      } else if (current_token.type === TOKEN.EQUALS) {
        this.handle_equals(current_token);
      } else if (current_token.type === TOKEN.OPERATOR) {
        this.handle_operator(current_token);
      } else if (current_token.type === TOKEN.COMMA) {
        this.handle_comma(current_token);
      } else if (current_token.type === TOKEN.BLOCK_COMMENT) {
        this.handle_block_comment(current_token, preserve_statement_flags);
      } else if (current_token.type === TOKEN.COMMENT) {
        this.handle_comment(current_token, preserve_statement_flags);
      } else if (current_token.type === TOKEN.DOT) {
        this.handle_dot(current_token);
      } else if (current_token.type === TOKEN.EOF) {
        this.handle_eof(current_token);
      } else if (current_token.type === TOKEN.UNKNOWN) {
        this.handle_unknown(current_token, preserve_statement_flags);
      } else {
        this.handle_unknown(current_token, preserve_statement_flags);
      }
    };
    Beautifier.prototype.handle_whitespace_and_comments = function(current_token, preserve_statement_flags) {
      var newlines = current_token.newlines;
      var keep_whitespace = this._options.keep_array_indentation && is_array(this._flags.mode);
      if (current_token.comments_before) {
        var comment_token = current_token.comments_before.next();
        while (comment_token) {
          this.handle_whitespace_and_comments(comment_token, preserve_statement_flags);
          this.handle_token(comment_token, preserve_statement_flags);
          comment_token = current_token.comments_before.next();
        }
      }
      if (keep_whitespace) {
        for (var i = 0; i < newlines; i += 1) {
          this.print_newline(i > 0, preserve_statement_flags);
        }
      } else {
        if (this._options.max_preserve_newlines && newlines > this._options.max_preserve_newlines) {
          newlines = this._options.max_preserve_newlines;
        }
        if (this._options.preserve_newlines) {
          if (newlines > 1) {
            this.print_newline(false, preserve_statement_flags);
            for (var j = 1; j < newlines; j += 1) {
              this.print_newline(true, preserve_statement_flags);
            }
          }
        }
      }
    };
    var newline_restricted_tokens = ["async", "break", "continue", "return", "throw", "yield"];
    Beautifier.prototype.allow_wrap_or_preserved_newline = function(current_token, force_linewrap) {
      force_linewrap = force_linewrap === void 0 ? false : force_linewrap;
      if (this._output.just_added_newline()) {
        return;
      }
      var shouldPreserveOrForce = this._options.preserve_newlines && current_token.newlines || force_linewrap;
      var operatorLogicApplies = in_array(this._flags.last_token.text, positionable_operators) || in_array(current_token.text, positionable_operators);
      if (operatorLogicApplies) {
        var shouldPrintOperatorNewline = in_array(this._flags.last_token.text, positionable_operators) && in_array(this._options.operator_position, OPERATOR_POSITION_BEFORE_OR_PRESERVE) || in_array(current_token.text, positionable_operators);
        shouldPreserveOrForce = shouldPreserveOrForce && shouldPrintOperatorNewline;
      }
      if (shouldPreserveOrForce) {
        this.print_newline(false, true);
      } else if (this._options.wrap_line_length) {
        if (reserved_array(this._flags.last_token, newline_restricted_tokens)) {
          return;
        }
        this._output.set_wrap_point();
      }
    };
    Beautifier.prototype.print_newline = function(force_newline, preserve_statement_flags) {
      if (!preserve_statement_flags) {
        if (this._flags.last_token.text !== ";" && this._flags.last_token.text !== "," && this._flags.last_token.text !== "=" && (this._flags.last_token.type !== TOKEN.OPERATOR || this._flags.last_token.text === "--" || this._flags.last_token.text === "++")) {
          var next_token = this._tokens.peek();
          while (this._flags.mode === MODE.Statement && !(this._flags.if_block && reserved_word(next_token, "else")) && !this._flags.do_block) {
            this.restore_mode();
          }
        }
      }
      if (this._output.add_new_line(force_newline)) {
        this._flags.multiline_frame = true;
      }
    };
    Beautifier.prototype.print_token_line_indentation = function(current_token) {
      if (this._output.just_added_newline()) {
        if (this._options.keep_array_indentation && current_token.newlines && (current_token.text === "[" || is_array(this._flags.mode))) {
          this._output.current_line.set_indent(-1);
          this._output.current_line.push(current_token.whitespace_before);
          this._output.space_before_token = false;
        } else if (this._output.set_indent(this._flags.indentation_level, this._flags.alignment)) {
          this._flags.line_indent_level = this._flags.indentation_level;
        }
      }
    };
    Beautifier.prototype.print_token = function(current_token) {
      if (this._output.raw) {
        this._output.add_raw_token(current_token);
        return;
      }
      if (this._options.comma_first && current_token.previous && current_token.previous.type === TOKEN.COMMA && this._output.just_added_newline()) {
        if (this._output.previous_line.last() === ",") {
          var popped = this._output.previous_line.pop();
          if (this._output.previous_line.is_empty()) {
            this._output.previous_line.push(popped);
            this._output.trim(true);
            this._output.current_line.pop();
            this._output.trim();
          }
          this.print_token_line_indentation(current_token);
          this._output.add_token(",");
          this._output.space_before_token = true;
        }
      }
      this.print_token_line_indentation(current_token);
      this._output.non_breaking_space = true;
      this._output.add_token(current_token.text);
      if (this._output.previous_token_wrapped) {
        this._flags.multiline_frame = true;
      }
    };
    Beautifier.prototype.indent = function() {
      this._flags.indentation_level += 1;
      this._output.set_indent(this._flags.indentation_level, this._flags.alignment);
    };
    Beautifier.prototype.deindent = function() {
      if (this._flags.indentation_level > 0 && (!this._flags.parent || this._flags.indentation_level > this._flags.parent.indentation_level)) {
        this._flags.indentation_level -= 1;
        this._output.set_indent(this._flags.indentation_level, this._flags.alignment);
      }
    };
    Beautifier.prototype.set_mode = function(mode) {
      if (this._flags) {
        this._flag_store.push(this._flags);
        this._previous_flags = this._flags;
      } else {
        this._previous_flags = this.create_flags(null, mode);
      }
      this._flags = this.create_flags(this._previous_flags, mode);
      this._output.set_indent(this._flags.indentation_level, this._flags.alignment);
    };
    Beautifier.prototype.restore_mode = function() {
      if (this._flag_store.length > 0) {
        this._previous_flags = this._flags;
        this._flags = this._flag_store.pop();
        if (this._previous_flags.mode === MODE.Statement) {
          remove_redundant_indentation(this._output, this._previous_flags);
        }
        this._output.set_indent(this._flags.indentation_level, this._flags.alignment);
      }
    };
    Beautifier.prototype.start_of_object_property = function() {
      return this._flags.parent.mode === MODE.ObjectLiteral && this._flags.mode === MODE.Statement && (this._flags.last_token.text === ":" && this._flags.ternary_depth === 0 || reserved_array(this._flags.last_token, ["get", "set"]));
    };
    Beautifier.prototype.start_of_statement = function(current_token) {
      var start = false;
      start = start || reserved_array(this._flags.last_token, ["var", "let", "const"]) && current_token.type === TOKEN.WORD;
      start = start || reserved_word(this._flags.last_token, "do");
      start = start || !(this._flags.parent.mode === MODE.ObjectLiteral && this._flags.mode === MODE.Statement) && reserved_array(this._flags.last_token, newline_restricted_tokens) && !current_token.newlines;
      start = start || reserved_word(this._flags.last_token, "else") && !(reserved_word(current_token, "if") && !current_token.comments_before);
      start = start || this._flags.last_token.type === TOKEN.END_EXPR && (this._previous_flags.mode === MODE.ForInitializer || this._previous_flags.mode === MODE.Conditional);
      start = start || this._flags.last_token.type === TOKEN.WORD && this._flags.mode === MODE.BlockStatement && !this._flags.in_case && !(current_token.text === "--" || current_token.text === "++") && this._last_last_text !== "function" && current_token.type !== TOKEN.WORD && current_token.type !== TOKEN.RESERVED;
      start = start || this._flags.mode === MODE.ObjectLiteral && (this._flags.last_token.text === ":" && this._flags.ternary_depth === 0 || reserved_array(this._flags.last_token, ["get", "set"]));
      if (start) {
        this.set_mode(MODE.Statement);
        this.indent();
        this.handle_whitespace_and_comments(current_token, true);
        if (!this.start_of_object_property()) {
          this.allow_wrap_or_preserved_newline(
            current_token,
            reserved_array(current_token, ["do", "for", "if", "while"])
          );
        }
        return true;
      }
      return false;
    };
    Beautifier.prototype.handle_start_expr = function(current_token) {
      if (!this.start_of_statement(current_token)) {
        this.handle_whitespace_and_comments(current_token);
      }
      var next_mode = MODE.Expression;
      if (current_token.text === "[") {
        if (this._flags.last_token.type === TOKEN.WORD || this._flags.last_token.text === ")") {
          if (reserved_array(this._flags.last_token, line_starters)) {
            this._output.space_before_token = true;
          }
          this.print_token(current_token);
          this.set_mode(next_mode);
          this.indent();
          if (this._options.space_in_paren) {
            this._output.space_before_token = true;
          }
          return;
        }
        next_mode = MODE.ArrayLiteral;
        if (is_array(this._flags.mode)) {
          if (this._flags.last_token.text === "[" || this._flags.last_token.text === "," && (this._last_last_text === "]" || this._last_last_text === "}")) {
            if (!this._options.keep_array_indentation) {
              this.print_newline();
            }
          }
        }
        if (!in_array(this._flags.last_token.type, [TOKEN.START_EXPR, TOKEN.END_EXPR, TOKEN.WORD, TOKEN.OPERATOR, TOKEN.DOT])) {
          this._output.space_before_token = true;
        }
      } else {
        if (this._flags.last_token.type === TOKEN.RESERVED) {
          if (this._flags.last_token.text === "for") {
            this._output.space_before_token = this._options.space_before_conditional;
            next_mode = MODE.ForInitializer;
          } else if (in_array(this._flags.last_token.text, ["if", "while", "switch"])) {
            this._output.space_before_token = this._options.space_before_conditional;
            next_mode = MODE.Conditional;
          } else if (in_array(this._flags.last_word, ["await", "async"])) {
            this._output.space_before_token = true;
          } else if (this._flags.last_token.text === "import" && current_token.whitespace_before === "") {
            this._output.space_before_token = false;
          } else if (in_array(this._flags.last_token.text, line_starters) || this._flags.last_token.text === "catch") {
            this._output.space_before_token = true;
          }
        } else if (this._flags.last_token.type === TOKEN.EQUALS || this._flags.last_token.type === TOKEN.OPERATOR) {
          if (!this.start_of_object_property()) {
            this.allow_wrap_or_preserved_newline(current_token);
          }
        } else if (this._flags.last_token.type === TOKEN.WORD) {
          this._output.space_before_token = false;
          var peek_back_two = this._tokens.peek(-3);
          if (this._options.space_after_named_function && peek_back_two) {
            var peek_back_three = this._tokens.peek(-4);
            if (reserved_array(peek_back_two, ["async", "function"]) || peek_back_two.text === "*" && reserved_array(peek_back_three, ["async", "function"])) {
              this._output.space_before_token = true;
            } else if (this._flags.mode === MODE.ObjectLiteral) {
              if (peek_back_two.text === "{" || peek_back_two.text === "," || peek_back_two.text === "*" && (peek_back_three.text === "{" || peek_back_three.text === ",")) {
                this._output.space_before_token = true;
              }
            } else if (this._flags.parent && this._flags.parent.class_start_block) {
              this._output.space_before_token = true;
            }
          }
        } else {
          this.allow_wrap_or_preserved_newline(current_token);
        }
        if (this._flags.last_token.type === TOKEN.RESERVED && (this._flags.last_word === "function" || this._flags.last_word === "typeof") || this._flags.last_token.text === "*" && (in_array(this._last_last_text, ["function", "yield"]) || this._flags.mode === MODE.ObjectLiteral && in_array(this._last_last_text, ["{", ","]))) {
          this._output.space_before_token = this._options.space_after_anon_function;
        }
      }
      if (this._flags.last_token.text === ";" || this._flags.last_token.type === TOKEN.START_BLOCK) {
        this.print_newline();
      } else if (this._flags.last_token.type === TOKEN.END_EXPR || this._flags.last_token.type === TOKEN.START_EXPR || this._flags.last_token.type === TOKEN.END_BLOCK || this._flags.last_token.text === "." || this._flags.last_token.type === TOKEN.COMMA) {
        this.allow_wrap_or_preserved_newline(current_token, current_token.newlines);
      }
      this.print_token(current_token);
      this.set_mode(next_mode);
      if (this._options.space_in_paren) {
        this._output.space_before_token = true;
      }
      this.indent();
    };
    Beautifier.prototype.handle_end_expr = function(current_token) {
      while (this._flags.mode === MODE.Statement) {
        this.restore_mode();
      }
      this.handle_whitespace_and_comments(current_token);
      if (this._flags.multiline_frame) {
        this.allow_wrap_or_preserved_newline(
          current_token,
          current_token.text === "]" && is_array(this._flags.mode) && !this._options.keep_array_indentation
        );
      }
      if (this._options.space_in_paren) {
        if (this._flags.last_token.type === TOKEN.START_EXPR && !this._options.space_in_empty_paren) {
          this._output.trim();
          this._output.space_before_token = false;
        } else {
          this._output.space_before_token = true;
        }
      }
      this.deindent();
      this.print_token(current_token);
      this.restore_mode();
      remove_redundant_indentation(this._output, this._previous_flags);
      if (this._flags.do_while && this._previous_flags.mode === MODE.Conditional) {
        this._previous_flags.mode = MODE.Expression;
        this._flags.do_block = false;
        this._flags.do_while = false;
      }
    };
    Beautifier.prototype.handle_start_block = function(current_token) {
      this.handle_whitespace_and_comments(current_token);
      var next_token = this._tokens.peek();
      var second_token = this._tokens.peek(1);
      if (this._flags.last_word === "switch" && this._flags.last_token.type === TOKEN.END_EXPR) {
        this.set_mode(MODE.BlockStatement);
        this._flags.in_case_statement = true;
      } else if (this._flags.case_body) {
        this.set_mode(MODE.BlockStatement);
      } else if (second_token && (in_array(second_token.text, [":", ","]) && in_array(next_token.type, [TOKEN.STRING, TOKEN.WORD, TOKEN.RESERVED]) || in_array(next_token.text, ["get", "set", "..."]) && in_array(second_token.type, [TOKEN.WORD, TOKEN.RESERVED]))) {
        if (in_array(this._last_last_text, ["class", "interface"]) && !in_array(second_token.text, [":", ","])) {
          this.set_mode(MODE.BlockStatement);
        } else {
          this.set_mode(MODE.ObjectLiteral);
        }
      } else if (this._flags.last_token.type === TOKEN.OPERATOR && this._flags.last_token.text === "=>") {
        this.set_mode(MODE.BlockStatement);
      } else if (in_array(this._flags.last_token.type, [TOKEN.EQUALS, TOKEN.START_EXPR, TOKEN.COMMA, TOKEN.OPERATOR]) || reserved_array(this._flags.last_token, ["return", "throw", "import", "default"])) {
        this.set_mode(MODE.ObjectLiteral);
      } else {
        this.set_mode(MODE.BlockStatement);
      }
      if (this._flags.last_token) {
        if (reserved_array(this._flags.last_token.previous, ["class", "extends"])) {
          this._flags.class_start_block = true;
        }
      }
      var empty_braces = !next_token.comments_before && next_token.text === "}";
      var empty_anonymous_function = empty_braces && this._flags.last_word === "function" && this._flags.last_token.type === TOKEN.END_EXPR;
      if (this._options.brace_preserve_inline) {
        var index = 0;
        var check_token = null;
        this._flags.inline_frame = true;
        do {
          index += 1;
          check_token = this._tokens.peek(index - 1);
          if (check_token.newlines) {
            this._flags.inline_frame = false;
            break;
          }
        } while (check_token.type !== TOKEN.EOF && !(check_token.type === TOKEN.END_BLOCK && check_token.opened === current_token));
      }
      if ((this._options.brace_style === "expand" || this._options.brace_style === "none" && current_token.newlines) && !this._flags.inline_frame) {
        if (this._flags.last_token.type !== TOKEN.OPERATOR && (empty_anonymous_function || this._flags.last_token.type === TOKEN.EQUALS || reserved_array(this._flags.last_token, special_words) && this._flags.last_token.text !== "else")) {
          this._output.space_before_token = true;
        } else {
          this.print_newline(false, true);
        }
      } else {
        if (is_array(this._previous_flags.mode) && (this._flags.last_token.type === TOKEN.START_EXPR || this._flags.last_token.type === TOKEN.COMMA)) {
          if (this._flags.last_token.type === TOKEN.COMMA || this._options.space_in_paren) {
            this._output.space_before_token = true;
          }
          if (this._flags.last_token.type === TOKEN.COMMA || this._flags.last_token.type === TOKEN.START_EXPR && this._flags.inline_frame) {
            this.allow_wrap_or_preserved_newline(current_token);
            this._previous_flags.multiline_frame = this._previous_flags.multiline_frame || this._flags.multiline_frame;
            this._flags.multiline_frame = false;
          }
        }
        if (this._flags.last_token.type !== TOKEN.OPERATOR && this._flags.last_token.type !== TOKEN.START_EXPR) {
          if (in_array(this._flags.last_token.type, [TOKEN.START_BLOCK, TOKEN.SEMICOLON]) && !this._flags.inline_frame) {
            this.print_newline();
          } else {
            this._output.space_before_token = true;
          }
        }
      }
      this.print_token(current_token);
      this.indent();
      if (!empty_braces && !(this._options.brace_preserve_inline && this._flags.inline_frame)) {
        this.print_newline();
      }
    };
    Beautifier.prototype.handle_end_block = function(current_token) {
      this.handle_whitespace_and_comments(current_token);
      while (this._flags.mode === MODE.Statement) {
        this.restore_mode();
      }
      var empty_braces = this._flags.last_token.type === TOKEN.START_BLOCK;
      if (this._flags.inline_frame && !empty_braces) {
        this._output.space_before_token = true;
      } else if (this._options.brace_style === "expand") {
        if (!empty_braces) {
          this.print_newline();
        }
      } else {
        if (!empty_braces) {
          if (is_array(this._flags.mode) && this._options.keep_array_indentation) {
            this._options.keep_array_indentation = false;
            this.print_newline();
            this._options.keep_array_indentation = true;
          } else {
            this.print_newline();
          }
        }
      }
      this.restore_mode();
      this.print_token(current_token);
    };
    Beautifier.prototype.handle_word = function(current_token) {
      if (current_token.type === TOKEN.RESERVED) {
        if (in_array(current_token.text, ["set", "get"]) && this._flags.mode !== MODE.ObjectLiteral) {
          current_token.type = TOKEN.WORD;
        } else if (current_token.text === "import" && in_array(this._tokens.peek().text, ["(", "."])) {
          current_token.type = TOKEN.WORD;
        } else if (in_array(current_token.text, ["as", "from"]) && !this._flags.import_block) {
          current_token.type = TOKEN.WORD;
        } else if (this._flags.mode === MODE.ObjectLiteral) {
          var next_token = this._tokens.peek();
          if (next_token.text === ":") {
            current_token.type = TOKEN.WORD;
          }
        }
      }
      if (this.start_of_statement(current_token)) {
        if (reserved_array(this._flags.last_token, ["var", "let", "const"]) && current_token.type === TOKEN.WORD) {
          this._flags.declaration_statement = true;
        }
      } else if (current_token.newlines && !is_expression(this._flags.mode) && (this._flags.last_token.type !== TOKEN.OPERATOR || (this._flags.last_token.text === "--" || this._flags.last_token.text === "++")) && this._flags.last_token.type !== TOKEN.EQUALS && (this._options.preserve_newlines || !reserved_array(this._flags.last_token, ["var", "let", "const", "set", "get"]))) {
        this.handle_whitespace_and_comments(current_token);
        this.print_newline();
      } else {
        this.handle_whitespace_and_comments(current_token);
      }
      if (this._flags.do_block && !this._flags.do_while) {
        if (reserved_word(current_token, "while")) {
          this._output.space_before_token = true;
          this.print_token(current_token);
          this._output.space_before_token = true;
          this._flags.do_while = true;
          return;
        } else {
          this.print_newline();
          this._flags.do_block = false;
        }
      }
      if (this._flags.if_block) {
        if (!this._flags.else_block && reserved_word(current_token, "else")) {
          this._flags.else_block = true;
        } else {
          while (this._flags.mode === MODE.Statement) {
            this.restore_mode();
          }
          this._flags.if_block = false;
          this._flags.else_block = false;
        }
      }
      if (this._flags.in_case_statement && reserved_array(current_token, ["case", "default"])) {
        this.print_newline();
        if (!this._flags.case_block && (this._flags.case_body || this._options.jslint_happy)) {
          this.deindent();
        }
        this._flags.case_body = false;
        this.print_token(current_token);
        this._flags.in_case = true;
        return;
      }
      if (this._flags.last_token.type === TOKEN.COMMA || this._flags.last_token.type === TOKEN.START_EXPR || this._flags.last_token.type === TOKEN.EQUALS || this._flags.last_token.type === TOKEN.OPERATOR) {
        if (!this.start_of_object_property() && !// start of object property is different for numeric values with +/- prefix operators
        (in_array(this._flags.last_token.text, ["+", "-"]) && this._last_last_text === ":" && this._flags.parent.mode === MODE.ObjectLiteral)) {
          this.allow_wrap_or_preserved_newline(current_token);
        }
      }
      if (reserved_word(current_token, "function")) {
        if (in_array(this._flags.last_token.text, ["}", ";"]) || this._output.just_added_newline() && !(in_array(this._flags.last_token.text, ["(", "[", "{", ":", "=", ","]) || this._flags.last_token.type === TOKEN.OPERATOR)) {
          if (!this._output.just_added_blankline() && !current_token.comments_before) {
            this.print_newline();
            this.print_newline(true);
          }
        }
        if (this._flags.last_token.type === TOKEN.RESERVED || this._flags.last_token.type === TOKEN.WORD) {
          if (reserved_array(this._flags.last_token, ["get", "set", "new", "export"]) || reserved_array(this._flags.last_token, newline_restricted_tokens)) {
            this._output.space_before_token = true;
          } else if (reserved_word(this._flags.last_token, "default") && this._last_last_text === "export") {
            this._output.space_before_token = true;
          } else if (this._flags.last_token.text === "declare") {
            this._output.space_before_token = true;
          } else {
            this.print_newline();
          }
        } else if (this._flags.last_token.type === TOKEN.OPERATOR || this._flags.last_token.text === "=") {
          this._output.space_before_token = true;
        } else if (!this._flags.multiline_frame && (is_expression(this._flags.mode) || is_array(this._flags.mode))) {
        } else {
          this.print_newline();
        }
        this.print_token(current_token);
        this._flags.last_word = current_token.text;
        return;
      }
      var prefix = "NONE";
      if (this._flags.last_token.type === TOKEN.END_BLOCK) {
        if (this._previous_flags.inline_frame) {
          prefix = "SPACE";
        } else if (!reserved_array(current_token, ["else", "catch", "finally", "from"])) {
          prefix = "NEWLINE";
        } else {
          if (this._options.brace_style === "expand" || this._options.brace_style === "end-expand" || this._options.brace_style === "none" && current_token.newlines) {
            prefix = "NEWLINE";
          } else {
            prefix = "SPACE";
            this._output.space_before_token = true;
          }
        }
      } else if (this._flags.last_token.type === TOKEN.SEMICOLON && this._flags.mode === MODE.BlockStatement) {
        prefix = "NEWLINE";
      } else if (this._flags.last_token.type === TOKEN.SEMICOLON && is_expression(this._flags.mode)) {
        prefix = "SPACE";
      } else if (this._flags.last_token.type === TOKEN.STRING) {
        prefix = "NEWLINE";
      } else if (this._flags.last_token.type === TOKEN.RESERVED || this._flags.last_token.type === TOKEN.WORD || this._flags.last_token.text === "*" && (in_array(this._last_last_text, ["function", "yield"]) || this._flags.mode === MODE.ObjectLiteral && in_array(this._last_last_text, ["{", ","]))) {
        prefix = "SPACE";
      } else if (this._flags.last_token.type === TOKEN.START_BLOCK) {
        if (this._flags.inline_frame) {
          prefix = "SPACE";
        } else {
          prefix = "NEWLINE";
        }
      } else if (this._flags.last_token.type === TOKEN.END_EXPR) {
        this._output.space_before_token = true;
        prefix = "NEWLINE";
      }
      if (reserved_array(current_token, line_starters) && this._flags.last_token.text !== ")") {
        if (this._flags.inline_frame || this._flags.last_token.text === "else" || this._flags.last_token.text === "export") {
          prefix = "SPACE";
        } else {
          prefix = "NEWLINE";
        }
      }
      if (reserved_array(current_token, ["else", "catch", "finally"])) {
        if ((!(this._flags.last_token.type === TOKEN.END_BLOCK && this._previous_flags.mode === MODE.BlockStatement) || this._options.brace_style === "expand" || this._options.brace_style === "end-expand" || this._options.brace_style === "none" && current_token.newlines) && !this._flags.inline_frame) {
          this.print_newline();
        } else {
          this._output.trim(true);
          var line = this._output.current_line;
          if (line.last() !== "}") {
            this.print_newline();
          }
          this._output.space_before_token = true;
        }
      } else if (prefix === "NEWLINE") {
        if (reserved_array(this._flags.last_token, special_words)) {
          this._output.space_before_token = true;
        } else if (this._flags.last_token.text === "declare" && reserved_array(current_token, ["var", "let", "const"])) {
          this._output.space_before_token = true;
        } else if (this._flags.last_token.type !== TOKEN.END_EXPR) {
          if ((this._flags.last_token.type !== TOKEN.START_EXPR || !reserved_array(current_token, ["var", "let", "const"])) && this._flags.last_token.text !== ":") {
            if (reserved_word(current_token, "if") && reserved_word(current_token.previous, "else")) {
              this._output.space_before_token = true;
            } else {
              this.print_newline();
            }
          }
        } else if (reserved_array(current_token, line_starters) && this._flags.last_token.text !== ")") {
          this.print_newline();
        }
      } else if (this._flags.multiline_frame && is_array(this._flags.mode) && this._flags.last_token.text === "," && this._last_last_text === "}") {
        this.print_newline();
      } else if (prefix === "SPACE") {
        this._output.space_before_token = true;
      }
      if (current_token.previous && (current_token.previous.type === TOKEN.WORD || current_token.previous.type === TOKEN.RESERVED)) {
        this._output.space_before_token = true;
      }
      this.print_token(current_token);
      this._flags.last_word = current_token.text;
      if (current_token.type === TOKEN.RESERVED) {
        if (current_token.text === "do") {
          this._flags.do_block = true;
        } else if (current_token.text === "if") {
          this._flags.if_block = true;
        } else if (current_token.text === "import") {
          this._flags.import_block = true;
        } else if (this._flags.import_block && reserved_word(current_token, "from")) {
          this._flags.import_block = false;
        }
      }
    };
    Beautifier.prototype.handle_semicolon = function(current_token) {
      if (this.start_of_statement(current_token)) {
        this._output.space_before_token = false;
      } else {
        this.handle_whitespace_and_comments(current_token);
      }
      var next_token = this._tokens.peek();
      while (this._flags.mode === MODE.Statement && !(this._flags.if_block && reserved_word(next_token, "else")) && !this._flags.do_block) {
        this.restore_mode();
      }
      if (this._flags.import_block) {
        this._flags.import_block = false;
      }
      this.print_token(current_token);
    };
    Beautifier.prototype.handle_string = function(current_token) {
      if (current_token.text.startsWith("`") && current_token.newlines === 0 && current_token.whitespace_before === "" && (current_token.previous.text === ")" || this._flags.last_token.type === TOKEN.WORD)) {
      } else if (this.start_of_statement(current_token)) {
        this._output.space_before_token = true;
      } else {
        this.handle_whitespace_and_comments(current_token);
        if (this._flags.last_token.type === TOKEN.RESERVED || this._flags.last_token.type === TOKEN.WORD || this._flags.inline_frame) {
          this._output.space_before_token = true;
        } else if (this._flags.last_token.type === TOKEN.COMMA || this._flags.last_token.type === TOKEN.START_EXPR || this._flags.last_token.type === TOKEN.EQUALS || this._flags.last_token.type === TOKEN.OPERATOR) {
          if (!this.start_of_object_property()) {
            this.allow_wrap_or_preserved_newline(current_token);
          }
        } else if (current_token.text.startsWith("`") && this._flags.last_token.type === TOKEN.END_EXPR && (current_token.previous.text === "]" || current_token.previous.text === ")") && current_token.newlines === 0) {
          this._output.space_before_token = true;
        } else {
          this.print_newline();
        }
      }
      this.print_token(current_token);
    };
    Beautifier.prototype.handle_equals = function(current_token) {
      if (this.start_of_statement(current_token)) {
      } else {
        this.handle_whitespace_and_comments(current_token);
      }
      if (this._flags.declaration_statement) {
        this._flags.declaration_assignment = true;
      }
      this._output.space_before_token = true;
      this.print_token(current_token);
      this._output.space_before_token = true;
    };
    Beautifier.prototype.handle_comma = function(current_token) {
      this.handle_whitespace_and_comments(current_token, true);
      this.print_token(current_token);
      this._output.space_before_token = true;
      if (this._flags.declaration_statement) {
        if (is_expression(this._flags.parent.mode)) {
          this._flags.declaration_assignment = false;
        }
        if (this._flags.declaration_assignment) {
          this._flags.declaration_assignment = false;
          this.print_newline(false, true);
        } else if (this._options.comma_first) {
          this.allow_wrap_or_preserved_newline(current_token);
        }
      } else if (this._flags.mode === MODE.ObjectLiteral || this._flags.mode === MODE.Statement && this._flags.parent.mode === MODE.ObjectLiteral) {
        if (this._flags.mode === MODE.Statement) {
          this.restore_mode();
        }
        if (!this._flags.inline_frame) {
          this.print_newline();
        }
      } else if (this._options.comma_first) {
        this.allow_wrap_or_preserved_newline(current_token);
      }
    };
    Beautifier.prototype.handle_operator = function(current_token) {
      var isGeneratorAsterisk = current_token.text === "*" && (reserved_array(this._flags.last_token, ["function", "yield"]) || in_array(this._flags.last_token.type, [TOKEN.START_BLOCK, TOKEN.COMMA, TOKEN.END_BLOCK, TOKEN.SEMICOLON]));
      var isUnary = in_array(current_token.text, ["-", "+"]) && (in_array(this._flags.last_token.type, [TOKEN.START_BLOCK, TOKEN.START_EXPR, TOKEN.EQUALS, TOKEN.OPERATOR]) || in_array(this._flags.last_token.text, line_starters) || this._flags.last_token.text === ",");
      if (this.start_of_statement(current_token)) {
      } else {
        var preserve_statement_flags = !isGeneratorAsterisk;
        this.handle_whitespace_and_comments(current_token, preserve_statement_flags);
      }
      if (current_token.text === "*" && this._flags.last_token.type === TOKEN.DOT) {
        this.print_token(current_token);
        return;
      }
      if (current_token.text === "::") {
        this.print_token(current_token);
        return;
      }
      if (in_array(current_token.text, ["-", "+"]) && this.start_of_object_property()) {
        this.print_token(current_token);
        return;
      }
      if (this._flags.last_token.type === TOKEN.OPERATOR && in_array(this._options.operator_position, OPERATOR_POSITION_BEFORE_OR_PRESERVE)) {
        this.allow_wrap_or_preserved_newline(current_token);
      }
      if (current_token.text === ":" && this._flags.in_case) {
        this.print_token(current_token);
        this._flags.in_case = false;
        this._flags.case_body = true;
        if (this._tokens.peek().type !== TOKEN.START_BLOCK) {
          this.indent();
          this.print_newline();
          this._flags.case_block = false;
        } else {
          this._flags.case_block = true;
          this._output.space_before_token = true;
        }
        return;
      }
      var space_before = true;
      var space_after = true;
      var in_ternary = false;
      if (current_token.text === ":") {
        if (this._flags.ternary_depth === 0) {
          space_before = false;
        } else {
          this._flags.ternary_depth -= 1;
          in_ternary = true;
        }
      } else if (current_token.text === "?") {
        this._flags.ternary_depth += 1;
      }
      if (!isUnary && !isGeneratorAsterisk && this._options.preserve_newlines && in_array(current_token.text, positionable_operators)) {
        var isColon = current_token.text === ":";
        var isTernaryColon = isColon && in_ternary;
        var isOtherColon = isColon && !in_ternary;
        switch (this._options.operator_position) {
          case OPERATOR_POSITION.before_newline:
            this._output.space_before_token = !isOtherColon;
            this.print_token(current_token);
            if (!isColon || isTernaryColon) {
              this.allow_wrap_or_preserved_newline(current_token);
            }
            this._output.space_before_token = true;
            return;
          case OPERATOR_POSITION.after_newline:
            this._output.space_before_token = true;
            if (!isColon || isTernaryColon) {
              if (this._tokens.peek().newlines) {
                this.print_newline(false, true);
              } else {
                this.allow_wrap_or_preserved_newline(current_token);
              }
            } else {
              this._output.space_before_token = false;
            }
            this.print_token(current_token);
            this._output.space_before_token = true;
            return;
          case OPERATOR_POSITION.preserve_newline:
            if (!isOtherColon) {
              this.allow_wrap_or_preserved_newline(current_token);
            }
            space_before = !(this._output.just_added_newline() || isOtherColon);
            this._output.space_before_token = space_before;
            this.print_token(current_token);
            this._output.space_before_token = true;
            return;
        }
      }
      if (isGeneratorAsterisk) {
        this.allow_wrap_or_preserved_newline(current_token);
        space_before = false;
        var next_token = this._tokens.peek();
        space_after = next_token && in_array(next_token.type, [TOKEN.WORD, TOKEN.RESERVED]);
      } else if (current_token.text === "...") {
        this.allow_wrap_or_preserved_newline(current_token);
        space_before = this._flags.last_token.type === TOKEN.START_BLOCK;
        space_after = false;
      } else if (in_array(current_token.text, ["--", "++", "!", "~"]) || isUnary) {
        if (this._flags.last_token.type === TOKEN.COMMA || this._flags.last_token.type === TOKEN.START_EXPR) {
          this.allow_wrap_or_preserved_newline(current_token);
        }
        space_before = false;
        space_after = false;
        if (current_token.newlines && (current_token.text === "--" || current_token.text === "++" || current_token.text === "~")) {
          var new_line_needed = reserved_array(this._flags.last_token, special_words) && current_token.newlines;
          if (new_line_needed && (this._previous_flags.if_block || this._previous_flags.else_block)) {
            this.restore_mode();
          }
          this.print_newline(new_line_needed, true);
        }
        if (this._flags.last_token.text === ";" && is_expression(this._flags.mode)) {
          space_before = true;
        }
        if (this._flags.last_token.type === TOKEN.RESERVED) {
          space_before = true;
        } else if (this._flags.last_token.type === TOKEN.END_EXPR) {
          space_before = !(this._flags.last_token.text === "]" && (current_token.text === "--" || current_token.text === "++"));
        } else if (this._flags.last_token.type === TOKEN.OPERATOR) {
          space_before = in_array(current_token.text, ["--", "-", "++", "+"]) && in_array(this._flags.last_token.text, ["--", "-", "++", "+"]);
          if (in_array(current_token.text, ["+", "-"]) && in_array(this._flags.last_token.text, ["--", "++"])) {
            space_after = true;
          }
        }
        if ((this._flags.mode === MODE.BlockStatement && !this._flags.inline_frame || this._flags.mode === MODE.Statement) && (this._flags.last_token.text === "{" || this._flags.last_token.text === ";")) {
          this.print_newline();
        }
      }
      this._output.space_before_token = this._output.space_before_token || space_before;
      this.print_token(current_token);
      this._output.space_before_token = space_after;
    };
    Beautifier.prototype.handle_block_comment = function(current_token, preserve_statement_flags) {
      if (this._output.raw) {
        this._output.add_raw_token(current_token);
        if (current_token.directives && current_token.directives.preserve === "end") {
          this._output.raw = this._options.test_output_raw;
        }
        return;
      }
      if (current_token.directives) {
        this.print_newline(false, preserve_statement_flags);
        this.print_token(current_token);
        if (current_token.directives.preserve === "start") {
          this._output.raw = true;
        }
        this.print_newline(false, true);
        return;
      }
      if (!acorn.newline.test(current_token.text) && !current_token.newlines) {
        this._output.space_before_token = true;
        this.print_token(current_token);
        this._output.space_before_token = true;
        return;
      } else {
        this.print_block_commment(current_token, preserve_statement_flags);
      }
    };
    Beautifier.prototype.print_block_commment = function(current_token, preserve_statement_flags) {
      var lines = split_linebreaks(current_token.text);
      var j;
      var javadoc = false;
      var starless = false;
      var lastIndent = current_token.whitespace_before;
      var lastIndentLength = lastIndent.length;
      this.print_newline(false, preserve_statement_flags);
      this.print_token_line_indentation(current_token);
      this._output.add_token(lines[0]);
      this.print_newline(false, preserve_statement_flags);
      if (lines.length > 1) {
        lines = lines.slice(1);
        javadoc = all_lines_start_with(lines, "*");
        starless = each_line_matches_indent(lines, lastIndent);
        if (javadoc) {
          this._flags.alignment = 1;
        }
        for (j = 0; j < lines.length; j++) {
          if (javadoc) {
            this.print_token_line_indentation(current_token);
            this._output.add_token(ltrim(lines[j]));
          } else if (starless && lines[j]) {
            this.print_token_line_indentation(current_token);
            this._output.add_token(lines[j].substring(lastIndentLength));
          } else {
            this._output.current_line.set_indent(-1);
            this._output.add_token(lines[j]);
          }
          this.print_newline(false, preserve_statement_flags);
        }
        this._flags.alignment = 0;
      }
    };
    Beautifier.prototype.handle_comment = function(current_token, preserve_statement_flags) {
      if (current_token.newlines) {
        this.print_newline(false, preserve_statement_flags);
      } else {
        this._output.trim(true);
      }
      this._output.space_before_token = true;
      this.print_token(current_token);
      this.print_newline(false, preserve_statement_flags);
    };
    Beautifier.prototype.handle_dot = function(current_token) {
      if (this.start_of_statement(current_token)) {
      } else {
        this.handle_whitespace_and_comments(current_token, true);
      }
      if (this._flags.last_token.text.match("^[0-9]+$")) {
        this._output.space_before_token = true;
      }
      if (reserved_array(this._flags.last_token, special_words)) {
        this._output.space_before_token = false;
      } else {
        this.allow_wrap_or_preserved_newline(
          current_token,
          this._flags.last_token.text === ")" && this._options.break_chained_methods
        );
      }
      if (this._options.unindent_chained_methods && this._output.just_added_newline()) {
        this.deindent();
      }
      this.print_token(current_token);
    };
    Beautifier.prototype.handle_unknown = function(current_token, preserve_statement_flags) {
      this.print_token(current_token);
      if (current_token.text[current_token.text.length - 1] === "\n") {
        this.print_newline(false, preserve_statement_flags);
      }
    };
    Beautifier.prototype.handle_eof = function(current_token) {
      while (this._flags.mode === MODE.Statement) {
        this.restore_mode();
      }
      this.handle_whitespace_and_comments(current_token);
    };
    module.exports.Beautifier = Beautifier;
  }
});

// node_modules/js-beautify/js/src/javascript/index.js
var require_javascript = __commonJS({
  "node_modules/js-beautify/js/src/javascript/index.js"(exports, module) {
    "use strict";
    var Beautifier = require_beautifier().Beautifier;
    var Options = require_options2().Options;
    function js_beautify(js_source_text, options) {
      var beautifier = new Beautifier(js_source_text, options);
      return beautifier.beautify();
    }
    module.exports = js_beautify;
    module.exports.defaultOptions = function() {
      return new Options();
    };
  }
});

// node_modules/js-beautify/js/src/css/options.js
var require_options3 = __commonJS({
  "node_modules/js-beautify/js/src/css/options.js"(exports, module) {
    "use strict";
    var BaseOptions = require_options().Options;
    function Options(options) {
      BaseOptions.call(this, options, "css");
      this.selector_separator_newline = this._get_boolean("selector_separator_newline", true);
      this.newline_between_rules = this._get_boolean("newline_between_rules", true);
      var space_around_selector_separator = this._get_boolean("space_around_selector_separator");
      this.space_around_combinator = this._get_boolean("space_around_combinator") || space_around_selector_separator;
      var brace_style_split = this._get_selection_list("brace_style", ["collapse", "expand", "end-expand", "none", "preserve-inline"]);
      this.brace_style = "collapse";
      for (var bs = 0; bs < brace_style_split.length; bs++) {
        if (brace_style_split[bs] !== "expand") {
          this.brace_style = "collapse";
        } else {
          this.brace_style = brace_style_split[bs];
        }
      }
    }
    Options.prototype = new BaseOptions();
    module.exports.Options = Options;
  }
});

// node_modules/js-beautify/js/src/css/beautifier.js
var require_beautifier2 = __commonJS({
  "node_modules/js-beautify/js/src/css/beautifier.js"(exports, module) {
    "use strict";
    var Options = require_options3().Options;
    var Output = require_output().Output;
    var InputScanner = require_inputscanner().InputScanner;
    var Directives = require_directives().Directives;
    var directives_core = new Directives(/\/\*/, /\*\//);
    var lineBreak = /\r\n|[\r\n]/;
    var allLineBreaks = /\r\n|[\r\n]/g;
    var whitespaceChar = /\s/;
    var whitespacePattern = /(?:\s|\n)+/g;
    var block_comment_pattern = /\/\*(?:[\s\S]*?)((?:\*\/)|$)/g;
    var comment_pattern = /\/\/(?:[^\n\r\u2028\u2029]*)/g;
    function Beautifier(source_text, options) {
      this._source_text = source_text || "";
      this._options = new Options(options);
      this._ch = null;
      this._input = null;
      this.NESTED_AT_RULE = {
        "page": true,
        "font-face": true,
        "keyframes": true,
        // also in CONDITIONAL_GROUP_RULE below
        "media": true,
        "supports": true,
        "document": true
      };
      this.CONDITIONAL_GROUP_RULE = {
        "media": true,
        "supports": true,
        "document": true
      };
      this.NON_SEMICOLON_NEWLINE_PROPERTY = [
        "grid-template-areas",
        "grid-template"
      ];
    }
    Beautifier.prototype.eatString = function(endChars) {
      var result = "";
      this._ch = this._input.next();
      while (this._ch) {
        result += this._ch;
        if (this._ch === "\\") {
          result += this._input.next();
        } else if (endChars.indexOf(this._ch) !== -1 || this._ch === "\n") {
          break;
        }
        this._ch = this._input.next();
      }
      return result;
    };
    Beautifier.prototype.eatWhitespace = function(allowAtLeastOneNewLine) {
      var result = whitespaceChar.test(this._input.peek());
      var newline_count = 0;
      while (whitespaceChar.test(this._input.peek())) {
        this._ch = this._input.next();
        if (allowAtLeastOneNewLine && this._ch === "\n") {
          if (newline_count === 0 || newline_count < this._options.max_preserve_newlines) {
            newline_count++;
            this._output.add_new_line(true);
          }
        }
      }
      return result;
    };
    Beautifier.prototype.foundNestedPseudoClass = function() {
      var openParen = 0;
      var i = 1;
      var ch = this._input.peek(i);
      while (ch) {
        if (ch === "{") {
          return true;
        } else if (ch === "(") {
          openParen += 1;
        } else if (ch === ")") {
          if (openParen === 0) {
            return false;
          }
          openParen -= 1;
        } else if (ch === ";" || ch === "}") {
          return false;
        }
        i++;
        ch = this._input.peek(i);
      }
      return false;
    };
    Beautifier.prototype.print_string = function(output_string) {
      this._output.set_indent(this._indentLevel);
      this._output.non_breaking_space = true;
      this._output.add_token(output_string);
    };
    Beautifier.prototype.preserveSingleSpace = function(isAfterSpace) {
      if (isAfterSpace) {
        this._output.space_before_token = true;
      }
    };
    Beautifier.prototype.indent = function() {
      this._indentLevel++;
    };
    Beautifier.prototype.outdent = function() {
      if (this._indentLevel > 0) {
        this._indentLevel--;
      }
    };
    Beautifier.prototype.beautify = function() {
      if (this._options.disabled) {
        return this._source_text;
      }
      var source_text = this._source_text;
      var eol = this._options.eol;
      if (eol === "auto") {
        eol = "\n";
        if (source_text && lineBreak.test(source_text || "")) {
          eol = source_text.match(lineBreak)[0];
        }
      }
      source_text = source_text.replace(allLineBreaks, "\n");
      var baseIndentString = source_text.match(/^[\t ]*/)[0];
      this._output = new Output(this._options, baseIndentString);
      this._input = new InputScanner(source_text);
      this._indentLevel = 0;
      this._nestedLevel = 0;
      this._ch = null;
      var parenLevel = 0;
      var insideRule = false;
      var insidePropertyValue = false;
      var enteringConditionalGroup = false;
      var insideNonNestedAtRule = false;
      var insideScssMap = false;
      var topCharacter = this._ch;
      var insideNonSemiColonValues = false;
      var whitespace;
      var isAfterSpace;
      var previous_ch;
      while (true) {
        whitespace = this._input.read(whitespacePattern);
        isAfterSpace = whitespace !== "";
        previous_ch = topCharacter;
        this._ch = this._input.next();
        if (this._ch === "\\" && this._input.hasNext()) {
          this._ch += this._input.next();
        }
        topCharacter = this._ch;
        if (!this._ch) {
          break;
        } else if (this._ch === "/" && this._input.peek() === "*") {
          this._output.add_new_line();
          this._input.back();
          var comment = this._input.read(block_comment_pattern);
          var directives = directives_core.get_directives(comment);
          if (directives && directives.ignore === "start") {
            comment += directives_core.readIgnored(this._input);
          }
          this.print_string(comment);
          this.eatWhitespace(true);
          this._output.add_new_line();
        } else if (this._ch === "/" && this._input.peek() === "/") {
          this._output.space_before_token = true;
          this._input.back();
          this.print_string(this._input.read(comment_pattern));
          this.eatWhitespace(true);
        } else if (this._ch === "$") {
          this.preserveSingleSpace(isAfterSpace);
          this.print_string(this._ch);
          var variable = this._input.peekUntilAfter(/[: ,;{}()[\]\/='"]/g);
          if (variable.match(/[ :]$/)) {
            variable = this.eatString(": ").replace(/\s+$/, "");
            this.print_string(variable);
            this._output.space_before_token = true;
          }
          if (parenLevel === 0 && variable.indexOf(":") !== -1) {
            insidePropertyValue = true;
            this.indent();
          }
        } else if (this._ch === "@") {
          this.preserveSingleSpace(isAfterSpace);
          if (this._input.peek() === "{") {
            this.print_string(this._ch + this.eatString("}"));
          } else {
            this.print_string(this._ch);
            var variableOrRule = this._input.peekUntilAfter(/[: ,;{}()[\]\/='"]/g);
            if (variableOrRule.match(/[ :]$/)) {
              variableOrRule = this.eatString(": ").replace(/\s+$/, "");
              this.print_string(variableOrRule);
              this._output.space_before_token = true;
            }
            if (parenLevel === 0 && variableOrRule.indexOf(":") !== -1) {
              insidePropertyValue = true;
              this.indent();
            } else if (variableOrRule in this.NESTED_AT_RULE) {
              this._nestedLevel += 1;
              if (variableOrRule in this.CONDITIONAL_GROUP_RULE) {
                enteringConditionalGroup = true;
              }
            } else if (parenLevel === 0 && !insidePropertyValue) {
              insideNonNestedAtRule = true;
            }
          }
        } else if (this._ch === "#" && this._input.peek() === "{") {
          this.preserveSingleSpace(isAfterSpace);
          this.print_string(this._ch + this.eatString("}"));
        } else if (this._ch === "{") {
          if (insidePropertyValue) {
            insidePropertyValue = false;
            this.outdent();
          }
          insideNonNestedAtRule = false;
          if (enteringConditionalGroup) {
            enteringConditionalGroup = false;
            insideRule = this._indentLevel >= this._nestedLevel;
          } else {
            insideRule = this._indentLevel >= this._nestedLevel - 1;
          }
          if (this._options.newline_between_rules && insideRule) {
            if (this._output.previous_line && this._output.previous_line.item(-1) !== "{") {
              this._output.ensure_empty_line_above("/", ",");
            }
          }
          this._output.space_before_token = true;
          if (this._options.brace_style === "expand") {
            this._output.add_new_line();
            this.print_string(this._ch);
            this.indent();
            this._output.set_indent(this._indentLevel);
          } else {
            if (previous_ch === "(") {
              this._output.space_before_token = false;
            } else if (previous_ch !== ",") {
              this.indent();
            }
            this.print_string(this._ch);
          }
          this.eatWhitespace(true);
          this._output.add_new_line();
        } else if (this._ch === "}") {
          this.outdent();
          this._output.add_new_line();
          if (previous_ch === "{") {
            this._output.trim(true);
          }
          if (insidePropertyValue) {
            this.outdent();
            insidePropertyValue = false;
          }
          this.print_string(this._ch);
          insideRule = false;
          if (this._nestedLevel) {
            this._nestedLevel--;
          }
          this.eatWhitespace(true);
          this._output.add_new_line();
          if (this._options.newline_between_rules && !this._output.just_added_blankline()) {
            if (this._input.peek() !== "}") {
              this._output.add_new_line(true);
            }
          }
          if (this._input.peek() === ")") {
            this._output.trim(true);
            if (this._options.brace_style === "expand") {
              this._output.add_new_line(true);
            }
          }
        } else if (this._ch === ":") {
          for (var i = 0; i < this.NON_SEMICOLON_NEWLINE_PROPERTY.length; i++) {
            if (this._input.lookBack(this.NON_SEMICOLON_NEWLINE_PROPERTY[i])) {
              insideNonSemiColonValues = true;
              break;
            }
          }
          if ((insideRule || enteringConditionalGroup) && !(this._input.lookBack("&") || this.foundNestedPseudoClass()) && !this._input.lookBack("(") && !insideNonNestedAtRule && parenLevel === 0) {
            this.print_string(":");
            if (!insidePropertyValue) {
              insidePropertyValue = true;
              this._output.space_before_token = true;
              this.eatWhitespace(true);
              this.indent();
            }
          } else {
            if (this._input.lookBack(" ")) {
              this._output.space_before_token = true;
            }
            if (this._input.peek() === ":") {
              this._ch = this._input.next();
              this.print_string("::");
            } else {
              this.print_string(":");
            }
          }
        } else if (this._ch === '"' || this._ch === "'") {
          var preserveQuoteSpace = previous_ch === '"' || previous_ch === "'";
          this.preserveSingleSpace(preserveQuoteSpace || isAfterSpace);
          this.print_string(this._ch + this.eatString(this._ch));
          this.eatWhitespace(true);
        } else if (this._ch === ";") {
          insideNonSemiColonValues = false;
          if (parenLevel === 0) {
            if (insidePropertyValue) {
              this.outdent();
              insidePropertyValue = false;
            }
            insideNonNestedAtRule = false;
            this.print_string(this._ch);
            this.eatWhitespace(true);
            if (this._input.peek() !== "/") {
              this._output.add_new_line();
            }
          } else {
            this.print_string(this._ch);
            this.eatWhitespace(true);
            this._output.space_before_token = true;
          }
        } else if (this._ch === "(") {
          if (this._input.lookBack("url")) {
            this.print_string(this._ch);
            this.eatWhitespace();
            parenLevel++;
            this.indent();
            this._ch = this._input.next();
            if (this._ch === ")" || this._ch === '"' || this._ch === "'") {
              this._input.back();
            } else if (this._ch) {
              this.print_string(this._ch + this.eatString(")"));
              if (parenLevel) {
                parenLevel--;
                this.outdent();
              }
            }
          } else {
            var space_needed = false;
            if (this._input.lookBack("with")) {
              space_needed = true;
            }
            this.preserveSingleSpace(isAfterSpace || space_needed);
            this.print_string(this._ch);
            if (insidePropertyValue && previous_ch === "$" && this._options.selector_separator_newline) {
              this._output.add_new_line();
              insideScssMap = true;
            } else {
              this.eatWhitespace();
              parenLevel++;
              this.indent();
            }
          }
        } else if (this._ch === ")") {
          if (parenLevel) {
            parenLevel--;
            this.outdent();
          }
          if (insideScssMap && this._input.peek() === ";" && this._options.selector_separator_newline) {
            insideScssMap = false;
            this.outdent();
            this._output.add_new_line();
          }
          this.print_string(this._ch);
        } else if (this._ch === ",") {
          this.print_string(this._ch);
          this.eatWhitespace(true);
          if (this._options.selector_separator_newline && (!insidePropertyValue || insideScssMap) && parenLevel === 0 && !insideNonNestedAtRule) {
            this._output.add_new_line();
          } else {
            this._output.space_before_token = true;
          }
        } else if ((this._ch === ">" || this._ch === "+" || this._ch === "~") && !insidePropertyValue && parenLevel === 0) {
          if (this._options.space_around_combinator) {
            this._output.space_before_token = true;
            this.print_string(this._ch);
            this._output.space_before_token = true;
          } else {
            this.print_string(this._ch);
            this.eatWhitespace();
            if (this._ch && whitespaceChar.test(this._ch)) {
              this._ch = "";
            }
          }
        } else if (this._ch === "]") {
          this.print_string(this._ch);
        } else if (this._ch === "[") {
          this.preserveSingleSpace(isAfterSpace);
          this.print_string(this._ch);
        } else if (this._ch === "=") {
          this.eatWhitespace();
          this.print_string("=");
          if (whitespaceChar.test(this._ch)) {
            this._ch = "";
          }
        } else if (this._ch === "!" && !this._input.lookBack("\\")) {
          this._output.space_before_token = true;
          this.print_string(this._ch);
        } else {
          var preserveAfterSpace = previous_ch === '"' || previous_ch === "'";
          this.preserveSingleSpace(preserveAfterSpace || isAfterSpace);
          this.print_string(this._ch);
          if (!this._output.just_added_newline() && this._input.peek() === "\n" && insideNonSemiColonValues) {
            this._output.add_new_line();
          }
        }
      }
      var sweetCode = this._output.get_code(eol);
      return sweetCode;
    };
    module.exports.Beautifier = Beautifier;
  }
});

// node_modules/js-beautify/js/src/css/index.js
var require_css = __commonJS({
  "node_modules/js-beautify/js/src/css/index.js"(exports, module) {
    "use strict";
    var Beautifier = require_beautifier2().Beautifier;
    var Options = require_options3().Options;
    function css_beautify(source_text, options) {
      var beautifier = new Beautifier(source_text, options);
      return beautifier.beautify();
    }
    module.exports = css_beautify;
    module.exports.defaultOptions = function() {
      return new Options();
    };
  }
});

// node_modules/js-beautify/js/src/html/options.js
var require_options4 = __commonJS({
  "node_modules/js-beautify/js/src/html/options.js"(exports, module) {
    "use strict";
    var BaseOptions = require_options().Options;
    function Options(options) {
      BaseOptions.call(this, options, "html");
      if (this.templating.length === 1 && this.templating[0] === "auto") {
        this.templating = ["django", "erb", "handlebars", "php"];
      }
      this.indent_inner_html = this._get_boolean("indent_inner_html");
      this.indent_body_inner_html = this._get_boolean("indent_body_inner_html", true);
      this.indent_head_inner_html = this._get_boolean("indent_head_inner_html", true);
      this.indent_handlebars = this._get_boolean("indent_handlebars", true);
      this.wrap_attributes = this._get_selection(
        "wrap_attributes",
        ["auto", "force", "force-aligned", "force-expand-multiline", "aligned-multiple", "preserve", "preserve-aligned"]
      );
      this.wrap_attributes_min_attrs = this._get_number("wrap_attributes_min_attrs", 2);
      this.wrap_attributes_indent_size = this._get_number("wrap_attributes_indent_size", this.indent_size);
      this.extra_liners = this._get_array("extra_liners", ["head", "body", "/html"]);
      this.inline = this._get_array("inline", [
        "a",
        "abbr",
        "area",
        "audio",
        "b",
        "bdi",
        "bdo",
        "br",
        "button",
        "canvas",
        "cite",
        "code",
        "data",
        "datalist",
        "del",
        "dfn",
        "em",
        "embed",
        "i",
        "iframe",
        "img",
        "input",
        "ins",
        "kbd",
        "keygen",
        "label",
        "map",
        "mark",
        "math",
        "meter",
        "noscript",
        "object",
        "output",
        "progress",
        "q",
        "ruby",
        "s",
        "samp",
        /* 'script', */
        "select",
        "small",
        "span",
        "strong",
        "sub",
        "sup",
        "svg",
        "template",
        "textarea",
        "time",
        "u",
        "var",
        "video",
        "wbr",
        "text",
        // obsolete inline tags
        "acronym",
        "big",
        "strike",
        "tt"
      ]);
      this.inline_custom_elements = this._get_boolean("inline_custom_elements", true);
      this.void_elements = this._get_array("void_elements", [
        // HTLM void elements - aka self-closing tags - aka singletons
        // https://www.w3.org/html/wg/drafts/html/master/syntax.html#void-elements
        "area",
        "base",
        "br",
        "col",
        "embed",
        "hr",
        "img",
        "input",
        "keygen",
        "link",
        "menuitem",
        "meta",
        "param",
        "source",
        "track",
        "wbr",
        // NOTE: Optional tags are too complex for a simple list
        // they are hard coded in _do_optional_end_element
        // Doctype and xml elements
        "!doctype",
        "?xml",
        // obsolete tags
        // basefont: https://www.computerhope.com/jargon/h/html-basefont-tag.htm
        // isndex: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/isindex
        "basefont",
        "isindex"
      ]);
      this.unformatted = this._get_array("unformatted", []);
      this.content_unformatted = this._get_array("content_unformatted", [
        "pre",
        "textarea"
      ]);
      this.unformatted_content_delimiter = this._get_characters("unformatted_content_delimiter");
      this.indent_scripts = this._get_selection("indent_scripts", ["normal", "keep", "separate"]);
    }
    Options.prototype = new BaseOptions();
    module.exports.Options = Options;
  }
});

// node_modules/js-beautify/js/src/html/tokenizer.js
var require_tokenizer3 = __commonJS({
  "node_modules/js-beautify/js/src/html/tokenizer.js"(exports, module) {
    "use strict";
    var BaseTokenizer = require_tokenizer().Tokenizer;
    var BASETOKEN = require_tokenizer().TOKEN;
    var Directives = require_directives().Directives;
    var TemplatablePattern = require_templatablepattern().TemplatablePattern;
    var Pattern = require_pattern().Pattern;
    var TOKEN = {
      TAG_OPEN: "TK_TAG_OPEN",
      TAG_CLOSE: "TK_TAG_CLOSE",
      CONTROL_FLOW_OPEN: "TK_CONTROL_FLOW_OPEN",
      CONTROL_FLOW_CLOSE: "TK_CONTROL_FLOW_CLOSE",
      ATTRIBUTE: "TK_ATTRIBUTE",
      EQUALS: "TK_EQUALS",
      VALUE: "TK_VALUE",
      COMMENT: "TK_COMMENT",
      TEXT: "TK_TEXT",
      UNKNOWN: "TK_UNKNOWN",
      START: BASETOKEN.START,
      RAW: BASETOKEN.RAW,
      EOF: BASETOKEN.EOF
    };
    var directives_core = new Directives(/<\!--/, /-->/);
    var Tokenizer = function(input_string, options) {
      BaseTokenizer.call(this, input_string, options);
      this._current_tag_name = "";
      var templatable_reader = new TemplatablePattern(this._input).read_options(this._options);
      var pattern_reader = new Pattern(this._input);
      this.__patterns = {
        word: templatable_reader.until(/[\n\r\t <]/),
        word_control_flow_close_excluded: templatable_reader.until(/[\n\r\t <}]/),
        single_quote: templatable_reader.until_after(/'/),
        double_quote: templatable_reader.until_after(/"/),
        attribute: templatable_reader.until(/[\n\r\t =>]|\/>/),
        element_name: templatable_reader.until(/[\n\r\t >\/]/),
        angular_control_flow_start: pattern_reader.matching(/\@[a-zA-Z]+[^({]*[({]/),
        handlebars_comment: pattern_reader.starting_with(/{{!--/).until_after(/--}}/),
        handlebars: pattern_reader.starting_with(/{{/).until_after(/}}/),
        handlebars_open: pattern_reader.until(/[\n\r\t }]/),
        handlebars_raw_close: pattern_reader.until(/}}/),
        comment: pattern_reader.starting_with(/<!--/).until_after(/-->/),
        cdata: pattern_reader.starting_with(/<!\[CDATA\[/).until_after(/]]>/),
        // https://en.wikipedia.org/wiki/Conditional_comment
        conditional_comment: pattern_reader.starting_with(/<!\[/).until_after(/]>/),
        processing: pattern_reader.starting_with(/<\?/).until_after(/\?>/)
      };
      if (this._options.indent_handlebars) {
        this.__patterns.word = this.__patterns.word.exclude("handlebars");
        this.__patterns.word_control_flow_close_excluded = this.__patterns.word_control_flow_close_excluded.exclude("handlebars");
      }
      this._unformatted_content_delimiter = null;
      if (this._options.unformatted_content_delimiter) {
        var literal_regexp = this._input.get_literal_regexp(this._options.unformatted_content_delimiter);
        this.__patterns.unformatted_content_delimiter = pattern_reader.matching(literal_regexp).until_after(literal_regexp);
      }
    };
    Tokenizer.prototype = new BaseTokenizer();
    Tokenizer.prototype._is_comment = function(current_token) {
      return false;
    };
    Tokenizer.prototype._is_opening = function(current_token) {
      return current_token.type === TOKEN.TAG_OPEN || current_token.type === TOKEN.CONTROL_FLOW_OPEN;
    };
    Tokenizer.prototype._is_closing = function(current_token, open_token) {
      return current_token.type === TOKEN.TAG_CLOSE && (open_token && ((current_token.text === ">" || current_token.text === "/>") && open_token.text[0] === "<" || current_token.text === "}}" && open_token.text[0] === "{" && open_token.text[1] === "{")) || current_token.type === TOKEN.CONTROL_FLOW_CLOSE && (current_token.text === "}" && open_token.text.endsWith("{"));
    };
    Tokenizer.prototype._reset = function() {
      this._current_tag_name = "";
    };
    Tokenizer.prototype._get_next_token = function(previous_token, open_token) {
      var token = null;
      this._readWhitespace();
      var c = this._input.peek();
      if (c === null) {
        return this._create_token(TOKEN.EOF, "");
      }
      token = token || this._read_open_handlebars(c, open_token);
      token = token || this._read_attribute(c, previous_token, open_token);
      token = token || this._read_close(c, open_token);
      token = token || this._read_script_and_style(c, previous_token);
      token = token || this._read_control_flows(c, open_token);
      token = token || this._read_raw_content(c, previous_token, open_token);
      token = token || this._read_content_word(c, open_token);
      token = token || this._read_comment_or_cdata(c);
      token = token || this._read_processing(c);
      token = token || this._read_open(c, open_token);
      token = token || this._create_token(TOKEN.UNKNOWN, this._input.next());
      return token;
    };
    Tokenizer.prototype._read_comment_or_cdata = function(c) {
      var token = null;
      var resulting_string = null;
      var directives = null;
      if (c === "<") {
        var peek1 = this._input.peek(1);
        if (peek1 === "!") {
          resulting_string = this.__patterns.comment.read();
          if (resulting_string) {
            directives = directives_core.get_directives(resulting_string);
            if (directives && directives.ignore === "start") {
              resulting_string += directives_core.readIgnored(this._input);
            }
          } else {
            resulting_string = this.__patterns.cdata.read();
          }
        }
        if (resulting_string) {
          token = this._create_token(TOKEN.COMMENT, resulting_string);
          token.directives = directives;
        }
      }
      return token;
    };
    Tokenizer.prototype._read_processing = function(c) {
      var token = null;
      var resulting_string = null;
      var directives = null;
      if (c === "<") {
        var peek1 = this._input.peek(1);
        if (peek1 === "!" || peek1 === "?") {
          resulting_string = this.__patterns.conditional_comment.read();
          resulting_string = resulting_string || this.__patterns.processing.read();
        }
        if (resulting_string) {
          token = this._create_token(TOKEN.COMMENT, resulting_string);
          token.directives = directives;
        }
      }
      return token;
    };
    Tokenizer.prototype._read_open = function(c, open_token) {
      var resulting_string = null;
      var token = null;
      if (!open_token || open_token.type === TOKEN.CONTROL_FLOW_OPEN) {
        if (c === "<") {
          resulting_string = this._input.next();
          if (this._input.peek() === "/") {
            resulting_string += this._input.next();
          }
          resulting_string += this.__patterns.element_name.read();
          token = this._create_token(TOKEN.TAG_OPEN, resulting_string);
        }
      }
      return token;
    };
    Tokenizer.prototype._read_open_handlebars = function(c, open_token) {
      var resulting_string = null;
      var token = null;
      if (!open_token || open_token.type === TOKEN.CONTROL_FLOW_OPEN) {
        if ((this._options.templating.includes("angular") || this._options.indent_handlebars) && c === "{" && this._input.peek(1) === "{") {
          if (this._options.indent_handlebars && this._input.peek(2) === "!") {
            resulting_string = this.__patterns.handlebars_comment.read();
            resulting_string = resulting_string || this.__patterns.handlebars.read();
            token = this._create_token(TOKEN.COMMENT, resulting_string);
          } else {
            resulting_string = this.__patterns.handlebars_open.read();
            token = this._create_token(TOKEN.TAG_OPEN, resulting_string);
          }
        }
      }
      return token;
    };
    Tokenizer.prototype._read_control_flows = function(c, open_token) {
      var resulting_string = "";
      var token = null;
      if (!this._options.templating.includes("angular")) {
        return token;
      }
      if (c === "@") {
        resulting_string = this.__patterns.angular_control_flow_start.read();
        if (resulting_string === "") {
          return token;
        }
        var opening_parentheses_count = resulting_string.endsWith("(") ? 1 : 0;
        var closing_parentheses_count = 0;
        while (!(resulting_string.endsWith("{") && opening_parentheses_count === closing_parentheses_count)) {
          var next_char = this._input.next();
          if (next_char === null) {
            break;
          } else if (next_char === "(") {
            opening_parentheses_count++;
          } else if (next_char === ")") {
            closing_parentheses_count++;
          }
          resulting_string += next_char;
        }
        token = this._create_token(TOKEN.CONTROL_FLOW_OPEN, resulting_string);
      } else if (c === "}" && open_token && open_token.type === TOKEN.CONTROL_FLOW_OPEN) {
        resulting_string = this._input.next();
        token = this._create_token(TOKEN.CONTROL_FLOW_CLOSE, resulting_string);
      }
      return token;
    };
    Tokenizer.prototype._read_close = function(c, open_token) {
      var resulting_string = null;
      var token = null;
      if (open_token && open_token.type === TOKEN.TAG_OPEN) {
        if (open_token.text[0] === "<" && (c === ">" || c === "/" && this._input.peek(1) === ">")) {
          resulting_string = this._input.next();
          if (c === "/") {
            resulting_string += this._input.next();
          }
          token = this._create_token(TOKEN.TAG_CLOSE, resulting_string);
        } else if (open_token.text[0] === "{" && c === "}" && this._input.peek(1) === "}") {
          this._input.next();
          this._input.next();
          token = this._create_token(TOKEN.TAG_CLOSE, "}}");
        }
      }
      return token;
    };
    Tokenizer.prototype._read_attribute = function(c, previous_token, open_token) {
      var token = null;
      var resulting_string = "";
      if (open_token && open_token.text[0] === "<") {
        if (c === "=") {
          token = this._create_token(TOKEN.EQUALS, this._input.next());
        } else if (c === '"' || c === "'") {
          var content = this._input.next();
          if (c === '"') {
            content += this.__patterns.double_quote.read();
          } else {
            content += this.__patterns.single_quote.read();
          }
          token = this._create_token(TOKEN.VALUE, content);
        } else {
          resulting_string = this.__patterns.attribute.read();
          if (resulting_string) {
            if (previous_token.type === TOKEN.EQUALS) {
              token = this._create_token(TOKEN.VALUE, resulting_string);
            } else {
              token = this._create_token(TOKEN.ATTRIBUTE, resulting_string);
            }
          }
        }
      }
      return token;
    };
    Tokenizer.prototype._is_content_unformatted = function(tag_name) {
      return this._options.void_elements.indexOf(tag_name) === -1 && (this._options.content_unformatted.indexOf(tag_name) !== -1 || this._options.unformatted.indexOf(tag_name) !== -1);
    };
    Tokenizer.prototype._read_raw_content = function(c, previous_token, open_token) {
      var resulting_string = "";
      if (open_token && open_token.text[0] === "{") {
        resulting_string = this.__patterns.handlebars_raw_close.read();
      } else if (previous_token.type === TOKEN.TAG_CLOSE && previous_token.opened.text[0] === "<" && previous_token.text[0] !== "/") {
        var tag_name = previous_token.opened.text.substr(1).toLowerCase();
        if (this._is_content_unformatted(tag_name)) {
          resulting_string = this._input.readUntil(new RegExp("</" + tag_name + "[\\n\\r\\t ]*?>", "ig"));
        }
      }
      if (resulting_string) {
        return this._create_token(TOKEN.TEXT, resulting_string);
      }
      return null;
    };
    Tokenizer.prototype._read_script_and_style = function(c, previous_token) {
      if (previous_token.type === TOKEN.TAG_CLOSE && previous_token.opened.text[0] === "<" && previous_token.text[0] !== "/") {
        var tag_name = previous_token.opened.text.substr(1).toLowerCase();
        if (tag_name === "script" || tag_name === "style") {
          var token = this._read_comment_or_cdata(c);
          if (token) {
            token.type = TOKEN.TEXT;
            return token;
          }
          var resulting_string = this._input.readUntil(new RegExp("</" + tag_name + "[\\n\\r\\t ]*?>", "ig"));
          if (resulting_string) {
            return this._create_token(TOKEN.TEXT, resulting_string);
          }
        }
      }
      return null;
    };
    Tokenizer.prototype._read_content_word = function(c, open_token) {
      var resulting_string = "";
      if (this._options.unformatted_content_delimiter) {
        if (c === this._options.unformatted_content_delimiter[0]) {
          resulting_string = this.__patterns.unformatted_content_delimiter.read();
        }
      }
      if (!resulting_string) {
        resulting_string = open_token && open_token.type === TOKEN.CONTROL_FLOW_OPEN ? this.__patterns.word_control_flow_close_excluded.read() : this.__patterns.word.read();
      }
      if (resulting_string) {
        return this._create_token(TOKEN.TEXT, resulting_string);
      }
      return null;
    };
    module.exports.Tokenizer = Tokenizer;
    module.exports.TOKEN = TOKEN;
  }
});

// node_modules/js-beautify/js/src/html/beautifier.js
var require_beautifier3 = __commonJS({
  "node_modules/js-beautify/js/src/html/beautifier.js"(exports, module) {
    "use strict";
    var Options = require_options4().Options;
    var Output = require_output().Output;
    var Tokenizer = require_tokenizer3().Tokenizer;
    var TOKEN = require_tokenizer3().TOKEN;
    var lineBreak = /\r\n|[\r\n]/;
    var allLineBreaks = /\r\n|[\r\n]/g;
    var Printer = function(options, base_indent_string) {
      this.indent_level = 0;
      this.alignment_size = 0;
      this.max_preserve_newlines = options.max_preserve_newlines;
      this.preserve_newlines = options.preserve_newlines;
      this._output = new Output(options, base_indent_string);
    };
    Printer.prototype.current_line_has_match = function(pattern) {
      return this._output.current_line.has_match(pattern);
    };
    Printer.prototype.set_space_before_token = function(value, non_breaking) {
      this._output.space_before_token = value;
      this._output.non_breaking_space = non_breaking;
    };
    Printer.prototype.set_wrap_point = function() {
      this._output.set_indent(this.indent_level, this.alignment_size);
      this._output.set_wrap_point();
    };
    Printer.prototype.add_raw_token = function(token) {
      this._output.add_raw_token(token);
    };
    Printer.prototype.print_preserved_newlines = function(raw_token) {
      var newlines = 0;
      if (raw_token.type !== TOKEN.TEXT && raw_token.previous.type !== TOKEN.TEXT) {
        newlines = raw_token.newlines ? 1 : 0;
      }
      if (this.preserve_newlines) {
        newlines = raw_token.newlines < this.max_preserve_newlines + 1 ? raw_token.newlines : this.max_preserve_newlines + 1;
      }
      for (var n = 0; n < newlines; n++) {
        this.print_newline(n > 0);
      }
      return newlines !== 0;
    };
    Printer.prototype.traverse_whitespace = function(raw_token) {
      if (raw_token.whitespace_before || raw_token.newlines) {
        if (!this.print_preserved_newlines(raw_token)) {
          this._output.space_before_token = true;
        }
        return true;
      }
      return false;
    };
    Printer.prototype.previous_token_wrapped = function() {
      return this._output.previous_token_wrapped;
    };
    Printer.prototype.print_newline = function(force) {
      this._output.add_new_line(force);
    };
    Printer.prototype.print_token = function(token) {
      if (token.text) {
        this._output.set_indent(this.indent_level, this.alignment_size);
        this._output.add_token(token.text);
      }
    };
    Printer.prototype.indent = function() {
      this.indent_level++;
    };
    Printer.prototype.deindent = function() {
      if (this.indent_level > 0) {
        this.indent_level--;
        this._output.set_indent(this.indent_level, this.alignment_size);
      }
    };
    Printer.prototype.get_full_indent = function(level) {
      level = this.indent_level + (level || 0);
      if (level < 1) {
        return "";
      }
      return this._output.get_indent_string(level);
    };
    var get_type_attribute = function(start_token) {
      var result = null;
      var raw_token = start_token.next;
      while (raw_token.type !== TOKEN.EOF && start_token.closed !== raw_token) {
        if (raw_token.type === TOKEN.ATTRIBUTE && raw_token.text === "type") {
          if (raw_token.next && raw_token.next.type === TOKEN.EQUALS && raw_token.next.next && raw_token.next.next.type === TOKEN.VALUE) {
            result = raw_token.next.next.text;
          }
          break;
        }
        raw_token = raw_token.next;
      }
      return result;
    };
    var get_custom_beautifier_name = function(tag_check, raw_token) {
      var typeAttribute = null;
      var result = null;
      if (!raw_token.closed) {
        return null;
      }
      if (tag_check === "script") {
        typeAttribute = "text/javascript";
      } else if (tag_check === "style") {
        typeAttribute = "text/css";
      }
      typeAttribute = get_type_attribute(raw_token) || typeAttribute;
      if (typeAttribute.search("text/css") > -1) {
        result = "css";
      } else if (typeAttribute.search(/module|importmap|((text|application|dojo)\/(x-)?(javascript|ecmascript|jscript|livescript|(ld\+)?json|method|aspect))/) > -1) {
        result = "javascript";
      } else if (typeAttribute.search(/(text|application|dojo)\/(x-)?(html)/) > -1) {
        result = "html";
      } else if (typeAttribute.search(/test\/null/) > -1) {
        result = "null";
      }
      return result;
    };
    function in_array(what, arr) {
      return arr.indexOf(what) !== -1;
    }
    function TagFrame(parent, parser_token, indent_level) {
      this.parent = parent || null;
      this.tag = parser_token ? parser_token.tag_name : "";
      this.indent_level = indent_level || 0;
      this.parser_token = parser_token || null;
    }
    function TagStack(printer) {
      this._printer = printer;
      this._current_frame = null;
    }
    TagStack.prototype.get_parser_token = function() {
      return this._current_frame ? this._current_frame.parser_token : null;
    };
    TagStack.prototype.record_tag = function(parser_token) {
      var new_frame = new TagFrame(this._current_frame, parser_token, this._printer.indent_level);
      this._current_frame = new_frame;
    };
    TagStack.prototype._try_pop_frame = function(frame) {
      var parser_token = null;
      if (frame) {
        parser_token = frame.parser_token;
        this._printer.indent_level = frame.indent_level;
        this._current_frame = frame.parent;
      }
      return parser_token;
    };
    TagStack.prototype._get_frame = function(tag_list, stop_list) {
      var frame = this._current_frame;
      while (frame) {
        if (tag_list.indexOf(frame.tag) !== -1) {
          break;
        } else if (stop_list && stop_list.indexOf(frame.tag) !== -1) {
          frame = null;
          break;
        }
        frame = frame.parent;
      }
      return frame;
    };
    TagStack.prototype.try_pop = function(tag, stop_list) {
      var frame = this._get_frame([tag], stop_list);
      return this._try_pop_frame(frame);
    };
    TagStack.prototype.indent_to_tag = function(tag_list) {
      var frame = this._get_frame(tag_list);
      if (frame) {
        this._printer.indent_level = frame.indent_level;
      }
    };
    function Beautifier(source_text, options, js_beautify, css_beautify) {
      this._source_text = source_text || "";
      options = options || {};
      this._js_beautify = js_beautify;
      this._css_beautify = css_beautify;
      this._tag_stack = null;
      var optionHtml = new Options(options, "html");
      this._options = optionHtml;
      this._is_wrap_attributes_force = this._options.wrap_attributes.substr(0, "force".length) === "force";
      this._is_wrap_attributes_force_expand_multiline = this._options.wrap_attributes === "force-expand-multiline";
      this._is_wrap_attributes_force_aligned = this._options.wrap_attributes === "force-aligned";
      this._is_wrap_attributes_aligned_multiple = this._options.wrap_attributes === "aligned-multiple";
      this._is_wrap_attributes_preserve = this._options.wrap_attributes.substr(0, "preserve".length) === "preserve";
      this._is_wrap_attributes_preserve_aligned = this._options.wrap_attributes === "preserve-aligned";
    }
    Beautifier.prototype.beautify = function() {
      if (this._options.disabled) {
        return this._source_text;
      }
      var source_text = this._source_text;
      var eol = this._options.eol;
      if (this._options.eol === "auto") {
        eol = "\n";
        if (source_text && lineBreak.test(source_text)) {
          eol = source_text.match(lineBreak)[0];
        }
      }
      source_text = source_text.replace(allLineBreaks, "\n");
      var baseIndentString = source_text.match(/^[\t ]*/)[0];
      var last_token = {
        text: "",
        type: ""
      };
      var last_tag_token = new TagOpenParserToken(this._options);
      var printer = new Printer(this._options, baseIndentString);
      var tokens = new Tokenizer(source_text, this._options).tokenize();
      this._tag_stack = new TagStack(printer);
      var parser_token = null;
      var raw_token = tokens.next();
      while (raw_token.type !== TOKEN.EOF) {
        if (raw_token.type === TOKEN.TAG_OPEN || raw_token.type === TOKEN.COMMENT) {
          parser_token = this._handle_tag_open(printer, raw_token, last_tag_token, last_token, tokens);
          last_tag_token = parser_token;
        } else if (raw_token.type === TOKEN.ATTRIBUTE || raw_token.type === TOKEN.EQUALS || raw_token.type === TOKEN.VALUE || raw_token.type === TOKEN.TEXT && !last_tag_token.tag_complete) {
          parser_token = this._handle_inside_tag(printer, raw_token, last_tag_token, last_token);
        } else if (raw_token.type === TOKEN.TAG_CLOSE) {
          parser_token = this._handle_tag_close(printer, raw_token, last_tag_token);
        } else if (raw_token.type === TOKEN.TEXT) {
          parser_token = this._handle_text(printer, raw_token, last_tag_token);
        } else if (raw_token.type === TOKEN.CONTROL_FLOW_OPEN) {
          parser_token = this._handle_control_flow_open(printer, raw_token);
        } else if (raw_token.type === TOKEN.CONTROL_FLOW_CLOSE) {
          parser_token = this._handle_control_flow_close(printer, raw_token);
        } else {
          printer.add_raw_token(raw_token);
        }
        last_token = parser_token;
        raw_token = tokens.next();
      }
      var sweet_code = printer._output.get_code(eol);
      return sweet_code;
    };
    Beautifier.prototype._handle_control_flow_open = function(printer, raw_token) {
      var parser_token = {
        text: raw_token.text,
        type: raw_token.type
      };
      printer.set_space_before_token(raw_token.newlines || raw_token.whitespace_before !== "", true);
      if (raw_token.newlines) {
        printer.print_preserved_newlines(raw_token);
      } else {
        printer.set_space_before_token(raw_token.newlines || raw_token.whitespace_before !== "", true);
      }
      printer.print_token(raw_token);
      printer.indent();
      return parser_token;
    };
    Beautifier.prototype._handle_control_flow_close = function(printer, raw_token) {
      var parser_token = {
        text: raw_token.text,
        type: raw_token.type
      };
      printer.deindent();
      if (raw_token.newlines) {
        printer.print_preserved_newlines(raw_token);
      } else {
        printer.set_space_before_token(raw_token.newlines || raw_token.whitespace_before !== "", true);
      }
      printer.print_token(raw_token);
      return parser_token;
    };
    Beautifier.prototype._handle_tag_close = function(printer, raw_token, last_tag_token) {
      var parser_token = {
        text: raw_token.text,
        type: raw_token.type
      };
      printer.alignment_size = 0;
      last_tag_token.tag_complete = true;
      printer.set_space_before_token(raw_token.newlines || raw_token.whitespace_before !== "", true);
      if (last_tag_token.is_unformatted) {
        printer.add_raw_token(raw_token);
      } else {
        if (last_tag_token.tag_start_char === "<") {
          printer.set_space_before_token(raw_token.text[0] === "/", true);
          if (this._is_wrap_attributes_force_expand_multiline && last_tag_token.has_wrapped_attrs) {
            printer.print_newline(false);
          }
        }
        printer.print_token(raw_token);
      }
      if (last_tag_token.indent_content && !(last_tag_token.is_unformatted || last_tag_token.is_content_unformatted)) {
        printer.indent();
        last_tag_token.indent_content = false;
      }
      if (!last_tag_token.is_inline_element && !(last_tag_token.is_unformatted || last_tag_token.is_content_unformatted)) {
        printer.set_wrap_point();
      }
      return parser_token;
    };
    Beautifier.prototype._handle_inside_tag = function(printer, raw_token, last_tag_token, last_token) {
      var wrapped = last_tag_token.has_wrapped_attrs;
      var parser_token = {
        text: raw_token.text,
        type: raw_token.type
      };
      printer.set_space_before_token(raw_token.newlines || raw_token.whitespace_before !== "", true);
      if (last_tag_token.is_unformatted) {
        printer.add_raw_token(raw_token);
      } else if (last_tag_token.tag_start_char === "{" && raw_token.type === TOKEN.TEXT) {
        if (printer.print_preserved_newlines(raw_token)) {
          raw_token.newlines = 0;
          printer.add_raw_token(raw_token);
        } else {
          printer.print_token(raw_token);
        }
      } else {
        if (raw_token.type === TOKEN.ATTRIBUTE) {
          printer.set_space_before_token(true);
        } else if (raw_token.type === TOKEN.EQUALS) {
          printer.set_space_before_token(false);
        } else if (raw_token.type === TOKEN.VALUE && raw_token.previous.type === TOKEN.EQUALS) {
          printer.set_space_before_token(false);
        }
        if (raw_token.type === TOKEN.ATTRIBUTE && last_tag_token.tag_start_char === "<") {
          if (this._is_wrap_attributes_preserve || this._is_wrap_attributes_preserve_aligned) {
            printer.traverse_whitespace(raw_token);
            wrapped = wrapped || raw_token.newlines !== 0;
          }
          if (this._is_wrap_attributes_force && last_tag_token.attr_count >= this._options.wrap_attributes_min_attrs && (last_token.type !== TOKEN.TAG_OPEN || // ie. second attribute and beyond
          this._is_wrap_attributes_force_expand_multiline)) {
            printer.print_newline(false);
            wrapped = true;
          }
        }
        printer.print_token(raw_token);
        wrapped = wrapped || printer.previous_token_wrapped();
        last_tag_token.has_wrapped_attrs = wrapped;
      }
      return parser_token;
    };
    Beautifier.prototype._handle_text = function(printer, raw_token, last_tag_token) {
      var parser_token = {
        text: raw_token.text,
        type: "TK_CONTENT"
      };
      if (last_tag_token.custom_beautifier_name) {
        this._print_custom_beatifier_text(printer, raw_token, last_tag_token);
      } else if (last_tag_token.is_unformatted || last_tag_token.is_content_unformatted) {
        printer.add_raw_token(raw_token);
      } else {
        printer.traverse_whitespace(raw_token);
        printer.print_token(raw_token);
      }
      return parser_token;
    };
    Beautifier.prototype._print_custom_beatifier_text = function(printer, raw_token, last_tag_token) {
      var local = this;
      if (raw_token.text !== "") {
        var text = raw_token.text, _beautifier, script_indent_level = 1, pre = "", post = "";
        if (last_tag_token.custom_beautifier_name === "javascript" && typeof this._js_beautify === "function") {
          _beautifier = this._js_beautify;
        } else if (last_tag_token.custom_beautifier_name === "css" && typeof this._css_beautify === "function") {
          _beautifier = this._css_beautify;
        } else if (last_tag_token.custom_beautifier_name === "html") {
          _beautifier = function(html_source, options) {
            var beautifier = new Beautifier(html_source, options, local._js_beautify, local._css_beautify);
            return beautifier.beautify();
          };
        }
        if (this._options.indent_scripts === "keep") {
          script_indent_level = 0;
        } else if (this._options.indent_scripts === "separate") {
          script_indent_level = -printer.indent_level;
        }
        var indentation = printer.get_full_indent(script_indent_level);
        text = text.replace(/\n[ \t]*$/, "");
        if (last_tag_token.custom_beautifier_name !== "html" && text[0] === "<" && text.match(/^(<!--|<!\[CDATA\[)/)) {
          var matched = /^(<!--[^\n]*|<!\[CDATA\[)(\n?)([ \t\n]*)([\s\S]*)(-->|]]>)$/.exec(text);
          if (!matched) {
            printer.add_raw_token(raw_token);
            return;
          }
          pre = indentation + matched[1] + "\n";
          text = matched[4];
          if (matched[5]) {
            post = indentation + matched[5];
          }
          text = text.replace(/\n[ \t]*$/, "");
          if (matched[2] || matched[3].indexOf("\n") !== -1) {
            matched = matched[3].match(/[ \t]+$/);
            if (matched) {
              raw_token.whitespace_before = matched[0];
            }
          }
        }
        if (text) {
          if (_beautifier) {
            var Child_options = function() {
              this.eol = "\n";
            };
            Child_options.prototype = this._options.raw_options;
            var child_options = new Child_options();
            text = _beautifier(indentation + text, child_options);
          } else {
            var white = raw_token.whitespace_before;
            if (white) {
              text = text.replace(new RegExp("\n(" + white + ")?", "g"), "\n");
            }
            text = indentation + text.replace(/\n/g, "\n" + indentation);
          }
        }
        if (pre) {
          if (!text) {
            text = pre + post;
          } else {
            text = pre + text + "\n" + post;
          }
        }
        printer.print_newline(false);
        if (text) {
          raw_token.text = text;
          raw_token.whitespace_before = "";
          raw_token.newlines = 0;
          printer.add_raw_token(raw_token);
          printer.print_newline(true);
        }
      }
    };
    Beautifier.prototype._handle_tag_open = function(printer, raw_token, last_tag_token, last_token, tokens) {
      var parser_token = this._get_tag_open_token(raw_token);
      if ((last_tag_token.is_unformatted || last_tag_token.is_content_unformatted) && !last_tag_token.is_empty_element && raw_token.type === TOKEN.TAG_OPEN && !parser_token.is_start_tag) {
        printer.add_raw_token(raw_token);
        parser_token.start_tag_token = this._tag_stack.try_pop(parser_token.tag_name);
      } else {
        printer.traverse_whitespace(raw_token);
        this._set_tag_position(printer, raw_token, parser_token, last_tag_token, last_token);
        if (!parser_token.is_inline_element) {
          printer.set_wrap_point();
        }
        printer.print_token(raw_token);
      }
      if (parser_token.is_start_tag && this._is_wrap_attributes_force) {
        var peek_index = 0;
        var peek_token;
        do {
          peek_token = tokens.peek(peek_index);
          if (peek_token.type === TOKEN.ATTRIBUTE) {
            parser_token.attr_count += 1;
          }
          peek_index += 1;
        } while (peek_token.type !== TOKEN.EOF && peek_token.type !== TOKEN.TAG_CLOSE);
      }
      if (this._is_wrap_attributes_force_aligned || this._is_wrap_attributes_aligned_multiple || this._is_wrap_attributes_preserve_aligned) {
        parser_token.alignment_size = raw_token.text.length + 1;
      }
      if (!parser_token.tag_complete && !parser_token.is_unformatted) {
        printer.alignment_size = parser_token.alignment_size;
      }
      return parser_token;
    };
    var TagOpenParserToken = function(options, parent, raw_token) {
      this.parent = parent || null;
      this.text = "";
      this.type = "TK_TAG_OPEN";
      this.tag_name = "";
      this.is_inline_element = false;
      this.is_unformatted = false;
      this.is_content_unformatted = false;
      this.is_empty_element = false;
      this.is_start_tag = false;
      this.is_end_tag = false;
      this.indent_content = false;
      this.multiline_content = false;
      this.custom_beautifier_name = null;
      this.start_tag_token = null;
      this.attr_count = 0;
      this.has_wrapped_attrs = false;
      this.alignment_size = 0;
      this.tag_complete = false;
      this.tag_start_char = "";
      this.tag_check = "";
      if (!raw_token) {
        this.tag_complete = true;
      } else {
        var tag_check_match;
        this.tag_start_char = raw_token.text[0];
        this.text = raw_token.text;
        if (this.tag_start_char === "<") {
          tag_check_match = raw_token.text.match(/^<([^\s>]*)/);
          this.tag_check = tag_check_match ? tag_check_match[1] : "";
        } else {
          tag_check_match = raw_token.text.match(/^{{~?(?:[\^]|#\*?)?([^\s}]+)/);
          this.tag_check = tag_check_match ? tag_check_match[1] : "";
          if ((raw_token.text.startsWith("{{#>") || raw_token.text.startsWith("{{~#>")) && this.tag_check[0] === ">") {
            if (this.tag_check === ">" && raw_token.next !== null) {
              this.tag_check = raw_token.next.text.split(" ")[0];
            } else {
              this.tag_check = raw_token.text.split(">")[1];
            }
          }
        }
        this.tag_check = this.tag_check.toLowerCase();
        if (raw_token.type === TOKEN.COMMENT) {
          this.tag_complete = true;
        }
        this.is_start_tag = this.tag_check.charAt(0) !== "/";
        this.tag_name = !this.is_start_tag ? this.tag_check.substr(1) : this.tag_check;
        this.is_end_tag = !this.is_start_tag || raw_token.closed && raw_token.closed.text === "/>";
        var handlebar_starts = 2;
        if (this.tag_start_char === "{" && this.text.length >= 3) {
          if (this.text.charAt(2) === "~") {
            handlebar_starts = 3;
          }
        }
        this.is_end_tag = this.is_end_tag || this.tag_start_char === "{" && (!options.indent_handlebars || this.text.length < 3 || /[^#\^]/.test(this.text.charAt(handlebar_starts)));
      }
    };
    Beautifier.prototype._get_tag_open_token = function(raw_token) {
      var parser_token = new TagOpenParserToken(this._options, this._tag_stack.get_parser_token(), raw_token);
      parser_token.alignment_size = this._options.wrap_attributes_indent_size;
      parser_token.is_end_tag = parser_token.is_end_tag || in_array(parser_token.tag_check, this._options.void_elements);
      parser_token.is_empty_element = parser_token.tag_complete || parser_token.is_start_tag && parser_token.is_end_tag;
      parser_token.is_unformatted = !parser_token.tag_complete && in_array(parser_token.tag_check, this._options.unformatted);
      parser_token.is_content_unformatted = !parser_token.is_empty_element && in_array(parser_token.tag_check, this._options.content_unformatted);
      parser_token.is_inline_element = in_array(parser_token.tag_name, this._options.inline) || this._options.inline_custom_elements && parser_token.tag_name.includes("-") || parser_token.tag_start_char === "{";
      return parser_token;
    };
    Beautifier.prototype._set_tag_position = function(printer, raw_token, parser_token, last_tag_token, last_token) {
      if (!parser_token.is_empty_element) {
        if (parser_token.is_end_tag) {
          parser_token.start_tag_token = this._tag_stack.try_pop(parser_token.tag_name);
        } else {
          if (this._do_optional_end_element(parser_token)) {
            if (!parser_token.is_inline_element) {
              printer.print_newline(false);
            }
          }
          this._tag_stack.record_tag(parser_token);
          if ((parser_token.tag_name === "script" || parser_token.tag_name === "style") && !(parser_token.is_unformatted || parser_token.is_content_unformatted)) {
            parser_token.custom_beautifier_name = get_custom_beautifier_name(parser_token.tag_check, raw_token);
          }
        }
      }
      if (in_array(parser_token.tag_check, this._options.extra_liners)) {
        printer.print_newline(false);
        if (!printer._output.just_added_blankline()) {
          printer.print_newline(true);
        }
      }
      if (parser_token.is_empty_element) {
        if (parser_token.tag_start_char === "{" && parser_token.tag_check === "else") {
          this._tag_stack.indent_to_tag(["if", "unless", "each"]);
          parser_token.indent_content = true;
          var foundIfOnCurrentLine = printer.current_line_has_match(/{{#if/);
          if (!foundIfOnCurrentLine) {
            printer.print_newline(false);
          }
        }
        if (parser_token.tag_name === "!--" && last_token.type === TOKEN.TAG_CLOSE && last_tag_token.is_end_tag && parser_token.text.indexOf("\n") === -1) {
        } else {
          if (!(parser_token.is_inline_element || parser_token.is_unformatted)) {
            printer.print_newline(false);
          }
          this._calcluate_parent_multiline(printer, parser_token);
        }
      } else if (parser_token.is_end_tag) {
        var do_end_expand = false;
        do_end_expand = parser_token.start_tag_token && parser_token.start_tag_token.multiline_content;
        do_end_expand = do_end_expand || !parser_token.is_inline_element && !(last_tag_token.is_inline_element || last_tag_token.is_unformatted) && !(last_token.type === TOKEN.TAG_CLOSE && parser_token.start_tag_token === last_tag_token) && last_token.type !== "TK_CONTENT";
        if (parser_token.is_content_unformatted || parser_token.is_unformatted) {
          do_end_expand = false;
        }
        if (do_end_expand) {
          printer.print_newline(false);
        }
      } else {
        parser_token.indent_content = !parser_token.custom_beautifier_name;
        if (parser_token.tag_start_char === "<") {
          if (parser_token.tag_name === "html") {
            parser_token.indent_content = this._options.indent_inner_html;
          } else if (parser_token.tag_name === "head") {
            parser_token.indent_content = this._options.indent_head_inner_html;
          } else if (parser_token.tag_name === "body") {
            parser_token.indent_content = this._options.indent_body_inner_html;
          }
        }
        if (!(parser_token.is_inline_element || parser_token.is_unformatted) && (last_token.type !== "TK_CONTENT" || parser_token.is_content_unformatted)) {
          printer.print_newline(false);
        }
        this._calcluate_parent_multiline(printer, parser_token);
      }
    };
    Beautifier.prototype._calcluate_parent_multiline = function(printer, parser_token) {
      if (parser_token.parent && printer._output.just_added_newline() && !((parser_token.is_inline_element || parser_token.is_unformatted) && parser_token.parent.is_inline_element)) {
        parser_token.parent.multiline_content = true;
      }
    };
    var p_closers = ["address", "article", "aside", "blockquote", "details", "div", "dl", "fieldset", "figcaption", "figure", "footer", "form", "h1", "h2", "h3", "h4", "h5", "h6", "header", "hr", "main", "menu", "nav", "ol", "p", "pre", "section", "table", "ul"];
    var p_parent_excludes = ["a", "audio", "del", "ins", "map", "noscript", "video"];
    Beautifier.prototype._do_optional_end_element = function(parser_token) {
      var result = null;
      if (parser_token.is_empty_element || !parser_token.is_start_tag || !parser_token.parent) {
        return;
      }
      if (parser_token.tag_name === "body") {
        result = result || this._tag_stack.try_pop("head");
      } else if (parser_token.tag_name === "li") {
        result = result || this._tag_stack.try_pop("li", ["ol", "ul", "menu"]);
      } else if (parser_token.tag_name === "dd" || parser_token.tag_name === "dt") {
        result = result || this._tag_stack.try_pop("dt", ["dl"]);
        result = result || this._tag_stack.try_pop("dd", ["dl"]);
      } else if (parser_token.parent.tag_name === "p" && p_closers.indexOf(parser_token.tag_name) !== -1) {
        var p_parent = parser_token.parent.parent;
        if (!p_parent || p_parent_excludes.indexOf(p_parent.tag_name) === -1) {
          result = result || this._tag_stack.try_pop("p");
        }
      } else if (parser_token.tag_name === "rp" || parser_token.tag_name === "rt") {
        result = result || this._tag_stack.try_pop("rt", ["ruby", "rtc"]);
        result = result || this._tag_stack.try_pop("rp", ["ruby", "rtc"]);
      } else if (parser_token.tag_name === "optgroup") {
        result = result || this._tag_stack.try_pop("optgroup", ["select"]);
      } else if (parser_token.tag_name === "option") {
        result = result || this._tag_stack.try_pop("option", ["select", "datalist", "optgroup"]);
      } else if (parser_token.tag_name === "colgroup") {
        result = result || this._tag_stack.try_pop("caption", ["table"]);
      } else if (parser_token.tag_name === "thead") {
        result = result || this._tag_stack.try_pop("caption", ["table"]);
        result = result || this._tag_stack.try_pop("colgroup", ["table"]);
      } else if (parser_token.tag_name === "tbody" || parser_token.tag_name === "tfoot") {
        result = result || this._tag_stack.try_pop("caption", ["table"]);
        result = result || this._tag_stack.try_pop("colgroup", ["table"]);
        result = result || this._tag_stack.try_pop("thead", ["table"]);
        result = result || this._tag_stack.try_pop("tbody", ["table"]);
      } else if (parser_token.tag_name === "tr") {
        result = result || this._tag_stack.try_pop("caption", ["table"]);
        result = result || this._tag_stack.try_pop("colgroup", ["table"]);
        result = result || this._tag_stack.try_pop("tr", ["table", "thead", "tbody", "tfoot"]);
      } else if (parser_token.tag_name === "th" || parser_token.tag_name === "td") {
        result = result || this._tag_stack.try_pop("td", ["table", "thead", "tbody", "tfoot", "tr"]);
        result = result || this._tag_stack.try_pop("th", ["table", "thead", "tbody", "tfoot", "tr"]);
      }
      parser_token.parent = this._tag_stack.get_parser_token();
      return result;
    };
    module.exports.Beautifier = Beautifier;
  }
});

// node_modules/js-beautify/js/src/html/index.js
var require_html = __commonJS({
  "node_modules/js-beautify/js/src/html/index.js"(exports, module) {
    "use strict";
    var Beautifier = require_beautifier3().Beautifier;
    var Options = require_options4().Options;
    function style_html(html_source, options, js_beautify, css_beautify) {
      var beautifier = new Beautifier(html_source, options, js_beautify, css_beautify);
      return beautifier.beautify();
    }
    module.exports = style_html;
    module.exports.defaultOptions = function() {
      return new Options();
    };
  }
});

// node_modules/js-beautify/js/src/index.js
var require_src = __commonJS({
  "node_modules/js-beautify/js/src/index.js"(exports, module) {
    "use strict";
    var js_beautify = require_javascript();
    var css_beautify = require_css();
    var html_beautify = require_html();
    function style_html(html_source, options, js, css) {
      js = js || js_beautify;
      css = css || css_beautify;
      return html_beautify(html_source, options, js, css);
    }
    style_html.defaultOptions = html_beautify.defaultOptions;
    module.exports.js = js_beautify;
    module.exports.css = css_beautify;
    module.exports.html = style_html;
  }
});

// node_modules/js-beautify/js/index.js
var require_js = __commonJS({
  "node_modules/js-beautify/js/index.js"(exports, module) {
    "use strict";
    function get_beautify(js_beautify, css_beautify, html_beautify) {
      var beautify2 = function(src, config) {
        return js_beautify.js_beautify(src, config);
      };
      beautify2.js = js_beautify.js_beautify;
      beautify2.css = css_beautify.css_beautify;
      beautify2.html = html_beautify.html_beautify;
      beautify2.js_beautify = js_beautify.js_beautify;
      beautify2.css_beautify = css_beautify.css_beautify;
      beautify2.html_beautify = html_beautify.html_beautify;
      return beautify2;
    }
    if (typeof define === "function" && define.amd) {
      define([
        "./lib/beautify",
        "./lib/beautify-css",
        "./lib/beautify-html"
      ], function(js_beautify, css_beautify, html_beautify) {
        return get_beautify(js_beautify, css_beautify, html_beautify);
      });
    } else {
      (function(mod) {
        var beautifier = require_src();
        beautifier.js_beautify = beautifier.js;
        beautifier.css_beautify = beautifier.css;
        beautifier.html_beautify = beautifier.html;
        mod.exports = get_beautify(beautifier, beautifier, beautifier);
      })(module);
    }
  }
});

// src/core/types.ts
var VERSION = "0.1.0";

// src/core/session.ts
import fs from "node:fs";
import path from "node:path";
var Session = class _Session {
  constructor(dir) {
    this.dir = dir;
  }
  dir;
  static create(host, outRoot) {
    const root = path.resolve(outRoot ?? process.env.REA_APP_OUT ?? path.join(process.env.CLAUDE_PROJECT_DIR ?? process.cwd(), "rea-app-out"));
    const d = /* @__PURE__ */ new Date();
    const p = (n) => String(n).padStart(2, "0");
    const stamp = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
    const safeHost = host.replace(/[^A-Za-z0-9.-]/g, "_");
    const dir = path.join(root, safeHost, stamp);
    fs.mkdirSync(dir, { recursive: true });
    return new _Session(dir);
  }
  static open(dir) {
    const abs = path.resolve(dir);
    if (!fs.existsSync(path.join(abs, "capture.json")) && !fs.existsSync(path.join(abs, "trace"))) {
      throw new Error(`No hay una sesi\xF3n de REA APP en ${abs}. Ejecuta primero app_open.`);
    }
    return new _Session(abs);
  }
  abs(rel) {
    const full = path.resolve(this.dir, rel);
    if (!full.startsWith(path.resolve(this.dir))) throw new Error(`Ruta fuera de la sesi\xF3n: ${rel}`);
    return full;
  }
  exists(rel) {
    return fs.existsSync(this.abs(rel));
  }
  write(rel, content) {
    const full = this.abs(rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content);
    return rel.replace(/\\/g, "/");
  }
  writeJson(rel, value) {
    return this.write(rel, JSON.stringify(value, null, 2));
  }
  read(rel) {
    return fs.readFileSync(this.abs(rel), "utf8");
  }
  readJson(rel) {
    return JSON.parse(this.read(rel));
  }
  readJsonl(rel) {
    if (!this.exists(rel)) return [];
    return this.read(rel).split("\n").filter(Boolean).map((l) => JSON.parse(l));
  }
  saveResult(result) {
    this.writeJson(`analysis/${result.tool}.json`, result);
    return result;
  }
  loadResult(tool) {
    const rel = `analysis/${tool}.json`;
    return this.exists(rel) ? this.readJson(rel) : null;
  }
};
var Findings = class {
  constructor(area, prefix) {
    this.area = area;
    this.prefix = prefix;
  }
  area;
  prefix;
  list = [];
  unknowns = [];
  add(title, opts = {}) {
    const f = {
      id: `${this.prefix}-${String(this.list.length + 1).padStart(2, "0")}`,
      area: this.area,
      title,
      detail: opts.detail,
      confidence: opts.confidence ?? "alta",
      evidence: opts.evidence ?? []
    };
    this.list.push(f);
    return f;
  }
  unknown(text) {
    this.unknowns.push(text);
  }
};
function lineOf(haystack, needle, from = 0) {
  if (!needle) return void 0;
  const idx = haystack.indexOf(needle, from);
  if (idx === -1) return void 0;
  let line = 1;
  for (let i = 0; i < idx; i++) if (haystack.charCodeAt(i) === 10) line++;
  return line;
}
function slug(input, max = 60) {
  const s = input.replace(/^https?:\/\//, "").replace(/[?#].*$/, "").replace(/[^A-Za-z0-9._-]+/g, "_").replace(/^_+|_+$/g, "");
  return (s.length > max ? s.slice(s.length - max) : s) || "recurso";
}

// src/core/policy.ts
var USER_AGENT_SUFFIX = `rea-app/${VERSION}`;
var DEFAULT_MIN_INTERVAL_MS = Number(process.env.REA_APP_MIN_INTERVAL_MS ?? 500);
var ETHICS_NOTICE = "REA APP est\xE1 pensada para aplicaciones propias, autorizadas o de estudio. No introduce credenciales ni evade inicios de sesi\xF3n, CAPTCHAs, pagos o protecciones anti-bot; no acciona operaciones con efectos reales; limita el ritmo de peticiones y enmascara tokens, cookies y datos personales.";
var PolicyError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "PolicyError";
  }
};
function assertAllowedUrl(raw) {
  let u;
  try {
    u = new URL(raw);
  } catch {
    throw new PolicyError(`URL no v\xE1lida: ${raw}`);
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") {
    throw new PolicyError(`Solo se admiten URLs http(s). Recibido: ${u.protocol}`);
  }
  if (u.username || u.password) {
    throw new PolicyError("No se admiten credenciales dentro de la URL.");
  }
  return u;
}
var RateLimiter = class {
  constructor(minIntervalMs = DEFAULT_MIN_INTERVAL_MS) {
    this.minIntervalMs = minIntervalMs;
  }
  minIntervalMs;
  last = /* @__PURE__ */ new Map();
  async wait(host) {
    const now = Date.now();
    const next = Math.max(now, (this.last.get(host) ?? 0) + this.minIntervalMs);
    this.last.set(host, next);
    if (next > now) await new Promise((r) => setTimeout(r, next - now));
  }
};
var limiter = new RateLimiter();
async function politeFetch(url, opts = {}) {
  const u = assertAllowedUrl(url);
  await limiter.wait(u.host);
  try {
    const res = await fetch(u, {
      headers: { "user-agent": `Mozilla/5.0 (compatible; ${USER_AGENT_SUFFIX})` },
      signal: AbortSignal.timeout(opts.timeoutMs ?? 15e3),
      redirect: "follow"
    });
    const max = opts.maxBytes ?? 30 * 1024 * 1024;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > max) return null;
    return { ok: res.ok, status: res.status, text: buf.toString("utf8"), headers: res.headers };
  } catch {
    return null;
  }
}
function parseRobots(text) {
  const groups = [];
  let current = null;
  let lastWasAgent = false;
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*/, "").trim();
    const m = /^([A-Za-z-]+)\s*:\s*(.*)$/.exec(line);
    if (!m) continue;
    const key = m[1].toLowerCase();
    const value = m[2].trim();
    if (key === "user-agent") {
      if (!current || !lastWasAgent) {
        current = { agents: [], rules: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
      lastWasAgent = true;
    } else if ((key === "allow" || key === "disallow") && current) {
      lastWasAgent = false;
      if (value) current.rules.push({ allow: key === "allow", path: value });
    } else {
      lastWasAgent = false;
    }
  }
  return groups;
}
function ruleMatches(rulePath, path6) {
  const anchored = rulePath.endsWith("$");
  const body = anchored ? rulePath.slice(0, -1) : rulePath;
  const re = new RegExp(
    "^" + body.split("*").map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join(".*") + (anchored ? "$" : "")
  );
  return re.test(path6);
}
function robotsAllows(text, path6, agent = "rea-app") {
  const groups = parseRobots(text);
  const own = groups.filter((g) => g.agents.some((a) => a !== "*" && agent.toLowerCase().includes(a)));
  const pick = own.length ? own : groups.filter((g) => g.agents.includes("*"));
  let best = null;
  for (const g of pick) {
    for (const r of g.rules) {
      if (!ruleMatches(r.path, path6)) continue;
      if (!best || r.path.length > best.path.length || r.path.length === best.path.length && r.allow) best = r;
    }
  }
  if (!best) return { allowed: true };
  return { allowed: best.allow, rule: `${best.allow ? "Allow" : "Disallow"}: ${best.path}` };
}
async function checkRobots(target) {
  const res = await politeFetch(new URL("/robots.txt", target).toString(), { timeoutMs: 8e3, maxBytes: 512 * 1024 });
  if (!res || !res.ok) return { allowed: true };
  return robotsAllows(res.text, target.pathname + target.search);
}
var FORBIDDEN_INPUT = /(pass(word|wd)?|contrase|card|tarjeta|cvv|cvc|cc-|iban|ssn|otp|one-time|captcha)/i;
var FORBIDDEN_CLICK = /(captcha|pagar|pay\s*now|realizar\s+pago|checkout|comprar\s+ahora|buy\s+now|place\s+order|confirmar\s+(pedido|compra|pago))/i;
var FORBIDDEN_OPERATION = /\b(transferir|transferencia|transfer|enviar\s+dinero|send\s+money|wire|bizum|retirar|withdraw|depositar|deposit|comprar|buy|vender|sell|orden|order|operar|trade|invertir|invest|pagar|pay|firmar|sign|autorizar|authori[sz]e|confirmar|confirm|eliminar|borrar|delete|remove|cancelar\s+cuenta|close\s+account|dar\s+de\s+baja|publicar|publish|enviar|submit|send)\b/i;

// src/core/browser.ts
import { createRequire } from "node:module";
import path2 from "node:path";
import { pathToFileURL } from "node:url";
var BrowserMissingError = class extends Error {
  constructor(detail) {
    super(
      `No se pudo iniciar un navegador Chromium (${detail}). Ejecuta la herramienta app_setup, o \`npm run setup\` en la carpeta de rea-app, para instalar Playwright y Chromium.`
    );
    this.name = "BrowserMissingError";
  }
};
async function loadPlaywright() {
  try {
    return await import("playwright");
  } catch {
  }
  const bases = [process.env.CLAUDE_PLUGIN_DATA, process.env.CLAUDE_PLUGIN_ROOT, process.cwd()].filter(
    (b) => !!b
  );
  for (const base of bases) {
    try {
      const req = createRequire(path2.join(base, "noop.js"));
      const mod = await import(pathToFileURL(req.resolve("playwright")).href);
      const pw = mod.chromium ? mod : mod.default;
      if (pw?.chromium) return pw;
    } catch {
    }
  }
  throw new BrowserMissingError("el paquete playwright no est\xE1 instalado");
}
async function launchBrowser(headless = true) {
  const pw = await loadPlaywright();
  const attempts = [
    { label: "Chromium de Playwright", opts: {} },
    { label: "Google Chrome del sistema", opts: { channel: "chrome" } },
    { label: "Microsoft Edge del sistema", opts: { channel: "msedge" } }
  ];
  let last2 = "";
  for (const a of attempts) {
    try {
      const browser = await pw.chromium.launch({ headless, ...a.opts });
      return { browser, label: `${a.label} ${browser.version()}` };
    } catch (e) {
      last2 = String(e.message).split("\n")[0];
    }
  }
  throw new BrowserMissingError(last2);
}
async function newContext(browser, harPath) {
  const probe = await browser.newContext();
  const page = await probe.newPage();
  const ua = await page.evaluate(() => navigator.userAgent);
  await probe.close();
  return browser.newContext({
    userAgent: `${ua} ${USER_AGENT_SUFFIX}`,
    viewport: { width: 1366, height: 900 },
    ...harPath ? { recordHar: { path: harPath, content: "omit" } } : {}
  });
}

// src/core/recorder.ts
import fs2 from "node:fs";

// src/core/redact.ts
var SENSITIVE_NAME = /(pass(word|wd)?|contrase|secret|token|auth|session|sess|sid$|^sid|cookie|csrf|xsrf|api[-_]?key|apikey|access[-_]?key|private|credential|signature|jwt|bearer|otp|pin$|ssn|dni|cedula|card|cvv|cvc|iban|email|correo|phone|telefono|tel$|address|direccion)/i;
var SENSITIVE_HEADERS = /* @__PURE__ */ new Set([
  "cookie",
  "set-cookie",
  "authorization",
  "proxy-authorization",
  "x-api-key",
  "x-auth-token",
  "x-csrf-token",
  "x-xsrf-token"
]);
var JWT = /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{4,}\b/g;
var BEARER = /\b(Bearer|Basic)\s+[A-Za-z0-9._~+/=-]{8,}/gi;
var EMAIL = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}\b/g;
var KNOWN_KEYS = /\b(sk-[A-Za-z0-9_-]{20,}|sk_(live|test)_[A-Za-z0-9]{16,}|pk_(live|test)_[A-Za-z0-9]{16,}|AKIA[0-9A-Z]{16}|gh[pousr]_[A-Za-z0-9]{30,}|xox[baprs]-[A-Za-z0-9-]{10,}|AIza[0-9A-Za-z_-]{35})\b/g;
var CARD = /\b(?:\d[ -]?){13,19}\b/g;
var KEY_VALUE = /(["']?[\w.-]*(?:password|passwd|secret|token|api[-_]?key|apikey|session[-_]?id|sessionid|csrf|xsrf|credential|access[-_]?key)[\w.-]*["']?\s*[:=]\s*)(["']?)([^"'\s&;,}<>]{6,})\2/gi;
function luhn(digits) {
  let sum = 0;
  let alt = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits.charCodeAt(i) - 48;
    if (alt) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    alt = !alt;
  }
  return sum % 10 === 0;
}
function redactText(input) {
  if (!input) return input;
  return input.replace(JWT, "[JWT_ENMASCARADO]").replace(BEARER, (_m, scheme) => `${scheme} [ENMASCARADO]`).replace(KNOWN_KEYS, "[CLAVE_ENMASCARADA]").replace(KEY_VALUE, (_m, pre, q) => `${pre}${q}[ENMASCARADO]${q}`).replace(EMAIL, "[EMAIL_ENMASCARADO]").replace(CARD, (m) => {
    const digits = m.replace(/\D/g, "");
    return digits.length >= 13 && digits.length <= 19 && luhn(digits) ? "[TARJETA_ENMASCARADA]" : m;
  });
}
var CODE_LITERAL = /((?:password|passwd|secret|token|api[-_]?key|apikey|access[-_]?key|client[-_]?secret)\w*["']?\s*[:=]\s*)(["'`])([^"'`\s]{12,})\2/gi;
function redactCode(input) {
  if (!input) return input;
  return input.replace(JWT, "[JWT_ENMASCARADO]").replace(BEARER, (_m, scheme) => `${scheme} [ENMASCARADO]`).replace(KNOWN_KEYS, "[CLAVE_ENMASCARADA]").replace(CODE_LITERAL, (_m, pre, q) => `${pre}${q}[ENMASCARADO]${q}`).replace(EMAIL, "[EMAIL_ENMASCARADO]");
}
function redactHtml(input) {
  if (!input) return input;
  const maskAttr = (tag, attr) => tag.replace(new RegExp(`(\\s${attr}\\s*=\\s*)("[^"]*"|'[^']*')`, "i"), (_m, pre) => `${pre}"[ENMASCARADO]"`);
  const html = input.replace(/<input\b[^>]*>/gi, (tag) => {
    const name = /\sname\s*=\s*["']?([^"'\s>]+)/i.exec(tag)?.[1] ?? "";
    const hidden = /\stype\s*=\s*["']?hidden/i.test(tag);
    return hidden || SENSITIVE_NAME.test(name) ? maskAttr(tag, "value") : tag;
  }).replace(/<meta\b[^>]*>/gi, (tag) => /(csrf|xsrf|token|api-?key)/i.test(tag) ? maskAttr(tag, "content") : tag);
  return redactCode(html);
}
function classifyValue(v) {
  if (v === "" || v == null) return "vac\xEDo";
  if (/^eyJ[\w-]+\.[\w-]+\.[\w-]+$/.test(v)) return "jwt";
  if (/^(true|false)$/i.test(v)) return "booleano";
  if (/^-?\d+(\.\d+)?$/.test(v)) return "n\xFAmero";
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)) return "uuid";
  if (/^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2})?/.test(v)) return "fecha";
  if (/^https?:\/\//i.test(v)) return "url";
  if (/^[\[{]/.test(v.trim())) {
    try {
      JSON.parse(v);
      return "json";
    } catch {
    }
  }
  if (/^[0-9a-f]{16,}$/i.test(v)) return "hex";
  if (/^[A-Za-z0-9+/_-]{20,}={0,2}$/.test(v)) return "base64";
  return "texto";
}
function looksSecret(v) {
  const k = classifyValue(v);
  return k === "jwt" || (k === "hex" || k === "base64") && v.length >= 24;
}
function redactUrl(raw) {
  if (raw.startsWith("data:")) return raw.slice(0, raw.indexOf(",") + 1 || 30) + "[\u2026]";
  let u;
  try {
    u = new URL(raw);
  } catch {
    return redactText(raw);
  }
  if (u.username || u.password) {
    u.username = "ENMASCARADO";
    u.password = "";
  }
  for (const [k, v] of [...u.searchParams.entries()]) {
    if (SENSITIVE_NAME.test(k) || looksSecret(v)) u.searchParams.set(k, "ENMASCARADO");
  }
  if (u.hash && /(token|key|secret|code)=/i.test(u.hash)) u.hash = "#ENMASCARADO";
  return redactText(u.toString());
}
function redactHeaders(headers) {
  const out = {};
  for (const [name, value] of Object.entries(headers)) {
    const lower = name.toLowerCase();
    if (lower === "cookie" || lower === "set-cookie") {
      out[lower] = value.split(/\n/).map(
        (line) => line.split(";").map((part, i) => {
          const eq = part.indexOf("=");
          if (eq === -1) return part.trim();
          const key = part.slice(0, eq).trim();
          const isAttr = lower === "set-cookie" && i > 0;
          return isAttr ? part.trim() : `${key}=[ENMASCARADO]`;
        }).join("; ")
      ).join("\n");
    } else if (SENSITIVE_HEADERS.has(lower) || /(token|secret|auth|api-?key|session)/i.test(lower)) {
      out[lower] = "[ENMASCARADO]";
    } else if (lower === "referer" || lower === "location") {
      out[lower] = redactUrl(value);
    } else {
      out[lower] = redactText(value);
    }
  }
  return out;
}
function redactHar(har) {
  const entries = har?.log?.entries ?? [];
  const fixHeaders = (list) => {
    if (!Array.isArray(list)) return;
    for (const h of list) {
      const red = redactHeaders({ [h.name]: String(h.value ?? "") });
      h.value = Object.values(red)[0];
    }
  };
  for (const e of entries) {
    if (e.request) {
      e.request.url = redactUrl(String(e.request.url ?? ""));
      fixHeaders(e.request.headers);
      for (const c of e.request.cookies ?? []) c.value = "[ENMASCARADO]";
      for (const q of e.request.queryString ?? []) {
        if (SENSITIVE_NAME.test(q.name) || looksSecret(String(q.value))) q.value = "[ENMASCARADO]";
        else q.value = redactText(String(q.value));
      }
      if (e.request.postData) {
        const len = String(e.request.postData.text ?? "").length;
        e.request.postData.text = `[CUERPO_OMITIDO ${len} caracteres]`;
        for (const p of e.request.postData.params ?? []) p.value = "[ENMASCARADO]";
      }
    }
    if (e.response) {
      fixHeaders(e.response.headers);
      for (const c of e.response.cookies ?? []) c.value = "[ENMASCARADO]";
      if (e.response.redirectURL) e.response.redirectURL = redactUrl(String(e.response.redirectURL));
      if (e.response.content?.text) {
        e.response.content.text = "[CUERPO_OMITIDO]";
        delete e.response.content.encoding;
      }
    }
  }
  for (const p of har?.log?.pages ?? []) {
    if (p.title) p.title = redactUrl(String(p.title));
  }
  return har;
}
function maskDigits(input) {
  return input ? input.replace(/\d[\d.,\s-]{2,}\d|\d{3,}/g, (m) => m.replace(/\d/g, "#")) : input;
}
function privatizeUrl(raw) {
  const mask = (s) => s.replace(/\d{4,}/g, (m) => "#".repeat(Math.min(m.length, 8)));
  try {
    const u = new URL(raw);
    return `${u.origin}${mask(u.pathname)}${mask(u.search)}${mask(u.hash)}`;
  } catch {
    return mask(raw);
  }
}

// src/core/schema.ts
var MAX_DEPTH = 6;
var MAX_PROPS = 40;
var MAX_ITEMS = 25;
function stringFormat(v) {
  if (/^\d{4}-\d{2}-\d{2}(T[\d:.]+(Z|[+-]\d{2}:?\d{2})?)?$/.test(v)) return "fecha";
  if (/^https?:\/\//.test(v)) return "url";
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v)) return "uuid";
  if (/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(v)) return "email";
  if (/^eyJ[\w-]+\.[\w-]+\.[\w-]+$/.test(v)) return "jwt";
  return void 0;
}
function inferSchema(value, depth = 0) {
  if (value === null) return { type: "null" };
  if (typeof value === "string") {
    const format = stringFormat(value);
    return format ? { type: "string", format } : { type: "string" };
  }
  if (typeof value === "number") return { type: "number" };
  if (typeof value === "boolean") return { type: "boolean" };
  if (depth >= MAX_DEPTH) return { type: "unknown" };
  if (Array.isArray(value)) {
    let items = null;
    for (const item of value.slice(0, MAX_ITEMS)) {
      const s = inferSchema(item, depth + 1);
      items = items ? mergeSchemas(items, s) : s;
    }
    return { type: "array", items, length: value.length };
  }
  if (typeof value === "object") {
    const props = {};
    const keys = Object.keys(value);
    for (const k of keys.slice(0, MAX_PROPS)) {
      props[k] = inferSchema(value[k], depth + 1);
    }
    return keys.length > MAX_PROPS ? { type: "object", props, truncated: true } : { type: "object", props };
  }
  return { type: "unknown" };
}
function mergeSchemas(a, b) {
  if (a.type === "object" && b.type === "object") {
    const props = { ...a.props };
    for (const [k, v] of Object.entries(b.props)) props[k] = props[k] ? mergeSchemas(props[k], v) : v;
    return { type: "object", props, ...a.truncated || b.truncated ? { truncated: true } : {} };
  }
  if (a.type === "array" && b.type === "array") {
    const items = a.items && b.items ? mergeSchemas(a.items, b.items) : a.items ?? b.items;
    return { type: "array", items, length: Math.max(a.length, b.length) };
  }
  if (a.type === b.type) {
    if (a.type === "string" && b.type === "string" && a.format !== b.format) return { type: "string" };
    return a;
  }
  const list = [...a.type === "union" ? a.anyOf : [a], ...b.type === "union" ? b.anyOf : [b]];
  const seen = /* @__PURE__ */ new Map();
  for (const s of list) {
    const prev = seen.get(s.type);
    seen.set(s.type, prev ? mergeSchemas(prev, s) : s);
  }
  const anyOf = [...seen.values()];
  return anyOf.length === 1 ? anyOf[0] : { type: "union", anyOf };
}
function schemaToText(s, indent = 0) {
  if (!s) return "unknown";
  const pad = "  ".repeat(indent);
  switch (s.type) {
    case "object": {
      const keys = Object.keys(s.props);
      if (!keys.length) return "{}";
      const body = keys.map((k) => `${pad}  ${/^[A-Za-z_$][\w$]*$/.test(k) ? k : JSON.stringify(k)}: ${schemaToText(s.props[k], indent + 1)}`).join("\n");
      return `{
${body}${s.truncated ? `
${pad}  \u2026` : ""}
${pad}}`;
    }
    case "array":
      return `${schemaToText(s.items, indent)}[]`;
    case "string":
      return s.format ? `string<${s.format}>` : "string";
    case "union":
      return s.anyOf.map((x) => schemaToText(x, indent)).join(" | ");
    default:
      return s.type;
  }
}
function tryParseJson(text) {
  const t = text.trim();
  if (!t || !/^[\[{"]|^-?\d|^(true|false|null)$/.test(t)) return void 0;
  try {
    return JSON.parse(t);
  } catch {
    return void 0;
  }
}

// src/core/wsproto.ts
var DISCRIMINATORS = ["type", "event", "op", "action", "method", "m", "e", "cmd", "command", "kind", "msg", "msgType", "channel", "topic", "target", "name", "t"];
var compact = (value) => schemaToText(inferSchema(value)).replace(/\s+/g, " ").slice(0, 500);
var label = (v) => redactText(String(v)).replace(/\d{5,}/g, "#").slice(0, 40);
var HEARTBEAT = /(^|=)(ping|pong|heartbeat|keep-?alive|hb|latido|h|2|3)$|latido/i;
function describeJson(value) {
  if (Array.isArray(value)) {
    const head = value[0];
    if (typeof head === "string" && head.length <= 40) return { key: `evento=${label(head)}`, shape: compact(value.slice(1)) };
    return { key: `arreglo(${value.length})`, shape: compact(value) };
  }
  if (value && typeof value === "object") {
    const obj = value;
    for (const k of DISCRIMINATORS) {
      const v = obj[k];
      if (typeof v === "string" && v.length <= 60 || typeof v === "number") return { key: `${k}=${label(v)}`, shape: compact(value) };
    }
    return { key: `claves=${Object.keys(obj).sort().slice(0, 6).join(",")}`, shape: compact(value) };
  }
  return { key: typeof value, shape: typeof value };
}
function classifyFrame(payload, url = "") {
  if (typeof payload !== "string") {
    return { protocol: "binario", messages: [{ key: "binario", shape: `binario (${payload.length} bytes)` }] };
  }
  const text = payload;
  if (text.startsWith("~m~")) {
    const messages = [];
    let pos = 0;
    while (pos < text.length && messages.length < 50) {
      const m = /^~m~(\d+)~m~/.exec(text.slice(pos, pos + 20));
      if (!m) break;
      const start = pos + m[0].length;
      const body = text.slice(start, start + Number(m[1]));
      pos = start + Number(m[1]);
      if (body.startsWith("~h~")) messages.push({ key: "latido", shape: "contador" });
      else {
        const json2 = tryParseJson(body);
        messages.push(json2 !== void 0 ? describeJson(json2) : { key: "texto", shape: `texto (${body.length})` });
      }
    }
    if (messages.length) return { protocol: "longitud-prefijada (~m~)", messages };
  }
  if (/socket\.io|engine\.io|[?&]EIO=/i.test(url)) {
    const m = /^(\d{1,2})([\s\S]*)$/.exec(text);
    if (m) {
      const [, code, rest] = m;
      if (!rest) return { protocol: "socket.io", messages: [{ key: code === "2" || code === "3" ? "latido" : `paquete=${code}`, shape: "sin contenido" }] };
      const json2 = tryParseJson(rest.replace(/^[^\[{]*/, ""));
      if (Array.isArray(json2) && typeof json2[0] === "string") return { protocol: "socket.io", messages: [{ key: `evento=${label(json2[0])}`, shape: compact(json2.slice(1)) }] };
      if (json2 !== void 0) return { protocol: "socket.io", messages: [{ key: `paquete=${code}`, shape: compact(json2) }] };
    }
  }
  if (text.includes("")) {
    const messages = text.split("").filter(Boolean).slice(0, 50).map((part) => {
      const json2 = tryParseJson(part);
      if (!json2 || typeof json2 !== "object") return { key: "texto", shape: `texto (${part.length})` };
      if (json2.type === 6) return { key: "latido", shape: "{ type: number }" };
      if (typeof json2.target === "string") return { key: `target=${label(json2.target)}`, shape: compact(json2) };
      return describeJson(json2);
    });
    return { protocol: "signalr", messages };
  }
  const stomp = /^(CONNECT|CONNECTED|STOMP|SEND|SUBSCRIBE|UNSUBSCRIBE|MESSAGE|RECEIPT|ERROR|ACK|NACK|DISCONNECT)\r?\n/.exec(text);
  if (stomp) {
    const dest = /^destination:(.+)$/m.exec(text)?.[1]?.trim();
    return { protocol: "stomp", messages: [{ key: `comando=${stomp[1]}${dest ? ` ${label(dest)}` : ""}`, shape: "cabeceras + cuerpo" }] };
  }
  const json = tryParseJson(text);
  if (json !== void 0 && json !== null && typeof json === "object") return { protocol: "json", messages: [describeJson(json)] };
  if (text.length <= 24 && /^[\w.:-]+$/.test(text)) {
    return { protocol: "texto", messages: [{ key: /^(ping|pong|h|hb|heartbeat)$/i.test(text) ? "latido" : `texto=${label(text)}`, shape: "literal" }] };
  }
  return { protocol: "texto", messages: [{ key: "texto", shape: `texto (${text.length} caracteres)` }] };
}

// src/core/recorder.ts
var MULTI_TLD = /^(co|com|org|net|gob|gov|edu|ac)\.[a-z]{2}$/;
function siteOf(hostname) {
  if (/^[\d.]+$/.test(hostname) || hostname.includes(":") || !hostname.includes(".")) return hostname;
  const parts = hostname.split(".");
  const lastTwo = parts.slice(-2).join(".");
  return MULTI_TLD.test(lastTwo) ? parts.slice(-3).join(".") : lastTwo;
}
function isThirdParty(url, pageHost) {
  try {
    return siteOf(new URL(url).hostname) !== siteOf(pageHost.replace(/:\d+$/, ""));
  } catch {
    return false;
  }
}
function framesOf(initiator) {
  const frames = [];
  let stack = initiator?.stack;
  while (stack && frames.length < 12) {
    for (const f of stack.callFrames ?? []) {
      if (f.url) frames.push({ fn: f.functionName || "(an\xF3nima)", url: f.url, line: f.lineNumber + 1, column: f.columnNumber + 1 });
    }
    stack = stack.parent;
  }
  if (!frames.length && initiator?.url) {
    frames.push({ fn: initiator.type === "parser" ? "(HTML)" : "(script)", url: initiator.url, line: (initiator.lineNumber ?? 0) + 1, column: (initiator.columnNumber ?? 0) + 1 });
  }
  return frames;
}
function describeBody(text, contentType) {
  const length = text.length;
  const parsed = /json|graphql/i.test(contentType) || /^[\[{]/.test(text.trim()) ? tryParseJson(text) : void 0;
  if (parsed !== void 0 && parsed !== null && typeof parsed === "object") {
    const first = Array.isArray(parsed) ? parsed[0] : parsed;
    if (first && typeof first.query === "string" && /^\s*(query|mutation|subscription|\{)/.test(first.query)) {
      const m = /^\s*(query|mutation|subscription)?\s*([A-Za-z_]\w*)?/.exec(first.query);
      const graphql = {
        type: m?.[1] ?? "query",
        name: first.operationName || m?.[2] || "(an\xF3nima)",
        variables: first.variables && typeof first.variables === "object" ? Object.keys(first.variables) : [],
        query: redactCode(first.query).slice(0, 1500)
      };
      return { kind: "graphql", graphql, schema: inferSchema(parsed), length };
    }
    return { kind: "json", schema: inferSchema(parsed), length };
  }
  if (/x-www-form-urlencoded/i.test(contentType)) {
    return { kind: "formulario", params: [...new URLSearchParams(text).keys()], length };
  }
  if (/multipart/i.test(contentType)) return { kind: "multipart", length };
  return { kind: "texto", length };
}
function authOf(headers) {
  const out = [];
  for (const [name, value] of Object.entries(headers)) {
    const lower = name.toLowerCase();
    if (lower === "cookie") out.push("cookie");
    else if (lower === "authorization") out.push(`authorization: ${(/^(\w+)\s/.exec(value)?.[1] ?? "esquema propio").toLowerCase()}`);
    else if (/csrf|xsrf/.test(lower)) out.push(`cabecera anti-CSRF ${lower}`);
    else if (/(^x-|-)(api-?key|auth|token|session|signature)/.test(lower)) out.push(`cabecera ${lower}`);
  }
  return out;
}
var NetworkRecorder = class _NetworkRecorder {
  constructor(page, pageHost, session) {
    this.page = page;
    this.pageHost = pageHost;
    this.session = session;
  }
  page;
  pageHost;
  session;
  entries = [];
  websockets = [];
  consoleErrors = 0;
  /** En modo privado se ocultan además los números largos de las URLs. */
  privateMode = false;
  pending = [];
  initiators = /* @__PURE__ */ new Map();
  counter = 0;
  flushed = 0;
  cdp;
  static async attach(page, context, pageHost, session) {
    const rec = new _NetworkRecorder(page, pageHost, session);
    rec.cdp = await context.newCDPSession(page);
    await rec.cdp.send("Network.enable");
    rec.cdp.on("Network.requestWillBeSent", (ev) => {
      const key = `${ev.request.method} ${ev.request.url}`;
      const list = rec.initiators.get(key) ?? [];
      list.push({ frames: framesOf(ev.initiator), t: Date.now() });
      rec.initiators.set(key, list);
    });
    page.on("response", (res) => rec.pending.push(rec.onResponse(res).catch(() => {
    })));
    page.on("requestfailed", (req) => rec.onFailed(req));
    page.on("console", (msg) => {
      if (msg.type() === "error") rec.consoleErrors++;
    });
    page.on("pageerror", () => rec.consoleErrors++);
    page.on("websocket", (ws) => {
      const record = { url: rec.url(ws.url()), opened: Date.now(), sent: 0, received: 0, protocol: "", groups: [], sentLog: [], samples: [] };
      rec.websockets.push(record);
      const onFrame = (dir, payload) => {
        const now = Date.now();
        if (dir === "enviado") record.sent++;
        else record.received++;
        const { protocol, messages } = classifyFrame(payload, ws.url());
        if (!record.protocol || record.protocol === "texto") record.protocol = protocol;
        for (const msg of messages) {
          let group = record.groups.find((g) => g.dir === dir && g.key === msg.key);
          if (!group) {
            if (record.groups.length >= 120) continue;
            group = { dir, key: msg.key, count: 0, bytes: 0, first: now, last: now, shape: msg.shape };
            record.groups.push(group);
            if (record.samples.length < 12) record.samples.push({ dir, shape: `${msg.key}: ${msg.shape}` });
          }
          group.count++;
          group.bytes += Math.round(payload.length / messages.length);
          group.last = now;
          if (dir === "enviado" && record.sentLog.length < 4e3) record.sentLog.push({ t: now, key: msg.key });
        }
      };
      ws.on("framesent", (f) => onFrame("enviado", f.payload));
      ws.on("framereceived", (f) => onFrame("recibido", f.payload));
      ws.on("close", () => record.closed = Date.now());
    });
    return rec;
  }
  get count() {
    return this.entries.length;
  }
  url(raw) {
    const red = redactUrl(raw);
    return this.privateMode ? privatizeUrl(red) : red;
  }
  /** Espera a que terminen las respuestas en curso. */
  async settle() {
    const pending = this.pending;
    this.pending = [];
    await Promise.allSettled(pending);
  }
  /** Añade al registro en disco las peticiones nuevas. La línea de cada una es su posición en `entries`. */
  flush() {
    const fresh = this.entries.slice(this.flushed);
    if (fresh.length) {
      const file = this.session.abs("network/requests.jsonl");
      fs2.mkdirSync(this.session.abs("network"), { recursive: true });
      fs2.appendFileSync(file, fresh.map((e) => JSON.stringify(e)).join("\n") + "\n");
      this.flushed = this.entries.length;
    } else if (!this.session.exists("network/requests.jsonl")) {
      this.session.write("network/requests.jsonl", "");
    }
    this.session.writeJson("network/websockets.json", this.websockets);
  }
  base(req, allHeaders) {
    const url = req.url();
    const query = {};
    try {
      for (const [k, v] of new URL(url).searchParams) query[k] = SENSITIVE_NAME.test(k) ? "enmascarado" : classifyValue(v);
    } catch {
    }
    const reqHeaders = allHeaders ?? req.headers();
    const post = req.postData();
    const sent = this.initiators.get(`${req.method()} ${url}`)?.shift();
    const stack = sent?.frames;
    let from = "";
    try {
      const p = new URL(this.page.url());
      from = this.privateMode ? privatizeUrl(p.pathname + p.hash) : p.pathname + p.hash.replace(/[?&=].*$/, "");
    } catch {
    }
    const entry = {
      n: ++this.counter,
      t: sent?.t ?? Date.now(),
      // momento en que salió la petición
      url: this.url(url),
      method: req.method(),
      resourceType: req.resourceType(),
      status: 0,
      mime: "",
      size: 0,
      thirdParty: isThirdParty(url, this.pageHost),
      from,
      auth: authOf(reqHeaders),
      reqHeaders: redactHeaders(reqHeaders),
      resHeaders: {},
      query
    };
    if (post) entry.reqBody = describeBody(post, reqHeaders["content-type"] ?? "");
    if (stack?.length) {
      const clean = stack.map((f) => ({ ...f, url: redactUrl(f.url) }));
      entry.initiator = { ...clean[0], stack: clean.slice(0, 8) };
    }
    return entry;
  }
  async onResponse(res) {
    const req = res.request();
    if (/^(data|blob|chrome-extension):/.test(req.url())) return;
    const entry = this.base(req, await req.allHeaders().catch(() => void 0));
    const headers = await res.allHeaders().catch(() => res.headers());
    entry.status = res.status();
    entry.mime = (headers["content-type"] ?? "").split(";")[0].trim();
    entry.resHeaders = redactHeaders(headers);
    entry.size = Number(headers["content-length"] ?? 0);
    const type = entry.resourceType;
    const isData = type === "xhr" || type === "fetch";
    let mainDoc = false;
    try {
      mainDoc = type === "document" && req.isNavigationRequest() && req.frame().parentFrame() === null;
    } catch {
    }
    const streaming = /event-stream/i.test(entry.mime);
    const wasm = /wasm/i.test(entry.mime);
    const wantBody = !streaming && entry.status < 300 && (mainDoc || wasm || type === "script" || /json/i.test(entry.mime) || isData && /text|javascript|xml/i.test(entry.mime));
    if (wantBody) {
      const body = await res.body().catch(() => void 0);
      if (body) {
        entry.size = body.length;
        if (mainDoc) {
          if (body.length < 8 * 1024 * 1024) this.session.write("page-source.html", redactHtml(body.toString("utf8")));
        } else if (type === "script" && body.length < 12 * 1024 * 1024) {
          const name = slug(new URL(req.url()).pathname.split("/").pop() || "script", 50).replace(/\.m?js$/, "");
          entry.bodyFile = this.session.write(`scripts/raw/${String(entry.n).padStart(3, "0")}-${name}.js`, redactCode(body.toString("utf8")));
        } else if (!wasm && type !== "script" && body.length < 6 * 1024 * 1024) {
          const json = tryParseJson(body.toString("utf8"));
          if (json !== void 0) entry.resSchema = inferSchema(json);
        }
      }
    }
    this.entries.push(entry);
  }
  onFailed(req) {
    if (/^(data|blob):/.test(req.url())) return;
    const entry = this.base(req);
    entry.failed = req.failure()?.errorText ?? "fall\xF3";
    this.entries.push(entry);
  }
};

// src/core/page-scripts.ts
function collectDom() {
  const cut = (s, n = 80) => (s ?? "").replace(/\s+/g, " ").trim().slice(0, n);
  const cssPath = (el) => {
    const parts = [];
    let node = el;
    while (node && parts.length < 5) {
      if (node.id && /^[A-Za-z][\w-]*$/.test(node.id)) {
        parts.unshift("#" + node.id);
        break;
      }
      const tag = node.tagName.toLowerCase();
      if (tag === "html" || tag === "body") {
        parts.unshift(tag);
        break;
      }
      const parent = node.parentElement;
      let part = tag;
      if (parent) {
        const cur = node;
        const same = Array.from(parent.children).filter((c) => c.tagName === cur.tagName);
        if (same.length > 1) part += `:nth-of-type(${same.indexOf(cur) + 1})`;
      }
      parts.unshift(part);
      node = parent;
    }
    return parts.join(" > ");
  };
  const open = (el) => {
    const shallow = el.cloneNode(false).outerHTML;
    const close = shallow.lastIndexOf("</");
    return (close > 0 ? shallow.slice(0, close) : shallow).slice(0, 160);
  };
  const q = (sel) => Array.from(document.querySelectorAll(sel));
  const sig = (c) => c.tagName.toLowerCase() + (c.classList.length ? "." + Array.from(c.classList).sort().join(".") : "");
  const sections = q('header, nav, main, section, article, aside, footer, [role="banner"], [role="navigation"], [role="main"], [role="search"], [role="contentinfo"], [role="dialog"]').slice(0, 60).map((el) => ({
    tag: el.tagName.toLowerCase(),
    role: el.getAttribute("role") ?? void 0,
    selector: cssPath(el),
    label: cut(el.getAttribute("aria-label") ?? el.querySelector("h1,h2,h3")?.textContent, 60),
    descendants: el.querySelectorAll("*").length,
    open: open(el)
  }));
  const headings = q("h1, h2, h3").slice(0, 60).map((el) => ({ level: Number(el.tagName[1]), text: cut(el.textContent, 70), open: open(el) }));
  const labelFor = (el) => {
    const id = el.getAttribute("id");
    const viaFor = id ? document.querySelector(`label[for="${CSS.escape(id)}"]`) : null;
    return cut(
      viaFor?.textContent ?? el.closest("label")?.textContent ?? el.getAttribute("aria-label") ?? el.getAttribute("placeholder") ?? el.getAttribute("title"),
      50
    );
  };
  const forms = q("form").slice(0, 30).map((form) => ({
    selector: cssPath(form),
    action: form.getAttribute("action") ?? "",
    method: (form.getAttribute("method") ?? "get").toLowerCase(),
    role: form.getAttribute("role") ?? void 0,
    fields: Array.from(form.querySelectorAll("input, select, textarea")).slice(0, 40).map((f) => ({
      tag: f.tagName.toLowerCase(),
      type: f.getAttribute("type") ?? (f.tagName === "INPUT" ? "text" : void 0),
      name: f.getAttribute("name") ?? void 0,
      id: f.getAttribute("id") ?? void 0,
      label: labelFor(f),
      required: f.hasAttribute("required"),
      selector: cssPath(f)
    })),
    submit: Array.from(form.querySelectorAll('button, input[type="submit"]')).slice(0, 5).map((b) => cut(b.textContent || b.getAttribute("value"), 40)),
    open: open(form)
  }));
  const buttons = q('button, [role="button"], input[type="button"], input[type="submit"]').slice(0, 60).map((b) => ({
    selector: cssPath(b),
    text: cut(b.textContent || b.getAttribute("value") || b.getAttribute("aria-label"), 40),
    type: b.getAttribute("type") ?? void 0,
    inForm: !!b.closest("form"),
    inlineHandler: b.hasAttribute("onclick"),
    open: open(b)
  }));
  const anchors = q("a[href]");
  const links = {
    total: anchors.length,
    internal: anchors.filter((a) => a.host === location.host).length,
    external: anchors.filter((a) => a.host && a.host !== location.host).length,
    hashOnly: anchors.filter((a) => (a.getAttribute("href") ?? "").startsWith("#")).length
  };
  const repeated = [];
  const seen = /* @__PURE__ */ new Set();
  for (const el of q("body *")) {
    const parent = el.parentElement;
    if (!parent || seen.has(parent)) continue;
    seen.add(parent);
    if (parent.children.length < 3) continue;
    const buckets = /* @__PURE__ */ new Map();
    for (const k of Array.from(parent.children)) {
      if (/^(SCRIPT|STYLE|LINK|META|OPTION|BR|SOURCE|PATH|G|TR|TD|TH|COL)$/.test(k.tagName)) continue;
      const s = sig(k);
      const list = buckets.get(s) ?? [];
      list.push(k);
      buckets.set(s, list);
    }
    for (const [s, els] of buckets) {
      if (els.length < 3 || els[0].querySelectorAll("*").length < 2) continue;
      repeated.push({
        container: cssPath(parent),
        item: s,
        count: els.length,
        structure: Array.from(els[0].querySelectorAll("*")).slice(0, 12).map(sig).join(", "),
        open: open(els[0])
      });
    }
  }
  repeated.sort((a, b) => b.count * b.structure.length - a.count * a.structure.length);
  const imgs = q("img");
  const ids = q("[id]").map((e) => e.id);
  const dupIds = [...new Set(ids.filter((id, i) => ids.indexOf(id) !== i))];
  const levels = q("h1,h2,h3,h4,h5,h6").map((h) => Number(h.tagName[1]));
  const accessibleName = (el) => cut(el.textContent) || el.getAttribute("aria-label") || el.getAttribute("aria-labelledby") || el.getAttribute("title") || el.getAttribute("value") || (el.querySelector('img[alt]:not([alt=""])') ? "img" : "");
  const a11y = {
    lang: document.documentElement.getAttribute("lang") ?? "",
    hasMain: !!document.querySelector('main, [role="main"]'),
    h1Count: document.querySelectorAll("h1").length,
    headingSkips: levels.filter((l, i) => i > 0 && l - levels[i - 1] > 1).length,
    imagesTotal: imgs.length,
    imagesWithoutAlt: imgs.filter((i) => !i.hasAttribute("alt")).slice(0, 10).map((i) => ({ selector: cssPath(i), open: open(i) })),
    imagesWithoutAltCount: imgs.filter((i) => !i.hasAttribute("alt")).length,
    inputsWithoutLabel: q('input:not([type="hidden"]):not([type="submit"]):not([type="button"]), select, textarea').filter((f) => !labelFor(f)).slice(0, 10).map((f) => ({ selector: cssPath(f), open: open(f) })),
    buttonsWithoutName: q('button, [role="button"], a[href]').filter((b) => !accessibleName(b)).slice(0, 10).map((b) => ({ selector: cssPath(b), open: open(b) })),
    duplicateIds: dupIds.slice(0, 10),
    positiveTabindex: q("[tabindex]").filter((e) => Number(e.getAttribute("tabindex")) > 0).length,
    ariaAttributes: q("[aria-label], [aria-labelledby], [aria-describedby], [aria-live], [role]").length
  };
  const scripts = q("script").map((s, i) => {
    const type = s.getAttribute("type") ?? "";
    const src = s.getAttribute("src");
    const isJs = !type || /javascript|module|ecmascript/i.test(type);
    return {
      index: i,
      src: src ? s.src : void 0,
      type: type || void 0,
      async: s.hasAttribute("async"),
      defer: s.hasAttribute("defer"),
      module: type === "module",
      id: s.id || void 0,
      length: src ? 0 : (s.textContent ?? "").length,
      text: !src && isJs ? (s.textContent ?? "").slice(0, 4e5) : void 0,
      open: open(s)
    };
  });
  const custom = [...new Set(q("*").map((e) => e.tagName.toLowerCase()).filter((t) => t.includes("-")))].slice(0, 30);
  let maxDepth = 0;
  const walk = (el, d) => {
    if (d > maxDepth) maxDepth = d;
    if (d < 60) for (const c of Array.from(el.children)) walk(c, d + 1);
  };
  if (document.body) walk(document.body, 1);
  const meta = (name) => cut(document.querySelector(`meta[name="${name}"], meta[property="${name}"]`)?.getAttribute("content"), 160);
  return {
    title: cut(document.title, 120),
    url: location.href,
    meta: { description: meta("description"), viewport: meta("viewport"), generator: meta("generator"), ogType: meta("og:type") },
    counts: {
      elements: document.querySelectorAll("*").length,
      maxDepth,
      iframes: q("iframe").length,
      shadowHosts: q("*").filter((e) => e.shadowRoot).length,
      stylesheets: q('link[rel="stylesheet"], style').length
    },
    iframes: q("iframe").slice(0, 15).map((f) => {
      try {
        return new URL(f.src).host;
      } catch {
        return "(sin src)";
      }
    }),
    customElements: custom,
    sections,
    headings,
    forms,
    buttons,
    links,
    repeated: repeated.slice(0, 12),
    a11y,
    scripts
  };
}
function collectProbes() {
  const w = window;
  const safe = (fn) => {
    try {
      return fn();
    } catch {
      return void 0;
    }
  };
  const ver = (v) => typeof v === "string" || typeof v === "number" ? String(v).slice(0, 30) : true;
  const has = (sel) => !!document.querySelector(sel);
  const found = {};
  const put = (name, value) => {
    if (value) found[name] = ver(value);
  };
  const sample = Array.from(document.querySelectorAll("body, body *")).slice(0, 800);
  const nodeKey = (re) => sample.some((el) => Object.keys(el).some((k) => re.test(k)));
  put("React", safe(() => w.React?.version) || nodeKey(/^__react(Fiber|Container|Props)\$|^_reactRootContainer$/) || has("[data-reactroot]"));
  put("Preact", safe(() => !!w.preact) || nodeKey(/^__k$|^__preact/));
  put("Next.js", safe(() => w.next?.version) || safe(() => !!w.__NEXT_DATA__) || safe(() => !!w.__next_f) || has("#__next"));
  put("Remix", safe(() => !!w.__remixContext));
  put("Gatsby", has("#___gatsby"));
  put("Vue", safe(() => w.Vue?.version) || sample.some((el) => el.__vue__ || el.__vue_app__ || el.__vueParentComponent) || sample.some((el) => el.getAttributeNames().some((a) => a.startsWith("data-v-"))));
  put("Nuxt", safe(() => !!w.__NUXT__) || safe(() => !!w.$nuxt) || has("#__nuxt"));
  put("Angular", document.querySelector("[ng-version]")?.getAttribute("ng-version") || safe(() => !!w.ng?.getComponent));
  put("AngularJS", safe(() => w.angular?.version?.full));
  put("Svelte", sample.some((el) => /(^|\s)svelte-[a-z0-9]{5,}/.test(el.getAttribute("class") ?? "")) || safe(() => Object.keys(w).some((k) => k.startsWith("__sveltekit"))));
  put("Astro", has("astro-island"));
  put("Alpine.js", safe(() => w.Alpine?.version) || has("[x-data]"));
  put("htmx", safe(() => w.htmx?.version) || has("[hx-get], [hx-post]"));
  put("Ember", safe(() => w.Ember?.VERSION));
  put("Backbone", safe(() => w.Backbone?.VERSION));
  put("jQuery", safe(() => w.jQuery?.fn?.jquery));
  put("Lodash", safe(() => w._?.VERSION && w._.chunk ? w._.VERSION : void 0));
  put("Moment.js", safe(() => w.moment?.version));
  put("Axios", safe(() => w.axios?.VERSION || !!w.axios));
  put("GSAP", safe(() => w.gsap?.version));
  put("Three.js", safe(() => w.THREE?.REVISION));
  put("D3", safe(() => w.d3?.version));
  put("Bootstrap", safe(() => w.bootstrap?.Tooltip?.VERSION || !!w.bootstrap));
  put("Shopify", safe(() => !!w.Shopify));
  put("WordPress", has('link[href*="wp-content"], script[src*="wp-content"], script[src*="wp-includes"]'));
  put("webpack", safe(() => Object.keys(w).some((k) => /^webpackChunk|^webpackJsonp/.test(k))));
  put("Vite", has('script[type="module"][src*="/@vite/"], script[type="module"][src*="/assets/index-"]'));
  put("Sentry", safe(() => !!w.Sentry || !!w.__SENTRY__));
  put("Google Tag Manager", safe(() => Array.isArray(w.dataLayer) && has('script[src*="googletagmanager.com"]')));
  put("Google Analytics", safe(() => !!w.gtag || !!w.ga || !!w.GoogleAnalyticsObject));
  put("Meta Pixel", safe(() => !!w.fbq));
  put("Matomo", safe(() => !!w._paq));
  put("Plausible", safe(() => !!w.plausible));
  put("Mixpanel", safe(() => !!w.mixpanel));
  put("Amplitude", safe(() => !!w.amplitude));
  put("Hotjar", safe(() => !!w.hj));
  put("Microsoft Clarity", safe(() => !!w.clarity));
  put("Segment", safe(() => !!w.analytics?.track));
  return {
    found,
    generator: document.querySelector('meta[name="generator"]')?.getAttribute("content")?.slice(0, 80) ?? "",
    serviceWorker: safe(() => !!navigator.serviceWorker?.controller) ?? false,
    manifest: has('link[rel="manifest"]')
  };
}
async function collectStorage() {
  const dump = (s) => {
    const out = [];
    for (let i = 0; i < Math.min(s.length, 200); i++) {
      const key = s.key(i) ?? "";
      out.push({ key, value: (s.getItem(key) ?? "").slice(0, 4e3) });
    }
    return out;
  };
  let local = [];
  let session = [];
  try {
    local = dump(localStorage);
    session = dump(sessionStorage);
  } catch {
  }
  const databases = [];
  try {
    const list = indexedDB.databases ? await indexedDB.databases() : [];
    for (const info of list.slice(0, 10)) {
      if (!info.name) continue;
      const db = await new Promise((resolve) => {
        const req = indexedDB.open(info.name);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
        req.onblocked = () => resolve(null);
      });
      if (!db) continue;
      const stores = [];
      for (const name of Array.from(db.objectStoreNames).slice(0, 30)) {
        const store = db.transaction(name, "readonly").objectStore(name);
        const count = await new Promise((resolve) => {
          const r = store.count();
          r.onsuccess = () => resolve(r.result);
          r.onerror = () => resolve(-1);
        });
        stores.push({
          name,
          keyPath: Array.isArray(store.keyPath) ? store.keyPath.join("+") : String(store.keyPath ?? ""),
          autoIncrement: store.autoIncrement,
          indexes: Array.from(store.indexNames),
          count
        });
      }
      databases.push({ name: info.name, version: db.version, stores });
      db.close();
    }
  } catch {
  }
  let cacheNames = [];
  try {
    cacheNames = (await caches.keys()).slice(0, 20);
  } catch {
  }
  return { local, session, databases, cacheNames };
}
function detectBarriers() {
  const out = [];
  const has = (sel) => !!document.querySelector(sel);
  if (has('iframe[src*="recaptcha"], iframe[src*="hcaptcha"], .g-recaptcha, .h-captcha, iframe[src*="challenges.cloudflare.com"], [class*="cf-turnstile"], [id*="captcha" i]')) out.push("CAPTCHA");
  if (/just a moment|checking your browser|attention required|verif(y|ying) you are human|access denied|are you a robot/i.test(document.title)) out.push("desaf\xEDo anti-bot");
  if (has('input[type="password"]')) out.push("formulario de inicio de sesi\xF3n");
  if (has('input[autocomplete^="cc-"], input[name*="cardnumber" i], input[name*="card-number" i], iframe[src*="js.stripe.com"], iframe[src*="paypal.com"]')) out.push("formulario de pago");
  return out;
}
function installMutationLog() {
  const w = window;
  if (w.__reaMut) return;
  const cut = (s, n = 80) => (s ?? "").replace(/\s+/g, " ").trim().slice(0, n);
  const cssPath = (el) => {
    const parts = [];
    let node = el;
    while (node && parts.length < 5) {
      if (node.id && /^[A-Za-z][\w-]*$/.test(node.id)) {
        parts.unshift("#" + node.id);
        break;
      }
      const tag = node.tagName.toLowerCase();
      if (tag === "html" || tag === "body") {
        parts.unshift(tag);
        break;
      }
      const parent = node.parentElement;
      let part = tag;
      if (parent) {
        const cur = node;
        const same = Array.from(parent.children).filter((c) => c.tagName === cur.tagName);
        if (same.length > 1) part += `:nth-of-type(${same.indexOf(cur) + 1})`;
      }
      parts.unshift(part);
      node = parent;
    }
    return parts.join(" > ") || "(documento)";
  };
  const describe = (n) => {
    if (n.nodeType !== 1) return `#texto(${(n.textContent ?? "").trim().length})`;
    const el = n;
    return el.tagName.toLowerCase() + (el.id ? "#" + el.id : "") + (el.classList.length ? "." + Array.from(el.classList).join(".") : "");
  };
  const log = { records: 0, added: [], removed: [], attrs: [], text: [] };
  w.__reaMut = log;
  const CAP = 300;
  new MutationObserver((records) => {
    for (const r of records) {
      log.records++;
      const target = r.target.nodeType === 1 ? r.target : r.target.parentElement;
      if (r.type === "childList") {
        r.addedNodes.forEach((n) => {
          if (log.added.length < CAP) log.added.push({ t: Date.now(), parent: cssPath(target), node: describe(n), descendants: n.nodeType === 1 ? n.querySelectorAll("*").length : 0 });
        });
        r.removedNodes.forEach((n) => {
          if (log.removed.length < CAP) log.removed.push({ t: Date.now(), parent: cssPath(target), node: describe(n) });
        });
      } else if (r.type === "attributes") {
        if (log.attrs.length < CAP) log.attrs.push({ t: Date.now(), target: cssPath(target), attr: r.attributeName, value: cut(target?.getAttribute(r.attributeName ?? ""), 60) });
      } else if (log.text.length < CAP) {
        log.text.push({ t: Date.now(), target: cssPath(target), length: (r.target.textContent ?? "").length });
      }
    }
  }).observe(document, { subtree: true, childList: true, attributes: true, characterData: true });
}
function readMutationLog(reset) {
  const log = window.__reaMut;
  if (!log) return null;
  const copy = JSON.parse(JSON.stringify(log));
  if (reset) {
    log.records = 0;
    log.added.length = 0;
    log.removed.length = 0;
    log.attrs.length = 0;
    log.text.length = 0;
  }
  return copy;
}

// src/core/app-scripts.ts
function installAppHooks() {
  const w = window;
  if (w.__reaApp || w.top !== w) return;
  const log = {
    routes: [],
    wasm: [],
    workers: [],
    canvas: [],
    eventSources: [],
    sse: {},
    apis: {},
    userEvents: []
  };
  Object.defineProperty(w, "__reaApp", { value: log, enumerable: false, configurable: true });
  const now = () => Date.now();
  const safe = (fn) => {
    try {
      fn();
    } catch {
    }
  };
  const cap = (arr, item, max = 2e3) => {
    if (arr.length < max) arr.push(item);
  };
  const bump = (bag, key) => {
    bag[key] = (bag[key] ?? 0) + 1;
  };
  const cut = (s, n = 40) => (s ?? "").replace(/\s+/g, " ").trim().slice(0, n);
  const cssPath = (el) => {
    const parts = [];
    let node = el;
    while (node && parts.length < 5) {
      if (node.id && /^[A-Za-z][\w-]*$/.test(node.id)) {
        parts.unshift("#" + node.id);
        break;
      }
      const tag = node.tagName.toLowerCase();
      if (tag === "html" || tag === "body") {
        parts.unshift(tag);
        break;
      }
      const parent = node.parentElement;
      let part = tag;
      if (parent) {
        const cur = node;
        const same = Array.from(parent.children).filter((c) => c.tagName === cur.tagName);
        if (same.length > 1) part += `:nth-of-type(${same.indexOf(cur) + 1})`;
      }
      parts.unshift(part);
      node = parent;
    }
    return parts.join(" > ") || "(documento)";
  };
  safe(() => {
    log.routes.push({ t: now(), kind: "carga", url: location.href });
    for (const k of ["pushState", "replaceState"]) {
      const orig = history[k];
      history[k] = function(...args) {
        const r = orig.apply(this, args);
        cap(log.routes, { t: now(), kind: k, url: location.href }, 500);
        return r;
      };
    }
    addEventListener("popstate", () => cap(log.routes, { t: now(), kind: "popstate", url: location.href }, 500));
    addEventListener("hashchange", () => cap(log.routes, { t: now(), kind: "hashchange", url: location.href }, 500));
  });
  safe(() => {
    const W = w.WebAssembly;
    if (!W) return;
    const describe2 = (module, via, bytes) => safe(
      () => cap(
        log.wasm,
        {
          t: now(),
          via,
          bytes,
          exports: W.Module.exports(module).slice(0, 300).map((e) => `${e.kind} ${e.name}`),
          imports: W.Module.imports(module).slice(0, 300).map((i) => `${i.kind} ${i.module}.${i.name}`)
        },
        50
      )
    );
    const size2 = (src) => src && typeof src.byteLength === "number" ? src.byteLength : 0;
    const wrap = (name, pick) => {
      const orig = W[name];
      if (typeof orig !== "function") return;
      W[name] = function(src, ...rest) {
        const p = orig.call(this, src, ...rest);
        safe(
          () => p.then(
            (res) => describe2(pick(res, src), name, size2(src)),
            () => {
            }
          )
        );
        return p;
      };
    };
    wrap("instantiate", (res, src) => res?.module ?? src);
    wrap("instantiateStreaming", (res) => res.module);
    wrap("compile", (res) => res);
    wrap("compileStreaming", (res) => res);
  });
  const spy = (name, onNew) => safe(() => {
    const Orig = w[name];
    if (typeof Orig !== "function") return;
    const proxy = new Proxy(Orig, {
      construct(target, args, newTarget) {
        const instance = Reflect.construct(target, args, newTarget === proxy ? target : newTarget);
        safe(() => {
          bump(log.apis, name);
          onNew?.(args, instance);
        });
        return instance;
      }
    });
    w[name] = proxy;
  });
  spy("Worker", (args) => cap(log.workers, { t: now(), kind: "Worker", url: String(args[0]).slice(0, 300) }, 100));
  spy("SharedWorker", (args) => cap(log.workers, { t: now(), kind: "SharedWorker", url: String(args[0]).slice(0, 300) }, 100));
  spy("RTCPeerConnection");
  spy("AudioContext");
  spy("BroadcastChannel");
  spy("WebTransport");
  spy("EventSource", (args, es) => {
    cap(log.eventSources, { t: now(), url: String(args[0]).slice(0, 300) }, 50);
    const seen = /* @__PURE__ */ new Set(["open", "error"]);
    const listen = EventSource.prototype.addEventListener;
    const watch = (type) => {
      if (seen.has(type)) return;
      seen.add(type);
      listen.call(es, type, () => bump(log.sse, type));
    };
    watch("message");
    es.addEventListener = function(type, ...rest) {
      safe(() => watch(type));
      return listen.call(this, type, ...rest);
    };
  });
  safe(() => {
    const sw = navigator.serviceWorker;
    if (!sw) return;
    const orig = sw.register;
    sw.register = function(...args) {
      safe(() => {
        bump(log.apis, "serviceWorker.register");
        cap(log.workers, { t: now(), kind: "ServiceWorker", url: String(args[0]).slice(0, 300) }, 100);
      });
      return orig.apply(this, args);
    };
  });
  const patchCanvas = (proto, prefix) => safe(() => {
    const orig = proto.getContext;
    proto.getContext = function(type, ...rest) {
      const ctx = orig.call(this, type, ...rest);
      safe(() => {
        if (!ctx || this.__reaSeen) return;
        Object.defineProperty(this, "__reaSeen", { value: true, enumerable: false });
        cap(log.canvas, { t: now(), context: prefix + String(type), width: this.width, height: this.height, selector: this.isConnected ? cssPath(this) : "(fuera del DOM)" }, 200);
      });
      return ctx;
    };
  });
  patchCanvas(HTMLCanvasElement.prototype, "");
  if (w.OffscreenCanvas) patchCanvas(w.OffscreenCanvas.prototype, "offscreen:");
  const describe = (el) => {
    const tag = el.tagName.toLowerCase();
    const parts = [tag];
    const type = el.getAttribute("type");
    const role = el.getAttribute("role");
    if (type) parts.push(`type=${type}`);
    if (role) parts.push(`role=${role}`);
    const actionable = el.closest('button, a, [role="button"], [role="tab"], [role="menuitem"], [role="link"], summary, label');
    if (actionable && !/^(input|textarea|select)$/.test(tag)) {
      const text = cut(actionable.getAttribute("aria-label") || actionable.textContent).replace(/\d{3,}/g, "#");
      if (text) parts.push(`\xAB${text}\xBB`);
    }
    return parts.join(" ");
  };
  const SPECIAL = /^(Enter|Escape|Tab|Arrow(Up|Down|Left|Right)|PageUp|PageDown|Home|End|F\d{1,2})$/;
  safe(() => {
    const opts = { capture: true, passive: true };
    document.addEventListener(
      "click",
      (e) => {
        const el = e.target;
        if (!el || el.nodeType !== 1) return;
        const onCanvas = el.tagName === "CANVAS" && el.clientWidth > 0;
        cap(log.userEvents, {
          t: now(),
          kind: "click",
          selector: cssPath(el),
          target: describe(el),
          detail: onCanvas ? `lienzo en ${Math.round(e.offsetX / el.clientWidth * 100)}%, ${Math.round(e.offsetY / el.clientHeight * 100)}%` : void 0
        });
      },
      opts
    );
    document.addEventListener(
      "input",
      (e) => {
        const el = e.target;
        if (!el || el.nodeType !== 1) return;
        const selector = cssPath(el);
        const length = typeof el.value === "string" ? el.value.length : (el.textContent ?? "").length;
        const last2 = log.userEvents[log.userEvents.length - 1];
        if (last2 && last2.kind === "escribir" && last2.selector === selector && now() - (last2.end ?? last2.t) < 3e3) {
          last2.detail = `${length} caracteres`;
          last2.end = now();
        } else cap(log.userEvents, { t: now(), end: now(), kind: "escribir", selector, target: describe(el), detail: `${length} caracteres` });
      },
      opts
    );
    document.addEventListener(
      "change",
      (e) => {
        const el = e.target;
        if (!el || el.nodeType !== 1 || !/^(select|input)$/i.test(el.tagName)) return;
        const type = (el.getAttribute("type") ?? el.tagName).toLowerCase();
        if (!/^(select|checkbox|radio|file|range|date|color)$/.test(type)) return;
        cap(log.userEvents, { t: now(), kind: "cambio", selector: cssPath(el), target: describe(el), detail: type });
      },
      opts
    );
    document.addEventListener("submit", (e) => cap(log.userEvents, { t: now(), kind: "envio", selector: cssPath(e.target), target: "form" }), opts);
    document.addEventListener(
      "keydown",
      (e) => {
        const shortcut = (e.ctrlKey || e.metaKey) && e.key.length === 1;
        if (!SPECIAL.test(e.key) && !shortcut) return;
        const el = e.target;
        const isEl = !!el && el.nodeType === 1;
        cap(log.userEvents, { t: now(), kind: "tecla", selector: isEl ? cssPath(el) : "(documento)", target: isEl ? describe(el) : "documento", detail: shortcut ? `Ctrl+${e.key.toUpperCase()}` : e.key });
      },
      opts
    );
  });
}
function drainAppHooks() {
  const log = window.__reaApp;
  if (!log) return null;
  const copy = JSON.parse(JSON.stringify(log));
  for (const k of ["routes", "wasm", "workers", "canvas", "eventSources", "userEvents"]) log[k].length = 0;
  log.sse = {};
  log.apis = {};
  return copy;
}
function collectState() {
  const w = window;
  const shape = (v, depth) => {
    if (v === null) return "null";
    const t = typeof v;
    if (t !== "object") return t === "function" ? "funci\xF3n" : t;
    if (depth <= 0) return Array.isArray(v) ? "arreglo" : "objeto";
    if (Array.isArray(v)) return v.length ? [shape(v[0], depth - 1), `\xD7${v.length}`] : [];
    if (v instanceof Map || v instanceof Set) return `${v instanceof Map ? "Map" : "Set"}(${v.size})`;
    if (v instanceof Element) return "elemento DOM";
    const out = {};
    const keys = Object.keys(v);
    for (const k of keys.slice(0, 30)) {
      try {
        out[k] = shape(v[k], depth - 1);
      } catch {
        out[k] = "inaccesible";
      }
    }
    if (keys.length > 30) out["\u2026"] = `${keys.length - 30} claves m\xE1s`;
    return out;
  };
  const safe = (fn) => {
    try {
      return fn();
    } catch {
      return void 0;
    }
  };
  const stores = [];
  const isRedux = (s) => s && typeof s.getState === "function" && typeof s.dispatch === "function" && typeof s.subscribe === "function";
  const known = /* @__PURE__ */ new Set();
  for (const name of ["store", "__store__", "__STORE__", "__REDUX_STORE__", "reduxStore", "appStore"]) {
    const s = safe(() => w[name]);
    if (isRedux(s) && !known.has(s)) {
      known.add(s);
      stores.push({ kind: "Redux", via: `window.${name}`, shape: shape(safe(() => s.getState()), 3) });
    }
  }
  safe(() => {
    const nodes = Array.from(document.querySelectorAll("body, body *")).slice(0, 400);
    let fiber = null;
    for (const el of nodes) {
      const key = Object.keys(el).find((k) => k.startsWith("__reactContainer$") || k.startsWith("__reactFiber$"));
      if (key) {
        fiber = el[key];
        break;
      }
      const legacy = el._reactRootContainer;
      if (legacy) {
        fiber = legacy._internalRoot?.current ?? legacy.current;
        break;
      }
    }
    if (!fiber) return;
    while (fiber.return) fiber = fiber.return;
    const queue = [fiber];
    let visited = 0;
    while (queue.length && visited < 6e3) {
      const f = queue.shift();
      visited++;
      const props = f.memoizedProps;
      if (props && typeof props === "object") {
        const store = props.store;
        if (isRedux(store) && !known.has(store)) {
          known.add(store);
          stores.push({ kind: "Redux (react-redux)", via: "Provider del \xE1rbol de React", shape: shape(safe(() => store.getState()), 3) });
        }
        const client = props.client;
        if (client && !known.has(client)) {
          if (typeof client.getQueryCache === "function") {
            known.add(client);
            const queries = safe(() => client.getQueryCache().getAll()) ?? [];
            const keys = [...new Set(queries.map((q) => String(Array.isArray(q.queryKey) ? q.queryKey[0] : q.queryKey)))].slice(0, 25);
            stores.push({ kind: "TanStack Query", via: "QueryClientProvider", shape: { consultas: queries.length }, note: `Claves de consulta: ${keys.join(", ")}` });
          } else if (client.cache && typeof client.cache.extract === "function") {
            known.add(client);
            const cache = safe(() => client.cache.extract()) ?? {};
            const types = {};
            for (const k of Object.keys(cache)) {
              const type = String(cache[k]?.__typename ?? k.split(":")[0]);
              types[type] = (types[type] ?? 0) + 1;
            }
            stores.push({ kind: "Apollo Client", via: "ApolloProvider", shape: types, note: "Entidades en cach\xE9 por tipo" });
          }
        }
      }
      if (f.child) queue.push(f.child);
      if (f.sibling) queue.push(f.sibling);
    }
  });
  safe(() => {
    for (const el of Array.from(document.querySelectorAll("body *")).slice(0, 400)) {
      const app = el.__vue_app__;
      if (!app) continue;
      const gp = app.config?.globalProperties ?? {};
      if (gp.$pinia?.state?.value) stores.push({ kind: "Pinia", via: "app.config.globalProperties.$pinia", shape: shape(gp.$pinia.state.value, 3) });
      if (gp.$store?.state) stores.push({ kind: "Vuex", via: "app.config.globalProperties.$store", shape: shape(gp.$store.state, 3) });
      break;
    }
  });
  safe(() => {
    const root = Array.from(document.querySelectorAll("body *")).slice(0, 400).find((el) => el.__vue__);
    const store = root && root.__vue__.$store;
    if (store?.state) stores.push({ kind: "Vuex", via: "instancia ra\xEDz de Vue", shape: shape(store.state, 3) });
  });
  const globals = [];
  safe(() => {
    const frame = document.createElement("iframe");
    frame.style.display = "none";
    document.documentElement.appendChild(frame);
    const baseline = new Set(Object.getOwnPropertyNames(frame.contentWindow));
    frame.remove();
    for (const name of Object.getOwnPropertyNames(w)) {
      if (baseline.has(name) || /^(__rea|\d+$|webpackChunk|__playwright|__pw)/.test(name) || globals.length >= 80) continue;
      const v = safe(() => w[name]);
      if (v === void 0 || v === null) continue;
      const t = typeof v;
      if (t === "function") globals.push({ name, type: "funci\xF3n", shape: "funci\xF3n" });
      else if (t === "object") globals.push({ name, type: Array.isArray(v) ? "arreglo" : "objeto", shape: known.has(v) ? "almac\xE9n (ver arriba)" : shape(v, 2) });
      else globals.push({ name, type: t, shape: t });
    }
  });
  const hints = [];
  if (safe(() => w.__mobxGlobals || w.__mobxInstanceCount)) hints.push("MobX");
  if (safe(() => w.__APOLLO_CLIENT__)) hints.push("Apollo Client (window.__APOLLO_CLIENT__)");
  if (safe(() => w.ng?.getComponent)) hints.push("Angular (el estado vive en servicios y no se inspecciona)");
  return { stores, globals, hints };
}
function serializeMasked() {
  const clone = document.documentElement.cloneNode(true);
  const walker = document.createTreeWalker(clone, NodeFilter.SHOW_TEXT);
  const texts = [];
  while (walker.nextNode()) texts.push(walker.currentNode);
  for (const t of texts) {
    const parent = t.parentElement?.tagName;
    if (parent === "SCRIPT" || parent === "STYLE") continue;
    t.data = t.data.replace(/[^\s]/g, "\xB7");
  }
  for (const el of Array.from(clone.querySelectorAll("[value]"))) el.setAttribute("value", "\xB7");
  for (const el of Array.from(clone.querySelectorAll("[title], [alt], [aria-label], [data-value]"))) {
    for (const a of ["title", "alt", "aria-label", "data-value"]) if (el.hasAttribute(a)) el.setAttribute(a, (el.getAttribute(a) ?? "").replace(/\d/g, "#"));
  }
  return "<!DOCTYPE html>" + clone.outerHTML;
}

// src/core/live.ts
var LOGIN = "formulario de inicio de sesi\xF3n";
var emptyRuntime = () => ({ routes: [], wasm: [], workers: [], canvas: [], eventSources: [], sse: {}, apis: {}, userEvents: [] });
function describeEntry(key, value) {
  return { clave: key, tipo: classifyValue(value), longitud: value.length, sensible: SENSITIVE_NAME.test(key) || classifyValue(value) === "jwt" };
}
function maskTexts(node) {
  if (Array.isArray(node)) return node.map(maskTexts);
  if (node && typeof node === "object") {
    for (const k of Object.keys(node)) {
      const v = node[k];
      if (typeof v === "string" && /^(text|label|title|description|open)$/.test(k)) node[k] = maskDigits(v);
      else if (k === "submit" && Array.isArray(v)) node[k] = v.map((s) => maskDigits(String(s)));
      else if (v && typeof v === "object") maskTexts(v);
    }
  }
  return node;
}
var LiveApp = class _LiveApp {
  constructor(session, target, opts) {
    this.session = session;
    this.target = target;
    this.opts = opts;
  }
  session;
  target;
  opts;
  static current = null;
  runtime = emptyRuntime();
  views = [];
  scripts = /* @__PURE__ */ new Map();
  /** Registro de mutaciones del DOM y cubos de cobertura; solo se llenan mientras se graba. */
  mutations = [];
  buckets = [];
  collecting = false;
  closed = false;
  meta;
  rec;
  cdp;
  page;
  context;
  browser;
  sawLogin = false;
  sticky = false;
  timer = null;
  fast = null;
  busy = Promise.resolve();
  lastBucket = Date.now();
  sources = /* @__PURE__ */ new Map();
  /** app_open: abre la aplicación y deja el navegador vivo. */
  static async open(rawUrl, opts = {}) {
    const target = assertAllowedUrl(rawUrl);
    if (_LiveApp.current && !_LiveApp.current.closed) await _LiveApp.current.close();
    const respect = opts.respectRobots ?? true;
    if (opts.minIntervalMs != null) limiter.minIntervalMs = Math.max(0, opts.minIntervalMs);
    const robots = { respected: respect, allowed: true };
    if (respect) {
      const r = await checkRobots(target);
      robots.allowed = r.allowed;
      robots.rule = r.rule;
      if (!r.allowed) {
        throw new PolicyError(`robots.txt no permite analizar ${target.pathname} (${r.rule}). Si la aplicaci\xF3n es tuya o tienes autorizaci\xF3n, repite con respetar_robots=false.`);
      }
    }
    const session = Session.create(target.host, opts.outRoot);
    const app = new _LiveApp(session, target, opts);
    const visible = opts.visible ?? false;
    const { browser, label: label2 } = await launchBrowser(!visible);
    app.browser = browser;
    try {
      app.context = await newContext(browser, session.abs("captura.har"));
      await app.context.addInitScript(installMutationLog);
      await app.context.addInitScript(installAppHooks);
      app.page = await app.context.newPage();
      app.rec = await NetworkRecorder.attach(app.page, app.context, target.host, session);
      app.cdp = app.rec.cdp;
      app.cdp.on("Debugger.scriptParsed", (ev) => app.scripts.set(ev.scriptId, { url: ev.url, startLine: ev.startLine ?? 0, startColumn: ev.startColumn ?? 0 }));
      await app.cdp.send("Debugger.enable");
      await app.cdp.send("Debugger.setSkipAllPauses", { skip: true });
      await app.cdp.send("Profiler.enable");
      await app.cdp.send("Profiler.startPreciseCoverage", { callCount: true, detailed: false });
      await limiter.wait(target.host);
      let status = 0;
      const f = new Findings("sesion", "SES");
      try {
        const res = await app.page.goto(target.href, { waitUntil: "load", timeout: opts.timeoutMs ?? 45e3 });
        status = res?.status() ?? 0;
      } catch (e) {
        const reason = String(e.message).split("\n")[0];
        if (!app.rec.count) throw new Error(`No se pudo abrir ${target.href}: ${reason}`);
        f.unknown(`La navegaci\xF3n no termin\xF3 de cargar (${reason}); el an\xE1lisis usa lo que alcanz\xF3 a llegar.`);
      }
      await app.page.waitForLoadState("networkidle", { timeout: 8e3 }).catch(() => {
        f.unknown("La red no queda en reposo: la aplicaci\xF3n mantiene conexiones abiertas o peticiones peri\xF3dicas (habitual en aplicaciones en tiempo real).");
      });
      app.meta = {
        version: VERSION,
        url: redactUrl(target.href),
        finalUrl: redactUrl(app.page.url()),
        host: target.host,
        title: "",
        capturedAt: (/* @__PURE__ */ new Date()).toISOString(),
        status,
        browser: label2,
        visible,
        robots,
        barriers: [],
        authenticated: false,
        private: opts.privacy === "privado",
        consoleErrors: 0,
        requestCount: 0
      };
      app.page.on("close", () => void app.finalize());
      app.timer = setInterval(() => void app.pump(), 1500);
      _LiveApp.current = app;
      const view = await app.snapshot("inicio");
      f.add(`La aplicaci\xF3n respondi\xF3 con estado ${status || "desconocido"} y t\xEDtulo \xAB${app.meta.title || "sin t\xEDtulo"}\xBB`, {
        detail: `${app.meta.finalUrl !== app.meta.url ? `Redirigi\xF3 a ${app.meta.finalUrl}. ` : ""}El navegador queda abierto${visible ? " y visible" : " (sin ventana)"} para seguir analizando.`,
        evidence: [{ file: "capture.json" }, { file: `${view.dir}/page.html`, line: 1 }, ...view.screenshot ? [{ file: view.screenshot }] : []]
      });
      f.add(`${app.rec.count} peticiones durante la carga inicial`, { evidence: [{ file: "network/requests.jsonl" }] });
      for (const b of app.meta.barriers) {
        const login = b === LOGIN;
        f.add(`Barrera detectada: ${b}`, {
          detail: login ? visible ? "REA APP no introduce credenciales. El usuario puede iniciar sesi\xF3n por su cuenta en la ventana abierta; despu\xE9s, app_status confirmar\xE1 que la sesi\xF3n est\xE1 iniciada y el an\xE1lisis continuar\xE1 en modo privado." : "REA APP no introduce credenciales. Para analizar la zona privada, vuelve a abrir con visible=true e inicia sesi\xF3n a mano." : "REA APP la reporta y no intenta superarla.",
          confidence: "media",
          evidence: [{ file: `${view.dir}/page.html` }]
        });
        if (!login) f.unknown(`Lo que hay detr\xE1s de \xAB${b}\xBB no se analiz\xF3: la herramienta no evade CAPTCHAs, pagos ni protecciones anti-bot.`);
      }
      f.unknown("Solo se conoce lo que se ha cargado hasta ahora: cada vista y cada flujo hay que visitarlos (app_snapshot, app_record, app_act) para que entren en el an\xE1lisis.");
      return session.saveResult({ tool: "app_open", session: session.dir, findings: f.list, unknowns: f.unknowns, files: ["capture.json", `${view.dir}/page.html`, "network/requests.jsonl"], data: app.meta });
    } catch (e) {
      await browser.close().catch(() => {
      });
      _LiveApp.current = null;
      throw e;
    }
  }
  /** Sesión viva actual; falla con un mensaje claro si no hay ninguna. */
  static require() {
    const app = _LiveApp.current;
    if (!app || app.closed) throw new Error("No hay una aplicaci\xF3n abierta. Usa app_open(url) primero (o vuelve a abrirla si la ventana se cerr\xF3).");
    return app;
  }
  get isPrivate() {
    return this.meta.private;
  }
  url(raw) {
    const red = redactUrl(raw);
    return this.isPrivate ? privatizeUrl(red) : red;
  }
  /** Ejecuta tareas sobre la página de una en una (el bombeo periódico y las herramientas no se pisan). */
  exclusive(fn) {
    const run = this.busy.then(fn, fn);
    this.busy = run.then(
      () => {
      },
      () => {
      }
    );
    return run;
  }
  /** Vuelve a evaluar barreras, sesión iniciada y modo privado. */
  async refreshState() {
    const barriers = await this.page.evaluate(detectBarriers).catch(() => []);
    const login = barriers.includes(LOGIN);
    if (login) this.sawLogin = true;
    this.meta.barriers = barriers;
    this.meta.authenticated = this.sawLogin && !login;
    const mode = this.opts.privacy ?? "auto";
    if (mode === "privado" || mode === "auto" && this.meta.authenticated) this.sticky = true;
    this.meta.private = mode !== "abierto" && this.sticky;
    this.rec.privateMode = this.meta.private;
    this.meta.finalUrl = this.url(this.page.url());
    this.meta.title = await this.page.title().then((t) => (this.meta.private ? maskDigits(t) : t).slice(0, 120)).catch(() => this.meta.title);
  }
  /** Recoge lo que la instrumentación de la página ha acumulado y, si se está grabando, un cubo de cobertura. */
  pump() {
    if (this.closed) return Promise.resolve();
    return this.exclusive(async () => {
      if (!this.meta.private) await this.refreshState().catch(() => {
      });
      const drained = await this.page.evaluate(drainAppHooks).catch(() => null);
      if (drained) {
        const r = this.runtime;
        for (const e of drained.routes) r.routes.push({ ...e, url: this.url(e.url) });
        r.wasm.push(...drained.wasm);
        const absolute = (u) => {
          try {
            return new URL(u, this.page.url()).href;
          } catch {
            return u;
          }
        };
        for (const wk of drained.workers) r.workers.push({ ...wk, url: wk.url.startsWith("blob:") ? "blob: (generado en el cliente)" : redactUrl(absolute(wk.url)) });
        r.canvas.push(...drained.canvas);
        for (const es of drained.eventSources) r.eventSources.push({ ...es, url: this.url(absolute(es.url)) });
        for (const [k, v] of Object.entries(drained.sse)) r.sse[k] = (r.sse[k] ?? 0) + v;
        for (const [k, v] of Object.entries(drained.apis)) r.apis[k] = (r.apis[k] ?? 0) + v;
        r.userEvents.push(...drained.userEvents);
        if (r.userEvents.length > 6e3) r.userEvents.splice(0, r.userEvents.length - 6e3);
      }
      if (this.collecting) {
        const log = await this.page.evaluate(readMutationLog, true).catch(() => null);
        if (log && this.mutations.length < 8e3) {
          for (const kind of ["added", "removed", "attrs", "text"]) for (const m of log[kind]) this.mutations.push({ ...m, kind });
        }
        await this.takeBucket();
      }
    });
  }
  /** Lee la cobertura acumulada desde la última lectura y pone los contadores a cero. */
  async takeBucket(keep = true) {
    const t0 = this.lastBucket;
    const t1 = Date.now();
    this.lastBucket = t1;
    const bucket = { t0, t1, fns: [] };
    const coverage = await this.cdp.send("Profiler.takePreciseCoverage").catch(() => ({ result: [] }));
    for (const script of coverage.result) {
      const meta = this.scripts.get(script.scriptId);
      if (!meta || !/^https?:/.test(meta.url)) continue;
      for (const fn of script.functions) {
        const range = fn.ranges[0];
        if (!range || !range.count) continue;
        if (!fn.functionName && range.startOffset === 0) continue;
        bucket.fns.push({ key: `${script.scriptId}:${range.startOffset}`, scriptId: script.scriptId, name: fn.functionName || "(an\xF3nima)", count: range.count, startOffset: range.startOffset, endOffset: range.endOffset });
      }
    }
    if (keep && this.buckets.length < 4e3) this.buckets.push(bucket);
    return bucket;
  }
  /** Empieza a acumular cobertura y mutaciones. Devuelve las funciones que se ejecutan en reposo (ruido de fondo). */
  async beginCollect() {
    await this.pump();
    return this.exclusive(async () => {
      await this.page.evaluate(readMutationLog, true).catch(() => null);
      await this.takeBucket(false);
      await this.page.waitForTimeout(1e3);
      const idle = await this.takeBucket(false);
      this.mutations = [];
      this.buckets = [];
      this.collecting = true;
      this.fast = setInterval(() => void this.pump(), 250);
      return new Set(idle.fns.map((f) => f.key));
    });
  }
  async endCollect() {
    if (this.fast) clearInterval(this.fast);
    this.fast = null;
    await this.pump();
    this.collecting = false;
  }
  /** Texto y tabla de líneas de un script, para convertir desplazamientos en línea y columna. */
  async sourceOf(scriptId) {
    let s = this.sources.get(scriptId);
    if (!s) {
      const text = (await this.cdp.send("Debugger.getScriptSource", { scriptId }).catch(() => ({ scriptSource: "" }))).scriptSource;
      const lines = [0];
      for (let i = 0; i < text.length; i++) if (text.charCodeAt(i) === 10) lines.push(i + 1);
      s = { text, lines };
      if (this.sources.size < 60) this.sources.set(scriptId, s);
    }
    return s;
  }
  /** Posición (línea y columna desde 1) y fragmento de una función ejecutada. */
  async describe(fn) {
    const meta = this.scripts.get(fn.scriptId);
    const { text, lines } = await this.sourceOf(fn.scriptId);
    let lo = 0;
    let hi = lines.length - 1;
    while (lo < hi) {
      const mid = lo + hi + 1 >> 1;
      if (lines[mid] <= fn.startOffset) lo = mid;
      else hi = mid - 1;
    }
    const column = fn.startOffset - lines[lo];
    return {
      frame: { fn: fn.name, url: redactUrl(meta.url), line: meta.startLine + lo + 1, column: (lo === 0 ? meta.startColumn : 0) + column + 1 },
      snippet: redactCode(text.slice(fn.startOffset, Math.min(fn.endOffset, fn.startOffset + 220))).replace(/\s+/g, " ")
    };
  }
  /** app_snapshot: registra la vista actual (DOM, estado, almacenamiento y, si procede, captura). */
  async snapshot(name) {
    await this.pump();
    return this.exclusive(async () => {
      await this.refreshState();
      const page = this.page;
      const n = this.views.length + 1;
      const current = new URL(page.url());
      const route = this.isPrivate ? privatizeUrl(current.pathname + current.hash) : current.pathname + current.hash;
      const label2 = slug(name || route.replace(/^\//, "") || "inicio", 40);
      const dir = `views/${String(n).padStart(2, "0")}-${label2}`;
      const s = this.session;
      const html = redactHtml(this.isPrivate ? await page.evaluate(serializeMasked) : await page.content());
      s.write("page.html", html);
      s.write(`${dir}/page.html`, html);
      const dom = await page.evaluate(collectDom);
      for (const sc of dom.scripts) {
        if (sc.text) {
          const file = `scripts/raw/inline-${String(sc.index).padStart(2, "0")}.js`;
          s.write(file, redactCode(sc.text));
          sc.file = file;
          delete sc.text;
        }
      }
      if (this.isPrivate) maskTexts(dom);
      dom.url = this.url(dom.url);
      s.writeJson("dom/snapshot.json", dom);
      s.writeJson(`${dir}/dom.json`, dom);
      s.writeJson("stack/probes.json", await page.evaluate(collectProbes));
      s.writeJson("state/snapshot.json", await page.evaluate(collectState).catch(() => ({ stores: [], globals: [], hints: [] })));
      const store = await page.evaluate(collectStorage);
      const cookies = await this.context.cookies();
      s.writeJson("storage/snapshot.json", {
        cookies: cookies.map((c) => ({
          nombre: c.name,
          dominio: c.domain,
          ruta: c.path,
          httpOnly: c.httpOnly,
          secure: c.secure,
          sameSite: c.sameSite,
          persistente: c.expires > 0,
          caducaEnDias: c.expires > 0 ? Math.round((c.expires - Date.now() / 1e3) / 86400) : null,
          tipo: classifyValue(c.value),
          longitud: c.value.length,
          sensible: SENSITIVE_NAME.test(c.name) || c.httpOnly,
          valor: "[ENMASCARADO]"
        })),
        localStorage: store.local.map((e) => describeEntry(e.key, e.value)),
        sessionStorage: store.session.map((e) => describeEntry(e.key, e.value)),
        indexedDB: store.databases,
        cacheStorage: store.cacheNames
      });
      const view = {
        n,
        name: name || route || "/",
        t: Date.now(),
        url: this.url(page.url()),
        route,
        title: this.meta.title,
        elements: dom.counts.elements,
        forms: dom.forms.length,
        buttons: dom.buttons.length,
        canvases: await page.evaluate(() => document.querySelectorAll("canvas").length).catch(() => 0),
        private: this.isPrivate,
        dir
      };
      const shots = this.opts.screenshots ?? "auto";
      if (shots === "siempre" || shots === "auto" && !this.isPrivate) {
        view.screenshot = s.write(`screenshots/${String(n).padStart(2, "0")}-${label2}.png`, await page.screenshot({ type: "png" }));
        if (n === 1) s.write("screenshots/pagina.png", await page.screenshot({ type: "png" }));
      }
      this.views.push(view);
      await this.syncLocked();
      return view;
    });
  }
  /** Captura de pantalla, solo si la política de la sesión lo permite (nunca en modo privado salvo petición expresa). */
  async screenshot(rel) {
    const shots = this.opts.screenshots ?? "auto";
    if (shots === "nunca" || shots === "auto" && this.isPrivate) return void 0;
    const png = await this.page.screenshot({ type: "png" }).catch(() => null);
    return png ? this.session.write(rel, png) : void 0;
  }
  /** Vuelca a disco lo acumulado (red, tiempo real, instrumentación, metadatos). */
  async sync() {
    if (this.closed) return;
    await this.pump();
    await this.exclusive(() => this.syncLocked());
  }
  async syncLocked() {
    await this.rec.settle();
    this.rec.flush();
    this.meta.requestCount = this.rec.count;
    this.meta.consoleErrors = this.rec.consoleErrors;
    this.session.writeJson("runtime/hooks.json", { ...this.runtime, userEvents: this.runtime.userEvents.length });
    this.session.writeJson("views/index.json", this.views);
    this.session.writeJson("capture.json", this.meta);
  }
  /** app_status: dónde está la aplicación y qué se ha registrado. */
  async status() {
    await this.pump();
    await this.exclusive(() => this.refreshState());
    await this.sync();
    return {
      url: this.meta.finalUrl,
      titulo: this.meta.title,
      barreras: this.meta.barriers,
      sesionIniciada: this.meta.authenticated,
      esperandoInicioDeSesion: this.meta.barriers.includes(LOGIN),
      modoPrivado: this.meta.private,
      visible: this.meta.visible,
      peticiones: this.rec.count,
      websockets: this.rec.websockets.length,
      vistas: this.views.map((v) => `${v.n}. ${v.name} (${v.route})`),
      rutasVisitadas: [...new Set(this.runtime.routes.map((r) => r.url))].length
    };
  }
  async finalize() {
    if (this.closed) return;
    this.closed = true;
    if (this.timer) clearInterval(this.timer);
    if (this.fast) clearInterval(this.fast);
    await this.busy.catch(() => {
    });
    await this.rec.settle().catch(() => {
    });
    this.rec.flush();
    this.meta.requestCount = this.rec.count;
    this.session.writeJson("runtime/hooks.json", { ...this.runtime, userEvents: this.runtime.userEvents.length });
    this.session.writeJson("views/index.json", this.views);
    this.session.writeJson("capture.json", this.meta);
    await this.context.close().catch(() => {
    });
    if (this.session.exists("captura.har")) {
      try {
        const har = redactHar(this.session.readJson("captura.har"));
        if (this.isPrivate) {
          for (const e of har.log?.entries ?? []) if (e.request?.url) e.request.url = privatizeUrl(e.request.url);
        }
        this.session.writeJson("captura.har", har);
      } catch {
        this.session.write("captura.har", '{"log":{"entries":[],"comment":"HAR ilegible; se descart\xF3 para no dejar datos sin enmascarar"}}');
      }
    }
    await this.browser.close().catch(() => {
    });
    if (_LiveApp.current === this) _LiveApp.current = null;
  }
  /** app_close: cierra el navegador y deja la sesión lista para el análisis sin conexión. */
  async close() {
    if (!this.closed) {
      await this.pump().catch(() => {
      });
      await this.exclusive(() => this.syncLocked()).catch(() => {
      });
    }
    await this.finalize();
  }
};
var last = null;
function resolveSession(dir) {
  if (dir) return last = Session.open(dir);
  if (LiveApp.current) return last = LiveApp.current.session;
  if (last) return last;
  throw new Error("No hay ninguna sesi\xF3n. Usa app_open(url) primero o indica la carpeta de la sesi\xF3n.");
}
async function syncIfLive(session) {
  const app = LiveApp.current;
  if (app && !app.closed && app.session.dir === session.dir) await app.sync();
}

// src/core/locate.ts
var import_source_map_js = __toESM(require_source_map(), 1);

// src/core/scripts.ts
var import_js_beautify = __toESM(require_js(), 1);
import fs3 from "node:fs";
import path3 from "node:path";
var beautify = import_js_beautify.default.js ?? import_js_beautify.default.js_beautify ?? import_js_beautify.default;
var SIGNATURES = [
  { name: "React", kind: "framework", url: /react(-dom)?[.@-](\d|prod|dev|min)/i, content: /Symbol\.for\(["']react\.(transitional\.)?element["']\)|__SECRET_INTERNALS_DO_NOT_USE|react-dom/ },
  { name: "Next.js", kind: "framework", url: /\/_next\/static\//, content: /__NEXT_DATA__|__next_f|next\/dist\// },
  { name: "Vue", kind: "framework", url: /vue(\.runtime)?(\.global)?(\.prod)?(\.min)?\.js/i, content: /__vue_app__|__v_isRef|__VUE_OPTIONS_API__|Vue\.js v\d/, version: /Vue\.js v([\d.]+)/ },
  { name: "Nuxt", kind: "framework", url: /\/_nuxt\//, content: /__NUXT__|nuxt\/dist/ },
  { name: "Angular", kind: "framework", content: /@angular\/core|ɵɵdefineComponent|ng-version|platformBrowserDynamic/ },
  { name: "Svelte", kind: "framework", url: /\/_app\/immutable\//, content: /svelte\/internal|SvelteComponent|__svelte/ },
  { name: "Astro", kind: "framework", url: /\/_astro\//, content: /astro-island|astro:load/ },
  { name: "Alpine.js", kind: "framework", url: /alpine(js)?(\.min)?\.js/i, content: /Alpine\.start\(|alpine:init/ },
  { name: "htmx", kind: "librer\xEDa", url: /htmx(\.min)?\.js/i, content: /htmx:afterSwap|hx-swap/ },
  { name: "jQuery", kind: "librer\xEDa", url: /jquery([.-][\d.]+)?(\.slim)?(\.min)?\.js/i, content: /jQuery v\d|jquery\.org\/license|\.fn\.jquery\b|jQuery\.fn\.init/, version: /jQuery (?:JavaScript Library )?v([\d.]+)/ },
  { name: "Lodash", kind: "librer\xEDa", url: /lodash(\.min)?\.js/i, content: /lodash\.com\/license|__lodash_hash_undefined__/ },
  { name: "Axios", kind: "librer\xEDa", url: /axios(\.min)?\.js/i, content: /isAxiosError|AxiosError|axios\/\d/, version: /axios\/([\d.]+)/ },
  { name: "Redux", kind: "librer\xEDa", content: /@@redux\/INIT|redux-toolkit|reduxjs/ },
  { name: "React Router", kind: "librer\xEDa", content: /react-router|UNSAFE_NavigationContext/ },
  { name: "TanStack Query", kind: "librer\xEDa", content: /@tanstack\/(react-)?query|QueryClient\b/ },
  { name: "Apollo Client", kind: "librer\xEDa", content: /ApolloClient|@apollo\/client/ },
  { name: "Socket.IO", kind: "librer\xEDa", url: /socket\.io/i, content: /socket\.io-client|engine\.io/ },
  { name: "Bootstrap", kind: "librer\xEDa", url: /bootstrap(\.bundle)?(\.min)?\.js/i, content: /Bootstrap v\d|getbootstrap\.com/, version: /Bootstrap v([\d.]+)/ },
  { name: "GSAP", kind: "librer\xEDa", url: /gsap|TweenMax/i, content: /GreenSock|gsap\.registerPlugin/ },
  { name: "Three.js", kind: "librer\xEDa", url: /three(\.module)?(\.min)?\.js/i, content: /THREE\.WebGLRenderer|WebGLRenderer\b.*REVISION/ },
  { name: "D3", kind: "librer\xEDa", url: /d3(\.v\d)?(\.min)?\.js/i, content: /d3-selection|d3js\.org/ },
  { name: "Moment.js", kind: "librer\xEDa", url: /moment(\.min)?\.js/i, content: /_isAMomentObject/ },
  { name: "core-js", kind: "librer\xEDa", content: /__core-js_shared__|core-js\/(internals|modules)/ },
  { name: "Workbox", kind: "librer\xEDa", content: /workbox-(core|routing|precaching)/ },
  { name: "webpack", kind: "empaquetador", content: /__webpack_require__|webpackChunk\w*|webpackJsonp/ },
  { name: "Vite", kind: "empaquetador", content: /__vite__mapDeps|__vitePreload|vite\/modulepreload-polyfill/ },
  { name: "Parcel", kind: "empaquetador", content: /parcelRequire/ },
  { name: "Sentry", kind: "anal\xEDtica", url: /sentry(-cdn)?\.(io|com)|@sentry/i, content: /Sentry\.init\(|sentry-javascript|__SENTRY__/ },
  { name: "Google Tag Manager", kind: "anal\xEDtica", url: /googletagmanager\.com\/gtm\.js/ },
  { name: "Google Analytics", kind: "anal\xEDtica", url: /google-analytics\.com|googletagmanager\.com\/gtag\/js/ },
  { name: "Meta Pixel", kind: "anal\xEDtica", url: /connect\.facebook\.net/ },
  { name: "Hotjar", kind: "anal\xEDtica", url: /static\.hotjar\.com/ },
  { name: "Stripe.js", kind: "librer\xEDa", url: /js\.stripe\.com/ }
];
var HINTS = [
  { tipo: "petici\xF3n fetch", re: /\bfetch\s*\(/ },
  { tipo: "XMLHttpRequest", re: /new\s+XMLHttpRequest\b/ },
  { tipo: "WebSocket", re: /new\s+WebSocket\s*\(/ },
  { tipo: "manejador de evento", re: /\.addEventListener\s*\(/ },
  { tipo: "almacenamiento local", re: /\b(localStorage|sessionStorage)\s*\.\s*(setItem|getItem)\s*\(/ },
  { tipo: "IndexedDB", re: /indexedDB\s*\.\s*open\s*\(/ },
  { tipo: "historial/ruteo", re: /history\s*\.\s*(pushState|replaceState)\s*\(/ }
];
function isMinified(code) {
  const lines = code.split("\n");
  const longest = lines.reduce((m, l) => Math.max(m, l.length), 0);
  return code.length > 600 && (code.length / lines.length > 220 || longest > 2500);
}
function findMapRef(code) {
  const tail = code.slice(-4e3);
  const all = [...tail.matchAll(/\/[/*]#\s*sourceMappingURL=([^\s*]+)/g)];
  return all.length ? all[all.length - 1][1] : void 0;
}
function cleanSourcePath(src, i) {
  const parts = src.replace(/^[a-z][a-z0-9+.-]*:\/\/+/i, "").replace(/[?#].*$/, "").split(/[\\/]+/).filter((s) => s && s !== ".");
  while (parts[0] === "..") parts.shift();
  const p = parts.map((s) => s === ".." ? "_" : s.replace(/[<>:"|?*\u0000-\u001f]/g, "_")).join("/");
  return p || `fuente-${i}.js`;
}
function flattenMap(map) {
  const sources = [];
  const contents = [];
  const add = (m) => {
    const root = m.sourceRoot ? String(m.sourceRoot).replace(/\/?$/, "/") : "";
    (m.sources ?? []).forEach((s, i) => {
      sources.push(root + s);
      contents.push(m.sourcesContent?.[i] ?? null);
    });
  };
  if (Array.isArray(map.sections)) {
    for (const s of map.sections) if (s.map) add(s.map);
  }
  add(map);
  return { sources, contents };
}
async function loadMap(ref, scriptUrl) {
  try {
    if (ref.startsWith("data:")) {
      const comma = ref.indexOf(",");
      const meta = ref.slice(0, comma);
      const payload = ref.slice(comma + 1);
      return JSON.parse(/;base64/i.test(meta) ? Buffer.from(payload, "base64").toString("utf8") : decodeURIComponent(payload));
    }
    const res = await politeFetch(new URL(ref, scriptUrl).toString(), { maxBytes: 60 * 1024 * 1024 });
    if (!res?.ok) return null;
    return JSON.parse(res.text.replace(/^\)\]\}'[^\n]*\n/, ""));
  } catch {
    return null;
  }
}
async function scriptsAnalysis(session, opts = {}) {
  const entries = session.readJsonl("network/requests.jsonl");
  const dom = session.readJson("dom/snapshot.json");
  const probes = session.exists("stack/probes.json") ? session.readJson("stack/probes.json") : { found: {} };
  const f = new Findings("scripts", "SCR");
  const files = [];
  const infos = [];
  const index = {};
  const packages = /* @__PURE__ */ new Set();
  const detected = /* @__PURE__ */ new Map();
  const hints = [];
  let mapsTried = 0;
  const maxMaps = opts.maxMaps ?? 30;
  const sources = [];
  for (const e of entries) {
    if (e.resourceType === "script" && e.bodyFile) {
      sources.push({ url: e.url, file: e.bodyFile, origen: "externo", terceros: e.thirdParty, header: e.resHeaders["sourcemap"] ?? e.resHeaders["x-sourcemap"] });
    }
  }
  for (const s of dom.scripts) {
    const file = s.file;
    if (file) sources.push({ url: `${dom.url}#inline-${s.index}`, file, origen: "inline", terceros: false });
  }
  for (const src of sources) {
    const code = session.read(src.file);
    const minified = isMinified(code);
    const name = slug(src.file.replace(/^scripts\/raw\//, "").replace(/\.js$/, ""), 60);
    const info = { url: src.url, origen: src.origen, terceros: src.terceros, bytes: code.length, minificado: minified, archivo: src.file, legible: src.file, mapa: "no buscado", fuentes: 0, librerias: [] };
    const ref = src.header ?? findMapRef(code);
    const wantMap = (!src.terceros || opts.thirdPartyMaps) && mapsTried < maxMaps;
    if (wantMap && (ref || minified && src.origen === "externo")) {
      mapsTried++;
      const cached = `sourcemaps/${name}.map`;
      const map = session.exists(cached) ? session.readJson(cached) : await loadMap(ref ?? `${src.url.replace(/[?#].*$/, "")}.map`, src.url);
      if (map && (map.sources || map.sections)) {
        const { sources: names, contents } = flattenMap(map);
        for (const m of [map, ...Array.isArray(map.sections) ? map.sections.map((s) => s.map) : []]) {
          if (Array.isArray(m?.sourcesContent)) m.sourcesContent = m.sourcesContent.map((c) => typeof c === "string" ? redactCode(c) : c);
        }
        info.mapaArchivo = session.write(`sourcemaps/${name}.map`, JSON.stringify(map));
        const dir = `sources/${name}`;
        let written = 0;
        const firstFiles = [];
        names.forEach((s, i) => {
          const pkg = /node_modules\/((?:@[^/]+\/)?[^/]+)/.exec(s)?.[1];
          if (pkg) {
            packages.add(pkg);
            return;
          }
          const content = contents[i];
          if (content == null || written >= 3e3) return;
          const rel = session.write(`${dir}/${cleanSourcePath(s, i)}`, redactCode(content));
          written++;
          if (firstFiles.length < 5) firstFiles.push(rel);
        });
        info.fuentes = written;
        info.mapa = written ? "recuperado" : "sin contenido";
        if (written) {
          info.dirFuentes = dir;
          info.legible = dir;
          files.push(dir);
          f.add(`Source map recuperado para ${src.url.split("/").pop()}: ${written} m\xF3dulos originales`, {
            detail: `De ${names.length} fuentes listadas en el mapa (${names.length - written} son dependencias de node_modules o no traen contenido). C\xF3digo original en ${dir}/.`,
            evidence: [{ file: info.mapaArchivo }, ...firstFiles.map((file) => ({ file, line: 1 }))]
          });
        } else {
          f.unknown(`El source map de ${src.url} no incluye sourcesContent: solo se conocen los nombres de ${names.length} archivos originales.`);
        }
      } else {
        info.mapa = "no disponible";
      }
    }
    if (!info.fuentes && minified && code.length < 3 * 1024 * 1024) {
      try {
        info.legible = session.write(`sources/beautified/${name}.js`, beautify(code, { indent_size: 2, max_preserve_newlines: 2 }));
        files.push(info.legible);
      } catch {
        f.unknown(`No se pudo embellecer ${src.file}.`);
      }
    }
    const readable = info.fuentes ? "" : session.read(info.legible);
    for (const sig of SIGNATURES) {
      const byUrl = sig.url?.test(src.url);
      const m = sig.content ? sig.content.exec(code) : null;
      if (!byUrl && !m) continue;
      info.librerias.push(sig.name);
      const version = sig.version?.exec(code)?.[1] ?? /[@/-]v?(\d+\.\d+\.\d+)/.exec(byUrl ? src.url : "")?.[1];
      const prev = detected.get(sig.name);
      const ev = m ? { file: info.fuentes ? src.file : info.legible, line: lineOf(info.fuentes ? code : readable, m[0]), note: `coincide \xAB${m[0].slice(0, 50)}\xBB` } : { file: src.file, note: `URL ${src.url}` };
      if (!prev) detected.set(sig.name, { nombre: sig.name, tipo: sig.kind, version, via: m ? "contenido del script" : "URL del script", evidence: [ev] });
      else {
        if (!prev.version && version) prev.version = version;
        if (prev.evidence.length < 3) prev.evidence.push(ev);
      }
    }
    if (!src.terceros && hints.length < 60) {
      const readableFiles = info.fuentes ? listFiles(session, info.dirFuentes).slice(0, 80) : [info.legible];
      for (const file of readableFiles) {
        const lines = session.read(file).split("\n");
        for (let i = 0; i < lines.length && hints.length < 60; i++) {
          if (lines[i].length > 400) continue;
          for (const h of HINTS) {
            if (h.re.test(lines[i])) {
              hints.push({ archivo: file, linea: i + 1, tipo: h.tipo, texto: lines[i].trim().slice(0, 140) });
              break;
            }
          }
        }
      }
    }
    index[src.url] = { raw: src.file, map: info.mapaArchivo, dir: info.dirFuentes, readable: info.legible };
    infos.push(info);
  }
  for (const [name, value] of Object.entries(probes.found)) {
    const sig = SIGNATURES.find((s) => s.name === name);
    const prev = detected.get(name);
    const version = typeof value === "string" ? value : void 0;
    const ev = { file: "stack/probes.json", note: "se\xF1al en tiempo de ejecuci\xF3n" };
    if (prev) {
      prev.via = "tiempo de ejecuci\xF3n + " + prev.via;
      prev.version = version ?? prev.version;
      prev.evidence.unshift(ev);
    } else {
      detected.set(name, { nombre: name, tipo: sig?.kind ?? "librer\xEDa", version, via: "tiempo de ejecuci\xF3n", evidence: [ev] });
    }
  }
  session.writeJson("sources/index.json", index);
  files.push("sources/index.json");
  const ext = infos.filter((i) => i.origen === "externo");
  const third = infos.filter((i) => i.terceros);
  f.add(`${infos.length} scripts: ${ext.length} externos (${third.length} de terceros) y ${infos.length - ext.length} en l\xEDnea`, {
    detail: `${Math.round(infos.reduce((s, i) => s + i.bytes, 0) / 1024)} KB de JavaScript; ${infos.filter((i) => i.minificado).length} minificados.`,
    evidence: [{ file: "sources/index.json" }, ...infos.slice(0, 4).map((i) => ({ file: i.archivo, line: 1 }))]
  });
  const order = { framework: 0, empaquetador: 1, librer\u00EDa: 2, anal\u00EDtica: 3 };
  for (const d of [...detected.values()].sort((a, b) => (order[a.tipo] ?? 9) - (order[b.tipo] ?? 9)).slice(0, 25)) {
    f.add(`${d.tipo[0].toUpperCase()}${d.tipo.slice(1)}: ${d.nombre}${d.version ? ` ${d.version}` : ""}`, {
      detail: `Detectado por ${d.via}.`,
      confidence: d.via.includes("tiempo de ejecuci\xF3n") ? "alta" : "media",
      evidence: d.evidence
    });
  }
  if (packages.size) {
    f.add(`${packages.size} paquetes npm identificados por las rutas del source map`, {
      detail: [...packages].sort().slice(0, 60).join(", "),
      evidence: infos.filter((i) => i.mapaArchivo).slice(0, 3).map((i) => ({ file: i.mapaArchivo }))
    });
  }
  const pretty = infos.filter((i) => i.legible.startsWith("sources/beautified/"));
  if (pretty.length) {
    f.add(`${pretty.length} scripts minificados sin source map fueron embellecidos`, {
      detail: "Los nombres de variables siguen ofuscados: sirve para leer la estructura, no para recuperar nombres originales.",
      evidence: pretty.slice(0, 5).map((i) => ({ file: i.legible, line: 1 }))
    });
  }
  if (hints.length) {
    const kinds = /* @__PURE__ */ new Map();
    for (const h of hints) kinds.set(h.tipo, (kinds.get(h.tipo) ?? 0) + 1);
    f.add("Puntos de entrada en el c\xF3digo propio", {
      detail: [...kinds].map(([k, n]) => `${n} \xD7 ${k}`).join(", "),
      confidence: "media",
      evidence: hints.slice(0, 12).map((h) => ({ file: h.archivo, line: h.linea, note: `${h.tipo}: ${h.texto}` }))
    });
  }
  if (!detected.size) f.unknown("No se reconoci\xF3 ning\xFAn framework o librer\xEDa: puede ser JavaScript sin dependencias o una tecnolog\xEDa que no est\xE1 en las firmas.");
  const noMap = infos.filter((i) => !i.terceros && i.minificado && !i.fuentes);
  if (noMap.length) f.unknown(`${noMap.length} script(s) propios minificados no publican source map: su l\xF3gica solo se puede leer embellecida, con nombres ofuscados.`);
  if (third.length && !opts.thirdPartyMaps) f.unknown(`No se buscaron source maps de los ${third.length} scripts de terceros.`);
  f.unknown("Los m\xF3dulos cargados de forma diferida (import din\xE1mico tras una interacci\xF3n) solo aparecen si se cargaron durante la captura.");
  const data = {
    scripts: infos,
    detectado: [...detected.values()].map(({ evidence: _e, ...rest }) => rest),
    paquetes: [...packages].sort(),
    pistas: hints
  };
  return session.saveResult({ tool: "app_scripts", session: session.dir, findings: f.list, unknowns: f.unknowns, files, data });
}
function listFiles(session, relDir) {
  const out = [];
  const walk = (rel) => {
    for (const ent of fs3.readdirSync(session.abs(rel), { withFileTypes: true })) {
      const child = path3.posix.join(rel, ent.name);
      if (ent.isDirectory()) walk(child);
      else if (/\.(m?[jt]sx?|vue|svelte)$/.test(ent.name)) out.push(child);
    }
  };
  walk(relDir);
  return out;
}

// src/core/locate.ts
var DECLS = [
  /function\s*\*?\s*([A-Za-z_$][\w$]*)\s*\(/,
  /(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:function\b|\([^)]*\)\s*=>|[A-Za-z_$][\w$]*\s*=>)/,
  /^\s*(?:export\s+)?(?:async\s+|static\s+)*([A-Za-z_$][\w$]*)\s*\([^)]*\)\s*\{/
];
var KEYWORDS = /^(if|for|while|switch|catch|function|return|await)$/;
function declaredName(line) {
  for (const re of DECLS) {
    const m = re.exec(line);
    if (m && !KEYWORDS.test(m[1])) return m[1];
  }
  return void 0;
}
function enclosingFunction(lines, index) {
  const indent = (l) => l.length - l.trimStart().length;
  const own = indent(lines[index] ?? "");
  for (let i = index; i >= 0 && i > index - 80; i--) {
    const name = declaredName(lines[i]);
    if (name && (i === index || indent(lines[i]) < own)) return name;
  }
  return void 0;
}
var SourceLocator = class {
  constructor(session) {
    this.session = session;
    if (session.exists("sources/index.json")) this.index = session.readJson("sources/index.json");
    for (const e of session.readJsonl("network/requests.jsonl")) if (e.bodyFile) this.rawByUrl.set(e.url, e.bodyFile);
    if (session.exists("capture.json")) this.pageUrl = String(session.readJson("capture.json").finalUrl).replace(/#.*$/, "");
  }
  session;
  index = {};
  rawByUrl = /* @__PURE__ */ new Map();
  consumers = /* @__PURE__ */ new Map();
  pageUrl = "";
  get hasSourceMaps() {
    return Object.values(this.index).some((i) => i.map);
  }
  /**
   * @param callSite true si la posición es una llamada dentro de una función (p. ej. el origen de
   *   una petición) y no el inicio de la función: entonces se busca la función que la contiene.
   */
  locate(frame, callSite = false) {
    const url = frame.url.replace(/#.*$/, "");
    const where = `${frame.fn} \xB7 ${frame.url.split("/").pop()}:${frame.line}:${frame.column}`;
    if (url === this.pageUrl) {
      const served = this.session.exists("page-source.html");
      return { file: served ? "page-source.html" : "page.html", line: served ? frame.line : void 0, note: `${where} (script en l\xEDnea)` };
    }
    const info = this.index[frame.url] ?? this.index[url];
    if (info?.map && info.dir) {
      try {
        let consumer = this.consumers.get(info.map);
        if (!consumer) {
          consumer = new import_source_map_js.SourceMapConsumer(this.session.readJson(info.map));
          this.consumers.set(info.map, consumer);
        }
        const pos = consumer.originalPositionFor({ line: frame.line, column: Math.max(0, frame.column - 1) });
        if (pos?.source && pos.line) {
          const rel = `${info.dir}/${cleanSourcePath(pos.source, 0)}`;
          let name = callSite ? void 0 : pos.name ?? void 0;
          const exists = this.session.exists(rel);
          if (exists) {
            const lines = this.session.read(rel).split("\n");
            name = (callSite ? enclosingFunction(lines, pos.line - 1) : declaredName(lines[pos.line - 1] ?? "")) ?? name;
          }
          const original = `${name ?? (frame.fn.length > 2 ? frame.fn : "(an\xF3nima)")} en ${String(pos.source).replace(/^(?:[.][.][/])+/, "")}:${pos.line}`;
          if (exists) return { file: rel, line: pos.line, note: `${where} \u2192 original`, original, originalName: name };
          return { file: info.map, note: `${where} \u2192 ${original} (fuente no volcada)`, original };
        }
      } catch {
      }
    }
    const raw = info?.raw ?? this.rawByUrl.get(frame.url) ?? this.rawByUrl.get(url);
    if (raw) return { file: raw, line: frame.line, note: `${where}${frame.column > 200 ? ` (columna ${frame.column}; script minificado)` : ""}` };
    return { file: "network/requests.jsonl", note: `${where} (script no capturado)` };
  }
};

// src/core/flow.ts
var active = /* @__PURE__ */ new WeakMap();
var EVENTS = {
  click: ["click", "mousedown", "mouseup", "pointerdown", "pointerup", "submit"],
  escribir: ["input", "keydown", "keyup", "keypress", "change", "beforeinput"],
  tecla: ["keydown", "keyup", "keypress", "submit", "change"],
  cambio: ["change", "input", "click"],
  envio: ["submit"],
  hover: ["mouseover", "mouseenter", "pointerenter", "pointerover", "mousemove"],
  scroll: ["scroll", "wheel", "scrollend"]
};
function fnName(description) {
  const d = description ?? "";
  return /^(?:async\s+)?function\s*\*?\s*([\w$]+)/.exec(d)?.[1] ?? /^(?:async\s+)?([\w$]+)\s*\(/.exec(d)?.[1]?.replace(/^(function|if|for|while|switch)$/, "") ?? "";
}
async function guard(page, action) {
  if (!("selector" in action) || !action.selector) return null;
  const loc = page.locator(action.selector).first();
  if (!await loc.count()) return null;
  const info = await loc.evaluate((el) => {
    const form = el.closest("form");
    const control = el.closest('button, a, [role="button"], [role="menuitem"], input[type="submit"], input[type="button"]') ?? el;
    return {
      desc: [el.tagName, el.getAttribute("type"), el.getAttribute("name"), el.id, el.getAttribute("autocomplete"), el.getAttribute("aria-label"), typeof el.className === "string" ? el.className : ""].filter(Boolean).join(" "),
      label: [control.getAttribute("aria-label"), control.getAttribute("title"), control.getAttribute("value"), (control.textContent ?? "").trim().slice(0, 80), control.getAttribute("name"), control.id].filter(Boolean).join(" "),
      type: (el.getAttribute("type") ?? "").toLowerCase(),
      isSubmit: el.matches('button:not([type="button"]), input[type="submit"]') && !!form,
      formHasPassword: !!form?.querySelector('input[type="password"]'),
      formHasCard: !!form?.querySelector('input[autocomplete^="cc-"], input[name*="card" i], input[name*="cvv" i], input[name*="cvc" i]'),
      inCaptcha: !!el.closest('.g-recaptcha, .h-captcha, [class*="captcha" i], [id*="captcha" i]')
    };
  });
  if (info.inCaptcha) return "el elemento pertenece a un CAPTCHA: REA APP no interact\xFAa con protecciones anti-bot";
  if (action.tipo === "escribir" && (info.type === "password" || FORBIDDEN_INPUT.test(info.desc))) {
    return "el campo es de contrase\xF1a, pago o verificaci\xF3n: REA APP no escribe credenciales ni datos de pago. Si hace falta, el usuario lo hace a mano en la ventana";
  }
  if (action.tipo === "click" || action.tipo === "tecla") {
    if (info.formHasPassword && (info.isSubmit || action.tipo === "tecla")) return "el control env\xEDa un formulario de inicio de sesi\xF3n: REA APP no inicia sesi\xF3n; lo hace el usuario en la ventana";
    if (info.formHasCard && (info.isSubmit || action.tipo === "tecla")) return "el control env\xEDa un formulario de pago: REA APP no realiza pagos";
    if (action.tipo === "click" && (FORBIDDEN_CLICK.test(info.label) || FORBIDDEN_OPERATION.test(info.label))) {
      return `el control (\xAB${info.label.slice(0, 40)}\xBB) puede ejecutar una operaci\xF3n con efectos reales: REA APP no la acciona. Para estudiarla, gr\xE1bala con app_record mientras el usuario la hace`;
    }
  }
  return null;
}
async function listenersFor(app, selector, types) {
  const out = [];
  if (!types?.length) return out;
  const cdp = app.cdp;
  const scripts = app.scripts;
  let mark = "";
  try {
    if (selector && await app.page.locator(selector).first().count()) {
      mark = `m${Date.now() % 1e5}`;
      await app.page.locator(selector).first().evaluate((el, m) => el.setAttribute("data-rea-objetivo", m), mark);
    }
    const expression = `(() => { const out = []; let el = ${mark ? `document.querySelector('[data-rea-objetivo="${mark}"]')` : "null"}; while (el) { out.push(el); el = el.parentElement; } out.push(document, window); return out; })()`;
    const { result } = await cdp.send("Runtime.evaluate", { expression, objectGroup: "rea-app" });
    if (!result.objectId) return out;
    const { result: props } = await cdp.send("Runtime.getProperties", { objectId: result.objectId, ownProperties: true });
    for (const p of props) {
      if (!/^\d+$/.test(p.name) || !p.value?.objectId) continue;
      const { listeners } = await cdp.send("DOMDebugger.getEventListeners", { objectId: p.value.objectId, depth: 0 });
      for (const l of listeners) {
        if (!types.includes(l.type)) continue;
        const meta = scripts.get(l.scriptId);
        if (!meta || !/^https?:/.test(meta.url)) continue;
        out.push({ evento: l.type, nodo: p.name === "0" && mark ? "objetivo" : p.value.description ?? p.value.className ?? "nodo", description: l.handler?.description ?? "", frame: { fn: "", url: meta.url, line: l.lineNumber + 1, column: l.columnNumber + 1 } });
      }
    }
  } catch {
  } finally {
    await cdp.send("Runtime.releaseObjectGroup", { objectGroup: "rea-app" }).catch(() => {
    });
    if (mark) await app.page.locator(`[data-rea-objetivo="${mark}"]`).first().evaluate((el) => el.removeAttribute("data-rea-objetivo")).catch(() => {
    });
  }
  return out;
}
function describeAction(a) {
  switch (a.tipo) {
    case "click":
      return `clic en ${a.selector}`;
    case "escribir":
      return `escribir ${String(a.texto).length} caracteres en ${a.selector}`;
    case "tecla":
      return `tecla ${a.tecla}${a.selector ? ` en ${a.selector}` : ""}`;
    case "hover":
      return `pasar el cursor por ${a.selector}`;
    case "scroll":
      return a.selector ? `desplazar hasta ${a.selector}` : `desplazar ${a.y ?? 800}px`;
    case "navegar":
      return `navegar a ${a.ruta}`;
    case "esperar":
      return `esperar ${a.ms} ms`;
  }
}
function describeEvent(e) {
  const where = `${e.target} (${e.selector})`;
  const tail = e.submits ? " y enviar el formulario" : "";
  switch (e.kind) {
    case "click":
      return `clic en ${where}${e.detail ? ` \u2014 ${e.detail}` : ""}${tail}`;
    case "escribir":
      return `escribir ${e.detail ?? ""} en ${where}${tail}`;
    case "cambio":
      return `cambiar ${e.detail ?? "valor"} en ${where}${tail}`;
    case "envio":
      return `enviar el formulario ${e.selector}`;
    case "tecla":
      return `tecla ${e.detail}${e.times && e.times > 1 ? ` \xD7${e.times}` : ""} en ${where}${tail}`;
  }
}
function mergeEvents(events) {
  const out = [];
  for (const raw of events) {
    const e = { ...raw };
    const prev = out[out.length - 1];
    if (prev) {
      const gap = e.t - (prev.end ?? prev.t);
      if (e.kind === "escribir" && prev.kind === "escribir" && prev.selector === e.selector && gap < 4e3) {
        prev.detail = e.detail;
        prev.end = e.end ?? e.t;
        continue;
      }
      if (e.kind === "tecla" && prev.kind === "tecla" && prev.detail === e.detail && prev.selector === e.selector && gap < 1500) {
        prev.times = (prev.times ?? 1) + 1;
        prev.end = e.t;
        continue;
      }
      if (e.kind === "envio" && gap < 500) {
        prev.submits = true;
        continue;
      }
      if (e.kind === "cambio" && prev.kind === "click" && gap < 400) continue;
      if (e.kind === "click" && prev.kind === "click" && gap < 60 && /^label/.test(prev.target)) continue;
    }
    out.push(e);
  }
  return out.slice(0, 80);
}
async function startRecording(app, name, mode = "manual") {
  if (active.has(app)) throw new Error('Ya hay una grabaci\xF3n en curso. Det\xE9nla con app_record(accion: "detener") antes de empezar otra.');
  const idle = await app.beginCollect();
  active.set(app, { name: name || "flujo", mode, t0: Date.now(), idle, evStart: app.runtime.userEvents.length, marks: [] });
}
function isRecording(app) {
  return active.has(app);
}
function emptyDom() {
  return { registros: 0, anadidos: [], eliminados: 0, atributos: [], textos: 0 };
}
async function stopRecording(app) {
  const rec = active.get(app);
  if (!rec) throw new Error('No hay ninguna grabaci\xF3n en curso. Empieza con app_record(accion: "iniciar").');
  await app.endCollect();
  active.delete(app);
  const tEnd = Date.now();
  await app.sync();
  const session = app.session;
  if (session.exists("sources/index.json")) {
    const index = session.readJson("sources/index.json");
    if (app.rec.entries.some((e) => e.bodyFile && !e.thirdParty && !(e.url in index))) await scriptsAnalysis(session).catch(() => {
    });
  }
  const locator = new SourceLocator(session);
  let drafts;
  if (rec.mode === "guiada") {
    drafts = rec.marks.map((m) => ({ t0: m.t0, t1: m.t1, origen: "guiada", gesto: describeAction(m.action), selector: "selector" in m.action ? m.action.selector : void 0, kind: m.action.tipo, mark: m }));
  } else {
    const events = mergeEvents(app.runtime.userEvents.slice(rec.evStart).filter((e) => e.t >= rec.t0));
    drafts = events.map((e, i) => ({ t0: e.t - 30, t1: Math.min(events[i + 1]?.t ?? tEnd, e.t + 15e3) - 31, origen: "usuario", gesto: describeEvent(e), selector: e.selector.startsWith("(") ? void 0 : e.selector, kind: e.kind }));
  }
  const id = `flujo-${String((session.loadResult("app_flows")?.data.flujos.length ?? 0) + 1).padStart(2, "0")}`;
  const steps = [];
  for (let i = 0; i < drafts.length; i++) {
    const d = drafts[i];
    const inWin = (t) => t >= d.t0 && t <= d.t1;
    const step = { paso: i + 1, t: d.t0, origen: d.origen, gesto: d.gesto, selector: d.selector, ok: d.mark ? d.mark.ok : true, rutas: [], dom: emptyDom(), peticiones: [], trozos: [], recursos: 0, mensajes: [], manejadores: [], funciones: [], fondo: 0 };
    steps.push(step);
    if (d.mark) {
      step.urlAntes = d.mark.urlBefore;
      step.urlDespues = d.mark.urlAfter;
      step.captura = d.mark.screenshot;
      if (d.mark.refusal) {
        step.rechazada = d.mark.refusal;
        continue;
      }
      if (d.mark.error) step.error = d.mark.error;
    }
    step.rutas = app.runtime.routes.filter((r) => inWin(r.t) && r.kind !== "carga");
    app.rec.entries.forEach((e, index) => {
      if (!inWin(e.t)) return;
      const data = e.resourceType === "xhr" || e.resourceType === "fetch" || e.resourceType === "eventsource" || e.resourceType === "document" || e.method !== "GET";
      if (data) {
        if (step.peticiones.length < 25) {
          step.peticiones.push({ metodo: e.method, url: e.url, estado: e.status, tipo: e.resourceType, linea: index + 1, iniciador: e.initiator ? locator.locate(e.initiator, true).original ?? `${e.initiator.fn} en ${e.initiator.url.split("/").pop()}:${e.initiator.line}` : void 0 });
        }
      } else {
        step.recursos++;
        if (e.resourceType === "script" && step.trozos.length < 12) step.trozos.push(e.url.split("/").pop() ?? e.url);
      }
    });
    const sent = /* @__PURE__ */ new Map();
    for (const ws of app.rec.websockets) for (const m of ws.sentLog) if (inWin(m.t) && !HEARTBEAT.test(m.key)) sent.set(m.key, (sent.get(m.key) ?? 0) + 1);
    step.mensajes = [...sent].map(([clave, veces]) => ({ clave, veces })).sort((a, b) => b.veces - a.veces).slice(0, 12);
    const groups = /* @__PURE__ */ new Map();
    const attrs = /* @__PURE__ */ new Map();
    for (const m of app.mutations) {
      if (!inWin(m.t)) continue;
      step.dom.registros++;
      if (m.kind === "added") {
        const key = `${m.parent}|${m.node}`;
        const g = groups.get(key) ?? { donde: m.parent, nodos: m.node, cantidad: 0 };
        g.cantidad++;
        groups.set(key, g);
      } else if (m.kind === "removed") step.dom.eliminados++;
      else if (m.kind === "attrs") {
        if (m.attr !== "data-rea-objetivo") attrs.set(`${m.target}|${m.attr}`, { objetivo: m.target, atributo: m.attr });
      } else step.dom.textos++;
    }
    const isText = (g) => Number(g.nodos.startsWith("#texto"));
    step.dom.anadidos = [...groups.values()].sort((a, b) => isText(a) - isText(b) || b.cantidad - a.cantidad).slice(0, 12);
    step.dom.atributos = [...attrs.values()].slice(0, 12);
    const until = d.origen === "guiada" ? d.t1 + 450 : drafts[i + 1]?.t0 ?? Infinity;
    const agg = /* @__PURE__ */ new Map();
    for (const b of app.buckets) {
      if (b.t1 <= d.t0 || b.t1 > until) continue;
      for (const fn of b.fns) {
        const prev = agg.get(fn.key);
        if (prev) prev.count += fn.count;
        else agg.set(fn.key, { ...fn });
      }
    }
    const signal = [...agg.values()].filter((fn) => !rec.idle.has(fn.key));
    step.fondo = agg.size - signal.length;
    const described = [];
    for (const fn of signal.slice(0, 40)) {
      const { frame, snippet } = await app.describe(fn);
      const donde = locator.locate(frame);
      described.push({ funcion: donde.originalName ?? frame.fn, llamadas: fn.count, fragmento: snippet, frame, donde });
    }
    step.funciones = described;
    const raw = d.mark ? d.mark.listeners : await listenersFor(app, d.selector, EVENTS[d.kind] ?? []);
    step.manejadores = raw.slice(0, 12).map((l) => {
      const frame = { ...l.frame, url: redactUrl(l.frame.url), fn: fnName(l.description) || "(an\xF3nima)" };
      const ran = described.find((x) => x.frame.url === frame.url && x.frame.line === frame.line && Math.abs(x.frame.column - frame.column) <= frame.fn.length + 16);
      const donde = locator.locate(frame);
      return { evento: l.evento, nodo: l.nodo, funcion: donde.originalName ?? (ran && frame.fn === "(an\xF3nima)" ? ran.funcion : frame.fn), fragmento: redactCode(l.description.slice(0, 220)).replace(/\s+/g, " "), ejecutado: !!ran, frame, donde };
    }).sort((a, b) => Number(b.ejecutado) - Number(a.ejecutado));
  }
  const flow = { id, nombre: rec.name, modo: rec.mode, cuando: new Date(rec.t0).toISOString(), duracionMs: tEnd - rec.t0, pasos: steps };
  session.writeJson(`flows/${id}.json`, flow);
  const flows = [...session.loadResult("app_flows")?.data.flujos ?? [], flow];
  const f = buildFindings(flows);
  if (!locator.hasSourceMaps) f.unknown("Sin source maps recuperados (ejecuta app_scripts antes de grabar): las funciones se citan por su posici\xF3n en el script servido.");
  if (rec.mode === "manual" && !steps.length) f.unknown(`Flujo \xAB${rec.name}\xBB: no se registr\xF3 ning\xFAn gesto del usuario durante la grabaci\xF3n.`);
  return session.saveResult({ tool: "app_flows", session: session.dir, findings: f.list, unknowns: f.unknowns, files: [`flows/${id}.json`, ...steps.flatMap((s) => s.captura ? [s.captura] : [])], data: { flujos: flows, nuevo: flow } });
}
function buildFindings(flows) {
  const f = new Findings("flujo", "FLU");
  for (const flow of flows) {
    for (const s of flow.pasos) {
      const label2 = `Flujo \xAB${flow.nombre}\xBB, paso ${s.paso} (${s.gesto})`;
      const file = `flows/${flow.id}.json`;
      if (s.rechazada) {
        f.add(`${label2}: acci\xF3n rechazada`, { detail: `Motivo: ${s.rechazada}.`, evidence: [{ file }] });
        f.unknown(`${label2}: no se ejecut\xF3 por los l\xEDmites \xE9ticos, as\xED que su efecto no se conoce.`);
        continue;
      }
      if (!s.ok) {
        f.add(`${label2}: no se pudo ejecutar`, { detail: s.error, confidence: "baja", evidence: [{ file }] });
        continue;
      }
      const main = s.manejadores.find((h) => h.ejecutado) ?? s.manejadores[0];
      const named = s.funciones.filter((x) => x.funcion !== "(an\xF3nima)");
      const dom = s.dom;
      const parts = [
        main ? `Manejador: ${main.donde.original ?? (main.funcion || "(an\xF3nima)")} escucha \xAB${main.evento}\xBB en ${main.nodo === "objetivo" ? "el propio elemento" : main.nodo}${main.ejecutado ? ", y se ejecut\xF3" : ""}.` : "No se encontr\xF3 un manejador registrado directamente sobre el elemento.",
        s.funciones.length ? `Funciones ejecutadas (${s.funciones.length}${s.fondo ? `, m\xE1s ${s.fondo} de fondo descartadas` : ""}): ${(named.length ? named : s.funciones).slice(0, 10).map((x) => x.donde.original ?? x.funcion).join(", ")}.` : `Ninguna funci\xF3n propia del paso se ejecut\xF3${s.fondo ? ` (solo ${s.fondo} de fondo)` : ""}.`,
        s.peticiones.length ? `Peticiones: ${s.peticiones.slice(0, 6).map((p) => `${p.metodo} ${p.url} \u2192 ${p.estado}${p.iniciador ? ` (desde ${p.iniciador})` : ""}`).join("; ")}.` : "No dispar\xF3 peticiones de datos.",
        s.mensajes.length ? `Mensajes enviados por WebSocket: ${s.mensajes.map((m) => `${m.clave} \xD7${m.veces}`).join(", ")}.` : "",
        s.trozos.length ? `C\xF3digo cargado bajo demanda: ${s.trozos.join(", ")}.` : "",
        s.rutas.length ? `Ruta: ${s.rutas.map((r) => `${r.kind} \u2192 ${r.url}`).slice(0, 3).join("; ")}.` : "",
        dom.registros ? `DOM: ${dom.anadidos.map((a) => `+${a.cantidad} ${a.nodos} en ${a.donde}`).slice(0, 5).join("; ") || "sin nodos nuevos"}; ${dom.eliminados} nodos eliminados; ${dom.atributos.length} atributos cambiados${dom.atributos.length ? ` (${dom.atributos.slice(0, 4).map((a) => `${a.objetivo}@${a.atributo}`).join(", ")})` : ""}; ${dom.textos} cambios de texto.` : "El DOM no cambi\xF3 (si la vista usa un lienzo, el cambio no es visible en el DOM)."
      ];
      const evidence = [
        ...s.manejadores.slice(0, 3).map((h) => ({ file: h.donde.file, line: h.donde.line, note: `manejador de \xAB${h.evento}\xBB: ${h.donde.note ?? ""}` })),
        ...(named.length ? named : s.funciones).slice(0, 5).map((x) => ({ file: x.donde.file, line: x.donde.line, note: `funci\xF3n ejecutada: ${x.donde.note ?? x.funcion}` })),
        ...s.peticiones.slice(0, 4).map((p) => ({ file: "network/requests.jsonl", line: p.linea, note: `${p.metodo} ${p.url}` })),
        { file },
        ...s.captura ? [{ file: s.captura }] : []
      ];
      const who = main?.ejecutado ? main.funcion || "(an\xF3nima)" : named[0]?.funcion;
      f.add(`${label2}: ${who ? `respondi\xF3 ${who}` : "sin funci\xF3n identificada"}; ${s.peticiones.length} peticiones${s.mensajes.length ? `, ${s.mensajes.reduce((n, m) => n + m.veces, 0)} mensajes WebSocket` : ""}; ${dom.registros} cambios en el DOM`, {
        detail: parts.filter(Boolean).join(" "),
        confidence: main?.ejecutado || named.length ? "alta" : "media",
        evidence
      });
      if (!s.manejadores.length && !s.funciones.length) f.unknown(`${label2}: no se identific\xF3 qu\xE9 c\xF3digo responde (puede ser comportamiento nativo, CSS o c\xF3digo en un worker).`);
    }
  }
  f.unknown("La cobertura indica qu\xE9 funciones se ejecutaron en cada paso, no su orden exacto ni los valores que manejaron. El c\xF3digo que corre en workers o WebAssembly no aparece.");
  if (flows.some((x) => x.modo === "manual")) f.unknown("En los flujos grabados a mano la atribuci\xF3n es por ventanas de tiempo (~0,3 s): los efectos de dos gestos muy seguidos pueden mezclarse.");
  return f;
}
async function act(app, actions, name = "acciones guiadas") {
  if (!Array.isArray(actions) || !actions.length) throw new Error("app_act necesita al menos una acci\xF3n.");
  if (actions.length > 25) throw new PolicyError("M\xE1ximo 25 acciones por llamada.");
  await startRecording(app, name, "guiada");
  const rec = active.get(app);
  const page = app.page;
  try {
    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];
      const mark = { action, t0: 0, t1: 0, ok: false, urlBefore: app.url(page.url()), urlAfter: "", listeners: [] };
      rec.marks.push(mark);
      const selector = "selector" in action ? action.selector : void 0;
      mark.refusal = await guard(page, action).catch(() => null) ?? void 0;
      if (!mark.refusal && action.tipo === "navegar") {
        const dest = assertAllowedUrl(new URL(action.ruta, page.url()).toString());
        if (dest.host !== app.target.host) mark.refusal = `solo se navega dentro de ${app.target.host}`;
        else if (app.meta.robots.respected && !(await checkRobots(dest)).allowed) mark.refusal = "robots.txt excluye esa ruta";
      }
      if (mark.refusal) {
        mark.t0 = mark.t1 = Date.now();
        mark.urlAfter = mark.urlBefore;
        continue;
      }
      mark.listeners = await listenersFor(app, selector, EVENTS[action.tipo] ?? []);
      await limiter.wait(app.target.host);
      await app.pump();
      mark.t0 = Date.now();
      try {
        const loc = selector ? page.locator(selector).first() : null;
        switch (action.tipo) {
          case "click":
            await loc.click({ timeout: 6e3 });
            break;
          case "escribir":
            await loc.fill("", { timeout: 6e3 });
            await loc.pressSequentially(String(action.texto).slice(0, 200), { delay: 25 });
            break;
          case "tecla":
            if (loc) await loc.press(action.tecla, { timeout: 6e3 });
            else await page.keyboard.press(action.tecla);
            break;
          case "hover":
            await loc.hover({ timeout: 6e3 });
            break;
          case "scroll":
            if (loc) await loc.scrollIntoViewIfNeeded({ timeout: 6e3 });
            else await page.mouse.wheel(0, action.y ?? 800);
            break;
          case "navegar":
            await page.goto(new URL(action.ruta, page.url()).toString(), { waitUntil: "load", timeout: 3e4 });
            break;
          case "esperar":
            await page.waitForTimeout(Math.min(Math.max(0, action.ms), 1e4));
            break;
        }
        mark.ok = true;
      } catch (e) {
        mark.error = String(e.message).split("\n")[0];
      }
      await page.waitForTimeout(450);
      await page.waitForLoadState("networkidle", { timeout: 3500 }).catch(() => {
      });
      await app.rec.settle();
      await app.pump();
      mark.t1 = Date.now();
      mark.urlAfter = app.url(page.url());
      mark.screenshot = await app.screenshot(`screenshots/flujo-${Date.now() % 1e6}-paso-${i + 1}.png`);
    }
  } catch (e) {
    await app.endCollect().catch(() => {
    });
    active.delete(app);
    throw e;
  }
  return stopRecording(app);
}

// src/core/dom.ts
function domMap(session) {
  const dom = session.readJson("dom/snapshot.json");
  const html = session.read("page.html");
  const f = new Findings("vista", "VIS");
  const at = (open, note) => ({ file: "page.html", line: lineOf(html, open) ?? lineOf(html, open.slice(0, 40)), note });
  f.add(`Documento con ${dom.counts.elements} elementos y profundidad m\xE1xima ${dom.counts.maxDepth}`, {
    detail: `${dom.counts.stylesheets} hojas de estilo, ${dom.counts.iframes} iframes, ${dom.counts.shadowHosts} ra\xEDces shadow DOM.`,
    evidence: [{ file: "dom/snapshot.json" }, { file: "page.html", line: 1 }]
  });
  if (dom.sections.length) {
    const top = dom.sections.slice(0, 12);
    f.add(`${dom.sections.length} secciones o regiones identificadas`, {
      detail: top.map((s) => `${s.role ? `${s.tag}[role=${s.role}]` : s.tag}${s.label ? ` \xAB${s.label}\xBB` : ""} \u2192 ${s.selector}`).join("; "),
      evidence: top.slice(0, 6).map((s) => at(s.open, s.selector))
    });
  } else {
    f.unknown("La p\xE1gina no usa elementos sem\xE1nticos (header, main, section\u2026): la divisi\xF3n en secciones no se pudo establecer.");
  }
  for (const form of dom.forms.slice(0, 8)) {
    const fields = form.fields.map((x) => `${x.name ?? x.id ?? x.tag}:${x.type ?? x.tag}${x.required ? "*" : ""}`).join(", ");
    f.add(`Formulario ${form.selector} (${form.method.toUpperCase()} ${form.action || "sin action"})`, {
      detail: `Campos: ${fields || "ninguno"}. Env\xEDo: ${form.submit.join(" / ") || "sin bot\xF3n"}.${form.action ? "" : " Sin atributo action: probablemente lo gestiona JavaScript."}`,
      evidence: [at(form.open, form.selector)]
    });
  }
  if (dom.buttons.length) {
    const free = dom.buttons.filter((b) => !b.inForm);
    f.add(`${dom.buttons.length} botones (${free.length} fuera de formularios)`, {
      detail: dom.buttons.slice(0, 12).map((b) => `\xAB${b.text || "sin texto"}\xBB ${b.selector}`).join("; "),
      evidence: dom.buttons.slice(0, 5).map((b) => at(b.open, b.selector))
    });
  }
  f.add(`${dom.links.total} enlaces: ${dom.links.internal} internos, ${dom.links.external} externos, ${dom.links.hashOnly} de ancla`, {
    evidence: [{ file: "dom/snapshot.json" }]
  });
  for (const r of dom.repeated.slice(0, 6)) {
    f.add(`Componente repetido: ${r.count} \xD7 <${r.item}> dentro de ${r.container}`, {
      detail: `Estructura interna de cada elemento: ${r.structure}. Patr\xF3n t\xEDpico de una lista renderizada desde datos.`,
      confidence: "media",
      evidence: [at(r.open, `primer elemento de ${r.container}`)]
    });
  }
  if (dom.customElements.length) {
    f.add(`Elementos personalizados (Web Components): ${dom.customElements.join(", ")}`, { confidence: "media", evidence: [{ file: "dom/snapshot.json" }] });
  }
  const a = dom.a11y;
  const issues = [];
  const ev = [];
  if (!a.lang) issues.push("falta el atributo lang en <html>");
  if (!a.hasMain) issues.push("no hay regi\xF3n <main>");
  if (a.h1Count !== 1) issues.push(`${a.h1Count} encabezados h1 (se espera 1)`);
  if (a.headingSkips) issues.push(`${a.headingSkips} saltos de nivel entre encabezados`);
  if (a.imagesWithoutAltCount) {
    issues.push(`${a.imagesWithoutAltCount} de ${a.imagesTotal} im\xE1genes sin alt`);
    ev.push(...a.imagesWithoutAlt.slice(0, 3).map((i) => at(i.open, `imagen sin alt: ${i.selector}`)));
  }
  if (a.inputsWithoutLabel.length) {
    issues.push(`${a.inputsWithoutLabel.length} campos sin etiqueta`);
    ev.push(...a.inputsWithoutLabel.slice(0, 3).map((i) => at(i.open, `campo sin etiqueta: ${i.selector}`)));
  }
  if (a.buttonsWithoutName.length) {
    issues.push(`${a.buttonsWithoutName.length} controles sin nombre accesible`);
    ev.push(...a.buttonsWithoutName.slice(0, 3).map((i) => at(i.open, `sin nombre accesible: ${i.selector}`)));
  }
  if (a.duplicateIds.length) issues.push(`ids duplicados: ${a.duplicateIds.join(", ")}`);
  if (a.positiveTabindex) issues.push(`${a.positiveTabindex} elementos con tabindex positivo`);
  f.add(issues.length ? `Accesibilidad b\xE1sica: ${issues.length} observaciones` : "Accesibilidad b\xE1sica: sin observaciones en las comprobaciones autom\xE1ticas", {
    detail: `${issues.join("; ") || "lang, main, h1, alt, etiquetas y nombres accesibles correctos"}. Idioma declarado: ${a.lang || "ninguno"}; ${a.ariaAttributes} elementos con atributos ARIA o role.`,
    evidence: ev.length ? ev : [{ file: "dom/snapshot.json" }]
  });
  f.unknown("La accesibilidad se revis\xF3 con comprobaciones est\xE1ticas b\xE1sicas; contraste, orden de foco y lectores de pantalla no se evaluaron.");
  if (dom.counts.shadowHosts) f.unknown(`Hay ${dom.counts.shadowHosts} ra\xEDces shadow DOM cuyo contenido interno no se recorri\xF3.`);
  if (dom.counts.iframes) f.unknown(`El contenido de los ${dom.counts.iframes} iframes (${[...new Set(dom.iframes)].join(", ")}) no se analiz\xF3.`);
  return session.saveResult({ tool: "app_view", session: session.dir, findings: f.list, unknowns: f.unknowns, files: ["dom/snapshot.json", "page.html"], data: dom });
}

// src/core/network.ts
var THIRD_PARTY = [
  [/google-analytics\.com|analytics\.google\.com|googletagmanager\.com|plausible\.io|matomo|mixpanel\.com|amplitude\.com|segment\.(io|com)|hotjar\.com|clarity\.ms|heap(analytics)?\.|posthog\.com|fullstory\.com/, "anal\xEDtica"],
  [/doubleclick\.net|googlesyndication\.com|adservice\.google|facebook\.net|facebook\.com\/tr|ads-twitter\.com|criteo\.|taboola\.|outbrain\./, "publicidad"],
  [/fonts\.googleapis\.com|fonts\.gstatic\.com|use\.typekit\.net|fonts\.bunny\.net/, "fuentes"],
  [/cdnjs\.cloudflare\.com|cdn\.jsdelivr\.net|unpkg\.com|ajax\.googleapis\.com|code\.jquery\.com|cdn\.tailwindcss\.com|esm\.sh/, "CDN de librer\xEDas"],
  [/cloudfront\.net|akamai(hd|zed)?\.net|fastly\.net|cloudflare\.com|azureedge\.net|cdn\./, "CDN"],
  [/sentry\.io|bugsnag\.com|datadoghq\.|newrelic\.com|nr-data\.net|logrocket\./, "monitoreo de errores"],
  [/stripe\.com|paypal\.com|adyen\.com|braintreegateway\.com|mercadopago\./, "pagos"],
  [/recaptcha|hcaptcha\.com|challenges\.cloudflare\.com/, "anti-bot / CAPTCHA"],
  [/youtube\.com|ytimg\.com|vimeo\.com|player\./, "v\xEDdeo"],
  [/intercom\.io|zendesk\.com|crisp\.chat|tawk\.to|hubspot\.com|drift\.com/, "chat / soporte"],
  [/auth0\.com|okta\.com|accounts\.google\.com|firebaseapp\.com|cognito|clerk\./, "identidad"],
  [/algolia\.(net|com)|algolianet\.com|typesense\./, "b\xFAsqueda"]
];
function categorize(host) {
  for (const [re, name] of THIRD_PARTY) if (re.test(host)) return name;
  return "otro";
}
function templatePath(pathname) {
  return pathname.split("/").map((seg) => {
    if (/^\d+$/.test(seg) || /^#+$/.test(seg)) return ":id";
    if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(seg)) return ":uuid";
    if (/^[0-9a-f]{16,}$/i.test(seg) || /^[A-Za-z0-9_-]{22,}$/.test(seg) && /\d/.test(seg)) return ":hash";
    return seg;
  }).join("/") || "/";
}
function isApiCall(e) {
  if (e.failed) return false;
  if (e.resourceType === "xhr" || e.resourceType === "fetch" || e.resourceType === "eventsource") return true;
  if (e.method !== "GET" && e.resourceType !== "ping") return true;
  return e.resourceType !== "script" && /json/i.test(e.mime);
}
function networkAnalysis(session, extra = []) {
  const entries = [...session.readJsonl("network/requests.jsonl"), ...extra];
  const websockets = session.exists("network/websockets.json") ? session.readJson("network/websockets.json") : [];
  const f = new Findings("api", "API");
  const FILE = "network/requests.jsonl";
  const locator = new SourceLocator(session);
  const map = /* @__PURE__ */ new Map();
  const graphql = [];
  entries.forEach((e, i) => {
    const line = i + 1;
    if (!isApiCall(e)) return;
    let u;
    try {
      u = new URL(e.url);
    } catch {
      return;
    }
    if (e.reqBody?.graphql) graphql.push({ ...e.reqBody.graphql, url: u.origin + u.pathname, linea: line });
    const ruta = templatePath(u.pathname);
    const key = `${e.method} ${u.origin}${ruta}`;
    let ep = map.get(key);
    if (!ep) {
      ep = { metodo: e.method, origen: u.origin, ruta, terceros: e.thirdParty, llamadas: 0, estados: [], mime: e.mime, parametros: {}, auth: [], vistas: [], lineas: [] };
      map.set(key, ep);
    }
    ep.llamadas++;
    if (!ep.estados.includes(e.status)) ep.estados.push(e.status);
    Object.assign(ep.parametros, e.query);
    if (ep.lineas.length < 5) ep.lineas.push(line);
    for (const a of e.auth ?? []) if (!ep.auth.includes(a)) ep.auth.push(a);
    if (e.from && !ep.vistas.includes(e.from) && ep.vistas.length < 8) ep.vistas.push(e.from);
    if (e.reqBody && !ep.cuerpo) {
      ep.cuerpo = e.reqBody.schema ? schemaToText(e.reqBody.schema) : e.reqBody.params ? `formulario(${e.reqBody.params.join(", ")})` : `${e.reqBody.kind}(${e.reqBody.length} caracteres)`;
    }
    if (e.resSchema) {
      ep.respuestaEsquema = ep.respuestaEsquema ? mergeSchemas(ep.respuestaEsquema, e.resSchema) : e.resSchema;
      ep.respuesta = schemaToText(ep.respuestaEsquema);
    }
    if (e.initiator && !ep.iniciador) {
      ep.iniciador = { fn: e.initiator.fn, url: e.initiator.url, line: e.initiator.line, column: e.initiator.column };
      const where = locator.locate(e.initiator, true);
      if (where.original) {
        ep.iniciadorOriginal = where.original;
        ep.iniciadorArchivo = { file: where.file, line: where.line };
      }
    }
  });
  const endpoints = [...map.values()].sort((a, b) => Number(a.terceros) - Number(b.terceros) || a.ruta.localeCompare(b.ruta));
  const own = endpoints.filter((e) => !e.terceros);
  for (const ep of own.slice(0, 20)) {
    const params = Object.entries(ep.parametros).map(([k, v]) => `${k}: ${v}`).join(", ");
    f.add(`Endpoint ${ep.metodo} ${ep.ruta} \u2192 ${ep.estados.join("/")} ${ep.mime || ""}`.trim(), {
      detail: [
        `${ep.llamadas} llamada(s) a ${ep.origen}.`,
        params ? `Par\xE1metros de consulta: ${params}.` : "",
        ep.cuerpo ? `Cuerpo enviado: ${ep.cuerpo.replace(/\s+/g, " ")}.` : "",
        ep.respuesta ? `Forma de la respuesta: ${ep.respuesta.replace(/\s+/g, " ")}.` : "",
        ep.auth.length ? `Autenticaci\xF3n: ${ep.auth.join(", ")}.` : "",
        ep.vistas.length ? `Se llama desde: ${ep.vistas.join(", ")}.` : "",
        ep.iniciador ? `Lo dispara ${ep.iniciadorOriginal ?? `${ep.iniciador.fn} en ${ep.iniciador.url}:${ep.iniciador.line}`}.` : ""
      ].filter(Boolean).join(" "),
      evidence: [...ep.lineas.map((line) => ({ file: FILE, line })), ...ep.iniciadorArchivo ? [{ ...ep.iniciadorArchivo, note: `origen de la llamada: ${ep.iniciadorOriginal}` }] : []]
    });
  }
  if (!own.length) f.unknown("No se observaron llamadas a API propias hasta ahora: los datos vienen en el HTML inicial, por WebSocket, o se piden solo tras interactuar (usa app_act o app_record).");
  const seenOps = /* @__PURE__ */ new Set();
  for (const op of graphql) {
    const key = `${op.type} ${op.name}`;
    if (seenOps.has(key)) continue;
    seenOps.add(key);
    f.add(`GraphQL ${op.type} \xAB${op.name}\xBB en ${op.url}`, {
      detail: `Variables: ${op.variables.join(", ") || "ninguna"}. Consulta: ${op.query.replace(/\s+/g, " ").slice(0, 300)}`,
      evidence: [{ file: FILE, line: op.linea }]
    });
  }
  for (const ws of websockets) {
    f.add(`WebSocket ${ws.url}: ${ws.sent} mensajes enviados, ${ws.received} recibidos`, {
      detail: `Entramado ${ws.protocol || "desconocido"}; ${ws.groups.length} tipos de mensaje. El detalle del protocolo est\xE1 en app_realtime.`,
      evidence: [{ file: "network/websockets.json" }]
    });
  }
  const hosts = /* @__PURE__ */ new Map();
  entries.forEach((e, i) => {
    if (!e.thirdParty) return;
    try {
      const host = new URL(e.url).host;
      const h = hosts.get(host) ?? { n: 0, tipos: /* @__PURE__ */ new Set(), line: i + 1 };
      h.n++;
      h.tipos.add(e.resourceType);
      hosts.set(host, h);
    } catch {
    }
  });
  const terceros = [...hosts].map(([host, h]) => ({ host, categoria: categorize(host), peticiones: h.n, tipos: [...h.tipos] })).sort((a, b) => b.peticiones - a.peticiones);
  if (terceros.length) {
    f.add(`Llamadas a ${terceros.length} dominios de terceros`, {
      detail: terceros.slice(0, 20).map((t) => `${t.host} (${t.categoria}, ${t.peticiones})`).join("; "),
      evidence: [...hosts.values()].slice(0, 6).map((h) => ({ file: FILE, line: h.line }))
    });
  } else {
    f.add("Sin llamadas a dominios de terceros durante la captura", { evidence: [{ file: FILE }] });
  }
  const byType = /* @__PURE__ */ new Map();
  for (const e of entries) {
    const t = byType.get(e.resourceType) ?? { n: 0, bytes: 0 };
    t.n++;
    t.bytes += e.size;
    byType.set(e.resourceType, t);
  }
  const recursos = [...byType].map(([tipo, t]) => ({ tipo, peticiones: t.n, bytes: t.bytes })).sort((a, b) => b.bytes - a.bytes);
  const fallidas = entries.flatMap((e, i) => e.failed || e.status >= 400 ? [{ url: e.url, error: e.failed ?? `HTTP ${e.status}`, linea: i + 1 }] : []);
  if (fallidas.length) {
    f.add(`${fallidas.length} peticiones fallidas o con error HTTP`, {
      detail: fallidas.slice(0, 8).map((x) => `${x.error} ${x.url}`).join("; "),
      evidence: fallidas.slice(0, 6).map((x) => ({ file: FILE, line: x.linea }))
    });
  }
  f.unknown("Los esquemas se infieren de las respuestas observadas: campos opcionales, paginaci\xF3n y errores no vistos pueden faltar.");
  f.unknown("No se conoce la l\xF3gica del servidor (validaci\xF3n, autorizaci\xF3n, l\xEDmites): solo su comportamiento visible desde el navegador.");
  if (own.some((e) => e.estados.some((s) => s === 401 || s === 403))) f.unknown("Hay endpoints que respondieron 401/403: requieren una sesi\xF3n que la herramienta no intenta obtener.");
  const data = { endpoints, graphql, websockets, terceros, recursos, fallidas };
  return session.saveResult({ tool: "app_api", session: session.dir, findings: f.list, unknowns: f.unknowns, files: [FILE, "network/websockets.json", "captura.har"], data });
}

// src/core/storage.ts
function storageAnalysis(session) {
  const FILE = "storage/snapshot.json";
  const s = session.readJson(FILE);
  const f = new Findings("almacenamiento", "ALM");
  const ev = [{ file: FILE }];
  const kv = (list) => list.map((e) => `${e.clave} (${e.tipo}, ${e.longitud} car.${e.sensible ? ", sensible" : ""})`).join("; ");
  if (s.cookies.length) {
    f.add(`${s.cookies.length} cookies`, {
      detail: s.cookies.map((c) => `${c.nombre} [${c.dominio}; ${c.tipo}, ${c.longitud} car.; ${c.httpOnly ? "HttpOnly" : "legible por JS"}; ${c.secure ? "Secure" : "sin Secure"}; SameSite=${c.sameSite}; ${c.persistente ? `caduca en ${c.caducaEnDias} d\xEDas` : "de sesi\xF3n"}]`).join("; "),
      evidence: ev
    });
    const weak = s.cookies.filter((c) => c.sensible && (!c.httpOnly || !c.secure));
    if (weak.length) {
      f.add(`${weak.length} cookie(s) con nombre sensible sin HttpOnly o sin Secure`, { detail: weak.map((c) => c.nombre).join(", "), confidence: "media", evidence: ev });
    }
  } else {
    f.add("La p\xE1gina no estableci\xF3 cookies durante la captura", { evidence: ev });
  }
  if (s.localStorage.length) f.add(`localStorage: ${s.localStorage.length} claves`, { detail: kv(s.localStorage), evidence: ev });
  if (s.sessionStorage.length) f.add(`sessionStorage: ${s.sessionStorage.length} claves`, { detail: kv(s.sessionStorage), evidence: ev });
  const tokens = [...s.localStorage, ...s.sessionStorage].filter((e) => e.sensible);
  if (tokens.length) {
    f.add(`${tokens.length} clave(s) de aspecto sensible en almacenamiento accesible por JavaScript`, {
      detail: `${tokens.map((t) => `${t.clave} (${t.tipo})`).join(", ")}. Cualquier script de la p\xE1gina puede leerlas.`,
      confidence: "media",
      evidence: ev
    });
  }
  for (const db of s.indexedDB) {
    f.add(`IndexedDB \xAB${db.name}\xBB v${db.version}: ${db.stores.length} almacenes`, {
      detail: db.stores.map((st) => `${st.name} [clave: ${st.keyPath || "(externa)"}${st.autoIncrement ? ", autoincremental" : ""}; \xEDndices: ${st.indexes.join(", ") || "ninguno"}; ${st.count} registros]`).join("; "),
      evidence: ev
    });
  }
  if (s.cacheStorage.length) f.add(`Cache Storage: ${s.cacheStorage.join(", ")}`, { evidence: ev });
  if (!s.localStorage.length && !s.sessionStorage.length && !s.indexedDB.length) {
    f.add("Sin datos en localStorage, sessionStorage ni IndexedDB tras la carga", { evidence: ev });
  }
  f.unknown("Los valores est\xE1n enmascarados a prop\xF3sito: solo se conocen nombres, tipos y longitudes.");
  f.unknown("Solo se ve el almacenamiento tras la carga inicial; lo que se escribe al iniciar sesi\xF3n o interactuar no aparece.");
  return session.saveResult({ tool: "app_storage", session: session.dir, findings: f.list, unknowns: f.unknowns, files: [FILE], data: s });
}

// src/core/stack.ts
var CDN_HEADERS = [
  ["cf-ray", null, "Cloudflare"],
  ["x-vercel-id", null, "Vercel"],
  ["x-nf-request-id", null, "Netlify"],
  ["x-amz-cf-id", null, "Amazon CloudFront"],
  ["x-served-by", /cache-/, "Fastly"],
  ["x-fastly-request-id", null, "Fastly"],
  ["x-akamai-transformed", null, "Akamai"],
  ["x-azure-ref", null, "Azure Front Door"],
  ["x-github-request-id", null, "GitHub Pages"],
  ["fly-request-id", null, "Fly.io"],
  ["x-render-origin-server", null, "Render"],
  ["server", /cloudflare/i, "Cloudflare"],
  ["server", /akamai/i, "Akamai"],
  ["server", /vercel/i, "Vercel"],
  ["server", /netlify/i, "Netlify"],
  ["via", /cloudfront/i, "Amazon CloudFront"],
  ["via", /varnish/i, "Varnish"]
];
var SECURITY = [
  ["content-security-policy", "limita de d\xF3nde se cargan scripts y recursos"],
  ["strict-transport-security", "fuerza HTTPS (HSTS)"],
  ["x-content-type-options", "evita la detecci\xF3n autom\xE1tica de tipo MIME"],
  ["x-frame-options", "evita que la p\xE1gina se incruste en iframes ajenos"],
  ["referrer-policy", "controla qu\xE9 referente se env\xEDa"],
  ["permissions-policy", "restringe APIs del navegador"],
  ["cross-origin-opener-policy", "a\xEDsla la ventana de otros or\xEDgenes"],
  ["cross-origin-resource-policy", "limita qui\xE9n puede cargar los recursos"]
];
function stackAnalysis(session) {
  const meta = session.readJson("capture.json");
  const entries = session.readJsonl("network/requests.jsonl");
  const dom = session.readJson("dom/snapshot.json");
  const probes = session.readJson("stack/probes.json");
  const scripts = session.loadResult("app_scripts");
  const net = session.loadResult("app_api") ?? networkAnalysis(session);
  const f = new Findings("stack", "STK");
  const FILE = "network/requests.jsonl";
  const docIndex = Math.max(0, entries.findIndex((e) => e.resourceType === "document" && e.status >= 200 && e.status < 300));
  const doc = entries[docIndex];
  const h = doc?.resHeaders ?? {};
  const docEv = [{ file: FILE, line: docIndex + 1, note: "cabeceras del documento principal" }];
  const tecnologias = scripts ? scripts.data.detectado : Object.entries(probes.found).map(([nombre, v]) => ({ nombre, tipo: "detectado", version: typeof v === "string" ? v : void 0, via: "tiempo de ejecuci\xF3n" }));
  if (tecnologias.length) {
    f.add(`Tecnolog\xEDas de cliente: ${tecnologias.map((t) => `${t.nombre}${t.version ? ` ${t.version}` : ""}`).join(", ")}`, {
      detail: scripts ? "Detalle y evidencia por librer\xEDa en los hallazgos de app_scripts." : "Solo se\xF1ales en tiempo de ejecuci\xF3n; ejecuta app_scripts para el an\xE1lisis de contenido.",
      evidence: [{ file: "stack/probes.json" }, ...scripts ? [{ file: "analysis/app_scripts.json" }] : []]
    });
  } else {
    f.unknown("No se identific\xF3 el framework de cliente.");
  }
  if (probes.generator || dom.meta.generator) {
    f.add(`Generador declarado: ${probes.generator || dom.meta.generator}`, { evidence: [{ file: "stack/probes.json" }] });
  }
  if (probes.serviceWorker || probes.manifest) {
    f.add(`PWA: ${[probes.serviceWorker ? "service worker activo" : "", probes.manifest ? "manifiesto web" : ""].filter(Boolean).join(" y ")}`, { evidence: [{ file: "stack/probes.json" }] });
  }
  const servidor = {};
  for (const k of ["server", "x-powered-by", "x-generator", "x-aspnet-version", "x-drupal-cache", "x-shopify-stage", "content-encoding", "cache-control", "alt-svc"]) if (h[k]) servidor[k] = h[k];
  if (Object.keys(servidor).length) {
    f.add(`Servidor: ${servidor["server"] ?? "no declarado"}${servidor["x-powered-by"] ? ` (${servidor["x-powered-by"]})` : ""}`, {
      detail: Object.entries(servidor).map(([k, v]) => `${k}: ${v}`).join("; "),
      evidence: docEv
    });
  } else {
    f.unknown("El servidor no declara su tecnolog\xEDa en las cabeceras.");
  }
  const cdn = /* @__PURE__ */ new Set();
  for (const [name, re, label2] of CDN_HEADERS) if (h[name] && (!re || re.test(h[name]))) cdn.add(label2);
  for (const t of net.data.terceros) if (t.categoria === "CDN" || t.categoria === "CDN de librer\xEDas") cdn.add(t.host);
  if (cdn.size) f.add(`CDN / alojamiento: ${[...cdn].join(", ")}`, { confidence: "media", evidence: docEv });
  else f.unknown("No se identific\xF3 CDN ni proveedor de alojamiento por las cabeceras.");
  const analitica = /* @__PURE__ */ new Set();
  for (const t of net.data.terceros) if (["anal\xEDtica", "publicidad", "monitoreo de errores"].includes(t.categoria)) analitica.add(`${t.host} (${t.categoria})`);
  for (const t of tecnologias) if (t.tipo === "anal\xEDtica") analitica.add(t.nombre);
  f.add(analitica.size ? `Anal\xEDtica y seguimiento: ${[...analitica].join(", ")}` : "Sin anal\xEDtica ni seguimiento de terceros observados", {
    evidence: [{ file: "analysis/app_api.json" }, { file: "stack/probes.json" }]
  });
  const seguridad = SECURITY.map(([cabecera, nota]) => ({ cabecera, presente: !!h[cabecera], valor: h[cabecera]?.slice(0, 200), nota }));
  const missing = seguridad.filter((s) => !s.presente);
  const isHttps = meta.finalUrl.startsWith("https:");
  f.add(`Cabeceras de seguridad: ${seguridad.length - missing.length} de ${seguridad.length} presentes`, {
    detail: `Presentes: ${seguridad.filter((s) => s.presente).map((s) => s.cabecera).join(", ") || "ninguna"}. Ausentes: ${missing.map((s) => s.cabecera).join(", ") || "ninguna"}.${isHttps ? "" : " La p\xE1gina se sirve por HTTP sin cifrar."}`,
    evidence: docEv
  });
  f.unknown("El stack de servidor (lenguaje, base de datos, infraestructura) solo se infiere de cabeceras y puede estar oculto o falseado.");
  const data = { tecnologias, servidor, cdn: [...cdn], analitica: [...analitica], seguridad };
  return session.saveResult({ tool: "app_stack", session: session.dir, findings: f.list, unknowns: f.unknowns, files: ["stack/probes.json", FILE], data });
}

// src/core/appmap.ts
var REQ = "network/requests.jsonl";
var HOOKS = "runtime/hooks.json";
function load(session) {
  return {
    meta: session.readJson("capture.json"),
    entries: session.readJsonl(REQ),
    runtime: session.exists(HOOKS) ? session.readJson(HOOKS) : { routes: [], wasm: [], workers: [], canvas: [], eventSources: [], sse: {}, apis: {} },
    views: session.exists("views/index.json") ? session.readJson("views/index.json") : [],
    websockets: session.exists("network/websockets.json") ? session.readJson("network/websockets.json") : []
  };
}
var size = (bytes) => bytes < 2048 ? `${bytes} bytes` : `${Math.round(bytes / 1024)} KB`;
var pathOf = (url) => {
  try {
    const u = new URL(url);
    return u.pathname + u.hash;
  } catch {
    return url;
  }
};
function readableSources(session) {
  if (!session.exists("sources/index.json")) return [];
  const index = session.readJson("sources/index.json");
  const out = [];
  for (const info of Object.values(index)) {
    if (info.dir) out.push(...listFiles(session, info.dir).slice(0, 400));
    else out.push(info.readable);
  }
  return [...new Set(out)].slice(0, 1200);
}
function routesAnalysis(session) {
  const { entries, runtime, views } = load(session);
  const f = new Findings("rutas", "RUT");
  const visited = /* @__PURE__ */ new Map();
  for (const r of runtime.routes) {
    const ruta = templatePath(pathOf(r.url).replace(/\?.*$/, ""));
    const v = visited.get(ruta) ?? { ruta, veces: 0, via: /* @__PURE__ */ new Set() };
    v.veces++;
    v.via.add(r.kind);
    visited.set(ruta, v);
  }
  const visitadas = [...visited.values()].map((v) => ({ ruta: v.ruta, veces: v.veces, via: [...v.via] }));
  const kinds = new Set(runtime.routes.map((r) => r.kind));
  const docs = entries.filter((e) => e.resourceType === "document" && !e.thirdParty && e.status < 400).length;
  const spa = kinds.has("pushState") || kinds.has("replaceState") || kinds.has("popstate");
  const hash = kinds.has("hashchange");
  const enrutador = spa ? "History API (pushState): navegaci\xF3n sin recargar la p\xE1gina" : hash ? "hash (#/ruta): navegaci\xF3n sin recargar la p\xE1gina" : docs > 1 ? "navegaci\xF3n cl\xE1sica: cada vista es un documento nuevo" : "no determinado: solo se ha visto una ruta";
  f.add(`Enrutado: ${enrutador}`, {
    detail: `${visitadas.length} ruta(s) distintas visitadas; ${docs} documento(s) HTML cargados. ${visitadas.slice(0, 15).map((v) => `${v.ruta} (${v.via.join("/")})`).join(", ")}`,
    confidence: spa || hash || docs > 1 ? "alta" : "baja",
    evidence: [{ file: HOOKS }, { file: REQ }]
  });
  if (views.length) {
    f.add(`${views.length} vista(s) registradas`, {
      detail: views.map((v) => `${v.n}. ${v.name} \u2192 ${v.route} (${v.elements} elementos, ${v.forms} formularios, ${v.canvases} lienzos${v.private ? ", privada" : ""})`).join("; "),
      evidence: views.slice(0, 6).map((v) => ({ file: `${v.dir}/dom.json`, note: v.route }))
    });
  }
  const declared = /* @__PURE__ */ new Map();
  const patterns = [/\b\w*(?:[Rr]oute|[Rr]uta|[Pp]ath)\w*\(\s*["'`](\/[\w/:.*-]*)["'`]/g, /\bpath\s*:\s*["'`](\/[^"'`\s]*)["'`]/g, /<Route[^>]*\spath=["'{]+(\/[^"'}\s]*)/g, /\b(?:navigate|navegar|push|replace|redirect|goto)\(\s*["'`](\/[\w/:.-]*)["'`]/g, /\bto\s*[:=]\s*["'`{]+(\/[\w/:.-]*)["'`]/g];
  for (const file of readableSources(session)) {
    if (declared.size >= 120) break;
    const lines = session.read(file).split("\n");
    for (let i = 0; i < lines.length && declared.size < 120; i++) {
      if (lines[i].length > 600) continue;
      for (const re of patterns) {
        re.lastIndex = 0;
        let m;
        while (m = re.exec(lines[i])) if (m[1].length > 1 && !m[1].endsWith("/") && !/\.(js|css|png|svg|json|ico|wasm)$/.test(m[1]) && !declared.has(m[1])) declared.set(m[1], { ruta: m[1], archivo: file, linea: i + 1 });
      }
    }
  }
  const declaradas = [...declared.values()];
  if (declaradas.length) {
    const seenPaths = runtime.routes.map((r) => pathOf(r.url).replace(/[?#].*$/, ""));
    const matches = (pattern) => {
      const re = new RegExp("^" + pattern.split(/(:\w+|\*)/).map((part) => part.startsWith(":") ? "[^/]+" : part === "*" ? ".*" : part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("") + "/?$");
      return seenPaths.some((p) => re.test(p));
    };
    const unseen = declaradas.filter((d) => !matches(d.ruta));
    f.add(`${declaradas.length} ruta(s) declaradas en el c\xF3digo`, {
      detail: `${declaradas.slice(0, 30).map((d) => d.ruta).join(", ")}.${unseen.length ? ` No visitadas todav\xEDa: ${unseen.slice(0, 15).map((d) => d.ruta).join(", ")}.` : ""}`,
      confidence: "media",
      evidence: declaradas.slice(0, 8).map((d) => ({ file: d.archivo, line: d.linea, note: d.ruta }))
    });
    if (unseen.length) f.unknown(`${unseen.length} ruta(s) aparecen en el c\xF3digo pero no se visitaron: su vista y sus datos no est\xE1n analizados.`);
  } else {
    f.unknown("No se encontraron rutas declaradas en el c\xF3digo legible (ejecuta app_scripts, o el enrutador las define de otra forma).");
  }
  const firstNav = runtime.routes.find((r) => r.kind !== "carga")?.t ?? Infinity;
  const lazy = /* @__PURE__ */ new Map();
  const lazyEv = [];
  entries.forEach((e, i) => {
    if (e.resourceType !== "script" || e.thirdParty || e.t < firstNav) return;
    const set = lazy.get(e.from) ?? /* @__PURE__ */ new Set();
    set.add(e.url.split("/").pop() ?? e.url);
    lazy.set(e.from, set);
    if (lazyEv.length < 6) lazyEv.push({ file: REQ, line: i + 1, note: `cargado desde ${e.from}` });
  });
  const cargaDiferida = [...lazy].map(([ruta, s]) => ({ ruta, scripts: [...s] }));
  if (cargaDiferida.length) {
    f.add(`Carga diferida de c\xF3digo en ${cargaDiferida.length} ruta(s)`, {
      detail: cargaDiferida.map((c) => `${c.ruta}: ${c.scripts.join(", ")}`).join("; "),
      evidence: lazyEv
    });
  }
  f.unknown("Las rutas que exigen permisos, par\xE1metros concretos o datos que esta cuenta no tiene pueden existir sin haberse visto.");
  return session.saveResult({ tool: "app_routes", session: session.dir, findings: f.list, unknowns: f.unknowns, files: [HOOKS, "views/index.json"], data: { enrutador, visitadas, declaradas, vistas: views, cargaDiferida } });
}
var rate = (g) => {
  const span = (g.last - g.first) / 1e3;
  return g.count > 2 && span > 0.5 ? `${(g.count / span).toFixed(1)}/s` : `${g.count}`;
};
function realtimeAnalysis(session) {
  const { entries, runtime, websockets } = load(session);
  const f = new Findings("tiemporeal", "TRE");
  const WS = "network/websockets.json";
  const now = Date.now();
  const wsData = [];
  for (const ws of websockets) {
    const { sentLog: _log, ...rest } = ws;
    const duracionS = Math.round(((ws.closed ?? now) - ws.opened) / 1e3);
    const beats = ws.groups.filter((g) => HEARTBEAT.test(g.key));
    const beat = beats[0];
    const latido = beat && beat.count > 1 ? `${beat.key} cada ~${((beat.last - beat.first) / 1e3 / (beat.count - 1)).toFixed(1)} s` : beat ? beat.key : void 0;
    wsData.push({ ...rest, duracionS, latido });
    const top = (dir) => ws.groups.filter((g) => g.dir === dir && !HEARTBEAT.test(g.key)).sort((a, b) => b.count - a.count).slice(0, 10);
    f.add(`WebSocket ${ws.url}: entramado ${ws.protocol || "desconocido"}, ${ws.sent} mensajes enviados y ${ws.received} recibidos en ${duracionS} s`, {
      detail: [
        `Tipos que env\xEDa el cliente: ${top("enviado").map((g) => `${g.key} (${g.count})`).join(", ") || "ninguno"}.`,
        `Tipos que env\xEDa el servidor: ${top("recibido").map((g) => `${g.key} (${rate(g)})`).join(", ") || "ninguno"}.`,
        latido ? `Latido: ${latido}.` : "No se identific\xF3 latido (ping/pong) a nivel de aplicaci\xF3n.",
        ws.closed ? "La conexi\xF3n se cerr\xF3 durante la sesi\xF3n." : "La conexi\xF3n segu\xEDa abierta."
      ].join(" "),
      evidence: [{ file: WS }]
    });
    for (const g of [...top("recibido").slice(0, 5), ...top("enviado").slice(0, 5)]) {
      f.add(`Mensaje ${g.dir} \xAB${g.key}\xBB: ${g.count} veces${g.dir === "recibido" && g.count > 2 ? ` (${rate(g)})` : ""}`, {
        detail: `Forma: ${g.shape}. Tama\xF1o medio ${Math.round(g.bytes / g.count)} bytes.`,
        evidence: [{ file: WS }]
      });
    }
    if (ws.protocol === "binario") f.unknown(`El WebSocket ${ws.url} usa mensajes binarios (protobuf, MessagePack u otro formato): solo se conocen tama\xF1os y frecuencias, no el contenido.`);
  }
  const esUrls = [.../* @__PURE__ */ new Set([...runtime.eventSources.map((e) => e.url), ...entries.filter((e) => e.resourceType === "eventsource" || /event-stream/.test(e.mime)).map((e) => e.url)])];
  if (esUrls.length) {
    f.add(`Server-Sent Events: ${esUrls.length} flujo(s)`, {
      detail: `${esUrls.join(", ")}. Eventos recibidos por tipo: ${Object.entries(runtime.sse).map(([k, v]) => `${k} (${v})`).join(", ") || "ninguno registrado"}.`,
      evidence: [{ file: HOOKS }, { file: REQ }]
    });
  }
  const calls = /* @__PURE__ */ new Map();
  entries.forEach((e, i) => {
    if (e.resourceType !== "xhr" && e.resourceType !== "fetch") return;
    try {
      const u = new URL(e.url);
      const key = `${e.method} ${u.origin}${templatePath(u.pathname)}`;
      const c = calls.get(key) ?? { times: [], line: i + 1 };
      c.times.push(e.t);
      calls.set(key, c);
    } catch {
    }
  });
  const sondeo = [];
  for (const [endpoint, c] of calls) {
    if (c.times.length < 4) continue;
    const gaps = c.times.slice(1).map((t, i) => t - c.times[i]);
    const mean = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    const dev = Math.sqrt(gaps.reduce((a, b) => a + (b - mean) ** 2, 0) / gaps.length);
    if (mean > 400 && dev / mean < 0.35) {
      sondeo.push({ endpoint, llamadas: c.times.length, cadaS: Math.round(mean / 100) / 10 });
      f.add(`Sondeo peri\xF3dico: ${endpoint} cada ~${(mean / 1e3).toFixed(1)} s`, { detail: `${c.times.length} llamadas a intervalos regulares.`, confidence: "media", evidence: [{ file: REQ, line: c.line }] });
    }
  }
  if (!websockets.length && !esUrls.length && !sondeo.length) {
    f.add("Sin canales en tiempo real observados (ni WebSocket, ni SSE, ni sondeo)", { evidence: [{ file: WS }, { file: REQ }] });
  }
  f.unknown("Solo se ven los tipos de mensaje que circularon durante la sesi\xF3n; el protocolo puede tener m\xE1s. El significado de cada campo se infiere de su nombre y forma.");
  if (runtime.apis?.RTCPeerConnection) f.unknown("La aplicaci\xF3n abre conexiones WebRTC, cuyo tr\xE1fico no pasa por el registro de red.");
  return session.saveResult({ tool: "app_realtime", session: session.dir, findings: f.list, unknowns: f.unknowns, files: [WS], data: { websockets: wsData, sse: { urls: esUrls, eventos: runtime.sse ?? {} }, sondeo } });
}
function stateAnalysis(session) {
  const FILE = "state/snapshot.json";
  const s = session.exists(FILE) ? session.readJson(FILE) : { stores: [], globals: [], hints: [] };
  const f = new Findings("estado", "EST");
  const ev = [{ file: FILE }];
  const flat = (shape) => JSON.stringify(shape).replace(/"/g, "").slice(0, 700);
  for (const st of s.stores) {
    const keys = st.shape && typeof st.shape === "object" && !Array.isArray(st.shape) ? Object.keys(st.shape) : [];
    f.add(`Almac\xE9n de estado ${st.kind} (${st.via})${keys.length ? `: ${keys.length} secciones` : ""}`, {
      detail: `${keys.length ? `Secciones: ${keys.join(", ")}. ` : ""}Forma: ${flat(st.shape)}${st.note ? `. ${st.note}` : ""}`,
      evidence: ev
    });
  }
  if (!s.stores.length) {
    f.unknown("No se localiz\xF3 un almac\xE9n de estado accesible (Redux, Pinia, Vuex, Apollo, TanStack Query). El estado puede vivir en componentes, en cierres (Zustand, signals) o en servicios, que no se pueden inspeccionar desde fuera.");
  }
  const objects = s.globals.filter((g) => g.type === "objeto" || g.type === "arreglo");
  if (s.globals.length) {
    f.add(`${s.globals.length} globales a\xF1adidos a window por la aplicaci\xF3n`, {
      detail: `Objetos: ${objects.slice(0, 25).map((g) => g.name).join(", ") || "ninguno"}. Funciones y valores: ${s.globals.filter((g) => !objects.includes(g)).slice(0, 25).map((g) => g.name).join(", ") || "ninguno"}.`,
      evidence: ev
    });
  }
  const config = objects.filter((g) => /config|settings|env|initial|state|data|bootstrap|flags?|features?|props|context/i.test(g.name));
  for (const g of config.slice(0, 6)) {
    f.add(`Configuraci\xF3n o estado inicial en window.${g.name}`, { detail: `Forma: ${flat(g.shape)}`, confidence: "media", evidence: ev });
  }
  const flags = objects.filter((g) => /flag|feature|toggle|experiment|ab[-_]?test/i.test(g.name + JSON.stringify(g.shape).slice(0, 2e3)));
  if (flags.length) f.add(`Indicios de \xABfeature flags\xBB o experimentos: ${flags.map((g) => g.name).join(", ")}`, { confidence: "baja", evidence: ev });
  if (s.hints.length) f.add(`Otras se\xF1ales de gesti\xF3n de estado: ${s.hints.join(", ")}`, { confidence: "media", evidence: ev });
  f.unknown("Se registra la forma del estado (claves y tipos) en el momento de la \xFAltima vista, nunca sus valores ni c\xF3mo cambia con el tiempo.");
  return session.saveResult({ tool: "app_state", session: session.dir, findings: f.list, unknowns: f.unknowns, files: [FILE], data: s });
}
function runtimeAnalysis(session) {
  const { entries, runtime, views } = load(session);
  const f = new Findings("runtime", "RUN");
  const ev = [{ file: HOOKS }];
  const byCtx = /* @__PURE__ */ new Map();
  for (const c of runtime.canvas) {
    const g = byCtx.get(c.context) ?? { n: 0, w: 0, h: 0, sel: /* @__PURE__ */ new Set() };
    g.n++;
    if (c.width * c.height > g.w * g.h) {
      g.w = c.width;
      g.h = c.height;
    }
    g.sel.add(c.selector);
    byCtx.set(c.context, g);
  }
  const lienzos = [...byCtx].map(([contexto, g]) => ({ contexto, cantidad: g.n, mayor: `${g.w}\xD7${g.h}`, selectores: [...g.sel].slice(0, 5) }));
  const gpu = lienzos.some((l) => /webgl|webgpu/.test(l.contexto));
  const bigCanvas = runtime.canvas.some((c) => c.width * c.height >= 300 * 200);
  const canvasOnly = runtime.canvas.some((c) => c.width * c.height >= 0.55 * 1366 * 900);
  let renderizado = "DOM: la interfaz son elementos HTML";
  if (bigCanvas && canvasOnly) renderizado = `lienzo (${gpu ? "WebGL/WebGPU" : "2D"}): casi toda la interfaz se dibuja en <canvas>`;
  else if (bigCanvas) renderizado = `mixto: interfaz en DOM y zonas dibujadas en <canvas> (${gpu ? "WebGL/WebGPU" : "2D"})`;
  f.add(`Renderizado: ${renderizado}`, {
    detail: lienzos.length ? `Contextos de dibujo: ${lienzos.map((l) => `${l.cantidad} \xD7 ${l.contexto} (mayor ${l.mayor}; ${l.selectores.join(", ")})`).join("; ")}.` : "La aplicaci\xF3n no ha pedido ning\xFAn contexto de <canvas>.",
    evidence: ev
  });
  if (bigCanvas) f.unknown("Lo que se dibuja dentro de un <canvas> no existe en el DOM: no hay elementos que inspeccionar ni selectores para accionarlo; solo se ve qu\xE9 c\xF3digo y qu\xE9 datos lo alimentan.");
  const wasmReq = entries.map((e, i) => ({ e, line: i + 1 })).filter((x) => /wasm/.test(x.e.mime) || /\.wasm(\?|$)/.test(x.e.url));
  const wasm = runtime.wasm.map((m) => ({ via: m.via, bytes: m.bytes, exports: m.exports.length, imports: m.imports.length, muestra: m.exports.slice(0, 25) }));
  if (runtime.wasm.length || wasmReq.length) {
    f.add(`WebAssembly: ${runtime.wasm.length} m\xF3dulo(s) instanciados${wasmReq.length ? `, ${wasmReq.length} archivo(s) .wasm descargados (${size(wasmReq.reduce((s, x) => s + x.e.size, 0))})` : ""}`, {
      detail: runtime.wasm.map((m, i) => `M\xF3dulo ${i + 1} (${m.via}${m.bytes ? `, ${m.bytes} bytes` : ""}): exporta ${m.exports.slice(0, 20).join(", ")}${m.exports.length > 20 ? "\u2026" : ""}; importa ${m.imports.slice(0, 12).join(", ") || "nada"}.`).join(" ") || "Descargado pero no se observ\xF3 su instanciaci\xF3n.",
      evidence: [...ev, ...wasmReq.slice(0, 3).map((x) => ({ file: REQ, line: x.line, note: x.e.url }))]
    });
    f.unknown("El c\xF3digo dentro de WebAssembly no se analiza: solo se conoce su interfaz (qu\xE9 importa y qu\xE9 exporta).");
  }
  const workers = runtime.workers.map((wk) => ({ tipo: wk.kind, url: wk.url }));
  if (workers.length) {
    f.add(`${workers.length} worker(s): ${[...new Set(workers.map((wk) => wk.tipo))].join(", ")}`, {
      detail: workers.slice(0, 12).map((wk) => `${wk.tipo} ${wk.url}`).join("; "),
      evidence: ev
    });
    f.unknown("El c\xF3digo que corre en workers queda fuera de la cobertura de funciones y de la instrumentaci\xF3n de la p\xE1gina.");
  }
  const others = Object.entries(runtime.apis ?? {}).filter(([k]) => !/^(Worker|SharedWorker|EventSource|serviceWorker)/.test(k));
  if (others.length) f.add(`Otras API de plataforma usadas: ${others.map(([k, v]) => `${k} (${v})`).join(", ")}`, { evidence: ev });
  if (!lienzos.length && !runtime.wasm.length && !workers.length) f.add("Sin lienzos, WebAssembly ni workers: toda la l\xF3gica corre en el hilo principal sobre el DOM", { evidence: ev });
  return session.saveResult({ tool: "app_runtime", session: session.dir, findings: f.list, unknowns: f.unknowns, files: [HOOKS], data: { lienzos, wasm, workers, apis: runtime.apis ?? {}, renderizado } });
}
var AUTH_PATH = /(^|[/._-])(login|logout|signin|sign-in|signout|session|sessions|auth|oauth2?|authorize|token|refresh|sso|saml|mfa|2fa|otp|verify|challenge|password|me|whoami|userinfo|csrf)([/._-]|$)/i;
var IDP = /auth0\.com|okta\.com|accounts\.google\.com|login\.microsoftonline\.com|cognito|firebaseapp\.com|identitytoolkit|clerk\.|keycloak|onelogin|pingidentity|appleid\.apple\.com|facebook\.com\/.*oauth/i;
function authAnalysis(session) {
  const { meta, entries, views } = load(session);
  const f = new Findings("auth", "AUT");
  const storage = session.exists("storage/snapshot.json") ? session.readJson("storage/snapshot.json") : { cookies: [], localStorage: [], sessionStorage: [] };
  f.add(meta.authenticated ? "Sesi\xF3n iniciada por el usuario durante el an\xE1lisis" : meta.barriers.includes("formulario de inicio de sesi\xF3n") ? "La aplicaci\xF3n muestra un formulario de inicio de sesi\xF3n (sin sesi\xF3n iniciada)" : "No se vio ning\xFAn formulario de inicio de sesi\xF3n", {
    detail: `Modo privado: ${meta.private ? "activado (sin capturas, texto del HTML oculto, d\xEDgitos enmascarados)" : "no"}. REA APP nunca introduce credenciales: si hay sesi\xF3n, la abri\xF3 el usuario en la ventana.`,
    evidence: [{ file: "capture.json" }]
  });
  for (const v of views) {
    const dom = session.exists(`${v.dir}/dom.json`) ? session.readJson(`${v.dir}/dom.json`) : null;
    const form = dom?.forms?.find((fm) => fm.fields.some((x) => x.type === "password"));
    if (form) {
      f.add(`Formulario de acceso en ${v.route}: ${form.method.toUpperCase()} ${form.action || "(gestionado por JavaScript)"}`, {
        detail: `Campos: ${form.fields.map((x) => `${x.name ?? x.id ?? x.tag}:${x.type}`).join(", ")}.`,
        evidence: [{ file: `${v.dir}/dom.json`, note: form.selector }]
      });
    }
  }
  const own = entries.map((e, i) => ({ e, line: i + 1 })).filter((x) => !x.e.thirdParty && (x.e.resourceType === "xhr" || x.e.resourceType === "fetch"));
  const schemes = /* @__PURE__ */ new Map();
  for (const { e, line } of own) for (const a of e.auth ?? []) schemes.set(a, { n: (schemes.get(a)?.n ?? 0) + 1, line: schemes.get(a)?.line ?? line });
  const esquemas = [...schemes].map(([mecanismo, s]) => ({ mecanismo, peticiones: s.n })).sort((a, b) => b.peticiones - a.peticiones);
  if (esquemas.length) {
    const none = own.filter((x) => !(x.e.auth ?? []).length).length;
    f.add(`Las llamadas a la API se autentican con: ${esquemas.map((s) => `${s.mecanismo} (${s.peticiones})`).join(", ")}`, {
      detail: `${own.length} llamadas a la API propia; ${none} sin ning\xFAn mecanismo de autenticaci\xF3n visible.`,
      evidence: [...new Set([...schemes.values()].map((s) => s.line))].slice(0, 5).map((line) => ({ file: REQ, line }))
    });
  } else if (own.length) {
    f.add(`Las ${own.length} llamadas a la API propia no llevan credenciales visibles`, { evidence: [{ file: REQ }] });
  }
  const eps = /* @__PURE__ */ new Map();
  entries.forEach((e, i) => {
    if (e.thirdParty || e.resourceType === "script" || e.resourceType === "stylesheet" || e.resourceType === "image") return;
    let u;
    try {
      u = new URL(e.url);
    } catch {
      return;
    }
    const cookies = (e.resHeaders["set-cookie"] ?? "").split("\n").map((c) => c.split("=")[0].trim()).filter(Boolean);
    if (!AUTH_PATH.test(u.pathname) && !cookies.length && e.status !== 401 && e.status !== 403) return;
    const key = `${e.method} ${templatePath(u.pathname)}`;
    const ep = eps.get(key) ?? { metodo: e.method, ruta: templatePath(u.pathname), estados: [], estableceCookies: [], linea: i + 1 };
    if (!ep.estados.includes(e.status)) ep.estados.push(e.status);
    for (const c of cookies) if (!ep.estableceCookies.includes(c)) ep.estableceCookies.push(c);
    eps.set(key, ep);
  });
  const endpoints = [...eps.values()];
  for (const ep of endpoints.slice(0, 12)) {
    f.add(`Endpoint de sesi\xF3n ${ep.metodo} ${ep.ruta} \u2192 ${ep.estados.join("/")}`, {
      detail: [ep.estableceCookies.length ? `Establece cookies: ${ep.estableceCookies.join(", ")}.` : "", ep.estados.some((s) => s === 401 || s === 403) ? "Respondi\xF3 401/403: exige una sesi\xF3n v\xE1lida." : ""].filter(Boolean).join(" ") || "Ruta con nombre propio de autenticaci\xF3n.",
      confidence: AUTH_PATH.test(ep.ruta) ? "alta" : "media",
      evidence: [{ file: REQ, line: ep.linea }]
    });
  }
  const proveedores = [...new Set(entries.filter((e) => IDP.test(e.url)).map((e) => new URL(e.url).host))];
  if (proveedores.length) f.add(`Proveedor de identidad externo: ${proveedores.join(", ")}`, { detail: "El inicio de sesi\xF3n se delega (OAuth/OIDC/SAML) en un tercero.", evidence: [{ file: REQ }] });
  const almacenado = [
    ...storage.cookies.filter((c) => c.sensible).map((c) => ({ donde: `cookie${c.httpOnly ? " HttpOnly" : " legible por JS"}${c.secure ? " Secure" : ""} SameSite=${c.sameSite}`, clave: c.nombre, tipo: c.tipo })),
    ...storage.localStorage.filter((e) => e.sensible).map((e) => ({ donde: "localStorage", clave: e.clave, tipo: e.tipo })),
    ...storage.sessionStorage.filter((e) => e.sensible).map((e) => ({ donde: "sessionStorage", clave: e.clave, tipo: e.tipo }))
  ];
  if (almacenado.length) {
    const js = almacenado.filter((a) => !a.donde.includes("HttpOnly"));
    f.add(`Credenciales de sesi\xF3n guardadas en el navegador: ${almacenado.map((a) => `${a.clave} (${a.donde}, ${a.tipo})`).join("; ")}`, {
      detail: js.length ? `${js.length} son legibles por JavaScript (${js.map((a) => a.clave).join(", ")}): cualquier script de la p\xE1gina puede leerlas.` : "Todas est\xE1n en cookies HttpOnly: JavaScript no puede leerlas.",
      evidence: [{ file: "storage/snapshot.json" }]
    });
  }
  const csrf = esquemas.filter((s) => /CSRF/.test(s.mecanismo));
  if (csrf.length) f.add(`Protecci\xF3n anti-CSRF por cabecera: ${csrf.map((s) => s.mecanismo.replace("cabecera anti-CSRF ", "")).join(", ")}`, { evidence: [{ file: REQ }] });
  f.unknown("No se conoce la duraci\xF3n de la sesi\xF3n, la pol\xEDtica de renovaci\xF3n ni las comprobaciones del servidor: solo lo que se vio en esta visita.");
  if (!meta.authenticated) f.unknown("Sin sesi\xF3n iniciada no se puede describir c\xF3mo se autentican las llamadas de la zona privada.");
  f.unknown("Los valores de tokens y cookies no se registran en ning\xFAn momento; solo sus nombres, tipo y ubicaci\xF3n.");
  return session.saveResult({ tool: "app_auth", session: session.dir, findings: f.list, unknowns: f.unknowns, files: [REQ, "storage/snapshot.json"], data: { estado: { sesionIniciada: meta.authenticated, barreras: meta.barriers, privado: meta.private }, esquemas, endpoints, proveedores, almacenado } });
}

// src/core/report.ts
import fs4 from "node:fs";
import path4 from "node:path";
var cell = (s) => String(s ?? "").replace(/\|/g, "\\|").replace(/\s*\n\s*/g, " ").trim();
var cite = (e) => `\`${e.file}${e.line ? `:${e.line}` : ""}\``;
function bullets(findings) {
  if (!findings.length) return "_Sin hallazgos en esta \xE1rea._\n";
  return findings.map((f) => {
    const refs = f.evidence.slice(0, 3).map(cite).join(", ");
    return `- **${f.title}** [${f.id}]${f.confidence !== "alta" ? ` _(confianza ${f.confidence})_` : ""}${f.detail ? `
  ${f.detail.replace(/\n/g, "\n  ")}` : ""}${refs ? `
  Evidencia: ${refs}` : ""}`;
  }).join("\n") + "\n";
}
function listFiles2(dir, base = dir, out = []) {
  for (const ent of fs4.readdirSync(dir, { withFileTypes: true })) {
    const full = path4.join(dir, ent.name);
    if (ent.isDirectory()) listFiles2(full, base, out);
    else out.push(path4.relative(base, full).replace(/\\/g, "/"));
  }
  return out;
}
async function buildReport(session, opts = {}) {
  await syncIfLive(session);
  const meta = session.readJson("capture.json");
  const open = session.loadResult("app_open");
  const view = domMap(session);
  const scripts = session.loadResult("app_scripts") ?? await scriptsAnalysis(session, { thirdPartyMaps: opts.thirdPartyMaps });
  const api = networkAnalysis(session);
  const routes = routesAnalysis(session);
  const realtime = realtimeAnalysis(session);
  const state = stateAnalysis(session);
  const runtime = runtimeAnalysis(session);
  const auth = authAnalysis(session);
  const storage = storageAnalysis(session);
  const stack = stackAnalysis(session);
  const flows = session.loadResult("app_flows");
  const results = [open, routes, view, scripts, api, realtime, state, runtime, auth, storage, stack, flows].filter((r) => !!r);
  const findings = results.flatMap((r) => r.findings);
  const unknowns = results.flatMap((r) => r.unknowns.map((texto) => ({ herramienta: r.tool, texto })));
  const nd = api.data;
  const sd = stack.data;
  const rd = routes.data;
  const td = realtime.data;
  const ud = runtime.data;
  const pregunta = opts.pregunta?.trim() ? redactText(opts.pregunta.trim()) : "";
  const analisis = opts.analisis?.trim() ? redactText(opts.analisis.trim()) : "";
  const own = nd.endpoints.filter((e) => !e.terceros);
  const techs = sd.tecnologias.map((t) => `${t.nombre}${t.version ? ` ${t.version}` : ""}`);
  const recovered = scripts.data.scripts.filter((s) => s.fuentes > 0);
  const stores = (state.data.stores ?? []).map((s) => s.kind);
  const summary = [
    `**${meta.title || meta.host}** \u2014 ${rd.vistas.length} vista(s) registradas, ${rd.visitadas.length} ruta(s) visitadas. ${rd.enrutador}.`,
    techs.length ? `Tecnolog\xEDas de cliente: ${techs.join(", ")}.` : "No se identific\xF3 un framework de cliente.",
    `Renderizado: ${ud.renderizado}.${ud.wasm.length ? ` ${ud.wasm.length} m\xF3dulo(s) WebAssembly.` : ""}${ud.workers.length ? ` ${ud.workers.length} worker(s).` : ""}`,
    `${scripts.data.scripts.length} scripts; ${recovered.length ? `c\xF3digo original recuperado de ${recovered.length} source map(s) (${recovered.reduce((s, x) => s + x.fuentes, 0)} m\xF3dulos)` : "sin source maps p\xFAblicos"}.`,
    own.length ? `${own.length} endpoint(s) propios${nd.graphql.length ? `, ${nd.graphql.length} operaci\xF3n(es) GraphQL` : ""}.` : "No se observaron llamadas a API propias.",
    td.websockets.length || td.sse.urls.length || td.sondeo.length ? `Tiempo real: ${td.websockets.length} WebSocket(s)${td.sse.urls.length ? `, ${td.sse.urls.length} flujo(s) SSE` : ""}${td.sondeo.length ? `, ${td.sondeo.length} endpoint(s) con sondeo` : ""}.` : "Sin canales en tiempo real.",
    stores.length ? `Estado: ${stores.join(", ")}.` : "No se localiz\xF3 un almac\xE9n de estado accesible.",
    meta.authenticated ? "El usuario inici\xF3 sesi\xF3n durante el an\xE1lisis: la sesi\xF3n se trat\xF3 en modo privado." : meta.barriers.length ? `Barreras detectadas y no superadas: ${meta.barriers.join(", ")}.` : "",
    flows ? `${flows.data.flujos.length} flujo(s) analizados (${flows.data.flujos.reduce((s, t) => s + t.pasos.length, 0)} pasos).` : ""
  ].filter(Boolean);
  const L = [];
  L.push(`# Informe de ingenier\xEDa inversa: ${meta.host}`, "");
  L.push(`> Generado por REA APP v${VERSION} el ${(/* @__PURE__ */ new Date()).toISOString().slice(0, 16).replace("T", " ")} UTC. ${ETHICS_NOTICE}`, "");
  L.push("| Dato | Valor |", "|---|---|");
  L.push(`| Aplicaci\xF3n | ${cell(meta.url)} |`);
  L.push(`| T\xEDtulo | ${cell(meta.title)} |`, `| Estado HTTP inicial | ${meta.status} |`, `| Abierta | ${meta.capturedAt} |`, `| Navegador | ${cell(meta.browser)}${meta.visible ? " (ventana visible)" : ""} |`);
  L.push(`| Sesi\xF3n de usuario | ${meta.authenticated ? "iniciada a mano por el usuario" : "no iniciada"} |`);
  L.push(`| Modo privado | ${meta.private ? "s\xED: sin capturas, texto del HTML oculto y d\xEDgitos enmascarados" : "no"} |`);
  L.push(`| robots.txt | ${meta.robots.respected ? `respetado (${meta.robots.rule ?? "sin regla aplicable"})` : "no consultado a petici\xF3n del usuario"} |`, "");
  if (!meta.private && session.exists("screenshots/pagina.png")) L.push("![Captura de la aplicaci\xF3n](screenshots/pagina.png)", "");
  L.push("## 1. Resumen", "", ...summary.map((s) => `- ${s}`), "");
  if (pregunta) L.push("### Pregunta planteada", "", `> ${pregunta.replace(/\n/g, "\n> ")}`, "");
  if (analisis) L.push("### An\xE1lisis", "", analisis, "");
  const by = (area) => findings.filter((f) => f.area === area);
  L.push("## 2. Arquitectura de la aplicaci\xF3n", "");
  L.push("### 2.1 Rutas y vistas", "", bullets(by("rutas")));
  if (rd.vistas.length) {
    L.push("| # | Vista | Ruta | Elementos | Formularios | Lienzos | Privada |", "|---|---|---|---|---|---|---|");
    for (const v of rd.vistas) L.push(`| ${v.n} | ${cell(v.name)} | \`${cell(v.route)}\` | ${v.elements} | ${v.forms} | ${v.canvases} | ${v.private ? "s\xED" : "no"} |`);
    L.push("");
  }
  L.push("### 2.2 Entorno de ejecuci\xF3n y renderizado", "", bullets(by("runtime")));
  L.push("### 2.3 Scripts y l\xF3gica de cliente", "", bullets(by("scripts")));
  if (scripts.data.pistas.length) {
    L.push("Puntos de entrada localizados en el c\xF3digo propio:", "", "| Tipo | Ubicaci\xF3n | C\xF3digo |", "|---|---|---|");
    for (const p of scripts.data.pistas.slice(0, 30)) L.push(`| ${p.tipo} | \`${p.archivo}:${p.linea}\` | \`${cell(p.texto).replace(/`/g, "'")}\` |`);
    L.push("");
  }
  L.push("### 2.4 Estado", "", bullets(by("estado")));
  L.push("### 2.5 Estructura de la \xFAltima vista", "", bullets(by("vista")));
  L.push("## 3. Datos y comunicaci\xF3n", "");
  L.push("### 3.1 API", "", bullets(by("api")));
  if (nd.endpoints.length) {
    L.push("| M\xE9todo | Ruta | Origen | Estado | Par\xE1metros | Autenticaci\xF3n | Desde | Disparado por | Evidencia |", "|---|---|---|---|---|---|---|---|---|");
    for (const e of nd.endpoints.slice(0, 80)) {
      L.push(
        `| ${e.metodo} | \`${cell(e.ruta)}\` | ${cell(e.origen)}${e.terceros ? " (tercero)" : ""} | ${e.estados.join(", ")} | ${cell(Object.entries(e.parametros).map(([k, v]) => `${k}: ${v}`).join(", ")) || "\u2014"} | ${cell(e.auth.join(", ")) || "\u2014"} | ${cell(e.vistas.slice(0, 3).join(", ")) || "\u2014"} | ${e.iniciadorOriginal ? cell(e.iniciadorOriginal) : e.iniciador ? `${cell(e.iniciador.fn)} (${cell(e.iniciador.url.split("/").pop())}:${e.iniciador.line})` : "\u2014"} | ${e.lineas.slice(0, 2).map((l) => `\`network/requests.jsonl:${l}\``).join(", ")} |`
      );
    }
    L.push("");
    for (const e of own.filter((x) => x.respuesta).slice(0, 20)) {
      L.push(`**\`${e.metodo} ${e.ruta}\`**${e.cuerpo ? ` \u2014 cuerpo enviado: \`${cell(e.cuerpo.replace(/\s+/g, " ")).slice(0, 200).replace(/`/g, "'")}\`` : ""} \u2014 respuesta (esquema inferido, sin valores):`, "", "```ts", e.respuesta, "```", "");
    }
  }
  if (nd.graphql.length) {
    L.push("**GraphQL**", "", "| Tipo | Operaci\xF3n | Variables | Endpoint | Evidencia |", "|---|---|---|---|---|");
    for (const g of nd.graphql.slice(0, 40)) L.push(`| ${g.type} | ${cell(g.name)} | ${cell(g.variables.join(", ")) || "\u2014"} | ${cell(g.url)} | \`network/requests.jsonl:${g.linea}\` |`);
    L.push("");
  }
  L.push("### 3.2 Tiempo real", "", bullets(by("tiemporeal")));
  for (const ws of td.websockets) {
    L.push(`**${cell(ws.url)}** \u2014 ${ws.protocol || "entramado desconocido"}${ws.latido ? `; latido ${ws.latido}` : ""}`, "", "| Direcci\xF3n | Tipo de mensaje | Veces | Tama\xF1o medio | Forma |", "|---|---|---|---|---|");
    for (const g of [...ws.groups].sort((a, b) => a.dir.localeCompare(b.dir) || b.count - a.count).slice(0, 40)) {
      L.push(`| ${g.dir} | \`${cell(g.key)}\` | ${g.count} | ${Math.round(g.bytes / g.count)} B | \`${cell(g.shape).slice(0, 160).replace(/`/g, "'")}\` |`);
    }
    L.push("");
  }
  L.push("### 3.3 Autenticaci\xF3n y sesi\xF3n", "", bullets(by("auth")));
  L.push("### 3.4 Almacenamiento en el navegador", "", bullets(by("almacenamiento")));
  if (nd.terceros.length) {
    L.push("### 3.5 Terceros", "", "| Dominio | Categor\xEDa | Peticiones | Tipos |", "|---|---|---|---|");
    for (const t of nd.terceros.slice(0, 40)) L.push(`| ${cell(t.host)} | ${t.categoria} | ${t.peticiones} | ${t.tipos.join(", ")} |`);
    L.push("");
  }
  L.push("## 4. Flujos analizados", "", flows ? bullets(by("flujo")) : "_No se analiz\xF3 ning\xFAn flujo. Usa `app_record` (el usuario act\xFAa y REA APP observa) o `app_act` (acciones guiadas) para ver qu\xE9 c\xF3digo responde a cada gesto._\n");
  L.push("## 5. Stack tecnol\xF3gico", "", bullets(by("stack")));
  if (sd.tecnologias.length) {
    L.push("| Tecnolog\xEDa | Tipo | Versi\xF3n | Detectada por |", "|---|---|---|---|");
    for (const t of sd.tecnologias) L.push(`| ${cell(t.nombre)} | ${t.tipo} | ${t.version ?? "\u2014"} | ${cell(t.via)} |`);
    L.push("");
  }
  L.push("| Cabecera de seguridad | Presente | Valor | Para qu\xE9 sirve |", "|---|---|---|---|");
  for (const s of sd.seguridad) L.push(`| \`${s.cabecera}\` | ${s.presente ? "s\xED" : "no"} | ${s.valor ? `\`${cell(s.valor).slice(0, 90).replace(/`/g, "'")}\`` : "\u2014"} | ${s.nota} |`);
  L.push("");
  L.push("## 6. Evidencias", "", "Cada hallazgo cita archivos de esta carpeta (`archivo:l\xEDnea`).", "", "| ID | Hallazgo | Confianza | Evidencia |", "|---|---|---|---|");
  for (const f of findings) {
    L.push(`| ${f.id} | ${cell(f.title).slice(0, 140)} | ${f.confidence} | ${f.evidence.slice(0, 5).map((e) => `${cite(e)}${e.note ? ` ${cell(e.note).slice(0, 90)}` : ""}`).join("<br>") || "\u2014"} |`);
  }
  L.push("");
  L.push("## 7. Inc\xF3gnitas", "", "Lo que este an\xE1lisis **no** pudo confirmar:", "");
  for (const u of unknowns) L.push(`- (${u.herramienta}) ${u.texto}`);
  L.push("");
  const files = listFiles2(session.dir);
  const group = (prefix) => files.filter((x) => x.startsWith(prefix)).length;
  L.push("## 8. Archivos de la sesi\xF3n", "");
  L.push("- `informe.md`, `evidence.json`: este informe y sus datos estructurados.");
  L.push(`- \`captura.har\`: tr\xE1fico de red con cabeceras y cuerpos sensibles enmascarados${files.includes("captura.har") ? "" : " (se escribe al cerrar la aplicaci\xF3n con app_close)"}.`);
  L.push(`- \`views/\` (${rd.vistas.length} vistas), \`flows/\` (${group("flows/")}), \`network/\` (${group("network/")}), \`runtime/\`, \`state/\`, \`storage/\`.`);
  L.push(`- \`scripts/raw/\` (${group("scripts/raw/")}), \`sources/\` (${group("sources/")} fuentes recuperadas o embellecidas), \`screenshots/\` (${group("screenshots/")}), \`analysis/\` (${group("analysis/")}).`);
  L.push("");
  const informe = session.write("informe.md", L.join("\n"));
  const evidencia = session.writeJson("evidence.json", {
    herramienta: "rea-app",
    version: VERSION,
    generado: (/* @__PURE__ */ new Date()).toISOString(),
    objetivo: meta,
    pregunta: pregunta || void 0,
    hallazgos: findings,
    incognitas: unknowns,
    rutas: rd,
    endpoints: nd.endpoints,
    graphql: nd.graphql,
    tiempoReal: td,
    estado: state.data,
    runtime: ud,
    autenticacion: auth.data,
    stack: sd,
    flujos: flows?.data.flujos ?? [],
    archivos: files
  });
  return {
    tool: "app_report",
    session: session.dir,
    findings: [],
    unknowns: unknowns.map((u) => u.texto),
    files: [informe, evidencia],
    data: { informe: session.abs(informe), evidencia: session.abs(evidencia), hallazgos: findings.length, incognitas: unknowns.length }
  };
}

// src/core/setup.ts
import { spawnSync } from "node:child_process";
import fs5 from "node:fs";
import path5 from "node:path";
import { fileURLToPath } from "node:url";
function packageRoot() {
  if (process.env.CLAUDE_PLUGIN_ROOT && fs5.existsSync(path5.join(process.env.CLAUDE_PLUGIN_ROOT, "package.json"))) return process.env.CLAUDE_PLUGIN_ROOT;
  let dir = path5.dirname(fileURLToPath(import.meta.url));
  for (let i = 0; i < 5; i++) {
    if (fs5.existsSync(path5.join(dir, "package.json"))) return dir;
    dir = path5.dirname(dir);
  }
  return process.cwd();
}
function runSetup() {
  const root = packageRoot();
  const log = [];
  const run = (cmd, args) => {
    log.push(`$ ${cmd} ${args.join(" ")}  (en ${root})`);
    const r = spawnSync(cmd, args, { cwd: root, shell: process.platform === "win32", stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" });
    const tail = `${r.stdout ?? ""}${r.stderr ?? ""}`.trim().split("\n").slice(-6).join("\n");
    if (tail) log.push(tail);
    process.stderr.write(`${tail}
`);
    return r.status === 0;
  };
  if (!fs5.existsSync(path5.join(root, "node_modules", "playwright"))) {
    if (!run("npm", ["install", "--omit=dev", "--no-audit", "--no-fund"])) return { ok: false, log };
  }
  const ok = run("npx", ["playwright", "install", "chromium"]);
  return { ok, log };
}
export {
  BrowserMissingError,
  ETHICS_NOTICE,
  LiveApp,
  PolicyError,
  RateLimiter,
  Session,
  VERSION,
  act,
  assertAllowedUrl,
  authAnalysis,
  buildReport,
  classifyFrame,
  classifyValue,
  domMap,
  guard,
  inferSchema,
  isRecording,
  maskDigits,
  mergeEvents,
  mergeSchemas,
  networkAnalysis,
  privatizeUrl,
  realtimeAnalysis,
  redactCode,
  redactHar,
  redactHeaders,
  redactHtml,
  redactText,
  redactUrl,
  resolveSession,
  robotsAllows,
  routesAnalysis,
  runSetup,
  runtimeAnalysis,
  schemaToText,
  scriptsAnalysis,
  stackAnalysis,
  startRecording,
  stateAnalysis,
  stopRecording,
  storageAnalysis,
  syncIfLive
};
