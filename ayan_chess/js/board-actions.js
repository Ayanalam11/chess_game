function updateEngineSkill() {
  if (engineSkill != parseInt($('#game-difficulty-skill-value').text())) {
    engineSkill = parseInt($('#game-difficulty-skill-value').text());
    stockfish.postMessage('setoption name skill level value ' + engineSkill);
    console.log('Skill level is ' + engineSkill + ' (setoption name skill level value ' + engineSkill + ')');
  }
}

function gameHistoryAddMove(position) {

  var moves = [position];

  if (!localStorage.getItem('boardHistory')) {
    localStorage.setItem('boardHistory', JSON.stringify(moves));
    return;
  }

  moves = JSON.parse(localStorage.getItem('boardHistory'));
  moves.push(position);

  localStorage.setItem('boardHistory', JSON.stringify(moves));

}

function gameHistoryGet() {
  return JSON.parse(localStorage.getItem('boardHistory'));
}

function gameHistoryClear() {
  localStorage.removeItem('boardHistory', '');
}

// Load custom board from FEN string

function loadBoard(fen, fromHistory = false) {

  var gameValidation = game.validate_fen(fen);

  if (!gameValidation.valid) {
    console.log('Error ' + gameValidation.error_number + ': ' + gameValidation.error);
    alert('Error ' + gameValidation.error_number + ': ' + gameValidation.error);
    return;
  };

  if (fromHistory) {
    board.position(fen);
    return;
  }

  $('#btn-take-back').addClass('hidden');

  setDesktopBoard();

  gameEnd = false;

  board.position(fen);
  game = new Chess(fen);

  if (game.turn() == 'w') {
    firstTurn = 'player';
    $('#game-turn').text('White turn.');

    $('#game-first-turn span').removeClass('active');
    $('#game-first-turn .player').addClass('active');
  }

  if (game.turn() == 'b') {
    firstTurn = 'computer';
    $('#game-turn').text('Black turn.');

    $('#game-first-turn span').removeClass('active');
    $('#game-first-turn .computer').addClass('active');
  }

  $('#btn-start-game').removeClass('hidden');

  $('#btn-start-game').click(function() {

    $('#btn-start-game').addClass('hidden');

    console.log('Turn: ' + firstTurn);

    if (firstTurn == 'player') {
      $('#board').removeClass('locked');
    }

    if (firstTurn == 'computer' && !engineDisabled) {
      $('#board').addClass('locked');
      updateEngineSkill();
      stockfish.postMessage('position fen ' + board.fen() + ' ' + game.turn());
      stockfish.postMessage('go depth ' + engineSkill);
    }

    startTimer();

    $('#game-state').addClass('hidden');

  });

}

// make opponent turn

function opponentTurn() {

  console.log('Opponent turn.');

  stopTimer();

  if (promotionEvent) {
    console.log('Debug 13');
    board.position(game.fen());
    gameHistoryAddMove(game.fen());
    promotionEvent = false;
  }

  $('#board').addClass('locked');

  console.log('Game started: ' + gameStarted);

  if (!gameStarted) {
    gameStarted = true;
    $('#btn-choose-white-side, #btn-choose-black-side').addClass('locked');
  }

  console.log('Game end (1): ' + gameEnd);

  if (engineDisabled) {
    if(togglePlayer) {
      checkPositions('computer');
    } else {
      checkPositions('player');
    }
    togglePlayer = !togglePlayer;
  } else {
    checkPositions('computer');
    togglePlayer = true;
  }

  console.log('Game end (2): ' + gameEnd);

  if (gameEnd) {
    console.log('The game is finished.');
    return;
  }

  console.log('Engine: position fen ' + game.fen());

  if (!engineDisabled) {
    updateEngineSkill();

    setTimeout(function() {
      stockfish.postMessage('position fen ' + game.fen());
      stockfish.postMessage('go depth ' + engineSkill);
    }, 500);

    startTimer();
  }
}

// make pawn promotion to queen or whatever

function makePromotion(source, target, promotion) {

  game.undo();

  game.move({
    from: source,
    to: target,
    promotion: promotion
  });

}

// check sides and player turn if it was changed manually

function checkTurn() {

  console.log('player side ' + playerSide);
  console.log('game turn ' + game.turn());
  console.log('first turn ' + firstTurn);

  if (firstTurn == 'player') {
    if (playerSide == 'w') {
      game.setTurn('w');
    }
    if (playerSide == 'b') {
      game.setTurn('b');
    }
  }

  if (firstTurn == 'computer') {
    if (playerSide == 'w') {
      game.setTurn('b');
    }
    if (playerSide == 'b') {
      game.setTurn('w');
    }
  }

  console.log('game turn ' + game.turn());
}

function checkPositions(turn) {
console.log('Checking positions', turn);
  if (game.in_checkmate()) {
    postEndGame();
    $('#game-state').text('Checkmate').removeClass('hidden');
  }

  else if (game.in_draw()) {
    postEndGame();
    $('#game-state').text('The game has ended in a draw.').removeClass('hidden');
  }

  else if (game.in_stalemate()) {
    postEndGame();
    $('#game-state').text('The game has ended in a stalemate (draw).').removeClass('hidden');
  }

  else if (game.in_check()) {
    $('#board').removeClass('locked');
  }

  else {
    if (turn == 'player') {
      $('#board').removeClass('locked');
    }

    if (turn == 'computer') {
      if(engineDisabled) {
        $('#board').removeClass('locked');
      } else {
        $('#board').addClass('locked');
      }
    }
  }

}

function postEndGame() {
    gameEnd = true;

    document.getElementById("btn-switch-sides").disabled = true;
    $('#btn-switch-sides').addClass('disabled');

    document.getElementById("btn-show-hint").disabled = true;
    $('#btn-show-hint').addClass('disabled');

    $('#game-turn').addClass('hidden');

    return;
}
