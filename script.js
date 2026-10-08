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
  "ー":"-",

  // 小さい母音（外来語などに使う）。単独で出てきたとき用のフォールバック
  "ぁ":["la","xa"],"ぃ":["li","xi"],"ぅ":["lu","xu"],"ぇ":["le","xe"],"ぉ":["lo","xo"],"ゎ":["lwa","xwa"],"ゃ":["lya","xya"],"ゅ":["lyu","xyu"],"ょ":["lyo","xyo"],
  // 小さい母音との組み合わせ（外来語表記でよく使う2文字のかたまり）
  "うぃ":"wi","うぇ":"we","うぉ":"wo",
  "ゔ":"vu","ゔぁ":"va","ゔぃ":"vi","ゔぇ":"ve","ゔぉ":"vo",
  "しぇ":"she","じぇ":"je","ちぇ":"che",
  "つぁ":"tsa","つぃ":"tsi","つぇ":"tse","つぉ":"tso",
  "てぃ":["ti","thi"],"でぃ":["di","dhi"],"てゅ":"tyu","でゅ":"dyu",
  "とぅ":"twu","どぅ":"dwu",
  "ふぁ":"fa","ふぃ":"fi","ふぇ":"fe","ふぉ":"fo","ふゅ":"fyu",
  "くぁ":["qa","kwa"],"くぃ":["qi","kwi"],"くぇ":["qe","kwe"],"くぉ":["qo","kwo"],
  "ぐぁ":"gwa",

  "1":"1","2":"2","3":"3","4":"4","5":"5","6":"6","7":"7","8":"8","9":"9","0":"0",

  // 大文字は表示（kana）としては大文字のまま、打つときは小文字でいいように変換先は小文字にする
  // （キー入力は常に小文字化して照合する仕組みなので、変換先を大文字にすると一致しなくなる）
  "A":"a","B":"b","C":"c","D":"d","E":"e","F":"f","G":"g","H":"h","I":"i","J":"j","K":"k","L":"l","M":"m","N":"n","O":"o","P":"p","Q":"q","R":"r","S":"s","T":"t","U":"u","V":"v","W":"w","X":"x","Y":"y","Z":"z",
  "a":"a","b":"b","c":"c","d":"d","e":"e","f":"f","g":"g","h":"h","i":"i","j":"j","k":"k","l":"l","m":"m","n":"n","o":"o","p":"p","q":"q","r":"r","s":"s","t":"t","u":"u","v":"v","w":"w","x":"x","y":"y","z":"z",
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

