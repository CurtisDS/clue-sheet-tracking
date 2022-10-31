import { Component, OnInit } from '@angular/core';
import { CardType, CurrentCardShown, CurrentGuess, enumValues, GameObject, GameStates, SuspectInfo, GameObjectHistory, Card, Guess, filterUnknownOrOwned, filterIsKnownNotOwned, filterIsKnown, filterIsUnknown } from '../game';
import { Suspect, Theme } from '../clue';
import { MenuState } from '../app.component';

const UnknownSelection = "Not yet selected";

@Component({
  selector: 'app-game-console',
  templateUrl: './game-console.component.html',
  styleUrls: ['./game-console.component.scss']
})
export class GameConsoleComponent implements OnInit {

  constructor() { }

  readonly GameStates = GameStates;

  get currentGuessSuspectName(): string {
    if(!GameObject.currentGuess.hasSuspect) return UnknownSelection;
    return GameObject.suspectInfo[GameObject.currentGuess.suspectIndex].selectedSuspectControl.value.shortname;
  }

  get currentGuessWeaponName(): string {
    if(!GameObject.currentGuess.hasWeapon) return UnknownSelection;
    return GameObject.clueThemeControl.value.weapons[GameObject.currentGuess.weaponIndex];
  }

  get currentGuessRoomName(): string {
    if(!GameObject.currentGuess.hasRoom) return UnknownSelection;
    return GameObject.clueThemeControl.value.rooms[GameObject.currentGuess.roomIndex];
  }

  get currentPlayerShowingCardName(): string {
    if(GameObject.currentPlayerIndexShowingCard === undefined) return UnknownSelection;
    return GameObject.activePlayersList[GameObject.currentPlayerIndexShowingCard].selectedSuspectControl.value.shortname;
  }

  get currentCardShownToYou(): string {
    if(!this.hasUserSelectedCardShown) return UnknownSelection;
    switch(GameObject.currentCardShownToYou.cardType) {
      case CardType.Suspects:
        return GameObject.suspectInfo[GameObject.currentCardShownToYou.cardIndex].selectedSuspectControl.value.shortname;
      case CardType.Weapons:
        return GameObject.clueThemeControl.value.weapons[GameObject.currentCardShownToYou.cardIndex];
      case CardType.Rooms:
        return GameObject.clueThemeControl.value.rooms[GameObject.currentCardShownToYou.cardIndex];
    }
  }

  get gameState(): GameStates {
    return GameObject.gameState;
  }

  get turnIndex(): number {
    return GameObject.turnIndex;
  }

  get activePlayer(): Suspect {
    switch(GameObject.gameState) {
      case this.GameStates.NotStarted:
      case  this.GameStates.ChooseYourCards:
        return GameObject.activePlayersList[0].selectedSuspectControl.value;
      case  this.GameStates.PlayerIsGuessing:
      case  this.GameStates.ChoosePlayerWhoShowedCard:
        return GameObject.activePlayersList[GameObject.turnIndex].selectedSuspectControl.value;
    }
  }

  get hasUserSelectedAllOwnedCards():boolean {
    return GameObject.activePlayersList[0].ownedCardCount === GameObject.activePlayersList[0].handSize;
  }

  get hasUserSelectedGuessedCards():boolean {
    return GameObject.currentGuess.isSet;
  }

  get hasUserSelectedPlayerWhoShowedCard():boolean {
    return GameObject.currentPlayerIndexShowingCard !== undefined;
  }

  get hasUserSelectedCardShown():boolean {
    return GameObject.currentCardShownToYou !== undefined && GameObject.currentCardShownToYou.isSet;
  }

  get usersCards(): string[] {
    const displayOutputCardList: string[] = new Array(GameObject.activePlayersList[0].handSize).fill(UnknownSelection);

    let lastKnownIndex = 0;

    GameObject.suspectInfo.forEach((suspect: SuspectInfo, index: number) => {
      // touchCard(GameObject.activePlayersList[0].knownCards.suspects,index);
      if(GameObject.activePlayersList[0].gameCards.suspects[index].isKnown) {
        displayOutputCardList[lastKnownIndex] = suspect.selectedSuspectControl.value.shortname;
        lastKnownIndex++;
      }
    });

    GameObject.clueThemeControl.value.weapons.forEach((weapon: string, index: number) => {
      // touchCard(GameObject.activePlayersList[0].knownCards.weapons,index);
      if(GameObject.activePlayersList[0].gameCards.weapons[index].isKnown) {
        displayOutputCardList[lastKnownIndex] = weapon;
        lastKnownIndex++;
      }
    });

    GameObject.clueThemeControl.value.rooms.forEach((room: string, index: number) => {
      // touchCard(GameObject.activePlayersList[0].knownCards.rooms,index);
      if(GameObject.activePlayersList[0].gameCards.rooms[index].isKnown) {
        displayOutputCardList[lastKnownIndex] = room;
        lastKnownIndex++;
      }
    });

    return displayOutputCardList;
  }

