// =============================================
//  ローマ字対応表（打ち方が複数あるものは配列で書く）
//  かな → ローマ字（文字列 or 文字列の配列）
// =============================================
const ROMAJI_TABLE = {
  "あ":"a","い":"i","う":"u","え":"e","お":"o",
  "か":"ka","き":"ki","く":"ku","け":"ke","こ":"ko",
  "が":"ga","ぎ":"gi","ぐ":"gu","げ":"ge","ご":"go",
  "さ":"sa","し":["shi","si"],"す":"su","せ":"se","そ":"so",
  "ざ":"za","じ":["ji","zi"],"ず":"zu","ぜ":"ze","ぞ":"zo",
  "た":"ta","ち":["chi","ti"],"つ":["tsu","tu"],"て":"te","と":"to",
  "だ":"da","ぢ":"di","づ":"du","で":"de","ど":"do",
  "な":"na","に":"ni","ぬ":"nu","ね":"ne","の":"no",
  "は":"ha","ひ":"hi","ふ":["fu","hu"],"へ":"he","ほ":"ho",
  "ば":"ba","び":"bi","ぶ":"bu","べ":"be","ぼ":"bo",
  "ぱ":"pa","ぴ":"pi","ぷ":"pu","ぺ":"pe","ぽ":"po",
  "ま":"ma","み":"mi","む":"mu","め":"me","も":"mo",
  "や":"ya","ゆ":"yu","よ":"yo",
  "ら":"ra","り":"ri","る":"ru","れ":"re","ろ":"ro",
  "わ":"wa","を":"wo",
  "ん":["nn","xn"],
  "っ":["ltu","xtu","ltsu","xtsu"],   // 「っ」を単独で打つときの綴り
  "きゃ":"kya","きゅ":"kyu","きょ":"kyo",
  "しゃ":["sha","sya"],"しゅ":["shu","syu"],"しょ":["sho","syo"],
  "ちゃ":["cha","tya"],"ちゅ":["chu","tyu"],"ちょ":["cho","tyo"],
  "にゃ":"nya","にゅ":"nyu","にょ":"nyo",
  "ひゃ":"hya","ひゅ":"hyu","ひょ":"hyo",
  "みゃ":"mya","みゅ":"myu","みょ":"myo",
  "りゃ":"rya","りゅ":"ryu","りょ":"ryo",
  "ぎゃ":"gya","ぎゅ":"gyu","ぎょ":"gyo",
  "じゃ":["ja","zya"],"じゅ":["ju","zyu"],"じょ":["jo","zyo"],
  "びゃ":"bya","びゅ":"byu","びょ":"byo",
  "ぴゃ":"pya","ぴゅ":"pyu","ぴょ":"pyo",
  "ー":"-"
};

const VOWELS = ["a", "i", "u", "e", "o"];

// 表を引いて「必ず配列」で返す
function spellingsOf(kana) {
  const v = ROMAJI_TABLE[kana];
  if (v === undefined) return [kana];        // 表にないものはそのまま（英数字など）
  return Array.isArray(v) ? v : [v];
}

// =============================================
//  かな列 → 「かたまり」の配列
//  各かたまり = { kana: 表示用, spellings: 打ち方候補の配列 }
// =============================================
function buildTokens(kana) {
  // --- 1. 1〜2文字のかたまりに分割（っ・ん もそのまま1個） ---
  const raw = [];
  let i = 0;
  while (i < kana.length) {
    const two = kana.substr(i, 2);
    if (ROMAJI_TABLE[two]) { raw.push(two); i += 2; }
    else { raw.push(kana[i]); i += 1; }
  }

  // --- 2. 「っ」を次のかたまりにくっつける ---
  const merged = [];
  for (let j = 0; j < raw.length; j++) {
    if (raw[j] === "っ" && j + 1 < raw.length) {
      merged.push({ kana: "っ" + raw[j + 1], base: raw[j + 1], sokuon: true });
      j++;
    } else {
      merged.push({ kana: raw[j], base: raw[j], sokuon: false });
    }
  }

  // --- 3. かたまりごとに打ち方候補を決める ---
  return merged.map((cur, j) => ({
    kana: cur.kana,
    spellings: computeSpellings(cur, merged[j + 1])
  }));
}

function computeSpellings(cur, next) {
  if (cur.kana === "ん") return nSpellings(next);
  if (cur.sokuon)        return sokuonSpellings(cur.base);
  return spellingsOf(cur.kana);
}

// 「ん」の打ち方候補（次のかなで変わる）
function nSpellings(next) {
  const base = ["nn", "xn"];
  if (!next) return base;                          // 語末は nn（n 単独は不可）
  const nextHeads = followingSpellings(next).map(s => s[0]);
  const canSingle = nextHeads.every(c => !VOWELS.includes(c) && c !== "n" && c !== "y");
  return canSingle ? ["n", ...base] : base;
}

function followingSpellings(t) {
  if (!t) return [];
  if (t.kana === "ん") return ["nn"];
  if (t.sokuon)        return sokuonSpellings(t.base);
  return spellingsOf(t.kana);
}

