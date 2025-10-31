import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-avatar-picker',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="picker">
      <button *ngFor="let a of avatars" type="button" class="item" (click)="pick.emit(a)">
        <img [src]="a" [alt]="a" />
      </button>
    </div>
  `,
  styles: [
    `
      .picker {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(70px, 1fr));
        gap: 14px;
        padding: 12px;
      }
      .item {
        border: none;
        background: transparent;
        padding: 0;
        cursor: pointer;
      }
      img {
        width: 70px;
        height: 70px;
        border-radius: 50%;
        object-fit: cover;
        border: 3px solid #fff;
        box-shadow: 0 6px 14px rgba(0, 0, 0, 0.1);
        transition: transform 0.15s ease, box-shadow 0.15s ease;
      }
      .item:hover img {
        transform: translateY(-3px);
        box-shadow: 0 8px 20px rgba(100, 168, 89, 0.3);
      }
    `,
  ],
})
export default class AvatarPickerComponent {
  @Output() pick = new EventEmitter<string>();

  avatars = [
    'assets/illustrations/Avatar1.png',
    'assets/illustrations/Avatar2.png',
    'assets/illustrations/Avatar3.png',
    'assets/illustrations/Avatar4.png',
    'assets/illustrations/Avatar5.png',
    'assets/illustrations/Avatar6.png',
    'assets/illustrations/Happy Bunch - Avatar.png',
  ];
}
