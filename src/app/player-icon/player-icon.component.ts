import { Component, OnInit, Input } from '@angular/core';
import { SuspectInfo } from '../game';

@Component({
  selector: 'app-player-icon',
  templateUrl: './player-icon.component.html',
  styleUrls: ['./player-icon.component.scss']
})
export class PlayerIconComponent implements OnInit {

  private _playerInfo: SuspectInfo;
  get playerInfo(): SuspectInfo {
    return this._playerInfo;
  }

  @Input("info")
  set playerInfo(val: SuspectInfo) {
    this._playerInfo = val;
  }

  private _isActivePlayer: boolean = false;
  get isActivePlayer(): boolean {
    return this._isActivePlayer;
  }

  @Input("active-player")
  set isActivePlayer(val: boolean) {
    this._isActivePlayer = val;
  }

  constructor() { }

  ngOnInit() {
  }

  getPlayerColor(): string {
    return this.playerInfo?.selectedSuspectControl.value.color.value;
  }

  getPlayerVisible(): string {
    return this.playerInfo ? 'visible' : 'hidden';
  }

  getCardVisible(cardIndex: number): string {
    return this.isCardIndexVisible(cardIndex) ? 'visible' : 'hidden';
  }

  getCardIndexBGColor(cardIndex: number): string {
    return this.isCardIndexKnown(cardIndex) ? this.getPlayerColor() : 'white';
  }

  isCardIndexVisible(cardIndex: number): boolean {
    return this.playerInfo?.handSize > cardIndex;
  }

  isCardIndexKnown(cardIndex: number): boolean {
    return this.playerInfo?.ownedCardCount > cardIndex;
  }

  getCardIndexIcon(cardIndex: number): string {
    return this.isCardIndexKnown(cardIndex) ? 'circle' : 'radio_button_unchecked';
  }

}