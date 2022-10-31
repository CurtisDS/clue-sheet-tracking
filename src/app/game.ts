import { FormControl } from '@angular/forms';
import { ClueThemes, getTheme, Suspect, Theme } from './clue';

export enum GameStates {
  NotStarted,
  ChooseYourCards,
  PlayerIsGuessing,
  ChoosePlayerWhoShowedCard
}

export enum CardType {
  Rooms,
  Weapons,
  Suspects
};

export function enumKeys<O extends object, K extends keyof O = keyof O>(obj: O): K[] {
  return Object.keys(obj).filter(k => Number.isNaN(+k)) as K[];
}

export function enumValues<O extends object>(obj: O): number[] {
  return Object.values(obj).filter(k => typeof k === 'number');
}

export class CurrentGuess {
  suspectIndex: number|undefined = undefined;
  weaponIndex: number|undefined = undefined;
  roomIndex: number|undefined = undefined;

  get isSet(): boolean {
    return this.suspectIndex !== undefined && this.weaponIndex !== undefined && this.roomIndex !== undefined;
  }

  get hasSuspect(): boolean {
    return this.suspectIndex !== undefined;
  }
  
  get hasWeapon(): boolean {
    return this.weaponIndex !== undefined;
  }

  get hasRoom(): boolean {
    return this.roomIndex !== undefined;
  }

  getGuessedCards(player: SuspectInfo) {
    return [
      player.gameCards.suspects[this.suspectIndex],
      player.gameCards.weapons[this.weaponIndex],
      player.gameCards.rooms[this.roomIndex]
    ];
  }

  getIndexForType(cardType: CardType): number|undefined {
    switch(cardType) {
      case CardType.Suspects:
        return this.suspectIndex;
      case CardType.Weapons:
        return this.weaponIndex;
      case CardType.Rooms:
        return this.roomIndex;
    }
  }

  setIndexForType(cardType: CardType, newIndex: number) {
    switch(cardType) {
      case CardType.Suspects:
        this.suspectIndex = newIndex;
      break;
      case CardType.Weapons:
        this.weaponIndex = newIndex;
      break;
      case CardType.Rooms:
        this.roomIndex = newIndex;
      break;
    }
  }

  clone(): CurrentGuess {
    return Object.assign(new CurrentGuess(), this);
  }
}

export class CurrentCardShown {
  private _cardIndex: number|undefined = undefined;
  get cardIndex(): number|undefined {
    return this._cardIndex;
  }

  private _cardType: CardType|undefined = undefined;
  get cardType(): number|undefined {
    return this._cardType;
  }

  get isSet(): boolean {
    return this.cardIndex !== undefined && this.cardType !== undefined;
  }

  set(cardType: CardType, cardIndex: number) {
    this._cardIndex = cardIndex;
    this._cardType = cardType;
  }

  matches(cardType: CardType, cardIndex: number): boolean {
    return this.cardType === cardType && this.cardIndex === cardIndex;
  }

  clone(): CurrentCardShown {
    return Object.assign(new CurrentCardShown(), this);
  }
}

export class Card {
  private _isKnown: boolean = false;
  get isKnown(): boolean { 
    return this._isKnown;
  };

  private _isOwned: boolean = false;
  get isOwned(): boolean { 
    return this._isOwned;
  };

  private _userGuessed: boolean = false;
  get userGuessed(): boolean { 
    return this._userGuessed;
  };

  constructor(public readonly cardType: CardType, public readonly index: number) {}

  guessTracker: number[] = [];

  get maxGuess(): number {
    return this.guessTracker.length > 0 ? Math.max(...this.guessTracker) : 0;
  }  
  
  isEqual(card: Card) {
    return this.cardType == card.cardType && this.index == card.index;
  }

  /** set known to true if not already owned */
  setKnownNotOwned() {
    if(!this._isOwned) {
      this._isKnown = true;
      this.guessTracker = [];
    }
  }

  toggleOwned() {
    this._isOwned = !this.isOwned;
    this._isKnown = this.isOwned;
  }

  setOwned() {
    this._isOwned = true;
    this._isKnown = true;
  }

  setUserGuessed() {
    this._userGuessed = true;
  }

  toggleGuessTracker(n: number) {
    if(this.guessTracker.includes(n)) {
      this.guessTracker.splice(this.guessTracker.indexOf(n),1);
    } else {
      this.guessTracker.push(n);
    }
    this.guessTracker.sort();
  }

  clone(): Card {
    const card = new Card(this.cardType, this.index);
    card._isKnown = this._isKnown;
    card._isOwned = this._isOwned;
    card._userGuessed = this._userGuessed;
    this.guessTracker.forEach(n => {
      card.guessTracker.push(n);
    });
    return card;
  }
}

export class CardCollection  {
  /* an array matching the index values from the suspect list. */
  suspects: Card[] = [];
  /* an array matching the index values from the weapon list. */
  weapons: Card[] = [];
  /* an array matching the index values from the room list. */
  rooms: Card[] = [];

  get allCards(): Card[] {
    return [...this.suspects, ...this.weapons, ...this.rooms];
  }

