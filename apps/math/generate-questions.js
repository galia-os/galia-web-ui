const fs = require('fs');

// Read existing file
const existing = JSON.parse(fs.readFileSync('/Users/ludovic/galamath/src/data/number-lines-medium.json', 'utf8'));

// Keep first 40 questions
const questions = existing.questions.slice(0, 40);

// SVG template function
function createSvg(labels, dotX = null) {
  const positions = [20, 80, 140, 200, 260];
  let svg = '<svg width="300" height="80" viewBox="0 0 300 80">';
  svg += '<line x1="20" y1="40" x2="280" y2="40" stroke="#4F46E5" stroke-width="2"/>';

  for (let i = 0; i < 5; i++) {
    svg += `<line x1="${positions[i]}" y1="35" x2="${positions[i]}" y2="45" stroke="#4F46E5" stroke-width="2"/>`;
  }

  for (let i = 0; i < 5; i++) {
    svg += `<text x="${positions[i]}" y="60" text-anchor="middle" font-size="14" fill="#374151">${labels[i]}</text>`;
  }

  if (dotX !== null) {
    svg += `<circle cx="${dotX}" cy="40" r="6" fill="#EF4444"/>`;
  }

  svg += '</svg>';
  return svg;
}

// Shuffle array helper
function shuffle(arr) {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Generate plausible wrong answers
function generateWrongAnswers(correct, step, count = 3) {
  const wrongs = new Set();
  const candidates = [
    correct + step,
    correct - step,
    correct + 1,
    correct - 1,
    correct + 2,
    correct - 2,
    correct + Math.floor(step / 2),
    correct - Math.floor(step / 2),
    correct + step + 1,
    correct - step + 1,
  ];

  for (const c of shuffle(candidates)) {
    if (c !== correct && c > 0 && !wrongs.has(c)) {
      wrongs.add(c);
      if (wrongs.size === count) break;
    }
  }

  // Fill remaining if needed
  let offset = 1;
  while (wrongs.size < count) {
    if (correct + offset !== correct && !wrongs.has(correct + offset) && correct + offset > 0) {
      wrongs.add(correct + offset);
    }
    if (wrongs.size < count && correct - offset !== correct && !wrongs.has(correct - offset) && correct - offset > 0) {
      wrongs.add(correct - offset);
    }
    offset++;
  }

  return Array.from(wrongs).slice(0, count);
}

// Create question with randomized answer position
function createQuestion(id, questionText, svg, correctAnswer, wrongAnswers, hint, targetPosition) {
  const answers = [...wrongAnswers];
  answers.splice(targetPosition, 0, correctAnswer);

  return {
    id,
    question: questionText,
    svg,
    answers: answers.map(String),
    correct: targetPosition,
    hint
  };
}

// Track correct answer positions for even distribution
let positionCounts = [0, 0, 0, 0];

function getNextPosition() {
  const minCount = Math.min(...positionCounts);
  const candidates = positionCounts.map((c, i) => c === minCount ? i : -1).filter(i => i >= 0);
  const pos = candidates[Math.floor(Math.random() * candidates.length)];
  positionCounts[pos]++;
  return pos;
}

// Reset position counts based on existing questions
existing.questions.forEach(q => {
  positionCounts[q.correct]++;
});

// Question configurations for new questions
const configs = [];

// Counting by 2s variations
const by2Configs = [
  { start: 4, labels: [4,6,8,10,12], dotX: 50, correct: 5, hint: "The numbers are counting by 2s. The dot is between 4 and 6." },
  { start: 10, labels: [10,12,14,16,18], dotX: 170, correct: 15, hint: "The numbers are counting by 2s. The dot is between 14 and 16." },
  { start: 20, labels: [20,22,24,26,28], dotX: 230, correct: 27, hint: "The numbers are counting by 2s. The dot is between 26 and 28." },
  { start: 30, labels: [30,32,34,36,38], dotX: 110, correct: 33, hint: "The numbers are counting by 2s. The dot is between 32 and 34." },
  { start: 14, labels: [14,16,18,20,22], dotX: 50, correct: 15, hint: "The numbers are counting by 2s. The dot is between 14 and 16." },
];

// Counting by 3s variations
const by3Configs = [
  { start: 0, labels: [0,3,6,9,12], dotX: 170, correct: 7, hint: "The numbers are counting by 3s. The dot is between 6 and 9." },
  { start: 9, labels: [9,12,15,18,21], dotX: 50, correct: 10, hint: "The numbers are counting by 3s. The dot is between 9 and 12." },
  { start: 6, labels: [6,9,12,15,18], dotX: 230, correct: 17, hint: "The numbers are counting by 3s. The dot is between 15 and 18." },
  { start: 12, labels: [12,15,18,21,24], dotX: 110, correct: 16, hint: "The numbers are counting by 3s. The dot is between 15 and 18." },
  { start: 15, labels: [15,18,21,24,27], dotX: 170, correct: 22, hint: "The numbers are counting by 3s. The dot is between 21 and 24." },
];

// Counting by 4s variations
const by4Configs = [
  { start: 0, labels: [0,4,8,12,16], dotX: 170, correct: 10, hint: "The numbers are counting by 4s. The dot is between 8 and 12." },
  { start: 8, labels: [8,12,16,20,24], dotX: 50, correct: 10, hint: "The numbers are counting by 4s. The dot is between 8 and 12." },
  { start: 12, labels: [12,16,20,24,28], dotX: 230, correct: 26, hint: "The numbers are counting by 4s. The dot is between 24 and 28." },
  { start: 20, labels: [20,24,28,32,36], dotX: 110, correct: 26, hint: "The numbers are counting by 4s. The dot is between 24 and 28." },
  { start: 4, labels: [4,8,12,16,20], dotX: 170, correct: 14, hint: "The numbers are counting by 4s. The dot is between 12 and 16." },
];

// Counting by 5s variations
const by5Configs = [
  { start: 0, labels: [0,5,10,15,20], dotX: 170, correct: 12, hint: "The numbers are counting by 5s. The dot is between 10 and 15." },
  { start: 15, labels: [15,20,25,30,35], dotX: 50, correct: 17, hint: "The numbers are counting by 5s. The dot is between 15 and 20." },
  { start: 25, labels: [25,30,35,40,45], dotX: 230, correct: 42, hint: "The numbers are counting by 5s. The dot is between 40 and 45." },
  { start: 35, labels: [35,40,45,50,55], dotX: 110, correct: 42, hint: "The numbers are counting by 5s. The dot is between 40 and 45." },
  { start: 5, labels: [5,10,15,20,25], dotX: 170, correct: 17, hint: "The numbers are counting by 5s. The dot is between 15 and 20." },
];

// Counting by 6s variations
const by6Configs = [
  { start: 0, labels: [0,6,12,18,24], dotX: 170, correct: 15, hint: "The numbers are counting by 6s. The dot is between 12 and 18." },
  { start: 12, labels: [12,18,24,30,36], dotX: 50, correct: 15, hint: "The numbers are counting by 6s. The dot is between 12 and 18." },
  { start: 18, labels: [18,24,30,36,42], dotX: 230, correct: 39, hint: "The numbers are counting by 6s. The dot is between 36 and 42." },
  { start: 24, labels: [24,30,36,42,48], dotX: 110, correct: 33, hint: "The numbers are counting by 6s. The dot is between 30 and 36." },
  { start: 6, labels: [6,12,18,24,30], dotX: 170, correct: 21, hint: "The numbers are counting by 6s. The dot is between 18 and 24." },
];

// Counting by 7s variations
const by7Configs = [
  { start: 0, labels: [0,7,14,21,28], dotX: 170, correct: 17, hint: "The numbers are counting by 7s. The dot is between 14 and 21." },
  { start: 7, labels: [7,14,21,28,35], dotX: 50, correct: 10, hint: "The numbers are counting by 7s. The dot is between 7 and 14." },
  { start: 14, labels: [14,21,28,35,42], dotX: 230, correct: 38, hint: "The numbers are counting by 7s. The dot is between 35 and 42." },
  { start: 21, labels: [21,28,35,42,49], dotX: 110, correct: 31, hint: "The numbers are counting by 7s. The dot is between 28 and 35." },
  { start: 28, labels: [28,35,42,49,56], dotX: 170, correct: 45, hint: "The numbers are counting by 7s. The dot is between 42 and 49." },
];

// Counting by 8s variations
const by8Configs = [
  { start: 0, labels: [0,8,16,24,32], dotX: 170, correct: 20, hint: "The numbers are counting by 8s. The dot is between 16 and 24." },
  { start: 8, labels: [8,16,24,32,40], dotX: 50, correct: 12, hint: "The numbers are counting by 8s. The dot is between 8 and 16." },
  { start: 16, labels: [16,24,32,40,48], dotX: 230, correct: 44, hint: "The numbers are counting by 8s. The dot is between 40 and 48." },
  { start: 24, labels: [24,32,40,48,56], dotX: 110, correct: 36, hint: "The numbers are counting by 8s. The dot is between 32 and 40." },
  { start: 32, labels: [32,40,48,56,64], dotX: 170, correct: 52, hint: "The numbers are counting by 8s. The dot is between 48 and 56." },
];

// Counting by 9s variations
const by9Configs = [
  { start: 0, labels: [0,9,18,27,36], dotX: 170, correct: 22, hint: "The numbers are counting by 9s. The dot is between 18 and 27." },
  { start: 9, labels: [9,18,27,36,45], dotX: 50, correct: 13, hint: "The numbers are counting by 9s. The dot is between 9 and 18." },
  { start: 18, labels: [18,27,36,45,54], dotX: 230, correct: 49, hint: "The numbers are counting by 9s. The dot is between 45 and 54." },
  { start: 27, labels: [27,36,45,54,63], dotX: 110, correct: 40, hint: "The numbers are counting by 9s. The dot is between 36 and 45." },
  { start: 36, labels: [36,45,54,63,72], dotX: 170, correct: 58, hint: "The numbers are counting by 9s. The dot is between 54 and 63." },
];

// Counting by 10s variations
const by10Configs = [
  { start: 0, labels: [0,10,20,30,40], dotX: 170, correct: 25, hint: "The numbers are counting by 10s. The dot is between 20 and 30." },
  { start: 20, labels: [20,30,40,50,60], dotX: 50, correct: 25, hint: "The numbers are counting by 10s. The dot is between 20 and 30." },
  { start: 30, labels: [30,40,50,60,70], dotX: 230, correct: 65, hint: "The numbers are counting by 10s. The dot is between 60 and 70." },
  { start: 40, labels: [40,50,60,70,80], dotX: 110, correct: 55, hint: "The numbers are counting by 10s. The dot is between 50 and 60." },
  { start: 50, labels: [50,60,70,80,90], dotX: 170, correct: 75, hint: "The numbers are counting by 10s. The dot is between 70 and 80." },
];

// Counting by 11s variations
const by11Configs = [
  { start: 0, labels: [0,11,22,33,44], dotX: 170, correct: 27, hint: "The numbers are counting by 11s. The dot is between 22 and 33." },
  { start: 11, labels: [11,22,33,44,55], dotX: 50, correct: 16, hint: "The numbers are counting by 11s. The dot is between 11 and 22." },
  { start: 22, labels: [22,33,44,55,66], dotX: 230, correct: 60, hint: "The numbers are counting by 11s. The dot is between 55 and 66." },
  { start: 33, labels: [33,44,55,66,77], dotX: 110, correct: 49, hint: "The numbers are counting by 11s. The dot is between 44 and 55." },
];

// Counting by 12s variations
const by12Configs = [
  { start: 0, labels: [0,12,24,36,48], dotX: 170, correct: 30, hint: "The numbers are counting by 12s. The dot is between 24 and 36." },
  { start: 12, labels: [12,24,36,48,60], dotX: 50, correct: 18, hint: "The numbers are counting by 12s. The dot is between 12 and 24." },
  { start: 24, labels: [24,36,48,60,72], dotX: 230, correct: 66, hint: "The numbers are counting by 12s. The dot is between 60 and 72." },
  { start: 36, labels: [36,48,60,72,84], dotX: 110, correct: 54, hint: "The numbers are counting by 12s. The dot is between 48 and 60." },
];

// Missing number questions
const missingConfigs = [
  { labels: ['6', '12', '?', '24', '30'], step: 6, missing: 18, hint: "The numbers are counting by 6s: 6, 12, ?, 24, 30" },
  { labels: ['4', '11', '?', '25', '32'], step: 7, missing: 18, hint: "The numbers are counting by 7s: 4, 11, ?, 25, 32" },
  { labels: ['5', '13', '?', '29', '37'], step: 8, missing: 21, hint: "The numbers are counting by 8s: 5, 13, ?, 29, 37" },
  { labels: ['2', '11', '?', '29', '38'], step: 9, missing: 20, hint: "The numbers are counting by 9s: 2, 11, ?, 29, 38" },
  { labels: ['3', '13', '?', '33', '43'], step: 10, missing: 23, hint: "The numbers are counting by 10s: 3, 13, ?, 33, 43" },
  { labels: ['1', '12', '?', '34', '45'], step: 11, missing: 23, hint: "The numbers are counting by 11s: 1, 12, ?, 34, 45" },
  { labels: ['2', '14', '?', '38', '50'], step: 12, missing: 26, hint: "The numbers are counting by 12s: 2, 14, ?, 38, 50" },
  { labels: ['7', '14', '?', '28', '35'], step: 7, missing: 21, hint: "The numbers are counting by 7s: 7, 14, ?, 28, 35" },
  { labels: ['10', '18', '?', '34', '42'], step: 8, missing: 26, hint: "The numbers are counting by 8s: 10, 18, ?, 34, 42" },
  { labels: ['4', '13', '?', '31', '40'], step: 9, missing: 22, hint: "The numbers are counting by 9s: 4, 13, ?, 31, 40" },
  { labels: ['8', '18', '?', '38', '48'], step: 10, missing: 28, hint: "The numbers are counting by 10s: 8, 18, ?, 38, 48" },
  { labels: ['5', '16', '?', '38', '49'], step: 11, missing: 27, hint: "The numbers are counting by 11s: 5, 16, ?, 38, 49" },
  { labels: ['6', '18', '?', '42', '54'], step: 12, missing: 30, hint: "The numbers are counting by 12s: 6, 18, ?, 42, 54" },
  { labels: ['9', '15', '?', '27', '33'], step: 6, missing: 21, hint: "The numbers are counting by 6s: 9, 15, ?, 27, 33" },
  { labels: ['11', '18', '?', '32', '39'], step: 7, missing: 25, hint: "The numbers are counting by 7s: 11, 18, ?, 32, 39" },
  { labels: ['3', '11', '?', '27', '35'], step: 8, missing: 19, hint: "The numbers are counting by 8s: 3, 11, ?, 27, 35" },
  { labels: ['7', '16', '?', '34', '43'], step: 9, missing: 25, hint: "The numbers are counting by 9s: 7, 16, ?, 34, 43" },
  { labels: ['6', '16', '?', '36', '46'], step: 10, missing: 26, hint: "The numbers are counting by 10s: 6, 16, ?, 36, 46" },
  { labels: ['3', '6', '?', '12', '15'], step: 3, missing: 9, hint: "The numbers are counting by 3s: 3, 6, ?, 12, 15" },
  { labels: ['8', '12', '?', '20', '24'], step: 4, missing: 16, hint: "The numbers are counting by 4s: 8, 12, ?, 20, 24" },
  { labels: ['10', '15', '?', '25', '30'], step: 5, missing: 20, hint: "The numbers are counting by 5s: 10, 15, ?, 25, 30" },
  { labels: ['12', '18', '?', '30', '36'], step: 6, missing: 24, hint: "The numbers are counting by 6s: 12, 18, ?, 30, 36" },
  { labels: ['14', '21', '?', '35', '42'], step: 7, missing: 28, hint: "The numbers are counting by 7s: 14, 21, ?, 35, 42" },
  { labels: ['16', '24', '?', '40', '48'], step: 8, missing: 32, hint: "The numbers are counting by 8s: 16, 24, ?, 40, 48" },
  { labels: ['18', '27', '?', '45', '54'], step: 9, missing: 36, hint: "The numbers are counting by 9s: 18, 27, ?, 45, 54" },
  { labels: ['15', '25', '?', '45', '55'], step: 10, missing: 35, hint: "The numbers are counting by 10s: 15, 25, ?, 45, 55" },
  { labels: ['11', '22', '?', '44', '55'], step: 11, missing: 33, hint: "The numbers are counting by 11s: 11, 22, ?, 44, 55" },
  { labels: ['12', '24', '?', '48', '60'], step: 12, missing: 36, hint: "The numbers are counting by 12s: 12, 24, ?, 48, 60" },
  { labels: ['2', '8', '?', '20', '26'], step: 6, missing: 14, hint: "The numbers are counting by 6s: 2, 8, ?, 20, 26" },
  { labels: ['3', '10', '?', '24', '31'], step: 7, missing: 17, hint: "The numbers are counting by 7s: 3, 10, ?, 24, 31" },
  { labels: ['1', '9', '?', '25', '33'], step: 8, missing: 17, hint: "The numbers are counting by 8s: 1, 9, ?, 25, 33" },
  { labels: ['5', '14', '?', '32', '41'], step: 9, missing: 23, hint: "The numbers are counting by 9s: 5, 14, ?, 32, 41" },
  { labels: ['2', '12', '?', '32', '42'], step: 10, missing: 22, hint: "The numbers are counting by 10s: 2, 12, ?, 32, 42" },
  { labels: ['4', '15', '?', '37', '48'], step: 11, missing: 26, hint: "The numbers are counting by 11s: 4, 15, ?, 37, 48" },
  { labels: ['3', '15', '?', '39', '51'], step: 12, missing: 27, hint: "The numbers are counting by 12s: 3, 15, ?, 39, 51" },
];

// More dot question configs
const moreDotConfigs = [
  { labels: [0,3,6,9,12], step: 3, dotX: 50, correct: 1, hint: "The numbers are counting by 3s. The dot is between 0 and 3." },
  { labels: [0,4,8,12,16], step: 4, dotX: 50, correct: 2, hint: "The numbers are counting by 4s. The dot is between 0 and 4." },
  { labels: [0,5,10,15,20], step: 5, dotX: 50, correct: 2, hint: "The numbers are counting by 5s. The dot is between 0 and 5." },
  { labels: [0,6,12,18,24], step: 6, dotX: 50, correct: 3, hint: "The numbers are counting by 6s. The dot is between 0 and 6." },
  { labels: [0,7,14,21,28], step: 7, dotX: 50, correct: 3, hint: "The numbers are counting by 7s. The dot is between 0 and 7." },
  { labels: [0,8,16,24,32], step: 8, dotX: 50, correct: 4, hint: "The numbers are counting by 8s. The dot is between 0 and 8." },
  { labels: [0,9,18,27,36], step: 9, dotX: 50, correct: 4, hint: "The numbers are counting by 9s. The dot is between 0 and 9." },
  { labels: [5,10,15,20,25], step: 5, dotX: 110, correct: 12, hint: "The numbers are counting by 5s. The dot is between 10 and 15." },
  { labels: [6,12,18,24,30], step: 6, dotX: 110, correct: 15, hint: "The numbers are counting by 6s. The dot is between 12 and 18." },
  { labels: [7,14,21,28,35], step: 7, dotX: 110, correct: 17, hint: "The numbers are counting by 7s. The dot is between 14 and 21." },
  { labels: [8,16,24,32,40], step: 8, dotX: 110, correct: 20, hint: "The numbers are counting by 8s. The dot is between 16 and 24." },
  { labels: [9,18,27,36,45], step: 9, dotX: 110, correct: 22, hint: "The numbers are counting by 9s. The dot is between 18 and 27." },
  { labels: [10,20,30,40,50], step: 10, dotX: 110, correct: 25, hint: "The numbers are counting by 10s. The dot is between 20 and 30." },
  { labels: [11,22,33,44,55], step: 11, dotX: 110, correct: 27, hint: "The numbers are counting by 11s. The dot is between 22 and 33." },
  { labels: [12,24,36,48,60], step: 12, dotX: 110, correct: 30, hint: "The numbers are counting by 12s. The dot is between 24 and 36." },
  { labels: [3,9,15,21,27], step: 6, dotX: 230, correct: 24, hint: "The numbers are counting by 6s. The dot is between 21 and 27." },
  { labels: [4,11,18,25,32], step: 7, dotX: 230, correct: 28, hint: "The numbers are counting by 7s. The dot is between 25 and 32." },
  { labels: [5,13,21,29,37], step: 8, dotX: 230, correct: 33, hint: "The numbers are counting by 8s. The dot is between 29 and 37." },
  { labels: [6,15,24,33,42], step: 9, dotX: 230, correct: 37, hint: "The numbers are counting by 9s. The dot is between 33 and 42." },
  { labels: [7,17,27,37,47], step: 10, dotX: 230, correct: 42, hint: "The numbers are counting by 10s. The dot is between 37 and 47." },
  { labels: [8,19,30,41,52], step: 11, dotX: 230, correct: 46, hint: "The numbers are counting by 11s. The dot is between 41 and 52." },
  { labels: [9,21,33,45,57], step: 12, dotX: 230, correct: 51, hint: "The numbers are counting by 12s. The dot is between 45 and 57." },
];

let id = 41;

// Add dot questions from various configs
const allDotConfigs = [...by2Configs, ...by3Configs, ...by4Configs, ...by5Configs, ...by6Configs,
                       ...by7Configs, ...by8Configs, ...by9Configs, ...by10Configs, ...by11Configs,
                       ...by12Configs, ...moreDotConfigs];

for (const config of allDotConfigs) {
  if (id > 150) break;
  const pos = getNextPosition();
  const wrongAnswers = generateWrongAnswers(config.correct, config.labels[1] - config.labels[0]);
  const svg = createSvg(config.labels, config.dotX);
  questions.push(createQuestion(id, "What number is shown by the dot?", svg, config.correct, wrongAnswers, config.hint, pos));
  id++;
}

// Add missing number questions
for (const config of missingConfigs) {
  if (id > 150) break;
  const pos = getNextPosition();
  const wrongAnswers = generateWrongAnswers(config.missing, config.step);
  const svg = createSvg(config.labels, null);
  questions.push(createQuestion(id, "What number is missing?", svg, config.missing, wrongAnswers, config.hint, pos));
  id++;
}

// If we still need more questions, generate additional ones
while (id <= 150) {
  const step = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12][Math.floor(Math.random() * 10)];
  const start = Math.floor(Math.random() * 10) * step;
  const labels = [start, start + step, start + 2*step, start + 3*step, start + 4*step];

  const questionType = Math.random() > 0.5 ? 'dot' : 'missing';

  if (questionType === 'dot') {
    const dotPositions = [50, 110, 170, 230];
    const dotX = dotPositions[Math.floor(Math.random() * dotPositions.length)];
    let correct;
    if (dotX === 50) correct = start + Math.floor(step / 2);
    else if (dotX === 110) correct = start + step + Math.floor(step / 2);
    else if (dotX === 170) correct = start + 2*step + Math.floor(step / 2);
    else correct = start + 3*step + Math.floor(step / 2);

    const pos = getNextPosition();
    const wrongAnswers = generateWrongAnswers(correct, step);
    const svg = createSvg(labels, dotX);
    const hint = `The numbers are counting by ${step}s. The dot is between two labeled numbers.`;
    questions.push(createQuestion(id, "What number is shown by the dot?", svg, correct, wrongAnswers, hint, pos));
  } else {
    const missingLabels = [...labels];
    missingLabels[2] = '?';
    const missing = labels[2];

    const pos = getNextPosition();
    const wrongAnswers = generateWrongAnswers(missing, step);
    const svg = createSvg(missingLabels, null);
    const hint = `The numbers are counting by ${step}s: ${labels[0]}, ${labels[1]}, ?, ${labels[3]}, ${labels[4]}`;
    questions.push(createQuestion(id, "What number is missing?", svg, missing, wrongAnswers, hint, pos));
  }
  id++;
}

// Trim to exactly 150 questions
const finalQuestions = questions.slice(0, 150);

// Renumber all questions
finalQuestions.forEach((q, i) => {
  q.id = i + 1;
});

const output = {
  theme: existing.theme,
  themeId: existing.themeId,
  level: existing.level,
  totalTimeMinutes: existing.totalTimeMinutes,
  questionTimeMinutes: existing.questionTimeMinutes,
  questions: finalQuestions,
  access: existing.access
};

fs.writeFileSync('/Users/ludovic/galamath/src/data/number-lines-medium.json', JSON.stringify(output, null, 2));
console.log(`Generated ${finalQuestions.length} questions`);

// Print position distribution
const posDist = [0, 0, 0, 0];
finalQuestions.forEach(q => posDist[q.correct]++);
console.log('Position distribution:', posDist);