// 「っ＋次のかな」の打ち方候補
function sokuonSpellings(baseKana) {
  const out = [];
  for (const s of spellingsOf(baseKana)) {
    const head = s[0];
    if (!VOWELS.includes(head) && head !== "n") {
      out.push(head + s);                 // 子音を重ねる： "ko"→"kko"
    }
    if (s.startsWith("ch")) {
      out.push("t" + s);                  // 「ち」系は t を足す： "chi"→"tchi"
    }
    for (const x of ["ltu", "xtu", "ltsu", "xtsu"]) {
      out.push(x + s);
    }
  }
  return out;
}

// 候補のうち、prefix で始まるいちばん短い綴りを返す（表示用）
function shortestSpelling(list, prefix) {
  return list
    .filter(s => s.startsWith(prefix))
    .sort((a, b) => a.length - b.length)[0];
}

// typed で「このかたまりを確定してよいか」
function isFinal(list, typed) {
  if (!list.includes(typed)) return false;
  return !list.some(s => s.length > typed.length && s.startsWith(typed));
}

// =============================================
//  マッチャー：1つの読みに対するタイピングの進み具合を持つ部品
//  問題文用に1個、選択肢用に4個、と使い回す
// =============================================
function createMatcher(reading) {
  return {
    reading: reading,  // 元の読み（文字列）
    tokens: buildTokens(reading),
    tokenIndex: 0,     // 何個目のかたまりを打っているか
    tokenTyped: "",    // そのかたまりで打てたローマ字
    chosen: [],        // 各かたまりで実際に打った綴り
    dead: false,       // （選択肢用）打ち間違えて脱落したか
  };
}

function matcherFinalize(m) {
  m.chosen[m.tokenIndex] = m.tokenTyped;
  m.tokenIndex += 1;
  m.tokenTyped = "";
}

function matcherIsDone(m) {
  return m.tokenIndex >= m.tokens.length;
}

// キー1つを処理。"ok" / "done" / "miss" を返す（m を書き換える）
function matcherPress(m, key) {
  if (matcherIsDone(m)) return "done";

  const list = m.tokens[m.tokenIndex].spellings;
  const candidate = m.tokenTyped + key;

  if (list.some(s => s.startsWith(candidate))) {
    m.tokenTyped = candidate;
    if (isFinal(list, m.tokenTyped)) matcherFinalize(m);
    return matcherIsDone(m) ? "done" : "ok";
  }

  if (list.includes(m.tokenTyped)) {
    matcherFinalize(m);
    return matcherPress(m, key);       // このキーを次のかたまりで処理し直す
  }

  return "miss";
}

// お試し用：m を壊さずにキーを打ったふりをして結果だけ見る
function matcherTry(m, key) {
  const clone = { ...m, chosen: [...m.chosen] };
  const result = matcherPress(clone, key);
  return { result, clone };
}

// 打ち終わったかたまりのかなをつなげた文字列
function matcherDoneKana(m) {
  let s = "";
  for (let i = 0; i < m.tokenIndex; i++) s += m.tokens[i].kana;
  return s;
}
function matcherRestKana(m) {
  let s = "";
  for (let i = m.tokenIndex; i < m.tokens.length; i++) s += m.tokens[i].kana;
  return s;
}

// 打ち終わったローマ字 / これから打つローマ字
function matcherDoneRomaji(m) {
  let s = "";
  for (let i = 0; i < m.tokenIndex; i++) s += m.chosen[i];
  return s + m.tokenTyped;
}
function matcherRestRomaji(m) {
  if (matcherIsDone(m)) return "";
  let s = shortestSpelling(m.tokens[m.tokenIndex].spellings, m.tokenTyped).slice(m.tokenTyped.length);
  for (let i = m.tokenIndex + 1; i < m.tokens.length; i++) {
    s += shortestSpelling(m.tokens[i].spellings, "");
  }
  return s;
}

// 進み具合を無視した、まるごとのローマ字（脱落・結果表示用）
function matcherFullRomaji(m) {
  return m.tokens.map(t => shortestSpelling(t.spellings, "")).join("");
}

// =============================================
//  問題データ（questions.json を fetch で読み込んで、ここに入れる）
//  ※ file:// で index.html を開くだけだと fetch がブロックされるので、
//     ローカルサーバー経由で開く必要がある（下の起動処理を参照）
// =============================================
let QUESTIONS = [];

// 選択肢を { display, reading } の形にそろえる
function normalizeChoice(c) {
  if (typeof c === "string") return { display: c, reading: c };
  return { display: c.display || c.reading, reading: c.reading };
}

// その選択肢が正解か（answer は reading でも display でも一致すればOK）
function isAnswerChoice(ch) {
  return ch.reading === question.answer || ch.display === question.answer;
}

// =============================================
//  モードとスコア設定
// =============================================
const GRADES = ["中学生", "高校生"];   // 難易度えらびに出す順番
const SUBJECTS_ALLOWED = ["理科", "社会"];        // このアプリで扱う教科（それ以外は questions.json のミス）

