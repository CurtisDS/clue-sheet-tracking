import { Component, OnInit } from '@angular/core';
import { Theme } from '../clue';
import { SuspectInfo, GameObject, GameStates, Card, CardType, enumValues } from '../game';
import { Icons } from '../mat-icons';

const CardStateClasses = {
  Unknown: 'unknown',
  Strike: 'strike',
  Correct: 'correct',
  BlockSelect: 'block-select',
  Highlighted: 'highlighted',
  SelectCardShown: 'select-card-shown',
  HighlightCardShown: 'highlight-card-shown',
  ActivePlayer: 'active-player',
  SelfOwnedCard: 'self-owned-card',
  Green: 'green',
  Red: 'red'
};

@Component({
  selector: 'app-clue-sheet',
  templateUrl: './clue-sheet.component.html',
  styleUrls: ['./clue-sheet.component.scss']
})
export class ClueSheetComponent implements OnInit {
  constructor() {}

  readonly GameStates = GameStates;
  readonly CardType = CardType;
  readonly playerColumns = [1, 2, 3, 4, 5];

  get gameState(): GameStates {
    return GameObject.gameState;
  }
  
  get turnIndex() {
    return GameObject.turnIndex;
  }

  get theme(): Theme {
    return GameObject.clueThemeControl.value;
  }
  
  get suspects(): SuspectInfo[] {
    return GameObject.suspectInfo;
  }
  
  get players(): SuspectInfo[] {
    return GameObject.activePlayersList;
  }

  ngOnInit() {
  }

  getCellIcon(cardType: CardType, cardIndex: number, playerIndex: number): string {
    const cards = this.players[playerIndex]?.gameCards.getCards(cardType);
    let player0OwnesCard = false;
    if(playerIndex !== 0) {
      player0OwnesCard = this.players[0].gameCards.getCards(cardType)[cardIndex]?.isOwned;
    }
    if(!cards) return '';
    // touchCard(cards, cardIndex);
    const card = cards[cardIndex];
    let icon = card.isOwned ? Icons.Check_Mark : card.isKnown ? (player0OwnesCard ? Icons.Dash_Mark : Icons.X_Mark) : card.userGuessed && GameObject.showBluffTracking.value ? Icons.Question_Mark : undefined;

    return icon ? icon.id : '';
  }

  getCellTracking(cardType: CardType, cardIndex: number, playerIndex: number): string {
    if(!this.players[playerIndex]) return '';
    const cards = this.players[playerIndex].gameCards.getCards(cardType);
    // touchCard(cards, cardIndex);
    return cards[cardIndex].guessTracker.join(' ');
  }

  getPlayerName(suspectInfo: SuspectInfo): string {
    if(!suspectInfo) return '';
    return suspectInfo.selectedSuspectControl.value.name + (this.players[0] === suspectInfo ? ' (You)' : '');
  }

  getStateClass(): string {
    return GameStates[this.gameState];
  }

  getCellIconClass(cardType: CardType, cardIndex: number, playerIndex: number): string {
    const iconID = this.getCellIcon(cardType, cardIndex, playerIndex);
    return !this.players[playerIndex] || !iconID || iconID.includes('question') ? '' : iconID.includes('check') ? CardStateClasses.Green : CardStateClasses.Red;
  }

  getCellClasses(cardType: CardType, cardIndex: number, playerIndex: number): string {
    return GameObject.currentGuess.getIndexForType(cardType) == cardIndex ||
          (GameObject.currentPlayerIndexShowingCard == playerIndex && playerIndex != 0) ?
          CardStateClasses.Highlighted : '';
  }

