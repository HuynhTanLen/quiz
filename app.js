const STORAGE_KEY = "bo-trac-nghiem-ocr-state";

const state = {
  bank: [],
  filtered: [],
  quiz: [],
  answers: {},
  currentIndex: 0,
  isGraded: false,
};

const elements = {
  totalQuestions: document.getElementById("totalQuestions"),
  answerCoverage: document.getElementById("answerCoverage"),
  questionLimit: document.getElementById("questionLimit"),
  shuffleQuestions: document.getElementById("shuffleQuestions"),
  shuffleOptions: document.getElementById("shuffleOptions"),
  startQuizBtn: document.getElementById("startQuizBtn"),
  resetQuizBtn: document.getElementById("resetQuizBtn"),
  quizStatus: document.getElementById("quizStatus"),
  quizEmptyState: document.getElementById("quizEmptyState"),
  quizCard: document.getElementById("quizCard"),
  questionCounter: document.getElementById("questionCounter"),
  questionIdBadge: document.getElementById("questionIdBadge"),
  questionText: document.getElementById("questionText"),
  optionsList: document.getElementById("optionsList"),
  prevBtn: document.getElementById("prevBtn"),
  nextBtn: document.getElementById("nextBtn"),
  submitBtn: document.getElementById("submitBtn"),
  searchInput: document.getElementById("searchInput"),
  inlineFeedback: document.getElementById("inlineFeedback"),
  menuToggleBtn: document.getElementById("menuToggleBtn"),
  closeMenuBtn: document.getElementById("closeMenuBtn"),
  sideMenuOverlay: document.getElementById("sideMenuOverlay"),
  sideMenu: document.getElementById("sideMenu"),
  navigatorPanel: document.getElementById("navigatorPanel"),
  navigatorGrid: document.getElementById("navigatorGrid"),
  mobileNavToggleBtn: document.getElementById("mobileNavToggleBtn"),
  closeNavigatorBtn: document.getElementById("closeNavigatorBtn"),
  searchInput: document.getElementById("searchInput"),
  questionList: document.getElementById("questionList"),
  ocrInput: document.getElementById("ocrInput"),
  parseOcrBtn: document.getElementById("parseOcrBtn"),
  exportBtn: document.getElementById("exportBtn"),
  importStatus: document.getElementById("importStatus"),
};

async function init() {
  const response = await fetch("./data/questions.json");
  const payload = await response.json();
  const stored = readStorage();

  state.bank = payload.questions.map((item) => ({
    ...item,
    answer: stored.answerMap?.[item.id] ?? item.answer ?? null,
  }));
  state.filtered = [...state.bank];

  renderStats();
  renderQuestionList();
  bindEvents();
}

function bindEvents() {
  elements.startQuizBtn.addEventListener("click", startQuiz);
  elements.resetQuizBtn.addEventListener("click", resetQuiz);
  elements.prevBtn.addEventListener("click", () => moveQuestion(-1));
  elements.nextBtn.addEventListener("click", () => moveQuestion(1));
  elements.submitBtn.addEventListener("click", submitQuiz);
  elements.searchInput.addEventListener("input", renderQuestionList);
  elements.parseOcrBtn.addEventListener("click", parseOcrInput);
  elements.exportBtn.addEventListener("click", exportCurrentData);
  elements.menuToggleBtn.addEventListener("click", toggleMenu);
  elements.closeMenuBtn.addEventListener("click", toggleMenu);
  
  elements.mobileNavToggleBtn.addEventListener("click", () => {
    elements.navigatorPanel.classList.add("mobile-open");
    updateOverlay();
  });
  
  elements.closeNavigatorBtn.addEventListener("click", () => {
    elements.navigatorPanel.classList.remove("mobile-open");
    updateOverlay();
  });
  
  elements.sideMenuOverlay.addEventListener("click", () => {
    elements.sideMenu.classList.add("right-closed");
    elements.navigatorPanel.classList.remove("mobile-open");
    updateOverlay();
  });
}

function toggleMenu() {
  elements.sideMenu.classList.toggle("right-closed");
  updateOverlay();
}

function updateOverlay() {
  const menuOpen = !elements.sideMenu.classList.contains("right-closed");
  const navOpen = elements.navigatorPanel.classList.contains("mobile-open");
  if (menuOpen || navOpen) {
    elements.sideMenuOverlay.classList.remove("hidden");
  } else {
    elements.sideMenuOverlay.classList.add("hidden");
  }
}

function renderStats() {
  const answered = state.bank.filter((item) => item.answer).length;
  const coverage = state.bank.length
    ? Math.round((answered / state.bank.length) * 100)
    : 0;

  elements.totalQuestions.textContent = state.bank.length;
  elements.answerCoverage.textContent = `${coverage}%`;
}