// =============================================
//  自己ベスト（学年・教科・単元の組み合わせごとに、ブラウザの localStorage に保存）
// =============================================
const BEST_STORAGE_KEY = "typing4-bests";

// 学年・教科・単元 → 保存用のキー文字列（null は「ぜんぶ」の意味）
function scopeKey(grade, subject, unit) {
  return `${grade || "ALL"}::${subject || "ALL"}::${unit || "ALL"}`;
}

function loadBests() {
  try {
    return JSON.parse(localStorage.getItem(BEST_STORAGE_KEY)) || {};
  } catch {
    return {};   // 壊れていた・使えない環境でも落ちないようにする
  }
}

function getBest(grade, subject, unit) {
  return loadBests()[scopeKey(grade, subject, unit)] || 0;
}

// 今回のスコアが自己ベストを超えていたら保存する。更新したら true を返す
function saveBestIfHigher(grade, subject, unit, finalScore) {
  const bests = loadBests();
  const key = scopeKey(grade, subject, unit);
  if (finalScore <= (bests[key] || 0)) return false;
  bests[key] = finalScore;
  try { localStorage.setItem(BEST_STORAGE_KEY, JSON.stringify(bests)); } catch {}
  return true;
}

// メニューに出す「n問　ベスト: n」のような文字列
function bestLabel(grade, subject, unit) {
  const best = getBest(grade, subject, unit);
  return best > 0 ? `ベスト ${best}` : "未挑戦";
}

// このアプリはスコアアタック（お遊び・タイムアタック）専用。
// 勉強モードのコードは残してあるが、メニューには出さない。
let mode = "scoreattack";          // "study" / "scoreattack"
let view = "menu";                 // "menu"（学年/教科/単元 えらび）/ "game"（プレイ中）
let selectedGrade = null;          // 選んだ学年（null = ぜんぶ）
let selectedSubject = null;        // 選んだ教科（null = ぜんぶ）
let selectedUnit = null;           // 選んだ単元（null = 教科まるごと）

// 今の学年・教科のしぼりこみに合う問題か
function matchesGrade(q)   { return !selectedGrade   || q.grade   === selectedGrade; }
function matchesSubject(q) { return !selectedSubject || q.subject === selectedSubject; }
const COMBO_STEPS = [1.0, 1.2, 1.5, 2.0];  // コンボ倍率（連続正解でこの順に上がる）
const CORRECT_BONUS = 50;          // 問題を1問正解したときのボーナス
const LAP_BONUS = 300;             // 全問を1周し切ったときのボーナス（正解ボーナスより大きく）
const BASE_TYPE_POINT = 1;         // タイプ1回の基本点
const TYPES_PER_LEVEL = 10;        // 連続成功が何回ごとに「タイプ1回の点」が +1 されるか
const TIME_LIMIT = 180;             // スコアアタックの制限時間（秒）

// これまでの連続正解数に応じた倍率
function comboMultiplier() {
  return COMBO_STEPS[Math.min(combo, COMBO_STEPS.length - 1)];
}

// 今の「タイプ1回の点」（連続成功が続くほど上がる）
function typeValue() {
  return BASE_TYPE_POINT + Math.floor(typeStreak / TYPES_PER_LEVEL);
}

// =============================================
//  出題プール＆出題順
// =============================================
let activePool = [];               // 今回出す QUESTIONS の添字（教科・単元でしぼったもの）
let order = [];                     // activePool を並べ替えたもの
let qPos = 0;                       // order の何番目を出しているか