  getPlayerClasses(playerIndex: number): string {
    const classes = [];
    if(playerIndex === GameObject.turnIndex) {
      classes.push(CardStateClasses.ActivePlayer);
    }
    if(GameObject.gameState === GameStates.ChoosePlayerWhoShowedCard) {
      let blockPlayer = false;
      if(playerIndex === 0) {
        blockPlayer = !enumValues(CardType).some(cardType => {
          const cards = GameObject.activePlayersList[0].gameCards.getCards(cardType);
          const cardIndex = GameObject.currentGuess.getIndexForType(cardType);
          // touchCard(cards, cardIndex);
          return cards[cardIndex].isOwned;
        });
      }
      if(playerIndex === GameObject.turnIndex || blockPlayer || !this.players[playerIndex]) {
        classes.push(CardStateClasses.BlockSelect);
      }
    }
    if (playerIndex !== GameObject.turnIndex && GameObject.currentPlayerIndexShowingCard == playerIndex) {
      classes.push(CardStateClasses.Highlighted);
    }

    return classes.join(' ');
  }

  getCardClass(cardType: CardType, index: number): string {
    let classes = [CardStateClasses.Correct];
    this.players.some(player => {
      const cards = player.gameCards.getCards(cardType);
      // touchCard(cards,index);
      if(cards[index].isOwned) {
        classes = [CardStateClasses.Strike];
        return true;
      } else if(!cards[index].isKnown) {
        classes = [CardStateClasses.Unknown];
        return true;
      }
    });

    const cards = this.players[0].gameCards.getCards(cardType);
    // touchCard(cards,index);
    if(cards[index].isOwned) {
      classes.push(CardStateClasses.SelfOwnedCard);
    }
    
    if(this.gameState === GameStates.ChooseYourCards && this.players[0].ownedCardCount >= this.players[0].handSize && !classes.includes(CardStateClasses.Strike)) {
      classes.push(CardStateClasses.BlockSelect);
    } else if (this.gameState === GameStates.ChoosePlayerWhoShowedCard && GameObject.turnIndex === 0 && GameObject.currentGuess.getIndexForType(cardType) === index) {
      classes.push(CardStateClasses.SelectCardShown);

      const cards = this.players[0].gameCards.getCards(cardType);
      // touchCard(cards, index);
      
      if(cards[index].isOwned) {
        classes.push(CardStateClasses.BlockSelect);
      }

      if(GameObject.currentCardShownToYou.matches(cardType, index)) {
        classes.push(CardStateClasses.HighlightCardShown);
      }
    }

    classes.push(this.getCellClasses(cardType, index, 0));

    return classes.join(' ');
  }

  cardClicked(cardType: CardType, index: number) {
    switch(this.gameState) {
      case GameStates.ChooseYourCards:
        const cards = this.players[0].gameCards.getCards(cardType);
        // touchCard(cards, index);
        if((this.players[0].ownedCardCount >= this.players[0].handSize && cards[index].isOwned) ||
          (this.players[0].ownedCardCount < this.players[0].handSize)) {
          cards[index].toggleOwned();
        }
      break;
      case GameStates.PlayerIsGuessing:
        GameObject.currentGuess.setIndexForType(cardType, index);
      break;
      case GameStates.ChoosePlayerWhoShowedCard:
        if(GameObject.turnIndex === 0) {
          const cards = this.players[0].gameCards.getCards(cardType);
          // touchCard(cards, index);
          if(!cards[index].isOwned && GameObject.currentGuess.getIndexForType(cardType) === index) {
            GameObject.currentCardShownToYou.set(cardType, index);
          }
        }
      break;
    }
  }

  playerClicked(index: number) {
    switch(this.gameState) {
      case GameStates.ChoosePlayerWhoShowedCard:
        let blockPlayer = false;
        if(index === 0) {
          blockPlayer = !enumValues(CardType).some(cardType => {
            const cards = GameObject.activePlayersList[0].gameCards.getCards(cardType);
            const cardIndex = GameObject.currentGuess.getIndexForType(cardType);
            // touchCard(cards, cardIndex);
            return cards[cardIndex].isOwned;
          });
        }
        if(index !== GameObject.turnIndex && !blockPlayer && this.players[index]) {
          GameObject.currentPlayerIndexShowingCard = index;
        }
      break;
    }
  }
}
