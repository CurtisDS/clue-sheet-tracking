import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatNativeDateModule } from '@angular/material/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppComponent } from './app.component';
import { MaterialModule } from './material-module';
import { ClueSheetComponent } from './clue-sheet/clue-sheet.component';
import { PlayerIconComponent } from './player-icon/player-icon.component';
import { DragulaModule } from 'ng2-dragula';

import './prototypes';
import { GameConsoleComponent } from './game-console/game-console.component';

@NgModule({
  imports:      [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    HttpClientModule,
    MaterialModule,
    MatNativeDateModule,
    ReactiveFormsModule,    
    DragulaModule.forRoot()
  ],
  declarations: [ 
    AppComponent,
    ClueSheetComponent, 
    PlayerIconComponent, GameConsoleComponent 
  ],
  bootstrap:    [ AppComponent ]
})
export class AppModule { }