function startQuiz() {
  const limit = Number(elements.questionLimit.value) || state.bank.length;
  const shuffleQuestions = elements.shuffleQuestions.checked;
  const shuffleOptions = elements.shuffleOptions.checked;

  state.answers = {};
  state.currentIndex = 0;
  state.quiz = [...state.bank];
  state.isGraded = false;

  if (shuffleQuestions) {
    shuffleInPlace(state.quiz);
  }

  state.quiz = state.quiz.slice(0, Math.min(limit, state.bank.length)).map((item) => {
    const optionsEntries = Object.entries(item.options);
    if (shuffleOptions) {
      shuffleInPlace(optionsEntries);
    }
    return {
      ...item,
      renderedOptions: optionsEntries,
    };
  });

  if (!state.quiz.length) {
    elements.quizStatus.textContent = "Khong co cau hoi de tao de thi.";
    return;
  }

  elements.quizStatus.textContent = `Da tao de ${state.quiz.length} cau. Dang lam bai...`;
  elements.quizEmptyState.classList.add("hidden");
  elements.quizCard.classList.remove("hidden");
  elements.navigatorPanel.classList.remove("hidden");
  elements.inlineFeedback.classList.add("hidden");
  renderNavigator();
  renderCurrentQuestion();
}

function resetQuiz() {
  state.quiz = [];
  state.answers = {};
  state.currentIndex = 0;
  state.isGraded = false;
  elements.quizStatus.textContent = "San sang tai ngan hang cau hoi.";
  elements.quizEmptyState.classList.remove("hidden");
  elements.quizCard.classList.add("hidden");
  elements.navigatorPanel.classList.add("hidden");
  elements.inlineFeedback.classList.add("hidden");
}

function renderCurrentQuestion() {
  const question = state.quiz[state.currentIndex];
  if (!question) return;

  elements.questionCounter.textContent = `Cau ${state.currentIndex + 1}/${state.quiz.length}`;
  elements.questionIdBadge.textContent = `ID ${question.id}`;
  elements.questionText.textContent = question.question;
  elements.optionsList.innerHTML = "";

  question.renderedOptions.forEach(([label, text]) => {
    const button = document.createElement("button");
    button.className = "option-btn";
    button.textContent = `${label}. ${text}`;

    const isPicked = state.answers[question.id] === label;
    if (isPicked) {
      button.classList.add("selected");
    }

    if (state.isGraded) {
      if (question.answer === label) {
        button.classList.add("correct");
      } else if (isPicked && question.answer !== label) {
        button.classList.add("wrong");
      }
    }

    button.addEventListener("click", () => {
      if (state.isGraded) return;
      state.answers[question.id] = label;
      renderCurrentQuestion();
    });
    elements.optionsList.appendChild(button);
  });

  updateNavigator();

  elements.inlineFeedback.className = "feedback-box hidden";
  if (state.isGraded) {
    elements.inlineFeedback.classList.remove("hidden");
    const picked = state.answers[question.id];
    if (!question.answer) {
      elements.inlineFeedback.classList.add("warning");
      elements.inlineFeedback.innerHTML = "⚠️ Câu này chưa có đáp án trong ngân hàng dữ liệu.";
    } else if (picked === question.answer) {
      elements.inlineFeedback.classList.add("correct");
      elements.inlineFeedback.innerHTML = "✅ Chính xác!";
    } else {
      elements.inlineFeedback.classList.add("wrong");
      elements.inlineFeedback.innerHTML = `❌ Sai rồi. Đáp án đúng là: <strong>${question.answer}</strong>`;
    }
  }
}

function renderNavigator() {
  elements.navigatorGrid.innerHTML = "";
  state.quiz.forEach((question, index) => {
    const btn = document.createElement("button");
    btn.className = "nav-btn";
    btn.textContent = index + 1;
    btn.addEventListener("click", () => {
      state.currentIndex = index;
      renderCurrentQuestion();
      elements.navigatorPanel.classList.remove("mobile-open");
      updateOverlay();
    });
    elements.navigatorGrid.appendChild(btn);
  });
  updateNavigator();
}

function updateNavigator() {
  if (!elements.navigatorGrid.children.length) return;
  const buttons = elements.navigatorGrid.querySelectorAll(".nav-btn");
  
  state.quiz.forEach((question, index) => {
    const btn = buttons[index];
    if (!btn) return;

    btn.className = "nav-btn"; 
    if (index === state.currentIndex) btn.classList.add("active-question");

    const picked = state.answers[question.id] ?? null;

    if (state.isGraded) {
      if (!question.answer) {
        btn.classList.add("warning"); 
      } else if (picked === question.answer) {
        btn.classList.add("correct");
      } else {
        btn.classList.add("wrong"); 
      }
    } else {
      if (picked) btn.classList.add("answered");
    }
  });
}

function moveQuestion(step) {
  const nextIndex = state.currentIndex + step;
  if (nextIndex < 0 || nextIndex >= state.quiz.length) return;
  state.currentIndex = nextIndex;
  renderCurrentQuestion();
}