  ngOnInit() {
  }

  incrementTurnIndex() {
    GameObject.currentGuess = new CurrentGuess();
    GameObject.currentPlayerIndexShowingCard = undefined;
    GameObject.currentCardShownToYou = new CurrentCardShown();
    GameObject.turnIndex = (GameObject.turnIndex + 1) % GameObject.activePlayersList.length;
  }

  fillGuessThroughPlayers(startIndex: number, endIndex: number) {
    let steps = (endIndex - startIndex).mod(GameObject.activePlayersList.length);
    for (let playerIndex = 1; playerIndex <= steps && playerIndex < GameObject.activePlayersList.length; playerIndex++) {
      for(const cardType of enumValues(CardType)) {
        const targetPlayerIndex = (playerIndex + startIndex).mod(GameObject.activePlayersList.length);
        const cards = GameObject.activePlayersList[targetPlayerIndex].gameCards.getCards(cardType);
        let cardIndex: number|undefined =  GameObject.currentGuess.getIndexForType(cardType);
        // touchCard(cards, cardIndex);
        if(!cards[cardIndex].isKnown) {
          cards[cardIndex].setKnownNotOwned();
        }
      }
    }
  }

  setKnownForAllPlayers(cardType: CardType, cardIndex: number) {
    GameObject.activePlayersList.forEach(player => {
      const cards = player.gameCards.getCards(cardType);
      // touchCard(cards, cardIndex);
      if(!cards[cardIndex].isKnown) {
        cards[cardIndex].setKnownNotOwned();
      }
    });
  }

  skipToNextPlayer() { 
    if(GameObject.gameState == this.GameStates.ChoosePlayerWhoShowedCard) {
      // no one showed a card
      this.fillGuessThroughPlayers(GameObject.turnIndex, (GameObject.turnIndex - 1).mod(GameObject.activePlayersList.length));
      this.reconcileCards();
    }
    this.incrementTurnIndex();
    GameObject.gameState = this.GameStates.PlayerIsGuessing;
    GameObjectHistory.saveGameObjectState();
  }

  doNext() {
    switch(GameObject.gameState) {
      case this.GameStates.NotStarted:
        GameObjectHistory.saveGameObjectState();
        MenuState.showEditBordForm = false;
        GameObject.gameState = this.GameStates.ChooseYourCards;
      break;
      case this.GameStates.ChooseYourCards:
        GameObject.turnIndex = GameObject.getActivePlayerIndexFromSuspectID(GameObject.firstPlayerSuspectIDControl.value);
        
        for(const cardType of enumValues(CardType)) {
          const cards = GameObject.activePlayersList[0].gameCards.getCards(cardType);
          cards.forEach((card, cardIndex) => {
            // touchCard(cards, cardIndex);
            if(card.isOwned) {
              GameObject.activePlayersList.forEach((player, playerIndex) => {
                if(playerIndex != 0) {
                  const playerCards = player.gameCards.getCards(cardType);
                  // touchCard(playerCards, cardIndex);
                  playerCards[cardIndex].setKnownNotOwned();
                }
              });
            } else {
              card.setKnownNotOwned();
            }
          });
        }

        GameObject.gameState = this.GameStates.PlayerIsGuessing;
      break;
      case  this.GameStates.PlayerIsGuessing:
        GameObject.gameState = this.GameStates.ChoosePlayerWhoShowedCard;
        if(GameObject.turnIndex !== 0) {
          for(const cardType of enumValues(CardType)) {
            const cards = GameObject.activePlayersList[GameObject.turnIndex].gameCards.getCards(cardType);
            const cardIndex = GameObject.currentGuess.getIndexForType(cardType);
            // touchCard(cards, cardIndex);
            const card = cards[cardIndex];
            if(!card.isKnown) {
              card.setUserGuessed();
            }
          }
        }
      break;
      case  this.GameStates.ChoosePlayerWhoShowedCard:
        const playerIndex = GameObject.currentPlayerIndexShowingCard;
        this.fillGuessThroughPlayers(GameObject.turnIndex, (playerIndex - 1).mod(GameObject.activePlayersList.length))
        
        const player = GameObject.activePlayersList[playerIndex];
        if(GameObject.turnIndex === 0) {
          const cardType = GameObject.currentCardShownToYou.cardType;
          const cards = player.gameCards.getCards(cardType);
          const cardIndex = GameObject.currentCardShownToYou.cardIndex;
          // touchCard(cards, cardIndex);
          this.setCardOwned(cardType, cardIndex, playerIndex);
          this.setKnownForAllPlayers(cardType, cardIndex);
        } else if(playerIndex !== 0) {
          const newTrackerNumber = player.nextGuessTrackerNumber;
          const guessedCards = GameObject.currentGuess.getGuessedCards(player);
          if(guessedCards.every(card => !card.isOwned)) {
            guessedCards.forEach(card => {
              if(!card.isKnown) {
                card.toggleGuessTracker(newTrackerNumber);
              }
            });
          }
        }
        
        this.reconcileCards();
        this.incrementTurnIndex();
        GameObject.gameState = this.GameStates.PlayerIsGuessing;
      break;
    }
    GameObjectHistory.saveGameObjectState();
  }