  getCards(type: CardType) {
    switch(type) {
      case CardType.Suspects: return this.suspects;
      case CardType.Weapons: return this.weapons;
      case CardType.Rooms: return this.rooms;
    }
  }

  clone(): CardCollection {
    const clone = new CardCollection();
    enumValues(CardType).forEach(cardType => {
      this.getCards(cardType).forEach(card => {
          clone.getCards(cardType).push(card.clone());
      });
    });
    return clone;
  }
}

/** A Guess is an array of up to three cards */
export type Guess = Card[];

export function filterIsKnown(card: Card): boolean {
  return card !== undefined && card.isKnown;
}

export function filterIsOwned(card: Card): boolean {
  return card !== undefined && card.isOwned;
}

export function filterIsUnknown(card: Card): boolean {
  return card !== undefined && !card.isKnown;
}

export function filterNotOwned(card: Card): boolean {
  return card !== undefined && !card.isOwned;
}

export function filterIsKnownNotOwned(card: Card): boolean {
  return card !== undefined && card.isKnown && !card.isOwned;
}

export function filterUnknownOrOwned(card: Card): boolean {
  return card !== undefined && (!card.isKnown || card.isOwned);
}

export function filterHasGuess(card: Card): boolean {
  return card !== undefined && card.guessTracker.length > 0;
}

export class SuspectInfo {
  id: number;
  isPlayerControl: FormControl;
  selectedSuspectControl: FormControl;
  handSize: number;
  gameCards: CardCollection;

  /** a list of Guesses. A Guess is a set of up to three cards that share a guess tracking number */
  get listOfGuesses(): Guess[] {
    const guesses: Guess[] = [];
    for(let i = 1; i <= this.maxGuessTrackerNumber; i++) {
      const newGuess = this.gameCards.allCards.filter(card => card.guessTracker.includes(i));
      if(newGuess.length > 0) {
        guesses[i] = [...newGuess];
      }
    }
    return guesses;
  }

  get ownedCardCount(): number {
    return this.gameCards.allCards.filter(filterIsOwned).length;
  }

  get knownCardCount(): number {
    return this.gameCards.allCards.filter(filterIsKnown).length;
  }

  get knownNotOwnedCardCount(): number {
    return this.gameCards.allCards.filter(filterIsKnownNotOwned).length;
  }

  get maxGuessTrackerNumber(): number {
    const maxGuessTrackerValues: number[] = [];
    for(const cardType of enumValues(CardType)) {
      const cards = this.gameCards.getCards(cardType);
      cards.forEach((card) => {
        // touchCard(cards, cardIndex);
        maxGuessTrackerValues.push(card.maxGuess);
      });
    }
    return Math.max(...maxGuessTrackerValues);
  }

  get nextGuessTrackerNumber(): number {
    const max = this.maxGuessTrackerNumber + 1;
    for(let i = 1; i <= max; i++) {
      if(!enumValues(CardType).some(cardType =>
        this.gameCards.getCards(cardType).some(card => 
          card.guessTracker.includes(i)))) {
            return i;
      }
    }
    return 1;
  }

  constructor(id: number, isPlayerControl: FormControl, selectedSuspectControl: FormControl, handSize: number) {
    this.id = id;
    this.isPlayerControl = isPlayerControl;
    this.selectedSuspectControl = selectedSuspectControl;
    this.handSize = handSize;
    this.gameCards = new CardCollection();
  }

  clone(): SuspectInfo {
    const isPlayerControlClone =  new FormControl();
    isPlayerControlClone.setValue(this.isPlayerControl.value);
    if(this.isPlayerControl.disabled) {
      isPlayerControlClone.disable();
    }
    const selectedSuspectControlClone =  new FormControl();
    selectedSuspectControlClone.setValue(this.selectedSuspectControl.value);
    if(this.selectedSuspectControl.disabled) {
      selectedSuspectControlClone.disable();
    }
    const clone = new SuspectInfo(this.id, isPlayerControlClone, selectedSuspectControlClone, this.handSize);
    clone.gameCards = this.gameCards.clone();
    return clone;
  }
}

class GameInfo {
  showBluffTracking: FormControl = new FormControl(false);
  gameState: GameStates = GameStates.NotStarted;
  turnIndex: number = 0;
  clueThemeControl: FormControl = new FormControl(getTheme('classic'));
  suspectInfo: SuspectInfo[] = [
    new SuspectInfo(1, new FormControl({ value: true, disabled: true }), new FormControl(ClueThemes[1].suspects[0]), 6),
    new SuspectInfo(2, new FormControl({ value: true, disabled: true }), new FormControl(ClueThemes[1].suspects[1]), 6),
    new SuspectInfo(3, new FormControl({ value: true, disabled: true }), new FormControl(ClueThemes[1].suspects[2]), 6),
    new SuspectInfo(4, new FormControl(false), new FormControl(ClueThemes[1].suspects[3]), 0),
    new SuspectInfo(5, new FormControl(false), new FormControl(ClueThemes[1].suspects[4]), 0),
    new SuspectInfo(6, new FormControl(false), new FormControl(ClueThemes[1].suspects[5]), 0)
  ];
  activePlayersList: SuspectInfo[] = [this.suspectInfo[0], this.suspectInfo[1], this.suspectInfo[2]];
  firstPlayerSuspectIDControl: FormControl = new FormControl(this.suspectInfo[0].id);
  currentGuess: CurrentGuess = new CurrentGuess();
  currentPlayerIndexShowingCard: number|undefined = undefined;
  currentCardShownToYou: CurrentCardShown = new CurrentCardShown();

