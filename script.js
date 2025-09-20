// CSVを読み込んで表示する簡単なテスト
async function loadCSV() {
  try {
    const response = await fetch("terms.csv");
    const text = await response.text();

    const lines = text.trim().split("\n");
    const headers = lines[0].split(",");

    const records = lines.slice(1).map(line => {
      const cols = line.split(",");
      let obj = {};
      headers.forEach((h, i) => {
        obj[h] = cols[i];
      });
      return obj;
    });

    // 出力
    const output = document.getElementById("output");
    output.innerHTML = "<h2>用語一覧</h2><ul>" +
      records.map(r => `<li><b>${r.term}</b>：${r.description}</li>`).join("") +
      "</ul>";
  } catch (err) {
    console.error("CSV読み込みエラー:", err);
    document.getElementById("output").textContent = "CSVを読み込めませんでした。";
  }
}

loadCSV();