  reconcileCards() {
    // const correctSuspectIndex = GameObject.getCorrectCardIndex(CardType.Suspects);
    // const correctWeaponIndex =  GameObject.getCorrectCardIndex(CardType.Weapons);
    // const correctRoomIndex =  GameObject.getCorrectCardIndex(CardType.Rooms);

    let needsRepeat = false;

    // any guess tracking advanced checking for known card count
    for(let playerIndex = 1; playerIndex < GameObject.activePlayersList.length; playerIndex++) {
      if(GameObject.activePlayersList[playerIndex].listOfGuesses.filter(() => true).length > 0) {
        this.reconcileGuessTracker(playerIndex);
      }
    }
    // only one player missing a card that is already known
    enumValues(CardType).forEach(cardType => {
      const correctIndex = GameObject.getCorrectCardIndex(cardType);
      if(correctIndex >= 0) {
        const themeCards = GameObject.getThemeCards(cardType);
        for(let cardIndex = 0; cardIndex < themeCards.length; cardIndex++) {
          let lastUnknownPlayerIndex = -1;
          for(let playerIndex = 0; playerIndex < GameObject.activePlayersList.length; playerIndex++) {
            const cards = GameObject.activePlayersList[playerIndex].gameCards.getCards(cardType);
            // touchCard(cards, cardIndex);
            if(cards[cardIndex].isOwned) {
              lastUnknownPlayerIndex = -1;
              break;
            }
            if(!cards[cardIndex].isKnown) {
              if(lastUnknownPlayerIndex >= 0) {
                lastUnknownPlayerIndex = -1;
                break;
              }
              lastUnknownPlayerIndex = playerIndex;
            }
          }
          if(lastUnknownPlayerIndex >= 0) {
            const cards = GameObject.activePlayersList[lastUnknownPlayerIndex].gameCards.getCards(cardType);
            // touchCard(cards, cardIndex);
            this.setCardOwned(cardType, cardIndex, lastUnknownPlayerIndex);
            needsRepeat = true;
          }
        }
      } else {
        // when all but one card for a type is known
        const themeCards = GameObject.getThemeCards(cardType);
        let lastUnknownCardIndex = -1;
        for(let cardIndex = 0; cardIndex < themeCards.length; cardIndex++) {
          let cardIsOwned = false;
          for(let playerIndex = 0; playerIndex < GameObject.activePlayersList.length; playerIndex++) {
            const cards = GameObject.activePlayersList[playerIndex].gameCards.getCards(cardType);
            // touchCard(cards, cardIndex);
            if(cards[cardIndex].isOwned) {
              cardIsOwned = true;
              break;
            }
          }
          if(!cardIsOwned) {
            if(lastUnknownCardIndex >= 0) {
              lastUnknownCardIndex = -1;
              break;
            }
            lastUnknownCardIndex = cardIndex;
          }
        }
        if(lastUnknownCardIndex >= 0) {
          this.setKnownForAllPlayers(cardType, lastUnknownCardIndex);
          needsRepeat = true;
        }
      }
    });
    // any guess tracking leaving only one choice
    for(let playerIndex = 1; playerIndex < GameObject.activePlayersList.length; playerIndex++) {
      const player = GameObject.activePlayersList[playerIndex];

      enumValues(CardType).forEach(cardType => {
        const cards = player.gameCards.getCards(cardType);
        cards.forEach((card, cardIndex) => {
          if(card.guessTracker.length > 0) {
            card.guessTracker.some(n => {
              let foundCards = [];
              enumValues(CardType).forEach(searchCardType => {
                if(cardType !== searchCardType) {
                  const searchCards = player.gameCards.getCards(searchCardType);
                  const foundCard = searchCards.find(v => v !== undefined && v.guessTracker.includes(n))
                  if(foundCard !== undefined) {
                    foundCards.push(foundCard);
                  }
                }
              });
              if(foundCards.length == 0) {
                this.setCardOwned(cardType, cardIndex, playerIndex);
                needsRepeat = true;
                return true;
              }
            });
          }
        });
      });
    }
    // known cards only leave hand size left
    for(let playerIndex = 1; playerIndex < GameObject.activePlayersList.length; playerIndex++) {
      const player = GameObject.activePlayersList[playerIndex];
      const ownedCardCount = player.ownedCardCount;
      if(ownedCardCount < player.handSize) {
        if(GameObject.maxCardCount - player.knownNotOwnedCardCount === player.handSize) {
          enumValues(CardType).forEach(cardType => {
            const themeCards = GameObject.getThemeCards(cardType);
            for(let cardIndex = 0; cardIndex < themeCards.length; cardIndex++) {
              const cards = player.gameCards.getCards(cardType);
              // touchCard(cards, cardIndex);
              if(!cards[cardIndex].isOwned && !cards[cardIndex].isKnown) {
                this.setCardOwned(cardType, cardIndex, playerIndex);
                needsRepeat = true;
              }
            }
          });
        }
      } else if(GameObject.maxCardCount !== player.knownCardCount) {
        // all players owned cards are known the rest can be set to known
        enumValues(CardType).forEach(cardType => {
          const themeCards = GameObject.getThemeCards(cardType);
          for(let cardIndex = 0; cardIndex < themeCards.length; cardIndex++) {
            const cards = player.gameCards.getCards(cardType);
            // touchCard(cards, cardIndex);
            if(!cards[cardIndex].isKnown) {
              cards[cardIndex].setKnownNotOwned();
              needsRepeat = true;
            }
          }
        });
      }
    }
    // repeat until no new cards are determined
    if(needsRepeat) {
      this.reconcileCards();
    }
  }

