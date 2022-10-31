import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { ClueThemes, compareThemeFn, Suspect, compareSuspectFn } from './clue';
import { GameObject, SuspectInfo } from './game';
import { DomSanitizer } from '@angular/platform-browser';
import { MatIconRegistry } from '@angular/material/icon';
import { RegisterIcons } from './mat-icons';
import { DragulaService, DragulaOptions } from 'ng2-dragula';
import { SubscriptionLike } from 'rxjs';
export const MenuState = {
  showEditBordForm: true
}
@Component({
  selector: 'clue-app',
  templateUrl: './app.component.html',
  styleUrls: [ './app.component.scss' ]
})
export class AppComponent implements OnInit, OnDestroy {
  constructor(iconRegistry: MatIconRegistry, sanitizer: DomSanitizer, private dragulaService: DragulaService) {
    RegisterIcons(iconRegistry, sanitizer);
    let options: any = {
      moves: (el, source, handle) => {
        if(handle.nodeName == "svg") {
          return handle.parentElement.className.includes('drag-handle');
        } if(handle.nodeName == "path") {
          return handle.parentElement.parentElement.className.includes('drag-handle');
        } else {
          return handle.className.includes('drag-handle');
        }
      }
    }
    dragulaService.createGroup("suspects", options);
  }

  dragSub: SubscriptionLike;

  ngOnInit() {
    this.dragSub = this.dragulaService.dropModel("suspects").subscribe(({ el, target, source, sourceModel, targetModel, item }) => {
      GameObject.suspectInfo = targetModel;
    });
  }

  ngOnDestroy() {
    if (this.dragSub) {
      this.dragSub.unsubscribe();
    }
  }

  themes = ClueThemes;
  compareSuspect = compareSuspectFn;
  compareTheme = compareThemeFn;
  
  get showEditBoardForm() {
    return MenuState.showEditBordForm;
  }
  set showEditBoardForm(val: boolean) {
    MenuState.showEditBordForm = val;
  }
  
  get bluffTracking(): FormControl {
    return GameObject.showBluffTracking;
  }

  get selectedClueTheme(): FormControl {
    return GameObject.clueThemeControl;
  }

  get suspectInfo(): SuspectInfo[] {
    return GameObject.suspectInfo;
  }

  get selectedPlayers(): SuspectInfo[] {
    return GameObject.activePlayersList;
  }

  get selectedFirstPlayer(): FormControl {
    return GameObject.firstPlayerSuspectIDControl;
  }

  shouldSuspectBeDisabled(selectedSuspect: Suspect, suspect: Suspect): boolean {
    return selectedSuspect.color == suspect.color ? false : this.suspectInfo.every(v => v.selectedSuspectControl.value.color != suspect.color) ? false : true;
  }

  recalcHandSizes() {
   this.selectedPlayers.forEach((v, i) => {
      const firstPlayerIndex = this.selectedPlayers.findIndex(v => v.id == this.selectedFirstPlayer.value);
      const offsetIndex = (i - firstPlayerIndex).mod(this.selectedPlayers.length);
      v.handSize = (Math.floor(18 / this.selectedPlayers.length) + (offsetIndex < 18 % this.selectedPlayers.length ? 1 : 0));
    });
  }

  drop(event: CdkDragDrop<string[]>) {
    moveItemInArray(this.selectedPlayers, event.previousIndex, event.currentIndex);
    this.recalcHandSizes();
  }

  isPlayerClickEvent(isPlayerControl: FormControl, id: number) {
    if(!(isPlayerControl.value && this.selectedPlayers.length == 3)) {
      isPlayerControl.setValue(!isPlayerControl.value);
      this.toggleSuspectInSheetList(id, isPlayerControl.value);
    }
  }

  toggleSuspectInSheetList(id: number, addRemove: boolean) {
    const p = GameObject.getSuspectInfoFromSuspectID(id);
    if(addRemove) {
      this.selectedPlayers.push(p);
    } else {
      this.selectedPlayers.splice(this.selectedPlayers.indexOf(p),1);
      if(this.selectedFirstPlayer.value == p.id) {
        this.selectedFirstPlayer.setValue(this.selectedPlayers[0].id);
      }
    }

    this.suspectInfo.forEach(v => {
      if(this.selectedPlayers.length == 3 && v.isPlayerControl.value)
        v.isPlayerControl.disable();
      else
        v.isPlayerControl.enable();
    });

    this.recalcHandSizes();
  }

  restartGame() {
    GameObject.restartGame();
  }

  initThemeCards() {
    GameObject.initCards();
  }
}
