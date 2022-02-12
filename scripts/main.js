/*
 * Ten Thousand
 *
 * By Vince Aquilina
 *
 *
 * A dice game based on Farkle (https://www.dicegamedepot.com/farkle-rules/).
 *
 * I've changed some of the rules in order to make the game more suited to solo play.
 * The object of the game is to score at least 10,000 points within 10 rounds.
 * See "how to play" on the game page for instructions.
 *
 */

/*
 * TODO
 * 
 * - hide both buttons if player has not held at least one die
*  - hide roll button if all dice are held or locked
 * - display round total in livescore() after 1st roll?
 * - disallow rolling if all available dice are held
 *
 */


function game() 
{
  const ROUND_LIMIT = 10;   // maximum allowed rounds
  round = 0;                // round counter
  roll = 0;                 // roll counter
  var hot_dice = false;     // player has [not] scored on all dice


  /* main dice array */
  var dice = [
    {
      value: 0,       // face value
      held: false,    // die is [not] held for scoring
      locked: false,  // die is [not] in play
    },
    {
      value: 0,
      held: false,
      locked: false,
    },
    {
      value: 0,
      held: false,
      locked: false,
    },
    {
      value: 0,
      held: false,
      locked: false,
    },
    {
      value: 0,
      held: false,
      locked: false,
    },
    {
      value: 0,
      held: false,
      locked: false,
    },
  ];

  /* scoring object */
  var scores = {
    roll_total: 0,
    round_total: 0,
    game_total: 0
  };

  // make dice selectable
  var die_id = document.getElementById("die0");
  for (let i = 0; i < 6; ++i) {
    die_id = document.getElementById("die"+i);
    die_id.addEventListener("click", function (event) { select(i); }, false);
  }

  /* starts a new game */
  function newGame() 
  {
    event.preventDefault();

    round = 0;

    console.log("started new game");

    /* change 'play' button to 'roll' */
    const roll_btn = document.getElementById("roll");
    roll_btn.innerHTML = "roll";
    roll_btn.removeEventListener("click", newGame, false);
    roll_btn.addEventListener("click", rollDice, false);

    resetScores();

    resetScoreBoard();

    newRound();
  }
  document.getElementById("roll").addEventListener("click", newGame, false);

  /* starts a new round */
  function newRound()
  {
    /* print game score to title area */
    document.getElementById("totalscore").innerHTML = scores.game_total + ".";

    /* reset roll button */
    const roll_btn = document.getElementById("roll");
    roll_btn.innerHTML = "roll";
    roll_btn.removeEventListener("click", bank, false);
    roll_btn.addEventListener("click", rollDice, false);

    ++round;

    console.log("started round", round);

    displayRound();

    resetHolds();

    resetLocks();

    resetRoll();

    scores.round_total = 0;
    console.log("reset round_total");

    drawDice(); 

    /* hide bank button */
    document.getElementById("bank").style.display = "none";

  }

  /* generates dice values */
  function rollDice()
  {
    event.preventDefault();
      
    if (roll === 0 || checkHolds() > 0) {
      resetGameScore();

      /* preserve score from previous roll */
      if (roll > 0) {
        scores.round_total += scores.roll_total;
        updateScoreBoard();
      }

      scores.roll_total = 0;
      
      console.log("saved prev roll total. roll total now:", scores.roll_total, "round_total:", scores.round_total);

      ++roll;

      /* enable bank button */
      const bank_btn = document.getElementById("bank");
      bank_btn.disabled = false;
      bank_btn.style.display = "inherit";
      bank_btn.addEventListener("click", bank, false);

      
      if (hot_dice === false) {
        lockHeld();
      }
      else {
        hot_dice = false;
        document.getElementById("roll").innerHTML = "roll";

        console.log("set hot_dice to false");
      }

      resetHolds();

      for (let i = 0; i < 6; ++i) {
        /* ignore locked dice */
        if (dice[i].locked === false) {
          dice[i].value = Math.floor((Math.random() * 6) + 1);
        }
      }

      // DEBUG -- force values
      // dice[0].value = 6;
      // dice[1].value = 6;
      // dice[2].value = 6;
      // dice[3].value = 6;
      // dice[4].value = 6;
      // dice[5].value = 6;

      console.log("ROUND[", round, "] ROLL[", roll, "]:", ...dice);

      drawDice();

      /* get highest score of current roll */
      var score = checkScore(dice);

      /* check for bust */
      if (score === 0) {
        lockDice();

        bust();
      }
      /* check for hot dice */
      else if (checkForHotDice(score) === true) {
        hotDice(score);
      }
    }
  }

  /* draws dice to game area */
  function drawDice() 
  {
    var diceGlyph = document.getElementById("die0");
    for (let i = 0; i < 6; ++i) {
      diceGlyph = document.getElementById("die"+i);
      switch (dice[i].value) {
        case 1:
          diceGlyph.className = "fas fa-dice-one";
          break;
        case 2:
          diceGlyph.className = "fas fa-dice-two";
          break;
        case 3:
          diceGlyph.className = "fas fa-dice-three";
          break;
        case 4:
          diceGlyph.className = "fas fa-dice-four";
          break;
        case 5:
          diceGlyph.className = "fas fa-dice-five";
          break;
        case 6:
          diceGlyph.className = "fas fa-dice-six";
          break;
        default:
          diceGlyph.className = "fas fa-square";
      }
    }
    console.log("drew dice to game area");
  }

  /* banks points and advances round */
  function bank() 
  {
    event.preventDefault();

    if (round <= ROUND_LIMIT && roll > 0) {
      scores.round_total += scores.roll_total;
      scores.game_total += scores.round_total;

      /* print roll score to score chart */
      if (scores.roll_total > 0) {
        document.getElementById("round" + round).innerHTML += "<span>" + scores.roll_total + "</span>";
      }
      else {
        document.getElementById("round" + round).innerHTML += '<span>BUST</span>';
      }

      /* print round score to score chart */
      document.getElementById("round"+round).innerHTML += '<span style="background-color:rgba(73,26,6,0.2);color:#000;">' + scores.round_total + '</span>';

      /* print game score to title area */
      document.getElementById("totalscore").innerHTML = scores.game_total + ".";

      console.log("banked", scores.round_total, "points. game total now:", scores.game_total);

      var won = checkForWin();

      if (round === ROUND_LIMIT || won === true) {
        /* disable bank button */
        document.getElementById("bank").disabled = true;
      }
      else {
        newRound();
      }
    }
  }

  /* evaluates a roll and returns score */
  function checkScore(diceArr)
  {
    var score = 0;  // score to return

    /* deep clone array */
    var sample = JSON.parse(JSON.stringify(diceArr));

    console.log("sample:", ...sample);

    /* check and store frequency (how many of each value appear in sample)
      * the key in this array represents the face value of the die
      */
    var frequency = [];
    for (let i = 0; i <= 6; ++i) {
      frequency[i] = 0;
    }
    console.log("reset frequency");

    for (let i = 0; i < 6; ++i) {
      for (let j = 1; j <= 6; ++j) {
        if (sample[i].value === j && sample[i].locked === false) {
          ++frequency[j];
        }
      }
    }
    console.log("frequency", ...frequency);

    /* scoring logic ---------------------------------------------------------------------------------------------------- */

    var num_pairs = 0;
    var straight = 0;   // tracks number of values that appear exactly once

    for (let i = 1; i <= 6; ++i) {
      // check for six of a kind */
      if (frequency[i] === 6) {
        score += (i * 1500);
        console.log("six of a kind, face value", i);
        break;
      }
      // check for five of a kind */
      else if (frequency[i] === 5) {
        score += (i * 1300);
        console.log("five of a kind, face value", i);
      }
      // check for four of a kind 
      else if (frequency[i] === 4) {
        score += (i * 1100);
        console.log("four of a kind, face value", i);
      }
      // check for three of a kind 
      else if (frequency[i] === 3) {
        if (i === 1) {
          score += 1000;
        }
        else {
          score += (i * 100);
        }
        console.log("three of a kind, face value", i);
      }
      // check for pair
      else if (frequency[i] === 2) {
        ++num_pairs;
      }
      // count number of values that appear exactly once
      else if (frequency[i] === 1) {
        ++straight;
      }

      // check for 1s and 5s not part of a greater score
      if (i === 1 && frequency[1] > 0 && frequency[1] < 3) {
        score += (frequency[1] * 100);
        console.log(frequency[1],"individual 1s");
      }
      else if (i === 5 && frequency[5] > 0 && frequency[5] < 3) {
        score += (frequency[5] * 50);
        console.log(frequency[5],"individual 5s");
      }
    }
    // check for three pairs
    if (num_pairs === 3) {
      score = 1500;
      console.log("3 pairs");
    }
    // check for straight
    else if (straight === 6) {
      score = 3000;
      console.log("straight");
    }
    /* end scoring logic ------------------------------------------------------------------------------------------------ */

    /* DEBUG */
    console.log("score returned", score);

    return score;
  }

  /* evaluate score of held dice, in real time */
  function liveScore()
  {
    /* deep close dice array */
    var sample = JSON.parse(JSON.stringify(dice));

    /* remove dice that are not held from sample */
    for (let i = 0; i < 6; ++i) {
      if (sample[i].held == false) {
        sample[i].value = 0;
      }
    }

    console.log("liveScore sample:", ...sample);

    /* print points awarded from held dice to title area */
    let pointsAwarded = checkScore(sample);
    if (pointsAwarded > 0) {
      document.getElementById("totalscore").innerHTML = (scores.game_total + "\t+" + pointsAwarded);
    }
    else {
      document.getElementById("totalscore").innerHTML = scores.game_total + ".";
    }

    scores.roll_total = pointsAwarded;
  }

  /* checks how many dice player has set aside */
  function checkHolds()
  {
    var holds = 0;
    for (let i = 0; i < 6; ++i) {
      if (dice[i].held === true) {
        ++holds;
      }
    }
    return holds;
  }

  /* ends round and resets all points earned when player rolls a bust */
  function bust()
  {
    console.log("bust");

    scores.round_total = 0;

    /* print message to game score area */
    document.getElementById("totalscore").innerHTML = scores.game_total + "\tbust!";

    /* hide bank button */
    document.getElementById("bank").style.display = "none";

    /* change roll button */
    let roll_btn = document.getElementById("roll");
    roll_btn.innerHTML = "next round";
    roll_btn.removeEventListener("click", rollDice, false);
    roll_btn.addEventListener("click", bank, false);
  }

  /* automatically selects all dice, adds points to round_total, returns all dice to hand */
  function hotDice(roll_score)
  {
    console.log("hot dice!");
    hot_dice = true;

    resetLocks();

    for (let i = 0; i < 6; ++i) {
      select(i);
    }

    /* print hot dice message to game score area */
    document.getElementById("totalscore").innerHTML = scores.game_total + "\thot dice!";

    scores.roll_total = roll_score;

    /* change roll button */
    document.getElementById("roll").innerHTML = "roll again";
  }

  /* checks roll for hot dice */
  function checkForHotDice(roll_score) 
  {
    console.log("testing for hot dice");

    /* deep clone array */
    var sample = JSON.parse(JSON.stringify(dice));

    /* remove one die from roll at a time, replacing the previous, to see if it affects the score */
    var hot_dice_counter = 0;
    for (let i = 0; i < 6; ++i) {
      sample[i].value = 0;
      if (i != 0) {
        sample[i - 1].value = dice[i - 1].value;
      }
      
      /* if each die contributes to the roll score, player has rolled hot dice */
      let sampleScore = checkScore(sample);
      if (sampleScore < roll_score) {
        ++hot_dice_counter;
        console.log("die",i,"is a scoring die");
      }
    }
    if (hot_dice_counter === 6) {
      return true;
    }
    else {
      return false;
    }
  }

  /* displays win message */
  function win()
  {
    lockDice();

    if (scores.game_total >= 20000) {
      document.getElementById("totalscore").innerHTML = scores.game_total + "\tholy shit!";
    }
    else {
      document.getElementById("totalscore").innerHTML = scores.game_total + "\tyou win!";
    }
    console.log("win");

    /* hide bank button */
    document.getElementById("bank").style.display = "none";

    /* change roll button */
    let roll_btn = document.getElementById("roll");
    roll_btn.innerHTML = "new game";
    roll_btn.removeEventListener("click", rollDice, false);
    roll_btn.addEventListener("click", newGame, false);
  }

  /* displays game over message */
  function lose()
  {
    lockDice();

    document.getElementById("totalscore").innerHTML = scores.game_total + "\tgame over";
    console.log("game over");

    /* hide bank button */
    document.getElementById("bank").style.display = "none";

    /* change roll button */
    let roll_btn = document.getElementById("roll");
    roll_btn.innerHTML = "new game";
    roll_btn.removeEventListener("click", rollDice, false);
    roll_btn.addEventListener("click", newGame, false);
  }

  /* evaluates final game score, displays appropriate message */
  function checkForWin() 
  {
    var won = false;
    if (scores.game_total >= 10000) {
      win();
      won = true;
    }
    else if (round === ROUND_LIMIT) {
      lose();
    }

    return won;
  }

  /* displays current round */
  function displayRound()
  {
    document.getElementById("scoretitle").innerHTML = ("scores\t(current round: " + round + ")");

    console.log("printed round number to scoreboard");
  }

  /* locks all dice */
  function lockDice()
  {
    /* lock dice */
    for (let i = 0; i < 6; ++i) {
        dice[i].locked = true;
    }
  }

  /* locks previously held dice */
  function lockHeld()
  {
    for (let i = 0; i < 6; ++i) {
      if (dice[i].held === true) {
        dice[i].locked = true;

        /* reduce opacity */
        document.getElementById("die" + i).style.color = "rgba(55, 57, 70, 0.8)";
      }
    }
    console.log("locked held dice");
  }

  /* resets roll values to zero */
  function resetRoll()
  {
    roll = 0;

    for (let i = 0; i < 6; ++i) {
      dice[i].value = 0;
    }

    console.log("reset roll counter & dice values to zero");
  }

  /* prints roll total to score board */
  function updateScoreBoard()
  {
    if (scores.roll_total > 0) {
      document.getElementById("round" + round).innerHTML += "<span>" + scores.roll_total + "</span>";
    }
    else {
      document.getElementById("round" + round).innerHTML += "<span>X</span>";
    }
  }

  /* resets scoreboard */
  function resetScoreBoard() 
  {
    for (i = 1; i <= ROUND_LIMIT; ++i) {
      if (i < 10) {
        document.getElementById("round" + i).innerHTML = "round&nbsp;&nbsp;" + i + ".";
      }
      else {
        document.getElementById("round" + i).innerHTML = "round&nbsp;" + i + ".";
      }
    }
    console.log("reset scoreboard");
  }

  /* resets game score area to it's default display (game total) */
  function resetGameScore()
  {
    document.getElementById("totalscore").innerHTML = scores.game_total + ".";
  }

  /* resets all scores to zero */
  function resetScores()
  {
    scores.roll_total = 0;
    scores.round_total = 0;
    scores.game_total = 0;

    console.log("reset all scores to zero");
  }

  /* releases all holds */
  function resetHolds() 
	{
    for (let i = 0; i < 6; ++i) {
      if (dice[i].held === true) {
        select(i);
        dice[i].held = false;
      }
    }
    console.log("reset holds");
  }

	/* unlocks all dice */
	function resetLocks()
	{
    for (let i = 0; i < 6; ++i) {
      if (dice[i].locked === true) {
        dice[i].locked = false;
        /* reset opacity */
        document.getElementById("die" + i).style.color = "#491a06";
      }
    }
    console.log("unlocked dice");
	}

  /* select/deselect die */
  function select(die)
  {
    event.preventDefault();

    if (roll > 0) {
      if (dice[die].held === false && dice[die].locked === false) {
        /* select die */
        document.getElementById("die" + die).style.color = "#373946";
        dice[die].held = true;

        console.log("held die", die);

        liveScore();
      }
      else if (dice[die].locked === false) {
        /* deselect die */
        document.getElementById("die" + die).style.color = "#491a06";
        dice[die].held = false;

        console.log("returned die", die, "to roll");

        liveScore();
      }
    }
  }

  /* show/hide instructions */
  const helplink = document.getElementById("helplink");
  helplink.addEventListener("click", function showHelp(event) 
    {
      event.preventDefault();

      const help = document.getElementById("help");
      if (help.style.display === "block") {
        help.style.display = "none";
        helplink.innerHTML = "how to play";
      }
      else {
        help.style.display = "block";
        helplink.innerHTML = "hide help";
      }
    }, false);

}