// 配列をシャッフルした新しい配列を返す（フィッシャー–イェーツ法）
function shuffled(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// 選んだ学年・教科・単元にあう問題だけをプールに入れる
function buildPool() {
  activePool = QUESTIONS
    .map((_, i) => i)
    .filter(i => {
      const q = QUESTIONS[i];
      if (!SUBJECTS_ALLOWED.includes(q.subject)) return false;
      if (!matchesGrade(q)) return false;
      if (!matchesSubject(q)) return false;
      if (selectedUnit && q.unit !== selectedUnit) return false;
      return true;
    });
}

// 出題順を新しくシャッフルする
function buildOrder() {
  order = shuffled(activePool);
}

// =============================================
//  状態
// =============================================
let question = null;               // 今の問題

let phase = "question";             // "question"（問題文）/ "choices"（選択肢）/ "result"（結果）/ "timeup"（時間切れ）
let qMatcher = null;                // 問題文用マッチャー
let choiceList = [];                // 今の問題の選択肢 { display, reading }
let cMatchers = [];                 // 選択肢用マッチャー（choiceList と同じ並び）
let answeredIndex = -1;             // 選んだ選択肢の番号
let answeredCorrect = false;        // それが正解だったか

let answeredCount = 0;              // 答えた問題数
let correctCount = 0;              // 正解した問題数
let laps = 0;                       // 何周し切ったか（scoreattack）
let lapFlash = false;              // 直前に1周ボーナスが入ったか（結果画面に出す）
let combo = 0;                      // 今の連続正解数（問題）
let typeStreak = 0;                 // 今の連続成功タイプ数（ミスで0に戻る）
let score = 0;                      // スコア（scoreattack 用）
let isNewBest = false;               // 今回のスコアで自己ベストを更新したか

let misses = 0;                     // タイプミスの合計
let missFlash = false;              // 直前にミスしたか

let timeLeft = TIME_LIMIT;          // 残り秒（scoreattack）
let timerId = null;                 // setInterval の番号（動いているかの目印にもなる）

// 最初のキーでタイマー開始
function startTimer() {
  if (mode !== "scoreattack" || timerId !== null || phase === "timeup") return;
  const startedAt = Date.now();
  timerId = setInterval(() => {
    timeLeft = Math.max(0, TIME_LIMIT - (Date.now() - startedAt) / 1000);
    if (timeLeft <= 0) { endGame(); return; }
    renderTimer();   // 時間表示だけ更新（render() 全体だと選択肢などが0.1秒ごとに作り直されて演出が壊れる）
  }, 100);
}

// 時間切れ
function endGame() {
  clearInterval(timerId);
  timerId = null;
  timeLeft = 0;
  phase = "timeup";
  isNewBest = saveBestIfHigher(selectedGrade, selectedSubject, selectedUnit, score);
  render();
}

// タイプ成功1回（scoreattack のときだけ加点）
function registerTypeSuccess() {
  if (mode !== "scoreattack") return;
  score += typeValue();            // 今の「タイプ1回の点」を加算
  typeStreak += 1;                 // 連続成功カウント（次のタイプの点が上がっていく）
}

// タイプミス1回
function registerMiss() {
  misses += 1;
  typeStreak = 0;                  // 連続成功リセット → タイプ1回の点も基本に戻る
  if (mode === "scoreattack") score = Math.max(0, score - 1);
  flashMiss();
}

// 1問ぶんの解答（correct = 正解だったか）
function registerAnswer(correct) {
  answeredCount += 1;
  if (correct) {
    correctCount += 1;
    if (mode === "scoreattack") score += Math.round(CORRECT_BONUS * comboMultiplier());
    combo += 1;
  } else {
    combo = 0;   // 間違えるとコンボ切れ
  }

  // この問題が今の周の最後 → 1周ボーナス
  if (mode === "scoreattack" && qPos === order.length - 1) {
    laps += 1;
    score += LAP_BONUS;
    lapFlash = true;
  }
}

// 画面の部品
const menuEl    = document.getElementById("menu");
const gameEl    = document.getElementById("game");
const displayEl = document.getElementById("display");
const readingEl = document.getElementById("reading");
const romajiEl  = document.getElementById("romaji");
const choicesEl = document.getElementById("choices");
const infoEl    = document.getElementById("info");
const timerEl   = document.getElementById("timer");
const fallingLayerEl = document.getElementById("falling-images");

// =============================================
//  タイプするたびに降ってくるフルーツ
// =============================================
const FRUIT_IMAGES = [
  "image/いちご.png",
  "image/なし.png",
  "image/みかん.png",
  "image/もも.png",
  "image/りんご.png",
  "image/バナナ.png",
  "image/柿.png",
];
const MAX_FALLING = 40;   // 同時に落ちている数の上限（打つのが速い人でも増えすぎないように）

function spawnFallingFruit() {
  if (fallingLayerEl.childElementCount >= MAX_FALLING) return;

  const img = document.createElement("img");
  img.src = FRUIT_IMAGES[Math.floor(Math.random() * FRUIT_IMAGES.length)];
  img.className = "falling-fruit";

  const size = 36 + Math.random() * 28;         // 大きさをすこしバラつかせる
  const startLeft = Math.random() * 96;          // 画面のどこから落ちてくるか（%）
  const duration = 5 + Math.random() * 4;        // 5〜9秒かけてゆっくり落ちる
  const spin = (Math.random() < 0.5 ? -1 : 1) * (240 + Math.random() * 360); // 回転量・向き

  img.style.width = `${size}px`;
  img.style.left = `${startLeft}vw`;
  img.style.setProperty("--rot", `${spin}deg`);
  img.style.animationDuration = `${duration}s`;

  img.addEventListener("animationend", () => img.remove());
  fallingLayerEl.appendChild(img);
}

// =============================================
//  メニュー画面（モード → 教科 → 単元）
// =============================================
let menuItems = [];                // 今のメニューの選択肢 [{ key, label, sub, onPick }]
let menuBack = null;               // Esc を押したときに戻る先の関数（null なら戻れない）

// メニューを1枚表示する
function showMenu(title, items, back) {
  menuItems = items;
  menuBack = back;

  menuEl.innerHTML =
    `<h1 class="menu-title">${title}</h1>` +
    `<div class="menu-list">` +
    items.map((it, i) =>
      `<button class="menu-btn" data-i="${i}">` +
        `<span class="key">${it.key}</span>` +
        `<span class="menu-label">${it.label}</span>` +
        (it.sub ? `<span class="menu-sub">${it.sub}</span>` : "") +
      `</button>`
    ).join("") +
    `</div>` +
    (back ? `<p class="hint">Esc でもどる</p>` : "");

  menuEl.querySelectorAll(".menu-btn").forEach(btn => {
    btn.addEventListener("click", () => menuItems[+btn.dataset.i].onPick());
  });

  view = "menu";
  menuEl.hidden = false;
  gameEl.hidden = true;
}

// 1枚目：難易度えらび（最初の待機画面）
function showHome() {
  clearInterval(timerId);
  timerId = null;
  selectedGrade = null;
  selectedSubject = null;
  selectedUnit = null;

  const grades = GRADES.filter(g => QUESTIONS.some(q => q.grade === g));
  const items = grades.map((g, i) => ({
    key: String(i + 1),
    label: g,
    sub: `${QUESTIONS.filter(q => q.grade === g).length}問`,
    onPick: () => chooseGrade(g),
  }));
  items.push({
    key: String(grades.length + 1),
    label: "ぜんぶ",
    sub: `${QUESTIONS.length}問`,
    onPick: () => chooseGrade(null),
  });
  showMenu("四択タイピング｜難易度を えらぶ", items, null);
}

// 2枚目：教科えらび（理科・社会のみ）
function chooseGrade(g) {
  selectedGrade = g;
  const pool = QUESTIONS.filter(q => matchesGrade(q) && SUBJECTS_ALLOWED.includes(q.subject));
  const subjects = SUBJECTS_ALLOWED.filter(s => pool.some(q => q.subject === s));
  const items = subjects.map((s, i) => ({
    key: String(i + 1),
    label: s,
    sub: `${pool.filter(q => q.subject === s).length}問　${bestLabel(g, s, null)}`,
    onPick: () => chooseSubject(s),
  }));
  items.push({
    key: String(subjects.length + 1),
    label: "理科・社会ぜんぶからランダム",
    sub: `${pool.length}問　${bestLabel(g, null, null)}`,
    onPick: () => { selectedSubject = null; selectedUnit = null; beginGame(); },
  });
  showMenu(`${g || "ぜんぶ"}｜きょうかを えらぶ`, items, showHome);
}

// 3枚目：単元えらび
function chooseSubject(s) {
  selectedSubject = s;
  const pool = QUESTIONS.filter(q => matchesGrade(q) && q.subject === s);
  const units = [...new Set(pool.map(q => q.unit))];

  // 単元が1つ（またはゼロ）しかないなら、単元を分ける意味がないので選ばせずに始める
  if (units.length <= 1) {
    selectedUnit = null;
    beginGame();
    return;
  }

  const items = units.map((u, i) => ({
    key: String(i + 1),
    label: u,
    sub: `${pool.filter(q => q.unit === u).length}問　${bestLabel(selectedGrade, s, u)}`,
    onPick: () => { selectedUnit = u; beginGame(); },
  }));
  items.push({
    key: String(units.length + 1),
    label: `${s} ぜんぶ`,
    sub: `${pool.length}問　${bestLabel(selectedGrade, s, null)}`,
    onPick: () => { selectedUnit = null; beginGame(); },
  });
  showMenu(`${s}：たんげんを えらぶ`, items, () => chooseGrade(selectedGrade));
}

// ゲームのカウンターを全部リセット
function resetGameState() {
  clearInterval(timerId);
  timerId = null;
  timeLeft = TIME_LIMIT;
  answeredCount = 0;
  correctCount = 0;
  laps = 0;
  lapFlash = false;
  combo = 0;
  typeStreak = 0;
  score = 0;
  misses = 0;
  missFlash = false;
  isNewBest = false;
}

// ゲーム開始
function beginGame() {
  resetGameState();
  buildPool();
  buildOrder();
  loadQuestion(0);          // 先に問題を用意（この時点では view=menu なので描画はスキップ）
  view = "game";
  menuEl.hidden = true;
  gameEl.hidden = false;
  render();
}

// =============================================
//  問題の読み込み（pos = order の何番目か）
// =============================================
function loadQuestion(pos) {
  qPos = pos;
  question = QUESTIONS[order[pos]];
  phase = "question";
  qMatcher = createMatcher(question.reading);
  choiceList = (question.choices || []).map(normalizeChoice);
  cMatchers = choiceList.map(c => createMatcher(c.reading));
  answeredIndex = -1;
  answeredCorrect = false;
  lapFlash = false;
  render();
}

// =============================================
//  画面を今の状態どおりに描き直す
// =============================================
function render() {
  if (view !== "game") return;

  renderTimer();

  // --- 終了画面（時間切れ or 全問おわり） ---
  if (phase === "timeup" || phase === "finished") {
    displayEl.textContent = (phase === "timeup") ? "タイムアップ！" : "おわり！";
    readingEl.textContent = "";
    romajiEl.textContent = "";
    choicesEl.innerHTML = "";
    let result;
    if (mode === "scoreattack") {
      const best = getBest(selectedGrade, selectedSubject, selectedUnit);
      const bestText = isNewBest ? `🎉 自己ベスト更新！（${best}）` : `自己ベスト: ${best}`;
      result = `スコア: ${score}　${bestText}　正解: ${correctCount} / ${answeredCount}　ミス: ${misses}　周: ${laps}`;
    } else {
      result = `正解: ${correctCount} / ${answeredCount}　ミス: ${misses}`;
    }
    infoEl.textContent = `${result}　｜　R: もう一度　H: ホーム`;
    return;
  }

  displayEl.textContent = question.display || question.reading;

  // --- 2段目・3段目：問題文の読みとローマ字 ---
  if (phase === "question") {
    readingEl.innerHTML =
      `<span class="done">${matcherDoneKana(qMatcher)}</span>${matcherRestKana(qMatcher)}`;

    const rest = matcherRestRomaji(qMatcher);
    const nextClass = missFlash ? "next miss" : "next";
    romajiEl.innerHTML =
      `<span class="done">${matcherDoneRomaji(qMatcher)}</span>` +
      `<span class="${nextClass}">${rest.slice(0, 1)}</span>${rest.slice(1)}`;
  } else {
    // 選択肢フェーズ以降は、問題文はグレーで出しておく
    readingEl.innerHTML = `<span class="done">${question.reading}</span>`;
    romajiEl.textContent = "";
  }

  // --- 選択肢 ---
  renderChoices();

  // --- 情報ぎょう ---
  renderInfo();
}

// 残り時間の表示（scoreattack のみ）
function renderTimer() {
  if (mode !== "scoreattack") {
    timerEl.textContent = "";
    return;
  }
  if (phase === "timeup") {
    timerEl.textContent = "残り 0 秒";
    timerEl.classList.add("low");
    return;
  }
  const sec = Math.ceil(timeLeft);
  timerEl.textContent = `残り ${sec} 秒`;
  timerEl.classList.toggle("low", sec <= 10);
}

function renderChoices() {
  if (phase === "question" || cMatchers.length === 0) {
    choicesEl.innerHTML = "";
    return;
  }

  choicesEl.innerHTML = cMatchers.map((m, i) => {
    const label = i + 1;
    const ch = choiceList[i];
    const hasKanji = ch.display !== ch.reading;
    let cls = "choice";

    if (phase === "result" && i === answeredIndex) {
      cls += answeredCorrect ? " correct" : " wrong";
    }
    if (phase === "result" && isAnswerChoice(ch)) {
      cls += " answer";
    }

    // 打ち終わっていない状態で「色つき」を出すか
    const showProgress = phase === "choices" && !m.dead;

    // 読みの部分
    const yomi = showProgress
      ? `<span class="done">${matcherDoneKana(m)}</span>${matcherRestKana(m)}`
      : ch.reading;

    // ローマ字の部分
    const roma = showProgress
      ? `<span class="done">${matcherDoneRomaji(m)}</span>${matcherRestRomaji(m)}`
      : matcherFullRomaji(m);

    if (m.dead && phase === "choices") cls += " dead";

    // 漢字あり：漢字＋読み＋ローマ字 / 漢字なし：読み＋ローマ字
    const romaBlock = `<span class="roma">${roma}</span>`;
    const body = hasKanji
      ? `<span class="kanji">${ch.display}</span><span class="yomi">${yomi}</span>${romaBlock}`
      : `${yomi}${romaBlock}`;

    return `<div class="${cls}"><span class="num">${label}</span>${body}</div>`;
  }).join("");
}

function renderInfo() {
  const total = order.length;          // 今回の出題数（しぼりこみ後）
  const isLast = qPos === total - 1;

  // 右側に出す「成績」部分（モードで変える）
  const lapText = laps > 0 ? `　周: ${laps}` : "";
  const stats = (mode === "scoreattack")
    ? `スコア: ${score}　1タイプ${typeValue()}点(連続${typeStreak})　コンボ: ${combo}　ミス: ${misses}${lapText}`
    : `正解: ${correctCount} / ${answeredCount}　ミス: ${misses}`;

  if (phase === "result") {
    const answerChoice = choiceList.find(isAnswerChoice);
    const answerText = answerChoice ? answerChoice.display : question.answer;
    let head = answeredCorrect ? "正解！" : `不正解… 正解は「${answerText}」`;
    if (lapFlash) head += `　🎉 ${laps}周クリア！ +${LAP_BONUS}`;
    const tail = (mode !== "scoreattack" && isLast)
      ? "Enter で結果へ"
      : "Enter で次へ";
    infoEl.textContent = `${head}　${tail}　｜　${stats}`;
  } else {
    const scope = `${selectedGrade || "ぜんぶ"}/${selectedUnit || selectedSubject || "ランダム"}`;
    const act = (phase === "choices") ? "　答えをタイプして Enter" : "";
    infoEl.textContent = `[${scope}] ${qPos + 1} / ${total} 問目${act}　｜　${stats}`;
  }
}

// 次の問題へ。
// scoreattack は最後まで行ったら、順番をシャッフルし直して先頭から
function goNextQuestion() {
  if (qPos < order.length - 1) {
    loadQuestion(qPos + 1);
  } else if (mode === "scoreattack") {
    buildOrder();          // 出題順を新しくシャッフル
    loadQuestion(0);
  } else {
    phase = "finished";    // study モードは全問おわりで終了画面へ
    render();
  }
}

// ミスしたとき、一瞬赤くする
function flashMiss() {
  missFlash = true;
  render();
  setTimeout(() => { missFlash = false; render(); }, 150);
}

// =============================================
//  キー入力：フェーズごとに処理を分ける
// =============================================
document.addEventListener("keydown", (e) => {
  // --- メニュー画面：数字キーで選択、Esc で1つもどる ---
  if (view === "menu") {
    if (e.key === "Escape") { if (menuBack) menuBack(); return; }
    const it = menuItems.find(x => x.key === e.key);
    if (it) it.onPick();
    return;
  }

  // --- ゲーム画面 ---
  if (e.key === "Escape") { showHome(); return; }

  // 終了画面：R でもう一度、H でメニュー最初へ
  if (phase === "timeup" || phase === "finished") {
    if (e.key.toLowerCase() === "r") beginGame();      // 同じしぼりこみでもう一度
    else if (e.key.toLowerCase() === "h") showHome();
    return;
  }

  startTimer();                         // 最初のキーでタイマー開始（2回目以降は無視される）

  if (phase === "result") {
    if (e.key === "Enter") goNextQuestion();
    return;
  }

  // 選択肢フェーズ：Enter で「打ち終わっている選択肢」を確定
  if (phase === "choices" && e.key === "Enter") {
    e.preventDefault();
    submitChoice();
    return;
  }

  if (e.key.length !== 1) return;
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  e.preventDefault();

  const key = e.key.toLowerCase();

  if (phase === "question") {
    handleQuestionKey(key);
  } else if (phase === "choices") {
    handleChoiceKey(key);
  }
});

// --- 問題文フェーズ ---
function handleQuestionKey(key) {
  const result = matcherPress(qMatcher, key);
  if (result === "miss") {
    registerMiss();
    return;
  }
  registerTypeSuccess();   // "ok" でも "done" でもタイプ成功
  spawnFallingFruit();
  if (result === "done") {
    // 選択肢があれば選択肢フェーズへ。なければそのまま結果へ
    if (cMatchers.length > 0) {
      phase = "choices";
    } else {
      phase = "result";
      answeredCorrect = true;
      registerAnswer(true);
    }
  }
  render();
}

// --- 選択肢フェーズ ---
function handleChoiceKey(key) {
  const alive = cMatchers.filter(m => !m.dead && !matcherIsDone(m));

  // まず「壊さずに」全部お試し。1つでも受理されるなら本適用
  const tries = alive.map(m => ({ m, ...matcherTry(m, key) }));
  const anyAccepts = tries.some(t => t.result !== "miss");

  if (!anyAccepts) {
    registerMiss();   // どの選択肢としてもありえないキー
    return;
  }
  registerTypeSuccess();   // 少なくとも1つの選択肢を進められた＝タイプ成功
  spawnFallingFruit();

  // 本適用：受理された選択肢は進め、外れた選択肢は脱落
  for (const t of tries) {
    if (t.result === "miss") {
      t.m.dead = true;
    } else {
      Object.assign(t.m, t.clone);
    }
  }

  // 迷いがなければ即確定：
  // 打ち終わった選択肢があり、かつ「まだ途中の候補」が残っていない
  const someDone     = cMatchers.some(matcherIsDone);
  const partialAlive = cMatchers.some(m => !m.dead && !matcherIsDone(m));
  if (someDone && !partialAlive) {
    submitChoice();
    return;
  }

  render();
}

// 打ち終わっている選択肢を確定する（複数あればいちばん長いもの）
function submitChoice() {
  const done = cMatchers.filter(matcherIsDone);
  if (done.length === 0) return;   // まだどれも打ち終わっていない

  const finished = done.reduce((a, b) => (b.reading.length > a.reading.length ? b : a));
  answeredIndex = cMatchers.indexOf(finished);
  answeredCorrect = isAnswerChoice(choiceList[answeredIndex]);
  registerAnswer(answeredCorrect);
  phase = "result";
  render();
}

// =============================================
//  questions.json の読みを掃除する
//  他AIで生成すると「、」「。」などがまぎれこみがち。
//  reading はキー入力の対象なので、打てない記号は自動で取り除く。
// =============================================
function sanitizeReading(r) {
  return r.replace(/[、。，．,.\s！？!?・…]/g, "");
}

function sanitizeQuestions() {
  let cleanedCount = 0;

  QUESTIONS.forEach(q => {
    if (q.reading) {
      const cleaned = sanitizeReading(q.reading);
      if (cleaned !== q.reading) { q.reading = cleaned; cleanedCount++; }
    }
    if (q.choices) {
      q.choices = q.choices.map(c => {
        if (typeof c === "string") return sanitizeReading(c);
        const cleaned = sanitizeReading(c.reading || "");
        if (cleaned !== c.reading) cleanedCount++;
        return { ...c, reading: cleaned };
      });
    }
    if (q.answer) q.answer = sanitizeReading(q.answer);
  });

  if (cleanedCount > 0) {
    console.log(`🧹 questions.json: ${cleanedCount}箇所の reading から句読点などを自動で取り除きました`);
  }
}

// =============================================
//  questions.json のチェック（おかしい問題を Console に警告）
// =============================================
function validateQuestions() {
  const kanaOnly = /^[ぁ-ゖー]+$/;   // ひらがな＋長音のみ
  const problems = [];

  QUESTIONS.forEach((q, i) => {
    const tag = `Q${i + 1}`;

    if (!GRADES.includes(q.grade)) problems.push(`${tag}: grade は ${GRADES.join(" / ")} のどれかにして（今: "${q.grade}"）`);
    if (!q.subject || !q.unit) problems.push(`${tag}: subject / unit がない`);
    else if (!SUBJECTS_ALLOWED.includes(q.subject)) {
      problems.push(`${tag}: subject は ${SUBJECTS_ALLOWED.join(" / ")} のどちらか（今: "${q.subject}"）`);
    }
    if (!q.reading) {
      problems.push(`${tag}: reading がない`);
    } else if (!kanaOnly.test(q.reading)) {
      problems.push(`${tag}: reading はひらがなだけにして（今: "${q.reading}"）`);
    }

    if (q.choices === undefined) return;   // 4択なし問題はここまで

    if (q.choices.length !== 4) {
      problems.push(`${tag}: choices はちょうど4つ（今: ${q.choices.length}）`);
    }

    const readings = q.choices.map(c => (typeof c === "string" ? c : c.reading));
    readings.forEach((r, j) => {
      if (!r || !kanaOnly.test(r)) {
        problems.push(`${tag}: 選択肢${j + 1} の reading がひらがなでない（今: "${r}"）`);
      }
    });

    // 片方がもう片方の先頭になっていないか
    for (let a = 0; a < readings.length; a++) {
      for (let b = 0; b < readings.length; b++) {
        if (a !== b && readings[a] && readings[b] && readings[b].startsWith(readings[a])) {
          problems.push(`${tag}: 選択肢「${readings[a]}」が「${readings[b]}」の先頭になっている（区別できない）`);
        }
      }
    }

    // answer が choices の中にあるか
    const displays = q.choices.map(c => (typeof c === "string" ? c : c.display));
    if (!readings.includes(q.answer) && !displays.includes(q.answer)) {
      problems.push(`${tag}: answer "${q.answer}" が choices の中にない`);
    }
  });

  if (problems.length > 0) {
    console.warn("⚠️ questions.json に問題があります:\n" + problems.join("\n"));
  } else {
    console.log(`✅ questions.json OK（${QUESTIONS.length}問）`);
  }
}

// questions.json を読み込めなかったときに、メニュー画面へエラーを出す
function showLoadError(err) {
  console.error(err);
  view = "menu";
  gameEl.hidden = true;
  menuEl.hidden = false;
  menuEl.innerHTML = `
    <h1 class="menu-title">読み込みエラー</h1>
    <p class="hint">問題データを読み込めませんでした。</p>
    <p class="hint">
      ・index.html を <b>ダブルクリックではなく</b> ローカルサーバー経由で開いていますか？<br>
      　（file:// では fetch がブロックされます）<br>
      　例：ターミナルでこのフォルダに入り <code>python3 -m http.server</code> を実行 →
      　ブラウザで <code>http://localhost:8000/</code> を開く<br>
      ・questions.json 内のカンマの付け忘れ・余分なカンマもよくある原因です<br>
      　下のエラー内容、または F12 → Console にどのファイルかが出ます
    </p>
    <p class="hint">${err.message || err}</p>`;
}

// =============================================
//  問題ファイルの置き場所（学年・教科ごとに分けて管理）
//  ここに1行足せば、新しい学年・教科のファイルも読み込むようになる
// =============================================
const QUESTION_FILES = [
  "問題ファイル/中学生/理科（中学生）/questions.json",
  "問題ファイル/中学生/社会（中学生）/questions.json",
  "問題ファイル/高校生/理科（高校生）/questions.json",
  "問題ファイル/高校生/社会（高校生）/questions.json",
];

// 1ファイル分を読み込む。まだ問題を置いていないファイル（404）は「0問」として扱う
async function loadQuestionFile(path) {
  const res = await fetch(path);

  if (res.status === 404) {
    console.warn(`⚠️ ${path} が見つかりません（0問として扱います）`);
    return [];
  }
  if (!res.ok) {
    throw new Error(`${path} の取得に失敗しました（HTTP ${res.status}）`);
  }
  try {
    return await res.json();
  } catch (e) {
    // どのファイルのJSONが壊れているか分かるようにする
    throw new Error(`${path} のJSONが壊れています： ${e.message}`);
  }
}

// =============================================
//  スタート：問題ファイルを全部読み込んで合体する → チェック → メニュー1枚目を表示
// =============================================
async function start() {
  try {
    const parts = await Promise.all(QUESTION_FILES.map(loadQuestionFile));
    QUESTIONS = parts.flat();
  } catch (err) {
    showLoadError(err);
    return;
  }

  sanitizeQuestions();
  validateQuestions();
  showHome();
}

start();