function submitQuiz() {
  if (!state.quiz.length) return;

  state.isGraded = true;
  
  let graded = 0;
  let correct = 0;
  let unansweredKey = 0;

  state.quiz.forEach((question) => {
    const picked = state.answers[question.id] ?? null;
    if (question.answer) {
      graded += 1;
      if (picked === question.answer) correct += 1;
    } else {
      unansweredKey += 1;
    }
  });

  const scoreText = graded
    ? `Hoàn thành! Bạn đúng ${correct}/${graded} câu.`
    : "Chưa có câu nào có đáp án để chấm.";

  elements.quizStatus.textContent = `${scoreText} ${unansweredKey ? `(${unansweredKey} câu thiếu đáp án)` : ""}`;
  renderCurrentQuestion();
}

function renderQuestionList() {
  const keyword = elements.searchInput.value.trim().toLowerCase();
  state.filtered = state.bank.filter((item) => {
    if (!keyword) return true;
    return (
      item.question.toLowerCase().includes(keyword) ||
      Object.values(item.options).some((option) => option.toLowerCase().includes(keyword))
    );
  });

  elements.questionList.innerHTML = "";

  state.filtered.forEach((item) => {
    const wrapper = document.createElement("article");
    wrapper.className = "question-list-item";

    const answerMarkup = ["A", "B", "C", "D"]
      .filter((label) => item.options[label])
      .map((label) => {
        const active = item.answer === label ? "active" : "";
        return `<button class="answer-chip ${active}" data-id="${item.id}" data-answer="${label}">${label}</button>`;
      })
      .join("");

    wrapper.innerHTML = `
      <div class="question-list-item-header">
        <strong>Cau ${item.id}</strong>
        <span class="badge">${item.answer ?? "Chua gan dap an"}</span>
      </div>
      <p>${item.question}</p>
      <div class="muted">${Object.entries(item.options)
        .map(([label, text]) => `${label}. ${text}`)
        .join("<br />")}</div>
      <div class="answer-picker">${answerMarkup}</div>
    `;

    elements.questionList.appendChild(wrapper);
  });

  elements.questionList.querySelectorAll(".answer-chip").forEach((button) => {
    button.addEventListener("click", () => {
      const id = Number(button.dataset.id);
      const answer = button.dataset.answer;
      const found = state.bank.find((item) => item.id === id);
      if (!found) return;
      found.answer = answer;
      persistAnswers();
      renderStats();
      renderQuestionList();
    });
  });
}

function parseOcrInput() {
  const raw = elements.ocrInput.value.trim();
  if (!raw) {
    elements.importStatus.textContent = "Chua co noi dung OCR/Text de parse.";
    return;
  }

  const incoming = parseQuestionText(raw);
  if (!incoming.length) {
    elements.importStatus.textContent = "Khong nhan dang duoc cau hoi hop le tu doan OCR/Text.";
    return;
  }

  const bankMap = new Map(state.bank.map((item) => [item.id, item]));
  incoming.forEach((question) => {
    bankMap.set(question.id, question);
  });

  state.bank = [...bankMap.values()].sort((a, b) => a.id - b.id);
  persistAnswers();
  renderStats();
  renderQuestionList();
  elements.importStatus.textContent = `Da parse them ${incoming.length} cau hoi vao ngan hang hien tai.`;
}

function parseQuestionText(raw) {
  const lines = raw
    .split(/\r?\n/)
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  const questions = [];
  let current = null;
  let currentOption = null;

  lines.forEach((line) => {
    const questionMatch = line.match(/^(\d{1,4})\s+(.+)$/);
    if (questionMatch) {
      if (current && Object.keys(current.options).length >= 2) {
        questions.push(current);
      }
      current = {
        id: Number(questionMatch[1]),
        question: questionMatch[2],
        options: {},
        answer: null,
        source: "ocr-import",
      };
      currentOption = null;
      return;
    }

    const optionMatch = line.match(/^([A-D])[\.\):,]+\s*(.+)$/);
    if (optionMatch && current) {
      currentOption = optionMatch[1];
      current.options[currentOption] = optionMatch[2];
      return;
    }

    if (current && currentOption) {
      current.options[currentOption] = `${current.options[currentOption]} ${line}`;
    } else if (current) {
      current.question = `${current.question} ${line}`;
    }
  });

  if (current && Object.keys(current.options).length >= 2) {
    questions.push(current);
  }

  return questions;
}

function exportCurrentData() {
  const payload = {
    exportedAt: new Date().toISOString(),
    questionCount: state.bank.length,
    questions: state.bank,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "question-bank-export.json";
  link.click();
  URL.revokeObjectURL(url);
}

function persistAnswers() {
  const answerMap = Object.fromEntries(
    state.bank.filter((item) => item.answer).map((item) => [item.id, item.answer]),
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ answerMap }));
}

function readStorage() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function shuffleInPlace(items) {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [items[index], items[swapIndex]] = [items[swapIndex], items[index]];
  }
}

init().catch(() => {
  elements.quizStatus.textContent = "Khong tai duoc du lieu cau hoi.";
});