  reconcileGuessTrackerRecursiveSearch(depth: number, index1: number, mergedGuesses: Guess, player: SuspectInfo, seenCorrectNumbers: boolean) {
    depth++;
    player.listOfGuesses.forEach((guess2: Card[], index2) => {
      if (index1 >= index2) return; // only search forward in the array

      const intersection1X2 = mergedGuesses.filter(mergedGuessCard => guess2.some(guessCard => mergedGuessCard.isEqual(guessCard)));
      if (intersection1X2.length > 0) return; // the sets overlapped, skip to next index
      
      let merged1_2 = [...mergedGuesses]; // merge the sets to for further tests, guesses must not overlap the merged Set
      guess2.forEach(guessCard => {
        if(!merged1_2.some(merged1_2Card => merged1_2Card.isEqual(guessCard))) {
          merged1_2.push(guessCard);
        }
      });

      const mergedSeenCorrectNumbers = seenCorrectNumbers || guess2.some(guessCard => guessCard.isOwned); // merge seen correct numbers

      let maxDepth = player.handSize;

      if (!mergedSeenCorrectNumbers) { // if no guess looked at in this recursion loop has contained a known correct number we do not have to go as deep
        maxDepth -= player.ownedCardCount; // we can subtrackt the number of known correct numbers from the depth required to reach to start excluding numbers
      }

      if (depth + 1 >= maxDepth) {
        // if we have hit the appropriate depth go through every possible number and set the known column value for the corresponding number to false if it is not in the merged set of numbers
        player.gameCards.allCards.filter(card => !merged1_2.some(merged1_2Card => merged1_2Card.isEqual(card))).forEach(card => {
          // knownColumns array stores true, false, or undefined at the index locations of the corresponding possible value minus 1.
          // AKA if we know number 4 is impossible then set knownColumns[3] = false;
          card.setKnownNotOwned();
        });
      } else {
        this.reconcileGuessTrackerRecursiveSearch(depth, index2, merged1_2, player, mergedSeenCorrectNumbers);
      }
    });
  }

