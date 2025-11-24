// Shared study utilities for parsing and generating MCQs and options
export function parseMCQFromContent(text) {
  if (!text) return null;
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/\?$/.test(line) || /^(Q:|Question[:\s])/i.test(line) || line.length > 20) {
      const opts = [];
      let j = i + 1;
      while (j < Math.min(lines.length, i + 8) && opts.length < 6) {
        const l = lines[j];
        let m = l.match(/^[A-D][\).:-]\s*(.+)/i);
        if (m) { opts.push(m[1].trim()); j++; continue; }
        m = l.match(/^[A-D]\s+(.+)/i);
        if (m) { opts.push(m[1].trim()); j++; continue; }
        m = l.match(/^[\-\*]\s*(.+)/);
        if (m && opts.length > 0) { opts.push(m[1].trim()); j++; continue; }
        const inlineParts = l.split(/(?=[A-D][\).:-]\s)/i);
        if (inlineParts.length > 1) {
          for (const seg of inlineParts) {
            const mm = seg.match(/^[A-D][\).:-]\s*(.+)/i);
            if (mm) opts.push(mm[1].trim());
          }
          if (opts.length > 0) { j++; continue; }
        }
        j++;
      }
      if (opts.length >= 3) {
        while (opts.length < 4) opts.push('N/A');
        if (opts.length > 4) opts.splice(4);
        let correctIndex = null;
        for (let k = j; k < Math.min(lines.length, j + 4); k++) {
          const ans = lines[k].match(/^(Answer|Correct)[:\s]*([A-D]|\d+)/i);
          if (ans) {
            const key = ans[2];
            let idx = null;
            if (/^[A-D]$/i.test(key)) idx = key.toUpperCase().charCodeAt(0) - 65;
            else idx = Number(key) - 1;
            if (idx >= 0 && idx < opts.length) correctIndex = idx;
            break;
          }
        }
        if (correctIndex == null) {
          for (let oi = 0; oi < opts.length; oi++) {
            if (/\(correct\)|\*|✓/i.test(opts[oi])) { correctIndex = oi; opts[oi] = opts[oi].replace(/\(correct\)|\*|✓/ig, '').trim(); break; }
          }
        }
        if (correctIndex == null) correctIndex = 0;
        const qText = line.replace(/^(Q:|Question[:\s])/i, '').trim();
        return { question: qText, options: opts, correctIndex };
      }
    }
  }
  return null;
}

export function buildOptionsCache(content = []) {
  if (!Array.isArray(content)) return [];
  return content.map((q) => {
    if (!q || !q.answer) return null;
    const allAnswers = content.map(qq => qq.answer).filter(a => a && a !== q.answer);
    const distractors = [];
    const used = new Set();
    while (distractors.length < 3 && allAnswers.length > 0) {
      const i = Math.floor(Math.random() * allAnswers.length);
      if (!used.has(allAnswers[i])) {
        distractors.push(allAnswers[i]);
        used.add(allAnswers[i]);
      }
    }
    while (distractors.length < 3) distractors.push('N/A');
    const optionsArr = [q.answer, ...distractors];
    for (let i = optionsArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [optionsArr[i], optionsArr[j]] = [optionsArr[j], optionsArr[i]];
    }
    return optionsArr;
  });
}

export function synthesizeMCQFromContent(content = []) {
  if (!Array.isArray(content) || content.length === 0) return null;
  let candidate = content.find(it => it.question || it.front || it.statement || it.sentence || it.back || it.answer);
  if (!candidate) candidate = content[0];
  if (!candidate) return null;
  const qText = candidate.question || candidate.front || candidate.statement || candidate.sentence || 'Question';
  const correctVal = candidate.answer || candidate.back || candidate.content || candidate.response || '';
  const pool = content.map(c => c.answer || c.back || c.content || '').filter(a => a && a !== correctVal);
  const opts = [];
  if (correctVal) opts.push(correctVal);
  const used = new Set(opts);
  while (opts.length < 4 && pool.length > 0) {
    const i = Math.floor(Math.random() * pool.length);
    const val = pool.splice(i, 1)[0];
    if (!used.has(val) && String(val).trim().length > 1) { opts.push(val); used.add(val); }
  }
  while (opts.length < 4) opts.push('N/A');
  for (let i = opts.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [opts[i], opts[j]] = [opts[j], opts[i]];
  }
  const correctIndex = opts.findIndex(o => (o || '').toString() === (correctVal || '').toString());
  return { question: qText, options: opts, correctIndex: correctIndex >= 0 ? correctIndex : 0 };
}

export default { parseMCQFromContent, buildOptionsCache, synthesizeMCQFromContent };
