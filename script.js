// クイズ設定
const CSV_PATH = "terms.csv";
// キャッシュ対策（GitHub Pagesの更新待ちで古いCSVが残るのを避ける）
const CACHE_BUST = `?v=${Date.now()}`;

// 状態
let records = [];
let pool = [];        // 未出題のインデックス
let current = null;   // 現在の問題 {term, description, category, answer, choices}
let correct = 0;
let total = 0;
let locked = false;

// 要素
const promptEl = document.getElementById("prompt");
const optionsEl = document.getElementById("options");
const scoreEl = document.getElementById("score");
const barEl = document.getElementById("bar");
const progressTextEl = document.getElementById("progressText");
const catEl = document.getElementById("cat");
const expoEl = document.getElementById("expo");
const hintEl = document.getElementById("hint");
const nextBtn = document.getElementById("nextBtn");
const skipBtn = document.getElementById("skipBtn");

// 初期化
init();

async function init() {
  try {
    const text = await fetch(CSV_PATH + CACHE_BUST, { cache: "no-store" }).then(r => r.text());
    records = parseCSV(text);
    if (records.length < 4) throw new Error("選択肢が作れません（最低4行必要）。");

    pool = shuffle([...Array(records.length).keys()]);
    catEl.textContent = "すべて";
    hintEl.textContent = `読み込み完了：${records.length}語`;
    correct = 0; total = 0;
    updateScore();
    nextQuestion();
  } catch (e) {
    console.error(e);
    promptEl.textContent = "CSVの読み込みに失敗しました。";
    hintEl.textContent = "terms.csv の配置やフォーマットを確認してください。";
  }
}

// CSVパーサ（ヘッダ付き、単純カンマ区切り）
function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split(",").map(h => h.trim());
  const rows = lines.slice(1).map(line => splitCSVLine(line));
  return rows.map(cols => {
    const o = {};
    headers.forEach((h, i) => o[h] = (cols[i] ?? "").trim());
    return o;
  });
}

// カンマを含む可能性を考慮した簡易分割（ダブルクオート対応）
function splitCSVLine(line) {
  const out = [];
  let cur = "", inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"' ) {
      if (inQ && line[i+1] === '"') { cur += '"'; i++; }
      else inQ = !inQ;
    } else if (ch === "," && !inQ) {
      out.push(cur); cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

function nextQuestion() {
  expoEl.classList.add("hidden");
  expoEl.textContent = "";
  if (pool.length === 0) {
    promptEl.textContent = `お疲れさま！ 全${total}問、正答率 ${(total ? Math.round(100*correct/total) : 0)}%`;
    optionsEl.innerHTML = "";
    nextBtn.disabled = true;
    skipBtn.disabled = true;
    hintEl.textContent = "ページを再読み込みすると最初からやり直せます。";
    return;
  }
  locked = false;
  const idx = pool.pop();
  const q = records[idx];

  // 選択肢生成：説明文4つ（正解＋ダミー3）
  const others = shuffle(records.filter((_, i) => i !== idx)).slice(0, 3).map(r => r.description);
  const choices = shuffle([q.description, ...others]);

  current = {
    term: q.term,
    category: q.category || "未分類",
    answer: q.description,
    choices
  };

  renderQuestion();
}

function renderQuestion() {
  promptEl.innerHTML = `次の用語の説明として最も近いものを選んでください：<br><b>「${escapeHTML(current.term)}」</b>`;
  catEl.textContent = current.category;
  optionsEl.innerHTML = "";
  current.choices.forEach((text, i) => {
    const btn = document.createElement("button");
    btn.className = "btn";
    btn.innerHTML = `<b>選択肢${i+1}：</b> ${escapeHTML(text)}`;
    btn.addEventListener("click", () => selectChoice(btn, text));
    optionsEl.appendChild(btn);
  });
}

function selectChoice(button, selectedText) {
  if (locked) return;
  locked = true;
  total++;

  const buttons = [...optionsEl.querySelectorAll(".btn")];
  const isCorrect = selectedText === current.answer;
  if (isCorrect) correct++;

  // マーク
  buttons.forEach(b => {
    const chosen = b === button;
    const val = b.textContent.replace(/^選択肢\d+：\s*/, "");
    if (val === current.answer) b.classList.add("correct");
    if (chosen && !isCorrect) b.classList.add("wrong");
    b.disabled = true;
  });

  updateScore();

  // 解説（今は正解文を再掲、必要なら別列を用意して詳説可）
  expoEl.textContent = `正解：${current.answer}`;
  expoEl.classList.remove("hidden");
}

function updateScore() {
  scoreEl.textContent = `${correct}/${total}`;
  const progress = records.length === 0 ? 0 : Math.round((total / records.length) * 100);
  barEl.style.width = `${progress}%`;
  progressTextEl.textContent = `${progress}%`;
}

nextBtn.addEventListener("click", () => {
  if (!locked) return; // 解答前は次へ進めない
  nextQuestion();
});

skipBtn.addEventListener("click", () => {
  // 未回答のまま次へ（スコアは増やさず、出題数も増やさない）
  if (locked) return;
  pool.unshift(pool.pop()); // 末尾を先頭に戻す（同じ問題は後で再出）
  nextQuestion();
});

// ユーティリティ
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
function escapeHTML(s) {
  return String(s).replace(/[&<>"']/g, c => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[c]));
}