// 任意の問題 q について「正解の表示名」を求める（復習ログなど、今のお題以外にも使う版）
function answerDisplayOf(q) {
  const match = (q.choices || []).map(normalizeChoice).find(c => c.reading === q.answer || c.display === q.answer);
  return match ? match.display : q.answer;
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

// =============================================
//  バッジ（実績）・生涯ベスト・前回ログ の保存
//  すべて「1回のプレイ結果」だけから判定できる条件にしてある
// =============================================
const BADGE_STORAGE_KEY = "typing4-badges";
const LIFETIME_STORAGE_KEY = "typing4-lifetime";
const LASTRUN_STORAGE_KEY = "typing4-lastrun";

function loadBadges() {
  try { return JSON.parse(localStorage.getItem(BADGE_STORAGE_KEY)) || {}; } catch { return {}; }
}
function saveBadges(obj) {
  try { localStorage.setItem(BADGE_STORAGE_KEY, JSON.stringify(obj)); } catch {}
}

function loadLifetime() {
  try { return JSON.parse(localStorage.getItem(LIFETIME_STORAGE_KEY)) || {}; } catch { return {}; }
}
function updateLifetime(r) {
  const lt = loadLifetime();
  lt.bestCpm = Math.max(lt.bestCpm || 0, r.cpm);
  lt.maxTypeStreak = Math.max(lt.maxTypeStreak || 0, r.maxTypeStreak);
  lt.bestAccuracy = Math.max(lt.bestAccuracy || 0, r.accuracy);
  try { localStorage.setItem(LIFETIME_STORAGE_KEY, JSON.stringify(lt)); } catch {}
}

function persistLastRunSummary(r) {
  try {
    localStorage.setItem(LASTRUN_STORAGE_KEY, JSON.stringify({
      grade: r.grade, subject: r.subject, unit: r.unit,
      score: r.score, accuracy: r.accuracy, cpm: r.cpm,
      missCount: r.missLog.length,
    }));
  } catch {}
}
function loadLastRunSummary() {
  try { return JSON.parse(localStorage.getItem(LASTRUN_STORAGE_KEY)); } catch { return null; }
}

// バッジ一覧。新しいバッジを足したいときはこの配列に1個オブジェクトを足すだけでよい
// （判定・保存・一覧表示・カテゴリしぼりこみはぜんぶこの配列から自動で回る）
// condition(r)      : 直前の1プレイの結果 r から「このバッジを解除してよいか」を判定
// progressValue(lt) : まだ解除されていないとき、バッジ画面に出す進捗（任意）
// achievedText(lt)  : 解除済みのとき、バッジ画面に出す「記録」の文言
const BADGES = [
  {
    id: "sonic_breaker", title: "音速突破", titleEn: "Sonic Breaker", icon: "speed", category: "speed", color: "primary",
    desc: "タイピング速度 250 CPM 以上を達成",
    condition: r => r.cpm >= 250, progressValue: lt => lt.bestCpm || 0, target: 250, unit: "CPM",
    achievedText: lt => `記録: ${lt.bestCpm || 0} CPM 達成`,
  },
  {
    id: "lightspeed_typist", title: "光速のタイピスト", titleEn: "Light-speed Typist", icon: "flash_on", category: "speed", color: "primary",
    desc: "タイピング速度 350 CPM 以上を達成",
    condition: r => r.cpm >= 350, progressValue: lt => lt.bestCpm || 0, target: 350, unit: "CPM",
    achievedText: lt => `記録: ${lt.bestCpm || 0} CPM 達成`,
  },
  {
    id: "flawless_pilot", title: "ノーミス航行", titleEn: "Flawless Pilot", icon: "verified", category: "accuracy", color: "tertiary",
    desc: "ミス入力ゼロで1プレイをクリア",
    condition: r => r.answeredCount > 0 && r.misses === 0,
    achievedText: () => `記録: ノーミスでクリア達成`,
  },
  {
    id: "combo_master", title: "コンボマスター", titleEn: "Combo Master", icon: "bolt", category: "accuracy", color: "secondary",
    desc: "ミスなく50打鍵連続成功（コンボ継続）",
    condition: r => r.maxTypeStreak >= 50, progressValue: lt => lt.maxTypeStreak || 0, target: 50, unit: "打鍵",
    achievedText: lt => `記録: 最大 ${lt.maxTypeStreak || 0} 打鍵`,
  },
  {
    id: "warp_ignition", title: "超光速スタート", titleEn: "Warp Ignition", icon: "rocket_launch", category: "speed", color: "primary",
    desc: "最初のキー入力をミスなく打てた",
    condition: r => r.answeredCount > 0 && r.firstKeyWasMiss === false,
    achievedText: () => `記録: ノーミススタート達成`,
  },
  {
    id: "first_step", title: "タイピング初心者", titleEn: "First Step", icon: "school", category: "speed", color: "secondary",
    desc: "はじめてスコアアタックを完了した",
    condition: r => r.answeredCount > 0,
    achievedText: () => `記録: チュートリアル完了`,
  },
  {
    id: "century_striker", title: "百連撃の覚醒", titleEn: "Century Striker", icon: "all_inclusive", category: "accuracy", color: "secondary",
    desc: "ミスなしで100打鍵連続成功",
    condition: r => r.maxTypeStreak >= 100, progressValue: lt => lt.maxTypeStreak || 0, target: 100, unit: "打鍵",
    achievedText: lt => `記録: 最大 ${lt.maxTypeStreak || 0} 打鍵`,
  },
  {
    id: "precision_master", title: "精密機械", titleEn: "Precision Master", icon: "track_changes", category: "accuracy", color: "tertiary",
    desc: "1プレイの正解率98%以上を達成",
    condition: r => r.answeredCount >= 4 && r.accuracy >= 98, progressValue: lt => lt.bestAccuracy || 0, target: 98, unit: "%",
    achievedText: lt => `記録: 正解率 ${lt.bestAccuracy || 0}% 達成`,
  },
];

const BADGE_CATEGORY_LABELS = { speed: "速度", accuracy: "精度・コンボ" };

// バッジの色テーマ（解除済みのときだけ使う。未解除は常にグレー）
const BADGE_COLOR_THEMES = {
  primary:   { border: "border-primary/20 hover:border-primary/50", text: "text-primary-fixed", iconGlow: "shadow-[0_0_20px_rgba(0,240,255,0.3)]" },
  secondary: { border: "border-secondary/20 hover:border-secondary/50", text: "text-secondary", iconGlow: "shadow-[0_0_20px_rgba(208,188,255,0.3)]" },
  tertiary:  { border: "border-tertiary-fixed/20 hover:border-tertiary-fixed/50", text: "text-tertiary-fixed", iconGlow: "shadow-[0_0_20px_rgba(255,218,168,0.3)]" },
};

function checkBadges(r) {
  const unlocked = loadBadges();
  const newly = [];
  BADGES.forEach(b => {
    if (!unlocked[b.id] && b.condition(r)) { unlocked[b.id] = true; newly.push(b.id); }
  });
  if (newly.length > 0) saveBadges(unlocked);
  return newly;
}

// 1プレイの結果だけから出す評価ランク（レベルやEXPのような永続値ではなく、毎回その場で計算し直す）
function computeGrade({ accuracy, cpm, answeredCount }) {
  if (answeredCount === 0) return { letter: "-", tier: "NO DATA", title: "記録なし", sub: "" };
  if (accuracy >= 95 && cpm >= 250) return { letter: "S", tier: "TITANIUM", title: "銀河の航海士", sub: "ELITE STELLAR NAVIGATOR" };
  if (accuracy >= 90 && cpm >= 180) return { letter: "A", tier: "PLATINUM", title: "熟練パイロット", sub: "SKILLED PILOT" };
  if (accuracy >= 75) return { letter: "B", tier: "GOLD", title: "見習いパイロット", sub: "ROOKIE PILOT" };
  return { letter: "C", tier: "SILVER", title: "新人パイロット", sub: "CADET" };
}

// このアプリはスコアアタック（お遊び・タイムアタック）専用。
let view = "home";                 // "home" / "game" / "result" / "review" / "badge"
let selectedGrade = null;          // 選んだ学年（null = ぜんぶ）
let selectedSubject = null;        // 選んだ教科（null = ぜんぶ）
let selectedUnit = null;           // 選んだ単元（null = 教科まるごと）

// 今の学年・教科のしぼりこみに合う問題か
function matchesGrade(q)   { return !selectedGrade   || q.grade   === selectedGrade; }
function matchesSubject(q) { return !selectedSubject || q.subject === selectedSubject; }
const CORRECT_BONUS = 50;          // 問題を1問正解したときのボーナス
const LAP_BONUS = 300;             // 全問を1周し切ったときのボーナス（正解ボーナスより大きく）
const BASE_TYPE_POINT = 1;         // タイプ1回の基本点
const TIME_LIMIT = 180;             // スコアアタックの制限時間（秒）

// コンボ＝連続でミスなくタイプできたキー数（typeStreak）。ミス1回で0に戻る。
const COMBO_STEP_KEYS = 15;       // ミスなく何キー打つごとに倍率が1段階上がるか
const COMBO_STEP_SIZE = 0.2;      // 1段階で上がる倍率
const COMBO_MAX_STEPS = 10;       // 最大で何段階まで上がるか（1.0 + 0.2×10 = 3.0x で据え置き）

// 連続タイプ成功数（コンボ）に応じた倍率。正解ボーナス・タイプ1回の点の両方にかける
function comboMultiplier() {
  const level = Math.min(Math.floor(typeStreak / COMBO_STEP_KEYS), COMBO_MAX_STEPS);
  return Math.round((1 + COMBO_STEP_SIZE * level) * 10) / 10;
}

// 今の「タイプ1回の点」（コンボ倍率がかかる）
function typeValue() {
  return Math.round(BASE_TYPE_POINT * comboMultiplier());
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

let phase = "choices";               // "choices"（選択肢）/ "result"（結果）/ "timeup"（時間切れ）
let choiceList = [];                // 今の問題の選択肢 { display, reading }
let cMatchers = [];                 // 選択肢用マッチャー（choiceList と同じ並び）
let answeredIndex = -1;             // 選んだ選択肢の番号
let answeredCorrect = false;        // それが正解だったか

let answeredCount = 0;              // 答えた問題数
let correctCount = 0;              // 正解した問題数
let laps = 0;                       // 何周し切ったか
let lapFlash = false;              // 直前に1周ボーナスが入ったか（結果画面に出す）
let typeStreak = 0;                 // 今の連続成功タイプ数＝コンボ（ミスで0に戻る）
let maxTypeStreak = 0;              // このプレイで到達した最大連続成功タイプ数（バッジ判定用）
let score = 0;                      // スコア
let isNewBest = false;               // 今回のスコアで自己ベストを更新したか

let typedTotal = 0;                 // このプレイで正しく打てた回数の合計（CPM計算用）
let peakCpm = 0;                    // このプレイ中に到達したライブCPMの最大値
let misses = 0;                     // タイプミスの合計
let missFlash = false;              // 直前にミスしたか
let firstKeyWasMiss = null;         // このプレイの最初の1打がミスだったか（バッジ判定用）
let missLog = [];                   // このプレイでミス・不正解になった問題のログ（復習ログ用）
let lastRunResult = null;           // 直前のプレイ結果（結果画面・復習ログ・バッジ判定に使う）

let timeLeft = TIME_LIMIT;          // 残り秒
let timerId = null;                 // setInterval の番号（動いているかの目印にもなる）

// 今の問題について、ミスログの該当エントリを探す（なければ作る）
function getMissEntry() {
  let e = missLog.find(x => x.q === question);
  if (!e) { e = { q: question, missCount: 0, wrong: false }; missLog.push(e); }
  return e;
}

// 最初のキーでタイマー開始
function startTimer() {
  if (timerId !== null || phase === "timeup") return;
  const startedAt = Date.now();
  timerId = setInterval(() => {
    timeLeft = Math.max(0, TIME_LIMIT - (Date.now() - startedAt) / 1000);
    if (timeLeft <= 0) { endGame(); return; }
    tickTimerDisplay();   // 時間表示だけ更新（全体を描き直すと選択肢などの演出が壊れる）
  }, 100);
  tickTimerDisplay();
}

// このプレイの結果をひとつのオブジェクトにまとめる（結果画面・復習ログ・バッジ判定の元データ）
function buildRunResult() {
  const minutes = TIME_LIMIT / 60;
  const cpm = Math.round(typedTotal / minutes);
  const totalKeys = typedTotal + misses;
  const accuracy = totalKeys > 0 ? Math.round((typedTotal / totalKeys) * 1000) / 10 : 100;
  const grade = computeGrade({ accuracy, cpm, answeredCount });
  const avgIntervalMs = typedTotal > 0 ? Math.round((TIME_LIMIT * 1000) / typedTotal) : 0;
  return {
    grade: selectedGrade, subject: selectedSubject, unit: selectedUnit,
    score, correctCount, answeredCount, misses, laps,
    cpm, peakCpm, accuracy, avgIntervalMs, maxTypeStreak, firstKeyWasMiss,
    gradeLetter: grade.letter, gradeTier: grade.tier, gradeTitle: grade.title, gradeSub: grade.sub,
    missLog: missLog.slice(),
  };
}

// 時間切れ
function endGame() {
  clearInterval(timerId);
  timerId = null;
  timeLeft = 0;
  phase = "timeup";

  const r = buildRunResult();
  const prevBest = getBest(selectedGrade, selectedSubject, selectedUnit);
  isNewBest = saveBestIfHigher(selectedGrade, selectedSubject, selectedUnit, score);
  r.isNewBest = isNewBest;
  r.prevBest = prevBest;

  updateLifetime(r);
  r.newlyUnlocked = checkBadges(r);

  lastRunResult = r;
  persistLastRunSummary(r);

  renderResultScreen(r);
  showScreen("result");
}

// タイプ成功1回
function registerTypeSuccess() {
  score += typeValue();            // 今の「タイプ1回の点」を加算
  typeStreak += 1;                 // 連続成功カウント（次のタイプの点が上がっていく）
  maxTypeStreak = Math.max(maxTypeStreak, typeStreak);
  typedTotal += 1;
  if (firstKeyWasMiss === null) firstKeyWasMiss = false;
}

// タイプミス1回
function registerMiss() {
  misses += 1;
  typeStreak = 0;                  // 連続成功リセット → タイプ1回の点も基本に戻る
  score = Math.max(0, score - 1);
  if (firstKeyWasMiss === null) firstKeyWasMiss = true;
  if (question) getMissEntry().missCount += 1;
  flashMiss();
}

// 1問ぶんの解答（correct = 正解だったか）
function registerAnswer(correct) {
  answeredCount += 1;
  if (correct) {
    correctCount += 1;
    score += Math.round(CORRECT_BONUS * comboMultiplier());
  } else {
    if (question) getMissEntry().wrong = true;
  }

  // この問題が今の周の最後 → 1周ボーナス
  if (qPos === order.length - 1) {
    laps += 1;
    score += LAP_BONUS;
    lapFlash = true;
  }
}

// =============================================
//  画面の部品
// =============================================
const homeDashboardEl  = document.getElementById("home-dashboard");
const homeLastRunBarEl = document.getElementById("home-lastrun-bar");
const homeLastRunTextEl = document.getElementById("home-lastrun-text");
const homeBestScoreEl  = document.getElementById("home-best-score");

const gScopeLabelEl   = document.getElementById("g-scope-label");
const gUnitLabelEl    = document.getElementById("g-unit-label");
const gWarpEl         = document.getElementById("g-warp");
const gProgressPctEl  = document.getElementById("g-progress-pct");
const gTimerEl        = document.getElementById("g-timer");
const gTimerBarEl     = document.getElementById("g-timer-bar");
const gScoreEl        = document.getElementById("g-score");
const gComboEl        = document.getElementById("g-combo");
const gMissEl         = document.getElementById("g-miss");
const gStreakEl       = document.getElementById("g-streak");
const gBoostEl        = document.getElementById("g-boost");
const gCpmLiveEl      = document.getElementById("g-cpm-live");
const gAccLiveEl      = document.getElementById("g-acc-live");
const gQLabelEl       = document.getElementById("g-qlabel");
const gDisplayEl      = document.getElementById("g-display");
const gChoicesEl      = document.getElementById("g-choices");
const gInfoEl         = document.getElementById("g-info");

// 選択肢ポッドの位置ごとの配色（見た目のバリエーション用。意味はない）
const POD_THEMES = [
  { text: "text-primary-fixed-dim", borderActive: "border-2 border-primary-fixed-dim", borderStandby: "border border-surface-container-highest",
    glow: "shadow-[0_0_30px_rgba(0,219,233,0.35)]",
    numActive: "bg-gradient-to-tr from-primary-container to-primary-fixed-dim text-on-primary-container shadow-[0_0_20px_rgba(0,240,255,0.7)]",
    numStandby: "bg-surface-container-highest text-on-surface-variant",
    bar: "bg-gradient-to-r from-primary-container to-primary-fixed-dim",
    pillActive: "bg-primary-container/20 border border-primary-fixed-dim/50 text-primary-fixed-dim" },
  { text: "text-secondary", borderActive: "border-2 border-secondary", borderStandby: "border border-secondary/20",
    glow: "shadow-[0_0_24px_rgba(208,188,255,0.3)]",
    numActive: "bg-secondary-container text-secondary-fixed shadow-[0_0_18px_rgba(208,188,255,0.5)]",
    numStandby: "bg-secondary-container/40 text-secondary",
    bar: "bg-secondary",
    pillActive: "bg-secondary/20 border border-secondary/50 text-secondary" },
  { text: "text-primary-fixed", borderActive: "border-2 border-primary-fixed/70", borderStandby: "border border-surface-container-highest",
    glow: "shadow-[0_0_24px_rgba(125,244,255,0.3)]",
    numActive: "bg-primary-fixed text-on-primary-container shadow-[0_0_18px_rgba(125,244,255,0.5)]",
    numStandby: "bg-surface-container-highest text-on-surface-variant",
    bar: "bg-primary-fixed",
    pillActive: "bg-primary-fixed/20 border border-primary-fixed/50 text-primary-fixed" },
  { text: "text-tertiary-fixed-dim", borderActive: "border-2 border-tertiary-fixed-dim", borderStandby: "border border-tertiary-fixed-dim/20",
    glow: "shadow-[0_0_24px_rgba(255,186,32,0.35)]",
    numActive: "bg-tertiary-fixed-dim text-on-tertiary-container shadow-[0_0_18px_rgba(255,186,32,0.5)]",
    numStandby: "bg-tertiary-container/30 text-tertiary-fixed-dim",
    bar: "bg-tertiary-fixed-dim",
    pillActive: "bg-tertiary-fixed-dim/20 border border-tertiary-fixed-dim/50 text-tertiary-fixed-dim" },
];

// 今の経過時間からのライブCPM・正解率（結果画面の確定値とは別の、プレイ中のおおよその目安）
function liveElapsedMinutes() { return Math.max(TIME_LIMIT - timeLeft, 1) / 60; }
function liveCpm() { return typedTotal === 0 ? 0 : Math.round(typedTotal / liveElapsedMinutes()); }
function liveAccuracy() {
  const total = typedTotal + misses;
  return total > 0 ? Math.round((typedTotal / total) * 1000) / 10 : 100;
}

const rNewBestEl    = document.getElementById("r-newbest");
const rTitleEl      = document.getElementById("r-title");
const rGradeEl      = document.getElementById("r-grade");
const rGradeTierEl  = document.getElementById("r-grade-tier");
const rGradeTitleEl = document.getElementById("r-grade-title");
const rGradeSubEl   = document.getElementById("r-grade-sub");
const rScoreEl      = document.getElementById("r-score");
const rScoreDeltaEl = document.getElementById("r-score-delta");
const rBestEl       = document.getElementById("r-best");
const rCpmEl        = document.getElementById("r-cpm");
const rPeakCpmEl    = document.getElementById("r-peak-cpm");
const rIntervalEl   = document.getElementById("r-interval");
const rAccEl        = document.getElementById("r-acc");
const rCorrectEl    = document.getElementById("r-correct");
const rMissEl       = document.getElementById("r-miss");
const rTimeEl       = document.getElementById("r-time");
const rComboEl      = document.getElementById("r-combo");
const rLapsEl       = document.getElementById("r-laps");

const reviewListEl  = document.getElementById("review-list");
const rvSummaryEl   = document.getElementById("rv-summary");
const rvCountBadgeEl = document.getElementById("rv-count-badge");
const rvRetrainBtnEl = document.getElementById("rv-retrain-btn");
const badgeGridEl   = document.getElementById("badge-grid");
const badgeFilterGroupEl = document.getElementById("badge-filter-group");

// 画面（セクション）切り替え。[hidden] 属性で表示/非表示をそろえる
function showScreen(name) {
  view = name;
  document.querySelectorAll("[data-screen]").forEach(s => { s.hidden = (s.dataset.screen !== name); });
  document.querySelectorAll("header [data-tab]").forEach(a => {
    a.classList.toggle("is-active", a.dataset.tab === name);
  });
  if (name === "review") renderReviewScreen();
  if (name === "badge") renderBadgeScreen();
}

// =============================================
//  ホーム（出撃セクター選択）
// =============================================
function showDashboard() {
  clearInterval(timerId);
  timerId = null;
  selectedGrade = null;
  selectedSubject = null;
  selectedUnit = null;
  homeDashboardEl.hidden = false;
  homeBestScoreEl.textContent = getBest(null, null, null).toLocaleString();
  renderLastRunBar();
  showScreen("home");
}

function renderLastRunBar() {
  const r = lastRunResult || loadLastRunSummary();
  if (!r) { homeLastRunBarEl.hidden = true; return; }
  homeLastRunBarEl.hidden = false;
  const missCount = r.missLog ? r.missLog.length : (r.missCount || 0);
  const scope = [r.grade, r.unit || r.subject].filter(Boolean).join(" / ") || "ぜんぶ";
  homeLastRunTextEl.textContent =
    `前回ログ：${scope}　正解率 ${r.accuracy}%　スコア ${r.score}` +
    (missCount > 0 ? `　【復習推奨】ミス ${missCount} 件` : "");
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
  typeStreak = 0;
  maxTypeStreak = 0;
  score = 0;
  typedTotal = 0;
  peakCpm = 0;
  misses = 0;
  missFlash = false;
  firstKeyWasMiss = null;
  missLog = [];
  isNewBest = false;
}

// ゲーム開始
function beginGame() {
  resetGameState();
  buildPool();
  buildOrder();
  loadQuestion(0);
  showScreen("game");
  renderGame();
}

// =============================================
//  問題の読み込み（pos = order の何番目か）
// =============================================
function loadQuestion(pos) {
  qPos = pos;
  question = QUESTIONS[order[pos]];
  phase = "choices";
  // 選択肢の並び順をシャッフル（questions.json 側で正解が1番目に偏っていても、表示ではバラす）
  choiceList = shuffled((question.choices || []).map(normalizeChoice));
  cMatchers = choiceList.map(c => createMatcher(c.reading));
  answeredIndex = -1;
  answeredCorrect = false;
  lapFlash = false;
  renderGame();
}

// =============================================
//  ゲーム画面を今の状態どおりに描き直す
// =============================================
function renderGame() {
  if (view !== "game") return;

  tickTimerDisplay();
  gScoreEl.textContent = score.toLocaleString();
  gComboEl.textContent = `${comboMultiplier().toFixed(1)}x`;
  gMissEl.textContent = misses;
  gStreakEl.textContent = typeStreak;
  gBoostEl.textContent = `ブースト x${comboMultiplier().toFixed(1)}`;
  peakCpm = Math.max(peakCpm, liveCpm());
  gCpmLiveEl.textContent = `SPEED: ${liveCpm()} CPM`;
  gAccLiveEl.textContent = `ACCURACY: ${liveAccuracy()}%`;
  gScopeLabelEl.textContent = question.subject || "";
  gUnitLabelEl.textContent = question.unit || question.subject || "";
  gWarpEl.textContent = `WARP ${qPos + 1}/${order.length}`;
  gProgressPctEl.textContent = `${Math.round((qPos / order.length) * 100)}%`;
  gQLabelEl.textContent = `MISSION TARGET // Q-${String(qPos + 1).padStart(2, "0")}`;
  gDisplayEl.textContent = question.display || question.reading;

  renderChoicesGame();
  gChoicesEl.classList.toggle("shake-on-miss", missFlash);
  renderInfoGame();
}

// 残り時間の表示だけを更新（全体を描き直すと選択肢などの演出が壊れるので分けてある）
function tickTimerDisplay() {
  const sec = phase === "timeup" ? 0 : Math.ceil(timeLeft);
  gTimerEl.textContent = sec;
  gTimerEl.classList.toggle("text-error", sec <= 10);
  gTimerBarEl.style.width = `${Math.max(0, (timeLeft / TIME_LIMIT) * 100)}%`;
}

function renderChoicesGame() {
  if (cMatchers.length === 0) {
    gChoicesEl.innerHTML = "";
    return;
  }

  gChoicesEl.innerHTML = cMatchers.map((m, i) => {
    const ch = choiceList[i];
    const hasKanji = ch.display !== ch.reading;
    const theme = POD_THEMES[i % POD_THEMES.length];
    const progressed = m.tokenIndex > 0 || m.tokenTyped.length > 0;
    const isDead = m.dead && phase === "choices";

    let cardCls, numCls, statusHtml;
    if (phase === "result") {
      if (i === answeredIndex) {
        cardCls = answeredCorrect
          ? "border-2 border-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.35)] bg-surface-container/90"
          : "border-2 border-error shadow-[0_0_30px_rgba(255,180,171,0.3)] bg-surface-container/90";
      } else if (isAnswerChoice(ch)) {
        cardCls = "border-2 border-emerald-400/70 bg-surface-container/80";
      } else {
        cardCls = "border border-surface-container-highest bg-surface-container/60 opacity-60";
      }
      numCls = theme.numStandby;
      // 枠の高さを選択肢フェーズと揃えるため、見えないだけの同じ形のバッジを置いておく
      statusHtml = `<span class="invisible px-2 py-0.5 rounded font-mono text-[11px] font-bold flex items-center gap-1 shrink-0"><span class="material-symbols-outlined text-[13px]">bolt</span>PLACEHOLDER</span>`;
    } else if (isDead) {
      cardCls = "border border-error/30 bg-surface-container/50 opacity-40 line-through";
      numCls = theme.numStandby;
      statusHtml = `<span class="px-2 py-0.5 rounded bg-error/10 text-error font-mono text-[11px] font-bold flex items-center gap-1 shrink-0">MISS</span>`;
    } else if (progressed) {
      cardCls = `${theme.borderActive} ${theme.glow} bg-surface-container/90`;
      numCls = theme.numActive;
      statusHtml = `<span class="px-2 py-0.5 rounded ${theme.pillActive} font-mono text-[11px] font-bold flex items-center gap-1 shrink-0"><span class="material-symbols-outlined text-[13px]">bolt</span>ACTIVE</span>`;
    } else {
      cardCls = `${theme.borderStandby} bg-surface-container/70`;
      numCls = theme.numStandby;
      statusHtml = `<span class="px-2 py-0.5 rounded bg-surface-container-highest/60 text-outline font-mono text-[11px] font-bold flex items-center gap-1 shrink-0">STANDBY</span>`;
    }

    const showProgress = phase === "choices" && !m.dead;
    const yomi = showProgress
      ? `<span class="${theme.text}">${matcherDoneKana(m)}</span>${matcherRestKana(m)}`
      : ch.reading;
    const roma = showProgress
      ? `<span class="${theme.text}">${matcherDoneRomaji(m)}</span>${matcherRestRomaji(m)}`
      : matcherFullRomaji(m);

    const totalLen = matcherFullRomaji(m).length || 1;
    const doneLen = showProgress ? matcherDoneRomaji(m).length : 0;
    const barPct = Math.min(100, Math.round((doneLen / totalLen) * 100));

    const body = hasKanji
      ? `<h2 class="font-display font-bold text-lg sm:text-xl text-on-surface break-words">${ch.display}</h2><span class="font-body text-sm text-on-surface-variant break-words">${yomi}</span>`
      : `<span class="font-body text-on-surface break-words">${yomi}</span>`;

    return `<div class="relative rounded-2xl p-4 sm:p-5 transition-all min-h-[128px] sm:min-h-[140px] ${cardCls}">
      <div class="flex items-start gap-3 sm:gap-4">
        <div class="w-11 h-11 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center font-display font-bold text-lg shrink-0 ${numCls}">${i + 1}</div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between gap-2 mb-1">
            <span class="font-mono text-[11px] ${theme.text} uppercase tracking-widest truncate">${matcherFullRomaji(m).toUpperCase()}</span>
            ${statusHtml}
          </div>
          ${body}
          <div class="font-mono text-xs text-on-surface-variant/80 mt-1 break-all">${roma}</div>
          <div class="mt-2.5 w-full h-1.5 bg-surface-container-lowest rounded-full overflow-hidden"><div class="h-full ${theme.bar}" style="width:${barPct}%"></div></div>
        </div>
      </div>
    </div>`;
  }).join("");
}

function renderInfoGame() {
  const total = order.length;
  if (phase === "result") {
    const answerChoice = choiceList.find(isAnswerChoice);
    const answerText = answerChoice ? answerChoice.display : question.answer;
    let head = answeredCorrect ? "正解！" : `不正解…　正解は「${answerText}」`;
    if (lapFlash) head += `　🎉 ${laps}周クリア！ +${LAP_BONUS}`;
    gInfoEl.textContent = `${head}　｜　Enter で次へ`;
  } else {
    gInfoEl.textContent = `${qPos + 1} / ${total} 問目　｜　答えをタイプして Enter`;
  }
}

// 次の問題へ。最後まで行ったら、順番をシャッフルし直して先頭から
function goNextQuestion() {
  if (qPos < order.length - 1) {
    loadQuestion(qPos + 1);
  } else {
    buildOrder();
    loadQuestion(0);
  }
}

// ミスしたとき、一瞬赤くする
function flashMiss() {
  missFlash = true;
  renderGame();
  setTimeout(() => { missFlash = false; renderGame(); }, 150);
}

// =============================================
//  結果画面
// =============================================
function renderResultScreen(r) {
  rNewBestEl.hidden = !r.isNewBest;
  rTitleEl.textContent = [r.grade, r.unit || r.subject].filter(Boolean).join(" ・ ") || "スコアアタック";
  rGradeEl.textContent = r.gradeLetter;
  rGradeTierEl.textContent = r.gradeTier;
  rGradeTitleEl.textContent = r.gradeTitle;
  rGradeSubEl.textContent = r.gradeSub;

  rScoreEl.textContent = r.score.toLocaleString();
  const delta = r.score - r.prevBest;
  rScoreDeltaEl.innerHTML = r.isNewBest
    ? `<span class="material-symbols-outlined text-[14px]">trending_up</span>+${delta.toLocaleString()} vs BEST（新記録樹立）`
    : `<span class="material-symbols-outlined text-[14px]">trending_flat</span>自己ベストまであと ${Math.max(0, -delta).toLocaleString()}`;
  rBestEl.textContent = `${r.prevBest.toLocaleString()} pts`;

  rCpmEl.textContent = r.cpm;
  rPeakCpmEl.textContent = `${r.peakCpm} CPM`;
  rIntervalEl.textContent = r.avgIntervalMs > 0 ? `${r.avgIntervalMs} ms` : "-";

  rAccEl.textContent = r.accuracy;
  const perfect = r.answeredCount > 0 && r.correctCount === r.answeredCount;
  rCorrectEl.innerHTML = `<span class="material-symbols-outlined text-[14px]">task_alt</span>${r.correctCount} / ${r.answeredCount} 問正解${perfect ? "（満点）" : ""}`;
  rMissEl.textContent = `${r.misses} 回`;

  const sec = TIME_LIMIT % 60;
  const min = Math.floor(TIME_LIMIT / 60);
  rTimeEl.textContent = `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  rComboEl.textContent = r.maxTypeStreak;
  rLapsEl.textContent = `${r.laps} 周`;
}

// =============================================
//  復習ログ画面
// =============================================
function renderReviewScreen() {
  if (!lastRunResult) {
    rvSummaryEl.textContent = "データなし";
    rvCountBadgeEl.textContent = "";
    rvRetrainBtnEl.disabled = true;
    reviewListEl.innerHTML = `<p class="text-center text-on-surface-variant py-10">復習できるデータがありません。まずは1プレイしてみよう！</p>`;
    return;
  }

  const r = lastRunResult;
  rvSummaryEl.textContent = `スコア ${r.score.toLocaleString()}　正解率 ${r.accuracy}%`;
  rvCountBadgeEl.textContent = `要復習: ${r.missLog.length}問`;
  rvRetrainBtnEl.disabled = r.missLog.length === 0;

  if (r.missLog.length === 0) {
    reviewListEl.innerHTML = `<p class="text-center text-on-surface-variant py-10">ミスなし！パーフェクトです🎉</p>`;
    return;
  }

  reviewListEl.innerHTML = r.missLog.map((entry, i) => {
    const q = entry.q;
    const choices = shuffled((q.choices || []).map(normalizeChoice));
    const answerRoma = matcherFullRomaji(createMatcher(
      choices.find(c => isAnswerChoiceOf(q, c))?.reading || q.answer
    ));

    const choicesHtml = choices.map(ch => {
      const correct = isAnswerChoiceOf(q, ch);
      return correct
        ? `<div class="flex items-center justify-between p-3 rounded-lg bg-primary-container/10 border-2 border-primary-fixed-dim">
             <div class="flex items-center gap-2"><span class="w-6 h-6 rounded-full bg-primary-container text-on-primary-container text-xs flex items-center justify-center font-display font-bold">✓</span>
             <div class="flex flex-col"><span class="font-display font-bold text-primary-fixed">${ch.display}</span><span class="font-body text-xs text-on-surface-variant">${ch.reading}</span></div></div>
             <span class="px-2 py-0.5 rounded-full bg-primary-container text-on-primary-container font-mono text-[11px] font-bold">正解</span>
           </div>`
        : `<div class="flex items-center p-3 rounded-lg bg-surface-container-lowest border border-surface-container-highest opacity-80">
             <div class="flex items-center gap-2"><span class="w-6 h-6 rounded-full bg-surface-container-high text-on-surface-variant text-xs flex items-center justify-center font-display font-bold">-</span>
             <div class="flex flex-col"><span class="font-body text-on-surface-variant">${ch.display}</span><span class="font-body text-xs text-outline">${ch.reading}</span></div></div>
           </div>`;
    }).join("");

    const tag = entry.wrong ? "要復習" : "ミス入力あり";

    return `<div class="flex flex-col rounded-xl bg-surface-container-high p-4 sm:p-5 relative overflow-hidden border border-outline-variant/40 pl-6">
      <div class="absolute left-0 top-0 bottom-0 w-2 bg-error"></div>
      <div class="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-surface-container-highest">
        <div class="flex items-center gap-2">
          <span class="px-2 py-0.5 rounded bg-error text-surface font-mono text-[11px] font-bold uppercase tracking-wider flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">warning</span>${tag}</span>
          <span class="font-mono text-xs text-error font-bold">Q-${String(i + 1).padStart(2, "0")}</span>
        </div>
        <span class="px-2.5 py-1 rounded-lg bg-surface-container-lowest font-mono text-xs text-error font-bold flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">close</span>ミス: ${entry.missCount}回</span>
      </div>
      <div class="py-3 flex flex-col gap-2">
        <div class="flex items-center gap-1.5 text-on-surface-variant font-mono text-[11px] uppercase tracking-wider"><span class="material-symbols-outlined text-[16px] text-primary-fixed">help</span>問題文</div>
        <p class="font-body text-on-surface font-semibold leading-relaxed break-words">${q.display || q.reading}</p>
      </div>
      <div class="flex flex-col gap-2">
        <div class="text-on-surface-variant font-mono text-[11px] uppercase tracking-wider">選択肢</div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-2">${choicesHtml}</div>
      </div>
      <div class="mt-3 pt-3 border-t border-surface-container-highest flex flex-wrap items-center gap-3 bg-surface-container-lowest/80 p-3 rounded-lg">
        <div class="flex items-center gap-1.5"><span class="font-mono text-[11px] text-outline uppercase">タイピング語句:</span><span class="font-display font-bold text-primary">${answerDisplayOf(q)}</span></div>
        <div class="flex items-center gap-1.5 px-3 py-1 rounded bg-surface-container-high border border-outline-variant">
          <span class="font-mono text-[11px] text-outline uppercase">ROMAJI:</span><span class="font-mono text-base text-error tracking-widest font-bold">${answerRoma}</span>
        </div>
      </div>
    </div>`;
  }).join("");
}

function isAnswerChoiceOf(q, ch) {
  return ch.reading === q.answer || ch.display === q.answer;
}

// 直前のプレイでミスした問題だけを集めて再特訓する
function retrainMissed() {
  if (!lastRunResult || lastRunResult.missLog.length === 0) return;
  resetGameState();
  activePool = lastRunResult.missLog
    .map(entry => QUESTIONS.indexOf(entry.q))
    .filter(i => i >= 0);
  if (activePool.length === 0) return;
  buildOrder();
  loadQuestion(0);
  showScreen("game");
  renderGame();
}

// =============================================
//  バッジ画面
// =============================================
function renderBadgeScreen() {
  const unlocked = loadBadges();
  const lifetime = loadLifetime();

  // フィルタータブ（カテゴリとその数はBADGES配列から自動で出す）
  const categories = [...new Set(BADGES.map(b => b.category))];
  const tabs = [{ key: "all", label: `すべて (${BADGES.length})` }]
    .concat(categories.map(c => ({ key: c, label: `${BADGE_CATEGORY_LABELS[c] || c} (${BADGES.filter(b => b.category === c).length})` })));
  badgeFilterGroupEl.innerHTML = tabs.map((t, i) => `
    <button type="button" class="badge-filter-tab px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all ${i === 0 ? "bg-primary text-on-primary shadow-[0_0_12px_rgba(0,240,255,0.3)]" : "bg-surface-container-high text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest"}" data-category="${t.key}">${t.label}</button>
  `).join("");
  badgeFilterGroupEl.querySelectorAll(".badge-filter-tab").forEach(btn => {
    btn.addEventListener("click", () => filterBadges(btn.dataset.category, btn));
  });

  badgeGridEl.innerHTML = BADGES.map(b => {
    const isUnlocked = !!unlocked[b.id];
    let bottomHtml;
    const theme = BADGE_COLOR_THEMES[b.color] || BADGE_COLOR_THEMES.primary;

    if (isUnlocked) {
      bottomHtml = `<div class="mt-3 bg-surface-container-lowest/60 rounded-lg p-2 text-center border border-outline-variant/30">
        <span class="font-mono text-xs ${theme.text}">${b.achievedText ? b.achievedText(lifetime) : "記録: 達成済み"}</span>
      </div>`;
    } else if (b.progressValue) {
      const cur = b.progressValue(lifetime) || 0;
      const pct = Math.max(0, Math.min(100, Math.round((cur / b.target) * 100)));
      bottomHtml = `<div class="mt-3 bg-surface-container-lowest/40 rounded-lg p-2">
        <div class="flex justify-between text-[10px] font-mono text-outline mb-1"><span>PROGRESS</span><span class="text-primary-fixed">${cur} / ${b.target}${b.unit || ""}</span></div>
        <div class="w-full h-1.5 bg-surface-container-highest rounded-full overflow-hidden"><div class="h-full bg-primary-fixed-dim" style="width:${pct}%"></div></div>
      </div>`;
    } else {
      bottomHtml = "";
    }

    return `<div class="badge-card flex flex-col justify-between rounded-xl p-5 border transition-all duration-300 ${isUnlocked ? `bg-surface-container/70 ${theme.border} hover:bg-surface-container-high/90 shadow-lg` : "bg-surface-container-low/70 border-outline-variant/30 hover:bg-surface-container/80 shadow-md opacity-85"}" data-category="${b.category}">
      <div>
        <div class="flex items-center justify-between mb-2">
          <span class="font-mono text-[11px] ${isUnlocked ? theme.text : "text-outline"} uppercase tracking-wider">${b.titleEn}</span>
          <span class="inline-flex items-center gap-1 ${isUnlocked ? theme.text : "text-outline"} font-mono text-xs">
            <span class="material-symbols-outlined text-[16px]">${isUnlocked ? "check_circle" : "lock"}</span>${isUnlocked ? "獲得済" : "未解除"}
          </span>
        </div>
        <div class="w-16 h-16 mx-auto my-3 rounded-2xl flex items-center justify-center ${isUnlocked ? `bg-surface-container-lowest ${theme.text} ${theme.iconGlow}` : "bg-surface-container-lowest/80 text-outline"}">
          <span class="material-symbols-outlined text-[36px]">${b.icon}</span>
        </div>
        <div class="text-center mt-2">
          <h3 class="font-display font-semibold ${isUnlocked ? theme.text : "text-on-surface-variant"}">${b.title}</h3>
          <p class="font-body text-xs text-on-surface-variant mt-2 leading-relaxed">${b.desc}</p>
        </div>
      </div>
      ${bottomHtml}
    </div>`;
  }).join("");
}

function filterBadges(category, btnEl) {
  badgeFilterGroupEl.querySelectorAll(".badge-filter-tab").forEach(t => {
    t.className = "badge-filter-tab px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all bg-surface-container-high text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest";
  });
  btnEl.className = "badge-filter-tab px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all bg-primary text-on-primary shadow-[0_0_12px_rgba(0,240,255,0.3)]";
  badgeGridEl.querySelectorAll(".badge-card").forEach(card => {
    card.style.display = (category === "all" || card.dataset.category === category) ? "flex" : "none";
  });
}

// =============================================
//  キー入力：画面ごとに処理を分ける
// =============================================
document.addEventListener("keydown", (e) => {
  // --- ホーム：出撃セクター選択（ダッシュボード） ---
  if (view === "home") {
    if (e.key === "3") { beginGame(); return; }
    if (e.key.toLowerCase() === "l") { if (lastRunResult || loadLastRunSummary()) showScreen("review"); return; }
    if (e.key.toLowerCase() === "b") { showScreen("badge"); return; }
    return;
  }

  // --- バッジ画面 ---
  if (view === "badge") {
    if (e.key === "Escape") showDashboard();
    return;
  }

  // --- 復習ログ画面 ---
  if (view === "review") {
    if (e.key === "Escape" || e.key.toLowerCase() === "b") { lastRunResult ? showScreen("result") : showDashboard(); return; }
    if (e.key.toLowerCase() === "t") { retrainMissed(); return; }
    if (e.key === "Enter") { beginGame(); return; }
    return;
  }

  // --- 結果画面 ---
  if (view === "result") {
    if (e.key === "Escape") { showDashboard(); return; }
    if (e.key.toLowerCase() === "r") { beginGame(); return; }
    if (e.key.toLowerCase() === "l") { showScreen("review"); return; }
    if (e.key === "Enter") { beginGame(); return; }
    return;
  }

  // --- ゲーム画面 ---
  if (e.key === "Escape") { showDashboard(); return; }

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
  handleChoiceKey(key);
});

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

  renderGame();
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
  renderGame();
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
  const kanaOnly = /^[ぁ-ゖーA-Za-z0-9]+$/;   // ひらがな＋長音＋アルファベット・数字（EU・GISなどそのまま打つ用）
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

// questions.json を読み込めなかったときに、ホーム画面へエラーを出す
function showLoadError(err) {
  console.error(err);
  homeDashboardEl.hidden = false;
  homeDashboardEl.innerHTML = `
    <div class="bg-surface-container-low/90 rounded-xl p-5">
      <h2 class="font-display font-semibold text-lg text-error mb-2">読み込みエラー</h2>
      <p class="font-body text-sm text-on-surface-variant leading-relaxed">
        問題データを読み込めませんでした。<br>
        ・index.html を<b>ダブルクリックではなく</b>ローカルサーバー経由で開いていますか？<br>
        　（file:// では fetch がブロックされます）<br>
        　例：ターミナルでこのフォルダに入り <code>python3 -m http.server</code> を実行 →
        　ブラウザで <code>http://localhost:8000/</code> を開く<br>
        ・questions.json 内のカンマの付け忘れ・余分なカンマもよくある原因です
      </p>
      <p class="font-mono text-xs text-error mt-3">${(err && err.message) || err}</p>
    </div>`;
  showScreen("home");
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
//  スタート：問題ファイルを全部読み込んで合体する → チェック → ホーム画面を表示
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
  showDashboard();
}

start();