  get maxCardCount(): number {
    return this.suspectInfo.length + this.clueThemeControl.value.weapons.length + this.clueThemeControl.value.rooms.length;
  }

  constructor(cloneSource?: GameInfo) {
    this.restoreFrom(cloneSource);
    this.initCards();
  }

  restoreFrom(source: GameInfo) {
    if(source !== undefined && source !== null) {
      this.gameState = source.gameState;
      this.turnIndex = source.turnIndex
      this.clueThemeControl.setValue(source.clueThemeControl.value);
      this.suspectInfo.forEach((suspect, index) => {
        this.suspectInfo[index] = source.suspectInfo[index].clone();
      });
      this.activePlayersList = [];
      source.activePlayersList.forEach(player => {
        this.activePlayersList.push(this.getSuspectInfoFromSuspectID(player.id));
      });
      this.firstPlayerSuspectIDControl.setValue(source.firstPlayerSuspectIDControl.value);
      this.currentGuess = source.currentGuess.clone();
      this.currentPlayerIndexShowingCard = source.currentPlayerIndexShowingCard;
      this.currentCardShownToYou = source.currentCardShownToYou.clone();
    }
  }

  getSuspectInfoFromSuspectID(suspectID: number): SuspectInfo {
    return this.suspectInfo.find(v => v.id == suspectID);
  }

  getSuspectInfoIndexFromSuspectID(suspectID: number): number {
    return this.suspectInfo.findIndex(v => v.id == suspectID);
  }

  getActivePlayerIndexFromSuspectID(suspectID: number): number {
    return this.activePlayersList.findIndex(v => v.id == suspectID);
  }

  getThemeCards(cardType: CardType): Suspect[]|string[] {
    const theme: Theme = this.clueThemeControl.value;
    switch(cardType) {
      case CardType.Suspects: return theme.suspects;
      case CardType.Weapons: return theme.weapons;
      case CardType.Rooms: return theme.rooms;
    }
  }

  getCorrectCardIndex(cardType: CardType): number {
    const themeCards = this.getThemeCards(cardType);
    return themeCards.findIndex(({}, index: number) => {
      return this.activePlayersList.every(player => {
        const cards = player.gameCards.getCards(cardType);
        // touchCard(cards, index);
        return !cards[index].isOwned && cards[index].isKnown;
      });
    });
  }

  restartGame() {
    this.suspectInfo.forEach(player => {
      player.gameCards.suspects = [];
      player.gameCards.weapons = [];
      player.gameCards.rooms = [];
    });
    this.initCards();
    this.gameState = GameStates.NotStarted;
    this.turnIndex = 0;
    this.currentGuess = new CurrentGuess();
    this.currentPlayerIndexShowingCard = undefined;
    this.currentCardShownToYou = new CurrentCardShown();
    gameObjectStates = [];
  }

  initCards() {
    this.suspectInfo.forEach(player => {
      this.suspectInfo.forEach(({}, i) => {
        touchCard(player.gameCards.suspects, CardType.Suspects, i);
      });
      player.gameCards.suspects.length = this.suspectInfo.length;

      let theme: Theme = this.clueThemeControl.value;
      theme.weapons.forEach(({}, i) => {
        touchCard(player.gameCards.weapons, CardType.Weapons, i);
      });
      player.gameCards.weapons.length = theme.weapons.length;

      theme.rooms.forEach(({}, i) => {
        touchCard(player.gameCards.rooms, CardType.Rooms, i);
      });
      player.gameCards.rooms.length = theme.rooms.length;
    });
  }
}
export const GameObject = new GameInfo();

function touchCard(cards: Card[], cardType: CardType, index: number) {
  if(cards[index] === undefined || cards[index] === null) {
    cards[index] = new Card(cardType, index);
  }
}

export class GameObjectHistory {
  static get canUndo(): boolean {
    return gameObjectStates.length > 0
  }

  static get lastGameState(): GameStates {
    return gameObjectStates.length > 1 ? gameObjectStates[gameObjectStates.length - 2].gameState : GameStates.NotStarted;
  }

  static saveGameObjectState() {
    gameObjectStates.push(new GameInfo(GameObject));
  }

  static undoGameObjectState() {
    if(gameObjectStates.length > 0) {
      gameObjectStates.pop();
      GameObject.restoreFrom(gameObjectStates.length > 0 ? gameObjectStates[gameObjectStates.length - 1] : new GameInfo());
    }
  }
}

let gameObjectStates: GameInfo[] = [];