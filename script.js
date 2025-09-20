let questions = [];
let idx = 0;

async function loadCSV() {
  const res = await fetch('questions.csv');
  const text = await res.text();
  const lines = text.trim().split('\n').slice(1); // ヘッダ除去
  questions = lines.map(line => {
    const cols = line.split(',');
    return {
      q: cols[1],
      options: [cols[2], cols[3], cols[4], cols[5]],
      answer: parseInt(cols[6], 10) - 1,
      explanation: cols[7]
    };
  });
  showQuestion();
}

function showQuestion() {
  const q = questions[idx];
  document.getElementById('qText').textContent = `Q${idx+1}. ${q.q}`;
  const optDiv = document.getElementById('options');
  optDiv.innerHTML = '';
  q.options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.textContent = opt;
    btn.className = 'option';
    btn.onclick = () => checkAnswer(i);
    optDiv.appendChild(btn);
  });
  document.getElementById('feedback').textContent = '';
  document.getElementById('explanation').textContent = '';
}

function checkAnswer(i) {
  const q = questions[idx];
  const opts = document.querySelectorAll('.option');
  opts.forEach((b, j) => {
    if (j === q.answer) b.classList.add('correct');
    if (j === i && i !== q.answer) b.classList.add('wrong');
    b.disabled = true;
  });

  // 正解／不正解を表示
  document.getElementById('feedback').textContent =
    i === q.answer ? '✅ 正解！' : '❌ 不正解…';

  // 解説を表示
  document.getElementById('explanation').textContent = `解説: ${q.explanation}`;

  // 2秒後に次の問題へ
  setTimeout(() => {
    if (idx < questions.length - 1) {
      idx++;
      showQuestion();
    } else {
      document.getElementById('quiz').innerHTML = '<h2>終了！お疲れさまでした。</h2>';
    }
  }, 2000);
}

loadCSV();
