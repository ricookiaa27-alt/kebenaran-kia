import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js";
import { getDatabase, ref, set, get, update, onValue } from "https://www.gstatic.com/firebasejs/10.12.3/firebase-database.js";

// 🔥 Firebase Config PUNYA KAMU
const firebaseConfig = {
  apiKey: "AIzaSyC-Ag9l5molWYbXQ96EkArdigi7vlBHFA8",
  authDomain: "kia-rico-forever.firebaseapp.com",
  databaseURL: "https://kia-rico-forever-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "kia-rico-forever",
  storageBucket: "kia-rico-forever.firebasestorage.app",
  messagingSenderId: "609269521028",
  appId: "1:609269521028:web:f7c452627f7783454b40d1"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const joinBtn = document.getElementById("joinBtn");
const roomInput = document.getElementById("roomCode");
const info = document.getElementById("info");
const boardDiv = document.getElementById("board");
const resetBtn = document.getElementById("resetBtn");

const cells = document.querySelectorAll(".cell");

let roomCode = "";
let playerSymbol = "";
let myTurn = false;

const winConditions = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
];

joinBtn.addEventListener("click", async () => {
  roomCode = roomInput.value.trim().replace(/\s+/g, "");
  if (!roomCode) return alert("Masukkan kode room!");

  const roomRef = ref(db, "rooms/" + roomCode);
  const snapshot = await get(roomRef);

  if (!snapshot.exists()) {
    // Buat room baru
    await set(roomRef, {
      board: ["","","","","","","","",""],
      turn: "X",
      winner: "",
      players: 1
    });

    playerSymbol = "X";
    myTurn = true;
    info.textContent = `Room dibuat: ${roomCode} (Kamu X)`;
  } else {
    const data = snapshot.val();

    if (data.players >= 2) {
      return alert("Room sudah penuh!");
    }

    await update(roomRef, {
      players: 2
    });

    playerSymbol = "O";
    myTurn = false;
    info.textContent = `Masuk room: ${roomCode} (Kamu O)`;
  }

  boardDiv.style.display = "grid";
  resetBtn.style.display = "block";

  listenRoom();
});

function listenRoom() {
  const roomRef = ref(db, "rooms/" + roomCode);

  onValue(roomRef, (snapshot) => {
    if (!snapshot.exists()) return;

    const data = snapshot.val();
    const board = data.board;

    board.forEach((val, i) => {
      cells[i].textContent = val;
    });

    if (data.winner) {
      info.textContent = `Pemenang: ${data.winner}`;
      myTurn = false;
      return;
    }

    myTurn = (data.turn === playerSymbol);
    info.textContent = myTurn ? "Giliran kamu!" : "Giliran kesayanganmu...";
  });
}

cells.forEach(cell => {
  cell.addEventListener("click", async () => {
    if (!roomCode) return;
    if (!myTurn) return alert("Belum giliran kamu!");

    const index = cell.getAttribute("data-i");
    const roomRef = ref(db, "rooms/" + roomCode);

    const snapshot = await get(roomRef);
    const data = snapshot.val();

    if (data.board[index] !== "") return;

    data.board[index] = playerSymbol;

    const winner = checkWinner(data.board);

    await update(roomRef, {
      board: data.board,
      turn: playerSymbol === "X" ? "O" : "X",
      winner: winner
    });
  });
});

function checkWinner(board) {
  for (let cond of winConditions) {
    const [a,b,c] = cond;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }

  if (!board.includes("")) return "Seri";
  return "";
}

resetBtn.addEventListener("click", async () => {
  if (!roomCode) return;

  const roomRef = ref(db, "rooms/" + roomCode);

  await update(roomRef, {
    board: ["","","","","","","","",""],
    turn: "X",
    winner: ""
  });
});