  reconcileGuessTracker(playerIndex: number) {
    const player: SuspectInfo = GameObject.activePlayersList[playerIndex];

    // loop through all the guesses to search for any 2 other guesses who do not share any number between them
    player.listOfGuesses.forEach((guess1, index1) => {
      const seenCorrectNumbers = guess1.some(card => card.isOwned); // keep track if any guess overlaps with a known column
      this.reconcileGuessTrackerRecursiveSearch(0, index1, guess1, player, seenCorrectNumbers);
    });

    // loop through the guesses again to see if the new set of impossible numbers allows you to know one of the correct numbers and remove guesses that are not possible
    let repeatNotPossibleCheck: boolean;
    do {
      repeatNotPossibleCheck = false;
      const originalGuessCount = player.listOfGuesses.filter(() => true).length;
      player.listOfGuesses.forEach((guess, index) => {
        guess.filter(filterIsKnown).forEach(guessCard => {
          guessCard.toggleGuessTracker(index); // remove guesses who have any remaining numbers as correct numbers         
          repeatNotPossibleCheck = true;
        });
        guess = guess.filter(filterIsUnknown); // remove guessed numbers that are known to be impossible
        if (guess.length === 0) {
          repeatNotPossibleCheck = true;
          return;
        } else if (guess.length === 1) {
          // there is only 1 remaining number in this guess that is possible. Therefore it must be one of the correct numbers

          // knownColumns array stores true, false, or undefined at the index locations of the corresponding possible value minus 1.
          // AKA if we know number 4 is correct then set knownColumns[3] = true;
          this.setCardOwned(guess[0].cardType, guess[0].index, player);
          repeatNotPossibleCheck = true;
          return;
        }
      });

      if (player.ownedCardCount == player.handSize - 1) {
        // since there is only one remaining number to find and we know each guess must contain a correct number...
        // we can loop through every guess that doesnt include a known correct number and get the numbers that all these guesses have in common
        // we know these common numbers must contain the correct number so we can set the rest of the numbers to be known as impossible
        player.gameCards.allCards.filter(card => {
          return !card.isKnown && // we only care about unknown columns
            !player.listOfGuesses.filter(guess => {
              return !guess.some(guessCard => guessCard.isOwned); // only check guesses with no known correct numbers
            }).every(guess => guess.some(guessCard => guessCard.isEqual(card))) // make sure the current number is indluded in every guess
        }).forEach(card => {
          repeatNotPossibleCheck = true; // repeat check since value is chaning
          card.setKnownNotOwned(); // set the column to known and impossible
        });
      }

      // remove duplicate guesses after having removed known false guesses
      player.listOfGuesses.forEach((guess1, index1) => {
        player.listOfGuesses.forEach((guess2, index2) => {
          if(index1 >= index2) return;
          if(guess1.length == guess2.length && guess1.every(guess1Card => guess2.some(guess2Card => guess2Card.isEqual(guess1Card)))) {
            guess2.forEach(guess2Card => guess2Card.toggleGuessTracker(index2));
          }
        });
      });

      // if the unique list of guesses is a different length than the original list of guesses recheck the list for more possible guesses to rule out
      repeatNotPossibleCheck ||= originalGuessCount != player.listOfGuesses.filter(() => true).length;
    } while (repeatNotPossibleCheck);
  }

  setCardOwned(cardType: CardType, cardIndex: number, player: SuspectInfo): void;
  setCardOwned(cardType: CardType, cardIndex: number, playerIndex: number): void;
  setCardOwned(cardType: CardType, cardIndex: number, playerIn: number|SuspectInfo) {
    const player: SuspectInfo = typeof playerIn === 'number' ? GameObject.activePlayersList[playerIn] : playerIn;
    const card: Card = player.gameCards.getCards(cardType)[cardIndex];
    // set card to owned
    card.setOwned();

    // clear guess tracking for cards who have that marker
    if(card.guessTracker.length > 0) {
      card.guessTracker.forEach(n => 
        player.gameCards.allCards.filter(card =>
          card.guessTracker.includes(n)).forEach(card =>
            card.toggleGuessTracker(n)));
    }

    // set reset of players card to known
    this.setKnownForAllPlayers(cardType, cardIndex);
  }

  undoClick() {
    GameObjectHistory.undoGameObjectState();
  }

  get lastAction(): string {
    switch(GameObjectHistory.lastGameState) {
      case GameStates.NotStarted: return "Start";
      case GameStates.ChooseYourCards: return "Card Select";
      case GameStates.PlayerIsGuessing: return "Player Guess";
      case GameStates.ChoosePlayerWhoShowedCard: return "Card Shown";
    }
  }
}