/*
 * Minimal spreadsheet reader for batch import — no third-party code.
 * .xlsx: reads the first worksheet (zip + DecompressionStream('deflate-raw') + DOMParser).
 * .csv / .tsv: RFC 4180 style parser (quoted fields, embedded newlines, BOM).
 * Returns rows as arrays of strings: [[cell, cell, …], …].
 */
(function (g) {
  'use strict';

  // ---------- CSV ----------
  function parseCsv(text) {
    text = String(text).replace(/^﻿/, '');
    var first = text.split(/\r?\n/, 1)[0] || '';
    var delim = (first.split('\t').length > first.split(',').length) ? '\t'
      : (first.split(';').length > first.split(',').length ? ';' : ',');
    var rows = [], row = [], cell = '', q = false;
    for (var i = 0; i < text.length; i++) {
      var c = text[i];
      if (q) {
        if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else q = false; }
        else cell += c;
      } else if (c === '"') q = true;
      else if (c === delim) { row.push(cell); cell = ''; }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        row.push(cell); rows.push(row); row = []; cell = '';
      } else cell += c;
    }
    if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
    return rows;
  }

  // ---------- ZIP ----------
  function u16(b, o) { return b[o] | (b[o + 1] << 8); }
  function u32(b, o) { return (b[o] | (b[o + 1] << 8) | (b[o + 2] << 16) | (b[o + 3] << 24)) >>> 0; }
  function readZip(buf) {
    var b = new Uint8Array(buf), eocd = -1;
    for (var i = b.length - 22; i >= Math.max(0, b.length - 65557); i--) {
      if (u32(b, i) === 0x06054b50) { eocd = i; break; }
    }
    if (eocd < 0) throw new Error('Not a valid .xlsx file');
    var n = u16(b, eocd + 10), off = u32(b, eocd + 16), files = {};
    var dec = new TextDecoder();
    for (var k = 0; k < n; k++) {
      if (u32(b, off) !== 0x02014b50) throw new Error('Damaged .xlsx file');
      var method = u16(b, off + 10), csize = u32(b, off + 20);
      var nlen = u16(b, off + 28), elen = u16(b, off + 30), clen = u16(b, off + 32), lho = u32(b, off + 42);
      var name = dec.decode(b.subarray(off + 46, off + 46 + nlen));
      var dataStart = lho + 30 + u16(b, lho + 26) + u16(b, lho + 28);
      files[name] = { method: method, data: b.subarray(dataStart, dataStart + csize) };
      off += 46 + nlen + elen + clen;
    }
    return files;
  }
  function inflate(entry) {
    if (!entry) return Promise.resolve(null);
    if (entry.method === 0) return Promise.resolve(new TextDecoder().decode(entry.data));
    if (entry.method !== 8) return Promise.reject(new Error('Unsupported compression in .xlsx'));
    if (typeof DecompressionStream === 'undefined') return Promise.reject(new Error('This browser cannot read .xlsx — save the sheet as CSV and import that instead.'));
    var ds = new DecompressionStream('deflate-raw');
    var stream = new Blob([entry.data]).stream().pipeThrough(ds);
    return new Response(stream).text();
  }

  // ---------- XLSX ----------
  function colIndex(ref) {
    var m = /^([A-Z]+)/.exec(ref || ''), n = 0;
    if (!m) return -1;
    for (var i = 0; i < m[1].length; i++) n = n * 26 + (m[1].charCodeAt(i) - 64);
    return n - 1;
  }
  function textOf(node) {
    // Concatenate <t> runs (rich text) inside a <si> or <is>.
    var ts = node.getElementsByTagName('t'), s = '';
    for (var i = 0; i < ts.length; i++) s += ts[i].textContent;
    return s;
  }
  function parseXlsx(buf) {
    var files = readZip(buf);
    var wbRels = files['xl/_rels/workbook.xml.rels'], wb = files['xl/workbook.xml'];
    var p = new DOMParser();
    return Promise.all([inflate(wb), inflate(wbRels), inflate(files['xl/sharedStrings.xml'])]).then(function (r) {
      var sheetPath = 'xl/worksheets/sheet1.xml';
      if (r[0] && r[1]) {
        var first = p.parseFromString(r[0], 'application/xml').getElementsByTagName('sheet')[0];
        var rid = first && (first.getAttribute('r:id') || first.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id'));
        var rels = p.parseFromString(r[1], 'application/xml').getElementsByTagName('Relationship');
        for (var i = 0; i < rels.length; i++) {
          if (rels[i].getAttribute('Id') === rid) {
            var t = rels[i].getAttribute('Target').replace(/^\//, '');
            sheetPath = t.indexOf('xl/') === 0 ? t : 'xl/' + t;
          }
        }
      }
      var shared = [];
      if (r[2]) {
        var si = p.parseFromString(r[2], 'application/xml').getElementsByTagName('si');
        for (var j = 0; j < si.length; j++) shared.push(textOf(si[j]));
      }
      return inflate(files[sheetPath]).then(function (xml) {
        if (!xml) throw new Error('No worksheet found in the .xlsx file');
        var rowsEl = p.parseFromString(xml, 'application/xml').getElementsByTagName('row'), out = [];
        for (var a = 0; a < rowsEl.length; a++) {
          var cells = rowsEl[a].getElementsByTagName('c'), row = [];
          for (var c = 0; c < cells.length; c++) {
            var cell = cells[c], type = cell.getAttribute('t'), idx = colIndex(cell.getAttribute('r'));
            if (idx < 0) idx = row.length;
            var v = cell.getElementsByTagName('v')[0], val = '';
            if (type === 's') val = v ? (shared[parseInt(v.textContent, 10)] || '') : '';
            else if (type === 'inlineStr') { var is = cell.getElementsByTagName('is')[0]; val = is ? textOf(is) : ''; }
            else val = v ? v.textContent : '';
            row[idx] = val;
          }
          for (var z = 0; z < row.length; z++) if (row[z] == null) row[z] = '';
          var rIdx = parseInt(rowsEl[a].getAttribute('r'), 10);
          out[isNaN(rIdx) ? out.length : rIdx - 1] = row;
        }
        for (var y = 0; y < out.length; y++) if (!out[y]) out[y] = [];
        return out;
      });
    });
  }

  function readFile(file) {
    var name = (file.name || '').toLowerCase();
    if (/\.xlsx$/.test(name)) return file.arrayBuffer().then(parseXlsx);
    if (/\.(csv|tsv|txt)$/.test(name)) return file.text().then(parseCsv);
    return Promise.reject(new Error('Unsupported file type — use .xlsx or .csv'));
  }

  g.NVSheet = { readFile: readFile, parseCsv: parseCsv };
})(window);
