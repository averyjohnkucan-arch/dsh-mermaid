import test from 'node:test';import assert from 'node:assert/strict';import {validateSource} from '../lib/render.js';
test('ordinary diagrams are accepted as data',()=>assert.match(validateSource('flowchart LR\n A[Start] --> B[Done]'),/flowchart/));
test('configuration and external resources cannot bypass strict rendering',()=>{for(const x of ['%%{init: {securityLevel:"loose"}}%%\nflowchart LR','---\nconfig: {}\n---\nflowchart LR','flowchart LR\nclick A "https://example.com"','flowchart LR\nA[<script>alert(1)</script>]'])assert.throws(()=>validateSource(x));});
test('unbounded sources are rejected',()=>{assert.throws(()=>validateSource(''));assert.throws(()=>validateSource('a'.repeat(30001)));});
