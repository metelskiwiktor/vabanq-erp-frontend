import { Component } from '@angular/core';
import {MatSidenavContainer, MatSidenavContent, MatSidenavModule} from "@angular/material/sidenav";
import {Router, RouterOutlet} from "@angular/router";
import {MatIcon, MatIconModule} from "@angular/material/icon";
import {MatList, MatListItem, MatListModule, MatNavList} from "@angular/material/list";
import {BrowserModule} from "@angular/platform-browser";
import {BrowserAnimationsModule} from "@angular/platform-browser/animations";
import {HttpClientModule} from "@angular/common/http";
import {AppRoutingModule} from "../app-routing.module";
import {MatButtonModule} from "@angular/material/button";
import {MatMenuModule} from "@angular/material/menu";
import {VERSION} from "@angular/cdk";

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrl: './menu.component.css'
})
export class MenuComponent {
  // name = 'Angular ' + VERSION.major;
  // constructor() {}
  // ngOnInit() {
  //   let sidebar = document.querySelector('.sidebar');
  //   let closeBtn = document.querySelector('#btn');
  //   let searchBtn = document.querySelector('.bx-search');
  //   const navList = document.querySelector('.nav-list');
  //
  //   // @ts-ignore
  //   navList.addEventListener('click', (event) => {
  //     const clickedItem = event.target;
  //     // @ts-ignore
  //     if (clickedItem.tagName === 'LI') {
  //       // @ts-ignore
  //       const hasSubmenu = clickedItem.querySelector('.submenu');
  //       if (hasSubmenu) {
  //         // @ts-ignore
  //         clickedItem.classList.toggle('active');
  //       }
  //     }
  //   });
  //
  //   // @ts-ignore
  //   closeBtn.addEventListener('click', () => {
  //     // @ts-ignore
  //     sidebar.classList.toggle('open');
  //     menuBtnChange(); //calling the function(optional)
  //   });
  //
  //   // @ts-ignore
  //   searchBtn.addEventListener('click', () => {
  //     // Sidebar open when you click on the search iocn
  //     // @ts-ignore
  //     sidebar.classList.toggle('open');
  //     menuBtnChange(); //calling the function(optional)
  //   });
  //
  //   // following are the code to change sidebar button(optional)
  //   function menuBtnChange() {
  //     // @ts-ignore
  //     if (sidebar.classList.contains('open')) {
  //       // @ts-ignore
  //       closeBtn.classList.replace('bx-menu', 'bx-menu-alt-right'); //replacing the iocns class
  //     } else {
  //       // @ts-ignore
  //       closeBtn.classList.replace('bx-menu-alt-right', 'bx-menu'); //replacing the iocns class
  //     }
  //   }
  // }
}
